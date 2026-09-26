import crypto from 'crypto'
import type { CollectionSlug, Endpoint } from 'payload'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

// Same reason as codAdapter.ts: the plugin types collection slugs as plain `string`, so Payload's
// generated per-collection types can't be resolved from them.
const asSlug = (slug: string) => slug as CollectionSlug

const serverUrl = () => (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

// Read lazily (inside handlers, not at config-build time) so a missing key never stops the app
// from booting — it only fails the PayU flow itself, with a clear message.
function getPayuConfig() {
  const mode = process.env.PAYU_MODE === 'live' ? 'live' : 'test'
  const prefix = mode === 'live' ? 'PAYU_LIVE' : 'PAYU_TEST'
  const key = process.env[`${prefix}_MERCHANT_KEY`]
  const salt = process.env[`${prefix}_MERCHANT_SALT`]
  if (!key || !salt) {
    throw new Error(`PayU ${mode}-mode credentials are not configured on the server.`)
  }
  return {
    key,
    mode,
    paymentUrl: mode === 'live' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment',
    salt,
  }
}

const sha512 = (value: string) => crypto.createHash('sha512').update(value).digest('hex')

// PayU rejects some special characters in these free-text fields.
const sanitize = (value: unknown, fallback: string) => {
  const cleaned = String(value ?? '').replace(/[^a-zA-Z0-9 ]/g, '').trim()
  return cleaned || fallback
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a.toLowerCase())
  const bufB = Buffer.from(b.toLowerCase())
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)
}

const redirectTo = (path: string) => Response.redirect(`${serverUrl()}${path}`, 303)

/**
 * PayU hosted checkout (UPI / cards / netbanking). Flow:
 *  1. `initiatePayment` records a pending transaction and returns the signed form fields; the
 *     checkout page auto-submits them to PayU's hosted payment page.
 *  2. PayU sends the customer's browser back to POST /api/payments/payu/callback with the result.
 *     That callback verifies PayU's response hash with the merchant salt — nothing in it is
 *     trusted until the hash matches — and only then marks the transaction paid and creates the
 *     order. Cookies aren't sent on that cross-site POST, so the customer/cart/address are read
 *     back off the transaction saved at step 1, never from the request.
 */
export const payuAdapter = (): PaymentAdapter => ({
  name: 'payu',
  label: 'PayU (UPI, Cards, Netbanking)',
  group: {
    name: 'payu',
    type: 'group',
    admin: {
      condition: (data) => data?.paymentMethod === 'payu',
    },
    fields: [
      { name: 'txnid', type: 'text', label: 'PayU Transaction ID (ours)', admin: { readOnly: true } },
      { name: 'paymentId', type: 'text', label: 'PayU Payment ID (mihpayid)', admin: { readOnly: true } },
      { name: 'failureReason', type: 'text', admin: { readOnly: true } },
      {
        name: 'shippingAddress',
        type: 'json',
        admin: { description: 'Held until the payment succeeds, then copied onto the order.' },
      },
    ],
  },

  initiatePayment: async ({ data, req, transactionsSlug }) => {
    const { key, salt, paymentUrl } = getPayuConfig()
    const payload = req.payload
    const { billingAddress, cart, currency, customerEmail, shippingAddress } = data

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty or not provided.')
    }
    if (!customerEmail && !req.user) {
      throw new Error('A valid customer email is required to place an order.')
    }

    const amountInPaise = cart.subtotal
    if (!amountInPaise || typeof amountInPaise !== 'number' || amountInPaise <= 0) {
      throw new Error('A valid amount is required to place an order.')
    }

    const flattenedItems = cart.items.map((item) => {
      const productID = typeof item.product === 'object' ? item.product.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant.id
          : item.variant
        : undefined
      return {
        product: productID,
        quantity: item.quantity,
        ...(variantID ? { variant: variantID } : {}),
      }
    })

    const transaction = (await payload.create({
      collection: asSlug(transactionsSlug),
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        amount: amountInPaise,
        billingAddress,
        cart: cart.id,
        currency,
        items: flattenedItems,
        paymentMethod: 'payu',
        payu: { shippingAddress },
        status: 'pending',
      } as Record<string, unknown>,
      req,
    })) as Record<string, any>

    // Unique per attempt (a customer can retry) and alphanumeric, as PayU requires.
    const txnid = `AM${transaction.id}T${Date.now().toString(36)}`
    const amount = (amountInPaise / 100).toFixed(2)
    const productinfo = 'Amulya Medicals order'
    const firstname = sanitize((billingAddress as any)?.firstName, 'Customer')
    const email = customerEmail || (req.user as any)?.email || ''
    const phone = String((billingAddress as any)?.phone ?? '').replace(/\D/g, '').slice(-10)
    const udf1 = String(transaction.id)

    // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    // (udf2-5 and the five reserved fields after them are empty.)
    const hash = sha512(
      [
        key, txnid, amount, productinfo, firstname, email,
        udf1, '', '', '', '',
        '', '', '', '', '',
        salt,
      ].join('|'),
    )

    await payload.update({
      id: transaction.id,
      collection: asSlug(transactionsSlug),
      data: { payu: { shippingAddress, txnid } } as Record<string, unknown>,
      req,
    })

    const callbackUrl = `${serverUrl()}/api/payments/payu/callback`

    return {
      message: 'Redirecting to PayU…',
      payuParams: {
        amount,
        email,
        firstname,
        furl: callbackUrl,
        hash,
        key,
        ...(phone ? { phone } : {}),
        productinfo,
        surl: callbackUrl,
        txnid,
        udf1,
      },
      payuUrl: paymentUrl,
      transactionID: transaction.id,
    }
  },

  // The order is created by the callback endpoint below (PayU posts the customer's browser there),
  // not by a client-side follow-up call — this only exists to satisfy the adapter contract, and
  // returns the already-created order for a transaction that has one.
  confirmOrder: async ({ data, ordersSlug = 'orders', req, transactionsSlug = 'transactions' }) => {
    const transactionID = data.transactionID as number | string | undefined
    if (!transactionID) throw new Error('A transaction ID is required.')

    const transaction = (await req.payload.findByID({
      id: transactionID,
      collection: asSlug(transactionsSlug),
      depth: 0,
      req,
    })) as Record<string, any>

    if (!transaction?.order) {
      throw new Error('This PayU payment has not been completed.')
    }
    const orderID = typeof transaction.order === 'object' ? transaction.order.id : transaction.order
    const order = (await req.payload.findByID({
      id: orderID,
      collection: asSlug(ordersSlug),
      depth: 0,
      req,
    })) as Record<string, any>

    return {
      message: 'Order confirmed.',
      orderID,
      transactionID: transaction.id,
      ...(order?.accessToken ? { accessToken: order.accessToken } : {}),
    }
  },

  endpoints: [
    {
      path: '/callback',
      method: 'post',
      handler: async (req) => {
        const payload = req.payload
        const transactionsSlug = 'transactions'
        const ordersSlug = 'orders'
        const cartsSlug = 'carts'

        try {
          const { key, salt } = getPayuConfig()
          const form = await req.formData!()
          const get = (name: string) => String(form.get(name) ?? '')

          const status = get('status')
          const txnid = get('txnid')
          const udf1 = get('udf1')

          // salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
          // (PayU prepends additionalCharges when it added any.)
          const reverseParts = [
            salt,
            status,
            '', '', '', '', '',
            get('udf5'), get('udf4'), get('udf3'), get('udf2'), udf1,
            get('email'), get('firstname'), get('productinfo'), get('amount'), txnid, key,
          ]
          const additionalCharges = get('additionalCharges')
          if (additionalCharges) reverseParts.unshift(additionalCharges)
          const expectedHash = sha512(reverseParts.join('|'))

          if (!get('hash') || !safeEqual(expectedHash, get('hash'))) {
            payload.logger.error('PayU callback rejected: response hash did not match.')
            return redirectTo('/checkout?payment=error')
          }

          const transaction = (await payload.findByID({
            id: udf1,
            collection: asSlug(transactionsSlug),
            depth: 0,
            overrideAccess: true,
          })) as Record<string, any>

          if (!transaction || transaction.paymentMethod !== 'payu' || transaction.payu?.txnid !== txnid) {
            payload.logger.error('PayU callback rejected: no matching transaction.')
            return redirectTo('/checkout?payment=error')
          }

          if (Math.abs(Number(get('amount')) - transaction.amount / 100) > 0.01) {
            payload.logger.error('PayU callback rejected: amount mismatch.')
            return redirectTo('/checkout?payment=error')
          }

          // A browser refresh / double-post must not create a second order.
          if (transaction.order) {
            const existingOrderID =
              typeof transaction.order === 'object' ? transaction.order.id : transaction.order
            const existing = (await payload.findByID({
              id: existingOrderID,
              collection: asSlug(ordersSlug),
              depth: 0,
              overrideAccess: true,
            })) as Record<string, any>
            const q = new URLSearchParams()
            if (transaction.customerEmail) q.set('email', transaction.customerEmail)
            if (existing?.accessToken) q.set('accessToken', existing.accessToken)
            return redirectTo(`/orders/${existingOrderID}?${q.toString()}`)
          }

          if (status !== 'success') {
            await payload.update({
              id: transaction.id,
              collection: asSlug(transactionsSlug),
              data: {
                payu: {
                  ...transaction.payu,
                  failureReason: get('error_Message') || get('field9') || status,
                  paymentId: get('mihpayid'),
                },
                status: 'failed',
              } as Record<string, unknown>,
              overrideAccess: true,
            })
            return redirectTo('/checkout?payment=failed')
          }

          const customerID = transaction.customer
            ? typeof transaction.customer === 'object'
              ? transaction.customer.id
              : transaction.customer
            : undefined

          const order = (await payload.create({
            collection: asSlug(ordersSlug),
            data: {
              amount: transaction.amount,
              currency: transaction.currency,
              ...(customerID ? { customer: customerID } : { customerEmail: transaction.customerEmail }),
              items: transaction.items,
              shippingAddress: transaction.payu?.shippingAddress,
              status: 'processing',
              transactions: [transaction.id],
            } as Record<string, unknown>,
            overrideAccess: true,
          })) as Record<string, any>

          const cartID = transaction.cart
            ? typeof transaction.cart === 'object'
              ? transaction.cart.id
              : transaction.cart
            : undefined
          if (cartID) {
            await payload
              .update({
                id: cartID,
                collection: asSlug(cartsSlug),
                data: { purchasedAt: new Date().toISOString() } as Record<string, unknown>,
                overrideAccess: true,
              })
              .catch(() => {
                // Best-effort — a guest cart may already be gone.
              })
          }

          await payload.update({
            id: transaction.id,
            collection: asSlug(transactionsSlug),
            data: {
              order: order.id,
              payu: { ...transaction.payu, paymentId: get('mihpayid') },
              status: 'succeeded',
            } as Record<string, unknown>,
            overrideAccess: true,
          })

          const q = new URLSearchParams()
          if (transaction.customerEmail) q.set('email', transaction.customerEmail)
          if (order.accessToken) q.set('accessToken', order.accessToken)
          // placed=1 tells the order page to empty the customer's cart (first success only —
          // a replayed callback above deliberately omits it so it can't wipe a newer cart).
          q.set('placed', '1')
          return redirectTo(`/orders/${order.id}?${q.toString()}`)
        } catch (err) {
          payload.logger.error({ err }, 'PayU callback failed')
          return redirectTo('/checkout?payment=error')
        }
      },
    } satisfies Endpoint,
  ],
})

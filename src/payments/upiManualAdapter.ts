import type { CollectionSlug } from 'payload'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

// Same reason as codAdapter.ts: the plugin types collection slugs as plain `string`.
const asSlug = (slug: string) => slug as CollectionSlug

/**
 * Manual UPI — a temporary stand-in while the real payment gateway's KYC is pending. There's no
 * API call to a payment provider: the customer sees a QR code (generated client-side from
 * NEXT_PUBLIC_UPI_ID, see src/lib/upi) and pays outside the site, then messages a screenshot to
 * the store's WhatsApp. `initiatePayment` + `confirmOrder` run back-to-back on the same click
 * (no redirect to wait on), exactly like codAdapter.ts — the difference is the order is created
 * with `paymentReviewStatus: 'pending'`, which the customer-facing order page reads to show a
 * "verifying your payment" banner instead of the normal fulfillment tracker, and which the admin
 * approve-payment endpoint (src/endpoints/orders.ts) flips to 'approved' once staff confirm the
 * screenshot against their own UPI app.
 */
export const upiManualAdapter = (): PaymentAdapter => ({
  name: 'upi_manual',
  label: 'UPI (Pay & send screenshot on WhatsApp)',
  group: {
    name: 'upiManual',
    type: 'group',
    admin: {
      condition: (data) => data?.paymentMethod === 'upi_manual',
    },
    fields: [{ name: 'reference', type: 'text', label: 'Customer-shown reference', admin: { readOnly: true } }],
  },

  initiatePayment: async ({ data, req, transactionsSlug }) => {
    const payload = req.payload
    const { billingAddress, cart, currency, customerEmail } = data

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty or not provided.')
    }
    if (!customerEmail && !req.user) {
      throw new Error('A valid customer email is required to place an order.')
    }

    const amount = cart.subtotal
    if (!amount || typeof amount !== 'number' || amount <= 0) {
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

    const reference = (data as Record<string, unknown>).reference
    const transaction = (await payload.create({
      collection: asSlug(transactionsSlug),
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        amount,
        billingAddress,
        cart: cart.id,
        currency,
        items: flattenedItems,
        paymentMethod: 'upi_manual',
        upiManual: { reference },
        // Pending = awaiting manual verification, same convention as codAdapter.ts.
        status: 'pending',
      } as Record<string, unknown>,
      req,
    })) as Record<string, any>

    return {
      message: 'Order recorded — awaiting payment verification.',
      transactionID: transaction.id,
    }
  },

  confirmOrder: async ({ cartsSlug = 'carts', data, ordersSlug = 'orders', req, transactionsSlug = 'transactions' }) => {
    const payload = req.payload
    const transactionID = data.transactionID as number | string | undefined
    const shippingAddress = data.shippingAddress
    const customerEmail = data.customerEmail

    if (!transactionID) {
      throw new Error('A transaction ID is required to confirm a UPI order.')
    }

    const transaction = (await payload.findByID({
      id: transactionID,
      collection: asSlug(transactionsSlug),
      depth: 0,
      req,
    })) as Record<string, any>

    if (!transaction || transaction.paymentMethod !== 'upi_manual') {
      throw new Error('No matching UPI transaction was found.')
    }
    if (transaction.order) {
      throw new Error('This order has already been placed.')
    }

    const order = (await payload.create({
      collection: asSlug(ordersSlug),
      data: {
        amount: transaction.amount,
        currency: transaction.currency,
        ...(req.user ? { customer: req.user.id } : { customerEmail: customerEmail || transaction.customerEmail }),
        items: transaction.items,
        paymentMethod: 'upi_manual',
        paymentReviewStatus: 'pending',
        shippingAddress,
        status: 'processing',
        transactions: [transaction.id],
      } as Record<string, unknown>,
      req,
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
          req,
        })
        .catch(() => {
          // Best-effort — a guest cart may already be gone by the time we get here.
        })
    }

    await payload.update({
      id: transaction.id,
      collection: asSlug(transactionsSlug),
      // Stays 'pending' — a human approves it via the orders endpoint, not this flow.
      data: { order: order.id } as Record<string, unknown>,
      req,
    })

    return {
      message: 'Order placed — we’ll confirm it once your payment is verified.',
      orderID: order.id,
      transactionID: transaction.id,
      ...(order.accessToken ? { accessToken: order.accessToken } : {}),
    }
  },
})

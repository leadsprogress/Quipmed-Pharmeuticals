import type { CollectionSlug } from 'payload'
import type { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'

// `transactionsSlug`/`ordersSlug`/`cartsSlug` are typed as plain `string` by the plugin (they're
// configurable), so Payload's generated per-collection types can't be resolved from them —
// same reason the plugin's own Stripe adapter is plain JS rather than typed TS. Cast at the call
// site instead of loosening every field access below.
const asSlug = (slug: string) => slug as CollectionSlug

/**
 * Cash on Delivery — a mock "payment provider" for when Stripe isn't (yet) how a customer wants
 * to pay. There's no external gateway: `initiatePayment` records a pending transaction from the
 * cart, and `confirmOrder` (called immediately after, in the same checkout step — no redirect to
 * wait on) turns that into a real order. The transaction is deliberately left `pending` (unpaid)
 * after confirmation — COD isn't paid until the driver collects cash on delivery. Staff flip it
 * to `succeeded` from the customer/order lookup tool (or the Transactions collection directly)
 * once the money's in hand.
 */
export const codAdapter = (): PaymentAdapter => ({
  name: 'cod',
  label: 'Cash on Delivery',
  group: {
    name: 'cod',
    type: 'group',
    admin: {
      condition: (data) => data?.paymentMethod === 'cod',
      description:
        'No online payment was taken for this order — cash is collected on delivery. Change status to "Succeeded" once the payment has been collected.',
    },
    fields: [],
  },

  initiatePayment: async ({ data, req, transactionsSlug }) => {
    const payload = req.payload
    const { billingAddress, cart, currency, customerEmail } = data

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty or not provided.')
    }
    if (!customerEmail) {
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

    const transaction = (await payload.create({
      collection: asSlug(transactionsSlug),
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        amount,
        billingAddress,
        cart: cart.id,
        currency,
        items: flattenedItems,
        paymentMethod: 'cod',
        status: 'pending',
      } as Record<string, unknown>,
      req,
    })) as Record<string, any>

    return {
      message: 'Cash on Delivery order ready — confirm to place it.',
      transactionID: transaction.id,
    }
  },

  confirmOrder: async ({ cartsSlug = 'carts', data, ordersSlug = 'orders', req, transactionsSlug = 'transactions' }) => {
    const payload = req.payload
    const transactionID = data.transactionID as number | string | undefined
    const shippingAddress = data.shippingAddress
    const customerEmail = data.customerEmail

    if (!transactionID) {
      throw new Error('A transaction ID is required to confirm a Cash on Delivery order.')
    }

    const transaction = (await payload.findByID({
      id: transactionID,
      collection: asSlug(transactionsSlug),
      depth: 0,
      req,
    })) as Record<string, any>

    if (!transaction || transaction.paymentMethod !== 'cod') {
      throw new Error('No matching Cash on Delivery transaction was found.')
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
      // Leave status as 'pending' (unpaid) — see file header.
      data: { order: order.id } as Record<string, unknown>,
      req,
    })

    return {
      message: 'Order placed — pay cash on delivery.',
      orderID: order.id,
      transactionID: transaction.id,
      ...(order.accessToken ? { accessToken: order.accessToken } : {}),
    }
  },
})

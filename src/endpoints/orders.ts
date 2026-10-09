import type { Endpoint } from 'payload'

import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'

const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403 })

// The one-click action behind the "Approve Payment" button on a manual-UPI order
// (src/components/admin/ApproveUpiPayment) — flips the order to approved, marks its UPI
// transaction as paid (mirrors the existing COD "mark paid" convention in customerSearch.ts),
// and hands back everything the client needs to open a pre-filled WhatsApp confirmation to the
// customer, without a second round trip.
export const approveUpiPaymentEndpoint: Endpoint = {
  path: '/order-review/:orderId/approve-upi-payment',
  method: 'patch',
  handler: async (req) => {
    if (!checkRole(['admin'], req.user as User | undefined)) {
      return forbidden()
    }

    const orderId = req.routeParams?.orderId as string | undefined
    if (!orderId) {
      return Response.json({ error: 'Missing order id' }, { status: 400 })
    }

    let order
    try {
      order = await req.payload.findByID({
        collection: 'orders',
        id: orderId,
        depth: 2,
        overrideAccess: true,
      })
    } catch {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.paymentMethod !== 'upi_manual') {
      return Response.json({ error: 'This order was not placed via manual UPI.' }, { status: 400 })
    }

    const transactions = Array.isArray(order.transactions) ? order.transactions : []
    const pendingTransaction = transactions.find(
      (t) => typeof t === 'object' && t !== null && t.paymentMethod === 'upi_manual',
    )

    await req.payload.update({
      collection: 'orders',
      id: orderId,
      data: { paymentReviewStatus: 'approved' },
      overrideAccess: true,
    })

    if (pendingTransaction && typeof pendingTransaction === 'object') {
      await req.payload
        .update({
          collection: 'transactions',
          id: pendingTransaction.id,
          data: { status: 'succeeded' },
          overrideAccess: true,
        })
        .catch(() => {
          // Non-fatal — the order itself is already approved either way.
        })
    }

    const address =
      order.shippingAddress && typeof order.shippingAddress === 'object' ? order.shippingAddress : null

    const items = (order.items ?? [])
      .map((item) => {
        const title =
          (item.product && typeof item.product === 'object' ? item.product.title : null) || 'Item'
        return `${item.quantity}x ${title}`
      })
      .join(', ')

    return Response.json({
      ok: true,
      order: {
        id: order.id,
        amount: order.amount,
        items,
        customerName: [address?.firstName, address?.lastName].filter(Boolean).join(' '),
        phone: address?.phone || '',
      },
    })
  },
}

export const ordersAdminEndpoints: Endpoint[] = [approveUpiPaymentEndpoint]

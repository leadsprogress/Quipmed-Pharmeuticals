import type { Endpoint, Where } from 'payload'

import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'

const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403 })

const RESULT_LIMIT = 8

// An order's `transactions` are populated objects only once `depth` is high enough — this is
// only ever called on data fetched with depth >= 1, but stays defensive against a bare ID
// slipping through so a payment badge never crashes the page, it just renders as "Unknown".
function summarizePayment(order: { transactions?: unknown }): {
  paymentMethod: string | null
  paymentStatus: string | null
} {
  const transactions = Array.isArray(order.transactions) ? order.transactions : []
  const transaction = transactions.find(
    (t): t is Record<string, unknown> => typeof t === 'object' && t !== null,
  )

  return {
    paymentMethod: (transaction?.paymentMethod as string | undefined) ?? null,
    paymentStatus: (transaction?.status as string | undefined) ?? null,
  }
}

function withPaymentSummary<T extends { transactions?: unknown }>(order: T) {
  return { ...order, ...summarizePayment(order) }
}

// Searches customers (Users with the "customer" role) and orders together so a single search
// box can resolve name / phone / email / order-number queries the way a support agent expects.
export const customerSearchListEndpoint: Endpoint = {
  path: '/customer-search',
  method: 'get',
  handler: async (req) => {
    if (!checkRole(['admin'], req.user as User | undefined)) {
      return forbidden()
    }

    const q = req.searchParams?.get('q')?.trim() || ''

    if (q.length < 2) {
      return Response.json({ customers: [], orders: [], query: q })
    }

    const customerConditions: Where[] = [
      { name: { like: q } },
      { email: { like: q } },
      { phone: { like: q } },
    ]

    const orderConditions: Where[] = [
      { customerEmail: { like: q } },
      { 'shippingAddress.phone': { like: q } },
      { 'shippingAddress.firstName': { like: q } },
      { 'shippingAddress.lastName': { like: q } },
    ]

    if (/^\d+$/.test(q)) {
      orderConditions.push({ id: { equals: Number(q) } })
    }

    const [customers, orders] = await Promise.all([
      req.payload.find({
        collection: 'users',
        depth: 0,
        limit: RESULT_LIMIT,
        overrideAccess: true,
        select: { name: true, email: true, phone: true, roles: true },
        sort: 'name',
        where: { or: customerConditions },
      }),
      req.payload.find({
        collection: 'orders',
        depth: 1,
        limit: RESULT_LIMIT,
        overrideAccess: true,
        sort: '-createdAt',
        where: { or: orderConditions },
      }),
    ])

    return Response.json({
      customers: customers.docs,
      orders: orders.docs.map((order) => withPaymentSummary(order)),
      query: q,
    })
  },
}

// Full "customer 360" detail: profile, saved addresses, and every order — orders placed while
// signed in (linked via `customer`) plus any guest-checkout orders made with the same email
// before they had an account, merged into one timeline.
export const customerDetailEndpoint: Endpoint = {
  path: '/customer-search/:id',
  method: 'get',
  handler: async (req) => {
    if (!checkRole(['admin'], req.user as User | undefined)) {
      return forbidden()
    }

    const id = req.routeParams?.id as string | undefined

    if (!id) {
      return Response.json({ error: 'Missing customer id' }, { status: 400 })
    }

    let customer
    try {
      customer = await req.payload.findByID({
        collection: 'users',
        id,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      return Response.json({ error: 'Customer not found' }, { status: 404 })
    }

    const [linkedOrders, guestOrders, addresses] = await Promise.all([
      req.payload.find({
        collection: 'orders',
        depth: 2,
        limit: 100,
        overrideAccess: true,
        sort: '-createdAt',
        where: { customer: { equals: customer.id } },
      }),
      customer.email
        ? req.payload.find({
            collection: 'orders',
            depth: 2,
            limit: 100,
            overrideAccess: true,
            sort: '-createdAt',
            where: {
              and: [{ customerEmail: { equals: customer.email } }, { customer: { equals: null } }],
            },
          })
        : null,
      req.payload.find({
        collection: 'addresses',
        depth: 0,
        limit: 50,
        overrideAccess: true,
        where: { customer: { equals: customer.id } },
      }),
    ])

    const ordersById = new Map<number | string, unknown>()
    for (const order of [...linkedOrders.docs, ...(guestOrders?.docs || [])]) {
      ordersById.set(order.id, order)
    }
    const orders = Array.from(ordersById.values())
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((order: any) => withPaymentSummary(order))

    return Response.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt,
      },
      addresses: addresses.docs,
      orders,
    })
  },
}

// Cash-on-delivery orders start "unpaid" (the underlying transaction stays `pending` — see
// src/payments/codAdapter.ts) until staff have the cash in hand. This is the one-click way to
// flip that from the lookup tool, instead of making them go find the transaction record
// themselves and edit its status field directly (still possible, just not the happy path).
export const markOrderPaidEndpoint: Endpoint = {
  path: '/customer-search/orders/:orderId/mark-paid',
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
        depth: 1,
        overrideAccess: true,
      })
    } catch {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    const transactions = Array.isArray(order.transactions) ? order.transactions : []
    const pendingTransaction = transactions.find(
      (t) => typeof t === 'object' && t !== null && t.status === 'pending',
    )

    if (!pendingTransaction || typeof pendingTransaction !== 'object') {
      return Response.json(
        { error: 'No pending transaction found on this order — it may already be paid.' },
        { status: 400 },
      )
    }

    await req.payload.update({
      collection: 'transactions',
      id: pendingTransaction.id,
      data: { status: 'succeeded' },
      overrideAccess: true,
    })

    return Response.json({ ok: true })
  },
}

export const customerSearchEndpoints: Endpoint[] = [
  customerSearchListEndpoint,
  customerDetailEndpoint,
  markOrderPaidEndpoint,
]

import type { Endpoint, Where } from 'payload'

import { checkRole } from '@/access/utilities'
import type { User } from '@/payload-types'

const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403 })

const RESULT_LIMIT = 8

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
        depth: 0,
        limit: RESULT_LIMIT,
        overrideAccess: true,
        sort: '-createdAt',
        where: { or: orderConditions },
      }),
    ])

    return Response.json({
      customers: customers.docs,
      orders: orders.docs,
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
    const orders = Array.from(ordersById.values()).sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

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

export const customerSearchEndpoints: Endpoint[] = [
  customerSearchListEndpoint,
  customerDetailEndpoint,
]

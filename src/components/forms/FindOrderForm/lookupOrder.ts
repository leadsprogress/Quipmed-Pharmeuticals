'use server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

type LookupResult =
  | { success: true; orderId: number | string; accessToken: string; email: string }
  | { success: false; error: string }

const NOT_FOUND = { success: false as const, error: "We couldn't find a matching order." }

// Replaces the old email-a-link flow (sendOrderAccessEmail.ts): this project has no email
// adapter configured (see payload.config.ts — the nodemailer line is commented out), so that
// flow silently did nothing for a guest. Both lookup methods here resolve directly instead —
// the tracking code is already the order's own access-control secret (see
// orders/[id]/page.tsx), and an exact Order ID + Email match is the same proof of ownership the
// old flow checked before deciding whether to send mail, just acted on immediately.
export async function lookupOrderByTrackingCode(trackingCode: string): Promise<LookupResult> {
  const code = trackingCode.trim()
  if (!code) return NOT_FOUND

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'orders',
    where: { accessToken: { equals: code } },
    limit: 1,
    depth: 0,
    select: { accessToken: true, customerEmail: true },
  })

  const order = docs[0]
  if (!order || !order.accessToken) return NOT_FOUND

  return {
    success: true,
    orderId: order.id,
    accessToken: order.accessToken,
    email: order.customerEmail || '',
  }
}

export async function lookupOrderByIdAndEmail(
  orderID: string,
  email: string,
): Promise<LookupResult> {
  if (!orderID.trim() || !email.trim()) return NOT_FOUND

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'orders',
    where: { and: [{ id: { equals: orderID.trim() } }, { customerEmail: { equals: email.trim() } }] },
    limit: 1,
    depth: 0,
    select: { accessToken: true, customerEmail: true },
  })

  const order = docs[0]
  if (!order || !order.accessToken) return NOT_FOUND

  return { success: true, orderId: order.id, accessToken: order.accessToken, email }
}

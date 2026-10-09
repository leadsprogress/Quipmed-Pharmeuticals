import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { ProductItem } from '@/components/ProductItem'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { OrderStatus } from '@/components/OrderStatus'
import { FulfillmentTimeline } from '@/components/OrderStatus/FulfillmentTimeline'
import { AddressItem } from '@/components/addresses/AddressItem'
import { ClearCartOnPlaced } from '@/components/checkout/ClearCartOnPlaced'
import { describePayment } from '@/components/OrderStatus/PaymentSummary'
import { TrackingLinkBox } from '@/components/OrderStatus/TrackingLinkBox'
import { Suspense } from 'react'
import { cn } from '@/utilities/cn'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

export default async function Order({ params, searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams

  let order: Order | null = null

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user,
      overrideAccess: !Boolean(user),
      // items.product (1) -> gallery.image (2) -> the media doc itself needs one more level.
      depth: 3,
      where: {
        and: [
          {
            id: {
              equals: id,
            },
          },
          ...(user
            ? [
                {
                  customer: {
                    equals: user.id,
                  },
                },
              ]
            : [
                {
                  accessToken: {
                    equals: accessToken,
                  },
                },
                ...(email
                  ? [
                      {
                        customerEmail: {
                          equals: email,
                        },
                      },
                    ]
                  : []),
              ]),
        ],
      },
      select: {
        amount: true,
        currency: true,
        items: true,
        customerEmail: true,
        customer: true,
        status: true,
        currentFulfillmentStatus: true,
        fulfillmentEvents: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true,
        transactions: true,
        paymentMethod: true,
        paymentReviewStatus: true,
        accessToken: true,
      },
    })

    // The `where` clause above already matched on accessToken (optionally narrowed by email when
    // provided) — this is just confirming that match, not re-deriving authorization. Email is
    // optional: a guest with only the tracking code must still get in.
    const canAccessAsGuest =
      !user &&
      accessToken &&
      orderResult &&
      (!email || orderResult.customerEmail === email)
    const canAccessAsUser =
      user &&
      orderResult &&
      orderResult.customer &&
      (typeof orderResult.customer === 'object'
        ? orderResult.customer.id
        : orderResult.customer) === user.id

    if (orderResult && (canAccessAsGuest || canAccessAsUser)) {
      order = orderResult
    }
  } catch (error) {
    console.error(error)
  }

  if (!order) {
    notFound()
  }

  const payment = describePayment(order.transactions)
  const label = 'mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground'
  const sectionTitle = 'mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground'

  const awaitingUpiReview =
    order.paymentMethod === 'upi_manual' && order.paymentReviewStatus !== 'approved'

  return (
    <div>
      <Suspense fallback={null}>
        <ClearCartOnPlaced />
      </Suspense>

      <div className="mb-6 flex items-center justify-between gap-8">
        {user ? (
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
            <Link href="/orders">
              <ChevronLeftIcon />
              All orders
            </Link>
          </Button>
        ) : (
          <div />
        )}

        <h1 className="rounded-full bg-primary px-3 py-1 font-mono text-sm uppercase tracking-[0.07em] text-primary-foreground">
          {`Order #${order.id}`}
        </h1>
      </div>

      {!user && order.accessToken && (
        <TrackingLinkBox orderId={order.id} accessToken={order.accessToken} />
      )}

      {awaitingUpiReview && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-6">
          <p className="font-medium text-foreground">
            Order received — we&apos;re verifying your payment.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            If you&apos;ve already sent us your payment screenshot on WhatsApp, we&apos;ll message
            you there once it&apos;s confirmed. Tracking details will appear here after that.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className={label}>Order date</p>
            <p className="text-lg font-medium text-foreground">
              <time dateTime={order.createdAt}>
                {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
              </time>
            </p>
          </div>

          <div>
            <p className={label}>Total</p>
            {order.amount ? <Price className="text-lg font-semibold text-foreground" amount={order.amount} /> : null}
          </div>

          {order.status && (
            <div>
              <p className={label}>Status</p>
              <OrderStatus className="text-sm" status={order.status} />
            </div>
          )}

          {payment && (
            <div>
              <p className={label}>Payment</p>
              <p
                className={cn('text-sm font-medium', {
                  'text-primary': payment.tone === 'paid',
                  'text-foreground': payment.tone === 'pending',
                  'text-destructive': payment.tone === 'failed',
                })}
              >
                {payment.label}
              </p>
            </div>
          )}
        </div>

        {!awaitingUpiReview && order.fulfillmentEvents && order.fulfillmentEvents.length > 0 && (
          <div>
            <h2 className={sectionTitle}>Order status</h2>
            <FulfillmentTimeline events={order.fulfillmentEvents} />
          </div>
        )}

        {order.items && (
          <div>
            <h2 className={sectionTitle}>Items</h2>
            <ul className="flex flex-col divide-y divide-border">
              {order.items?.map((item, index) => {
                if (typeof item.product === 'string') {
                  return null
                }

                if (!item.product || typeof item.product !== 'object') {
                  return (
                    <li key={index} className="py-4 text-sm text-muted-foreground">
                      This item is no longer available.
                    </li>
                  )
                }

                const variant =
                  item.variant && typeof item.variant === 'object' ? item.variant : undefined

                return (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <ProductItem
                      product={item.product}
                      quantity={item.quantity}
                      variant={variant}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {order.shippingAddress && (
          <div>
            <h2 className={sectionTitle}>Shipping address</h2>

            {/* @ts-expect-error - some kind of type hell */}
            <AddressItem address={order.shippingAddress} hideActions />
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    description: `Order details for order ${id}.`,
    openGraph: mergeOpenGraph({
      title: `Order ${id}`,
      url: `/orders/${id}`,
    }),
    title: `Order ${id}`,
  }
}

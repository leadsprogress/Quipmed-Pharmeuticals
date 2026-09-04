import { cn } from '@/utilities/cn'
import { formatDateTime } from '@/utilities/formatDateTime'
import type { Order } from '@/payload-types'

const STAGE_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  collected: 'Collected In-Store',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

const TERMINAL_NEGATIVE = new Set(['cancelled', 'refunded'])

type FulfillmentEvent = NonNullable<Order['fulfillmentEvents']>[number]

type Props = {
  events?: FulfillmentEvent[] | null
  className?: string
}

export const fulfillmentStageLabel = (status?: string | null) =>
  (status && STAGE_LABELS[status]) || status || 'Order Placed'

export const FulfillmentBadge: React.FC<{ status?: string | null; className?: string }> = ({
  status,
  className,
}) => {
  const isNegative = status ? TERMINAL_NEGATIVE.has(status) : false

  return (
    <div
      className={cn(
        'w-fit rounded px-2 py-0 font-mono text-xs uppercase tracking-widest',
        isNegative ? 'bg-destructive/10 text-destructive' : 'bg-primary/10',
        className,
      )}
    >
      {fulfillmentStageLabel(status)}
    </div>
  )
}

export const FulfillmentTimeline: React.FC<Props> = ({ events, className }) => {
  const sorted = [...(events || [])].sort(
    (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime(),
  )

  if (sorted.length === 0) return null

  return (
    <ol className={cn('flex flex-col gap-4', className)}>
      {sorted.map((event, i) => {
        const isLast = i === sorted.length - 1
        const isNegative = TERMINAL_NEGATIVE.has(event.status)

        return (
          <li key={event.id || i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn('h-2.5 w-2.5 shrink-0 rounded-full', {
                  'bg-destructive': isNegative,
                  'bg-primary': !isNegative && isLast,
                  'bg-muted-foreground/40': !isNegative && !isLast,
                })}
              />
              {i < sorted.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
            </div>
            <div className="pb-1">
              <p className={cn('text-sm font-medium', isLast && !isNegative && 'text-primary')}>
                {fulfillmentStageLabel(event.status)}
              </p>
              {event.timestamp && (
                <p className="text-xs text-muted-foreground">
                  {formatDateTime({ date: event.timestamp, format: 'MMMM dd, yyyy · hh:mm a' })}
                </p>
              )}
              {event.note && <p className="mt-0.5 text-xs text-muted-foreground">{event.note}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

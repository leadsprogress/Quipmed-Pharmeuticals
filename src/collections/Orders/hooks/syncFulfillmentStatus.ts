import type { CollectionBeforeChangeHook } from 'payload'

type FulfillmentEvent = {
  status?: string | null
  timestamp?: string | null
  note?: string | null
  id?: string | null
}

// Keeps `currentFulfillmentStatus` in sync with the fulfillment timeline, stamps any new event
// missing a timestamp with "now", and seeds a "placed" event on order creation so every order —
// including ones created by the checkout/payment flow, which never sets fulfillment data itself —
// starts with a timeline entry.
export const syncFulfillmentStatus: CollectionBeforeChangeHook = ({ data, operation }) => {
  const now = new Date().toISOString()

  let events: FulfillmentEvent[] = Array.isArray(data.fulfillmentEvents)
    ? data.fulfillmentEvents
    : []

  if (operation === 'create' && events.length === 0) {
    events = [{ status: 'placed', timestamp: now }]
  }

  events = events.map((event) => ({
    ...event,
    timestamp: event.timestamp || now,
  }))

  const sortedByTime = [...events].sort(
    (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime(),
  )
  const latest = sortedByTime[sortedByTime.length - 1]

  return {
    ...data,
    fulfillmentEvents: events,
    currentFulfillmentStatus: latest?.status || data.currentFulfillmentStatus || 'placed',
  }
}

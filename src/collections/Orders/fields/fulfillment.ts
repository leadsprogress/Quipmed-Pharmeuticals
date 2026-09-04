import type { Field } from 'payload'

// Fulfillment tracking is separate from the ecommerce plugin's own `status` field (which only
// tracks the payment lifecycle: processing / completed / cancelled / refunded, and is written to
// directly by the checkout flow). This is the "what was ordered, what was shipped, what was
// collected" timeline shown to customers and staff.
export const FULFILLMENT_STAGES = [
  { label: 'Order Placed', value: 'placed' },
  { label: 'Packed', value: 'packed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Collected In-Store', value: 'collected' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
] as const

export type FulfillmentStage = (typeof FULFILLMENT_STAGES)[number]['value']

export const fulfillmentFields: Field[] = [
  {
    name: 'currentFulfillmentStatus',
    type: 'select',
    admin: {
      position: 'sidebar',
      description: 'Automatically set from the latest entry in the fulfillment timeline below.',
      readOnly: true,
    },
    defaultValue: 'placed',
    options: FULFILLMENT_STAGES as unknown as { label: string; value: string }[],
  },
  {
    name: 'fulfillmentEvents',
    type: 'array',
    label: 'Fulfillment timeline',
    admin: {
      description:
        'Add a row each time this order moves to a new stage (packed, shipped, delivered, etc). The most recent row becomes the current status shown to the customer.',
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'status',
            type: 'select',
            required: true,
            options: FULFILLMENT_STAGES as unknown as { label: string; value: string }[],
            admin: { width: '50%' },
          },
          {
            name: 'timestamp',
            type: 'date',
            admin: {
              width: '50%',
              date: { pickerAppearance: 'dayAndTime' },
              description: 'Defaults to now if left empty.',
            },
          },
        ],
      },
      {
        name: 'note',
        type: 'text',
        admin: {
          description: 'Optional, e.g. courier name or tracking number.',
        },
      },
    ],
  },
]

import type { Block } from 'payload'

// The phone number itself isn't a field here — it's pulled from Admin → Footer → Contact at
// render time, so there's one source of truth for the site's phone number.
export const CallToOrderBlock: Block = {
  slug: 'callToOrder',
  interfaceName: 'CallToOrderBlock',
  fields: [
    { name: 'label', type: 'text', defaultValue: 'Place' },
    { name: 'heading', type: 'text', defaultValue: 'Your Order Via' },
    { name: 'phoneLabel', type: 'text', defaultValue: 'Call Us On' },
  ],
  labels: {
    plural: 'Call to Order Banners',
    singular: 'Call to Order Banner',
  },
}

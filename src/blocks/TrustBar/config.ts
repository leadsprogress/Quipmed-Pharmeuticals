import type { Block } from 'payload'

export const TrustBar: Block = {
  slug: 'trustBar',
  interfaceName: 'TrustBarBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      defaultValue: [
        { title: 'Genuine Products', subtitle: '100% authentic, sourced directly' },
        { title: 'Attractive Discounts', subtitle: 'Best prices on every order' },
        { title: 'Timely Delivery', subtitle: 'Delivered in 24-48 hours' },
        { title: 'Easy Payments', subtitle: 'Secure checkout, multiple options' },
      ],
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'subtitle',
          type: 'text',
        },
      ],
    },
  ],
  labels: {
    plural: 'Trust Bars',
    singular: 'Trust Bar',
  },
}

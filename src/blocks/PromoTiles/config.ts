import type { Block } from 'payload'

export const PromoTiles: Block = {
  slug: 'promoTiles',
  interfaceName: 'PromoTilesBlock',
  fields: [
    {
      name: 'tiles',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      defaultValue: [
        {
          heading: "Don't Just Manage. Save.",
          subheading: 'Compare prices before you buy — genuine products at fair rates.',
          tone: 'primary',
          linkLabel: 'Shop Now',
          linkUrl: '/shop',
        },
        {
          heading: 'Bulk & Institutional Orders',
          subheading: 'Pharmacies, clinics and hospitals — get wholesale pricing.',
          tone: 'secondary',
          linkLabel: 'Enquire Now',
          linkUrl: '/find-order',
        },
      ],
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'subheading', type: 'text' },
        {
          name: 'tone',
          type: 'select',
          defaultValue: 'primary',
          options: [
            { label: 'Teal', value: 'primary' },
            { label: 'Orange', value: 'secondary' },
            { label: 'Soft', value: 'accent' },
          ],
        },
        { name: 'linkLabel', type: 'text' },
        { name: 'linkUrl', type: 'text' },
      ],
    },
  ],
  labels: {
    plural: 'Promo Tiles',
    singular: 'Promo Tiles',
  },
}

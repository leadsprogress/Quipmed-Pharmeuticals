import type { Block } from 'payload'

export const PromoBannerBlock: Block = {
  slug: 'promoBanner',
  interfaceName: 'PromoBannerBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'body', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'buttonLabel', type: 'text', admin: { width: '50%' } },
        { name: 'buttonUrl', type: 'text', admin: { width: '50%' } },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
  labels: {
    plural: 'Promo Banners',
    singular: 'Promo Banner',
  },
}

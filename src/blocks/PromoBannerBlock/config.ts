import type { Block } from 'payload'
import { displayOnMobileField } from '@/fields/displayOnMobile'

export const PromoBannerBlock: Block = {
  slug: 'promoBanner',
  interfaceName: 'PromoBannerBlock',
  fields: [
    displayOnMobileField,
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'body', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media' },
  ],
  labels: {
    plural: 'Promo Banners',
    singular: 'Promo Banner',
  },
}

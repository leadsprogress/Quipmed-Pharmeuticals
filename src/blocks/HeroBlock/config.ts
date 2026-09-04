import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'homeHero',
  interfaceName: 'HomeHeroBlock',
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text' },
    { name: 'subtext', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'primaryCtaLabel', type: 'text', admin: { width: '50%' } },
        { name: 'primaryCtaUrl', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'secondaryCtaLabel', type: 'text', admin: { width: '50%' } },
        { name: 'secondaryCtaUrl', type: 'text', admin: { width: '50%' } },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        { name: 'statValue', type: 'number', admin: { width: '34%' } },
        { name: 'statSuffix', type: 'text', admin: { width: '33%' } },
        { name: 'statLabel', type: 'text', admin: { width: '33%' } },
      ],
    },
    {
      name: 'trustItems',
      type: 'array',
      maxRows: 4,
      fields: [
        { name: 'icon', type: 'text', admin: { description: 'Font Awesome icon class' } },
        { name: 'title', type: 'text', required: true },
        { name: 'subtitle', type: 'text' },
      ],
    },
  ],
  labels: {
    plural: 'Home Heroes',
    singular: 'Home Hero',
  },
}

import type { Block } from 'payload'

export const ValueCardsBlock: Block = {
  slug: 'valueCards',
  interfaceName: 'ValueCardsBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          name: 'icon',
          type: 'text',
          admin: { description: 'Font Awesome icon class, e.g. "fa-shield-heart"' },
        },
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
      ],
    },
  ],
  labels: {
    plural: 'Value Card Sections',
    singular: 'Value Card Section',
  },
}

import type { Block } from 'payload'

export const PopularRangesBlock: Block = {
  slug: 'popularRanges',
  interfaceName: 'PopularRangesBlock',
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Popular Ranges' },
    { name: 'subheading', type: 'text', defaultValue: 'Trusted therapeutic ranges, chosen by our customers.' },
    {
      name: 'ranges',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'category', type: 'relationship', relationTo: 'categories', required: true },
        { name: 'limit', type: 'number', defaultValue: 8 },
      ],
    },
  ],
  labels: {
    plural: 'Popular Range Tabs',
    singular: 'Popular Range Tabs',
  },
}

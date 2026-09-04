import type { Block } from 'payload'

export const FeaturedRailBlock: Block = {
  slug: 'featuredRail',
  interfaceName: 'FeaturedRailBlock',
  fields: [
    { name: 'heading', type: 'text', required: true, defaultValue: 'New Launches' },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Products from this category are shown in the rail.',
      },
    },
    { name: 'limit', type: 'number', defaultValue: 10 },
  ],
  labels: {
    plural: 'Featured Product Rails',
    singular: 'Featured Product Rail',
  },
}

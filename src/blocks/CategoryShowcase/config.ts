import type { Block } from 'payload'

export const CategoryShowcase: Block = {
  slug: 'categoryShowcase',
  interfaceName: 'CategoryShowcaseBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      defaultValue: 'Shop by Category',
    },
    {
      name: 'subheading',
      type: 'text',
      defaultValue: 'Trusted healthcare essentials, sorted the way you shop.',
    },
    {
      name: 'categories',
      type: 'relationship',
      hasMany: true,
      relationTo: 'categories',
      admin: {
        isSortable: true,
      },
    },
  ],
  labels: {
    plural: 'Category Showcases',
    singular: 'Category Showcase',
  },
}

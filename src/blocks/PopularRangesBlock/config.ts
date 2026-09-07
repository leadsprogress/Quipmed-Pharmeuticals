import type { Block } from 'payload'
import { displayOnMobileField } from '@/fields/displayOnMobile'

export const PopularRangesBlock: Block = {
  slug: 'popularRanges',
  interfaceName: 'PopularRangesBlock',
  fields: [
    displayOnMobileField,
    { name: 'heading', type: 'text', defaultValue: 'Popular Ranges' },
    { name: 'subheading', type: 'text', defaultValue: 'Trusted therapeutic ranges, chosen by our customers.' },
    {
      name: 'ranges',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          admin: {
            description:
              'A top-level category (e.g. "Cardiac Range"). Its subcategories are shown when this tab is selected — medicines are never listed directly in this section.',
          },
        },
      ],
    },
  ],
  labels: {
    plural: 'Popular Range Tabs',
    singular: 'Popular Range Tabs',
  },
}

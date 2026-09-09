import type { Block } from 'payload'
import { displayOnMobileField } from '@/fields/displayOnMobile'

export const HealthAndVisitBlock: Block = {
  slug: 'healthAndVisit',
  interfaceName: 'HealthAndVisitBlock',
  fields: [
    displayOnMobileField,
    { name: 'guidesHeading', type: 'text' },
    {
      name: 'guides',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'icon', type: 'text', admin: { description: 'Font Awesome icon class' } },
        { name: 'tag', type: 'text' },
        { name: 'title', type: 'text', required: true },
        { name: 'excerpt', type: 'textarea', required: true },
        {
          name: 'showImage',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show a photo on this card. Uncheck to fall back to the compact icon-only card.',
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Leave blank to show a placeholder photo until you upload a real one.',
            condition: (_, siblingData) => siblingData?.showImage !== false,
          },
        },
      ],
    },
    {
      name: 'visitHeading',
      type: 'text',
      admin: {
        description:
          'The address shown below is pulled automatically from Admin → Footer → Contact.',
      },
    },
  ],
  labels: {
    plural: 'Health & Visit Sections',
    singular: 'Health & Visit Section',
  },
}

import type { Block } from 'payload'

export const HealthAndVisitBlock: Block = {
  slug: 'healthAndVisit',
  interfaceName: 'HealthAndVisitBlock',
  fields: [
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

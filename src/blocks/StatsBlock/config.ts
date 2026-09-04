import type { Block } from 'payload'

export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
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
          admin: { description: 'Font Awesome icon class, e.g. "fa-capsules"' },
        },
        { name: 'value', type: 'number', required: true },
        { name: 'suffix', type: 'text', admin: { description: 'e.g. "+", "%", "-48 hrs"' } },
        { name: 'label', type: 'text', required: true },
      ],
    },
  ],
  labels: {
    plural: 'Stats Bars',
    singular: 'Stats Bar',
  },
}

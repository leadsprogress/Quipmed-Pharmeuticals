import type { Block } from 'payload'
import { displayOnMobileField } from '@/fields/displayOnMobile'

export const TimelineBlock: Block = {
  slug: 'timeline',
  interfaceName: 'TimelineBlock',
  fields: [
    displayOnMobileField,
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Milestone', plural: 'Milestones' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
      ],
    },
  ],
  labels: {
    plural: 'Timelines',
    singular: 'Timeline',
  },
}

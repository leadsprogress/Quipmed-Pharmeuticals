import type { Block } from 'payload'
import { displayOnMobileField } from '@/fields/displayOnMobile'

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    displayOnMobileField,
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}

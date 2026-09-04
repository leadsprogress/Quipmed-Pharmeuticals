import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Shown in the site header. Falls back to the default Amulya Medicals logo if left empty.',
      },
    },
    {
      name: 'searchPlaceholder',
      type: 'text',
      defaultValue: 'Search for products...',
    },
    {
      name: 'navGroups',
      type: 'array',
      label: 'Mega menu groups',
      admin: {
        description:
          'Dropdown groups shown in the header navigation bar, e.g. "Chronic Care" containing the Cardiac and Diabetic categories.',
      },
      maxRows: 6,
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'categories',
          type: 'relationship',
          hasMany: true,
          relationTo: 'categories',
          required: true,
        },
      ],
    },
    {
      name: 'announcementBar',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'text',
          type: 'text',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
        },
        {
          name: 'linkLabel',
          type: 'text',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
        },
        {
          name: 'linkUrl',
          type: 'text',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
  versions: false,
}

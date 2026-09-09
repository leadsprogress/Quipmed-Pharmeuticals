import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { revalidateSettings } from './hooks/revalidateSettings'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'enableDiscountBadges',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Show the "X% off" badge on product cards site-wide. Uncheck to hide it everywhere, even on products that have their own discount badge enabled below.',
      },
    },
  ],
  hooks: {
    afterChange: [revalidateSettings],
  },
  versions: false,
}

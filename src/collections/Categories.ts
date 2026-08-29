import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Square icon/photo shown in the "Shop by category" grid on the homepage.',
      },
    },
    {
      name: 'slug',
      type: 'slug',
      useAsSlug: 'title',
      admin: { position: undefined },
    },
  ],
}

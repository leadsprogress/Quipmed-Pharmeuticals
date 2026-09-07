import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import {
  revalidateProductTag,
  revalidateProductTagDelete,
} from './ProductTags/hooks/revalidateProductTag'

export const ProductTags: CollectionConfig = {
  slug: 'product-tags',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'label',
    group: 'Ecommerce',
    description: 'Badges (e.g. "Bestseller", "New") you can assign to products, shown top-left on product cards.',
  },
  hooks: {
    afterChange: [revalidateProductTag],
    afterDelete: [revalidateProductTagDelete],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'slug',
      useAsSlug: 'label',
      admin: { position: undefined },
    },
  ],
}

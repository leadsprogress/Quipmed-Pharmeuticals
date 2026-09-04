import type { Media, PopularRangesBlock as PopularRangesBlockProps, Product } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { PopularRanges } from '@/components/Home/PopularRanges'

export const PopularRangesBlockComponent: React.FC<
  PopularRangesBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async ({ heading, subheading, ranges }) => {
  const payload = await getPayload({ config: configPromise })

  const resolvedRanges = await Promise.all(
    (ranges || []).map(async (range) => {
      const categoryId = typeof range.category === 'object' && range.category ? range.category.id : range.category

      let products: Product[] = []
      let icon: Media | null = null

      if (categoryId) {
        const [productResult, category] = await Promise.all([
          payload.find({
            collection: 'products',
            depth: 1,
            draft: false,
            limit: range.limit || 8,
            overrideAccess: false,
            where: {
              and: [{ _status: { equals: 'published' } }, { categories: { in: [categoryId] } }],
            },
          }),
          payload.findByID({ collection: 'categories', id: categoryId, depth: 1 }).catch(() => null),
        ])
        products = productResult.docs
        icon = category?.icon && typeof category.icon === 'object' ? category.icon : null
      }

      return { label: range.label, icon, products }
    }),
  )

  return <PopularRanges heading={heading} subheading={subheading} ranges={resolvedRanges} />
}

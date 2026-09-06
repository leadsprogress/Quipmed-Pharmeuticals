import type { Category, Media, PopularRangesBlock as PopularRangesBlockProps } from '@/payload-types'
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

      let subcategories: Category[] = []
      let icon: Media | null = null

      if (categoryId) {
        const [subcategoryResult, category] = await Promise.all([
          payload.find({
            collection: 'categories',
            depth: 1,
            overrideAccess: false,
            limit: 100,
            sort: 'title',
            where: { parent: { equals: categoryId } },
          }),
          payload.findByID({ collection: 'categories', id: categoryId, depth: 1 }).catch(() => null),
        ])
        subcategories = subcategoryResult.docs
        icon = category?.icon && typeof category.icon === 'object' ? category.icon : null
      }

      return { label: range.label, icon, categoryId, subcategories }
    }),
  )

  return <PopularRanges heading={heading} subheading={subheading} ranges={resolvedRanges} />
}

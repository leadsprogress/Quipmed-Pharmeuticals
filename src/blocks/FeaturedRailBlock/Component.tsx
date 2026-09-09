import type { FeaturedRailBlock as FeaturedRailBlockProps, Product } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { FeaturedRail } from '@/components/Home/FeaturedRail'
import { getCachedGlobal } from '@/utilities/getGlobals'

export const FeaturedRailBlockComponent: React.FC<
  FeaturedRailBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async ({ heading, category, limit }) => {
  const categoryId = typeof category === 'object' && category ? category.id : category

  let products: Product[] = []

  if (categoryId) {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit: limit || 10,
      overrideAccess: false,
      where: {
        and: [{ _status: { equals: 'published' } }, { categories: { in: [categoryId] } }],
      },
    })
    products = result.docs
  }

  const settings = await getCachedGlobal('settings', 0)()
  const discountBadgesEnabled = settings?.enableDiscountBadges !== false

  return <FeaturedRail heading={heading} products={products} discountBadgesEnabled={discountBadgesEnabled} />
}

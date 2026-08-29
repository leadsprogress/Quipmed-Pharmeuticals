import type { Category, CategoryShowcaseBlock as CategoryShowcaseBlockProps } from '@/payload-types'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { CategoryShowcaseClient } from './Component.client'

export const CategoryShowcaseBlock: React.FC<
  CategoryShowcaseBlockProps & {
    id?: DefaultDocumentIDType
  }
> = ({ heading, subheading, categories }) => {
  const populatedCategories = (categories ?? []).filter(
    (category): category is Category => typeof category === 'object' && category !== null,
  )

  return (
    <CategoryShowcaseClient heading={heading} subheading={subheading} categories={populatedCategories} />
  )
}

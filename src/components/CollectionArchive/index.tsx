import { cn } from '@/utilities/cn'
import React from 'react'

import type { Product } from '@/payload-types'

import { ProductGridItem } from '@/components/ProductGridItem'

export type Props = {
  posts: Product[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-4 lg:gap-x-8">
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              return (
                <div key={index}>
                  <ProductGridItem product={result} />
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}

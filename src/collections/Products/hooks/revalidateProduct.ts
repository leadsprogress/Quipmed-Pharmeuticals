import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

// The /shop listing query is cached (see getCachedProducts) since it's the one query on the
// site hit with the widest variety of filter/sort/page combinations — tag-based invalidation
// here keeps that cache from ever serving stale price/stock/title data after an edit.
export const revalidateProduct: CollectionAfterChangeHook = ({ req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating products')
    revalidateTag('products', 'max')
  }
}

export const revalidateProductDelete: CollectionAfterDeleteHook = ({ req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating products after delete')
    revalidateTag('products', 'max')
  }
}

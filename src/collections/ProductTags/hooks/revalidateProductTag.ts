import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidateTag } from 'next/cache'

// A tag's label/existence shows up on every product card referencing it — editing or deleting a
// tag here doesn't touch the Products collection itself, so revalidateProduct never fires for it.
export const revalidateProductTag: CollectionAfterChangeHook = ({ req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating products after tag change')
    revalidateTag('products', 'max')
  }
}

export const revalidateProductTagDelete: CollectionAfterDeleteHook = ({
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating products after tag delete')
    revalidateTag('products', 'max')
  }
}

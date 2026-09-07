import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath } from 'next/cache'

// Categories are read on nearly every route (header mega menu, home page, /shop) via cached
// page renders — none of which are the Pages collection itself, so revalidatePage never fires
// for a category edit. Without this, an icon/title/parent change is invisible in production
// until the next deploy, even though it shows immediately in dev (which never caches).
export const revalidateCategory: CollectionAfterChangeHook = ({ req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating categories')
    revalidatePath('/', 'layout')
  }
}

export const revalidateCategoryDelete: CollectionAfterDeleteHook = ({ req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating categories after delete')
    revalidatePath('/', 'layout')
  }
}

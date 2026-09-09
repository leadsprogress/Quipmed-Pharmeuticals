import type { GlobalAfterChangeHook } from 'payload'

import { revalidatePath } from 'next/cache'

// enableDiscountBadges affects every product card sitewide (shop, home rail, related products) —
// same broad-invalidation pattern as Header/Footer, since those cards are spread across pages
// that don't all share one cache tag.
export const revalidateSettings: GlobalAfterChangeHook = ({ doc, req: { context, payload } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info('Revalidating settings')
    revalidatePath('/', 'layout')
  }

  return doc
}

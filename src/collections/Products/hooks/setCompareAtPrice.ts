import type { CollectionBeforeChangeHook } from 'payload'

// "Compare at" price shown crossed out next to the real price on product cards. Only fills in a
// default when the field is empty — an admin's own value (or an intentional blank) is never
// overwritten by a later save that doesn't touch this field, since re-saving with it still empty
// just recomputes the same default from the current price.
export const setCompareAtPrice: CollectionBeforeChangeHook = ({ data }) => {
  if (
    data.compareAtPrice != null ||
    typeof data.priceInINR !== 'number' ||
    data.priceInINR <= 0
  ) {
    return data
  }

  const rupees = data.priceInINR / 100
  const roundedRupees = Math.ceil((rupees * 1.15) / 10) * 10
  data.compareAtPrice = Math.round(roundedRupees * 100)

  return data
}

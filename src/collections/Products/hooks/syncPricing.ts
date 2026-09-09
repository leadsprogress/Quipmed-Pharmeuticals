import type { CollectionBeforeChangeHook } from 'payload'

// compareAtPrice ("was" price, in paise) and discountPercent are two views of the same number —
// this is the single place that keeps them consistent server-side. The admin UI (see
// CompareAtPriceField/DiscountPercentField) already syncs them live as an admin types, so by the
// time a save reaches here both are normally already consistent — this is the safety net for
// API/script writes that only set one of the two, plus the original default-markup behavior when
// neither is set.
const roundToNearestRupee = (paise: number) => Math.round(paise / 100) * 100

function compareAtPriceFromDiscount(priceInINR: number, discountPercent: number): number {
  const raw = priceInINR / (1 - discountPercent / 100)
  return roundToNearestRupee(raw)
}

function discountFromCompareAtPrice(priceInINR: number, compareAtPrice: number): number {
  return Math.round(((compareAtPrice - priceInINR) / compareAtPrice) * 100)
}

export const syncPricing: CollectionBeforeChangeHook = ({ data }) => {
  const price = data.priceInINR
  if (typeof price !== 'number' || price <= 0) return data

  const hasCompareAt = typeof data.compareAtPrice === 'number' && data.compareAtPrice > 0
  const hasDiscount = typeof data.discountPercent === 'number' && data.discountPercent > 0

  if (hasDiscount && !hasCompareAt) {
    data.compareAtPrice = compareAtPriceFromDiscount(price, data.discountPercent)
  } else if (hasCompareAt && !hasDiscount) {
    data.discountPercent = discountFromCompareAtPrice(price, data.compareAtPrice)
  } else if (!hasCompareAt && !hasDiscount) {
    // Nothing set at all yet — same default this collection has always used: +15% over price,
    // rounded up to the nearest ₹10.
    const rupees = price / 100
    const roundedRupees = Math.ceil((rupees * 1.15) / 10) * 10
    data.compareAtPrice = Math.round(roundedRupees * 100)
    data.discountPercent = discountFromCompareAtPrice(price, data.compareAtPrice)
  }
  // If both are already set, trust them as-is — they were either synced live by the admin UI, or
  // deliberately set together by a script/API call.

  return data
}

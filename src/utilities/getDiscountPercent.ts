// Deliberately not a stored field — always derived live from priceInINR/compareAtPrice so it
// can never drift out of sync with either. Gated by two independent switches: the site-wide
// Admin -> Settings toggle (globallyEnabled), and each product's own showDiscountBadge override.
export function getDiscountPercent(
  product: {
    priceInINR?: number | null
    compareAtPrice?: number | null
    showDiscountBadge?: boolean | null
  },
  globallyEnabled: boolean,
): number | null {
  if (!globallyEnabled) return null
  if (product.showDiscountBadge === false) return null
  if (typeof product.priceInINR !== 'number' || typeof product.compareAtPrice !== 'number') {
    return null
  }
  if (product.compareAtPrice <= product.priceInINR) return null

  const percent = Math.round(
    ((product.compareAtPrice - product.priceInINR) / product.compareAtPrice) * 100,
  )

  return percent > 0 ? percent : null
}

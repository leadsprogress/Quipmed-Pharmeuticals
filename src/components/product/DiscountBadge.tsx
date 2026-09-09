import React from 'react'

type Props = {
  percent: number | null
}

// Sits opposite ProductBadges (which anchors tags to top-left) — top-right, so the two never
// collide even when a product has both tags and a discount.
export const DiscountBadge: React.FC<Props> = ({ percent }) => {
  if (!percent) return null

  return (
    <span className="absolute right-2 top-2 z-10 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground shadow-sm">
      {percent}% OFF
    </span>
  )
}

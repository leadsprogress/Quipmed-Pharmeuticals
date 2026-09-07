import React from 'react'

import type { ProductTag } from '@/payload-types'

// Deterministic (not admin-configurable) color per tag, keyed by its position in the list a
// product carries — same convention this codebase already used for category tile colors: no CMS
// color picker needed for a handful of badge styles like "Bestseller"/"New".
const BADGE_COLORS = [
  'bg-primary text-primary-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-accent text-accent-foreground',
  'bg-foreground text-background',
]

const MAX_VISIBLE_BADGES = 2

type Props = {
  tags?: (number | ProductTag)[] | null
}

export const ProductBadges: React.FC<Props> = ({ tags }) => {
  const labels = (tags ?? [])
    .filter((tag): tag is ProductTag => typeof tag === 'object' && tag !== null)
    .slice(0, MAX_VISIBLE_BADGES)

  if (labels.length === 0) return null

  return (
    <div className="absolute left-2 top-2 z-10 flex flex-col items-start gap-1">
      {labels.map((tag, i) => (
        <span
          key={tag.id}
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold shadow-sm ${BADGE_COLORS[i % BADGE_COLORS.length]}`}
        >
          {tag.label}
        </span>
      ))}
    </div>
  )
}

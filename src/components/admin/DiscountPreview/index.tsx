'use client'

import { FieldLabel, useFormFields } from '@payloadcms/ui'
import React from 'react'

// Read-only — there's nothing to persist here. The percentage is always derived from
// priceInINR/compareAtPrice (see src/utilities/getDiscountPercent.ts), so a stored field would
// just be a second copy that can silently go stale the moment either price changes. This
// re-reads both fields live as the admin edits them.
export const DiscountPreview: React.FC = () => {
  const priceInINR = useFormFields(([fields]) => fields.priceInINR?.value) as number | undefined
  const compareAtPrice = useFormFields(([fields]) => fields.compareAtPrice?.value) as
    | number
    | undefined

  const valid =
    typeof priceInINR === 'number' &&
    typeof compareAtPrice === 'number' &&
    compareAtPrice > priceInINR

  const percent = valid
    ? Math.round(((compareAtPrice! - priceInINR!) / compareAtPrice!) * 100)
    : null

  return (
    <div>
      <FieldLabel label="Discount badge" />
      <p style={{ color: percent ? 'var(--theme-success-500, #1a7f37)' : 'var(--theme-elevation-500)' }}>
        {percent ? `${percent}% off` : 'No discount (needs compare-at price higher than price)'}
      </p>
    </div>
  )
}

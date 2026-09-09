'use client'

import { FieldLabel, useFormFields } from '@payloadcms/ui'
import React from 'react'

import './index.css'

// compareAtPrice and discountPercent are two views of the same "was" price — editing either one
// here immediately recomputes the other in the form, before save (see syncPricing.ts for the
// server-side safety net covering API/script writes that only touch one of the two).
export const CompareAtPriceField: React.FC = () => {
  const compareAtPrice = useFormFields(([fields]) => fields.compareAtPrice?.value) as
    | number
    | undefined
  const priceInINR = useFormFields(([fields]) => fields.priceInINR?.value) as number | undefined
  const dispatch = useFormFields(([, dispatchFields]) => dispatchFields)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const nextCompareAtPrice = raw === '' ? undefined : Number(raw)

    dispatch({ type: 'UPDATE', path: 'compareAtPrice', value: nextCompareAtPrice })

    if (
      typeof nextCompareAtPrice === 'number' &&
      typeof priceInINR === 'number' &&
      priceInINR > 0 &&
      nextCompareAtPrice > priceInINR
    ) {
      const discountPercent = Math.round(
        ((nextCompareAtPrice - priceInINR) / nextCompareAtPrice) * 100,
      )
      dispatch({ type: 'UPDATE', path: 'discountPercent', value: discountPercent })
    }
  }

  return (
    <div className="field-type number">
      <FieldLabel label='"Was" price (paise)' />
      <input
        type="number"
        min={0}
        step={1}
        value={compareAtPrice ?? ''}
        onChange={onChange}
        className="linked-pricing-field__input"
        placeholder="e.g. 49900 for ₹499"
      />
      <p className="linked-pricing-field__hint">
        Shown crossed out next to the price on product cards. Leave blank to auto-fill +15% over
        the price when saved. Editing this updates the discount % field below automatically.
      </p>
    </div>
  )
}

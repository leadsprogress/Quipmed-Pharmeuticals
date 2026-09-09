'use client'

import { FieldLabel, useFormFields } from '@payloadcms/ui'
import React from 'react'

import '../CompareAtPriceField/index.css'

const roundToNearestRupee = (paise: number) => Math.round(paise / 100) * 100

// The other half of the compareAtPrice <-> discountPercent link — see CompareAtPriceField.
export const DiscountPercentField: React.FC = () => {
  const discountPercent = useFormFields(([fields]) => fields.discountPercent?.value) as
    | number
    | undefined
  const priceInINR = useFormFields(([fields]) => fields.priceInINR?.value) as number | undefined
  const dispatch = useFormFields(([, dispatchFields]) => dispatchFields)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const nextDiscountPercent = raw === '' ? undefined : Number(raw)

    dispatch({ type: 'UPDATE', path: 'discountPercent', value: nextDiscountPercent })

    if (
      typeof nextDiscountPercent === 'number' &&
      nextDiscountPercent > 0 &&
      nextDiscountPercent < 100 &&
      typeof priceInINR === 'number' &&
      priceInINR > 0
    ) {
      const compareAtPrice = roundToNearestRupee(priceInINR / (1 - nextDiscountPercent / 100))
      dispatch({ type: 'UPDATE', path: 'compareAtPrice', value: compareAtPrice })
    }
  }

  return (
    <div className="field-type number">
      <FieldLabel label="Discount %" />
      <input
        type="number"
        min={0}
        max={99}
        step={1}
        value={discountPercent ?? ''}
        onChange={onChange}
        className="linked-pricing-field__input"
        placeholder="e.g. 15"
      />
      <p className="linked-pricing-field__hint">
        Shown as the "X% off" badge on product cards. Editing this recalculates the "was" price
        above automatically (price ÷ (1 − %), rounded to the nearest rupee).
      </p>
    </div>
  )
}

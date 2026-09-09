'use client'

import { gsap } from 'gsap'
import React, { useLayoutEffect, useRef } from 'react'

import type { Product } from '@/payload-types'
import { FlipProductCard } from './FlipProductCard'

export const ShopGrid: React.FC<{ products: Partial<Product>[]; discountBadgesEnabled?: boolean }> = ({
  products,
  discountBadgesEnabled = true,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('[data-flip-card]', {
        opacity: 0,
        y: 24,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
      })
    }, el)
    return () => ctx.revert()
  }, [products])

  return (
    <div ref={ref} className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
      {products.map((product) => (
        <FlipProductCard key={product.id} product={product} discountBadgesEnabled={discountBadgesEnabled} />
      ))}
    </div>
  )
}

'use client'

import { gsap } from 'gsap'
import React, { useLayoutEffect, useRef } from 'react'

export const ShopHero: React.FC<{ count: number }> = ({ count }) => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('[data-shop-hero-copy]', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out',
      })
      const counter = { value: 0 }
      gsap.to(counter, {
        value: count,
        duration: 1.2,
        delay: 0.2,
        ease: 'power2.out',
        onUpdate: () => {
          const span = el.querySelector('[data-shop-count]')
          if (span) span.textContent = String(Math.round(counter.value))
        },
      })
    }, el)
    return () => ctx.revert()
  }, [count])

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/15 px-8 py-12 text-center"
    >
      <div data-shop-hero-copy>
        <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
          Full Catalog
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Browse Everything We Stock
        </h1>
        <p className="mt-2 text-muted-foreground">
          <span data-shop-count className="font-semibold text-primary">
            0
          </span>{' '}
          products across 15 categories, ready to order.
        </p>
      </div>
    </div>
  )
}

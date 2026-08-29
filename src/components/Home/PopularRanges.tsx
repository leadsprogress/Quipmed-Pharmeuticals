'use client'

import { gsap } from 'gsap'
import React, { useLayoutEffect, useRef, useState } from 'react'

import type { Product } from '@/payload-types'
import { ProductRailCard } from './ProductRailCard'
import { SectionBackdrop } from './SectionBackdrop'

type Range = { label: string; products: Product[] }

export const PopularRanges: React.FC<{ ranges: Range[] }> = ({ ranges }) => {
  const nonEmptyRanges = ranges.filter((r) => r.products.length > 0)
  const [activeIndex, setActiveIndex] = useState(0)
  const gridRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    gsap.fromTo(grid, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
  }, [activeIndex])

  if (!nonEmptyRanges.length) return null

  const active = nonEmptyRanges[activeIndex]

  return (
    <div className="container relative overflow-hidden py-16">
      <SectionBackdrop icon="fa-heart-pulse" side="right" />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Popular Ranges
        </h2>
        <div className="flex flex-wrap gap-2">
          {nonEmptyRanges.map((range, i) => (
            <button
              key={range.label}
              data-cursor-hover
              onClick={() => setActiveIndex(i)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                i === activeIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {active.products.map((product) => (
          <ProductRailCard key={product.id} product={product} fixedWidth={false} />
        ))}
      </div>
    </div>
  )
}

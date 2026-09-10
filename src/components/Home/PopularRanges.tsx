'use client'

import { gsap } from 'gsap'
import Link from 'next/link'
import React, { useLayoutEffect, useRef, useState } from 'react'

import { Media } from '@/components/Media'
import type { Category, Media as MediaType } from '@/payload-types'

type Range = {
  label: string
  icon?: MediaType | null
  categoryId?: number | string | null
  subcategories: Category[]
}

type Props = {
  heading?: string | null
  subheading?: string | null
  ranges: Range[]
}

export const PopularRanges: React.FC<Props> = ({ heading, subheading, ranges }) => {
  const nonEmptyRanges = ranges.filter((r) => r.subcategories.length > 0)
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
    <div className="container py-8 md:py-16">
      <div className="mb-10 text-center">
        <h2 className="font-display text-xl font-semibold tracking-tight md:text-3xl">
          {heading || 'Popular Ranges'}
        </h2>
        {subheading ? <p className="mt-2 text-muted-foreground">{subheading}</p> : null}
      </div>

      <div className="mb-10 grid grid-cols-3 justify-items-center gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-10">
        {nonEmptyRanges.map((range, i) => {
          const isActive = i === activeIndex
          return (
            <button
              key={range.label}
              type="button"
              data-cursor-hover
              onClick={() => setActiveIndex(i)}
              className="flex flex-col items-center gap-2"
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full border-2 bg-muted transition-colors sm:h-20 sm:w-20 ${
                  isActive ? 'border-primary' : 'border-transparent'
                }`}
              >
                <span className="flex h-[85%] w-[85%] items-center justify-center overflow-hidden rounded-full bg-primary-foreground text-muted-foreground">
                  {range.icon ? (
                    <Media resource={range.icon} imgClassName="h-full w-full object-cover" />
                  ) : (
                    <i className="fa-solid fa-capsules text-xl" />
                  )}
                </span>
              </span>
              <span
                className={`text-center text-xs font-medium transition-colors sm:text-sm ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {range.label}
              </span>
            </button>
          )
        })}
      </div>

      <div ref={gridRef} className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {active.subcategories.map((subcategory) => (
          <Link
            key={subcategory.id}
            href={`/shop?category=${subcategory.id}`}
            data-cursor-hover
            className="group flex flex-col items-center gap-3 rounded-xl border border-transparent bg-muted/40 px-3 py-4 text-center transition-colors hover:border-primary/40 hover:bg-muted sm:px-4 sm:py-6"
          >
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary-foreground text-muted-foreground sm:h-20 sm:w-20">
              {subcategory.icon && typeof subcategory.icon === 'object' ? (
                <Media resource={subcategory.icon} imgClassName="h-full w-full object-cover" />
              ) : (
                <i className="fa-solid fa-capsules text-xl" />
              )}
            </span>
            <span className="text-sm font-medium transition-colors group-hover:text-primary">
              {subcategory.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

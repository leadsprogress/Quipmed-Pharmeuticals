'use client'

import { gsap } from 'gsap'
import Link from 'next/link'
import React, { useLayoutEffect, useRef, useState } from 'react'

import type { Category } from '@/payload-types'
import { MEGA_MENU_GROUPS } from './megaMenuGroups'

type Group = {
  label: string
  categories: Category[]
}

export const MegaMenu: React.FC<{ categories: Category[] }> = ({ categories }) => {
  const groups: Group[] = MEGA_MENU_GROUPS.map((g) => ({
    label: g.label,
    categories: categories.filter((c) => g.categoryTitles.includes(c.title)),
  })).filter((g) => g.categories.length > 0)

  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    panelRefs.current.forEach((panel, i) => {
      if (!panel) return
      if (i === openIndex) {
        gsap.fromTo(
          panel,
          { opacity: 0, y: -8, pointerEvents: 'none' },
          { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.25, ease: 'power2.out' },
        )
      } else {
        gsap.to(panel, { opacity: 0, y: -8, pointerEvents: 'none', duration: 0.15, ease: 'power2.in' })
      }
    })
  }, [openIndex])

  if (!groups.length) return null

  return (
    <nav className="hidden border-t border-border md:block">
      <div className="container flex items-center gap-8 py-3">
        {groups.map((group, i) => (
          <div
            key={group.label}
            className="relative"
            onMouseEnter={() => setOpenIndex(i)}
            onMouseLeave={() => setOpenIndex((cur) => (cur === i ? null : cur))}
          >
            <button
              data-cursor-hover
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                openIndex === i ? 'text-primary' : 'text-foreground hover:text-primary'
              }`}
            >
              {group.label}
              <i
                className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-300 ${
                  openIndex === i ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              ref={(el) => {
                panelRefs.current[i] = el
              }}
              className="absolute left-0 top-full z-30 flex w-[22rem] overflow-hidden rounded-2xl border border-border bg-card opacity-0 shadow-xl"
              style={{ pointerEvents: 'none' }}
            >
              <div className="flex-1 p-2">
                {group.categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/shop?category=${category.id}`}
                    data-cursor-hover
                    className="block rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
              <Link
                href="/shop"
                data-cursor-hover
                className="group relative hidden w-28 shrink-0 sm:block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://loremflickr.com/300/300/pharmacy,shop,shelf/all?lock=70"
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/70 to-transparent p-2">
                  <span className="text-xs font-semibold text-background">Shop All</span>
                </div>
              </Link>
            </div>
          </div>
        ))}

        <Link
          href="/shop"
          data-cursor-hover
          className="text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          All Products
        </Link>
      </div>
    </nav>
  )
}

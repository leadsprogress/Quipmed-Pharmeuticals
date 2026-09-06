'use client'

import Link from 'next/link'
import React, { useMemo } from 'react'

import type { Category, Header } from '@/payload-types'
import { buildNavGroups } from './megaMenuGroups'

type Props = {
  categories: Category[]
  navGroups?: Header['navGroups']
}

// Plain CSS hover (group/group-hover) instead of JS-driven state + GSAP — a hover flyout only
// needs to track the browser's own :hover state, and letting the browser own that avoids the
// menu ever getting stuck open/closed from a missed mouseenter/mouseleave or an interrupted
// animation tween.
export const MegaMenu: React.FC<Props> = ({ categories, navGroups }) => {
  const groups = useMemo(() => buildNavGroups(categories, navGroups), [categories, navGroups])

  if (!groups.length) return null

  return (
    <nav className="hidden border-t border-border md:block">
      <div className="container flex items-center gap-8 py-3">
        {groups.map((group) => (
          <div key={group.label} className="group relative">
            <button
              data-cursor-hover
              className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors group-hover:text-primary"
            >
              {group.label}
              <i className="fa-solid fa-chevron-down text-[10px] transition-transform duration-200 group-hover:rotate-180" />
            </button>

            <div className="invisible absolute left-0 top-full z-30 flex w-[22rem] -translate-y-1 overflow-hidden rounded-2xl border border-border bg-card opacity-0 shadow-xl transition-all duration-200 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="flex-1 space-y-1 p-3">
                {group.categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/shop?category=${category.id}`}
                    data-cursor-hover
                    className="block rounded-xl px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
              <Link
                href="/shop"
                data-cursor-hover
                className="group/shopall relative hidden w-28 shrink-0 sm:block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://loremflickr.com/300/300/pharmacy,shop,shelf/all?lock=70"
                  alt=""
                  aria-hidden
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/shopall:scale-110"
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

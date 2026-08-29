'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Link from 'next/link'
import React, { useLayoutEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

type Tile = {
  heading: string
  subheading?: string | null
  tone?: 'primary' | 'secondary' | 'accent' | null
  linkLabel?: string | null
  linkUrl?: string | null
}

const TONE_CLASSES: Record<string, string> = {
  primary: 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground',
  secondary: 'bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground',
  accent: 'bg-accent text-accent-foreground',
}

export const PromoTilesClient: React.FC<{ tiles: Tile[] }> = ({ tiles }) => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from('[data-promo-tile]', {
        opacity: 0,
        scale: 0.96,
        y: 20,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  if (!tiles?.length) return null

  return (
    <div className="container py-12" ref={ref}>
      <div className={`grid gap-6 ${tiles.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {tiles.map((tile, i) => (
          <div
            data-promo-tile
            key={i}
            className={`relative overflow-hidden rounded-3xl p-8 md:p-10 ${TONE_CLASSES[tile.tone ?? 'primary']}`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10"
            />
            <div className="relative max-w-sm">
              <h3 className="text-2xl font-semibold md:text-3xl">{tile.heading}</h3>
              {tile.subheading && <p className="mt-2 opacity-90">{tile.subheading}</p>}
              {tile.linkLabel && tile.linkUrl && (
                <Link
                  href={tile.linkUrl}
                  className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition-transform hover:scale-105"
                >
                  {tile.linkLabel}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

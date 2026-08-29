'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import React, { useLayoutEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

type Item = { title: string; subtitle?: string | null }

const ICONS = ['fa-shield-heart', 'fa-tag', 'fa-truck-fast', 'fa-credit-card']

const BADGE_COLORS = [
  'bg-primary/10 text-primary',
  'bg-secondary/15 text-secondary',
  'bg-primary/10 text-primary',
  'bg-secondary/15 text-secondary',
]

export const TrustBarClient: React.FC<{ items: Item[] }> = ({ items }) => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from('[data-trust-item]', {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="border-y border-border bg-muted/60">
      <div className="container grid grid-cols-2 gap-6 py-8 md:grid-cols-4 md:gap-4">
        {items.map((item, i) => (
          <div
            data-trust-item
            key={i}
            className="group flex items-center gap-3 text-left transition-transform duration-300 hover:-translate-y-0.5"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${BADGE_COLORS[i % BADGE_COLORS.length]}`}
            >
              <i className={`fa-solid ${ICONS[i % ICONS.length]}`} />
            </span>
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

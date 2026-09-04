'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import React, { useLayoutEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_VALUES = [
  {
    icon: 'fa-shield-heart',
    title: 'Genuine, Always',
    body: 'Every product we list is sourced directly from authorized distributors — no grey-market stock, ever.',
  },
  {
    icon: 'fa-tag',
    title: 'Fair Pricing',
    body: 'We keep margins transparent so customers get a fair deal on every order.',
  },
  {
    icon: 'fa-truck-fast',
    title: 'Reliable Delivery',
    body: 'Consistent 24-48 hour delivery windows across Hyderabad, tracked from dispatch to doorstep.',
  },
]

type Props = {
  items?: { icon?: string | null; title: string; body: string }[]
}

export const ValueCards: React.FC<Props> = ({ items }) => {
  const VALUES = items && items.length > 0 ? items : DEFAULT_VALUES
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.from('[data-value-card]', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 80%' },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="container py-8">
      <div className="grid gap-6 md:grid-cols-3">
        {VALUES.map((v, i) => (
          <div
            data-value-card
            key={v.title}
            className="group rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-lg"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-12 ${
                i % 2 === 0 ? 'bg-primary/10 text-primary' : 'bg-secondary/15 text-secondary'
              }`}
            >
              <i className={`fa-solid ${v.icon} text-lg`} />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

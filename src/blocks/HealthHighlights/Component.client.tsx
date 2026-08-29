'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import React, { useLayoutEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

type Card = { title: string; excerpt?: string | null; tag?: string | null }

const TAG_COLORS = ['bg-primary/10 text-primary', 'bg-secondary/15 text-secondary']

export const HealthHighlightsClient: React.FC<{ heading?: string | null; cards: Card[] }> = ({
  heading,
  cards,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from('[data-highlight-card]', {
        opacity: 0,
        y: 28,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 78%',
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div className="container py-16" ref={ref}>
      {heading && <h2 className="mb-8 text-2xl font-semibold tracking-tight md:text-3xl">{heading}</h2>}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div
            data-highlight-card
            key={i}
            className="group rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-lg"
          >
            {card.tag && (
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {card.tag}
              </span>
            )}
            <h3 className="mt-4 text-lg font-semibold leading-snug">{card.title}</h3>
            {card.excerpt && <p className="mt-2 text-sm text-muted-foreground">{card.excerpt}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

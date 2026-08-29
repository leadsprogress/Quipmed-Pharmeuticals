'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import React, { useLayoutEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

const STATS = [
  { icon: 'fa-capsules', value: 290, suffix: '+', label: 'Products in catalog' },
  { icon: 'fa-layer-group', value: 15, suffix: '', label: 'Therapeutic ranges' },
  { icon: 'fa-truck-fast', value: 24, suffix: '-48 hrs', label: 'Delivery window' },
  { icon: 'fa-shield-heart', value: 100, suffix: '%', label: 'Genuine, sourced directly' },
]

export const StatsBar: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from('[data-stat-card]', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 80%' },
      })

      gsap.utils.toArray<HTMLElement>('[data-stat-value]').forEach((node) => {
        const target = Number(node.dataset.statValue)
        const counter = { value: 0 }
        gsap.to(counter, {
          value: target,
          duration: 1.3,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 80%' },
          onUpdate: () => {
            node.textContent = String(Math.round(counter.value))
          },
        })
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="container py-16">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map((stat, i) => (
          <div
            data-stat-card
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-6 text-center"
          >
            <i
              className={`fa-solid ${stat.icon} text-2xl ${
                i % 2 === 0 ? 'text-primary' : 'text-secondary'
              }`}
            />
            <p className="mt-3 text-3xl font-bold">
              <span data-stat-value={stat.value}>0</span>
              {stat.suffix}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

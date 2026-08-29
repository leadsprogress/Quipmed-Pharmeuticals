'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import React, { useLayoutEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

const MILESTONES = [
  {
    title: 'Our Story',
    body: '[Placeholder: replace with the real founding story — when Amulya Medicals opened its doors in Bhagyanagar Colony, Hyderabad.]',
  },
  {
    title: 'Building the Catalog',
    body: '[Placeholder: how the in-store range grew — manufacturer partnerships, therapeutic ranges added over time.]',
  },
  {
    title: 'Going Online',
    body: 'Bringing the same trusted, in-store catalog to a wider audience across Hyderabad — genuine products, delivered.',
  },
]

export const Timeline: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      const line = el.querySelector('[data-timeline-line]')
      if (line) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top',
            scrollTrigger: {
              trigger: el,
              start: 'top 60%',
              end: 'bottom 80%',
              scrub: true,
            },
          },
        )
      }

      gsap.utils.toArray<HTMLElement>('[data-milestone]').forEach((node) => {
        gsap.from(node, {
          opacity: 0,
          x: -24,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: node, start: 'top 80%' },
        })
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="relative">
      <div
        data-timeline-line
        aria-hidden
        className="absolute left-[7px] top-2 h-full w-0.5 bg-primary/30 md:left-[9px]"
      />
      <div className="space-y-10">
        {MILESTONES.map((milestone) => (
          <div data-milestone key={milestone.title} className="relative pl-8 md:pl-10">
            <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-primary bg-background md:h-5 md:w-5" />
            <h3 className="text-lg font-semibold">{milestone.title}</h3>
            <p className="mt-2 text-muted-foreground">{milestone.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

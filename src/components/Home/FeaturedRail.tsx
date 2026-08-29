'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import React, { useLayoutEffect, useRef } from 'react'

import type { Product } from '@/payload-types'
import { ProductRailCard } from './ProductRailCard'
import { SectionBackdrop } from './SectionBackdrop'

gsap.registerPlugin(ScrollTrigger)

export const FeaturedRail: React.FC<{ heading: string; products: Product[] }> = ({
  heading,
  products,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 768px)', () => {
        const scrollDistance = track.scrollWidth - section.clientWidth
        if (scrollDistance <= 0) return

        const tween = gsap.to(track, {
          x: -scrollDistance,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${track.scrollWidth - section.clientWidth}`,
            scrub: true,
            pin: true,
            invalidateOnRefresh: true,
            refreshPriority: 1,
          },
        })

        return () => {
          tween.scrollTrigger?.kill()
          tween.kill()
        }
      })

      return () => mm.revert()
    }, section)

    return () => ctx.revert()
  }, [products])

  if (!products.length) return null

  return (
    <div ref={sectionRef} className="relative overflow-hidden py-16">
      <SectionBackdrop icon="fa-capsules" side="left" />
      <div className="container mb-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{heading}</h2>
      </div>
      <div ref={trackRef} className="flex gap-5 px-4 md:px-[max(1rem,calc((100vw-80rem)/2+1rem))]">
        {products.map((product) => (
          <ProductRailCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

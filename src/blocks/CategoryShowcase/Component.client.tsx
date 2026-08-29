'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Link from 'next/link'
import React, { useLayoutEffect, useRef } from 'react'

import { Media } from '@/components/Media'
import type { Category } from '@/payload-types'

gsap.registerPlugin(ScrollTrigger)

const TILE_COLORS = [
  'bg-primary/10 text-primary',
  'bg-secondary/15 text-secondary',
  'bg-accent text-accent-foreground',
]

const CATEGORY_ICONS: Record<string, string> = {
  'cardiac range': 'fa-heart-pulse',
  'diabetic range': 'fa-droplet',
  'orthopedic range': 'fa-bone',
  'other critical range': 'fa-briefcase-medical',
  'injectable range': 'fa-syringe',
  opthalmic: 'fa-eye',
  antibiotics: 'fa-capsules',
  'antiinflammatory & analgesics': 'fa-tablets',
  'pediatric range': 'fa-baby',
  dermatology: 'fa-hand-dots',
  'supplements & immunity booster': 'fa-shield-virus',
  'respiratory & anti-allergics': 'fa-lungs',
  'ayurvedic & herbal': 'fa-leaf',
  gynecologist: 'fa-venus',
  'new launches': 'fa-star',
}

function iconForCategory(title?: string | null): string {
  if (!title) return 'fa-pills'
  return CATEGORY_ICONS[title.toLowerCase()] ?? 'fa-pills'
}

// A single vetted, on-brand pharmacy photo reused across every tile's hover reveal — sampling a
// unique image per category via random keyword search proved unreliable (returned unrelated
// stock photos for several categories).
const CATEGORY_HOVER_IMAGE = 'https://loremflickr.com/300/300/pharmacy,shop,shelf/all?lock=70'

type Props = {
  heading?: string | null
  subheading?: string | null
  categories: Category[]
}

export const CategoryShowcaseClient: React.FC<Props> = ({ heading, subheading, categories }) => {
  const sectionRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.from('[data-category-heading]', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
        },
      })

      gsap.from('[data-category-tile]', {
        opacity: 0,
        y: 32,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
        },
      })
    }, section)

    return () => ctx.revert()
  }, [])

  if (!categories?.length) return null

  return (
    <section className="container py-16" ref={sectionRef}>
      <div data-category-heading className="mb-10 text-center">
        {heading && <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{heading}</h2>}
        {subheading && <p className="mt-3 text-muted-foreground">{subheading}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
        {categories.map((category, i) => (
          <Link
            data-category-tile
            data-cursor-hover
            key={category.id}
            href={`/shop?category=${category.id}`}
            className="group flex flex-col items-center gap-3 rounded-2xl p-3 text-center transition-transform duration-300 hover:-translate-y-1"
          >
            <div
              className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-full shadow-sm transition-shadow duration-300 group-hover:shadow-lg ${
                category.icon && typeof category.icon === 'object' ? 'bg-muted' : TILE_COLORS[i % TILE_COLORS.length]
              }`}
            >
              {category.icon && typeof category.icon === 'object' ? (
                <Media
                  resource={category.icon}
                  imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={CATEGORY_HOVER_IMAGE}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/50"
                  />
                  <i
                    className={`fa-solid ${iconForCategory(category.title)} relative z-10 text-2xl transition-all duration-300 group-hover:scale-110 group-hover:text-white`}
                  />
                </>
              )}
            </div>
            <span className="text-sm font-medium leading-tight">{category.title}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

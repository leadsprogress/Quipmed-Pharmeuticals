'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Link from 'next/link'
import React, { useLayoutEffect, useRef } from 'react'

import { Media } from '@/components/Media'
import type { Category } from '@/payload-types'

gsap.registerPlugin(ScrollTrigger)

// Background tint (revealed on hover, once the photo/overlay fade out) paired with a matching
// icon color for that same state — index-matched, not derived, so Tailwind's static scanner sees
// every full class name literally in this file.
const TILE_BG = ['bg-primary/10', 'bg-secondary/15', 'bg-accent']
const TILE_ICON_HOVER_COLOR = ['group-hover:text-primary', 'group-hover:text-secondary', 'group-hover:text-accent-foreground']

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

// Fallback used until a category has its own photo uploaded in Admin → Categories → Icon —
// sampling a unique image per category via random keyword search proved unreliable (returned
// unrelated stock photos for several categories), so every category shares this one until real
// photography is uploaded.
const CATEGORY_FALLBACK_IMAGE = 'https://loremflickr.com/300/300/pharmacy,shop,shelf/all?lock=70'

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
      // No ScrollTrigger — this section sits right below the hero, so it's usually already
      // visible on load (same convention as Hero's [data-hero-copy]); a scroll-gated reveal
      // here left the heading invisible until the user scrolled.
      gsap.from('[data-category-heading]', {
        opacity: 0,
        y: 24,
        duration: 0.6,
        ease: 'power3.out',
      })

      // Plain fade, no vertical offset — a y-offset entrance here previously risked tiles
      // getting stuck mid-transition (misaligned) if ScrollTrigger's measured position drifted
      // once photos finished loading and shifted the section's height.
      gsap.from('[data-category-tile]', {
        opacity: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: 'power2.out',
        clearProps: 'opacity',
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
    <section className="container pb-16 pt-4" ref={sectionRef}>
      <div data-category-heading className="mb-10 text-center">
        {heading && <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{heading}</h2>}
        {subheading && <p className="mt-3 text-muted-foreground">{subheading}</p>}
      </div>

      <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-8">
        {categories.map((category, i) => {
          const photo =
            category.icon && typeof category.icon === 'object' ? category.icon : null
          const bg = TILE_BG[i % TILE_BG.length]
          const iconHoverColor = TILE_ICON_HOVER_COLOR[i % TILE_ICON_HOVER_COLOR.length]

          return (
            <Link
              data-category-tile
              data-cursor-hover
              key={category.id}
              href={`/shop?category=${category.id}`}
              className="group flex basis-[calc((100%-2rem)/3)] flex-col items-center gap-3 rounded-2xl p-3 text-center transition-transform duration-300 hover:-translate-y-1 md:basis-[calc((100%-3rem)/4)] lg:basis-[calc((100%-7rem)/8)]"
            >
              <div
                className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-full shadow-sm transition-shadow duration-300 group-hover:shadow-lg ${bg}`}
              >
                {/* Photo — the category's own uploaded image if there is one, otherwise a shared
                    placeholder. Visible by default, fades out on hover to reveal the plain tile
                    color underneath. */}
                {photo ? (
                  <Media
                    resource={photo}
                    fill
                    imgClassName="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={CATEGORY_FALLBACK_IMAGE}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                  />
                )}

                {/* Dark scrim over the photo so the icon reads clearly by default — fades out
                    together with the photo on hover. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-black/45 transition-opacity duration-500 group-hover:opacity-0"
                />

                <i
                  className={`fa-solid ${iconForCategory(category.title)} relative z-10 text-lg text-white transition-all duration-300 group-hover:scale-110 sm:text-2xl ${iconHoverColor}`}
                />
              </div>
              <span className="flex min-h-[2.5rem] items-start text-xs font-medium leading-tight sm:text-sm">
                {category.title}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

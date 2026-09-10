'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Link from 'next/link'
import React, { useLayoutEffect, useRef } from 'react'

import { Media } from '@/components/Media'
import type { Category } from '@/payload-types'

gsap.registerPlugin(ScrollTrigger)

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
        {heading && (
          <h2 className="text-xl font-semibold tracking-tight sm:text-3xl md:text-4xl">{heading}</h2>
        )}
        {subheading && (
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{subheading}</p>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-8">
        {categories.map((category) => {
          const photo =
            category.icon && typeof category.icon === 'object' ? category.icon : null

          return (
            <Link
              data-category-tile
              data-cursor-hover
              key={category.id}
              href={`/shop?category=${category.id}`}
              className="group flex min-w-0 basis-[calc((100%-2rem)/3)] flex-col items-center gap-2 rounded-2xl p-1 text-center transition-transform duration-300 hover:-translate-y-1 sm:gap-3 sm:p-3 md:basis-[calc((100%-3rem)/4)] lg:basis-[calc((100%-7rem)/8)]"
            >
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-muted shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
                {/* Photo — the category's own uploaded image if there is one, otherwise a shared
                    placeholder. Desaturates on hover instead of fading away. */}
                {photo ? (
                  <Media
                    resource={photo}
                    fill
                    imgClassName="absolute inset-0 h-full w-full object-cover grayscale-0 transition-all duration-500 group-hover:grayscale"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={CATEGORY_FALLBACK_IMAGE}
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover grayscale-0 transition-all duration-500 group-hover:grayscale"
                  />
                )}
              </div>
              <span className="flex min-h-[2.5rem] w-full items-start justify-center break-words text-xs font-medium leading-tight sm:text-sm">
                {category.title}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

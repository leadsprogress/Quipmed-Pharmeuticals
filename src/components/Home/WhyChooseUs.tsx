'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import React, { useLayoutEffect, useRef } from 'react'

import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'
import { SectionBackdrop } from './SectionBackdrop'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_ROWS = [
  {
    title: 'Sourced Directly, Never Grey-Market',
    body: 'Every product on our shelves comes straight from authorized distributors — no exceptions.',
    image: 'https://loremflickr.com/800/600/pharmacy,shop,shelf/all?lock=70',
    icon: 'fa-shield-heart',
  },
  {
    title: 'Delivered Fast, Tracked Fully',
    body: 'Order before 6pm and get same-day dispatch across Hyderabad, with live tracking on every order.',
    image: 'https://loremflickr.com/800/600/pharmacy,shop,shelf/all?lock=80',
    icon: 'fa-truck-fast',
  },
  {
    title: 'A Team That Knows Your Order',
    body: 'Our in-store pharmacists review every prescription upload personally before it ships.',
    image: 'https://loremflickr.com/800/600/capsules,tablets/all?lock=33',
    icon: 'fa-user-doctor',
  },
]

type Row = {
  title: string
  body: string
  image?: MediaType | number | string | null
  icon?: string | null
}

type Props = {
  heading?: string | null
  rows?: Row[] | null
}

export const WhyChooseUs: React.FC<Props> = ({ heading, rows }) => {
  // Fall back per-row (not just when the whole array is empty) since the CMS `image` field is a
  // real upload — until an editor uploads a photo for a row, keep showing a placeholder image
  // rather than a broken <img>.
  const ROWS = (rows && rows.length > 0 ? rows : DEFAULT_ROWS).map((row, i) => ({
    ...row,
    image: row.image ?? DEFAULT_ROWS[i % DEFAULT_ROWS.length].image,
  }))
  const sectionRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-why-row]').forEach((row) => {
        const image = row.querySelector('[data-why-image]')
        const copy = row.querySelector('[data-why-copy]')

        if (image) {
          gsap.to(image, {
            yPercent: -12,
            ease: 'none',
            scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true },
          })
        }
        if (copy) {
          gsap.from(copy, {
            opacity: 0,
            y: 30,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 75%' },
          })
        }
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <div className="container py-16" ref={sectionRef}>
      <h2 className="mb-12 font-display text-2xl font-semibold tracking-tight md:text-3xl">
        {heading || 'Why Choose Amulya Medicals'}
      </h2>
      <div className="space-y-20">
        {ROWS.map((row, i) => (
          <div
            data-why-row
            key={row.title}
            className={`relative grid items-center gap-8 overflow-hidden md:grid-cols-2 ${i % 2 === 1 ? 'md:[direction:rtl]' : ''}`}
          >
            <SectionBackdrop icon={row.icon || 'fa-capsules'} side={i % 2 === 1 ? 'left' : 'right'} />
            <div data-why-image className="relative overflow-hidden rounded-3xl [direction:ltr]">
              {row.image && typeof row.image === 'object' ? (
                <Media
                  resource={row.image}
                  imgClassName="h-80 w-full scale-110 object-cover"
                  width={800}
                  height={600}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={typeof row.image === 'string' ? row.image : undefined}
                  alt={row.title}
                  width={800}
                  height={600}
                  className="h-80 w-full scale-110 object-cover"
                />
              )}
            </div>
            <div data-why-copy className="relative [direction:ltr]">
              <h3 className="font-display text-xl font-semibold md:text-2xl">{row.title}</h3>
              <p className="mt-3 text-muted-foreground">{row.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

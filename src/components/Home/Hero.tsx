'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Link from 'next/link'
import React, { useLayoutEffect, useRef } from 'react'

import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'
import { SectionBackdrop } from './SectionBackdrop'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_TRUST_ITEMS = [
  { icon: 'fa-shield-heart', title: 'Genuine Products', subtitle: '100% authentic, sourced directly' },
  { icon: 'fa-tag', title: 'Fair Pricing', subtitle: 'Honest prices on every order' },
  { icon: 'fa-truck-fast', title: 'Fast Delivery', subtitle: 'Across Hyderabad in 24-48 hours' },
  { icon: 'fa-credit-card', title: 'Easy Payments', subtitle: 'Secure checkout, multiple options' },
]

type Props = {
  eyebrow?: string | null
  heading?: string | null
  subtext?: string | null
  primaryCtaLabel?: string | null
  primaryCtaUrl?: string | null
  image?: MediaType | number | string | null
  statValue?: number | null
  statSuffix?: string | null
  statLabel?: string | null
  trustItems?: { icon?: string | null; title: string; subtitle?: string | null }[] | null
}

export const Hero: React.FC<Props> = ({
  eyebrow,
  heading,
  subtext,
  primaryCtaLabel,
  primaryCtaUrl,
  image,
  statValue,
  statSuffix,
  statLabel,
  trustItems,
}) => {
  const TRUST_ITEMS = trustItems && trustItems.length > 0 ? trustItems : DEFAULT_TRUST_ITEMS
  const rootRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      gsap.from('[data-hero-copy]', {
        opacity: 0,
        y: 24,
        duration: 0.7,
        ease: 'power3.out',
      })
      gsap.from('[data-trust-item]', {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.08,
        delay: 0.3,
        ease: 'power2.out',
      })
      gsap.to('[data-hero-blob]', {
        y: 24,
        x: 12,
        duration: 6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })

      gsap.utils.toArray<HTMLElement>('[data-count-to]').forEach((el) => {
        const target = Number(el.dataset.countTo)
        const suffix = el.dataset.countSuffix ?? ''
        const counter = { value: 0 }
        gsap.to(counter, {
          value: target,
          duration: 1.4,
          delay: 0.3,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${Math.round(counter.value)}${suffix}`
          },
        })
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div className="relative overflow-hidden pb-4 pt-4" ref={rootRef}>
      <div
        data-hero-blob
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        data-hero-blob
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"
      />
      <SectionBackdrop icon="fa-mortar-pestle" side="right" />

      <div className="container relative grid gap-6 md:grid-cols-[3fr_2fr] md:items-center md:gap-10 md:overflow-hidden">
        <div data-hero-copy>
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary sm:px-4 sm:text-xs">
            {eyebrow || 'Your neighbourhood pharmacy, online'}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {heading || 'Genuine Products, Delivered to Your Door'}
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground md:text-base">
            {subtext ||
              'Amulya Medicals brings its trusted in-store catalog online — cardiac, diabetic, orthopedic and everyday essentials, delivered fast across Hyderabad.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-4">
            <Link
              href={primaryCtaUrl || '/shop'}
              data-cursor-hover
              className="rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-105 sm:px-6 sm:py-3 sm:text-sm"
            >
              {primaryCtaLabel || 'Shop Now'}
            </Link>
          </div>
        </div>

        <div
          data-hero-copy
          className="relative hidden md:block md:h-[280px] md:min-h-0 md:overflow-hidden"
        >
          <div className="aspect-[16/10] w-full overflow-hidden rounded-3xl shadow-xl md:aspect-auto md:h-full">
            {image && typeof image === 'object' ? (
              <Media
                resource={image}
                imgClassName="h-full w-full object-cover"
                width={1080}
                height={1350}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="https://loremflickr.com/1080/1350/pharmacy,shop,shelf/all?lock=55"
                alt="Pharmacy counter"
                width={1080}
                height={1350}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="absolute bottom-4 left-4 rounded-2xl bg-card p-4 shadow-lg">
            <p className="text-xl font-bold text-primary sm:text-2xl">
              <span data-count-to={statValue ?? 290} data-count-suffix={statSuffix ?? '+'}>
                0
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{statLabel || 'Products in catalog'}</p>
          </div>
        </div>
      </div>

      <div className="container mb-4 mt-4 hidden grid-cols-2 gap-4 md:mb-6 md:mt-6 md:grid md:grid-cols-4">
        {TRUST_ITEMS.map((item, i) => (
          <div data-trust-item key={item.title} className="flex items-center gap-3 text-left">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                i % 2 === 0 ? 'bg-primary/10 text-primary' : 'bg-secondary/15 text-secondary'
              }`}
            >
              <i className={`fa-solid ${item.icon}`} />
            </span>
            <div>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

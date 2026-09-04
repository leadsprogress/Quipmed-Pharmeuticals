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
  secondaryCtaLabel?: string | null
  secondaryCtaUrl?: string | null
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
  secondaryCtaLabel,
  secondaryCtaUrl,
  image,
  statValue,
  statSuffix,
  statLabel,
  trustItems,
}) => {
  const TRUST_ITEMS = trustItems && trustItems.length > 0 ? trustItems : DEFAULT_TRUST_ITEMS
  const rootRef = useRef<HTMLDivElement>(null)
  const imageWrapRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    const imageWrap = imageWrapRef.current
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

      if (imageWrap) {
        gsap.to(imageWrap, {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      }

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
    <div className="relative overflow-hidden pt-4" ref={rootRef}>
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

      <div className="container relative grid gap-10 pb-8 pt-16 md:grid-cols-2 md:items-center md:pt-24">
        <div data-hero-copy>
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
            {eyebrow || 'Your neighbourhood pharmacy, online'}
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {heading || 'Genuine Products, Delivered to Your Door'}
          </h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            {subtext ||
              'Amulya Medicals brings its trusted in-store catalog online — cardiac, diabetic, orthopedic and everyday essentials, delivered fast across Hyderabad.'}
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href={primaryCtaUrl || '/shop'}
              data-cursor-hover
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:scale-105"
            >
              {primaryCtaLabel || 'Shop Now'}
            </Link>
            <Link
              href={secondaryCtaUrl || '/contact'}
              data-cursor-hover
              className="rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {secondaryCtaLabel || 'Upload Prescription'}
            </Link>
          </div>
        </div>

        <div data-hero-copy className="relative hidden md:block">
          <div ref={imageWrapRef} className="overflow-hidden rounded-3xl shadow-xl">
            {image && typeof image === 'object' ? (
              <Media
                resource={image}
                imgClassName="h-[420px] w-full object-cover"
                width={900}
                height={700}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="https://loremflickr.com/900/700/pharmacy,shop,shelf/all?lock=55"
                alt="Pharmacy counter"
                width={900}
                height={700}
                className="h-[420px] w-full object-cover"
              />
            )}
          </div>
          <div className="absolute -bottom-6 -left-6 rounded-2xl bg-card p-4 shadow-lg">
            <p className="text-2xl font-bold text-primary">
              <span data-count-to={statValue ?? 290} data-count-suffix={statSuffix ?? '+'}>
                0
              </span>
            </p>
            <p className="text-xs text-muted-foreground">{statLabel || 'Products in catalog'}</p>
          </div>
        </div>
      </div>

      <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        {TRUST_ITEMS.map((item, i) => (
          <div data-trust-item key={item.title} className="flex items-center gap-3 text-left">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
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

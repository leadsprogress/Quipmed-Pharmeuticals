'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Link from 'next/link'
import React, { useLayoutEffect, useRef } from 'react'

import { getWhatsAppUrl } from '@/utilities/getWhatsAppUrl'

gsap.registerPlugin(ScrollTrigger)

const DEFAULT_GUIDES = [
  {
    icon: 'fa-droplet',
    title: 'Managing Diabetes Day to Day',
    excerpt: 'Simple habits — diet, monitoring and timing — that make a real difference.',
    tag: 'Diabetic Care',
  },
  {
    icon: 'fa-heart-pulse',
    title: 'Heart Health After 40',
    excerpt: 'What routine screening actually catches, and why consistency beats intensity.',
    tag: 'Cardiac Care',
  },
  {
    icon: 'fa-file-prescription',
    title: 'Reading Your Prescription Correctly',
    excerpt: 'Dosage, timing and interaction warnings — what the label is telling you.',
    tag: 'Patient Guide',
  },
  {
    icon: 'fa-bone',
    title: 'Joint Pain: When to See a Doctor',
    excerpt: 'Everyday aches versus warning signs that need an orthopedic consult.',
    tag: 'Orthopedic Care',
  },
]

type Props = {
  guidesHeading?: string | null
  guides?: { icon?: string | null; title: string; excerpt: string; tag?: string | null }[] | null
  visitHeading?: string | null
  visitAddress?: string | null
  mapEmbedUrl?: string | null
  whatsappNumber?: string | null
}

export const HealthAndVisit: React.FC<Props> = ({
  guidesHeading,
  guides,
  visitHeading,
  visitAddress,
  mapEmbedUrl,
  whatsappNumber,
}) => {
  const GUIDES = guides && guides.length > 0 ? guides : DEFAULT_GUIDES
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from('[data-guide-card]', {
        opacity: 0,
        y: 28,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 78%' },
      })
      gsap.from('[data-visit-card]', {
        opacity: 0,
        y: 28,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: '[data-visit-card]', start: 'top 80%' },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref}>
      <div className="container py-8 md:py-16">
        <h2 className="mb-8 font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {guidesHeading || 'Health & Wellness Guides'}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDES.map((card, i) => (
            <div
              data-guide-card
              key={card.title}
              data-cursor-hover
              className="group rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    i % 2 === 0 ? 'bg-primary/10 text-primary' : 'bg-secondary/15 text-secondary'
                  }`}
                >
                  {card.tag}
                </span>
                <i
                  className={`fa-solid ${card.icon || 'fa-notes-medical'} text-lg text-muted-foreground transition-transform duration-500 group-hover:rotate-12`}
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-snug">{card.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{card.excerpt}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container pb-10 md:pb-20">
        <div
          data-visit-card
          className="grid gap-8 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 md:grid-cols-2 md:p-12"
        >
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {visitHeading || 'Visit Us'}
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              {visitAddress ||
                'Amulya Medicals, Bhagyanagar Colony, Hyderabad. [Exact address, phone number and store hours to be confirmed.]'}
            </p>
            <Link
              href={getWhatsAppUrl(whatsappNumber)}
              target={whatsappNumber ? '_blank' : undefined}
              rel={whatsappNumber ? 'noopener noreferrer' : undefined}
              data-cursor-hover
              className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              Get in Touch
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl bg-card/60">
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                title="Amulya Medicals location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0 md:h-full md:min-h-[280px]"
              />
            ) : (
              <div className="flex h-64 items-center justify-center p-4 text-center md:h-full md:p-8">
                <div>
                  <i className="fa-solid fa-location-dot text-4xl text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Map — pending confirmed address in Admin → Footer → Contact
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

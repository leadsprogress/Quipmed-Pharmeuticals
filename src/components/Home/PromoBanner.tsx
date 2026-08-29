'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Link from 'next/link'
import React, { useLayoutEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

export const PromoBanner: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const image = imageRef.current
    const overlay = overlayRef.current
    const content = contentRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 768px)', () => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=100%',
            pin: true,
            pinSpacing: true,
            scrub: true,
            refreshPriority: 1,
          },
        })

        // The image is statically oversized (scale-125, see JSX) so it always overscans the
        // frame — only ever translating it, never scaling it down to exactly 1:1, means it can
        // never expose an edge no matter where scroll lands.
        if (image) {
          timeline.fromTo(image, { yPercent: -12 }, { yPercent: 12, ease: 'none' }, 0)
        }
        // The photo starts fully uncovered, then darkens as the pin scrolls by so the copy
        // stays legible against the storefront's own signage — it never fades back out.
        if (overlay) {
          timeline.fromTo(overlay, { opacity: 0 }, { opacity: 0.85, ease: 'none', duration: 0.6 }, 0)
        }
        if (content) {
          timeline.fromTo(content, { y: 40, opacity: 0 }, { y: 0, opacity: 1, ease: 'none', duration: 0.5 }, 0.1)
        }

        return () => timeline.scrollTrigger?.kill()
      })

      mm.add('(max-width: 767px)', () => {
        if (content) {
          gsap.from(content, {
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: section, start: 'top 70%' },
          })
        }
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={sectionRef} className="relative h-[80vh] min-h-[480px] overflow-hidden md:h-screen">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src="https://lh3.googleusercontent.com/XBJ-EJe28bINdMVw8NaCo1YfOWCxmNQ8mpMea-OwAt15LfrgsBXlwwUfnzOQSZn96YXuxch3q_Ho07SYM8IlFFuNYdqt1TWPW6PUpXA=w1600-rw"
        alt="Amulya Medicals storefront in Bhagyanagar Colony"
        className="absolute inset-0 h-full w-full scale-125 object-cover"
      />
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/95 to-foreground/80"
      />
      <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
        <div ref={contentRef} className="max-w-xl text-background">
          <span className="inline-block rounded-full bg-background/15 px-4 py-1 text-xs font-semibold">
            Refills made simple
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
            Never Run Out Of Your Regular Order
          </h2>
          <p className="mt-4 text-background/80">
            Upload your prescription once — our pharmacists keep it on file, so every refill after
            that is just a tap, no re-explaining required.
          </p>
          <Link
            href="/contact"
            data-cursor-hover
            className="mt-7 inline-block rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:scale-105"
          >
            Upload Prescription
          </Link>
        </div>
      </div>
    </div>
  )
}

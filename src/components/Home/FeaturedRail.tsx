'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react'

import type { Product } from '@/payload-types'
import { ProductRailCard } from './ProductRailCard'

gsap.registerPlugin(ScrollTrigger)

export const FeaturedRail: React.FC<{ heading: string; products: Product[] }> = ({
  heading,
  products,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const blobARef = useRef<HTMLDivElement>(null)
  const blobBRef = useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Plain refs, not state — updated every pointermove, which is far too hot a path for re-renders.
  // `active` only flips true once movement crosses DRAG_THRESHOLD — until then this is indistinguishable
  // from a plain click, and we never touch pointer capture or scroll-snap, so a real click on a card
  // reaches its Link completely untouched (no drag machinery to retroactively undo).
  const dragRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startScrollLeft: 0,
    active: false,
  })

  const updateArrows = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setCanScrollPrev(track.scrollLeft > 4)
    setCanScrollNext(track.scrollLeft < track.scrollWidth - track.clientWidth - 4)
  }, [])

  const cardStep = () => {
    const track = trackRef.current
    const firstCard = track?.firstElementChild as HTMLElement | null
    if (!track || !firstCard) return 0
    const gap = parseFloat(getComputedStyle(track).columnGap || '0')
    return firstCard.getBoundingClientRect().width + gap
  }

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current
    const step = cardStep()
    if (!track || !step) return

    const max = track.scrollWidth - track.clientWidth
    const target = Math.min(max, Math.max(0, track.scrollLeft + step * direction))

    // CSS scroll-snap fights a JS-driven scrollLeft tween — the browser keeps trying to snap
    // back to the nearest card on every intermediate frame, which is what was reading as an
    // instant jump instead of a slide. Suspend snapping for the duration of the animation, then
    // restore it once we've landed.
    const previousSnapType = track.style.scrollSnapType
    track.style.scrollSnapType = 'none'

    gsap.to(track, {
      scrollLeft: target,
      duration: 0.55,
      ease: 'power2.inOut',
      onUpdate: updateArrows,
      onComplete: () => {
        track.style.scrollSnapType = previousSnapType
      },
    })
  }

  const settleToNearestCard = () => {
    const track = trackRef.current
    const step = cardStep()
    if (!track || !step) return

    const max = track.scrollWidth - track.clientWidth
    const nearest = Math.round(track.scrollLeft / step) * step
    const target = Math.min(max, Math.max(0, nearest))

    gsap.to(track, {
      scrollLeft: target,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: updateArrows,
      onComplete: () => {
        track.style.scrollSnapType = ''
      },
    })
  }

  const DRAG_THRESHOLD = 6

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Left mouse button / primary touch or pen contact only.
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const track = trackRef.current
    if (!track) return

    // Deliberately not capturing the pointer or touching scroll-snap yet — that only happens once
    // real movement is detected in onPointerMove, so a plain click never engages any drag state.
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: track.scrollLeft,
      active: false,
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    const drag = dragRef.current
    if (!track || drag.pointerId !== e.pointerId) return

    const delta = e.clientX - drag.startX

    if (!drag.active) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return
      // Threshold crossed — this is a real drag, not a click. Engage now.
      drag.active = true
      track.setPointerCapture(e.pointerId)
      track.style.scrollSnapType = 'none'
      setIsDragging(true)
    }

    track.scrollLeft = drag.startScrollLeft - delta
    updateArrows()
  }

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    const drag = dragRef.current
    if (!track || drag.pointerId !== e.pointerId) return

    if (drag.active) {
      track.releasePointerCapture(e.pointerId)
      setIsDragging(false)
      settleToNearestCard()
    }
    dragRef.current.pointerId = null
  }

  useLayoutEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return

    updateArrows()
    track.addEventListener('scroll', updateArrows, { passive: true })

    const ctx = gsap.context(() => {
      // Entrance: the rail rises into place the first time it's scrolled into view.
      gsap.from(track, {
        opacity: 0,
        y: 32,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 82%' },
      })

      // Background depth — two soft blobs drift past at different speeds as the section scrolls
      // through the viewport (no pinning, the page just scrolls normally underneath).
      if (blobARef.current) {
        gsap.to(blobARef.current, {
          yPercent: -30,
          xPercent: 8,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      }
      if (blobBRef.current) {
        gsap.to(blobBRef.current, {
          yPercent: 24,
          xPercent: -6,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      }
    }, section)

    const resizeObserver = new ResizeObserver(updateArrows)
    resizeObserver.observe(track)

    return () => {
      ctx.revert()
      track.removeEventListener('scroll', updateArrows)
      resizeObserver.disconnect()
    }
  }, [products, updateArrows])

  if (!products.length) return null

  return (
    <div ref={sectionRef} className="relative overflow-hidden py-16">
      {/* Ambient background — soft, off-brand blobs for depth; not the loud fa-icon backdrop
          used elsewhere, this section reads as more premium/editorial. */}
      <div
        ref={blobARef}
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        ref={blobBRef}
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"
      />

      <div className="container relative">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {heading}
          </h2>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous products"
              data-cursor-hover
              disabled={!canScrollPrev}
              onClick={() => scrollByCard(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next products"
              data-cursor-hover
              disabled={!canScrollNext}
              onClick={() => scrollByCard(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-all hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          {/* Right edge fade hints there's more to scroll — the left edge stays flush with the
              heading above it, so it lines up with the rest of the page. */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent md:w-16" />

          <div
            ref={trackRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            // Images and links are natively draggable in every browser — starting the press on
            // a card's photo would otherwise kick off the browser's own drag-and-drop (a ghost
            // image, no more pointermove events) instead of our custom drag. Kill that here so
            // the whole card surface, not just the gaps between cards, drags the rail.
            onDragStart={(e) => e.preventDefault()}
            className={`flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
            }`}
          >
            {products.map((product) => (
              <div key={product.id} className="snap-start">
                <ProductRailCard product={product} />
              </div>
            ))}
            {/* Trailing spacer so the last card can scroll fully clear of the edge fade. */}
            <div aria-hidden className="w-2 shrink-0 md:w-6" />
          </div>
        </div>
      </div>

      {/* Mobile arrows sit below the rail — the edge fade + swipe/drag are the primary
          affordance at that width, but the buttons stay available for anyone who prefers
          tapping. */}
      <div className="container mt-5 flex items-center justify-center gap-3 sm:hidden">
        <button
          type="button"
          aria-label="Previous products"
          disabled={!canScrollPrev}
          onClick={() => scrollByCard(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground disabled:opacity-30"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next products"
          disabled={!canScrollNext}
          onClick={() => scrollByCard(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground disabled:opacity-30"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

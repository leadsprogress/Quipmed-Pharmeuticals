'use client'

import { gsap } from 'gsap'
import React, { useEffect, useRef } from 'react'

export const CursorFollower: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isCoarsePointer =
      typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    if (isCoarsePointer) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' })

    const onMove = (e: MouseEvent) => {
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [data-cursor-hover]')) {
        gsap.to(ring, { scale: 1.8, opacity: 0.5, duration: 0.3, ease: 'power3.out' })
        gsap.to(dot, { scale: 0, duration: 0.3, ease: 'power3.out' })
      }
    }
    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [data-cursor-hover]')) {
        gsap.to(ring, { scale: 1, opacity: 1, duration: 0.3, ease: 'power3.out' })
        gsap.to(dot, { scale: 1, duration: 0.3, ease: 'power3.out' })
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)
    window.addEventListener('mouseout', onOut)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mouseout', onOut)
    }
  }, [])

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/60 md:block"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] hidden h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary md:block"
      />
    </>
  )
}

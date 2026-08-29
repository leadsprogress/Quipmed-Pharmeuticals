'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import React, { useLayoutEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

/**
 * A big, faint icon sitting behind a section that would otherwise read as empty — drifts
 * slowly on scroll so it reads as intentional depth rather than a placeholder.
 */
export const SectionBackdrop: React.FC<{
  icon: string
  side?: 'left' | 'right'
  className?: string
}> = ({ icon, side = 'right', className = '' }) => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${
        side === 'right' ? 'right-0 translate-x-1/4' : 'left-0 -translate-x-1/4'
      } ${className}`}
    >
      <i className={`fa-solid ${icon} text-[24rem] text-primary/10`} />
    </div>
  )
}

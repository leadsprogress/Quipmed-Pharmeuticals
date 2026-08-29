'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import Lenis from 'lenis'
import React, { useEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

/**
 * Drives GSAP's ScrollTrigger off Lenis's smooth-scroll raf loop instead of the native
 * scroll event, so pinned/scrubbed animations stay in sync with the smoothed scroll position.
 */
export const SmoothScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const isCoarsePointer =
      typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) return

    const lenis = new Lenis({
      duration: isCoarsePointer ? 0.9 : 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const onTick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    // Extra safety net: if the page's rendered height ever changes after mount (a late-loading
    // image, a font swap), re-measure every ScrollTrigger so pinned/scrubbed sections don't drift
    // out of sync with the document. The pin-ordering fix itself lives on each pinned trigger's
    // `refreshPriority` (see FeaturedRail/PromoBanner) — without it, an earlier pin's reserved
    // spacer isn't accounted for when later, unpinned scrub triggers compute their positions.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)

    let resizeTimer: ReturnType<typeof setTimeout>
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(refresh, 150)
    })
    resizeObserver.observe(document.body)

    return () => {
      lenis.destroy()
      gsap.ticker.remove(onTick)
      window.removeEventListener('load', refresh)
      clearTimeout(resizeTimer)
      resizeObserver.disconnect()
    }
  }, [])

  return <>{children}</>
}

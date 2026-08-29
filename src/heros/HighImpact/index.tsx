'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import React, { useEffect, useLayoutEffect, useRef } from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { RichText } from '@/components/RichText'

gsap.registerPlugin(ScrollTrigger)

export const HighImpactHero: React.FC<Page['hero']> = ({ links, media, richText }) => {
  const { setHeaderTheme } = useHeaderTheme()
  const rootRef = useRef<HTMLDivElement>(null)
  const mediaWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHeaderTheme('dark')
  })

  useLayoutEffect(() => {
    const root = rootRef.current
    const mediaWrap = mediaWrapRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      // Parallax: background media drifts slower than scroll for depth.
      if (mediaWrap) {
        gsap.to(mediaWrap, {
          yPercent: 18,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      }

      gsap.from('[data-hero-copy]', {
        opacity: 0,
        y: 28,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.1,
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div
      className="relative -mt-[10.4rem] flex items-center justify-center overflow-hidden text-white"
      data-theme="dark"
      ref={rootRef}
    >
      <div className="container mb-8 z-10 relative flex items-center justify-center">
        <div data-hero-copy className="max-w-146 md:text-center">
          {richText && <RichText className="mb-6" data={richText} enableGutter={false} />}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="flex md:justify-center gap-4">
              {links.map(({ link }, i) => {
                return (
                  <li key={i}>
                    <CMSLink {...link} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="min-h-[80vh] select-none">
        {media && typeof media === 'object' && (
          <div className="absolute inset-0 -z-10 scale-[1.15]" ref={mediaWrapRef}>
            <Media fill imgClassName="object-cover" priority resource={media} />
          </div>
        )}
      </div>
    </div>
  )
}

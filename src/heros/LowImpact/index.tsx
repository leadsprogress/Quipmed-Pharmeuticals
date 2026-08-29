'use client'

import { gsap } from 'gsap'
import React, { useLayoutEffect, useRef } from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { RichText } from '@/components/RichText'

type LowImpactHeroType =
  | {
      children?: React.ReactNode
      richText?: never
      links?: never
    }
  | (Omit<Page['hero'], 'richText'> & {
      children?: never
      richText?: Page['hero']['richText']
    })

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, richText, links }) => {
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
      gsap.to('[data-hero-blob]', {
        y: 24,
        x: 12,
        duration: 6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div
      className="relative -mt-[10.4rem] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/30 pt-[10.4rem]"
      ref={rootRef}
    >
      <div
        data-hero-blob
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        data-hero-blob
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary/40 blur-3xl"
      />

      <div className="container relative py-20 md:py-28">
        <div data-hero-copy className="max-w-2xl">
          {children || (richText && <RichText data={richText} enableGutter={false} />)}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-4">
              {links.map(({ link }, i) => (
                <li key={i}>
                  <CMSLink {...link} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

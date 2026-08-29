'use client'

import { gsap } from 'gsap'
import Link from 'next/link'
import React, { useRef } from 'react'

import type { Media as MediaType, Product } from '@/payload-types'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'

export const TiltCard: React.FC<{ product: Product }> = ({ product }) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const image =
    typeof product.meta?.image === 'object' && product.meta.image ? (product.meta.image as MediaType) : null

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    gsap.to(card, {
      rotateY: x * 16,
      rotateX: -y * 16,
      duration: 0.3,
      ease: 'power2.out',
      transformPerspective: 600,
    })
  }

  const onMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power3.out' })
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      data-cursor-hover
      className="block flex-none w-1/2 min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
    >
      <div
        ref={cardRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="flex aspect-square w-full flex-col overflow-hidden rounded-2xl border border-border bg-card [transform-style:preserve-3d]"
      >
        <div className="flex flex-1 items-center justify-center bg-primary-foreground text-muted-foreground">
          {image ? (
            <Media resource={image} imgClassName="h-full w-full object-cover" />
          ) : (
            <i className="fa-solid fa-capsules text-3xl" />
          )}
        </div>
        <div className="p-3">
          <p className="line-clamp-1 text-xs font-semibold">{product.title}</p>
          {typeof product.priceInINR === 'number' && (
            <Price amount={product.priceInINR} className="text-xs font-bold text-primary" />
          )}
        </div>
      </div>
    </Link>
  )
}

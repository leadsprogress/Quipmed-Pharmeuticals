'use client'

import { gsap } from 'gsap'
import type { Product } from '@/payload-types'
import React, { useEffect, useRef, useState } from 'react'

import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'

export const StickyAddToCartBar: React.FC<{
  product: Product
  price: number
  triggerId: string
}> = ({ product, price, triggerId }) => {
  const [visible, setVisible] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trigger = document.getElementById(triggerId)
    if (!trigger) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '-80px 0px 0px 0px' },
    )
    observer.observe(trigger)
    return () => observer.disconnect()
  }, [triggerId])

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    gsap.to(bar, {
      y: visible ? 0 : '100%',
      duration: 0.35,
      ease: 'power3.out',
    })
  }, [visible])

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-40 translate-y-full border-t border-border bg-card/95 shadow-lg backdrop-blur"
    >
      <div className="container flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{product.title}</p>
          <Price amount={price} className="text-sm font-bold text-primary" />
        </div>
        <div className="shrink-0">
          <AddToCart product={product} />
        </div>
      </div>
    </div>
  )
}

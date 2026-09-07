import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import type { Product } from '@/payload-types'

export const FlipProductCard: React.FC<{ product: Partial<Product> }> = ({ product }) => {
  const galleryImage =
    product.gallery?.[0]?.image && typeof product.gallery[0].image === 'object'
      ? product.gallery[0].image
      : null

  return (
    <Link
      href={`/products/${product.slug}`}
      data-flip-card
      data-cursor-hover
      className="group block [perspective:1200px]"
    >
      <div className="relative aspect-[4/5] w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
        {/* Front */}
        <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-card [backface-visibility:hidden]">
          <div className="relative flex flex-1 items-center justify-center bg-primary-foreground text-muted-foreground">
            {galleryImage ? (
              <Media resource={galleryImage} fill imgClassName="object-cover" />
            ) : (
              <i className="fa-solid fa-capsules text-4xl" />
            )}
          </div>
          <div className="p-4">
            <p className="line-clamp-1 text-sm font-semibold">{product.title}</p>
            {typeof product.priceInINR === 'number' && (
              <Price amount={product.priceInINR} className="mt-1 text-sm font-bold text-primary" />
            )}
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-primary p-5 text-primary-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div>
            <p className="text-sm font-semibold">{product.title}</p>
            {product.composition && (
              <p className="mt-2 line-clamp-4 text-xs opacity-90">{product.composition}</p>
            )}
            {product.packing && <p className="mt-2 text-xs opacity-75">Pack: {product.packing}</p>}
          </div>
          <span className="inline-block rounded-full bg-background px-4 py-2 text-center text-xs font-semibold text-foreground transition-transform group-hover:scale-105">
            View Details
          </span>
        </div>
      </div>
    </Link>
  )
}

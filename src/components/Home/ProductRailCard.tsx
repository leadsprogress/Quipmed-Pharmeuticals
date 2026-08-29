import Link from 'next/link'
import React from 'react'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import type { Product } from '@/payload-types'

export const ProductRailCard: React.FC<{ product: Product; fixedWidth?: boolean }> = ({
  product,
  fixedWidth = true,
}) => {
  const galleryImage =
    product.gallery?.[0]?.image && typeof product.gallery[0].image === 'object'
      ? product.gallery[0].image
      : null

  return (
    <Link
      href={`/products/${product.slug}`}
      data-cursor-hover
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg ${
        fixedWidth ? 'w-56 shrink-0 md:w-64' : 'w-full'
      }`}
    >
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {galleryImage ? (
          <Media
            resource={galleryImage}
            imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (product as any).imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(product as any).imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <i className="fa-solid fa-capsules text-3xl" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.title}</p>
        {product.composition && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{product.composition}</p>
        )}
        {typeof product.priceInINR === 'number' && (
          <Price amount={product.priceInINR} className="mt-2 text-sm font-bold text-primary" />
        )}
      </div>
    </Link>
  )
}

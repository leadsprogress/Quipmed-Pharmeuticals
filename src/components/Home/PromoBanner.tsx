import Link from 'next/link'
import React from 'react'

import type { Media as MediaType } from '@/payload-types'

type Props = {
  eyebrow?: string | null
  heading?: string | null
  body?: string | null
  buttonLabel?: string | null
  buttonUrl?: string | null
  image?: MediaType | number | string | null
}

export const PromoBanner: React.FC<Props> = ({
  eyebrow,
  heading,
  body,
  buttonLabel,
  buttonUrl,
  image,
}) => {
  const imageSrc =
    image && typeof image === 'object' && image.url
      ? `${process.env.NEXT_PUBLIC_SERVER_URL || ''}${image.url}`
      : 'https://lh3.googleusercontent.com/XBJ-EJe28bINdMVw8NaCo1YfOWCxmNQ8mpMea-OwAt15LfrgsBXlwwUfnzOQSZn96YXuxch3q_Ho07SYM8IlFFuNYdqt1TWPW6PUpXA=w1600-rw'

  return (
    <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden px-4 py-24 text-center md:min-h-[520px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="Amulya Medicals storefront in Bhagyanagar Colony"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Plain, permanent dark overlay — no animation, no parallax. */}
      <div className="absolute inset-0 bg-foreground/70" />

      <div className="relative z-10 max-w-xl text-background">
        <span className="inline-block rounded-full bg-background/15 px-4 py-1 text-xs font-semibold">
          {eyebrow || 'Refills made simple'}
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
          {heading || 'Never Run Out Of Your Regular Order'}
        </h2>
        <p className="mt-4 text-background/80">
          {body ||
            'Upload your prescription once — our pharmacists keep it on file, so every refill after that is just a tap, no re-explaining required.'}
        </p>
        <Link
          href={buttonUrl || '/contact'}
          data-cursor-hover
          className="mt-7 inline-block rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground transition-transform hover:scale-105"
        >
          {buttonLabel || 'Upload Prescription'}
        </Link>
      </div>
    </div>
  )
}

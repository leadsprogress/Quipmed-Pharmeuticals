'use client'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { Search } from '@/components/Search'
import Image from 'next/image'
import Link from 'next/link'
import React, { Suspense } from 'react'

import type { Category } from '@/payload-types'
import { AccountLink } from './AccountLink'
import { MegaMenu } from './MegaMenu'
import { MobileMenu } from './MobileMenu'

type Props = {
  categories: Category[]
}

export function HeaderClient({ categories }: Props) {
  return (
    <div className="relative z-20 border-b border-border bg-background">
      <div className="container flex items-center gap-4 py-3">
        <div className="block flex-none md:hidden">
          <Suspense fallback={null}>
            <MobileMenu categories={categories} />
          </Suspense>
        </div>

        <Link href="/" className="shrink-0">
          <Image
            src="/logo/logo-transparent.png"
            alt="Amulya Medicals"
            width={180}
            height={54}
            className="h-10 w-auto object-contain md:h-12"
            priority
          />
        </Link>

        <div className="hidden flex-1 md:block">
          <Search className="mx-auto max-w-xl" />
        </div>

        <div className="ml-auto flex items-center gap-5">
          <AccountLink />
          <Suspense fallback={<OpenCartButton />}>
            <Cart />
          </Suspense>
        </div>
      </div>

      <div className="container pb-3 md:hidden">
        <Search />
      </div>

      <MegaMenu categories={categories} />
    </div>
  )
}

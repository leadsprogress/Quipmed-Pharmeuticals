'use client'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { Search } from '@/components/Search'
import Image from 'next/image'
import Link from 'next/link'
import React, { Suspense } from 'react'

import type { Category, Header as HeaderType } from '@/payload-types'
import { AccountLink } from './AccountLink'
import { MegaMenu } from './MegaMenu'
import { MobileMenu } from './MobileMenu'
import { ThemeToggle } from './ThemeToggle'

type Props = {
  categories: Category[]
  header: HeaderType | null
}

export function HeaderClient({ categories, header }: Props) {
  const logo = header?.logo && typeof header.logo === 'object' ? header.logo : null
  // Relative, not prefixed with NEXT_PUBLIC_SERVER_URL — next/image rejects a same-origin
  // absolute URL under `remotePatterns` (anti-SSRF-loop check); it must stay relative to match
  // the `localPatterns` entry for `/api/media/file/**`.
  const logoSrc = logo?.url || '/logo/logo-transparent.png'
  const searchPlaceholder = header?.searchPlaceholder || 'Search for products...'
  const announcement = header?.announcementBar

  return (
    <div className="relative z-20 border-b border-border bg-background">
      {announcement?.enabled && announcement.text ? (
        <div className="bg-primary py-2 text-center text-xs font-medium text-primary-foreground">
          {announcement.linkUrl ? (
            <Link href={announcement.linkUrl}>
              {announcement.text}
              {announcement.linkLabel ? ` — ${announcement.linkLabel}` : ''}
            </Link>
          ) : (
            announcement.text
          )}
        </div>
      ) : null}

      <div className="container flex items-center gap-4 py-3">
        <div className="block flex-none md:hidden">
          <Suspense fallback={null}>
            <MobileMenu categories={categories} navGroups={header?.navGroups} />
          </Suspense>
        </div>

        <Link href="/" className="shrink-0">
          <Image
            src={logoSrc}
            alt="Amulya Medicals"
            width={180}
            height={54}
            className="h-10 w-auto object-contain md:h-12"
            priority
          />
        </Link>

        <div className="hidden flex-1 md:block">
          <Suspense fallback={null}>
            <Search className="mx-auto max-w-xl" placeholder={searchPlaceholder} />
          </Suspense>
        </div>

        <div className="ml-auto flex items-center gap-5">
          <ThemeToggle className="hidden md:flex" />
          <AccountLink />
          <Suspense fallback={<OpenCartButton />}>
            <Cart />
          </Suspense>
        </div>
      </div>

      <div className="container pb-3 md:hidden">
        <Suspense fallback={null}>
          <Search placeholder={searchPlaceholder} />
        </Suspense>
      </div>

      <MegaMenu categories={categories} navGroups={header?.navGroups} />
    </div>
  )
}

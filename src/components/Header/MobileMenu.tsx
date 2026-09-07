'use client'

import type { Category, Header } from '@/payload-types'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/providers/Auth'
import { useLenis } from '@/providers/SmoothScroll'
import { LogOutIcon, MapPinIcon, MenuIcon, PackageIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { buildNavGroups } from './megaMenuGroups'

interface Props {
  categories: Category[]
  navGroups?: Header['navGroups']
}

// Same shape Payload can return depending on query depth — mirrors the pattern used in
// PopularRangesBlock/Component.tsx for resolving a category's parent id.
const getParentId = (category: Category): number | string | null => {
  if (!category.parent) return null
  return typeof category.parent === 'object' ? category.parent.id : category.parent
}

export function MobileMenu({ categories, navGroups }: Props) {
  const groups = buildNavGroups(categories, navGroups)

  const childrenByParentId = useMemo(() => {
    const map = new Map<number | string, Category[]>()
    for (const category of categories) {
      const parentId = getParentId(category)
      if (parentId == null) continue
      const siblings = map.get(parentId) ?? []
      siblings.push(category)
      map.set(parentId, siblings)
    }
    return map
  }, [categories])

  const { user } = useAuth()
  const lenis = useLenis()

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const closeMobileMenu = () => setIsOpen(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  // Radix's own body-scroll-lock (overflow: hidden) doesn't stop Lenis, which drives scrolling
  // itself via its own wheel/touch listeners — so the page behind the sheet kept scrolling.
  // Pausing/resuming Lenis alongside the sheet's open state fixes that.
  useEffect(() => {
    if (isOpen) {
      lenis?.stop()
    } else {
      lenis?.start()
    }
  }, [isOpen, lenis])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger className="relative flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors">
        <MenuIcon className="h-4" />
      </SheetTrigger>

      <SheetContent side="left" className="w-[82%] gap-0 px-4 sm:max-w-md">
        <SheetHeader className="border-b border-border px-0 pr-10 pb-4 pt-4">
          <SheetTitle>Amulya Medicals</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        <div
          data-lenis-prevent
          className="no-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain py-4"
        >
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <Accordion type="multiple">
                {group.categories.map((category) => {
                  const subcategories = childrenByParentId.get(category.id) ?? []

                  if (subcategories.length === 0) {
                    return (
                      <div key={category.id} className="border-b last:border-b-0">
                        <Link
                          href={`/shop?category=${category.id}`}
                          onClick={closeMobileMenu}
                          className="block rounded-md px-1 py-3 text-sm font-medium transition-colors hover:bg-muted"
                        >
                          {category.title}
                        </Link>
                      </div>
                    )
                  }

                  return (
                    <AccordionItem key={category.id} value={String(category.id)}>
                      <AccordionTrigger className="rounded-md px-1 py-3 text-sm font-medium hover:bg-muted hover:no-underline">
                        {category.title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pl-3">
                        <ul className="flex flex-col gap-0.5 border-l border-border pl-3">
                          {subcategories.map((subcategory) => (
                            <li key={subcategory.id}>
                              <Link
                                href={`/shop?category=${subcategory.id}`}
                                onClick={closeMobileMenu}
                                className="block rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                {subcategory.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          ))}
          <Link
            href="/shop"
            onClick={closeMobileMenu}
            className="block rounded-md px-1 py-3 text-sm font-semibold text-primary transition-colors hover:bg-muted"
          >
            All Products
          </Link>

          <div className="mt-2 rounded-xl bg-muted/50 p-3">
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              My account
            </h2>
            {user ? (
              <ul className="flex flex-col gap-0.5">
                <li>
                  <Link
                    href="/orders"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-background"
                  >
                    <PackageIcon className="h-4 w-4 text-muted-foreground" />
                    Orders
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account/addresses"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-background"
                  >
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                    Addresses
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2.5 text-sm font-medium transition-colors hover:bg-background"
                  >
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    Manage account
                  </Link>
                </li>
                <li className="mt-1 border-t border-border pt-2">
                  <Link
                    href="/logout"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 rounded-md px-2 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-background"
                  >
                    <LogOutIcon className="h-4 w-4" />
                    Log out
                  </Link>
                </li>
              </ul>
            ) : (
              <div className="flex flex-col gap-2 p-1">
                <Button asChild className="w-full" variant="outline" onClick={closeMobileMenu}>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="w-full" onClick={closeMobileMenu}>
                  <Link href="/create-account">Create an account</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

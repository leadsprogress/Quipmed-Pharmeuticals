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
import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import { buildNavGroups } from './megaMenuGroups'
import { ThemeToggle } from './ThemeToggle'

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

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger className="relative flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors">
        <MenuIcon className="h-4" />
      </SheetTrigger>

      <SheetContent side="left" className="px-4">
        <SheetHeader className="flex-row items-center justify-between px-0 pr-10 pt-4 pb-0">
          <div>
            <SheetTitle>Amulya Medicals</SheetTitle>
            <SheetDescription />
          </div>
          <ThemeToggle />
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto py-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <Accordion type="multiple">
                {group.categories.map((category) => {
                  const subcategories = childrenByParentId.get(category.id) ?? []

                  if (subcategories.length === 0) {
                    return (
                      <div key={category.id} className="py-1.5">
                        <Link
                          href={`/shop?category=${category.id}`}
                          onClick={closeMobileMenu}
                          className="text-sm"
                        >
                          {category.title}
                        </Link>
                      </div>
                    )
                  }

                  return (
                    <AccordionItem key={category.id} value={String(category.id)}>
                      <AccordionTrigger className="py-1.5 text-sm font-normal hover:no-underline">
                        {category.title}
                      </AccordionTrigger>
                      <AccordionContent className="pl-4">
                        <ul className="flex flex-col">
                          {subcategories.map((subcategory) => (
                            <li key={subcategory.id} className="py-1.5">
                              <Link
                                href={`/shop?category=${subcategory.id}`}
                                onClick={closeMobileMenu}
                                className="text-sm text-muted-foreground"
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
          <Link href="/shop" onClick={closeMobileMenu} className="text-sm font-semibold text-primary">
            All Products
          </Link>
        </div>

        {user ? (
          <div className="mt-4">
            <h2 className="text-lg mb-4">My account</h2>
            <hr className="my-2" />
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/orders">Orders</Link>
              </li>
              <li>
                <Link href="/account/addresses">Addresses</Link>
              </li>
              <li>
                <Link href="/account">Manage account</Link>
              </li>
              <li className="mt-6">
                <Button asChild variant="outline">
                  <Link href="/logout">Log out</Link>
                </Button>
              </li>
            </ul>
          </div>
        ) : (
          <div>
            <h2 className="text-lg mb-4">My account</h2>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild className="w-full sm:flex-1" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <span className="text-center text-sm text-muted-foreground sm:text-base">or</span>
              <Button asChild className="w-full sm:flex-1">
                <Link href="/create-account">Create an account</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { gsap } from 'gsap'
import { Loader2Icon, SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { Media } from '@/components/Media'
import type { Product } from '@/payload-types'

type Props = {
  className?: string
  placeholder?: string
}

// priceInINR is stored in the currency's smallest unit (paise), matching the ecommerce plugin's
// own formatCurrency convention — divide by 100 before display.
const formatPrice = (amount?: number | null) => {
  if (typeof amount !== 'number') return null
  return new Intl.NumberFormat('en-IN', {
    currency: 'INR',
    style: 'currency',
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

export const Search: React.FC<Props> = ({ className, placeholder = 'Search for products...' }) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [value, setValue] = useState(searchParams?.get('q') || '')
  const [results, setResults] = useState<Product[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTargetRef = useRef(0)
  const requestIdRef = useRef(0)

  const onDropdownWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // The site's global Lenis smooth-scroll takes over the page's own wheel handling, which also
    // swallows wheel input meant for nested scrollable elements like this one — data-lenis-prevent
    // stops Lenis reacting to it, but native scroll-chaining still doesn't reliably land here, so
    // drive scrollTop ourselves (eased with GSAP, matching the site's smooth-scroll feel) and stop
    // the event there.
    e.stopPropagation()
    const el = scrollRef.current
    if (!el) return

    const max = el.scrollHeight - el.clientHeight
    scrollTargetRef.current = Math.min(max, Math.max(0, scrollTargetRef.current + e.deltaY))

    gsap.to(el, {
      scrollTop: scrollTargetRef.current,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: true,
    })
  }

  useEffect(() => {
    const query = value.trim()
    scrollTargetRef.current = 0
    if (scrollRef.current) scrollRef.current.scrollTop = 0

    if (query.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const currentRequestId = ++requestIdRef.current
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(query)}`)
        const data = await res.json()

        // Ignore stale responses that resolve after a newer keystroke's request.
        if (currentRequestId === requestIdRef.current) {
          setResults(data.products || [])
          setActiveIndex(-1)
        }
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setResults([])
        }
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => window.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const goToShop = (query: string) => {
    const newParams = new URLSearchParams(searchParams?.toString())
    if (query) {
      newParams.set('q', query)
    } else {
      newParams.delete('q')
    }
    router.push(createUrl('/shop', newParams))
    setIsOpen(false)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    goToShop(value.trim())
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      const product = results[activeIndex]
      if (product?.slug) {
        setIsOpen(false)
        router.push(`/products/${product.slug}`)
      }
    }
  }

  const showDropdown = isOpen && value.trim().length >= 2

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <form className="relative w-full" onSubmit={onSubmit} autoComplete="off">
        <input
          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          name="search"
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
        />
        <div className="absolute right-0 top-0 mr-3 flex h-full items-center">
          {isLoading ? (
            <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <SearchIcon className="h-4 w-4" />
          )}
        </div>
      </form>

      {showDropdown && (
        <div
          ref={scrollRef}
          data-lenis-prevent
          onWheel={onDropdownWheel}
          className="absolute left-1/2 top-full z-40 mt-2 max-h-[70vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card shadow-xl sm:w-[36rem] sm:max-w-[36rem] md:w-[44rem] md:max-w-[44rem]"
        >
          {results.length === 0 && !isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">
              No products found for &quot;{value.trim()}&quot;.
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2">
                {results.map((product, i) => {
                  const image =
                    product.gallery?.[0]?.image && typeof product.gallery[0].image === 'object'
                      ? product.gallery[0].image
                      : null
                  const price = formatPrice(product.priceInINR)

                  return (
                    <li key={product.id}>
                      <Link
                        href={`/products/${product.slug}`}
                        className={cn(
                          'flex h-full items-center gap-3 rounded-xl border border-transparent p-2 text-sm transition-colors hover:border-border hover:bg-muted',
                          activeIndex === i && 'border-border bg-muted',
                        )}
                        onClick={() => setIsOpen(false)}
                        onMouseEnter={() => setActiveIndex(i)}
                      >
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-primary-foreground text-muted-foreground">
                          {image ? (
                            <Media
                              resource={image}
                              imgClassName="h-full w-full object-cover"
                              width={80}
                              height={80}
                            />
                          ) : product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <i className="fa-solid fa-capsules text-2xl" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{product.title}</p>
                          {product.composition ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {product.composition}
                            </p>
                          ) : null}
                          {price ? (
                            <span className="mt-1 block text-sm font-semibold text-primary">
                              {price}
                            </span>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <button
                type="button"
                className="block w-full border-t border-border px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted"
                onClick={() => goToShop(value.trim())}
              >
                View all results for &quot;{value.trim()}&quot;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

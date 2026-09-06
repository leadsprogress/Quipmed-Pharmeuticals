'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { gsap } from 'gsap'
import { HistoryIcon, Loader2Icon, SearchIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { Media } from '@/components/Media'
import type { Product } from '@/payload-types'
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from './recentSearches'

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
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTargetRef = useRef(0)
  const requestIdRef = useRef(0)

  useEffect(() => {
    setRecentSearches(getRecentSearches())
  }, [])

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

    if (query.length < 1) {
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
      setRecentSearches(addRecentSearch(query))
    } else {
      newParams.delete('q')
    }
    router.push(createUrl('/shop', newParams))
    setIsOpen(false)
  }

  const onSelectProduct = (query: string) => {
    if (query) setRecentSearches(addRecentSearch(query))
    setIsOpen(false)
  }

  const onSelectRecent = (term: string) => {
    setValue(term)
    setIsOpen(true)
  }

  const onRemoveRecent = (e: React.MouseEvent, term: string) => {
    e.preventDefault()
    e.stopPropagation()
    setRecentSearches(removeRecentSearch(term))
  }

  const onClearRecent = () => {
    setRecentSearches(clearRecentSearches())
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
        onSelectProduct(value.trim())
        router.push(`/products/${product.slug}`)
      }
    }
  }

  const trimmedValue = value.trim()
  const showDropdown =
    isOpen && (trimmedValue.length >= 1 || (trimmedValue.length === 0 && recentSearches.length > 0))

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
          {trimmedValue.length === 0 ? (
            <>
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="text-xs font-medium text-muted-foreground">Recent searches</span>
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={onClearRecent}
                >
                  Clear all
                </button>
              </div>
              <ul className="p-2">
                {recentSearches.map((term) => (
                  <li
                    key={term}
                    className="group flex items-center gap-2 rounded-xl px-1 transition-colors hover:bg-muted"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm"
                      onClick={() => onSelectRecent(term)}
                    >
                      <HistoryIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-foreground">{term}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove "${term}" from recent searches`}
                      className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-border hover:text-foreground"
                      onClick={(e) => onRemoveRecent(e, term)}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : results.length === 0 && !isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">
              No products found for &quot;{trimmedValue}&quot;.
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
                        onClick={() => onSelectProduct(trimmedValue)}
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
                onClick={() => goToShop(trimmedValue)}
              >
                View all results for &quot;{trimmedValue}&quot;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

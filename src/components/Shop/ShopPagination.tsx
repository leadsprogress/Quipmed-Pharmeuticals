import Link from 'next/link'
import React from 'react'

import { createUrl } from '@/utilities/createUrl'

type Props = {
  currentParams: Record<string, string | undefined>
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  totalPages: number
}

export const ShopPagination: React.FC<Props> = ({
  currentParams,
  hasNextPage,
  hasPrevPage,
  page,
  totalPages,
}) => {
  if (totalPages <= 1) return null

  const hrefForPage = (targetPage: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(currentParams)) {
      if (value) params.set(key, value)
    }
    if (targetPage > 1) params.set('page', String(targetPage))
    return createUrl('/shop', params)
  }

  return (
    <nav
      aria-label="Shop pagination"
      className="mt-10 flex items-center justify-center gap-4 text-sm"
    >
      {hasPrevPage ? (
        <Link
          href={hrefForPage(page - 1)}
          className="rounded-lg border border-border px-4 py-2 font-medium transition-colors hover:bg-muted"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-lg border border-border px-4 py-2 font-medium text-muted-foreground opacity-50">
          Previous
        </span>
      )}

      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      {hasNextPage ? (
        <Link
          href={hrefForPage(page + 1)}
          className="rounded-lg border border-border px-4 py-2 font-medium transition-colors hover:bg-muted"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-lg border border-border px-4 py-2 font-medium text-muted-foreground opacity-50">
          Next
        </span>
      )}
    </nav>
  )
}

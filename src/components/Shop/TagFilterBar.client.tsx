'use client'

import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback } from 'react'

import type { ProductTag } from '@/payload-types'

type Props = {
  tags: ProductTag[]
}

export const TagFilterBar: React.FC<Props> = ({ tags }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTagId = searchParams.get('tag') ?? undefined

  const setTag = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (activeTagId === id) {
        params.delete('tag')
      } else {
        params.set('tag', id)
      }
      params.delete('page')

      const newParams = params.toString()
      router.push(pathname + (newParams ? '?' + newParams : ''))
    },
    [activeTagId, pathname, router, searchParams],
  )

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-sm font-medium text-muted-foreground">Show all:</span>
      {tags.map((tag) => {
        const isActive = activeTagId === String(tag.id)
        return (
          <button
            key={tag.id}
            type="button"
            data-cursor-hover
            onClick={() => setTag(String(tag.id))}
            className={clsx(
              'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              isActive
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            {tag.label}
          </button>
        )
      })}
      {activeTagId ? (
        <button
          type="button"
          data-cursor-hover
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('tag')
            params.delete('page')
            const newParams = params.toString()
            router.push(pathname + (newParams ? '?' + newParams : ''))
          }}
          className="rounded-full px-2 py-1 text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Clear
        </button>
      ) : null}
    </div>
  )
}

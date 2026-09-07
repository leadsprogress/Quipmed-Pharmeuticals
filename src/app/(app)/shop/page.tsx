import { ShopGrid } from '@/components/Shop/ShopGrid'
import { FilterItemDropdown } from '@/components/layout/search/filter/FilterItemDropdown'
import { sorting } from '@/lib/constants'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'

export const metadata = {
  description: 'Search for products in the store.',
  title: 'Shop',
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const { q: searchValue, sort, category: rawCategory } = await searchParams
  // Category filtering matches by relationship ID (see Categories.client.tsx) — guard against
  // any malformed/non-numeric value reaching the DB query, which otherwise throws a hard 500.
  const category =
    typeof rawCategory === 'string' && /^\d+$/.test(rawCategory) ? rawCategory : undefined
  const payload = await getPayload({ config: configPromise })

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInINR: true,
      composition: true,
      packing: true,
    },
    ...(sort ? { sort } : { sort: 'title' }),
    ...(searchValue || category
      ? {
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              // `description` is a richText (JSON) field — Postgres can't run `like` against
              // it directly (throws a hard query error), so search plain-text fields only.
              ...(searchValue
                ? [
                    {
                      or: [
                        {
                          title: {
                            like: searchValue,
                          },
                        },
                        {
                          composition: {
                            like: searchValue,
                          },
                        },
                      ],
                    },
                  ]
                : []),
              ...(category
                ? [
                    {
                      categories: {
                        contains: category,
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : {}),
  })

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

  return (
    <div>
      <div className="mb-4 flex justify-end md:hidden">
        <Suspense fallback={null}>
          <div className="w-44">
            <FilterItemDropdown list={sorting} />
          </div>
        </Suspense>
      </div>

      {searchValue ? (
        <p className="mb-4">
          {products.docs?.length === 0
            ? 'There are no products that match '
            : `Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <p className="mb-4">No products found. Please try different filters.</p>
      )}

      {products?.docs.length > 0 ? <ShopGrid products={products.docs} /> : null}
    </div>
  )
}

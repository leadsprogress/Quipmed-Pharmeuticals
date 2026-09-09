import { ShopGrid } from '@/components/Shop/ShopGrid'
import { ShopPagination } from '@/components/Shop/ShopPagination'
import { FilterItemDropdown } from '@/components/layout/search/filter/FilterItemDropdown'
import { sorting } from '@/lib/constants'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getCachedProducts } from '@/utilities/getCachedProducts'
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
  const { q: searchValue, sort, category: rawCategory, page: rawPage } = await searchParams
  // Category filtering matches by relationship ID (see Categories.client.tsx) — guard against
  // any malformed/non-numeric value reaching the DB query, which otherwise throws a hard 500.
  const category =
    typeof rawCategory === 'string' && /^\d+$/.test(rawCategory) ? rawCategory : undefined
  const parsedPage = typeof rawPage === 'string' ? parseInt(rawPage, 10) : 1
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const sortValue = typeof sort === 'string' ? sort : undefined
  const searchValueString = typeof searchValue === 'string' ? searchValue : undefined

  const [products, settings] = await Promise.all([
    getCachedProducts({
      category,
      page,
      searchValue: searchValueString,
      sort: sortValue,
    }),
    getCachedGlobal('settings', 0)(),
  ])

  const discountBadgesEnabled = settings?.enableDiscountBadges !== false

  const resultsText = products.totalDocs > 1 ? 'results' : 'result'

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
          {products.totalDocs === 0
            ? 'There are no products that match '
            : `Showing ${products.totalDocs} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      ) : null}

      {!searchValue && products.docs?.length === 0 && (
        <p className="mb-4">No products found. Please try different filters.</p>
      )}

      {products?.docs.length > 0 ? (
        <ShopGrid products={products.docs} discountBadgesEnabled={discountBadgesEnabled} />
      ) : null}

      <ShopPagination
        currentParams={{
          q: searchValueString,
          sort: sortValue,
          category,
        }}
        hasNextPage={products.hasNextPage}
        hasPrevPage={products.hasPrevPage}
        page={products.page ?? page}
        totalPages={products.totalPages}
      />
    </div>
  )
}

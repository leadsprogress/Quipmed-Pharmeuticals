import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

export const PRODUCTS_PER_PAGE = 24

type GetProductsArgs = {
  category?: string
  page: number
  searchValue?: string
  sort?: string
}

async function findProducts({ category, page, searchValue, sort }: GetProductsArgs) {
  const payload = await getPayload({ config: configPromise })

  return payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    limit: PRODUCTS_PER_PAGE,
    page,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInINR: true,
      composition: true,
      packing: true,
    },
    sort: sort || 'title',
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
}

// The shop page is filtered/sorted/paginated a huge number of ways, so the cache key needs
// every one of those inputs — unstable_cache folds a wrapped function's own arguments into its
// cache key automatically, on top of the fixed key below. Invalidated as a whole (rather than
// per-combination) by revalidateTag('products') in src/collections/Products/hooks — see there.
export const getCachedProducts = unstable_cache(findProducts, ['shop-products'], {
  tags: ['products'],
})

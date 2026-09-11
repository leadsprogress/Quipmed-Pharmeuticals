import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import type { Where } from 'payload'

export const dynamic = 'force-dynamic'

const RESULT_LIMIT = 8
const PAGE_RESULT_LIMIT = 6

type PageResult =
  | { type: 'link'; title: string; href: string }
  | { type: 'action'; title: string; action: 'open-cart' }

// App routes that aren't CMS-managed Pages docs, so they can't be found by a DB query — matched
// by a plain substring test against the typed query instead. "Cart" has no real page (it's a
// slide-over drawer, not a URL), so it dispatches a client-side event instead of navigating.
const STATIC_APP_ROUTES: PageResult[] = [
  { type: 'link', title: 'Shop / All Products', href: '/shop' },
  { type: 'link', title: 'Checkout', href: '/checkout' },
  { type: 'action', title: 'Cart', action: 'open-cart' },
  { type: 'link', title: 'Login', href: '/login' },
  { type: 'link', title: 'Create Account', href: '/create-account' },
  { type: 'link', title: 'Find My Order', href: '/find-order' },
  { type: 'link', title: 'My Orders', href: '/orders' },
  { type: 'link', title: 'My Account', href: '/account' },
]

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() || ''

  if (q.length < 1) {
    return NextResponse.json({ products: [], pages: [], query: q })
  }

  const payload = await getPayload({ config: configPromise })

  const lowerQ = q.toLowerCase()

  const [matchingPages, matchingAppRoutes] = await Promise.all([
    payload.find({
      collection: 'pages',
      limit: PAGE_RESULT_LIMIT,
      pagination: false,
      draft: false,
      overrideAccess: false,
      select: { title: true, slug: true },
      where: {
        and: [{ _status: { equals: 'published' } }, { title: { like: q } }],
      },
    }),
    Promise.resolve(
      STATIC_APP_ROUTES.filter((route) => route.title.toLowerCase().includes(lowerQ)),
    ),
  ])

  // Match products directly on their own text fields, and separately match categories by
  // title so a search like "diabetic" surfaces every product in the "Diabetic Range" category
  // even though that word never appears on the product itself.
  const matchingCategories = await payload.find({
    collection: 'categories',
    limit: 20,
    pagination: false,
    select: { title: true },
    where: {
      title: {
        like: q,
      },
    },
  })

  const categoryIds = matchingCategories.docs.map((doc) => doc.id)

  const categoryPages: PageResult[] = matchingCategories.docs
    .slice(0, PAGE_RESULT_LIMIT)
    .map((category) => ({
      type: 'link',
      title: category.title,
      href: `/shop?category=${category.id}`,
    }))

  const pages: PageResult[] = [
    ...matchingPages.docs.map(
      (page): PageResult => ({
        type: 'link',
        title: page.title,
        href: page.slug === 'home' ? '/' : `/${page.slug}`,
      }),
    ),
    ...matchingAppRoutes,
    ...categoryPages,
  ].slice(0, PAGE_RESULT_LIMIT)

  const where: Where = {
    and: [
      { _status: { equals: 'published' } },
      {
        or: [
          { title: { like: q } },
          { composition: { like: q } },
          { packType: { like: q } },
          ...(categoryIds.length
            ? [
                {
                  categories: {
                    in: categoryIds,
                  },
                },
              ]
            : []),
        ],
      },
    ],
  }

  const products = await payload.find({
    collection: 'products',
    draft: false,
    limit: RESULT_LIMIT,
    overrideAccess: false,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInINR: true,
      composition: true,
      imageUrl: true,
    },
    sort: 'title',
    where,
  })

  return NextResponse.json({
    products: products.docs,
    pages,
    query: q,
    total: products.totalDocs,
  })
}

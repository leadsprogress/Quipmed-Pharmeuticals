import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'

import type { Where } from 'payload'

export const dynamic = 'force-dynamic'

const RESULT_LIMIT = 8

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() || ''

  if (q.length < 2) {
    return NextResponse.json({ products: [], query: q })
  }

  const payload = await getPayload({ config: configPromise })

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
    query: q,
    total: products.totalDocs,
  })
}

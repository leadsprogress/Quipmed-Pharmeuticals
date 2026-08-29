import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { CategoryShowcaseClient } from '@/blocks/CategoryShowcase/Component.client'
import { Hero } from '@/components/Home/Hero'
import { FeaturedRail } from '@/components/Home/FeaturedRail'
import { WhyChooseUs } from '@/components/Home/WhyChooseUs'
import { PromoBanner } from '@/components/Home/PromoBanner'
import { PopularRanges } from '@/components/Home/PopularRanges'
import { HealthAndVisit } from '@/components/Home/HealthAndVisit'
import type { Category, Product } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Amulya Medicals — Genuine Products, Delivered',
  description:
    'Trusted pharmaceutical brands across cardiac, diabetic, orthopedic and critical care ranges — sourced directly, priced fairly. Bhagyanagar Colony, Hyderabad.',
}

async function getCategories(): Promise<Category[]> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({ collection: 'categories', limit: 100, sort: 'title', depth: 1 })
  return result.docs
}

async function getProductsByCategoryTitle(title: string, limit: number): Promise<Product[]> {
  const payload = await getPayload({ config: configPromise })
  const category = await payload.find({
    collection: 'categories',
    where: { title: { equals: title } },
    limit: 1,
  })
  const categoryId = category.docs[0]?.id
  if (!categoryId) return []
  const products = await payload.find({
    collection: 'products',
    where: { categories: { in: [categoryId] } },
    limit,
    depth: 1,
  })
  return products.docs
}

export default async function HomePage() {
  const [categories, newLaunches, cardiac, diabetic, orthopedic] = await Promise.all([
    getCategories(),
    getProductsByCategoryTitle('New Launches', 10),
    getProductsByCategoryTitle('Cardiac Range', 8),
    getProductsByCategoryTitle('Diabetic Range', 8),
    getProductsByCategoryTitle('Orthopedic Range', 8),
  ])

  return (
    <div className="bg-gradient-to-b from-primary/5 via-background to-background">
      <Hero />

      <CategoryShowcaseClient
        heading="Shop by Category"
        subheading="Trusted healthcare essentials, sorted the way you shop."
        categories={categories}
      />

      <FeaturedRail heading="New Launches" products={newLaunches} />

      <WhyChooseUs />

      <PromoBanner />

      <PopularRanges
        ranges={[
          { label: 'Cardiac Range', products: cardiac },
          { label: 'Diabetic Range', products: diabetic },
          { label: 'Orthopedic Range', products: orthopedic },
        ]}
      />

      <HealthAndVisit />
    </div>
  )
}

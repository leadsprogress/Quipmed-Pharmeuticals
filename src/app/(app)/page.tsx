import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React from 'react'
import { notFound } from 'next/navigation'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'

export const metadata: Metadata = {
  title: 'Amulya Medicals — Genuine Products, Delivered',
  description:
    'Trusted pharmaceutical brands across cardiac, diabetic, orthopedic and critical care ranges — sourced directly, priced fairly. Bhagyanagar Colony, Hyderabad.',
}

const queryHomePage = async () => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    depth: 2,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        { slug: { equals: 'home' } },
        ...(draft ? [] : [{ _status: { equals: 'published' as const } }]),
      ],
    },
  })

  return result.docs?.[0] || null
}

export default async function HomePage() {
  const page = await queryHomePage()

  if (!page) {
    return notFound()
  }

  const { hero, layout } = page

  return (
    <div className="bg-gradient-to-b from-primary/5 via-background to-background">
      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </div>
  )
}

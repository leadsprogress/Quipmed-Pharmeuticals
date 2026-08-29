import type { Metadata } from 'next'
import React from 'react'

import { StatsBar } from '@/components/About/StatsBar'
import { Timeline } from '@/components/About/Timeline'
import { ValueCards } from '@/components/About/ValueCards'

export const metadata: Metadata = { title: 'About Us | Amulya Medicals' }

export default function AboutPage() {
  return (
    <>
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/15 py-16">
        <div className="container">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
            About Us
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Built to make healthcare access simpler
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Amulya Medicals is a [placeholder: brief company history — how many years in
            operation] pharmacy based in Bhagyanagar Colony, Hyderabad, now bringing that same
            catalog and reliability directly to customers online.
          </p>
        </div>
      </div>

      <StatsBar />

      <ValueCards />

      <div className="border-t border-border bg-muted/40 py-16">
        <div className="container max-w-2xl">
          <Timeline />
        </div>
      </div>
    </>
  )
}

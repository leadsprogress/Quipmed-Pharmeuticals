import type { Metadata } from 'next'
import React from 'react'

import { Accordion } from '@/components/FAQ/Accordion'

export const metadata: Metadata = { title: 'FAQ | Amulya Medicals' }

export default function FAQPage() {
  return (
    <>
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/15 py-16">
        <div className="container">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
            FAQ
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Frequently Asked Questions
          </h1>
        </div>
      </div>

      <div className="container max-w-2xl py-16">
        <Accordion />
      </div>
    </>
  )
}

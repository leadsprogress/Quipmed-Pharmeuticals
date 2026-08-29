import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = { title: 'Terms & Conditions | Amulya Medicals' }

export default function TermsPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight">Terms & Conditions</h1>
      <p className="mt-4 text-muted-foreground">
        [Placeholder — standard e-commerce terms and conditions to be drafted/reviewed with the
        client before this site goes live.]
      </p>
    </div>
  )
}

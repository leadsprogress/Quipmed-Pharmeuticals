import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = { title: 'Return Policy | Amulya Medicals' }

export default function ReturnsPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight">Return Policy</h1>
      <p className="mt-4 text-muted-foreground">
        [Placeholder — return/refund policy for a pharmacy (subject to real regulatory
        constraints on returning dispensed medicines) needs to be finalized with the client.]
      </p>
    </div>
  )
}

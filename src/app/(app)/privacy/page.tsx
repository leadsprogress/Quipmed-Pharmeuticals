import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = { title: 'Privacy Policy | Amulya Medicals' }

export default function PrivacyPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">
        [Placeholder — a privacy policy covering data collection, storage and use needs to be
        drafted/reviewed with the client before this site goes live.]
      </p>
    </div>
  )
}

import type { Metadata } from 'next'
import React from 'react'

import { ContactForm } from '@/components/Contact/ContactForm'

export const metadata: Metadata = { title: 'Contact Us | Amulya Medicals' }

const INFO_CARDS = [
  { icon: 'fa-phone', title: 'Call Us', body: '[Phone number — to be provided]' },
  { icon: 'fa-envelope', title: 'Email Us', body: '[Support email — to be provided]' },
  {
    icon: 'fa-location-dot',
    title: 'Visit Us',
    body: 'Bhagyanagar Colony, Hyderabad. [Exact address — to be provided]',
  },
]

export default function ContactPage() {
  return (
    <>
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/15 py-16">
        <div className="container">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary">
            Contact
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            We'd Love to Hear From You
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Questions about an order, a prescription upload, or bulk pricing — reach out and
            we'll get back to you.
          </p>
        </div>
      </div>

      <div className="container grid gap-10 py-16 md:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
          {INFO_CARDS.map((card, i) => (
            <div
              key={card.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                  i % 2 === 0 ? 'bg-primary/10 text-primary' : 'bg-secondary/15 text-secondary'
                }`}
              >
                <i className={`fa-solid ${card.icon}`} />
              </span>
              <div>
                <p className="font-semibold">{card.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{card.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <ContactForm />
        </div>
      </div>
    </>
  )
}

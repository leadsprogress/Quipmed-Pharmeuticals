import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'
import { ContactForm } from '@/components/Contact/ContactForm'

export const ContactBlockComponent: React.FC<{ id?: DefaultDocumentIDType }> = async () => {
  const footer = await getCachedGlobal('footer', 0)()

  const infoCards = [
    {
      icon: 'fa-phone',
      title: 'Call Us',
      body: footer?.contact?.phone || '[Phone number — to be provided]',
    },
    {
      icon: 'fa-envelope',
      title: 'Email Us',
      body: footer?.contact?.email || '[Support email — to be provided]',
    },
    {
      icon: 'fa-location-dot',
      title: 'Visit Us',
      body: footer?.contact?.address || 'Bhagyanagar Colony, Hyderabad. [Exact address — to be provided]',
    },
  ]

  return (
    <div className="container grid gap-10 md:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
        {infoCards.map((card, i) => (
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
  )
}

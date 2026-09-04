import { PhoneIcon } from 'lucide-react'
import React from 'react'

type Props = {
  label?: string | null
  heading?: string | null
  phoneLabel?: string | null
  phone?: string | null
}

export const CallToOrder: React.FC<Props> = ({ label, heading, phoneLabel, phone }) => {
  // Same convention as the rest of the site (footer, contact page) — show a placeholder rather
  // than silently hiding the whole section until a real number is set in Admin → Footer.
  const displayPhone = phone || '[Phone number — to be provided]'
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined

  return (
    <div className="container py-8">
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-secondary/40 bg-card px-6 py-6 sm:flex-row sm:items-center sm:px-10">
        <p className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
          {label || 'Place'}
          <br />
          {heading || 'Your Order Via'}
        </p>

        <a
          href={telHref}
          data-cursor-hover
          className={`flex items-center gap-4 ${!telHref ? 'pointer-events-none' : ''}`}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
            <PhoneIcon className="h-6 w-6 fill-current" />
          </span>
          <span>
            <span className="block text-sm text-muted-foreground">{phoneLabel || 'Call Us On'}</span>
            <span className="block text-xl font-semibold text-foreground">{displayPhone}</span>
          </span>
        </a>
      </div>
    </div>
  )
}

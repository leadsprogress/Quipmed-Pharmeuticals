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
    <div className="container pb-2 pt-2">
      <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-secondary/40 bg-card px-4 py-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:px-10 sm:text-left">
        <p className="text-base font-semibold leading-tight text-foreground sm:whitespace-nowrap sm:text-2xl">
          {label || 'Place'} {heading || 'Your Order Via'}
        </p>

        <a
          href={telHref}
          data-cursor-hover
          className={`flex items-center gap-3 sm:gap-4 ${!telHref ? 'pointer-events-none' : ''}`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366] sm:h-14 sm:w-14">
            <PhoneIcon className="h-5 w-5 fill-current sm:h-6 sm:w-6" />
          </span>
          <span className="text-left">
            <span className="block text-xs text-muted-foreground sm:text-sm">{phoneLabel || 'Call Us On'}</span>
            <span className="block text-sm font-semibold text-foreground sm:text-xl">{displayPhone}</span>
          </span>
        </a>
      </div>
    </div>
  )
}

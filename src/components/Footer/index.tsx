import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const { COMPANY_NAME, SITE_NAME } = process.env

const QUICK_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Track Order', href: '/find-order' },
]

const LEGAL_LINKS = [
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Return Policy', href: '/returns' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : '')
  const copyrightName = COMPANY_NAME || SITE_NAME || ''

  return (
    <footer className="border-t border-border bg-muted/40 text-sm text-muted-foreground">
      <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link href="/">
            <Image
              src="/logo/logo-transparent.png"
              alt="Amulya Medicals"
              width={180}
              height={54}
              className="h-14 w-auto object-contain"
            />
          </Link>
          <p className="mt-3 max-w-xs text-xs">
            Genuine, authentic healthcare essentials, delivered reliably across Hyderabad.
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
            Quick Links
          </p>
          <ul className="space-y-2">
            {QUICK_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">Legal</p>
          <ul className="space-y-2">
            {LEGAL_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
            Contact
          </p>
          <ul className="space-y-2 text-xs">
            <li>[Phone number — to be provided]</li>
            <li>[Support email — to be provided]</li>
            <li>[Business address — to be provided]</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6">
        <div className="container flex flex-col items-center gap-1 text-xs md:flex-row md:justify-between">
          <p>
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
          </p>
          <p>Licensed Pharmacy · [Drug License No. — to be provided]</p>
        </div>
      </div>
    </footer>
  )
}

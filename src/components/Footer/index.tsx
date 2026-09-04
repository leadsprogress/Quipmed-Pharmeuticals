import { getCachedGlobal } from '@/utilities/getGlobals'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const { COMPANY_NAME, SITE_NAME } = process.env

const DEFAULT_QUICK_LINKS = [
  { label: 'About Us', url: '/about' },
  { label: 'Contact Us', url: '/contact' },
  { label: 'FAQ', url: '/faq' },
  { label: 'Track Order', url: '/find-order' },
]

const DEFAULT_LEGAL_LINKS = [
  { label: 'Terms & Conditions', url: '/terms' },
  { label: 'Privacy Policy', url: '/privacy' },
  { label: 'Return Policy', url: '/returns' },
]

const SOCIAL_ICON: Record<string, string> = {
  facebook: 'fa-brands fa-facebook',
  instagram: 'fa-brands fa-instagram',
  linkedin: 'fa-brands fa-linkedin',
  twitter: 'fa-brands fa-x-twitter',
  whatsapp: 'fa-brands fa-whatsapp',
  youtube: 'fa-brands fa-youtube',
}

export async function Footer() {
  const footer = await getCachedGlobal('footer', 1)()

  const logo = footer?.logo && typeof footer.logo === 'object' ? footer.logo : null
  // Relative, not prefixed with NEXT_PUBLIC_SERVER_URL — next/image rejects a same-origin
  // absolute URL under `remotePatterns` (anti-SSRF-loop check); it must stay relative to match
  // the `localPatterns` entry for `/api/media/file/**`.
  const logoSrc = logo?.url || '/logo/logo-transparent.png'

  const tagline =
    footer?.tagline ||
    'Genuine, authentic healthcare essentials, delivered reliably across Hyderabad.'

  const quickLinks =
    footer?.quickLinks && footer.quickLinks.length > 0 ? footer.quickLinks : DEFAULT_QUICK_LINKS
  const legalLinks =
    footer?.legalLinks && footer.legalLinks.length > 0 ? footer.legalLinks : DEFAULT_LEGAL_LINKS

  const phone = footer?.contact?.phone || '[Phone number — to be provided]'
  const email = footer?.contact?.email || '[Support email — to be provided]'
  const address = footer?.contact?.address || '[Business address — to be provided]'
  const licenseLine = footer?.drugLicenseNumber
    ? `Drug License No. ${footer.drugLicenseNumber}`
    : '[Drug License No. — to be provided]'

  const socialLinks = (footer?.socialLinks || []).filter((link) => link.url)

  const currentYear = new Date().getFullYear()
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : '')
  const copyrightName = footer?.copyrightName || COMPANY_NAME || SITE_NAME || ''

  return (
    <footer className="border-t border-border bg-muted/40 text-sm text-muted-foreground">
      <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link href="/">
            <Image
              src={logoSrc}
              alt="Amulya Medicals"
              width={180}
              height={54}
              className="h-14 w-auto object-contain"
            />
          </Link>
          <p className="mt-3 max-w-xs text-xs">{tagline}</p>

          {socialLinks.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.platform}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary"
                >
                  <i className={SOCIAL_ICON[link.platform] || 'fa-solid fa-link'} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
            Quick Links
          </p>
          <ul className="space-y-2">
            {quickLinks.map((item, i) => (
              <li key={i}>
                <Link href={item.url} className="hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">Legal</p>
          <ul className="space-y-2">
            {legalLinks.map((item, i) => (
              <li key={i}>
                <Link href={item.url} className="hover:text-primary">
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
            <li>{phone}</li>
            <li>{email}</li>
            <li>{address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6">
        <div className="container flex flex-col items-center gap-1 text-xs md:flex-row md:justify-between">
          <p>
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith('.') ? '.' : ''} All rights reserved.
          </p>
          <p>Licensed Pharmacy · {licenseLine}</p>
        </div>
      </div>
    </footer>
  )
}

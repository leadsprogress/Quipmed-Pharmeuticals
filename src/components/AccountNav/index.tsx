'use client'

import clsx from 'clsx'
import { LogOutIcon, MapPinIcon, PackageIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  className?: string
}

const LINKS = [
  { href: '/account', label: 'Account settings', Icon: UserIcon, exact: true },
  { href: '/account/addresses', label: 'Addresses', Icon: MapPinIcon, exact: true },
  { href: '/orders', label: 'Orders', Icon: PackageIcon, exact: false },
]

// Same pill styling as the shop's category list, built on theme tokens (bg-primary / muted-
// foreground / border) instead of a translucent green so it reads in both light and dark mode.
export const AccountNav: React.FC<Props> = ({ className }) => {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Account"
      className={clsx('rounded-2xl border border-border bg-card p-3 shadow-sm', className)}
    >
      <ul className="flex flex-col gap-1">
        {LINKS.map(({ href, label, Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-3 rounded-full px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

      <hr className="my-3 border-border" />

      <Link
        href="/logout"
        className="flex items-center gap-3 rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LogOutIcon className="h-4 w-4 shrink-0" />
        Log out
      </Link>
    </nav>
  )
}

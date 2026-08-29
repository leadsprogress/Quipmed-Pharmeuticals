'use client'

import Link from 'next/link'
import React from 'react'

import { useAuth } from '@/providers/Auth'

export const AccountLink: React.FC = () => {
  const { user } = useAuth()

  return (
    <Link
      href={user ? '/account' : '/login'}
      data-cursor-hover
      className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
    >
      <i className="fa-regular fa-user text-base" />
      <span className="hidden sm:inline">{user ? 'Account' : 'Login'}</span>
    </Link>
  )
}

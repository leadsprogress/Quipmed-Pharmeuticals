'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { useTheme } from '@/providers/Theme'

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme()
  // Avoid a hydration mismatch: the real theme is only known once InitTheme's inline script has
  // run and the provider has read `data-theme` off <html> on the client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      data-cursor-hover
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary ${className || ''}`}
    >
      {mounted ? (
        isDark ? (
          <SunIcon className="h-4 w-4" />
        ) : (
          <MoonIcon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  )
}

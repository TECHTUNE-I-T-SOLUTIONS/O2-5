'use client'

import { useEffect, useState } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check system preference and apply theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const html = document.documentElement

    if (prefersDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}

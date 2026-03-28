'use client'

import * as React from 'react'
import {
  isTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type Theme,
} from '@/lib/theme'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function persistTheme(theme: Theme, _resolvedTheme: ResolvedTheme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function ThemeProvider({
  children,
  initialTheme = 'system',
  initialResolvedTheme = 'light',
}: {
  children: React.ReactNode
  initialTheme?: Theme
  initialResolvedTheme?: ResolvedTheme
}) {
  const [theme, setThemeState] = React.useState<Theme>(initialTheme)
  const [resolvedTheme, setResolvedTheme] =
    React.useState<ResolvedTheme>(initialResolvedTheme)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const syncTheme = (nextTheme: Theme) => {
      const nextResolvedTheme = resolveTheme(nextTheme)
      setResolvedTheme(nextResolvedTheme)
      applyTheme(nextResolvedTheme)
      persistTheme(nextTheme, nextResolvedTheme)
    }

    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        syncTheme('system')
      }
    }

    syncTheme(theme)
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [theme])

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

    if (!isTheme(storedTheme) || storedTheme === theme) {
      return
    }

    setThemeState(storedTheme)
  }, [theme])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

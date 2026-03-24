export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'
export const THEME_COOKIE = 'theme'
export const RESOLVED_THEME_COOKIE = 'resolved-theme'

export function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function isResolvedTheme(value: string | null | undefined): value is ResolvedTheme {
  return value === 'light' || value === 'dark'
}

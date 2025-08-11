import { type Theme, type ResolvedTheme, THEME_STORAGE_KEY } from './constants'

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) as Theme
  } catch {
    return null
  }
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

export function applyTheme(resolvedTheme: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)
  root.setAttribute('data-theme', resolvedTheme)

  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    const colors: Record<ResolvedTheme, string> = {
      light: '#ffffff',
      dark: '#0f172a'
    }
    metaThemeColor.setAttribute('content', colors[resolvedTheme])
  }
}



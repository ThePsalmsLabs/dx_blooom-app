'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { type Theme, type ResolvedTheme } from '@/lib/theme/constants'
import { getSystemTheme, getStoredTheme, setStoredTheme, resolveTheme, applyTheme } from '@/lib/theme/utils'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  systemTheme: ResolvedTheme
  isLoaded: boolean
  isTransitioning: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  enableTransitions?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableTransitions = true
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const resolvedTheme = resolveTheme(theme)

  useEffect(() => {
    const storedTheme = getStoredTheme()
    const currentSystemTheme = getSystemTheme()
    setSystemTheme(currentSystemTheme)
    if (storedTheme) {
      setThemeState(storedTheme)
    }
    applyTheme(resolveTheme(storedTheme || defaultTheme))
    setIsLoaded(true)
  }, [defaultTheme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const newSystemTheme: ResolvedTheme = e.matches ? 'dark' : 'light'
      setSystemTheme(newSystemTheme)
      if (theme === 'system') {
        applyTheme(newSystemTheme)
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  useEffect(() => {
    if (!isLoaded) return
    if (typeof document !== 'undefined') {
      const doc = document.documentElement
      if (enableTransitions) {
        setIsTransitioning(true)
        // Use a slightly longer, eased transition for smoother perception
        doc.style.setProperty('--theme-transition-duration', '400ms')
        doc.style.setProperty('--theme-transition-ease', 'cubic-bezier(0.22, 1, 0.36, 1)')
      }
      applyTheme(resolvedTheme)
      if (enableTransitions) {
        const timeout = window.setTimeout(() => {
          setIsTransitioning(false)
          doc.style.removeProperty('--theme-transition-duration')
          doc.style.removeProperty('--theme-transition-ease')
        }, 420)
        return () => window.clearTimeout(timeout)
      }
    }
  }, [resolvedTheme, isLoaded, enableTransitions])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    setStoredTheme(newTheme)
  }, [])

  const contextValue: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    systemTheme,
    isLoaded,
    isTransitioning
  }

  return (
    <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}



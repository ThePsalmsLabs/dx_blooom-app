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
    if (enableTransitions && typeof document !== 'undefined') {
      setIsTransitioning(true)
      document.documentElement.style.setProperty('--theme-transition-duration', '0.3s')
      setTimeout(() => {
        setIsTransitioning(false)
        document.documentElement.style.removeProperty('--theme-transition-duration')
      }, 300)
    }
    applyTheme(resolvedTheme)
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



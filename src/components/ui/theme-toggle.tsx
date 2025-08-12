'use client'

import React, { useState } from 'react'
import { Moon, Sun, Monitor, Check } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui'
import { useTheme } from '@/components/providers/ThemeProvider'
import { THEME_CONFIG } from '@/lib/theme/constants'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'inline' | 'compact'
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({
  variant = 'dropdown',
  size = 'default',
  showLabel = false,
  className
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, isTransitioning } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [pressTimer, setPressTimer] = useState<number | null>(null)

  const getThemeIcon = (themeName: typeof theme) => {
    switch (themeName) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
    }
  }

  const getCurrentIcon = () => {
    if (isTransitioning) {
      return <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
    }
    return getThemeIcon(theme)
  }

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={() => {
          const themes = ['light', 'dark', 'system'] as const
          const currentIndex = themes.indexOf(theme)
          const nextTheme = themes[(currentIndex + 1) % themes.length]
          setTheme(nextTheme)
        }}
        className={cn('transition-all duration-200 hover:bg-accent/50', className)}
        title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`}
      >
        {getCurrentIcon()}
        {showLabel && <span className="ml-2 capitalize">{THEME_CONFIG[theme].name}</span>}
      </Button>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-1 p-1 rounded-md bg-muted', className)}>
        <Button
          variant={theme === 'light' ? 'default' : 'ghost'}
          size={size}
          className="h-8 w-8 p-0"
          title="Light"
          onClick={() => setTheme('light')}
        >
          <Sun className="h-4 w-4" />
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'ghost'}
          size={size}
          className="h-8 w-8 p-0"
          title="Dark"
          onClick={() => setTheme('dark')}
        >
          <Moon className="h-4 w-4" />
        </Button>
        <Button
          variant={theme === 'system' ? 'default' : 'ghost'}
          size={size}
          className="h-8 w-8 p-0"
          title="System"
          onClick={() => setTheme('system')}
        >
          <Monitor className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Compact: single-icon button that cycles themes on click;
  // long-press or right-click opens the full dropdown for explicit selection.
  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size}
            aria-label={`Theme: ${theme}`}
            title={`Theme: ${theme}. Click to switch, press-and-hold for options`}
            className={cn(
              'h-8 w-8 p-0 rounded-full transition-all duration-200 hover:bg-accent/40 ring-1 ring-border/60 hover:ring-primary/60',
              className
            )}
            onClick={() => {
              const themes = ['light', 'dark', 'system'] as const
              const currentIndex = themes.indexOf(theme)
              const nextTheme = themes[(currentIndex + 1) % themes.length]
              setTheme(nextTheme)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              setIsOpen(true)
            }}
            onPointerDown={() => {
              // open menu on long-press
              const id = window.setTimeout(() => setIsOpen(true), 450)
              setPressTimer(id)
            }}
            onPointerUp={() => {
              if (pressTimer) {
                window.clearTimeout(pressTimer)
                setPressTimer(null)
              }
            }}
          >
            {getCurrentIcon()}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(THEME_CONFIG).map(([key, config]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => setTheme(key as typeof theme)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{config.icon}</span>
                <span className="text-sm">{config.name}</span>
              </div>
              {theme === key && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} className={cn('transition-all duration-200 hover:bg-accent/50', className)}>
          {getCurrentIcon()}
          {showLabel && <span className="ml-2 capitalize">{THEME_CONFIG[theme].name}</span>}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme Preference</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(THEME_CONFIG).map(([key, config]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setTheme(key as typeof theme)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{config.icon}</span>
              <div className="flex flex-col">
                <span className="font-medium">{config.name}</span>
                <span className="text-xs text-muted-foreground">{config.description}</span>
              </div>
            </div>
            {theme === key && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Current: {resolvedTheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-muted rounded-md', className)}>
      {Object.entries(THEME_CONFIG).map(([key, config]) => (
        <Button
          key={key}
          variant={theme === key ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme(key as typeof theme)}
          className="h-8 w-8 p-0"
          title={config.description}
        >
          <span className="text-sm">{config.icon}</span>
        </Button>
      ))}
    </div>
  )
}



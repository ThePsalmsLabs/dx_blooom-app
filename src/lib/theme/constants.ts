export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'onchain-platform-theme'
export const THEME_ATTRIBUTE = 'data-theme'

export const THEME_CONFIG = {
  light: {
    name: 'Light',
    description: 'Clean, bright interface optimized for daylight use',
    icon: '☀️',
    accent: 'amber'
  },
  dark: {
    name: 'Dark',
    description: 'Elegant dark interface that reduces eye strain',
    icon: '🌙',
    accent: 'blue'
  },
  system: {
    name: 'System',
    description: 'Automatically match your device settings',
    icon: '💻',
    accent: 'adaptive'
  }
} as const



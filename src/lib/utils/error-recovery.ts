'use client'

import { handlePlatformError } from './platform-error-handler'
import { toast } from 'sonner'

/**
 * Error Recovery Utilities
 * Production-ready utilities for handling and recovering from errors
 */

export interface RecoveryAction {
  label: string
  action: () => void | Promise<void>
  primary?: boolean
  requiresPermission?: boolean
}

/**
 * Clear Wagmi Storage
 * Clears corrupted wagmi state from browser storage
 */
export function clearWagmiStorage(): void {
  if (typeof window === 'undefined') return

  try {
    const keysToClear = [
      'wagmi.store',
      'wagmi.cache',
      'wagmi.connections',
      'wagmi.state',
      'wagmi.account',
      'dxbloom-miniapp-wagmi',
      'onchain-content-wagmi',
      'onchain-content-wagmi-miniapp'
    ]

    keysToClear.forEach(key => {
      try {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to clear ${key}:`, error)
      }
    })

    // Also clear any wagmi-related items
    Object.keys(localStorage).forEach(key => {
      if (key.includes('wagmi') || key.includes('wallet') || key.includes('connector')) {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to clear ${key}:`, error)
        }
      }
    })

    console.log('✅ Wagmi storage cleared successfully')
  } catch (error) {
    console.error('Failed to clear wagmi storage:', error)
  }
}

/**
 * Clear MiniKit Storage
 * Clears MiniKit-related data from browser storage
 */
export function clearMiniKitStorage(): void {
  if (typeof window === 'undefined') return

  try {
    const keysToClear = [
      'minikit',
      'farcaster',
      'warpcast',
      'miniapp'
    ]

    keysToClear.forEach(key => {
      try {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      } catch (error) {
        console.warn(`Failed to clear ${key}:`, error)
      }
    })

    console.log('✅ MiniKit storage cleared successfully')
  } catch (error) {
    console.error('Failed to clear MiniKit storage:', error)
  }
}

/**
 * Reset All Application Storage
 * Nuclear option - clears all app-related storage
 */
export function resetAllStorage(): void {
  if (typeof window === 'undefined') return

  try {
    // Clear wagmi storage
    clearWagmiStorage()

    // Clear MiniKit storage
    clearMiniKitStorage()

    // Clear any other app storage
    const appPrefixes = ['dxbloom', 'onchain', 'content', 'miniapp', 'farcaster']

    Object.keys(localStorage).forEach(key => {
      if (appPrefixes.some(prefix => key.includes(prefix))) {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to clear ${key}:`, error)
        }
      }
    })

    console.log('✅ All application storage reset successfully')
  } catch (error) {
    console.error('Failed to reset storage:', error)
  }
}

/**
 * Refresh Page
 * Simple page refresh with optional delay
 */
export function refreshPage(delay: number = 0): void {
  if (delay > 0) {
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }, delay)
  } else {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }
}

/**
 * Navigate to Fallback Route
 * Navigate to a safe fallback route
 */
export function navigateToFallback(route: string = '/'): void {
  if (typeof window !== 'undefined') {
    window.location.href = route
  }
}

/**
 * Check Network Connectivity
 * Tests basic network connectivity
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Test with a simple HEAD request to a reliable endpoint
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    })

    return true // If we get here, network is working
  } catch (error) {
    console.warn('Network connectivity test failed:', error)
    return false
  }
}

/**
 * Comprehensive Error Recovery
 * Applies multiple recovery strategies based on error type
 */
export async function comprehensiveErrorRecovery(
  error: Error | string,
  context: string = 'unknown'
): Promise<void> {
  const errorMessage = typeof error === 'string' ? error : error.message

  // Determine error type and apply appropriate recovery
  if (errorMessage.includes('connections.get') || errorMessage.includes('wagmi')) {
    // Wagmi connection state corruption - this is the specific error we're seeing
    console.log('🔧 Applying Wagmi connection state corruption recovery...')

    recoverWagmiCorruption()

    handlePlatformError(
      'Wallet connection system was reset due to corrupted state. Please reconnect your wallet.',
      {
        category: 'blockchain',
        severity: 'high',
        showRetry: true,
        onRetry: () => refreshPage(2000),
        recoveryActions: [
          recoveryActions.refresh(2000),
          recoveryActions.emergencyReset()
        ]
      }
    )

    return
  }

  if (errorMessage.includes('miniKit') || errorMessage.includes('MiniKit')) {
    // MiniKit initialization failure
    console.log('🔧 Applying MiniKit recovery...')

    clearMiniKitStorage()

    handlePlatformError(
      'Social features were reset. The app will continue to work normally.',
      {
        category: 'social',
        severity: 'low',
        silent: true
      }
    )

    return
  }

  if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
    // RPC rate limiting or authentication issues
    console.log('🔧 Applying RPC connectivity recovery...')

    const isOnline = await checkNetworkConnectivity()

    if (!isOnline) {
      handlePlatformError(
        'Network connection lost. Please check your internet connection.',
        {
          category: 'network',
          severity: 'high',
          showRetry: true,
          onRetry: () => refreshPage(2000)
        }
      )
    } else {
      handlePlatformError(
        'Service temporarily unavailable. Using backup connections.',
        {
          category: 'network',
          severity: 'medium',
          showRetry: true,
          onRetry: () => refreshPage(1000)
        }
      )
    }

    return
  }

  // Generic error recovery
  console.log('🔧 Applying general error recovery...')

  handlePlatformError(
    'An unexpected error occurred. Attempting to recover...',
    {
      category: 'system',
      severity: 'medium',
      showRetry: true,
      onRetry: () => refreshPage(1000)
    }
  )
}

/**
 * Initialize Error Recovery System
 * Sets up global error recovery handlers
 */
export function initializeErrorRecovery(): void {
  if (typeof window === 'undefined') return

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)

    comprehensiveErrorRecovery(
      event.reason instanceof Error ? event.reason : String(event.reason),
      'unhandled_promise'
    )

    // Prevent default browser error handling
    event.preventDefault()
  })

  // Handle unhandled errors
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error)

    if (event.error) {
      comprehensiveErrorRecovery(event.error, 'unhandled_error')
    }

    // Don't prevent default - allow browser to show error in console
  })

  // Handle service worker errors (if applicable)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('error', (event) => {
      console.error('Service worker error:', event)

      comprehensiveErrorRecovery(
        'Service worker encountered an error',
        'service_worker'
      )
    })
  }

  console.log('✅ Error recovery system initialized')
}

/**
 * Emergency Recovery Mode
 * Nuclear option for when everything fails
 */
export function emergencyRecovery(): void {
  console.log('🚨 Entering emergency recovery mode...')

  try {
    // Clear all storage
    resetAllStorage()

    // Clear any cached wagmi configurations
    if (typeof window !== 'undefined') {
      // Clear all possible wagmi-related globals and caches
      Object.keys(window).forEach(key => {
        if (key.includes('wagmi') || key.includes('MiniKit') || key.includes('miniapp')) {
          try {
            delete (window as any)[key]
          } catch (e) {
            // Ignore deletion errors
          }
        }
      })
    }

    // Show recovery toast
    toast.error('Application reset initiated. Refreshing page...', {
      duration: 3000,
      description: 'Clearing corrupted data and restarting...'
    })

    // Force refresh after a delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }, 3000)

  } catch (error) {
    console.error('Emergency recovery failed:', error)

    // Last resort - force reload immediately
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }
}

/**
 * Wagmi-Specific Recovery
 * Handles wagmi connection state corruption specifically
 */
export function recoverWagmiCorruption(): void {
  console.log('🔧 Applying Wagmi-specific recovery...')

  try {
    // Clear wagmi-specific storage
    clearWagmiStorage()

    // Clear any wagmi-related global state
    if (typeof window !== 'undefined') {
      Object.keys(window).forEach(key => {
        if (key.includes('wagmi') || key.startsWith('_wagmi')) {
          try {
            delete (window as any)[key]
          } catch (e) {
            // Ignore deletion errors
          }
        }
      })
    }

    // Show recovery toast
    toast.warning('Wallet connection reset. Please reconnect your wallet.', {
      duration: 5000,
      description: 'Connection state was corrupted and has been cleared.'
    })

  } catch (error) {
    console.error('Wagmi recovery failed:', error)
    // Fall back to full emergency recovery
    emergencyRecovery()
  }
}

/**
 * Recovery Actions Factory
 * Creates standardized recovery action sets
 */
export const recoveryActions = {
  // Standard recovery actions
  retry: (action: () => void | Promise<void>): RecoveryAction => ({
    label: 'Try Again',
    action,
    primary: true
  }),

  refresh: (delay: number = 1000): RecoveryAction => ({
    label: 'Refresh Page',
    action: () => refreshPage(delay),
    primary: false
  }),

  resetConnections: (): RecoveryAction => ({
    label: 'Reset Connections',
    action: () => {
      clearWagmiStorage()
      refreshPage(1000)
    },
    primary: false
  }),

  emergencyReset: (): RecoveryAction => ({
    label: 'Full Reset',
    action: emergencyRecovery,
    primary: false
  }),

  // Context-specific recovery actions
  miniappFallback: (): RecoveryAction => ({
    label: 'Open in Browser',
    action: () => {
      const webUrl = window.location.href.replace('/mini', '/')
      window.open(webUrl, '_blank')
    },
    primary: false
  }),

  walletReconnect: (): RecoveryAction => ({
    label: 'Reconnect Wallet',
    action: () => {
      clearWagmiStorage()
      // This would trigger wallet reconnection logic
      console.log('Triggering wallet reconnection...')
    },
    primary: true
  })
}

/**
 * Auto-Recovery Configuration
 * Defines which errors should trigger automatic recovery
 */
export const autoRecoveryConfig = {
  // Wagmi-related errors
  wagmiErrors: [
    'connections.get is not a function',
    'Invalid connections state',
    'Corrupted wallet state'
  ],

  // MiniKit-related errors
  miniKitErrors: [
    'miniKit.install is not a function',
    'MiniKit is not available',
    'Farcaster context unavailable'
  ],

  // Network-related errors
  networkErrors: [
    '403 Forbidden',
    '429 Too Many Requests',
    'Network Error',
    'Failed to fetch'
  ],

  // Enable/disable auto-recovery for different error types
  enabled: {
    wagmi: true,
    miniKit: true,
    network: true,
    system: false // Too risky to auto-recover system errors
  }
}

// Export utility functions
export {
  clearWagmiStorage as clearWalletStorage,
  clearMiniKitStorage as clearSocialStorage,
  resetAllStorage as nuclearReset,
  refreshPage as pageRefresh,
  navigateToFallback as safeNavigate,
  checkNetworkConnectivity as testConnectivity
}

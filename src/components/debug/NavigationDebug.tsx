'use client'

import React from 'react'
import { useMiniAppUtils } from '@/contexts/UnifiedMiniAppProvider'

/**
 * Navigation Debug Component
 * 
 * Temporary debug component to verify navigation context detection
 * and help troubleshoot the AdaptiveNavigation issues.
 */

export function NavigationDebug() {
  const miniAppUtils = useMiniAppUtils()
  const { isMiniApp } = miniAppUtils

  const navigationContext = React.useMemo(() => {
    if (isMiniApp) {
      return 'miniapp'
    }
    return 'web'
  }, [isMiniApp])

  const currentURL = typeof window !== 'undefined' ? window.location.href : 'SSR'
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'SSR'

  return (
    <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur border rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-semibold text-sm mb-2">🔧 Navigation Debug</h3>
      <div className="space-y-1 text-xs">
        <div><strong>Context:</strong> {navigationContext}</div>
        <div><strong>IsMiniApp:</strong> {isMiniApp ? 'true' : 'false'}</div>
        <div><strong>Path:</strong> {currentPath}</div>
        <div><strong>URL:</strong> {currentURL}</div>
      </div>
      <button 
        onClick={() => {
          console.log('🔧 Navigation Debug Info:', {
            navigationContext,
            isMiniApp,
            currentPath,
            currentURL,
            miniAppUtils
          })
        }}
        className="mt-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
      >
        Log to Console
      </button>
    </div>
  )
}

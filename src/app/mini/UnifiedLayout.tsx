/**
 * Unified MiniApp Layout - New Streamlined Implementation
 * File: src/app/mini/UnifiedLayout.tsx
 *
 * This is the new unified MiniApp layout that replaces the complex existing
 * layout with a clean, performant implementation using the UnifiedMiniAppProvider.
 */

'use client'

import React from 'react'
import { UnifiedMiniAppLayout, FullMiniAppLayout } from '@/components/layout/UnifiedMiniAppLayout'
import { UnifiedMiniAppProvider } from '@/contexts/UnifiedMiniAppProvider'

interface UnifiedMiniLayoutProps {
  children: React.ReactNode
}

/**
 * Unified MiniApp Layout with Provider
 */
export function UnifiedMiniLayout({ children }: UnifiedMiniLayoutProps) {
  return (
    <UnifiedMiniAppProvider
      enableAnalytics={true}
      enableOptimizations={true}
      fallbackToWeb={true}
    >
      <FullMiniAppLayout>
        {children}
      </FullMiniAppLayout>
    </UnifiedMiniAppProvider>
  )
}

/**
 * Minimal MiniApp Layout for simple pages
 */
export function MinimalMiniLayout({ children }: UnifiedMiniLayoutProps) {
  return (
    <UnifiedMiniAppProvider
      enableAnalytics={false}
      enableOptimizations={true}
      fallbackToWeb={true}
    >
      <UnifiedMiniAppLayout showHeader={false} showSocialIndicator={false}>
        {children}
      </UnifiedMiniAppLayout>
    </UnifiedMiniAppProvider>
  )
}

export default UnifiedMiniLayout


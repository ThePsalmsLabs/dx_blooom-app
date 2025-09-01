/**
 * MiniApp Conditional Rendering Component
 * File: src/components/farcaster/MiniAppConditional.tsx
 *
 * This component conditionally renders its children only when running in a MiniApp environment.
 * It provides a clean way to hide Farcaster-specific features when not in MiniApp context.
 */

'use client'

import React, { ReactNode } from 'react'
import { useIsInMiniApp } from '@/hooks/farcaster/useFarcasterContext'

interface MiniAppConditionalProps {
  /** Children to render when in MiniApp environment */
  children: ReactNode
  /** Fallback content to render when NOT in MiniApp environment */
  fallback?: ReactNode
  /** Whether to show loading state while detecting MiniApp environment */
  showLoading?: boolean
  /** Custom loading component */
  loadingComponent?: ReactNode
}

/**
 * MiniAppConditional Component
 *
 * Conditionally renders children based on MiniApp environment detection.
 * This prevents Farcaster-specific UI from appearing in regular web contexts.
 */
export function MiniAppConditional({
  children,
  fallback = null,
  showLoading = false,
  loadingComponent
}: MiniAppConditionalProps) {
  const isInMiniApp = useIsInMiniApp()

  // Show loading state while detection is in progress
  if (showLoading && isInMiniApp === null) {
    return loadingComponent || (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-32"></div>
      </div>
    )
  }

  // Render children only if in MiniApp environment
  if (isInMiniApp) {
    return <>{children}</>
  }

  // Render fallback content when not in MiniApp environment
  return <>{fallback}</>
}

/**
 * MiniAppOnly Component
 *
 * Shorter alias that only renders children in MiniApp context, nothing otherwise.
 */
export function MiniAppOnly({ children }: { children: ReactNode }) {
  return (
    <MiniAppConditional fallback={null}>
      {children}
    </MiniAppConditional>
  )
}

/**
 * WebOnly Component
 *
 * Only renders children when NOT in MiniApp environment.
 */
export function WebOnly({ children }: { children: ReactNode }) {
  const isInMiniApp = useIsInMiniApp()

  // Show nothing while detecting (prevents flash)
  if (isInMiniApp === null) {
    return null
  }

  // Only render when NOT in MiniApp environment
  return isInMiniApp ? null : <>{children}</>
}

/**
 * Farcaster Feature Toggle
 *
 * A more semantic component for Farcaster-specific features.
 */
export function FarcasterFeature({
  children,
  fallback
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <MiniAppConditional fallback={fallback}>
      {children}
    </MiniAppConditional>
  )
}

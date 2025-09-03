/**
 * Unified MiniApp Layout - Streamlined Social Commerce Layout
 * File: src/components/layout/UnifiedMiniAppLayout.tsx
 *
 * This is the new, streamlined MiniApp layout that provides a clean, performant
 * interface for social commerce experiences. It builds upon the UnifiedMiniAppProvider
 * and focuses on optimal user experience with minimal complexity.
 */

'use client'

import React, { ReactNode, Suspense } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'
import { cn } from '@/lib/utils'

// ================================================
// LOADING COMPONENT
// ================================================

interface MiniAppLoadingProps {
  progress?: number
}

function MiniAppLoading({ progress = 0 }: MiniAppLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <CardTitle className="text-lg">Loading MiniApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Initializing...</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// ERROR COMPONENT
// ================================================

interface MiniAppErrorProps {
  error: Error
  onRetry: () => void
  onFallback: () => void
}

function MiniAppError({ error: _error, onRetry, onFallback }: MiniAppErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-lg">MiniApp Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Something went wrong loading the MiniApp. This might be due to network
              connectivity or compatibility issues.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={onRetry} className="w-full">
              Try Again
            </Button>
            <Button onClick={onFallback} variant="outline" className="w-full">
              Open Web Version
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// SOCIAL CONTEXT INDICATOR
// ================================================

function SocialContextIndicator() {
  const { state, utils } = useUnifiedMiniApp()

  if (!utils.isMiniApp) return null

  return (
    <div className="fixed top-4 left-4 z-50">
      <Card className="bg-background/90 backdrop-blur border">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            {/* Environment Indicator */}
            <div className="flex items-center space-x-1">
              <div className={cn(
                "h-2 w-2 rounded-full",
                state.socialContext.isAvailable ? "bg-green-500" : "bg-gray-500"
              )} />
              <span className="text-xs font-medium">MiniApp</span>
            </div>

            {/* Social Profile Indicator */}
            {state.socialContext.userProfile && (
              <div className="flex items-center space-x-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={state.socialContext.userProfile.displayName ? undefined : undefined} />
                  <AvatarFallback className="text-xs">
                    {state.socialContext.userProfile.username?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">
                  @{state.socialContext.userProfile.username || 'anonymous'}
                </span>
              </div>
            )}

            {/* Capabilities Indicators */}
            <div className="flex items-center space-x-1">
              {state.capabilities.social.canShare && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Share
                </Badge>
              )}
              {state.capabilities.wallet.canBatchTransactions && (
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  Batch TX
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// CONNECTION STATUS INDICATOR
// ================================================

function ConnectionStatusIndicator() {
  const { state } = useUnifiedMiniApp()

  if (state.error) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <Alert className="bg-red-50 border-red-200 max-w-xs">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-sm text-red-700">
            {state.error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return null
}

// ================================================
// HEADER COMPONENT
// ================================================

interface MiniAppHeaderProps {
  showNavigation?: boolean
  customHeader?: ReactNode
}

function MiniAppHeader({ showNavigation = true, customHeader }: MiniAppHeaderProps) {
  const { state, utils } = useUnifiedMiniApp()
  const router = useRouter()
  const _pathname = usePathname()

  if (!utils.isMiniApp) return null

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {showNavigation && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-2"
          >
            ← Back
          </Button>
        )}

        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold">Bloom</h1>
            {utils.isMiniApp && (
              <Badge variant="secondary" className="text-xs">
                MiniApp
              </Badge>
            )}
          </div>

          {customHeader}

          <div className="flex items-center space-x-2">
            {/* Wallet Connection Status */}
            {state.isConnected && state.userAddress && (
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-xs text-muted-foreground">
                  {utils.formatAddress(state.userAddress)}
                </span>
              </div>
            )}

            {/* Social Profile */}
            {state.socialContext.userProfile && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={undefined} />
                <AvatarFallback className="text-xs">
                  {state.socialContext.userProfile.username?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

// ================================================
// MAIN LAYOUT COMPONENT
// ================================================

interface UnifiedMiniAppLayoutProps {
  children: ReactNode
  showHeader?: boolean
  showSocialIndicator?: boolean
  customHeader?: ReactNode
  className?: string
}

export function UnifiedMiniAppLayout({
  children,
  showHeader = true,
  showSocialIndicator = true,
  customHeader,
  className
}: UnifiedMiniAppLayoutProps) {
  const { state, actions: _actions, utils: _utils } = useUnifiedMiniApp()
  const router = useRouter()

  // Handle loading state
  if (state.loadingState === 'loading') {
    return <MiniAppLoading progress={50} />
  }

  // Handle error state
  if (state.error && state.loadingState === 'error') {
    return (
      <MiniAppError
        error={state.error}
        onRetry={() => window.location.reload()}
        onFallback={() => {
          const currentPath = window.location.pathname.replace('/mini', '')
          router.push(currentPath || '/')
        }}
      />
    )
  }

  return (
    <div className={cn(
      'min-h-screen bg-background',
      // Mobile optimizations
      _utils.isMobile && [
        'touch-manipulation',
        '-webkit-tap-highlight-color-transparent',
        'overflow-x-hidden'
      ],
      className
    )}>
      {/* Social Context Indicator */}
      {showSocialIndicator && _utils.isMiniApp && <SocialContextIndicator />}

      {/* Header */}
      {showHeader && (
        <MiniAppHeader
          customHeader={customHeader}
        />
      )}

      {/* Main Content */}
      <main className="flex-1">
        <Suspense fallback={<MiniAppLoading progress={75} />}>
          {children}
        </Suspense>
      </main>

      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator />

      {/* MiniApp-specific styles */}
      <style jsx global>{`
        /* Mobile-optimized touch interactions */
        .miniapp-layout {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .miniapp-layout * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Enhanced contrast for social contexts */
        .miniapp-layout {
          --contrast-ratio: 1.1;
        }

        /* Improved tap targets for mobile */
        .miniapp-layout button,
        .miniapp-layout [role="button"] {
          min-height: 44px;
          min-width: 44px;
        }

        /* Performance optimizations */
        .miniapp-layout {
          will-change: auto;
        }

        @media (max-width: 768px) {
          .miniapp-layout {
            --sidebar-width: 0px;
          }
        }
      `}</style>
    </div>
  )
}

// ================================================
// LAYOUT VARIANTS
// ================================================

/**
 * Minimal Layout - For simple MiniApp experiences
 */
export function MinimalMiniAppLayout({ children, ...props }: UnifiedMiniAppLayoutProps) {
  return (
    <UnifiedMiniAppLayout
      {...props}
      showHeader={false}
      showSocialIndicator={false}
    >
      {children}
    </UnifiedMiniAppLayout>
  )
}

/**
 * Full Featured Layout - For complex MiniApp experiences
 */
export function FullMiniAppLayout({
  children,
  customHeader,
  ...props
}: UnifiedMiniAppLayoutProps) {
  const { state, utils } = useUnifiedMiniApp()

  const enhancedHeader = customHeader || (
    <div className="flex items-center space-x-2">
      {state.socialContext.userProfile && (
        <>
          <Avatar className="h-6 w-6">
            <AvatarImage src={undefined} />
            <AvatarFallback className="text-xs">
              {state.socialContext.userProfile.username?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline">
            {state.socialContext.userProfile.displayName || state.socialContext.userProfile.username}
          </span>
        </>
      )}
    </div>
  )

  return (
    <UnifiedMiniAppLayout
      {...props}
      customHeader={enhancedHeader}
      showHeader={true}
      showSocialIndicator={true}
    >
      {children}
    </UnifiedMiniAppLayout>
  )
}

// ================================================
// EXPORTS
// ================================================

export default UnifiedMiniAppLayout
export type { UnifiedMiniAppLayoutProps }

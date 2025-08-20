'use client'

import * as React from 'react'
import { Suspense, useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  WifiOff,
  Users,
  TrendingUp
} from 'lucide-react'

// Import your existing sophisticated components and providers
import { EnhancedMiniAppProvider, useMiniApp } from '@/contexts/MiniAppProvider'
import { AdaptiveNavigation } from '@/components/layout/AdaptiveNavigation'
import { UnifiedContentBrowser } from '@/components/content/UnifiedContentBrowser'
import { RouteGuards } from '@/components/layout/RouteGuards'

// Import your existing hooks
import { usePlatformAnalytics } from '@/hooks/contracts/analytics/usePlatformAnalytics'
import { useAppNavigation } from '@/hooks/miniapp/useAppNavigation'
import { useAllCreators } from '@/hooks/contracts/useAllCreators.optimized'

// Import UI components following your established patterns
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'


// ================================================
// TYPE DEFINITIONS
// ================================================

interface MiniAppEntryPointProps {
  /** Force specific context for testing */
  forceContext?: 'web' | 'miniapp'
  /** Force specific viewport for testing */
  forceViewport?: 'mobile' | 'tablet' | 'desktop'
}

interface MiniAppState {
  isInitialized: boolean
  hasError: boolean
  errorMessage: string | null
  retryCount: number
}

// ================================================
// MINIAPP INITIALIZATION STATUS COMPONENT
// ================================================

function MiniAppInitializationStatus() {
  const { 
    readyState, 
    error, 
    isSDKReady, 
    compatibilityLevel,
    clearError,
    initializeSDK 
  } = useMiniApp()

  const handleRetry = useCallback(async () => {
    clearError()
    await initializeSDK()
  }, [clearError, initializeSDK])

  // Loading state during SDK initialization
  if (readyState === 'initializing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-context="miniapp">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Initializing Social Features</h2>
            <p className="text-sm text-muted-foreground">
              Setting up your personalized content experience...
            </p>
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-2/3 transition-all duration-1000"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state with recovery options
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-context="miniapp">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Initialization Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                {error.userMessage || error.message}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Compatibility Level:</span>
                  <Badge variant={compatibilityLevel === 'full' ? 'default' : 'secondary'}>
                    {compatibilityLevel}
                  </Badge>
                </div>
              </div>
              
              {error.recoverable && (
                <Button 
                  onClick={handleRetry} 
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                variant="ghost"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

// ================================================
// MINIAPP CONTENT CONTAINER
// ================================================

function MiniAppContent() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { navigate } = useAppNavigation()
  
  // MiniApp context and state
  const { 
    context, 
    viewport, 
    isMiniApp, 
    socialUser, 
    hasSocialContext,
    supportsBatchTransactions 
  } = useMiniApp()

  // Data fetching using your existing hooks
  const {
    platformStats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats
  } = usePlatformAnalytics()

  const {
    creators,
    totalCount: creatorCount,
    isLoading: creatorsLoading
  } = useAllCreators()

  // Determine user role for navigation
  const userRole = useMemo(() => {
    if (!isConnected) return 'disconnected'
    // You can enhance this with your existing creator registration logic
    return 'consumer' // or 'creator' based on your useIsCreatorRegistered hook
  }, [isConnected])

  // Platform stats for header display
  const displayStats = useMemo(() => {
    if (statsLoading || !platformStats) {
      return {
        contentCount: '...',
        creatorCount: '...',
        isLoading: true
      }
    }

    return {
      contentCount: Number(platformStats.totalContent).toLocaleString(),
      creatorCount: creatorCount.toLocaleString(),
      isLoading: false
    }
  }, [platformStats, statsLoading, creatorCount])

  // Handle connection status
  const connectionStatus = useMemo(() => {
    if (!isConnected) {
      return {
        connected: false,
        message: 'Connect wallet to access all features',
        showConnectButton: true
      }
    }

    return {
      connected: true,
      message: hasSocialContext 
        ? `Welcome, ${socialUser?.displayName || 'Creator'}!`
        : 'Wallet connected',
      showConnectButton: false
    }
  }, [isConnected, hasSocialContext, socialUser])

  return (
    <div className="min-h-screen bg-background" data-context="miniapp">
      {/* Adaptive Navigation using your existing component */}
      <AdaptiveNavigation
        context="miniapp"
        userRole={userRole}
        showBrand={true}
        forceDisplayMode="header-compact"
        className="border-b"
      />

      {/* Platform Stats Header */}
      <div className="bg-card border-b px-4 py-3">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">B</span>
            </div>
            <h1 className="text-lg font-semibold">Bloom</h1>
            {hasSocialContext && (
              <Badge variant="secondary" className="text-xs">
                Social
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              {displayStats.isLoading ? (
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
              ) : (
                <div className="text-lg font-bold text-primary">
                  {displayStats.contentCount}
                </div>
              )}
              <div className="text-xs text-muted-foreground">Content Pieces</div>
            </div>
            <div>
              {displayStats.isLoading ? (
                <Skeleton className="h-6 w-12 mx-auto mb-1" />
              ) : (
                <div className="text-lg font-bold text-primary">
                  {displayStats.creatorCount}
                </div>
              )}
              <div className="text-xs text-muted-foreground">Active Creators</div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status Banner */}
      {!connectionStatus.connected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-800">{connectionStatus.message}</span>
            </div>
            {connectionStatus.showConnectButton && (
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                Connect
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4">
        {/* Enhanced Features Notice for MiniApp */}
        {supportsBatchTransactions && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Enhanced features available! One-click purchases with batch transactions.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Recovery for Stats */}
        {statsError && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Unable to load platform stats</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => refetchStats()}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Unified Content Browser using your existing component */}
        <UnifiedContentBrowser
          context="miniapp"
          showCreatorInfo={false}
          showSocialFeatures={hasSocialContext}
          enableAdvancedFiltering={false}
          itemsPerPage={10}
          onContentSelect={(contentId) => {
            navigate(`/content/${contentId}`)
          }}
          className="min-h-[400px]"
        />
      </main>

      {/* Social Context Footer */}
      {hasSocialContext && socialUser && (
        <div className="border-t bg-card p-3">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>
              Connected as {socialUser.displayName} • 
              FID: {socialUser.fid}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ================================================
// MAIN MINIAPP ENTRY POINT COMPONENT
// ================================================

export default function MiniAppEntryPoint() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Loading MiniApp...</p>
        </div>
      </div>
    }>
      <MiniAppEntryPointContent />
    </Suspense>
  )
}

function MiniAppEntryPointContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Local state for component lifecycle
  const [componentState, setComponentState] = useState<MiniAppState>({
    isInitialized: false,
    hasError: false,
    errorMessage: null,
    retryCount: 0
  })

  // Context detection with override capability
  const detectedContext = useMemo(() => {
    if (typeof window !== 'undefined') {
      const isMiniAppPath = window.location.pathname.startsWith('/mini')
      const isMiniAppParam = searchParams?.get('miniApp') === 'true'
      const isEmbedded = window.parent !== window
      const isFarcasterReferrer = document.referrer.includes('warpcast') || 
                                  document.referrer.includes('farcaster')
      
      if (isMiniAppPath || isMiniAppParam || isEmbedded || isFarcasterReferrer) {
        return 'miniapp'
      }
    }
    
    return 'web'
  }, [searchParams])

  // Viewport detection with override capability
  const detectedViewport = useMemo(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      if (width < 640) return 'mobile'
      if (width < 1024) return 'tablet'
      return 'desktop'
    }
    
    return 'mobile' // Default for MiniApp
  }, [])

  // Error boundary-like error handling
  const handleError = useCallback((error: Error) => {
    console.error('MiniApp Entry Point Error:', error)
    setComponentState(prev => ({
      ...prev,
      hasError: true,
      errorMessage: error.message
    }))
  }, [])

  // Component initialization effect
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Any additional initialization logic can go here
        setComponentState(prev => ({ ...prev, isInitialized: true }))
      } catch (error) {
        handleError(error instanceof Error ? error : new Error('Initialization failed'))
      }
    }

    initializeComponent()
  }, [handleError])

  // Fallback error state
  if (componentState.hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Component Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {componentState.errorMessage}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <EnhancedMiniAppProvider
      forceContext={detectedContext}
      enableAnalytics={true}
      enablePerformanceTracking={true}
      onError={(error) => {
        console.error('MiniApp Provider Error:', error)
        handleError(new Error(error.message))
      }}
      onReadyStateChange={(state) => {
        console.log('MiniApp Ready State:', state)
      }}
    >
      <RouteGuards requiredLevel="public">
        <MiniAppInitializationStatus />
        <MiniAppContent />
      </RouteGuards>
    </EnhancedMiniAppProvider>
  )
}
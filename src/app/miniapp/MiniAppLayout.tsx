'use client'

import React, { ReactNode, useEffect, useMemo, useState, useCallback } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'

// Import your existing sophisticated provider and configuration systems
import { EnhancedMiniAppProvider } from '@/contexts/MiniAppProvider'
import { enhancedWagmiConfig as wagmiConfig } from '@/lib/web3/enhanced-wagmi-config'
import { Toaster } from '@/components/ui/sonner'

// Import error boundary and monitoring systems
import { ErrorBoundary } from 'react-error-boundary'
import { Loader2, AlertTriangle, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Import utilities and helpers
import { cn } from '@/lib/utils'

// ================================================
// TYPE DEFINITIONS FOR LAYOUT CONFIGURATION
// ================================================

/**
 * Context Detection Results
 * This interface helps us understand exactly what kind of environment
 * the app is running in, so we can apply the right optimizations
 */
interface ContextDetectionResult {
  readonly isMiniApp: boolean           // Are we in a Farcaster MiniApp?
  readonly isEmbedded: boolean          // Are we embedded in another app?
  readonly viewport: 'mobile' | 'tablet' | 'desktop'  // What screen size?
  readonly platform: 'ios' | 'android' | 'web' | 'unknown'  // What platform?
  readonly capabilities: {              // What advanced features are available?
    readonly batchTransactions: boolean
    readonly socialSharing: boolean
    readonly notifications: boolean
  }
}

/**
 * Layout Configuration Interface
 * This defines how the layout should behave based on the detected context
 */
interface MiniAppLayoutConfig {
  readonly enableProviderOptimizations: boolean  // Should we use miniapp-specific optimizations?
  readonly enablePerformanceTracking: boolean    // Should we track performance metrics?
  readonly enableErrorReporting: boolean         // Should we report errors to monitoring?
  readonly queryClientConfig: {                  // How should we configure React Query?
    readonly staleTime: number
    readonly gcTime: number
    readonly refetchOnWindowFocus: boolean
  }
  readonly wagmiConfig: {                        // How should we configure wagmi?
    readonly pollingInterval: number
    readonly enableAutoConnect: boolean
  }
}

/**
 * Component Props Interface
 */
interface MiniAppLayoutProps {
  children: ReactNode
  /** Force specific context for testing purposes */
  forceContext?: 'web' | 'miniapp'
  /** Enable debug logging for development */
  enableDebugMode?: boolean
  /** Custom error fallback component */
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

/**
 * Layout State Interface
 * Tracks the current state of our layout initialization
 */
interface LayoutState {
  readonly isInitialized: boolean
  readonly hasContextError: boolean
  readonly contextDetection: ContextDetectionResult | null
  readonly layoutConfig: MiniAppLayoutConfig | null
  readonly initializationTime: number | null
}

// ================================================
// CONTEXT DETECTION LOGIC
// ================================================

/**
 * Advanced Context Detection Function
 * 
 * This function is like a sophisticated detective that examines multiple clues
 * to determine exactly what kind of environment your app is running in.
 * Understanding the context is crucial because it determines which optimizations
 * and features we can safely enable.
 */
function detectApplicationContext(forceContext?: 'web' | 'miniapp'): ContextDetectionResult {
  // If we're testing, use the forced context
  if (forceContext) {
    return createContextResult(forceContext === 'miniapp')
  }

  // Server-side detection (during SSR) - default to safe assumptions
  if (typeof window === 'undefined') {
    return createContextResult(false) // Assume web context during SSR
  }

  // Client-side detection using multiple indicators
  try {
    // Check URL patterns that indicate MiniApp context
    const isMiniAppPath = window.location.pathname.startsWith('/mini')
    const hasMiniAppParam = new URLSearchParams(window.location.search).get('miniApp') === 'true'
    
    // Check if we're embedded in another application (like Farcaster)
    const isEmbedded = window.parent !== window
    
    // Check referrer to see if we came from Farcaster
    const referrer = document.referrer.toLowerCase()
    const isFarcasterReferrer = referrer.includes('warpcast') || 
                               referrer.includes('farcaster') ||
                               referrer.includes('fc.xyz')
    
    // Check for MiniApp SDK presence (this indicates Farcaster environment)
    const hasMiniAppSDK = 'MiniKit' in window || 'miniapp' in window
    
    // Check user agent for mobile indicators
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileUserAgent = userAgent.includes('mobile') || 
                              userAgent.includes('android') || 
                              userAgent.includes('iphone')
    
    // Determine if this is a MiniApp context
    const isMiniApp = isMiniAppPath || 
                      hasMiniAppParam || 
                      isEmbedded || 
                      isFarcasterReferrer || 
                      hasMiniAppSDK
    
    return createContextResult(isMiniApp)
    
  } catch (error) {
    // If detection fails, default to web context for safety
    console.warn('Context detection failed:', error)
    return createContextResult(false)
  }
}

/**
 * Helper function to create consistent context detection results
 * This ensures we always return the same data structure regardless of how detection works
 */
function createContextResult(isMiniApp: boolean): ContextDetectionResult {
  // Detect viewport size using your design token breakpoints
  const viewport = (() => {
    if (typeof window === 'undefined') return 'mobile'
    const width = window.innerWidth
    if (width < 640) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  })() as 'mobile' | 'tablet' | 'desktop'

  // Detect platform
  const platform = (() => {
    if (typeof window === 'undefined') return 'unknown'
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios'
    if (userAgent.includes('android')) return 'android'
    return 'web'
  })() as 'ios' | 'android' | 'web' | 'unknown'

  // Detect capabilities based on context and platform
  const capabilities = {
    batchTransactions: isMiniApp && (platform === 'ios' || platform === 'android'),
    socialSharing: isMiniApp,
    notifications: isMiniApp && platform !== 'web'
  }

  return {
    isMiniApp,
    isEmbedded: isMiniApp, // For now, assume embedded if miniapp
    viewport,
    platform,
    capabilities
  }
}

// ================================================
// CONFIGURATION GENERATION LOGIC
// ================================================

/**
 * Generate Layout Configuration Based on Context
 * 
 * This function is like a smart architect who designs different building plans
 * based on whether you're building a house (web) or a tiny house (miniapp).
 * Each context needs different optimizations and capabilities.
 */
function generateLayoutConfig(context: ContextDetectionResult): MiniAppLayoutConfig {
  // MiniApp-specific optimizations
  if (context.isMiniApp) {
    return {
      enableProviderOptimizations: true,
      enablePerformanceTracking: true,
      enableErrorReporting: true,
      queryClientConfig: {
        staleTime: 1000 * 60 * 5,      // 5 minutes - longer cache for mobile
        gcTime: 1000 * 60 * 30,        // 30 minutes - aggressive garbage collection
        refetchOnWindowFocus: false     // Don't refetch on focus in embedded context
      },
      wagmiConfig: {
        pollingInterval: 8000,          // Slower polling to save battery
        enableAutoConnect: true         // Auto-connect for seamless UX
      }
    }
  }

  // Web-specific optimizations
  return {
    enableProviderOptimizations: false,
    enablePerformanceTracking: false,
    enableErrorReporting: true,
    queryClientConfig: {
      staleTime: 1000 * 60 * 2,        // 2 minutes - shorter cache for desktop
      gcTime: 1000 * 60 * 10,          // 10 minutes - normal garbage collection
      refetchOnWindowFocus: true       // Refetch when user returns to tab
    },
    wagmiConfig: {
      pollingInterval: 4000,           // Faster polling for responsive UX
      enableAutoConnect: false         // Manual connect for explicit user control
    }
  }
}

// ================================================
// ERROR BOUNDARY COMPONENTS
// ================================================

/**
 * Layout Error Fallback Component
 * 
 * This component appears when something goes wrong with the layout initialization.
 * It's like having a backup generator that kicks in when the main power fails.
 */
function LayoutErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Layout Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              There was a problem initializing the application layout. This usually happens
              when there's a configuration issue or network problem.
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <strong>Error Details:</strong><br />
            {error.message}
          </div>
          
          <div className="space-y-2">
            <Button onClick={resetError} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Layout Loading Component
 * 
 * This shows while we're setting up all the providers and configurations.
 * It's like the "Please wait while we prepare your table" message at a restaurant.
 */
function LayoutLoading({ message = "Initializing application..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Setting Up Your Experience</h2>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
        <div className="w-64 mx-auto">
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ================================================
// MAIN LAYOUT WRAPPER COMPONENT
// ================================================

/**
 * MiniAppLayout Wrapper Component
 * 
 * This is the master conductor of your application's infrastructure orchestra.
 * It coordinates all the different systems (providers, configurations, error handling)
 * to create a seamless experience regardless of whether you're in web or miniapp context.
 * 
 * Think of it as the foundation and utility systems of a smart building that automatically
 * adjusts lighting, temperature, and security based on who's inside and what they need.
 */
export function MiniAppLayout({ 
  children, 
  forceContext, 
  enableDebugMode = false,
  errorFallback: CustomErrorFallback 
}: MiniAppLayoutProps) {
  
  // ===== STATE MANAGEMENT =====
  
  const [layoutState, setLayoutState] = useState<LayoutState>({
    isInitialized: false,
    hasContextError: false,
    contextDetection: null,
    layoutConfig: null,
    initializationTime: null
  })

  // Create React Query client with dynamic configuration
  const queryClient = useMemo(() => {
    const config = layoutState.layoutConfig?.queryClientConfig || {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: true
    }

    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: config.staleTime,
          gcTime: config.gcTime,
          refetchOnWindowFocus: config.refetchOnWindowFocus,
          retry: (failureCount, error) => {
            // Smart retry logic based on error type
            if (error?.message?.includes('Network')) return failureCount < 3
            if (error?.message?.includes('Contract')) return failureCount < 2
            return false
          }
        }
      }
    })
  }, [layoutState.layoutConfig])

  // ===== INITIALIZATION LOGIC =====

  /**
   * Initialize Layout Function
   * 
   * This function sets up everything your app needs to run properly.
   * It's like the startup sequence of a sophisticated machine that checks
   * all systems before allowing operation.
   */
  const initializeLayout = useCallback(async () => {
    const startTime = performance.now()
    
    try {
      if (enableDebugMode) {
        console.log('🚀 Starting MiniApp layout initialization...')
      }

      // Step 1: Detect the current context
      const contextDetection = detectApplicationContext(forceContext)
      
      if (enableDebugMode) {
        console.log('📍 Context detection result:', contextDetection)
      }

      // Step 2: Generate configuration based on context
      const layoutConfig = generateLayoutConfig(contextDetection)
      
      if (enableDebugMode) {
        console.log('⚙️ Generated layout config:', layoutConfig)
      }

      // Step 3: Update state with initialization results
      const initTime = performance.now() - startTime
      
      setLayoutState({
        isInitialized: true,
        hasContextError: false,
        contextDetection,
        layoutConfig,
        initializationTime: initTime
      })

      if (enableDebugMode) {
        console.log(`✅ Layout initialized successfully in ${initTime.toFixed(2)}ms`)
      }

    } catch (error) {
      console.error('❌ Layout initialization failed:', error)
      
      setLayoutState(prev => ({
        ...prev,
        hasContextError: true,
        isInitialized: false
      }))
    }
  }, [forceContext, enableDebugMode])

  // Run initialization when component mounts
  useEffect(() => {
    initializeLayout()
  }, [initializeLayout])

  // ===== ERROR HANDLING =====

  const handleLayoutError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Layout Error Boundary caught an error:', error, errorInfo)
    
    // You could send this to your error reporting service here
    if (layoutState.layoutConfig?.enableErrorReporting) {
      // Example: sendErrorToService(error, errorInfo, layoutState.contextDetection)
    }
  }, [layoutState.layoutConfig, layoutState.contextDetection])

  // ===== RENDER LOGIC =====

  // Show loading while we're setting everything up
  if (!layoutState.isInitialized) {
    return <LayoutLoading message="Detecting environment and configuring optimizations..." />
  }

  // Show error state if context detection failed
  if (layoutState.hasContextError) {
    return (
      <LayoutErrorFallback 
        error={new Error('Failed to detect application context')} 
        resetError={initializeLayout}
      />
    )
  }

  // At this point, we know everything is properly initialized
  const ErrorFallback = CustomErrorFallback || LayoutErrorFallback
  const { contextDetection, layoutConfig } = layoutState

  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <ErrorFallback error={error} resetError={initializeLayout} />
      )}
      onError={handleLayoutError}
      onReset={initializeLayout}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <EnhancedMiniAppProvider
            forceEnvironment={contextDetection?.isMiniApp ? 'farcaster' : 'web'}
            enableAnalytics={layoutConfig?.enablePerformanceTracking || false}
            fallbackToWeb={true}
            debugMode={false}
          >
            {/* Apply context-specific styling using your design token system */}
            <div 
              className={cn(
                "min-h-screen",
                // Apply your design token classes based on context
                contextDetection?.isMiniApp && "context-miniapp",
                !contextDetection?.isMiniApp && "context-web"
              )}
              data-context={contextDetection?.isMiniApp ? 'miniapp' : 'web'}
              data-viewport={contextDetection?.viewport}
              data-platform={contextDetection?.platform}
            >
              {children}
            </div>
            
            {/* Toast notifications using your existing system */}
            <Toaster />
            
            {/* Debug information in development */}
            {enableDebugMode && process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono">
                Context: {contextDetection?.isMiniApp ? 'MiniApp' : 'Web'} | 
                Viewport: {contextDetection?.viewport} | 
                Platform: {contextDetection?.platform} |
                Init: {layoutState.initializationTime?.toFixed(1)}ms
              </div>
            )}
          </EnhancedMiniAppProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  )
}

export default MiniAppLayout
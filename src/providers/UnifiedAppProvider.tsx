/**
 * UnifiedAppProvider Component - Phase 4 Advanced Integration
 * File: src/providers/UnifiedAppProvider.tsx
 * 
 * This component consolidates the web app and mini app provider systems into a single
 * adaptive provider that intelligently handles context switching, state management,
 * and performance optimizations across both environments.
 * 
 * Key Features:
 * - Unified context management (web vs miniapp)
 * - Consolidated state management across all providers
 * - Intelligent performance optimizations based on environment
 * - Seamless Farcaster integration for social contexts
 * - Error boundary protection with context-aware recovery
 * - Theme management with context-adaptive design tokens
 * - Analytics and tracking integration for both contexts
 * - Memory and performance optimization for embedded environments
 * 
 * Architecture Integration:
 * - Replaces separate MiniAppProvider and EnhancedMiniAppProvider
 * - Integrates with existing wallet providers and Web3 infrastructure
 * - Uses unified design tokens for consistent theming
 * - Maintains compatibility with existing component expectations
 * - Provides context-aware optimization strategies
 * - Preserves all current functionality while providing unified experience
 */

'use client'

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  useRef,
  ReactNode,
  Suspense
} from 'react'
import { ThemeProvider } from 'next-themes'
import type { AppMiniAppSDK } from '@/types/miniapp-sdk'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import existing configuration and utilities
import { wagmiConfig } from '@/lib/web3/wagmi'
import { cn } from '@/lib/utils'

// ================================================
// TYPE DEFINITIONS
// ================================================

/**
 * Application Context Types
 */
export type AppContext = 'web' | 'miniapp'
export type ViewportSize = 'mobile' | 'tablet' | 'desktop'
export type ConnectionType = 'fast' | 'slow' | 'offline'
export type PerformanceMode = 'full' | 'optimized' | 'minimal'

/**
 * Farcaster User Interface
 */
interface FarcasterUser {
  readonly fid: number
  readonly username: string
  readonly displayName: string
  readonly pfp?: string
  readonly following: number
  readonly followers: number
  readonly verifications: readonly string[]
  readonly custody: string
}

/**
 * Mini App Capabilities Interface
 */
interface MiniAppCapabilities {
  readonly canShare: boolean
  readonly canSignIn: boolean
  readonly canSendTransactions: boolean
  readonly hasNotifications: boolean
  readonly supportsFrames: boolean
  readonly supportsBatchTransactions: boolean
}

/**
 * Performance Optimization Configuration
 */
interface PerformanceConfig {
  readonly reducedAnimations: boolean
  readonly lazyLoading: boolean
  readonly imageOptimization: boolean
  readonly prefetchDisabled: boolean
  readonly simplifiedUI: boolean
  readonly connectionType: ConnectionType
  readonly memoryLimit: number
}

/**
 * Analytics and Tracking Context
 */
interface AnalyticsContext {
  readonly context: AppContext
  readonly userId?: string
  readonly sessionId: string
  readonly userFid?: number
  readonly deviceType: string
  readonly platformVersion?: string
}

/**
 * Unified App Context Interface
 */
interface UnifiedAppContextType {
  // Context and environment
  readonly context: AppContext
  readonly viewport: ViewportSize
  readonly isReady: boolean
  readonly isOnline: boolean
  
  // Mini app specific
  readonly isMiniApp: boolean
  readonly farcasterUser: FarcasterUser | null
  readonly capabilities: MiniAppCapabilities
  readonly miniAppSdk: AppMiniAppSDK | null
  
  // Performance and optimization
  readonly performanceConfig: PerformanceConfig
  readonly performanceMode: PerformanceMode
  
  // Methods
  readonly updateContext: (context: AppContext) => void
  readonly share: (content: ShareContent) => Promise<void>
  readonly track: (event: string, properties: Record<string, unknown>) => void
  readonly ready: () => Promise<void>
  readonly optimizeForContext: (context: AppContext) => void
}

/**
 * Share Content Interface
 */
interface ShareContent {
  readonly text: string
  readonly url: string
  readonly contentId?: bigint
  readonly creatorAddress?: string
  readonly embedData?: Record<string, unknown>
}

/**
 * Component Props Interface
 */
interface UnifiedAppProviderProps {
  children: ReactNode
  context?: AppContext
  optimizations?: boolean
  enableAnalytics?: boolean
  enableDevtools?: boolean
  performanceMode?: PerformanceMode
  className?: string
  fallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>
}

/**
 * Environment Detection Result
 */
interface EnvironmentDetection {
  readonly isMiniApp: boolean
  readonly isFrame: boolean
  readonly referrer: string
  readonly userAgent: string
  readonly parentWindow: boolean
  readonly hasFrameMetaTags: boolean
}

// ================================================
// CONSTANTS AND DEFAULTS
// ================================================

const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  reducedAnimations: false,
  lazyLoading: true,
  imageOptimization: true,
  prefetchDisabled: false,
  simplifiedUI: false,
  connectionType: 'fast',
  memoryLimit: 100 // MB
}

const MINIAPP_PERFORMANCE_CONFIG: PerformanceConfig = {
  reducedAnimations: true,
  lazyLoading: true,
  imageOptimization: true,
  prefetchDisabled: true,
  simplifiedUI: true,
  connectionType: 'slow',
  memoryLimit: 50 // MB
}

const DEFAULT_CAPABILITIES: MiniAppCapabilities = {
  canShare: false,
  canSignIn: false,
  canSendTransactions: false,
  hasNotifications: false,
  supportsFrames: false,
  supportsBatchTransactions: false
}

// ================================================
// CONTEXT CREATION
// ================================================

const UnifiedAppContext = createContext<UnifiedAppContextType | undefined>(undefined)

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Detects the current environment and context
 */
function detectEnvironment(): EnvironmentDetection {
  if (typeof window === 'undefined') {
    return {
      isMiniApp: false,
      isFrame: false,
      referrer: '',
      userAgent: '',
      parentWindow: false,
      hasFrameMetaTags: false
    }
  }
  
  const url = new URL(window.location.href)
  const parentWindow = window.parent !== window
  const hasFrameMetaTags = Boolean(document.querySelector('meta[name="fc:frame"]'))
  const referrer = document.referrer
  const userAgent = navigator.userAgent
  
  const isMiniApp = (
    url.pathname.startsWith('/mini') ||
    url.pathname.startsWith('/miniapp') ||
    url.searchParams.get('miniApp') === 'true' ||
    parentWindow ||
    hasFrameMetaTags ||
    userAgent.includes('Farcaster') ||
    userAgent.includes('Warpcast') ||
    referrer.includes('farcaster') ||
    referrer.includes('warpcast')
  )
  
  return {
    isMiniApp,
    isFrame: hasFrameMetaTags,
    referrer,
    userAgent,
    parentWindow,
    hasFrameMetaTags
  }
}

// ================================================
// LOCAL ERROR BOUNDARY (removes external dependency)
// ================================================

type LocalErrorFallbackProps = { error: Error; resetError: () => void }

class LocalErrorBoundary extends React.Component<{
  FallbackComponent: React.ComponentType<LocalErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  children: React.ReactNode
}, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
    this.resetErrorBoundary = this.resetErrorBoundary.bind(this)
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) this.props.onError(error, errorInfo)
  }

  resetErrorBoundary() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.FallbackComponent
      return <Fallback error={this.state.error} resetError={this.resetErrorBoundary} />
    }
    return this.props.children
  }
}

/**
 * Detects viewport size based on window dimensions
 */
function detectViewportSize(): ViewportSize {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Detects connection type for performance optimization
 */
function detectConnectionType(): ConnectionType {
  if (typeof window === 'undefined') return 'fast'
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (!connection) return 'fast'
  
  if (!navigator.onLine) return 'offline'
  
  const effectiveType = connection.effectiveType
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow'
  if (effectiveType === '3g') return 'slow'
  
  return 'fast'
}

/**
 * Generates unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Creates query client with context-specific configuration
 */
function createQueryClient(context: AppContext): QueryClient {
  const isWeb = context === 'web'
  
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: isWeb ? 5 * 60 * 1000 : 2 * 60 * 1000, // 5min web, 2min miniapp
        gcTime: isWeb ? 10 * 60 * 1000 : 5 * 60 * 1000,   // 10min web, 5min miniapp
        retry: isWeb ? 3 : 1,                              // More retries for web
        refetchOnWindowFocus: isWeb,                       // Only refetch on web
        refetchOnReconnect: true,
        networkMode: 'online'
      },
      mutations: {
        retry: 1,
        networkMode: 'online'
      }
    }
  })
}

// ================================================
// ERROR BOUNDARY COMPONENTS
// ================================================

/**
 * Context-aware error fallback component
 */
function ErrorFallback({ 
  error, 
  resetError, 
  context 
}: { 
  error: Error
  resetError: () => void
  context: AppContext 
}) {
  const isMiniApp = context === 'miniapp'
  
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4",
      isMiniApp ? "bg-background" : "bg-muted/10"
    )}>
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-destructive">
            {isMiniApp ? 'Mini App Error' : 'Application Error'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isMiniApp 
              ? 'Something went wrong in the mini app environment.'
              : 'An unexpected error occurred.'
            }
          </p>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Error Details
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
        
        <button
          onClick={resetError}
          className={cn(
            "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors",
            isMiniApp ? "text-sm" : "text-base"
          )}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

// ================================================
// MAIN PROVIDER COMPONENT
// ================================================

/**
 * UnifiedAppProvider Component
 * 
 * The main provider that consolidates all application context, state management,
 * and optimization strategies into a single adaptive system.
 */
export function UnifiedAppProvider({
  children,
  context: initialContext,
  optimizations = true,
  enableAnalytics = true,
  enableDevtools = process.env.NODE_ENV === 'development',
  performanceMode: initialPerformanceMode,
  className,
  fallbackComponent: CustomErrorFallback
}: UnifiedAppProviderProps) {
  
  // ===== ENVIRONMENT DETECTION =====
  
  const environmentDetection = useMemo(() => detectEnvironment(), [])
  const [context, setContext] = useState<AppContext>(() => 
    initialContext || (environmentDetection.isMiniApp ? 'miniapp' : 'web')
  )
  
  // ===== CORE STATE =====
  
  const [isReady, setIsReady] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [viewport, setViewport] = useState<ViewportSize>(() => detectViewportSize())
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null)
  const [capabilities, setCapabilities] = useState<MiniAppCapabilities>(DEFAULT_CAPABILITIES)
  const [miniAppSdk, setMiniAppSdk] = useState<AppMiniAppSDK | null>(null)
  
  // ===== PERFORMANCE CONFIGURATION =====
  
  const performanceMode = useMemo((): PerformanceMode => {
    if (initialPerformanceMode) return initialPerformanceMode
    if (context === 'miniapp') return 'optimized'
    if (viewport === 'mobile') return 'optimized'
    return 'full'
  }, [initialPerformanceMode, context, viewport])
  
  const performanceConfig = useMemo((): PerformanceConfig => {
    const connectionType = detectConnectionType()
    const baseConfig = context === 'miniapp' ? MINIAPP_PERFORMANCE_CONFIG : DEFAULT_PERFORMANCE_CONFIG
    
    return {
      ...baseConfig,
      connectionType,
      reducedAnimations: performanceMode !== 'full' ? true : baseConfig.reducedAnimations,
      simplifiedUI: performanceMode === 'minimal' ? true : baseConfig.simplifiedUI
    }
  }, [context, performanceMode])
  
  // ===== ANALYTICS CONTEXT =====
  
  const sessionId = useRef<string>('')
  if (!sessionId.current) {
    sessionId.current = generateSessionId()
  }
  
  const analyticsContext = useMemo((): AnalyticsContext => ({
    context,
    sessionId: sessionId.current!,
    userFid: farcasterUser?.fid,
    deviceType: viewport,
    platformVersion: context === 'miniapp' ? 'miniapp-1.0' : 'web-1.0'
  }), [context, farcasterUser?.fid, viewport])
  
  // ===== QUERY CLIENT =====
  
  const queryClient = useMemo(() => createQueryClient(context), [context])
  
  // ===== EFFECTS =====
  
  // Initialize mini app environment
  useEffect(() => {
    if (!environmentDetection.isMiniApp || context !== 'miniapp') {
      setIsReady(true)
      return
    }
    
    const initializeMiniApp = async () => {
      try {
        // Try to load Farcaster SDK
        const sdkModule = await import('@farcaster/miniapp-sdk').catch(() => null)
        const sdk: AppMiniAppSDK | undefined = (sdkModule as unknown as { sdk?: AppMiniAppSDK })?.sdk || window.miniapp?.sdk
        
        if (sdk) {
          // Initialize SDK
          await sdk.init?.({ 
            name: 'Onchain Content Platform', 
            version: '1.0.0' 
          }).catch(() => {})
          
          // Get user information
          const user = await sdk.user?.getCurrentUser?.().catch(() => null)
          if (user) {
            setFarcasterUser({
              fid: user.fid,
              username: user.username ?? '',
              displayName: user.displayName ?? '',
              pfp: undefined,
              following: 0,
              followers: 0,
              verifications: user.verifications || [],
              custody: ''
            })
          }
          
          // Get capabilities
          const caps: string[] = await sdk.capabilities?.getCapabilities?.().catch(() => []) || []
          setCapabilities({
            canShare: caps.includes('share'),
            canSignIn: caps.includes('signIn'),
            canSendTransactions: caps.includes('sendTransaction'),
            hasNotifications: caps.includes('notifications'),
            supportsFrames: caps.includes('frames'),
            supportsBatchTransactions: caps.includes('batchTransactions')
          })
          
          setMiniAppSdk(sdk)
        }
        
        setIsReady(true)
      } catch (error) {
        console.warn('Mini app initialization failed:', error)
        setIsReady(true)
      }
    }
    
    initializeMiniApp()
  }, [environmentDetection.isMiniApp, context])
  
  // Viewport size monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      setViewport(detectViewportSize())
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Online status monitoring
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Apply context-specific styling
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    const body = document.body
    
    // Set context data attribute
    body.setAttribute('data-context', context)
    body.setAttribute('data-viewport', viewport)
    body.setAttribute('data-performance', performanceMode)
    
    // Apply performance optimizations
    if (performanceConfig.reducedAnimations) {
      body.setAttribute('data-animations', 'reduced')
    } else {
      body.removeAttribute('data-animations')
    }
    
    // Apply connection-based optimizations
    body.setAttribute('data-connection', performanceConfig.connectionType)
    
    return () => {
      body.removeAttribute('data-context')
      body.removeAttribute('data-viewport')
      body.removeAttribute('data-performance')
      body.removeAttribute('data-animations')
      body.removeAttribute('data-connection')
    }
  }, [context, viewport, performanceMode, performanceConfig])
  
  // ===== METHODS =====
  
  const updateContext = useCallback((newContext: AppContext) => {
    setContext(newContext)
  }, [])
  
  const track = useCallback((event: string, properties: Record<string, unknown> = {}) => {
    if (!enableAnalytics) return
    
    const eventData = {
      ...properties,
      ...analyticsContext,
      timestamp: new Date().toISOString()
    }
    
    // Send to analytics service
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track(event, eventData)
    }
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${event}:`, eventData)
    }
  }, [enableAnalytics, analyticsContext])

  const share = useCallback(async (content: ShareContent) => {
    try {
      if (capabilities.canShare && miniAppSdk?.actions?.share) {
        await miniAppSdk.actions.share({
          text: content.text,
          url: content.url,
          embeds: content.url ? [{ url: content.url }] : undefined
        })
        if (enableAnalytics) {
          track('content_shared', {
            contentId: content.contentId?.toString(),
            creatorAddress: content.creatorAddress,
            shareMethod: 'miniapp',
            url: content.url
          })
        }
        return
      }
      // Web fallback: use Web Share API if available
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({
          title: 'Share',
          text: content.text,
          url: content.url
        })
        if (enableAnalytics) {
          track('content_shared', {
            contentId: content.contentId?.toString(),
            creatorAddress: content.creatorAddress,
            shareMethod: 'web_share_api',
            url: content.url
          })
        }
        return
      }
      // Clipboard fallback
      if (typeof navigator !== 'undefined' && navigator.clipboard && (content.url || content.text)) {
        await navigator.clipboard.writeText(content.url || content.text)
        if (enableAnalytics) {
          track('content_shared', {
            contentId: content.contentId?.toString(),
            creatorAddress: content.creatorAddress,
            shareMethod: 'clipboard',
            url: content.url
          })
        }
        return
      }
      throw new Error('Sharing unavailable')
    } catch (error) {
      console.error('Share failed:', error)
      throw error instanceof Error ? error : new Error('Share failed')
    }
  }, [capabilities.canShare, miniAppSdk, enableAnalytics, track])
  
  const ready = useCallback(async () => {
    if (context === 'miniapp' && miniAppSdk?.actions?.ready) {
      await miniAppSdk.actions.ready()
    }
  }, [context, miniAppSdk])
  
  const optimizeForContext = useCallback((targetContext: AppContext) => {
    if (targetContext !== context) {
      updateContext(targetContext)
    }
  }, [context, updateContext])
  
  // ===== CONTEXT VALUE =====
  
  const contextValue: UnifiedAppContextType = useMemo(() => ({
    context,
    viewport,
    isReady,
    isOnline,
    isMiniApp: context === 'miniapp',
    farcasterUser,
    capabilities,
    miniAppSdk,
    performanceConfig,
    performanceMode,
    updateContext,
    share,
    track,
    ready,
    optimizeForContext
  }), [
    context,
    viewport,
    isReady,
    isOnline,
    farcasterUser,
    capabilities,
    miniAppSdk,
    performanceConfig,
    performanceMode,
    updateContext,
    share,
    track,
    ready,
    optimizeForContext
  ])
  
  // ===== RENDER =====
  
  const ErrorFallbackComponent = CustomErrorFallback || ErrorFallback
  
  return (
    <LocalErrorBoundary
      FallbackComponent={(props: LocalErrorFallbackProps) => (
        <ErrorFallbackComponent {...props} context={context} />
      )}
      onError={(error: Error, errorInfo: React.ErrorInfo) => {
        console.error('UnifiedAppProvider Error:', error, errorInfo)
        track('app_error', {
          error: error.message,
          stack: error.stack,
          errorInfo: JSON.stringify(errorInfo)
        })
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={performanceConfig.reducedAnimations}
          >
            <UnifiedAppContext.Provider value={contextValue}>
              <div 
                className={cn(
                  "min-h-screen",
                  context === 'miniapp' && "touch-manipulation",
                  className
                )}
                data-context={context}
                data-performance-mode={performanceMode}
              >
                <Suspense 
                  fallback={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  }
                >
                  {children}
                </Suspense>
              </div>
            </UnifiedAppContext.Provider>
          </ThemeProvider>
        </WagmiProvider>
        
        {/* Devtools removed to avoid external dependency */}
      </QueryClientProvider>
    </LocalErrorBoundary>
  )
}

// ================================================
// HOOK FOR CONSUMING CONTEXT
// ================================================

/**
 * Hook to consume the unified app context
 */
export function useUnifiedApp(): UnifiedAppContextType {
  const context = useContext(UnifiedAppContext)
  
  if (context === undefined) {
    throw new Error('useUnifiedApp must be used within a UnifiedAppProvider')
  }
  
  return context
}

// ================================================
// EXPORTS
// ================================================

export default UnifiedAppProvider

// Export all types and utilities
// Types already exported above; avoid duplicate export declarations
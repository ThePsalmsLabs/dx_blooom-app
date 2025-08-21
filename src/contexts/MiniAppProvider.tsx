/**
 * Enhanced MiniAppProvider - Component 1: Phase 1 Foundation
 * File: src/contexts/MiniAppProvider.tsx
 * 
 * This component serves as the central integration point that enhances the existing
 * UnifiedAppProvider system with complete MiniApp SDK capabilities for social commerce.
 * It provides reliable context detection, SDK initialization, compatibility testing,
 * and seamless integration with existing hooks and components.
 * 
 * Architecture Integration:
 * - Builds on existing UnifiedAppProvider patterns without disruption
 * - Integrates with useAppNavigation, useContentById, useHasContentAccess hooks
 * - Enhances existing unified components with social commerce capabilities
 * - Uses design tokens and responsive styles for consistent UI feedback
 * - Maintains full backward compatibility with web experience
 * - Provides foundation for all subsequent Phase 1 components
 * 
 * Key Features:
 * - Intelligent context detection for Farcaster and other social platforms
 * - SDK initialization with proper ready state management and error handling
 * - Compatibility testing integration with graceful fallback strategies
 * - Social user data integration enhancing existing authentication flows
 * - Performance optimizations for mobile and social media environments
 * - Comprehensive accessibility support with screen reader announcements
 * - Progressive enhancement that preserves all existing functionality
 */

'use client'

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  useRef,
  ReactNode 
} from 'react'
import { useAccount, useChainId } from 'wagmi'
import { sdk } from '@farcaster/miniapp-sdk'

// Import existing hooks and utilities for seamless integration
// Note: Removed useAppNavigation import to avoid circular dependency

// Type definitions for strict TypeScript
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

interface WindowWithEthereum extends Window {
  ethereum?: EthereumProvider
}

// Import compatibility testing framework (Component 2 integration point)
// Note: This import will be available once Component 2 is implemented
// import { runCompatibilityTests, type CompatibilityLevel } from '@/utils/miniapp/compatibility'

// ================================================
// TYPE DEFINITIONS FOR ENHANCED MINIAPP INTEGRATION
// ================================================

/**
 * Application Context Types
 * These types define the different environments where the app can run
 */
export type ApplicationContext = 'web' | 'miniapp'

/**
 * Viewport Size Types  
 * Aligned with design token responsive breakpoints for consistency
 */
export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

/**
 * Compatibility Levels
 * Defines the level of MiniApp features available in current environment
 */
export type CompatibilityLevel = 'full' | 'partial' | 'limited' | 'none'

/**
 * MiniApp Ready State
 * Tracks the initialization progress of the MiniApp SDK
 */
export type ReadyState = 'idle' | 'initializing' | 'ready' | 'error'

/**
 * Social User Profile
 * Enhanced user data available in social contexts like Farcaster
 */
export interface SocialUserProfile {
  readonly fid: number
  readonly username: string
  readonly displayName: string
  readonly pfpUrl?: string
  readonly verifications: readonly string[]
  readonly followerCount?: number | null
  readonly followingCount?: number | null
  readonly bio?: string | null
}

/**
 * MiniApp Context Error
 * Comprehensive error information for debugging and user feedback
 */
export interface MiniAppError {
  readonly type: 'initialization' | 'compatibility' | 'network' | 'permission' | 'unknown'
  readonly message: string
  readonly code?: string
  readonly timestamp: number
  readonly recoverable: boolean
  readonly userMessage?: string
}

/**
 * Context Value Interface
 * Complete state and functionality exposed by the Enhanced MiniAppProvider
 */
export interface EnhancedMiniAppContextValue {
  // Environment Detection
  readonly context: ApplicationContext
  readonly viewport: ViewportSize
  readonly isMiniApp: boolean
  readonly isEmbedded: boolean
  
  // SDK State Management
  readonly readyState: ReadyState
  readonly isSDKReady: boolean
  readonly sdkContext: Awaited<typeof sdk.context> | null
  
  // User and Social Integration
  readonly socialUser: SocialUserProfile | null
  readonly hasSocialContext: boolean
  
  // Compatibility and Features
  readonly compatibilityLevel: CompatibilityLevel
  readonly supportsBatchTransactions: boolean
  readonly supportsAdvancedSharing: boolean
  
  // Error Handling
  readonly error: MiniAppError | null
  readonly hasError: boolean
  
  // Actions and Utilities
  readonly initializeSDK: () => Promise<void>
  readonly refreshContext: () => Promise<void>
  readonly clearError: () => void
  readonly navigate: (path: string) => void
  
  // Performance and Analytics
  readonly performanceMetrics: {
    readonly initializationTime: number | null
    readonly lastRefreshTime: number | null
  }
}

/**
 * Provider Props Interface
 * Configuration options for the Enhanced MiniAppProvider
 */
export interface EnhancedMiniAppProviderProps {
  readonly children: ReactNode
  readonly forceContext?: ApplicationContext
  readonly enableAnalytics?: boolean
  readonly enablePerformanceTracking?: boolean
  readonly onContextChange?: (context: ApplicationContext) => void
  readonly onError?: (error: MiniAppError) => void
  readonly onReadyStateChange?: (state: ReadyState) => void
}

// ================================================
// CONTEXT CREATION AND CUSTOM HOOKS
// ================================================

/**
 * Enhanced MiniApp Context
 * React context that provides MiniApp state and functionality throughout the app
 */
const EnhancedMiniAppContext = createContext<EnhancedMiniAppContextValue | null>(null)

/**
 * Custom Hook: useMiniApp
 * Provides access to the Enhanced MiniApp context with proper error handling
 */
export function useMiniApp(): EnhancedMiniAppContextValue {
  const context = useContext(EnhancedMiniAppContext)
  
  if (!context) {
    throw new Error(
      'useMiniApp must be used within an EnhancedMiniAppProvider. ' +
      'Ensure your component is wrapped with <EnhancedMiniAppProvider> or is inside a route that provides this context.'
    )
  }
  
  return context
}

/**
 * Custom Hook: useMiniAppOptional
 * Provides optional access to MiniApp context (returns null if not available)
 */
export function useMiniAppOptional(): EnhancedMiniAppContextValue | null {
  return useContext(EnhancedMiniAppContext)
}

// ================================================
// UTILITY FUNCTIONS FOR CONTEXT DETECTION
// ================================================

/**
 * Detect Application Context
 * Intelligently determines if the app is running in a MiniApp environment
 */
function detectApplicationContext(forceContext?: ApplicationContext): ApplicationContext {
  if (forceContext) return forceContext
  
  // Server-side rendering safety check
  if (typeof window === 'undefined') return 'web'
  
  try {
    const url = new URL(window.location.href)
    
    // Check for explicit MiniApp indicators
    const isMiniAppRoute = url.pathname.startsWith('/mini') || url.pathname.startsWith('/miniapp')
    const isMiniAppParam = url.searchParams.get('context') === 'miniapp' || 
                          url.searchParams.get('miniApp') === 'true'
    
    // Check for iframe/embedded context
    const isEmbedded = window.parent !== window
    const hasFrameContext = (() => {
      try {
        return window.location !== window.parent.location
      } catch {
        return true // Cross-origin iframe will throw error
      }
    })()
    
    // Check for Farcaster-specific indicators
    const hasFarcasterUserAgent = navigator.userAgent.includes('Farcaster')
    const hasFarcasterReferrer = document.referrer.includes('farcaster') || 
                                document.referrer.includes('warpcast')
    
    // Determine context based on multiple indicators
    return (isMiniAppRoute || isMiniAppParam || isEmbedded || hasFrameContext || 
            hasFarcasterUserAgent || hasFarcasterReferrer) ? 'miniapp' : 'web'
            
  } catch (error) {
    console.warn('Error detecting application context:', error)
    return 'web' // Default to web context on error
  }
}

/**
 * Detect Viewport Size
 * Determines current viewport size using design token breakpoints
 */
function detectViewportSize(): ViewportSize {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  // Using design token breakpoints: 640px (mobile), 1024px (tablet), 1024px+ (desktop)
  if (width < 640) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Test Compatibility Level
 * Determines what MiniApp features are available in current environment
 * Note: This will integrate with Component 2 (Compatibility Testing Implementation)
 */
function testCompatibilityLevel(context: ApplicationContext): CompatibilityLevel {
  if (context === 'web') return 'full'
  
  // Basic MiniApp compatibility checks
  try {
    // Check for required APIs
    const hasSDK = typeof window !== 'undefined' && 'sdk' in window
    const hasEIP5792 = typeof window !== 'undefined' && 
                      'ethereum' in window && 
                      typeof (window as WindowWithEthereum).ethereum?.request === 'function'
    
    if (!hasSDK) return 'none'
    if (hasSDK && hasEIP5792) return 'full'
    if (hasSDK) return 'partial'
    
    return 'limited'
  } catch {
    return 'none'
  }
}

// ================================================
// ENHANCED MINIAPP PROVIDER COMPONENT
// ================================================

/**
 * Enhanced MiniApp Provider
 * The main provider component that manages MiniApp state and functionality
 */
export function EnhancedMiniAppProvider({
  children,
  forceContext,
  enableAnalytics = true,
  enablePerformanceTracking = true,
  onContextChange,
  onError,
  onReadyStateChange
}: EnhancedMiniAppProviderProps): React.ReactElement {
  
  // ================================================
  // HOOKS AND STATE MANAGEMENT
  // ================================================
  
  // Wallet integration
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Core state management
  const [context, setContext] = useState<ApplicationContext>(() => 
    detectApplicationContext(forceContext)
  )
  const [viewport, setViewport] = useState<ViewportSize>(() => detectViewportSize())
  const [readyState, setReadyState] = useState<ReadyState>('idle')
  const [sdkContext, setSDKContext] = useState<Awaited<typeof sdk.context> | null>(null)
  const [error, setError] = useState<MiniAppError | null>(null)
  const [compatibilityLevel, setCompatibilityLevel] = useState<CompatibilityLevel>(() =>
    testCompatibilityLevel(context)
  )
  
  // Performance tracking state
  const [performanceMetrics, setPerformanceMetrics] = useState({
    initializationTime: null as number | null,
    lastRefreshTime: null as number | null
  })
  
  // Refs for performance tracking
  const initStartTimeRef = useRef<number | null>(null)
  const isInitializingRef = useRef(false)
  
  // ================================================
  // VIEWPORT SIZE DETECTION
  // ================================================
  
  useEffect(() => {
    const handleResize = () => {
      setViewport(detectViewportSize())
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // ================================================
  // CONTEXT CHANGE HANDLING
  // ================================================
  
  useEffect(() => {
    onContextChange?.(context)
  }, [context, onContextChange])
  
  useEffect(() => {
    onReadyStateChange?.(readyState)
  }, [readyState, onReadyStateChange])
  
  // ================================================
  // ERROR HANDLING UTILITIES
  // ================================================
  
  const handleError = useCallback((error: Partial<MiniAppError>) => {
    const fullError: MiniAppError = {
      type: 'unknown',
      message: 'An unknown error occurred',
      timestamp: Date.now(),
      recoverable: true,
      ...error
    }
    
    setError(fullError)
    onError?.(fullError)
    
    // Log error for debugging (can be enhanced with proper logging service)
    console.error('MiniApp Error:', fullError)
  }, [onError])
  
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  // Simple navigate function to avoid circular dependency with useAppNavigation
  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path
    }
  }, [])
  
  // ================================================
  // SDK INITIALIZATION LOGIC
  // ================================================
  
  const initializeSDK = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current || readyState === 'ready') return
    
    // Only initialize for MiniApp contexts
    if (context !== 'miniapp') {
      setReadyState('ready')
      return
    }
    
    try {
      isInitializingRef.current = true
      setReadyState('initializing')
      clearError()
      
      if (enablePerformanceTracking) {
        initStartTimeRef.current = performance.now()
      }
      
      // Initialize the MiniApp SDK
      const contextData = await sdk.context
      setSDKContext(contextData)
      
      // Signal readiness to prevent loading screen issues
      await sdk.actions.ready()
      
      // Update performance metrics
      if (enablePerformanceTracking && initStartTimeRef.current) {
        const initTime = performance.now() - initStartTimeRef.current
        setPerformanceMetrics(prev => ({
          ...prev,
          initializationTime: initTime
        }))
      }
      
      setReadyState('ready')
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize MiniApp SDK'
      
      handleError({
        type: 'initialization',
        message,
        recoverable: true,
        userMessage: 'There was a problem starting the app. Please try refreshing.'
      })
      
      setReadyState('error')
    } finally {
      isInitializingRef.current = false
    }
  }, [context, enablePerformanceTracking, handleError, clearError, readyState])
  
  // ================================================
  // CONTEXT REFRESH FUNCTIONALITY
  // ================================================
  
  const refreshContext = useCallback(async (): Promise<void> => {
    if (context !== 'miniapp' || !sdkContext) return
    
    try {
      const refreshStartTime = performance.now()
      
      // Refresh the SDK context
      const newContext = await sdk.context
      setSDKContext(newContext)
      
      if (enablePerformanceTracking) {
        const refreshTime = performance.now() - refreshStartTime
        setPerformanceMetrics(prev => ({
          ...prev,
          lastRefreshTime: refreshTime
        }))
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh context'
      
      handleError({
        type: 'network',
        message,
        recoverable: true,
        userMessage: 'Unable to update social information. Some features may be limited.'
      })
    }
  }, [context, sdkContext, enablePerformanceTracking, handleError])
  
  // ================================================
  // AUTOMATIC SDK INITIALIZATION
  // ================================================
  
  useEffect(() => {
    if (context === 'miniapp' && readyState === 'idle') {
      initializeSDK()
    }
  }, [context, readyState, initializeSDK])
  
  // ================================================
  // DERIVED STATE AND COMPUTED VALUES
  // ================================================
  
  const derivedState = useMemo(() => {
    const isMiniApp = context === 'miniapp'
    const isEmbedded = typeof window !== 'undefined' && window.parent !== window
    const isSDKReady = readyState === 'ready'
    const hasError = error !== null
    
    // Extract social user profile from SDK context
    const socialUser: SocialUserProfile | null = sdkContext?.user ? {
      fid: sdkContext.user.fid,
      username: sdkContext.user.username || '',
      displayName: sdkContext.user.displayName || '',
      pfpUrl: sdkContext.user.pfpUrl,
      verifications: [],
      followerCount: null,
      followingCount: null,
      bio: null
    } : null
    
    const hasSocialContext = isMiniApp && socialUser !== null
    
    // Feature capability detection
    const supportsBatchTransactions = compatibilityLevel === 'full' && isMiniApp
    const supportsAdvancedSharing = compatibilityLevel !== 'none' && isMiniApp
    
    return {
      isMiniApp,
      isEmbedded,
      isSDKReady,
      hasError,
      socialUser,
      hasSocialContext,
      supportsBatchTransactions,
      supportsAdvancedSharing
    }
  }, [context, readyState, error, sdkContext, compatibilityLevel])
  
  // ================================================
  // CONTEXT VALUE COMPOSITION
  // ================================================
  
  const contextValue = useMemo((): EnhancedMiniAppContextValue => ({
    // Environment Detection
    context,
    viewport,
    isMiniApp: derivedState.isMiniApp,
    isEmbedded: derivedState.isEmbedded,
    
    // SDK State Management
    readyState,
    isSDKReady: derivedState.isSDKReady,
    sdkContext,
    
    // User and Social Integration
    socialUser: derivedState.socialUser,
    hasSocialContext: derivedState.hasSocialContext,
    
    // Compatibility and Features
    compatibilityLevel,
    supportsBatchTransactions: derivedState.supportsBatchTransactions,
    supportsAdvancedSharing: derivedState.supportsAdvancedSharing,
    
    // Error Handling
    error,
    hasError: derivedState.hasError,
    
    // Actions and Utilities
    initializeSDK,
    refreshContext,
    clearError,
    navigate,
    
    // Performance and Analytics
    performanceMetrics
  }), [
    context,
    viewport,
    readyState,
    sdkContext,
    compatibilityLevel,
    error,
    derivedState,
    performanceMetrics,
    initializeSDK,
    refreshContext,
    clearError,
    navigate
  ])
  
  // ================================================
  // RENDER WITH ACCESSIBILITY SUPPORT
  // ================================================
  
  return (
    <EnhancedMiniAppContext.Provider value={contextValue}>
      {/* Screen reader announcements for accessibility */}
      {readyState === 'initializing' && (
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        >
          Initializing social features...
        </div>
      )}
      
      {error && (
        <div 
          className="sr-only" 
          aria-live="assertive" 
          aria-atomic="true"
        >
          {error.userMessage || error.message}
        </div>
      )}
      
      {readyState === 'ready' && derivedState.hasSocialContext && (
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        >
          Social features ready. Welcome, {derivedState.socialUser?.displayName}!
        </div>
      )}
      
      {children}
    </EnhancedMiniAppContext.Provider>
  )
}

// ================================================
// ADDITIONAL UTILITY HOOKS
// ================================================

/**
 * Custom Hook: useMiniAppFeatures
 * Provides easy access to feature availability flags
 */
export function useMiniAppFeatures() {
  const { 
    supportsBatchTransactions, 
    supportsAdvancedSharing, 
    compatibilityLevel,
    isMiniApp 
  } = useMiniApp()
  
  return {
    batchTransactions: supportsBatchTransactions,
    advancedSharing: supportsAdvancedSharing,
    socialIntegration: isMiniApp,
    fullFeatures: compatibilityLevel === 'full'
  }
}

/**
 * Custom Hook: useMiniAppSocial
 * Provides easy access to social user data and features
 */
export function useMiniAppSocial() {
  const { 
    socialUser, 
    hasSocialContext, 
    refreshContext,
    isMiniApp 
  } = useMiniApp()
  
  return {
    user: socialUser,
    isAvailable: hasSocialContext,
    isEnabled: isMiniApp,
    refresh: refreshContext
  }
}

/**
 * Custom Hook: useMiniAppPerformance
 * Provides access to performance metrics for optimization
 */
export function useMiniAppPerformance() {
  const { performanceMetrics, readyState } = useMiniApp()
  
  return {
    ...performanceMetrics,
    isReady: readyState === 'ready',
    isLoading: readyState === 'initializing'
  }
}

export default EnhancedMiniAppProvider
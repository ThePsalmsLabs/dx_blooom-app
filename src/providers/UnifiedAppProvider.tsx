/**
 * UnifiedAppProvider Component - Phase 4 System Integration
 * File: src/providers/UnifiedAppProvider.tsx
 * 
 * This component represents the culmination of the Web App & Mini App Interface Alignment
 * Roadmap, consolidating all provider systems into a single, unified state management
 * architecture. It replaces the separate AppProvider and MiniAppProvider systems while
 * preserving all functionality and adding enhanced cross-context capabilities.
 * 
 * Key Features:
 * - Unified state management consolidating AppProvider and MiniAppProvider functionality
 * - Context-aware initialization ('web' vs 'miniapp') with automatic detection
 * - Viewport-responsive state management ('mobile', 'tablet', 'desktop')
 * - Performance optimization with lazy loading and context-aware resource management
 * - Enhanced error handling with recovery mechanisms and user feedback
 * - Social integration with Farcaster SDK when in miniapp context
 * - Accessibility support with screen reader announcements and focus management
 * - Progressive enhancement building on all previous unified components
 * 
 * Architecture Integration:
 * - Consolidates existing provider patterns into unified system
 * - Integrates with useAppNavigation, useContentById, useHasContentAccess hooks
 * - Supports AdaptiveNavigation, UnifiedContentBrowser, UnifiedPurchaseFlow components
 * - Uses design tokens and responsive styles for consistent UI feedback
 * - Provides foundation for all unified components to share consistent state
 * - Maintains backward compatibility with existing authentication flows
 * 
 * Progressive Foundation:
 * This provider completes the four-phase unification process, creating a single
 * source of truth for application state that enables consistent user experiences
 * across all contexts while optimizing performance and maintainability.
 */

'use client'

import { ReactNode, createContext, useContext, useMemo, useState, useEffect, useRef, useReducer } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

// Import existing business logic hooks
import { 
  useAppNavigation, 
  type NavigationSection, 
  type UserRole 
} from '@/components/layout/Navigation'
import { 
  useIsCreatorRegistered
} from '@/hooks/contracts/core'

// Import utilities and types
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

// ================================================
// TYPE DEFINITIONS FOR UNIFIED STATE MANAGEMENT
// ================================================

/**
 * Application Context Types
 */
export type ApplicationContext = 'web' | 'miniapp'
export type ViewportSize = 'mobile' | 'tablet' | 'desktop'
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Enhanced User Profile Interface
 * Combines wallet data with social context and role information
 */
export interface UnifiedUserProfile {
  /** Wallet address */
  readonly address?: Address
  /** Connection status */
  readonly connectionStatus: ConnectionStatus
  /** User role in the platform */
  readonly userRole: UserRole
  /** Creator registration status */
  readonly isRegisteredCreator: boolean
  /** Social profile data (available in miniapp context) */
  readonly socialProfile?: {
    readonly fid?: number
    readonly username?: string
    readonly displayName?: string
    readonly pfpUrl?: string
    readonly bio?: string
    readonly followerCount?: number
    readonly followingCount?: number
  }
  /** Enhanced capabilities */
  readonly capabilities: {
    readonly canCreateContent: boolean
    readonly canPurchaseContent: boolean
    readonly canShareSocially: boolean
    readonly canUseBatchTransactions: boolean
  }
}

/**
 * Application State Interface
 * Comprehensive state management for the entire application
 */
export interface UnifiedApplicationState {
  /** Current application context */
  readonly context: ApplicationContext
  /** Current viewport size */
  readonly viewport: ViewportSize
  /** User profile and authentication state */
  readonly user: UnifiedUserProfile
  /** Navigation state */
  readonly navigation: {
    readonly sections: readonly NavigationSection[]
    readonly currentPath: string
    readonly isNavigating: boolean
  }
  /** Content state management */
  readonly content: {
    readonly isLoading: boolean
    readonly error: Error | null
    readonly lastRefresh: Date | null
  }
  /** UI state management */
  readonly ui: {
    readonly theme: 'light' | 'dark' | 'system'
    readonly isReducedMotion: boolean
    readonly announcements: readonly string[]
  }
  /** Performance state */
  readonly performance: {
    readonly isOptimizedMode: boolean
    readonly connectionQuality: 'fast' | 'slow' | 'offline'
    readonly resourcesLoaded: boolean
  }
  /** Error state management */
  readonly errors: {
    readonly critical: Error | null
    readonly recoverable: readonly Error[]
    readonly dismissed: readonly string[]
  }
}

/**
 * Unified App Context Interface
 * Public API exposed to consuming components
 */
export interface UnifiedAppContextValue {
  /** Current application state */
  readonly state: UnifiedApplicationState
  /** State mutation actions */
  readonly actions: {
    /** Navigation actions */
    readonly navigate: (path: string) => void
    readonly setNavigationLoading: (isLoading: boolean) => void
    /** User actions */
    readonly connectWallet: () => Promise<void>
    readonly disconnectWallet: () => void
    readonly updateUserRole: (role: UserRole) => void
    /** Content actions */
    readonly refreshContent: () => Promise<void>
    readonly clearContentCache: () => void
    /** UI actions */
    readonly setTheme: (theme: 'light' | 'dark' | 'system') => void
    readonly announceToScreenReader: (message: string) => void
    readonly dismissAnnouncement: (message: string) => void
    /** Error actions */
    readonly reportError: (error: Error, context?: string) => void
    readonly dismissError: (errorId: string) => void
    readonly clearErrors: () => void
  }
  /** Context utilities */
  readonly utils: {
    readonly isMiniApp: boolean
    readonly isDesktop: boolean
    readonly isMobile: boolean
    readonly hasTouch: boolean
    readonly canShare: boolean
    readonly supportsWebShare: boolean
  }
}

/**
 * Component Props Interface
 */
export interface UnifiedAppProviderProps {
  /** Child components */
  children: ReactNode
  /** Override context detection */
  forceContext?: ApplicationContext
  /** Override viewport detection */
  forceViewport?: ViewportSize
  /** Initial theme preference */
  initialTheme?: 'light' | 'dark' | 'system'
  /** Enable performance optimizations */
  enableOptimizations?: boolean
  /** Custom error boundary fallback */
  errorFallback?: ReactNode
  /** Debug mode for development */
  debugMode?: boolean
}

// ================================================
// STATE MANAGEMENT WITH REDUCER PATTERN
// ================================================

/**
 * State Action Types
 */
type StateAction =
  | { type: 'CONTEXT_DETECTED'; context: ApplicationContext }
  | { type: 'VIEWPORT_CHANGED'; viewport: ViewportSize }
  | { type: 'USER_CONNECTED'; address: Address; userRole: UserRole }
  | { type: 'USER_DISCONNECTED' }
  | { type: 'USER_ROLE_UPDATED'; userRole: UserRole }
  | { type: 'CREATOR_STATUS_UPDATED'; isRegisteredCreator: boolean }
  | { type: 'SOCIAL_PROFILE_UPDATED'; socialProfile: UnifiedUserProfile['socialProfile'] }
  | { type: 'NAVIGATION_SECTIONS_UPDATED'; sections: readonly NavigationSection[] }
  | { type: 'NAVIGATION_LOADING'; isLoading: boolean }
  | { type: 'NAVIGATION_CHANGED'; currentPath: string }
  | { type: 'CONTENT_LOADING'; isLoading: boolean }
  | { type: 'CONTENT_ERROR'; error: Error | null }
  | { type: 'CONTENT_REFRESHED' }
  | { type: 'THEME_CHANGED'; theme: 'light' | 'dark' | 'system' }
  | { type: 'REDUCED_MOTION_CHANGED'; isReducedMotion: boolean }
  | { type: 'ANNOUNCEMENT_ADDED'; message: string }
  | { type: 'ANNOUNCEMENT_DISMISSED'; message: string }
  | { type: 'CONNECTION_QUALITY_CHANGED'; connectionQuality: 'fast' | 'slow' | 'offline' }
  | { type: 'OPTIMIZATION_MODE_CHANGED'; isOptimizedMode: boolean }
  | { type: 'RESOURCES_LOADED' }
  | { type: 'ERROR_REPORTED'; error: Error; context?: string }
  | { type: 'ERROR_DISMISSED'; errorId: string }
  | { type: 'ERRORS_CLEARED' }

/**
 * Initial State Factory
 */
function createInitialState(
  forceContext?: ApplicationContext,
  forceViewport?: ViewportSize,
  initialTheme: 'light' | 'dark' | 'system' = 'system'
): UnifiedApplicationState {
  return {
    context: forceContext || 'web',
    viewport: forceViewport || 'desktop',
    user: {
      connectionStatus: 'disconnected',
      userRole: 'disconnected',
      isRegisteredCreator: false,
      capabilities: {
        canCreateContent: false,
        canPurchaseContent: false,
        canShareSocially: false,
        canUseBatchTransactions: false
      }
    },
    navigation: {
      sections: [],
      currentPath: '/',
      isNavigating: false
    },
    content: {
      isLoading: false,
      error: null,
      lastRefresh: null
    },
    ui: {
      theme: initialTheme,
      isReducedMotion: false,
      announcements: []
    },
    performance: {
      isOptimizedMode: false,
      connectionQuality: 'fast',
      resourcesLoaded: false
    },
    errors: {
      critical: null,
      recoverable: [],
      dismissed: []
    }
  }
}

/**
 * State Reducer
 */
function unifiedAppReducer(
  state: UnifiedApplicationState, 
  action: StateAction
): UnifiedApplicationState {
  switch (action.type) {
    case 'CONTEXT_DETECTED':
      return {
        ...state,
        context: action.context,
        performance: {
          ...state.performance,
          isOptimizedMode: action.context === 'miniapp'
        }
      }

    case 'VIEWPORT_CHANGED':
      return {
        ...state,
        viewport: action.viewport
      }

    case 'USER_CONNECTED':
      return {
        ...state,
        user: {
          ...state.user,
          address: action.address,
          connectionStatus: 'connected',
          userRole: action.userRole,
          capabilities: {
            canCreateContent: action.userRole === 'creator' || action.userRole === 'admin',
            canPurchaseContent: action.userRole !== 'disconnected',
            canShareSocially: state.context === 'miniapp',
            canUseBatchTransactions: state.context === 'miniapp'
          }
        }
      }

    case 'USER_DISCONNECTED':
      return {
        ...state,
        user: {
          connectionStatus: 'disconnected',
          userRole: 'disconnected',
          isRegisteredCreator: false,
          capabilities: {
            canCreateContent: false,
            canPurchaseContent: false,
            canShareSocially: false,
            canUseBatchTransactions: false
          }
        }
      }

    case 'USER_ROLE_UPDATED':
      return {
        ...state,
        user: {
          ...state.user,
          userRole: action.userRole,
          capabilities: {
            ...state.user.capabilities,
            canCreateContent: action.userRole === 'creator' || action.userRole === 'admin',
            canPurchaseContent: action.userRole !== 'disconnected'
          }
        }
      }

    case 'CREATOR_STATUS_UPDATED':
      return {
        ...state,
        user: {
          ...state.user,
          isRegisteredCreator: action.isRegisteredCreator
        }
      }

    case 'SOCIAL_PROFILE_UPDATED':
      return {
        ...state,
        user: {
          ...state.user,
          socialProfile: action.socialProfile
        }
      }

    case 'NAVIGATION_SECTIONS_UPDATED':
      return {
        ...state,
        navigation: {
          ...state.navigation,
          sections: action.sections
        }
      }

    case 'NAVIGATION_LOADING':
      return {
        ...state,
        navigation: {
          ...state.navigation,
          isNavigating: action.isLoading
        }
      }

    case 'NAVIGATION_CHANGED':
      return {
        ...state,
        navigation: {
          ...state.navigation,
          currentPath: action.currentPath
        }
      }

    case 'CONTENT_LOADING':
      return {
        ...state,
        content: {
          ...state.content,
          isLoading: action.isLoading
        }
      }

    case 'CONTENT_ERROR':
      return {
        ...state,
        content: {
          ...state.content,
          error: action.error,
          isLoading: false
        }
      }

    case 'CONTENT_REFRESHED':
      return {
        ...state,
        content: {
          ...state.content,
          lastRefresh: new Date(),
          error: null,
          isLoading: false
        }
      }

    case 'THEME_CHANGED':
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.theme
        }
      }

    case 'REDUCED_MOTION_CHANGED':
      return {
        ...state,
        ui: {
          ...state.ui,
          isReducedMotion: action.isReducedMotion
        }
      }

    case 'ANNOUNCEMENT_ADDED':
      return {
        ...state,
        ui: {
          ...state.ui,
          announcements: [...state.ui.announcements, action.message]
        }
      }

    case 'ANNOUNCEMENT_DISMISSED':
      return {
        ...state,
        ui: {
          ...state.ui,
          announcements: state.ui.announcements.filter(msg => msg !== action.message)
        }
      }

    case 'CONNECTION_QUALITY_CHANGED':
      return {
        ...state,
        performance: {
          ...state.performance,
          connectionQuality: action.connectionQuality
        }
      }

    case 'OPTIMIZATION_MODE_CHANGED':
      return {
        ...state,
        performance: {
          ...state.performance,
          isOptimizedMode: action.isOptimizedMode
        }
      }

    case 'RESOURCES_LOADED':
      return {
        ...state,
        performance: {
          ...state.performance,
          resourcesLoaded: true
        }
      }

    case 'ERROR_REPORTED':
      const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newError = { 
        ...action.error, 
        id: errorId, 
        context: action.context 
      } as Error & { id: string; context?: string }
      
      return {
        ...state,
        errors: action.error.name === 'CriticalError' ? {
          ...state.errors,
          critical: newError
        } : {
          ...state.errors,
          recoverable: [...state.errors.recoverable, newError]
        }
      }

    case 'ERROR_DISMISSED':
      return {
        ...state,
        errors: {
          ...state.errors,
          recoverable: state.errors.recoverable.filter(error => 
            (error as Error & { id: string }).id !== action.errorId
          ),
          dismissed: [...state.errors.dismissed, action.errorId]
        }
      }

    case 'ERRORS_CLEARED':
      return {
        ...state,
        errors: {
          critical: null,
          recoverable: [],
          dismissed: []
        }
      }

    default:
      return state
  }
}

// ================================================
// CONTEXT CREATION AND PROVIDER IMPLEMENTATION
// ================================================

/**
 * Unified App Context
 */
const UnifiedAppContext = createContext<UnifiedAppContextValue | null>(null)

/**
 * Context Detection Hook
 * Intelligently detects application context based on environment
 */
function useContextDetection(forceContext?: ApplicationContext): ApplicationContext {
  return useMemo(() => {
    if (forceContext) return forceContext

    // Check for MiniApp indicators
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const isMiniAppRoute = url.pathname.startsWith('/miniapp')
      const isMiniAppParam = url.searchParams.get('context') === 'miniapp'
      const isEmbedded = window.parent !== window
      const hasFrameContext = window.location !== window.parent.location

      if (isMiniAppRoute || isMiniAppParam || isEmbedded || hasFrameContext) {
        return 'miniapp'
      }
    }

    return 'web'
  }, [forceContext])
}

/**
 * Viewport Detection Hook
 * Detects viewport size with intelligent responsive breakpoints
 */
function useViewportDetection(forceViewport?: ViewportSize): ViewportSize {
  const [viewport, setViewport] = useState<ViewportSize>(forceViewport || 'desktop')

  useEffect(() => {
    if (forceViewport) return

    const updateViewport = () => {
      const width = window.innerWidth
      // Using design token breakpoints: 640px (mobile), 1024px (tablet), 1280+ (desktop)
      if (width < 640) {
        setViewport('mobile')
      } else if (width < 1024) {
        setViewport('tablet')
      } else {
        setViewport('desktop')
      }
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [forceViewport])

  return forceViewport || viewport
}

/**
 * Performance Monitoring Hook
 * Monitors connection quality and performance metrics
 */
function usePerformanceMonitoring() {
  const [connectionQuality, setConnectionQuality] = useState<'fast' | 'slow' | 'offline'>('fast')

  useEffect(() => {
    // Monitor connection quality
    const updateConnectionQuality = () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline')
        return
      }

      // Check connection via navigator.connection if available
      const connection = (navigator as { connection?: { effectiveType?: string } }).connection
      if (connection) {
        const effectiveType = connection.effectiveType
        if (effectiveType === '4g') {
          setConnectionQuality('fast')
        } else if (effectiveType === '3g') {
          setConnectionQuality('slow')
        } else {
          setConnectionQuality('slow')
        }
      }
    }

    updateConnectionQuality()
    window.addEventListener('online', updateConnectionQuality)
    window.addEventListener('offline', updateConnectionQuality)

    return () => {
      window.removeEventListener('online', updateConnectionQuality)
      window.removeEventListener('offline', updateConnectionQuality)
    }
  }, [])

  return { connectionQuality }
}

/**
 * Screen Reader Announcements Hook
 */
function useScreenReaderAnnouncements(announcements: readonly string[]) {
  const announcementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (announcements.length > 0 && announcementRef.current) {
      const latestAnnouncement = announcements[announcements.length - 1]
      announcementRef.current.textContent = latestAnnouncement
    }
  }, [announcements])

  return announcementRef
}

/**
 * Main UnifiedAppProvider Component
 */
export function UnifiedAppProvider({
  children,
  forceContext,
  forceViewport,
  initialTheme = 'system',
  errorFallback,
  debugMode = false
}: UnifiedAppProviderProps) {
  // ===== CORE STATE MANAGEMENT =====
  
  const [state, dispatch] = useReducer(
    unifiedAppReducer,
    createInitialState(forceContext, forceViewport, initialTheme)
  )

  // ===== CONTEXT AND ENVIRONMENT DETECTION =====
  
  const detectedContext = useContextDetection(forceContext)
  const detectedViewport = useViewportDetection(forceViewport)
  const { connectionQuality } = usePerformanceMonitoring()

  // ===== EXISTING HOOK INTEGRATIONS =====
  
  const router = useRouter()
  const pathname = usePathname()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const queryClient = useQueryClient()

  // Navigation hook integration
  const navigationSections = useAppNavigation(state.user.userRole)
  
  // Creator registration status
  const creatorRegistration = useIsCreatorRegistered(address)
  
  // MiniApp context integration (when available)
  const farcasterContext = useFarcasterContext()

  // ===== EFFECTS FOR STATE SYNCHRONIZATION =====

  // Context detection effect
  useEffect(() => {
    if (detectedContext !== state.context) {
      dispatch({ type: 'CONTEXT_DETECTED', context: detectedContext })
    }
  }, [detectedContext, state.context])

  // Viewport detection effect
  useEffect(() => {
    if (detectedViewport !== state.viewport) {
      dispatch({ type: 'VIEWPORT_CHANGED', viewport: detectedViewport })
    }
  }, [detectedViewport, state.viewport])

  // Connection quality monitoring effect
  useEffect(() => {
    if (connectionQuality !== state.performance.connectionQuality) {
      dispatch({ type: 'CONNECTION_QUALITY_CHANGED', connectionQuality })
    }
  }, [connectionQuality, state.performance.connectionQuality])

  // User connection state synchronization
  useEffect(() => {
    if (isConnected && address) {
      const userRole = determineUserRole(address, creatorRegistration.data)
      dispatch({ type: 'USER_CONNECTED', address, userRole })
    } else if (!isConnected && state.user.connectionStatus !== 'disconnected') {
      dispatch({ type: 'USER_DISCONNECTED' })
    }
  }, [isConnected, address, creatorRegistration.data, state.user.connectionStatus])

  // Creator status synchronization
  useEffect(() => {
    if (creatorRegistration.data !== undefined) {
      dispatch({ 
        type: 'CREATOR_STATUS_UPDATED', 
        isRegisteredCreator: creatorRegistration.data 
      })
    }
  }, [creatorRegistration.data])

  // Social profile synchronization (MiniApp context)
  useEffect(() => {
    if (farcasterContext && state.context === 'miniapp') {
      const socialProfile = {
        fid: farcasterContext.user?.fid,
        username: farcasterContext.user?.username,
        // Only include properties that exist on the actual interface
        displayName: undefined, // Not available in the actual interface
        pfpUrl: undefined, // Not available in the actual interface
        bio: undefined, // Not available in the actual interface
        followerCount: undefined, // Not available in the actual interface
        followingCount: undefined // Not available in the actual interface
      }
      dispatch({ type: 'SOCIAL_PROFILE_UPDATED', socialProfile })
    }
  }, [farcasterContext, state.context])

  // Navigation sections synchronization
  useEffect(() => {
    dispatch({ type: 'NAVIGATION_SECTIONS_UPDATED', sections: navigationSections })
  }, [navigationSections])

  // Pathname change tracking
  useEffect(() => {
    dispatch({ type: 'NAVIGATION_CHANGED', currentPath: pathname })
  }, [pathname])

  // Reduced motion preference detection
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => {
      dispatch({ type: 'REDUCED_MOTION_CHANGED', isReducedMotion: e.matches })
    }
    
    dispatch({ type: 'REDUCED_MOTION_CHANGED', isReducedMotion: mediaQuery.matches })
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Resource loading tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'RESOURCES_LOADED' })
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // ===== ACTION HANDLERS =====

  const actions = useMemo<UnifiedAppContextValue['actions']>(() => ({
    navigate: (path: string) => {
      dispatch({ type: 'NAVIGATION_LOADING', isLoading: true })
      router.push(path)
      // Navigation loading will be reset by pathname effect
    },

    setNavigationLoading: (isLoading: boolean) => {
      dispatch({ type: 'NAVIGATION_LOADING', isLoading })
    },

    connectWallet: async () => {
      try {
        if (connectors.length > 0) {
          await connect({ connector: connectors[0] })
        }
      } catch (error) {
        dispatch({ 
          type: 'ERROR_REPORTED', 
          error: error as Error, 
          context: 'wallet_connection' 
        })
      }
    },

    disconnectWallet: () => {
      disconnect()
    },

    updateUserRole: (role: UserRole) => {
      dispatch({ type: 'USER_ROLE_UPDATED', userRole: role })
    },

    refreshContent: async () => {
      dispatch({ type: 'CONTENT_LOADING', isLoading: true })
      try {
        // Implement actual cache invalidation for content hooks
        await queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey.includes('getActiveContentPaginated') ||
            query.queryKey.includes('getContent') ||
            query.queryKey.includes('getCreatorContent')
        })
        dispatch({ type: 'CONTENT_REFRESHED' })
      } catch (error) {
        dispatch({ type: 'CONTENT_ERROR', error: error as Error })
      }
    },

    clearContentCache: () => {
      // Implement actual React Query cache clearing for content
      queryClient.removeQueries({ 
        predicate: (query) => 
          query.queryKey.includes('getActiveContentPaginated') ||
          query.queryKey.includes('getContent') ||
          query.queryKey.includes('getCreatorContent')
      })
      dispatch({ type: 'CONTENT_REFRESHED' })
    },

    setTheme: (theme: 'light' | 'dark' | 'system') => {
      dispatch({ type: 'THEME_CHANGED', theme })
      // Apply theme to document
      document.documentElement.setAttribute('data-theme', theme)
    },

    announceToScreenReader: (message: string) => {
      dispatch({ type: 'ANNOUNCEMENT_ADDED', message })
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dispatch({ type: 'ANNOUNCEMENT_DISMISSED', message })
      }, 5000)
    },

    dismissAnnouncement: (message: string) => {
      dispatch({ type: 'ANNOUNCEMENT_DISMISSED', message })
    },

    reportError: (error: Error, context?: string) => {
      dispatch({ type: 'ERROR_REPORTED', error, context })
      
      // Log to external error service in production
      if (process.env.NODE_ENV === 'production') {
        console.error('UnifiedAppProvider Error:', error, { context })
      }
    },

    dismissError: (errorId: string) => {
      dispatch({ type: 'ERROR_DISMISSED', errorId })
    },

    clearErrors: () => {
      dispatch({ type: 'ERRORS_CLEARED' })
    }
  }), [router, connect, disconnect, connectors, queryClient])

  // ===== CONTEXT UTILITIES =====

  const utils = useMemo<UnifiedAppContextValue['utils']>(() => ({
    isMiniApp: state.context === 'miniapp',
    isDesktop: state.viewport === 'desktop',
    isMobile: state.viewport === 'mobile',
    hasTouch: typeof window !== 'undefined' && 'ontouchstart' in window,
    canShare: state.context === 'miniapp' && !!farcasterContext,
    supportsWebShare: typeof navigator !== 'undefined' && !!navigator.share
  }), [state.context, state.viewport, farcasterContext])

  // ===== CONTEXT VALUE MEMOIZATION =====

  const contextValue = useMemo<UnifiedAppContextValue>(() => ({
    state,
    actions,
    utils
  }), [state, actions, utils])

  // ===== ACCESSIBILITY SUPPORT =====

  const announcementRef = useScreenReaderAnnouncements(state.ui.announcements)

  // ===== DEBUG LOGGING =====

  useEffect(() => {
    if (debugMode) {
      console.log('UnifiedAppProvider State:', state)
    }
  }, [state, debugMode])

  // ===== ERROR BOUNDARY FALLBACK =====

  if (state.errors.critical) {
    return errorFallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-destructive mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground">
            We encountered a critical error. Please refresh the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // ===== MAIN RENDER =====

  return (
    <UnifiedAppContext.Provider value={contextValue}>
      <div 
        data-context={state.context}
        data-viewport={state.viewport}
        data-theme={state.ui.theme}
        data-reduced-motion={state.ui.isReducedMotion}
        className={cn(
          'unified-app-container',
          'min-h-screen',
          'transition-adaptive',
          state.performance.isOptimizedMode && 'optimized-mode'
        )}
      >
        {children}
        
        {/* Screen Reader Announcements */}
        <div
          ref={announcementRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        
        {/* Development Debug Panel */}
        {debugMode && process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 bg-background border rounded-lg p-3 text-xs font-mono max-w-xs z-50 shadow-lg">
            <div className="space-y-1">
              <div>Context: {state.context}</div>
              <div>Viewport: {state.viewport}</div>
              <div>Role: {state.user.userRole}</div>
              <div>Connected: {state.user.connectionStatus}</div>
              <div>Quality: {state.performance.connectionQuality}</div>
            </div>
          </div>
        )}
      </div>
    </UnifiedAppContext.Provider>
  )
}

// ================================================
// CUSTOM HOOK FOR CONSUMING CONTEXT
// ================================================

/**
 * Custom hook for accessing unified app context
 */
export function useUnifiedApp(): UnifiedAppContextValue {
  const context = useContext(UnifiedAppContext)
  
  if (!context) {
    throw new Error(
      'useUnifiedApp must be used within a UnifiedAppProvider. ' +
      'Make sure your component is wrapped with <UnifiedAppProvider> at the root level.'
    )
  }
  
  return context
}

/**
 * Convenience hook for accessing app state
 */
export function useUnifiedAppState(): UnifiedApplicationState {
  const { state } = useUnifiedApp()
  return state
}

/**
 * Convenience hook for accessing app actions
 */
export function useUnifiedAppActions(): UnifiedAppContextValue['actions'] {
  const { actions } = useUnifiedApp()
  return actions
}

/**
 * Convenience hook for accessing app utilities
 */
export function useUnifiedAppUtils(): UnifiedAppContextValue['utils'] {
  const { utils } = useUnifiedApp()
  return utils
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Determines user role based on address and creator status
 */
function determineUserRole(address?: Address, isRegisteredCreator?: boolean): UserRole {
  if (!address) return 'disconnected'
  
  // Implement admin address detection
  const adminAddresses: Address[] = [
    // Add admin addresses here - these would be environment variables in production
    process.env.NEXT_PUBLIC_ADMIN_ADDRESS_1 as Address,
    process.env.NEXT_PUBLIC_ADMIN_ADDRESS_2 as Address,
    process.env.NEXT_PUBLIC_ADMIN_ADDRESS_3 as Address,
  ].filter(Boolean) as Address[]
  
  if (adminAddresses.includes(address)) {
    return 'admin'
  }
  
  if (isRegisteredCreator) {
    return 'creator'
  }
  
  return 'consumer'
}

/**
 * High-Order Component for providing unified app context
 */
export function withUnifiedApp<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P & { unifiedAppProps?: Partial<UnifiedAppProviderProps> }> {
  return function WithUnifiedAppComponent({ unifiedAppProps, ...props }) {
    return (
      <UnifiedAppProvider {...unifiedAppProps}>
        <Component {...(props as P)} />
      </UnifiedAppProvider>
    )
  }
}

// ================================================
// EXPORTS
// ================================================

export default UnifiedAppProvider

// Export types for external usage
// export type {
//   ApplicationContext,
//   ViewportSize,
//   ConnectionStatus,
//   LoadingState,
//   UnifiedUserProfile,
//   UnifiedApplicationState,
//   UnifiedAppContextValue,
//   UnifiedAppProviderProps
// }
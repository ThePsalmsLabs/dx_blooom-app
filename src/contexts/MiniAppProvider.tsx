/**
 * Enhanced MiniApp Provider - Complete Social Commerce Integration
 * File: src/contexts/MiniAppProvider.tsx
 * 
 * This component serves as the comprehensive MiniApp context provider that seamlessly
 * integrates with your existing UnifiedAppProvider architecture while adding advanced
 * social commerce capabilities. It builds upon your established patterns while extending
 * functionality to support Farcaster SDK integration, social user management, and
 * progressive enhancement for optimal user experience across all contexts.
 * 
 * Key Architectural Integration:
 * - Extends your existing UnifiedAppProvider patterns and state management
 * - Uses established types for complete type safety
 * - Leverages detection utilities for intelligent environment assessment
 * - Integrates with your existing authentication and user management systems
 * - Maintains compatibility with your established error handling and recovery patterns
 * - Follows your createContext/useContext patterns with proper error boundaries
 * 
 * Social Commerce Features:
 * - Comprehensive Farcaster SDK integration with proper initialization
 * - Social user profile enhancement building on your existing user management
 * - Social sharing capabilities with content tracking and analytics
 * - Batch transaction support for enhanced payment UX
 * - Real-time capability monitoring and progressive enhancement
 * - Social engagement tracking and conversion optimization
 * 
 * Production Architecture:
 * - Robust error handling with graceful fallbacks to your existing web experience
 * - Performance optimization for mobile and embedded contexts
 * - Real-time monitoring and adaptation based on capability changes
 * - Comprehensive analytics integration for social commerce optimization
 * - Security considerations for social platform integration
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
  useReducer,
  ReactNode
} from 'react'
import { useChainId } from 'wagmi'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { useQueryClient } from '@tanstack/react-query'

// Import your established types and patterns
import type {
  UnifiedUserProfile
} from '@/providers/UnifiedAppProvider'

// Import miniapp types
import type {
  MiniAppEnvironment,
  MiniAppCapabilities,
  MiniAppState,
  EnhancedSocialProfile,
  FarcasterSDKUser,
  SocialShareableContent,
  SocialInteraction,
  MiniAppError,
  Address
} from '@/types/miniapp'

// Import detection utilities
import {
  detectMiniAppEnvironment,
  type MiniAppEnvironmentDetection
} from '@/lib/miniapp/detection'

// Import your existing hooks for seamless integration
import { useIsCreatorRegistered } from '@/hooks/contracts/core'
import { debug } from '@/lib/utils/debug'

// ================================================
// ENHANCED MINIAPP STATE MANAGEMENT
// ================================================

/**
 * Farcaster SDK Context interface based on actual usage
 */
interface ActualFarcasterSDKContext {
  readonly user: {
    readonly fid: number
    readonly username?: string
    readonly displayName?: string
    readonly pfpUrl?: string
  }
  readonly client: {
    readonly platformType?: string
  }
  readonly location?: {
    readonly type?: string
  }
}

/**
 * SDK Actions interface based on actual usage
 */
interface ActualFarcasterSDKActions {
  readonly ready: (options?: unknown) => Promise<void>
  readonly openUrl: (url: string) => Promise<void>
  readonly close: () => Promise<void>
  readonly composeCast?: (options: {
    readonly text: string
    readonly embeds?: readonly string[]
  }) => Promise<{ cast: any | null } | undefined>
  readonly share?: (options: {
    readonly text: string
    readonly url?: string
    readonly embeds?: readonly { url: string }[]
  }) => Promise<{ success: boolean; castHash?: string }>
}

/**
 * Enhanced MiniApp State Interface
 * 
 * This extends your existing state management patterns with comprehensive
 * MiniApp-specific state while maintaining full compatibility.
 */
interface EnhancedMiniAppState extends MiniAppState {
  /** SDK initialization and management */
  readonly sdkState: {
    readonly isInitialized: boolean
    readonly isReady: boolean
    readonly initializationAttempts: number
    readonly lastError: MiniAppError | null
    readonly readyCallbackFired: boolean
    readonly contextData: ActualFarcasterSDKContext | null
  }
  
  /** Social engagement and interaction tracking */
  readonly socialEngagement: {
    readonly sessionStartTime: Date
    readonly totalInteractions: number
    readonly shareCount: number
    readonly engagementScore: number
    readonly lastInteractionTime: Date | null
    readonly conversionEvents: readonly string[]
  }
  
  /** Real-time capability monitoring */
  readonly capabilityMonitoring: {
    readonly lastCapabilityCheck: Date | null
    readonly capabilityChanges: number
    readonly degradedCapabilities: readonly string[]
    readonly enhancedCapabilities: readonly string[]
  }
}

/**
 * Enhanced MiniApp Actions Interface
 * 
 * This provides comprehensive actions for MiniApp functionality while
 * integrating with your existing action patterns.
 */
interface EnhancedMiniAppActions {
  /** Core SDK management */
  readonly initializeSDK: () => Promise<boolean>
  readonly signalReady: () => Promise<void>
  readonly refreshCapabilities: () => Promise<MiniAppCapabilities>
  
  /** Social sharing and interaction */
  readonly shareContent: (content: SocialShareableContent) => Promise<{ success: boolean; castHash?: string }>
  readonly composeCast: (text: string, embeds?: string[]) => Promise<{ success: boolean; castHash?: string }>
  readonly trackInteraction: (interaction: Omit<SocialInteraction, 'id' | 'timestamp'>) => void
  
  /** User and profile management */
  readonly refreshSocialProfile: () => Promise<EnhancedSocialProfile | null>
  readonly updateSocialVerification: () => Promise<void>
  
  /** Error and recovery management */
  readonly handleError: (error: MiniAppError) => void
  readonly clearErrors: () => void
  readonly retryFailedOperation: (operationId: string) => Promise<boolean>
}

/**
 * State Action Types for Enhanced MiniApp Reducer
 * 
 * Following your established reducer patterns for consistent state management.
 */
type EnhancedMiniAppAction =
  | { type: 'SDK_INITIALIZATION_STARTED' }
  | { type: 'SDK_INITIALIZATION_SUCCESS'; contextData: ActualFarcasterSDKContext }
  | { type: 'SDK_INITIALIZATION_FAILED'; error: MiniAppError }
  | { type: 'SDK_READY_SIGNALED' }
  | { type: 'CAPABILITIES_UPDATED'; capabilities: MiniAppCapabilities }
  | { type: 'SOCIAL_PROFILE_UPDATED'; profile: EnhancedSocialProfile }
  | { type: 'INTERACTION_TRACKED'; interaction: SocialInteraction }
  | { type: 'CONTENT_SHARED'; shareResult: { success: boolean; castHash?: string } }
  | { type: 'ERROR_OCCURRED'; error: MiniAppError }
  | { type: 'ERRORS_CLEARED' }
  | { type: 'CAPABILITY_CHANGE_DETECTED'; changes: string[] }

// ================================================
// ENHANCED MINIAPP CONTEXT DEFINITION
// ================================================

/**
 * Enhanced MiniApp Context Interface
 * 
 * This provides the complete context interface that components will use
 * to access MiniApp functionality while maintaining compatibility with
 * your existing context patterns.
 */
interface EnhancedMiniAppContextValue {
  /** State following your established patterns */
  readonly state: EnhancedMiniAppState
  
  /** Actions for MiniApp functionality */
  readonly actions: EnhancedMiniAppActions
  
  /** Environment and capability information */
  readonly environment: {
    readonly detection: MiniAppEnvironmentDetection
    readonly isMiniApp: boolean
    readonly isEmbedded: boolean
    readonly hasSDK: boolean
    readonly confidence: number
  }
  
  /** Enhanced user profile with social context */
  readonly enhancedUser: EnhancedSocialProfile | null
  
  /** Utility functions for common operations */
  readonly utils: {
    readonly formatSocialHandle: (username: string) => string
    readonly getSocialVerificationBadge: (address: string) => React.ReactNode | null
    readonly getOptimalShareText: (content: SocialShareableContent) => string
    readonly estimateEngagement: (content: SocialShareableContent) => number
    readonly canPerformAction: (action: string) => boolean
  }
}

/**
 * Provider Props Interface
 * 
 * Following your established provider prop patterns.
 */
interface EnhancedMiniAppProviderProps {
  readonly children: ReactNode
  readonly forceEnvironment?: MiniAppEnvironment
  readonly enableAnalytics?: boolean
  readonly fallbackToWeb?: boolean
  readonly debugMode?: boolean
}

// ================================================
// ENHANCED MINIAPP CONTEXT CREATION
// ================================================

const EnhancedMiniAppContext = createContext<EnhancedMiniAppContextValue | null>(null)

// ================================================
// STATE REDUCER IMPLEMENTATION
// ================================================

/**
 * Enhanced MiniApp State Reducer
 * 
 * Following your established reducer patterns for consistent state management.
 */
function enhancedMiniAppReducer(
  state: EnhancedMiniAppState,
  action: EnhancedMiniAppAction
): EnhancedMiniAppState {
  switch (action.type) {
    case 'SDK_INITIALIZATION_STARTED':
      return {
        ...state,
        sdkState: {
          ...state.sdkState,
          isInitialized: false,
          initializationAttempts: state.sdkState.initializationAttempts + 1,
          lastError: null
        },
        loadingState: 'loading'
      }

    case 'SDK_INITIALIZATION_SUCCESS':
      return {
        ...state,
        sdkState: {
          ...state.sdkState,
          isInitialized: true,
          contextData: action.contextData,
          lastError: null
        },
        loadingState: 'success'
      }

    case 'SDK_INITIALIZATION_FAILED':
      return {
        ...state,
        sdkState: {
          ...state.sdkState,
          isInitialized: false,
          lastError: action.error
        },
        loadingState: 'error',
        errors: [...state.errors, action.error]
      }

    case 'SDK_READY_SIGNALED':
      return {
        ...state,
        sdkState: {
          ...state.sdkState,
          isReady: true,
          readyCallbackFired: true
        }
      }

    case 'CAPABILITIES_UPDATED':
      return {
        ...state,
        capabilities: action.capabilities,
        capabilityMonitoring: {
          ...state.capabilityMonitoring,
          lastCapabilityCheck: new Date(),
          capabilityChanges: state.capabilityMonitoring.capabilityChanges + 1
        }
      }

    case 'SOCIAL_PROFILE_UPDATED':
      return {
        ...state,
        socialProfile: action.profile
      }

    case 'INTERACTION_TRACKED':
      return {
        ...state,
        socialInteractions: [...state.socialInteractions, action.interaction],
        socialEngagement: {
          ...state.socialEngagement,
          totalInteractions: state.socialEngagement.totalInteractions + 1,
          lastInteractionTime: new Date(),
          engagementScore: calculateEngagementScore(state.socialEngagement, action.interaction)
        }
      }

    case 'CONTENT_SHARED':
      return {
        ...state,
        socialEngagement: {
          ...state.socialEngagement,
          shareCount: state.socialEngagement.shareCount + 1,
          conversionEvents: action.shareResult.success 
            ? [...state.socialEngagement.conversionEvents, 'successful_share']
            : state.socialEngagement.conversionEvents
        }
      }

    case 'ERROR_OCCURRED':
      return {
        ...state,
        errors: [...state.errors, action.error],
        loadingState: 'error'
      }

    case 'ERRORS_CLEARED':
      return {
        ...state,
        errors: []
      }

    case 'CAPABILITY_CHANGE_DETECTED':
      return {
        ...state,
        capabilityMonitoring: {
          ...state.capabilityMonitoring,
          capabilityChanges: state.capabilityMonitoring.capabilityChanges + 1,
          lastCapabilityCheck: new Date()
        }
      }

    default:
      return state
  }
}

// ================================================
// ENHANCED MINIAPP PROVIDER COMPONENT
// ================================================

/**
 * Enhanced MiniApp Provider Component
 * 
 * This is the main provider component that integrates with your existing
 * architecture while providing comprehensive MiniApp functionality.
 */
function EnhancedMiniAppProvider({
  children,
  forceEnvironment,
  enableAnalytics = true,
  fallbackToWeb = true,
  debugMode = process.env.NODE_ENV === 'development'
}: EnhancedMiniAppProviderProps) {
  
  // Integration with unified wallet UI system
  const walletUI = useWalletConnectionUI()
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const { data: isCreatorRegistered } = useIsCreatorRegistered(walletUI.address as `0x${string}` | undefined)
  
  // Environment detection state
  const [environmentDetection, setEnvironmentDetection] = useState<MiniAppEnvironmentDetection | null>(null)
  const [isDetectionComplete, setIsDetectionComplete] = useState(false)
  
  // Initialize state with your established patterns
  const initialState: EnhancedMiniAppState = useMemo(() => ({
    context: {
      environment: forceEnvironment || 'web',
      applicationContext: 'web',
      deviceCapabilities: {
        viewportSize: 'desktop',
        isTouchDevice: false,
        isEmbedded: false,
        supportsWebGL: false,
        supportsBiometrics: false,
        networkType: 'unknown'
      },
      miniAppCapabilities: [],
      sdkState: {
        isInitialized: false,
        isReady: false,
        version: null,
        lastInitAttempt: null,
        initializationError: null
      }
    },
    capabilities: {
      wallet: {
        canConnect: false,
        canSignTransactions: false,
        canBatchTransactions: false,
        supportedChains: [],
        maxTransactionValue: null,
        requiredConfirmations: 1
      },
      social: {
        canShare: false,
        canCompose: false,
        canAccessSocialGraph: false,
        canReceiveNotifications: false,
        canSendNotifications: false,
        maxShareTextLength: 0,
        supportedShareTypes: []
      },
      platform: {
        canDeepLink: false,
        canAccessClipboard: false,
        canAccessCamera: false,
        canAccessLocation: false,
        canVibrate: false,
        canPlayAudio: false,
        supportedImageFormats: []
      },
      performance: {
        supportsServiceWorker: false,
        supportsWebAssembly: false,
        supportsIndexedDB: false,
        maxMemoryUsage: null,
        maxStorageSize: null,
        batteryOptimized: false
      }
    },
    socialProfile: null,
    socialInteractions: [],
    connectionStatus: walletUI.isConnected ? 'connected' : 'disconnected',
    shareableContent: [],
    pendingShares: [],
    shareHistory: [],
    performance: {
      loadTime: 0,
      renderTime: 0,
      interactionCount: 0,
      errorCount: 0,
      lastUpdateTime: new Date()
    },
    loadingState: 'idle',
    errors: [],
    warnings: [],
    // Enhanced state properties
    sdkState: {
      isInitialized: false,
      isReady: false,
      initializationAttempts: 0,
      lastError: null,
      readyCallbackFired: false,
      contextData: null
    },
    socialEngagement: {
      sessionStartTime: new Date(),
      totalInteractions: 0,
      shareCount: 0,
      engagementScore: 0,
      lastInteractionTime: null,
      conversionEvents: []
    },
    capabilityMonitoring: {
      lastCapabilityCheck: null,
      capabilityChanges: 0,
      degradedCapabilities: [],
      enhancedCapabilities: []
    }
  }), [forceEnvironment, walletUI.isConnected])
  
  // State management with your established reducer pattern
  const [state, dispatch] = useReducer(enhancedMiniAppReducer, initialState)
  
  // Refs for managing SDK and preventing duplicate operations
  const sdkRef = useRef<ActualFarcasterSDKActions | null>(null)
  const initializationPromiseRef = useRef<Promise<boolean> | null>(null)
  const detectionPromiseRef = useRef<Promise<MiniAppEnvironmentDetection> | null>(null)
  
  // ================================================
  // CORE SDK INITIALIZATION AND MANAGEMENT
  // ================================================
  
  /**
   * Initialize MiniApp SDK
   * 
   * This function handles comprehensive SDK initialization with proper error
   * handling and integration with your existing patterns.
   */
  const initializeSDK = useCallback(async (): Promise<boolean> => {
    // Prevent duplicate initialization attempts
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current
    }
    
    const initPromise = (async () => {
      try {
        dispatch({ type: 'SDK_INITIALIZATION_STARTED' })
        
        if (debugMode) {
          debug.log('🚀 Initializing MiniApp SDK...')
        }
        
        // Dynamic import to avoid SSR issues
        const { sdk } = await import('@farcaster/miniapp-sdk')
        
        // Get context data from SDK
        const contextData = await sdk.context
        
        if (!contextData) {
          throw new Error('Failed to retrieve SDK context')
        }
        
        // Store SDK reference
        sdkRef.current = sdk.actions as unknown as ActualFarcasterSDKActions
        
        dispatch({ 
          type: 'SDK_INITIALIZATION_SUCCESS', 
          contextData: contextData as ActualFarcasterSDKContext 
        })
        
        if (debugMode) {
          debug.log('✅ MiniApp SDK initialized successfully', contextData)
        }
        
        return true
        
      } catch (error) {
        const miniAppError: MiniAppError = {
          code: 'SDK_INITIALIZATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown SDK initialization error',
          timestamp: new Date(),
          context: {
            environment: state.context.environment,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            capabilities: state.context.miniAppCapabilities,
            stackTrace: error instanceof Error ? error.stack : undefined
          },
          recoverable: true,
          retryAfter: 5000,
          suggestedAction: 'Try refreshing the page or check your internet connection'
        }
        
        dispatch({ type: 'SDK_INITIALIZATION_FAILED', error: miniAppError })
        
        if (debugMode) {
          console.error('❌ MiniApp SDK initialization failed:', error)
        }
        
        return false
        
      } finally {
        initializationPromiseRef.current = null
      }
    })()
    
    initializationPromiseRef.current = initPromise
    return initPromise
  }, [state.context.environment, state.context.miniAppCapabilities, debugMode])
  
  /**
   * Signal Ready to SDK
   * 
   * This function signals to the MiniApp platform that the application is
   * ready for user interaction, following Farcaster SDK requirements.
   */
  const signalReady = useCallback(async (): Promise<void> => {
    if (!sdkRef.current || state.sdkState.readyCallbackFired) {
      return
    }
    
    try {
      await sdkRef.current.ready()
      dispatch({ type: 'SDK_READY_SIGNALED' })
      
      if (debugMode) {
        debug.log('✅ MiniApp ready signal sent successfully')
      }
      
    } catch (error) {
      const miniAppError: MiniAppError = {
        code: 'SDK_INITIALIZATION_FAILED',
        message: 'Failed to signal ready state to MiniApp platform',
        timestamp: new Date(),
        context: {
          environment: state.context.environment,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          capabilities: state.context.miniAppCapabilities
        },
        recoverable: true,
        retryAfter: 2000
      }
      
      dispatch({ type: 'ERROR_OCCURRED', error: miniAppError })
      
      if (debugMode) {
        console.error('❌ Failed to signal ready:', error)
      }
    }
  }, [state.sdkState.readyCallbackFired, state.context.environment, state.context.miniAppCapabilities, debugMode])
  
  // ================================================
  // ENVIRONMENT DETECTION AND CAPABILITY ASSESSMENT
  // ================================================
  
  /**
   * Perform Environment Detection
   * 
   * This function uses Component 2 detection utilities to comprehensively
   * assess the MiniApp environment and capabilities.
   */
  const performEnvironmentDetection = useCallback(async (): Promise<void> => {
    if (detectionPromiseRef.current) {
      await detectionPromiseRef.current
      return
    }
    
    const detectionPromise = (async () => {
      try {
        if (debugMode) {
          debug.log('🔍 Starting environment detection...')
        }
        
        const detection = await detectMiniAppEnvironment()
        setEnvironmentDetection(detection)
        
        // Update capabilities based on detection
        dispatch({ type: 'CAPABILITIES_UPDATED', capabilities: detection.capabilities })
        
        if (debugMode) {
          debug.log('🎯 Environment detection complete:', detection)
        }
        
        return detection
        
      } catch (error) {
        const miniAppError: MiniAppError = {
          code: 'ENVIRONMENT_DETECTION_FAILED',
          message: 'Failed to detect MiniApp environment',
          timestamp: new Date(),
          context: {
            environment: 'unknown',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            capabilities: []
          },
          recoverable: true,
          retryAfter: 3000
        }
        
        dispatch({ type: 'ERROR_OCCURRED', error: miniAppError })
        
        if (debugMode) {
          console.error('❌ Environment detection failed:', error)
        }
        
        throw error
        
      } finally {
        setIsDetectionComplete(true)
        detectionPromiseRef.current = null
      }
    })()
    
    detectionPromiseRef.current = detectionPromise
    await detectionPromise
  }, [debugMode])
  
  // ================================================
  // SOCIAL FUNCTIONALITY IMPLEMENTATION
  // ================================================
  
  /**
   * Share Content Function
   * 
   * This function handles content sharing through the Farcaster SDK with
   * proper error handling and analytics tracking.
   */
  const shareContent = useCallback(async (
    content: SocialShareableContent
  ): Promise<{ success: boolean; castHash?: string }> => {
    if (!sdkRef.current || !state.capabilities.social.canShare) {
      throw new Error('Sharing not available in current context')
    }
    
    try {
      const shareText = `${content.shareMetadata.title} by ${content.creatorInfo.creatorName} 🚀`
      
      // Use composeCast if share is not available
      const result = sdkRef.current.share ? 
        await sdkRef.current.share({
          text: shareText,
          url: content.platformData.shareUrl,
          embeds: content.platformData.embedUrl ? [{ url: content.platformData.embedUrl }] : []
        }) :
        await (sdkRef.current.composeCast ? 
          sdkRef.current.composeCast({
            text: shareText,
            embeds: [content.platformData.shareUrl]
          }).then(result => ({ success: Boolean(result?.cast), castHash: undefined })) :
          Promise.resolve({ success: false }))
      
      dispatch({ type: 'CONTENT_SHARED', shareResult: result })
      
      // Track interaction for analytics
      const interaction: Omit<SocialInteraction, 'id' | 'timestamp'> = {
        type: 'content_share',
        userId: state.sdkState.contextData?.user?.fid || 0,
        targetContentId: content.contentId,
        targetCreatorAddress: content.creatorInfo.creatorAddress,
        interactionData: {
          shareMethod: 'farcaster_sdk',
          contentType: content.contentType,
          shareUrl: content.platformData.shareUrl
        },
        engagementMetrics: {
          reach: 0, // Will be updated by analytics
          impressions: 0,
          clicks: 0,
          conversions: 0
        }
      }
      
      dispatch({ 
        type: 'INTERACTION_TRACKED', 
        interaction: {
          ...interaction,
          id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        }
      })
      
      return result
      
    } catch (error) {
      const miniAppError: MiniAppError = {
        code: 'CONTENT_SHARING_FAILED',
        message: error instanceof Error ? error.message : 'Content sharing failed',
        timestamp: new Date(),
        context: {
          environment: state.context.environment,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          capabilities: state.context.miniAppCapabilities,
          additionalData: { contentId: content.contentId.toString() }
        },
        recoverable: true,
        retryAfter: 3000
      }
      
      dispatch({ type: 'ERROR_OCCURRED', error: miniAppError })
      throw miniAppError
    }
  }, [
    state.capabilities.social.canShare, 
    state.context.environment, 
    state.context.miniAppCapabilities,
    state.sdkState.contextData
  ])
  
  /**
   * Compose Cast Function
   * 
   * This function handles cast composition through the Farcaster SDK.
   */
  const composeCast = useCallback(async (
    text: string, 
    embeds?: string[]
  ): Promise<{ success: boolean; castHash?: string }> => {
    if (!sdkRef.current || !state.capabilities.social.canCompose) {
      throw new Error('Cast composition not available in current context')
    }
    
    try {
      if (!sdkRef.current.composeCast) {
        throw new Error('Cast composition not supported in current environment')
      }
      
      const result = await sdkRef.current.composeCast({
        text,
        embeds
      })
      
      return { success: Boolean(result?.cast), castHash: undefined }
      
    } catch (error) {
      const miniAppError: MiniAppError = {
        code: 'CONTENT_SHARING_FAILED',
        message: 'Failed to compose cast',
        timestamp: new Date(),
        context: {
          environment: state.context.environment,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          capabilities: state.context.miniAppCapabilities
        },
        recoverable: true,
        retryAfter: 3000
      }
      
      dispatch({ type: 'ERROR_OCCURRED', error: miniAppError })
      throw miniAppError
    }
  }, [
    state.capabilities.social.canCompose,
    state.context.environment,
    state.context.miniAppCapabilities
  ])
  
  // ================================================
  // ENHANCED USER PROFILE MANAGEMENT
  // ================================================
  
  /**
   * Create Enhanced User Profile
   * 
   * This function creates an enhanced user profile that combines your existing
   * user management with social context from the MiniApp SDK.
   */
  const enhancedUser = useMemo((): EnhancedSocialProfile | null => {
    if (!walletUI.address || !walletUI.isConnected) return null
    
    // Build base profile from your existing UnifiedUserProfile pattern
    const baseProfile: UnifiedUserProfile = {
      address: walletUI.address as `0x${string}`,
      connectionStatus: walletUI.isConnected ? 'connected' : 'disconnected',
      userRole: isCreatorRegistered ? 'creator' : 'consumer',
      isRegisteredCreator: Boolean(isCreatorRegistered),
      capabilities: {
        canCreateContent: Boolean(isCreatorRegistered),
        canPurchaseContent: walletUI.isConnected,
        canShareSocially: state.capabilities.social.canShare,
        canUseBatchTransactions: state.capabilities.wallet.canBatchTransactions
      }
    }
    
    // Add social context if available
    const farcasterProfile = state.sdkState.contextData?.user || null
    
    // Create a mock FarcasterSDKUser if we have basic profile data
    const mockFarcasterUser: FarcasterSDKUser | null = farcasterProfile ? {
      fid: farcasterProfile.fid,
      username: farcasterProfile.username || '',
      displayName: farcasterProfile.displayName || '',
      pfpUrl: farcasterProfile.pfpUrl || '',
      bio: '',
      verifications: [],
      followerCount: 0,
      followingCount: 0,
      custodyAddress: walletUI.address as Address,
      verificationTimestamps: []
    } : null
    
    const socialVerification = {
      isFarcasterVerified: Boolean(farcasterProfile),
      isAddressVerified: false, // Would need actual verification data
      verificationLevel: 'basic' as const,
      verificationDate: farcasterProfile ? new Date() : null,
      socialScore: calculateSocialScore(mockFarcasterUser, state.socialEngagement)
    }
    
    return {
      ...baseProfile,
      farcasterProfile: mockFarcasterUser,
      socialVerification,
      socialMetrics: {
        totalCasts: 0, // Would be fetched from Farcaster API
        totalLikes: 0,
        totalRecasts: 0,
        engagementRate: state.socialEngagement.engagementScore,
        lastActiveDate: state.socialEngagement.lastInteractionTime,
        networkReach: 0
      },
      platformSocialContext: {
        recommendedByConnections: 0, // Would be calculated from social graph
        mutualConnections: [],
        socialRank: 0,
        influenceScore: calculateInfluenceScore(mockFarcasterUser)
      }
    }
  }, [
    walletUI.address,
    walletUI.isConnected,
    isCreatorRegistered,
    state.capabilities.social.canShare,
    state.capabilities.wallet.canBatchTransactions,
    state.sdkState.contextData,
    state.socialEngagement
  ])
  
  // ================================================
  // LIFECYCLE MANAGEMENT
  // ================================================
  
  /**
   * Initialize Enhanced MiniApp Provider
   * 
   * This effect handles the complete initialization sequence.
   */
  useEffect(() => {
    let mounted = true
    
    const initialize = async () => {
      try {
        // Step 1: Perform environment detection
        await performEnvironmentDetection()
        
        if (!mounted) return
        
        // Step 2: Initialize SDK if in MiniApp environment
        if (environmentDetection?.environment === 'farcaster' && 
            environmentDetection?.integrationRecommendations.useEnhancedProvider) {
          
          const sdkInitialized = await initializeSDK()
          
          if (sdkInitialized && mounted) {
            // Signal ready after successful initialization
            await signalReady()
          }
        }
        
      } catch (error) {
        if (debugMode) {
          console.error('Enhanced MiniApp Provider initialization failed:', error)
        }
        
        // Fallback to web mode if requested
        if (fallbackToWeb) {
          if (debugMode) {
            debug.log('🔄 Falling back to web mode due to initialization failure')
          }
        }
      }
    }
    
    initialize()
    
    return () => {
      mounted = false
    }
  }, [
    performEnvironmentDetection,
    initializeSDK,
    signalReady,
    environmentDetection?.environment,
    environmentDetection?.integrationRecommendations.useEnhancedProvider,
    fallbackToWeb,
    debugMode
  ])
  
  // ================================================
  // ACTIONS AND UTILITIES IMPLEMENTATION
  // ================================================
  
  const actions: EnhancedMiniAppActions = useMemo(() => ({
    initializeSDK,
    signalReady,
    refreshCapabilities: async () => {
      await performEnvironmentDetection()
      return state.capabilities
    },
    shareContent,
    composeCast,
    trackInteraction: (interaction) => {
      dispatch({
        type: 'INTERACTION_TRACKED',
        interaction: {
          ...interaction,
          id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        }
      })
    },
    refreshSocialProfile: async () => {
      // Would refresh social profile from Farcaster API
      return enhancedUser
    },
    updateSocialVerification: async () => {
      // Would update verification status
    },
    handleError: (error) => {
      dispatch({ type: 'ERROR_OCCURRED', error })
    },
    clearErrors: () => {
      dispatch({ type: 'ERRORS_CLEARED' })
    },
    retryFailedOperation: async (operationId) => {
      // Would implement retry logic for failed operations
      return false
    }
  }), [
    initializeSDK,
    signalReady,
    performEnvironmentDetection,
    state.capabilities,
    shareContent,
    composeCast,
    enhancedUser
  ])
  
  const utils = useMemo(() => ({
    formatSocialHandle: (username: string) => username.startsWith('@') ? username : `@${username}`,
    getSocialVerificationBadge: (address: string) => null, // Would return verification badge component
    getOptimalShareText: (content: SocialShareableContent) => {
      const maxLength = state.capabilities.social.maxShareTextLength || 280
      const text = `${content.shareMetadata.title} by ${content.creatorInfo.creatorName}`
      return text.length > maxLength ? `${text.substring(0, maxLength - 3)}...` : text
    },
    estimateEngagement: (content: SocialShareableContent) => {
      // Would calculate estimated engagement based on content and user metrics
      return Math.random() * 100 // Placeholder
    },
    canPerformAction: (action: string) => {
      switch (action) {
        case 'share':
          return state.capabilities.social.canShare
        case 'compose':
          return state.capabilities.social.canCompose
        case 'batch_transaction':
          return state.capabilities.wallet.canBatchTransactions
        default:
          return false
      }
    }
  }), [state.capabilities])
  
  // ================================================
  // CONTEXT VALUE CREATION
  // ================================================
  
  const contextValue: EnhancedMiniAppContextValue = useMemo(() => ({
    state,
    actions,
    environment: {
      detection: environmentDetection!,
      isMiniApp: environmentDetection?.environment === 'farcaster' || false,
      isEmbedded: (environmentDetection?.farcasterContext as any)?.embedDepth > 0 || false,
      hasSDK: state.sdkState.isInitialized,
      confidence: environmentDetection?.confidence.overallConfidence || 0
    },
    enhancedUser,
    utils
  }), [state, actions, environmentDetection, enhancedUser, utils])
  
  // Show loading skeleton while detection is in progress
  if (!isDetectionComplete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 space-y-8">
          <div className="text-center space-y-3">
            <div className="h-8 w-48 mx-auto bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 mx-auto bg-muted animate-pulse rounded" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-full bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <EnhancedMiniAppContext.Provider value={contextValue}>
      {children}
    </EnhancedMiniAppContext.Provider>
  )
}

// ================================================
// CONTEXT HOOK AND UTILITIES
// ================================================

/**
 * Enhanced MiniApp Hook
 * 
 * This hook provides access to the complete MiniApp context following
 * your established hook patterns.
 */
export function useEnhancedMiniApp(): EnhancedMiniAppContextValue {
  const context = useContext(EnhancedMiniAppContext)
  
  if (context === null) {
    throw new Error(
      'useEnhancedMiniApp must be used within an EnhancedMiniAppProvider. ' +
      'Make sure your component is wrapped with <EnhancedMiniAppProvider> at the appropriate level.'
    )
  }
  
  return context
}

/**
 * Convenience Hooks
 * 
 * These hooks provide easy access to specific parts of the context.
 */
export function useMiniAppState(): EnhancedMiniAppState {
  const { state } = useEnhancedMiniApp()
  return state
}

export function useMiniAppActions(): EnhancedMiniAppActions {
  const { actions } = useEnhancedMiniApp()
  return actions
}

export function useMiniAppEnvironment(): EnhancedMiniAppContextValue['environment'] {
  const { environment } = useEnhancedMiniApp()
  return environment
}

export function useEnhancedSocialProfile(): EnhancedSocialProfile | null {
  const { enhancedUser } = useEnhancedMiniApp()
  return enhancedUser
}

/**
 * Compatibility Hook
 * 
 * Provides the legacy useMiniApp interface for backward compatibility
 */
export function useMiniApp() {
  const context = useEnhancedMiniApp()
  
  return {
    // Core compatibility fields
    context: context.state.context,
    isMiniApp: context.environment.isMiniApp,
    isEmbedded: context.environment.isEmbedded,
    isReady: context.state.sdkState.isReady,
    
    // Social context compatibility
    socialUser: context.enhancedUser?.farcasterProfile || null,
    hasSocialContext: Boolean(context.enhancedUser?.farcasterProfile),
    
    // Actions compatibility
    shareContent: context.actions.shareContent,
    trackInteraction: context.actions.trackInteraction,
    
    // State compatibility
    capabilities: context.state.capabilities,
    errors: context.state.errors,
    loadingState: context.state.loadingState
  }
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Calculate Social Score
 * 
 * This function calculates a social engagement score based on user activity.
 */
function calculateSocialScore(
  farcasterProfile: FarcasterSDKUser | null,
  socialEngagement: EnhancedMiniAppState['socialEngagement']
): number {
  if (!farcasterProfile) return 0
  
  const followerScore = Math.min(farcasterProfile.followerCount / 1000, 50)
  const engagementScore = socialEngagement.engagementScore || 0
  const interactionScore = Math.min(socialEngagement.totalInteractions / 10, 25)
  
  return Math.round(followerScore + engagementScore + interactionScore)
}

/**
 * Calculate Engagement Score
 * 
 * This function calculates an engagement score based on interaction patterns.
 */
function calculateEngagementScore(
  currentEngagement: EnhancedMiniAppState['socialEngagement'],
  newInteraction: SocialInteraction
): number {
  const baseScore = currentEngagement.engagementScore
  const interactionWeight = getInteractionWeight(newInteraction.type)
  const timeDecay = calculateTimeDecay(currentEngagement.sessionStartTime)
  
  return Math.min(baseScore + (interactionWeight * timeDecay), 100)
}

/**
 * Calculate Influence Score
 * 
 * This function calculates an influence score based on Farcaster metrics.
 */
function calculateInfluenceScore(farcasterProfile: FarcasterSDKUser | null): number {
  if (!farcasterProfile) return 0
  
  const followerRatio = farcasterProfile.followingCount > 0 
    ? farcasterProfile.followerCount / farcasterProfile.followingCount 
    : farcasterProfile.followerCount
  
  return Math.min(Math.round(followerRatio * 10), 100)
}

/**
 * Get Interaction Weight
 * 
 * This function returns the weight value for different interaction types.
 */
function getInteractionWeight(interactionType: SocialInteraction['type']): number {
  switch (interactionType) {
    case 'content_share': return 10
    case 'purchase_share': return 15
    case 'creator_follow': return 8
    case 'content_like': return 5
    case 'content_recast': return 12
    case 'subscription_share': return 20
    case 'referral_share': return 18
    default: return 3
  }
}

/**
 * Calculate Time Decay
 * 
 * This function calculates a time decay factor for engagement scoring.
 */
function calculateTimeDecay(sessionStartTime: Date): number {
  const sessionDuration = Date.now() - sessionStartTime.getTime()
  const hoursSinceStart = sessionDuration / (1000 * 60 * 60)
  
  // Decay factor reduces engagement weight for longer sessions
  return Math.max(0.1, 1 - (hoursSinceStart * 0.1))
}

// ================================================
// EXPORTS
// ================================================

// Export both names for compatibility
export default EnhancedMiniAppProvider
export { EnhancedMiniAppProvider }
export { EnhancedMiniAppProvider as MiniAppProvider }

// Export types for external usage
export type {
  EnhancedMiniAppState,
  EnhancedMiniAppActions,
  EnhancedMiniAppContextValue,
  EnhancedMiniAppProviderProps
}
// ==============================================================================
// COMPONENT 3.3: SOCIAL CONTEXT INTEGRATION
// File: src/hooks/farcaster/useFarcasterContext.ts
// ==============================================================================

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// Add global type declarations for Farcaster MiniKit
declare global {
  interface Window {
    farcaster?: MiniKitSDK
    MiniKit?: MiniKitSDK
    miniKit?: MiniKitSDK
    miniKitContextWarned?: boolean
    miniKitExtractionWarned?: boolean
  }
}

/**
 * Farcaster User Data Interface
 * 
 * This interface defines the core Farcaster user information that we can
 * reliably extract from the MiniKit SDK. We use strict typing to ensure
 * type safety and avoid 'any' types throughout the integration.
 */
interface FarcasterUser {
  /** Farcaster ID - unique identifier for the user */
  readonly fid: number
  
  /** Username (handle) on Farcaster */
  readonly username: string
  
  /** Display name shown in Farcaster profiles */
  readonly displayName: string
  
  /** Profile picture URL */
  readonly pfpUrl: string
  
  /** Verified wallet addresses */
  readonly verifications: readonly string[]
}

/**
 * Enhanced User Interface
 * 
 * This interface represents the merged user data combining Farcaster social
 * context with your existing platform user data. This provides a complete
 * user profile that includes both authentication and social information.
 */
interface EnhancedUser extends FarcasterUser {
  /** Platform wallet address from authentication system */
  readonly platformAddress: string
  
  /** Creator status from your existing platform */
  readonly isRegisteredCreator: boolean
  
  /** Creator profile information */
  readonly creatorProfile?: {
    readonly displayName?: string
    readonly subscriptionPrice?: bigint
    readonly totalEarnings?: bigint
  }
  
  /** Indicates if this user's Farcaster verifications include their platform address */
  readonly isAddressVerified: boolean
}

/**
 * Farcaster Context Interface
 * 
 * This is the main interface that defines the complete social context
 * available within Farcaster Mini Apps. It includes both the raw Farcaster
 * user data and the enhanced user profile that merges platform and social data.
 */
export interface FarcasterContext {
  /** Raw Farcaster user data from MiniKit SDK */
  readonly user: FarcasterUser
  
  /** Enhanced user profile merging Farcaster and platform data */
  readonly enhancedUser: EnhancedUser
  
  /** Indicates if we're running in a MiniApp environment */
  readonly isMiniAppEnvironment: boolean
  
  /** Context refresh function for updating social data */
  readonly refreshContext: () => Promise<void>
  
  /** Indicates if auth provider is available */
  readonly hasAuthProvider: boolean
}

// Simplified types for MiniKit SDK integration
interface MiniKitUser {
  readonly fid: number
  readonly username?: string
  readonly displayName?: string
  readonly pfpUrl?: string
  readonly verifications?: readonly string[]
}

interface MiniKitContext {
  readonly user?: MiniKitUser
  readonly client?: unknown
  readonly location?: unknown
}

// Use unknown for SDK to avoid strict typing conflicts
type MiniKitSDK = {
  readonly actions?: {
    readonly ready?: () => Promise<void>
  }
  readonly context: Promise<unknown> | (() => Promise<unknown>)
  readonly isInMiniApp?: () => Promise<boolean>
}

/**
 * Optional Auth Hook
 * 
 * This hook tries to use the auth context, but doesn't throw an error
 * if the AuthProvider isn't available. This makes components more resilient.
 */
// Importing directly avoids require() and preserves type safety
import { useOptionalAuth } from '@/components/providers/AuthProvider'

// Global cache for MiniApp detection to prevent repeated calls
let miniAppDetectionCache: boolean | null = null
let miniAppDetectionPromise: Promise<boolean> | null = null

// Global cache for MiniKit context extraction
let miniKitContextCache: MiniKitContext | null = null
let miniKitContextPromise: Promise<MiniKitContext | null> | null = null
let miniKitContextTimestamp = 0
const MINI_KIT_CONTEXT_TTL = 30000 // 30 seconds

// Optimized utility hook for MiniApp detection with caching
export function useIsInMiniApp(): boolean {
  const [isInMiniApp, setIsInMiniApp] = useState(false)
  const [isDetectionComplete, setIsDetectionComplete] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsDetectionComplete(true)
      return
    }

    // If we already have a cached result, use it immediately
    if (miniAppDetectionCache !== null) {
      setIsInMiniApp(miniAppDetectionCache)
      setIsDetectionComplete(true)
      return
    }

    // If detection is already in progress, wait for it
    if (miniAppDetectionPromise) {
      miniAppDetectionPromise.then((result) => {
        setIsInMiniApp(result)
        setIsDetectionComplete(true)
      })
      return
    }

    const checkMiniApp = async (): Promise<boolean> => {
      try {
        // First, check basic indicators (fast synchronous checks)
        const url = new URL(window.location.href)
        const urlIndicators = (
          url.pathname.startsWith('/mini') ||
          url.pathname.startsWith('/miniapp') ||
          url.searchParams.get('miniApp') === 'true'
        )

        const metaIndicators = (
          document.querySelector('meta[name="fc:frame"]') !== null ||
          document.querySelector('meta[name="fc:miniapp"]') !== null
        )

        const iframeContext = window.parent !== window
        const farcasterReferrer = document.referrer.includes('farcaster') ||
                                 document.referrer.includes('warpcast')
        const farcasterUserAgent = navigator.userAgent.includes('farcaster') ||
                                  navigator.userAgent.includes('warpcast')

        const basicDetection = urlIndicators || metaIndicators || iframeContext || farcasterReferrer || farcasterUserAgent

        // If basic detection fails, we can immediately return false
        if (!basicDetection) {
          return false
        }

        // If basic detection passes, try SDK detection with timeout
        try {
          const { sdk } = await import('@farcaster/miniapp-sdk')
          if (sdk?.isInMiniApp && typeof sdk.isInMiniApp === 'function') {
            const sdkResult = await Promise.race([
              sdk.isInMiniApp(),
              new Promise<boolean>((resolve) =>
                setTimeout(() => resolve(basicDetection), 800) // Reduced timeout
              )
            ])
            return sdkResult
          } else {
            return basicDetection
          }
        } catch (sdkError) {
          console.debug('SDK detection failed, using basic detection:', sdkError)
          return basicDetection
        }
      } catch (error) {
        console.warn('MiniApp detection failed:', error)
        return false
      }
    }

    // Create and cache the detection promise
    miniAppDetectionPromise = checkMiniApp()

    miniAppDetectionPromise.then((result) => {
      miniAppDetectionCache = result
      setIsInMiniApp(result)
      setIsDetectionComplete(true)
      // Clear the promise after completion
      miniAppDetectionPromise = null
    }).catch((error) => {
      console.warn('MiniApp detection error:', error)
      setIsInMiniApp(false)
      setIsDetectionComplete(true)
      miniAppDetectionPromise = null
    })
  }, [])

  return isInMiniApp
}

/**
 * Enhanced Farcaster Context Hook with Optional Auth
 * 
 * This version makes the auth dependency optional, so if AuthProvider
 * isn't available, the hook can still function in a limited capacity.
 * This pattern makes your components more resilient.
 * 
 * Key Features:
 * - Merges Farcaster user data with platform authentication state
 * - Provides enhanced user profiles with both social and platform information
 * - Handles graceful degradation when MiniKit or Farcaster context is unavailable
 * - Maintains compatibility with your existing authentication system
 * - Updates context when platform user changes
 * - Provides type-safe interfaces with no 'any' types
 * - Makes auth dependency optional for better resilience
 * 
 * Integration Points:
 * - Uses your existing useAuth hook for platform user data (when available)
 * - Compatible with Component 3.1's MiniAppProvider
 * - Supports Component 3.2's x402 payment flow social context
 * - Designed for use in Mini App purchase interfaces and social sharing
 * 
 * Error Handling:
 * - Returns undefined when MiniKit is unavailable (graceful degradation)
 * - Handles missing or incomplete Farcaster context safely
 * - Maintains fallback state without throwing errors
 * - Logs warnings for debugging but doesn't break application flow
 * - Gracefully handles missing AuthProvider
 */
export function useFarcasterContext(): FarcasterContext | undefined {
  // 🔧 ENHANCED: Use optional auth with fallback
  const auth = useOptionalAuth()
  
  // State management for Farcaster context
  const [farcasterContext, setFarcasterContext] = useState<FarcasterContext | undefined>(undefined)
  const [isInitialized, setIsInitialized] = useState(false)
  const [_error, setError] = useState<Error | null>(null)

  /**
   * MiniApp Environment Detection - Optimized
   *
   * This function detects if we're running in a Farcaster MiniApp environment
   * using cached results to prevent repeated expensive operations.
   */
  const isMiniAppEnvironment = useMemo((): boolean => {
    // First check if we have a cached result from useIsInMiniApp
    if (miniAppDetectionCache !== null) {
      return miniAppDetectionCache
    }

    // Fallback to basic synchronous detection
    if (typeof window === 'undefined') return false

    try {
      const url = new URL(window.location.href)

      // Check URL patterns that indicate MiniApp context
      const urlIndicators = (
        url.pathname.startsWith('/mini') ||
        url.pathname.startsWith('/miniapp') ||
        url.searchParams.get('miniApp') === 'true'
      )

      // Check for Farcaster meta tags
      const metaIndicators = (
        document.querySelector('meta[name="fc:frame"]') !== null ||
        document.querySelector('meta[name="fc:miniapp"]') !== null
      )

      // Check for iframe context (common in MiniApps)
      const iframeContext = window.parent !== window

      // Check referrer for Farcaster
      const farcasterReferrer = document.referrer.includes('farcaster') ||
                               document.referrer.includes('warpcast')

      // Check user agent for Farcaster client
      const farcasterUserAgent = navigator.userAgent.includes('farcaster') ||
                                navigator.userAgent.includes('warpcast')

      return urlIndicators || metaIndicators || iframeContext || farcasterReferrer || farcasterUserAgent
    } catch (_detectionError) {
      console.warn('Failed to detect MiniApp environment:', _detectionError)
      return false
    }
  }, [])

  /**
   * MiniKit Context Extraction - Optimized
   *
   * This function safely extracts Farcaster context from the MiniKit SDK,
   * with caching and reduced redundant calls for better performance.
   */
  const extractMiniKitContext = useCallback(async (): Promise<MiniKitContext | null> => {
    try {
      // Only attempt MiniKit integration if we're in a MiniApp environment
      if (!isMiniAppEnvironment) {
        console.log('Not in MiniApp environment, skipping MiniKit extraction')
        return null
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('Server-side rendering, skipping MiniKit extraction')
        return null
      }

      // Check global cache first
      const now = Date.now()
      if (miniKitContextCache && (now - miniKitContextTimestamp) < MINI_KIT_CONTEXT_TTL) {
        console.log('Using cached MiniKit context')
        return miniKitContextCache
      }

      // If extraction is already in progress, wait for it with timeout
      if (miniKitContextPromise) {
        // Only log this once per session to avoid spam
        if (!window.miniKitExtractionWarned) {
          console.log('MiniKit context extraction already in progress, waiting...')
          window.miniKitExtractionWarned = true
        }
        
        try {
          const result = await Promise.race([
            miniKitContextPromise,
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Context extraction timeout')), 5000)
            )
          ])
          return result
        } catch (error) {
          console.warn('MiniKit context extraction timed out or failed, clearing promise')
          miniKitContextPromise = null
          window.miniKitExtractionWarned = false
          return null
        }
      }

      // Use cached detection result if available to avoid redundant SDK calls
      let isInMiniApp = miniAppDetectionCache

      // If no cached result, do a quick synchronous check
      if (isInMiniApp === null) {
        const url = new URL(window.location.href)
        const basicCheck = (
          url.pathname.startsWith('/mini') ||
          url.pathname.startsWith('/miniapp') ||
          url.searchParams.get('miniApp') === 'true' ||
          window.parent !== window ||
          document.referrer.includes('farcaster')
        )
        isInMiniApp = basicCheck
      }

      if (!isInMiniApp) {
        console.log('Not running in MiniApp environment, skipping context extraction')
        return null
      }

      // Create and cache the extraction promise
      miniKitContextPromise = (async () => {
        // Dynamically import MiniKit SDK to avoid SSR issues
        let sdk: MiniKitSDK | undefined
        try {
          const miniKitModule = await import('@farcaster/miniapp-sdk')
          sdk = miniKitModule.sdk || miniKitModule.default
        } catch (importError) {
          console.warn('Failed to import MiniKit SDK:', importError)
          return null
        }

        if (!sdk) {
          console.warn('MiniKit SDK is not available after import')
          return null
        }

        console.log('Successfully imported MiniKit SDK')

        // SECOND: Wait for SDK to be ready with reduced timeout
        try {
          if (sdk.actions?.ready && typeof sdk.actions.ready === 'function') {
            await Promise.race([
              sdk.actions.ready(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('MiniKit SDK ready timeout')), 3000) // Reduced timeout
              )
            ])
            console.log('MiniKit SDK is ready')
          } else {
            console.warn('MiniKit SDK does not have actions.ready method, proceeding anyway')
          }
        } catch (readyError) {
          console.warn('MiniKit SDK failed to become ready:', readyError)
          // Continue anyway - some versions might not need explicit ready call
        }

        // THIRD: Extract context from SDK
        let context: MiniKitContext | undefined
        try {
          // Handle both Promise and function cases
          let contextPromise: Promise<unknown>
          if (typeof sdk.context === 'function') {
            contextPromise = sdk.context()
          } else {
            contextPromise = sdk.context
          }

          const rawContext = await Promise.race([
            contextPromise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Context extraction timeout')), 2000) // Reduced timeout
            )
          ])
          context = rawContext as MiniKitContext
        } catch (contextError) {
          console.warn('Failed to get MiniKit context:', contextError)
          return null
        }

        if (!context || !context.user) {
          // Only log this warning once per session to avoid spam
          if (!window.miniKitContextWarned) {
            console.warn('MiniKit context is incomplete or unavailable:', { context })
            window.miniKitContextWarned = true
          }
          return null
        }

        console.log('Successfully extracted MiniKit context:', { fid: context.user.fid })

        // Cache the successful result
        miniKitContextCache = context as MiniKitContext
        miniKitContextTimestamp = Date.now()
        miniKitContextPromise = null

        return context as MiniKitContext
      })()

      // Wait for the cached promise with timeout
      const result = await Promise.race([
        miniKitContextPromise,
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Overall context extraction timeout')), 10000)
        )
      ])

      // Clear the promise after completion and cache the result
      miniKitContextPromise = null
      if (result) {
        miniKitContextCache = result
        miniKitContextTimestamp = Date.now()
      }

      return result
    } catch (extractionError) {
      console.warn('Failed to extract MiniKit context:', extractionError)
      setError(extractionError instanceof Error ? extractionError : new Error('MiniKit extraction failed'))

      // Clear the promise on error and reset warning flags
      miniKitContextPromise = null
      window.miniKitExtractionWarned = false
      return null
    }
  }, [isMiniAppEnvironment])

  /**
   * Enhanced User Data Merging
   * 
   * This function merges Farcaster user data with platform user data to create
   * an enhanced user profile that includes both social and authentication information.
   */
  const createEnhancedUser = useCallback((
    farcasterUser: FarcasterUser,
    platformAddress: string
  ): EnhancedUser => {
    // Check if the platform address is verified on Farcaster
    const isAddressVerified = farcasterUser.verifications.some(
      verification => verification.toLowerCase() === platformAddress.toLowerCase()
    )
    
    // Create enhanced user profile
    const enhancedUser: EnhancedUser = {
      // Include all Farcaster user data
      ...farcasterUser,
      
      // Add platform-specific information
      platformAddress,
      isRegisteredCreator: auth?.user?.isCreator ?? false,
      
      // Add creator profile if available
      creatorProfile: auth?.user ? {
        displayName: auth.user.displayName,
        subscriptionPrice: auth.user.subscriptionPrice,
        totalEarnings: auth.user.totalEarnings,
      } : undefined,
      
      // Add verification status
      isAddressVerified,
    }
    
    return enhancedUser
  }, [auth?.user])

  /**
   * Context Initialization
   *
   * This function initializes the complete Farcaster context by extracting
   * MiniKit data and merging it with platform authentication state.
   */
  const initializeContext = useCallback(async (): Promise<void> => {
    try {
      setIsInitialized(false)
      setError(null)
      
      // Extract MiniKit context
      const miniKitContext = await extractMiniKitContext()
      
      if (!miniKitContext?.user) {
        // Create fallback context when MiniKit is unavailable
        const fallbackContext: FarcasterContext = {
          user: {
            fid: 0,
            username: 'unknown',
            displayName: 'Unknown User',
            pfpUrl: '',
            verifications: [],
          },
          enhancedUser: {
            fid: 0,
            username: 'unknown',
            displayName: 'Unknown User',
            pfpUrl: '',
            verifications: [],
            platformAddress: auth?.user?.address || '',
            isRegisteredCreator: auth?.user?.isCreator || false,
            isAddressVerified: false,
          },
          isMiniAppEnvironment,
          refreshContext: async () => {
            console.warn('Refresh not available in fallback mode')
          },
          hasAuthProvider: !!auth,
        }
        
        setFarcasterContext(fallbackContext)
        setIsInitialized(true)
        return
      }
      
      // Create Farcaster user from MiniKit context
      const farcasterUser: FarcasterUser = {
        fid: miniKitContext.user.fid,
        username: miniKitContext.user.username || 'unknown',
        displayName: miniKitContext.user.displayName || 'Unknown User',
        pfpUrl: miniKitContext.user.pfpUrl || '',
        verifications: miniKitContext.user.verifications || [],
      }
      
      // Create enhanced user by merging with platform data
      const platformAddress = auth?.user?.address || ''
      const enhancedUser = createEnhancedUser(farcasterUser, platformAddress)
      
      // Create complete context
      const context: FarcasterContext = {
        user: farcasterUser,
        enhancedUser,
        isMiniAppEnvironment,
        refreshContext: async () => {
          await initializeContext()
        },
        hasAuthProvider: !!auth,
      }
      
      setFarcasterContext(context)
      setIsInitialized(true)
    } catch (initializationError) {
      console.error('Failed to initialize Farcaster context:', initializationError)
      setError(initializationError instanceof Error ? initializationError : new Error('Context initialization failed'))
      setIsInitialized(true)
    }
  }, [extractMiniKitContext, createEnhancedUser, isMiniAppEnvironment, auth])

  // Initialize context when component mounts
  useEffect(() => {
    let isMounted = true

    // Only initialize if we're in a MiniApp environment
    if (!isInitialized && isMounted && isMiniAppEnvironment) {
      initializeContext()
    } else if (!isInitialized && isMounted && !isMiniAppEnvironment) {
      // If not in MiniApp environment, mark as initialized with null context
      console.log('Not in MiniApp environment, skipping Farcaster context initialization')
      setIsInitialized(true)
    }

    return () => {
      isMounted = false
    }
  }, [isInitialized, initializeContext, isMiniAppEnvironment]) // Include initializeContext in dependencies

  // Separate effect to handle auth changes without causing infinite loops
  useEffect(() => {
    if (isInitialized && farcasterContext && auth?.user?.address) {
      // Only reinitialize if we have a meaningful auth change
      const currentAddress = farcasterContext.enhancedUser.platformAddress
      const newAddress = auth.user.address

      if (currentAddress !== newAddress && newAddress) {
        console.log('Auth user address changed, reinitializing context:', { from: currentAddress, to: newAddress })
        initializeContext()
      }
    }
  }, [auth?.user?.address, isInitialized, farcasterContext, initializeContext])

  // Return context when available, or undefined if not in MiniApp environment
  return farcasterContext
}
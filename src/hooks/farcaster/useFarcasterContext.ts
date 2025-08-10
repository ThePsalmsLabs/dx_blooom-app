// ==============================================================================
// COMPONENT 3.3: SOCIAL CONTEXT INTEGRATION
// File: src/hooks/farcaster/useFarcasterContext.ts
// ==============================================================================

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

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

/**
 * MiniKit SDK Context Type
 * 
 * This interface represents the structure we expect from MiniKit.getContext().
 * We define this to ensure type safety when interacting with the external SDK.
 */
interface MiniKitContext {
  readonly user?: {
    readonly fid: number
    readonly username?: string
    readonly displayName?: string
    readonly pfpUrl?: string
    readonly verifications?: readonly string[]
  }
  readonly client?: {
    readonly name?: string
    readonly version?: string
  }
  readonly location?: {
    readonly type?: string
  }
}

/**
 * Optional Auth Hook
 * 
 * This hook tries to use the auth context, but doesn't throw an error
 * if the AuthProvider isn't available. This makes components more resilient.
 */
// Importing directly avoids require() and preserves type safety
import { useAuth as useAuthContext } from '@/components/providers/AuthProvider'

function useOptionalAuth() {
  try {
    return useAuthContext()
  } catch {
    console.warn('AuthProvider not available - using fallback behavior')
    return null
  }
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
  const [error, setError] = useState<Error | null>(null)

  /**
   * MiniApp Environment Detection
   * 
   * This function detects if we're running in a Farcaster MiniApp environment
   * by checking various indicators including URL patterns and meta tags.
   */
  const isMiniAppEnvironment = useMemo((): boolean => {
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
      
      return urlIndicators || metaIndicators
    } catch (detectionError) {
      console.warn('Failed to detect MiniApp environment:', detectionError)
      return false
    }
  }, [])

  /**
   * MiniKit Context Extraction
   * 
   * This function safely extracts Farcaster context from the MiniKit SDK,
   * handling all potential errors and missing data gracefully.
   */
  const extractMiniKitContext = useCallback(async (): Promise<MiniKitContext | null> => {
    try {
      // Only attempt MiniKit integration if we're in a MiniApp environment
      if (!isMiniAppEnvironment) {
        return null
      }

      // Dynamically import MiniKit SDK to avoid SSR issues
      const { sdk } = await import('@farcaster/miniapp-sdk')
      
      // Wait for SDK to be ready
      await sdk.actions.ready()
      
      // Extract context from SDK
      const context = await sdk.context
      
      if (!context || !context.user) {
        console.warn('MiniKit context is incomplete or unavailable')
        return null
      }
      
      return context as MiniKitContext
    } catch (extractionError) {
      console.warn('Failed to extract MiniKit context:', extractionError)
      setError(extractionError instanceof Error ? extractionError : new Error('MiniKit extraction failed'))
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
  const initializeContext = async (): Promise<void> => {
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
  }

  // Initialize context when component mounts or dependencies change
  useEffect(() => {
    if (!isInitialized) {
      initializeContext()
    }
  }, [isInitialized, auth?.user?.address, auth?.user?.isCreator])

  // Return context when available
  return farcasterContext
}
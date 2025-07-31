// ==============================================================================
// COMPONENT 3.3: SOCIAL CONTEXT INTEGRATION
// File: src/hooks/farcaster/useFarcasterContext.ts
// ==============================================================================

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

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
 * Enhanced Farcaster Context Hook
 * 
 * This hook integrates Farcaster social context with your existing authentication
 * system, creating enhanced user profiles that combine platform and social data.
 * 
 * Key Features:
 * - Merges Farcaster user data with platform authentication state
 * - Provides enhanced user profiles with both social and platform information
 * - Handles graceful degradation when MiniKit or Farcaster context is unavailable
 * - Maintains compatibility with your existing authentication system
 * - Updates context when platform user changes
 * - Provides type-safe interfaces with no 'any' types
 * 
 * Integration Points:
 * - Uses your existing useAuth hook for platform user data
 * - Compatible with Component 3.1's MiniAppProvider
 * - Supports Component 3.2's x402 payment flow social context
 * - Designed for use in Mini App purchase interfaces and social sharing
 * 
 * Error Handling:
 * - Returns undefined when MiniKit is unavailable (graceful degradation)
 * - Handles missing or incomplete Farcaster context safely
 * - Maintains fallback state without throwing errors
 * - Logs warnings for debugging but doesn't break application flow
 */
export function useFarcasterContext(): FarcasterContext | undefined {
  // Integrate with your existing authentication system
  const { user: platformUser } = useAuth()
  
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
      isRegisteredCreator: platformUser?.isCreator ?? false,
      
      // Include creator profile if available
      creatorProfile: platformUser?.isCreator ? {
        displayName: platformUser.displayName,
        subscriptionPrice: platformUser.subscriptionPrice,
        totalEarnings: platformUser.totalEarnings,
      } : undefined,
      
      // Add verification status
      isAddressVerified,
    }
    
    return enhancedUser
  }, [platformUser])

  /**
   * Context Refresh Function
   * 
   * This function allows components to manually refresh the Farcaster context,
   * useful when social data might have changed or after user interactions.
   */
  const refreshContext = useCallback(async (): Promise<void> => {
    if (!platformUser?.address) {
      setFarcasterContext(undefined)
      return
    }

    try {
      const miniKitContext = await extractMiniKitContext()
      
      if (!miniKitContext || !miniKitContext.user) {
        setFarcasterContext(undefined)
        return
      }
      
      // Create properly typed Farcaster user data
      const farcasterUser: FarcasterUser = {
        fid: miniKitContext.user.fid,
        username: miniKitContext.user.username ?? '',
        displayName: miniKitContext.user.displayName ?? '',
        pfpUrl: miniKitContext.user.pfpUrl ?? '',
        verifications: miniKitContext.user.verifications ?? [],
      }
      
      // Create enhanced user profile
      const enhancedUser = createEnhancedUser(farcasterUser, platformUser.address)
      
      // Create complete Farcaster context
      const newContext: FarcasterContext = {
        user: farcasterUser,
        enhancedUser,
        isMiniAppEnvironment,
        refreshContext,
      }
      
      setFarcasterContext(newContext)
      setError(null)
      
    } catch (refreshError) {
      const error = refreshError instanceof Error ? refreshError : new Error('Context refresh failed')
      setError(error)
      console.warn('Failed to refresh Farcaster context:', error)
      setFarcasterContext(undefined)
    }
  }, [platformUser?.address, extractMiniKitContext, createEnhancedUser, isMiniAppEnvironment])

  /**
   * Initial Context Setup Effect
   * 
   * This effect runs when the hook is first mounted and when the platform user changes,
   * ensuring that the Farcaster context is always synchronized with the authentication state.
   */
  useEffect(() => {
    let mounted = true

    const initializeContext = async (): Promise<void> => {
      // Only initialize if we have a platform user and haven't initialized yet
      if (!platformUser?.address || isInitialized) {
        return
      }

      try {
        await refreshContext()
        
        if (mounted) {
          setIsInitialized(true)
        }
      } catch (initError) {
        console.warn('Failed to initialize Farcaster context:', initError)
        
        if (mounted) {
          setError(initError instanceof Error ? initError : new Error('Initialization failed'))
          setIsInitialized(true) // Mark as initialized even if failed to prevent retries
        }
      }
    }

    initializeContext()

    return () => {
      mounted = false
    }
  }, [platformUser?.address, isInitialized, refreshContext])

  /**
   * Platform User Change Effect
   * 
   * This effect refreshes the Farcaster context whenever the platform user changes,
   * ensuring that the enhanced user profile stays synchronized with authentication state.
   */
  useEffect(() => {
    // Only refresh if we're already initialized and have a platform user
    if (isInitialized && platformUser?.address) {
      refreshContext()
    } else if (isInitialized && !platformUser?.address) {
      // Clear context if platform user is no longer available
      setFarcasterContext(undefined)
    }
  }, [platformUser?.address, platformUser?.isCreator, platformUser?.displayName, isInitialized, refreshContext])

  // Return undefined for graceful degradation when context is unavailable
  return farcasterContext
}
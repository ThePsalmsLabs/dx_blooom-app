// src/hooks/business/miniapp-auth.ts

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'

// Import existing Farcaster context from the MiniApp implementation
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

// Import existing creator onboarding functionality
import { useCreatorOnboarding } from '@/hooks/business/workflows'

// Import the existing auth context with optional fallback
import { useAuth as useAuthContext } from '@/components/providers/AuthProvider'

/**
 * Enhanced User Profile Interface
 * 
 * This interface combines traditional wallet-based authentication data
 * with Farcaster social context to create a comprehensive user profile
 * for MiniApp environments. It maintains backward compatibility with
 * existing web authentication while adding social features.
 */
export interface EnhancedUser {
  // Core wallet authentication data (always present when authenticated)
  readonly address: Address
  readonly isConnected: boolean
  readonly isCreator: boolean
  
  // Creator-specific data (present when user is registered as creator)
  readonly creatorProfile?: {
    readonly subscriptionPrice: bigint
    readonly totalEarnings: bigint
    readonly subscriberCount: bigint
    readonly contentCount: bigint
    readonly registrationTime: bigint
    readonly isVerified: boolean
  }
  
  // Enhanced social context (present in MiniApp environment)
  readonly socialContext?: {
    readonly fid: number
    readonly username: string
    readonly displayName: string
    readonly pfpUrl: string
    readonly verifications: readonly string[]
    readonly isAddressVerified: boolean
    readonly client: {
      readonly name: string
      readonly version: string
    }
    readonly location: 'cast' | 'composer' | 'notification' | 'profile' | 'unknown'
  }
  
  // Authentication state flags
  readonly isSocialUser: boolean
  readonly hasEnhancedProfile: boolean
  readonly authenticationMethod: 'wallet-only' | 'wallet-with-social' | 'unknown'
}

/**
 * MiniApp Authentication State
 * 
 * This interface tracks the various states and loading conditions
 * for the enhanced authentication system, providing comprehensive
 * state management for UI components.
 */
export interface MiniAppAuthState {
  readonly isLoading: boolean
  readonly isError: boolean
  readonly error: Error | null
  readonly isInitialized: boolean
  readonly environmentType: 'web' | 'miniapp' | 'unknown'
}

/**
 * MiniApp Authentication Result
 * 
 * This interface defines the complete API returned by the useMiniAppAuth hook,
 * providing enhanced user data, authentication methods, and state management.
 */
export interface MiniAppAuthResult extends MiniAppAuthState {
  // Enhanced user profile combining wallet and social data
  readonly user: EnhancedUser | null
  readonly isAuthenticated: boolean
  readonly isSocialUser: boolean
  
  // Authentication actions
  readonly login: () => Promise<void>
  readonly logout: () => void
  readonly refreshProfile: () => Promise<void>
  
  // Creator management (from existing system)
  readonly updateCreatorStatus: (isCreator: boolean, displayName?: string) => void
  readonly creatorOnboarding: ReturnType<typeof useCreatorOnboarding>
  
  // Social context utilities
  readonly socialVerification: {
    readonly isAddressVerified: boolean
    readonly verificationCount: number
    readonly canVerifyAddress: boolean
  }
}

/**
 * Optional Auth Hook Utility
 * 
 * This utility function safely accesses the AuthProvider context,
 * providing graceful fallback when the provider is not available.
 * This makes components more resilient to different app configurations.
 */
function useOptionalAuth() {
  try {
    return useAuthContext()
  } catch {
    console.warn('AuthProvider not available - using limited authentication mode')
    return null
  }
}

/**
 * Enhanced MiniApp Authentication Hook
 * 
 * This hook combines wallet-based authentication with Farcaster social context
 * to create an enhanced user experience for MiniApp users. It maintains full
 * backward compatibility with existing web authentication while adding social
 * features when available.
 * 
 * Key Features:
 * - Seamlessly combines wagmi wallet data with Farcaster user context
 * - Integrates with existing creator onboarding and registration system
 * - Provides enhanced user profiles with social verification status
 * - Maintains performance optimization through proper memoization
 * - Handles graceful degradation for non-MiniApp environments
 * - Follows established TypeScript strict typing conventions
 * 
 * Architecture Integration:
 * - Uses wagmi's useAccount for wallet connection state
 * - Integrates with MiniAppProvider for Farcaster context
 * - Leverages existing useCreatorOnboarding for creator functionality
 * - Optionally uses AuthProvider for additional user state management
 * - Follows established error handling and state management patterns
 * 
 * The hook automatically detects MiniApp environment and provides enhanced
 * authentication when Farcaster context is available, while gracefully
 * falling back to standard wallet authentication for web users.
 */
export function useMiniAppAuth(): MiniAppAuthResult {
  // ===== CORE DEPENDENCIES AND CONTEXT =====
  
  // Wallet connection state from wagmi
  const { address, isConnected, isConnecting } = useAccount()
  
  // Farcaster context from MiniApp integration
  const farcasterContext = useFarcasterContext()
  
  // Creator onboarding functionality from existing system
  const creatorOnboarding = useCreatorOnboarding(address)
  
  // Optional auth context with graceful fallback
  const authContext = useOptionalAuth()
  
  // ===== STATE MANAGEMENT =====
  
  const [authState, setAuthState] = useState<MiniAppAuthState>({
    isLoading: false,
    isError: false,
    error: null,
    isInitialized: false,
    environmentType: 'unknown'
  })

  // ===== ENVIRONMENT DETECTION =====
  
  const environmentType = useMemo((): 'web' | 'miniapp' | 'unknown' => {
    if (typeof window === 'undefined') return 'unknown'
    
    if (farcasterContext?.isMiniAppEnvironment) {
      return 'miniapp'
    }
    
    // Additional detection patterns for MiniApp environment
    const url = new URL(window.location.href)
    if (url.pathname.startsWith('/mini') || 
        url.searchParams.get('miniApp') === 'true' ||
        window.parent !== window) {
      return 'miniapp'
    }
    
    return 'web'
  }, [farcasterContext])

  // ===== SOCIAL VERIFICATION ANALYSIS =====
  
  const socialVerification = useMemo(() => {
    if (!farcasterContext?.user || !address) {
      return {
        isAddressVerified: false,
        verificationCount: 0,
        canVerifyAddress: false
      }
    }
    
    const verifications = farcasterContext.user.verifications || []
    const isAddressVerified = verifications.some(
      verification => verification.toLowerCase() === address.toLowerCase()
    )
    
    return {
      isAddressVerified,
      verificationCount: verifications.length,
      canVerifyAddress: !isAddressVerified && verifications.length < 10 // Farcaster limit
    }
  }, [farcasterContext, address])

  // ===== ENHANCED USER PROFILE CREATION =====
  
  /**
   * Enhanced User Profile Computation
   * 
   * This memoized computation combines wallet authentication data with
   * Farcaster social context to create a comprehensive user profile.
   * Performance is optimized through proper dependency management.
   */
  const enhancedUser = useMemo((): EnhancedUser | null => {
    // Must have wallet connection to have authenticated user
    if (!isConnected || !address) {
      return null
    }
    
    // Determine creator status from multiple sources
    const isCreator = Boolean(
      creatorOnboarding.isRegistered || 
      authContext?.isCreator || 
      false
    )
    
    // Build base user profile with wallet data
    const baseUser: EnhancedUser = {
      address,
      isConnected: true,
      isCreator,
      isSocialUser: false,
      hasEnhancedProfile: false,
      authenticationMethod: 'wallet-only'
    }
    
    // Add creator profile data if available (non-mutating to respect readonly)
    const creatorProfileData = (isCreator && creatorOnboarding.profile)
      ? {
          subscriptionPrice: creatorOnboarding.profile.subscriptionPrice,
          totalEarnings: creatorOnboarding.profile.totalEarnings,
          subscriberCount: creatorOnboarding.profile.subscriberCount,
          contentCount: creatorOnboarding.profile.contentCount,
          registrationTime: creatorOnboarding.profile.registrationTime,
          isVerified: creatorOnboarding.profile.isVerified
        }
      : undefined
    
    // Enhance with Farcaster social context if available
    if (farcasterContext?.user && environmentType === 'miniapp') {
      const socialContext = {
        fid: farcasterContext.user.fid,
        username: farcasterContext.user.username || '',
        displayName: farcasterContext.user.displayName || '',
        pfpUrl: farcasterContext.user.pfpUrl || '',
        verifications: farcasterContext.user.verifications || [],
        isAddressVerified: socialVerification.isAddressVerified,
        client: {
          name: 'Unknown',
          version: '1.0.0'
        },
        location: 'unknown' as const
      }
      
      return {
        ...baseUser,
        ...(creatorProfileData ? { creatorProfile: creatorProfileData } : {}),
        socialContext,
        isSocialUser: true,
        hasEnhancedProfile: true,
        authenticationMethod: 'wallet-with-social'
      }
    }
    
    return {
      ...baseUser,
      ...(creatorProfileData ? { creatorProfile: creatorProfileData } : {})
    }
  }, [
    isConnected, 
    address, 
    creatorOnboarding.isRegistered,
    creatorOnboarding.profile,
    authContext?.isCreator,
    farcasterContext,
    environmentType,
    socialVerification.isAddressVerified
  ])

  // ===== AUTHENTICATION ACTIONS =====
  
  /**
   * Enhanced Login Function
   * 
   * This function handles the login process for both web and MiniApp environments,
   * ensuring proper initialization of all authentication contexts.
   */
  const login = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, isError: false, error: null }))
    
    try {
      // Use existing auth context login if available
      if (authContext?.login) {
        await authContext.login()
      }
      
      // For MiniApp environment, ensure SDK readiness
      if (environmentType === 'miniapp' && farcasterContext?.isMiniAppEnvironment) {
        try {
          const { sdk } = await import('@farcaster/miniapp-sdk')
          await sdk.actions.ready()
        } catch (sdkError) {
          console.warn('Failed to initialize MiniApp SDK during login:', sdkError)
          // Don't throw - SDK initialization failure shouldn't break wallet login
        }
      }
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isInitialized: true,
        environmentType 
      }))
    } catch (error) {
      console.error('Enhanced authentication login failed:', error)
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error instanceof Error ? error : new Error('Login failed'),
        environmentType
      }))
    }
  }, [authContext, environmentType, farcasterContext])
  
  /**
   * Enhanced Logout Function
   * 
   * This function handles logout for both wallet and social contexts,
   * ensuring complete session cleanup.
   */
  const logout = useCallback((): void => {
    try {
      // Use existing auth context logout if available
      if (authContext?.logout) {
        authContext.logout()
      }
      
      // Reset authentication state
      setAuthState({
        isLoading: false,
        isError: false,
        error: null,
        isInitialized: false,
        environmentType: 'unknown'
      })
      
      // Reset creator onboarding state
      creatorOnboarding.reset()
    } catch (error) {
      console.error('Logout error:', error)
      // Even if cleanup fails, ensure user appears logged out
      setAuthState(prev => ({
        ...prev,
        isError: true,
        error: error instanceof Error ? error : new Error('Logout cleanup failed')
      }))
    }
  }, [authContext, creatorOnboarding])
  
  /**
   * Profile Refresh Function
   * 
   * This function refreshes all user profile data including creator status
   * and social context, useful after profile updates or registrations.
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Refresh creator onboarding data
      if (creatorOnboarding.reset) {
        creatorOnboarding.reset()
      }
      
      // For MiniApp environment, refresh Farcaster context if needed
      if (environmentType === 'miniapp') {
        // Farcaster context refresh would happen automatically on next render
        // due to the way the useFarcasterContext hook is implemented
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      console.error('Profile refresh failed:', error)
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error instanceof Error ? error : new Error('Profile refresh failed')
      }))
    }
  }, [creatorOnboarding, environmentType])
  
  /**
   * Creator Status Update Function
   * 
   * This function updates creator status using the existing auth context
   * while maintaining compatibility with the enhanced authentication system.
   */
  const updateCreatorStatus = useCallback((
    isCreator: boolean, 
    displayName?: string
  ): void => {
    try {
      if (authContext?.updateCreatorStatus) {
        authContext.updateCreatorStatus(isCreator, displayName)
      }
      
      // Trigger profile refresh to update enhanced user data
      refreshProfile()
    } catch (error) {
      console.error('Creator status update failed:', error)
      setAuthState(prev => ({
        ...prev,
        isError: true,
        error: error instanceof Error ? error : new Error('Creator status update failed')
      }))
    }
  }, [authContext, refreshProfile])

  // ===== INITIALIZATION EFFECT =====
  
  /**
   * Authentication Initialization Effect
   * 
   * This effect handles the initial setup of authentication state
   * and environment detection when the component mounts.
   */
  useEffect(() => {
    if (!authState.isInitialized) {
      setAuthState(prev => ({
        ...prev,
        isInitialized: true,
        environmentType,
        isLoading: isConnecting
      }))
    }
  }, [authState.isInitialized, environmentType, isConnecting])
  
  /**
   * Loading State Synchronization Effect
   * 
   * This effect synchronizes loading states from various dependencies
   * to provide accurate loading indicators to UI components.
   */
  useEffect(() => {
    const isLoading = Boolean(
      isConnecting ||
      creatorOnboarding.isLoading ||
      authState.isLoading
    )
    
    if (isLoading !== authState.isLoading) {
      setAuthState(prev => ({ ...prev, isLoading }))
    }
  }, [isConnecting, creatorOnboarding.isLoading, authState.isLoading])

  // ===== COMPUTED AUTHENTICATION FLAGS =====
  
  const isAuthenticated = Boolean(isConnected && address)
  const isSocialUser = Boolean(
    isAuthenticated && 
    environmentType === 'miniapp' && 
    farcasterContext?.user
  )

  // ===== RETURN ENHANCED AUTHENTICATION RESULT =====
  
  return {
    // Enhanced user profile
    user: enhancedUser,
    isAuthenticated,
    isSocialUser,
    
    // Authentication state
    isLoading: authState.isLoading,
    isError: authState.isError,
    error: authState.error,
    isInitialized: authState.isInitialized,
    environmentType: authState.environmentType,
    
    // Authentication actions
    login,
    logout,
    refreshProfile,
    updateCreatorStatus,
    
    // Creator management integration
    creatorOnboarding,
    
    // Social context utilities
    socialVerification
  }
}
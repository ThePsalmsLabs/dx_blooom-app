// src/hooks/business/miniapp-auth.ts

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import type { Address } from 'viem'

// Import existing Farcaster context from the MiniApp implementation
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

// Import existing creator onboarding functionality
import { useCreatorOnboarding } from '@/hooks/business/workflows'

// Import the existing auth context with optional fallback
import { useAuth as useAuthContext } from '@/components/providers/AuthProvider'
import { debug } from '@/lib/utils/debug'

// ===== INTERFACES FOR UNIFIED AUTHENTICATION =====

/**
 * Optimal Payment Method Interface
 * 
 * This new interface determines the best payment approach for each user,
 * prioritizing Farcaster-verified wallets for seamless social commerce.
 */
export interface OptimalPaymentMethod {
  readonly type: 'farcaster-verified' | 'privy-connected' | 'requires-connection'
  readonly address: Address | null
  readonly needsConnection: boolean
  readonly canDirectPayment: boolean
  readonly sociallyVerified: boolean
  readonly paymentStrategy: 'direct' | 'batch' | 'standard'
  readonly confidenceScore: number // 0-100, higher means more optimal
}

/**
 * User Profile Interface
 * 
 * This interface combines traditional wallet-based authentication data
 * with Farcaster social context and optimal payment method detection
 * to create a comprehensive user profile for MiniApp environments.
 */
export interface User {
  // Core wallet authentication data (always present when authenticated)
  readonly address: Address
  readonly isConnected: boolean
  readonly isCreator: boolean
  
  // NEW: Optimal payment method detection
  readonly optimalPaymentMethod: OptimalPaymentMethod
  
  // Creator-specific data (present when user is registered as creator)
  readonly creatorProfile?: {
    readonly subscriptionPrice: bigint
    readonly totalEarnings: bigint
    readonly subscriberCount: bigint
    readonly contentCount: bigint
    readonly registrationTime: bigint
    readonly isVerified: boolean
  }
  
  // Social context (present in MiniApp environment)
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
  readonly hasSocialProfile: boolean
  readonly authenticationMethod: 'wallet-only' | 'wallet-with-social' | 'farcaster-native'
}

/**
 * MiniApp Authentication State
 * 
 * This interface tracks the various states and loading conditions
 * for the authentication system, providing comprehensive
 * state management for UI components.
 */
export interface MiniAppAuthState {
  readonly isLoading: boolean
  readonly isError: boolean
  readonly error: Error | null
  readonly isInitialized: boolean
  readonly environmentType: 'web' | 'miniapp' | 'unknown'
  readonly farcasterAuth?: {
    readonly fid: number
    readonly username: string
    readonly displayName?: string
    readonly pfpUrl?: string
    readonly isVerified: boolean
    readonly signature: string
    readonly message: string
  }
}

/**
 * MiniApp Authentication Result
 * 
 * This interface defines the complete API returned by the useMiniAppAuth hook,
 * providing user data, authentication methods, and state management.
 */
export interface MiniAppAuthResult extends MiniAppAuthState {
  // User profile combining wallet and social data
  readonly user: User | null
  readonly isAuthenticated: boolean
  readonly isSocialUser: boolean
  
  // NEW: Payment optimization features
  readonly optimalPaymentMethod: OptimalPaymentMethod | null
  readonly canUseDirectPayment: boolean
  readonly recommendedStrategy: 'farcaster-direct' | 'batch-transaction' | 'standard-flow'
  
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

// ===== UTILITY FUNCTIONS =====

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
 * Calculate Payment Method Confidence Score
 * 
 * This function calculates how optimal a payment method is based on multiple factors.
 * Higher scores indicate more seamless user experience.
 */
function calculateConfidenceScore(
  address: Address,
  sociallyVerified: boolean,
  isConnected: boolean,
  environmentType: 'web' | 'miniapp' | 'unknown'
): number {
  let score = 0
  
  // Base connection score
  if (isConnected) score += 30
  
  // Social verification bonus (major UX improvement)
  if (sociallyVerified) score += 40
  
  // Environment optimization bonus
  if (environmentType === 'miniapp') score += 20
  
  // Address validity bonus
  if (address) score += 10
  
  return Math.min(score, 100)
}

// ===== MAIN HOOK IMPLEMENTATION =====

/**
 * MiniApp Authentication Hook
 * 
 * This hook combines wallet-based authentication with Farcaster social context
 * and adds intelligent payment method optimization. It maintains full backward
 * compatibility with existing web authentication while adding social features
 * and payment optimization when available.
 * 
 * KEY FEATURES:
 * - Prioritizes Farcaster-verified wallets for direct payments
 * - Provides optimal payment strategy recommendations
 * - Maintains unified authentication state across contexts
 * - Bridges Privy authentication with Farcaster social verification
 * - Calculates confidence scores for payment method optimization
 * 
 * Architecture Integration:
 * - Uses wagmi's useAccount for wallet connection state
 * - Integrates with MiniAppProvider for Farcaster context
 * - Leverages existing useCreatorOnboarding for creator functionality
 * - Optionally uses AuthProvider for additional user state management
 * - Follows established error handling and state management patterns
 * 
 * The hook automatically detects MiniApp environment and provides social
 * authentication when Farcaster context is available, while gracefully
 * falling back to standard wallet authentication for web users.
 */
export function useMiniAppAuth(): MiniAppAuthResult {
  // ===== CORE DEPENDENCIES AND CONTEXT =====
  
  // Unified wallet connection UI
  const walletUI = useWalletConnectionUI()

  // Farcaster context from MiniApp integration
  const farcasterContext = useFarcasterContext()

  // Creator onboarding functionality from existing system
  const creatorOnboarding = useCreatorOnboarding(walletUI.address as Address | undefined)
  
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
    try {
      if (!farcasterContext?.user || !walletUI.address) {
        return {
          isAddressVerified: false,
          verificationCount: 0,
          canVerifyAddress: false
        }
      }
      
      const verifications = farcasterContext.user.verifications || []
      const isAddressVerified = walletUI.address ? verifications.some(
        verification => verification.toLowerCase() === walletUI.address!.toLowerCase()
      ) : false
      
      const result = {
        isAddressVerified,
        verificationCount: verifications.length,
        canVerifyAddress: !isAddressVerified && verifications.length < 10 // Farcaster limit
      }
      
      // Log verification status for debugging
      if (environmentType === 'miniapp') {
        debug.log('🔍 Social verification analysis:', {
          fid: farcasterContext.user.fid,
          username: farcasterContext.user.username,
          isAddressVerified,
          verificationCount: verifications.length,
          canVerifyAddress: result.canVerifyAddress
        })
      }
      
      return result
    } catch (error) {
      console.error('Social verification analysis error:', error)
      // Return safe fallback values
      return {
        isAddressVerified: false,
        verificationCount: 0,
        canVerifyAddress: false
      }
    }
  }, [farcasterContext, walletUI.address, environmentType])

  // ===== NEW: OPTIMAL PAYMENT METHOD COMPUTATION =====
  
  /**
   * Optimal Payment Method Detection
   * 
   * This is the core feature that determines the best payment approach
   * for each user context, prioritizing Farcaster-verified wallets for
   * seamless social commerce experiences.
   */
  const optimalPaymentMethod = useMemo((): OptimalPaymentMethod | null => {
    try {
      if (!walletUI.address) {
        return {
          type: 'requires-connection',
          address: null,
          needsConnection: true,
          canDirectPayment: false,
          sociallyVerified: false,
          paymentStrategy: 'standard',
          confidenceScore: 0
        }
      }

      // PRIORITY 1: Farcaster-verified wallet (best UX)
      if (farcasterContext?.user && socialVerification.isAddressVerified && environmentType === 'miniapp') {
        const confidenceScore = calculateConfidenceScore(walletUI.address as `0x${string}`, true, walletUI.isConnected, environmentType)
        
        debug.log('🎯 Optimal payment method: Farcaster-verified wallet', {
          address: walletUI.address,
          confidenceScore,
          environmentType
        })
        
        return {
          type: 'farcaster-verified',
          address: walletUI.address as `0x${string}`,
          needsConnection: false,
          canDirectPayment: true,
          sociallyVerified: true,
          paymentStrategy: 'direct',
          confidenceScore
        }
      }

      // PRIORITY 2: Privy-connected wallet (standard UX)
      if (walletUI.isConnected) {
        const confidenceScore = calculateConfidenceScore(walletUI.address as `0x${string}`, false, walletUI.isConnected, environmentType)
        
        debug.log('🎯 Optimal payment method: Privy-connected wallet', {
          address: walletUI.address,
          confidenceScore,
          environmentType
        })
        
        return {
          type: 'privy-connected',
          address: walletUI.address as `0x${string}`,
          needsConnection: false,
          canDirectPayment: true,
          sociallyVerified: false,
          paymentStrategy: environmentType === 'miniapp' ? 'batch' : 'standard',
          confidenceScore
        }
      }

      // Requires connection
      debug.log('🎯 Optimal payment method: Requires connection')
      return {
        type: 'requires-connection',
        address: null,
        needsConnection: true,
        canDirectPayment: false,
        sociallyVerified: false,
        paymentStrategy: 'standard',
        confidenceScore: 0
      }
    } catch (error) {
      console.error('Optimal payment method computation error:', error)
      // Return safe fallback
      return {
        type: 'requires-connection',
        address: null,
        needsConnection: true,
        canDirectPayment: false,
        sociallyVerified: false,
        paymentStrategy: 'standard',
        confidenceScore: 0
      }
    }
  }, [walletUI.address, farcasterContext, socialVerification, environmentType, walletUI.isConnected])

  // ===== USER PROFILE CREATION =====
  
  /**
   * User Profile Computation
   * 
   * This memoized computation combines wallet authentication data with
   * Farcaster social context and optimal payment method detection to create
   * a comprehensive user profile. Performance is optimized through proper
   * dependency management.
   */
  const user = useMemo((): User | null => {
    try {
      // Must have wallet connection to have authenticated user
      if (!walletUI.isConnected || !walletUI.address || !optimalPaymentMethod) {
        return null
      }
      
      // Determine creator status from multiple sources
      const isCreator = Boolean(
        creatorOnboarding.isRegistered || 
        authContext?.isCreator || 
        false
      )
      
      // Determine authentication method based on context
      const authenticationMethod = (() => {
        if (farcasterContext?.user && socialVerification.isAddressVerified) {
          return 'farcaster-native' as const
        }
        if (farcasterContext?.user && environmentType === 'miniapp') {
          return 'wallet-with-social' as const
        }
        return 'wallet-only' as const
      })()
      
      // Build base user profile with wallet data
      const baseUser: User = {
        address: walletUI.address as `0x${string}`,
        isConnected: walletUI.isConnected,
        isCreator,
        optimalPaymentMethod,
        isSocialUser: false,
        hasSocialProfile: false,
        authenticationMethod
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
      
      // Add Farcaster social context if available
      if (farcasterContext?.user && environmentType === 'miniapp') {
        const socialContext = {
          fid: farcasterContext.user.fid,
          username: farcasterContext.user.username || '',
          displayName: farcasterContext.user.displayName || '',
          pfpUrl: farcasterContext.user.pfpUrl || '',
          verifications: farcasterContext.user.verifications || [],
          isAddressVerified: socialVerification.isAddressVerified,
          client: {
            name: farcasterContext.user.username || 'Unknown',
            version: '1.0.0'
          },
          location: 'unknown' as const
        }
        
        debug.log('👤 User profile created with social context:', {
          fid: socialContext.fid,
          username: socialContext.username,
          isAddressVerified: socialContext.isAddressVerified,
          authenticationMethod
        })
        
        return {
          ...baseUser,
          ...(creatorProfileData ? { creatorProfile: creatorProfileData } : {}),
          socialContext,
          isSocialUser: true,
          hasSocialProfile: true,
          authenticationMethod
        }
      }
      
      debug.log('👤 User profile created (wallet-only):', {
        address: walletUI.address,
        isCreator,
        authenticationMethod
      })
      
      return {
        ...baseUser,
        ...(creatorProfileData ? { creatorProfile: creatorProfileData } : {})
      }
    } catch (error) {
      console.error('User profile computation error:', error)
      // Return null on error to indicate profile creation failed
      return null
    }
  }, [
    walletUI.isConnected,
    walletUI.address,
    optimalPaymentMethod,
    creatorOnboarding.isRegistered,
    creatorOnboarding.profile,
    authContext?.isCreator,
    farcasterContext,
    environmentType,
    socialVerification.isAddressVerified
  ])

  // ===== NEW: PAYMENT STRATEGY RECOMMENDATION =====
  
  /**
   * Recommended Payment Strategy
   * 
   * This computed value provides the optimal payment strategy based on
   * user context, environment, and social verification status.
   */
  const recommendedStrategy = useMemo((): 'farcaster-direct' | 'batch-transaction' | 'standard-flow' => {
    try {
      if (!optimalPaymentMethod) {
        debug.log('🎯 Recommended strategy: standard-flow (no optimal payment method)')
        return 'standard-flow'
      }
      
      // Farcaster-verified users get direct payment flow
      if (optimalPaymentMethod.type === 'farcaster-verified' && optimalPaymentMethod.sociallyVerified) {
        debug.log('🎯 Recommended strategy: farcaster-direct (socially verified)')
        return 'farcaster-direct'
      }
      
      // MiniApp users with connected wallets get batch transactions
      if (environmentType === 'miniapp' && optimalPaymentMethod.canDirectPayment) {
        debug.log('🎯 Recommended strategy: batch-transaction (MiniApp with direct payment)')
        return 'batch-transaction'
      }
      
      // All others use standard flow
      debug.log('🎯 Recommended strategy: standard-flow (fallback)')
      return 'standard-flow'
    } catch (error) {
      console.error('Recommended strategy computation error:', error)
      // Return safe fallback
      return 'standard-flow'
    }
  }, [optimalPaymentMethod, environmentType])

  // ===== AUTHENTICATION ACTIONS =====
  
  /**
   * Farcaster Quick Auth Implementation
   * 
   * This function implements Farcaster's recommended Quick Auth flow instead of
   * direct SIWF implementation. Quick Auth is the preferred method for miniapps
   * as it handles the authentication complexity while providing a secure JWT token.
   */
  const signInWithFarcaster = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      debug.log('🎭 Starting Farcaster Quick Auth flow')
      
      // Import the Farcaster SDK dynamically
      const { sdk } = await import('@farcaster/miniapp-sdk')
      
      // Wait for the SDK to be ready
      await sdk.actions.ready()
      
      debug.log('📝 Getting Quick Auth token from Farcaster')
      
      // Use Quick Auth to get a JWT token (recommended approach)
      const authResult = await sdk.quickAuth.getToken()
      
      if (!authResult || !authResult.token) {
        throw new Error('Failed to get authentication token from Farcaster')
      }
      
      debug.log('✅ Quick Auth token received:', {
        hasToken: !!authResult.token,
        tokenLength: authResult.token.length
      })
      
      // Verify the JWT token on our backend
      const verificationResponse = await fetch('/api/auth/verify-quickauth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authResult.token}`
        },
        body: JSON.stringify({
          token: authResult.token
        })
      })
      
      if (!verificationResponse.ok) {
        throw new Error('Failed to verify authentication token')
      }
      
      const verificationResult = await verificationResponse.json()
      
      if (!verificationResult.valid) {
        throw new Error('Invalid authentication token')
      }
      
      // Update auth state with verified Farcaster credentials
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isInitialized: true,
        environmentType: 'miniapp',
        farcasterAuth: {
          fid: verificationResult.fid,
          username: verificationResult.username,
          displayName: verificationResult.displayName,
          pfpUrl: verificationResult.pfpUrl,
          isVerified: true,
          signature: '', // Quick Auth doesn't expose raw signatures
          message: 'Authenticated via Farcaster Quick Auth'
        }
      }))
      
      debug.log('✅ Farcaster Quick Auth completed successfully')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Farcaster authentication failed'
      console.error('❌ Farcaster Quick Auth error:', errorMessage)
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error instanceof Error ? error : new Error(errorMessage)
      }))
      
      throw error
    }
  }, [])
  
  /**
   * Login Function
   * 
   * This function handles the login process for both web and MiniApp environments,
   * ensuring proper initialization of all authentication contexts.
   * 
   * IMPORTANT: In Farcaster mini apps, the wallet should already be connected automatically
   * according to the official documentation. We should check for existing connection first.
   */
  const login = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // Check if we're in a MiniApp environment
      if (environmentType === 'miniapp') {
        debug.log('🚀 MiniApp environment detected')
        
        // In Farcaster mini apps, wallet should be automatically connected
        // Check if wallet is already connected first
        if (walletUI.isConnected) {
          debug.log('✅ Wallet already connected in Farcaster mini app, proceeding with Quick Auth')
          await signInWithFarcaster()
        } else {
          debug.log('⚠️ Wallet not automatically connected, attempting manual connection')
          // If not connected, this might be a web context or connection issue
          // Try to connect first, then proceed with Quick Auth
          if (!walletUI.isConnected) {
            throw new Error('Wallet not connected in Farcaster mini app. Please ensure you have a connected wallet.')
          }
        }
      } else {
        // Standard web authentication - trigger wallet connection
        debug.log('🚀 Web wallet login initiated')
        
        // In a real implementation, this would trigger Privy's login modal
        // For now, we rely on wagmi's useAccount for wallet connection
        // The user needs to connect their wallet through the UI
        
        // Wait for wallet connection to be established
        if (!walletUI.isConnected) {
          throw new Error('Please connect your wallet to continue')
        }
        
        setAuthState(prev => ({ ...prev, isLoading: false }))
        debug.log('✅ Web wallet login completed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      console.error('Login error:', errorMessage)
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error instanceof Error ? error : new Error(errorMessage)
      }))
    }
  }, [environmentType, signInWithFarcaster, walletUI.isConnected])

  /**
   * Logout Function
   * 
   * This function clears all authentication state including Farcaster context.
   */
  const logout = useCallback((): void => {
    try {
      debug.log('🚀 Logout initiated')
      
      // Clear authentication state
      setAuthState({
        isLoading: false,
        isError: false,
        error: null,
        isInitialized: false,
        environmentType: 'unknown'
      })
      
      // Clear Farcaster context if available
      if (farcasterContext?.refreshContext) {
        // Reset Farcaster context to initial state
        debug.log('🔄 Clearing Farcaster context')
      }
      
      // Integration point for existing logout functionality
      // This would typically disconnect the wallet and clear any stored tokens
      debug.log('🚀 Logout completed')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, we still want to clear the local state
      setAuthState({
        isLoading: false,
        isError: false,
        error: null,
        isInitialized: false,
        environmentType: 'unknown'
      })
    }
  }, [farcasterContext])

  /**
   * Profile Refresh Function
   * 
   * This function refreshes both wallet and social context data.
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      debug.log('🔄 Refreshing profile data...')
      
      // Refresh Farcaster context if available
      if (farcasterContext?.refreshContext) {
        debug.log('🔄 Refreshing Farcaster context...')
        await farcasterContext.refreshContext()
        debug.log('✅ Farcaster context refreshed')
      }
      
      // Refresh creator onboarding data
      if (creatorOnboarding.registrationCheck?.refetch) {
        debug.log('🔄 Refreshing creator onboarding data...')
        await creatorOnboarding.registrationCheck.refetch()
        debug.log('✅ Creator onboarding data refreshed')
      }
      
      // Refresh creator profile if available
      if (environmentType === 'miniapp' && creatorOnboarding.creatorProfile?.refetch) {
        debug.log('🔄 Refreshing creator profile...')
        await creatorOnboarding.creatorProfile.refetch()
        debug.log('✅ Creator profile refreshed')
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }))
      debug.log('✅ Profile refresh completed successfully')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile refresh failed'
      console.error('Profile refresh error:', errorMessage)
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: error instanceof Error ? error : new Error(errorMessage)
      }))
    }
  }, [farcasterContext, creatorOnboarding, environmentType])

  /**
   * Creator Status Update Function
   * 
   * This function updates creator status while maintaining social context.
   */
  const updateCreatorStatus = useCallback((isCreator: boolean, displayName?: string): void => {
    try {
      debug.log('🚀 Creator status update:', { isCreator, displayName })
      
      // Update local creator onboarding state if available
      if (creatorOnboarding && typeof creatorOnboarding.reset === 'function') {
        // Trigger a refresh of creator status
        if (creatorOnboarding.registrationCheck?.refetch) {
          creatorOnboarding.registrationCheck.refetch()
        }
      }
      
      // Update auth context if available
      if (authContext?.updateCreatorStatus) {
        authContext.updateCreatorStatus(isCreator, displayName)
      }
      
      // Update local state to reflect creator status change
      setAuthState(prev => ({
        ...prev,
        isInitialized: true
      }))
      
      debug.log('✅ Creator status updated successfully')
    } catch (error) {
      console.error('Creator status update error:', error)
      setAuthState(prev => ({
        ...prev,
        isError: true,
        error: error instanceof Error ? error : new Error('Failed to update creator status')
      }))
    }
  }, [creatorOnboarding, authContext])

  // ===== INITIALIZATION EFFECTS =====
  
  /**
   * Authentication State Initialization Effect
   * 
   * This effect ensures proper initialization of the authentication state
   * when the component mounts or dependencies change.
   */
  useEffect(() => {
    if (!authState.isInitialized) {
      try {
        debug.log('🚀 Initializing authentication state...')
        
        setAuthState(prev => ({
          ...prev,
          isInitialized: true,
          environmentType,
          isLoading: walletUI.isConnecting
        }))
        
        debug.log('✅ Authentication state initialized:', { environmentType, isConnecting: walletUI.isConnecting })
      } catch (error) {
        console.error('Authentication state initialization error:', error)
        setAuthState(prev => ({
          ...prev,
          isInitialized: true,
          isError: true,
          error: error instanceof Error ? error : new Error('Initialization failed')
        }))
      }
    }
  }, [authState.isInitialized, environmentType, walletUI.isConnecting])
  
  /**
   * Loading State Synchronization Effect
   * 
   * This effect synchronizes loading states from various dependencies
   * to provide accurate loading indicators to UI components.
   */
  useEffect(() => {
    try {
      const isLoading = Boolean(
        walletUI.isConnecting ||
        creatorOnboarding.isLoading ||
        authState.isLoading
      )
      
      if (isLoading !== authState.isLoading) {
        setAuthState(prev => ({ ...prev, isLoading }))
        
        if (isLoading) {
          debug.log('🔄 Loading state synchronized:', { 
            isConnecting: walletUI.isConnecting, 
            creatorOnboardingLoading: creatorOnboarding.isLoading,
            authStateLoading: authState.isLoading 
          })
        }
      }
    } catch (error) {
      console.error('Loading state synchronization error:', error)
      // Don't update state on error to avoid infinite loops
    }
  }, [walletUI.isConnecting, creatorOnboarding.isLoading, authState.isLoading])

  // ===== COMPUTED AUTHENTICATION FLAGS =====
  
  const isAuthenticated = Boolean(walletUI.isConnected && walletUI.address)
  const isSocialUser = Boolean(
    isAuthenticated && 
    environmentType === 'miniapp' && 
    farcasterContext?.user
  )

  // ===== RETURN AUTHENTICATION RESULT =====
  
  return {
    // User profile
    user: user,
    isAuthenticated,
    isSocialUser,
    
    // NEW: Payment optimization features
    optimalPaymentMethod,
    canUseDirectPayment: optimalPaymentMethod?.canDirectPayment ?? false,
    recommendedStrategy,
    
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
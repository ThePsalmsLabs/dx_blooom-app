/**
 * Enhanced Unified Authentication Hook
 * 
 * This hook provides a unified authentication interface that works seamlessly
 * across web and MiniApp contexts, solving the wallet connection state issues.
 * 
 * FIXES THE PROBLEM:
 * - Automatically detects MiniApp vs Web context
 * - Uses correct wallet connection hooks for each environment
 * - Provides unified authentication state interface
 * - Handles Farcaster auto-wallet connection properly
 * - Eliminates state synchronization issues
 */

'use client'

import { useMemo, useEffect, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { useMiniAppAuth } from '@/hooks/business/miniapp-auth'
import { useMiniAppUtils } from '@/contexts/UnifiedMiniAppProvider'

/**
 * Unified Authentication State Interface
 * 
 * This interface provides a consistent authentication state API
 * regardless of whether the user is in web or MiniApp context.
 */
export interface UnifiedAuthState {
  // Primary authentication state
  readonly isConnected: boolean
  readonly address: string | undefined
  readonly isConnecting: boolean
  readonly isAuthenticated: boolean
  
  // Context awareness
  readonly isMiniApp: boolean
  readonly isWeb: boolean
  readonly environment: 'miniapp' | 'web' | 'unknown'
  
  // Enhanced user information
  readonly user: {
    readonly address?: string
    readonly formattedAddress?: string
    readonly displayName?: string
    readonly avatar?: string
    readonly fid?: number
    readonly username?: string
    readonly isVerified?: boolean
  } | null
  
  // Connection management
  readonly connect: () => Promise<void>
  readonly disconnect: () => Promise<void>
  readonly retry: () => Promise<void>
  
  // State flags
  readonly hasError: boolean
  readonly error: Error | null
  readonly isInitialized: boolean
  readonly isLoading: boolean
  
  // Network information
  readonly chainId?: number
  readonly chainName?: string
  readonly isCorrectNetwork?: boolean
  
  // Creator-specific state
  readonly isCreator?: boolean
  readonly creatorProfile?: any
}

/**
 * Enhanced Unified Authentication Hook
 * 
 * This hook automatically detects the environment and uses the appropriate
 * wallet connection logic, providing a unified interface for all components.
 */
export function useUnifiedAuth(): UnifiedAuthState {
  // Environment detection
  const miniAppUtils = useMiniAppUtils()
  const { isMiniApp } = miniAppUtils
  
  // Web3 core state
  const { address: accountAddress, isConnected: accountConnected, isConnecting: accountConnecting } = useAccount()
  
  // Context-specific wallet hooks
  const farcasterWallet = useFarcasterAutoWallet()
  const miniAppWallet = useMiniAppWalletUI()
  const webWallet = useWalletConnectionUI()
  const miniAppAuth = useMiniAppAuth()
  
  // Local state for unified management
  const [authState, setAuthState] = useState({
    isInitialized: false,
    hasError: false,
    error: null as Error | null,
    isLoading: true
  })
  
  // Determine the active wallet context
  const activeWallet = useMemo(() => {
    if (isMiniApp) {
      // In MiniApp context, prioritize Farcaster auto wallet
      return {
        isConnected: farcasterWallet.isConnected,
        address: farcasterWallet.address,
        isConnecting: farcasterWallet.isConnecting,
        error: farcasterWallet.error,
        connect: farcasterWallet.connect,
        disconnect: async () => {}, // MiniApp doesn't typically disconnect
        retry: farcasterWallet.connect,
        context: 'miniapp' as const
      }
    } else {
      // In Web context, use web wallet
      return {
        isConnected: webWallet.isConnected,
        address: webWallet.address,
        isConnecting: webWallet.isConnecting,
        error: null, // Web wallet error handling is different
        connect: webWallet.connect,
        disconnect: webWallet.disconnect,
        retry: webWallet.connect,
        context: 'web' as const
      }
    }
  }, [
    isMiniApp,
    farcasterWallet.isConnected,
    farcasterWallet.address,
    farcasterWallet.isConnecting,
    farcasterWallet.error,
    farcasterWallet.connect,
    webWallet.isConnected,
    webWallet.address,
    webWallet.isConnecting,
    webWallet.connect,
    webWallet.disconnect
  ])
  
  // Enhanced user information
  const enhancedUser = useMemo(() => {
    if (!activeWallet.isConnected || !activeWallet.address) {
      return null
    }
    
    const baseUser = {
      address: activeWallet.address,
      formattedAddress: `${activeWallet.address.slice(0, 6)}...${activeWallet.address.slice(-4)}`
    }
    
    // Add MiniApp-specific user data if available
    if (isMiniApp && miniAppAuth.user) {
      return {
        ...baseUser,
        displayName: miniAppAuth.user.socialContext?.displayName || miniAppAuth.user.socialContext?.username,
        avatar: miniAppAuth.user.socialContext?.pfpUrl,
        fid: miniAppAuth.user.socialContext?.fid,
        username: miniAppAuth.user.socialContext?.username,
        isVerified: miniAppAuth.user.socialContext?.isAddressVerified || false
      }
    }
    
    return baseUser
  }, [
    activeWallet.isConnected,
    activeWallet.address,
    isMiniApp,
    miniAppAuth.user
  ])
  
  // Environment classification
  const environment = useMemo((): 'miniapp' | 'web' | 'unknown' => {
    if (isMiniApp) return 'miniapp'
    if (typeof window !== 'undefined') return 'web'
    return 'unknown'
  }, [isMiniApp])
  
  // Initialization effect
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, hasError: false, error: null }))
        
        // In MiniApp context, auto-connection should happen automatically
        if (isMiniApp && !farcasterWallet.isConnected && !farcasterWallet.isConnecting) {
          console.log('🚀 Initializing Farcaster auto-wallet connection...')
          // The farcasterWallet hook should handle auto-connection internally
          // We don't need to manually trigger it here
        }
        
        // Mark as initialized
        setAuthState(prev => ({ 
          ...prev, 
          isInitialized: true,
          isLoading: false
        }))
        
      } catch (error) {
        console.error('❌ Authentication initialization failed:', error)
        setAuthState(prev => ({
          ...prev,
          hasError: true,
          error: error instanceof Error ? error : new Error('Authentication initialization failed'),
          isLoading: false,
          isInitialized: true
        }))
      }
    }
    
    // Only initialize once
    if (!authState.isInitialized) {
      initializeAuth()
    }
  }, [isMiniApp, farcasterWallet.isConnected, farcasterWallet.isConnecting, authState.isInitialized])
  
  // Error state management
  useEffect(() => {
    const currentError = activeWallet.error
    if (currentError && !authState.hasError) {
      setAuthState(prev => ({
        ...prev,
        hasError: true,
        error: currentError
      }))
    } else if (!currentError && authState.hasError) {
      setAuthState(prev => ({
        ...prev,
        hasError: false,
        error: null
      }))
    }
  }, [activeWallet.error, authState.hasError])
  
  // Connection actions with error handling
  const connect = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, hasError: false, error: null }))
      await activeWallet.connect()
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Connection failed')
      setAuthState(prev => ({ ...prev, hasError: true, error: authError }))
      throw authError
    }
  }, [activeWallet.connect])
  
  const disconnect = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, hasError: false, error: null }))
      await activeWallet.disconnect()
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Disconnection failed')
      setAuthState(prev => ({ ...prev, hasError: true, error: authError }))
      throw authError
    }
  }, [activeWallet.disconnect])
  
  const retry = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, hasError: false, error: null }))
      await activeWallet.retry()
    } catch (error) {
      const authError = error instanceof Error ? error : new Error('Retry failed')
      setAuthState(prev => ({ ...prev, hasError: true, error: authError }))
      throw authError
    }
  }, [activeWallet.retry])
  
  // Network information (primarily from web context)
  const networkInfo = useMemo(() => {
    if (!isMiniApp && webWallet.isConnected) {
      return {
        chainId: 8453, // Base mainnet 
        chainName: webWallet.chainName,
        isCorrectNetwork: webWallet.isCorrectNetwork
      }
    }
    
    // In MiniApp, network is typically Base mainnet by default
    return {
      chainId: 8453, // Base mainnet
      chainName: 'Base',
      isCorrectNetwork: true
    }
  }, [isMiniApp, webWallet.isConnected, webWallet.chainName, webWallet.isCorrectNetwork])
  
  // Debug logging (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 UnifiedAuth State Update:', {
        environment,
        isMiniApp,
        isConnected: activeWallet.isConnected,
        address: activeWallet.address ? `${activeWallet.address.slice(0, 6)}...${activeWallet.address.slice(-4)}` : null,
        isConnecting: activeWallet.isConnecting,
        hasError: authState.hasError,
        isInitialized: authState.isInitialized,
      })
    }
  }, [
    environment,
    isMiniApp,
    activeWallet.isConnected,
    activeWallet.address,
    activeWallet.isConnecting,
    authState.hasError,
    authState.isInitialized,
    enhancedUser
  ])
  
  // Return unified authentication state
  return {
    // Primary authentication state
    isConnected: activeWallet.isConnected,
    address: activeWallet.address as `0x${string}`,
    isConnecting: activeWallet.isConnecting,
    isAuthenticated: activeWallet.isConnected && !!activeWallet.address,
    
    // Context awareness
    isMiniApp,
    isWeb: !isMiniApp,
    environment,
    
    // Enhanced user information
    user: enhancedUser,
    
    // Connection management
    connect,
    disconnect,
    retry,
    
    // State flags
    hasError: authState.hasError,
    error: authState.error,
    isInitialized: authState.isInitialized,
    isLoading: authState.isLoading || activeWallet.isConnecting,
    
    // Network information
    ...networkInfo,
    
    // Creator-specific state (can be extended)
    isCreator: miniAppAuth.user?.isCreator,
    creatorProfile: miniAppAuth.user?.creatorProfile
  }
}
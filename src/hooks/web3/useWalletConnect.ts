/**
 * CORRECTED Privy-based Wallet Connection Hook
 * File: src/hooks/web3/useWalletConnect.ts
 * 
 * This is the corrected version that properly integrates with Privy's authentication system.
 * The key insight is that Privy treats wallet connection as part of user authentication,
 * which requires a different approach than traditional wallet-only libraries like Privy.
 * 
 * Think of this like the difference between a simple door lock (Privy - just connects wallets)
 * and a modern security system (Privy - handles multiple authentication methods with smart features).
 * 
 * CRITICAL FIXES:
 * 1. Proper import of Privy hooks without conflicts
 * 2. Correct handling of Privy's authentication states
 * 3. Fixed network switching using wagmi's useSwitchChain
 * 4. Proper integration with the corrected Web3Provider
 * 5. Enhanced error handling and debugging
 */

import { useCallback, useMemo, useState } from 'react'
import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useEnhancedWeb3 } from '@/components/providers/Web3Provider'
import { formatAddress } from '@/lib/utils'
import { type Address } from 'viem'

/**
 * Enhanced Wallet Connection Status
 * These states reflect Privy's more sophisticated authentication system
 */
export type WalletConnectionStatus = 
  | 'disconnected'        // No user session
  | 'connecting'          // Authentication in progress  
  | 'connected'           // User authenticated and wallet connected
  | 'authenticated'       // User authenticated but no wallet (e.g., email-only login)
  | 'error'              // Authentication or connection error

/**
 * Network Information - preserved from your current setup
 * This structure helps your UI understand which networks are supported
 */
export interface NetworkInfo {
  readonly id: number
  readonly name: string
  readonly isSupported: boolean
  readonly blockExplorer: string
}

/**
 * Smart Account Information - enhanced with Privy's user context
 * This provides rich information about smart account capabilities
 */
export interface SmartAccountInfo {
  readonly isEnabled: boolean
  readonly address: string | null
  readonly isDeployed: boolean
  readonly canSponsorGas: boolean
  readonly benefits: readonly string[]
  readonly canUpgrade: boolean
}

/**
 * User Information - new with Privy
 * Privy provides much richer user context than traditional wallet connections
 * This is like the difference between knowing just someone's phone number (wallet address)
 * versus having their full contact card (email, phone, authentication method, etc.)
 */
export interface UserInfo {
  readonly id: string | null
  readonly email: string | null
  readonly phone: string | null
  readonly walletAddress: string | null
  readonly hasEmbeddedWallet: boolean
  readonly loginMethod: string | null
}

/**
 * Main Wallet Connection Hook Return Type
 * This maintains compatibility with your existing code while adding Privy's enhanced features
 */
export interface UseWalletConnectReturn {
  // Connection State - enhanced with Privy's authentication context
  readonly isConnected: boolean
  readonly isConnecting: boolean
  readonly isAuthenticated: boolean          // New: user has logged in (may not have wallet)
  readonly status: WalletConnectionStatus
  readonly address: Address | null
  readonly formattedAddress: string | null
  
  // User Information - new with Privy
  readonly user: UserInfo
  
  // Network Information - preserved from current setup
  readonly network: NetworkInfo | null
  readonly isCorrectNetwork: boolean
  readonly supportedNetworks: readonly NetworkInfo[]
  
  // Smart Account Features - preserved and enhanced
  readonly smartAccount: SmartAccountInfo
  readonly canUpgradeToSmartAccount: boolean
  readonly isUpgrading: boolean
  
  // Actions - simplified with Privy's unified authentication
  readonly login: () => void                 // Opens Privy's auth modal with all options
  readonly logout: () => Promise<void>       // Enhanced logout that clears all auth state
  readonly connectWallet: () => void         // Connect additional wallet to existing account
  readonly switchNetwork: (chainId: number) => void
  readonly upgradeToSmartAccount: () => Promise<boolean>
  
  // UI State
  readonly error: string | null
  readonly clearError: () => void
  readonly showNetworkWarning: boolean
}

/**
 * CORRECTED Main Wallet Connection Hook
 * 
 * This hook demonstrates the proper way to integrate Privy's authentication system.
 * The key insight is that Privy handles both authentication AND wallet connection
 * as a unified flow, which simplifies many common Web3 onboarding patterns.
 * 
 * Think of this like upgrading from a manual transmission (managing wallet connection
 * and user authentication separately) to an automatic transmission (Privy handles
 * the complexity of coordination for you).
 */
export function useWalletConnect(): UseWalletConnectReturn {
  // CORRECTED: Proper Privy authentication hooks
  const { 
    user, 
    ready, 
    authenticated, 
    login, 
    logout: privyLogout,
    connectWallet
  } = usePrivy()
  
  // CORRECTED: Wagmi hooks for blockchain interaction - these work the same as before
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain() // FIXED: This is the correct import and usage
  
  // Enhanced Web3 context for smart account features
  const {
    smartAccount,
    smartAccountAddress,
    isSmartAccountDeployed,
    accountType,
    createSmartAccountAsync,
    hasAdvancedFeatures
  } = useEnhancedWeb3()
  
  // Local state for error handling and UI feedback
  const [error, setError] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)

  /**
   * Connection Status Logic - CORRECTED VERSION
   * 
   * This logic properly maps Privy's authentication states to your application's needs.
   * Privy's authentication system provides more nuanced states than traditional
   * wallet-only connection, which allows for better user experience.
   * 
   * Think of this like a traffic light system - instead of just "red" and "green"
   * (disconnected/connected), we now have "yellow" states that represent
   * intermediate authentication states that improve the user experience.
   */
  const status: WalletConnectionStatus = useMemo(() => {
    if (!ready) return 'connecting'
    if (error) return 'error'
    if (authenticated && isConnected && address) return 'connected'
    if (authenticated) return 'authenticated'
    return 'disconnected'
  }, [ready, authenticated, isConnected, address, error])

  /**
   * User Information - CORRECTED VERSION
   * 
   * This extracts rich user context from Privy's user object.
   * Unlike traditional wallet connections that only give you an address,
   * Privy provides comprehensive user information that helps you create
   * more personalized and user-friendly experiences.
   */
  const userInfo: UserInfo = useMemo(() => {
    if (!user) {
      return {
        id: null,
        email: null,
        phone: null,
        walletAddress: null,
        hasEmbeddedWallet: false,
        loginMethod: null
      }
    }

    // Extract wallet address from Privy's user object
    const walletAddress = user.wallet?.address || null
    
    // Check if user has an embedded wallet (created by Privy)
    const hasEmbeddedWallet = user.wallet?.walletClientType === 'privy'
    
    // Determine primary login method - this helps you understand how the user prefers to authenticate
    const loginMethod = user.email ? 'email' : 
                       user.phone ? 'phone' : 
                       user.wallet ? 'wallet' : 
                       user.google ? 'google' :
                       user.twitter ? 'twitter' :
                       user.discord ? 'discord' :
                       'unknown'

    return {
      id: user.id,
      email: user.email?.address || null,
      phone: user.phone?.number || null,
      walletAddress,
      hasEmbeddedWallet,
      loginMethod
    }
  }, [user])

  /**
   * Network Information - preserved from your current implementation
   * This helps your application understand which blockchain networks are supported
   */
  const { network, isCorrectNetwork, supportedNetworks } = useMemo(() => {
    const supportedChains = [
      { id: 8453, name: 'Base Mainnet', blockExplorer: 'https://basescan.org' },
      { id: 84532, name: 'Base Sepolia', blockExplorer: 'https://sepolia.basescan.org' }
    ]
    
    const currentNetwork = supportedChains.find(chain => chain.id === chainId)
    const isSupported = Boolean(currentNetwork)
    
    return {
      network: currentNetwork ? {
        ...currentNetwork,
        isSupported: true
      } : null,
      isCorrectNetwork: isSupported,
      supportedNetworks: supportedChains.map(chain => ({
        ...chain,
        isSupported: true
      }))
    }
  }, [chainId])

  /**
   * Smart Account Information - enhanced for Privy context
   * This preserves your existing smart account functionality while integrating with Privy's user context
   */
  const smartAccountInfo: SmartAccountInfo = useMemo(() => {
    const canUpgrade = Boolean(
      authenticated && 
      address && 
      !smartAccount && 
      hasAdvancedFeatures &&
      accountType === 'eoa'
    )

    return {
      isEnabled: Boolean(smartAccount && smartAccountAddress),
      address: smartAccountAddress,
      isDeployed: isSmartAccountDeployed,
      canSponsorGas: Boolean(smartAccount && hasAdvancedFeatures),
    benefits: [
      'Gasless transactions',
        'Batch operations', 
      'Enhanced security',
        'Recovery options'
      ],
      canUpgrade
    }
  }, [smartAccount, smartAccountAddress, isSmartAccountDeployed, hasAdvancedFeatures, authenticated, address, accountType])

  /**
   * Address Formatting - preserved utility from current setup
   * This creates user-friendly display versions of long wallet addresses
   */
  const formattedAddress = useMemo(() => {
    return address ? formatAddress(address) : null
  }, [address])

  /**
   * Network Switching - CORRECTED VERSION
   * This properly uses wagmi's switchChain function with enhanced error handling
   */
  const handleSwitchNetwork = useCallback((targetChainId: number) => {
    try {
      setError(null)
      console.log(`🔄 Switching to network ${targetChainId}`)
      switchChain({ chainId: targetChainId })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch networks'
      setError(errorMessage)
      console.error('Network switch error:', err)
    }
  }, [switchChain])

  /**
   * Smart Account Upgrade - preserved functionality with Privy context
   * This maintains your existing smart account upgrade flow while working with Privy's authentication
   */
  const handleUpgradeToSmartAccount = useCallback(async (): Promise<boolean> => {
    if (!smartAccountInfo.canUpgrade) {
      setError('Cannot upgrade to smart account at this time')
      return false
    }

    try {
      setIsUpgrading(true)
      setError(null)
      
      console.log('🚀 Starting smart account upgrade...')
      const account = await createSmartAccountAsync()
      const success = Boolean(account)
      
      if (success) {
        console.log('✅ Smart account upgrade successful')
      } else {
        console.log('❌ Smart account upgrade failed')
      }
      
      return success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade to smart account'
      setError(errorMessage)
      console.error('Smart account upgrade error:', err)
      return false
    } finally {
      setIsUpgrading(false)
    }
  }, [smartAccountInfo.canUpgrade, createSmartAccountAsync])

  /**
   * Enhanced Logout - clears all authentication state
   * This is more comprehensive than traditional wallet disconnection because
   * it clears the entire user authentication session, not just wallet connection
   */
  const handleLogout = useCallback(async () => {
    try {
      setError(null)
      console.log('🚪 Logging out user...')
      await privyLogout()
      console.log('✅ User logged out successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout'
      setError(errorMessage)
      console.error('Logout error:', err)
    }
  }, [privyLogout])

  /**
   * Error Management
   * Simple function to clear error messages and let users try again
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  // CORRECTED: Return object that maintains compatibility while adding Privy features
  return {
    // Connection State
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isAuthenticated: authenticated,
    status,
    address: address || null,
    formattedAddress,
    
    // User Information - this is new with Privy and provides rich user context
    user: userInfo,
    
    // Network Information - preserved from your current setup
    network,
    isCorrectNetwork,
    supportedNetworks,
    
    // Smart Account Features - preserved and enhanced
    smartAccount: smartAccountInfo,
    canUpgradeToSmartAccount: smartAccountInfo.canUpgrade,
    isUpgrading,
    
    // Actions - simplified with Privy's unified authentication
    login,                    // Opens Privy's authentication modal with all available options
    logout: handleLogout,     // Comprehensive logout that clears all authentication state
    connectWallet,           // Connects additional wallet to existing authenticated account
    switchNetwork: handleSwitchNetwork,  // Network switching with proper error handling
    upgradeToSmartAccount: handleUpgradeToSmartAccount,  // Smart account upgrade flow
    
    // UI State
    error,
    clearError,
    showNetworkWarning: !isCorrectNetwork && isConnected
  }
} 
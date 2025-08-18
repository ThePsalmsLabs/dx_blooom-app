/**
 * Privy-based Wallet Connection Hook
 * File: src/hooks/web3/useWalletConnect.ts
 * 
 * This hook replaces your RainbowKit-based useWalletConnect hook with Privy's
 * authentication system. The key insight is that Privy treats wallet connection
 * as part of user authentication, which simplifies the overall flow.
 * 
 * Key differences from RainbowKit approach:
 * - Privy handles both wallet connection AND user authentication
 * - Users can connect via wallet, email, phone, or social login
 * - Embedded wallets are created automatically for users without wallets
 * - The authentication state is more comprehensive than just wallet connection
 * 
 * This preserves the same API as your current hook while leveraging Privy's
 * enhanced capabilities under the hood.
 */

import { useCallback, useMemo, useState } from 'react'
import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { useEnhancedWeb3 } from '@/components/providers/Web3Provider'
import { formatAddress } from '@/lib/utils'
import { type Address } from 'viem'

/**
 * Enhanced Wallet Connection Status
 * Privy's authentication system provides more granular states than just connected/disconnected
 */
export type WalletConnectionStatus = 
  | 'disconnected'        // No user session
  | 'connecting'          // Authentication in progress
  | 'connected'           // User authenticated and wallet connected
  | 'authenticated'       // User authenticated but no wallet (e.g., email-only login)
  | 'error'              // Authentication or connection error

/**
 * Network Information - preserved from your current setup
 */
export interface NetworkInfo {
  readonly id: number
  readonly name: string
  readonly isSupported: boolean
  readonly blockExplorer: string
}

/**
 * Smart Account Information - enhanced with Privy's user context
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
 * Privy provides rich user context beyond just wallet addresses
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
  readonly login: () => void                 // Replaces connect - opens Privy's auth modal
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
 * Main Wallet Connection Hook
 * 
 * This hook demonstrates how Privy simplifies wallet connection by treating it
 * as part of a broader authentication system. Instead of just connecting wallets,
 * users authenticate with your app and can then connect wallets, use embedded wallets,
 * or even use the app without a wallet initially.
 */
export function useWalletConnect(): UseWalletConnectReturn {
  // Privy authentication hooks - these replace RainbowKit's connection hooks
  const { 
    user, 
    ready, 
    authenticated, 
    login, 
    logout: privyLogout,
    connectWallet,
    linkEmail,
    linkPhone 
  } = usePrivy()
  
  // Wagmi hooks for blockchain interaction - these remain the same
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  // Enhanced Web3 context for smart account features
  const {
    smartAccount,
    smartAccountAddress,
    isSmartAccountDeployed,
    accountType,
    createSmartAccountAsync,
    hasAdvancedFeatures
  } = useEnhancedWeb3()
  
  // Local state for error handling
  const [error, setError] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)

  /**
   * Connection Status Logic
   * 
   * Privy's authentication system provides more nuanced states than traditional
   * wallet-only connection. A user might be authenticated via email but not have
   * a wallet connected, or they might have an embedded wallet that's automatically
   * connected. This logic maps Privy's states to your existing status enum.
   */
  const status: WalletConnectionStatus = useMemo(() => {
    if (!ready) return 'connecting'
    if (error) return 'error'
    if (authenticated && isConnected && address) return 'connected'
    if (authenticated) return 'authenticated'
    return 'disconnected'
  }, [ready, authenticated, isConnected, address, error])

  /**
   * User Information
   * 
   * Privy provides rich user context that goes beyond just wallet addresses.
   * This includes email, phone, embedded wallet status, and login method.
   * This information can be useful for personalizing the user experience.
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
    
    // Check if user has an embedded wallet
    const hasEmbeddedWallet = user.wallet?.walletClientType === 'privy'
    
    // Determine primary login method
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
        isSupported: true,
        rpcUrl: '' // Add if needed
      }))
    }
  }, [chainId])

  /**
   * Smart Account Information - enhanced for Privy context
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
   */
  const formattedAddress = useMemo(() => {
    return address ? formatAddress(address) : null
  }, [address])

  /**
   * Network Switching - enhanced error handling
   */
  const handleSwitchNetwork = useCallback((targetChainId: number) => {
    try {
      setError(null)
      switchChain({ chainId: targetChainId })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch networks'
      setError(errorMessage)
      console.error('Network switch error:', err)
    }
  }, [switchChain])

  /**
   * Smart Account Upgrade - preserved functionality with Privy context
   */
  const handleUpgradeToSmartAccount = useCallback(async (): Promise<boolean> => {
    if (!smartAccountInfo.canUpgrade) {
      setError('Cannot upgrade to smart account at this time')
      return false
    }

    try {
      setIsUpgrading(true)
      setError(null)
      
      const account = await createSmartAccountAsync()
      return Boolean(account)
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
   */
  const handleLogout = useCallback(async () => {
    try {
      setError(null)
      await privyLogout()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout'
      setError(errorMessage)
      console.error('Logout error:', err)
    }
  }, [privyLogout])

  /**
   * Error Management
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Connection State
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isAuthenticated: authenticated,
    status,
    address: address || null,
    formattedAddress,
    
    // User Information
    user: userInfo,
    
    // Network Information
    network,
    isCorrectNetwork,
    supportedNetworks,
    
    // Smart Account Features
    smartAccount: smartAccountInfo,
    canUpgradeToSmartAccount: smartAccountInfo.canUpgrade,
    isUpgrading,
    
    // Actions
    login,
    logout: handleLogout,
    connectWallet,
    switchNetwork: handleSwitchNetwork,
    upgradeToSmartAccount: handleUpgradeToSmartAccount,
    
    // UI State
    error,
    clearError,
    showNetworkWarning: !isCorrectNetwork && isConnected
  }
}
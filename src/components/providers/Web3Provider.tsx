'use client'

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  type ReactNode 
} from 'react'
import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
import { useAccount, useChainId } from 'wagmi'
import { WagmiProvider, createConfig } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'viem/chains'
import { http } from 'viem'
import { type Address } from 'viem'
import { BiconomySmartAccountV2 } from '@biconomy/account'
import { createSmartAccount } from '@/lib/biconomy/config'

// Create QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

// Create Wagmi config for Privy
const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
})

/**
 * Environment Configuration
 * Note: Privy uses different environment variables than RainbowKit
 */
interface EnvironmentConfig {
  readonly privyAppId: string
  readonly biconomyPaymasterApiKey: string
  readonly biconomyBundlerUrl: string
  readonly hasAdvancedFeatures: boolean
}

function createEnvironmentConfig(): EnvironmentConfig {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''
  const biconomyPaymasterApiKey = process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY ?? ''
  const biconomyBundlerUrl = process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL ?? ''

  return {
    privyAppId,
    biconomyPaymasterApiKey,
    biconomyBundlerUrl,
    hasAdvancedFeatures: Boolean(biconomyPaymasterApiKey && biconomyBundlerUrl),
  }
}

// Create environment configuration once to avoid repeated processing
const envConfig = createEnvironmentConfig()

/**
 * Account types for our enhanced Web3 system
 */
export type AccountType = 'disconnected' | 'eoa' | 'smart_account'

/**
 * Enhanced Web3 Context - Similar structure to your current setup but Privy-powered
 */
interface EnhancedWeb3ContextType {
  // Core wallet state
  address: Address | null
  isConnected: boolean
  isConnecting: boolean
  chainId: number
  
  // Smart Account features (preserved from your current setup)
  smartAccount: BiconomySmartAccountV2 | null
  smartAccountAddress: Address | null
  isSmartAccountDeployed: boolean
  accountType: AccountType
  
  // Actions
  createSmartAccountAsync: () => Promise<BiconomySmartAccountV2 | null>
  refreshSmartAccountStatus: () => Promise<void>
  
  // Configuration
  hasAdvancedFeatures: boolean
}

const EnhancedWeb3Context = createContext<EnhancedWeb3ContextType | null>(null)

/**
 * Privy Configuration
 * This replaces your RainbowKit configuration
 */
const privyConfig = {
  // Embed wallet options
  embeddedWallets: {
    createOnLogin: 'users-without-wallets' as const,
    noPromptOnSignature: false,
  },
  
  // Login methods - customize based on your needs
  loginMethods: ['wallet', 'email', 'sms'] as ('wallet' | 'email' | 'sms')[],
  
  // Appearance customization
  appearance: {
    theme: 'light' as const,
    accentColor: '#676FFF' as `#${string}`,
  },
  
  // Default chain configuration
  defaultChain: baseSepolia, // Change to base for production
  supportedChains: [base, baseSepolia],
}

/**
 * Inner provider that uses Privy's Wagmi integration
 * This component handles the Wagmi setup after Privy is initialized
 */
function PrivyWagmiProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  )
}

/**
 * Enhanced Web3 Provider Implementation
 * This preserves your smart account functionality while using Privy for wallet connection
 */
function EnhancedWeb3ProviderInner({ children }: { children: ReactNode }) {
  const { user, ready, authenticated } = usePrivy()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Smart Account state (preserved from your current implementation)
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null)
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null)
  const [isSmartAccountDeployed, setIsSmartAccountDeployed] = useState(false)

  /**
   * Determine account type based on connection status and smart account
   */
  const accountType: AccountType = useMemo(() => {
    if (!isConnected || !address) return 'disconnected'
    if (smartAccount && smartAccountAddress) return 'smart_account'
    return 'eoa'
  }, [isConnected, address, smartAccount, smartAccountAddress])

  /**
   * Create Smart Account - preserved functionality from your current setup
   */
  const createSmartAccountAsync = useCallback(async (): Promise<BiconomySmartAccountV2 | null> => {
    if (!address || !envConfig.hasAdvancedFeatures) {
      console.log('Cannot create smart account: missing address or advanced features not configured')
      return null
    }

    try {
      console.log('🚀 Creating smart account for address:', address)
      
      const account = await createSmartAccount(address as any, chainId)
      if (!account) {
        throw new Error('Failed to create smart account')
      }
      
      const accountAddress = await account.getAccountAddress()
      
      setSmartAccount(account)
      setSmartAccountAddress(accountAddress as Address)
      
      // Check if deployed by getting the account state
      const isDeployed = await account.isAccountDeployed()
      setIsSmartAccountDeployed(isDeployed)
      
      console.log('✅ Smart account created:', {
        address: accountAddress,
        deployed: isDeployed
      })
      
      return account
    } catch (error) {
      console.error('❌ Failed to create smart account:', error)
      return null
    }
  }, [address, chainId])

  /**
   * Refresh Smart Account Status
   */
  const refreshSmartAccountStatus = useCallback(async () => {
    if (!smartAccount || !smartAccountAddress) return

    try {
      const isDeployed = await smartAccount.isAccountDeployed()
      setIsSmartAccountDeployed(isDeployed)
    } catch (error) {
      console.error('Failed to refresh smart account status:', error)
    }
  }, [smartAccount, smartAccountAddress])

  // Auto-create smart account when user connects (if you want this behavior)
  useEffect(() => {
    if (isConnected && address && !smartAccount && envConfig.hasAdvancedFeatures) {
      createSmartAccountAsync()
    }
  }, [isConnected, address, smartAccount, createSmartAccountAsync])

  const contextValue: EnhancedWeb3ContextType = {
    // Core state
    address: address || null,
    isConnected,
    isConnecting: !ready, // Privy's ready state indicates loading
    chainId,
    
    // Smart Account state
    smartAccount,
    smartAccountAddress,
    isSmartAccountDeployed,
    accountType,
    
    // Actions
    createSmartAccountAsync,
    refreshSmartAccountStatus,
    
    // Configuration
    hasAdvancedFeatures: envConfig.hasAdvancedFeatures,
  }

  return (
    <EnhancedWeb3Context.Provider value={contextValue}>
      {children}
    </EnhancedWeb3Context.Provider>
  )
}

/**
 * Main Web3 Provider Component
 * This replaces your current Web3Provider
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  if (!envConfig.privyAppId) {
    console.error('❌ NEXT_PUBLIC_PRIVY_APP_ID is required but not provided')
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-semibold">Configuration Error</h3>
        <p className="text-red-600">
          NEXT_PUBLIC_PRIVY_APP_ID environment variable is required.
          Please add it to your .env.local file.
        </p>
      </div>
    )
  }

  return (
    <PrivyProvider
      appId={envConfig.privyAppId}
      config={privyConfig}
    >
      <PrivyWagmiProvider>
        <EnhancedWeb3ProviderInner>
          {children}
        </EnhancedWeb3ProviderInner>
      </PrivyWagmiProvider>
    </PrivyProvider>
  )
}

/**
 * Hook to use the Enhanced Web3 Context
 * This preserves your existing API while using Privy under the hood
 */
export function useEnhancedWeb3(): EnhancedWeb3ContextType {
  const context = useContext(EnhancedWeb3Context)
  if (!context) {
    throw new Error('useEnhancedWeb3 must be used within a Web3Provider')
  }
  return context
}

// Export alias for backward compatibility
export const EnhancedWeb3Provider = Web3Provider

// Re-export Privy hooks for direct use when needed
export { usePrivy, useLogin, useLogout } from '@privy-io/react-auth'
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
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider, createConfig } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'viem/chains'
import { type Address } from 'viem'
import { BiconomySmartAccountV2 } from '@biconomy/account'
import { useChainId } from 'wagmi'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { usePrivy } from '@privy-io/react-auth'
import { debug } from '@/lib/utils/debug'

// Create QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

/**
 * Environment Configuration
 * This is the corrected version that properly handles Privy configuration
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

  debug.log('🔧 Environment Configuration:', {
    hasPrivyAppId: Boolean(privyAppId),
    hasBiconomyKeys: Boolean(biconomyPaymasterApiKey && biconomyBundlerUrl),
    privyAppIdLength: privyAppId.length
  })

  return {
    privyAppId,
    biconomyPaymasterApiKey,
    biconomyBundlerUrl,
    hasAdvancedFeatures: Boolean(biconomyPaymasterApiKey && biconomyBundlerUrl),
  }
}

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
 * Privy Configuration - CORRECTED VERSION
 * This is the proper way to configure Privy for your application
 */
const privyConfig = {
  // Embedded wallet configuration
  embeddedWallets: {
    createOnLogin: 'users-without-wallets' as const,
    noPromptOnSignature: false,
  },
  
  // Login methods - these are the authentication options your users will see
  loginMethods: ['wallet', 'email', 'sms', 'google', 'farcaster'] as ('wallet' | 'email' | 'sms' | 'google' | 'farcaster')[],
  
  // Appearance customization
  appearance: {
    theme: 'light' as const,
    accentColor: '#676FFF' as `#${string}`,
    logo: undefined, // Add your logo URL here if you have one
  },
  
  // Default chain configuration - FIXED: Use mainnet by default
  defaultChain: base, // Changed from baseSepolia to base (mainnet)
  supportedChains: [base, baseSepolia],
  
  // Additional configuration for better UX
  legal: {
    termsAndConditionsUrl: undefined, // Add your T&C URL
    privacyPolicyUrl: undefined, // Add your privacy policy URL
  }
}

/**
 * CRITICAL FIX: Privy Wagmi Provider Component
 * This component properly integrates Privy's wagmi configuration
 * Now uses Privy's WagmiProvider and createConfig for proper synchronization
 */
function PrivyWagmiProvider({ children }: { children: ReactNode }) {
  // Create wagmi config using Privy's createConfig for proper synchronization
  const wagmiConfig = useMemo(() => {
    // Dynamic import to get the enhanced transport configuration
    const { base, baseSepolia } = require('viem/chains')
    const { http, fallback } = require('wagmi')

    // Create the same multi-tier RPC configuration but with Privy's createConfig
    const premiumProviders = []
    const alternativeProviders = []

    // Premium providers (same as enhanced config but using http from wagmi)
    if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
      premiumProviders.push(
        http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
      )
    }

    if (process.env.NEXT_PUBLIC_INFURA_API_KEY) {
      premiumProviders.push(
        http(`https://base-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`)
      )
    }

    // Base mainnet as fallback
    alternativeProviders.push(http('https://mainnet.base.org'))

    const transports = {
      [base.id]: fallback(premiumProviders.length > 0 ? premiumProviders : alternativeProviders),
      [baseSepolia.id]: http('https://sepolia.base.org')
    }

    return createConfig({
      chains: [base, baseSepolia],
      transports,
      batch: {
        multicall: {
          batchSize: 1024 * 200,
          wait: 8,
        },
      },
      cacheTime: 2_000,
      ssr: typeof window === 'undefined'
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  )
}

/**
 * Enhanced Web3 Provider Implementation - CORRECTED VERSION
 * This component properly uses Privy's authentication state and integrates with wagmi
 */
function EnhancedWeb3ProviderInner({ children }: { children: ReactNode }) {
  const { user, ready, authenticated } = usePrivy()
  const walletUI = useWalletConnectionUI()
  const chainId = useChainId()
  
  // Smart Account state (preserved from your current implementation)
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null)
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null)
  const [isSmartAccountDeployed, setIsSmartAccountDeployed] = useState(false)

  // Debug logging to help identify issues (disabled for production)
  useEffect(() => {
    debug.wallet('🔍 Privy State Debug:', {
      ready,
      authenticated,
      hasUser: Boolean(user),
      userWallet: user?.wallet?.address,
      unifiedConnected: walletUI.isConnected,
      unifiedAddress: walletUI.address,
      chainId
    })
  }, [ready, authenticated, user, walletUI.isConnected, walletUI.address, chainId])

  /**
   * Determine account type based on connection status and smart account
   */
  const accountType: AccountType = useMemo(() => {
    if (!walletUI.isConnected || !walletUI.address) return 'disconnected'
    if (smartAccount && smartAccountAddress) return 'smart_account'
    return 'eoa'
  }, [walletUI.isConnected, walletUI.address, smartAccount, smartAccountAddress])

  /**
   * Create Smart Account - preserved functionality from your current setup
   */
  const createSmartAccountAsync = useCallback(async (): Promise<BiconomySmartAccountV2 | null> => {
    if (!walletUI.address || !envConfig.hasAdvancedFeatures) {
      debug.warn('❌ Cannot create smart account: missing address or advanced features not configured')
      return null
    }

    try {
      debug.wallet('🚀 Creating smart account for address:', walletUI.address)
      
      // For now, return null since we need a proper signer implementation
      // This will be implemented when we have the full wallet integration
      debug.warn('⚠️ Smart account creation requires proper signer implementation')
      return null
      
    } catch (error) {
      console.error('❌ Failed to create smart account:', error)
      return null
    }
  }, [walletUI.address, chainId])

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
    if (walletUI.isConnected && walletUI.address && !smartAccount && envConfig.hasAdvancedFeatures) {
      debug.wallet('🔄 Auto-creating smart account for connected user')
      createSmartAccountAsync()
    }
  }, [walletUI.isConnected, walletUI.address, smartAccount, createSmartAccountAsync])

  const contextValue: EnhancedWeb3ContextType = {
    // Core state
    address: walletUI.address as `0x${string}` | null,
    isConnected: walletUI.isConnected,
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
 * Main Web3 Provider Component - CORRECTED VERSION
 * This is the component that should wrap your entire application
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  // Enhanced error checking and user-friendly error messages
  if (!envConfig.privyAppId) {
    console.error('❌ NEXT_PUBLIC_PRIVY_APP_ID is required but not provided')
    console.error('📝 To fix this:')
    console.error('   1. Go to https://console.privy.io/')
    console.error('   2. Create an account and new app')
    console.error('   3. Copy your App ID')
    console.error('   4. Add NEXT_PUBLIC_PRIVY_APP_ID=your_app_id to your .env.local file')
    console.error('   5. Restart your development server')
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Configuration Required</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Your application needs to be configured with a Privy App ID to enable wallet connections.
          </p>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p className="font-medium mb-2">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Visit <a href="https://console.privy.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.privy.io</a></li>
              <li>Create an account and new app</li>
              <li>Copy your App ID</li>
              <li>Add <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_PRIVY_APP_ID=your_app_id</code> to .env.local</li>
              <li>Restart your development server</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  debug.wallet('🚀 Initializing Privy Provider with App ID:', envConfig.privyAppId.slice(0, 8) + '...')

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
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

  // Login methods - FIXED: Remove conflicting social logins to prevent auth conflicts
  // Temporarily disable 'google' and 'farcaster' as they conflict with custom implementation
  loginMethods: ['wallet', 'email', 'sms'] as ('wallet' | 'email' | 'sms')[],

  // Wallet configuration - ensure all wallet types are supported
  walletList: [
    'metamask',
    'phantom',
    'coinbase_wallet',
    'walletconnect',
    'rainbow',
    'trust_wallet',
    'argent',
    'imtoken',
    'zerion'
  ] as const,

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
  },

  // CRITICAL: Add domain configuration for production
  clientId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  
  // Ensure correct redirect handling for production
  loginConfig: {
    landingHeader: 'Welcome to Bloom',
    landingSubheader: 'Connect your wallet to get started',
  }
}

/**
 * Enhanced Wagmi Provider Component
 * Uses the enhanced wagmi configuration with Farcaster connector support
 */
function EnhancedWagmiProvider({ children }: { children: ReactNode }) {
  const [wagmiConfig, setWagmiConfig] = useState<ReturnType<typeof createConfig> | null>(null)
  const [configError, setConfigError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize enhanced wagmi config on mount
  useEffect(() => {
    const initializeConfig = async () => {
      try {
        setIsLoading(true)
        setConfigError(null)
        
        // Import production config with fixed RPC setup
        const { getProductionWagmiConfig } = await import('@/lib/web3/production-wagmi-config')
        const config = getProductionWagmiConfig()
        
        debug.log('✅ Production wagmi config initialized with fixed RPC setup')
        setWagmiConfig(config)
      } catch (error) {
        console.error('❌ Failed to initialize production wagmi config:', error)
        setConfigError(error as Error)
        
        // Fallback to basic config with fixed endpoints
        const { http } = await import('wagmi')
        const { getCurrentChainConfig } = await import('@/lib/web3/fixed-rpc-config')
        
        try {
          const { chain, transport } = getCurrentChainConfig()
          const fallbackConfig = createConfig({
            chains: [chain],
            transports: {
              [chain.id]: transport
            },
            ssr: typeof window === 'undefined'
          })
          
          console.log('⚠️ Using minimal fallback wagmi config')
          setWagmiConfig(fallbackConfig)
        } catch (fallbackError) {
          console.error('❌ Even fallback config failed:', fallbackError)
          // Last resort - basic HTTP transport
          const basicConfig = createConfig({
            chains: [base],
            transports: {
              [base.id]: http('https://base.llamarpc.com')
            },
            ssr: typeof window === 'undefined'
          })
          setWagmiConfig(basicConfig)
        }
      } finally {
        setIsLoading(false)
      }
    }

    initializeConfig()
  }, [])

  // Show loading state while initializing config
  if (isLoading || !wagmiConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Initializing Web3...</p>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  )
}

/**
 * Enhanced Web3 Provider Implementation - FIXED VERSION
 * Uses Privy's authentication state exclusively for consistent wallet state
 */
function EnhancedWeb3ProviderInner({ children }: { children: ReactNode }) {
  const { user, ready, authenticated } = usePrivy()
  const chainId = useChainId()
  
  // Remove walletUI usage - use Privy exclusively
  
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
      chainId
    })
  }, [ready, authenticated, user, chainId])

  /**
   * Determine account type based on Privy connection status
   */
  const accountType: AccountType = useMemo(() => {
    if (!authenticated || !user?.wallet?.address) return 'disconnected'
    if (smartAccount && smartAccountAddress) return 'smart_account'
    return 'eoa'
  }, [authenticated, user?.wallet?.address, smartAccount, smartAccountAddress])

  /**
   * Create Smart Account - use Privy wallet address
   */
  const createSmartAccountAsync = useCallback(async (): Promise<BiconomySmartAccountV2 | null> => {
    const walletAddress = user?.wallet?.address
    if (!walletAddress || !envConfig.hasAdvancedFeatures) {
      debug.warn('❌ Cannot create smart account: missing address or advanced features not configured')
      return null
    }

    try {
      debug.wallet('🚀 Creating smart account for address:', walletAddress)
      
      // For now, return null since we need a proper signer implementation
      // This will be implemented when we have the full wallet integration
      debug.warn('⚠️ Smart account creation requires proper signer implementation')
      return null
      
    } catch (error) {
      console.error('❌ Failed to create smart account:', error)
      return null
    }
  }, [user?.wallet?.address, chainId])

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
    const walletAddress = user?.wallet?.address
    if (authenticated && walletAddress && !smartAccount && envConfig.hasAdvancedFeatures) {
      debug.wallet('🔄 Auto-creating smart account for connected user')
      createSmartAccountAsync()
    }
  }, [authenticated, user?.wallet?.address, smartAccount, createSmartAccountAsync])

  const contextValue: EnhancedWeb3ContextType = {
    // Core state - use Privy's wallet state exclusively
    address: user?.wallet?.address as `0x${string}` | null,
    isConnected: authenticated && Boolean(user?.wallet?.address),
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
      <EnhancedWagmiProvider>
          <EnhancedWeb3ProviderInner>
            {children}
          </EnhancedWeb3ProviderInner>
      </EnhancedWagmiProvider>
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
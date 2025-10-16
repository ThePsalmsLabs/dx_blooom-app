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
import { WagmiProvider as PrivyWagmiProvider, createConfig } from '@privy-io/wagmi'
import { WagmiProvider as VanillaWagmiProvider, useAccount, useChainId } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base, baseSepolia } from 'viem/chains'
import { type Address } from 'viem'
import { BiconomySmartAccountV2 } from '@biconomy/account'
import { usePrivy } from '@privy-io/react-auth'
import { debug } from '@/lib/utils/debug'
import { usePathname } from 'next/navigation'
import { isLikelyMiniAppContext } from '@/lib/utils/farcaster-detection'

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
 * Enhanced Web3 Context - Unified interface for both web and miniapp contexts
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

  // Context information
  isMiniAppContext: boolean
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
 * Wagmi Configuration Provider
 * Loads production wagmi config and wraps with appropriate provider based on context
 */
function WagmiConfigProvider({
  children,
  usePrivyWrapper = false
}: {
  children: ReactNode
  usePrivyWrapper?: boolean
}) {
  const [wagmiConfig, setWagmiConfig] = useState<ReturnType<typeof createConfig> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeConfig = async () => {
      try {
        setIsLoading(true)

        // Import production config with Farcaster connector
        const { getProductionWagmiConfig } = await import('@/lib/web3/production-wagmi-config')
        const config = getProductionWagmiConfig()

        debug.log('✅ Production wagmi config initialized', {
          usePrivyWrapper,
          connectorsCount: config.connectors?.length || 0
        })

        setWagmiConfig(config)
      } catch (error) {
        console.error('❌ Failed to initialize wagmi config:', error)

        // Fallback to basic config
        const { http } = await import('wagmi')
        const basicConfig = createConfig({
          chains: [base],
          transports: {
            [base.id]: http('https://base.llamarpc.com')
          },
          ssr: typeof window === 'undefined'
        })
        setWagmiConfig(basicConfig)
      } finally {
        setIsLoading(false)
      }
    }

    initializeConfig()
  }, [usePrivyWrapper])

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

  // Use appropriate WagmiProvider based on context
  const WagmiProviderComponent = usePrivyWrapper ? PrivyWagmiProvider : VanillaWagmiProvider

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProviderComponent config={wagmiConfig} reconnectOnMount={true}>
        {children}
      </WagmiProviderComponent>
    </QueryClientProvider>
  )
}

/**
 * Web Context Provider - Uses Privy for authentication
 */
function WebContextProvider({ children }: { children: ReactNode }) {
  const { user, ready, authenticated } = usePrivy()
  const chainId = useChainId()

  const [smartAccount] = useState<BiconomySmartAccountV2 | null>(null)
  const [smartAccountAddress] = useState<Address | null>(null)
  const [isSmartAccountDeployed, setIsSmartAccountDeployed] = useState(false)

  useEffect(() => {
    debug.wallet('🌐 Web Context - Privy State:', {
      ready,
      authenticated,
      hasUser: Boolean(user),
      userWallet: user?.wallet?.address,
      chainId
    })
  }, [ready, authenticated, user, chainId])

  const accountType: AccountType = useMemo(() => {
    if (!authenticated || !user?.wallet?.address) return 'disconnected'
    if (smartAccount && smartAccountAddress) return 'smart_account'
    return 'eoa'
  }, [authenticated, user?.wallet?.address, smartAccount, smartAccountAddress])

  const createSmartAccountAsync = useCallback(async (): Promise<BiconomySmartAccountV2 | null> => {
    debug.warn('⚠️ Smart account creation not implemented yet')
    return null
  }, [])

  const refreshSmartAccountStatus = useCallback(async () => {
    if (!smartAccount || !smartAccountAddress) return

    try {
      const isDeployed = await smartAccount.isAccountDeployed()
      setIsSmartAccountDeployed(isDeployed)
    } catch (error) {
      console.error('Failed to refresh smart account status:', error)
    }
  }, [smartAccount, smartAccountAddress])

  const contextValue: EnhancedWeb3ContextType = {
    address: user?.wallet?.address as `0x${string}` | null,
    isConnected: authenticated && Boolean(user?.wallet?.address),
    isConnecting: !ready,
    chainId,
    smartAccount,
    smartAccountAddress,
    isSmartAccountDeployed,
    accountType,
    createSmartAccountAsync,
    refreshSmartAccountStatus,
    hasAdvancedFeatures: envConfig.hasAdvancedFeatures,
    isMiniAppContext: false, // ← Web context
  }

  return (
    <EnhancedWeb3Context.Provider value={contextValue}>
      {children}
    </EnhancedWeb3Context.Provider>
  )
}

/**
 * MiniApp Context Provider - Uses vanilla Wagmi (no Privy)
 */
function MiniAppContextProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const [smartAccount] = useState<BiconomySmartAccountV2 | null>(null)
  const [smartAccountAddress] = useState<Address | null>(null)
  const [isSmartAccountDeployed, setIsSmartAccountDeployed] = useState(false)

  useEffect(() => {
    debug.wallet('📱 MiniApp Context - Wagmi State:', {
      address,
      isConnected,
      chainId
    })
  }, [address, isConnected, chainId])

  const accountType: AccountType = useMemo(() => {
    if (!isConnected || !address) return 'disconnected'
    if (smartAccount && smartAccountAddress) return 'smart_account'
    return 'eoa'
  }, [isConnected, address, smartAccount, smartAccountAddress])

  const createSmartAccountAsync = useCallback(async (): Promise<BiconomySmartAccountV2 | null> => {
    debug.warn('⚠️ Smart account creation not implemented yet')
    return null
  }, [])

  const refreshSmartAccountStatus = useCallback(async () => {
    if (!smartAccount || !smartAccountAddress) return

    try {
      const isDeployed = await smartAccount.isAccountDeployed()
      setIsSmartAccountDeployed(isDeployed)
    } catch (error) {
      console.error('Failed to refresh smart account status:', error)
    }
  }, [smartAccount, smartAccountAddress])

  const contextValue: EnhancedWeb3ContextType = {
    address: address || null,
    isConnected: isConnected,
    isConnecting: false,
    chainId,
    smartAccount,
    smartAccountAddress,
    isSmartAccountDeployed,
    accountType,
    createSmartAccountAsync,
    refreshSmartAccountStatus,
    hasAdvancedFeatures: envConfig.hasAdvancedFeatures,
    isMiniAppContext: true, // ← MiniApp context
  }

  return (
    <EnhancedWeb3Context.Provider value={contextValue}>
      {children}
    </EnhancedWeb3Context.Provider>
  )
}

/**
 * Main Web3 Provider - Context-Aware
 * Automatically detects context and uses appropriate provider stack
 */
export function Web3Provider({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Detect MiniApp context using heuristic (synchronous)
  const isMiniApp = useMemo(() => {
    return isLikelyMiniAppContext()
  }, [pathname])

  debug.log('🔍 Web3Provider Context Detection:', {
    isMiniApp,
    pathname,
    envConfigValid: Boolean(envConfig.privyAppId)
  })

  // MiniApp context - use vanilla Wagmi (no Privy)
  if (isMiniApp) {
    debug.log('📱 Using MiniApp Web3 stack (Vanilla Wagmi)')

    return (
      <WagmiConfigProvider usePrivyWrapper={false}>
        <MiniAppContextProvider>
          {children}
        </MiniAppContextProvider>
      </WagmiConfigProvider>
    )
  }

  // Web context - use Privy + Wagmi
  debug.log('🌐 Using Web Web3 stack (Privy + Wagmi)')

  // Check for Privy config in web context
  if (!envConfig.privyAppId) {
    console.error('❌ NEXT_PUBLIC_PRIVY_APP_ID is required for web context')

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
            Privy App ID is required for wallet connections in web context.
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

  return (
    <PrivyProvider
      appId={envConfig.privyAppId}
      config={privyConfig}
    >
      <WagmiConfigProvider usePrivyWrapper={true}>
        <WebContextProvider>
          {children}
        </WebContextProvider>
      </WagmiConfigProvider>
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
'use client'

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  type ReactNode, 
  JSX
} from 'react'
import { WagmiProvider, useAccount, useChainId, useWalletClient } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base, baseSepolia } from 'viem/chains'
import { type Address, parseUnits } from 'viem'
import { BiconomySmartAccountV2 } from '@biconomy/account'
import { wagmiConfig, getCurrentChain, isSupportedChain } from '@/lib/web3/wagmi'
import { createSmartAccount } from '@/lib/biconomy/config'


import '@rainbow-me/rainbowkit/styles.css'

/**
 * Enhanced Web3 Provider - Complete Wallet Connection System
 * 
 * This component provides the complete Web3 infrastructure needed for 
 * wallet connections to work properly. The key insight here is that
 * RainbowKit needs to be properly integrated into the provider chain
 * AND its CSS needs to be imported for the modal to display.
 * 
 * The provider hierarchy is crucial:
 * 1. QueryClient provides React Query for caching
 * 2. WagmiProvider provides core Web3 functionality  
 * 3. RainbowKitProvider provides the connection modal UI
 * 4. OnchainKitProvider adds Coinbase-specific features
 */


// Create QueryClient for React Query (needed by Wagmi)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 1 minute to improve performance
      staleTime: 1000 * 60,
      // Keep data in cache for 5 minutes
      gcTime: 1000 * 60 * 5,
    },
  },
})

// Environment variables with validation
const COINBASE_PROJECT_ID = process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID || ''
const ONCHAINKIT_API_KEY = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || ''


/**
 * Environment Configuration with Proper Typing
 * 
 * We create a robust configuration system that handles environment variables
 * safely and provides clear feedback when configuration is incomplete.
 * This prevents runtime errors from missing environment variables.
 */
interface EnvironmentConfig {
  readonly biconomyPaymasterApiKey: string
  readonly biconomyBundlerUrl: string
  readonly coinbaseProjectId: string
  readonly hasAdvancedFeatures: boolean
}

function createEnvironmentConfig(): EnvironmentConfig {
  const biconomyPaymasterApiKey = process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY ?? ''
  const biconomyBundlerUrl = process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_URL ?? 'https://bundler.biconomy.io/api/v3/84532/bundler_3ZMCSi7xgtCc5nNF9mFWZNe3'
  const coinbaseProjectId = process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID || 'bee23d62-7e28-4fe3-9b84-2153d2bb99d2'
  
  // For development, allow advanced features if we have fallback values
  // even if the paymaster API key is missing
  const hasAdvancedFeatures = Boolean(
    (biconomyPaymasterApiKey || process.env.NODE_ENV === 'development') && 
    biconomyBundlerUrl && 
    coinbaseProjectId
  )

  // Only warn about missing paymaster in development if no fallbacks exist
  if (!hasAdvancedFeatures && process.env.NODE_ENV === 'development') {
    const missingConfigs = {
      biconomyPaymaster: !biconomyPaymasterApiKey,
      biconomyBundler: !biconomyBundlerUrl,
      coinbaseProject: !coinbaseProjectId,
    }
    
    // Only show warning if paymaster is missing AND we're not using fallbacks
    const shouldWarn = missingConfigs.biconomyPaymaster && 
                      (missingConfigs.biconomyBundler || missingConfigs.coinbaseProject)
    
    if (shouldWarn) {
      console.warn('⚠️ Advanced Web3 features disabled - missing environment variables:', missingConfigs)
    } else if (missingConfigs.biconomyPaymaster) {
      console.info('ℹ️ Running with fallback configuration - add NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY for full functionality')
    }
  }

  return {
    biconomyPaymasterApiKey,
    biconomyBundlerUrl,
    coinbaseProjectId,
    hasAdvancedFeatures,
  }
}

// Create environment configuration once to avoid repeated processing
const envConfig = createEnvironmentConfig()

/**
 * Account Types and State Management with Complete Type Safety
 * 
 * We define comprehensive types that cover all possible states our Web3
 * system can be in. This prevents TypeScript errors and provides better
 * IDE support for developers working with the system.
 */
export enum AccountType {
  DISCONNECTED = 'disconnected',
  EOA = 'eoa', // Externally Owned Account (traditional wallet)
  SMART_ACCOUNT = 'smart_account',
  UPGRADING = 'upgrading', // Transitioning from EOA to Smart Account
}

/**
 * Smart Account Configuration with Null Safety
 * 
 * We explicitly handle the null/undefined states that can occur during
 * Smart Account initialization and provide type-safe interfaces for
 * components to check readiness before attempting operations.
 */
export interface SmartAccountConfig {
  readonly smartAccount: BiconomySmartAccountV2 | null
  readonly smartAccountAddress: Address | null
  readonly paymaster: unknown | null
  readonly bundler: unknown | null
  readonly isDeployed: boolean
  readonly canSponsorGas: boolean
}

/**
 * Gas Sponsorship Configuration with Economic Logic
 * 
 * We define clear interfaces for gas sponsorship that include the economic
 * policies and current state. This makes it easy for components to understand
 * what operations will be sponsored and why.
 */
export interface GasSponsorshipConfig {
  readonly isEnabled: boolean
  readonly maxSponsoredAmountUSD: number
  readonly maxSponsoredAmountWei: bigint
  readonly estimatedSavingsWei: bigint
}

/**
 * User Capabilities Based on Account Type
 * 
 * We define a clear interface that describes what capabilities are available
 * based on the user's current account configuration. This helps components
 * provide appropriate user interfaces and messaging.
 */
export interface Web3Capabilities {
  readonly canBatchTransactions: boolean
  readonly canSponsorGas: boolean
  readonly hasOnchainIdentity: boolean
  readonly canRecoverAccount: boolean
  readonly canUpgradeAccount: boolean
}

/**
 * Complete Web3 Context State Interface
 * 
 * This interface defines all the state that our Web3 system manages.
 * By making all properties readonly, we ensure that components can only
 * modify state through the provided action functions.
 */
export interface Web3ContextState {
  // Connection and account state
  readonly accountType: AccountType
  readonly isConnected: boolean
  readonly address: Address | null
  readonly chainId: number | null
  
  // Smart Account configuration and status
  readonly smartAccountConfig: SmartAccountConfig
  
  // Economic features and policies
  readonly gasSponsorship: GasSponsorshipConfig
  
  // Available capabilities based on current state
  readonly capabilities: Web3Capabilities
  
  // Loading and error states for user feedback
  readonly isLoading: boolean
  readonly error: string | null
}

/**
 * Transaction Data Interface for Type Safety
 * 
 * Instead of using 'any' for transaction data, we define a proper interface
 * that covers the transaction parameters our system needs to handle.
 */
export interface TransactionData {
  readonly to: Address
  readonly value?: bigint
  readonly data?: `0x${string}`
  readonly gasLimit?: bigint
}

/**
 * Web3 Context Actions with Proper Error Handling
 * 
 * These action functions provide the interface for components to interact
 * with our Web3 system. All functions return Promises with proper error
 * handling to prevent unhandled rejections.
 */
export interface Web3ContextActions {
  // Account management and upgrades
  readonly upgradeToSmartAccount: () => Promise<void>
  readonly deploySmartAccount: () => Promise<void>
  
  // Transaction processing with intelligent routing
  readonly sendTransaction: (txData: TransactionData) => Promise<string>
  readonly sendBatchTransactions: (txDataArray: readonly TransactionData[]) => Promise<string>
  
  // Gas estimation and sponsorship checking
  readonly estimateGasCost: (txData: TransactionData) => Promise<bigint>
  readonly canSponsorTransaction: (txData: TransactionData) => Promise<boolean>
  
  // Error handling and recovery
  readonly clearError: () => void
  readonly retryLastTransaction: () => Promise<void>
}

// Complete context type combining state and actions
export type Web3ContextType = Web3ContextState & Web3ContextActions

// Create context with null default (components must check for null)
const Web3Context = createContext<Web3ContextType | null>(null)

/**
 * TanStack Query Configuration for Optimal Caching
 * 
 * We create a memoized query client factory to prevent unnecessary
 * re-creation during component re-renders while maintaining proper
 * caching strategies for blockchain data.
 */
function createOptimizedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Contract data rarely changes, cache for longer periods
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes in cache
        // Retry strategy that handles Web3-specific errors
        retry: (failureCount: number, error: unknown): boolean => {
          // Don't retry user-rejected transactions
          if (error && typeof error === 'object' && 'code' in error && error.code === 4001) {
            return false
          }
          // Don't retry more than 3 times for other errors
          return failureCount < 3
        },
        retryDelay: (attemptIndex: number): number => 
          Math.min(1000 * Math.pow(2, attemptIndex), 30000),
      },
      mutations: {
        // Shorter retry for transactions since they're time-sensitive
        retry: 1,
        retryDelay: 1000,
      },
    },
  })
}

/**
 * Smart Account Management Hook with Complete Error Handling
 * 
 * This hook manages the complex Smart Account lifecycle while providing
 * proper TypeScript types and comprehensive error handling. We avoid
 * importing specific Biconomy types to prevent build issues.
 */
interface SmartAccountHookResult {
  readonly smartAccountConfig: SmartAccountConfig
  readonly isInitializing: boolean
  readonly initializeSmartAccount: (userAddress: Address, chainId: number) => Promise<void>
}

function useSmartAccountManagement(
  address: Address | null, 
  chainId: number | null
): SmartAccountHookResult {
  const [smartAccountConfig, setSmartAccountConfig] = useState<SmartAccountConfig>({
    smartAccount: null,
    smartAccountAddress: null,
    paymaster: null,
    bundler: null,
    isDeployed: false,
    canSponsorGas: false,
  })
  
  const [isInitializing, setIsInitializing] = useState(false)

  /**
   * Initialize Smart Account with Proper Error Boundaries
   * 
   * This function handles Smart Account initialization while providing
   * clear error messages and maintaining type safety throughout the process.
   */
  const initializeSmartAccount = useCallback(async (
    userAddress: Address, 
    targetChainId: number
  ): Promise<void> => {
    if (!envConfig.hasAdvancedFeatures) {
      throw new Error('Smart Account features not available - missing configuration')
    }
    
    setIsInitializing(true)
    setSmartAccountConfig(prev => ({ ...prev })) // Reset any previous errors
    
    try {
      // In a production implementation, you would import and use actual Biconomy SDK here
      // For now, we simulate the Smart Account creation to avoid import dependencies
      
      // Simulate Smart Account address generation
      const mockSmartAccountAddress = `0x${userAddress.slice(2)}` as Address
      
      // REMOVE the following block (mock implementation):
      // setSmartAccountConfig({
      //   smartAccount: { address: mockSmartAccountAddress }, // Mock Smart Account object
      //   smartAccountAddress: mockSmartAccountAddress,
      //   paymaster: { isActive: true }, // Mock paymaster object
      //   bundler: { isActive: true }, // Mock bundler object
      //   isDeployed: false, // Would be checked against actual blockchain state
      //   canSponsorGas: true,
      // })

      console.log('Smart Account initialized for:', userAddress, 'on chain:', targetChainId)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during Smart Account initialization'
      console.error('Smart Account initialization failed:', errorMessage)
      throw new Error(`Smart Account initialization failed: ${errorMessage}`)
    } finally {
      setIsInitializing(false)
    }
  }, []) // No dependencies needed since we use parameters

  return {
    smartAccountConfig,
    isInitializing,
    initializeSmartAccount,
  }
}

/**
 * Gas Sponsorship Logic with Economic Modeling
 * 
 * This hook implements the economic logic for gas sponsorship decisions
 * while maintaining type safety and providing clear interfaces for
 * components to understand sponsorship policies.
 */
interface GasSponsorshipHookResult {
  readonly gasSponsorshipConfig: GasSponsorshipConfig
  readonly canSponsorTransaction: (txData: TransactionData) => Promise<boolean>
  readonly estimateGasCost: (txData: TransactionData) => Promise<bigint>
}

function useGasSponsorshipInternal(chainId: number | null): GasSponsorshipHookResult {
  // Economic configuration for gas sponsorship
  const maxSponsoredUSD = 10
  const maxSponsoredWei = useMemo(() => 
    parseUnits(maxSponsoredUSD.toString(), 6), // USDC has 6 decimals
    [maxSponsoredUSD]
  )
  
  const gasSponsorshipConfig = useMemo<GasSponsorshipConfig>(() => ({
    isEnabled: envConfig.hasAdvancedFeatures,
    maxSponsoredAmountUSD: maxSponsoredUSD,
    maxSponsoredAmountWei: maxSponsoredWei,
    estimatedSavingsWei: parseUnits('0.001', 18), // Typical Base gas cost
  }), [maxSponsoredUSD, maxSponsoredWei])
  
  const canSponsorTransaction = useCallback(async (txData: TransactionData): Promise<boolean> => {
    if (!chainId || !isSupportedChain(chainId) || !envConfig.hasAdvancedFeatures) {
      return false
    }
    
    // Check if transaction value is within sponsorship limits
    const txValue = txData.value ?? BigInt(0)
    return txValue <= maxSponsoredWei
  }, [chainId, maxSponsoredWei])

  const estimateGasCost = useCallback(async (txData: TransactionData): Promise<bigint> => {
    // In production, this would call actual gas estimation
    // For now, we return a typical Base network gas cost
    const baseGasCost = parseUnits('0.001', 18) // ~$0.001 on Base
    
    // Add extra gas for complex transactions
    if (txData.data && txData.data.length > 10) {
      return baseGasCost * BigInt(2) // Double for complex transactions
    }
    
    return baseGasCost
  }, [])

  return {
    gasSponsorshipConfig,
    canSponsorTransaction,
    estimateGasCost,
  }
}

/**
 * Enhanced Web3 Provider Implementation with Complete Type Safety
 * 
 * This is the core provider component that orchestrates all Web3 functionality
 * while maintaining strict TypeScript compliance and comprehensive error handling.
 */
interface EnhancedWeb3ProviderProps {
  readonly children: ReactNode
}

function EnhancedWeb3ProviderInner({ children }: EnhancedWeb3ProviderProps): JSX.Element {
  const { address: wagmiAddress, isConnected } = useAccount()
  const address = wagmiAddress ?? null
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()

  // Smart Account state
  const [smartAccountConfig, setSmartAccountConfig] = useState<SmartAccountConfig>({
    smartAccount: null,
    smartAccountAddress: null,
    paymaster: null,
    bundler: null,
    isDeployed: false,
    canSponsorGas: false,
  })
  const [isInitializing, setIsInitializing] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>(AccountType.DISCONNECTED)
  const [error, setError] = useState<string | null>(null)

  // Gas sponsorship config (stub for now)
  const gasSponsorshipConfig = useMemo(() => ({
    isEnabled: !!smartAccountConfig.smartAccount,
    maxSponsoredAmountUSD: 10,
    maxSponsoredAmountWei: parseUnits('10', 6),
    estimatedSavingsWei: parseUnits('0.001', 18),
  }), [smartAccountConfig.smartAccount])
  const estimateGasCost = useCallback(async (txData: TransactionData) => parseUnits('0.001', 18), [])
  const canSponsorTransaction = useCallback(async (txData: TransactionData) => !!smartAccountConfig.smartAccount, [smartAccountConfig.smartAccount])

  // Calculate account type
  useEffect(() => {
    if (!isConnected || !address) {
      setAccountType(AccountType.DISCONNECTED)
    } else if (smartAccountConfig.smartAccount) {
      setAccountType(AccountType.SMART_ACCOUNT)
    } else {
      setAccountType(AccountType.EOA)
    }
  }, [isConnected, address, smartAccountConfig.smartAccount])

  // Capabilities
  const capabilities = useMemo<Web3Capabilities>(() => ({
    canBatchTransactions: accountType === AccountType.SMART_ACCOUNT,
    canSponsorGas: smartAccountConfig.canSponsorGas && accountType === AccountType.SMART_ACCOUNT,
    hasOnchainIdentity: !!smartAccountConfig.smartAccount,
    canRecoverAccount: accountType === AccountType.SMART_ACCOUNT,
    canUpgradeAccount: accountType === AccountType.EOA,
  }), [accountType, smartAccountConfig])

  // Initialize Smart Account
  const initializeSmartAccount = useCallback(async () => {
    if (!walletClient || !address || !chainId) throw new Error('Wallet not connected')
    setIsInitializing(true)
    setError(null)
    try {
      const smartAccount = await createSmartAccount(walletClient, chainId)
      if (!smartAccount) throw new Error('Failed to create Smart Account - check Biconomy config')
      const smartAccountAddress = await smartAccount.getAccountAddress()
      const isDeployed = await smartAccount.isAccountDeployed()
      setSmartAccountConfig({
        smartAccount: smartAccount as BiconomySmartAccountV2,
        smartAccountAddress: smartAccountAddress as Address,
        paymaster: null,
        bundler: null,
        isDeployed,
        canSponsorGas: true,
      })
      setAccountType(AccountType.SMART_ACCOUNT)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Smart Account')
      setAccountType(AccountType.EOA)
      throw err
    } finally {
      setIsInitializing(false)
    }
  }, [walletClient, address, chainId])

  // Deploy Smart Account
  const deploySmartAccount = useCallback(async () => {
    if (!smartAccountConfig.smartAccount) throw new Error('Smart Account not initialized')
    if (smartAccountConfig.isDeployed) return
    setError(null)
    try {
      await smartAccountConfig.smartAccount.deploy()
      setSmartAccountConfig(prev => ({ ...prev, isDeployed: true }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy Smart Account')
      throw err
    }
  }, [smartAccountConfig])

  // Upgrade to Smart Account
  const upgradeToSmartAccount = useCallback(async () => {
    if (accountType === AccountType.SMART_ACCOUNT) return
    setError(null)
    try {
      await initializeSmartAccount()
    } catch (err) {
      throw err
    }
  }, [accountType, initializeSmartAccount])

  // EOA Transaction Helper
  const sendEoaTransaction = useCallback(async (txData: TransactionData): Promise<string> => {
    if (!walletClient || !address) throw new Error('Wallet not connected')
    try {
      const result = await walletClient.sendTransaction({
        account: address,
        chain: getCurrentChain(),
        to: txData.to,
        value: txData.value,
        data: txData.data,
        gas: txData.gasLimit,
      }) as { hash: string } | string;
      if (typeof result === 'string') return result
      if ('hash' in result) return result.hash
      return ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'EOA transaction failed')
      throw err
    }
  }, [walletClient, address])

  // Transaction Routing
  const sendTransaction = useCallback(async (txData: TransactionData): Promise<string> => {
    setError(null)
    // Use Smart Account if available
    if (smartAccountConfig.smartAccount && smartAccountConfig.canSponsorGas) {
      try {
        const receipt = await smartAccountConfig.smartAccount.sendTransaction({
          to: txData.to,
          value: txData.value || BigInt(0),
          data: txData.data || '0x',
        })
        const maybeHash = (receipt as unknown) as { transactionHash?: string; userOpHash?: string } | string
        if (typeof maybeHash === 'string') return maybeHash
        return maybeHash.transactionHash || maybeHash.userOpHash || ''
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Smart Account transaction failed')
        // Fallback to EOA below
      }
    }
    // Fallback to EOA
    return sendEoaTransaction(txData)
  }, [smartAccountConfig, sendEoaTransaction])

  // Batch Transactions
  const sendBatchTransactions = useCallback(async (txDataArray: readonly TransactionData[]): Promise<string> => {
    if (!capabilities.canBatchTransactions) throw new Error('Batch transactions require Smart Account')
    if (!smartAccountConfig.smartAccount) throw new Error('Smart Account not available')
    setError(null)
    try {
      // If sendBatchTransaction does not exist, fallback to sequential sendTransaction
      if (typeof (smartAccountConfig.smartAccount as unknown as { sendBatchTransaction?: (txs: readonly { to: string; value: bigint; data: string }[]) => Promise<unknown> }).sendBatchTransaction === 'function') {
        const transactions = txDataArray.map(tx => ({
          to: tx.to,
          value: tx.value || BigInt(0),
          data: tx.data || '0x',
        }))
        const receipt = await (smartAccountConfig.smartAccount as unknown as { sendBatchTransaction: (txs: readonly { to: string; value: bigint; data: string }[]) => Promise<unknown> }).sendBatchTransaction(transactions)
        const maybeHash = receipt as { transactionHash?: string; userOpHash?: string } | string
        if (typeof maybeHash === 'string') return maybeHash
        return maybeHash.transactionHash || maybeHash.userOpHash || ''
      } else {
        // Fallback: send transactions sequentially, return last hash
        let lastHash = ''
        for (const tx of txDataArray) {
          const receipt = await smartAccountConfig.smartAccount.sendTransaction({
            to: tx.to,
            value: tx.value || BigInt(0),
            data: tx.data || '0x',
          })
          const maybeHash = (receipt as unknown) as { transactionHash?: string; userOpHash?: string } | string
          lastHash = typeof maybeHash === 'string' ? maybeHash : (maybeHash.transactionHash || maybeHash.userOpHash || '')
        }
        return lastHash
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch transaction failed')
      throw err
    }
  }, [capabilities.canBatchTransactions, smartAccountConfig])

  const clearError = useCallback(() => setError(null), [])

  // Transaction retry functionality
  const retryLastTransaction = useCallback(async (): Promise<void> => {
    // In production, this would store the last transaction data and retry it
    throw new Error('Retry functionality not implemented yet')
  }, [])

  // Build complete context value with proper typing
  const contextValue: Web3ContextType = useMemo(() => ({
    // State
    accountType,
    isConnected,
    address,
    chainId,
    smartAccountConfig,
    gasSponsorship: gasSponsorshipConfig,
    capabilities,
    isLoading: isInitializing,
    error,
    
    // Actions
    upgradeToSmartAccount,
    deploySmartAccount,
    sendTransaction,
    sendBatchTransactions,
    estimateGasCost,
    canSponsorTransaction,
    clearError,
    retryLastTransaction,
  }), [
    accountType,
    isConnected,
    address,
    chainId,
    smartAccountConfig,
    gasSponsorshipConfig,
    capabilities,
    isInitializing,
    error,
    upgradeToSmartAccount,
    deploySmartAccount,
    sendTransaction,
    sendBatchTransactions,
    estimateGasCost,
    canSponsorTransaction,
    clearError,
    retryLastTransaction,
  ])

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  )
}

/**
 * Main Enhanced Web3 Provider with All Wrapper Providers
 */
export function EnhancedWeb3Provider({ children }: EnhancedWeb3ProviderProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider
          // Show recent transactions in the modal
          showRecentTransactions={true}
          // Custom app info that appears in wallet connection
          appInfo={{
            appName: 'OnChain Content Platform',
            learnMoreUrl: 'https://your-domain.com/about',
          }}
          // Cool mode adds subtle animations
          coolMode
        >
          <OnchainKitProvider
            apiKey={ONCHAINKIT_API_KEY}
            chain={base}
            config={{
              appearance: {
                mode: 'auto',
                theme: 'default',
              },
            }}
          >
            <EnhancedWeb3ProviderInner>
              {children}
            </EnhancedWeb3ProviderInner>
          </OnchainKitProvider>
        </RainbowKitProvider>
      </WagmiProvider>
      </QueryClientProvider>
  )
}

/**
 * Custom Hook for Accessing Enhanced Web3 Context
 */
export function useEnhancedWeb3(): Web3ContextType {
  const context = useContext(Web3Context)
  
  if (!context) {
    throw new Error('useEnhancedWeb3 must be used within an EnhancedWeb3Provider')
  }
  
  return context
}

/**
 * Specialized Hooks for Focused Functionality
 */

// Smart Account specific functionality
export function useSmartAccount() {
  const context = useEnhancedWeb3()
  
  return useMemo(() => ({
    smartAccountConfig: context.smartAccountConfig,
    canUpgrade: context.capabilities.canUpgradeAccount,
    isSmartAccount: context.accountType === AccountType.SMART_ACCOUNT,
    upgradeToSmartAccount: context.upgradeToSmartAccount,
    deploySmartAccount: context.deploySmartAccount,
  }), [
    context.smartAccountConfig,
    context.capabilities.canUpgradeAccount,
    context.accountType,
    context.upgradeToSmartAccount,
    context.deploySmartAccount,
  ])
}

// Gas sponsorship functionality
export function useGasSponsorship() {
  const context = useEnhancedWeb3()
  
  return useMemo(() => ({
    gasSponsorship: context.gasSponsorship,
    canSponsorTransaction: context.canSponsorTransaction,
    estimateGasCost: context.estimateGasCost,
  }), [
    context.gasSponsorship,
    context.canSponsorTransaction,
    context.estimateGasCost,
  ])
}

// Transaction processing functionality
export function useTransactions() {
  const context = useEnhancedWeb3()
  
  return useMemo(() => ({
    sendTransaction: context.sendTransaction,
    sendBatchTransactions: context.sendBatchTransactions,
    canBatchTransactions: context.capabilities.canBatchTransactions,
    retryLastTransaction: context.retryLastTransaction,
  }), [
    context.sendTransaction,
    context.sendBatchTransactions,
    context.capabilities.canBatchTransactions,
    context.retryLastTransaction,
  ])
}

// Use base and baseSepolia to define supported chain info for documentation or utility
const SUPPORTED_CHAINS_INFO = [
  { id: base.id, name: base.name },
  { id: baseSepolia.id, name: baseSepolia.name },
]

/**
 * Debug Component for Development
 * 
 * This component helps you debug provider setup issues during development.
 * It checks that all necessary environment variables are present and
 * provides helpful warnings if anything is missing.
 */
export function Web3ProviderDebugInfo() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const config = {
    wagmiConfigured: !!wagmiConfig,
    coinbaseProjectId: !!COINBASE_PROJECT_ID,
    onchainKitApiKey: !!ONCHAINKIT_API_KEY,
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h4 className="font-bold mb-2">Web3 Provider Debug</h4>
      <ul className="space-y-1">
        {Object.entries(config).map(([key, value]) => (
          <li key={key} className={value ? 'text-green-400' : 'text-red-400'}>
            {key}: {value ? '✓' : '✗'}
          </li>
        ))}
      </ul>
    </div>
  )
}
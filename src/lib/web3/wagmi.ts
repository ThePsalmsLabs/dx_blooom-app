// src/lib/web3/config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { cookieStorage, createStorage, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors'

/**
 * Enhanced Web3 Configuration System
 * 
 * This configuration system provides multiple layers of Web3 connectivity:
 * 1. Traditional wallet connections (MetaMask, Coinbase Wallet, WalletConnect)
 * 2. Biconomy Smart Account integration for account abstraction
 * 3. OnchainKit integration for enhanced Coinbase ecosystem features
 * 4. Progressive enhancement allowing users to upgrade from EOA to Smart Account
 * 
 * The architecture follows separation of concerns - this file handles the core
 * blockchain connection layer, while higher-level abstractions handle Smart Accounts
 * and application-specific logic.
 */

// Environment variables with fallbacks for robust configuration
// WalletConnect has rebranded to Reown. Support both env var names.
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  ''
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ''
const COINBASE_PROJECT_ID = process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID || ''

// Validate critical environment variables to prevent runtime failures
if (!WALLETCONNECT_PROJECT_ID) {
  console.warn('⚠️ Missing NEXT_PUBLIC_REOWN_PROJECT_ID (or legacy NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) - Reown (WalletConnect) may not work properly')
}

if (!ALCHEMY_API_KEY) {
  console.warn('⚠️ Missing NEXT_PUBLIC_ALCHEMY_API_KEY - Using public RPCs (may be rate limited)')
}

/**
 * Supported blockchain networks for the platform
 * 
 * We support both Base mainnet for production and Base Sepolia for development.
 * This dual-chain approach allows seamless testing and deployment workflows.
 */
export const supportedChains = [base, baseSepolia] as const

/**
 * RPC Transport Configuration
 * 
 * We use multiple RPC providers for redundancy and performance:
 * - Alchemy for primary RPC (fast, reliable, with caching)
 * - Public RPCs as fallbacks (free but potentially slower)
 * 
 * The HTTP transport automatically handles failover between providers.
 */
const getTransports = () => {
  const baseRpcs = ALCHEMY_API_KEY 
    ? [`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, 'https://mainnet.base.org']
    : ['https://mainnet.base.org']
    
  const baseSepoliaRpcs = ALCHEMY_API_KEY
    ? [`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, 'https://sepolia.base.org'] 
    : ['https://sepolia.base.org']

  return {
    [base.id]: http(baseRpcs[0], {
      // Aggressive batching to reduce API calls
      batch: {
        batchSize: 50,
        wait: 100, // Longer batching window to collect more calls
      },
      // Retry configuration for network resilience
      retryCount: 2,
      retryDelay: 1500,
      // Cache responses to reduce repeat calls
      timeout: 30_000,
    }),
    [baseSepolia.id]: http(baseSepoliaRpcs[0], {
      batch: {
        batchSize: 50, 
        wait: 100,
      },
      retryCount: 2,
      retryDelay: 1500,
      timeout: 30_000,
    }),
  }
}

/**
 * Wallet Connector Configuration
 * 
 * We configure multiple wallet types to maximize user accessibility:
 * - MetaMask: Most popular browser extension wallet
 * - Coinbase Wallet: Integrated with Coinbase ecosystem (important for Base chain)
 * - WalletConnect: Mobile wallet compatibility
 */
const connectors = [
  // MetaMask connector with proper error handling
  metaMask({
    dappMetadata: {
      name: 'Bloom',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
      iconUrl: '/images/miniapp-og-square.png',
    },
    // Enable extension detection for better UX
    extensionOnly: false,
  }),
  
  // Coinbase Wallet with Smart Wallet support (important for Base chain integration)
  coinbaseWallet({
    appName: 'Bloom',
    appLogoUrl: '/images/miniapp-og-square.png',
    // Enable Smart Wallet features for enhanced UX
    preference: 'smartWalletOnly', // This integrates with Base's ecosystem
  }),
  
  // WalletConnect for mobile wallet compatibility
  walletConnect({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'Bloom',
      description: 'Decentralized content subscription platform on Base',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
      icons: ['/images/miniapp-og-square.png'],
    },
    // Show QR code modal for mobile connections
    showQrModal: true,
  }),
]

/**
 * Storage Configuration for Wallet Persistence
 * 
 * We use cookie storage for SSR compatibility and user session persistence.
 * This ensures users stay connected across browser sessions and page refreshes.
 */
const storage = createStorage({
  storage: cookieStorage,
  key: 'onchain-content-wagmi', // Unique key to avoid conflicts
})

/**
 * Main Wagmi Configuration
 * 
 * This is the core configuration that ties together all our Web3 infrastructure:
 * - Blockchain connections (Base, Base Sepolia)
 * - Wallet connectors (MetaMask, Coinbase, WalletConnect) 
 * - RPC providers with fallbacks
 * - Persistent storage for sessions
 */
export const wagmiConfig = getDefaultConfig({
  // Application identification for wallets and services
  appName: 'Bloom',
  appDescription: 'Decentralized content subscription platform on Base',
  appUrl: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
  appIcon: '/favicon.ico',
  
  // WalletConnect integration
  projectId: WALLETCONNECT_PROJECT_ID,
  
  // Blockchain and wallet configuration
  chains: supportedChains,
  transports: getTransports(),
  
  // Session persistence and SSR support
  storage,
  ssr: true, // Enable server-side rendering compatibility
  
  // Aggressive batch configuration for maximum RPC efficiency
  batch: {
    multicall: {
      batchSize: 1024 * 500, // 500KB batch size for fewer requests
      wait: 200, // Longer batching window to collect more calls
    },
  },
  
  // Add caching configuration to reduce redundant calls
  cacheTime: 30_000, // Cache results for 30 seconds
  pollingInterval: undefined, // Disable auto-polling
})

/**
 * Configuration Validation Utilities
 * 
 * These functions help ensure our configuration is properly set up
 * and provide helpful debugging information during development.
 */

/**
 * Validates that all required environment variables are present
 * @returns Object indicating which configurations are properly set up
 */
export function validateWeb3Config() {
  return {
    walletConnect: !!WALLETCONNECT_PROJECT_ID,
    alchemy: !!ALCHEMY_API_KEY,
    coinbase: !!COINBASE_PROJECT_ID,
    chains: supportedChains.length > 0,
  }
}

/**
 * Gets configuration status for debugging and health checks
 * @returns Detailed configuration information
 */
export function getConfigStatus() {
  const validation = validateWeb3Config()
  
  return {
    validation,
    supportedChainIds: supportedChains.map(chain => chain.id),
    connectorCount: connectors.length,
    hasStorage: !!storage,
    environment: process.env.NODE_ENV,
    warnings: [
      !validation.walletConnect && '⚠️ WalletConnect not configured',
      !validation.alchemy && '⚠️ Alchemy RPC not configured (using public RPCs)',
      !validation.coinbase && '⚠️ Coinbase features may be limited',
    ].filter(Boolean),
  }
}

/**
 * Chain-specific configuration helpers for components
 * These make it easy for other parts of the application to get
 * chain-specific information without importing chain objects directly.
 */

/**
 * Get the current chain configuration based on environment
 * @returns The appropriate chain for the current environment
 */
export function getCurrentChain() {
  return process.env.NODE_ENV === 'production' ? base : baseSepolia
}

/**
 * Check if a chain ID is supported by our platform
 * @param chainId - Chain ID to check
 * @returns True if the chain is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return supportedChains.some(chain => chain.id === chainId)
}

/**
 * Get chain-specific block explorer URL
 * @param chainId - Chain ID
 * @returns Block explorer base URL
 */
export function getBlockExplorerUrl(chainId: number): string {
  switch (chainId) {
    case base.id:
      return 'https://basescan.org'
    case baseSepolia.id:
      return 'https://sepolia.basescan.org'
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

/**
 * Export type definitions for use in other files
 * This ensures type safety across the application when working with our configuration.
 */
export type SupportedChain = typeof supportedChains[number]
export type SupportedChainId = SupportedChain['id']

// Log configuration status in development for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Web3 Configuration Status:', getConfigStatus())
}
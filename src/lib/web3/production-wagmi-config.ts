/**
 * Production Wagmi Configuration
 * 
 * Uses fixed RPC setup to eliminate 403 errors, DNS resolution issues,
 * and excessive RPC calls. Includes wallet connection persistence for
 * seamless miniapp reconnection across navigation and page refreshes.
 */

import { createConfig, createStorage } from 'wagmi'
import { metaMask, coinbaseWallet, walletConnect, injected, safe } from 'wagmi/connectors'
import { 
  createFixedRpcTransports, 
  getSupportedChains,
  getCurrentChainConfig 
} from './fixed-rpc-config'

// ============================================================================
// TYPES
// ============================================================================

interface WalletConnectorConfig {
  appName: string
  appDescription: string
  appUrl: string
  appIconUrl: string
}

type ProductionWagmiConfig = ReturnType<typeof createConfig>

// ============================================================================
// APP METADATA
// ============================================================================

function getAppMetadata(): WalletConnectorConfig {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000'
  
  return {
    appName: 'Onchain Content Platform',
    appDescription: 'Discover and purchase premium content on Base',
    appUrl: baseUrl,
    appIconUrl: `${baseUrl}/favicon.ico`
  }
}

// ============================================================================
// WALLET CONNECTOR CONFIGURATION
// ============================================================================

function createProductionConnectors() {
  const metadata = getAppMetadata()
  
  // Core wallet connectors always included
  const coreConnectors = [
    // MetaMask connector
    metaMask({
      dappMetadata: {
        name: metadata.appName,
        url: metadata.appUrl,
        iconUrl: metadata.appIconUrl,
      },
    }),
    
    // Coinbase Wallet with smart wallet preference for Base network
    coinbaseWallet({
      appName: metadata.appName,
      appLogoUrl: metadata.appIconUrl,
      preference: 'smartWalletOnly',
    }),
    
    // Injected connector - Detects other wallets
    injected(),
  ]

  // Optional connectors requiring environment configuration
  const optionalConnectors = []
  
  // WalletConnect requires project ID from environment
  if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    try {
      optionalConnectors.push(
        walletConnect({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          metadata: {
            name: metadata.appName,
            description: metadata.appDescription,
            url: metadata.appUrl,
            icons: [metadata.appIconUrl],
          },
          showQrModal: true,
        })
      )
    } catch (error) {
      console.warn('WalletConnect connector failed to initialize:', error)
    }
  }

  // Safe wallet connector
  try {
    optionalConnectors.push(safe())
  } catch (error) {
    console.warn('Safe connector failed to initialize:', error)
  }

  return [...coreConnectors, ...optionalConnectors]
}

// ============================================================================
// MAIN CONFIGURATION
// ============================================================================

/**
 * Create production-ready wagmi configuration with fixed RPC transports
 * and persistent wallet connection state for automatic reconnection
 */
export function createProductionWagmiConfig(): ProductionWagmiConfig {
  const supportedChains = getSupportedChains()
  const transports = createFixedRpcTransports()
  
  if (supportedChains.length === 0) {
    throw new Error('No supported chains configured')
  }

  return createConfig({
    chains: [supportedChains[0], ...supportedChains.slice(1)],
    connectors: createProductionConnectors(),
    transports,
    
    // Configure multicall batching for efficient contract reads
    batch: {
      multicall: {
        batchSize: 1024 * 100,    // 100KB batch size limit
        wait: 16,                 // 16ms debounce delay
      },
    },
    
    // Cache contract call results for 4 seconds
    cacheTime: 4_000,
    
    // Enable server-side rendering support
    ssr: typeof window === 'undefined',
    
    // Persist wallet connection state to localStorage for automatic reconnection
    storage: createStorage({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      key: 'dxbloom-wallet-v1', // Versioned for future migrations
    }),
    
    // Enable detection of multiple injected wallet providers
    multiInjectedProviderDiscovery: true,
  })
}

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================

export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

/**
 * Validate the production configuration
 */
export function validateProductionConfig(): ConfigValidationResult {
  const result: ConfigValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    recommendations: []
  }
  
  try {
    const { chain } = getCurrentChainConfig()
    const supportedChains = getSupportedChains()
    
    // Verify at least one chain is configured
    if (supportedChains.length === 0) {
      result.errors.push('No supported chains configured')
      result.isValid = false
    }
    
    // Check for premium RPC provider credentials
    const hasAlchemy = Boolean(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY)
    const hasInfura = Boolean(process.env.NEXT_PUBLIC_INFURA_API_KEY)
    const hasWalletConnect = Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID)
    
    if (!hasAlchemy && !hasInfura) {
      result.warnings.push('No premium RPC providers configured')
      result.recommendations.push('Add NEXT_PUBLIC_ALCHEMY_API_KEY or NEXT_PUBLIC_INFURA_API_KEY for better reliability')
    }
    
    if (!hasWalletConnect) {
      result.warnings.push('WalletConnect not configured')
      result.recommendations.push('Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for mobile wallet support')
    }
    
    // Log validation results in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Production Config Validation:')
      console.log(`   Current Chain: ${chain.name} (${chain.id})`)
      console.log(`   Premium RPC: ${hasAlchemy || hasInfura ? '✅' : '❌'}`)
      console.log(`   WalletConnect: ${hasWalletConnect ? '✅' : '❌'}`)
    }
    
  } catch (error) {
    result.errors.push(`Configuration validation failed: ${(error as Error).message}`)
    result.isValid = false
  }
  
  return result
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let configInstance: ProductionWagmiConfig | null = null

/**
 * Get singleton wagmi configuration instance, creating if needed
 */
export function getProductionWagmiConfig(): ProductionWagmiConfig {
  if (!configInstance) {
    const validation = validateProductionConfig()
    
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
    }
    
    if (validation.warnings.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Configuration warnings:', validation.warnings)
    }
    
    configInstance = createProductionWagmiConfig()
  }
  
  return configInstance
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Reset configuration instance (used for testing or environment changes)
 */
export function resetProductionConfig(): void {
  configInstance = null
}

/**
 * Retrieve current chain metadata
 */
export function getCurrentChainInfo() {
  const { chain } = getCurrentChainConfig()
  return {
    id: chain.id,
    name: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls,
    blockExplorers: chain.blockExplorers || { default: { name: 'Unknown', url: '' } }
  }
}

/**
 * Verify if chain ID is in supported chains list
 */
export function isChainSupported(chainId: number): boolean {
  const supportedChains = getSupportedChains()
  return supportedChains.some(chain => chain.id === chainId)
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton wagmi configuration instance
export const productionWagmiConfig = getProductionWagmiConfig()

// Re-export RPC cache utilities
export { rpcCacheUtils } from './fixed-rpc-config'
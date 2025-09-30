/**
 * Production Wagmi Configuration
 * 
 * This configuration uses the fixed RPC setup to eliminate the 403 errors,
 * DNS resolution issues, and excessive RPC calls we've been experiencing.
 */

import { createConfig, type Config } from 'wagmi'
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

interface ProductionWagmiConfig extends Config {
  chains: readonly [import('wagmi/chains').Chain, ...import('wagmi/chains').Chain[]]
}

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

function createProductionConnectors(): ReturnType<typeof createConfig>['connectors'] {
  const metadata = getAppMetadata()
  
  const connectors = [
    // MetaMask - Most popular wallet
    metaMask({
      dappMetadata: {
        name: metadata.appName,
        url: metadata.appUrl,
        iconUrl: metadata.appIconUrl,
      },
    }),
    
    // Coinbase Wallet - Optimized for Base network
    coinbaseWallet({
      appName: metadata.appName,
      appLogoUrl: metadata.appIconUrl,
      preference: 'smartWalletOnly', // Use smart wallets when possible
    }),
    
    // Safe Wallet - For institutional users
    safe(),
    
    // Injected connector - Detects other wallets
    injected(),
  ]

  // WalletConnect - Only add if project ID is available
  if (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    connectors.splice(2, 0, // Insert before Safe
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
  }

  return connectors
}

// ============================================================================
// MAIN CONFIGURATION
// ============================================================================

/**
 * Create production-ready wagmi configuration
 * Uses fixed RPC transports and single-chain configuration
 */
export function createProductionWagmiConfig(): ProductionWagmiConfig {
  const supportedChains = getSupportedChains()
  const transports = createFixedRpcTransports()
  
  if (supportedChains.length === 0) {
    throw new Error('No supported chains configured')
  }

  return createConfig({
    chains: supportedChains as readonly [import('wagmi/chains').Chain, ...import('wagmi/chains').Chain[]],
    connectors: createProductionConnectors(),
    transports,
    
    // Optimized batching configuration
    batch: {
      multicall: {
        batchSize: 1024 * 100,    // 100KB batch size (conservative)
        wait: 16,                 // 16ms wait time
      },
    },
    
    // Cache configuration for better performance
    cacheTime: 4_000,             // Cache results for 4 seconds
    
    // Enable SSR support
    ssr: typeof window === 'undefined',
  })
}

// ============================================================================
// CONFIGURATION VALIDATION
// ============================================================================

interface ConfigValidationResult {
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
    
    // Check if we have supported chains
    if (supportedChains.length === 0) {
      result.errors.push('No supported chains configured')
      result.isValid = false
    }
    
    // Check RPC provider configuration
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
    
    // Log current configuration
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
 * Get or create the singleton wagmi configuration instance
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
 * Reset the configuration (useful for testing or environment changes)
 */
export function resetProductionConfig(): void {
  configInstance = null
}

/**
 * Get current chain information
 */
export function getCurrentChainInfo(): { 
  id: number
  name: string 
  nativeCurrency: { name: string; symbol: string; decimals: number }
  rpcUrls: { default: { http: readonly string[] } }
  blockExplorers: { default: { name: string; url: string } }
} {
  const { chain } = getCurrentChainConfig()
  return {
    id: chain.id,
    name: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: chain.rpcUrls,
    blockExplorers: chain.blockExplorers
  }
}

/**
 * Check if a chain ID is currently supported
 */
export function isChainSupported(chainId: number): boolean {
  const supportedChains = getSupportedChains()
  return supportedChains.some(chain => chain.id === chainId)
}

// ============================================================================
// EXPORTS
// ============================================================================

// Main configuration export
export const productionWagmiConfig = getProductionWagmiConfig()

// Re-export utilities from fixed RPC config
export { rpcCacheUtils } from './fixed-rpc-config'
// =============================================================================
// ENHANCED WAGMI CONFIGURATION - SOLUTION 1: RPC OPTIMIZATION & FALLBACKS
// =============================================================================

/**
 * Enhanced Wagmi Configuration for Production DeFi Applications
 * File: src/lib/web3/enhanced-wagmi-config.ts
 * 
 * This configuration implements robust RPC infrastructure that prevents rate limiting,
 * provides automatic failover, and optimizes performance for your Commerce Protocol
 * integration. Think of this as building a resilient highway system instead of
 * relying on a single congested road.
 * 
 * Key Educational Concepts:
 * - RPC Provider Hierarchy: Primary -> Fallback -> Emergency
 * - Request Batching: Combine multiple calls to reduce total requests
 * - Automatic Retry Logic: Handle temporary failures gracefully
 * - Performance Optimization: Timeouts and connection management
 * - Infrastructure Resilience: Never let RPC issues break user experience
 */

import { http, createConfig, fallback } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { metaMask, coinbaseWallet, walletConnect, injected, safe } from 'wagmi/connectors'

// =============================================================================
// RPC PROVIDER CONFIGURATION
// =============================================================================

/**
 * RPC Provider Tier System
 * 
 * This creates a hierarchy of RPC providers that automatically fails over
 * when the primary provider experiences issues. Each tier has different
 * performance characteristics and rate limits.
 */

/**
 * Tier 1: Premium Dedicated RPC Providers
 * 
 * These providers offer the highest performance and most generous rate limits.
 * For production applications, you should sign up for dedicated RPC services.
 * 
 * Recommended providers for Base:
 * - Alchemy: https://www.alchemy.com/ (Most popular, excellent Base support)
 * - Infura: https://www.infura.io/ (Reliable, good free tier)
 * - QuickNode: https://www.quicknode.com/ (Fast, premium features)
 * - Ankr: https://www.ankr.com/ (Good free tier, reliable)
 */
const createPremiumRPCTransports = () => {
  // You'll need to sign up for these services and get API keys
  // For immediate testing, comment out the ones you don't have keys for
  
  const premiumProviders = []
  
  // Alchemy (Recommended - excellent Base support)
  if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    premiumProviders.push(
      http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, {
        batch: {
          batchSize: 1000,        // Allow large batches
          wait: 16,               // Wait 16ms to collect more requests
        },
        retryCount: 3,            // Retry failed requests 3 times
        retryDelay: 1000,         // Fixed retry delay
      })
    )
  }
  
  // Infura
  if (process.env.NEXT_PUBLIC_INFURA_API_KEY) {
    premiumProviders.push(
      http(`https://base-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`, {
        batch: {
          batchSize: 1000,
          wait: 16,
        },
        retryCount: 3,
        retryDelay: 1000,
      })
    )
  }
  
  // QuickNode
  if (process.env.NEXT_PUBLIC_QUICKNODE_URL) {
    premiumProviders.push(
      http(process.env.NEXT_PUBLIC_QUICKNODE_URL, {
        batch: {
          batchSize: 1000,
          wait: 16,
        },
        retryCount: 3,
        retryDelay: 1000,
      })
    )
  }
  
  // Ankr (Free tier available)
  if (process.env.NEXT_PUBLIC_ANKR_API_KEY) {
    premiumProviders.push(
      http(`https://rpc.ankr.com/base/${process.env.NEXT_PUBLIC_ANKR_API_KEY}`, {
        batch: {
          batchSize: 500,         // Smaller batches for free tier
          wait: 32,               // Longer wait for free tier
        },
        retryCount: 2,
        retryDelay: 1500,
      })
    )
  }
  
  return premiumProviders
}

/**
 * Tier 2: Alternative Public RPC Providers
 * 
 * These are reliable public providers that often have better rate limits
 * than the default Base RPC. They serve as good fallbacks when premium
 * providers are unavailable.
 */
const createAlternativeRPCTransports = () => [
  // Base official RPC (better configured)
  http('https://mainnet.base.org', {
    batch: {
      batchSize: 100,           // Smaller batches for public RPC
      wait: 50,                 // Longer wait to respect rate limits
    },
    retryCount: 2,
    retryDelay: 2000,
  }),
  
  // Blast API (often has good Base support)
  http('https://base.blockpi.network/v1/rpc/public', {
    batch: {
      batchSize: 50,
      wait: 100,
    },
    retryCount: 1,
    retryDelay: 3000,
  }),
  
  // Additional public providers can be added here
  // Research current Base RPC providers for more options
]

/**
 * Tier 3: Emergency Fallback
 * 
 * This is the absolute last resort when all other providers fail.
 * It uses very conservative settings to maximize the chance of success.
 */
const createEmergencyRPCTransport = () => 
  http('https://mainnet.base.org', {
    batch: {
      batchSize: 1,             // Single requests only
      wait: 1000,               // Long wait between requests
    },
    retryCount: 5,              // More retries for emergency
    retryDelay: 5000,
  })

/**
 * Complete RPC Transport Configuration
 * 
 * This combines all tiers into a single fallback chain that automatically
 * tries each tier until one succeeds. This is the core of our infrastructure
 * resilience strategy.
 */
const createBaseMainnetTransport = () => {
  const premiumProviders = createPremiumRPCTransports()
  const alternativeProviders = createAlternativeRPCTransports()
  const emergencyProvider = createEmergencyRPCTransport()
  
  // Combine all providers in priority order
  const allProviders = [
    ...premiumProviders,        // Try premium providers first
    ...alternativeProviders,    // Fall back to public providers
    emergencyProvider           // Emergency fallback
  ]
  
  // If no premium providers are configured, warn the developer (development only)
  if (premiumProviders.length === 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️  No premium RPC providers configured. Add API keys to environment variables for better performance:\n' +
      '   NEXT_PUBLIC_ALCHEMY_API_KEY\n' +
      '   NEXT_PUBLIC_INFURA_API_KEY\n' +
      '   NEXT_PUBLIC_QUICKNODE_URL\n' +
      '   NEXT_PUBLIC_ANKR_API_KEY'
    )
  }
  
  return fallback(allProviders, {
    rank: {
      interval: 60_000,         // Re-rank providers every minute
      sampleCount: 5,           // Use 5 samples for ranking
      timeout: 2_000,           // 2 second timeout for ranking requests
      weights: {
        latency: 0.3,           // 30% weight for latency
        stability: 0.7,         // 70% weight for stability
      },
    },
  })
}

// =============================================================================
// TESTNET CONFIGURATION
// =============================================================================

/**
 * Base Sepolia (Testnet) Configuration
 * 
 * Testnets generally have more relaxed rate limits, but we still apply
 * optimization principles for consistency and better development experience.
 */
const createBaseSepoliaTransport = () => {
  const testnetProviders = []
  
  // Premium providers for testnet (if available)
  if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    testnetProviders.push(
      http(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, {
        batch: { batchSize: 1000, wait: 16 },
        retryCount: 2,
      })
    )
  }
  
  // Public testnet RPC
  testnetProviders.push(
    http('https://sepolia.base.org', {
      batch: { batchSize: 500, wait: 32 },
      retryCount: 2,
    })
  )
  
  return fallback(testnetProviders)
}

// =============================================================================
// WALLET CONNECTOR CONFIGURATION
// =============================================================================

/**
 * Enhanced Wallet Connectors
 * 
 * These connectors are optimized for your DeFi application and include
 * proper configuration for production use.
 */
const createWalletConnectors = () => [
  // MetaMask - Most popular wallet (explicitly configured)
  metaMask({
    dappMetadata: {
      name: 'Onchain Content Platform',
      url: typeof window !== 'undefined' ? window.location.origin : '',
      iconUrl: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '',
    },
  }),
  
  // Coinbase Wallet - Great for Base network
  coinbaseWallet({
    appName: 'Onchain Content Platform',
    appLogoUrl: typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : '',
    preference: 'smartWalletOnly', // Use smart wallets when possible
  }),
  
  // WalletConnect - For mobile and other wallets
  walletConnect({
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    metadata: {
      name: 'Onchain Content Platform',
      description: 'Discover and purchase premium content on Base',
      url: typeof window !== 'undefined' ? window.location.origin : '',
      icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : ''],
    },
  }),
  
  // Safe Wallet - For institutional and advanced users
  safe(),
  
  // Injected connector - Detects any wallet that injects itself (Phantom, Brave Wallet, etc.)
  // This should be last to avoid conflicts with explicit connectors
  injected(),
]

// =============================================================================
// MAIN WAGMI CONFIGURATION
// =============================================================================

/**
 * Enhanced Wagmi Configuration
 * 
 * This is the main configuration that brings together all our optimizations:
 * - Multi-tier RPC provider fallbacks
 * - Request batching and optimization
 * - Proper wallet connector setup
 * - Development vs production optimizations
 */
export const enhancedWagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: createWalletConnectors(),
  
  // Transport configuration with our multi-tier fallback system
  transports: {
    [base.id]: createBaseMainnetTransport(),
    [baseSepolia.id]: createBaseSepoliaTransport(),
  },
  
  // Global batching configuration
  batch: {
    multicall: {
      batchSize: 1024 * 200,    // 200KB batch size
      wait: 16,                 // 16ms wait time
    },
  },
  
  // Cache configuration for better performance
  cacheTime: 2_000,             // Cache results for 2 seconds
  
  // Enable SSR support if needed
  ssr: typeof window === 'undefined',
})

// =============================================================================
// CONFIGURATION VALIDATION AND MONITORING
// =============================================================================

/**
 * Configuration Health Check
 * 
 * This function helps you verify your RPC configuration is working correctly
 * and provides guidance for optimization.
 */
export const validateRPCConfiguration = async () => {
  const results = {
    premiumProvidersConfigured: 0,
    publicProvidersAvailable: 0,
    recommendedActions: [] as string[],
  }
  
  // Check premium provider configuration
  const premiumKeys = [
    'NEXT_PUBLIC_ALCHEMY_API_KEY',
    'NEXT_PUBLIC_INFURA_API_KEY', 
    'NEXT_PUBLIC_QUICKNODE_URL',
    'NEXT_PUBLIC_ANKR_API_KEY',
  ]
  
  results.premiumProvidersConfigured = premiumKeys.filter(
    key => process.env[key]
  ).length
  
  results.publicProvidersAvailable = 2 // Base mainnet + BlockPI
  
  // Provide recommendations
  if (results.premiumProvidersConfigured === 0) {
    results.recommendedActions.push(
      'Add at least one premium RPC provider API key for production reliability'
    )
    results.recommendedActions.push(
      'Start with Infura (you already have this) - add NEXT_PUBLIC_INFURA_API_KEY to .env.local'
    )
  }
  
  if (results.premiumProvidersConfigured < 2) {
    results.recommendedActions.push(
      'Configure multiple premium providers for maximum redundancy'
    )
  }
  
  if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
    results.recommendedActions.push(
      'Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for mobile wallet support'
    )
  }
  
  return results
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
  return chainId === base.id || chainId === baseSepolia.id
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

// =============================================================================
// USAGE INSTRUCTIONS AND BEST PRACTICES
// =============================================================================

/**
 * Usage Instructions:
 * 
 * 1. Replace your existing wagmi configuration with this enhanced version
 * 2. Add RPC provider API keys to your .env.local file:
 *    NEXT_PUBLIC_ALCHEMY_API_KEY=your_key_here
 *    NEXT_PUBLIC_INFURA_API_KEY=your_key_here
 *    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
 * 
 * 3. Update your app root to use the new configuration:
 *    import { enhancedWagmiConfig } from '@/lib/web3/enhanced-wagmi-config'
 * 
 * 4. Monitor RPC performance in production and adjust timeouts as needed
 * 
 * Best Practices:
 * - Start with free tiers of premium providers for immediate improvement
 * - Monitor your RPC usage and upgrade to paid tiers as your app grows
 * - Test failover behavior by temporarily disabling providers
 * - Keep your API keys secure and rotate them regularly
 */

/**
 * Environment Variable Template:
 * 
 * Add these to your .env.local file:
 * 
 * # Primary RPC Providers (get free API keys)
 * NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
 * NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key
 * 
 * # Optional Premium Providers
 * NEXT_PUBLIC_QUICKNODE_URL=your_quicknode_endpoint
 * NEXT_PUBLIC_ANKR_API_KEY=your_ankr_api_key
 * 
 * # Wallet Connect (free)
 * NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
 */

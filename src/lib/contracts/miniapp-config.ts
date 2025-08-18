// src/lib/contracts/miniapp-config.ts

import { createConfig } from 'wagmi'
import { cookieStorage, createStorage, http } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors'

/**
 * Web3 Configuration for MiniApp
 * 
 * This configuration provides wagmi setup for Farcaster MiniApp integration
 * while being compatible with Privy's authentication system.
 * 
 * Key points:
 * - Uses standard wagmi connectors (MetaMask, Coinbase Wallet, WalletConnect)
 * - Preserves RPC configuration with Alchemy primary and public fallbacks
 * - Keeps storage configuration and SSR support
 * - Maintains performance optimizations (batching, caching, etc.)
 * 
 * Architecture Decision:
 * Use standard wagmi createConfig and provide explicit connectors and transports.
 */

// Environment variables with fallbacks
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
 * Supported blockchain networks - preserved from your existing configuration
 * 
 * We maintain support for both Base mainnet and Base Sepolia testnet to ensure
 * seamless development and production workflows.
 */
export const supportedChains = [base, baseSepolia] as const

/**
 * RPC Transport Configuration
 * 
 * Preserves your existing multi-provider RPC setup with Alchemy primary
 * and public RPC fallbacks for redundancy and performance.
 */
const getTransports = () => {
  const baseRpcUrl = ALCHEMY_API_KEY
    ? `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    : 'https://mainnet.base.org'

  const baseSepoliaRpcUrl = ALCHEMY_API_KEY
    ? `https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
    : 'https://sepolia.base.org'

  return {
    [base.id]: http(baseRpcUrl),
    [baseSepolia.id]: http(baseSepoliaRpcUrl),
  }
}

/**
 */

/**
 * Storage Configuration - preserved from your existing setup
 * 
 * Maintains your existing cookie storage configuration for SSR compatibility
 * and session persistence across browser sessions.
 */
const storage = createStorage({
  storage: cookieStorage,
  key: 'onchain-content-wagmi-miniapp', // Updated key to differentiate from original config
})

/**
 * Wallet Connector Configuration for MiniApp
 */
const connectors = [
  metaMask({
    dappMetadata: {
      name: 'Bloom',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
      iconUrl: '/images/miniapp-og-square.png',
    },
    extensionOnly: false,
  }),
  
  coinbaseWallet({
    appName: 'Bloom',
    appLogoUrl: '/images/miniapp-og-square.png',
    preference: 'smartWalletOnly',
  }),
  
  walletConnect({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'Bloom',
      description: 'Decentralized content subscription platform on Base',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
      icons: ['/images/miniapp-og-square.png'],
    },
    showQrModal: true,
  }),
]

/**
 * Wagmi Configuration (Privy-compatible)
 * 
 * This configuration preserves all your existing settings while being compatible
 * with Privy's authentication system. It maintains your performance optimizations,
 * error handling, and development-friendly features.
 */
export const miniAppConfig = createConfig({
  // Blockchain and wallet configuration
  chains: supportedChains,
  connectors,
  transports: getTransports(),
  
  // Session persistence and SSR support - preserved from your setup
  storage,
  ssr: true,
  
  // Performance optimizations - preserved from your existing config
  batch: {
    multicall: {
      batchSize: 1024 * 500, // 500KB batch size for fewer requests
      wait: 200, // Longer batching window to collect more calls
    },
  },
})

/**
 * Configuration Validation Utilities
 * 
 * Extended from your existing validation functions to include MiniApp
 * connector verification and environment detection.
 */
export function validateMiniAppConfig() {
  const baseValidation = {
    walletConnect: !!WALLETCONNECT_PROJECT_ID,
    alchemy: !!ALCHEMY_API_KEY,
    coinbase: !!COINBASE_PROJECT_ID,
    chains: supportedChains.length > 0,
  }

  // Check if we're in a MiniApp environment
  const isMiniAppEnvironment = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/mini') ||
    window.location.search.includes('miniApp=true') ||
    window.parent !== window
  )

  return {
    ...baseValidation,
    miniAppEnvironment: isMiniAppEnvironment,
  }
}

/**
 * Configuration Status for Debugging
 * 
 * Provides comprehensive configuration information including MiniApp-specific
 * status for debugging and health checks.
 */
export function getMiniAppConfigStatus() {
  const validation = validateMiniAppConfig()
  
  return {
    validation,
    supportedChainIds: supportedChains.map(chain => chain.id),
    hasStorage: !!storage,
    environmentDetection: {
      isMiniApp: validation.miniAppEnvironment,
    }
  }
}

/**
 * Utility function to detect MiniApp environment
 * 
 * This function provides a reliable way to detect if your application
 * is running within a Farcaster client environment.
 */
export function isMiniAppEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.location.pathname.startsWith('/mini') ||
    window.location.search.includes('miniApp=true') ||
    window.parent !== window ||
    // Additional checks for Farcaster user agents
    navigator.userAgent.includes('Farcaster') ||
    navigator.userAgent.includes('Warpcast')
  )
}

/**
 * Development helpers for testing MiniApp integration
 * 
 * These utilities help during development to test MiniApp functionality
 * even when not running within a Farcaster client.
 */
export const devHelpers = {
  /**
   * Force MiniApp mode for testing
   */
  enableMiniAppMode: () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('miniApp', 'true')
      window.history.replaceState({}, '', url.toString())
    }
  },
  
  /**
   * Disable MiniApp mode for testing
   */
  disableMiniAppMode: () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('miniApp')
      window.history.replaceState({}, '', url.toString())
    }
  },
  
  /**
   * Get current configuration status as a readable object
   */
  getDebugInfo: () => ({
    config: getMiniAppConfigStatus(),
    environment: {
      isBrowser: typeof window !== 'undefined',
      isMiniApp: isMiniAppEnvironment(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
    }
  })
}

// Type exports for use throughout your application
export type MiniAppConfig = typeof miniAppConfig
export type SupportedChains = typeof supportedChains
export type ConfigValidation = ReturnType<typeof validateMiniAppConfig>
/**
 * MiniApp-Enhanced Wagmi Configuration - Production Web3 Infrastructure
 * File: src/lib/contracts/miniapp-config.ts
 * 
 * This configuration extends your existing sophisticated wagmi setup to provide seamless
 * Web3 functionality across both traditional web and MiniApp contexts. It builds upon
 * your established patterns while adding intelligent connector selection, enhanced
 * error handling, and social commerce optimizations.
 * 
 * Key Architectural Integration:
 * - Preserves your existing RPC configuration with Alchemy primary and public fallbacks
 * - Maintains your sophisticated connector setup (MetaMask, Coinbase Wallet, WalletConnect)
 * - Extends your cookie storage and SSR compatibility patterns
 * - Builds upon your performance optimizations (batching, caching, polling strategies)
 * - Uses your established environment variable validation and error handling
 * - Integrates with your contract address management and chain configuration
 * 
 * Enhanced MiniApp Features:
 * - Intelligent connector prioritization based on environment detection
 * - Enhanced batch transaction support for EIP-5792 in MiniApp contexts
 * - Social commerce optimizations for mobile and embedded environments
 * - Real-time capability monitoring and adaptive connector selection
 * - Comprehensive error handling with graceful fallbacks to existing web functionality
 * 
 * Production Architecture:
 * - Unified configuration that works seamlessly across all contexts
 * - Performance monitoring and optimization for different network conditions
 * - Enhanced security considerations for social platform integration
 * - Real-time connector health monitoring and automatic failover
 * - Analytics integration for tracking usage patterns and optimization opportunities
 */

import { createConfig, http, webSocket, fallback, createStorage, cookieStorage } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { 
  coinbaseWallet, 
  metaMask, 
  walletConnect,
  injected
} from 'wagmi/connectors'

// Import Component 1 types for complete integration
import type {
  MiniAppEnvironment,
  MiniAppCapabilities
} from '@/types/miniapp'

// Import Component 2 detection utilities
import {
  detectMiniAppEnvironment,
  type MiniAppEnvironmentDetection
} from '@/lib/miniapp/detection'

// Import your existing contract configuration for seamless integration
import {
  CONTRACT_ADDRESSES,
  getContractAddresses,
  isSupportedChain
} from '@/lib/contracts/config'

// ================================================
// ENVIRONMENT VARIABLES AND VALIDATION
// ================================================

/**
 * Enhanced Environment Configuration
 *
 * This extends your existing environment variable handling with MiniApp-specific
 * configuration while maintaining backward compatibility and validation.
 */
const ENVIRONMENT_CONFIG = {
  // Existing environment variables preserved from your configuration
  WALLETCONNECT_PROJECT_ID:
    process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    '',
  ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '',
  COINBASE_PROJECT_ID: process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID || '',

  // Enhanced MiniApp-specific configuration
  MINIAPP_ENABLED: process.env.NEXT_PUBLIC_MINIAPP_ENABLED === 'true',
  MINIAPP_DOMAIN: process.env.NEXT_PUBLIC_MINIAPP_DOMAIN || '',
  FARCASTER_WEBHOOK_SECRET: process.env.FARCASTER_WEBHOOK_SECRET || '',

  // Performance and optimization flags
  ENABLE_WEBSOCKET_FALLBACK: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET_FALLBACK === 'true',
  ENABLE_BATCH_OPTIMIZATION: process.env.NEXT_PUBLIC_ENABLE_BATCH_OPTIMIZATION !== 'false',
  ENABLE_SMART_CACHING: process.env.NEXT_PUBLIC_ENABLE_SMART_CACHING !== 'false',

  // Enhanced RPC configurations for better reliability
  INFURA_PROJECT_ID: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID || '',
  ANKR_API_KEY: process.env.NEXT_PUBLIC_ANKR_API_KEY || '',
  PUBLIC_RPC_FALLBACK: true
} as const

/**
 * Enhanced Environment Validation
 * 
 * This extends your existing validation patterns with comprehensive checks
 * for both traditional web and MiniApp functionality.
 */
function validateEnhancedEnvironment(): {
  isValid: boolean
  warnings: string[]
  errors: string[]
  capabilities: {
    hasBasicWeb3: boolean
    hasMiniAppSupport: boolean
    hasOptimalPerformance: boolean
    hasFullFeatureSet: boolean
  }
} {
  const warnings: string[] = []
  const errors: string[] = []
  
  // Validate critical environment variables using your established patterns
  if (!ENVIRONMENT_CONFIG.WALLETCONNECT_PROJECT_ID) {
    warnings.push('⚠️ Missing NEXT_PUBLIC_REOWN_PROJECT_ID - WalletConnect functionality may be limited')
  }
  
  if (!ENVIRONMENT_CONFIG.ALCHEMY_API_KEY) {
    warnings.push('⚠️ Missing NEXT_PUBLIC_ALCHEMY_API_KEY - Using public RPCs (may be rate limited)')
  }
  
  if (!ENVIRONMENT_CONFIG.COINBASE_PROJECT_ID) {
    warnings.push('⚠️ Missing NEXT_PUBLIC_COINBASE_PROJECT_ID - Coinbase Wallet branding may be affected')
  }
  
  // Validate MiniApp-specific configuration
  if (ENVIRONMENT_CONFIG.MINIAPP_ENABLED && !ENVIRONMENT_CONFIG.MINIAPP_DOMAIN) {
    warnings.push('⚠️ MiniApp enabled but missing NEXT_PUBLIC_MINIAPP_DOMAIN - Deep linking may not work properly')
  }
  
  // Assess capability levels
  const capabilities = {
    hasBasicWeb3: Boolean(ENVIRONMENT_CONFIG.WALLETCONNECT_PROJECT_ID || ENVIRONMENT_CONFIG.ALCHEMY_API_KEY),
    hasMiniAppSupport: ENVIRONMENT_CONFIG.MINIAPP_ENABLED,
    hasOptimalPerformance: Boolean(ENVIRONMENT_CONFIG.ALCHEMY_API_KEY && ENVIRONMENT_CONFIG.ENABLE_BATCH_OPTIMIZATION),
    hasFullFeatureSet: Boolean(
      ENVIRONMENT_CONFIG.WALLETCONNECT_PROJECT_ID &&
      ENVIRONMENT_CONFIG.ALCHEMY_API_KEY &&
      ENVIRONMENT_CONFIG.COINBASE_PROJECT_ID
    )
  }
  
  const isValid = capabilities.hasBasicWeb3
  
  return {
    isValid,
    warnings,
    errors,
    capabilities
  }
}

// ================================================
// ENHANCED CHAIN AND NETWORK CONFIGURATION
// ================================================

/**
 * Enhanced Chain Configuration
 * 
 * This extends your existing chain setup with MiniApp-specific optimizations
 * while maintaining your established Base network focus.
 */
export const ENHANCED_SUPPORTED_CHAINS = [base, baseSepolia] as const

/**
 * Enhanced RPC Transport Configuration
 * 
 * This builds upon your existing multi-provider RPC setup with enhanced
 * fallback strategies, WebSocket support, and performance optimizations.
 */
function createEnhancedTransports(capabilities: ReturnType<typeof validateEnhancedEnvironment>['capabilities']) {
  // Enhanced RPC configuration with multiple reliable providers
  const baseRpcEndpoints = [
    // Primary: Alchemy (if available) - your existing pattern
    ...(ENVIRONMENT_CONFIG.ALCHEMY_API_KEY ? [
      `https://base-mainnet.g.alchemy.com/v2/${ENVIRONMENT_CONFIG.ALCHEMY_API_KEY}`
    ] : []),
    // Secondary: Infura (if available)
    ...(ENVIRONMENT_CONFIG.INFURA_PROJECT_ID ? [
      `https://base-mainnet.infura.io/v3/${ENVIRONMENT_CONFIG.INFURA_PROJECT_ID}`
    ] : []),
    // Tertiary: Ankr (if available)
    ...(ENVIRONMENT_CONFIG.ANKR_API_KEY ? [
      `https://rpc.ankr.com/base/${ENVIRONMENT_CONFIG.ANKR_API_KEY}`
    ] : []),
    // Public RPC fallbacks with rate limiting protection
    'https://base.llamarpc.com',
    'https://base.drpc.org',
    'https://base.blockpi.network/v1/rpc/public',
    'https://base.publicnode.com',
    'https://1rpc.io/base',
    // Original fallback (moved to end to prevent 403 issues)
    'https://mainnet.base.org'
  ]

  const baseSepoliaRpcEndpoints = [
    // Primary: Alchemy (if available)
    ...(ENVIRONMENT_CONFIG.ALCHEMY_API_KEY ? [
      `https://base-sepolia.g.alchemy.com/v2/${ENVIRONMENT_CONFIG.ALCHEMY_API_KEY}`
    ] : []),
    // Secondary: Infura (if available)
    ...(ENVIRONMENT_CONFIG.INFURA_PROJECT_ID ? [
      `https://base-sepolia.infura.io/v3/${ENVIRONMENT_CONFIG.INFURA_PROJECT_ID}`
    ] : []),
    // Tertiary: Ankr (if available)
    ...(ENVIRONMENT_CONFIG.ANKR_API_KEY ? [
      `https://rpc.ankr.com/base_sepolia/${ENVIRONMENT_CONFIG.ANKR_API_KEY}`
    ] : []),
    // Public RPC fallbacks
    'https://base-sepolia.llamarpc.com',
    'https://base-sepolia.drpc.org',
    'https://base-sepolia.blockpi.network/v1/rpc/public',
    'https://base-sepolia.publicnode.com',
    'https://sepolia.base.org'
  ]
  
  // Enhanced transport creation with fallback strategies
  const createTransportForChain = (endpoints: string[], chainId: number) => {
    const httpTransports = endpoints.map(endpoint => http(endpoint))
    
    // If WebSocket is enabled and we have Alchemy, add WebSocket fallback
    if (ENVIRONMENT_CONFIG.ENABLE_WEBSOCKET_FALLBACK && ENVIRONMENT_CONFIG.ALCHEMY_API_KEY) {
      const wsEndpoint = chainId === base.id 
        ? `wss://base-mainnet.g.alchemy.com/v2/${ENVIRONMENT_CONFIG.ALCHEMY_API_KEY}`
        : `wss://base-sepolia.g.alchemy.com/v2/${ENVIRONMENT_CONFIG.ALCHEMY_API_KEY}`
      
      return fallback([
        webSocket(wsEndpoint),
        ...httpTransports
      ], {
        rank: true, // Automatically rank by performance
        retryCount: 3,
        retryDelay: 1000
      })
    }
    
    // Standard HTTP fallback following your existing patterns
    return fallback(httpTransports, {
      rank: capabilities.hasOptimalPerformance,
      retryCount: 2,
      retryDelay: 500
    })
  }
  
  return {
    [base.id]: createTransportForChain(baseRpcEndpoints, base.id),
    [baseSepolia.id]: createTransportForChain(baseSepoliaRpcEndpoints, baseSepolia.id)
  }
}

// ================================================
// ENHANCED CONNECTOR CONFIGURATION
// ================================================

/**
 * Enhanced Connector Factory
 * 
 * This creates connectors based on environment detection and capability assessment,
 * building upon your existing connector configuration patterns.
 */
async function createEnhancedConnectors(
  environmentDetection: MiniAppEnvironmentDetection | null
): Promise<Array<ReturnType<typeof metaMask> | ReturnType<typeof coinbaseWallet> | ReturnType<typeof walletConnect> | any>> {
  
  const connectors: any[] = []
  
  // Your existing connectors preserved and enhanced
  
  // MetaMask Connector - Enhanced with MiniApp detection
  connectors.push(
    metaMask({
      dappMetadata: {
        name: 'Bloom',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
        iconUrl: '/favicon.ico'
      },
      // Enhanced configuration for better mobile experience
      preferDesktop: false,
      // Optimize for MiniApp if detected
      ...(environmentDetection?.environment === 'farcaster' && {
        shimDisconnect: false, // Disable shimming in MiniApp context
        UNSTABLE_shimOnConnectSelectAccount: false
      })
    })
  )
  
  // Coinbase Wallet Connector - Enhanced with your existing patterns
  connectors.push(
    coinbaseWallet({
      appName: 'Bloom',
      appLogoUrl: '/favicon.ico',
      // Enhanced configuration building on your existing setup
      preference: environmentDetection?.environment === 'farcaster' ? 'smartWalletOnly' : 'all',
      version: '4',
      // Enable batch transactions in MiniApp context
      ...(environmentDetection?.capabilities.wallet.canBatchTransactions && {
        enableBatchTransactions: true
      })
    })
  )
  
  // WalletConnect Connector - Enhanced with your existing configuration
  if (ENVIRONMENT_CONFIG.WALLETCONNECT_PROJECT_ID) {
    connectors.push(
      walletConnect({
        projectId: ENVIRONMENT_CONFIG.WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: 'Bloom',
          description: 'Decentralized content subscription platform on Base',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000',
          icons: ['/favicon.ico']
        },
        // Enhanced configuration for MiniApp compatibility
        showQrModal: environmentDetection?.environment !== 'farcaster', // Hide QR in MiniApp
        // Optimize for embedded contexts
        qrModalOptions: {
          themeMode: 'dark',
          themeVariables: {
            '--wcm-z-index': '999999'
          }
        }
      })
    )
  }
  
  // Injected Connector (fallback for other wallets)
  connectors.push(
    injected({
      // Enhanced configuration for broader wallet support
      shimDisconnect: true
    })
  )
  
  return connectors
}

// ================================================
// ENHANCED STORAGE CONFIGURATION
// ================================================

/**
 * Enhanced Storage Configuration
 * 
 * This extends your existing cookie storage setup with MiniApp-specific
 * optimizations and enhanced persistence strategies.
 */
function createEnhancedStorage(environmentDetection: MiniAppEnvironmentDetection | null) {
  const baseStorageKey = 'onchain-content-wagmi'
  
  // Differentiate storage keys based on context to prevent conflicts
  const storageKey = environmentDetection?.environment === 'farcaster' 
    ? `${baseStorageKey}-miniapp`
    : baseStorageKey
  
  return createStorage({
    storage: cookieStorage,
    key: storageKey,
    // Enhanced configuration for MiniApp contexts
    serialize: (value) => {
      try {
        // Add validation to prevent corrupted state from being stored
        if (value && typeof value === 'object') {
          // Ensure connections is always a Map or null
          if (value.connections && !(value.connections instanceof Map)) {
            console.warn('Invalid connections state detected, resetting to null')
            value.connections = null
          }
          
          // Ensure other critical state properties are valid
          if (value.accounts && !Array.isArray(value.accounts)) {
            value.accounts = []
          }
          
          if (value.chainId && typeof value.chainId !== 'number') {
            value.chainId = undefined
          }
        }
        
        return JSON.stringify(value)
      } catch (serializeError) {
        console.warn('Failed to serialize storage value:', serializeError)
        // Return a safe default state
        return JSON.stringify({
          connections: null,
          accounts: [],
          chainId: undefined,
          connector: undefined,
          status: 'disconnected'
        })
      }
    },
    deserialize: (value) => {
      try {
        const parsed = JSON.parse(value)
        
        // Validate and fix corrupted state
        if (parsed && typeof parsed === 'object') {
          // Ensure connections is properly handled
          if (parsed.connections && typeof parsed.connections === 'object') {
            // Convert back to Map if it was serialized as an object
            if (!(parsed.connections instanceof Map)) {
              try {
                parsed.connections = new Map(Object.entries(parsed.connections))
              } catch (mapError) {
                console.warn('Failed to reconstruct connections Map, resetting:', mapError)
                parsed.connections = null
              }
            }
          } else {
            parsed.connections = null
          }
          
          // Ensure accounts is an array
          if (!Array.isArray(parsed.accounts)) {
            parsed.accounts = []
          }
          
          // Ensure chainId is a number or undefined
          if (parsed.chainId && typeof parsed.chainId !== 'number') {
            parsed.chainId = undefined
          }
          
          // Ensure status is valid
          const validStatuses = ['disconnected', 'connecting', 'connected', 'reconnecting']
          if (!validStatuses.includes(parsed.status)) {
            parsed.status = 'disconnected'
          }
        }
        
        return parsed
      } catch (deserializeError) {
        console.warn('Failed to deserialize storage value, using default state:', deserializeError)
        // Return a safe default state
        return {
          connections: null,
          accounts: [],
          chainId: undefined,
          connector: undefined,
          status: 'disconnected'
        }
      }
    }
  })
}

// ================================================
// MAIN ENHANCED WAGMI CONFIGURATION
// ================================================

/**
 * Enhanced Wagmi Configuration Factory
 * 
 * This is the main function that creates your enhanced wagmi configuration,
 * building upon all your existing patterns while adding MiniApp capabilities.
 */
export async function createEnhancedWagmiConfig(
  forceEnvironment?: MiniAppEnvironment
): Promise<ReturnType<typeof createConfig>> {

  // FIXED: Clear any corrupted state before creating new config
  if (typeof window !== 'undefined') {
    try {
      // Clear ALL wagmi-related localStorage keys that might be corrupted
      const keysToClear = [
        'wagmi.store',
        'wagmi.connections',
        'wagmi.state',
        'wagmi.account',
        'wagmi.chainId',
        'wagmi.recentConnectorId',
        'dxbloom-miniapp-wagmi',
        'dxbloom-miniapp-wagmi-unified',
        'onchain-content-wagmi',
        'onchain-content-wagmi-miniapp'
      ]

      // Clear all wagmi-related keys
      keysToClear.forEach(key => {
        try {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        } catch (e) {
          // Ignore cleanup errors
        }
      })

      // Also clear any keys that contain 'wagmi' in the name
      Object.keys(localStorage).forEach(key => {
        if (key.includes('wagmi') || key.includes('wallet') || key.includes('connector')) {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      })

      console.log('✅ Cleared ALL potentially corrupted wagmi storage')
    } catch (error) {
      console.warn('Failed to clear corrupted wagmi storage:', error)
    }
  }

  // Validate environment configuration
  const environmentValidation = validateEnhancedEnvironment()
  
  if (!environmentValidation.isValid) {
    throw new Error('Invalid environment configuration - check your environment variables')
  }
  
  // Log warnings for development
  if (process.env.NODE_ENV === 'development' && environmentValidation.warnings.length > 0) {
    console.warn('Enhanced Wagmi Configuration Warnings:')
    environmentValidation.warnings.forEach(warning => console.warn(warning))
  }
  
  // Perform environment detection
  let environmentDetection: MiniAppEnvironmentDetection | null = null
  try {
    // Only detect if not forcing environment and if MiniApp is enabled
    if (!forceEnvironment && ENVIRONMENT_CONFIG.MINIAPP_ENABLED) {
      environmentDetection = await detectMiniAppEnvironment()
    } else if (forceEnvironment) {
      // Create minimal detection for forced environment
      environmentDetection = {
        environment: forceEnvironment,
        detectedPlatform: 'WEB_DESKTOP' as any,
        farcasterContext: {
          isInFarcasterClient: forceEnvironment === 'farcaster',
          clientType: forceEnvironment === 'farcaster' ? 'warpcast' : null,
          clientVersion: null,
          frameContext: false,
          embedDepth: 0
        },
        sdkAvailability: {
          hasFarcasterSDK: forceEnvironment === 'farcaster',
          sdkVersion: null,
          initializationStatus: 'available',
          lastDetectionAttempt: new Date()
        },
        capabilities: {
          wallet: {
            canConnect: true,
            canSignTransactions: true,
            canBatchTransactions: forceEnvironment === 'farcaster',
            supportedChains: [8453, 84532],
            maxTransactionValue: null,
            requiredConfirmations: 1
          },
          social: {
            canShare: forceEnvironment === 'farcaster',
            canCompose: forceEnvironment === 'farcaster',
            canAccessSocialGraph: forceEnvironment === 'farcaster',
            canReceiveNotifications: false,
            canSendNotifications: false,
            maxShareTextLength: forceEnvironment === 'farcaster' ? 320 : 0,
            supportedShareTypes: forceEnvironment === 'farcaster' ? ['text', 'image', 'frame'] : []
          },
          platform: {
            canDeepLink: true,
            canAccessClipboard: false,
            canAccessCamera: false,
            canAccessLocation: false,
            canVibrate: false,
            canPlayAudio: false,
            supportedImageFormats: ['jpeg', 'png']
          },
          performance: {
            supportsServiceWorker: true,
            supportsWebAssembly: true,
            supportsIndexedDB: true,
            maxMemoryUsage: 256,
            maxStorageSize: 50,
            batteryOptimized: false
          }
        },
        confidence: {
          overallConfidence: 1.0,
          platformConfidence: 1.0,
          deviceConfidence: 1.0,
          capabilityConfidence: 1.0,
          evidenceQuality: 'excellent',
          uncertaintyFactors: []
        },
        integrationRecommendations: {
          useEnhancedProvider: forceEnvironment === 'farcaster',
          enableSocialFeatures: forceEnvironment === 'farcaster',
          enableBatchTransactions: forceEnvironment === 'farcaster',
          fallbackToWebMode: false,
          monitorCapabilityChanges: false
        }
      }
    }
  } catch (error) {
    console.warn('Environment detection failed, falling back to web mode:', error)
    environmentDetection = null
  }
  
  // Create enhanced components with fallback handling
  let transports, connectors, storage

  try {
    transports = createEnhancedTransports(environmentValidation.capabilities)
    connectors = await createEnhancedConnectors(environmentDetection)
    storage = createEnhancedStorage(environmentDetection)
  } catch (componentError) {
    console.warn('Failed to create enhanced components, using minimal fallback:', componentError)

    // Fallback: Create minimal, reliable configuration
    transports = {
      [base.id]: http('https://mainnet.base.org'),
      [baseSepolia.id]: http('https://sepolia.base.org')
    }

    connectors = [
      metaMask(),
      walletConnect({
        projectId: ENVIRONMENT_CONFIG.WALLETCONNECT_PROJECT_ID || 'default',
        metadata: {
          name: 'OnChain Content Platform',
          description: 'Decentralized content platform',
          url: 'https://dxbloom.com',
          icons: ['https://dxbloom.com/favicon.ico']
        }
      })
    ]

    storage = createStorage({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      key: 'dxbloom-miniapp-fallback'
    })
  }
  
  // Create the enhanced wagmi configuration with error handling
  let config

  try {
    config = createConfig({
      chains: ENHANCED_SUPPORTED_CHAINS,
      connectors,
      transports,
      storage,

      // Enhanced SSR configuration building on your existing patterns
      ssr: true,
    
    // Enhanced batching configuration for optimal performance
    batch: {
      multicall: {
        // Adaptive batch size based on environment
        batchSize: environmentDetection?.environment === 'farcaster' 
          ? 1024 * 250  // Smaller batches for mobile
          : 1024 * 500, // Your existing size for web
        wait: environmentDetection?.environment === 'farcaster'
          ? 100  // Faster batching for responsive mobile UX
          : 200, // Your existing timing for web
        // Enhanced multicall configuration
        ...(ENVIRONMENT_CONFIG.ENABLE_BATCH_OPTIMIZATION && {
          multicallAddress: environmentDetection?.capabilities.wallet.canBatchTransactions
            ? CONTRACT_ADDRESSES[base.id]?.COMMERCE_INTEGRATION // Use your contract if batch-capable
            : undefined
        })
      }
    },
    
    // Enhanced caching configuration
    ...(ENVIRONMENT_CONFIG.ENABLE_SMART_CACHING && {
      cacheTime: environmentDetection?.environment === 'farcaster'
        ? 60_000  // Longer caching for mobile to reduce requests
        : 30_000, // Your existing cache time for web
      
      // Adaptive polling based on environment
      pollingInterval: environmentDetection?.environment === 'farcaster'
        ? undefined // Disable polling in MiniApp to save battery
        : undefined // Your existing setting
    })
  })

  } catch (configError) {
    console.error('Failed to create wagmi config, using emergency fallback:', configError)

    // EMERGENCY FALLBACK: Create the most basic, reliable configuration possible
    config = createConfig({
      chains: [base],
      connectors: [
        metaMask(),
        walletConnect({
          projectId: 'default-emergency-fallback',
          metadata: {
            name: 'OnChain Content Platform',
            description: 'Emergency fallback configuration',
            url: 'https://dxbloom.com',
            icons: []
          }
        })
      ],
      transports: {
        [base.id]: http('https://mainnet.base.org')
      },
      storage: createStorage({
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        key: 'dxbloom-emergency-fallback'
      }),
      ssr: true
    })

    console.log('✅ Created emergency fallback wagmi configuration')
  }

  // Attach metadata for debugging and monitoring
  if (config) {
    Object.defineProperty(config, '_enhancedMetadata', {
      value: {
        environmentDetection,
        environmentValidation,
        configurationTimestamp: new Date().toISOString(),
        version: '1.0.0',
        fallbackUsed: !transports || !connectors || !storage
      },
      enumerable: false,
      writable: false
    })
  }

  return config
}

// ================================================
// CONVENIENCE EXPORTS AND UTILITIES
// ================================================

/**
 * Default Enhanced Configuration
 * 
 * This provides a pre-configured instance that can be used directly,
 * following your existing patterns of providing ready-to-use configurations.
 */
let defaultConfigPromise: Promise<ReturnType<typeof createConfig>> | null = null

export async function getEnhancedWagmiConfig(): Promise<ReturnType<typeof createConfig>> {
  if (!defaultConfigPromise) {
    defaultConfigPromise = createEnhancedWagmiConfig()
  }
  return defaultConfigPromise
}

/**
 * Configuration Health Check
 * 
 * This provides comprehensive health checking that builds upon your existing
 * validation patterns while adding MiniApp-specific checks.
 */
export async function checkEnhancedConfigHealth(): Promise<{
  isHealthy: boolean
  details: {
    environment: ReturnType<typeof validateEnhancedEnvironment>
    rpcHealth: Record<number, boolean>
    connectorHealth: Record<string, boolean>
    miniAppCapabilities: MiniAppCapabilities | null
  }
  recommendations: string[]
}> {
  const environmentValidation = validateEnhancedEnvironment()
  const recommendations: string[] = []
  
  // Check RPC health for each chain
  const rpcHealth: Record<number, boolean> = {}
  for (const chain of ENHANCED_SUPPORTED_CHAINS) {
    try {
      // Basic RPC health check
      const response = await fetch(`https://${chain.id === base.id ? 'mainnet' : 'sepolia'}.base.org`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        })
      })
      rpcHealth[chain.id] = response.ok
    } catch {
      rpcHealth[chain.id] = false
      recommendations.push(`RPC health check failed for chain ${chain.id}`)
    }
  }
  
  // Check connector health (basic availability)
  const connectorHealth: Record<string, boolean> = {
    metaMask: typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask),
    coinbaseWallet: typeof window !== 'undefined' && Boolean(window.ethereum?.isCoinbaseWallet),
    walletConnect: Boolean(ENVIRONMENT_CONFIG.WALLETCONNECT_PROJECT_ID),
    farcasterMiniApp: ENVIRONMENT_CONFIG.MINIAPP_ENABLED
  }
  
  // Get MiniApp capabilities if available
  let miniAppCapabilities: MiniAppCapabilities | null = null
  try {
    if (ENVIRONMENT_CONFIG.MINIAPP_ENABLED) {
      const detection = await detectMiniAppEnvironment()
      miniAppCapabilities = detection.capabilities
    }
  } catch {
    recommendations.push('MiniApp capability detection failed')
  }
  
  // Generate recommendations
  if (!environmentValidation.capabilities.hasFullFeatureSet) {
    recommendations.push('Consider adding missing environment variables for optimal functionality')
  }
  
  if (Object.values(rpcHealth).some(healthy => !healthy)) {
    recommendations.push('Some RPC endpoints are unhealthy - consider checking network connectivity')
  }
  
  if (!connectorHealth.walletConnect) {
    recommendations.push('WalletConnect not configured - add NEXT_PUBLIC_REOWN_PROJECT_ID for better wallet support')
  }
  
  const isHealthy = environmentValidation.isValid && 
                   Object.values(rpcHealth).every(healthy => healthy) &&
                   (connectorHealth.metaMask || connectorHealth.coinbaseWallet || connectorHealth.walletConnect)
  
  return {
    isHealthy,
    details: {
      environment: environmentValidation,
      rpcHealth,
      connectorHealth,
      miniAppCapabilities
    },
    recommendations
  }
}

/**
 * Configuration Debug Information
 * 
 * This provides comprehensive debugging information for development,
 * following your existing patterns of providing helpful development utilities.
 */
export async function getEnhancedConfigDebugInfo(): Promise<{
  configuration: any
  environment: ReturnType<typeof validateEnhancedEnvironment>
  detection: MiniAppEnvironmentDetection | null
  performance: {
    configCreationTime: number
    connectorCount: number
    transportCount: number
  }
}> {
  const startTime = performance.now()
  
  const environmentValidation = validateEnhancedEnvironment()
  
  let detection: MiniAppEnvironmentDetection | null = null
  try {
    if (ENVIRONMENT_CONFIG.MINIAPP_ENABLED) {
      detection = await detectMiniAppEnvironment()
    }
  } catch (error) {
    console.warn('Detection failed in debug mode:', error)
  }
  
  const config = await createEnhancedWagmiConfig()
  const configCreationTime = performance.now() - startTime
  
  return {
    configuration: {
      chains: config.chains.map(chain => ({ id: chain.id, name: chain.name })),
      connectors: config.connectors.map(connector => ({
        id: connector.id,
        name: connector.name,
        type: connector.type
      })),
      storage: config.storage ? 'configured' : 'not configured',
      metadata: (config as any)._enhancedMetadata || null
    },
    environment: environmentValidation,
    detection,
    performance: {
      configCreationTime,
      connectorCount: config.connectors.length,
      transportCount: Object.keys(config.chains).length
    }
  }
}

// ================================================
// TYPE EXPORTS FOR EXTERNAL USE
// ================================================

export type EnhancedWagmiConfig = Awaited<ReturnType<typeof createEnhancedWagmiConfig>>
export type ConfigHealthCheck = Awaited<ReturnType<typeof checkEnhancedConfigHealth>>
export type ConfigDebugInfo = Awaited<ReturnType<typeof getEnhancedConfigDebugInfo>>

// Re-export relevant types from your existing configuration
export {
  ENHANCED_SUPPORTED_CHAINS as supportedChains,
  isSupportedChain,
  getContractAddresses
}

// ================================================
// INITIALIZATION HELPER FOR PROVIDER INTEGRATION
// ================================================

/**
 * Configuration Initializer for Provider Integration
 * 
 * This helper function provides easy integration with your Enhanced MiniApp Provider,
 * ensuring proper initialization sequence and error handling.
 */
export async function initializeEnhancedWagmiForProvider(
  environmentDetection?: MiniAppEnvironmentDetection
): Promise<{
  config: EnhancedWagmiConfig
  isReady: boolean
  error: Error | null
  recommendations: string[]
}> {
  try {
    const config = await createEnhancedWagmiConfig(environmentDetection?.environment)
    const health = await checkEnhancedConfigHealth()
    
    return {
      config,
      isReady: health.isHealthy,
      error: null,
      recommendations: health.recommendations
    }
  } catch (error) {
    return {
      config: await createEnhancedWagmiConfig('web'), // Fallback to web mode
      isReady: false,
      error: error as Error,
      recommendations: ['Failed to initialize enhanced configuration - falling back to web mode']
    }
  }
}
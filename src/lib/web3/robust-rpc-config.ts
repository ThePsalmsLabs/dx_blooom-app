/**
 * Robust RPC Configuration for Base Network
 * 
 * This configuration prioritizes reliable RPC endpoints and implements
 * proper fallback strategies to prevent the 403/connection errors.
 */

import { http, fallback } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

/**
 * Reliable RPC Endpoints for Base Network
 * 
 * These endpoints have been tested and are known to work reliably.
 * We prioritize endpoints that don't require API keys and have good uptime.
 */
const createReliableBaseTransports = () => {
  const reliableEndpoints = [
    // Primary: Alchemy (if API key is available)
    ...(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? [
      http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, {
        batch: {
          batchSize: 100,
          wait: 16,
        },
        retryCount: 3,
        retryDelay: 1000,
        timeout: 10000,
      })
    ] : []),
    
    // Secondary: Reliable public endpoints
    http('https://base.llamarpc.com', {
      batch: {
        batchSize: 50,
        wait: 32,
      },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
    
    http('https://base.drpc.org', {
      batch: {
        batchSize: 50,
        wait: 32,
      },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
    
    http('https://base.publicnode.com', {
      batch: {
        batchSize: 50,
        wait: 32,
      },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
    
    // Fallback: Base official RPC (with conservative settings)
    http('https://mainnet.base.org', {
      batch: {
        batchSize: 10,
        wait: 100,
      },
      retryCount: 1,
      retryDelay: 5000,
      timeout: 20000,
    }),
  ]

  return fallback(reliableEndpoints, {
    rank: {
      interval: 30_000,        // Re-rank every 30 seconds
      sampleCount: 3,          // Use 3 samples for ranking
      timeout: 2000,           // 2 second timeout for ranking
      weights: {
        latency: 0.7,          // 70% weight for latency
        stability: 0.3,        // 30% weight for stability
      },
    },
    retryCount: 2,
    retryDelay: 1000,
  })
}

const createReliableBaseSepoliaTransports = () => {
  const reliableEndpoints = [
    // Primary: Alchemy (if API key is available)
    ...(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? [
      http(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`, {
        batch: {
          batchSize: 100,
          wait: 16,
        },
        retryCount: 3,
        retryDelay: 1000,
        timeout: 10000,
      })
    ] : []),
    
    // Secondary: Reliable public endpoints
    http('https://base-sepolia.llamarpc.com', {
      batch: {
        batchSize: 50,
        wait: 32,
      },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
    
    http('https://base-sepolia.drpc.org', {
      batch: {
        batchSize: 50,
        wait: 32,
      },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
    
    // Fallback: Base Sepolia official RPC
    http('https://sepolia.base.org', {
      batch: {
        batchSize: 10,
        wait: 100,
      },
      retryCount: 1,
      retryDelay: 5000,
      timeout: 20000,
    }),
  ]

  return fallback(reliableEndpoints, {
    rank: {
      interval: 30_000,
      sampleCount: 3,
      timeout: 2000,
      weights: {
        latency: 0.7,
        stability: 0.3,
      },
    },
    retryCount: 2,
    retryDelay: 1000,
  })
}

export const robustRpcTransports = {
  [base.id]: createReliableBaseTransports(),
  [baseSepolia.id]: createReliableBaseSepoliaTransports(),
}

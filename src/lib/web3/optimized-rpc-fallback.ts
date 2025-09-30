/**
 * Optimized RPC Fallback Strategy
 * 
 * This module implements intelligent RPC fallback with health monitoring,
 * automatic failover, and performance optimization to prevent the 403/connection
 * errors we've been experiencing.
 */

import { http, fallback, webSocket } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'

/**
 * RPC Health Monitor
 * 
 * Tracks the health and performance of RPC endpoints to make intelligent
 * routing decisions.
 */
class RPCHealthMonitor {
  private endpointHealth = new Map<string, {
    isHealthy: boolean
    lastCheck: number
    responseTime: number
    errorCount: number
    successCount: number
  }>()

  private readonly HEALTH_CHECK_INTERVAL = 30_000 // 30 seconds
  private readonly ERROR_THRESHOLD = 3
  private readonly MAX_RESPONSE_TIME = 10_000 // 10 seconds

  /**
   * Check if an endpoint is healthy
   */
  isHealthy(endpoint: string): boolean {
    const health = this.endpointHealth.get(endpoint)
    if (!health) return true // Assume healthy if not checked yet
    
    const timeSinceLastCheck = Date.now() - health.lastCheck
    if (timeSinceLastCheck > this.HEALTH_CHECK_INTERVAL) {
      return true // Consider healthy if not checked recently
    }
    
    return health.isHealthy && 
           health.errorCount < this.ERROR_THRESHOLD &&
           health.responseTime < this.MAX_RESPONSE_TIME
  }

  /**
   * Record a successful request
   */
  recordSuccess(endpoint: string, responseTime: number): void {
    const health = this.endpointHealth.get(endpoint) || {
      isHealthy: true,
      lastCheck: Date.now(),
      responseTime: 0,
      errorCount: 0,
      successCount: 0
    }
    
    health.successCount++
    health.responseTime = (health.responseTime + responseTime) / 2 // Moving average
    health.lastCheck = Date.now()
    health.isHealthy = true
    
    this.endpointHealth.set(endpoint, health)
  }

  /**
   * Record a failed request
   */
  recordError(endpoint: string): void {
    const health = this.endpointHealth.get(endpoint) || {
      isHealthy: true,
      lastCheck: Date.now(),
      responseTime: 0,
      errorCount: 0,
      successCount: 0
    }
    
    health.errorCount++
    health.lastCheck = Date.now()
    
    if (health.errorCount >= this.ERROR_THRESHOLD) {
      health.isHealthy = false
    }
    
    this.endpointHealth.set(endpoint, health)
  }

  /**
   * Get the best performing endpoint
   */
  getBestEndpoint(endpoints: string[]): string | null {
    const healthyEndpoints = endpoints.filter(endpoint => this.isHealthy(endpoint))
    
    if (healthyEndpoints.length === 0) {
      return endpoints[0] // Fallback to first endpoint
    }
    
    // Sort by performance (response time)
    return healthyEndpoints.sort((a, b) => {
      const healthA = this.endpointHealth.get(a)
      const healthB = this.endpointHealth.get(b)
      
      if (!healthA || !healthB) return 0
      return healthA.responseTime - healthB.responseTime
    })[0]
  }
}

// Global health monitor instance
const healthMonitor = new RPCHealthMonitor()

/**
 * Enhanced HTTP Transport with Health Monitoring
 */
function createMonitoredHttpTransport(endpoint: string, options: any = {}) {
  return http(endpoint, {
    ...options,
    onRequest: (request) => {
      const startTime = Date.now()
      
      // Add request interceptor for health monitoring
      const originalFetch = request.fetch
      request.fetch = async (...args) => {
        try {
          const response = await originalFetch(...args)
          const responseTime = Date.now() - startTime
          
          if (response.ok) {
            healthMonitor.recordSuccess(endpoint, responseTime)
          } else {
            healthMonitor.recordError(endpoint)
          }
          
          return response
        } catch (error) {
          healthMonitor.recordError(endpoint)
          throw error
        }
      }
    }
  })
}

/**
 * Tier 1: Premium RPC Providers (Highest Priority)
 */
function createPremiumRPCTransports() {
  const premiumProviders = []
  
  // Alchemy (Most reliable for Base)
  if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    premiumProviders.push(
      createMonitoredHttpTransport(
        `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
        {
          batch: { batchSize: 1000, wait: 8 },
          retryCount: 3,
          retryDelay: 1000,
          timeout: 10000,
        }
      )
    )
  }
  
  // Infura (Reliable backup)
  if (process.env.NEXT_PUBLIC_INFURA_API_KEY) {
    premiumProviders.push(
      createMonitoredHttpTransport(
        `https://base-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`,
        {
          batch: { batchSize: 1000, wait: 8 },
          retryCount: 3,
          retryDelay: 1000,
          timeout: 10000,
        }
      )
    )
  }
  
  return premiumProviders
}

/**
 * Tier 2: Reliable Public RPC Providers
 */
function createReliablePublicTransports() {
  return [
    // LlamaRPC (Usually very reliable)
    createMonitoredHttpTransport('https://base.llamarpc.com', {
      batch: { batchSize: 100, wait: 32 },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
    
    // DRPC (Good performance)
    createMonitoredHttpTransport('https://base.drpc.org', {
      batch: { batchSize: 100, wait: 32 },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
    
    // PublicNode (Reliable)
    createMonitoredHttpTransport('https://base.publicnode.com', {
      batch: { batchSize: 100, wait: 32 },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
  ]
}

/**
 * Tier 3: Emergency Fallback
 */
function createEmergencyTransports() {
  return [
    // Base official RPC (Last resort)
    createMonitoredHttpTransport('https://mainnet.base.org', {
      batch: { batchSize: 10, wait: 100 },
      retryCount: 1,
      retryDelay: 5000,
      timeout: 30000,
    }),
  ]
}

/**
 * Create Optimized Base Mainnet Transport
 */
export function createOptimizedBaseTransport() {
  const premiumProviders = createPremiumRPCTransports()
  const reliableProviders = createReliablePublicTransports()
  const emergencyProviders = createEmergencyTransports()
  
  // Combine all providers with intelligent ordering
  const allProviders = [
    ...premiumProviders,
    ...reliableProviders,
    ...emergencyProviders
  ]
  
  // Log configuration status
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 RPC Configuration: ${premiumProviders.length} premium, ${reliableProviders.length} reliable, ${emergencyProviders.length} emergency providers`)
    
    if (premiumProviders.length === 0) {
      console.warn('⚠️  No premium RPC providers configured. Consider adding API keys for better performance.')
    }
  }
  
  return fallback(allProviders, {
    rank: {
      interval: 15_000,        // Re-rank every 15 seconds
      sampleCount: 3,           // Use 3 samples for ranking
      timeout: 2000,            // 2 second timeout for ranking
      weights: {
        latency: 0.8,           // 80% weight for latency
        stability: 0.2,        // 20% weight for stability
      },
    },
    retryCount: 2,
    retryDelay: 1000,
  })
}

/**
 * Create Optimized Base Sepolia Transport
 */
export function createOptimizedBaseSepoliaTransport() {
  const premiumProviders = []
  
  // Alchemy Sepolia
  if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
    premiumProviders.push(
      createMonitoredHttpTransport(
        `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
        {
          batch: { batchSize: 1000, wait: 8 },
          retryCount: 3,
          retryDelay: 1000,
          timeout: 10000,
        }
      )
    )
  }
  
  const reliableProviders = [
    createMonitoredHttpTransport('https://base-sepolia.llamarpc.com', {
      batch: { batchSize: 100, wait: 32 },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
    
    createMonitoredHttpTransport('https://base-sepolia.drpc.org', {
      batch: { batchSize: 100, wait: 32 },
      retryCount: 2,
      retryDelay: 2000,
      timeout: 15000,
    }),
  ]
  
  const emergencyProviders = [
    createMonitoredHttpTransport('https://sepolia.base.org', {
      batch: { batchSize: 10, wait: 100 },
      retryCount: 1,
      retryDelay: 5000,
      timeout: 30000,
    }),
  ]
  
  return fallback([
    ...premiumProviders,
    ...reliableProviders,
    ...emergencyProviders
  ], {
    rank: {
      interval: 15_000,
      sampleCount: 3,
      timeout: 2000,
      weights: {
        latency: 0.8,
        stability: 0.2,
      },
    },
    retryCount: 2,
    retryDelay: 1000,
  })
}

/**
 * Export optimized transports
 */
export const optimizedRpcTransports = {
  [base.id]: createOptimizedBaseTransport(),
  [baseSepolia.id]: createOptimizedBaseSepoliaTransport(),
}

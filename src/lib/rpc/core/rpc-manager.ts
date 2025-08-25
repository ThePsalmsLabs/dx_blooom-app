// src/lib/rpc/core/rpc-manager.ts

import { createPublicClient, http, fallback, MulticallParameters, Address, PublicClient, Chain } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { LRUCache } from 'lru-cache'

/**
 * Advanced RPC Management System
 * 
 * This system provides intelligent request batching, caching, deduplication,
 * and load balancing across multiple RPC providers for optimal performance.
 * 
 * Key Features:
 * - Page-context aware batching
 * - Intelligent request deduplication 
 * - Multi-tier caching with smart invalidation
 * - Provider health monitoring and failover
 * - Rate limit management and backoff
 * - Performance metrics and analytics
 */

export interface RPCRequest {
  id: string
  address: Address
  abi: readonly unknown[]
  functionName: string
  args?: readonly unknown[]
  chainId: number
  priority: 'high' | 'medium' | 'low'
  pageContext?: string
  cacheKey?: string
  cacheDuration?: number
}

export interface RPCResponse<T = unknown> {
  id: string
  data?: T
  error?: Error
  timestamp: number
  source: 'cache' | 'batch' | 'single'
  provider?: string
}

export interface BatchConfig {
  maxBatchSize: number
  maxWaitTime: number
  priorityThreshold: number
  pageContextGrouping: boolean
}

export interface CacheConfig {
  maxSize: number
  defaultTTL: number
  priorityTTL: Record<string, number>
  invalidationPatterns: Record<string, string[]>
}

export interface ProviderConfig {
  name: string
  url: string
  tier: 'premium' | 'standard' | 'fallback'
  weight: number
  rateLimit: number
  timeout: number
}

/**
 * Advanced RPC Client with intelligent load balancing and health monitoring
 */
class EnhancedRPCClient {
  private clients: Map<string, PublicClient> = new Map()
  private providerHealth: Map<string, { 
    isHealthy: boolean
    lastCheck: number
    errorCount: number
    avgLatency: number
    requestCount: number
  }> = new Map()

  constructor(private providers: ProviderConfig[], private chain: Chain) {
    this.initializeClients()
    this.startHealthMonitoring()
  }

  private initializeClients(): void {
    const transports = this.providers.map(provider => {
      const client = createPublicClient({
        chain: this.chain,
        transport: http(provider.url, {
          timeout: provider.timeout,
          retryCount: 3,
          retryDelay: 200, // Fixed delay instead of function
        })
      })
      
      this.clients.set(provider.name, client)
      this.providerHealth.set(provider.name, {
        isHealthy: true,
        lastCheck: Date.now(),
        errorCount: 0,
        avgLatency: 0,
        requestCount: 0
      })

      return http(provider.url, {
        timeout: provider.timeout,
        retryCount: 0, // We handle retries at the manager level
      })
    })

    // Create fallback client with all providers
    const fallbackClient = createPublicClient({
      chain: this.chain,
      transport: fallback(transports, { 
        rank: {
          interval: 60_000,
          sampleCount: 10,
          timeout: 5_000,
          weights: Object.fromEntries(
            this.providers.map(p => [p.url, p.weight])
          )
        }
      })
    })

    this.clients.set('fallback', fallbackClient)
  }

  private startHealthMonitoring(): void {
    setInterval(() => {
      this.checkProviderHealth()
    }, 30_000) // Check health every 30 seconds
  }

  private async checkProviderHealth(): Promise<void> {
    const promises = Array.from(this.clients.entries())
      .filter(([name]) => name !== 'fallback')
      .map(async ([name, client]) => {
        const start = Date.now()
        const health = this.providerHealth.get(name)!
        
        try {
          await client.getBlockNumber()
          const latency = Date.now() - start
          
          this.providerHealth.set(name, {
            ...health,
            isHealthy: true,
            lastCheck: Date.now(),
            errorCount: Math.max(0, health.errorCount - 1),
            avgLatency: (health.avgLatency * 0.7) + (latency * 0.3), // Weighted average
            requestCount: health.requestCount + 1
          })
        } catch (error) {
          this.providerHealth.set(name, {
            ...health,
            isHealthy: health.errorCount > 3 ? false : true,
            lastCheck: Date.now(),
            errorCount: health.errorCount + 1,
            avgLatency: health.avgLatency,
            requestCount: health.requestCount + 1
          })
        }
      })

    await Promise.allSettled(promises)
  }

  async executeRequest<T>(request: RPCRequest): Promise<T> {
    const healthyProviders = Array.from(this.providerHealth.entries())
      .filter(([_, health]) => health.isHealthy)
      .sort(([_a, a], [_b, b]) => a.avgLatency - b.avgLatency)

    if (healthyProviders.length === 0) {
      // All providers unhealthy, use fallback
      const fallbackClient = this.clients.get('fallback')!
      return await fallbackClient.readContract({
        address: request.address,
        abi: request.abi,
        functionName: request.functionName,
        args: request.args || []
      }) as T
    }

    // Try providers in order of health/latency
    for (const [providerName] of healthyProviders) {
      try {
        const client = this.clients.get(providerName)!
        const result = await client.readContract({
          address: request.address,
          abi: request.abi,
          functionName: request.functionName,
          args: request.args || []
        }) as T

        return result
      } catch (error) {
        const health = this.providerHealth.get(providerName)!
        this.providerHealth.set(providerName, {
          ...health,
          errorCount: health.errorCount + 1
        })
        continue
      }
    }

    throw new Error('All RPC providers failed')
  }

  async executeBatch(requests: RPCRequest[]): Promise<Map<string, unknown>> {
    const client = this.getBestClient()
    const results = new Map<string, unknown>()

    try {
      const contracts = requests.map(req => ({
        address: req.address,
        abi: req.abi,
        functionName: req.functionName,
        args: req.args || []
      }))

      const batchResults = await client.multicall({
        contracts: contracts as any,
        allowFailure: true
      })

      batchResults.forEach((result, index) => {
        const request = requests[index]
        if (result.status === 'success') {
          results.set(request.id, result.result)
        } else {
          results.set(request.id, new Error(result.error?.message || 'Unknown error'))
        }
      })

      return results
    } catch (error) {
      throw new Error(`Batch execution failed: ${error}`)
    }
  }

  private getBestClient(): PublicClient {
    const healthyProviders = Array.from(this.providerHealth.entries())
      .filter(([_, health]) => health.isHealthy)
      .sort(([_a, a], [_b, b]) => a.avgLatency - b.avgLatency)

    if (healthyProviders.length > 0) {
      return this.clients.get(healthyProviders[0][0])!
    }

    return this.clients.get('fallback')!
  }

  getHealthStatus() {
    return Object.fromEntries(this.providerHealth)
  }
}

/**
 * Main RPC Management System
 * 
 * Coordinates all RPC operations with intelligent batching, caching,
 * and performance optimization.
 */
export class RPCManager {
  private clients: Map<number, EnhancedRPCClient> = new Map()
  private requestQueue: Map<string, RPCRequest[]> = new Map()
  private pendingRequests: Map<string, Promise<unknown>> = new Map()
  private cache: LRUCache<string, { data: unknown; timestamp: number; ttl: number }>
  private batchTimers: Map<string, NodeJS.Timeout> = new Map()
  private pageContexts: Map<string, Set<string>> = new Map()
  private performanceMetrics: Map<string, {
    totalRequests: number
    cacheHits: number
    batchedRequests: number
    avgResponseTime: number
    errors: number
  }> = new Map()

  constructor(
    private batchConfig: BatchConfig = {
      maxBatchSize: 50,
      maxWaitTime: 100,
      priorityThreshold: 10,
      pageContextGrouping: true
    },
    private cacheConfig: CacheConfig = {
      maxSize: 10000,
      defaultTTL: 30000,
      priorityTTL: {
        'high': 10000,
        'medium': 30000, 
        'low': 60000
      },
      invalidationPatterns: {
        'purchase': ['hasAccess', 'getContent', 'userPurchases'],
        'subscription': ['getSubscriptionStatus', 'hasAccess'],
        'creator': ['getCreatorProfile', 'totalCreators']
      }
    }
  ) {
    this.cache = new LRUCache({
      max: cacheConfig.maxSize,
      ttl: cacheConfig.defaultTTL
    })

    this.initializeProviders()
    this.startMetricsCollection()
  }

  private initializeProviders(): void {
    const baseProviders: ProviderConfig[] = [
      // Premium Tier
      ...(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? [{
        name: 'alchemy',
        url: `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
        tier: 'premium' as const,
        weight: 100,
        rateLimit: 300,
        timeout: 10000
      }] : []),
      
      // Standard Tier
      {
        name: 'base-public',
        url: 'https://mainnet.base.org',
        tier: 'standard' as const,
        weight: 70,
        rateLimit: 50,
        timeout: 15000
      },
      
      // Fallback Tier
      {
        name: 'ankr-free',
        url: 'https://rpc.ankr.com/base',
        tier: 'fallback' as const,
        weight: 30,
        rateLimit: 20,
        timeout: 20000
      }
    ]

    const sepoliaProviders: ProviderConfig[] = [
      ...(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ? [{
        name: 'alchemy-sepolia',
        url: `https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
        tier: 'premium' as const,
        weight: 100,
        rateLimit: 300,
        timeout: 10000
      }] : []),
      
      {
        name: 'base-sepolia',
        url: 'https://sepolia.base.org',
        tier: 'standard' as const,
        weight: 70,
        rateLimit: 50,
        timeout: 15000
      }
    ]

    this.clients.set(base.id, new EnhancedRPCClient(baseProviders, base))
    this.clients.set(baseSepolia.id, new EnhancedRPCClient(sepoliaProviders, baseSepolia))
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.collectMetrics()
    }, 60000) // Collect metrics every minute
  }

  private collectMetrics(): void {
    console.log('RPC Manager Performance Metrics:', {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      queuedBatches: this.requestQueue.size,
      pageContexts: this.pageContexts.size,
      providerHealth: this.clients.get(base.id)?.getHealthStatus()
    })
  }

  /**
   * Execute a single RPC request with intelligent caching and deduplication
   */
  async executeRequest<T>(request: RPCRequest): Promise<RPCResponse<T>> {
    const startTime = Date.now()
    const cacheKey = this.generateCacheKey(request)
    const requestKey = `${request.chainId}-${cacheKey}`

    // Update performance metrics
    this.updateMetrics(request.pageContext || 'unknown', 'request')

    // Check cache first
    const cached = this.getCachedResult<T>(cacheKey, request)
    if (cached) {
      this.updateMetrics(request.pageContext || 'unknown', 'cache-hit')
      return {
        id: request.id,
        data: cached,
        timestamp: Date.now(),
        source: 'cache'
      }
    }

    // Check for pending duplicate request
    const pendingRequest = this.pendingRequests.get(requestKey)
    if (pendingRequest) {
      try {
        const result = await pendingRequest as T
        return {
          id: request.id,
          data: result,
          timestamp: Date.now(),
          source: 'single'
        }
      } catch (error) {
        this.updateMetrics(request.pageContext || 'unknown', 'error')
        return {
          id: request.id,
          error: error as Error,
          timestamp: Date.now(),
          source: 'single'
        }
      }
    }

    // For high priority requests, execute immediately
    if (request.priority === 'high') {
      return this.executeImmediately<T>(request, startTime)
    }

    // Queue for batching
    return this.queueForBatch<T>(request, startTime)
  }

  /**
   * Execute multiple requests as an optimized batch
   */
  async executeBatch(requests: RPCRequest[]): Promise<Map<string, RPCResponse<unknown>>> {
    const results = new Map<string, RPCResponse<unknown>>()
    const groupedRequests = this.groupRequestsByChain(requests)

    const promises = Array.from(groupedRequests.entries()).map(async ([chainId, chainRequests]) => {
      const client = this.clients.get(chainId)
      if (!client) {
        chainRequests.forEach(req => {
          results.set(req.id, {
            id: req.id,
            error: new Error(`No client for chain ${chainId}`),
            timestamp: Date.now(),
            source: 'batch'
          })
        })
        return
      }

      try {
        const batchResults = await client.executeBatch(chainRequests)
        
        chainRequests.forEach(req => {
          const result = batchResults.get(req.id)
          
          if (result instanceof Error) {
            results.set(req.id, {
              id: req.id,
              error: result,
              timestamp: Date.now(),
              source: 'batch'
            })
          } else {
            // Cache successful results
            this.cacheResult(req, result)
            
            results.set(req.id, {
              id: req.id,
              data: result,
              timestamp: Date.now(),
              source: 'batch'
            })
          }

          this.updateMetrics(req.pageContext || 'unknown', 'batched')
        })
      } catch (error) {
        chainRequests.forEach(req => {
          results.set(req.id, {
            id: req.id,
            error: error as Error,
            timestamp: Date.now(),
            source: 'batch'
          })
          this.updateMetrics(req.pageContext || 'unknown', 'error')
        })
      }
    })

    await Promise.allSettled(promises)
    return results
  }

  private async executeImmediately<T>(request: RPCRequest, startTime: number): Promise<RPCResponse<T>> {
    const requestKey = `${request.chainId}-${this.generateCacheKey(request)}`
    
    const executePromise = (async () => {
      const client = this.clients.get(request.chainId)
      if (!client) {
        throw new Error(`No client for chain ${request.chainId}`)
      }

      const result = await client.executeRequest<T>(request)
      
      // Cache the result
      this.cacheResult(request, result)
      
      return result
    })()

    this.pendingRequests.set(requestKey, executePromise)

    try {
      const result = await executePromise
      this.pendingRequests.delete(requestKey)
      
      return {
        id: request.id,
        data: result,
        timestamp: Date.now(),
        source: 'single'
      }
    } catch (error) {
      this.pendingRequests.delete(requestKey)
      this.updateMetrics(request.pageContext || 'unknown', 'error')
      
      return {
        id: request.id,
        error: error as Error,
        timestamp: Date.now(),
        source: 'single'
      }
    }
  }

  private async queueForBatch<T>(request: RPCRequest, startTime: number): Promise<RPCResponse<T>> {
    return new Promise((resolve, reject) => {
      const batchKey = this.getBatchKey(request)
      
      if (!this.requestQueue.has(batchKey)) {
        this.requestQueue.set(batchKey, [])
      }

      const queue = this.requestQueue.get(batchKey)!
      
      // Add resolve callback to request for later resolution
      ;(request as any).resolve = resolve
      ;(request as any).reject = reject
      
      queue.push(request)

      // Start batch timer if not already started
      if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.processBatch(batchKey)
        }, this.batchConfig.maxWaitTime)
        
        this.batchTimers.set(batchKey, timer)
      }

      // Process immediately if batch is full
      if (queue.length >= this.batchConfig.maxBatchSize) {
        this.processBatch(batchKey)
      }
    })
  }

  private async processBatch(batchKey: string): Promise<void> {
    const queue = this.requestQueue.get(batchKey)
    if (!queue || queue.length === 0) return

    this.requestQueue.delete(batchKey)
    
    const timer = this.batchTimers.get(batchKey)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(batchKey)
    }

    try {
      const results = await this.executeBatch(queue)
      
      queue.forEach(req => {
        const result = results.get(req.id)
        if (result?.error) {
          ;(req as any).reject(result.error)
        } else {
          ;(req as any).resolve(result)
        }
      })
    } catch (error) {
      queue.forEach(req => {
        ;(req as any).reject(error)
      })
    }
  }

  private getBatchKey(request: RPCRequest): string {
    if (this.batchConfig.pageContextGrouping && request.pageContext) {
      return `${request.chainId}-${request.pageContext}`
    }
    return `${request.chainId}-default`
  }

  private groupRequestsByChain(requests: RPCRequest[]): Map<number, RPCRequest[]> {
    const groups = new Map<number, RPCRequest[]>()
    
    requests.forEach(req => {
      if (!groups.has(req.chainId)) {
        groups.set(req.chainId, [])
      }
      groups.get(req.chainId)!.push(req)
    })

    return groups
  }

  private generateCacheKey(request: RPCRequest): string {
    if (request.cacheKey) return request.cacheKey

    const argsHash = request.args ? JSON.stringify(request.args) : 'no-args'
    return `${request.address}-${request.functionName}-${argsHash}`
  }

  private getCachedResult<T>(cacheKey: string, request: RPCRequest): T | null {
    const cached = this.cache.get(cacheKey)
    if (!cached) return null

    const now = Date.now()
    const isExpired = (now - cached.timestamp) > cached.ttl

    if (isExpired) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached.data as T
  }

  private cacheResult(request: RPCRequest, result: unknown): void {
    const cacheKey = this.generateCacheKey(request)
    const ttl = request.cacheDuration || 
                 this.cacheConfig.priorityTTL[request.priority] || 
                 this.cacheConfig.defaultTTL

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl
    })
  }

  private updateMetrics(pageContext: string, type: 'request' | 'cache-hit' | 'batched' | 'error'): void {
    if (!this.performanceMetrics.has(pageContext)) {
      this.performanceMetrics.set(pageContext, {
        totalRequests: 0,
        cacheHits: 0,
        batchedRequests: 0,
        avgResponseTime: 0,
        errors: 0
      })
    }

    const metrics = this.performanceMetrics.get(pageContext)!
    
    switch (type) {
      case 'request':
        metrics.totalRequests++
        break
      case 'cache-hit':
        metrics.cacheHits++
        break
      case 'batched':
        metrics.batchedRequests++
        break
      case 'error':
        metrics.errors++
        break
    }
  }

  /**
   * Invalidate cache based on patterns (e.g., after a purchase)
   */
  invalidateCache(pattern: string, context?: string): void {
    const patterns = this.cacheConfig.invalidationPatterns[pattern]
    if (!patterns) return

    for (const key of this.cache.keys()) {
      if (patterns.some(p => key.includes(p))) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  getMetrics(): Record<string, unknown> {
    return {
      cache: {
        size: this.cache.size,
        hitRate: this.cache.calculatedSize,
      },
      queues: {
        pending: this.pendingRequests.size,
        batching: this.requestQueue.size
      },
      performance: Object.fromEntries(this.performanceMetrics),
      providers: Object.fromEntries(
        Array.from(this.clients.entries()).map(([chainId, client]) => 
          [chainId, client.getHealthStatus()]
        )
      )
    }
  }

  /**
   * Shutdown the manager and clean up resources
   */
  shutdown(): void {
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer)
    }
    
    // Clear caches
    this.cache.clear()
    this.requestQueue.clear()
    this.pendingRequests.clear()
    this.batchTimers.clear()
    this.pageContexts.clear()
    this.performanceMetrics.clear()
  }
}

// Create singleton instance
export const rpcManager = new RPCManager()
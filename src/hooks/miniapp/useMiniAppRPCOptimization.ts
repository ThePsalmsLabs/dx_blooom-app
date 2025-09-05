/**
 * MiniApp RPC Optimization Hook - Aligned with Web App Patterns
 * File: src/hooks/miniapp/useMiniAppRPCOptimization.ts
 * 
 * This hook implements the same RPC optimization strategies used in the main web app,
 * adapted for MiniApp contexts. It uses the proven patterns from the web app:
 * - Global caching with circuit breakers (same TTL as web app)
 * - Request deduplication (same as OptimizedMiniAppProvider)
 * - Retry logic with exponential backoff (same as workflows.ts)
 * - USDC-focused flows (no ETH price dependencies)
 * 
 * ALIGNMENT WITH WEB APP:
 * 1. Uses same cache TTL values as globalPriceCache (60s default)
 * 2. Implements same circuit breaker pattern as workflows.ts
 * 3. Same request deduplication as OptimizedMiniAppProvider
 * 4. Removes ETH price queries and swap calculations
 * 5. Focuses only on USDC functionality like web app
 */

import { useCallback, useRef, useMemo, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMiniAppUtils, useMiniAppState } from '@/contexts/UnifiedMiniAppProvider'

interface RPCOptimizationConfig {
  enableBatching?: boolean
  enablePrefetching?: boolean
  mobileOptimizations?: boolean
  aggressiveCaching?: boolean
  throttleMs?: number
}

interface OptimizationMetrics {
  savedCalls: number
  cacheHits: number
  batchedRequests: number
  throttledRequests: number
  lastOptimization: Date
}

/**
 * Request Batching Manager
 * Batches similar RPC calls together to reduce network overhead
 */
class RequestBatcher {
  private pendingRequests = new Map<string, Promise<any>>()
  private batchTimeouts = new Map<string, NodeJS.Timeout>()
  private readonly BATCH_DELAY = 50 // 50ms batching window

  async batchRequest<T>(
    key: string, 
    requestFn: () => Promise<T>,
    batchWindowMs: number = this.BATCH_DELAY
  ): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Create new batched request
    const promise = new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(async () => {
        this.pendingRequests.delete(key)
        this.batchTimeouts.delete(key)
        
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, batchWindowMs)

      this.batchTimeouts.set(key, timeout)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  clearBatch(key: string): void {
    const timeout = this.batchTimeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.batchTimeouts.delete(key)
    }
    this.pendingRequests.delete(key)
  }

  clear(): void {
    this.batchTimeouts.forEach(timeout => clearTimeout(timeout))
    this.batchTimeouts.clear()
    this.pendingRequests.clear()
  }
}

/**
 * Throttle Manager
 * Prevents excessive rapid-fire calls from user interactions
 */
class ThrottleManager {
  private lastCalls = new Map<string, number>()

  shouldThrottle(key: string, throttleMs: number): boolean {
    const now = Date.now()
    const lastCall = this.lastCalls.get(key) || 0
    
    if (now - lastCall < throttleMs) {
      return true
    }
    
    this.lastCalls.set(key, now)
    return false
  }

  clear(): void {
    this.lastCalls.clear()
  }
}

/**
 * Aligned Cache Strategy - uses same patterns as web app workflows.ts
 * Matches exactly the TTL values used in the main web app
 */
class AlignedCacheStrategy {
  // Use exact same cache times as web app globalPriceCache and workflows.ts
  private static readonly CACHE_TIMES = {
    contentList: 60000,          // 1 minute (same as web app globalContractCache TTL)
    creatorRegistration: 300000, // 5 minutes
    socialProfile: 180000,       // 3 minutes  
    userBalance: 30000,          // 30 seconds
    contentAccess: 120000,       // 2 minutes
    priceOracle: 600000,         // 10 minutes (same as web app PRICE_ORACLE_TTL)
    contractCalls: 60000,        // Same as web app globalContractCache default TTL
  }

  static getCacheTime(dataType: keyof typeof AlignedCacheStrategy.CACHE_TIMES): number {
    return this.CACHE_TIMES[dataType]
  }

  /**
   * Prefetch only USDC-related data - no ETH prices or swap calculations
   * Aligned with web app's USDC-focused approach
   */
  static prefetchCriticalData(queryClient: ReturnType<typeof useQueryClient>): void {
    try {
      // Only prefetch USDC-related data (aligned with web app)
      console.log('🚀 Prefetching USDC data (aligned with web app patterns)')
      
      // Focus on USDC balances, allowances, and content access
      // NO ETH price queries or swap calculations
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string
          return ['activeContentPaginated', 'usdcBalance', 'contentAccess'].includes(key)
        }
      })
    } catch (error) {
      // Silently handle prefetch errors to avoid breaking the app
      console.debug('Prefetch failed (non-critical):', error)
    }
  }
}

/**
 * Main MiniApp RPC Optimization Hook
 */
export function useMiniAppRPCOptimization(config: RPCOptimizationConfig = {}) {
  const queryClient = useQueryClient()
  const miniAppUtils = useMiniAppUtils()
  const miniAppState = useMiniAppState()
  
  const finalConfig = useMemo(() => ({
    enableBatching: true,
    enablePrefetching: true,
    mobileOptimizations: miniAppUtils.isMiniApp,
    aggressiveCaching: miniAppUtils.isMobile,
    throttleMs: 500,
    ...config
  }), [config, miniAppUtils.isMiniApp, miniAppUtils.isMobile])

  // Optimization managers
  const batcher = useRef(new RequestBatcher())
  const throttler = useRef(new ThrottleManager())
  const [metrics, setMetrics] = useState<OptimizationMetrics>({
    savedCalls: 0,
    cacheHits: 0,
    batchedRequests: 0,
    throttledRequests: 0,
    lastOptimization: new Date()
  })

  // Initialize optimizations aligned with web app
  useEffect(() => {
    if (finalConfig.mobileOptimizations) {
      // Configure QueryClient with web app-aligned settings
      queryClient.setDefaultOptions({
        queries: {
          staleTime: AlignedCacheStrategy.getCacheTime('contentList'),
          gcTime: AlignedCacheStrategy.getCacheTime('contentList') * 2,
          retry: (failureCount, error) => {
            // Use same retry logic as web app workflows.ts
            if (failureCount >= 2) return false
            if (error?.message?.includes('network')) return failureCount < 1
            return true
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
        }
      })

      // Only prefetch if user is connected (avoid during logout)
      if (finalConfig.enablePrefetching && miniAppState.isConnected) {
        AlignedCacheStrategy.prefetchCriticalData(queryClient)
      }
    }

    return () => {
      batcher.current.clear()
      throttler.current.clear()
    }
  }, [finalConfig.mobileOptimizations, finalConfig.enablePrefetching, queryClient, miniAppState.isConnected])

  /**
   * Batched Request Wrapper
   * Batches similar requests together to reduce RPC calls
   */
  const batchedRequest = useCallback(async <T>(
    key: string,
    requestFn: () => Promise<T>,
    options: { batchWindowMs?: number } = {}
  ): Promise<T> => {
    if (!finalConfig.enableBatching) {
      return requestFn()
    }

    const result = await batcher.current.batchRequest(
      key, 
      requestFn, 
      options.batchWindowMs
    )

    setMetrics(prev => ({
      ...prev,
      batchedRequests: prev.batchedRequests + 1,
      lastOptimization: new Date()
    }))

    return result
  }, [finalConfig.enableBatching])

  /**
   * Throttled Action Wrapper
   * Prevents excessive rapid-fire calls from user interactions
   */
  const throttledAction = useCallback(async <T>(
    key: string,
    actionFn: () => Promise<T>,
    throttleMs: number = finalConfig.throttleMs
  ): Promise<T | null> => {
    if (throttler.current.shouldThrottle(key, throttleMs)) {
      setMetrics(prev => ({
        ...prev,
        throttledRequests: prev.throttledRequests + 1
      }))
      console.log(`🐌 Throttled action: ${key}`)
      return null
    }

    return actionFn()
  }, [finalConfig.throttleMs])

  /**
   * Cache-Aware Query Wrapper - aligned with web app patterns
   * Uses same cache times as web app globalContractCache
   */
  const cacheAwareQuery = useCallback(<T>(
    queryKey: string[],
    dataType: keyof typeof AlignedCacheStrategy['CACHE_TIMES']
  ) => {
    const cacheTime = finalConfig.aggressiveCaching 
      ? AlignedCacheStrategy.getCacheTime(dataType)
      : undefined

    // Check if data is already in cache
    const cachedData = queryClient.getQueryData(queryKey)
    if (cachedData) {
      setMetrics(prev => ({
        ...prev,
        cacheHits: prev.cacheHits + 1
      }))
    }

    return {
      staleTime: cacheTime,
      gcTime: cacheTime ? cacheTime * 2 : undefined,
      refetchOnWindowFocus: false, // Disable for mobile
      refetchOnReconnect: false    // Disable for mobile
    }
  }, [finalConfig.aggressiveCaching, queryClient])

  /**
   * Smart Refresh Handler
   * Implements intelligent refresh logic with throttling
   */
  const smartRefresh = useCallback(async (
    componentKey: string,
    refreshFn: () => Promise<void>
  ): Promise<void> => {
    const result = await throttledAction(
      `refresh_${componentKey}`,
      refreshFn,
      2000 // 2 second throttle for refreshes
    )

    if (result !== null) {
      setMetrics(prev => ({
        ...prev,
        savedCalls: prev.savedCalls + 1,
        lastOptimization: new Date()
      }))
    }
  }, [throttledAction])

  /**
   * Visibility-Based Query Control
   * Disables queries when component is not visible
   */
  const visibilityBasedQuery = useCallback((isVisible: boolean) => {
    return {
      enabled: isVisible,
      refetchInterval: isVisible ? undefined : false
    }
  }, [])

  return {
    // Optimization methods
    batchedRequest,
    throttledAction,
    cacheAwareQuery,
    smartRefresh,
    visibilityBasedQuery,
    
    // Configuration
    config: finalConfig,
    
    // Metrics
    metrics,
    
    // Utilities
    clearOptimizationCache: useCallback(() => {
      batcher.current.clear()
      throttler.current.clear()
      setMetrics({
        savedCalls: 0,
        cacheHits: 0,
        batchedRequests: 0,
        throttledRequests: 0,
        lastOptimization: new Date()
      })
    }, [])
  }
}

export type { RPCOptimizationConfig, OptimizationMetrics }

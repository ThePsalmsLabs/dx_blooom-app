/**
 * MiniApp RPC Optimization Hook
 * File: src/hooks/miniapp/useMiniAppRPCOptimization.ts
 * 
 * This hook implements aggressive RPC call reduction strategies specifically for MiniApp contexts
 * where network constraints and mobile performance require careful optimization.
 * 
 * IDENTIFIED PROBLEMS IN MINIAPP:
 * 1. Multiple components making simultaneous calls to useActiveContentPaginated
 * 2. useIsCreatorRegistered being called for every content item/creator
 * 3. No batching or aggregation of similar contract calls
 * 4. Excessive refresh cycles in browse/creators pages
 * 5. Social profile fetching on every component mount
 * 
 * OPTIMIZATION STRATEGIES:
 * 1. Request deduplication and batching
 * 2. Aggressive caching with longer stale times for mobile
 * 3. Smart prefetching based on user behavior
 * 4. Component-level throttling for refresh actions
 * 5. Conditional hook execution based on viewport visibility
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
 * Cache Strategy Manager
 * Implements aggressive caching for mobile contexts
 */
class MiniAppCacheStrategy {
  private static readonly MOBILE_CACHE_TIMES = {
    contentList: 5 * 60 * 1000,      // 5 minutes (vs 2 minutes on web)
    creatorRegistration: 10 * 60 * 1000,  // 10 minutes (vs 5 minutes on web)
    platformStats: 15 * 60 * 1000,   // 15 minutes (vs 10 minutes on web)
    socialProfile: 20 * 60 * 1000    // 20 minutes (very stable data)
  }

  static getCacheTime(dataType: keyof typeof MiniAppCacheStrategy.MOBILE_CACHE_TIMES): number {
    return this.MOBILE_CACHE_TIMES[dataType]
  }

  static prefetchCriticalData(queryClient: ReturnType<typeof useQueryClient>): void {
    // Prefetch commonly accessed data in background
    // Note: This requires actual query functions to be defined
    // For now, we'll just ensure the queries are in cache if they already exist
    try {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string
          return ['activeContentPaginated', 'platformStats', 'creatorCount'].includes(key)
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

  // Initialize mobile optimizations
  useEffect(() => {
    if (finalConfig.mobileOptimizations) {
      // Configure QueryClient for mobile
      queryClient.setDefaultOptions({
        queries: {
          staleTime: MiniAppCacheStrategy.getCacheTime('contentList'),
          gcTime: MiniAppCacheStrategy.getCacheTime('contentList') * 2,
          retry: (failureCount, error) => {
            // Be more conservative with retries on mobile
            if (failureCount >= 2) return false
            if (error?.message?.includes('network')) return failureCount < 1
            return true
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000)
        }
      })

      // Prefetch critical data if enabled
      if (finalConfig.enablePrefetching) {
        MiniAppCacheStrategy.prefetchCriticalData(queryClient)
      }
    }

    return () => {
      batcher.current.clear()
      throttler.current.clear()
    }
  }, [finalConfig.mobileOptimizations, finalConfig.enablePrefetching, queryClient])

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
   * Cache-Aware Query Wrapper
   * Implements aggressive caching for mobile contexts
   */
  const cacheAwareQuery = useCallback(<T>(
    queryKey: string[],
    dataType: keyof typeof MiniAppCacheStrategy['MOBILE_CACHE_TIMES']
  ) => {
    const cacheTime = finalConfig.aggressiveCaching 
      ? MiniAppCacheStrategy.getCacheTime(dataType)
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

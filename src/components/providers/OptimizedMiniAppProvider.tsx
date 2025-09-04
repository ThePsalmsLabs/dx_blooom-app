/**
 * Optimized MiniApp Provider - RPC Call Reduction Architecture
 * File: src/components/providers/OptimizedMiniAppProvider.tsx
 * 
 * This provider implements comprehensive RPC optimization specifically for MiniApp contexts,
 * wrapping the existing UnifiedMiniAppProvider with aggressive caching, batching, and throttling.
 */

'use client'

import React, { ReactNode, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { UnifiedMiniAppProvider } from '@/contexts/UnifiedMiniAppProvider'
import { useMiniAppRPCOptimization } from '@/hooks/miniapp/useMiniAppRPCOptimization'

interface OptimizedMiniAppProviderProps {
  children: ReactNode
  enableAnalytics?: boolean
  enableOptimizations?: boolean
  fallbackToWeb?: boolean
}

/**
 * Query Client Configuration for MiniApp
 * Implements aggressive optimization strategies
 */
function useMiniAppQueryConfig() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    // Configure global query defaults for MiniApp optimization
    queryClient.setDefaultOptions({
      queries: {
        // Aggressive caching for mobile
        staleTime: 5 * 60 * 1000,     // 5 minutes default stale time
        gcTime: 15 * 60 * 1000,       // 15 minutes garbage collection
        
        // Reduce network requests
        refetchOnWindowFocus: false,   // Disable for mobile
        refetchOnReconnect: false,     // Disable for mobile
        refetchOnMount: false,         // Only refetch when explicitly needed
        
        // Conservative retry strategy
        retry: (failureCount, error) => {
          // Be more conservative with retries on mobile
          if (failureCount >= 2) return false
          if (error?.message?.includes('network')) return failureCount < 1
          if (error?.message?.includes('timeout')) return failureCount < 1
          return true
        },
        
        // Exponential backoff with shorter delays
        retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000),
        
        // Network optimization
        networkMode: 'online' // Only query when online
      },
      
      mutations: {
        // Conservative retry for mutations
        retry: 1,
        retryDelay: 1000,
        networkMode: 'online'
      }
    })

    // Set up query invalidation batching
    queryClient.getQueryCache().config.onError = (error, query) => {
      // Filter out non-critical errors to reduce noise
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      if (errorMessage.includes('Missing queryFn')) {
        // These are non-critical errors from prefetch attempts without queryFn
        console.debug('Query missing queryFn (non-critical):', query.queryKey)
        return
      }
      
      if (errorMessage.includes('QuoteReverted')) {
        // Price oracle errors - already handled with fallbacks
        console.debug('Price oracle reverted (using fallback):', query.queryKey)
        return
      }
      
      // Log other errors that might need attention
      console.warn('Query error in MiniApp:', error, query.queryKey)
    }

    queryClient.getQueryCache().config.onSuccess = (data, query) => {
      // Optionally log successful queries for debugging
      if (process.env.NODE_ENV === 'development') {
        console.debug('Query success:', query.queryKey)
      }
    }

  }, [queryClient])

  return queryClient
}

/**
 * RPC Call Deduplication Context
 * Prevents duplicate contract calls across components
 */
function useRPCDeduplication() {
  const rpcOptimization = useMiniAppRPCOptimization({
    enableBatching: true,
    enablePrefetching: true,
    mobileOptimizations: true,
    aggressiveCaching: true,
    throttleMs: 1000
  })

  useEffect(() => {
    // Set up global RPC deduplication
    const globalRequestCache = new Map<string, Promise<any>>()
    
    // Override window.ethereum if available to add deduplication
    if (typeof window !== 'undefined' && window.ethereum) {
      const originalRequest = window.ethereum.request
      
      window.ethereum.request = async (args: any) => {
        const requestKey = JSON.stringify(args)
        
        // Check if request is already in flight
        if (globalRequestCache.has(requestKey)) {
          console.log('🔄 Deduplicating RPC request:', args.method)
          return globalRequestCache.get(requestKey)!
        }
        
        // Create new request with deduplication
        const requestPromise = originalRequest.call(window.ethereum, args)
        globalRequestCache.set(requestKey, requestPromise)
        
        // Clean up after request completes
        requestPromise.finally(() => {
          setTimeout(() => {
            globalRequestCache.delete(requestKey)
          }, 100) // Small cleanup delay
        })
        
        return requestPromise
      }
    }

    return () => {
      // Cleanup optimization state - only call once on unmount
      if (rpcOptimization.clearOptimizationCache) {
        rpcOptimization.clearOptimizationCache()
      }
    }
  }, []) // Remove rpcOptimization dependency to prevent infinite loop

  return rpcOptimization
}

/**
 * Main Optimized MiniApp Provider
 */
export function OptimizedMiniAppProvider({
  children,
  enableAnalytics = true,
  enableOptimizations = true,
  fallbackToWeb = true
}: OptimizedMiniAppProviderProps) {
  
  // Configure optimized query client
  useMiniAppQueryConfig()
  
  // Set up RPC deduplication
  const rpcOptimization = useRPCDeduplication()
  
  // Performance monitoring in development
  const performanceConfig = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      return {
        onQueryStart: (queryKey: string[]) => {
          console.time(`Query: ${queryKey.join('/')}`)
        },
        onQueryEnd: (queryKey: string[]) => {
          console.timeEnd(`Query: ${queryKey.join('/')}`)
        }
      }
    }
    return {}
  }, [])

  return (
    <UnifiedMiniAppProvider
      enableAnalytics={enableAnalytics}
      enableOptimizations={enableOptimizations}
      fallbackToWeb={fallbackToWeb}
    >
      {/* Development performance indicator */}
      {process.env.NODE_ENV === 'development' && rpcOptimization.metrics.savedCalls > 0 && (
        <div 
          className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-mono z-50"
          style={{ fontSize: '10px' }}
        >
          RPC Optimized: {rpcOptimization.metrics.savedCalls} calls saved, {rpcOptimization.metrics.cacheHits} cache hits
        </div>
      )}
      
      {children}
    </UnifiedMiniAppProvider>
  )
}

/**
 * Hook to access optimization metrics
 */
export function useMiniAppOptimizationMetrics() {
  const queryClient = useQueryClient()
  
  const getMetrics = () => {
    const queryCache = queryClient.getQueryCache()
    const queries = queryCache.getAll()
    
    return {
      totalQueries: queries.length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length,
      staleCacheQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.error !== null).length,
      lastUpdate: new Date()
    }
  }
  
  return { getMetrics }
}

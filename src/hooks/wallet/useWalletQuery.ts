/**
 * Wallet Query Hook - React Query Integration for Wallet State
 * File: src/hooks/wallet/useWalletQuery.ts
 * 
 * Provides React Query integration for wallet state management with:
 * - Background refetch capabilities
 * - Stale-while-revalidate caching
 * - Automatic invalidation on events
 * - Network-aware refetching
 * - Optimistic updates
 */

'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { WalletStateManager, type WalletState, type WalletEvent } from '@/lib/wallet/WalletStateManager'
import { getConnectionState, shouldBeConnected } from '@/lib/wallet/connection-persistence'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const walletQueryKeys = {
  all: ['wallet'] as const,
  state: () => [...walletQueryKeys.all, 'state'] as const,
  connection: () => [...walletQueryKeys.all, 'connection'] as const,
  metrics: () => [...walletQueryKeys.all, 'metrics'] as const,
  health: () => [...walletQueryKeys.all, 'health'] as const,
  persistence: () => [...walletQueryKeys.all, 'persistence'] as const,
} as const

// ============================================================================
// WALLET STATE QUERY
// ============================================================================

/**
 * Main wallet state query with React Query caching
 */
export function useWalletStateQuery() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: walletQueryKeys.state(),
    queryFn: async (): Promise<WalletState> => {
      // Get current state from WalletStateManager
      const state = WalletStateManager.getState()
      
      // If not connected but should be, trigger background check
      if (!state.isConnected && shouldBeConnected() && !state.isConnecting) {
        console.log('🔄 Background wallet state validation triggered')
        // This is just data fetching, actual reconnection happens elsewhere
      }
      
      return state
    },
    staleTime: 30 * 1000, // 30 seconds - state is considered fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchInterval: 60 * 1000, // Background refetch every minute
    refetchIntervalInBackground: false, // Don't refetch when tab not visible
    retry: (failureCount, error) => {
      // Don't retry on user errors, but retry on network errors
      if (error?.message?.includes('User rejected')) return false
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })

  // Set up event listeners to invalidate cache on wallet events
  useEffect(() => {
    const handleWalletEvent = (event: WalletEvent) => {
      // Immediately update cache with new state
      queryClient.setQueryData(walletQueryKeys.state(), event.state)
      
      // For significant events, invalidate related queries
      if (['connected', 'disconnected', 'error'].includes(event.type)) {
        queryClient.invalidateQueries({ 
          queryKey: walletQueryKeys.all,
          exact: false 
        })
      }
    }

    // Subscribe to wallet events
    WalletStateManager.on('connected', handleWalletEvent)
    WalletStateManager.on('disconnected', handleWalletEvent)
    WalletStateManager.on('connecting', handleWalletEvent)
    WalletStateManager.on('error', handleWalletEvent)
    WalletStateManager.on('health-check', handleWalletEvent)

    return () => {
      WalletStateManager.off('connected', handleWalletEvent)
      WalletStateManager.off('disconnected', handleWalletEvent)
      WalletStateManager.off('connecting', handleWalletEvent)
      WalletStateManager.off('error', handleWalletEvent)
      WalletStateManager.off('health-check', handleWalletEvent)
    }
  }, [queryClient])

  return query
}

// ============================================================================
// CONNECTION STATUS QUERY
// ============================================================================

/**
 * Lightweight connection status query for components that only need connected/disconnected
 */
export function useConnectionStatusQuery() {
  return useQuery({
    queryKey: walletQueryKeys.connection(),
    queryFn: async () => {
      const state = WalletStateManager.getState()
      return {
        isConnected: state.isConnected,
        address: state.address,
        chainId: state.chainId,
        isConnecting: state.isConnecting,
        lastConnected: state.lastConnected
      }
    },
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    select: (data) => data, // Can be used to transform data
  })
}

// ============================================================================
// WALLET METRICS QUERY
// ============================================================================

/**
 * Wallet metrics and analytics query
 */
export function useWalletMetricsQuery() {
  return useQuery({
    queryKey: walletQueryKeys.metrics(),
    queryFn: async () => {
      return WalletStateManager.getMetrics()
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Metrics don't need immediate refresh
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// ============================================================================
// PERSISTENCE STATE QUERY
// ============================================================================

/**
 * Query for wallet persistence state from localStorage
 */
export function usePersistenceStateQuery() {
  return useQuery({
    queryKey: walletQueryKeys.persistence(),
    queryFn: async () => {
      const connectionState = getConnectionState()
      const shouldConnect = shouldBeConnected()
      
      return {
        hasPersistedConnection: !!connectionState,
        shouldAutoConnect: shouldConnect,
        persistedAddress: connectionState?.address || null,
        persistedChainId: connectionState?.chainId || null,
        persistedTimestamp: connectionState?.timestamp || null,
        isExpired: connectionState ? Date.now() - connectionState.timestamp > 24 * 60 * 60 * 1000 : false
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Persistence state doesn't change often
  })
}

// ============================================================================
// WALLET HEALTH QUERY
// ============================================================================

/**
 * Wallet connection health monitoring query
 */
export function useWalletHealthQuery() {
  return useQuery({
    queryKey: walletQueryKeys.health(),
    queryFn: async () => {
      const state = WalletStateManager.getState()
      const persistence = getConnectionState()
      const shouldConnect = shouldBeConnected()
      
      // Calculate health score
      let healthScore = 100
      
      if (state.error) healthScore -= 30
      if (!state.isHealthy) healthScore -= 20
      if (shouldConnect && !state.isConnected && !state.isConnecting) healthScore -= 25
      if (state.connectionAttempts > 3) healthScore -= 15
      if (persistence && Date.now() - persistence.timestamp > 60 * 60 * 1000) healthScore -= 10 // Stale connection
      
      return {
        healthScore: Math.max(0, healthScore),
        isHealthy: state.isHealthy,
        lastError: state.error?.message || null,
        connectionAttempts: state.connectionAttempts,
        timeSinceLastConnection: state.lastConnected ? Date.now() - state.lastConnected : null,
        recommendations: generateHealthRecommendations(state, healthScore)
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Check health every minute
    refetchOnWindowFocus: true,
  })
}

/**
 * Generate health recommendations based on wallet state
 */
function generateHealthRecommendations(state: WalletState, healthScore: number): string[] {
  const recommendations: string[] = []
  
  if (healthScore < 50) {
    recommendations.push('Consider refreshing the page to reset wallet state')
  }
  
  if (state.error) {
    recommendations.push('Check your wallet connection and try again')
  }
  
  if (state.connectionAttempts > 3) {
    recommendations.push('Multiple connection attempts detected - may need manual reconnection')
  }
  
  if (!state.isConnected && shouldBeConnected()) {
    recommendations.push('Wallet should be connected but is not - auto-reconnection may be needed')
  }
  
  return recommendations
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Connect wallet mutation with optimistic updates
 */
export function useConnectWalletMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      // The actual connection logic is handled by useFarcasterAutoWallet
      // This is just for React Query integration
      const currentState = WalletStateManager.getState()
      if (currentState.isConnected) {
        return currentState
      }
      throw new Error('Connection must be initiated through useFarcasterAutoWallet')
    },
    onMutate: async () => {
      // Optimistic update: set connecting state
      await queryClient.cancelQueries({ queryKey: walletQueryKeys.state() })
      
      const previousState = queryClient.getQueryData(walletQueryKeys.state())
      
      queryClient.setQueryData(walletQueryKeys.state(), (old: WalletState | undefined) => 
        old ? { ...old, isConnecting: true, error: null } : undefined
      )
      
      return { previousState }
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousState) {
        queryClient.setQueryData(walletQueryKeys.state(), context.previousState)
      }
    },
    onSuccess: () => {
      // Invalidate and refetch wallet queries
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all })
    },
  })
}

/**
 * Disconnect wallet mutation
 */
export function useDisconnectWalletMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      // The actual disconnection logic is handled by useFarcasterAutoWallet
      const currentState = WalletStateManager.getState()
      if (!currentState.isConnected) {
        return currentState
      }
      throw new Error('Disconnection must be initiated through useFarcasterAutoWallet')
    },
    onSuccess: () => {
      // Update cache immediately
      queryClient.setQueryData(walletQueryKeys.state(), (old: WalletState | undefined) =>
        old ? { 
          ...old, 
          isConnected: false, 
          address: null, 
          chainId: null,
          isConnecting: false,
          error: null 
        } : undefined
      )
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all })
    },
  })
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to invalidate all wallet queries (useful for manual refresh)
 */
export function useInvalidateWalletQueries() {
  const queryClient = useQueryClient()
  
  return useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: walletQueryKeys.all,
      exact: false 
    })
  }, [queryClient])
}

/**
 * Hook to prefetch wallet state (useful for preloading)
 */
export function usePrefetchWalletState() {
  const queryClient = useQueryClient()
  
  return useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: walletQueryKeys.state(),
      queryFn: async () => WalletStateManager.getState(),
      staleTime: 30 * 1000,
    })
  }, [queryClient])
}

/**
 * Hook to get cached wallet state without triggering a fetch
 */
export function useCachedWalletState() {
  const queryClient = useQueryClient()
  return queryClient.getQueryData<WalletState>(walletQueryKeys.state())
}

// ============================================================================
// EXPORTS
// ============================================================================


// Debug utilities for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).walletQueryKeys = walletQueryKeys
  console.log('🔧 Wallet query utilities available as window.walletQueryKeys')
}
/**
 * Shared Backend Health Context
 * 
 * This context provides a single, shared instance of the backend health monitor
 * across all components to prevent multiple health check requests and reduce
 * backend load.
 * 
 * File: src/contexts/BackendHealthContext.tsx
 */

import React, { createContext, useContext, ReactNode } from 'react'
import { 
  useBackendHealthMonitor,
  BackendHealthConfig,
  BackendHealthMetrics,
  UseBackendHealthMonitorResult 
} from '@/hooks/web3/useBackendHealthMonitor'

// Re-export types for use in other modules
export type { BackendHealthConfig, BackendHealthMetrics }

/**
 * Backend Health Context Interface
 */
interface BackendHealthContextType extends UseBackendHealthMonitorResult {
  /** Whether the context is initialized */
  readonly isInitialized: boolean
}

/**
 * Backend Health Context
 */
const BackendHealthContext = createContext<BackendHealthContextType | null>(null)

/**
 * Default health configuration optimized for shared usage
 */
const SHARED_HEALTH_CONFIG: BackendHealthConfig = {
  maxConsecutiveFailures: 5,
  baseRetryDelay: 1000,
  maxRetryDelay: 30000,
  backoffMultiplier: 2,
  circuitBreakerTimeout: 60000,
  healthCheckInterval: 300000, // 5 minutes - very conservative for shared usage
  requestTimeout: 10000,
  healthCheckEndpoint: '/api/health',
  enableLogging: process.env.NODE_ENV === 'development'
}

/**
 * Backend Health Provider Props
 */
interface BackendHealthProviderProps {
  children: ReactNode
  config?: BackendHealthConfig
}

/**
 * Backend Health Provider Component
 * 
 * Provides a shared backend health monitor instance to all child components.
 * This prevents multiple health check requests and reduces backend load.
 */
export function BackendHealthProvider({ 
  children, 
  config = SHARED_HEALTH_CONFIG 
}: BackendHealthProviderProps) {
  const healthMonitor = useBackendHealthMonitor(config)
  
  const contextValue: BackendHealthContextType = {
    ...healthMonitor,
    isInitialized: true
  }
  
  return (
    <BackendHealthContext.Provider value={contextValue}>
      {children}
    </BackendHealthContext.Provider>
  )
}

/**
 * useBackendHealth Hook
 * 
 * Hook to access the shared backend health monitor instance.
 * 
 * @returns Backend health monitoring operations and metrics
 * 
 * @throws Error if used outside of BackendHealthProvider
 */
export function useBackendHealth(): BackendHealthContextType {
  const context = useContext(BackendHealthContext)
  
  if (!context) {
    throw new Error('useBackendHealth must be used within a BackendHealthProvider')
  }
  
  return context
}

/**
 * useBackendHealthSafe Hook
 * 
 * Safe version of useBackendHealth that returns null if not available.
 * Useful for components that might be rendered outside the provider.
 * 
 * @returns Backend health monitoring operations and metrics, or null if not available
 */
export function useBackendHealthSafe(): BackendHealthContextType | null {
  return useContext(BackendHealthContext)
}

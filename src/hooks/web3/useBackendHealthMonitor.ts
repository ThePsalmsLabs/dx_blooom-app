/**
 * Enhanced Backend Health Monitor Hook
 * 
 * This hook provides intelligent backend health monitoring and fallback mechanisms
 * for your signature polling system. It builds upon your existing Phase 1 infrastructure
 * by adding production-ready reliability features that detect backend issues and 
 * provide graceful degradation strategies.
 * 
 * INTEGRATION WITH EXISTING ARCHITECTURE:
 * - Enhances your existing useSignaturePolling hook with health monitoring
 * - Integrates with your current API routes at /api/commerce/signature-status
 * - Works with your Commerce Protocol Integration contract architecture
 * - Provides fallback strategies that maintain payment flow reliability
 * 
 * WHY THIS COMPONENT MATTERS:
 * - Production systems need backend failure detection and recovery
 * - Signature polling is critical - backend unavailability breaks payment flows
 * - Intelligent retry patterns reduce unnecessary backend load
 * - Health monitoring enables proactive issue resolution
 * - Fallback mechanisms ensure payments succeed even during backend issues
 * 
 * Phase 2 Enhancement Features:
 * - Real-time backend health status tracking
 * - Exponential backoff for failed requests
 * - Circuit breaker pattern for persistent failures
 * - Automatic recovery detection and retry
 * - Comprehensive health metrics for monitoring
 * 
 * File: src/hooks/web3/useBackendHealthMonitor.ts
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useChainId } from 'wagmi'

/**
 * Backend Health Status Types
 */
export type BackendHealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'recovering' | 'unknown'

/**
 * Backend Health Metrics Interface
 * 
 * Comprehensive metrics for monitoring backend performance and reliability.
 * These metrics help identify patterns and optimize the signature polling system.
 */
export interface BackendHealthMetrics {
  /** Current health status */
  readonly status: BackendHealthStatus
  
  /** Average response time in milliseconds */
  readonly avgResponseTime: number
  
  /** Success rate as percentage (0-100) */
  readonly successRate: number
  
  /** Number of consecutive failures */
  readonly consecutiveFailures: number
  
  /** Total requests made in current session */
  readonly totalRequests: number
  
  /** Total successful requests */
  readonly successfulRequests: number
  
  /** Time of last successful request */
  readonly lastSuccessfulRequest: number | null
  
  /** Time of last failure */
  readonly lastFailure: number | null
  
  /** Current retry delay in milliseconds */
  readonly currentRetryDelay: number
  
  /** Whether circuit breaker is open */
  readonly circuitBreakerOpen: boolean
  
  /** Next retry attempt time */
  readonly nextRetryTime: number | null
}

/**
 * Backend Health Configuration
 */
export interface BackendHealthConfig {
  /** Maximum consecutive failures before marking as unavailable (default: 5) */
  readonly maxConsecutiveFailures?: number
  
  /** Base retry delay in milliseconds (default: 1000) */
  readonly baseRetryDelay?: number
  
  /** Maximum retry delay in milliseconds (default: 30000) */
  readonly maxRetryDelay?: number
  
  /** Exponential backoff multiplier (default: 2) */
  readonly backoffMultiplier?: number
  
  /** Circuit breaker timeout in milliseconds (default: 60000) */
  readonly circuitBreakerTimeout?: number
  
  /** Health check interval in milliseconds (default: 30000) */
  readonly healthCheckInterval?: number
  
  /** Request timeout in milliseconds (default: 10000) */
  readonly requestTimeout?: number
  
  /** Custom API endpoint for health checks */
  readonly healthCheckEndpoint?: string
  
  /** Whether to enable comprehensive logging */
  readonly enableLogging?: boolean
}

/**
 * Default Health Monitor Configuration
 */
const DEFAULT_HEALTH_CONFIG: Required<BackendHealthConfig> = {
  maxConsecutiveFailures: 5,
  baseRetryDelay: 1000,
  maxRetryDelay: 30000,
  backoffMultiplier: 2,
  circuitBreakerTimeout: 60000,
  healthCheckInterval: 30000,
  requestTimeout: 10000,
  healthCheckEndpoint: '/api/health',
  enableLogging: false
}

/**
 * Backend Health Monitor Error Types
 */
export class BackendHealthError extends Error {
  constructor(
    message: string,
    public readonly code: 'HEALTH_CHECK_FAILED' | 'CIRCUIT_BREAKER_OPEN' | 'REQUEST_TIMEOUT' | 'NETWORK_ERROR',
    public readonly statusCode?: number,
    public readonly responseTime?: number
  ) {
    super(message)
    this.name = 'BackendHealthError'
  }
}

/**
 * Request Result Interface
 */
interface RequestResult {
  success: boolean
  responseTime: number
  error?: Error
  statusCode?: number
}

/**
 * useBackendHealthMonitor Hook Result
 */
export interface UseBackendHealthMonitorResult {
  /** Current health metrics */
  readonly metrics: BackendHealthMetrics
  
  /** Check if backend is available for requests */
  readonly isBackendAvailable: boolean
  
  /** Get current retry delay for failed requests */
  readonly getCurrentRetryDelay: () => number
  
  /** Record a successful request */
  readonly recordSuccess: (responseTime: number) => void
  
  /** Record a failed request */
  readonly recordFailure: (error: Error, statusCode?: number) => void
  
  /** Force a health check */
  readonly forceHealthCheck: () => Promise<boolean>
  
  /** Reset health state */
  readonly resetHealth: () => void
  
  /** Make a monitored request with health tracking */
  readonly makeMonitoredRequest: <T>(
    requestFn: () => Promise<T>,
    timeoutMs?: number
  ) => Promise<T>
}

/**
 * useBackendHealthMonitor Hook
 * 
 * Main hook for monitoring backend health and providing intelligent retry mechanisms.
 * This enhances your existing signature polling with production-ready reliability features.
 * 
 * INTEGRATION PATTERN:
 * Use this hook in conjunction with your existing useSignaturePolling hook to add
 * intelligent health monitoring and retry logic.
 * 
 * @param config - Configuration for health monitoring behavior
 * @returns Backend health monitoring operations and metrics
 * 
 * Usage Example:
 * ```typescript
 * const { metrics, isBackendAvailable, makeMonitoredRequest } = useBackendHealthMonitor({
 *   maxConsecutiveFailures: 3,
 *   enableLogging: true
 * })
 * 
 * // Use in signature polling
 * const pollForSignature = async (intentId: string) => {
 *   if (!isBackendAvailable) {
 *     throw new Error('Backend currently unavailable')
 *   }
 *   
 *   return makeMonitoredRequest(() => 
 *     fetch('/api/commerce/signature-status', {
 *       method: 'POST',
 *       body: JSON.stringify({ intentId })
 *     })
 *   )
 * }
 * ```
 */
export function useBackendHealthMonitor(
  config: BackendHealthConfig = {}
): UseBackendHealthMonitorResult {
  
  // Merge configuration with defaults
  const finalConfig = { ...DEFAULT_HEALTH_CONFIG, ...config }
  
  // Chain ID for logging context
  const chainId = useChainId()
  
  // Health metrics state
  const [metrics, setMetrics] = useState<BackendHealthMetrics>({
    status: 'unknown',
    avgResponseTime: 0,
    successRate: 100,
    consecutiveFailures: 0,
    totalRequests: 0,
    successfulRequests: 0,
    lastSuccessfulRequest: null,
    lastFailure: null,
    currentRetryDelay: finalConfig.baseRetryDelay,
    circuitBreakerOpen: false,
    nextRetryTime: null
  })
  
  // Internal state management
  const responseTimes = useRef<number[]>([])
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const circuitBreakerTimer = useRef<NodeJS.Timeout | null>(null)
  
  /**
   * Calculate exponential backoff delay
   */
  const calculateRetryDelay = useCallback((failures: number): number => {
    const delay = finalConfig.baseRetryDelay * Math.pow(finalConfig.backoffMultiplier, failures - 1)
    return Math.min(delay, finalConfig.maxRetryDelay)
  }, [finalConfig.baseRetryDelay, finalConfig.backoffMultiplier, finalConfig.maxRetryDelay])
  
  /**
   * Update health status based on current metrics
   */
  const updateHealthStatus = useCallback((newMetrics: Partial<BackendHealthMetrics>) => {
    setMetrics(prev => {
      const updated = { ...prev, ...newMetrics }
      
      // Determine health status based on metrics
      let status: BackendHealthStatus
      
      if (updated.circuitBreakerOpen) {
        status = 'unavailable'
      } else if (updated.consecutiveFailures >= finalConfig.maxConsecutiveFailures) {
        status = 'unavailable'
      } else if (updated.consecutiveFailures > 0 && updated.consecutiveFailures < 3) {
        status = 'degraded'
      } else if (updated.successRate < 80) {
        status = 'degraded'
      } else if (updated.totalRequests === 0) {
        status = 'unknown'
      } else {
        status = 'healthy'
      }
      
      // Handle circuit breaker logic
      if (status === 'unavailable' && !prev.circuitBreakerOpen) {
        // Open circuit breaker
        const nextRetryTime = Date.now() + finalConfig.circuitBreakerTimeout
        
        if (finalConfig.enableLogging) {
          console.log(`🔴 Backend health monitor: Circuit breaker opened. Next retry: ${new Date(nextRetryTime).toISOString()}`)
        }
        
        // Set timer to close circuit breaker
        if (circuitBreakerTimer.current) {
          clearTimeout(circuitBreakerTimer.current)
        }
        
        circuitBreakerTimer.current = setTimeout(() => {
          setMetrics(m => ({
            ...m,
            circuitBreakerOpen: false,
            nextRetryTime: null,
            status: 'recovering'
          }))
          
          if (finalConfig.enableLogging) {
            console.log('🟡 Backend health monitor: Circuit breaker closed, entering recovery mode')
          }
        }, finalConfig.circuitBreakerTimeout)
        
        return {
          ...updated,
          status,
          circuitBreakerOpen: true,
          nextRetryTime
        }
      }
      
      return { ...updated, status }
    })
  }, [finalConfig])
  
  /**
   * Record a successful request
   */
  const recordSuccess = useCallback((responseTime: number) => {
    responseTimes.current.push(responseTime)
    
    // Keep only last 100 response times for average calculation
    if (responseTimes.current.length > 100) {
      responseTimes.current = responseTimes.current.slice(-100)
    }
    
    const avgResponseTime = responseTimes.current.reduce((sum, time) => sum + time, 0) / responseTimes.current.length
    
    setMetrics(prev => {
      const totalRequests = prev.totalRequests + 1
      const successfulRequests = prev.successfulRequests + 1
      const successRate = (successfulRequests / totalRequests) * 100
      
      const updated = {
        ...prev,
        totalRequests,
        successfulRequests,
        successRate,
        avgResponseTime,
        consecutiveFailures: 0, // Reset consecutive failures
        lastSuccessfulRequest: Date.now(),
        currentRetryDelay: finalConfig.baseRetryDelay // Reset retry delay
      }
      
      updateHealthStatus(updated)
      return updated
    })
    
    if (finalConfig.enableLogging && metrics.status !== 'healthy') {
      console.log(`✅ Backend health monitor: Successful request recorded (${responseTime}ms)`)
    }
  }, [finalConfig.baseRetryDelay, finalConfig.enableLogging, metrics.status, updateHealthStatus])
  
  /**
   * Record a failed request
   */
  const recordFailure = useCallback((error: Error, statusCode?: number) => {
    setMetrics(prev => {
      const totalRequests = prev.totalRequests + 1
      const successRate = prev.totalRequests > 0 ? (prev.successfulRequests / totalRequests) * 100 : 0
      const consecutiveFailures = prev.consecutiveFailures + 1
      const currentRetryDelay = calculateRetryDelay(consecutiveFailures)
      
      const updated = {
        ...prev,
        totalRequests,
        successRate,
        consecutiveFailures,
        currentRetryDelay,
        lastFailure: Date.now()
      }
      
      updateHealthStatus(updated)
      return updated
    })
    
    if (finalConfig.enableLogging) {
      console.log(`❌ Backend health monitor: Failed request recorded. Error: ${error.message}${statusCode ? ` (${statusCode})` : ''}`)
    }
  }, [calculateRetryDelay, finalConfig.enableLogging, updateHealthStatus])
  
  /**
   * Force a health check
   */
  const forceHealthCheck = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), finalConfig.requestTimeout)
      
      const response = await fetch(finalConfig.healthCheckEndpoint, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      clearTimeout(timeoutId)
      
      const responseTime = Date.now() - startTime
      
      if (response.ok) {
        recordSuccess(responseTime)
        return true
      } else {
        recordFailure(new Error(`Health check failed with status ${response.status}`), response.status)
        return false
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      recordFailure(error as Error)
      return false
    }
  }, [finalConfig.healthCheckEndpoint, finalConfig.requestTimeout, recordSuccess, recordFailure])
  
  /**
   * Make a monitored request with automatic health tracking
   */
  const makeMonitoredRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    timeoutMs: number = finalConfig.requestTimeout
  ): Promise<T> => {
    // Check if circuit breaker is open
    if (metrics.circuitBreakerOpen && metrics.nextRetryTime && Date.now() < metrics.nextRetryTime) {
      throw new BackendHealthError(
        `Circuit breaker open. Next retry in ${Math.ceil((metrics.nextRetryTime - Date.now()) / 1000)} seconds`,
        'CIRCUIT_BREAKER_OPEN'
      )
    }
    
    const startTime = Date.now()
    
    try {
      const result = await Promise.race([
        requestFn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
      ])
      
      const responseTime = Date.now() - startTime
      recordSuccess(responseTime)
      return result
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      recordFailure(error as Error)
      throw error
    }
  }, [metrics.circuitBreakerOpen, metrics.nextRetryTime, finalConfig.requestTimeout, recordSuccess, recordFailure])
  
  /**
   * Reset health state
   */
  const resetHealth = useCallback(() => {
    responseTimes.current = []
    
    if (circuitBreakerTimer.current) {
      clearTimeout(circuitBreakerTimer.current)
      circuitBreakerTimer.current = null
    }
    
    setMetrics({
      status: 'unknown',
      avgResponseTime: 0,
      successRate: 100,
      consecutiveFailures: 0,
      totalRequests: 0,
      successfulRequests: 0,
      lastSuccessfulRequest: null,
      lastFailure: null,
      currentRetryDelay: finalConfig.baseRetryDelay,
      circuitBreakerOpen: false,
      nextRetryTime: null
    })
    
    if (finalConfig.enableLogging) {
      console.log('🔄 Backend health monitor: State reset')
    }
  }, [finalConfig.baseRetryDelay, finalConfig.enableLogging])
  
  /**
   * Get current retry delay
   */
  const getCurrentRetryDelay = useCallback(() => {
    return metrics.currentRetryDelay
  }, [metrics.currentRetryDelay])
  
  /**
   * Setup periodic health checks
   */
  useEffect(() => {
    if (finalConfig.healthCheckInterval > 0) {
      healthCheckInterval.current = setInterval(() => {
        // Only run health checks if we haven't had recent activity
        if (metrics.lastSuccessfulRequest && Date.now() - metrics.lastSuccessfulRequest < finalConfig.healthCheckInterval) {
          return
        }
        
        forceHealthCheck()
      }, finalConfig.healthCheckInterval)
      
      return () => {
        if (healthCheckInterval.current) {
          clearInterval(healthCheckInterval.current)
          healthCheckInterval.current = null
        }
      }
    }
  }, [finalConfig.healthCheckInterval, metrics.lastSuccessfulRequest, forceHealthCheck])
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (healthCheckInterval.current) {
        clearInterval(healthCheckInterval.current)
      }
      if (circuitBreakerTimer.current) {
        clearTimeout(circuitBreakerTimer.current)
      }
    }
  }, [])
  
  // Computed properties
  const isBackendAvailable = metrics.status === 'healthy' || metrics.status === 'degraded' || metrics.status === 'recovering'
  
  return {
    metrics,
    isBackendAvailable,
    getCurrentRetryDelay,
    recordSuccess,
    recordFailure,
    forceHealthCheck,
    resetHealth,
    makeMonitoredRequest
  }
}
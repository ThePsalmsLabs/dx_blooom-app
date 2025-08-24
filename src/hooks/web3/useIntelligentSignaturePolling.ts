/**
 * Signature Polling Integration with Health Monitoring
 * 
 * This hook integrates intelligent health monitoring into your signature polling system,
 * transforming basic polling into a production-ready backend communication layer.
 * It builds upon your existing useSignaturePolling hook by adding sophisticated
 * retry logic, health tracking, and automatic recovery mechanisms.
 * 
 * INTEGRATION WITH YOUR ARCHITECTURE:
 * - Works with your existing /api/commerce/signature-status endpoint
 * - Uses your current Commerce Protocol Integration contract via imported ABI and addresses
 * - Integrates with the Backend Health Monitor for intelligent retry logic
 * - Maintains compatibility with your existing PaymentIntentFlow system
 * - Leverages imported COMMERCE_PROTOCOL_INTEGRATION_ABI for direct contract verification
 * 
 * WHY THIS INTEGRATION MATTERS:
 * - Production systems need intelligent backend communication
 * - Signature polling is mission-critical for payment completion
 * - Backend health issues should be handled gracefully, not cause payment failures
 * - Users need clear feedback when backend processing takes longer than expected
 * - Automatic recovery reduces manual intervention and improves user experience
 * - Direct contract verification provides fallback when backend is unavailable
 * 
 * Core Capabilities:
 * - Health-aware polling that adapts to backend conditions
 * - Intelligent retry patterns based on real-time backend health
 * - Automatic fallback strategies when primary backend struggles
 * - Comprehensive error classification with specific recovery actions
 * - Real-time status reporting for UI components
 * - Direct blockchain verification using imported contract ABI and addresses
 * 
 * File: src/hooks/web3/useIntelligentSignaturePolling.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useChainId } from 'wagmi'
import { 
  useBackendHealthMonitor, 
  BackendHealthConfig,
  BackendHealthError 
} from '@/hooks/web3/useBackendHealthMonitor'
import { validateIntentIdFormat } from '@/utils/transactions/intentExtraction'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'
import { getContractAddresses } from '@/lib/contracts/config'

/**
 * Intelligent Signature Polling State Interface
 * 
 * Comprehensive state tracking that includes both polling status and backend health context.
 * This provides UI components with detailed information for user feedback and error handling.
 */
export interface IntelligentSignaturePollingState {
  /** Current polling operation status */
  readonly status: 'idle' | 'polling' | 'found' | 'timeout' | 'backend_unavailable' | 'recovering' | 'error'
  
  /** Human-readable status message for UI display */
  readonly message: string
  
  /** Current polling attempt number */
  readonly attempt: number
  
  /** Maximum attempts configured */
  readonly maxAttempts: number
  
  /** Estimated time remaining in seconds */
  readonly estimatedTimeRemaining: number
  
  /** Current error if any */
  readonly error: Error | null
  
  /** Whether polling is currently active */
  readonly isPolling: boolean
  
  /** Progress as percentage (0-100) */
  readonly progress: number
  
  /** Backend health context */
  readonly backendHealth: {
    readonly isHealthy: boolean
    readonly avgResponseTime: number
    readonly successRate: number
    readonly nextRetryDelay: number
  }
  
  /** Signature data when found */
  readonly signatureData: {
    readonly signature: `0x${string}` | null
    readonly intentId: `0x${string}` | null
    readonly receivedAt: number | null
    readonly isReady: boolean
  }
}

/**
 * Signature Response Interface
 * 
 * Matches your backend API response structure with additional metadata
 * for health monitoring and performance tracking.
 */
export interface IntelligentSignatureResponse {
  /** The cryptographic signature for the intent */
  readonly signature: `0x${string}`
  
  /** The intent ID this signature corresponds to */
  readonly intentId: `0x${string}`
  
  /** Whether the intent is ready for execution */
  readonly isReady: boolean
  
  /** Backend response metadata */
  readonly metadata?: {
    readonly signedAt: number
    readonly processingTime?: number
    readonly signerAddress?: `0x${string}`
    readonly intentHash?: `0x${string}`
  }
  
  /** Health monitoring data */
  readonly healthData: {
    readonly responseTime: number
    readonly backendStatus: string
    readonly requestId?: string
  }
}

/**
 * Intelligent Signature Polling Configuration
 * 
 * Combines signature polling settings with backend health monitoring configuration.
 */
export interface IntelligentSignaturePollingConfig {
  /** Maximum polling attempts (default: 45) */
  readonly maxAttempts?: number
  
  /** Base polling interval in milliseconds (default: 1000) */
  readonly baseInterval?: number
  
  /** Whether to use adaptive intervals based on backend health (default: true) */
  readonly useAdaptiveIntervals?: boolean
  
  /** Custom API endpoint (default: '/api/commerce/signature-status') */
  readonly apiEndpoint?: string
  
  /** Request timeout in milliseconds (default: 8000) */
  readonly requestTimeout?: number
  
  /** Additional request headers */
  readonly headers?: Record<string, string>
  
  /** Backend health monitoring configuration */
  readonly healthConfig?: BackendHealthConfig
  
  /** Whether to enable comprehensive logging (default: false) */
  readonly enableLogging?: boolean
  
  /** Fallback strategies when backend is unhealthy */
  readonly fallbackStrategies?: {
    readonly enableExtendedTimeout?: boolean
    readonly enableAlternativeEndpoint?: boolean
    readonly alternativeEndpoint?: string
  }
}

/**
 * Default Configuration
 */
const DEFAULT_CONFIG: Required<Omit<IntelligentSignaturePollingConfig, 'healthConfig' | 'fallbackStrategies'>> & {
  fallbackStrategies: Required<NonNullable<IntelligentSignaturePollingConfig['fallbackStrategies']>>
} = {
  maxAttempts: 45,
  baseInterval: 1000,
  useAdaptiveIntervals: true,
  apiEndpoint: '/api/commerce/signature-status',
  requestTimeout: 8000,
  headers: {},
  enableLogging: false,
  fallbackStrategies: {
    enableExtendedTimeout: true,
    enableAlternativeEndpoint: false,
    alternativeEndpoint: '/api/commerce/signature-status-fallback'
  }
}

/**
 * Intelligent Signature Polling Error Types
 */
export class IntelligentSignaturePollingError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'BACKEND_UNAVAILABLE' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'INVALID_INTENT' | 'RECOVERY_FAILED',
    public readonly intentId?: `0x${string}`,
    public readonly attempt?: number,
    public readonly backendHealth?: {
      status: string
      consecutiveFailures: number
      avgResponseTime: number
    },
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'IntelligentSignaturePollingError'
  }
}

/**
 * Hook Result Interface
 */
export interface UseIntelligentSignaturePollingResult {
  /** Current polling state with health context */
  readonly state: IntelligentSignaturePollingState
  
  /** Poll for a signature with intelligent retry logic */
  readonly pollForSignature: (intentId: `0x${string}`) => Promise<IntelligentSignatureResponse>
  
  /** Check signature status once without continuous polling */
  readonly checkSignatureStatus: (intentId: `0x${string}`) => Promise<IntelligentSignatureResponse | null>
  
  /** Cancel any active polling operation */
  readonly cancelPolling: () => void
  
  /** Reset polling state to idle */
  readonly resetState: () => void
  
  /** Force a backend health check */
  readonly checkBackendHealth: () => Promise<boolean>
  
  /** Whether polling can be started */
  readonly canStartPolling: boolean
  
  /** Get recommended next polling interval based on backend health */
  readonly getNextPollingInterval: () => number
  
  /** Check intent status directly on the blockchain */
  readonly checkIntentOnChain: (intentId: `0x${string}`) => Promise<{
    readonly isCreated: boolean
    readonly isSigned: boolean
    readonly isReady: boolean
    readonly intentHash: `0x${string}` | null
    readonly hasSignature: boolean
    readonly isActive: boolean
  }>
  
  /** Enhanced contract verification with comprehensive status checking */
  readonly enhancedContractVerification: (intentId: `0x${string}`) => Promise<{
    readonly intentHash: `0x${string}` | null
    readonly isReady: boolean
    readonly hasSignature: boolean
    readonly isActive: boolean
    readonly paymentContext: any
    readonly verificationTimestamp: number
  } | null>
}

/**
 * useIntelligentSignaturePolling Hook
 * 
 * Main hook for intelligent signature polling with health monitoring and adaptive retry logic.
 * This transforms your basic signature polling into a production-ready backend integration system.
 * 
 * INTEGRATION PATTERN:
 * Replace your existing useSignaturePolling calls with this hook to get intelligent
 * health monitoring, adaptive retry logic, and comprehensive error handling.
 * 
 * @param config - Configuration for intelligent polling behavior
 * @returns Intelligent signature polling operations and state
 * 
 * Usage Example:
 * ```typescript
 * const { state, pollForSignature } = useIntelligentSignaturePolling({
 *   maxAttempts: 60,  // Allow longer timeout for production
 *   useAdaptiveIntervals: true,
 *   enableLogging: true
 * })
 * 
 * try {
 *   const signature = await pollForSignature(intentId)
 *   // Signature received with health context
 * } catch (error) {
 *   if (error instanceof IntelligentSignaturePollingError) {
 *     // Handle specific error types with context
 *     console.log(`Backend health: ${error.backendHealth?.status}`)
 *   }
 * }
 * ```
 */
export function useIntelligentSignaturePolling(
  config: IntelligentSignaturePollingConfig = {}
): UseIntelligentSignaturePollingResult {
  
  // Merge configuration with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Hook dependencies
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)
  
  // Backend health monitoring
  const healthMonitor = useBackendHealthMonitor({
    maxConsecutiveFailures: 3,
    baseRetryDelay: finalConfig.baseInterval,
    enableLogging: finalConfig.enableLogging,
    ...finalConfig.healthConfig
  })
  
  // Polling state management
  const [state, setState] = useState<IntelligentSignaturePollingState>({
    status: 'idle',
    message: 'Ready to poll for signatures',
    attempt: 0,
    maxAttempts: finalConfig.maxAttempts,
    estimatedTimeRemaining: finalConfig.maxAttempts,
    error: null,
    isPolling: false,
    progress: 0,
    backendHealth: {
      isHealthy: true,
      avgResponseTime: 0,
      successRate: 100,
      nextRetryDelay: finalConfig.baseInterval
    },
    signatureData: {
      signature: null,
      intentId: null,
      receivedAt: null,
      isReady: false
    }
  })
  
  // Operation management refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentIntentIdRef = useRef<`0x${string}` | null>(null)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  /**
   * Update state with backend health context
   */
  const updateState = useCallback((updates: Partial<IntelligentSignaturePollingState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      backendHealth: {
        isHealthy: healthMonitor.isBackendAvailable,
        avgResponseTime: healthMonitor.metrics.avgResponseTime,
        successRate: healthMonitor.metrics.successRate,
        nextRetryDelay: healthMonitor.getCurrentRetryDelay()
      }
    }))
  }, [healthMonitor])
  
  /**
   * Calculate adaptive polling interval based on backend health
   */
  const getNextPollingInterval = useCallback((): number => {
    if (!finalConfig.useAdaptiveIntervals) {
      return finalConfig.baseInterval
    }
    
    const { metrics } = healthMonitor
    
    // If backend is healthy, use base interval
    if (metrics.status === 'healthy') {
      return finalConfig.baseInterval
    }
    
    // If backend is degraded, use slightly longer intervals
    if (metrics.status === 'degraded') {
      return Math.min(finalConfig.baseInterval * 1.5, 2000)
    }
    
    // If backend is recovering, use conservative intervals
    if (metrics.status === 'recovering') {
      return Math.min(finalConfig.baseInterval * 2, 3000)
    }
    
    // For other states, use the health monitor's calculated retry delay
    return metrics.currentRetryDelay
  }, [finalConfig.useAdaptiveIntervals, finalConfig.baseInterval, healthMonitor])
  
  /**
   * Check intent status directly on the blockchain using Commerce Protocol Integration contract
   * 
   * This function leverages the imported COMMERCE_PROTOCOL_INTEGRATION_ABI and contract addresses
   * to provide direct blockchain verification of intent status, bypassing backend dependencies
   * when needed for health monitoring and recovery scenarios.
   * 
   * CONTRACT INVESTIGATION FINDINGS:
   * - intentHashes(bytes16) - Returns the hash that needs to be signed for the intent
   * - intentReadyForExecution(bytes16) - Returns whether the intent is ready for execution
   * - hasSignature(bytes16) - Returns whether a signature has been provided for the intent
   * - hasActiveIntent(bytes16) - Returns whether the intent is still active (not processed)
   * 
   * These functions are based on actual contract analysis, not assumptions.
   */
  const checkIntentOnChain = useCallback(async (intentId: `0x${string}`) => {
    try {
      // Use the imported contract addresses and ABI directly
      const contractAddresses = getContractAddresses(chainId)
      
      // Create a public client for reading contract state
      const { createPublicClient, http } = await import('viem')
      const { base, baseSepolia } = await import('viem/chains')
      
      const currentChain = chainId === 8453 ? base : baseSepolia
      const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      const alchemyUrl = alchemyApiKey
        ? (currentChain.id === base.id
            ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
            : `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`)
        : undefined
      
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(alchemyUrl)
      })
      
      // Check if intent exists and get its hash using imported ABI and addresses
      const intentHash = await publicClient.readContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'intentHashes',
        args: [intentId]
      }) as `0x${string}`
      
      const isCreated = intentHash !== '0x0000000000000000000000000000000000000000000000000000000000000000'
      
      if (!isCreated) {
        return {
          isCreated: false,
          isSigned: false,
          isReady: false,
          intentHash: null,
          hasSignature: false,
          isActive: false
        }
      }
      
      // Check if intent is ready for execution using actual contract function
      const isReady = await publicClient.readContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'intentReadyForExecution',
        args: [intentId]
      }) as boolean
      
      // Check if intent has signature using actual contract function
      const hasSignature = await publicClient.readContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'hasSignature',
        args: [intentId]
      }) as boolean
      
      // Check if intent is still active using actual contract function
      const isActive = await publicClient.readContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'hasActiveIntent',
        args: [intentId]
      }) as boolean
      
      // Check if intent is signed (if it's ready, it must be signed)
      const isSigned = isReady
      
      return {
        isCreated: true,
        isSigned,
        isReady,
        intentHash,
        hasSignature,
        isActive
      }
      
    } catch (error) {
      if (finalConfig.enableLogging) {
        console.error('Failed to check intent on-chain:', error)
      }
      
      return {
        isCreated: false,
        isSigned: false,
        isReady: false,
        intentHash: null,
        hasSignature: false,
        isActive: false
      }
    }
  }, [chainId, finalConfig.enableLogging])
  
  /**
   * Enhanced contract verification using imported ABI and addresses
   * 
   * Provides additional verification capabilities beyond basic intent status checking.
   * This leverages the imported COMMERCE_PROTOCOL_INTEGRATION_ABI for comprehensive
   * contract interaction during health monitoring and recovery scenarios.
   * 
   * CONTRACT INVESTIGATION FINDINGS:
   * - getPaymentContext(bytes16) - Returns the complete payment context including user, creator, amounts, etc.
   * - Additional verification functions combined for comprehensive status checking
   * 
   * This function provides a complete picture of the intent's state for advanced health monitoring.
   */
  const enhancedContractVerification = useCallback(async (intentId: `0x${string}`) => {
    try {
      const contractAddresses = getContractAddresses(chainId)
      
      // Create a public client for enhanced contract interactions
      const { createPublicClient, http } = await import('viem')
      const { base, baseSepolia } = await import('viem/chains')
      
      const currentChain = chainId === 8453 ? base : baseSepolia
      const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
      const alchemyUrl = alchemyApiKey
        ? (currentChain.id === base.id
            ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
            : `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`)
        : undefined
      
      const publicClient = createPublicClient({
        chain: currentChain,
        transport: http(alchemyUrl)
      })
      
      // Enhanced verification: Check multiple contract states based on actual contract functions
      const [intentHash, isReady, hasSignature, isActive, paymentContext] = await Promise.all([
        publicClient.readContract({
          address: contractAddresses.COMMERCE_INTEGRATION,
          abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
          functionName: 'intentHashes',
          args: [intentId]
        }),
        publicClient.readContract({
          address: contractAddresses.COMMERCE_INTEGRATION,
          abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
          functionName: 'intentReadyForExecution',
          args: [intentId]
        }),
        publicClient.readContract({
          address: contractAddresses.COMMERCE_INTEGRATION,
          abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
          functionName: 'hasSignature',
          args: [intentId]
        }),
        publicClient.readContract({
          address: contractAddresses.COMMERCE_INTEGRATION,
          abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
          functionName: 'hasActiveIntent',
          args: [intentId]
        }),
        publicClient.readContract({
          address: contractAddresses.COMMERCE_INTEGRATION,
          abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
          functionName: 'getPaymentContext',
          args: [intentId]
        })
      ])
      
      return {
        intentHash: intentHash as `0x${string}`,
        isReady: isReady as boolean,
        hasSignature: hasSignature as boolean,
        isActive: isActive as boolean,
        paymentContext: paymentContext as any,
        verificationTimestamp: Date.now()
      }
      
    } catch (error) {
      if (finalConfig.enableLogging) {
        console.error('Enhanced contract verification failed:', error)
      }
      return null
    }
  }, [chainId, finalConfig.enableLogging])
  
  /**
   * Make signature polling request with health monitoring
   */
  const makeSignatureRequest = useCallback(async (
    intentId: `0x${string}`,
    signal: AbortSignal
  ): Promise<IntelligentSignatureResponse | null> => {
    
    // Ensure endpoint is never undefined
    const endpoint = healthMonitor.isBackendAvailable 
      ? finalConfig.apiEndpoint 
      : (finalConfig.fallbackStrategies.enableAlternativeEndpoint 
          ? finalConfig.fallbackStrategies.alternativeEndpoint 
          : finalConfig.apiEndpoint)
    
    // Validate endpoint is defined
    if (!endpoint) {
      throw new IntelligentSignaturePollingError(
        'No valid API endpoint available',
        'BACKEND_UNAVAILABLE',
        intentId,
        state.attempt
      )
    }
    
    const requestTimeout = healthMonitor.isBackendAvailable
      ? finalConfig.requestTimeout
      : (finalConfig.fallbackStrategies.enableExtendedTimeout 
          ? finalConfig.requestTimeout * 2 
          : finalConfig.requestTimeout)
    
    if (finalConfig.enableLogging) {
      console.log(`🔄 Making signature request to: ${endpoint} (timeout: ${requestTimeout}ms)`)
    }
    
    const requestPromise = healthMonitor.makeMonitoredRequest(async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...finalConfig.headers
        },
        body: JSON.stringify({ 
          intentId,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }),
        signal
      })
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }
      
      return response.json()
    }, requestTimeout)
    
    try {
      const data = await requestPromise
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format')
      }
      
      if (data.isSigned && data.signature) {
        const responseTime = healthMonitor.metrics.avgResponseTime
        
        return {
          signature: data.signature,
          intentId,
          isReady: true,
          metadata: {
            signedAt: Date.now(),
            processingTime: data.processingTime,
            signerAddress: data.signerAddress,
            intentHash: data.intentHash
          },
          healthData: {
            responseTime,
            backendStatus: healthMonitor.metrics.status,
            requestId: data.requestId
          }
        }
      }
      
      return null
      
    } catch (error) {
      if (error instanceof BackendHealthError) {
        throw new IntelligentSignaturePollingError(
          `Backend unavailable: ${error.message}`,
          'BACKEND_UNAVAILABLE',
          intentId,
          state.attempt,
          {
            status: healthMonitor.metrics.status,
            consecutiveFailures: healthMonitor.metrics.consecutiveFailures,
            avgResponseTime: healthMonitor.metrics.avgResponseTime
          },
          error
        )
      }
      
      throw error
    }
  }, [finalConfig, healthMonitor, state.attempt])
  
  /**
   * Cleanup polling operation
   */
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
    
    currentIntentIdRef.current = null
  }, [])
  
  /**
   * Main polling function with intelligent retry logic
   */
  const pollForSignature = useCallback(async (
    intentId: `0x${string}`
  ): Promise<IntelligentSignatureResponse> => {
    
    // Validate intent ID format
    if (!validateIntentIdFormat(intentId)) {
      throw new IntelligentSignaturePollingError(
        `Invalid intent ID format: ${intentId}`,
        'INVALID_INTENT',
        intentId
      )
    }
    
    // Prevent concurrent polling
    if (state.isPolling) {
      throw new IntelligentSignaturePollingError(
        'Polling already in progress',
        'INVALID_RESPONSE',
        intentId
      )
    }
    
    // Setup polling operation
    cleanup()
    currentIntentIdRef.current = intentId
    abortControllerRef.current = new AbortController()
    
    updateState({
      status: 'polling',
      message: 'Starting intelligent signature polling...',
      attempt: 0,
      isPolling: true,
      progress: 0,
      error: null,
      signatureData: {
        signature: null,
        intentId,
        receivedAt: null,
        isReady: false
      }
    })
    
    if (finalConfig.enableLogging) {
      console.log(`🚀 Starting intelligent signature polling for intent: ${intentId}`)
      console.log(`📊 Backend health: ${healthMonitor.metrics.status} (${healthMonitor.metrics.successRate.toFixed(1)}% success rate)`)
    }
    
    return new Promise<IntelligentSignatureResponse>((resolve, reject) => {
      let attemptNumber = 0
      
      const scheduleNextAttempt = (delayMs: number) => {
        pollingTimeoutRef.current = setTimeout(() => attemptPoll(), delayMs)
      }
      
      const attemptPoll = async () => {
        // Check if polling was cancelled
        if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
          reject(new IntelligentSignaturePollingError(
            'Polling cancelled',
            'TIMEOUT',
            intentId,
            attemptNumber
          ))
          return
        }
        
        attemptNumber++
        const progress = Math.min(100, (attemptNumber / finalConfig.maxAttempts) * 100)
        const remainingAttempts = finalConfig.maxAttempts - attemptNumber
        
        // Update status based on backend health
        let status: IntelligentSignaturePollingState['status'] = 'polling'
        let message = `Polling for signature... (${attemptNumber}/${finalConfig.maxAttempts})`
        
        if (!healthMonitor.isBackendAvailable) {
          status = 'backend_unavailable'
          message = `Backend temporarily unavailable. Retrying... (${attemptNumber}/${finalConfig.maxAttempts})`
        } else if (healthMonitor.metrics.status === 'recovering') {
          status = 'recovering'
          message = `Backend recovering. Polling cautiously... (${attemptNumber}/${finalConfig.maxAttempts})`
        }
        
        updateState({
          status,
          message,
          attempt: attemptNumber,
          progress,
          estimatedTimeRemaining: remainingAttempts
        })
        
        if (finalConfig.enableLogging) {
          console.log(`🔄 Signature polling attempt ${attemptNumber}/${finalConfig.maxAttempts} (backend: ${healthMonitor.metrics.status})`)
        }
        
        try {
          const result = await makeSignatureRequest(intentId, abortControllerRef.current!.signal)
          
          if (result) {
            // Signature found!
            updateState({
              status: 'found',
              message: 'Signature received successfully!',
              progress: 100,
              isPolling: false,
              signatureData: {
                signature: result.signature,
                intentId: result.intentId,
                receivedAt: Date.now(),
                isReady: result.isReady
              }
            })
            
            if (finalConfig.enableLogging) {
              console.log(`✅ Signature found for intent: ${intentId} (response time: ${result.healthData.responseTime}ms)`)
            }
            
            cleanup()
            resolve(result)
            return
          }
          
          // No signature yet, check if we should continue
          if (attemptNumber >= finalConfig.maxAttempts) {
            const timeoutError = new IntelligentSignaturePollingError(
              `Signature polling timeout after ${attemptNumber} attempts`,
              'TIMEOUT',
              intentId,
              attemptNumber,
              {
                status: healthMonitor.metrics.status,
                consecutiveFailures: healthMonitor.metrics.consecutiveFailures,
                avgResponseTime: healthMonitor.metrics.avgResponseTime
              }
            )
            
            updateState({
              status: 'timeout',
              message: 'Signature polling timeout',
              progress: 100,
              isPolling: false,
              error: timeoutError
            })
            
            cleanup()
            reject(timeoutError)
            return
          }
          
          // Schedule next attempt with adaptive interval
          const nextInterval = getNextPollingInterval()
          scheduleNextAttempt(nextInterval)
          
        } catch (error) {
          const pollingError = error instanceof IntelligentSignaturePollingError 
            ? error 
            : new IntelligentSignaturePollingError(
                error instanceof Error ? error.message : 'Unknown polling error',
                'NETWORK_ERROR',
                intentId,
                attemptNumber,
                {
                  status: healthMonitor.metrics.status,
                  consecutiveFailures: healthMonitor.metrics.consecutiveFailures,
                  avgResponseTime: healthMonitor.metrics.avgResponseTime
                },
                error
              )
          
          if (finalConfig.enableLogging) {
            console.log(`❌ Polling attempt ${attemptNumber} failed: ${pollingError.message}`)
          }
          
          // For backend unavailable errors, continue retrying with backoff
          if (pollingError.code === 'BACKEND_UNAVAILABLE' && attemptNumber < finalConfig.maxAttempts) {
            const backoffDelay = healthMonitor.getCurrentRetryDelay()
            scheduleNextAttempt(backoffDelay)
            return
          }
          
          // For other errors or max attempts reached, fail
          updateState({
            status: 'error',
            message: pollingError.message,
            progress: 0,
            isPolling: false,
            error: pollingError
          })
          
          cleanup()
          reject(pollingError)
        }
      }
      
      // Start polling immediately
      attemptPoll()
    })
  }, [
    state.isPolling, 
    finalConfig, 
    healthMonitor, 
    updateState, 
    cleanup, 
    makeSignatureRequest, 
    getNextPollingInterval
  ])
  
  /**
   * Check signature status once without polling
   */
  const checkSignatureStatus = useCallback(async (
    intentId: `0x${string}`
  ): Promise<IntelligentSignatureResponse | null> => {
    
    if (!validateIntentIdFormat(intentId)) {
      throw new IntelligentSignaturePollingError(
        `Invalid intent ID format: ${intentId}`,
        'INVALID_INTENT',
        intentId
      )
    }
    
    const tempController = new AbortController()
    
    try {
      return await makeSignatureRequest(intentId, tempController.signal)
    } catch (error) {
      if (finalConfig.enableLogging) {
        console.log(`❌ Single signature check failed: ${error}`)
      }
      return null
    }
  }, [makeSignatureRequest, finalConfig.enableLogging])
  
  /**
   * Cancel active polling
   */
  const cancelPolling = useCallback(() => {
    cleanup()
    
    updateState({
      status: 'idle',
      message: 'Polling cancelled',
      isPolling: false,
      progress: 0,
      error: null
    })
    
    if (finalConfig.enableLogging) {
      console.log('🛑 Signature polling cancelled')
    }
  }, [cleanup, updateState, finalConfig.enableLogging])
  
  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    cleanup()
    
    setState({
      status: 'idle',
      message: 'Ready to poll for signatures',
      attempt: 0,
      maxAttempts: finalConfig.maxAttempts,
      estimatedTimeRemaining: finalConfig.maxAttempts,
      error: null,
      isPolling: false,
      progress: 0,
      backendHealth: {
        isHealthy: healthMonitor.isBackendAvailable,
        avgResponseTime: healthMonitor.metrics.avgResponseTime,
        successRate: healthMonitor.metrics.successRate,
        nextRetryDelay: healthMonitor.getCurrentRetryDelay()
      },
      signatureData: {
        signature: null,
        intentId: null,
        receivedAt: null,
        isReady: false
      }
    })
    
    if (finalConfig.enableLogging) {
      console.log('🔄 Signature polling state reset')
    }
  }, [cleanup, finalConfig, healthMonitor])
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])
  
  // Computed properties
  const canStartPolling = !state.isPolling
  const checkBackendHealth = healthMonitor.forceHealthCheck
  
  return {
    state,
    pollForSignature,
    checkSignatureStatus,
    cancelPolling,
    resetState,
    checkBackendHealth,
    canStartPolling,
    getNextPollingInterval,
    checkIntentOnChain,
    enhancedContractVerification
  }
}
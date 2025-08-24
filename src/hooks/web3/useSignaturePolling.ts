/**
 * Signature Polling Hook
 * 
 * This hook manages the critical backend communication for intent-based payments.
 * It polls your backend API service to retrieve cryptographic signatures for payment intents,
 * with intelligent retry logic, proper error handling, and performance optimizations.
 * 
 * ALIGNED WITH ACTUAL CONTRACT FUNCTIONS:
 * - Uses provideIntentSignature() for backend signature submission
 * - Integrates with executePaymentWithSignature() for payment execution
 * - Follows the actual contract flow: Create → Sign → Execute
 * 
 * Why This Component Matters:
 * - Payment intents require backend signatures before execution
 * - Backend processing is asynchronous and takes variable time (5-30 seconds)
 * - Network issues and backend unavailability must be handled gracefully
 * - Users need real-time status updates during signature waiting periods
 * 
 * Integration Architecture:
 * - Connects to your existing `/api/commerce/signature-status` endpoint
 * - Uses intent IDs extracted from Component #1 (intentExtraction.ts)
 * - Provides signature data for Component #3 (usePaymentIntentFlow)
 * - Follows your existing React hook patterns and error handling conventions
 * 
 * File: src/hooks/web3/useSignaturePolling.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useReadContract, useChainId } from 'wagmi'
import { validateIntentIdFormat } from '@/utils/transactions/intentExtraction'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'
import { getContractAddresses } from '@/lib/contracts/config'

/**
 * Signature Polling State Interface
 * 
 * Represents the current state of signature polling operations.
 * This provides comprehensive status information for UI components.
 */
export interface SignaturePollingState {
  /** Current polling status */
  readonly status: 'idle' | 'polling' | 'found' | 'timeout' | 'error'
  
  /** Human-readable status message for UI display */
  readonly message: string
  
  /** Number of polling attempts made */
  readonly attempts: number
  
  /** Maximum attempts allowed before timeout */
  readonly maxAttempts: number
  
  /** Time remaining until timeout (in seconds) */
  readonly timeRemaining: number
  
  /** Current error if any */
  readonly error: Error | null
  
  /** Whether polling is currently active */
  readonly isPolling: boolean
  
  /** Progress as percentage (0-100) */
  readonly progress: number
}

/**
 * Signature Response Interface
 * 
 * Represents the successful response from signature polling.
 * This matches your backend API response structure and contract expectations.
 */
export interface SignatureResponse {
  /** The cryptographic signature for the intent */
  readonly signature: `0x${string}`
  
  /** The intent ID this signature corresponds to */
  readonly intentId: `0x${string}`
  
  /** Whether the intent is ready for execution */
  readonly isReady: boolean
  
  /** Backend-provided metadata */
  readonly metadata?: {
    readonly signedAt: number
    readonly expiresAt?: number
    readonly signerAddress?: `0x${string}`
    readonly intentHash?: `0x${string}` // From your API
  }
}

/**
 * Signature Polling Configuration
 * 
 * Configuration options for customizing polling behavior.
 * Provides sensible defaults while allowing customization for different use cases.
 */
export interface SignaturePollingConfig {
  /** Maximum polling attempts before timeout (default: 30) */
  readonly maxAttempts?: number
  
  /** Base interval between polling attempts in milliseconds (default: 1000) */
  readonly baseInterval?: number
  
  /** Whether to use exponential backoff for retry intervals (default: false) */
  readonly useExponentialBackoff?: boolean
  
  /** Maximum backoff interval in milliseconds (default: 5000) */
  readonly maxBackoffInterval?: number
  
  /** Custom API endpoint (default: '/api/commerce/signature-status') */
  readonly apiEndpoint?: string
  
  /** Additional request headers */
  readonly headers?: Record<string, string>
  
  /** Whether to enable debug logging (default: false) */
  readonly enableDebugLogging?: boolean
}

/**
 * Default Signature Polling Configuration
 */
const DEFAULT_CONFIG: Required<SignaturePollingConfig> = {
  maxAttempts: 30,           // 30 seconds at 1-second intervals
  baseInterval: 1000,        // 1 second base interval
  useExponentialBackoff: false,
  maxBackoffInterval: 5000,  // 5 second maximum backoff
  apiEndpoint: '/api/commerce/signature-status',
  headers: {},
  enableDebugLogging: false
}

/**
 * Signature Polling Error Types
 * 
 * Specific error types for different signature polling failure scenarios.
 */
export class SignaturePollingError extends Error {
  constructor(
    message: string,
    public readonly code: 'TIMEOUT' | 'NETWORK_ERROR' | 'INVALID_RESPONSE' | 'BACKEND_ERROR' | 'INVALID_INTENT_ID',
    public readonly intentId?: `0x${string}`,
    public readonly attempts?: number,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'SignaturePollingError'
  }
}

/**
 * Signature Polling Hook Result Interface
 */
export interface UseSignaturePollingResult {
  /** Current polling state */
  readonly state: SignaturePollingState
  
  /** Poll for a signature given an intent ID */
  readonly pollForSignature: (intentId: `0x${string}`) => Promise<SignatureResponse>
  
  /** Check signature status without continuous polling */
  readonly checkSignatureStatus: (intentId: `0x${string}`) => Promise<SignatureResponse | null>
  
  /** Cancel any active polling operation */
  readonly cancelPolling: () => void
  
  /** Reset polling state to idle */
  readonly resetState: () => void
  
  /** Whether polling can be started (not already active) */
  readonly canStartPolling: boolean
}

/**
 * useSignaturePolling Hook
 * 
 * Main hook for managing backend signature polling operations.
 * Provides intelligent retry logic, proper error handling, and real-time status updates.
 * 
 * @param config - Optional configuration for customizing polling behavior
 * @returns Signature polling operations and state
 * 
 * Usage Example:
 * ```typescript
 * const { state, pollForSignature } = useSignaturePolling({
 *   maxAttempts: 45,  // 45 seconds timeout
 *   enableDebugLogging: true
 * })
 * 
 * try {
 *   const signature = await pollForSignature(intentId)
 *   // Use signature for payment execution
 * } catch (error) {
 *   // Handle polling failure
 * }
 * ```
 */
export function useSignaturePolling(
  config: SignaturePollingConfig = {}
): UseSignaturePollingResult {
  
  // Merge provided config with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Hook dependencies
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)
  
  // Polling state management
  const [state, setState] = useState<SignaturePollingState>({
    status: 'idle',
    message: 'Ready to poll for signatures',
    attempts: 0,
    maxAttempts: finalConfig.maxAttempts,
    timeRemaining: finalConfig.maxAttempts,
    error: null,
    isPolling: false,
    progress: 0
  })
  
  // Refs for managing polling operations
  const abortControllerRef = useRef<AbortController | null>(null)
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentIntentIdRef = useRef<`0x${string}` | null>(null)
  
  // Contract read hook for intentHash
  const intentHashQuery = useReadContract({
    address: contractAddresses.COMMERCE_INTEGRATION,
    abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
    functionName: 'intentHashes',
    args: [currentIntentIdRef.current as `0x${string}`],
    query: {
      enabled: !!currentIntentIdRef.current,
      retry: 3,
      retryDelay: 1000,
    }
  })
  
  // Cleanup function for polling operations
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
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])
  
  /**
   * Calculate next polling interval with optional exponential backoff
   */
  const calculateNextInterval = useCallback((attemptNumber: number): number => {
    if (!finalConfig.useExponentialBackoff) {
      return finalConfig.baseInterval
    }
    
    const exponentialInterval = finalConfig.baseInterval * Math.pow(2, Math.min(attemptNumber, 4))
    return Math.min(exponentialInterval, finalConfig.maxBackoffInterval)
  }, [finalConfig.baseInterval, finalConfig.useExponentialBackoff, finalConfig.maxBackoffInterval])
  
  /**
   * Make API request to check signature status
   */
  const makeSignatureRequest = useCallback(async (
    intentId: `0x${string}`,
    signal: AbortSignal
  ): Promise<SignatureResponse | null> => {
    try {
      // Get the actual intentHash from the smart contract
      // Update the ref so the hook can fetch the data
      currentIntentIdRef.current = intentId
      
      // Wait for the hook to fetch the intentHash
      if (!intentHashQuery.data) {
        throw new SignaturePollingError(
          'Failed to retrieve intent hash from contract',
          'NETWORK_ERROR',
          intentId
        )
      }
      
      const intentHash = intentHashQuery.data as `0x${string}`
      
      const response = await fetch(finalConfig.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...finalConfig.headers
        },
        body: JSON.stringify({ 
          intentId,
          intentHash, // Your API expects both intentId and intentHash
          requestedAt: Date.now()
        }),
        signal
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          // Intent not found yet - this is expected during early polling
          return null
        } else if (response.status >= 500) {
          throw new SignaturePollingError(
            `Backend error: ${response.status} ${response.statusText}`,
            'BACKEND_ERROR',
            intentId
          )
        } else {
          throw new SignaturePollingError(
            `API request failed: ${response.status} ${response.statusText}`,
            'NETWORK_ERROR',
            intentId
          )
        }
      }
      
      const data = await response.json()
      
      // Validate response structure - ALIGNED WITH YOUR ACTUAL API RESPONSE
      if (!data || typeof data !== 'object') {
        throw new SignaturePollingError(
          'Invalid response format from signature API',
          'INVALID_RESPONSE',
          intentId
        )
      }
      
      // Check if signature is available - ALIGNED WITH YOUR API STRUCTURE
      if (data.success && data.signature) {
        // Validate signature format
        if (typeof data.signature !== 'string' || !data.signature.startsWith('0x')) {
          throw new SignaturePollingError(
            'Invalid signature format received from backend',
            'INVALID_RESPONSE',
            intentId
          )
        }
        
        return {
          signature: data.signature as `0x${string}`,
          intentId,
          isReady: true,
          metadata: {
            signedAt: data.signedAt || Date.now(),
            expiresAt: data.expiresAt,
            signerAddress: data.signerAddress,
            intentHash: data.intentHash
          }
        }
      }
      
      // Signature not ready yet
      return null
      
    } catch (error) {
      if (signal.aborted) {
        // Request was cancelled - don't treat as error
        return null
      }
      
      if (error instanceof SignaturePollingError) {
        throw error
      }
      
      // Wrap unexpected errors
      throw new SignaturePollingError(
        `Network error during signature polling: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'NETWORK_ERROR',
        intentId,
        undefined,
        error
      )
    }
  }, [finalConfig.apiEndpoint, finalConfig.headers])
  
  /**
   * Check signature status without continuous polling
   */
  const checkSignatureStatus = useCallback(async (
    intentId: `0x${string}`
  ): Promise<SignatureResponse | null> => {
    // Validate intent ID format
    if (!validateIntentIdFormat(intentId)) {
      throw new SignaturePollingError(
        `Invalid intent ID format: ${intentId}`,
        'INVALID_INTENT_ID',
        intentId
      )
    }
    
    const abortController = new AbortController()
    
    try {
      return await makeSignatureRequest(intentId, abortController.signal)
    } finally {
      abortController.abort()
    }
  }, [makeSignatureRequest])
  
  /**
   * Poll for signature with intelligent retry logic
   */
  const pollForSignature = useCallback(async (
    intentId: `0x${string}`
  ): Promise<SignatureResponse> => {
    // Validate intent ID format
    if (!validateIntentIdFormat(intentId)) {
      throw new SignaturePollingError(
        `Invalid intent ID format: ${intentId}`,
        'INVALID_INTENT_ID',
        intentId
      )
    }
    
    // Prevent concurrent polling
    if (state.isPolling) {
      throw new SignaturePollingError(
        'Polling already in progress',
        'INVALID_RESPONSE',
        intentId
      )
    }
    
    // Setup polling state
    cleanup() // Ensure clean state
    currentIntentIdRef.current = intentId
    abortControllerRef.current = new AbortController()
    
    setState({
      status: 'polling',
      message: 'Waiting for backend signature...',
      attempts: 0,
      maxAttempts: finalConfig.maxAttempts,
      timeRemaining: finalConfig.maxAttempts,
      error: null,
      isPolling: true,
      progress: 0
    })
    
    if (finalConfig.enableDebugLogging) {
      console.log(`🔄 Starting signature polling for intent: ${intentId}`)
    }
    
    return new Promise<SignatureResponse>((resolve, reject) => {
      let attemptNumber = 0
      
      const attemptPoll = async () => {
        // Check if polling was cancelled
        if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
          reject(new SignaturePollingError('Polling cancelled', 'NETWORK_ERROR', intentId, attemptNumber))
          return
        }
        
        attemptNumber++
        const timeRemaining = Math.max(0, finalConfig.maxAttempts - attemptNumber)
        const progress = Math.min(100, (attemptNumber / finalConfig.maxAttempts) * 100)
        
        setState(prev => ({
          ...prev,
          attempts: attemptNumber,
          timeRemaining,
          progress,
          message: `Waiting for backend signature... (${attemptNumber}/${finalConfig.maxAttempts})`
        }))
        
        if (finalConfig.enableDebugLogging) {
          console.log(`🔄 Signature polling attempt ${attemptNumber}/${finalConfig.maxAttempts} for intent: ${intentId}`)
        }
        
        try {
          const result = await makeSignatureRequest(intentId, abortControllerRef.current!.signal)
          
          if (result) {
            // Signature found!
            setState({
              status: 'found',
              message: 'Signature received from backend',
              attempts: attemptNumber,
              maxAttempts: finalConfig.maxAttempts,
              timeRemaining: 0,
              error: null,
              isPolling: false,
              progress: 100
            })
            
            cleanup()
            
            if (finalConfig.enableDebugLogging) {
              console.log(`✅ Signature found for intent: ${intentId} after ${attemptNumber} attempts`)
            }
            
            resolve(result)
            return
          }
          
          // Check if we've reached max attempts
          if (attemptNumber >= finalConfig.maxAttempts) {
            const timeoutError = new SignaturePollingError(
              `Signature polling timeout after ${attemptNumber} attempts`,
              'TIMEOUT',
              intentId,
              attemptNumber
            )
            
            setState({
              status: 'timeout',
              message: 'Backend signature timeout',
              attempts: attemptNumber,
              maxAttempts: finalConfig.maxAttempts,
              timeRemaining: 0,
              error: timeoutError,
              isPolling: false,
              progress: 100
            })
            
            cleanup()
            
            if (finalConfig.enableDebugLogging) {
              console.error(`⏰ Signature polling timeout for intent: ${intentId}`)
            }
            
            reject(timeoutError)
            return
          }
          
          // Schedule next attempt
          const nextInterval = calculateNextInterval(attemptNumber - 1)
          pollingTimeoutRef.current = setTimeout(attemptPoll, nextInterval)
          
        } catch (error) {
          const pollingError = error instanceof SignaturePollingError 
            ? error 
            : new SignaturePollingError(
                `Polling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'NETWORK_ERROR',
                intentId,
                attemptNumber,
                error
              )
          
          setState({
            status: 'error',
            message: pollingError.message,
            attempts: attemptNumber,
            maxAttempts: finalConfig.maxAttempts,
            timeRemaining: 0,
            error: pollingError,
            isPolling: false,
            progress: 0
          })
          
          cleanup()
          
          if (finalConfig.enableDebugLogging) {
            console.error(`❌ Signature polling error for intent: ${intentId}:`, pollingError)
          }
          
          reject(pollingError)
        }
      }
      
      // Start polling
      attemptPoll()
    })
  }, [state.isPolling, finalConfig, cleanup, makeSignatureRequest, calculateNextInterval])
  
  /**
   * Cancel any active polling operation
   */
  const cancelPolling = useCallback(() => {
    if (state.isPolling) {
      cleanup()
      
      setState(prev => ({
        ...prev,
        status: 'idle',
        message: 'Polling cancelled',
        isPolling: false,
        progress: 0
      }))
      
      if (finalConfig.enableDebugLogging) {
        console.log(`🚫 Signature polling cancelled for intent: ${currentIntentIdRef.current}`)
      }
    }
  }, [state.isPolling, cleanup, finalConfig.enableDebugLogging])
  
  /**
   * Reset polling state to idle
   */
  const resetState = useCallback(() => {
    cleanup()
    
    setState({
      status: 'idle',
      message: 'Ready to poll for signatures',
      attempts: 0,
      maxAttempts: finalConfig.maxAttempts,
      timeRemaining: finalConfig.maxAttempts,
      error: null,
      isPolling: false,
      progress: 0
    })
  }, [cleanup, finalConfig.maxAttempts])
  
  return {
    state,
    pollForSignature,
    checkSignatureStatus,
    cancelPolling,
    resetState,
    canStartPolling: !state.isPolling
  }
}

/**
 * Development and Testing Utilities
 * 
 * Helper functions for testing and debugging signature polling functionality.
 */
export const SignaturePollingDevUtils = {
  /**
   * Create a mock signature response for testing
   */
  createMockSignatureResponse(intentId: `0x${string}`): SignatureResponse {
    return {
      signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b' as `0x${string}`,
      intentId,
      isReady: true,
      metadata: {
        signedAt: Date.now(),
        signerAddress: '0x742d35Cc6635C0532925a3b8D73C542C5bf86D4' as `0x${string}`,
        intentHash: `0x${intentId.slice(2).padEnd(64, '0')}` as `0x${string}`
      }
    }
  },
  
  /**
   * Validate signature polling configuration
   */
  validateConfig(config: SignaturePollingConfig): boolean {
    if (config.maxAttempts && config.maxAttempts <= 0) {
      console.warn('⚠️ maxAttempts should be greater than 0')
      return false
    }
    
    if (config.baseInterval && config.baseInterval < 100) {
      console.warn('⚠️ baseInterval should be at least 100ms to avoid overwhelming the backend')
      return false
    }
    
    console.log('✅ Signature polling configuration is valid')
    return true
  }
}
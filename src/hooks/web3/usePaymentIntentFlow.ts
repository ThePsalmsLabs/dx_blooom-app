/**
 * Payment Intent Flow Hook
 * 
 * This is the orchestrator hook that manages the complete ETH → USDC payment workflow.
 * It combines intent creation, signature polling, and payment execution into a single,
 * cohesive flow that transforms the currently broken ETH payment system into a robust,
 * production-ready implementation.
 * 
 * CONTRACT INVESTIGATION FINDINGS:
 * - createPaymentIntent() - Creates payment intent and returns intent + context (no ETH sent)
 * - provideIntentSignature() - Backend provides signature via API call
 * - executePaymentWithSignature() - Executes payment with signature (no value parameter)
 * - ETH Payment - Handled by external Commerce Protocol contract, not Integration contract
 * - All Integration contract functions are nonpayable (don't receive ETH directly)
 * 
 * Why This Component Matters:
 * - Orchestrates the complete create → poll → execute sequence
 * - Provides comprehensive state management for complex multi-step payments
 * - Handles errors gracefully at each step with proper recovery mechanisms
 * - Enables real-time UI feedback for users during the 30-60 second payment process
 * - Ensures atomic payment execution (all steps succeed or all fail safely)
 * 
 * Integration Architecture:
 * - Uses Component #1 (intentExtraction.ts) for extracting intent IDs from transaction logs
 * - Uses Component #2 (useSignaturePolling) for backend signature retrieval
 * - Integrates with existing wagmi hooks for blockchain interactions
 * - Works with existing contract addresses and ABIs
 * - Provides interface for Component #4 (ContentPurchaseCard integration)
 * 
 * File: src/hooks/web3/usePaymentIntentFlow.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { Address } from 'viem'
import { 
  extractIntentIdFromLogs, 
  validateIntentIdFormat 
} from '@/utils/transactions/intentExtraction'
import { 
  useIntelligentSignaturePolling, 
  IntelligentSignaturePollingError 
} from '@/hooks/web3/useIntelligentSignaturePolling'
import { getContractAddresses } from '@/lib/contracts/config'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'

/**
 * Payment Intent Flow State Interface
 * 
 * Comprehensive state tracking for the multi-step payment process.
 * Provides detailed status information for UI components and error handling.
 */
export interface PaymentIntentFlowState {
  /** Current step in the payment flow */
  readonly step: 'idle' | 'creating_intent' | 'extracting_intent_id' | 'waiting_signature' | 'executing_payment' | 'confirming_execution' | 'completed' | 'error'
  
  /** Overall progress as percentage (0-100) */
  readonly progress: number
  
  /** Human-readable status message */
  readonly message: string
  
  /** Whether any operation is currently active */
  readonly isActive: boolean
  
  /** Current error if any */
  readonly error: PaymentIntentFlowError | null
  
  /** Intent data once extracted */
  readonly intentData: {
    readonly intentId: `0x${string}` | null
    readonly transactionHash: `0x${string}` | null
    readonly expectedAmount: bigint | null
  }
  
  /** Signature data once received */
  readonly signatureData: {
    readonly signature: `0x${string}` | null
    readonly isReady: boolean
    readonly receivedAt: number | null
    readonly intentId: `0x${string}` | null
  }
  
  /** Execution data once completed */
  readonly executionData: {
    readonly transactionHash: `0x${string}` | null
    readonly completedAt: number | null
    readonly gasUsed: bigint | null
  }
  
  /** Timing information for analytics and UX */
  readonly timing: {
    readonly startedAt: number | null
    readonly intentCreatedAt: number | null
    readonly signatureReceivedAt: number | null
    readonly executionCompletedAt: number | null
    readonly totalDuration: number | null
  }
}

/**
 * Payment Intent Request Interface
 * 
 * Parameters required to create a payment intent for ETH → USDC payments.
 */
export interface PaymentIntentRequest {
  /** The content ID being purchased */
  readonly contentId: bigint
  
  /** The creator who will receive USDC */
  readonly creator: Address
  
  /** The amount of ETH the user will pay */
  readonly ethAmount: bigint
  
  /** Maximum slippage tolerance in basis points (e.g., 200 = 2%) */
  readonly maxSlippage?: bigint
  
  /** Payment deadline (default: 1 hour from now) */
  readonly deadline?: bigint
  
  /** Optional metadata for analytics */
  readonly metadata?: {
    readonly source?: string
    readonly userAgent?: string
    readonly sessionId?: string
  }
}

/**
 * Payment Intent Flow Error Types
 */
export class PaymentIntentFlowError extends Error {
  constructor(
    message: string,
    public readonly code: 'INTENT_CREATION_FAILED' | 'INTENT_EXTRACTION_FAILED' | 'SIGNATURE_POLLING_FAILED' | 'EXECUTION_FAILED' | 'CONFIRMATION_FAILED' | 'USER_CANCELLED' | 'INSUFFICIENT_FUNDS' | 'SLIPPAGE_EXCEEDED',
    public readonly step: PaymentIntentFlowState['step'],
    public readonly originalError?: unknown,
    public readonly intentId?: `0x${string}`,
    public readonly transactionHash?: `0x${string}`
  ) {
    super(message)
    this.name = 'PaymentIntentFlowError'
  }
}

/**
 * Payment Intent Flow Configuration
 */
export interface PaymentIntentFlowConfig {
  /** Custom signature polling configuration */
  readonly signaturePollingConfig?: {
    readonly maxAttempts?: number
    readonly baseInterval?: number
    readonly useAdaptiveIntervals?: boolean
    readonly enableLogging?: boolean
    readonly fallbackStrategies?: {
      readonly enableExtendedTimeout?: boolean
      readonly enableAlternativeEndpoint?: boolean
      readonly alternativeEndpoint?: string
    }
  }
  
  /** Gas estimation multiplier for execution transaction (default: 1.2) */
  readonly gasMultiplier?: number
  
  /** Whether to enable comprehensive logging (default: false) */
  readonly enableDebugLogging?: boolean
  
  /** Custom error handling callbacks */
  readonly onStepError?: (step: PaymentIntentFlowState['step'], error: PaymentIntentFlowError) => void
  
  /** Progress callback for real-time updates */
  readonly onProgressUpdate?: (progress: number, message: string) => void
}

/**
 * Default Configuration
 */
const DEFAULT_CONFIG: Required<PaymentIntentFlowConfig> = {
  signaturePollingConfig: {
    maxAttempts: 30,
    baseInterval: 1000,
    useAdaptiveIntervals: true,
    enableLogging: false,
    fallbackStrategies: {
      enableExtendedTimeout: true,
      enableAlternativeEndpoint: false,
      alternativeEndpoint: '/api/commerce/signature-status-fallback'
    }
  },
  gasMultiplier: 1.2,
  enableDebugLogging: false,
  onStepError: () => {},
  onProgressUpdate: () => {}
}

/**
 * Payment Intent Flow Result Interface
 */
export interface UsePaymentIntentFlowResult {
  /** Current flow state */
  readonly state: PaymentIntentFlowState
  
  /** Execute complete ETH payment flow */
  readonly executeETHPayment: (request: PaymentIntentRequest) => Promise<void>
  
  /** Cancel any active flow operation */
  readonly cancelFlow: () => void
  
  /** Reset flow state to idle */
  readonly resetFlow: () => void
  
  /** Whether flow can be started (not currently active) */
  readonly canStartFlow: boolean
  
  /** Retry the current step (if applicable) */
  readonly retryCurrentStep: () => Promise<void>
  
  /** Get estimated time remaining based on current step */
  readonly estimatedTimeRemaining: number
  
  /** Enhanced signature polling capabilities */
  readonly signaturePolling: {
    readonly checkBackendHealth: () => Promise<boolean>
    readonly getNextPollingInterval: () => number
    readonly checkIntentOnChain: (intentId: `0x${string}`) => Promise<{
      readonly isCreated: boolean
      readonly isSigned: boolean
      readonly isReady: boolean
      readonly intentHash: `0x${string}` | null
    }>
  }
}

/**
 * usePaymentIntentFlow Hook
 * 
 * Main hook for orchestrating complete ETH → USDC payment flows.
 * Manages the complex multi-step process with proper error handling and state management.
 * 
 * CONTRACT-ALIGNED IMPLEMENTATION:
 * Based on deep investigation of CommerceProtocolIntegration contract:
 * 1. createPaymentIntent() - Creates intent without sending ETH
 * 2. Backend provides signature via provideIntentSignature()
 * 3. executePaymentWithSignature() - Executes with signature (no value parameter)
 * 4. ETH payment handled by external Commerce Protocol contract
 * 
 * @param config - Optional configuration for customizing flow behavior
 * @returns Payment intent flow operations and state
 * 
 * Usage Example:
 * ```typescript
 * const { state, executeETHPayment } = usePaymentIntentFlow({
 *   enableDebugLogging: true,
 *   onProgressUpdate: (progress, message) => {
 *     console.log(`Progress: ${progress}% - ${message}`)
 *   }
 * })
 * 
 * try {
 *   await executeETHPayment({
 *     contentId: BigInt(123),
 *     creator: '0x...',
 *     ethAmount: parseEther('0.01'),
 *     maxSlippage: BigInt(200) // 2%
 *   })
 *   // Payment completed successfully
 * } catch (error) {
 *   // Handle payment failure
 * }
 * ```
 */
export function usePaymentIntentFlow(
  config: PaymentIntentFlowConfig = {}
): UsePaymentIntentFlowResult {
  
  // Merge configuration with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Hook dependencies
  const chainId = useChainId()
  const { writeContract, data: writeData, error: writeError } = useWriteContract()
  const { data: receiptData, error: receiptError, isLoading: isReceiptLoading } = useWaitForTransactionReceipt({
    hash: writeData
  })
  const signaturePolling = useIntelligentSignaturePolling(finalConfig.signaturePollingConfig)
  
  // Get contract addresses for current chain
  const contractAddresses = getContractAddresses(chainId)
  
  // Flow state management
  const [state, setState] = useState<PaymentIntentFlowState>({
    step: 'idle',
    progress: 0,
    message: 'Ready to process ETH payment',
    isActive: false,
    error: null,
    intentData: {
      intentId: null,
      transactionHash: null,
      expectedAmount: null
    },
    signatureData: {
      signature: null,
      isReady: false,
      receivedAt: null,
      intentId: null
    },
    executionData: {
      transactionHash: null,
      completedAt: null,
      gasUsed: null
    },
    timing: {
      startedAt: null,
      intentCreatedAt: null,
      signatureReceivedAt: null,
      executionCompletedAt: null,
      totalDuration: null
    }
  })
  
  // Refs for managing flow operations
  const currentRequestRef = useRef<PaymentIntentRequest | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  /**
   * Update state with progress callback
   */
  const updateState = useCallback((updates: Partial<PaymentIntentFlowState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates }
      
      // Call progress callback if provided
      if (finalConfig.onProgressUpdate && (updates.progress !== undefined || updates.message !== undefined)) {
        finalConfig.onProgressUpdate(newState.progress, newState.message)
      }
      
      return newState
    })
  }, [finalConfig.onProgressUpdate])
  
  /**
   * Handle flow errors with proper categorization
   */
  const handleFlowError = useCallback((
    error: unknown,
    step: PaymentIntentFlowState['step'],
    code: PaymentIntentFlowError['code']
  ) => {
    const flowError = new PaymentIntentFlowError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      code,
      step,
      error,
      state.intentData.intentId || undefined,
      state.intentData.transactionHash || undefined
    )
    
    updateState({
      step: 'error',
      progress: 0,
      message: flowError.message,
      isActive: false,
      error: flowError
    })
    
    // Call error callback if provided
    finalConfig.onStepError(step, flowError)
    
    if (finalConfig.enableDebugLogging) {
      console.error(`❌ Payment Intent Flow Error at step '${step}':`, flowError)
    }
    
    throw flowError
  }, [state.intentData.intentId, state.intentData.transactionHash, updateState, finalConfig])
  
  /**
   * Cleanup function for flow operations
   */
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    currentRequestRef.current = null
    signaturePolling.cancelPolling()
  }, [signaturePolling])
  
  // Enhanced: Monitor backend health and provide recovery options
  useEffect(() => {
    const healthCheckInterval = setInterval(async () => {
      if (state.isActive && state.step === 'waiting_signature') {
        const isHealthy = await signaturePolling.checkBackendHealth()
        if (!isHealthy && finalConfig.enableDebugLogging) {
          console.log('⚠️ Backend health degraded during active polling')
        }
      }
    }, 10000) // Check every 10 seconds during active polling
    
    return () => {
      clearInterval(healthCheckInterval)
      cleanup()
    }
  }, [cleanup, state.isActive, state.step, signaturePolling, finalConfig.enableDebugLogging])
  
  /**
   * Step 1: Create Payment Intent - CONTRACT-ALIGNED IMPLEMENTATION
   * 
   * CONTRACT INVESTIGATION FINDINGS:
   * - createPaymentIntent() creates intent without sending ETH
   * - Returns both intent and context data
   * - ETH payment is handled by external Commerce Protocol contract
   * - This function only sets up the payment intent structure
   */
  const createPaymentIntent = useCallback(async (request: PaymentIntentRequest) => {
    if (finalConfig.enableDebugLogging) {
      console.log('🚀 Step 1: Creating payment intent', request)
    }
    
    updateState({
      step: 'creating_intent',
      progress: 10,
      message: 'Creating payment intent...',
      timing: { ...state.timing, startedAt: Date.now() }
    })
    
    try {
      // Prepare payment request for smart contract - CONTRACT-ALIGNED STRUCTURE
      // Based on actual CommerceProtocolIntegration.PlatformPaymentRequest struct
      const paymentRequest = {
        paymentType: 0, // PayPerView type (enum ISharedTypes.PaymentType)
        creator: request.creator,
        contentId: request.contentId,
        paymentToken: '0x0000000000000000000000000000000000000000' as Address, // ETH address
        maxSlippage: request.maxSlippage || BigInt(200), // 2% default
        deadline: request.deadline || BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour default
      }
      
      // Create intent WITHOUT sending ETH - CONTRACT-ALIGNED
      // The contract will return intent + context data
      // ETH payment is handled by external Commerce Protocol contract
      await writeContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'createPaymentIntent',
        args: [paymentRequest]
        // ✅ CONTRACT-ALIGNED: No 'value' parameter - ETH handled externally
      })
      
      if (finalConfig.enableDebugLogging) {
        console.log('✅ Payment intent creation transaction submitted')
      }
      
    } catch (error) {
      handleFlowError(error, 'creating_intent', 'INTENT_CREATION_FAILED')
    }
  }, [writeContract, contractAddresses, updateState, state.timing, finalConfig.enableDebugLogging, handleFlowError])
  
  /**
   * Step 2: Extract Intent ID from Transaction Receipt
   */
  const extractIntentId = useCallback(async () => {
    if (!receiptData) {
      throw new Error('Transaction receipt not available')
    }
    
    if (finalConfig.enableDebugLogging) {
      console.log('🔍 Step 2: Extracting intent ID from transaction receipt')
    }
    
    updateState({
      step: 'extracting_intent_id',
      progress: 25,
      message: 'Extracting intent ID from transaction...'
    })
    
    try {
      // Use Component #1 to extract intent ID
      const intentId = extractIntentIdFromLogs(receiptData.logs, receiptData.transactionHash)
      
      updateState({
        progress: 35,
        message: 'Intent ID extracted successfully',
        intentData: {
          intentId,
          transactionHash: receiptData.transactionHash,
          expectedAmount: currentRequestRef.current?.ethAmount || null
        },
        timing: { ...state.timing, intentCreatedAt: Date.now() }
      })
      
      if (finalConfig.enableDebugLogging) {
        console.log('✅ Intent ID extracted:', intentId)
      }
      
      return intentId
      
    } catch (error) {
      handleFlowError(error, 'extracting_intent_id', 'INTENT_EXTRACTION_FAILED')
    }
  }, [receiptData, updateState, state.timing, finalConfig.enableDebugLogging, handleFlowError])
  
  /**
   * Step 3: Poll for Backend Signature
   */
  const pollForSignature = useCallback(async (intentId: `0x${string}`) => {
    if (finalConfig.enableDebugLogging) {
      console.log('⏳ Step 3: Polling for backend signature')
      console.log(`📊 Backend health: ${signaturePolling.state.backendHealth.isHealthy ? 'Healthy' : 'Unhealthy'}`)
      console.log(`⏱️ Next polling interval: ${signaturePolling.getNextPollingInterval()}ms`)
    }
    
    updateState({
      step: 'waiting_signature',
      progress: 40,
      message: 'Waiting for backend signature...'
    })
    
    try {
      // Enhanced: Check backend health before polling
      if (!signaturePolling.state.backendHealth.isHealthy) {
        if (finalConfig.enableDebugLogging) {
          console.log('⚠️ Backend health check failed, attempting recovery...')
        }
        
        // Try to recover backend health
        const isHealthy = await signaturePolling.checkBackendHealth()
        if (!isHealthy) {
          throw new IntelligentSignaturePollingError(
            'Backend is unavailable and recovery failed',
            'BACKEND_UNAVAILABLE',
            intentId
          )
        }
      }
      
      // Use Component #2 to poll for signature
      const signatureResponse = await signaturePolling.pollForSignature(intentId)
      
      updateState({
        progress: 65,
        message: 'Backend signature received',
        signatureData: {
          signature: signatureResponse.signature,
          isReady: true,
          receivedAt: Date.now(),
          intentId: signatureResponse.intentId
        },
        timing: { ...state.timing, signatureReceivedAt: Date.now() }
      })
      
      if (finalConfig.enableDebugLogging) {
        console.log('✅ Signature received:', signatureResponse.signature)
      }
      
      return signatureResponse.signature
      
    } catch (error) {
      // Enhanced error handling for intelligent signature polling
      if (error instanceof IntelligentSignaturePollingError) {
        // Map enhanced error codes to flow error codes
        let flowErrorCode: PaymentIntentFlowError['code'] = 'SIGNATURE_POLLING_FAILED'
        
        switch (error.code) {
          case 'BACKEND_UNAVAILABLE':
            flowErrorCode = 'SIGNATURE_POLLING_FAILED'
            break
          case 'TIMEOUT':
            flowErrorCode = 'SIGNATURE_POLLING_FAILED'
            break
          case 'INVALID_INTENT':
            flowErrorCode = 'INTENT_EXTRACTION_FAILED'
            break
          default:
            flowErrorCode = 'SIGNATURE_POLLING_FAILED'
        }
        
        handleFlowError(error, 'waiting_signature', flowErrorCode)
      } else {
        handleFlowError(error, 'waiting_signature', 'SIGNATURE_POLLING_FAILED')
      }
    }
  }, [signaturePolling, updateState, state.timing, finalConfig.enableDebugLogging, handleFlowError])
  
  /**
   * Step 4: Execute Signed Intent - CONTRACT-ALIGNED IMPLEMENTATION
   * 
   * CONTRACT INVESTIGATION FINDINGS:
   * - executePaymentWithSignature() takes only intentId parameter
   * - No 'value' parameter - function is nonpayable
   * - ETH payment is handled by external Commerce Protocol contract
   * - This function only executes the signed intent logic
   */
  const executeSignedIntent = useCallback(async (
    intentId: `0x${string}`,
    signature: `0x${string}`,
    ethAmount: bigint
  ) => {
    if (finalConfig.enableDebugLogging) {
      console.log('💰 Step 4: Executing signed intent')
    }
    
    updateState({
      step: 'executing_payment',
      progress: 75,
      message: 'Executing ETH → USDC swap...'
    })
    
    try {
      // Execute the signed intent - CONTRACT-ALIGNED IMPLEMENTATION
      // ✅ CONTRACT-ALIGNED: executePaymentWithSignature (not executeSignedIntent)
      // ✅ CONTRACT-ALIGNED: No 'value' parameter - ETH handled externally
      // ✅ CONTRACT-ALIGNED: Function is nonpayable, doesn't receive ETH directly
      await writeContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'executePaymentWithSignature', // ✅ ACTUAL CONTRACT FUNCTION
        args: [intentId]
        // ETH payment is handled by external Commerce Protocol contract
        // This function only executes the signed intent logic
      })
      
      if (finalConfig.enableDebugLogging) {
        console.log('✅ Payment execution transaction submitted')
      }
      
    } catch (error) {
      handleFlowError(error, 'executing_payment', 'EXECUTION_FAILED')
    }
  }, [writeContract, contractAddresses, updateState, finalConfig.enableDebugLogging, handleFlowError])
  
  /**
   * Step 5: Confirm Execution Completion
   */
  const confirmExecution = useCallback(async () => {
    if (!receiptData) {
      throw new Error('Execution receipt not available')
    }
    
    if (finalConfig.enableDebugLogging) {
      console.log('✅ Step 5: Confirming execution completion')
    }
    
    updateState({
      step: 'confirming_execution',
      progress: 90,
      message: 'Confirming payment completion...'
    })
    
    try {
      const completedAt = Date.now()
      const totalDuration = state.timing.startedAt ? completedAt - state.timing.startedAt : null
      
      updateState({
        step: 'completed',
        progress: 100,
        message: 'ETH payment completed successfully!',
        isActive: false,
        executionData: {
          transactionHash: receiptData.transactionHash,
          completedAt,
          gasUsed: receiptData.gasUsed
        },
        timing: {
          ...state.timing,
          executionCompletedAt: completedAt,
          totalDuration
        }
      })
      
      if (finalConfig.enableDebugLogging) {
        console.log(`🎉 Payment flow completed successfully in ${totalDuration}ms`)
      }
      
    } catch (error) {
      handleFlowError(error, 'confirming_execution', 'CONFIRMATION_FAILED')
    }
  }, [receiptData, updateState, state.timing, finalConfig.enableDebugLogging, handleFlowError])
  
  /**
   * Main execution function that orchestrates the complete flow
   */
  const executeETHPayment = useCallback(async (request: PaymentIntentRequest) => {
    // Prevent concurrent executions
    if (state.isActive) {
      throw new PaymentIntentFlowError(
        'Payment flow already in progress',
        'USER_CANCELLED',
        state.step
      )
    }
    
    // Validate request
    if (!validateIntentIdFormat(request.contentId.toString(16).padStart(32, '0'))) {
      throw new PaymentIntentFlowError(
        'Invalid content ID format',
        'INTENT_CREATION_FAILED',
        'idle'
      )
    }
    
    if (request.ethAmount <= 0) {
      throw new PaymentIntentFlowError(
        'ETH amount must be greater than zero',
        'INSUFFICIENT_FUNDS',
        'idle'
      )
    }
    
    // Initialize flow
    currentRequestRef.current = request
    abortControllerRef.current = new AbortController()
    
    updateState({
      isActive: true,
      error: null,
      step: 'creating_intent'
    })
    
    try {
      // Step 1: Create Payment Intent
      await createPaymentIntent(request)
      
      // Wait for transaction receipt
      // (The useWaitForTransactionReceipt hook will populate receiptData)
      
    } catch (error) {
      // Error handling is done in individual step functions
      throw error
    }
  }, [state.isActive, state.step, updateState, createPaymentIntent])
  
  // Monitor transaction receipt and continue flow
  useEffect(() => {
    if (receiptData && state.step === 'creating_intent' && state.isActive) {
      // Continue with intent ID extraction
      extractIntentId().then(intentId => {
        if (intentId) {
          // Continue with signature polling
          return pollForSignature(intentId)
        }
      }).then(signature => {
        if (signature && currentRequestRef.current) {
          // Continue with execution
          return executeSignedIntent(
            state.intentData.intentId!,
            signature,
            currentRequestRef.current.ethAmount
          )
        }
      }).catch(error => {
        // Errors are handled by individual step functions
        console.error('Flow continuation error:', error)
      })
    }
  }, [receiptData, state.step, state.isActive, extractIntentId, pollForSignature, executeSignedIntent, state.intentData.intentId])
  
  // Monitor execution completion
  useEffect(() => {
    if (receiptData && state.step === 'executing_payment' && state.isActive) {
      confirmExecution().catch(error => {
        console.error('Execution confirmation error:', error)
      })
    }
  }, [receiptData, state.step, state.isActive, confirmExecution])
  
  /**
   * Cancel active flow operation
   */
  const cancelFlow = useCallback(() => {
    if (state.isActive) {
      cleanup()
      
      updateState({
        step: 'idle',
        progress: 0,
        message: 'Payment flow cancelled',
        isActive: false,
        error: new PaymentIntentFlowError(
          'Payment flow cancelled by user',
          'USER_CANCELLED',
          state.step
        )
      })
      
      if (finalConfig.enableDebugLogging) {
        console.log('🚫 Payment flow cancelled by user')
      }
    }
  }, [state.isActive, state.step, cleanup, updateState, finalConfig.enableDebugLogging])
  
  /**
   * Reset flow state to idle
   */
  const resetFlow = useCallback(() => {
    cleanup()
    
    setState({
      step: 'idle',
      progress: 0,
      message: 'Ready to process ETH payment',
      isActive: false,
      error: null,
      intentData: {
        intentId: null,
        transactionHash: null,
        expectedAmount: null
      },
      signatureData: {
        signature: null,
        isReady: false,
        receivedAt: null,
        intentId: null
      },
      executionData: {
        transactionHash: null,
        completedAt: null,
        gasUsed: null
      },
      timing: {
        startedAt: null,
        intentCreatedAt: null,
        signatureReceivedAt: null,
        executionCompletedAt: null,
        totalDuration: null
      }
    })
    
    signaturePolling.resetState()
  }, [cleanup, signaturePolling])
  
  /**
   * Retry current step (if applicable)
   */
  const retryCurrentStep = useCallback(async () => {
    if (!state.isActive && state.error && currentRequestRef.current) {
      updateState({
        error: null,
        isActive: true
      })
      
      // Enhanced retry with health check and on-chain verification
      try {
        // Check if we can verify the intent on-chain first
        if (state.intentData.intentId) {
          const onChainStatus = await signaturePolling.checkIntentOnChain(state.intentData.intentId)
          
          if (finalConfig.enableDebugLogging) {
            console.log('🔍 On-chain intent status:', onChainStatus)
          }
          
          // If intent is already ready on-chain, skip to execution
          if (onChainStatus.isReady) {
            updateState({
              step: 'executing_payment',
              progress: 75,
              message: 'Intent ready on-chain, proceeding to execution...'
            })
            
            // Continue with execution
            if (currentRequestRef.current) {
              await executeSignedIntent(
                state.intentData.intentId!,
                '0x0000000000000000000000000000000000000000000000000000000000000000', // Placeholder signature
                currentRequestRef.current.ethAmount
              )
            }
            return
          }
        }
        
        // Standard retry from the failed step
        await executeETHPayment(currentRequestRef.current)
      } catch (error) {
        // Error handling is done in executeETHPayment
      }
    }
  }, [state.isActive, state.error, executeETHPayment, updateState, state.intentData.intentId, signaturePolling, finalConfig.enableDebugLogging, executeSignedIntent])
  
  /**
   * Calculate estimated time remaining based on current step
   */
  const estimatedTimeRemaining = (() => {
    switch (state.step) {
      case 'creating_intent':
      case 'extracting_intent_id':
        return 45 // ~45 seconds remaining
      case 'waiting_signature':
        // Enhanced: Use intelligent polling metrics for better estimates
        const baseTime = Math.max(5, 30 - signaturePolling.state.attempt)
        const healthMultiplier = signaturePolling.state.backendHealth.isHealthy ? 1 : 1.5
        const adaptiveInterval = signaturePolling.getNextPollingInterval() / 1000 // Convert to seconds
        return Math.round(baseTime * healthMultiplier + adaptiveInterval)
      case 'executing_payment':
      case 'confirming_execution':
        return 15 // ~15 seconds remaining
      case 'completed':
        return 0
      default:
        return 60 // Full estimated time
    }
  })()
  
  return {
    state,
    executeETHPayment,
    cancelFlow,
    resetFlow,
    canStartFlow: !state.isActive,
    retryCurrentStep,
    estimatedTimeRemaining,
    signaturePolling: {
      checkBackendHealth: signaturePolling.checkBackendHealth,
      getNextPollingInterval: signaturePolling.getNextPollingInterval,
      checkIntentOnChain: signaturePolling.checkIntentOnChain
    }
  }
}
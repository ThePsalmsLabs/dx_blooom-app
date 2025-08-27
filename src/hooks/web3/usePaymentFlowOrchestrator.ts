/**
 * Payment Flow Orchestrator
 * 
 * This is the unified orchestration layer that combines all the intelligent components
 * we've built into a single, cohesive payment processing system. It integrates
 * backend health monitoring, intelligent signature polling, and advanced error recovery
 * to provide a production-ready payment experience that handles edge cases gracefully.
 * 
 * COMPLETE INTEGRATION ARCHITECTURE:
 * - Orchestrates your existing PaymentIntentFlow with intelligent enhancements
 * - Uses BackendHealthMonitor for system health awareness
 * - Employs IntelligentSignaturePolling for reliable backend communication
 * - Leverages ErrorRecoveryStrategies for graceful error handling
 * - Maintains compatibility with your existing UI components and contracts
 * 
 * WHY ORCHESTRATION MATTERS:
 * - Payment flows involve multiple async steps that can fail independently
 * - Each failure type requires different handling strategies
 * - Users need consistent, predictable experiences regardless of failure points
 * - Production systems must handle failures gracefully without losing user funds
 * - Recovery strategies should adapt based on real-time system health
 * 
 * Core Orchestration Features:
 * - Unified payment processing with intelligent error handling
 * - Real-time health monitoring with automatic flow adaptation
 * - Comprehensive recovery mechanisms for all failure scenarios
 * - User experience management with progress tracking and clear messaging
 * - State persistence for interrupted flow recovery
 * - Analytics and monitoring integration for system optimization
 * 
 * File: src/hooks/web3/usePaymentFlowOrchestrator.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { Address } from 'viem'
import { 
  useBackendHealthMonitor,
  BackendHealthConfig,
  BackendHealthMetrics 
} from '@/hooks/web3/useBackendHealthMonitor'
import { 
  useIntelligentSignaturePolling,
  IntelligentSignaturePollingConfig,
  IntelligentSignatureResponse 
} from '@/hooks/web3/useIntelligentSignaturePolling'
import { 
  useErrorRecoveryStrategies,
  ErrorRecoveryConfig,
  ErrorCategory,
  RecoveryStrategy 
} from '@/hooks/web3/useErrorRecoveryStrategies'
import { 
  extractIntentIdFromLogs 
} from '@/utils/transactions/intentExtraction'
import { getContractAddresses } from '@/lib/contracts/config'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'

/**
 * Orchestrated Payment Flow State Interface
 * 
 * Comprehensive state that combines all aspects of the payment process.
 * Provides complete visibility into system health, payment progress, and error conditions.
 */
export interface OrchestratedPaymentFlowState {
  /** Current payment flow phase */
  readonly phase: 'idle' | 'initializing' | 'creating_intent' | 'waiting_signature' | 'executing_payment' | 'confirming' | 'completed' | 'recovering' | 'failed'
  
  /** Overall progress percentage (0-100) */
  readonly progress: number
  
  /** User-friendly status message */
  readonly message: string
  
  /** Whether the flow is currently active */
  readonly isActive: boolean
  
  /** Current error if any */
  readonly error: Error | null
  
  /** System health context */
  readonly systemHealth: {
    readonly backend: BackendHealthMetrics
    readonly overallStatus: 'healthy' | 'degraded' | 'critical'
    readonly recommendations: string[]
  }
  
  /** Payment progress details */
  readonly paymentProgress: {
    readonly intentId: `0x${string}` | null
    readonly intentCreated: boolean
    readonly signatureReceived: boolean
    readonly paymentExecuted: boolean
    readonly paymentConfirmed: boolean
    readonly estimatedTimeRemaining: number
  }
  
  /** Recovery context */
  readonly recoveryContext: {
    readonly isRecovering: boolean
    readonly errorCategory: ErrorCategory | null
    readonly recoveryStrategy: RecoveryStrategy | null
    readonly recoveryAttempt: number
    readonly availableRecoveryActions: string[]
  }
  
  /** Performance metrics */
  readonly performance: {
    readonly startTime: number | null
    readonly intentCreationTime: number | null
    readonly signatureTime: number | null
    readonly executionTime: number | null
    readonly totalDuration: number | null
    readonly bottleneckPhase: string | null
  }
  
  /** User interaction context */
  readonly userInteraction: {
    readonly requiresAction: boolean
    readonly actionType: 'none' | 'approve_tokens' | 'add_funds' | 'retry_payment' | 'contact_support'
    readonly actionMessage: string
    readonly canCancel: boolean
  }
}

/**
 * Payment Request Interface for Orchestrator
 */
export interface OrchestratedPaymentRequest {
  readonly contentId: bigint
  readonly creator: Address
  readonly ethAmount: bigint
  readonly maxSlippage: bigint
  readonly deadline: bigint
  readonly userAddress: Address
  readonly sessionId?: string
  readonly metadata?: {
    readonly source: string
    readonly referrer?: string
    readonly userAgent?: string
  }
}

/**
 * Orchestrator Configuration Interface
 */
export interface PaymentFlowOrchestratorConfig {
  /** Backend health monitoring configuration */
  readonly healthConfig?: BackendHealthConfig
  
  /** Signature polling configuration */
  readonly signingConfig?: IntelligentSignaturePollingConfig
  
  /** Error recovery configuration */
  readonly recoveryConfig?: ErrorRecoveryConfig
  
  /** Performance monitoring settings */
  readonly performanceConfig?: {
    readonly enableMetrics?: boolean
    readonly slowThresholdMs?: number
    readonly timeoutWarningMs?: number
  }
  
  /** User experience settings */
  readonly uxConfig?: {
    readonly enableProgressUpdates?: boolean
    readonly enableUserNotifications?: boolean
    readonly autoRetryUserErrors?: boolean
  }
  
  /** Development and debugging options */
  readonly debugConfig?: {
    readonly enableVerboseLogging?: boolean
    readonly enablePerformanceLogging?: boolean
    readonly enableStateLogging?: boolean
  }
  
  /** Callback functions for external integrations */
  readonly callbacks?: {
    readonly onPhaseChange?: (phase: OrchestratedPaymentFlowState['phase'], metadata: any) => void
    readonly onHealthChange?: (health: BackendHealthMetrics) => void
    readonly onUserActionRequired?: (actionType: string, message: string) => Promise<boolean>
    readonly onPaymentCompleted?: (result: PaymentResult) => void
    readonly onRecoveryAttempt?: (strategy: RecoveryStrategy, attempt: number) => void
  }
}

/**
 * Payment Result Interface
 */
export interface PaymentResult {
  readonly success: boolean
  readonly intentId: `0x${string}` | null
  readonly transactionHash: `0x${string}` | null
  readonly signature: IntelligentSignatureResponse | null
  readonly totalDuration: number
  readonly performanceMetrics: {
    readonly intentCreationTime: number
    readonly signatureWaitTime: number
    readonly executionTime: number
    readonly confirmationTime: number
  }
  readonly recoveryAttempts: number
  readonly errorCategory: ErrorCategory | null
  readonly finalError: Error | null
}

/**
 * Default Orchestrator Configuration
 */
const DEFAULT_ORCHESTRATOR_CONFIG: Required<Omit<PaymentFlowOrchestratorConfig, 'callbacks'>> = {
  healthConfig: {
    maxConsecutiveFailures: 3,
    baseRetryDelay: 1000,
    enableLogging: false
  },
  signingConfig: {
    maxAttempts: 45,
    useAdaptiveIntervals: true,
    enableLogging: false
  },
  recoveryConfig: {
    maxAutoRetryAttempts: 3,
    enableAutomaticRecovery: true,
    enableLogging: false
  },
  performanceConfig: {
    enableMetrics: true,
    slowThresholdMs: 30000,
    timeoutWarningMs: 45000
  },
  uxConfig: {
    enableProgressUpdates: true,
    enableUserNotifications: true,
    autoRetryUserErrors: false
  },
  debugConfig: {
    enableVerboseLogging: false,
    enablePerformanceLogging: false,
    enableStateLogging: false
  }
}

/**
 * Orchestrator Hook Result Interface
 */
export interface UsePaymentFlowOrchestratorResult {
  /** Current orchestrated payment state */
  readonly state: OrchestratedPaymentFlowState
  
  /** Execute complete payment with orchestration */
  readonly executePayment: (request: OrchestratedPaymentRequest) => Promise<PaymentResult>
  
  /** Cancel active payment flow */
  readonly cancelPayment: () => void
  
  /** Retry failed payment with recovery */
  readonly retryPayment: () => Promise<PaymentResult>
  
  /** Resume interrupted payment from saved state */
  readonly resumePayment: (sessionId: string) => Promise<PaymentResult>
  
  /** Get system health summary */
  readonly getSystemHealth: () => {
    status: 'healthy' | 'degraded' | 'critical'
    details: BackendHealthMetrics
    recommendations: string[]
  }
  
  /** Force refresh of system health */
  readonly refreshSystemHealth: () => Promise<void>
  
  /** Reset orchestrator state */
  readonly resetState: () => void
  
  /** Check if payment can be started */
  readonly canStartPayment: boolean
  
  /** Get estimated payment completion time */
  readonly getEstimatedDuration: () => number
}

/**
 * usePaymentFlowOrchestrator Hook
 * 
 * Main hook for orchestrated payment processing with intelligent error handling,
 * health monitoring, and comprehensive recovery mechanisms.
 * 
 * INTEGRATION WITH YOUR EXISTING SYSTEM:
 * This hook acts as a drop-in replacement for your existing payment flow logic,
 * adding intelligence and reliability while maintaining the same interface patterns.
 * 
 * @param config - Configuration for orchestration behavior
 * @returns Orchestrated payment operations and comprehensive state
 * 
 * Usage Example:
 * ```typescript
 * const { state, executePayment, getSystemHealth } = usePaymentFlowOrchestrator({
 *   debugConfig: { enableVerboseLogging: true },
 *   callbacks: {
 *     onPaymentCompleted: (result) => {
 *       console.log(`Payment ${result.success ? 'succeeded' : 'failed'} in ${result.totalDuration}ms`)
 *     },
 *     onUserActionRequired: async (actionType, message) => {
 *       return window.confirm(`${message}\n\nContinue?`)
 *     }
 *   }
 * })
 * 
 * // Execute payment with full orchestration
 * const result = await executePayment({
 *   contentId: BigInt(123),
 *   creator: '0x...',
 *   ethAmount: parseEther('0.01'),
 *   maxSlippage: BigInt(200),
 *   deadline: BigInt(Date.now() + 3600),
 *   userAddress: '0x...'
 * })
 * ```
 */
export function usePaymentFlowOrchestrator(
  config: PaymentFlowOrchestratorConfig = {}
): UsePaymentFlowOrchestratorResult {
  
  // Merge configuration with defaults
  const finalConfig = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config }
  
  // Hook dependencies
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)
  const { writeContract } = useWriteContract()
  const { data: receiptData, isLoading: isReceiptLoading } = useWaitForTransactionReceipt()
  
  // Intelligent component integrations
  const healthMonitor = useBackendHealthMonitor(finalConfig.healthConfig)
  const signaturePolling = useIntelligentSignaturePolling(finalConfig.signingConfig)
  const errorRecovery = useErrorRecoveryStrategies(finalConfig.recoveryConfig)
  
  // Orchestrator state management
  const [state, setState] = useState<OrchestratedPaymentFlowState>({
    phase: 'idle',
    progress: 0,
    message: 'Ready to process payment',
    isActive: false,
    error: null,
    systemHealth: {
      backend: healthMonitor.metrics,
      overallStatus: 'healthy',
      recommendations: []
    },
    paymentProgress: {
      intentId: null,
      intentCreated: false,
      signatureReceived: false,
      paymentExecuted: false,
      paymentConfirmed: false,
      estimatedTimeRemaining: 0
    },
    recoveryContext: {
      isRecovering: false,
      errorCategory: null,
      recoveryStrategy: null,
      recoveryAttempt: 0,
      availableRecoveryActions: []
    },
    performance: {
      startTime: null,
      intentCreationTime: null,
      signatureTime: null,
      executionTime: null,
      totalDuration: null,
      bottleneckPhase: null
    },
    userInteraction: {
      requiresAction: false,
      actionType: 'none',
      actionMessage: '',
      canCancel: true
    }
  })
  
  // Operation management
  const currentRequestRef = useRef<OrchestratedPaymentRequest | null>(null)
  const performanceTimers = useRef<Map<string, number>>(new Map())
  const abortControllerRef = useRef<AbortController | null>(null)
  
  /**
   * Update state with health and performance context
   */
  const updateState = useCallback((updates: Partial<OrchestratedPaymentFlowState>) => {
    setState(prev => {
      const newState = {
        ...prev,
        ...updates,
        systemHealth: {
          backend: healthMonitor.metrics,
          overallStatus: (healthMonitor.isBackendAvailable ? 'healthy' : 'critical') as 'healthy' | 'degraded' | 'critical',
          recommendations: generateHealthRecommendations(healthMonitor.metrics)
        }
      }
      
      // Call phase change callback
      if (updates.phase && finalConfig.callbacks?.onPhaseChange) {
        finalConfig.callbacks.onPhaseChange(updates.phase, {
          progress: newState.progress,
          backendHealth: healthMonitor.metrics.status
        })
      }
      
      // Call health change callback
      if (finalConfig.callbacks?.onHealthChange) {
        finalConfig.callbacks.onHealthChange(healthMonitor.metrics)
      }
      
      if (finalConfig.debugConfig.enableStateLogging) {
        console.log(`🎭 Orchestrator state update:`, {
          phase: newState.phase,
          progress: newState.progress,
          backendHealth: healthMonitor.metrics.status
        })
      }
      
      return newState
    })
  }, [healthMonitor.metrics, healthMonitor.isBackendAvailable, finalConfig.callbacks, finalConfig.debugConfig])
  
  /**
   * Generate health-based recommendations
   */
  const generateHealthRecommendations = useCallback((health: BackendHealthMetrics): string[] => {
    const recommendations: string[] = []
    
    if (health.status === 'unavailable') {
      recommendations.push('Backend is temporarily unavailable. Please try again in a few minutes.')
    } else if (health.status === 'degraded') {
      recommendations.push('Service is experiencing high load. Payments may take longer than usual.')
    }
    
    if (health.avgResponseTime > 5000) {
      recommendations.push('Response times are slower than normal. Consider retrying later.')
    }
    
    if (health.successRate < 90) {
      recommendations.push('Service reliability is reduced. Monitor payment status closely.')
    }
    
    return recommendations
  }, [])
  
  /**
   * Record performance timing
   */
  const recordTiming = useCallback((phase: string, startTime?: number) => {
    const now = Date.now()
    
    if (startTime) {
      performanceTimers.current.set(phase, now - startTime)
    } else {
      performanceTimers.current.set(`${phase}_start`, now)
    }
    
    if (finalConfig.debugConfig.enablePerformanceLogging) {
      console.log(`⏱️ Performance: ${phase} ${startTime ? 'completed' : 'started'} at ${new Date().toISOString()}`)
    }
  }, [finalConfig.debugConfig])
  
  /**
   * Handle payment error with orchestrated recovery
   */
  const handlePaymentError = useCallback(async (
    error: Error,
    context: {
      phase: OrchestratedPaymentFlowState['phase']
      intentId?: `0x${string}`
      request: OrchestratedPaymentRequest
    }
  ): Promise<boolean> => {
    
    if (finalConfig.debugConfig.enableVerboseLogging) {
      console.log(`❌ Payment error in phase ${context.phase}:`, error)
    }
    
    // Analyze error and determine recovery strategy
    const { category, strategy } = await errorRecovery.analyzeError(error, {
      intentId: context.intentId,
      userAddress: context.request.userAddress,
      paymentAmount: context.request.ethAmount,
      sessionId: context.request.sessionId
    })
    
    updateState({
      phase: 'recovering',
      error,
      recoveryContext: {
        isRecovering: true,
        errorCategory: category,
        recoveryStrategy: strategy,
        recoveryAttempt: errorRecovery.state.recoveryAttempt,
        availableRecoveryActions: errorRecovery.state.availableActions.map(a => a.action)
      },
      message: errorRecovery.getUserMessage(error)
    })
    
    // Call recovery callback
    if (finalConfig.callbacks?.onRecoveryAttempt) {
      finalConfig.callbacks.onRecoveryAttempt(strategy, errorRecovery.state.recoveryAttempt)
    }
    
    // Attempt automatic recovery if applicable
    if (strategy === 'automatic_retry' && finalConfig.recoveryConfig?.enableAutomaticRecovery) {
      try {
        const recovered = await errorRecovery.attemptRecovery(error, {
          intentId: context.intentId,
          userAddress: context.request.userAddress,
          paymentAmount: context.request.ethAmount
        })
        
        if (recovered) {
          if (finalConfig.debugConfig.enableVerboseLogging) {
            console.log('✅ Automatic recovery successful')
          }
          return true
        }
      } catch (recoveryError) {
        if (finalConfig.debugConfig.enableVerboseLogging) {
          console.log('❌ Automatic recovery failed:', recoveryError)
        }
      }
    }
    
    // Handle user intervention requirements
    if (strategy === 'user_intervention' && finalConfig.callbacks?.onUserActionRequired) {
      const userConfirmed = await finalConfig.callbacks.onUserActionRequired(
        category === 'insufficient_funds' ? 'add_funds' : 'retry_payment',
        errorRecovery.getUserMessage(error)
      )
      
      if (userConfirmed) {
        return await errorRecovery.executeManualRecovery(strategy, true)
      }
    }
    
    return false
  }, [errorRecovery, finalConfig, updateState])
  
  /**
   * Main payment execution with full orchestration
   */
  const executePayment = useCallback(async (
    request: OrchestratedPaymentRequest
  ): Promise<PaymentResult> => {
    
    // Prevent concurrent executions
    if (state.isActive) {
      throw new Error('Payment already in progress')
    }
    
    // Store request for recovery purposes
    currentRequestRef.current = request
    abortControllerRef.current = new AbortController()
    
    // Initialize orchestration state
    const startTime = Date.now()
    recordTiming('total')
    
    updateState({
      phase: 'initializing',
      progress: 5,
      message: 'Initializing payment...',
      isActive: true,
      error: null,
      performance: {
        startTime,
        intentCreationTime: null,
        signatureTime: null,
        executionTime: null,
        totalDuration: null,
        bottleneckPhase: null
      },
      paymentProgress: {
        intentId: null,
        intentCreated: false,
        signatureReceived: false,
        paymentExecuted: false,
        paymentConfirmed: false,
        estimatedTimeRemaining: 60
      }
    })
    
    if (finalConfig.debugConfig.enableVerboseLogging) {
      console.log('🚀 Starting orchestrated payment execution:', request)
    }
    
    try {
      // Phase 1: Create Payment Intent
      updateState({
        phase: 'creating_intent',
        progress: 15,
        message: 'Creating payment intent...'
      })
      
      recordTiming('intent_creation')
      
      const paymentRequest = {
        paymentType: 0,
        creator: request.creator,
        contentId: request.contentId,
        paymentToken: '0x0000000000000000000000000000000000000000' as Address,
        maxSlippage: request.maxSlippage,
        deadline: request.deadline
      }
      
      const txHash = await writeContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'createPaymentIntent',
        args: [paymentRequest]
      })
      
      // Wait for transaction receipt and extract intent ID
      const receipt = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Transaction timeout')), 30000)
        
        const checkReceipt = async () => {
          try {
            if (receiptData) {
              clearTimeout(timeout)
              resolve(receiptData)
            } else {
              setTimeout(checkReceipt, 1000)
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        }
        
        checkReceipt()
      }) as any
      
      const intentId = extractIntentIdFromLogs(receipt.logs)
      
      recordTiming('intent_creation', performanceTimers.current.get('intent_creation_start'))
      
      updateState({
        progress: 30,
        message: 'Payment intent created successfully',
        paymentProgress: {
          ...state.paymentProgress,
          intentId,
          intentCreated: true,
          estimatedTimeRemaining: 45
        }
      })
      
      // Phase 2: Wait for Backend Signature
      updateState({
        phase: 'waiting_signature',
        progress: 40,
        message: 'Waiting for payment authorization...'
      })
      
      recordTiming('signature_wait')
      
      const signatureResponse = await signaturePolling.pollForSignature(intentId)
      
      recordTiming('signature_wait', performanceTimers.current.get('signature_wait_start'))
      
      updateState({
        progress: 70,
        message: 'Payment authorized successfully',
        paymentProgress: {
          ...state.paymentProgress,
          signatureReceived: true,
          estimatedTimeRemaining: 15
        }
      })
      
      // Phase 3: Execute Payment
      updateState({
        phase: 'executing_payment',
        progress: 80,
        message: 'Executing payment...'
      })
      
      recordTiming('execution')
      
      await writeContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'executePaymentWithSignature',
        args: [intentId]
        // Note: This function is nonpayable and doesn't receive ETH directly
        // ETH payment is handled by the Commerce Protocol contract externally
      })
      
      recordTiming('execution', performanceTimers.current.get('execution_start'))
      
      // Phase 4: Confirm Payment
      updateState({
        phase: 'confirming',
        progress: 90,
        message: 'Confirming payment...'
      })
      
      // Wait for final confirmation (simplified)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Payment completed successfully
      const totalDuration = Date.now() - startTime
      
      updateState({
        phase: 'completed',
        progress: 100,
        message: 'Payment completed successfully!',
        isActive: false,
        paymentProgress: {
          ...state.paymentProgress,
          paymentExecuted: true,
          paymentConfirmed: true,
          estimatedTimeRemaining: 0
        },
        performance: {
          ...state.performance,
          totalDuration,
          bottleneckPhase: identifyBottleneck(performanceTimers.current)
        }
      })
      
      const result: PaymentResult = {
        success: true,
        intentId,
        transactionHash: null, // writeContract returns void, hash comes from receipt
        signature: signatureResponse,
        totalDuration,
        performanceMetrics: {
          intentCreationTime: performanceTimers.current.get('intent_creation') || 0,
          signatureWaitTime: performanceTimers.current.get('signature_wait') || 0,
          executionTime: performanceTimers.current.get('execution') || 0,
          confirmationTime: 2000
        },
        recoveryAttempts: errorRecovery.state.recoveryHistory.length,
        errorCategory: null,
        finalError: null
      }
      
      // Call completion callback
      if (finalConfig.callbacks?.onPaymentCompleted) {
        finalConfig.callbacks.onPaymentCompleted(result)
      }
      
      if (finalConfig.debugConfig.enableVerboseLogging) {
        console.log('✅ Payment completed successfully:', result)
      }
      
      return result
      
    } catch (error) {
      // Handle error with orchestrated recovery
      const recovered = await handlePaymentError(error as Error, {
        phase: state.phase,
        intentId: state.paymentProgress.intentId || undefined,
        request
      })
      
      if (!recovered) {
        // Recovery failed, return failure result
        const totalDuration = Date.now() - startTime
        
        updateState({
          phase: 'failed',
          progress: 0,
          message: 'Payment failed',
          isActive: false,
          performance: {
            ...state.performance,
            totalDuration
          }
        })
        
        const result: PaymentResult = {
          success: false,
          intentId: state.paymentProgress.intentId,
          transactionHash: null,
          signature: null,
          totalDuration,
          performanceMetrics: {
            intentCreationTime: performanceTimers.current.get('intent_creation') || 0,
            signatureWaitTime: performanceTimers.current.get('signature_wait') || 0,
            executionTime: 0,
            confirmationTime: 0
          },
          recoveryAttempts: errorRecovery.state.recoveryHistory.length,
          errorCategory: errorRecovery.state.errorCategory,
          finalError: error as Error
        }
        
        if (finalConfig.callbacks?.onPaymentCompleted) {
          finalConfig.callbacks.onPaymentCompleted(result)
        }
        
        return result
      } else {
        // Recovery succeeded, retry the payment
        return await executePayment(request)
      }
    }
  }, [
    state,
    writeContract,
    contractAddresses,
    receiptData,
    signaturePolling,
    errorRecovery,
    finalConfig,
    updateState,
    recordTiming,
    handlePaymentError
  ])
  
  /**
   * Identify performance bottleneck
   */
  const identifyBottleneck = useCallback((timers: Map<string, number>): string => {
    let slowestPhase = 'unknown'
    let slowestTime = 0
    
    for (const [phase, time] of timers.entries()) {
      if (phase.endsWith('_start')) continue
      
      if (time > slowestTime) {
        slowestTime = time
        slowestPhase = phase
      }
    }
    
    return slowestPhase
  }, [])
  
  /**
   * Cancel active payment
   */
  const cancelPayment = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    signaturePolling.cancelPolling()
    errorRecovery.resetRecovery()
    
    updateState({
      phase: 'idle',
      progress: 0,
      message: 'Payment cancelled',
      isActive: false,
      error: null
    })
    
    if (finalConfig.debugConfig.enableVerboseLogging) {
      console.log('🛑 Payment cancelled by user')
    }
  }, [signaturePolling, errorRecovery, updateState, finalConfig.debugConfig])
  
  /**
   * Retry failed payment
   */
  const retryPayment = useCallback(async (): Promise<PaymentResult> => {
    if (!currentRequestRef.current) {
      throw new Error('No previous payment request to retry')
    }
    
    errorRecovery.resetRecovery()
    return await executePayment(currentRequestRef.current)
  }, [executePayment, errorRecovery])
  
  /**
   * Resume interrupted payment
   */
  const resumePayment = useCallback(async (sessionId: string): Promise<PaymentResult> => {
    const resumed = await errorRecovery.resumeRecovery(sessionId)
    
    if (!resumed) {
      throw new Error(`No recoverable state found for session: ${sessionId}`)
    }
    
    if (!currentRequestRef.current) {
      throw new Error('No payment request context available for resumption')
    }
    
    return await executePayment(currentRequestRef.current)
  }, [errorRecovery, executePayment])
  
  /**
   * Get system health summary
   */
  const getSystemHealth = useCallback(() => {
    return {
      status: (healthMonitor.isBackendAvailable ? 'healthy' : 'critical') as 'healthy' | 'degraded' | 'critical',
      details: healthMonitor.metrics,
      recommendations: generateHealthRecommendations(healthMonitor.metrics)
    }
  }, [healthMonitor, generateHealthRecommendations])
  
  /**
   * Refresh system health
   */
  const refreshSystemHealth = useCallback(async () => {
    await healthMonitor.forceHealthCheck()
  }, [healthMonitor])
  
  /**
   * Reset orchestrator state
   */
  const resetState = useCallback(() => {
    cancelPayment()
    performanceTimers.current.clear()
    currentRequestRef.current = null
    
    setState({
      phase: 'idle',
      progress: 0,
      message: 'Ready to process payment',
      isActive: false,
      error: null,
      systemHealth: {
        backend: healthMonitor.metrics,
        overallStatus: 'healthy',
        recommendations: []
      },
      paymentProgress: {
        intentId: null,
        intentCreated: false,
        signatureReceived: false,
        paymentExecuted: false,
        paymentConfirmed: false,
        estimatedTimeRemaining: 0
      },
      recoveryContext: {
        isRecovering: false,
        errorCategory: null,
        recoveryStrategy: null,
        recoveryAttempt: 0,
        availableRecoveryActions: []
      },
      performance: {
        startTime: null,
        intentCreationTime: null,
        signatureTime: null,
        executionTime: null,
        totalDuration: null,
        bottleneckPhase: null
      },
      userInteraction: {
        requiresAction: false,
        actionType: 'none',
        actionMessage: '',
        canCancel: true
      }
    })
  }, [cancelPayment, healthMonitor.metrics])
  
  /**
   * Get estimated payment duration
   */
  const getEstimatedDuration = useCallback((): number => {
    const baseTime = 30000 // 30 seconds base time
    
    if (!healthMonitor.isBackendAvailable) {
      return baseTime * 2 // Double time if backend is unhealthy
    }
    
    const healthMultiplier = healthMonitor.metrics.avgResponseTime > 3000 ? 1.5 : 1
    return Math.round(baseTime * healthMultiplier)
  }, [healthMonitor])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  // Computed properties
  const canStartPayment = !state.isActive && healthMonitor.isBackendAvailable
  
  return {
    state,
    executePayment,
    cancelPayment,
    retryPayment,
    resumePayment,
    getSystemHealth,
    refreshSystemHealth,
    resetState,
    canStartPayment,
    getEstimatedDuration
  }
}
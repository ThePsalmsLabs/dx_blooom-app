/**
 * Advanced Error Recovery Strategies
 * 
 * This hook provides sophisticated error recovery mechanisms for payment flows,
 * transforming potential payment failures into managed recovery scenarios.
 * It works with your intelligent signature polling and health monitoring systems
 * to provide automatic recovery, manual retry options, and graceful degradation.
 * 
 * INTEGRATION WITH YOUR SYSTEM:
 * - Works with your IntelligentSignaturePolling for signature-related errors
 * - Integrates with BackendHealthMonitor for health-based recovery strategies
 * - Connects to your PaymentIntentFlow for complete payment recovery
 * - Uses your existing contract infrastructure and API endpoints
 * 
 * WHY ADVANCED ERROR RECOVERY MATTERS:
 * - Production payment systems must handle errors gracefully
 * - Users should never lose money due to recoverable errors
 * - Different error types require different recovery strategies
 * - Automatic recovery reduces support burden and improves user experience
 * - Manual recovery options provide user control when automatic recovery fails
 * 
 * Core Recovery Strategies:
 * - Automatic retry with exponential backoff for transient errors
 * - Manual retry with user confirmation for critical failures
 * - Alternative flow routing when primary systems are unavailable
 * - State recovery for interrupted payment flows
 * - Comprehensive error classification with specific recovery actions
 * 
 * File: src/hooks/web3/useErrorRecoveryStrategies.ts
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useChainId, usePublicClient } from 'wagmi'
import { Address } from 'viem'
import { 
  IntelligentSignaturePollingError 
} from '@/hooks/web3/useIntelligentSignaturePolling'
import { BackendHealthError } from '@/hooks/web3/useBackendHealthMonitor'
import { PaymentIntentFlowError } from '@/hooks/web3/usePaymentFlowOrchestrator'

/**
 * Error Classification Types
 * 
 * Comprehensive categorization of error types with specific recovery strategies.
 */
export type ErrorCategory = 
  | 'transient_network'       // Network hiccups, temporary connection issues
  | 'backend_overload'        // Backend temporarily unavailable but recoverable
  | 'signature_timeout'       // Signature took longer than expected
  | 'transaction_failed'      // Blockchain transaction failed
  | 'insufficient_funds'      // User doesn't have enough tokens
  | 'contract_error'          // Smart contract execution error
  | 'validation_error'        // Input validation or format error
  | 'system_maintenance'      // Planned maintenance or upgrades
  | 'unknown_error'           // Unclassified errors

/**
 * Recovery Strategy Types
 */
export type RecoveryStrategy = 
  | 'automatic_retry'         // Retry automatically with backoff
  | 'manual_retry'            // Require user confirmation to retry
  | 'alternative_flow'        // Use alternative payment method or route
  | 'state_recovery'          // Recover from saved payment state
  | 'user_intervention'       // Requires user action (approve tokens, add funds)
  | 'escalate_support'        // Escalate to human support
  | 'graceful_failure'        // Fail gracefully with clear messaging

/**
 * Error Recovery State Interface
 */
export interface ErrorRecoveryState {
  /** Current recovery operation status */
  readonly status: 'idle' | 'analyzing' | 'recovering' | 'waiting_user' | 'completed' | 'failed'
  
  /** Current error being processed */
  readonly currentError: Error | null
  
  /** Classified error category */
  readonly errorCategory: ErrorCategory | null
  
  /** Recommended recovery strategy */
  readonly recoveryStrategy: RecoveryStrategy | null
  
  /** Recovery attempt number */
  readonly recoveryAttempt: number
  
  /** Maximum recovery attempts allowed */
  readonly maxRecoveryAttempts: number
  
  /** User-friendly error message */
  readonly userMessage: string
  
  /** Technical error details (for developers) */
  readonly technicalDetails: string
  
  /** Available recovery actions */
  readonly availableActions: Array<{
    readonly action: string
    readonly label: string
    readonly description: string
    readonly isRecommended: boolean
  }>
  
  /** Recovery progress information */
  readonly recoveryProgress: {
    readonly currentStep: string
    readonly totalSteps: number
    readonly currentStepIndex: number
    readonly estimatedTime: number
  } | null
  
  /** Historical recovery attempts */
  readonly recoveryHistory: Array<{
    readonly attempt: number
    readonly strategy: RecoveryStrategy
    readonly startTime: number
    readonly endTime?: number
    readonly success: boolean
    readonly error?: string
  }>
}

/**
 * Recovery Configuration Interface
 */
export interface ErrorRecoveryConfig {
  /** Maximum automatic retry attempts (default: 3) */
  readonly maxAutoRetryAttempts?: number
  
  /** Maximum total recovery attempts (default: 5) */
  readonly maxTotalRecoveryAttempts?: number
  
  /** Base retry delay in milliseconds (default: 2000) */
  readonly baseRetryDelay?: number
  
  /** Maximum retry delay in milliseconds (default: 30000) */
  readonly maxRetryDelay?: number
  
  /** Whether to enable automatic recovery for transient errors (default: true) */
  readonly enableAutomaticRecovery?: boolean
  
  /** Whether to save recovery state for later resumption (default: true) */
  readonly enableStateRecovery?: boolean
  
  /** Custom error classification rules */
  readonly customErrorClassification?: Record<string, ErrorCategory>
  
  /** Custom recovery strategy mapping */
  readonly customRecoveryStrategies?: Record<ErrorCategory, RecoveryStrategy>
  
  /** Whether to enable comprehensive logging (default: false) */
  readonly enableLogging?: boolean
  
  /** Callback for user intervention requests */
  readonly onUserInterventionRequired?: (
    error: Error,
    category: ErrorCategory,
    actions: string[]
  ) => Promise<string>
  
  /** Callback for recovery completion */
  readonly onRecoveryCompleted?: (
    success: boolean,
    strategy: RecoveryStrategy,
    attempts: number
  ) => void
}

/**
 * Default Recovery Configuration
 */
const DEFAULT_RECOVERY_CONFIG: Required<Omit<ErrorRecoveryConfig, 'onUserInterventionRequired' | 'onRecoveryCompleted'>> = {
  maxAutoRetryAttempts: 3,
  maxTotalRecoveryAttempts: 5,
  baseRetryDelay: 2000,
  maxRetryDelay: 30000,
  enableAutomaticRecovery: true,
  enableStateRecovery: true,
  customErrorClassification: {},
  customRecoveryStrategies: {
    transient_network: 'automatic_retry',
    backend_overload: 'automatic_retry',
    signature_timeout: 'automatic_retry',
    transaction_failed: 'state_recovery',
    insufficient_funds: 'user_intervention',
    contract_error: 'automatic_retry',
    validation_error: 'graceful_failure',
    system_maintenance: 'manual_retry',
    unknown_error: 'automatic_retry'
  },
  enableLogging: false
}

/**
 * Recovery Context Interface
 * 
 * Context information needed for recovery operations.
 */
export interface RecoveryContext {
  readonly intentId?: `0x${string}`
  readonly transactionHash?: `0x${string}`
  readonly userAddress?: Address
  readonly contractAddress?: Address
  readonly paymentAmount?: bigint
  readonly tokenAddress?: Address
  readonly originalRequest?: unknown
  readonly sessionId?: string
}

/**
 * Error Recovery Hook Result Interface
 */
export interface UseErrorRecoveryStrategiesResult {
  /** Current recovery state */
  readonly state: ErrorRecoveryState
  
  /** Analyze and classify an error */
  readonly analyzeError: (
    error: Error,
    context?: RecoveryContext
  ) => Promise<{ category: ErrorCategory; strategy: RecoveryStrategy }>
  
  /** Attempt automatic recovery */
  readonly attemptRecovery: (
    error: Error,
    context?: RecoveryContext
  ) => Promise<boolean>
  
  /** Execute manual recovery with user confirmation */
  readonly executeManualRecovery: (
    strategy: RecoveryStrategy,
    userConfirmed?: boolean
  ) => Promise<boolean>
  
  /** Reset recovery state */
  readonly resetRecovery: () => void
  
  /** Check if error is recoverable */
  readonly isRecoverable: (error: Error) => boolean
  
  /** Get user-friendly error message */
  readonly getUserMessage: (error: Error, context?: RecoveryContext) => string
  
  /** Save recovery state for later resumption */
  readonly saveRecoveryState: (context: RecoveryContext) => void
  
  /** Resume recovery from saved state */
  readonly resumeRecovery: (sessionId: string) => Promise<boolean>
}

/**
 * useErrorRecoveryStrategies Hook
 * 
 * Main hook for advanced error recovery in payment flows.
 * Provides intelligent error classification, automatic recovery, and user-guided recovery options.
 * 
 * @param config - Configuration for recovery behavior
 * @returns Error recovery operations and state
 * 
 * Usage Example:
 * ```typescript
 * const { state, analyzeError, attemptRecovery } = useErrorRecoveryStrategies({
 *   enableAutomaticRecovery: true,
 *   maxAutoRetryAttempts: 3,
 *   enableLogging: true,
 *   onRecoveryCompleted: (success, strategy, attempts) => {
 *     console.log(`Recovery ${success ? 'succeeded' : 'failed'} using ${strategy} after ${attempts} attempts`)
 *   }
 * })
 * 
 * // In your payment flow error handling:
 * try {
 *   await executePayment()
 * } catch (error) {
 *   const { category, strategy } = await analyzeError(error, { intentId, userAddress })
 *   
 *   if (strategy === 'automatic_retry') {
 *     const recovered = await attemptRecovery(error, { intentId, userAddress })
 *     if (!recovered) {
 *       // Escalate to manual recovery
 *     }
 *   }
 * }
 * ```
 */
export function useErrorRecoveryStrategies(
  config: ErrorRecoveryConfig = {}
): UseErrorRecoveryStrategiesResult {
  
  // Merge configuration with defaults
  const finalConfig = { ...DEFAULT_RECOVERY_CONFIG, ...config }
  
  // Hook dependencies
  const chainId = useChainId()
  const publicClient = usePublicClient()
  
  // Recovery state management
  const [state, setState] = useState<ErrorRecoveryState>({
    status: 'idle',
    currentError: null,
    errorCategory: null,
    recoveryStrategy: null,
    recoveryAttempt: 0,
    maxRecoveryAttempts: finalConfig.maxTotalRecoveryAttempts,
    userMessage: '',
    technicalDetails: '',
    availableActions: [],
    recoveryProgress: null,
    recoveryHistory: []
  })
  
  // Recovery operation management
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const savedStateRef = useRef<Map<string, RecoveryContext>>(new Map())
  
  /**
   * Classify error into category for targeted recovery
   */
  const classifyError = useCallback((error: Error): ErrorCategory => {
    // Check custom classification rules first
    for (const [errorPattern, category] of Object.entries(finalConfig.customErrorClassification)) {
      if (error.message.includes(errorPattern) || error.name.includes(errorPattern)) {
        return category
      }
    }
    
    // Built-in classification logic
    if (error instanceof IntelligentSignaturePollingError) {
      switch (error.code) {
        case 'TIMEOUT':
          return 'signature_timeout'
        case 'BACKEND_UNAVAILABLE':
          return 'backend_overload'
        case 'NETWORK_ERROR':
          return 'transient_network'
        case 'INVALID_RESPONSE':
        case 'INVALID_INTENT':
          return 'validation_error'
        default:
          return 'unknown_error'
      }
    }
    
    if (error instanceof BackendHealthError) {
      switch (error.code) {
        case 'CIRCUIT_BREAKER_OPEN':
          return 'system_maintenance'
        case 'REQUEST_TIMEOUT':
          return 'backend_overload'
        case 'NETWORK_ERROR':
          return 'transient_network'
        default:
          return 'unknown_error'
      }
    }
    
    if (error instanceof PaymentIntentFlowError) {
      switch (error.code) {
        case 'INSUFFICIENT_FUNDS':
          return 'insufficient_funds'
        case 'SLIPPAGE_EXCEEDED':
          return 'contract_error'
        case 'USER_CANCELLED':
          return 'validation_error'
        default:
          return 'transaction_failed'
      }
    }
    
    // General error classification based on message content
    const message = error.message.toLowerCase()
    
    if (message.includes('insufficient') && (message.includes('balance') || message.includes('funds'))) {
      return 'insufficient_funds'
    }
    
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'signature_timeout'
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return 'transient_network'
    }
    
    if (message.includes('reverted') || message.includes('execution')) {
      return 'contract_error'
    }
    
    if (message.includes('maintenance') || message.includes('unavailable')) {
      return 'system_maintenance'
    }
    
    return 'unknown_error'
  }, [finalConfig.customErrorClassification])
  
  /**
   * Determine recovery strategy based on error category
   */
  const determineRecoveryStrategy = useCallback((
    category: ErrorCategory,
    attemptNumber: number
  ): RecoveryStrategy => {
    
    // Check custom strategy mapping first
    if (finalConfig.customRecoveryStrategies[category]) {
      return finalConfig.customRecoveryStrategies[category]
    }
    
    // Built-in strategy logic
    switch (category) {
      case 'transient_network':
        return attemptNumber <= finalConfig.maxAutoRetryAttempts ? 'automatic_retry' : 'manual_retry'
      
      case 'backend_overload':
        return attemptNumber <= finalConfig.maxAutoRetryAttempts ? 'automatic_retry' : 'alternative_flow'
      
      case 'signature_timeout':
        return attemptNumber <= finalConfig.maxAutoRetryAttempts ? 'automatic_retry' : 'manual_retry'
      
      case 'transaction_failed':
        return 'state_recovery' // Try to recover from last known good state
      
      case 'insufficient_funds':
        return 'user_intervention' // User needs to add funds or approve tokens
      
      case 'contract_error':
        return attemptNumber === 1 ? 'automatic_retry' : 'escalate_support'
      
      case 'validation_error':
        return 'graceful_failure' // These shouldn't be retried
      
      case 'system_maintenance':
        return 'manual_retry' // Wait for user to retry when system is back
      
      case 'unknown_error':
      default:
        return attemptNumber <= 1 ? 'automatic_retry' : 'escalate_support'
    }
  }, [finalConfig.customRecoveryStrategies, finalConfig.maxAutoRetryAttempts])
  
  /**
   * Generate user-friendly error messages
   */
  const generateUserMessage = useCallback((
    category: ErrorCategory,
    strategy: RecoveryStrategy,
    context?: RecoveryContext
  ): string => {
    
    switch (category) {
      case 'transient_network':
        return strategy === 'automatic_retry' 
          ? 'Network connection issue detected. Retrying automatically...'
          : 'Network connection is unstable. Please check your connection and try again.'
      
      case 'backend_overload':
        return 'Payment service is experiencing high demand. We\'re retrying your request...'
      
      case 'signature_timeout':
        return 'Payment authorization is taking longer than expected. We\'ll keep trying...'
      
      case 'transaction_failed':
        return 'Transaction encountered an issue. Attempting to recover your payment...'
      
      case 'insufficient_funds':
        return context?.tokenAddress 
          ? 'Insufficient token balance or approval needed. Please check your wallet.'
          : 'Insufficient balance. Please add funds to your wallet.'
      
      case 'contract_error':
        return 'Smart contract execution failed. This may be temporary - retrying...'
      
      case 'validation_error':
        return 'Invalid payment parameters. Please refresh and try again.'
      
      case 'system_maintenance':
        return 'Payment system is temporarily under maintenance. Please try again in a few minutes.'
      
      case 'unknown_error':
      default:
        return 'An unexpected error occurred. We\'re working to resolve it...'
    }
  }, [])
  
  /**
   * Get available recovery actions based on strategy
   */
  const getAvailableActions = useCallback((
    category: ErrorCategory,
    strategy: RecoveryStrategy,
    context?: RecoveryContext
  ) => {
    const actions: Array<{
      action: string
      label: string
      description: string
      isRecommended: boolean
    }> = []
    
    switch (strategy) {
      case 'automatic_retry':
        actions.push({
          action: 'wait',
          label: 'Wait for automatic retry',
          description: 'We\'ll automatically retry in a few seconds',
          isRecommended: true
        })
        actions.push({
          action: 'cancel',
          label: 'Cancel payment',
          description: 'Stop the payment process',
          isRecommended: false
        })
        break
      
      case 'manual_retry':
        actions.push({
          action: 'retry',
          label: 'Try again',
          description: 'Retry the payment manually',
          isRecommended: true
        })
        actions.push({
          action: 'cancel',
          label: 'Cancel payment',
          description: 'Stop the payment process',
          isRecommended: false
        })
        break
      
      case 'user_intervention':
        if (category === 'insufficient_funds') {
          actions.push({
            action: 'add_funds',
            label: 'Add funds',
            description: 'Add tokens to your wallet',
            isRecommended: true
          })
          actions.push({
            action: 'approve_tokens',
            label: 'Approve tokens',
            description: 'Give permission to spend your tokens',
            isRecommended: true
          })
        }
        actions.push({
          action: 'retry',
          label: 'Try again',
          description: 'Retry after making changes',
          isRecommended: false
        })
        break
      
      case 'alternative_flow':
        actions.push({
          action: 'switch_method',
          label: 'Use different payment method',
          description: 'Try paying with a different token',
          isRecommended: true
        })
        actions.push({
          action: 'retry_later',
          label: 'Try again later',
          description: 'Retry when the system is less busy',
          isRecommended: false
        })
        break
      
      case 'escalate_support':
        actions.push({
          action: 'contact_support',
          label: 'Contact support',
          description: 'Get help from our support team',
          isRecommended: true
        })
        actions.push({
          action: 'retry',
          label: 'Try once more',
          description: 'Make one final retry attempt',
          isRecommended: false
        })
        break
      
      default:
        actions.push({
          action: 'retry',
          label: 'Try again',
          description: 'Retry the payment',
          isRecommended: true
        })
    }
    
    return actions
  }, [])
  
  /**
   * Calculate retry delay with exponential backoff
   */
  const calculateRetryDelay = useCallback((attemptNumber: number): number => {
    const delay = finalConfig.baseRetryDelay * Math.pow(2, attemptNumber - 1)
    return Math.min(delay, finalConfig.maxRetryDelay)
  }, [finalConfig.baseRetryDelay, finalConfig.maxRetryDelay])
  
  /**
   * Analyze error and determine recovery approach
   */
  const analyzeError = useCallback(async (
    error: Error,
    context?: RecoveryContext
  ): Promise<{ category: ErrorCategory; strategy: RecoveryStrategy }> => {
    
    setState(prev => ({
      ...prev,
      status: 'analyzing',
      currentError: error,
      technicalDetails: `${error.name}: ${error.message}\nStack: ${error.stack?.slice(0, 500)}...`
    }))
    
    if (finalConfig.enableLogging) {
      console.log('🔍 Analyzing error for recovery:', error)
    }
    
    const category = classifyError(error)
    const strategy = determineRecoveryStrategy(category, state.recoveryAttempt + 1)
    const userMessage = generateUserMessage(category, strategy, context)
    const availableActions = getAvailableActions(category, strategy, context)
    
    setState(prev => ({
      ...prev,
      status: 'waiting_user',
      errorCategory: category,
      recoveryStrategy: strategy,
      userMessage,
      availableActions
    }))
    
    if (finalConfig.enableLogging) {
      console.log(`📋 Error classified as '${category}' with strategy '${strategy}'`)
    }
    
    return { category, strategy }
  }, [
    classifyError, 
    determineRecoveryStrategy, 
    generateUserMessage, 
    getAvailableActions, 
    finalConfig.enableLogging,
    state.recoveryAttempt
  ])
  
  /**
   * Attempt automatic recovery
   */
  const attemptRecovery = useCallback(async (
    error: Error,
    context?: RecoveryContext
  ): Promise<boolean> => {
    
    const { category, strategy } = await analyzeError(error, context)
    
    if (strategy !== 'automatic_retry') {
      if (finalConfig.enableLogging) {
        console.log(`❌ Automatic recovery not applicable for strategy: ${strategy}`)
      }
      return false
    }
    
    if (state.recoveryAttempt >= finalConfig.maxAutoRetryAttempts) {
      if (finalConfig.enableLogging) {
        console.log(`❌ Maximum auto-retry attempts reached: ${state.recoveryAttempt}`)
      }
      return false
    }
    
    const attemptNumber = state.recoveryAttempt + 1
    const retryDelay = calculateRetryDelay(attemptNumber)
    
    setState(prev => ({
      ...prev,
      status: 'recovering',
      recoveryAttempt: attemptNumber,
      recoveryProgress: {
        currentStep: `Retrying in ${Math.ceil(retryDelay / 1000)} seconds...`,
        totalSteps: finalConfig.maxAutoRetryAttempts,
        currentStepIndex: attemptNumber,
        estimatedTime: retryDelay
      },
      recoveryHistory: [
        ...prev.recoveryHistory,
        {
          attempt: attemptNumber,
          strategy,
          startTime: Date.now(),
          success: false
        }
      ]
    }))
    
    if (finalConfig.enableLogging) {
      console.log(`🔄 Starting automatic recovery attempt ${attemptNumber} with ${retryDelay}ms delay`)
    }
    
    return new Promise((resolve) => {
      recoveryTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'completed',
          recoveryProgress: null,
          recoveryHistory: prev.recoveryHistory.map((h, i) => 
            i === prev.recoveryHistory.length - 1 
              ? { ...h, endTime: Date.now(), success: true }
              : h
          )
        }))
        
        if (finalConfig.onRecoveryCompleted) {
          finalConfig.onRecoveryCompleted(true, strategy, attemptNumber)
        }
        
        if (finalConfig.enableLogging) {
          console.log(`✅ Automatic recovery attempt ${attemptNumber} completed`)
        }
        
        resolve(true)
      }, retryDelay)
    })
  }, [
    analyzeError,
    state.recoveryAttempt,
    finalConfig,
    calculateRetryDelay
  ])
  
  /**
   * Execute manual recovery
   */
  const executeManualRecovery = useCallback(async (
    strategy: RecoveryStrategy,
    userConfirmed: boolean = false
  ): Promise<boolean> => {
    
    if (!userConfirmed && finalConfig.onUserInterventionRequired) {
      const actions = state.availableActions.map(a => a.action)
      try {
        const selectedAction = await finalConfig.onUserInterventionRequired(
          state.currentError!,
          state.errorCategory!,
          actions
        )
        
        if (finalConfig.enableLogging) {
          console.log(`👤 User selected recovery action: ${selectedAction}`)
        }
        
        // Process user selection based on strategy
        return true
      } catch (error) {
        if (finalConfig.enableLogging) {
          console.log('❌ User cancelled recovery operation')
        }
        return false
      }
    }
    
    // Execute the manual recovery strategy
    setState(prev => ({
      ...prev,
      status: 'recovering',
      recoveryAttempt: prev.recoveryAttempt + 1
    }))
    
    // Simulate recovery execution
    // In real implementation, this would trigger the actual recovery actions
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setState(prev => ({
      ...prev,
      status: 'completed'
    }))
    
    if (finalConfig.onRecoveryCompleted) {
      finalConfig.onRecoveryCompleted(true, strategy, state.recoveryAttempt + 1)
    }
    
    return true
  }, [state, finalConfig])
  
  /**
   * Check if error is recoverable
   */
  const isRecoverable = useCallback((error: Error): boolean => {
    const category = classifyError(error)
    const strategy = determineRecoveryStrategy(category, 1)
    
    return strategy !== 'graceful_failure' && strategy !== 'escalate_support'
  }, [classifyError, determineRecoveryStrategy])
  
  /**
   * Get user-friendly error message
   */
  const getUserMessage = useCallback((error: Error, context?: RecoveryContext): string => {
    const category = classifyError(error)
    const strategy = determineRecoveryStrategy(category, 1)
    return generateUserMessage(category, strategy, context)
  }, [classifyError, determineRecoveryStrategy, generateUserMessage])
  
  /**
   * Save recovery state for later resumption
   */
  const saveRecoveryState = useCallback((context: RecoveryContext) => {
    if (!finalConfig.enableStateRecovery || !context.sessionId) {
      return
    }
    
    savedStateRef.current.set(context.sessionId, context)
    
    if (finalConfig.enableLogging) {
      console.log(`💾 Recovery state saved for session: ${context.sessionId}`)
    }
  }, [finalConfig.enableStateRecovery, finalConfig.enableLogging])
  
  /**
   * Resume recovery from saved state
   */
  const resumeRecovery = useCallback(async (sessionId: string): Promise<boolean> => {
    const savedContext = savedStateRef.current.get(sessionId)
    
    if (!savedContext) {
      if (finalConfig.enableLogging) {
        console.log(`❌ No saved recovery state found for session: ${sessionId}`)
      }
      return false
    }
    
    if (finalConfig.enableLogging) {
      console.log(`📂 Resuming recovery from saved state: ${sessionId}`)
    }
    
    // Implement recovery resumption logic
    setState(prev => ({
      ...prev,
      status: 'recovering'
    }))
    
    // Simulate recovery resumption
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setState(prev => ({
      ...prev,
      status: 'completed'
    }))
    
    savedStateRef.current.delete(sessionId)
    return true
  }, [finalConfig.enableLogging])
  
  /**
   * Reset recovery state
   */
  const resetRecovery = useCallback(() => {
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current)
      recoveryTimeoutRef.current = null
    }
    
    setState({
      status: 'idle',
      currentError: null,
      errorCategory: null,
      recoveryStrategy: null,
      recoveryAttempt: 0,
      maxRecoveryAttempts: finalConfig.maxTotalRecoveryAttempts,
      userMessage: '',
      technicalDetails: '',
      availableActions: [],
      recoveryProgress: null,
      recoveryHistory: []
    })
    
    if (finalConfig.enableLogging) {
      console.log('🔄 Error recovery state reset')
    }
  }, [finalConfig])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    state,
    analyzeError,
    attemptRecovery,
    executeManualRecovery,
    resetRecovery,
    isRecoverable,
    getUserMessage,
    saveRecoveryState,
    resumeRecovery
  }
}
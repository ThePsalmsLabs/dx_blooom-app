/**
 * Payment Intent Management Hook
 * File: src/hooks/business/usePaymentIntentManager.ts
 * 
 * This hook provides a reusable pattern for implementing user-intent-driven
 * payment flows. It prevents premature RPC calls and wallet data fetching
 * until the user explicitly expresses purchase intent.
 * 
 * ARCHITECTURE BENEFITS:
 * 1. Prevents unnecessary RPC calls on component mount
 * 2. Improves page load performance by deferring wallet calculations
 * 3. Better UX - only show payment complexity when user is ready
 * 4. Reusable across all purchase components
 * 5. Type-safe intent phase management
 * 
 * INTEGRATION GUIDE:
 * - Use this hook in any component that handles payments
 * - Pass the `paymentDataEnabled` flag to conditional hooks
 * - Use intent phases to control UI rendering
 * - Call `expressPaymentIntent()` when user clicks purchase buttons
 */

import { useState, useCallback, useMemo } from 'react'
import { type Address } from 'viem'
import { useTokenBalance, useTokenAllowance } from '@/hooks/contracts/core'

/**
 * Payment Intent Phases
 * Represents the user's journey from browsing to completing purchase
 */
export enum PaymentIntentPhase {
  /** User is browsing content, no payment data needed */
  BROWSING = 'browsing',
  
  /** User clicked purchase, start loading payment data */
  INTENT_EXPRESSED = 'intent_expressed',
  
  /** User is selecting payment method */
  SELECTING_METHOD = 'selecting_method',
  
  /** Payment is being processed */
  PAYMENT_ACTIVE = 'payment_active',
  
  /** Payment completed successfully */
  COMPLETED = 'completed',
  
  /** Payment failed, user can retry */
  FAILED = 'failed'
}

/**
 * Payment Intent Configuration
 */
export interface PaymentIntentConfig {
  /** Whether to show method selection dialog */
  readonly enableMethodSelection?: boolean
  
  /** Whether to track payment analytics */
  readonly enableAnalytics?: boolean
  
  /** Callback when intent phase changes */
  readonly onPhaseChange?: (phase: PaymentIntentPhase, metadata?: any) => void
  
  /** Callback when payment data should be loaded */
  readonly onPaymentDataRequired?: () => void
}

/**
 * Payment Intent State
 */
export interface PaymentIntentState {
  /** Current phase of payment intent */
  readonly phase: PaymentIntentPhase
  
  /** Whether payment-related data fetching should be enabled */
  readonly paymentDataEnabled: boolean
  
  /** Whether user should see method selection UI */
  readonly showMethodSelection: boolean
  
  /** Whether payment is currently processing */
  readonly isProcessing: boolean
  
  /** Timestamp when intent was expressed */
  readonly intentTimestamp: number | null
  
  /** Any error message from payment flow */
  readonly errorMessage: string | null
  
  /** Additional metadata for the current phase */
  readonly metadata: Record<string, any>
}

/**
 * Payment Intent Actions
 */
export interface PaymentIntentActions {
  /** Express initial purchase intent - starts payment data loading */
  readonly expressPaymentIntent: (metadata?: any) => void
  
  /** Show payment method selection */
  readonly showMethodSelection: () => void
  
  /** Hide payment method selection */
  readonly hideMethodSelection: () => void
  
  /** Start payment processing */
  readonly startPaymentProcessing: (metadata?: any) => void
  
  /** Complete payment successfully */
  readonly completePayment: (metadata?: any) => void
  
  /** Mark payment as failed */
  readonly failPayment: (errorMessage: string, metadata?: any) => void
  
  /** Reset to browsing state */
  readonly resetTobrowsing: () => void
  
  /** Go back to method selection */
  readonly backToMethodSelection: () => void
}

/**
 * Payment Intent Manager Hook Result
 */
export interface PaymentIntentManager {
  readonly state: PaymentIntentState
  readonly actions: PaymentIntentActions
  readonly utils: {
    /** Check if we're in a specific phase */
    readonly isInPhase: (phase: PaymentIntentPhase) => boolean
    
    /** Check if we're past a specific phase */
    readonly isPastPhase: (phase: PaymentIntentPhase) => boolean
    
    /** Get time elapsed since intent expression */
    readonly getIntentDuration: () => number | null
    
    /** Get user-friendly phase description */
    readonly getPhaseDescription: () => string
  }
}

/**
 * Payment Intent Manager Hook
 * 
 * @param config - Configuration options for payment intent management
 * @returns Payment intent manager with state and actions
 */
export function usePaymentIntentManager(
  config: PaymentIntentConfig = {}
): PaymentIntentManager {
  const {
    enableMethodSelection = true,
    enableAnalytics = false,
    onPhaseChange,
    onPaymentDataRequired
  } = config

  // ===== STATE MANAGEMENT =====
  
  const [state, setState] = useState<PaymentIntentState>({
    phase: PaymentIntentPhase.BROWSING,
    paymentDataEnabled: false,
    showMethodSelection: false,
    isProcessing: false,
    intentTimestamp: null,
    errorMessage: null,
    metadata: {}
  })

  // ===== ACTIONS =====
  
  const expressPaymentIntent = useCallback((metadata: any = {}) => {
    const timestamp = Date.now()
    
    console.log('💭 Payment intent expressed:', { timestamp, metadata })
    
    setState(prev => ({
      ...prev,
      phase: PaymentIntentPhase.INTENT_EXPRESSED,
      paymentDataEnabled: true, // This enables conditional hooks
      showMethodSelection: enableMethodSelection,
      intentTimestamp: timestamp,
      errorMessage: null,
      metadata: { ...prev.metadata, ...metadata }
    }))

    // Trigger callbacks
    onPhaseChange?.(PaymentIntentPhase.INTENT_EXPRESSED, { timestamp, ...metadata })
    onPaymentDataRequired?.()

    // Analytics tracking
    if (enableAnalytics) {
      // Add your analytics tracking here
      console.log('📊 Analytics: Payment intent expressed')
    }
  }, [enableMethodSelection, onPhaseChange, onPaymentDataRequired, enableAnalytics])

  const showMethodSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      showMethodSelection: true,
      phase: prev.phase === PaymentIntentPhase.BROWSING 
        ? PaymentIntentPhase.INTENT_EXPRESSED 
        : prev.phase
    }))
  }, [])

  const hideMethodSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      showMethodSelection: false
    }))
  }, [])

  const startPaymentProcessing = useCallback((metadata: any = {}) => {
    console.log('🔄 Payment processing started:', metadata)
    
    setState(prev => ({
      ...prev,
      phase: PaymentIntentPhase.PAYMENT_ACTIVE,
      isProcessing: true,
      showMethodSelection: false,
      errorMessage: null,
      metadata: { ...prev.metadata, ...metadata }
    }))

    onPhaseChange?.(PaymentIntentPhase.PAYMENT_ACTIVE, metadata)
  }, [onPhaseChange])

  const completePayment = useCallback((metadata: any = {}) => {
    console.log('✅ Payment completed successfully:', metadata)
    
    setState(prev => ({
      ...prev,
      phase: PaymentIntentPhase.COMPLETED,
      isProcessing: false,
      errorMessage: null,
      metadata: { ...prev.metadata, ...metadata }
    }))

    onPhaseChange?.(PaymentIntentPhase.COMPLETED, metadata)

    if (enableAnalytics) {
      const duration = state.intentTimestamp ? Date.now() - state.intentTimestamp : null
      console.log('📊 Analytics: Payment completed', { duration, ...metadata })
    }
  }, [onPhaseChange, enableAnalytics, state.intentTimestamp])

  const failPayment = useCallback((errorMessage: string, metadata: any = {}) => {
    console.error('❌ Payment failed:', errorMessage, metadata)
    
    setState(prev => ({
      ...prev,
      phase: PaymentIntentPhase.FAILED,
      isProcessing: false,
      errorMessage,
      metadata: { ...prev.metadata, error: errorMessage, ...metadata }
    }))

    onPhaseChange?.(PaymentIntentPhase.FAILED, { error: errorMessage, ...metadata })
  }, [onPhaseChange])

  const resetTobrowsing = useCallback(() => {
    console.log('🔄 Resetting to browsing state')
    
    setState({
      phase: PaymentIntentPhase.BROWSING,
      paymentDataEnabled: false, // This disables conditional hooks
      showMethodSelection: false,
      isProcessing: false,
      intentTimestamp: null,
      errorMessage: null,
      metadata: {}
    })

    onPhaseChange?.(PaymentIntentPhase.BROWSING, {})
  }, [onPhaseChange])

  const backToMethodSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      phase: PaymentIntentPhase.SELECTING_METHOD,
      showMethodSelection: true,
      isProcessing: false,
      errorMessage: null
    }))

    onPhaseChange?.(PaymentIntentPhase.SELECTING_METHOD, {})
  }, [onPhaseChange])

  // ===== UTILITIES =====
  
  const isInPhase = useCallback((phase: PaymentIntentPhase) => {
    return state.phase === phase
  }, [state.phase])

  const isPastPhase = useCallback((phase: PaymentIntentPhase) => {
    const phaseOrder: PaymentIntentPhase[] = [
      PaymentIntentPhase.BROWSING,
      PaymentIntentPhase.INTENT_EXPRESSED,
      PaymentIntentPhase.SELECTING_METHOD,
      PaymentIntentPhase.PAYMENT_ACTIVE,
      PaymentIntentPhase.COMPLETED
    ]
    
    const currentIndex = phaseOrder.indexOf(state.phase)
    const targetIndex = phaseOrder.indexOf(phase)
    
    return currentIndex > targetIndex
  }, [state.phase])

  const getIntentDuration = useCallback((): number | null => {
    return state.intentTimestamp ? Date.now() - state.intentTimestamp : null
  }, [state.intentTimestamp])

  const getPhaseDescription = useCallback((): string => {
    switch (state.phase) {
      case PaymentIntentPhase.BROWSING:
        return 'Viewing content information'
      case PaymentIntentPhase.INTENT_EXPRESSED:
        return 'Loading payment options'
      case PaymentIntentPhase.SELECTING_METHOD:
        return 'Choose payment method'
      case PaymentIntentPhase.PAYMENT_ACTIVE:
        return 'Processing payment'
      case PaymentIntentPhase.COMPLETED:
        return 'Purchase successful'
      case PaymentIntentPhase.FAILED:
        return 'Payment failed'
      default:
        return 'Unknown status'
    }
  }, [state.phase])

  // ===== COMPUTED VALUES =====
  
  const actions = useMemo((): PaymentIntentActions => ({
    expressPaymentIntent,
    showMethodSelection,
    hideMethodSelection,
    startPaymentProcessing,
    completePayment,
    failPayment,
    resetTobrowsing,
    backToMethodSelection
  }), [
    expressPaymentIntent,
    showMethodSelection,
    hideMethodSelection,
    startPaymentProcessing,
    completePayment,
    failPayment,
    resetTobrowsing,
    backToMethodSelection
  ])

  const utils = useMemo(() => ({
    isInPhase,
    isPastPhase,
    getIntentDuration,
    getPhaseDescription
  }), [isInPhase, isPastPhase, getIntentDuration, getPhaseDescription])

  return {
    state,
    actions,
    utils
  }
}

/**
 * HOC for creating payment-enabled hooks
 * 
 * This utility helps create hooks that only enable when payment data is needed
 * 
 * @example
 * ```typescript
 * const useConditionalTokenBalance = createPaymentEnabledHook(
 *   (tokenAddress: Address, userAddress: Address, enabled: boolean) =>
 *     useTokenBalance(tokenAddress, userAddress, { enabled })
 * )
 * ```
 */
export function createPaymentEnabledHook<TArgs extends readonly any[], TReturn>(
  hookFn: (...args: [...TArgs, boolean]) => TReturn
) {
  return (...args: TArgs) => (enabled: boolean) => {
    return hookFn(...args, enabled)
  }
}

/**
 * Pre-configured conditional hooks for common payment operations
 */
export const useConditionalTokenBalance = (
  tokenAddress: Address | undefined,
  userAddress: Address | undefined,
  enabled: boolean
) => {
  // Only call the hook if enabled, otherwise return undefined values
  if (!enabled) {
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
      refetch: () => {}
    }
  }
  return useTokenBalance(tokenAddress, userAddress)
}

export const useConditionalTokenAllowance = (
  tokenAddress: Address | undefined,
  userAddress: Address | undefined,
  spenderAddress: Address | undefined,
  enabled: boolean
) => {
  // Only call the hook if enabled, otherwise return undefined values
  if (!enabled) {
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
      refetch: () => {}
    }
  }
  return useTokenAllowance(tokenAddress, userAddress, spenderAddress)
}
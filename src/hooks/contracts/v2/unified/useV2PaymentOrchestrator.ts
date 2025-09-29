/**
 * V2 Payment Orchestrator - Unified Payment Flow Management
 * 
 * Orchestrates the complete v2 payment workflow across multiple manager contracts.
 * This is the main hook that components should use for payment operations.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useAccount, useChainId } from 'wagmi'
import { type Address, type Hash } from 'viem'

// Import all v2 hooks
import { useCommerceProtocolCore, type PlatformPaymentRequest, type PaymentContext as CorePaymentContext } from '../managers/useCommerceProtocolCore'
import { useSignatureManager } from '../managers/useSignatureManager'
import { useAccessManager } from '../managers/useAccessManager'

// Payment flow states
export type PaymentFlowStatus = 
  | 'idle'
  | 'creating_intent'
  | 'waiting_signature'
  | 'signature_ready'
  | 'executing_payment'
  | 'processing_access'
  | 'completed'
  | 'failed'

export interface PaymentFlowState {
  status: PaymentFlowStatus
  intentId?: `0x${string}`
  signature?: `0x${string}`
  transactionHash?: Hash
  error?: string
  progress: number // 0-100
  context?: CorePaymentContext
}

export interface V2PaymentParams {
  paymentType: 0 | 1 | 2 | 3 // PayPerView | Subscription | Tip | Donation
  creator: Address
  contentId: bigint
  paymentToken?: Address // Defaults to USDC
  maxSlippage?: bigint // Defaults to 500 (5%)
  subscriptionDuration?: bigint // For subscription payments
}

/**
 * Main V2 Payment Orchestrator Hook
 * 
 * This hook manages the complete payment workflow:
 * 1. Create payment intent
 * 2. Generate and provide signature
 * 3. Execute payment
 * 4. Grant access/create subscription
 * 5. Handle any post-payment actions
 */
export function useV2PaymentOrchestrator() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  
  // V2 Manager hooks
  const commerceCore = useCommerceProtocolCore()
  const signatureManager = useSignatureManager()
  const accessManager = useAccessManager()

  /**
   * Create payment intent - Step 1 of payment flow
   */
  const createIntentStep = useMutation({
    mutationFn: async (params: V2PaymentParams) => {
      if (!userAddress) throw new Error('User not connected')
      
      const paymentRequest: PlatformPaymentRequest = {
        paymentType: params.paymentType,
        creator: params.creator,
        contentId: params.contentId,
        paymentToken: params.paymentToken || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
        maxSlippage: params.maxSlippage || BigInt(500),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now
      }
      
      return commerceCore.createPaymentIntent.mutateAsync(paymentRequest)
    }
  })

  /**
   * Execute payment with signature - Step 2 of payment flow
   */
  const executePaymentStep = useMutation({
    mutationFn: async (intentId: `0x${string}`) => {
      if (!userAddress) throw new Error('User not connected')
      
      return commerceCore.executePaymentWithSignature.mutateAsync(intentId)
    }
  })

  /**
   * Quick pay-per-view purchase
   */
  const quickPurchase = useMutation({
    mutationFn: async ({ creator, contentId }: { creator: Address, contentId: bigint }) => {
      return createIntentStep.mutateAsync({
        paymentType: 0, // PayPerView
        creator,
        contentId
      })
    }
  })

  /**
   * Subscribe to creator
   */
  const subscribeToCreator = useMutation({
    mutationFn: async ({ 
      creator, 
      duration 
    }: { 
      creator: Address
      duration?: bigint 
    }) => {
      return createIntentStep.mutateAsync({
        paymentType: 1, // Subscription
        creator,
        contentId: BigInt(0), // Subscriptions use contentId 0
        subscriptionDuration: duration || BigInt(30 * 24 * 60 * 60) // 30 days default
      })
    }
  })

  /**
   * Send tip to creator
   */
  const sendTip = useMutation({
    mutationFn: async ({ 
      creator, 
      contentId 
    }: { 
      creator: Address
      contentId?: bigint 
    }) => {
      return createIntentStep.mutateAsync({
        paymentType: 2, // Tip
        creator,
        contentId: contentId || BigInt(0)
      })
    }
  })

  // ============ STATUS TRACKING ============

  /**
   * Get payment flow status for an intent
   */
  const usePaymentFlowStatus = (intentId: `0x${string}` | undefined) => {
    const hasSignature = signatureManager.useHasSignature(intentId)
    const hasAccess = accessManager.useHasAccess(userAddress, BigInt(1)) // Example content
    
    return useQuery({
      queryKey: ['paymentFlowStatus', intentId],
      queryFn: (): PaymentFlowState => {
        if (!intentId) return { status: 'idle', progress: 0 }
        
        if (hasAccess.data) {
          return { status: 'completed', progress: 100, intentId }
        }
        
        if (hasSignature.data) {
          return { status: 'signature_ready', progress: 60, intentId }
        }
        
        return { status: 'waiting_signature', progress: 30, intentId }
      },
      enabled: !!intentId,
      refetchInterval: 3000
    })
  }

  return {
    // Step-by-step payment functions
    createIntentStep,
    executePaymentStep,
    quickPurchase,
    subscribeToCreator,
    sendTip,
    
    // Status tracking
    usePaymentFlowStatus,
    
    // Individual manager access (for advanced use cases)
    commerceCore,
    signatureManager,
    accessManager,
    
    // Transaction state
    isPending: createIntentStep.isPending || executePaymentStep.isPending,
    error: createIntentStep.error || executePaymentStep.error,
    
    // Utils
    chainId,
    userAddress
  }
}

/**
 * Convenience hook for simple content purchases
 */
export function useContentPurchase(contentId: bigint, creator: Address) {
  const { quickPurchase } = useV2PaymentOrchestrator()
  const { useHasAccess } = useAccessManager()
  const { address: userAddress } = useAccount()
  
  const hasAccess = useHasAccess(userAddress, contentId)
  
  const purchase = useMutation({
    mutationFn: () => quickPurchase.mutateAsync({ creator, contentId })
  })
  
  return {
    purchase,
    hasAccess: hasAccess.data,
    isLoading: hasAccess.isLoading || purchase.isPending,
    error: hasAccess.error || purchase.error
  }
}
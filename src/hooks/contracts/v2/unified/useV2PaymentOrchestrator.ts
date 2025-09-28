/**
 * V2 Payment Orchestrator - Unified Payment Flow Management
 * 
 * Orchestrates the complete v2 payment workflow across multiple manager contracts.
 * This is the main hook that components should use for payment operations.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useAccount, useChainId } from 'wagmi'
import { type Address } from 'viem'

// Import all v2 hooks
import { useCommerceProtocolCore, type PlatformPaymentRequest } from '../useCommerceProtocolCore'
import { useSignatureManager, type PaymentIntentData } from '../managers/useSignatureManager'
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
  transactionHash?: `0x${string}`
  error?: string
  progress: number // 0-100
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
   * Complete V2 payment workflow
   */
  const processPayment = useMutation({
    mutationFn: async (params: V2PaymentParams): Promise<PaymentFlowState> => {
      if (!userAddress) throw new Error('User not connected')
      
      const state: PaymentFlowState = { status: 'idle', progress: 0 }
      
      try {
        // Step 1: Create payment intent
        state.status = 'creating_intent'
        state.progress = 10
        
        const paymentRequest: PlatformPaymentRequest = {
          paymentType: params.paymentType,
          creator: params.creator,
          contentId: params.contentId,
          paymentToken: params.paymentToken || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
          maxSlippage: params.maxSlippage || BigInt(500),
          deadline: BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now
        }
        
        const intentResult = await commerceCore.createPaymentIntent.mutateAsync(paymentRequest)
        
        // Extract intentId from transaction receipt (in real implementation)
        // For now, we'll use a placeholder
        const intentId = generateMockIntentId()
        state.intentId = intentId
        state.progress = 30
        
        // Step 2: Create and provide signature
        state.status = 'waiting_signature'
        
        const nonce = BigInt(Date.now()) // In practice, get from contract
        const intentData: PaymentIntentData = {
          intentId,
          user: userAddress,
          creator: params.creator,
          paymentType: params.paymentType,
          contentId: params.contentId,
          amount: BigInt(100000), // In practice, calculate from getPaymentInfo
          paymentToken: paymentRequest.paymentToken,
          deadline: paymentRequest.deadline,
          nonce
        }
        
        const signatureResult = await signatureManager.signAndProvideIntent.mutateAsync(intentData)
        state.signature = signatureResult.signature as `0x${string}`
        state.status = 'signature_ready'
        state.progress = 60
        
        // Step 3: Execute payment
        state.status = 'executing_payment'
        
        const paymentResult = await commerceCore.executePaymentWithSignature.mutateAsync(intentId)
        state.transactionHash = paymentResult as `0x${string}`
        state.progress = 80
        
        // Step 4: Grant access (handled automatically by AccessManager via CommerceProtocolCore)
        state.status = 'processing_access'
        
        if (params.paymentType === 0) { // PayPerView
          // Access is granted automatically for pay-per-view
        } else if (params.paymentType === 1) { // Subscription
          // Subscription is created automatically
        }
        
        state.status = 'completed'
        state.progress = 100
        
        return state
        
      } catch (error) {
        state.status = 'failed'
        state.error = (error as Error).message
        throw state
      }
    }
  })

  /**
   * Quick pay-per-view purchase
   */
  const quickPurchase = useMutation({
    mutationFn: async ({ creator, contentId }: { creator: Address, contentId: bigint }) => {
      return processPayment.mutateAsync({
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
      return processPayment.mutateAsync({
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
      amount,
      contentId 
    }: { 
      creator: Address
      amount: bigint
      contentId?: bigint 
    }) => {
      return processPayment.mutateAsync({
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
    // Main payment functions
    processPayment,
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
    isPending: processPayment.isPending,
    error: processPayment.error,
    
    // Utils
    chainId,
    userAddress
  }
}

/**
 * Convenience hook for simple content purchases
 */
export function useContentPurchase(contentId: bigint, creator: Address) {
  const { quickPurchase, usePaymentFlowStatus } = useV2PaymentOrchestrator()
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

// Utility function to generate mock intent ID (replace with real implementation)
function generateMockIntentId(): `0x${string}` {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`
}
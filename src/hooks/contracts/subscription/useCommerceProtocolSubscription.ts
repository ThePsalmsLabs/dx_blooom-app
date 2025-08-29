/**
 * Commerce Protocol Subscription Hook
 * 
 * This hook implements subscription payments through the Commerce Protocol,
 * providing multi-token support with permit-based gasless approvals.
 * 
 * Architecture:
 * 1. Create payment intent with PaymentType.Subscription (1)
 * 2. Backend generates permit signature for gasless approval
 * 3. Execute payment through Commerce Protocol
 * 4. Process subscription completion
 * 
 * File: src/hooks/contracts/subscription/useCommerceProtocolSubscription.ts
 */

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { type Address, type Hash } from 'viem'

// Import your established foundational layers
import { getContractAddresses } from '@/lib/contracts/config'
import { CREATOR_REGISTRY_ABI, COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'
import { useTokenBalance } from '@/hooks/contracts/core'

// ===== TYPE DEFINITIONS =====

/**
 * Commerce Protocol Subscription Steps
 */
export enum CommerceSubscriptionStep {
  IDLE = 'idle',
  CHECKING_REQUIREMENTS = 'checking_requirements',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  CREATING_INTENT = 'creating_intent',
  WAITING_INTENT_CONFIRMATION = 'waiting_intent_confirmation',
  WAITING_SIGNATURE = 'waiting_signature',
  EXECUTING_PAYMENT = 'executing_payment',
  PROCESSING_COMPLETION = 'processing_completion',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Payment Intent Request Interface
 */
interface PaymentIntentRequest {
  readonly paymentType: 1 // PaymentType.Subscription
  readonly creator: Address
  readonly contentId: bigint // 0 for subscriptions
  readonly paymentToken: Address
  readonly maxSlippage: bigint
  readonly deadline: bigint
}

/**
 * Hook Result Interface
 */
export interface CommerceSubscriptionResult {
  // Requirements and validation
  readonly requirements: {
    readonly subscriptionPrice: bigint
    readonly userBalance: bigint
    readonly hasEnoughBalance: boolean
    readonly canUseCommerceProtocol: boolean
    readonly isLoading: boolean
    readonly error: string | null
  }
  
  // Creator profile
  readonly creatorProfile: {
    readonly isRegistered: boolean
    readonly subscriptionPrice: bigint
    readonly isVerified: boolean
    readonly isLoading: boolean
    readonly error: string | null
  }
  
  // Subscription state
  readonly subscriptionState: {
    readonly currentStep: CommerceSubscriptionStep
    readonly isLoading: boolean
    readonly intentId: `0x${string}` | undefined
    readonly transactionHash: Hash | undefined
    readonly error: Error | null
    readonly progress: number
  }
  
  // Actions
  readonly executeCommerceSubscription: (paymentToken?: Address) => Promise<void>
  readonly reset: () => void
  
  // Convenience flags
  readonly isCreatingIntent: boolean
  readonly isWaitingSignature: boolean
  readonly isExecutingPayment: boolean
  readonly isConfirming: boolean
  readonly hasError: boolean
  readonly isSuccess: boolean
}

// ===== MAIN HOOK IMPLEMENTATION =====

/**
 * Commerce Protocol Subscription Hook
 * 
 * Implements subscription payments through the Commerce Protocol with
 * multi-token support and permit-based gasless approvals.
 */
export function useCommerceProtocolSubscription(
  creatorAddress: Address | undefined,
  userAddress: Address | undefined
): CommerceSubscriptionResult {
  
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const publicClient = usePublicClient()
  const walletClient = useWalletClient()
  
  // Get contract addresses
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses for commerce subscription:', error)
      return null
    }
  }, [chainId])

  // ===== LOCAL STATE MANAGEMENT =====
  
  const [subscriptionState, setSubscriptionState] = useState<CommerceSubscriptionResult['subscriptionState']>({
    currentStep: CommerceSubscriptionStep.IDLE,
    isLoading: false,
    intentId: undefined,
    transactionHash: undefined,
    error: null,
    progress: 0
  })

  // ===== CREATOR PROFILE DATA =====
  
  const creatorProfileQuery = useReadContract({
    address: contractAddresses?.CREATOR_REGISTRY,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getCreatorProfile',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: Boolean(creatorAddress && contractAddresses?.CREATOR_REGISTRY),
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      retry: 3,
    }
  })

  // ===== FINANCIAL DATA =====
  
  const userBalance = useTokenBalance(contractAddresses?.USDC, userAddress)

  // ===== CONTRACT INTERACTION HOOKS =====
  
  const intentWrite = useWriteContract()
  const intentConfirmation = useWaitForTransactionReceipt({
    hash: intentWrite.data,
    query: { enabled: !!intentWrite.data }
  })

  // ===== COMPUTED REQUIREMENTS =====
  
  const requirements = useMemo((): CommerceSubscriptionResult['requirements'] => {
    const defaultRequirements: CommerceSubscriptionResult['requirements'] = {
      subscriptionPrice: BigInt(0),
      userBalance: BigInt(0),
      hasEnoughBalance: false,
      canUseCommerceProtocol: false,
      isLoading: true,
      error: null
    }

    if (
      creatorProfileQuery.isLoading || 
      userBalance.isLoading ||
      !contractAddresses
    ) {
      return defaultRequirements
    }

    if (creatorProfileQuery.isError || userBalance.isError) {
      return {
        ...defaultRequirements,
        isLoading: false,
        error: 'Failed to load subscription requirements'
      }
    }

    const creatorProfile = creatorProfileQuery.data
    if (!creatorProfile || !creatorProfile.isRegistered) {
      return {
        ...defaultRequirements,
        isLoading: false,
        error: 'Creator is not registered or profile unavailable'
      }
    }

    const subscriptionPrice = creatorProfile.subscriptionPrice
    const currentBalance = userBalance.data || BigInt(0)
    const hasEnoughBalance = currentBalance >= subscriptionPrice
    
    // Check if Commerce Protocol Integration is available
    const canUseCommerceProtocol = Boolean(contractAddresses.COMMERCE_INTEGRATION)

    return {
      subscriptionPrice,
      userBalance: currentBalance,
      hasEnoughBalance,
      canUseCommerceProtocol,
      isLoading: false,
      error: null
    }
  }, [
    creatorProfileQuery.data,
    creatorProfileQuery.isLoading,
    creatorProfileQuery.isError,
    userBalance.data,
    userBalance.isLoading,
    userBalance.isError,
    contractAddresses
  ])

  // ===== STEP MANAGEMENT =====
  
  useEffect(() => {
    if (requirements.isLoading) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: CommerceSubscriptionStep.CHECKING_REQUIREMENTS,
        progress: 10
      }))
      return
    }

    if (requirements.error) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: CommerceSubscriptionStep.ERROR,
        error: new Error(requirements.error!),
        progress: 0
      }))
      return
    }

    if (!requirements.hasEnoughBalance) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: CommerceSubscriptionStep.INSUFFICIENT_BALANCE,
        progress: 20
      }))
      return
    }

    if (intentWrite.isPending) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: CommerceSubscriptionStep.CREATING_INTENT,
        progress: 30
      }))
      return
    }

    if (intentConfirmation.isLoading) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: CommerceSubscriptionStep.WAITING_INTENT_CONFIRMATION,
        progress: 40
      }))
      return
    }

    if (intentConfirmation.isSuccess) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: CommerceSubscriptionStep.WAITING_SIGNATURE,
        progress: 50
      }))
      return
    }

    // Default to idle state
    setSubscriptionState(prev => ({
      ...prev,
      currentStep: CommerceSubscriptionStep.IDLE,
      progress: 0
    }))
  }, [
    requirements,
    intentWrite.isPending,
    intentConfirmation.isLoading,
    intentConfirmation.isSuccess
  ])

  // ===== ACTION HANDLERS =====
  
  /**
   * Execute Commerce Protocol Subscription
   * 
   * This function implements the complete Commerce Protocol subscription flow:
   * 1. Create payment intent with PaymentType.Subscription
   * 2. Wait for intent confirmation
   * 3. Backend generates permit signature (off-chain)
   * 4. Execute payment through Commerce Protocol
   * 5. Process subscription completion
   */
  const executeCommerceSubscription = useCallback(async (paymentToken?: Address) => {
    if (!contractAddresses?.COMMERCE_INTEGRATION || !creatorAddress || !userAddress) {
      throw new Error('Required data not available for commerce subscription')
    }

    if (!requirements.hasEnoughBalance) {
      throw new Error('Insufficient balance for subscription')
    }

    if (!requirements.canUseCommerceProtocol) {
      throw new Error('Commerce Protocol not available')
    }

    try {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: CommerceSubscriptionStep.CREATING_INTENT,
        error: null,
        progress: 30
      }))

      // Step 1: Create payment intent with PaymentType.Subscription (1)
      const paymentRequest = {
        paymentType: 1, // PaymentType.Subscription
        creator: creatorAddress,
        contentId: BigInt(0), // 0 for subscriptions
        paymentToken: paymentToken || contractAddresses.USDC,
        maxSlippage: BigInt(200), // 2% slippage tolerance
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour deadline
      }

      await intentWrite.writeContractAsync({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'createPaymentIntent',
        args: [paymentRequest]
      })

      setSubscriptionState(prev => ({
        ...prev,
        transactionHash: intentWrite.data
      }))

      // Note: The rest of the flow (signature waiting, payment execution, completion)
      // will be handled by the backend and the Commerce Protocol integration
      // This is where the permit signature generation and payment execution happens

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Commerce subscription failed'
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: CommerceSubscriptionStep.ERROR,
        error: new Error(errorMessage)
      }))
      throw error
    }
  }, [
    contractAddresses,
    creatorAddress,
    userAddress,
    requirements,
    intentWrite
  ])

  /**
   * Reset Subscription Flow
   */
  const reset = useCallback(() => {
    setSubscriptionState({
      currentStep: CommerceSubscriptionStep.IDLE,
      isLoading: false,
      intentId: undefined,
      transactionHash: undefined,
      error: null,
      progress: 0
    })
    
    intentWrite.reset()
  }, [intentWrite])

  // ===== QUERY INVALIDATION ON SUCCESS =====
  
  useEffect(() => {
    if (subscriptionState.currentStep === CommerceSubscriptionStep.SUCCESS) {
      // Invalidate subscription-related queries
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.some(key => 
            typeof key === 'string' && (
              key.includes('subscription') || 
              key.includes('getUserSubscriptions') ||
              key.includes('getUserActiveSubscriptions')
            )
          )
      })

      // Invalidate balance queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes('balance')
      })
    }
  }, [subscriptionState.currentStep, queryClient])

  // ===== RETURN INTERFACE =====
  
  return {
    // Requirements and validation
    requirements,
    
    // Creator profile
    creatorProfile: {
      isRegistered: creatorProfileQuery.data?.isRegistered || false,
      subscriptionPrice: creatorProfileQuery.data?.subscriptionPrice || BigInt(0),
      isVerified: creatorProfileQuery.data?.isVerified || false,
      isLoading: creatorProfileQuery.isLoading,
      error: creatorProfileQuery.error?.message || null
    },

    // Subscription state
    subscriptionState,
    
    // Actions
    executeCommerceSubscription,
    reset,

    // Convenience flags
    isCreatingIntent: subscriptionState.currentStep === CommerceSubscriptionStep.CREATING_INTENT,
    isWaitingSignature: subscriptionState.currentStep === CommerceSubscriptionStep.WAITING_SIGNATURE,
    isExecutingPayment: subscriptionState.currentStep === CommerceSubscriptionStep.EXECUTING_PAYMENT,
    isConfirming: subscriptionState.currentStep === CommerceSubscriptionStep.CONFIRMING,
    hasError: subscriptionState.currentStep === CommerceSubscriptionStep.ERROR,
    isSuccess: subscriptionState.currentStep === CommerceSubscriptionStep.SUCCESS
  }
}

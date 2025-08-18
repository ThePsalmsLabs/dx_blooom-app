import { useCallback, useMemo, useState, useEffect } from 'react'
import { useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'

// Import your established foundational layers
import { getContractAddresses } from '@/lib/contracts/config'
import { CREATOR_REGISTRY_ABI, SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'
import { useTokenBalance, useTokenAllowance, useApproveToken } from '@/hooks/contracts/core'

// ===== TYPE DEFINITIONS =====

/**
 * Subscription Purchase Flow Steps
 * 
 * This enum represents the user journey through the subscription purchase process.
 * Each step corresponds to a specific UI state and user action.
 */
export enum SubscriptionPurchaseStep {
  IDLE = 'idle',
  CHECKING_REQUIREMENTS = 'checking_requirements',
  INSUFFICIENT_BALANCE = 'insufficient_balance', 
  NEEDS_APPROVAL = 'needs_approval',
  APPROVING = 'approving',
  READY_TO_SUBSCRIBE = 'ready_to_subscribe',
  SUBSCRIBING = 'subscribing',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Purchase Requirements Interface
 * 
 * This interface encapsulates all the financial requirements and validations
 * needed before a user can subscribe to a creator.
 */
interface SubscriptionPurchaseRequirements {
  readonly subscriptionPrice: bigint
  readonly userBalance: bigint
  readonly currentAllowance: bigint
  readonly hasEnoughBalance: boolean
  readonly needsApproval: boolean
  readonly canProceed: boolean
  readonly isLoading: boolean
  readonly error: string | null
}

/**
 * Purchase State Interface
 * 
 * This interface tracks the current state of the subscription purchase process,
 * including progress indicators and error handling.
 */
interface SubscriptionPurchaseState {
  readonly currentStep: SubscriptionPurchaseStep
  readonly isLoading: boolean
  readonly approvalHash: string | undefined
  readonly subscriptionHash: string | undefined
  readonly error: Error | null
  readonly progress: number  // 0-100 for progress indicators
}

/**
 * Hook Result Interface
 * 
 * This is the public interface of the useSubscriptionPurchaseWithApproval hook,
 * designed to provide everything components need for subscription purchase flows.
 */
export interface SubscriptionPurchaseWithApprovalResult {
  // Requirements and validation
  readonly requirements: SubscriptionPurchaseRequirements
  readonly creatorProfile: {
    readonly isRegistered: boolean
    readonly subscriptionPrice: bigint
    readonly isVerified: boolean
    readonly isLoading: boolean
    readonly error: string | null
  }
  
  // Purchase state and progress
  readonly purchaseState: SubscriptionPurchaseState
  readonly currentStep: SubscriptionPurchaseStep
  readonly canApprove: boolean
  readonly canSubscribe: boolean
  
  // Actions
  readonly startApproval: () => Promise<void>
  readonly executeSubscription: () => Promise<void>
  readonly reset: () => void
  
  // Convenience flags for UI
  readonly isApproving: boolean
  readonly isSubscribing: boolean
  readonly isConfirming: boolean
  readonly hasError: boolean
  readonly isSuccess: boolean
}

// ===== MAIN HOOK IMPLEMENTATION =====

/**
 * Enhanced Subscription Purchase Hook with Approval Flow
 * 
 * This hook implements the complete subscription purchase workflow, including:
 * - Creator profile validation
 * - Balance and allowance checking
 * - USDC approval management
 * - Subscription execution
 * - Comprehensive error handling
 * 
 * It follows the same architectural patterns as your content purchase system,
 * ensuring consistency across your platform.
 */
export function useSubscriptionPurchaseWithApproval(
  creatorAddress: Address | undefined,
  userAddress: Address | undefined
): SubscriptionPurchaseWithApprovalResult {
  
  const chainId = useChainId()
  const queryClient = useQueryClient()
  
  // Get contract addresses using your established configuration system
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses for subscription purchase:', error)
      return null
    }
  }, [chainId])

  // ===== LOCAL STATE MANAGEMENT =====
  
  const [purchaseState, setPurchaseState] = useState<SubscriptionPurchaseState>({
    currentStep: SubscriptionPurchaseStep.IDLE,
    isLoading: false,
    approvalHash: undefined,
    subscriptionHash: undefined,
    error: null,
    progress: 0
  })

  // ===== CREATOR PROFILE DATA =====
  
  // Fetch creator profile to get subscription price and validation
  const creatorProfileQuery = useReadContract({
    address: contractAddresses?.CREATOR_REGISTRY,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getCreatorProfile',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: Boolean(creatorAddress && contractAddresses?.CREATOR_REGISTRY),
      staleTime: 1000 * 60 * 2, // 2 minutes - creator data changes infrequently
      gcTime: 1000 * 60 * 10,    // 10 minutes cache retention
      retry: 3,
    }
  })

  // ===== FINANCIAL DATA QUERIES =====
  
  // User's USDC balance using your established pattern
  const userBalance = useTokenBalance(contractAddresses?.USDC, userAddress)
  
  // Current USDC allowance for the SubscriptionManager contract
  const usdcAllowance = useTokenAllowance(
    contractAddresses?.USDC,
    userAddress,
    contractAddresses?.SUBSCRIPTION_MANAGER
  )

  // ===== CONTRACT INTERACTION HOOKS =====
  
  // Approval functionality using your established pattern
  const approveToken = useApproveToken()
  
  // Subscription purchase transaction management
  const subscriptionWrite = useWriteContract()
  const subscriptionConfirmation = useWaitForTransactionReceipt({
    hash: subscriptionWrite.data,
    query: { enabled: !!subscriptionWrite.data }
  })

  // ===== COMPUTED REQUIREMENTS =====
  
  const requirements = useMemo((): SubscriptionPurchaseRequirements => {
    // Default state when data is not available
    const defaultRequirements: SubscriptionPurchaseRequirements = {
      subscriptionPrice: BigInt(0),
      userBalance: BigInt(0),
      currentAllowance: BigInt(0),
      hasEnoughBalance: false,
      needsApproval: false,
      canProceed: false,
      isLoading: true,
      error: null
    }

    // Return loading state if any critical data is still loading
    if (
      creatorProfileQuery.isLoading || 
      userBalance.isLoading || 
      usdcAllowance.isLoading ||
      !contractAddresses
    ) {
      return defaultRequirements
    }

    // Handle errors in data fetching
    if (creatorProfileQuery.isError || userBalance.isError || usdcAllowance.isError) {
      return {
        ...defaultRequirements,
        isLoading: false,
        error: 'Failed to load subscription requirements'
      }
    }

    // Extract creator profile data with type safety
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
    const currentAllowance = usdcAllowance.data || BigInt(0)

    // Calculate financial requirements
    const hasEnoughBalance = currentBalance >= subscriptionPrice
    const needsApproval = currentAllowance < subscriptionPrice
    const canProceed = hasEnoughBalance && !needsApproval

    return {
      subscriptionPrice,
      userBalance: currentBalance,
      currentAllowance,
      hasEnoughBalance,
      needsApproval,
      canProceed,
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
    usdcAllowance.data,
    usdcAllowance.isLoading,
    usdcAllowance.isError,
    contractAddresses
  ])

  // ===== STEP MANAGEMENT =====
  
  // Automatically update the current step based on requirements and transaction states
  useEffect(() => {
    if (requirements.isLoading) {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.CHECKING_REQUIREMENTS,
        progress: 10
      }))
      return
    }

    if (requirements.error) {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.ERROR,
        error: new Error(requirements.error!),
        progress: 0
      }))
      return
    }

    if (!requirements.hasEnoughBalance) {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.INSUFFICIENT_BALANCE,
        progress: 20
      }))
      return
    }

    if (requirements.needsApproval && !approveToken.isConfirmed) {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.NEEDS_APPROVAL,
        progress: 30
      }))
      return
    }

    if (approveToken.isLoading || approveToken.isConfirming) {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.APPROVING,
        progress: 50
      }))
      return
    }

    if (subscriptionWrite.isPending) {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.SUBSCRIBING,
        progress: 70
      }))
      return
    }

    if (subscriptionConfirmation.isLoading) {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.CONFIRMING,
        progress: 90
      }))
      return
    }

    if (subscriptionConfirmation.isSuccess) {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.SUCCESS,
        progress: 100
      }))
      return
    }

    if (requirements.canProceed) {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.READY_TO_SUBSCRIBE,
        progress: 60
      }))
      return
    }

    // Default to idle state
    setPurchaseState(prev => ({
      ...prev,
      currentStep: SubscriptionPurchaseStep.IDLE,
      progress: 0
    }))
  }, [
    requirements,
    approveToken.isLoading,
    approveToken.isConfirming,
    approveToken.isConfirmed,
    subscriptionWrite.isPending,
    subscriptionConfirmation.isLoading,
    subscriptionConfirmation.isSuccess
  ])

  // ===== ACTION HANDLERS =====
  
  /**
   * Start Approval Process
   * 
   * This function initiates the USDC approval transaction, allowing the
   * SubscriptionManager contract to spend the required subscription amount.
   */
  const startApproval = useCallback(async () => {
    if (!contractAddresses?.USDC || !contractAddresses?.SUBSCRIPTION_MANAGER) {
      throw new Error('Contract addresses not available')
    }

    if (!requirements.needsApproval) {
      throw new Error('Approval not needed')
    }

    try {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.APPROVING,
        error: null
      }))

      await approveToken.write({
        tokenAddress: contractAddresses.USDC,
        spender: contractAddresses.SUBSCRIPTION_MANAGER,
        amount: requirements.subscriptionPrice
      })

      setPurchaseState(prev => ({
        ...prev,
        approvalHash: approveToken.hash
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Approval failed'
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.ERROR,
        error: new Error(errorMessage)
      }))
      throw error
    }
  }, [contractAddresses, requirements, approveToken])

  /**
   * Execute Subscription Purchase
   * 
   * This function executes the actual subscription transaction once all
   * requirements are met (balance sufficient, approval granted).
   */
  const executeSubscription = useCallback(async () => {
    if (!contractAddresses?.SUBSCRIPTION_MANAGER || !creatorAddress) {
      throw new Error('Required data not available for subscription')
    }

    if (!requirements.canProceed && requirements.needsApproval) {
      throw new Error('Requirements not met for subscription')
    }

    try {
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.SUBSCRIBING,
        error: null
      }))

      await subscriptionWrite.writeContractAsync({
        address: contractAddresses.SUBSCRIPTION_MANAGER,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'subscribeToCreator',
        args: [creatorAddress]
      })

      setPurchaseState(prev => ({
        ...prev,
        subscriptionHash: subscriptionWrite.data
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Subscription failed'
      setPurchaseState(prev => ({
        ...prev,
        currentStep: SubscriptionPurchaseStep.ERROR,
        error: new Error(errorMessage)
      }))
      throw error
    }
  }, [contractAddresses, creatorAddress, requirements, subscriptionWrite])

  /**
   * Reset Purchase Flow
   * 
   * This function resets the entire purchase flow to its initial state,
   * useful for handling errors or starting over.
   */
  const reset = useCallback(() => {
    setPurchaseState({
      currentStep: SubscriptionPurchaseStep.IDLE,
      isLoading: false,
      approvalHash: undefined,
      subscriptionHash: undefined,
      error: null,
      progress: 0
    })
    
    approveToken.reset()
    subscriptionWrite.reset()
  }, [approveToken, subscriptionWrite])

  // ===== QUERY INVALIDATION ON SUCCESS =====
  
  // Invalidate relevant queries when subscription is successful
  useEffect(() => {
    if (subscriptionConfirmation.isSuccess) {
      // Invalidate subscription-related queries to reflect the new subscription
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

      // Also invalidate allowance queries since some USDC was spent
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey.includes('allowance') || query.queryKey.includes('balance')
      })
    }
  }, [subscriptionConfirmation.isSuccess, queryClient])

  // ===== RETURN INTERFACE =====
  
  return {
    // Requirements and validation data
    requirements,
    creatorProfile: {
      isRegistered: creatorProfileQuery.data?.isRegistered || false,
      subscriptionPrice: creatorProfileQuery.data?.subscriptionPrice || BigInt(0),
      isVerified: creatorProfileQuery.data?.isVerified || false,
      isLoading: creatorProfileQuery.isLoading,
      error: creatorProfileQuery.error?.message || null
    },

    // Purchase state and progress tracking
    purchaseState,
    currentStep: purchaseState.currentStep,
    canApprove: requirements.needsApproval && requirements.hasEnoughBalance,
    canSubscribe: requirements.canProceed || (!requirements.needsApproval && requirements.hasEnoughBalance),

    // Action functions
    startApproval,
    executeSubscription,
    reset,

    // Convenience flags for UI rendering
    isApproving: purchaseState.currentStep === SubscriptionPurchaseStep.APPROVING,
    isSubscribing: purchaseState.currentStep === SubscriptionPurchaseStep.SUBSCRIBING,
    isConfirming: purchaseState.currentStep === SubscriptionPurchaseStep.CONFIRMING,
    hasError: purchaseState.currentStep === SubscriptionPurchaseStep.ERROR,
    isSuccess: purchaseState.currentStep === SubscriptionPurchaseStep.SUCCESS
  }
}
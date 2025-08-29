/**
 * Unified Subscription Flow Hook
 * 
 * This hook provides a unified interface for subscription flows, automatically
 * choosing the best strategy based on token support and user preferences:
 * 
 * 1. Commerce Protocol subscription - Multi-token support with permit (recommended)
 * 2. Direct USDC subscription with permit - Single transaction for USDC only
 * 3. Traditional approval + subscription - Two transactions, maximum compatibility
 * 
 * The hook automatically detects which strategy is available and provides
 * a consistent interface regardless of the underlying implementation.
 * 
 * File: src/hooks/contracts/subscription/useUnifiedSubscriptionFlow.ts
 */

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useChainId, useReadContract, usePublicClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { type Address } from 'viem'

// Import all subscription strategies
import { 
  useSubscriptionPurchaseWithApproval, 
  SubscriptionPurchaseStep,
  type SubscriptionPurchaseWithApprovalResult 
} from './useSubscriptionWithApproval'
import { 
  useSubscriptionWithPermit,
  PermitSubscriptionStep,
  type PermitSubscriptionResult 
} from './useSubscriptionWithPermit'
import {
  useCommerceProtocolSubscription,
  CommerceSubscriptionStep,
  type CommerceSubscriptionResult
} from './useCommerceProtocolSubscription'

// Import contract configuration
import { getContractAddresses } from '@/lib/contracts/config'
import { ERC20_ABI } from '@/lib/contracts/abis'

// ===== TYPE DEFINITIONS =====

/**
 * Subscription Strategy Types
 */
export type SubscriptionStrategy = 'commerce_protocol' | 'permit' | 'approval' | 'auto'

/**
 * Unified Subscription Steps
 */
export enum UnifiedSubscriptionStep {
  IDLE = 'idle',
  CHECKING_REQUIREMENTS = 'checking_requirements',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  SELECTING_STRATEGY = 'selecting_strategy',
  CREATING_INTENT = 'creating_intent',
  GENERATING_PERMIT = 'generating_permit',
  SIGNING_PERMIT = 'signing_permit',
  NEEDS_APPROVAL = 'needs_approval',
  APPROVING = 'approving',
  EXECUTING_SUBSCRIPTION = 'executing_subscription',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Unified Hook Result Interface
 */
export interface UnifiedSubscriptionResult {
  // Strategy information
  readonly selectedStrategy: SubscriptionStrategy
  readonly availableStrategies: SubscriptionStrategy[]
  readonly canUsePermit: boolean
  readonly canUseCommerceProtocol: boolean
  
  // Requirements and validation
  readonly requirements: {
    readonly subscriptionPrice: bigint
    readonly userBalance: bigint
    readonly hasEnoughBalance: boolean
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
    readonly currentStep: UnifiedSubscriptionStep
    readonly isLoading: boolean
    readonly transactionHash: string | undefined
    readonly error: Error | null
    readonly progress: number
  }
  
  // Actions
  readonly executeSubscription: (paymentToken?: Address) => Promise<void>
  readonly setStrategy: (strategy: SubscriptionStrategy) => void
  readonly reset: () => void
  
  // Convenience flags
  readonly isSigning: boolean
  readonly isApproving: boolean
  readonly isExecuting: boolean
  readonly isConfirming: boolean
  readonly hasError: boolean
  readonly isSuccess: boolean
}

// ===== UTILITY FUNCTIONS =====

/**
 * Check if USDC supports EIP-2612 permit
 */
async function checkPermitSupport(
  publicClient: any,
  usdcAddress: Address
): Promise<boolean> {
  try {
    // Try to read the DOMAIN_SEPARATOR function which is part of EIP-2612
    await publicClient.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'DOMAIN_SEPARATOR'
    })
    return true
  } catch {
    return false
  }
}

// ===== MAIN HOOK IMPLEMENTATION =====

/**
 * Unified Subscription Flow Hook
 * 
 * Provides a unified interface for subscription flows with automatic
 * strategy selection based on token capabilities and contract availability.
 */
export function useUnifiedSubscriptionFlow(
  creatorAddress: Address | undefined,
  userAddress: Address | undefined,
  preferredStrategy: SubscriptionStrategy = 'auto'
): UnifiedSubscriptionResult {
  
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const publicClient = usePublicClient()
  
  // Get contract addresses
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses for unified subscription:', error)
      return null
    }
  }, [chainId])

  // ===== STRATEGY DETECTION =====
  
  const [permitSupport, setPermitSupport] = useState<boolean | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<SubscriptionStrategy>(preferredStrategy)
  
  // Check permit support
  useEffect(() => {
    if (!contractAddresses?.USDC || !publicClient) return
    
    checkPermitSupport(publicClient, contractAddresses.USDC)
      .then(setPermitSupport)
      .catch(() => setPermitSupport(false))
  }, [contractAddresses?.USDC, publicClient])
  
  // Available strategies
  const availableStrategies = useMemo((): SubscriptionStrategy[] => {
    const strategies: SubscriptionStrategy[] = ['approval'] // Always available
    
    // Check if Commerce Protocol Integration is available
    if (contractAddresses?.COMMERCE_INTEGRATION) {
      strategies.unshift('commerce_protocol') // Add as first option if available
    }
    
    // Check if permit is supported
    if (permitSupport === true) {
      strategies.push('permit') // Add permit option if supported
    }
    
    return strategies
  }, [permitSupport, contractAddresses?.COMMERCE_INTEGRATION])
  
  // Auto-select best strategy
  useEffect(() => {
    if (selectedStrategy === 'auto' && availableStrategies.length > 0) {
      setSelectedStrategy(availableStrategies[0]) // Use first (best) available strategy
    }
  }, [selectedStrategy, availableStrategies])
  
  // ===== HOOK INSTANCES =====
  
  // Initialize all hooks but only use the selected one
  const approvalFlow = useSubscriptionPurchaseWithApproval(creatorAddress, userAddress)
  const permitFlow = useSubscriptionWithPermit(creatorAddress, userAddress)
  const commerceFlow = useCommerceProtocolSubscription(creatorAddress, userAddress)
  
  // ===== UNIFIED STATE MANAGEMENT =====
  
  const [unifiedState, setUnifiedState] = useState<UnifiedSubscriptionResult['subscriptionState']>({
    currentStep: UnifiedSubscriptionStep.IDLE,
    isLoading: false,
    transactionHash: undefined,
    error: null,
    progress: 0
  })
  
  // ===== STRATEGY SELECTION =====
  
  const setStrategy = useCallback((strategy: SubscriptionStrategy) => {
    if (strategy === 'auto') {
      setSelectedStrategy(availableStrategies[0] || 'approval')
    } else if (availableStrategies.includes(strategy)) {
      setSelectedStrategy(strategy)
    } else {
      console.warn(`Strategy ${strategy} not available, using ${availableStrategies[0] || 'approval'}`)
      setSelectedStrategy(availableStrategies[0] || 'approval')
    }
  }, [availableStrategies])
  
  // ===== UNIFIED REQUIREMENTS =====
  
  const requirements = useMemo(() => {
    let activeFlow: any
    
    switch (selectedStrategy) {
      case 'commerce_protocol':
        activeFlow = commerceFlow
        break
      case 'permit':
        activeFlow = permitFlow
        break
      default:
        activeFlow = approvalFlow
    }
    
    return {
      subscriptionPrice: activeFlow.requirements.subscriptionPrice,
      userBalance: activeFlow.requirements.userBalance,
      hasEnoughBalance: activeFlow.requirements.hasEnoughBalance,
      isLoading: activeFlow.requirements.isLoading,
      error: activeFlow.requirements.error
    }
  }, [selectedStrategy, permitFlow.requirements, approvalFlow.requirements, commerceFlow.requirements])
  
  // ===== UNIFIED CREATOR PROFILE =====
  
  const creatorProfile = useMemo(() => {
    let activeFlow: any
    
    switch (selectedStrategy) {
      case 'commerce_protocol':
        activeFlow = commerceFlow
        break
      case 'permit':
        activeFlow = permitFlow
        break
      default:
        activeFlow = approvalFlow
    }
    
    return {
      isRegistered: activeFlow.creatorProfile.isRegistered,
      subscriptionPrice: activeFlow.creatorProfile.subscriptionPrice,
      isVerified: activeFlow.creatorProfile.isVerified,
      isLoading: activeFlow.creatorProfile.isLoading,
      error: activeFlow.creatorProfile.error
    }
  }, [selectedStrategy, permitFlow.creatorProfile, approvalFlow.creatorProfile, commerceFlow.creatorProfile])
  
  // ===== STEP MAPPING =====
  
  // Map internal steps to unified steps
  useEffect(() => {
    let activeFlow: any
    let unifiedStep: UnifiedSubscriptionStep
    let progress: number
    
    switch (selectedStrategy) {
      case 'commerce_protocol':
        activeFlow = commerceFlow
        switch (activeFlow.subscriptionState.currentStep) {
          case CommerceSubscriptionStep.IDLE:
            unifiedStep = UnifiedSubscriptionStep.IDLE
            progress = 0
            break
          case CommerceSubscriptionStep.CHECKING_REQUIREMENTS:
            unifiedStep = UnifiedSubscriptionStep.CHECKING_REQUIREMENTS
            progress = 10
            break
          case CommerceSubscriptionStep.INSUFFICIENT_BALANCE:
            unifiedStep = UnifiedSubscriptionStep.INSUFFICIENT_BALANCE
            progress = 20
            break
          case CommerceSubscriptionStep.CREATING_INTENT:
            unifiedStep = UnifiedSubscriptionStep.CREATING_INTENT
            progress = 30
            break
          case CommerceSubscriptionStep.WAITING_INTENT_CONFIRMATION:
            unifiedStep = UnifiedSubscriptionStep.CONFIRMING
            progress = 50
            break
          case CommerceSubscriptionStep.WAITING_SIGNATURE:
            unifiedStep = UnifiedSubscriptionStep.CONFIRMING
            progress = 60
            break
          case CommerceSubscriptionStep.EXECUTING_PAYMENT:
            unifiedStep = UnifiedSubscriptionStep.EXECUTING_SUBSCRIPTION
            progress = 70
            break
          case CommerceSubscriptionStep.PROCESSING_COMPLETION:
            unifiedStep = UnifiedSubscriptionStep.CONFIRMING
            progress = 80
            break
          case CommerceSubscriptionStep.CONFIRMING:
            unifiedStep = UnifiedSubscriptionStep.CONFIRMING
            progress = 90
            break
          case CommerceSubscriptionStep.SUCCESS:
            unifiedStep = UnifiedSubscriptionStep.SUCCESS
            progress = 100
            break
          case CommerceSubscriptionStep.ERROR:
            unifiedStep = UnifiedSubscriptionStep.ERROR
            progress = 0
            break
          default:
            unifiedStep = UnifiedSubscriptionStep.IDLE
            progress = 0
        }
        break
        
      case 'permit':
        activeFlow = permitFlow
        switch (activeFlow.subscriptionState.currentStep) {
          case PermitSubscriptionStep.IDLE:
            unifiedStep = UnifiedSubscriptionStep.IDLE
            progress = 0
            break
          case PermitSubscriptionStep.CHECKING_REQUIREMENTS:
            unifiedStep = UnifiedSubscriptionStep.CHECKING_REQUIREMENTS
            progress = 10
            break
          case PermitSubscriptionStep.INSUFFICIENT_BALANCE:
            unifiedStep = UnifiedSubscriptionStep.INSUFFICIENT_BALANCE
            progress = 20
            break
          case PermitSubscriptionStep.GENERATING_PERMIT:
            unifiedStep = UnifiedSubscriptionStep.GENERATING_PERMIT
            progress = 30
            break
          case PermitSubscriptionStep.SIGNING_PERMIT:
            unifiedStep = UnifiedSubscriptionStep.SIGNING_PERMIT
            progress = 40
            break
          case PermitSubscriptionStep.EXECUTING_SUBSCRIPTION:
            unifiedStep = UnifiedSubscriptionStep.EXECUTING_SUBSCRIPTION
            progress = 70
            break
          case PermitSubscriptionStep.CONFIRMING:
            unifiedStep = UnifiedSubscriptionStep.CONFIRMING
            progress = 90
            break
          case PermitSubscriptionStep.SUCCESS:
            unifiedStep = UnifiedSubscriptionStep.SUCCESS
            progress = 100
            break
          case PermitSubscriptionStep.ERROR:
            unifiedStep = UnifiedSubscriptionStep.ERROR
            progress = 0
            break
          default:
            unifiedStep = UnifiedSubscriptionStep.IDLE
            progress = 0
        }
        break
        
      default:
        activeFlow = approvalFlow
        switch (activeFlow.currentStep) {
          case SubscriptionPurchaseStep.IDLE:
            unifiedStep = UnifiedSubscriptionStep.IDLE
            progress = 0
            break
          case SubscriptionPurchaseStep.CHECKING_REQUIREMENTS:
            unifiedStep = UnifiedSubscriptionStep.CHECKING_REQUIREMENTS
            progress = 10
            break
          case SubscriptionPurchaseStep.INSUFFICIENT_BALANCE:
            unifiedStep = UnifiedSubscriptionStep.INSUFFICIENT_BALANCE
            progress = 20
            break
          case SubscriptionPurchaseStep.NEEDS_APPROVAL:
            unifiedStep = UnifiedSubscriptionStep.NEEDS_APPROVAL
            progress = 30
            break
          case SubscriptionPurchaseStep.APPROVING:
            unifiedStep = UnifiedSubscriptionStep.APPROVING
            progress = 50
            break
          case SubscriptionPurchaseStep.READY_TO_SUBSCRIBE:
            unifiedStep = UnifiedSubscriptionStep.IDLE
            progress = 60
            break
          case SubscriptionPurchaseStep.SUBSCRIBING:
            unifiedStep = UnifiedSubscriptionStep.EXECUTING_SUBSCRIPTION
            progress = 70
            break
          case SubscriptionPurchaseStep.CONFIRMING:
            unifiedStep = UnifiedSubscriptionStep.CONFIRMING
            progress = 90
            break
          case SubscriptionPurchaseStep.SUCCESS:
            unifiedStep = UnifiedSubscriptionStep.SUCCESS
            progress = 100
            break
          case SubscriptionPurchaseStep.ERROR:
            unifiedStep = UnifiedSubscriptionStep.ERROR
            progress = 0
            break
          default:
            unifiedStep = UnifiedSubscriptionStep.IDLE
            progress = 0
        }
    }
    
    setUnifiedState({
      currentStep: unifiedStep,
      isLoading: activeFlow.subscriptionState?.isLoading || activeFlow.purchaseState?.isLoading || false,
      transactionHash: activeFlow.subscriptionState?.transactionHash || activeFlow.purchaseState?.subscriptionHash,
      error: activeFlow.subscriptionState?.error || activeFlow.purchaseState?.error,
      progress
    })
  }, [selectedStrategy, permitFlow, approvalFlow, commerceFlow])
  
  // ===== UNIFIED ACTIONS =====
  
  const executeSubscription = useCallback(async (paymentToken?: Address) => {
    try {
      switch (selectedStrategy) {
        case 'commerce_protocol':
          await commerceFlow.executeCommerceSubscription(paymentToken)
          break
        case 'permit':
          await permitFlow.executePermitSubscription()
          break
        default:
          // For approval flow, we need to handle the two-step process
          if (approvalFlow.requirements.needsApproval) {
            await approvalFlow.startApproval()
          } else {
            await approvalFlow.executeSubscription()
          }
      }
    } catch (error) {
      console.error('Unified subscription execution failed:', error)
      throw error
    }
  }, [selectedStrategy, permitFlow, approvalFlow, commerceFlow])
  
  const reset = useCallback(() => {
    switch (selectedStrategy) {
      case 'commerce_protocol':
        commerceFlow.reset()
        break
      case 'permit':
        permitFlow.reset()
        break
      default:
        approvalFlow.reset()
    }
  }, [selectedStrategy, permitFlow, approvalFlow, commerceFlow])
  
  // ===== RETURN INTERFACE =====
  
  return {
    // Strategy information
    selectedStrategy,
    availableStrategies,
    canUsePermit: permitSupport === true,
    canUseCommerceProtocol: Boolean(contractAddresses?.COMMERCE_INTEGRATION),
    
    // Requirements and validation
    requirements,
    
    // Creator profile
    creatorProfile,
    
    // Subscription state
    subscriptionState: unifiedState,
    
    // Actions
    executeSubscription,
    setStrategy,
    reset,
    
    // Convenience flags
    isSigning: selectedStrategy === 'permit' ? permitFlow.isSigning : false,
    isApproving: selectedStrategy === 'approval' ? approvalFlow.isApproving : false,
    isExecuting: selectedStrategy === 'permit' ? permitFlow.isExecuting : 
                 selectedStrategy === 'commerce_protocol' ? commerceFlow.isExecutingPayment :
                 approvalFlow.isSubscribing,
    isConfirming: selectedStrategy === 'permit' ? permitFlow.isConfirming : 
                  selectedStrategy === 'commerce_protocol' ? commerceFlow.isConfirming :
                  approvalFlow.isConfirming,
    hasError: unifiedState.currentStep === UnifiedSubscriptionStep.ERROR,
    isSuccess: unifiedState.currentStep === UnifiedSubscriptionStep.SUCCESS
  }
}

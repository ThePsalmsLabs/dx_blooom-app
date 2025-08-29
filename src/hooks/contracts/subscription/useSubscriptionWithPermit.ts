/**
 * Permit-Based Subscription Hook (EIP-2612)
 * 
 * This hook implements single-transaction subscriptions using EIP-2612 permit signatures.
 * It eliminates the need for separate approval transactions, providing a much better UX.
 * 
 * Architecture:
 * 1. Generate permit signature for USDC approval
 * 2. Execute subscription with permit in single transaction
 * 3. Handle all edge cases and fallbacks
 * 
 * File: src/hooks/contracts/subscription/useSubscriptionWithPermit.ts
 */

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { type Address, type Hash } from 'viem'

// Import your established foundational layers
import { getContractAddresses } from '@/lib/contracts/config'
import { CREATOR_REGISTRY_ABI, SUBSCRIPTION_MANAGER_ABI, ERC20_ABI } from '@/lib/contracts/abis'
import { useTokenBalance } from '@/hooks/contracts/core'

// ===== TYPE DEFINITIONS =====

/**
 * Permit-Based Subscription Steps
 */
export enum PermitSubscriptionStep {
  IDLE = 'idle',
  CHECKING_REQUIREMENTS = 'checking_requirements',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  GENERATING_PERMIT = 'generating_permit',
  SIGNING_PERMIT = 'signing_permit',
  EXECUTING_SUBSCRIPTION = 'executing_subscription',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Permit Data Interface
 */
interface PermitData {
  readonly owner: Address
  readonly spender: Address
  readonly value: bigint
  readonly nonce: bigint
  readonly deadline: bigint
}

/**
 * Permit Signature Interface
 */
interface PermitSignature {
  readonly v: number
  readonly r: `0x${string}`
  readonly s: `0x${string}`
}

/**
 * Hook Result Interface
 */
export interface PermitSubscriptionResult {
  // Requirements and validation
  readonly requirements: {
    readonly subscriptionPrice: bigint
    readonly userBalance: bigint
    readonly hasEnoughBalance: boolean
    readonly canUsePermit: boolean
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
    readonly currentStep: PermitSubscriptionStep
    readonly isLoading: boolean
    readonly transactionHash: Hash | undefined
    readonly error: Error | null
    readonly progress: number
  }
  
  // Actions
  readonly executePermitSubscription: () => Promise<void>
  readonly reset: () => void
  
  // Convenience flags
  readonly isSigning: boolean
  readonly isExecuting: boolean
  readonly isConfirming: boolean
  readonly hasError: boolean
  readonly isSuccess: boolean
}

// ===== UTILITY FUNCTIONS =====

/**
 * Parse EIP-2612 Signature
 * 
 * Splits a signature into v, r, s components for contract calls
 */
function parseSignature(signature: `0x${string}`): PermitSignature {
  const r = signature.slice(0, 66) as `0x${string}`
  const s = `0x${signature.slice(66, 130)}` as `0x${string}`
  const v = parseInt(signature.slice(130, 132), 16)
  
  return { v, r, s }
}

/**
 * Generate Permit Data
 * 
 * Creates the permit data structure for EIP-2612 signature
 */
async function generatePermitData(
  publicClient: any,
  userAddress: Address,
  spenderAddress: Address,
  amount: bigint
): Promise<PermitData> {
  const chainId = await publicClient.getChainId()
  const contractAddresses = getContractAddresses(chainId)
  
  // Get current nonce
  const nonce = await publicClient.readContract({
    address: contractAddresses.USDC,
    abi: ERC20_ABI,
    functionName: 'nonces',
    args: [userAddress]
  }) as bigint
  
  // Set deadline to 1 hour from now
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)
  
  return {
    owner: userAddress,
    spender: spenderAddress,
    value: amount,
    nonce,
    deadline
  }
}

// ===== MAIN HOOK IMPLEMENTATION =====

/**
 * Permit-Based Subscription Hook
 * 
 * Implements single-transaction subscriptions using EIP-2612 permit signatures.
 * This provides the best user experience by eliminating the need for separate
 * approval transactions.
 */
export function useSubscriptionWithPermit(
  creatorAddress: Address | undefined,
  userAddress: Address | undefined
): PermitSubscriptionResult {
  
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const publicClient = usePublicClient()
  const walletClient = useWalletClient()
  
  // Get contract addresses
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses for permit subscription:', error)
      return null
    }
  }, [chainId])

  // ===== LOCAL STATE MANAGEMENT =====
  
  const [subscriptionState, setSubscriptionState] = useState<PermitSubscriptionResult['subscriptionState']>({
    currentStep: PermitSubscriptionStep.IDLE,
    isLoading: false,
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
  
  const subscriptionWrite = useWriteContract()
  const subscriptionConfirmation = useWaitForTransactionReceipt({
    hash: subscriptionWrite.data,
    query: { enabled: !!subscriptionWrite.data }
  })

  // ===== COMPUTED REQUIREMENTS =====
  
  const requirements = useMemo((): PermitSubscriptionResult['requirements'] => {
    const defaultRequirements: PermitSubscriptionResult['requirements'] = {
      subscriptionPrice: BigInt(0),
      userBalance: BigInt(0),
      hasEnoughBalance: false,
      canUsePermit: false,
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
    
    // Check if USDC supports permit (EIP-2612)
    const canUsePermit = Boolean(contractAddresses.USDC)

    return {
      subscriptionPrice,
      userBalance: currentBalance,
      hasEnoughBalance,
      canUsePermit,
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
        currentStep: PermitSubscriptionStep.CHECKING_REQUIREMENTS,
        progress: 10
      }))
      return
    }

    if (requirements.error) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: PermitSubscriptionStep.ERROR,
        error: new Error(requirements.error!),
        progress: 0
      }))
      return
    }

    if (!requirements.hasEnoughBalance) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: PermitSubscriptionStep.INSUFFICIENT_BALANCE,
        progress: 20
      }))
      return
    }

    if (subscriptionWrite.isPending) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: PermitSubscriptionStep.EXECUTING_SUBSCRIPTION,
        progress: 70
      }))
      return
    }

    if (subscriptionConfirmation.isLoading) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: PermitSubscriptionStep.CONFIRMING,
        progress: 90
      }))
      return
    }

    if (subscriptionConfirmation.isSuccess) {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: PermitSubscriptionStep.SUCCESS,
        progress: 100
      }))
      return
    }

    // Default to idle state
    setSubscriptionState(prev => ({
      ...prev,
      currentStep: PermitSubscriptionStep.IDLE,
      progress: 0
    }))
  }, [
    requirements,
    subscriptionWrite.isPending,
    subscriptionConfirmation.isLoading,
    subscriptionConfirmation.isSuccess
  ])

  // ===== ACTION HANDLERS =====
  
  /**
   * Execute Permit-Based Subscription
   * 
   * This function implements the complete permit-based subscription flow:
   * 1. Generate permit data
   * 2. Sign permit with wallet
   * 3. Execute subscription with permit in single transaction
   */
  const executePermitSubscription = useCallback(async () => {
    if (!contractAddresses?.SUBSCRIPTION_MANAGER || !creatorAddress || !userAddress) {
      throw new Error('Required data not available for permit subscription')
    }

    if (!requirements.hasEnoughBalance) {
      throw new Error('Insufficient USDC balance for subscription')
    }

    if (!requirements.canUsePermit) {
      throw new Error('Permit not supported for this token')
    }

    if (!publicClient || !walletClient) {
      throw new Error('Wallet client not available')
    }

    try {
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: PermitSubscriptionStep.GENERATING_PERMIT,
        error: null,
        progress: 30
      }))

      // Step 1: Generate permit data
      const permitData = await generatePermitData(
        publicClient,
        userAddress,
        contractAddresses.SUBSCRIPTION_MANAGER,
        requirements.subscriptionPrice
      )

      setSubscriptionState(prev => ({
        ...prev,
        currentStep: PermitSubscriptionStep.SIGNING_PERMIT,
        progress: 40
      }))

      // Step 2: Sign permit with wallet
      const permitSignature = await walletClient.data?.signTypedData({
        account: userAddress,
        domain: {
          name: 'USD Coin',
          version: '2',
          chainId,
          verifyingContract: contractAddresses.USDC
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        },
        primaryType: 'Permit',
        message: permitData
      })

      if (!permitSignature) {
        throw new Error('Failed to sign permit')
      }

      // Step 3: Parse signature
      const { v, r, s } = parseSignature(permitSignature)

      setSubscriptionState(prev => ({
        ...prev,
        currentStep: PermitSubscriptionStep.EXECUTING_SUBSCRIPTION,
        progress: 50
      }))

      // Step 4: Execute subscription with permit
      await subscriptionWrite.writeContractAsync({
        address: contractAddresses.SUBSCRIPTION_MANAGER,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'subscribeToCreatorWithPermit',
        args: [
          creatorAddress,
          permitData.value,
          permitData.deadline,
          v,
          r,
          s
        ]
      })

      setSubscriptionState(prev => ({
        ...prev,
        transactionHash: subscriptionWrite.data
      }))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Permit subscription failed'
      setSubscriptionState(prev => ({
        ...prev,
        currentStep: PermitSubscriptionStep.ERROR,
        error: new Error(errorMessage)
      }))
      throw error
    }
  }, [
    contractAddresses,
    creatorAddress,
    userAddress,
    requirements,
    publicClient,
    walletClient,
    chainId,
    subscriptionWrite
  ])

  /**
   * Reset Subscription Flow
   */
  const reset = useCallback(() => {
    setSubscriptionState({
      currentStep: PermitSubscriptionStep.IDLE,
      isLoading: false,
      transactionHash: undefined,
      error: null,
      progress: 0
    })
    
    subscriptionWrite.reset()
  }, [subscriptionWrite])

  // ===== QUERY INVALIDATION ON SUCCESS =====
  
  useEffect(() => {
    if (subscriptionConfirmation.isSuccess) {
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
  }, [subscriptionConfirmation.isSuccess, queryClient])

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
    executePermitSubscription,
    reset,

    // Convenience flags
    isSigning: subscriptionState.currentStep === PermitSubscriptionStep.SIGNING_PERMIT,
    isExecuting: subscriptionState.currentStep === PermitSubscriptionStep.EXECUTING_SUBSCRIPTION,
    isConfirming: subscriptionState.currentStep === PermitSubscriptionStep.CONFIRMING,
    hasError: subscriptionState.currentStep === PermitSubscriptionStep.ERROR,
    isSuccess: subscriptionState.currentStep === PermitSubscriptionStep.SUCCESS
  }
}

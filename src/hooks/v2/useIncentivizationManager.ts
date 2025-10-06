/**
 * Incentivization Manager - V2 Rewards and Loyalty System
 * 
 * Integrates with actual LoyaltyManager and RewardsIntegration contracts
 * for real on-chain reward processing and loyalty point management.
 * NO PLACEHOLDER LOGIC - uses actual contracts only.
 */

import { useMutation } from '@tanstack/react-query'
import { useAccount, useChainId, useReadContract, useWriteContract } from 'wagmi'
import { type Address, type Hash } from 'viem'
import { toast } from 'sonner'
import { getContractConfig } from '@/lib/contracts/config'
import { LOYALTY_MANAGER_ABI } from '@/lib/contracts/abis/v2ABIs/LoyaltyManager'
import { REWARDS_INTEGRATION_ABI } from '@/lib/contracts/abis/v2ABIs/RewardsIntegration'

// Explicit contract typing to work around wagmi's complex type inference
type LoyaltyContractConfig = {
  address: `0x${string}`
  abi: typeof LOYALTY_MANAGER_ABI
}

type RewardsContractConfig = {
  address: `0x${string}`
  abi: typeof REWARDS_INTEGRATION_ABI
}

// Types for real contract integration - matching ABI exactly
export interface UserLoyaltyData {
  totalPoints: bigint
  availablePoints: bigint
  currentTier: number // 0=Bronze, 1=Silver, 2=Gold, 3=Platinum, 4=Diamond
  totalSpent: bigint
  purchaseCount: bigint
  lastActivityTime: bigint
  referralCount: bigint
  isActive: boolean
  joinTimestamp: bigint
}

// Type for userLoyalty contract return - tuple of 9 elements
export type UserLoyaltyTuple = readonly [
  bigint, // totalPoints
  bigint, // availablePoints
  number, // currentTier (uint8)
  bigint, // totalSpent
  bigint, // purchaseCount
  bigint, // lastActivityTime
  bigint, // referralCount
  boolean, // isActive
  bigint  // joinTimestamp
]

/**
 * Hook for managing creator rewards and incentives using actual V2 contracts
 */
export function useIncentivizationManager() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  
  // Contract configurations - use actual deployed contracts
  const loyaltyConfig = getContractConfig(chainId, 'LOYALTY_MANAGER')
  const rewardsConfig = getContractConfig(chainId, 'REWARDS_INTEGRATION')
  
  // Create properly typed contract configs
  const loyaltyContract: LoyaltyContractConfig = {
    address: loyaltyConfig.address as `0x${string}`,
    abi: LOYALTY_MANAGER_ABI
  }
  
  const rewardsContract: RewardsContractConfig = {
    address: rewardsConfig.address as `0x${string}`,
    abi: REWARDS_INTEGRATION_ABI
  }
  
  // Separate write contract hooks for different operations to track hashes properly
  const loyaltyWrite = useWriteContract()
  const rewardsWrite = useWriteContract()
  const referralWrite = useWriteContract()

  // ============ LOYALTY SYSTEM (CONTRACT-BASED) ============

  /**
   * Award loyalty points using LoyaltyManager contract
   */
  const awardLoyaltyPoints = useMutation({
    mutationFn: async ({
      user,
      purchaseAmount,
      paymentType
    }: {
      user: Address
      purchaseAmount: bigint
      paymentType: 0 | 1 | 2 | 3 // PayPerView | Subscription | Tip | Donation
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return loyaltyWrite.writeContract({
        ...loyaltyContract,
        functionName: 'awardPurchasePoints',
        args: [user, purchaseAmount, paymentType]
      })
    }
  })

  /**
   * Get user's loyalty status from LoyaltyManager contract
   */
  const useUserLoyaltyStatus = () => {
    return useReadContract({
      address: loyaltyContract.address,
      abi: loyaltyContract.abi,
      functionName: 'userLoyalty',
      args: userAddress ? [userAddress] : undefined,
      query: {
        enabled: !!userAddress,
        staleTime: 30000 // 30 seconds
      }
    } as Parameters<typeof useReadContract>[0])
  }
  
  /**
   * Get tier benefits for a specific tier
   */
  const useTierBenefits = (tier: number) => {
    return useReadContract({
      address: loyaltyContract.address,
      abi: loyaltyContract.abi,
      functionName: 'tierBenefits',
      args: [tier],
      query: {
        staleTime: 300000 // 5 minutes - benefits don't change often
      }
    } as Parameters<typeof useReadContract>[0])
  }


  /**
   * Award referral points using contract
   */
  const awardReferralPoints = useMutation({
    mutationFn: async ({
      referrer,
      referee
    }: {
      referrer: Address
      referee: Address
    }) => {
      return referralWrite.writeContract({
        ...loyaltyContract,
        functionName: 'awardReferralPoints',
        args: [referrer, referee]
      })
    }
  })

  // ============ REWARDS INTEGRATION ============

  /**
   * Process payment success through RewardsIntegration contract
   */
  const processPaymentSuccess = useMutation({
    mutationFn: async ({
      intentId,
      paymentContext
    }: {
      intentId: `0x${string}`
      paymentContext: any // PaymentContext from CommerceProtocolCore
    }) => {
      if (!userAddress) throw new Error('User not connected')
      
      return rewardsWrite.writeContract({
        ...rewardsContract,
        functionName: 'onPaymentSuccess',
        args: [intentId, paymentContext]
      })
    }
  })

  /**
   * Check if auto-distribution is enabled
   */
  const useAutoDistributeRevenue = () => {
    return useReadContract({
      address: rewardsContract.address,
      abi: rewardsContract.abi,
      functionName: 'autoDistributeRevenue',
      query: {
        staleTime: 60000 // 1 minute
      }
    } as Parameters<typeof useReadContract>[0])
  }

  /**
   * Check if auto-loyalty points are enabled
   */
  const useAutoAwardLoyaltyPoints = () => {
    return useReadContract({
      address: rewardsContract.address,
      abi: rewardsContract.abi,
      functionName: 'autoAwardLoyaltyPoints',
      query: {
        staleTime: 60000 // 1 minute
      }
    } as Parameters<typeof useReadContract>[0])
  }

  // ============ COMPREHENSIVE INCENTIVE PROCESSING ============

  /**
   * Process all incentives for a completed payment using actual contracts
   */
  const processPaymentIncentives = useMutation({
    mutationFn: async ({
      intentId,
      paymentContext,
      purchaseAmount,
      paymentType,
      autoRewardsEnabled = false
    }: {
      intentId: `0x${string}`
      paymentContext: any
      purchaseAmount: bigint
      paymentType: 0 | 1 | 2 | 3
      autoRewardsEnabled?: boolean
    }) => {
      const results = {
        loyaltyPointsTxHash: null as Hash | null,
        rewardsProcessingTxHash: null as Hash | null,
        success: false
      }

      try {
        // Award loyalty points via contract
        await awardLoyaltyPoints.mutateAsync({
          user: userAddress!,
          purchaseAmount,
          paymentType
        })
        // Get actual transaction hash from loyalty write hook
        results.loyaltyPointsTxHash = loyaltyWrite.data || null

        // Process rewards integration if auto-processing is enabled
        if (autoRewardsEnabled) {
          await processPaymentSuccess.mutateAsync({
            intentId,
            paymentContext
          })
          // Get actual transaction hash from rewards write hook
          results.rewardsProcessingTxHash = rewardsWrite.data || null
        }

        results.success = true
        toast.success('Incentives processed successfully!')

        return results
      } catch (error) {
        console.error('Incentive processing failed:', error)
        toast.warning('Payment successful but some incentives failed')
        return results
      }
    }
  })

  // ============ REFERRAL SYSTEM ============


  /**
   * Get referral stats from contract
   */
  const useReferralStats = (user: Address | undefined) => {
    return useReadContract({
      address: loyaltyContract.address,
      abi: loyaltyContract.abi,
      functionName: 'userLoyalty', // Contains referralCount
      args: user ? [user] : undefined,
      query: {
        enabled: !!user,
        staleTime: 60000 // 1 minute
      }
    } as Parameters<typeof useReadContract>[0])
  }

  return {
    // Loyalty system (contract-based)
    awardLoyaltyPoints,
    useUserLoyaltyStatus,
    useTierBenefits,
    awardReferralPoints,

    // Rewards integration
    processPaymentSuccess,
    useAutoDistributeRevenue,
    useAutoAwardLoyaltyPoints,

    // Comprehensive processing
    processPaymentIncentives,

    // Referral system
    useReferralStats,

    // Contract addresses
    loyaltyManagerAddress: loyaltyContract.address,
    rewardsIntegrationAddress: rewardsContract.address,

    // Transaction states and hashes
    loyaltyTransactionHash: loyaltyWrite.data,
    loyaltyIsPending: loyaltyWrite.isPending,
    loyaltyError: loyaltyWrite.error,
    
    rewardsTransactionHash: rewardsWrite.data,
    rewardsIsPending: rewardsWrite.isPending,
    rewardsError: rewardsWrite.error,
    
    referralTransactionHash: referralWrite.data,
    referralIsPending: referralWrite.isPending,
    referralError: referralWrite.error,

    // Utils
    chainId,
    userAddress
  }
}

/**
 * Hook for referral tracking and management using real contracts
 */
export function useReferralTracking() {
  const { awardReferralPoints, useReferralStats } = useIncentivizationManager()
  const { address: userAddress } = useAccount()

  const userStats = useReferralStats(userAddress)

  const processReferral = useMutation({
    mutationFn: async ({
      referee
    }: {
      referee: Address
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return awardReferralPoints.mutateAsync({
        referrer: userAddress,
        referee
      })
    }
  })

  return {
    processReferral,
    userStats: userStats.data,
    isLoading: userStats.isLoading,
    error: userStats.error || processReferral.error
  }
}

/**
 * Hook for loyalty tier management using real contracts
 */
export function useLoyaltyTierManagement() {
  const { useUserLoyaltyStatus, useTierBenefits } = useIncentivizationManager()

  const userLoyalty = useUserLoyaltyStatus()
  const currentTier = userLoyalty.data ? (userLoyalty.data as UserLoyaltyTuple)[2] : 0 // currentTier is index 2 in the struct
  const tierBenefits = useTierBenefits(currentTier || 0)

  return {
    currentTier,
    tierBenefits: tierBenefits.data,
    userLoyalty: userLoyalty.data,
    isLoading: userLoyalty.isLoading || tierBenefits.isLoading,
    error: userLoyalty.error || tierBenefits.error
  }
}

export default useIncentivizationManager
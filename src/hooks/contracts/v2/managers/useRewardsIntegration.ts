/**
 * Rewards Integration Hook - V2 Revenue Distribution
 *
 * Handles revenue distribution, loyalty point awards, referral bonuses,
 * and integration with the rewards treasury using the modular
 * RewardsIntegration contract from v2 architecture.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { REWARDS_INTEGRATION_ABI } from '@/lib/contracts/abis/v2ABIs/RewardsIntegration'
import { type Address } from 'viem'

export interface IntegrationStats {
  revenueAutoDistribute: boolean
  loyaltyAutoAward: boolean
  minPurchaseThreshold: bigint
  treasuryAddress: Address
  loyaltyManagerAddress: Address
}

export interface LoyaltyDiscount {
  discountAmount: bigint
  finalAmount: bigint
}

/**
 * Hook for RewardsIntegration contract interactions
 */
export function useRewardsIntegration() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'REWARDS_INTEGRATION')
  const contract = {
    address: contractConfig.address,
    abi: REWARDS_INTEGRATION_ABI
  } as const

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ REVENUE DISTRIBUTION ============

  /**
   * Apply loyalty discount to a purchase
   */
  const applyLoyaltyDiscount = useMutation({
    mutationFn: async ({
      user,
      originalAmount,
      usePoints,
      pointsToUse
    }: {
      user: Address
      originalAmount: bigint
      usePoints: boolean
      pointsToUse: bigint
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'applyLoyaltyDiscount',
        args: [user, originalAmount, usePoints, pointsToUse]
      })
    },
    onSuccess: (hash) => {
      console.log('Loyalty discount applied:', hash)
    },
    onError: (error) => {
      console.error('Failed to apply loyalty discount:', error)
    }
  })

  /**
   * Process referral bonus
   */
  const processReferralBonus = useMutation({
    mutationFn: async ({
      referrer,
      newUser,
      purchaseAmount
    }: {
      referrer: Address
      newUser: Address
      purchaseAmount: bigint
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'processReferralBonus',
        args: [referrer, newUser, purchaseAmount]
      })
    },
    onSuccess: (hash) => {
      console.log('Referral bonus processed:', hash)
    },
    onError: (error) => {
      console.error('Failed to process referral bonus:', error)
    }
  })

  /**
   * Update integration configuration
   */
  const updateConfiguration = useMutation({
    mutationFn: async ({
      autoDistributeRevenue,
      autoAwardLoyaltyPoints,
      minPurchaseForRewards
    }: {
      autoDistributeRevenue: boolean
      autoAwardLoyaltyPoints: boolean
      minPurchaseForRewards: bigint
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'updateConfiguration',
        args: [autoDistributeRevenue, autoAwardLoyaltyPoints, minPurchaseForRewards]
      })
    },
    onSuccess: (hash) => {
      console.log('Integration configuration updated:', hash)
    },
    onError: (error) => {
      console.error('Failed to update integration configuration:', error)
    }
  })

  // ============ EMERGENCY CONTROLS ============

  /**
   * Emergency pause integration
   */
  const emergencyPause = useMutation({
    mutationFn: async () => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'emergencyPause'
      })
    },
    onSuccess: (hash) => {
      console.log('Rewards integration paused:', hash)
    },
    onError: (error) => {
      console.error('Failed to pause rewards integration:', error)
    }
  })

  /**
   * Resume integration after pause
   */
  const resumeIntegration = useMutation({
    mutationFn: async () => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'resumeIntegration'
      })
    },
    onSuccess: (hash) => {
      console.log('Rewards integration resumed:', hash)
    },
    onError: (error) => {
      console.error('Failed to resume rewards integration:', error)
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Get integration statistics
   */
  const useIntegrationStats = () => {
    return useReadContract({
      ...contract,
      functionName: 'getIntegrationStats',
      query: {
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Check if auto revenue distribution is enabled
   */
  const useAutoDistributeRevenue = () => {
    return useReadContract({
      ...contract,
      functionName: 'autoDistributeRevenue',
      query: {
        staleTime: 300000 // 5 minutes
      }
    })
  }

  /**
   * Check if auto loyalty point awards are enabled
   */
  const useAutoAwardLoyaltyPoints = () => {
    return useReadContract({
      ...contract,
      functionName: 'autoAwardLoyaltyPoints',
      query: {
        staleTime: 300000 // 5 minutes
      }
    })
  }

  /**
   * Get minimum purchase threshold for rewards
   */
  const useMinPurchaseForRewards = () => {
    return useReadContract({
      ...contract,
      functionName: 'minPurchaseForRewards',
      query: {
        staleTime: 300000 // 5 minutes
      }
    })
  }

  /**
   * Get loyalty discount for user and amount
   */
  const useGetLoyaltyDiscount = (user: Address | undefined, originalAmount: bigint | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getLoyaltyDiscount',
      args: user && originalAmount !== undefined ? [user, originalAmount] : undefined,
      query: {
        enabled: !!user && originalAmount !== undefined,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Calculate discounted price (read-only version)
   */
  const useCalculateDiscountedPrice = (user: Address | undefined, originalAmount: bigint | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'calculateDiscountedPrice',
      args: user && originalAmount !== undefined ? [user, originalAmount] : undefined,
      query: {
        enabled: !!user && originalAmount !== undefined,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get rewards treasury contract address
   */
  const useRewardsTreasury = () => {
    return useReadContract({
      ...contract,
      functionName: 'rewardsTreasury',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get loyalty manager contract address
   */
  const useLoyaltyManager = () => {
    return useReadContract({
      ...contract,
      functionName: 'loyaltyManager',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get commerce protocol contract address
   */
  const useCommerceProtocol = () => {
    return useReadContract({
      ...contract,
      functionName: 'commerceProtocol',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  // ============ ROLE MANAGEMENT ============

  /**
   * Get INTEGRATION_MANAGER_ROLE hash
   */
  const useIntegrationManagerRole = () => {
    return useReadContract({
      ...contract,
      functionName: 'INTEGRATION_MANAGER_ROLE',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Check if address has integration manager role
   */
  const useHasIntegrationManagerRole = (account: Address | undefined) => {
    const integrationManagerRole = useIntegrationManagerRole()
    return useReadContract({
      ...contract,
      functionName: 'hasRole',
      args: account && integrationManagerRole.data ? [
        integrationManagerRole.data,
        account
      ] : undefined,
      query: {
        enabled: !!account && !!integrationManagerRole.data,
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Get REWARDS_TRIGGER_ROLE hash
   */
  const useRewardsTriggerRole = () => {
    return useReadContract({
      ...contract,
      functionName: 'REWARDS_TRIGGER_ROLE',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Check if address has rewards trigger role
   */
  const useHasRewardsTriggerRole = (account: Address | undefined) => {
    const rewardsTriggerRole = useRewardsTriggerRole()
    return useReadContract({
      ...contract,
      functionName: 'hasRole',
      args: account && rewardsTriggerRole.data ? [
        rewardsTriggerRole.data,
        account
      ] : undefined,
      query: {
        enabled: !!account && !!rewardsTriggerRole.data,
        staleTime: 60000 // 1 minute
      }
    })
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Check if user is eligible for rewards on a purchase
   */
  const useRewardsEligibility = (user: Address | undefined, purchaseAmount: bigint | undefined) => {
    const stats = useIntegrationStats()
    const minThreshold = useMinPurchaseForRewards()

    const isEligible = user &&
      purchaseAmount !== undefined &&
      stats.data &&
      minThreshold.data &&
      purchaseAmount >= minThreshold.data

    return {
      isEligible,
      minThreshold: minThreshold.data,
      purchaseAmount,
      isLoading: stats.isLoading || minThreshold.isLoading,
      error: stats.error || minThreshold.error
    }
  }

  /**
   * Get user's potential loyalty discount
   */
  const useUserLoyaltyDiscount = (user: Address | undefined, amount: bigint | undefined) => {
    const discount = useGetLoyaltyDiscount(user, amount)

    return {
      discountAmount: discount.data?.[0],
      finalAmount: discount.data?.[1],
      isLoading: discount.isLoading,
      error: discount.error
    }
  }

  /**
   * Get integration health status
   */
  const useIntegrationHealth = () => {
    const stats = useIntegrationStats()

    return {
      isHealthy: stats.data?.[0] && stats.data?.[1],
      autoRevenue: stats.data?.[0],
      autoLoyalty: stats.data?.[1],
      isLoading: stats.isLoading,
      error: stats.error
    }
  }

  return {
    // Write functions
    applyLoyaltyDiscount,
    processReferralBonus,
    updateConfiguration,
    emergencyPause,
    resumeIntegration,

    // Read hooks
    useIntegrationStats,
    useAutoDistributeRevenue,
    useAutoAwardLoyaltyPoints,
    useMinPurchaseForRewards,
    useGetLoyaltyDiscount,
    useCalculateDiscountedPrice,
    useRewardsTreasury,
    useLoyaltyManager,
    useCommerceProtocol,

    // Role management
    useIntegrationManagerRole,
    useHasIntegrationManagerRole,
    useRewardsTriggerRole,
    useHasRewardsTriggerRole,

    // Utility functions
    useRewardsEligibility,
    useUserLoyaltyDiscount,
    useIntegrationHealth,

    // Transaction state
    hash,
    isPending,
    error,

    // Contract info
    contractAddress: contract.address,
    chainId
  }
}

/**
 * Convenience hook for payment success handling
 */
export function usePaymentSuccessHandler() {
  const { applyLoyaltyDiscount, processReferralBonus } = useRewardsIntegration()

  /**
   * Handle successful payment with rewards processing
   */
  const handlePaymentSuccess = useMutation({
    mutationFn: async ({
      user,
      amount,
      referrer,
      newUser,
      useLoyaltyDiscount: shouldUseDiscount,
      pointsToUse = BigInt(0)
    }: {
      user: Address
      amount: bigint
      referrer?: Address
      newUser?: Address
      useLoyaltyDiscount?: boolean
      pointsToUse?: bigint
    }) => {
      const results = []

      // Apply loyalty discount if requested
      if (shouldUseDiscount) {
        const discountResult = await applyLoyaltyDiscount.mutateAsync({
          user,
          originalAmount: amount,
          usePoints: pointsToUse > BigInt(0),
          pointsToUse
        })
        results.push(discountResult)
      }

      // Process referral bonus if applicable
      if (referrer && newUser) {
        const referralResult = await processReferralBonus.mutateAsync({
          referrer,
          newUser,
          purchaseAmount: amount
        })
        results.push(referralResult)
      }

      return results
    }
  })

  return {
    handlePaymentSuccess,
    applyLoyaltyDiscount,
    processReferralBonus
  }
}

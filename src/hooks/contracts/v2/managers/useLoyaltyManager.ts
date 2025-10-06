/**
 * Loyalty Manager Hook - V2 Points and Tier System
 *
 * Handles loyalty points, tier management, discounts, referrals, and early access
 * using the modular LoyaltyManager contract from v2 architecture.
 */

import { useMutation } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { LOYALTY_MANAGER_ABI } from '@/lib/contracts/abis/v2ABIs/LoyaltyManager'
import { type Address } from 'viem'

export interface UserLoyalty {
  totalPoints: bigint
  availablePoints: bigint
  currentTier: 0 | 1 | 2 | 3 | 4 // Bronze | Silver | Gold | Platinum | Diamond
  totalSpent: bigint
  purchaseCount: bigint
  lastActivityTime: bigint
  referralCount: bigint
  isActive: boolean
  joinTimestamp: bigint
}

export interface TierBenefits {
  discountBps: bigint
  pointsMultiplier: bigint
  cashbackBps: bigint
  earlyAccessHours: bigint
  freeTransactionFees: boolean
  monthlyBonus: bigint
  referralBonus: bigint
}

export interface UserStats {
  totalPoints: bigint
  availablePoints: bigint
  currentTier: 0 | 1 | 2 | 3 | 4
  totalSpent: bigint
  purchaseCount: bigint
  tierDiscountBps: bigint
  freeFees: boolean
}

/**
 * Hook for LoyaltyManager contract interactions
 */
export function useLoyaltyManager() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'LOYALTY_MANAGER')
  const contract = {
    address: contractConfig.address,
    abi: LOYALTY_MANAGER_ABI
  } as const

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ POINTS MANAGEMENT ============

  /**
   * Award points for a purchase
   */
  const awardPurchasePoints = useMutation({
    mutationFn: async ({
      user,
      amountSpent,
      paymentType
    }: {
      user: Address
      amountSpent: bigint
      paymentType: 0 | 1 | 2 | 3 // PayPerView | Subscription | Tip | Donation
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'awardPurchasePoints',
        args: [user, amountSpent, paymentType]
      })
    },
    onSuccess: (hash) => {
      console.log('Purchase points awarded:', hash)
    },
    onError: (error) => {
      console.error('Failed to award purchase points:', error)
    }
  })

  /**
   * Award referral points
   */
  const awardReferralPoints = useMutation({
    mutationFn: async ({ referrer, referee }: { referrer: Address, referee: Address }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'awardReferralPoints',
        args: [referrer, referee]
      })
    },
    onSuccess: (hash) => {
      console.log('Referral points awarded:', hash)
    },
    onError: (error) => {
      console.error('Failed to award referral points:', error)
    }
  })

  /**
   * Apply discount with optional points usage
   */
  const applyDiscount = useMutation({
    mutationFn: async ({
      user,
      originalPrice,
      usePoints,
      pointsToUse
    }: {
      user: Address
      originalPrice: bigint
      usePoints: boolean
      pointsToUse: bigint
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'applyDiscount',
        args: [user, originalPrice, usePoints, pointsToUse]
      })
    },
    onSuccess: (hash) => {
      console.log('Discount applied:', hash)
    },
    onError: (error) => {
      console.error('Failed to apply discount:', error)
    }
  })

  /**
   * Grant early access to content
   */
  const grantEarlyAccess = useMutation({
    mutationFn: async ({ user, contentId }: { user: Address, contentId: bigint }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'grantEarlyAccess',
        args: [user, contentId]
      })
    },
    onSuccess: (hash) => {
      console.log('Early access granted:', hash)
    },
    onError: (error) => {
      console.error('Failed to grant early access:', error)
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Get user's loyalty information
   */
  const useUserLoyalty = (user: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getUserLoyalty',
      args: user ? [user] : undefined,
      query: {
        enabled: !!user,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get user's points information
   */
  const useUserPoints = (user: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getUserPoints',
      args: user ? [user] : undefined,
      query: {
        enabled: !!user,
        staleTime: 15000 // 15 seconds - points can change frequently
      }
    })
  }

  /**
   * Get user's comprehensive stats
   */
  const useUserStats = (user: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getUserStats',
      args: user ? [user] : undefined,
      query: {
        enabled: !!user,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get user's current tier
   */
  const useUserTier = (user: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getUserTier',
      args: user ? [user] : undefined,
      query: {
        enabled: !!user,
        staleTime: 60000 // 1 minute - tier changes less frequently
      }
    })
  }

  /**
   * Get benefits for a specific tier
   */
  const useTierBenefits = (tier: 0 | 1 | 2 | 3 | 4 | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getTierBenefits',
      args: tier !== undefined ? [tier] : undefined,
      query: {
        enabled: tier !== undefined,
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Check if user has early access to content
   */
  const useHasEarlyAccess = (user: Address | undefined, contentId: bigint | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'hasEarlyAccessToContent',
      args: user && contentId !== undefined ? [user, contentId] : undefined,
      query: {
        enabled: !!user && contentId !== undefined,
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Calculate discount for user and amount
   */
  const useCalculateDiscount = (user: Address | undefined, originalAmount: bigint | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'calculateDiscount',
      args: user && originalAmount !== undefined ? [user, originalAmount] : undefined,
      query: {
        enabled: !!user && originalAmount !== undefined,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  // ============ CONFIGURATION READERS ============

  /**
   * Get points per dollar spent
   */
  const usePointsPerDollarSpent = () => {
    return useReadContract({
      ...contract,
      functionName: 'pointsPerDollarSpent',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get referral bonus points
   */
  const useReferralBonusPoints = () => {
    return useReadContract({
      ...contract,
      functionName: 'referralBonusPoints',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get daily login points
   */
  const useDailyLoginPoints = () => {
    return useReadContract({
      ...contract,
      functionName: 'dailyLoginPoints',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get subscription bonus multiplier
   */
  const useSubscriptionBonusMultiplier = () => {
    return useReadContract({
      ...contract,
      functionName: 'subscriptionBonusMultiplier',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get rewards treasury address
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

  // ============ ROLE MANAGEMENT ============

  /**
   * Get DISCOUNT_MANAGER_ROLE hash
   */
  const useDiscountManagerRole = () => {
    return useReadContract({
      ...contract,
      functionName: 'DISCOUNT_MANAGER_ROLE',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Check if address has discount manager role
   */
  const useHasDiscountManagerRole = (account: Address | undefined) => {
    const discountManagerRole = useDiscountManagerRole()
    return useReadContract({
      ...contract,
      functionName: 'hasRole',
      args: account && discountManagerRole.data ? [
        discountManagerRole.data,
        account
      ] : undefined,
      query: {
        enabled: !!account && !!discountManagerRole.data,
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Get POINTS_MANAGER_ROLE hash
   */
  const usePointsManagerRole = () => {
    return useReadContract({
      ...contract,
      functionName: 'POINTS_MANAGER_ROLE',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Check if address has points manager role
   */
  const useHasPointsManagerRole = (account: Address | undefined) => {
    const pointsManagerRole = usePointsManagerRole()
    return useReadContract({
      ...contract,
      functionName: 'hasRole',
      args: account && pointsManagerRole.data ? [
        pointsManagerRole.data,
        account
      ] : undefined,
      query: {
        enabled: !!account && !!pointsManagerRole.data,
        staleTime: 60000 // 1 minute
      }
    })
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get user's loyalty tier benefits
   */
  const useUserTierBenefits = (user: Address | undefined) => {
    const userTier = useUserTier(user)
    const tierBenefits = useTierBenefits(userTier.data as 0 | 1 | 2 | 3 | 4 | undefined)

    return {
      tier: userTier.data,
      benefits: tierBenefits.data,
      isLoading: userTier.isLoading || tierBenefits.isLoading,
      error: userTier.error || tierBenefits.error
    }
  }

  /**
   * Calculate loyalty discount for a purchase
   */
  const useLoyaltyDiscount = (user: Address | undefined, amount: bigint | undefined) => {
    const discount = useCalculateDiscount(user, amount)
    const userLoyalty = useUserLoyalty(user)

    return {
      discountAmount: discount.data?.[0],
      finalAmount: discount.data?.[1],
      userTier: userLoyalty.data?.currentTier,
      availablePoints: userLoyalty.data?.availablePoints,
      isLoading: discount.isLoading || userLoyalty.isLoading,
      error: discount.error || userLoyalty.error
    }
  }

  /**
   * Get user's loyalty summary
   */
  const useLoyaltySummary = (user: Address | undefined) => {
    const userStats = useUserStats(user)
    const userLoyalty = useUserLoyalty(user)
    const userTierBenefits = useUserTierBenefits(user)

    return {
      stats: userStats.data,
      loyalty: userLoyalty.data,
      tierBenefits: userTierBenefits.benefits,
      isLoading: userStats.isLoading || userLoyalty.isLoading || userTierBenefits.isLoading,
      error: userStats.error || userLoyalty.error || userTierBenefits.error
    }
  }

  return {
    // Write functions
    awardPurchasePoints,
    awardReferralPoints,
    applyDiscount,
    grantEarlyAccess,

    // Read hooks
    useUserLoyalty,
    useUserPoints,
    useUserStats,
    useUserTier,
    useTierBenefits,
    useHasEarlyAccess,
    useCalculateDiscount,

    // Configuration
    usePointsPerDollarSpent,
    useReferralBonusPoints,
    useDailyLoginPoints,
    useSubscriptionBonusMultiplier,
    useRewardsTreasury,

    // Role management
    useDiscountManagerRole,
    useHasDiscountManagerRole,
    usePointsManagerRole,
    useHasPointsManagerRole,

    // Utility functions
    useUserTierBenefits,
    useLoyaltyDiscount,
    useLoyaltySummary,

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
 * Convenience hook for user's loyalty status
 */
export function useMyLoyalty() {
  const { address: userAddress } = useAccount()
  const {
    useUserLoyalty,
    useUserTierBenefits,
    useLoyaltyDiscount,
    awardPurchasePoints,
    applyDiscount
  } = useLoyaltyManager()

  const userLoyalty = useUserLoyalty(userAddress)
  const userTierBenefits = useUserTierBenefits(userAddress)

  return {
    loyalty: userLoyalty.data,
    tierBenefits: userTierBenefits.benefits,
    awardPurchasePoints,
    applyDiscount,
    useLoyaltyDiscount,
    isLoading: userLoyalty.isLoading || userTierBenefits.isLoading,
    error: userLoyalty.error || userTierBenefits.error
  }
}

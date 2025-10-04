/**
 * Rewards Treasury Manager Hook - V2 Treasury Management
 * 
 * Handles revenue collection, reward distribution, campaign funding,
 * and treasury analytics using the deployed RewardsTreasury contract.
 */

import { useMutation } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { REWARDS_TREASURY_ABI } from '@/lib/contracts/abis/v2ABIs/RewardsTreasury'
import { type Address } from 'viem'

export interface TreasuryStats {
  totalBalance: bigint
  totalDeposited: bigint
  totalDistributed: bigint
  activePoolCount: number
  pendingWithdrawals: bigint
}

export interface PoolBalance {
  poolId: number
  balance: bigint
  poolType: string
  isActive: boolean
}

export interface PendingRewards {
  totalPending: bigint
  claimableAmount: bigint
  lockedAmount: bigint
  nextUnlockTime: bigint
}

export function useRewardsTreasury() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'REWARDS_TREASURY')
  const contract = {
    address: contractConfig.address,
    abi: REWARDS_TREASURY_ABI
  } as const

  const { writeContract, data: hash, isPending } = useWriteContract()

  // ============ TREASURY MANAGEMENT FUNCTIONS ============

  /**
   * Deposit platform revenue into treasury
   */
  const depositPlatformRevenue = useMutation({
    mutationFn: async ({ 
      amount, 
      source 
    }: { 
      amount: bigint
      source: Address 
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'depositPlatformRevenue',
        args: [amount, source],
      })
    },
    onSuccess: (hash) => {
      console.log('Platform revenue deposited:', hash)
    },
    onError: (error) => {
      console.error('Failed to deposit platform revenue:', error)
    }
  })

  /**
   * Allocate rewards to users
   */
  const allocateRewards = useMutation({
    mutationFn: async ({ 
      recipient, 
      amount, 
      poolType, 
      rewardType 
    }: {
      recipient: Address
      amount: bigint
      poolType: number
      rewardType: string
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'allocateRewards',
        args: [recipient, amount, poolType, rewardType]
      })
    },
    onSuccess: (hash) => {
      console.log('Rewards allocated:', hash)
    },
    onError: (error) => {
      console.error('Failed to allocate rewards:', error)
    }
  })

  /**
   * Claim available rewards
   */
  const claimRewards = useMutation({
    mutationFn: async () => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'claimRewards'
      })
    },
    onSuccess: (hash) => {
      console.log('Rewards claimed:', hash)
    },
    onError: (error) => {
      console.error('Failed to claim rewards:', error)
    }
  })

  /**
   * Fund campaign with treasury funds
   */
  const fundCampaign = useMutation({
    mutationFn: async ({
      campaignId,
      amount,
      poolType
    }: {
      campaignId: `0x${string}`
      amount: bigint
      poolType: number
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'fundCampaign',
        args: [campaignId, amount, poolType]
      })
    },
    onSuccess: (hash) => {
      console.log('Campaign funded:', hash)
    },
    onError: (error) => {
      console.error('Failed to fund campaign:', error)
    }
  })

  /**
   * Emergency withdraw (admin only)
   */
  const emergencyWithdraw = useMutation({
    mutationFn: async ({
      amount
    }: {
      amount: bigint
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'emergencyWithdraw',
        args: [amount]
      })
    },
    onSuccess: (hash) => {
      console.log('Emergency withdrawal completed:', hash)
    },
    onError: (error) => {
      console.error('Failed to perform emergency withdrawal:', error)
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Get comprehensive treasury statistics
   */
  const useGetTreasuryStats = () => {
    return useReadContract({
      ...contract,
      functionName: 'getTreasuryStats',
      query: { 
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000 // Refetch every minute
      }
    })
  }

  /**
   * Get pending rewards for a specific user
   */
  const usePendingRewards = (userAddress: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'pendingRewards',
      args: userAddress ? [userAddress] : undefined,
      query: { 
        enabled: !!userAddress,
        staleTime: 15000 // 15 seconds
      }
    })
  }

  /**
   * Get treasury pools information
   */
  const usePoolBalances = () => {
    return useReadContract({
      ...contract,
      functionName: 'pools',
      query: { 
        staleTime: 15000 // 15 seconds
      }
    })
  }

  /**
   * Get pending rewards for user
   */
  const useUserPendingRewards = (userAddress: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'pendingRewards',
      args: userAddress ? [userAddress] : undefined,
      query: { 
        enabled: !!userAddress,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get total pending for user (alternative name)
   */
  const useClaimableRewards = (userAddress: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'totalRevenueContributed',
      args: userAddress ? [userAddress] : undefined,
      query: { 
        enabled: !!userAddress,
        staleTime: 15000 // 15 seconds
      }
    })
  }

  /**
   * Get campaign budget information
   */
  const useCampaignBudget = (campaignId: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'campaignBudgets',
      args: campaignId ? [campaignId] : undefined,
      query: { 
        enabled: !!campaignId,
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Get allocations for different pool types
   */
  const useCustomerRewardsAllocation = () => {
    return useReadContract({
      ...contract,
      functionName: 'customerRewardsAllocation',
      query: { 
        staleTime: 300000 // 5 minutes
      }
    })
  }

  /**
   * Check if user has treasury admin role
   */
  const useIsTreasuryAdmin = (userAddress: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'hasRole',
      args: userAddress ? [
        '0x0000000000000000000000000000000000000000000000000000000000000000', // DEFAULT_ADMIN_ROLE
        userAddress
      ] : undefined,
      query: { 
        enabled: !!userAddress,
        staleTime: 300000 // 5 minutes
      }
    })
  }

  /**
   * Get creator incentives allocation
   */
  const useCreatorIncentivesAllocation = () => {
    return useReadContract({
      ...contract,
      functionName: 'creatorIncentivesAllocation',
      query: { 
        staleTime: 300000 // 5 minutes - config doesn't change often
      }
    })
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get formatted treasury overview
   */
  const useTreasuryOverview = () => {
    const stats = useGetTreasuryStats()
    const pools = usePoolBalances()
    const customerAlloc = useCustomerRewardsAllocation()
    const creatorAlloc = useCreatorIncentivesAllocation()

    return {
      stats: stats.data,
      poolBalances: pools.data,
      customerAllocation: customerAlloc.data,
      creatorAllocation: creatorAlloc.data,
      isLoading: stats.isLoading || pools.isLoading || customerAlloc.isLoading || creatorAlloc.isLoading,
      error: stats.error || pools.error || customerAlloc.error || creatorAlloc.error
    }
  }

  /**
   * Get user rewards summary
   */
  const useUserRewardsSummary = (userAddress: Address | undefined) => {
    const pending = usePendingRewards(userAddress)
    const userPending = useUserPendingRewards(userAddress)
    const claimable = useClaimableRewards(userAddress)

    return {
      pendingRewards: pending.data,
      userPendingRewards: userPending.data,
      claimableRewards: claimable.data,
      isLoading: pending.isLoading || userPending.isLoading || claimable.isLoading,
      error: pending.error || userPending.error || claimable.error
    }
  }

  /**
   * Check if user can perform treasury operations
   */
  const useTreasuryPermissions = (userAddress: Address | undefined) => {
    const isAdmin = useIsTreasuryAdmin(userAddress)
    const claimable = useClaimableRewards(userAddress)

    return {
      canWithdraw: isAdmin.data,
      canAllocate: isAdmin.data,
      canClaim: claimable.data !== undefined,
      isAdmin: isAdmin.data,
      isLoading: isAdmin.isLoading || claimable.isLoading,
      error: isAdmin.error || claimable.error
    }
  }

  return {
    // Write functions
    depositPlatformRevenue,
    allocateRewards,
    claimRewards,
    fundCampaign,
    emergencyWithdraw,
    
    // Read functions
    useGetTreasuryStats,
    usePendingRewards,
    usePoolBalances,
    useUserPendingRewards,
    useClaimableRewards,
    useCampaignBudget,
    useCustomerRewardsAllocation,
    useIsTreasuryAdmin,
    useCreatorIncentivesAllocation,
    
    // Utility functions
    useTreasuryOverview,
    useUserRewardsSummary,
    useTreasuryPermissions,
    
    // State
    isLoading: depositPlatformRevenue.isPending || allocateRewards.isPending || claimRewards.isPending,
    error: depositPlatformRevenue.error || allocateRewards.error || claimRewards.error,
    
    // Transaction state
    hash,
    isPending,
    
    // Contract info
    contractAddress: contract.address,
    chainId
  }
}

/**
 * Convenience hook for treasury operations
 */
export function useTreasuryOperations() {
  const treasury = useRewardsTreasury()
  const { address: userAddress } = useAccount()

  /**
   * Process revenue distribution after payment
   */
  const processRevenueDistribution = useMutation({
    mutationFn: async ({
      totalAmount,
      creatorAmount,
      platformAmount,
      source
    }: {
      totalAmount: bigint
      creatorAmount: bigint
      platformAmount: bigint
      source: Address
    }) => {
      // Deposit platform revenue
      await treasury.depositPlatformRevenue.mutateAsync({
        amount: platformAmount,
        source
      })

      // Note: Creator amount would be handled separately
      return { totalAmount, creatorAmount, platformAmount }
    }
  })

  /**
   * Claim all available rewards for user
   */
  const claimAllRewards = useMutation({
    mutationFn: async () => {
      if (!userAddress) throw new Error('User not connected')
      
      const claimable = treasury.useClaimableRewards(userAddress)
      if (!claimable.data) {
        throw new Error('No rewards available to claim')
      }

      return treasury.claimRewards.mutateAsync()
    }
  })

  return {
    ...treasury,
    processRevenueDistribution,
    claimAllRewards
  }
}
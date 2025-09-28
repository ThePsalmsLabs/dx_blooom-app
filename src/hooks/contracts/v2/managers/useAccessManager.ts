/**
 * Access Manager Hook - V2 Content Access Control
 * 
 * Handles content access, subscription validation, and purchase verification
 * using the modular AccessManager contract from v2 architecture.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { type Address } from 'viem'

// Types based on AccessManager contract
export interface AccessRecord {
  hasAccess: boolean
  grantedAt: bigint
  expiresAt: bigint
  accessType: 'purchase' | 'subscription' | 'admin'
}

export interface SubscriptionInfo {
  isActive: boolean
  startTime: bigint
  expiryTime: bigint
  autoRenew: boolean
  totalPaid: bigint
}

/**
 * Hook for AccessManager contract interactions
 */
export function useAccessManager() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contract = getContractConfig(chainId, 'ACCESS_MANAGER')
  
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ ACCESS CONTROL FUNCTIONS ============

  /**
   * Grant access after successful payment
   * Called by CommerceProtocolCore after payment completion
   */
  const grantAccess = useMutation({
    mutationFn: async ({ 
      user, 
      contentId, 
      paymentType, 
      duration 
    }: { 
      user: Address
      contentId: bigint
      paymentType: 0 | 1 | 2 | 3 // PayPerView | Subscription | Tip | Donation
      duration?: bigint 
    }) => {
      return writeContract({
        ...contract,
        functionName: 'grantAccess',
        args: [user, contentId, paymentType, duration || BigInt(0)]
      })
    }
  })

  /**
   * Revoke access (for refunds or violations)
   */
  const revokeAccess = useMutation({
    mutationFn: async ({ user, contentId }: { user: Address, contentId: bigint }) => {
      return writeContract({
        ...contract,
        functionName: 'revokeAccess',
        args: [user, contentId]
      })
    }
  })

  // ============ SUBSCRIPTION MANAGEMENT ============

  /**
   * Create subscription for user
   */
  const createSubscription = useMutation({
    mutationFn: async ({ 
      user, 
      creator, 
      duration, 
      autoRenew 
    }: { 
      user: Address
      creator: Address 
      duration: bigint
      autoRenew: boolean 
    }) => {
      return writeContract({
        ...contract,
        functionName: 'createSubscription',
        args: [user, creator, duration, autoRenew]
      })
    }
  })

  /**
   * Cancel subscription
   */
  const cancelSubscription = useMutation({
    mutationFn: async ({ creator }: { creator: Address }) => {
      if (!userAddress) throw new Error('User not connected')
      
      return writeContract({
        ...contract,
        functionName: 'cancelSubscription',
        args: [userAddress, creator]
      })
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Check if user has access to specific content
   */
  const useHasAccess = (user: Address | undefined, contentId: bigint | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'hasAccess',
      args: user && contentId !== undefined ? [user, contentId] : undefined,
      query: {
        enabled: !!user && contentId !== undefined,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get detailed access record for user and content
   */
  const useAccessRecord = (user: Address | undefined, contentId: bigint | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getAccessRecord',
      args: user && contentId !== undefined ? [user, contentId] : undefined,
      query: {
        enabled: !!user && contentId !== undefined,
        staleTime: 30000
      }
    })
  }

  /**
   * Check subscription status for user and creator
   */
  const useSubscriptionStatus = (user: Address | undefined, creator: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getSubscriptionInfo',
      args: user && creator ? [user, creator] : undefined,
      query: {
        enabled: !!user && !!creator,
        staleTime: 30000
      }
    })
  }

  /**
   * Get all active subscriptions for a user
   */
  const useUserSubscriptions = (user: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getUserSubscriptions',
      args: user ? [user] : undefined,
      query: {
        enabled: !!user,
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Get subscriber count for a creator
   */
  const useCreatorSubscriberCount = (creator: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getSubscriberCount',
      args: creator ? [creator] : undefined,
      query: {
        enabled: !!creator,
        staleTime: 60000
      }
    })
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Check multiple content access at once
   */
  const useBatchAccessCheck = (user: Address | undefined, contentIds: bigint[]) => {
    return useQuery({
      queryKey: ['batchAccess', user, contentIds],
      queryFn: async () => {
        if (!user || contentIds.length === 0) return []
        
        // This would need to be implemented as a multicall or batch function
        // For now, return empty array
        return []
      },
      enabled: !!user && contentIds.length > 0,
      staleTime: 30000
    })
  }

  return {
    // Write functions
    grantAccess,
    revokeAccess,
    createSubscription,
    cancelSubscription,
    
    // Read hooks
    useHasAccess,
    useAccessRecord,
    useSubscriptionStatus,
    useUserSubscriptions,
    useCreatorSubscriberCount,
    useBatchAccessCheck,
    
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
 * Convenience hook for common access patterns
 */
export function useContentAccess(contentId: bigint | undefined) {
  const { address: userAddress } = useAccount()
  const { useHasAccess, useAccessRecord } = useAccessManager()
  
  const hasAccess = useHasAccess(userAddress, contentId)
  const accessRecord = useAccessRecord(userAddress, contentId)
  
  return {
    hasAccess: hasAccess.data,
    accessRecord: accessRecord.data,
    isLoading: hasAccess.isLoading || accessRecord.isLoading,
    error: hasAccess.error || accessRecord.error
  }
}
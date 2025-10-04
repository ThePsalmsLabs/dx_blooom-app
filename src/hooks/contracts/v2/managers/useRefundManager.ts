/**
 * Refund Manager Hook - V2 Refund Processing
 *
 * Handles refund requests, processing, and management using the modular
 * RefundManager contract from v2 architecture. Supports both automatic
 * and manual refund processing with dispute resolution.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { REFUND_MANAGER_ABI } from '@/lib/contracts/abis/v2ABIs/RefundManager'
import { type Address } from 'viem'

export interface RefundRequest {
  originalIntentId: `0x${string}`
  user: Address
  amount: bigint
  reason: string
  requestTime: bigint
  processed: boolean
}

export interface RefundMetrics {
  totalRefunds: bigint
}

// Interface for historical refund data (combines on-chain and off-chain data)
export interface RefundHistoryItem {
  id: string
  intentId: `0x${string}`
  contentTitle: string
  contentCreator: string
  amount: bigint
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  requestDate: Date
  processedDate?: Date
  adminNotes?: string
  transactionHash?: `0x${string}`
}

/**
 * Hook for RefundManager contract interactions
 */
export function useRefundManager() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'REFUND_MANAGER')
  const contract = {
    address: contractConfig.address,
    abi: REFUND_MANAGER_ABI
  } as const

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ REFUND REQUEST FUNCTIONS ============

  /**
   * Request a refund for a processed payment
   */
  const requestRefund = useMutation({
    mutationFn: async ({
      intentId,
      user,
      creatorAmount,
      platformFee,
      operatorFee,
      reason
    }: {
      intentId: `0x${string}`
      user: Address
      creatorAmount: bigint
      platformFee: bigint
      operatorFee: bigint
      reason: string
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'requestRefund',
        args: [intentId, user, creatorAmount, platformFee, operatorFee, reason]
      })
    },
    onSuccess: (hash) => {
      console.log('Refund requested:', hash)
    },
    onError: (error) => {
      console.error('Failed to request refund:', error)
    }
  })

  /**
   * Process a refund (admin function)
   */
  const processRefund = useMutation({
    mutationFn: async (intentId: `0x${string}`) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'processRefund',
        args: [intentId]
      })
    },
    onSuccess: (hash) => {
      console.log('Refund processed:', hash)
    },
    onError: (error) => {
      console.error('Failed to process refund:', error)
    }
  })

  /**
   * Process refund with coordination (for complex refund scenarios)
   */
  const processRefundWithCoordination = useMutation({
    mutationFn: async ({
      intentId,
      paymentType,
      contentId,
      creator
    }: {
      intentId: `0x${string}`
      paymentType: 0 | 1 | 2 | 3 // PayPerView | Subscription | Tip | Donation
      contentId: bigint
      creator: Address
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'processRefundWithCoordination',
        args: [intentId, paymentType, contentId, creator]
      })
    },
    onSuccess: (hash) => {
      console.log('Refund processed with coordination:', hash)
    },
    onError: (error) => {
      console.error('Failed to process refund with coordination:', error)
    }
  })

  /**
   * Handle failed payment and create refund (admin function)
   */
  const handleFailedPayment = useMutation({
    mutationFn: async ({
      intentId,
      user,
      creatorAmount,
      platformFee,
      operatorFee,
      reason
    }: {
      intentId: `0x${string}`
      user: Address
      creatorAmount: bigint
      platformFee: bigint
      operatorFee: bigint
      reason: string
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'handleFailedPayment',
        args: [intentId, user, creatorAmount, platformFee, operatorFee, reason]
      })
    },
    onSuccess: (hash) => {
      console.log('Failed payment handled:', hash)
    },
    onError: (error) => {
      console.error('Failed to handle failed payment:', error)
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Get refund request details by intent ID
   */
  const useRefundRequest = (intentId: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getRefundRequest',
      args: intentId ? [intentId] : undefined,
      query: {
        enabled: !!intentId,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get pending refund amount for a user
   */
  const usePendingRefund = (user: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getPendingRefund',
      args: user ? [user] : undefined,
      query: {
        enabled: !!user,
        staleTime: 15000 // 15 seconds - pending refunds can change
      }
    })
  }

  /**
   * Get refund metrics (total refunds processed)
   */
  const useRefundMetrics = () => {
    return useReadContract({
      ...contract,
      functionName: 'getRefundMetrics',
      query: {
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Get PAYMENT_MONITOR_ROLE hash
   */
  const usePaymentMonitorRole = () => {
    return useReadContract({
      ...contract,
      functionName: 'PAYMENT_MONITOR_ROLE',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Check if address has payment monitor role
   */
  const useHasPaymentMonitorRole = (account: Address | undefined) => {
    const paymentMonitorRole = usePaymentMonitorRole()
    return useReadContract({
      ...contract,
      functionName: 'hasRole',
      args: account && paymentMonitorRole.data ? [
        paymentMonitorRole.data,
        account
      ] : undefined,
      query: {
        enabled: !!account && !!paymentMonitorRole.data,
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Get total refunds processed
   */
  const useTotalRefundsProcessed = () => {
    return useReadContract({
      ...contract,
      functionName: 'totalRefundsProcessed',
      query: {
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Get PayPerView contract address
   */
  const usePayPerView = () => {
    return useReadContract({
      ...contract,
      functionName: 'payPerView',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get SubscriptionManager contract address
   */
  const useSubscriptionManager = () => {
    return useReadContract({
      ...contract,
      functionName: 'subscriptionManager',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get USDC token address
   */
  const useUsdcToken = () => {
    return useReadContract({
      ...contract,
      functionName: 'usdcToken',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  // ============ CONTRACT MANAGEMENT ============

  /**
   * Update PayPerView contract address (admin function)
   */
  const setPayPerView = useMutation({
    mutationFn: async (newPayPerView: Address) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'setPayPerView',
        args: [newPayPerView]
      })
    },
    onSuccess: (hash) => {
      console.log('PayPerView contract updated:', hash)
    },
    onError: (error) => {
      console.error('Failed to update PayPerView contract:', error)
    }
  })

  /**
   * Update SubscriptionManager contract address (admin function)
   */
  const setSubscriptionManager = useMutation({
    mutationFn: async (newSubscriptionManager: Address) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'setSubscriptionManager',
        args: [newSubscriptionManager]
      })
    },
    onSuccess: (hash) => {
      console.log('SubscriptionManager contract updated:', hash)
    },
    onError: (error) => {
      console.error('Failed to update SubscriptionManager contract:', error)
    }
  })

  // ============ UTILITY FUNCTIONS ============

  /**
   * Check refund eligibility for a user
   */
  const useRefundEligibility = (user: Address | undefined) => {
    const pendingRefund = usePendingRefund(user)
    const refundMetrics = useRefundMetrics()

    return {
      hasPendingRefund: pendingRefund.data && pendingRefund.data > BigInt(0),
      pendingAmount: pendingRefund.data,
      totalRefundsProcessed: refundMetrics.data,
      isLoading: pendingRefund.isLoading || refundMetrics.isLoading,
      error: pendingRefund.error || refundMetrics.error
    }
  }

  /**
   * Get refund history for a user
   * Note: This would typically fetch from an indexer or subgraph in production
   * For now, returns empty array but with proper typing
   */
  const useRefundHistory = (user: Address | undefined) => {
    return useQuery({
      queryKey: ['refundHistory', user],
      queryFn: async (): Promise<RefundHistoryItem[]> => {
        if (!user) return []

        // TODO: Implement actual data fetching from indexer/subgraph
        // This should query historical RefundRequested and RefundProcessed events
        // and combine with off-chain data for content titles, creators, etc.
        
        return []
      },
      enabled: !!user,
      staleTime: 60000 // 1 minute
    })
  }


  return {
    // Write functions
    requestRefund,
    processRefund,
    processRefundWithCoordination,
    handleFailedPayment,
    setPayPerView,
    setSubscriptionManager,

    // Read hooks
    useRefundRequest,
    usePendingRefund,
    useRefundMetrics,
    usePaymentMonitorRole,
    useHasPaymentMonitorRole,
    useTotalRefundsProcessed,
    usePayPerView,
    useSubscriptionManager,
    useUsdcToken,

    // Utility functions
    useRefundEligibility,
    useRefundHistory,

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
 * Convenience hook for user refund operations
 */
export function useUserRefunds() {
  const { address: userAddress } = useAccount()
  const {
    requestRefund,
    usePendingRefund,
    useRefundEligibility,
    useRefundHistory
  } = useRefundManager()

  const pendingRefund = usePendingRefund(userAddress)
  const refundEligibility = useRefundEligibility(userAddress)
  const refundHistory = useRefundHistory(userAddress)

  return {
    requestRefund,
    pendingRefund: pendingRefund.data,
    refundEligibility,
    refundHistory: refundHistory.data,
    isLoading: pendingRefund.isLoading || refundHistory.isLoading,
    error: pendingRefund.error || refundHistory.error
  }
}

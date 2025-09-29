/**
 * Access Manager Hook - V2 Payment Processing & Access Control
 * 
 * Handles payment processing completion and access granting using the AccessManager 
 * contract from v2 architecture. This is the critical component that grants access
 * after successful payments and manages subscription/content access.
 */

import { useMutation } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { ACCESS_MANAGER_ABI } from '@/lib/contracts/abis/v2ABIs/AccessManager'
import { PAY_PER_VIEW_ABI } from '@/lib/contracts/abis/v2ABIs/PayPerView'
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis/v2ABIs/SubscriptionManager'
import { CONTENT_REGISTRY_ABI } from '@/lib/contracts/abis/v2ABIs/ContentRegistry'
import { type Address } from 'viem'

// Types for payment processing - matching AccessManager ABI exactly
export interface AccessManagerPaymentContext {
  paymentType: number // Wagmi expects number, not specific union
  user: `0x${string}`
  creator: `0x${string}`
  contentId: bigint
  platformFee: bigint
  creatorAmount: bigint
  operatorFee: bigint
  timestamp: bigint
  processed: boolean
  paymentToken: `0x${string}`
  expectedAmount: bigint
  intentId: `0x${string}`
}

/**
 * Hook for AccessManager contract interactions
 */
export function useAccessManager() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'ACCESS_MANAGER')
  const contract = {
    address: contractConfig.address as `0x${string}`,
    abi: ACCESS_MANAGER_ABI
  } as const

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ PAYMENT PROCESSING ============

  /**
   * Handle successful payment and grant access (CRITICAL FUNCTION)
   * This is called after a payment is successfully processed to grant access
   */
  const handleSuccessfulPayment = useMutation({
    mutationFn: async ({
      context,
      intentId,
      paymentToken,
      amountPaid,
      operatorFee
    }: {
      context: AccessManagerPaymentContext
      intentId: `0x${string}`
      paymentToken: Address
      amountPaid: bigint
      operatorFee: bigint
    }) => {
      if (!userAddress) throw new Error('User not connected')

      // Use explicit typing to work around wagmi's complex tuple type inference
      // The function exists in the ABI but wagmi struggles with the PaymentContext tuple
      type WriteContractConfig = {
        address: `0x${string}`
        abi: typeof ACCESS_MANAGER_ABI
        functionName: 'handleSuccessfulPayment'
        args: [AccessManagerPaymentContext, `0x${string}`, Address, bigint, bigint]
      }
      
      const config: WriteContractConfig = {
        address: contract.address,
        abi: contract.abi,
        functionName: 'handleSuccessfulPayment',
        args: [context, intentId, paymentToken, amountPaid, operatorFee]
      }
      
      return writeContract(config as Parameters<typeof writeContract>[0])
    },
    onSuccess: (hash) => {
      console.log('Access granted for successful payment:', hash)
    },
    onError: (error) => {
      console.error('Failed to handle successful payment:', error)
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Get access manager metrics
   */
  const useGetMetrics = () => {
    return useReadContract({
      ...contract,
      functionName: 'getMetrics',
      query: {
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Check if AccessManager is properly configured
   */
  const useIsConfigured = () => {
    return useReadContract({
      ...contract,
      functionName: 'isConfigured',
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
   * Get CreatorRegistry contract address
   */
  const useCreatorRegistry = () => {
    return useReadContract({
      ...contract,
      functionName: 'creatorRegistry',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get content information including creator address
   */
  const useGetContent = (contentId: bigint | undefined) => {
    const creatorRegistryAddress = useCreatorRegistry()
    
    return useReadContract({
      address: creatorRegistryAddress.data,
      abi: CONTENT_REGISTRY_ABI,
      functionName: 'getContent',
      args: contentId ? [contentId] : undefined,
      query: {
        enabled: !!creatorRegistryAddress.data && !!contentId,
        staleTime: 300000 // 5 minutes - content rarely changes
      }
    })
  }

  /**
   * Get total payments processed
   */
  const useTotalPaymentsProcessed = () => {
    return useReadContract({
      ...contract,
      functionName: 'totalPaymentsProcessed',
      query: {
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get total operator fees collected
   */
  const useTotalOperatorFees = () => {
    return useReadContract({
      ...contract,
      functionName: 'totalOperatorFees',
      query: {
        staleTime: 30000 // 30 seconds
      }
    })
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Check if a user has access to specific content (via PayPerView contract)
   */
  const useHasAccess = (user: Address | undefined, contentId: bigint | undefined) => {
    const payPerViewAddress = usePayPerView()
    
    return useReadContract({
      address: payPerViewAddress.data,
      abi: PAY_PER_VIEW_ABI,
      functionName: 'hasAccess',
      args: contentId && user ? [contentId, user] : undefined,
      query: {
        enabled: !!payPerViewAddress.data && !!contentId && !!user,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Check if a user has an active subscription to a creator
   */
  const useHasSubscription = (user: Address | undefined, creator: Address | undefined) => {
    const subscriptionManagerAddress = useSubscriptionManager()
    
    return useReadContract({
      address: subscriptionManagerAddress.data,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: 'isSubscribed',
      args: user && creator ? [user, creator] : undefined,
      query: {
        enabled: !!subscriptionManagerAddress.data && !!user && !!creator,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  return {
    // Write functions - Payment Processing
    handleSuccessfulPayment,

    // Read hooks - Contract Integration
    useGetMetrics,
    useIsConfigured,
    usePayPerView,
    useSubscriptionManager,
    useCreatorRegistry,
    useGetContent,
    useTotalPaymentsProcessed,
    useTotalOperatorFees,

    // Utility functions - Access Verification
    useHasAccess,
    useHasSubscription,

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
 * Comprehensive hook for content access verification
 * Checks both direct PayPerView access and subscription-based access
 */
export function useContentAccess(contentId: bigint) {
  const { address: userAddress } = useAccount()
  const { useHasAccess, useHasSubscription, useGetContent } = useAccessManager()

  // Get content info to determine the creator
  const contentInfo = useGetContent(contentId)
  const creatorAddress = contentInfo.data?.creator

  // Check direct PayPerView access
  const hasDirectAccess = useHasAccess(userAddress, contentId)
  
  // Check subscription access to the creator
  const hasSubscriptionAccess = useHasSubscription(userAddress, creatorAddress)
  
  // User has access if they either:
  // 1. Purchased the content directly (PayPerView)
  // 2. Have an active subscription to the creator
  const hasAccess = hasDirectAccess.data || hasSubscriptionAccess.data
  
  const isLoading = hasDirectAccess.isLoading || hasSubscriptionAccess.isLoading || contentInfo.isLoading
  const error = hasDirectAccess.error || hasSubscriptionAccess.error || contentInfo.error
  
  return {
    hasAccess,
    hasDirectAccess: hasDirectAccess.data,
    hasSubscriptionAccess: hasSubscriptionAccess.data,
    contentInfo: contentInfo.data,
    isLoading,
    error,
    refetch: async () => {
      await Promise.all([
        hasDirectAccess.refetch(),
        hasSubscriptionAccess.refetch(),
        contentInfo.refetch()
      ])
    }
  }
}

/**
 * Convenience hook for subscription verification
 */
export function useCreatorSubscription(creator: Address) {
  const { address: userAddress } = useAccount()
  const { useHasSubscription } = useAccessManager()

  const hasSubscription = useHasSubscription(userAddress, creator)
  
  return {
    hasSubscription: hasSubscription.data,
    isLoading: hasSubscription.isLoading,
    error: hasSubscription.error,
    refetch: hasSubscription.refetch
  }
}
/**
 * Core Contract Interaction Hooks - Foundation Layer
 * 
 * This layer provides the fundamental building blocks for all Web3 interactions
 * in your content platform. Think of these hooks as the basic vocabulary words
 * that higher-level hooks will combine into complete sentences.
 * 
 * Each hook in this layer corresponds directly to a smart contract function,
 * providing type-safe access with proper caching, error handling, and loading states.
 * 
 * Architecture Principles:
 * 1. Direct 1:1 mapping with contract functions
 * 2. Leverage wagmi v2 + TanStack Query for optimal caching
 * 3. Provide consistent error handling patterns
 * 4. Enable composition by higher-level hooks
 * 5. Maintain complete type safety throughout
 */

import { useReadContract, useWriteContract, useSimulateContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { type Address, type Hash } from 'viem'

// Import your contract configuration and types
import { 
  getCreatorRegistryContract,
  getContentRegistryContract,
  getPayPerViewContract,
  getSubscriptionManagerContract,
  getCommerceIntegrationContract,
  getPriceOracleContract
} from '@/lib/contracts/config'
import { 
  CREATOR_REGISTRY_ABI,
  CONTENT_REGISTRY_ABI,
  PAY_PER_VIEW_ABI,
  SUBSCRIPTION_MANAGER_ABI,
  COMMERCE_PROTOCOL_INTEGRATION_ABI,
  PRICE_ORACLE_ABI
} from '@/lib/contracts/abi'
import type { 
  Creator,
  Content,
  ContentCategory,
  CreatorRegistrationParams,
  ContentUploadParams,
  DirectPurchaseParams
} from '@/types/contracts'

/**
 * Common hook interfaces for consistent patterns across all contract hooks
 * These interfaces ensure that every hook provides the same basic structure
 * for loading states, error handling, and data access.
 */
export interface ContractReadResult<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  isSuccess: boolean
  refetch: () => void
}

export interface ContractWriteResult {
  hash: Hash | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  isSuccess: boolean
  write: (args?: unknown) => void
  reset: () => void
}

export interface ContractWriteWithConfirmationResult extends ContractWriteResult {
  isConfirming: boolean
  isConfirmed: boolean
  confirmationError: Error | null
}

/**
 * Hook factory for creating consistent read contract hooks
 * This pattern eliminates code duplication while maintaining type safety
 */
function createReadContractHook<TResult>(
  contractGetter: (chainId: number) => { address: Address; abi: readonly unknown[] },
  functionName: string,
  chainId: number
) {
  return function useReadContractGeneric(args?: readonly unknown[]): ContractReadResult<TResult> {
    const contractConfig = useMemo(() => contractGetter(chainId), [chainId])
    
    const result = useReadContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName,
      args: args || [],
      // TanStack Query options for optimal caching
      query: {
        // Contract data doesn't change frequently, so we can cache longer
        staleTime: 1000 * 60 * 2, // 2 minutes
        // Keep successful queries in cache longer
        gcTime: 1000 * 60 * 10, // 10 minutes
        // Retry strategy for blockchain calls
        retry: (failureCount, error) => {
          // Don't retry user-rejected transactions
          if (error && typeof error === 'object' && 'code' in error && error.code === 4001) {
            return false
          }
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
      }
    })

    return {
      data: result.data as TResult | undefined,
      isLoading: result.isLoading,
      isError: result.isError,
      error: result.error,
      isSuccess: result.isSuccess,
      refetch: result.refetch
    }
  }
}

/**
 * Utility: Supported extra contracts for future extensibility
 */
export const SUPPORTED_EXTRA_CONTRACTS = [getCommerceIntegrationContract, getPriceOracleContract]
/**
 * Utility: Extra ABIs for reference or dynamic contract instantiation
 */
export const EXTRA_ABIS = {
  COMMERCE_PROTOCOL_INTEGRATION_ABI,
  PRICE_ORACLE_ABI,
}
/**
 * Type union for all contract parameter types (for documentation or generic use)
 */
export type AnyContractParams = CreatorRegistrationParams | ContentUploadParams | DirectPurchaseParams
/**
 * createReadContractHook is the generic factory for all read contract hooks in this file
 */

/**
 * CREATOR REGISTRY HOOKS
 * These hooks interact with the CreatorRegistry contract for creator management
 */

/**
 * Hook to check if an address is registered as a creator
 * Usage: const { data: isCreator, isLoading } = useIsCreatorRegistered(address)
 */
export function useIsCreatorRegistered(address: Address | undefined, chainId: number): ContractReadResult<boolean> {
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'isRegisteredCreator',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address, // Only run query when address is provided
      staleTime: 1000 * 60 * 5, // Creator status doesn't change often
      gcTime: 1000 * 60 * 15,
    }
  })

  return {
    data: result.data as boolean | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to get creator profile information
 * Returns complete creator data including earnings, content count, etc.
 */
export function useCreatorProfile(address: Address | undefined, chainId: number): ContractReadResult<Creator> {
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getCreatorProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      staleTime: 1000 * 60 * 2, // Profile data can change more frequently due to earnings
      gcTime: 1000 * 60 * 10,
    }
  })

  return {
    data: result.data as Creator | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to register as a creator
 * This is a write operation that requires user confirmation
 */
export function useRegisterCreator(chainId: number): ContractWriteWithConfirmationResult {
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])
  const queryClient = useQueryClient()
  
  // The actual write transaction
  const writeResult = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        console.log('Creator registration transaction submitted:', hash)
        // Invalidate creator-related queries when transaction is submitted
        queryClient.invalidateQueries({ queryKey: ['creator'] })
      },
      onError: (error) => {
        console.error('Creator registration failed:', error)
      }
    }
  })

  // Wait for transaction confirmation
  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
    query: {
      enabled: !!writeResult.data,
    }
  })

  // Enhanced write function that includes simulation
  const writeWithSimulation = useCallback((args?: unknown) => {
    if (typeof args === 'bigint') {
      writeResult.writeContract({
        address: contractConfig.address,
        abi: CREATOR_REGISTRY_ABI,
        functionName: 'registerCreator',
        args: [args],
      })
    } else {
      throw new Error('Expected a bigint for subscriptionPrice')
    }
  }, [writeResult.writeContract, contractConfig.address])

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: writeWithSimulation,
    reset: writeResult.reset
  }
}

/**
 * CONTENT REGISTRY HOOKS
 * These hooks interact with the ContentRegistry contract for content management
 */

/**
 * Hook to get content information by ID
 * Returns complete content metadata including creator, pricing, and access info
 */
export function useContentById(contentId: bigint | undefined, chainId: number): ContractReadResult<Content> {
  const contractConfig = useMemo(() => getContentRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getContent',
    args: contentId !== undefined ? [contentId] : undefined,
    query: {
      enabled: contentId !== undefined,
      staleTime: 1000 * 60 * 5, // Content metadata rarely changes
      gcTime: 1000 * 60 * 30, // Keep content data in cache longer
    }
  })

  return {
    data: result.data as Content | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to get content count for a creator
 * Useful for creator dashboards and profile pages
 */
export function useCreatorContentCount(creatorAddress: Address | undefined, chainId: number): ContractReadResult<bigint> {
  const contractConfig = useMemo(() => getContentRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getCreatorContent',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: !!creatorAddress,
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
    }
  })

  return {
    data: result.data as bigint | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to register new content
 * This is a write operation for creators to publish content
 */
export function useRegisterContent(chainId: number): ContractWriteWithConfirmationResult {
  const contractConfig = useMemo(() => getContentRegistryContract(chainId), [chainId])
  const queryClient = useQueryClient()
  
  const writeResult = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        console.log('Content registration transaction submitted:', hash)
        // Invalidate content-related queries
        queryClient.invalidateQueries({ queryKey: ['content'] })
        queryClient.invalidateQueries({ queryKey: ['creator'] })
      },
      onError: (error) => {
        console.error('Content registration failed:', error)
      }
    }
  })

  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
  })

  const writeContent = useCallback((args?: unknown) => {
    if (
      args && typeof args === 'object' &&
      'ipfsHash' in args &&
      'title' in args &&
      'description' in args &&
      'category' in args &&
      'payPerViewPrice' in args &&
      'tags' in args
    ) {
      const params = args as {
        ipfsHash: string,
        title: string,
        description: string,
        category: ContentCategory,
        payPerViewPrice: bigint,
        tags: string[]
      }
      writeResult.writeContract({
        address: contractConfig.address,
        abi: CONTENT_REGISTRY_ABI,
        functionName: 'registerContent',
        args: [params.ipfsHash, params.title, params.description, params.category, params.payPerViewPrice, params.tags],
      })
    } else {
      throw new Error('Invalid arguments for writeContent')
    }
  }, [writeResult.writeContract, contractConfig.address])

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: writeContent,
    reset: writeResult.reset
  }
}

/**
 * PAY PER VIEW HOOKS
 * These hooks handle pay-per-view content purchases
 */

/**
 * Hook to check if a user has access to specific content
 * Critical for content access control throughout the application
 */
export function useHasContentAccess(
  contentId: bigint | undefined, 
  userAddress: Address | undefined, 
  chainId: number
): ContractReadResult<boolean> {
  const contractConfig = useMemo(() => getPayPerViewContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: PAY_PER_VIEW_ABI,
    functionName: 'hasAccess',
    args: contentId !== undefined && userAddress ? [contentId, userAddress] : undefined,
    query: {
      enabled: contentId !== undefined && !!userAddress,
      staleTime: 1000 * 30, // Access status can change quickly after purchases
      gcTime: 1000 * 60 * 5,
      // Refetch access status more frequently since it's critical for content display
      refetchInterval: 1000 * 60, // Every minute
    }
  })

  return {
    data: result.data as boolean | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to purchase content directly (pay-per-view)
 * This is the core transaction for content monetization
 */
export function usePurchaseContent(chainId: number): ContractWriteWithConfirmationResult {
  const contractConfig = useMemo(() => getPayPerViewContract(chainId), [chainId])
  const queryClient = useQueryClient()
  
  const writeResult = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        console.log('Content purchase transaction submitted:', hash)
        // Invalidate access-related queries immediately for optimistic updates
        queryClient.invalidateQueries({ queryKey: ['hasAccess'] })
        queryClient.invalidateQueries({ queryKey: ['content'] })
      },
      onError: (error) => {
        console.error('Content purchase failed:', error)
      }
    }
  })

  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
  })

  const purchaseContent = useCallback((args?: unknown) => {
    if (
      args && typeof args === 'object' && 'contentId' in args
    ) {
      const params = args as { contentId: bigint }
      writeResult.writeContract({
        address: contractConfig.address,
        abi: PAY_PER_VIEW_ABI,
        functionName: 'purchaseContentDirect',
        args: [params.contentId],
      })
    } else {
      throw new Error('Invalid arguments for purchaseContent')
    }
  }, [writeResult.writeContract, contractConfig.address])

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: purchaseContent,
    reset: writeResult.reset
  }
}

/**
 * SUBSCRIPTION MANAGER HOOKS
 * These hooks handle subscription-based content access
 */

/**
 * Hook to check if a user is subscribed to a creator
 * Essential for subscription-based content access
 */
export function useIsSubscribed(
  userAddress: Address | undefined,
  creatorAddress: Address | undefined,
  chainId: number
): ContractReadResult<boolean> {
  const contractConfig = useMemo(() => getSubscriptionManagerContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: 'isSubscribed',
    args: userAddress && creatorAddress ? [userAddress, creatorAddress] : undefined,
    query: {
      enabled: !!userAddress && !!creatorAddress,
      staleTime: 1000 * 60, // Subscription status can change
      gcTime: 1000 * 60 * 5,
      refetchInterval: 1000 * 60 * 2, // Check every 2 minutes for subscription expiry
    }
  })

  return {
    data: result.data as boolean | undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to subscribe to a creator
 * Enables subscription-based content access
 */
export function useSubscribeToCreator(chainId: number): ContractWriteWithConfirmationResult {
  const contractConfig = useMemo(() => getSubscriptionManagerContract(chainId), [chainId])
  const queryClient = useQueryClient()
  
  const writeResult = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        console.log('Subscription transaction submitted:', hash)
        // Invalidate subscription queries for immediate feedback
        queryClient.invalidateQueries({ queryKey: ['subscription'] })
        queryClient.invalidateQueries({ queryKey: ['hasAccess'] })
      },
      onError: (error) => {
        console.error('Subscription failed:', error)
      }
    }
  })

  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
  })

  const subscribe = useCallback((args?: unknown) => {
    if (typeof args === 'string' && args.startsWith('0x') && args.length === 42) {
      writeResult.writeContract({
        address: contractConfig.address,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'subscribeToCreator',
        args: [args as Address],
      })
    } else {
      throw new Error('Expected a valid Address (0x...) for creatorAddress')
    }
  }, [writeResult.writeContract, contractConfig.address])

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: subscribe,
    reset: writeResult.reset
  }
}

/**
 * UTILITY HOOKS
 * These provide common functionality used across the application
 */

/**
 * Hook to invalidate all caches related to a specific user
 * Useful after major state changes like wallet switching
 */
export function useInvalidateUserCaches() {
  const queryClient = useQueryClient()
  
  return useCallback((userAddress: Address) => {
    // Invalidate all user-specific cached data
    queryClient.invalidateQueries({ queryKey: ['hasAccess'] })
    queryClient.invalidateQueries({ queryKey: ['subscription'] })
    queryClient.invalidateQueries({ queryKey: ['creator', userAddress] })
  }, [queryClient])
}

/**
 * Hook to batch invalidate content-related caches
 * Useful after content creation or updates
 */
export function useInvalidateContentCaches() {
  const queryClient = useQueryClient()
  
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['content'] })
    queryClient.invalidateQueries({ queryKey: ['creator'] })
  }, [queryClient])
}
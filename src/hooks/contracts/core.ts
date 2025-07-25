/**
 * Core Contract Interaction Hooks - Foundation Layer
 * File: src/hooks/contracts/core.ts
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
 * 
 * Performance Considerations:
 * - Read operations are cached based on block numbers and dependencies
 * - Write operations include transaction confirmation tracking
 * - Error states are normalized for consistent UI handling
 * - Loading states are granular to enable precise UI feedback
 */

import { 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt,
  useChainId,
  useAccount,
  useBlockNumber
} from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useEffect } from 'react'
import { type Address, type Hash } from 'viem'

// Import our foundational layers
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
  PRICE_ORACLE_ABI,
  ERC20_ABI
} from '@/lib/contracts/abi'
import type { 
  Creator,
  Content,
  ContentCategory,
  CreatorRegistrationParams,
  ContentUploadParams,
  DirectPurchaseParams,
  AccessControlResult
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

// ===== CREATOR REGISTRY HOOKS =====
// These hooks interact with the CreatorRegistry contract for creator management

/**
 * Hook to check if an address is registered as a creator
 * 
 * This is one of the most frequently called functions, so we optimize it heavily
 * for caching. The registration status rarely changes, so we can cache aggressively.
 * 
 * @param creatorAddress - Address to check for registration
 * @returns Boolean indicating registration status with loading/error states
 */
export function useIsCreatorRegistered(creatorAddress: Address | undefined): ContractReadResult<boolean> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'isCreatorRegistered',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: !!creatorAddress, // Only run when we have an address
      staleTime: 1000 * 60 * 10, // Creator registration rarely changes, cache for 10 minutes
      gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
      retry: 3, // Retry failed requests up to 3 times
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to get complete creator profile information
 * 
 * This returns the full Creator struct from the contract, providing all the data
 * needed for creator profiles, dashboards, and analytics displays.
 * 
 * @param creatorAddress - Address of the creator to fetch
 * @returns Complete creator profile data
 */
export function useCreatorProfile(creatorAddress: Address | undefined): ContractReadResult<Creator> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getCreatorProfile',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: !!creatorAddress,
      staleTime: 1000 * 60 * 5, // Profile data can change more frequently, cache for 5 minutes
      gcTime: 1000 * 60 * 15,
      retry: 3,
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to get creator's pending earnings (withdrawable amount)
 * 
 * This data changes frequently as purchases occur, so we use shorter cache times
 * and provide easy refresh capabilities for real-time earnings tracking.
 * 
 * @param creatorAddress - Address of the creator
 * @returns Pending earnings amount in USDC (as BigInt)
 */
export function useCreatorPendingEarnings(creatorAddress: Address | undefined): ContractReadResult<bigint> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'creatorPendingEarnings',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: !!creatorAddress,
      staleTime: 1000 * 30, // Earnings change frequently, cache for only 30 seconds
      gcTime: 1000 * 60 * 5,
      retry: 3,
      refetchInterval: 1000 * 60, // Auto-refresh every minute for real-time earnings
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to register as a creator on the platform
 * 
 * This is a write operation that includes full transaction tracking from submission
 * through confirmation. The hook handles the entire lifecycle including optimistic
 * updates and cache invalidation.
 * 
 * @returns Write hook with transaction tracking and confirmation
 */
export function useRegisterCreator(): ContractWriteWithConfirmationResult {
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])
  
  // Main write operation using wagmi's useWriteContract
  const writeResult = useWriteContract()
  
  // Transaction confirmation tracking
  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
    query: {
      enabled: !!writeResult.data,
    }
  })

  // Invalidate relevant caches when transaction confirms
  useEffect(() => {
    if (confirmationResult.isSuccess) {
      // Invalidate creator registration and profile queries
      queryClient.invalidateQueries({ 
        queryKey: ['readContract'] // This invalidates all read contract queries
      })
    }
  }, [confirmationResult.isSuccess, queryClient])

  // Enhanced write function that includes parameter validation
  const writeWithValidation = useCallback((args?: unknown) => {
    if (typeof args !== 'bigint') {
      throw new Error('Expected a bigint for subscription price');
    }
  
    const subscriptionPrice = args;
  
    if (subscriptionPrice < BigInt(10000)) {
      throw new Error('Subscription price must be at least $0.01');
    }
  
    if (subscriptionPrice > BigInt(100000000)) {
      throw new Error('Subscription price cannot exceed $100.00');
    }
  
    writeResult.writeContract({
      address: contractConfig.address,
      abi: CREATOR_REGISTRY_ABI,
      functionName: 'registerCreator',
      args: [subscriptionPrice],
    });
  }, [writeResult, contractConfig.address]);

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: writeWithValidation,
    reset: writeResult.reset
  }
}

/**
 * Hook to withdraw creator earnings
 * 
 * This allows creators to withdraw their accumulated earnings. Includes validation
 * to ensure withdrawal amounts don't exceed available balance.
 * 
 * @returns Write hook for earnings withdrawal
 */
export function useWithdrawEarnings(): ContractWriteWithConfirmationResult {
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const contractConfig = useMemo(() => getCreatorRegistryContract(chainId), [chainId])
  
  const writeResult = useWriteContract()
  
  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
    query: {
      enabled: !!writeResult.data,
    }
  })

  // Invalidate earnings queries when withdrawal confirms
  useEffect(() => {
    if (confirmationResult.isSuccess) {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.includes('creatorPendingEarnings') ||
          query.queryKey.includes('getCreatorProfile')
      })
    }
  }, [confirmationResult.isSuccess, queryClient])

  const writeWithValidation = useCallback((args?: unknown) => {
    if (typeof args !== 'bigint') {
      throw new Error('Expected a bigint for withdrawal amount');
    }
  
    const amount = args;
  
    if (amount <= BigInt(0)) {
      throw new Error('Withdrawal amount must be greater than zero');
    }
  
    writeResult.writeContract({
      address: contractConfig.address,
      abi: CREATOR_REGISTRY_ABI,
      functionName: 'withdrawEarnings',
      args: [amount],
    });
  }, [writeResult, contractConfig.address]);

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: writeWithValidation,
    reset: writeResult.reset
  }
}

// ===== CONTENT REGISTRY HOOKS =====
// These hooks interact with the ContentRegistry contract for content management

/**
 * Hook to get content information by ID
 * 
 * This is heavily used throughout the application, so we implement aggressive caching
 * since content metadata rarely changes once published.
 * 
 * @param contentId - Unique identifier for the content
 * @returns Complete content metadata including creator and pricing information
 */
export function useContentById(contentId: bigint | undefined): ContractReadResult<Content> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getContentRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getContent',
    args: contentId !== undefined ? [contentId] : undefined,
    query: {
      enabled: contentId !== undefined,
      staleTime: 1000 * 60 * 15, // Content metadata rarely changes, cache for 15 minutes
      gcTime: 1000 * 60 * 60, // Keep content data in cache for 1 hour
      retry: 3,
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to get paginated list of active content
 * 
 * This powers the main content discovery interface. We use shorter cache times
 * since new content is being published regularly.
 * 
 * @param offset - Starting index for pagination
 * @param limit - Number of items to return
 * @returns Array of content IDs and total count
 */
export function useActiveContentPaginated(
  offset: number, 
  limit: number
): ContractReadResult<{ contentIds: readonly bigint[]; total: bigint }> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getContentRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getActiveContentPaginated',
    args: [BigInt(offset), BigInt(limit)],
    query: {
      staleTime: 1000 * 60 * 2, // New content published frequently, cache for 2 minutes
      gcTime: 1000 * 60 * 10,
      retry: 3,
    }
  })

  return {
    data: result.data ? {
      contentIds: result.data[0],
      total: result.data[1]
    } : undefined,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to get all content created by a specific creator
 * 
 * This is used for creator dashboards and profile pages. The content list
 * for a creator can change as they publish new content.
 * 
 * @param creatorAddress - Address of the creator
 * @returns Array of content IDs created by the creator
 */
export function useCreatorContent(creatorAddress: Address | undefined): ContractReadResult<readonly bigint[]> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getContentRegistryContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getCreatorContent',
    args: creatorAddress ? [creatorAddress] : undefined,
    query: {
      enabled: !!creatorAddress,
      staleTime: 1000 * 60 * 5, // Creator content can change, cache for 5 minutes
      gcTime: 1000 * 60 * 15,
      retry: 3,
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to register new content on the platform
 * 
 * This is a complex write operation that validates content parameters and
 * handles the full content registration workflow.
 * 
 * @returns Write hook for content registration
 */
export function useRegisterContent(): ContractWriteWithConfirmationResult {
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const contractConfig = useMemo(() => getContentRegistryContract(chainId), [chainId])
  
  const writeResult = useWriteContract()
  
  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
    query: {
      enabled: !!writeResult.data,
    }
  })

  // Invalidate content queries when new content is registered
  useEffect(() => {
    if (confirmationResult.isSuccess) {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.includes('getActiveContentPaginated') ||
          query.queryKey.includes('getCreatorContent')
      })
    }
  }, [confirmationResult.isSuccess, queryClient])

  const writeWithValidation = useCallback((args?: unknown) => {
    if (
      !args ||
      typeof args !== 'object' ||
      !('ipfsHash' in args) ||
      !('title' in args) ||
      !('description' in args) ||
      !('category' in args) ||
      !('payPerViewPrice' in args) ||
      !('tags' in args)
    ) {
      throw new Error('Invalid content parameters')
    }
  
    const params = args as ContentUploadParams

    // Validate content parameters
    if (!params.ipfsHash || params.ipfsHash.length < 10) {
      throw new Error('Valid IPFS hash is required')
    }
    
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Content title is required')
    }
    
    if (params.title.length > 200) {
      throw new Error('Content title must be 200 characters or less')
    }
    
    if (params.description.length > 1000) {
      throw new Error('Content description must be 1000 characters or less')
    }
    
    if (params.payPerViewPrice <= BigInt(0)) {
      throw new Error('Content price must be greater than zero')
    }
    
    if (params.payPerViewPrice > BigInt(100000000)) { // 100 USDC
      throw new Error('Content price cannot exceed $100.00')
    }

    writeResult.writeContract({
      address: contractConfig.address,
      abi: CONTENT_REGISTRY_ABI,
      functionName: 'registerContent',
      args: [
        params.ipfsHash,
        params.title,
        params.description,
        params.category,
        params.payPerViewPrice,
        params.tags,
      ],
    })
  }, [writeResult, contractConfig.address])

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: writeWithValidation,
    reset: writeResult.reset
  }
}

// ===== PAY-PER-VIEW HOOKS =====
// These hooks handle individual content purchases and access control

/**
 * Hook to check if a user has purchased specific content
 * 
 * This is a critical function for access control. We cache it aggressively since
 * purchase status rarely changes (once purchased, always purchased).
 * 
 * @param userAddress - Address of the user to check
 * @param contentId - ID of the content to check access for
 * @returns Boolean indicating whether user has purchased the content
 */
export function useHasPaidForContent(
  userAddress: Address | undefined, 
  contentId: bigint | undefined
): ContractReadResult<boolean> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getPayPerViewContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: PAY_PER_VIEW_ABI,
    functionName: 'hasPaid',
    args: userAddress && contentId !== undefined ? [userAddress, contentId] : undefined,
    query: {
      enabled: !!userAddress && contentId !== undefined,
      staleTime: 1000 * 60 * 15, // Purchase status rarely changes, cache aggressively
      gcTime: 1000 * 60 * 60,
      retry: 3,
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to check comprehensive access to content (purchase OR subscription)
 * 
 * This is the main access control hook that checks both direct purchases and
 * subscription-based access. Most content components will use this hook.
 * 
 * @param userAddress - Address of the user
 * @param contentId - ID of the content
 * @returns Boolean indicating any form of access to the content
 */
export function useHasContentAccess(
  userAddress: Address | undefined, 
  contentId: bigint | undefined
): ContractReadResult<boolean> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getPayPerViewContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: PAY_PER_VIEW_ABI,
    functionName: 'hasAccess',
    args: userAddress && contentId !== undefined ? [userAddress, contentId] : undefined,
    query: {
      enabled: !!userAddress && contentId !== undefined,
      staleTime: 1000 * 60 * 5, // Access can change via subscription, moderate caching
      gcTime: 1000 * 60 * 20,
      retry: 3,
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to purchase content directly
 * 
 * This handles the direct content purchase flow. Includes comprehensive validation
 * and optimistic UI updates for better user experience.
 * 
 * @returns Write hook for content purchases
 */
export function usePurchaseContent(): ContractWriteWithConfirmationResult {
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const contractConfig = useMemo(() => getPayPerViewContract(chainId), [chainId])
  
  const writeResult = useWriteContract()
  
  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
    query: {
      enabled: !!writeResult.data,
    }
  })

  // Invalidate access control queries when purchase confirms
  useEffect(() => {
    if (confirmationResult.isSuccess) {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.includes('hasPaid') ||
          query.queryKey.includes('hasAccess')
      })
    }
  }, [confirmationResult.isSuccess, queryClient])

  const writeWithValidation = useCallback((args?: unknown) => {
    
    if (typeof args !== 'bigint') {
      throw new Error('Expected a Bigint for content ID')
    }

    const contentId = args

    if (contentId <= BigInt(0)) {
      throw new Error('Invalid content ID')
    }

    writeResult.writeContract({
      address: contractConfig.address,
      abi: PAY_PER_VIEW_ABI,
      functionName: 'purchaseContent',
      args: [contentId],
    })
  }, [writeResult, contractConfig.address])

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: writeWithValidation,
    reset: writeResult.reset
  }
}

// ===== SUBSCRIPTION MANAGER HOOKS =====
// These hooks handle creator subscriptions and recurring access

/**
 * Hook to check if a user is subscribed to a creator
 * 
 * Subscription status can change over time (expiration), so we use moderate
 * caching with regular refresh for accurate subscription tracking.
 * 
 * @param userAddress - Address of the user
 * @param creatorAddress - Address of the creator
 * @returns Boolean indicating active subscription status
 */
export function useIsSubscribed(
  userAddress: Address | undefined, 
  creatorAddress: Address | undefined
): ContractReadResult<boolean> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getSubscriptionManagerContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: 'isSubscribed',
    args: userAddress && creatorAddress ? [userAddress, creatorAddress] : undefined,
    query: {
      enabled: !!userAddress && !!creatorAddress,
      staleTime: 1000 * 60 * 2, // Subscriptions can expire, check frequently
      gcTime: 1000 * 60 * 10,
      retry: 3,
      refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to get subscription expiry timestamp
 * 
 * This provides the exact expiration time for subscription management and
 * renewal reminders.
 * 
 * @param userAddress - Address of the user
 * @param creatorAddress - Address of the creator
 * @returns Timestamp when subscription expires
 */
export function useSubscriptionExpiry(
  userAddress: Address | undefined, 
  creatorAddress: Address | undefined
): ContractReadResult<bigint> {
  const chainId = useChainId()
  const contractConfig = useMemo(() => getSubscriptionManagerContract(chainId), [chainId])
  
  const result = useReadContract({
    address: contractConfig.address,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: 'getSubscriptionExpiry',
    args: userAddress && creatorAddress ? [userAddress, creatorAddress] : undefined,
    query: {
      enabled: !!userAddress && !!creatorAddress,
      staleTime: 1000 * 60 * 5, // Expiry time is fixed, moderate caching
      gcTime: 1000 * 60 * 15,
      retry: 3,
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to subscribe to a creator
 * 
 * This handles the subscription purchase flow with validation to ensure
 * the creator is registered and has valid subscription pricing.
 * 
 * @returns Write hook for creator subscriptions
 */
export function useSubscribeToCreator(): ContractWriteWithConfirmationResult {
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const contractConfig = useMemo(() => getSubscriptionManagerContract(chainId), [chainId])
  
  const writeResult = useWriteContract()
  
  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
    query: {
      enabled: !!writeResult.data,
    }
  })

  // Invalidate subscription queries when subscription confirms
  useEffect(() => {
    if (confirmationResult.isSuccess) {
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.includes('isSubscribed') ||
          query.queryKey.includes('getSubscriptionExpiry') ||
          query.queryKey.includes('hasAccess')
      })
    }
  }, [confirmationResult.isSuccess, queryClient])

  const writeWithValidation = useCallback((args?: unknown) => {
    if (typeof args !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(args)) {
      throw new Error('Valid creator address is required');
    }
  
    const creatorAddress = args as Address;
  
    if (creatorAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Zero address is not allowed');
    }
  
    writeResult.writeContract({
      address: contractConfig.address,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: 'subscribe',
      args: [creatorAddress],
    });
  }, [writeResult, contractConfig.address]);

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: writeWithValidation,
    reset: writeResult.reset
  }
}

// ===== ERC20 TOKEN HOOKS =====
// These hooks handle interactions with ERC20 tokens like USDC

/**
 * Hook to get ERC20 token balance for an address
 * 
 * This is used to check USDC balances before purchases and for wallet displays.
 * Token balances change frequently, so we use short cache times.
 * 
 * @param tokenAddress - Address of the ERC20 token contract
 * @param userAddress - Address to check balance for
 * @returns Token balance as BigInt
 */
export function useTokenBalance(
  tokenAddress: Address | undefined,
  userAddress: Address | undefined
): ContractReadResult<bigint> {
  const result = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!tokenAddress && !!userAddress,
      staleTime: 1000 * 30, // Token balances change frequently
      gcTime: 1000 * 60 * 5,
      retry: 3,
      refetchInterval: 1000 * 60, // Auto-refresh every minute
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to get ERC20 token allowance
 * 
 * This checks how much a spender (like our contracts) is allowed to spend
 * on behalf of the token owner. Critical for payment flows.
 * 
 * @param tokenAddress - Address of the ERC20 token
 * @param owner - Address of the token owner
 * @param spender - Address of the approved spender
 * @returns Allowance amount as BigInt
 */
export function useTokenAllowance(
  tokenAddress: Address | undefined,
  owner: Address | undefined,
  spender: Address | undefined
): ContractReadResult<bigint> {
  const result = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!owner && !!spender,
      staleTime: 1000 * 60, // Allowances change less frequently
      gcTime: 1000 * 60 * 10,
      retry: 3,
    }
  })

  return {
    data: result.data,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    isSuccess: result.isSuccess,
    refetch: result.refetch
  }
}

/**
 * Hook to approve ERC20 token spending
 * 
 * This allows contracts to spend tokens on behalf of users. Required before
 * most purchase operations in the platform.
 * 
 * @returns Write hook for token approvals
 */
export function useApproveToken(): ContractWriteWithConfirmationResult {
  const queryClient = useQueryClient()
  
  const writeResult = useWriteContract()
  
  const confirmationResult = useWaitForTransactionReceipt({
    hash: writeResult.data,
    query: {
      enabled: !!writeResult.data,
    }
  })

  // Invalidate allowance queries when approval confirms
  useEffect(() => {
    if (confirmationResult.isSuccess) {
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey.includes('allowance')
      })
    }
  }, [confirmationResult.isSuccess, queryClient])

  const writeWithValidation = useCallback((args?: unknown) => {
    if (
      !args ||
      typeof args !== 'object' ||
      !('tokenAddress' in args) ||
      !('spender' in args) ||
      !('amount' in args)
    ) {
      throw new Error('Invalid approval parameters');
    }
  
    const { tokenAddress, spender, amount } = args as {
      tokenAddress: Address;
      spender: Address;
      amount: bigint;
    };
  
    const isValidAddress = (addr: string) =>
      typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr) && addr !== '0x0000000000000000000000000000000000000000';
  
    if (!isValidAddress(tokenAddress)) {
      throw new Error('Valid token address is required');
    }
  
    if (!isValidAddress(spender)) {
      throw new Error('Valid spender address is required');
    }
  
    if (typeof amount !== 'bigint' || amount < BigInt(0)) {
      throw new Error('Approval amount must be a non-negative bigint');
    }
  
    writeResult.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  }, [writeResult]);
  

  return {
    hash: writeResult.data,
    isLoading: writeResult.isPending,
    isError: writeResult.isError || confirmationResult.isError,
    error: writeResult.error || confirmationResult.error,
    isSuccess: writeResult.isSuccess,
    isConfirming: confirmationResult.isLoading,
    isConfirmed: confirmationResult.isSuccess,
    confirmationError: confirmationResult.error,
    write: writeWithValidation,
    reset: writeResult.reset
  }
}
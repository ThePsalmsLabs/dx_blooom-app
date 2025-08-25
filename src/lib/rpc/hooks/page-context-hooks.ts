// src/lib/rpc/hooks/page-context-hooks.ts

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChainId, useAccount } from 'wagmi'
import type { Address } from 'viem'
import { useRouter } from 'next/router'
import { rpcManager, RPCRequest, RPCResponse } from '../core/rpc-manager'
import { getContractAddresses } from '@/lib/contracts/addresses'

/**
 * Page-Context Aware RPC Hook System
 * 
 * This system intelligently batches RPC calls based on the page context,
 * user needs, and data relationships. It replaces individual contract
 * calls with smart, coordinated requests that minimize RPC usage.
 */

// Page context definitions
export type PageContext = 
  | 'content-list'      // Content discovery/browsing
  | 'content-detail'    // Individual content viewing
  | 'creator-profile'   // Creator page viewing
  | 'user-dashboard'    // User's personal dashboard
  | 'subscription-mgmt' // Subscription management
  | 'purchase-flow'     // Content purchase process
  | 'miniapp'          // MiniApp context
  | 'unknown'          // Default fallback

export interface PageContextData {
  contentIds?: bigint[]
  creatorAddresses?: Address[]
  userAddress?: Address
  subscriptionIds?: bigint[]
  purchaseIntentIds?: string[]
}

export interface BatchedHookResult<T> {
  data?: T
  isLoading: boolean
  isError: boolean
  error?: Error
  refetch: () => Promise<void>
  source: 'cache' | 'batch' | 'single'
}

/**
 * Hook to detect and manage page context for optimal RPC batching
 */
export function usePageContext(): { context: PageContext; data: PageContextData } {
  const router = useRouter()
  const { address } = useAccount()
  
  return useMemo(() => {
    const path = router.asPath
    const query = router.query

    // Detect page context from route
    let context: PageContext = 'unknown'
    const data: PageContextData = { userAddress: address }

    if (path.includes('/mini') || query.miniApp) {
      context = 'miniapp'
    } else if (path.startsWith('/content/') && query.id) {
      context = 'content-detail'
      data.contentIds = [BigInt(query.id as string)]
    } else if (path.startsWith('/content') || path === '/') {
      context = 'content-list'
    } else if (path.startsWith('/creator/') && query.address) {
      context = 'creator-profile'
      data.creatorAddresses = [query.address as Address]
    } else if (path.includes('/dashboard')) {
      context = 'user-dashboard'
    } else if (path.includes('/subscription')) {
      context = 'subscription-mgmt'
    } else if (path.includes('/purchase')) {
      context = 'purchase-flow'
    }

    return { context, data }
  }, [router.asPath, router.query, address])
}

/**
 * Base hook for batched RPC requests with intelligent context awareness
 */
function useBatchedRPC<T>(
  requests: RPCRequest[],
  dependencies: unknown[] = [],
  options: {
    enabled?: boolean
    refetchInterval?: number
    staleTime?: number
  } = {}
): BatchedHookResult<T[]> {
  const [data, setData] = useState<T[]>()
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error>()
  const [source, setSource] = useState<'cache' | 'batch' | 'single'>('batch')
  
  const requestsRef = useRef<RPCRequest[]>([])
  const { context } = usePageContext()

  // Memoize requests to prevent unnecessary re-renders
  const memoizedRequests = useMemo(() => {
    return requests.map(req => ({
      ...req,
      pageContext: context,
      priority: req.priority || 'medium' as const
    }))
  }, [requests, context, ...dependencies])

  const fetchData = useCallback(async () => {
    if (!options.enabled !== false && memoizedRequests.length > 0) {
      setIsLoading(true)
      setIsError(false)
      
      try {
        const responses = await Promise.all(
          memoizedRequests.map(req => rpcManager.executeRequest<T>(req))
        )

        const results: T[] = []
        let primarySource: 'cache' | 'batch' | 'single' = 'batch'

        responses.forEach(response => {
          if (response.error) {
            throw response.error
          }
          
          if (response.data !== undefined) {
            results.push(response.data)
          }
          
          if (response.source === 'cache') {
            primarySource = 'cache'
          }
        })

        setData(results)
        setSource(primarySource)
      } catch (err) {
        setIsError(true)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [memoizedRequests, options.enabled])

  // Execute requests when dependencies change
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Set up refetch interval if specified
  useEffect(() => {
    if (options.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, options.refetchInterval])

  const refetch = useCallback(async () => {
    await fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    source
  }
}

/**
 * Content List Page Hook - Batches all content-related calls for browsing
 */
export function useContentListData(
  limit: number = 20,
  offset: number = 0,
  category?: string
): BatchedHookResult<{
  contents: Array<{
    id: bigint
    title: string
    creator: Address
    price: bigint
    hasAccess: boolean
  }>
  totalCount: bigint
  creators: Map<Address, { name: string; isRegistered: boolean }>
}> {
  const chainId = useChainId()
  const { address: userAddress } = useAccount()
  const contractAddresses = getContractAddresses(chainId)

  const requests = useMemo((): RPCRequest[] => {
    if (!contractAddresses) return []

    const baseRequests: RPCRequest[] = [
      // Get total content count
      {
        id: 'total-content-count',
        address: contractAddresses.CONTENT_REGISTRY,
        abi: [], // Your ABI here
        functionName: 'getTotalContentCount',
        args: category ? [category] : undefined,
        chainId,
        priority: 'medium',
        cacheDuration: 60000 // Cache for 1 minute
      }
    ]

    // Generate requests for content batch
    for (let i = offset; i < offset + limit; i++) {
      baseRequests.push({
        id: `content-${i}`,
        address: contractAddresses.CONTENT_REGISTRY,
        abi: [], // Your ABI here
        functionName: 'getContentByIndex',
        args: [BigInt(i)],
        chainId,
        priority: 'high',
        cacheDuration: 30000
      })
    }

    return baseRequests
  }, [chainId, contractAddresses, limit, offset, category])

  const hookResult = useBatchedRPC(requests, [limit, offset, category])

  // Transform the raw results into structured data
  const transformedData = useMemo(() => {
    if (!hookResult.data) return undefined

    const [totalCountResult, ...contentResults] = hookResult.data

    // Process results and create the final data structure
    // This would include creating the Map of creators and checking access
    // Implementation depends on your exact contract structure
    
    return {
      contents: [], // Transform contentResults into proper format
      totalCount: totalCountResult as bigint,
      creators: new Map() // Build creator map from content results
    }
  }, [hookResult.data])

  return {
    ...hookResult,
    data: transformedData
  }
}

/**
 * Content Detail Page Hook - Optimized for single content viewing
 */
export function useContentDetailData(
  contentId: bigint | undefined
): BatchedHookResult<{
  content: {
    id: bigint
    title: string
    description: string
    creator: Address
    price: bigint
    category: string
    isActive: boolean
    purchaseCount: bigint
  }
  creator: {
    name: string
    subscriptionPrice: bigint
    isRegistered: boolean
    totalSubscribers: bigint
  }
  userAccess: {
    hasDirectAccess: boolean
    hasSubscriptionAccess: boolean
    subscriptionStatus: boolean
  }
  relatedContent: Array<{ id: bigint; title: string; price: bigint }>
}> {
  const chainId = useChainId()
  const { address: userAddress } = useAccount()
  const contractAddresses = getContractAddresses(chainId)

  const requests = useMemo((): RPCRequest[] => {
    if (!contractAddresses || !contentId) return []

    return [
      // Core content data
      {
        id: 'content-data',
        address: contractAddresses.CONTENT_REGISTRY,
        abi: [], // Your ABI here
        functionName: 'getContent',
        args: [contentId],
        chainId,
        priority: 'high',
        cacheDuration: 60000
      },
      
      // User access checks if logged in
      ...(userAddress ? [
        {
          id: 'direct-access',
          address: contractAddresses.PAY_PER_VIEW,
          abi: [],
          functionName: 'hasAccess',
          args: [contentId, userAddress],
          chainId,
          priority: 'high' as const,
          cacheDuration: 10000 // Shorter cache for access data
        },
        {
          id: 'purchase-status',
          address: contractAddresses.PAY_PER_VIEW,
          abi: [],
          functionName: 'hasPurchased',
          args: [userAddress, contentId],
          chainId,
          priority: 'high' as const,
          cacheDuration: 10000
        }
      ] : [])
    ]
  }, [chainId, contractAddresses, contentId, userAddress])

  const hookResult = useBatchedRPC(requests, [contentId, userAddress])

  // Transform results
  const transformedData = useMemo(() => {
    if (!hookResult.data || hookResult.data.length === 0) return undefined

    // Process and structure the data based on your contract returns
    // This is where you'd implement the actual data transformation
    
    return {
      content: {} as any, // Transform first result
      creator: {} as any, // Transform creator data
      userAccess: {} as any, // Transform access data
      relatedContent: [] as any[] // Transform related content
    }
  }, [hookResult.data])

  return {
    ...hookResult,
    data: transformedData
  }
}

/**
 * Creator Profile Page Hook - Optimized for creator page viewing
 */
export function useCreatorProfileData(
  creatorAddress: Address | undefined
): BatchedHookResult<{
  profile: {
    name: string
    description: string
    subscriptionPrice: bigint
    isRegistered: boolean
    totalSubscribers: bigint
    totalContent: bigint
  }
  content: Array<{
    id: bigint
    title: string
    price: bigint
    purchaseCount: bigint
    hasAccess: boolean
  }>
  userSubscription: {
    isActive: boolean
    endTime: bigint
    autoRenewal: boolean
  } | null
}> {
  const chainId = useChainId()
  const { address: userAddress } = useAccount()
  const contractAddresses = getContractAddresses(chainId)

  const requests = useMemo((): RPCRequest[] => {
    if (!contractAddresses || !creatorAddress) return []

    const baseRequests: RPCRequest[] = [
      // Creator profile
      {
        id: 'creator-profile',
        address: contractAddresses.CREATOR_REGISTRY,
        abi: [],
        functionName: 'getCreatorProfile',
        args: [creatorAddress],
        chainId,
        priority: 'high',
        cacheDuration: 120000 // 2 minutes for creator data
      },
      
      // Creator content list
      {
        id: 'creator-content',
        address: contractAddresses.CONTENT_REGISTRY,
        abi: [],
        functionName: 'getCreatorContent',
        args: [creatorAddress, BigInt(0), BigInt(50)], // First 50 items
        chainId,
        priority: 'medium',
        cacheDuration: 60000
      }
    ]

    // Add user subscription check if logged in
    if (userAddress) {
      baseRequests.push({
        id: 'user-subscription',
        address: contractAddresses.SUBSCRIPTION_MANAGER,
        abi: [],
        functionName: 'getSubscriptionStatus',
        args: [userAddress, creatorAddress],
        chainId,
        priority: 'high',
        cacheDuration: 15000 // 15 seconds for subscription status
      })
    }

    return baseRequests
  }, [chainId, contractAddresses, creatorAddress, userAddress])

  const hookResult = useBatchedRPC(requests, [creatorAddress, userAddress])

  return {
    ...hookResult,
    data: hookResult.data ? {} as any : undefined // Transform based on your needs
  }
}

/**
 * User Dashboard Hook - Comprehensive user data batching
 */
export function useUserDashboardData(): BatchedHookResult<{
  purchases: Array<{ contentId: bigint; purchaseTime: bigint; title: string }>
  subscriptions: Array<{ 
    creator: Address
    creatorName: string
    isActive: boolean
    endTime: bigint
    autoRenewal: boolean
  }>
  earnings: {
    totalEarnings: bigint
    pendingWithdrawals: bigint
    subscriptionEarnings: bigint
  }
  creatorStats: {
    totalContent: bigint
    totalSubscribers: bigint
    contentViews: bigint
  }
}> {
  const chainId = useChainId()
  const { address: userAddress } = useAccount()
  const contractAddresses = getContractAddresses(chainId)

  const requests = useMemo((): RPCRequest[] => {
    if (!contractAddresses || !userAddress) return []

    return [
      // User purchases
      {
        id: 'user-purchases',
        address: contractAddresses.PAY_PER_VIEW,
        abi: [],
        functionName: 'getUserPurchases',
        args: [userAddress],
        chainId,
        priority: 'high',
        cacheDuration: 30000
      },
      
      // User subscriptions
      {
        id: 'user-subscriptions',
        address: contractAddresses.SUBSCRIPTION_MANAGER,
        abi: [],
        functionName: 'getUserSubscriptions',
        args: [userAddress],
        chainId,
        priority: 'high',
        cacheDuration: 30000
      },
      
      // Creator earnings (if user is a creator)
      {
        id: 'creator-earnings',
        address: contractAddresses.CREATOR_REGISTRY,
        abi: [],
        functionName: 'getCreatorEarnings',
        args: [userAddress],
        chainId,
        priority: 'medium',
        cacheDuration: 60000
      }
    ]
  }, [chainId, contractAddresses, userAddress])

  const hookResult = useBatchedRPC(requests, [userAddress])

  return {
    ...hookResult,
    data: hookResult.data ? {} as any : undefined // Transform based on your contract structure
  }
}

/**
 * Purchase Flow Hook - Optimized for purchase process
 */
export function usePurchaseFlowData(
  contentIds: bigint[],
  userAddress: Address | undefined
): BatchedHookResult<Array<{
  contentId: bigint
  content: { title: string; price: bigint; creator: Address }
  requiresApproval: boolean
  currentAllowance: bigint
  hasAccess: boolean
}>> {
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)

  const requests = useMemo((): RPCRequest[] => {
    if (!contractAddresses || !userAddress || contentIds.length === 0) return []

    const allRequests: RPCRequest[] = []

    contentIds.forEach((contentId, index) => {
      // Content data
      allRequests.push({
        id: `content-${index}`,
        address: contractAddresses.CONTENT_REGISTRY,
        abi: [],
        functionName: 'getContent',
        args: [contentId],
        chainId,
        priority: 'high',
        cacheDuration: 60000
      })

      // Access check
      allRequests.push({
        id: `access-${index}`,
        address: contractAddresses.PAY_PER_VIEW,
        abi: [],
        functionName: 'hasAccess',
        args: [contentId, userAddress],
        chainId,
        priority: 'high',
        cacheDuration: 5000 // Very fresh data for purchase flow
      })

      // USDC allowance check
      allRequests.push({
        id: `allowance-${index}`,
        address: contractAddresses.USDC,
        abi: [],
        functionName: 'allowance',
        args: [userAddress, contractAddresses.PAY_PER_VIEW],
        chainId,
        priority: 'high',
        cacheDuration: 10000
      })
    })

    return allRequests
  }, [chainId, contractAddresses, contentIds, userAddress])

  const hookResult = useBatchedRPC(requests, [contentIds, userAddress])

  const transformedData = useMemo(() => {
    if (!hookResult.data) return undefined

    // Transform the batched results into structured purchase data
    // Group by contentId and combine related data
    const results = contentIds.map((contentId, index) => {
      const contentData = hookResult.data![index * 3] // Every 3rd item starting from index
      const accessData = hookResult.data![index * 3 + 1]
      const allowanceData = hookResult.data![index * 3 + 2]

      return {
        contentId,
        content: contentData as any,
        requiresApproval: false, // Calculate based on allowance vs price
        currentAllowance: allowanceData as bigint,
        hasAccess: accessData as boolean
      }
    })

    return results
  }, [hookResult.data, contentIds])

  return {
    ...hookResult,
    data: transformedData
  }
}

/**
 * Cache invalidation hook for triggering updates after transactions
 */
export function useRPCCacheInvalidation() {
  const invalidateCache = useCallback((pattern: string, context?: string) => {
    rpcManager.invalidateCache(pattern, context)
  }, [])

  const invalidateAfterPurchase = useCallback((contentId: bigint, userAddress: Address) => {
    // Invalidate all access-related cache entries
    rpcManager.invalidateCache('purchase', `content-${contentId}`)
  }, [invalidateCache])

  const invalidateAfterSubscription = useCallback((creatorAddress: Address, userAddress: Address) => {
    // Invalidate subscription-related cache entries
    rpcManager.invalidateCache('subscription', `creator-${creatorAddress}`)
  }, [invalidateCache])

  return {
    invalidateCache,
    invalidateAfterPurchase,
    invalidateAfterSubscription
  }
}
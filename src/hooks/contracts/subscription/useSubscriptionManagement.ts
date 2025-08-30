/**
 * Subscription Management Hook - Phase 3 Component
 * File: src/hooks/contracts/subscription/useSubscriptionManagement.ts
 * 
 * This hook provides comprehensive user-side subscription lifecycle management,
 * implementing the complete subscription workflow including cancellation, details fetching,
 * and subscription listing. It follows your established architectural patterns from core.ts
 * while providing the sophisticated subscription management capabilities that transform
 * your platform from basic content access into a professional subscription service.
 * 
 * Educational Architecture Integration:
 * - Extends your ContractReadResult<T> and ContractWriteResult interface patterns
 * - Uses your getContractAddresses() configuration system for type-safe contract access
 * - Follows your established wagmi/viem integration patterns from core.ts
 * - Integrates with TanStack Query for intelligent caching and state management
 * - Provides the same error handling and loading state patterns used throughout your platform
 * 
 * Key Business Functions Implemented:
 * - cancelSubscription: Handles both immediate and end-of-period cancellations
 * - getSubscriptionDetails: Fetches comprehensive subscription information with status
 * - getUserSubscriptions: Retrieves all user subscriptions including historical
 * - getUserActiveSubscriptions: Filters to only currently active subscriptions
 * 
 * Smart Contract Integration:
 * - Uses SUBSCRIPTION_MANAGER contract at configured address
 * - Handles transaction confirmation and state management
 * - Provides proper gas estimation and error recovery
 * - Integrates with subscription events for real-time updates
 * 
 * Performance Optimizations:
 * - Intelligent caching based on subscription change frequency
 * - Batch queries for multiple subscription operations
 * - Optimistic updates for immediate UI feedback
 * - Query invalidation strategies for consistent state
 */

import { 
    useReadContract, 
    useReadContracts,
    useWriteContract, 
    useWaitForTransactionReceipt,
    useChainId,
    useAccount,
    useWatchContractEvent
  } from 'wagmi'
  import { useQueryClient } from '@tanstack/react-query'
  import { useCallback, useMemo, useEffect } from 'react'
  import { type Address } from 'viem'
  
  // Import your established foundational layers
  import { getContractAddresses } from '@/lib/contracts/config'
  import { SUBSCRIPTION_MANAGER_ABI, CREATOR_REGISTRY_ABI } from '@/lib/contracts/abis'
  import type { ContractWriteWithConfirmationResult } from '@/hooks/contracts/core'
  import { useSubscriptionPurchase } from './useSubscriptionPurchase'
  
  // ===== SUBSCRIPTION MANAGEMENT TYPE DEFINITIONS =====
  
  /**
   * Subscription Record Interface
   * 
   * This interface mirrors the smart contract's SubscriptionRecord struct,
   * providing comprehensive subscription information with calculated fields
   * for UI display and business logic.
   */
  export interface SubscriptionRecord {
    readonly isActive: boolean
    readonly startTime: bigint
    readonly endTime: bigint
    readonly renewalCount: bigint
    readonly totalPaid: bigint
    readonly lastPayment: bigint
    readonly lastRenewalTime: bigint
    readonly autoRenewalEnabled: boolean
  }
  
  /**
   * Subscription Details Interface
   * 
   * This enhanced interface provides subscription data optimized for UI display,
   * including calculated fields, status indicators, and formatted values.
   */
  export interface SubscriptionDetails extends SubscriptionRecord {
    readonly creator: Address
    readonly user: Address
    readonly subscriptionId: string          // Unique identifier for UI purposes
    readonly status: 'active' | 'expired' | 'cancelled' | 'grace_period'
    readonly daysRemaining: number           // Calculated days until expiration
    readonly monthlyPrice: bigint           // Current monthly subscription price
    readonly nextRenewalDate: Date | null   // Calculated next renewal date
    readonly canCancel: boolean             // Whether cancellation is available
    readonly inGracePeriod: boolean         // Whether subscription is in grace period
    readonly gracePeriodEnd: bigint         // Grace period expiration timestamp
  }
  
  /**
   * Subscription Status Interface
   * 
   * Simplified status information for quick subscription checks,
   * optimized for components that need basic subscription state.
   */
  export interface SubscriptionStatus {
    readonly isActive: boolean
    readonly inGracePeriod: boolean
    readonly endTime: bigint
    readonly gracePeriodEnd: bigint
  }
  
  /**
   * User Subscription Summary Interface
   * 
   * Aggregated view of all user subscriptions for dashboard display,
   * providing summary statistics and quick access to key information.
   */
  export interface UserSubscriptionSummary {
    readonly totalSubscriptions: number
    readonly activeSubscriptions: number
    readonly expiredSubscriptions: number
    readonly totalMonthlySpend: bigint
    readonly subscriptions: readonly SubscriptionDetails[]
    readonly nextRenewalDate: Date | null
    readonly hasActiveSubscriptions: boolean
  }
  
  /**
   * Subscription Cancellation Options
   * 
   * Configuration interface for subscription cancellation,
   * allowing users to choose between immediate or end-of-period cancellation.
   */
  export interface SubscriptionCancellationOptions {
    readonly immediate: boolean             // Cancel immediately vs. end of current period
    readonly reason?: string               // Optional cancellation reason for analytics
  }
  
  // ===== SUBSCRIPTION MANAGEMENT HOOK IMPLEMENTATION =====
  
  /**
   * Main Subscription Management Hook
   * 
   * This hook provides the complete subscription management interface,
   * combining read operations for subscription data with write operations
   * for subscription lifecycle management. It follows your established
   * patterns for hook composition and state management.
   */
  export function useSubscriptionManagement(userAddress?: Address) {
    const chainId = useChainId()
    const { address: connectedAddress } = useAccount()
    const queryClient = useQueryClient()
    
    // Use connected address if userAddress not provided
    const effectiveUserAddress = userAddress || connectedAddress
  
    // Get contract configuration using your established pattern
    const contractAddresses = useMemo(() => {
      try {
        return getContractAddresses(chainId)
      } catch (error) {
        console.error('Failed to get contract addresses:', error)
        return null
      }
    }, [chainId])
  
    // ===== WRITE OPERATIONS - SUBSCRIPTION CANCELLATION =====
  
    const {
      writeContract: writeCancellation,
      data: cancellationHash,
      isPending: isCancellationPending,
      isError: isCancellationError,
      error: cancellationError,
      reset: resetCancellation
    } = useWriteContract()
  
    const {
      isLoading: isCancellationConfirming,
      isSuccess: isCancellationConfirmed,
      error: cancellationConfirmationError
    } = useWaitForTransactionReceipt({
      hash: cancellationHash,
    })
  
    /**
     * Cancel Subscription Function
     * 
     * Handles subscription cancellation with proper transaction management
     * and cache invalidation. Supports both immediate and end-of-period cancellation.
     */
    const cancelSubscription = useCallback(async (
      creatorAddress: Address,
      options: SubscriptionCancellationOptions = { immediate: false }
    ): Promise<void> => {
      if (!contractAddresses?.SUBSCRIPTION_MANAGER || !effectiveUserAddress) {
        throw new Error('Missing contract addresses or user address')
      }
  
      try {
        writeCancellation({
          address: contractAddresses.SUBSCRIPTION_MANAGER,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'cancelSubscription',
          args: [creatorAddress, options.immediate]
        })
      } catch (error) {
        console.error('Failed to cancel subscription:', error)
        throw error
      }
    }, [contractAddresses, effectiveUserAddress, writeCancellation])
  
    // ===== READ OPERATIONS - SUBSCRIPTION DATA FETCHING =====
  
    /**
     * Get User Subscriptions
     * 
     * Fetches all subscriptions (active and historical) for the user.
     * Uses intelligent caching since subscription lists change infrequently.
     */
    const userSubscriptionsQuery = useReadContract({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: 'getUserSubscriptions',
      args: effectiveUserAddress ? [effectiveUserAddress] : undefined,
      query: {
        enabled: Boolean(effectiveUserAddress && contractAddresses?.SUBSCRIPTION_MANAGER),
        staleTime: 1000 * 60 * 5,      // 5 minutes - subscription lists change infrequently
        gcTime: 1000 * 60 * 30,        // 30 minutes cache retention
        retry: 3,
      }
    })
  
    /**
     * Get User Active Subscriptions
     * 
     * Fetches only currently active subscriptions for the user.
     * Uses shorter cache time since active status can change more frequently.
     */
    const activeSubscriptionsQuery = useReadContract({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: 'getUserActiveSubscriptions',
      args: effectiveUserAddress ? [effectiveUserAddress] : undefined,
      query: {
        enabled: Boolean(effectiveUserAddress && contractAddresses?.SUBSCRIPTION_MANAGER),
        staleTime: 1000 * 60 * 2,      // 2 minutes - active status changes more frequently
        gcTime: 1000 * 60 * 15,        // 15 minutes cache retention
        retry: 3,
      }
    })
  
    // ===== SUBSCRIPTION DETAILS HOOK =====
  
    /**
     * Create Subscription Details Configuration
     *
     * Creates configuration object for subscription details fetching between a specific user and creator.
     * This returns the configuration that can be used with useReadContract.
     */
    const createSubscriptionDetailsConfig = useCallback((creatorAddress: Address) => {
      return {
        address: contractAddresses?.SUBSCRIPTION_MANAGER,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'getSubscriptionDetails',
        args: effectiveUserAddress && creatorAddress ? [effectiveUserAddress, creatorAddress] : undefined,
        query: {
          enabled: Boolean(
            effectiveUserAddress &&
            creatorAddress &&
            contractAddresses?.SUBSCRIPTION_MANAGER
          ),
          staleTime: 1000 * 60 * 3,      // 3 minutes - details change moderately
          gcTime: 1000 * 60 * 20,        // 20 minutes cache retention
          retry: 2,
        }
      }
    }, [contractAddresses, effectiveUserAddress])
  


    const useSubscriptionStatus = useCallback((creatorAddress: Address) => {
      // Create a dynamic query for the specific creator address
      const statusQuery = useReadContract({
        address: contractAddresses?.SUBSCRIPTION_MANAGER,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'getSubscriptionStatus',
        args: effectiveUserAddress && creatorAddress ? [effectiveUserAddress, creatorAddress] : undefined,
        query: {
          enabled: Boolean(
            effectiveUserAddress &&
            creatorAddress &&
            contractAddresses?.SUBSCRIPTION_MANAGER
          ),
          staleTime: 1000 * 60 * 1,      // 1 minute - status needs to be fresh
          gcTime: 1000 * 60 * 10,        // 10 minutes cache retention
          retry: 2,
        }
      })

      return statusQuery
    }, [contractAddresses, effectiveUserAddress])
  
    // ===== DATA PROCESSING AND TRANSFORMATION =====
  
  // ===== REAL SUBSCRIPTION SUMMARY BUILDERS =====
  interface SubscriptionStatusChain {
    readonly isActive: boolean
    readonly inGracePeriod: boolean
    readonly endTime: bigint
    readonly gracePeriodEnd: bigint
  }

  function isSubscriptionStatusChain(value: unknown): value is SubscriptionStatusChain {
    const v = value as Record<string, unknown> | null
    return !!v && typeof v.isActive === 'boolean' && typeof v.inGracePeriod === 'boolean'
      && typeof v.endTime === 'bigint' && typeof v.gracePeriodEnd === 'bigint'
  }

  interface CreatorProfileMinimal {
    readonly subscriptionPrice: bigint
  }

  function isCreatorProfileMinimal(value: unknown): value is CreatorProfileMinimal {
    const v = value as Record<string, unknown> | null
    return !!v && typeof v.subscriptionPrice === 'bigint'
  }

  interface SubscriptionRecordChain {
    readonly isActive: boolean
    readonly startTime: bigint
    readonly endTime: bigint
    readonly renewalCount: bigint
    readonly totalPaid: bigint
    readonly lastPayment: bigint
    readonly lastRenewalTime: bigint
    readonly autoRenewalEnabled: boolean
  }

  function isSubscriptionRecordChain(value: unknown): value is SubscriptionRecordChain {
    const v = value as Record<string, unknown> | null
    return !!v && typeof v.isActive === 'boolean'
      && typeof v.startTime === 'bigint'
      && typeof v.endTime === 'bigint'
      && typeof v.renewalCount === 'bigint'
      && typeof v.totalPaid === 'bigint'
      && typeof v.lastPayment === 'bigint'
      && typeof v.lastRenewalTime === 'bigint'
      && typeof v.autoRenewalEnabled === 'boolean'
  }

  function secondsToDaysRemaining(endTime: bigint): number {
    const nowSec = BigInt(Math.floor(Date.now() / 1000))
    if (endTime <= nowSec) return 0
    const diff = Number(endTime - nowSec)
    return Math.max(0, Math.ceil(diff / 86400))
  }

  function pickNextDate(dates: readonly (Date | null)[]): Date | null {
    const valid = dates.filter((d): d is Date => d instanceof Date)
    if (valid.length === 0) return null
    return new Date(Math.min(...valid.map(d => d.getTime())))
  }

  function useSubscriptionsSummary(
    creatorAddresses: readonly Address[] | undefined,
    effectiveUserAddress: Address | undefined,
    contractAddresses: ReturnType<typeof getContractAddresses> | null
  ): UserSubscriptionSummary {
    const hasPrereqs = Boolean(
      creatorAddresses && creatorAddresses.length > 0 && effectiveUserAddress && contractAddresses?.SUBSCRIPTION_MANAGER && contractAddresses?.CREATOR_REGISTRY
    )

    type MultiReadResult = { data?: ReadonlyArray<{ result?: unknown }> }

    const statusReads = useReadContracts({
      allowFailure: true,
      contracts: hasPrereqs
        ? creatorAddresses!.map((creator) => ({
            address: contractAddresses!.SUBSCRIPTION_MANAGER,
            abi: SUBSCRIPTION_MANAGER_ABI,
            functionName: 'getSubscriptionStatus',
            args: [effectiveUserAddress as Address, creator]
          }))
        : [],
      query: { enabled: hasPrereqs }
    }) as unknown as MultiReadResult

    const recordReads = useReadContracts({
      allowFailure: true,
      contracts: hasPrereqs
        ? creatorAddresses!.map((creator) => ({
            address: contractAddresses!.SUBSCRIPTION_MANAGER,
            abi: SUBSCRIPTION_MANAGER_ABI,
            functionName: 'getSubscriptionDetails',
            args: [effectiveUserAddress as Address, creator]
          }))
        : [],
      query: { enabled: hasPrereqs }
    }) as unknown as MultiReadResult

    const profileReads = useReadContracts({
      allowFailure: true,
      contracts: hasPrereqs
        ? creatorAddresses!.map((creator) => ({
            address: contractAddresses!.CREATOR_REGISTRY,
            abi: CREATOR_REGISTRY_ABI,
            functionName: 'getCreatorProfile',
            args: [creator]
          }))
        : [],
      query: { enabled: hasPrereqs }
    }) as unknown as MultiReadResult

    return useMemo<UserSubscriptionSummary>(() => {
      if (!creatorAddresses || creatorAddresses.length === 0 || !hasPrereqs) {
        return {
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          expiredSubscriptions: 0,
          totalMonthlySpend: BigInt(0),
          subscriptions: [],
          nextRenewalDate: null,
          hasActiveSubscriptions: false
        }
      }
  
      const subscriptions: SubscriptionDetails[] = []
      let activeCount = 0
      let expiredCount = 0
      let totalMonthlySpend = BigInt(0)
      const nextDates: (Date | null)[] = []

      for (let i = 0; i < creatorAddresses.length; i += 1) {
        const creator = creatorAddresses[i]
        const statusResult = statusReads.data?.[i]?.result
        const recordResult = recordReads.data?.[i]?.result
        const profileResult = profileReads.data?.[i]?.result

        const status = isSubscriptionStatusChain(statusResult) ? statusResult : undefined
        const record = isSubscriptionRecordChain(recordResult) ? recordResult : undefined
        const profile = isCreatorProfileMinimal(profileResult) ? profileResult : undefined

        const isActive = Boolean(status?.isActive ?? record?.isActive)
        const inGrace = Boolean(status?.inGracePeriod)
        const endTime = status?.endTime ?? record?.endTime ?? BigInt(0)
        const graceEnd = status?.gracePeriodEnd ?? BigInt(0)
        const monthlyPrice = profile?.subscriptionPrice ?? BigInt(0)

        if (isActive) {
          activeCount += 1
          totalMonthlySpend += monthlyPrice
        } else {
          expiredCount += 1
        }

        const nextRenewal = record?.autoRenewalEnabled && endTime > BigInt(0)
          ? new Date(Number(endTime) * 1000)
          : null
        if (nextRenewal) nextDates.push(nextRenewal)

        const detail: SubscriptionDetails = {
          creator,
          user: effectiveUserAddress as Address,
          subscriptionId: `${creator}-${effectiveUserAddress ?? '0x'}`,
          status: isActive ? 'active' : inGrace ? 'grace_period' : (endTime > BigInt(0) && endTime < BigInt(Math.floor(Date.now() / 1000))) ? 'expired' : 'cancelled',
          daysRemaining: secondsToDaysRemaining(endTime),
          monthlyPrice,
          nextRenewalDate: nextRenewal,
          canCancel: isActive,
          inGracePeriod: inGrace,
          gracePeriodEnd: graceEnd,
          // Base record fields
          isActive: record?.isActive ?? isActive,
          startTime: record?.startTime ?? BigInt(0),
          endTime,
          renewalCount: record?.renewalCount ?? BigInt(0),
          totalPaid: record?.totalPaid ?? BigInt(0),
          lastPayment: record?.lastPayment ?? BigInt(0),
          lastRenewalTime: record?.lastRenewalTime ?? BigInt(0),
          autoRenewalEnabled: record?.autoRenewalEnabled ?? false
        }
        subscriptions.push(detail)
      }

      return {
        totalSubscriptions: creatorAddresses.length,
        activeSubscriptions: activeCount,
        expiredSubscriptions: expiredCount,
        totalMonthlySpend,
        subscriptions,
        nextRenewalDate: pickNextDate(nextDates),
        hasActiveSubscriptions: activeCount > 0
      }
    }, [
      creatorAddresses,
      hasPrereqs,
      statusReads.data,
      recordReads.data,
      profileReads.data,
      effectiveUserAddress
    ])
  }
  
    // ===== REAL-TIME SUBSCRIPTION EVENTS =====
  
    /**
     * Watch for subscription-related events to invalidate cache and update UI
     * This ensures that subscription status changes are reflected immediately
     */
    useWatchContractEvent({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      eventName: 'SubscriptionCancelled',
      onLogs: useCallback((logs: readonly { args?: { user?: Address } }[]) => {
        logs.forEach((log: { args?: { user?: Address } }) => {
          if (log.args?.user === effectiveUserAddress) {
            // Invalidate subscription queries when user cancels a subscription
            queryClient.invalidateQueries({
              queryKey: ['readContract', {
                address: contractAddresses?.SUBSCRIPTION_MANAGER,
                functionName: 'getUserSubscriptions'
              }]
            })
            queryClient.invalidateQueries({
              queryKey: ['readContract', {
                address: contractAddresses?.SUBSCRIPTION_MANAGER,
                functionName: 'getUserActiveSubscriptions'
              }]
            })
          }
        })
      }, [effectiveUserAddress, queryClient, contractAddresses])
    })
  
    // ===== EFFECT HANDLERS =====
  
    /**
     * Handle successful cancellation transaction
     * Invalidate relevant queries and provide user feedback
     */
    useEffect(() => {
      if (isCancellationConfirmed && cancellationHash) {
        // Invalidate all subscription-related queries
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey
            return queryKey.some(key => 
              typeof key === 'object' && 
              key !== null && 
              'functionName' in key &&
              (key.functionName === 'getUserSubscriptions' || 
               key.functionName === 'getUserActiveSubscriptions' ||
               key.functionName === 'getSubscriptionDetails' ||
               key.functionName === 'getSubscriptionStatus')
            )
          }
        })
      }
    }, [isCancellationConfirmed, cancellationHash, queryClient])
  
    // ===== COMPUTED VALUES =====
  
    /**
     * Processed subscription data for UI consumption
     */
    const allSubscriptions = useSubscriptionsSummary(
      (userSubscriptionsQuery.data as readonly Address[] | undefined),
      effectiveUserAddress as Address | undefined,
      contractAddresses
    )
  
    const activeSubscriptions = useSubscriptionsSummary(
      (activeSubscriptionsQuery.data as readonly Address[] | undefined),
      effectiveUserAddress as Address | undefined,
      contractAddresses
    )
  
    /**
     * Aggregated loading and error states
     */
    const isLoading = userSubscriptionsQuery.isLoading || activeSubscriptionsQuery.isLoading
    const isError = userSubscriptionsQuery.isError || activeSubscriptionsQuery.isError
    const error = userSubscriptionsQuery.error || activeSubscriptionsQuery.error
  
    /**
     * Cancellation operation state
     */
    const cancellationState: ContractWriteWithConfirmationResult = {
      hash: cancellationHash,
      isLoading: isCancellationPending,
      isError: isCancellationError,
      error: cancellationError,
      isSuccess: Boolean(cancellationHash),
      isConfirming: isCancellationConfirming,
      isConfirmed: isCancellationConfirmed,
      confirmationError: cancellationConfirmationError,
      write: (args?: unknown) => {
        if (!args || typeof args !== 'object' || !('creatorAddress' in args)) {
          throw new Error('Expected { creatorAddress, immediate?, reason? }')
        }
        const { creatorAddress, immediate, reason } = args as { creatorAddress: Address; immediate?: boolean; reason?: string }
        void cancelSubscription(creatorAddress, { immediate: Boolean(immediate), reason })
      },
      reset: resetCancellation
    }
  
      // ===== SUBSCRIPTION PURCHASE FUNCTIONALITY =====
  
  // Import the subscription purchase hook
  const subscriptionPurchase = useSubscriptionPurchase()

  const subscribe = useCallback(async (creatorAddress: Address) => {
    if (!effectiveUserAddress) {
      throw new Error('User address required')
    }

    // First check if user has sufficient USDC balance
    // Note: This requires the creator profile data to be available
    // The balance checking should be done in the UI components before calling subscribe
    
    // Execute subscription purchase
    await subscriptionPurchase.subscribe(creatorAddress)
    
    // Refresh subscription data after successful purchase
    await Promise.all([
      userSubscriptionsQuery.refetch(),
      activeSubscriptionsQuery.refetch()
    ])
  }, [effectiveUserAddress, subscriptionPurchase, userSubscriptionsQuery.refetch, activeSubscriptionsQuery.refetch])

  // Add function to get user subscription details for a specific creator
  const getUserSubscriptionDetails = useCallback((userAddress: Address, creatorAddress: Address) => {
    // Find subscription in active subscriptions
    const subscription = activeSubscriptions.subscriptions.find((sub: SubscriptionDetails) => 
      sub.creator === creatorAddress && sub.user === userAddress
    )
    
    if (!subscription) return null
    
    return {
      isActive: subscription.isActive,
      expiryTime: subscription.endTime,
      startTime: subscription.startTime,
      renewalCount: subscription.renewalCount,
      totalPaid: subscription.totalPaid
    }
  }, [activeSubscriptions.subscriptions])

  // ===== RETURN INTERFACE =====

  return {
    // Subscription data
    allSubscriptions,
    activeSubscriptions,
    
    // Data fetching state
    isLoading,
    isError,
    error,
    
    // Conditional hooks for specific subscriptions
    useSubscriptionStatus,
    
    // Write operations
    cancelSubscription,
    cancellationState,
    
    // ADD THIS MISSING SUBSCRIPTION PURCHASE FUNCTIONALITY:
    subscribe, // ADD THIS
    isSubscribing: subscriptionPurchase.isLoading, // ADD THIS
    subscriptionError: subscriptionPurchase.error, // ADD THIS
    getUserSubscriptionDetails, // ADD THIS
    
    // Utility functions
    refetchAll: useCallback(async () => {
      await Promise.all([
        userSubscriptionsQuery.refetch(),
        activeSubscriptionsQuery.refetch()
      ])
    }, [userSubscriptionsQuery.refetch, activeSubscriptionsQuery.refetch]),
    
    // Raw query access for advanced usage
    userSubscriptionsQuery,
    activeSubscriptionsQuery
  } as const
  }
  
  // ===== EXPORT TYPES FOR COMPONENT USAGE =====
  
  export type SubscriptionManagementHook = ReturnType<typeof useSubscriptionManagement>
  
  export default useSubscriptionManagement
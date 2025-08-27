/**
 * Creator Subscriber Management Hook - Phase 3 Component
 * File: src/hooks/contracts/subscription/useCreatorSubscriberManagement.ts
 * 
 * This hook provides comprehensive creator-side subscriber analytics and management,
 * implementing sophisticated business intelligence for creators to understand their
 * audience, track growth trends, and optimize their subscription strategy. It builds
 * upon the architectural patterns established in useSubscriptionManagement.ts while
 * focusing on the creator perspective of subscription relationships.
 * 
 * Educational Architecture Integration:
 * - Extends your ContractReadResult<T> interface patterns for consistency
 * - Uses your getContractAddresses() configuration system for type-safe contract access
 * - Follows your established caching strategies optimized for creator analytics data
 * - Integrates with TanStack Query for intelligent data management and performance
 * - Provides the same error handling and loading state patterns used throughout your platform
 * 
 * Key Business Functions Implemented:
 * - getCreatorSubscribers: Retrieves all subscribers with pagination and filtering
 * - getCreatorActiveSubscribers: Focuses on currently active subscriber relationships
 * - getSubscriberAnalytics: Computes growth metrics, retention rates, and engagement data
 * - getCreatorSubscriptionEarnings: Provides detailed revenue analytics from subscriptions
 * 
 * Smart Contract Integration:
 * - Uses SUBSCRIPTION_MANAGER contract functions for subscriber data
 * - Integrates with CREATOR_REGISTRY for enhanced creator profile information
 * - Handles real-time updates through subscription event monitoring
 * - Provides efficient batch queries for large subscriber datasets
 * 
 * Advanced Analytics Features:
 * - Subscriber growth trend analysis and forecasting
 * - Retention rate calculations and churn analysis
 * - Revenue per subscriber analytics and optimization insights
 * - Comparative analytics against platform benchmarks
 * - Subscriber lifecycle tracking and engagement metrics
 */

import { 
    useReadContract, 
    useReadContracts,
    useChainId,
    useAccount,
    useWatchContractEvent
  } from 'wagmi'
  import { useQueryClient } from '@tanstack/react-query'
  import { useCallback, useMemo } from 'react'
  import { type Address } from 'viem'
  
  // Import your established foundational layers
  import { getContractAddresses } from '@/lib/contracts/config'
  import { SUBSCRIPTION_MANAGER_ABI, CREATOR_REGISTRY_ABI } from '@/lib/contracts/abis'
  
// ===== CREATOR SUBSCRIBER MANAGEMENT TYPE DEFINITIONS =====
  
  /**
   * Subscriber Information Interface
   * 
   * This interface provides comprehensive information about individual subscribers,
   * combining basic subscription data with calculated analytics for creator insights.
   */
  export interface SubscriberInfo {
    readonly subscriberAddress: Address
    readonly subscriptionStartTime: bigint
    readonly subscriptionEndTime: bigint
    readonly isActive: boolean
    readonly subscriptionDuration: number      // Days subscribed
    readonly totalPayments: bigint            // Total amount paid by this subscriber
    readonly lastPaymentTime: bigint          // When subscriber last paid
    readonly renewalCount: bigint             // Number of times subscription renewed
    readonly subscriptionTier: 'basic' | 'premium' | 'custom'  // Subscription level
    readonly engagementScore: number          // Calculated engagement metric (0-100)
    readonly retentionRisk: 'low' | 'medium' | 'high'  // Churn prediction
  }
  
  /**
   * Subscriber Analytics Interface
   * 
   * This interface aggregates subscriber data into actionable business intelligence,
   * providing creators with insights to optimize their subscription strategy and
   * understand their audience dynamics.
   */
  export interface SubscriberAnalytics {
    // Core Metrics
    readonly totalSubscribers: number
    readonly activeSubscribers: number
    readonly inactiveSubscribers: number
    readonly newSubscribersThisMonth: number
    readonly churnedSubscribersThisMonth: number
    
    // Growth Analytics
    readonly monthOverMonthGrowth: number     // Percentage change
    readonly averageSubscriptionLength: number // Days
    readonly retentionRate: number            // Percentage of subscribers who renew
    readonly churnRate: number                // Percentage of subscribers who cancel
    
    // Revenue Analytics
    readonly monthlyRecurringRevenue: bigint  // Current MRR from subscriptions
    readonly averageRevenuePerUser: bigint    // ARPU calculation
    readonly totalSubscriptionRevenue: bigint // All-time subscription revenue
    readonly revenueGrowthRate: number        // Monthly revenue growth percentage
    
    // Engagement Analytics
    readonly averageEngagementScore: number   // Average subscriber engagement
    readonly highValueSubscribers: number     // Count of premium/long-term subscribers
    readonly atRiskSubscribers: number        // Count of subscribers likely to churn
    
    // Forecasting
    readonly projectedMrrNextMonth: bigint    // Revenue forecast
    readonly estimatedChurnNextMonth: number  // Projected subscriber loss
    readonly growthTrendDirection: 'up' | 'down' | 'stable'
  }
  
  /**
   * Subscriber List Parameters
   * 
   * This interface defines filtering and pagination options for subscriber lists,
   * enabling creators to segment and analyze their subscriber base effectively.
   */
  export interface SubscriberListParams {
    readonly page?: number                    // Page number for pagination (default: 1)
    readonly limit?: number                   // Items per page (default: 20)
    readonly status?: 'all' | 'active' | 'inactive' | 'expired'  // Filter by status
    readonly sortBy?: 'newest' | 'oldest' | 'highest_value' | 'most_engaged'
    readonly searchQuery?: string             // Search by subscriber address
    readonly retentionRisk?: 'low' | 'medium' | 'high'  // Filter by churn risk
  }
  
  /**
   * Paginated Subscriber List Interface
   * 
   * This interface provides paginated subscriber data with metadata needed
   * for building sophisticated subscriber management interfaces.
   */
  export interface PaginatedSubscriberList {
    readonly subscribers: readonly SubscriberInfo[]
    readonly totalCount: number
    readonly currentPage: number
    readonly totalPages: number
    readonly hasNextPage: boolean
    readonly hasPreviousPage: boolean
    readonly appliedFilters: SubscriberListParams
  }
  
  /**
   * Creator Subscription Earnings Interface
   * 
   * This interface provides detailed earnings breakdown specifically from subscriptions,
   * enabling creators to understand their subscription revenue performance.
   */
  export interface CreatorSubscriptionEarnings {
    readonly totalEarnings: bigint           // All-time subscription earnings
    readonly withdrawableEarnings: bigint    // Currently available for withdrawal
    readonly pendingEarnings: bigint         // Earnings pending settlement
    readonly thisMonthEarnings: bigint       // Current month earnings
    readonly lastMonthEarnings: bigint       // Previous month for comparison
    readonly averageMonthlyEarnings: bigint  // 12-month average
    readonly earningsGrowthRate: number      // Month-over-month growth percentage
    readonly projectedNextMonth: bigint      // Forecasted next month earnings
  }
  
  // ===== CREATOR SUBSCRIBER MANAGEMENT HOOK IMPLEMENTATION =====
  
  /**
   * Main Creator Subscriber Management Hook
   * 
   * This hook provides comprehensive subscriber analytics and management functionality
   * for creators, combining real-time data fetching with sophisticated analytics
   * calculations to provide actionable business intelligence.
   */
  export function useCreatorSubscriberManagement(creatorAddress?: Address) {
    const chainId = useChainId()
    const { address: connectedAddress } = useAccount()
    const queryClient = useQueryClient()
    
    // Use connected address if creatorAddress not provided (common pattern for creator dashboards)
    const effectiveCreatorAddress = creatorAddress || connectedAddress
  
    // Get contract configuration using your established pattern
    const contractAddresses = useMemo(() => {
      try {
        return getContractAddresses(chainId)
      } catch (error) {
        console.error('Failed to get contract addresses:', error)
        return null
      }
    }, [chainId])
  
    // ===== READ OPERATIONS - SUBSCRIBER DATA FETCHING =====
  
    /**
     * Get All Creator Subscribers
     * 
     * Fetches complete list of subscribers (active and historical) for the creator.
     * Uses intelligent caching since subscriber history changes infrequently.
     */
    const allSubscribersQuery = useReadContract({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: 'getCreatorSubscribers',
      args: effectiveCreatorAddress ? [effectiveCreatorAddress] : undefined,
      query: {
        enabled: Boolean(effectiveCreatorAddress && contractAddresses?.SUBSCRIPTION_MANAGER),
        staleTime: 1000 * 60 * 10,     // 10 minutes - subscriber history changes infrequently
        gcTime: 1000 * 60 * 60,        // 1 hour cache retention for historical data
        retry: 3,
      }
    })
  
    /**
     * Get Active Creator Subscribers
     * 
     * Fetches only currently active subscribers for the creator.
     * Uses shorter cache time since active status can change when subscriptions expire.
     */
    const activeSubscribersQuery = useReadContract({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: 'getCreatorActiveSubscribers',
      args: effectiveCreatorAddress ? [effectiveCreatorAddress] : undefined,
      query: {
        enabled: Boolean(effectiveCreatorAddress && contractAddresses?.SUBSCRIPTION_MANAGER),
        staleTime: 1000 * 60 * 3,      // 3 minutes - active status changes more frequently
        gcTime: 1000 * 60 * 20,        // 20 minutes cache retention
        retry: 3,
        refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes for active data
      }
    })
  
    /**
     * Get Creator Subscription Earnings
     * 
     * Fetches detailed earnings information from subscription revenue.
     * Balances data freshness with performance for financial data.
     */
    const subscriptionEarningsQuery = useReadContract({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      functionName: 'getCreatorSubscriptionEarnings',
      args: effectiveCreatorAddress ? [effectiveCreatorAddress] : undefined,
      query: {
        enabled: Boolean(effectiveCreatorAddress && contractAddresses?.SUBSCRIPTION_MANAGER),
        staleTime: 1000 * 60 * 2,      // 2 minutes - earnings data should be fresh
        gcTime: 1000 * 60 * 15,        // 15 minutes cache retention
        retry: 3,
        refetchInterval: 1000 * 60 * 3, // Auto-refresh every 3 minutes for earnings
      }
    })
  
    /**
     * Get Creator Profile for Context
     * 
     * Fetches creator profile information to provide context for subscriber analytics,
     * including subscription pricing and creator verification status.
     */
    const creatorProfileQuery = useReadContract({
      address: contractAddresses?.CREATOR_REGISTRY,
      abi: CREATOR_REGISTRY_ABI,
      functionName: 'getCreatorProfile',
      args: effectiveCreatorAddress ? [effectiveCreatorAddress] : undefined,
      query: {
        enabled: Boolean(effectiveCreatorAddress && contractAddresses?.CREATOR_REGISTRY),
        staleTime: 1000 * 60 * 15,     // 15 minutes - profile data changes infrequently
        gcTime: 1000 * 60 * 60,        // 1 hour cache retention
        retry: 2,
      }
    })
  
    // ===== DATA PROCESSING AND ANALYTICS CALCULATION =====
  
    /**
     * Process Raw Subscriber Data
     * 
     * Transforms raw contract data into enriched subscriber information with
     * calculated metrics, engagement scores, and retention analysis.
     */
    // Batch-fetch subscription details for all subscribers to build real data
    const detailsReads = useReadContracts({
      allowFailure: true,
      contracts: (allSubscribersQuery.data as readonly Address[] | undefined)?.map((subscriber) => ({
        address: contractAddresses?.SUBSCRIPTION_MANAGER!,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'getSubscriptionDetails',
        args: effectiveCreatorAddress && subscriber ? [subscriber, effectiveCreatorAddress] : undefined,
      })) ?? [],
      query: {
        enabled: Boolean(
          (allSubscribersQuery.data as readonly Address[] | undefined)?.length &&
          effectiveCreatorAddress &&
          contractAddresses?.SUBSCRIPTION_MANAGER
        )
      }
    }) as unknown as { data?: ReadonlyArray<{ result?: unknown }> }

    const processSubscriberData = useCallback((
      allSubscribers: readonly Address[] | undefined,
      activeSubscribers: readonly Address[] | undefined
    ): PaginatedSubscriberList => {
      if (!allSubscribers || allSubscribers.length === 0) {
        return {
          subscribers: [],
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          appliedFilters: {}
        }
      }

      const activeSet = new Set(activeSubscribers ?? [])
      const pricePerMonth: bigint = (creatorProfileQuery.data as any)?.subscriptionPrice ?? BigInt(0)
      const nowSec = BigInt(Math.floor(Date.now() / 1000))

      const enrichedSubscribers: SubscriberInfo[] = allSubscribers.map((subscriber, idx) => {
        const record = detailsReads.data?.[idx]?.result as any | undefined
        const isActive = activeSet.has(subscriber)

        const startTime: bigint = record?.startTime ?? BigInt(0)
        const endTime: bigint = record?.endTime ?? BigInt(0)
        const renewalCount: bigint = record?.renewalCount ?? BigInt(0)
        const totalPaid: bigint = record?.totalPaid ?? BigInt(0)
        const lastPayment: bigint = record?.lastPayment ?? BigInt(0)
        const autoRenewalEnabled: boolean = Boolean(record?.autoRenewalEnabled)

        const durationSec = (isActive ? nowSec : endTime) > startTime ? (isActive ? nowSec : endTime) - startTime : BigInt(0)
        const subscriptionDurationDays = Math.floor(Number(durationSec) / 86400)

        // Engagement score: base on renewal count and payment recency
        const daysSincePayment = lastPayment > BigInt(0) ? Math.max(0, Math.floor((Number(nowSec - lastPayment)) / 86400)) : 90
        let engagementScore = 40 + Math.min(50, Number(renewalCount) * 10) - Math.min(20, Math.floor(daysSincePayment / 7))
        engagementScore = Math.max(0, Math.min(100, engagementScore))

        // Retention risk: based on time to expiry and auto-renewal
        const daysToExpiry = endTime > nowSec ? Math.floor(Number(endTime - nowSec) / 86400) : 0
        const retentionRisk: 'low' | 'medium' | 'high' = !isActive
          ? 'high'
          : !autoRenewalEnabled && daysToExpiry <= 7
          ? 'high'
          : daysToExpiry <= 14
          ? 'medium'
          : 'low'

        const tier: 'basic' | 'premium' | 'custom' = pricePerMonth >= BigInt(20 * 10 ** 6)
          ? 'premium'
          : 'basic'

        return {
          subscriberAddress: subscriber,
          subscriptionStartTime: startTime,
          subscriptionEndTime: endTime,
          isActive,
          subscriptionDuration: subscriptionDurationDays,
          totalPayments: totalPaid,
          lastPaymentTime: lastPayment,
          renewalCount,
          subscriptionTier: tier,
          engagementScore,
          retentionRisk
        }
      })

      return {
        subscribers: enrichedSubscribers,
        totalCount: enrichedSubscribers.length,
        currentPage: 1,
        totalPages: Math.ceil(enrichedSubscribers.length / 20),
        hasNextPage: enrichedSubscribers.length > 20,
        hasPreviousPage: false,
        appliedFilters: {}
      }
    }, [detailsReads.data, creatorProfileQuery.data])
  
    /**
     * Calculate Subscriber Analytics
     * 
     * Computes comprehensive business intelligence metrics from subscriber data,
     * providing actionable insights for creator strategy optimization.
     */
    const calculateSubscriberAnalytics = useCallback((
      allSubscribers: readonly Address[] | undefined,
      activeSubscribers: readonly Address[] | undefined,
      earningsData: readonly [bigint, bigint] | undefined
    ): SubscriberAnalytics => {
      const details = detailsReads.data
      if (!allSubscribers || !activeSubscribers || !details) {
        return {
          totalSubscribers: 0,
          activeSubscribers: 0,
          inactiveSubscribers: 0,
          newSubscribersThisMonth: 0,
          churnedSubscribersThisMonth: 0,
          monthOverMonthGrowth: 0,
          averageSubscriptionLength: 0,
          retentionRate: 0,
          churnRate: 0,
          monthlyRecurringRevenue: BigInt(0),
          averageRevenuePerUser: BigInt(0),
          totalSubscriptionRevenue: BigInt(0),
          revenueGrowthRate: 0,
          averageEngagementScore: 0,
          highValueSubscribers: 0,
          atRiskSubscribers: 0,
          projectedMrrNextMonth: BigInt(0),
          estimatedChurnNextMonth: 0,
          growthTrendDirection: 'stable'
        }
      }

      const nowSec = BigInt(Math.floor(Date.now() / 1000))
      const totalSubscribers = allSubscribers.length
      const activeSet = new Set(activeSubscribers)
      const pricePerMonth: bigint = (creatorProfileQuery.data as any)?.subscriptionPrice ?? BigInt(0)

      let totalPaidSum = BigInt(0)
      let totalLengthDays = 0
      let newThisMonth = 0
      let churnedThisMonth = 0
      let renewalsLast30 = 0
      let renewalsPrev30 = 0
      let engagementAccum = 0
      let highValue = 0
      let atRisk = 0

      const millis30 = BigInt(30 * 24 * 60 * 60)
      const last30Start = nowSec - millis30
      const prev30Start = nowSec - (millis30 * BigInt(2))

      for (let i = 0; i < allSubscribers.length; i += 1) {
        const record = details[i]?.result as any | undefined
        if (!record) continue

        const isActive = activeSet.has(allSubscribers[i])
        const startTime: bigint = record.startTime
        const endTime: bigint = record.endTime
        const renewalCount: bigint = record.renewalCount
        const totalPaid: bigint = record.totalPaid
        const lastPayment: bigint = record.lastPayment
        const autoRenewalEnabled: boolean = Boolean(record.autoRenewalEnabled)

        totalPaidSum += totalPaid
        const lengthSec = (isActive ? nowSec : endTime) > startTime ? (isActive ? nowSec : endTime) - startTime : BigInt(0)
        totalLengthDays += Math.floor(Number(lengthSec) / 86400)
        if (startTime >= last30Start) newThisMonth += 1
        if (!isActive && endTime >= last30Start) churnedThisMonth += 1
        if (lastPayment >= last30Start) renewalsLast30 += 1
        else if (lastPayment >= prev30Start && lastPayment < last30Start) renewalsPrev30 += 1

        const daysSincePayment = lastPayment > 0 ? Math.max(0, Math.floor(Number(nowSec - lastPayment) / 86400)) : 90
        let engagementScore = 40 + Math.min(50, Number(renewalCount) * 10) - Math.min(20, Math.floor(daysSincePayment / 7))
        engagementScore = Math.max(0, Math.min(100, engagementScore))
        engagementAccum += engagementScore

        if (totalPaid >= pricePerMonth * BigInt(3)) highValue += 1
        const daysToExpiry = endTime > nowSec ? Math.floor(Number(endTime - nowSec) / 86400) : 0
        if (isActive && !autoRenewalEnabled && daysToExpiry <= 7) atRisk += 1
      }

      const activeCount = activeSubscribers.length
      const inactiveCount = totalSubscribers - activeCount
      const retentionRate = totalSubscribers > 0 ? (activeCount / totalSubscribers) * 100 : 0
      const churnRate = 100 - retentionRate
      const monthlyRecurringRevenue = BigInt(activeCount) * pricePerMonth
      const averageRevenuePerUser = totalSubscribers > 0 ? totalPaidSum / BigInt(totalSubscribers) : BigInt(0)
      const totalSubscriptionRevenue = totalPaidSum
      const averageSubscriptionLength = totalSubscribers > 0 ? Math.round(totalLengthDays / totalSubscribers) : 0

      const revenueGrowthRate = renewalsPrev30 > 0 ? ((renewalsLast30 - renewalsPrev30) / Math.max(1, renewalsPrev30)) * 100 : (renewalsLast30 > 0 ? 100 : 0)
      const projectedMrrNextMonth = monthlyRecurringRevenue + BigInt(Math.floor(Number(monthlyRecurringRevenue) * (revenueGrowthRate / 100)))
      const estimatedChurnNextMonth = atRisk
      const averageEngagementScore = totalSubscribers > 0 ? Math.round(engagementAccum / totalSubscribers) : 0
      const growthTrend: 'up' | 'down' | 'stable' = activeCount > inactiveCount ? 'up' : activeCount < inactiveCount ? 'down' : 'stable'

      return {
        totalSubscribers,
        activeSubscribers: activeCount,
        inactiveSubscribers: inactiveCount,
        newSubscribersThisMonth: newThisMonth,
        churnedSubscribersThisMonth: churnedThisMonth,
        monthOverMonthGrowth: revenueGrowthRate,
        averageSubscriptionLength,
        retentionRate,
        churnRate,
        monthlyRecurringRevenue,
        averageRevenuePerUser,
        totalSubscriptionRevenue,
        revenueGrowthRate,
        averageEngagementScore,
        highValueSubscribers: highValue,
        atRiskSubscribers: atRisk,
        projectedMrrNextMonth,
        estimatedChurnNextMonth,
        growthTrendDirection: growthTrend
      }
    }, [detailsReads.data, creatorProfileQuery.data])
  
    /**
     * Process Earnings Data
     * 
     * Transforms raw earnings data into comprehensive financial analytics
     * with growth trends and forecasting insights.
     */
    const processEarningsData = useCallback((
      rawEarnings: readonly [bigint, bigint] | undefined
    ): CreatorSubscriptionEarnings => {
      const details = detailsReads.data
      if (!rawEarnings || !details) {
        return {
          totalEarnings: BigInt(0),
          withdrawableEarnings: BigInt(0),
          pendingEarnings: BigInt(0),
          thisMonthEarnings: BigInt(0),
          lastMonthEarnings: BigInt(0),
          averageMonthlyEarnings: BigInt(0),
          earningsGrowthRate: 0,
          projectedNextMonth: BigInt(0)
        }
      }

      const [totalEarnings, withdrawableEarnings] = rawEarnings
      const pendingEarnings = totalEarnings - withdrawableEarnings

      const nowSec = BigInt(Math.floor(Date.now() / 1000))
      const millis30 = BigInt(30 * 24 * 60 * 60)
      const last30Start = nowSec - millis30
      const prev30Start = nowSec - (millis30 * BigInt(2))
      const pricePerMonth: bigint = (creatorProfileQuery.data as any)?.subscriptionPrice ?? BigInt(0)

      let earningsThisMonth = BigInt(0)
      let earningsLastMonth = BigInt(0)

      for (const entry of details) {
        const record = entry?.result as any | undefined
        if (!record) continue
        const lastPayment: bigint = record.lastPayment
        if (lastPayment >= last30Start) {
          earningsThisMonth += pricePerMonth
        } else if (lastPayment >= prev30Start && lastPayment < last30Start) {
          earningsLastMonth += pricePerMonth
        }
      }

      const averageMonthlyEarnings = totalEarnings / BigInt(12)
      const earningsGrowthRate = Number(earningsLastMonth) > 0
        ? ((Number(earningsThisMonth) - Number(earningsLastMonth)) / Number(earningsLastMonth)) * 100
        : (Number(earningsThisMonth) > 0 ? 100 : 0)
      const projectedNextMonth = earningsThisMonth + BigInt(Math.floor(Number(earningsThisMonth) * (earningsGrowthRate / 100)))

      return {
        totalEarnings,
        withdrawableEarnings,
        pendingEarnings,
        thisMonthEarnings: earningsThisMonth,
        lastMonthEarnings: earningsLastMonth,
        averageMonthlyEarnings,
        earningsGrowthRate,
        projectedNextMonth
      }
    }, [detailsReads.data, creatorProfileQuery.data])
  
    // ===== REAL-TIME EVENT MONITORING =====
  
    /**
     * Watch for subscription events to invalidate cache and update analytics
     * This ensures that subscriber analytics reflect real-time changes
     */
    useWatchContractEvent({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      eventName: 'Subscribed',
      onLogs: useCallback((logs: readonly { args?: { creator?: Address } }[]) => {
        logs.forEach((log: { args?: { creator?: Address } }) => {
          if (log.args?.creator === effectiveCreatorAddress) {
            // New subscriber - invalidate all subscriber queries
            queryClient.invalidateQueries({
              queryKey: ['readContract', {
                address: contractAddresses?.SUBSCRIPTION_MANAGER,
                functionName: 'getCreatorSubscribers'
              }]
            })
            queryClient.invalidateQueries({
              queryKey: ['readContract', {
                address: contractAddresses?.SUBSCRIPTION_MANAGER,
                functionName: 'getCreatorActiveSubscribers'
              }]
            })
          }
        })
      }, [effectiveCreatorAddress, queryClient, contractAddresses])
    })
  
    useWatchContractEvent({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      eventName: 'SubscriptionCancelled',
      onLogs: useCallback((logs: readonly { args?: { creator?: Address } }[]) => {
        logs.forEach((log: { args?: { creator?: Address } }) => {
          if (log.args?.creator === effectiveCreatorAddress) {
            // Subscriber cancelled - invalidate relevant queries
            queryClient.invalidateQueries({
              queryKey: ['readContract', {
                address: contractAddresses?.SUBSCRIPTION_MANAGER,
                functionName: 'getCreatorActiveSubscribers'
              }]
            })
          }
        })
      }, [effectiveCreatorAddress, queryClient, contractAddresses])
    })
  
    // ===== COMPUTED VALUES =====
  
    /**
     * Processed subscriber data for UI consumption
     */
    const subscriberList = useMemo(() => 
      processSubscriberData(
        allSubscribersQuery.data as readonly Address[], 
        activeSubscribersQuery.data as readonly Address[]
      ),
      [allSubscribersQuery.data, activeSubscribersQuery.data, processSubscriberData]
    )
  
    const subscriberAnalytics = useMemo(() => 
      calculateSubscriberAnalytics(
        allSubscribersQuery.data as readonly Address[],
        activeSubscribersQuery.data as readonly Address[],
        subscriptionEarningsQuery.data as readonly [bigint, bigint]
      ),
      [allSubscribersQuery.data, activeSubscribersQuery.data, subscriptionEarningsQuery.data, calculateSubscriberAnalytics]
    )
  
    const earningsAnalytics = useMemo(() => 
      processEarningsData(subscriptionEarningsQuery.data as readonly [bigint, bigint]),
      [subscriptionEarningsQuery.data, processEarningsData]
    )
  
    /**
     * Aggregated loading and error states
     */
    const isLoading = allSubscribersQuery.isLoading || activeSubscribersQuery.isLoading || subscriptionEarningsQuery.isLoading
    const isError = allSubscribersQuery.isError || activeSubscribersQuery.isError || subscriptionEarningsQuery.isError
    const error = allSubscribersQuery.error || activeSubscribersQuery.error || subscriptionEarningsQuery.error
  
    // ===== ADVANCED QUERY FUNCTIONS =====
  
    /**
     * Get Filtered Subscribers
     * 
     * Provides filtered and paginated subscriber data based on search criteria
     */
    const getFilteredSubscribers = useCallback((params: SubscriberListParams): PaginatedSubscriberList => {
      let filteredSubscribers = [...subscriberList.subscribers]
  
      // Apply status filter
      if (params.status && params.status !== 'all') {
        filteredSubscribers = filteredSubscribers.filter(subscriber => {
          switch (params.status) {
            case 'active': return subscriber.isActive
            case 'inactive': return !subscriber.isActive
            case 'expired': return !subscriber.isActive && subscriber.subscriptionEndTime < BigInt(Date.now())
            default: return true
          }
        })
      }
  
      // Apply retention risk filter
      if (params.retentionRisk) {
        filteredSubscribers = filteredSubscribers.filter(subscriber => 
          subscriber.retentionRisk === params.retentionRisk
        )
      }
  
      // Apply search query filter
      if (params.searchQuery) {
        const query = params.searchQuery.toLowerCase()
        filteredSubscribers = filteredSubscribers.filter(subscriber =>
          subscriber.subscriberAddress.toLowerCase().includes(query)
        )
      }
  
      // Apply sorting
      if (params.sortBy) {
        filteredSubscribers.sort((a, b) => {
          switch (params.sortBy) {
            case 'newest': return Number(b.subscriptionStartTime - a.subscriptionStartTime)
            case 'oldest': return Number(a.subscriptionStartTime - b.subscriptionStartTime)
            case 'highest_value': return Number(b.totalPayments - a.totalPayments)
            case 'most_engaged': return b.engagementScore - a.engagementScore
            default: return 0
          }
        })
      }
  
      // Apply pagination
      const page = params.page || 1
      const limit = params.limit || 20
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedSubscribers = filteredSubscribers.slice(startIndex, endIndex)
  
      const totalCount = filteredSubscribers.length
      const totalPages = Math.ceil(totalCount / limit)
  
      return {
        subscribers: paginatedSubscribers,
        totalCount,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        appliedFilters: params
      }
    }, [subscriberList.subscribers])
  
    // ===== RETURN INTERFACE =====
  
    return {
      // Subscriber data
      subscriberList,
      subscriberAnalytics,
      earningsAnalytics,
      
      // Data fetching state
      isLoading,
      isError,
      error,
      
      // Advanced query functions
      getFilteredSubscribers,
      
      // Utility functions
      refetchAll: useCallback(async () => {
        await Promise.all([
          allSubscribersQuery.refetch(),
          activeSubscribersQuery.refetch(),
          subscriptionEarningsQuery.refetch(),
          creatorProfileQuery.refetch()
        ])
      }, [
        allSubscribersQuery.refetch, 
        activeSubscribersQuery.refetch, 
        subscriptionEarningsQuery.refetch,
        creatorProfileQuery.refetch
      ]),
      
      // Raw query access for advanced usage
      allSubscribersQuery,
      activeSubscribersQuery,
      subscriptionEarningsQuery,
      creatorProfileQuery
    } as const
  }
  
  // ===== EXPORT TYPES FOR COMPONENT USAGE =====
  
  export type CreatorSubscriberManagementHook = ReturnType<typeof useCreatorSubscriberManagement>
  
  export default useCreatorSubscriberManagement
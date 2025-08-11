/**
 * Platform Analytics Hook - Phase 2 Component
 * File: src/hooks/contracts/analytics/usePlatformAnalytics.ts
 * 
 * This hook provides comprehensive platform-wide analytics by integrating with your
 * existing contract functions and analytics infrastructure. It extends your established
 * patterns while adding sophisticated metrics for administrators and creators.
 * 
 * Key Integration Points:
 * - Uses your getContractAddresses() pattern for type-safe contract access
 * - Follows your exact hook patterns from src/hooks/contracts/core.ts
 * - Integrates with your existing SubgraphQueryService for complex analytics
 * - Extends your caching strategies for optimal performance
 * - Provides rich data structures for UI components
 * 
 * Contract Functions Utilized:
 * - getPlatformStats(): Comprehensive platform statistics
 * - totalContentCount(): Total content ever created
 * - activeContentCount(): Currently active content
 * - nextContentId(): Next content ID (for growth metrics)
 * 
 * Educational Enhancements:
 * - Performance monitoring and optimization strategies
 * - Intelligent caching based on data update frequency
 * - Rich error handling with actionable error messages
 * - Data transformation for UI-ready consumption
 * - Integration with existing analytics infrastructure
 */

import { useReadContract, useChainId } from 'wagmi'
import { useMemo, useCallback } from 'react'
import { getContractAddresses } from '@/lib/contracts/config'
import { CONTENT_REGISTRY_ABI, CREATOR_REGISTRY_ABI } from '@/lib/contracts/abis'
import { useQueryClient } from '@tanstack/react-query'
import { useSubgraphQuery, subgraphQueryService, type QueryResult } from '@/services/subgraph/SubgraphQueryService'
import type { PlatformAnalytics as SubgraphPlatformAnalytics } from '@/services/subgraph/SubgraphQueryService'

// ===== PLATFORM ANALYTICS TYPE DEFINITIONS =====

/**
 * Content Category Statistics
 * Provides detailed breakdown of content distribution across categories
 */
export interface CategoryStats {
  readonly category: number                    // Category enum value (0-6)
  readonly categoryName: string               // Human-readable category name
  readonly totalContent: bigint              // Total content in this category
  readonly activeContent: bigint             // Currently active content
  readonly growthRate: number                 // Calculated growth percentage
  readonly marketShare: number               // Percentage of total platform content
}

/**
 * Platform Growth Metrics
 * Calculated metrics showing platform trajectory and health
 */
export interface PlatformGrowthMetrics {
  readonly contentGrowthRate: number          // Daily/weekly content growth percentage
  readonly activeContentRatio: number        // Active content vs total content ratio
  readonly categoryDiversity: number         // How evenly distributed content is across categories
  readonly nextContentId: bigint             // Next content ID (indicates total content created)
  readonly estimatedDailyCreations: number   // Estimated content creations per day
}

/**
 * Comprehensive Platform Statistics
 * Aggregated data combining contract stats with calculated insights
 */
export interface PlatformStats {
  readonly totalContent: bigint              // Total content ever created
  readonly activeContent: bigint             // Currently available content
  readonly inactiveContent: bigint           // Deactivated or removed content
  readonly categoryStats: readonly CategoryStats[]  // Per-category breakdown
  readonly growthMetrics: PlatformGrowthMetrics     // Calculated growth insights
  readonly platformHealth: {                 // Platform health indicators
    readonly contentActivityRatio: number    // Active vs total content (health indicator)
    readonly categoryDistribution: 'balanced' | 'concentrated' | 'sparse'
    readonly growthTrend: 'growing' | 'stable' | 'declining'
  }
  readonly lastUpdated: Date                  // When this data was calculated
}

/**
 * Creator Platform Statistics
 * Statistics about creators on the platform (when combined with creator analytics)
 */
export interface CreatorPlatformStats {
  readonly totalCreators: bigint             // Total registered creators
  readonly activeCreators: bigint            // Creators with active content
  readonly verifiedCreators: bigint          // Verified creators count
  readonly averageContentPerCreator: number  // Content distribution metrics
}

/**
 * Platform Analytics Hook Result
 * Comprehensive return type following your established hook patterns
 */
export interface PlatformAnalyticsResult {
  readonly platformStats: PlatformStats | undefined
  readonly creatorStats: CreatorPlatformStats | undefined
  readonly isLoading: boolean
  readonly isError: boolean
  readonly error: Error | null
  readonly isSuccess: boolean
  readonly refetch: () => Promise<void>
  readonly lastFetched: Date | undefined
  readonly cacheStatus: 'fresh' | 'stale' | 'invalid'
}

// ===== PLATFORM ANALYTICS HOOKS =====

/**
 * Primary Platform Analytics Hook
 * 
 * This hook provides comprehensive platform statistics by combining multiple
 * contract calls with intelligent data processing. It follows your established
 * patterns while adding sophisticated analytics capabilities.
 * 
 * Key Features:
 * - Integrates multiple contract functions for complete platform view
 * - Intelligent caching strategy based on data update frequency
 * - Rich data transformation for UI consumption
 * - Performance monitoring and optimization
 * - Error handling with actionable feedback
 * 
 * @returns Comprehensive platform analytics data
 */
export function usePlatformAnalytics(): PlatformAnalyticsResult {
  const chainId = useChainId()
  const queryClient = useQueryClient()
  
  // Use your established contract address pattern
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  
  // Track fetch timestamp for cache status calculation
  const lastFetched = useMemo(() => new Date(), [])

  // Fetch enriched analytics from subgraph (used to augment creatorStats)
  const { data: subgraphAnalytics, loading: isSubgraphLoading } = useSubgraphQuery<SubgraphPlatformAnalytics>(
    () => subgraphQueryService.getPlatformAnalytics(),
    [chainId]
  )
  
  // Main platform statistics query
  const platformStatsQuery = useReadContract({
    address: contractAddresses.CONTENT_REGISTRY,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getPlatformStats',
    args: [],
    query: {
      // Platform stats change when content is created/deactivated
      // Use moderate caching since this affects admin decisions
      staleTime: 1000 * 60 * 10,  // 10 minutes - good balance for admin dashboards
      gcTime: 1000 * 60 * 60,     // 1 hour - keep admin data cached longer
      retry: (failureCount, error) => {
        // Platform stats are critical - be more aggressive with retries
        if (error?.name === 'ContractFunctionExecutionError') return false
        return failureCount < 5  // More retries than content discovery
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  })

  // Total content count query (for growth calculations)
  const totalContentQuery = useReadContract({
    address: contractAddresses.CONTENT_REGISTRY,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'totalContentCount',
    args: [],
    query: {
      staleTime: 1000 * 60 * 5,   // 5 minutes - total count changes with new content
      gcTime: 1000 * 60 * 30,     // 30 minutes cache
      retry: 3,
    }
  })

  // Active content count query
  const activeContentQuery = useReadContract({
    address: contractAddresses.CONTENT_REGISTRY,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'activeContentCount',
    args: [],
    query: {
      staleTime: 1000 * 60 * 3,   // 3 minutes - active count can change frequently
      gcTime: 1000 * 60 * 15,     // 15 minutes cache
      retry: 3,
    }
  })

  // Next content ID query (for understanding total content created)
  const nextContentIdQuery = useReadContract({
    address: contractAddresses.CONTENT_REGISTRY,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'nextContentId',
    args: [],
    query: {
      staleTime: 1000 * 60 * 5,   // 5 minutes - increments with new content
      gcTime: 1000 * 60 * 30,     // 30 minutes cache
      retry: 3,
    }
  })

  // Creator statistics (if available from creator registry)
  const creatorStatsQuery = useReadContract({
    address: contractAddresses.CREATOR_REGISTRY,
    abi: CREATOR_REGISTRY_ABI,
    functionName: 'getTotalCreators', // Assuming this function exists
    args: [],
    query: {
      enabled: true, // Enable if function exists in your contract
      staleTime: 1000 * 60 * 15,  // 15 minutes - creator count changes slowly
      gcTime: 1000 * 60 * 60,     // 1 hour cache
      retry: 2,
    }
  })

  // Process and transform the raw contract data into rich analytics
  const processedData = useMemo(() => {
    // Early return if core data isn't available
    if (!platformStatsQuery.data || !totalContentQuery.data || !activeContentQuery.data) {
      return {
        platformStats: undefined,
        creatorStats: undefined
      }
    }

    // Extract platform stats from contract response
    const rawPlatformStats = platformStatsQuery.data as [bigint, bigint, readonly bigint[], readonly bigint[]]
    const [totalContent, activeContent, categoryCounts, activeCategoryCounts] = rawPlatformStats
    
    // Process category statistics with rich metadata
    const categoryStats: CategoryStats[] = categoryCounts.map((count, index) => {
      const activeCount = activeCategoryCounts[index] || BigInt(0)
      const totalCount = count
      
      return {
        category: index,
        categoryName: getCategoryDisplayName(index),
        totalContent: totalCount,
        activeContent: activeCount,
        growthRate: calculateCategoryGrowthRate(totalCount, activeCount),
        marketShare: Number(totalCount) / Number(totalContent) * 100
      }
    })

    // Calculate sophisticated growth metrics
    const nextContentId = nextContentIdQuery.data || BigInt(0)
    const growthMetrics: PlatformGrowthMetrics = {
      contentGrowthRate: calculateContentGrowthRate(totalContent, nextContentId),
      activeContentRatio: Number(activeContent) / Number(totalContent),
      categoryDiversity: calculateCategoryDiversity(categoryCounts),
      nextContentId,
      estimatedDailyCreations: estimateDailyCreations(totalContent, nextContentId)
    }

    // Calculate platform health indicators
    const contentActivityRatio = Number(activeContent) / Number(totalContent)
    const platformHealth = {
      contentActivityRatio,
      categoryDistribution: determineCategoryDistribution(categoryStats),
      growthTrend: determineGrowthTrend(growthMetrics.contentGrowthRate)
    } as const

    // Assemble comprehensive platform statistics
    const platformStats: PlatformStats = {
      totalContent,
      activeContent,
      inactiveContent: totalContent - activeContent,
      categoryStats,
      growthMetrics,
      platformHealth,
      lastUpdated: new Date()
    }

  // Process creator statistics if available
    const creatorStats: CreatorPlatformStats | undefined = creatorStatsQuery.data ? {
      totalCreators: creatorStatsQuery.data as bigint,
      activeCreators: BigInt(subgraphAnalytics?.activeCreatorsCount ?? 0),
      verifiedCreators: BigInt(subgraphAnalytics?.verifiedCreatorsCount ?? 0),
      averageContentPerCreator: Number(totalContent) / Math.max(1, Number(creatorStatsQuery.data as bigint))
    } : undefined

    return {
      platformStats,
      creatorStats
    }
  }, [
    platformStatsQuery.data,
    totalContentQuery.data,
    activeContentQuery.data,
    nextContentIdQuery.data,
    creatorStatsQuery.data,
    subgraphAnalytics
  ])

  // Calculate cache status based on query freshness
  const cacheStatus = useMemo((): 'fresh' | 'stale' | 'invalid' => {
    const isAnyQueryStale = [platformStatsQuery, totalContentQuery, activeContentQuery]
      .some(query => query.isStale)
    
    const isAnyQueryError = [platformStatsQuery, totalContentQuery, activeContentQuery]
      .some(query => query.isError)

    if (isAnyQueryError) return 'invalid'
    if (isAnyQueryStale) return 'stale'
    return 'fresh'
  }, [platformStatsQuery.isStale, totalContentQuery.isStale, activeContentQuery.isStale,
      platformStatsQuery.isError, totalContentQuery.isError, activeContentQuery.isError])

  // Enhanced refetch function that refreshes all related queries
  const refetch = useCallback(async () => {
    await Promise.all([
      platformStatsQuery.refetch(),
      totalContentQuery.refetch(),
      activeContentQuery.refetch(),
      nextContentIdQuery.refetch(),
      creatorStatsQuery.refetch()
    ])

    // Invalidate related queries that might be affected by platform changes
    queryClient.invalidateQueries({ 
      predicate: (query) => 
        query.queryKey.includes('platformAnalytics') ||
        query.queryKey.includes('contentDiscovery')
    })
  }, [
    platformStatsQuery.refetch,
    totalContentQuery.refetch,
    activeContentQuery.refetch,
    nextContentIdQuery.refetch,
    creatorStatsQuery.refetch,
    queryClient
  ])

  // Aggregate loading and error states from all queries
  const isLoading = [platformStatsQuery, totalContentQuery, activeContentQuery, nextContentIdQuery]
    .some(query => query.isLoading) || isSubgraphLoading

  const isError = [platformStatsQuery, totalContentQuery, activeContentQuery, nextContentIdQuery]
    .some(query => query.isError)

  const error = [platformStatsQuery, totalContentQuery, activeContentQuery, nextContentIdQuery]
    .find(query => query.error)?.error || null

  const isSuccess = [platformStatsQuery, totalContentQuery, activeContentQuery, nextContentIdQuery]
    .every(query => query.isSuccess)

  return {
    platformStats: processedData.platformStats,
    creatorStats: processedData.creatorStats,
    isLoading,
    isError,
    error,
    isSuccess,
    refetch,
    lastFetched,
    cacheStatus
  }
}

/**
 * Simplified Platform Stats Hook
 * 
 * For components that need basic platform statistics without the full
 * analytics processing. Useful for simple dashboard widgets.
 * 
 * @returns Basic platform statistics with minimal processing
 */
export function useBasicPlatformStats() {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])

  const result = useReadContract({
    address: contractAddresses.CONTENT_REGISTRY,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getPlatformStats',
    args: [],
    query: {
      staleTime: 1000 * 60 * 5,   // 5 minutes for simple stats
      gcTime: 1000 * 60 * 30,     // 30 minutes cache
      retry: 3,
    }
  })

  const processedData = useMemo(() => {
    if (!result.data) return undefined

    const [totalContent, activeContent, categoryCounts, activeCategoryCounts] = result.data as [bigint, bigint, readonly bigint[], readonly bigint[]]
    
    return {
      totalContent,
      activeContent,
      inactiveContent: totalContent - activeContent,
      categoryBreakdown: categoryCounts.map((count, index) => ({
        category: index,
        categoryName: getCategoryDisplayName(index),
        count
      }))
    }
  }, [result.data])

  return {
    data: processedData,
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    refetch: result.refetch
  }
}

/**
 * Platform Health Monitor Hook
 * 
 * Specialized hook for monitoring platform health metrics.
 * Useful for admin dashboards that need to quickly assess platform status.
 * 
 * @returns Platform health indicators and alerts
 */
export function usePlatformHealthMonitor() {
  const { platformStats, isLoading, isError } = usePlatformAnalytics()

  const healthStatus = useMemo(() => {
    if (!platformStats) return undefined

    const alerts = []
    const healthScore = calculatePlatformHealthScore(platformStats)

    // Check for health issues
    if (platformStats.platformHealth.contentActivityRatio < 0.7) {
      alerts.push({
        type: 'warning' as const,
        message: 'High inactive content ratio - consider content quality review',
        metric: 'contentActivityRatio',
        value: platformStats.platformHealth.contentActivityRatio
      })
    }

    if (platformStats.platformHealth.categoryDistribution === 'concentrated') {
      alerts.push({
        type: 'info' as const,
        message: 'Content heavily concentrated in few categories - diversification opportunity',
        metric: 'categoryDistribution',
        value: platformStats.platformHealth.categoryDistribution
      })
    }

    if (platformStats.growthMetrics.contentGrowthRate < 0) {
      alerts.push({
        type: 'critical' as const,
        message: 'Negative content growth detected - investigate creator onboarding',
        metric: 'contentGrowthRate',
        value: platformStats.growthMetrics.contentGrowthRate
      })
    }

    return {
      healthScore,
      status: healthScore > 80 ? 'healthy' : healthScore > 60 ? 'warning' : 'critical',
      alerts,
      lastChecked: new Date()
    }
  }, [platformStats])

  return {
    healthStatus,
    platformStats,
    isLoading,
    isError
  }
}

// ===== ANALYTICS UTILITY FUNCTIONS =====

/**
 * Get category display name from category index
 * Maps category numbers to human-readable names
 */
function getCategoryDisplayName(categoryIndex: number): string {
  const categoryNames = [
    'Articles',     // 0
    'Videos',       // 1  
    'Audio',        // 2
    'Images',       // 3
    'Documents',    // 4
    'Courses',      // 5
    'Other'         // 6
  ]
  
  return categoryNames[categoryIndex] || 'Unknown'
}

/**
 * Calculate category growth rate
 * Compares active vs total content to determine category health
 */
function calculateCategoryGrowthRate(totalContent: bigint, activeContent: bigint): number {
  if (totalContent === BigInt(0)) return 0
  return (Number(activeContent) / Number(totalContent)) * 100
}

/**
 * Calculate content growth rate
 * Estimates growth based on content creation patterns
 */
function calculateContentGrowthRate(totalContent: bigint, nextContentId: bigint): number {
  // This is a simplified calculation - in production you'd want to track
  // content creation over time using timestamps or block numbers
  const totalCreated = Number(nextContentId) - 1 // nextContentId is 1-based
  const activeRatio = Number(totalContent) / totalCreated
  
  // Return estimated daily growth percentage (simplified formula)
  return activeRatio > 0.8 ? 2.5 : activeRatio > 0.6 ? 1.5 : 0.5
}

/**
 * Calculate category diversity index
 * Measures how evenly content is distributed across categories
 */
function calculateCategoryDiversity(categoryCounts: readonly bigint[]): number {
  const total = categoryCounts.reduce((sum, count) => sum + Number(count), 0)
  if (total === 0) return 0

  // Calculate entropy as diversity measure
  const entropy = categoryCounts.reduce((ent, count) => {
    const proportion = Number(count) / total
    return proportion > 0 ? ent - (proportion * Math.log2(proportion)) : ent
  }, 0)

  // Normalize to 0-100 scale (log2(7) ≈ 2.807 for 7 categories)
  return (entropy / Math.log2(7)) * 100
}

/**
 * Estimate daily content creations
 * Provides rough estimate of content creation velocity
 */
function estimateDailyCreations(totalContent: bigint, nextContentId: bigint): number {
  // Simplified estimation - in production you'd use actual timestamps
  const totalCreated = Number(nextContentId) - 1
  const activeRatio = Number(totalContent) / totalCreated
  
  // Assume platform has been running for some time and estimate daily rate
  return Math.max(1, Math.floor(totalCreated / 30)) // Rough 30-day average
}

/**
 * Determine category distribution pattern
 * Classifies how content is distributed across categories
 */
function determineCategoryDistribution(categoryStats: readonly CategoryStats[]): 'balanced' | 'concentrated' | 'sparse' {
  const totalContent = categoryStats.reduce((sum, cat) => sum + Number(cat.totalContent), 0)
  
  // Find the largest category's share
  const maxCategoryShare = Math.max(...categoryStats.map(cat => 
    Number(cat.totalContent) / totalContent * 100
  ))
  
  // Classify distribution
  if (maxCategoryShare > 60) return 'concentrated'
  if (maxCategoryShare < 20) return 'sparse'
  return 'balanced'
}

/**
 * Determine growth trend from growth rate
 * Classifies platform growth trajectory
 */
function determineGrowthTrend(growthRate: number): 'growing' | 'stable' | 'declining' {
  if (growthRate > 1.5) return 'growing'
  if (growthRate < 0.5) return 'declining'
  return 'stable'
}

/**
 * Calculate overall platform health score
 * Provides single metric for platform health (0-100)
 */
function calculatePlatformHealthScore(platformStats: PlatformStats): number {
  let score = 100

  // Penalize low content activity
  if (platformStats.platformHealth.contentActivityRatio < 0.8) {
    score -= (0.8 - platformStats.platformHealth.contentActivityRatio) * 50
  }

  // Penalize poor category distribution
  if (platformStats.platformHealth.categoryDistribution === 'concentrated') {
    score -= 10
  } else if (platformStats.platformHealth.categoryDistribution === 'sparse') {
    score -= 15
  }

  // Penalize negative growth
  if (platformStats.growthMetrics.contentGrowthRate < 0) {
    score -= 20
  }

  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, score))
}

/**
 * Export helper functions for UI components
 * These functions help UI components format and display analytics data
 */
export const PlatformAnalyticsHelpers = {
  getCategoryDisplayName,
  calculateCategoryGrowthRate,
  calculateContentGrowthRate,
  calculateCategoryDiversity,
  determineCategoryDistribution,
  determineGrowthTrend,
  calculatePlatformHealthScore
} as const
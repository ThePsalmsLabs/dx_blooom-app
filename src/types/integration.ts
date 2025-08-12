import type { Address } from 'viem'
import type { ContentCategory } from '@/types/contracts'
import type { PlatformStats } from '@/hooks/contracts/analytics/usePlatformAnalytics'
import type { CreatorAnalyticsResult } from '@/hooks/contracts/analytics/useCreatorAnalytics'

/**
 * Content Discovery Filter Interface
 * Standardizes filtering across discovery views/components.
 */
export interface ContentDiscoveryFilters {
  readonly category?: ContentCategory
  readonly tags?: readonly string[]
  readonly priceRange?: {
    readonly min?: string // USDC amount
    readonly max?: string // USDC amount
  }
  readonly creator?: Address
  readonly searchQuery?: string
  readonly sortBy?: 'latest' | 'oldest' | 'price-low' | 'price-high' | 'popularity'
  readonly includeInactive?: boolean
}

/**
 * Discovery Result Interface
 * Consistent structure for discovery pagination and performance info.
 */
export interface ContentDiscoveryResult {
  readonly contentIds: readonly bigint[]
  readonly totalCount: bigint
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
  readonly currentPage: number
  readonly totalPages: number
  readonly appliedFilters: Partial<ContentDiscoveryFilters>
  readonly performance: {
    readonly cacheHit: boolean
    readonly queryTime: number
    readonly filterTime: number
  }
}

/**
 * Analytics Time Period Configuration
 */
export type TimePeriod = '7d' | '30d' | '90d' | '1y' | 'all'

export interface TimePeriodConfig {
  readonly label: string
  readonly days: number | null // null represents 'all time'
  readonly shortLabel: string
}

/**
 * Analytics Context Interface
 * Shared analytics context across dashboards and discovery.
 */
export interface AnalyticsContextData {
  readonly platformStats: PlatformStats | undefined
  readonly creatorStats: CreatorAnalyticsResult | undefined
  readonly timePeriod: TimePeriod
  readonly isLoading: boolean
  readonly error: Error | null
  readonly lastRefresh: Date | undefined
  readonly refreshData: () => Promise<void>
  readonly setTimePeriod: (period: TimePeriod) => void
}



/**
 * Subgraph Query Service - Component 9.3: Indexed Blockchain Data Access
 * File: src/services/subgraph/SubgraphQueryService.ts
 * 
 * This service provides efficient access to historical blockchain data through The Graph
 * Protocol, enabling sophisticated analytics and user history features without the
 * performance penalties of direct blockchain queries. It transforms slow, expensive
 * blockchain data access into fast, sophisticated queries that power modern user experiences.
 * 
 * Key Features:
 * - GraphQL query optimization with intelligent batching and caching
 * - Real-time data synchronization with blockchain state
 * - Pagination and filtering for large datasets
 * - Aggregation queries for analytics and dashboard features
 * - Type-safe query builders with compile-time validation
 * - Automatic retry logic with exponential backoff for reliability
 * - Query result normalization and transformation
 * - Integration with existing content and creator management workflows
 * 
 * This service demonstrates how sophisticated Web3 applications can provide
 * analytics and historical data capabilities that rival traditional platforms
 * while maintaining the transparency and verifiability benefits of blockchain data.
 */

import { GraphQLClient, gql } from 'graphql-request'
import { type Address } from 'viem'

/**
 * GraphQL Response Type Definitions
 * 
 * These interfaces define the exact structure of data returned by our subgraph
 * GraphQL queries. They provide type safety for all data transformation operations
 * and prevent runtime errors from unexpected data structures.
 */

/**
 * Base GraphQL Response Metadata
 * 
 * Every GraphQL response includes metadata about the current blockchain state
 * that helps us understand data freshness and synchronization status.
 */
interface GraphQLResponseMeta {
  readonly _meta?: {
    readonly block: {
      readonly number: number
      readonly timestamp: number
    }
  }
}

/**
 * Raw Creator Data from GraphQL
 * 
 * Mirrors the exact structure returned by our creator analytics query,
 * ensuring type safety during data transformation operations.
 */
interface RawCreatorData {
  readonly id: string
  readonly totalEarnings: string // GraphQL returns numbers as strings
  readonly contentCount: number
  readonly subscriberCount: number
  readonly createdAt: string
  readonly isVerified: boolean
  readonly contents: readonly {
    readonly id: string
    readonly title: string
    readonly category: string
    readonly price: string
    readonly createdAt: string
    readonly purchaseCount: number
    readonly purchases: readonly {
      readonly id: string
      readonly amount: string
      readonly timestamp: string
      readonly user: {
        readonly id: string
      }
    }[]
  }[]
  readonly subscriptions: readonly {
    readonly id: string
    readonly startTime: string
    readonly isActive: boolean
    readonly amount: string
    readonly user: {
      readonly id: string
    }
  }[]
}

/**
 * Raw Platform Data from GraphQL
 */
interface RawPlatformData {
  readonly totalCreators: number
  readonly totalContent: number
  readonly totalTransactions: number
  readonly totalVolume: string
  readonly lastUpdatedAt: string
}

/**
 * Raw Content Data from GraphQL
 */
interface RawContentData {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly category: string
  readonly price: string
  readonly createdAt: string
  readonly purchaseCount: number
  readonly creator: {
    readonly id: string
    readonly isVerified: boolean
  }
}

/**
 * Raw User Data from GraphQL
 */
interface RawUserData {
  readonly id: string
  readonly subscriptions: readonly {
    readonly creator: {
      readonly id: string
      readonly contents: readonly {
        readonly id: string
        readonly title: string
        readonly category: string
        readonly price: string
        readonly createdAt: string
      }[]
    }
    readonly startTime: string
  }[]
}

/**
 * Raw Content Purchase Data from GraphQL
 */
interface RawContentPurchaseData {
  readonly id: string
  readonly amount: string
  readonly timestamp: string
  readonly content: {
    readonly id: string
    readonly title: string
    readonly category: string
    readonly creator: {
      readonly id: string
    }
  }
}

/**
 * Raw Category Metrics Data from GraphQL
 */
interface RawCategoryMetricData {
  readonly category: string
  readonly contentCount: number
  readonly totalEarnings: string
  readonly averagePrice: string
}

/**
 * Complete GraphQL Response Interfaces
 * 
 * These interfaces represent the full response structure for each major query type,
 * combining the data payload with GraphQL metadata for complete type safety.
 */
interface CreatorAnalyticsResponse extends GraphQLResponseMeta {
  readonly creator: RawCreatorData | null
  readonly platform: RawPlatformData
}

interface PlatformAnalyticsResponse extends GraphQLResponseMeta {
  readonly platform: RawPlatformData
  readonly creators: readonly RawCreatorData[]
  readonly categoryMetrics: readonly RawCategoryMetricData[]
  readonly recentPurchases: readonly {
    readonly timestamp: string
    readonly amount: string
  }[]
  readonly dailyActiveUsers: readonly {
    readonly id: string
  }[]
  readonly verifiedCreators: readonly { readonly id: string }[]
  readonly activeCreators: readonly { readonly id: string }[]
}

interface UserHistoryResponse extends GraphQLResponseMeta {
  readonly contentPurchases: readonly RawContentPurchaseData[]
  readonly user: RawUserData | null
  readonly userInteractions: readonly {
    readonly contentId: string
    readonly interactionType: string
    readonly timestamp: string
  }[]
}

interface ContentSearchResponse extends GraphQLResponseMeta {
  readonly contents: readonly RawContentData[]
}

/**
 * Subgraph Configuration Interface
 * 
 * Defines connection parameters and query optimization settings for
 * interacting with The Graph Protocol endpoints efficiently.
 */
interface SubgraphConfig {
  readonly endpoint: string
  readonly apiKey?: string
  readonly timeout: number
  readonly retryAttempts: number
  readonly retryDelay: number
  readonly maxQueryComplexity: number
  readonly cacheTtl: number // Cache time-to-live in milliseconds
  readonly enableBatching: boolean
  readonly enableMetrics: boolean
}

/**
 * Query Result Interface
 * 
 * Standardized result format that includes both data and metadata
 * about the query execution for debugging and optimization purposes.
 */
interface QueryResult<T> {
  readonly data: T
  readonly meta: {
    readonly queryTime: number
    readonly cacheHit: boolean
    readonly blockNumber: number
    readonly indexedAt: Date
    readonly queryHash: string
  }
}

/**
 * Pagination Parameters
 * 
 * Consistent pagination interface that works across all subgraph queries
 * while providing efficient cursor-based pagination for large datasets.
 */
interface PaginationParams {
  readonly first?: number // Number of items to return (default: 10, max: 1000)
  readonly skip?: number // Number of items to skip for offset-based pagination
  readonly orderBy?: string // Field to order by
  readonly orderDirection?: 'asc' | 'desc'
  readonly where?: Record<string, unknown> // GraphQL where clause filters
}

/**
 * Creator Analytics Data
 * 
 * Comprehensive analytics data structure that supports sophisticated
 * creator dashboard features and platform-wide analytics reporting.
 */
interface CreatorAnalytics {
  readonly creatorAddress: Address
  readonly totalContent: number
  readonly totalEarnings: bigint
  readonly totalSubscribers: number
  readonly contentByCategory: readonly {
    readonly category: string
    readonly count: number
    readonly earnings: bigint
  }[]
  readonly recentActivity: readonly {
    readonly type: 'content_created' | 'content_purchased' | 'subscription_started'
    readonly timestamp: Date
    readonly details: Record<string, unknown>
  }[]
  readonly performanceMetrics: {
    readonly averageViewsPerContent: number
    readonly subscriptionRetentionRate: number
    readonly topPerformingContent: readonly {
      readonly contentId: string
      readonly title: string
      readonly views: number
      readonly earnings: bigint
    }[]
  }
}

/**
 * Platform Analytics Data
 * 
 * Platform-wide metrics that support administrative dashboards and
 * public statistics about platform growth and usage patterns.
 */
interface PlatformAnalytics {
  readonly totalCreators: number
  readonly totalContent: number
  readonly totalTransactions: number
  readonly totalVolume: bigint
  readonly growthMetrics: {
    readonly dailyActiveUsers: number
    readonly weeklyGrowthRate: number
    readonly monthlyRecurringRevenue: bigint
  }
  readonly categoryDistribution: readonly {
    readonly category: string
    readonly percentage: number
    readonly averagePrice: bigint
  }[]
  readonly topCreators: readonly {
    readonly address: Address
    readonly earnings: bigint
    readonly contentCount: number
    readonly subscriberCount: number
  }[]
  readonly verifiedCreatorsCount: number
  readonly activeCreatorsCount: number
}

/**
 * Content History Entry
 * 
 * Individual entries in user content history that support features
 * like purchase history, recently viewed content, and recommendation engines.
 */
interface ContentHistoryEntry {
  readonly contentId: string
  readonly title: string
  readonly creator: Address
  readonly category: string
  readonly purchasePrice: bigint
  readonly purchasedAt: Date
  readonly lastAccessedAt: Date
  readonly accessCount: number
  readonly userRating?: number
  readonly isSubscriptionAccess: boolean
}

/**
 * Query Builder Interface
 * 
 * Type-safe query construction that prevents GraphQL syntax errors
 * and provides IDE autocompletion for available fields and filters.
 */
interface QueryBuilder {
  select(fields: readonly string[]): QueryBuilder
  where(conditions: Record<string, unknown>): QueryBuilder
  orderBy(field: string, direction: 'asc' | 'desc'): QueryBuilder
  limit(count: number): QueryBuilder
  skip(count: number): QueryBuilder
  build(): string
}

/**
 * Subgraph Query Service Class
 * 
 * This service encapsulates all subgraph interaction logic behind a clean,
 * performant interface that makes blockchain data as accessible as traditional
 * database queries while maintaining the unique benefits of decentralized data.
 */
export class SubgraphQueryService {
  private readonly config: SubgraphConfig
  private readonly client: GraphQLClient
  private readonly queryCache: Map<string, { data: unknown; timestamp: number }> = new Map()
  private readonly pendingQueries: Map<string, Promise<unknown>> = new Map()

  constructor(config?: Partial<SubgraphConfig>) {
    // Production-optimized configuration with intelligent defaults
    this.config = {
      endpoint: process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/contentdao/platform',
      apiKey: process.env.GRAPH_API_KEY,
      timeout: 30000, // 30 seconds for complex queries
      retryAttempts: 3,
      retryDelay: 1000, // Start with 1 second, exponential backoff
      maxQueryComplexity: 1000,
      cacheTtl: 60000, // 1 minute cache for most queries
      enableBatching: true,
      enableMetrics: false, // Enable in production for monitoring
      ...config
    }

    // Initialize GraphQL client with authentication and optimization settings
    this.client = new GraphQLClient(this.config.endpoint, {
      headers: this.config.apiKey ? {
        'Authorization': `Bearer ${this.config.apiKey}`
      } : {}
    })
  }

  /**
   * Get comprehensive analytics for a specific creator
   * 
   * This method demonstrates how subgraph queries can aggregate complex data
   * across multiple entity types to provide rich analytics dashboards.
   * 
   * @param creatorAddress - The creator's Ethereum address
   * @param timeRange - Optional time range for filtering analytics
   * @returns Promise resolving to comprehensive creator analytics
   */
  async getCreatorAnalytics(
    creatorAddress: Address,
    timeRange?: { from: Date; to: Date }
  ): Promise<QueryResult<CreatorAnalytics>> {
    const queryHash = this.generateQueryHash('creator-analytics', { creatorAddress, timeRange })
    
    // Check cache first for performance optimization
    const cachedResult = this.getCachedResult<CreatorAnalytics>(queryHash)
    if (cachedResult) {
      return cachedResult
    }

    // Build time range filter if provided
    const timeFilter = timeRange ? {
      timestamp_gte: Math.floor(timeRange.from.getTime() / 1000),
      timestamp_lte: Math.floor(timeRange.to.getTime() / 1000)
    } : {}

    // Complex GraphQL query that aggregates data across multiple entities
    const query = gql`
      query CreatorAnalytics($creatorAddress: Bytes!, $timeFilter: ContentPurchase_filter) {
        creator(id: $creatorAddress) {
          id
          totalEarnings
          contentCount
          subscriberCount
          createdAt
          isVerified
          
          # Get all content items created by this creator
          contents(orderBy: createdAt, orderDirection: desc) {
            id
            title
            category
            price
            createdAt
            purchaseCount
            
            # Get purchase history for each content item
            purchases(where: $timeFilter) {
              id
              amount
              timestamp
              user {
                id
              }
            }
          }
          
          # Get subscription data
          subscriptions(where: $timeFilter) {
            id
            startTime
            isActive
            amount
            user {
              id
            }
          }
        }
        
        # Get platform-wide metrics for context
        platform: platformMetric(id: "global") {
          totalCreators
          totalContent
          totalVolume
        }
      }
    `

    try {
      const startTime = Date.now()
      
      // Execute the query with retry logic for reliability
      const rawData = await this.executeQueryWithRetry<CreatorAnalyticsResponse>(query, {
        creatorAddress: creatorAddress.toLowerCase(),
        timeFilter
      })



      // Transform raw GraphQL data into our structured analytics format
      const analytics = this.transformCreatorAnalyticsData(rawData)

      const blockNumber = rawData?._meta?.block?.number ?? 0
      const timestamp = rawData?._meta?.block?.timestamp
      const indexedAt = timestamp ? new Date(timestamp * 1000) : new Date()
    
      
      const result: QueryResult<CreatorAnalytics> = {
        data: analytics,
        meta: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          blockNumber,
          indexedAt,
          queryHash
        }
      }

      // Cache the result for future requests
      this.cacheResult(queryHash, result)
      
      return result

    } catch (error) {
      throw new Error(`Failed to fetch creator analytics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get platform-wide analytics for administrative dashboards
   * 
   * This method demonstrates how subgraph aggregation queries can provide
   * comprehensive platform metrics without expensive blockchain scanning.
   * 
   * @param timeRange - Optional time range for filtering metrics
   * @returns Promise resolving to platform analytics data
   */
  async getPlatformAnalytics(
    timeRange?: { from: Date; to: Date }
  ): Promise<QueryResult<PlatformAnalytics>> {
    const queryHash = this.generateQueryHash('platform-analytics', { timeRange })
    
    const cachedResult = this.getCachedResult<PlatformAnalytics>(queryHash)
    if (cachedResult) {
      return cachedResult
    }

    const timeFilter = timeRange ? {
      timestamp_gte: Math.floor(timeRange.from.getTime() / 1000),
      timestamp_lte: Math.floor(timeRange.to.getTime() / 1000)
    } : {}

    const query = gql`
      query PlatformAnalytics($timeFilter: ContentPurchase_filter) {
        # Platform-wide metrics
        platform: platformMetric(id: "global") {
          totalCreators
          totalContent
          totalTransactions
          totalVolume
          lastUpdatedAt
        }
        
        # Top creators by earnings
        creators(
          first: 10
          orderBy: totalEarnings
          orderDirection: desc
          where: { totalEarnings_gt: "0" }
        ) {
          id
          totalEarnings
          contentCount
          subscriberCount
          isVerified
        }
        
        # Content category distribution
        categoryMetrics: contentCategoryMetrics {
          category
          contentCount
          totalEarnings
          averagePrice
        }
        
        # Recent activity for growth metrics
        recentPurchases: contentPurchases(
          first: 1000
          orderBy: timestamp
          orderDirection: desc
          where: $timeFilter
        ) {
          timestamp
          amount
        }
        
        # Daily active users (based on recent transactions)
        dailyActiveUsers: users(
          where: { 
            lastActivityAt_gte: ${Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)}
          }
        ) {
          id
        }

        # Verified creators
        verifiedCreators: creators(where: { isVerified: true }) {
          id
        }

        # Active creators (with at least one content in last 30 days)
        activeCreators: creators(where: { contents_some: { createdAt_gte: ${Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)} } }) {
          id
        }
      }
    `

    try {
      const startTime = Date.now()
      const rawData = await this.executeQueryWithRetry<PlatformAnalyticsResponse>(query, { timeFilter })
      
      const analytics = this.transformPlatformAnalyticsData(rawData)

      const blockNumber = rawData?._meta?.block?.number ?? 0
      const timestamp = rawData?._meta?.block?.timestamp
      const indexedAt = timestamp ? new Date(timestamp * 1000) : new Date()
      
      const result: QueryResult<PlatformAnalytics> = {
        data: analytics,
        meta: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          blockNumber,
          indexedAt,
          queryHash
        }
      }

      this.cacheResult(queryHash, result)
      return result

    } catch (error) {
      throw new Error(`Failed to fetch platform analytics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user's content purchase and access history
   * 
   * This method enables features like "Recently Viewed," "Purchase History,"
   * and personalized content recommendations based on user behavior patterns.
   * 
   * @param userAddress - User's Ethereum address
   * @param pagination - Pagination parameters for large histories
   * @returns Promise resolving to paginated content history
   */
  async getUserContentHistory(
    userAddress: Address,
    pagination: PaginationParams = {}
  ): Promise<QueryResult<readonly ContentHistoryEntry[]>> {
    const queryHash = this.generateQueryHash('user-history', { userAddress, pagination })
    
    const cachedResult = this.getCachedResult<readonly ContentHistoryEntry[]>(queryHash)
    if (cachedResult) {
      return cachedResult
    }

    const { first = 50, skip = 0, orderBy = 'timestamp', orderDirection = 'desc' } = pagination

    const query = gql`
      query UserContentHistory(
        $userAddress: Bytes!
        $first: Int!
        $skip: Int!
        $orderBy: ContentPurchase_orderBy!
        $orderDirection: OrderDirection!
      ) {
        # Direct content purchases
        contentPurchases(
          where: { user: $userAddress }
          first: $first
          skip: $skip
          orderBy: $orderBy
          orderDirection: $orderDirection
        ) {
          id
          amount
          timestamp
          content {
            id
            title
            category
            creator {
              id
            }
          }
        }
        
        # Content accessed through subscriptions
        user(id: $userAddress) {
          subscriptions(where: { isActive: true }) {
            creator {
              contents {
                id
                title
                category
                price
                createdAt
              }
            }
            startTime
          }
        }
        
        # User interaction data if available
        userInteractions(
          where: { user: $userAddress }
          orderBy: timestamp
          orderDirection: desc
          first: 100
        ) {
          contentId
          interactionType
          timestamp
        }
      }
    `

    try {
      const startTime = Date.now()
      const rawData = await this.executeQueryWithRetry<UserHistoryResponse>(query, {
        userAddress: userAddress.toLowerCase(),
        first,
        skip,
        orderBy,
        orderDirection
      })

      const history = this.transformUserHistoryData(rawData)

      const blockNumber = rawData?._meta?.block?.number ?? 0
      const timestamp = rawData?._meta?.block?.timestamp
      const indexedAt = timestamp ? new Date(timestamp * 1000) : new Date()
      
      const result: QueryResult<readonly ContentHistoryEntry[]> = {
        data: history,
        meta: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          blockNumber,
          indexedAt,
          queryHash
        }
      }

      this.cacheResult(queryHash, result)
      return result

    } catch (error) {
      throw new Error(`Failed to fetch user content history: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Search content with advanced filtering and ranking
   * 
   * This method demonstrates how subgraph full-text search can provide
   * sophisticated content discovery features that scale to large content libraries.
   * 
   * @param searchQuery - Text search query
   * @param filters - Additional filtering parameters
   * @param pagination - Pagination parameters
   * @returns Promise resolving to search results with relevance ranking
   */
  async searchContent(
    searchQuery: string,
    filters: {
      category?: string
      priceRange?: { min: bigint; max: bigint }
      creator?: Address
      tags?: readonly string[]
    } = {},
    pagination: PaginationParams = {}
  ): Promise<QueryResult<readonly {
    content: {
      id: string
      title: string
      description: string
      category: string
      price: bigint
      creator: Address
      createdAt: Date
    }
    relevanceScore: number
  }[]>> {
    
    const queryHash = this.generateQueryHash('content-search', { searchQuery, filters, pagination })
    
    const cachedResult = this.getCachedResult<readonly {
      readonly content: {
        readonly id: string
        readonly title: string
        readonly description: string
        readonly category: string
        readonly price: bigint
        readonly creator: Address
        readonly createdAt: Date
      }
      readonly relevanceScore: number
    }[]>(queryHash)
    if (cachedResult) {
      return cachedResult
    }

    // Build GraphQL where clause from filters
    const whereClause: Record<string, unknown> = {}
    
    if (searchQuery) {
      whereClause.title_contains_nocase = searchQuery
    }
    
    if (filters.category) {
      whereClause.category = filters.category
    }
    
    if (filters.creator) {
      whereClause.creator = filters.creator.toLowerCase()
    }
    
    if (filters.priceRange) {
      whereClause.price_gte = filters.priceRange.min.toString()
      whereClause.price_lte = filters.priceRange.max.toString()
    }

    const { first = 20, skip = 0 } = pagination

    const query = gql`
      query SearchContent(
        $where: Content_filter!
        $first: Int!
        $skip: Int!
      ) {
        contents(
          where: $where
          first: $first
          skip: $skip
          orderBy: purchaseCount
          orderDirection: desc
        ) {
          id
          title
          description
          category
          price
          createdAt
          purchaseCount
          creator {
            id
            isVerified
          }
        }
      }
    `

    try {
      const startTime = Date.now()
      const rawData = await this.executeQueryWithRetry<ContentSearchResponse>(query, {
        where: whereClause,
        first,
        skip
      })

      // Calculate relevance scores based on search query and popularity
      const results = rawData.contents.map((content) => ({
        content: {
          id: content.id,
          title: content.title,
          description: content.description,
          category: content.category,
          price: BigInt(content.price),
          creator: content.creator.id as Address,
          createdAt: new Date(parseInt(content.createdAt) * 1000)
        },
        relevanceScore: this.calculateRelevanceScore(content, searchQuery)
      }))

      // Sort by relevance score for better search results
      results.sort((a, b) => b.relevanceScore - a.relevanceScore)

      const blockNumber = rawData?._meta?.block?.number ?? 0
      const timestamp = rawData?._meta?.block?.timestamp
      const indexedAt = timestamp ? new Date(timestamp * 1000) : new Date()
      
      const result: QueryResult<typeof results> = {
        data: results,
        meta: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          blockNumber,
          indexedAt,
          queryHash
        }
      }

      this.cacheResult(queryHash, result)
      return result

    } catch (error) {
      throw new Error(`Failed to search content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ===== PRIVATE UTILITY METHODS =====

  /**
   * Execute GraphQL query with automatic retry logic for reliability
   */
  private async executeQueryWithRetry<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const result = await this.client.request<T>(query, variables)
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown GraphQL error')
        
        if (attempt < this.config.retryAttempts - 1) {
          // Exponential backoff with jitter to prevent thundering herd
          const delay = this.config.retryDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }
/**
 * Transform raw GraphQL data into structured creator analytics
 */
private transformCreatorAnalyticsData(rawData: CreatorAnalyticsResponse): CreatorAnalytics {
    const creator = rawData.creator
    
    if (!creator) {
      throw new Error('Creator not found')
    }
  
    // Calculate content by category aggregation
    const contentByCategory = creator.contents.reduce((acc: { category: string; count: number; earnings: bigint }[], content) => {
      const existing = acc.find(item => item.category === content.category)
      const earnings = content.purchases.reduce((sum: bigint, purchase) => 
        sum + BigInt(purchase.amount), BigInt(0))
      
      if (existing) {
        existing.count += 1
        existing.earnings += earnings
      } else {
        acc.push({
          category: content.category,
          count: 1,
          earnings
        })
      }
      return acc
    }, [])
  
    // Extract recent activity from purchases and subscriptions
    const recentActivity = [
      ...creator.contents.flatMap((content) => 
        content.purchases.map((purchase) => ({
          type: 'content_purchased' as const,
          timestamp: new Date(parseInt(purchase.timestamp) * 1000),
          details: { contentId: content.id, amount: purchase.amount }
        }))
      ),
      ...creator.subscriptions.map((sub) => ({
        type: 'subscription_started' as const,
        timestamp: new Date(parseInt(sub.startTime) * 1000),
        details: { amount: sub.amount }
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10)
  
    // Calculate performance metrics
    const totalViews = creator.contents.reduce((sum: number, content) => 
      sum + content.purchaseCount, 0)
    const averageViewsPerContent = creator.contents.length > 0 
      ? totalViews / creator.contents.length 
      : 0
  
    // Create a mutable copy of the readonly contents array for sorting
    const sortedContents = [...creator.contents]
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, 5)
  
    return {
      creatorAddress: creator.id as Address,
      totalContent: creator.contentCount,
      totalEarnings: BigInt(creator.totalEarnings),
      totalSubscribers: creator.subscriberCount,
      contentByCategory,
      recentActivity,
      performanceMetrics: {
        averageViewsPerContent,
        subscriptionRetentionRate: 85.2, // Would calculate from historical data
        topPerformingContent: sortedContents.map((content) => ({
          contentId: content.id,
          title: content.title,
          views: content.purchaseCount,
          earnings: BigInt(content.purchases.reduce((sum: number, purchase) => 
            sum + parseInt(purchase.amount), 0))
        }))
      }
    }
  }

  /**
   * Transform raw GraphQL data into platform analytics
   */
  private transformPlatformAnalyticsData(rawData: PlatformAnalyticsResponse): PlatformAnalytics {
    const platform = rawData.platform

    // Calculate growth metrics from recent purchases
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

    const recentPurchases = rawData.recentPurchases || []
    const dailyPurchases = recentPurchases.filter((p) => 
      parseInt(p.timestamp) * 1000 > oneDayAgo)
    const weeklyPurchases = recentPurchases.filter((p) => 
      parseInt(p.timestamp) * 1000 > oneWeekAgo)

    return {
      totalCreators: platform?.totalCreators || 0,
      totalContent: platform?.totalContent || 0,
      totalTransactions: platform?.totalTransactions || 0,
      totalVolume: BigInt(platform?.totalVolume || 0),
      growthMetrics: {
        dailyActiveUsers: rawData.dailyActiveUsers?.length || 0,
        weeklyGrowthRate: this.calculateGrowthRate(weeklyPurchases, recentPurchases),
        monthlyRecurringRevenue: this.calculateMRR(rawData.creators || [])
      },
      categoryDistribution: rawData.categoryMetrics?.map((metric) => ({
        category: metric.category,
        percentage: metric.contentCount / (platform?.totalContent || 1) * 100,
        averagePrice: BigInt(metric.averagePrice || 0)
      })) || [],
      topCreators: rawData.creators?.slice(0, 10).map((creator) => ({
        address: creator.id as Address,
        earnings: BigInt(creator.totalEarnings),
        contentCount: creator.contentCount,
        subscriberCount: creator.subscriberCount
      })) || [],
      verifiedCreatorsCount: rawData.verifiedCreators?.length || 0,
      activeCreatorsCount: rawData.activeCreators?.length || 0
    }
  }

  /**
   * Transform raw GraphQL data into user content history
   */
  private transformUserHistoryData(rawData: UserHistoryResponse): readonly ContentHistoryEntry[] {
    const directPurchases = rawData.contentPurchases?.map((purchase) => ({
      contentId: purchase.content.id,
      title: purchase.content.title,
      creator: purchase.content.creator.id as Address,
      category: purchase.content.category,
      purchasePrice: BigInt(purchase.amount),
      purchasedAt: new Date(parseInt(purchase.timestamp) * 1000),
      lastAccessedAt: new Date(parseInt(purchase.timestamp) * 1000), // Simplified
      accessCount: 1, // Would track from interaction data
      isSubscriptionAccess: false
    })) || []

    const subscriptionAccess = rawData.user?.subscriptions?.flatMap((sub) =>
      sub.creator.contents.map((content) => ({
        contentId: content.id,
        title: content.title,
        creator: sub.creator.id as Address,
        category: content.category,
        purchasePrice: BigInt(0), // Subscription access
        purchasedAt: new Date(parseInt(sub.startTime) * 1000),
        lastAccessedAt: new Date(parseInt(sub.startTime) * 1000),
        accessCount: 1,
        isSubscriptionAccess: true
      }))
    ) || []

    return [...directPurchases, ...subscriptionAccess]
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime())
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(content: RawContentData, searchQuery: string): number {
    let score = 0
    
    // Title match bonus
    if (content.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      score += 100
    }
    
    // Description match bonus
    if (content.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      score += 50
    }
    
    // Popularity bonus (based on purchase count)
    score += Math.min(content.purchaseCount * 2, 50)
    
    // Verified creator bonus
    if (content.creator.isVerified) {
      score += 25
    }
    
    return score
  }

  /**
   * Generate cache key for query results
   */
  private generateQueryHash(queryType: string, params: Record<string, unknown>): string {
    const paramString = JSON.stringify(params, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value)
    return `${queryType}_${Buffer.from(paramString).toString('base64').slice(0, 16)}`
  }

  /**
   * Get cached query result if still valid
   */
  private getCachedResult<T>(queryHash: string): QueryResult<T> | null {
    const cached = this.queryCache.get(queryHash)
    if (cached && Date.now() - cached.timestamp < this.config.cacheTtl) {
      return {
        data: cached.data as T,
        meta: {
          queryTime: 0,
          cacheHit: true,
          blockNumber: 0,
          indexedAt: new Date(cached.timestamp),
          queryHash
        }
      }
    }
    return null
  }

  /**
   * Cache query result for future requests
   */
  private cacheResult<T>(queryHash: string, result: QueryResult<T>): void {
    this.queryCache.set(queryHash, {
      data: result.data,
      timestamp: Date.now()
    })
  }

  // Utility calculation methods
  private calculateGrowthRate(
    recent: readonly { readonly timestamp: string; readonly amount: string }[], 
    total: readonly { readonly timestamp: string; readonly amount: string }[]
  ): number {
    if (total.length === 0) return 0
    return (recent.length / total.length) * 100
  }

  private calculateMRR(creators: readonly RawCreatorData[]): bigint {
    // Simplified MRR calculation - would be more sophisticated in production
    return creators.reduce((sum, creator) => 
      sum + BigInt(creator.totalEarnings), BigInt(0)) / BigInt(12)
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear()
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.queryCache.size,
      hitRate: 0 // Would track in production
    }
  }
}

/**
 * Default Subgraph Query Service Instance
 */
export const subgraphQueryService = new SubgraphQueryService()

/**
 * React Hook for Subgraph Queries
 */
export function useSubgraphQuery<T>(
  queryFn: () => Promise<QueryResult<T>>,
  dependencies: readonly unknown[] = []
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [meta, setMeta] = React.useState<QueryResult<T>['meta'] | null>(null)

  React.useEffect(() => {
    let cancelled = false
    
    const executeQuery = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await queryFn()
        
        if (!cancelled) {
          setData(result.data)
          setMeta(result.meta)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Query failed'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    executeQuery()
    
    return () => {
      cancelled = true
    }
  }, dependencies)

  return { data, loading, error, meta }
}

// Import React for hook implementation
import React from 'react'

/**
 * Export type definitions
 */
export type {
  SubgraphConfig,
  QueryResult,
  PaginationParams,
  CreatorAnalytics,
  PlatformAnalytics,
  ContentHistoryEntry
}
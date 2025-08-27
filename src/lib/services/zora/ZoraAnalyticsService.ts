export interface AnalyticsData {
  views: number
  likes: number
  shares: number
  revenue: number
  revenueChange: number
  viewsChange: number
  likesChange: number
  sharesChange: number
  recentActivity: Array<{
    type: 'mint' | 'sale' | 'like' | 'view' | 'share'
    timestamp: string
    description: string
    value?: string
  }>
}

export interface CollectionAnalytics {
  totalSupply: number
  mintedCount: number
  floorPrice: number
  totalVolume: number
  averagePrice: number
  uniqueOwners: number
  secondarySales: number
  royaltyEarnings: number
}

export interface RevenueMetrics {
  totalRevenue: number
  subscriptionRevenue: number
  nftRevenue: number
  royaltyRevenue: number
  revenueGrowth: number
  averageRevenuePerUser: number
  revenueByPeriod: Array<{
    period: string
    revenue: number
    change: number
  }>
}

export interface EngagementMetrics {
  totalViews: number
  totalLikes: number
  totalShares: number
  engagementRate: number
  averageTimeOnPage: number
  bounceRate: number
  viewsBySource: Array<{
    source: string
    views: number
    percentage: number
  }>
}

export class ZoraAnalyticsService {
  private static instance: ZoraAnalyticsService

  static getInstance(): ZoraAnalyticsService {
    if (!ZoraAnalyticsService.instance) {
      ZoraAnalyticsService.instance = new ZoraAnalyticsService()
    }
    return ZoraAnalyticsService.instance
  }

  /**
   * Calculate engagement rate
   */
  calculateEngagementRate(likes: number, shares: number, views: number): number {
    if (views === 0) return 0
    return ((likes + shares) / views) * 100
  }

  /**
   * Calculate revenue growth
   */
  calculateRevenueGrowth(currentRevenue: number, previousRevenue: number): number {
    if (previousRevenue === 0) return 0
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100
  }

  /**
   * Calculate average revenue per user
   */
  calculateAverageRevenuePerUser(totalRevenue: number, userCount: number): number {
    if (userCount === 0) return 0
    return totalRevenue / userCount
  }

  /**
   * Calculate NFT collection metrics
   */
  calculateCollectionMetrics(
    totalSupply: number,
    mintedCount: number,
    totalVolume: number,
    secondarySales: number,
    royaltyRate: number
  ): CollectionAnalytics {
    const floorPrice = totalVolume > 0 ? totalVolume / mintedCount : 0
    const averagePrice = mintedCount > 0 ? totalVolume / mintedCount : 0
    const royaltyEarnings = secondarySales * (royaltyRate / 100)

    return {
      totalSupply,
      mintedCount,
      floorPrice,
      totalVolume,
      averagePrice,
      uniqueOwners: Math.floor(mintedCount * 0.8), // Estimate unique owners
      secondarySales,
      royaltyEarnings
    }
  }

  /**
   * Calculate revenue metrics
   */
  calculateRevenueMetrics(
    subscriptionRevenue: number,
    nftRevenue: number,
    royaltyRevenue: number,
    previousPeriodRevenue: number,
    userCount: number
  ): RevenueMetrics {
    const totalRevenue = subscriptionRevenue + nftRevenue + royaltyRevenue
    const revenueGrowth = this.calculateRevenueGrowth(totalRevenue, previousPeriodRevenue)
    const averageRevenuePerUser = this.calculateAverageRevenuePerUser(totalRevenue, userCount)

    // Generate revenue by period data (last 6 months)
    const revenueByPeriod = this.generateRevenueByPeriodData(totalRevenue)

    return {
      totalRevenue,
      subscriptionRevenue,
      nftRevenue,
      royaltyRevenue,
      revenueGrowth,
      averageRevenuePerUser,
      revenueByPeriod
    }
  }

  /**
   * Calculate engagement metrics
   */
  calculateEngagementMetrics(
    views: number,
    likes: number,
    shares: number,
    averageTimeOnPage: number,
    bounceRate: number,
    viewsBySource: Array<{ source: string; views: number }>
  ): EngagementMetrics {
    const engagementRate = this.calculateEngagementRate(likes, shares, views)
    const totalViews = views
    const totalLikes = likes
    const totalShares = shares

    // Calculate percentage for each source
    const totalSourceViews = viewsBySource.reduce((sum, source) => sum + source.views, 0)
    const viewsBySourceWithPercentage = viewsBySource.map(source => ({
      ...source,
      percentage: totalSourceViews > 0 ? (source.views / totalSourceViews) * 100 : 0
    }))

    return {
      totalViews,
      totalLikes,
      totalShares,
      engagementRate,
      averageTimeOnPage,
      bounceRate,
      viewsBySource: viewsBySourceWithPercentage
    }
  }

  /**
   * Generate trend analysis
   */
  generateTrendAnalysis(data: number[], periods: string[]): {
    trend: 'increasing' | 'decreasing' | 'stable'
    percentageChange: number
    average: number
  } {
    if (data.length < 2) {
      return {
        trend: 'stable',
        percentageChange: 0,
        average: data[0] || 0
      }
    }

    const firstValue = data[0]
    const lastValue = data[data.length - 1]
    const percentageChange = this.calculateRevenueGrowth(lastValue, firstValue)
    const average = data.reduce((sum, value) => sum + value, 0) / data.length

    let trend: 'increasing' | 'decreasing' | 'stable'
    if (percentageChange > 5) {
      trend = 'increasing'
    } else if (percentageChange < -5) {
      trend = 'decreasing'
    } else {
      trend = 'stable'
    }

    return {
      trend,
      percentageChange,
      average
    }
  }

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(
    engagementRate: number,
    revenueGrowth: number,
    userGrowth: number
  ): number {
    // Weighted scoring system
    const engagementWeight = 0.3
    const revenueWeight = 0.4
    const userWeight = 0.3

    // Normalize values (assuming reasonable ranges)
    const normalizedEngagement = Math.min(engagementRate / 10, 1) // Max 10% engagement
    const normalizedRevenue = Math.min(revenueGrowth / 50, 1) // Max 50% growth
    const normalizedUser = Math.min(userGrowth / 30, 1) // Max 30% growth

    return (
      normalizedEngagement * engagementWeight +
      normalizedRevenue * revenueWeight +
      normalizedUser * userWeight
    ) * 100
  }

  /**
   * Generate insights from analytics data
   */
  generateInsights(
    analytics: AnalyticsData,
    collectionAnalytics: CollectionAnalytics,
    revenueMetrics: RevenueMetrics
  ): Array<{
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
    value: string
  }> {
    const insights: Array<{
      type: 'positive' | 'negative' | 'neutral'
      title: string
      description: string
      value: string
    }> = []

    // Engagement insights
    const engagementRate = this.calculateEngagementRate(
      analytics.likes,
      analytics.shares,
      analytics.views
    )

    if (engagementRate > 5) {
      insights.push({
        type: 'positive',
        title: 'High Engagement',
        description: 'Your content is resonating well with your audience',
        value: `${engagementRate.toFixed(1)}% engagement rate`
      })
    } else if (engagementRate < 2) {
      insights.push({
        type: 'negative',
        title: 'Low Engagement',
        description: 'Consider improving content quality or promotion',
        value: `${engagementRate.toFixed(1)}% engagement rate`
      })
    }

    // Revenue insights
    if (revenueMetrics.revenueGrowth > 20) {
      insights.push({
        type: 'positive',
        title: 'Strong Revenue Growth',
        description: 'Your revenue is growing significantly',
        value: `${revenueMetrics.revenueGrowth.toFixed(1)}% growth`
      })
    }

    // NFT insights
    const mintRate = (collectionAnalytics.mintedCount / collectionAnalytics.totalSupply) * 100
    if (mintRate > 80) {
      insights.push({
        type: 'positive',
        title: 'High Mint Rate',
        description: 'Your NFT collection is very popular',
        value: `${mintRate.toFixed(1)}% minted`
      })
    }

    return insights
  }

  /**
   * Generate revenue by period data
   */
  private generateRevenueByPeriodData(currentRevenue: number): Array<{
    period: string
    revenue: number
    change: number
  }> {
    const periods = ['6 months ago', '5 months ago', '4 months ago', '3 months ago', '2 months ago', '1 month ago']
    const data = []

    for (let i = 0; i < periods.length; i++) {
      const baseRevenue = currentRevenue * (0.5 + Math.random() * 0.5) // Random variation
      const revenue = Math.floor(baseRevenue)
      const change = i === periods.length - 1 ? 0 : Math.floor(Math.random() * 40) - 20

      data.push({
        period: periods[i],
        revenue,
        change
      })
    }

    return data.reverse()
  }

  /**
   * Format analytics data for display
   */
  formatAnalyticsData(data: AnalyticsData): {
    views: string
    likes: string
    shares: string
    revenue: string
  } {
    return {
      views: this.formatNumber(data.views),
      likes: this.formatNumber(data.likes),
      shares: this.formatNumber(data.shares),
      revenue: this.formatCurrency(data.revenue)
    }
  }

  /**
   * Format number with K/M suffixes
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
}

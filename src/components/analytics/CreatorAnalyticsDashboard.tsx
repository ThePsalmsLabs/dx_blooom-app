/**
 * Creator Analytics Dashboard - Phase 2 Component
 * File: src/components/analytics/CreatorAnalyticsDashboard.tsx
 * 
 * This component transforms our sophisticated creator analytics into an intuitive
 * dashboard experience that empowers creators with actionable insights. It demonstrates
 * how to build production-ready analytics interfaces that feel professional while
 * maintaining excellent performance and user experience characteristics.
 * 
 * Educational Architecture Integration:
 * - Consumes our useCreatorAnalytics hook to showcase advanced data visualization
 * - Follows your established dashboard patterns from src/app/dashboard/page.tsx
 * - Uses your exact component structure: Tabs, Cards, and responsive layouts
 * - Integrates with your existing creator dashboard and navigation patterns
 * - Demonstrates sophisticated data visualization using HTML/CSS techniques
 * 
 * Key Features:
 * - Comprehensive performance metrics with platform comparisons
 * - Interactive time period analysis and trend visualization
 * - Earnings optimization insights with pricing recommendations
 * - Growth analytics with milestone tracking and progress indicators
 * - Competitive positioning and ranking insights
 * - Actionable recommendations based on data analysis
 * - Real-time data updates with intelligent caching
 * - Responsive design optimized for creator workflows
 * 
 * Business Impact:
 * - Enables creators to optimize their content strategy with data-driven insights
 * - Provides platform comparison metrics for competitive analysis
 * - Offers pricing optimization recommendations to increase revenue
 * - Tracks growth milestones and provides clear progress indicators
 * - Builds creator confidence through transparent performance analytics
 * - Increases creator retention by providing professional-grade business tools
 * 
 * Component Architecture:
 * - Modular analytics sections for flexible dashboard composition
 * - Progressive disclosure of complex analytics for different user skill levels
 * - Integration with existing creator dashboard navigation and state management
 * - Extensible structure for adding new analytics modules and visualizations
 * - Performance optimized with intelligent data fetching and caching strategies
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import {
  TrendingUp,
  Target,
  Users,
  DollarSign,
  BarChart3,
  Award,
  Star,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  Zap,
  Crown,
  Activity
} from 'lucide-react'

// Import your established UI components following exact patterns
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/seperator'

import { cn, formatCurrency, formatNumber, formatAddress } from '@/lib/utils'

// Import our sophisticated data layer hooks
import {
  useCreatorAnalytics,
  useCreatorPerformance,
  useCreatorEarningsInsights,
  CreatorAnalyticsResult
} from '@/hooks/contracts/analytics/useCreatorAnalytics'
import { usePlatformAnalytics } from '@/hooks/contracts/analytics/usePlatformAnalytics'
import { useCreatorProfile, useWithdrawEarnings } from '@/hooks/contracts/core'
import { type Address } from 'viem'

// ===== COMPONENT INTERFACE DEFINITIONS =====

/**
 * Analytics Time Period Options
 * Matches your existing dashboard patterns for consistent UX
 */
type AnalyticsTimePeriod = '7d' | '30d' | '90d' | '1y' | 'all'

/**
 * Analytics View Mode
 * Allows creators to focus on different aspects of their performance
 */
type AnalyticsViewMode = 'overview' | 'performance' | 'earnings' | 'growth' | 'insights'

/**
 * Dashboard Configuration Interface
 * Provides flexibility for different dashboard integration scenarios
 */
interface CreatorAnalyticsDashboardConfig {
  readonly showTimePeriodSelector?: boolean
  readonly showDownloadOptions?: boolean
  readonly showPlatformComparisons?: boolean
  readonly enableRealTimeUpdates?: boolean
  readonly defaultTimePeriod?: AnalyticsTimePeriod
  readonly defaultViewMode?: AnalyticsViewMode
  readonly compactMode?: boolean
}

/**
 * Component Props Interface
 * Follows your established component prop patterns
 */
interface CreatorAnalyticsDashboardProps {
  /** Creator address to analyze */
  creatorAddress?: Address
  /** Optional dashboard configuration */
  config?: CreatorAnalyticsDashboardConfig
  /** Callback when analytics are refreshed */
  onAnalyticsRefresh?: () => void
  /** Optional custom styling */
  className?: string
  /** Whether to show in compact mode for embedding */
  compact?: boolean
}

// ===== MAIN COMPONENT IMPLEMENTATION =====

/**
 * CreatorAnalyticsDashboard Component
 * 
 * This component demonstrates how to transform sophisticated analytics data into
 * compelling visual experiences that help creators understand and optimize their
 * performance. It showcases advanced React patterns while maintaining excellent
 * integration with your established platform architecture.
 * 
 * Key Teaching Points:
 * - How to design analytics interfaces that balance sophistication with usability
 * - Progressive disclosure patterns for complex data presentation
 * - Integration techniques between data hooks and visualization components
 * - Performance optimization strategies for real-time analytics dashboards
 * - Responsive design approaches for analytics-heavy interfaces
 */
export function CreatorAnalyticsDashboard({
  creatorAddress,
  config = {},
  onAnalyticsRefresh,
  className,
  compact = false
}: CreatorAnalyticsDashboardProps) {

  const { address: connectedAddress } = useAccount()

  // Determine effective creator address using your established patterns
  const effectiveCreatorAddress = (creatorAddress || connectedAddress) as Address | undefined

  // Extract configuration with intelligent defaults
  const {
    showTimePeriodSelector = true,
    showDownloadOptions = true,

    enableRealTimeUpdates = true,
    defaultTimePeriod = '30d',
    defaultViewMode = 'overview',
    compactMode = compact
  } = config

  // ===== STATE MANAGEMENT =====
  // Following your established dashboard state patterns

  const [timePeriod, setTimePeriod] = useState<AnalyticsTimePeriod>(defaultTimePeriod)
  const [viewMode, setViewMode] = useState<AnalyticsViewMode>(defaultViewMode)
  const [isRefreshing, setIsRefreshing] = useState(false)


  // ===== DATA LAYER INTEGRATION =====
  // Demonstrating sophisticated analytics hook consumption

  // Get comprehensive creator analytics using our advanced hook
  const {
    analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error: analyticsErrorMessage,
    refetch: refetchAnalytics,
    dataQuality
  } = useCreatorAnalytics(effectiveCreatorAddress, enableRealTimeUpdates)

  // Get simplified performance metrics for quick overview
  const {
    isLoading: performanceLoading
  } = useCreatorPerformance(effectiveCreatorAddress)

  // Get detailed earnings insights for financial optimization
  const {
    insights: earningsInsights,
    isLoading: earningsLoading,
    refreshInsights
  } = useCreatorEarningsInsights(effectiveCreatorAddress)

  // Get platform analytics for comparative insights
  const {
    isLoading: platformLoading
  } = usePlatformAnalytics()

  // Get basic creator profile for context
  const {
    data: creatorProfile,
    isLoading: profileLoading
  } = useCreatorProfile(effectiveCreatorAddress)

  // Earnings withdrawal action
  const {
    write: withdrawEarnings,
    isLoading: isWithdrawing,
    isSuccess: isWithdrawSuccess,
    isError: isWithdrawError,
    error: withdrawError
  } = useWithdrawEarnings()

  const handleWithdraw = useCallback(() => {
    try {
      withdrawEarnings()
    } catch (error) {
      console.error('Withdraw failed:', error)
    }
  }, [withdrawEarnings])

  // ===== EVENT HANDLERS =====
  // Demonstrating clean event handling patterns

  const handleTimePeriodChange = useCallback((newPeriod: AnalyticsTimePeriod) => {
    setTimePeriod(newPeriod)
    // Defer refresh to the caller/UI action to avoid cyclic dependencies
  }, [])

  const handleRefreshAnalytics = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        refetchAnalytics(),
        refreshInsights()
      ])
      onAnalyticsRefresh?.()
    } catch (error) {
      console.error('Failed to refresh analytics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refetchAnalytics, refreshInsights, onAnalyticsRefresh])



  const handleDownloadReport = useCallback(() => {
    // Build a simple JSON report from currently loaded analytics
    const report: {
      readonly creator: string | undefined
      readonly timePeriod: AnalyticsTimePeriod
      readonly generatedAt: string
      readonly performance?: CreatorAnalyticsResult['performanceMetrics']
      readonly comparative?: CreatorAnalyticsResult['comparativeAnalytics']
      readonly growth?: CreatorAnalyticsResult['growthAnalytics']
      readonly financial?: CreatorAnalyticsResult['financialAnalytics']
    } = {
      creator: effectiveCreatorAddress,
      timePeriod,
      generatedAt: new Date().toISOString(),
      performance: analytics?.performanceMetrics,
      comparative: analytics?.comparativeAnalytics,
      growth: analytics?.growthAnalytics,
      financial: analytics?.financialAnalytics,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `creator-analytics-${effectiveCreatorAddress || 'unknown'}-${timePeriod}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [analytics, effectiveCreatorAddress, timePeriod])

  // ===== COMPUTED VALUES =====
  // Demonstrating efficient computation with useMemo

  const isLoading = useMemo(() => {
    return analyticsLoading || performanceLoading || earningsLoading || platformLoading || profileLoading
  }, [analyticsLoading, performanceLoading, earningsLoading, platformLoading, profileLoading])

  const hasAnalyticsData = useMemo(() => {
    return analytics && !analyticsError
  }, [analytics, analyticsError])

  const analyticsQualityIndicator = useMemo(() => {
    if (!hasAnalyticsData) return 'poor'
    return dataQuality
  }, [hasAnalyticsData, dataQuality])

  // Progress toward next milestones
  const earningsProgress = useMemo(() => {
    if (!analytics) return 0
    const current = Number(analytics.performanceMetrics.totalEarnings)
    const target = Number(analytics.growthAnalytics.milestones.nextEarningsMilestone)
    if (!target || target <= 0) return 0
    return Math.min(100, Math.max(0, Math.floor((current / target) * 100)))
  }, [analytics])

  const subscriberProgress = useMemo(() => {
    if (!analytics) return 0
    const current = Number(analytics.performanceMetrics.subscriberCount)
    const target = Number(analytics.growthAnalytics.milestones.nextSubscriberMilestone)
    if (!target || target <= 0) return 0
    return Math.min(100, Math.max(0, Math.floor((current / target) * 100)))
  }, [analytics])

  // ===== RENDER FUNCTIONS =====
  // Demonstrating component composition patterns

  const renderDashboardHeader = () => (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">
          {compactMode ? 'Analytics' : 'Creator Analytics Dashboard'}
        </h2>
        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
          <span>
            {creatorProfile?.isVerified && (
              <Badge variant="default" className="mr-2">
                <Star className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {effectiveCreatorAddress ? formatAddress(effectiveCreatorAddress) : 'Loading...'}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center space-x-1">
            <div className={cn(
              "h-2 w-2 rounded-full",
              analyticsQualityIndicator === 'excellent' ? "bg-green-500" :
              analyticsQualityIndicator === 'good' ? "bg-yellow-500" :
              analyticsQualityIndicator === 'fair' ? "bg-orange-500" : "bg-red-500"
            )} />
            <span className="capitalize">{analyticsQualityIndicator} data quality</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Time Period Selector */}
        {showTimePeriodSelector && !compactMode && (
          <Select value={timePeriod} onValueChange={handleTimePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Action Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAnalytics}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>

        {showDownloadOptions && !compactMode && (
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>
    </div>
  )

  const renderOverviewMetrics = () => {
    if (!analytics) return null

    const { performanceMetrics, comparativeAnalytics } = analytics

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings Metric */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(performanceMetrics.totalEarnings, 6)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {performanceMetrics.earningsGrowthRate.toFixed(1)}% growth rate
            </p>
          </CardContent>
        </Card>

        {/* Content Count Metric */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Created</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(Number(performanceMetrics.contentCount))}
            </div>
            <p className="text-xs text-muted-foreground">
              {comparativeAnalytics.creatorPerformance.contentProductivity > 0 ? (
                <span className="text-green-600">
                  +{comparativeAnalytics.creatorPerformance.contentProductivity.toFixed(1)}% vs platform avg
                </span>
              ) : (
                <span className="text-red-600">
                  {comparativeAnalytics.creatorPerformance.contentProductivity.toFixed(1)}% vs platform avg
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Subscriber Count Metric */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(Number(performanceMetrics.subscriberCount))}
            </div>
            <p className="text-xs text-muted-foreground">
              {comparativeAnalytics.creatorPerformance.subscriberAttraction > 0 ? (
                <span className="text-green-600">
                  +{comparativeAnalytics.creatorPerformance.subscriberAttraction.toFixed(1)}% vs platform avg
                </span>
              ) : (
                <span className="text-red-600">
                  {comparativeAnalytics.creatorPerformance.subscriberAttraction.toFixed(1)}% vs platform avg
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Performance Score Metric */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {comparativeAnalytics.creatorPerformance.overallPerformanceScore.toFixed(0)}
            </div>
            <div className="mt-2">
              <Progress 
                value={comparativeAnalytics.creatorPerformance.overallPerformanceScore} 
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {comparativeAnalytics.creatorPerformance.overallPerformanceScore >= 80 ? 'Excellent' :
               comparativeAnalytics.creatorPerformance.overallPerformanceScore >= 60 ? 'Good' :
               comparativeAnalytics.creatorPerformance.overallPerformanceScore >= 40 ? 'Fair' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPerformanceAnalysis = () => {
    if (!analytics) return null

    const { performanceMetrics, comparativeAnalytics } = analytics

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Comparison
            </CardTitle>
            <CardDescription>
              How your performance compares to other creators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Content Productivity Comparison */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Content Productivity</span>
                  <span className={cn(
                    "font-medium",
                    comparativeAnalytics.creatorPerformance.contentProductivity > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {comparativeAnalytics.creatorPerformance.contentProductivity > 0 ? "+" : ""}
                    {comparativeAnalytics.creatorPerformance.contentProductivity.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, Math.max(0, 50 + comparativeAnalytics.creatorPerformance.contentProductivity))} 
                  className="h-2"
                />
              </div>

              {/* Subscriber Attraction Comparison */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subscriber Attraction</span>
                  <span className={cn(
                    "font-medium",
                    comparativeAnalytics.creatorPerformance.subscriberAttraction > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {comparativeAnalytics.creatorPerformance.subscriberAttraction > 0 ? "+" : ""}
                    {comparativeAnalytics.creatorPerformance.subscriberAttraction.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, Math.max(0, 50 + comparativeAnalytics.creatorPerformance.subscriberAttraction))} 
                  className="h-2"
                />
              </div>

              {/* Earnings Efficiency Comparison */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Earnings Efficiency</span>
                  <span className={cn(
                    "font-medium",
                    comparativeAnalytics.creatorPerformance.earningsEfficiency > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {comparativeAnalytics.creatorPerformance.earningsEfficiency > 0 ? "+" : ""}
                    {comparativeAnalytics.creatorPerformance.earningsEfficiency.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, Math.max(0, 50 + comparativeAnalytics.creatorPerformance.earningsEfficiency))} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Platform Rankings
            </CardTitle>
            <CardDescription>
              Your position among all creators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Earnings Rank</span>
                </div>
                <Badge variant="secondary">
                  #{performanceMetrics.platformRank.byEarnings}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Subscriber Rank</span>
                </div>
                <Badge variant="secondary">
                  #{performanceMetrics.platformRank.bySubscribers}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Content Rank</span>
                </div>
                <Badge variant="secondary">
                  #{performanceMetrics.platformRank.byContent}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderEarningsAnalysis = () => {
    if (!analytics || !earningsInsights) return null


    const { currentEarnings, optimization, trends } = earningsInsights

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Earnings Breakdown
            </CardTitle>
            <CardDescription>
              Detailed view of your financial performance
            </CardDescription>
          </CardHeader>
          <CardContent>
              <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="font-medium">Available for Withdrawal</span>
                <span className="text-lg font-bold text-green-700">
                  {formatCurrency(currentEarnings.pending, 6)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span>Total Lifetime Earnings</span>
                <span className="font-semibold">
                  {formatCurrency(currentEarnings.total, 6)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span>Previously Withdrawn</span>
                <span className="font-semibold">
                  {formatCurrency(currentEarnings.total - currentEarnings.pending, 6)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-medium">Monthly Estimate</span>
                <span className="text-lg font-bold text-blue-700">
                  ${currentEarnings.monthlyEstimate.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  disabled={isWithdrawing}
                  onClick={handleWithdraw}
                  className="justify-start"
                >
                  {isWithdrawing ? (
                    <span className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Withdrawing...
                    </span>
                  ) : (
                    'Withdraw Earnings'
                  )}
                </Button>

                {isWithdrawError && (
                  <Alert>
                    <AlertDescription>
                      {withdrawError?.message || 'Withdrawal failed. Please try again.'}
                    </AlertDescription>
                  </Alert>
                )}

                {isWithdrawSuccess && (
                  <Alert>
                    <AlertDescription>
                      Withdrawal submitted. Your balance will update after confirmation.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pricing Optimization
            </CardTitle>
            <CardDescription>
              Revenue optimization recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Current Price</span>
                  <span className="font-semibold">
                    {formatCurrency(optimization.currentPrice, 6)}/month
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium">Suggested Price</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(optimization.suggestedPrice, 6)}/month
                  </span>
                </div>
              </div>

              {optimization.potentialIncrease > 0 && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Optimizing your pricing could increase monthly revenue by up to{' '}
                    <span className="font-semibold text-green-600">
                      {optimization.potentialIncrease.toFixed(1)}%
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    trends.trajectory === 'accelerating' ? "bg-green-500" :
                    trends.trajectory === 'steady' ? "bg-yellow-500" : "bg-red-500"
                  )} />
                  <span className="text-sm">
                    Growth trajectory: <span className="font-medium capitalize">{trends.trajectory}</span>
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Next milestone: {formatCurrency(trends.nextMilestone, 6)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderGrowthInsights = () => {
    if (!analytics) return null

    const { growthAnalytics } = analytics

    return (
      <div className="space-y-6">
        {/* Growth Trends Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Growth Trends
            </CardTitle>
            <CardDescription>
              Track your progress across key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Earnings Growth */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Earnings Growth</span>
                </div>
                <div className="text-2xl font-bold">
                  {growthAnalytics.growthTrends.earnings.estimatedMonthlyGrowth.toFixed(1)}%
                </div>
                <Badge variant={
                  growthAnalytics.growthTrends.earnings.growthTrajectory === 'accelerating' ? 'default' :
                  growthAnalytics.growthTrends.earnings.growthTrajectory === 'steady' ? 'secondary' : 'destructive'
                }>
                  {growthAnalytics.growthTrends.earnings.growthTrajectory}
                </Badge>
              </div>

              {/* Subscriber Growth */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Subscriber Growth</span>
                </div>
                <div className="text-2xl font-bold">
                  {growthAnalytics.growthTrends.subscribers.estimatedGrowthRate.toFixed(1)}%
                </div>
                <Badge variant={
                  growthAnalytics.growthTrends.subscribers.retentionIndicator === 'strong' ? 'default' :
                  growthAnalytics.growthTrends.subscribers.retentionIndicator === 'moderate' ? 'secondary' : 'destructive'
                }>
                  {growthAnalytics.growthTrends.subscribers.retentionIndicator} retention
                </Badge>
              </div>

              {/* Content Activity */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Publishing Rate</span>
                </div>
                <div className="text-2xl font-bold">
                  {growthAnalytics.growthTrends.content.estimatedPublishingRate.toFixed(1)}/mo
                </div>
                <Badge variant={
                  growthAnalytics.growthTrends.content.activityLevel === 'high' ? 'default' :
                  growthAnalytics.growthTrends.content.activityLevel === 'medium' ? 'secondary' : 'destructive'
                }>
                  {growthAnalytics.growthTrends.content.activityLevel} activity
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones and Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Upcoming Milestones
            </CardTitle>
            <CardDescription>
              Track your progress toward key achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Next Earnings Milestone</span>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(growthAnalytics.milestones.nextEarningsMilestone, 6)}
                  </span>
                </div>
                <Progress value={earningsProgress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Estimated {growthAnalytics.milestones.estimatedTimeToMilestone} days to reach
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Next Subscriber Milestone</span>
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(Number(growthAnalytics.milestones.nextSubscriberMilestone))} subscribers
                  </span>
                </div>
                <Progress value={subscriberProgress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  On track based on current growth rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderActionableInsights = () => {
    if (!analytics) return null

    const { comparativeAnalytics, growthAnalytics } = analytics
    const allRecommendations = [
      ...comparativeAnalytics.recommendations,
      ...growthAnalytics.optimizationOpportunities
    ]

    return (
      <div className="space-y-6">
        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Optimization Recommendations
            </CardTitle>
            <CardDescription>
              Data-driven suggestions to improve your performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allRecommendations.length > 0 ? (
                allRecommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Excellent work! Your performance is optimized across all key metrics.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Take immediate steps to improve your metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Update Profile</div>
                  <div className="text-sm text-muted-foreground">
                    Optimize your creator profile for better discoverability
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Adjust Pricing</div>
                  <div className="text-sm text-muted-foreground">
                    Implement suggested pricing optimizations
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Create Content</div>
                  <div className="text-sm text-muted-foreground">
                    Publish new content to maintain engagement
                  </div>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Withdraw Earnings</div>
                  <div className="text-sm text-muted-foreground">
                    Claim your available earnings
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== LOADING AND ERROR STATES =====
  // Following your established patterns for state management

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {renderDashboardHeader()}
        <AnalyticsDashboardSkeleton compact={compactMode} />
      </div>
    )
  }

  if (analyticsError || !effectiveCreatorAddress) {
    return (
      <div className={cn("space-y-6", className)}>
        {renderDashboardHeader()}
        <AnalyticsErrorState 
          error={analyticsErrorMessage} 
          onRetry={handleRefreshAnalytics}
          creatorAddress={effectiveCreatorAddress}
        />
      </div>
    )
  }

  // ===== MAIN COMPONENT RENDER =====
  // Following your established tab-based dashboard patterns

  return (
    <div className={cn("space-y-6", className)}>
      {renderDashboardHeader()}

      {/* Analytics Dashboard Content */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as AnalyticsViewMode)}>
        <TabsList className={cn(
          "grid w-full",
          compactMode ? "grid-cols-3" : "grid-cols-5"
        )}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {!compactMode && <TabsTrigger value="performance">Performance</TabsTrigger>}
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          {!compactMode && <TabsTrigger value="growth">Growth</TabsTrigger>}
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverviewMetrics()}
          {!compactMode && renderPerformanceAnalysis()}
        </TabsContent>

        {!compactMode && (
          <TabsContent value="performance" className="space-y-6">
            {renderPerformanceAnalysis()}
          </TabsContent>
        )}

        <TabsContent value="earnings" className="space-y-6">
          {renderEarningsAnalysis()}
        </TabsContent>

        {!compactMode && (
          <TabsContent value="growth" className="space-y-6">
            {renderGrowthInsights()}
          </TabsContent>
        )}

        <TabsContent value="insights" className="space-y-6">
          {renderActionableInsights()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ===== SUPPORTING COMPONENTS =====
// Following your established component composition patterns

/**
 * Analytics Dashboard Skeleton
 * Provides loading state while analytics data is being fetched
 */
function AnalyticsDashboardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      {/* Metrics Cards Skeleton */}
      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      )}>
        {Array.from({ length: compact ? 2 : 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded animate-pulse w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse w-20 mb-2" />
              <div className="h-3 bg-muted rounded animate-pulse w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Areas Skeleton */}
      <div className={cn(
        "grid gap-6",
        compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {Array.from({ length: compact ? 1 : 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-5 bg-muted rounded animate-pulse w-40" />
              <div className="h-4 bg-muted rounded animate-pulse w-64" />
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Analytics Error State
 * Displays error information with recovery options
 */
function AnalyticsErrorState({ 
  error, 
  onRetry, 
  creatorAddress 
}: { 
  error: Error | null
  onRetry: () => void
  creatorAddress?: Address
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Unable to load analytics</h3>
        <p className="text-muted-foreground max-w-md">
          {!creatorAddress ? (
            'Please connect your wallet to view analytics.'
          ) : error?.message ? (
            error.message
          ) : (
            'An unexpected error occurred while loading your analytics. Please try again.'
          )}
        </p>
      </div>
      {creatorAddress && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}

// Export the main component and supporting interfaces
export type { 
  CreatorAnalyticsDashboardProps, 
  CreatorAnalyticsDashboardConfig,
  AnalyticsTimePeriod,
  AnalyticsViewMode
}

// Export supporting components for external use
export {
  AnalyticsDashboardSkeleton,
  AnalyticsErrorState
}
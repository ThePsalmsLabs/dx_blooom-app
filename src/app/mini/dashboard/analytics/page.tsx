/**
 * MiniApp Dashboard Analytics Page - Mobile Creator Performance Hub
 * File: src/app/mini/dashboard/analytics/page.tsx
 *
 * This page provides comprehensive analytics and insights for creators in the mini app,
 * delivering performance metrics, audience analytics, and revenue insights optimized
 * for mobile consumption and quick decision-making.
 *
 * Mini App Design Philosophy:
 * - Mobile-first analytics with touch-optimized interactions
 * - Key metrics at a glance with expandable details
 * - Visual data representation optimized for small screens
 * - Actionable insights with clear next steps
 * - Real-time data with efficient mobile loading
 *
 * Key Features:
 * - Revenue analytics with trend visualization
 * - Audience growth and engagement metrics
 * - Content performance breakdown
 * - Geographic audience insights
 * - Time period filtering and comparison
 * - Export capabilities for detailed analysis
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  DollarSign,
  Eye,
  Heart,
  Share2,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Target,
  Zap,
  Globe,
  PieChart,
  Activity,
  Loader2
} from 'lucide-react'

// Import your existing UI components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useCreatorProfile, useCreatorContent } from '@/hooks/contracts/core'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { formatWalletAddress, isWalletFullyConnected, getSafeAddress } from '@/lib/utils/wallet-utils'
import { useMiniAppUtils } from '@/contexts/UnifiedMiniAppProvider'

// Import your existing sophisticated components
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'

// Import utilities
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils'

/**
 * Analytics Time Period Types
 */
type TimePeriod = '7d' | '30d' | '90d' | '1y' | 'all'

/**
 * Analytics Metric Types
 */
type MetricType = 'revenue' | 'audience' | 'engagement' | 'content'

/**
 * MiniApp Dashboard Analytics Core Component
 *
 * This component orchestrates the complete analytics experience
 * with mobile-first design and comprehensive creator insights.
 */
function MiniAppDashboardAnalyticsCore() {
  const router = useRouter()

  // Core state management
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d')
  const [activeMetric, setActiveMetric] = useState<MetricType>('revenue')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const walletUI = useFarcasterAutoWallet()
  const userAddress = getSafeAddress(walletUI.address)
  const isConnected = isWalletFullyConnected(walletUI.isConnected, walletUI.address)
  const formattedAddress = formatWalletAddress(walletUI.address)

  // Creator data hooks
  const creatorProfile = useCreatorProfile(userAddress)
  const creatorContent = useCreatorContent(userAddress)

  /**
   * Period Change Handler
   */
  const handlePeriodChange = useCallback((period: TimePeriod) => {
    setSelectedPeriod(period)
    // In a real implementation, this would trigger data refresh
  }, [])

  /**
   * Refresh Data Handler
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await creatorProfile.refetch()
      await creatorContent.refetch()
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsRefreshing(false)
    }
  }, [creatorProfile, creatorContent])

  /**
   * Navigation Handler
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  // Handle wallet connection requirement
  if (!isConnected || !userAddress) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center space-y-6">
          <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Connect your wallet to view analytics
            </p>
          </div>
          <Button onClick={() => router.push('/mini')}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  // Handle creator verification
  if (creatorProfile.data && !creatorProfile.data.isRegistered && !creatorProfile.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center space-y-6">
          <Target className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Become a Creator</h1>
            <p className="text-muted-foreground">
              Register as a creator to access analytics
            </p>
          </div>
          <Button onClick={() => router.push('/mini/onboard')}>
            Get Started
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Optimized Navigation Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 space-y-6">
        {/* Analytics Header */}
        <AnalyticsHeader
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          onGoBack={handleGoBack}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Key Performance Metrics */}
        <KeyMetricsGrid
          creatorProfile={creatorProfile}
          creatorContent={creatorContent}
          selectedPeriod={selectedPeriod}
        />

        {/* Analytics Tabs */}
        <AnalyticsTabs
          activeMetric={activeMetric}
          onMetricChange={setActiveMetric}
          selectedPeriod={selectedPeriod}
          creatorProfile={creatorProfile}
          creatorContent={creatorContent}
        />

        {/* Insights & Recommendations */}
        <InsightsSection />

        {/* Export Options */}
        <ExportSection />
      </main>
    </div>
  )
}

/**
 * Analytics Header Component
 *
 * Mobile-optimized header with period selection and refresh
 */
function AnalyticsHeader({
  selectedPeriod,
  onPeriodChange,
  onGoBack,
  onRefresh,
  isRefreshing
}: {
  selectedPeriod: TimePeriod
  onPeriodChange: (period: TimePeriod) => void
  onGoBack: () => void
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const periods = [
    { value: '7d' as TimePeriod, label: 'Last 7 days' },
    { value: '30d' as TimePeriod, label: 'Last 30 days' },
    { value: '90d' as TimePeriod, label: 'Last 90 days' },
    { value: '1y' as TimePeriod, label: 'Last year' },
    { value: 'all' as TimePeriod, label: 'All time' }
  ]

  return (
    <div className="space-y-4">
      {/* Navigation and Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          className="flex items-center gap-2 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Title and Description */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Track your performance and audience engagement
        </p>
      </div>
    </div>
  )
}

/**
 * Key Metrics Grid Component
 *
 * Mobile-optimized display of key performance indicators
 */
function KeyMetricsGrid({
  creatorProfile,
  creatorContent,
  selectedPeriod
}: {
  creatorProfile: ReturnType<typeof useCreatorProfile>
  creatorContent: ReturnType<typeof useCreatorContent>
  selectedPeriod: TimePeriod
}) {
  if (creatorProfile.isLoading || creatorContent.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!creatorProfile.data) return null

  const profile = creatorProfile.data

  // TODO: Fetch real analytics data from analytics contract
  // const analyticsData = useAnalyticsData(userAddress, selectedPeriod)
  // const metrics = [
  //   {
  //     title: 'Revenue',
  //     value: formatCurrency(BigInt(profile.totalEarnings), 2, 'USDC'),
  //     change: analyticsData.revenueChange,
  //     trend: analyticsData.revenueTrend,
  //     icon: DollarSign,
  //     color: 'text-green-600'
  //   },
  //   {
  //     title: 'Subscribers',
  //     value: formatNumber(Number(profile.subscriberCount)),
  //     change: analyticsData.subscriberChange,
  //     trend: analyticsData.subscriberTrend,
  //     icon: Users,
  //     color: 'text-blue-600'
  //   },
  //   {
  //     title: 'Content Views',
  //     value: formatNumber(analyticsData.totalViews),
  //     change: analyticsData.viewsChange,
  //     trend: analyticsData.viewsTrend,
  //     icon: Eye,
  //     color: 'text-purple-600'
  //   },
  //   {
  //     title: 'Engagement',
  //     value: `${analyticsData.engagementRate}%`,
  //     change: analyticsData.engagementChange,
  //     trend: analyticsData.engagementTrend,
  //     icon: Heart,
  //     color: 'text-red-600'
  //   }
  // ]

  // Temporary mock data for development
  const metrics = [
    {
      title: 'Revenue',
      value: formatCurrency(BigInt(profile.totalEarnings), 6, 'USDC'),
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Subscribers',
      value: formatNumber(Number(profile.subscriberCount)),
      change: '+8.2%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Content Views',
      value: '1.2K', // TODO: Fetch from analytics
      change: '+15.3%',
      trend: 'up' as const,
      icon: Eye,
      color: 'text-purple-600'
    },
    {
      title: 'Engagement',
      value: '68.5%', // TODO: Fetch from analytics
      change: '+5.2%',
      trend: 'up' as const,
      icon: Heart,
      color: 'text-red-600'
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <metric.icon className={cn("h-4 w-4", metric.color)} />
              <span className="text-xs font-medium text-muted-foreground">
                {metric.title}
              </span>
            </div>
            <div className="text-lg font-bold mb-1">{metric.value}</div>
            <div className="flex items-center gap-1">
              {metric.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={cn(
                "text-xs",
                metric.trend === 'up' ? "text-green-600" : "text-red-600"
              )}>
                {metric.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Analytics Tabs Component
 *
 * Mobile-optimized tabbed interface for different analytics views
 */
function AnalyticsTabs({
  activeMetric,
  onMetricChange,
  selectedPeriod,
  creatorProfile,
  creatorContent
}: {
  activeMetric: MetricType
  onMetricChange: (metric: MetricType) => void
  selectedPeriod: TimePeriod
  creatorProfile: ReturnType<typeof useCreatorProfile>
  creatorContent: ReturnType<typeof useCreatorContent>
}) {
  return (
    <Tabs value={activeMetric} onValueChange={(value) => onMetricChange(value as MetricType)}>
      <TabsList className="grid grid-cols-4 gap-1 mb-4">
        <TabsTrigger value="revenue" className="text-xs">
          Revenue
        </TabsTrigger>
        <TabsTrigger value="audience" className="text-xs">
          Audience
        </TabsTrigger>
        <TabsTrigger value="engagement" className="text-xs">
          Engagement
        </TabsTrigger>
        <TabsTrigger value="content" className="text-xs">
          Content
        </TabsTrigger>
      </TabsList>

      <TabsContent value="revenue" className="space-y-4">
        <RevenueAnalytics selectedPeriod={selectedPeriod} />
      </TabsContent>

      <TabsContent value="audience" className="space-y-4">
        <AudienceAnalytics selectedPeriod={selectedPeriod} />
      </TabsContent>

      <TabsContent value="engagement" className="space-y-4">
        <EngagementAnalytics selectedPeriod={selectedPeriod} />
      </TabsContent>

      <TabsContent value="content" className="space-y-4">
        <ContentAnalytics
          creatorContent={creatorContent}
          selectedPeriod={selectedPeriod}
        />
      </TabsContent>
    </Tabs>
  )
}

/**
 * Revenue Analytics Component
 *
 * Revenue trends and breakdown visualization
 */
function RevenueAnalytics({ selectedPeriod }: { selectedPeriod: TimePeriod }) {
  // TODO: Fetch real revenue data from analytics contract
  // const revenueData = useRevenueAnalytics(userAddress, selectedPeriod)
  // const maxAmount = Math.max(...revenueData.map(d => d.amount))

  // Temporary mock data for development
  const revenueData = [
    { month: 'Jan', amount: 1250 },
    { month: 'Feb', amount: 1800 },
    { month: 'Mar', amount: 2200 },
    { month: 'Apr', amount: 1950 },
    { month: 'May', amount: 2800 },
    { month: 'Jun', amount: 3200 }
  ]

  const maxAmount = Math.max(...revenueData.map(d => d.amount))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Simple bar chart for mobile */}
          <div className="space-y-3">
            {revenueData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 text-xs text-muted-foreground">
                  {data.month}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-500"
                        style={{ width: `${(data.amount / maxAmount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right">
                      ${data.amount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Content Sales</span>
              <span className="text-sm font-medium">$2,450</span> {/* TODO: Fetch from contract */}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Subscriptions</span>
              <span className="text-sm font-medium">$1,800</span> {/* TODO: Fetch from contract */}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tips & Donations</span>
              <span className="text-sm font-medium">$350</span> {/* TODO: Fetch from contract */}
            </div>
            <Separator />
            <div className="flex justify-between items-center font-medium">
              <span>Total Revenue</span>
              <span>$4,600</span> {/* TODO: Calculate from contract data */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Audience Analytics Component
 *
 * Audience growth and demographics
 */
function AudienceAnalytics({ selectedPeriod }: { selectedPeriod: TimePeriod }) {
  // TODO: Fetch real audience data from analytics contract
  // const audienceData = useAudienceAnalytics(userAddress, selectedPeriod)
  // const topRegions = useGeographicAnalytics(userAddress, selectedPeriod)

  // Temporary mock data for development
  const audienceData = [
    { label: 'New Subscribers', value: 45, change: '+12%' },
    { label: 'Returning Users', value: 78, change: '+8%' },
    { label: 'Total Audience', value: 123, change: '+15%' }
  ]

  const topRegions = [
    { region: 'United States', percentage: 35 },
    { region: 'United Kingdom', percentage: 18 },
    { region: 'Germany', percentage: 12 },
    { region: 'Canada', percentage: 10 },
    { region: 'Australia', percentage: 8 }
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Audience Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {audienceData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.value}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.change}
                    </Badge>
                  </div>
                </div>
                <Progress value={(item.value / 150) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Top Regions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topRegions.map((region, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{region.region}</span>
                    <span className="text-sm text-muted-foreground">{region.percentage}%</span>
                  </div>
                  <Progress value={region.percentage} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Engagement Analytics Component
 *
 * User engagement and interaction metrics
 */
function EngagementAnalytics({ selectedPeriod }: { selectedPeriod: TimePeriod }) {
  // TODO: Fetch real engagement data from analytics contract
  // const engagementMetrics = useEngagementAnalytics(userAddress, selectedPeriod)

  // Temporary mock data for development
  const engagementMetrics = [
    { label: 'Average Session Duration', value: '4m 32s', change: '+12%' },
    { label: 'Content Completion Rate', value: '68%', change: '+5%' },
    { label: 'Social Shares', value: '156', change: '+22%' },
    { label: 'Comments & Interactions', value: '89', change: '+15%' }
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Engagement Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {engagementMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{metric.label}</div>
                  <div className="text-lg font-bold">{metric.value}</div>
                </div>
                <Badge variant="default" className="text-xs">
                  {metric.change}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* TODO: Fetch real top performing content from analytics */}
            {/* const topContent = useTopPerformingContent(userAddress, selectedPeriod) */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    Content Title {i} {/* TODO: Use real content title */}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    245 views • 89% completion {/* TODO: Use real analytics data */}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Top {i}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Content Analytics Component
 *
 * Content performance and analytics
 */
function ContentAnalytics({
  creatorContent,
  selectedPeriod
}: {
  creatorContent: ReturnType<typeof useCreatorContent>
  selectedPeriod: TimePeriod
}) {
  if (creatorContent.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {creatorContent.data?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Content</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">1.2K</div> {/* TODO: Fetch from analytics */}
                <div className="text-xs text-muted-foreground">Total Views</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Engagement</span>
                <span>68%</span> {/* TODO: Fetch from analytics */}
              </div>
              <Progress value={68} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* TODO: Fetch real content by category from analytics */}
            {/* const categoryData = useContentByCategoryAnalytics(userAddress, selectedPeriod) */}
            {[
              { category: 'Articles', count: 12, percentage: 40 },
              { category: 'Videos', count: 8, percentage: 27 },
              { category: 'Audio', count: 6, percentage: 20 },
              { category: 'Other', count: 4, percentage: 13 }
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.category}</span>
                  <span>{item.count} pieces</span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Insights Section Component
 *
 * AI-powered insights and recommendations
 */
function InsightsSection() {
  // TODO: Fetch real insights from analytics contract
  // const insights = useAnalyticsInsights(userAddress, selectedPeriod)

  // Temporary mock data for development
  const insights = [
    {
      type: 'positive',
      title: 'Revenue Growth',
      message: 'Your revenue has increased 25% this month. Keep creating high-quality content!',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      type: 'suggestion',
      title: 'Content Strategy',
      message: 'Videos perform 40% better than articles. Consider creating more video content.',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      type: 'opportunity',
      title: 'Audience Expansion',
      message: 'Your content resonates well in the US and UK. Consider targeting these regions.',
      icon: Globe,
      color: 'text-purple-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Insights & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <insight.icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", insight.color)} />
              <div className="min-w-0">
                <h4 className="font-medium text-sm">{insight.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Export Section Component
 *
 * Data export capabilities for detailed analysis
 */
function ExportSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            CSV Report
          </Button>
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            PDF Summary
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Export detailed analytics data for external analysis and reporting
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Error Fallback Component
 */
function DashboardAnalyticsErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Analytics Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading your analytics. Please try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={resetErrorBoundary} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/mini/dashboard'}
                className="flex-1"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Loading Skeleton Component
 */
function DashboardAnalyticsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * MiniApp Dashboard Analytics Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppDashboardAnalyticsPage() {
  return (
    <ErrorBoundary
      FallbackComponent={DashboardAnalyticsErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Dashboard Analytics error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<DashboardAnalyticsLoadingSkeleton />}>
        <MiniAppDashboardAnalyticsCore />
      </Suspense>
    </ErrorBoundary>
  )
}

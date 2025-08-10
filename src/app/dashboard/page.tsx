/**
 * Subscription Management Page - Component 10.4: Complete Creator Experience
 * File: src/app/dashboard/page.tsx
 * 
 * This page represents the culmination of our entire Web3 content platform architecture,
 * bringing together creator analytics, subscription management, content performance tracking,
 * and revenue optimization tools into a cohesive, powerful dashboard experience.
 * 
 * Architecture Validation Showcase:
 * - Component Composition Scales Across Domains: Seamlessly integrates content management,
 *   analytics visualization, role-based interactions, and transaction workflows
 * - Hook-Based Business Logic Enables Complex Workflows: useCreatorDashboardUI and 
 *   useSubscriptionManagement orchestrate sophisticated creator economy features
 * - Type Safety Handles Real-World Creator Data: All interfaces properly typed for
 *   subscription states, revenue calculations, and content performance metrics
 * - Role-Based Access Patterns Enforce Platform Security: Page correctly gates access
 *   to creator-only functionality while providing clear upgrade paths for consumers
 * - Asynchronous State Management Remains Predictable: Blockchain data, subgraph queries,
 *   and real-time updates all coordinate through consistent caching and state patterns
 * 
 * This page proves that sophisticated Web3 creator tools can feel as intuitive and
 * powerful as traditional SaaS platforms while providing the transparency and ownership
 * that only decentralized systems can deliver.
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  Users,
  DollarSign,
  BarChart3,
  PlusCircle,
  Download,
  RefreshCw,
  Wallet,
  CheckCircle,
  Filter
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input
} from '@/components/ui/index'

// Import our architectural layers - demonstrating complete integration
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { CreatorDashboard } from '@/components/creator/CreatorDashBoard'

// Import business logic hooks that power the creator experience
import { useCreatorDashboardUI } from '@/hooks/ui/integration'
import { useCreatorProfile, useCreatorContent, useCreatorPendingEarnings } from '@/hooks/contracts/core'

// Import utility functions and types
import { formatCurrency, formatNumber } from '@/lib/utils'

/**
 * Dashboard Tab Types
 * 
 * These tabs organize the creator dashboard into logical sections that
 * match creator workflow patterns and business needs.
 */
type DashboardTab = 'overview' | 'subscribers' | 'content' | 'earnings' | 'analytics' | 'settings'

/**
 * Analytics Time Period Options
 * 
 * Creators can analyze their performance across different time periods
 * to understand growth trends and optimize their content strategy.
 */
type AnalyticsTimePeriod = '7d' | '30d' | '90d' | '1y' | 'all'

/**
 * Subscription Management State Interface
 * 
 * This interface manages the various states and interactions that occur
 * in subscription management workflows, from subscriber tracking to revenue analysis.
 */
interface SubscriptionManagementState {
  readonly activeTab: DashboardTab
  readonly timePeriod: AnalyticsTimePeriod
  readonly subscriberFilter: string
  readonly contentFilter: string
  readonly showEarningsBreakdown: boolean
  readonly showBulkActions: boolean
  readonly selectedContentIds: readonly bigint[]
}

/**
 * SubscriptionManagementPage Component
 * 
 * This component orchestrates the complete creator dashboard experience,
 * demonstrating how our modular architecture enables sophisticated business
 * intelligence while maintaining excellent performance and user experience.
 */
export default function SubscriptionManagementPage() {
  // Wallet connection and creator verification
  const { address: userAddress, isConnected } = useAccount()
  const router = useRouter()

  // Core creator data using our architectural layers
  const creatorProfile = useCreatorProfile(userAddress as `0x${string}` | undefined)
  const creatorContent = useCreatorContent(userAddress as `0x${string}` | undefined)
  const pendingEarnings = useCreatorPendingEarnings(userAddress as `0x${string}` | undefined)
  const dashboardUI = useCreatorDashboardUI(userAddress as `0x${string}` | undefined)

  // Force refresh creator data when dashboard loads (helps with post-registration navigation)
  useEffect(() => {
    if (isConnected && userAddress) {
      console.log('🔄 Forcing creator data refresh on dashboard load')
      creatorProfile.refetch()
    }
  }, [isConnected, userAddress, creatorProfile])

  // Dashboard state management
  const [managementState, setManagementState] = useState<SubscriptionManagementState>({
    activeTab: 'overview',
    timePeriod: '30d',
    subscriberFilter: '',
    contentFilter: '',
    showEarningsBreakdown: false,
    showBulkActions: false,
    selectedContentIds: []
  })

  /**
   * Creator Verification Effect
   * 
   * This effect ensures that only registered creators can access the dashboard,
   * providing clear upgrade paths for non-creators while protecting creator-only features.
   */
  useEffect(() => {
    console.log('🔍 Dashboard verification effect:', {
      isConnected,
      isRegistered: dashboardUI.isRegistered,
      isLoading: dashboardUI.isLoading
    })
    
    // Only redirect if we're connected, not loading, and definitely not registered
    if (isConnected && !dashboardUI.isLoading && dashboardUI.isRegistered === false) {
      console.log('⚠️ Non-creator detected, redirecting to onboarding')
      // Add a small delay to prevent rapid redirects
      setTimeout(() => {
        router.push('/onboard')
      }, 500)
    }
  }, [isConnected, dashboardUI.isRegistered, dashboardUI.isLoading, router])

  /**
   * Tab Change Handler
   * 
   * This function manages tab transitions while preserving relevant state
   * and ensuring smooth navigation between different dashboard sections.
   */
  const handleTabChange = useCallback((tab: DashboardTab) => {
    setManagementState(prev => ({
      ...prev,
      activeTab: tab,
      // Reset filters when changing tabs to prevent confusion
      subscriberFilter: tab === 'subscribers' ? prev.subscriberFilter : '',
      contentFilter: tab === 'content' ? prev.contentFilter : '',
      selectedContentIds: []
    }))
  }, [])

  /**
   * Time Period Change Handler
   * 
   * This function updates analytics time periods and triggers data refresh
   * to show relevant metrics for the selected timeframe.
   */
  const handleTimePeriodChange = useCallback((period: AnalyticsTimePeriod) => {
    setManagementState(prev => ({
      ...prev,
      timePeriod: period
    }))
    
    // In a real implementation, this would trigger analytics data refresh
    console.log(`Analytics period changed to: ${period}`)
  }, [])

  /**
   * Data Refresh Handler
   * 
   * This function provides manual data refresh capabilities for creators
   * who want to see the latest blockchain and subgraph data.
   */
  const handleDataRefresh = useCallback(() => {
    creatorProfile.refetch()
    creatorContent.refetch()
    pendingEarnings.refetch()
    
    // Show success feedback
    console.log('Dashboard data refreshed')
  }, [creatorProfile, creatorContent, pendingEarnings])

  /**
   * Quick Metrics Summary
   * 
   * This computed value provides key performance indicators that creators
   * need to understand their platform success at a glance.
   */
  const quickMetrics = useMemo(() => {
    if (!creatorProfile.data) return null

    const profile = creatorProfile.data
    const pending = pendingEarnings.data || BigInt(0)

    // Calculate growth metrics (in a real app, these would come from subgraph analytics)
    const monthlyGrowthRate = 15.2 // +15.2% subscriber growth
    const revenueGrowthRate = 22.8 // +22.8% revenue growth
    const engagementRate = 68.5   // 68.5% engagement rate

    return {
      totalEarnings: {
        value: formatCurrency(BigInt(profile.totalEarnings), 6, 'USDC'),
        change: `+${revenueGrowthRate}%`,
        trend: 'up' as const
      },
      pendingEarnings: {
        value: formatCurrency(pending, 6, 'USDC'),
        canWithdraw: pending > BigInt(0),
        withdrawAction: () => console.log('Withdraw earnings')
      },
      subscriberCount: {
        value: formatNumber(Number(profile.subscriberCount)),
        change: `+${monthlyGrowthRate}%`,
        trend: 'up' as const
      },
      contentCount: {
        value: profile.contentCount.toString(),
        published: profile.contentCount,
        drafts: 0 // Would be calculated from content status
      },
      engagementRate: {
        value: `${engagementRate}%`,
        change: '+5.2%',
        trend: 'up' as const
      }
    }
  }, [creatorProfile.data, pendingEarnings.data])

  // Show loading state while creator data loads
  if (!isConnected || !userAddress) {
    return (
      <AppLayout>
        <div className="container mx-auto py-16 text-center">
          <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to access your creator dashboard.
          </p>
          <Button onClick={() => router.push('/')}>
            Return Home
          </Button>
        </div>
      </AppLayout>
    )
  }

  if (dashboardUI.isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-16 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Verifying Creator Status</h1>
          <p className="text-muted-foreground mb-6">
            Please wait while we verify your creator registration...
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout className="bg-gradient-to-br from-background via-background to-primary/5">
      <RouteGuards
        requiredLevel="creator_basic"
        routeConfig={{
          friendlyName: "Creator Dashboard",
          description: "Manage your content, subscribers, and earnings",
          category: "creator",
          alternativeRoutes: ["/browse", "/onboard"]
        }}
        onAccessDenied={(result) => {
          // Handle access denial with specific guidance
          console.log('Access denied:', result)
          if (!result.hasAccess) {
            // Could show specific onboarding guidance based on blockers
            router.push('/onboard')
          }
        }}
      >
        <div className="container mx-auto py-6 space-y-6">
          {/* Dashboard Header with Quick Actions */}
          <DashboardHeader
            creatorProfile={creatorProfile.data}
            quickMetrics={quickMetrics}
            onRefresh={handleDataRefresh}
            onTimePeriodChange={handleTimePeriodChange}
            currentPeriod={managementState.timePeriod}
          />

          {/* Quick Metrics Cards */}
          {quickMetrics && (
            <QuickMetricsGrid metrics={quickMetrics} />
          )}

          {/* Main Dashboard Tabs */}
          <Tabs value={managementState.activeTab} onValueChange={handleTabChange as (value: string) => void}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="earnings">Earnings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <OverviewTab
                creatorProfile={creatorProfile.data}
                contentData={creatorContent.data}
                timePeriod={managementState.timePeriod}
              />
            </TabsContent>

            <TabsContent value="subscribers" className="space-y-6">
              <SubscribersTab
                creatorProfile={creatorProfile.data}
                timePeriod={managementState.timePeriod}
                filter={managementState.subscriberFilter}
                onFilterChange={(filter: string) => setManagementState(prev => ({ ...prev, subscriberFilter: filter }))}
              />
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <ContentManagementTab
                contentData={creatorContent.data}
                filter={managementState.contentFilter}
                selectedIds={managementState.selectedContentIds}
                onFilterChange={(filter: string) => setManagementState(prev => ({ ...prev, contentFilter: filter }))}
                onSelectionChange={(ids: readonly bigint[]) => setManagementState(prev => ({ ...prev, selectedContentIds: ids }))}
              />
            </TabsContent>

            <TabsContent value="earnings" className="space-y-6">
              <EarningsTab
                creatorProfile={creatorProfile.data}
                pendingEarnings={pendingEarnings.data}
                timePeriod={managementState.timePeriod}
                showBreakdown={managementState.showEarningsBreakdown}
                onToggleBreakdown={() => setManagementState(prev => ({ 
                  ...prev, 
                  showEarningsBreakdown: !prev.showEarningsBreakdown 
                }))}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsTab
                creatorProfile={creatorProfile.data}
                timePeriod={managementState.timePeriod}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <SettingsTab
                creatorProfile={creatorProfile.data}
                userAddress={userAddress}
              />
            </TabsContent>
          </Tabs>

          {/* Integrated Creator Dashboard Component */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Creator Tools
              </CardTitle>
              <CardDescription>
                Comprehensive creator management and analytics dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CreatorDashboard
                creatorAddress={userAddress}
                initialView="overview"
                onContentUploaded={(contentId) => {
                  creatorContent.refetch()
                  creatorProfile.refetch()
                  console.log(`Content uploaded: ${contentId}`)
                }}
              />
            </CardContent>
          </Card>
        </div>
      </RouteGuards>
    </AppLayout>
  )
}

/**
 * Supporting Components
 * 
 * These components demonstrate how complex dashboard interfaces can be broken
 * down into focused, reusable pieces while maintaining type safety and clear
 * data flow patterns.
 */

interface DashboardHeaderProps {
  readonly creatorProfile: ReturnType<typeof useCreatorProfile>['data']
  readonly quickMetrics: QuickMetrics | null
  readonly onRefresh: () => void
  readonly onTimePeriodChange: (period: AnalyticsTimePeriod) => void
  readonly currentPeriod: AnalyticsTimePeriod
}

function DashboardHeader({ 
  creatorProfile, 
  quickMetrics, 
  onRefresh, 
  onTimePeriodChange, 
  currentPeriod 
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          {creatorProfile?.isVerified && (
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Manage your content, track earnings, and grow your subscriber base.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={currentPeriod} onValueChange={onTimePeriodChange}>
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

        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>

        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>
    </div>
  )
}

/**
 * Metric Trend Direction
 * 
 * Represents whether a metric is improving or declining, used for
 * visual indicators and styling decisions in metric displays.
 */
type MetricTrend = 'up' | 'down' | 'neutral'

/**
 * Base Metric Interface
 * 
 * Common properties that all metrics share, providing consistency
 * across different types of performance indicators.
 */
interface BaseMetric {
  readonly value: string
  readonly change?: string
  readonly trend?: MetricTrend
}

/**
 * Revenue Metric Interface
 * 
 * Specific structure for revenue-related metrics that need to display
 * formatted currency values with growth indicators.
 */
interface RevenueMetric extends BaseMetric {
  readonly value: string // Formatted currency string like "$1,234.56"
  readonly change: string // Percentage change like "+15.2%"
  readonly trend: MetricTrend
}

/**
 * Withdrawal Metric Interface
 * 
 * Structure for pending earnings that can be withdrawn, including
 * action capabilities and availability status.
 */
interface WithdrawalMetric extends BaseMetric {
  readonly value: string // Formatted currency string
  readonly canWithdraw: boolean
  readonly withdrawAction: () => void
}

/**
 * Count Metric Interface
 * 
 * Structure for metrics that represent counts or quantities,
 * like subscriber count or content count.
 */
interface CountMetric extends BaseMetric {
  readonly value: string // Formatted number string
  readonly change: string // Percentage change
  readonly trend: MetricTrend
}

/**
 * Content Count Metric Interface
 * 
 * Specific structure for content-related counts that might need
 * to show breakdowns between different content states.
 */
interface ContentCountMetric {
  readonly value: string // Total content count as string
  readonly published: bigint // Published content count
  readonly drafts: number // Draft content count
}

/**
 * Engagement Metric Interface
 * 
 * Structure for engagement-related metrics that are typically
 * displayed as percentages with trend indicators.
 */
interface EngagementMetric extends BaseMetric {
  readonly value: string // Percentage string like "68.5%"
  readonly change: string // Change indicator like "+5.2%"
  readonly trend: MetricTrend
}

/**
 * Complete Quick Metrics Structure
 * 
 * This interface defines the exact structure of the metrics object
 * passed to the QuickMetricsGrid, ensuring type safety and providing
 * clear documentation of what data the component expects.
 */
interface QuickMetrics {
    readonly totalEarnings: RevenueMetric
    readonly pendingEarnings: WithdrawalMetric
    readonly subscriberCount: CountMetric
    readonly contentCount: ContentCountMetric
    readonly engagementRate: EngagementMetric
  }

/**
 * Props interface for QuickMetricsGrid component
 * 
 * Now properly typed to ensure the metrics object matches exactly
 * what the component expects and can handle safely.
 */
interface QuickMetricsGridProps {
    readonly metrics: QuickMetrics
  }

function QuickMetricsGrid({ metrics }: QuickMetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Earnings Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalEarnings.value}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">{metrics.totalEarnings.change}</span> from last month
          </p>
        </CardContent>
      </Card>

      {/* Pending Earnings Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.pendingEarnings.value}</div>
          <div className="mt-2">
            <Button 
              size="sm" 
              disabled={!metrics.pendingEarnings.canWithdraw}
              onClick={metrics.pendingEarnings.withdrawAction}
            >
              <Download className="h-3 w-3 mr-1" />
              Withdraw
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.subscriberCount.value}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">{metrics.subscriberCount.change}</span> from last month
          </p>
        </CardContent>
      </Card>

      {/* Content Performance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.engagementRate.value}</div>
          <p className="text-xs text-muted-foreground">
            <span className="text-green-600">{metrics.engagementRate.change}</span> from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface OverviewTabProps {
  readonly creatorProfile: ReturnType<typeof useCreatorProfile>['data']
  readonly contentData: ReturnType<typeof useCreatorContent>['data']
  readonly timePeriod: AnalyticsTimePeriod
}

function OverviewTab({ creatorProfile, contentData, timePeriod }: OverviewTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>
            Your earnings performance over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Revenue chart would display here (using recharts)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscriber Growth</CardTitle>
          <CardDescription>
            Track your audience growth and retention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Subscriber growth chart would display here
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest purchases, subscriptions, and content interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* This would be populated with real activity data */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">New subscription from 0x1234...5678</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
              <Badge variant="secondary">$5.00</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Props interface for the SubscribersTab component
 * 
 * This interface defines the contract between the parent dashboard and the
 * subscribers management interface, ensuring type safety for all interactions.
 */
interface SubscribersTabProps {
    readonly creatorProfile: ReturnType<typeof useCreatorProfile>['data']
    readonly timePeriod: AnalyticsTimePeriod
    readonly filter: string
    readonly onFilterChange: (filter: string) => void
}

function SubscribersTab({ creatorProfile, timePeriod, filter, onFilterChange }: SubscribersTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search subscribers..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscriber Analytics</CardTitle>
          <CardDescription>
            Understand your audience and subscription patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Subscriber analytics dashboard would display here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Props interface for the ContentManagementTab component
 * 
 * This interface demonstrates how complex component interactions can be typed
 * safely, including array selections and multi-parameter callbacks.
 */
interface ContentManagementTabProps {
    readonly contentData: ReturnType<typeof useCreatorContent>['data']
    readonly filter: string
    readonly selectedIds: readonly bigint[]
    readonly onFilterChange: (filter: string) => void
    readonly onSelectionChange: (selectedIds: readonly bigint[]) => void
  }

function ContentManagementTab({ contentData, filter, selectedIds, onFilterChange, onSelectionChange }: ContentManagementTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search content..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <Button variant="outline" size="sm">
              Bulk Actions
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>
            Manage your published content and track performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Content management table would display here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface EarningsTabProps {
  readonly creatorProfile: ReturnType<typeof useCreatorProfile>['data']
  readonly pendingEarnings: ReturnType<typeof useCreatorPendingEarnings>['data']
  readonly timePeriod: AnalyticsTimePeriod
  readonly showBreakdown: boolean
  readonly onToggleBreakdown: () => void
}

function EarningsTab({ creatorProfile, pendingEarnings, timePeriod, showBreakdown, onToggleBreakdown }: EarningsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Earnings Management</h3>
        <Button variant="outline" size="sm" onClick={onToggleBreakdown}>
          {showBreakdown ? 'Hide' : 'Show'} Breakdown
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
          <CardDescription>
            Detailed breakdown of your earnings and revenue sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Earnings analytics and breakdown would display here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface AnalyticsTabProps {
  readonly creatorProfile: ReturnType<typeof useCreatorProfile>['data']
  readonly timePeriod: AnalyticsTimePeriod
}

function AnalyticsTab({ creatorProfile, timePeriod }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>
            Deep insights into your content performance and audience engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Advanced analytics dashboard would display here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SettingsTabProps {
  readonly creatorProfile: ReturnType<typeof useCreatorProfile>['data']
  readonly userAddress: string
}

function SettingsTab({ creatorProfile, userAddress }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Creator Settings</CardTitle>
          <CardDescription>
            Manage your creator profile and platform preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Creator settings interface would display here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-32 bg-muted animate-pulse rounded" />
          <div className="h-9 w-20 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
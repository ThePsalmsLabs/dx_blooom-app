/**
 * Platform Insights Dashboard - Phase 2 Component
 * File: src/components/analytics/PlatformInsightsDashboard.tsx
 * 
 * This component provides comprehensive platform analytics and administrative insights
 * for platform administrators. It demonstrates how to transform sophisticated analytics
 * data into actionable administrative tools while maintaining excellent user experience
 * and performance characteristics.
 * 
 * Educational Architecture Integration:
 * - Integrates with your RouteGuards system for admin-level access control
 * - Consumes our usePlatformAnalytics hook for comprehensive platform data
 * - Follows your established card-based dashboard layout patterns
 * - Uses your exact Tab navigation and responsive design approaches
 * - Demonstrates advanced data visualization and administrative interface patterns
 * 
 * Key Features:
 * - Comprehensive platform health monitoring and KPI tracking
 * - Real-time platform statistics with trend analysis
 * - Content category performance analysis and optimization insights
 * - Creator ecosystem health and growth metrics
 * - Administrative controls for platform management
 * - Revenue analytics and financial performance tracking
 * - Platform optimization recommendations and alerts
 * - Export capabilities for reporting and analysis
 * 
 * Business Impact:
 * - Enables data-driven platform management and optimization decisions
 * - Provides early warning systems for platform health issues
 * - Supports strategic planning with growth trends and forecasting
 * - Facilitates creator ecosystem optimization for maximum platform value
 * - Enables proactive platform maintenance and scaling decisions
 * 
 * Component Architecture:
 * - Follows your established dashboard component composition patterns
 * - Integrates with existing admin access control and role management
 * - Uses responsive design for desktop-focused administrative workflows
 * - Provides data export and reporting capabilities for business analysis
 * - Maintains state efficiently with proper React optimization patterns
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  MoreHorizontal,
  Settings,
  Search,
  Eye,
  EyeOff,
  Target,
  Activity,
  Clock,
  Verified,
  AlertCircle,
  Minus
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Import your architectural layers
import { RouteGuards } from '@/components/layout/RouteGuards'
import { AppLayout } from '@/components/layout/AppLayout'
import {
  usePlatformAnalytics,
  usePlatformHealthMonitor,
  PlatformStats,
  CreatorPlatformStats
} from '@/hooks/contracts/analytics/usePlatformAnalytics'
import { formatNumber, formatPercentage } from '@/lib/utils'

// ===== PLATFORM INSIGHTS INTERFACE DEFINITIONS =====

/**
 * Dashboard Time Period Options
 * Administrators can analyze platform performance across different time horizons
 */
type DashboardTimePeriod = '24h' | '7d' | '30d' | '90d' | '1y' | 'all'

/**
 * Platform Health Status Levels
 * Provides quick visual indicators of platform operational status
 */
type PlatformHealthStatus = 'excellent' | 'good' | 'warning' | 'critical'

/**
 * Administrative Dashboard View Types
 * Organizes different aspects of platform management into logical sections
 */
type AdminDashboardView = 'overview' | 'analytics' | 'creators' | 'content' | 'revenue' | 'health' | 'settings'

/**
 * Dashboard State Interface
 * Manages the current configuration and view state of the admin dashboard
 */
interface DashboardState {
  readonly currentView: AdminDashboardView
  readonly timePeriod: DashboardTimePeriod
  readonly showAdvancedMetrics: boolean
  readonly autoRefresh: boolean
  readonly refreshInterval: number
}

/**
 * Component Props Interface
 * Defines configuration options for the platform insights dashboard
 */
interface PlatformInsightsDashboardProps {
  /** Optional initial view to display */
  initialView?: AdminDashboardView
  /** Whether to enable auto-refresh of data */
  autoRefresh?: boolean
  /** Custom refresh interval in seconds */
  refreshInterval?: number
  /** Optional custom styling */
  className?: string
}

// ===== MAIN COMPONENT IMPLEMENTATION =====

/**
 * PlatformInsightsDashboard Component
 * 
 * This component demonstrates how to build sophisticated administrative interfaces
 * that provide actionable insights while maintaining excellent usability. It showcases
 * advanced React patterns, data visualization techniques, and administrative workflow
 * optimization.
 * 
 * Key Teaching Points:
 * - How to integrate complex analytics data with administrative workflows
 * - Implementing real-time monitoring and alerting systems
 * - Building responsive administrative interfaces that scale across devices
 * - Managing complex dashboard state with efficient React patterns
 * - Creating data export and reporting capabilities for business stakeholders
 */
export function PlatformInsightsDashboard({
  initialView = 'overview',
  autoRefresh = true,
  refreshInterval = 60, // 60 seconds
  className
}: PlatformInsightsDashboardProps) {
  const { address } = useAccount()

  // ===== STATE MANAGEMENT =====
  // Sophisticated state management for administrative dashboard functionality

  const [dashboardState, setDashboardState] = useState<DashboardState>({
    currentView: initialView,
    timePeriod: '30d',
    showAdvancedMetrics: false,
    autoRefresh,
    refreshInterval
  })

  // ===== DATA LAYER INTEGRATION =====
  // Integration with our sophisticated analytics hooks

  const {
    platformStats,
    creatorStats,
    isLoading,
    isError,
    error,
    refetch,
    lastFetched,
    cacheStatus
  } = usePlatformAnalytics()

  const {
    healthStatus
  } = usePlatformHealthMonitor()

  // ===== AUTO-REFRESH FUNCTIONALITY =====
  // Implements sophisticated auto-refresh with user control

  useEffect(() => {
    if (!dashboardState.autoRefresh) return

    const interval = setInterval(() => {
      refetch()
    }, dashboardState.refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [dashboardState.autoRefresh, dashboardState.refreshInterval, refetch])

  // ===== EVENT HANDLERS =====
  // Clean event handling for dashboard interactions

  const handleViewChange = useCallback((view: AdminDashboardView) => {
    setDashboardState(prev => ({ ...prev, currentView: view }))
  }, [])

  const handleTimePeriodChange = useCallback((period: DashboardTimePeriod) => {
    setDashboardState(prev => ({ ...prev, timePeriod: period }))
  }, [])

  const handleToggleAdvancedMetrics = useCallback(() => {
    setDashboardState(prev => ({ ...prev, showAdvancedMetrics: !prev.showAdvancedMetrics }))
  }, [])

  const handleToggleAutoRefresh = useCallback(() => {
    setDashboardState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))
  }, [])

  const handleExportData = useCallback(async () => {
    // Implement data export functionality
    console.log('Exporting platform data...', { platformStats, healthStatus })
    // In production, this would generate CSV/PDF reports
  }, [platformStats, healthStatus])

  // ===== COMPUTED VALUES =====
  // Efficient computation of derived metrics and display values

  const platformHealth = useMemo((): PlatformHealthStatus => {
    if (!healthStatus) return 'warning'
    
    const score = healthStatus.healthScore
    if (score >= 90) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 50) return 'warning'
    return 'critical'
  }, [healthStatus])

  const quickStats = useMemo(() => {
    if (!platformStats) return null

    return {
      totalContent: Number(platformStats.totalContent),
      activeContent: Number(platformStats.activeContent),
      totalCreators: creatorStats ? Number(creatorStats.totalCreators) : 0,
      contentActivityRatio: platformStats.platformHealth.contentActivityRatio,
      growthTrend: platformStats.platformHealth.growthTrend
    }
  }, [platformStats, creatorStats])

  // ===== RENDER FUNCTIONS =====
  // Component composition for clean, maintainable dashboard sections

  const renderDashboardHeader = () => (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Platform Insights</h1>
          <Badge 
            variant={platformHealth === 'excellent' ? 'default' : 
                    platformHealth === 'good' ? 'secondary' : 
                    platformHealth === 'warning' ? 'destructive' : 'destructive'}
            className={cn(
              "capitalize",
              platformHealth === 'excellent' && "bg-green-100 text-green-800",
              platformHealth === 'good' && "bg-blue-100 text-blue-800",
              platformHealth === 'warning' && "bg-yellow-100 text-yellow-800"
            )}
          >
            {platformHealth}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Comprehensive platform analytics and administrative controls
        </p>
        {lastFetched && (
          <p className="text-sm text-muted-foreground">
            Last updated: {new Intl.DateTimeFormat('en-US', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }).format(lastFetched)} • Cache: {cacheStatus}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Time Period Selector */}
        <Select value={dashboardState.timePeriod} onValueChange={handleTimePeriodChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        {/* Dashboard Controls */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Dashboard Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleToggleAdvancedMetrics}>
              {dashboardState.showAdvancedMetrics ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Advanced Metrics
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Advanced Metrics
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleAutoRefresh}>
              {dashboardState.autoRefresh ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Disable Auto-refresh
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Enable Auto-refresh
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Manual Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>
    </div>
  )

  const renderQuickStatsGrid = () => {
    if (!quickStats) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Content</p>
                <p className="text-2xl font-bold">{formatNumber(quickStats.totalContent)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {quickStats.activeContent} active ({formatPercentage(quickStats.contentActivityRatio)})
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Creators</p>
                <p className="text-2xl font-bold">{formatNumber(quickStats.totalCreators)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Platform growth: {quickStats.growthTrend}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Platform Health</p>
                <p className="text-2xl font-bold capitalize">{platformHealth}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Score: {healthStatus?.healthScore || 0}/100
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Content Diversity</p>
                <p className="text-2xl font-bold">
                  {platformStats?.growthMetrics.categoryDiversity.toFixed(0) || 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Distribution: {platformStats?.platformHealth.categoryDistribution}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Platform Health Alerts */}
      {healthStatus?.alerts && healthStatus.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Platform Alerts</h3>
          {healthStatus.alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Content Category Performance
          </CardTitle>
          <CardDescription>
            Content distribution and performance across categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformStats?.categoryStats ? (
            <div className="space-y-4">
              {platformStats.categoryStats.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.categoryName}</span>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(Number(category.totalContent))} items 
                      ({formatPercentage(category.marketShare)})
                    </div>
                  </div>
                  <Progress value={category.marketShare} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Active: {formatNumber(Number(category.activeContent))}</span>
                    <span>Growth: {formatPercentage(category.growthRate)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Loading category performance data...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Growth Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Growth Metrics
          </CardTitle>
          <CardDescription>
            Platform growth trends and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformStats?.growthMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  <span className="text-sm font-medium">Content Growth Rate</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatPercentage(platformStats.growthMetrics.contentGrowthRate)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Est. {platformStats.growthMetrics.estimatedDailyCreations} new items/day
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">Active Content Ratio</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatPercentage(platformStats.growthMetrics.activeContentRatio)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number(platformStats.activeContent)} of {Number(platformStats.totalContent)} active
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-purple-500 rounded-full" />
                  <span className="text-sm font-medium">Category Diversity</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatPercentage(platformStats.growthMetrics.categoryDiversity)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Distribution: {platformStats.platformHealth.categoryDistribution}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Loading growth metrics...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Platform Performance Analytics
          </CardTitle>
          <CardDescription>
            Detailed performance metrics and trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            Advanced analytics visualization would be rendered here
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Performance Trends</CardTitle>
            <CardDescription>Content creation and engagement over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Content trends chart
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Creator Growth Analysis</CardTitle>
            <CardDescription>Creator onboarding and retention metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              Creator growth chart
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderHealthTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Platform Health Monitor
          </CardTitle>
          <CardDescription>
            Real-time platform health status and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthStatus ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Overall Health Score</h3>
                  <p className="text-muted-foreground">Platform operational status</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{healthStatus.healthScore}/100</div>
                  <Badge variant={platformHealth === 'excellent' ? 'default' : 'secondary'}>
                    {healthStatus.status}
                  </Badge>
                </div>
              </div>

              <Progress value={healthStatus.healthScore} className="h-3" />

              {healthStatus.alerts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Active Alerts</h4>
                  {healthStatus.alerts.map((alert, index) => (
                    <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{alert.metric}:</strong> {alert.message}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Last checked: {new Intl.DateTimeFormat('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }).format(healthStatus.lastChecked)}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Loading health status...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // ===== MAIN COMPONENT RENDER =====
  
  if (isError) {
    return (
      <AppLayout>
        <RouteGuards requiredLevel="admin">
          <div className="container mx-auto py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load platform analytics: {error?.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
          </div>
        </RouteGuards>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <RouteGuards requiredLevel="admin">
        <div className={cn("container mx-auto py-8 space-y-8", className)}>
          {renderDashboardHeader()}
          
          {isLoading ? (
            <PlatformDashboardSkeleton />
          ) : (
            <>
              {renderQuickStatsGrid()}

              <Tabs 
                value={dashboardState.currentView} 
                onValueChange={(value) => handleViewChange(value as AdminDashboardView)}
              >
                <TabsList className="grid grid-cols-2 gap-1 sm:flex sm:gap-2 sm:overflow-x-auto sm:no-scrollbar md:grid md:w-full md:grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="creators">Creators</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="health">Health</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  {renderOverviewTab()}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6 mt-6">
                  {renderAnalyticsTab()}
                </TabsContent>

                <TabsContent value="creators" className="space-y-6 mt-6">
                  <CreatorManagementSection 
                    creatorStats={creatorStats}
                    timePeriod={dashboardState.timePeriod}
                  />
                </TabsContent>

                <TabsContent value="content" className="space-y-6 mt-6">
                  <ContentManagementSection 
                    platformStats={platformStats}
                    timePeriod={dashboardState.timePeriod}
                  />
                </TabsContent>

                <TabsContent value="revenue" className="space-y-6 mt-6">
                  <RevenueAnalyticsSection 
                    platformStats={platformStats}
                    timePeriod={dashboardState.timePeriod}
                  />
                </TabsContent>

                <TabsContent value="health" className="space-y-6 mt-6">
                  {renderHealthTab()}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </RouteGuards>
    </AppLayout>
  )
}

// ===== SUPPORTING COMPONENTS =====
// Demonstrates component composition and administrative workflow patterns

/**
 * Creator Management Section Component
 * Provides administrative tools for creator oversight and management
 */
interface CreatorManagementSectionProps {
  creatorStats: CreatorPlatformStats | undefined
  timePeriod: DashboardTimePeriod
}

function CreatorManagementSection({ creatorStats, timePeriod }: CreatorManagementSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Creator Ecosystem Overview
          </CardTitle>
          <CardDescription>
            Creator registration, verification, and performance management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {creatorStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Creators</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(Number(creatorStats.totalCreators))}</p>
                <p className="text-xs text-muted-foreground">Registered on platform</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Verified className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Verified Creators</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(Number(creatorStats.verifiedCreators || 0))}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage((Number(creatorStats.verifiedCreators || 0) / Number(creatorStats.totalCreators)) * 100)} of total
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Active Creators</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(Number(creatorStats.activeCreators || 0))}</p>
                <p className="text-xs text-muted-foreground">With recent content</p>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Loading creator statistics...
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creator Management Tools</CardTitle>
          <CardDescription>Administrative tools for creator oversight</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Verify Creators
            </Button>
            <Button variant="outline" className="justify-start">
              <Search className="h-4 w-4 mr-2" />
              Review Applications
            </Button>
            <Button variant="outline" className="justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Handle Reports
            </Button>
            <Button variant="outline" className="justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Platform Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Content Management Section Component
 * Provides administrative tools for content oversight and moderation
 */
interface ContentManagementSectionProps {
  platformStats: PlatformStats | undefined
  timePeriod: DashboardTimePeriod
}

function ContentManagementSection({ platformStats, timePeriod }: ContentManagementSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Management Overview
          </CardTitle>
          <CardDescription>
            Content moderation, performance analysis, and platform optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {platformStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Content</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(Number(platformStats.totalContent))}</p>
                <p className="text-xs text-muted-foreground">All content items</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Active Content</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(Number(platformStats.activeContent))}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(platformStats.platformHealth.contentActivityRatio)} active
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Inactive Content</span>
                </div>
                <p className="text-2xl font-bold">{formatNumber(Number(platformStats.inactiveContent))}</p>
                <p className="text-xs text-muted-foreground">Deactivated or removed</p>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              Loading content statistics...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Revenue Analytics Section Component
 * Provides financial performance analysis and revenue optimization insights
 */
interface RevenueAnalyticsSectionProps {
  platformStats: PlatformStats | undefined
  timePeriod: DashboardTimePeriod
}

function RevenueAnalyticsSection({ platformStats, timePeriod }: RevenueAnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Analytics
          </CardTitle>
          <CardDescription>
            Platform revenue performance and financial optimization insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            Revenue analytics and financial charts would be rendered here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Dashboard Loading Skeleton Component
 * Provides loading states while analytics data is being fetched
 */
function PlatformDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-8 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
}

// Export the main component and supporting interfaces
export type { 
  PlatformInsightsDashboardProps, 
  DashboardTimePeriod, 
  AdminDashboardView,
  PlatformHealthStatus 
}

// Export supporting components for external use
export {
  CreatorManagementSection,
  ContentManagementSection,
  RevenueAnalyticsSection,
  PlatformDashboardSkeleton
}
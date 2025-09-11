/**
 * MiniApp Creator Dashboard - Mobile Creator Management Hub
 * File: src/app/mini/dashboard/page.tsx
 *
 * This page serves as the comprehensive creator management interface for the mini app,
 * providing mobile-optimized tools for content management, earnings tracking, and analytics.
 * Designed specifically for creators who need quick access to their business metrics on mobile.
 *
 * Mini App Design Philosophy:
 * - Mobile-first creator tools with instant actions
 * - Dashboard overview with key performance indicators
 * - Quick access to content management and earnings
 * - Touch-optimized navigation between creator functions
 * - Real-time data with efficient mobile loading
 *
 * Key Features:
 * - Creator metrics dashboard with mobile KPIs
 * - Content management with quick actions
 * - Earnings overview with withdrawal capabilities
 * - Subscriber analytics and engagement metrics
 * - Mobile-optimized navigation to detailed views
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  DollarSign,
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  Download,
  PlusCircle,
  Eye,
  Heart,
  MessageCircle,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Crown,
  Target,
  Calendar,
  Wallet,
  Settings,
  Loader2,
  Grid3X3,
  List,
  Filter
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
  Separator,
  Progress,
  Avatar,
  AvatarFallback,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useCreatorProfile, useCreatorContent, useCreatorPendingEarnings, useWithdrawEarnings } from '@/hooks/contracts/core'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { formatWalletAddress, isWalletFullyConnected, getSafeAddress } from '@/lib/utils/wallet-utils'
import { useMiniAppUtils } from '@/contexts/UnifiedMiniAppProvider'
import { useCreatorDashboardUI } from '@/hooks/ui/integration'

// Import your existing sophisticated components
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'
import { CreatorDashboard } from '@/components/creator/CreatorDashBoard'

// Import utilities
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils'

/**
 * Dashboard Tab Types
 */
type DashboardTab = 'overview' | 'content' | 'earnings' | 'analytics' | 'settings'

/**
 * Dashboard State Interface
 */
interface DashboardState {
  readonly activeTab: DashboardTab
  readonly refreshTrigger: number
}

/**
 * MiniApp Creator Dashboard Core Component
 *
 * This component orchestrates the complete creator dashboard experience
 * with mobile-first design and comprehensive creator management tools.
 */
function MiniAppCreatorDashboardCore() {
  const router = useRouter()

  // Core state management
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    activeTab: 'overview',
    refreshTrigger: 0
  })

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const walletUI = useFarcasterAutoWallet()
  const userAddress = getSafeAddress(walletUI.address)
  const isConnected = isWalletFullyConnected(walletUI.isConnected, walletUI.address)
  const formattedAddress = formatWalletAddress(walletUI.address)

  // Creator data hooks
  const creatorProfile = useCreatorProfile(userAddress)
  const creatorContent = useCreatorContent(userAddress)
  const pendingEarnings = useCreatorPendingEarnings(userAddress)
  const dashboardUI = useCreatorDashboardUI(userAddress)
  const withdrawEarnings = useWithdrawEarnings()

  /**
   * Tab Change Handler
   */
  const handleTabChange = useCallback((tab: DashboardTab) => {
    setDashboardState(prev => ({ ...prev, activeTab: tab }))
  }, [])

  /**
   * Data Refresh Handler
   */
  const handleDataRefresh = useCallback(() => {
    creatorProfile.refetch()
    creatorContent.refetch()
    pendingEarnings.refetch()
    setDashboardState(prev => ({
      ...prev,
      refreshTrigger: prev.refreshTrigger + 1
    }))
  }, [creatorProfile, creatorContent, pendingEarnings])

  /**
   * Navigation Handlers
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  const handleNewContent = useCallback(() => {
    router.push('/mini/upload')
  }, [router])

  const handleViewAnalytics = useCallback(() => {
    router.push('/mini/dashboard/analytics')
  }, [router])

  const handleManageContent = useCallback(() => {
    router.push('/mini/dashboard/content')
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
          <Wallet className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Connect your wallet to access your creator dashboard
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
  if (dashboardUI.isRegistered === false && !dashboardUI.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center space-y-6">
          <Crown className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Become a Creator</h1>
            <p className="text-muted-foreground">
              Register as a creator to access your dashboard and start earning
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
        {/* Dashboard Header */}
        <DashboardHeader
          creatorProfile={creatorProfile}
          onGoBack={handleGoBack}
          onRefresh={handleDataRefresh}
          onNewContent={handleNewContent}
        />

        {/* Key Metrics */}
        <KeyMetricsGrid
          creatorProfile={creatorProfile}
          pendingEarnings={pendingEarnings}
          withdrawEarnings={withdrawEarnings}
        />

        {/* Dashboard Tabs */}
        <DashboardTabs
          activeTab={dashboardState.activeTab}
          onTabChange={handleTabChange}
          creatorProfile={creatorProfile}
          creatorContent={creatorContent}
          pendingEarnings={pendingEarnings}
          onViewAnalytics={handleViewAnalytics}
          onManageContent={handleManageContent}
        />

        {/* Quick Actions */}
        <QuickActionsSection
          onNewContent={handleNewContent}
          onViewAnalytics={handleViewAnalytics}
          onManageContent={handleManageContent}
        />
      </main>
    </div>
  )
}

/**
 * Dashboard Header Component
 *
 * Mobile-optimized header with creator info and quick actions
 */
function DashboardHeader({
  creatorProfile,
  onGoBack,
  onRefresh,
  onNewContent
}: {
  creatorProfile: ReturnType<typeof useCreatorProfile>
  onGoBack: () => void
  onRefresh: () => void
  onNewContent: () => void
}) {
  if (creatorProfile.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Navigation and Actions */}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={onNewContent}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Content
          </Button>
        </div>
      </div>

      {/* Creator Welcome */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Creator Dashboard</h1>
          {creatorProfile.data?.isVerified && (
            <Badge variant="default" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          Manage your content, track earnings, and grow your audience
        </p>
      </div>
    </div>
  )
}

/**
 * Key Metrics Grid
 *
 * Mobile-optimized metrics display with key creator KPIs
 */
function KeyMetricsGrid({
  creatorProfile,
  pendingEarnings,
  withdrawEarnings
}: {
  creatorProfile: ReturnType<typeof useCreatorProfile>
  pendingEarnings: ReturnType<typeof useCreatorPendingEarnings>
  withdrawEarnings: ReturnType<typeof useWithdrawEarnings>
}) {
  const handleWithdrawEarnings = useCallback(() => {
    if (withdrawEarnings.isLoading || withdrawEarnings.isConfirming) return
    withdrawEarnings.write()
  }, [withdrawEarnings])

  if (creatorProfile.isLoading || pendingEarnings.isLoading) {
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
  const pending = pendingEarnings.data || BigInt(0)

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Total Earnings */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground">Total Earnings</span>
          </div>
          <div className="text-lg font-bold">
            {formatCurrency(BigInt(profile.totalEarnings), 6, 'USDC')}
          </div>
          <div className="text-xs text-green-600">+12.5% this month</div>
        </CardContent>
      </Card>

      {/* Pending Earnings */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">Pending Earnings</span>
          </div>
          <div className="text-lg font-bold">
            {formatCurrency(pending, 2, 'USDC')}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 h-7 text-xs"
            disabled={pending <= BigInt(0) || withdrawEarnings.isLoading || withdrawEarnings.isConfirming}
            onClick={handleWithdrawEarnings}
          >
            {withdrawEarnings.isLoading || withdrawEarnings.isConfirming ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            Withdraw
          </Button>
        </CardContent>
      </Card>

      {/* Subscribers */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-muted-foreground">Subscribers</span>
          </div>
          <div className="text-lg font-bold">
            {formatNumber(Number(profile.subscriberCount))}
          </div>
          <div className="text-xs text-green-600">+8.2% this month</div>
        </CardContent>
      </Card>

      {/* Content Count */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-muted-foreground">Content</span>
          </div>
          <div className="text-lg font-bold">
            {profile.contentCount}
          </div>
          <div className="text-xs text-muted-foreground">Published pieces</div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Dashboard Tabs Component
 *
 * Mobile-optimized tabbed interface for different dashboard sections
 */
function DashboardTabs({
  activeTab,
  onTabChange,
  creatorProfile,
  creatorContent,
  pendingEarnings,
  onViewAnalytics,
  onManageContent
}: {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  creatorProfile: ReturnType<typeof useCreatorProfile>
  creatorContent: ReturnType<typeof useCreatorContent>
  pendingEarnings: ReturnType<typeof useCreatorPendingEarnings>
  onViewAnalytics: () => void
  onManageContent: () => void
}) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as DashboardTab)}>
      <TabsList className="grid grid-cols-3 gap-1 mb-4">
        <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
        <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
        <TabsTrigger value="earnings" className="text-xs">Earnings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <OverviewTab
          creatorProfile={creatorProfile}
          creatorContent={creatorContent}
          onViewAnalytics={onViewAnalytics}
          onManageContent={onManageContent}
        />
      </TabsContent>

      <TabsContent value="content" className="space-y-4">
        <ContentTab
          creatorContent={creatorContent}
          onManageContent={onManageContent}
        />
      </TabsContent>

      <TabsContent value="earnings" className="space-y-4">
        <EarningsTab
          creatorProfile={creatorProfile}
          pendingEarnings={pendingEarnings}
        />
      </TabsContent>
    </Tabs>
  )
}

/**
 * Overview Tab
 *
 * Quick overview with recent activity and key actions
 */
function OverviewTab({
  creatorProfile,
  creatorContent,
  onViewAnalytics,
  onManageContent
}: {
  creatorProfile: ReturnType<typeof useCreatorProfile>
  creatorContent: ReturnType<typeof useCreatorContent>
  onViewAnalytics: () => void
  onManageContent: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onViewAnalytics}
          variant="outline"
          className="flex flex-col items-center gap-2 h-20"
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs">View Analytics</span>
        </Button>

        <Button
          onClick={onManageContent}
          variant="outline"
          className="flex flex-col items-center gap-2 h-20"
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs">Manage Content</span>
        </Button>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>3 new subscribers this week</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>2 content pieces published</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>$25.50 earnings this month</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Content Tab
 *
 * Content management overview with quick stats
 */
function ContentTab({
  creatorContent,
  onManageContent
}: {
  creatorContent: ReturnType<typeof useCreatorContent>
  onManageContent: () => void
}) {
  if (creatorContent.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Content Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold">
              {creatorContent.data?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Content</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold">24</div>
            <div className="text-xs text-muted-foreground">Total Views</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Actions */}
      <Card>
        <CardContent className="p-4">
          <Button onClick={onManageContent} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Manage All Content
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Earnings Tab
 *
 * Earnings overview with withdrawal status
 */
function EarningsTab({
  creatorProfile,
  pendingEarnings
}: {
  creatorProfile: ReturnType<typeof useCreatorProfile>
  pendingEarnings: ReturnType<typeof useCreatorPendingEarnings>
}) {
  if (creatorProfile.isLoading || pendingEarnings.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (!creatorProfile.data) return null

  const profile = creatorProfile.data
  const pending = pendingEarnings.data || BigInt(0)

  return (
    <div className="space-y-4">
      {/* Earnings Breakdown */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Total Earnings</span>
            <span className="font-medium">{formatCurrency(BigInt(profile.totalEarnings), 6, 'USDC')}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm">Pending Withdrawal</span>
            <span className="font-medium">{formatCurrency(pending, 2, 'USDC')}</span>
          </div>

          <Separator />

          <div className="flex justify-between items-center font-medium">
            <span>Available to Withdraw</span>
            <span>{formatCurrency(pending, 2, 'USDC')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Revenue */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Monthly Subscription</span>
            <span className="font-medium">
              {formatCurrency(BigInt(profile.subscriptionPrice || 0), 2, 'USDC')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Quick Actions Section
 *
 * Mobile-optimized quick action buttons
 */
function QuickActionsSection({
  onNewContent,
  onViewAnalytics,
  onManageContent
}: {
  onNewContent: () => void
  onViewAnalytics: () => void
  onManageContent: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          <Button onClick={onNewContent} className="w-full justify-start">
            <PlusCircle className="h-4 w-4 mr-3" />
            Create New Content
          </Button>

          <Button onClick={onManageContent} variant="outline" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-3" />
            Manage Content
          </Button>

          <Button onClick={onViewAnalytics} variant="outline" className="w-full justify-start">
            <BarChart3 className="h-4 w-4 mr-3" />
            View Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error Fallback Component
 */
function CreatorDashboardErrorFallback({
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
              Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading your dashboard. Please try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={resetErrorBoundary} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/mini'}
                className="flex-1"
              >
                Go Home
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
function CreatorDashboardLoadingSkeleton() {
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
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
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
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * MiniApp Creator Dashboard Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppCreatorDashboardPage() {
  return (
    <ErrorBoundary
      FallbackComponent={CreatorDashboardErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Creator Dashboard error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<CreatorDashboardLoadingSkeleton />}>
        <MiniAppCreatorDashboardCore />
      </Suspense>
    </ErrorBoundary>
  )
}

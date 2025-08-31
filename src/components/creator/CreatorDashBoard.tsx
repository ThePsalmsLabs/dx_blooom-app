// ==============================================================================
// COMPONENT 4.1: ENHANCED CREATOR DASHBOARD
// File: src/components/creator/CreatorDashBoard.tsx (Enhanced)
// ==============================================================================

/**
 * Enhanced Creator Dashboard Component - Component 4.1
 * File: src/components/creator/CreatorDashBoard.tsx
 * 
 * This component enhances the existing creator dashboard with Mini App analytics,
 * integrating social metrics from Farcaster with traditional platform analytics.
 * It demonstrates how to extend sophisticated existing components with new capabilities
 * while maintaining all existing functionality and architectural integrity.
 * 
 * Enhanced Features:
 * - Integration with Mini App analytics for social engagement metrics
 * - Frame views and cast engagement tracking for social content performance
 * - Social conversion analytics showing how social shares drive platform revenue
 * - Content-specific social metrics integrated with existing content management
 * - Comprehensive dashboard maintaining all existing functionality
 * 
 * This enhancement builds upon Phase 3's Mini App infrastructure while preserving
 * all existing creator dashboard functionality, demonstrating how sophisticated
 * applications can evolve by layering new capabilities onto proven foundations.
 */

'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Eye,
  Download,
  Settings,
  PlusCircle,
  BarChart3,
  PieChart,
  Target,
  CheckCircle,
  RefreshCw,
  Wallet,
  MoreHorizontal,
  Frame,
  Zap,
  MessageSquare,
  Heart
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { Basename, BasenameWithAddress } from '@/components/ui/basename'

// Import our architectural layers
import {
  useCreatorProfile,
  useCreatorContent,
  useCreatorPendingEarnings,
  useIsCreatorRegistered
} from '@/hooks/contracts/core'

import { useCreatorDashboardUI } from '@/hooks/ui/integration'
import { useAccount } from 'wagmi'
import { ContentUploadForm } from '@/components/content/ContentUpload'
import { ZoraCollectionManager } from '@/components/creator/ZoraCollectionManager'
import { useMiniAppAnalytics } from '@/hooks/farcaster/useMiniAppAnalytics'
import { CreatorProfileEditor } from '@/components/creator/CreatorProfileEditor'
import { ContentManagementDashboard } from '@/components/creator/ContentManagementDashboard'
import { CreatorVerificationPanel } from '@/components/creator/CreatorVerificationPanel'
import { Separator } from '@/components/ui/seperator'
import { Shield, User, AlertTriangle } from 'lucide-react'

/**
 * Mini App Metrics Interface
 * 
 * This interface defines the social analytics data structure for Mini App
 * integration, providing comprehensive metrics on social engagement and
 * conversion tracking for Farcaster Mini App interactions.
 */
interface MiniAppMetrics {
  /** Total number of frame views across all content */
  readonly frameViews: number
  
  /** Cast engagement metrics (likes, replies, recasts) */
  readonly castEngagement: number
  
  /** Social conversions from Farcaster to platform purchases */
  readonly socialConversions: number
  
  /** Content-specific social metrics for detailed analysis */
  readonly contentSocialMetrics: readonly ContentSocialMetrics[]
}

/**
 * Content Social Metrics Interface
 * 
 * This interface provides detailed social analytics for individual pieces
 * of content, enabling creators to understand how their content performs
 * in social contexts and optimize for social engagement.
 */
interface ContentSocialMetrics {
  /** Content ID for cross-referencing with platform content */
  readonly contentId: bigint
  
  /** Content title for display purposes */
  readonly title: string
  
  /** Social engagement metrics specific to this content */
  readonly metrics: {
    readonly frameViews: number
    readonly castShares: number
    readonly socialPurchases: number
    readonly engagementRate: number
  }
  
  /** Revenue attribution from social sources */
  readonly socialRevenue: bigint
  
  /** Social performance trend direction */
  readonly trendDirection: 'up' | 'down' | 'stable'
}

/**
 * Placeholder Mini App Analytics Hook Interface
 * 
 * This interface defines the expected structure for the useMiniAppAnalytics hook
 * that will be fully implemented in Component 4.2. It ensures type safety and
 * integration compatibility while Component 4.2 is under development.
 */
interface MiniAppAnalyticsResult {
  /** Social metrics data */
  readonly data: MiniAppMetrics | null
  
  /** Loading state for social analytics */
  readonly isLoading: boolean
  
  /** Error state for analytics fetching */
  readonly error: Error | null
  
  /** Refresh function for updating social metrics */
  readonly refetch: () => Promise<void>
}

/**
 * Dashboard Time Period Options
 * 
 * Users can filter analytics data by different time periods
 * to understand trends and performance over time.
 */
type TimePeriod = '7d' | '30d' | '90d' | '1y' | 'all'

/**
 * Dashboard View Modes
 * 
 * Different views optimize the dashboard for different creator needs
 * and device sizes, now including Mini App specific analytics.
 */
type DashboardView = 'overview' | 'analytics' | 'content' | 'earnings' | 'settings' | 'social' | 'verification' | 'collections'

/**
 * Props interface for the Enhanced CreatorDashboard component
 */
interface EnhancedCreatorDashboardProps {
  /** Optional creator address - defaults to connected wallet */
  creatorAddress?: string
  /** Initial view to display */
  initialView?: DashboardView
  /** Whether to show the upload form modal initially */
  showUploadForm?: boolean
  /** Optional callback when content is uploaded */
  onContentUploaded?: (contentId: bigint) => void
  /** Optional custom styling */
  className?: string
}

/**
 * Enhanced CreatorDashboard Component
 * 
 * This component enhances the existing creator dashboard with Mini App analytics
 * while preserving all existing functionality. It demonstrates how to extend
 * sophisticated components with new capabilities without disrupting existing workflows.
 * 
 * Key Features:
 * - Preserves all existing dashboard functionality (overview, analytics, content, earnings, settings)
 * - Adds new social analytics view with Mini App specific metrics
 * - Integrates Mini App metrics throughout existing dashboard components
 * - Provides social conversion tracking and frame engagement analytics
 * - Maintains consistent UI patterns and responsive design
 * 
 * Architecture Integration:
 * - Uses existing useCreatorDashboardUI hook for traditional metrics
 * - Integrates with placeholder useMiniAppAnalytics hook for social metrics
 * - Builds upon Phase 3's Mini App infrastructure for social data
 * - Maintains compatibility with existing authentication and content systems
 * - Preserves all existing component patterns and styling approaches
 */
export function EnhancedCreatorDashboard({
  creatorAddress,
  initialView = 'overview',
  showUploadForm = false,
  onContentUploaded,
  className
}: EnhancedCreatorDashboardProps) {
  // Wallet connection and creator identification
  const { address: connectedAddress } = useAccount()
  const effectiveCreatorAddress = (creatorAddress || connectedAddress) as `0x${string}` | undefined

  // Dashboard state management (enhanced with social view)
  const [currentView, setCurrentView] = useState<DashboardView>(initialView)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [contentFilter, setContentFilter] = useState<string>('')
  const [showUploadModal, setShowUploadModal] = useState(showUploadForm)

  // Core data using our architectural layers
  const creatorProfile = useCreatorProfile(effectiveCreatorAddress)
  const creatorContent = useCreatorContent(effectiveCreatorAddress)
  const pendingEarnings = useCreatorPendingEarnings(effectiveCreatorAddress)
  const creatorRegistration = useIsCreatorRegistered(effectiveCreatorAddress)
  
  // Existing dashboard UI integration
  const dashboardUI = useCreatorDashboardUI(effectiveCreatorAddress)
  
  // Mini App analytics integration (placeholder for Component 4.2)
  const miniAppAnalytics = useMiniAppAnalytics()

  // Handle content upload success
  const handleContentUploadSuccess = useCallback((contentId: bigint) => {
    setShowUploadModal(false)
    creatorContent.refetch()
    creatorProfile.refetch()
    onContentUploaded?.(contentId)
  }, [creatorContent, creatorProfile, onContentUploaded])

  // Enhanced analytics data combining traditional and social metrics
  const enhancedAnalytics = useMemo(() => {
    const traditional = dashboardUI.metrics
    const social = miniAppAnalytics.data
    
    return {
      traditional,
      social,
      combined: {
        // Traditional metrics from existing dashboard
        totalEarnings: traditional?.totalEarnings || '$0.00',
        pendingEarnings: traditional?.pendingEarnings || '$0.00',
        contentCount: traditional?.contentCount || '0',
        subscriberCount: traditional?.subscriberCount || '0',
        monthlyRevenue: traditional?.monthlyRevenue || '$0.00',
        
        // Social metrics from Mini App analytics
        frameViews: social?.frameViews || 0,
        castEngagement: social?.castEngagement || 0,
        socialConversions: social?.socialConversions || 0
      }
    }
  }, [dashboardUI.metrics, miniAppAnalytics.data])

  // Loading state management
  const isLoading = dashboardUI.isLoading || miniAppAnalytics.isLoading

  // Gate: If not a registered creator, show onboarding prompt
  if (!creatorRegistration.isLoading && creatorRegistration.data === false) {
    return (
      <div className={cn('container mx-auto py-16 text-center', className)}>
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Creator Registration Required</h1>
        <p className="text-muted-foreground mb-6">
          You need to register as a creator to access this dashboard.
        </p>
        <Button onClick={() => (window.location.href = '/onboard')}>Become a Creator</Button>
      </div>
    )
  }

  // Show a helpful message if analytics are limited
  if (miniAppAnalytics.data?.isLimited) {
    return (
      <div className={cn('dashboard-container space-y-6', className)}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-yellow-800 font-medium">Limited Analytics Mode</h3>
          <p className="text-yellow-700 text-sm mt-1">
            {miniAppAnalytics.data.reason} - Some features may not be available.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    onClick={dashboardUI.quickActions.viewAnalyticsAction}
                    className="w-full"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button
                    onClick={dashboardUI.quickActions.updatePricingAction}
                    className="w-full"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Update Pricing
                  </Button>
                  <Button
                    onClick={dashboardUI.quickActions.publishContentAction}
                    className="w-full"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Publish Content
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Address</span>
                    <BasenameWithAddress
                      address={creatorAddress}
                      className="text-sm"
                      separator=" • "
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Subscription Price</span>
                    <span className="font-medium">{creatorProfile.data?.subscriptionPrice ? `${creatorProfile.data.subscriptionPrice} USDC` : 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={creatorProfile.data?.isVerified ? 'default' : 'secondary'}>
                      {creatorProfile.data?.isVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="text-sm">{creatorProfile.data?.registrationTime ? new Date(Number(creatorProfile.data.registrationTime) * 1000).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('dashboard-container space-y-6', className)}>
      {/* Enhanced Dashboard Header with Social Metrics */}
      <DashboardHeader
        creatorProfile={creatorProfile.data}
        enhancedAnalytics={enhancedAnalytics}
        currentView={currentView}
        onViewChange={setCurrentView}
        onRefresh={() => {
          creatorProfile.refetch()
          creatorContent.refetch()
          pendingEarnings.refetch()
          miniAppAnalytics.refetch()
        }}
      />

      {/* Enhanced Dashboard Navigation with Social Tab */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as DashboardView)}>
        <TabsList className="grid grid-cols-2 gap-1 sm:flex sm:gap-2 sm:overflow-x-auto sm:no-scrollbar md:grid md:w-full md:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        {/* Enhanced Overview Tab with Social Metrics */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CreatorOverview 
              metrics={enhancedAnalytics.traditional}
              profile={dashboardUI.profile}
              isLoading={isLoading}
            />
            <EarningsAnalytics 
              earnings={dashboardUI.earnings}
              metrics={enhancedAnalytics.traditional}
              isLoading={isLoading}
            />
          </div>
          
          {/* Mini App Metrics Overview */}
          <MiniAppMetricsOverview
            frameViews={enhancedAnalytics.combined.frameViews}
            castEngagement={enhancedAnalytics.combined.castEngagement}
            socialConversions={enhancedAnalytics.combined.socialConversions}
            isLoading={miniAppAnalytics.isLoading}
          />
        </TabsContent>

        {/* Existing Analytics Tab (Preserved) */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard
            analytics={enhancedAnalytics.traditional}
            contentList={creatorContent.data || []}
            timePeriod={timePeriod}
            onTimePeriodChange={setTimePeriod}
          />
        </TabsContent>

        {/* New Social Analytics Tab */}
        <TabsContent value="social" className="space-y-6">
          <SocialAnalyticsDashboard
            metrics={miniAppAnalytics.data}
            timePeriod={timePeriod}
            onTimePeriodChange={setTimePeriod}
            isLoading={miniAppAnalytics.isLoading}
          />
        </TabsContent>

        {/* Enhanced Content Tab with integrated ContentManagementDashboard */}
        <TabsContent value="content" className="space-y-6">
          <ContentManagementDashboard
            creatorAddress={effectiveCreatorAddress}
            onContentUpdated={() => {
              creatorContent.refetch()
              creatorProfile.refetch()
              pendingEarnings.refetch()
              miniAppAnalytics.refetch()
            }}
            className="w-full"
          />
        </TabsContent>

        {/* Existing Earnings Tab (Preserved) */}
        <TabsContent value="earnings" className="space-y-6">
          <EarningsManagement
            earnings={dashboardUI.earnings}
            metrics={enhancedAnalytics.traditional}
            socialRevenue={miniAppAnalytics.data?.contentSocialMetrics.reduce(
              (total, content) => total + content.socialRevenue, 
              BigInt(0)
            ) || BigInt(0)}
            isLoading={isLoading}
          />
        </TabsContent>

        {/* New Collections Tab for Zora NFT Management */}
        <TabsContent value="collections" className="space-y-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">NFT Collections</h2>
              <p className="text-muted-foreground">
                Create and manage your NFT collections on Zora. Turn your content into collectible NFTs to unlock new revenue streams.
              </p>
            </div>
            {effectiveCreatorAddress && (
              <ZoraCollectionManager
                creatorAddress={effectiveCreatorAddress}
                onCollectionCreated={(collectionAddress) => {
                  console.log('New collection created:', collectionAddress)
                  // Refresh relevant data when a new collection is created
                  creatorContent.refetch()
                  creatorProfile.refetch()
                }}
              />
            )}
          </div>
        </TabsContent>

        {/* Enhanced Settings Tab with profile editor and verification */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Profile Management */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Profile Management</h3>
              </div>
              <CreatorProfileEditor
                creatorAddress={effectiveCreatorAddress}
                onProfileUpdated={() => {
                  creatorProfile.refetch()
                }}
                className="w-full"
              />
            </div>

            {/* Verification Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Verification Status</h3>
              </div>
              <CreatorVerificationPanel
                creatorAddress={effectiveCreatorAddress}
                onVerificationChange={(isVerified: boolean) => {
                  if (isVerified) {
                    creatorProfile.refetch()
                  }
                }}
                className="w-full"
              />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Platform Settings</h3>
            <CreatorSettings
              profile={dashboardUI.profile}
              quickActions={dashboardUI.quickActions}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        {/* New Verification Tab for dedicated workflow */}
        <TabsContent value="verification" className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2">Creator Verification</h2>
              <p className="text-muted-foreground">Manage your verification status and build trust with your audience</p>
            </div>
            <CreatorVerificationPanel
              creatorAddress={effectiveCreatorAddress}
              onVerificationChange={(isVerified: boolean) => {
                if (isVerified) {
                  creatorProfile.refetch()
                }
              }}
              className="w-full"
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Content Upload Modal (Existing Functionality Preserved) */}
      {showUploadModal && (
        <ContentUploadForm
          onSuccess={handleContentUploadSuccess}
          onCancel={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}

/**
 * Enhanced Dashboard Header Component
 * 
 * This component provides comprehensive dashboard navigation and quick stats
 * including both traditional platform metrics and new social engagement metrics.
 */
interface DashboardHeaderProps {
  readonly creatorProfile: ReturnType<typeof useCreatorProfile>['data']
  readonly enhancedAnalytics: {
    readonly traditional: ReturnType<typeof useCreatorDashboardUI>['metrics'] | null
    readonly social: MiniAppMetrics | null
    readonly combined: Readonly<Record<string, unknown>>
  }
  readonly currentView: DashboardView
  readonly onViewChange: (view: DashboardView) => void
  readonly onRefresh: () => void
}

function DashboardHeader({ 
  creatorProfile, 
  enhancedAnalytics, 
  currentView,
  onViewChange,
  onRefresh 
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
          {enhancedAnalytics.social && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Frame className="h-3 w-3 mr-1" />
              Mini App Enabled
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Manage your content, track earnings, and monitor social engagement.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="default" size="sm" onClick={() => onViewChange('content')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Content
        </Button>
      </div>
    </div>
  )
}

/**
 * Creator Overview Component
 * 
 * This component displays essential creator metrics and profile information,
 * maintaining the existing interface while being enhanced with social context.
 */
interface CreatorOverviewProps {
  readonly metrics: ReturnType<typeof useCreatorDashboardUI>['metrics']
  readonly profile: ReturnType<typeof useCreatorDashboardUI>['profile']
  readonly isLoading: boolean
}

function CreatorOverview({ metrics, profile, isLoading }: CreatorOverviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creator Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Creator Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Address</span>
              <span className="font-mono text-sm">{profile.formattedAddress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subscription Price</span>
              <span className="font-medium">{profile.subscriptionPrice}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={profile.verificationStatus === 'Verified' ? 'default' : 'secondary'}>
                {profile.verificationStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm">{profile.memberSince}</span>
            </div>
          </div>
        )}
        
        {metrics && (
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.contentCount}</div>
              <div className="text-xs text-muted-foreground">Published Content</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.subscriberCount}</div>
              <div className="text-xs text-muted-foreground">Subscribers</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Earnings Analytics Component
 * 
 * This component displays earnings information and withdrawal capabilities,
 * maintaining the existing functionality while being enhanced for social revenue tracking.
 */
interface EarningsAnalyticsProps {
  readonly earnings: ReturnType<typeof useCreatorDashboardUI>['earnings']
  readonly metrics: ReturnType<typeof useCreatorDashboardUI>['metrics']
  readonly isLoading: boolean
}

function EarningsAnalytics({ earnings, metrics, isLoading }: EarningsAnalyticsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Earnings Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Earnings</span>
              <span className="text-lg font-bold">{metrics.totalEarnings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending Earnings</span>
              <span className="font-medium">{metrics.pendingEarnings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Monthly Revenue</span>
              <span className="font-medium">{metrics.monthlyRevenue}</span>
            </div>
          </div>
        )}
        
        {earnings && earnings.canWithdraw && (
          <div className="pt-4">
            <Button 
              onClick={() => earnings.withdrawAction(earnings.withdrawableAmount)}
              disabled={earnings.isWithdrawing}
              className="w-full"
            >
              {earnings.isWithdrawing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Withdraw {earnings.withdrawableAmount}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Mini App Metrics Overview Component
 * 
 * This component displays Mini App specific metrics in a compact overview format
 * that integrates seamlessly with the existing dashboard layout.
 */
interface MiniAppMetricsOverviewProps {
  readonly frameViews: number
  readonly castEngagement: number
  readonly socialConversions: number
  readonly isLoading: boolean
}

function MiniAppMetricsOverview({
  frameViews,
  castEngagement,
  socialConversions,
  isLoading
}: MiniAppMetricsOverviewProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Frame className="h-5 w-5 text-purple-600" />
          Social Engagement
        </CardTitle>
        <CardDescription>
          Mini App and social metrics from Farcaster integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-blue-600">{formatNumber(frameViews)}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Eye className="h-3 w-3" />
              Frame Views
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-green-600">{formatNumber(castEngagement)}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Heart className="h-3 w-3" />
              Cast Engagement
            </div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold text-purple-600">{formatNumber(socialConversions)}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Zap className="h-3 w-3" />
              Social Conversions
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Social Analytics Dashboard Component
 * 
 * This component provides detailed social analytics specifically for Mini App
 * and Farcaster integration, showing how social engagement drives platform growth.
 */
interface SocialAnalyticsDashboardProps {
  readonly metrics: MiniAppMetrics | null
  readonly timePeriod: TimePeriod
  readonly onTimePeriodChange: (period: TimePeriod) => void
  readonly isLoading: boolean
}

function SocialAnalyticsDashboard({
  metrics,
  timePeriod,
  onTimePeriodChange,
  isLoading
}: SocialAnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Social Analytics</h2>
        <Select value={timePeriod} onValueChange={onTimePeriodChange}>
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Social Engagement Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Social engagement chart visualization
                {metrics && (
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatNumber(metrics.castEngagement)}</div>
                    <div className="text-sm">Total Engagement</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Conversion Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Social conversion funnel visualization
                {metrics && (
                  <div className="text-center">
                    <div className="text-lg font-semibold">{formatNumber(metrics.socialConversions)}</div>
                    <div className="text-sm">Social Conversions</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Social Performance Table */}
      {metrics?.contentSocialMetrics && metrics.contentSocialMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Content Social Performance</CardTitle>
            <CardDescription>
              How your content performs across social channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentSocialMetricsTable metrics={metrics.contentSocialMetrics} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Enhanced Content Management Component
 * 
 * This component integrates traditional content management with social metrics,
 * providing creators with comprehensive insights into content performance.
 */
interface ContentManagementProps {
  readonly contentData: ReturnType<typeof useCreatorDashboardUI>['metrics']
  readonly socialMetrics: readonly ContentSocialMetrics[]
  readonly contentList: readonly bigint[]
  readonly isLoading: boolean
  readonly onContentAction: (action: string, contentId: bigint) => void
}

function ContentManagement({
  contentData,
  socialMetrics,
  contentList,
  isLoading,
  onContentAction
}: ContentManagementProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Content Management</h2>
        <Button onClick={() => onContentAction('upload', BigInt(0))}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Upload Content
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Performance</CardTitle>
          <CardDescription>
            Manage your content and monitor both platform and social performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : contentList.length > 0 ? (
            <ContentWithSocialMetricsTable 
              contentList={contentList}
              socialMetrics={socialMetrics}
              onContentAction={onContentAction}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No content published yet</p>
              <Button 
                onClick={() => onContentAction('upload', BigInt(0))}
                className="mt-4"
              >
                Upload Your First Content
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Content Social Metrics Table Component
 * 
 * This component displays content-specific social performance metrics
 * in a tabular format for detailed analysis.
 */
interface ContentSocialMetricsTableProps {
  readonly metrics: readonly ContentSocialMetrics[]
}

function ContentSocialMetricsTable({ metrics }: ContentSocialMetricsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Content</TableHead>
            <TableHead className="text-right">Frame Views</TableHead>
            <TableHead className="text-right">Cast Shares</TableHead>
            <TableHead className="text-right">Social Revenue</TableHead>
            <TableHead className="text-right">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((content) => (
            <TableRow key={content.contentId.toString()}>
              <TableCell className="font-medium">
                {content.title}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(content.metrics.frameViews)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(content.metrics.castShares)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(content.socialRevenue)}
              </TableCell>
              <TableCell className="text-right">
                {content.trendDirection === 'up' && (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
                {content.trendDirection === 'down' && (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                {content.trendDirection === 'stable' && (
                  <div className="h-4 w-4 bg-gray-300 rounded-full" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Enhanced Content with Social Metrics Table Component
 * 
 * This component provides a comprehensive view of content performance
 * combining traditional platform metrics with social engagement data.
 */
interface ContentWithSocialMetricsTableProps {
  readonly contentList: readonly bigint[]
  readonly socialMetrics: readonly ContentSocialMetrics[]
  readonly onContentAction: (action: string, contentId: bigint) => void
}

function ContentWithSocialMetricsTable({
  contentList,
  socialMetrics,
  onContentAction
}: ContentWithSocialMetricsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Content ID</TableHead>
            <TableHead className="text-right">Platform Performance</TableHead>
            <TableHead className="text-right">Social Performance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contentList.map((contentId) => {
            const socialMetric = socialMetrics.find(m => m.contentId === contentId)
            
            return (
              <TableRow key={contentId.toString()}>
                <TableCell className="font-medium">
                  {contentId.toString()}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">Platform Metrics</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {socialMetric ? (
                    <div className="space-y-1">
                      <div className="text-sm">{formatNumber(socialMetric.metrics.frameViews)} views</div>
                      <div className="text-xs text-muted-foreground">{formatNumber(socialMetric.metrics.castShares)} shares</div>
                    </div>
                  ) : (
                    <Badge variant="secondary">No Social Data</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onContentAction('view', contentId)}>
                        View Content
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onContentAction('edit', contentId)}>
                        Edit Content
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onContentAction('share', contentId)}>
                        Share Socially
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Earnings Management Component
 * 
 * This component handles earnings management with enhanced social revenue tracking,
 * maintaining existing withdrawal functionality while adding social attribution.
 */
interface EarningsManagementProps {
  readonly earnings: ReturnType<typeof useCreatorDashboardUI>['earnings']
  readonly metrics: ReturnType<typeof useCreatorDashboardUI>['metrics']
  readonly socialRevenue: bigint
  readonly isLoading: boolean
}

function EarningsManagement({
  earnings,
  metrics,
  socialRevenue,
  isLoading
}: EarningsManagementProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Earnings Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Earnings Management
        </CardTitle>
        <CardDescription>
          Manage withdrawals and track revenue attribution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Platform Revenue</span>
                <span className="font-bold">{metrics.totalEarnings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Social Revenue</span>
                <span className="font-bold text-purple-600">{formatCurrency(socialRevenue)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Withdrawal</span>
                <span className="font-medium">{metrics.pendingEarnings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                <span className="font-medium">{metrics.monthlyRevenue}</span>
              </div>
            </div>
          </div>
        )}
        
        {earnings && earnings.canWithdraw && (
          <div className="pt-4">
            <Button 
              onClick={() => earnings.withdrawAction(earnings.withdrawableAmount)}
              disabled={earnings.isWithdrawing}
              className="w-full"
            >
              {earnings.isWithdrawing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing Withdrawal...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Withdraw {earnings.withdrawableAmount}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Creator Settings Component
 * 
 * This component handles creator profile and platform settings,
 * maintaining existing functionality with the enhanced dashboard.
 */
interface CreatorSettingsProps {
  readonly profile: ReturnType<typeof useCreatorDashboardUI>['profile']
  readonly quickActions: ReturnType<typeof useCreatorDashboardUI>['quickActions']
  readonly isLoading: boolean
}

function CreatorSettings({
  profile,
  quickActions,
  isLoading
}: CreatorSettingsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Creator Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Creator Settings
        </CardTitle>
        <CardDescription>
          Manage your creator profile and platform preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={quickActions.publishContentAction}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Publish Content
          </Button>
          <Button
            variant="outline"
            onClick={quickActions.updatePricingAction}
            className="flex items-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Update Pricing
          </Button>
          <Button
            variant="outline"
            onClick={quickActions.viewAnalyticsAction}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Analytics Dashboard Component (Existing Functionality Preserved)
 * 
 * This component maintains the existing analytics functionality
 * while being part of the enhanced dashboard structure.
 */
interface AnalyticsDashboardProps {
  readonly analytics: ReturnType<typeof useCreatorDashboardUI>['metrics'] | null
  readonly contentList: readonly bigint[]
  readonly timePeriod: TimePeriod
  readonly onTimePeriodChange: (period: TimePeriod) => void
}

function AnalyticsDashboard({
  analytics,
  contentList,
  timePeriod,
  onTimePeriodChange
}: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Platform Analytics</h2>
        <Select value={timePeriod} onValueChange={onTimePeriodChange}>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Platform revenue analytics visualization
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Revenue source breakdown visualization
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Basic Dashboard Content Component
 * 
 * This component provides a basic structure for the dashboard when analytics
 * are limited due to missing providers. It displays a message and allows
 * the user to navigate to settings or view analytics.
 */
interface BasicDashboardContentProps {
  readonly creatorProfile: ReturnType<typeof useCreatorProfile>['data']
  readonly dashboardUI: ReturnType<typeof useCreatorDashboardUI>
  readonly isLoading: boolean
  readonly creatorAddress: string
}

function BasicDashboardContent({
  creatorProfile,
  dashboardUI,
  isLoading,
  creatorAddress
}: BasicDashboardContentProps) {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="text-yellow-800 font-medium">Limited Analytics Mode</h3>
        <p className="text-yellow-700 text-sm mt-1">
          Analytics are currently limited. Please check your provider settings
          or contact support for assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                onClick={dashboardUI.quickActions.viewAnalyticsAction}
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
              <Button
                onClick={dashboardUI.quickActions.updatePricingAction}
                className="w-full"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Update Pricing
              </Button>
              <Button
                onClick={dashboardUI.quickActions.publishContentAction}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Publish Content
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                             <div className="flex items-center justify-between">
                 <span className="text-sm text-muted-foreground">Address</span>
                 <BasenameWithAddress
                   address={creatorAddress}
                   className="text-sm"
                   separator=" • "
                   fallbackText="Not connected"
                 />
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm text-muted-foreground">Subscription Price</span>
                 <span className="font-medium">{creatorProfile?.subscriptionPrice ? `${creatorProfile.subscriptionPrice} USDC` : 'Not set'}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm text-muted-foreground">Status</span>
                 <Badge variant={creatorProfile?.isVerified ? 'default' : 'secondary'}>
                   {creatorProfile?.isVerified ? 'Verified' : 'Unverified'}
                 </Badge>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm text-muted-foreground">Member Since</span>
                 <span className="text-sm">{creatorProfile?.registrationTime ? new Date(Number(creatorProfile.registrationTime) * 1000).toLocaleDateString() : 'Unknown'}</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Re-export the enhanced component as the default export
export { EnhancedCreatorDashboard as CreatorDashboard }

// Export type definitions for external use
export type {
  MiniAppMetrics,
  ContentSocialMetrics,
  MiniAppAnalyticsResult,
  EnhancedCreatorDashboardProps
}
/**
 * MiniApp Creator Profile Page - Mobile Creator Showcase
 * File: src/app/mini/creator/[address]/page.tsx
 *
 * This page serves as the creator showcase in the mini app ecosystem,
 * designed for mobile social commerce with instant subscription and content discovery.
 * It transforms creator profiles into engaging mobile experiences that drive subscriptions.
 *
 * Mini App Design Philosophy:
 * - Mobile-first creator discovery with social proof
 * - Instant subscription flows optimized for touch
 * - Content preview grid with seamless purchase integration
 * - Creator storytelling through mobile-optimized layouts
 * - Social engagement features integrated into creator experience
 *
 * Key Features:
 * - Creator profile with mobile-optimized bio and achievements
 * - Content grid with instant purchase capabilities
 * - Subscription integration with social commerce focus
 * - Creator stats and social proof indicators
 * - Mobile-optimized engagement and sharing features
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  Share2,
  Heart,
  User,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Zap,
  CheckCircle,
  Crown,
  Target,
  Sparkles,
  Video,
  AlertCircle,
  Grid3X3,
  List
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
  Avatar,
  AvatarFallback,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useCreatorProfile, useCreatorContent } from '@/hooks/contracts/core'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'

// Import your existing sophisticated components
import { CreatorSubscriptionPurchase } from '@/components/subscription'
import { ContentPreviewCard } from '@/components/content/ContentPreviewCard'

// Import utilities
import { formatCurrency, formatAddress, formatRelativeTime, formatNumber } from '@/lib/utils'
import type { Address } from 'viem'

/**
 * Page Props Interface
 */
interface CreatorProfilePageProps {
  readonly params: Promise<{
    readonly address: string
  }>
}

/**
 * Creator Profile State Interface
 */
interface CreatorProfileState {
  readonly activeTab: 'content' | 'about' | 'activity'
  readonly contentView: 'grid' | 'list'
  readonly sortBy: 'newest' | 'popular' | 'price'
}

/**
 * MiniApp Creator Profile Core Component
 *
 * This component orchestrates the complete creator profile experience
 * with mobile-first design and social commerce integration.
 */
function MiniAppCreatorProfileCore({ params }: CreatorProfilePageProps) {
  const router = useRouter()

  // Await params 
  const [unwrappedParams, setUnwrappedParams] = useState<{ readonly address: string } | null>(null)
  
  useEffect(() => {
    params.then(setUnwrappedParams)
  }, [params])

  // Parse creator address from route parameters
  const creatorAddress = useMemo(() => {
    if (!unwrappedParams) return null
    try {
      return unwrappedParams.address as Address
    } catch {
      return undefined
    }
  }, [unwrappedParams])

  // Show loading state while params are being resolved
  if (!unwrappedParams || !creatorAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading creator profile...</p>
        </div>
      </div>
    )
  }

  // Core state management
  const [profileState, setProfileState] = useState<CreatorProfileState>({
    activeTab: 'content',
    contentView: 'grid',
    sortBy: 'newest'
  })

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useMiniAppWalletUI()

  const userAddress = walletUI.address && typeof walletUI.address === 'string'
    ? walletUI.address as `0x${string}`
    : undefined

  // Creator data hooks
  const creatorProfile = useCreatorProfile(creatorAddress)
  const creatorContent = useCreatorContent(creatorAddress)

  /**
   * Tab Change Handler
   */
  const handleTabChange = useCallback((tab: CreatorProfileState['activeTab']) => {
    setProfileState(prev => ({ ...prev, activeTab: tab }))
  }, [])

  /**
   * View Mode Toggle Handler
   */
  const handleViewModeChange = useCallback((view: CreatorProfileState['contentView']) => {
    setProfileState(prev => ({ ...prev, contentView: view }))
  }, [])

  /**
   * Sort Change Handler
   */
  const handleSortChange = useCallback((sortBy: CreatorProfileState['sortBy']) => {
    setProfileState(prev => ({ ...prev, sortBy }))
  }, [])

  /**
   * Navigation Handlers
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  const handleShare = useCallback(() => {
    if (navigator.share && creatorProfile.data) {
      navigator.share({
        title: `Check out ${formatAddress(creatorAddress || '0x')} on Bloom`,
        text: `Discover amazing content from this creator`,
        url: window.location.href
      })
    }
  }, [creatorProfile.data, creatorAddress])

  // Handle invalid creator address
  if (!creatorAddress) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid creator address provided. Please check the URL and try again.
            </AlertDescription>
          </Alert>
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
        {/* Creator Header */}
        <CreatorHeader
          creatorProfile={creatorProfile}
          onGoBack={handleGoBack}
          onShare={handleShare}
          creatorAddress={creatorAddress}
        />

        {/* Creator Stats */}
        <CreatorStatsCard
          creatorProfile={creatorProfile}
          creatorContent={creatorContent}
        />

        {/* Subscription Section */}
        <SubscriptionSection
          creatorAddress={creatorAddress}
          creatorProfile={creatorProfile}
          userAddress={userAddress}
        />

        {/* Content Tabs */}
        <CreatorContentTabs
          profileState={profileState}
          onTabChange={handleTabChange}
          onViewModeChange={handleViewModeChange}
          onSortChange={handleSortChange}
          creatorContent={creatorContent}
          creatorAddress={creatorAddress}
          userAddress={userAddress}
          creatorProfile={creatorProfile}
        />
      </main>
    </div>
  )
}

/**
 * Creator Header Component
 *
 * Mobile-optimized creator profile header with key information
 */
function CreatorHeader({
  creatorProfile,
  onGoBack,
  onShare,
  creatorAddress
}: {
  creatorProfile: ReturnType<typeof useCreatorProfile>
  onGoBack: () => void
  onShare: () => void
  creatorAddress: Address
}) {
  if (creatorProfile.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    )
  }

  if (!creatorProfile.data) return null

  const profile = creatorProfile.data

  return (
    <div className="space-y-4">
      {/* Navigation */}
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

        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="h-8 w-8 p-0"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Creator Info */}
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarFallback className="text-lg">
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold truncate">
              {formatAddress(creatorAddress)}
            </h1>
            {profile.isVerified && (
              <Badge variant="default" className="text-xs px-1.5 py-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            Creator • {profile.contentCount} content pieces
          </p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{formatNumber(Number(profile.subscriberCount))} subscribers</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{formatCurrency(BigInt(profile.totalEarnings), 6, 'USDC')} earned</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Creator Stats Card
 *
 * Key metrics and achievements display
 */
function CreatorStatsCard({
  creatorProfile,
  creatorContent
}: {
  creatorProfile: ReturnType<typeof useCreatorProfile>
  creatorContent: ReturnType<typeof useCreatorContent>
}) {
  if (creatorProfile.isLoading || creatorContent.isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!creatorProfile.data) return null

  const profile = creatorProfile.data

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">
              {formatNumber(Number(profile.subscriberCount))}
            </div>
            <div className="text-xs text-muted-foreground">Subscribers</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">
              {profile.contentCount}
            </div>
            <div className="text-xs text-muted-foreground">Content</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(BigInt(profile.totalEarnings), 6, 'USDC')}
            </div>
            <div className="text-xs text-muted-foreground">Earned</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Subscription Section
 *
 * Mobile-optimized subscription purchase interface
 */
function SubscriptionSection({
  creatorAddress,
  creatorProfile,
  userAddress
}: {
  creatorAddress: Address
  creatorProfile: ReturnType<typeof useCreatorProfile>
  userAddress?: `0x${string}`
}) {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Support This Creator</h3>
          </div>

          <p className="text-sm text-muted-foreground">
            Get unlimited access to all content and support ongoing creation
          </p>

          <CreatorSubscriptionPurchase
            creatorAddress={creatorAddress}
            onSubscriptionSuccess={() => {
              // Handle success - refresh data
              creatorProfile.refetch?.()
            }}
            className="w-full"
          />

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Instant access</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>Support creator</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Creator Content Tabs
 *
 * Mobile-optimized content browsing with tabs
 */
function CreatorContentTabs({
  profileState,
  onTabChange,
  onViewModeChange,
  onSortChange,
  creatorContent,
  creatorAddress,
  userAddress,
  creatorProfile
}: {
  profileState: CreatorProfileState
  onTabChange: (tab: CreatorProfileState['activeTab']) => void
  onViewModeChange: (view: CreatorProfileState['contentView']) => void
  onSortChange: (sortBy: CreatorProfileState['sortBy']) => void
  creatorContent: ReturnType<typeof useCreatorContent>
  creatorAddress: Address
  userAddress?: `0x${string}`
  creatorProfile: ReturnType<typeof useCreatorProfile>
}) {
  return (
    <Tabs value={profileState.activeTab} onValueChange={(value) => onTabChange(value as CreatorProfileState['activeTab'])}>
      <div className="flex items-center justify-between mb-4">
        <TabsList className="grid grid-cols-3 gap-1">
          <TabsTrigger value="content" className="text-xs">
            Content ({creatorContent.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="about" className="text-xs">
            About
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            Activity
          </TabsTrigger>
        </TabsList>

        {profileState.activeTab === 'content' && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange(profileState.contentView === 'grid' ? 'list' : 'grid')}
              className="h-8 w-8 p-0"
            >
              {profileState.contentView === 'grid' ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid3X3 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      <TabsContent value="content" className="space-y-4">
        <CreatorContentGrid
          creatorContent={creatorContent}
          creatorAddress={creatorAddress}
          userAddress={userAddress}
          viewMode={profileState.contentView}
        />
      </TabsContent>

      <TabsContent value="about" className="space-y-4">
        <CreatorAboutSection
          creatorProfile={creatorProfile}
          creatorAddress={creatorAddress}
        />
      </TabsContent>

      <TabsContent value="activity" className="space-y-4">
        <CreatorActivitySection
          creatorProfile={creatorProfile}
        />
      </TabsContent>
    </Tabs>
  )
}

/**
 * Creator Content Grid
 *
 * Mobile-optimized content display
 */
function CreatorContentGrid({
  creatorContent,
  creatorAddress,
  userAddress,
  viewMode
}: {
  creatorContent: ReturnType<typeof useCreatorContent>
  creatorAddress: Address
  userAddress?: `0x${string}`
  viewMode: CreatorProfileState['contentView']
}) {
  if (creatorContent.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!creatorContent.data || creatorContent.data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Content Yet</h3>
          <p className="text-sm text-muted-foreground">
            This creator hasn't published any content yet. Check back soon!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn(
      "grid gap-4",
      viewMode === 'grid'
        ? "grid-cols-1"
        : "grid-cols-1"
    )}>
      {creatorContent.data.map((contentId) => (
        <ContentPreviewCard
          key={contentId.toString()}
          contentId={contentId}
          viewMode={viewMode === 'grid' ? 'grid' : 'list'}
          showCreatorInfo={false}
          userAddress={userAddress}
        />
      ))}
    </div>
  )
}

/**
 * Creator About Section
 *
 * Creator story and achievements
 */
function CreatorAboutSection({
  creatorProfile,
  creatorAddress
}: {
  creatorProfile: ReturnType<typeof useCreatorProfile>
  creatorAddress: Address
}) {
  if (!creatorProfile.data) return null

  const profile = creatorProfile.data

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Creator Story
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            {profile.isVerified
              ? `A verified creator on Bloom, ${formatAddress(creatorAddress)} brings authentic content to the Web3 space. With ${profile.contentCount} pieces of content and ${formatNumber(Number(profile.subscriberCount))} subscribers, they're building meaningful connections through transparent blockchain monetization.`
              : `Discover the creative journey of ${formatAddress(creatorAddress)}, a passionate content creator embracing Web3 technology to share their unique voice with the world.`
            }
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Video className="h-3 w-3 mr-1" />
              Digital Content
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Heart className="h-3 w-3 mr-1" />
              Authentic Stories
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Web3 Native
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Creator Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">Build authentic audience connections</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm">Create meaningful, valuable content</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-sm">Foster Web3 adoption and education</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Creator Activity Section
 *
 * Recent activity and achievements
 */
function CreatorActivitySection({
  creatorProfile
}: {
  creatorProfile: ReturnType<typeof useCreatorProfile>
}) {
  if (!creatorProfile.data) return null

  const profile = creatorProfile.data

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
            <div className="flex-1">
              <p className="text-sm font-medium">Joined Bloom creator community</p>
              <p className="text-xs text-muted-foreground">
                {profile.registrationTime ? formatRelativeTime(BigInt(profile.registrationTime) * BigInt(1000)) : 'Recently'}
              </p>
            </div>
          </div>

          {profile.contentCount > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Published {profile.contentCount} content pieces</p>
                <p className="text-xs text-muted-foreground">Building content library</p>
              </div>
            </div>
          )}

          {profile.subscriberCount > BigInt(0) && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Gained {formatNumber(Number(profile.subscriberCount))} subscribers</p>
                <p className="text-xs text-muted-foreground">Growing community</p>
              </div>
            </div>
          )}

          {profile.isVerified && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Earned verified creator status</p>
                <p className="text-xs text-muted-foreground">Community trust achieved</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error Fallback Component
 */
function CreatorProfileErrorFallback({
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
              Profile Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading this creator profile. Please try again.
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
function CreatorProfileLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-12 mx-auto" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * MiniApp Creator Profile Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppCreatorProfilePage({ params }: CreatorProfilePageProps) {
  return (
    <ErrorBoundary
      FallbackComponent={CreatorProfileErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Creator Profile error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<CreatorProfileLoadingSkeleton />}>
        <MiniAppCreatorProfileCore params={params} />
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * MiniApp Content Display Page - Mobile-First Content Showcase
 * File: src/app/mini/content/[id]/page.tsx
 *
 * This page represents the critical content discovery moment in the mini app ecosystem,
 * where users encounter premium content and make instant purchase decisions. Designed
 * specifically for mobile social commerce with instant engagement patterns.
 *
 * Mini App Design Philosophy:
 * - Mobile-first with touch-optimized interactions
 * - Social commerce focus with instant purchase flows
 * - Compact, engaging layout optimized for quick consumption
 * - Integrated wallet and social context awareness
 * - Seamless transition to content consumption
 *
 * Key Features:
 * - Content preview with smart truncation
 * - Integrated purchase card with mini app wallet UI
 * - Social sharing and engagement features
 * - Creator verification and trust signals
 * - Mobile-optimized content display
 * - Instant access flow post-purchase
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  Share2,
  Heart,
  Eye,
  Clock,
  User,
  Star,
  Shield,
  Zap,
  CheckCircle,
  Lock,
  AlertCircle,
  Loader2,
  DollarSign,
  Bookmark,
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
  AvatarFallback
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { formatWalletAddress, isWalletFullyConnected, getSafeAddress } from '@/lib/utils/wallet-utils'
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'

// Import your existing sophisticated components
import { PerformanceMonitor } from '@/components/debug/PerformanceMonitor'

// Import V2 Payment Modal for mini app integration
import { useV2PaymentModal } from '@/components/v2/V2PaymentModal'

// Import V2 Messaging Components for post-purchase messaging
import { V2MiniAppSmartMessagingButton } from '@/components/v2/miniapp/V2MiniAppSmartMessagingButton'
import { V2MiniAppPurchaseButton } from '@/components/v2/miniapp/V2MiniAppPurchaseButton'

// Import utilities
import { formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'
import type { Content } from '@/types/contracts'

/**
 * Page Props Interface
 */
interface ContentDisplayPageProps {
  readonly params: Promise<{
    readonly id: string
  }>
}

/**
 * Content Access State Interface
 */
interface ContentAccessState {
  readonly status: 'loading' | 'accessible' | 'purchase_required' | 'error'
  readonly message: string
  readonly canPreview: boolean
}

/**
 * MiniApp Content Display Core Component
 *
 * This component orchestrates the complete content discovery and purchase
 * experience with mobile-first design principles and social commerce focus.
 */
function MiniAppContentDisplayCore({ params }: ContentDisplayPageProps) {
  const router = useRouter()
  const searchParams = useParams()

  // Await params 
  const [unwrappedParams, setUnwrappedParams] = useState<{ readonly id: string } | null>(null)
  
  useEffect(() => {
    params.then(setUnwrappedParams)
  }, [params])

  // Parse content ID from route parameters
  const contentId = useMemo(() => {
    if (!unwrappedParams) return null
    try {
      return BigInt(unwrappedParams.id)
    } catch {
      return undefined
    }
  }, [unwrappedParams])

  // Show loading state while params are being resolved
  if (!unwrappedParams || !contentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  // Core state management
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showPurchaseCard, setShowPurchaseCard] = useState(false)

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useFarcasterAutoWallet()
  const userAddress = getSafeAddress(walletUI.address)
  const isConnected = isWalletFullyConnected(walletUI.isConnected, walletUI.address)
  const formattedAddress = formatWalletAddress(walletUI.address)

  const { isMiniApp } = miniAppUtils
  const { userProfile } = socialState

  // Content and access data
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)

  // V2 Payment Modal integration for mini app
  const paymentModal = useV2PaymentModal({
    contentId: contentId || BigInt(0),
    creator: (contentQuery.data?.creator as `0x${string}`) || '0x0000000000000000000000000000000000000000',
    title: contentQuery.data?.title || 'Premium Content',
    description: contentQuery.data?.description,
    onSuccess: (txHash) => {
      console.log('Mini app payment successful:', txHash)
      accessQuery.refetch()
      setShowPurchaseCard(false)
      
      // Mini app specific success handling
      router.push(`/mini/content/${contentId}/view`)
    },
    onError: (error) => {
      console.error('Mini app payment failed:', error)
    }
  })

  /**
   * Content Access State Computation
   *
   * Determines the current access state and appropriate UI elements
   * for mobile social commerce context.
   */
  const accessState = useMemo((): ContentAccessState => {
    if (contentQuery.isLoading || accessQuery.isLoading) {
      return {
        status: 'loading',
        message: 'Loading content...',
        canPreview: false
      }
    }

    if (contentQuery.error || !contentQuery.data) {
      return {
        status: 'error',
        message: 'Content not found',
        canPreview: false
      }
    }

    if (!contentQuery.data.isActive) {
      return {
        status: 'error',
        message: 'This content is no longer available',
        canPreview: false
      }
    }

    if (accessQuery.data === true) {
      return {
        status: 'accessible',
        message: 'You have access to this content',
        canPreview: true
      }
    }

    return {
      status: 'purchase_required',
      message: 'Purchase required to unlock full content',
      canPreview: true
    }
  }, [contentQuery, accessQuery])

  /**
   * Purchase Success Handler
   *
   * Handles successful purchases with mobile-optimized success flow
   */
  const handlePurchaseSuccess = useCallback((contentId: bigint) => {
    accessQuery.refetch()

    // Mobile-optimized success feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(200) // Subtle haptic feedback
    }

    // Auto-redirect to content view with mini app timing
    setTimeout(() => {
      router.push(`/mini/content/${contentId}/view`)
    }, 1500)
  }, [accessQuery, router])

  /**
   * Navigation Handlers
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  const handleViewContent = useCallback(() => {
    if (contentId && accessState.status === 'accessible') {
      router.push(`/mini/content/${contentId}/view`)
    }
  }, [contentId, accessState.status, router])

  /**
   * Social Interaction Handlers
   */
  const handleLike = useCallback(() => {
    setIsLiked(prev => !prev)
    // Track analytics
  }, [])

  const handleBookmark = useCallback(() => {
    setIsBookmarked(prev => !prev)
    // Track analytics
  }, [])

  const handleShare = useCallback(() => {
    if (navigator.share && contentQuery.data) {
      navigator.share({
        title: contentQuery.data.title,
        text: contentQuery.data.description,
        url: window.location.href
      })
    }
  }, [contentQuery.data])

  // Handle invalid content ID
  if (!contentId) {
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
              Invalid content ID provided. Please check the URL and try again.
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
        {/* Content Header */}
        <ContentHeader
          contentQuery={contentQuery}
          accessState={accessState}
          onGoBack={handleGoBack}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onShare={handleShare}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
        />

        {/* Content Preview */}
        <ContentPreviewSection
          content={contentQuery.data}
          accessState={accessState}
          isLoading={contentQuery.isLoading}
        />

        {/* Creator Info Card */}
        <CreatorInfoCard
          content={contentQuery.data}
          isLoading={contentQuery.isLoading}
        />

        {/* Social Actions */}
        <SocialActionsBar
          contentId={contentId}
          contentData={contentQuery.data}
          accessState={accessState}
          onViewContent={handleViewContent}
          onPurchaseClick={() => setShowPurchaseCard(true)}
        />

        {/* Purchase Card Modal/Sheet for Mobile */}
        {showPurchaseCard && contentId && accessState.status === 'purchase_required' && (
          <PurchaseCardModal
            contentId={contentId}
            contentData={contentQuery.data}
            userAddress={userAddress}
            onPurchaseSuccess={() => handlePurchaseSuccess(contentId)}
            onClose={() => setShowPurchaseCard(false)}
          />
        )}
      </main>

      {/* Performance Monitor (Development Only) */}
      {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
    </div>
  )
}

/**
 * Content Header Component
 *
 * Mobile-optimized header with social actions and content metadata
 */
function ContentHeader({
  contentQuery,
  accessState,
  onGoBack,
  onLike,
  onBookmark,
  onShare,
  isLiked,
  isBookmarked
}: {
  contentQuery: ReturnType<typeof useContentById>
  accessState: ContentAccessState
  onGoBack: () => void
  onLike: () => void
  onBookmark: () => void
  onShare: () => void
  isLiked: boolean
  isBookmarked: boolean
}) {
  if (contentQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    )
  }

  if (!contentQuery.data) return null

  const content = contentQuery.data

  return (
    <div className="space-y-4">
      {/* Navigation and Actions Row */}
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

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={cn(
              "h-8 w-8 p-0",
              isLiked && "text-red-500"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBookmark}
            className={cn(
              "h-8 w-8 p-0",
              isBookmarked && "text-blue-500"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
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
      </div>

      {/* Content Title and Status */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold leading-tight flex-1">
            {content.title}
          </h1>

          <div className="flex-shrink-0">
            <AccessStatusBadge status={accessState.status} />
          </div>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          {content.description}
        </p>

        {/* Content Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{formatCurrency(content.payPerViewPrice, 6, 'USDC')}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeTime(content.creationTime)}</span>
          </div>

          <Badge variant="secondary" className="text-xs">
            {content.category}
          </Badge>
        </div>
      </div>
    </div>
  )
}

/**
 * Content Preview Section
 *
 * Shows content preview with smart truncation for mobile
 */
function ContentPreviewSection({
  content,
  accessState,
  isLoading
}: {
  content: Content | undefined
  accessState: ContentAccessState
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!content) return null

  return (
    <Card>
      <CardContent className="p-4">
        {accessState.status === 'accessible' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">You have access to this content</span>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Content preview would be displayed here. This could include rich text content,
                embedded media, and interactive elements from IPFS...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Premium Content Preview</span>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {content.description || "This premium content includes valuable insights and detailed information that will help you understand the topic in depth. Purchase to unlock the complete content and gain full access..."}
              </p>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Continue reading after purchase →
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Creator Info Card
 *
 * Mobile-optimized creator information with social proof
 */
function CreatorInfoCard({
  content,
  isLoading
}: {
  content: Content | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!content) return null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm truncate">
                {formatAddress(content.creator)}
              </h3>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                <Shield className="h-3 w-3 mr-1" />
                Creator
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Published {formatRelativeTime(content.creationTime)}
            </p>
          </div>

          <Button variant="outline" size="sm" className="flex-shrink-0">
            Follow
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Social Actions Bar
 *
 * Mobile-optimized action buttons with clear CTAs
 */
function SocialActionsBar({
  contentId,
  contentData,
  accessState,
  onViewContent,
  onPurchaseClick
}: {
  contentId: bigint
  contentData: Content | undefined
  accessState: ContentAccessState
  onViewContent: () => void
  onPurchaseClick: () => void
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {accessState.status === 'accessible' ? (
            <Button
              onClick={onViewContent}
              className="flex-1 flex items-center gap-2"
              size="sm"
            >
              <Eye className="h-4 w-4" />
              View Full Content
            </Button>
          ) : (
            <Button
              onClick={onPurchaseClick}
              className="flex-1 flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80"
              size="sm"
            >
              <Zap className="h-4 w-4" />
              Unlock for {contentData ? formatCurrency(contentData.payPerViewPrice, 6, 'USDC') : '...'}
            </Button>
          )}

          <V2MiniAppSmartMessagingButton
            creatorAddress={contentData?.creator as `0x${string}` || '0x0000000000000000000000000000000000000000'}
            contentId={contentId.toString()}
            context="general"
            variant="outline"
            size="sm"
            className="px-3"
            showUnreadBadge={true}
            autoNavigate={true}
          />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Purchase Card Modal
 *
 * Mobile-optimized purchase interface
 */
function PurchaseCardModal({
  contentId,
  contentData,
  userAddress,
  onPurchaseSuccess,
  onClose
}: {
  contentId: bigint
  contentData?: Content
  userAddress?: `0x${string}`
  onPurchaseSuccess: () => void
  onClose: () => void
}) {
  // V2 Payment Modal integration for purchase modal
  const paymentModal = useV2PaymentModal({
    contentId,
    creator: (contentData?.creator as `0x${string}`) || '0x0000000000000000000000000000000000000000',
    title: contentData?.title || 'Premium Content',
    description: contentData?.description,
    onSuccess: (txHash) => {
      console.log('Purchase modal payment successful:', txHash)
      onPurchaseSuccess()
      onClose()
    },
    onError: (error) => {
      console.error('Purchase modal payment failed:', error)
    }
  })
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 rounded-t-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-6">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">Unlock Premium Content</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Instant access after purchase</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800">
              ×
            </Button>
          </div>

          {/* Content Preview Card */}
          {contentData && (
            <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-5 border border-white/50 dark:border-gray-700/50 shadow-lg">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                    "{contentData.title}"
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                    {contentData.description}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    Premium Content
                  </Badge>
                  <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
                    {formatCurrency(contentData.payPerViewPrice, 6, 'USDC')}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Social Sharing Encouragement */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Share2 className="h-4 w-4 text-white" />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-green-800 dark:text-green-300 text-sm">
                  💡 Share your discovery!
                </h5>
                <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                  After unlocking this content, share it with your network to help others discover amazing creators and earn social engagement rewards!
                </p>
              </div>
            </div>
          </div>

          {/* V2 Purchase Button with Post-Purchase Messaging */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/30">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold">Ready to unlock?</h4>
                <p className="text-sm text-muted-foreground">
                  Get instant access and connect with the creator
                </p>
              </div>
              
              {/* V2 Purchase Button with integrated messaging */}
              <V2MiniAppPurchaseButton
                contentId={contentId}
                creator={(contentData?.creator as `0x${string}`) || '0x0000000000000000000000000000000000000000'}
                title={contentData?.title || 'Premium Content'}
                variant="primary"
                size="lg"
                showPricing={true}
                showLoyaltyDiscount={true}
                enablePostPurchaseMessaging={true}
                className="w-full"
                onSuccess={(txHash) => {
                  console.log('Content page purchase successful:', txHash)
                  onPurchaseSuccess()
                  onClose()
                }}
                onError={(error) => {
                  console.error('Content page purchase failed:', error)
                }}
              />
            </div>
          </div>

          {/* Benefits Footer */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Instant Access</p>
              </div>
              <div className="space-y-1">
                <Shield className="h-6 w-6 text-blue-500 mx-auto" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Secure Payment</p>
              </div>
              <div className="space-y-1">
                <Star className="h-6 w-6 text-yellow-500 mx-auto" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Premium Quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Access Status Badge
 *
 * Visual indicator of content access status
 */
function AccessStatusBadge({ status }: { status: ContentAccessState['status'] }) {
  switch (status) {
    case 'accessible':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
          <CheckCircle className="h-3 w-3 mr-1" />
          Unlocked
        </Badge>
      )
    case 'purchase_required':
      return (
        <Badge variant="secondary" className="text-xs">
          <Lock className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      )
    case 'loading':
      return (
        <Badge variant="outline" className="text-xs">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Loading
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      )
    default:
      return null
  }
}

/**
 * Error Fallback Component
 */
function ContentDisplayErrorFallback({
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
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading this content. Please try again.
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
function ContentDisplayLoadingSkeleton() {
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
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * MiniApp Content Display Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppContentDisplayPage({ params }: ContentDisplayPageProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ContentDisplayErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Content Display error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<ContentDisplayLoadingSkeleton />}>
        <MiniAppContentDisplayCore params={params} />
      </Suspense>
    </ErrorBoundary>
  )
}

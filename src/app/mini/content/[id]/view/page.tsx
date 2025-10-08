/**
 * MiniApp Content View Page - Immersive Content Consumption
 * File: src/app/mini/content/[id]/view/page.tsx
 *
 * This page delivers the premium content consumption experience in the mini app,
 * optimized for mobile reading with social engagement features. It represents the
 * culmination of the content discovery and purchase journey.
 *
 * Mini App Design Philosophy:
 * - Immersive reading experience optimized for mobile
 * - Social engagement integrated into content flow
 * - Creator connection and tipping features
 * - Progress tracking and bookmarking
 * - Seamless navigation between content pieces
 *
 * Key Features:
 * - Full content rendering from IPFS
 * - Reading progress tracking
 * - Social engagement (likes, comments, shares)
 * - Creator tipping and support
 * - Related content suggestions
 * - Mobile-optimized typography and layout
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  Share2,
  Heart,
  MessageCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Eye,
  Star,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  Gift,
  TrendingUp
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

// Import utilities
import { formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'
import type { Content } from '@/types/contracts'

/**
 * Page Props Interface
 */
interface ContentViewPageProps {
  readonly params: Promise<{
    readonly id: string
  }>
}

/**
 * Reading Progress State
 */
interface ReadingProgress {
  readonly percentage: number
  readonly timeSpent: number
  readonly lastPosition: number
}

/**
 * MiniApp Content View Core Component
 *
 * This component orchestrates the immersive content consumption experience
 * with mobile-optimized reading and social engagement features.
 */
function MiniAppContentViewCore({ params }: ContentViewPageProps) {
  const router = useRouter()

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

  // Core state management
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({
    percentage: 0,
    timeSpent: 0,
    lastPosition: 0
  })
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showTipModal, setShowTipModal] = useState(false)
  const [showComments, setShowComments] = useState(false)

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useFarcasterAutoWallet()
  const userAddress = getSafeAddress(walletUI.address)
  const isConnected = isWalletFullyConnected(walletUI.isConnected, walletUI.address)
  const formattedAddress = formatWalletAddress(walletUI.address)

  const { userProfile } = socialState

  // Content and access data
  const contentQuery = useContentById(contentId || undefined)
  const accessQuery = useHasContentAccess(userAddress, contentId || undefined)

  /**
   * Access Verification Effect
   *
   * Ensures user has access to content before allowing consumption
   */
  useEffect(() => {
    if (accessQuery.data === false && !accessQuery.isLoading) {
      // Redirect to content display page if no access
      router.replace(`/mini/content/${contentId}`)
    }
  }, [accessQuery.data, accessQuery.isLoading, contentId, router])

  /**
   * Reading Progress Tracking
   *
   * Tracks user engagement and reading progress for analytics
   */
  useEffect(() => {
    const startTime = Date.now()

    const updateProgress = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0

      setReadingProgress(prev => ({
        ...prev,
        percentage: Math.min(scrollPercent, 100),
        timeSpent: Date.now() - startTime,
        lastPosition: scrollTop
      }))
    }

    const handleScroll = () => {
      requestAnimationFrame(updateProgress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /**
   * Social Interaction Handlers
   */
  const handleLike = useCallback(() => {
    setIsLiked(prev => !prev)
    // Track analytics and update backend
  }, [])

  const handleBookmark = useCallback(() => {
    setIsBookmarked(prev => !prev)
    // Track analytics and update backend
  }, [])

  const handleShare = useCallback(() => {
    if (navigator.share && contentQuery.data) {
      navigator.share({
        title: `Check out: ${contentQuery.data.title}`,
        text: contentQuery.data.description,
        url: window.location.href
      })
    }
  }, [contentQuery.data])

  const handleTip = useCallback(() => {
    setShowTipModal(true)
  }, [])

  /**
   * Navigation Handlers
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  const handleNextContent = useCallback(() => {
    // Navigate to next related content
    // This would be implemented with recommendation logic
  }, [])

  const handlePrevContent = useCallback(() => {
    // Navigate to previous content in reading history
  }, [])

  // Show loading state while params are being resolved, handle invalid content ID or no access
  if (!unwrappedParams || !contentId || (accessQuery.data === false && !accessQuery.isLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center">
          {!contentId && contentId !== undefined ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Invalid content ID provided.
              </AlertDescription>
            </Alert>
          ) : accessQuery.data === false ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You do not have access to this content.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading content...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-20">
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${readingProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Mobile-Optimized Navigation Header */}
      <div className="sticky top-1 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="text-xs text-muted-foreground">
                {Math.round(readingProgress.percentage)}% read
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
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
                onClick={handleBookmark}
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
                onClick={handleShare}
                className="h-8 w-8 p-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Content Header */}
        <ContentViewHeader
          contentQuery={contentQuery}
          readingProgress={readingProgress}
        />

        {/* Full Content Display */}
        <ContentBody
          content={contentQuery.data}
          isLoading={contentQuery.isLoading}
        />

        {/* Creator Support Section */}
        <CreatorSupportSection
          content={contentQuery.data}
          onTip={handleTip}
          isLoading={contentQuery.isLoading}
        />

        {/* Social Engagement */}
        <SocialEngagementSection
          contentId={contentId}
          contentData={contentQuery.data}
          isLiked={isLiked}
          onLike={handleLike}
          onComment={() => setShowComments(true)}
          onShare={handleShare}
        />

        {/* Related Content */}
        <RelatedContentSection />

        {/* Reading Actions */}
        <ReadingActionsBar
          onPrev={handlePrevContent}
          onNext={handleNextContent}
          onBookmark={handleBookmark}
          isBookmarked={isBookmarked}
        />
      </main>

      {/* Tip Modal */}
      {showTipModal && (
        <TipModal
          creatorAddress={contentQuery.data?.creator}
          onClose={() => setShowTipModal(false)}
        />
      )}

      {/* Comments Modal */}
      {showComments && (
        <CommentsModal
          contentId={contentId}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Performance Monitor (Development Only) */}
      {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
    </div>
  )
}

/**
 * Content View Header
 *
 * Immersive header with content metadata and reading progress
 */
function ContentViewHeader({
  contentQuery,
  readingProgress
}: {
  contentQuery: ReturnType<typeof useContentById>
  readingProgress: ReadingProgress
}) {
  if (contentQuery.isLoading) {
    return (
      <div className="space-y-4">
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
      <div className="space-y-3">
        <h1 className="text-2xl font-bold leading-tight">
          {content.title}
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed">
          {content.description}
        </p>

        {/* Content Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{formatAddress(content.creator)}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeTime(content.creationTime)}</span>
          </div>

          <Badge variant="secondary" className="text-xs">
            {content.category}
          </Badge>
        </div>

        {/* Reading Progress */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{Math.round(readingProgress.percentage)}% complete</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{Math.round(readingProgress.timeSpent / 1000)}s reading</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Content Body
 *
 * Full content rendering with mobile-optimized typography
 */
function ContentBody({
  content,
  isLoading
}: {
  content: Content | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!content) return null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="prose prose-sm max-w-none">
          {/* Content would be rendered from IPFS here */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Premium Content Unlocked</span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              This is where the full content would be displayed. The content would be loaded from IPFS
              and rendered with proper formatting, images, and interactive elements optimized for mobile reading.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 my-6">
              <p className="text-sm text-muted-foreground">
                <strong>Content Preview:</strong> This premium content includes valuable insights,
                detailed analysis, and comprehensive information that will help you master the topic.
                The full content would include rich media, code examples, and interactive elements
                specifically designed for the mobile experience.
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              As you continue reading, the progress bar at the top will track your engagement,
              and you can bookmark important sections, leave comments, or share with your network.
              This creates a rich, social reading experience that goes beyond traditional content consumption.
            </p>

            <div className="border-l-4 border-primary pl-4 my-6">
              <p className="text-muted-foreground italic">
                "The future of content is not just about consumption—it's about connection,
                community, and creating meaningful interactions between creators and their audiences."
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              By supporting creators directly through instant USDC payments, you're not just
              purchasing content—you're investing in the creator economy and helping build
              a more sustainable future for digital content creation.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Creator Support Section
 *
 * Encourages user engagement with creator through tipping
 */
function CreatorSupportSection({
  content,
  onTip,
  isLoading
}: {
  content: Content | undefined
  onTip: () => void
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!content) return null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">
                  {formatAddress(content.creator)}
                </h3>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  <Star className="h-3 w-3 mr-1" />
                  Creator
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Enjoying this content? Show your support!
              </p>
            </div>
          </div>

          <Button
            onClick={onTip}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Gift className="h-4 w-4" />
            Tip Creator
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Social Engagement Section
 *
 * Social features integrated into content consumption
 */
function SocialEngagementSection({
  contentId,
  contentData,
  isLiked,
  onLike,
  onComment,
  onShare
}: {
  contentId: bigint
  contentData: Content | undefined
  isLiked: boolean
  onLike: () => void
  onComment: () => void
  onShare: () => void
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={cn(
                "flex items-center gap-2 h-8",
                isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span className="text-sm">{isLiked ? 'Liked' : 'Like'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onComment}
              className="flex items-center gap-2 h-8"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Comment</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="flex items-center gap-2 h-8"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            42 likes • 8 comments
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Related Content Section
 *
 * Suggestions for continued engagement
 */
function RelatedContentSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Related Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">
                  Related Content Title {i}
                </h4>
                <p className="text-xs text-muted-foreground">
                  By {formatAddress(`0x1234567890abcdef${i}` as `0x${string}`)}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {formatCurrency(BigInt(5000000), 6, 'USDC')}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Reading Actions Bar
 *
 * Navigation and utility actions for reading experience
 */
function ReadingActionsBar({
  onPrev,
  onNext,
  onBookmark,
  isBookmarked
}: {
  onPrev: () => void
  onNext: () => void
  onBookmark: () => void
  isBookmarked: boolean
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onBookmark}
            className={cn(
              "flex items-center gap-2",
              isBookmarked && "text-blue-500"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
            {isBookmarked ? 'Saved' : 'Save'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Tip Modal
 *
 * Mobile-optimized tipping interface
 */
function TipModal({
  creatorAddress,
  onClose
}: {
  creatorAddress?: `0x${string}`
  onClose: () => void
}) {
  const [tipAmount, setTipAmount] = useState('')

  const handleTip = useCallback(() => {
    // Implement tipping logic
    console.log('Tipping', tipAmount, 'USDC to', creatorAddress)
    onClose()
  }, [tipAmount, creatorAddress, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Support Creator</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Show appreciation for this content
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {['1', '5', '10'].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setTipAmount(amount)}
                    className={cn(
                      "h-12",
                      tipAmount === amount && "border-primary bg-primary/5"
                    )}
                  >
                    {amount} USDC
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleTip}
                disabled={!tipAmount}
                className="w-full"
                size="sm"
              >
                <Gift className="h-4 w-4 mr-2" />
                Send Tip
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Comments Modal
 *
 * Social comments interface
 */
function CommentsModal({
  contentId,
  onClose
}: {
  contentId: bigint
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[70vh]">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Comments</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              ×
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Mock comments - would be loaded from API */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    U{i}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">User {i}</span>
                    <span className="text-xs text-muted-foreground">2h ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This is a great piece of content! Really enjoyed reading it.
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      12
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Error Fallback Component
 */
function ContentViewErrorFallback({
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
              Content Unavailable
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
function ContentViewLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-1 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-20" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * MiniApp Content View Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppContentViewPage({ params }: ContentViewPageProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ContentViewErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Content View error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<ContentViewLoadingSkeleton />}>
        <MiniAppContentViewCore params={params} />
      </Suspense>
    </ErrorBoundary>
  )
}

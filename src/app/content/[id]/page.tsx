/**
 * Content Display Page with Integrated Purchase Functionality - Fix 1 Integration
 * File: src/app/content/[id]/page.tsx
 * 
 * This page demonstrates the complete integration of the enhanced ContentPurchaseCard
 * within a content display context. It shows how the purchase functionality seamlessly
 * integrates with content viewing, providing users with a smooth experience from
 * discovery through purchase to content consumption.
 * 
 * Key Integration Features:
 * - Dynamic content loading with proper error handling
 * - Integrated purchase flow with the enhanced ContentPurchaseCard
 * - Access-based content display with purchase prompts
 * - Proper state management and user feedback
 * - SEO optimization and social sharing preparation
 */

'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  ArrowLeft,
  Share2,
  Bookmark,
  Flag,
  Eye,
  Calendar,
  Tag,
  User,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
  Alert,
  AlertDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Skeleton
} from '@/components/ui/index'

// Import layout components
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'

// Import the enhanced ContentPurchaseCard
import { ContentPurchaseCard } from '@/components/web3/ContentPurchaseCard'

// Import business logic hooks
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'

// Import utility functions
import { cn, formatCurrency, formatRelativeTime, formatAddress, formatContentCategory } from '@/lib/utils'
import type { Content } from '@/types/contracts'

/**
 * Page Props Interface
 * 
 * This interface defines the structure of props passed from Next.js App Router
 * to our dynamic content page, ensuring type safety for route parameters.
 */
interface ContentDisplayPageProps {
  readonly params: Promise<{
    readonly id: string
  }>
}

/**
 * Content Access State Interface
 * 
 * This interface manages the various states of content access, providing
 * clear distinctions between loading, accessible, and restricted content.
 */
interface ContentAccessState {
  readonly status: 'loading' | 'accessible' | 'purchase_required' | 'error'
  readonly message: string
  readonly showPurchaseCard: boolean
}

/**
 * ContentDisplayPage Component
 * 
 * This page component orchestrates the complete content viewing and purchasing
 * experience. It demonstrates how the enhanced ContentPurchaseCard integrates
 * seamlessly within a content consumption workflow, providing users with
 * clear paths to access premium content.
 */
export default function ContentDisplayPage({ params }: ContentDisplayPageProps) {
  const router = useRouter()
  const { address: userAddress, isConnected } = useAccount()
  
  // Unwrap params using React.use() for Next.js 15 compatibility
  const unwrappedParams = React.use(params) as { readonly id: string }
  
  // Parse and validate content ID from route parameters
  const contentId = useMemo(() => {
    try {
      const id = BigInt(unwrappedParams.id)
      if (id <= 0) throw new Error('Invalid content ID')
      return id
    } catch {
      return undefined
    }
  }, [unwrappedParams.id])

  // Core data hooks for content information and access control
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)
  
  // Local state for purchase success tracking
  const [purchaseCompleted, setPurchaseCompleted] = useState(false)

  /**
   * Content Access State Computation
   * 
   * This computed value determines the current access state and appropriate
   * user interface elements to display based on content availability and
   * user access permissions.
   */
  const accessState = useMemo((): ContentAccessState => {
    // Handle loading states
    if (contentQuery.isLoading || accessQuery.isLoading) {
      return {
        status: 'loading',
        message: 'Loading content...',
        showPurchaseCard: false
      }
    }

    // Handle content loading errors
    if (contentQuery.error || !contentQuery.data) {
      return {
        status: 'error',
        message: 'Content not found or failed to load',
        showPurchaseCard: false
      }
    }

    // Handle content that is not active
    if (!contentQuery.data.isActive) {
      return {
        status: 'error',
        message: 'This content is no longer available',
        showPurchaseCard: false
      }
    }

    // User has access to content (either purchased or owns it)
    if (accessQuery.data === true || purchaseCompleted) {
      return {
        status: 'accessible',
        message: 'You have access to this content',
        showPurchaseCard: false
      }
    }

    // User needs to purchase content to access it
    return {
      status: 'purchase_required',
      message: 'Purchase required to access this content',
      showPurchaseCard: true
    }
  }, [contentQuery, accessQuery, purchaseCompleted])

  /**
   * Purchase Success Handler
   * 
   * This function manages the post-purchase experience, updating local state
   * and providing user feedback when a purchase is successfully completed.
   */
  const handlePurchaseSuccess = React.useCallback(() => {
    setPurchaseCompleted(true)
    
    // Refresh access query to ensure UI reflects new access state
    accessQuery.refetch()
    
    // Show success feedback (could integrate with toast system)
    console.log('Purchase completed successfully!')
  }, [accessQuery])

  /**
   * Content View Handler
   * 
   * This function manages navigation to the full content view once users
   * have confirmed access to the content.
   */
  const handleViewContent = React.useCallback(() => {
    if (accessState.status === 'accessible') {
      // Navigate to full content view or unlock content display
      router.push(`/content/${contentId}/view`)
    }
  }, [accessState.status, router, contentId])

  /**
   * Navigation Handler
   * 
   * This function provides users with a way to return to content discovery
   * or their previous location in the application.
   */
  const handleGoBack = React.useCallback(() => {
    router.back()
  }, [router])

  // Handle invalid content ID
  if (!contentId) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid content ID provided. Please check the URL and try again.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <RouteGuards requiredLevel='public'>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Navigation Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/browse">Browse Content</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {contentQuery.data?.title || `Content ${contentId}`}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Back Navigation */}
          <div className="mb-6">
            <Button variant="ghost" onClick={handleGoBack} className="p-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              <ContentHeaderSection
                contentQuery={contentQuery}
                accessState={accessState}
              />

              <ContentPreviewSection
                content={contentQuery.data}
                accessState={accessState}
                isLoading={contentQuery.isLoading}
              />

              <ContentMetadataSection
                content={contentQuery.data}
                isLoading={contentQuery.isLoading}
              />
            </div>

            {/* Sidebar with Purchase Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                {/* Purchase Card Integration */}
                {accessState.showPurchaseCard && contentId && (
                  <ContentPurchaseCard
                    contentId={contentId}
                    userAddress={userAddress}
                    onPurchaseSuccess={handlePurchaseSuccess}
                    onViewContent={handleViewContent}
                    variant="full"
                    className="w-full"
                  />
                )}

                {/* Access Status Card */}
                {!accessState.showPurchaseCard && (
                  <AccessStatusCard
                    accessState={accessState}
                    onViewContent={handleViewContent}
                    isConnected={isConnected}
                  />
                )}

                {/* Content Actions */}
                <ContentActionsCard contentId={contentId} />
              </div>
            </div>
          </div>
        </div>
      </RouteGuards>
    </AppLayout>
  )
}

/**
 * Content Header Section Component
 * 
 * This component displays the main content information including title,
 * description, and access status indicators.
 */
function ContentHeaderSection({
  contentQuery,
  accessState
}: {
  contentQuery: {
    readonly isLoading: boolean
    readonly data?: Content
  }
  accessState: ContentAccessState
}) {
  if (contentQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!contentQuery.data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {accessState.message}
        </AlertDescription>
      </Alert>
    )
  }

  const content = contentQuery.data

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold mb-2">
              {content.title}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {content.description}
            </CardDescription>
          </div>
          
          <div className="ml-4">
            <AccessStatusBadge accessState={accessState} />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>{formatAddress(content.creator)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{formatCurrency(content.payPerViewPrice, 6, 'USDC')}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

/**
 * Content Preview Section Component
 * 
 * This component shows a preview of the content or prompts for purchase
 * based on the user's access status.
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
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        {accessState.status === 'accessible' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">You have access to this content</span>
            </div>
            
            {/* This would show the actual content */}
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-4">
                Content preview would be displayed here. This could include:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Rich text content from IPFS</li>
                <li>Embedded media and images</li>
                <li>Interactive elements</li>
                <li>Downloadable resources</li>
              </ul>
              
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  🎉 Premium content unlocked! You now have full access to this content.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Premium Content
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              This content requires purchase to access. Complete your purchase 
              using the card on the right to unlock full access.
            </p>
            
            {/* Content teaser */}
            <div className="bg-gray-50 rounded-lg p-6 text-left max-w-md mx-auto">
              <p className="text-gray-600 text-sm leading-relaxed">
                This premium content includes valuable insights and detailed information
                that will help you understand the topic in depth. Purchase to unlock
                the complete content and gain full access...
              </p>
              <div className="mt-4 text-center">
                <span className="text-gray-400 font-medium">
                  Continue reading after purchase →
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Content Metadata Section Component
 * 
 * This component displays additional information about the content such as
 * category, tags, and creation details.
 */
function ContentMetadataSection({
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
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-18" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!content) return null

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Content Details
        </h3>
        
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-600">Category:</span>
            <Badge variant="secondary" className="ml-2">
              {formatContentCategory(content.category)}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Published: {formatRelativeTime(content.creationTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>Creator: {formatAddress(content.creator)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Access Status Card Component
 * 
 * This component displays the current access status when purchase is not required.
 */
function AccessStatusCard({
  accessState,
  onViewContent,
  isConnected
}: {
  accessState: ContentAccessState
  onViewContent: () => void
  isConnected: boolean
}) {
  const getStatusIcon = () => {
    switch (accessState.status) {
      case 'accessible':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Lock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (accessState.status) {
      case 'accessible':
        return 'bg-green-50 border-green-200'
      case 'loading':
        return 'bg-blue-50 border-blue-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className={cn('rounded-lg p-4 text-center', getStatusColor())}>
          <div className="flex justify-center mb-3">
            {getStatusIcon()}
          </div>
          
          <h3 className="font-semibold mb-2">
            {accessState.status === 'accessible' ? 'Access Granted' :
             accessState.status === 'loading' ? 'Checking Access' :
             accessState.status === 'error' ? 'Access Error' : 'Access Required'}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {accessState.message}
          </p>
          
          {accessState.status === 'accessible' && (
            <Button onClick={onViewContent} className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Full Content
            </Button>
          )}
          
          {!isConnected && accessState.status !== 'accessible' && (
            <p className="text-xs text-gray-500 mt-2">
              Connect your wallet to check access status
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Content Actions Card Component
 * 
 * This component provides additional actions users can take with content.
 */
function ContentActionsCard({ contentId }: { contentId: bigint }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">Actions</h3>
        
        <div className="space-y-3">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Share2 className="h-4 w-4 mr-2" />
            Share Content
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Bookmark className="h-4 w-4 mr-2" />
            Save for Later
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start text-red-600 hover:text-red-700">
            <Flag className="h-4 w-4 mr-2" />
            Report Content
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Access Status Badge Component
 * 
 * This component displays a visual indicator of the content access status.
 */
function AccessStatusBadge({ accessState }: { accessState: ContentAccessState }) {
  switch (accessState.status) {
    case 'accessible':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accessible
        </Badge>
      )
    case 'purchase_required':
      return (
        <Badge variant="secondary">
          <Lock className="h-3 w-3 mr-1" />
          Purchase Required
        </Badge>
      )
    case 'loading':
      return (
        <Badge variant="outline">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Loading
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      )
    default:
      return null
  }
}
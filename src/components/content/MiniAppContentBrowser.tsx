// src/components/content/MiniAppContentBrowser.tsx
'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Grid3x3,
  Sparkles
} from 'lucide-react'

// Import UI components following your existing patterns
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Import business logic hooks following your established architecture
import { useMiniKitAvailable, useFarcasterContext } from '@/components/providers/MiniKitProvider'
import { 
  useActiveContentPaginated, 
  useContentById 
} from '@/hooks/contracts/core'
import { MiniAppPurchaseButton } from '@/components/commerce/MiniAppPurchaseButton'

// Import utilities following your existing patterns
import { cn, formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'
import { ContentCategory, categoryToString } from '@/types/contracts'

/**
 * Content Item Interface
 * 
 * This interface defines the structure of content items as returned by your
 * contract hooks, ensuring type safety throughout the component.
 */
interface ContentItem {
  readonly id: bigint
  readonly title: string
  readonly description: string
  readonly creator: `0x${string}`
  readonly payPerViewPrice: bigint
  readonly category: ContentCategory
  readonly creationTime: bigint
  readonly isActive: boolean
}

/**
 * MiniApp Content Browser Props
 * 
 * This interface defines the configuration options for the component,
 * allowing for flexible usage across different contexts.
 */
interface MiniAppContentBrowserProps {
  /** Optional class name for custom styling */
  readonly className?: string
  /** Number of content items per page */
  readonly itemsPerPage?: number
  /** Whether to show creator information prominently */
  readonly showCreatorInfo?: boolean
  /** Optional callback when content is selected */
  readonly onContentSelect?: (contentId: bigint) => void
}

/**
 * Content Card Component
 * 
 * This component renders individual content items with MiniApp-specific
 * enhancements while maintaining compatibility with web users.
 */
function ContentCard({
  contentId,
  userAddress,
  showCreatorInfo,
  isMiniApp,
  farcasterUser,
  onContentSelect
}: {
  contentId: bigint
  userAddress?: `0x${string}`
  showCreatorInfo: boolean
  isMiniApp: boolean
  farcasterUser: any
  onContentSelect?: (contentId: bigint) => void
}) {
  // Fetch content data using your existing hook
  const contentQuery = useContentById(contentId)

  // Handle content selection
  const handleContentClick = useCallback(() => {
    if (onContentSelect) {
      onContentSelect(contentId)
    }
  }, [contentId, onContentSelect])

  // Loading state
  if (contentQuery.isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="aspect-video bg-muted animate-pulse" />
        <CardHeader>
          <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-4 bg-muted animate-pulse rounded w-full" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (contentQuery.isError || !contentQuery.data) {
    return (
      <Card className="overflow-hidden border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load content</p>
        </CardContent>
      </Card>
    )
  }

  const content = contentQuery.data

  return (
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer",
        isMiniApp && "miniapp-card ring-1 ring-blue-100"
      )}
      onClick={handleContentClick}
    >
      {/* Content Thumbnail/Preview */}
      <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center relative">
        <Eye className="h-12 w-12 text-blue-400" />
        {isMiniApp && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-blue-100 text-blue-700"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Social
          </Badge>
        )}
      </div>
      
      {/* Content Header */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{content.title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {categoryToString(content.category)}
          </Badge>
        </div>
      </CardHeader>
      
      {/* Content Details */}
      <CardContent className="pt-0 space-y-3">
        <CardDescription className="line-clamp-2">
          {content.description}
        </CardDescription>
        
        {/* Creator Information */}
        {showCreatorInfo && (
          <div className="flex items-center gap-2 text-sm">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {formatAddress(content.creator).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">
              by {formatAddress(content.creator)}
            </span>
          </div>
        )}
        
        {/* Price and Time */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-green-600">
            {formatCurrency(content.payPerViewPrice)}
          </span>
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(content.creationTime)}
          </span>
        </div>
        
        {/* MiniApp-specific social context */}
        {isMiniApp && farcasterUser && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700">
                Browsing via <span className="font-medium">@{farcasterUser.username}</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Purchase Button */}
      <CardFooter className="pt-0">
        <MiniAppPurchaseButton
          contentId={contentId}
          title={content.title}
          userAddress={userAddress}
        />
      </CardFooter>
    </Card>
  )
}

/**
 * Loading Grid Component
 * 
 * This component provides skeleton loading states that match the
 * grid layout structure for smooth loading experiences.
 */
function LoadingGrid({ itemsPerPage }: { itemsPerPage: number }) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: itemsPerPage }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-video bg-muted animate-pulse" />
          <CardHeader>
            <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            <div className="h-8 bg-muted animate-pulse rounded w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Error State Component
 * 
 * This component handles error scenarios with clear messaging
 * and recovery options for users.
 */
function ErrorState({ 
  error, 
  onRetry 
}: { 
  error: Error
  onRetry: () => void 
}) {
  return (
    <div className="text-center py-12">
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="mt-2">
          <p className="font-medium mb-2">Unable to load content</p>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || 'There was an error loading content. Please try again.'}
          </p>
          <Button onClick={onRetry} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/**
 * Empty State Component
 * 
 * This component handles cases where no content is available
 * with appropriate messaging and suggested actions.
 */
function EmptyState({ isMiniApp }: { isMiniApp: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Grid3x3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No content available</h3>
        <p className="text-muted-foreground mb-4">
          {isMiniApp 
            ? "There's no content to browse right now. Check back later for new uploads!"
            : "There's no content available at the moment. Consider becoming a creator to start sharing your content!"
          }
        </p>
        {!isMiniApp && (
          <Button variant="outline" className="mt-2">
            <Users className="h-4 w-4 mr-2" />
            Become a Creator
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * MiniApp Content Browser Component
 * 
 * This component provides an enhanced content browsing experience optimized
 * for both MiniApp and web contexts. It integrates with your existing content
 * discovery infrastructure while adding social features for MiniApp users.
 * 
 * Key Features:
 * - Responsive grid layout optimized for different screen sizes
 * - MiniApp-specific UI enhancements and social context
 * - Integration with existing content hooks and purchase flows
 * - Comprehensive error handling and loading states
 * - Pagination support for large content catalogs
 * - Social proof and engagement features for MiniApp users
 * 
 * Architecture Integration:
 * - Uses your existing content hooks (useActiveContentPaginated, useContentById)
 * - Integrates with MiniAppPurchaseButton for purchase flows
 * - Follows established UI component and styling patterns
 * - Maintains compatibility with existing error handling systems
 * - Leverages MiniApp context for enhanced social features
 */
export function MiniAppContentBrowser({
  className,
  itemsPerPage = 12,
  showCreatorInfo = true,
  onContentSelect
}: MiniAppContentBrowserProps) {
  // ===== CORE DEPENDENCIES AND CONTEXT =====
  
  // MiniApp environment and user context
  const isMiniApp = useMiniKitAvailable()
  const farcasterCtx = useFarcasterContext()
  const farcasterUser = farcasterCtx?.user
  const isReady = true
  const setReady = () => {}
  
  // Wallet connection for user address
  const { address: userAddress } = useAccount()
  
  // ===== STATE MANAGEMENT =====
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  
  // ===== CONTENT DATA FETCHING =====
  
  // Fetch paginated content using your existing hook
  const contentQuery = useActiveContentPaginated(
    currentPage * itemsPerPage,
    itemsPerPage
  )
  
  // ===== MINIAPP READINESS HANDLING =====
  
  // Signal readiness when component mounts in MiniApp environment
  useEffect(() => {
    if (isMiniApp && !isReady) {
      setReady()
    }
  }, [isMiniApp, isReady, setReady])
  
  // ===== EVENT HANDLERS =====
  
  // Handle pagination
  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1))
  }, [])
  
  const handleNextPage = useCallback(() => {
    if (contentQuery.data && contentQuery.data.contentIds.length === itemsPerPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [contentQuery.data, itemsPerPage])
  
  // Handle retry for error states
  const handleRetry = useCallback(() => {
    contentQuery.refetch()
  }, [contentQuery])
  
  // ===== COMPUTED VALUES =====
  
  // Calculate pagination state
  const paginationState = useMemo(() => {
    const hasContent = Boolean(contentQuery.data && contentQuery.data.contentIds.length > 0)
    const canGoNext = hasContent && (contentQuery.data?.contentIds.length === itemsPerPage)
    const canGoPrev = currentPage > 0
    const totalItems = contentQuery.data?.total || BigInt(0)
    
    return {
      hasContent,
      canGoNext,
      canGoPrev,
      totalItems,
      currentStart: currentPage * itemsPerPage + 1,
      currentEnd: Math.min((currentPage + 1) * itemsPerPage, Number(totalItems))
    }
  }, [contentQuery.data, currentPage, itemsPerPage])
  
  // ===== RENDER LOGIC =====
  
  // Loading state
  if (contentQuery.isLoading) {
    return (
      <div className={cn("w-full space-y-6", className)}>
        {/* Header with loading state */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-6 bg-muted animate-pulse rounded w-32" />
            <div className="h-4 bg-muted animate-pulse rounded w-48" />
          </div>
          {isMiniApp && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Sparkles className="h-3 w-3 mr-1" />
              MiniApp
            </Badge>
          )}
        </div>
        
        {/* Loading grid */}
        <LoadingGrid itemsPerPage={itemsPerPage} />
      </div>
    )
  }
  
  // Error state
  if (contentQuery.isError) {
    return (
      <div className={cn("w-full", className)}>
        {contentQuery.error && <ErrorState error={contentQuery.error} onRetry={handleRetry} />}
      </div>
    )
  }
  
  // Empty state
  if (!contentQuery.data || contentQuery.data.contentIds.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <EmptyState isMiniApp={isMiniApp} />
      </div>
    )
  }
  
  // Main content render
  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {isMiniApp ? 'Discover Content' : 'Browse Content'}
          </h2>
          <p className="text-muted-foreground">
            {isMiniApp && farcasterUser 
              ? `Browsing as @${farcasterUser.username} • ${paginationState.totalItems} items available`
              : `${paginationState.totalItems} content items available`
            }
          </p>
        </div>
        
        {/* MiniApp indicator */}
        {isMiniApp && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Sparkles className="h-3 w-3 mr-1" />
            MiniApp
          </Badge>
        )}
      </div>
      
      {/* Content Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {contentQuery.data.contentIds.map((contentId) => (
          <ContentCard
            key={contentId.toString()}
            contentId={contentId}
            userAddress={userAddress}
            showCreatorInfo={showCreatorInfo}
            isMiniApp={isMiniApp}
            farcasterUser={farcasterUser}
            onContentSelect={onContentSelect}
          />
        ))}
      </div>
      
      {/* Pagination Controls */}
      {(paginationState.canGoPrev || paginationState.canGoNext) && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {paginationState.currentStart}-{paginationState.currentEnd} of {paginationState.totalItems.toString()} items
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!paginationState.canGoPrev}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!paginationState.canGoNext}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
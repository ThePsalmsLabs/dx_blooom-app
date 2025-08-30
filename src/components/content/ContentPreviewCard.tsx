'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye,
  Lock,
  Unlock,
  User,
  Clock,
  DollarSign,
  ArrowRight,
  Tag
} from 'lucide-react'
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

import { useContentById, useHasContentAccess, useCreatorProfile } from '@/hooks/contracts/core'
import { ContentCategory, categoryToString } from '@/types/contracts'
import { formatCurrency, formatRelativeTime, formatAddress, cn } from '@/lib/utils'

/**
 * Content Preview Card Props
 */
interface ContentPreviewCardProps {
  /** Content ID to display */
  contentId: bigint
  /** View mode for different layouts */
  viewMode?: 'grid' | 'list' | 'compact'
  /** Whether to show creator information */
  showCreatorInfo?: boolean
  /** Additional CSS classes */
  className?: string
  /** User address for access control */
  userAddress?: string
}

/**
 * Content Preview Card Component
 *
 * Displays content preview information with a call-to-action to view the full content
 * on the dedicated content page. Does NOT include purchase functionality.
 */
export function ContentPreviewCard({
  contentId,
  viewMode = 'grid',
  showCreatorInfo = true,
  className,
  userAddress
}: ContentPreviewCardProps) {
  const router = useRouter()

  // Get content data and access control information
  const contentQuery = useContentById(contentId)
  const accessControl = useHasContentAccess(
    userAddress as `0x${string}` | undefined,
    contentId,
  )
  const creatorProfile = useCreatorProfile(contentQuery.data?.creator)

  // Handle view content navigation
  const handleViewContent = useCallback(() => {
    router.push(`/content/${contentId}`)
  }, [router, contentId])

  // Loading state for individual cards
  if (contentQuery.isLoading) {
    return <ContentPreviewCardSkeleton viewMode={viewMode} />
  }

  // Error state for individual cards
  if (contentQuery.error || !contentQuery.data) {
    return <ContentPreviewCardError />
  }

  const content = contentQuery.data
  const hasAccess = accessControl.data

  // List view layout
  if (viewMode === 'list') {
    return (
      <Card className={cn(
        "overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group",
        "border-border/50 hover:border-primary/30",
        className
      )} onClick={handleViewContent}>
        <div className="flex">
          {/* Content Thumbnail/Icon */}
          <div className="w-32 h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center flex-shrink-0 relative">
            <Eye className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="absolute top-2 right-2">
              <AccessStatusBadge hasAccess={hasAccess} />
            </div>
          </div>

          {/* Content Information */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold line-clamp-1 text-lg group-hover:text-primary transition-colors">
                    {content.title}
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {content.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {categoryToString(content.category)}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(content.creationTime)}</span>
                  </div>
                  {showCreatorInfo && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>by {formatAddress(content.creator)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold text-primary mb-2">
                  {formatCurrency(content.payPerViewPrice)}
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewContent()
                  }}
                  className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  View Content
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Compact view layout
  if (viewMode === 'compact') {
    return (
      <Card className={cn(
        "overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer group",
        "border-border/50 hover:border-primary/30",
        className
      )} onClick={handleViewContent}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center flex-shrink-0 relative">
              <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="absolute -top-1 -right-1">
                <AccessStatusBadge hasAccess={hasAccess} size="sm" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {content.title}
                </h3>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                {content.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    {categoryToString(content.category)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(content.payPerViewPrice)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewContent()
                  }}
                  className="text-xs px-2 py-1 h-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  View
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default grid view layout
  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group",
      "border-border/50 hover:border-primary/30",
      className
    )} onClick={handleViewContent}>
      {/* Content Thumbnail/Icon */}
      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative group-hover:from-primary/5 group-hover:to-primary/10 transition-colors">
        <Eye className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
        <div className="absolute top-3 right-3">
          <AccessStatusBadge hasAccess={hasAccess} />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base group-hover:text-primary transition-colors">
            {content.title}
          </CardTitle>
        </div>

        <CardDescription className="line-clamp-2 text-sm">
          {content.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            <Tag className="h-3 w-3 mr-1" />
            {categoryToString(content.category)}
          </Badge>
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            <DollarSign className="h-4 w-4" />
            {formatCurrency(content.payPerViewPrice)}
          </div>
        </div>

        {showCreatorInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-4 w-4">
              <AvatarFallback className="text-xs">
                {formatAddress(content.creator).slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span>by {formatAddress(content.creator)}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(content.creationTime)}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            handleViewContent()
          }}
        >
          View Full Content
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * Access Status Badge Component
 */
function AccessStatusBadge({
  hasAccess,
  size = 'default'
}: {
  hasAccess?: boolean
  size?: 'sm' | 'default'
}) {
  if (hasAccess === undefined) {
    return null
  }

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs'

  if (hasAccess) {
    return (
      <Badge variant="default" className={cn(
        "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
        sizeClasses
      )}>
        <Unlock className="h-3 w-3 mr-1" />
        Owned
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className={cn(
      "border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-50",
      sizeClasses
    )}>
      <Lock className="h-3 w-3 mr-1" />
      Premium
    </Badge>
  )
}

/**
 * Loading Skeleton Component
 */
export function ContentPreviewCardSkeleton({
  viewMode
}: {
  viewMode: 'grid' | 'list' | 'compact'
}) {
  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          <div className="w-32 h-32 bg-muted animate-pulse" />
          <div className="flex-1 p-6 space-y-3">
            <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            <div className="h-8 bg-muted animate-pulse rounded w-24" />
          </div>
        </div>
      </Card>
    )
  }

  if (viewMode === 'compact') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-3 bg-muted animate-pulse rounded w-full" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted animate-pulse" />
      <CardHeader>
        <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
        <div className="h-4 bg-muted animate-pulse rounded w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-8 bg-muted animate-pulse rounded w-full" />
      </CardContent>
    </Card>
  )
}

/**
 * Error State Component
 */
export function ContentPreviewCardError() {
  return (
    <Card className="text-center p-6 border-dashed border-red-200">
      <Eye className="h-8 w-8 text-red-500 mx-auto mb-2" />
      <p className="text-sm text-red-600">Failed to load content</p>
    </Card>
  )
}

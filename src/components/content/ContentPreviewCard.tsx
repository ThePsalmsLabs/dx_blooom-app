'use client'

import React, { useCallback, useState } from 'react'

import { useRouter } from 'next/navigation'
import {
  Eye,
  Lock,
  Unlock,
  User,
  Clock,
  DollarSign,
  ArrowRight,
  Tag,
  ChevronDown,
  ChevronUp
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

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

  // Truncate description to 100 characters and check if it needs "read more"
  const getTruncatedDescription = useCallback((description: string) => {
    if (!description) return { text: '', needsReadMore: false }

    const maxLength = 100
    if (description.length <= maxLength) {
      return { text: description, needsReadMore: false }
    }

    return {
      text: isDescriptionExpanded ? description : `${description.slice(0, maxLength)}...`,
      needsReadMore: description.length > maxLength
    }
  }, [isDescriptionExpanded])

  // Handle description expand/collapse
  const handleDescriptionToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click navigation
    setIsDescriptionExpanded(prev => !prev)
  }, [])

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
        "overflow-hidden cursor-pointer group relative",
        // Beautiful gradient border with glow effect
        "bg-gradient-to-br from-card via-card/95 to-card/90",
        "border-2 border-transparent bg-clip-padding",
        "before:absolute before:inset-0 before:rounded-lg before:p-[2px]",
        "before:bg-gradient-to-br before:from-primary/30 before:via-purple-500/20 before:to-primary/30",
        "before:content-[''] before:opacity-0 hover:before:opacity-100",
        "before:transition-opacity before:duration-300",
        // Enhanced shadow and glow effects
        "shadow-lg hover:shadow-xl hover:shadow-primary/20",
        "transition-all duration-300 ease-out",
        // Premium hover effects
        "hover:scale-[1.02] hover:-translate-y-1",
        "hover:bg-gradient-to-br hover:from-card hover:to-primary/5",
        className
      )} onClick={handleViewContent}>
        {/* Subtle inner glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

        <div className="flex relative z-10">
          {/* Content Thumbnail/Icon with enhanced styling */}
          <div className="w-32 h-32 bg-gradient-to-br from-primary/10 via-purple-500/5 to-primary/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Purchase indicator overlay */}
            <div className="absolute top-2 left-2">
              <div className="bg-gradient-to-r from-primary to-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                <DollarSign className="h-3 w-3 inline mr-1" />
                {hasAccess ? 'Owned' : 'Premium'}
              </div>
            </div>

            <Eye className="h-8 w-8 text-primary group-hover:text-primary/80 transition-colors relative z-10" />

            {/* Access status badge */}
            <div className="absolute top-2 right-2">
              <AccessStatusBadge hasAccess={hasAccess} />
            </div>

            {/* Animated corner accent */}
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content Information with enhanced styling */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold line-clamp-1 text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:from-primary group-hover:to-purple-600 transition-all duration-300">
                    {content.title}
                  </h3>
                  {/* Premium badge */}
                  <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary text-xs px-2 py-1 rounded-full border border-primary/30">
                    <Tag className="h-3 w-3 inline mr-1" />
                    {categoryToString(content.category)}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {(() => {
                    const { text, needsReadMore } = getTruncatedDescription(content.description)
                    return (
                      <div className="space-y-1">
                        <p className={isDescriptionExpanded ? '' : 'line-clamp-2'}>
                          {text}
                        </p>
                        {needsReadMore && (
                          <button
                            onClick={handleDescriptionToggle}
                            className="text-primary hover:text-primary/80 text-xs font-medium flex items-center gap-1 transition-colors hover:scale-105"
                          >
                            {isDescriptionExpanded ? (
                              <>
                                Read less <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                Read more <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })()}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(content.creationTime)}</span>
                  </div>
                  {showCreatorInfo && (
                    <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
                      <User className="h-3 w-3" />
                      <span>by {formatAddress(content.creator)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0 space-y-3">
                {/* Enhanced price display */}
                <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 px-4 py-2 rounded-lg border border-primary/20">
                  <div className="text-xs text-muted-foreground mb-1">Price</div>
                  <div className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {formatCurrency(content.payPerViewPrice)}
                  </div>
                </div>

                {/* Enhanced CTA button */}
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewContent()
                  }}
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Content
                  <ArrowRight className="h-4 w-4 ml-2" />
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
        "overflow-hidden cursor-pointer group relative",
        // Beautiful gradient border with glow effect
        "bg-gradient-to-br from-card via-card/95 to-card/90",
        "border-2 border-transparent bg-clip-padding",
        "before:absolute before:inset-0 before:rounded-lg before:p-[1px]",
        "before:bg-gradient-to-br before:from-primary/20 before:via-purple-500/15 before:to-primary/20",
        "before:content-[''] before:opacity-0 hover:before:opacity-100",
        "before:transition-opacity before:duration-300",
        // Enhanced shadow and glow effects
        "shadow-md hover:shadow-lg hover:shadow-primary/15",
        "transition-all duration-300 ease-out",
        // Premium hover effects
        "hover:scale-[1.01] hover:-translate-y-0.5",
        "hover:bg-gradient-to-br hover:from-card hover:to-primary/3",
        className
      )} onClick={handleViewContent}>
        {/* Subtle inner glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-purple-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

        <CardContent className="p-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 via-purple-500/5 to-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-purple-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Compact purchase indicator */}
              <div className="absolute -top-1 left-1">
                <div className="bg-gradient-to-r from-primary to-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium shadow-md text-[10px]">
                  {hasAccess ? '✓' : '$'}
                </div>
              </div>

              <Eye className="h-4 w-4 text-primary group-hover:text-primary/80 transition-colors relative z-10" />

              {/* Access status badge */}
              <div className="absolute -top-1 -right-1">
                <AccessStatusBadge hasAccess={hasAccess} size="sm" />
              </div>

              {/* Animated corner accent */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-gradient-to-tl from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm line-clamp-1 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text group-hover:from-primary group-hover:to-purple-600 transition-all duration-300">
                  {content.title}
                </h3>
                {/* Compact category badge */}
                <div className="bg-gradient-to-r from-primary/15 to-purple-500/15 text-primary text-xs px-1.5 py-0.5 rounded-full border border-primary/20 text-[10px]">
                  {categoryToString(content.category)}
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                {(() => {
                  const { text, needsReadMore } = getTruncatedDescription(content.description)
                  return (
                    <div className="space-y-1">
                      <p className={isDescriptionExpanded ? '' : 'line-clamp-1'}>
                        {text}
                      </p>
                      {needsReadMore && (
                        <button
                          onClick={handleDescriptionToggle}
                          className="text-primary hover:text-primary/80 text-xs font-medium flex items-center gap-1 transition-colors hover:scale-105"
                        >
                          {isDescriptionExpanded ? (
                            <>
                              Read less <ChevronUp className="h-2.5 w-2.5" />
                            </>
                          ) : (
                            <>
                              Read more <ChevronDown className="h-2.5 w-2.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })()}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Enhanced price display */}
                  <div className="bg-gradient-to-r from-primary/8 to-purple-500/8 px-2 py-1 rounded-md border border-primary/15">
                    <span className="text-xs font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      {formatCurrency(content.payPerViewPrice)}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewContent()
                  }}
                  className="text-xs px-2 py-1 h-auto bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary hover:to-purple-600 hover:text-white border border-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <Eye className="h-3 w-3 mr-1" />
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

  // Default grid view layout - PREMIUM STYLING
  return (
    <Card className={cn(
      "overflow-hidden cursor-pointer group relative",
      // Beautiful gradient border with enhanced glow effect
      "bg-gradient-to-br from-card via-card/98 to-card/95",
      "border-2 border-transparent bg-clip-padding",
      "before:absolute before:inset-0 before:rounded-lg before:p-[2px]",
      "before:bg-gradient-to-br before:from-primary/40 before:via-purple-500/30 before:to-primary/40",
      "before:content-[''] before:opacity-0 hover:before:opacity-100",
      "before:transition-opacity before:duration-500",
      // Enhanced shadow and glow effects
      "shadow-xl hover:shadow-2xl hover:shadow-primary/25",
      "transition-all duration-500 ease-out",
      // Premium hover effects with enhanced animation
      "hover:scale-[1.03] hover:-translate-y-2",
      "hover:bg-gradient-to-br hover:from-card hover:to-primary/8",
      // Add a subtle pulse animation on hover
      "hover:animate-pulse-slow",
      className
    )} onClick={handleViewContent}>
      {/* Multiple layered glow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-purple-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-lg" />

      {/* Content Thumbnail/Icon with premium styling */}
      <div className="aspect-video bg-gradient-to-br from-primary/15 via-purple-500/10 to-primary/15 flex items-center justify-center relative overflow-hidden group-hover:from-primary/25 group-hover:to-purple-500/20 transition-all duration-500">
        {/* Animated background pattern with multiple layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-rotate-slow" />

        {/* Premium purchase indicator overlay */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white px-3 py-1.5 rounded-full font-bold shadow-2xl border border-white/20 backdrop-blur-sm transition-all duration-500 animate-gradient">
            <DollarSign className="h-4 w-4 inline mr-2" />
            {hasAccess ? 'OWNED' : 'PREMIUM'}
          </div>
        </div>

        {/* Enhanced eye icon with glow */}
        <div className="relative z-10">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Eye className="h-16 w-16 text-primary group-hover:text-white transition-all duration-300 drop-shadow-lg group-hover:scale-110" />
        </div>

        {/* Access status badge with premium styling */}
        <div className="absolute top-4 right-4 z-20">
          <AccessStatusBadge hasAccess={hasAccess} />
        </div>

        {/* Animated corner accents */}
        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Floating particles effect */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-float-1" />
        <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-purple-500/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-float-2" />
      </div>

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-lg font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text group-hover:from-primary group-hover:via-purple-600 group-hover:to-primary transition-all duration-500 leading-tight">
            {content.title}
          </CardTitle>
          {/* Premium sparkle effect */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold animate-pulse">★</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {(() => {
            const { text, needsReadMore } = getTruncatedDescription(content.description)
            return (
              <div className="space-y-1">
                <p className={isDescriptionExpanded ? '' : 'line-clamp-2'}>
                  {text}
                </p>
                {needsReadMore && (
                  <button
                    onClick={handleDescriptionToggle}
                    className="text-primary text-xs font-medium flex items-center gap-1 transition-all duration-300 hover:scale-105 hover:text-purple-600"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        Read less <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })()}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/15 to-purple-500/15 border-primary/30 hover:from-primary/25 hover:to-purple-500/25 transition-all duration-300">
            <Tag className="h-3 w-3 mr-1" />
            {categoryToString(content.category)}
          </Badge>
          {/* Premium price display */}
          <div className="bg-gradient-to-r from-primary/15 via-purple-500/10 to-primary/15 px-4 py-2 rounded-xl border border-primary/30 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
            <div className="text-xs text-muted-foreground mb-1 font-medium">Price</div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                {formatCurrency(content.payPerViewPrice)}
              </span>
            </div>
          </div>
        </div>

        {showCreatorInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
            <Avatar className="h-5 w-5 ring-2 ring-primary/20">
              <AvatarFallback className="text-xs bg-gradient-to-r from-primary/20 to-purple-500/20">
                {formatAddress(content.creator).slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span>by <span className="font-medium">{formatAddress(content.creator)}</span></span>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-lg">
          <Clock className="h-3 w-3 text-primary/70" />
          <span>{formatRelativeTime(content.creationTime)}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 relative z-10">
        <Button
          className="w-full bg-gradient-to-r from-primary via-purple-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold py-3 shadow-xl hover:shadow-2xl hover:shadow-primary/40 transition-all duration-500 hover:scale-[1.02] animate-gradient-slow"
          onClick={(e) => {
            e.stopPropagation()
            handleViewContent()
          }}
        >
          <Eye className="h-5 w-5 mr-2" />
          View Full Content
          <ArrowRight className="h-5 w-5 ml-2" />
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

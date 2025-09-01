'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ContentCarousel } from '@/components/ui/carousel'
import { Eye, Lock, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useActiveContentPaginated,
  useContentById,
  useHasContentAccess,
  useCreatorProfile
} from '@/hooks/contracts/core'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { ContentCategory, categoryToString } from '@/types/contracts'
import { formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'
import { OrchestratedContentPurchaseCard } from './OrchestratedContentPurchaseCard'

interface ContentCarouselWrapperProps {
  category?: ContentCategory | 'featured'
  itemsPerView?: number
  autoPlay?: boolean
  className?: string
}

export function ContentCarouselWrapper({
  category = 'featured',
  itemsPerView = 8,
  autoPlay = true,
  className
}: ContentCarouselWrapperProps) {
  const walletUI = useWalletConnectionUI()

  // Get content data
  const contentQuery = useActiveContentPaginated(0, itemsPerView)

  const contentIds = contentQuery.data?.contentIds || []

  // Convert content IDs to content components
  const contentComponents = contentIds.map((contentId) => (
    <ContentCarouselCard
      key={contentId.toString()}
      contentId={contentId}
      userAddress={walletUI.address && typeof walletUI.address === 'string' ? walletUI.address as `0x${string}` : undefined}
    />
  ))

  return (
    <div className={cn('w-full', className)}>
      <ContentCarousel
        content={contentComponents}
        autoPlay={autoPlay}
      />
    </div>
  )
}

// Individual content card component for carousel
function ContentCarouselCard({
  contentId,
  userAddress
}: {
  contentId: bigint
  userAddress?: string
}) {
  const contentQuery = useContentById(contentId)
  const accessControl = useHasContentAccess(
    userAddress as `0x${string}` | undefined,
    contentId,
  )
  const creatorProfile = useCreatorProfile(contentQuery.data?.creator)

  if (contentQuery.isLoading) {
    return (
      <Card className="overflow-hidden animate-pulse">
        <div className="aspect-video bg-muted" />
        <CardHeader className="pb-2">
          <div className="h-5 bg-muted rounded w-3/4" />
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </CardContent>
      </Card>
    )
  }

  if (contentQuery.error || !contentQuery.data) {
    return (
      <Card className="text-center p-6 border-dashed border-red-200">
        <Eye className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600">Failed to load content</p>
      </Card>
    )
  }

  const content = contentQuery.data

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full min-w-[380px] max-w-[480px] mx-auto">
      {/* Content Preview */}
      <div className="aspect-video bg-muted flex items-center justify-center relative">
        <Eye className="h-12 w-12 text-muted-foreground" />
        {accessControl.data !== undefined && (
          <div className="absolute top-3 right-3">
            <AccessStatusBadge hasAccess={accessControl.data} />
          </div>
        )}
      </div>

      <CardHeader className="pb-5 px-6">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-xl leading-snug font-semibold">
            {content.title}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-6 pb-5 flex-1">
        <CardDescription className="line-clamp-3 mb-5 text-sm leading-relaxed">
          {content.description}
        </CardDescription>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs px-3 py-1.5 font-medium">
              {categoryToString(content.category)}
            </Badge>
            <span className="font-bold text-xl text-primary">
              {formatCurrency(content.payPerViewPrice)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs font-medium">
                {formatAddress(content.creator).slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">by {formatAddress(content.creator)}</span>
          </div>

          <div className="text-sm text-muted-foreground font-medium">
            {formatRelativeTime(content.creationTime)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-6 pb-6">
        <div className="w-full">
          <OrchestratedContentPurchaseCard
            contentId={contentId}
            userAddress={userAddress as `0x${string}` | undefined}
            onPurchaseSuccess={() => {
              accessControl.refetch()
            }}
            onViewContent={(contentId) => {
              window.location.href = `/content/${contentId}`
            }}
            variant="compact"
            showCreatorInfo={false}
            showPurchaseDetails={false}
            enableMultiPayment={false}
            showSystemHealth={false}
            enablePerformanceMetrics={false}
            className="w-full"
          />
        </div>
      </CardFooter>
    </Card>
  )
}

// Access status badge component
function AccessStatusBadge({ hasAccess }: { hasAccess?: boolean }) {
  if (hasAccess === undefined) {
    return null
  }

  if (hasAccess) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
        <Unlock className="h-3 w-3 mr-1" />
        Owned
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-xs">
      <Lock className="h-3 w-3 mr-1" />
      Locked
    </Badge>
  )
}

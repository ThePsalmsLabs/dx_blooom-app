'use client'

import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SmartMessagingButton } from '@/components/messaging/SmartMessagingButton'
import { 
  Play, 
  MessageCircle, 
  Heart, 
  Share2, 
  DollarSign,
  Eye,
  Clock,
  User,
  Verified
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

interface ContentCardWithMessagingProps {
  /** Content ID */
  contentId: string
  /** Content title */
  title: string
  /** Content description */
  description?: string
  /** Content thumbnail/preview image */
  thumbnailUrl?: string
  /** Creator information */
  creator: {
    address: Address
    name: string
    avatar?: string
    isVerified?: boolean
  }
  /** Content price in USDC */
  price: string
  /** Number of views/purchases */
  viewCount?: number
  /** Content duration (for video content) */
  duration?: string
  /** User's wallet address */
  userAddress?: Address
  /** Whether user has access to this content */
  hasAccess?: boolean
  /** Content category/genre */
  category?: string
  /** Whether content is liked by user */
  isLiked?: boolean
  /** Like count */
  likeCount?: number
  /** Callback when content is clicked */
  onContentClick?: () => void
  /** Callback when creator profile is clicked */
  onCreatorClick?: () => void
  /** Callback when purchase is initiated */
  onPurchaseClick?: () => void
  /** Callback when like button is clicked */
  onLikeClick?: () => void
  /** Callback when share button is clicked */
  onShareClick?: () => void
  /** Card variant */
  variant?: 'compact' | 'standard' | 'detailed'
  /** Show messaging functionality */
  showMessaging?: boolean
  className?: string
}

export function ContentCardWithMessaging({
  contentId,
  title,
  description,
  thumbnailUrl,
  creator,
  price,
  viewCount,
  duration,
  userAddress,
  hasAccess = false,
  category,
  isLiked = false,
  likeCount = 0,
  onContentClick,
  onCreatorClick,
  onPurchaseClick,
  onLikeClick,
  onShareClick,
  variant = 'standard',
  showMessaging = true,
  className
}: ContentCardWithMessagingProps) {

  const isCompact = variant === 'compact'
  const isDetailed = variant === 'detailed'

  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border',
      'bg-card/50 backdrop-blur-sm',
      isCompact && 'max-w-sm',
      className
    )}>
      {/* Content Thumbnail */}
      <div className="relative overflow-hidden">
        <div 
          className={cn(
            'relative bg-muted cursor-pointer',
            isCompact ? 'aspect-video' : 'aspect-[16/10]'
          )}
          onClick={onContentClick}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button size="lg" className="shadow-lg">
              <Play className="w-5 h-5 mr-2" />
              {hasAccess ? 'Watch' : 'Preview'}
            </Button>
          </div>
          
          {/* Duration badge */}
          {duration && (
            <Badge 
              variant="secondary" 
              className="absolute bottom-2 right-2 bg-black/60 text-white border-0"
            >
              <Clock className="w-3 h-3 mr-1" />
              {duration}
            </Badge>
          )}
          
          {/* Access indicator */}
          {hasAccess && (
            <Badge 
              variant="secondary" 
              className="absolute top-2 right-2 bg-green-600 text-white border-0"
            >
              <Eye className="w-3 h-3 mr-1" />
              Purchased
            </Badge>
          )}
        </div>
      </div>

      {/* Card Header */}
      <CardHeader className={cn('pb-3', isCompact && 'p-4')}>
        <div className="space-y-2">
          {/* Category and Price */}
          <div className="flex items-center justify-between">
            {category && (
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            )}
            <div className="flex items-center gap-1 text-sm font-semibold">
              <DollarSign className="w-3 h-3" />
              {price} USDC
            </div>
          </div>
          
          {/* Title */}
          <h3 
            className={cn(
              'font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors',
              isCompact ? 'text-sm' : 'text-base'
            )}
            onClick={onContentClick}
          >
            {title}
          </h3>
          
          {/* Description - only for detailed variant */}
          {isDetailed && description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          
          {/* Creator Info */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onCreatorClick}
          >
            <Avatar className={cn('border', isCompact ? 'h-6 w-6' : 'h-8 w-8')}>
              <AvatarImage src={creator.avatar} alt={creator.name} />
              <AvatarFallback>
                <User className="w-3 h-3" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 min-w-0">
              <span className={cn(
                'font-medium truncate',
                isCompact ? 'text-xs' : 'text-sm'
              )}>
                {creator.name}
              </span>
              {creator.isVerified && (
                <Verified className="w-3 h-3 text-primary flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Card Content - Stats for detailed variant */}
      {isDetailed && (
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {viewCount !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {viewCount.toLocaleString()} views
              </div>
            )}
            <div className="flex items-center gap-1">
              <Heart className={cn('w-3 h-3', isLiked && 'fill-red-500 text-red-500')} />
              {likeCount.toLocaleString()}
            </div>
          </div>
        </CardContent>
      )}

      {/* Card Footer - Actions */}
      <CardFooter className={cn('pt-0', isCompact ? 'p-4 pt-0' : 'p-6 pt-0')}>
        <div className="flex items-center gap-2 w-full">
          {/* Purchase/View Button */}
          <Button 
            onClick={onPurchaseClick}
            className="flex-1"
            size={isCompact ? 'sm' : 'default'}
          >
            {hasAccess ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Watch Now
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Purchase
              </>
            )}
          </Button>
          
          {/* Messaging Button */}
          {showMessaging && userAddress && (
            <SmartMessagingButton
              userAddress={userAddress}
              creatorAddress={creator.address}
              contentId={contentId}
              context={hasAccess ? 'general' : 'general'}
              variant="outline"
              size={isCompact ? 'sm' : 'default'}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </SmartMessagingButton>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-8 w-8 p-0', isLiked && 'text-red-500')}
              onClick={onLikeClick}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onShareClick}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * Content Grid with Messaging
 * A grid component that displays multiple content cards with messaging functionality
 */
interface ContentGridWithMessagingProps {
  contents: Array<Omit<ContentCardWithMessagingProps, 'userAddress' | 'showMessaging'>>
  userAddress?: Address
  showMessaging?: boolean
  variant?: 'compact' | 'standard' | 'detailed'
  className?: string
}

export function ContentGridWithMessaging({
  contents,
  userAddress,
  showMessaging = true,
  variant = 'standard',
  className
}: ContentGridWithMessagingProps) {
  return (
    <div className={cn(
      'grid gap-4',
      variant === 'compact' 
        ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        : variant === 'detailed'
        ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      className
    )}>
      {contents.map((content) => (
        <ContentCardWithMessaging
          key={content.contentId}
          {...content}
          userAddress={userAddress}
          showMessaging={showMessaging}
          variant={variant}
        />
      ))}
    </div>
  )
}
'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SmartMessagingButton } from '@/components/messaging/SmartMessagingButton'
import { 
  MessageCircle, 
  Heart, 
  Share2, 
  Users,
  Play,
  Verified,
  User,
  ExternalLink,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Address } from 'viem'

interface CreatorProfileCardProps {
  /** Creator's wallet address */
  creatorAddress: Address
  /** Creator display name */
  name: string
  /** Creator bio/description */
  bio?: string
  /** Creator avatar image URL */
  avatar?: string
  /** Creator cover image URL */
  coverImage?: string
  /** Whether creator is verified */
  isVerified?: boolean
  /** Number of followers */
  followerCount?: number
  /** Number of content pieces */
  contentCount?: number
  /** Total earnings in USDC */
  totalEarnings?: string
  /** Creator categories/genres */
  categories?: string[]
  /** User's wallet address */
  userAddress?: Address
  /** Whether user follows this creator */
  isFollowing?: boolean
  /** Whether to show messaging functionality */
  showMessaging?: boolean
  /** Card variant */
  variant?: 'compact' | 'standard' | 'detailed'
  /** Callback when profile is clicked */
  onProfileClick?: () => void
  /** Callback when follow button is clicked */
  onFollowClick?: () => void
  /** Callback when share button is clicked */
  onShareClick?: () => void
  className?: string
}

export function CreatorProfileCard({
  creatorAddress,
  name,
  bio,
  avatar,
  coverImage,
  isVerified = false,
  followerCount = 0,
  contentCount = 0,
  totalEarnings,
  categories = [],
  userAddress,
  isFollowing = false,
  showMessaging = true,
  variant = 'standard',
  onProfileClick,
  onFollowClick,
  onShareClick,
  className
}: CreatorProfileCardProps) {

  const isCompact = variant === 'compact'
  const isDetailed = variant === 'detailed'

  return (
    <Card className={cn(
      'group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border',
      'bg-card/50 backdrop-blur-sm overflow-hidden',
      isCompact && 'max-w-sm',
      className
    )}>
      {/* Cover Image */}
      {(isDetailed || !isCompact) && (
        <div className="relative h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          {coverImage ? (
            <img
              src={coverImage}
              alt={`${name} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}

      <CardHeader className={cn(
        'relative',
        isCompact ? 'p-4' : 'p-6',
        (isDetailed || !isCompact) && 'pt-0'
      )}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={cn(
            'relative',
            (isDetailed || !isCompact) && '-mt-8'
          )}>
            <Avatar className={cn(
              'border-4 border-background shadow-lg',
              isCompact ? 'h-12 w-12' : isDetailed ? 'h-20 w-20' : 'h-16 w-16'
            )}>
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="text-lg font-semibold">
                <User className={cn(isCompact ? 'w-4 h-4' : 'w-6 h-6')} />
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Creator Info */}
          <div className="flex-1 min-w-0">
            <div 
              className="cursor-pointer group/name"
              onClick={onProfileClick}
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  'font-semibold truncate group-hover/name:text-primary transition-colors',
                  isCompact ? 'text-base' : isDetailed ? 'text-xl' : 'text-lg'
                )}>
                  {name}
                </h3>
                {isVerified && (
                  <Verified className={cn(
                    'text-primary flex-shrink-0',
                    isCompact ? 'w-4 h-4' : 'w-5 h-5'
                  )} />
                )}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover/name:opacity-100 transition-opacity" />
              </div>
              
              {/* Bio - only for detailed or if compact and no categories */}
              {bio && (isDetailed || (isCompact && categories.length === 0)) && (
                <p className={cn(
                  'text-muted-foreground line-clamp-2',
                  isCompact ? 'text-xs' : 'text-sm'
                )}>
                  {bio}
                </p>
              )}
            </div>
            
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {categories.slice(0, isCompact ? 2 : 3).map((category) => (
                  <Badge 
                    key={category} 
                    variant="secondary" 
                    className={cn('text-xs', isCompact && 'px-2 py-0.5')}
                  >
                    {category}
                  </Badge>
                ))}
                {categories.length > (isCompact ? 2 : 3) && (
                  <Badge variant="outline" className="text-xs">
                    +{categories.length - (isCompact ? 2 : 3)}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Stats Section */}
      <CardContent className={cn('space-y-4', isCompact ? 'p-4 pt-0' : 'p-6 pt-0')}>
        {/* Stats Grid */}
        <div className={cn(
          'grid gap-4',
          isCompact ? 'grid-cols-2' : isDetailed ? 'grid-cols-4' : 'grid-cols-3'
        )}>
          <div className="text-center">
            <div className={cn(
              'font-semibold',
              isCompact ? 'text-sm' : 'text-base'
            )}>
              {followerCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          
          <div className="text-center">
            <div className={cn(
              'font-semibold',
              isCompact ? 'text-sm' : 'text-base'
            )}>
              {contentCount.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Content</div>
          </div>
          
          {!isCompact && totalEarnings && (
            <div className="text-center">
              <div className={cn(
                'font-semibold text-green-600',
                isCompact ? 'text-sm' : 'text-base'
              )}>
                {totalEarnings}
              </div>
              <div className="text-xs text-muted-foreground">Earned</div>
            </div>
          )}
          
          {isDetailed && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="font-semibold text-green-600 text-base">
                  98%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Follow Button */}
          <button
            onClick={onFollowClick}
            className={cn(
              'flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors',
              isFollowing
                ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          
          {/* Messaging Button */}
          {showMessaging && userAddress && (
            <SmartMessagingButton
              userAddress={userAddress}
              creatorAddress={creatorAddress}
              contentId="" // No specific content context
              context="general"
              variant="outline"
              size={isCompact ? 'sm' : 'default'}
              className="flex-1"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </SmartMessagingButton>
          )}
          
          {/* Share Button */}
          <button
            onClick={onShareClick}
            className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Creator Grid with Messaging
 * A grid component that displays multiple creator profile cards with messaging functionality
 */
interface CreatorGridProps {
  creators: Array<Omit<CreatorProfileCardProps, 'userAddress' | 'showMessaging'>>
  userAddress?: Address
  showMessaging?: boolean
  variant?: 'compact' | 'standard' | 'detailed'
  className?: string
}

export function CreatorGrid({
  creators,
  userAddress,
  showMessaging = true,
  variant = 'standard',
  className
}: CreatorGridProps) {
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
      {creators.map((creator) => (
        <CreatorProfileCard
          key={creator.creatorAddress}
          {...creator}
          userAddress={userAddress}
          showMessaging={showMessaging}
          variant={variant}
        />
      ))}
    </div>
  )
}
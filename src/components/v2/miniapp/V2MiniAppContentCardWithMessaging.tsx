/**
 * V2MiniAppContentCardWithMessaging - Content Card with Integrated Messaging
 * File: src/components/v2/miniapp/V2MiniAppContentCardWithMessaging.tsx
 *
 * Mobile-optimized content card component that integrates XMTP messaging
 * for instant creator-to-fan communication within the content discovery flow.
 */

'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Eye, 
  Heart, 
  Clock,
  Star,
  Shield,
  CheckCircle,
  Lock,
  ArrowRight,
  Bookmark,
  Share2,
  MoreHorizontal,
  Play,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// V2 Components
import { V2MiniAppSmartMessagingButton } from './V2MiniAppSmartMessagingButton'
import { V2MiniAppPurchaseButton } from './V2MiniAppPurchaseButton'

import type { Address } from 'viem'

// ================================================
// TYPES & INTERFACES
// ================================================

interface ContentCardData {
  id: bigint
  title: string
  description?: string
  creator: Address
  creatorName?: string
  creatorAvatar?: string
  price?: bigint
  category?: string
  tags?: string[]
  viewCount?: number
  likeCount?: number
  isLiked?: boolean
  isBookmarked?: boolean
  createdAt?: Date
  hasAccess?: boolean
  isVerified?: boolean
  rating?: number
  duration?: number // In seconds for video content
  thumbnailUrl?: string
  previewUrl?: string
}

interface V2MiniAppContentCardWithMessagingProps {
  content: ContentCardData
  variant?: 'default' | 'compact' | 'featured'
  showMessaging?: boolean
  showPurchase?: boolean
  showActions?: boolean
  showCreatorInfo?: boolean
  className?: string
  
  // Callbacks
  onContentClick?: (contentId: bigint) => void
  onCreatorClick?: (creatorAddress: Address) => void
  onLike?: (contentId: bigint) => void
  onBookmark?: (contentId: bigint) => void
  onShare?: (content: ContentCardData) => void
  
  // Messaging props
  quickMessage?: string
  messagingContext?: 'content' | 'general'
}

// ================================================
// CONTENT CARD WITH MESSAGING COMPONENT
// ================================================

export function V2MiniAppContentCardWithMessaging({
  content,
  variant = 'default',
  showMessaging = true,
  showPurchase = true,
  showActions = true,
  showCreatorInfo = true,
  className,
  onContentClick,
  onCreatorClick,
  onLike,
  onBookmark,
  onShare,
  quickMessage,
  messagingContext = 'content'
}: V2MiniAppContentCardWithMessagingProps) {
  const router = useRouter()
  
  // State management
  const [isLiked, setIsLiked] = useState(content.isLiked || false)
  const [isBookmarked, setIsBookmarked] = useState(content.isBookmarked || false)
  const [likeCount, setLikeCount] = useState(content.likeCount || 0)

  // Derived state
  const hasAccess = content.hasAccess || false
  const needsPurchase = !hasAccess && content.price && content.price > BigInt(0)
  const isVideo = content.duration && content.duration > 0
  const isVerifiedCreator = content.isVerified || false

  // Format utilities
  const formatPrice = (price: bigint) => {
    return `$${(Number(price) / 1e6).toFixed(2)}`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
  }

  // Event handlers
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1)
    onLike?.(content.id)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsBookmarked(!isBookmarked)
    onBookmark?.(content.id)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    onShare?.(content)
  }

  const handleContentClick = () => {
    onContentClick?.(content.id)
    router.push(`/mini/content/${content.id}`)
  }

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCreatorClick?.(content.creator)
    router.push(`/mini/creators/${content.creator}`)
  }

  // Variant-specific styles
  const getCardStyles = () => {
    switch (variant) {
      case 'compact':
        return 'p-3'
      case 'featured':
        return 'p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
      default:
        return 'p-4'
    }
  }

  const getImageHeight = () => {
    switch (variant) {
      case 'compact':
        return 'h-32'
      case 'featured':
        return 'h-56'
      default:
        return 'h-40'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full", className)}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50">
        <div className="relative">
          {/* Content Thumbnail */}
          <div 
            className={cn(
              "relative cursor-pointer bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden",
              getImageHeight()
            )}
            onClick={handleContentClick}
          >
            {content.thumbnailUrl ? (
              <img 
                src={content.thumbnailUrl} 
                alt={content.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-400">
                  {isVideo ? <Play className="w-8 h-8" /> : <Eye className="w-8 h-8" />}
                </div>
              </div>
            )}
            
            {/* Overlay Elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            {/* Duration Badge (for video content) */}
            {isVideo && content.duration && (
              <Badge 
                variant="secondary" 
                className="absolute bottom-2 right-2 bg-black/70 text-white border-0 text-xs"
              >
                {formatDuration(content.duration)}
              </Badge>
            )}
            
            {/* Access Status */}
            <div className="absolute top-2 left-2">
              {hasAccess ? (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Owned
                </Badge>
              ) : needsPurchase ? (
                <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  {formatPrice(content.price!)}
                </Badge>
              ) : (
                <Badge variant="default" className="bg-gray-600 text-white text-xs">
                  Free
                </Badge>
              )}
            </div>
            
            {/* Quick Actions Overlay */}
            {showActions && (
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-black/30 hover:bg-black/50 text-white border-0"
                  onClick={handleBookmark}
                >
                  <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-black/30 hover:bg-black/50 text-white border-0"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Content Info */}
          <CardContent className={getCardStyles()}>
            {/* Creator Info */}
            {showCreatorInfo && (
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={handleCreatorClick}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={content.creatorAvatar} />
                    <AvatarFallback className="text-xs">
                      {content.creatorName?.[0] || content.creator.slice(2, 4).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        {content.creatorName || `${content.creator.slice(0, 6)}...${content.creator.slice(-4)}`}
                      </span>
                      {isVerifiedCreator && (
                        <Shield className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                    {content.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(content.createdAt)}
                      </span>
                    )}
                  </div>
                </button>
                
                {/* Messaging Button in Creator Area */}
                {showMessaging && (
                  <div className="ml-auto">
                    <V2MiniAppSmartMessagingButton
                      creatorAddress={content.creator}
                      contentId={content.id.toString()}
                      context={messagingContext}
                      variant="ghost"
                      size="sm"
                      showLabel={false}
                      quickMessage={quickMessage}
                      className="h-8 w-8"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Content Title & Description */}
            <div className="space-y-2 mb-3">
              <h3 
                className="font-semibold text-base line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                onClick={handleContentClick}
              >
                {content.title}
              </h3>
              {content.description && variant !== 'compact' && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {content.description}
                </p>
              )}
            </div>
            
            {/* Tags */}
            {content.tags && content.tags.length > 0 && variant === 'featured' && (
              <div className="flex flex-wrap gap-1 mb-3">
                {content.tags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs px-2 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
                {content.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    +{content.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Stats & Actions */}
            <div className="flex items-center justify-between">
              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {content.viewCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{formatCount(content.viewCount)}</span>
                  </div>
                )}
                <button
                  onClick={handleLike}
                  className="flex items-center gap-1 hover:text-red-500 transition-colors"
                >
                  <Heart className={cn("w-3 h-3", isLiked && "fill-red-500 text-red-500")} />
                  <span>{formatCount(likeCount)}</span>
                </button>
                {content.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{content.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              
              {/* Purchase/Access Button */}
              {showPurchase && needsPurchase && (
                <V2MiniAppPurchaseButton
                  contentId={content.id}
                  creator={content.creator}
                  title={content.title}
                  price={content.price}
                  variant="outline"
                  size="sm"
                  showPricing={false}
                  enablePostPurchaseMessaging={true}
                  className="px-3"
                />
              )}
              
              {/* View Content Button */}
              {hasAccess && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleContentClick}
                  className="px-3"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  View
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  )
}
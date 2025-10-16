/**
 * MiniApp Content Carousel Component
 * File: src/components/miniapp/ContentCarousel.tsx
 * 
 * A horizontal scrolling carousel optimized for mini app content discovery.
 * Uses native CSS scroll behavior for smooth mobile performance without external dependencies.
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Eye, Play, FileText, Star, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, Button, Badge, Skeleton } from '@/components/ui/index'
import { cn, formatCurrency, formatAddress } from '@/lib/utils'
import { useContentById, useCreatorProfile, useHasContentAccess } from '@/hooks/contracts/core'
import { useMiniAppWallet } from '@/hooks/miniapp/useMiniAppWallet'
import { getSafeAddress } from '@/lib/utils/wallet-utils'
import { categoryToString, ContentCategory } from '@/types/contracts'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ContentCarouselProps {
  /** Array of content IDs to display */
  contentIds: readonly bigint[]
  
  /** Title for the carousel section */
  title?: string
  
  /** Subtitle for the carousel section */
  subtitle?: string
  
  /** Number of items visible at once (responsive) */
  visibleItems?: {
    mobile: number
    tablet: number
    desktop: number
  }
  
  /** Callback when content is selected */
  onContentSelect?: (contentId: bigint) => void
  
  /** Show scroll indicators */
  showScrollIndicators?: boolean
  
  /** Custom className */
  className?: string
}

interface ContentCarouselItemProps {
  contentId: bigint
  onSelect?: (contentId: bigint) => void
  className?: string
}

// =============================================================================
// CONTENT ITEM COMPONENT
// =============================================================================

const ContentCarouselItem: React.FC<ContentCarouselItemProps> = ({
  contentId,
  onSelect,
  className
}) => {
  const router = useRouter()
  const walletUI = useMiniAppWallet()
  const userAddress = walletUI.address ? getSafeAddress(walletUI.address) : undefined
  
  const contentQuery = useContentById(contentId)
  const creatorQuery = useCreatorProfile(contentQuery.data?.creator)
  const accessQuery = useHasContentAccess(userAddress, contentId)
  
  const content = contentQuery.data
  const creator = creatorQuery.data
  const hasAccess = accessQuery.data
  
  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(contentId)
    }
  }, [contentId, onSelect])
  
  const handleViewContent = useCallback((e?: React.MouseEvent) => {
    // Stop event propagation to prevent card click
    e?.stopPropagation()
    // Navigate to content page in miniapp
    router.push(`/mini/content/${contentId}`)
  }, [contentId, router])
  
  if (contentQuery.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={cn("flex-shrink-0 w-64 h-80", className)}>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </motion.div>
    )
  }
  
  if (!content) {
    return null
  }
  
  const getCategoryIcon = (category: ContentCategory) => {
    switch (category) {
      case ContentCategory.ARTICLE: return FileText // ARTICLE
      case ContentCategory.VIDEO: return Play // VIDEO
      case ContentCategory.COURSE: return Star // COURSE  
      case ContentCategory.MUSIC: return Eye // MUSIC
      case ContentCategory.PODCAST: return FileText // PODCAST
      default: return FileText
    }
  }
  
  const CategoryIcon = getCategoryIcon(content.category)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          "flex-shrink-0 cursor-pointer shadow-lg hover:shadow-xl transition-shadow duration-200",
          "w-[280px] sm:w-[300px] md:w-[280px]", // Fixed responsive widths
          "h-auto min-h-[320px]", // Auto height with minimum
          className
        )}
        onClick={handleClick}
      >
      <CardContent className="p-3 flex flex-col h-full">
        {/* Content Preview */}
        <div className="flex-shrink-0 h-28 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-md flex items-center justify-center mb-2 relative overflow-hidden">
          <CategoryIcon className="h-8 w-8 text-muted-foreground" />
          
          {/* Category Badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 text-xs"
          >
            {categoryToString(content.category)}
          </Badge>
          
          {/* Access Status */}
          {hasAccess && (
            <Badge 
              variant="default" 
              className="absolute top-2 right-2 text-xs bg-green-600"
            >
              Owned
            </Badge>
          )}
        </div>
        
        {/* Content Info */}
        <div className="flex-1 min-h-0 space-y-1.5">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
            {content.title}
          </h3>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {content.description}
          </p>
          
          {/* Creator */}
          <div className="text-xs text-muted-foreground truncate">
            by {formatAddress(content.creator)}
          </div>
          
          {/* Price */}
          <div className="font-bold text-sm text-primary">
            {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
          </div>
        </div>
        
        {/* Action Button */}
        <div className="flex-shrink-0 mt-2">
          {hasAccess ? (
            <Button 
              size="sm" 
              className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
              onClick={handleViewContent}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              View Content
            </Button>
          ) : (
            <Button 
              size="sm" 
              className="w-full text-xs bg-primary hover:bg-primary/90 text-white"
              onClick={handleViewContent}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// MAIN CAROUSEL COMPONENT
// =============================================================================

export const ContentCarousel: React.FC<ContentCarouselProps> = ({
  contentIds,
  title = "Featured Content",
  subtitle,
  visibleItems = { mobile: 1.2, tablet: 2.5, desktop: 3.5 },
  onContentSelect,
  showScrollIndicators = true,
  className
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isScrolling, setIsScrolling] = useState(false)
  
  // Check scroll position
  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])
  
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return
    
    updateScrollButtons()
    scrollContainer.addEventListener('scroll', updateScrollButtons)
    
    return () => {
      scrollContainer.removeEventListener('scroll', updateScrollButtons)
    }
  }, [updateScrollButtons])
  
  // Scroll functions
  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollContainerRef.current || isScrolling) return
    
    setIsScrolling(true)
    const scrollAmount = 280 // Card width + gap
    const targetScroll = scrollContainerRef.current.scrollLeft + 
      (direction === 'right' ? scrollAmount : -scrollAmount)
    
    scrollContainerRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
    
    setTimeout(() => setIsScrolling(false), 300)
  }, [isScrolling])
  
  if (contentIds.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <div className="space-y-1">
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        <div className="text-center py-8 text-muted-foreground">
          <Eye className="h-8 w-8 mx-auto mb-2" />
          <p>No content available</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          {/* Scroll Controls */}
          {showScrollIndicators && (
            <div className="hidden sm:flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft || isScrolling}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight || isScrolling}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      )}
      
      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <motion.div
          ref={scrollContainerRef}
          className={cn(
            "flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1",
            "snap-x snap-mandatory scroll-smooth",
            "[-webkit-overflow-scrolling:touch]"
          )}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <AnimatePresence mode="wait">
            {contentIds.map((contentId, index) => (
              <motion.div
                key={contentId.toString()}
                initial={{ opacity: 0, x: 50 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { 
                    delay: index * 0.1,
                    duration: 0.4,
                    ease: "easeOut"
                  }
                }}
                className="snap-start"
              >
                <ContentCarouselItem
                  contentId={contentId}
                  onSelect={onContentSelect}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {/* Mobile Scroll Indicators */}
        {showScrollIndicators && (
          <div className="sm:hidden flex justify-center gap-2 mt-3">
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              canScrollLeft ? "bg-muted" : "bg-primary"
            )} />
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              !canScrollLeft && !canScrollRight ? "bg-primary" : "bg-muted"
            )} />
            <div className={cn(
              "w-2 h-2 rounded-full transition-colors",
              canScrollRight ? "bg-muted" : "bg-primary"
            )} />
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentCarousel
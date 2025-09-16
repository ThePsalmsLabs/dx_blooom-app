'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Grid3X3, List, Menu, X, Eye } from 'lucide-react'
import { useWalletConnectionUI } from '@/hooks/ui/integration'

// Import your existing infrastructure
import { ContentCategory } from '@/types/contracts'
import { 
  useContentDiscovery, 
  ContentDiscoveryParams,
  ContentSortBy
} from '@/hooks/contracts/content/useContentDiscovery'
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'
import { OrchestratedContentPurchaseCard } from './OrchestratedContentPurchaseCard'
import { formatCurrency } from '@/lib/utils'

// Import UI components
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ================================================================
// UNIFIED RESPONSIVE SYSTEM ARCHITECTURE
// ================================================================

/**
 * This component demonstrates how to build a robust responsive content discovery
 * system that integrates with your existing smart contract infrastructure.
 * 
 * Key Features:
 * 1. Intelligent grid column calculation based on available space
 * 2. Smooth sidebar transitions without layout breaks
 * 3. Theme-aware design using your design tokens
 * 4. Integration with your existing content hooks
 * 5. Performance-optimized resize handling
 */

// Breakpoint configuration - single source of truth
const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1400
} as const

// Content card minimum width for optimal layout calculation
const CARD_CONFIG = {
  minWidth: 280,    // Minimum card width for good content display
  maxWidth: 400,    // Maximum card width to prevent oversized cards
  gap: 24,          // Consistent gap between cards
  padding: 24       // Container padding
} as const

// ================================================================
// RESPONSIVE HOOKS AND UTILITIES
// ================================================================

/**
 * Advanced viewport detection hook with debounced resize handling
 * This prevents excessive recalculation during resize events
 */
function useResponsiveViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    breakpoint: 'desktop' as keyof typeof BREAKPOINTS
  })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        const height = window.innerHeight
        
        let breakpoint: keyof typeof BREAKPOINTS = 'desktop'
        if (width < BREAKPOINTS.mobile) {
          breakpoint = 'mobile'
        } else if (width < BREAKPOINTS.tablet) {
          breakpoint = 'mobile'
        } else if (width < BREAKPOINTS.desktop) {
          breakpoint = 'tablet'
        } else {
          breakpoint = 'desktop'
        }

        setViewport({ width, height, breakpoint })
      }, 150) // Debounce resize events
    }

    window.addEventListener('resize', handleResize)
    handleResize() // Initial calculation

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  return viewport
}

/**
 * Intelligent grid calculation hook
 * Calculates optimal number of columns based on available space and content requirements
 */
function useGridLayout(containerWidth: number, sidebarWidth: number = 0) {
  return useMemo(() => {
    const availableWidth = containerWidth - sidebarWidth - (CARD_CONFIG.padding * 2)
    
    // Calculate how many cards can fit with minimum width
    const maxColumns = Math.floor((availableWidth + CARD_CONFIG.gap) / (CARD_CONFIG.minWidth + CARD_CONFIG.gap))
    
    // Ensure at least 1 column, maximum based on breakpoint
    let columns = Math.max(1, maxColumns)
    
    // Apply breakpoint-specific maximum columns to prevent oversized cards
    if (containerWidth < BREAKPOINTS.mobile) {
      columns = Math.min(columns, 1)
    } else if (containerWidth < BREAKPOINTS.tablet) {
      columns = Math.min(columns, 2)
    } else if (containerWidth < BREAKPOINTS.desktop) {
      columns = Math.min(columns, 3)
    } else {
      columns = Math.min(columns, 4)
    }

    // Calculate actual card width based on available space
    const totalGaps = (columns - 1) * CARD_CONFIG.gap
    const cardWidth = (availableWidth - totalGaps) / columns
    
    return {
      columns,
      cardWidth: Math.min(cardWidth, CARD_CONFIG.maxWidth),
      gap: CARD_CONFIG.gap,
      totalWidth: availableWidth
    }
  }, [containerWidth, sidebarWidth])
}

// ================================================================
// CONTENT CARD COMPONENT
// ================================================================

interface ContentCardProps {
  contentId: bigint
  width: number
  breakpoint: keyof typeof BREAKPOINTS
  compact?: boolean
}

function ContentCard({ contentId, width, breakpoint, compact = false }: ContentCardProps) {
  const walletUI = useWalletConnectionUI()

  // Extract user address from wallet UI with proper type checking
  const userAddress = walletUI.address && typeof walletUI.address === 'string' ? walletUI.address as `0x${string}` : undefined

  const { data: content, isLoading: contentLoading } = useContentById(contentId)
  const { data: hasAccess } = useHasContentAccess(userAddress, contentId)

  if (contentLoading) {
    return (
      <div style={{ width: `${width}px` }}>
        <Card className="overflow-hidden">
          <div className="aspect-video">
            <Skeleton className="h-full w-full" />
          </div>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!content) {
    return null
  }

  // If user has access, show a compact purchased content card
  if (hasAccess) {
    return (
      <div style={{ width: `${width}px` }}>
        <Card className="overflow-hidden border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          {/* Compact Thumbnail */}
          <div className="aspect-video bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 flex items-center justify-center border-b border-green-200 dark:border-green-800">
            <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>

          {/* Compact Content Info */}
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <h3 className={cn(
                "font-medium line-clamp-1 flex-1 text-green-900 dark:text-green-100",
                breakpoint === 'mobile' ? 'text-sm' : 'text-base'
              )}>
                {content.title}
              </h3>
              <Badge variant="outline" className="ml-2 flex-shrink-0 border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                Owned
              </Badge>
            </div>
            
            <Button 
              variant="default" 
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600" 
              size={breakpoint === 'mobile' ? 'sm' : 'default'}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Content
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // For unpurchased content, use a more compact layout
  return (
    <div style={{ width: `${width}px` }}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Compact Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border-b">
          <Eye className="w-6 h-6 text-muted-foreground" />
        </div>

        {/* Compact Content Info */}
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className={cn(
              "font-medium line-clamp-1 flex-1",
              breakpoint === 'mobile' ? 'text-sm' : 'text-base'
            )}>
              {content.title}
            </h3>
            <Badge variant="secondary" className="ml-2 flex-shrink-0 text-xs">
              {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
            </Badge>
          </div>
          
          <p className={cn(
            "text-muted-foreground line-clamp-2 mb-3",
            breakpoint === 'mobile' ? 'text-xs' : 'text-sm'
          )}>
            {content.description}
          </p>

          {/* Compact Purchase Component */}
          <div className="space-y-2 w-full">
            <OrchestratedContentPurchaseCard
              contentId={contentId}
              userAddress={walletUI.address as `0x${string}` | undefined}
              onPurchaseSuccess={() => console.log('Purchase successful for content:', contentId)}
              onViewContent={(contentId) => window.location.href = `/content/${contentId}`}
              variant="full"
              showCreatorInfo={true}
              showPurchaseDetails={true}
              enableMultiPayment={true}
              showSystemHealth={true}
              enablePerformanceMetrics={false}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================================
// MAIN COMPONENT INTERFACES
// ================================================================

interface ContentBrowserProps {
  className?: string
  initialCategory?: ContentCategory
  showSidebar?: boolean
}

// ================================================================
// MAIN CONTENT BROWSER COMPONENT
// ================================================================

export function ContentBrowser({ 
  className, 
  initialCategory,
  showSidebar = true 
}: ContentBrowserProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory | undefined>(
    initialCategory !== undefined ? (initialCategory as unknown as ContentCategory) : undefined
  )
  const [sortBy, setSortBy] = useState<ContentSortBy>('latest')

  const viewport = useResponsiveViewport()
  
  // Calculate sidebar width based on breakpoint and state
  const sidebarWidth = useMemo(() => {
    if (!showSidebar) return 0
    if (viewport.breakpoint === 'mobile' || viewport.breakpoint === 'tablet') {
      return 0 // Mobile and tablet sidebar is overlay, doesn't affect content width
    }
    return sidebarOpen ? 320 : 0 // Desktop only
  }, [viewport.breakpoint, sidebarOpen, showSidebar])

  // Determine if sidebar should be shown as overlay
  const isSidebarOverlay = viewport.breakpoint === 'mobile' || viewport.breakpoint === 'tablet'

  const gridLayout = useGridLayout(viewport.width, sidebarWidth)

  // Content discovery parameters
  const discoveryParams: ContentDiscoveryParams = useMemo(() => ({
    page: 1,
    limit: 24,
    sortBy,
    searchQuery: searchQuery.trim() || undefined
  }), [sortBy, searchQuery])

  // Use your existing content discovery hook
  const { 
    data: discoveryResult, 
    isLoading, 
    isError, 
    refetch 
  } = useContentDiscovery({
    categories: selectedCategory !== undefined ? [selectedCategory] : [],
    discoveryParams
  })

  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    if (category === 'all') {
      setSelectedCategory(undefined)
    } else {
      setSelectedCategory(Number(category) as ContentCategory)
    }
  }, [])

  // Responsive grid styles
  const gridStyles = useMemo(() => {
    if (viewMode === 'list') {
      return {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: `${CARD_CONFIG.gap}px`
      }
    }

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
      gap: `${gridLayout.gap}px`,
      justifyItems: 'center'
    }
  }, [viewMode, gridLayout])

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Navigation Header */}
      <header className="bg-card border-b px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSidebarToggle}
                className="flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <h1 className={cn(
              "font-bold text-foreground",
              viewport.breakpoint === 'mobile' ? 'text-lg' : 'text-xl'
            )}>
              {viewport.breakpoint === 'mobile' ? 'Discover' : 'Content Discovery'}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={viewport.breakpoint === 'mobile' ? 'Search...' : 'Search content...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "pl-10",
                  viewport.breakpoint === 'mobile' ? 'w-full text-sm' : 'w-64'
                )}
              />
            </div>

            {/* View Mode Toggle */}
            {viewport.breakpoint !== 'mobile' && (
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && sidebarOpen && (
          <>
            {/* Mobile/Tablet Overlay */}
            {isSidebarOverlay && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={handleSidebarToggle}
              />
            )}
            
            {/* Sidebar Content */}
            <div
              className={cn(
                "bg-card border-r transition-all duration-300",
                isSidebarOverlay 
                  ? 'fixed left-0 top-0 h-full z-50' 
                  : 'relative'
              )}
              style={{ 
                width: isSidebarOverlay ? '280px' : `${sidebarWidth}px` 
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-foreground">Filters</h2>
                  {isSidebarOverlay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSidebarToggle}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category
                    </label>
                    <Select value={selectedCategory?.toString() || 'all'} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value={ContentCategory.ARTICLE.toString()}>Articles</SelectItem>
                        <SelectItem value={ContentCategory.VIDEO.toString()}>Videos</SelectItem>
                        <SelectItem value={ContentCategory.COURSE.toString()}>Courses</SelectItem>
                        <SelectItem value={ContentCategory.MUSIC.toString()}>Music</SelectItem>
                        <SelectItem value={ContentCategory.PODCAST.toString()}>Podcasts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Sort By
                    </label>
                    <Select value={sortBy} onValueChange={(value: string) => setSortBy(value as ContentSortBy)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="price_low">Price: Low to High</SelectItem>
                        <SelectItem value="price_high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <p className="text-muted-foreground text-sm sm:text-base">
                {discoveryResult ? `Showing ${discoveryResult.contentIds.length} of ${discoveryResult.totalCount} results` : 'Loading...'}
              </p>
              {viewport.breakpoint !== 'mobile' && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {gridLayout.columns} columns • {Math.round(gridLayout.cardWidth)}px cards
                </p>
              )}
            </div>
          </div>

          {/* Content Grid */}
          {isLoading ? (
            <div style={gridStyles}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{ width: `${gridLayout.cardWidth}px` }}>
                  <Card className="overflow-hidden">
                    <div className="aspect-video">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3" />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Failed to load content</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          ) : discoveryResult && discoveryResult.contentIds.length > 0 ? (
            <div style={gridStyles}>
              {discoveryResult.contentIds.map((contentId) => (
                <ContentCard
                  key={contentId.toString()}
                  contentId={contentId}
                  width={viewMode === 'grid' ? gridLayout.cardWidth : gridLayout.totalWidth}
                  breakpoint={viewport.breakpoint}
                  compact={viewMode === 'list'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No content found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )}

          {/* Load More Button */}
          {discoveryResult && discoveryResult.hasNextPage && (
            <div className="mt-12 text-center">
              <Button>
                Load More Content
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ContentBrowser

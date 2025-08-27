/**
 * Content Discovery Grid Component
 * File: src/components/content/ContentDiscoveryGrid.tsx
 * 
 * This component transforms your platform from a content creation tool into a
 * sophisticated content marketplace where users can discover, explore, and engage
 * with content uploaded by creators. It demonstrates how our architectural layers
 * enable complex discovery workflows that feel as polished as traditional content
 * platforms while providing the unique benefits of blockchain-based ownership.
 * 
 * Key Features:
 * - Responsive grid layout optimized for content browsing
 * - Advanced filtering by category, price range, access type, and date
 * - Real-time search with debounced queries and result highlighting
 * - Intelligent pagination with infinite scroll capabilities
 * - Access-aware content cards showing ownership and purchase status
 * - Seamless integration with purchase workflows from Component 6
 * - Empty state handling and progressive loading experiences
 * - Mobile-first responsive design with adaptive layouts
 * 
 * This component showcases how sophisticated content discovery can be built
 * on blockchain infrastructure while maintaining the user experience quality
 * that users expect from modern content platforms.
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Search,
  Grid3x3,
  List,
  Loader2,
  AlertCircle,
  Eye,
  Lock,
  Unlock,
  Users,
  X,
  RefreshCw
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'




import { Slider } from '@/components/ui/slider'
import { cn, debounce, formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'

// Import our architectural layers and components
import {
  useActiveContentPaginated,
  useContentById,
  useHasContentAccess,
  useCreatorProfile
} from '@/hooks/contracts/core'
import { useAccount } from 'wagmi'
import { OrchestratedContentPurchaseCard } from '@/components/content/OrchestratedContentPurchaseCard'
import { ContentCategory, categoryToString } from '@/types/contracts'

/**
 * Filter Configuration Interface
 * 
 * This interface defines the comprehensive filtering options available
 * to users for discovering content that matches their interests and needs.
 */
interface ContentFilters {
  search: string
  category: ContentCategory | 'all'
  priceRange: [number, number]
  accessType: 'all' | 'free' | 'premium' | 'subscription'
  sortBy: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular'
  tags: string[]
}

/**
 * View Mode Options
 * 
 * Users can switch between different layout modes based on their
 * browsing preferences and device characteristics.
 */
type ViewMode = 'grid' | 'list' | 'compact'

/**
 * Props interface for the ContentDiscoveryGrid component
 */
interface ContentDiscoveryGridProps {
  /** Optional initial filters to apply */
  initialFilters?: Partial<ContentFilters>
  /** Optional callback when content is selected */
  onContentSelect?: (contentId: bigint) => void
  /** Whether to show creator information prominently */
  showCreatorInfo?: boolean
  /** Maximum number of items to load per page */
  itemsPerPage?: number
  /** Optional custom styling */
  className?: string
}

/**
 * Default filter configuration
 */
const DEFAULT_FILTERS: ContentFilters = {
  search: '',
  category: 'all',
  priceRange: [0, 100],
  accessType: 'all',
  sortBy: 'newest',
  tags: []
}

/**
 * ContentDiscoveryGrid Component
 * 
 * This component demonstrates the complete content discovery experience,
 * from search and filtering through content preview to purchase initiation.
 * It showcases how our architectural layers enable sophisticated discovery
 * workflows while maintaining excellent performance and user experience.
 */
export function ContentDiscoveryGrid({
  initialFilters = {},
  onContentSelect,
  showCreatorInfo = true,
  itemsPerPage = 12,
  className
}: ContentDiscoveryGridProps) {
  // Wallet connection for access control
  const { address: userAddress } = useAccount()

  // Filter and view state management
  const [filters, setFilters] = useState<ContentFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  })
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(0)

  // Get paginated content data using our core hooks
  const contentQuery = useActiveContentPaginated(
    currentPage * itemsPerPage,
    itemsPerPage
  )

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useMemo(() => {
    return debounce((...args: unknown[]) => {
      const searchTerm = args[0] as string
      setFilters(prev => ({ ...prev, search: searchTerm }))
      setCurrentPage(0)
    }, 300)
  }, [])
  

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    debouncedSearch(value)
  }, [debouncedSearch])

  // Handle filter changes with page reset
  const handleFilterChange = useCallback((newFilters: Partial<ContentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(0)
  }, [])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setCurrentPage(0)
  }, [])

  // Load more content (for infinite scroll)
  const handleLoadMore = useCallback(() => {
    if (contentQuery.data && contentQuery.data.contentIds.length === itemsPerPage) {
      setCurrentPage(prev => prev + 1)
    }
  }, [contentQuery.data, itemsPerPage])

  // Determine if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.category !== 'all' ||
      filters.priceRange[0] !== 0 ||
      filters.priceRange[1] !== 100 ||
      filters.accessType !== 'all' ||
      filters.tags.length > 0
    )
  }, [filters])

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header Section with Search and View Controls */}
      <DiscoveryHeader
        searchValue={filters.search}
        onSearchChange={handleSearchChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        totalItems={contentQuery.data?.total || BigInt(0)}
      />

      {/* Filters Section */}
      <FiltersSection
        filters={filters}
        onFilterChange={handleFilterChange}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Content Grid */}
      <ContentGridSection
        contentIds={contentQuery.data?.contentIds || []}
        viewMode={viewMode}
        showCreatorInfo={showCreatorInfo}
        onContentSelect={onContentSelect}
        userAddress={userAddress}
        isLoading={contentQuery.isLoading}
        error={contentQuery.error}
        onRefresh={contentQuery.refetch}
      />

      {/* Pagination Controls */}
      <PaginationSection
        currentPage={currentPage}
        totalItems={contentQuery.data?.total || BigInt(0)}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onLoadMore={handleLoadMore}
        isLoading={contentQuery.isLoading}
      />
    </div>
  )
}

/**
 * Discovery Header Component
 * 
 * This component provides the main search interface and view controls,
 * establishing the primary interaction patterns for content discovery.
 */
function DiscoveryHeader({
  searchValue,
  onSearchChange,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
  totalItems
}: {
  searchValue: string
  onSearchChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  totalItems: bigint
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content, creators, or tags..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Results Summary and Controls */}
      <div className="flex items-center gap-4">
        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {totalItems.toString()} {totalItems === BigInt(1) ? 'item' : 'items'}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}

        {/* View Mode Toggles */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-r-none"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-none border-x"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'compact' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('compact')}
            className="rounded-l-none"
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Filters Section Component
 * 
 * This component provides comprehensive filtering options that help users
 * narrow down content to match their specific interests and requirements.
 */
function FiltersSection({
  filters,
  onFilterChange,
  hasActiveFilters
}: {
  filters: ContentFilters
  onFilterChange: (filters: Partial<ContentFilters>) => void
  hasActiveFilters: boolean
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={filters.category === 'all' ? 'all' : filters.category.toString()}
              onValueChange={(value) => 
                onFilterChange({ 
                  category: value === 'all' ? 'all' : parseInt(value) as ContentCategory 
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                {Object.values(ContentCategory)
                  .filter(value => typeof value === 'number')
                  .map((category) => (
                    <SelectItem key={category} value={category.toString()}>
                      {categoryToString(category as ContentCategory)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Access Type Filter */}
          <div className="space-y-2">
            <Label>Access Type</Label>
            <Select
              value={filters.accessType}
              onValueChange={(value: ContentFilters['accessType']) => 
                onFilterChange({ accessType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="free">Free Content</SelectItem>
                <SelectItem value="premium">Pay-per-view</SelectItem>
                <SelectItem value="subscription">Subscription Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value: ContentFilters['sortBy']) => 
                onFilterChange({ sortBy: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <Label>Price Range</Label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value: [number, number]) => onFilterChange({ priceRange: value})}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}+</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
                  {filters.search && (
                <Badge variant="secondary">
                  Search: &quot;{filters.search}&quot;
                </Badge>
              )}
              {filters.category !== 'all' && (
                <Badge variant="secondary">
                  {categoryToString(filters.category as ContentCategory)}
                </Badge>
              )}
              {filters.accessType !== 'all' && (
                <Badge variant="secondary">
                  {filters.accessType === 'free' ? 'Free' : 
                   filters.accessType === 'premium' ? 'Pay-per-view' : 'Subscription'}
                </Badge>
              )}
              {(filters.priceRange[0] !== 0 || filters.priceRange[1] !== 100) && (
                <Badge variant="secondary">
                  ${filters.priceRange[0]} - ${filters.priceRange[1]}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Content Grid Section Component
 * 
 * This component renders the actual content items in the selected view mode,
 * handling loading states, errors, and empty states appropriately.
 */
function ContentGridSection({
  contentIds,
  viewMode,
  showCreatorInfo,
  onContentSelect,
  userAddress,
  isLoading,
  error,
  onRefresh
}: {
  contentIds: readonly bigint[]
  viewMode: ViewMode
  showCreatorInfo: boolean
  onContentSelect?: (contentId: bigint) => void
  userAddress?: string
  isLoading: boolean
  error: Error | null
  onRefresh: () => void
}) {
  // Loading state
  if (isLoading && contentIds.length === 0) {
    return <LoadingGrid viewMode={viewMode} />
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={onRefresh} />
  }

  // Empty state
  if (contentIds.length === 0) {
    return <EmptyState />
  }

  // Content grid
  const gridClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    list: 'space-y-4',
    compact: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
  }

  return (
    <div className={gridClasses[viewMode]}>
      {contentIds.map((contentId) => (
        <ContentDisplayCard
          key={contentId.toString()}
          contentId={contentId}
          viewMode={viewMode}
          showCreatorInfo={showCreatorInfo}
          onSelect={onContentSelect}
          userAddress={userAddress}
        />
      ))}
    </div>
  )
}

/**
 * Content Display Card Component
 * 
 * This component renders individual content items with access indicators,
 * creator information, and purchase integration capabilities.
 */
function ContentDisplayCard({
  contentId,
  viewMode,
  showCreatorInfo,
  onSelect,
  userAddress
}: {
  contentId: bigint
  viewMode: ViewMode
  showCreatorInfo: boolean
  onSelect?: (contentId: bigint) => void
  userAddress?: string
}) {
  // Get content data and access control information
  const contentQuery = useContentById(contentId)
  const accessControl = useHasContentAccess(
    userAddress as `0x${string}` | undefined,
    contentId,
  )
  const creatorProfile = useCreatorProfile(contentQuery.data?.creator)

  // Handle content selection
  const handleSelect = useCallback(() => {
    if (onSelect) {
      onSelect(contentId)
    }
  }, [contentId, onSelect])

  // Loading state for individual cards
  if (contentQuery.isLoading) {
    return <ContentCardSkeleton viewMode={viewMode} />
  }

  // Error state for individual cards
  if (contentQuery.error || !contentQuery.data) {
    return <ContentCardError />
  }

  const content = contentQuery.data

  // Render based on view mode
  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleSelect}>
        <div className="flex">
          {/* Content Thumbnail/Icon */}
          <div className="w-32 h-32 bg-muted flex items-center justify-center flex-shrink-0">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          
          {/* Content Information */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold line-clamp-1">{content.title}</h3>
                  <AccessStatusBadge hasAccess={accessControl.data} />
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {content.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{categoryToString(content.category)}</span>
                  <span>{formatRelativeTime(content.creationTime)}</span>
                  {showCreatorInfo && (
                    <span>by {formatAddress(content.creator)}</span>
                  )}
                </div>
              </div>
              
              <div className="text-right ml-4">
                <div className="text-lg font-bold">
                  {formatCurrency(content.payPerViewPrice)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (viewMode === 'compact') {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={handleSelect}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm line-clamp-1">{content.title}</h3>
                <AccessStatusBadge hasAccess={accessControl.data} />
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-1">
                {content.description}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {categoryToString(content.category)}
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(content.payPerViewPrice)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default grid view
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted flex items-center justify-center">
        <Eye className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{content.title}</CardTitle>
          <AccessStatusBadge hasAccess={accessControl.data} />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="line-clamp-3 mb-3">
          {content.description}
        </CardDescription>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary">{categoryToString(content.category)}</Badge>
            <span className="font-medium">{formatCurrency(content.payPerViewPrice)}</span>
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
          
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(content.creationTime)}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="w-full">
          <OrchestratedContentPurchaseCard
            contentId={contentId}
            userAddress={userAddress as `0x${string}` | undefined}
            onPurchaseSuccess={() => {
              // Refresh access control data
              accessControl.refetch()
            }}
            variant="full"
            showCreatorInfo={true}
            showPurchaseDetails={true}
            enableMultiPayment={true}
            showSystemHealth={true}
            enablePerformanceMetrics={false}
            className="w-full"
          />
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * Access Status Badge Component
 * 
 * This component provides clear visual indication of the user's access
 * status for each piece of content.
 */
function AccessStatusBadge({ hasAccess }: { hasAccess?: boolean }) {
  if (hasAccess === undefined) {
    return null
  }

  if (hasAccess) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <Unlock className="h-3 w-3 mr-1" />
        Owned
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      <Lock className="h-3 w-3 mr-1" />
      Locked
    </Badge>
  )
}

/**
 * Loading Grid Component
 * 
 * This component provides skeleton loading states that match the
 * selected view mode, maintaining layout consistency during loading.
 */
function LoadingGrid({ viewMode }: { viewMode: ViewMode }) {
  const skeletonCount = viewMode === 'grid' ? 8 : viewMode === 'list' ? 5 : 6
  
  const gridClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
    list: 'space-y-4',
    compact: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
  }

  return (
    <div className={gridClasses[viewMode]}>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <ContentCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  )
}

/**
 * Content Card Skeleton Component
 * 
 * This component provides loading placeholders that match the
 * structure of actual content cards for smooth loading experiences.
 */
function ContentCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          <div className="w-32 h-32 bg-muted animate-pulse" />
          <div className="flex-1 p-6 space-y-3">
            <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-full" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
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
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 bg-muted animate-pulse rounded w-full" />
        <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
      </CardContent>
    </Card>
  )
}

/**
 * Error State Component
 * 
 * This component handles error scenarios with clear messaging
 * and recovery options for users.
 */
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Card className="text-center p-8">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Unable to Load Content</h3>
      <p className="text-muted-foreground mb-4">
        We encountered an error while loading content. This might be a temporary issue.
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </Card>
  )
}

/**
 * Empty State Component
 * 
 * This component provides guidance when no content matches
 * the current filters or when no content has been uploaded yet.
 */
function EmptyState() {
  return (
    <Card className="text-center p-12">
      <Eye className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">No Content Found</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        We couldn&apos;t find any content matching your current filters. 
        Try adjusting your search criteria or check back later for new content.
      </p>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Suggestions:</p>
        <ul className="space-y-1">
          <li>• Clear your current filters</li>
          <li>• Try different search terms</li>
          <li>• Browse different categories</li>
          <li>• Check back later for new uploads</li>
        </ul>
      </div>
    </Card>
  )
}

/**
 * Content Card Error Component
 * 
 * This component handles errors for individual content cards
 * without disrupting the overall grid layout.
 */
function ContentCardError() {
  return (
    <Card className="text-center p-6 border-dashed border-red-200">
      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
      <p className="text-sm text-red-600">Failed to load content</p>
    </Card>
  )
}

/**
 * Pagination Section Component
 * 
 * This component provides pagination controls and load-more functionality
 * for navigating through large content collections.
 */
function PaginationSection({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLoadMore,
  isLoading
}: {
  currentPage: number
  totalItems: bigint
  itemsPerPage: number
  onPageChange: (page: number) => void
  onLoadMore: () => void
  isLoading: boolean
}) {
  const totalPages = Math.ceil(Number(totalItems) / itemsPerPage)
  const hasNextPage = currentPage < totalPages - 1

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {currentPage * itemsPerPage + 1} to{' '}
        {Math.min((currentPage + 1) * itemsPerPage, Number(totalItems))} of{' '}
        {totalItems.toString()} results
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Previous
        </Button>
        
        <span className="text-sm">
          Page {currentPage + 1} of {totalPages}
        </span>
        
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Next'}
        </Button>
      </div>
    </div>
  )
}

/**
 * Usage Examples and Integration Patterns
 * 
 * // Basic usage for content browsing page
 * <ContentDiscoveryGrid
 *   onContentSelect={(contentId) => {
 *     router.push(`/content/${contentId}`)
 *   }}
 * />
 * 
 * // With initial filters for category page
 * <ContentDiscoveryGrid
 *   initialFilters={{ category: ContentCategory.VIDEO }}
 *   showCreatorInfo={true}
 * />
 * 
 * // Compact mode for sidebar or smaller spaces
 * <ContentDiscoveryGrid
 *   itemsPerPage={6}
 *   initialFilters={{ accessType: 'free' }}
 * />
 */
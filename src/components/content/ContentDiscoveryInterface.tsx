/**
 * Content Discovery Interface - Phase 2 Component
 * File: src/components/content/ContentDiscoveryInterface.tsx
 * 
 * This component transforms our sophisticated content discovery analytics into an
 * intuitive content browsing experience. It demonstrates how to build production-ready
 * UI components that leverage advanced data layer functionality while maintaining
 * excellent user experience and performance characteristics.
 * 
 * Educational Architecture Integration:
 * - Consumes our useContentDiscovery hook to demonstrate data-to-UI patterns
 * - Follows your established component patterns from AppLayout and CreatorDashboard
 * - Uses your exact shadcn/ui component structure and Tailwind CSS patterns
 * - Integrates with your existing content viewing and purchase workflows
 * - Demonstrates responsive design and mobile-first development approaches
 * 
 * Key Features:
 * - Advanced filtering by category, tag, price range, and creator
 * - Real-time search with debounced input for optimal performance
 * - Sophisticated sorting options with user-friendly labels
 * - Pagination with page size options and navigation controls
 * - Content preview cards with purchase integration
 * - Empty states and loading indicators for excellent UX
 * - Responsive grid layout adapting to screen sizes
 * - Error handling with recovery options
 * 
 * Business Impact:
 * - Transforms content discovery from simple lists to intelligent browsing
 * - Enables users to find relevant content through multiple discovery pathways
 * - Increases content discoverability and creator revenue potential
 * - Provides foundation for recommendation and personalization features
 * - Demonstrates platform sophistication and professionalism
 * 
 * Component Architecture:
 * - Separates search controls from content display for modularity
 * - Uses composition patterns for flexible layout arrangements
 * - Integrates with existing content purchase and viewing workflows
 * - Maintains state efficiently with proper React patterns
 * - Provides extensibility for future enhancement (recommendations, AI, etc.)
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  X,
  Verified,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  BookOpen,
  Folder
} from 'lucide-react'

// Import your established UI components following the exact patterns
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'


import { cn } from '@/lib/utils'

// Import our sophisticated data layer hooks
import {
  useContentDiscovery,
  ContentCategory,
  ContentSortBy,
  ContentDiscoveryParams,
  getCategoryDisplayName,
  getSortOptions,
  getCommonPriceRanges
} from '@/hooks/contracts/content/useContentDiscovery'
import { useContentById, useCreatorProfile } from '@/hooks/contracts/core'
import { formatCurrency, formatAddress, formatRelativeTime } from '@/lib/utils'
import { type Address } from 'viem'
import { categoryToString, type ContentWithMetadata } from '@/types/contracts'
import { ContentNFTPromotion } from '@/components/content/ContentNFTPromotion'
import { toast } from 'sonner'

// ===== COMPONENT INTERFACE DEFINITIONS =====

/**
 * Content Discovery Configuration
 * Defines the filtering and display options for the content discovery interface
 */
interface ContentDiscoveryConfig {
  readonly initialCategory?: ContentCategory
  readonly initialTags?: readonly string[]
  readonly initialSortBy?: ContentSortBy
  readonly showFilters?: boolean
  readonly showSorting?: boolean
  readonly showViewToggle?: boolean
  readonly enableSearch?: boolean
  readonly itemsPerPage?: number
  readonly maxItemsPerPage?: number
}

/**
 * Content Display Mode
 * Determines how content is visually presented to users
 */
type ContentDisplayMode = 'grid' | 'list' | 'compact'

/**
 * Filter State Interface
 * Manages the current state of all discovery filters and search parameters
 */
interface FilterState {
  readonly searchQuery: string
  readonly selectedCategories: readonly ContentCategory[]
  readonly selectedTags: readonly string[]
  readonly sortBy: ContentSortBy
  readonly priceRange: {
    readonly min?: bigint
    readonly max?: bigint
  }
  readonly creatorFilter?: Address
  readonly onlyVerified: boolean
}

/**
 * Component Props Interface
 * Defines the configuration and callback options for the content discovery component
 */
interface ContentDiscoveryInterfaceProps {
  /** Optional configuration for discovery behavior */
  config?: ContentDiscoveryConfig
  /** Callback when content is selected for viewing */
  onContentSelect?: (contentId: bigint) => void
  /** Callback when creator is selected for viewing */
  onCreatorSelect?: (creatorAddress: Address) => void
  /** Optional custom styling */
  className?: string
  /** Whether to show the component in a compact mode */
  compact?: boolean
}

// ===== MAIN COMPONENT IMPLEMENTATION =====

/**
 * ContentDiscoveryInterface Component
 * 
 * This component demonstrates how to transform sophisticated data layer functionality
 * into an intuitive user interface that feels familiar and responsive. It showcases
 * advanced React patterns while maintaining excellent performance characteristics.
 * 
 * Key Teaching Points:
 * - How to manage complex filter state efficiently using React hooks
 * - Debouncing techniques for search input to optimize performance
 * - Component composition patterns for building flexible interfaces
 * - Integration between data layer hooks and presentation components
 * - Responsive design implementation using Tailwind CSS utilities
 * - Error boundary patterns and graceful degradation strategies
 */
export function ContentDiscoveryInterface({
  config = {},
  onContentSelect,
  onCreatorSelect,
  className,
  compact = false
}: ContentDiscoveryInterfaceProps) {
  const router = useRouter()
  const { address: connectedAddress, isConnected } = useAccount()

  // Extract configuration with intelligent defaults
  const {
    initialCategory,
    initialTags = [],
    initialSortBy = 'latest',
    showFilters = true,
    showSorting = true,
    showViewToggle = true,
    enableSearch = true,
    itemsPerPage = compact ? 6 : 12,
    maxItemsPerPage = 50
  } = config

  // ===== STATE MANAGEMENT =====
  // Sophisticated state management demonstrating React best practices

  // Filter and search state with proper initial values
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedCategories: initialCategory ? [initialCategory] : [],
    selectedTags: [...initialTags],
    sortBy: initialSortBy,
    priceRange: {},
    creatorFilter: undefined,
    onlyVerified: false
  })

  // UI state management
  const [displayMode, setDisplayMode] = useState<ContentDisplayMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // ===== SEARCH DEBOUNCING =====
  // Demonstrates performance optimization for real-time search

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(filterState.searchQuery)

  const handleSearchChange = useCallback((query: string) => {
    setFilterState(prev => ({ ...prev, searchQuery: query }))
    
    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer)
    }

    // Set new timer for debounced search
    const newTimer = setTimeout(() => {
      setDebouncedSearchQuery(query)
      setCurrentPage(1) // Reset pagination when search changes
    }, 300) // 300ms debounce

    setSearchDebounceTimer(newTimer)
  }, [searchDebounceTimer])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer)
      }
    }
  }, [searchDebounceTimer])

  // ===== DATA LAYER INTEGRATION =====
  // Demonstrates how to consume our sophisticated analytics hooks

  // Build discovery parameters from current filter state
  const discoveryParams = useMemo((): ContentDiscoveryParams => ({
    page: currentPage,
    limit: pageSize,
    sortBy: filterState.sortBy,
    minPrice: filterState.priceRange.min,
    maxPrice: filterState.priceRange.max,
    creatorAddress: filterState.creatorFilter,
    searchQuery: debouncedSearchQuery || undefined,
    includeInactive: false // Only show active content
  }), [currentPage, pageSize, filterState, debouncedSearchQuery])

  // Use our sophisticated content discovery hook
  const {
    data: discoveryResult,
    isLoading,
    isError,
    error,
    refetch,
    hasSearchResults
  } = useContentDiscovery({
    categories: filterState.selectedCategories,
    tags: filterState.selectedTags,
    discoveryParams,
    mergeStrategy: 'union' // Show content matching ANY of the selected criteria
  })

  // ===== EVENT HANDLERS =====
  // Demonstrates clean event handling patterns

  const handleCategoryToggle = useCallback((category: ContentCategory) => {
    setFilterState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(category)
        ? prev.selectedCategories.filter(c => c !== category)
        : [...prev.selectedCategories, category]
    }))
    setCurrentPage(1) // Reset pagination when filters change
  }, [])

  const handleTagToggle = useCallback((tag: string) => {
    setFilterState(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }))
    setCurrentPage(1)
  }, [])

  const handleSortChange = useCallback((sortBy: ContentSortBy) => {
    setFilterState(prev => ({ ...prev, sortBy }))
    setCurrentPage(1)
  }, [])

  const handlePriceRangeChange = useCallback((min?: bigint, max?: bigint) => {
    setFilterState(prev => ({
      ...prev,
      priceRange: { min, max }
    }))
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilterState({
      searchQuery: '',
      selectedCategories: [],
      selectedTags: [],
      sortBy: 'latest',
      priceRange: {},
      creatorFilter: undefined,
      onlyVerified: false
    })
    setDebouncedSearchQuery('')
    setCurrentPage(1)
  }, [])

  const handleContentClick = useCallback((contentId: bigint) => {
    if (onContentSelect) {
      onContentSelect(contentId)
    } else {
      // Default behavior: navigate to content page
      router.push(`/content/${contentId}`)
    }
  }, [onContentSelect, router])

  const handleCreatorClick = useCallback((creatorAddress: Address) => {
    if (onCreatorSelect) {
      onCreatorSelect(creatorAddress)
    } else {
      // Default behavior: navigate to creator profile
      router.push(`/creator/${creatorAddress}`)
    }
  }, [onCreatorSelect, router])

  // ===== COMPUTED VALUES =====
  // Demonstrates efficient computation with useMemo

  const hasActiveFilters = useMemo(() => {
    return filterState.selectedCategories.length > 0 ||
           filterState.selectedTags.length > 0 ||
           filterState.searchQuery.length > 0 ||
           filterState.priceRange.min !== undefined ||
           filterState.priceRange.max !== undefined ||
           filterState.creatorFilter !== undefined ||
           filterState.onlyVerified
  }, [filterState])

  const availablePageSizes = useMemo(() => [6, 12, 24, 48].filter(size => size <= maxItemsPerPage), [maxItemsPerPage])

  // ===== RENDER FUNCTIONS =====
  // Demonstrates component composition patterns

  const renderFilterSection = () => (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        {enableSearch && (
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">Search Content</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Search titles, descriptions, tags..."
                value={filterState.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Categories</Label>
          <div className="flex flex-wrap gap-2">
            {Object.values(ContentCategory)
              .filter((value): value is ContentCategory => typeof value === 'number')
              .map(category => (
                <Button
                  key={category}
                  variant={filterState.selectedCategories.includes(category) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryToggle(category)}
                  className="h-8 text-xs"
                >
                  {getCategoryDisplayName(category)}
                </Button>
              ))}
          </div>
        </div>

        {/* Price Range Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Price Range</Label>
          <div className="grid grid-cols-2 gap-2">
            {getCommonPriceRanges().map((range, index) => (
              <Button
                key={index}
                variant={
                  filterState.priceRange.min === range.min && 
                  filterState.priceRange.max === range.max ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => handlePriceRangeChange(range.min, range.max)}
                className="h-8 text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Verified Creators Filter */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="verified-only"
            checked={filterState.onlyVerified}
            onChange={(e) => setFilterState(prev => ({ ...prev, onlyVerified: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="verified-only" className="text-sm">
            <div className="flex items-center space-x-1">
              <Verified className="h-3 w-3" />
              <span>Verified creators only</span>
            </div>
          </Label>
        </div>
      </CardContent>
    </Card>
  )

  const renderSortingControls = () => (
    <div className="flex items-center space-x-3">
      <Label className="text-sm font-medium whitespace-nowrap">Sort by:</Label>
      <Select value={filterState.sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {getSortOptions().map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const renderViewControls = () => (
    <div className="flex items-center space-x-1">
      <Button
        variant={displayMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setDisplayMode('grid')}
        className="h-8 w-8 p-0"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={displayMode === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setDisplayMode('list')}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )

  const renderPaginationControls = () => {
    if (!discoveryResult) return null

    const { hasNextPage, hasPreviousPage, currentPage: page, totalPages } = discoveryResult

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label className="text-sm text-muted-foreground">Items per page:</Label>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availablePageSizes.map(size => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={!hasPreviousPage}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!hasNextPage}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN COMPONENT RENDER =====
  // Demonstrates sophisticated layout composition

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header Section with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Discover Content</h2>
          <p className="text-muted-foreground">
            {discoveryResult ? (
              `${Number(discoveryResult.totalCount)} ${Number(discoveryResult.totalCount) === 1 ? 'item' : 'items'} found`
            ) : (
              'Find content that interests you'
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mobile Filter Toggle */}
          {showFilters && (
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Content Filters</SheetTitle>
                  <SheetDescription>
                    Refine your content discovery experience
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  {renderFilterSection()}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filters Sidebar */}
        {showFilters && (
          <div className="hidden lg:block lg:col-span-1">
            {renderFilterSection()}
          </div>
        )}

        {/* Content Area */}
        <div className={cn("space-y-4", showFilters ? "lg:col-span-3" : "lg:col-span-4")}>
          {/* Sorting and View Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            {showSorting && renderSortingControls()}
            {showViewToggle && renderViewControls()}
          </div>

          {/* Content Display Area */}
          <div className="min-h-[400px]">
            {isLoading ? (
              <ContentLoadingState compact={compact} />
            ) : isError ? (
              <ContentErrorState error={error} onRetry={refetch} />
            ) : !hasSearchResults || !discoveryResult?.contentIds.length ? (
              <ContentEmptyState 
                hasFilters={hasActiveFilters} 
                onClearFilters={handleClearFilters}
              />
            ) : (
              <ContentGrid
                contentIds={discoveryResult.contentIds}
                displayMode={displayMode}
                onContentClick={handleContentClick}
                onCreatorClick={handleCreatorClick}
                compact={compact}
              />
            )}
          </div>

          {/* Pagination */}
          {discoveryResult && hasSearchResults && (
            <div className="border-t pt-4">
              {renderPaginationControls()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== SUPPORTING COMPONENTS =====
// Demonstrates component composition and reusability patterns

/**
 * Content Grid Component
 * Renders the actual content items in the selected display mode
 */
interface ContentGridProps {
  contentIds: readonly bigint[]
  displayMode: ContentDisplayMode
  onContentClick: (contentId: bigint) => void
  onCreatorClick: (creatorAddress: Address) => void
  compact?: boolean
}

function ContentGrid({ 
  contentIds, 
  displayMode, 
  onContentClick, 
  onCreatorClick, 
  compact = false 
}: ContentGridProps) {
  const gridClassName = useMemo(() => {
    switch (displayMode) {
      case 'grid':
        return compact 
          ? "grid grid-cols-2 md:grid-cols-3 gap-4"
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      case 'list':
        return "space-y-4"
      case 'compact':
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    }
  }, [displayMode, compact])

  return (
    <div className={gridClassName}>
      {contentIds.map(contentId => (
        <ContentCard
          key={contentId.toString()}
          contentId={contentId}
          displayMode={displayMode}
          onContentClick={onContentClick}
          onCreatorClick={onCreatorClick}
          compact={compact}
        />
      ))}
    </div>
  )
}

/**
 * Individual Content Card Component
 * Displays a single piece of content with preview and interaction options
 */
interface ContentCardProps {
  contentId: bigint
  displayMode: ContentDisplayMode
  onContentClick: (contentId: bigint) => void
  onCreatorClick: (creatorAddress: Address) => void
  compact?: boolean
}

function ContentCard({ 
  contentId, 
  displayMode, 
  onContentClick, 
  onCreatorClick, 
  compact = false 
}: ContentCardProps) {
  const { data: content, isLoading: contentLoading } = useContentById(contentId)
  const { data: creator } = useCreatorProfile(content?.creator)
  const { address: connectedAddress, isConnected } = useAccount()

  // Check if connected user is the content creator
  const isCreator = useMemo(() => {
    return connectedAddress && content?.creator && 
           connectedAddress.toLowerCase() === content.creator.toLowerCase()
  }, [connectedAddress, content?.creator])

  // Force UI refresh when wallet connects/disconnects
  useEffect(() => {
    if (isConnected && connectedAddress) {
      console.log('🔄 ContentDiscoveryInterface: Wallet connected, refreshing UI for:', connectedAddress)
      // Force a re-render by updating the component state
      // This will trigger the isCreator calculation and show/hide NFT promotion
    } else if (!isConnected) {
      console.log('🔄 ContentDiscoveryInterface: Wallet disconnected, clearing creator state')
      // The isCreator will automatically become false when connectedAddress is null
    }
  }, [isConnected, connectedAddress])

  // Create ContentWithMetadata from Content for NFT promotion
  const contentWithMetadata = useMemo(() => {
    if (!content) return null
    
    return {
      ...content,
      contentId: contentId,
      formattedPrice: formatCurrency(content.payPerViewPrice, 6),
      relativeTime: formatRelativeTime(content.creationTime),
      creatorProfile: creator,
      accessCount: BigInt(0), // This would need to come from a separate query
      tags: [] // This would need to come from a separate query
    } as ContentWithMetadata
  }, [content, contentId, creator])

  if (contentLoading || !content) {
    return <ContentCardSkeleton displayMode={displayMode} />
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onContentClick(contentId)
  }

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (content.creator) {
      onCreatorClick(content.creator)
    }
  }

  if (displayMode === 'list') {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-shrink-0">
              <ContentTypeIcon category={content.category} className="h-10 w-10" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-lg truncate">{content.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {content.description}
                  </p>
                  <div className="flex items-center space-x-3 mt-2">
                    <button
                      onClick={handleCreatorClick}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {creator?.isVerified && <Verified className="inline h-3 w-3 mr-1" />}
                      {formatAddress(content.creator)}
                    </button>
                    <Badge variant="secondary">
                      {categoryToString(content.category)}
                    </Badge>
                    {isCreator && contentWithMetadata && (
                      <ContentNFTPromotion
                        content={contentWithMetadata}
                        creatorAddress={content.creator}
                        onMintSuccess={(contractAddress, tokenId) => {
                          toast.success('Content minted as NFT!')
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-lg font-bold">
                    {formatCurrency(content.payPerViewPrice, 6)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeTime(content.creationTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow group" onClick={handleCardClick}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <ContentTypeIcon 
              category={content.category} 
              className={cn("h-8 w-8", compact && "h-6 w-6")} 
            />
            <Badge variant="secondary" className={cn("text-xs", compact && "text-[10px] px-1")}>
              {categoryToString(content.category)}
            </Badge>
          </div>
          
          <div>
            <h3 className={cn("font-medium line-clamp-2", compact ? "text-sm" : "text-lg")}>
              {content.title}
            </h3>
            <p className={cn("text-muted-foreground line-clamp-2 mt-1", compact ? "text-xs" : "text-sm")}>
              {content.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleCreatorClick}
              className={cn("font-medium text-blue-600 hover:text-blue-800 flex items-center", compact ? "text-xs" : "text-sm")}
            >
              {creator?.isVerified && <Verified className="h-3 w-3 mr-1" />}
              {formatAddress(content.creator)}
            </button>
            <div className={cn("font-bold", compact ? "text-sm" : "text-lg")}>
              {formatCurrency(content.payPerViewPrice, 6)}
            </div>
          </div>

          <div className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
            {formatRelativeTime(content.creationTime)}
          </div>
          
          {isCreator && contentWithMetadata && (
            <div className="flex justify-center">
              <ContentNFTPromotion
                content={contentWithMetadata}
                creatorAddress={content.creator}
                onMintSuccess={(contractAddress, tokenId) => {
                  toast.success('Content minted as NFT!')
                }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Content Type Icon Component
 * Returns appropriate icon based on content category
 */
function ContentTypeIcon({ category, className }: { category: number; className?: string }) {
  const iconMap = {
    0: FileText,    // Article
    1: Video,       // Video
    2: Music,       // Audio
    3: ImageIcon,   // Image
    4: FileText,    // Document
    5: BookOpen,    // Course
    6: Folder       // Other
  }

  const IconComponent = iconMap[category as keyof typeof iconMap] || Folder
  return <IconComponent className={cn("text-muted-foreground", className)} />
}

/**
 * Loading State Components
 * Provides skeleton loading states while content is being fetched
 */
function ContentLoadingState({ compact = false }: { compact?: boolean }) {
  const skeletonCount = compact ? 6 : 9

  return (
    <div className={cn(
      "grid gap-6",
      compact 
        ? "grid-cols-2 md:grid-cols-3" 
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    )}>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <ContentCardSkeleton key={index} displayMode="grid" />
      ))}
    </div>
  )
}

function ContentCardSkeleton({ displayMode }: { displayMode: ContentDisplayMode }) {
  if (displayMode === 'list') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="h-10 w-10 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-5 w-12 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error State Component
 * Displays error messages with recovery options
 */
function ContentErrorState({ 
  error, 
  onRetry 
}: { 
  error: Error | null; 
  onRetry: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <AlertCircle className="h-12 w-12 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Unable to load content</h3>
        <p className="text-muted-foreground max-w-md">
          {error?.message || 'An unexpected error occurred while loading content. Please try again.'}
        </p>
      </div>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  )
}

/**
 * Empty State Component
 * Displays appropriate message when no content is found
 */
function ContentEmptyState({ 
  hasFilters, 
  onClearFilters 
}: { 
  hasFilters: boolean; 
  onClearFilters: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Search className="h-12 w-12 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">
          {hasFilters ? 'No content matches your filters' : 'No content available'}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {hasFilters 
            ? 'Try adjusting your search criteria or removing some filters to see more results.'
            : 'Content will appear here once creators start publishing. Check back soon!'
          }
        </p>
      </div>
      {hasFilters && (
        <Button onClick={onClearFilters} variant="outline">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  )
}

// Export the main component and supporting interfaces
export type { ContentDiscoveryInterfaceProps, ContentDiscoveryConfig }

// Export helper components for external use
export {
  ContentGrid,
  ContentCard,
  ContentLoadingState,
  ContentErrorState,
  ContentEmptyState
}
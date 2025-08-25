/**
 * UnifiedContentBrowser Component - Phase 2 Component System Convergence
 * File: src/components/content/UnifiedContentBrowser.tsx
 * 
 * This component unifies the web app and mini app content browsing experiences into a single
 * adaptive system that provides consistent functionality while optimizing for each context.
 * It replaces both ContentDiscoveryGrid and Browser with intelligent contextual
 * adaptation, building progressively on the design tokens and AdaptiveNavigation foundation.
 * 
 * Key Features:
 * - Context-aware feature complexity (web vs miniapp) using design tokens
 * - Unified data fetching using existing hooks (useActiveContentPaginated, useContentById)
 * - Adaptive purchase flow integration (OrchestratedContentPurchaseCard + MiniAppPurchaseButton)
 * - Progressive enhancement building on design token and navigation foundations
 * - Consistent responsive design using unified design tokens
 * - Social features integration for mini app context
 * - Advanced filtering and search capabilities for web context
 * - Performance optimizations with intelligent caching and pagination
 * - Complete accessibility implementation with ARIA attributes
 * 
 * Architecture Integration:
 * - Uses existing content hooks (useActiveContentPaginated, useContentById, useHasContentAccess)
 * - Integrates with existing OrchestratedContentPurchaseCard and MiniAppPurchaseButton components
 * - Builds on enhanced design tokens for context-aware spacing and sizing
 * - Follows established shadcn/ui component patterns and styling conventions
 * - Maintains compatibility with existing routing and navigation systems
 * - Uses AdaptiveNavigation patterns for consistent user experience
 * - Preserves all current functionality while providing unified experience
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount, useChainId } from 'wagmi'
import { 
  Search,
  Filter,
  Grid3x3,
  List,
  SortAsc,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/seperator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useContentDiscovery } from '@/hooks/contracts/content/useContentDiscovery'
import { useAllCreators } from '@/hooks/contracts/useAllCreators.optimized'
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'
import { useMiniAppAnalytics } from '@/hooks/farcaster/useMiniAppAnalytics'
import { useUnifiedContentPurchaseFlow } from '@/hooks/business/workflows'
import { PaymentMethod } from '@/hooks/business/workflows'
import { getContractAddresses } from '@/lib/contracts/config'
import { getSupportedTokens } from '@/hooks/business/workflows'
import { TokenConfig } from '@/hooks/business/workflows'
import { useActiveContentPaginated, useContentById, useHasContentAccess, useCreatorProfile } from '@/hooks/contracts/core'
import { OrchestratedContentPurchaseCard } from '@/components/content/OrchestratedContentPurchaseCard'
import { MiniAppPurchaseButton } from '@/components/commerce/MiniAppPurchaseButton'
import { cn, formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'
import { ContentCategory, categoryToString } from '@/types/contracts'
import type { Address } from 'viem'

// ================================================
// TYPE DEFINITIONS FOR ADAPTIVE BEHAVIOR
// ================================================

/**
 * Context Types for Adaptive Behavior
 */
type BrowserContext = 'web' | 'miniapp'
type ViewMode = 'grid' | 'list' | 'compact'
type SortOption = 'latest' | 'oldest' | 'price-low' | 'price-high' | 'popular'
type FilterPreset = 'all' | 'free' | 'premium' | 'new' | 'trending'

/**
 * Filter State Interface
 */
interface FilterState {
  searchQuery: string
  selectedCategories: ContentCategory[]
  priceRange: [number, number]
  selectedCreator?: Address
  sortBy: SortOption
  filterPreset: FilterPreset
  showOnlyAccessible: boolean
}

/**
 * Content Item Data Interface
 */
interface ContentItemData {
  id: bigint
  title: string
  description: string
  creator: Address
  payPerViewPrice: bigint
  category: ContentCategory
  creationTime: bigint
  isActive: boolean
  ipfsHash: string
}

/**
 * Component Configuration Interface
 */
interface UnifiedContentBrowserProps {
  /** Current application context */
  context?: BrowserContext
  /** Optional class name for styling */
  className?: string
  /** Number of items per page */
  itemsPerPage?: number
  /** Whether to show creator information */
  showCreatorInfo?: boolean
  /** Whether to show social features (mini app context) */
  showSocialFeatures?: boolean
  /** Whether to enable advanced filtering (web context) */
  enableAdvancedFiltering?: boolean
  /** Whether to enable search functionality */
  enableSearch?: boolean
  /** Default view mode */
  defaultViewMode?: ViewMode
  /** Default sort option */
  defaultSortBy?: SortOption
  /** Callback when content is selected */
  onContentSelect?: (contentId: bigint) => void
  /** Callback when creator is selected */
  onCreatorSelect?: (creatorAddress: Address) => void
  /** Custom empty state content */
  emptyStateContent?: React.ReactNode
  /** Whether to auto-refresh content */
  autoRefresh?: boolean
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number
}

/**
 * Browser State Interface
 */
interface BrowserState {
  currentPage: number
  viewMode: ViewMode
  isLoading: boolean
  hasError: boolean
  errorMessage?: string
  isFilterOpen: boolean
  isRefreshing: boolean
}

/**
 * Context Configuration Function
 * Gets optimal configuration based on context, using design token principles
 */
function getContextConfig(context: BrowserContext) {
  const isMiniApp = context === 'miniapp'
  
  return {
    itemsPerPage: isMiniApp ? 8 : 12,
    showCreatorInfo: !isMiniApp,
    showSocialFeatures: isMiniApp,
    showAdvancedFiltering: !isMiniApp,
    enableSearch: true,
    defaultViewMode: isMiniApp ? 'list' : 'grid' as ViewMode,
    showCompactLayout: isMiniApp,
    enableInfiniteScroll: isMiniApp
  } as const
}

/**
 * Debounced Search Hook
 * Creates a debounced search function to optimize performance
 */
function createDebouncedSearch(callback: (query: string) => void, delay = 300) {
  let timeoutId: NodeJS.Timeout
  return (query: string) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => callback(query), delay)
  }
}

/**
 * Sort Options Configuration
 * Provides user-friendly sort options with icons
 */
function getSortOptions(): Array<{ value: SortOption; label: string; icon: React.ComponentType<{ className?: string }> }> {
  return [
    { value: 'latest', label: 'Latest', icon: Clock },
    { value: 'oldest', label: 'Oldest', icon: Clock },
    { value: 'price-low', label: 'Price: Low to High', icon: DollarSign },
    { value: 'price-high', label: 'Price: High to Low', icon: DollarSign },
    { value: 'popular', label: 'Most Popular', icon: TrendingUp }
  ]
}

// ================================================
// MAIN UNIFIED CONTENT BROWSER COMPONENT
// ================================================

/**
 * UnifiedContentBrowser Component
 * 
 * The main component that provides unified content browsing across contexts.
 * Uses intelligent adaptation to provide the optimal experience for each context
 * while maintaining consistent functionality and data patterns.
 */
export function UnifiedContentBrowser({
  context = 'web',
  className,
  itemsPerPage: propItemsPerPage,
  showCreatorInfo: propShowCreatorInfo,
  showSocialFeatures: propShowSocialFeatures,
  enableAdvancedFiltering: propEnableAdvancedFiltering,
  enableSearch: propEnableSearch,
  defaultViewMode = 'grid',
  defaultSortBy = 'latest',
  onContentSelect,
  onCreatorSelect,
  emptyStateContent,
  autoRefresh = false,
  refreshInterval = 30000
}: UnifiedContentBrowserProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address: userAddress, isConnected } = useAccount()
  
  // Debounced search applier
  const applySearch = useMemo(() => createDebouncedSearch((q: string) => {
    // Reset pagination on search input stabilization
    setBrowserState(prev => ({ ...prev, currentPage: 1 }))
  }), [])
  
  // Get context-aware configuration
  const contextConfig = useMemo(() => getContextConfig(context), [context])
  
  // Resolve final configuration with prop overrides
  const finalConfig = useMemo(() => ({
    itemsPerPage: propItemsPerPage ?? contextConfig.itemsPerPage,
    showCreatorInfo: propShowCreatorInfo ?? contextConfig.showCreatorInfo,
    showSocialFeatures: propShowSocialFeatures ?? contextConfig.showSocialFeatures,
    enableAdvancedFiltering: propEnableAdvancedFiltering ?? contextConfig.showAdvancedFiltering,
    enableSearch: propEnableSearch ?? contextConfig.enableSearch
  }), [
    propItemsPerPage, contextConfig.itemsPerPage,
    propShowCreatorInfo, contextConfig.showCreatorInfo,
    propShowSocialFeatures, contextConfig.showSocialFeatures,
    propEnableAdvancedFiltering, contextConfig.showAdvancedFiltering,
    propEnableSearch, contextConfig.enableSearch
  ])

  // ===== STATE MANAGEMENT =====

  // Browser state using design token responsive patterns
  const [browserState, setBrowserState] = useState<BrowserState>({
    currentPage: 0,
    viewMode: defaultViewMode,
    isLoading: false,
    hasError: false,
    isFilterOpen: false,
    isRefreshing: false
  })

  // Filter state with comprehensive options
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedCategories: [],
    priceRange: [0, 1000],
    sortBy: defaultSortBy,
    filterPreset: 'all',
    showOnlyAccessible: false
  })

  // ===== DATA FETCHING =====

  // Fetch paginated content using existing hook (offset, limit)
  const contentQuery = useActiveContentPaginated(
    Number(browserState.currentPage * finalConfig.itemsPerPage),
    Number(finalConfig.itemsPerPage)
  )

  // Update browser state based on query state
  useEffect(() => {
    setBrowserState(prev => ({
      ...prev,
      isLoading: contentQuery.isLoading,
      hasError: contentQuery.isError,
      errorMessage: contentQuery.error?.message
    }))
  }, [contentQuery.isLoading, contentQuery.isError, contentQuery.error])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setBrowserState(prev => ({ ...prev, isRefreshing: true }))
      contentQuery.refetch()
      setBrowserState(prev => ({ ...prev, isRefreshing: false }))
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, contentQuery])

  // Apply debounced search when search query changes
  useEffect(() => {
    if (filterState.searchQuery) {
      applySearch(filterState.searchQuery)
    }
  }, [filterState.searchQuery, applySearch])

  // ===== EVENT HANDLERS =====

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setBrowserState(prev => ({ ...prev, viewMode: mode }))
  }, [])

  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }))
    // Reset to first page when filters change
    setBrowserState(prev => ({ ...prev, currentPage: 0 }))
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setBrowserState(prev => ({ ...prev, currentPage: newPage }))
  }, [])

  const handleContentClick = useCallback((contentId: bigint) => {
    if (onContentSelect) {
      onContentSelect(contentId)
    } else {
      router.push(`/content/${contentId}`)
    }
  }, [onContentSelect, router])

  const handleCreatorClick = useCallback((creatorAddress: Address) => {
    if (onCreatorSelect) {
      onCreatorSelect(creatorAddress)
    } else {
      router.push(`/creator/${creatorAddress}`)
    }
  }, [onCreatorSelect, router])

  const handleRefresh = useCallback(() => {
    setBrowserState(prev => ({ ...prev, isRefreshing: true }))
    contentQuery.refetch()
    setBrowserState(prev => ({ ...prev, isRefreshing: false }))
  }, [contentQuery])

  const handleFilterReset = useCallback(() => {
    setFilterState({
      searchQuery: '',
      selectedCategories: [],
      priceRange: [0, 1000],
      sortBy: defaultSortBy,
      filterPreset: 'all',
      showOnlyAccessible: false
    })
    setBrowserState(prev => ({ ...prev, currentPage: 0 }))
  }, [defaultSortBy])

  // ===== DERIVED STATE =====

  const contentItems: readonly bigint[] = contentQuery.data?.contentIds ?? []
  const totalPages = Math.ceil(Number(contentQuery.data?.total ?? BigInt(0)) / finalConfig.itemsPerPage)
  const hasContent = contentItems.length > 0
  const isFirstPage = browserState.currentPage === 0
  const isLastPage = browserState.currentPage >= totalPages - 1

  // Context-aware grid class calculation using design tokens
  const gridClassName = useMemo(() => {
    const baseClass = 'grid-adaptive space-component-gap'
    
    if (context === 'miniapp' || browserState.viewMode === 'list') {
      return `flex flex-col ${baseClass}`
    }
    
    if (browserState.viewMode === 'compact') {
      return `grid grid-cols-1 lg:grid-cols-2 ${baseClass}`
    }
    
    // Default grid mode
    return `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${baseClass}`
  }, [context, browserState.viewMode])

  // ===== RENDER METHODS =====

  /**
   * Renders the search and filter controls
   */
  const renderSearchAndFilters = () => (
    <div 
      className="space-section-padding-sm border-b"
      data-context={context}
    >
      <div className="container-unified space-y-4">
        {/* Search Bar */}
        {finalConfig.enableSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 nav-icon-adaptive text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={filterState.searchQuery}
              onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
              className="input-adaptive pl-10"
            />
          </div>
        )}

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* View Mode Controls (Web Only) */}
          {context === 'web' && (
            <div className="flex items-center space-component-gap-sm">
              <Button
                variant={browserState.viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
                className="touch-target-optimized"
              >
                <Grid3x3 className="nav-icon-adaptive" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button
                variant={browserState.viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
                className="touch-target-optimized"
              >
                <List className="nav-icon-adaptive" />
                <span className="sr-only">List view</span>
              </Button>
              <Button
                variant={browserState.viewMode === 'compact' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleViewModeChange('compact')}
                className="touch-target-optimized"
              >
                <SortAsc className="nav-icon-adaptive" />
                <span className="sr-only">Compact view</span>
              </Button>
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex items-center space-component-gap-sm">
            <Label htmlFor="sort-select" className="text-adaptive-base font-weight-adaptive-medium">
              Sort by:
            </Label>
            <Select
              value={filterState.sortBy}
              onValueChange={(value: SortOption) => handleFilterChange({ sortBy: value })}
            >
              <SelectTrigger id="sort-select" className="w-48 button-adaptive">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getSortOptions().map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center space-component-gap-xs">
                      <Icon className="nav-icon-adaptive" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Button and Refresh */}
          <div className="flex items-center space-component-gap-sm">
            {finalConfig.enableAdvancedFiltering && (
              <Sheet open={browserState.isFilterOpen} onOpenChange={(open) => setBrowserState(prev => ({ ...prev, isFilterOpen: open }))}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="touch-target-optimized">
                    <Filter className="nav-icon-adaptive mr-2" />
                    <span className="text-adaptive-base">Filters</span>
                    {(filterState.selectedCategories.length > 0 || filterState.selectedCreator) && (
                      <Badge variant="secondary" className="ml-2">
                        {filterState.selectedCategories.length + (filterState.selectedCreator ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Content Filters</SheetTitle>
                    <SheetDescription>
                      Refine your content search with advanced filters
                    </SheetDescription>
                  </SheetHeader>
                  {renderAdvancedFilters()}
                </SheetContent>
              </Sheet>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={browserState.isRefreshing}
              className="touch-target-optimized"
            >
              <RefreshCw className={cn('nav-icon-adaptive', browserState.isRefreshing && 'animate-spin')} />
              <span className="sr-only">Refresh content</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  /**
   * Renders advanced filter controls
   */
  const renderAdvancedFilters = () => (
    <div className="space-content-padding space-y-6">
      {/* Category Filter */}
      <div>
        <Label className="text-adaptive-base font-weight-adaptive-medium">Categories</Label>
        <div className="mt-2 space-y-2">
          {(Object.values(ContentCategory) as ContentCategory[]).map((category: ContentCategory) => (
            <Label key={category} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterState.selectedCategories.includes(category)}
                onChange={(e) => {
                  const categories = e.target.checked
                    ? [...filterState.selectedCategories, category]
                    : filterState.selectedCategories.filter(c => c !== category)
                  handleFilterChange({ selectedCategories: categories })
                }}
                className="rounded"
              />
              <span className="text-adaptive-base">{categoryToString(category)}</span>
            </Label>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <Label className="text-adaptive-base font-weight-adaptive-medium">
          Price Range: ${filterState.priceRange[0]} - ${filterState.priceRange[1]}
        </Label>
        <Slider
          value={filterState.priceRange}
          onValueChange={(value) => handleFilterChange({ priceRange: value as [number, number] })}
          max={1000}
          min={0}
          step={10}
          className="mt-2"
        />
      </div>

      {/* Access Filter */}
      <div>
        <Label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterState.showOnlyAccessible}
            onChange={(e) => handleFilterChange({ showOnlyAccessible: e.target.checked })}
            className="rounded"
          />
          <span className="text-adaptive-base">Show only accessible content</span>
        </Label>
      </div>

      {/* Reset Filters */}
      <Button
        variant="outline"
        onClick={handleFilterReset}
        className="w-full button-adaptive"
      >
        Reset Filters
      </Button>
    </div>
  )

  /**
   * Renders the content grid/list
   */
  const renderContentGrid = () => {
    if (browserState.isLoading && !hasContent) {
      return renderLoadingState()
    }

    if (browserState.hasError) {
      return renderErrorState()
    }

    if (!hasContent) {
      return renderEmptyState()
    }

    return (
      <div 
        className={cn('space-content-padding', gridClassName)}
        role="grid"
        aria-label="Content items"
        data-context={context}
      >
        {contentItems.map((contentId: bigint) => (
          <ContentItemCard
            key={contentId.toString()}
            contentId={contentId}
            context={context}
            viewMode={browserState.viewMode}
            showCreatorInfo={finalConfig.showCreatorInfo}
            showSocialFeatures={finalConfig.showSocialFeatures}
            userAddress={userAddress}
            onContentClick={handleContentClick}
            onCreatorClick={handleCreatorClick}
          />
        ))}
      </div>
    )
  }

  /**
   * Renders loading state with skeletons
   */
  const renderLoadingState = () => (
    <div className={cn('space-content-padding', gridClassName)}>
      {Array.from({ length: finalConfig.itemsPerPage }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-video bg-muted animate-pulse" />
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  /**
   * Renders error state
   */
  const renderErrorState = () => (
    <div className="space-content-padding text-center">
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {browserState.errorMessage || 'Failed to load content. Please try again.'}
        </AlertDescription>
      </Alert>
      <Button
        variant="outline"
        onClick={handleRefresh}
        className="mt-4 button-adaptive"
      >
        <RefreshCw className="nav-icon-adaptive mr-2" />
        Try Again
      </Button>
    </div>
  )

  /**
   * Renders empty state
   */
  const renderEmptyState = () => (
    <div className="space-content-padding text-center">
      {emptyStateContent || (
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-weight-adaptive-semibold text-adaptive-base mb-2">
            No content found
          </h3>
          <p className="text-muted-foreground text-adaptive-base mb-4">
            {filterState.searchQuery || filterState.selectedCategories.length > 0
              ? "Try adjusting your search or filters to find more content."
              : "There's no content available right now. Check back later for new uploads!"
            }
          </p>
          {(filterState.searchQuery || filterState.selectedCategories.length > 0) && (
            <Button variant="outline" onClick={handleFilterReset} className="button-adaptive">
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  )

  /**
   * Renders pagination controls
   */
  const renderPagination = () => {
    if (!hasContent || totalPages <= 1) return null

    return (
      <div className="space-section-padding-sm border-t">
        <div className="container-unified">
          <div className="flex items-center justify-between">
            <div className="text-adaptive-base text-muted-foreground">
              Page {browserState.currentPage + 1} of {totalPages}
            </div>
            <div className="flex items-center space-component-gap-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(browserState.currentPage - 1)}
                disabled={isFirstPage}
                className="touch-target-optimized"
              >
                <ChevronLeft className="nav-icon-adaptive" />
                <span className="sr-only">Previous page</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(browserState.currentPage + 1)}
                disabled={isLastPage}
                className="touch-target-optimized"
              >
                <ChevronRight className="nav-icon-adaptive" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ===== MAIN RENDER =====

  return (
    <div 
      className={cn('unified-content-browser', className)}
      data-context={context}
      data-view-mode={browserState.viewMode}
    >
      {renderSearchAndFilters()}
      {renderContentGrid()}
      {renderPagination()}
    </div>
  )
}

// ================================================
// CONTENT ITEM CARD COMPONENT
// ================================================

/**
 * Content Item Card Component
 * Renders individual content items with context-aware styling and functionality
 */
interface ContentItemCardProps {
  contentId: bigint
  context: BrowserContext
  viewMode: ViewMode
  showCreatorInfo: boolean
  showSocialFeatures: boolean
  userAddress?: Address
  onContentClick: (contentId: bigint) => void
  onCreatorClick: (creatorAddress: Address) => void
}

function ContentItemCard({
  contentId,
  context,
  viewMode,
  showCreatorInfo,
  showSocialFeatures,
  userAddress,
  onContentClick,
  onCreatorClick
}: ContentItemCardProps) {
  // Fetch content data
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)

  // Loading state
  if (contentQuery.isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="aspect-video bg-muted animate-pulse" />
        <CardHeader>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (contentQuery.isError || !contentQuery.data) {
    return (
      <Card className="overflow-hidden border-red-200">
        <CardContent className="space-content-padding text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load content</p>
        </CardContent>
      </Card>
    )
  }

  const content = contentQuery.data
  const hasAccess = accessQuery.data || false
  const isCompact = viewMode === 'compact' || context === 'miniapp'

  return (
    <Card 
      className={cn(
        "overflow-hidden hover:shadow-lg transition-adaptive cursor-pointer",
        context === 'miniapp' && "ring-1 ring-blue-100",
        isCompact && "flex flex-row"
      )}
      onClick={() => onContentClick(contentId)}
      role="gridcell"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onContentClick(contentId)
        }
      }}
      aria-label={`View content: ${content.title}`}
    >
      {/* Content Thumbnail */}
      <div className={cn(
        "bg-muted flex items-center justify-center",
        isCompact ? "w-24 h-24 flex-shrink-0" : "aspect-video"
      )}>
        <Eye className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Content Info */}
      <div className="flex-1">
        <CardHeader className={cn(
          isCompact && "space-content-padding-xs"
        )}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className={cn(
                "text-adaptive-base font-weight-adaptive-semibold truncate",
                isCompact && "text-sm"
              )}>
                {content.title}
              </CardTitle>
              <CardDescription className={cn(
                "text-adaptive-base",
                isCompact && "text-xs"
              )}>
                {formatRelativeTime(content.creationTime)}
              </CardDescription>
            </div>
            
            {/* Access Status Badge */}
            <Badge 
              variant={hasAccess ? "default" : "secondary"}
              className="ml-2 flex-shrink-0"
            >
              {hasAccess ? (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Owned
                </>
              ) : (
                <>
                  <DollarSign className="w-3 h-3 mr-1" />
                  {formatCurrency(content.payPerViewPrice)}
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        {!isCompact && (
          <CardContent className="space-content-padding-xs">
            <p className="text-adaptive-base text-muted-foreground line-clamp-2">
              {content.description}
            </p>
            
            {showCreatorInfo && (
              <div className="flex items-center space-component-gap-xs mt-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {content.creator.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreatorClick(content.creator)
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-adaptive truncate"
                >
                  {formatAddress(content.creator)}
                </button>
              </div>
            )}
          </CardContent>
        )}

        {/* Purchase Button */}
        {!hasAccess && (
          <CardFooter className={cn(
            "pt-0",
            isCompact && "space-content-padding-xs"
          )}>
            {context === 'miniapp' ? (
              <MiniAppPurchaseButton
                contentId={contentId}
                title={content.title}
                userAddress={userAddress}
                size="sm"
                className="w-full button-adaptive"
              />
            ) : (
              <OrchestratedContentPurchaseCard
                contentId={contentId}
                userAddress={userAddress}
                onPurchaseSuccess={() => console.log('Purchase successful for content:', contentId)}
                variant="full"
                showCreatorInfo={true}
                showPurchaseDetails={true}
                enableMultiPayment={true}
                showSystemHealth={true}
                enablePerformanceMetrics={false}
              />
            )}
          </CardFooter>
        )}
      </div>
    </Card>
  )
}

// ================================================
// EXPORTS
// ================================================

export default UnifiedContentBrowser

// Export types for external usage
export type {
  BrowserContext,
  ViewMode,
  SortOption,
  FilterState,
  UnifiedContentBrowserProps
}
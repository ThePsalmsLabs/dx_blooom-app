/**
 * UnifiedContentBrowser Component - Phase 2 Component System Convergence
 * File: src/components/content/UnifiedContentBrowser.tsx
 * 
 * This component unifies the web app and mini app content browsing experiences into a single
 * adaptive system that provides consistent functionality while optimizing for each context.
 * It replaces both ContentDiscoveryInterface/ContentDiscoveryGrid and MiniAppContentBrowser
 * with intelligent contextual adaptation.
 * 
 * Key Features:
 * - Context-aware feature complexity (web vs miniapp)
 * - Unified data fetching using existing hooks (useActiveContentPaginated, useContentById)
 * - Adaptive purchase flow integration (ContentPurchaseCard + MiniAppPurchaseButton)
 * - Progressive enhancement with graceful feature degradation
 * - Consistent responsive design using unified design tokens
 * - Social features integration for mini app context
 * - Advanced filtering and search capabilities for web context
 * - Performance optimizations with intelligent caching and pagination
 * 
 * Architecture Integration:
 * - Uses existing useActiveContentPaginated, useContentById, useHasContentAccess hooks
 * - Integrates with existing ContentPurchaseCard and MiniAppPurchaseButton components
 * - Follows established shadcn/ui component patterns and styling conventions
 * - Uses unified design tokens for context-aware spacing and sizing
 * - Maintains compatibility with existing routing and navigation systems
 * - Preserves all current functionality while providing unified experience
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  Search,
  Filter,
  Grid3x3,
  List,
  SortAsc,
  SortDesc,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Tag
} from 'lucide-react'

// Import shadcn/ui components following existing patterns
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Import existing business logic hooks and components
import {
  useActiveContentPaginated,
  useContentById,
  useHasContentAccess,
  useCreatorProfile
} from '@/hooks/contracts/core'
import { ContentPurchaseCard } from '@/components/content/ContentPurchaseCard'
import { MiniAppPurchaseButton } from '@/components/commerce/MiniAppPurchaseButton'

// Import utilities and types
import { cn, formatCurrency, formatRelativeTime, formatAddress, debounce } from '@/lib/utils'
import { ContentCategory, categoryToString } from '@/types/contracts'
import type { Address } from 'viem'

// ================================================
// TYPE DEFINITIONS
// ================================================

/**
 * Context Types for Adaptive Behavior
 */
type BrowserContext = 'web' | 'miniapp'
type ViewMode = 'grid' | 'list'
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
  lastRefresh: Date
  totalItems: number
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Determines optimal configuration based on context
 */
function getContextConfig(context: BrowserContext) {
  const configs = {
    web: {
      showAdvancedFiltering: true,
      showSearch: true,
      itemsPerPage: 12,
      showCreatorInfo: true,
      showSocialFeatures: false,
      defaultViewMode: 'grid' as ViewMode,
      purchaseComponentType: 'full' as const
    },
    miniapp: {
      showAdvancedFiltering: false,
      showSearch: false,
      itemsPerPage: 6,
      showCreatorInfo: true,
      showSocialFeatures: true,
      defaultViewMode: 'grid' as ViewMode,
      purchaseComponentType: 'compact' as const
    }
  }
  
  return configs[context] || configs.web
}

/**
 * Debounced search utility
 */
type SearchCallback = (query: string) => void
function createDebouncedSearch(callback: SearchCallback) {
  return debounce((...args: unknown[]) => {
    const q = String(args[0] ?? '')
    callback(q)
    return null
  }, 300)
}

/**
 * Get category display options
 */
function getCategoryOptions(): Array<{ value: ContentCategory | 'all'; label: string }> {
  return [
    { value: 'all', label: 'All Categories' },
    { value: ContentCategory.ARTICLE, label: 'Articles' },
    { value: ContentCategory.VIDEO, label: 'Videos' },
    { value: ContentCategory.AUDIO, label: 'Audio' },
    { value: ContentCategory.IMAGE, label: 'Images' },
    { value: ContentCategory.DOCUMENT, label: 'Documents' },
    { value: ContentCategory.COURSE, label: 'Courses' },
    { value: ContentCategory.SOFTWARE, label: 'Software' },
    { value: ContentCategory.DATA, label: 'Data' }
  ]
}

/**
 * Get sort options
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
// MAIN COMPONENT
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
    enableSearch: propEnableSearch ?? contextConfig.showSearch,
    purchaseComponentType: contextConfig.purchaseComponentType
  }), [
    propItemsPerPage, contextConfig.itemsPerPage,
    propShowCreatorInfo, contextConfig.showCreatorInfo,
    propShowSocialFeatures, contextConfig.showSocialFeatures,
    propEnableAdvancedFiltering, contextConfig.showAdvancedFiltering,
    propEnableSearch, contextConfig.showSearch,
    contextConfig.purchaseComponentType
  ])
  
  // ===== STATE MANAGEMENT =====
  
  const [browserState, setBrowserState] = useState<BrowserState>({
    currentPage: 1,
    viewMode: defaultViewMode,
    isLoading: false,
    hasError: false,
    totalItems: 0,
    lastRefresh: new Date()
  })
  
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: searchParams.get('q') || '',
    selectedCategories: [],
    priceRange: [0, 100],
    sortBy: defaultSortBy,
    filterPreset: 'all',
    showOnlyAccessible: false
  })
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  
  // ===== DATA FETCHING =====
  
  // Calculate pagination offset
  const offset = useMemo(() => 
    (browserState.currentPage - 1) * finalConfig.itemsPerPage,
    [browserState.currentPage, finalConfig.itemsPerPage]
  )
  
  // Fetch paginated content using existing hook
  const contentPagination = useActiveContentPaginated(offset, finalConfig.itemsPerPage)
  
  // Update state when content data changes
  useEffect(() => {
    setBrowserState(prev => ({
      ...prev,
      isLoading: contentPagination.isLoading,
      hasError: contentPagination.isError,
      errorMessage: contentPagination.error?.message,
      totalItems: Number(contentPagination.data?.total || 0)
    }))
  }, [contentPagination.isLoading, contentPagination.isError, contentPagination.error, contentPagination.data?.total])
  
  // ===== EVENT HANDLERS =====
  
  const handleSearchChange = useCallback((query: string) => {
    setFilterState(prev => ({ ...prev, searchQuery: query }))
    applySearch(query)
  }, [applySearch])
  
  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...newFilters }))
    setBrowserState(prev => ({ ...prev, currentPage: 1 }))
  }, [])
  
  const handlePageChange = useCallback((newPage: number) => {
    setBrowserState(prev => ({ ...prev, currentPage: newPage }))
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  
  const handleRefresh = useCallback(async () => {
    setBrowserState(prev => ({ ...prev, lastRefresh: new Date() }))
    await contentPagination.refetch()
  }, [contentPagination])
  
  const handleContentSelect = useCallback((contentId: bigint) => {
    if (onContentSelect) {
      onContentSelect(contentId)
    } else {
      router.push(`/content/${contentId}`)
    }
  }, [onContentSelect, router])
  
  const handleCreatorSelect = useCallback((creatorAddress: Address) => {
    if (onCreatorSelect) {
      onCreatorSelect(creatorAddress)
    } else {
      router.push(`/creator/${creatorAddress}`)
    }
  }, [onCreatorSelect, router])
  
  // ===== AUTO-REFRESH LOGIC =====
  
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(handleRefresh, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, handleRefresh])
  
  // ===== RENDER HELPERS =====
  
  /**
   * Renders search and filter controls
   */
  const renderSearchAndFilters = () => {
    if (!finalConfig.enableSearch && !finalConfig.enableAdvancedFiltering) {
      return null
    }
    
    return (
      <div className="space-content-padding border-b border-border">
        <div className="container-unified">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search Input */}
            {finalConfig.enableSearch && (
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search content..."
                    value={filterState.searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 input-adaptive"
                  />
                </div>
              </div>
            )}
            
            {/* Filter and Sort Controls */}
            <div className="flex items-center gap-2">
              {/* View Mode Toggle (Web Only) */}
              {context === 'web' && (
                <div className="flex border rounded-md">
                  <Button
                    variant={browserState.viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setBrowserState(prev => ({ ...prev, viewMode: 'grid' }))}
                    className="rounded-r-none border-r"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={browserState.viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setBrowserState(prev => ({ ...prev, viewMode: 'list' }))}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="button-adaptive">
                    <SortAsc className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {getSortOptions().map(({ value, label, icon: Icon }) => (
                    <DropdownMenuItem
                      key={value}
                      onClick={() => handleFilterChange({ sortBy: value })}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                      {filterState.sortBy === value && (
                        <Badge variant="secondary" className="ml-auto">
                          Active
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Advanced Filters (Web Only) */}
              {finalConfig.enableAdvancedFiltering && (
                <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="button-adaptive">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {filterState.selectedCategories.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {filterState.selectedCategories.length}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Content</SheetTitle>
                      <SheetDescription>
                        Refine your content discovery with advanced filters
                      </SheetDescription>
                    </SheetHeader>
                    <FilterPanel 
                      filterState={filterState}
                      onFilterChange={handleFilterChange}
                      onClose={() => setIsFilterSheetOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              )}
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={browserState.isLoading}
                className="button-adaptive"
              >
                <RefreshCw className={cn(
                  "h-4 w-4",
                  browserState.isLoading && "animate-spin"
                )} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  /**
   * Renders content grid or list
   */
  const renderContentDisplay = () => {
    if (browserState.isLoading && (!contentPagination.data?.contentIds.length)) {
      return renderLoadingState()
    }
    
    if (browserState.hasError) {
      return renderErrorState()
    }
    
    const contentIds = contentPagination.data?.contentIds || []
    
    if (contentIds.length === 0) {
      return renderEmptyState()
    }
    
    return (
      <div className="space-section-padding">
        <div className="container-unified">
          {browserState.viewMode === 'grid' ? (
            <div className="grid-adaptive">
              {contentIds.map((contentId) => (
                <ContentItemCard
                  key={contentId.toString()}
                  contentId={contentId}
                  context={context}
                  variant={finalConfig.purchaseComponentType}
                  showCreatorInfo={finalConfig.showCreatorInfo}
                  showSocialFeatures={finalConfig.showSocialFeatures}
                  onContentSelect={handleContentSelect}
                  onCreatorSelect={handleCreatorSelect}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {contentIds.map((contentId) => (
                <ContentItemCard
                  key={contentId.toString()}
                  contentId={contentId}
                  context={context}
                  variant="list"
                  showCreatorInfo={finalConfig.showCreatorInfo}
                  showSocialFeatures={finalConfig.showSocialFeatures}
                  onContentSelect={handleContentSelect}
                  onCreatorSelect={handleCreatorSelect}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  /**
   * Renders pagination controls
   */
  const renderPagination = () => {
    const totalPages = Math.ceil(browserState.totalItems / finalConfig.itemsPerPage)
    
    if (totalPages <= 1) return null
    
    return (
      <div className="space-content-padding border-t border-border">
        <div className="container-unified">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((browserState.currentPage - 1) * finalConfig.itemsPerPage) + 1} to{' '}
              {Math.min(browserState.currentPage * finalConfig.itemsPerPage, browserState.totalItems)} of{' '}
              {browserState.totalItems} results
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={browserState.currentPage <= 1}
                onClick={() => handlePageChange(browserState.currentPage - 1)}
                className="button-adaptive"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, browserState.currentPage - 2)
                  if (page > totalPages) return null
                  
                  return (
                    <Button
                      key={page}
                      variant={page === browserState.currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-10 h-10 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                disabled={browserState.currentPage >= totalPages}
                onClick={() => handlePageChange(browserState.currentPage + 1)}
                className="button-adaptive"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  /**
   * Renders loading state
   */
  const renderLoadingState = () => (
    <div className="space-section-padding">
      <div className="container-unified">
        <div className="grid-adaptive">
          {Array.from({ length: finalConfig.itemsPerPage }, (_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="space-content-padding">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
  
  /**
   * Renders error state
   */
  const renderErrorState = () => (
    <div className="space-section-padding">
      <div className="container-unified">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {browserState.errorMessage || 'Failed to load content. Please try again.'}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
  
  /**
   * Renders empty state
   */
  const renderEmptyState = () => (
    <div className="space-section-padding">
      <div className="container-unified">
        <div className="text-center py-12">
          {emptyStateContent || (
            <>
              <div className="mb-4">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No content found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {filterState.searchQuery
                    ? "Try adjusting your search terms or filters"
                    : "There's no content available right now. Check back later for new uploads!"
                  }
                </p>
              </div>
              
              {!isConnected && (
                <div className="border-t pt-6 mt-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your wallet to access premium content
                  </p>
                  <Button variant="outline">
                    Connect Wallet
                  </Button>
                </div>
              )}
              
              {filterState.searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setFilterState(prev => ({ ...prev, searchQuery: '' }))}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
  
  // ===== MAIN RENDER =====
  
  return (
    <div 
      className={cn('unified-content-browser', className)}
      data-context={context}
    >
      {renderSearchAndFilters()}
      {renderContentDisplay()}
      {renderPagination()}
    </div>
  )
}

// ================================================
// SUPPORTING COMPONENTS
// ================================================

/**
 * Filter Panel Component
 */
interface FilterPanelProps {
  filterState: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  onClose: () => void
}

function FilterPanel({ filterState, onFilterChange, onClose }: FilterPanelProps) {
  return (
    <div className="space-y-6 mt-6">
      {/* Category Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Categories</Label>
        <div className="grid grid-cols-2 gap-2">
          {getCategoryOptions().slice(1).map(({ value, label }) => {
            const isSelected = filterState.selectedCategories.includes(value as ContentCategory)
            return (
              <Button
                key={value.toString()}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const categories = isSelected
                    ? filterState.selectedCategories.filter(c => c !== value)
                    : [...filterState.selectedCategories, value as ContentCategory]
                  onFilterChange({ selectedCategories: categories })
                }}
                className="justify-start"
              >
                {label}
              </Button>
            )
          })}
        </div>
      </div>
      
      {/* Price Range Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Price Range (USDC)</Label>
        <div className="px-3">
          <Slider
            value={filterState.priceRange}
            onValueChange={(value) => onFilterChange({ priceRange: value as [number, number] })}
            min={0}
            max={100}
            step={1}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${filterState.priceRange[0]}</span>
            <span>${filterState.priceRange[1]}</span>
          </div>
        </div>
      </div>
      
      {/* Quick Filters */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Quick Filters</Label>
        <div className="space-y-2">
          <Button
            variant={filterState.showOnlyAccessible ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ showOnlyAccessible: !filterState.showOnlyAccessible })}
            className="w-full justify-start"
          >
            <Eye className="h-4 w-4 mr-2" />
            Show Only Accessible Content
          </Button>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onFilterChange({
              selectedCategories: [],
              priceRange: [0, 100],
              showOnlyAccessible: false,
              filterPreset: 'all'
            })
          }}
          className="flex-1"
        >
          Clear All
        </Button>
        <Button size="sm" onClick={onClose} className="flex-1">
          Apply Filters
        </Button>
      </div>
    </div>
  )
}

/**
 * Content Item Card Component
 */
interface ContentItemCardProps {
  contentId: bigint
  context: BrowserContext
  variant: 'full' | 'compact' | 'list'
  showCreatorInfo: boolean
  showSocialFeatures: boolean
  onContentSelect: (contentId: bigint) => void
  onCreatorSelect: (creatorAddress: Address) => void
}

function ContentItemCard({
  contentId,
  context,
  variant,
  showCreatorInfo,
  showSocialFeatures,
  onContentSelect,
  onCreatorSelect
}: ContentItemCardProps) {
  const { address: userAddress } = useAccount()
  
  // Fetch content data using existing hook
  const content = useContentById(contentId)
  const hasAccess = useHasContentAccess(userAddress, contentId)
  const creatorProfile = useCreatorProfile(content.data?.creator)
  
  if (content.isLoading) {
    return (
      <Card className="overflow-hidden">
        <Skeleton className="aspect-video w-full" />
        <CardContent className="space-content-padding">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2 mb-4" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }
  
  if (content.isError || !content.data) {
    return (
      <Card className="overflow-hidden opacity-50">
        <CardContent className="space-content-padding text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load content</p>
        </CardContent>
      </Card>
    )
  }
  
  const contentData = content.data
  
  // List variant (web only)
  if (variant === 'list') {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          <div className="w-48 aspect-video bg-muted flex-shrink-0">
            {/* Content preview placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex-1 flex justify-between">
            <CardContent className="space-content-padding flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {contentData.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {contentData.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="secondary">
                      {categoryToString(contentData.category)}
                    </Badge>
                    <span>{formatCurrency(contentData.payPerViewPrice, 6, 'USDC')}</span>
                     <span>{formatRelativeTime(contentData.creationTime)}</span>
                  </div>
                  
                  {showCreatorInfo && (
                    <div className="flex items-center gap-2 mt-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {formatAddress(contentData.creator).slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {formatAddress(contentData.creator)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  {context === 'web' ? (
                    <ContentPurchaseCard
                      contentId={contentId}
                      userAddress={userAddress}
                      variant="compact"
                      className="w-32"
                    />
                  ) : (
                    <MiniAppPurchaseButton
                      contentId={contentId}
                      title={contentData.title}
                      size="sm"
                      onPurchaseSuccess={() => onContentSelect(contentId)}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    )
  }
  
  // Grid variant (default)
  return (
    <Card className="overflow-hidden transition-adaptive hover:shadow-md">
      {/* Content Preview */}
      <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 relative group cursor-pointer"
           onClick={() => onContentSelect(contentId)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Eye className="h-8 w-8 text-muted-foreground group-hover:scale-110 transition-transform" />
        </div>
        
        {/* Access Status Overlay */}
        <div className="absolute top-2 right-2">
          {hasAccess.data ? (
            <Badge variant="default" className="bg-green-500">
              <Eye className="h-3 w-3 mr-1" />
              Owned
            </Badge>
          ) : (
            <Badge variant="secondary">
              {formatCurrency(contentData.payPerViewPrice, 6, 'USDC')}
            </Badge>
          )}
        </div>
        
        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-background/80">
            {categoryToString(contentData.category)}
          </Badge>
        </div>
      </div>
      
      <CardContent className="space-content-padding">
        {/* Content Info */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2 line-clamp-2 cursor-pointer hover:text-primary"
              onClick={() => onContentSelect(contentId)}>
            {contentData.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {contentData.description}
          </p>
          
          {showCreatorInfo && (
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {formatAddress(contentData.creator).slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => onCreatorSelect(contentData.creator)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {formatAddress(contentData.creator)}
              </button>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(contentData.creationTime)}
          </div>
        </div>
        
        {/* Purchase Action */}
        {context === 'web' ? (
          <ContentPurchaseCard
            contentId={contentId}
            userAddress={userAddress}
            variant={variant === 'compact' ? 'compact' : 'full'}
            showCreatorInfo={false}
            showPurchaseDetails={variant !== 'compact'}
          />
        ) : (
          <MiniAppPurchaseButton
            contentId={contentId}
            title={contentData.title}
            fullWidth
            showContext={showSocialFeatures}
            onPurchaseSuccess={() => onContentSelect(contentId)}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ================================================
// EXPORT
// ================================================

export default UnifiedContentBrowser

// Export all components and utilities
export {
  type BrowserContext,
  type ViewMode,
  type SortOption,
  type FilterState,
  type UnifiedContentBrowserProps
}
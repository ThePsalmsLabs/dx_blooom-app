/**
 * Content Discovery Page - Component 10.2: Production Content Browsing Experience
 * File: src/app/browse/page.tsx
 * 
 * This page demonstrates the culmination of content discovery architecture by orchestrating
 * all content-related components into a seamless browsing and purchasing experience.
 * 
 * Integration Showcase:
 * - ContentDiscoveryGrid provides sophisticated filtering and view options
 * - ContentPurchaseCard handles complete multi-token purchase workflows
 * - useActiveContentPaginated manages efficient content loading
 * - useContentPurchaseFlow orchestrates multi-payment transaction logic
 * - SubgraphQueryService enables advanced search capabilities
 * - AppLayout provides consistent navigation and responsive design
 * 
 * Enhanced Multi-Token Purchase Flow:
 * - Users can purchase content with USDC, ETH, or any supported ERC-20 token
 * - Automatic payment method recommendations based on user balances
 * - Graceful fallback to USDC-only mode when advanced features are unavailable
 * - Real-time balance checking and approval handling
 * 
 * This page validates that complex content discovery can feel intuitive and performant
 * while maintaining the transparency and control that Web3 users expect.
 */

'use client'

import React, { useState, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import {
  Search,
  Grid3x3,
  List,
  SlidersHorizontal,
  AlertCircle,
  X,
  Users,
  CheckCircle,
  FileText,
  Video as VideoIcon,
  Music,
  Image as ImageIcon,
  Folder
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Alert,
  AlertDescription,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton
} from '@/components/ui/index'

// Import our architectural layers - demonstrating clean separation
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { ContentPurchaseCard } from '@/components/content/ContentPurchaseCard'

// Import utility functions and types that ensure type safety
import type { ContentCategory } from '@/types/contracts'
import { isValidContentCategory } from '@/types/contracts'

// Import business logic hooks
// import { useActiveContentPaginated } from '@/hooks/contracts/core' // replaced with discovery hook
import { useContentDiscovery } from '@/hooks/contracts/content/useContentDiscovery'
import type { ContentSortBy as DiscoverySortBy, ContentCategory as DiscoveryCategory } from '@/hooks/contracts/content/useContentDiscovery'

/**
 * Content Filter Interface
 * 
 * This interface defines all the ways users can filter and sort content
 * to find exactly what they're looking for.
 */
interface ContentFilters {
  readonly search: string
  readonly category: ContentCategory | 'all'
  readonly priceRange: readonly [number, number]
  readonly accessType: 'all' | 'free' | 'premium' | 'subscription'
  readonly sortBy: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular'
  readonly tags: readonly string[]
}

/**
 * View Mode Options
 * 
 * Different ways to display the content grid for different user preferences.
 */
type ViewMode = 'grid' | 'list' | 'compact'

/**
 * URL Parameters Interface
 * 
 * This maps URL search parameters to our internal filter state,
 * enabling shareable links and browser back/forward navigation.
 */
interface BrowsePageParams {
  readonly category?: ContentCategory
  readonly search?: string
  readonly view?: ViewMode
  readonly sort?: ContentFilters['sortBy']
  readonly access?: ContentFilters['accessType']
  readonly minPrice?: string
  readonly maxPrice?: string
  readonly tags?: string
}

/**
 * Content Interaction State
 * 
 * Manages modal states and user interactions within the browse experience.
 */
interface ContentInteractionState {
  readonly selectedContentId: bigint | null
  readonly showPurchaseModal: boolean
  readonly showFiltersModal: boolean
  readonly showContentPreview: boolean
  readonly lastPurchaseSuccess: boolean
}

/**
 * Default Filter Configuration
 * 
 * Sensible defaults that provide a good starting experience for new users.
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
 * Search Parameters Interface
 * 
 * This interface defines how URL search parameters map to content discovery state,
 * enabling direct linking to filtered content views and maintaining state across navigation.
 */
interface ContentDiscoveryParams {
  readonly category?: ContentCategory
  readonly search?: string
  readonly view?: 'grid' | 'list' | 'compact'
  readonly sort?: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular'
  readonly access?: 'all' | 'free' | 'premium' | 'subscription'
  readonly minPrice?: string
  readonly maxPrice?: string
}

/**
 * Complete Browse Page Implementation
 * 
 * This component orchestrates the entire content discovery and purchase experience,
 * demonstrating how all our architectural layers work together seamlessly.
 */
function BrowsePageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address: userAddress, isConnected } = useAccount()

  // Parse URL parameters into typed state for seamless navigation
  const urlParams: BrowsePageParams = useMemo(() => {
    const categoryParam = searchParams.get('category')
    const category = categoryParam ? parseInt(categoryParam, 10) : undefined
    
    return {
      category: category !== undefined && isValidContentCategory(category) ? category : undefined,
      search: searchParams.get('search') || undefined,
      view: (searchParams.get('view') as ViewMode) || 'grid',
      sort: (searchParams.get('sort') as ContentFilters['sortBy']) || 'newest',
      access: (searchParams.get('access') as ContentFilters['accessType']) || 'all',
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      tags: searchParams.get('tags') || undefined
    }
  }, [searchParams])

  // Content filters state with URL parameter integration
  const [filters, setFilters] = useState<ContentFilters>({
    ...DEFAULT_FILTERS,
    search: urlParams.search || '',
    category: urlParams.category || 'all',
    sortBy: urlParams.sort || 'newest',
    accessType: urlParams.access || 'all',
    priceRange: [
      urlParams.minPrice ? parseFloat(urlParams.minPrice) : 0,
      urlParams.maxPrice ? parseFloat(urlParams.maxPrice) : 100
    ],
    tags: urlParams.tags ? urlParams.tags.split(',').filter(Boolean) : []
  })

  // View mode and interaction state
  const [viewMode, setViewMode] = useState<ViewMode>(urlParams.view || 'grid')
  const [currentPage, setCurrentPage] = useState(0)
  const [interactionState, setInteractionState] = useState<ContentInteractionState>({
    selectedContentId: null,
    showPurchaseModal: false,
    showFiltersModal: false,
    showContentPreview: false,
    lastPurchaseSuccess: false
  })

  // Items per page
  const itemsPerPage = 12

  // Map Browse sort to discovery sort
  const toDiscoverySort = (s: ContentFilters['sortBy']): DiscoverySortBy => {
    switch (s) {
      case 'newest': return 'latest'
      case 'oldest': return 'oldest'
      case 'price_low': return 'price_low'
      case 'price_high': return 'price_high'
      case 'popular': return 'popularity'
      default: return 'latest'
    }
  }

  // Real discovery query with category + tag filters
  const discovery = useContentDiscovery({
    categories: filters.category === 'all' ? [] : [filters.category as unknown as DiscoveryCategory],
    tags: filters.tags,
    discoveryParams: {
      page: currentPage + 1,
      limit: itemsPerPage,
      sortBy: toDiscoverySort(filters.sortBy),
      searchQuery: filters.search || undefined,
    },
    mergeStrategy: 'union'
  })

  /**
   * Filter Management Functions
   * 
   * These functions handle user interactions with the filtering interface,
   * providing immediate feedback and maintaining URL synchronization.
   */
  
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    setCurrentPage(0)
    
    // Update URL to maintain shareable state
    const newParams = new URLSearchParams(searchParams.toString())
    if (value) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    router.replace(`/browse?${newParams.toString()}`)
  }, [searchParams, router])

  const handleFilterChange = useCallback((newFilters: Partial<ContentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(0)
    
    // Update URL parameters for all filter changes
    const newParams = new URLSearchParams(searchParams.toString())
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'all') {
        if (key === 'priceRange' && Array.isArray(value)) {
          if (value[0] > 0) newParams.set('minPrice', value[0].toString())
          if (value[1] < 100) newParams.set('maxPrice', value[1].toString())
        } else {
          newParams.set(key, value.toString())
        }
      } else {
        newParams.delete(key)
        if (key === 'priceRange') {
          newParams.delete('minPrice')
          newParams.delete('maxPrice')
        }
      }
    })
    
    router.replace(`/browse?${newParams.toString()}`)
  }, [searchParams, router])

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setCurrentPage(0)
    router.replace('/browse')
  }, [router])

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('view', mode)
    router.replace(`/browse?${newParams.toString()}`)
  }, [searchParams, router])

  // TagChip component within file for UX
  function TagChips({
    selectedCategory,
    selectedTags,
    onToggle
  }: {
    selectedCategory: ContentFilters['category']
    selectedTags: readonly string[]
    onToggle: (tag: string) => void
  }) {
    // Basic suggestion set; in production, fetch from subgraph by category
    const suggestions: Record<string, string[]> = {
      all: ['popular', 'new', 'free', 'premium', 'short', 'long'],
      '0': ['writing', 'guide', 'tech', 'opinion'],
      '1': ['tutorial', 'review', 'shorts', 'stream'],
      '2': ['podcast', 'music', 'interview'],
      '3': ['art', 'photo', 'design'],
      '4': ['doc', 'pdf'],
      '5': ['course', 'lesson'],
      '6': ['misc']
    }
    const key = selectedCategory === 'all' ? 'all' : String(selectedCategory)
    const tags = suggestions[key] || suggestions.all

    return (
      <div className="-mx-4 px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {tags.map(tag => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => onToggle(tag)}
                className={`px-3 py-1 rounded-full text-xs md:text-sm whitespace-nowrap border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border hover:bg-muted'}`}
              >
                #{tag}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /**
   * Content Interaction Handlers
   * 
   * These functions manage user interactions with individual content items,
   * including purchase flows and content viewing.
   */
  
  const handleContentSelect = useCallback((contentId: bigint) => {
    setInteractionState(prev => ({
      ...prev,
      selectedContentId: contentId,
      showPurchaseModal: true
    }))
  }, [])

  const handlePurchaseSuccess = useCallback((contentId: bigint) => {
    setInteractionState(prev => ({
      ...prev,
      lastPurchaseSuccess: true,
      showPurchaseModal: false
    }))
    
    // Refetch content data to update access status
    discovery.refetch()
    
    // Show success feedback
    setTimeout(() => {
      setInteractionState(prev => ({ ...prev, lastPurchaseSuccess: false }))
    }, 3000)
  }, [discovery])

  const handleViewContent = useCallback((contentId: bigint) => {
    router.push(`/content/${contentId}`)
  }, [router])

  /**
   * Computed State Values
   * 
   * These derived values help the UI provide appropriate feedback and state management.
   */
  
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

  // derived state now from discovery hook

  return (
    <AppLayout>
      <RouteGuards requiredLevel="public">
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Discover Premium Content
              </h1>
              <p className="text-muted-foreground">
                Explore and purchase high-quality content from verified creators using USDC, ETH, WETH, cbETH, DAI, or other supported tokens.
              </p>
            </div>

            {/* Search and Controls Header */}
            <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6 mb-6">
              <div className="flex flex-col gap-3">
                {/* Search Input */}
                <div className="flex-1 max-w-full sm:max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search content, creators, or topics..."
                      value={filters.search}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Results and Controls */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  {/* Results Count */}
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground shrink-0">
                    <span>{(discovery.data?.totalCount || BigInt(0)).toString()}</span>
                    <span className="hidden sm:inline">results</span>
                  </div>

                  {/* Clear Filters (responsive) */}
                  {hasActiveFilters && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="hidden sm:inline-flex text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear filters
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearFilters}
                        className="sm:hidden shrink-0"
                        aria-label="Clear filters"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  {/* Spacer pushes controls right on small screens */}
                  <div className="flex-1" />

                  {/* View Mode Toggle */}
                  <div className="flex items-center border border-border rounded-md bg-transparent order-3 sm:order-none shrink-0">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('grid')}
                      className="rounded-r-none"
                      aria-label="Grid view"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('list')}
                      className="rounded-none border-x"
                      aria-label="List view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'compact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('compact')}
                      className="rounded-l-none"
                      aria-label="Compact view"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Filters Button */}
                  <Button
                    variant="outline"
                    onClick={() => setInteractionState(prev => ({ ...prev, showFiltersModal: true }))}
                    className="shrink-0"
                    aria-label="Open filters"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-0 sm:mr-2" />
                    <span className="hidden sm:inline">Filters</span>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0.5">
                        Active
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Filter Tabs - responsive, scrollable with icons */}
            <div className="mb-6 -mx-4 px-4">
              <Tabs 
                value={filters.category === 'all' ? 'all' : filters.category.toString()} 
                onValueChange={(value) => handleFilterChange({ 
                  category: value === 'all' ? 'all' : parseInt(value) as ContentCategory 
                })}
              >
                <TabsList className="flex gap-2 overflow-x-auto no-scrollbar md:grid md:w-full md:grid-cols-6">
                  <TabsTrigger 
                    value="all" 
                    className="min-w-[92px] md:min-w-0 px-3 py-2 data-[state=active]:ring-1 data-[state=active]:ring-primary"
                    title="All Content"
                  >
                    <span className="flex items-center gap-2 text-xs md:text-sm">
                      <Grid3x3 className="h-4 w-4" />
                      <span>All</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="0" className="min-w-[92px] md:min-w-0 px-3 py-2" title="Articles">
                    <span className="flex items-center gap-2 text-xs md:text-sm">
                      <FileText className="h-4 w-4" />
                      <span>Articles</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="1" className="min-w-[92px] md:min-w-0 px-3 py-2" title="Videos">
                    <span className="flex items-center gap-2 text-xs md:text-sm">
                      <VideoIcon className="h-4 w-4" />
                      <span>Videos</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="2" className="min-w-[92px] md:min-w-0 px-3 py-2" title="Audio">
                    <span className="flex items-center gap-2 text-xs md:text-sm">
                      <Music className="h-4 w-4" />
                      <span>Audio</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="3" className="min-w-[92px] md:min-w-0 px-3 py-2" title="Images">
                    <span className="flex items-center gap-2 text-xs md:text-sm">
                      <ImageIcon className="h-4 w-4" />
                      <span>Images</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="4" className="min-w-[92px] md:min-w-0 px-3 py-2" title="Other">
                    <span className="flex items-center gap-2 text-xs md:text-sm">
                      <Folder className="h-4 w-4" />
                      <span>Other</span>
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Tag Chips - responsive horizontal scroll, derived by selected category */}
            <TagChips
              selectedCategory={filters.category}
              selectedTags={filters.tags}
              onToggle={(tag) => {
                const exists = filters.tags.includes(tag)
                const next = exists ? filters.tags.filter(t => t !== tag) : [...filters.tags, tag]
                handleFilterChange({ tags: next })
                // sync URL
                const newParams = new URLSearchParams(searchParams.toString())
                if (next.length) newParams.set('tags', next.join(',')); else newParams.delete('tags')
                router.replace(`/browse?${newParams.toString()}`)
              }}
            />

            {/* Success Message */}
            {interactionState.lastPurchaseSuccess && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Content purchased successfully! You now have access to view it.
                </AlertDescription>
              </Alert>
            )}

            {/* Content Grid */}
            <div className="mb-8">
              {discovery.isLoading ? (
                <ContentGridSkeleton viewMode={viewMode} />
              ) : discovery.error ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load content. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : (discovery.data?.contentIds.length || 0) === 0 ? (
                <EmptyState 
                  hasFilters={hasActiveFilters} 
                  onClearFilters={handleClearFilters} 
                />
              ) : (
                <ContentGrid
                  contentIds={discovery.data?.contentIds || []}
                  viewMode={viewMode}
                  userAddress={userAddress}
                  onContentSelect={handleContentSelect}
                  onPurchaseSuccess={handlePurchaseSuccess}
                  onViewContent={handleViewContent}
                />
              )}
            </div>

            {/* Pagination */}
            {(discovery.data?.contentIds.length || 0) > 0 && (
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 py-2 text-sm text-gray-600">
                  Page {currentPage + 1} of {discovery.data?.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!discovery.data?.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Modal */}
        <Dialog 
          open={interactionState.showPurchaseModal} 
          onOpenChange={(open) => setInteractionState(prev => ({ ...prev, showPurchaseModal: open }))}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Purchase Content</DialogTitle>
              <DialogDescription>
                Complete your purchase to gain immediate access to this premium content.
              </DialogDescription>
            </DialogHeader>
            {interactionState.selectedContentId && (
              <ContentPurchaseCard
                contentId={interactionState.selectedContentId}
                userAddress={userAddress}
                onPurchaseSuccess={handlePurchaseSuccess}
                onViewContent={handleViewContent}
                variant="full"
                enableMultiPayment={true}
                enableFallback={true}
                showCreatorInfo={true}
                showPurchaseDetails={true}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Filters Modal - Placeholder for advanced filtering */}
        <Dialog 
          open={interactionState.showFiltersModal} 
          onOpenChange={(open) => setInteractionState(prev => ({ ...prev, showFiltersModal: open }))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
              <DialogDescription>
                Refine your search with detailed filtering options.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Price Range Filter */}
              <div>
                <label className="text-sm font-medium">Price Range (USDC)</label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange({
                      priceRange: [parseFloat(e.target.value) || 0, filters.priceRange[1]]
                    })}
                  />
                  <span>to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange[1]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange({
                      priceRange: [filters.priceRange[0], parseFloat(e.target.value) || 100]
                    })}
                  />
                </div>
              </div>

              {/* Sort By Filter */}
              <div>
                <label className="text-sm font-medium">Sort By</label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value: ContentFilters['sortBy']) => handleFilterChange({ sortBy: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
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

              {/* Access Type Filter */}
              <div>
                <label className="text-sm font-medium">Access Type</label>
                <Select 
                  value={filters.accessType} 
                  onValueChange={(value: ContentFilters['accessType']) => handleFilterChange({ accessType: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="free">Free Content</SelectItem>
                    <SelectItem value="premium">Premium Content</SelectItem>
                    <SelectItem value="subscription">Subscription Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </RouteGuards>
    </AppLayout>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div />}> 
      <BrowsePageClient />
    </Suspense>
  )
}

/**
 * Content Grid Component
 * 
 * Renders the actual content items using our fixed ContentPurchaseCard component.
 */
function ContentGrid({
  contentIds,
  viewMode,
  userAddress,
  onContentSelect,
  onPurchaseSuccess,
  onViewContent
}: {
  contentIds: readonly bigint[]
  viewMode: ViewMode
  userAddress?: Address
  onContentSelect: (id: bigint) => void
  onPurchaseSuccess: (id: bigint) => void
  onViewContent: (id: bigint) => void
}) {
  const gridClassName = useMemo(() => {
    switch (viewMode) {
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
      case 'list':
        return 'space-y-4'
      case 'compact':
        return 'grid grid-cols-1 lg:grid-cols-2 gap-3'
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    }
  }, [viewMode])

  return (
    <div className={gridClassName}>
      {contentIds.map((contentId) => (
        <ContentPurchaseCard
          key={contentId.toString()}
          contentId={contentId}
          userAddress={userAddress}
          onPurchaseSuccess={onPurchaseSuccess}
          onViewContent={onViewContent}
          variant={viewMode === 'list' ? 'full' : viewMode === 'compact' ? 'compact' : 'full'}
          showCreatorInfo={viewMode !== 'compact'}
          showPurchaseDetails={viewMode === 'list'}
          enableMultiPayment={true}
          enableFallback={true}
        />
      ))}
    </div>
  )
}

/**
 * Loading Skeleton Component
 */
function ContentGridSkeleton({ viewMode }: { viewMode: ViewMode }) {
  const items = Array.from({ length: 12 }, (_, i) => i)
  
  const gridClassName = viewMode === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    : viewMode === 'list'
    ? 'space-y-4'
    : 'grid grid-cols-1 lg:grid-cols-2 gap-3'

  return (
    <div className={gridClassName}>
      {items.map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Empty State Component
 */
function EmptyState({ 
  hasFilters, 
  onClearFilters 
}: { 
  hasFilters: boolean
  onClearFilters: () => void 
}) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto max-w-md">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <Search className="h-full w-full" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {hasFilters ? 'No content matches your filters' : 'No content available'}
        </h3>
        <p className="text-gray-500 mb-6">
          {hasFilters 
            ? 'Try adjusting your search criteria or clearing filters to see more results.'
            : 'Check back later as creators are continuously adding new premium content.'
          }
        </p>
        {hasFilters && (
          <Button onClick={onClearFilters}>
            Clear All Filters
          </Button>
        )}
      </div>
    </div>
  )
}
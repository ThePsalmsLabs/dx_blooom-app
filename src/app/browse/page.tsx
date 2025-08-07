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

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Star,
  Grid3x3,
  List,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ExternalLink,
  X,
  Users,
  CheckCircle,
  Loader2
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Badge,
  Tabs,
  TabsContent,
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
import { ContentDiscoveryGrid } from '@/components/content/ContentDiscoveryGrid'
import { ContentPurchaseCard } from '@/components/content/ContentPurchaseCard'

// Import utility functions and types that ensure type safety
import { cn } from '@/lib/utils'
import type { ContentCategory } from '@/types/contracts'
import { isValidContentCategory } from '@/types/contracts'

// Import business logic hooks
import { useActiveContentPaginated } from '@/hooks/contracts/core'
import { useUnifiedContentPurchaseFlow, PaymentMethod } from '@/hooks/business/workflows'
import { formatCurrency, formatAddress } from '@/lib/utils'

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
export default function BrowsePage() {
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
      maxPrice: searchParams.get('maxPrice') || undefined
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
    ]
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

  // Load content data with our improved pagination hook
  const itemsPerPage = 12
  const contentQuery = useActiveContentPaginated(
    currentPage * itemsPerPage,
    itemsPerPage
  )

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
    contentQuery.refetch()
    
    // Show success feedback
    setTimeout(() => {
      setInteractionState(prev => ({ ...prev, lastPurchaseSuccess: false }))
    }, 3000)
  }, [contentQuery])

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

  const totalResults = contentQuery.data?.total || BigInt(0)
  const contentIds = contentQuery.data?.contentIds || []
  const hasMoreContent = contentIds.length === itemsPerPage

  return (
    <AppLayout>
      <RouteGuards requiredLevel="public">
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Discover Premium Content
              </h1>
              <p className="text-gray-600">
                Explore and purchase high-quality content from verified creators using USDC, ETH, WETH, cbETH, DAI, or other supported tokens.
              </p>
            </div>

            {/* Search and Controls Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                
                {/* Search Input */}
                <div className="flex-1 max-w-md">
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
                <div className="flex items-center gap-4">
                  
                  {/* Results Count */}
                  <div className="text-sm text-gray-500">
                    {totalResults.toString()} {totalResults === BigInt(1) ? 'result' : 'results'}
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear filters
                    </Button>
                  )}

                  {/* View Mode Toggle */}
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('grid')}
                      className="rounded-r-none"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('list')}
                      className="rounded-none border-x"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'compact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleViewModeChange('compact')}
                      className="rounded-l-none"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Filters Button */}
                  <Button
                    variant="outline"
                    onClick={() => setInteractionState(prev => ({ ...prev, showFiltersModal: true }))}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Filter Tabs */}
            <div className="mb-6">
              <Tabs 
                value={filters.category === 'all' ? 'all' : filters.category.toString()} 
                onValueChange={(value) => handleFilterChange({ 
                  category: value === 'all' ? 'all' : parseInt(value) as ContentCategory 
                })}
              >
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All Content</TabsTrigger>
                  <TabsTrigger value="0">Articles</TabsTrigger>
                  <TabsTrigger value="1">Videos</TabsTrigger>
                  <TabsTrigger value="2">Audio</TabsTrigger>
                  <TabsTrigger value="3">Images</TabsTrigger>
                  <TabsTrigger value="4">Other</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Success Message */}
            {interactionState.lastPurchaseSuccess && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Content purchased successfully! You now have access to view it.
                </AlertDescription>
              </Alert>
            )}

            {/* Content Grid */}
            <div className="mb-8">
              {contentQuery.isLoading ? (
                <ContentGridSkeleton viewMode={viewMode} />
              ) : contentQuery.error ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load content. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : contentIds.length === 0 ? (
                <EmptyState 
                  hasFilters={hasActiveFilters} 
                  onClearFilters={handleClearFilters} 
                />
              ) : (
                <ContentGrid
                  contentIds={contentIds}
                  viewMode={viewMode}
                  userAddress={userAddress}
                  onContentSelect={handleContentSelect}
                  onPurchaseSuccess={handlePurchaseSuccess}
                  onViewContent={handleViewContent}
                />
              )}
            </div>

            {/* Pagination */}
            {contentIds.length > 0 && (
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 py-2 text-sm text-gray-600">
                  Page {currentPage + 1}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={!hasMoreContent}
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
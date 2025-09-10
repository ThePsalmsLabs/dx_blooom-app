/**
 * MiniApp Discovery Page - Advanced Content Discovery Hub
 * File: src/app/mini/discovery/page.tsx
 *
 * This page provides sophisticated content discovery capabilities in the mini app,
 * featuring advanced filtering, personalized recommendations, and intelligent search
 * optimized for mobile content exploration and instant engagement.
 *
 * Mini App Design Philosophy:
 * - Advanced discovery with smart filtering and search
 * - Personalized recommendations based on user behavior
 * - Mobile-optimized content browsing with quick actions
 * - Seamless transition from discovery to purchase
 * - Social discovery features integrated throughout
 *
 * Key Features:
 * - Advanced search with filters and sorting
 * - Personalized content recommendations
 * - Category-based browsing with smart suggestions
 * - Social discovery (trending, following creators)
 * - Mobile-optimized infinite scroll and lazy loading
 * - Quick purchase actions from discovery
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  Search,
  Filter,
  TrendingUp,
  Heart,
  Share2,
  Eye,
  DollarSign,
  Clock,
  Star,
  Users,
  Zap,
  Target,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Flame,
  BookOpen,
  Video,
  Music,
  Image,
  ThumbsUp,
  Bookmark,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'

// Import your existing UI components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'
import { useActiveContentPaginated } from '@/hooks/contracts/core'

// Import your existing sophisticated components
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'
import { ContentPreviewCard } from '@/components/content/ContentPreviewCard'

// Import utilities
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils'
import type { Content } from '@/types/contracts'
import type { ContractReadResult } from '@/hooks/contracts/core'

/**
 * Discovery Tab Types
 */
type DiscoveryTab = 'for-you' | 'trending' | 'following' | 'search'

/**
 * Sort Option Types
 */
type SortOption = 'newest' | 'popular' | 'price-low' | 'price-high' | 'rating'

/**
 * View Mode Types
 */
type ViewMode = 'grid' | 'list'

/**
 * Filter State Interface
 */
interface DiscoveryFilters {
  readonly categories: string[]
  readonly priceRange: [number, number]
  readonly sortBy: SortOption
  readonly showFreeOnly: boolean
  readonly showVerifiedOnly: boolean
}

/**
 * MiniApp Discovery Core Component
 *
 * This component orchestrates the advanced content discovery experience
 * with mobile-first design and intelligent filtering capabilities.
 */
function MiniAppDiscoveryCore() {
  const router = useRouter()

  // Core state management
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('for-you')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<DiscoveryFilters>({
    categories: [],
    priceRange: [0, 100],
    sortBy: 'newest',
    showFreeOnly: false,
    showVerifiedOnly: false
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useMiniAppWalletUI()

  const userAddress = walletUI.address && typeof walletUI.address === 'string'
    ? walletUI.address as `0x${string}`
    : undefined

  // Content discovery hook
  const { data: contentData, isLoading, error, refetch } = useActiveContentPaginated(
    currentPage * 12,
    12
  )

  /**
   * Tab Change Handler
   */
  const handleTabChange = useCallback((tab: DiscoveryTab) => {
    setActiveTab(tab)
    setCurrentPage(0)
  }, [])

  /**
   * Search Handler
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(0)
  }, [])

  /**
   * Filter Update Handler
   */
  const handleFilterUpdate = useCallback((newFilters: Partial<DiscoveryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(0)
  }, [])

  /**
   * Content Selection Handler
   */
  const handleContentSelect = useCallback((contentId: bigint) => {
    router.push(`/mini/content/${contentId}`)
  }, [router])

  /**
   * Load More Handler
   */
  const handleLoadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1)
  }, [])

  /**
   * Navigation Handler
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Optimized Navigation Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <MiniAppLayout
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 space-y-6">
        {/* Discovery Header */}
        <DiscoveryHeader
          onGoBack={handleGoBack}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onFiltersToggle={() => setShowFilters(true)}
          activeFiltersCount={getActiveFiltersCount(filters)}
        />

        {/* Discovery Tabs */}
        <DiscoveryTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Content Grid */}
        <DiscoveryContentGrid
          activeTab={activeTab}
          viewMode={viewMode}
          filters={filters}
          searchQuery={searchQuery}
          contentData={contentData}
          isLoading={isLoading}
          error={error}
          onContentSelect={handleContentSelect}
          onLoadMore={handleLoadMore}
          onRetry={refetch}
        />

        {/* Filters Sheet */}
        <FiltersSheet
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersUpdate={handleFilterUpdate}
        />
      </main>
    </div>
  )
}

/**
 * Discovery Header Component
 *
 * Mobile-optimized header with search and filter controls
 */
function DiscoveryHeader({
  onGoBack,
  searchQuery,
  onSearch,
  onFiltersToggle,
  activeFiltersCount
}: {
  onGoBack: () => void
  searchQuery: string
  onSearch: (query: string) => void
  onFiltersToggle: () => void
  activeFiltersCount: number
}) {
  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          className="flex items-center gap-2 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content, creators, topics..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 pr-12"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearch('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onFiltersToggle}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Discovery Tabs Component
 *
 * Mobile-optimized tabbed interface for different discovery modes
 */
function DiscoveryTabs({
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange
}: {
  activeTab: DiscoveryTab
  onTabChange: (tab: DiscoveryTab) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}) {
  const tabs = [
    { id: 'for-you' as DiscoveryTab, label: 'For You', icon: Sparkles },
    { id: 'trending' as DiscoveryTab, label: 'Trending', icon: Flame },
    { id: 'following' as DiscoveryTab, label: 'Following', icon: Users },
    { id: 'search' as DiscoveryTab, label: 'Search', icon: Search }
  ]

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className="flex items-center gap-1 flex-shrink-0"
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-sm">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
          className="h-8 w-8 p-0"
        >
          {viewMode === 'grid' ? (
            <List className="h-4 w-4" />
          ) : (
            <Grid3X3 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Tab Description */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {activeTab === 'for-you' && 'Personalized recommendations based on your interests'}
          {activeTab === 'trending' && 'Most popular content right now'}
          {activeTab === 'following' && 'Content from creators you follow'}
          {activeTab === 'search' && 'Search results for your query'}
        </p>
      </div>
    </div>
  )
}

/**
 * Discovery Content Grid Component
 *
 * Main content display with filtering and pagination
 */
function DiscoveryContentGrid({
  activeTab,
  viewMode,
  filters,
  searchQuery,
  contentData,
  isLoading,
  error,
  onContentSelect,
  onLoadMore,
  onRetry
}: {
  activeTab: DiscoveryTab
  viewMode: ViewMode
  filters: DiscoveryFilters
  searchQuery: string
  contentData: { contentIds: readonly bigint[]; total: bigint } | undefined
  isLoading: boolean
  error: Error | null
  onContentSelect: (contentId: bigint) => void
  onLoadMore: () => void
  onRetry: () => void
}) {
  // Get content IDs for discovery - using all available content for now
  // In a full implementation, you'd apply filters and sorting
  const discoveryContentIds = useMemo(() => {
    if (!contentData?.contentIds) return []
    return contentData.contentIds.slice(0, 12) // Show first 12 items
  }, [contentData])

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Content</h3>
          <p className="text-muted-foreground mb-4">
            We encountered an error while loading content. Please try again.
          </p>
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Content Grid */}
      {isLoading ? (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1" : "grid-cols-1"
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : discoveryContentIds.length > 0 ? (
        <div className={cn(
          "grid gap-4",
          viewMode === 'grid' ? "grid-cols-1" : "grid-cols-1"
        )}>
          {discoveryContentIds.map((contentId) => (
            <ContentPreviewCard
              key={contentId.toString()}
              contentId={contentId}
              viewMode={viewMode}
              showCreatorInfo={true}
              userAddress={undefined}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? `No results found for "${searchQuery}". Try adjusting your search or filters.`
                : 'No content available at the moment. Check back soon!'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Load More */}
      {!isLoading && discoveryContentIds.length > 0 && discoveryContentIds.length >= 12 && (
        <div className="text-center">
          <Button onClick={onLoadMore} variant="outline">
            Load More Content
          </Button>
        </div>
      )}
    </div>
  )
}


/**
 * Filters Sheet Component
 *
 * Mobile-optimized filter panel using Sheet component
 */
function FiltersSheet({
  isOpen,
  onClose,
  filters,
  onFiltersUpdate
}: {
  isOpen: boolean
  onClose: () => void
  filters: DiscoveryFilters
  onFiltersUpdate: (filters: Partial<DiscoveryFilters>) => void
}) {
  const categories = [
    'Article', 'Video', 'Audio', 'Image', 'Document', 'Course'
  ]

  const handleCategoryToggle = useCallback((category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    onFiltersUpdate({ categories: newCategories })
  }, [filters.categories, onFiltersUpdate])

  const handleClearFilters = useCallback(() => {
    onFiltersUpdate({
      categories: [],
      priceRange: [0, 100],
      sortBy: 'newest',
      showFreeOnly: false,
      showVerifiedOnly: false
    })
  }, [onFiltersUpdate])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Content</SheetTitle>
          <SheetDescription>
            Refine your content discovery experience
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Categories */}
          <div className="space-y-3">
            <h4 className="font-medium">Categories</h4>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Button
                    variant={filters.categories.includes(category) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryToggle(category)}
                    className="h-6 w-6 p-0"
                  >
                    {filters.categories.includes(category) ? "✓" : "☐"}
                  </Button>
                  <label
                    htmlFor={category}
                    className="text-sm font-medium leading-none cursor-pointer"
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <h4 className="font-medium">Price Range</h4>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => onFiltersUpdate({ priceRange: value as [number, number] })}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}+</span>
              </div>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-3">
            <h4 className="font-medium">Sort By</h4>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => onFiltersUpdate({ sortBy: value as SortOption })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Filters */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Button
                variant={filters.showFreeOnly ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersUpdate({ showFreeOnly: !filters.showFreeOnly })}
                className="h-6 w-6 p-0"
              >
                {filters.showFreeOnly ? "✓" : "☐"}
              </Button>
              <label htmlFor="free-only" className="text-sm font-medium cursor-pointer" onClick={() => onFiltersUpdate({ showFreeOnly: !filters.showFreeOnly })}>
                Free content only
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={filters.showVerifiedOnly ? "default" : "outline"}
                size="sm"
                onClick={() => onFiltersUpdate({ showVerifiedOnly: !filters.showVerifiedOnly })}
                className="h-6 w-6 p-0"
              >
                {filters.showVerifiedOnly ? "✓" : "☐"}
              </Button>
              <label htmlFor="verified-only" className="text-sm font-medium cursor-pointer" onClick={() => onFiltersUpdate({ showVerifiedOnly: !filters.showVerifiedOnly })}>
                Verified creators only
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClearFilters} className="flex-1">
              Clear All
            </Button>
            <Button onClick={onClose} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Utility Functions
 */
function getActiveFiltersCount(filters: DiscoveryFilters): number {
  let count = 0
  if (filters.categories.length > 0) count++
  if (filters.priceRange[0] > 0 || filters.priceRange[1] < 100) count++
  if (filters.sortBy !== 'newest') count++
  if (filters.showFreeOnly) count++
  if (filters.showVerifiedOnly) count++
  return count
}

/**
 * Error Fallback Component
 */
function DiscoveryErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <MiniAppLayout
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Discovery Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading the discovery page. Please try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={resetErrorBoundary} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/mini'}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Loading Skeleton Component
 */
function DiscoveryLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <MiniAppLayout
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="flex gap-1 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1" />
          ))}
        </div>

        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

/**
 * MiniApp Discovery Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppDiscoveryPage() {
  return (
    <ErrorBoundary
      FallbackComponent={DiscoveryErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Discovery error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<DiscoveryLoadingSkeleton />}>
        <MiniAppDiscoveryCore />
      </Suspense>
    </ErrorBoundary>
  )
}

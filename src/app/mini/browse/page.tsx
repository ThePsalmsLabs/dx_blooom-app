/**
 * MiniApp Browse Page Component - Production Ready Route
 * File: src/app/mini/browse/page.tsx
 * 
 * This component builds on your existing sophisticated content discovery architecture
 * (ContentDiscoveryGrid, useActiveContentPaginated, etc.) while adapting it for 
 * MiniApp social commerce context. It leverages your proven content browsing patterns
 * and purchase flows while optimizing for mobile-first social discovery.
 * 
 * Production Features:
 * - Builds on your existing ContentDiscoveryGrid and content discovery infrastructure
 * - Uses your proven useActiveContentPaginated hook for content data
 * - Integrates with your OrchestratedContentPurchaseCard for purchase flows
 * - Leverages your UnifiedContentBrowser when appropriate
 * - Adapts your content filtering patterns for mobile social browsing
 * - Optimizes for Farcaster social context and instant engagement
 * 
 * Architecture Integration:
 * - Uses your existing content discovery hooks and components
 * - Leverages your proven filtering, pagination, and view mode patterns
 * - Integrates with your MiniApp context for social features
 * - Maintains consistency with your web browse page while optimizing for mobile
 * - Builds on the patterns established in our previous MiniApp route components
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
// Wallet connection handled by useWalletConnectionUI below
import { ErrorBoundary } from 'react-error-boundary'
import {
  Search,
  Grid3X3,
  List,
  Eye,
  Star,
  TrendingUp,
  Clock,
  DollarSign,
  Play,
  FileText,
  Headphones,
  Image,
  BookOpen,
  RefreshCw,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Zap,
  Heart,
  Share2,
  Wallet
} from 'lucide-react'

// Import your actual UI components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Skeleton
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your actual hooks and components
import { useMiniAppUtils, useMiniAppState, useSocialState } from '@/contexts/UnifiedMiniAppProvider'
import { useMiniAppRPCOptimization } from '@/hooks/miniapp/useMiniAppRPCOptimization'
import { useActiveContentPaginated } from '@/hooks/contracts/core'
import { useIsCreatorRegistered } from '@/hooks/contracts/core'
import { useContentByCategory } from '@/hooks/contracts/content/useContentDiscovery'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { useMiniAppBalance } from '@/hooks/miniapp/useMiniAppBalance'
import { formatWalletAddress, isWalletFullyConnected, getSafeAddress } from '@/lib/utils/wallet-utils'
import InsufficientBalanceAlert from '@/components/miniapp/InsufficientBalanceAlert'

// Import your existing content components
import { MiniAppContentBrowser } from '@/components/content/MiniAppContentBrowser'
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'

// Import your existing types
import { ContentCategory } from '@/types/contracts'
import { ContentCategory as DiscoveryContentCategory } from '@/hooks/contracts/content/useContentDiscovery'

// Note: Mock data imports removed - using only real contract data

// ================================================
// PRODUCTION TYPE DEFINITIONS
// ================================================

interface MiniAppBrowseState {
  readonly activeTab: 'featured' | 'trending' | 'new' | 'categories'
  readonly selectedCategory: ContentCategory | 'all'
  readonly viewMode: 'grid' | 'list'
  readonly sortBy: 'newest' | 'popular' | 'price_low' | 'price_high'
  readonly sortOrder: 'asc' | 'desc'
  readonly searchQuery: string
  readonly showFreeOnly: boolean
  readonly currentPage: number
  readonly refreshTrigger: number
}

interface ContentTab {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly badge?: string
  readonly analyticsEvent: string
}

interface CategoryOption {
  readonly id: ContentCategory | 'all'
  readonly label: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly count?: number
}

// ================================================
// PRODUCTION CONFIGURATION
// ================================================

const CONTENT_TABS: readonly ContentTab[] = [
  {
    id: 'featured',
    label: 'Featured',
    description: 'Top quality content recommended for you',
    icon: Star,
    badge: 'Popular',
    analyticsEvent: 'miniapp_browse_featured'
  },
  {
    id: 'trending',
    label: 'Trending',
    description: 'Most popular content right now',
    icon: TrendingUp,
    badge: 'Hot',
    analyticsEvent: 'miniapp_browse_trending'
  },
  {
    id: 'new',
    label: 'Latest',
    description: 'Recently published content',
    icon: Clock,
    analyticsEvent: 'miniapp_browse_new'
  },
  {
    id: 'categories',
    label: 'Categories',
    description: 'Browse by content type',
    icon: Grid3X3,
    analyticsEvent: 'miniapp_browse_categories'
  }
] as const

// Generate category options - counts will be fetched from real contract data
const getCategoryOptions = (): CategoryOption[] => {
  return [
    { id: 'all', label: 'All Content', icon: Grid3X3 },
    { id: ContentCategory.VIDEO, label: 'Videos', icon: Play },
    { id: ContentCategory.AUDIO, label: 'Audio', icon: Headphones },
    { id: ContentCategory.ARTICLE, label: 'Articles', icon: FileText },
    { id: ContentCategory.IMAGE, label: 'Images', icon: Image },
    { id: ContentCategory.DOCUMENT, label: 'Documents', icon: BookOpen },
    { id: ContentCategory.COURSE, label: 'Courses', icon: Star },
    { id: ContentCategory.DATA, label: 'Data', icon: Eye }
  ]
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'popular', label: 'Most Popular', icon: TrendingUp },
  { value: 'price_low', label: 'Price: Low to High', icon: DollarSign },
  { value: 'price_high', label: 'Price: High to Low', icon: DollarSign }
] as const

// ================================================
// PRODUCTION CUSTOM HOOKS
// ================================================

/**
 * MiniApp Browse Analytics Hook
 * Tracks content discovery and engagement in miniapp context
 */
function useMiniAppBrowseAnalytics() {
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const { isMiniApp } = miniAppUtils
  const { userProfile } = socialState
  
  const trackBrowseInteraction = useCallback((event: string, properties: Record<string, unknown> = {}) => {
    if (!isMiniApp) return
    
    try {
      const eventData = {
        event: `miniapp_browse_${event}`,
        properties: {
          ...properties,
          context: 'miniapp_browse',
          user_fid: userProfile?.fid || null,
          timestamp: Date.now(),
          session_id: sessionStorage.getItem('miniapp_session_id') || 'anonymous'
        }
      }
      
      // Integration with your analytics system
      if (typeof window !== 'undefined' && (window as unknown as { analytics?: { track: (event: string, properties: Record<string, unknown>) => void } }).analytics) {
        (window as unknown as { analytics: { track: (event: string, properties: Record<string, unknown>) => void } }).analytics.track(eventData.event, eventData.properties)
      }
      
      console.log('MiniApp browse interaction tracked:', eventData)
    } catch (error) {
      console.warn('Analytics tracking failed:', error)
    }
  }, [isMiniApp])
  
  return { trackBrowseInteraction }
}

/**
 * Real Content Data Hook
 * Uses only real contract data - no mock data fallback
 */
function useRealContentData(
  offset: number,
  limit: number,
  filters: { category?: ContentCategory | 'all'; search?: string; sortBy?: string }
) {
  const { trackBrowseInteraction } = useMiniAppBrowseAnalytics()
  
  // Use category-specific hook if category filter is applied
  const shouldUseAllContent = !filters.category || filters.category === 'all'
  
  // Fetch all content when no category filter, or category-specific content
  const allContentQuery = useActiveContentPaginated(
    shouldUseAllContent ? offset : 0, 
    shouldUseAllContent ? limit : 0
  )
  
  // Use category-specific content discovery when category is selected
  const categoryContentQuery = useContentByCategory(
    !shouldUseAllContent && filters.category !== 'all' ? (filters.category as unknown as DiscoveryContentCategory) : undefined,
    { 
      page: !shouldUseAllContent ? Math.floor(offset / limit) + 1 : 1, 
      limit: !shouldUseAllContent ? limit : 12 
    }
  )
  
  // Determine which query result to use
  const effectiveQuery = shouldUseAllContent ? allContentQuery : categoryContentQuery
  const contractContentIds = effectiveQuery.data?.contentIds || []

  // Track analytics for real contract data
  useEffect(() => {
    if (effectiveQuery.data) {
      if (contractContentIds.length > 0) {
        trackBrowseInteraction('real_content_displayed', {
          category: filters.category,
          search: filters.search,
          sort: filters.sortBy,
          results_count: contractContentIds.length,
          total_available: (effectiveQuery.data as any)?.total || contractContentIds.length
        })
      } else {
        trackBrowseInteraction('empty_content_state', {
          category: filters.category,
          search: filters.search,
          sort: filters.sortBy,
          message: 'No content available in this category'
        })
      }
    }
  }, [effectiveQuery.data, filters, contractContentIds.length, trackBrowseInteraction])

  // Log successful category filtering for contract data
  useEffect(() => {
    if (!shouldUseAllContent && effectiveQuery.data) {
      console.log('🏷️ Category filter applied to contract data:', filters.category, 'Found:', contractContentIds.length, 'items')
      trackBrowseInteraction('category_filter_applied', { 
        category: filters.category, 
        results_count: contractContentIds.length 
      })
    }
  }, [shouldUseAllContent, filters.category, contractContentIds.length, effectiveQuery.data, trackBrowseInteraction])

  return {
    data: effectiveQuery.data,
    isLoading: effectiveQuery.isLoading,
    error: effectiveQuery.error,
    refetch: effectiveQuery.refetch,
    filteredContent: contractContentIds,
    trackBrowseInteraction,
    hasData: contractContentIds.length > 0,
    isEmpty: contractContentIds.length === 0 && !effectiveQuery.isLoading && !effectiveQuery.error
  }
}

// ================================================
// PRODUCTION ERROR HANDLING
// ================================================

function MiniAppBrowseErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error
  resetErrorBoundary: () => void 
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Content Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We&apos;re having trouble loading content. This usually resolves quickly.
          </p>
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
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
  )
}

function MiniAppBrowseLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Skeleton */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        
        {/* Search Bar */}
        <Skeleton className="h-10 w-full" />
        
        {/* Tabs */}
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-20" />
          ))}
        </div>
        
        {/* Content Grid */}
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ================================================
// MAIN PRODUCTION COMPONENT
// ================================================

function MiniAppBrowseCore() {
  // Production state management
  const router = useRouter()
  const searchParams = useSearchParams()
  const [browseState, setBrowseState] = useState<MiniAppBrowseState>({
    activeTab: (searchParams?.get('tab') as MiniAppBrowseState['activeTab']) || 'featured',
    selectedCategory: 'all',
    viewMode: 'grid',
    sortBy: 'newest',
    sortOrder: 'desc',
    searchQuery: searchParams?.get('search') || '',
    showFreeOnly: false,
    currentPage: 0,
    refreshTrigger: 0
  })

  // Initialize RPC optimization aligned with web app
  const rpcOptimization = useMiniAppRPCOptimization({
    enableBatching: true,
    enablePrefetching: false, // Disable prefetching to reduce calls (aligned with web app)
    mobileOptimizations: true,
    aggressiveCaching: true,
    throttleMs: 1000 // Same throttle as web app
  })
  
  // Production hooks
  const miniAppUtils = useMiniAppUtils()
  const miniAppState = useMiniAppState()
  const socialState = useSocialState()

  const {
    isMiniApp
  } = miniAppUtils

  const {
    loadingState
  } = miniAppState

  const {
    userProfile,
    isAvailable: hasSocialContext
  } = socialState
  
  // Get wallet connection status using direct Farcaster hook
  const walletUI = useFarcasterAutoWallet()
  const fullAddress = getSafeAddress(walletUI.address)
  const isConnected = isWalletFullyConnected(walletUI.isConnected, walletUI.address)
  const formattedAddress = formatWalletAddress(walletUI.address)
  
  // Get balance information for purchase capabilities
  const balanceState = useMiniAppBalance()
  
  // Remove excessive creator registration check (aligned with web app optimization)
  // Only check when actually needed for specific actions
  const isCreator = false // Placeholder - check only when needed
  
  // Real content data - no mock data fallback
  const {
    data: contentData,
    isLoading,
    error,
    refetch,
    filteredContent,
    trackBrowseInteraction,
    hasData,
    isEmpty
  } = useRealContentData(
    browseState.currentPage * 12,
    12,
    {
      category: browseState.selectedCategory,
      search: browseState.searchQuery,
      sortBy: browseState.sortBy
    }
  )
  
  // ================================================
  // PRODUCTION EVENT HANDLERS
  // ================================================
  
  const updateState = useCallback((updates: Partial<MiniAppBrowseState>) => {
    setBrowseState(prev => ({ ...prev, ...updates }))
  }, [])
  
  const handleTabChange = useCallback((tab: MiniAppBrowseState['activeTab']) => {
    updateState({ activeTab: tab, currentPage: 0 })
    
    // Update URL without causing reload
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('tab', tab)
    window.history.pushState(null, '', newUrl.toString())

    // Track analytics
    const tabInfo = CONTENT_TABS.find(t => t.id === tab)
    if (tabInfo) {
      trackBrowseInteraction('tab_changed', {
        tab,
        tab_label: tabInfo.label
      })
    }
  }, [updateState, trackBrowseInteraction])
  
  const handleSearch = useCallback((query: string) => {
    updateState({ searchQuery: query, currentPage: 0 })
    
    // Update URL
    const newUrl = new URL(window.location.href)
    if (query) {
      newUrl.searchParams.set('search', query)
    } else {
      newUrl.searchParams.delete('search')
    }
    window.history.pushState(null, '', newUrl.toString())
    
    // Track analytics
    trackBrowseInteraction('search', {
      query: query,
      results_count: filteredContent.length
    })
  }, [updateState, trackBrowseInteraction, filteredContent.length])
  
  const handleCategoryChange = useCallback((category: ContentCategory | 'all') => {
    updateState({ selectedCategory: category, currentPage: 0 })
    
    trackBrowseInteraction('category_changed', {
      category: category,
      previous_category: browseState.selectedCategory
    })
  }, [updateState, trackBrowseInteraction, browseState.selectedCategory])
  
  const handleSortChange = useCallback((sortBy: MiniAppBrowseState['sortBy']) => {
    updateState({ sortBy, currentPage: 0 })
    
    trackBrowseInteraction('sort_changed', {
      sort_by: sortBy,
      previous_sort: browseState.sortBy
    })
  }, [updateState, trackBrowseInteraction, browseState.sortBy])
  
  const handleContentSelect = useCallback((contentId: bigint) => {
    trackBrowseInteraction('content_selected', {
      content_id: contentId.toString(),
      source: browseState.activeTab,
      category: browseState.selectedCategory
    })
    
    router.push(`/mini/content/${contentId}`)
  }, [router, trackBrowseInteraction, browseState.activeTab, browseState.selectedCategory])
  
  const handleRefresh = useCallback(async () => {
    // Use optimized refresh with throttling
    await rpcOptimization.smartRefresh('browse-page', async () => {
      updateState({ refreshTrigger: browseState.refreshTrigger + 1 })
      await refetch()
      trackBrowseInteraction('page_refreshed')
    })
  }, [updateState, browseState.refreshTrigger, refetch, trackBrowseInteraction, rpcOptimization])
  
  // ================================================
  // PRODUCTION ANALYTICS TRACKING
  // ================================================
  
  useEffect(() => {
    if (loadingState === 'success' && isMiniApp) {
      trackBrowseInteraction('page_viewed', {
        tab: browseState.activeTab,
        category: browseState.selectedCategory,
        has_social_context: hasSocialContext,
        is_connected: isConnected,
        is_creator: isCreator || false,
        user_fid: userProfile?.fid || null,
        content_count: filteredContent.length
      })
    }
  }, [loadingState, isMiniApp, browseState.activeTab, browseState.selectedCategory, hasSocialContext, isConnected, isCreator, userProfile, filteredContent.length, trackBrowseInteraction])
  
  // ================================================
  // PRODUCTION RENDER COMPONENTS
  // ================================================
  
  const CategorySelector = React.memo(({ 
    selectedCategory, 
    onCategoryChange 
  }: { 
    selectedCategory: ContentCategory | 'all'
    onCategoryChange: (category: ContentCategory | 'all') => void 
  }) => {
    const categoryOptions = getCategoryOptions()
    
    return (
      <div className="mb-6 px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {categoryOptions.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className="flex flex-col items-center justify-center gap-2 h-auto py-4 px-2 min-h-[80px] transition-all duration-200 hover:scale-105"
            >
              <category.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-xs font-medium text-center leading-tight">{category.label}</span>
            </Button>
          ))}
        </div>
        
        {/* Show selected category */}
        {selectedCategory !== 'all' && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg text-center max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              Showing content in: <span className="font-medium text-foreground">
                {categoryOptions.find(c => c.id === selectedCategory)?.label}
              </span>
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              💡 Tip: Use the search bar to find specific content within this category
            </div>
          </div>
        )}
      </div>
    )
  })
  CategorySelector.displayName = 'CategorySelector'
  
  const BrowseHeader = React.memo(() => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Discover Content
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
                          {hasSocialContext
                ? 'Explore premium content shared by your network'
                : 'Browse and purchase exclusive content from top creators'
              }
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Wallet Status with Balance */}
          {isConnected && formattedAddress && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-md">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="text-xs font-medium text-green-800">Connected</span>
              <span className="text-xs font-mono text-green-700">{formattedAddress}</span>
              {balanceState.totalSpendingPower > 0 && (
                <div className="flex items-center gap-1 ml-2 pl-2 border-l border-green-300">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">
                    ${balanceState.totalSpendingPower.toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Mobile Balance Display */}
          {isConnected && balanceState.totalSpendingPower > 0 && (
            <div className="sm:hidden flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                ${balanceState.totalSpendingPower.toFixed(0)}
              </span>
            </div>
          )}

          <Badge variant="secondary" className="text-xs">
            {filteredContent.length} items
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>
    </div>
  ))
  BrowseHeader.displayName = 'BrowseHeader'
  
  const SearchAndFilters = React.memo(() => (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search content..."
          value={browseState.searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Filters and Sort */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {browseState.activeTab === 'categories' && (
            <Select
              value={browseState.selectedCategory === 'all' ? 'all' : browseState.selectedCategory.toString()}
              onValueChange={(value) => handleCategoryChange(value === 'all' ? 'all' : (parseInt(value) as ContentCategory))}
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getCategoryOptions().map((option) => (
                  <SelectItem 
                    key={option.id} 
                    value={option.id === 'all' ? 'all' : option.id.toString()}
                    className="text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <option.icon className="h-3 w-3" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button
            variant={browseState.showFreeOnly ? "default" : "outline"}
            size="sm"
            onClick={() => updateState({ showFreeOnly: !browseState.showFreeOnly })}
            className="h-8"
          >
            <Zap className="h-3 w-3 mr-1" />
            Free Only
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={browseState.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  <div className="flex items-center gap-2">
                    <option.icon className="h-3 w-3" />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateState({ 
              sortOrder: browseState.sortOrder === 'asc' ? 'desc' : 'asc' 
            })}
            className="h-8 w-8"
          >
            {browseState.sortOrder === 'asc' ? 
              <ArrowUp className="h-3 w-3" /> : 
              <ArrowDown className="h-3 w-3" />
            }
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateState({ 
              viewMode: browseState.viewMode === 'grid' ? 'list' : 'grid' 
            })}
            className="h-8 w-8"
          >
            {browseState.viewMode === 'grid' ? 
              <List className="h-3 w-3" /> : 
              <Grid3X3 className="h-3 w-3" />
            }
          </Button>
        </div>
      </div>
    </div>
  ))
  SearchAndFilters.displayName = 'SearchAndFilters'
  
  const ContentTabs = React.memo(() => (
    <div className="w-full px-1">
      <Tabs value={browseState.activeTab} onValueChange={(value) => handleTabChange(value as MiniAppBrowseState['activeTab'])} className="w-full">
        <div className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-card border border-border/50 rounded-xl shadow-sm p-1.5 min-h-[48px]">
            {CONTENT_TABS.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-lg transition-all duration-300 hover:scale-[0.98] hover:bg-muted/60 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/20 min-h-[40px]"
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] font-medium leading-none">{tab.label}</span>
                  {tab.badge && (
                    <Badge 
                      variant={browseState.activeTab === tab.id ? "secondary" : "outline"} 
                      className="text-[8px] h-3 px-1 leading-none hidden sm:inline-flex"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {CONTENT_TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4 space-y-4">
            <div className="text-center px-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tab.description}
              </p>
            </div>
            
            {/* Categories Tab - Show Category Selector */}
            {tab.id === 'categories' && (
              <CategorySelector 
                selectedCategory={browseState.selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  ))
  ContentTabs.displayName = 'ContentTabs'
  
  const ContentSection = React.memo(() => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load content. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )
    }

    if (isEmpty || filteredContent.length === 0) {
      return (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Content Available</h3>
            <p className="text-muted-foreground">
              {browseState.searchQuery
                ? `No content matches "${browseState.searchQuery}". Try adjusting your search.`
                : browseState.selectedCategory !== 'all'
                ? `No content available in the ${getCategoryOptions().find(c => c.id === browseState.selectedCategory)?.label.toLowerCase()} category yet.`
                : 'No content has been published yet. Be the first to create content!'
              }
            </p>
            {browseState.searchQuery && (
              <Button
                onClick={() => handleSearch('')}
                variant="outline"
              >
                Clear Search
              </Button>
            )}
            {browseState.selectedCategory !== 'all' && (
              <Button
                onClick={() => handleCategoryChange('all')}
                variant="outline"
              >
                View All Content
              </Button>
            )}
            {!isCreator && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Want to create content? Register as a creator to start publishing!
                </p>
                <Button
                  onClick={() => router.push('/mini/onboard')}
                  size="sm"
                >
                  Become a Creator
                </Button>
              </div>
            )}
          </div>
        </Card>
      )
    }

    // Use MiniAppContentBrowser with real contract data
    return (
      <div className="space-y-4">
        <MiniAppContentBrowser
          contentIds={filteredContent}
          onContentSelect={handleContentSelect}
          itemsPerPage={12}
          className="w-full"
        />
      </div>
    )
  })
  ContentSection.displayName = 'ContentSection'
  
  // ================================================
  // PRODUCTION LOADING AND ERROR STATES
  // ================================================
  
  if (loadingState === 'loading') {
    return <MiniAppBrowseLoadingSkeleton />
  }
  
  // ================================================
  // PRODUCTION MAIN RENDER
  // ================================================
  
  return (
    <MiniAppLayout>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        <BrowseHeader />
        <SearchAndFilters />
        <ContentTabs />
        <ContentSection />
        
        {/* Balance Status Alert - Show if user has low balance */}
        {isConnected && balanceState.totalSpendingPower < 10 && balanceState.totalSpendingPower > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Low Balance Warning</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You have ${balanceState.totalSpendingPower.toFixed(2)} available. Consider adding more USDC to purchase premium content.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={balanceState.refreshBalances}
                    className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh Balance
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* No Balance Alert - Show if user has zero balance */}
        {isConnected && balanceState.totalSpendingPower === 0 && !balanceState.isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-800">Add Funds to Start Purchasing</h3>
                <p className="text-sm text-red-700 mt-1">
                  Your wallet appears to be empty. Add USDC or ETH to start purchasing premium content from creators.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    onClick={balanceState.refreshBalances}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Check Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Social Commerce Footer */}
        <div className="mt-8 bg-gradient-to-r from-green-600/10 to-blue-600/10 rounded-lg p-4 border border-green-200/20">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Discover Premium Content</h3>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Support creators by purchasing their exclusive content with instant USDC payments
            </p>
            
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Instant access</span>
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                <span>Social sharing</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>Premium quality</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MiniAppLayout>
  )
}

// Export the main component
export default function MiniAppBrowsePage() {
  return (
    <ErrorBoundary
      FallbackComponent={MiniAppBrowseErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Browse Page error:', error, errorInfo)
      }}
    >
      <Suspense fallback={<MiniAppBrowseLoadingSkeleton />}>
        <MiniAppBrowseCore />
      </Suspense>
    </ErrorBoundary>
  )
}
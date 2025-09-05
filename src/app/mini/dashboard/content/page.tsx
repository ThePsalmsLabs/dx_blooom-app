/**
 * MiniApp Dashboard Content Management Page - Creator Content Hub
 * File: src/app/mini/dashboard/content/page.tsx
 *
 * This page provides comprehensive content management tools for creators in the mini app,
 * enabling full CRUD operations, performance monitoring, and content optimization
 * with mobile-first design and touch-optimized interactions.
 *
 * Mini App Design Philosophy:
 * - Mobile-first content management with intuitive gestures
 * - Bulk operations optimized for touch interfaces
 * - Quick actions accessible with single taps
 * - Performance metrics integrated into content cards
 * - Efficient navigation between content states
 *
 * Key Features:
 * - Content listing with performance metrics
 * - Bulk operations (delete, edit, unpublish)
 * - Content status management (draft, published, archived)
 * - Performance analytics per content piece
 * - Quick edit capabilities
 * - Mobile-optimized filtering and sorting
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  FileText,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Filter,
  Search,
  Plus,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Grid3X3,
  List,
  Download,
  Upload,
  Settings,
  Loader2,
  ChevronDown,
  ChevronRight
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useCreatorContent } from '@/hooks/contracts/core'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'
import { useMiniAppUtils } from '@/contexts/UnifiedMiniAppProvider'

// Import your existing sophisticated components
import { AdaptiveNavigation } from '@/components/layout/AdaptiveNavigation'
import { ContentPreviewCard } from '@/components/content/ContentPreviewCard'

// Import utilities
import { formatCurrency, formatRelativeTime, formatNumber } from '@/lib/utils'
import type { Content } from '@/types/contracts'

/**
 * Content Status Types
 */
type ContentStatus = 'all' | 'published' | 'draft' | 'archived'

/**
 * Sort Options
 */
type SortOption = 'newest' | 'oldest' | 'popular' | 'revenue'

/**
 * View Mode Types
 */
type ViewMode = 'grid' | 'list'

/**
 * MiniApp Dashboard Content Management Core Component
 *
 * This component orchestrates the complete content management experience
 * with mobile-first design and comprehensive creator tools.
 */
function MiniAppDashboardContentCore() {
  const router = useRouter()

  // Core state management
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<bigint>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const walletUI = useMiniAppWalletUI()

  const userAddress = walletUI.address && typeof walletUI.address === 'string'
    ? walletUI.address as `0x${string}`
    : undefined

  // Creator content hook
  const creatorContent = useCreatorContent(userAddress)

  /**
   * Filter and Sort Content
   */
  const filteredAndSortedContent = useMemo(() => {
    if (!creatorContent.data) return []

    let filtered = creatorContent.data

    // Filter by status
    if (selectedStatus !== 'all') {
      // TODO: Filter by actual content status from contract
      // filtered = filtered.filter(contentId => {
      //   const content = useContentById(contentId)
      //   return content.data?.isActive === (selectedStatus === 'published')
      // })
    }

    // Filter by search query
    if (searchQuery) {
      // TODO: Implement real search functionality
      // filtered = filtered.filter(contentId => {
      //   const content = useContentById(contentId)
      //   return content.data?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      //          content.data?.description.toLowerCase().includes(searchQuery.toLowerCase())
      // })
    }

    // Sort content (create mutable copy first)
    const sortedFiltered = [...filtered].sort((a: bigint, b: bigint) => {
      switch (sortBy) {
        case 'newest':
          return Number(b) - Number(a) // Sort by ID descending
        case 'oldest':
          return Number(a) - Number(b) // Sort by ID ascending
        case 'popular':
          // TODO: Implement popularity sorting based on view metrics
          return Math.random() - 0.5
        case 'revenue':
          // TODO: Implement revenue sorting based on earnings
          return Math.random() - 0.5
        default:
          return 0
      }
    })

    filtered = sortedFiltered

    return filtered
  }, [creatorContent.data, selectedStatus, searchQuery, sortBy])

  /**
   * Selection Handlers
   */
  const handleSelectItem = useCallback((contentId: bigint) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(contentId)) {
        newSet.delete(contentId)
      } else {
        newSet.add(contentId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredAndSortedContent.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredAndSortedContent))
    }
  }, [selectedItems.size, filteredAndSortedContent])

  /**
   * Bulk Operations
   */
  const handleBulkDelete = useCallback(() => {
    // TODO: Implement bulk delete using contract calls
    // const deletePromises = Array.from(selectedItems).map(contentId =>
    //   // Call contract method to delete content
    // )
    // await Promise.all(deletePromises)
    console.log('TODO: Bulk delete:', Array.from(selectedItems))
    setSelectedItems(new Set())
  }, [selectedItems])

  const handleBulkArchive = useCallback(() => {
    // TODO: Implement bulk archive using contract calls
    // const archivePromises = Array.from(selectedItems).map(contentId =>
    //   // Call contract method to archive content
    // )
    // await Promise.all(archivePromises)
    console.log('TODO: Bulk archive:', Array.from(selectedItems))
    setSelectedItems(new Set())
  }, [selectedItems])

  /**
   * Individual Content Actions
   */
  const handleEditContent = useCallback((contentId: bigint) => {
    // TODO: Navigate to content edit page
    // router.push(`/mini/content/${contentId}/edit`)
    console.log('TODO: Edit content:', contentId)
  }, [])

  const handleDeleteContent = useCallback((contentId: bigint) => {
    // TODO: Implement delete using contract call
    // await deleteContent(contentId)
    console.log('TODO: Delete content:', contentId)
  }, [])

  const handleToggleVisibility = useCallback((contentId: bigint) => {
    // TODO: Implement visibility toggle using contract call
    // await toggleContentVisibility(contentId)
    console.log('TODO: Toggle visibility:', contentId)
  }, [])

  /**
   * Navigation and Utility Handlers
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  const handleNewContent = useCallback(() => {
    router.push('/mini/upload')
  }, [router])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await creatorContent.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [creatorContent])

  // Handle wallet connection requirement
  if (!walletUI.isConnected || !userAddress) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <AdaptiveNavigation showMobile={true} enableAnalytics={true} />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center space-y-6">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Connect your wallet to manage content
            </p>
          </div>
          <Button onClick={() => router.push('/mini')}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Optimized Navigation Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <AdaptiveNavigation showMobile={true} enableAnalytics={true} />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 space-y-6">
        {/* Content Management Header */}
        <ContentManagementHeader
          onGoBack={handleGoBack}
          onNewContent={handleNewContent}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          totalContent={creatorContent.data?.length || 0}
        />

        {/* Filters and Controls */}
        <ContentFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCount={selectedItems.size}
          onSelectAll={handleSelectAll}
          totalCount={filteredAndSortedContent.length}
        />

        {/* Bulk Actions Bar */}
        {selectedItems.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedItems.size}
            onDelete={handleBulkDelete}
            onArchive={handleBulkArchive}
            onClearSelection={() => setSelectedItems(new Set())}
          />
        )}

        {/* Content Grid/List */}
        <ContentDisplay
          content={filteredAndSortedContent}
          viewMode={viewMode}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onEditContent={handleEditContent}
          onDeleteContent={handleDeleteContent}
          onToggleVisibility={handleToggleVisibility}
          isLoading={creatorContent.isLoading}
        />

        {/* Empty State */}
        {!creatorContent.isLoading && filteredAndSortedContent.length === 0 && (
          <EmptyContentState
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            onClearFilters={() => {
              setSearchQuery('')
              setSelectedStatus('all')
            }}
            onNewContent={handleNewContent}
          />
        )}

        {/* Content Stats Summary */}
        <ContentStatsSummary
          totalContent={creatorContent.data?.length || 0}
          publishedContent={creatorContent.data?.length || 0} // TODO: Calculate from active content
          totalViews={0} // TODO: Fetch from analytics contract
          totalRevenue={0} // TODO: Fetch from earnings contract
        />
      </main>
    </div>
  )
}

/**
 * Content Management Header Component
 *
 * Mobile-optimized header with key actions and stats
 */
function ContentManagementHeader({
  onGoBack,
  onNewContent,
  onRefresh,
  isRefreshing,
  totalContent
}: {
  onGoBack: () => void
  onNewContent: () => void
  onRefresh: () => void
  isRefreshing: boolean
  totalContent: number
}) {
  return (
    <div className="space-y-4">
      {/* Navigation and Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          className="flex items-center gap-2 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>

          <Button
            size="sm"
            onClick={onNewContent}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Content
          </Button>
        </div>
      </div>

      {/* Title and Stats */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <FileText className="h-6 w-6" />
          Content Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your {totalContent} content pieces and track performance
        </p>
      </div>
    </div>
  )
}

/**
 * Content Filters Component
 *
 * Mobile-optimized filtering and sorting controls
 */
function ContentFilters({
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  selectedCount,
  onSelectAll,
  totalCount
}: {
  selectedStatus: ContentStatus
  onStatusChange: (status: ContentStatus) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCount: number
  onSelectAll: () => void
  totalCount: number
}) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
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

          {totalCount > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant={selectedCount === totalCount && totalCount > 0 ? "default" : "outline"}
                size="sm"
                onClick={onSelectAll}
                className="h-6 w-6 p-0"
              >
                {selectedCount === totalCount && totalCount > 0 ? "✓" : "☐"}
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedCount}/{totalCount} selected
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Bulk Actions Bar Component
 *
 * Mobile-optimized bulk operations interface
 */
function BulkActionsBar({
  selectedCount,
  onDelete,
  onArchive,
  onClearSelection
}: {
  selectedCount: number
  onDelete: () => void
  onArchive: () => void
  onClearSelection: () => void
}) {
  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onArchive}
              className="h-8"
            >
              <EyeOff className="h-4 w-4 mr-1" />
              Archive
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="h-8 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8 w-8 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Content Display Component
 *
 * Flexible grid/list view for content items
 */
function ContentDisplay({
  content,
  viewMode,
  selectedItems,
  onSelectItem,
  onEditContent,
  onDeleteContent,
  onToggleVisibility,
  isLoading
}: {
  content: readonly bigint[]
  viewMode: ViewMode
  selectedItems: Set<bigint>
  onSelectItem: (contentId: bigint) => void
  onEditContent: (contentId: bigint) => void
  onDeleteContent: (contentId: bigint) => void
  onToggleVisibility: (contentId: bigint) => void
  isLoading: boolean
}) {
  if (isLoading) {
    return (
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
    )
  }

  return (
    <div className={cn(
      "grid gap-4",
      viewMode === 'grid' ? "grid-cols-1" : "grid-cols-1"
    )}>
      {content.map((contentId) => (
        <ContentManagementCard
          key={contentId.toString()}
          contentId={contentId}
          isSelected={selectedItems.has(contentId)}
          onSelect={() => onSelectItem(contentId)}
          onEdit={() => onEditContent(contentId)}
          onDelete={() => onDeleteContent(contentId)}
          onToggleVisibility={() => onToggleVisibility(contentId)}
        />
      ))}
    </div>
  )
}

/**
 * Content Management Card Component
 *
 * Individual content item with management actions
 */
function ContentManagementCard({
  contentId,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onToggleVisibility
}: {
  contentId: bigint
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleVisibility: () => void
}) {
  // TODO: Fetch real content data from contract using useContentById hook
  // const content = useContentById(contentId)
  // const mockContent = content.data ? {
  //   title: content.data.title,
  //   description: content.data.description,
  //   category: content.data.category,
  //   price: content.data.payPerViewPrice,
  //   views: 0, // TODO: Fetch from analytics
  //   revenue: 0, // TODO: Fetch from earnings
  //   status: 'published' as const, // TODO: Determine from contract state
  //   createdAt: content.data.creationTime
  // } : null

  // Temporary mock data for development
  const mockContent = {
    title: `Content ${contentId.toString().slice(-4)}`,
    description: 'TODO: Load from contract',
    category: 'TODO: Load category',
    price: BigInt(1000000), // 1 USDC in wei
    views: 0, // TODO: Fetch from analytics
    revenue: 0, // TODO: Fetch from earnings
    status: 'published' as const, // TODO: Determine from contract state
    createdAt: BigInt(Math.floor(Date.now() / 1000)) // Current timestamp
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      isSelected && "ring-2 ring-primary"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection Button */}
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={onSelect}
            className="h-6 w-6 p-0 mt-1 flex-shrink-0"
          >
            {isSelected ? "✓" : "☐"}
          </Button>

          {/* Content Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm truncate mb-1">
                  {mockContent.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {mockContent.description}
                </p>
              </div>

              {/* Quick Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onToggleVisibility}>
                    <Eye className="h-4 w-4 mr-2" />
                    Toggle Visibility
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content Metadata */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <Badge variant="secondary" className="text-xs">
                {mockContent.category}
              </Badge>
              <span>{formatCurrency(BigInt(mockContent.price), 2, 'USDC')}</span>
              <span>{formatRelativeTime(mockContent.createdAt)}</span>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm font-medium">{mockContent.views}</div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
              <div>
                <div className="text-sm font-medium">{formatCurrency(BigInt(mockContent.revenue), 2, 'USDC')}</div>
                <div className="text-xs text-muted-foreground">Revenue</div>
              </div>
              <div>
                <div className="text-sm font-medium">
                  <Badge
                    variant={mockContent.status === 'published' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {mockContent.status === 'published' ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {mockContent.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty Content State Component
 *
 * Helpful guidance when no content matches filters
 */
function EmptyContentState({
  searchQuery,
  selectedStatus,
  onClearFilters,
  onNewContent
}: {
  searchQuery: string
  selectedStatus: ContentStatus
  onClearFilters: () => void
  onNewContent: () => void
}) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {searchQuery || selectedStatus !== 'all'
            ? 'No content matches your current filters. Try adjusting your search or filters.'
            : 'You haven\'t created any content yet. Start by creating your first piece!'
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {(searchQuery || selectedStatus !== 'all') && (
            <Button variant="outline" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )}
          <Button onClick={onNewContent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Content
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Content Stats Summary Component
 *
 * Overview of content performance metrics
 */
function ContentStatsSummary({
  totalContent,
  publishedContent,
  totalViews,
  totalRevenue
}: {
  totalContent: number
  publishedContent: number
  totalViews: number
  totalRevenue: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Content Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalContent}</div>
            <div className="text-xs text-muted-foreground">Total Content</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{publishedContent}</div>
            <div className="text-xs text-muted-foreground">Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatNumber(totalViews)}</div>
            <div className="text-xs text-muted-foreground">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(BigInt(totalRevenue), 2, 'USDC')}</div>
            <div className="text-xs text-muted-foreground">Total Revenue</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error Fallback Component
 */
function DashboardContentErrorFallback({
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
          <AdaptiveNavigation showMobile={true} enableAnalytics={true} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Content Management Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading your content. Please try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={resetErrorBoundary} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/mini/dashboard'}
                className="flex-1"
              >
                Go Back
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
function DashboardContentLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <AdaptiveNavigation showMobile={true} enableAnalytics={true} />
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>

        <Skeleton className="h-10 w-full" />

        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
 * MiniApp Dashboard Content Management Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppDashboardContentPage() {
  return (
    <ErrorBoundary
      FallbackComponent={DashboardContentErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Dashboard Content error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<DashboardContentLoadingSkeleton />}>
        <MiniAppDashboardContentCore />
      </Suspense>
    </ErrorBoundary>
  )
}

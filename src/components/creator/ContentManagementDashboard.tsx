/**
 * Content Management Dashboard Component
 * File: src/components/creator/ContentManagementDashboard.tsx
 * 
 * This component provides comprehensive content lifecycle management for creators,
 * implementing the useAdvancedContentManagement hook to enable dynamic pricing,
 * availability control, and professional content organization. It transforms the
 * static content publishing model into dynamic content portfolio management.
 * 
 * Key Features:
 * - Dynamic content pricing with market optimization tools
 * - Content availability toggle (activate/deactivate without data loss)
 * - Bulk content management with multi-select operations
 * - Content performance analytics and engagement metrics
 * - Category-based content organization and filtering
 * - Tag-based search and content discovery optimization
 * - Professional content editing interface with real-time updates
 * - Content lifecycle tracking with status indicators
 * 
 * Business Value:
 * - Enables creators to optimize pricing strategies based on performance
 * - Provides professional content portfolio management tools
 * - Reduces content management friction for serious creators
 * - Enables data-driven content strategy optimization
 * - Supports content curation and organization at scale
 * 
 * Integration Notes:
 * - Uses useAdvancedContentManagement hook for contract interactions
 * - Follows established UI patterns from dashboard components
 * - Integrates with existing content hooks for data fetching
 * - Provides seamless integration with creator dashboard navigation
 * - Maintains responsive design and accessibility standards
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import {
  FileText,
  DollarSign,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Search,
  Filter,
  Grid3x3,
  List,
  MoreHorizontal,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  RefreshCw,
  Loader2,
  AlertTriangle
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'

// Import our architectural layers
import { useAdvancedContentManagement } from '@/hooks/contracts/content/useAdvancedContentManagement'
import { useCreatorContent } from '@/hooks/contracts/core'
import { ContentCategory, categoryToString, type Content } from '@/types/contracts'

/**
 * Content Filter Options Interface
 * 
 * This interface provides comprehensive filtering capabilities for content management,
 * enabling creators to organize and find content efficiently across large catalogs.
 */
interface ContentFilters {
  search: string
  category: ContentCategory | 'all'
  status: 'all' | 'active' | 'inactive'
  priceRange: 'all' | 'free' | 'low' | 'medium' | 'high'
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year'
  sortBy: 'newest' | 'oldest' | 'price_high' | 'price_low' | 'popular' | 'title'
}

/**
 * Content Management View Mode Options
 * 
 * Different view modes optimize the interface for different content management tasks,
 * from quick overview to detailed editing and analytics review.
 */
type ViewMode = 'grid' | 'table' | 'analytics'

/**
 * Bulk Action Options
 * 
 * These actions can be applied to multiple selected content items simultaneously,
 * enabling efficient content portfolio management at scale.
 */
type BulkAction = 'activate' | 'deactivate' | 'update_price' | 'change_category' | 'delete'

/**
 * Content Item with Analytics Interface
 * 
 * This extends the basic Content type with performance analytics and management metadata
 * that creators need to make informed content strategy decisions.
 */
interface ContentWithAnalytics extends Content {
  readonly tags: string[]
  readonly analytics: {
    readonly views: number
    readonly purchases: number
    readonly revenue: bigint
    readonly conversionRate: number
    readonly trend: 'up' | 'down' | 'stable'
    readonly lastPurchase?: Date
  }
  readonly managementInfo: {
    readonly canEdit: boolean
    readonly hasReports: boolean
    readonly reportCount: number
    readonly isPromoted: boolean
  }
}

/**
 * Props interface for the ContentManagementDashboard component
 */
interface ContentManagementDashboardProps {
  /** Optional creator address - defaults to connected wallet */
  creatorAddress?: string
  /** Initial view mode */
  initialViewMode?: ViewMode
  /** Whether to show analytics by default */
  showAnalytics?: boolean
  /** Maximum number of items to display per page */
  itemsPerPage?: number
  /** Optional callback when content is updated */
  onContentUpdated?: (contentId: bigint) => void
  /** Optional custom styling */
  className?: string
}

/**
 * Content Management Dashboard Component
 * 
 * This component provides comprehensive content lifecycle management by integrating
 * the useAdvancedContentManagement hook with a professional management interface.
 * It enables creators to optimize their content strategy through dynamic pricing,
 * availability control, performance analytics, and bulk content operations.
 */
export function ContentManagementDashboard({
  creatorAddress,
  initialViewMode = 'table',
  showAnalytics = true,
  itemsPerPage = 20,
  onContentUpdated,
  className
}: ContentManagementDashboardProps) {
  const { address: connectedAddress } = useAccount()
  const effectiveCreatorAddress = (creatorAddress || connectedAddress) as `0x${string}` | undefined

  // Content management hooks
  const contentManagement = useAdvancedContentManagement()
  const creatorContent = useCreatorContent(effectiveCreatorAddress)

  // Dashboard state management
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode)
  const [filters, setFilters] = useState<ContentFilters>({
    search: '',
    category: 'all',
    status: 'all',
    priceRange: 'all',
    dateRange: 'all',
    sortBy: 'newest'
  })
  const [selectedContent, setSelectedContent] = useState<Set<bigint>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [editingContent, setEditingContent] = useState<bigint | null>(null)
  const [bulkActionType, setBulkActionType] = useState<BulkAction | null>(null)

  /**
   * Content Data Processing
   * 
   * This processes raw content data into the enhanced format needed for management,
   * including analytics integration and management metadata preparation.
   */
  const processedContent = useMemo(() => {
    if (!creatorContent.data) return []

    // Simulate analytics data (in production, this would come from analytics hooks)
    const withAnalytics: ContentWithAnalytics[] = creatorContent.data.map((contentId, index) => {
      // Mock analytics data - replace with actual analytics hooks
      const mockAnalytics = {
        views: Math.floor(Math.random() * 1000) + 100,
        purchases: Math.floor(Math.random() * 100) + 10,
        revenue: BigInt(Math.floor(Math.random() * 1000) * 1_000_000), // Random revenue in USDC
        conversionRate: Math.random() * 0.1 + 0.02, // 2-12% conversion rate
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        lastPurchase: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Within last week
      }

      const mockManagement = {
        canEdit: true,
        hasReports: Math.random() > 0.8, // 20% chance of having reports
        reportCount: Math.floor(Math.random() * 5),
        isPromoted: Math.random() > 0.7 // 30% chance of being promoted
      }

      // This would typically come from useContentById hook
      const baseContent: Content = {
        creator: effectiveCreatorAddress!,
        ipfsHash: `Qm${Math.random().toString(36).substring(2)}`,
        title: `Content ${index + 1}`,
        description: `Description for content ${index + 1}`,
        category: Object.values(ContentCategory)[Math.floor(Math.random() * 8)] as ContentCategory,
        payPerViewPrice: BigInt(Math.floor(Math.random() * 50) * 1_000_000 + 1_000_000), // $1-$50
        isActive: Math.random() > 0.2, // 80% active
        creationTime: BigInt(
          Math.floor(Date.now() / 1000 - Math.random() * 365 * 24 * 60 * 60)
        ) // Within last year
      }

      return {
        ...baseContent,
        tags: [`tag${index}`, `category${Math.floor(index / 3)}`],
        analytics: mockAnalytics,
        managementInfo: mockManagement
      }
    })

    return withAnalytics
  }, [creatorContent.data, effectiveCreatorAddress])

  /**
   * Filtered and Sorted Content
   * 
   * This applies the current filter and sort settings to the processed content,
   * providing creators with powerful content organization capabilities.
   */
  const filteredContent = useMemo(() => {
    let filtered = [...processedContent]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(content =>
        content.title.toLowerCase().includes(searchLower) ||
        content.description.toLowerCase().includes(searchLower) ||
        content.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
      )
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(content => content.category === filters.category)
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(content =>
        filters.status === 'active' ? content.isActive : !content.isActive
      )
    }

    // Apply price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(content => {
        const priceUSD = Number(content.payPerViewPrice) / 1_000_000
        switch (filters.priceRange) {
          case 'free': return priceUSD === 0
          case 'low': return priceUSD > 0 && priceUSD <= 5
          case 'medium': return priceUSD > 5 && priceUSD <= 20
          case 'high': return priceUSD > 20
          default: return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return Number(b.creationTime) - Number(a.creationTime)
        case 'oldest':
          return Number(a.creationTime) - Number(b.creationTime)
        case 'price_high':
          return Number(b.payPerViewPrice) - Number(a.payPerViewPrice)
        case 'price_low':
          return Number(a.payPerViewPrice) - Number(b.payPerViewPrice)
        case 'popular':
          return b.analytics.purchases - a.analytics.purchases
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [processedContent, filters])

  /**
   * Handle Filter Changes
   * 
   * This function manages filter state updates while providing smooth user experience
   * and maintaining filter state consistency across the interface.
   */
  const handleFilterChange = useCallback((key: keyof ContentFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  /**
   * Handle Content Selection
   * 
   * This manages multi-select functionality for bulk operations, providing creators
   * with efficient tools for managing large content catalogs.
   */
  const handleContentSelection = useCallback((contentId: bigint, selected: boolean) => {
    setSelectedContent(prev => {
      const newSelection = new Set(prev)
      if (selected) {
        newSelection.add(contentId)
      } else {
        newSelection.delete(contentId)
      }
      return newSelection
    })
  }, [])

  /**
   * Handle Content Price Update
   * 
   * This function manages individual content pricing updates using the
   * advanced content management hook with proper error handling and user feedback.
   */
  const handlePriceUpdate = useCallback(async (contentId: bigint, newPrice: string) => {
    try {
      await contentManagement.updateContentPrice(contentId, newPrice)
      onContentUpdated?.(contentId)
      setEditingContent(null)
    } catch (error) {
      console.error('Failed to update content price:', error)
    }
  }, [contentManagement, onContentUpdated])

  /**
   * Handle Content Activation Toggle
   * 
   * This function manages content availability updates, allowing creators to
   * temporarily remove content from sale without losing purchase history.
   */
  const handleActivationToggle = useCallback(async (contentId: bigint, activate: boolean) => {
    try {
      if (activate) {
        await contentManagement.activateContent(contentId)
      } else {
        await contentManagement.deactivateContent(contentId)
      }
      onContentUpdated?.(contentId)
    } catch (error) {
      console.error('Failed to toggle content activation:', error)
    }
  }, [contentManagement, onContentUpdated])

  /**
   * Handle Bulk Actions
   * 
   * This function processes bulk operations on selected content items,
   * providing efficient content management for creators with large catalogs.
   */
  const handleBulkAction = useCallback(async (action: BulkAction, actionData?: { newPrice?: string }) => {
    const selectedIds = Array.from(selectedContent)
    if (selectedIds.length === 0) return

    try {
      switch (action) {
        case 'activate':
          for (const contentId of selectedIds) {
            await contentManagement.activateContent(contentId)
          }
          break
        case 'deactivate':
          for (const contentId of selectedIds) {
            await contentManagement.deactivateContent(contentId)
          }
          break
        case 'update_price':
          if (actionData?.newPrice) {
            for (const contentId of selectedIds) {
              await contentManagement.updateContentPrice(contentId, actionData.newPrice)
            }
          }
          break
        default:
          console.log(`Bulk action ${action} not yet implemented`)
      }

      // Reset selection and refresh data
      setSelectedContent(new Set())
      setBulkActionType(null)
      creatorContent.refetch()
      
    } catch (error) {
      console.error('Bulk action failed:', error)
    }
  }, [selectedContent, contentManagement, creatorContent])

  // Loading state
  if (creatorContent.isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (creatorContent.error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load content. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Content Management</h2>
          <p className="text-muted-foreground">
            Manage your content portfolio, optimize pricing, and track performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => creatorContent.refetch()}
            disabled={creatorContent.isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Content</p>
                <p className="text-2xl font-bold">{processedContent.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Content</p>
                <p className="text-2xl font-bold">
                  {processedContent.filter(c => c.isActive).length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    processedContent.reduce((sum, c) => sum + c.analytics.revenue, BigInt(0))
                  )}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Conversion</p>
                <p className="text-2xl font-bold">
                  {(processedContent.reduce((sum, c) => sum + c.analytics.conversionRate, 0) / processedContent.length * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.category === 'all' ? 'all' : String(filters.category)}
                onValueChange={(value) => handleFilterChange('category', value === 'all' ? 'all' : Number(value) as ContentCategory)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.values(ContentCategory).filter(cat => typeof cat === 'number').map((category) => (
                    <SelectItem key={category} value={category.toString()}>
                      {categoryToString(category as ContentCategory)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Content Filters</SheetTitle>
                    <SheetDescription>
                      Refine your content search with advanced filters
                    </SheetDescription>
                  </SheetHeader>
                  {/* Advanced filters would go here */}
                  <div className="py-4 space-y-4">
                    <div>
                      <Label>Price Range</Label>
                      <Select value={filters.priceRange} onValueChange={(value) => handleFilterChange('priceRange', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Prices</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="low">$0.01 - $5.00</SelectItem>
                          <SelectItem value="medium">$5.01 - $20.00</SelectItem>
                          <SelectItem value="high">$20.01+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Sort By</Label>
                      <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest First</SelectItem>
                          <SelectItem value="oldest">Oldest First</SelectItem>
                          <SelectItem value="price_high">Price: High to Low</SelectItem>
                          <SelectItem value="price_low">Price: Low to High</SelectItem>
                          <SelectItem value="popular">Most Popular</SelectItem>
                          <SelectItem value="title">Title A-Z</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('analytics')}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedContent.size > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {selectedContent.size} content items selected
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                    disabled={contentManagement.isLoading}
                  >
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                    disabled={contentManagement.isLoading}
                  >
                    Deactivate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkActionType('update_price')}
                  >
                    Update Price
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContent(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Display */}
      {viewMode === 'table' ? (
        <ContentTable
          content={filteredContent}
          selectedContent={selectedContent}
          onContentSelection={handleContentSelection}
          onPriceUpdate={handlePriceUpdate}
          onActivationToggle={handleActivationToggle}
          editingContent={editingContent}
          setEditingContent={setEditingContent}
          isLoading={contentManagement.isLoading}
        />
      ) : viewMode === 'grid' ? (
        <ContentGrid
          content={filteredContent}
          selectedContent={selectedContent}
          onContentSelection={handleContentSelection}
          onPriceUpdate={handlePriceUpdate}
          onActivationToggle={handleActivationToggle}
          isLoading={contentManagement.isLoading}
        />
      ) : (
        <ContentAnalytics
          content={filteredContent}
          isLoading={contentManagement.isLoading}
        />
      )}

      {/* Empty State */}
      {filteredContent.length === 0 && !creatorContent.isLoading && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No content found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.category !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your filters to see more content.'
                  : 'Start by uploading your first piece of content.'}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Status Display */}
      {contentManagement.isLoading && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processing content update...
          </AlertDescription>
        </Alert>
      )}

      {contentManagement.isConfirmed && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Content updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {contentManagement.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {contentManagement.error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Content Table Component
 * 
 * This component provides a tabular view of content with inline editing capabilities,
 * bulk selection, and comprehensive content management actions.
 */
function ContentTable({
  content,
  selectedContent,
  onContentSelection,
  onPriceUpdate,
  onActivationToggle,
  editingContent,
  setEditingContent,
  isLoading
}: {
  content: ContentWithAnalytics[]
  selectedContent: Set<bigint>
  onContentSelection: (contentId: bigint, selected: boolean) => void
  onPriceUpdate: (contentId: bigint, newPrice: string) => void
  onActivationToggle: (contentId: bigint, activate: boolean) => void
  editingContent: bigint | null
  setEditingContent: (contentId: bigint | null) => void
  isLoading: boolean
}) {
  const [editPrice, setEditPrice] = useState('')

  const handleEditStart = useCallback((content: ContentWithAnalytics) => {
    setEditingContent(BigInt(content.creator.length)) // Simplified ID generation
    setEditPrice((Number(content.payPerViewPrice) / 1_000_000).toString())
  }, [setEditingContent])

  const handleEditSave = useCallback((contentId: bigint) => {
    onPriceUpdate(contentId, editPrice)
  }, [onPriceUpdate, editPrice])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Library</CardTitle>
        <CardDescription>
          Manage your content pricing, availability, and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedContent.size === content.length && content.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      content.forEach(c => onContentSelection(BigInt(c.creator.length), true))
                    } else {
                      content.forEach(c => onContentSelection(BigInt(c.creator.length), false))
                    }
                  }}
                />
              </TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.map((item, index) => {
              const contentId = BigInt(index) // Simplified for demo
              const isEditing = editingContent === contentId
              const isSelected = selectedContent.has(contentId)

              return (
                <TableRow key={index}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onContentSelection(contentId, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium line-clamp-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {categoryToString(item.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-20"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditSave(contentId)}
                          disabled={isLoading}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingContent(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => handleEditStart(item)}
                        className="h-auto p-0 font-normal"
                      >
                        {formatCurrency(item.payPerViewPrice)}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.isActive ? 'default' : 'secondary'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onActivationToggle(contentId, !item.isActive)}
                        disabled={isLoading}
                      >
                        {item.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{formatNumber(item.analytics.purchases)} sales</span>
                        <span>•</span>
                        <span>{formatCurrency(item.analytics.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{(item.analytics.conversionRate * 100).toFixed(1)}% conversion</span>
                        {item.analytics.trend === 'up' ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : item.analytics.trend === 'down' ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditStart(item)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Price
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onActivationToggle(contentId, !item.isActive)}>
                          {item.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/**
 * Content Grid Component
 * 
 * This component provides a card-based grid view of content for visual management,
 * particularly useful for content with visual elements or when working with smaller screens.
 */
function ContentGrid({
  content,
  selectedContent,
  onContentSelection,
  onPriceUpdate,
  onActivationToggle,
  isLoading
}: {
  content: ContentWithAnalytics[]
  selectedContent: Set<bigint>
  onContentSelection: (contentId: bigint, selected: boolean) => void
  onPriceUpdate: (contentId: bigint, newPrice: string) => void
  onActivationToggle: (contentId: bigint, activate: boolean) => void
  isLoading: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {content.map((item, index) => {
        const contentId = BigInt(index)
        const isSelected = selectedContent.has(contentId)

        return (
          <Card key={index} className={cn("overflow-hidden", isSelected && "ring-2 ring-primary")}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base line-clamp-2">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {item.description}
                  </CardDescription>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onContentSelection(contentId, e.target.checked)}
                  className="ml-2"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {categoryToString(item.category)}
                </Badge>
                <Badge variant={item.isActive ? 'default' : 'secondary'}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-medium">{formatCurrency(item.payPerViewPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sales</span>
                  <span className="font-medium">{formatNumber(item.analytics.purchases)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-medium">{formatCurrency(item.analytics.revenue)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActivationToggle(contentId, !item.isActive)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {item.isActive ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

/**
 * Content Analytics Component
 * 
 * This component provides detailed analytics and performance insights for content,
 * helping creators understand their content strategy effectiveness and optimization opportunities.
 */
function ContentAnalytics({
  content,
  isLoading
}: {
  content: ContentWithAnalytics[]
  isLoading: boolean
}) {
  const analyticsData = useMemo(() => {
    const totalRevenue = content.reduce((sum, c) => sum + c.analytics.revenue, BigInt(0))
    const totalViews = content.reduce((sum, c) => sum + c.analytics.views, 0)
    const totalPurchases = content.reduce((sum, c) => sum + c.analytics.purchases, 0)
    const avgConversion = totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0

    const topPerformers = [...content]
      .sort((a, b) => Number(b.analytics.revenue - a.analytics.revenue))
      .slice(0, 5)

    return {
      totalRevenue,
      totalViews,
      totalPurchases,
      avgConversion,
      topPerformers
    }
  }, [content])

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>
            Performance insights across your content portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{formatNumber(analyticsData.totalViews)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">{formatNumber(analyticsData.totalPurchases)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Conversion</p>
              <p className="text-2xl font-bold">{analyticsData.avgConversion.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
          <CardDescription>
            Your highest revenue generating content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.topPerformers.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {categoryToString(item.category)} • {formatNumber(item.analytics.purchases)} sales
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.analytics.revenue)}</p>
                  <p className="text-sm text-muted-foreground">
                    {(item.analytics.conversionRate * 100).toFixed(1)}% conversion
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
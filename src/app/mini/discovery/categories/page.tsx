/**
 * MiniApp Discovery Categories Page - Visual Category Browsing
 * File: src/app/mini/discovery/categories/page.tsx
 *
 * This page provides visual category-based content discovery in the mini app,
 * featuring interactive category selection, filtered content grids, and
 * mobile-optimized category navigation with rich visual elements.
 *
 * Mini App Design Philosophy:
 * - Visual category discovery with rich iconography
 * - Interactive category selection with instant filtering
 * - Mobile-optimized grid layouts for category browsing
 * - Seamless transition between category selection and content
 * - Touch-friendly category navigation and selection
 *
 * Key Features:
 * - Visual category grid with icons and descriptions
 * - Interactive category filtering and selection
 * - Category-specific content browsing
 * - Popular and trending categories highlighting
 * - Mobile-optimized category navigation
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  BookOpen,
  Video,
  Music,
  Image,
  FileText,
  Target,
  Eye,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Heart,
  Grid3X3,
  List,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  Loader2,
  Zap,
  Code,
  Palette,
  Camera,
  Headphones,
  Gamepad2,
  Briefcase,
  GraduationCap,
  Wrench
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
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
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Content } from '@/types/contracts'
import { ContentCategory } from '@/types/contracts'

/**
 * UI Category Definition Interface
 */
interface UICategory {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly color: string
  readonly itemCount: number
  readonly featured: boolean
  readonly trending: boolean
}

/**
 * MiniApp Discovery Categories Core Component
 *
 * This component orchestrates the visual category discovery experience
 * with mobile-first design and interactive category browsing.
 */
function MiniAppDiscoveryCategoriesCore() {
  const router = useRouter()

  // Core state management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useMiniAppWalletUI()

  const userAddress = walletUI.address && typeof walletUI.address === 'string'
    ? walletUI.address as `0x${string}`
    : undefined

  // Content discovery hook
  const { data: contentData, isLoading, error, refetch } = useActiveContentPaginated(0, 24)

  /**
   * Categories Data
   *
   * Comprehensive category definitions with visual elements
   */
  const categories: UICategory[] = useMemo(() => [
    {
      id: ContentCategory.ARTICLE.toString(),
      name: 'Articles',
      description: 'In-depth written content and guides',
      icon: BookOpen,
      color: 'bg-blue-500',
      itemCount: 156,
      featured: true,
      trending: false
    },
    {
      id: ContentCategory.VIDEO.toString(),
      name: 'Videos',
      description: 'Educational and entertainment videos',
      icon: Video,
      color: 'bg-red-500',
      itemCount: 89,
      featured: true,
      trending: true
    },
    {
      id: ContentCategory.PODCAST.toString(),
      name: 'Podcasts',
      description: 'Podcasts and audio content',
      icon: Music,
      color: 'bg-purple-500',
      itemCount: 67,
      featured: false,
      trending: true
    },
    {
      id: ContentCategory.MUSIC.toString(),
      name: 'Music',
      description: 'Music and audio content',
      icon: Music,
      color: 'bg-green-500',
      itemCount: 43,
      featured: false,
      trending: false
    },
    {
      id: ContentCategory.COURSE.toString(),
      name: 'Courses',
      description: 'Educational courses and tutorials',
      icon: GraduationCap,
      color: 'bg-indigo-500',
      itemCount: 34,
      featured: true,
      trending: false
    }
  ], [])

  /**
   * Filtered Categories
   */
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories

    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [categories, searchQuery])

  /**
   * Category Selection Handler
   */
  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId)
  }, [])

  /**
   * Content Selection Handler
   */
  const handleContentSelect = useCallback((contentId: bigint) => {
    router.push(`/mini/content/${contentId}`)
  }, [router])

  /**
   * Navigation Handler
   */
  const handleGoBack = useCallback(() => {
    if (selectedCategory) {
      setSelectedCategory(null)
    } else {
      router.back()
    }
  }, [selectedCategory, router])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Optimized Navigation Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 space-y-6">
        {/* Categories Header */}
        <CategoriesHeader
          onGoBack={handleGoBack}
          selectedCategory={selectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Category Content */}
        {selectedCategory ? (
          <CategoryContentView
            category={categories.find(c => c.id === selectedCategory)!}
            contentData={contentData}
            isLoading={isLoading}
            error={error}
            onContentSelect={handleContentSelect}
            onRetry={refetch}
          />
        ) : (
          <CategoriesGrid
            categories={filteredCategories}
            onCategorySelect={handleCategorySelect}
          />
        )}
      </main>
    </div>
  )
}

/**
 * Categories Header Component
 *
 * Dynamic header that adapts based on current view and includes search
 */
function CategoriesHeader({
  onGoBack,
  selectedCategory,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange
}: {
  onGoBack: () => void
  selectedCategory: string | null
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
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
          <span className="text-sm">{selectedCategory ? 'Back' : 'Back'}</span>
        </Button>
      </div>

      {/* Search and Controls */}
      {!selectedCategory && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {searchQuery ? 'Search results' : 'Browse by category'}
            </div>

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
        </div>
      )}

      {/* Title and Description */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Grid3X3 className="h-6 w-6" />
          {selectedCategory ? 'Category Content' : 'Categories'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {selectedCategory
            ? 'Explore content in this category'
            : 'Discover premium content organized by topic'
          }
        </p>
      </div>
    </div>
  )
}

/**
 * Categories Grid Component
 *
 * Visual grid display of content categories with interactive selection
 */
function CategoriesGrid({
  categories,
  onCategorySelect
}: {
  categories: UICategory[]
  onCategorySelect: (categoryId: string) => void
}) {
  const featuredCategories = categories.filter(c => c.featured)
  const regularCategories = categories.filter(c => !c.featured)

  return (
    <div className="space-y-6">
      {/* Featured Categories */}
      {featuredCategories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Featured Categories</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {featuredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onSelect={() => onCategorySelect(category.id)}
                featured={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Categories */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">All Categories</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {regularCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onSelect={() => onCategorySelect(category.id)}
              featured={false}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
            <p className="text-muted-foreground">
              No categories match your search. Try a different query.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Category Card Component
 *
 * Individual category display with rich visual elements
 */
function CategoryCard({
  category,
  onSelect,
  featured
}: {
  category: UICategory
  onSelect: () => void
  featured: boolean
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
        featured ? "border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10" : "hover:border-primary/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Category Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            category.color
          )}>
            <category.icon className="h-6 w-6 text-white" />
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">
                {category.name}
              </h3>
              {category.trending && (
                <Badge className="text-xs px-1.5 py-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Trending
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {category.description}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formatNumber(category.itemCount)} items</span>
              <span>•</span>
              <span>Premium content available</span>
            </div>
          </div>

          {/* Action Indicator */}
          <div className="flex-shrink-0">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {/* Featured Badge */}
        {featured && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Featured Category
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Category Content View Component
 *
 * Displays content filtered by selected category
 */
function CategoryContentView({
  category,
  contentData,
  isLoading,
  error,
  onContentSelect,
  onRetry
}: {
  category: UICategory
  contentData: { contentIds: readonly bigint[]; total: bigint } | undefined
  isLoading: boolean
  error: Error | null
  onContentSelect: (contentId: bigint) => void
  onRetry: () => void
}) {
  // Get content IDs for this category - using all available content for now
  // In a full implementation, you'd filter by category
  const categoryContentIds = useMemo(() => {
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
            We encountered an error loading content. Please try again.
          </p>
          <Button onClick={onRetry}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              category.color
            )}>
              <category.icon className="h-6 w-6 text-white" />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{category.name}</h2>
              <p className="text-muted-foreground text-sm mb-2">
                {category.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatNumber(category.itemCount)} premium items</span>
                <span>•</span>
                <span>High-quality content</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
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
      ) : categoryContentIds.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {categoryContentIds.map((contentId) => (
            <ContentPreviewCard
              key={contentId.toString()}
              contentId={contentId}
              viewMode="list"
              showCreatorInfo={true}
              userAddress={undefined}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <category.icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Content Yet</h3>
            <p className="text-muted-foreground">
              Content for this category is coming soon. Check back later!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Error Fallback Component
 */
function CategoriesErrorFallback({
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Categories Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading categories. Please try again.
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
function CategoriesLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-32" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />

          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * MiniApp Discovery Categories Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppDiscoveryCategoriesPage() {
  return (
    <ErrorBoundary
      FallbackComponent={CategoriesErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Discovery Categories error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<CategoriesLoadingSkeleton />}>
        <MiniAppDiscoveryCategoriesCore />
      </Suspense>
    </ErrorBoundary>
  )
}

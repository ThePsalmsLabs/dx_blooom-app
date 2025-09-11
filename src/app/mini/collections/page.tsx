/**
 * MiniApp Collections Page - Curated Content Discovery Hub
 * File: src/app/mini/collections/page.tsx
 *
 * This page serves as a curated content discovery experience in the mini app,
 * featuring hand-picked collections that showcase premium content in thematic
 * groupings optimized for mobile social commerce and discovery.
 *
 * Mini App Design Philosophy:
 * - Curated discovery experience with social proof
 * - Thematic content groupings for easy browsing
 * - Mobile-optimized collection cards with rich previews
 * - Social features integrated into collection discovery
 * - Instant purchase flows from collection browsing
 *
 * Key Features:
 * - Featured collections with rich previews
 * - Collection categories and themes
 * - Social proof and popularity indicators
 * - Seamless content discovery to purchase flow
 * - Mobile-optimized collection browsing
 * - Creator spotlight within collections
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  Star,
  Heart,
  Share2,
  TrendingUp,
  Users,
  Clock,
  Play,
  BookOpen,
  Image,
  Music,
  Video,
  Eye,
  DollarSign,
  Crown,
  Sparkles,
  Grid3X3,
  List,
  Filter,
  Search,
  ChevronRight,
  AlertCircle,
  Loader2,
  Zap,
  Target,
  Award,
  ThumbsUp,
  FileText
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  AvatarFallback
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'

// Import your existing sophisticated components
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'

// Import utilities
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils'

/**
 * Collection Category Types
 */
type CollectionCategory = 'featured' | 'trending' | 'new' | 'premium' | 'creator'

/**
 * MiniApp Collections Core Component
 *
 * This component orchestrates the curated content discovery experience
 * with mobile-first design and social commerce integration.
 */
function MiniAppCollectionsCore() {
  const router = useRouter()

  // Core state management
  const [activeCategory, setActiveCategory] = useState<CollectionCategory>('featured')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useMiniAppWalletUI()

  const userAddress = walletUI.address && typeof walletUI.address === 'string'
    ? walletUI.address as `0x${string}`
    : undefined

  /**
   * Category Change Handler
   */
  const handleCategoryChange = useCallback((category: CollectionCategory) => {
    setActiveCategory(category)
  }, [])

  /**
   * Collection Selection Handler
   */
  const handleCollectionSelect = useCallback((collectionId: string) => {
    setSelectedCollection(collectionId)
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
    if (selectedCollection) {
      setSelectedCollection(null)
    } else {
      router.back()
    }
  }, [selectedCollection, router])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Optimized Navigation Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 space-y-6">
        {/* Collections Header */}
        <CollectionsHeader
          onGoBack={handleGoBack}
          selectedCollection={selectedCollection}
        />

        {/* Collection Content */}
        {selectedCollection ? (
          <CollectionDetailView
            collectionId={selectedCollection}
            onContentSelect={handleContentSelect}
            onBack={() => setSelectedCollection(null)}
          />
        ) : (
          <CollectionsGrid
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            onCollectionSelect={handleCollectionSelect}
          />
        )}
      </main>
    </div>
  )
}

/**
 * Collections Header Component
 *
 * Dynamic header that adapts based on current view
 */
function CollectionsHeader({
  onGoBack,
  selectedCollection
}: {
  onGoBack: () => void
  selectedCollection: string | null
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
          <span className="text-sm">{selectedCollection ? 'Back' : 'Back'}</span>
        </Button>
      </div>

      {/* Title and Description */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6" />
          {selectedCollection ? 'Collection' : 'Collections'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {selectedCollection
            ? 'Discover curated content in this collection'
            : 'Explore hand-picked collections of premium content'
          }
        </p>
      </div>
    </div>
  )
}

/**
 * Collections Grid Component
 *
 * Main collections browsing interface with category tabs
 */
function CollectionsGrid({
  activeCategory,
  onCategoryChange,
  onCollectionSelect
}: {
  activeCategory: CollectionCategory
  onCategoryChange: (category: CollectionCategory) => void
  onCollectionSelect: (collectionId: string) => void
}) {
  const categories = [
    { id: 'featured' as CollectionCategory, label: 'Featured', icon: Star },
    { id: 'trending' as CollectionCategory, label: 'Trending', icon: TrendingUp },
    { id: 'new' as CollectionCategory, label: 'New', icon: Zap },
    { id: 'premium' as CollectionCategory, label: 'Premium', icon: Crown },
    { id: 'creator' as CollectionCategory, label: 'Creators', icon: Users }
  ]

  // TODO: Fetch real collections data from collections contract
  // const collections = useCollections(userAddress, activeCategory)

  // Temporary mock data for development
  const collections = [
    {
      id: 'featured-1',
      title: 'Web3 Writing Essentials',
      description: 'Master the art of Web3 content creation with these essential guides',
      coverImage: '/api/placeholder/400/200',
      itemCount: 12,
      totalValue: BigInt(45000000), // 45 USDC
      curator: 'Bloom Team',
      likes: 245,
      category: 'featured' as CollectionCategory,
      featured: true
    },
    {
      id: 'trending-1',
      title: 'DeFi Deep Dives',
      description: 'Comprehensive analysis of decentralized finance protocols',
      coverImage: '/api/placeholder/400/200',
      itemCount: 8,
      totalValue: BigInt(32000000), // 32 USDC
      curator: 'DeFi Expert',
      likes: 189,
      category: 'trending' as CollectionCategory,
      featured: false
    },
    {
      id: 'new-1',
      title: 'NFT Creator Toolkit',
      description: 'Everything you need to start creating and selling NFTs',
      coverImage: '/api/placeholder/400/200',
      itemCount: 15,
      totalValue: BigInt(55000000), // 55 USDC
      curator: 'NFT Artist',
      likes: 156,
      category: 'new' as CollectionCategory,
      featured: false
    },
    {
      id: 'premium-1',
      title: 'Advanced Smart Contracts',
      description: 'Professional-grade smart contract development guides',
      coverImage: '/api/placeholder/400/200',
      itemCount: 6,
      totalValue: BigInt(120000000), // 120 USDC
      curator: 'Blockchain Dev',
      likes: 98,
      category: 'premium' as CollectionCategory,
      featured: true
    }
  ]

  const filteredCollections = collections.filter(collection =>
    activeCategory === 'featured' ? collection.featured : collection.category === activeCategory
  )

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(value) => onCategoryChange(value as CollectionCategory)}>
        <TabsList className="grid grid-cols-5 gap-1 mb-4">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-xs flex items-center gap-1"
            >
              <category.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{category.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Collections Content */}
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid gap-4">
              {filteredCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onSelect={() => onCollectionSelect(collection.id)}
                />
              ))}
            </div>

            {filteredCollections.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Collections Yet</h3>
                  <p className="text-muted-foreground">
                    Check back soon for new {category.label.toLowerCase()} collections!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

/**
 * Collection Card Component
 *
 * Individual collection display with rich preview
 */
interface CollectionData {
  id: string
  title: string
  description: string
  coverImage: string
  itemCount: number
  totalValue: bigint
  curator: string
  likes: number
  category: CollectionCategory
  featured: boolean
}

function CollectionCard({
  collection,
  onSelect
}: {
  collection: CollectionData
  onSelect: () => void
}) {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md border-2 hover:border-primary/50"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Collection Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">
                {collection.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {collection.description}
              </p>
            </div>

            {collection.featured && (
              <Badge className="ml-2 flex-shrink-0">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>

          {/* Collection Preview Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center"
              >
                <div className="text-xs text-primary font-medium">{i}</div>
              </div>
            ))}
          </div>

          {/* Collection Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{collection.itemCount} items</span>
              </div>

              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{formatCurrency(BigInt(collection.totalValue), 2, 'USDC')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span>{collection.likes}</span>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Curator Info */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {collection.curator.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              Curated by {collection.curator}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Collection Detail View Component
 *
 * Detailed view of a selected collection with content items
 */
function CollectionDetailView({
  collectionId,
  onContentSelect,
  onBack
}: {
  collectionId: string
  onContentSelect: (contentId: bigint) => void
  onBack: () => void
}) {
  // TODO: Fetch real collection detail data from collections contract
  // const collectionDetail = useCollectionDetail(collectionId, userAddress)

  // Temporary mock data for development
  const collectionDetail = {
    id: collectionId,
    title: 'Web3 Writing Essentials',
    description: 'Master the art of Web3 content creation with these essential guides and tutorials.',
    curator: 'Bloom Team',
    itemCount: 12,
    totalValue: BigInt(45000000), // TODO: Fetch from contract
    likes: 245, // TODO: Fetch from contract
    followers: 1234, // TODO: Fetch from contract
    lastUpdated: BigInt(Math.floor(Date.now() / 1000)), // TODO: Fetch from contract
    tags: ['Web3', 'Writing', 'Content Creation', 'Blockchain'],
    content: [
      // TODO: Fetch real content from collection contract
      // const collectionContent = useCollectionContent(collectionId)
      {
        id: BigInt(1),
        title: 'Introduction to Web3 Writing',
        description: 'Learn the fundamentals of creating content for the decentralized web.',
        price: BigInt(5000000), // TODO: Fetch from contract
        category: 'Article',
        author: 'Content Expert',
        views: 245, // TODO: Fetch from analytics
        likes: 89 // TODO: Fetch from contract
      },
      {
        id: BigInt(2),
        title: 'Blockchain Storytelling Techniques',
        description: 'Master the art of storytelling in the context of blockchain technology.',
        price: BigInt(7500000), // TODO: Fetch from contract
        category: 'Video',
        author: 'Storyteller',
        views: 189, // TODO: Fetch from analytics
        likes: 67 // TODO: Fetch from contract
      },
      {
        id: BigInt(3),
        title: 'Crypto Content Monetization',
        description: 'Strategies for monetizing your Web3 content effectively.',
        price: BigInt(10000000), // TODO: Fetch from contract
        category: 'Course',
        author: 'Monetization Guru',
        views: 156, // TODO: Fetch from analytics
        likes: 94 // TODO: Fetch from contract
      }
    ]
  }

  return (
    <div className="space-y-6">
      {/* Collection Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{collectionDetail.title}</h2>
                <p className="text-muted-foreground text-sm mb-3">
                  {collectionDetail.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {collectionDetail.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </div>

            {/* Collection Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">{collectionDetail.itemCount}</div>
                <div className="text-xs text-muted-foreground">Items</div>
              </div>
              <div>
                <div className="text-lg font-bold">{formatCurrency(collectionDetail.totalValue, 2, 'USDC')}</div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </div>
            </div>

            {/* Curator Info */}
            <div className="flex items-center gap-2 pt-3 border-t">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {collectionDetail.curator.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-sm">{collectionDetail.curator}</div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(collectionDetail.followers)} followers • Updated {formatRelativeTime(collectionDetail.lastUpdated)}
                </div>
              </div>
              <Button variant="outline" size="sm">
                Follow
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Content */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Collection Content</h3>

        {collectionDetail.content.map((content) => (
          <Card
            key={content.id.toString()}
            className="cursor-pointer transition-all duration-200 hover:shadow-md"
            onClick={() => onContentSelect(content.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  {content.category === 'Article' && <BookOpen className="h-5 w-5 text-primary" />}
                  {content.category === 'Video' && <Video className="h-5 w-5 text-primary" />}
                  {content.category === 'Course' && <Target className="h-5 w-5 text-primary" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium mb-1 truncate">{content.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {content.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{content.author}</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{content.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span>{content.likes}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-medium text-sm mb-1">
                    {formatCurrency(content.price, 2, 'USDC')}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {content.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Error Fallback Component
 */
function CollectionsErrorFallback({
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
              Collections Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading collections. Please try again.
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
function CollectionsLoadingSkeleton() {
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
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>

        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1" />
          ))}
        </div>

        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="aspect-square w-full" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-1/2" />
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
 * MiniApp Collections Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppCollectionsPage() {
  return (
    <ErrorBoundary
      FallbackComponent={CollectionsErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Collections error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<CollectionsLoadingSkeleton />}>
        <MiniAppCollectionsCore />
      </Suspense>
    </ErrorBoundary>
  )
}

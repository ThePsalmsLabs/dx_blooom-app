/**
 * MiniApp User Portfolio Page - Personal Content Library & Achievements
 * File: src/app/mini/portfolio/page.tsx
 *
 * This page serves as the user's personal content hub in the mini app,
 * showcasing their purchased content library, reading achievements, and
 * personalized content recommendations based on their interests and history.
 *
 * Mini App Design Philosophy:
 * - Personal content library with easy access and organization
 * - Achievement system to encourage continued engagement
 * - Reading progress tracking and history
 * - Personalized recommendations based on user behavior
 * - Social sharing of achievements and reading milestones
 *
 * Key Features:
 * - Purchased content library with quick access
 * - Reading progress and bookmarks management
 * - Achievement system with badges and milestones
 * - Personal reading statistics and insights
 * - Content organization and categorization
 * - Social sharing of reading achievements
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  BookOpen,
  Trophy,
  TrendingUp,
  Heart,
  Bookmark,
  Clock,
  Eye,
  DollarSign,
  Star,
  Share2,
  Grid3X3,
  List,
  Filter,
  Search,
  Calendar,
  Target,
  Zap,
  Crown,
  Award,
  Medal,
  Flame,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  MoreVertical,
  Download,
  ExternalLink,
  BarChart3
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
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'

// Import your existing sophisticated components
import { AdaptiveNavigation } from '@/components/layout/AdaptiveNavigation'

// Import utilities
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils'

/**
 * Portfolio Tab Types
 */
type PortfolioTab = 'library' | 'achievements' | 'activity' | 'stats'

/**
 * Content Status Types
 */
type ContentStatus = 'reading' | 'completed' | 'bookmarked' | 'purchased'

/**
 * MiniApp User Portfolio Core Component
 *
 * This component orchestrates the complete user portfolio experience
 * with mobile-first design and comprehensive personal content management.
 */
function MiniAppUserPortfolioCore() {
  const router = useRouter()

  // Core state management
  const [activeTab, setActiveTab] = useState<PortfolioTab>('library')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useMiniAppWalletUI()

  const userAddress = walletUI.address && typeof walletUI.address === 'string'
    ? walletUI.address as `0x${string}`
    : undefined

  /**
   * Mock User Portfolio Data
   *
   * In a real implementation, this would come from user data APIs
   */
  const portfolioData = useMemo(() => ({
    purchasedContent: [
      {
        id: BigInt(1),
        title: 'Web3 Content Creation Guide',
        creator: 'Content Expert',
        price: 5000000,
        category: 'Guide',
        purchaseDate: BigInt(Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)),
        progress: 75,
        lastRead: BigInt(Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000)),
        isBookmarked: true,
        rating: 5
      },
      {
        id: BigInt(2),
        title: 'DeFi Fundamentals Course',
        creator: 'Finance Guru',
        price: 15000000,
        category: 'Course',
        purchaseDate: BigInt(Math.floor((Date.now() - 14 * 24 * 60 * 60 * 1000) / 1000)),
        progress: 30,
        lastRead: BigInt(Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000)),
        isBookmarked: false,
        rating: 4
      },
      {
        id: BigInt(3),
        title: 'Smart Contract Security',
        creator: 'Blockchain Dev',
        price: 8000000,
        category: 'Tutorial',
        purchaseDate: BigInt(Math.floor((Date.now() - 21 * 24 * 60 * 60 * 1000) / 1000)),
        progress: 100,
        lastRead: BigInt(Math.floor((Date.now() - 1 * 24 * 60 * 60 * 1000) / 1000)),
        isBookmarked: true,
        rating: 5
      }
    ],
    achievements: [
      {
        id: 'first-purchase',
        title: 'First Purchase',
        description: 'Made your first content purchase',
        icon: '🎉',
        unlockedAt: BigInt(Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)),
        rarity: 'common'
      },
      {
        id: 'content-consumer',
        title: 'Content Consumer',
        description: 'Purchased 10+ pieces of content',
        icon: '📚',
        unlockedAt: BigInt(Math.floor((Date.now() - 15 * 24 * 60 * 60 * 1000) / 1000)),
        rarity: 'uncommon'
      },
      {
        id: 'knowledge-seeker',
        title: 'Knowledge Seeker',
        description: 'Completed 5 courses',
        icon: '🎓',
        unlockedAt: BigInt(Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)),
        rarity: 'rare'
      },
      {
        id: 'supporter',
        title: 'Creator Supporter',
        description: 'Supported 3 different creators',
        icon: '❤️',
        unlockedAt: BigInt(Math.floor((Date.now() - 3 * 24 * 60 * 60 * 1000) / 1000)),
        rarity: 'epic'
      }
    ],
    stats: {
      totalPurchases: 15,
      totalSpent: 125000000, // 125 USDC
      contentCompleted: 8,
      averageRating: 4.6,
      readingStreak: 12,
      totalReadingTime: 45 // hours
    }
  }), [])

  /**
   * Filtered Content
   */
  const filteredContent = useMemo(() => {
    let filtered = portfolioData.purchasedContent

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(content =>
        content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.creator.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(content => {
        switch (selectedStatus) {
          case 'reading':
            return content.progress > 0 && content.progress < 100
          case 'completed':
            return content.progress === 100
          case 'bookmarked':
            return content.isBookmarked
          case 'purchased':
            return true
          default:
            return true
        }
      })
    }

    return filtered
  }, [portfolioData.purchasedContent, searchQuery, selectedStatus])

  /**
   * Tab Change Handler
   */
  const handleTabChange = useCallback((tab: PortfolioTab) => {
    setActiveTab(tab)
  }, [])

  /**
   * Content Selection Handler
   */
  const handleContentSelect = useCallback((contentId: bigint) => {
    router.push(`/mini/content/${contentId}/view`)
  }, [router])

  /**
   * Navigation Handler
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

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
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Connect your wallet to view your portfolio
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
        {/* Portfolio Header */}
        <PortfolioHeader
          onGoBack={handleGoBack}
          stats={portfolioData.stats}
        />

        {/* Portfolio Tabs */}
        <PortfolioTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />

        {/* Tab Content */}
        <PortfolioTabContent
          activeTab={activeTab}
          portfolioData={portfolioData}
          filteredContent={filteredContent}
          viewMode={viewMode}
          onContentSelect={handleContentSelect}
        />
      </main>
    </div>
  )
}

/**
 * Portfolio Header Component
 *
 * Overview header with key portfolio statistics
 */
function PortfolioHeader({
  onGoBack,
  stats
}: {
  onGoBack: () => void
  stats: any
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

      {/* Header Content */}
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6" />
            My Portfolio
          </h1>
          <p className="text-muted-foreground text-sm">
            Your personal content library and achievements
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {formatNumber(stats.totalPurchases)}
              </div>
              <div className="text-xs text-muted-foreground">Total Purchases</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(BigInt(stats.totalSpent), 2, 'USDC')}
              </div>
              <div className="text-xs text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

/**
 * Portfolio Tabs Component
 *
 * Tabbed interface for different portfolio sections
 */
function PortfolioTabs({
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange
}: {
  activeTab: PortfolioTab
  onTabChange: (tab: PortfolioTab) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedStatus: ContentStatus | 'all'
  onStatusChange: (status: ContentStatus | 'all') => void
}) {
  const tabs = [
    { id: 'library' as PortfolioTab, label: 'Library', icon: BookOpen },
    { id: 'achievements' as PortfolioTab, label: 'Achievements', icon: Trophy },
    { id: 'activity' as PortfolioTab, label: 'Activity', icon: TrendingUp },
    { id: 'stats' as PortfolioTab, label: 'Stats', icon: BarChart3 }
  ]

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as PortfolioTab)}>
        <TabsList className="grid grid-cols-4 gap-1 mb-4">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="text-xs flex items-center gap-1"
            >
              <tab.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Library Tab Controls */}
        {activeTab === 'library' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { value: 'all' as const, label: 'All' },
                  { value: 'reading' as ContentStatus, label: 'Reading' },
                  { value: 'completed' as ContentStatus, label: 'Completed' },
                  { value: 'bookmarked' as ContentStatus, label: 'Bookmarked' }
                ].map((status) => (
                  <Button
                    key={status.value}
                    variant={selectedStatus === status.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => onStatusChange(status.value)}
                    className="text-xs flex-shrink-0"
                  >
                    {status.label}
                  </Button>
                ))}
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
      </Tabs>
    </div>
  )
}

/**
 * Portfolio Tab Content Component
 *
 * Content for each portfolio tab
 */
function PortfolioTabContent({
  activeTab,
  portfolioData,
  filteredContent,
  viewMode,
  onContentSelect
}: {
  activeTab: PortfolioTab
  portfolioData: any
  filteredContent: any[]
  viewMode: 'grid' | 'list'
  onContentSelect: (contentId: bigint) => void
}) {
  switch (activeTab) {
    case 'library':
      return (
        <LibraryTab
          content={filteredContent}
          viewMode={viewMode}
          onContentSelect={onContentSelect}
        />
      )
    case 'achievements':
      return (
        <AchievementsTab achievements={portfolioData.achievements} />
      )
    case 'activity':
      return (
        <ActivityTab content={portfolioData.purchasedContent} />
      )
    case 'stats':
      return (
        <StatsTab stats={portfolioData.stats} />
      )
    default:
      return null
  }
}

/**
 * Library Tab Component
 *
 * User's purchased content library
 */
function LibraryTab({
  content,
  viewMode,
  onContentSelect
}: {
  content: any[]
  viewMode: 'grid' | 'list'
  onContentSelect: (contentId: bigint) => void
}) {
  if (content.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
          <p className="text-muted-foreground mb-4">
            You haven't purchased any content yet. Start exploring and building your library!
          </p>
          <Button onClick={() => window.location.href = '/mini/discovery'}>
            Discover Content
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn(
      "grid gap-4",
      viewMode === 'grid' ? "grid-cols-1" : "grid-cols-1"
    )}>
      {content.map((item) => (
        <LibraryContentCard
          key={item.id.toString()}
          content={item}
          onSelect={() => onContentSelect(item.id)}
        />
      ))}
    </div>
  )
}

/**
 * Library Content Card Component
 *
 * Individual content item in the library
 */
function LibraryContentCard({
  content,
  onSelect
}: {
  content: any
  onSelect: () => void
}) {
  return (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-md" onClick={onSelect}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Content Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium mb-1 line-clamp-2">{content.title}</h3>
              <p className="text-xs text-muted-foreground">by {content.creator}</p>
            </div>

            <div className="flex items-center gap-1 ml-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < content.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Reading Progress</span>
              <span>{content.progress}%</span>
            </div>
            <Progress value={content.progress} className="h-2" />
          </div>

          {/* Content Metadata */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                {content.category}
              </Badge>
              <span className="text-muted-foreground">
                {formatRelativeTime(content.lastRead)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {content.isBookmarked && (
                <Bookmark className="h-4 w-4 text-blue-500 fill-current" />
              )}
              <span className="font-medium">
                {formatCurrency(BigInt(content.price), 2, 'USDC')}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Achievements Tab Component
 *
 * User's achievements and badges
 */
function AchievementsTab({ achievements }: { achievements: any[] }) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-200 bg-gray-50'
      case 'uncommon':
        return 'border-green-200 bg-green-50'
      case 'rare':
        return 'border-blue-200 bg-blue-50'
      case 'epic':
        return 'border-purple-200 bg-purple-50'
      case 'legendary':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className={cn("border-2", getRarityColor(achievement.rarity))}>
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <h3 className="font-medium text-sm mb-1">{achievement.title}</h3>
              <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
              <div className="text-xs text-muted-foreground">
                {formatRelativeTime(achievement.unlockedAt)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievement Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Achievement Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Content Collector</span>
                <span>8/10</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Knowledge Seeker</span>
                <span>5/10</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Creator Supporter</span>
                <span>3/5</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Activity Tab Component
 *
 * User's recent activity and reading history
 */
function ActivityTab({ content }: { content: any[] }) {
  const activities = [
    {
      type: 'purchase',
      title: 'Purchased new content',
      description: 'Web3 Content Creation Guide',
      timestamp: BigInt(Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000)),
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      type: 'completed',
      title: 'Completed content',
      description: 'Smart Contract Security',
      timestamp: BigInt(Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000)),
      icon: CheckCircle,
      color: 'text-blue-600'
    },
    {
      type: 'bookmark',
      title: 'Bookmarked content',
      description: 'DeFi Fundamentals Course',
      timestamp: BigInt(Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)),
      icon: Bookmark,
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                activity.color.replace('text-', 'bg-') + '/10'
              )}>
                <activity.icon className={cn("h-4 w-4", activity.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{activity.title}</h4>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Stats Tab Component
 *
 * Comprehensive reading and engagement statistics
 */
function StatsTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {formatNumber(stats.totalPurchases)}
            </div>
            <div className="text-xs text-muted-foreground">Total Purchases</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(stats.contentCompleted)}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.readingStreak}
            </div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.averageRating}
            </div>
            <div className="text-xs text-muted-foreground">Avg Rating</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reading Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Reading Time</span>
              <span className="text-sm font-medium">{stats.totalReadingTime} hours</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Average Session</span>
              <span className="text-sm font-medium">32 minutes</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Most Read Category</span>
              <span className="text-sm font-medium">Technology</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Favorite Creator</span>
              <span className="text-sm font-medium">Content Expert</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Stats */}
      <Card>
        <CardContent className="p-4">
          <Button className="w-full" variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share My Reading Stats
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Error Fallback Component
 */
function PortfolioErrorFallback({
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
              Portfolio Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading your portfolio. Please try again.
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
function PortfolioLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <AdaptiveNavigation showMobile={true} enableAnalytics={true} />
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

        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12 mx-auto" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * MiniApp User Portfolio Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppUserPortfolioPage() {
  return (
    <ErrorBoundary
      FallbackComponent={PortfolioErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp User Portfolio error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<PortfolioLoadingSkeleton />}>
        <MiniAppUserPortfolioCore />
      </Suspense>
    </ErrorBoundary>
  )
}

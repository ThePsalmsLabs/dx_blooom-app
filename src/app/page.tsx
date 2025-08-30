/**
 * Home Page Component - Platform Landing & Discovery Hub
 * File: src/app/page.tsx
 * 
 * This component serves as the main entry point for your Web3 content platform,
 * adapting dynamically to user connection status and roles while showcasing
 * the platform's value proposition and driving user engagement.
 * 
 * Architecture Integration:
 * - Follows established three-layer hook pattern (core → business → UI)
 * - Leverages existing AppLayout, ContentDiscoveryGrid, and RouteGuards
 * - Implements role-based adaptive interface (disconnected → consumer → creator)
 * - Maintains consistent design patterns with other pages
 * - Uses UI integration hooks for clean, declarative components
 * 
 * This design transforms your home page from a basic template into a sophisticated
 * platform showcase that guides users through their journey from discovery to
 * active participation in the Web3 content economy.
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  ArrowRight,
  TrendingUp,
  DollarSign,
  Play,
  FileText,
  Headphones,
  BookOpen,
  Code,
  Sparkles,
  Eye,
  Star,
  Shield,
  Globe,
  ChevronRight,
  Plus,
  Users
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/index'
import { CreatorsCarousel, ContentCarousel } from '@/components/ui/carousel'

// Import architectural layers following established patterns
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { ContentDiscoveryGrid } from '@/components/content/ContentDiscoveryGrid'
import { ContentCarouselWrapper } from '@/components/content/ContentCarouselWrapper'

// Import business logic and UI integration hooks
import { useCreatorProfile, useIsCreatorRegistered } from '@/hooks/contracts/core'
import { useAllCreators } from '@/hooks/contracts/useAllCreators.optimized'
import { WalletConnectButton } from '@/components/web3/WalletConnectButton'
import { useWalletConnect } from '@/hooks/web3/useWalletConnect'

// Import UI components
import { CreatorCard } from '@/components/creators/CreatorCard'
import { RealTimePlatformStats } from '@/components/platform/RealTimePlatformStats'

// Import utilities and types
import { ContentCategory } from '@/types/contracts'
import { formatCurrency } from '@/lib/utils'

// ===== CREATORS SECTION COMPONENT =====

/**
 * Creators Section Component
 * 
 * This component showcases the top creators on the platform,
 * providing social proof and encouraging user engagement.
 */
function CreatorsSection() {
  const allCreators = useAllCreators(20) // Use same page size as creators page
  const router = useRouter()

  // Get top creators for featured section
  const featuredCreators = useMemo(() => {
    if (!allCreators.creators || allCreators.creators.length === 0) {
      return []
    }
    
    return [...allCreators.creators]
      .sort((a, b) => Number(b.profile.totalEarnings) - Number(a.profile.totalEarnings))
      .slice(0, 6) // Show top 6 creators
  }, [allCreators.creators])

  // Enhanced loading logic with proper dependency handling
  useEffect(() => {
    // Only trigger load if we have a total count but no creators loaded yet
    if (
      allCreators.totalCount > 0 && 
      allCreators.creators.length === 0 && 
      !allCreators.isLoading &&
      allCreators.loadMore
    ) {
      // Add a small delay to ensure the hook is fully initialized
      const timer = setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Home page: Triggering manual load of creators...')
        }
        allCreators.loadMore()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [allCreators.totalCount, allCreators.creators.length, allCreators.isLoading, allCreators.loadMore])

  // Additional safety check - if we have total count but no creators after a delay, try loading again
  useEffect(() => {
    if (allCreators.totalCount > 0 && allCreators.creators.length === 0 && !allCreators.isLoading) {
      const timer = setTimeout(() => {
        if (allCreators.totalCount > 0 && allCreators.creators.length === 0 && !allCreators.isLoading && allCreators.loadMore) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Home page: Safety check - triggering load after delay...')
          }
          allCreators.loadMore()
        }
      }, 2000) // 2 second delay
      
      return () => clearTimeout(timer)
    }
  }, [allCreators.totalCount, allCreators.creators.length, allCreators.isLoading, allCreators.loadMore])

  // Enhanced debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🏠 Home page creators state:', {
      isLoading: allCreators.isLoading,
      totalCreators: allCreators.totalCount,
      creatorsArray: allCreators.creators.length,
      featuredCreators: featuredCreators.length,
      isError: allCreators.isError,
      error: allCreators.error?.message,
      hasLoadMore: !!allCreators.loadMore,
      hasMore: allCreators.hasMore,
      currentPage: allCreators.currentPage,
      shouldAutoLoad: allCreators.totalCount > 0 && allCreators.creators.length === 0 && !allCreators.isLoading
    })
  }

  return (
    <section className="py-16 bg-gradient-to-br from-background to-muted/50 animate-slide-in-up animate-delay-300">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            Bloom Creator Community
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Creative Minds Flourishing in Web3
          </h2>

          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Meet the real-life visionaries blooming on our platform. From artists crafting digital masterpieces
            to educators sharing life-changing knowledge, discover creators who are transforming passions into
            sustainable livelihoods through authentic Web3 connections.
          </p>

          {/* Quick Stats - Now Real-Time from Blockchain */}
          <div className="mb-8">
            <RealTimePlatformStats compact />
          </div>
        </div>

        {/* Featured Creators - Responsive Carousel/Grid */}
        {(allCreators.isLoading || (allCreators.totalCount > 0 && featuredCreators.length === 0)) ? (
          <>
            {/* Mobile/Tablet Loading */}
            <div className="block lg:hidden">
              <CreatorsCarousel
                creators={Array.from({ length: 6 }, (_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                autoPlay={false}
              />
            </div>

            {/* Desktop Loading */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : featuredCreators.length > 0 ? (
          <>
            {/* Mobile/Tablet: Carousel */}
            <div className="block lg:hidden mb-8">
              <CreatorsCarousel
                creators={featuredCreators.map((creator) => (
                  <CreatorCard
                    key={creator.address}
                    creatorAddress={creator.address}
                    variant="featured"
                    showSubscribeButton={true}
                    className="hover:shadow-lg transition-shadow"
                  />
                ))}
                autoPlay={true}
              />
            </div>

            {/* Desktop: Grid */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-8">
              {featuredCreators.map((creator) => (
                <CreatorCard
                  key={creator.address}
                  creatorAddress={creator.address}
                  variant="featured"
                  showSubscribeButton={true}
                  className="hover:shadow-lg transition-shadow"
                />
              ))}
            </div>
          </>
        ) : !allCreators.isLoading && allCreators.totalCount === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Creators Yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first creator to join our platform and start monetizing your content.
              </p>
              <Button onClick={() => router.push('/onboard')}>
                Become a Creator
              </Button>
            </CardContent>
          </Card>
        ) : allCreators.isError ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Unable to Load Creators</h3>
              <p className="text-muted-foreground mb-6">
                {allCreators.error?.message || 'There was an issue loading creators.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={allCreators.retryFailed} variant="outline">
                  Retry Failed
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {allCreators.totalCount > 0 ? 'Loading Creators...' : 'No Creators Found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {allCreators.totalCount > 0 
                  ? 'Please wait while we load the creator profiles.'
                  : 'Be the first creator to join our platform!'
                }
              </p>
              {allCreators.totalCount > 0 && allCreators.loadMore && (
                <div className="space-y-2">
                  <Button 
                    onClick={allCreators.loadMore}
                    disabled={allCreators.isLoading}
                    variant="outline"
                  >
                    {allCreators.isLoading ? 'Loading...' : 'Load Creators'}
                  </Button>
                  {allCreators.isError && (
                    <Button 
                      onClick={allCreators.retryFailed}
                      variant="outline"
                      size="sm"
                    >
                      Retry Failed
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Call to Action Buttons */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => router.push('/creators')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Users className="mr-2 h-5 w-5" />
              View All Creators
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => router.push('/browse')}
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Browse Content
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Discover unique content from verified creators worldwide
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * Home Page State Interface
 * 
 * Manages the various interactive states within the home page experience,
 * including featured content selection and user engagement tracking.
 */
interface HomePageState {
  readonly activeContentTab: ContentCategory | 'featured'
  readonly showPlatformStats: boolean
  readonly heroVideoPlaying: boolean
  readonly selectedCreatorSpotlight: number
}



/**
 * Featured Creator Interface
 * 
 * Represents creators we highlight in the creator spotlight section
 * to inspire new creators and showcase success stories.
 */
interface FeaturedCreator {
  readonly address: string
  readonly displayName: string
  readonly avatar: string
  readonly category: string
  readonly earnings: string
  readonly subscriberCount: string
  readonly bio: string
}

/**
 * Main Home Page Component
 * 
 * This component orchestrates the complete home page experience, adapting
 * to user roles and connection status while providing clear pathways to
 * platform engagement.
 */
export default function HomePage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  // Use Privy-based wallet connection
  const { login, isAuthenticated } = useWalletConnect()
  const { data: isCreator } = useIsCreatorRegistered(address)
  const { data: creatorProfile } = useCreatorProfile(address)
  const allCreators = useAllCreators()

  // Component state management
  const [pageState, setPageState] = useState<HomePageState>({
    activeContentTab: 'featured',
    showPlatformStats: true,
    heroVideoPlaying: false,
    selectedCreatorSpotlight: 0
  })

  // Derived data for backward compatibility
  const topCreators = useMemo(() =>
    [...allCreators.creators]
      .sort((a, b) => Number(b.profile.totalEarnings) - Number(a.profile.totalEarnings))
      .slice(0, 10),
    [allCreators.creators]
  )

  // Platform stats are now handled by RealTimePlatformStats component
  // which fetches real data from smart contracts

  const featuredCreators: readonly FeaturedCreator[] = useMemo(() => {
    if (!topCreators || topCreators.length === 0) {
      // Fallback to hardcoded data if no creators are loaded yet
      return [
        {
          address: '0x1234...',
          displayName: 'TechGuruAlex',
          avatar: '/vercel.svg',
          category: 'Software Development',
          earnings: '$15.2K',
          subscriberCount: '1.2K',
          bio: 'Building the future of decentralized applications'
        },
        {
          address: '0x5678...',
          displayName: 'CryptoAnalystSara',
          avatar: '/next.svg',
          category: 'Market Analysis',
          earnings: '$23.8K',
          subscriberCount: '2.1K',
          bio: 'Deep dives into DeFi protocols and market trends'
        },
        {
          address: '0x9abc...',
          displayName: 'NFTArtistMike',
          avatar: '/globe.svg',
          category: 'Digital Art',
          earnings: '$31.5K',
          subscriberCount: '3.4K',
          bio: 'Creating next-generation digital experiences'
        }
      ]
    }

    // Use real creator data from the contract
    return topCreators.slice(0, 3).map((creator, index) => {
      const fallbackNames = ['TechGuruAlex', 'CryptoAnalystSara', 'NFTArtistMike']
      const fallbackCategories = ['Software Development', 'Market Analysis', 'Digital Art']
      const fallbackBios = [
        'Building the future of decentralized applications',
        'Deep dives into DeFi protocols and market trends',
        'Creating next-generation digital experiences'
      ]

      return {
        address: creator.address,
        displayName: fallbackNames[index] || `Creator ${index + 1}`,
        avatar: `/api/avatar/${creator.address}`,
        category: fallbackCategories[index] || 'Content Creation',
        earnings: formatCurrency(creator.profile?.totalEarnings || BigInt(0), 6, 'USDC'),
        subscriberCount: creator.profile?.subscriberCount?.toString() || '0',
        bio: fallbackBios[index] || 'Building amazing content on the blockchain'
      }
    })
  }, [topCreators])

  // Content category configuration for tabs
  const contentCategories = useMemo(() => [
    { key: 'featured' as const, label: 'Featured', icon: Star },
    { key: ContentCategory.ARTICLE, label: 'Articles', icon: FileText },
    { key: ContentCategory.VIDEO, label: 'Videos', icon: Play },
    { key: ContentCategory.AUDIO, label: 'Audio', icon: Headphones },
    { key: ContentCategory.COURSE, label: 'Courses', icon: BookOpen },
    { key: ContentCategory.SOFTWARE, label: 'Software', icon: Code }
  ], [])

  // Navigation handlers
  const handleBrowseContent = useCallback(() => {
    router.push('/browse')
  }, [router])

  const handleStartCreating = useCallback(() => {
    if (isConnected) {
      if (isCreator) {
        router.push('/dashboard')
      } else {
        router.push('/onboard')
      }
    } else {
      // Connect wallet first using Privy, then redirect to onboarding
      login()
    }
  }, [isConnected, isCreator, router, login])

  const handleContentTabChange = useCallback((category: ContentCategory | 'featured') => {
    setPageState(prev => ({ ...prev, activeContentTab: category }))
  }, [])

  return (
    <AppLayout className="bg-gradient-to-br from-background via-background to-muted/10">
      <RouteGuards requiredLevel="public">
        <div className="container mx-auto space-y-16">
          
          {/* Hero Section - Adapts based on user connection status */}
          <section className="relative py-20 text-center bg-gradient-to-br from-background via-background to-muted/20 rounded-2xl overflow-hidden bg-web3-glow bg-blockchain-pattern border border-border/50 shadow-xl animate-slide-in-up">
            <div className="mx-auto max-w-4xl space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="text-sm bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Web3 Content Economy
                </Badge>
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl leading-tight">
                   Bloom into
                  <span className="bg-gradient-to-r from-primary via-accent to-cyan-500 bg-clip-text text-transparent ml-2 block sm:inline">
                    Creative Freedom
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  Where real-life creativity meets Web3 magic. Bloom empowers creators to own their story,
                  connect authentically with their audience, and earn through transparent blockchain innovation.
                  Your content, your rules, your future.
                </p>
              </div>

              {/* Web3 Platform Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                <div className="text-center animate-scale-in animate-delay-100">
                  <div className="text-2xl font-bold text-primary mb-1">10K+</div>
                  <div className="text-sm text-muted-foreground">Active Creators</div>
                </div>
                <div className="text-center animate-scale-in animate-delay-200">
                  <div className="text-2xl font-bold text-accent mb-1">$2M+</div>
                  <div className="text-sm text-muted-foreground">Creator Earnings</div>
                </div>
                <div className="text-center animate-scale-in animate-delay-300">
                  <div className="text-2xl font-bold text-cyan-500 mb-1">50K+</div>
                  <div className="text-sm text-muted-foreground">Content Pieces</div>
                </div>
                <div className="text-center animate-scale-in animate-delay-500">
                  <div className="text-2xl font-bold text-green-500 mb-1">Base</div>
                  <div className="text-sm text-muted-foreground">Network</div>
                </div>
              </div>

              {/* Role-based Call-to-Action */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!isConnected ? (
                  <>
                    <Button
                      variant="default"
                      size="lg"
                      className="btn-gradient-primary text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      Connect Wallet
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleBrowseContent}
                      className="text-lg px-8 py-4 border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300"
                    >
                      Browse Content
                      <Eye className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                ) : isCreator ? (
                  <>
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => router.push('/dashboard')}
                      className="btn-gradient-primary text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      Creator Dashboard
                      <TrendingUp className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push('/upload')}
                      className="text-lg px-8 py-4 border-2 border-accent/30 hover:border-accent/60 hover:bg-accent/5 transition-all duration-300"
                    >
                      Upload Content
                      <Plus className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleStartCreating}
                      className="btn-gradient-primary text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      Start Creating
                      <Sparkles className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleBrowseContent}
                      className="text-lg px-8 py-4 border-2 border-accent/30 hover:border-accent/60 hover:bg-accent/5 transition-all duration-300"
                    >
                      Discover Content
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ADD THIS NEW CREATORS SECTION */}
          <CreatorsSection />

          {/* Platform Statistics - Now Real-Time from Blockchain */}
          {pageState.showPlatformStats && (
            <section className="py-12 border-y">
              <RealTimePlatformStats compact className="mb-6" />
            </section>
          )}

          {/* Featured Content Discovery */}
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Bloom into New Perspectives</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Immerse yourself in a garden of creative content blooming across Web3. From thought-provoking articles
                to captivating videos, discover authentic stories and ideas that resonate with your real-life journey.
                Support creators directly through transparent blockchain connections.
              </p>
            </div>

            {/* Content Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              {contentCategories.map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={pageState.activeContentTab === key ? "default" : "outline"}
                  onClick={() => handleContentTabChange(key)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Content Display - Responsive Carousel/Grid */}
            <div className="min-h-[400px]">
              {/* Mobile/Tablet: Carousel */}
              <div className="block lg:hidden">
                <ContentCarouselWrapper
                  category={pageState.activeContentTab}
                  itemsPerView={8}
                  autoPlay={true}
                />
              </div>

              {/* Desktop: Full Grid */}
              <div className="hidden lg:block">
                <ContentDiscoveryGrid
                  initialFilters={
                    pageState.activeContentTab === 'featured'
                      ? {}
                      : { category: pageState.activeContentTab }
                  }
                  onContentSelect={(contentId) => {
                    router.push(`/content/${contentId}`)
                  }}
                  showCreatorInfo={true}
                  itemsPerPage={8}
                  className="min-h-[400px]"
                />
              </div>
            </div>

            <div className="text-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleBrowseContent}
              >
                Browse All Content
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* Creator Spotlight */}
          <section className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Bloom Success Stories</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real creators, real impact. Discover the authentic journeys of visionaries who have blossomed
                on our platform, turning creative passions into thriving livelihoods through genuine Web3 connections
                and direct community support.
              </p>
            </div>

            {/* Mobile/Tablet: Carousel */}
            <div className="block lg:hidden">
              <CreatorsCarousel
                creators={featuredCreators.map((creator, index) => (
                  <Card key={creator.address} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="text-center space-y-4">
                      <Avatar className="w-16 h-16 mx-auto">
                        <AvatarImage src={creator.avatar} alt={creator.displayName} />
                        <AvatarFallback>
                          {creator.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{creator.displayName}</h3>
                        <Badge variant="secondary">{creator.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground text-center">
                        {creator.bio}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {creator.earnings}
                          </div>
                          <div className="text-xs text-muted-foreground">Earned</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">
                            {creator.subscriberCount}
                          </div>
                          <div className="text-xs text-muted-foreground">Subscribers</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/creator/${creator.address}`)}
                      >
                        View Profile
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                autoPlay={true}
              />
            </div>

            {/* Desktop: Grid */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              {featuredCreators.map((creator, index) => (
                <Card key={creator.address} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center space-y-4">
                    <Avatar className="w-16 h-16 mx-auto">
                      <AvatarImage src={creator.avatar} alt={creator.displayName} />
                      <AvatarFallback>
                        {creator.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{creator.displayName}</h3>
                      <Badge variant="secondary">{creator.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      {creator.bio}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {creator.earnings}
                        </div>
                        <div className="text-xs text-muted-foreground">Earned</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {creator.subscriberCount}
                        </div>
                        <div className="text-xs text-muted-foreground">Subscribers</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/creator/${creator.address}`)}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Value Proposition for New Creators */}
          <section className="bg-gradient-to-br from-background to-muted/30 rounded-2xl p-12 border border-border/50 shadow-lg animate-slide-in-up animate-delay-500 hover-lift">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Why Visionaries Bloom on Bloom
                </h2>
                <p className="text-lg text-muted-foreground">
                  Join thousands of creators who have blossomed into their full potential through
                  Web3 innovation. Experience true digital ownership, authentic connections, and
                  transparent monetization that empowers your creative journey.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 hover:web3-glow-primary transition-all duration-300 animate-float">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mx-auto shadow-lg animate-pulse-web3">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-primary">True Ownership</h3>
                  <p className="text-sm text-muted-foreground">
                    Your content lives on IPFS. No platform can delete or control your work. Own your digital assets forever.
                  </p>
                </div>
                <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 hover:web3-glow-success transition-all duration-300 animate-float" style={{animationDelay: '1s'}}>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto shadow-lg animate-pulse-web3" style={{animationDelay: '0.5s'}}>
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-green-600 dark:text-green-400">Fair Revenue</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep 90%+ of your earnings. Direct payments via USDC on Base blockchain with instant settlements.
                  </p>
                </div>
                <div className="space-y-4 p-6 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 hover:border-accent/40 hover:web3-glow-accent transition-all duration-300 animate-float" style={{animationDelay: '2s'}}>
                  <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent/80 rounded-xl flex items-center justify-center mx-auto shadow-lg animate-pulse-web3" style={{animationDelay: '1s'}}>
                    <Globe className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg text-accent">Global Reach</h3>
                  <p className="text-sm text-muted-foreground">
                    Borderless payments enable creators to monetize worldwide audiences without geographic restrictions.
                  </p>
                </div>
              </div>

              {!isCreator && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!isConnected ? (
                    <div className="text-lg px-8 py-4">
                      Connect Wallet to Start
                    </div>
                  ) : (
                    <Button 
                      size="lg" 
                      onClick={handleStartCreating}
                      className="text-lg px-8 py-4"
                    >
                      Complete Creator Setup
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="text-center py-16 space-y-8 animate-slide-in-up animate-delay-700">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">Ready to Bloom into Your Creative Future?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Whether you're here to discover inspiring content or share your unique voice with the world,
                Bloom gives you the Web3 tools to participate authentically in the creator economy.
                Your story deserves to flourish.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleBrowseContent}
                className="text-lg px-8 py-4"
              >
                Explore Content
                <Eye className="ml-2 h-5 w-5" />
              </Button>
              {!isConnected ? (
                <div className="text-lg px-8 py-4">
                  Connect Wallet to Start Creating
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleStartCreating}
                  className="text-lg px-8 py-4"
                >
                  {isCreator ? 'Creator Dashboard' : 'Start Creating'}
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </section>

          {/* Debug buttons - only shown in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
              <Button 
                onClick={() => router.push('/creators')}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg block w-full"
              >
                🧑‍💼 All Creators
              </Button>
              <Button 
                onClick={() => router.push('/browse')}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg block w-full"
              >
                🔍 Browse Content
              </Button>
            </div>
          )}

        </div>
      </RouteGuards>
    </AppLayout>
  )
}
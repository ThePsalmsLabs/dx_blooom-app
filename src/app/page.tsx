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

// Import architectural layers following established patterns
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { ContentDiscoveryGrid } from '@/components/content/ContentDiscoveryGrid'

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

  // Force load creators if they haven't loaded yet
  useEffect(() => {
    if (!allCreators.isLoading && allCreators.totalCount > 0 && allCreators.creators.length === 0) {
      // Try to load more if we have a total count but no creators
      if (allCreators.loadMore) {
        allCreators.loadMore()
      }
    }
  }, [allCreators.totalCount, allCreators.creators.length, allCreators.isLoading])

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('🏠 Home page creators state:', {
      isLoading: allCreators.isLoading,
      totalCreators: allCreators.totalCount,
      creatorsArray: allCreators.creators.length,
      featuredCreators: featuredCreators.length,
      isError: allCreators.isError,
      error: allCreators.error?.message,
      hasLoadMore: !!allCreators.loadMore,
      hasMore: allCreators.hasMore
    })
  }

  return (
    <section className="py-16 bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            Discover Amazing Creators
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Meet Our Top Creators
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover talented creators who are monetizing their content on our platform. 
            From educational content to entertainment, find creators that match your interests.
          </p>

          {/* Quick Stats - Now Real-Time from Blockchain */}
          <div className="mb-8">
            <RealTimePlatformStats compact />
          </div>
        </div>

        {/* Featured Creators Grid */}
        {allCreators.isLoading && featuredCreators.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        ) : featuredCreators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                There was an issue loading creators. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Loading Creators...</h3>
              <p className="text-muted-foreground">
                Please wait while we load the creator profiles.
              </p>
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
          <section className="relative py-20 text-center bg-white rounded-2xl overflow-hidden bg-amber-glow">
            <div className="mx-auto max-w-4xl space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="text-sm">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Web3 Content Economy
                </Badge>
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                   Create, Share, 
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent ml-2">
                    Earn
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  The decentralized platform where creators own their content, 
                  build direct relationships with their audience, and earn fairly 
                  for their work through blockchain technology.
                </p>
              </div>

              {/* Role-based Call-to-Action */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!isConnected ? (
                  <>
                    <WalletConnectButton 
                      variant="default" 
                      size="lg"
                      className="text-lg px-8 py-4"
                    >
                      Connect Wallet
                    </WalletConnectButton>
                    <Button 
                      variant="glow" 
                      size="lg"
                      onClick={handleBrowseContent}
                      className="text-lg px-8 py-4"
                    >
                      Browse Content
                      <Eye className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                ) : isCreator ? (
                  <>
                    <Button 
                      variant="glow"
                      size="lg" 
                      onClick={() => router.push('/dashboard')}
                      className="text-lg px-8 py-4"
                    >
                      Creator Dashboard
                      <TrendingUp className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      variant="glow" 
                      size="lg"
                      onClick={() => router.push('/upload')}
                      className="text-lg px-8 py-4"
                    >
                      Upload Content
                      <Plus className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="glow"
                      size="lg" 
                      onClick={handleStartCreating}
                      className="text-lg px-8 py-4"
                    >
                      Start Creating
                      <Sparkles className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      variant="glow" 
                      size="lg"
                      onClick={handleBrowseContent}
                      className="text-lg px-8 py-4"
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
              <h2 className="text-3xl font-bold">Discover Amazing Content</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore high-quality content from talented creators across various categories.
                Support creators directly with blockchain-powered micropayments.
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

            {/* Content Grid - Leverages existing ContentDiscoveryGrid */}
            <div className="min-h-[400px]">
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
              <h2 className="text-3xl font-bold">Creator Spotlight</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Meet successful creators who are building thriving businesses 
                on our platform through direct fan support.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
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
          <section className="bg-gradient-to-r from-primary/5 to-purple-600/5 rounded-lg p-12">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold">Why Creators Choose Our Platform</h2>
                <p className="text-lg text-muted-foreground">
                  Join thousands of creators who&apos;ve discovered the power of 
                  Web3 content monetization and true ownership.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">True Ownership</h3>
                  <p className="text-sm text-muted-foreground">
                    Your content lives on IPFS. No platform can delete or control your work.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center mx-auto">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Fair Revenue</h3>
                  <p className="text-sm text-muted-foreground">
                    Keep 90%+ of your earnings. Direct payments via USDC on Base blockchain.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mx-auto">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg">Global Reach</h3>
                  <p className="text-sm text-muted-foreground">
                    Borderless payments enable creators to monetize worldwide audiences.
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
          <section className="text-center py-16 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold">Ready to Join the Creator Economy?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Whether you&apos;re here to discover amazing content or share your own creations,
                our Web3 platform gives you the tools to participate in the new digital economy.
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

          {/* QUICK TEST: Floating buttons for immediate testing */}
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

        </div>
      </RouteGuards>
    </AppLayout>
  )
}
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

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  ArrowRight,
  TrendingUp,
  DollarSign,
  Play,
  FileText,
  Headphones,
  Image as ImageIcon,
  BookOpen,
  Code,
  Sparkles,
  Eye,
  Star,
  Shield,
  Globe,
  ChevronRight,
  Plus
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
import { WalletConnectButton } from '@/components/web3/WalletConnectModal'

// Import business logic and UI integration hooks
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { useCreatorProfile, useIsCreatorRegistered } from '@/hooks/contracts/core'

// Import utilities and types
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { ContentCategory, categoryToString } from '@/types/contracts'

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
 * Platform Statistics Interface
 * 
 * Defines the key metrics we display to build trust and showcase
 * platform activity and growth.
 */
interface PlatformStats {
  readonly totalCreators: string
  readonly totalContent: string
  readonly totalEarnings: string
  readonly monthlyActiveUsers: string
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
  
  // Use our established UI integration hooks
  const walletUI = useWalletConnectionUI()
  const { data: isCreator } = useIsCreatorRegistered(address)
  const { data: creatorProfile } = useCreatorProfile(address)

  // Component state management
  const [pageState, setPageState] = useState<HomePageState>({
    activeContentTab: 'featured',
    showPlatformStats: true,
    heroVideoPlaying: false,
    selectedCreatorSpotlight: 0
  })

  // Mock data - in production, these would come from your contract hooks
  const platformStats: PlatformStats = useMemo(() => ({
    totalCreators: '2.3K',
    totalContent: '15.7K',
    totalEarnings: '$2.1M',
    monthlyActiveUsers: '45.2K'
  }), [])

  const featuredCreators: readonly FeaturedCreator[] = useMemo(() => [
    {
      address: '0x1234...',
      displayName: 'TechGuruAlex',
      avatar: '/avatars/alex.jpg',
      category: 'Software Development',
      earnings: '$15.2K',
      subscriberCount: '1.2K',
      bio: 'Building the future of decentralized applications'
    },
    {
      address: '0x5678...',
      displayName: 'CryptoAnalystSara',
      avatar: '/avatars/sara.jpg',
      category: 'Market Analysis',
      earnings: '$23.8K',
      subscriberCount: '2.1K',
      bio: 'Deep dives into DeFi protocols and market trends'
    },
    {
      address: '0x9abc...',
      displayName: 'NFTArtistMike',
      avatar: '/avatars/mike.jpg',
      category: 'Digital Art',
      earnings: '$31.5K',
      subscriberCount: '3.4K',
      bio: 'Creating next-generation digital experiences'
    }
  ], [])

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
      // Connect wallet first, then redirect to onboarding
      walletUI.connect()
    }
  }, [isConnected, isCreator, router, walletUI])

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
                  Create, Share, and{' '}
                  <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
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
                      size="lg"
                      className="text-lg px-8 py-4 btn-glow"
                    />
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

          {/* Platform Statistics */}
          {pageState.showPlatformStats && (
            <section className="py-12 border-y">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    {platformStats.totalCreators}
                  </div>
                  <div className="text-sm text-muted-foreground">Creators</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    {platformStats.totalContent}
                  </div>
                  <div className="text-sm text-muted-foreground">Content Pieces</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-green-600">
                    {platformStats.totalEarnings}
                  </div>
                  <div className="text-sm text-muted-foreground">Creator Earnings</div>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">
                    {platformStats.monthlyActiveUsers}
                  </div>
                  <div className="text-sm text-muted-foreground">Monthly Users</div>
                </div>
              </div>
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
                  Join thousands of creators who've discovered the power of 
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
                    <WalletConnectButton 
                      size="lg"
                      className="text-lg px-8 py-4"
                    >
                      Connect Wallet to Start
                    </WalletConnectButton>
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
                Whether you're here to discover amazing content or share your own creations,
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
                <WalletConnectButton 
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4"
                >
                  Connect Wallet to Start Creating
                </WalletConnectButton>
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

        </div>
      </RouteGuards>
    </AppLayout>
  )
}
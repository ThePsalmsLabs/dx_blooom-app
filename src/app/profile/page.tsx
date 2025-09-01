/**
 * Profile Page - Component 12.1: User Profile Landing Page
 * File: src/app/profile/page.tsx
 *
 * This page serves as the landing page for non-connected users when they
 * click on the profile dropdown. It provides information about what they
 * can access once connected and encourages wallet connection.
 *
 * Key Features:
 * - Prominent wallet connection call-to-action
 * - Overview of platform benefits for consumers
 * - Featured creators to showcase the ecosystem
 * - Clear path to getting started
 * - Responsive design following platform patterns
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Wallet,
  Users,
  Sparkles,
  TrendingUp,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  DollarSign,
  Shield,
  Globe,
  FileText,
  Target
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback
} from '@/components/ui/index'

import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { WalletConnectionButton } from '@/components/web3/WalletConnect'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { useIsCreatorRegistered } from '@/hooks/contracts/core'
import { formatCurrency, formatAddress } from '@/lib/utils'
import { useAllCreators } from '@/hooks/contracts/useAllCreators.optimized'
import { usePlatformAnalytics } from '@/hooks/contracts/analytics/usePlatformAnalytics'

export default function ProfilePage() {
  const router = useRouter()
  const walletUI = useWalletConnectionUI()

  // Fetch real platform data
  const allCreators = useAllCreators(20)
  const platformAnalytics = usePlatformAnalytics()

  // Check if user is already a creator
  const isCreatorRegistered = useIsCreatorRegistered(walletUI.address as `0x${string}` | undefined)

  // Get featured creators from real data
  const featuredCreators = React.useMemo(() => {
    if (!allCreators.creators || allCreators.creators.length === 0) {
      return []
    }

    return [...allCreators.creators]
      .sort((a, b) => Number(b.profile.totalEarnings) - Number(a.profile.totalEarnings))
      .slice(0, 6) // Show top 6 creators by earnings
  }, [allCreators.creators])

  // If user is connected AND already a creator, redirect to dashboard
  React.useEffect(() => {
    if (walletUI.isConnected && isCreatorRegistered.data === true) {
      router.push('/dashboard')
    }
  }, [walletUI.isConnected, isCreatorRegistered.data, router])

  // If redirecting, show loading state
  if (walletUI.isConnected && isCreatorRegistered.data === true) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting to your dashboard...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <RouteGuards requiredLevel="public">
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
          <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
                              <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                    {walletUI.isConnected ? (
                      <Sparkles className="h-8 w-8 text-white" />
                    ) : (
                      <Wallet className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">
                      {walletUI.isConnected ? "Ready to Create?" : "Welcome to Bloom"}
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      {walletUI.isConnected
                        ? "Join thousands of creators building the future of content"
                        : "Connect your wallet to unlock the creator economy"
                      }
                    </p>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="max-w-md mx-auto mb-8">
                  {walletUI.isConnected ? (
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 w-full"
                      onClick={() => router.push('/onboard')}
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      Become a Creator
                    </Button>
                  ) : (
                    <WalletConnectionButton variant="button" className="w-full" />
                  )}
                  <p className="text-sm text-muted-foreground mt-3">
                    {walletUI.isConnected
                      ? "Set up your creator profile and start earning from your content"
                      : "New to Web3? We'll guide you through connecting your wallet and setting up your account."
                    }
                  </p>
                </div>
            </div>

            {/* Platform Statistics Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
                <CardHeader className="text-center p-3 sm:p-4">
                  <CardTitle className="flex items-center justify-center gap-1 sm:gap-2">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="text-sm sm:text-base">Content</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-3 sm:p-4">
                  {platformAnalytics.isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-6 sm:h-8 bg-muted rounded mb-1 sm:mb-2"></div>
                      <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">
                        {platformAnalytics.platformStats?.totalContent ? Number(platformAnalytics.platformStats.totalContent).toLocaleString() : '0'}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {platformAnalytics.platformStats?.activeContent ? Number(platformAnalytics.platformStats.activeContent).toLocaleString() : '0'} active
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
                <CardHeader className="text-center p-3 sm:p-4">
                  <CardTitle className="flex items-center justify-center gap-1 sm:gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <span className="text-sm sm:text-base">Creators</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-3 sm:p-4">
                  {allCreators.isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-6 sm:h-8 bg-muted rounded mb-1 sm:mb-2"></div>
                      <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1 sm:mb-2">
                        {allCreators.totalCount?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {featuredCreators.filter(c => c.profile.isVerified).length} verified
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                <CardHeader className="text-center p-3 sm:p-4">
                  <CardTitle className="flex items-center justify-center gap-1 sm:gap-2">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    <span className="text-sm sm:text-base">Earnings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-3 sm:p-4">
                  {platformAnalytics.isLoading || allCreators.isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-6 sm:h-8 bg-muted rounded mb-1 sm:mb-2"></div>
                      <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">
                        ${featuredCreators.reduce((sum, creator) => sum + Number(creator.profile.totalEarnings) / 1000000, 0).toFixed(0)}K
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Total earnings
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
                <CardHeader className="text-center p-3 sm:p-4">
                  <CardTitle className="flex items-center justify-center gap-1 sm:gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    <span className="text-sm sm:text-base">Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-3 sm:p-4">
                  {platformAnalytics.isLoading ? (
                    <div className="animate-pulse">
                      <div className="h-6 sm:h-8 bg-muted rounded mb-1 sm:mb-2"></div>
                      <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600 mb-1 sm:mb-2">
                        {platformAnalytics.platformStats?.platformHealth.contentActivityRatio ?
                          Math.round(platformAnalytics.platformStats.platformHealth.contentActivityRatio * 100) : 0}%
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Activity rate
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Featured Creators Section */}
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Featured Creators</h2>
                <p className="text-muted-foreground">
                  Discover amazing creators already building on Bloom
                </p>
              </div>

              {allCreators.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardHeader className="text-center p-3 sm:p-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-full mx-auto mb-2 sm:mb-3"></div>
                        <div className="space-y-1 sm:space-y-2">
                          <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mx-auto"></div>
                          <div className="h-2 sm:h-3 bg-muted rounded w-1/2 mx-auto"></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4">
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                          <div className="h-6 sm:h-8 bg-muted rounded"></div>
                          <div className="h-6 sm:h-8 bg-muted rounded"></div>
                        </div>
                        <div className="h-8 sm:h-10 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : featuredCreators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {featuredCreators.map((creator) => (
                    <Card key={creator.address} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                      <CardHeader className="text-center p-3 sm:p-4">
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-3 ring-2 sm:ring-4 ring-background">
                          <AvatarFallback className="text-sm sm:text-lg font-semibold bg-gradient-to-r from-primary to-accent text-white">
                            {formatAddress(creator.address).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base">
                            <span className="truncate max-w-[120px] sm:max-w-none">
                              {formatAddress(creator.address)}
                            </span>
                            {creator.profile.isVerified && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                                <span className="hidden sm:inline">Verified</span>
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm">Creator</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4">
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                          <div>
                            <div className="text-sm sm:text-lg font-bold text-primary">
                              {Number(creator.profile.subscriberCount).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Subscribers</div>
                          </div>
                          <div>
                            <div className="text-sm sm:text-lg font-bold text-green-600">
                              {formatCurrency(creator.profile.subscriptionPrice, 6, 'USDC')}
                            </div>
                            <div className="text-xs text-muted-foreground">per month</div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-xs sm:text-sm h-8 sm:h-10"
                          onClick={() => router.push(`/creator/${creator.address}`)}
                        >
                          View Profile
                          <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Creators Yet</h3>
                    <p className="text-muted-foreground">
                      Creators are joining the platform. Check back soon!
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => router.push('/creators')}
                  className="mr-4"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Browse All Creators
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/collections')}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Explore Collections
                </Button>
              </div>
            </div>

            {/* Platform Benefits Section - Mobile Optimized */}
            <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
              <CardHeader className="text-center p-4 sm:p-6">
                <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Why Choose Bloom?
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Join a thriving creator economy powered by Web3 technology
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                      <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Blockchain-Powered</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      Transparent, decentralized platform with no intermediaries or platform fees
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                      <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Direct Creator Support</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      {platformAnalytics.platformStats?.totalContent ?
                        `${Number(platformAnalytics.platformStats.totalContent).toLocaleString()}+ pieces of content` :
                        'Premium content'} from creators you support directly
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                      <Target className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">NFT Integration</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      Transform content into collectible NFTs with Zora marketplace integration
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-primary/10">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Getting Started is Easy:</h3>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Connect your wallet
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Browse creator content
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Subscribe to favorites
                      </span>
                    </div>
                  </div>

                  <WalletConnectionButton variant="button" />
                  <p className="text-sm text-muted-foreground mt-3">
                    Already have an account? Your wallet will automatically recognize your profile.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Footer Links */}
            <div className="text-center mt-12 pt-8 border-t border-border/50">
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">About Bloom</a>
                <a href="#" className="hover:text-primary transition-colors">Creator Guide</a>
                <a href="#" className="hover:text-primary transition-colors">Help Center</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </RouteGuards>
    </AppLayout>
  )
}

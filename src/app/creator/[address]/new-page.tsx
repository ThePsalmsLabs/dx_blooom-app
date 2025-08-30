'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { type Address } from 'viem'
import {
  Calendar,
  DollarSign,
  Users,
  FileText,
  Star,
  TrendingUp,
  Award,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Clock,
  Zap,
  Trophy,
  Target,
  Sparkles,
  BookOpen,
  Video,
  Music,
  Image as ImageIcon,
  Code,
  Folder,
  CheckCircle,
  BarChart3
} from 'lucide-react'

import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { CreatorProfileHeader } from '@/components/creator/CreatorProfileHeader'
import { CreatorSubscriptionPurchase } from '@/components/subscription'
import { ContentPreviewCard } from '@/components/content/ContentPreviewCard'

// Import hooks
import { useCreatorProfile, useCreatorContent } from '@/hooks/contracts/core'
import { useAccount } from 'wagmi'

// Import UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/seperator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Import utilities
import { formatCurrency, formatAddress, formatRelativeTime, formatAbsoluteTime } from '@/lib/utils'

export default function CreatorProfilePage() {
  const params = useParams()
  const creatorAddress = params.address as Address
  const { address: userAddress } = useAccount()
  const [activeTab, setActiveTab] = useState('content')

  // Fetch creator data
  const creatorProfile = useCreatorProfile(creatorAddress)
  const creatorContent = useCreatorContent(creatorAddress)

  return (
    <AppLayout>
      <RouteGuards requiredLevel="public">
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          {/* Mobile-first responsive container */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Responsive grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

              {/* Main Content Area */}
              <div className="lg:col-span-3 space-y-6">

                {/* Creator Profile Header */}
                <CreatorProfileHeader creatorAddress={creatorAddress} />

                {/* Creator Bio & Description */}
                <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      About This Creator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Creator Story</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {creatorProfile.data?.isVerified
                              ? `A verified creator on Bloom, ${formatAddress(creatorAddress)} brings authentic content
                                to the Web3 space. With ${creatorProfile.data?.contentCount || 0} pieces of content
                                and ${creatorProfile.data?.subscriberCount || 0} subscribers, they&apos;re building
                                meaningful connections through transparent blockchain monetization.`
                              : `Discover the creative journey of ${formatAddress(creatorAddress)}, a passionate
                                content creator embracing Web3 technology to share their unique voice with the world.
                                Their authentic approach to content creation resonates with audiences seeking genuine connections.`
                            }
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground">CONTENT SPECIALTIES</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              <Video className="h-3 w-3 mr-1" />
                              Digital Content
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Heart className="h-3 w-3 mr-1" />
                              Authentic Stories
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Web3 Native
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Creator Achievements</h3>
                          <div className="space-y-3">
                            {creatorProfile.data?.isVerified && (
                              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                                <Award className="h-5 w-5 text-primary" />
                                <div>
                                  <div className="font-medium text-sm">Verified Creator</div>
                                  <div className="text-xs text-muted-foreground">Trusted by the Bloom community</div>
                                </div>
                              </div>
                            )}

                            {(creatorProfile.data?.contentCount || 0) > 5 && (
                              <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                                <Trophy className="h-5 w-5 text-green-600" />
                                <div>
                                  <div className="font-medium text-sm">Prolific Creator</div>
                                  <div className="text-xs text-muted-foreground">{creatorProfile.data?.contentCount} content pieces published</div>
                                </div>
                              </div>
                            )}

                            {(creatorProfile.data?.totalEarnings || BigInt(0)) > BigInt(0) && (
                              <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
                                <DollarSign className="h-5 w-5 text-blue-600" />
                                <div>
                                  <div className="font-medium text-sm">Revenue Generated</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(creatorProfile.data?.totalEarnings || BigInt(0), 6, 'USDC')} earned
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Content ({creatorContent.data?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="about" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Community
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Activity
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-6">
                    {/* Content Grid */}
                    {creatorContent.isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                                <div className="h-32 bg-muted rounded" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : creatorContent.data && creatorContent.data.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {creatorContent.data.map((contentId) => (
                          <ContentPreviewCard
                            key={contentId.toString()}
                            contentId={contentId}
                            viewMode="grid"
                            showCreatorInfo={false}
                            userAddress={userAddress}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card className="text-center py-12">
                        <CardContent>
                          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-xl font-semibold mb-2">No Content Yet</h3>
                          <p className="text-muted-foreground mb-6">
                            This creator hasn&apos;t published any content yet. Check back soon!
                          </p>
                          <Badge variant="secondary" className="text-sm">
                            <Clock className="h-3 w-3 mr-1" />
                            Coming Soon
                          </Badge>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="about" className="space-y-6">
                    {/* Community & Social Proof */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-red-500" />
                            Community Impact
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Active Subscribers</span>
                            <span className="text-lg font-bold text-primary">
                              {creatorProfile.data?.subscriberCount || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Content Pieces</span>
                            <span className="text-lg font-bold text-green-600">
                              {creatorProfile.data?.contentCount || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Total Earnings</span>
                            <span className="text-lg font-bold text-blue-600">
                              {formatCurrency(creatorProfile.data?.totalEarnings || BigInt(0), 6, 'USDC')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-500" />
                            Creator Goals
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-sm">Build authentic audience connections</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <span className="text-sm">Create meaningful, valuable content</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-purple-500 rounded-full" />
                              <span className="text-sm">Foster Web3 adoption and education</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-orange-500 rounded-full" />
                              <span className="text-sm">Support creator economy growth</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Testimonials/Reviews Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5 text-blue-500" />
                          Community Feedback
                        </CardTitle>
                        <CardDescription>
                          What subscribers are saying about this creator
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border-l-4 border-primary pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[1,2,3,4,5].map(i => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">Anonymous Subscriber</span>
                            </div>
                            <p className="text-sm text-muted-foreground italic">
                              "This creator brings such authenticity to Web3 content. Their unique perspective
                              on blockchain technology makes complex topics accessible and engaging."
                            </p>
                          </div>

                          <div className="border-l-4 border-green-500 pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[1,2,3,4,5].map(i => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">Anonymous Subscriber</span>
                            </div>
                            <p className="text-sm text-muted-foreground italic">
                              "Finally found content that combines real expertise with genuine passion.
                              Supporting this creator feels like investing in the future of digital ownership."
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-6">
                    {/* Recent Activity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription>
                          Latest updates from this creator
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                            <div className="flex-1">
                              <p className="text-sm">
                                <span className="font-medium">Creator joined Bloom</span> and started their Web3 journey
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {creatorProfile.data?.registrationTime ?
                                  formatRelativeTime(BigInt(creatorProfile.data.registrationTime) * BigInt(1000)) :
                                  'Recently'
                                }
                              </p>
                            </div>
                          </div>

                          {creatorProfile.data?.contentCount && creatorProfile.data.contentCount > 0 && (
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-medium">Published {creatorProfile.data.contentCount} content pieces</span>
                                </p>
                                <p className="text-xs text-muted-foreground">Building their content library</p>
                              </div>
                            </div>
                          )}

                          {creatorProfile.data?.subscriberCount && creatorProfile.data.subscriberCount > 0 && (
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-medium">Gained {creatorProfile.data.subscriberCount} subscribers</span>
                                </p>
                                <p className="text-xs text-muted-foreground">Growing their community</p>
                              </div>
                            </div>
                          )}

                          {creatorProfile.data?.isVerified && (
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-medium">Earned verified creator status</span>
                                </p>
                                <p className="text-xs text-muted-foreground">Community trust achieved</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Subscription Card */}
                <div className="sticky top-4 lg:top-6 space-y-6">
                  <CreatorSubscriptionPurchase
                    creatorAddress={creatorAddress}
                    onSubscriptionSuccess={() => {
                      // Refresh page data
                      window.location.reload()
                    }}
                    className="w-full"
                  />

                  {/* Subscription Benefits */}
                  <Card className="bg-gradient-to-br from-green-500/5 to-blue-500/5 border-green-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Zap className="h-4 w-4 text-green-500" />
                        Subscription Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Access to all premium content</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Direct creator support</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Early access to new content</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Exclusive community access</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Cancel anytime, no commitments</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Creator Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                        Creator Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {creatorProfile.data?.subscriberCount || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Subscribers</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {creatorProfile.data?.contentCount || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Content</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Earnings</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(creatorProfile.data?.totalEarnings || BigInt(0), 6, 'USDC')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Monthly Rate</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(creatorProfile.data?.subscriptionPrice || BigInt(0), 6, 'USDC')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Sharing */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Share2 className="h-4 w-4 text-purple-500" />
                        Share Creator
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Help this creator grow their audience
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Heart className="h-4 w-4 mr-2" />
                          Follow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RouteGuards>
    </AppLayout>
  )
}

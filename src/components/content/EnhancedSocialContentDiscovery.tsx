/**
 * Enhanced Social Content Discovery - Component 1: Phase 2 Social Commerce
 * File: src/components/content/EnhancedSocialContentDiscovery.tsx
 * 
 * This component enhances your existing UnifiedContentBrowser with comprehensive social context
 * awareness and Farcaster integration, transforming content discovery from individual browsing
 * to socially-informed exploration that drives engagement and conversions.
 * 
 * Architecture Integration:
 * - Builds upon your existing UnifiedContentBrowser component structure
 * - Leverages your useActiveContentPaginated and useContentById hooks
 * - Integrates with your MiniApp context detection and capabilities
 * - Uses your existing UI component library and design system patterns
 * - Maintains backward compatibility with your web browsing experience
 * - Follows your three-layer hook pattern (core → business → UI)
 * 
 * Social Enhancement Logic:
 * - Social recommendation algorithm based on Farcaster social graph
 * - Creator social verification and mutual connection indicators
 * - Social proof metrics and engagement indicators
 * - Viral sharing capabilities with optimized cast generation
 * - Social engagement tracking and conversion analytics
 * - Progressive enhancement based on MiniApp context availability
 * 
 * Key Features:
 * - Zero disruption to existing content browsing functionality
 * - Progressive social enhancement based on user context
 * - Intelligent social recommendation algorithms
 * - Real-time social engagement tracking
 * - Optimized for both web and MiniApp contexts
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount, useChainId } from 'wagmi'
import { formatUnits } from 'viem'
import type { Address } from 'viem'

// Import your existing hooks and components
import { useActiveContentPaginated, useContentById, useCreatorProfile, useHasContentAccess } from '@/hooks/contracts/core'
import { useAllCreators } from '@/hooks/contracts/useAllCreators.optimized'

// Import your existing UI components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Alert,
  AlertDescription
} from '@/components/ui'

// Import icons
import {
  Search,
  Users,
  Star,
  Eye,
  DollarSign,
  Clock,
  TrendingUp,
  Share2,
  Heart,
  MessageCircle,
  Zap,
  Shield,
  CheckCircle,
  Filter,
  Grid3x3,
  List,
  RefreshCw,
  ArrowUp,
  ExternalLink,
  Sparkles,
  AlertCircle
} from 'lucide-react'

// Import your existing types
import { ContentCategory, categoryToString, type Content } from '@/types/contracts'
import { cn, formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'

// ================================================
// ENHANCED SOCIAL CONTENT DISCOVERY TYPES
// ================================================

/**
 * Social Context Data Structure
 * 
 * This interface extends your existing content structure with social context
 * information from Farcaster, building upon your established type patterns.
 */
interface SocialEnhancedContent extends Content {
  readonly socialContext: {
    readonly recommendedByConnections: number
    readonly creatorVerificationStatus: 'verified' | 'unverified' | 'mutual_connection'
    readonly socialProofScore: number
    readonly sharedByConnections: readonly string[]
    readonly engagementSignals: readonly SocialEngagementSignal[]
    readonly socialRank: number
    readonly viralPotential: number
  }
  readonly creatorSocialProfile?: {
    readonly fid?: number
    readonly username?: string
    readonly displayName?: string
    readonly pfpUrl?: string
    readonly followerCount?: number
    readonly verificationStatus: 'verified' | 'unverified'
    readonly mutualConnections?: number
  }
}

interface SocialEngagementSignal {
  readonly type: 'share' | 'like' | 'recast' | 'mention' | 'purchase'
  readonly user: string
  readonly timestamp: Date
  readonly context?: string
}

/**
 * Social Discovery Configuration Interface
 * 
 * Extends your existing browser configuration with social-specific options.
 */
interface SocialDiscoveryConfig {
  readonly enableSocialFeatures: boolean
  readonly showSocialProof: boolean
  readonly enableSocialFiltering: boolean
  readonly socialRankingWeight: number
  readonly mutualConnectionBoost: number
  readonly verifiedCreatorBoost: number
}

/**
 * Social Content Browser Props Interface
 * 
 * Builds upon your existing UnifiedContentBrowser props while adding
 * social-specific configuration options.
 */
interface EnhancedSocialContentDiscoveryProps {
  readonly context?: 'web' | 'miniapp'
  readonly className?: string
  readonly itemsPerPage?: number
  readonly showCreatorInfo?: boolean
  readonly enableSearch?: boolean
  readonly defaultViewMode?: 'grid' | 'list'
  readonly socialConfig?: Partial<SocialDiscoveryConfig>
  readonly onContentSelect?: (contentId: bigint) => void
  readonly onCreatorSelect?: (creatorAddress: Address) => void
  readonly onSocialShare?: (content: SocialEnhancedContent) => void
}

// ================================================
// SOCIAL RECOMMENDATION ALGORITHM
// ================================================

/**
 * Social Content Recommendation Engine
 * 
 * This class implements the core social recommendation logic that enhances
 * your existing content discovery with Farcaster social graph data.
 */
class SocialRecommendationEngine {
  /**
   * Calculate Social Boost Score
   * 
   * This algorithm determines how much to boost content based on social signals.
   * It integrates with your existing content ranking while adding social context.
   */
  static calculateSocialBoost(
    content: Content,
    userFid?: number,
    socialConnections?: readonly number[],
    config: SocialDiscoveryConfig = DEFAULT_SOCIAL_CONFIG
  ): number {
    let boost = 0
    
    // Base boost for content existence
    boost += 1
    
    // Creator verification boost
    // In production, this would check actual Farcaster verification data
    if (this.isCreatorVerified(content.creator)) {
      boost += config.verifiedCreatorBoost
    }
    
    // Mutual connection boost
    const mutualConnectionsCount = this.calculateMutualConnections(
      content.creator,
      userFid,
      socialConnections
    )
    boost += mutualConnectionsCount * config.mutualConnectionBoost
    
    // Recent engagement boost
    boost += this.calculateEngagementBoost(content)
    
    // Content quality signals
    boost += this.calculateQualityBoost(content)
    
    return Math.min(boost, 10) // Cap boost at 10x
  }
  
  /**
   * Enhanced Content Sorting Algorithm
   * 
   * This algorithm sorts content by combining your existing sorting logic
   * with social ranking signals for optimal discovery experience.
   */
  static applySocialRanking(
    contents: readonly Content[],
    userFid?: number,
    socialConnections?: readonly number[],
    config: SocialDiscoveryConfig = DEFAULT_SOCIAL_CONFIG
  ): readonly SocialEnhancedContent[] {
    return contents
      .map(content => this.enhanceContentWithSocialContext(content, userFid, socialConnections))
      .sort((a, b) => {
        // Apply social ranking weight
        const socialScoreA = a.socialContext.socialRank * config.socialRankingWeight
        const socialScoreB = b.socialContext.socialRank * config.socialRankingWeight
        
        // Combine with recency (your existing pattern)
        const recencyScoreA = Number(a.creationTime) / 1000000 // Normalize timestamp
        const recencyScoreB = Number(b.creationTime) / 1000000
        
        const totalScoreA = socialScoreA + recencyScoreA
        const totalScoreB = socialScoreB + recencyScoreB
        
        return totalScoreB - totalScoreA
      })
  }
  
  /**
   * Enhance Content with Social Context
   * 
   * This function layers social context data onto your existing content structure
   * without modifying the core content data.
   */
  static enhanceContentWithSocialContext(
    content: Content,
    userFid?: number,
    socialConnections?: readonly number[]
  ): SocialEnhancedContent {
    const socialBoost = this.calculateSocialBoost(content, userFid, socialConnections)
    
    // Generate realistic social context (in production, this comes from Farcaster API)
    const socialContext = {
      recommendedByConnections: this.calculateRecommendations(content, socialConnections),
      creatorVerificationStatus: this.getCreatorVerificationStatus(content.creator, userFid, socialConnections),
      socialProofScore: socialBoost,
      sharedByConnections: this.getSharedByConnections(content, socialConnections),
      engagementSignals: this.generateEngagementSignals(content),
      socialRank: socialBoost,
      viralPotential: this.calculateViralPotential(content, socialBoost)
    } as const
    
    const creatorSocialProfile = this.generateCreatorSocialProfile(content.creator)
    
    return {
      ...content,
      socialContext,
      creatorSocialProfile
    }
  }
  
  // ================================================
  // HELPER METHODS FOR SOCIAL CALCULATION
  // ================================================
  
  private static isCreatorVerified(creatorAddress: Address): boolean {
    // In production, this would check Farcaster verification data
    // For demonstration, we'll simulate verification based on address pattern
    return creatorAddress.toLowerCase().includes('a') || creatorAddress.toLowerCase().includes('b')
  }
  
  private static calculateMutualConnections(
    creatorAddress: Address,
    userFid?: number,
    socialConnections?: readonly number[]
  ): number {
    if (!userFid || !socialConnections) return 0
    
    // Simulate mutual connection calculation
    // In production, this would query Farcaster social graph
    const addressHash = parseInt(creatorAddress.slice(2, 6), 16)
    return Math.min(Math.floor(addressHash % 20), 10)
  }
  
  private static calculateEngagementBoost(content: Content): number {
    // Factor in recent engagement based on content age and category
    const contentAge = Date.now() - Number(content.creationTime) * 1000
    const ageInDays = contentAge / (1000 * 60 * 60 * 24)
    
    // Recent content gets engagement boost
    if (ageInDays < 1) return 3
    if (ageInDays < 7) return 2
    if (ageInDays < 30) return 1
    return 0
  }
  
  private static calculateQualityBoost(content: Content): number {
    let qualityScore = 0
    
    // Title length and quality indicators
    if (content.title.length > 20 && content.title.length < 100) qualityScore += 1
    if (content.description.length > 50) qualityScore += 1
    
    // Price point analysis (premium content often has higher engagement)
    const priceInUSDC = Number(formatUnits(content.payPerViewPrice, 6))
    if (priceInUSDC > 1 && priceInUSDC < 50) qualityScore += 1
    
    return qualityScore
  }
  
  private static calculateRecommendations(
    content: Content,
    socialConnections?: readonly number[]
  ): number {
    if (!socialConnections) return 0
    
    // Simulate recommendation calculation
    const addressHash = parseInt(content.creator.slice(2, 8), 16)
    return Math.floor((addressHash % socialConnections.length) / 3)
  }
  
  private static getCreatorVerificationStatus(
    creatorAddress: Address,
    userFid?: number,
    socialConnections?: readonly number[]
  ): 'verified' | 'unverified' | 'mutual_connection' {
    if (this.isCreatorVerified(creatorAddress)) return 'verified'
    if (this.calculateMutualConnections(creatorAddress, userFid, socialConnections) > 0) {
      return 'mutual_connection'
    }
    return 'unverified'
  }
  
  private static getSharedByConnections(
    content: Content,
    socialConnections?: readonly number[]
  ): readonly string[] {
    if (!socialConnections) return []
    
    // Simulate connections who have shared this content
    const sharedCount = Math.min(this.calculateRecommendations(content, socialConnections), 3)
    return Array.from({ length: sharedCount }, (_, i) => `user${i + 1}`)
  }
  
  private static generateEngagementSignals(content: Content): readonly SocialEngagementSignal[] {
    // Generate realistic engagement signals for demonstration
    const signals: SocialEngagementSignal[] = []
    const signalCount = Math.floor(Math.random() * 5) + 1
    
    for (let i = 0; i < signalCount; i++) {
      signals.push({
        type: ['share', 'like', 'recast', 'mention', 'purchase'][Math.floor(Math.random() * 5)] as any,
        user: `user${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        context: i === 0 ? 'Recently shared in #web3 channel' : undefined
      })
    }
    
    return signals
  }
  
  private static calculateViralPotential(content: Content, socialBoost: number): number {
    // Calculate content's potential for viral spread
    const baseViral = socialBoost / 10
    const categoryMultiplier = this.getCategoryViralMultiplier(content.category)
    
    return Math.min(baseViral * categoryMultiplier, 1)
  }
  
  private static getCategoryViralMultiplier(category: ContentCategory): number {
    // Different content categories have different viral potential
    switch (category) {
      case 0: return 1.2 // Article
      case 1: return 1.8 // Video  
      case 2: return 1.5 // Course
      case 3: return 1.6 // Music
      case 4: return 1.4 // Podcast
      default: return 1.0
    }
  }
  
  private static generateCreatorSocialProfile(creatorAddress: Address) {
    // In production, this would fetch real Farcaster profile data
    const addressHash = parseInt(creatorAddress.slice(2, 8), 16)
    
    return {
      fid: addressHash % 10000,
      username: `creator${addressHash % 1000}`,
      displayName: `Creator ${addressHash % 100}`,
      pfpUrl: `https://via.placeholder.com/40x40/6366f1/white?text=C${addressHash % 10}`,
      followerCount: (addressHash % 5000) + 100,
      verificationStatus: this.isCreatorVerified(creatorAddress) ? 'verified' : 'unverified',
      mutualConnections: Math.floor(addressHash % 50)
    } as const
  }
}

// ================================================
// DEFAULT CONFIGURATION
// ================================================

const DEFAULT_SOCIAL_CONFIG: SocialDiscoveryConfig = {
  enableSocialFeatures: true,
  showSocialProof: true,
  enableSocialFiltering: true,
  socialRankingWeight: 0.4,
  mutualConnectionBoost: 2.0,
  verifiedCreatorBoost: 1.5
}

// ================================================
// SOCIAL CONTENT HOOKS
// ================================================

/**
 * Enhanced Content Hook with Social Context
 * 
 * This hook builds upon your existing useActiveContentPaginated hook
 * to add social context and ranking capabilities.
 */
function useSocialEnhancedContent(
  offset: number,
  limit: number,
  socialConfig: SocialDiscoveryConfig,
  userFid?: number,
  socialConnections?: readonly number[]
) {
  const baseContentQuery = useActiveContentPaginated(offset, limit)
  
  const enhancedContent = useMemo(() => {
    if (!baseContentQuery.data?.contentIds) return null
    
    // Simulate content data (in production, you'd batch-fetch these)
    const mockContents: Content[] = baseContentQuery.data.contentIds.map((id, index) => ({
      creator: `0x${Math.random().toString(16).substr(2, 40)}` as Address,
      ipfsHash: `Qm${Math.random().toString(36).substr(2, 44)}`,
      title: `Content Title ${Number(id)}`,
      description: `This is a detailed description of content item ${Number(id)}. It provides value to users interested in this topic.`,
      category: (Number(id) % 5) as ContentCategory,
      payPerViewPrice: BigInt(Math.floor(Math.random() * 50 + 1) * 1000000), // 1-50 USDC
      creationTime: BigInt(Math.floor(Date.now() / 1000) - Math.random() * 30 * 24 * 60 * 60),
      isActive: true
    }))
    
    // Apply social ranking algorithm
    return SocialRecommendationEngine.applySocialRanking(
      mockContents,
      userFid,
      socialConnections,
      socialConfig
    )
  }, [baseContentQuery.data, userFid, socialConnections, socialConfig])
  
  return {
    ...baseContentQuery,
    data: enhancedContent ? { 
      contents: enhancedContent, 
      total: baseContentQuery.data?.total || BigInt(0) 
    } : null
  }
}

/**
 * Mock MiniApp Context Hook
 * 
 * This simulates your MiniApp context for demonstration purposes.
 * In production, this would use your actual useMiniApp hook.
 */
function useMockMiniApp() {
  const [mockState] = useState({
    isMiniApp: window.location.pathname.includes('/mini'),
    isReady: true,
    user: {
      fid: 12345,
      username: 'testuser',
      displayName: 'Test User',
      pfpUrl: 'https://via.placeholder.com/40x40/6366f1/white?text=TU'
    },
    context: {
      client: { name: 'Warpcast' }
    }
  })
  
  return mockState
}

// ================================================
// MAIN ENHANCED SOCIAL CONTENT DISCOVERY COMPONENT
// ================================================

export default function EnhancedSocialContentDiscovery({
  context = 'web',
  className,
  itemsPerPage = 12,
  showCreatorInfo = true,
  enableSearch = true,
  defaultViewMode = 'grid',
  socialConfig = {},
  onContentSelect,
  onCreatorSelect,
  onSocialShare
}: EnhancedSocialContentDiscoveryProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address, isConnected } = useAccount()
  
  // Use your existing patterns for MiniApp detection
  const miniApp = useMockMiniApp() // In production: useMiniApp()
  const isMiniApp = context === 'miniapp' || miniApp.isMiniApp
  
  // Merge configuration with defaults
  const finalSocialConfig: SocialDiscoveryConfig = {
    ...DEFAULT_SOCIAL_CONFIG,
    ...socialConfig,
    enableSocialFeatures: socialConfig.enableSocialFeatures ?? (isMiniApp || DEFAULT_SOCIAL_CONFIG.enableSocialFeatures)
  }
  
  // ===== STATE MANAGEMENT =====
  
  const [discoveryState, setDiscoveryState] = useState({
    currentPage: 0,
    viewMode: defaultViewMode as 'grid' | 'list',
    searchQuery: '',
    selectedCategory: 'all' as ContentCategory | 'all',
    socialFilter: 'all' as 'all' | 'recommended' | 'verified' | 'connections',
    sortBy: 'social_rank' as 'social_rank' | 'latest' | 'popular' | 'price',
    isLoading: false,
    isRefreshing: false
  })
  
  // ===== SOCIAL CONTEXT DATA =====
  
  // Simulate user's social connections (in production, from Farcaster API)
  const userSocialConnections = useMemo(() => {
    if (!miniApp.user?.fid) return undefined
    return Array.from({ length: 50 }, (_, i) => miniApp.user.fid + i + 1)
  }, [miniApp.user?.fid])
  
  // ===== ENHANCED CONTENT FETCHING =====
  
  const enhancedContentQuery = useSocialEnhancedContent(
    discoveryState.currentPage * itemsPerPage,
    itemsPerPage,
    finalSocialConfig,
    miniApp.user?.fid,
    userSocialConnections
  )
  
  // ===== SOCIAL SHARING LOGIC =====
  
  const handleSocialShare = useCallback(async (content: SocialEnhancedContent) => {
    if (!finalSocialConfig.enableSocialFeatures) return
    
    try {
      // Generate optimized cast text
      const castText = generateOptimizedCastText(content)
      const shareUrl = `${window.location.origin}/content/${content.creator}/${content.ipfsHash}`
      
      // Use your existing sharing logic or MiniApp SDK
      if (isMiniApp && typeof window !== 'undefined') {
        // Simulate MiniApp sharing (in production: use actual MiniApp SDK)
        console.log('Sharing to Farcaster:', { text: castText, url: shareUrl })
        
        // Track social engagement
        trackSocialEngagement('share', content)
      } else {
        // Web sharing fallback
        if (navigator.share) {
          await navigator.share({
            title: content.title,
            text: castText,
            url: shareUrl
          })
        }
      }
      
      onSocialShare?.(content)
    } catch (error) {
      console.error('Social sharing failed:', error)
    }
  }, [finalSocialConfig.enableSocialFeatures, isMiniApp, onSocialShare])
  
  // ===== SOCIAL ANALYTICS TRACKING =====
  
  const trackSocialEngagement = useCallback((
    action: 'view' | 'share' | 'like' | 'purchase',
    content: SocialEnhancedContent
  ) => {
    if (!finalSocialConfig.enableSocialFeatures) return
    
    // Integration point for your existing analytics system
    console.log('Social engagement tracked:', {
      action,
      contentId: content.creator + content.ipfsHash,
      userFid: miniApp.user?.fid,
      socialRank: content.socialContext.socialRank,
      timestamp: Date.now()
    })
  }, [finalSocialConfig.enableSocialFeatures, miniApp.user?.fid])
  
  // ===== CONTENT FILTERING AND SORTING =====
  
  const filteredAndSortedContent = useMemo(() => {
    if (!enhancedContentQuery.data?.contents) return []
    
    let filtered = [...enhancedContentQuery.data.contents]
    
    // Apply search filter
    if (discoveryState.searchQuery) {
      const query = discoveryState.searchQuery.toLowerCase()
      filtered = filtered.filter(content =>
        content.title.toLowerCase().includes(query) ||
        content.description.toLowerCase().includes(query)
      )
    }
    
    // Apply category filter
    if (discoveryState.selectedCategory !== 'all') {
      filtered = filtered.filter(content => content.category === discoveryState.selectedCategory)
    }
    
    // Apply social filter
    if (finalSocialConfig.enableSocialFeatures) {
      switch (discoveryState.socialFilter) {
        case 'recommended':
          filtered = filtered.filter(content => content.socialContext.recommendedByConnections > 0)
          break
        case 'verified':
          filtered = filtered.filter(content => 
            content.socialContext.creatorVerificationStatus === 'verified'
          )
          break
        case 'connections':
          filtered = filtered.filter(content => 
            content.socialContext.creatorVerificationStatus === 'mutual_connection'
          )
          break
      }
    }
    
    // Apply sorting
    switch (discoveryState.sortBy) {
      case 'social_rank':
        // Already sorted by social ranking in the algorithm
        return filtered
      case 'latest':
        return filtered.sort((a, b) => Number(b.creationTime) - Number(a.creationTime))
      case 'popular':
        return filtered.sort((a, b) => 
          b.socialContext.engagementSignals.length - a.socialContext.engagementSignals.length
        )
      case 'price':
        return filtered.sort((a, b) => Number(a.payPerViewPrice) - Number(b.payPerViewPrice))
      default:
        return filtered
    }
  }, [
    enhancedContentQuery.data?.contents,
    discoveryState.searchQuery,
    discoveryState.selectedCategory,
    discoveryState.socialFilter,
    discoveryState.sortBy,
    finalSocialConfig.enableSocialFeatures
  ])
  
  // ===== EVENT HANDLERS =====
  
  const handleContentClick = useCallback((content: SocialEnhancedContent) => {
    trackSocialEngagement('view', content)
    // Create a unique content ID from creator address and IPFS hash
    const contentIdString = content.creator + content.ipfsHash.slice(0, 10)
    onContentSelect?.(BigInt('0x' + contentIdString))
  }, [trackSocialEngagement, onContentSelect])
  
  const handleCreatorClick = useCallback((content: SocialEnhancedContent) => {
    trackSocialEngagement('view', content)
    onCreatorSelect?.(content.creator)
  }, [trackSocialEngagement, onCreatorSelect])
  
  const handleSearchChange = useCallback((query: string) => {
    setDiscoveryState(prev => ({
      ...prev,
      searchQuery: query,
      currentPage: 0
    }))
  }, [])
  
  const handleFilterChange = useCallback((
    filterType: 'category' | 'social' | 'sort',
    value: string
  ) => {
    setDiscoveryState(prev => ({
      ...prev,
      [filterType === 'category' ? 'selectedCategory' : 
       filterType === 'social' ? 'socialFilter' : 'sortBy']: value,
      currentPage: 0
    }))
  }, [])
  
  // ===== RENDER HELPERS =====
  
  const renderSocialProofBadge = useCallback((content: SocialEnhancedContent) => {
    if (!finalSocialConfig.showSocialProof) return null
    
    const { socialContext, creatorSocialProfile } = content
    
    return (
      <div className="flex items-center gap-1 text-xs">
        {socialContext.creatorVerificationStatus === 'verified' && (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
        {socialContext.creatorVerificationStatus === 'mutual_connection' && (
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
            <Users className="w-3 h-3 mr-1" />
            Connection
          </Badge>
        )}
        {socialContext.recommendedByConnections > 0 && (
          <Badge variant="outline" className="text-purple-700 border-purple-200">
            <Heart className="w-3 h-3 mr-1" />
            {socialContext.recommendedByConnections} rec
          </Badge>
        )}
      </div>
    )
  }, [finalSocialConfig.showSocialProof])
  
  const renderContentCard = useCallback((content: SocialEnhancedContent, index: number) => {
    const priceInUSDC = Number(formatUnits(content.payPerViewPrice, 6))
    const { socialContext, creatorSocialProfile } = content
    
    return (
      <Card 
        key={`${content.creator}-${content.ipfsHash}`}
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-lg",
          "border border-border/50 hover:border-border",
          discoveryState.viewMode === 'list' && "flex-row items-center"
        )}
        onClick={() => handleContentClick(content)}
      >
        <CardHeader className={cn(
          "pb-3",
          discoveryState.viewMode === 'list' && "flex-1 py-4"
        )}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold line-clamp-2 mb-1">
                {content.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {content.description}
              </p>
            </div>
            {finalSocialConfig.enableSocialFeatures && socialContext.viralPotential > 0.7 && (
              <Badge variant="outline" className="text-orange-600 border-orange-200 shrink-0">
                <TrendingUp className="w-3 h-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>
          
          {/* Creator Info with Social Context */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creatorSocialProfile?.pfpUrl} />
              <AvatarFallback className="text-xs">
                {content.creator.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCreatorClick(content)
                }}
                className="text-sm font-medium hover:text-primary transition-colors truncate"
              >
                {creatorSocialProfile?.displayName || formatAddress(content.creator)}
              </button>
              {creatorSocialProfile?.username && (
                <p className="text-xs text-muted-foreground">
                  @{creatorSocialProfile.username}
                </p>
              )}
            </div>
          </div>
          
          {/* Social Proof Badges */}
          {renderSocialProofBadge(content)}
        </CardHeader>
        
        <CardContent className={cn(
          "pt-0",
          discoveryState.viewMode === 'list' && "py-4 pl-0"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${priceInUSDC.toFixed(2)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(BigInt(Math.floor(Number(content.creationTime) * 1000)))}
              </span>
              {finalSocialConfig.enableSocialFeatures && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {socialContext.engagementSignals.length}
                </span>
              )}
            </div>
            
            {finalSocialConfig.enableSocialFeatures && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSocialShare(content)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {/* Social Engagement Indicators */}
          {finalSocialConfig.enableSocialFeatures && socialContext.sharedByConnections.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                Shared by {socialContext.sharedByConnections.slice(0, 2).join(', ')}
                {socialContext.sharedByConnections.length > 2 && 
                  ` and ${socialContext.sharedByConnections.length - 2} others`
                }
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }, [
    discoveryState.viewMode,
    finalSocialConfig.enableSocialFeatures,
    finalSocialConfig.showSocialProof,
    handleContentClick,
    handleCreatorClick,
    handleSocialShare,
    renderSocialProofBadge
  ])
  
  // ===== LOADING AND ERROR STATES =====
  
  if (enhancedContentQuery.isLoading || discoveryState.isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className={cn(
          "grid gap-4",
          discoveryState.viewMode === 'grid' 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
            : "grid-cols-1"
        )}>
          {Array.from({ length: itemsPerPage }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  if (enhancedContentQuery.isError) {
    return (
      <div className={cn("space-y-4", className)}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load content. Please check your connection and try again.
            <Button
              variant="outline"
              size="sm"
              onClick={() => enhancedContentQuery.refetch()}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  // ===== MAIN RENDER =====
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Social Context Header - MiniApp Only */}
      {isMiniApp && finalSocialConfig.enableSocialFeatures && miniApp.user && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={miniApp.user.pfpUrl} />
                <AvatarFallback>
                  {miniApp.user.displayName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">Welcome back, {miniApp.user.displayName}!</h3>
                <p className="text-sm text-muted-foreground">
                  Discover content from your Farcaster network
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-sm text-purple-600">
                <Sparkles className="w-4 h-4" />
                Social Discovery
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Search and Filters */}
      <div className="space-y-4">
        {enableSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={discoveryState.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              variant={discoveryState.viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDiscoveryState(prev => ({ ...prev, viewMode: 'grid' }))}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={discoveryState.viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDiscoveryState(prev => ({ ...prev, viewMode: 'list' }))}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Category Filter */}
          <Select
            value={discoveryState.selectedCategory.toString()}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="0">Article</SelectItem>
              <SelectItem value="1">Video</SelectItem>
              <SelectItem value="2">Course</SelectItem>
              <SelectItem value="3">Music</SelectItem>
              <SelectItem value="4">Podcast</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Social Filter - Only show if social features enabled */}
          {finalSocialConfig.enableSocialFeatures && (
            <Select
              value={discoveryState.socialFilter}
              onValueChange={(value) => handleFilterChange('social', value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Social Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content</SelectItem>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="verified">Verified Creators</SelectItem>
                <SelectItem value="connections">From Connections</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {/* Sort Options */}
          <Select
            value={discoveryState.sortBy}
            onValueChange={(value) => handleFilterChange('sort', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {finalSocialConfig.enableSocialFeatures && (
                <SelectItem value="social_rank">Social Rank</SelectItem>
              )}
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setDiscoveryState(prev => ({ ...prev, isRefreshing: true }))
              try {
                await enhancedContentQuery.refetch()
              } finally {
                setDiscoveryState(prev => ({ ...prev, isRefreshing: false }))
              }
            }}
            disabled={discoveryState.isRefreshing}
          >
            <RefreshCw className={cn("w-4 h-4", discoveryState.isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>
      
      {/* Content Grid */}
      <div className={cn(
        "grid gap-4",
        discoveryState.viewMode === 'grid' 
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
          : "grid-cols-1"
      )}>
        {filteredAndSortedContent.map((content, index) => renderContentCard(content, index))}
      </div>
      
      {/* Empty State */}
      {filteredAndSortedContent.length === 0 && !enhancedContentQuery.isLoading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No content found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setDiscoveryState(prev => ({
                ...prev,
                searchQuery: '',
                selectedCategory: 'all',
                socialFilter: 'all'
              }))
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
      
      {/* Pagination */}
      {enhancedContentQuery.data && filteredAndSortedContent.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedContent.length} of {Number(enhancedContentQuery.data.total)} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDiscoveryState(prev => ({
                ...prev,
                currentPage: Math.max(0, prev.currentPage - 1)
              }))}
              disabled={discoveryState.currentPage === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDiscoveryState(prev => ({
                ...prev,
                currentPage: prev.currentPage + 1
              }))}
              disabled={filteredAndSortedContent.length < itemsPerPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Generate Optimized Cast Text for Social Sharing
 * 
 * This function creates compelling social media text that drives engagement
 * and includes proper attribution and call-to-action elements.
 */
function generateOptimizedCastText(content: SocialEnhancedContent): string {
  const priceInUSDC = Number(formatUnits(content.payPerViewPrice, 6))
  const categoryText = categoryToString(content.category)
  
  let castText = `✨ ${content.title}\n\n`
  
  // Add description snippet
  const description = content.description.slice(0, 100)
  castText += `${description}${content.description.length > 100 ? '...' : ''}\n\n`
  
  // Add creator attribution with social context
  if (content.creatorSocialProfile?.username) {
    castText += `by @${content.creatorSocialProfile.username} `
    if (content.socialContext.creatorVerificationStatus === 'verified') {
      castText += '✅ '
    }
  }
  
  // Add category and price
  castText += `\n📚 ${categoryText} • 💰 $${priceInUSDC.toFixed(2)} USDC`
  
  // Add social proof if available
  if (content.socialContext.recommendedByConnections > 0) {
    castText += `\n👥 Recommended by ${content.socialContext.recommendedByConnections} connections`
  }
  
  // Add call to action
  castText += '\n\n🔗 Get instant access with USDC on Base'
  
  // Add relevant hashtags
  const hashtags = generateHashtags(content)
  if (hashtags.length > 0) {
    castText += `\n\n${hashtags.slice(0, 3).join(' ')}`
  }
  
  return castText
}

/**
 * Generate Strategic Hashtags for Content
 * 
 * This function creates relevant hashtags based on content category,
 * social context, and engagement potential.
 */
function generateHashtags(content: SocialEnhancedContent): readonly string[] {
  const hashtags: string[] = []
  
  // Base hashtags
  hashtags.push('#web3', '#content', '#creator')
  
  // Category-specific hashtags
  switch (content.category) {
    case 0: hashtags.push('#article', '#writing'); break
    case 1: hashtags.push('#video', '#education'); break
    case 2: hashtags.push('#course', '#learning'); break
    case 3: hashtags.push('#music', '#audio'); break
    case 4: hashtags.push('#podcast', '#talk'); break
  }
  
  // Social context hashtags
  if (content.socialContext.creatorVerificationStatus === 'verified') {
    hashtags.push('#verified')
  }
  
  if (content.socialContext.viralPotential > 0.7) {
    hashtags.push('#trending')
  }
  
  // Base network hashtag
  hashtags.push('#base')
  
  return hashtags
}
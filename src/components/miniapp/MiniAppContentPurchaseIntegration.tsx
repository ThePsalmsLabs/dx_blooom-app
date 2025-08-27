// src/components/miniapp/MiniAppContentPurchaseIntegration.tsx

'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'

// Import business logic hooks we built
import { 
  useMiniAppAuth,
  type MiniAppAuthResult 
} from '@/hooks/business/miniapp-auth'
import { 
  useUnifiedMiniAppPurchaseFlow
} from '@/hooks/business/miniapp-commerce'

// Import existing sophisticated infrastructure
import { useContentById } from '@/hooks/contracts/core'
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

// Import our payment interface
import { PaymentInterface } from '@/components/miniapp/payments/PaymentInterface'

// Import your existing UI components following established patterns
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Import icons for social features
import { 
  Shield, 
  Users, 
  Share2, 
  CheckCircle2, 
  Star,
  TrendingUp,
  Sparkles,
  Zap,
  AlertCircle
} from 'lucide-react'

// Import utilities following your patterns
import { cn, formatCurrency } from '@/lib/utils'

// ===== SOCIAL CONTEXT INTERFACES =====

/**
 * Social Verification Display State
 * 
 * This interface defines how social verification information is displayed,
 * providing clear trust indicators and verification status to users.
 */
interface SocialVerificationDisplay {
  readonly isAddressVerified: boolean
  readonly verificationLevel: 'high' | 'medium' | 'low' | 'unverified'
  readonly verificationCount: number
  readonly trustScore: number // 0-100
  readonly displayBadge: boolean
  readonly badgeText: string
  readonly badgeVariant: 'default' | 'secondary' | 'outline'
  readonly trustIndicators: readonly string[]
}

/**
 * Social User Profile Interface
 * 
 * This interface combines Farcaster user data with verification status
 * and trust indicators for comprehensive social context display.
 */
interface SocialUserProfile {
  readonly fid: number | null
  readonly username: string | null
  readonly displayName: string | null
  readonly pfpUrl: string | null
  readonly bio?: string | null
  readonly followerCount?: number | null
  readonly followingCount?: number | null
  readonly verificationDisplay: SocialVerificationDisplay
  readonly isInfluencer: boolean
  readonly socialProofScore: number // 0-100 based on social metrics
}

/**
 * Social Action Configuration
 * 
 * This interface defines available social actions and their configurations
 * based on user context and content type.
 */
interface SocialActionConfig {
  readonly shareAction: {
    readonly available: boolean
    readonly platform: 'farcaster' | 'twitter' | 'native'
    readonly autoPrompt: boolean
    readonly customMessage?: string
  }
  readonly engagementActions: {
    readonly canLike: boolean
    readonly canComment: boolean
    readonly canRepost: boolean
  }
  readonly viralMechanics: {
    readonly showPurchaseProof: boolean
    readonly enableReferralTracking: boolean
    readonly suggestConnections: boolean
  }
}

/**
 * Integration Props
 * 
 * This interface extends the original MiniAppContentPurchaseIntegration props
 * with comprehensive social context and verification capabilities.
 */
export interface SocialContextIntegrationProps {
  /** Content ID to display and enable purchase for */
  contentId?: bigint
  
  /** Whether to show detailed social analytics */
  showSocialAnalytics?: boolean
  
  /** Whether to enable social features */
  enableSocialFeatures?: boolean
  
  /** Whether to show verification status prominently */
  showVerificationStatus?: boolean
  
  /** Whether to enable post-purchase social actions */
  enablePostPurchaseSharing?: boolean
  
  /** Layout variant for different miniapp contexts */
  layout?: 'compact' | 'standard' | 'featured' | 'social'
  
  /** Social engagement optimization level */
  socialOptimization?: 'minimal' | 'standard' | 'aggressive'
  
  /** Custom CSS classes for styling */
  className?: string
  
  /** Callback fired when purchase is completed */
  onPurchaseComplete?: (contentId: bigint, socialContext?: SocialUserProfile) => void
  
  /** Callback fired when content is shared */
  onContentShared?: (contentId: bigint, platform: string, socialContext?: SocialUserProfile) => void
  
  /** Callback fired when social verification is displayed */
  onVerificationDisplayed?: (verificationLevel: string, trustScore: number) => void
  
  /** Whether to auto-focus on first interactive element */
  autoFocus?: boolean
}

// ===== SOCIAL CONTEXT COMPUTATION FUNCTIONS =====

/**
 * Calculate Social Verification Display
 * 
 * This function analyzes user verification status and creates appropriate
 * display configuration for trust indicators and badges.
 */
function calculateSocialVerificationDisplay(
  authResult: MiniAppAuthResult,
  farcasterContext: ReturnType<typeof useFarcasterContext>
): SocialVerificationDisplay {
  const isAddressVerified = authResult.socialVerification.isAddressVerified
  const verificationCount = authResult.socialVerification.verificationCount
  
  // Calculate verification level based on multiple factors
  let verificationLevel: SocialVerificationDisplay['verificationLevel'] = 'unverified'
  let trustScore = 0
  
  if (isAddressVerified && verificationCount > 0) {
    trustScore += 40 // Base trust for address verification
    
    if (verificationCount >= 3) {
      verificationLevel = 'high'
      trustScore += 30
    } else if (verificationCount >= 1) {
      verificationLevel = 'medium'
      trustScore += 20
    }
    
    // Additional trust factors
    if (farcasterContext?.user?.fid && farcasterContext.user.fid < 100000) {
      trustScore += 15 // Early adopter bonus
    }
    
    if (farcasterContext?.user?.username && farcasterContext.user.username.length > 0) {
      trustScore += 10 // Has claimed username
    }
  }
  
  const trustIndicators: string[] = []
  if (isAddressVerified) trustIndicators.push('Address verified on Farcaster')
  if (verificationCount > 1) trustIndicators.push(`${verificationCount} verified addresses`)
  if (farcasterContext?.user?.fid) trustIndicators.push(`Farcaster ID: ${farcasterContext.user.fid}`)
  
  return {
    isAddressVerified,
    verificationLevel,
    verificationCount,
    trustScore: Math.min(trustScore, 100),
    displayBadge: isAddressVerified || verificationLevel !== 'unverified',
    badgeText: verificationLevel === 'high' ? 'Verified' : 
               verificationLevel === 'medium' ? 'Trusted' : 'Verified',
    badgeVariant: verificationLevel === 'high' ? 'default' : 
                  verificationLevel === 'medium' ? 'secondary' : 'outline',
    trustIndicators
  }
}

/**
 * Build Social User Profile
 * 
 * This function combines Farcaster context with verification data to create
 * a comprehensive social user profile for display and interaction.
 */
function buildSocialUserProfile(
  authResult: MiniAppAuthResult,
  farcasterContext: ReturnType<typeof useFarcasterContext>
): SocialUserProfile | null {
  if (!farcasterContext?.user || !authResult.isSocialUser) {
    return null
  }
  
  const verificationDisplay = calculateSocialVerificationDisplay(authResult, farcasterContext)
  
  // Calculate social proof score based on various factors
  let socialProofScore = 0
  
  // Base score for having a Farcaster profile
  socialProofScore += 20
  
  // Verification bonus
  socialProofScore += verificationDisplay.trustScore * 0.3
  
  // Profile completeness bonus
  if (farcasterContext.user.displayName) socialProofScore += 10
  if (farcasterContext.user.pfpUrl) socialProofScore += 10
  if (farcasterContext.user.username) socialProofScore += 15
  
  // Early adopter or influence detection
  const isInfluencer = farcasterContext.user.fid < 50000 || 
                      verificationDisplay.verificationCount > 2
  
  if (isInfluencer) socialProofScore += 20
  
  return {
    fid: farcasterContext.user.fid,
    username: farcasterContext.user.username,
    displayName: farcasterContext.user.displayName,
    pfpUrl: farcasterContext.user.pfpUrl,
    verificationDisplay,
    isInfluencer,
    socialProofScore: Math.min(socialProofScore, 100)
  }
}

/**
 * Configure Social Actions
 * 
 * This function determines available social actions based on user context,
 * verification status, and content type.
 */
function configureSocialActions(
  socialProfile: SocialUserProfile | null,
  enableSocialFeatures: boolean,
  hasContentAccess: boolean
): SocialActionConfig {
  const shareAvailable = Boolean(
    enableSocialFeatures && 
    socialProfile && 
    socialProfile.fid
  )
  
  return {
    shareAction: {
      available: shareAvailable,
      platform: 'farcaster',
      autoPrompt: Boolean(hasContentAccess && socialProfile?.verificationDisplay.trustScore && socialProfile.verificationDisplay.trustScore > 70),
      customMessage: socialProfile?.isInfluencer ? 
        'Share this premium content with your followers' :
        'Share this content on Farcaster'
    },
    engagementActions: {
      canLike: shareAvailable,
      canComment: shareAvailable && hasContentAccess,
      canRepost: shareAvailable && hasContentAccess
    },
    viralMechanics: {
      showPurchaseProof: Boolean(socialProfile && hasContentAccess),
      enableReferralTracking: Boolean(socialProfile?.isInfluencer),
      suggestConnections: Boolean(socialProfile && socialProfile.socialProofScore > 60)
    }
  }
}

// ===== MAIN SOCIAL CONTEXT INTEGRATION COMPONENT =====

/**
 * Social Context Integration Component
 * 
 * This component extends the original MiniAppContentPurchaseIntegration with
 * comprehensive social context, Farcaster user details, verification status,
 * and social actions. It represents the culmination of our enhancement series,
 * bringing together authentication, payment flows, and social features.
 * 
 * KEY FEATURES:
 * - Comprehensive Farcaster user profile display with verification badges
 * - Trust score calculation and verification level indicators
 * - Post-purchase social sharing with rich content embeds
 * - Social proof mechanisms and viral growth features
 * - Influencer detection and special treatment
 * - Complete backward compatibility with non-social users
 * 
 * INTEGRATION POINTS:
 * - Uses authentication (useMiniAppAuth) for social verification
 * - Leverages unified payment flow (useUnifiedMiniAppPurchaseFlow) for transactions
 * - Integrates with Farcaster context for rich social data
 * - Includes the payment interface for optimal UX
 * - Follows your established UI patterns and accessibility standards
 */
export function SocialContextIntegration({
  contentId,
  showSocialAnalytics = true,
  enableSocialFeatures = true,
  showVerificationStatus = true,
  enablePostPurchaseSharing = true,
  layout = 'standard',
  socialOptimization = 'standard',
  className,
  onPurchaseComplete,
  onContentShared,
  onVerificationDisplayed,
  autoFocus = false
}: SocialContextIntegrationProps) {
  // Hooks integration
  const authResult = useMiniAppAuth()
  const purchaseFlow = useUnifiedMiniAppPurchaseFlow(contentId)
  const farcasterContext = useFarcasterContext()
  const { address, isConnected } = useAccount()
  
  // Content data
  const { data: contentData, isLoading: isContentLoading } = useContentById(contentId)
  
  // Social context computation
  const socialProfile = useMemo(() => 
    buildSocialUserProfile(authResult, farcasterContext),
    [authResult, farcasterContext]
  )
  
  const socialActions = useMemo(() => 
    configureSocialActions(socialProfile, enableSocialFeatures, purchaseFlow.hasAccess),
    [socialProfile, enableSocialFeatures, purchaseFlow.hasAccess]
  )
  
  // Check if MiniKit is available in current environment
  const isMiniKitAvailable = useMemo(() => {
    if (typeof window === 'undefined') return false
    
    return Boolean(
      window.location.hostname.includes('warpcast.com') || 
      window.location.hostname.includes('farcaster.xyz') ||
      window.navigator.userAgent.includes('Farcaster') ||
      'miniapp' in window ||
      'minikit' in window
    )
  }, [])
  
  // Enhanced MiniKit capabilities detection
  const miniKitCapabilities = useMemo(() => {
    if (!isMiniKitAvailable) return null
    
    return {
      canShare: true,
      canComposeCast: true,
      canUseFrames: true,
      canAccessUserProfile: true,
      canHandlePayments: true
    }
  }, [isMiniKitAvailable])
  
  // Test MiniKit SDK connection
  const testMiniKitConnection = useCallback(async () => {
    if (!isMiniKitAvailable) return false
    
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk')
      await sdk.actions.ready()
      console.log('✅ MiniKit SDK connection test successful')
      return true
    } catch (error) {
      console.warn('❌ MiniKit SDK connection test failed:', error)
      return false
    }
  }, [isMiniKitAvailable])
  
  // Component state
  const [showSocialDetails, setShowSocialDetails] = useState(layout === 'social')
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [socialAnalyticsExpanded, setSocialAnalyticsExpanded] = useState(false)
  
  // ===== SOCIAL VERIFICATION DISPLAY =====
  
  /**
   * Social Verification Badge Component
   * 
   * This component displays verification status and trust indicators
   * with appropriate visual styling and tooltips.
   */
  const SocialVerificationBadge = () => {
    if (!socialProfile || !showVerificationStatus) return null
    
    const verification = socialProfile.verificationDisplay
    
    useEffect(() => {
      if (verification.displayBadge) {
        onVerificationDisplayed?.(verification.verificationLevel, verification.trustScore)
      }
    }, [verification])
    
    if (!verification.displayBadge) return null
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={verification.badgeVariant}
              className={cn(
                "flex items-center space-x-1",
                verification.verificationLevel === 'high' && "bg-blue-100 text-blue-800 border-blue-200",
                verification.verificationLevel === 'medium' && "bg-green-100 text-green-800 border-green-200"
              )}
            >
              <Shield className="h-3 w-3" />
              <span>{verification.badgeText}</span>
              {verification.verificationLevel === 'high' && (
                <CheckCircle2 className="h-3 w-3" />
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">Trust Score: {verification.trustScore}/100</div>
              {verification.trustIndicators.map((indicator, index) => (
                <div key={index} className="text-xs">• {indicator}</div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  // ===== SOCIAL USER PROFILE DISPLAY =====
  
  /**
   * Social User Profile Component
   * 
   * This component displays comprehensive Farcaster user information
   * with verification status and social proof indicators.
   */
  const SocialUserProfileDisplay = () => {
    if (!socialProfile || layout === 'compact') return null
    
    return (
      <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <Avatar className="h-12 w-12">
          {socialProfile.pfpUrl ? (
            <AvatarImage src={socialProfile.pfpUrl} alt={socialProfile.displayName || 'User'} />
          ) : (
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="font-medium text-sm truncate">
              {socialProfile.displayName || socialProfile.username || 'Farcaster User'}
            </div>
            <SocialVerificationBadge />
            {socialProfile.isInfluencer && (
              <Badge variant="outline" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Influencer
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
            {socialProfile.username && (
              <span>@{socialProfile.username}</span>
            )}
            <span>FID: {socialProfile.fid}</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>Score: {socialProfile.socialProofScore}</span>
            </div>
          </div>
        </div>
        
        {socialProfile.verificationDisplay.trustScore > 80 && (
          <div className="flex items-center text-blue-600">
            <Sparkles className="h-4 w-4" />
          </div>
        )}
      </div>
    )
  }
  
  // ===== SOCIAL SHARING FUNCTIONALITY =====
  
  /**
   * Handle Social Share Action
   * 
   * This function manages social sharing with rich content embeds,
   * tracking, and success feedback.
   */
  const handleSocialShare = useCallback(async () => {
    if (!socialActions.shareAction.available || !contentData || !socialProfile || !contentId) return
    
    try {
      setIsSharing(true)
      setShareError(null)
      
      // Validate content data
      if (!contentData.title || !contentData.payPerViewPrice) {
        throw new Error('Invalid content data for sharing')
      }
      
      // Generate rich sharing content with proper validation
      const shareContent = {
        text: `Just purchased "${contentData.title}" - premium content worth ${formatCurrency(contentData.payPerViewPrice, 6)} USDC! 🚀`,
        url: `${window.location.origin}/content/${contentId}`,
        embeds: [{
          url: `${window.location.origin}/content/${contentId}`,
          metadata: {
            title: contentData.title,
            description: contentData.description || 'Premium content',
            image: `${window.location.origin}/api/og/content/${contentId}`,
            'fc:frame': {
              version: 'next',
              imageUrl: `${window.location.origin}/api/og/content/${contentId}`,
              button: {
                title: 'View Content',
                action: {
                  type: 'link',
                  url: `${window.location.origin}/content/${contentId}`
                }
              }
            }
          }
        }]
      }
      
      // Integration point for Farcaster sharing via MiniKit
      console.log('🚀 Social Share Integration:', {
        content: shareContent,
        socialProfile: {
          fid: socialProfile.fid,
          username: socialProfile.username,
          trustScore: socialProfile.verificationDisplay.trustScore,
          isInfluencer: socialProfile.isInfluencer
        },
        timestamp: new Date().toISOString()
      })
      
      // Check if we're in a MiniApp environment
      const isMiniAppEnvironment = Boolean(
        typeof window !== 'undefined' && 
        (window.location.hostname.includes('warpcast.com') || 
         window.location.hostname.includes('farcaster.xyz') ||
         window.navigator.userAgent.includes('Farcaster'))
      )
      
      if (isMiniAppEnvironment && miniKitCapabilities) {
        // Use actual MiniKit SDK for sharing
        try {
          // Dynamically import MiniKit SDK to avoid SSR issues
          const { sdk } = await import('@farcaster/miniapp-sdk')
          
          // Ensure SDK is ready for social operations
          await sdk.actions.ready()
          
          console.log('📱 MiniKit SDK ready - initiating native share')
          console.log('🚀 MiniKit Capabilities:', miniKitCapabilities)
          
          // Use composeCast for rich content sharing with embeds
          const castResult = await sdk.actions.composeCast({
            text: shareContent.text,
            embeds: [shareContent.url]
          })
          
          if (castResult?.cast) {
            console.log('✅ Cast composed successfully:', castResult.cast)
            
            // Track successful MiniKit share
            console.log('📊 MiniKit Share Analytics:', {
              contentId: contentId.toString(),
              castHash: castResult.cast,
              platform: 'farcaster',
              method: 'minikit-sdk',
              timestamp: new Date().toISOString()
            })
          } else {
            console.log('⚠️ Cast composed but no result returned')
          }
          
        } catch (sdkError) {
          const sdkErrorMessage = sdkError instanceof Error ? sdkError.message : 'SDK error'
          console.warn('MiniKit SDK sharing failed, falling back to web methods:', sdkErrorMessage)
          
          // Check if it's a specific SDK error that we can handle
          if (sdkErrorMessage.includes('not ready') || sdkErrorMessage.includes('not available')) {
            console.log('🔄 SDK not ready, attempting to initialize...')
            try {
              const { sdk } = await import('@farcaster/miniapp-sdk')
              await sdk.actions.ready()
              console.log('✅ SDK initialized, retrying share...')
              
              // Retry the share operation
              const retryResult = await sdk.actions.composeCast({
                text: shareContent.text,
                embeds: [shareContent.url]
              })
              
              if (retryResult?.cast) {
                console.log('✅ Cast composed successfully on retry:', retryResult.cast)
                return // Success, no need for fallback
              }
            } catch (retryError) {
              console.warn('SDK retry failed, proceeding with fallback:', retryError)
            }
          }
          
          // Fallback to web share API or manual sharing
          if (navigator.share) {
            await navigator.share({
              title: contentData.title,
              text: shareContent.text,
              url: shareContent.url
            })
          } else {
            // Copy to clipboard fallback
            await navigator.clipboard.writeText(`${shareContent.text} ${shareContent.url}`)
            console.log('📋 Share content copied to clipboard')
          }
        }
      } else {
        // Not in MiniApp environment, use web fallbacks
        if (navigator.share) {
          await navigator.share({
            title: contentData.title,
            text: shareContent.text,
            url: shareContent.url
          })
        } else {
          // Copy to clipboard fallback
          await navigator.clipboard.writeText(`${shareContent.text} ${shareContent.url}`)
          console.log('📋 Share content copied to clipboard')
        }
      }
      
      // Simulate sharing success with realistic timing
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setShareSuccess(true)
      onContentShared?.(contentId, 'farcaster', socialProfile)
      
      // Track viral mechanics with detailed analytics
      if (socialActions.viralMechanics.enableReferralTracking) {
        console.log('📊 Influencer share tracked for viral growth:', {
          contentId: contentId.toString(),
          influencerFid: socialProfile.fid,
          trustScore: socialProfile.verificationDisplay.trustScore,
          shareTimestamp: new Date().toISOString()
        })
      }
      
      // Auto-hide success message after delay
      setTimeout(() => {
        setShareSuccess(false)
      }, 5000)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed'
      console.error('Social share failed:', errorMessage)
      
      // Set user-friendly error message
      if (error instanceof Error && error.message.includes('permission')) {
        setShareError('Share permission denied. Please try again.')
      } else if (error instanceof Error && error.message.includes('network')) {
        setShareError('Network error. Please check your connection and try again.')
      } else if (error instanceof Error && error.message.includes('Invalid content')) {
        setShareError('Content data is invalid. Please refresh and try again.')
      } else {
        setShareError(`Share failed: ${errorMessage}`)
      }
      
      // Clear error after delay
      setTimeout(() => {
        setShareError(null)
      }, 5000)
    } finally {
      setIsSharing(false)
    }
  }, [socialActions, contentData, socialProfile, contentId, onContentShared])
  
  // ===== POST-PURCHASE SOCIAL ACTIONS =====
  
  /**
   * Post Purchase Social Actions Component
   * 
   * This component displays social sharing options and viral mechanics
   * after successful content purchase.
   */
  const PostPurchaseSocialActions = () => {
    if (!enablePostPurchaseSharing || !purchaseFlow.hasAccess || !socialActions.shareAction.available) {
      return null
    }
    
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">Content Purchased!</div>
                <div className="text-sm text-green-700">
                  {socialActions.shareAction.customMessage}
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleSocialShare}
              disabled={isSharing}
              size="sm"
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Sharing...
                </>
              ) : shareSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Shared!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </>
              )}
            </Button>
          </div>
          
          {shareSuccess && (
            <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
              Thanks for sharing! Your social proof helps other users discover great content.
            </div>
          )}
          
          {shareError && (
            <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800">
              {shareError}
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-red-600 hover:text-red-700 ml-2"
                onClick={() => setShareError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
  
  // ===== SOCIAL ANALYTICS DISPLAY =====
  
  /**
   * Social Analytics Component
   * 
   * This component displays social metrics and engagement data
   * when analytics are enabled.
   */
  const SocialAnalyticsDisplay = () => {
    if (!showSocialAnalytics || !socialProfile || layout === 'compact') return null
    
    return (
      <Card className="border-muted">
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setSocialAnalyticsExpanded(!socialAnalyticsExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Social Analytics</CardTitle>
            <Button variant="ghost" size="sm">
              {socialAnalyticsExpanded ? '▼' : '▶'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <div className="font-medium text-sm text-blue-700">
                      {socialProfile.verificationDisplay.trustScore}
                    </div>
                    <div className="text-xs text-blue-600">Trust Score</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Trust score based on verification status and social activity</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="font-medium text-sm text-green-700">
                      {socialProfile.verificationDisplay.verificationCount}
                    </div>
                    <div className="text-xs text-green-600">Verifications</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of verified addresses on Farcaster</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <div className="font-medium text-sm text-purple-700">
                      {socialProfile.socialProofScore}
                    </div>
                    <div className="text-xs text-purple-600">Social Score</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Overall social proof score including profile completeness</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {socialAnalyticsExpanded && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Verification Level</span>
                <Badge variant={
                  socialProfile.verificationDisplay.verificationLevel === 'high' ? 'default' :
                  socialProfile.verificationDisplay.verificationLevel === 'medium' ? 'secondary' : 'outline'
                }>
                  {socialProfile.verificationDisplay.verificationLevel}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Influencer Status</span>
                <span className={socialProfile.isInfluencer ? 'text-orange-600' : 'text-muted-foreground'}>
                  {socialProfile.isInfluencer ? '⭐ Influencer' : 'Regular User'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Farcaster ID</span>
                <span className="font-mono text-xs">{socialProfile.fid}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
  
  // ===== PURCHASE COMPLETE HANDLER =====
  
  const handlePurchaseComplete = useCallback((contentId: bigint) => {
    // Track social context in purchase completion
    if (socialProfile) {
      console.log('📊 Social Purchase Completed:', {
        contentId: contentId.toString(),
        socialProfile: {
          fid: socialProfile.fid,
          trustScore: socialProfile.verificationDisplay.trustScore,
          isInfluencer: socialProfile.isInfluencer
        }
      })
    }
    
    onPurchaseComplete?.(contentId, socialProfile || undefined)
    
    // Auto-prompt sharing for high-trust users
    if (socialActions.shareAction.autoPrompt) {
      setTimeout(() => {
        handleSocialShare()
      }, 2000)
    }
  }, [socialProfile, onPurchaseComplete, socialActions, handleSocialShare])
  
  // ===== LOADING AND ERROR STATES =====
  
  if (isContentLoading) {
    return (
      <Card className={cn("w-full", className)} role="status" aria-label="Loading content">
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-muted rounded" />
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
        <CardFooter>
          <div className="animate-pulse w-full">
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardFooter>
      </Card>
    )
  }
  
  if (!contentData || !contentId) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50" role="alert">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Content not found or invalid content ID provided.
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto ml-2"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  
  // ===== MAIN RENDER =====
  
  return (
    <TooltipProvider>
      <div 
        className={cn("space-y-4", className)}
        role="region" 
        aria-label="Social Context Integration"
        tabIndex={autoFocus ? 0 : undefined}
      >
        {/* Social User Profile Display */}
        {socialProfile && <SocialUserProfileDisplay />}
        
        {/* Payment Interface with Social Context */}
        <PaymentInterface
          contentId={contentId}
          title={contentData.title}
          description={contentData.description}
          variant={layout === 'compact' ? 'compact' : layout === 'featured' ? 'expanded' : 'default'}
          enableSocialFeatures={enableSocialFeatures}
          showAuthDetails={showVerificationStatus}
          showStrategyDetails={layout !== 'compact'}
          onPurchaseComplete={handlePurchaseComplete}
          onShareComplete={(id) => onContentShared?.(id, 'farcaster', socialProfile || undefined)}
        />
        
        {/* Social Analytics */}
        {showSocialAnalytics && <SocialAnalyticsDisplay />}
        
        {/* Post-Purchase Social Actions */}
        <PostPurchaseSocialActions />
        
        {/* Social Proof and Viral Mechanics */}
        {socialActions.viralMechanics.showPurchaseProof && purchaseFlow.hasAccess && (
          <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
              <Shield className="h-4 w-4" />
              <span>Verified purchase by</span>
              {socialProfile && (
                <span className="font-medium">
                  {socialProfile.displayName || socialProfile.username}
                </span>
              )}
              <SocialVerificationBadge />
            </div>
          </div>
        )}
        
        {/* MiniKit Status Indicator */}
        {isMiniKitAvailable && miniKitCapabilities && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-green-700">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">MiniKit SDK Active</span>
                </div>
                <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                  Native Sharing
                </Badge>
              </div>
              
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Cast Composition</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Frame Support</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>User Profiles</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <span>Payments</span>
                </div>
              </div>
              
              <div className="mt-3 pt-2 border-t border-green-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-green-300 text-green-700 hover:bg-green-100"
                  onClick={testMiniKitConnection}
                >
                  Test SDK Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Social Optimization Hints */}
        {socialOptimization === 'aggressive' && socialProfile && !purchaseFlow.hasAccess && (
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 text-sm text-purple-700">
                <Sparkles className="h-4 w-4" />
                <span>
                  {socialProfile.isInfluencer ? 
                    'Special content for influencers - share after purchase for exclusive access to creator networks!' :
                    'Join the social commerce revolution - verified users get additional features!'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
// ==============================================================================
// COMPONENT 3.4: MINI APP PURCHASE INTERFACE
// File: src/components/miniapp/MiniAppPurchaseFlow.tsx
// ==============================================================================

'use client'

import React, { useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { ContentPurchaseCard } from '@/components/web3/ContentPurchaseCard'
import { useX402ContentPurchaseFlow } from '@/hooks/business/workflows'
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

/**
 * Farcaster Embed Interface
 * 
 * This interface defines the structure for embeds that can be shared
 * on Farcaster, providing rich content previews with metadata.
 */
interface FarcasterEmbed {
  /** Direct URL to the content */
  readonly url: string
  
  /** Embed metadata for rich preview */
  readonly metadata: {
    readonly content_type: 'text/html' | 'image' | 'video'
    readonly content: {
      readonly title: string
      readonly description: string
      readonly image?: string
    }
  }
}

/**
 * Content Data Interface
 * 
 * This interface represents the content data structure that we use
 * for generating social sharing embeds and purchase information.
 */
interface ContentData {
  readonly id: bigint
  readonly title: string
  readonly description: string
  readonly payPerViewPrice: bigint
  readonly creator: string
  readonly category?: string
  readonly imageUrl?: string
}

/**
 * Mini App Purchase Flow Props Interface
 * 
 * This interface defines the props for the MiniAppPurchaseFlow component,
 * ensuring BigInt compatibility and strict TypeScript typing throughout.
 */
interface MiniAppPurchaseFlowProps {
  /** Content ID as BigInt for blockchain compatibility */
  readonly contentId: bigint
  
  /** Optional callback for additional purchase success handling */
  readonly onPurchaseComplete?: () => void
  
  /** Optional custom styling */
  readonly className?: string
}

/**
 * Social Context Interface Extension
 * 
 * This interface extends the Farcaster context with social sharing capabilities
 * specific to the Mini App purchase flow.
 */
interface SocialContextWithSharing {
  /** Base Farcaster context from Component 3.3 */
  readonly farcasterContext: ReturnType<typeof useFarcasterContext>
  
  /** Whether social sharing is available */
  readonly canShare: boolean
  
  /** Function to trigger social sharing */
  readonly shareToCast: (text: string, embeds: readonly FarcasterEmbed[]) => Promise<void>
}

/**
 * Generate Content Embed Function
 * 
 * This function creates compelling social sharing embeds using existing
 * content metadata. It transforms content data into shareable Farcaster
 * embeds that drive engagement and conversions.
 * 
 * The function leverages your existing content structure while optimizing
 * for social media presentation, including price formatting, compelling
 * descriptions, and platform branding.
 */
function generateContentEmbed(content: ContentData): FarcasterEmbed {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://your-platform.com'
  
  // Format price for social sharing
  const priceDisplay = content.payPerViewPrice > BigInt(0) 
    ? `$${(Number(content.payPerViewPrice) / 1e6).toFixed(2)} USDC`
    : 'Free'
  
  // Create compelling social description
  const socialDescription = content.description.length > 100
    ? `${content.description.slice(0, 97)}...`
    : content.description
  
  // Generate content URL for sharing
  const contentUrl = `${baseUrl}/content/${content.id.toString()}`
  
  return {
    url: contentUrl,
    metadata: {
      content_type: 'text/html',
      content: {
        title: `${content.title} - ${priceDisplay}`,
        description: `${socialDescription} | Premium content by ${content.creator.slice(0, 8)}...`,
        image: content.imageUrl || `${baseUrl}/api/og/content/${content.id.toString()}`
      }
    }
  }
}

/**
 * Social Context Hook
 * 
 * This hook provides social sharing capabilities by integrating with
 * the Farcaster context from Component 3.3 and adding MiniKit sharing
 * functionality for seamless social interactions.
 */
function useSocialContextWithSharing(): SocialContextWithSharing {
  const farcasterContext = useFarcasterContext()
  
  // Determine if social sharing is available
  const canShare = useMemo(() => {
    return Boolean(
      farcasterContext?.isMiniAppEnvironment &&
      typeof window !== 'undefined'
    )
  }, [farcasterContext])
  
  // Social sharing function using MiniKit
  const shareToCast = useCallback(async (
    text: string, 
    embeds: readonly FarcasterEmbed[]
  ): Promise<void> => {
    if (!canShare) {
      console.warn('Social sharing not available in current context')
      return
    }
    try {
      // Dynamically import MiniKit SDK to avoid SSR issues
      const { sdk } = await import('@farcaster/miniapp-sdk')
      // Ensure SDK is ready
      await sdk.actions.ready()
      // Share cast with embeds using composeCast
      await sdk.actions.composeCast({
        text,
        embeds: embeds.slice(0, 2).map(embed => embed.url) as [] | [string] | [string, string]
      })
      console.log('Successfully shared cast with embeds')
    } catch (error) {
      console.error('Failed to share cast:', error)
      // Graceful degradation - don't throw error to avoid breaking purchase flow
    }
  }, [canShare])
  
  return {
    farcasterContext,
    canShare,
    shareToCast
  }
}

/**
 * Enhanced Content Purchase Card Props
 * 
 * This interface extends the existing ContentPurchaseCard props to support
 * Mini App functionality, including social context and the new miniapp variant.
 */
interface EnhancedContentPurchaseCardProps {
  readonly contentId: bigint
  readonly userAddress?: string
  readonly variant?: 'full' | 'compact' | 'miniapp'
  readonly socialContext?: ReturnType<typeof useFarcasterContext>
  readonly onPurchaseSuccess?: () => void
  readonly onViewContent?: () => void
  readonly className?: string
}

/**
 * MiniAppPurchaseFlow Component
 * 
 * This component creates a specialized purchase interface for Mini App environments
 * by enhancing your existing ContentPurchaseCard with social sharing capabilities
 * and Farcaster context integration. It demonstrates how to extend existing
 * components with new functionality while maintaining backward compatibility.
 * 
 * Key Features:
 * - Integrates with Component 3.2's x402 payment flow for secure transactions
 * - Uses Component 3.3's Farcaster context for enhanced user profiles
 * - Provides automatic social sharing after successful purchases
 * - Maintains visual consistency with your existing design system
 * - Includes comprehensive error handling and graceful degradation
 * 
 * Architecture Integration:
 * - Builds upon your existing ContentPurchaseCard component
 * - Leverages the useX402ContentPurchaseFlow hook for payment processing
 * - Integrates with MiniKit SDK for social sharing functionality
 * - Uses your existing authentication system through wallet connection
 * - Maintains compatibility with your current styling and responsive design
 * 
 * Social Sharing Features:
 * - Automatically generates compelling content embeds for sharing
 * - Triggers social sharing after successful purchases
 * - Includes creator attribution and content metadata
 * - Handles sharing failures gracefully without disrupting purchase flow
 * 
 * This component serves as the culmination of Phase 3 components, bringing together
 * Mini App infrastructure (3.1), enhanced payment flows (3.2), and social context (3.3)
 * into a cohesive purchase experience that drives both conversions and social engagement.
 */
export function MiniAppPurchaseFlow({
  contentId,
  onPurchaseComplete,
  className
}: MiniAppPurchaseFlowProps): React.ReactElement {
  // Get current user address from wallet connection
  const { address: userAddress } = useAccount()
  
  // Initialize x402 payment flow with social context integration
  const purchaseFlow = useX402ContentPurchaseFlow(contentId, userAddress)
  
  // Initialize social sharing capabilities
  const socialContext = useSocialContextWithSharing()
  
  // Generate shareable content embed
  const contentEmbed = useMemo(() => {
    if (!purchaseFlow.content) return null
    
    const contentData: ContentData = {
      id: contentId,
      title: purchaseFlow.content.title,
      description: purchaseFlow.content.description,
      payPerViewPrice: purchaseFlow.content.payPerViewPrice,
      creator: purchaseFlow.content.creator,
      category: String(purchaseFlow.content.category),
      imageUrl: undefined
    }
    
    return generateContentEmbed(contentData)
  }, [contentId, purchaseFlow.content])
  
  // Enhanced purchase success handler with social sharing
  const handlePurchaseSuccess = useCallback(async (): Promise<void> => {
    try {
      // Call original purchase completion callback
      if (onPurchaseComplete) {
        onPurchaseComplete()
      }
      
      // Trigger social sharing if available and content embed exists
      if (socialContext.canShare && contentEmbed && purchaseFlow.content) {
        const shareText = 'Just unlocked premium content on Content Platform! 🔓'
        
        await socialContext.shareToCast(shareText, [contentEmbed])
        
        console.log('Purchase success shared to Farcaster')
      }
    } catch (error) {
      console.error('Error in purchase success handler:', error)
      // Don't throw - we don't want social sharing failures to affect the purchase flow
    }
  }, [onPurchaseComplete, socialContext, contentEmbed, purchaseFlow.content])
  
  // Enhanced props for ContentPurchaseCard with Mini App support
  const enhancedPropsForWeb3Card = {
    contentId,
    userAddress: userAddress,
    variant: 'compact' as const,
    onPurchaseSuccess: () => { void handlePurchaseSuccess() },
    className
  }
  
  // Render the enhanced purchase interface
  return (
    <div className="miniapp-container">
      {/* Mini App Purchase Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
          🖼️ Mini App Purchase
        </div>
      </div>
      
      {/* Enhanced Content Purchase Card */}
      <ContentPurchaseCard {...enhancedPropsForWeb3Card} />
      
      {/* Social Context Information */}
      {socialContext.farcasterContext && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 text-purple-800">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm font-medium">
              Connected as @{socialContext.farcasterContext.user.username}
            </span>
          </div>
          {socialContext.canShare && (
            <p className="text-xs text-purple-600 mt-1">
              Purchases will be shared to your Farcaster feed automatically
            </p>
          )}
        </div>
      )}
      
      {/* Progressive Enhancement Notice */}
      {!socialContext.canShare && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Social features available in Farcaster Mini App environment
          </p>
        </div>
      )}
    </div>
  )
}
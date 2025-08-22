/**
 * Social Purchase Flow - UI Integration Layer
 * File: src/hooks/ui/useSocialPurchaseUI.ts
 * 
 * This hook provides the UI integration layer for the social purchase flow,
 * following your established three-layer architecture pattern. It transforms the complex
 * business logic from useSocialPurchaseFlow into UI-focused interfaces that
 * components can use declaratively, matching your existing UI integration patterns.
 * 
 * Key Integration Points:
 * - Follows your established UI hook patterns (like useContentPurchaseUI)
 * - Transforms business logic into UI-focused data structures
 * - Provides formatted display values and simple action functions
 * - Maintains consistency with your existing UI integration layer
 * - Integrates with your established loading, error, and success state patterns
 * 
 * Architecture Alignment:
 * - Uses your established readonly interface patterns
 * - Follows your UI hook naming conventions and structure
 * - Integrates with your existing formatters and display utilities
 * - Maintains compatibility with your component prop expectations
 * - Preserves your established error handling and user feedback patterns
 */

'use client'

import { useMemo, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type Address } from 'viem'

// Import your business logic layer
import { 
  useSocialPurchaseFlow,
  type SocialPurchaseFlowResult 
} from '@/hooks/commerce/useSocialPurchaseFlow'

// Import your existing integrations and utilities
import { useMiniApp } from '@/contexts/MiniAppProvider'
import { formatCurrency, formatAddress, formatRelativeTime } from '@/lib/utils'

// ================================================
// UI-FOCUSED INTERFACES
// ================================================

/**
 * Purchase Button UI State
 * 
 * This interface defines the complete UI state for purchase buttons,
 * providing everything a component needs for button rendering and interaction.
 */
export interface PurchaseButtonUI {
  readonly variant: 'default' | 'batch' | 'social' | 'premium' | 'success' | 'error'
  readonly size: 'sm' | 'default' | 'lg'
  readonly disabled: boolean
  readonly loading: boolean
  readonly text: string
  readonly description?: string
  readonly badge?: string
  readonly icon?: string // Icon name for easier component usage
  readonly onClick: () => Promise<void>
}

/**
 * Social Context UI Display
 * 
 * This interface provides formatted social context data optimized for UI display,
 * transforming complex social data into component-ready format.
 */
export interface SocialContextUI {
  readonly isVisible: boolean
  readonly proofLevel: 'high' | 'medium' | 'low' | 'none'
  readonly badges: readonly {
    readonly type: 'verification' | 'connections' | 'score' | 'recommendation'
    readonly text: string
    readonly variant: 'default' | 'secondary' | 'outline' | 'destructive'
    readonly icon?: string
  }[]
  readonly creatorDisplay: {
    readonly name: string
    readonly verified: boolean
    readonly followerCount?: string
    readonly avatar?: string
  } | null
  readonly userDisplay: {
    readonly name: string
    readonly verified: boolean
  } | null
  readonly recommendation: {
    readonly source: string
    readonly strength: 'strong' | 'moderate' | 'weak'
    readonly message: string
  } | null
}

/**
 * Batch Transaction UI Benefits
 * 
 * This interface provides formatted batch transaction information for UI display,
 * making complex optimization data easily consumable by components.
 */
export interface BatchTransactionUI {
  readonly isAvailable: boolean
  readonly isRecommended: boolean
  readonly benefits: readonly {
    readonly type: 'time' | 'gas' | 'ux'
    readonly value: string
    readonly description: string
    readonly icon: string
  }[]
  readonly badgeText?: string
  readonly description: string
}

/**
 * Viral Sharing UI Preview
 * 
 * This interface provides formatted viral sharing data for UI components,
 * transforming sharing strategy into component-ready display format.
 */
export interface ViralSharingUI {
  readonly isAvailable: boolean
  readonly potentialScore: string // Formatted percentage
  readonly previewText: string
  readonly audienceText: string
  readonly benefits: readonly string[]
  readonly onPreviewShare: () => Promise<void>
}

/**
 * Purchase Progress UI State
 * 
 * This interface provides formatted progress information for UI display,
 * following your established progress indicator patterns.
 */
export interface PurchaseProgressUI {
  readonly isVisible: boolean
  readonly currentStep: string
  readonly progress: number // 0-100
  readonly steps: readonly {
    readonly key: string
    readonly label: string
    readonly status: 'pending' | 'active' | 'completed' | 'error'
    readonly icon: string
  }[]
  readonly estimatedTime?: string
}

/**
 * Purchase Analytics UI
 * 
 * This interface provides formatted analytics data for UI display,
 * enabling components to show performance insights and optimization feedback.
 */
export interface PurchaseAnalyticsUI {
  readonly conversionOptimization: {
    readonly enabled: boolean
    readonly score: string
    readonly improvements: readonly string[]
  }
  readonly performanceMetrics: {
    readonly gasEfficiency: string
    readonly timeOptimization: string
    readonly userExperience: string
  }
  readonly socialImpact: {
    readonly viralPotential: string
    readonly networkEffect: string
    readonly communityBenefit: string
  }
}

/**
 * Social Purchase UI Result
 * 
 * This interface provides the complete UI-focused API for social purchases,
 * following your established UI hook result patterns.
 */
export interface SocialPurchaseUI {
  // Content and access display
  readonly contentDisplay: {
    readonly title: string
    readonly description?: string
    readonly price: string
    readonly creator: string
    readonly creatorAddress: string
    readonly category?: string
  } | null
  readonly accessStatus: {
    readonly hasAccess: boolean
    readonly accessText: string
    readonly canPurchase: boolean
    readonly canAfford: boolean
    readonly balanceText: string
  }

  // UI components
  readonly purchaseButton: PurchaseButtonUI
  readonly socialContext: SocialContextUI
  readonly batchTransaction: BatchTransactionUI
  readonly viralSharing: ViralSharingUI
  readonly purchaseProgress: PurchaseProgressUI
  readonly analytics: PurchaseAnalyticsUI

  // Loading and error states
  readonly isLoading: boolean
  readonly error: string | null
  readonly retryAvailable: boolean

  // Action functions
  readonly retry: () => void
  readonly reset: () => void
  readonly trackEvent: (event: string, data?: any) => void
}

// ================================================
// UI TRANSFORMATION UTILITIES
// ================================================

/**
 * Social Context Transformer
 * 
 * This utility transforms complex social context data into UI-ready format,
 * following your established formatter patterns.
 */
class SocialContextUITransformer {
  static transform(socialContext: any): SocialContextUI {
    if (!socialContext || socialContext.socialProofLevel === 'none') {
      return {
        isVisible: false,
        proofLevel: 'none',
        badges: [],
        creatorDisplay: null,
        userDisplay: null,
        recommendation: null
      }
    }

    const badges = []

    // Creator verification badge
    if (socialContext.creatorSocialProfile?.verified) {
      badges.push({
        type: 'verification' as const,
        text: 'Verified Creator',
        variant: 'secondary' as const,
        icon: 'verified'
      })
    }

    // Mutual connections badge
    if (socialContext.mutualConnections > 0) {
      badges.push({
        type: 'connections' as const,
        text: `${socialContext.mutualConnections} mutual connection${socialContext.mutualConnections > 1 ? 's' : ''}`,
        variant: 'outline' as const,
        icon: 'users'
      })
    }

    // Social score badge
    if (socialContext.socialScore > 0.5) {
      badges.push({
        type: 'score' as const,
        text: `${Math.round(socialContext.socialScore * 100)}% social score`,
        variant: 'default' as const,
        icon: 'star'
      })
    }

    // Recommendation badge
    if (socialContext.recommendationSource !== 'direct') {
      badges.push({
        type: 'recommendation' as const,
        text: `Recommended from ${socialContext.recommendationSource}`,
        variant: 'outline' as const,
        icon: 'trending-up'
      })
    }

    // Creator display
    const creatorDisplay = socialContext.creatorSocialProfile ? {
      name: socialContext.creatorSocialProfile.displayName || 'Creator',
      verified: socialContext.creatorSocialProfile.verified,
      followerCount: socialContext.creatorSocialProfile.followerCount > 0 ? 
        `${socialContext.creatorSocialProfile.followerCount} followers` : undefined,
      avatar: undefined // Would integrate with actual avatar URLs
    } : null

    // User display
    const userDisplay = socialContext.userSocialProfile ? {
      name: socialContext.userSocialProfile.displayName || 'You',
      verified: socialContext.userSocialProfile.verified
    } : null

    // Recommendation
    const recommendation = socialContext.recommendationSource !== 'direct' ? {
      source: socialContext.recommendationSource,
      strength: socialContext.socialProofLevel === 'high' ? 'strong' as const :
               socialContext.socialProofLevel === 'medium' ? 'moderate' as const : 'weak' as const,
      message: this.generateRecommendationMessage(socialContext)
    } : null

    return {
      isVisible: true,
      proofLevel: socialContext.socialProofLevel,
      badges,
      creatorDisplay,
      userDisplay,
      recommendation
    }
  }

  private static generateRecommendationMessage(socialContext: any): string {
    const source = socialContext.recommendationSource
    const connections = socialContext.mutualConnections

    if (source === 'connections' && connections > 0) {
      return `${connections} of your connections engage with this creator`
    } else if (source === 'followers') {
      return 'Popular among your Farcaster network'
    } else if (source === 'trending') {
      return 'Trending in the Farcaster community'
    }
    
    return 'Recommended based on your activity'
  }
}

/**
 * Batch Transaction UI Transformer
 * 
 * This utility transforms batch transaction configuration into UI-ready format.
 */
class BatchTransactionUITransformer {
  static transform(batchConfig: any): BatchTransactionUI {
    if (!batchConfig?.isAvailable) {
      return {
        isAvailable: false,
        isRecommended: false,
        benefits: [],
        description: 'Batch transactions not available'
      }
    }

    const benefits = [
      {
        type: 'time' as const,
        value: `${batchConfig.estimatedTimeReduction}%`,
        description: 'faster completion',
        icon: 'clock'
      },
      {
        type: 'gas' as const,
        value: `${batchConfig.estimatedGasSavings}%`,
        description: 'gas savings',
        icon: 'bar-chart-3'
      },
      {
        type: 'ux' as const,
        value: '1 click',
        description: 'instead of 2 transactions',
        icon: 'zap'
      }
    ]

    const badgeText = batchConfig.userExperienceImprovement === 'significant' ? 'Highly Optimized' :
                     batchConfig.userExperienceImprovement === 'moderate' ? 'Optimized' : undefined

    return {
      isAvailable: true,
      isRecommended: batchConfig.shouldUseBatch,
      benefits,
      badgeText,
      description: 'Combine approval and purchase into a single transaction for better efficiency'
    }
  }
}

/**
 * Viral Sharing UI Transformer
 * 
 * This utility transforms viral sharing strategy into UI-ready format.
 */
class ViralSharingUITransformer {
  static transform(viralStrategy: any): ViralSharingUI {
    if (!viralStrategy?.immediateShareEnabled) {
      return {
        isAvailable: false,
        potentialScore: '0%',
        previewText: '',
        audienceText: '',
        benefits: [],
        onPreviewShare: async () => {}
      }
    }

    const benefits = [
      'Earn creator rewards for successful referrals',
      'Help creators grow their audience',
      'Discover content through social connections'
    ]

    return {
      isAvailable: true,
      potentialScore: `${Math.round(viralStrategy.viralPotentialScore * 100)}%`,
      previewText: viralStrategy.suggestedShareText,
      audienceText: `Share with ${viralStrategy.recommendedAudience}`,
      benefits,
      onPreviewShare: async () => {
        console.log('Preview share triggered')
      }
    }
  }
}

// ================================================
// MAIN UI INTEGRATION HOOK
// ================================================

/**
 * Social Purchase UI Hook
 * 
 * This hook provides the complete UI integration for social purchases,
 * following your established three-layer architecture patterns.
 */
export function useSocialPurchaseUI(
  contentId: bigint | undefined,
  userAddress?: Address
): SocialPurchaseUI {
  
  const router = useRouter()
  const miniAppContext = useMiniApp()
  
  // Business logic layer
  const purchaseFlow = useSocialPurchaseFlow(contentId, userAddress)
  
  // Local UI state
  const [uiState, setUIState] = useState({
    retryCount: 0,
    lastError: null as string | null
  })

  // ===== CONTENT DISPLAY TRANSFORMATION =====
  
  const contentDisplay = useMemo(() => {
    if (!purchaseFlow.content) return null

    return {
      title: purchaseFlow.content.title,
      description: purchaseFlow.content.description,
      price: formatCurrency(purchaseFlow.content.payPerViewPrice),
      creator: purchaseFlow.content.creator ? formatAddress(purchaseFlow.content.creator) : 'Unknown Creator',
      creatorAddress: purchaseFlow.content.creator,
      category: purchaseFlow.content.category?.toString()
    }
  }, [purchaseFlow.content])

  // ===== ACCESS STATUS TRANSFORMATION =====
  
  const accessStatus = useMemo(() => {
    return {
      hasAccess: purchaseFlow.hasAccess,
      accessText: purchaseFlow.hasAccess ? 'Access Granted' : 'Purchase Required',
      canPurchase: !purchaseFlow.hasAccess && purchaseFlow.canAfford,
      canAfford: purchaseFlow.canAfford,
      balanceText: purchaseFlow.userBalance ? 
        `Balance: ${formatCurrency(purchaseFlow.userBalance)}` : 'Balance: Unknown'
    }
  }, [purchaseFlow.hasAccess, purchaseFlow.canAfford, purchaseFlow.userBalance])

  // ===== PURCHASE BUTTON TRANSFORMATION =====
  
  const purchaseButton: PurchaseButtonUI = useMemo(() => {
    const handlePurchase = async () => {
      try {
        await purchaseFlow.executeSocialPurchase()
      } catch (error) {
        setUIState(prev => ({ 
          ...prev, 
          retryCount: prev.retryCount + 1,
          lastError: (error as Error).message 
        }))
        throw error
      }
    }

    if (purchaseFlow.hasAccess) {
      return {
        variant: 'success',
        size: 'default',
        disabled: false,
        loading: false,
        text: 'View Content',
        description: 'You have access to this content',
        icon: 'check-circle',
        onClick: async () => {
          router.push(`/content/${contentId}`)
        }
      }
    }

    if (purchaseFlow.error) {
      return {
        variant: 'error',
        size: 'default',
        disabled: false,
        loading: false,
        text: 'Retry Purchase',
        description: 'Click to retry the failed purchase',
        icon: 'alert-circle',
        onClick: handlePurchase
      }
    }

    if (purchaseFlow.isLoading) {
      return {
        variant: 'default',
        size: 'default',
        disabled: true,
        loading: true,
        text: purchaseFlow.currentStep,
        description: 'Transaction in progress',
        onClick: async () => {}
      }
    }

    if (!purchaseFlow.canAfford) {
      return {
        variant: 'default',
        size: 'default',
        disabled: true,
        loading: false,
        text: 'Insufficient Balance',
        description: 'You need more USDC to make this purchase',
        icon: 'alert-circle',
        onClick: async () => {}
      }
    }

    if (purchaseFlow.batchTransactionAvailable) {
      return {
        variant: 'batch',
        size: 'default',
        disabled: false,
        loading: false,
        text: 'Purchase with Batch',
        description: 'Optimized transaction with gas savings',
        badge: 'Optimized',
        icon: 'zap',
        onClick: handlePurchase
      }
    }

    if (purchaseFlow.socialContext) {
      return {
        variant: 'social',
        size: 'default',
        disabled: false,
        loading: false,
        text: 'Social Purchase',
        description: 'Purchase with social context and sharing',
        badge: 'Social',
        icon: 'users',
        onClick: handlePurchase
      }
    }

    return {
      variant: 'default',
      size: 'default',
      disabled: false,
      loading: false,
      text: `Purchase for ${contentDisplay?.price || '...'}`,
      description: 'Standard purchase flow',
      icon: 'shopping-cart',
      onClick: handlePurchase
    }
  }, [
    purchaseFlow,
    contentDisplay,
    contentId,
    router
  ])

  // ===== UI COMPONENT TRANSFORMATIONS =====
  
  const socialContext = useMemo(() => 
    SocialContextUITransformer.transform(purchaseFlow.socialContext)
  , [purchaseFlow.socialContext])

  const batchTransaction = useMemo(() => 
    BatchTransactionUITransformer.transform(purchaseFlow.socialState?.batchConfig)
  , [purchaseFlow.socialState?.batchConfig])

  const viralSharing = useMemo(() => 
    ViralSharingUITransformer.transform(purchaseFlow.socialState?.viralStrategy)
  , [purchaseFlow.socialState?.viralStrategy])

  // ===== PURCHASE PROGRESS TRANSFORMATION =====
  
  const purchaseProgress: PurchaseProgressUI = useMemo(() => {
    const isVisible = purchaseFlow.isLoading || purchaseFlow.socialState?.step !== 'idle'
    
    if (!isVisible) {
      return {
        isVisible: false,
        currentStep: '',
        progress: 0,
        steps: []
      }
    }

    const currentStepIndex = purchaseFlow.socialState?.step ? 
      ['preparing', 'purchasing', 'completed'].findIndex(stepKey => 
        purchaseFlow.socialState?.step?.includes(stepKey)
      ) : -1

    const steps = [
      { 
        key: 'preparing', 
        label: 'Preparing', 
        status: (currentStepIndex > 0 ? 'completed' : currentStepIndex === 0 ? 'active' : 'pending') as 'pending' | 'active' | 'completed' | 'error', 
        icon: 'loader-2' 
      },
      { 
        key: 'purchasing', 
        label: 'Processing', 
        status: (currentStepIndex > 1 ? 'completed' : currentStepIndex === 1 ? 'active' : 'pending') as 'pending' | 'active' | 'completed' | 'error', 
        icon: 'shopping-cart' 
      },
      { 
        key: 'completed', 
        label: 'Complete', 
        status: (currentStepIndex >= 2 ? 'completed' : 'pending') as 'pending' | 'active' | 'completed' | 'error', 
        icon: 'check-circle' 
      }
    ]

    const progress = currentStepIndex >= 0 ? 
      ((currentStepIndex + 1) / steps.length) * 100 : 0

    return {
      isVisible: true,
      currentStep: purchaseFlow.currentStep,
      progress,
      steps
    }
  }, [purchaseFlow.isLoading, purchaseFlow.socialState, purchaseFlow.currentStep])

  // ===== ANALYTICS TRANSFORMATION =====
  
  const analytics: PurchaseAnalyticsUI = useMemo(() => {
    const batchConfig = purchaseFlow.socialState?.batchConfig
    const socialContext = purchaseFlow.socialContext
    const viralStrategy = purchaseFlow.socialState?.viralStrategy

    return {
      conversionOptimization: {
        enabled: Boolean(socialContext),
        score: socialContext ? `${Math.round(socialContext.socialScore * 100)}%` : '0%',
        improvements: [
          ...(batchConfig?.isAvailable ? ['Batch transaction support'] : []),
          ...(viralStrategy?.immediateShareEnabled ? ['Viral sharing enabled'] : []),
          ...(socialContext?.socialProofLevel !== 'none' ? ['Social proof available'] : [])
        ]
      },
      performanceMetrics: {
        gasEfficiency: batchConfig?.estimatedGasSavings ? `${batchConfig.estimatedGasSavings}% savings` : 'Standard',
        timeOptimization: batchConfig?.estimatedTimeReduction ? `${batchConfig.estimatedTimeReduction}% faster` : 'Standard',
        userExperience: batchConfig?.userExperienceImprovement || 'Standard'
      },
      socialImpact: {
        viralPotential: viralStrategy?.viralPotentialScore ? 
          `${Math.round(viralStrategy.viralPotentialScore * 100)}%` : '0%',
        networkEffect: socialContext?.mutualConnections ? 
          `${socialContext.mutualConnections} connections` : 'None',
        communityBenefit: socialContext?.recommendationSource || 'Direct'
      }
    }
  }, [purchaseFlow.socialState, purchaseFlow.socialContext])

  // ===== ACTION FUNCTIONS =====
  
  const retry = useCallback(() => {
    purchaseFlow.reset()
    setUIState(prev => ({ ...prev, retryCount: 0, lastError: null }))
  }, [purchaseFlow.reset])

  const reset = useCallback(() => {
    purchaseFlow.reset()
    setUIState({ retryCount: 0, lastError: null })
  }, [purchaseFlow.reset])

  const trackEvent = useCallback((event: string, data?: any) => {
    console.log('UI Event Tracked:', event, data)
    // Would integrate with your analytics system
  }, [])

  // ===== RETURN UI RESULT =====
  
  return {
    contentDisplay,
    accessStatus,
    purchaseButton,
    socialContext,
    batchTransaction,
    viralSharing,
    purchaseProgress,
    analytics,
    isLoading: purchaseFlow.isLoading,
    error: purchaseFlow.error?.message || uiState.lastError,
    retryAvailable: Boolean(purchaseFlow.error || uiState.lastError),
    retry,
    reset,
    trackEvent
  }
}
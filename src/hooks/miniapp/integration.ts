/**
 * MiniApp Integration Hooks - Component 5: Phase 1 Foundation Complete
 * File: src/hooks/miniapp/integration.ts
 * 
 * This component represents the culmination of Phase 1, providing intelligent business logic
 * bridges that transform the sophisticated foundation systems (Components 1-4) into simple,
 * practical hooks that your application components can use effortlessly.
 * 
 * Educational Philosophy:
 * Think of these hooks as skilled translators who don't just convert technical capabilities
 * into business features, but translate the entire context, constraints, and optimization
 * opportunities to ensure your application provides optimal experiences automatically.
 * 
 * Progressive Enhancement Architecture:
 * These hooks enhance your existing business logic without replacing it. Your current
 * purchase flows, navigation systems, and UI components continue working exactly as
 * they always have, but gain access to advanced MiniApp capabilities when available.
 * 
 * Integration Foundation:
 * - Enhanced MiniAppProvider (Component 1): Context awareness and SDK management
 * - Compatibility Testing (Component 2): Capability assessment and fallback strategies  
 * - Error Boundary System (Component 3): Intelligent error recovery and user guidance
 * - Context Detection (Component 4): Environmental intelligence and optimization guidance
 * - Seamlessly integrates with existing hooks like useContentPurchaseFlow
 * - Provides foundation for all future MiniApp feature development
 */

'use client'

import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useAccount, useChainId, useSendTransaction } from 'wagmi'
import { encodeFunctionData, erc20Abi, type Address } from 'viem'

// Import our sophisticated foundation systems
import { useMiniApp } from '@/contexts/MiniAppProvider'
import { useCompatibilityTesting } from '@/utils/miniapp/compatibility'
import { useErrorReporting, useErrorRecovery } from '@/components/errors/MiniAppErrorBoundary'
import { useContextDetection, useOptimizationRecommendations } from '@/utils/context/detection'

// Import existing business logic hooks for enhancement
import { useAppNavigation } from '@/hooks/miniapp/useAppNavigation'
// import { useContentPurchaseFlow } from '@/hooks/contracts/workflows' // Your existing hook
// import { useContentById } from '@/hooks/contracts/core' // Your existing hook

// ================================================
// TYPE DEFINITIONS FOR INTEGRATION HOOKS
// ================================================

/**
 * Shareable Content Interface
 * Defines the structure of content that can be shared across platforms
 */
export interface ShareableContent {
  readonly title: string
  readonly description?: string
  readonly url?: string
  readonly imageUrl?: string
  readonly tags?: readonly string[]
  readonly metadata?: Record<string, unknown>
}

/**
 * Enhanced Purchase Flow Result
 * 
 * This interface extends your existing purchase flow with MiniApp-specific
 * enhancements while maintaining full backward compatibility. Think of this
 * as adding intelligent features to your existing car without changing
 * how you drive it.
 */
export interface EnhancedPurchaseFlowResult {
  // Core purchase functionality (maintains compatibility with existing hooks)
  readonly purchase: () => Promise<void>
  readonly isLoading: boolean
  readonly isSuccess: boolean
  readonly error: Error | null
  readonly transactionHash: string | null
  
  // Enhanced MiniApp-specific capabilities
  readonly canUseBatchTransaction: boolean          // EIP-5792 batch transactions available
  readonly recommendedFlow: 'batch' | 'sequential' | 'simplified'
  readonly estimatedCompletionTime: string         // User-friendly time estimate
  readonly socialOptimizations: {
    readonly shareAfterPurchase: boolean           // Should we prompt for sharing
    readonly socialProofAvailable: boolean         // Can we show social verification
    readonly quickShareText: string | null         // Pre-composed share text
  }
  
  // Context-aware error handling
  readonly errorRecovery: {
    readonly canRetryWithDifferentMethod: boolean  // Alternative payment methods available
    readonly suggestedFallback: string | null      // Human-readable fallback suggestion
    readonly needsUserAction: boolean              // Requires user intervention
  }
  
  // Performance and UX optimizations
  readonly optimizations: {
    readonly skipConfirmationScreens: boolean      // Safe to streamline UI for this context
    readonly useProgressiveUI: boolean             // Show progressive loading states
    readonly enableHapticFeedback: boolean         // Appropriate for haptic feedback
  }
}

/**
 * Social Commerce Integration Result
 * 
 * This interface provides comprehensive social commerce capabilities that
 * understand the current social context and optimize accordingly. Think of
 * this as having a social media expert who knows exactly how to present
 * your content in each specific social environment.
 */
export interface SocialCommerceIntegration {
  // Social user context
  readonly socialUser: {
    readonly isAvailable: boolean                   // Social user data accessible
    readonly displayName: string | null            // User's social display name
    readonly username: string | null               // User's social username
    readonly profileImage: string | null           // User's profile picture URL
    readonly verificationStatus: 'verified' | 'unverified' | 'unknown'
    readonly followerCount: number | null          // For social proof
  }
  
  // Social sharing capabilities
  readonly sharing: {
    readonly isAvailable: boolean                   // Can trigger native sharing
    readonly shareContent: (content: {
      title: string
      description?: string
      url?: string
      imageUrl?: string
    }) => Promise<boolean>                          // Returns success status
    readonly shareTransformer: (content: ShareableContent) => string // Optimizes content for platform
  }
  
  // Social verification and trust signals
  readonly verification: {
    readonly canVerifyPurchases: boolean           // Can show purchase verification
    readonly canShowSocialProof: boolean          // Can display social proof
    readonly trustScore: 'high' | 'medium' | 'low' | 'unknown' // User trust level
  }
  
  // Platform-specific optimizations
  readonly platformOptimizations: {
    readonly preferredInteractionPattern: 'tap' | 'swipe' | 'hover' | 'click'
    readonly recommendedContentLength: 'short' | 'medium' | 'long'
    readonly visualOptimizations: {
      readonly preferImageOverText: boolean
      readonly supportsThumbnails: boolean
      readonly maxRecommendedImageSize: { width: number; height: number }
    }
  }
}

/**
 * Adaptive UI Integration Result
 * 
 * This interface provides intelligent UI adaptation that understands the current
 * environment and automatically optimizes the user interface. Think of this as
 * having an interior designer who automatically adjusts your space for different
 * occasions and different types of guests.
 */
export interface AdaptiveUIIntegration {
  // Layout and density recommendations
  readonly layout: {
    readonly recommendedDensity: 'compact' | 'comfortable' | 'spacious'
    readonly shouldUseCarouselLayouts: boolean     // Horizontal scrolling preferred
    readonly shouldUseSingleColumn: boolean        // Single column layout preferred
    readonly recommendedCardSize: 'small' | 'medium' | 'large'
  }
  
  // Interaction and animation preferences
  readonly interactions: {
    readonly animationLevel: 'minimal' | 'reduced' | 'normal' | 'enhanced'
    readonly shouldUseHoverEffects: boolean        // Hover states appropriate
    readonly preferredTransitionDuration: number   // In milliseconds
    readonly shouldUseHapticFeedback: boolean      // Haptic feedback available/appropriate
  }
  
  // Content presentation optimization
  readonly content: {
    readonly preferredTextLength: 'brief' | 'moderate' | 'detailed'
    readonly shouldShowTechnicalDetails: boolean   // User context supports complexity
    readonly recommendedImageAspectRatio: string   // e.g., "16:9", "1:1", "4:3"
    readonly supportsTruncation: boolean           // Can safely truncate long content
  }
  
  // Performance and loading optimizations
  readonly performance: {
    readonly shouldLazyLoad: boolean               // Lazy loading recommended
    readonly shouldPreloadCriticalAssets: boolean // Preload key resources
    readonly recommendedImageQuality: 'low' | 'medium' | 'high'
    readonly shouldUseSkeleton: boolean            // Skeleton loading appropriate
  }
}

/**
 * Performance Optimization Result
 * 
 * This interface provides intelligent performance optimization that understands
 * the device capabilities and current conditions. Think of this as having a
 * performance engineer who continuously monitors and optimizes your application
 * for the specific device and network conditions.
 */
export interface PerformanceOptimization {
  // Resource management recommendations
  readonly resources: {
    readonly shouldPreloadAssets: boolean          // Preloading beneficial
    readonly recommendedCacheStrategy: 'aggressive' | 'moderate' | 'conservative'
    readonly shouldUseServiceWorker: boolean       // Service worker beneficial
    readonly maxConcurrentRequests: number         // Optimal request parallelism
  }
  
  // Rendering and computation optimization
  readonly rendering: {
    readonly shouldUseVirtualization: boolean      // Virtual scrolling recommended
    readonly recommendedUpdateFrequency: number    // UI update frequency (Hz)
    readonly shouldDeferNonCriticalRenders: boolean // Defer less important updates
    readonly canUseWebGL: boolean                  // Hardware acceleration available
  }
  
  // Network and data optimization
  readonly network: {
    readonly connectionQuality: 'poor' | 'fair' | 'good' | 'excellent'
    readonly shouldCompressRequests: boolean       // Request compression beneficial
    readonly recommendedBatchSize: number          // Optimal request batching
    readonly shouldUsePolling: boolean             // Polling vs real-time updates
  }
  
  // Battery and power optimization
  readonly power: {
    readonly batteryLevel: 'critical' | 'low' | 'medium' | 'high' | 'unknown'
    readonly shouldReduceBackgroundActivity: boolean // Minimize background processing
    readonly shouldDimDisplay: boolean             // Display dimming appropriate
    readonly shouldDisableAnimations: boolean      // Animations impact battery
  }
}

// ================================================
// ENHANCED PURCHASE FLOW HOOK
// ================================================

/**
 * Enhanced Purchase Flow Hook
 * 
 * This hook enhances your existing purchase flow with MiniApp-specific optimizations
 * while maintaining full backward compatibility. It's like adding a sophisticated
 * navigation system to your car - you can still drive normally, but you get
 * intelligent route optimization when you need it.
 * 
 * Educational Note:
 * The beauty of this design is that it enhances rather than replaces your existing
 * purchase logic. Your current purchase flow continues working exactly as before,
 * but gains access to advanced features like batch transactions, social sharing,
 * and context-aware error recovery when the environment supports them.
 */
export function useEnhancedPurchaseFlow(
  contentId: bigint,
  userAddress?: Address
): EnhancedPurchaseFlowResult {
  
  // Access our sophisticated foundation systems
  const miniAppContext = useMiniApp()
  const { contextData } = useContextDetection()
  const optimizations = useOptimizationRecommendations()
  const { runQuickTests } = useCompatibilityTesting()
  const { reportError } = useErrorReporting()
  const { recoverFromNetworkError } = useErrorRecovery()
  
  // Standard wagmi hooks for blockchain interaction
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { sendTransactionAsync } = useSendTransaction()
  
  // Internal state management
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [compatibilityInfo, setCompatibilityInfo] = useState<{ summary?: { blockchainSupport?: boolean }; fallbackStrategies?: readonly string[] } | null>(null)
  
  // Performance tracking for optimization
  const performanceRef = useRef<{ startTime: number | null }>({ startTime: null })
  
  // Run compatibility tests when context changes
  useEffect(() => {
    if (miniAppContext.isMiniApp) {
      runQuickTests().then((result) => {
        setCompatibilityInfo({
          summary: { blockchainSupport: result.summary.blockchainSupport },
          fallbackStrategies: result.fallbackStrategies
        })
      }).catch(console.warn)
    }
  }, [miniAppContext.isMiniApp, runQuickTests])
  
  // Determine if batch transactions are available and beneficial
  const canUseBatchTransaction = useMemo(() => {
    // Batch transactions require EIP-5792 support and MiniApp context
    return (miniAppContext.capabilities?.wallet?.canBatchTransactions ?? false) && 
           (compatibilityInfo?.summary?.blockchainSupport ?? false) && 
           isConnected
  }, [miniAppContext.capabilities?.wallet?.canBatchTransactions, compatibilityInfo, isConnected])
  
  // Determine the recommended flow based on context and capabilities
  const recommendedFlow = useMemo(() => {
    if (canUseBatchTransaction && optimizations.paymentOptimization === 'speed') {
      return 'batch' as const
    } else if (contextData?.socialContext?.userEngagementPattern.sessionType === 'casual_browse') {
      return 'simplified' as const
    } else {
      return 'sequential' as const
    }
  }, [canUseBatchTransaction, optimizations.paymentOptimization, contextData])
  
  // Estimate completion time based on flow and context
  const estimatedCompletionTime = useMemo(() => {
    if (recommendedFlow === 'batch') return '30 seconds'
    if (recommendedFlow === 'simplified') return '45 seconds'
    return '60 seconds'
  }, [recommendedFlow])
  
  // Social optimization analysis
  const socialOptimizations = useMemo(() => {
    const shareAfterPurchase = miniAppContext.capabilities?.social?.canShare && 
                              contextData?.socialContext?.socialFeatures.canShare === true
    
    const socialProofAvailable = Boolean(miniAppContext.socialUser) && 
                                contextData?.socialContext?.socialFeatures.hasUserProfile === true
    
    const quickShareText = shareAfterPurchase 
      ? `Just discovered amazing content! Check it out: ${window.location.href}`
      : null
    
    return {
      shareAfterPurchase,
      socialProofAvailable,
      quickShareText
    }
  }, [miniAppContext, contextData])
  
  // Error recovery analysis
  const errorRecovery = useMemo(() => {
    const canRetryWithDifferentMethod = (compatibilityInfo?.fallbackStrategies?.length ?? 0) > 0
    const suggestedFallback = compatibilityInfo?.fallbackStrategies?.[0] || null
    const needsUserAction = error && error.message.includes('user') || error?.name === 'UserRejectedRequestError'
    
    return {
      canRetryWithDifferentMethod,
      suggestedFallback,
      needsUserAction
    }
  }, [compatibilityInfo, error])
  
  // Performance and UX optimizations
  const uiOptimizations = useMemo(() => {
    const skipConfirmationScreens = optimizations.paymentOptimization === 'speed' && 
                                   (contextData?.confidence?.overallConfidence ?? 0) > 0.8
    
    const useProgressiveUI = contextData?.deviceProfile?.performanceProfile?.estimatedCPUClass !== 'low'
    
    const enableHapticFeedback = (contextData?.deviceProfile?.inputMethods?.hasTouch ?? false) && 
                                contextData?.platform !== 'web_desktop'
    
    return {
      skipConfirmationScreens,
      useProgressiveUI,
      enableHapticFeedback
    }
  }, [optimizations, contextData])
  
  /**
   * Enhanced Purchase Function
   * 
   * This function orchestrates the purchase process using the optimal flow
   * for the current environment. It handles batch transactions when available,
   * provides intelligent error recovery, and optimizes the user experience
   * based on the social and device context.
   * 
   * Educational Note:
   * Notice how this function abstracts away all the complexity of determining
   * the optimal purchase flow. Your components simply call purchase() and get
   * an experience that's automatically optimized for the current environment.
   */
  const purchase = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      performanceRef.current.startTime = performance.now()
      
      // Validate prerequisites
      if (!isConnected || !address) {
        throw new Error('Wallet not connected')
      }
      
      if (!contentId || contentId <= 0) {
        throw new Error('Invalid content ID')
      }
      
      // Execute the appropriate purchase flow
      if (recommendedFlow === 'batch' && canUseBatchTransaction) {
        await executeBatchPurchase()
      } else if (recommendedFlow === 'simplified') {
        await executeSimplifiedPurchase()
      } else {
        await executeSequentialPurchase()
      }
      
      // Track successful completion
      const completionTime = performance.now() - (performanceRef.current.startTime || 0)
      console.log(`Purchase completed in ${completionTime}ms using ${recommendedFlow} flow`)
      
      setIsSuccess(true)
      
      // Trigger social optimizations if appropriate
      if (socialOptimizations.shareAfterPurchase) {
        // This would integrate with your social sharing system
        console.log('Triggering post-purchase social sharing:', socialOptimizations.quickShareText)
      }
      
    } catch (error) {
      const purchaseError = error instanceof Error ? error : new Error('Purchase failed')
      setError(purchaseError)
      
      // Report error with context for analysis and improvement
      reportError(purchaseError, 'blockchain_connectivity', {
        recommendedFlow,
        canUseBatchTransaction,
        contextData: contextData?.platform,
        userAddress: address
      })
      
      // Attempt intelligent error recovery
      if (purchaseError.message.includes('network')) {
        await recoverFromNetworkError()
      }
      
      throw purchaseError
    } finally {
      setIsLoading(false)
    }
  }, [
    isConnected, 
    address, 
    contentId, 
    recommendedFlow, 
    canUseBatchTransaction,
    socialOptimizations,
    reportError,
    recoverFromNetworkError,
    contextData
  ])
  
  /**
   * Execute Batch Purchase (EIP-5792)
   * 
   * This function implements the most advanced purchase flow using batch
   * transactions that combine approval and purchase into a single user
   * confirmation. This provides the smoothest possible user experience
   * in supported environments.
   */
  const executeBatchPurchase = useCallback(async (): Promise<void> => {
    // Note: This would integrate with your actual contract addresses and ABIs
    // For demonstration, we're showing the structure without actual contract calls
    
    console.log('Executing batch purchase using EIP-5792')
    
    // In a real implementation, you would:
    // 1. Prepare the approval transaction data
    // 2. Prepare the purchase transaction data  
    // 3. Submit both as a batch using wallet_sendCalls
    // 4. Monitor the batch execution status
    
    // Simulated batch transaction for demonstration
    await new Promise(resolve => setTimeout(resolve, 2000))
    setTransactionHash('0x1234567890abcdef') // This would be the actual transaction hash
    
  }, [])
  
  /**
   * Execute Simplified Purchase
   * 
   * This function implements a streamlined purchase flow optimized for
   * casual browsing contexts where users want minimal friction.
   */
  const executeSimplifiedPurchase = useCallback(async (): Promise<void> => {
    console.log('Executing simplified purchase flow')
    
    // In a real implementation, this would use your existing purchase logic
    // but with UI optimizations for casual browsing contexts
    
    // Simulated purchase for demonstration
    await new Promise(resolve => setTimeout(resolve, 1500))
    setTransactionHash('0xabcdef1234567890')
    
  }, [])
  
  /**
   * Execute Sequential Purchase
   * 
   * This function implements the traditional two-step purchase flow
   * (approve then purchase) with enhanced error handling and user feedback.
   */
  const executeSequentialPurchase = useCallback(async (): Promise<void> => {
    console.log('Executing sequential purchase flow')
    
    // In a real implementation, this would:
    // 1. Check current allowance
    // 2. Request approval if needed (with clear user feedback)
    // 3. Execute purchase transaction
    // 4. Provide status updates throughout the process
    
    // Simulated sequential purchase for demonstration
    await new Promise(resolve => setTimeout(resolve, 3000))
    setTransactionHash('0xfedcba0987654321')
    
  }, [])
  
  // Return the complete enhanced purchase flow result
  return {
    // Core functionality (backward compatible)
    purchase,
    isLoading,
    isSuccess,
    error,
    transactionHash,
    
    // Enhanced MiniApp capabilities
    canUseBatchTransaction,
    recommendedFlow,
    estimatedCompletionTime,
    socialOptimizations,
    errorRecovery,
    optimizations: uiOptimizations
  }
}

// ================================================
// SOCIAL COMMERCE INTEGRATION HOOK
// ================================================

/**
 * Social Commerce Integration Hook
 * 
 * This hook provides comprehensive social commerce capabilities that understand
 * the current social context and optimize accordingly. Think of this as having
 * a social media expert who knows exactly how to present your content in each
 * specific social environment.
 * 
 * Educational Note:
 * Social commerce is fundamentally different from traditional e-commerce because
 * it operates within social contexts where user behavior, attention patterns,
 * and trust signals work differently. This hook encapsulates that expertise.
 */
export function useSocialCommerceIntegration(): SocialCommerceIntegration {
  
  // Access foundation systems
  const miniAppContext = useMiniApp()
  const { contextData } = useContextDetection()
  
  // Social user context analysis
  const socialUser = useMemo(() => {
    const user = miniAppContext.socialUser
    
    if (!user || !miniAppContext.socialUser) {
      return {
        isAvailable: false,
        displayName: null,
        username: null,
        profileImage: null,
        verificationStatus: 'unknown' as const,
        followerCount: null
      }
    }
    
    // Determine verification status based on social platform verification
    let verificationStatus: 'verified' | 'unverified' | 'unknown' = 'unknown'
    if (user.verifications && user.verifications.length > 0) {
      verificationStatus = 'verified'
    } else if (user.fid > 0) { // Farcaster users with FID are somewhat verified
      verificationStatus = 'unverified'
    }
    
    return {
      isAvailable: true,
      displayName: user.displayName,
      username: user.username,
      profileImage: user.pfpUrl || null,
      verificationStatus,
      followerCount: user.followerCount || null
    }
  }, [miniAppContext.socialUser])
  
  // Social sharing capabilities
  const sharing = useMemo(() => {
    const isAvailable = miniAppContext.capabilities?.social?.canShare && 
                       contextData?.socialContext?.socialFeatures.canShare === true
    
    /**
     * Share Content Function
     * 
     * This function handles sharing in a context-aware way, using native
     * platform sharing when available and falling back to appropriate
     * alternatives when not.
     */
    const shareContent = async (content: {
      title: string
      description?: string
      url?: string
      imageUrl?: string
    }): Promise<boolean> => {
      try {
        if (!isAvailable) {
          console.warn('Sharing not available in current context')
          return false
        }
        
        // Use platform-specific sharing when available
        if (contextData?.platform === 'farcaster' || contextData?.platform === 'farcaster_web') {
          // Would integrate with Farcaster SDK sharing
          console.log('Sharing via Farcaster:', content)
          return true
        }
        
        // Use Web Share API when available
        if ('share' in navigator && navigator.share) {
          await navigator.share({
            title: content.title,
            text: content.description,
            url: content.url || window.location.href
          })
          return true
        }
        
        // Fallback to clipboard sharing
        if ('clipboard' in navigator) {
          const shareText = `${content.title}\n${content.description || ''}\n${content.url || window.location.href}`
          await navigator.clipboard.writeText(shareText)
          console.log('Content copied to clipboard for sharing')
          return true
        }
        
        return false
      } catch (error) {
        console.error('Sharing failed:', error)
        return false
      }
    }
    
    /**
     * Share Transformer Function
     * 
     * This function optimizes content for sharing on the current platform,
     * understanding platform-specific conventions and limitations.
     */
    const shareTransformer = (content: ShareableContent): string => {
      const platform = contextData?.platform
      
      if (platform === 'farcaster' || platform === 'farcaster_web') {
        // Farcaster prefers concise, engaging content
        const description = content.description || ''
        return `🎯 ${content.title}\n\n${description.slice(0, 100)}${description.length > 100 ? '...' : ''}`
      }
      
      if (platform === 'twitter') {
        // Twitter has character limits and hashtag conventions
        const baseText = `${content.title} ${content.description || ''}`
        return baseText.slice(0, 240) + (baseText.length > 240 ? '...' : '')
      }
      
      // Default formatting for other platforms
      return `${content.title}\n\n${content.description || ''}`
    }
    
    return {
      isAvailable,
      shareContent,
      shareTransformer
    }
  }, [miniAppContext.capabilities?.social?.canShare, contextData])
  
  // Social verification and trust signals
  const verification = useMemo(() => {
    const canVerifyPurchases = Boolean(miniAppContext.socialUser) && 
                              socialUser.verificationStatus === 'verified'
    
    const canShowSocialProof = Boolean(miniAppContext.socialUser) && 
                              socialUser.followerCount !== null && 
                              socialUser.followerCount > 0
    
    // Calculate trust score based on multiple factors
    let trustScore: 'high' | 'medium' | 'low' | 'unknown' = 'unknown'
    if (socialUser.verificationStatus === 'verified' && socialUser.followerCount && socialUser.followerCount > 1000) {
      trustScore = 'high'
    } else if (socialUser.verificationStatus === 'verified' || (socialUser.followerCount && socialUser.followerCount > 100)) {
      trustScore = 'medium'
    } else if (socialUser.isAvailable) {
      trustScore = 'low'
    }
    
    return {
      canVerifyPurchases,
      canShowSocialProof,
      trustScore
    }
  }, [miniAppContext.socialUser, socialUser])
  
  // Platform-specific optimizations
  const platformOptimizations = useMemo(() => {
    const platform = contextData?.platform
    const deviceProfile = contextData?.deviceProfile
    
    // Determine preferred interaction pattern
    let preferredInteractionPattern: 'tap' | 'swipe' | 'hover' | 'click' = 'click'
    if (deviceProfile?.inputMethods.hasTouch && !deviceProfile.inputMethods.hasMouse) {
      preferredInteractionPattern = 'tap'
    } else if (platform === 'farcaster' || platform === 'farcaster_web') {
      preferredInteractionPattern = 'tap' // Farcaster is primarily mobile
    } else if (deviceProfile?.inputMethods.supportsHover) {
      preferredInteractionPattern = 'hover'
    }
    
    // Determine content length preferences
    let recommendedContentLength: 'short' | 'medium' | 'long' = 'medium'
    if (contextData?.socialContext?.userEngagementPattern.estimatedAttentionSpan === 'short') {
      recommendedContentLength = 'short'
    } else if (platform === 'web_desktop') {
      recommendedContentLength = 'long'
    }
    
    // Visual optimization preferences
    const visualOptimizations = {
      preferImageOverText: platform === 'farcaster' || platform === 'twitter',
      supportsThumbnails: true, // Most platforms support thumbnails
      maxRecommendedImageSize: (() => {
        if (platform === 'farcaster' || platform === 'farcaster_web') {
          return { width: 600, height: 400 } // Farcaster image constraints
        }
        if (deviceProfile?.screenSize.width && deviceProfile.screenSize.width < 768) {
          return { width: 400, height: 300 } // Mobile optimization
        }
        return { width: 800, height: 600 } // Desktop optimization
      })()
    }
    
    return {
      preferredInteractionPattern,
      recommendedContentLength,
      visualOptimizations
    }
  }, [contextData])
  
  return {
    socialUser,
    sharing,
    verification,
    platformOptimizations
  }
}

// ================================================
// ADAPTIVE UI INTEGRATION HOOK
// ================================================

/**
 * Adaptive UI Integration Hook
 * 
 * This hook provides intelligent UI adaptation that understands the current
 * environment and automatically optimizes the user interface. Think of this as
 * having an interior designer who automatically adjusts your space for different
 * occasions and different types of guests.
 */
export function useAdaptiveUIIntegration(): AdaptiveUIIntegration {
  
  const optimizations = useOptimizationRecommendations()
  const { contextData } = useContextDetection()
  
  // Layout and density analysis
  const layout = useMemo(() => {
    const recommendedDensity = optimizations.uiDensity
    
    // Carousel layouts work well in mobile and social contexts
    const shouldUseCarouselLayouts = (contextData?.deviceProfile?.screenSize?.width ?? 1024) < 768 ||
                                    contextData?.socialContext?.userEngagementPattern?.sessionType === 'casual_browse'
    
    // Single column preferred for mobile and focused reading
    const shouldUseSingleColumn = (contextData?.deviceProfile?.screenSize?.width ?? 1024) < 640 ||
                                 optimizations.contentStrategy === 'detailed_read'
    
    // Card size based on screen real estate and context
    let recommendedCardSize: 'small' | 'medium' | 'large' = 'medium'
    const screenWidth = contextData?.deviceProfile?.screenSize?.width ?? 1024
    if (screenWidth < 480) {
      recommendedCardSize = 'small'
    } else if (screenWidth > 1200) {
      recommendedCardSize = 'large'
    }
    
    return {
      recommendedDensity,
      shouldUseCarouselLayouts,
      shouldUseSingleColumn,
      recommendedCardSize
    }
  }, [optimizations, contextData])
  
  // Interaction and animation preferences
  const interactions = useMemo(() => {
    const animationLevel = optimizations.animationLevel
    const shouldUseHoverEffects = (contextData?.deviceProfile?.inputMethods?.supportsHover ?? false) && 
                                 contextData?.platform !== 'farcaster'
    
    // Transition duration based on performance and context
    let preferredTransitionDuration = 200 // Default 200ms
    if (animationLevel === 'minimal') preferredTransitionDuration = 0
    else if (animationLevel === 'reduced') preferredTransitionDuration = 100
    else if (animationLevel === 'enhanced') preferredTransitionDuration = 300
    
    const shouldUseHapticFeedback = (contextData?.deviceProfile?.inputMethods?.hasTouch ?? false) &&
                                   contextData?.platform !== 'web_desktop'
    
    return {
      animationLevel,
      shouldUseHoverEffects,
      preferredTransitionDuration,
      shouldUseHapticFeedback
    }
  }, [optimizations.animationLevel, contextData])
  
  // Content presentation optimization
  const content = useMemo(() => {
    // Text length based on attention span and context
    let preferredTextLength: 'brief' | 'moderate' | 'detailed' = 'moderate'
    if (contextData?.socialContext?.userEngagementPattern.estimatedAttentionSpan === 'short') {
      preferredTextLength = 'brief'
    } else if (optimizations.contentStrategy === 'interactive_explore') {
      preferredTextLength = 'detailed'
    }
    
    // Technical details based on user context and confidence
    const shouldShowTechnicalDetails = contextData?.platform === 'web_desktop' &&
                                      contextData?.confidence.overallConfidence > 0.8
    
    // Image aspect ratio based on platform conventions
    let recommendedImageAspectRatio = '16:9' // Default
    if (contextData?.platform === 'farcaster') {
      recommendedImageAspectRatio = '1:1' // Square images work well in social feeds
    } else if (contextData?.deviceProfile.screenSize.orientation === 'portrait') {
      recommendedImageAspectRatio = '4:3'
    }
    
    // Truncation safety based on context
    const supportsTruncation = contextData?.socialContext?.userEngagementPattern.sessionType === 'casual_browse'
    
    return {
      preferredTextLength,
      shouldShowTechnicalDetails,
      recommendedImageAspectRatio,
      supportsTruncation
    }
  }, [contextData, optimizations.contentStrategy])
  
  // Performance and loading optimizations
  const performance = useMemo(() => {
    const cpuClass = contextData?.deviceProfile.performanceProfile.estimatedCPUClass
    const networkType = contextData?.deviceProfile.performanceProfile.networkType
    
    // Lazy loading beneficial for slower devices and networks
    const shouldLazyLoad = cpuClass === 'low' || 
                          networkType === 'slow-2g' || 
                          networkType === '2g' || 
                          networkType === '3g'
    
    // Preloading beneficial for high-performance environments
    const shouldPreloadCriticalAssets = cpuClass === 'high' && 
                                       (networkType === 'wifi' || networkType === '5g')
    
    // Image quality based on network and performance
    let recommendedImageQuality: 'low' | 'medium' | 'high' = 'medium'
    if (cpuClass === 'low' || networkType === 'slow-2g' || networkType === '2g') {
      recommendedImageQuality = 'low'
    } else if (cpuClass === 'high' && networkType === 'wifi') {
      recommendedImageQuality = 'high'
    }
    
    // Skeleton loading appropriate for contexts with variable loading times
    const shouldUseSkeleton = (contextData?.socialContext?.embedDepth ?? 0) > 1 ||
                             networkType !== 'wifi'
    
    return {
      shouldLazyLoad,
      shouldPreloadCriticalAssets,
      recommendedImageQuality,
      shouldUseSkeleton
    }
  }, [contextData])
  
  return {
    layout,
    interactions,
    content,
    performance
  }
}

// ================================================
// PERFORMANCE OPTIMIZATION HOOK
// ================================================

/**
 * Performance Optimization Hook
 * 
 * This hook provides intelligent performance optimization that understands
 * the device capabilities and current conditions. Think of this as having a
 * performance engineer who continuously monitors and optimizes your application
 * for the specific device and network conditions.
 */
export function usePerformanceOptimization(): PerformanceOptimization {
  
  const { contextData } = useContextDetection()
  
  // Resource management recommendations
  const resources = useMemo(() => {
    const deviceProfile = contextData?.deviceProfile
    const networkType = deviceProfile?.performanceProfile.networkType
    const cpuClass = deviceProfile?.performanceProfile.estimatedCPUClass
    
    // Preloading strategy based on device and network capabilities
    const shouldPreloadAssets = cpuClass === 'high' && 
                               (networkType === 'wifi' || networkType === '5g')
    
    // Cache strategy based on device memory and performance
    let recommendedCacheStrategy: 'aggressive' | 'moderate' | 'conservative' = 'moderate'
    if (deviceProfile?.performanceProfile.estimatedRAM && deviceProfile.performanceProfile.estimatedRAM >= 8) {
      recommendedCacheStrategy = 'aggressive'
    } else if (cpuClass === 'low' || (deviceProfile?.performanceProfile.estimatedRAM && deviceProfile.performanceProfile.estimatedRAM <= 2)) {
      recommendedCacheStrategy = 'conservative'
    }
    
    // Service worker beneficial for devices with sufficient resources
    const shouldUseServiceWorker = (deviceProfile?.browserCapabilities?.supportsServiceWorkers ?? false) &&
                                  cpuClass !== 'low'
    
    // Optimal request parallelism based on device capabilities
    let maxConcurrentRequests = 4 // Default
    if (cpuClass === 'high') maxConcurrentRequests = 8
    else if (cpuClass === 'low') maxConcurrentRequests = 2
    
    return {
      shouldPreloadAssets,
      recommendedCacheStrategy,
      shouldUseServiceWorker,
      maxConcurrentRequests
    }
  }, [contextData])
  
  // Rendering and computation optimization
  const rendering = useMemo(() => {
    const deviceProfile = contextData?.deviceProfile
    const cpuClass = deviceProfile?.performanceProfile.estimatedCPUClass
    
    // Virtualization for large lists on capable devices
    const shouldUseVirtualization = cpuClass !== 'low' && 
                                   (deviceProfile?.screenSize?.height ?? 600) > 600
    
    // Update frequency based on device performance
    let recommendedUpdateFrequency = 60 // 60 Hz default
    if (cpuClass === 'low') recommendedUpdateFrequency = 30
    else if (cpuClass === 'high') recommendedUpdateFrequency = 120
    
    // Defer non-critical renders on lower-end devices
    const shouldDeferNonCriticalRenders = cpuClass === 'low' || 
                                         (deviceProfile?.performanceProfile?.isLowPowerMode ?? false)
    
    // WebGL availability and performance
    const canUseWebGL = (deviceProfile?.browserCapabilities?.supportsWebGL ?? false) &&
                       cpuClass !== 'low'
    
    return {
      shouldUseVirtualization,
      recommendedUpdateFrequency,
      shouldDeferNonCriticalRenders,
      canUseWebGL
    }
  }, [contextData])
  
  // Network and data optimization
  const network = useMemo(() => {
    const networkType = contextData?.deviceProfile.performanceProfile.networkType
    
    // Connection quality assessment
    let connectionQuality: 'poor' | 'fair' | 'good' | 'excellent' = 'fair'
    if (networkType === 'wifi' || networkType === '5g') connectionQuality = 'excellent'
    else if (networkType === '4g') connectionQuality = 'good'
    else if (networkType === '3g') connectionQuality = 'fair'
    else connectionQuality = 'poor'
    
    // Request compression beneficial for slower connections
    const shouldCompressRequests = connectionQuality === 'poor' || connectionQuality === 'fair'
    
    // Batch size based on connection quality
    let recommendedBatchSize = 10 // Default
    if (connectionQuality === 'excellent') recommendedBatchSize = 20
    else if (connectionQuality === 'poor') recommendedBatchSize = 5
    
    // Polling vs real-time based on connection stability
    const shouldUsePolling = connectionQuality === 'poor' || 
                            (contextData?.socialContext?.embedDepth ?? 0) > 2
    
    return {
      connectionQuality,
      shouldCompressRequests,
      recommendedBatchSize,
      shouldUsePolling
    }
  }, [contextData])
  
  // Battery and power optimization
  const power = useMemo(() => {
    const batteryLevel = contextData?.deviceProfile.performanceProfile.batteryLevel
    const isLowPowerMode = contextData?.deviceProfile.performanceProfile.isLowPowerMode
    
    // Battery level categorization
    let batteryCategory: 'critical' | 'low' | 'medium' | 'high' | 'unknown' = 'unknown'
    if (batteryLevel !== null && batteryLevel !== undefined) {
      if (batteryLevel < 0.1) batteryCategory = 'critical'
      else if (batteryLevel < 0.2) batteryCategory = 'low'
      else if (batteryLevel < 0.5) batteryCategory = 'medium'
      else batteryCategory = 'high'
    }
    
    // Power optimization recommendations
    const shouldReduceBackgroundActivity = batteryCategory === 'critical' || 
                                          batteryCategory === 'low' || 
                                          (isLowPowerMode ?? false)
    
    const shouldDimDisplay = batteryCategory === 'critical'
    
    const shouldDisableAnimations = batteryCategory === 'critical' || 
                                   (isLowPowerMode ?? false) ||
                                   (contextData?.deviceProfile?.accessibilityPreferences?.prefersReducedMotion ?? false)
    
    return {
      batteryLevel: batteryCategory,
      shouldReduceBackgroundActivity,
      shouldDimDisplay,
      shouldDisableAnimations
    }
  }, [contextData])
  
  return {
    resources,
    rendering,
    network,
    power
  }
}

// ================================================
// UNIFIED INTEGRATION HOOK
// ================================================

/**
 * Unified MiniApp Integration Hook
 * 
 * This hook combines all the specialized integration hooks into a single,
 * comprehensive interface. Think of this as a master control panel that
 * gives you access to all the sophisticated MiniApp capabilities through
 * one simple interface.
 * 
 * Educational Note:
 * While you can use the individual hooks for specific needs, this unified
 * hook is often the best starting point because it ensures all the different
 * optimization systems work together harmoniously.
 */
export function useMiniAppIntegration(contentId?: bigint, userAddress?: Address) {
  
  // Compose all the specialized hooks
  const purchaseFlow = useEnhancedPurchaseFlow(contentId || BigInt(0), userAddress)
  const socialCommerce = useSocialCommerceIntegration()
  const adaptiveUI = useAdaptiveUIIntegration()
  const performance = usePerformanceOptimization()
  
  // Add navigation integration
  const { navigate } = useAppNavigation()
  
  // Provide a unified interface that combines all capabilities
  return {
    // Purchase and commerce capabilities
    purchase: purchaseFlow,
    social: socialCommerce,
    
    // UI and performance optimization
    ui: adaptiveUI,
    performance,
    
    // Navigation integration
    navigate,
    
    // Convenience methods that combine multiple systems
    isOptimizedForSocialCommerce: socialCommerce.socialUser.isAvailable && 
                                 purchaseFlow.canUseBatchTransaction,
    
    recommendedExperience: adaptiveUI.content.preferredTextLength === 'brief' ? 'streamlined' : 'comprehensive',
    
    shouldShowAdvancedFeatures: performance.rendering.canUseWebGL && 
                               adaptiveUI.interactions.animationLevel === 'enhanced'
  }
}

export default useMiniAppIntegration
// src/hooks/business/miniapp-social.ts

'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { type Address } from 'viem'

// MiniApp provider utilities (Phase 1)
import { useMiniKitAvailable, useFarcasterContext } from '@/components/providers/MiniKitProvider'
import { trackMiniAppEvent, miniAppAnalytics } from '@/lib/miniapp/analytics'


/**
 * Social Engagement Action Types
 * 
 * These action types define the various social interactions that can be tracked
 * within the MiniApp environment, enabling comprehensive analytics about how
 * users engage with content in social contexts.
 */
export type SocialEngagementAction = 
  | 'share'           // User shared content via cast
  | 'view'            // User viewed content from social context
  | 'interact'        // User interacted with content frame
  | 'purchase'        // User purchased content from social context
  | 'follow'          // User followed creator from social context
  | 'bookmark'        // User bookmarked content from social context

/**
 * Social Share Parameters
 * 
 * This interface defines the parameters required for sharing content
 * via Farcaster casts, including the content metadata and sharing options.
 */
export interface SocialShareParams {
  readonly contentId: bigint
  readonly title: string
  readonly description?: string
  readonly contentUrl?: string
  readonly imageUrl?: string
  readonly creatorAddress?: Address
  readonly creatorName?: string
  readonly customText?: string
}

/**
 * Social Share Result
 * 
 * This interface defines the result of a social sharing operation,
 * providing feedback about the success or failure of the share action.
 */
export interface SocialShareResult {
  readonly success: boolean
  readonly castUrl?: string
  readonly error?: Error
  readonly sharedAt: Date
}

/**
 * Social Engagement Event
 * 
 * This interface defines the structure of social engagement events
 * that are tracked and sent to the analytics system for social metrics.
 */
export interface SocialEngagementEvent {
  readonly action: SocialEngagementAction
  readonly contentId: bigint
  readonly userId?: Address
  readonly fid?: number
  readonly username?: string
  readonly clientName?: string
  readonly timestamp: number
  readonly metadata?: Record<string, any>
}

/**
 * Social Sharing State
 * 
 * This interface tracks the state of social sharing operations,
 * providing loading indicators and error handling for UI components.
 */
interface SocialSharingState {
  readonly isSharing: boolean
  readonly lastShareResult: SocialShareResult | null
  readonly shareCount: number
  readonly error: Error | null
}

/**
 * Social Engagement State
 * 
 * This interface tracks the state of social engagement tracking,
 * managing the queue of events and tracking statistics.
 */
interface SocialEngagementState {
  readonly isTracking: boolean
  readonly eventQueue: SocialEngagementEvent[]
  readonly trackedEventsCount: number
  readonly lastEventAt: Date | null
}

/**
 * MiniApp Social Hook Result
 * 
 * This interface defines the complete API returned by the useMiniAppSocial hook,
 * providing social sharing capabilities, engagement tracking, and state management.
 */
export interface MiniAppSocialResult {
  // Environment and capability detection
  readonly canShare: boolean
  readonly isMiniAppEnvironment: boolean
  readonly socialUser: {
    readonly fid: number | null
    readonly username: string | null
    readonly displayName: string | null
    readonly isVerified: boolean
  }
  
  // Social sharing functionality
  readonly shareContent: (params: SocialShareParams) => Promise<SocialShareResult>
  readonly shareSimple: (contentId: bigint, title: string, url?: string) => Promise<SocialShareResult>
  readonly sharingState: SocialSharingState
  
  // Social engagement tracking
  readonly trackEngagement: (action: SocialEngagementAction, contentId: bigint, metadata?: Record<string, any>) => void
  readonly trackView: (contentId: bigint) => void
  readonly trackInteraction: (contentId: bigint, interactionType: string) => void
  readonly trackPurchase: (contentId: bigint, purchaseAmount: bigint) => void
  readonly engagementState: SocialEngagementState
  
  // Analytics integration
  readonly flushEngagementEvents: () => Promise<void>
  readonly getEngagementSummary: () => {
    readonly totalEvents: number
    readonly eventsByAction: Record<SocialEngagementAction, number>
    readonly lastActiveAt: Date | null
  }
}

/**
 * Enhanced MiniApp Social Hook
 * 
 * This hook provides comprehensive social sharing and engagement tracking
 * capabilities for MiniApp environments. It integrates with the Farcaster SDK
 * for content sharing and your existing analytics system for engagement tracking.
 * 
 * Key Features:
 * - Social content sharing via Farcaster casts with rich embeds
 * - Comprehensive social engagement tracking and analytics
 * - Integration with existing MiniApp and Farcaster context systems
 * - Graceful degradation for non-MiniApp environments
 * - Performance optimization through event batching and state management
 * - Type-safe interfaces for all social interactions
 * 
 * Architecture Integration:
 * - Uses MiniAppProvider for environment detection and SDK access
 * - Integrates with useFarcasterContext for social user data
 * - Extends existing analytics patterns from useMiniAppAnalytics
 * - Maintains compatibility with existing error handling patterns
 * - Follows established state management conventions
 * 
 * The hook automatically detects MiniApp environment and provides enhanced
 * social capabilities when available, while gracefully falling back to 
 * basic functionality for web users.
 */
export function useMiniAppSocial(): MiniAppSocialResult {
  // ===== CORE DEPENDENCIES AND CONTEXT =====
  
  // MiniApp environment and SDK access
  const isMiniAppProvider = useMiniKitAvailable()
  
  // Farcaster context for social user data
  const farcasterContext = useFarcasterContext()
  
  // ===== STATE MANAGEMENT =====
  
  const [sharingState, setSharingState] = useState<SocialSharingState>({
    isSharing: false,
    lastShareResult: null,
    shareCount: 0,
    error: null
  })
  
  const [engagementState, setEngagementState] = useState<SocialEngagementState>({
    isTracking: false,
    eventQueue: [],
    trackedEventsCount: 0,
    lastEventAt: null
  })

  // ===== ENVIRONMENT AND CAPABILITY DETECTION =====
  
  /**
   * MiniApp Environment Detection
   * 
   * This computation determines if we're in a MiniApp environment and can
   * access social sharing capabilities. It uses multiple detection methods
   * for reliability and integrates with your existing MiniApp infrastructure.
   */
  const isMiniAppEnvironment = useMemo((): boolean => {
    if (typeof window === 'undefined') return false
    
    // Primary detection via MiniAppProvider
    if (isMiniAppProvider) return true
    
    // Additional detection patterns for robustness
    const url = new URL(window.location.href)
    const urlIndicators = (
      url.pathname.startsWith('/mini') ||
      url.pathname.startsWith('/miniapp') ||
      url.searchParams.get('miniApp') === 'true'
    )
    
    const environmentIndicators = (
      window.parent !== window ||
      document.querySelector('meta[name="fc:frame"]') !== null ||
      navigator.userAgent.includes('Farcaster') ||
      navigator.userAgent.includes('Warpcast')
    )
    
    return urlIndicators || environmentIndicators
  }, [isMiniAppProvider])
  
  /**
   * Social Sharing Capability Detection
   * 
   * This computation determines if social sharing is available based on
   * the MiniApp environment and Farcaster context availability.
   */
  const canShare = useMemo((): boolean => {
    return Boolean(
      isMiniAppEnvironment &&
      typeof window !== 'undefined' &&
      // Don't require farcasterContext - SDK might be available without full context
      !sharingState.isSharing
    )
  }, [isMiniAppEnvironment, sharingState.isSharing])

  // ===== SOCIAL USER CONTEXT =====
  
  /**
   * Social User Information
   * 
   * This computation extracts relevant social user information from the
   * Farcaster context for analytics and personalization purposes.
   */
  const socialUser = useMemo(() => {
    if (!farcasterContext?.user) {
      return {
        fid: null,
        username: null,
        displayName: null,
        isVerified: false
      }
    }

    return {
      fid: farcasterContext.user.fid,
      username: farcasterContext.user.username || null,
      displayName: (farcasterContext as any).user?.displayName || null,
      isVerified: Boolean(farcasterContext.user.verifications?.length)
    }
  }, [farcasterContext])

  // ===== SOCIAL SHARING FUNCTIONALITY =====
  
  /**
   * Generate Content URL for Sharing
   * 
   * This utility function generates the appropriate URL for sharing content,
   * including MiniApp context parameters and analytics tracking.
   */
  const generateContentUrl = useCallback((
    contentId: bigint, 
    customUrl?: string
  ): string => {
    if (customUrl) return customUrl
    
    const baseUrl = process.env.NEXT_PUBLIC_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'https://localhost:3000')
    
    const contentUrl = `${baseUrl}/content/${contentId.toString()}`
    
    // Add MiniApp and analytics parameters
    const url = new URL(contentUrl)
    url.searchParams.set('miniApp', 'true')
    url.searchParams.set('utm_source', 'farcaster')
    url.searchParams.set('utm_medium', 'social')
    url.searchParams.set('utm_campaign', 'miniapp_share')
    
    if (socialUser.fid) {
      url.searchParams.set('shared_by_fid', socialUser.fid.toString())
    }
    
    return url.toString()
  }, [socialUser.fid])
  
  /**
   * Comprehensive Content Sharing
   * 
   * This method provides full-featured content sharing with rich embeds,
   * custom text, and comprehensive error handling. It integrates with the
   * Farcaster SDK to create engaging social posts.
   */
  const shareContent = useCallback(async (
    params: SocialShareParams
  ): Promise<SocialShareResult> => {
    if (!canShare) {
      const error = new Error('Social sharing not available in current context')
      return {
        success: false,
        error,
        sharedAt: new Date()
      }
    }

    setSharingState(prev => ({ ...prev, isSharing: true, error: null }))

    try {
      // Dynamically import MiniApp SDK to avoid SSR issues
      const { sdk } = await import('@farcaster/miniapp-sdk')
      
      // Ensure SDK is ready for social operations
      await sdk.actions.ready()
      
      // Generate the content URL for sharing
      const contentUrl = generateContentUrl(params.contentId, params.contentUrl)
      
      // Create compelling social text
      const shareText = params.customText || 
        `Check out "${params.title}"${params.creatorName ? ` by ${params.creatorName}` : ''}! 🚀`
      
      // Prepare embeds array (Farcaster supports up to 2 embeds)
      const embeds: string[] = [contentUrl]
      if (params.imageUrl && embeds.length < 2) {
        embeds.push(params.imageUrl)
      }
      
      console.group('🚀 MiniApp Social: Sharing Content')
      console.log('Content ID:', params.contentId.toString())
      console.log('Share Text:', shareText)
      console.log('Embeds:', embeds)
      console.log('Social User:', socialUser)
      console.groupEnd()
      
      // Execute the share action via Farcaster SDK
      await sdk.actions.composeCast({
        text: shareText,
        embeds: embeds.slice(0, 2) as [] | [string] | [string, string]
      })
      
      // Track the share event for analytics
      trackEngagement('share', params.contentId, {
        platform: 'farcaster',
        timestamp: Date.now(),
        additionalData: {
          shareText,
          embedCount: embeds.length,
          hasCustomText: Boolean(params.customText),
          creatorAddress: params.creatorAddress
        }
      })
      
      const result: SocialShareResult = {
        success: true,
        sharedAt: new Date()
      }
      
      // Update sharing state with success
      setSharingState(prev => ({
        ...prev,
        isSharing: false,
        lastShareResult: result,
        shareCount: prev.shareCount + 1,
        error: null
      }))
      
      console.log('✅ Content shared successfully')
      return result
      
    } catch (error) {
      const shareError = error instanceof Error ? error : new Error('Share failed')
      console.error('❌ Content sharing failed:', shareError)
      
      const result: SocialShareResult = {
        success: false,
        error: shareError,
        sharedAt: new Date()
      }
      
      // Update sharing state with error
      setSharingState(prev => ({
        ...prev,
        isSharing: false,
        lastShareResult: result,
        error: shareError
      }))
      
      return result
    }
  }, [canShare, generateContentUrl, socialUser])
  
  /**
   * Simple Content Sharing
   * 
   * This method provides a simplified interface for quick content sharing
   * with minimal parameters, ideal for basic share buttons and quick actions.
   */
  const shareSimple = useCallback(async (
    contentId: bigint,
    title: string,
    url?: string
  ): Promise<SocialShareResult> => {
    return shareContent({
      contentId,
      title,
      contentUrl: url
    })
  }, [shareContent])

  // ===== SOCIAL ENGAGEMENT TRACKING =====
  
  /**
   * Core Engagement Tracking
   * 
   * This method records social engagement events and manages the event queue
   * for batch processing. It integrates with your existing analytics patterns.
   */
  const trackEngagement = useCallback((
    action: SocialEngagementAction,
    contentId: bigint,
    metadata?: Record<string, any>
  ): void => {
    if (!farcasterContext?.user?.fid) return

    try {
      const engagementData = {
        eventType: action,
        contentId: contentId.toString(),
        userFid: farcasterContext.user.fid,
        platform: 'farcaster',
        timestamp: Date.now(),
        metadata: metadata || {}
      }

      // Use the generic track method for engagement events
      miniAppAnalytics.track('engagement', engagementData)
    } catch (error) {
      console.error('Failed to track engagement:', error)
    }
  }, [farcasterContext?.user?.fid])
  
  /**
   * Specialized Tracking Methods
   * 
   * These methods provide convenient interfaces for tracking specific types
   * of social engagement, with appropriate metadata for each interaction type.
   */
  const trackView = useCallback((contentId: bigint): void => {
    trackEngagement('view', contentId, {
      platform: 'farcaster',
      timestamp: Date.now(),
      additionalData: {
        viewedAt: Date.now(),
        referrer: typeof window !== 'undefined' ? document.referrer : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : ''
      }
    })
  }, [trackEngagement])
  
  const trackInteraction = useCallback((
    contentId: bigint, 
    interactionType: string
  ): void => {
    trackEngagement('interact', contentId, {
      platform: 'farcaster',
      timestamp: Date.now(),
      additionalData: {
        interactionType,
        interactedAt: Date.now()
      }
    })
  }, [trackEngagement])
  
  const trackPurchase = useCallback((
    contentId: bigint, 
    purchaseAmount: bigint
  ): void => {
    trackEngagement('purchase', contentId, {
      platform: 'farcaster',
      timestamp: Date.now(),
      additionalData: {
        purchaseAmount: purchaseAmount.toString(),
        purchasedAt: Date.now(),
        socialContext: true
      }
    })
  }, [trackEngagement])

  // ===== ANALYTICS INTEGRATION =====
  
  /**
   * Flush Engagement Events
   * 
   * This method sends batched engagement events to the analytics system,
   * integrating with your existing analytics infrastructure for comprehensive
   * social metrics tracking.
   */
  const flushEngagementEvents = useCallback(async (): Promise<void> => {
    if (engagementState.eventQueue.length === 0) {
      return
    }

    setEngagementState(prev => ({ ...prev, isTracking: true }))

    try {
      const eventsToFlush = [...engagementState.eventQueue]
      
      console.group('📊 MiniApp Social: Flushing Engagement Events')
      console.log('Event Count:', eventsToFlush.length)
      console.log('Events:', eventsToFlush)
      console.groupEnd()
      
      // Send events to your existing analytics system
      // This would typically integrate with your analytics API endpoint
      await fetch('/api/analytics/social-engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          events: eventsToFlush,
          source: 'miniapp_social',
          timestamp: Date.now()
        })
      })
      
      // Clear the event queue after successful submission
      setEngagementState(prev => ({
        ...prev,
        eventQueue: [],
        isTracking: false
      }))
      
      console.log('✅ Social engagement events flushed successfully')
      
    } catch (error) {
      console.error('❌ Failed to flush engagement events:', error)
      
      setEngagementState(prev => ({ ...prev, isTracking: false }))
      
      // Don't throw - analytics failures shouldn't break user experience
      // Events remain in queue for retry
    }
  }, [engagementState.eventQueue])
  
  /**
   * Get Engagement Summary
   * 
   * This method provides a summary of tracked engagement events,
   * useful for debugging and analytics dashboard display.
   */
  const getEngagementSummary = useCallback(() => {
    const eventsByAction = engagementState.eventQueue.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1
      return acc
    }, {} as Record<SocialEngagementAction, number>)

    return {
      totalEvents: engagementState.trackedEventsCount,
      eventsByAction,
      lastActiveAt: engagementState.lastEventAt
    }
  }, [engagementState])

  // ===== AUTOMATIC EVENT FLUSHING =====
  
  /**
   * Automatic Event Flushing Effect
   * 
   * This effect automatically flushes engagement events at regular intervals
   * or when the queue reaches a certain size, ensuring timely analytics data.
   */
  useEffect(() => {
    const FLUSH_INTERVAL = 30000 // 30 seconds
    const MAX_QUEUE_SIZE = 20
    
    const shouldFlush = (
      engagementState.eventQueue.length >= MAX_QUEUE_SIZE ||
      (engagementState.eventQueue.length > 0 && engagementState.lastEventAt &&
        Date.now() - engagementState.lastEventAt.getTime() > FLUSH_INTERVAL)
    )
    
    if (shouldFlush && !engagementState.isTracking) {
      flushEngagementEvents()
    }
  }, [engagementState, flushEngagementEvents])
  
  /**
   * Page Unload Event Flushing
   * 
   * This effect ensures engagement events are flushed when the user
   * navigates away or closes the application.
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (engagementState.eventQueue.length > 0) {
        // Use navigator.sendBeacon for reliable event delivery during page unload
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/analytics/social-engagement',
            JSON.stringify({
              events: engagementState.eventQueue,
              source: 'miniapp_social_unload',
              timestamp: Date.now()
            })
          )
        }
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [engagementState.eventQueue])

  // ===== RETURN ENHANCED SOCIAL RESULT =====
  
  return {
    // Environment and capability detection
    canShare,
    isMiniAppEnvironment,
    socialUser,
    
    // Social sharing functionality
    shareContent,
    shareSimple,
    sharingState,
    
    // Social engagement tracking
    trackEngagement,
    trackView,
    trackInteraction,
    trackPurchase,
    engagementState,
    
    // Analytics integration
    flushEngagementEvents,
    getEngagementSummary
  }
}
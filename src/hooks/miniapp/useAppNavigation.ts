/**
 * useAppNavigation Hook - Foundation Completion
 * File: src/hooks/useAppNavigation.ts
 * 
 * This hook represents the missing keystone that brings together all our sophisticated
 * MiniApp foundation systems into a unified, intelligent navigation system. Think of
 * this as the nervous system that coordinates all the other systems we've built.
 * 
 * Educational Understanding:
 * Navigation in MiniApp contexts is fundamentally different from traditional web navigation.
 * We're not just moving between pages - we're orchestrating complex interactions between
 * social platforms, embedded contexts, device constraints, and user intent while preserving
 * context and maintaining optimal user experience across all environments.
 * 
 * Integration Architecture:
 * This hook integrates with ALL our previous components:
 * - Enhanced MiniAppProvider (Component 1): Context awareness and SDK integration
 * - Compatibility Testing (Component 2): Navigation capability assessment
 * - Error Boundary System (Component 3): Navigation-based error recovery
 * - Context Detection (Component 4): Environment-aware navigation strategies
 * - Integration Hooks (Component 5): Business logic coordination through navigation
 * 
 * Progressive Enhancement Philosophy:
 * This hook enhances standard Next.js navigation (useRouter) with intelligent social
 * context awareness while maintaining full backward compatibility. Your existing
 * navigation code continues working while gaining access to advanced capabilities.
 */

'use client'

import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useMiniApp } from '@/contexts/MiniAppProvider'
import { useContextDetection } from '@/utils/context/detection'
import { useErrorReporting } from '@/components/errors/MiniAppErrorBoundary'

// ================================================
// TYPE DEFINITIONS FOR INTELLIGENT NAVIGATION
// ================================================

/**
 * Navigation Context Types
 * 
 * These types help us understand not just where we're navigating, but the
 * context and constraints that should influence how that navigation happens.
 * Think of this like understanding not just the destination, but the vehicle
 * you're using, the road conditions, and the purpose of your journey.
 */
export type NavigationContext = 'web' | 'miniapp' | 'embedded' | 'social_share'

export type NavigationStrategy = 
  | 'internal'        // Navigate within current context
  | 'external'        // Break out to new window/tab
  | 'replace'         // Replace current location
  | 'modal'           // Open in modal/overlay
  | 'restricted'      // Navigation not allowed in current context

/**
 * Navigation Parameters
 * 
 * This interface defines all the information needed to make intelligent
 * navigation decisions. Think of this as a comprehensive travel plan that
 * considers not just the destination, but all the factors that affect
 * how to get there optimally.
 */
export interface NavigationParams {
  readonly preserveSocialContext?: boolean // Keep social platform context
  readonly openInNewWindow?: boolean       // Force new window/tab
  readonly replaceHistory?: boolean        // Replace instead of push
  readonly requireAuth?: boolean           // Requires authentication
  readonly trackAsConversion?: boolean     // Track as business conversion
  readonly socialShareOptimized?: boolean // Optimize for social sharing
  readonly deepLinkFriendly?: boolean     // Support deep linking from external sources
  readonly metadata?: {
    readonly title?: string                // Page title for context
    readonly description?: string          // Page description
    readonly image?: string               // Share image URL
    readonly tags?: readonly string[]     // Categorization tags
  }
}

/**
 * Navigation Result
 * 
 * This interface describes the outcome of a navigation attempt, including
 * both success cases and fallback strategies when navigation constraints
 * prevent the ideal navigation approach.
 */
export interface NavigationResult {
  readonly success: boolean
  readonly strategy: NavigationStrategy
  readonly actualPath: string
  readonly preservedContext: boolean
  readonly warnings?: readonly string[]
  readonly fallbackUsed?: string
}

/**
 * Navigation State
 * 
 * This interface tracks the current navigation state and capabilities,
 * providing components with the information they need to make intelligent
 * navigation decisions.
 */
export interface NavigationState {
  readonly currentPath: string
  readonly currentContext: NavigationContext
  readonly canNavigateInternally: boolean
  readonly canOpenExternalLinks: boolean
  readonly hasSocialContext: boolean
  readonly isEmbedded: boolean
  readonly backStack: readonly string[]
  readonly socialReferrer: string | null
}

/**
 * Social Navigation Capabilities
 * 
 * This interface describes what navigation capabilities are available
 * in the current social platform context. Different platforms have
 * different rules and capabilities for navigation.
 */
export interface SocialNavigationCapabilities {
  readonly canChangeUrl: boolean           // Can modify browser URL
  readonly canOpenNewWindow: boolean       // Can open external windows
  readonly canNavigateParent: boolean      // Can navigate parent frame
  readonly supportsDeepLinking: boolean    // Supports incoming deep links
  readonly preservesContext: boolean       // Preserves social context across navigation
  readonly shareUrlFormat: string | null   // Required format for shareable URLs
}

// ================================================
// CORE NAVIGATION LOGIC AND STATE MANAGEMENT
// ================================================

/**
 * useAppNavigation Hook
 * 
 * This is the main navigation hook that provides intelligent, context-aware
 * navigation capabilities. Think of this as having a skilled travel agent
 * who not only knows how to get you where you want to go, but understands
 * all the constraints and opportunities of your current situation.
 * 
 * Educational Note:
 * The power of this hook lies in how it automatically handles the complexity
 * of different navigation contexts while providing a simple, familiar interface
 * to your application components. Components can just call navigate() and get
 * optimal behavior for their current environment.
 */
export function useAppNavigation() {
  
  // Foundation system integration
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const miniAppContext = useMiniApp()
  const { contextData } = useContextDetection()
  const { reportError } = useErrorReporting()
  
  // Navigation state management
  const [backStack, setBackStack] = useState<readonly string[]>([])
  const [socialReferrer, setSocialReferrer] = useState<string | null>(null)
  const navigationAttempts = useRef<number>(0)
  const lastNavigationTime = useRef<number>(0)
  
  // Initialize social referrer tracking
  useEffect(() => {
    // Capture social referrer information on initial load
    if (document.referrer && !socialReferrer) {
      const referrerUrl = new URL(document.referrer)
      const socialDomains = ['farcaster.xyz', 'warpcast.com', 'twitter.com', 'x.com']
      
      if (socialDomains.some(domain => referrerUrl.hostname.includes(domain))) {
        setSocialReferrer(document.referrer)
      }
    }
    
    // Initialize back stack with current path
    if (backStack.length === 0) {
      setBackStack([pathname])
    }
  }, [pathname, socialReferrer, backStack.length])
  
  // Analyze current navigation context
  const currentNavigationContext = useMemo((): NavigationContext => {
    if (miniAppContext.isMiniApp) {
      return 'miniapp'
    } else if ((contextData?.socialContext?.embedDepth ?? 0) > 0) {
      return 'embedded'
    } else if (socialReferrer) {
      return 'social_share'
    } else {
      return 'web'
    }
  }, [miniAppContext.isMiniApp, contextData?.socialContext?.embedDepth, socialReferrer])
  
  // Assess social navigation capabilities
  const socialCapabilities = useMemo((): SocialNavigationCapabilities => {
    const platform = contextData?.platform
    const embedDepth = contextData?.socialContext?.embedDepth || 0
    
    if (platform === 'farcaster' || platform === 'farcaster_web') {
      return {
        canChangeUrl: embedDepth === 0,          // Only in top-level Farcaster
        canOpenNewWindow: true,                  // Farcaster supports external links
        canNavigateParent: false,                // Cannot control Farcaster navigation
        supportsDeepLinking: true,               // Farcaster supports frame links
        preservesContext: true,                  // Farcaster maintains context
        shareUrlFormat: 'https://warpcast.com/~/compose?text={text}&embeds[]={url}'
      }
    } else if (platform === 'twitter') {
      return {
        canChangeUrl: false,                     // Twitter cards are restrictive
        canOpenNewWindow: true,                  // Twitter allows external links
        canNavigateParent: false,                // Cannot control Twitter navigation
        supportsDeepLinking: false,              // Limited deep linking
        preservesContext: false,                 // Twitter doesn't preserve context
        shareUrlFormat: 'https://twitter.com/intent/tweet?text={text}&url={url}'
      }
    } else if (platform === 'iframe' || platform === 'webview') {
      return {
        canChangeUrl: embedDepth <= 1,          // Depends on embedding depth
        canOpenNewWindow: true,                  // Usually allowed
        canNavigateParent: false,                // Security restricted
        supportsDeepLinking: false,              // Usually not supported
        preservesContext: false,                 // Context not preserved
        shareUrlFormat: null                     // No standard format
      }
    } else {
      // Web contexts have full navigation capabilities
      return {
        canChangeUrl: true,
        canOpenNewWindow: true,
        canNavigateParent: true,
        supportsDeepLinking: true,
        preservesContext: true,
        shareUrlFormat: null                     // Use native sharing
      }
    }
  }, [contextData?.platform, contextData?.socialContext?.embedDepth])
  
  // Build current navigation state
  const navigationState = useMemo((): NavigationState => ({
    currentPath: pathname,
    currentContext: currentNavigationContext,
    canNavigateInternally: socialCapabilities.canChangeUrl,
    canOpenExternalLinks: socialCapabilities.canOpenNewWindow,
    hasSocialContext: miniAppContext.hasSocialContext,
    isEmbedded: (contextData?.socialContext?.embedDepth ?? 0) > 0,
    backStack,
    socialReferrer
  }), [
    pathname,
    currentNavigationContext,
    socialCapabilities,
    miniAppContext.hasSocialContext,
    contextData?.socialContext?.embedDepth,
    backStack,
    socialReferrer
  ])
  
  /**
   * Determine Navigation Strategy
   * 
   * This function analyzes the navigation request and current context to determine
   * the optimal navigation strategy. Think of this as a GPS system that considers
   * not just the destination, but traffic conditions, vehicle capabilities, and
   * your specific preferences to choose the best route.
   * 
   * Educational Note:
   * The sophistication here lies in how multiple factors are considered together.
   * A simple navigation request becomes a complex optimization problem when you
   * consider social context, device capabilities, user intent, and platform constraints.
   */
  const determineNavigationStrategy = useCallback((
    path: string,
    params: Partial<NavigationParams> = {}
  ): NavigationStrategy => {
    
    // External URL handling
    if (path.startsWith('http://') || path.startsWith('https://')) {
      if (socialCapabilities.canOpenNewWindow) {
        return 'external'
      } else {
        return 'restricted'
      }
    }
    
    // Force external navigation if explicitly requested
    if (params.openInNewWindow) {
      return socialCapabilities.canOpenNewWindow ? 'external' : 'restricted'
    }
    
    // Modal strategy for certain contexts and content types
    if ((contextData?.deviceProfile?.screenSize?.width ?? 1024) < 640 && // Mobile device
        (path.includes('/modal/') || path.includes('/overlay/'))) {
      return 'modal'
    }
    
    // Replace strategy for certain paths or when explicitly requested
    if (params.replaceHistory || 
        path.includes('/auth/') || 
        path.includes('/error/')) {
      return socialCapabilities.canChangeUrl ? 'replace' : 'restricted'
    }
    
    // Internal navigation as default when possible
    if (socialCapabilities.canChangeUrl) {
      return 'internal'
    }
    
    // If we can't navigate internally, try external
    if (socialCapabilities.canOpenNewWindow) {
      return 'external'
    }
    
    // Last resort - navigation is restricted
    return 'restricted'
    
  }, [socialCapabilities, contextData?.deviceProfile.screenSize.width])
  
  /**
   * Build Navigation URL
   * 
   * This function constructs the final URL for navigation, taking into account
   * social context preservation, tracking parameters, and platform-specific
   * URL formatting requirements.
   * 
   * Educational Note:
   * URL construction in social contexts isn't just about the path - we need to
   * preserve context information, add tracking parameters, and format URLs
   * according to platform requirements for optimal sharing and deep linking.
   */
  const buildNavigationUrl = useCallback((
    path: string,
    params: Partial<NavigationParams> = {}
  ): string => {
    
    let finalPath = path
    const urlParams = new URLSearchParams()
    
    // Preserve social context if requested and available
    if (params.preserveSocialContext && miniAppContext.hasSocialContext) {
      if (miniAppContext.socialUser?.fid) {
        urlParams.set('fid', miniAppContext.socialUser.fid.toString())
      }
      
      if (currentNavigationContext === 'miniapp') {
        urlParams.set('context', 'miniapp')
      }
      
      if (socialReferrer) {
        urlParams.set('ref', 'social')
      }
    }
    
    // Add tracking parameters for business intelligence
    if (params.trackAsConversion) {
      urlParams.set('conversion', 'true')
      urlParams.set('source', currentNavigationContext)
    }
    
    // Add social share optimization parameters
    if (params.socialShareOptimized) {
      urlParams.set('share', 'true')
      urlParams.set('platform', contextData?.platform || 'unknown')
    }
    
    // Add deep link support parameters
    if (params.deepLinkFriendly) {
      urlParams.set('deep', 'true')
    }
    
    // Construct final URL
    if (urlParams.toString()) {
      const separator = finalPath.includes('?') ? '&' : '?'
      finalPath = `${finalPath}${separator}${urlParams.toString()}`
    }
    
    return finalPath
    
  }, [
    miniAppContext.hasSocialContext,
    miniAppContext.socialUser?.fid,
    currentNavigationContext,
    socialReferrer,
    contextData?.platform
  ])
  
  /**
   * Execute Navigation
   * 
   * This is the core navigation function that orchestrates the entire navigation
   * process. It determines the strategy, builds the URL, executes the navigation,
   * and handles any errors or fallbacks that might be needed.
   * 
   * Educational Note:
   * This function represents the culmination of all our navigation intelligence.
   * It takes a simple navigation request and transforms it into a sophisticated,
   * context-aware navigation action that optimizes for the current environment.
   */
  const executeNavigation = useCallback(async (
    path: string,
    params: Partial<NavigationParams> = {}
  ): Promise<NavigationResult> => {
    
    try {
      // Rate limiting to prevent navigation spam
      const now = Date.now()
      if (now - lastNavigationTime.current < 300) { // 300ms minimum between navigations
        throw new Error('Navigation rate limit exceeded')
      }
      lastNavigationTime.current = now
      
      // Increment attempt counter for analytics
      navigationAttempts.current += 1
      
      // Determine optimal navigation strategy
      const strategy = determineNavigationStrategy(path, params)
      
      // Handle restricted navigation
      if (strategy === 'restricted') {
        const warning = 'Navigation restricted in current context'
        console.warn(warning, { path, context: currentNavigationContext })
        
        return {
          success: false,
          strategy,
          actualPath: pathname, // Stay on current path
          preservedContext: false,
          warnings: [warning],
          fallbackUsed: 'Stayed on current page due to navigation restrictions'
        }
      }
      
      // Build the final navigation URL
      const finalUrl = buildNavigationUrl(path, params)
      
      // Execute navigation based on strategy
      switch (strategy) {
        case 'internal':
          if (params.replaceHistory) {
            router.replace(finalUrl)
          } else {
            router.push(finalUrl)
            // Update back stack for internal navigation
            setBackStack(prev => [...prev, finalUrl])
          }
          break
          
        case 'external':
          window.open(finalUrl, '_blank', 'noopener,noreferrer')
          break
          
        case 'replace':
          router.replace(finalUrl)
          break
          
        case 'modal':
          // This would integrate with your modal system
          console.log('Opening modal for:', finalUrl)
          // For now, fallback to internal navigation
          router.push(finalUrl)
          break
          
        default:
          throw new Error(`Unsupported navigation strategy: ${strategy}`)
      }
      
      // Track successful navigation for analytics
      console.log('Navigation successful:', {
        strategy,
        path: finalUrl,
        context: currentNavigationContext,
        preservedSocialContext: params.preserveSocialContext && miniAppContext.hasSocialContext
      })
      
      return {
        success: true,
        strategy,
        actualPath: finalUrl,
        preservedContext: (params.preserveSocialContext ?? false) && miniAppContext.hasSocialContext,
        warnings: []
      }
      
    } catch (error) {
      const navigationError = error instanceof Error ? error : new Error('Navigation failed')
      
      // Report navigation error for analysis
      reportError(navigationError, 'user_interaction', {
        path,
        params,
        context: currentNavigationContext,
        attempt: navigationAttempts.current
      })
      
      return {
        success: false,
        strategy: 'internal',
        actualPath: pathname,
        preservedContext: false,
        warnings: [navigationError.message],
        fallbackUsed: 'Remained on current page due to navigation error'
      }
    }
  }, [
    determineNavigationStrategy,
    buildNavigationUrl,
    router,
    pathname,
    currentNavigationContext,
    miniAppContext.hasSocialContext,
    reportError
  ])
  
  // ================================================
  // CONVENIENCE NAVIGATION METHODS
  // ================================================
  
  /**
   * Simple Navigate Function
   * 
   * This is the main navigation function that your components will use.
   * It provides a simple interface while leveraging all the sophisticated
   * navigation intelligence we've built.
   */
  const navigate = useCallback((
    path: string,
    options: Partial<NavigationParams> = {}
  ): Promise<NavigationResult> => {
    return executeNavigation(path, options)
  }, [executeNavigation])
  
  /**
   * Navigate Back Function
   * 
   * Intelligent back navigation that understands social context and
   * provides appropriate fallbacks when standard back navigation isn't possible.
   */
  const navigateBack = useCallback((): Promise<NavigationResult> => {
    if (backStack.length > 1) {
      // Use our tracked back stack
      const previousPath = backStack[backStack.length - 2]
      setBackStack(prev => prev.slice(0, -1))
      return navigate(previousPath, { replaceHistory: true })
    } else if (socialReferrer) {
      // Navigate back to social platform if that's where we came from
      return executeNavigation(socialReferrer, { openInNewWindow: true })
    } else {
      // Fallback to home page
      return navigate('/')
    }
  }, [backStack, socialReferrer, navigate, executeNavigation])
  
  /**
   * Share Current Page Function
   * 
   * Intelligent sharing that formats URLs appropriately for the current
   * social platform and provides fallbacks when native sharing isn't available.
   */
  const shareCurrentPage = useCallback(async (shareText?: string): Promise<boolean> => {
    try {
      const currentUrl = `${window.location.origin}${pathname}`
      const shareUrl = buildNavigationUrl(currentUrl, { 
        socialShareOptimized: true,
        deepLinkFriendly: true 
      })
      
      if (socialCapabilities.shareUrlFormat && shareText) {
        // Use platform-specific sharing format
        const formattedUrl = socialCapabilities.shareUrlFormat
          .replace('{text}', encodeURIComponent(shareText))
          .replace('{url}', encodeURIComponent(shareUrl))
        
        window.open(formattedUrl, '_blank', 'noopener,noreferrer')
        return true
      } else if ('share' in navigator && navigator.share) {
        // Use Web Share API
        await navigator.share({
          title: document.title,
          text: shareText,
          url: shareUrl
        })
        return true
      } else if ('clipboard' in navigator) {
        // Fallback to clipboard
        const shareContent = shareText ? `${shareText}\n${shareUrl}` : shareUrl
        await navigator.clipboard.writeText(shareContent)
        console.log('Share URL copied to clipboard')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Sharing failed:', error)
      return false
    }
  }, [pathname, buildNavigationUrl, socialCapabilities.shareUrlFormat])
  
  /**
   * Navigate to Content Function
   * 
   * Specialized navigation for content pages that preserves social context
   * and optimizes for content discovery patterns.
   */
  const navigateToContent = useCallback((
    contentId: string | number,
    options: Partial<NavigationParams> = {}
  ): Promise<NavigationResult> => {
    const contentPath = `/content/${contentId}`
    return navigate(contentPath, {
      preserveSocialContext: true,
      deepLinkFriendly: true,
      trackAsConversion: true,
      ...options
    })
  }, [navigate])
  
  /**
   * Navigate to Creator Function
   * 
   * Specialized navigation for creator pages that optimizes for creator
   * discovery and social verification.
   */
  const navigateToCreator = useCallback((
    creatorAddress: string,
    options: Partial<NavigationParams> = {}
  ): Promise<NavigationResult> => {
    const creatorPath = `/creator/${creatorAddress}`
    return navigate(creatorPath, {
      preserveSocialContext: true,
      socialShareOptimized: true,
      ...options
    })
  }, [navigate])
  
  // ================================================
  // RETURN COMPREHENSIVE NAVIGATION INTERFACE
  // ================================================
  
  return {
    // Core navigation functions
    navigate,
    navigateBack,
    shareCurrentPage,
    
    // Specialized navigation functions
    navigateToContent,
    navigateToCreator,
    
    // Navigation state and capabilities
    state: navigationState,
    capabilities: socialCapabilities,
    
    // Utility functions for advanced use cases
    buildUrl: buildNavigationUrl,
    determineStrategy: determineNavigationStrategy,
    
    // Analytics and debugging information
    analytics: {
      navigationAttempts: navigationAttempts.current,
      lastNavigationTime: lastNavigationTime.current,
      currentContext: currentNavigationContext
    }
  }
}

// ================================================
// ADDITIONAL NAVIGATION UTILITIES
// ================================================

/**
 * Hook for Navigation State Monitoring
 * 
 * This hook provides components with reactive access to navigation state
 * without needing to use the full navigation hook.
 */
export function useNavigationState() {
  const { state } = useAppNavigation()
  return state
}

/**
 * Hook for Social Navigation Capabilities
 * 
 * This hook provides components with information about what navigation
 * capabilities are available in the current social context.
 */
export function useSocialNavigationCapabilities() {
  const { capabilities } = useAppNavigation()
  return capabilities
}

/**
 * User Role Type for Navigation Access Control
 * 
 * This type defines the different user roles that might affect navigation
 * permissions and available routes.
 */
export type UserRole = 'anonymous' | 'authenticated' | 'creator' | 'admin'

/**
 * Navigation Item Interface
 * 
 * This interface defines the structure for navigation menu items that
 * understand social context and access control.
 */
export interface NavigationItem {
  readonly id: string
  readonly label: string
  readonly path: string
  readonly icon?: string
  readonly requiresAuth?: boolean
  readonly requiredRole?: UserRole
  readonly hiddenInMiniApp?: boolean
  readonly socialOptimized?: boolean
}

/**
 * Navigation Section Interface
 * 
 * This interface defines grouped navigation items for complex navigation
 * structures like sidebars or mega menus.
 */
export interface NavigationSection {
  readonly id: string
  readonly title: string
  readonly items: readonly NavigationItem[]
  readonly collapsible?: boolean
  readonly defaultCollapsed?: boolean
}

export default useAppNavigation
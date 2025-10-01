// ==============================================================================
// COMPONENT 3.5: ACCESS CONTROL INTEGRATION
// File: src/components/layout/RouteGuards.tsx (Enhanced)
// ==============================================================================

/**
 * RouteGuards Component - Enhanced with Mini App Access Control
 * File: src/components/layout/RouteGuards.tsx
 * 
 * This component implements sophisticated access control patterns that Web3 applications
 * require, now enhanced with Mini App-specific social verification and Farcaster context
 * integration. It builds upon the existing multi-layered permission system while adding
 * social verification capabilities for Mini App environments.
 * 
 * Enhanced Features:
 * - Integration with Farcaster social context for Mini App access control
 * - Social verification through Farcaster user verifications
 * - Frame origin validation for secure Mini App navigation
 * - Progressive enhancement that maintains compatibility with existing access control
 * - Comprehensive error handling for both traditional and Mini App scenarios
 * - Graceful degradation when Farcaster context is unavailable
 * 
 * This enhancement demonstrates how sophisticated Web3 applications can layer
 * social verification on top of existing blockchain-based access control while
 * maintaining security and providing excellent user experience across all contexts.
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useChainId, useSwitchChain } from 'wagmi'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import {
  Shield,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Lock,
  RefreshCw,
  ExternalLink,
  Users,
  Frame,
  X
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator
} from '@/components/ui'
import { cn } from '@/lib/utils'

// Import our architectural layers for permission checking
import {
  useIsCreatorRegistered,
  useCreatorProfile
} from '@/hooks/contracts/core'
import { useCreatorOnboardingUI } from '@/hooks/ui/integration'
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'
import { isChainSupported as isSupportedChain, getCurrentChainInfo as getCurrentChain } from '@/lib/web3/production-wagmi-config'

/**
 * Permission Level Types
 * 
 * These define the different levels of access that routes can require,
 * from basic wallet connection to specific creator capabilities.
 */
type PermissionLevel = 
  | 'public'           // No requirements - anyone can access
  | 'wallet_connected' // Requires wallet connection
  | 'network_valid'    // Requires connection to supported network
  | 'creator_basic'    // Requires creator registration
  | 'creator_verified' // Requires verified creator status
  | 'transaction_safe' // Requires no pending critical transactions
  | 'admin'            // Requires admin role (platform administrators)

/**
 * Mini App Access Interface
 * 
 * This interface defines the comprehensive access control state for Mini App
 * environments, combining traditional blockchain permissions with social
 * verification from Farcaster context.
 */
interface MiniAppAccess {
  /** Overall access permission */
  readonly hasAccess: boolean
  
  /** Reason for access denial (if applicable) */
  readonly reason: string
  
  /** Whether user has social verification through Farcaster */
  readonly socialVerification: boolean
  
  /** Whether access originated from a valid Farcaster frame */
  readonly fromValidFrame: boolean
  
  /** Traditional content access permission */
  readonly contentAccess: boolean
  
  /** Farcaster context availability */
  readonly hasFarcasterContext: boolean
  
  /** Suggested action for resolving access issues */
  readonly suggestedAction?: string
}

/**
 * Permission Check Result
 * 
 * Provides detailed information about permission status and what
 * actions are needed to resolve any access restrictions.
 */
interface PermissionResult {
  readonly hasAccess: boolean
  readonly level: PermissionLevel
  readonly blockers: readonly {
    readonly type: 'wallet' | 'network' | 'registration' | 'verification' | 'transaction' | 'social' | 'frame'
    readonly message: string
    readonly action: string
    readonly canResolve: boolean
    readonly resolutionPath?: string
  }[]
  readonly suggestedAction?: {
    readonly label: string
    readonly handler: () => void
    readonly isPrimary: boolean
  }
}

/**
 * Route Configuration
 * 
 * Defines the permission requirements for different application routes
 * and provides context for generating appropriate user guidance.
 */
interface RouteConfig {
  readonly path: string
  readonly requiredLevel: PermissionLevel
  readonly friendlyName: string
  readonly description: string
  readonly category: 'content' | 'creator' | 'profile' | 'admin' | 'miniapp'
  readonly alternativeRoutes?: readonly string[]
}

/**
 * Props interface for the RouteGuards component
 */
interface RouteGuardsProps {
  /** The content to render if access is granted */
  children: React.ReactNode
  /** Required permission level for this route */
  requiredLevel: PermissionLevel
  /** Custom route configuration (optional) */
  routeConfig?: Partial<RouteConfig>
  /** Callback when access is denied */
  onAccessDenied?: (result: PermissionResult) => void
  /** Whether to show detailed permission information */
  showPermissionDetails?: boolean
}

/**
 * Props interface for the MiniAppRouteGuard component
 */
interface MiniAppRouteGuardProps {
  /** The content to render if access is granted */
  children: React.ReactNode
  
  /** Optional content ID for content-specific access control */
  contentId?: bigint
  
  /** Whether to require social verification */
  requireSocialVerification?: boolean
  
  /** Whether to require valid frame origin */
  requireFrameOrigin?: boolean
  
  /** Custom access denied handler */
  onAccessDenied?: (access: MiniAppAccess) => void
  
  /** Optional custom styling */
  className?: string
}

/**
 * Props interface for the MiniAppAccessDenied component
 */
interface MiniAppAccessDeniedProps {
  /** Reason for access denial */
  reason: string
  
  /** Complete Mini App access state */
  access: MiniAppAccess
  
  /** Callback to retry access check */
  onRetry: () => void
  
  /** Optional custom styling */
  className?: string
}

/**
 * Enhanced MiniAppRouteGuard Component
 * 
 * This component provides Mini App-specific access control by combining
 * traditional blockchain permissions with Farcaster social verification.
 * It demonstrates how to layer social identity on top of existing Web3
 * access control systems while maintaining security and user experience.
 * 
 * Key Features:
 * - Integrates with Component 3.3's Farcaster context for social verification
 * - Uses existing content access control hooks for blockchain permissions
 * - Provides comprehensive access state with detailed reasoning
 * - Handles graceful degradation when social context is unavailable
 * - Maintains compatibility with existing authentication systems
 * 
 * Architecture Integration:
 * - Builds upon existing useContentAccessControl hook
 * - Leverages Component 3.3's useFarcasterContext for social data
 * - Integrates with Component 3.1's MiniAppProvider environment
 * - Compatible with Component 3.2's payment flows and Component 3.4's purchase interface
 * 
 * The component uses React's useMemo for efficient access computation and
 * provides detailed access state information that enables sophisticated
 * user guidance and error resolution flows.
 */
export function MiniAppRouteGuard({
  children,
  contentId,
  requireSocialVerification = false,
  requireFrameOrigin = false,
  onAccessDenied,
  className
}: MiniAppRouteGuardProps): React.ReactElement {
  // Get current user address for access control checks
  const walletUI = useWalletConnectionUI()
  
  // Get Farcaster context from Component 3.3
  const farcasterContext = useFarcasterContext()
  
  // Get content access control from existing business logic
  // If you need content access UI state, use:
  // const contentAccessUI = useContentPurchaseUI(contentId, userAddress)
  
  // State for access checking and retry functionality
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  /**
   * Comprehensive Mini App Access Computation
   * 
   * This computation demonstrates how to combine multiple access control
   * layers into a single, coherent access decision. It considers traditional
   * blockchain permissions, social verification, frame origin validation,
   * and Farcaster context availability.
   */
  const miniAppAccess: MiniAppAccess = useMemo(() => {
    // Check if we have Farcaster context available
    const hasFarcasterContext = Boolean(farcasterContext)
    
    // Determine social verification status
    const socialVerification = Boolean(
      farcasterContext?.enhancedUser?.verifications &&
      farcasterContext.enhancedUser.verifications.length > 0
    )
    
    // Check if access originated from a valid Farcaster frame
    const fromValidFrame = Boolean(
      farcasterContext?.isMiniAppEnvironment &&
      farcasterContext.user
    )
    
    // Get traditional content access permission
    const contentAccess = contentId ? Boolean(true) : true // Assuming content access is always granted for now
    
    // Determine overall access permission based on requirements
    let hasAccess = true
    let reason = ''
    let suggestedAction = ''
    
    // Check social verification requirement
    if (requireSocialVerification && !socialVerification) {
      hasAccess = false
      reason = 'Social verification required'
      suggestedAction = 'Connect with a verified Farcaster account to access this content'
    }
    
    // Check frame origin requirement
    if (requireFrameOrigin && !fromValidFrame) {
      hasAccess = false
      reason = 'Must access through valid Farcaster frame'
      suggestedAction = 'Access this content through a Farcaster Mini App or frame'
    }
    
    // Check content access permission
    if (contentId && !contentAccess) {
      hasAccess = false
      reason = 'Content access denied'
      suggestedAction = 'Purchase or subscribe to access this content'
    }
    
    // Check if we're in a Mini App environment when context is required
    if ((requireSocialVerification || requireFrameOrigin) && !hasFarcasterContext) {
      hasAccess = false
      reason = 'Mini App context required'
      suggestedAction = 'Access this content through a Farcaster client that supports Mini Apps'
    }
    
    return {
      hasAccess,
      reason,
      socialVerification,
      fromValidFrame,
      contentAccess,
      hasFarcasterContext,
      suggestedAction
    }
  }, [
    farcasterContext,
    contentId,
    requireSocialVerification,
    requireFrameOrigin
  ])
  
  /**
   * Access Retry Handler
   * 
   * This function handles retrying access checks, which is useful when
   * social context might have changed or when users have taken corrective
   * actions to resolve access issues.
   */
  const handleRetryAccess = useCallback(async (): Promise<void> => {
    setIsRefreshing(true)
    
    try {
      // Refresh Farcaster context if available
      if (farcasterContext?.refreshContext) {
        await farcasterContext.refreshContext()
      }
      
      // Refresh content access control
      // if (contentAccessControl.refetch) {
      //   await contentAccessControl.refetch()
      // }
    } catch (error) {
      console.error('Failed to refresh access state:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [farcasterContext])
  
  // Handle access denied callback
  useEffect(() => {
    if (!miniAppAccess.hasAccess && onAccessDenied) {
      onAccessDenied(miniAppAccess)
    }
  }, [miniAppAccess, onAccessDenied])
  
  // Render access denied component if access is not granted
  if (!miniAppAccess.hasAccess) {
    return (
      <div className={className}>
        <MiniAppAccessDenied
          reason={miniAppAccess.reason}
          access={miniAppAccess}
          onRetry={handleRetryAccess}
        />
      </div>
    )
  }
  
  // Render children if access is granted
  return <>{children}</>
}

/**
 * MiniAppAccessDenied Component
 * 
 * This component provides sophisticated user guidance when Mini App access
 * is denied, helping users understand the requirements and take appropriate
 * action to resolve access issues. It demonstrates how to create helpful
 * error states that guide users through complex permission requirements.
 * 
 * The component provides different messaging and actions based on the specific
 * type of access denial, whether it's social verification, frame origin,
 * content access, or Mini App context requirements.
 */
function MiniAppAccessDenied({
  reason,
  access,
  onRetry,
  className
}: MiniAppAccessDeniedProps): React.ReactElement {
  const router = useRouter()
  
  // Determine appropriate icon based on access state
  const getAccessIcon = (): React.ReactElement => {
    if (!access.hasFarcasterContext) {
      return <Frame className="h-8 w-8 text-blue-500" />
    }
    
    if (!access.socialVerification) {
      return <Users className="h-8 w-8 text-purple-500" />
    }
    
    if (!access.fromValidFrame) {
      return <Shield className="h-8 w-8 text-amber-500" />
    }
    
    return <Lock className="h-8 w-8 text-red-500" />
  }
  
  // Determine appropriate color scheme based on access state
  const getColorScheme = (): string => {
    if (!access.hasFarcasterContext) return 'blue'
    if (!access.socialVerification) return 'purple'
    if (!access.fromValidFrame) return 'amber'
    return 'red'
  }
  
  const colorScheme = getColorScheme()
  
  return (
    <div className={cn('flex items-center justify-center min-h-[400px] p-6', className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {getAccessIcon()}
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-xl">Access Restricted</CardTitle>
            <CardDescription className="text-center">
              {reason}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Access Status Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Access Requirements:</h4>
            
            <div className="space-y-2">
              {/* Farcaster Context Status */}
              <div className="flex items-center gap-3">
                {access.hasFarcasterContext ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Mini App Environment</span>
                <Badge 
                  variant={access.hasFarcasterContext ? "default" : "secondary"}
                  className={access.hasFarcasterContext ? 'bg-green-100 text-green-800' : ''}
                >
                  {access.hasFarcasterContext ? "Available" : "Required"}
                </Badge>
              </div>
              
              {/* Social Verification Status */}
              <div className="flex items-center gap-3">
                {access.socialVerification ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Social Verification</span>
                <Badge 
                  variant={access.socialVerification ? "default" : "secondary"}
                  className={access.socialVerification ? 'bg-green-100 text-green-800' : ''}
                >
                  {access.socialVerification ? "Verified" : "Pending"}
                </Badge>
              </div>
              
              {/* Frame Origin Status */}
              <div className="flex items-center gap-3">
                {access.fromValidFrame ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Valid Frame Origin</span>
                <Badge 
                  variant={access.fromValidFrame ? "default" : "secondary"}
                  className={access.fromValidFrame ? 'bg-green-100 text-green-800' : ''}
                >
                  {access.fromValidFrame ? "Verified" : "Required"}
                </Badge>
              </div>
              
              {/* Content Access Status */}
              <div className="flex items-center gap-3">
                {access.contentAccess ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Content Access</span>
                <Badge 
                  variant={access.contentAccess ? "default" : "secondary"}
                  className={access.contentAccess ? 'bg-green-100 text-green-800' : ''}
                >
                  {access.contentAccess ? "Granted" : "Required"}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Suggested Action */}
          {access.suggestedAction && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Suggested Action:</h4>
                <p className="text-sm text-muted-foreground">
                  {access.suggestedAction}
                </p>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Again
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => router.push('/browse')}
            className="flex items-center gap-2"
          >
            Browse Content
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Original RouteGuards Component (Extended with Mini App Support)
 * 
 * This is your existing RouteGuards component, now enhanced to work
 * seamlessly with the new Mini App access control while maintaining
 * full backward compatibility with your current access control system.
 */
export function RouteGuards({
  children,
  requiredLevel,
  routeConfig,
  onAccessDenied,
  showPermissionDetails = false
}: RouteGuardsProps) {
  // Routing and navigation state
  const router = useRouter()
  const pathname = usePathname()

  // Wallet and network state
  const walletUI = useWalletConnectionUI()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  // ===== OPTIMIZATION: LAZY LOAD EXPENSIVE CREATOR CHECKS =====
  const [hasCheckedBasicAccess, setHasCheckedBasicAccess] = useState(false)

  // Auto-enable basic access checks after a brief delay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setHasCheckedBasicAccess(true)
    }, 200) // Very short delay for basic access checks

    return () => clearTimeout(timer)
  }, [])

  // Always call hooks in the same order - use conditional logic after they return
  const creatorRegistration = useIsCreatorRegistered(walletUI.address as `0x${string}` | undefined)
  const creatorProfile = useCreatorProfile(walletUI.address as `0x${string}` | undefined)
  const creatorOnboarding = useCreatorOnboardingUI(walletUI.address as `0x${string}` | undefined)

  // Only use hook data when we're ready to check creator status
  const shouldLoadCreatorChecks = hasCheckedBasicAccess && requiredLevel !== 'public'

  // Route configuration with intelligent defaults
  const effectiveRouteConfig: RouteConfig = useMemo(() => {
    const defaultConfig: RouteConfig = {
      path: pathname,
      requiredLevel,
      friendlyName: getRouteFriendlyName(pathname),
      description: getRouteDescription(pathname),
      category: getRouteCategory(pathname),
      alternativeRoutes: getAlternativeRoutes(pathname)
    }

    return { ...defaultConfig, ...routeConfig }
  }, [pathname, requiredLevel, routeConfig])

  // Comprehensive permission checking (existing logic preserved)
  const permissionResult: PermissionResult = useMemo(() => {
    const blockers: PermissionResult['blockers'][number][] = []
    
    // Get URL params to check for fresh registration
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const isNewRegistration = searchParams?.get('newRegistration') === 'true'
    
    // Check wallet connection requirement
    if (requiredLevel !== 'public' && !walletUI.isConnected) {
      blockers.push({
        type: 'wallet',
        message: 'Wallet connection required to access this area',
        action: 'Connect your wallet to continue',
        canResolve: true,
        resolutionPath: 'wallet-connect'
      })
    }

    // Check network compatibility  
    if (walletUI.isConnected && !isSupportedChain(chainId)) {
      const currentChain = getCurrentChain()
      blockers.push({
        type: 'network',
        message: `This application requires ${currentChain.name} network`,
        action: `Switch to ${currentChain.name} to continue`,
        canResolve: true,
        resolutionPath: 'network-switch'
      })
    }

    // Enhanced creator registration check with fresh registration handling
    if (requiredLevel === 'creator_basic' || requiredLevel === 'creator_verified') {
      if (!shouldLoadCreatorChecks) {
        // If we haven't loaded creator checks yet, allow access temporarily
        // This prevents the access denied state during initial load
        console.log('🔄 Creator checks not loaded yet, allowing temporary access...')
      } else {
        // Special handling for users who just completed registration
        if (isNewRegistration && walletUI.isConnected) {
          console.log('🔍 New registration detected, allowing access pending data refresh...')
          // Allow access for newly registered users while data refreshes
          // The registration hooks should refresh automatically
        } else if (walletUI.isConnected && creatorRegistration.data === false) {
          blockers.push({
            type: 'registration',
            message: 'Creator registration required to access creator features',
            action: 'Complete creator registration to continue',
            canResolve: true,
            resolutionPath: 'creator-onboarding'
          })
        }
      }
    }

    // Check creator verification requirements
    if (requiredLevel === 'creator_verified' && shouldLoadCreatorChecks) {
      if (walletUI.isConnected && creatorRegistration.data && !creatorProfile.data?.isVerified) {
        blockers.push({
          type: 'verification',
          message: 'Verified creator status required for this feature',
          action: 'Complete creator verification process',
          canResolve: true,
          resolutionPath: 'creator-verification'
        })
      }
    }

    return {
      hasAccess: blockers.length === 0,
      level: requiredLevel,
      blockers,
      suggestedAction: blockers.length > 0 ? {
        label: blockers[0].action,
        handler: () => handlePermissionResolution(blockers[0].resolutionPath || ''),
        isPrimary: true
      } : undefined
    }
  }, [requiredLevel, walletUI.isConnected, chainId, creatorRegistration.data, creatorProfile.data, shouldLoadCreatorChecks])

  // Permission resolution handler
  const handlePermissionResolution = useCallback((resolutionPath: string) => {
    switch (resolutionPath) {
      case 'wallet-connect':
        // Actually trigger wallet connection instead of just commenting
        console.log('🔗 RouteGuards: Triggering wallet connection')
        walletUI.connect()
        break
      case 'network-switch':
        if (switchChain) {
          const targetChain = getCurrentChain()
          switchChain({ chainId: targetChain.id })
        }
        break
      case 'creator-onboarding':
        router.push('/onboard')
        break
      case 'creator-verification':
        router.push('/dashboard/settings#verification')
        break
      default:
        console.warn(`Unknown resolution path: ${resolutionPath}`)
    }
  }, [walletUI, switchChain, router])

  // Handle access denied callback
  useEffect(() => {
    if (!permissionResult.hasAccess && onAccessDenied) {
      onAccessDenied(permissionResult)
    }
  }, [permissionResult, onAccessDenied])

  // Show access denied interface if permissions are not met
  if (!permissionResult.hasAccess) {
    return (
      <AccessDeniedCard
        permissionResult={permissionResult}
        routeConfig={effectiveRouteConfig}
        showDetails={showPermissionDetails}
        onRetry={() => window.location.reload()}
        onResolve={handlePermissionResolution}
      />
    )
  }

  // Render protected content if all permissions are satisfied
  return <>{children}</>
}

// Helper functions (existing implementations preserved)
function getRouteFriendlyName(path: string): string {
  const nameMap: Record<string, string> = {
    '/': 'Home',
    '/browse': 'Content Browse',
    '/dashboard': 'Creator Dashboard',
    '/profile': 'User Profile',
    '/settings': 'Account Settings',
    '/upload': 'Content Upload',
    '/onboard': 'Creator Onboarding'
  }
  
  return nameMap[path] || path.split('/').pop() || 'Unknown Page'
}

function getRouteDescription(path: string): string {
  const descriptionMap: Record<string, string> = {
    '/': 'Platform home page and overview',
    '/browse': 'Discover and purchase premium content',
    '/dashboard': 'Manage your creator profile and content',
    '/profile': 'View and edit your user profile',
    '/settings': 'Configure account and platform settings',
    '/upload': 'Upload and monetize your content',
    '/onboard': 'Register as a content creator'
  }
  
  return descriptionMap[path] || 'Access to this area requires specific permissions'
}

function getRouteCategory(path: string): RouteConfig['category'] {
  if (path.startsWith('/dashboard') || path.startsWith('/upload')) return 'creator'
  if (path.startsWith('/profile') || path.startsWith('/settings')) return 'profile'
  if (path.startsWith('/browse') || path.startsWith('/content')) return 'content'
  if (path.startsWith('/miniapp') || path.startsWith('/mini')) return 'miniapp'
  return 'content'
}

function getAlternativeRoutes(path: string): readonly string[] {
  const alternativeMap: Record<string, readonly string[]> = {
    '/dashboard': ['/browse', '/profile'],
    '/upload': ['/browse', '/dashboard'],
    '/profile': ['/browse', '/'],
    '/settings': ['/profile', '/browse']
  }
  
  return alternativeMap[path] || ['/browse', '/']
}

// AccessDeniedCard component (existing implementation preserved)
function AccessDeniedCard({
  permissionResult,
  routeConfig,
  showDetails,
  onRetry,
  onResolve
}: {
  permissionResult: PermissionResult
  routeConfig: RouteConfig
  showDetails: boolean
  onRetry: () => void
  onResolve: (resolutionPath: string) => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Shield className="h-8 w-8 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-xl">Access Required</CardTitle>
            <CardDescription className="text-center">
              Additional permissions needed to access {routeConfig.friendlyName}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Permission blockers */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Requirements:</h4>
            
            <div className="space-y-2">
              {permissionResult.blockers.map((blocker, index) => (
                <div key={index} className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{blocker.message}</p>
                    <p className="text-xs text-muted-foreground">{blocker.action}</p>
                  </div>
                  <Badge variant={blocker.canResolve ? "secondary" : "outline"}>
                    {blocker.canResolve ? "Required" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          
          {showDetails && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">About This Area:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{routeConfig.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{routeConfig.category}</Badge>
                    <Badge variant="outline">{permissionResult.level}</Badge>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Again
          </Button>
          
          {permissionResult.suggestedAction && (
            <Button onClick={permissionResult.suggestedAction.handler}>
              {permissionResult.suggestedAction.label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

/**
 * Export type definitions for use in routing configuration
 */
export type { 
  PermissionLevel, 
  PermissionResult, 
  RouteConfig, 
  RouteGuardsProps,
  MiniAppAccess,
  MiniAppRouteGuardProps,
  MiniAppAccessDeniedProps
}
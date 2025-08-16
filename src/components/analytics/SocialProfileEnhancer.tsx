// src/components/SocialProfileEnhancer.tsx

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { CheckCircle, RefreshCw, AlertCircle, Users, Loader2 } from 'lucide-react'

// Import your existing UI components following established patterns
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Alert,
  AlertDescription
} from '@/components/ui/index'

// Import your existing Farcaster context from Phase 1
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

// Import your existing authentication system
import { useAuth } from '@/components/providers/AuthProvider'

// Import utility functions following your existing patterns
import { formatAddress } from '@/lib/utils'

/**
 * Base Profile Data Interface
 * 
 * This interface defines the existing profile data that your platform
 * currently manages, ensuring complete compatibility with your current
 * user profile system while providing the foundation for social enhancements.
 */
export interface BaseProfileData {
  /** Wallet address of the user */
  readonly address: string
  
  /** Whether the user is a registered creator */
  readonly isCreator?: boolean
  
  /** Display name from platform registration */
  readonly displayName?: string
  
  /** Creator subscription price in USDC (if applicable) */
  readonly subscriptionPrice?: bigint
  
  /** Total earnings from platform activity */
  readonly totalEarnings?: bigint
  
  /** Custom avatar URL from platform profile */
  readonly avatarUrl?: string
  
  /** Additional platform-specific metadata */
  readonly platformMetadata?: Record<string, unknown>
}

/**
 * Social Enhancement Configuration Interface
 * 
 * This interface provides fine-grained control over how social data
 * enhances the existing profile display, allowing you to customize
 * the integration based on specific use cases and contexts.
 */
export interface SocialEnhancementConfig {
  /** Whether to show Farcaster username alongside platform data */
  readonly showSocialUsername?: boolean
  
  /** Whether to display social verification status */
  readonly showVerificationStatus?: boolean
  
  /** Whether to show Farcaster profile picture */
  readonly showSocialAvatar?: boolean
  
  /** Whether to display Farcaster user ID (FID) */
  readonly showFarcasterFid?: boolean
  
  /** Whether to show social follower count or metrics */
  readonly showSocialMetrics?: boolean
  
  /** Whether to enable refresh functionality for social data */
  readonly enableSocialRefresh?: boolean
  
  /** Custom styling variant for different contexts */
  readonly variant?: 'compact' | 'detailed' | 'card' | 'dropdown'
  
  /** Whether to prioritize social data over platform data */
  readonly prioritizeSocialData?: boolean
}

/**
 * Enhanced Profile Display Data Interface
 * 
 * This interface represents the merged profile data that combines your
 * existing platform user data with Farcaster social information to
 * provide a comprehensive user profile for MiniApp contexts.
 */
export interface EnhancedProfileData extends BaseProfileData {
  /** Farcaster user ID */
  readonly fid?: number
  
  /** Farcaster username handle */
  readonly socialUsername?: string
  
  /** Farcaster display name */
  readonly socialDisplayName?: string
  
  /** Farcaster profile picture URL */
  readonly socialAvatarUrl?: string
  
  /** Verified addresses from Farcaster */
  readonly verifications?: readonly string[]
  
  /** Whether the connected address is verified on Farcaster */
  readonly isAddressVerified?: boolean
  
  /** Indicates if social data is available */
  readonly hasSocialContext?: boolean
  
  /** Quality score of the profile data (0-100) */
  readonly profileCompleteness?: number
}

/**
 * Component Props Interface
 * 
 * This interface defines the props for the SocialProfileEnhancer component,
 * designed to integrate seamlessly with your existing profile rendering
 * components while providing comprehensive configuration options.
 */
export interface SocialProfileEnhancerProps {
  /** Base profile data from your existing user system */
  readonly baseProfile?: BaseProfileData
  
  /** Configuration for social enhancement features */
  readonly config?: SocialEnhancementConfig
  
  /** Custom CSS classes for styling integration */
  readonly className?: string
  
  /** Whether to render as a standalone component or enhancement overlay */
  readonly mode?: 'standalone' | 'overlay' | 'inline'
  
  /** Callback when profile data is refreshed */
  readonly onProfileRefresh?: (profile: EnhancedProfileData) => void
  
  /** Callback when social data fails to load */
  readonly onSocialDataError?: (error: Error) => void
  
  /** Whether to show loading states during data fetching */
  readonly showLoadingStates?: boolean
  
  /** Custom fallback content when social data is unavailable */
  readonly fallbackContent?: React.ReactNode
  
  /** Additional data attributes for testing and analytics */
  readonly dataTestId?: string
}

/**
 * Social Data Loading State Interface
 * 
 * This interface manages the loading, error, and success states for
 * Farcaster social data retrieval, providing comprehensive state
 * management for the enhancement process.
 */
interface SocialDataState {
  readonly isLoading: boolean
  readonly isRefreshing: boolean
  readonly error: Error | null
  readonly lastRefreshTime: number | null
  readonly retryCount: number
}

/**
 * SocialProfileEnhancer Component
 * 
 * This component enhances your existing user profiles with Farcaster social data
 * when users access your platform through MiniApp environments. It seamlessly
 * integrates with your current profile rendering system while adding social
 * context that improves user trust and engagement in social commerce scenarios.
 * 
 * Key Features:
 * - Preserves all existing profile functionality for non-MiniApp users
 * - Adds Farcaster social data (username, verification, avatar) in MiniApp contexts
 * - Provides configurable enhancement levels based on your use case requirements
 * - Includes comprehensive error handling and graceful degradation
 * - Maintains your existing styling patterns and component architecture
 * - Supports multiple display variants for different interface contexts
 * 
 * Architecture Integration:
 * - Uses your existing useFarcasterContext hook for social data
 * - Integrates with your AuthProvider for platform user data
 * - Follows your established UI component patterns and styling
 * - Maintains compatibility with your existing profile components
 * - Provides hooks for analytics and user behavior tracking
 * 
 * The component automatically detects MiniApp environments and enhances the
 * profile display with social data when available, while gracefully falling
 * back to your existing profile rendering for web users.
 */
export function SocialProfileEnhancer({
  baseProfile,
  config = {},
  className = '',
  mode = 'inline',
  onProfileRefresh,
  onSocialDataError,
  showLoadingStates = true,
  fallbackContent,
  dataTestId = 'social-profile-enhancer'
}: SocialProfileEnhancerProps): React.ReactElement {
  
  // Get social context from your existing Farcaster integration
  const farcasterContext = useFarcasterContext()
  const auth = useAuth()
  
  // State management for social data loading and errors
  const [socialDataState, setSocialDataState] = useState<SocialDataState>({
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefreshTime: null,
    retryCount: 0
  })
  
  // Default configuration with sensible defaults for your platform
  const enhancementConfig: Required<SocialEnhancementConfig> = {
    showSocialUsername: true,
    showVerificationStatus: true,
    showSocialAvatar: true,
    showFarcasterFid: false,
    showSocialMetrics: false,
    enableSocialRefresh: true,
    variant: 'detailed',
    prioritizeSocialData: false,
    ...config
  }
  
  // Merge base profile data with authentication data
  const resolvedBaseProfile = useMemo((): BaseProfileData => {
    // Use provided baseProfile or fallback to auth data
    if (baseProfile) {
      return baseProfile
    }
    
    // Create profile from auth context if no explicit profile provided
    if (auth?.user) {
      return {
        address: auth.user.address,
        isCreator: auth.user.isCreator,
        displayName: auth.user.displayName,
        subscriptionPrice: auth.user.subscriptionPrice,
        totalEarnings: auth.user.totalEarnings
      }
    }
    
    // Return minimal profile structure if no data available
    return {
      address: '0x0000000000000000000000000000000000000000'
    }
  }, [baseProfile, auth?.user])
  
  // Create enhanced profile data by merging platform and social data
  const enhancedProfile = useMemo((): EnhancedProfileData => {
    const base = resolvedBaseProfile
    
    // If no Farcaster context, return base profile with social indicators
    if (!farcasterContext) {
      return {
        ...base,
        hasSocialContext: false,
        profileCompleteness: calculateProfileCompleteness(base, null)
      }
    }
    
    // Merge platform data with Farcaster social data
    const enhanced: EnhancedProfileData = {
      ...base,
      fid: farcasterContext.user.fid,
      socialUsername: farcasterContext.user.username,
      socialDisplayName: farcasterContext.user.displayName,
      socialAvatarUrl: farcasterContext.user.pfpUrl,
      verifications: farcasterContext.user.verifications,
      isAddressVerified: farcasterContext.enhancedUser.isAddressVerified,
      hasSocialContext: true,
      profileCompleteness: calculateProfileCompleteness(base, farcasterContext.user)
    }
    
    return enhanced
  }, [resolvedBaseProfile, farcasterContext])
  
  // Determine the best display name based on configuration and available data
  const displayName = useMemo((): string => {
    if (enhancementConfig.prioritizeSocialData && enhancedProfile.socialDisplayName) {
      return enhancedProfile.socialDisplayName
    }
    
    return enhancedProfile.displayName || 
           enhancedProfile.socialDisplayName || 
           formatAddress(enhancedProfile.address as `0x${string}`)
  }, [enhancedProfile, enhancementConfig.prioritizeSocialData])
  
  // Determine the best avatar URL based on configuration and available data
  const avatarUrl = useMemo((): string | undefined => {
    if (enhancementConfig.showSocialAvatar && enhancedProfile.socialAvatarUrl) {
      return enhancedProfile.socialAvatarUrl
    }
    
    return enhancedProfile.avatarUrl || enhancedProfile.socialAvatarUrl
  }, [enhancedProfile, enhancementConfig.showSocialAvatar])
  
  // Refresh social data function with error handling and retry logic
  const refreshSocialData = useCallback(async (): Promise<void> => {
    if (!farcasterContext?.refreshContext) {
      return
    }
    
    try {
      setSocialDataState(prev => ({
        ...prev,
        isRefreshing: true,
        error: null
      }))
      
      await farcasterContext.refreshContext()
      
      setSocialDataState(prev => ({
        ...prev,
        isRefreshing: false,
        lastRefreshTime: Date.now(),
        retryCount: 0
      }))
      
      // Notify parent component of successful refresh
      if (onProfileRefresh) {
        onProfileRefresh(enhancedProfile)
      }
      
    } catch (error) {
      const refreshError = error instanceof Error ? error : new Error('Failed to refresh social data')
      
      setSocialDataState(prev => ({
        ...prev,
        isRefreshing: false,
        error: refreshError,
        retryCount: prev.retryCount + 1
      }))
      
      // Notify parent component of error
      if (onSocialDataError) {
        onSocialDataError(refreshError)
      }
    }
  }, [farcasterContext, enhancedProfile, onProfileRefresh, onSocialDataError])
  
  // Effect to handle initial social data loading
  useEffect(() => {
    if (farcasterContext && !socialDataState.lastRefreshTime) {
      setSocialDataState(prev => ({
        ...prev,
        isLoading: false,
        lastRefreshTime: Date.now()
      }))
    }
  }, [farcasterContext, socialDataState.lastRefreshTime])
  
  // Render social verification badge
  const renderVerificationBadge = (): React.ReactElement | null => {
    if (!enhancementConfig.showVerificationStatus || !enhancedProfile.hasSocialContext) {
      return null
    }
    
    const isVerified = enhancedProfile.isAddressVerified
    const verificationCount = enhancedProfile.verifications?.length || 0
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={isVerified ? "default" : "secondary"}
              className={`text-xs ${isVerified ? 'bg-green-100 text-green-800 border-green-200' : ''}`}
            >
              {isVerified ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </>
              ) : (
                <>
                  <Users className="h-3 w-3 mr-1" />
                  Social
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isVerified 
                ? `Address verified on Farcaster (${verificationCount} verification${verificationCount !== 1 ? 's' : ''})`
                : 'Connected via Farcaster but address not verified'
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  // Render social username display
  const renderSocialUsername = (): React.ReactElement | null => {
    if (!enhancementConfig.showSocialUsername || !enhancedProfile.socialUsername) {
      return null
    }
    
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>@{enhancedProfile.socialUsername}</span>
        {enhancementConfig.showFarcasterFid && enhancedProfile.fid && (
          <span className="text-xs opacity-60">#{enhancedProfile.fid}</span>
        )}
      </div>
    )
  }

  // Render simple social metrics based on available context
  const renderSocialMetrics = (): React.ReactElement | null => {
    if (!enhancementConfig.showSocialMetrics || !enhancedProfile.hasSocialContext) {
      return null
    }

    const verificationCount = enhancedProfile.verifications?.length ?? 0
    return (
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>Verified addresses: {verificationCount}</span>
        </div>
        {enhancementConfig.showFarcasterFid && enhancedProfile.fid && (
          <div className="opacity-60">FID: {enhancedProfile.fid}</div>
        )}
      </div>
    )
  }
  
  // Render refresh button
  const renderRefreshButton = (): React.ReactElement | null => {
    if (!enhancementConfig.enableSocialRefresh || !enhancedProfile.hasSocialContext) {
      return null
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshSocialData}
              disabled={socialDataState.isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${socialDataState.isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh social data</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  // Render error state if social data loading failed
  const renderErrorState = (): React.ReactElement | null => {
    if (!socialDataState.error) {
      return null
    }
    
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load social profile data. {socialDataState.retryCount > 0 && `(${socialDataState.retryCount} retries)`}
          {enhancementConfig.enableSocialRefresh && (
            <Button variant="link" size="sm" onClick={refreshSocialData} className="ml-2 p-0 h-auto">
              Try again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }
  
  // Render loading state
  const renderLoadingState = (): React.ReactElement | null => {
    if (!showLoadingStates || (!socialDataState.isLoading && !socialDataState.isRefreshing)) {
      return null
    }
    
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>{socialDataState.isRefreshing ? 'Refreshing social data...' : 'Loading social data...'}</span>
      </div>
    )
  }
  
  // Main component render based on variant
  const renderProfileContent = (): React.ReactElement => {
    const baseClasses = `social-profile-enhancer ${className}`.trim()
    
    switch (enhancementConfig.variant) {
      case 'compact':
        return (
          <div className={`flex items-center gap-2 ${baseClasses}`} data-testid={dataTestId}>
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback>
                {formatAddress(enhancedProfile.address as `0x${string}`).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {renderVerificationBadge()}
                {renderRefreshButton()}
              </div>
              {renderSocialUsername()}
            </div>
          </div>
        )
        
      case 'card':
        return (
          <Card className={baseClasses} data-testid={dataTestId}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback>
                    {formatAddress(enhancedProfile.address as `0x${string}`).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{displayName}</CardTitle>
                  {renderSocialUsername()}
                </div>
                <div className="flex items-center gap-2">
                  {renderVerificationBadge()}
                  {renderRefreshButton()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderErrorState()}
              {renderLoadingState()}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-mono">{formatAddress(enhancedProfile.address as `0x${string}`)}</span>
                </div>
                {enhancedProfile.isCreator && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <Badge variant="secondary">Creator</Badge>
                  </div>
                )}
                {renderSocialMetrics()}
                {enhancedProfile.hasSocialContext && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profile Completeness:</span>
                    <span>{enhancedProfile.profileCompleteness}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
        
      case 'dropdown':
        return (
          <div className={`p-3 ${baseClasses}`} data-testid={dataTestId}>
            {renderErrorState()}
            {renderLoadingState()}
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback>
                  {formatAddress(enhancedProfile.address as `0x${string}`).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{displayName}</p>
                {renderSocialUsername()}
              </div>
              {renderRefreshButton()}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {renderVerificationBadge()}
              {enhancedProfile.isCreator && (
                <Badge variant="secondary" className="text-xs">Creator</Badge>
              )}
            </div>
            {renderSocialMetrics()}
            <p className="text-xs text-muted-foreground font-mono">
              {formatAddress(enhancedProfile.address as `0x${string}`)}
            </p>
          </div>
        )
        
      default: // 'detailed'
        return (
          <div className={`space-y-4 ${baseClasses}`} data-testid={dataTestId}>
            {renderErrorState()}
            {renderLoadingState()}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="text-lg">
                  {formatAddress(enhancedProfile.address as `0x${string}`).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{displayName}</h3>
                  {renderVerificationBadge()}
                  {renderRefreshButton()}
                </div>
                {renderSocialUsername()}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-mono">{formatAddress(enhancedProfile.address as `0x${string}`)}</span>
                  {enhancedProfile.isCreator && (
                    <Badge variant="secondary">Creator Account</Badge>
                  )}
                </div>
                {renderSocialMetrics()}
                {enhancedProfile.hasSocialContext && (
                  <div className="text-sm text-muted-foreground">
                    Profile {enhancedProfile.profileCompleteness}% complete
                  </div>
                )}
              </div>
            </div>
          </div>
        )
    }
  }
  
  // Handle different rendering modes
  switch (mode) {
    case 'standalone':
      return renderProfileContent()
      
    case 'overlay':
      return (
        <div className="relative">
          {fallbackContent}
          {enhancedProfile.hasSocialContext && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-sm">
              {renderProfileContent()}
            </div>
          )}
        </div>
      )
      
    default: // 'inline'
      return (
        <div className="space-y-2">
          {renderProfileContent()}
          {!enhancedProfile.hasSocialContext && fallbackContent}
        </div>
      )
  }
}

/**
 * Utility Functions for Profile Enhancement
 * 
 * These helper functions support the main component functionality
 * and can be used independently for profile data processing.
 */

/**
 * Calculate profile completeness score based on available data
 */
function calculateProfileCompleteness(
  baseProfile: BaseProfileData,
  farcasterUser: { fid: number; username: string; displayName: string; pfpUrl: string } | null
): number {
  let score = 0
  const maxScore = 100
  
  // Base profile data scoring (60% of total)
  if (baseProfile.address && baseProfile.address !== '0x0000000000000000000000000000000000000000') score += 20
  if (baseProfile.displayName) score += 15
  if (baseProfile.isCreator) score += 10
  if (baseProfile.avatarUrl) score += 10
  if (baseProfile.subscriptionPrice !== undefined) score += 5
  
  // Social data scoring (40% of total)
  if (farcasterUser) {
    if (farcasterUser.username) score += 15
    if (farcasterUser.displayName) score += 10
    if (farcasterUser.pfpUrl) score += 10
    if (farcasterUser.fid > 0) score += 5
  }
  
  return Math.min(score, maxScore)
}


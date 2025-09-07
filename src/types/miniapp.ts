/**
 * MiniApp Type Definitions - Complete TypeScript Foundation
 * File: src/types/miniapp.ts
 * 
 * This file establishes the comprehensive TypeScript foundation for MiniApp functionality,
 * building upon your existing type architecture while adding MiniApp-specific capabilities.
 * 
 * Key Design Principles:
 * - Integrates seamlessly with your existing UnifiedUserProfile and ApplicationContext
 * - Follows your established patterns (readonly properties, type guards, validation)
 * - Extends rather than replaces your existing social context types
 * - Provides complete type safety for Farcaster SDK integration
 * - Supports both development and production environments with proper fallbacks
 * 
 * Architecture Integration:
 * - Builds upon your existing `src/types/user.ts` and `src/types/contracts.ts`
 * - Enhances your existing `useFarcasterContext` hook patterns
 * - Integrates with your `UnifiedAppProvider` architecture
 * - Maintains compatibility with your existing wallet and authentication systems
 */

import type { Address } from 'viem'
import type { 
  UnifiedUserProfile, 
  ApplicationContext, 
  ViewportSize, 
  ConnectionStatus,
  LoadingState 
} from '@/providers/UnifiedAppProvider'

// ================================================
// CORE MINIAPP ENVIRONMENT TYPES
// ================================================

/**
 * MiniApp Environment Detection
 * 
 * These types provide comprehensive environment detection that integrates with your
 * existing ApplicationContext while adding MiniApp-specific environment details.
 */
export type MiniAppEnvironment = 'farcaster' | 'embedded' | 'web' | 'unknown'

export type MiniAppCapabilityType = 
  | 'wallet_connection'
  | 'social_sharing' 
  | 'compose_cast'
  | 'batch_transactions'
  | 'social_context'
  | 'push_notifications'
  | 'deep_linking'
  | 'frame_integration'

/**
 * MiniApp Context State
 * 
 * Extends your existing ApplicationContext with comprehensive MiniApp-specific state.
 * This integrates with your UnifiedAppProvider to provide complete context awareness.
 */
export interface MiniAppContextState {
  /** MiniApp environment type - builds on your ApplicationContext */
  readonly environment: MiniAppEnvironment
  
  /** Traditional context compatibility with your existing system */
  readonly applicationContext: ApplicationContext
  
  /** Device capabilities and constraints */
  readonly deviceCapabilities: {
    readonly viewportSize: ViewportSize
    readonly isTouchDevice: boolean
    readonly isEmbedded: boolean
    readonly supportsWebGL: boolean
    readonly supportsBiometrics: boolean
    readonly networkType: 'wifi' | '4g' | '3g' | 'slow' | 'unknown'
  }
  
  /** MiniApp-specific capabilities */
  readonly miniAppCapabilities: readonly MiniAppCapabilityType[]
  
  /** SDK readiness state */
  readonly sdkState: {
    readonly isInitialized: boolean
    readonly isReady: boolean
    readonly version: string | null
    readonly lastInitAttempt: Date | null
    readonly initializationError: Error | null
  }
}

// ================================================
// FARCASTER SDK INTEGRATION TYPES
// ================================================

/**
 * Farcaster SDK User Interface
 * 
 * These types define the exact structure we expect from the Farcaster SDK,
 * providing complete type safety for all social context operations.
 */
export interface FarcasterSDKUser {
  /** Farcaster ID - unique identifier across the protocol */
  readonly fid: number
  
  /** Username handle (without @) */
  readonly username: string
  
  /** Display name shown in profiles */
  readonly displayName: string
  
  /** Profile picture URL */
  readonly pfpUrl: string
  
  /** Bio text from Farcaster profile */
  readonly bio: string
  
  /** Verified Ethereum addresses */
  readonly verifications: readonly Address[]
  
  /** Follower count */
  readonly followerCount: number
  
  /** Following count */
  readonly followingCount: number
  
  /** User's custody address */
  readonly custodyAddress: Address
  
  /** Verification timestamps */
  readonly verificationTimestamps: readonly Date[]
}

/**
 * Enhanced Social Profile
 * 
 * This extends your existing UnifiedUserProfile with comprehensive social context
 * while maintaining compatibility with your authentication and creator systems.
 */
export interface EnhancedSocialProfile extends UnifiedUserProfile {
  /** Farcaster user data when available */
  readonly farcasterProfile: FarcasterSDKUser | null
  
  /** Social verification status */
  readonly socialVerification: {
    readonly isFarcasterVerified: boolean
    readonly isAddressVerified: boolean
    readonly verificationLevel: 'none' | 'basic' | 'verified' | 'premium'
    readonly verificationDate: Date | null
    readonly socialScore: number // 0-100 social engagement score
  }
  
  /** Social engagement metrics */
  readonly socialMetrics: {
    readonly totalCasts: number
    readonly totalLikes: number
    readonly totalRecasts: number
    readonly engagementRate: number
    readonly lastActiveDate: Date | null
    readonly networkReach: number
  }
  
  /** Social context for your platform */
  readonly platformSocialContext: {
    readonly recommendedByConnections: number
    readonly mutualConnections: readonly Address[]
    readonly socialRank: number
    readonly influenceScore: number
  }
}

// ================================================
// MINIAPP CAPABILITY SYSTEM
// ================================================

/**
 * MiniApp Capabilities Interface
 * 
 * Defines all possible MiniApp capabilities with detailed configuration options.
 * This enables progressive enhancement based on what's available in each environment.
 */
export interface MiniAppCapabilities {
  /** Wallet and transaction capabilities */
  readonly wallet: {
    readonly canConnect: boolean
    readonly canSignTransactions: boolean
    readonly canBatchTransactions: boolean
    readonly supportedChains: readonly number[]
    readonly maxTransactionValue: bigint | null
    readonly requiredConfirmations: number
    readonly walletType?: 'metamask' | 'phantom' | 'coinbase' | 'walletconnect' | 'brave' | 'unknown'
  }
  
  /** Social sharing and interaction capabilities */
  readonly social: {
    readonly canShare: boolean
    readonly canCompose: boolean
    readonly canAccessSocialGraph: boolean
    readonly canReceiveNotifications: boolean
    readonly canSendNotifications: boolean
    readonly maxShareTextLength: number
    readonly supportedShareTypes: readonly ('text' | 'image' | 'video' | 'frame')[]
  }
  
  /** Platform integration capabilities */
  readonly platform: {
    readonly canDeepLink: boolean
    readonly canAccessClipboard: boolean
    readonly canAccessCamera: boolean
    readonly canAccessLocation: boolean
    readonly canVibrate: boolean
    readonly canPlayAudio: boolean
    readonly supportedImageFormats: readonly string[]
  }
  
  /** Performance and optimization capabilities */
  readonly performance: {
    readonly supportsServiceWorker: boolean
    readonly supportsWebAssembly: boolean
    readonly supportsIndexedDB: boolean
    readonly maxMemoryUsage: number | null
    readonly maxStorageSize: number | null
    readonly batteryOptimized: boolean
  }
}

// ================================================
// SOCIAL SHARING AND INTERACTION TYPES
// ================================================

/**
 * Social Sharing Content Interface
 * 
 * Defines the structure for content that can be shared through MiniApp social features.
 * This integrates with your existing content types from src/types/contracts.ts.
 */
export interface SocialShareableContent {
  /** Content identification */
  readonly contentId: bigint
  readonly contentType: 'article' | 'video' | 'audio' | 'image' | 'course' | 'subscription'
  
  /** Content metadata for sharing */
  readonly shareMetadata: {
    readonly title: string
    readonly description: string
    readonly imageUrl: string
    readonly videoUrl?: string
    readonly duration?: number
    readonly tags: readonly string[]
  }
  
  /** Creator information */
  readonly creatorInfo: {
    readonly creatorAddress: Address
    readonly creatorName: string
    readonly creatorUsername?: string
    readonly creatorAvatar?: string
    readonly isVerifiedCreator: boolean
  }
  
  /** Platform-specific sharing data */
  readonly platformData: {
    readonly shareUrl: string
    readonly embedUrl?: string
    readonly frameUrl?: string
    readonly purchaseUrl: string
    readonly previewHash?: string
  }
  
  /** Engagement tracking */
  readonly analytics: {
    readonly shareTrackingId: string
    readonly referralCode?: string
    readonly campaignId?: string
    readonly expectedEngagement: number
  }
}

/**
 * Social Interaction Types
 * 
 * Defines all possible social interactions that can occur within the MiniApp.
 */
export type SocialInteractionType = 
  | 'content_share'
  | 'creator_follow'
  | 'content_like'
  | 'content_recast'
  | 'purchase_share'
  | 'subscription_share'
  | 'referral_share'
  | 'custom_share'

export interface SocialInteraction {
  readonly id: string
  readonly type: SocialInteractionType
  readonly timestamp: Date
  readonly userId: number // Farcaster FID
  readonly targetContentId?: bigint
  readonly targetCreatorAddress?: Address
  readonly interactionData: Record<string, unknown>
  readonly engagementMetrics: {
    readonly reach: number
    readonly impressions: number
    readonly clicks: number
    readonly conversions: number
  }
}

// ================================================
// MINIAPP STATE MANAGEMENT TYPES
// ================================================

/**
 * MiniApp State Interface
 * 
 * Central state management for all MiniApp functionality.
 * Integrates with your existing state management patterns.
 */
export interface MiniAppState {
  /** Environment and capability state */
  readonly context: MiniAppContextState
  readonly capabilities: MiniAppCapabilities
  
  /** User and social state */
  readonly socialProfile: EnhancedSocialProfile | null
  readonly socialInteractions: readonly SocialInteraction[]
  readonly connectionStatus: ConnectionStatus
  
  /** Content and sharing state */
  readonly shareableContent: readonly SocialShareableContent[]
  readonly pendingShares: readonly PendingShare[]
  readonly shareHistory: readonly CompletedShare[]
  
  /** Performance and analytics state */
  readonly performance: {
    readonly loadTime: number
    readonly renderTime: number
    readonly interactionCount: number
    readonly errorCount: number
    readonly lastUpdateTime: Date
  }
  
  /** Error and loading state */
  readonly loadingState: LoadingState
  readonly errors: readonly MiniAppError[]
  readonly warnings: readonly MiniAppWarning[]
}

/**
 * Share Operation Types
 * 
 * Comprehensive types for managing share operations with proper state tracking.
 */
export interface PendingShare {
  readonly id: string
  readonly content: SocialShareableContent
  readonly shareType: SocialInteractionType
  readonly targetPlatform: 'farcaster' | 'external' | 'frame'
  readonly initiatedAt: Date
  readonly estimatedCompletion: Date
  readonly retryCount: number
  readonly status: 'queued' | 'processing' | 'confirming' | 'retrying'
}

export interface CompletedShare {
  readonly id: string
  readonly content: SocialShareableContent
  readonly shareType: SocialInteractionType
  readonly completedAt: Date
  readonly success: boolean
  readonly engagementData: {
    readonly initialReach: number
    readonly totalEngagement: number
    readonly conversionRate: number
    readonly revenueGenerated: bigint
  }
  readonly error?: MiniAppError
}

// ================================================
// ERROR HANDLING AND VALIDATION TYPES
// ================================================

/**
 * MiniApp Error Types
 * 
 * Comprehensive error handling that builds upon your existing error patterns.
 */
export type MiniAppErrorCode = 
  | 'SDK_INITIALIZATION_FAILED'
  | 'ENVIRONMENT_DETECTION_FAILED'
  | 'SOCIAL_CONTEXT_UNAVAILABLE'
  | 'SHARING_CAPABILITY_MISSING'
  | 'WALLET_CONNECTION_FAILED'
  | 'BATCH_TRANSACTION_UNSUPPORTED'
  | 'SOCIAL_VERIFICATION_FAILED'
  | 'CONTENT_SHARING_FAILED'
  | 'FRAME_INTEGRATION_FAILED'
  | 'NOTIFICATION_PERMISSION_DENIED'
  | 'CAPABILITY_DETECTION_FAILED'
  | 'UNKNOWN_MINIAPP_ERROR'

export interface MiniAppError {
  readonly code: MiniAppErrorCode
  readonly message: string
  readonly timestamp: Date
  readonly context: {
    readonly environment: MiniAppEnvironment
    readonly userAgent: string
    readonly capabilities: readonly MiniAppCapabilityType[]
    readonly stackTrace?: string
    readonly additionalData?: Record<string, unknown>
  }
  readonly recoverable: boolean
  readonly retryAfter?: number
  readonly suggestedAction?: string
}

export interface MiniAppWarning {
  readonly code: string
  readonly message: string
  readonly timestamp: Date
  readonly severity: 'low' | 'medium' | 'high'
  readonly dismissible: boolean
}

// ================================================
// SDK INTEGRATION TYPES
// ================================================

/**
 * Farcaster SDK Integration Types
 * 
 * These types provide complete type safety for all Farcaster SDK interactions.
 */
export interface FarcasterSDKContext {
  readonly user: FarcasterSDKUser
  readonly client: {
    readonly clientFid?: number
    readonly clientName?: string
    readonly clientVersion?: string
  }
  readonly frame?: {
    readonly frameUrl: string
    readonly frameVersion: string
    readonly frameState?: Record<string, unknown>
  }
}

export interface FarcasterSDKActions {
  /** Core SDK actions */
  readonly ready: () => Promise<void>
  readonly close: () => Promise<void>
  
  /** Sharing actions */
  readonly share: (args: {
    readonly text: string
    readonly url?: string
    readonly embeds?: readonly {
      readonly url: string
      readonly metadata?: Record<string, unknown>
    }[]
  }) => Promise<{ success: boolean; castHash?: string }>
  
  readonly composeCast: (args: {
    readonly text: string
    readonly embeds?: readonly string[]
    readonly channel?: string
  }) => Promise<{ success: boolean; castHash?: string }>
  
  /** User actions */
  readonly requestUserInfo: () => Promise<FarcasterSDKUser>
  readonly requestWalletAccess: () => Promise<{ address: Address; signature: string }>
}

/**
 * Complete MiniApp SDK Interface
 * 
 * This is the main interface that encompasses all MiniApp SDK functionality.
 */
export interface MiniAppSDK {
  readonly context: FarcasterSDKContext
  readonly actions: FarcasterSDKActions
  readonly capabilities: MiniAppCapabilities
  readonly isReady: boolean
  readonly version: string
}

// ================================================
// TYPE GUARDS AND VALIDATION UTILITIES
// ================================================

/**
 * Type Guards for Runtime Validation
 * 
 * Following your existing pattern of providing type guards for runtime safety.
 */

export function isFarcasterSDKUser(obj: unknown): obj is FarcasterSDKUser {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'fid' in obj &&
    'username' in obj &&
    'displayName' in obj &&
    'pfpUrl' in obj &&
    typeof (obj as any).fid === 'number' &&
    typeof (obj as any).username === 'string' &&
    typeof (obj as any).displayName === 'string'
  )
}

export function isMiniAppEnvironment(env: string): env is MiniAppEnvironment {
  return ['farcaster', 'embedded', 'web', 'unknown'].includes(env)
}

export function isMiniAppCapability(capability: string): capability is MiniAppCapabilityType {
  return [
    'wallet_connection',
    'social_sharing',
    'compose_cast',
    'batch_transactions',
    'social_context',
    'push_notifications',
    'deep_linking',
    'frame_integration'
  ].includes(capability)
}

export function isSocialShareableContent(obj: unknown): obj is SocialShareableContent {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'contentId' in obj &&
    'contentType' in obj &&
    'shareMetadata' in obj &&
    'creatorInfo' in obj &&
    'platformData' in obj
  )
}

export function isEnhancedSocialProfile(obj: unknown): obj is EnhancedSocialProfile {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'connectionStatus' in obj &&
    'socialVerification' in obj &&
    'socialMetrics' in obj &&
    'platformSocialContext' in obj
  )
}

// ================================================
// UTILITY TYPES FOR DEVELOPMENT
// ================================================

/**
 * Development and Testing Utilities
 * 
 * These types help with development, testing, and debugging MiniApp functionality.
 */

export type MiniAppDeviceProfile = {
  readonly name: string
  readonly viewport: { readonly width: number; readonly height: number }
  readonly capabilities: MiniAppCapabilities
  readonly simulatedLatency: number
  readonly simulatedBandwidth: number
}

export interface MiniAppTestingContext {
  readonly isMockEnvironment: boolean
  readonly mockData: {
    readonly user?: Partial<FarcasterSDKUser>
    readonly capabilities?: Partial<MiniAppCapabilities>
    readonly shareResponses?: Record<string, boolean>
  }
  readonly enableDebugMode: boolean
  readonly logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug'
}

// ================================================
// INTEGRATION HELPERS
// ================================================

/**
 * Integration Helper Types
 * 
 * These types facilitate integration with your existing systems.
 */

export type MiniAppProviderProps = {
  readonly children: React.ReactNode
  readonly testingContext?: MiniAppTestingContext
  readonly fallbackMode?: boolean
  readonly enableAnalytics?: boolean
  readonly customCapabilities?: Partial<MiniAppCapabilities>
}

export type UseMiniAppReturn = {
  readonly state: MiniAppState
  readonly actions: {
    readonly shareContent: (content: SocialShareableContent) => Promise<CompletedShare>
    readonly refreshSocialContext: () => Promise<void>
    readonly updateCapabilities: () => Promise<MiniAppCapabilities>
    readonly signalReady: () => Promise<void>
  }
  readonly utils: {
    readonly isMiniAppEnvironment: boolean
    readonly hasCapability: (capability: MiniAppCapabilityType) => boolean
    readonly getOptimalShareStrategy: (content: SocialShareableContent) => SocialInteractionType
    readonly formatSocialProfile: (profile: EnhancedSocialProfile) => string
  }
}

// Export type utilities for convenience
export type { Address } from 'viem'
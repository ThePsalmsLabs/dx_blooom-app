// types/farcaster.ts - Core Farcaster Type Definitions
import type { Address } from 'viem'

// ===== FARCASTER CONTEXT TYPES =====

/**
 * Represents the different contexts where a Farcaster Mini App can be launched
 * This drives UI adaptation and feature availability
 */
export type FarcasterContext = 
  | 'feed'           // Launched from social feed
  | 'direct_message' // Launched from DM conversation
  | 'composer'       // Launched from cast composer
  | 'profile'        // Launched from user profile
  | 'external'       // Launched from external link

/**
 * User's Farcaster identity information
 * Bridges Farcaster social identity with wallet addresses
 */
export interface FarcasterUser {
  readonly fid: number
  readonly username: string
  readonly displayName: string
  readonly pfpUrl?: string
  readonly bio?: string
  readonly verifiedAddresses: readonly Address[]
  readonly followerCount: number
  readonly followingCount: number
}

/**
 * Authentication state for Farcaster integration
 * Manages both social identity and wallet connectivity
 */
export interface FarcasterAuthState {
  readonly isAuthenticated: boolean
  readonly user: FarcasterUser | null
  readonly connectedAddress: Address | null
  readonly authMethod: 'siwf' | 'wallet' | null // Sign-In-With-Farcaster or direct wallet
}

// ===== CAST AND SOCIAL TYPES =====

/**
 * Configuration for cast composition
 * Used when sharing content or creating promotional casts
 */
export interface CastComposerConfig {
  readonly text?: string
  readonly embeds?: readonly string[]
  readonly channelKey?: string
  readonly parentHash?: string
  readonly parentUrl?: string
}

/**
 * Cast composition result
 * Response from successful cast creation
 */
export interface CastResult {
  readonly hash: string
  readonly url: string
  readonly timestamp: number
}

// ===== NOTIFICATION TYPES =====

/**
 * Types of notifications that can be sent through Farcaster
 * Aligned with your content platform's notification needs
 */
export type FarcasterNotificationType = 
  | 'content_purchase'    // Content was purchased
  | 'subscription_start'  // New subscription started
  | 'subscription_renewal'// Subscription renewed
  | 'creator_follow'      // New follower for creator
  | 'content_publish'     // New content published
  | 'earnings_milestone'  // Earnings milestone reached

/**
 * Notification payload structure
 * Structured for different notification types
 */
export interface FarcasterNotification {
  readonly type: FarcasterNotificationType
  readonly title: string
  readonly body: string
  readonly targetFid: number
  readonly actionUrl?: string
  readonly metadata?: Record<string, unknown>
}

/**
 * Notification handler configuration
 * Controls notification behavior and preferences
 */
export interface NotificationConfig {
  readonly enabled: boolean
  readonly types: readonly FarcasterNotificationType[]
  readonly webhookUrl?: string
  readonly retryAttempts: number
  readonly batchSize: number
}

// ===== FRAME TYPES =====

/**
 * Frame button configuration for social feed integration
 * Follows Farcaster Frame specification
 */
export interface FrameButton {
  readonly label: string
  readonly action: 'post' | 'post_redirect' | 'link' | 'mint'
  readonly target?: string
}

/**
 * Frame metadata for content preview in social feeds
 * Optimized for content discovery and quick actions
 */
export interface FrameMetadata {
  readonly title: string
  readonly image: string
  readonly description?: string
  readonly buttons: readonly FrameButton[]
  readonly postUrl?: string
  readonly refreshPeriod?: number
}

// ===== PROVIDER STATE TYPES =====

/**
 * Global state managed by FarcasterMiniAppProvider
 * Centralized state for all Farcaster functionality
 */
export interface FarcasterProviderState {
  readonly isInitialized: boolean
  readonly context: FarcasterContext
  readonly auth: FarcasterAuthState
  readonly notifications: NotificationConfig
  readonly isInMiniApp: boolean
  readonly clientInfo?: {
    readonly name: string
    readonly version: string
  }
}

/**
 * Actions available through the Farcaster provider
 * These methods are exposed to child components
 */
export interface FarcasterProviderActions {
  readonly authenticate: (method: 'siwf' | 'wallet') => Promise<void>
  readonly logout: () => Promise<void>
  readonly composeCast: (config: CastComposerConfig) => Promise<CastResult>
  readonly sendNotification: (notification: FarcasterNotification) => Promise<void>
  readonly updateNotificationConfig: (config: Partial<NotificationConfig>) => void
  readonly refreshContext: () => Promise<void>
}

/**
 * Complete context value provided by FarcasterMiniAppProvider
 * This is what components consume via useContext
 */
export interface FarcasterContextValue {
  readonly state: FarcasterProviderState
  readonly actions: FarcasterProviderActions
}

// ===== INTEGRATION BRIDGE TYPES =====

/**
 * Authentication bridge configuration
 * Connects Farcaster auth with existing wallet system
 */
export interface AuthBridgeConfig {
  readonly enableSIWF: boolean
  readonly enableWalletFallback: boolean
  readonly requiredVerifications: readonly string[]
  readonly sessionTimeout: number
}

/**
 * Context manager configuration
 * Controls how the app adapts to different Farcaster contexts
 */
export interface ContextManagerConfig {
  readonly adaptiveUI: boolean
  readonly contextRefreshInterval: number
  readonly deepLinkHandling: boolean
}

// ===== ERROR TYPES =====

/**
 * Farcaster-specific error types
 * Provides structured error handling across the integration
 */
export type FarcasterErrorType =
  | 'authentication_failed'
  | 'network_error'
  | 'invalid_context'
  | 'notification_failed'
  | 'cast_composition_failed'
  | 'insufficient_permissions'

/**
 * Structured error for Farcaster operations
 * Provides context and recovery suggestions
 */
export interface FarcasterError extends Error {
  readonly type: FarcasterErrorType
  readonly code?: string
  readonly context?: Record<string, unknown>
  readonly recoverable: boolean
}

// ===== UTILITY TYPES =====

/**
 * Configuration for the entire Farcaster Mini App
 * Top-level configuration that drives all Farcaster functionality
 */
export interface FarcasterMiniAppConfig {
  readonly appId: string
  readonly webhookSecret: string
  readonly authBridge: AuthBridgeConfig
  readonly contextManager: ContextManagerConfig
  readonly notifications: NotificationConfig
  readonly isDevelopment: boolean
}

/**
 * Type guard utilities for runtime type checking
 * Helps ensure type safety when dealing with Farcaster SDK responses
 */
export const FarcasterTypeGuards = {
  isFarcasterUser: (obj: unknown): obj is FarcasterUser => {
    return typeof obj === 'object' && obj !== null && 'fid' in obj && 'username' in obj
  },
  
  isFarcasterContext: (str: string): str is FarcasterContext => {
    return ['feed', 'direct_message', 'composer', 'profile', 'external'].includes(str)
  },
  
  isFarcasterError: (error: unknown): error is FarcasterError => {
    return error instanceof Error && 'type' in error && 'recoverable' in error
  }
} as const
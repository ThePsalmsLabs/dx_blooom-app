/**
 * Unified App Provider Type Definitions
 * File: src/types/unified-app.ts
 * 
 * This file defines the core types for the UnifiedAppProvider system,
 * providing the foundation for the enhanced MiniApp integration.
 */

import React from 'react'

// ================================================
// CORE APPLICATION TYPES
// ================================================

/**
 * Application Context - represents the current application environment
 */
export type ApplicationContext = 'web' | 'miniapp' | 'hybrid'

/**
 * Viewport Size - represents the current viewport dimensions
 */
export type ViewportSize = 'mobile' | 'tablet' | 'desktop'

/**
 * Connection Status - represents the current connection state
 */
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting'

/**
 * Loading State - represents the current loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * User Role - represents the current user's role in the system
 */
export type UserRole = 'disconnected' | 'user' | 'creator' | 'admin'

// ================================================
// USER PROFILE TYPES
// ================================================

/**
 * Unified User Profile - represents the complete user profile
 */
export interface UnifiedUserProfile {
  /** User's wallet address */
  readonly address?: string | null
  
  /** Connection status */
  readonly connectionStatus: ConnectionStatus
  
  /** User role in the system */
  readonly userRole: UserRole
  
  /** Whether user is a registered creator */
  readonly isRegisteredCreator: boolean
  
  /** User capabilities */
  readonly capabilities: {
    readonly canCreateContent: boolean
    readonly canPurchaseContent: boolean
    readonly canShareSocially: boolean
    readonly canUseBatchTransactions: boolean
  }
}

// ================================================
// APPLICATION STATE TYPES
// ================================================

/**
 * Navigation Section - represents a navigation section
 */
export interface NavigationSection {
  readonly id: string
  readonly title: string
  readonly path: string
  readonly icon?: string
  readonly children?: NavigationSection[]
}

/**
 * Navigation State - represents the current navigation state
 */
export interface NavigationState {
  readonly sections: readonly any[]
  readonly currentPath: string
  readonly isNavigating: boolean
}

/**
 * Content State - represents the current content state
 */
export interface ContentState {
  readonly isLoading: LoadingState
  readonly error: Error | null
  readonly lastRefresh: Date | null
}

/**
 * UI State - represents the current UI state
 */
export interface UIState {
  readonly theme: 'light' | 'dark' | 'system'
  readonly isReducedMotion: boolean
  readonly announcements: readonly string[]
}

/**
 * Performance State - represents the current performance state
 */
export interface PerformanceState {
  readonly isOptimizedMode: boolean
  readonly connectionQuality: 'fast' | 'slow' | 'offline'
  readonly resourcesLoaded: boolean
}

/**
 * Error State - represents the current error state
 */
export interface ErrorState {
  readonly critical: Error | null
  readonly recoverable: readonly Error[]
  readonly dismissed: readonly string[]
}

/**
 * Unified Application State - represents the complete application state
 */
export interface UnifiedApplicationState {
  /** Current application context */
  readonly context: ApplicationContext
  
  /** Current viewport size */
  readonly viewport: ViewportSize
  
  /** Current user profile */
  readonly user: UnifiedUserProfile
  
  /** Current navigation state */
  readonly navigation: NavigationState
  
  /** Current content state */
  readonly content: ContentState
  
  /** Current UI state */
  readonly ui: UIState
  
  /** Current performance state */
  readonly performance: PerformanceState
  
  /** Current error state */
  readonly errors: ErrorState
}

// ================================================
// CONTEXT VALUE TYPES
// ================================================

/**
 * Application Actions - represents the available actions
 */
export interface ApplicationActions {
  /** Update user role */
  readonly updateUserRole: (role: UserRole) => void
  
  /** Dismiss error */
  readonly dismissError: (errorId: string) => void
  
  /** Clear all errors */
  readonly clearErrors: () => void
}

/**
 * Application Utilities - represents the available utilities
 */
export interface ApplicationUtils {
  /** Check if current context is MiniApp */
  readonly isMiniApp: boolean
  
  /** Check if current viewport is desktop */
  readonly isDesktop: boolean
  
  /** Check if current viewport is mobile */
  readonly isMobile: boolean
  
  /** Check if device has touch support */
  readonly hasTouch: boolean
  
  /** Check if content can be shared */
  readonly canShare: boolean
  
  /** Check if Web Share API is supported */
  readonly supportsWebShare: boolean
}

/**
 * Unified App Context Value - represents the complete context value
 */
export interface UnifiedAppContextValue {
  /** Current application state */
  readonly state: UnifiedApplicationState
  
  /** Available actions */
  readonly actions: ApplicationActions
  
  /** Available utilities */
  readonly utils: ApplicationUtils
}

// ================================================
// PROVIDER PROPS TYPES
// ================================================

/**
 * Unified App Provider Props - represents the provider props
 */
export interface UnifiedAppProviderProps {
  /** Initial theme */
  readonly initialTheme?: 'light' | 'dark' | 'system'
  
  /** Children components */
  readonly children: React.ReactNode
}

// ================================================
// STATE ACTION TYPES
// ================================================

/**
 * Base State Action - represents the base state action
 */
export interface BaseStateAction {
  readonly type: string
}

/**
 * User Role Updated Action - represents user role update
 */
export interface UserRoleUpdatedAction extends BaseStateAction {
  readonly type: 'USER_ROLE_UPDATED'
  readonly userRole: UserRole
}

/**
 * Error Dismissed Action - represents error dismissal
 */
export interface ErrorDismissedAction extends BaseStateAction {
  readonly type: 'ERROR_DISMISSED'
  readonly errorId: string
}

/**
 * Errors Cleared Action - represents clearing all errors
 */
export interface ErrorsClearedAction extends BaseStateAction {
  readonly type: 'ERRORS_CLEARED'
}

/**
 * State Action - represents all possible state actions
 */
export type StateAction = 
  | UserRoleUpdatedAction
  | ErrorDismissedAction
  | ErrorsClearedAction

// ==============================================================================
// COMPONENT 5.1: ENHANCED ERROR HANDLING
// File: src/utils/error-handling.ts
// ==============================================================================

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { type Address } from 'viem'

// Import existing utility functions
import { formatWeb3Error } from '@/lib/utils'

// Import Component 3.2's x402 payment flow for retry integration
import { useX402ContentPurchaseFlow } from '@/hooks/business/workflows'

// Import Component 3.3's Farcaster context for context error handling
import { useFarcasterContext } from '@/hooks/business/workflows'

/**
 * Mini App Error Interface
 * 
 * This interface defines the structure for Mini App-specific errors, providing
 * type safety and consistent error handling across the application. Each error
 * type maps to specific fallback strategies and user-facing messaging.
 */
export interface MiniAppError {
  /** Specific error type for targeted handling */
  readonly type: 
    | 'FARCASTER_CONTEXT_UNAVAILABLE'
    | 'X402_PAYMENT_FAILED'
    | 'MINIKIT_NOT_AVAILABLE'
    | 'FRAME_RENDERING_ERROR'
    | 'SOCIAL_SHARING_FAILED'
    | 'INVALID_MINI_APP_CONFIG'
    | 'NETWORK_CONNECTIVITY_ERROR'
    | 'WALLET_CONNECTION_ERROR'
    | 'CONTRACT_INTERACTION_ERROR'
    | 'CONTENT_ACCESS_ERROR'
  
  /** Human-readable error message for display */
  readonly message: string
  
  /** Optional additional metadata for debugging and context */
  readonly details?: {
    /** Original error object for debugging */
    readonly originalError?: Error
    /** Content ID if error is content-related */
    readonly contentId?: bigint
    /** User address if error is user-specific */
    readonly userAddress?: Address
    /** Transaction hash if error is transaction-related */
    readonly transactionHash?: string
    /** Timestamp when error occurred */
    readonly timestamp?: number
    /** Additional context-specific data */
    readonly context?: Record<string, unknown>
  }
}

/**
 * Web3 Error Interface
 * 
 * This interface defines the structure for traditional Web3 errors, providing
 * a foundation that Mini App errors can build upon while maintaining compatibility
 * with existing error handling patterns throughout your application.
 */
export interface Web3Error {
  /** Error type classification */
  readonly type: 'TRANSACTION' | 'NETWORK' | 'CONTRACT' | 'WALLET' | 'PERMISSION'
  
  /** User-friendly error message */
  readonly message: string
  
  /** Original error for debugging */
  readonly originalError?: Error
  
  /** Transaction-specific details */
  readonly transactionDetails?: {
    readonly hash?: string
    readonly gasUsed?: bigint
    readonly gasLimit?: bigint
  }
  
  /** Suggested recovery actions */
  readonly recoveryActions?: ReadonlyArray<{
    readonly label: string
    readonly action: () => void | Promise<void>
    readonly isPrimary?: boolean
  }>
}

/**
 * Error Handler Result Interface
 * 
 * This interface defines the comprehensive result structure returned by error
 * handlers, providing everything components need for error display, recovery
 * actions, and user guidance.
 */
interface ErrorHandlerResult {
  /** Whether the error was handled successfully */
  readonly handled: boolean
  
  /** User-friendly message to display */
  readonly displayMessage: string
  
  /** Available recovery actions */
  readonly recoveryActions: ReadonlyArray<{
    readonly label: string
    readonly action: () => void | Promise<void>
    readonly isPrimary?: boolean
  }>
  
  /** Whether to show technical details to user */
  readonly showTechnicalDetails: boolean
  
  /** Fallback navigation route if applicable */
  readonly fallbackRoute?: string
  
  /** Error severity level for UI styling */
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Base Web3 Error Handling Hook
 * 
 * This hook provides the foundational error handling logic that your existing
 * application components rely on. It creates a consistent interface for handling
 * Web3-related errors and provides the base patterns that Mini App error handling
 * can extend without disrupting existing functionality.
 */
export function useWeb3ErrorHandling() {
  const router = useRouter()
  const [currentError, setCurrentError] = useState<Web3Error | null>(null)
  const [isHandling, setIsHandling] = useState(false)

  /**
   * Handle Generic Web3 Errors
   * 
   * This function processes standard Web3 errors using your existing formatWeb3Error
   * utility and provides consistent recovery actions across your application.
   */
  const handleError = useCallback((error: Web3Error): ErrorHandlerResult => {
    setCurrentError(error)
    setIsHandling(true)

    // Use existing formatWeb3Error utility for message consistency
    const displayMessage = error.originalError 
      ? formatWeb3Error(error.originalError)
      : error.message

    const commonRecoveryActions = [
      {
        label: 'Try Again',
        action: () => {
          setCurrentError(null)
          setIsHandling(false)
        },
        isPrimary: true
      },
      {
        label: 'Go to Dashboard',
        action: () => {
          router.push('/dashboard')
          setCurrentError(null)
          setIsHandling(false)
        }
      }
    ]

    const result: ErrorHandlerResult = {
      handled: true,
      displayMessage,
      recoveryActions: [...commonRecoveryActions, ...(error.recoveryActions || [])],
      showTechnicalDetails: process.env.NODE_ENV === 'development',
      severity: error.type === 'NETWORK' ? 'high' : 'medium'
    }

    setIsHandling(false)
    return result
  }, [router])

  /**
   * Handle Transaction-Specific Errors
   * 
   * This function provides specialized handling for transaction errors, including
   * retry mechanisms and gas optimization suggestions that are common in your
   * existing Web3 workflows.
   */
  const handleTransactionError = useCallback((error: Web3Error & {
    retryAction?: () => Promise<void>
    fallbackAction?: () => void
  }): ErrorHandlerResult => {
    const baseResult = handleError(error)
    
    const transactionRecoveryActions = []
    
    if (error.retryAction) {
      transactionRecoveryActions.push({
        label: 'Retry Transaction',
        action: error.retryAction,
        isPrimary: true
      })
    }
    
    if (error.fallbackAction) {
      transactionRecoveryActions.push({
        label: 'Use Alternative Method',
        action: error.fallbackAction
      })
    }

    return {
      ...baseResult,
      recoveryActions: [...transactionRecoveryActions, ...baseResult.recoveryActions],
      severity: 'high'
    }
  }, [handleError])

  /**
   * Clear Current Error State
   * 
   * This function resets the error handling state, useful for recovery actions
   * and component cleanup scenarios.
   */
  const clearError = useCallback(() => {
    setCurrentError(null)
    setIsHandling(false)
  }, [])

  return {
    currentError,
    isHandling,
    handleError,
    handleTransactionError,
    clearError
  }
}

/**
 * Mini App Error Mapping Function
 * 
 * This function converts Mini App specific errors into the standard Web3Error
 * format, enabling seamless integration with your existing error handling
 * infrastructure while providing Mini App specific context and recovery actions.
 */
function mapMiniAppError(error: MiniAppError): Web3Error {
  const baseMapping: Web3Error = {
    type: 'CONTRACT', // Default type, will be overridden below
    message: error.message,
    originalError: error.details?.originalError
  }

  switch (error.type) {
    case 'FARCASTER_CONTEXT_UNAVAILABLE':
      return {
        ...baseMapping,
        type: 'NETWORK',
        message: 'Social features are temporarily unavailable. You can continue using the platform without social functionality.'
      }
    
    case 'X402_PAYMENT_FAILED':
      return {
        ...baseMapping,
        type: 'TRANSACTION',
        message: 'Payment processing failed. Please try again or use the traditional payment method.',
        transactionDetails: error.details?.transactionHash ? {
          hash: error.details.transactionHash
        } : undefined
      }
    
    case 'MINIKIT_NOT_AVAILABLE':
      return {
        ...baseMapping,
        type: 'WALLET',
        message: 'Mini App features are not available. Please use the web interface for full functionality.'
      }
    
    case 'FRAME_RENDERING_ERROR':
      return {
        ...baseMapping,
        type: 'CONTRACT',
        message: 'Content preview failed to load. Please try refreshing or view the content directly.'
      }
    
    case 'SOCIAL_SHARING_FAILED':
      return {
        ...baseMapping,
        type: 'NETWORK',
        message: 'Unable to share to social media. The content has been saved successfully.'
      }
    
    case 'INVALID_MINI_APP_CONFIG':
      return {
        ...baseMapping,
        type: 'PERMISSION',
        message: 'Mini App configuration is invalid. Please contact support if this persists.'
      }
    
    case 'NETWORK_CONNECTIVITY_ERROR':
      return {
        ...baseMapping,
        type: 'NETWORK',
        message: 'Network connection issue detected. Please check your internet connection and try again.'
      }
    
    case 'WALLET_CONNECTION_ERROR':
      return {
        ...baseMapping,
        type: 'WALLET',
        message: 'Wallet connection failed. Please reconnect your wallet and try again.'
      }
    
    case 'CONTRACT_INTERACTION_ERROR':
      return {
        ...baseMapping,
        type: 'CONTRACT',
        message: 'Smart contract interaction failed. Please try again or contact support.'
      }
    
    case 'CONTENT_ACCESS_ERROR':
      return {
        ...baseMapping,
        type: 'PERMISSION',
        message: 'Unable to access content. Please verify your purchase or subscription status.'
      }
    
    default:
      return {
        ...baseMapping,
        type: 'CONTRACT',
        message: 'An unexpected error occurred. Please try again.'
      }
  }
}

/**
 * Enhanced Mini App Error Handling Hook
 * 
 * This hook extends the base Web3 error handling with Mini App-specific error
 * scenarios and recovery strategies. It integrates with your existing payment flows
 * and social context systems to provide seamless error recovery experiences.
 * 
 * Key Features:
 * - Extends existing useWeb3ErrorHandling without disruption
 * - Integrates with Component 3.2's x402 payment retry mechanisms
 * - Connects with Component 3.3's Farcaster context error handling
 * - Provides intelligent fallback navigation using Next.js router
 * - Maintains compatibility with all existing error handling patterns
 * 
 * Integration Points:
 * - Uses formatWeb3Error from your existing utilities for message consistency
 * - Leverages useX402ContentPurchaseFlow for payment retry logic
 * - Integrates with useFarcasterContext for social context error detection
 * - Follows your established routing patterns for fallback navigation
 * - Maintains error state management compatible with existing components
 */
export function useMiniAppErrorHandling(contentId?: bigint) {
  const router = useRouter()
  const baseErrorHandling = useWeb3ErrorHandling()
  const farcasterContext = useFarcasterContext()
  
  // Integration with Component 3.2's x402 payment flow for retry functionality
  const x402PurchaseFlow = useX402ContentPurchaseFlow(contentId, undefined)
  
  const [miniAppErrors, setMiniAppErrors] = useState<MiniAppError[]>([])

  /**
   * Retry X402 Payment Function
   * 
   * This function leverages the existing x402 payment flow to retry failed
   * payments, providing users with a seamless recovery experience for payment
   * failures in Mini App contexts.
   */
  const retryX402Payment = useCallback(async (): Promise<void> => {
    if (!x402PurchaseFlow.purchaseWithX402) {
      throw new Error('X402 payment retry not available')
    }

    try {
      await x402PurchaseFlow.purchaseWithX402()
    } catch (error) {
      const retryError: MiniAppError = {
        type: 'X402_PAYMENT_FAILED',
        message: 'Payment retry failed. Please try using the traditional payment method.',
        details: {
          originalError: error instanceof Error ? error : new Error('Unknown retry error'),
          contentId,
          timestamp: Date.now()
        }
      }
      throw retryError
    }
  }, [x402PurchaseFlow, contentId])

  /**
   * Handle Mini App Error Function
   * 
   * This function processes Mini App-specific errors and routes them through
   * the appropriate handling strategies, including integration with your existing
   * error systems and specialized recovery actions for Mini App scenarios.
   */
  const handleMiniAppError = useCallback((error: MiniAppError): ErrorHandlerResult => {
    // Add error to tracking for debugging and analytics
    setMiniAppErrors(prev => [...prev.slice(-9), error]) // Keep last 10 errors
    
    // Map Mini App error to standard Web3 error format
    const mappedError = mapMiniAppError(error)
    
    // Handle specific Mini App error scenarios
    switch (error.type) {
      case 'FARCASTER_CONTEXT_UNAVAILABLE': {
        const contextError: Web3Error = {
          ...mappedError,
          recoveryActions: [
            {
              label: 'Continue without social features',
              action: () => {
                router.push('/browse')
                baseErrorHandling.clearError()
              },
              isPrimary: true
            },
            {
              label: 'Refresh page',
              action: () => window.location.reload()
            }
          ]
        }
        return baseErrorHandling.handleError(contextError)
      }
      
      case 'X402_PAYMENT_FAILED': {
        const paymentError: Web3Error = {
          ...mappedError,
          recoveryActions: [
            {
              label: 'Retry payment',
              action: retryX402Payment,
              isPrimary: true
            },
            {
              label: 'Use traditional payment',
              action: () => {
                const fallbackRoute = contentId 
                  ? `/content/${contentId}/purchase` 
                  : '/browse'
                router.push(fallbackRoute)
                baseErrorHandling.clearError()
              }
            }
          ]
        }
        return baseErrorHandling.handleTransactionError({
          ...paymentError,
          retryAction: retryX402Payment,
          fallbackAction: () => {
            const fallbackRoute = contentId 
              ? `/content/${contentId}/purchase` 
              : '/browse'
            router.push(fallbackRoute)
          }
        })
      }
      
      case 'MINIKIT_NOT_AVAILABLE': {
        const miniKitError: Web3Error = {
          ...mappedError,
          recoveryActions: [
            {
              label: 'Use web interface',
              action: () => {
                router.push('/browse')
                baseErrorHandling.clearError()
              },
              isPrimary: true
            }
          ]
        }
        return baseErrorHandling.handleError(miniKitError)
      }
      
      case 'FRAME_RENDERING_ERROR': {
        const frameError: Web3Error = {
          ...mappedError,
          recoveryActions: [
            {
              label: 'View content directly',
              action: () => {
                const directRoute = contentId 
                  ? `/content/${contentId}` 
                  : '/browse'
                router.push(directRoute)
                baseErrorHandling.clearError()
              },
              isPrimary: true
            },
            {
              label: 'Refresh frame',
              action: () => window.location.reload()
            }
          ]
        }
        return baseErrorHandling.handleError(frameError)
      }
      
      case 'SOCIAL_SHARING_FAILED': {
        const sharingError: Web3Error = {
          ...mappedError,
          recoveryActions: [
            {
              label: 'Continue without sharing',
              action: () => {
                baseErrorHandling.clearError()
              },
              isPrimary: true
            },
            {
              label: 'Copy link manually',
              action: () => {
                const currentUrl = window.location.href
                navigator.clipboard.writeText(currentUrl).catch(() => {
                  // Fallback for older browsers
                  prompt('Copy this link:', currentUrl)
                })
                baseErrorHandling.clearError()
              }
            }
          ]
        }
        return baseErrorHandling.handleError(sharingError)
      }
      
      default: {
        // Delegate unknown Mini App errors to base Web3 error handling
        return baseErrorHandling.handleError(mappedError)
      }
    }
  }, [baseErrorHandling, router, retryX402Payment, contentId])

  /**
   * Detect Context Errors Function
   * 
   * This function monitors the Farcaster context and automatically handles
   * context-related errors, providing proactive error management for Mini App
   * scenarios where social context is unavailable or invalid.
   */
  const detectContextErrors = useCallback((): MiniAppError | null => {
    // Check if Farcaster context is required but unavailable
    if (typeof window !== 'undefined' && window.location.pathname.includes('/miniapp/')) {
      if (!farcasterContext) {
        return {
          type: 'FARCASTER_CONTEXT_UNAVAILABLE',
          message: 'Social context is not available. Redirecting to standard interface.',
          details: {
            timestamp: Date.now(),
            context: { pathname: window.location.pathname }
          }
        }
      }
    }
    
    return null
  }, [farcasterContext])

  /**
   * Auto-handle Context Errors Effect
   * 
   * This effect automatically detects and handles context errors when the
   * hook is used in Mini App contexts, providing seamless error management
   * without requiring explicit error checking in every component.
   */
  const contextError = detectContextErrors()
  
  /**
   * Create Mini App Error Function
   * 
   * This utility function provides a convenient way for components to create
   * properly structured Mini App errors with consistent formatting and metadata.
   */
  const createMiniAppError = useCallback((
    type: MiniAppError['type'],
    message: string,
    details?: MiniAppError['details']
  ): MiniAppError => {
    return {
      type,
      message,
      details: {
        timestamp: Date.now(),
        ...details
      }
    }
  }, [])

  /**
   * Clear Mini App Errors Function
   * 
   * This function clears the Mini App error history and resets error state,
   * useful for component cleanup and recovery scenarios.
   */
  const clearMiniAppErrors = useCallback(() => {
    setMiniAppErrors([])
    baseErrorHandling.clearError()
  }, [baseErrorHandling])

  /**
   * Hook Return Value
   * 
   * The hook returns a comprehensive interface that extends the base Web3 error
   * handling with Mini App-specific functionality while maintaining full
   * compatibility with existing error handling patterns throughout your application.
   */
  return {
    // Extend base error handling functionality
    ...baseErrorHandling,
    
    // Mini App specific error handling
    handleMiniAppError,
    createMiniAppError,
    clearMiniAppErrors,
    
    // Error state management
    miniAppErrors,
    contextError,
    
    // Utility functions
    retryX402Payment,
    detectContextErrors,
    
    // Integration hooks for components
    isX402Available: Boolean(x402PurchaseFlow.purchaseWithX402),
    isFarcasterAvailable: Boolean(farcasterContext),
    
    // Error recovery helpers
    canRetryPayment: Boolean(contentId && x402PurchaseFlow.purchaseWithX402),
    canUseFallbackFlow: true // Always true since we have traditional flows
  }
}

/**
 * Error Boundary Helper Function
 * 
 * This function provides a standardized way to handle errors in React Error
 * Boundaries, ensuring consistent error reporting and recovery across your
 * application's Mini App integration points.
 */
export function handleErrorBoundaryError(
  error: Error,
  errorInfo: { componentStack: string }
): MiniAppError {
  return {
    type: 'INVALID_MINI_APP_CONFIG',
    message: 'A component error occurred. Please refresh the page or contact support.',
    details: {
      originalError: error,
      timestamp: Date.now(),
      context: {
        componentStack: errorInfo.componentStack,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      }
    }
  }
}
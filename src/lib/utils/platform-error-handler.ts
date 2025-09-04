'use client'

import { toast } from 'sonner'
import { getCleanErrorMessage } from './toast'
import { type Address } from 'viem'

// ================================================
// PLATFORM ERROR HANDLER - PRODUCTION READY
// ================================================

/**
 * Error Context Types
 * Defines different execution contexts for tailored error handling
 */
export type ErrorContext =
  | 'web'           // Standard web browser
  | 'mobile'        // Mobile browser
  | 'miniapp'       // Farcaster miniapp
  | 'desktop'       // Desktop application
  | 'unknown'       // Undetected context

/**
 * Error Severity Levels
 * Determines toast styling and user interaction requirements
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Error Category Classification
 * Helps determine appropriate recovery strategies
 */
export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'permission'
  | 'validation'
  | 'blockchain'
  | 'content'
  | 'payment'
  | 'social'
  | 'system'
  | 'user_action'
  | 'unknown'

/**
 * Recovery Action Definition
 * Defines actions users can take to recover from errors
 */
export interface RecoveryAction {
  readonly label: string
  readonly action: () => void | Promise<void>
  readonly isPrimary?: boolean
  readonly contextSpecific?: boolean
  readonly requiresPermission?: boolean
}

/**
 * Error Metadata
 * Additional context for error handling and debugging
 */
export interface ErrorMetadata {
  readonly userId?: string
  readonly userAddress?: Address
  readonly sessionId?: string
  readonly timestamp: number
  readonly userAgent: string
  readonly url: string
  readonly viewport?: { width: number; height: number }
  readonly networkStatus?: 'online' | 'offline'
  readonly context: ErrorContext
  readonly category: ErrorCategory
  readonly severity: ErrorSeverity
  readonly originalError?: Error
  readonly transactionHash?: string
  readonly contentId?: string
  readonly retryCount?: number
  readonly maxRetries?: number
  readonly [key: string]: any
}

/**
 * Error Handler Options
 * Configuration for error handling behavior
 */
export interface ErrorHandlerOptions {
  readonly context?: ErrorContext
  readonly category?: ErrorCategory
  readonly severity?: ErrorSeverity
  readonly duration?: number
  readonly showRetry?: boolean
  readonly showReport?: boolean
  readonly silent?: boolean
  readonly metadata?: Partial<ErrorMetadata>
  readonly onRetry?: () => void | Promise<void>
  readonly onDismiss?: () => void
  readonly recoveryActions?: readonly RecoveryAction[]
}

/**
 * Error Handler Result
 * Return type for error handling functions
 */
export interface ErrorHandlerResult {
  readonly handled: boolean
  readonly toastId?: string | number
  readonly context: ErrorContext
  readonly category: ErrorCategory
  readonly severity: ErrorSeverity
}

// ================================================
// CONTEXT DETECTION UTILITIES
// ================================================

/**
 * Detect Current Execution Context
 * Determines the platform/environment for context-aware error handling
 */
export function detectErrorContext(): ErrorContext {
  if (typeof window === 'undefined') return 'unknown'

  // Check for miniapp environment
  const isMiniApp = window.location.pathname.includes('/miniapp') ||
                   window.location.pathname.includes('/mini/') ||
                   document.documentElement.getAttribute('data-context') === 'miniapp' ||
                   (typeof window !== 'undefined' && 'parent' in window && window.parent !== window)

  if (isMiniApp) return 'miniapp'

  // Check for mobile environment
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768

  if (isMobile) return 'mobile'

  // Check for desktop vs web
  const isDesktop = window.innerWidth > 1024 && !isMobile

  return isDesktop ? 'desktop' : 'web'
}

/**
 * Get Device and Network Context
 * Provides additional context for error handling
 */
export function getDeviceContext(): Partial<ErrorMetadata> {
  if (typeof window === 'undefined') return {}

  return {
    userAgent: navigator.userAgent,
    url: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    networkStatus: navigator.onLine ? 'online' : 'offline',
    context: detectErrorContext(),
    timestamp: Date.now()
  }
}

// ================================================
// ERROR CLASSIFICATION UTILITIES
// ================================================

/**
 * Classify Error Category
 * Analyzes error message and context to determine category
 */
export function classifyError(
  error: Error | string,
  context?: ErrorContext
): ErrorCategory {
  const message = typeof error === 'string' ? error : error.message
  const lowerMessage = message.toLowerCase()

  // Network-related errors
  if (lowerMessage.includes('network') ||
      lowerMessage.includes('fetch') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('connection') ||
      lowerMessage.includes('offline') ||
      lowerMessage.includes('cors')) {
    return 'network'
  }

  // Authentication errors
  if (lowerMessage.includes('auth') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('login') ||
      lowerMessage.includes('token')) {
    return 'authentication'
  }

  // Permission errors
  if (lowerMessage.includes('permission') ||
      lowerMessage.includes('denied') ||
      lowerMessage.includes('not allowed')) {
    return 'permission'
  }

  // Validation errors
  if (lowerMessage.includes('validation') ||
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('required') ||
      lowerMessage.includes('format')) {
    return 'validation'
  }

  // Blockchain/Web3 errors
  if (lowerMessage.includes('transaction') ||
      lowerMessage.includes('contract') ||
      lowerMessage.includes('blockchain') ||
      lowerMessage.includes('wallet') ||
      lowerMessage.includes('web3') ||
      lowerMessage.includes('viem') ||
      lowerMessage.includes('wagmi') ||
      lowerMessage.includes('chain') ||
      lowerMessage.includes('rpc')) {
    return 'blockchain'
  }

  // Payment errors
  if (lowerMessage.includes('payment') ||
      lowerMessage.includes('usdc') ||
      lowerMessage.includes('purchase') ||
      lowerMessage.includes('subscription')) {
    return 'payment'
  }

  // Social/Farcaster errors
  if (lowerMessage.includes('social') ||
      lowerMessage.includes('farcaster') ||
      lowerMessage.includes('cast') ||
      lowerMessage.includes('share') ||
      lowerMessage.includes('minikit')) {
    return 'social'
  }

  // Content-related errors
  if (lowerMessage.includes('content') ||
      lowerMessage.includes('upload') ||
      lowerMessage.includes('download') ||
      lowerMessage.includes('ipfs')) {
    return 'content'
  }

  // User action errors
  if (lowerMessage.includes('user') ||
      lowerMessage.includes('action') ||
      lowerMessage.includes('cancel') ||
      lowerMessage.includes('abort')) {
    return 'user_action'
  }

  // Context-specific system errors
  if (context === 'miniapp') {
    if (lowerMessage.includes('sdk') ||
        lowerMessage.includes('miniapp') ||
        lowerMessage.includes('context')) {
      return 'system'
    }
  }

  return 'unknown'
}

/**
 * Determine Error Severity
 * Based on error category and context
 */
export function determineErrorSeverity(
  category: ErrorCategory,
  context: ErrorContext,
  error: Error | string
): ErrorSeverity {
  // Critical errors that require immediate attention
  if (category === 'system' ||
      category === 'blockchain' ||
      category === 'authentication') {
    return 'critical'
  }

  // High severity errors
  if (category === 'payment' ||
      category === 'permission' ||
      (category === 'network' && context === 'miniapp')) {
    return 'high'
  }

  // Medium severity errors
  if (category === 'content' ||
      category === 'validation' ||
      category === 'social') {
    return 'medium'
  }

  // Low severity errors
  return 'low'
}

// ================================================
// ERROR MESSAGE GENERATION
// ================================================

/**
 * Generate Context-Aware Error Messages
 * Creates user-friendly messages based on context and error type
 */
export function generateErrorMessage(
  error: Error | string,
  category: ErrorCategory,
  context: ErrorContext,
  severity: ErrorSeverity
): string {
  const baseMessage = typeof error === 'string' ? error : error.message
  const cleanMessage = getCleanErrorMessage(baseMessage)

  // Context-specific prefixes
  const contextPrefix = {
    miniapp: 'In the social context',
    mobile: 'On mobile',
    web: 'In the web interface',
    desktop: 'In the desktop app',
    unknown: ''
  }[context]

  const prefix = contextPrefix ? `${contextPrefix}, ` : ''

  // Category-specific messages
  switch (category) {
    case 'network':
      if (context === 'miniapp') {
        return `${prefix}we're having trouble connecting to the social network. Please check your connection and try again.`
      }
      return `${prefix}we're having trouble connecting to the network. Please check your internet connection and try again.`

    case 'authentication':
      return `${prefix}you need to connect your wallet to continue. Please authenticate and try again.`

    case 'permission':
      return `${prefix}we need additional permissions to complete this action. Please grant the required permissions.`

    case 'validation':
      return `${prefix}please check your input and try again.`

    case 'blockchain':
      if (severity === 'critical') {
        return `${prefix}we're experiencing blockchain connectivity issues. Some features may be temporarily unavailable.`
      }
      return `${prefix}your wallet connection seems unstable. Some transactions might take longer than usual.`

    case 'payment':
      return `${prefix}we're having trouble processing your payment. Please try again or use a different payment method.`

    case 'social':
      return `${prefix}social features are temporarily unavailable. You can still browse and purchase content normally.`

    case 'content':
      return `${prefix}we're having trouble loading content. Please try refreshing or view different content.`

    case 'user_action':
      return `${prefix}there was an issue with your last action. Please check your input and try again.`

    case 'system':
      if (severity === 'critical') {
        return `${prefix}we're experiencing technical difficulties. We're working to resolve this quickly.`
      }
      return `${prefix}something didn't work as expected, but you should be able to continue normally.`

    default:
      return `${prefix}${cleanMessage || 'something went wrong'}. Please try again.`
  }
}

// ================================================
// RECOVERY ACTION GENERATION
// ================================================

/**
 * Generate Recovery Actions
 * Creates context-appropriate recovery actions
 */
export function generateRecoveryActions(
  category: ErrorCategory,
  context: ErrorContext,
  severity: ErrorSeverity,
  options?: ErrorHandlerOptions
): RecoveryAction[] {
  const actions: RecoveryAction[] = []

  // Default retry action for non-critical errors
  if (severity !== 'critical' && options?.showRetry !== false && options?.onRetry) {
    actions.push({
      label: 'Try Again',
      action: options.onRetry,
      isPrimary: true
    })
  }

  // Context-specific recovery actions
  switch (context) {
    case 'miniapp':
      if (category === 'network' || category === 'social') {
        actions.push({
          label: 'Open in Browser',
          action: () => {
            const webUrl = window.location.href.replace('/mini', '').replace('/miniapp', '')
            window.open(webUrl, '_blank')
          },
          contextSpecific: true
        })
      }
      break

    case 'mobile':
      if (category === 'network') {
        actions.push({
          label: 'Check Connection',
          action: () => {
            // This could trigger a network status check
            window.location.reload()
          },
          contextSpecific: true
        })
      }
      break
  }

  // Category-specific recovery actions
  switch (category) {
    case 'authentication':
      actions.push({
        label: 'Connect Wallet',
        action: () => {
          // This would trigger wallet connection
          window.location.reload()
        },
        isPrimary: !actions.some(a => a.isPrimary)
      })
      break

    case 'blockchain':
      if (severity !== 'critical') {
        actions.push({
          label: 'Refresh Connection',
          action: () => {
            window.location.reload()
          }
        })
      }
      break

    case 'payment':
      actions.push({
        label: 'Use Different Method',
        action: () => {
          // This could navigate to payment method selection
          console.log('Navigate to payment methods')
        }
      })
      break
  }

  // System-level recovery
  if (severity === 'critical') {
    actions.push({
      label: 'Refresh Page',
      action: () => window.location.reload(),
      isPrimary: !actions.some(a => a.isPrimary)
    })
  }

  return actions
}

// ================================================
// MAIN ERROR HANDLER
// ================================================

/**
 * Handle Platform Error
 * Main entry point for error handling with context awareness
 */
export function handlePlatformError(
  error: Error | string,
  options: ErrorHandlerOptions = {}
): ErrorHandlerResult {
  try {
    // Detect context if not provided
    const context = options.context || detectErrorContext()

    // Classify error
    const category = options.category || classifyError(error, context)

    // Determine severity
    const severity = options.severity || determineErrorSeverity(category, context, error)

    // Generate user-friendly message with better error serialization
    const message = generateErrorMessage(error, category, context, severity)

    // Get device context
    const deviceContext = getDeviceContext()

    // Build metadata
    const metadata: ErrorMetadata = {
      ...deviceContext,
      context,
      category,
      severity,
      originalError: typeof error === 'object' ? error : undefined,
      timestamp: Date.now(),
      userAgent: deviceContext.userAgent || 'Unknown',
      url: deviceContext.url || 'Unknown',
      ...options.metadata
    }

    // Skip silent errors
    if (options.silent) {
      return {
        handled: true,
        context,
        category,
        severity
      }
    }

    // Generate recovery actions
    const recoveryActions = options.recoveryActions ||
      generateRecoveryActions(category, context, severity, options)

    // Determine toast type and styling based on severity
    const getToastConfig = (): { type: 'error' | 'warning' | 'info'; duration: number; style: React.CSSProperties } => {
      switch (severity) {
        case 'critical':
          return {
            type: 'error',
            duration: options.duration || 15000, // Longer for critical errors
            style: { borderLeft: '4px solid #ef4444' }
          }
        case 'high':
          return {
            type: 'error',
            duration: options.duration || 12000,
            style: { borderLeft: '4px solid #f97316' }
          }
        case 'medium':
          return {
            type: 'warning',
            duration: options.duration || 10000,
            style: { borderLeft: '4px solid #eab308' }
          }
        case 'low':
          return {
            type: 'info',
            duration: options.duration || 8000,
            style: { borderLeft: '4px solid #3b82f6' }
          }
        default:
          // Fallback for any unexpected severity values
          return {
            type: 'error',
            duration: options.duration || 10000,
            style: { borderLeft: '4px solid #ef4444' }
          }
      }
    }

    const toastConfig = getToastConfig()

    // Show primary action if available
    const primaryAction = recoveryActions.find(action => action.isPrimary)
    const actionButton = primaryAction ? {
      label: primaryAction.label,
      onClick: primaryAction.action
    } : undefined

    // Show toast
    let toastId: string | number
    switch (toastConfig.type) {
      case 'error':
        toastId = toast.error(message, {
          duration: toastConfig.duration,
          action: actionButton,
          style: toastConfig.style
        })
        break
      case 'warning':
        toastId = toast.warning(message, {
          duration: toastConfig.duration,
          action: actionButton,
          style: toastConfig.style
        })
        break
      case 'info':
        toastId = toast.info(message, {
          duration: toastConfig.duration,
          action: actionButton,
          style: toastConfig.style
        })
        break
      default:
        toastId = toast(message, {
          duration: toastConfig.duration,
          action: actionButton,
          style: toastConfig.style
        })
    }

    // Show additional recovery actions if any
    const additionalActions = recoveryActions.filter(action => !action.isPrimary)
    if (additionalActions.length > 0 && recoveryActions.length > 1) {
      setTimeout(() => {
        additionalActions.forEach(action => {
          toast.info(`Alternative: ${action.label}`, {
            duration: 6000,
            action: {
              label: 'Do it',
              onClick: action.action
            }
          })
        })
      }, 1000)
    }

    // Log error for monitoring (in production, this would go to your error tracking service)
    if (process.env.NODE_ENV === 'development') {
      // Properly serialize error object to avoid empty object logging
      const errorToLog = typeof error === 'string'
        ? error
        : error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
              cause: error.cause
            }
          : error || 'Unknown error'

      console.error('[Platform Error Handler]', {
        error: errorToLog,
        metadata,
        recoveryActions: recoveryActions.map(a => a.label)
      })
    } else {
      // Production error logging - ensure proper serialization
      const errorToLog = typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : error && typeof error === 'object'
            ? JSON.stringify(error)
            : String(error || 'Unknown error')

      console.error('[Error]', message, {
        ...metadata,
        originalError: errorToLog
      })
    }

    return {
      handled: true,
      toastId,
      context,
      category,
      severity
    }

  } catch (handlerError) {
    // Fallback error handling if the error handler itself fails
    console.error('[Error Handler Failed]', handlerError)
    toast.error('An unexpected error occurred', {
      duration: 10000
    })

    return {
      handled: false,
      context: 'unknown',
      category: 'system',
      severity: 'critical'
    }
  }
}

// ================================================
// ASYNC ERROR HANDLER
// ================================================

/**
 * Handle Async Operations with Error Recovery
 * Wraps async operations with automatic error handling
 */
export async function handleAsync<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions & {
    retryCount?: number
    maxRetries?: number
    retryDelay?: number
  } = {}
): Promise<T | null> {
  const {
    retryCount = 0,
    maxRetries = 2,
    retryDelay = 1000,
    ...handlerOptions
  } = options

  try {
    return await operation()
  } catch (error) {
    const errorResult = handlePlatformError(error as Error, {
      ...handlerOptions,
      metadata: {
        ...handlerOptions.metadata,
        retryCount,
        maxRetries
      }
    })

    // Auto-retry for network and temporary errors
    if (retryCount < maxRetries &&
        (errorResult.category === 'network' || errorResult.severity === 'medium')) {

      await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)))

      return handleAsync(operation, {
        ...options,
        retryCount: retryCount + 1
      })
    }

    return null
  }
}

// ================================================
// REACT HOOK FOR ERROR HANDLING
// ================================================

/**
 * React Hook for Platform Error Handling
 * Provides error handling functions for React components
 */
export function usePlatformErrorHandler() {
  const context = detectErrorContext()

  const handleError = (error: Error | string, options?: ErrorHandlerOptions) =>
    handlePlatformError(error, { ...options, context })

  const handleAsync = (operation: () => Promise<any>, options?: ErrorHandlerOptions): Promise<any> => {
    return operation().catch(error => {
      handlePlatformError(error, { ...options, context })
      throw error
    })
  }

  const handleRetry = (retryFn: () => void | Promise<void>, context?: string) => () => {
    try {
      const result = retryFn()
      if (result instanceof Promise) {
        result.catch(error => handleError(error, { context: context as ErrorContext }))
      }
    } catch (error) {
      handleError(error as Error, { context: context as ErrorContext })
    }
  }

  return {
    handleError,
    handleAsync,
    handleRetry,
    context,
    detectContext: detectErrorContext,
    getDeviceContext
  }
}

// ================================================
// LEGACY COMPATIBILITY
// ================================================

/**
 * Legacy Error Handler for Backward Compatibility
 * Maintains compatibility with existing error handling patterns
 */
export const handleUIError = (
  error: Error | string,
  context?: string,
  onRetry?: () => void
) => {
  const validContext = (['web', 'mobile', 'miniapp', 'desktop', 'unknown'] as const).includes(context as any)
    ? context as ErrorContext
    : 'unknown'

  return handlePlatformError(error, {
    context: validContext,
    onRetry,
    showRetry: !!onRetry
  })
}

/**
 * Enhanced Toast Utility
 * 
 * This utility provides a clean interface for displaying toast notifications
 * that replace intrusive UI error messages and debug information.
 * All toasts are configured to disappear after 10 seconds as requested.
 */

import { toast } from 'sonner'

// Toast configuration with 10-second duration
const TOAST_DURATION = 10000 // 10 seconds

interface ToastOptions {
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  id?: string
}

/**
 * Enhanced toast functions that replace UI-disrupting Alert components
 */
export const enhancedToast = {
  /**
   * Success toast for successful operations
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration ?? TOAST_DURATION,
      action: options?.action,
      id: options?.id,
      position: 'top-right'
    })
  },

  /**
   * Error toast for transaction failures and errors
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration ?? TOAST_DURATION,
      action: options?.action,
      id: options?.id,
      position: 'top-right'
    })
  },

  /**
   * Warning toast for important notices
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      duration: options?.duration ?? TOAST_DURATION,
      action: options?.action,
      id: options?.id,
      position: 'top-right'
    })
  },

  /**
   * Info toast for general information
   */
  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      duration: options?.duration ?? TOAST_DURATION,
      action: options?.action,
      id: options?.id,
      position: 'top-right'
    })
  },

  /**
   * Transaction error toast with detailed error handling
   */
  transactionError: (error: Error, transactionHash?: string, options?: ToastOptions) => {
    const message = `Transaction failed: ${error.message}`
    
    const action = transactionHash ? {
      label: 'View Transaction',
      onClick: () => {
        window.open(`https://basescan.org/tx/${transactionHash}`, '_blank')
      }
    } : options?.action

    return toast.error(message, {
      duration: options?.duration ?? TOAST_DURATION,
      action,
      id: options?.id,
      position: 'top-right'
    })
  },

  /**
   * Payment error toast with retry option
   */
  paymentError: (error: string, onRetry?: () => void, options?: ToastOptions) => {
    const action = onRetry ? {
      label: 'Retry Payment',
      onClick: onRetry
    } : options?.action

    return toast.error(`Payment failed: ${error}`, {
      duration: options?.duration ?? TOAST_DURATION,
      action,
      id: options?.id,
      position: 'top-right'
    })
  },

  /**
   * Loading toast for ongoing operations
   */
  loading: (message: string, options?: Omit<ToastOptions, 'duration'>) => {
    return toast.loading(message, {
      id: options?.id,
      position: 'top-right'
    })
  },

  /**
   * Update an existing toast (useful for loading states)
   */
  update: (id: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const toastFn = toast[type]
    return toastFn(message, {
      id,
      duration: TOAST_DURATION,
      position: 'top-right'
    })
  },

  /**
   * Dismiss a toast
   */
  dismiss: (id?: string) => {
    return toast.dismiss(id)
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    return toast.dismiss()
  }
}

/**
 * Utility to extract user-friendly error messages
 */
export const getCleanErrorMessage = (error: Error | string | unknown): string => {
  if (typeof error === 'string') return error

  if (error instanceof Error) {
    // Clean up common error patterns
    let message = error.message || 'An unexpected error occurred'

    // Remove technical details that users don't need
    message = message.replace(/Request Arguments:[\s\S]*?Details:/, '')
    message = message.replace(/Cannot read properties of undefined.*?reading.*?'/g, 'Data loading error')
    message = message.replace(/viem@.*?Version:/g, '')
    message = message.replace(/0x[a-fA-F0-9]{40,}/g, '[Address]')
    message = message.replace(/0x[a-fA-F0-9]{64}/g, '[Transaction]')

    // Truncate very long messages
    if (message.length > 200) {
      message = message.substring(0, 200) + '...'
    }

    return message
  }

  // Handle non-Error objects to prevent [object Object]
  if (error && typeof error === 'object') {
    // Try to extract a meaningful message from common error object patterns
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error
    }
    if ('details' in error && typeof error.details === 'string') {
      return error.details
    }

    // If we can't find a string message, try to stringify safely
    try {
      const stringified = JSON.stringify(error)
      return stringified.length > 200 ? 'Complex error object' : stringified
    } catch {
      // If JSON.stringify fails, provide a fallback
      return 'Error object (unable to display details)'
    }
  }

  // Handle null, undefined, or other types
  return error ? String(error) : 'An unexpected error occurred'
}

/**
 * Enhanced error handling that replaces Alert components
 */
export const handleUIError = (
  error: Error | string,
  context?: string,
  onRetry?: () => void
) => {
  const cleanMessage = getCleanErrorMessage(error)
  const contextMessage = context ? `${context}: ${cleanMessage}` : cleanMessage
  
  return enhancedToast.error(contextMessage, {
    action: onRetry ? {
      label: 'Retry',
      onClick: onRetry
    } : undefined
  })
}

/**
 * Debug toast for development (only shows in development mode)
 */
export const debugToast = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    const debugMessage = data ? `${message}: ${JSON.stringify(data, null, 2)}` : message
    return enhancedToast.info(`[DEBUG] ${debugMessage}`, {
      duration: 5000 // Shorter duration for debug messages
    })
  }
}

// Export default toast for backward compatibility
export { toast }

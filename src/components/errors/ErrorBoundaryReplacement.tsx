'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { handlePlatformError, usePlatformErrorHandler, ErrorContext } from '@/lib/utils/platform-error-handler'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

// ================================================
// ERROR BOUNDARY REPLACEMENT COMPONENT
// ================================================

/**
 * Error Boundary Replacement Props
 */
export interface ErrorBoundaryReplacementProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: ErrorContext
  enableToastFallback?: boolean
  showUI?: boolean
}

/**
 * Error Boundary Replacement State
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

/**
 * Error Boundary Replacement Component
 *
 * This component replaces traditional React Error Boundaries with
 * context-aware toast notifications while maintaining error isolation.
 */
export class ErrorBoundaryReplacement extends Component<
  ErrorBoundaryReplacementProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryReplacementProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Handle error with platform-aware toast system
    handlePlatformError(error, {
      context: this.props.context || 'unknown',
      category: 'system',
      severity: 'high',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.state.retryCount
      },
      onRetry: this.handleRetry,
      showRetry: true
    })
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleNavigateHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback, showUI = false, enableToastFallback = true } = this.props

    if (hasError && error && errorInfo) {
      // If custom fallback is provided, use it
      if (fallback) {
        return fallback(error, errorInfo, this.handleRetry)
      }

      // If UI display is enabled, show error card
      if (showUI) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-lg">Something went wrong</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  We encountered an error and have notified our team.
                  You can try refreshing or going back home.
                </p>
                <div className="flex gap-2">
                  <Button onClick={this.handleRetry} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={this.handleNavigateHome} className="flex-1">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      // If toast fallback is enabled, just show children (error already handled by toast)
      if (enableToastFallback) {
        return <>{children}</>
      }

      // Fallback: return null to prevent infinite loops
      return null
    }

    return <>{children}</>
  }
}

// ================================================
// FUNCTIONAL COMPONENT VERSION
// ================================================

/**
 * Error Boundary Hook
 * Functional approach to error boundary replacement
 */
export function useErrorBoundary() {
  const { handleError, context } = usePlatformErrorHandler()
  const [error, setError] = React.useState<Error | null>(null)
  const [errorInfo, setErrorInfo] = React.useState<ErrorInfo | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)

  const captureError = React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    setError(error)
    if (errorInfo) setErrorInfo(errorInfo)

    handleError(error, {
      category: 'system',
      severity: 'high',
      metadata: {
        errorBoundary: true,
        componentStack: errorInfo?.componentStack,
        retryCount
      },
      showRetry: true,
      onRetry: () => {
        setError(null)
        setErrorInfo(null)
        setRetryCount(prev => prev + 1)
      }
    })
  }, [handleError, retryCount])

  const resetError = React.useCallback(() => {
    setError(null)
    setErrorInfo(null)
    setRetryCount(prev => prev + 1)
  }, [])

  React.useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      captureError(event.error || new Error(event.message), {
        componentStack: event.filename ? `at ${event.filename}:${event.lineno}:${event.colno}` : ''
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))
      captureError(error)
    }

    window.addEventListener('error', handleUnhandledError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleUnhandledError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [captureError])

  return {
    error,
    errorInfo,
    retryCount,
    captureError,
    resetError,
    hasError: !!error
  }
}

/**
 * Error Boundary Provider Component
 * Provides error boundary context to child components
 */
export function ErrorBoundaryProvider({
  children,
  context,
  enableToastFallback = true,
  showUI = false
}: {
  children: ReactNode
  context?: ErrorContext
  enableToastFallback?: boolean
  showUI?: boolean
}) {
  return (
    <ErrorBoundaryReplacement
      context={context}
      enableToastFallback={enableToastFallback}
      showUI={showUI}
    >
      {children}
    </ErrorBoundaryReplacement>
  )
}

// ================================================
// UTILITY COMPONENTS FOR COMMON ERROR SCENARIOS
// ================================================

/**
 * Async Operation Error Boundary
 * Specialized for handling async operation errors
 */
export function AsyncErrorBoundary({
  children,
  operation,
  fallback
}: {
  children: ReactNode
  operation: string
  fallback?: ReactNode
}) {
  const { handleError } = usePlatformErrorHandler()
  const [error, setError] = React.useState<Error | null>(null)

  const handleAsyncError = React.useCallback((error: Error) => {
    setError(error)
    handleError(error, {
      category: 'system',
      severity: 'medium',
      metadata: {
        operation,
        asyncError: true
      },
      showRetry: true,
      onRetry: () => setError(null)
    })
  }, [handleError, operation])

  React.useEffect(() => {
    // Override console.error for async operations
    const originalConsoleError = console.error
    console.error = (...args) => {
      const errorArg = args.find(arg => arg instanceof Error) as Error
      if (errorArg && operation && args.some(arg => String(arg).includes(operation))) {
        handleAsyncError(errorArg)
      }
      originalConsoleError.apply(console, args)
    }

    return () => {
      console.error = originalConsoleError
    }
  }, [handleAsyncError, operation])

  if (error && fallback) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Network Error Boundary
 * Specialized for handling network-related errors
 */
export function NetworkErrorBoundary({
  children,
  onNetworkError
}: {
  children: ReactNode
  onNetworkError?: () => void
}) {
  const { handleError } = usePlatformErrorHandler()

  React.useEffect(() => {
    const handleOnline = () => {
      handleError('Network connection restored', {
        category: 'network',
        severity: 'low',
        silent: true
      })
    }

    const handleOffline = () => {
      handleError('Network connection lost. Some features may be unavailable.', {
        category: 'network',
        severity: 'medium',
        metadata: {
          networkStatus: 'offline'
        },
        showRetry: true,
        onRetry: onNetworkError
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleError, onNetworkError])

  return <>{children}</>
}

// ================================================
// LEGACY COMPATIBILITY COMPONENTS
// ================================================

/**
 * MiniApp Error Boundary (Legacy Compatibility)
 * Maintains compatibility with existing MiniApp error boundaries
 */
export function MiniAppErrorBoundary({
  children,
  fallback,
  onError
}: {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}) {
  return (
    <ErrorBoundaryReplacement
      context="miniapp"
      enableToastFallback={true}
      showUI={false}
      onError={onError}
      fallback={fallback ? () => fallback : undefined}
    >
      {children}
    </ErrorBoundaryReplacement>
  )
}

/**
 * Web Error Boundary (Legacy Compatibility)
 * Maintains compatibility with existing web error boundaries
 */
export function WebErrorBoundary({
  children,
  fallback,
  onError
}: {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}) {
  return (
    <ErrorBoundaryReplacement
      context="web"
      enableToastFallback={true}
      showUI={false}
      onError={onError}
      fallback={fallback ? () => fallback : undefined}
    >
      {children}
    </ErrorBoundaryReplacement>
  )
}

/**
 * Mobile Error Boundary (Legacy Compatibility)
 * Maintains compatibility with existing mobile error boundaries
 */
export function MobileErrorBoundary({
  children,
  fallback,
  onError
}: {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}) {
  return (
    <ErrorBoundaryReplacement
      context="mobile"
      enableToastFallback={true}
      showUI={false}
      onError={onError}
      fallback={fallback ? () => fallback : undefined}
    >
      {children}
    </ErrorBoundaryReplacement>
  )
}

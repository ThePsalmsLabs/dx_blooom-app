'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlatformErrorHandler } from '@/lib/utils/platform-error-handler'
import { ErrorBoundaryProvider, useErrorBoundary } from './ErrorBoundaryReplacement'

/**
 * Demo Component for Error Handling
 * Shows how to use the new platform-aware error handling system
 */
export function ErrorHandlingDemo() {
  const { handleError, context, handleAsync } = usePlatformErrorHandler()

  const [isLoading, setIsLoading] = useState(false)

  // Simulate different types of errors
  const simulateNetworkError = () => {
    const networkError = new Error('Failed to connect to the network')
    handleError(networkError, {
      category: 'network',
      severity: 'medium',
      metadata: {
        operation: 'network_request',
        endpoint: '/api/content'
      },
      showRetry: true,
      onRetry: () => console.log('Retrying network request...')
    })
  }

  const simulateAuthError = () => {
    const authError = new Error('Authentication token expired')
    handleError(authError, {
      category: 'authentication',
      severity: 'high',
      showRetry: true,
      onRetry: () => console.log('Redirecting to login...')
    })
  }

  const simulateBlockchainError = () => {
    const blockchainError = new Error('Transaction reverted: insufficient funds')
    handleError(blockchainError, {
      category: 'blockchain',
      severity: 'high',
      metadata: {
        transactionHash: '0x1234567890abcdef',
        gasUsed: 21000
      },
      showRetry: true,
      onRetry: () => console.log('Retrying transaction...')
    })
  }

  const simulateAsyncError = async () => {
    setIsLoading(true)
    try {
      await handleAsync(
        async () => {
          // Simulate an async operation that fails
          await new Promise(resolve => setTimeout(resolve, 1000))
          throw new Error('Async operation failed')
        },
        {
          category: 'system',
          severity: 'medium',
          showRetry: true,
          onRetry: () => console.log('Retrying async operation...')
        }
      )
    } finally {
      setIsLoading(false)
    }
  }

  const simulateCriticalError = () => {
    const criticalError = new Error('Critical system failure')
    handleError(criticalError, {
      category: 'system',
      severity: 'critical',
      metadata: {
        systemComponent: 'payment_processor',
        impact: 'all_payments_blocked'
      }
    })
  }

  return (
    <ErrorBoundaryProvider context="web" enableToastFallback={true}>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Error Handling Demo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Current context: <span className="font-medium">{context}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={simulateNetworkError}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-medium">Network Error</span>
              <span className="text-xs opacity-70">Simulate connection issues</span>
            </Button>

            <Button
              onClick={simulateAuthError}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-medium">Auth Error</span>
              <span className="text-xs opacity-70">Simulate authentication failure</span>
            </Button>

            <Button
              onClick={simulateBlockchainError}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start"
            >
              <span className="font-medium">Blockchain Error</span>
              <span className="text-xs opacity-70">Simulate transaction failure</span>
            </Button>

            <Button
              onClick={simulateAsyncError}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start"
              disabled={isLoading}
            >
              <span className="font-medium">Async Error</span>
              <span className="text-xs opacity-70">
                {isLoading ? 'Loading...' : 'Simulate async failure'}
              </span>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={simulateCriticalError}
              variant="destructive"
              className="w-full"
            >
              Simulate Critical Error
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This will show a critical error toast with enhanced styling
            </p>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundaryProvider>
  )
}

/**
 * Error Boundary Test Component
 * Demonstrates the new error boundary replacement
 */
export function ErrorBoundaryTest() {
  const { captureError, hasError, resetError } = useErrorBoundary()

  const triggerError = () => {
    try {
      // This will trigger an error that gets caught by the error boundary
      throw new Error('Test error from component')
    } catch (error) {
      captureError(error as Error)
    }
  }

  const triggerAsyncError = async () => {
    try {
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Async test error')), 500)
      )
    } catch (error) {
      captureError(error as Error)
    }
  }

  if (hasError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Error Caught!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            The error boundary caught an error and showed a toast notification
            instead of blocking the UI.
          </p>
          <Button onClick={resetError} className="w-full">
            Reset Error Boundary
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Error Boundary Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={triggerError} variant="outline" className="w-full">
          Trigger Sync Error
        </Button>
        <Button onClick={triggerAsyncError} variant="outline" className="w-full">
          Trigger Async Error
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          These errors will be caught by the error boundary and shown as toasts
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Cross-Platform Error Demo
 * Shows how errors are handled differently across contexts
 */
export function CrossPlatformErrorDemo() {
  const { handleError, context } = usePlatformErrorHandler()

  const testContextAwareness = () => {
    handleError('This error adapts to the current platform context', {
      category: 'system',
      severity: 'low',
      metadata: {
        context,
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight }
      }
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Cross-Platform Error Demo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Detected context: <span className="font-medium">{context}</span>
        </p>
      </CardHeader>
      <CardContent>
        <Button onClick={testContextAwareness} className="w-full">
          Test Context Awareness
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          The error message will adapt based on your current platform
        </p>
      </CardContent>
    </Card>
  )
}

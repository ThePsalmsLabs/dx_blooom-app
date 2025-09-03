/**
 * MiniApp Error Boundary - Comprehensive Error Handling
 * File: src/components/error/MiniAppErrorBoundary.tsx
 *
 * Advanced error boundary system specifically designed for MiniApp environments
 * with sophisticated recovery strategies, user-friendly messaging, and analytics.
 */

'use client'

import React, { Component, ReactNode, useState, useCallback, ErrorInfo } from 'react'
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  Smartphone,
  ExternalLink,
  Bug,
  Shield
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ================================================
// ERROR TYPES AND INTERFACES
// ================================================

interface MiniAppErrorInfo {
  readonly error: Error
  readonly errorInfo?: ErrorInfo
  readonly timestamp: Date
  readonly context: {
    readonly environment: 'miniapp' | 'web' | 'unknown'
    readonly userAgent: string
    readonly url: string
    readonly capabilities?: {
      wallet: { canConnect: boolean; canBatchTransactions: boolean; supportedChains: number[] }
      social: { canShare: boolean; canCompose: boolean; canAccessSocialGraph: boolean }
      platform: { canDeepLink: boolean; canAccessClipboard: boolean; canAccessCamera: boolean }
    }
    readonly socialContext?: {
      isAvailable: boolean
      userProfile: { fid?: number; username?: string | null; displayName?: string | null; isVerified?: boolean } | null
      canShare: boolean
      canCompose: boolean
      trustScore: number
    }
  }
  readonly recoveryAttempts: number
  readonly lastRecoveryAttempt?: Date
}

interface RecoveryStrategy {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly action: () => Promise<void>
  readonly priority: number
  readonly requiresNetwork: boolean
  readonly requiresWallet: boolean
  readonly estimatedTime: number // seconds
}

interface ErrorBoundaryState {
  readonly hasError: boolean
  readonly errorInfo: MiniAppErrorInfo | null
  readonly isRecovering: boolean
  readonly recoveryProgress: number
  readonly recoveryAttempts: number
  readonly lastRecoveryStrategy?: string
}

// ================================================
// RECOVERY STRATEGIES
// ================================================

const RECOVERY_STRATEGIES: readonly RecoveryStrategy[] = [
  {
    id: 'reload_page',
    name: 'Reload Page',
    description: 'Refresh the page to reset the application state',
    icon: RefreshCw,
    action: async () => {
      window.location.reload()
    },
    priority: 1,
    requiresNetwork: false,
    requiresWallet: false,
    estimatedTime: 2
  },
  {
    id: 'clear_cache',
    name: 'Clear Cache',
    description: 'Clear browser cache and reload',
    icon: Shield,
    action: async () => {
      // Clear local storage and session storage
      localStorage.clear()
      sessionStorage.clear()

      // Clear service worker cache if available
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      }

      window.location.reload()
    },
    priority: 2,
    requiresNetwork: false,
    requiresWallet: false,
    estimatedTime: 3
  },
  {
    id: 'network_check',
    name: 'Check Network',
    description: 'Verify network connectivity and retry',
    icon: Wifi,
    action: async () => {
      // Check network connectivity
      if (!navigator.onLine) {
        throw new Error('No network connection')
      }

      // Test network by making a simple request
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })

      if (!response.ok) {
        throw new Error('Network request failed')
      }
    },
    priority: 3,
    requiresNetwork: true,
    requiresWallet: false,
    estimatedTime: 5
  },
  {
    id: 'fallback_mode',
    name: 'Fallback Mode',
    description: 'Switch to simplified MiniApp mode',
    icon: Smartphone,
    action: async () => {
      // Redirect to web version
      const currentPath = window.location.pathname.replace('/mini', '')
      window.location.href = currentPath || '/'
    },
    priority: 4,
    requiresNetwork: true,
    requiresWallet: false,
    estimatedTime: 1
  },
  {
    id: 'report_error',
    name: 'Report Issue',
    description: 'Send error report for investigation',
    icon: Bug,
    action: async () => {
      // Send error report to analytics
      console.log('Error report would be sent here')
      // In a real implementation, this would send to your error reporting service
    },
    priority: 5,
    requiresNetwork: true,
    requiresWallet: false,
    estimatedTime: 2
  }
]

// ================================================
// ERROR ANALYSIS UTILITIES
// ================================================

/**
 * Analyze error to determine likely cause and suggest recovery strategies
 */
function analyzeError(error: Error, context: MiniAppErrorInfo['context']): {
  likelyCause: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestedStrategies: readonly RecoveryStrategy[]
} {
  const errorMessage = error.message.toLowerCase()
  const userAgent = context.userAgent.toLowerCase()

  let likelyCause = 'Unknown error'
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  let suggestedStrategies = RECOVERY_STRATEGIES

  // Network-related errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    likelyCause = 'Network connectivity issue'
    severity = 'medium'
    suggestedStrategies = RECOVERY_STRATEGIES.filter(s => !s.requiresNetwork || s.id === 'network_check')
  }

  // SDK-related errors
  else if (errorMessage.includes('sdk') || errorMessage.includes('farcaster')) {
    likelyCause = 'MiniApp SDK initialization failed'
    severity = 'high'
    suggestedStrategies = RECOVERY_STRATEGIES.filter(s =>
      s.id === 'reload_page' || s.id === 'fallback_mode' || s.id === 'clear_cache'
    )
  }

  // Wallet-related errors
  else if (errorMessage.includes('wallet') || errorMessage.includes('connect')) {
    likelyCause = 'Wallet connection issue'
    severity = 'medium'
    suggestedStrategies = RECOVERY_STRATEGIES.filter(s => !s.requiresWallet)
  }

  // Memory/performance errors
  else if (errorMessage.includes('memory') || errorMessage.includes('performance')) {
    likelyCause = 'Performance or memory issue'
    severity = 'medium'
    suggestedStrategies = RECOVERY_STRATEGIES.filter(s =>
      s.id === 'reload_page' || s.id === 'clear_cache'
    )
  }

  // Context/environment errors
  else if (context.environment === 'miniapp' && !userAgent.includes('farcaster')) {
    likelyCause = 'MiniApp context detection issue'
    severity = 'low'
    suggestedStrategies = RECOVERY_STRATEGIES.filter(s => s.id === 'fallback_mode')
  }

  return {
    likelyCause,
    severity,
    suggestedStrategies
  }
}

/**
 * Get user-friendly error message
 */
function getUserFriendlyMessage(error: Error, analysis: ReturnType<typeof analyzeError>): string {
  const baseMessages = {
    low: 'Something minor went wrong, but you can continue.',
    medium: 'There was an issue, but we can fix it quickly.',
    high: 'A more serious issue occurred, but we have solutions.',
    critical: 'A critical error occurred. Please try the recovery options.'
  }

  return `${baseMessages[analysis.severity]} ${analysis.likelyCause.toLowerCase()}.`
}

// ================================================
// RECOVERY COMPONENT
// ================================================

interface RecoveryActionsProps {
  strategies: readonly RecoveryStrategy[]
  onStrategySelect: (strategy: RecoveryStrategy) => void
  isRecovering: boolean
  recoveryProgress: number
}

function RecoveryActions({
  strategies,
  onStrategySelect,
  isRecovering,
  recoveryProgress
}: RecoveryActionsProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<RecoveryStrategy | null>(null)

  const handleStrategySelect = useCallback((strategy: RecoveryStrategy) => {
    setSelectedStrategy(strategy)
    onStrategySelect(strategy)
  }, [onStrategySelect])

  if (isRecovering && selectedStrategy) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <selectedStrategy.icon className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">{selectedStrategy.name}</h4>
              <p className="text-sm text-blue-700">{selectedStrategy.description}</p>
            </div>
          </div>
          <Progress value={recoveryProgress} className="h-2" />
          <p className="text-xs text-blue-600 mt-2">
            Attempting recovery... {recoveryProgress}%
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Recovery Options</h4>
      <div className="grid gap-2">
        {strategies.slice(0, 3).map((strategy) => (
          <Button
            key={strategy.id}
            variant="outline"
            onClick={() => handleStrategySelect(strategy)}
            className="justify-start h-auto p-3"
            disabled={isRecovering}
          >
            <strategy.icon className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">{strategy.name}</div>
              <div className="text-xs text-muted-foreground">{strategy.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}

// ================================================
// ERROR DISPLAY COMPONENT
// ================================================

interface ErrorDisplayProps {
  errorInfo: MiniAppErrorInfo
  onRetry: () => void
  onFallback: () => void
  recoveryActions: ReactNode
}

function ErrorDisplay({ errorInfo, onRetry, onFallback, recoveryActions }: ErrorDisplayProps) {
  const analysis = analyzeError(errorInfo.error, errorInfo.context)
  const userMessage = getUserFriendlyMessage(errorInfo.error, analysis)

  const severityColors = {
    low: 'border-green-200 bg-green-50',
    medium: 'border-yellow-200 bg-yellow-50',
    high: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50'
  }

  const severityIcons = {
    low: AlertTriangle,
    medium: AlertTriangle,
    high: AlertTriangle,
    critical: AlertTriangle
  }

  const SeverityIcon = severityIcons[analysis.severity]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className={cn('w-full max-w-2xl', severityColors[analysis.severity])}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-muted">
            <SeverityIcon className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg">MiniApp Error</CardTitle>
          <Badge variant="outline" className="mt-2">
            {analysis.severity.toUpperCase()}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          <Alert>
            <SeverityIcon className="h-4 w-4" />
            <AlertDescription>{userMessage}</AlertDescription>
          </Alert>

          {/* Error Details */}
          <div className="space-y-2">
            <h4 className="font-medium">What happened:</h4>
            <p className="text-sm text-muted-foreground">{analysis.likelyCause}</p>
          </div>

          {/* Context Information */}
          <div className="space-y-2">
            <h4 className="font-medium">Environment:</h4>
            <div className="text-sm text-muted-foreground">
              <div>Platform: {errorInfo.context.environment}</div>
              <div>Time: {errorInfo.timestamp.toLocaleString()}</div>
              <div>Recovery attempts: {errorInfo.recoveryAttempts}</div>
            </div>
          </div>

          {/* Recovery Actions */}
          {recoveryActions}

          {/* Fallback Options */}
          <div className="flex gap-2">
            <Button onClick={onRetry} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={onFallback} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Web Version
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// MAIN ERROR BOUNDARY CLASS COMPONENT
// ================================================

interface MiniAppErrorBoundaryProps {
  children: ReactNode
  onError?: (error: Error, errorInfo: MiniAppErrorInfo) => void
  enableAnalytics?: boolean
  showDetails?: boolean
  maxRecoveryAttempts?: number
}

class MiniAppErrorBoundary extends Component<MiniAppErrorBoundaryProps, ErrorBoundaryState> {
  private recoveryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: MiniAppErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      errorInfo: null,
      isRecovering: false,
      recoveryProgress: 0,
      recoveryAttempts: 0
    }
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorInfo: null // Will be set in componentDidCatch
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails: MiniAppErrorInfo = {
      error,
      errorInfo,
      timestamp: new Date(),
      context: {
        environment: this.detectEnvironment(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        capabilities: this.getCapabilities(),
        socialContext: this.getSocialContext()
      },
      recoveryAttempts: this.state.recoveryAttempts
    }

    this.setState({
      errorInfo: errorDetails
    })

    // Report error
    this.props.onError?.(error, errorDetails)

    // Send to analytics if enabled
    if (this.props.enableAnalytics && typeof window !== 'undefined') {
      this.reportErrorToAnalytics(errorDetails)
    }

    console.error('MiniApp Error Boundary caught an error:', error, errorInfo)
  }

  componentWillUnmount() {
    if (this.recoveryTimeoutId) {
      clearTimeout(this.recoveryTimeoutId)
    }
  }

  // ================================================
  // UTILITY METHODS
  // ================================================

  private detectEnvironment(): 'miniapp' | 'web' | 'unknown' {
    if (typeof window === 'undefined') return 'unknown'

    const userAgent = navigator.userAgent.toLowerCase()
    const url = window.location

    if (userAgent.includes('farcaster') ||
        userAgent.includes('warpcast') ||
        url.pathname.startsWith('/mini') ||
        new URL(window.location.href).searchParams.get('miniApp') === 'true' ||
        window.parent !== window) {
      return 'miniapp'
    }

    return 'web'
  }

  private getCapabilities() {
    // This would integrate with your capability detection system
    return {
      wallet: {
        canConnect: typeof window !== 'undefined' && window.ethereum !== undefined,
        canBatchTransactions: false, // Would need to check wallet capabilities
        supportedChains: [8453, 84532] // Base networks
      },
      social: {
        canShare: this.detectEnvironment() === 'miniapp',
        canCompose: this.detectEnvironment() === 'miniapp',
        canAccessSocialGraph: this.detectEnvironment() === 'miniapp'
      },
      platform: {
        canDeepLink: typeof window !== 'undefined' &&
          (window.location.protocol === 'https:' || window.location.hostname === 'localhost'),
        canAccessClipboard: typeof navigator !== 'undefined' && 'clipboard' in navigator,
        canAccessCamera: typeof navigator !== 'undefined' &&
          'mediaDevices' in navigator &&
          'getUserMedia' in navigator.mediaDevices
      }
    }
  }

  private getSocialContext() {
    // This would integrate with your social context system
    const isMiniApp = this.detectEnvironment() === 'miniapp'

    return {
      isAvailable: isMiniApp,
      userProfile: null, // Would be populated if user data is available
      canShare: isMiniApp,
      canCompose: isMiniApp,
      trustScore: 0 // Default trust score
    }
  }

  private reportErrorToAnalytics(errorInfo: MiniAppErrorInfo) {
    // Send error to your analytics service
    try {
      const analyticsPayload = {
        error: {
          message: errorInfo.error.message,
          stack: errorInfo.error.stack,
          name: errorInfo.error.name
        },
        context: errorInfo.context,
        timestamp: errorInfo.timestamp.toISOString(),
        recoveryAttempts: errorInfo.recoveryAttempts,
        userAgent: errorInfo.context.userAgent,
        url: errorInfo.context.url
      }

      // In a real implementation, send to your error tracking service
      console.log('Error reported to analytics:', analyticsPayload)
    } catch (analyticsError) {
      console.warn('Failed to report error to analytics:', analyticsError)
    }
  }

  // ================================================
  // RECOVERY METHODS
  // ================================================

  private handleRecovery = async (strategy: RecoveryStrategy) => {
    if (this.state.isRecovering) return

    this.setState({
      isRecovering: true,
      recoveryProgress: 0,
      lastRecoveryStrategy: strategy.id,
      recoveryAttempts: this.state.recoveryAttempts + 1
    })

    try {
      // Progress simulation
      const progressSteps = 10
      for (let i = 0; i <= progressSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, strategy.estimatedTime * 100 / progressSteps))
        this.setState({ recoveryProgress: (i / progressSteps) * 100 })
      }

      // Execute recovery strategy
      await strategy.action()

    } catch (recoveryError) {
      console.error('Recovery strategy failed:', recoveryError)

      // If recovery fails, reset state
      this.setState({
        isRecovering: false,
        recoveryProgress: 0
      })
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      errorInfo: null,
      isRecovering: false,
      recoveryProgress: 0
    })
  }

  private handleFallback = () => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname.replace('/mini', '')
      window.location.href = currentPath || '/'
    }
  }

  // ================================================
  // RENDER METHOD
  // ================================================

  render() {
    if (this.state.hasError && this.state.errorInfo) {
      const analysis = analyzeError(this.state.errorInfo.error, this.state.errorInfo.context)
      const maxAttempts = this.props.maxRecoveryAttempts || 3

      return (
        <ErrorDisplay
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onFallback={this.handleFallback}
          recoveryActions={
            this.state.recoveryAttempts < maxAttempts ? (
              <RecoveryActions
                strategies={analysis.suggestedStrategies}
                onStrategySelect={this.handleRecovery}
                isRecovering={this.state.isRecovering}
                recoveryProgress={this.state.recoveryProgress}
              />
            ) : (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Maximum recovery attempts reached. Please try refreshing the page or contact support.
                </AlertDescription>
              </Alert>
            )
          }
        />
      )
    }

    return this.props.children
  }
}

// ================================================
// FUNCTIONAL WRAPPER FOR HOOKS
// ================================================

interface MiniAppErrorBoundaryWrapperProps extends MiniAppErrorBoundaryProps {
  children: ReactNode
}

export function MiniAppErrorBoundaryWrapper({
  children,
  ...props
}: MiniAppErrorBoundaryWrapperProps) {
  return (
    <MiniAppErrorBoundary {...props}>
      {children}
    </MiniAppErrorBoundary>
  )
}

// ================================================
// HOOK FOR ERROR REPORTING
// ================================================

export function useErrorReporting() {
  const [isReporting, setIsReporting] = useState(false)

  const reportError = useCallback(async (error: Error, context?: Record<string, unknown>) => {
    setIsReporting(true)

    try {
      const errorReport = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        context: context || {},
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      }

      // Send to your error reporting service
      console.log('Manual error report:', errorReport)

      // In a real implementation:
      // await fetch('/api/errors/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // })

    } catch (reportError) {
      console.error('Failed to report error:', reportError)
    } finally {
      setIsReporting(false)
    }
  }, [])

  return {
    reportError,
    isReporting
  }
}

// ================================================
// EXPORTS
// ================================================

export default MiniAppErrorBoundary
export type { MiniAppErrorInfo, RecoveryStrategy }

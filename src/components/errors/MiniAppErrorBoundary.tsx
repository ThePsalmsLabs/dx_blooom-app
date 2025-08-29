/**
 * MiniApp Error Boundary System - Component 3: Phase 1 Foundation
 * File: src/components/errors/MiniAppErrorBoundary.tsx
 * 
 * This component extends existing error handling patterns with MiniApp-specific
 * error boundaries that provide contextual error recovery and intelligent fallback
 * experiences. It integrates with Components 1 and 2 to provide context-aware
 * error handling that understands the capabilities and limitations of each environment.
 * 
 * Architecture Integration:
 * - Builds on Enhanced MiniAppProvider (Component 1) for context awareness
 * - Uses Compatibility Testing (Component 2) for capability-based recovery
 * - Integrates with existing design token system for consistent error UI
 * - Provides foundation for Components 4 and 5 error handling needs
 * - Maintains compatibility with existing error handling patterns
 * - Supports progressive enhancement and graceful degradation
 * 
 * Key Features:
 * - Context-aware error classification and recovery strategies
 * - Intelligent fallback recommendations based on available capabilities
 * - User-friendly error messages tailored to social commerce contexts
 * - Performance monitoring and error analytics for continuous improvement
 * - Accessibility-first error communication with screen reader support
 * - Integration with social platform error reporting when appropriate
 */

'use client'

import React, { 
  Component, 
  ReactNode, 
  ErrorInfo, 
  useState, 
  useCallback, 
  useEffect,
  useMemo 
} from 'react'
import { RefreshCw, AlertTriangle, Home, ArrowLeft, ExternalLink, Wifi, Zap, AlertCircle } from 'lucide-react'

// Import design system components for consistent UI
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress
} from '@/components/ui'

// Import our previous components for integration
import { useMiniApp, type EnhancedMiniAppContextValue } from '@/contexts/MiniAppProvider'
import { 
  useCompatibilityTesting, 
  type CompatibilityTestSuiteResult
} from '@/utils/miniapp/compatibility'

// ================================================
// TYPE DEFINITIONS FOR ERROR BOUNDARY SYSTEM
// ================================================

/**
 * Error Categories for MiniApp Contexts
 * These categories help us understand what type of error occurred and how to respond
 */
export type MiniAppErrorCategory = 
  | 'sdk_initialization'    // Problems with MiniApp SDK setup
  | 'social_integration'    // Issues with social platform features
  | 'blockchain_connectivity' // Web3 provider or network problems
  | 'permission_denied'     // User permission or access issues
  | 'network_connectivity'  // General network or connectivity problems
  | 'compatibility_failure' // Feature not supported in current environment
  | 'user_interaction'      // User-triggered errors that need gentle handling
  | 'system_error'          // Unexpected system-level errors
  | 'render_error'          // React rendering or component errors

/**
 * Error Severity Levels
 * Determines how aggressively we should handle the error
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Recovery Action Types
 * Different types of actions users can take to recover from errors
 */
export type RecoveryActionType = 
  | 'retry'           // Try the same action again
  | 'fallback'        // Use an alternative approach
  | 'navigate'        // Go to a different part of the app
  | 'refresh'         // Refresh the page or context
  | 'contact_support' // Get help from support
  | 'external_link'   // Open external resource for help

/**
 * Recovery Action Definition
 * Describes a specific action users can take to recover from an error
 */
export interface RecoveryAction {
  readonly type: RecoveryActionType
  readonly label: string
  readonly description: string
  readonly action: () => void | Promise<void>
  readonly icon?: React.ComponentType<{ className?: string }>
  readonly isPrimary?: boolean
  readonly requiresPermission?: boolean
  readonly estimatedTime?: string
}

/**
 * Enhanced Error Information
 * Comprehensive error details that enable intelligent recovery
 */
export interface EnhancedErrorInfo extends ErrorInfo {
  readonly errorId: string
  readonly timestamp: number
  readonly category: MiniAppErrorCategory
  readonly severity: ErrorSeverity
  readonly context: {
    readonly miniAppContext?: EnhancedMiniAppContextValue
    readonly compatibilityInfo?: CompatibilityTestSuiteResult
    readonly userAgent: string
    readonly url: string
    readonly viewport: { width: number; height: number }
  }
  readonly userMessage: string
  readonly technicalMessage: string
  readonly recoveryActions: readonly RecoveryAction[]
  readonly fallbackStrategies: readonly string[]
  readonly preventable: boolean
  readonly reportable: boolean
}

/**
 * Error Boundary Props
 * Configuration options for the MiniApp Error Boundary
 */
export interface MiniAppErrorBoundaryProps {
  readonly children: ReactNode
  readonly fallback?: (error: EnhancedErrorInfo) => ReactNode
  readonly onError?: (error: EnhancedErrorInfo) => void
  readonly enableErrorReporting?: boolean
  readonly enablePerformanceTracking?: boolean
  readonly showTechnicalDetails?: boolean
  readonly maxRetryAttempts?: number
  readonly retryDelay?: number
  readonly className?: string
}

/**
 * Error Boundary State
 * Internal state management for the error boundary
 */
interface ErrorBoundaryState {
  readonly hasError: boolean
  readonly error: Error | null
  readonly enhancedErrorInfo: EnhancedErrorInfo | null
  readonly retryAttempts: number
  readonly isRetrying: boolean
  readonly showTechnicalDetails: boolean
}

// ================================================
// ERROR CLASSIFICATION AND ANALYSIS UTILITIES
// ================================================

/**
 * Classify Error Category
 * Analyzes an error to determine its category for appropriate handling
 */
function classifyError(
  error: Error, 
  errorInfo: ErrorInfo,
  miniAppContext?: EnhancedMiniAppContextValue
): MiniAppErrorCategory {
  const errorMessage = error.message.toLowerCase()
  const errorStack = error.stack?.toLowerCase() || ''
  
  // SDK-related errors - problems with MiniApp initialization or SDK calls
  if (errorMessage.includes('sdk') || 
      errorMessage.includes('miniapp') ||
      errorMessage.includes('farcaster') ||
      errorStack.includes('@farcaster/miniapp-sdk')) {
    return 'sdk_initialization'
  }
  
  // Social integration errors - problems with social platform features
  if (errorMessage.includes('social') ||
      errorMessage.includes('sharing') ||
      errorMessage.includes('cast') ||
      errorMessage.includes('context') && miniAppContext?.environment?.isMiniApp) {
    return 'social_integration'
  }
  
  // Blockchain connectivity errors - Web3 provider or network issues
  if (errorMessage.includes('ethereum') ||
      errorMessage.includes('web3') ||
      errorMessage.includes('wallet') ||
      errorMessage.includes('transaction') ||
      errorMessage.includes('chain') ||
      errorMessage.includes('rpc')) {
    return 'blockchain_connectivity'
  }
  
  // Permission errors - user denied access or insufficient permissions
  if (errorMessage.includes('permission') ||
      errorMessage.includes('denied') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      error.name === 'NotAllowedError') {
    return 'permission_denied'
  }
  
  // Network connectivity errors - general connectivity problems
  if (errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError') {
    return 'network_connectivity'
  }
  
  // Compatibility errors - features not supported in current environment
  if (errorMessage.includes('not supported') ||
      errorMessage.includes('compatibility') ||
      errorMessage.includes('unavailable') ||
      errorMessage.includes('method not found')) {
    return 'compatibility_failure'
  }
  
  // React rendering errors - component or rendering issues
  if (errorInfo.componentStack ||
      errorMessage.includes('render') ||
      errorMessage.includes('component') ||
      errorStack.includes('react')) {
    return 'render_error'
  }
  
  // User interaction errors - user-triggered issues that need gentle handling
  if (errorMessage.includes('user') ||
      errorMessage.includes('input') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('cancel')) {
    return 'user_interaction'
  }
  
  // Default to system error for unclassified errors
  return 'system_error'
}

/**
 * Determine Error Severity
 * Analyzes error impact to determine how aggressively to handle it
 */
function determineErrorSeverity(
  category: MiniAppErrorCategory,
  error: Error,
  miniAppContext?: EnhancedMiniAppContextValue
): ErrorSeverity {
  // Critical errors that completely break the user experience
  if (category === 'system_error' || 
      category === 'render_error' ||
      (category === 'sdk_initialization' && miniAppContext?.environment?.isMiniApp)) {
    return 'critical'
  }
  
  // High severity errors that significantly impact functionality
  if (category === 'blockchain_connectivity' ||
      category === 'permission_denied' ||
      (category === 'social_integration' && miniAppContext?.enhancedUser)) {
    return 'high'
  }
  
  // Medium severity errors that impact some features but allow core functionality
  if (category === 'compatibility_failure' ||
      category === 'network_connectivity') {
    return 'medium'
  }
  
  // Low severity errors that are minor or user-recoverable
  return 'low'
}

/**
 * Generate Recovery Actions
 * Creates context-appropriate actions users can take to recover from errors
 */
function generateRecoveryActions(
  category: MiniAppErrorCategory,
  severity: ErrorSeverity,
  miniAppContext?: EnhancedMiniAppContextValue,
  compatibilityInfo?: CompatibilityTestSuiteResult,
  onRetry?: () => void,
  onNavigateHome?: () => void,
  onRefresh?: () => void
): RecoveryAction[] {
  const actions: RecoveryAction[] = []
  
  // Always provide a retry option for non-critical errors
  if (severity !== 'critical' && onRetry) {
    actions.push({
      type: 'retry',
      label: 'Try Again',
      description: 'Attempt the operation again',
      action: onRetry,
      icon: RefreshCw,
      isPrimary: true,
      estimatedTime: '5 seconds'
    })
  }
  
  // Provide refresh option for initialization and network errors
  if ((category === 'sdk_initialization' || 
       category === 'network_connectivity' ||
       category === 'compatibility_failure') && onRefresh) {
    actions.push({
      type: 'refresh',
      label: 'Refresh Page',
      description: 'Reload the app to reset connections',
      action: onRefresh,
      icon: RefreshCw,
      isPrimary: severity === 'critical',
      estimatedTime: '10 seconds'
    })
  }
  
  // Provide navigation options for severe errors
  if (severity === 'high' || severity === 'critical') {
    if (onNavigateHome) {
      actions.push({
        type: 'navigate',
        label: 'Go Home',
        description: 'Return to the main page',
        action: onNavigateHome,
        icon: Home,
        isPrimary: false,
        estimatedTime: '2 seconds'
      })
    }
  }
  
  // Provide fallback options based on compatibility info
  if (category === 'blockchain_connectivity' && 
      compatibilityInfo?.summary.blockchainSupport === false) {
    actions.push({
      type: 'fallback',
      label: 'Use Read-Only Mode',
      description: 'Browse content without wallet connection',
      action: () => {
        // This would trigger a mode switch in the actual implementation
        console.log('Switching to read-only mode')
      },
      icon: ArrowLeft,
      isPrimary: false,
      estimatedTime: 'Immediate'
    })
  }
  
  // Provide social platform specific options
  if (category === 'social_integration' && miniAppContext?.environment?.isMiniApp) {
    actions.push({
      type: 'external_link',
      label: 'Open in Browser',
      description: 'Use the full web version',
      action: () => {
        const webUrl = window.location.href.replace('/mini', '')
        window.open(webUrl, '_blank')
      },
      icon: ExternalLink,
      isPrimary: false,
      estimatedTime: '5 seconds'
    })
  }
  
  // Provide support contact for critical errors
  if (severity === 'critical') {
    actions.push({
      type: 'contact_support',
      label: 'Get Help',
      description: 'Contact support for assistance',
      action: () => {
        // This would open support channel in actual implementation
        console.log('Opening support channel')
      },
      icon: ExternalLink,
      isPrimary: false,
      requiresPermission: false,
      estimatedTime: 'Variable'
    })
  }
  
  return actions
}

/**
 * Generate User-Friendly Error Message
 * Creates clear, actionable error messages based on error category and context
 */
function generateUserMessage(
  category: MiniAppErrorCategory,
  severity: ErrorSeverity,
  miniAppContext?: EnhancedMiniAppContextValue
): string {
  const contextPrefix = miniAppContext?.environment?.isMiniApp ? 'In this social context, ' : ''
  
  switch (category) {
    case 'sdk_initialization':
      return `${contextPrefix}we're having trouble connecting to social features. This might affect sharing and social interactions.`
      
    case 'social_integration':
      return `${contextPrefix}some social features aren't working properly. You can still browse and purchase content normally.`
      
    case 'blockchain_connectivity':
      if (severity === 'critical') {
        return `${contextPrefix}we can't connect to your wallet right now. You can browse content, but purchases aren't available until we reconnect.`
      }
      return `${contextPrefix}your wallet connection seems unstable. Some transactions might take longer than usual.`
      
    case 'permission_denied':
      return `${contextPrefix}we need additional permissions to provide the full experience. You can grant these in your browser settings.`
      
    case 'network_connectivity':
      return `${contextPrefix}your connection seems slow or unstable. Some features might load more slowly than usual.`
      
    case 'compatibility_failure':
      return `${contextPrefix}some advanced features aren't available in your current environment, but all core functionality works normally.`
      
    case 'user_interaction':
      return `${contextPrefix}there was an issue with your last action. Please check your input and try again.`
      
    case 'render_error':
      return `${contextPrefix}we encountered a display issue. Refreshing the page should resolve this.`
      
    case 'system_error':
    default:
      if (severity === 'critical') {
        return `${contextPrefix}we encountered an unexpected issue. We're working to resolve this quickly.`
      }
      return `${contextPrefix}something didn't work as expected, but you should be able to continue normally.`
  }
}

// ================================================
// ERROR BOUNDARY CLASS COMPONENT
// ================================================

/**
 * MiniApp Error Boundary Class Component
 * Handles JavaScript errors with context-aware recovery strategies
 */
class MiniAppErrorBoundaryClass extends Component<
  MiniAppErrorBoundaryProps & {
    miniAppContext?: EnhancedMiniAppContextValue
    compatibilityInfo?: CompatibilityTestSuiteResult
  },
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null
  
  constructor(props: MiniAppErrorBoundaryProps & {
    miniAppContext?: EnhancedMiniAppContextValue
    compatibilityInfo?: CompatibilityTestSuiteResult
  }) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      enhancedErrorInfo: null,
      retryAttempts: 0,
      isRetrying: false,
      showTechnicalDetails: props.showTechnicalDetails || false
    }
  }
  
  /**
   * Static method to derive state from error
   * This is called when an error is caught by the boundary
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }
  
  /**
   * Component did catch - handles the error and creates enhanced error info
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { miniAppContext, compatibilityInfo, onError } = this.props
    
    // Generate unique error ID for tracking
    const errorId = `miniapp-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Classify and analyze the error
    const category = classifyError(error, errorInfo, miniAppContext)
    const severity = determineErrorSeverity(category, error, miniAppContext)
    
    // Create enhanced error information
    const enhancedErrorInfo: EnhancedErrorInfo = {
      ...errorInfo,
      errorId,
      timestamp: Date.now(),
      category,
      severity,
      context: {
        miniAppContext,
        compatibilityInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      userMessage: generateUserMessage(category, severity, miniAppContext),
      technicalMessage: `${error.name}: ${error.message}`,
      recoveryActions: generateRecoveryActions(
        category,
        severity,
        miniAppContext,
        compatibilityInfo,
        this.handleRetry,
        this.handleNavigateHome,
        this.handleRefresh
      ),
      fallbackStrategies: compatibilityInfo?.fallbackStrategies || [],
      preventable: category === 'user_interaction' || category === 'permission_denied',
      reportable: severity === 'high' || severity === 'critical'
    }
    
    // Update state with enhanced error info
    this.setState({ enhancedErrorInfo })
    
    // Call error callback if provided
    onError?.(enhancedErrorInfo)
    
    // Log error for debugging (would integrate with proper logging service in production)
    console.error('MiniApp Error Boundary caught error:', {
      error,
      errorInfo,
      enhancedErrorInfo
    })
    
    // Report error if enabled and appropriate
    if (this.props.enableErrorReporting && enhancedErrorInfo.reportable) {
      this.reportError(enhancedErrorInfo)
    }
  }
  
  /**
   * Handle retry action
   */
  handleRetry = async () => {
    const { maxRetryAttempts = 3, retryDelay = 1000 } = this.props
    const { retryAttempts } = this.state
    
    if (retryAttempts >= maxRetryAttempts) {
      console.warn('Maximum retry attempts reached')
      return
    }
    
    this.setState({ 
      isRetrying: true,
      retryAttempts: retryAttempts + 1
    })
    
    // Wait for specified delay before retrying
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        enhancedErrorInfo: null,
        isRetrying: false
      })
    }, retryDelay)
  }
  
  /**
   * Handle navigation to home
   */
  handleNavigateHome = () => {
    // This would integrate with your navigation system
    window.location.href = '/'
  }
  
  /**
   * Handle page refresh
   */
  handleRefresh = () => {
    window.location.reload()
  }
  
  /**
   * Handle technical details toggle
   */
  handleToggleTechnicalDetails = () => {
    this.setState(prev => ({
      showTechnicalDetails: !prev.showTechnicalDetails
    }))
  }
  
  /**
   * Report error to external service
   * This would integrate with your error reporting service in production
   */
  reportError = (errorInfo: EnhancedErrorInfo) => {
    // Example integration point for error reporting service
    console.log('Reporting error to external service:', errorInfo)
    
    // In production, this might look like:
    // errorReportingService.report({
    //   errorId: errorInfo.errorId,
    //   category: errorInfo.category,
    //   severity: errorInfo.severity,
    //   context: errorInfo.context,
    //   userMessage: errorInfo.userMessage,
    //   technicalMessage: errorInfo.technicalMessage
    // })
  }
  
  /**
   * Cleanup on unmount
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }
  
  /**
   * Render error UI or children
   */
  render() {
    const { hasError, enhancedErrorInfo, isRetrying, showTechnicalDetails } = this.state
    const { children, fallback, className } = this.props
    
    if (!hasError) {
      return children
    }
    
    // Use custom fallback if provided
    if (fallback && enhancedErrorInfo) {
      return fallback(enhancedErrorInfo)
    }
    
    // Default error UI with context-aware messaging
    return (
      <div className={`miniapp-error-boundary ${className || ''}`}>
        <DefaultErrorUI
          errorInfo={enhancedErrorInfo}
          isRetrying={isRetrying}
          showTechnicalDetails={showTechnicalDetails}
          onToggleTechnicalDetails={this.handleToggleTechnicalDetails}
        />
      </div>
    )
  }
}

// ================================================
// DEFAULT ERROR UI COMPONENT
// ================================================

/**
 * Default Error UI Component
 * Provides a user-friendly error interface with recovery options
 */
interface DefaultErrorUIProps {
  errorInfo: EnhancedErrorInfo | null
  isRetrying: boolean
  showTechnicalDetails: boolean
  onToggleTechnicalDetails: () => void
}

function DefaultErrorUI({
  errorInfo,
  isRetrying,
  showTechnicalDetails,
  onToggleTechnicalDetails
}: DefaultErrorUIProps) {
  if (!errorInfo) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          An unexpected error occurred. Please refresh the page to continue.
        </AlertDescription>
      </Alert>
    )
  }
  
  const severityColor = {
    low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    medium: 'bg-orange-50 border-orange-200 text-orange-800',
    high: 'bg-red-50 border-red-200 text-red-800',
    critical: 'bg-red-100 border-red-300 text-red-900'
  }[errorInfo.severity]
  
  const severityIcon = {
    low: Wifi,
    medium: AlertTriangle,
    high: Zap,
    critical: AlertTriangle
  }[errorInfo.severity]
  
  const SeverityIcon = severityIcon
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${severityColor}`}>
              <SeverityIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {errorInfo.severity === 'critical' ? 'Service Temporarily Unavailable' :
                 errorInfo.severity === 'high' ? 'Feature Currently Limited' :
                 errorInfo.severity === 'medium' ? 'Some Features Affected' :
                 'Minor Issue Detected'}
              </CardTitle>
              <CardDescription className="mt-1">
                Error ID: {errorInfo.errorId.split('-').pop()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* User-friendly error message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 font-medium mb-2">What happened?</p>
            <p className="text-blue-800">{errorInfo.userMessage}</p>
          </div>
          
          {/* Recovery actions */}
          {errorInfo.recoveryActions.length > 0 && (
            <div className="space-y-3">
              <p className="font-medium text-slate-900">What you can do:</p>
              <div className="grid gap-2">
                {errorInfo.recoveryActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Button
                      key={index}
                      variant={action.isPrimary ? 'default' : 'outline'}
                      onClick={action.action}
                      disabled={isRetrying}
                      className="justify-start h-auto p-4"
                    >
                      <div className="flex items-center space-x-3 text-left">
                        {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                        <div>
                          <div className="font-medium">{action.label}</div>
                          <div className="text-sm opacity-80">{action.description}</div>
                          {action.estimatedTime && (
                            <div className="text-xs opacity-60 mt-1">
                              Takes about {action.estimatedTime}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Fallback strategies */}
          {errorInfo.fallbackStrategies.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-2">Alternative approaches:</p>
              <ul className="text-gray-700 space-y-1">
                {errorInfo.fallbackStrategies.map((strategy, index) => (
                  <li key={index} className="text-sm">• {strategy}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Technical details toggle */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={onToggleTechnicalDetails}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {showTechnicalDetails ? 'Hide' : 'Show'} technical details
            </Button>
            
            {showTechnicalDetails && (
              <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                <div className="space-y-2 text-sm font-mono">
                  <div><span className="font-semibold">Category:</span> {errorInfo.category}</div>
                  <div><span className="font-semibold">Severity:</span> {errorInfo.severity}</div>
                  <div><span className="font-semibold">Technical:</span> {errorInfo.technicalMessage}</div>
                  <div><span className="font-semibold">Timestamp:</span> {new Date(errorInfo.timestamp).toLocaleString()}</div>
                  {errorInfo.context.miniAppContext && (
                    <div><span className="font-semibold">Context:</span> {errorInfo.context.miniAppContext.environment?.isMiniApp ? 'MiniApp' : 'Web'}</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Loading state for retry */}
          {isRetrying && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm text-slate-600">Attempting to recover...</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {errorInfo.userMessage}
        {isRetrying && "Attempting to recover from the error..."}
      </div>
    </div>
  )
}

/**
 * Enhanced MiniApp Error Fallback Component
 * 
 * This component provides a comprehensive error recovery interface specifically
 * designed for MiniApp environments, with special handling for the connections.get error.
 */
function MiniAppErrorFallback({
  error,
  resetErrorBoundary,
  miniAppContext,
  compatibilityInfo
}: {
  error: Error
  resetErrorBoundary: () => void
  miniAppContext?: EnhancedMiniAppContextValue
  compatibilityInfo?: CompatibilityTestSuiteResult
}) {
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState<'analyzing' | 'resetting' | 'reconnecting' | 'complete'>('analyzing')
  const [canRetry, setCanRetry] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // Check if this is the specific connections.get error
  const isConnectionsError = error.message.includes('connections.get is not a function')
  const isMiniAppEnvironment = miniAppContext?.environment?.isMiniApp || false

  // Enhanced error analysis
  const errorAnalysis = useMemo(() => {
    if (isConnectionsError) {
      return {
        type: 'WAGMI_STATE_CORRUPTION',
        severity: 'high',
        userFriendlyMessage: 'Wallet connection system needs to be reset',
        technicalDetails: 'The internal wallet state has become corrupted and needs to be cleared.',
        recoverySteps: [
          'Clear corrupted wallet state',
          'Reset connection cache',
          'Reinitialize wallet system'
        ],
        canAutoRecover: true
      }
    }

    if (error.message.includes('MiniKit') || error.message.includes('Farcaster SDK')) {
      return {
        type: 'MINIKIT_ERROR',
        severity: 'medium',
        userFriendlyMessage: 'Social features are temporarily unavailable',
        technicalDetails: 'The Farcaster integration encountered an error.',
        recoverySteps: [
          'Check Farcaster client compatibility',
          'Refresh MiniApp context',
          'Fall back to web mode if needed'
        ],
        canAutoRecover: true
      }
    }

    return {
      type: 'UNKNOWN_ERROR',
      severity: 'medium',
      userFriendlyMessage: 'Something went wrong',
      technicalDetails: error.message,
      recoverySteps: [
        'Refresh the page',
        'Check your connection',
        'Try again later'
      ],
      canAutoRecover: false
    }
  }, [error.message, isConnectionsError])

  // Enhanced recovery function
  const performRecovery = useCallback(async () => {
    if (retryCount >= maxRetries) {
      setCanRetry(false)
      return
    }

    setIsRecovering(true)
    setRetryCount(prev => prev + 1)

    try {
      setRecoveryStep('analyzing')
      await new Promise(resolve => setTimeout(resolve, 500))

      if (isConnectionsError) {
        setRecoveryStep('resetting')
        
        // Clear all wagmi-related storage
        if (typeof window !== 'undefined') {
          const keysToRemove = [
            'wagmi.store',
            'wagmi.cache',
            'wagmi.connections',
            'wagmi.state',
            'wagmi.account',
            'wagmi.chainId',
            'wagmi.connector',
            'dxbloom-miniapp-wagmi'
          ]
          
          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key)
              sessionStorage.removeItem(key)
            } catch (e) {
              // Ignore individual key removal errors
            }
          })
          
          // Clear any other wagmi-related items
          Object.keys(localStorage).forEach(key => {
            if (key.includes('wagmi') || key.includes('wallet') || key.includes('connector')) {
              try {
                localStorage.removeItem(key)
              } catch (e) {
                // Ignore errors
              }
            }
          })
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
        setRecoveryStep('reconnecting')
        
        // Wait a bit more for the reset to take effect
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      setRecoveryStep('complete')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Reset the error boundary
      resetErrorBoundary()

    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError)
      setCanRetry(false)
    } finally {
      setIsRecovering(false)
      setRecoveryStep('analyzing')
    }
  }, [isConnectionsError, retryCount, maxRetries, resetErrorBoundary])

  // Auto-recovery for specific errors
  useEffect(() => {
    if (errorAnalysis.canAutoRecover && isConnectionsError && retryCount === 0) {
      const timer = setTimeout(() => {
        performRecovery()
      }, 2000) // Auto-recover after 2 seconds

      return () => clearTimeout(timer)
    }
  }, [errorAnalysis.canAutoRecover, isConnectionsError, retryCount, performRecovery])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Title */}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">
            MiniApp Error
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {errorAnalysis.userFriendlyMessage}
          </p>
        </div>

        {/* Error Details */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                Something went wrong loading the MiniApp. This might be due to network connectivity or compatibility issues.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Error Details:</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <code className="text-xs text-muted-foreground break-all">
              {error.message}
            </code>
          </CardContent>
        </Card>

        {/* Recovery Progress */}
        {isRecovering && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Recovery Progress</span>
                  <span className="text-muted-foreground">
                    {retryCount}/{maxRetries}
                  </span>
                </div>
                <Progress value={
                  recoveryStep === 'analyzing' ? 25 :
                  recoveryStep === 'resetting' ? 50 :
                  recoveryStep === 'reconnecting' ? 75 :
                  recoveryStep === 'complete' ? 100 : 0
                } />
                <p className="text-xs text-muted-foreground capitalize">
                  {recoveryStep.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {canRetry && !isRecovering && (
            <Button 
              onClick={performRecovery}
              className="w-full"
              disabled={retryCount >= maxRetries}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}

          {isMiniAppEnvironment && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Open in web browser
                if (typeof window !== 'undefined') {
                  const webUrl = window.location.href.replace('/mini/', '/')
                  window.open(webUrl, '_blank')
                }
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Web Version
            </Button>
          )}

          <button 
            onClick={() => {
              // Hide technical details by toggling state
              const detailsCard = document.querySelector('[data-error-details]')
              if (detailsCard) {
                detailsCard.classList.toggle('hidden')
              }
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Hide Technical Details
          </button>
        </div>

        {/* Environment Info */}
        {compatibilityInfo && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Compatibility Level: {compatibilityInfo.compatibilityLevel}</p>
            <p>Tests Passed: {compatibilityInfo.passedTests}/{compatibilityInfo.totalTests}</p>
            <p>Status: {compatibilityInfo.criticalFailures > 0 ? '❌ Critical Issues' : '✅ Compatible'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ================================================
// FUNCTIONAL WRAPPER COMPONENT
// ================================================

/**
 * MiniApp Error Boundary Functional Wrapper
 * Provides access to context and compatibility information
 */
export function MiniAppErrorBoundary(props: MiniAppErrorBoundaryProps) {
  // Access context from Components 1 and 2 for intelligent error handling
  const legacyMiniApp = useMiniApp()
  const { runQuickTests } = useCompatibilityTesting()
  
  // State for compatibility information
  const [compatibilityInfo, setCompatibilityInfo] = useState<CompatibilityTestSuiteResult | undefined>()
  
  // Create enhanced context from legacy context for compatibility
  const enhancedContext: EnhancedMiniAppContextValue | undefined = useMemo(() => {
    if (!legacyMiniApp) return undefined
    
    return {
      state: {
        context: legacyMiniApp.context,
        capabilities: legacyMiniApp.capabilities,
        errors: legacyMiniApp.errors,
        loadingState: legacyMiniApp.loadingState,
        socialProfile: null,
        socialInteractions: [],
        connectionStatus: 'connected',
        shareableContent: [],
        pendingShares: [],
        shareHistory: [],
        performanceMetrics: {
          initializationTime: 0,
          averageResponseTime: 0,
          errorRate: 0,
          lastMetricsUpdate: new Date()
        },
        analyticsData: {
          sessionId: 'session-' + Date.now(),
          sessionStartTime: new Date(),
          pageViews: 0,
          interactions: 0,
          conversionEvents: []
        },
        sdkState: {
          isInitialized: legacyMiniApp.isReady,
          isReady: legacyMiniApp.isReady,
          initializationAttempts: 0,
          lastError: null,
          readyCallbackFired: legacyMiniApp.isReady,
          contextData: null
        },
        socialEngagement: {
          sessionStartTime: new Date(),
          totalInteractions: 0,
          shareCount: 0,
          engagementScore: 0,
          lastInteractionTime: null,
          conversionEvents: []
        },
        capabilityMonitoring: {
          lastCapabilityCheck: null,
          capabilityChanges: 0,
          degradedCapabilities: [],
          enhancedCapabilities: []
        },
        performance: {
          loadTime: 0,
          renderTime: 0,
          interactionCount: 0,
          errorCount: 0,
          lastUpdateTime: new Date()
        },
        warnings: []
      },
      actions: {
        initializeSDK: async () => true,
        signalReady: async () => {},
        refreshCapabilities: async () => legacyMiniApp.capabilities,
        shareContent: legacyMiniApp.shareContent,
        composeCast: async () => ({ success: false }),
        trackInteraction: legacyMiniApp.trackInteraction,
        refreshSocialProfile: async () => null,
        updateSocialVerification: async () => {},
        handleError: () => {},
        clearErrors: () => {},
        retryFailedOperation: async () => false
      },
      environment: {
        detection: { isMiniApp: legacyMiniApp.isMiniApp } as any,
        isMiniApp: legacyMiniApp.isMiniApp,
        isEmbedded: legacyMiniApp.isEmbedded,
        hasSDK: legacyMiniApp.isReady,
        confidence: legacyMiniApp.isMiniApp ? 1 : 0
      },
      enhancedUser: legacyMiniApp.socialUser ? {
        connectionStatus: 'connected',
        socialVerification: { isVerified: false, verificationLevel: 'none', lastVerified: null },
        socialMetrics: { followerCount: 0, followingCount: 0, castCount: 0, socialScore: 0, influenceScore: 0 },
        platformSocialContext: null,
        farcasterProfile: legacyMiniApp.socialUser
      } as any : null,
      utils: {
        formatSocialHandle: (username: string) => `@${username}`,
        getSocialVerificationBadge: () => null,
        getOptimalShareText: () => '',
        estimateEngagement: () => 0,
        canPerformAction: () => false
      }
    }
  }, [legacyMiniApp])
  
  // Run compatibility tests when context changes
  useEffect(() => {
    if (legacyMiniApp.isMiniApp) {
      runQuickTests().then(setCompatibilityInfo).catch(console.warn)
    }
  }, [legacyMiniApp.isMiniApp, runQuickTests])
  
  return (
    <MiniAppErrorBoundaryClass
      {...props}
      miniAppContext={enhancedContext}
      compatibilityInfo={compatibilityInfo}
    />
  )
}

// ================================================
// UTILITY HOOKS FOR ERROR HANDLING
// ================================================

/**
 * Hook for manual error reporting
 * Allows components to report errors manually when needed
 */
export function useErrorReporting() {
  const miniAppContext = useMiniApp()
  
  const reportError = useCallback((
    error: Error,
    category: MiniAppErrorCategory,
    additionalContext?: Record<string, any>
  ) => {
    // This would integrate with your error reporting service
    console.error('Manual error report:', {
      error,
      category,
      miniAppContext,
      additionalContext,
      timestamp: Date.now()
    })
  }, [miniAppContext])
  
  return { reportError }
}

/**
 * Hook for error recovery utilities
 * Provides common error recovery functions
 */
export function useErrorRecovery() {
  const legacyMiniApp = useMiniApp()
  
  const recoverFromNetworkError = useCallback(async () => {
    // Attempt to refresh network connections
    if (legacyMiniApp.isMiniApp) {
      // For legacy compatibility, we just refresh the page
      window.location.reload()
    }
  }, [legacyMiniApp])
  
  const recoverFromSDKError = useCallback(async () => {
    // Attempt to reinitialize SDK
    if (legacyMiniApp.isMiniApp) {
      // For legacy compatibility, we refresh the page to reinitialize
      window.location.reload()
    }
  }, [legacyMiniApp])
  
  return {
    recoverFromNetworkError,
    recoverFromSDKError
  }
}export default MiniAppErrorBoundary
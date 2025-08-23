import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Address } from 'viem'
import { AlertTriangle, CheckCircle, Clock, Loader2, XCircle, RefreshCw, DollarSign, Shield } from 'lucide-react'
import { useSyncedPaymentState, FrontendPaymentState, PaymentIntentStatus, SyncStatus } from '../../hooks/web3/payment/useSyncedPaymentState'
import { usePaymentIntentCleanup, CleanupStrategy, CleanupReason } from '../../hooks/web3/payment/usePaymentIntentCleanup'

/**
 * Props interface for the PaymentIntentMonitor component
 * This component is designed to be highly configurable while maintaining simplicity for common use cases
 */
interface PaymentIntentMonitorProps {
  // Core payment tracking
  intentId?: string                          // The payment intent we're monitoring
  contentId: bigint                          // Content being purchased (for context)
  expectedAmount?: bigint                    // Expected payment amount in wei
  paymentToken?: Address                     // Token being used for payment
  
  // UI customization
  showTechnicalDetails?: boolean             // Show detailed technical info for debugging
  showProgressBar?: boolean                  // Show animated progress indicators
  compactMode?: boolean                      // Condensed view for mobile or small spaces
  className?: string                         // Additional CSS classes
  
  // Behavior configuration  
  enableAutoRecovery?: boolean               // Allow automatic error recovery
  enableUserActions?: boolean                // Show action buttons for user intervention
  hideWhenIdle?: boolean                     // Auto-hide when no payment is active
  
  // Event callbacks
  onPaymentCompleted?: (intentId: string) => void
  onPaymentFailed?: (intentId: string, error: string) => void
  onUserActionRequired?: (action: string, intentId?: string) => void
  onCleanupCompleted?: (intentId: string) => void
}

/**
 * User-friendly status translations
 * These convert our technical enums into messages that build user confidence
 */
const getStatusDisplay = (
  frontendState: FrontendPaymentState,
  contractStatus: PaymentIntentStatus,
  syncStatus: SyncStatus
) => {
  // When everything is in sync, we can trust the frontend state for user messaging
  if (syncStatus === SyncStatus.IN_SYNC) {
    switch (frontendState) {
      case FrontendPaymentState.IDLE:
        return {
          title: 'Ready to Pay',
          message: 'Click purchase when you\'re ready to complete your payment.',
          icon: DollarSign,
          color: 'text-blue-600',
          background: 'bg-blue-50'
        }
      
      case FrontendPaymentState.PRICE_CALCULATING:
        return {
          title: 'Getting Best Price',
          message: 'Finding the optimal swap rate for your payment...',
          icon: Loader2,
          color: 'text-blue-600',
          background: 'bg-blue-50',
          animated: true
        }
      
      case FrontendPaymentState.CREATING_INTENT:
        return {
          title: 'Preparing Payment',
          message: 'Setting up your secure payment intent...',
          icon: Loader2,
          color: 'text-blue-600', 
          background: 'bg-blue-50',
          animated: true
        }
      
      case FrontendPaymentState.WAITING_SIGNATURE:
        return {
          title: 'Awaiting Authorization',
          message: 'Waiting for payment authorization from our secure system...',
          icon: Clock,
          color: 'text-yellow-600',
          background: 'bg-yellow-50'
        }
      
      case FrontendPaymentState.EXECUTING_PAYMENT:
        return {
          title: 'Processing Payment',
          message: 'Your payment is being processed on the blockchain...',
          icon: Loader2,
          color: 'text-green-600',
          background: 'bg-green-50',
          animated: true
        }
      
      case FrontendPaymentState.COMPLETED:
        return {
          title: 'Payment Successful!',
          message: 'Your payment has been completed and access granted.',
          icon: CheckCircle,
          color: 'text-green-600',
          background: 'bg-green-50'
        }
      
      case FrontendPaymentState.ERROR:
        return {
          title: 'Payment Issue',
          message: 'There was a problem with your payment. We\'re working to resolve it.',
          icon: AlertTriangle,
          color: 'text-red-600',
          background: 'bg-red-50'
        }
      
      case FrontendPaymentState.CANCELLED:
        return {
          title: 'Payment Cancelled',
          message: 'Your payment was cancelled. No charges were made.',
          icon: XCircle,
          color: 'text-gray-600',
          background: 'bg-gray-50'
        }
    }
  }
  
  // When sync status is problematic, we need different messaging
  if (syncStatus === SyncStatus.OUT_OF_SYNC) {
    return {
      title: 'Checking Payment Status',
      message: 'We\'re verifying your payment status to ensure accuracy...',
      icon: RefreshCw,
      color: 'text-yellow-600',
      background: 'bg-yellow-50',
      animated: true
    }
  }
  
  if (syncStatus === SyncStatus.RECOVERING) {
    return {
      title: 'Resolving Payment',
      message: 'We detected an issue and are automatically fixing it...',
      icon: Shield,
      color: 'text-blue-600',
      background: 'bg-blue-50',
      animated: true
    }
  }
  
  // Fallback for unknown states
  return {
    title: 'Payment Status Unknown',
    message: 'We\'re checking on your payment. Please wait a moment...',
    icon: Loader2,
    color: 'text-gray-600',
    background: 'bg-gray-50',
    animated: true
  }
}

/**
 * Progress calculation for different payment states
 * This helps users understand how far along they are in the payment process
 */
const calculateProgress = (frontendState: FrontendPaymentState, syncStatus: SyncStatus): number => {
  if (syncStatus === SyncStatus.RECOVERING) return 75 // Show high progress during recovery
  
  switch (frontendState) {
    case FrontendPaymentState.IDLE: return 0
    case FrontendPaymentState.PRICE_CALCULATING: return 15
    case FrontendPaymentState.CREATING_INTENT: return 30
    case FrontendPaymentState.WAITING_SIGNATURE: return 50
    case FrontendPaymentState.EXECUTING_PAYMENT: return 80
    case FrontendPaymentState.COMPLETED: return 100
    case FrontendPaymentState.ERROR: return 0  // Reset on error
    case FrontendPaymentState.CANCELLED: return 0
    default: return 0
  }
}

/**
 * PaymentIntentMonitor Component
 * 
 * This component serves as the central user interface for monitoring payment progress.
 * It orchestrates our two foundational hooks (sync state and cleanup) to provide
 * a seamless user experience that automatically handles edge cases and errors.
 * 
 * Think of this component as a "smart dashboard" that:
 * 1. Continuously monitors both frontend and blockchain state
 * 2. Automatically detects and resolves sync issues 
 * 3. Provides clear, confidence-building user communication
 * 4. Offers appropriate action buttons when user intervention is needed
 * 
 * Directory: src/components/payment/PaymentIntentMonitor.tsx
 */
export function PaymentIntentMonitor({
  intentId,
  contentId,
  expectedAmount,
  paymentToken,
  showTechnicalDetails = false,
  showProgressBar = true,
  compactMode = false,
  className = '',
  enableAutoRecovery = true,
  enableUserActions = true,
  hideWhenIdle = false,
  onPaymentCompleted,
  onPaymentFailed,
  onUserActionRequired,
  onCleanupCompleted
}: PaymentIntentMonitorProps) {
  
  // Initialize our core hooks that handle all the complex state management
  const syncState = useSyncedPaymentState({
    intentId,
    autoSync: enableAutoRecovery,
    syncIntervalMs: 2000,
    maxSyncRetries: 3
  })
  
  const cleanupSystem = usePaymentIntentCleanup({
    enableAutoCleanup: enableAutoRecovery,
    maxRetryAttempts: 2,
    cleanupTimeoutMs: 30000,
    preserveUserFunds: true
  })
  
  // Local UI state for animations and interactions
  const [userHasBeenNotified, setUserHasBeenNotified] = useState(false)
  const [showRetryButton, setShowRetryButton] = useState(false)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null)
  
  // Calculate display information based on current state
  const statusDisplay = useMemo(() => 
    getStatusDisplay(syncState.frontendState, syncState.contractStatus, syncState.syncStatus),
    [syncState.frontendState, syncState.contractStatus, syncState.syncStatus]
  )
  
  const progressPercentage = useMemo(() => 
    calculateProgress(syncState.frontendState, syncState.syncStatus),
    [syncState.frontendState, syncState.syncStatus]
  )
  
  // Determine if component should be visible
  const shouldHide = hideWhenIdle && 
                     syncState.frontendState === FrontendPaymentState.IDLE && 
                     !intentId
  
  /**
   * Estimated Time Calculation
   * This provides users with realistic expectations about how long each step will take
   */
  useEffect(() => {
    const timeEstimates: Record<FrontendPaymentState, number> = {
      [FrontendPaymentState.IDLE]: 0,
      [FrontendPaymentState.PRICE_CALCULATING]: 5,     // 5 seconds for price quotes
      [FrontendPaymentState.CREATING_INTENT]: 10,      // 10 seconds for intent creation
      [FrontendPaymentState.WAITING_SIGNATURE]: 30,    // 30 seconds max for signatures
      [FrontendPaymentState.EXECUTING_PAYMENT]: 45,    // 45 seconds for blockchain confirmation
      [FrontendPaymentState.COMPLETED]: 0,
      [FrontendPaymentState.ERROR]: 0,
      [FrontendPaymentState.CANCELLED]: 0
    }
    
    const estimate = timeEstimates[syncState.frontendState]
    setEstimatedTimeRemaining(estimate || null)
    
    // Create countdown timer for better UX
    if (estimate) {
      const startTime = Date.now()
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = Math.max(0, estimate - elapsed)
        setEstimatedTimeRemaining(remaining)
        
        if (remaining === 0) {
          clearInterval(timer)
        }
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [syncState.frontendState])
  
  /**
   * Automatic Recovery System
   * When our sync hook detects problems, we automatically analyze and fix them
   */
  useEffect(() => {
    if (!enableAutoRecovery) return
    if (syncState.syncStatus !== SyncStatus.OUT_OF_SYNC) return
    if (cleanupSystem.isCleaningUp) return
    
    // Analyze what went wrong and determine the best recovery strategy
    const failureAnalysis = cleanupSystem.analyzeFailureScenario(
      syncState.frontendState,
      syncState.contractStatus,
      syncState.error || undefined
    )
    
    // Execute automatic recovery for non-destructive strategies
    if (failureAnalysis.strategy === CleanupStrategy.SOFT_RESET || 
        failureAnalysis.strategy === CleanupStrategy.AUTO_RETRY) {
      
      console.log('🔄 Auto-recovery triggered:', failureAnalysis)
      cleanupSystem.triggerCleanup(failureAnalysis)
    } else {
      // For more complex scenarios, show user action button
      setShowRetryButton(true)
    }
  }, [syncState.syncStatus, syncState.frontendState, syncState.contractStatus, 
      enableAutoRecovery, cleanupSystem, syncState.error])
  
  /**
   * Success/Failure Event Handling
   * Notify parent components when important events occur
   */
  useEffect(() => {
    if (syncState.frontendState === FrontendPaymentState.COMPLETED && 
        !userHasBeenNotified && intentId) {
      
      setUserHasBeenNotified(true)
      onPaymentCompleted?.(intentId)
    }
    
    if (syncState.frontendState === FrontendPaymentState.ERROR && 
        !userHasBeenNotified && intentId) {
      
      setUserHasBeenNotified(true)
      onPaymentFailed?.(intentId, syncState.error || 'Unknown payment error')
    }
  }, [syncState.frontendState, userHasBeenNotified, intentId, syncState.error,
      onPaymentCompleted, onPaymentFailed])
  
  /**
   * Cleanup Completion Handler
   * Reset UI state when cleanup operations complete successfully
   */
  useEffect(() => {
    if (cleanupSystem.lastCleanupOperation && 
        !cleanupSystem.isCleaningUp && 
        !cleanupSystem.cleanupError) {
      
      setShowRetryButton(false)
      setUserHasBeenNotified(false)
      
      if (intentId) {
        onCleanupCompleted?.(intentId)
      }
    }
  }, [cleanupSystem.lastCleanupOperation, cleanupSystem.isCleaningUp, 
      cleanupSystem.cleanupError, intentId, onCleanupCompleted])
  
  /**
   * Manual Recovery Handler
   * When users click retry or other action buttons
   */
  const handleUserAction = useCallback(async (action: string) => {
    if (action === 'retry') {
      setShowRetryButton(false)
      
      if (intentId) {
        // Analyze current situation and execute appropriate cleanup
        const failureAnalysis = cleanupSystem.analyzeFailureScenario(
          syncState.frontendState,
          syncState.contractStatus,
          syncState.error || undefined
        )
        
        const success = await cleanupSystem.triggerCleanup(failureAnalysis)
        if (!success) {
          setShowRetryButton(true) // Show retry button again if cleanup failed
        }
      }
      
      onUserActionRequired?.(action, intentId)
    }
    
    if (action === 'force_sync') {
      await syncState.forceSyncCheck()
    }
    
    if (action === 'cancel') {
      if (intentId) {
        await cleanupSystem.softReset(CleanupReason.USER_CANCELLED, 'Payment cancelled by user')
      }
      onUserActionRequired?.(action, intentId)
    }
  }, [intentId, cleanupSystem, syncState, onUserActionRequired])
  
  // Hide component when appropriate
  if (shouldHide) {
    return null
  }
  
  // Render the component with appropriate styling based on mode
  const containerClasses = compactMode 
    ? `p-3 rounded-lg border ${statusDisplay.background} ${className}`
    : `p-6 rounded-xl border shadow-sm ${statusDisplay.background} ${className}`
  
  const IconComponent = statusDisplay.icon
  
  return (
    <div className={containerClasses}>
      {/* Main Status Display */}
      <div className="flex items-center space-x-3">
        <div className={`flex-shrink-0 ${statusDisplay.color}`}>
          <IconComponent 
            className={`${compactMode ? 'h-5 w-5' : 'h-6 w-6'} ${
              statusDisplay.animated ? 'animate-spin' : ''
            }`} 
          />
        </div>
        
        <div className="flex-grow min-w-0">
          <h3 className={`font-semibold ${statusDisplay.color} ${
            compactMode ? 'text-sm' : 'text-base'
          }`}>
            {statusDisplay.title}
          </h3>
          <p className={`text-gray-600 ${compactMode ? 'text-xs' : 'text-sm'}`}>
            {statusDisplay.message}
          </p>
          
          {/* Time Estimation */}
          {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Estimated time: {estimatedTimeRemaining}s
            </p>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      {showProgressBar && progressPercentage > 0 && progressPercentage < 100 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      {enableUserActions && (
        <div className="mt-4 flex space-x-2">
          {showRetryButton && (
            <button
              onClick={() => handleUserAction('retry')}
              disabled={cleanupSystem.isCleaningUp}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {cleanupSystem.isCleaningUp ? 'Retrying...' : 'Retry Payment'}
            </button>
          )}
          
          {syncState.needsRecovery && showTechnicalDetails && (
            <button
              onClick={() => handleUserAction('force_sync')}
              disabled={syncState.isLoading}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Force Sync
            </button>
          )}
          
          {syncState.frontendState !== FrontendPaymentState.COMPLETED && 
           syncState.frontendState !== FrontendPaymentState.IDLE && (
            <button
              onClick={() => handleUserAction('cancel')}
              disabled={cleanupSystem.isCleaningUp}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      
      {/* Technical Details (for debugging) */}
      {showTechnicalDetails && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs font-mono">
          <div>Frontend: {syncState.frontendState}</div>
          <div>Contract: {syncState.contractStatus}</div>
          <div>Sync: {syncState.syncStatus}</div>
          {intentId && <div>Intent: {intentId}</div>}
          {syncState.error && <div className="text-red-600">Error: {syncState.error}</div>}
          {cleanupSystem.cleanupError && (
            <div className="text-red-600">Cleanup Error: {cleanupSystem.cleanupError}</div>
          )}
        </div>
      )}
    </div>
  )
}
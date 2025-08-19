// ==============================================================================
// COMPONENT 2: BATCH TRANSACTION STATE MANAGEMENT HOOK - PHASE 2 COMMERCE ENHANCEMENT
// File: src/hooks/contracts/core/useBatchTransactionState.ts
// ==============================================================================

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { 
  usePublicClient, 
  useWaitForTransactionReceipt, 
  useChainId,
} from 'wagmi'
import type { Address, Hash } from 'viem'

// Import Phase 1 MiniApp integration for context-aware analytics
import { useMiniApp } from '@/contexts/MiniAppProvider'

// Import existing performance monitoring from your Phase 1 infrastructure
import { useMiniAppPerformanceMetrics } from '@/utils/performance/miniAppMetrics'

// ================================================
// EDUCATIONAL FOUNDATION: UNDERSTANDING BATCH TRANSACTION LIFECYCLE
// ================================================

/**
 * Learning Concept: Batch Transaction Lifecycle States
 * 
 * Batch transactions go through a more complex lifecycle than sequential transactions
 * because they involve multiple operations coordinated together. Understanding this
 * lifecycle is crucial for providing excellent user experiences and reliable systems.
 * 
 * Think of it like orchestrating a symphony - each instrument (transaction component)
 * must be tracked individually, but we also need to understand how they work together
 * to create the complete performance (successful batch execution).
 */

/**
 * Batch Component State Interface
 * 
 * This interface tracks the state of individual components within a batch transaction.
 * Each component represents a single operation (like approval or purchase) that's part
 * of the larger batch. Understanding component-level details is essential for debugging
 * and providing detailed user feedback.
 */
interface BatchTransactionComponent {
  /** Unique identifier for this component within the batch */
  readonly id: string
  /** Human-readable description of what this component does */
  readonly description: string
  /** The contract address this component interacts with */
  readonly targetContract: Address
  /** The function being called by this component */
  readonly functionName: string
  /** Current execution state of this specific component */
  readonly status: 'pending' | 'confirming' | 'confirmed' | 'failed'
  /** Individual transaction hash if available (for component-level tracking) */
  readonly transactionHash: Hash | null
  /** Gas limit allocated to this component */
  readonly gasLimit: bigint | null
  /** Actual gas used by this component (available after execution) */
  readonly gasUsed: bigint | null
  /** Component-specific error information if execution failed */
  readonly error: Error | null
  /** Timestamp when this component started executing */
  readonly startTime: number | null
  /** Timestamp when this component completed (success or failure) */
  readonly completionTime: number | null
}

/**
 * Batch Transaction Analytics Interface
 * 
 * This interface provides comprehensive analytics about batch transaction performance,
 * user experience metrics, and business insights. These analytics help optimize
 * social commerce conversion rates and identify improvement opportunities.
 * 
 * Think of this as your business intelligence dashboard for batch transactions -
 * it tells you not just what happened, but why it matters for your users and business.
 */
interface BatchTransactionAnalytics {
  /** Performance Metrics */
  readonly performance: {
    /** Total execution time from initiation to completion */
    readonly totalExecutionTime: number | null
    /** Time spent in user confirmation phase */
    readonly userConfirmationTime: number | null
    /** Time spent in blockchain processing phase */
    readonly blockchainProcessingTime: number | null
    /** Average time per component within the batch */
    readonly averageComponentTime: number | null
    /** Efficiency ratio compared to sequential transactions */
    readonly efficiencyRatio: number | null
  }
  
  /** Cost Analysis */
  readonly costs: {
    /** Total gas limit allocated for the batch */
    readonly totalGasLimit: bigint | null
    /** Actual gas consumed by the batch */
    readonly actualGasUsed: bigint | null
    /** Estimated cost savings compared to sequential transactions */
    readonly estimatedSavings: bigint | null
    /** Cost efficiency percentage */
    readonly costEfficiency: number | null
  }
  
  /** User Experience Metrics */
  readonly userExperience: {
    /** Number of user confirmations required */
    readonly confirmationSteps: number
    /** Whether the batch completed on first attempt */
    readonly completedOnFirstAttempt: boolean
    /** Number of retry attempts if any */
    readonly retryAttempts: number
    /** User experience quality score (0-100) */
    readonly experienceScore: number | null
  }
  
  /** Business Intelligence */
  readonly business: {
    /** Conversion impact (did batch transactions improve purchase completion?) */
    readonly conversionImpact: 'positive' | 'neutral' | 'negative' | 'unknown'
    /** Social commerce context (was this in a social media environment?) */
    readonly socialCommerceContext: boolean
    /** Revenue impact of the transaction */
    readonly revenueImpact: bigint | null
    /** Strategic value assessment */
    readonly strategicValue: 'high' | 'medium' | 'low'
  }
}

/**
 * Batch Transaction Recovery Interface
 * 
 * This interface provides intelligent recovery mechanisms for failed batch transactions.
 * Recovery strategies are crucial because batch transactions can fail in more complex
 * ways than sequential transactions, requiring sophisticated analysis and response.
 * 
 * Think of this as an emergency response system that can diagnose problems and
 * automatically implement solutions or guide users through manual recovery steps.
 */
interface BatchTransactionRecovery {
  /** Whether recovery options are available for the current failure */
  readonly isRecoveryAvailable: boolean
  /** Recommended recovery strategy based on failure analysis */
  readonly recommendedStrategy: 'retry_batch' | 'fallback_sequential' | 'manual_intervention' | 'no_recovery'
  /** Detailed explanation of what went wrong and why */
  readonly failureAnalysis: {
    readonly primaryCause: string
    readonly affectedComponents: readonly string[]
    readonly isUserError: boolean
    readonly isSystemError: boolean
    readonly isNetworkError: boolean
  }
  /** Available recovery actions the user or system can take */
  readonly recoveryActions: readonly {
    readonly action: string
    readonly description: string
    readonly estimatedSuccessRate: number
    readonly execute: () => Promise<void>
  }[]
  /** Whether automatic recovery should be attempted */
  readonly shouldAutoRecover: boolean
}

/**
 * Main Batch Transaction State Interface
 * 
 * This is the comprehensive state container that brings together all aspects of
 * batch transaction monitoring. It provides a complete picture of batch transaction
 * execution from initiation through completion or failure.
 */
interface BatchTransactionState {
  /** Unique identifier for this batch transaction session */
  readonly batchId: string | null
  /** Current overall status of the batch transaction */
  readonly status: 'idle' | 'preparing' | 'confirming' | 'executing' | 'completed' | 'failed' | 'recovering'
  /** Individual components that make up this batch transaction */
  readonly components: readonly BatchTransactionComponent[]
  /** Overall progress percentage (0-100) */
  readonly progress: number
  /** Current user-facing status message */
  readonly statusMessage: string
  /** Main batch transaction hash from the blockchain */
  readonly batchTransactionHash: Hash | null
  /** Whether the batch is currently being monitored for updates */
  readonly isMonitoring: boolean
  /** Comprehensive analytics about this batch transaction */
  readonly analytics: BatchTransactionAnalytics
  /** Recovery information and options if the batch failed */
  readonly recovery: BatchTransactionRecovery | null
  /** Timestamp when batch transaction was initiated */
  readonly initiatedAt: number | null
  /** Timestamp when batch transaction completed (success or failure) */
  readonly completedAt: number | null
}

// ================================================
// CONFIGURATION AND DEFAULTS
// ================================================

/**
 * Default Analytics State
 * 
 * This provides sensible defaults for analytics tracking, ensuring that we always
 * have a complete analytics object even before data is available. This prevents
 * errors and provides consistent interfaces for UI components.
 */
const DEFAULT_ANALYTICS: BatchTransactionAnalytics = {
  performance: {
    totalExecutionTime: null,
    userConfirmationTime: null,
    blockchainProcessingTime: null,
    averageComponentTime: null,
    efficiencyRatio: null
  },
  costs: {
    totalGasLimit: null,
    actualGasUsed: null,
    estimatedSavings: null,
    costEfficiency: null
  },
  userExperience: {
    confirmationSteps: 1,
    completedOnFirstAttempt: true,
    retryAttempts: 0,
    experienceScore: null
  },
  business: {
    conversionImpact: 'unknown',
    socialCommerceContext: false,
    revenueImpact: null,
    strategicValue: 'medium'
  }
}

/**
 * Monitoring Configuration Interface
 * 
 * This interface allows customization of how batch transactions are monitored,
 * providing flexibility for different use cases while maintaining optimal defaults
 * for social commerce scenarios.
 */
interface BatchMonitoringConfig {
  /** How frequently to poll for transaction status updates (milliseconds) */
  readonly pollingInterval: number
  /** Maximum time to wait for transaction completion (milliseconds) */
  readonly maxWaitTime: number
  /** Whether to enable detailed component-level tracking */
  readonly enableComponentTracking: boolean
  /** Whether to collect advanced analytics */
  readonly enableAdvancedAnalytics: boolean
  /** Whether to enable automatic recovery attempts */
  readonly enableAutoRecovery: boolean
}

const DEFAULT_MONITORING_CONFIG: BatchMonitoringConfig = {
  pollingInterval: 2000, // Poll every 2 seconds for optimal UX without overwhelming the network
  maxWaitTime: 300000, // Wait up to 5 minutes for completion (generous for complex batch operations)
  enableComponentTracking: true, // Enable detailed tracking for better debugging and UX
  enableAdvancedAnalytics: true, // Enable analytics for business intelligence
  enableAutoRecovery: false // Disable auto-recovery by default for safety
}

// ================================================
// MAIN HOOK IMPLEMENTATION
// ================================================

/**
 * Batch Transaction State Management Hook
 * 
 * This hook provides comprehensive monitoring, analytics, and recovery capabilities
 * for batch transactions. It's designed to work seamlessly with Component 1's
 * enhanced purchase flow while providing the specialized monitoring that batch
 * transactions require.
 * 
 * Educational Concept: Think of this hook as creating a "mission control center"
 * for your batch transactions. Just like NASA monitors every aspect of a space
 * mission, this hook monitors every aspect of your batch transactions to ensure
 * success and provide valuable insights.
 * 
 * The hook automatically integrates with your existing architecture while adding
 * sophisticated capabilities for batch transaction scenarios that go far beyond
 * basic transaction monitoring.
 */
export function useBatchTransactionState(
  config: Partial<BatchMonitoringConfig> = {}
) {
  // ================================================
  // HOOK INITIALIZATION AND CONFIGURATION
  // ================================================
  
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { isMiniApp, context: miniAppContext, socialUser } = useMiniApp()
  const { trackMiniAppMetrics } = useMiniAppPerformanceMetrics()
  
  // Merge user configuration with defaults for optimal behavior
  const finalConfig = useMemo(() => ({ 
    ...DEFAULT_MONITORING_CONFIG, 
    ...config 
  }), [config])
  
  // ================================================
  // STATE MANAGEMENT
  // ================================================
  
  // Main batch transaction state - this is the central state container
  const [batchState, setBatchState] = useState<BatchTransactionState>({
    batchId: null,
    status: 'idle',
    components: [],
    progress: 0,
    statusMessage: 'Ready to process batch transaction',
    batchTransactionHash: null,
    isMonitoring: false,
    analytics: DEFAULT_ANALYTICS,
    recovery: null,
    initiatedAt: null,
    completedAt: null
  })
  
  // Monitoring control state - manages the polling and tracking mechanisms
  const [monitoringState, setMonitoringState] = useState({
    intervalId: null as NodeJS.Timeout | null,
    lastPollTime: null as number | null,
    pollCount: 0,
    isPollingActive: false
  })
  
  // Performance tracking refs - these help us calculate accurate timing metrics
  const performanceRefs = useRef({
    batchStartTime: null as number | null,
    confirmationStartTime: null as number | null,
    executionStartTime: null as number | null,
    componentStartTimes: new Map<string, number>()
  })
  
  // ================================================
  // TRANSACTION RECEIPT MONITORING
  // ================================================
  
  // Monitor the main batch transaction receipt using wagmi's hook
  const { 
    data: transactionReceipt, 
    isError: isReceiptError, 
    isLoading: isReceiptLoading,
    isSuccess: isReceiptSuccess
  } = useWaitForTransactionReceipt({
    hash: batchState.batchTransactionHash || undefined
  })
  
  // ================================================
  // ANALYTICS CALCULATION FUNCTIONS
  // ================================================
  
  /**
   * Calculate Performance Analytics
   * 
   * This function analyzes timing data to provide insights about batch transaction
   * performance. Understanding these metrics helps optimize user experience and
   * identify bottlenecks in the transaction process.
   * 
   * Educational Note: Performance analytics in blockchain applications are crucial
   * because transaction timing affects user experience significantly. Unlike traditional
   * web applications where requests complete in milliseconds, blockchain transactions
   * can take seconds or minutes, making performance monitoring essential.
   */
  const calculatePerformanceAnalytics = useCallback((): BatchTransactionAnalytics['performance'] => {
    const { batchStartTime, confirmationStartTime, executionStartTime } = performanceRefs.current
    const currentTime = Date.now()
    
    // Calculate total execution time if batch has started
    const totalExecutionTime = batchStartTime 
      ? (batchState.completedAt || currentTime) - batchStartTime 
      : null
    
    // Calculate user confirmation time (time between initiation and blockchain submission)
    const userConfirmationTime = (batchStartTime && executionStartTime) 
      ? executionStartTime - batchStartTime 
      : null
    
    // Calculate blockchain processing time (time from submission to completion)
    const blockchainProcessingTime = (executionStartTime && batchState.completedAt) 
      ? batchState.completedAt - executionStartTime 
      : null
    
    // Calculate average component time
    const completedComponents = batchState.components.filter(c => c.completionTime)
    const averageComponentTime = completedComponents.length > 0
      ? completedComponents.reduce((sum, c) => sum + (c.completionTime! - c.startTime!), 0) / completedComponents.length
      : null
    
    // Calculate efficiency ratio (how much faster batch is compared to sequential)
    // This is a key metric for understanding the value of batch transactions
    const efficiencyRatio = averageComponentTime && batchState.components.length > 1
      ? (averageComponentTime * batchState.components.length) / (totalExecutionTime || 1)
      : null
    
    return {
      totalExecutionTime,
      userConfirmationTime,
      blockchainProcessingTime,
      averageComponentTime,
      efficiencyRatio
    }
  }, [batchState.components, batchState.completedAt])
  
  /**
   * Calculate Cost Analytics
   * 
   * This function analyzes gas usage and costs to provide insights about the
   * economic efficiency of batch transactions compared to sequential transactions.
   * Cost analysis is crucial for understanding the value proposition of batch transactions.
   */
  const calculateCostAnalytics = useCallback((): BatchTransactionAnalytics['costs'] => {
    // Sum up gas limits and usage from all components
    const totalGasLimit = batchState.components.reduce(
      (sum, component) => sum + (component.gasLimit || BigInt(0)), 
      BigInt(0)
    )
    
    const actualGasUsed = batchState.components.reduce(
      (sum, component) => sum + (component.gasUsed || BigInt(0)), 
      BigInt(0)
    )
    
    // Estimate savings compared to sequential transactions
    // Sequential transactions have overhead costs that batch transactions avoid
    const sequentialOverheadPerTransaction = BigInt(21000) // Base transaction cost
    const estimatedSequentialCost = actualGasUsed + (sequentialOverheadPerTransaction * BigInt(batchState.components.length - 1))
    const estimatedSavings = actualGasUsed > 0 ? estimatedSequentialCost - actualGasUsed : null
    
    // Calculate cost efficiency percentage
    const costEfficiency = (estimatedSavings && actualGasUsed > 0) 
      ? Number(estimatedSavings * BigInt(100) / estimatedSequentialCost)
      : null
    
    return {
      totalGasLimit: totalGasLimit > 0 ? totalGasLimit : null,
      actualGasUsed: actualGasUsed > 0 ? actualGasUsed : null,
      estimatedSavings,
      costEfficiency
    }
  }, [batchState.components])
  
  /**
   * Calculate User Experience Analytics
   * 
   * This function analyzes the user experience aspects of batch transactions,
   * providing insights that help optimize conversion rates and user satisfaction.
   * UX analytics are particularly important in social commerce contexts.
   */
  const calculateUserExperienceAnalytics = useCallback((): BatchTransactionAnalytics['userExperience'] => {
    // Determine if batch completed on first attempt (no retries)
    const completedOnFirstAttempt = monitoringState.pollCount <= 5 // Reasonable threshold for "first attempt"
    
    // Calculate experience score based on multiple factors
    let experienceScore: number | null = null
    if (batchState.status === 'completed') {
      let score = 100
      
      // Deduct points for long execution times
      const performance = calculatePerformanceAnalytics()
      if (performance.totalExecutionTime) {
        if (performance.totalExecutionTime > 60000) score -= 20 // Over 1 minute
        else if (performance.totalExecutionTime > 30000) score -= 10 // Over 30 seconds
      }
      
      // Deduct points for failed first attempt
      if (!completedOnFirstAttempt) score -= 15
      
      // Deduct points for component failures
      const failedComponents = batchState.components.filter(c => c.status === 'failed')
      score -= failedComponents.length * 10
      
      experienceScore = Math.max(0, Math.min(100, score))
    }
    
    return {
      confirmationSteps: 1, // Batch transactions always require only one confirmation
      completedOnFirstAttempt,
      retryAttempts: Math.max(0, monitoringState.pollCount - 5),
      experienceScore
    }
  }, [batchState.status, batchState.components, monitoringState.pollCount, calculatePerformanceAnalytics])
  
  // ================================================
  // BATCH TRANSACTION INITIALIZATION
  // ================================================
  
  /**
   * Initialize Batch Transaction Monitoring
   * 
   * This function sets up comprehensive monitoring for a new batch transaction.
   * It creates the initial state structure, starts performance tracking, and
   * prepares the analytics systems.
   * 
   * Educational Concept: Think of this as the "mission briefing" phase where we
   * set up all our monitoring systems before the actual mission (transaction) begins.
   */
  const initializeBatch = useCallback((
    transactionHash: Hash,
    components: Array<{
      id: string
      description: string
      targetContract: Address
      functionName: string
      gasLimit?: bigint
    }>
  ) => {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const currentTime = Date.now()
    
    // Initialize performance tracking
    performanceRefs.current = {
      batchStartTime: currentTime,
      confirmationStartTime: currentTime,
      executionStartTime: currentTime,
      componentStartTimes: new Map(components.map(c => [c.id, currentTime]))
    }
    
    // Create component state objects
    const initialComponents: BatchTransactionComponent[] = components.map(component => ({
      id: component.id,
      description: component.description,
      targetContract: component.targetContract,
      functionName: component.functionName,
      status: 'pending',
      transactionHash: transactionHash, // All components share the batch transaction hash
      gasLimit: component.gasLimit || null,
      gasUsed: null,
      error: null,
      startTime: currentTime,
      completionTime: null
    }))
    
    // Initialize analytics with social commerce context
    const initialAnalytics: BatchTransactionAnalytics = {
      ...DEFAULT_ANALYTICS,
      business: {
        ...DEFAULT_ANALYTICS.business,
        socialCommerceContext: isMiniApp,
        strategicValue: isMiniApp ? 'high' : 'medium' // Social commerce has higher strategic value
      }
    }
    
    // Set up the initial batch state
    setBatchState({
      batchId,
      status: 'executing',
      components: initialComponents,
      progress: 10, // Starting progress after initialization
      statusMessage: 'Processing batch transaction...',
      batchTransactionHash: transactionHash,
      isMonitoring: true,
      analytics: initialAnalytics,
      recovery: null,
      initiatedAt: currentTime,
      completedAt: null
    })
    
    // Start monitoring
    startMonitoring()
    
    // Track analytics if in MiniApp context
    if (isMiniApp) {
      trackMiniAppMetrics({
        frameLoadTime: 0,
        paymentProcessingTime: 0,
        socialContextLoadTime: 0,
        contractInteractionTime: 0,
        context: {
          frameType: 'payment',
          paymentMethod: 'traditional',
          networkConditions: 'fast'
        }
      })
    }
    
  }, [isMiniApp, miniAppContext, trackMiniAppMetrics])
  
  // ================================================
  // MONITORING CONTROL FUNCTIONS
  // ================================================
  
  
  /**
   * Start Active Monitoring
   * 
   * This function initiates the polling system that continuously monitors batch
   * transaction progress and updates analytics in real-time. The monitoring system
   * is optimized to provide timely updates without overwhelming the network.
   */
  const startMonitoring = useCallback(() => {
    // Don't start monitoring if already active
    if (monitoringState.isPollingActive) return
    
    setMonitoringState(prev => ({ ...prev, isPollingActive: true }))
    
    const intervalId = setInterval(() => {
      setMonitoringState(prev => ({ 
        ...prev, 
        lastPollTime: Date.now(),
        pollCount: prev.pollCount + 1
      }))
      
      // Update analytics on each poll
      setBatchState(prev => ({
        ...prev,
        analytics: {
          ...prev.analytics,
          performance: calculatePerformanceAnalytics(),
          costs: calculateCostAnalytics(),
          userExperience: calculateUserExperienceAnalytics()
        }
      }))
      
    }, finalConfig.pollingInterval)
    
    setMonitoringState(prev => ({ ...prev, intervalId }))
    
    // Set up timeout to stop monitoring after max wait time
    setTimeout(() => {
      if (batchState.status === 'executing') {
        stopMonitoring()
        setBatchState(prev => ({
          ...prev,
          status: 'failed',
          statusMessage: 'Transaction timeout - monitoring stopped',
          completedAt: Date.now()
        }))
      }
    }, finalConfig.maxWaitTime)
    
  }, [
    monitoringState.isPollingActive, 
    finalConfig.pollingInterval, 
    finalConfig.maxWaitTime,
    batchState.status,
    calculatePerformanceAnalytics,
    calculateCostAnalytics,
    calculateUserExperienceAnalytics
  ])
  
  /**
   * Stop Active Monitoring
   * 
   * This function cleanly shuts down the monitoring system when a batch transaction
   * completes or when monitoring is no longer needed. Proper cleanup prevents
   * memory leaks and unnecessary network requests.
   */
  const stopMonitoring = useCallback(() => {
    if (monitoringState.intervalId) {
      clearInterval(monitoringState.intervalId)
    }
    
    setMonitoringState({
      intervalId: null,
      lastPollTime: null,
      pollCount: 0,
      isPollingActive: false
    })
    
    setBatchState(prev => ({ ...prev, isMonitoring: false }))
  }, [monitoringState.intervalId])
  
  // ================================================
  // TRANSACTION COMPLETION HANDLING
  // ================================================
  
  // Handle successful transaction completion
  useEffect(() => {
    if (isReceiptSuccess && transactionReceipt && batchState.status === 'executing') {
      const completionTime = Date.now()
      
      // Update component states to completed
      const completedComponents = batchState.components.map(component => ({
        ...component,
        status: 'confirmed' as const,
        gasUsed: transactionReceipt.gasUsed, // All components share the batch gas usage
        completionTime
      }))
      
      // Calculate final analytics
      const finalAnalytics: BatchTransactionAnalytics = {
        performance: calculatePerformanceAnalytics(),
        costs: calculateCostAnalytics(),
        userExperience: calculateUserExperienceAnalytics(),
        business: {
          ...batchState.analytics.business,
          conversionImpact: 'positive', // Successful batch transactions always have positive impact
          revenueImpact: BigInt(0) // This would be calculated based on the specific purchase amount
        }
      }
      
      setBatchState(prev => ({
        ...prev,
        status: 'completed',
        components: completedComponents,
        progress: 100,
        statusMessage: 'Batch transaction completed successfully!',
        analytics: finalAnalytics,
        completedAt: completionTime
      }))
      
      stopMonitoring()
      
      // Track completion analytics
      if (isMiniApp) {
        trackMiniAppMetrics({
          frameLoadTime: 0,
          paymentProcessingTime: finalAnalytics.performance.totalExecutionTime || 0,
          socialContextLoadTime: 0,
          contractInteractionTime: 0,
          context: {
            frameType: 'payment',
            paymentMethod: 'traditional',
            networkConditions: 'fast'
          }
        })
      }
    }
  }, [
    isReceiptSuccess, 
    transactionReceipt, 
    batchState.status, 
    batchState.components, 
    batchState.analytics.business,
    batchState.batchId,
    calculatePerformanceAnalytics,
    calculateCostAnalytics,
    calculateUserExperienceAnalytics,
    stopMonitoring,
    isMiniApp,
    trackMiniAppMetrics
  ])
  
  // Handle transaction failure
  useEffect(() => {
    if (isReceiptError && batchState.status === 'executing') {
      const completionTime = Date.now()
      
      // Create recovery options for failed batch
      const recovery: BatchTransactionRecovery = {
        isRecoveryAvailable: true,
        recommendedStrategy: 'fallback_sequential',
        failureAnalysis: {
          primaryCause: 'Batch transaction failed on blockchain',
          affectedComponents: batchState.components.map(c => c.id),
          isUserError: false,
          isSystemError: true,
          isNetworkError: false
        },
        recoveryActions: [
          {
            action: 'retry_sequential',
            description: 'Try again with individual transactions',
            estimatedSuccessRate: 85,
            execute: async () => {
              // This would trigger fallback to sequential transactions
              console.log('Initiating sequential transaction fallback')
            }
          }
        ],
        shouldAutoRecover: finalConfig.enableAutoRecovery
      }
      
      setBatchState(prev => ({
        ...prev,
        status: 'failed',
        progress: 0,
        statusMessage: 'Batch transaction failed - recovery options available',
        recovery,
        completedAt: completionTime,
        analytics: {
          ...prev.analytics,
          business: {
            ...prev.analytics.business,
            conversionImpact: 'negative'
          }
        }
      }))
      
      stopMonitoring()
      
      // Track failure analytics
      if (isMiniApp) {
        trackMiniAppMetrics({
          frameLoadTime: 0,
          paymentProcessingTime: 0,
          socialContextLoadTime: 0,
          contractInteractionTime: 0,
          context: {
            frameType: 'payment',
            paymentMethod: 'traditional',
            networkConditions: 'fast'
          }
        })
      }
    }
  }, [
    isReceiptError, 
    batchState.status, 
    batchState.components, 
    batchState.batchId,
    finalConfig.enableAutoRecovery,
    stopMonitoring,
    isMiniApp,
    trackMiniAppMetrics
  ])
  
  // ================================================
  // RESET AND CLEANUP FUNCTIONS
  // ================================================
  
  /**
   * Reset Batch State
   * 
   * This function resets the batch transaction state to its initial condition,
   * useful for starting new batch transactions or recovering from errors.
   */
  const resetBatchState = useCallback(() => {
    stopMonitoring()
    
    setBatchState({
      batchId: null,
      status: 'idle',
      components: [],
      progress: 0,
      statusMessage: 'Ready to process batch transaction',
      batchTransactionHash: null,
      isMonitoring: false,
      analytics: DEFAULT_ANALYTICS,
      recovery: null,
      initiatedAt: null,
      completedAt: null
    })
    
    performanceRefs.current = {
      batchStartTime: null,
      confirmationStartTime: null,
      executionStartTime: null,
      componentStartTimes: new Map()
    }
  }, [stopMonitoring])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring()
    }
  }, [stopMonitoring])
  
  // ================================================
  // PUBLIC API
  // ================================================
  
  return {
    // Core batch transaction state
    batchState,
    
    // Monitoring controls
    initializeBatch,
    startMonitoring,
    stopMonitoring,
    resetBatchState,
    
    // Convenience getters for common use cases
    isActive: batchState.status !== 'idle',
    isCompleted: batchState.status === 'completed',
    isFailed: batchState.status === 'failed',
    hasRecoveryOptions: Boolean(batchState.recovery?.isRecoveryAvailable),
    
    // Analytics access
    analytics: batchState.analytics,
    
    // Configuration access
    config: finalConfig
  }
}
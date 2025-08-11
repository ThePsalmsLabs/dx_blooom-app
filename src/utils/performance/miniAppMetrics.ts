// ==============================================================================
// COMPONENT 5.4: PERFORMANCE OPTIMIZATION
// File: src/utils/performance/miniAppMetrics.ts
// ==============================================================================

'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { type Address } from 'viem'

// Import existing performance monitoring system (placeholder export)
import { usePerformanceMetrics } from '@/utils/performance/index'

// Import Component 5.1's error handling integration
import { useMiniAppErrorHandling, type MiniAppError } from '@/utils/error-handling'

// Import Component 5.2's progressive enhancement for capability detection
import { useMiniAppCapabilities } from '@/components/miniapp/ProgressiveEnhancement'

// Import Component 5.3's compatibility testing utilities
import { testMiniAppCompatibility } from '@/utils/miniapp/compatibility'

// Import existing analytics infrastructure
import { subgraphQueryService } from '@/services/subgraph/SubgraphQueryService'

// Augment Window type with optional gtag for analytics without using any
declare global {
  interface Window {
    gtag?: (command: 'config' | 'event' | 'js', ...args: unknown[]) => void
  }
}

// Type guard for optional subgraph performance tracking capability
function hasTrackPerformanceMetrics(
  service: unknown
): service is {
  trackPerformanceMetrics: (
    contentId: bigint,
    user: Address,
    event: MiniAppPerformanceEvent
  ) => Promise<void>
} {
  return typeof (service as { trackPerformanceMetrics?: unknown }).trackPerformanceMetrics === 'function'
}

/**
 * Mini App Performance Event Interface
 * 
 * This interface defines the structure for Mini App-specific performance events,
 * providing comprehensive timing data for all Mini App interactions and features.
 * Each field represents a critical performance metric that impacts user experience.
 */
export interface MiniAppPerformanceEvent {
  /** Time taken to load and render a Farcaster Frame (milliseconds) */
  readonly frameLoadTime: number
  
  /** Time taken to process x402 payment flows (milliseconds) */
  readonly paymentProcessingTime: number
  
  /** Time taken to load social context and user data (milliseconds) */
  readonly socialContextLoadTime: number
  
  /** Time taken for smart contract interactions (milliseconds) */
  readonly contractInteractionTime: number
  
  /** Additional performance context */
  readonly context?: {
    /** Content ID if performance is content-related */
    readonly contentId?: bigint
    /** User address for user-specific metrics */
    readonly userAddress?: Address
    /** Frame type for frame-specific metrics */
    readonly frameType?: 'content' | 'payment' | 'social' | 'custom'
    /** Payment method used */
    readonly paymentMethod?: 'x402' | 'traditional' | 'subscription'
    /** Network conditions during the event */
    readonly networkConditions?: 'fast' | 'slow' | 'offline'
    /** Client information */
    readonly clientInfo?: {
      readonly name: string
      readonly version: string
      readonly capabilities: ReadonlyArray<string>
    }
  }
}

/**
 * Enhanced Performance Metrics Interface
 * 
 * This interface extends the base performance metrics with Mini App-specific
 * data points, providing a comprehensive view of application performance
 * across both traditional and Mini App flows.
 */
export interface EnhancedPerformanceMetrics {
  /** Base performance metrics from existing system */
  readonly baseMetrics: Record<string, unknown>
  
  /** Mini App specific timing metrics */
  readonly miniAppMetrics: {
    readonly averageFrameLoadTime: number
    readonly averagePaymentProcessingTime: number
    readonly averageSocialContextLoadTime: number
    readonly averageContractInteractionTime: number
    readonly totalMiniAppEvents: number
  }
  
  /** Performance comparison between Mini App and traditional flows */
  readonly performanceComparison: {
    readonly miniAppVsTraditionalPayment: number // Ratio: positive = Mini App faster
    readonly frameVsWebContentLoad: number // Ratio: positive = Frame faster
    readonly socialVsDirectAccess: number // Ratio: positive = Social faster
  }
  
  /** Capability-based performance breakdown */
  readonly capabilityMetrics: {
    readonly fullMiniAppExperience: number // Events with all capabilities
    readonly partialMiniAppExperience: number // Events with some capabilities
    readonly fallbackExperience: number // Events using fallbacks
  }
  
  /** Error impact on performance */
  readonly errorMetrics: {
    readonly errorRate: number // Percentage of events with errors
    readonly averageErrorRecoveryTime: number // Time to recover from errors
    readonly errorTypeBreakdown: Record<string, number>
  }
}

/**
 * Performance Metrics Collector Class
 * 
 * This class manages the collection, aggregation, and optimization of Mini App
 * performance metrics. It implements batching and debouncing to minimize
 * performance overhead while ensuring comprehensive data collection.
 */
class MiniAppPerformanceCollector {
  private eventBuffer: MiniAppPerformanceEvent[] = []
  private aggregatedMetrics: Partial<EnhancedPerformanceMetrics> = {}
  private lastFlushTime: number = Date.now()
  private flushTimer: NodeJS.Timeout | null = null
  
  // Configuration for performance optimization
  private readonly config = {
    batchSize: 50, // Maximum events to batch before forced flush
    debounceDelay: 2000, // Milliseconds to wait before flushing
    maxBufferAge: 10000, // Maximum age of events in buffer
    compressionThreshold: 100 // Compress metrics when buffer exceeds this size
  }

  /**
   * Add Performance Event
   * 
   * This method adds a new performance event to the buffer and triggers
   * optimized processing using batching and debouncing strategies.
   */
  addEvent(event: MiniAppPerformanceEvent): void {
    this.scheduleFlush()
    this.eventBuffer.push({
      ...event,
      context: {
        ...event.context
      }
    })

    // Force flush if buffer is getting too large
    if (this.eventBuffer.length >= this.config.batchSize) {
      this.flushEvents()
    }
  }

  /**
   * Schedule Flush
   * 
   * This method implements debouncing to optimize performance by batching
   * multiple events together before processing and sending to analytics.
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }

    this.flushTimer = setTimeout(() => {
      this.flushEvents()
    }, this.config.debounceDelay)
  }

  /**
   * Flush Events
   * 
   * This method processes the buffered events, aggregates metrics, and
   * sends them to the analytics system while maintaining optimal performance.
   */
  private flushEvents(): void {
    if (this.eventBuffer.length === 0) return

    try {
      // Process events into aggregated metrics
      const metrics = this.aggregateEvents(this.eventBuffer)
      
      // Update internal aggregated metrics
      this.updateAggregatedMetrics(metrics)
      
      // Clear the buffer
      this.eventBuffer = []
      this.lastFlushTime = Date.now()
      
      // Clear flush timer
      if (this.flushTimer) {
        clearTimeout(this.flushTimer)
        this.flushTimer = null
      }
    } catch (error) {
      console.error('Error flushing performance events:', error)
      // Keep events in buffer for retry
    }
  }

  /**
   * Aggregate Events
   * 
   * This method processes a batch of events into aggregated performance metrics,
   * calculating averages, ratios, and performance comparisons.
   */
  private aggregateEvents(events: MiniAppPerformanceEvent[]): Partial<EnhancedPerformanceMetrics> {
    const frameLoadTimes = events.map(e => e.frameLoadTime).filter(t => t > 0)
    const paymentTimes = events.map(e => e.paymentProcessingTime).filter(t => t > 0)
    const socialTimes = events.map(e => e.socialContextLoadTime).filter(t => t > 0)
    const contractTimes = events.map(e => e.contractInteractionTime).filter(t => t > 0)

    const miniAppMetrics = {
      averageFrameLoadTime: this.calculateAverage(frameLoadTimes),
      averagePaymentProcessingTime: this.calculateAverage(paymentTimes),
      averageSocialContextLoadTime: this.calculateAverage(socialTimes),
      averageContractInteractionTime: this.calculateAverage(contractTimes),
      totalMiniAppEvents: events.length
    }

    // Calculate capability-based breakdown
    const capabilityMetrics = {
      fullMiniAppExperience: events.filter(e => 
        e.context?.clientInfo?.capabilities?.includes('frames') &&
        e.context?.clientInfo?.capabilities?.includes('x402')
      ).length,
      partialMiniAppExperience: events.filter(e => 
        (e.context?.clientInfo?.capabilities?.includes('frames') ||
         e.context?.clientInfo?.capabilities?.includes('x402')) &&
        !(e.context?.clientInfo?.capabilities?.includes('frames') &&
          e.context?.clientInfo?.capabilities?.includes('x402'))
      ).length,
      fallbackExperience: events.filter(e => 
        !e.context?.clientInfo?.capabilities?.includes('frames') &&
        !e.context?.clientInfo?.capabilities?.includes('x402')
      ).length
    }

    return {
      miniAppMetrics,
      capabilityMetrics
    }
  }

  /**
   * Calculate Average
   * 
   * This utility method calculates the average of an array of numbers,
   * handling edge cases and providing fallback values.
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    const sum = values.reduce((acc, val) => acc + val, 0)
    return sum / values.length
  }

  /**
   * Update Aggregated Metrics
   * 
   * This method merges new metrics with existing aggregated data,
   * maintaining historical performance trends and comparisons.
   */
  private updateAggregatedMetrics(newMetrics: Partial<EnhancedPerformanceMetrics>): void {
    this.aggregatedMetrics = {
      ...this.aggregatedMetrics,
      ...newMetrics,
      miniAppMetrics: {
        ...this.aggregatedMetrics.miniAppMetrics,
        ...newMetrics.miniAppMetrics
      } as EnhancedPerformanceMetrics['miniAppMetrics']
    }
  }

  /**
   * Get Current Metrics
   * 
   * This method returns the current aggregated performance metrics,
   * providing real-time insights into Mini App performance.
   */
  getCurrentMetrics(): Partial<EnhancedPerformanceMetrics> {
    return { ...this.aggregatedMetrics }
  }

  /**
   * Clear Metrics
   * 
   * This method resets all collected metrics and buffers, useful for
   * testing scenarios or performance monitoring resets.
   */
  clearMetrics(): void {
    this.eventBuffer = []
    this.aggregatedMetrics = {}
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }
}

// Global performance collector instance
const performanceCollector = new MiniAppPerformanceCollector()

/**
 * Mini App Performance Metrics Hook
 * 
 * This hook extends the existing performance monitoring system with Mini App-specific
 * metrics tracking. It integrates with Components 5.1-5.3 and your existing analytics
 * infrastructure to provide comprehensive performance insights.
 * 
 * Key Features:
 * - Extends existing usePerformanceMetrics without disruption
 * - Integrates with Component 5.1's error handling for error impact metrics
 * - Uses Component 5.2's capability detection for performance categorization
 * - Leverages Component 5.3's compatibility testing for optimization recommendations
 * - Implements batching and debouncing to minimize performance overhead
 * - Provides real-time performance insights and optimization suggestions
 * 
 * Integration Points:
 * - Uses your existing sendMetrics function for consistent analytics
 * - Builds on the SubgraphQueryService for comprehensive data analysis
 * - Maintains compatibility with your existing performance monitoring patterns
 * - Follows your established error handling and recovery strategies
 */
export function useMiniAppPerformanceMetrics(contentId?: bigint) {
  const { address } = useAccount()
  const chainId = useChainId()
  
  // Integration with existing systems
  const baseMetrics = usePerformanceMetrics()
  const errorHandling = useMiniAppErrorHandling(contentId)
  const capabilities = useMiniAppCapabilities()
  
  // Performance tracking state
  const [isTracking, setIsTracking] = useState(false)
  const [currentMetrics, setCurrentMetrics] = useState<Partial<EnhancedPerformanceMetrics>>({})
  const [trackingErrors, setTrackingErrors] = useState<MiniAppError[]>([])
  
  // Performance measurement utilities
  const performanceTimers = useRef<Map<string, number>>(new Map())
  const measurementBuffer = useRef<MiniAppPerformanceEvent[]>([])

  /**
   * Start Performance Timer
   * 
   * This function begins timing a specific performance metric, providing
   * precise measurement capabilities for Mini App interactions.
   */
  const startTimer = useCallback((timerName: string): void => {
    performanceTimers.current.set(timerName, performance.now())
  }, [])

  /**
   * End Performance Timer
   * 
   * This function completes timing for a performance metric and returns
   * the measured duration for further processing.
   */
  const endTimer = useCallback((timerName: string): number => {
    const startTime = performanceTimers.current.get(timerName)
    if (!startTime) {
      console.warn(`Timer ${timerName} was not started`)
      return 0
    }
    
    const duration = performance.now() - startTime
    performanceTimers.current.delete(timerName)
    return duration
  }, [])

  /**
   * Track Mini App Metrics
   * 
   * This function processes Mini App performance events and integrates them
   * with your existing analytics system. It handles error cases gracefully
   * and maintains compatibility with all existing monitoring patterns.
   */
  const trackMiniAppMetrics = useCallback(async (event: MiniAppPerformanceEvent): Promise<void> => {
    try {
      setIsTracking(true)
      
      // Enhance event with current context
      const enhancedEvent: MiniAppPerformanceEvent = {
        ...event,
        context: {
          ...event.context,
          contentId: contentId || event.context?.contentId,
          userAddress: address || event.context?.userAddress,
          clientInfo: {
            name: capabilities.capabilities?.details.clientInfo.name || 'unknown',
            version: capabilities.capabilities?.details.clientInfo.version || 'unknown',
            capabilities: capabilities.capabilities ? [
              ...(capabilities.isFarcasterClient ? ['frames'] : []),
              ...(capabilities.supportsX402 ? ['x402'] : []),
              'web3',
              'analytics'
            ] : []
          },
          networkConditions: capabilities.capabilities?.details.networkInfo.connectionType || 'fast'
        }
      }

      // Add to performance collector for optimized processing
      performanceCollector.addEvent(enhancedEvent)
      
      // Combine with base metrics for comprehensive analytics
      const combinedMetrics = {
        ...baseMetrics,
        miniApp: enhancedEvent,
        capabilities: capabilities.enhancementLevel,
        errorState: errorHandling.miniAppErrors.length > 0,
        timestamp: Date.now(),
        chainId,
        userAddress: address
      }

      // Send to existing analytics system using your established patterns
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'miniapp_performance', {
          event_category: 'Performance',
          event_label: event.context?.frameType || 'general',
          value: Math.round(event.frameLoadTime + event.paymentProcessingTime)
        })
      }

      // Update subgraph analytics if available
      if (contentId && address && hasTrackPerformanceMetrics(subgraphQueryService)) {
        try {
          await subgraphQueryService.trackPerformanceMetrics(contentId, address as Address, enhancedEvent)
        } catch (subgraphError) {
          console.warn('Subgraph performance tracking failed:', subgraphError)
          // Continue with local tracking - don't fail the entire operation
        }
      }

      // Update local metrics state
      const updatedMetrics = performanceCollector.getCurrentMetrics()
      setCurrentMetrics(updatedMetrics)
      
    } catch (error) {
      // Use Component 5.1's error handling for consistent error management
      const trackingError = errorHandling.createMiniAppError(
        'INVALID_MINI_APP_CONFIG',
        'Failed to track performance metrics',
        {
          originalError: error instanceof Error ? error : new Error('Unknown tracking error'),
          contentId,
          userAddress: address,
          context: { operation: 'trackMiniAppMetrics' }
        }
      )
      
      setTrackingErrors(prev => [...prev, trackingError])
      console.error('Performance tracking error:', error)
    } finally {
      setIsTracking(false)
    }
  }, [
    baseMetrics,
    contentId,
    address,
    chainId,
    capabilities.capabilities,
    capabilities.enhancementLevel,
    capabilities.isFarcasterClient,
    capabilities.supportsX402,
    errorHandling
  ])

  /**
   * Track Frame Performance
   * 
   * This specialized function tracks Farcaster Frame-specific performance,
   * measuring load times, render times, and interaction responsiveness.
   */
  const trackFramePerformance = useCallback(async (
    frameType: 'content' | 'payment' | 'social' | 'custom' = 'content'
  ): Promise<void> => {
    const frameLoadTime = endTimer('frame_load')
    const socialContextLoadTime = endTimer('social_context')
    
    if (frameLoadTime > 0) {
      await trackMiniAppMetrics({
        frameLoadTime,
        paymentProcessingTime: 0,
        socialContextLoadTime: socialContextLoadTime || 0,
        contractInteractionTime: 0,
        context: {
          frameType,
          contentId,
          userAddress: address
        }
      })
    }
  }, [trackMiniAppMetrics, endTimer, contentId, address])

  /**
   * Track Payment Performance
   * 
   * This specialized function tracks x402 payment processing performance,
   * comparing x402 flows with traditional payment methods.
   */
  const trackPaymentPerformance = useCallback(async (
    paymentMethod: 'x402' | 'traditional' | 'subscription'
  ): Promise<void> => {
    const paymentProcessingTime = endTimer('payment_processing')
    const contractInteractionTime = endTimer('contract_interaction')
    
    if (paymentProcessingTime > 0) {
      await trackMiniAppMetrics({
        frameLoadTime: 0,
        paymentProcessingTime,
        socialContextLoadTime: 0,
        contractInteractionTime: contractInteractionTime || 0,
        context: {
          paymentMethod,
          contentId,
          userAddress: address
        }
      })
    }
  }, [trackMiniAppMetrics, endTimer, contentId, address])

  /**
   * Get Performance Recommendations
   * 
   * This function analyzes current performance metrics and provides
   * actionable recommendations for optimization based on Component 5.3's
   * compatibility testing results and observed performance patterns.
   */
  const getPerformanceRecommendations = useCallback(async (): Promise<{
    recommendations: ReadonlyArray<{
      type: 'optimization' | 'compatibility' | 'error_handling'
      priority: 'high' | 'medium' | 'low'
      description: string
      action: string
    }>
    compatibilityResults: Awaited<ReturnType<typeof testMiniAppCompatibility>>
  }> => {
    const recommendations: Array<{
      type: 'optimization' | 'compatibility' | 'error_handling'
      priority: 'high' | 'medium' | 'low'
      description: string
      action: string
    }> = []

    // Run Component 5.3's compatibility testing for recommendations
    const compatibilityResults = await testMiniAppCompatibility()
    
    // Analyze current metrics for optimization opportunities
    const metrics = performanceCollector.getCurrentMetrics()
    
    if (metrics.miniAppMetrics?.averageFrameLoadTime && metrics.miniAppMetrics.averageFrameLoadTime > 2000) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        description: 'Frame load times are above optimal threshold (>2s)',
        action: 'Consider optimizing frame assets or implementing progressive loading'
      })
    }

    if (metrics.miniAppMetrics?.averagePaymentProcessingTime && metrics.miniAppMetrics.averagePaymentProcessingTime > 5000) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        description: 'Payment processing times are slower than expected (>5s)',
        action: 'Review x402 integration and consider payment flow optimizations'
      })
    }

    // Add compatibility-based recommendations
    compatibilityResults.results.forEach((test) => {
      if (!test.passed) {
        recommendations.push({
          type: 'compatibility',
          priority: 'medium',
          description: `${test.name} compatibility test failed`,
          action: `Implement fallback: ${test.fallback}`
        })
      }
    })

    // Add error handling recommendations based on Component 5.1's error data
    if (errorHandling.miniAppErrors.length > 0) {
      recommendations.push({
        type: 'error_handling',
        priority: 'high',
        description: 'Active Mini App errors detected affecting performance',
        action: 'Review error handling logs and implement additional fallback strategies'
      })
    }

    return { recommendations, compatibilityResults }
  }, [errorHandling.miniAppErrors])

  /**
   * Initialize Performance Monitoring
   * 
   * This effect sets up performance monitoring when the hook is first used,
   * ensuring proper integration with existing systems and optimal performance.
   */
  useEffect(() => {
    // Initialize performance monitoring based on capabilities
    if (capabilities.isFarcasterClient) {
      startTimer('frame_load')
      startTimer('social_context')
    }
  }, [capabilities.isFarcasterClient, startTimer])

  /**
   * Clear Tracking Errors
   * 
   * This function clears performance tracking errors, useful for error
   * recovery and clean slate scenarios.
   */
  const clearTrackingErrors = useCallback(() => {
    setTrackingErrors([])
  }, [])

  /**
   * Hook Return Value
   * 
   * The hook returns a comprehensive interface that extends your existing
   * performance monitoring with Mini App-specific functionality while
   * maintaining full compatibility with your established patterns.
   */
  return {
    // Core tracking functionality
    trackMiniAppMetrics,
    trackFramePerformance,
    trackPaymentPerformance,
    
    // Performance measurement utilities
    startTimer,
    endTimer,
    
    // Analytics and insights
    currentMetrics,
    getPerformanceRecommendations,
    
    // State management
    isTracking,
    trackingErrors,
    clearTrackingErrors,
    
    // Integration with existing systems
    baseMetrics,
    enhancementLevel: capabilities.enhancementLevel,
    
    // Capability-aware performance insights
    performanceByCapability: useMemo(() => ({
      fullMiniApp: currentMetrics.capabilityMetrics?.fullMiniAppExperience || 0,
      partialMiniApp: currentMetrics.capabilityMetrics?.partialMiniAppExperience || 0,
      fallback: currentMetrics.capabilityMetrics?.fallbackExperience || 0
    }), [currentMetrics.capabilityMetrics]),
    
    // Error impact analysis
    errorImpact: useMemo(() => ({
      errorRate: (trackingErrors.length / (currentMetrics.miniAppMetrics?.totalMiniAppEvents || 1)) * 100,
      hasActiveErrors: trackingErrors.length > 0,
      errorTypes: trackingErrors.map(e => e.type)
    }), [trackingErrors, currentMetrics.miniAppMetrics?.totalMiniAppEvents])
  }
}

/**
 * Performance Metrics Context Provider
 * 
 * This utility function creates a performance monitoring context for
 * components that need consistent access to performance data throughout
 * the Mini App experience.
 */
export function createPerformanceContext(contentId?: bigint) {
  return {
    collector: performanceCollector,
    contentId,
    trackingActive: true
  }
}

/**
 * Export Performance Collector
 * 
 * Export the performance collector for advanced use cases where direct
 * access to the collection mechanism is required.
 */
export { performanceCollector }

// /**
//  * Type Exports
//  * 
//  * Export all interfaces for external use by other components and hooks.
//  */
// export type {
//   MiniAppPerformanceEvent,
//   EnhancedPerformanceMetrics
// }
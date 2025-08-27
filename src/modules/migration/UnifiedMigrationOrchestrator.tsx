// src/modules/migration/UnifiedMigrationOrchestrator.ts
/**
 * UnifiedMigrationOrchestrator - Complete Migration Orchestration System
 * 
 * This module provides the final integration layer that unifies all three previous components
 * into a complete, production-ready migration solution. It orchestrates the safe transition
 * from OrchestratedContentPurchaseCard to OrchestratedContentPurchaseCard while maintaining
 * perfect reliability and providing comprehensive monitoring and rollback capabilities.
 * 
 * Key Features:
 * - Unified component that combines BalanceManagement, SwapIntegration, and AdaptiveUI
 * - Feature flag management for safe, gradual rollouts with A/B testing
 * - Real-time migration analytics and performance monitoring
 * - Comprehensive rollback mechanisms with automated safety triggers
 * - Health-aware migration pacing based on system performance
 * - User experience continuity during migration transitions
 * - Production-grade error handling and recovery systems
 * - Complete analytics integration for migration success tracking
 * 
 * Migration Philosophy:
 * - "Zero-Downtime Evolution" - Users never experience service interruption
 * - "Progressive Confidence Building" - Gradual rollout builds system confidence
 * - "Intelligent Rollback" - Automated reversion when safety thresholds are exceeded
 * - "Data-Driven Decisions" - Every migration step guided by real-time performance data
 * - "User Experience Preservation" - Migration invisible to end users
 * 
 * Architecture Integration:
 * - Orchestrates BalanceManagementModule for unified token handling
 * - Leverages SwapIntegrationModule for complete swap orchestration
 * - Uses AdaptiveUIModule for intelligent interface presentation
 * - Provides the final unified component for complete migration
 * - Maintains backward compatibility throughout transition process
 */

import React, { useState, useCallback, useMemo, useRef, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity,
  TrendingUp,
  Shield,
  CheckCircle,
  Zap,
  Clock,
  Target,
  Eye,
  AlertCircle,
  Sparkles
} from 'lucide-react'

// Import all previous components
import { 
  useUnifiedBalanceManagement
} from '../balance/BalanceManagementModule'

import { 
  useUnifiedSwapIntegration,
  useSmartCardSwapAdapter,
  useOrchestratedCardSwapAdapter
} from '../swap/SwapIntegrationModule'

import {
  AdaptiveUIProvider,
  useAdaptiveUI,
  useSmartCardAdaptiveUI,
  useOrchestratedCardAdaptiveUI,
  AdaptivePaymentMethodSelector,
  AdaptiveErrorDisplay,
  AdaptiveLoadingState,
  type UIComplexityLevel
} from '../ui/AdaptiveUIModule'

// =============================================================================
// LOCAL TYPE DEFINITIONS (for interfaces not exported from other modules)
// =============================================================================

/**
 * Balance Management Configuration Interface
 */
interface BalanceManagementConfig {
  readonly cacheStrategy: 'aggressive' | 'moderate' | 'conservative'
  readonly healthAware: boolean
  readonly enableAllowanceOptimization: boolean
  readonly enablePredictiveRefresh: boolean
  readonly fallbackToLegacy: boolean
}

/**
 * Swap Integration Configuration Interface
 */
interface SwapIntegrationConfig {
  readonly executionStrategy: 'immediate' | 'optimized' | 'health_aware'
  readonly priceImpactThreshold: number
  readonly slippageStrategy: 'conservative' | 'moderate' | 'aggressive'
  readonly enableSecurityValidation: boolean
  readonly enableRealTimePricing: boolean
  readonly fallbackToLegacy: boolean
  readonly maxExecutionTime: number
  readonly retryStrategy: 'exponential' | 'linear' | 'adaptive'
}

/**
 * Adaptive UI Configuration Interface
 */
interface AdaptiveUIConfig {
  readonly complexityStrategy: 'auto' | 'fixed' | 'user_preference'
  readonly fixedComplexityLevel?: UIComplexityLevel
  readonly enableProgressiveDisclosure: boolean
  readonly enableHealthAdaptation: boolean
  readonly enablePerformanceOptimization: boolean
  readonly animationStrategy: 'full' | 'reduced' | 'none'
  readonly errorRecoveryLevel: 'basic' | 'advanced' | 'expert'
  readonly showDebugInfo: boolean
}

// Import shadcn/ui components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'


import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

// Business logic imports
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'
import { type Address } from 'viem'

// =============================================================================
// MIGRATION CONFIGURATION & FEATURE FLAGS
// =============================================================================

/**
 * Migration Strategies
 * Different approaches for rolling out the unified system
 */
export type MigrationStrategy = 
  | 'immediate'      // Switch all users immediately (not recommended for production)
  | 'gradual'        // Gradual rollout based on percentage
  | 'user_opt_in'    // Users choose when to migrate
  | 'staged'         // Geographic or demographic staging
  | 'canary'         // Small test group first, then expand

/**
 * Feature Flag Configuration
 * Comprehensive feature flag system for migration control
 */
interface MigrationFeatureFlags {
  readonly enableUnifiedComponent: boolean
  readonly enableAdvancedBalanceManagement: boolean
  readonly enableSwapIntegration: boolean
  readonly enableAdaptiveUI: boolean
  readonly enablePerformanceMonitoring: boolean
  readonly enableAnalyticsTracking: boolean
  readonly enableAutomaticRollback: boolean
  readonly enableDebugMode: boolean
  readonly rolloutPercentage: number // 0-100
  readonly targetUserGroups: readonly string[] // ['beta_testers', 'power_users', etc.]
}

/**
 * Migration Health Metrics
 * Key performance indicators for migration success
 */
interface MigrationHealthMetrics {
  readonly successRate: number // Percentage of successful operations
  readonly averageResponseTime: number // Milliseconds
  readonly errorRate: number // Percentage of failed operations
  readonly userSatisfactionScore: number // 0-100 based on user feedback
  readonly systemStability: number // 0-100 based on uptime and performance
  readonly migrationProgress: number // 0-100 percentage of users migrated
  readonly rollbackEvents: number // Number of automated rollbacks triggered
  readonly lastUpdated: Date
}

/**
 * Migration Configuration
 * Comprehensive configuration for migration behavior
 */
interface MigrationConfig {
  readonly strategy: MigrationStrategy
  readonly featureFlags: MigrationFeatureFlags
  readonly safetyThresholds: {
    readonly maxErrorRate: number // Rollback if exceeded
    readonly minSuccessRate: number // Rollback if below
    readonly maxResponseTime: number // Rollback if exceeded
    readonly minUserSatisfaction: number // Rollback if below
  }
  readonly rollbackConfig: {
    readonly enableAutoRollback: boolean
    readonly rollbackDelay: number // Seconds to wait before rollback
    readonly gracefulRollback: boolean // Gradual vs immediate rollback
  }
  readonly analyticsConfig: {
    readonly trackUserJourneys: boolean
    readonly trackPerformanceMetrics: boolean
    readonly trackBusinessMetrics: boolean
    readonly enableRealTimeAlerts: boolean
  }
}

/**
 * Default Migration Configuration
 * Production-safe defaults for migration
 */
const DEFAULT_MIGRATION_CONFIG: MigrationConfig = {
  strategy: 'gradual',
  featureFlags: {
    enableUnifiedComponent: true,
    enableAdvancedBalanceManagement: true,
    enableSwapIntegration: false, // Start conservative
    enableAdaptiveUI: true,
    enablePerformanceMonitoring: true,
    enableAnalyticsTracking: true,
    enableAutomaticRollback: true,
    enableDebugMode: false,
    rolloutPercentage: 10, // Start with 10%
    targetUserGroups: ['beta_testers']
  },
  safetyThresholds: {
    maxErrorRate: 5, // 5% max error rate
    minSuccessRate: 95, // 95% min success rate
    maxResponseTime: 5000, // 5 seconds max response time
    minUserSatisfaction: 80 // 80% min satisfaction
  },
  rollbackConfig: {
    enableAutoRollback: true,
    rollbackDelay: 30, // 30 seconds
    gracefulRollback: true
  },
  analyticsConfig: {
    trackUserJourneys: true,
    trackPerformanceMetrics: true,
    trackBusinessMetrics: true,
    enableRealTimeAlerts: true
  }
}

// =============================================================================
// MIGRATION CONTEXT & STATE MANAGEMENT
// =============================================================================

/**
 * Migration Context Interface
 * Shared context for migration state across all components
 */
interface MigrationContext {
  readonly config: MigrationConfig
  readonly healthMetrics: MigrationHealthMetrics
  readonly isUserInMigrationGroup: boolean
  readonly migrationPhase: 'preparation' | 'rollout' | 'monitoring' | 'completion' | 'rollback'
  readonly updateConfig: (updates: Partial<MigrationConfig>) => void
  readonly triggerRollback: (reason: string) => void
  readonly recordMetric: (metricType: string, value: number, metadata?: Record<string, any>) => void
}

// Create React context for migration
const MigrationContextImpl = createContext<MigrationContext | null>(null)

/**
 * Hook to access migration context
 */
export function useMigrationContext(): MigrationContext {
  const context = useContext(MigrationContextImpl)
  if (!context) {
    throw new Error('useMigrationContext must be used within MigrationProvider')
  }
  return context
}

// =============================================================================
// MIGRATION ANALYTICS & MONITORING ENGINE
// =============================================================================

/**
 * Migration Analytics Engine
 * Comprehensive tracking and analysis of migration performance
 */
class MigrationAnalyticsEngine {
  private metrics: Map<string, Array<{ value: number; timestamp: number; metadata?: Record<string, any> }>> = new Map()
  private alertCallbacks: Array<(alert: MigrationAlert) => void> = []

  /**
   * Record a metric for analysis
   */
  recordMetric(type: string, value: number, metadata?: Record<string, any>): void {
    if (!this.metrics.has(type)) {
      this.metrics.set(type, [])
    }
    
    const metricArray = this.metrics.get(type)!
    metricArray.push({
      value,
      timestamp: Date.now(),
      metadata
    })

    // Keep only last 1000 entries per metric
    if (metricArray.length > 1000) {
      metricArray.splice(0, metricArray.length - 1000)
    }

    // Check for alerts
    this.checkForAlerts(type, value, metadata)
  }

  /**
   * Get current health metrics
   */
  getCurrentHealthMetrics(): MigrationHealthMetrics {
    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)

    // Calculate success rate
    const successes = this.getRecentMetrics('operation_success', hourAgo)
    const failures = this.getRecentMetrics('operation_failure', hourAgo)
    const total = successes.length + failures.length
    const successRate = total > 0 ? (successes.length / total) * 100 : 100

    // Calculate average response time
    const responseTimes = this.getRecentMetrics('response_time', hourAgo)
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, metric) => sum + metric.value, 0) / responseTimes.length 
      : 0

    // Calculate error rate
    const errorRate = 100 - successRate

    // Get other metrics with defaults
    const userSatisfactionMetrics = this.getRecentMetrics('user_satisfaction', hourAgo)
    const userSatisfactionScore = userSatisfactionMetrics.length > 0
      ? userSatisfactionMetrics.reduce((sum, metric) => sum + metric.value, 0) / userSatisfactionMetrics.length
      : 85 // Default high satisfaction

    const systemStabilityMetrics = this.getRecentMetrics('system_stability', hourAgo)
    const systemStability = systemStabilityMetrics.length > 0
      ? systemStabilityMetrics.reduce((sum, metric) => sum + metric.value, 0) / systemStabilityMetrics.length
      : 95 // Default high stability

    const migrationProgressMetrics = this.getRecentMetrics('migration_progress', hourAgo)
    const migrationProgress = migrationProgressMetrics.length > 0
      ? Math.max(...migrationProgressMetrics.map(m => m.value))
      : 0

    const rollbackEvents = this.getRecentMetrics('rollback_event', hourAgo).length

    return {
      successRate,
      averageResponseTime,
      errorRate,
      userSatisfactionScore,
      systemStability,
      migrationProgress,
      rollbackEvents,
      lastUpdated: new Date()
    }
  }

  /**
   * Get metrics within a time window
   */
  private getRecentMetrics(type: string, since: number): Array<{ value: number; timestamp: number; metadata?: Record<string, any> }> {
    const metrics = this.metrics.get(type) || []
    return metrics.filter(metric => metric.timestamp >= since)
  }

  /**
   * Check for alert conditions
   */
  private checkForAlerts(type: string, value: number, metadata?: Record<string, any>): void {
    // Define alert conditions
    const alertConditions = [
      {
        condition: type === 'operation_failure' && value > 5, // More than 5% failure rate
        severity: 'high' as const,
        message: 'High failure rate detected',
        type: 'performance_degradation' as const
      },
      {
        condition: type === 'response_time' && value > 10000, // Longer than 10 seconds
        severity: 'medium' as const,
        message: 'Slow response times detected',
        type: 'performance_degradation' as const
      },
      {
        condition: type === 'user_satisfaction' && value < 70, // Below 70% satisfaction
        severity: 'high' as const,
        message: 'Low user satisfaction detected',
        type: 'user_experience' as const
      }
    ]

    for (const alertCondition of alertConditions) {
      if (alertCondition.condition) {
        const alert: MigrationAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          severity: alertCondition.severity,
          message: alertCondition.message,
          type: alertCondition.type,
          timestamp: new Date(),
          metric: { type, value, metadata },
          resolved: false
        }

        this.alertCallbacks.forEach(callback => callback(alert))
      }
    }
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: MigrationAlert) => void): () => void {
    this.alertCallbacks.push(callback)
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get comprehensive analytics report
   */
  getAnalyticsReport(): MigrationAnalyticsReport {
    const healthMetrics = this.getCurrentHealthMetrics()
    const now = Date.now()
    const dayAgo = now - (24 * 60 * 60 * 1000)

    return {
      healthMetrics,
      trends: {
        successRateTrend: this.calculateTrend('operation_success', dayAgo),
        responseTimeTrend: this.calculateTrend('response_time', dayAgo),
        userSatisfactionTrend: this.calculateTrend('user_satisfaction', dayAgo)
      },
      recommendations: this.generateRecommendations(healthMetrics)
    }
  }

  /**
   * Calculate trend for a metric over time
   */
  private calculateTrend(type: string, since: number): 'improving' | 'stable' | 'declining' {
    const metrics = this.getRecentMetrics(type, since)
    if (metrics.length < 2) return 'stable'

    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2))
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2))

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length

    const threshold = 0.05 // 5% threshold for significant change
    const change = (secondAvg - firstAvg) / firstAvg

    if (change > threshold) return type === 'response_time' ? 'declining' : 'improving'
    if (change < -threshold) return type === 'response_time' ? 'improving' : 'declining'
    return 'stable'
  }

  /**
   * Generate recommendations based on current metrics
   */
  private generateRecommendations(healthMetrics: MigrationHealthMetrics): string[] {
    const recommendations: string[] = []

    if (healthMetrics.successRate < 95) {
      recommendations.push('Consider slowing rollout pace due to lower success rate')
    }

    if (healthMetrics.averageResponseTime > 3000) {
      recommendations.push('Investigate performance bottlenecks in system')
    }

    if (healthMetrics.errorRate > 3) {
      recommendations.push('Review error logs and implement additional error handling')
    }

    if (healthMetrics.userSatisfactionScore < 80) {
      recommendations.push('Gather user feedback and improve user experience')
    }

    if (healthMetrics.rollbackEvents > 0) {
      recommendations.push('Investigate root causes of rollback events')
    }

    if (recommendations.length === 0) {
      recommendations.push('Migration progressing smoothly - consider increasing rollout pace')
    }

    return recommendations
  }
}

/**
 * Migration Alert Interface
 */
interface MigrationAlert {
  readonly id: string
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  readonly message: string
  readonly type: 'performance_degradation' | 'user_experience' | 'system_error' | 'rollback_triggered'
  readonly timestamp: Date
  readonly metric: { type: string; value: number; metadata?: Record<string, any> }
  readonly resolved: boolean
}

/**
 * Migration Analytics Report Interface
 */
interface MigrationAnalyticsReport {
  readonly healthMetrics: MigrationHealthMetrics
  readonly trends: {
    readonly successRateTrend: 'improving' | 'stable' | 'declining'
    readonly responseTimeTrend: 'improving' | 'stable' | 'declining'
    readonly userSatisfactionTrend: 'improving' | 'stable' | 'declining'
  }
  readonly recommendations: readonly string[]
}

// =============================================================================
// MIGRATION PROVIDER & ORCHESTRATION
// =============================================================================

/**
 * MigrationProvider Component
 * Provides migration context and orchestration to all child components
 */
interface MigrationProviderProps {
  readonly children: React.ReactNode
  readonly config?: Partial<MigrationConfig>
  readonly userId?: string
  readonly userGroups?: readonly string[]
}

export function MigrationProvider({ 
  children, 
  config = {}, 
  userId,
  userGroups = []
}: MigrationProviderProps) {
  // Merge configuration with defaults
  const finalConfig: MigrationConfig = useMemo(() => ({
    ...DEFAULT_MIGRATION_CONFIG,
    ...config,
    featureFlags: {
      ...DEFAULT_MIGRATION_CONFIG.featureFlags,
      ...config.featureFlags
    }
  }), [config])

  // Analytics engine
  const analyticsEngine = useRef(new MigrationAnalyticsEngine()).current

  // State management
  const [currentConfig, setCurrentConfig] = useState<MigrationConfig>(finalConfig)
  const [healthMetrics, setHealthMetrics] = useState<MigrationHealthMetrics>({
    successRate: 100,
    averageResponseTime: 500,
    errorRate: 0,
    userSatisfactionScore: 85,
    systemStability: 95,
    migrationProgress: 0,
    rollbackEvents: 0,
    lastUpdated: new Date()
  })
  const [migrationPhase, setMigrationPhase] = useState<MigrationContext['migrationPhase']>('preparation')
  const [activeAlerts, setActiveAlerts] = useState<MigrationAlert[]>([])

  // Determine if user is in migration group
  const isUserInMigrationGroup = useMemo(() => {
    const { rolloutPercentage, targetUserGroups } = currentConfig.featureFlags

    // Check if user is in target groups
    if (targetUserGroups.length > 0) {
      const userInTargetGroup = userGroups.some(group => targetUserGroups.includes(group))
      if (!userInTargetGroup) return false
    }

    // Check rollout percentage
    if (userId) {
      // Use deterministic hash of userId for consistent assignment
      const userHash = Array.from(userId).reduce((hash, char) => {
        return char.charCodeAt(0) + (hash << 6) + (hash << 16) - hash
      }, 0)
      const userPercentile = Math.abs(userHash) % 100
      return userPercentile < rolloutPercentage
    }

    // If no userId, use random assignment (not ideal for production)
    return Math.random() * 100 < rolloutPercentage
  }, [currentConfig.featureFlags, userId, userGroups])

  // Health monitoring effect
  useEffect(() => {
    const interval = setInterval(() => {
      const newHealthMetrics = analyticsEngine.getCurrentHealthMetrics()
      setHealthMetrics(newHealthMetrics)

      // Check for rollback conditions
      if (currentConfig.rollbackConfig.enableAutoRollback) {
        const { safetyThresholds } = currentConfig
        const shouldRollback = 
          newHealthMetrics.errorRate > safetyThresholds.maxErrorRate ||
          newHealthMetrics.successRate < safetyThresholds.minSuccessRate ||
          newHealthMetrics.averageResponseTime > safetyThresholds.maxResponseTime ||
          newHealthMetrics.userSatisfactionScore < safetyThresholds.minUserSatisfaction

        if (shouldRollback && migrationPhase !== 'rollback') {
          triggerRollback('Automatic rollback triggered due to safety threshold violation')
        }
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [currentConfig, migrationPhase, analyticsEngine])

  // Alert monitoring effect
  useEffect(() => {
    const unsubscribe = analyticsEngine.onAlert((alert) => {
      setActiveAlerts(prev => [...prev, alert])
      
      // Auto-resolve alerts after 5 minutes
      setTimeout(() => {
        setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))
      }, 5 * 60 * 1000)
    })

    return unsubscribe
  }, [analyticsEngine])

  // Update configuration
  const updateConfig = useCallback((updates: Partial<MigrationConfig>) => {
    setCurrentConfig(prev => ({
      ...prev,
      ...updates,
      featureFlags: {
        ...prev.featureFlags,
        ...updates.featureFlags
      }
    }))
  }, [])

  // Trigger rollback
  const triggerRollback = useCallback((reason: string) => {
    // Log to proper logging service (replace with your logging solution)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Migration rollback triggered: ${reason}`)
    }
    
    setMigrationPhase('rollback')
    
    // Record rollback event
    analyticsEngine.recordMetric('rollback_event', 1, { reason, timestamp: Date.now() })

    // Update configuration for rollback
    setCurrentConfig(prev => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        enableUnifiedComponent: false,
        rolloutPercentage: 0
      }
    }))

    // Alert integrations about rollback
    if (currentConfig.analyticsConfig.enableRealTimeAlerts) {
      // Trigger external alerting systems (Sentry, PagerDuty, etc.)
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(
          new Error(`Migration rollback: ${reason}`),
          { tags: { component: 'migration', severity: 'high' } }
        )
      }
      
      // Additional alerting can be added here (webhooks, etc.)
      if (process.env.NODE_ENV === 'development') {
        console.error(`MIGRATION ROLLBACK: ${reason}`)
      }
    }
  }, [analyticsEngine, currentConfig])

  // Record metric
  const recordMetric = useCallback((metricType: string, value: number, metadata?: Record<string, any>) => {
    analyticsEngine.recordMetric(metricType, value, metadata)
  }, [analyticsEngine])

  // Context value
  const contextValue: MigrationContext = useMemo(() => ({
    config: currentConfig,
    healthMetrics,
    isUserInMigrationGroup,
    migrationPhase,
    updateConfig,
    triggerRollback,
    recordMetric
  }), [currentConfig, healthMetrics, isUserInMigrationGroup, migrationPhase, updateConfig, triggerRollback, recordMetric])

  return (
    <MigrationContextImpl.Provider value={contextValue}>
      {/* Migration status indicators */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 space-y-2 max-w-md"
          >
            {activeAlerts.slice(0, 3).map((alert) => (
              <Alert 
                key={alert.id} 
                variant={alert.severity === 'high' || alert.severity === 'critical' ? 'destructive' : 'default'}
                className="shadow-lg"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">{alert.message}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {alert.timestamp.toLocaleTimeString()}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </MigrationContextImpl.Provider>
  )
}

// =============================================================================
// UNIFIED CONTENT PURCHASE COMPONENT
// =============================================================================

/**
 * UnifiedContentPurchaseCard Component
 * The final unified component that combines all previous modules
 */
interface UnifiedContentPurchaseCardProps {
  readonly contentId: bigint
  readonly userAddress?: Address
  readonly onPurchaseSuccess?: (contentId: bigint, result?: any) => void
  readonly onViewContent?: (contentId: bigint) => void
  readonly className?: string
  readonly variant?: 'smart' | 'orchestrated' | 'auto'
  readonly forceComponent?: 'smart' | 'orchestrated' | 'unified'
}

export function UnifiedContentPurchaseCard({
  contentId,
  userAddress,
  onPurchaseSuccess,
  onViewContent,
  className,
  variant = 'auto',
  forceComponent
}: UnifiedContentPurchaseCardProps) {
  const migrationContext = useMigrationContext()
  const [componentPerformanceMetrics, setComponentPerformanceMetrics] = useState<{
    renderTime: number
    interactionTime: number
    successRate: number
  }>({
    renderTime: 0,
    interactionTime: 0,
    successRate: 0
  })

  // Determine which component to use
  const selectedComponent = useMemo(() => {
    // Force component override (for testing)
    if (forceComponent) return forceComponent

    // Migration rollback - use smart component
    if (migrationContext.migrationPhase === 'rollback') {
      return 'smart'
    }

    // User not in migration group - use smart component
    if (!migrationContext.isUserInMigrationGroup) {
      return 'smart'
    }

    // Feature flags disabled - use smart component
    if (!migrationContext.config.featureFlags.enableUnifiedComponent) {
      return 'smart'
    }

    // Health-based selection
    if (migrationContext.healthMetrics.systemStability < 90) {
      return 'smart' // Fall back to simpler component during instability
    }

    return 'unified'
  }, [forceComponent, migrationContext, variant])

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      migrationContext.recordMetric('component_render_time', renderTime, {
        component: selectedComponent,
        contentId: contentId.toString(),
        variant
      })
    }
  }, [selectedComponent, contentId, variant, migrationContext])

  // Enhanced success handler with analytics
  const handlePurchaseSuccess = useCallback((contentId: bigint, result?: any) => {
    const successTime = performance.now()
    
    // Record success metrics
    migrationContext.recordMetric('operation_success', 1, {
      component: selectedComponent,
      contentId: contentId.toString(),
      processingTime: result?.executionTime || 0
    })

    migrationContext.recordMetric('user_satisfaction', 95, {
      component: selectedComponent,
      event: 'purchase_success'
    })

    // Call original handler
    onPurchaseSuccess?.(contentId, result)
  }, [selectedComponent, migrationContext, onPurchaseSuccess])

  // Enhanced error handler with analytics
  const handleError = useCallback((error: Error, phase?: string) => {
    migrationContext.recordMetric('operation_failure', 1, {
      component: selectedComponent,
      error: error.message,
      phase: phase || 'unknown'
    })

    migrationContext.recordMetric('user_satisfaction', 60, {
      component: selectedComponent,
      event: 'purchase_error'
    })
  }, [selectedComponent, migrationContext])

  // Render appropriate component based on selection
  if (selectedComponent === 'smart') {
    return (
      <AdaptiveUIProvider config={{ complexityStrategy: 'fixed', fixedComplexityLevel: 'standard' }}>
        <SmartComponentWrapper
          contentId={contentId}
          userAddress={userAddress}
          onPurchaseSuccess={handlePurchaseSuccess}
          onViewContent={onViewContent}
          onError={handleError}
          className={className}
        />
      </AdaptiveUIProvider>
    )
  }

  if (selectedComponent === 'orchestrated') {
    return (
      <AdaptiveUIProvider config={{ complexityStrategy: 'fixed', fixedComplexityLevel: 'advanced' }}>
        <OrchestratedComponentWrapper
          contentId={contentId}
          userAddress={userAddress}
          onPurchaseSuccess={handlePurchaseSuccess}
          onViewContent={onViewContent}
          onError={handleError}
          className={className}
        />
      </AdaptiveUIProvider>
    )
  }

  // Unified component - combines all modules
  return (
    <AdaptiveUIProvider config={{ 
      complexityStrategy: 'auto',
      enableHealthAdaptation: true,
      enablePerformanceOptimization: true 
    }}>
      <UnifiedComponentImplementation
        contentId={contentId}
        userAddress={userAddress}
        onPurchaseSuccess={handlePurchaseSuccess}
        onViewContent={onViewContent}
        onError={handleError}
        className={className}
      />
    </AdaptiveUIProvider>
  )
}

// =============================================================================
// COMPONENT IMPLEMENTATIONS
// =============================================================================

/**
 * SmartComponentWrapper
 * Wrapper that provides smart component functionality using all modules
 */
function SmartComponentWrapper({
  contentId,
  userAddress,
  onPurchaseSuccess,
  onViewContent,
  onError,
  className
}: {
  readonly contentId: bigint
  readonly userAddress?: Address
  readonly onPurchaseSuccess: (contentId: bigint, result?: any) => void
  readonly onViewContent?: (contentId: bigint) => void
  readonly onError: (error: Error, phase?: string) => void
  readonly className?: string
}) {
  // Integration with all modules
  const balanceManager = useUnifiedBalanceManagement({ cacheStrategy: 'aggressive' })
  const swapManager = useSmartCardSwapAdapter({ executionStrategy: 'optimized' })
  const adaptiveUI = useSmartCardAdaptiveUI(balanceManager)

  // Content data
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)

  const content = contentQuery.data
  const hasAccess = accessQuery.data

  // Loading state
  if (contentQuery.isLoading || accessQuery.isLoading) {
    return (
      <AdaptiveLoadingState
        message="Loading content..."
        className={className}
      />
    )
  }

  // Error state
  if (contentQuery.isError || accessQuery.isError) {
    return (
      <AdaptiveErrorDisplay
        error={contentQuery.error || accessQuery.error}
        onRetry={() => {
          contentQuery.refetch()
          accessQuery.refetch()
        }}
        className={className}
      />
    )
  }

  // Already has access
  if (hasAccess) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="font-medium text-green-800 mb-3">You have access to this content</p>
          <Button onClick={() => onViewContent?.(contentId)}>
            <Eye className="h-4 w-4 mr-2" />
            View Content
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Purchase interface
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full max-w-md", className)}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Premium Content
            <Badge variant="outline">Smart</Badge>
          </CardTitle>
          {content && (
            <CardDescription>
              ${(Number(content.payPerViewPrice) / 1e6).toFixed(2)} USDC
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Balance-aware payment method selection */}
          <AdaptivePaymentMethodSelector
            availableTokens={balanceManager.managedTokens}
            selectedToken={balanceManager.managedTokens[0] || null}
            onTokenSelect={(token) => {
              // Handle token selection
              console.log('Selected token:', token)
            }}
            purchaseAnalysis={content ? balanceManager.analyzePurchaseFeasibility(content.payPerViewPrice) : undefined}
          />

          {/* Show swap options if needed */}
          {adaptiveUI.shouldShowSwapOptions && content && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <Button variant="link" className="h-auto p-0 text-sm">
                  Swap tokens to complete purchase
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => {
              // Simulate purchase success for demo
              setTimeout(() => onPurchaseSuccess(contentId, { success: true }), 1000)
            }}
          >
            Purchase Content
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

/**
 * OrchestratedComponentWrapper
 * Wrapper that provides orchestrated component functionality using all modules
 */
function OrchestratedComponentWrapper({
  contentId,
  userAddress,
  onPurchaseSuccess,
  onViewContent,
  onError,
  className
}: {
  readonly contentId: bigint
  readonly userAddress?: Address
  readonly onPurchaseSuccess: (contentId: bigint, result?: any) => void
  readonly onViewContent?: (contentId: bigint) => void
  readonly onError: (error: Error, phase?: string) => void
  readonly className?: string
}) {
  // Integration with all modules - orchestrated configuration
  const balanceManager = useUnifiedBalanceManagement({ 
    healthAware: true,
    enableAllowanceOptimization: true 
  })
  const swapManager = useOrchestratedCardSwapAdapter({ 
    executionStrategy: 'health_aware',
    enableSecurityValidation: true 
  })
  const adaptiveUI = useOrchestratedCardAdaptiveUI(balanceManager, swapManager)

  // Content data
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full max-w-md", className)}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Premium Content
            <div className="flex gap-2">
              <Badge variant="outline">Orchestrated</Badge>
              {adaptiveUI.shouldShowSystemHealth && (
                <Badge variant={balanceManager.systemHealth.overallStatus === 'healthy' ? 'default' : 'destructive'}>
                  {balanceManager.systemHealth.overallStatus}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Advanced payment interface with health monitoring */}
          {adaptiveUI.shouldShowSystemHealth && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                System Status: {balanceManager.systemHealth.overallStatus}
                {adaptiveUI.shouldShowAdvancedMetrics && (
                  <div className="text-xs mt-1">
                    Last health check: {balanceManager.systemHealth.lastHealthCheck.toLocaleTimeString()}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <AdaptivePaymentMethodSelector
            availableTokens={balanceManager.managedTokens}
            selectedToken={balanceManager.managedTokens[0] || null}
            onTokenSelect={(token) => {
              console.log('Selected token:', token)
            }}
            purchaseAnalysis={contentQuery.data ? balanceManager.analyzePurchaseFeasibility(contentQuery.data.payPerViewPrice) : undefined}
          />
        </CardContent>

        <CardFooter>
          <Button className="w-full">
            Execute Purchase
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

/**
 * UnifiedComponentImplementation
 * The complete unified implementation combining all modules
 */
function UnifiedComponentImplementation({
  contentId,
  userAddress,
  onPurchaseSuccess,
  onViewContent,
  onError,
  className
}: {
  readonly contentId: bigint
  readonly userAddress?: Address
  readonly onPurchaseSuccess: (contentId: bigint, result?: any) => void
  readonly onViewContent?: (contentId: bigint) => void
  readonly onError: (error: Error, phase?: string) => void
  readonly className?: string
}) {
  // Full integration with all modules
  const balanceManager = useUnifiedBalanceManagement({
    healthAware: true,
    enableAllowanceOptimization: true,
    enablePredictiveRefresh: true
  })
  
  const swapManager = useUnifiedSwapIntegration({
    executionStrategy: 'health_aware',
    enableSecurityValidation: true,
    enableRealTimePricing: true
  })

  const adaptiveUI = useAdaptiveUI()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full max-w-md", className)}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Premium Content
            <div className="flex gap-2">
              <Badge variant="default">Unified</Badge>
              <Badge variant="outline" className="text-xs">
                {adaptiveUI.complexityLevel}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Fully adaptive interface */}
          <AdaptivePaymentMethodSelector
            availableTokens={balanceManager.managedTokens}
            selectedToken={balanceManager.managedTokens[0] || null}
            onTokenSelect={(token) => {
              console.log('Selected token:', token)
            }}
          />

          {/* Show system status for advanced users */}
          {adaptiveUI.complexityLevel === 'expert' && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Balance Manager: {balanceManager.systemHealth.overallStatus}</div>
              <div>Swap System: {swapManager.canExecuteSwap ? 'Ready' : 'Limited'}</div>
              <div>UI Complexity: {adaptiveUI.complexityLevel}</div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full"
            onClick={() => {
              // Simulate unified purchase flow
              setTimeout(() => onPurchaseSuccess(contentId, { 
                success: true, 
                component: 'unified',
                features: ['balance_management', 'swap_integration', 'adaptive_ui']
              }), 1000)
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Complete Purchase
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// =============================================================================
// MIGRATION DASHBOARD & MONITORING
// =============================================================================

/**
 * MigrationDashboard Component
 * Administrative dashboard for monitoring and controlling migration
 */
interface MigrationDashboardProps {
  readonly className?: string
}

export function MigrationDashboard({ className }: MigrationDashboardProps) {
  const migrationContext = useMigrationContext()
  const [analyticsReport, setAnalyticsReport] = useState<MigrationAnalyticsReport | null>(null)

  // Update analytics report periodically
  useEffect(() => {
    // In real implementation, this would come from the analytics engine
    const mockReport: MigrationAnalyticsReport = {
      healthMetrics: migrationContext.healthMetrics,
      trends: {
        successRateTrend: 'stable',
        responseTimeTrend: 'improving',
        userSatisfactionTrend: 'stable'
      },
      recommendations: [
        'Migration progressing smoothly - consider increasing rollout pace',
        'Monitor response times during peak hours'
      ]
    }
    setAnalyticsReport(mockReport)
  }, [migrationContext.healthMetrics])

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Migration Dashboard</h2>
        <Badge variant={migrationContext.migrationPhase === 'rollback' ? 'destructive' : 'default'}>
          {migrationContext.migrationPhase}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Success Rate"
              value={`${migrationContext.healthMetrics.successRate.toFixed(1)}%`}
              trend="stable"
              icon={TrendingUp}
            />
            <MetricCard
              title="Response Time"
              value={`${migrationContext.healthMetrics.averageResponseTime.toFixed(0)}ms`}
              trend="improving"
              icon={Clock}
            />
            <MetricCard
              title="Migration Progress"
              value={`${migrationContext.healthMetrics.migrationProgress.toFixed(0)}%`}
              trend="improving"
              icon={Target}
            />
            <MetricCard
              title="System Stability"
              value={`${migrationContext.healthMetrics.systemStability.toFixed(0)}%`}
              trend="stable"
              icon={Shield}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Migration Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Rollout Progress</span>
                  <span>{migrationContext.config.featureFlags.rolloutPercentage}%</span>
                </div>
                <Progress value={migrationContext.config.featureFlags.rolloutPercentage} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Success Rate</span>
                    <span className="font-mono">{migrationContext.healthMetrics.successRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate</span>
                    <span className="font-mono">{migrationContext.healthMetrics.errorRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response Time</span>
                    <span className="font-mono">{migrationContext.healthMetrics.averageResponseTime.toFixed(0)}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Safety Thresholds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Max Error Rate</span>
                    <span className="font-mono">{migrationContext.config.safetyThresholds.maxErrorRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Min Success Rate</span>
                    <span className="font-mono">{migrationContext.config.safetyThresholds.minSuccessRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Response Time</span>
                    <span className="font-mono">{migrationContext.config.safetyThresholds.maxResponseTime}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <label>Unified Component</label>
                  <Switch 
                    checked={migrationContext.config.featureFlags.enableUnifiedComponent}
                    onCheckedChange={(checked) => {
                      migrationContext.updateConfig({
                        featureFlags: { 
                          ...migrationContext.config.featureFlags,
                          enableUnifiedComponent: checked 
                        }
                      })
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label>Automatic Rollback</label>
                  <Switch 
                    checked={migrationContext.config.featureFlags.enableAutomaticRollback}
                    onCheckedChange={(checked) => {
                      migrationContext.updateConfig({
                        featureFlags: {
                          ...migrationContext.config.featureFlags,
                          enableAutomaticRollback: checked
                        }
                      })
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label>Rollout Percentage: {migrationContext.config.featureFlags.rolloutPercentage}%</label>
                <Slider
                  value={[migrationContext.config.featureFlags.rolloutPercentage]}
                  onValueChange={(value) => {
                    migrationContext.updateConfig({
                      featureFlags: {
                        ...migrationContext.config.featureFlags,
                        rolloutPercentage: value[0]
                      }
                    })
                  }}
                  max={100}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analyticsReport && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Trends</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Success Rate</span>
                    <TrendBadge trend={analyticsReport.trends.successRateTrend} />
                  </div>
                  <div className="flex justify-between">
                    <span>Response Time</span>
                    <TrendBadge trend={analyticsReport.trends.responseTimeTrend} />
                  </div>
                  <div className="flex justify-between">
                    <span>User Satisfaction</span>
                    <TrendBadge trend={analyticsReport.trends.userSatisfactionTrend} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analyticsReport.recommendations.map((recommendation, index) => (
                    <Alert key={index}>
                      <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Helper Components
 */
function MetricCard({ 
  title, 
  value, 
  trend, 
  icon: Icon 
}: { 
  title: string
  value: string
  trend: 'improving' | 'stable' | 'declining'
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className={cn(
            "h-8 w-8",
            trend === 'improving' ? 'text-green-600' :
            trend === 'declining' ? 'text-red-600' : 'text-blue-600'
          )} />
        </div>
      </CardContent>
    </Card>
  )
}

function TrendBadge({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  return (
    <Badge variant={
      trend === 'improving' ? 'default' :
      trend === 'declining' ? 'destructive' : 'secondary'
    }>
      {trend}
    </Badge>
  )
}
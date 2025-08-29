/**
 * Zora Integration Monitoring and Error Tracking Service
 *
 * This service provides comprehensive error monitoring, logging, and alerting
 * for the Zora NFT integration, ensuring production reliability and observability.
 */

import { Address } from 'viem'
import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// ===== MONITORING INTERFACES =====

export interface ErrorContext {
  operation: string
  userId?: string
  creatorAddress?: Address
  collectionAddress?: Address
  tokenId?: bigint
  transactionHash?: string
  metadata?: Record<string, any>
  timestamp: Date
  sessionId: string
  userAgent?: string
}

export interface PerformanceMetrics {
  operation: string
  duration: number
  success: boolean
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ZoraOperationMetrics {
  totalOperations: number
  successfulOperations: number
  failedOperations: number
  averageResponseTime: number
  operationsByType: Record<string, number>
  errorsByType: Record<string, number>
  recentErrors: ZoraError[]
}

export interface ZoraError {
  id: string
  type: 'network' | 'contract' | 'validation' | 'ipfs' | 'database' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  context: ErrorContext
  stackTrace?: string
  resolved: boolean
  resolution?: string
  timestamp: Date
  retryCount: number
}

export interface AlertRule {
  id: string
  name: string
  condition: (metrics: ZoraOperationMetrics) => boolean
  severity: 'info' | 'warning' | 'error' | 'critical'
  cooldownMs: number
  lastTriggered?: Date
}

export interface MonitoringConfig {
  enableConsoleLogging: boolean
  enableRemoteLogging: boolean
  enablePerformanceTracking: boolean
  enableErrorTracking: boolean
  alertRules: AlertRule[]
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  remoteEndpoint?: string
  sampleRate: number // 0.0 to 1.0 for sampling logs
}

// ===== ERROR MONITORING SERVICE =====

export class ZoraMonitoringService {
  private config: MonitoringConfig
  private errors: ZoraError[] = []
  private metrics: PerformanceMetrics[] = []
  private operationMetrics: ZoraOperationMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageResponseTime: 0,
    operationsByType: {},
    errorsByType: {},
    recentErrors: []
  }

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      enablePerformanceTracking: true,
      enableErrorTracking: true,
      alertRules: this.getDefaultAlertRules(),
      logLevel: 'info',
      sampleRate: 1.0,
      ...config
    }

    // Start periodic cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupOldData(), 300000) // Clean up every 5 minutes
    }
  }

  // ===== ERROR TRACKING =====

  /**
   * Track an error with full context
   */
  async trackError(
    error: Error | string,
    context: Partial<ErrorContext>,
    type: ZoraError['type'] = 'unknown',
    severity: ZoraError['severity'] = 'medium'
  ): Promise<string> {
    const errorId = `zora_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const zoraError: ZoraError = {
      id: errorId,
      type,
      severity,
      message: error instanceof Error ? error.message : error,
      context: {
        operation: context.operation || 'unknown',
        timestamp: new Date(),
        sessionId: this.getSessionId(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ...context
      },
      stackTrace: error instanceof Error ? error.stack : undefined,
      resolved: false,
      timestamp: new Date(),
      retryCount: 0
    }

    this.errors.push(zoraError)
    this.operationMetrics.errorsByType[type] = (this.operationMetrics.errorsByType[type] || 0) + 1
    this.operationMetrics.recentErrors = this.errors.slice(-10) // Keep last 10 errors

    // Log the error
    this.log('error', `Zora Error [${type.toUpperCase()}]: ${zoraError.message}`, {
      errorId,
      context: zoraError.context,
      stackTrace: zoraError.stackTrace
    })

    // Check alert rules
    await this.checkAlertRules()

    // Send to remote logging if enabled
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendToRemote(zoraError).catch(err =>
        console.warn('Failed to send error to remote logging:', err)
      )
    }

    return errorId
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorId: string, resolution?: string): boolean {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.resolved = true
      error.resolution = resolution

      this.log('info', `Zora Error Resolved: ${errorId}`, {
        resolution,
        originalError: error.message
      })

      return true
    }
    return false
  }

  /**
   * Increment retry count for an error
   */
  incrementRetryCount(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId)
    if (error) {
      error.retryCount++
      return true
    }
    return false
  }

  // ===== PERFORMANCE TRACKING =====

  /**
   * Track operation performance
   */
  trackPerformance(
    operation: string,
    startTime: number,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const duration = Date.now() - startTime
    const metrics: PerformanceMetrics = {
      operation,
      duration,
      success,
      timestamp: new Date(),
      metadata
    }

    this.metrics.push(metrics)
    this.operationMetrics.totalOperations++
    this.operationMetrics.operationsByType[operation] = (this.operationMetrics.operationsByType[operation] || 0) + 1

    if (success) {
      this.operationMetrics.successfulOperations++
    } else {
      this.operationMetrics.failedOperations++
    }

    // Update average response time
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    this.operationMetrics.averageResponseTime = totalTime / this.metrics.length

    // Log performance metrics
    this.log('info', `Zora Operation: ${operation}`, {
      duration: `${duration}ms`,
      success,
      metadata
    })

    // Check alert rules
    this.checkAlertRules()
  }

  /**
   * Create a performance timer
   */
  startTimer(operation: string, metadata?: Record<string, any>): () => void {
    const startTime = Date.now()

    return (success: boolean = true, additionalMetadata?: Record<string, any>) => {
      this.trackPerformance(
        operation,
        startTime,
        success,
        { ...metadata, ...additionalMetadata }
      )
    }
  }

  // ===== LOGGING =====

  /**
   * Structured logging with sampling
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    // Check log level
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.config.logLevel)
    const messageLevelIndex = levels.indexOf(level)

    if (messageLevelIndex < currentLevelIndex) {
      return // Skip logs below current level
    }

    // Apply sampling
    if (Math.random() > this.config.sampleRate) {
      return
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'zora-integration',
      data
    }

    // Console logging
    if (this.config.enableConsoleLogging) {
      const consoleMethod = level === 'debug' ? 'debug' :
                           level === 'info' ? 'info' :
                           level === 'warn' ? 'warn' : 'error'

      console[consoleMethod](`[${logEntry.service}] ${message}`, data || '')
    }

    // Remote logging
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendToRemote(logEntry).catch(err =>
        console.warn('Failed to send log to remote:', err)
      )
    }
  }

  // ===== ALERT SYSTEM =====

  /**
   * Check alert rules and trigger alerts
   */
  private async checkAlertRules(): Promise<void> {
    for (const rule of this.config.alertRules) {
      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime()
        if (timeSinceLastTrigger < rule.cooldownMs) {
          continue // Still in cooldown
        }
      }

      // Check condition
      if (rule.condition(this.operationMetrics)) {
        rule.lastTriggered = new Date()

        this.log('warn', `Alert Triggered: ${rule.name}`, {
          severity: rule.severity,
          metrics: this.operationMetrics
        })

        // Here you could integrate with external alerting systems
        // (e.g., Slack, Discord, email, monitoring services)
        await this.triggerAlert(rule)
      }
    }
  }

  /**
   * Trigger an alert (can be extended for external integrations)
   */
  private async triggerAlert(rule: AlertRule): Promise<void> {
    // Default implementation - override for external integrations
    console.warn(`🚨 ALERT [${rule.severity.toUpperCase()}]: ${rule.name}`)

    // Example: Send to external service
    /*
    if (rule.severity === 'critical') {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Zora Alert: ${rule.name}`,
          severity: rule.severity,
          metrics: this.operationMetrics,
          timestamp: new Date().toISOString()
        })
      })
    }
    */
  }

  /**
   * Default alert rules
   */
  private getDefaultAlertRules(): AlertRule[] {
    return [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: (metrics) => {
          const errorRate = metrics.totalOperations > 0 ?
            (metrics.failedOperations / metrics.totalOperations) : 0
          return errorRate > 0.5 // 50% error rate
        },
        severity: 'critical',
        cooldownMs: 300000 // 5 minutes
      },
      {
        id: 'slow-operations',
        name: 'Slow Operations',
        condition: (metrics) => metrics.averageResponseTime > 30000, // 30 seconds
        severity: 'warning',
        cooldownMs: 600000 // 10 minutes
      },
      {
        id: 'recent-errors',
        name: 'Recent Errors',
        condition: (metrics) => metrics.recentErrors.length >= 5,
        severity: 'warning',
        cooldownMs: 120000 // 2 minutes
      }
    ]
  }

  // ===== UTILITY METHODS =====

  /**
   * Get current operation metrics
   */
  getMetrics(): ZoraOperationMetrics {
    return { ...this.operationMetrics }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ZoraError[] {
    return this.errors.slice(-limit)
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type: ZoraError['type']): ZoraError[] {
    return this.errors.filter(error => error.type === type)
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(): ZoraError[] {
    return this.errors.filter(error => !error.resolved)
  }

  /**
   * Generate or get session ID
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('zora_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        sessionStorage.setItem('zora_session_id', sessionId)
      }
      return sessionId
    }
    return 'server_session'
  }

  /**
   * Send data to remote logging service
   */
  private async sendToRemote(data: any): Promise<void> {
    if (!this.config.remoteEndpoint) return

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.warn('Failed to send to remote logging:', error)
    }
  }

  /**
   * Clean up old data to prevent memory leaks
   */
  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago

    // Clean up old errors
    this.errors = this.errors.filter(error =>
      error.timestamp.getTime() > cutoffTime || !error.resolved
    )

    // Clean up old metrics (keep last 1000)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Update recent errors
    this.operationMetrics.recentErrors = this.errors.slice(-10)
  }

  /**
   * Export monitoring data for debugging
   */
  exportData(): {
    errors: ZoraError[]
    metrics: PerformanceMetrics[]
    operationMetrics: ZoraOperationMetrics
    config: MonitoringConfig
  } {
    return {
      errors: [...this.errors],
      metrics: [...this.metrics],
      operationMetrics: { ...this.operationMetrics },
      config: { ...this.config }
    }
  }
}

// ===== GLOBAL MONITORING INSTANCE =====

export const zoraMonitor = new ZoraMonitoringService()

// ===== MONITORING HOOKS =====

/**
 * React hook for monitoring Zora operations
 */
export function useZoraMonitoring() {
  return {
    trackError: zoraMonitor.trackError.bind(zoraMonitor),
    startTimer: zoraMonitor.startTimer.bind(zoraMonitor),
    getMetrics: zoraMonitor.getMetrics.bind(zoraMonitor),
    getRecentErrors: zoraMonitor.getRecentErrors.bind(zoraMonitor),
    resolveError: zoraMonitor.resolveError.bind(zoraMonitor)
  }
}

/**
 * Higher-order function to monitor async operations
 */
export function withMonitoring<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const endTimer = zoraMonitor.startTimer(operation)

    try {
      const result = await fn(...args)
      endTimer(true)
      return result
    } catch (error) {
      endTimer(false, { error: error instanceof Error ? error.message : 'Unknown error' })

      // Track the error
      await zoraMonitor.trackError(
        error instanceof Error ? error : 'Unknown error',
        {
          operation,
          metadata: { args: args.length }
        },
        'contract',
        'high'
      )

      throw error
    }
  }
}

// ===== ERROR BOUNDARY INTEGRATION =====

/**
 * Enhanced error boundary that integrates with monitoring
 */
export class ZoraMonitoredErrorBoundary extends ErrorBoundary {
  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo): Promise<void> {
    // Track the error in monitoring system
    await zoraMonitor.trackError(
      error,
      {
        operation: 'react_error_boundary',
        metadata: {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'ZoraMonitoredErrorBoundary'
        }
      },
      'unknown',
      'high'
    )

    // Call parent method
    super.componentDidCatch(error, errorInfo)
  }
}

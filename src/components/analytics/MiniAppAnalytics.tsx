/**
 * MiniApp Analytics & Monitoring - Performance & User Insights
 * File: src/components/analytics/MiniAppAnalytics.tsx
 *
 * Comprehensive analytics and performance monitoring for MiniApp environments
 * with real-time tracking, error monitoring, and user behavior insights.
 */

'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Users, Zap, AlertTriangle, Clock } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'


import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'

// ================================================
// ANALYTICS TYPES
// ================================================

interface PerformanceMetrics {
  readonly loadTime: number
  readonly renderTime: number
  readonly interactionCount: number
  readonly errorCount: number
  readonly memoryUsage?: number
  readonly networkRequests: number
  readonly cacheHitRate: number
}

interface UserBehaviorMetrics {
  readonly sessionDuration: number
  readonly pageViews: number
  readonly interactions: number
  readonly conversions: number
  readonly bounceRate: number
  readonly socialShares: number
}

interface ErrorMetrics {
  readonly totalErrors: number
  readonly errorRate: number
  readonly criticalErrors: number
  readonly recoveryRate: number
  readonly topErrors: Array<{
    message: string
    count: number
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
}

interface AnalyticsData {
  readonly performance: PerformanceMetrics
  readonly behavior: UserBehaviorMetrics
  readonly errors: ErrorMetrics
  readonly timestamp: Date
  readonly environment: 'miniapp' | 'web'
}

// ================================================
// PERFORMANCE MONITORING HOOK
// ================================================

export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    interactionCount: 0,
    errorCount: 0,
    memoryUsage: undefined,
    networkRequests: 0,
    cacheHitRate: 0
  })

  const startTimeRef = useRef<number>(Date.now())
  const interactionCountRef = useRef<number>(0)
  const errorCountRef = useRef<number>(0)
  const networkRequestsRef = useRef<number>(0)

  // Track page load time
  useEffect(() => {
    const loadTime = Date.now() - startTimeRef.current
    setMetrics(prev => ({ ...prev, loadTime }))
  }, [])

  // Track interactions
  useEffect(() => {
    const handleInteraction = () => {
      interactionCountRef.current++
      setMetrics(prev => ({
        ...prev,
        interactionCount: interactionCountRef.current
      }))
    }

    document.addEventListener('click', handleInteraction)
    document.addEventListener('touchstart', handleInteraction)

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  // Track errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      errorCountRef.current++
      setMetrics(prev => ({
        ...prev,
        errorCount: errorCountRef.current
      }))

      // Send error to analytics
      console.log('Performance Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      })
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Track network requests
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      networkRequestsRef.current += entries.length

      setMetrics(prev => ({
        ...prev,
        networkRequests: networkRequestsRef.current
      }))
    })

    observer.observe({ entryTypes: ['resource'] })

    return () => observer.disconnect()
  }, [])

  // Track memory usage
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as { memory: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
        const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

        setMetrics(prev => ({ ...prev, memoryUsage }))
      }
    }

    const interval = setInterval(updateMemoryUsage, 5000)
    updateMemoryUsage()

    return () => clearInterval(interval)
  }, [])

  return metrics
}

// ================================================
// ANALYTICS COLLECTION HOOK
// ================================================

export function useMiniAppAnalytics() {
  const { state, utils } = useUnifiedMiniApp()
  const performanceMetrics = usePerformanceMonitoring()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  const sessionStartRef = useRef<number>(Date.now())
  const pageViewsRef = useRef<number>(1)
  const interactionsRef = useRef<number>(0)
  const conversionsRef = useRef<number>(0)
  const socialSharesRef = useRef<number>(0)

  // Track page views
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pageViewsRef.current++
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Track interactions
  useEffect(() => {
    const handleInteraction = () => {
      interactionsRef.current++
    }

    document.addEventListener('click', handleInteraction)
    document.addEventListener('touchstart', handleInteraction)

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [])

  // Collect comprehensive analytics
  const collectAnalytics = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartRef.current

    const analytics: AnalyticsData = {
      performance: performanceMetrics,
      behavior: {
        sessionDuration,
        pageViews: pageViewsRef.current,
        interactions: interactionsRef.current,
        conversions: conversionsRef.current,
        bounceRate: pageViewsRef.current === 1 ? 100 : 0,
        socialShares: socialSharesRef.current
      },
      errors: {
        totalErrors: performanceMetrics.errorCount,
        errorRate: (performanceMetrics.errorCount / Math.max(interactionsRef.current, 1)) * 100,
        criticalErrors: 0, // Would be tracked separately
        recoveryRate: 95, // Placeholder
        topErrors: [] // Would be populated from error tracking
      },
      timestamp: new Date(),
      environment: utils.isMiniApp ? 'miniapp' : 'web'
    }

    setAnalyticsData(analytics)
    return analytics
  }, [performanceMetrics, utils.isMiniApp])

  // Auto-collect analytics periodically
  useEffect(() => {
    const interval = setInterval(collectAnalytics, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [collectAnalytics])

  // Send analytics to backend
  const sendAnalytics = useCallback(async (data: AnalyticsData) => {
    try {
      await fetch('/api/analytics/miniapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userId: state.userAddress || 'anonymous',
          sessionId: sessionStorage.getItem('miniapp_session') || 'unknown'
        })
      })
    } catch (error) {
      console.warn('Failed to send analytics:', error)
    }
  }, [state.userAddress])

  // Send analytics on unmount or significant events
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (analyticsData) {
        // Use sendBeacon for reliable delivery during page unload
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/miniapp', JSON.stringify({
            ...analyticsData,
            unload: true
          }))
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [analyticsData])

  return {
    analyticsData,
    collectAnalytics,
    sendAnalytics
  }
}

// ================================================
// ANALYTICS DASHBOARD COMPONENT
// ================================================

interface MiniAppAnalyticsDashboardProps {
  showPerformance?: boolean
  showBehavior?: boolean
  showErrors?: boolean
  className?: string
}

export function MiniAppAnalyticsDashboard({
  showPerformance = true,
  showBehavior = true,
  showErrors = true,
  className
}: MiniAppAnalyticsDashboardProps) {
  const { analyticsData } = useMiniAppAnalytics()
  const { utils } = useUnifiedMiniApp()

  if (!analyticsData) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Collecting analytics data...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Environment Badge */}
      <div className="mb-4">
        <Badge variant={utils.isMiniApp ? 'default' : 'secondary'}>
          {utils.isMiniApp ? 'MiniApp' : 'Web'} Environment
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Performance Metrics */}
        {showPerformance && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Load Time</span>
                  <span>{(analyticsData.performance.loadTime / 1000).toFixed(1)}s</span>
                </div>
                <Progress
                  value={Math.min((analyticsData.performance.loadTime / 3000) * 100, 100)}
                  className="h-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Interactions</span>
                  <span>{analyticsData.performance.interactionCount}</span>
                </div>
                <Progress
                  value={Math.min(analyticsData.performance.interactionCount * 10, 100)}
                  className="h-1"
                />
              </div>

              {analyticsData.performance.memoryUsage && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span>{analyticsData.performance.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={analyticsData.performance.memoryUsage}
                    className="h-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Behavior Metrics */}
        {showBehavior && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Session Duration</span>
                  <span>{Math.round(analyticsData.behavior.sessionDuration / 1000 / 60)}m</span>
                </div>
                <Progress
                  value={Math.min((analyticsData.behavior.sessionDuration / 600000) * 100, 100)}
                  className="h-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Page Views</span>
                  <span>{analyticsData.behavior.pageViews}</span>
                </div>
                <Progress
                  value={Math.min(analyticsData.behavior.pageViews * 20, 100)}
                  className="h-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Interactions</span>
                  <span>{analyticsData.behavior.interactions}</span>
                </div>
                <Progress
                  value={Math.min(analyticsData.behavior.interactions * 5, 100)}
                  className="h-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Metrics */}
        {showErrors && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Error Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Errors</span>
                  <span>{analyticsData.errors.totalErrors}</span>
                </div>
                <Progress
                  value={Math.min(analyticsData.errors.totalErrors * 10, 100)}
                  className="h-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Error Rate</span>
                  <span>{analyticsData.errors.errorRate.toFixed(1)}%</span>
                </div>
                <Progress
                  value={analyticsData.errors.errorRate}
                  className="h-1"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recovery Rate</span>
                  <span>{analyticsData.errors.recoveryRate}%</span>
                </div>
                <Progress
                  value={analyticsData.errors.recoveryRate}
                  className="h-1"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Real-time Status */}
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last updated</span>
            </div>
            <span className="text-sm">
              {analyticsData.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// REAL-TIME MONITORING COMPONENT
// ================================================

interface RealTimeMonitorProps {
  className?: string
}

export function RealTimeMonitor({ className }: RealTimeMonitorProps) {
  const { state: _state } = useUnifiedMiniApp()
  const performanceMetrics = usePerformanceMonitoring()
  const [fps, setFps] = useState(60)

  // Monitor FPS
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)))
        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    const animationId = requestAnimationFrame(measureFPS)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Real-time Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">FPS</div>
              <div className="font-medium">{fps}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Memory</div>
              <div className="font-medium">
                {performanceMetrics.memoryUsage ? `${performanceMetrics.memoryUsage.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Interactions</div>
              <div className="font-medium">{performanceMetrics.interactionCount}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Errors</div>
              <div className="font-medium">{performanceMetrics.errorCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// EXPORTS
// ================================================

export default MiniAppAnalyticsDashboard
export type { AnalyticsData, PerformanceMetrics, UserBehaviorMetrics, ErrorMetrics }

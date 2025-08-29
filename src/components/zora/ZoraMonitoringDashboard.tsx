/**
 * Zora Monitoring Dashboard Component
 *
 * A comprehensive dashboard for monitoring Zora NFT integration health,
 * performance metrics, and error tracking in real-time.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  RefreshCw,
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react'
import { zoraMonitor, useZoraMonitoring } from '@/lib/services/zora-monitoring'
import type { ZoraOperationMetrics, ZoraError } from '@/lib/services/zora-monitoring'

interface MonitoringDashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ZoraMonitoringDashboard({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: MonitoringDashboardProps) {
  const [metrics, setMetrics] = useState<ZoraOperationMetrics | null>(null)
  const [recentErrors, setRecentErrors] = useState<ZoraError[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const { getMetrics, getRecentErrors, resolveError } = useZoraMonitoring()

  const refreshData = async () => {
    try {
      const [newMetrics, newErrors] = await Promise.all([
        getMetrics(),
        getRecentErrors(10)
      ])
      setMetrics(newMetrics)
      setRecentErrors(newErrors)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to refresh monitoring data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()

    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  const handleResolveError = async (errorId: string) => {
    await resolveError(errorId, 'Manually resolved')
    refreshData()
  }

  if (isLoading && !metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Zora Monitoring Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading monitoring data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const successRate = metrics ? (metrics.totalOperations > 0 ?
    (metrics.successfulOperations / metrics.totalOperations) * 100 : 0) : 0

  const errorRate = metrics ? (metrics.totalOperations > 0 ?
    (metrics.failedOperations / metrics.totalOperations) * 100 : 0) : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Zora Monitoring Dashboard
              </CardTitle>
              <CardDescription>
                Real-time monitoring of Zora NFT integration health and performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={successRate > 95 ? 'default' : successRate > 80 ? 'secondary' : 'destructive'}>
                {successRate.toFixed(1)}% Success Rate
              </Badge>
              <Button onClick={refreshData} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Operations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalOperations || 0}</div>
              </CardContent>
            </Card>

            {/* Success Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
                <Progress value={successRate} className="mt-2" />
              </CardContent>
            </Card>

            {/* Average Response Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.averageResponseTime ? `${(metrics.averageResponseTime / 1000).toFixed(1)}s` : 'N/A'}
                </div>
              </CardContent>
            </Card>

            {/* Active Errors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentErrors.filter(e => !e.resolved).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Rate Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Error Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Error Rate</span>
                  <span>{errorRate.toFixed(1)}%</span>
                </div>
                <Progress value={errorRate} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {metrics?.failedOperations || 0} failed out of {metrics?.totalOperations || 0} operations
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Operation Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.operationsByType && Object.entries(metrics.operationsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Response Time</span>
                      <span>{metrics?.averageResponseTime ? `${(metrics.averageResponseTime / 1000).toFixed(2)}s` : 'N/A'}</span>
                    </div>
                    <div className={`h-2 rounded-full ${
                      (metrics?.averageResponseTime || 0) < 5000 ? 'bg-green-200' :
                      (metrics?.averageResponseTime || 0) < 15000 ? 'bg-yellow-200' : 'bg-red-200'
                    }`}>
                      <div
                        className={`h-2 rounded-full ${
                          (metrics?.averageResponseTime || 0) < 5000 ? 'bg-green-500' :
                          (metrics?.averageResponseTime || 0) < 15000 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((metrics?.averageResponseTime || 0) / 30000 * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Last 10 errors with resolution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentErrors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No recent errors</p>
                  </div>
                ) : (
                  recentErrors.map((error) => (
                    <Alert key={error.id} className={error.resolved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {error.resolved ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <Badge variant={error.severity === 'critical' ? 'destructive' :
                                         error.severity === 'high' ? 'destructive' :
                                         error.severity === 'medium' ? 'secondary' : 'outline'}>
                              {error.type.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {error.severity}
                            </Badge>
                          </div>
                          <AlertDescription className="mb-2">
                            {error.message}
                          </AlertDescription>
                          <div className="text-xs text-muted-foreground">
                            {error.context.operation} • {error.timestamp.toLocaleString()}
                            {error.context.creatorAddress && ` • ${error.context.creatorAddress.slice(0, 6)}...${error.context.creatorAddress.slice(-4)}`}
                          </div>
                        </div>
                        {!error.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveError(error.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.errorsByType && Object.entries(metrics.errorsByType).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{type}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm">Database Operations</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Performance</span>
                    <Badge variant={successRate > 95 ? 'default' : successRate > 80 ? 'secondary' : 'destructive'}>
                      {successRate > 95 ? 'Excellent' : successRate > 80 ? 'Good' : 'Needs Attention'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

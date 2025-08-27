/**
 * Performance Monitor Component
 * 
 * This component helps track loading times and identify performance bottlenecks
 * in the miniapp. It's useful for debugging slow loading issues.
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface PerformanceMetrics {
  pageLoadTime: number
  detectionTime: number
  sdkInitTime: number
  contentLoadTime: number
  totalTime: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    const startTime = performance.now()
    
    // Track page load time
    const pageLoadTime = performance.now() - startTime
    
    // Track detection time (approximate)
    const detectionStart = performance.now()
    setTimeout(() => {
      const detectionTime = performance.now() - detectionStart
      
      // Track SDK init time (approximate)
      const sdkStart = performance.now()
      setTimeout(() => {
        const sdkInitTime = performance.now() - sdkStart
        
        // Track content load time (approximate)
        const contentStart = performance.now()
        setTimeout(() => {
          const contentLoadTime = performance.now() - contentStart
          const totalTime = performance.now() - startTime
          
          setMetrics({
            pageLoadTime,
            detectionTime,
            sdkInitTime,
            contentLoadTime,
            totalTime
          })
          
          // Show performance issues
          if (totalTime > 5000) {
            setIsVisible(true)
          }
        }, 1000)
      }, 1000)
    }, 1000)
  }, [])

  if (!isVisible || !metrics) return null

  const getPerformanceStatus = (time: number) => {
    if (time < 1000) return { status: 'good', color: 'bg-green-500' }
    if (time < 3000) return { status: 'warning', color: 'bg-yellow-500' }
    return { status: 'poor', color: 'bg-red-500' }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur-sm border-2 border-orange-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Performance Monitor
          <Badge variant="outline" className="text-xs">
            {getPerformanceStatus(metrics.totalTime).status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Page Load:</span>
          <span className="font-mono">{metrics.pageLoadTime.toFixed(0)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Detection:</span>
          <span className="font-mono">{metrics.detectionTime.toFixed(0)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>SDK Init:</span>
          <span className="font-mono">{metrics.sdkInitTime.toFixed(0)}ms</span>
        </div>
        <div className="flex justify-between">
          <span>Content Load:</span>
          <span className="font-mono">{metrics.contentLoadTime.toFixed(0)}ms</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total:</span>
          <span className="font-mono">{metrics.totalTime.toFixed(0)}ms</span>
        </div>
        
        {metrics.totalTime > 5000 && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Slow loading detected</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

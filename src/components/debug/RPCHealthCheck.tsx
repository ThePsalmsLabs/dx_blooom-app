'use client'

import React from 'react'
import { useChainId, useBlockNumber } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'

export function RPCHealthCheck() {
  const chainId = useChainId()
  const { data: blockNumber, error, isLoading, refetch } = useBlockNumber({
    watch: true, // This will make continuous requests to test your RPC
  })
  
  const [requestCount, setRequestCount] = React.useState(0)
  const [errorCount, setErrorCount] = React.useState(0)
  
  // Track requests and errors
  React.useEffect(() => {
    setRequestCount(prev => prev + 1)
  }, [blockNumber])
  
  React.useEffect(() => {
    if (error) {
      setErrorCount(prev => prev + 1)
    }
  }, [error])
  
  const successRate = requestCount > 0 ? ((requestCount - errorCount) / requestCount) * 100 : 0
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          RPC Health Check
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span>Chain ID:</span>
          <Badge variant="outline">{chainId}</Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Latest Block:</span>
          <Badge variant="outline">
            {isLoading ? 'Loading...' : blockNumber?.toString() || 'Error'}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Success Rate:</span>
          <Badge variant={successRate > 90 ? 'default' : successRate > 70 ? 'secondary' : 'destructive'}>
            {successRate.toFixed(1)}%
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Requests:</span>
          <span>{requestCount}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Errors:</span>
          <span className={errorCount > 0 ? 'text-red-600' : 'text-green-600'}>
            {errorCount}
          </span>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">RPC Error</p>
                <p className="text-xs text-red-700">{error.message}</p>
              </div>
            </div>
          </div>
        )}
        
        {!error && blockNumber && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800">RPC Working Correctly</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

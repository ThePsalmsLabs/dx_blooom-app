'use client'

import React, { useState } from 'react'
import { RPCHealthCheck } from '@/components/debug'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { validateProductionConfig, type ConfigValidationResult } from '@/lib/web3/production-wagmi-config'

export default function RPCTestPage() {
  const [rpcResults, setRpcResults] = useState<ConfigValidationResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const checkConfig = async () => {
      try {
        const results = validateProductionConfig()
        setRpcResults(results)
      } catch (error) {
        console.error('Failed to validate RPC configuration:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkConfig()
  }, [])

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">RPC Configuration Test</h1>
        <p className="text-lg text-muted-foreground">
          Test and monitor your enhanced Wagmi RPC configuration
        </p>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading configuration...</div>
          ) : rpcResults ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    <Badge variant={rpcResults.isValid ? "default" : "destructive"}>
                      {rpcResults.isValid ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">Configuration Status</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {rpcResults.errors.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>

              {rpcResults.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-amber-600">Recommendations:</h3>
                  <ul className="space-y-1">
                    {rpcResults.recommendations.map((action: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">⚠️</Badge>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rpcResults.recommendations.length === 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-center text-green-800">
                    ✅ RPC configuration is optimal!
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-red-600">
              Failed to load configuration
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live RPC Health Check */}
      <Card>
        <CardHeader>
          <CardTitle>Live RPC Health Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <RPCHealthCheck />
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">1. Configuration Status</h3>
            <p className="text-sm text-muted-foreground">
              Shows how many premium RPC providers you have configured and any recommendations.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">2. Live Health Monitor</h3>
            <p className="text-sm text-muted-foreground">
              Continuously tests your RPC connection by fetching the latest block number.
              Watch the success rate to ensure your configuration is working properly.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">3. What to Look For</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Success rate should be above 90%</li>
              <li>• Block numbers should update regularly</li>
              <li>• No RPC errors should appear</li>
              <li>• Chain ID should show your target network</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

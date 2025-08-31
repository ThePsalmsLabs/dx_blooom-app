/**
 * Wallet Disconnect Test Component
 *
 * This component provides a simple way to test the wallet disconnect flow
 * and verify that the Privy/wagmi synchronization is working properly.
 */

'use client'

import React, { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAccount } from 'wagmi'

export function WalletDisconnectTest() {
  const [testResults, setTestResults] = useState<{
    privyBefore?: boolean
    wagmiBefore?: boolean
    privyAfter?: boolean
    wagmiAfter?: boolean
    disconnectTime?: number
  }>({})

  // Use both Privy and wagmi hooks to compare states
  const { user, authenticated: privyAuthenticated, logout } = usePrivy()
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount()
  const walletUI = useWalletConnectionUI()

  const handleDisconnectTest = async () => {
    console.log('🧪 Starting disconnect test...')

    // Record state before disconnect
    const beforeState = {
      privyBefore: privyAuthenticated,
      wagmiBefore: wagmiConnected,
    }

    console.log('📊 State before disconnect:', beforeState)

    try {
      // Perform disconnect
      const startTime = Date.now()
      await walletUI.disconnect()
      const disconnectTime = Date.now() - startTime

      // Wait a bit for state updates
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Record state after disconnect
      const afterState = {
        privyAfter: privyAuthenticated,
        wagmiAfter: wagmiConnected,
        disconnectTime,
      }

      console.log('📊 State after disconnect:', afterState)

      setTestResults({ ...beforeState, ...afterState })

      console.log('✅ Disconnect test completed')
    } catch (error) {
      console.error('❌ Disconnect test failed:', error)
    }
  }

  const resetTest = () => {
    setTestResults({})
  }

  const getTestResult = () => {
    if (!testResults.privyAfter && !testResults.wagmiAfter) {
      return { status: 'success', message: 'Both systems properly disconnected' }
    } else if (!testResults.privyAfter && testResults.wagmiAfter) {
      return { status: 'warning', message: 'Privy disconnected but wagmi still connected' }
    } else if (testResults.privyAfter && !testResults.wagmiAfter) {
      return { status: 'warning', message: 'Wagmi disconnected but Privy still connected' }
    } else {
      return { status: 'error', message: 'Neither system disconnected properly' }
    }
  }

  const currentResult = testResults.privyAfter !== undefined ? getTestResult() : null

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Wallet Disconnect Test
          {currentResult && (
            <Badge variant={
              currentResult.status === 'success' ? 'default' :
              currentResult.status === 'warning' ? 'secondary' : 'destructive'
            }>
              {currentResult.status === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
              {currentResult.status === 'warning' && <AlertCircle className="h-3 w-3 mr-1" />}
              {currentResult.status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
              {currentResult.status}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Test the wallet disconnect flow to verify Privy/wagmi synchronization
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current State */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Current Connection State</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Privy Authenticated:</span>
                <Badge variant={privyAuthenticated ? 'default' : 'secondary'}>
                  {privyAuthenticated ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              {privyAuthenticated && user?.wallet?.address && (
                <div className="text-xs text-muted-foreground font-mono">
                  {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Wagmi Connected:</span>
                <Badge variant={wagmiConnected ? 'default' : 'secondary'}>
                  {wagmiConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              {wagmiConnected && wagmiAddress && (
                <div className="text-xs text-muted-foreground font-mono">
                  {wagmiAddress.slice(0, 6)}...{wagmiAddress.slice(-4)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.privyAfter !== undefined && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Before Disconnect:</div>
                <div className="text-xs">
                  Privy: {testResults.privyBefore ? '✅' : '❌'}
                </div>
                <div className="text-xs">
                  Wagmi: {testResults.wagmiBefore ? '✅' : '❌'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">After Disconnect:</div>
                <div className="text-xs">
                  Privy: {testResults.privyAfter ? '❌ Still connected' : '✅ Disconnected'}
                </div>
                <div className="text-xs">
                  Wagmi: {testResults.wagmiAfter ? '❌ Still connected' : '✅ Disconnected'}
                </div>
              </div>
            </div>

            {testResults.disconnectTime && (
              <div className="text-sm text-muted-foreground">
                Disconnect took: {testResults.disconnectTime}ms
              </div>
            )}

            {currentResult && (
              <div className={`p-3 rounded-lg text-sm ${
                currentResult.status === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : currentResult.status === 'warning'
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {currentResult.message}
              </div>
            )}
          </div>
        )}

        {/* Test Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleDisconnectTest}
            disabled={!privyAuthenticated && !wagmiConnected}
            className="flex-1"
          >
            Test Disconnect Flow
          </Button>

          <Button
            onClick={resetTest}
            variant="outline"
            disabled={testResults.privyAfter === undefined}
          >
            Reset Test
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>How to test:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Connect your wallet using the wallet button</li>
            <li>Click "Test Disconnect Flow" to run the test</li>
            <li>Check that both Privy and Wagmi show as disconnected</li>
            <li>Verify the test result shows success</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Toast System Demo Page
 * 
 * This page demonstrates the new toast notification system that replaces
 * intrusive UI error messages and debug information with clean, 
 * non-disruptive notifications in the top-right corner.
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { enhancedToast, handleUIError, debugToast } from '@/lib/utils/toast'
import { AlertCircle, CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'

export default function ToastSystemDemo() {
  const demoError = new Error('Transaction failed: Cannot read properties of undefined (reading \'id\') Version: viem@2.33.2')
  
  const handleTransactionError = () => {
    enhancedToast.transactionError(
      demoError,
      '0x1234567890abcdef1234567890abcdef12345678',
      {
        action: {
          label: 'View Transaction',
          onClick: () => enhancedToast.info('Opening transaction in explorer...')
        }
      }
    )
  }

  const handlePaymentError = () => {
    enhancedToast.paymentError(
      'Insufficient balance for gas fees',
      () => enhancedToast.info('Retrying payment...')
    )
  }

  const handleLoadingDemo = () => {
    const loadingId = enhancedToast.loading('Processing payment...')
    
    setTimeout(() => {
      enhancedToast.update(String(loadingId), 'Payment completed successfully!', 'success')
    }, 3000)
  }

  const handleDebugDemo = () => {
    debugToast('Debug information', { userId: 123, transactionId: 'tx_456' })
  }

  const handleCleanError = () => {
    handleUIError(
      'Request Arguments: from: 0x8bCf29A555c0b8b8a58a8C858a8a8a8a8a8a8a8a Details: Cannot read properties of undefined (reading \'id\') Version: viem@2.33.2',
      'Content Loading',
      () => enhancedToast.info('Retrying...')
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
          Glassmorphism Toast System
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Beautiful, glassy notifications with backdrop blur effects that appear in the top-right corner 
          and automatically disappear after 10 seconds.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="text-sm">
            Glassmorphism Design
          </Badge>
          <Badge variant="outline" className="text-sm">
            Backdrop Blur
          </Badge>
          <Badge variant="outline" className="text-sm">
            Auto-Dismiss
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Success Toasts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Success Notifications
            </CardTitle>
            <CardDescription>
              Positive feedback for successful operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => enhancedToast.success('Content purchased successfully!')}
              className="w-full"
            >
              Purchase Success
            </Button>
            <Button 
              onClick={() => enhancedToast.success('NFT minted successfully!')}
              variant="outline"
              className="w-full"
            >
              NFT Mint Success
            </Button>
          </CardContent>
        </Card>

        {/* Error Toasts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Error Notifications
            </CardTitle>
            <CardDescription>
              Clean error messages with retry options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleTransactionError}
              variant="destructive"
              className="w-full"
            >
              Transaction Error
            </Button>
            <Button 
              onClick={handlePaymentError}
              variant="outline"
              className="w-full"
            >
              Payment Error
            </Button>
            <Button 
              onClick={handleCleanError}
              variant="outline"
              className="w-full"
            >
              Cleaned Error Message
            </Button>
          </CardContent>
        </Card>

        {/* Warning Toasts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Warning Notifications
            </CardTitle>
            <CardDescription>
              Important notices and warnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => enhancedToast.warning('Network congestion detected')}
              variant="outline"
              className="w-full"
            >
              Network Warning
            </Button>
            <Button 
              onClick={() => enhancedToast.warning('High gas fees detected', {
                action: {
                  label: 'Adjust',
                  onClick: () => enhancedToast.info('Opening gas settings...')
                }
              })}
              variant="outline"
              className="w-full"
            >
              Gas Warning with Action
            </Button>
          </CardContent>
        </Card>

        {/* Info & Loading Toasts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Info & Loading
            </CardTitle>
            <CardDescription>
              Information and progress notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => enhancedToast.info('Content access verified')}
              variant="outline"
              className="w-full"
            >
              Info Message
            </Button>
            <Button 
              onClick={handleLoadingDemo}
              variant="outline"
              className="w-full"
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Loading → Success Demo
            </Button>
            <Button 
              onClick={handleDebugDemo}
              variant="outline"
              className="w-full text-xs"
            >
              Debug Toast (Dev Only)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-amber-800">✨ Glassmorphism Benefits</CardTitle>
          <CardDescription className="text-amber-700">
            How the beautiful glassy design improves user experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-green-600">✨ Beautiful Design</h3>
              <p className="text-sm text-muted-foreground">
                Glassmorphism with backdrop blur creates a modern, premium feel
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-600">👁️ High Visibility</h3>
              <p className="text-sm text-muted-foreground">
                Glassy background ensures notifications are clearly visible against any content
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-purple-600">🎨 Theme Aware</h3>
              <p className="text-sm text-muted-foreground">
                Automatically adapts to light/dark themes with appropriate glassmorphism effects
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Examples</CardTitle>
          <CardDescription>
            How to use the toast system in your components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Basic Usage:</h4>
              <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`import { enhancedToast } from '@/lib/utils/toast'

// Success notification
enhancedToast.success('Operation completed!')

// Error with retry action
enhancedToast.error('Failed to load', {
  action: {
    label: 'Retry',
    onClick: () => retryOperation()
  }
})`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Error Handling:</h4>
              <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`import { handleUIError } from '@/lib/utils/toast'

// Automatically clean and show error
handleUIError(error, 'Payment', retryFunction)`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

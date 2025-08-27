import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, ArrowLeft, ExternalLink, Copy } from 'lucide-react'

interface ErrorRecoveryProps {
  error: {
    type: 'network' | 'transaction' | 'validation' | 'unknown'
    message: string
    code?: string
    transactionHash?: string
  }
  onRetry: () => void
  onBack: () => void
  onViewTransaction?: () => void
  className?: string
}

export default function ErrorRecovery({
  error,
  onRetry,
  onBack,
  onViewTransaction,
  className = ''
}: ErrorRecoveryProps) {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network': return '🌐'
      case 'transaction': return '💸'
      case 'validation': return '⚠️'
      default: return '❌'
    }
  }

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network': return 'Network Error'
      case 'transaction': return 'Transaction Failed'
      case 'validation': return 'Validation Error'
      default: return 'Something Went Wrong'
    }
  }

  const getErrorDescription = () => {
    switch (error.type) {
      case 'network':
        return 'Unable to connect to the blockchain network. Please check your internet connection and try again.'
      case 'transaction':
        return 'The transaction failed to complete. This could be due to insufficient gas fees or network congestion.'
      case 'validation':
        return 'The provided data is invalid. Please check your inputs and try again.'
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    }
  }

  const getRecoveryActions = () => {
    switch (error.type) {
      case 'network':
        return [
          { label: 'Check Connection', action: onRetry },
          { label: 'Go Back', action: onBack }
        ]
      case 'transaction':
        return [
          { label: 'Retry Transaction', action: onRetry },
          { label: 'View on Explorer', action: onViewTransaction },
          { label: 'Go Back', action: onBack }
        ]
      case 'validation':
        return [
          { label: 'Fix & Retry', action: onRetry },
          { label: 'Go Back', action: onBack }
        ]
      default:
        return [
          { label: 'Try Again', action: onRetry },
          { label: 'Go Back', action: onBack }
        ]
    }
  }

  return (
    <Card className={`border-red-200 bg-red-50/30 ${className}`}>
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">{getErrorIcon()}</span>
        </div>
        <CardTitle className="text-red-800">{getErrorTitle()}</CardTitle>
        <CardDescription className="text-red-700">
          {getErrorDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Details */}
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error.message}
            {error.code && (
              <div className="mt-1 text-sm text-red-600">
                Error Code: {error.code}
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Transaction Hash */}
        {error.transactionHash && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Transaction Hash:</span>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {error.transactionHash.slice(0, 10)}...{error.transactionHash.slice(-8)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(error.transactionHash!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recovery Actions */}
        <div className="flex flex-col space-y-2">
          {getRecoveryActions().map((action, index) => (
            <Button
              key={index}
              variant={index === 0 ? "default" : "outline"}
              onClick={action.action}
              className={index === 0 ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {index === 0 && <RefreshCw className="mr-2 h-4 w-4" />}
              {index === 1 && error.type === 'transaction' && <ExternalLink className="mr-2 h-4 w-4" />}
              {index === 1 && error.type !== 'transaction' && <ArrowLeft className="mr-2 h-4 w-4" />}
              {index === 2 && <ArrowLeft className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Need help? Check our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              troubleshooting guide
            </a>{' '}
            or{' '}
            <a href="#" className="text-blue-600 hover:underline">
              contact support
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

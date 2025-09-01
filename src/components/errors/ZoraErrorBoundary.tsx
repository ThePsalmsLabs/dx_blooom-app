/**
 * Zora Error Boundary Component
 * 
 * This component provides error boundaries for Zora operations with
 * proper error handling, recovery suggestions, and user-friendly messages.
 */

import React, { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  RefreshCw, 
  XCircle, 
  Info
} from 'lucide-react'
import { 
  isZoraError, 
  getUserErrorMessage, 
  getRecoverySuggestion,
  getErrorCategory,
  type ZoraError
} from '@/lib/utils/zora-errors'
import { handleUIError } from '@/lib/utils/toast'

// ===== PROPS INTERFACES =====

interface ZoraErrorBoundaryProps {
  readonly children: ReactNode
  readonly fallback?: ReactNode
  readonly onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  readonly operation?: string
}

interface ZoraErrorBoundaryState {
  readonly hasError: boolean
  readonly error: Error | null
  readonly errorInfo: React.ErrorInfo | null
}

// ===== ERROR BOUNDARY COMPONENT =====

export class ZoraErrorBoundary extends Component<ZoraErrorBoundaryProps, ZoraErrorBoundaryState> {
  constructor(props: ZoraErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ZoraErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    })

    // Log error
    console.error('Zora Error Boundary caught an error:', error, errorInfo)

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Render default error UI
      return this.renderErrorUI()
    }

    return this.props.children
  }

  private renderErrorUI(): ReactNode {
    const { error } = this.state
    const { operation = 'operation' } = this.props

    if (!error) {
      return this.renderGenericError()
    }

    // Check if it's a Zora error
    if (isZoraError(error)) {
      return this.renderZoraError(error)
    }

    // Render generic error
    return this.renderGenericError()
  }

  private renderZoraError(zoraError: ZoraError): ReactNode {
    const userMessage = getUserErrorMessage(zoraError)
    const recoverySuggestion = getRecoverySuggestion(zoraError)
    const category = getErrorCategory(zoraError)

    return (
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-800">
              Zora {category.replace('_', ' ').toUpperCase()} Error
            </CardTitle>
          </div>
          <CardDescription className="text-red-600">
            {userMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recoverySuggestion && (
            <Alert className="border-orange-200 bg-orange-50">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                {recoverySuggestion}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={this.handleReset}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Reset
            </Button>
          </div>

          {zoraError.context.contractAddress && (
            <div className="text-xs text-gray-600">
              <strong>Contract:</strong> {zoraError.context.contractAddress}
            </div>
          )}

          {zoraError.context.transactionHash && (
            <div className="text-xs text-gray-600">
              <strong>Transaction:</strong> {zoraError.context.transactionHash}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  private renderGenericError(): ReactNode {
    const { operation = 'operation' } = this.props

    return (
      <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-red-800">
              Unexpected Error
            </CardTitle>
          </div>
          <CardDescription className="text-red-600">
            An unexpected error occurred during the {operation}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-orange-200 bg-orange-50">
            <Info className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Please try again or contact support if the problem persists
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={this.handleReset}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
}

// ===== HOOK FOR ERROR BOUNDARY =====

/**
 * Hook to use error boundary functionality
 */
export function useZoraErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)
  const [hasError, setHasError] = React.useState(false)

  const handleError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    setError(error)
    setHasError(true)
    console.error('Zora Error Boundary Error:', error, errorInfo)
  }, [])

  const reset = React.useCallback(() => {
    setError(null)
    setHasError(false)
  }, [])

  return {
    error,
    hasError,
    handleError,
    reset
  }
}

// ===== ERROR DISPLAY COMPONENTS =====

/**
 * Component to display Zora errors with recovery options
 */
interface ZoraErrorDisplayProps {
  readonly error: Error
  readonly onRetry?: () => void
  readonly onReset?: () => void
  readonly showDetails?: boolean
}

export function ZoraErrorDisplay({ 
  error, 
  onRetry, 
  onReset, 
  showDetails = false 
}: ZoraErrorDisplayProps): ReactNode {
  const isZora = isZoraError(error)
  const userMessage = getUserErrorMessage(error)
  const recoverySuggestion = getRecoverySuggestion(error)

  // Show error as toast instead of inline Alert to avoid UI disruption
  React.useEffect(() => {
    const message = recoverySuggestion ? `${userMessage}. ${recoverySuggestion}` : userMessage
    
    handleUIError(error, 'Zora', onRetry || onReset || undefined)
  }, [error, userMessage, recoverySuggestion, onRetry, onReset])

  // Return null to avoid rendering anything inline
  return null
}

/**
 * Component to display network errors with network switching
 */
interface NetworkErrorDisplayProps {
  readonly error: Error
  readonly supportedNetworks?: string[]
  readonly onSwitchNetwork?: (network: string) => void
}

export function NetworkErrorDisplay({ 
  error, 
  supportedNetworks = ['Base', 'Base Sepolia'],
  onSwitchNetwork 
}: NetworkErrorDisplayProps): ReactNode {
  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="space-y-2">
          <div className="font-medium">Network Not Supported</div>
          <div className="text-sm text-orange-600">
            Zora operations are only supported on: {supportedNetworks.join(', ')}
          </div>
          
          {onSwitchNetwork && (
            <div className="flex gap-2 pt-2">
              {supportedNetworks.map(network => (
                <Button 
                  key={network}
                  onClick={() => onSwitchNetwork(network)}
                  variant="outline"
                  size="sm"
                >
                  Switch to {network}
                </Button>
              ))}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Component to display gas errors with gas adjustment
 */
interface GasErrorDisplayProps {
  readonly error: Error
  readonly onIncreaseGas?: () => void
  readonly onAdjustGasLimit?: () => void
}

export function GasErrorDisplay({ 
  error, 
  onIncreaseGas, 
  onAdjustGasLimit 
}: GasErrorDisplayProps): ReactNode {
  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="space-y-2">
          <div className="font-medium">Gas Estimation Failed</div>
          <div className="text-sm text-yellow-600">
            The transaction requires more gas than estimated
          </div>
          
          {(onIncreaseGas || onAdjustGasLimit) && (
            <div className="flex gap-2 pt-2">
              {onIncreaseGas && (
                <Button 
                  onClick={onIncreaseGas}
                  variant="outline"
                  size="sm"
                >
                  Increase Gas Price
                </Button>
              )}
              {onAdjustGasLimit && (
                <Button 
                  onClick={onAdjustGasLimit}
                  variant="outline"
                  size="sm"
                >
                  Adjust Gas Limit
                </Button>
              )}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Enhanced Loading States Component
 * 
 * Provides precise, contextual loading indicators that accurately reflect
 * the current Web3 connection and data loading state. Eliminates the 
 * "always loading" problem by showing appropriate states for each phase.
 */

import React from 'react'
import { Loader2, Wifi, WifiOff, Database, DollarSign, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ConnectionState {
  readonly isConnected: boolean
  readonly hasValidChain: boolean
  readonly hasContractAddresses: boolean
  readonly isInitialized: boolean
}

interface LoadingState {
  readonly isConnecting: boolean
  readonly isLoadingBalances: boolean
  readonly isLoadingPrices: boolean
  readonly isInitializing: boolean
}

interface EnhancedLoadingStatesProps {
  readonly connectionState: ConnectionState
  readonly loadingState: LoadingState
  readonly error?: string | null
  readonly showDetails?: boolean
  readonly variant?: 'default' | 'compact' | 'inline'
  readonly className?: string
}

export const EnhancedLoadingStates: React.FC<EnhancedLoadingStatesProps> = ({
  connectionState,
  loadingState,
  error,
  showDetails = false,
  variant = 'default',
  className
}) => {
  // Determine the primary state
  const getMainState = () => {
    if (error) return 'error'
    if (!connectionState.isConnected) return 'disconnected'
    if (loadingState.isConnecting) return 'connecting'
    if (loadingState.isInitializing) return 'initializing'
    if (loadingState.isLoadingBalances || loadingState.isLoadingPrices) return 'loading-data'
    return 'ready'
  }

  const mainState = getMainState()

  // State configurations
  const stateConfig = {
    disconnected: {
      icon: WifiOff,
      label: 'Wallet Disconnected',
      message: 'Connect your wallet to view balances',
      color: 'text-muted-foreground',
      showSpinner: false
    },
    connecting: {
      icon: Wifi,
      label: 'Connecting',
      message: 'Establishing wallet connection...',
      color: 'text-blue-500',
      showSpinner: true
    },
    initializing: {
      icon: Database,
      label: 'Initializing',
      message: 'Loading blockchain configuration...',
      color: 'text-blue-500',
      showSpinner: true
    },
    'loading-data': {
      icon: DollarSign,
      label: 'Loading Data',
      message: 'Fetching balances and prices...',
      color: 'text-blue-500',
      showSpinner: true
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      message: error || 'An error occurred',
      color: 'text-red-500',
      showSpinner: false
    },
    ready: {
      icon: DollarSign,
      label: 'Ready',
      message: 'Data loaded successfully',
      color: 'text-green-500',
      showSpinner: false
    }
  }

  const config = stateConfig[mainState]
  const IconComponent = config.icon

  // Render variants
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {config.showSpinner ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <IconComponent className={cn('h-4 w-4', config.color)} />
        )}
        <span className={cn('text-sm', config.color)}>
          {config.label}
        </span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {config.showSpinner ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <IconComponent className={cn('h-5 w-5', config.color)} />
            )}
            <div className="flex-1">
              <div className={cn('font-medium', config.color)}>
                {config.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {config.message}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant with full details
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {config.showSpinner ? (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mt-1" />
          ) : (
            <IconComponent className={cn('h-6 w-6 mt-1', config.color)} />
          )}
          
          <div className="flex-1 space-y-3">
            <div>
              <div className={cn('font-semibold text-lg', config.color)}>
                {config.label}
              </div>
              <div className="text-muted-foreground">
                {config.message}
              </div>
            </div>

            {showDetails && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Status Details:</div>
                <div className="grid grid-cols-2 gap-2">
                  <StatusItem 
                    label="Wallet" 
                    status={connectionState.isConnected} 
                  />
                  <StatusItem 
                    label="Network" 
                    status={connectionState.hasValidChain} 
                  />
                  <StatusItem 
                    label="Contracts" 
                    status={connectionState.hasContractAddresses} 
                  />
                  <StatusItem 
                    label="Initialized" 
                    status={connectionState.isInitialized} 
                  />
                </div>

                {(loadingState.isLoadingBalances || loadingState.isLoadingPrices) && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Loading:</div>
                    <div className="flex gap-2">
                      {loadingState.isLoadingBalances && (
                        <Badge variant="secondary" className="text-xs">
                          Balances
                        </Badge>
                      )}
                      {loadingState.isLoadingPrices && (
                        <Badge variant="secondary" className="text-xs">
                          Prices
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper component for status items
const StatusItem: React.FC<{
  label: string
  status: boolean
}> = ({ label, status }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}:</span>
    <Badge 
      variant={status ? "default" : "secondary"}
      className={cn(
        "text-xs",
        status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      )}
    >
      {status ? "✓" : "✗"}
    </Badge>
  </div>
)

// Export helper hook for easy integration
export const useLoadingStateMessage = (
  connectionState: ConnectionState,
  loadingState: LoadingState,
  error?: string | null
): string => {
  if (error) return `Error: ${error}`
  if (!connectionState.isConnected) return 'Connect wallet to continue'
  if (loadingState.isConnecting) return 'Connecting to wallet...'
  if (loadingState.isInitializing) return 'Initializing blockchain connection...'
  if (loadingState.isLoadingBalances) return 'Loading token balances...'
  if (loadingState.isLoadingPrices) return 'Fetching current prices...'
  return 'Ready'
}

export default EnhancedLoadingStates
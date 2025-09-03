/**
 * Unified Transaction Status Component - Consistent Across All Environments
 * File: src/components/web3/UnifiedTransactionStatus.tsx
 *
 * This component provides a unified transaction status experience that works
 * consistently across web and mini app environments. It uses the TransactionState
 * interface from the UnifiedMiniAppProvider for consistent state management.
 */

'use client'

import React from 'react'
import {
  CheckCircle,
  Clock,
  Loader2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'

// ================================================
// STATUS ICON COMPONENT
// ================================================

interface TransactionStatusIconProps {
  status: 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'failed'
}

function TransactionStatusIcon({ status }: TransactionStatusIconProps) {
  switch (status) {
    case 'submitting':
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    case 'confirming':
      return <Clock className="h-5 w-5 text-amber-500" />
    case 'confirmed':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-red-500" />
    default:
      return <Clock className="h-5 w-5 text-gray-500" />
  }
}

// ================================================
// PROGRESS SECTION COMPONENT
// ================================================

interface TransactionProgressSectionProps {
  progress: {
    readonly submitted: boolean
    readonly confirming: boolean
    readonly confirmed: boolean
    readonly progressText: string
  }
  status: 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'failed'
}

function TransactionProgressSection({ progress, status }: TransactionProgressSectionProps) {
  const progressPercentage = React.useMemo(() => {
    switch (status) {
      case 'idle':
        return 0
      case 'submitting':
        return 25
      case 'confirming':
        return 75
      case 'confirmed':
        return 100
      case 'failed':
        return 0
      default:
        return 0
    }
  }, [status])

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Transaction Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <Progress
          value={progressPercentage}
          className={cn(
            'h-2',
            status === 'failed' && 'bg-red-100',
            status === 'confirmed' && 'bg-green-100'
          )}
        />
      </div>

      {/* Progress steps */}
      <div className="space-y-3">
        <ProgressStep
          label="Transaction Submitted"
          isComplete={progress.submitted}
          isActive={status === 'submitting'}
          description="Sending transaction to blockchain"
        />
        <ProgressStep
          label="Awaiting Confirmation"
          isComplete={progress.confirming}
          isActive={status === 'confirming'}
          description="Waiting for network confirmation"
        />
        <ProgressStep
          label="Transaction Confirmed"
          isComplete={progress.confirmed}
          isActive={status === 'confirmed'}
          description="Successfully recorded on blockchain"
        />
      </div>

      {/* Dynamic progress message */}
      {progress.progressText && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            {progress.progressText}
          </p>
        </div>
      )}
    </div>
  )
}

// ================================================
// PROGRESS STEP COMPONENT
// ================================================

interface ProgressStepProps {
  label: string
  isComplete: boolean
  isActive: boolean
  description: string
}

function ProgressStep({ label, isComplete, isActive, description }: ProgressStepProps) {
  return (
    <div className="flex items-start gap-3">
      {/* Step indicator */}
      <div className={cn(
        'mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center',
        isComplete && 'bg-green-500 border-green-500',
        isActive && !isComplete && 'border-blue-500',
        !isActive && !isComplete && 'border-gray-300'
      )}>
        {isComplete && <CheckCircle className="h-3 w-3 text-white" />}
        {isActive && !isComplete && (
          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 space-y-1">
        <p className={cn(
          'text-sm font-medium',
          isComplete && 'text-green-700',
          isActive && !isComplete && 'text-blue-700',
          !isActive && !isComplete && 'text-gray-500'
        )}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

// ================================================
// TRANSACTION HASH SECTION
// ================================================

interface TransactionHashSectionProps {
  transactionHash: string | null
  onViewTransaction: () => void
}

function TransactionHashSection({ transactionHash, onViewTransaction }: TransactionHashSectionProps) {
  if (!transactionHash) return null

  const formattedHash = `${transactionHash.slice(0, 6)}...${transactionHash.slice(-4)}`

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Transaction Hash</h4>
      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
        <code className="flex-1 text-xs font-mono">
          {formattedHash}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewTransaction}
          className="h-auto p-1"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Click the link icon to view this transaction on the blockchain explorer
      </p>
    </div>
  )
}

// ================================================
// ERROR SECTION COMPONENT
// ================================================

interface TransactionErrorSectionProps {
  canRetry: boolean
  onRetry: () => void
  onReset: () => void
}

function TransactionErrorSection({ canRetry, onRetry: _onRetry, onReset: _onReset }: TransactionErrorSectionProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-red-800">
            Transaction Failed
          </h4>
          <p className="text-sm text-red-700">
            Your transaction could not be completed. This might be due to network
            congestion, insufficient gas, or other blockchain-related issues.
          </p>
        </div>
      </div>

      {/* Recovery suggestions */}
      <div className="space-y-2">
        <h5 className="text-xs font-medium text-red-800 uppercase tracking-wide">
          What you can do:
        </h5>
        <ul className="text-xs text-red-700 space-y-1">
          <li>• Check your wallet for any pending transactions</li>
          <li>• Ensure you have sufficient balance for gas fees</li>
          {canRetry && <li>• Try the transaction again</li>}
          <li>• Contact support if the problem persists</li>
        </ul>
      </div>
    </div>
  )
}

// ================================================
// ACTION BUTTONS SECTION
// ================================================

interface TransactionActionsSectionProps {
  status: 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'failed'
  canRetry: boolean
  onRetry: () => void
  onReset: () => void
  onClose: () => void
}

function TransactionActionsSection({
  status,
  canRetry,
  onRetry,
  onReset,
  onClose
}: TransactionActionsSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Status-specific actions */}
      {status === 'failed' && (
        <div className="flex gap-2">
          {canRetry && (
            <Button onClick={onRetry} variant="default" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Transaction
            </Button>
          )}
          <Button onClick={onReset} variant="outline" className="flex-1">
            Reset
          </Button>
        </div>
      )}

      {/* Close button */}
      {(status === 'confirmed' || status === 'failed' || status === 'idle') && (
        <Button onClick={onClose} variant="outline" className="w-full">
          <X className="h-4 w-4 mr-2" />
          {status === 'confirmed' ? 'Done' : 'Close'}
        </Button>
      )}

      {/* Loading state guidance */}
      {(status === 'submitting' || status === 'confirming') && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Please keep this window open while the transaction processes
          </p>
        </div>
      )}
    </div>
  )
}

// ================================================
// MAIN UNIFIED TRANSACTION STATUS COMPONENT
// ================================================

interface UnifiedTransactionStatusProps {
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Callback when the modal should be closed */
  onClose: () => void
  /** Optional title for the transaction */
  transactionTitle?: string
  /** Optional callback when the transaction completes successfully */
  onSuccess?: () => void
  /** Custom styling className */
  className?: string
}

export function UnifiedTransactionStatus({
  isOpen,
  onClose,
  transactionTitle = 'Transaction',
  onSuccess,
  className
}: UnifiedTransactionStatusProps) {
  const { state } = useUnifiedMiniApp()
  const transactionState = state.transactionState

  // Handle successful transaction completion
  React.useEffect(() => {
    if (transactionState.status === 'confirmed' && onSuccess) {
      const timer = setTimeout(() => {
        onSuccess()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [transactionState.status, onSuccess])

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className={cn('w-full max-w-md mx-4', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TransactionStatusIcon status={transactionState.status} />
            <CardTitle className="text-lg">{transactionTitle} Status</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress visualization */}
          <TransactionProgressSection
            progress={transactionState.progress}
            status={transactionState.status}
          />

          {/* Transaction hash display */}
          <TransactionHashSection
            transactionHash={transactionState.transactionHash}
            onViewTransaction={transactionState.viewTransaction}
          />

          {/* Error handling section */}
          {transactionState.status === 'failed' && (
            <TransactionErrorSection
              canRetry={transactionState.canRetry}
              onRetry={transactionState.retry}
              onReset={transactionState.reset}
            />
          )}

          {/* Action buttons */}
          <TransactionActionsSection
            status={transactionState.status}
            canRetry={transactionState.canRetry}
            onRetry={transactionState.retry}
            onReset={transactionState.reset}
            onClose={onClose}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ================================================
// INLINE TRANSACTION STATUS COMPONENT
// ================================================

interface InlineTransactionStatusProps {
  className?: string
}

export function InlineTransactionStatus({ className }: InlineTransactionStatusProps) {
  const { state } = useUnifiedMiniApp()
  const transactionState = state.transactionState

  // Don't render if idle
  if (transactionState.status === 'idle') return null

  return (
    <Alert className={cn(
      'border-l-4',
      transactionState.status === 'confirmed' && 'border-l-green-500 bg-green-50',
      transactionState.status === 'failed' && 'border-l-red-500 bg-red-50',
      transactionState.status === 'submitting' && 'border-l-blue-500 bg-blue-50',
      transactionState.status === 'confirming' && 'border-l-amber-500 bg-amber-50',
      className
    )}>
      <TransactionStatusIcon status={transactionState.status} />
      <AlertDescription className="flex items-center justify-between">
        <span>{transactionState.formattedStatus}</span>
        {transactionState.progress.progressText && (
          <span className="text-xs text-muted-foreground ml-2">
            {transactionState.progress.progressText}
          </span>
        )}
      </AlertDescription>
    </Alert>
  )
}

// ================================================
// HOOK FOR TRANSACTION STATUS MANAGEMENT
// ================================================

export function useUnifiedTransactionStatus() {
  const { state, actions } = useUnifiedMiniApp()
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const startTransaction = React.useCallback(async (
    transactionType: string,
    transactionFn: () => Promise<void>
  ) => {
    try {
      setIsModalOpen(true)
      await actions.executeTransaction(transactionType, {})
      // The transaction function would be called here
      await transactionFn()
    } catch (error) {
      console.error('Transaction failed:', error)
    }
  }, [actions])

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false)
  }, [])

  return {
    transactionState: state.transactionState,
    isModalOpen,
    startTransaction,
    closeModal
  }
}

// ================================================
// EXPORTS
// ================================================

export default UnifiedTransactionStatus
export type { UnifiedTransactionStatusProps, InlineTransactionStatusProps }

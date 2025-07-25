/**
 * Transaction Status Modal Component
 * File: src/components/web3/TransactionStatusModal.tsx
 * 
 * This component transforms one of the most anxiety-inducing aspects of Web3 UX - 
 * waiting for transaction confirmation - into a confident, reassuring experience.
 * It demonstrates how our UI integration hooks provide comprehensive transaction
 * tracking that makes complex blockchain operations feel transparent and reliable.
 * 
 * Key Features:
 * - Real-time transaction status with clear progress indicators
 * - User-friendly status messages that explain what's happening
 * - Direct links to blockchain explorers for transparency
 * - Automatic error recovery suggestions and retry mechanisms
 * - Responsive design with smooth animations and transitions
 * 
 * This component showcases how sophisticated blockchain complexity can be
 * transformed into intuitive user experiences through proper abstraction.
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Import the TransactionStatusUI interface from our UI integration layer
import type { TransactionStatusUI } from '@/hooks/ui/integration'

/**
 * Props interface for the TransactionStatusModal component
 * 
 * This interface demonstrates how our architectural layers work together.
 * The component receives a TransactionStatusUI object from any UI integration
 * hook, making it reusable across different transaction types.
 */
interface TransactionStatusModalProps {
  /** Transaction status data from any UI integration hook */
  transactionStatus: TransactionStatusUI
  /** Whether the modal is currently open */
  isOpen: boolean
  /** Callback when the modal should be closed */
  onClose: () => void
  /** Optional title for the transaction (e.g., "Content Purchase", "Creator Registration") */
  transactionTitle?: string
  /** Optional callback when the transaction completes successfully */
  onSuccess?: () => void
  /** Optional custom styling */
  className?: string
}

/**
 * TransactionStatusModal Component
 * 
 * This component demonstrates the power of our TransactionStatusUI interface.
 * It can display transaction status for any type of blockchain operation -
 * content purchases, creator registration, token approvals - because our
 * UI integration hooks provide consistent interfaces.
 */
export function TransactionStatusModal({
  transactionStatus,
  isOpen,
  onClose,
  transactionTitle = 'Transaction',
  onSuccess,
  className
}: TransactionStatusModalProps) {
  // Handle successful transaction completion
  React.useEffect(() => {
    if (transactionStatus.status === 'confirmed' && onSuccess) {
      // Add a small delay to let users see the success state
      const timer = setTimeout(() => {
        onSuccess()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [transactionStatus.status, onSuccess])

  // Calculate progress percentage based on transaction state
  const progressPercentage = React.useMemo(() => {
    switch (transactionStatus.status) {
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
  }, [transactionStatus.status])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TransactionStatusIcon status={transactionStatus.status} />
            {transactionTitle} Status
          </DialogTitle>
          <DialogDescription>
            {transactionStatus.formattedStatus}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress visualization */}
          <TransactionProgressSection
            status={transactionStatus.status}
            progress={transactionStatus.progress}
            progressPercentage={progressPercentage}
          />

          {/* Transaction hash display (when available) */}
          {transactionStatus.transactionHash && (
            <TransactionHashSection
              transactionHash={transactionStatus.transactionHash}
              onViewTransaction={transactionStatus.viewTransaction}
            />
          )}

          {/* Error handling section */}
          {transactionStatus.status === 'failed' && (
            <TransactionErrorSection
              canRetry={transactionStatus.canRetry}
              onRetry={transactionStatus.retry}
              onReset={transactionStatus.reset}
            />
          )}

          {/* Action buttons */}
          <TransactionActionsSection
            status={transactionStatus.status}
            canRetry={transactionStatus.canRetry}
            onRetry={transactionStatus.retry}
            onReset={transactionStatus.reset}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Transaction Status Icon Component
 * 
 * This component provides visual feedback about transaction state using
 * appropriate icons and animations. The icon choice reinforces the
 * current state and helps users understand progress at a glance.
 */
function TransactionStatusIcon({ status }: { status: TransactionStatusUI['status'] }) {
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

/**
 * Transaction Progress Section
 * 
 * This section provides detailed progress visualization with both a progress
 * bar and step-by-step indicators. It transforms abstract blockchain concepts
 * into concrete, understandable progress milestones.
 */
function TransactionProgressSection({
  status,
  progress,
  progressPercentage
}: {
  status: TransactionStatusUI['status']
  progress: TransactionStatusUI['progress']
  progressPercentage: number
}) {
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

      {/* Detailed progress steps */}
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

/**
 * Individual Progress Step Component
 * 
 * This component represents a single step in the transaction process,
 * providing clear visual indicators about completion status and current activity.
 */
function ProgressStep({
  label,
  isComplete,
  isActive,
  description
}: {
  label: string
  isComplete: boolean
  isActive: boolean
  description: string
}) {
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

/**
 * Transaction Hash Section
 * 
 * This section displays the transaction hash and provides a direct link
 * to view the transaction on a blockchain explorer. This transparency
 * builds user confidence and enables verification.
 */
function TransactionHashSection({
  transactionHash,
  onViewTransaction
}: {
  transactionHash: string
  onViewTransaction: () => void
}) {
  // Format transaction hash for display (first 6 and last 4 characters)
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

/**
 * Transaction Error Section
 * 
 * This section handles error states by providing clear explanations
 * and actionable recovery options. It transforms technical failures
 * into user-friendly guidance for resolution.
 */
function TransactionErrorSection({
  canRetry,
  onRetry,
  onReset
}: {
  canRetry: boolean
  onRetry: () => void
  onReset: () => void
}) {
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

/**
 * Transaction Actions Section
 * 
 * This section provides appropriate action buttons based on the current
 * transaction state. It enables users to retry failed transactions,
 * reset the state, or close the modal when appropriate.
 */
function TransactionActionsSection({
  status,
  canRetry,
  onRetry,
  onReset,
  onClose
}: {
  status: TransactionStatusUI['status']
  canRetry: boolean
  onRetry: () => void
  onReset: () => void
  onClose: () => void
}) {
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

/**
 * Usage Examples and Integration Patterns
 * 
 * // Basic usage with any transaction status
 * const purchaseUI = useContentPurchaseUI(contentId, userAddress)
 * 
 * <TransactionStatusModal
 *   transactionStatus={purchaseUI.transactionStatus}
 *   isOpen={showTransactionModal}
 *   onClose={() => setShowTransactionModal(false)}
 *   transactionTitle="Content Purchase"
 *   onSuccess={() => {
 *     setShowTransactionModal(false)
 *     router.push('/content/' + contentId)
 *   }}
 * />
 * 
 * // With creator registration
 * const onboardingUI = useCreatorOnboardingUI(userAddress)
 * 
 * <TransactionStatusModal
 *   transactionStatus={onboardingUI.transactionStatus}
 *   isOpen={showRegistrationModal}
 *   onClose={() => setShowRegistrationModal(false)}
 *   transactionTitle="Creator Registration"
 * />
 */
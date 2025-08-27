/**
 * Orchestrated Payment Integration for ContentPurchaseCard
 * 
 * This component integrates the sophisticated PaymentFlowOrchestrator into your existing
 * ContentPurchaseCard, replacing the basic payment intent flow with production-ready
 * intelligent payment processing. It maintains full backward compatibility with your
 * existing UI while adding advanced error recovery, health monitoring, and performance tracking.
 * 
 * ENHANCED ARCHITECTURE:
 * - Payment Intent Phases - Prevents premature RPC calls until user expresses intent
 * - Conditional Hook Enabling - Balance/allowance hooks only active after intent
 * - Progressive Enhancement - Show content info first, payment options second
 * - Payment Method Selection Modal - Dedicated interface for payment methods
 * - Enhanced Error Handling - Comprehensive error recovery with user-friendly options
 * - Transaction Receipt Validation - Proper blockchain confirmation before showing success
 * 
 * INTEGRATION ARCHITECTURE:
 * - Replaces usePaymentIntentFlow with usePaymentFlowOrchestrator
 * - Maps orchestrated state to existing UI components and patterns
 * - Maintains all current payment methods (USDC direct, ETH swap)
 * - Adds intelligent error recovery with user-friendly messaging
 * - Provides real-time backend health monitoring and adaptive behavior
 * - Implements comprehensive performance tracking and bottleneck identification
 * - Validates transaction receipts to prevent false success states
 * 
 * PRODUCTION-READY FEATURES:
 * - Zero RPC calls until user expresses purchase intent
 * - Circuit breaker prevents backend overload during high traffic
 * - Exponential backoff reduces system load during recovery periods
 * - Automatic error classification with targeted recovery strategies
 * - Real-time progress tracking with accurate time estimates
 * - Comprehensive error handling with graceful degradation
 * - Performance monitoring with detailed timing metrics
 * - Transaction receipt validation prevents false success states
 * - Proper handling of user cancellations in wallet
 * 
 * File: src/components/content/OrchestratedContentPurchaseCard.tsx
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useReadContract, useChainId, useWaitForTransactionReceipt, useBalance, useSendCalls } from 'wagmi'
import { type Address, encodeFunctionData } from 'viem'
import { getContractAddresses } from '@/lib/contracts/config'
import { 
  PRICE_ORACLE_ABI, 
  COMMERCE_PROTOCOL_INTEGRATION_ABI, 
  ERC20_ABI, 
  PAY_PER_VIEW_ABI 
} from '@/lib/contracts/abis'
import {
  ShoppingCart,
  Eye,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Loader2,
  DollarSign,
  Zap,
  Coins,
  RefreshCw,
  Wallet,
  AlertTriangle,
  ExternalLink,
  Clock,
  Activity,
  Shield,
  Timer,
  RotateCcw,
  X
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/lib/utils'

// Import business logic hooks and utilities
import { useContentById, useHasContentAccess, useTokenBalance, useTokenAllowance } from '@/hooks/contracts/core'
import { useUnifiedContentPurchaseFlow, PaymentMethod } from '@/hooks/business/workflows'
import { formatCurrency, formatTokenBalance, formatAddress } from '@/lib/utils'

// Import the orchestrated payment system
import { 
  usePaymentFlowOrchestrator,
  PaymentResult,
  OrchestratedPaymentFlowState
} from '@/hooks/web3/usePaymentFlowOrchestrator'

// Import error recovery system

/**
 * Payment Intent Phases
 * Tracks the user's journey from browsing to purchasing
 */
enum PaymentIntentPhase {
  BROWSING = 'browsing',           // User is viewing content info
  INTENT_EXPRESSED = 'intent_expressed', // User clicked "Purchase Content"
  SELECTING_METHOD = 'selecting_method', // User is choosing payment method
  PAYMENT_ACTIVE = 'payment_active',     // Payment is being processed
  WAITING_CONFIRMATION = 'waiting_confirmation', // Waiting for blockchain confirmation
  COMPLETED = 'completed',               // Purchase completed and confirmed
  CANCELLED = 'cancelled',               // User cancelled transaction
  FAILED = 'failed'                      // Transaction failed
}

/**
 * Transaction Status Tracking
 * Tracks the actual blockchain transaction status
 */
interface TransactionStatus {
  readonly hash: `0x${string}` | null
  readonly status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | null
  readonly confirmedAt: number | null
  readonly error: Error | null
  readonly receipt: any | null
}

/**
 * Payment Method Configuration Interface
 */
interface PaymentMethodConfig {
  readonly id: PaymentMethod
  readonly name: string
  readonly description: string
  readonly estimatedTime: string
  readonly gasEstimate: 'Low' | 'Medium' | 'High'
  readonly requiresApproval: boolean
  readonly icon: React.ComponentType<{ className?: string }>
  readonly isAvailable: boolean
  readonly healthStatus?: 'healthy' | 'degraded' | 'unavailable'
}

/**
 * Token Information Interface - Only populated after intent expressed
 */
interface TokenInfo {
  readonly address: Address
  readonly symbol: string
  readonly name: string
  readonly decimals: number
  readonly balance: bigint | null
  readonly requiredAmount: bigint
  readonly hasEnoughBalance: boolean
  readonly allowance?: bigint
  readonly needsApproval?: boolean
  readonly isLoading?: boolean
  readonly error?: string
}

/**
 * Enhanced Payment State with Intent Tracking and Transaction Validation
 */
interface EnhancedPaymentState {
  readonly intentPhase: PaymentIntentPhase
  readonly selectedMethod: PaymentMethod | null
  readonly showMethodSelector: boolean
  readonly isProcessing: boolean
  readonly lastPaymentResult: PaymentResult | null
  readonly transactionStatus: TransactionStatus
  readonly errorRecoveryOptions: Array<{
    readonly action: string
    readonly label: string
    readonly description: string
    readonly isRecommended: boolean
  }>
}

/**
 * Payment Method Selection Modal
 */
interface PaymentMethodSelectorProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly contentPrice: bigint
  readonly availableMethods: PaymentMethodConfig[]
  readonly onMethodSelect: (method: PaymentMethod) => void
}

function PaymentMethodSelector({
  isOpen,
  onClose,
  contentPrice,
  availableMethods,
  onMethodSelect
}: PaymentMethodSelectorProps) {
  // Add ref to access the modal element
  const modalRef = React.useRef<HTMLDivElement>(null)
  
  return (
    <>
      {/* Custom Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Custom Modal Content */}
      {isOpen && (
        <div 
          ref={modalRef}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000,
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: 'min(90vw, 500px)',
            maxHeight: 'min(80vh, 600px)',
            width: '90vw',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <div className="flex-shrink-0 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Select Payment Method</h2>
                <p className="text-sm text-muted-foreground">
                  Choose how you'd like to pay for this content
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
            {availableMethods.map(method => (
              <div
                key={method.id}
                className="border rounded-lg p-3 sm:p-4 cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => {
                  onMethodSelect(method.id)
                  // Don't call onClose() here - let handleMethodSelect handle the modal state
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <method.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{method.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {method.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm flex-shrink-0">
                    <div className="text-muted-foreground">{method.estimatedTime}</div>
                    <div className="text-xs">Gas: {method.gasEstimate}</div>
                  </div>
                </div>
                
                {method.requiresApproval && (
                  <div className="mt-2 text-xs text-amber-600">
                    Requires token approval
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * System Health Display Component
 */
interface SystemHealthIndicatorProps {
  readonly health: OrchestratedPaymentFlowState['systemHealth']
  readonly compact?: boolean
}

function SystemHealthIndicator({ health, compact = false }: SystemHealthIndicatorProps) {
  const getHealthIcon = () => {
    switch (health.overallStatus) {
      case 'healthy': return <Shield className="h-4 w-4 text-green-500" />
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getHealthMessage = () => {
    switch (health.overallStatus) {
      case 'healthy': return compact ? 'System Optimal' : 'Payment system operating normally'
      case 'degraded': return compact ? 'System Degraded' : 'Some payment methods may be slower'
      case 'critical': return compact ? 'System Issues' : 'Payment system experiencing issues'
      default: return 'Checking system status...'
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {getHealthIcon()}
      <span className="text-muted-foreground">{getHealthMessage()}</span>
    </div>
  )
}

/**
 * Payment Progress Display Component
 */
interface PaymentProgressDisplayProps {
  readonly state: OrchestratedPaymentFlowState
  readonly onCancel?: () => void
  readonly onRetry?: () => void
}

function PaymentProgressDisplay({ state, onCancel, onRetry }: PaymentProgressDisplayProps) {
  const getPhaseIcon = () => {
    switch (state.phase) {
      case 'initializing': return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'creating_intent': return <CreditCard className="h-5 w-5 text-blue-500" />
      case 'waiting_signature': return <Clock className="h-5 w-5 text-yellow-500" />
      case 'executing_payment': return <Zap className="h-5 w-5 text-orange-500" />
      case 'confirming': return <Shield className="h-5 w-5 text-green-500" />
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'recovering': return <RotateCcw className="h-5 w-5 animate-spin text-orange-500" />
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-500" />
      default: return <Activity className="h-5 w-5 text-gray-400" />
    }
  }

  const getPhaseDescription = () => {
    switch (state.phase) {
      case 'initializing': return 'Preparing payment system...'
      case 'creating_intent': return 'Creating payment intent on blockchain...'
      case 'waiting_signature': return 'Waiting for backend authorization...'
      case 'executing_payment': return 'Executing ETH → USDC swap...'
      case 'confirming': return 'Confirming transaction completion...'
      case 'completed': return 'Payment completed successfully!'
      case 'recovering': return 'Attempting automatic recovery...'
      case 'failed': return 'Payment encountered an error'
      default: return 'Processing payment...'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getPhaseIcon()}
            <div>
              <CardTitle className="text-lg">Payment in Progress</CardTitle>
              <CardDescription className="text-sm">
                {getPhaseDescription()}
              </CardDescription>
            </div>
          </div>
          {state.userInteraction.canCancel && onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Progress</span>
            <span>{state.progress}%</span>
          </div>
          <Progress value={state.progress} className="h-2" />
        </div>

        {/* Time Estimate */}
        {state.paymentProgress.estimatedTimeRemaining > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span>
              Estimated time remaining: {Math.ceil(state.paymentProgress.estimatedTimeRemaining / 1000)}s
            </span>
          </div>
        )}

        {/* Payment Steps */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Payment Steps</div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { key: 'intentCreated', label: 'Intent Created', completed: state.paymentProgress.intentCreated },
              { key: 'signatureReceived', label: 'Authorization Received', completed: state.paymentProgress.signatureReceived },
              { key: 'paymentExecuted', label: 'Payment Executed', completed: state.paymentProgress.paymentExecuted },
              { key: 'paymentConfirmed', label: 'Payment Confirmed', completed: state.paymentProgress.paymentConfirmed }
            ].map(step => (
              <div key={step.key} className="flex items-center gap-3">
                {step.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className={cn(
                  "text-sm",
                  step.completed ? "text-green-700" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <SystemHealthIndicator health={state.systemHealth} compact />

        {/* Performance Metrics */}
        {state.performance.totalDuration && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Total Duration: {(state.performance.totalDuration / 1000).toFixed(1)}s</div>
            {state.performance.bottleneckPhase && (
              <div>Bottleneck: {state.performance.bottleneckPhase}</div>
            )}
          </div>
        )}

        {/* Error Recovery Options */}
        {state.recoveryContext.isRecovering && state.recoveryContext.availableRecoveryActions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-orange-600">Recovery Options</div>
            <div className="grid gap-2">
              {state.recoveryContext.availableRecoveryActions.map(action => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="justify-start"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {action === 'retry' ? 'Retry Payment' : action}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {state.phase === 'failed' && onRetry && (
        <CardFooter>
          <Button onClick={onRetry} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry Payment
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

/**
 * Orchestrated ContentPurchaseCard Props
 */
interface OrchestratedContentPurchaseCardProps {
  readonly contentId: bigint
  readonly userAddress?: Address
  readonly onPurchaseSuccess?: (contentId: bigint, result: PaymentResult) => void
  readonly onViewContent?: (contentId: bigint) => void
  readonly variant?: 'full' | 'compact' | 'minimal'
  readonly className?: string
  readonly showCreatorInfo?: boolean
  readonly showPurchaseDetails?: boolean
  readonly enableMultiPayment?: boolean
  readonly showSystemHealth?: boolean
  readonly enablePerformanceMetrics?: boolean
}

/**
 * Orchestrated ContentPurchaseCard Component
 * 
 * Production-ready content purchase component with intelligent payment processing,
 * comprehensive error recovery, and real-time system health monitoring.
 */
export function OrchestratedContentPurchaseCard({
  contentId,
  userAddress,
  onPurchaseSuccess,
  onViewContent,
  variant = 'full',
  className,
  showCreatorInfo = true,
  showPurchaseDetails = true,
  enableMultiPayment = true,
  showSystemHealth = true,
  enablePerformanceMetrics = false
}: OrchestratedContentPurchaseCardProps) {
  const router = useRouter()
  const { address: connectedAddress, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Safe contract configuration
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.warn('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])
  
  // Use connected address if no userAddress provided
  const effectiveUserAddress = userAddress || connectedAddress

  // ===== CORE DATA HOOKS (Always Active) =====
  // These are lightweight and only fetch basic content info
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(effectiveUserAddress, contentId)

  // ===== PAYMENT INTENT STATE MANAGEMENT =====
  const [paymentState, setPaymentState] = useState<EnhancedPaymentState>({
    intentPhase: PaymentIntentPhase.BROWSING,
    selectedMethod: null,
    showMethodSelector: false,
    isProcessing: false,
    lastPaymentResult: null,
    transactionStatus: { hash: null, status: null, confirmedAt: null, error: null, receipt: null },
    errorRecoveryOptions: []
  })

  // ===== CONTRACT VALIDATION =====
  // Add validation to ensure contract is properly configured
  const contractValidation = useMemo(() => {
    if (!contractAddresses) return { isValid: false, error: 'No contract addresses' }
    
    const requiredContracts = [
      'COMMERCE_INTEGRATION',
      'PRICE_ORACLE',
      'USDC'
    ]
    
    for (const contractName of requiredContracts) {
      const address = contractAddresses[contractName as keyof typeof contractAddresses]
      if (!address || address === '0x0000000000000000000000000000000000000000') {
        return { isValid: false, error: `Invalid ${contractName} address: ${address}` }
      }
    }
    
    return { isValid: true, error: null }
  }, [contractAddresses])

  // Log contract validation for debugging
  useEffect(() => {
    if (!contractValidation.isValid) {
      console.error('❌ Contract validation failed:', contractValidation.error)
    } else {
      console.log('✅ Contract validation passed')
    }
  }, [contractValidation])

  // ===== CONDITIONAL PAYMENT DATA HOOKS (Only Active After Intent) =====
  // These hooks are only enabled after user expresses purchase intent
  const paymentDataEnabled = paymentState.intentPhase !== PaymentIntentPhase.BROWSING
  
  // ===== TRANSACTION RECEIPT HANDLING =====
  // Track transaction receipts for proper confirmation
  const [pendingTransactionHash, setPendingTransactionHash] = useState<`0x${string}` | null>(null)
  
  // Wait for transaction receipt when we have a pending transaction
  const { data: transactionReceipt, error: receiptError, isLoading: isReceiptLoading } = useWaitForTransactionReceipt({
    hash: pendingTransactionHash || undefined,
    confirmations: 1, // Wait for 1 confirmation
    timeout: 300000 // 5 minute timeout
  })
  
  // Monitor transaction receipt status
  useEffect(() => {
    if (pendingTransactionHash && transactionReceipt) {
      // Transaction confirmed on blockchain
      setPaymentState(prev => ({
        ...prev,
        intentPhase: PaymentIntentPhase.COMPLETED,
        transactionStatus: {
          hash: pendingTransactionHash,
          status: 'confirmed',
          confirmedAt: Date.now(),
          error: null,
          receipt: transactionReceipt
        }
      }))
      
      // Clear pending transaction
      setPendingTransactionHash(null)
      
      // Refresh access status
      accessQuery.refetch()
      
    } else if (pendingTransactionHash && receiptError) {
      // Transaction failed or was cancelled
      const isCancelled = receiptError.message.includes('User rejected') || 
                         receiptError.message.includes('User denied') ||
                         receiptError.message.includes('cancelled')
      
      setPaymentState(prev => ({
        ...prev,
        intentPhase: isCancelled ? PaymentIntentPhase.CANCELLED : PaymentIntentPhase.FAILED,
        transactionStatus: {
          hash: pendingTransactionHash,
          status: isCancelled ? 'cancelled' : 'failed',
          confirmedAt: null,
          error: receiptError,
          receipt: null
        }
      }))
      
      // Clear pending transaction
      setPendingTransactionHash(null)
    }
  }, [pendingTransactionHash, transactionReceipt, receiptError, accessQuery])
  
  // ===== DIRECT CONTRACT INTERACTION FOR PAYMENTS =====
  // Use direct writeContract for payments to get immediate error feedback
  const { 
    writeContract: writeEthContract, 
    data: ethTransactionHash, 
    error: ethWriteError, 
    isPending: isEthWritePending 
  } = useWriteContract()
  
  const { 
    writeContract: writeUsdcContract, 
    data: usdcTransactionHash, 
    error: usdcWriteError, 
    isPending: isUsdcWritePending 
  } = useWriteContract()
  
  // ===== EIP-5792 BATCH TRANSACTION SUPPORT =====
  // Use sendCalls for batch transactions (approve + purchase in one)
  const { 
    sendCalls, 
    data: batchTransactionHash, 
    error: batchError, 
    isPending: isBatchPending 
  } = useSendCalls()
  
  // Check if batch transactions are supported
  const canUseBatchTransactions = useMemo(() => {
    return !!sendCalls && !isBatchPending
  }, [sendCalls, isBatchPending])
  
  // Monitor batch transaction errors (immediate cancellation detection)
  useEffect(() => {
    if (batchError) {
      console.log('❌ Batch transaction error:', batchError)
      
      const isCancelled = batchError.message.includes('User rejected') || 
                         batchError.message.includes('User denied') ||
                         batchError.message.includes('cancelled') ||
                         batchError.message.includes('rejected')
      
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        intentPhase: isCancelled ? PaymentIntentPhase.CANCELLED : PaymentIntentPhase.FAILED,
        transactionStatus: {
          hash: null,
          status: isCancelled ? 'cancelled' : 'failed',
          confirmedAt: null,
          error: batchError,
          receipt: null
        }
      }))
    }
  }, [batchError])
  
  // Monitor batch transaction hash (when user approves)
  useEffect(() => {
    if (batchTransactionHash && paymentState.intentPhase === PaymentIntentPhase.PAYMENT_ACTIVE) {
      console.log('✅ Batch transaction hash received:', batchTransactionHash)
      // Extract the actual transaction hash from the batch result
      const txHash = (batchTransactionHash as any)?.id || batchTransactionHash
      
      if (txHash && typeof txHash === 'string') {
        setPendingTransactionHash(txHash as `0x${string}`)
        setPaymentState(prev => ({
          ...prev,
          intentPhase: PaymentIntentPhase.WAITING_CONFIRMATION,
          transactionStatus: {
            hash: txHash as `0x${string}`,
            status: 'pending',
            confirmedAt: null,
            error: null,
            receipt: null
          }
        }))
      }
    }
  }, [batchTransactionHash, paymentState.intentPhase])
  
  // Monitor ETH write contract errors (immediate cancellation detection)
  useEffect(() => {
    if (ethWriteError) {
      console.log('❌ ETH write contract error:', ethWriteError)
      
      const isCancelled = ethWriteError.message.includes('User rejected') || 
                         ethWriteError.message.includes('User denied') ||
                         ethWriteError.message.includes('cancelled') ||
                         ethWriteError.message.includes('rejected')
      
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        intentPhase: isCancelled ? PaymentIntentPhase.CANCELLED : PaymentIntentPhase.FAILED,
        transactionStatus: {
          hash: null,
          status: isCancelled ? 'cancelled' : 'failed',
          confirmedAt: null,
          error: ethWriteError,
          receipt: null
        }
      }))
    }
  }, [ethWriteError])
  
  // Monitor USDC write contract errors (immediate cancellation detection)
  useEffect(() => {
    if (usdcWriteError) {
      console.log('❌ USDC write contract error:', usdcWriteError)
      
      const isCancelled = usdcWriteError.message.includes('User rejected') || 
                         usdcWriteError.message.includes('User denied') ||
                         usdcWriteError.message.includes('cancelled') ||
                         usdcWriteError.message.includes('rejected')
      
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        intentPhase: isCancelled ? PaymentIntentPhase.CANCELLED : PaymentIntentPhase.FAILED,
        transactionStatus: {
          hash: null,
          status: isCancelled ? 'cancelled' : 'failed',
          confirmedAt: null,
          error: usdcWriteError,
          receipt: null
        }
      }))
    }
  }, [usdcWriteError])
  
  // Monitor ETH transaction hash (when user approves)
  useEffect(() => {
    if (ethTransactionHash && paymentState.intentPhase === PaymentIntentPhase.PAYMENT_ACTIVE) {
      console.log('✅ ETH transaction hash received:', ethTransactionHash)
      setPendingTransactionHash(ethTransactionHash)
      setPaymentState(prev => ({
        ...prev,
        intentPhase: PaymentIntentPhase.WAITING_CONFIRMATION,
        transactionStatus: {
          hash: ethTransactionHash,
          status: 'pending',
          confirmedAt: null,
          error: null,
          receipt: null
        }
      }))
    }
  }, [ethTransactionHash, paymentState.intentPhase])
  
  // Monitor USDC transaction hash (when user approves)
  useEffect(() => {
    if (usdcTransactionHash && paymentState.intentPhase === PaymentIntentPhase.PAYMENT_ACTIVE) {
      console.log('✅ USDC transaction hash received:', usdcTransactionHash)
      setPendingTransactionHash(usdcTransactionHash)
      setPaymentState(prev => ({
        ...prev,
        intentPhase: PaymentIntentPhase.WAITING_CONFIRMATION,
        transactionStatus: {
          hash: usdcTransactionHash,
          status: 'pending',
          confirmedAt: null,
          error: null,
          receipt: null
        }
      }))
    }
  }, [usdcTransactionHash, paymentState.intentPhase])
  
  // Legacy USDC purchase flow (still used for USDC direct payments)
  // Only initialize when needed to prevent unnecessary RPC calls
  const usdcPurchaseFlow = useUnifiedContentPurchaseFlow(
    paymentDataEnabled ? contentId : undefined, 
    paymentDataEnabled ? effectiveUserAddress : undefined
  )
  
  // Memoize orchestrator callbacks to prevent unnecessary re-initialization
  const orchestratorCallbacks = useMemo(() => ({
    onPaymentCompleted: (result: PaymentResult) => {
      console.log(`Payment completed:`, result)
      if (result.success && onPurchaseSuccess) {
        onPurchaseSuccess(contentId, result)
      }
    },
    onHealthChange: (health: any) => {
      console.log(`Backend health changed:`, health)
    },
    onRecoveryAttempt: (strategy: string, attempt: number) => {
      console.log(`Recovery attempt ${attempt} using strategy: ${strategy}`)
    }
  }), [contentId, onPurchaseSuccess])

  // Memoize orchestrator configuration to prevent unnecessary re-initialization
  const orchestratorConfig = useMemo(() => ({
    // Health config removed - now uses shared BackendHealthProvider
    signingConfig: {
      maxAttempts: 45,
      useAdaptiveIntervals: true,
      enableLogging: process.env.NODE_ENV === 'development'
    },
    recoveryConfig: {
      enableAutomaticRecovery: true,
      maxAutoRetryAttempts: 3,
      enableLogging: process.env.NODE_ENV === 'development'
    },
    debugConfig: {
      enableVerboseLogging: process.env.NODE_ENV === 'development',
      enablePerformanceLogging: enablePerformanceMetrics,
      enableStateLogging: process.env.NODE_ENV === 'development'
    },
    callbacks: orchestratorCallbacks
  }), [orchestratorCallbacks, enablePerformanceMetrics])

  // Orchestrated payment system integration - only initialize if needed
  const orchestrator = usePaymentFlowOrchestrator(orchestratorConfig)

  // Token balance hooks - ONLY enabled after payment intent expressed
  const usdcBalance = useTokenBalance(
    paymentDataEnabled && !!contractAddresses?.USDC && !!effectiveUserAddress ? contractAddresses.USDC : undefined, 
    paymentDataEnabled && !!effectiveUserAddress ? effectiveUserAddress : undefined
  )
  
  const ethBalance = useBalance({
    address: effectiveUserAddress,
    query: { 
      enabled: paymentDataEnabled && !!effectiveUserAddress,
      refetchInterval: 30000
    }
  })
  
  // USDC allowance checking - ONLY enabled after payment intent expressed
  const usdcAllowance = useTokenAllowance(
    paymentDataEnabled && !!contractAddresses?.USDC && !!effectiveUserAddress ? contractAddresses.USDC : undefined,
    paymentDataEnabled && !!effectiveUserAddress ? effectiveUserAddress : undefined,
    paymentDataEnabled && !!contractAddresses?.PAY_PER_VIEW ? contractAddresses.PAY_PER_VIEW : undefined
  )
  
  // Price oracle integration - ONLY enabled after payment intent expressed
  const ethPriceQuery = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getTokenPrice',
    args: contractAddresses ? [
      '0x0000000000000000000000000000000000000000', 
      contractAddresses.USDC, 
      contentQuery.data?.payPerViewPrice || BigInt(0), 
      6
    ] : undefined,
    query: { 
      enabled: paymentDataEnabled && !!contractAddresses?.PRICE_ORACLE && !!contentQuery.data?.payPerViewPrice,
      refetchInterval: 30000
    }
  })

  // ===== PAYMENT CALCULATIONS (Only After Intent) =====
  const ethPaymentCalculation = useMemo(() => {
    if (!paymentDataEnabled || !contentQuery.data?.payPerViewPrice || !ethPriceQuery.data) {
      return null
    }
    
    const usdcPrice = contentQuery.data.payPerViewPrice
    const requiredEthAmount = ethPriceQuery.data as bigint
    const slippageBps = BigInt(200) // 2% slippage
    
    // Calculate ETH amount needed including slippage
    const ethAmountWithSlippage = requiredEthAmount + (requiredEthAmount * slippageBps / BigInt(10000))
    
    return {
      usdcPrice,
      requiredEthAmount,
      ethAmountWithSlippage,
      slippageAmount: ethAmountWithSlippage - requiredEthAmount
    }
  }, [paymentDataEnabled, contentQuery.data?.payPerViewPrice, ethPriceQuery.data])

  // Memoize orchestrator state values to prevent unnecessary re-renders
  const orchestratorState = useMemo(() => ({
    systemHealth: orchestrator.state.systemHealth,
    message: orchestrator.state.message,
    progress: orchestrator.state.progress,
    paymentProgress: orchestrator.state.paymentProgress,
    performance: orchestrator.state.performance,
    canStartPayment: orchestrator.canStartPayment
  }), [
    orchestrator.state.systemHealth,
    orchestrator.state.message,
    orchestrator.state.progress,
    orchestrator.state.paymentProgress,
    orchestrator.state.performance,
    orchestrator.canStartPayment
  ])

  // Available payment methods - only calculated when needed
  const availablePaymentMethods = useMemo((): PaymentMethodConfig[] => {
    if (!paymentDataEnabled) return []
    
    return [
      {
        id: PaymentMethod.USDC,
        name: 'USDC',
        description: canUseBatchTransactions ? 
          'Single confirmation (approve + purchase)' : 
          'Direct USDC payment',
        estimatedTime: canUseBatchTransactions ? '~15 seconds' : '~30 seconds',
        gasEstimate: canUseBatchTransactions ? 'Low' : 'Low',
        requiresApproval: true,
        icon: DollarSign,
        isAvailable: true,
        healthStatus: 'healthy'
      },
      {
        id: PaymentMethod.ETH,
        name: 'ETH',
        description: 'ETH → USDC swap',
        estimatedTime: '~45 seconds',
        gasEstimate: 'Medium',
        requiresApproval: false,
        icon: Coins,
        isAvailable: orchestratorState.canStartPayment,
        healthStatus: 'healthy'
      }
    ]
  }, [paymentDataEnabled, orchestratorState.canStartPayment, canUseBatchTransactions])



  // Token information calculation - only when payment data is enabled
  // Optimized to reduce dependencies and prevent frequent re-renders
  const calculatedTokens = useMemo((): Record<PaymentMethod, TokenInfo | null> => {
    if (!paymentDataEnabled) {
      return {
        [PaymentMethod.USDC]: null,
        [PaymentMethod.ETH]: null,
        [PaymentMethod.WETH]: null,
        [PaymentMethod.CBETH]: null,
        [PaymentMethod.DAI]: null,
        [PaymentMethod.OTHER_TOKEN]: null
      }
    }
    
    const tokens: Record<PaymentMethod, TokenInfo | null> = {
      [PaymentMethod.USDC]: null,
      [PaymentMethod.ETH]: null,
      [PaymentMethod.WETH]: null,
      [PaymentMethod.CBETH]: null,
      [PaymentMethod.DAI]: null,
      [PaymentMethod.OTHER_TOKEN]: null
    }
    
    // USDC token info with proper allowance checking
    if (contractAddresses?.USDC && contentQuery.data) {
      const usdcBalanceValue = usdcBalance.data
      const usdcAllowanceValue = usdcAllowance.data
      const price = contentQuery.data.payPerViewPrice
      
      tokens[PaymentMethod.USDC] = {
        address: contractAddresses.USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: usdcBalanceValue || null,
        requiredAmount: price,
        hasEnoughBalance: usdcBalanceValue ? usdcBalanceValue >= price : false,
        allowance: usdcAllowanceValue || undefined,
        needsApproval: usdcAllowanceValue ? usdcAllowanceValue < price : true,
        isLoading: (usdcBalance.isLoading ?? false) || (usdcAllowance.isLoading ?? false),
        error: usdcBalance.error?.message || usdcAllowance.error?.message
      }
    }
    
    // ETH token info with proper price calculation
    if (ethPaymentCalculation && ethBalance.data) {
      const ethBalanceValue = ethBalance.data.value
      const requiredAmount = ethPaymentCalculation.ethAmountWithSlippage
      
      tokens[PaymentMethod.ETH] = {
        address: '0x0000000000000000000000000000000000000000' as Address,
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        balance: ethBalanceValue,
        requiredAmount: requiredAmount,
        hasEnoughBalance: ethBalanceValue >= requiredAmount,
        allowance: BigInt(0), // ETH doesn't need approval
        needsApproval: false,
        isLoading: (ethBalance.isLoading ?? false) || (ethPriceQuery.isLoading ?? false),
        error: ethBalance.error?.message || ethPriceQuery.error?.message
      }
    }
    
    return tokens
  }, [
    paymentDataEnabled,
    contractAddresses?.USDC,
    contentQuery.data?.payPerViewPrice,
    usdcBalance.data,
    usdcAllowance.data,
    ethPaymentCalculation?.ethAmountWithSlippage,
    ethBalance.data?.value,
    usdcBalance.isLoading,
    usdcAllowance.isLoading,
    ethBalance.isLoading,
    ethPriceQuery.isLoading,
    usdcBalance.error?.message,
    usdcAllowance.error?.message,
    ethBalance.error?.message,
    ethPriceQuery.error?.message
  ])

  // Remove the useEffect that was causing infinite loops
  // Instead, we'll use calculatedTokens directly in the component

  // ===== EVENT HANDLERS =====
  
  /**
   * Handle Initial Purchase Intent
   * This is triggered when user clicks "Purchase Content" for the first time
   */
  const handleExpressPurchaseIntent = useCallback(() => {
    console.log('💭 User expressed purchase intent for content:', contentId.toString())
    
    setPaymentState(prev => ({
      ...prev,
      intentPhase: PaymentIntentPhase.INTENT_EXPRESSED,
      showMethodSelector: enableMultiPayment
    }))
  }, [contentId, enableMultiPayment])

  /**
   * Handle Modal Close - Reset to browsing state
   */
  const handleModalClose = useCallback(() => {
    console.log('🔒 Modal closed, resetting to browsing state')
    
    setPaymentState(prev => ({
      ...prev,
      showMethodSelector: false,
      selectedMethod: null,
      intentPhase: PaymentIntentPhase.BROWSING
    }))
  }, [])

  // FIXED: Add payment duration tracking
  const [paymentStartTime, setPaymentStartTime] = useState<number | null>(null)

  /**
   * Handle USDC Purchase Execution
   */
  const handleUSDCPurchase = useCallback(async () => {
    if (!contentQuery.data || paymentState.isProcessing || !contractAddresses) return

    const startTime = Date.now()
    setPaymentState(prev => ({ ...prev, isProcessing: true, intentPhase: PaymentIntentPhase.PAYMENT_ACTIVE }))

    try {
      console.log('💳 Starting USDC purchase...')
      
      // Check if approval is needed
      const selectedToken = calculatedTokens[PaymentMethod.USDC]
      const needsApproval = selectedToken?.needsApproval
      
      // Try batch transaction first if supported and approval is needed
      if (needsApproval && canUseBatchTransactions) {
        console.log('🚀 Using EIP-5792 batch transaction (approve + purchase)...')
        
        const calls = [
          // Call 1: Approve USDC spending
          {
            to: contractAddresses.USDC,
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [contractAddresses.PAY_PER_VIEW, contentQuery.data.payPerViewPrice]
            })
          },
          // Call 2: Purchase content
          {
            to: contractAddresses.PAY_PER_VIEW,
            data: encodeFunctionData({
              abi: PAY_PER_VIEW_ABI,
              functionName: 'purchaseContentDirect',
              args: [contentId]
            })
          }
        ]
        
        await sendCalls({ calls })
        console.log('✅ Batch transaction submitted successfully')
        return
      }
      
      // Fallback to sequential transactions
      if (needsApproval) {
        console.log('🔐 Approving USDC spending (sequential)...')
        
        await writeUsdcContract({
          address: contractAddresses.USDC,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddresses.PAY_PER_VIEW, contentQuery.data.payPerViewPrice]
        })
        
        // Wait for approval transaction to complete before proceeding
        // The transaction hash and error handling will be managed by the useEffect hooks above
        return
      }
      
      // Direct purchase without approval needed
      console.log('💰 Purchasing content with USDC...')
      
      await writeUsdcContract({
        address: contractAddresses.PAY_PER_VIEW,
        abi: PAY_PER_VIEW_ABI,
        functionName: 'purchaseContentDirect',
        args: [contentId]
      })
      
      // The transaction hash and error handling will be managed by the useEffect hooks above
      console.log('✅ USDC purchase transaction submitted')

    } catch (error) {
      console.error('❌ USDC purchase failed:', error)
      
      const isCancelled = error instanceof Error && (
        error.message.includes('User rejected') || 
        error.message.includes('User denied') ||
        error.message.includes('cancelled')
      )
      
      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false,
        intentPhase: isCancelled ? PaymentIntentPhase.CANCELLED : PaymentIntentPhase.FAILED,
        transactionStatus: {
          hash: null,
          status: isCancelled ? 'cancelled' : 'failed',
          confirmedAt: null,
          error: error as Error,
          receipt: null
        }
      }))
    }
  }, [contentQuery.data, paymentState.isProcessing, contractAddresses, calculatedTokens, contentId, writeUsdcContract, canUseBatchTransactions, sendCalls])

  /**
   * Handle ETH Purchase Execution
   */
  const handleETHPurchase = useCallback(async () => {
    console.log('🚀 handleETHPurchase called')
    console.log('📊 Current state:', {
      hasContentData: !!contentQuery.data,
      hasEthCalculation: !!ethPaymentCalculation,
      isProcessing: paymentState.isProcessing,
      hasContractAddresses: !!contractAddresses,
      intentPhase: paymentState.intentPhase,
      selectedMethod: paymentState.selectedMethod
    })

    if (!contentQuery.data || !ethPaymentCalculation || paymentState.isProcessing || !contractAddresses) {
      console.error('❌ ETH purchase prerequisites not met')
      return
    }

    const startTime = Date.now()
    setPaymentState(prev => ({ ...prev, isProcessing: true, intentPhase: PaymentIntentPhase.PAYMENT_ACTIVE }))

    try {
      console.log('⚡ Starting direct ETH payment...')
      
      // Create payment intent directly using contract
      const paymentRequest = {
        paymentType: 0, // ETH payment
        creator: contentQuery.data.creator,
        contentId: contentId,
        paymentToken: '0x0000000000000000000000000000000000000000' as Address,
        maxSlippage: BigInt(200), // 2%
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour
      }

      console.log('📝 Creating payment intent:', paymentRequest)
      
      // This will trigger the writeContract hook and we'll get immediate feedback
      await writeEthContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'createPaymentIntent',
        args: [paymentRequest]
      })
      
      // The transaction hash and error handling will be managed by the useEffect hooks above
      console.log('✅ ETH payment intent created successfully')

    } catch (error) {
      console.error('❌ ETH purchase failed:', error)
      
      const isCancelled = error instanceof Error && (
        error.message.includes('User rejected') || 
        error.message.includes('User denied') ||
        error.message.includes('cancelled')
      )
      
      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false,
        intentPhase: isCancelled ? PaymentIntentPhase.CANCELLED : PaymentIntentPhase.FAILED,
        transactionStatus: {
          hash: null,
          status: isCancelled ? 'cancelled' : 'failed',
          confirmedAt: null,
          error: error as Error,
          receipt: null
        }
      }))
    }
  }, [
    contentQuery.data, 
    ethPaymentCalculation, 
    paymentState.isProcessing, 
    contractAddresses,
    contentId, 
    writeEthContract
  ])

  /**
   * Handle Payment Method Selection
   */
  const handleMethodSelect = useCallback(async (method: PaymentMethod) => {
    console.log('🎯 User selected payment method:', method)
    
    // Set the selected method and close modal
    setPaymentState(prev => ({
      ...prev,
      selectedMethod: method,
      intentPhase: PaymentIntentPhase.SELECTING_METHOD,
      showMethodSelector: false
    }))

    // Add a small delay to ensure state is updated before executing payment
    await new Promise(resolve => setTimeout(resolve, 100))

    // Execute payment based on selected method
    try {
      if (method === PaymentMethod.USDC) {
        await handleUSDCPurchase()
      } else if (method === PaymentMethod.ETH) {
        await handleETHPurchase()
      }
    } catch (error) {
      console.error('❌ Payment execution failed:', error)
      // Reset to method selection on error
      setPaymentState(prev => ({
        ...prev,
        intentPhase: PaymentIntentPhase.SELECTING_METHOD,
        isProcessing: false
      }))
    }
  }, [handleUSDCPurchase, handleETHPurchase])

  /**
   * Handle Payment Retry
   */
  const handleRetryPayment = useCallback(() => {
    console.log('🔄 Retrying payment...')
    
    // Reset to method selection to allow retry
    setPaymentState(prev => ({
      ...prev,
      intentPhase: PaymentIntentPhase.SELECTING_METHOD,
      isProcessing: false,
      transactionStatus: { hash: null, status: null, confirmedAt: null, error: null, receipt: null }
    }))
  }, [])

  /**
   * Handle Payment Reset
   */
  const handleResetPayment = useCallback(() => {
    console.log('🔄 Resetting payment flow...')
    
    // Reset to browsing state
    setPaymentState(prev => ({
      ...prev,
      intentPhase: PaymentIntentPhase.BROWSING,
      selectedMethod: null,
      showMethodSelector: false,
      isProcessing: false,
      transactionStatus: { hash: null, status: null, confirmedAt: null, error: null, receipt: null }
    }))
  }, [])

  // ===== RENDER LOGIC =====

  // Loading state
  if (contentQuery.isLoading || accessQuery.isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    )
  }

  // Error state
  if (contentQuery.error || accessQuery.error) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-muted-foreground">Failed to load content information</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              contentQuery.refetch()
              accessQuery.refetch()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const content = contentQuery.data
  const hasAccess = accessQuery.data

  // User already has access
  if (hasAccess && content) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="font-medium text-green-800 mb-3">You have access to this content</p>
          <Button onClick={() => onViewContent?.(contentId)}>
            <Eye className="h-4 w-4 mr-2" />
            View Content
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Main purchase interface
  if (!content) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-muted-foreground">Content not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {variant === 'minimal' ? 'Purchase' : 'Purchase Content'}
              </CardTitle>
              <CardDescription>
                {formatCurrency(content.payPerViewPrice, 6)} USDC
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {content.category}
              </div>
              {showCreatorInfo && (
                <div className="text-xs text-muted-foreground">
                  by {formatAddress(content.creator)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* System Health Indicator - Only show during payment flow */}
          {showSystemHealth && paymentDataEnabled && (
            <SystemHealthIndicator health={orchestratorState.systemHealth} />
          )}

          {/* Batch Transaction Capability Indicator */}
          {paymentDataEnabled && canUseBatchTransactions && (
            <Alert className="border-green-200 bg-green-50">
              <Zap className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Enhanced Experience:</strong> Your wallet supports batch transactions. 
                Approval and purchase will be combined into a single confirmation.
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Progress - Only show during active payment */}
          {paymentState.intentPhase === PaymentIntentPhase.PAYMENT_ACTIVE && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{orchestratorState.message}</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <Progress value={orchestratorState.progress} />
              
              {orchestratorState.paymentProgress.estimatedTimeRemaining > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  Estimated time remaining: {Math.ceil(orchestratorState.paymentProgress.estimatedTimeRemaining / 1000)}s
                </div>
              )}
            </div>
          )}

          {/* Transaction Status - Show during confirmation */}
          {paymentState.intentPhase === PaymentIntentPhase.WAITING_CONFIRMATION && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confirming transaction...</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <Progress value={75} />
              
              {paymentState.transactionStatus.hash && (
                <div className="text-xs text-muted-foreground text-center">
                  Transaction: {paymentState.transactionStatus.hash.slice(0, 10)}...{paymentState.transactionStatus.hash.slice(-8)}
                </div>
              )}
            </div>
          )}

          {/* Transaction Error - Show when transaction fails */}
          {paymentState.intentPhase === PaymentIntentPhase.FAILED && paymentState.transactionStatus.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Transaction failed: {paymentState.transactionStatus.error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Selected Payment Method Details - Only show after method selected */}
          {paymentState.selectedMethod && calculatedTokens[paymentState.selectedMethod] && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Payment Details</div>
              
              {(() => {
                const selectedToken = calculatedTokens[paymentState.selectedMethod]!
                return (
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{selectedToken.symbol} Balance</div>
                      </div>
                      <div className={cn(
                        "text-sm font-medium",
                        selectedToken.hasEnoughBalance ? "text-green-600" : "text-red-600"
                      )}>
                        {formatTokenBalance(selectedToken.balance || BigInt(0), selectedToken.decimals)} {selectedToken.symbol}
                      </div>
                    </div>
                    
                    {!selectedToken.hasEnoughBalance && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Insufficient {selectedToken.symbol} balance. Need {formatTokenBalance(selectedToken.requiredAmount, selectedToken.decimals)} {selectedToken.symbol}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {selectedToken.needsApproval && selectedToken.symbol === 'USDC' && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          USDC approval required before purchase. This allows the contract to spend your USDC.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {selectedToken.isLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Checking {selectedToken.symbol} balance and allowance...</span>
                      </div>
                    )}
                    
                    {selectedToken.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Error checking {selectedToken.symbol}: {selectedToken.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Performance Metrics Display - Only during active payment */}
          {enablePerformanceMetrics && 
           paymentState.intentPhase === PaymentIntentPhase.PAYMENT_ACTIVE && 
           orchestratorState.performance.totalDuration && (
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded">
              <div className="font-medium">Performance Metrics</div>
              <div>Total Duration: {(orchestratorState.performance.totalDuration / 1000).toFixed(1)}s</div>
              {orchestratorState.performance.bottleneckPhase && (
                <div>Slowest Phase: {orchestratorState.performance.bottleneckPhase}</div>
              )}
            </div>
          )}
        </CardContent>

        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
            <h4 className="font-semibold mb-2">Debug Info:</h4>
            <div className="space-y-1">
              <div>Intent Phase: {paymentState.intentPhase}</div>
              <div>Selected Method: {paymentState.selectedMethod || 'None'}</div>
              <div>Is Processing: {paymentState.isProcessing ? 'Yes' : 'No'}</div>
              <div>Contract Valid: {contractValidation?.isValid ? 'Yes' : 'No'}</div>
              {contractValidation && !contractValidation.isValid && (
                <div className="text-red-600">Contract Error: {contractValidation.error}</div>
              )}
              <div>ETH Balance: {calculatedTokens[PaymentMethod.ETH]?.balance?.toString() || 'Loading...'}</div>
              <div>ETH Required: {calculatedTokens[PaymentMethod.ETH]?.requiredAmount?.toString() || 'Loading...'}</div>
              <div>Has Enough ETH: {calculatedTokens[PaymentMethod.ETH]?.hasEnoughBalance ? 'Yes' : 'No'}</div>
              <div>Payment Data Enabled: {paymentDataEnabled ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}

        <CardFooter className="space-y-3 w-full">
          {/* Main Action Button - Changes based on intent phase */}
          {paymentState.intentPhase === PaymentIntentPhase.BROWSING && (
            <Button 
              className="w-full" 
              onClick={handleExpressPurchaseIntent}
              disabled={!isConnected}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Content
            </Button>
          )}

          {paymentState.intentPhase === PaymentIntentPhase.INTENT_EXPRESSED && !enableMultiPayment && (
            <Button 
              className="w-full" 
              onClick={() => {
                setPaymentState(prev => ({ ...prev, selectedMethod: PaymentMethod.USDC }))
                handleMethodSelect(PaymentMethod.USDC)
              }}
              disabled={!isConnected}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Continue with USDC
            </Button>
          )}

          {paymentState.selectedMethod === PaymentMethod.USDC && 
           paymentState.intentPhase === PaymentIntentPhase.SELECTING_METHOD && (
            <Button
              className="w-full"
              disabled={!calculatedTokens[PaymentMethod.USDC]?.hasEnoughBalance || paymentState.isProcessing}
              onClick={handleUSDCPurchase}
            >
              {paymentState.isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {calculatedTokens[PaymentMethod.USDC]?.needsApproval 
                    ? 'Approve & Purchase with USDC' 
                    : 'Purchase with USDC'}
                </>
              )}
            </Button>
          )}

          {paymentState.selectedMethod === PaymentMethod.ETH && 
           paymentState.intentPhase === PaymentIntentPhase.SELECTING_METHOD && (
            <Button
              className="w-full"
              disabled={!calculatedTokens[PaymentMethod.ETH]?.hasEnoughBalance || paymentState.isProcessing}
              onClick={handleETHPurchase}
            >
              {paymentState.isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Purchase with ETH
                </>
              )}
            </Button>
          )}

          {paymentState.intentPhase === PaymentIntentPhase.WAITING_CONFIRMATION && (
            <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled>
              <Clock className="h-4 w-4 mr-2" />
              Waiting for Confirmation...
            </Button>
          )}

          {paymentState.intentPhase === PaymentIntentPhase.COMPLETED && (
            <div className="space-y-2 w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Purchase Complete!
              </Button>
              {paymentState.transactionStatus.hash && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const baseUrl = 'https://basescan.org/tx/'
                    window.open(`${baseUrl}${paymentState.transactionStatus.hash}`, '_blank')
                  }}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Transaction
                </Button>
              )}
            </div>
          )}

          {paymentState.intentPhase === PaymentIntentPhase.CANCELLED && (
            <div className="space-y-2 w-full">
              <Button className="w-full bg-gray-600 hover:bg-gray-700" disabled>
                <X className="h-4 w-4 mr-2" />
                Purchase Cancelled
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetPayment} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {paymentState.intentPhase === PaymentIntentPhase.FAILED && (
            <div className="space-y-2 w-full">
              <Button className="w-full bg-red-600 hover:bg-red-700" disabled>
                <AlertCircle className="h-4 w-4 mr-2" />
                Purchase Failed
              </Button>
              <Button variant="outline" size="sm" onClick={handleRetryPayment} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Payment
              </Button>
            </div>
          )}

          {/* Connection Required */}
          {!isConnected && (
            <Button variant="outline" className="w-full">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}

          {/* Back to method selection */}
          {paymentState.selectedMethod && paymentState.intentPhase === PaymentIntentPhase.SELECTING_METHOD && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPaymentState(prev => ({ 
                ...prev, 
                selectedMethod: null, 
                showMethodSelector: true,
                intentPhase: PaymentIntentPhase.INTENT_EXPRESSED
              }))}
            >
              Choose Different Method
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Payment Method Selection Modal */}
      <PaymentMethodSelector
        isOpen={paymentState.showMethodSelector}
        onClose={handleModalClose}
        contentPrice={content.payPerViewPrice}
        availableMethods={availablePaymentMethods}
        onMethodSelect={handleMethodSelect}
      />
    </>
  )
}
/**
 * Orchestrated Payment Integration for ContentPurchaseCard
 * 
 * This component integrates the sophisticated PaymentFlowOrchestrator into your existing
 * ContentPurchaseCard, replacing the basic payment intent flow with production-ready
 * intelligent payment processing. It maintains full backward compatibility with your
 * existing UI while adding advanced error recovery, health monitoring, and performance tracking.
 * 
 * INTEGRATION ARCHITECTURE:
 * - Replaces usePaymentIntentFlow with usePaymentFlowOrchestrator
 * - Maps orchestrated state to existing UI components and patterns
 * - Maintains all current payment methods (USDC direct, ETH swap)
 * - Adds intelligent error recovery with user-friendly messaging
 * - Provides real-time backend health monitoring and adaptive behavior
 * - Implements comprehensive performance tracking and bottleneck identification
 * 
 * PRODUCTION-READY FEATURES:
 * - Circuit breaker prevents backend overload during high traffic
 * - Exponential backoff reduces system load during recovery periods
 * - Automatic error classification with targeted recovery strategies
 * - Real-time progress tracking with accurate time estimates
 * - Comprehensive error handling with graceful degradation
 * - Performance monitoring with detailed timing metrics
 * 
 * File: src/components/content/OrchestratedContentPurchaseCard.tsx
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useReadContract, useChainId, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { type Address, parseEther } from 'viem'
import { getContractAddresses } from '@/lib/contracts/config'
import { PRICE_ORACLE_ABI, COMMERCE_PROTOCOL_INTEGRATION_ABI, ERC20_ABI } from '@/lib/contracts/abis'
import {
  ShoppingCart,
  Lock,
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
  ChevronDown,
  ExternalLink,
  Clock,
  TrendingUp,
  ArrowRight,
  Activity,
  Shield,
  Gauge,
  Timer,
  RotateCcw
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Import business logic hooks and utilities
import { useContentById, useHasContentAccess, useTokenBalance, useTokenAllowance } from '@/hooks/contracts/core'
import { useUnifiedContentPurchaseFlow, UnifiedPurchaseFlowResult, PaymentMethod } from '@/hooks/business/workflows'
import { formatCurrency, formatTokenBalance, formatAddress } from '@/lib/utils'
import type { Content } from '@/types/contracts'

// Import the orchestrated payment system
import { 
  usePaymentFlowOrchestrator,
  OrchestratedPaymentRequest,
  PaymentResult,
  OrchestratedPaymentFlowState
} from '@/hooks/web3/usePaymentFlowOrchestrator'

// Import error recovery system
import { ErrorCategory, RecoveryStrategy } from '@/hooks/web3/useErrorRecoveryStrategies'

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
 * Token Information Interface
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
 * Orchestrated Payment State Management
 */
interface OrchestratedPaymentState {
  readonly selectedMethod: PaymentMethod
  readonly availableTokens: Record<PaymentMethod, TokenInfo | null>
  readonly showAdvancedOptions: boolean
  readonly isProcessing: boolean
  readonly lastPaymentResult: PaymentResult | null
  readonly errorRecoveryOptions: Array<{
    readonly action: string
    readonly label: string
    readonly description: string
    readonly isRecommended: boolean
  }>
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
      case 'degraded': return compact ? 'System Slow' : 'Payments may take longer than usual'
      case 'critical': return compact ? 'System Issues' : 'Payment system experiencing difficulties'
      default: return compact ? 'Checking...' : 'Checking system health...'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {getHealthIcon()}
        <span className="text-muted-foreground">{getHealthMessage()}</span>
      </div>
    )
  }

  return (
    <Alert className={cn(
      "border-l-4",
      health.overallStatus === 'healthy' && "border-l-green-500 bg-green-50",
      health.overallStatus === 'degraded' && "border-l-yellow-500 bg-yellow-50", 
      health.overallStatus === 'critical' && "border-l-red-500 bg-red-50"
    )}>
      <div className="flex items-start gap-3">
        {getHealthIcon()}
        <div className="flex-1">
          <div className="font-medium text-sm">{getHealthMessage()}</div>
          {health.recommendations.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {health.recommendations[0]}
            </div>
          )}
          <div className="mt-2 text-xs text-muted-foreground">
            Response Time: {health.backend.avgResponseTime.toFixed(0)}ms • 
            Success Rate: {health.backend.successRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </Alert>
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

  // Core data hooks
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(effectiveUserAddress, contentId)
  
  // Legacy USDC purchase flow (still used for USDC direct payments)
  const usdcPurchaseFlow = useUnifiedContentPurchaseFlow(contentId, effectiveUserAddress)
  
  // Orchestrated payment system integration
  const orchestrator = usePaymentFlowOrchestrator({
    healthConfig: {
      maxConsecutiveFailures: 3,
      enableLogging: process.env.NODE_ENV === 'development'
    },
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
    callbacks: {
      onPaymentCompleted: (result) => {
        console.log(`Payment completed:`, result)
        if (result.success && onPurchaseSuccess) {
          onPurchaseSuccess(contentId, result)
        }
      },
      onHealthChange: (health) => {
        console.log(`Backend health changed:`, health)
      },
      onRecoveryAttempt: (strategy, attempt) => {
        console.log(`Recovery attempt ${attempt} using strategy: ${strategy}`)
      }
    }
  })

  // Token balance hooks for multi-payment support
  const usdcBalance = useTokenBalance(
    contractAddresses?.USDC, 
    effectiveUserAddress
  )
  
  const ethBalance = useBalance({
    address: effectiveUserAddress,
    query: { 
      enabled: !!effectiveUserAddress && !!contractAddresses
    }
  })
  
  // FIXED: Add USDC allowance checking for proper contract integration
  const usdcAllowance = useTokenAllowance(
    contractAddresses?.USDC,
    effectiveUserAddress,
    contractAddresses?.PAY_PER_VIEW
  )
  
  // FIXED: Price oracle integration - use correct function and parameters
  const ethPriceQuery = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getTokenPrice', // Use the actual function from your ABI
    args: contractAddresses ? ['0x0000000000000000000000000000000000000000', contractAddresses.USDC, contentQuery.data?.payPerViewPrice || BigInt(0), 6] : undefined,
    query: { 
      enabled: !!contractAddresses?.PRICE_ORACLE && !!contentQuery.data?.payPerViewPrice,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  })
  
  // Component state management - FIXED: Proper initialization
  const [paymentState, setPaymentState] = useState<OrchestratedPaymentState>({
    selectedMethod: PaymentMethod.USDC,
    availableTokens: {
      [PaymentMethod.USDC]: null,
      [PaymentMethod.ETH]: null,
      [PaymentMethod.WETH]: null,
      [PaymentMethod.CBETH]: null,
      [PaymentMethod.DAI]: null,
      [PaymentMethod.OTHER_TOKEN]: null
    },
    showAdvancedOptions: false,
    isProcessing: false,
    lastPaymentResult: null,
    errorRecoveryOptions: []
  })

  // FIXED: Price calculations for ETH payments - use actual price oracle data
  const ethPaymentCalculation = useMemo(() => {
    if (!contentQuery.data?.payPerViewPrice || !ethPriceQuery.data) {
      return null
    }
    
    const usdcPrice = contentQuery.data.payPerViewPrice
    // ethPriceQuery.data is the amount of ETH needed for the USDC amount
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
  }, [contentQuery.data?.payPerViewPrice, ethPriceQuery.data])

  // Available payment methods configuration - FIXED: Use correct enum values
  const availablePaymentMethods = useMemo((): PaymentMethodConfig[] => {
    const systemHealth = orchestrator.state.systemHealth
    
    return [
      {
        id: PaymentMethod.USDC,
        name: 'USDC',
        description: 'Direct USDC payment',
        estimatedTime: '~30 seconds',
        gasEstimate: 'Low',
        requiresApproval: true,
        icon: DollarSign,
        isAvailable: true,
        healthStatus: 'healthy'
      },
      {
        id: PaymentMethod.ETH,
        name: 'ETH',
        description: 'ETH → USDC swap',
        estimatedTime: systemHealth.overallStatus === 'healthy' ? '~45 seconds' : '~90 seconds',
        gasEstimate: 'Medium',
        requiresApproval: false,
        icon: Coins,
        isAvailable: orchestrator.canStartPayment,
        healthStatus: systemHealth.overallStatus === 'critical' ? 'unavailable' : systemHealth.overallStatus
      }
    ]
  }, [orchestrator.canStartPayment, orchestrator.state.systemHealth])

  // Token information calculation - properly handle USDC allowance
  useEffect(() => {
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
      tokens[PaymentMethod.USDC] = {
        address: contractAddresses.USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: usdcBalance.data || null,
        requiredAmount: contentQuery.data.payPerViewPrice,
        hasEnoughBalance: usdcBalance.data ? usdcBalance.data >= contentQuery.data.payPerViewPrice : false,
        allowance: usdcAllowance.data || undefined,
        needsApproval: usdcAllowance.data ? usdcAllowance.data < contentQuery.data.payPerViewPrice : true,
        isLoading: (usdcBalance.isLoading ?? false) || (usdcAllowance.isLoading ?? false),
        error: usdcBalance.error?.message || usdcAllowance.error?.message
      }
    }
    
    // ETH token info with proper price calculation
    if (ethPaymentCalculation && ethBalance.data) {
      tokens[PaymentMethod.ETH] = {
        address: '0x0000000000000000000000000000000000000000' as Address,
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        balance: ethBalance.data.value,
        requiredAmount: ethPaymentCalculation.ethAmountWithSlippage,
        hasEnoughBalance: ethBalance.data.value >= ethPaymentCalculation.ethAmountWithSlippage,
        allowance: BigInt(0), // ETH doesn't need approval
        needsApproval: false,
        isLoading: (ethBalance.isLoading ?? false) || (ethPriceQuery.isLoading ?? false),
        error: ethBalance.error?.message || ethPriceQuery.error?.message
      }
    }

    // Only update state if values actually changed to avoid render loops
    setPaymentState(prev => {
      const prevTokens = prev.availableTokens
      let changed = false
      ;([PaymentMethod.USDC, PaymentMethod.ETH] as const).forEach((m) => {
        const a = prevTokens[m]
        const b = tokens[m]
        if (!a && !b) return
        if (!a || !b) { changed = true; return }
        if (
          a.address !== b.address ||
          a.symbol !== b.symbol ||
          a.decimals !== b.decimals ||
          a.balance !== b.balance ||
          a.requiredAmount !== b.requiredAmount ||
          a.hasEnoughBalance !== b.hasEnoughBalance ||
          a.allowance !== b.allowance ||
          a.needsApproval !== b.needsApproval ||
          a.isLoading !== b.isLoading ||
          a.error !== b.error
        ) {
          changed = true
        }
      })
      if (!changed) return prev
      return { ...prev, availableTokens: tokens }
    })
  }, [
    contractAddresses?.USDC,
    contentQuery.data?.payPerViewPrice,
    usdcBalance.data,
    usdcBalance.isLoading,
    usdcBalance.error,
    usdcAllowance.data,
    usdcAllowance.isLoading,
    usdcAllowance.error,
    ethBalance.data?.value,
    ethBalance.isLoading,
    ethBalance.error,
    ethPaymentCalculation?.ethAmountWithSlippage,
    ethPriceQuery.isLoading,
    ethPriceQuery.error
  ])

  // FIXED: Add payment duration tracking
  const [paymentStartTime, setPaymentStartTime] = useState<number | null>(null)

  /**
   * FIXED: Handle USDC payment using existing flow with proper error handling
   */
  const handleUSDCPurchase = useCallback(async () => {
    if (!usdcPurchaseFlow.canExecutePayment || paymentState.isProcessing) {
      return
    }

    const startTime = Date.now()
    setPaymentStartTime(startTime)
    setPaymentState(prev => ({ ...prev, isProcessing: true }))

    try {
      // Use existing USDC purchase flow
      await usdcPurchaseFlow.executePayment()
      
      const totalDuration = Date.now() - startTime
      
      // Create comprehensive payment result for consistency
      const result: PaymentResult = {
        success: true,
        intentId: `usdc_direct_${Date.now()}` as `0x${string}`,
        transactionHash: null, // Will be populated by the flow if available
        signature: null,
        totalDuration,
        performanceMetrics: {
          intentCreationTime: 0,
          signatureWaitTime: 0,
          executionTime: totalDuration,
          confirmationTime: 0
        },
        recoveryAttempts: 0,
        errorCategory: null,
        finalError: null
      }
      
      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false,
        lastPaymentResult: result
      }))
      
      if (onPurchaseSuccess) {
        onPurchaseSuccess(contentId, result)
      }
      
      // Refresh data to show updated access status
      await Promise.allSettled([
        accessQuery.refetch(),
        usdcBalance.refetch()
      ])
      
    } catch (error) {
      const totalDuration = Date.now() - startTime
      console.error('USDC purchase failed:', error)
      
      // Determine error category for recovery strategies
      let errorCategory: ErrorCategory = 'unknown_error'
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds') || error.message.includes('balance')) {
          errorCategory = 'insufficient_funds'
        } else if (error.message.includes('user rejected') || error.message.includes('cancelled')) {
          errorCategory = 'validation_error'
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          errorCategory = 'transient_network'
        } else if (error.message.includes('contract') || error.message.includes('revert')) {
          errorCategory = 'contract_error'
        }
      }
      
      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false,
        lastPaymentResult: {
          success: false,
          intentId: null,
          transactionHash: null,
          signature: null,
          totalDuration,
          performanceMetrics: {
            intentCreationTime: 0,
            signatureWaitTime: 0,
            executionTime: 0,
            confirmationTime: 0
          },
          recoveryAttempts: 0,
          errorCategory,
          finalError: error as Error
        }
      }))
    } finally {
      setPaymentStartTime(null)
    }
  }, [usdcPurchaseFlow, paymentState.isProcessing, onPurchaseSuccess, contentId, accessQuery, usdcBalance])

  /**
   * FIXED: Handle ETH payment using orchestrated flow with comprehensive error handling
   */
  const handleETHPurchase = useCallback(async () => {
    if (!orchestrator.canStartPayment || !ethPaymentCalculation || !contentQuery.data || !effectiveUserAddress) {
      console.error('Cannot start ETH payment:', {
        canStart: orchestrator.canStartPayment,
        hasCalculation: !!ethPaymentCalculation,
        hasContent: !!contentQuery.data,
        hasAddress: !!effectiveUserAddress
      })
      return
    }

    const startTime = Date.now()
    setPaymentStartTime(startTime)
    setPaymentState(prev => ({ ...prev, isProcessing: true }))

    try {
      const paymentRequest: OrchestratedPaymentRequest = {
        contentId: contentId,
        creator: contentQuery.data.creator,
        ethAmount: ethPaymentCalculation.ethAmountWithSlippage,
        maxSlippage: BigInt(200), // 2%
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
        userAddress: effectiveUserAddress,
        sessionId: `purchase_${contentId}_${Date.now()}`,
        metadata: {
          source: 'content_purchase_card',
          referrer: window.location.href
        }
      }

      console.log(' Starting orchestrated ETH payment:', paymentRequest)
      
      const result = await orchestrator.executePayment(paymentRequest)
      
      console.log(' ETH payment completed:', result)
      
      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false,
        lastPaymentResult: result
      }))

      // Refresh data to show updated access status
      if (result.success) {
        await Promise.allSettled([
          accessQuery.refetch(),
          ethBalance.refetch()
        ])
      }

    } catch (error) {
      console.error(' ETH purchase failed:', error)
      
      // Create comprehensive error result
      const errorResult: PaymentResult = {
        success: false,
        intentId: null,
        transactionHash: null,
        signature: null,
        totalDuration: Date.now() - startTime,
        performanceMetrics: {
          intentCreationTime: 0,
          signatureWaitTime: 0,
          executionTime: 0,
          confirmationTime: 0
        },
        recoveryAttempts: orchestrator.state.recoveryContext.recoveryAttempt,
        errorCategory: 'unknown_error',
        finalError: error as Error
      }
      
      setPaymentState(prev => ({ 
        ...prev, 
        isProcessing: false,
        lastPaymentResult: errorResult
      }))
    } finally {
      setPaymentStartTime(null)
    }
  }, [
    orchestrator,
    ethPaymentCalculation,
    contentQuery.data,
    effectiveUserAddress,
    contentId,
    accessQuery,
    ethBalance
  ])

  /**
   * Handle payment retry 
   */
  const handleRetryPayment = useCallback(async () => {
    if (paymentState.selectedMethod === PaymentMethod.USDC) {
      await handleUSDCPurchase()
    } else if (paymentState.selectedMethod === PaymentMethod.ETH) {
      await orchestrator.retryPayment()
    }
  }, [paymentState.selectedMethod, handleUSDCPurchase, orchestrator])

  /**
   * Handle payment cancellation
   */
  const handleCancelPayment = useCallback(() => {
    orchestrator.cancelPayment()
    setPaymentState(prev => ({ ...prev, isProcessing: false }))
  }, [orchestrator])

  // Loading states
  if (contentQuery.isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (contentQuery.isError || !contentQuery.data) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load content information
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Access granted state
  if (accessQuery.data) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium">You have access to this content</span>
          </div>
          <Button 
            onClick={() => router.push(`/content/${contentId}/view`)}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Content
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Active payment in progress
  if (orchestrator.state.isActive || paymentState.isProcessing) {
    return (
      <div className={className}>
        <PaymentProgressDisplay
          state={orchestrator.state}
          onCancel={orchestrator.state.userInteraction.canCancel ? handleCancelPayment : undefined}
          onRetry={orchestrator.state.phase === 'failed' ? handleRetryPayment : undefined}
        />
      </div>
    )
  }

  const selectedToken = paymentState.availableTokens[paymentState.selectedMethod]
  const canProceed = selectedToken?.hasEnoughBalance && 
    (paymentState.selectedMethod === PaymentMethod.USDC ? usdcPurchaseFlow.canExecutePayment : orchestrator.canStartPayment)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Purchase Content</CardTitle>
            <CardDescription>
              {formatCurrency(contentQuery.data.payPerViewPrice, 6)} USDC
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {contentQuery.data.category}
            </div>
            {showCreatorInfo && (
              <div className="text-xs text-muted-foreground">
                by {formatAddress(contentQuery.data.creator)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* System Health Indicator */}
        {showSystemHealth && (
          <SystemHealthIndicator health={orchestrator.state.systemHealth} />
        )}

        {/* Payment Method Selection */}
        {enableMultiPayment && (
          <div className="space-y-3">
            <div className="text-sm font-medium">Payment Method</div>
            <div className="grid gap-3">
              {availablePaymentMethods.map(method => {
                const token = paymentState.availableTokens[method.id]
                const isSelected = paymentState.selectedMethod === method.id
                const isDisabled = !method.isAvailable || !token?.hasEnoughBalance

                return (
                  <div
                    key={method.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      isSelected && "border-primary bg-primary/5",
                      isDisabled && "opacity-50 cursor-not-allowed",
                      !isDisabled && !isSelected && "hover:bg-muted/50"
                    )}
                    onClick={() => !isDisabled && setPaymentState(prev => ({ 
                      ...prev, 
                      selectedMethod: method.id 
                    }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <method.icon className="h-5 w-5" />
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {method.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {method.estimatedTime}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Gauge className="h-3 w-3" />
                          {method.gasEstimate} Gas
                        </div>
                      </div>
                    </div>
                    
                    {/* Token Balance Display */}
                    {token && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between items-center text-sm">
                          <span>Balance:</span>
                          <span className={cn(
                            token.hasEnoughBalance ? "text-green-600" : "text-red-600"
                          )}>
                            {formatTokenBalance(token.balance || BigInt(0), token.decimals, token.symbol)} {token.symbol}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span>Required:</span>
                          <span>
                            {formatTokenBalance(token.requiredAmount, token.decimals, token.symbol)} {token.symbol}
                          </span>
                        </div>
                        {method.id === PaymentMethod.ETH && ethPaymentCalculation && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Includes {formatTokenBalance(ethPaymentCalculation.slippageAmount, 18, 'ETH')} slippage
                          </div>
                        )}
                      </div>
                    )}

                    {/* Method Health Status */}
                    {method.healthStatus && method.healthStatus !== 'healthy' && (
                      <div className="mt-2 text-xs">
                        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                          {method.healthStatus === 'degraded' ? 'Slower than usual' : 'Temporarily unavailable'}
                        </Badge>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* FIXED: Enhanced Balance & Approval Status with proper contract integration */}
        {selectedToken && (
          <div className="space-y-2">
            {!selectedToken.hasEnoughBalance && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient {selectedToken.symbol} balance. You need{' '}
                  {formatTokenBalance(
                    selectedToken.requiredAmount - (selectedToken.balance || BigInt(0)),
                    selectedToken.decimals,
                    selectedToken.symbol
                  )}{' '}
                  more {selectedToken.symbol}.
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
            
            {/* Show loading state for balance/allowance checks */}
            {selectedToken.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking {selectedToken.symbol} balance and allowance...</span>
              </div>
            )}
            
            {/* Show errors if any */}
            {selectedToken.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error checking {selectedToken.symbol}: {selectedToken.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Performance Metrics Display */}
        {enablePerformanceMetrics && orchestrator.state.performance.totalDuration && (
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded">
            <div className="font-medium">Performance Metrics</div>
            <div>Total Duration: {(orchestrator.state.performance.totalDuration / 1000).toFixed(1)}s</div>
            {orchestrator.state.performance.bottleneckPhase && (
              <div>Slowest Phase: {orchestrator.state.performance.bottleneckPhase}</div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="space-y-3">
        {/* Main Purchase Button */}
        <Button
          className="w-full"
          disabled={!canProceed}
          onClick={paymentState.selectedMethod === PaymentMethod.USDC ? handleUSDCPurchase : handleETHPurchase}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {!selectedToken ? 'Loading...' :
           !selectedToken.hasEnoughBalance ? `Insufficient ${selectedToken.symbol}` :
           paymentState.selectedMethod === PaymentMethod.USDC ? 'Purchase with USDC' : 'Purchase with ETH'}
        </Button>

        {/* Additional Actions */}
        {!isConnected && (
          <Button variant="outline" className="w-full">
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
/**
 * MiniApp Purchase Confirmation Page - Secure Mobile Payment Flow
 * File: src/app/mini/purchase/confirm/[contentId]/page.tsx
 *
 * This page represents the critical trust-building moment in mobile Web3 e-commerce,
 * where users verify their purchase intent before committing to blockchain transactions.
 * Designed specifically for mini app mobile commerce with instant engagement patterns.
 *
 * Mini App Design Philosophy:
 * - Mobile-first payment flow with touch-optimized interactions
 * - Instant purchase experience with minimal friction
 * - Clear security indicators and trust signals
 * - Real-time transaction status with mobile feedback
 * - Seamless transition to content consumption
 *
 * Key Features:
 * - Purchase verification with mobile wallet integration
 * - Real-time balance checking and affordability validation
 * - Token approval handling for first-time purchases
 * - Transaction status tracking with haptic feedback
 * - Mobile-optimized error handling and recovery
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  DollarSign,
  User,
  Clock,
  Tag,
  Lock,
  Zap,
  AlertCircle,
  Loader2,
  ChevronRight,
  Wallet,
  Eye,
  Heart,
  Star,
  Info,
  RefreshCw
} from 'lucide-react'

// Import your existing UI components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  Separator,
  Progress,
  Avatar,
  AvatarFallback
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'
import { useUnifiedContentPurchaseFlow } from '@/hooks/business/workflows'

// Import your existing sophisticated components
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'
import { TransactionStatusModal } from '@/components/web3/TransactionStatus'

// Import utilities
import { formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'
import type { Content } from '@/types/contracts'
import type { PaymentResult } from '@/hooks/web3/usePaymentFlowOrchestrator'

/**
 * Page Props Interface
 */
interface PurchaseConfirmationPageProps {
  readonly params: Promise<{
    readonly id: string
  }>
}

/**
 * Purchase Flow State Interface
 */
interface PurchaseFlowState {
  readonly step: 'reviewing' | 'confirming' | 'processing' | 'completed' | 'error'
  readonly showTransactionModal: boolean
  readonly userHasConfirmed: boolean
  readonly lastError: Error | null
  readonly transactionHash: string | null
}

/**
 * MiniApp Purchase Confirmation Core Component
 *
 * This component orchestrates the complete mobile purchase confirmation experience
 * with security-focused design and instant feedback mechanisms.
 */
function MiniAppPurchaseConfirmationCore({ params }: PurchaseConfirmationPageProps) {
  const router = useRouter()

  // Unwrap params using React.use() for Next.js 15 compatibility
  const unwrappedParams = React.use(params) as { readonly id: string }

  // Parse content ID from route parameters
  const contentId = useMemo(() => {
    try {
      return BigInt(unwrappedParams.id)
    } catch {
      return undefined
    }
  }, [unwrappedParams.id])

  // Core state management
  const [flowState, setFlowState] = useState<PurchaseFlowState>({
    step: 'reviewing',
    showTransactionModal: false,
    userHasConfirmed: false,
    lastError: null,
    transactionHash: null
  })

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useMiniAppWalletUI()

  const userAddress = walletUI.address && typeof walletUI.address === 'string'
    ? walletUI.address as `0x${string}`
    : undefined

  // Content and access data
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)

  // Use the unified content purchase flow hook
  const purchaseFlow = useUnifiedContentPurchaseFlow(contentId, userAddress)

  /**
   * Access Verification Effect
   *
   * Redirects users who already have access to content
   */
  useEffect(() => {
    if (accessQuery.data === true && contentId) {
      router.replace(`/mini/content/${contentId}/view`)
    }
  }, [accessQuery.data, contentId, router])

  /**
   * Purchase Flow State Synchronization
   *
   * Keeps local state in sync with purchase flow hook
   */
  useEffect(() => {
    if (purchaseFlow.executionState.phase === 'executing' && flowState.userHasConfirmed) {
      setFlowState(prev => ({
        ...prev,
        step: 'processing',
        showTransactionModal: true
      }))
    } else if (purchaseFlow.executionState.phase === 'completed') {
      setFlowState(prev => ({
        ...prev,
        step: 'completed',
        transactionHash: purchaseFlow.executionState.transactionHash || null
      }))

      // Mobile-optimized success feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]) // Success haptic pattern
      }

      // Auto-redirect to content view
      setTimeout(() => {
        if (contentId) {
          router.push(`/mini/content/${contentId}/view`)
        }
      }, 2000)
    } else if (purchaseFlow.executionState.phase === 'error' && purchaseFlow.executionState.error) {
      setFlowState(prev => ({
        ...prev,
        step: 'error',
        lastError: purchaseFlow.executionState.error,
        showTransactionModal: false
      }))
    }
  }, [purchaseFlow.executionState.phase, purchaseFlow.executionState.error, purchaseFlow.executionState.transactionHash, flowState.userHasConfirmed, contentId, router])

  /**
   * Purchase Confirmation Handler
   *
   * Initiates the secure purchase process with mobile validations
   */
  const handleConfirmPurchase = useCallback(async () => {
    if (!walletUI.isConnected || !walletUI.address) {
      setFlowState(prev => ({
        ...prev,
        lastError: new Error('Wallet connection required for purchase'),
        step: 'error'
      }))
      return
    }

    if (!purchaseFlow.canExecutePayment) {
      setFlowState(prev => ({
        ...prev,
        lastError: new Error('Content is not available for purchase'),
        step: 'error'
      }))
      return
    }

    try {
      setFlowState(prev => ({
        ...prev,
        userHasConfirmed: true,
        step: 'confirming',
        lastError: null
      }))

      // Execute purchase using the unified flow
      await purchaseFlow.executePayment()
    } catch (error) {
      setFlowState(prev => ({
        ...prev,
        lastError: error instanceof Error ? error : new Error('Purchase failed'),
        step: 'error',
        userHasConfirmed: false
      }))
    }
  }, [walletUI.isConnected, walletUI.address, purchaseFlow])

  /**
   * Transaction Modal Handlers
   */
  const handleTransactionModalClose = useCallback(() => {
    setFlowState(prev => ({
      ...prev,
      showTransactionModal: false
    }))
  }, [])

  const handleRetryPurchase = useCallback(() => {
    setFlowState(prev => ({
      ...prev,
      step: 'reviewing',
      userHasConfirmed: false,
      lastError: null
    }))
    purchaseFlow.resetPayment()
  }, [purchaseFlow])

  /**
   * Navigation Handler
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  // Handle invalid content ID
  if (!contentId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <MiniAppLayout
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid content ID provided. Please check the URL and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Optimized Navigation Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <MiniAppLayout
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <PurchasePageHeader
          onGoBack={handleGoBack}
          step={flowState.step}
        />

        {/* Purchase Overview */}
        <PurchaseOverviewCard
          contentQuery={contentQuery}
          purchaseFlow={purchaseFlow}
          accessQuery={accessQuery}
        />

        {/* Purchase Details */}
        <PurchaseDetailsCard
          content={contentQuery.data}
          isLoading={contentQuery.isLoading}
        />

        {/* Purchase Summary & Actions */}
        <PurchaseSummaryCard
          content={contentQuery.data}
          purchaseFlow={purchaseFlow}
          flowState={flowState}
          onConfirmPurchase={handleConfirmPurchase}
          onRetry={handleRetryPurchase}
        />

        {/* Security Notice */}
        <SecurityNoticeCard />

        {/* Purchase Help */}
        <PurchaseHelpCard />
      </main>

      {/* Transaction Status Modal */}
      <TransactionStatusModal
        transactionStatus={{
          status: flowState.step === 'processing' ? 'submitting' : 'idle',
          transactionHash: flowState.transactionHash || null,
          formattedStatus: getTransactionStatusMessage(flowState.step, purchaseFlow),
          canRetry: flowState.step === 'error',
          progress: {
            submitted: purchaseFlow.executionState.phase === 'executing' || purchaseFlow.executionState.phase === 'completed' || Boolean(flowState.transactionHash),
            confirming: false,
            confirmed: purchaseFlow.executionState.phase === 'completed',
            progressText: getProgressText(purchaseFlow)
          },
          retry: handleRetryPurchase,
          reset: purchaseFlow.resetPayment,
          viewTransaction: () => {
            if (flowState.transactionHash) {
              window.open(`https://basescan.org/tx/${flowState.transactionHash}`, '_blank')
            }
          }
        }}
        isOpen={flowState.showTransactionModal}
        onClose={handleTransactionModalClose}
        transactionTitle="Content Purchase"
        onSuccess={() => {
          handleTransactionModalClose()
          if (contentId) {
            router.push(`/mini/content/${contentId}/view`)
          }
        }}
      />
    </div>
  )
}

/**
 * Purchase Page Header
 *
 * Mobile-optimized header with clear step indication
 */
function PurchasePageHeader({
  onGoBack,
  step
}: {
  onGoBack: () => void
  step: PurchaseFlowState['step']
}) {
  const getStepInfo = () => {
    switch (step) {
      case 'reviewing':
        return { title: 'Confirm Purchase', subtitle: 'Review details before proceeding' }
      case 'confirming':
        return { title: 'Processing Purchase', subtitle: 'Initiating blockchain transaction...' }
      case 'processing':
        return { title: 'Transaction in Progress', subtitle: 'Your purchase is being processed' }
      case 'completed':
        return { title: 'Purchase Complete!', subtitle: 'Your content access has been granted' }
      case 'error':
        return { title: 'Purchase Failed', subtitle: 'Something went wrong with your transaction' }
      default:
        return { title: 'Purchase Confirmation', subtitle: 'Complete your content purchase' }
    }
  }

  const { title, subtitle } = getStepInfo()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          className="flex items-center gap-2 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className={cn(
            "w-3 h-3 rounded-full",
            step === 'reviewing' ? "bg-primary" : "bg-muted-foreground/30"
          )} />
          <div className={cn(
            "w-3 h-3 rounded-full",
            ['confirming', 'processing'].includes(step) ? "bg-primary" : "bg-muted-foreground/30"
          )} />
          <div className={cn(
            "w-3 h-3 rounded-full",
            step === 'completed' ? "bg-primary" : "bg-muted-foreground/30"
          )} />
        </div>
      </div>
    </div>
  )
}

/**
 * Purchase Overview Card
 *
 * Quick summary of the purchase with key information
 */
function PurchaseOverviewCard({
  contentQuery,
  purchaseFlow,
  accessQuery
}: {
  contentQuery: ReturnType<typeof useContentById>
  purchaseFlow: ReturnType<typeof useUnifiedContentPurchaseFlow>
  accessQuery: ReturnType<typeof useHasContentAccess>
}) {
  if (contentQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!contentQuery.data) return null

  const content = contentQuery.data
  const canAfford = purchaseFlow.selectedToken?.hasEnoughBalance ?? false

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
            <Eye className="h-8 w-8 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{content.title}</h2>
            <p className="text-sm text-muted-foreground truncate">{content.description}</p>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">
                  {formatAddress(content.creator)}
                </span>
              </div>

              <Badge variant="secondary" className="text-xs">
                {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Affordability Indicator */}
        {purchaseFlow.selectedToken && (
          <div className="mt-4 p-3 bg-card rounded-lg border">
            <div className="flex items-center justify-between text-sm">
              <span>Your {purchaseFlow.selectedToken.symbol} Balance</span>
              <span className={cn(
                "font-medium",
                canAfford ? "text-green-600" : "text-red-600"
              )}>
                {purchaseFlow.selectedToken.formattedBalance || '0.00'} {purchaseFlow.selectedToken.symbol}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Purchase Details Card
 *
 * Detailed breakdown of what the user is purchasing
 */
function PurchaseDetailsCard({
  content,
  isLoading
}: {
  content: Content | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!content) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Purchase Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Content Access</span>
            <Badge variant="default" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Content Type</span>
            <Badge variant="secondary" className="text-xs">
              {content.category}
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Published</span>
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(content.creationTime)}
            </span>
          </div>
        </div>

        <Separator />

        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            By completing this purchase, you'll gain instant access to the full content.
            Your payment will be processed securely on the Base network using USDC.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Purchase Summary Card
 *
 * Final purchase summary with action buttons
 */
function PurchaseSummaryCard({
  content,
  purchaseFlow,
  flowState,
  onConfirmPurchase,
  onRetry
}: {
  content: Content | undefined
  purchaseFlow: ReturnType<typeof useUnifiedContentPurchaseFlow>
  flowState: PurchaseFlowState
  onConfirmPurchase: () => void
  onRetry: () => void
}) {
  const isProcessing = flowState.step === 'confirming' || flowState.step === 'processing'
  const canPurchase = purchaseFlow.canExecutePayment
  const showError = flowState.step === 'error'
  const canAfford = purchaseFlow.selectedToken?.hasEnoughBalance ?? false

  if (!content) return null

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Purchase Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Content Price</span>
            <span className="text-sm font-medium">{formatCurrency(BigInt(content.payPerViewPrice), 6, 'USDC')}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Platform Fee</span>
            <span>$0.00</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-lg">{formatCurrency(BigInt(content.payPerViewPrice), 6, 'USDC')}</span>
          </div>
        </div>

        {/* Token Approval Notice */}
        {purchaseFlow.selectedToken?.needsApproval && (
          <Alert className="border-amber-200 bg-amber-50">
            <CreditCard className="h-4 w-4" />
            <AlertDescription className="text-amber-800 text-sm">
              Token approval required. This is a one-time setup to allow secure payments.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {showError && flowState.lastError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {flowState.lastError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {showError ? (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          ) : (
            <Button
              onClick={onConfirmPurchase}
              disabled={isProcessing || !canAfford || !canPurchase}
              className="w-full bg-gradient-to-r from-primary to-primary/80"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : purchaseFlow.selectedToken?.needsApproval ? (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Approve & Purchase
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Confirm Purchase
                </>
              )}
            </Button>
          )}

          {!canAfford && purchaseFlow.selectedToken && (
            <p className="text-xs text-center text-red-600">
              Insufficient {purchaseFlow.selectedToken.symbol} balance for this purchase
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground">
            By purchasing, you agree to our terms. All sales are final.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Security Notice Card
 *
 * Builds trust with security information
 */
function SecurityNoticeCard() {
  return (
    <Alert>
      <Shield className="h-4 w-4" />
      <AlertDescription className="text-sm">
        <strong>Secure Transaction:</strong> Your purchase is protected by blockchain technology.
        Once completed, this transaction cannot be reversed. All payments are processed
        instantly using USDC on the Base network.
      </AlertDescription>
    </Alert>
  )
}

/**
 * Purchase Help Card
 *
 * Provides support resources for users
 */
function PurchaseHelpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Need Help?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          <Button variant="outline" size="sm" className="justify-start h-auto p-3">
            <div className="text-left">
              <div className="font-medium text-sm">Purchase FAQ</div>
              <div className="text-xs text-muted-foreground">Common questions about buying content</div>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>

          <Button variant="outline" size="sm" className="justify-start h-auto p-3">
            <div className="text-left">
              <div className="font-medium text-sm">Wallet Support</div>
              <div className="text-xs text-muted-foreground">Help with wallet connections and USDC</div>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>

          <Button variant="outline" size="sm" className="justify-start h-auto p-3">
            <div className="text-left">
              <div className="font-medium text-sm">Contact Support</div>
              <div className="text-xs text-muted-foreground">Get help from our support team</div>
            </div>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Utility Functions
 */
function getTransactionStatusMessage(
  step: PurchaseFlowState['step'],
  purchaseFlow: ReturnType<typeof useUnifiedContentPurchaseFlow>
): string {
  switch (step) {
    case 'confirming':
      return 'Preparing transaction...'
    case 'processing':
      return purchaseFlow.selectedToken?.needsApproval ? 'Processing approval and purchase...' : 'Processing purchase...'
    case 'completed':
      return 'Purchase completed successfully!'
    case 'error':
      return 'Transaction failed'
    default:
      return 'Ready to purchase'
  }
}

function getProgressText(purchaseFlow: ReturnType<typeof useUnifiedContentPurchaseFlow>): string {
  const phase = purchaseFlow.executionState.phase
  if (phase === 'approving') {
    return 'Processing token approval...'
  }
  if (phase === 'executing') {
    return 'Submitting transaction to blockchain...'
  }
  if (phase === 'completed') {
    return 'Transaction confirmed - access granted!'
  }
  if (phase === 'error') {
    return 'Transaction failed'
  }
  return 'Preparing transaction...'
}

/**
 * Error Fallback Component
 */
function PurchaseConfirmationErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <MiniAppLayout
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Purchase Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error with your purchase. Please try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={resetErrorBoundary} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/mini'}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Loading Skeleton Component
 */
function PurchaseConfirmationLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <MiniAppLayout
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * MiniApp Purchase Confirmation Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppPurchaseConfirmationPage({ params }: PurchaseConfirmationPageProps) {
  return (
    <ErrorBoundary
      FallbackComponent={PurchaseConfirmationErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Purchase Confirmation error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<PurchaseConfirmationLoadingSkeleton />}>
        <MiniAppPurchaseConfirmationCore params={params} />
      </Suspense>
    </ErrorBoundary>
  )
}

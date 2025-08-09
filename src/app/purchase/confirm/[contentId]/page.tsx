/**
 * Purchase Confirmation Page - Component 10.3: Secure Transaction Confirmation
 * File: src/app/purchase/confirm/[contentId]/page.tsx
 * 
 * This page represents the critical trust-building moment in Web3 e-commerce where
 * users verify their purchase intent before committing to irreversible blockchain
 * transactions. It demonstrates how sophisticated transaction validation can feel
 * reassuring rather than intimidating through careful UX design and clear communication.
 * 
 * Integration Showcase:
 * - Dynamic route parameter extraction with Next.js App Router
 * - useContentPurchaseFlow manages complete purchase workflow state
 * - useContentById provides content verification and metadata display
 * - useHasContentAccess prevents duplicate purchases proactively
 * - TransactionStatusModal provides real-time blockchain feedback
 * - AppLayout maintains consistent navigation and responsive design
 * 
 * This page validates that even the most critical Web3 interactions can be presented
 * with confidence-inspiring clarity while maintaining the technical rigor that
 * blockchain transactions demand.
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  User,
  Calendar,
  Tag,
  ExternalLink,
  Loader2,
  Lock
} from 'lucide-react'

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  Badge,
  Separator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton
} from '@/components/ui/index'

// Import our architectural layers with proper type safety
import { AppLayout } from '@/components/layout/AppLayout'
import { RouteGuards } from '@/components/layout/RouteGuards'
import { TransactionStatusModal } from '@/components/web3/TransactionStatus'

// Import our business logic hooks that provide the real functionality
import { useContentPurchaseFlow } from '@/hooks/business/workflows'
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'

// Import utility functions and types
import { cn, formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'
import type { Content } from '@/types/contracts'

/**
 * Page Props Interface
 * 
 * This interface defines how Next.js App Router passes dynamic route parameters
 * to our page component, ensuring type safety for the contentId parameter.
 */
interface PurchaseConfirmationPageProps {
  readonly params: Promise<{
    readonly contentId: string
  }>
}

/**
 * Purchase Intent State Interface
 * 
 * This interface manages the various states that occur during the purchase
 * confirmation flow, providing clear state transitions and error handling.
 */
interface PurchaseIntentState {
  readonly confirmationStep: 'reviewing' | 'confirming' | 'processing' | 'completed' | 'error'
  readonly showTransactionModal: boolean
  readonly userHasConfirmed: boolean
  readonly lastError: Error | null
}

/**
 * PurchaseConfirmationPage Component
 * 
 * This component orchestrates the complete purchase confirmation experience,
 * ensuring users have all the information they need before committing to a
 * blockchain transaction while preventing common error scenarios.
 */
export default function PurchaseConfirmationPage({ params }: PurchaseConfirmationPageProps) {
  // Unwrap params using React.use() for Next.js 15 compatibility
  const unwrappedParams = React.use(params) as { readonly contentId: string }
  
  // Extract and validate contentId from route parameters
  const contentId = useMemo(() => {
    try {
      return BigInt(unwrappedParams.contentId)
    } catch {
      return undefined
    }
  }, [unwrappedParams.contentId])

  // Navigation and wallet state
  const router = useRouter()
  const { address: userAddress, isConnected } = useAccount()

  // Core data hooks for content and purchase flow
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress as `0x${string}` | undefined, contentId)
  const purchaseFlow = useContentPurchaseFlow(contentId, userAddress as `0x${string}` | undefined)

  // Purchase intent state management
  const [intentState, setIntentState] = useState<PurchaseIntentState>({
    confirmationStep: 'reviewing',
    showTransactionModal: false,
    userHasConfirmed: false,
    lastError: null
  })

  /**
   * Effect: Handle Already-Purchased Content
   * 
   * This effect demonstrates proactive error prevention by checking access
   * status and redirecting users who already own the content.
   */
  useEffect(() => {
    if (accessQuery.data === true && contentId) {
      // User already has access - redirect to content view
      router.replace(`/content/${contentId}`)
    }
  }, [accessQuery.data, contentId, router])

  /**
   * Effect: Handle Purchase Flow State Changes
   * 
   * This effect translates business logic state changes into UI state updates,
   * ensuring the interface reflects the current workflow status accurately.
   */
  useEffect(() => {
    if (purchaseFlow.flowState.step === 'purchasing' && intentState.userHasConfirmed) {
      setIntentState(prev => ({
        ...prev,
        confirmationStep: 'processing',
        showTransactionModal: true
      }))
    } else if (purchaseFlow.flowState.step === 'completed') {
      setIntentState(prev => ({
        ...prev,
        confirmationStep: 'completed'
      }))
      
      // Redirect to content after successful purchase
      if (contentId) {
        setTimeout(() => {
          router.push(`/content/${contentId}`)
        }, 2000)
      }
    } else if (purchaseFlow.flowState.step === 'error' && purchaseFlow.flowState.error) {
      setIntentState(prev => ({
        ...prev,
        confirmationStep: 'error',
        lastError: purchaseFlow.flowState.error ?? null,
        showTransactionModal: false
      }))
    }
  }, [purchaseFlow.flowState.step, purchaseFlow.flowState.error, intentState.userHasConfirmed, contentId, router])

  /**
   * Purchase Confirmation Handler
   * 
   * This function handles the critical moment when users confirm their intent
   * to purchase, initiating the blockchain transaction with proper validation.
   */
  const handleConfirmPurchase = useCallback(() => {
    if (!isConnected || !userAddress) {
      setIntentState(prev => ({
        ...prev,
        lastError: new Error('Wallet connection required for purchase'),
        confirmationStep: 'error'
      }))
      return
    }

    if (purchaseFlow.flowState.step !== 'can_purchase' && purchaseFlow.flowState.step !== 'need_approval') {
      setIntentState(prev => ({
        ...prev,
        lastError: new Error('Content is not available for purchase'),
        confirmationStep: 'error'
      }))
      return
    }

    try {
      setIntentState(prev => ({
        ...prev,
        userHasConfirmed: true,
        confirmationStep: 'confirming',
        lastError: null
      }))

      // Execute purchase based on approval requirements
      if (purchaseFlow.needsApproval) {
        purchaseFlow.approveAndPurchase()
      } else {
        purchaseFlow.purchase()
      }
    } catch (error) {
      setIntentState(prev => ({
        ...prev,
        lastError: error instanceof Error ? error : new Error('Purchase failed'),
        confirmationStep: 'error',
        userHasConfirmed: false
      }))
    }
  }, [isConnected, userAddress, purchaseFlow])

  /**
   * Transaction Modal Dismissal Handler
   * 
   * This function manages transaction modal state while preserving important
   * context for user experience continuity.
   */
  const handleTransactionModalClose = useCallback(() => {
    setIntentState(prev => ({
      ...prev,
      showTransactionModal: false
    }))
  }, [])

  /**
   * Error Recovery Handler
   * 
   * This function provides users with clear recovery options when errors occur,
   * maintaining confidence in the platform even when transactions fail.
   */
  const handleRetryPurchase = useCallback(() => {
    setIntentState(prev => ({
      ...prev,
      confirmationStep: 'reviewing',
      userHasConfirmed: false,
      lastError: null
    }))
    purchaseFlow.reset()
  }, [purchaseFlow])

  // Show loading state while content data loads
  if (contentQuery.isLoading || !contentId) {
    return (
      <AppLayout>
        <PurchaseConfirmationSkeleton />
      </AppLayout>
    )
  }

  // Show error state for invalid content
  if (contentQuery.error || !contentQuery.data) {
    return (
      <AppLayout>
        <ContentNotFoundError contentId={unwrappedParams.contentId} />
      </AppLayout>
    )
  }

  return (
    <AppLayout className="bg-gradient-to-br from-background via-background to-muted/10">
      <RouteGuards
        requiredLevel='wallet_connected'
        routeConfig={{ path: '/browse' }}
      >
        <div className="container mx-auto max-w-4xl py-8 space-y-6">
          {/* Page Header with Navigation */}
          <PurchaseConfirmationHeader
            onGoBack={() => router.back()}
            step={intentState.confirmationStep}
          />

          {/* Main Content Area */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Primary Purchase Details */}
            <div className="lg:col-span-2 space-y-6">
              <ContentPurchaseDetails
                content={contentQuery.data}
                purchaseFlow={purchaseFlow}
                accessQuery={accessQuery}
              />

              <PurchaseSecurityNotice />
            </div>

            {/* Purchase Summary and Actions */}
            <div className="space-y-6">
              <PurchaseSummaryCard
                content={contentQuery.data}
                purchaseFlow={purchaseFlow}
                intentState={intentState}
                onConfirmPurchase={handleConfirmPurchase}
                onRetry={handleRetryPurchase}
              />

              <PurchaseHelpCard />
            </div>
          </div>

          {/* Transaction Status Modal */}
          <TransactionStatusModal
            transactionStatus={{
              status: intentState.confirmationStep === 'processing' ? 'submitting' : 'idle',
              transactionHash: purchaseFlow.flowState.transactionHash || null,
              formattedStatus: getTransactionStatusMessage(intentState.confirmationStep, purchaseFlow),
              canRetry: intentState.confirmationStep === 'error',
              progress: {
                submitted: purchaseFlow.flowState.step === 'purchasing' || purchaseFlow.flowState.step === 'completed' || Boolean(purchaseFlow.flowState.transactionHash),
                confirming: false,
                confirmed: purchaseFlow.flowState.step === 'completed',
                progressText: getProgressText(purchaseFlow)
              },
              retry: handleRetryPurchase,
              reset: purchaseFlow.reset,
              viewTransaction: () => {
                if (purchaseFlow.flowState.transactionHash) {
                  window.open(`https://basescan.org/tx/${purchaseFlow.flowState.transactionHash}`, '_blank')
                }
              }
            }}
            isOpen={intentState.showTransactionModal}
            onClose={handleTransactionModalClose}
            transactionTitle="Content Purchase"
            onSuccess={() => {
              handleTransactionModalClose()
              if (contentId) {
                router.push(`/content/${contentId}`)
              }
            }}
          />
        </div>
      </RouteGuards>
    </AppLayout>
  )
}

/**
 * Supporting Components
 * 
 * These components demonstrate how complex purchase confirmation interfaces
 * can be broken down into focused, reusable pieces while maintaining type
 * safety and clear responsibilities.
 */

interface PurchaseConfirmationHeaderProps {
  readonly onGoBack: () => void
  readonly step: PurchaseIntentState['confirmationStep']
}

function PurchaseConfirmationHeader({ onGoBack, step }: PurchaseConfirmationHeaderProps) {
  const getStepInfo = () => {
    switch (step) {
      case 'reviewing':
        return { title: 'Confirm Purchase', subtitle: 'Review your purchase details before proceeding' }
      case 'confirming':
        return { title: 'Processing Purchase', subtitle: 'Initiating blockchain transaction...' }
      case 'processing':
        return { title: 'Transaction in Progress', subtitle: 'Your purchase is being processed on the blockchain' }
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
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="sm" onClick={onGoBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <div className="flex-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-green-500" />
        <span className="text-sm text-green-600 font-medium">Secure Purchase</span>
      </div>
    </div>
  )
}

interface ContentPurchaseDetailsProps {
  readonly content: Content
  readonly purchaseFlow: ReturnType<typeof useContentPurchaseFlow>
  readonly accessQuery: ReturnType<typeof useHasContentAccess>
}

function ContentPurchaseDetails({ content, purchaseFlow, accessQuery }: ContentPurchaseDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Content Details
        </CardTitle>
        <CardDescription>
          Verify the content information before completing your purchase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Information */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{content.title}</h3>
            <p className="text-muted-foreground mt-1">{content.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              <span>Category: {content.category}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Published: {formatRelativeTime(content.creationTime)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Creator Information */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Creator
          </h4>
          <div className="text-sm text-muted-foreground">
            {formatAddress(content.creator)}
          </div>
        </div>

        <Separator />

        {/* Access Status */}
        <div className="space-y-2">
          <h4 className="font-medium">Access Status</h4>
          <div className="flex items-center gap-2">
            {accessQuery.data ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Access Granted
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Lock className="h-3 w-3 mr-1" />
                Purchase Required
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PurchaseSecurityNotice() {
  return (
    <Alert>
      <Shield className="h-4 w-4" />
      <AlertDescription>
        Your purchase is secured by blockchain technology. Once completed, this transaction cannot be reversed.
        Please ensure all details are correct before proceeding.
      </AlertDescription>
    </Alert>
  )
}

interface PurchaseSummaryCardProps {
  readonly content: Content
  readonly purchaseFlow: ReturnType<typeof useContentPurchaseFlow>
  readonly intentState: PurchaseIntentState
  readonly onConfirmPurchase: () => void
  readonly onRetry: () => void
}

function PurchaseSummaryCard({ 
  content, 
  purchaseFlow, 
  intentState, 
  onConfirmPurchase, 
  onRetry 
}: PurchaseSummaryCardProps) {
  const isProcessing = intentState.confirmationStep === 'confirming' || intentState.confirmationStep === 'processing'
  const canPurchase = purchaseFlow.flowState.step === 'can_purchase' || purchaseFlow.flowState.step === 'need_approval'
  const showError = intentState.confirmationStep === 'error'
  const canAfford = (purchaseFlow.userBalance ?? BigInt(0)) >= (purchaseFlow.requiredAmount ?? BigInt(0))

  return (
    <Card>
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
            <span>Content Price</span>
            <span className="font-medium">{formatCurrency(BigInt(content.payPerViewPrice), 6, 'USDC')}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Platform Fee</span>
            <span>$0.00</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatCurrency(BigInt(content.payPerViewPrice), 6, 'USDC')}</span>
          </div>
        </div>

        {/* Balance Information */}
        {purchaseFlow.userBalance !== undefined && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex justify-between">
              <span>Your USDC Balance</span>
              <span className={cn(
                canAfford ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(purchaseFlow.userBalance ?? BigInt(0), 6, 'USDC')}
              </span>
            </div>
          </div>
        )}

        {/* Token Approval Notice */}
        {purchaseFlow.needsApproval && (
          <Alert className="border-amber-200 bg-amber-50">
            <CreditCard className="h-4 w-4" />
            <AlertDescription className="text-amber-800">
              Token approval required. This is a one-time setup to allow secure payments.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {showError && intentState.lastError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {intentState.lastError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {showError ? (
            <Button onClick={onRetry} className="w-full">
              Try Again
            </Button>
          ) : (
            <Button
              onClick={onConfirmPurchase}
              disabled={isProcessing || !canAfford || !canPurchase}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : purchaseFlow.needsApproval ? (
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

          <div className="text-xs text-center text-muted-foreground">
            By purchasing, you agree to our terms of service. All sales are final.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PurchaseHelpCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Need Help?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Questions about your purchase? Check out our support resources:
        </p>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            Purchase FAQ
            <ExternalLink className="ml-auto h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            Wallet Support
            <ExternalLink className="ml-auto h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            Contact Support
            <ExternalLink className="ml-auto h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PurchaseConfirmationSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-20" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface ContentNotFoundErrorProps {
  readonly contentId: string
}

function ContentNotFoundError({ contentId }: ContentNotFoundErrorProps) {
  const router = useRouter()

  return (
    <div className="container mx-auto max-w-2xl py-16 text-center space-y-6">
      <div className="space-y-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold">Content Not Found</h1>
        <p className="text-muted-foreground">
          The content with ID &quot;{contentId}&quot; could not be found or may have been removed.
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
        <Button onClick={() => router.push('/browse')}>
          Browse Content
        </Button>
      </div>
    </div>
  )
}

/**
 * Utility Functions
 * 
 * These functions provide formatted display text and state management helpers
 * that keep the main component logic clean and focused.
 */

function getTransactionStatusMessage(
  step: PurchaseIntentState['confirmationStep'],
  purchaseFlow: ReturnType<typeof useContentPurchaseFlow>
): string {
  switch (step) {
    case 'confirming':
      return 'Preparing transaction...'
    case 'processing':
      return purchaseFlow.needsApproval ? 'Processing approval and purchase...' : 'Processing purchase...'
    case 'completed':
      return 'Purchase completed successfully!'
    case 'error':
      return 'Transaction failed'
    default:
      return 'Ready to purchase'
  }
}

function getProgressText(purchaseFlow: ReturnType<typeof useContentPurchaseFlow>): string {
  const step = purchaseFlow.flowState.step
  if (step === 'approving_tokens') {
    return 'Processing token approval...'
  }
  if (step === 'purchasing') {
    return 'Submitting transaction to blockchain...'
  }
  if (step === 'completed') {
    return 'Transaction confirmed - access granted!'
  }
  if (step === 'error') {
    return 'Transaction failed'
  }
  return 'Preparing transaction...'
}
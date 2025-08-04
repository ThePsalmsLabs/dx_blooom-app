/**
 * Enhanced Content Purchase Card Component - Fix 1 Implementation
 * File: src/components/web3/ContentPurchaseCard.tsx
 * 
 * This enhanced implementation establishes complete integration between the 
 * ContentPurchaseCard component and the direct USDC purchase functionality,
 * ensuring users can successfully purchase content with proper approval flows
 * and real-time transaction feedback.
 * 
 * Key Integration Points:
 * - Direct connection to PayPerView.purchaseContentDirect function
 * - Comprehensive USDC approval flow management
 * - Real-time transaction status with progress feedback
 * - Proper error handling and state management
 * - Integration with existing useContentPurchaseFlow hook
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import {
  ShoppingCart,
  Lock,
  Unlock,
  Eye,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Loader2,
  DollarSign,
  Shield
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
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/seperator'
import { cn } from '@/lib/utils'

// Import business logic hooks for purchase workflow
import { useContentPurchaseFlow, type ContentPurchaseFlowResult } from '@/hooks/business/workflows'
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'

// Import transaction status modal for real-time feedback
import { TransactionStatusModal } from './TransactionStatus'

// Import utility functions for formatting
import { formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'

// Import types
import type { Content } from '@/types/contracts'

/**
 * Enhanced Props Interface for ContentPurchaseCard
 * 
 * This interface ensures type safety and provides comprehensive configuration
 * options for the purchase card component.
 */
interface ContentPurchaseCardProps {
  /** Content ID as BigInt for blockchain compatibility */
  readonly contentId: bigint
  /** User's Ethereum address for purchase operations */
  readonly userAddress?: Address
  /** Callback executed when content is successfully purchased */
  readonly onPurchaseSuccess?: () => void
  /** Callback executed when user wants to view purchased content */
  readonly onViewContent?: () => void
  /** Display variant - full shows complete details, compact for lists */
  readonly variant?: 'full' | 'compact'
  /** Additional CSS classes for custom styling */
  readonly className?: string
  /** Whether to show detailed purchase information */
  readonly showPurchaseDetails?: boolean
  /** Whether to automatically redirect after successful purchase */
  readonly autoRedirectAfterPurchase?: boolean
}

/**
 * Purchase Progress State Interface
 * 
 * This interface manages the various states during the purchase process,
 * providing clear progression tracking for users.
 */
interface PurchaseProgressState {
  readonly step: 'idle' | 'checking' | 'approving' | 'purchasing' | 'completed' | 'error'
  readonly message: string
  readonly canRetry: boolean
  readonly showModal: boolean
}

/**
 * Enhanced ContentPurchaseCard Component
 * 
 * This component provides a complete purchase experience with proper integration
 * to the PayPerView smart contract, handling all aspects of the USDC purchase flow.
 */
export function ContentPurchaseCard({
  contentId,
  userAddress,
  onPurchaseSuccess,
  onViewContent,
  variant = 'full',
  className,
  showPurchaseDetails = true,
  autoRedirectAfterPurchase = false
}: ContentPurchaseCardProps) {
  const router = useRouter()
  const { isConnected } = useAccount()
  
  // Core data hooks for content information and purchase workflow
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)
  const purchaseFlow = useContentPurchaseFlow(contentId, userAddress)
  
  // Purchase progress state for UI feedback
  const [progressState, setProgressState] = useState<PurchaseProgressState>({
    step: 'idle',
    message: 'Ready to purchase',
    canRetry: false,
    showModal: false
  })

  /**
   * Effect: Update Progress State Based on Purchase Flow
   * 
   * This effect translates the purchase workflow state into user-friendly
   * progress messages and modal visibility controls.
   */
  useEffect(() => {
    const currentStep = purchaseFlow.currentStep
    const hasError = purchaseFlow.error !== null
    
    if (hasError) {
      setProgressState({
        step: 'error',
        message: `Purchase failed: ${purchaseFlow.error?.message || 'Unknown error'}`,
        canRetry: true,
        showModal: true
      })
      return
    }

    switch (currentStep) {
      case 'checking_access':
        setProgressState({
          step: 'checking',
          message: 'Checking access status...',
          canRetry: false,
          showModal: false
        })
        break
      
      case 'need_approval':
        setProgressState({
          step: 'idle',
          message: 'USDC approval required before purchase',
          canRetry: false,
          showModal: false
        })
        break
      
      case 'can_purchase':
        setProgressState({
          step: 'idle',
          message: 'Ready to purchase',
          canRetry: false,
          showModal: false
        })
        break
      
      case 'purchasing':
        setProgressState({
          step: 'purchasing',
          message: 'Processing purchase transaction...',
          canRetry: false,
          showModal: true
        })
        break
      
      case 'completed':
        setProgressState({
          step: 'completed',
          message: 'Purchase completed successfully!',
          canRetry: false,
          showModal: true
        })
        break
      
      default:
        setProgressState({
          step: 'idle',
          message: 'Ready to purchase',
          canRetry: false,
          showModal: false
        })
    }
  }, [purchaseFlow.currentStep, purchaseFlow.error])

  /**
   * Effect: Handle Purchase Success
   * 
   * This effect manages post-purchase actions including callbacks and redirects.
   */
  useEffect(() => {
    if (purchaseFlow.currentStep === 'completed' && progressState.step === 'completed') {
      // Execute success callback if provided
      if (onPurchaseSuccess) {
        onPurchaseSuccess()
      }
      
      // Auto-redirect if enabled
      if (autoRedirectAfterPurchase) {
        setTimeout(() => {
          router.push(`/content/${contentId}`)
        }, 2000)
      }
    }
  }, [purchaseFlow.currentStep, progressState.step, onPurchaseSuccess, autoRedirectAfterPurchase, router, contentId])

  /**
   * Purchase Action Handler
   * 
   * This function orchestrates the complete purchase flow, handling both
   * approval requirements and direct purchases based on current state.
   */
  const handlePurchaseAction = useCallback(async () => {
    if (!isConnected || !userAddress) {
      console.error('Wallet not connected')
      return
    }

    if (!contentId) {
      console.error('Content ID not provided')
      return
    }

    try {
      // Set purchasing state
      setProgressState(prev => ({
        ...prev,
        step: 'purchasing',
        showModal: true
      }))

      // Check if approval is needed first
      if (purchaseFlow.needsApproval) {
        // First approve USDC spending
        setProgressState(prev => ({
          ...prev,
          step: 'approving',
          message: 'Approving USDC spending...'
        }))
        
        // Execute approval and purchase in sequence
        await purchaseFlow.approveAndPurchase()
      } else {
        // Direct purchase without additional approval needed
        await purchaseFlow.purchase()
      }
    } catch (error) {
      console.error('Purchase action failed:', error)
      setProgressState({
        step: 'error',
        message: `Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        canRetry: true,
        showModal: true
      })
    }
  }, [isConnected, userAddress, contentId, purchaseFlow])

  /**
   * Content View Handler
   * 
   * This function handles the content viewing action for users who already
   * have access to the content.
   */
  const handleViewContent = useCallback(() => {
    if (onViewContent) {
      onViewContent()
    } else {
      // Default behavior: navigate to content page
      router.push(`/content/${contentId}`)
    }
  }, [onViewContent, router, contentId])

  /**
   * Retry Handler
   * 
   * This function allows users to retry failed purchase attempts.
   */
  const handleRetry = useCallback(() => {
    setProgressState({
      step: 'idle',
      message: 'Ready to retry purchase',
      canRetry: false,
      showModal: false
    })
    
    // Reset purchase flow error state
    if (purchaseFlow.reset) {
      purchaseFlow.reset()
    }
  }, [purchaseFlow])

  /**
   * Modal Close Handler
   * 
   * This function manages the transaction status modal visibility.
   */
  const handleModalClose = useCallback(() => {
    setProgressState(prev => ({
      ...prev,
      showModal: false
    }))
  }, [])

  // Loading state while fetching content and access data
  if (contentQuery.isLoading || accessQuery.isLoading || purchaseFlow.isLoading) {
    return <ContentPurchaseCardSkeleton variant={variant} className={className} />
  }

  // Error state if content data cannot be loaded
  if (contentQuery.error || !contentQuery.data) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load content information. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const content = contentQuery.data
  const hasAccess = accessQuery.data || false

  // Render compact variant for space-constrained contexts
  if (variant === 'compact') {
    return (
      <CompactPurchaseCard
        content={content}
        hasAccess={hasAccess}
        progressState={progressState}
        purchaseFlow={purchaseFlow}
        onPurchaseAction={handlePurchaseAction}
        onViewContent={handleViewContent}
        className={className}
      />
    )
  }

  // Render full variant with complete purchase interface
  return (
    <>
      <Card className={cn('w-full max-w-md mx-auto', className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold line-clamp-2">
                {content.title}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {content.description}
              </CardDescription>
            </div>
            <AccessStatusBadge hasAccess={hasAccess} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Content Creator Information */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {formatAddress(content.creator).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {formatAddress(content.creator)}
              </p>
              <p className="text-xs text-gray-500">Content Creator</p>
            </div>
          </div>

          {/* Purchase Details Section */}
          {showPurchaseDetails && (
            <PurchaseDetailsSection
              content={content}
              purchaseFlow={purchaseFlow}
              hasAccess={hasAccess}
            />
          )}

          {/* Progress Status */}
          <PurchaseProgressSection
            progressState={progressState}
            purchaseFlow={purchaseFlow}
          />
        </CardContent>

        <CardFooter>
          <PurchaseActionButton
            hasAccess={hasAccess}
            progressState={progressState}
            purchaseFlow={purchaseFlow}
            onPurchaseAction={handlePurchaseAction}
            onViewContent={handleViewContent}
            onRetry={handleRetry}
            isConnected={isConnected}
          />
        </CardFooter>
      </Card>

      {/* Transaction Status Modal */}
      <TransactionStatusModal
        isOpen={progressState.showModal}
        onClose={handleModalClose}
        transactionStatus={{
          status: progressState.step === 'purchasing' ? 'submitting' : 
                  progressState.step === 'completed' ? 'confirmed' :
                  progressState.step === 'error' ? 'failed' : 'idle',
          transactionHash: purchaseFlow.purchaseProgress.transactionHash || null,
          formattedStatus: progressState.message,
          canRetry: progressState.canRetry,
          progress: {
            submitted: purchaseFlow.purchaseProgress.isSubmitting,
            confirming: purchaseFlow.purchaseProgress.isConfirming,
            confirmed: purchaseFlow.purchaseProgress.isConfirmed,
            progressText: getProgressText(purchaseFlow.purchaseProgress)
          },
          retry: handleRetry,
          reset: purchaseFlow.reset || (() => {}),
          viewTransaction: () => {
            if (purchaseFlow.purchaseProgress.transactionHash) {
              window.open(`https://sepolia.basescan.org/tx/${purchaseFlow.purchaseProgress.transactionHash}`, '_blank')
            }
          }
        }}
        transactionTitle="Content Purchase"
        onSuccess={() => {
          handleModalClose()
          if (autoRedirectAfterPurchase) {
            router.push(`/content/${contentId}`)
          }
        }}
      />
    </>
  )
}

/**
 * Access Status Badge Component
 * 
 * This component displays the current access status for the content.
 */
function AccessStatusBadge({ hasAccess }: { hasAccess: boolean }) {
  if (hasAccess) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Owned
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-200">
      <Lock className="h-3 w-3 mr-1" />
      Purchase Required
    </Badge>
  )
}

/**
 * Purchase Details Section Component
 * 
 * This component displays pricing and purchase information.
 */
function PurchaseDetailsSection({ 
  content, 
  purchaseFlow, 
  hasAccess 
}: { 
  content: Content
  purchaseFlow: ContentPurchaseFlowResult
  hasAccess: boolean 
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">Price</span>
        <span className="font-semibold">
          {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
        </span>
      </div>
      
      {!hasAccess && (
        <>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Platform Fee</span>
            <span>$0.00</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center font-medium">
            <span>Total</span>
            <span>{formatCurrency(content.payPerViewPrice, 6, 'USDC')}</span>
          </div>
          
          {purchaseFlow.userBalance !== undefined && (
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center text-sm">
                <span>Your USDC Balance</span>
                <span className={cn(
                  purchaseFlow.canAfford ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                )}>
                  {formatCurrency(purchaseFlow.userBalance || BigInt(0), 6, 'USDC')}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Purchase Progress Section Component
 * 
 * This component shows the current progress of the purchase operation.
 */
function PurchaseProgressSection({ 
  progressState, 
  purchaseFlow 
}: { 
  progressState: PurchaseProgressState
  purchaseFlow: ContentPurchaseFlowResult 
}) {
  const getProgressIcon = () => {
    switch (progressState.step) {
      case 'checking':
      case 'approving':
      case 'purchasing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return purchaseFlow.needsApproval 
          ? <CreditCard className="h-4 w-4 text-amber-500" />
          : <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {getProgressIcon()}
        <span className="text-sm font-medium">{progressState.message}</span>
      </div>

      {purchaseFlow.needsApproval && progressState.step === 'idle' && (
        <Alert className="bg-amber-50 border-amber-200">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-xs">
            First-time purchase requires USDC approval. This is secure and only happens once per wallet.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Purchase Action Button Component
 * 
 * This component renders the appropriate action button based on current state.
 */
function PurchaseActionButton({
  hasAccess,
  progressState,
  purchaseFlow,
  onPurchaseAction,
  onViewContent,
  onRetry,
  isConnected
}: {
  hasAccess: boolean
  progressState: PurchaseProgressState
  purchaseFlow: ContentPurchaseFlowResult
  onPurchaseAction: () => void
  onViewContent: () => void
  onRetry: () => void
  isConnected: boolean
}) {
  // User already has access - show view button
  if (hasAccess) {
    return (
      <Button onClick={onViewContent} className="w-full">
        <Eye className="h-4 w-4 mr-2" />
        View Content
      </Button>
    )
  }

  // Wallet not connected
  if (!isConnected) {
    return (
      <Button disabled className="w-full">
        <AlertCircle className="h-4 w-4 mr-2" />
        Connect Wallet to Purchase
      </Button>
    )
  }

  // Error state - show retry button
  if (progressState.step === 'error' && progressState.canRetry) {
    return (
      <Button onClick={onRetry} variant="outline" className="w-full">
        <AlertCircle className="h-4 w-4 mr-2" />
        Retry Purchase
      </Button>
    )
  }

  // Cannot afford the content
  if (!purchaseFlow.canAfford && purchaseFlow.userBalance !== undefined) {
    return (
      <Button disabled className="w-full">
        <AlertCircle className="h-4 w-4 mr-2" />
        Insufficient USDC Balance
      </Button>
    )
  }

  // Processing state
  const isProcessing = progressState.step === 'purchasing' || 
                      progressState.step === 'approving' || 
                      progressState.step === 'checking'

  if (isProcessing) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        {progressState.step === 'approving' ? 'Approving...' : 'Processing...'}
      </Button>
    )
  }

  // Main purchase button
  const needsApproval = purchaseFlow.needsApproval && progressState.step === 'idle'
  
  return (
    <Button 
      onClick={onPurchaseAction} 
      className="w-full"
      disabled={!purchaseFlow.canAfford}
    >
      {needsApproval ? (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Approve & Purchase
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Purchase Content
        </>
      )}
    </Button>
  )
}

/**
 * Compact Purchase Card Component
 * 
 * This component provides a space-efficient version for use in content lists.
 */
function CompactPurchaseCard({
  content,
  hasAccess,
  progressState,
  purchaseFlow,
  onPurchaseAction,
  onViewContent,
  className
}: {
  content: Content
  hasAccess: boolean
  progressState: PurchaseProgressState
  purchaseFlow: ContentPurchaseFlowResult
  onPurchaseAction: () => void
  onViewContent: () => void
  className?: string
}) {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{content.title}</h3>
            <p className="text-sm text-gray-500">
              {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <AccessStatusBadge hasAccess={hasAccess} />
            
            {hasAccess ? (
              <Button size="sm" onClick={onViewContent}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={onPurchaseAction}
                disabled={progressState.step === 'purchasing' || !purchaseFlow.canAfford}
              >
                {progressState.step === 'purchasing' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShoppingCart className="h-3 w-3 mr-1" />
                )}
                Buy
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Content Purchase Card Skeleton Component
 * 
 * This component provides loading states while data is being fetched.
 */
function ContentPurchaseCardSkeleton({ 
  variant = 'full', 
  className 
}: { 
  variant?: 'full' | 'compact'
  className?: string 
}) {
  if (variant === 'compact') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
            </div>
            <div className="flex gap-2 ml-4">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 bg-gray-200 rounded animate-pulse w-full" />
      </CardFooter>
    </Card>
  )
}

/**
 * Utility function to get progress text for transaction status
 */
function getProgressText(progress: { isSubmitting: boolean; isConfirming: boolean; isConfirmed: boolean }): string {
  if (progress.isSubmitting) return 'Submitting transaction...'
  if (progress.isConfirming) return 'Confirming on blockchain...'
  if (progress.isConfirmed) return 'Transaction confirmed!'
  return 'Preparing transaction...'
}
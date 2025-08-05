/**
 * Content Purchase Card Component - Fix 1 Implementation
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

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import {
  ShoppingCart,
  Lock,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Loader2,
  Shield,
  ExternalLink,
  RefreshCw
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
import { Skeleton } from '@/components/ui/skeleton'

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
  readonly onPurchaseSuccess?: (contentId: bigint) => void
  /** Callback executed when user wants to view purchased content */
  readonly onViewContent?: (contentId: bigint) => void
  /** Display variant - full shows complete details, compact for lists */
  readonly variant?: 'full' | 'compact' | 'minimal'
  /** Additional CSS classes for custom styling */
  readonly className?: string
  /** Whether to show creator information */
  readonly showCreatorInfo?: boolean
  /** Whether to show detailed purchase information */
  readonly showPurchaseDetails?: boolean
  /** Whether to automatically redirect after successful purchase */
  readonly autoRedirectAfterPurchase?: boolean
}

/**
 * Purchase State Management
 */
interface PurchaseState {
  readonly status: 'idle' | 'checking' | 'approving' | 'purchasing' | 'completed' | 'error'
  readonly message: string
  readonly progress: number
  readonly canRetry: boolean
  readonly transactionHash?: string
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
  showCreatorInfo = true,
  showPurchaseDetails = true,
  autoRedirectAfterPurchase = false
}: ContentPurchaseCardProps) {
  const router = useRouter()
  const { address: connectedAddress, isConnected } = useAccount()
  
  // Use the connected address if no userAddress provided
  const effectiveUserAddress = userAddress || connectedAddress

  // Core data hooks
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(effectiveUserAddress, contentId)
  const purchaseFlow = useContentPurchaseFlow(contentId, effectiveUserAddress)
  
  // Local purchase state
  const [purchaseState, setPurchaseState] = useState<PurchaseState>({
    status: 'idle',
    message: 'Ready to purchase',
    progress: 0,
    canRetry: false
  })

  /**
   * Update purchase state based on purchase flow status
   */
  useEffect(() => {
    if (!purchaseFlow) return

    const { currentStep, error, purchaseProgress, approvalProgress } = purchaseFlow

    switch (currentStep) {
      case 'checking_access':
        setPurchaseState({
          status: 'checking',
          message: 'Checking access...',
          progress: 10,
          canRetry: false
        })
        break
      
      case 'need_approval':
        setPurchaseState({
          status: 'idle',
          message: 'USDC approval required',
          progress: 30,
          canRetry: false
        })
        break
      
      case 'approving_tokens':
        setPurchaseState({
          status: 'approving',
          message: 'Approving USDC...',
          progress: 50,
          canRetry: false,
          transactionHash: approvalProgress.transactionHash
        })
        break
      
      case 'purchasing':
        setPurchaseState({
          status: 'purchasing',
          message: 'Processing purchase...',
          progress: 80,
          canRetry: false,
          transactionHash: purchaseProgress.transactionHash
        })
        break
      
      case 'completed':
        setPurchaseState({
          status: 'completed',
          message: 'Purchase completed!',
          progress: 100,
          canRetry: false,
          transactionHash: purchaseProgress.transactionHash
        })
        
        // Call success callback
        if (onPurchaseSuccess) {
          onPurchaseSuccess(contentId)
        }
        
        // Auto-redirect if enabled
        if (autoRedirectAfterPurchase) {
          setTimeout(() => {
            router.push(`/content/${contentId}`)
          }, 2000)
        }
        break
      
      case 'error':
        setPurchaseState({
          status: 'error',
          message: error?.message || 'Purchase failed',
          progress: 0,
          canRetry: true
        })
        break
      
      default:
        setPurchaseState({
          status: 'idle',
          message: 'Ready to purchase',
          progress: 0,
          canRetry: false
        })
    }
  }, [purchaseFlow, contentId, onPurchaseSuccess, autoRedirectAfterPurchase, router])

  /**
   * Handle purchase action
   */
  const handlePurchase = useCallback(async () => {
    if (!isConnected || !effectiveUserAddress) {
      // Handle wallet connection
      console.error('Wallet not connected')
      return
    }

    if (!purchaseFlow) {
      console.error('Purchase flow not available')
      return
    }

    try {
      if (purchaseFlow.needsApproval) {
        await purchaseFlow.approveAndPurchase()
      } else {
        await purchaseFlow.purchase()
      }
    } catch (error) {
      console.error('Purchase failed:', error)
      // Error state will be handled by the useEffect above
    }
  }, [isConnected, effectiveUserAddress, purchaseFlow])

  /**
   * Handle retry action
   */
  const handleRetry = useCallback(() => {
    if (purchaseFlow?.reset) {
      purchaseFlow.reset()
    }
    setPurchaseState({
      status: 'idle',
      message: 'Ready to retry',
      progress: 0,
      canRetry: false
    })
  }, [purchaseFlow])

  /**
   * Handle view content action
   */
  const handleViewContent = useCallback(() => {
    if (onViewContent) {
      onViewContent(contentId)
    } else {
      router.push(`/content/${contentId}`)
    }
  }, [onViewContent, contentId, router])

  // Loading state
  if (contentQuery.isLoading || accessQuery.isLoading || purchaseFlow?.isLoading) {
    return <ContentPurchaseCardSkeleton variant={variant} className={className} />
  }

  // Error state - content not found
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
  const hasAccess = accessQuery.data === true
  const canAfford = purchaseFlow?.canAfford ?? false
  const needsApproval = purchaseFlow?.needsApproval ?? false

  // Render compact variant
  if (variant === 'compact') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{content.title}</h3>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <AccessStatusBadge hasAccess={hasAccess} />
              
              {hasAccess ? (
                <Button size="sm" onClick={handleViewContent}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              ) : (
                <PurchaseButton
                  onClick={handlePurchase}
                  purchaseState={purchaseState}
                  canAfford={canAfford}
                  needsApproval={needsApproval}
                  size="sm"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render minimal variant
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-sm font-medium">
          {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
        </span>
        {hasAccess ? (
          <Button size="sm" variant="outline" onClick={handleViewContent}>
            <Eye className="h-3 w-3" />
          </Button>
        ) : (
          <PurchaseButton
            onClick={handlePurchase}
            purchaseState={purchaseState}
            canAfford={canAfford}
            needsApproval={needsApproval}
            size="sm"
          />
        )}
      </div>
    )
  }

  // Full variant - comprehensive purchase experience
  return (
    <Card className={cn('w-full max-w-lg mx-auto', className)}>
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
        
        {/* Creator Information */}
        {showCreatorInfo && (
          <div className="flex items-center space-x-3 mt-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {formatAddress(content.creator).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {formatAddress(content.creator)}
              </p>
              <p className="text-xs text-gray-500">Creator</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Purchase Details */}
        {showPurchaseDetails && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-medium">
                {formatCurrency(content.payPerViewPrice, 6, 'USDC')}
              </span>
            </div>
            
            {!hasAccess && purchaseFlow && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your Balance</span>
                  <span className={cn(
                    "font-medium",
                    canAfford ? "text-green-600" : "text-red-600"
                  )}>
                    {purchaseFlow.userBalance ? 
                      formatCurrency(purchaseFlow.userBalance, 6, 'USDC') : 
                      '---'
                    }
                  </span>
                </div>
                
                {needsApproval && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Approval Status</span>
                    <Badge variant="outline">Required</Badge>
                  </div>
                )}
              </>
            )}
            
            <Separator />
          </div>
        )}

        {/* Purchase Progress */}
        {purchaseState.status !== 'idle' && purchaseState.status !== 'error' && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{purchaseState.message}</span>
              <span className="text-sm text-muted-foreground">
                {purchaseState.progress}%
              </span>
            </div>
            <Progress value={purchaseState.progress} />
            
            {purchaseState.transactionHash && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Transaction Hash:</span>
                <a
                  href={`https://basescan.org/tx/${purchaseState.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-foreground"
                >
                  {`${purchaseState.transactionHash.slice(0, 6)}...${purchaseState.transactionHash.slice(-4)}`}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {purchaseState.status === 'error' && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {purchaseState.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Insufficient Balance Warning */}
        {!hasAccess && !canAfford && purchaseFlow && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insufficient USDC balance. You need{' '}
              {formatCurrency(content.payPerViewPrice, 6, 'USDC')} to purchase this content.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {hasAccess ? (
          <Button onClick={handleViewContent} className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View Content
          </Button>
        ) : (
          <>
            {purchaseState.canRetry && (
              <Button
                variant="outline"
                onClick={handleRetry}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
            
            <PurchaseButton
              onClick={handlePurchase}
              purchaseState={purchaseState}
              canAfford={canAfford}
              needsApproval={needsApproval}
              className={purchaseState.canRetry ? "flex-1" : "w-full"}
            />
          </>
        )}
      </CardFooter>
    </Card>
  )
}

/**
 * Purchase Button Component
 */
function PurchaseButton({
  onClick,
  purchaseState,
  canAfford,
  needsApproval,
  size = 'default',
  className
}: {
  onClick: () => void
  purchaseState: PurchaseState
  canAfford: boolean
  needsApproval: boolean
  size?: 'default' | 'sm' | 'lg'
  className?: string
}) {
  const isProcessing = ['checking', 'approving', 'purchasing'].includes(purchaseState.status)
  const isCompleted = purchaseState.status === 'completed'
  
  if (isCompleted) {
    return (
      <Button size={size} className={cn("bg-green-600 hover:bg-green-700", className)} disabled>
        <CheckCircle className="h-4 w-4 mr-2" />
        Purchased!
      </Button>
    )
  }
  
  if (isProcessing) {
    return (
      <Button size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        {purchaseState.status === 'approving' ? 'Approving...' : 'Processing...'}
      </Button>
    )
  }
  
  const buttonText = needsApproval ? 'Approve & Purchase' : 'Purchase Content'
  const ButtonIcon = needsApproval ? CreditCard : ShoppingCart
  
  return (
    <Button 
      onClick={onClick} 
      size={size}
      className={className}
      disabled={!canAfford || isProcessing}
    >
      <ButtonIcon className="h-4 w-4 mr-2" />
      {buttonText}
    </Button>
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
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Owned
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline">
      <Lock className="h-3 w-3 mr-1" />
      Premium
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
  variant?: 'full' | 'compact' | 'minimal'
  className?: string
}) {
  if (variant === 'compact') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    )
  }
  
  // Full variant skeleton
  return (
    <Card className={cn('w-full max-w-lg mx-auto', className)}>
      <CardHeader>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
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
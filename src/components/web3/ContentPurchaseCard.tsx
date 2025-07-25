/**
 * Content Purchase Card Component
 * File: src/components/web3/ContentPurchaseCard.tsx
 * 
 * This component demonstrates how sophisticated Web3 e-commerce experiences can be
 * built using our UI integration hooks. It transforms complex content purchasing
 * workflows - including access checking, token approval, and payment processing -
 * into an intuitive, e-commerce-like interface that feels familiar to users.
 * 
 * Key Features:
 * - Intelligent purchase flow with automatic approval detection
 * - Real-time access status with immediate content unlocking
 * - Rich content metadata display with creator information
 * - Integrated transaction status with progress feedback
 * - Responsive design that works across device sizes
 * - Accessibility features for screen readers and keyboard navigation
 * 
 * This component showcases how our business logic workflows can be transformed
 * into delightful user experiences that hide blockchain complexity while
 * maintaining the transparency that Web3 users expect.
 */

'use client'

import React, { useState } from 'react'
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
  Loader2
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
import { cn } from '@/lib/utils'

// Import our UI integration hook and transaction modal
import { useContentPurchaseUI } from '@/hooks/ui/integration'
import { TransactionStatusModal } from './TransactionStatus'

/**
 * Props interface for the ContentPurchaseCard component
 * 
 * This interface demonstrates how components can be designed for specific
 * use cases while remaining flexible through props configuration.
 */
interface ContentPurchaseCardProps {
  /** ID of the content to display and enable purchasing for */
  contentId: bigint
  /** Address of the current user (for access checking) */
  userAddress?: string
  /** Optional callback when content is successfully purchased */
  onPurchaseSuccess?: () => void
  /** Optional callback when user wants to view content */
  onViewContent?: () => void
  /** Whether to show the full card or a compact version */
  variant?: 'full' | 'compact'
  /** Optional custom styling */
  className?: string
}

/**
 * ContentPurchaseCard Component
 * 
 * This component demonstrates the power of our content purchase workflow.
 * It handles the complete purchase experience - from initial access checking
 * through payment processing to content unlocking - all through a single
 * UI integration hook that abstracts away the blockchain complexity.
 */
export function ContentPurchaseCard({
  contentId,
  userAddress,
  onPurchaseSuccess,
  onViewContent,
  variant = 'full',
  className
}: ContentPurchaseCardProps) {
  // State for modal management
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  
  // Get all purchase flow data from our UI integration hook
  // This single hook provides everything needed for a complete purchase interface
  const purchaseUI = useContentPurchaseUI(
    contentId, 
    userAddress as `0x${string}` | undefined
  )

  // Handle purchase success
  React.useEffect(() => {
    if (purchaseUI.hasAccess && onPurchaseSuccess) {
      onPurchaseSuccess()
    }
  }, [purchaseUI.hasAccess, onPurchaseSuccess])

  // Show transaction modal when purchase is in progress
  React.useEffect(() => {
    const isProcessing = purchaseUI.purchaseActions.isProcessing
    if (isProcessing && !showTransactionModal) {
      setShowTransactionModal(true)
    }
  }, [purchaseUI.purchaseActions.isProcessing, showTransactionModal])

  // Handle purchase actions with built-in approval detection
  const handlePurchaseAction = () => {
    if (purchaseUI.purchaseActions.needsApproval) {
      purchaseUI.purchaseActions.approveAndPurchaseAction()
    } else {
      purchaseUI.purchaseActions.purchaseAction()
    }
    setShowTransactionModal(true)
  }

  // Handle content viewing
  const handleViewContent = () => {
    if (onViewContent) {
      onViewContent()
    }
  }

  // Render compact variant for space-constrained contexts
  if (variant === 'compact') {
    return (
      <CompactContentCard
        purchaseUI={purchaseUI}
        onPurchaseAction={handlePurchaseAction}
        onViewContent={handleViewContent}
        className={className}
      />
    )
  }

  // Render full card variant with comprehensive information
  return (
    <>
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader>
          {/* Content title and category */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg line-clamp-2">
                {purchaseUI.content?.title || 'Loading...'}
              </CardTitle>
              <AccessStatusBadge hasAccess={purchaseUI.hasAccess} />
            </div>
            
            {purchaseUI.content && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {purchaseUI.content.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {purchaseUI.content.publishDate}
                </span>
              </div>
            )}
          </div>

          {/* Content description */}
          {purchaseUI.content && (
            <CardDescription className="line-clamp-3">
              {purchaseUI.content.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Creator information */}
          {purchaseUI.content && (
            <CreatorInfoSection
              creatorName={purchaseUI.content.creatorName}
            />
          )}

          {/* Pricing information */}
          <PricingSection
            price={purchaseUI.content?.formattedPrice}
            userBalance={purchaseUI.purchaseActions.balanceText}
            canAfford={purchaseUI.purchaseActions.canAfford}
          />

          {/* Purchase status and requirements */}
          <PurchaseStatusSection
            currentStep={purchaseUI.currentStepText}
            hasAccess={purchaseUI.hasAccess}
            needsApproval={purchaseUI.purchaseActions.needsApproval}
            isLoading={purchaseUI.isLoading}
          />

          {/* Error display */}
          {purchaseUI.errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {purchaseUI.errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {purchaseUI.successMessage && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {purchaseUI.successMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <PurchaseActionsSection
            hasAccess={purchaseUI.hasAccess}
            canPurchase={purchaseUI.canPurchase}
            canAfford={purchaseUI.purchaseActions.canAfford}
            needsApproval={purchaseUI.purchaseActions.needsApproval}
            isProcessing={purchaseUI.purchaseActions.isProcessing}
            onPurchaseAction={handlePurchaseAction}
            onViewContent={handleViewContent}
          />
        </CardFooter>
      </Card>

      {/* Transaction status modal */}
      <TransactionStatusModal
        transactionStatus={purchaseUI.transactionStatus}
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transactionTitle="Content Purchase"
        onSuccess={() => {
          setShowTransactionModal(false)
          if (onPurchaseSuccess) {
            onPurchaseSuccess()
          }
        }}
      />
    </>
  )
}

/**
 * Compact Content Card Variant
 * 
 * This variant provides a streamlined interface for contexts where space
 * is limited, such as content lists or search results.
 */
function CompactContentCard({
  purchaseUI,
  onPurchaseAction,
  onViewContent,
  className
}: {
  purchaseUI: ReturnType<typeof useContentPurchaseUI>
  onPurchaseAction: () => void
  onViewContent: () => void
  className?: string
}) {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Access status indicator */}
          <div className="mt-1">
            <AccessStatusBadge hasAccess={purchaseUI.hasAccess} />
          </div>

          {/* Content information */}
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="font-medium text-sm line-clamp-1">
              {purchaseUI.content?.title || 'Loading...'}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {purchaseUI.content?.description}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium">
                {purchaseUI.content?.formattedPrice}
              </span>
              <span className="text-muted-foreground">
                {purchaseUI.content?.category}
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {purchaseUI.hasAccess ? (
              <Button
                size="sm"
                onClick={onViewContent}
                className="h-8"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onPurchaseAction}
                disabled={!purchaseUI.canPurchase || !purchaseUI.purchaseActions.canAfford}
                className="h-8"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
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
 * Access Status Badge Component
 * 
 * This component provides clear visual indication of the user's access
 * status, helping them understand their relationship to the content.
 */
function AccessStatusBadge({ hasAccess }: { hasAccess: boolean }) {
  if (hasAccess) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <Unlock className="h-3 w-3 mr-1" />
        Owned
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      <Lock className="h-3 w-3 mr-1" />
      Locked
    </Badge>
  )
}

/**
 * Creator Information Section
 * 
 * This section displays creator details and helps establish trust
 * and recognition for content creators.
 */
function CreatorInfoSection({ creatorName }: { creatorName: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs">
          {creatorName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <User className="h-3 w-3" />
        <span>Created by {creatorName}</span>
      </div>
    </div>
  )
}

/**
 * Pricing Section Component
 * 
 * This section displays pricing information and user balance status,
 * helping users understand the financial aspects of the purchase.
 */
function PricingSection({
  price,
  userBalance,
  canAfford
}: {
  price?: string
  userBalance: string
  canAfford: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Price</span>
        <span className="text-lg font-bold">{price || 'Loading...'}</span>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{userBalance}</span>
        {canAfford ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sufficient Balance
          </Badge>
        ) : (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Insufficient Balance
          </Badge>
        )}
      </div>
    </div>
  )
}

/**
 * Purchase Status Section Component
 * 
 * This section provides real-time status updates about the purchase
 * process, keeping users informed about current state and next steps.
 */
function PurchaseStatusSection({
  currentStep,
  hasAccess,
  needsApproval,
  isLoading
}: {
  currentStep: string
  hasAccess: boolean
  needsApproval: boolean
  isLoading: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasAccess ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : needsApproval ? (
          <CreditCard className="h-4 w-4 text-amber-500" />
        ) : (
          <Clock className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-sm font-medium">{currentStep}</span>
      </div>

      {needsApproval && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs">
          <p className="text-amber-800">
            Token approval required before purchase. This is a one-time setup
            that allows the platform to process your payments.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Purchase Actions Section Component
 * 
 * This section provides the appropriate action buttons based on the
 * current state, guiding users through the purchase process.
 */
function PurchaseActionsSection({
  hasAccess,
  canPurchase,
  canAfford,
  needsApproval,
  isProcessing,
  onPurchaseAction,
  onViewContent
}: {
  hasAccess: boolean
  canPurchase: boolean
  canAfford: boolean
  needsApproval: boolean
  isProcessing: boolean
  onPurchaseAction: () => void
  onViewContent: () => void
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

  // User cannot afford the content
  if (!canAfford) {
    return (
      <Button disabled className="w-full">
        <AlertCircle className="h-4 w-4 mr-2" />
        Insufficient Balance
      </Button>
    )
  }

  // Purchase button with appropriate messaging
  return (
    <Button
      onClick={onPurchaseAction}
      disabled={!canPurchase || isProcessing}
      className="w-full"
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : needsApproval ? (
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
 * Usage Examples and Integration Patterns
 * 
 * // Basic usage in content discovery
 * <ContentPurchaseCard
 *   contentId={1n}
 *   userAddress={userAddress}
 *   onPurchaseSuccess={() => {
 *     toast.success('Content purchased successfully!')
 *     router.refresh()
 *   }}
 *   onViewContent={() => {
 *     router.push(`/content/${contentId}`)
 *   }}
 * />
 * 
 * // Compact variant for content lists
 * <ContentPurchaseCard
 *   contentId={contentId}
 *   userAddress={userAddress}
 *   variant="compact"
 * />
 * 
 * // With custom styling
 * <ContentPurchaseCard
 *   contentId={contentId}
 *   userAddress={userAddress}
 *   className="bg-gradient-to-r from-blue-50 to-purple-50"
 * />
 */
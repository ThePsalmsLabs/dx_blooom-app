/**
 * UnifiedPurchaseFlow Component - Phase 2 Component System Convergence
 * File: src/components/purchase/UnifiedPurchaseFlow.tsx
 * 
 * This component unifies the web app and mini app purchase experiences into a single
 * adaptive system that provides consistent functionality while optimizing for each context.
 * It replaces both ContentPurchaseCard and MiniAppPurchaseButton with intelligent
 * contextual adaptation and advanced features like batch transactions.
 * 
 * Key Features:
 * - Context-aware purchase flows (web vs miniapp)
 * - EIP-5792 batch transactions for mini app contexts
 * - Multi-token payment support (USDC, ETH, custom tokens)
 * - Commerce Protocol integration for advanced payment flows
 * - Social features integration with Farcaster context
 * - Comprehensive transaction state management and error handling
 * - Real-time price updates and balance checking
 * - Progressive enhancement with graceful feature degradation
 * - Unified design tokens for consistent styling across contexts
 * 
 * Architecture Integration:
 * - Uses existing useUnifiedContentPurchaseFlow and useMiniAppPurchaseFlow hooks
 * - Integrates with existing contract addresses and ABI configurations
 * - Follows established shadcn/ui component patterns and styling conventions
 * - Uses unified design tokens for context-aware spacing and sizing
 * - Maintains compatibility with existing routing and transaction systems
 * - Preserves all current functionality while providing unified experience
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import {
  ShoppingCart,
  CreditCard,
  Zap,
  Eye,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  RefreshCw,
  Share2,
  Users,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Info,
  ExternalLink,
  ArrowRight,
  Wallet
} from 'lucide-react'

// Import shadcn/ui components following existing patterns
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// Removed: Separator import; not used and module not present

// Import existing business logic hooks and types
import {
  useUnifiedContentPurchaseFlow,
  PaymentMethod,
  type PaymentExecutionState,
  type UnifiedPurchaseFlowResult,
  type ContentPurchaseFlowStep
} from '@/hooks/business/workflows'
import {
  useMiniAppPurchaseFlow,
  type MiniAppPurchaseFlowResult
} from '@/hooks/business/miniapp-commerce'
import {
  useContentById,
  useHasContentAccess
} from '@/hooks/contracts/core'

// Import utilities and types
import { cn, formatCurrency, formatTokenBalance, formatAddress } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import type { Address } from 'viem'

// ================================================
// TYPE DEFINITIONS
// ================================================

/**
 * Context Types for Adaptive Behavior
 */
type PurchaseContext = 'web' | 'miniapp'
type FlowVariant = 'full' | 'compact' | 'minimal' | 'inline'
type TransactionType = 'standard' | 'batch' | 'commerce-protocol'

/**
 * Component Configuration Interface
 */
interface UnifiedPurchaseFlowProps {
  /** Content ID to purchase */
  contentId: bigint
  /** Current application context */
  context?: PurchaseContext
  /** Visual variant for different layouts */
  variant?: FlowVariant
  /** User address override */
  userAddress?: Address
  /** Custom class name for styling */
  className?: string
  /** Whether to show detailed transaction information */
  showTransactionDetails?: boolean
  /** Whether to enable social features (mini app context) */
  enableSocialFeatures?: boolean
  /** Whether to show creator information */
  showCreatorInfo?: boolean
  /** Whether to auto-close on successful purchase */
  autoClose?: boolean
  /** Callback when purchase is completed successfully */
  onPurchaseSuccess?: (contentId: bigint, transactionHash: string) => void
  /** Callback when content is accessed after purchase */
  onContentAccess?: (contentId: bigint) => void
  /** Callback when social sharing is triggered */
  onSocialShare?: (contentId: bigint, contentTitle: string) => void
  /** Callback when purchase is cancelled */
  onCancel?: () => void
  /** Custom empty state content */
  customEmptyContent?: React.ReactNode
  /** Whether to force a specific payment method */
  forcedPaymentMethod?: PaymentMethod
}

/**
 * Purchase Flow State Interface
 */
interface PurchaseFlowState {
  selectedPaymentMethod: PaymentMethod
  showPaymentOptions: boolean
  showTransactionModal: boolean
  showSocialShareModal: boolean
  lastTransactionHash?: string
  socialSharePending: boolean
  retryCount: number
}

/**
 * Transaction Progress State
 */
interface TransactionProgressState {
  phase: PaymentExecutionState['phase']
  progress: number
  message: string
  canRetry: boolean
  estimatedTimeRemaining?: number
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Determines optimal configuration based on context
 */
function getContextConfig(context: PurchaseContext, variant: FlowVariant) {
  const baseConfigs = {
    web: {
      showAdvancedOptions: true,
      showMultiTokenOptions: true,
      enableCommerceProtocol: true,
      defaultTransactionType: 'commerce-protocol' as TransactionType,
      showDetailedProgress: true,
      socialFeatures: false
    },
    miniapp: {
      showAdvancedOptions: false,
      showMultiTokenOptions: true,
      enableCommerceProtocol: true,
      defaultTransactionType: 'batch' as TransactionType,
      showDetailedProgress: false,
      socialFeatures: true
    }
  }

  const variantAdjustments = {
    full: { showAdvancedOptions: true, showDetailedProgress: true },
    compact: { showAdvancedOptions: false, showDetailedProgress: true },
    minimal: { showAdvancedOptions: false, showDetailedProgress: false },
    inline: { showAdvancedOptions: false, showDetailedProgress: false }
  }

  return {
    ...baseConfigs[context],
    ...variantAdjustments[variant]
  }
}

/**
 * Gets payment method configuration
 */
function getPaymentMethodConfig(method: PaymentMethod) {
  switch (method) {
    case PaymentMethod.ETH:
      return {
        name: 'ETH',
        description: 'Ethereum - Native network currency',
        icon: Zap,
        estimatedTime: '~45 seconds',
        gasEstimate: 'Medium' as const,
        color: 'bg-purple-500',
        recommended: false
      }
    case PaymentMethod.WETH:
      return {
        name: 'WETH',
        description: 'Wrapped ETH - ERC-20 compatible',
        icon: Wallet,
        estimatedTime: '~30 seconds',
        gasEstimate: 'Low' as const,
        color: 'bg-blue-500',
        recommended: false
      }
    case PaymentMethod.USDC:
    default:
      return {
        name: 'USDC',
        description: 'USD Coin - Stable, reliable payments',
        icon: DollarSign,
        estimatedTime: '~30 seconds',
        gasEstimate: 'Low' as const,
        color: 'bg-green-500',
        recommended: true
      }
  }
}

/**
 * Calculates transaction progress percentage
 */
function calculateProgress(phase: PaymentExecutionState['phase']): number {
  const progressMap = {
    idle: 0,
    calculating: 10,
    approving: 30,
    creating_intent: 50,
    waiting_signature: 60,
    executing: 80,
    confirming: 90,
    completed: 100,
    error: 0
  }
  return progressMap[phase] || 0
}

// ================================================
// MAIN COMPONENT
// ================================================

/**
 * UnifiedPurchaseFlow Component
 * 
 * The main component that provides unified purchase flows across contexts.
 * Uses intelligent adaptation to provide the optimal experience for each context
 * while maintaining consistent functionality and transaction patterns.
 */
export function UnifiedPurchaseFlow({
  contentId,
  context = 'web',
  variant = 'full',
  userAddress,
  className,
  showTransactionDetails = true,
  enableSocialFeatures,
  showCreatorInfo = true,
  autoClose = false,
  onPurchaseSuccess,
  onContentAccess,
  onSocialShare,
  onCancel,
  customEmptyContent,
  forcedPaymentMethod
}: UnifiedPurchaseFlowProps) {
  const router = useRouter()
  const { address: connectedAddress, isConnected } = useAccount()
  
  // Resolve user address
  const effectiveUserAddress = userAddress || connectedAddress
  
  // Get context-aware configuration
  const config = useMemo(() => getContextConfig(context, variant), [context, variant])
  
  // Resolve final social features setting
  const finalEnableSocialFeatures = enableSocialFeatures ?? config.socialFeatures
  
  // ===== CONTENT AND ACCESS DATA =====
  
  const content = useContentById(contentId)
  const hasAccess = useHasContentAccess(effectiveUserAddress, contentId)
  
  // ===== PURCHASE FLOW HOOKS =====
  
  // Base purchase flow for web contexts or fallback
  const basePurchaseFlow = useUnifiedContentPurchaseFlow(contentId, effectiveUserAddress, {
    enabledMethods: forcedPaymentMethod ? [forcedPaymentMethod] : undefined,
    defaultMethod: forcedPaymentMethod || PaymentMethod.USDC
  })
  
  // Enhanced mini app purchase flow for social contexts
  const miniAppPurchaseFlow = useMiniAppPurchaseFlow(contentId, effectiveUserAddress)
  
  // Select appropriate flow based on context
  const purchaseFlow = context === 'miniapp' ? miniAppPurchaseFlow : basePurchaseFlow
  
  // ===== STATE MANAGEMENT =====
  
  const [flowState, setFlowState] = useState<PurchaseFlowState>({
    selectedPaymentMethod: forcedPaymentMethod || PaymentMethod.USDC,
    showPaymentOptions: false,
    showTransactionModal: false,
    showSocialShareModal: false,
    socialSharePending: false,
    retryCount: 0
  })
  
  const [transactionProgress, setTransactionProgress] = useState<TransactionProgressState>({
    phase: 'idle',
    progress: 0,
    message: 'Ready to purchase',
    canRetry: false
  })
  
  // ===== EFFECTS =====
  
  // Update transaction progress based on purchase flow state
  useEffect(() => {
    if ('executionState' in purchaseFlow && purchaseFlow.executionState) {
      const { phase, progress, message, canRetry } = purchaseFlow.executionState
      setTransactionProgress({
        phase,
        progress: progress || calculateProgress(phase),
        message,
        canRetry
      })
    }
  }, [purchaseFlow])
  
  // Handle successful purchases
  useEffect(() => {
    if (hasAccess.data && flowState.lastTransactionHash) {
      // Purchase was successful
      if (onPurchaseSuccess) {
        onPurchaseSuccess(contentId, flowState.lastTransactionHash)
      }
      
      // Show social sharing for mini app context
      if (finalEnableSocialFeatures && content.data?.title) {
        setFlowState(prev => ({ ...prev, showSocialShareModal: true }))
      }
      
      // Auto-close if enabled
      if (autoClose) {
        setTimeout(() => {
          onCancel?.()
        }, 2000)
      }
    }
  }, [hasAccess.data, flowState.lastTransactionHash, contentId, onPurchaseSuccess, finalEnableSocialFeatures, content.data?.title, autoClose, onCancel])
  
  // ===== EVENT HANDLERS =====
  
  const handlePaymentMethodChange = useCallback((method: PaymentMethod) => {
    setFlowState(prev => ({ ...prev, selectedPaymentMethod: method }))
    if ('setPaymentMethod' in purchaseFlow) {
      purchaseFlow.setPaymentMethod(method)
    }
  }, [purchaseFlow])
  
  const handlePurchaseAction = useCallback(async () => {
    try {
      setFlowState(prev => ({ ...prev, showTransactionModal: showTransactionDetails }))
      
      // Use appropriate purchase method based on context and capabilities
      if (context === 'miniapp' && 'purchaseWithBatch' in purchaseFlow && purchaseFlow.canUseBatchTransaction) {
        await purchaseFlow.purchaseWithBatch()
      } else if ('purchase' in purchaseFlow) {
        await purchaseFlow.purchase()
      }
      
      // Track transaction hash for success handling
      if ('executionState' in purchaseFlow && purchaseFlow.executionState?.transactionHash) {
        setFlowState(prev => ({ 
          ...prev, 
          lastTransactionHash: purchaseFlow.executionState.transactionHash || undefined
        }))
      }
      
    } catch (error) {
      console.error('Purchase failed:', error)
      setFlowState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }))
    }
  }, [context, purchaseFlow, showTransactionDetails])
  
  const handleRetryPurchase = useCallback(async () => {
    if ('reset' in purchaseFlow) {
      purchaseFlow.reset()
    }
    setTransactionProgress({
      phase: 'idle',
      progress: 0,
      message: 'Ready to purchase',
      canRetry: false
    })
    await handlePurchaseAction()
  }, [purchaseFlow, handlePurchaseAction])
  
  const handleContentAccess = useCallback(() => {
    if (onContentAccess) {
      onContentAccess(contentId)
    } else {
      router.push(`/content/${contentId}`)
    }
  }, [onContentAccess, contentId, router])
  
  const handleSocialShare = useCallback(async () => {
    if (!content.data?.title || !onSocialShare) return
    
    setFlowState(prev => ({ ...prev, socialSharePending: true }))
    try {
      await onSocialShare(contentId, content.data.title)
      setFlowState(prev => ({ ...prev, showSocialShareModal: false, socialSharePending: false }))
    } catch (error) {
      console.error('Social sharing failed:', error)
      setFlowState(prev => ({ ...prev, socialSharePending: false }))
    }
  }, [content.data?.title, onSocialShare, contentId])
  
  // ===== RENDER HELPERS =====
  
  /**
   * Renders loading state
   */
  const renderLoadingState = () => (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="space-content-padding">
        <div className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  )
  
  /**
   * Renders error state
   */
  const renderErrorState = (error: Error) => (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="space-content-padding">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to load purchase information. Please try again.'}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if ('refetchData' in purchaseFlow) {
                purchaseFlow.refetchData()
              }
            }}
            className="button-adaptive"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
  
  /**
   * Renders payment method selector
   */
  const renderPaymentMethodSelector = () => {
    if (!config.showMultiTokenOptions || forcedPaymentMethod) return null
    
    const availableMethods: PaymentMethod[] = 'availableMethods' in purchaseFlow 
      ? (purchaseFlow.availableMethods as ReadonlyArray<{ id: PaymentMethod }>).map((m) => m.id as PaymentMethod)
      : [PaymentMethod.USDC, PaymentMethod.ETH]
    
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">Payment Method</Label>
          <Select
          value={String(flowState.selectedPaymentMethod)}
          onValueChange={(value) => handlePaymentMethodChange((value as unknown) as PaymentMethod)}
        >
          <SelectTrigger className="input-adaptive">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMethods.map((method: PaymentMethod) => {
              const methodConfig = getPaymentMethodConfig(method)
              const Icon = methodConfig.icon
              
              return (
                <SelectItem key={method} value={String(method)}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{methodConfig.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {methodConfig.description}
                      </div>
                    </div>
                    {methodConfig.recommended && (
                      <Badge variant="secondary" className="ml-auto">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    )
  }
  
  /**
   * Renders purchase button
   */
  const renderPurchaseButton = () => {
    const isLoading = transactionProgress.phase !== 'idle' && transactionProgress.phase !== 'completed' && transactionProgress.phase !== 'error'
    const canPurchase = 'canPurchase' in purchaseFlow ? purchaseFlow.canPurchase : false
    const needsApproval = 'needsApproval' in purchaseFlow ? purchaseFlow.needsApproval : false
    
    // Determine button text and icon
    let buttonText = 'Purchase Content'
    let ButtonIcon = ShoppingCart
    let buttonVariant: 'default' | 'secondary' = 'default'
    
    if (isLoading) {
      buttonText = transactionProgress.message
      ButtonIcon = Loader2
    } else if (needsApproval) {
      buttonText = 'Approve & Purchase'
      ButtonIcon = CreditCard
    } else if (context === 'miniapp' && 'canUseBatchTransaction' in purchaseFlow && purchaseFlow.canUseBatchTransaction) {
      buttonText = 'Purchase with One Click'
      ButtonIcon = Sparkles
    }
    
    // Mini app enhanced button with batch transaction indicator
    if (context === 'miniapp' && 'canUseBatchTransaction' in purchaseFlow && purchaseFlow.canUseBatchTransaction) {
      return (
        <div className="space-y-2">
          <Button
            onClick={handlePurchaseAction}
            disabled={!canPurchase || isLoading}
            className="w-full button-adaptive bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 touch-target-optimized"
          >
            <ButtonIcon className={cn(
              "h-4 w-4 mr-2",
              isLoading && "animate-spin"
            )} />
            {buttonText}
            {'estimatedGasSavings' in purchaseFlow && purchaseFlow.estimatedGasSavings > 0 && (
              <Badge variant="secondary" className="ml-2">
                {purchaseFlow.estimatedGasSavings}% savings
              </Badge>
            )}
          </Button>
          
          {config.showAdvancedOptions && (
            <div className="text-xs text-center text-muted-foreground">
              Batch transaction combines approval + purchase
            </div>
          )}
        </div>
      )
    }
    
    // Standard button for web context
    return (
      <Button
        onClick={handlePurchaseAction}
        disabled={!canPurchase || isLoading}
        variant={buttonVariant}
        className="w-full button-adaptive touch-target-optimized"
      >
        <ButtonIcon className={cn(
          "h-4 w-4 mr-2",
          isLoading && "animate-spin"
        )} />
        {buttonText}
      </Button>
    )
  }
  
  /**
   * Renders access granted state
   */
  const renderAccessGrantedState = () => (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="space-content-padding text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          
          <div>
            <h3 className="font-semibold text-adaptive-base mb-2">
              Content Unlocked!
            </h3>
            <p className="text-sm text-muted-foreground">
              You now have access to this content.
            </p>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button onClick={handleContentAccess} className="button-adaptive">
              <Eye className="h-4 w-4 mr-2" />
              View Content
            </Button>
            
            {finalEnableSocialFeatures && (
              <Button
                variant="outline"
                onClick={() => setFlowState(prev => ({ ...prev, showSocialShareModal: true }))}
                className="button-adaptive"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
  
  /**
   * Renders main purchase interface
   */
  const renderPurchaseInterface = () => {
    if (!content.data) return null
    
    const contentData = content.data
    const price = formatCurrency(contentData.payPerViewPrice, 6, 'USDC')
    
    return (
      <Card className={cn('overflow-hidden', className)}>
        {/* Content Preview (for full variant) */}
        {variant === 'full' && (
          <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="absolute top-2 right-2">
              <Badge variant="secondary">{price}</Badge>
            </div>
          </div>
        )}
        
        <CardContent className="space-content-padding">
          {/* Content Information */}
          <div className="space-y-4">
            {(variant === 'compact' || variant === 'minimal') && (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-adaptive-base line-clamp-1">
                    {contentData.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{price}</p>
                </div>
                <Lock className="h-5 w-5 text-muted-foreground ml-2" />
              </div>
            )}
            
            {variant === 'full' && (
              <div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {contentData.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {contentData.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">{price}</span>
                  <Badge variant="outline">Premium Content</Badge>
                </div>
              </div>
            )}
            
            {/* Payment Method Selector */}
            {variant === 'full' && renderPaymentMethodSelector()}
            
            {/* Balance Information */}
            {config.showAdvancedOptions && 'selectedToken' in purchaseFlow && purchaseFlow.selectedToken && (
              <div className="text-xs text-muted-foreground">
                Your balance: {formatTokenBalance(
                  purchaseFlow.selectedToken.balance || BigInt(0),
                  purchaseFlow.selectedToken.decimals,
                  purchaseFlow.selectedToken.symbol
                )}
              </div>
            )}
            
            {/* Purchase Button */}
            {renderPurchaseButton()}
            
            {/* Error Display */}
            {transactionProgress.phase === 'error' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Transaction failed. Please try again.
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleRetryPurchase}
                    className="ml-2 p-0 h-auto"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  /**
   * Renders transaction progress modal
   */
  const renderTransactionModal = () => (
    <Dialog open={flowState.showTransactionModal} onOpenChange={(open) => 
      setFlowState(prev => ({ ...prev, showTransactionModal: open }))
    }>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Processing Purchase</DialogTitle>
          <DialogDescription>
            Please wait while your transaction is processed on the blockchain.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{transactionProgress.progress}%</span>
            </div>
            <Progress value={transactionProgress.progress} className="w-full" />
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium mb-1">
              {transactionProgress.message}
            </div>
            {transactionProgress.estimatedTimeRemaining && (
              <div className="text-xs text-muted-foreground">
                Estimated time: {transactionProgress.estimatedTimeRemaining}s
              </div>
            )}
          </div>
          
          {transactionProgress.phase === 'completed' && (
            <div className="text-center text-green-600">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <div className="font-medium">Purchase Successful!</div>
            </div>
          )}
        </div>
        
        {(transactionProgress.phase === 'completed' || transactionProgress.phase === 'error') && (
          <DialogFooter>
            <Button onClick={() => setFlowState(prev => ({ ...prev, showTransactionModal: false }))}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
  
  /**
   * Renders social share modal
   */
  const renderSocialShareModal = () => (
    <Dialog open={flowState.showSocialShareModal} onOpenChange={(open) => 
      setFlowState(prev => ({ ...prev, showSocialShareModal: open }))
    }>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Purchase</DialogTitle>
          <DialogDescription>
            Let your friends know about this amazing content!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Great choice!</h3>
            <p className="text-sm text-muted-foreground">
              Share "{content.data?.title}" with your Farcaster network
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setFlowState(prev => ({ ...prev, showSocialShareModal: false }))}
          >
            Skip
          </Button>
          <Button
            onClick={handleSocialShare}
            disabled={flowState.socialSharePending}
          >
            {flowState.socialSharePending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Share Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
  
  // ===== MAIN RENDER LOGIC =====
  
  // Loading states
  if (content.isLoading || hasAccess.isLoading || (!isConnected && !userAddress)) {
    return renderLoadingState()
  }
  
  // Error states
  if (content.isError) {
    return renderErrorState(content.error || new Error('Failed to load content'))
  }
  
  if (!content.data) {
    return renderErrorState(new Error('Content not found'))
  }
  
  // Access already granted
  if (hasAccess.data) {
    return renderAccessGrantedState()
  }
  
  // Main purchase interface
  return (
    <>
      {renderPurchaseInterface()}
      {renderTransactionModal()}
      {renderSocialShareModal()}
    </>
  )
}

// ================================================
// ADDITIONAL COMPONENTS
// ================================================

/**
 * Quick Purchase Button Component
 * 
 * A simplified button-only variant for inline usage
 */
interface QuickPurchaseButtonProps {
  contentId: bigint
  context?: PurchaseContext
  userAddress?: Address
  className?: string
  onPurchaseSuccess?: (contentId: bigint, transactionHash: string) => void
}

function QuickPurchaseButtonInternal({
  contentId,
  context = 'web',
  userAddress,
  className,
  onPurchaseSuccess
}: QuickPurchaseButtonProps) {
  return (
    <UnifiedPurchaseFlow
      contentId={contentId}
      context={context}
      variant="minimal"
      userAddress={userAddress}
      className={className}
      showTransactionDetails={false}
      showCreatorInfo={false}
      autoClose={true}
      onPurchaseSuccess={onPurchaseSuccess}
    />
  )
}

/**
 * Purchase Flow Card Component
 * 
 * A full-featured card variant for dedicated purchase pages
 */
interface PurchaseFlowCardProps {
  contentId: bigint
  context?: PurchaseContext
  userAddress?: Address
  className?: string
  onPurchaseSuccess?: (contentId: bigint, transactionHash: string) => void
  onContentAccess?: (contentId: bigint) => void
  onSocialShare?: (contentId: bigint, contentTitle: string) => void
}

function PurchaseFlowCardInternal({
  contentId,
  context = 'web',
  userAddress,
  className,
  onPurchaseSuccess,
  onContentAccess,
  onSocialShare
}: PurchaseFlowCardProps) {
  return (
    <UnifiedPurchaseFlow
      contentId={contentId}
      context={context}
      variant="full"
      userAddress={userAddress}
      className={className}
      showTransactionDetails={true}
      showCreatorInfo={true}
      enableSocialFeatures={context === 'miniapp'}
      onPurchaseSuccess={onPurchaseSuccess}
      onContentAccess={onContentAccess}
      onSocialShare={onSocialShare}
    />
  )
}

// ================================================
// EXPORT
// ================================================

export default UnifiedPurchaseFlow

// Export all components and utilities
export {
  QuickPurchaseButtonInternal as QuickPurchaseButton,
  PurchaseFlowCardInternal as PurchaseFlowCard,
  type PurchaseContext,
  type FlowVariant,
  type TransactionType,
  type UnifiedPurchaseFlowProps
}
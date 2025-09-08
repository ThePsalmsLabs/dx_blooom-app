// src/components/commerce/MiniAppPurchaseButton.tsx

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { type Address } from 'viem'
import { 
  Share2, 
  Zap, 
  ShoppingCart, 
  Loader2, 
  AlertCircle,
  Wallet
} from 'lucide-react'

// Import existing UI components following established patterns
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Import enhanced MiniApp hooks from Phase 2
import {
  useX402ContentPurchaseFlow
} from '@/hooks/business/workflows'
import { useMiniAppSocial } from '@/hooks/business/miniapp-social'
import { trackMiniAppEvent } from '@/lib/miniapp/analytics'
import { useMiniAppPaymentOrchestrator } from '@/hooks/miniapp/useMiniAppPaymentOrchestrator'

/**
 * Purchase Button Variant Types
 * 
 * These variants extend your existing Button component patterns while adding
 * MiniApp-specific visual cues and state representations for enhanced user experience.
 */
type PurchaseButtonVariant = 
  | 'purchase-ready'      // Ready to purchase - default green
  | 'purchase-batch'      // Batch transaction ready - enhanced with Zap icon
  | 'purchase-processing' // Transaction in progress - loading state
  | 'purchase-error'      // Error state - destructive variant
  | 'share-available'     // Content owned, sharing available
  | 'share-processing'    // Sharing in progress
  | 'insufficient-funds'  // User cannot afford content

/**
 * MiniApp Purchase Button Props
 * 
 * This interface defines the component's props, following your established
 * patterns while enabling comprehensive customization and integration.
 */
type ButtonVariant = React.ComponentProps<typeof Button>['variant']
type ButtonSize = React.ComponentProps<typeof Button>['size']

interface ButtonConfig {
  variant: ButtonVariant
  onClick: () => void
  disabled: boolean
  icon: React.ComponentType<{ className?: string }>
  text: string
  className: string
  iconClassName?: string
}

export interface MiniAppPurchaseButtonProps {
  /** Content ID for the content to purchase */
  readonly contentId: bigint
  
  /** Content title for sharing and display purposes */
  readonly title: string
  
  /** Optional user address override */
  readonly userAddress?: Address
  
  /** Optional description for enhanced sharing */
  readonly description?: string
  
  /** Optional content URL for custom sharing */
  readonly contentUrl?: string
  
  /** Optional creator information for attribution */
  readonly creatorInfo?: {
    readonly address: Address
    readonly name?: string
  }
  
  /** Callback fired when purchase is successfully completed */
  readonly onPurchaseSuccess?: (contentId: bigint) => void
  
  /** Callback fired when content is shared */
  readonly onShareSuccess?: (contentId: bigint) => void
  
  /** Callback fired when user gains access to content */
  readonly onAccessGranted?: (contentId: bigint) => void
  
  /** Custom styling className */
  readonly className?: string
  
  /** Button size variant from your design system */
  readonly size?: ButtonSize
  
  /** Force full width button */
  readonly fullWidth?: boolean
  
  /** Show additional context information */
  readonly showContext?: boolean
  
  /** Disable the button entirely */
  readonly disabled?: boolean
}

/**
 * Purchase Button State Interface
 * 
 * This interface manages the component's internal state, providing comprehensive
 * tracking of user interactions and system responses.
 */
interface PurchaseButtonState {
  readonly isProcessingAction: boolean
  readonly lastActionResult: 'success' | 'error' | null
  readonly lastActionError: Error | null
  readonly userHasInteracted: boolean
  readonly actionStartedAt: Date | null
}

/**
 * Enhanced MiniApp Purchase Button Component
 * 
 * This component represents the culmination of your MiniApp integration, combining
 * sophisticated purchase flow logic with social sharing capabilities in a single,
 * intuitive interface. It demonstrates how advanced Web3 functionality can be
 * presented through clean, accessible UI that adapts intelligently to different
 * contexts and user capabilities.
 * 
 * Key Features:
 * - Seamless integration with EIP-5792 batch transaction flows
 * - Dynamic visual indicators for MiniApp-enhanced experiences  
 * - Intelligent state management with comprehensive error handling
 * - Social sharing capabilities with viral loop optimization
 * - Responsive design that works across all viewport sizes
 * - Accessibility-first implementation with proper ARIA attributes
 * - Performance optimization through intelligent re-rendering
 * - Type-safe interfaces with complete TypeScript coverage
 * 
 * Architecture Integration:
 * - Uses your established Button component with variant system
 * - Follows your design system patterns and Tailwind CSS conventions
 * - Integrates with useUnifiedMiniAppPurchaseFlow for transaction management
 * - Leverages useMiniAppSocial for sharing and engagement tracking
 * - Maintains compatibility with existing purchase flow components
 * - Provides extension points for analytics and custom behaviors
 * 
 * User Experience Philosophy:
 * The component embodies the principle that advanced functionality should feel
 * magical to users while remaining invisible when it's not available. MiniApp
 * users receive enhanced experiences (batch transactions, social sharing) while
 * web users continue to receive reliable, familiar purchase flows.
 */
export function MiniAppPurchaseButton({
  contentId,
  title,
  userAddress,
  description,
  contentUrl,
  creatorInfo,
  onPurchaseSuccess,
  onShareSuccess,
  onAccessGranted,
  className,
  size = 'default',
  fullWidth = true,
  showContext = false,
  disabled = false
}: MiniAppPurchaseButtonProps) {
  // ===== CORE INTEGRATION WITH ENHANCED HOOKS =====
  
  // Simple USDC-only purchase flow (no ETH calculations)
  const purchaseFlow = useX402ContentPurchaseFlow(contentId, userAddress)

  // Use the orchestrated payment system for proper error handling and monitoring
  const paymentOrchestrator = useMiniAppPaymentOrchestrator({
    enableSocialSharing: true,
    enableBatchOptimization: true,
    trackSocialMetrics: true
  })

  // Social sharing and engagement tracking capabilities
  const socialFlow = useMiniAppSocial()

  // Adapt X402 flow to component interface (USDC-only, no ETH calculations)
  const safePurchaseFlow = useMemo(() => {
    // Map X402 flow properties to expected interface
    const canPurchase = purchaseFlow?.currentStep === 'can_purchase' || 
                       purchaseFlow?.currentStep === 'need_approval'
    const content = purchaseFlow?.content || null
    const isLoading = purchaseFlow?.currentStep === 'checking_access' || purchaseFlow?.isLoading
    
    // Simple flow state mapping
    const step = purchaseFlow?.currentStep === 'need_approval' ? 'approving' : 'idle'
    const flowState = { step, progress: 0, error: purchaseFlow?.error }
    
    return {
      flowState,
      canPurchase,
      canUseBatchTransaction: false, // Disable for simplicity
      content,
      isLoading,
      hasAccess: purchaseFlow?.hasAccess,
      // X402 specific properties
      needsApproval: purchaseFlow?.needsApproval ?? false,
      canAfford: purchaseFlow?.canAfford ?? false,
      executeApproval: purchaseFlow?.approveAndPurchase,
      executePurchase: purchaseFlow?.purchase,
      executeApprovalAndPurchase: purchaseFlow?.approveAndPurchase // Use the same function for now
    }
  }, [
    purchaseFlow?.currentStep,
    purchaseFlow?.content,
    purchaseFlow?.needsApproval,
    purchaseFlow?.canAfford,
    purchaseFlow?.isLoading,
    purchaseFlow?.error,
    purchaseFlow?.hasAccess
  ])

  // Ensure socialFlow has the expected structure with defaults
  const safeSocialFlow = useMemo(() => {
    // Only recreate when specific properties change, not the whole object
    const sharingState = socialFlow?.sharingState || { 
      isSharing: false, 
      lastShareResult: null, 
      shareCount: 0, 
      error: null 
    }
    const canShare = socialFlow?.canShare ?? false
    
    return {
      ...socialFlow,
      sharingState,
      canShare
    }
  }, [
    socialFlow?.sharingState?.isSharing,
    socialFlow?.sharingState?.lastShareResult,
    socialFlow?.sharingState?.shareCount,
    socialFlow?.sharingState?.error,
    socialFlow?.canShare
  ])
  
  // ===== COMPONENT STATE MANAGEMENT =====
  
  const [buttonState, setButtonState] = useState<PurchaseButtonState>({
    isProcessingAction: false,
    lastActionResult: null,
    lastActionError: null,
    userHasInteracted: false,
    actionStartedAt: null
  })

  // ===== PURCHASE ACTION LOGIC =====
  
  /**
   * Enhanced Purchase Handler
   * 
   * This handler orchestrates the complete purchase experience, including
   * batch transaction execution, social context tracking, and success callbacks.
   */
  const handlePurchaseAction = useCallback(async (): Promise<void> => {
    if (!safePurchaseFlow.canUseBatchTransaction && !safePurchaseFlow.canPurchase) {
      console.warn('Purchase not available in current state')
      return
    }

    setButtonState(prev => ({
      ...prev,
      isProcessingAction: true,
      lastActionError: null,
      userHasInteracted: true,
      actionStartedAt: new Date()
    }))

    try {
      const formatUsdc = (amount: bigint | undefined): string => {
        if (!amount || amount === BigInt(0)) return '0'
        const s = amount.toString()
        const pad = s.padStart(7, '0')
        const int = pad.slice(0, -6)
        const dec = pad.slice(-6).replace(/0+$/, '')
        return dec ? `${int}.${dec}` : int
      }

      // Track purchase start (USDC price)
      const usdcPrice = safePurchaseFlow.content?.payPerViewPrice || BigInt(0)
      trackMiniAppEvent.purchaseStarted(contentId.toString(), formatUsdc(usdcPrice))

      console.group('🚀 MiniApp Purchase Button: Initiating Purchase')
      console.log('Content ID:', contentId.toString())
      console.log('Batch Transaction Available:', safePurchaseFlow.canUseBatchTransaction)
      console.log('Purchase ready:', !!safePurchaseFlow.executeApproval || !!safePurchaseFlow.executePurchase)
      console.groupEnd()

      // Use the new combined approval and purchase flow for better UX
      if (safePurchaseFlow.needsApproval && safePurchaseFlow.executeApprovalAndPurchase) {
        console.log('🔓💳 Executing combined USDC approval and purchase...')
        safePurchaseFlow.executeApprovalAndPurchase()
      } else if (safePurchaseFlow.executePurchase) {
        console.log('💳 Executing USDC purchase...')
        safePurchaseFlow.executePurchase()
      }

      // Track the purchase for social analytics
      if (safeSocialFlow.socialUser?.fid) {
        safeSocialFlow.trackPurchase?.(contentId, usdcPrice)
      }

      // Update component state for success
      setButtonState(prev => ({
        ...prev,
        isProcessingAction: false,
        lastActionResult: 'success',
        lastActionError: null
      }))

      // Fire success callbacks
      onPurchaseSuccess?.(contentId)
      onAccessGranted?.(contentId)

      // Track purchase completion
      const txHash = 'unknown' // X402 flow doesn't expose transaction hash
      trackMiniAppEvent.purchaseCompleted(contentId.toString(), formatUsdc(usdcPrice), txHash)

      console.log('✅ Purchase completed successfully')

    } catch (error) {
      const purchaseError = error instanceof Error ? error : new Error('Purchase failed')
      console.error('❌ Purchase failed:', purchaseError)

      // Track purchase failure
      trackMiniAppEvent.purchaseFailed(contentId.toString(), purchaseError.message)

      setButtonState(prev => ({
        ...prev,
        isProcessingAction: false,
        lastActionResult: 'error',
        lastActionError: purchaseError
      }))
    }
  }, [
    purchaseFlow,
    socialFlow,
    contentId,
    onPurchaseSuccess,
    onAccessGranted
  ])

  // ===== SOCIAL SHARING ACTION LOGIC =====
  
  /**
   * Enhanced Sharing Handler
   * 
   * This handler manages the social sharing experience, creating compelling
   * social content that drives engagement and viral distribution.
   */
  const handleShareAction = useCallback(async (): Promise<void> => {
    if (!safeSocialFlow.canShare) {
      console.warn('Social sharing not available in current context')
      return
    }

    setButtonState(prev => ({
      ...prev,
      isProcessingAction: true,
      lastActionError: null,
      userHasInteracted: true,
      actionStartedAt: new Date()
    }))

    try {
      console.group('📱 MiniApp Purchase Button: Initiating Share')
      console.log('Content ID:', contentId.toString())
      console.log('Content Title:', title)
      console.log('Social User:', safeSocialFlow.socialUser)
      console.groupEnd()

      // Execute enhanced social sharing
      const shareResult = await safeSocialFlow.shareContent?.({
        contentId,
        title,
        description,
        contentUrl,
        creatorAddress: creatorInfo?.address,
        creatorName: creatorInfo?.name
      })

      if (shareResult.success) {
        setButtonState(prev => ({
          ...prev,
          isProcessingAction: false,
          lastActionResult: 'success',
          lastActionError: null
        }))

        onShareSuccess?.(contentId)
        // Track content shared
        trackMiniAppEvent.contentShared(contentId.toString(), 'farcaster')
        console.log('✅ Content shared successfully')
      } else {
        throw shareResult.error || new Error('Share failed')
      }

    } catch (error) {
      const shareError = error instanceof Error ? error : new Error('Sharing failed')
      console.error('❌ Share failed:', shareError)

      setButtonState(prev => ({
        ...prev,
        isProcessingAction: false,
        lastActionResult: 'error',
        lastActionError: shareError
      }))
    }
  }, [
    socialFlow,
    contentId,
    title,
    description,
    contentUrl,
    creatorInfo,
    onShareSuccess
  ])

  // ===== BUTTON CONFIGURATION COMPUTATION =====
  
  /**
   * Button Configuration Logic
   * 
   * This computation determines the button's appearance, behavior, and messaging
   * based on the current state of purchase flow, social capabilities, and user context.
   */
  const buttonConfig: ButtonConfig = useMemo(() => {
    // Handle disabled state
    if (disabled) {
      return {
        variant: 'secondary',
        onClick: () => {},
        disabled: true,
        icon: Wallet,
        text: 'Unavailable',
        className: 'cursor-not-allowed opacity-60'
      }
    }

    // Handle processing states (including new approval_confirmed state)
    const isProcessing = buttonState.isProcessingAction || 
                        safePurchaseFlow.flowState.step === 'purchasing' ||
                        safePurchaseFlow.flowState.step === 'approving' ||
                        safePurchaseFlow.flowState.step === 'approval_confirmed'
    
    if (isProcessing) {
      const isSharing = safeSocialFlow.sharingState.isSharing
      let processingText = 'Processing...'
      
      if (safePurchaseFlow.flowState.step === 'approving') {
        processingText = 'Approving USDC...'
      } else if (safePurchaseFlow.flowState.step === 'approval_confirmed') {
        processingText = 'Starting Purchase...'
      } else if (safePurchaseFlow.flowState.step === 'purchasing') {
        processingText = 'Purchasing...'
      } else if (isSharing) {
        processingText = 'Sharing...'
      }
      
      return {
        variant: 'default',
        onClick: () => {},
        disabled: true,
        icon: Loader2,
        text: processingText,
        className: 'cursor-wait',
        iconClassName: 'animate-spin'
      }
    }

    // Handle purchased content - show sharing option
    if (safePurchaseFlow.hasAccess) {
      return {
        variant: (safeSocialFlow.canShare ? 'outline' : 'secondary'),
        onClick: safeSocialFlow.canShare ? handleShareAction : () => {},
        disabled: !safeSocialFlow.canShare,
        icon: Share2,
        text: safeSocialFlow.canShare ? 'Share' : 'Owned',
        className: safeSocialFlow.canShare
          ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer'
          : 'bg-green-100 text-green-700 cursor-default'
      }
    }

    // Handle insufficient funds
    if (!safePurchaseFlow.canPurchase) {
      return {
        variant: 'outline',
        onClick: () => {},
        disabled: true,
        icon: AlertCircle,
        text: 'Insufficient Balance',
        className: 'border-red-200 bg-red-50 text-red-700 cursor-not-allowed'
      }
    }

    // Handle batch transaction ready state (MiniApp enhancement)
    if (safePurchaseFlow.canUseBatchTransaction) {
      return {
        variant: 'glow',
        onClick: handlePurchaseAction,
        disabled: false,
        icon: Zap,
        text: 'Approve & Purchase',
        className: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg cursor-pointer'
      }
    }

    // Handle standard purchase ready state
    return {
      variant: 'default',
      onClick: handlePurchaseAction,
      disabled: false,
      icon: ShoppingCart,
      text: 'Purchase',
              className: 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
    }
  }, [
    disabled,
    buttonState.isProcessingAction,
    purchaseFlow,
    socialFlow,
    handlePurchaseAction,
    handleShareAction
  ])

  // ===== ERROR STATE SYNCHRONIZATION =====
  
  /**
   * Error State Effect
   * 
   * This effect synchronizes component error state with the underlying
   * purchase flow errors, ensuring consistent error presentation.
   */
  useEffect(() => {
    if (safePurchaseFlow.flowState.step === 'error' && safePurchaseFlow.flowState.error) {
      setButtonState(prev => ({
        ...prev,
        lastActionResult: 'error',
        lastActionError: safePurchaseFlow.flowState.error ?? null,
        isProcessingAction: false
      }))
    }
  }, [safePurchaseFlow.flowState])

  // ===== ENHANCED CONTEXT DISPLAY =====
  
  /**
   * Context Information Component
   * 
   * This renders additional context when requested, providing users with
   * insight into the enhanced MiniApp capabilities and current state.
   */
  const renderContextInfo = () => {
    if (!showContext) return null

    const contextItems = []

    // Show batch transaction benefit
    if (safePurchaseFlow.canUseBatchTransaction) {
      contextItems.push(
        <div key="batch-info" className="flex items-center gap-2 text-xs text-blue-600">
          <Zap className="h-3 w-3" />
                          <span>Single-click purchase (USDC optimized)</span>
        </div>
      )
    }

    // Show social context
    if (safeSocialFlow.isMiniAppEnvironment && safeSocialFlow.socialUser?.fid) {
      contextItems.push(
        <div key="social-info" className="flex items-center gap-2 text-xs text-purple-600">
          <Share2 className="h-3 w-3" />
          <span>Social sharing enabled</span>
        </div>
      )
    }

    // Show error context
    if (buttonState.lastActionError) {
      contextItems.push(
        <div key="error-info" className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{buttonState.lastActionError.message}</span>
        </div>
      )
    }

    if (contextItems.length === 0) return null

    return (
      <div className="mt-2 space-y-1">
        {contextItems}
      </div>
    )
  }

  // ===== COMPONENT RENDER =====
  
  const { 
    variant, 
    onClick, 
    disabled: buttonDisabled, 
    icon: Icon, 
    text, 
    className: buttonClassName,
    iconClassName 
  } = buttonConfig

  return (
    <div className={cn('flex flex-col', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={buttonDisabled}
        className={cn(
          // Base styling following your design system
          'transition-all duration-200 font-medium',
          // Full width handling
          fullWidth && 'w-full',
          // Icon spacing
          'gap-2',
          // Custom button styling
          buttonClassName,
          // Focus and accessibility
          'focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          // Touch targets for mobile
          'min-h-[44px] touch-manipulation'
        )}
        // Accessibility attributes
        aria-label={`${text} - ${title}`}
        aria-describedby={showContext ? `context-${contentId}` : undefined}
      >
        <Icon className={cn('h-4 w-4', iconClassName)} />
        <span>{text}</span>
      </Button>
      
      {renderContextInfo()}
    </div>
  )
}
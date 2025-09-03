/**
 * Unified Purchase Button - Consistent Across All Environments
 * File: src/components/commerce/UnifiedPurchaseButton.tsx
 *
 * This is the new unified purchase button that works consistently across
 * web and mini app environments. It uses the UnifiedMiniAppProvider for
 * state management and provides a seamless experience.
 */

'use client'

import React, { useCallback, useMemo, useState } from 'react'
import {
  ShoppingCart,
  Zap,
  Share2,
  Loader2,
  AlertCircle,
  Wallet,
  CheckCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'
import { useUnifiedPurchaseFlow } from '@/hooks/unified/UnifiedPurchaseFlow'

// ================================================
// PURCHASE BUTTON CONFIGURATION
// ================================================

interface ButtonConfig {
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  onClick: () => void
  disabled: boolean
  icon: React.ComponentType<{ className?: string }>
  text: string
  className: string
  iconClassName?: string
}

type PurchaseButtonState = 'ready' | 'purchasing' | 'purchased' | 'sharing' | 'error'

// ================================================
// UNIFIED PURCHASE BUTTON COMPONENT
// ================================================

interface UnifiedPurchaseButtonProps {
  /** Content ID for the content to purchase */
  contentId: bigint

  /** Content title for sharing and display purposes */
  title: string

  /** Content price (optional, for display) */
  price?: string

  /** Callback fired when purchase is successfully completed */
  onPurchaseSuccess?: (contentId: bigint) => void

  /** Callback fired when content is shared */
  onShareSuccess?: (contentId: bigint) => void

  /** Custom styling className */
  className?: string

  /** Button size variant */
  size?: 'default' | 'sm' | 'lg'

  /** Force full width button */
  fullWidth?: boolean

  /** Disable the button entirely */
  disabled?: boolean

  /** Show additional context information */
  showContext?: boolean
}

export function UnifiedPurchaseButton({
  contentId,
  title,
  price,
  onPurchaseSuccess,
  onShareSuccess,
  className,
  size = 'default',
  fullWidth = true,
  disabled = false,
  showContext = false
}: UnifiedPurchaseButtonProps) {
  const { state, actions, utils } = useUnifiedMiniApp()

  // Use the unified purchase flow hook
  const purchaseFlow = useUnifiedPurchaseFlow(
    contentId,
    state.userAddress || undefined,
    {
      onPurchaseSuccess: (id) => {
        onPurchaseSuccess?.(id)
      }
    }
  )

  const [buttonState, setButtonState] = useState<PurchaseButtonState>('ready')

  // ================================================
  // PURCHASE LOGIC
  // ================================================

  const handlePurchase = useCallback(async () => {
    if (!state.isConnected) {
      await actions.connectWallet()
      return
    }

    setButtonState('purchasing')

    try {
      await purchaseFlow.purchaseAction()
      setButtonState('purchased')
    } catch (error) {
      console.error('Purchase failed:', error)
      setButtonState('error')
    }
  }, [state.isConnected, actions, purchaseFlow])

  // ================================================
  // SHARING LOGIC
  // ================================================

  const handleShare = useCallback(async () => {
    setButtonState('sharing')

    try {
      await actions.shareContent(contentId, title)
      onShareSuccess?.(contentId)
    } catch (error) {
      console.error('Share failed:', error)
      setButtonState('error')
    } finally {
      setButtonState('purchased') // Return to purchased state
    }
  }, [actions, contentId, title, onShareSuccess])

  // ================================================
  // BUTTON CONFIGURATION LOGIC
  // ================================================

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

    // Handle error state
    if (buttonState === 'error') {
      return {
        variant: 'destructive',
        onClick: () => setButtonState('ready'),
        disabled: false,
        icon: AlertCircle,
        text: 'Try Again',
        className: 'cursor-pointer'
      }
    }

    // Handle purchased content - show sharing option
    if (buttonState === 'purchased' || purchaseFlow.hasAccess) {
      return {
        variant: 'outline',
        onClick: handleShare,
        disabled: !utils.canPerformAction('share'),
        icon: Share2,
        text: 'Share',
        className: cn(
          'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer',
          buttonState === 'sharing' && 'cursor-wait'
        )
      }
    }

    // Handle purchasing state
    if (buttonState === 'purchasing' || purchaseFlow.isProcessing) {
      return {
        variant: 'default',
        onClick: () => {},
        disabled: true,
        icon: Loader2,
        text: 'Processing...',
        className: 'cursor-wait',
        iconClassName: 'animate-spin'
      }
    }

    // Handle sharing state
    if (buttonState === 'sharing') {
      return {
        variant: 'default',
        onClick: () => {},
        disabled: true,
        icon: Loader2,
        text: 'Sharing...',
        className: 'cursor-wait',
        iconClassName: 'animate-spin'
      }
    }

    // Handle wallet not connected
    if (!state.isConnected) {
      return {
        variant: 'default',
        onClick: handlePurchase,
        disabled: false,
        icon: Wallet,
        text: 'Connect Wallet',
        className: 'cursor-pointer'
      }
    }

    // Handle insufficient balance
    if (!purchaseFlow.canAfford) {
      return {
        variant: 'outline',
        onClick: () => {},
        disabled: true,
        icon: AlertCircle,
        text: 'Insufficient Balance',
        className: 'border-red-200 bg-red-50 text-red-700 cursor-not-allowed'
      }
    }

    // Handle batch transaction capability (MiniApp enhancement)
    if (utils.isMiniApp && state.capabilities.wallet.canBatchTransactions) {
      return {
        variant: 'default',
        onClick: handlePurchase,
        disabled: false,
        icon: Zap,
        text: 'Purchase',
        className: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg cursor-pointer'
      }
    }

    // Handle standard purchase ready state
    return {
      variant: 'default',
      onClick: handlePurchase,
      disabled: false,
      icon: ShoppingCart,
      text: 'Purchase',
      className: 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
    }
  }, [
    disabled,
    buttonState,
    state.isConnected,
    state.capabilities.wallet.canBatchTransactions,
    utils,
    purchaseFlow.canAfford,
    purchaseFlow.hasAccess,
    purchaseFlow.isProcessing,
    purchaseFlow.formattedPrice,
    handlePurchase,
    handleShare
  ])

  // ================================================
  // CONTEXT DISPLAY
  // ================================================

  const renderContextInfo = () => {
    if (!showContext) return null

    const contextItems = []

    // Show MiniApp context
    if (utils.isMiniApp) {
      contextItems.push(
        <div key="miniapp-info" className="flex items-center gap-2 text-xs text-blue-600">
          <Zap className="h-3 w-3" />
          <span>MiniApp enhanced experience</span>
        </div>
      )
    }

    // Show batch transaction benefit
    if (state.capabilities.wallet.canBatchTransactions) {
      contextItems.push(
        <div key="batch-info" className="flex items-center gap-2 text-xs text-purple-600">
          <Zap className="h-3 w-3" />
          <span>Single-click purchase available</span>
        </div>
      )
    }

    // Show social context
    if (state.socialContext.isAvailable && state.socialContext.userProfile) {
      contextItems.push(
        <div key="social-info" className="flex items-center gap-2 text-xs text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span>@{state.socialContext.userProfile.username} verified</span>
        </div>
      )
    }

    // Show error context
    if (state.error) {
      contextItems.push(
        <div key="error-info" className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{state.error.message}</span>
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

  // ================================================
  // RENDER
  // ================================================

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
          // Base styling
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
      >
        <Icon className={cn('h-4 w-4', iconClassName)} />
        <span>{text}</span>
        <span className="ml-2 text-sm opacity-90">
          {price || purchaseFlow.formattedPrice}
        </span>
      </Button>

      {renderContextInfo()}
    </div>
  )
}

// ================================================
// CONVENIENCE VARIANTS
// ================================================

/**
 * MiniApp-optimized purchase button with enhanced social features
 */
export function MiniAppPurchaseButton(props: UnifiedPurchaseButtonProps) {
  return (
    <UnifiedPurchaseButton
      {...props}
      showContext={true}
      className="miniapp-purchase-button"
    />
  )
}

/**
 * Compact purchase button for inline usage
 */
export function CompactPurchaseButton(props: UnifiedPurchaseButtonProps) {
  return (
    <UnifiedPurchaseButton
      {...props}
      size="sm"
      fullWidth={false}
      showContext={false}
    />
  )
}

// ================================================
// EXPORTS
// ================================================

export default UnifiedPurchaseButton
export type { UnifiedPurchaseButtonProps }

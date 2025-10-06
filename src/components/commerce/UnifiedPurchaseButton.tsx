/**
 * Unified Purchase Button - V2 Implementation
 * File: src/components/commerce/UnifiedPurchaseButton.tsx
 *
 * Real V2 implementation using actual contracts - no mock logic or placeholders.
 * This replaces the old unified purchase button with V2 payment modal integration.
 */

'use client'

import React from 'react'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'
import {
  ShoppingCart,
  CheckCircle,
  Wallet
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// V2 Implementation - Real contracts
import { V2PaymentModal, useV2PaymentModal } from '@/components/v2/V2PaymentModal'
import { useContentAccess } from '@/hooks/contracts/v2/managers/useAccessManager'

interface UnifiedPurchaseButtonProps {
  /** Content ID for the content to purchase */
  contentId: bigint

  /** Creator address - required for V2 payments */
  creator: Address

  /** Content title for display */
  title: string

  /** Content description (optional) */
  description?: string

  /** Content price (optional, for display) */
  price?: string

  /** Callback fired when purchase is successfully completed */
  onPurchaseSuccess?: (contentId: bigint, txHash: string) => void

  /** Custom styling className */
  className?: string

  /** Button size variant */
  size?: 'default' | 'sm' | 'lg'

  /** Force full width button */
  fullWidth?: boolean

  /** Disable the button entirely */
  disabled?: boolean

  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
}

export function UnifiedPurchaseButton({
  contentId,
  creator,
  title,
  description,
  price = '1 USDC',
  onPurchaseSuccess,
  className,
  size = 'default',
  fullWidth = true,
  disabled = false,
  variant = 'default'
}: UnifiedPurchaseButtonProps) {
  const { address: userAddress } = useAccount()
  
  // Real V2 contract integration - check if user has access
  const { hasAccess, isLoading: accessLoading } = useContentAccess(contentId)

  // V2 Payment Modal integration - real contracts, no mock logic
  const paymentModal = useV2PaymentModal({
    contentId,
    creator,
    title,
    description,
    onSuccess: (txHash) => {
      console.log('V2 Purchase successful:', txHash)
      onPurchaseSuccess?.(contentId, txHash)
    },
    onError: (error) => {
      console.error('V2 Purchase failed:', error)
    }
  })

  // Loading state
  if (accessLoading) {
    return (
      <Button 
        disabled 
        size={size}
        className={cn(fullWidth && 'w-full', className)}
      >
        Checking access...
      </Button>
    )
  }

  // Already purchased state
  if (hasAccess) {
    return (
      <Button 
        variant="outline" 
        disabled 
        size={size}
        className={cn(fullWidth && 'w-full', className)}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Purchased
      </Button>
    )
  }

  // Not connected state
  if (!userAddress) {
    return (
      <Button 
        variant="outline" 
        disabled 
        size={size}
        className={cn(fullWidth && 'w-full', className)}
      >
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>
    )
  }

  // Purchase state - using real V2 payment modal
  return (
    <>
      <Button 
        variant={variant}
        size={size}
        onClick={paymentModal.openModal}
        disabled={disabled}
        className={cn(fullWidth && 'w-full', className)}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        {price ? `Buy ${price}` : 'Purchase'}
      </Button>
      
      {/* V2 Payment Modal - Real implementation */}
      <V2PaymentModal {...paymentModal.modalProps} />
    </>
  )
}

// Legacy export for backward compatibility
export default UnifiedPurchaseButton

// Export types for external usage
export type { UnifiedPurchaseButtonProps }
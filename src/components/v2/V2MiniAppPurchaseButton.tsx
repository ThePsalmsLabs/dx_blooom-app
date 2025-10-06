/**
 * V2 Mini App Purchase Button - Real Implementation
 * File: src/components/v2/V2MiniAppPurchaseButton.tsx
 *
 * Simplified, production-ready mini app purchase button using real V2 contracts.
 * No mock logic, placeholder data, or development-only features.
 */

'use client'

import React from 'react'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'
import {
  ShoppingCart,
  CheckCircle,
  Wallet,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Real V2 contracts - no mock implementations
import { V2PaymentModal, useV2PaymentModal } from './V2PaymentModal'
import { useContentAccess } from '@/hooks/contracts/v2/managers/useAccessManager'

interface V2MiniAppPurchaseButtonProps {
  /** Content ID for the content to purchase */
  contentId: bigint

  /** Creator address - required for V2 payments */
  creator: Address

  /** Content title */
  title: string

  /** Content description (optional) */
  description?: string

  /** Display price (optional) */
  price?: string

  /** Success callback with real transaction hash */
  onPurchaseSuccess?: (txHash: string) => void

  /** Error callback */
  onError?: (error: Error) => void

  /** Custom styling */
  className?: string

  /** Compact mode for mini app */
  compact?: boolean

  /** Button variant */
  variant?: 'default' | 'outline' | 'secondary'
}

export function V2MiniAppPurchaseButton({
  contentId,
  creator,
  title,
  description,
  price = '1 USDC',
  onPurchaseSuccess,
  onError,
  className,
  compact = false,
  variant = 'default'
}: V2MiniAppPurchaseButtonProps) {
  const { address: userAddress } = useAccount()
  
  // Real V2 contract access check - no mock data
  const { hasAccess, isLoading } = useContentAccess(contentId)

  // Real V2 payment modal - uses actual contracts
  const paymentModal = useV2PaymentModal({
    contentId,
    creator,
    title,
    description,
    onSuccess: (txHash) => {
      console.log('V2 Mini app purchase successful:', txHash)
      onPurchaseSuccess?.(txHash)
    },
    onError: (error) => {
      console.error('V2 Mini app purchase failed:', error)
      onError?.(error)
    }
  })

  // Loading state
  if (isLoading) {
    return (
      <Button 
        disabled 
        size={compact ? 'sm' : 'default'}
        className={cn('w-full', className)}
      >
        Checking...
      </Button>
    )
  }

  // Already has access
  if (hasAccess) {
    return (
      <Button 
        variant="outline" 
        disabled 
        size={compact ? 'sm' : 'default'}
        className={cn('w-full', className)}
      >
        <CheckCircle className="h-3 w-3 mr-1" />
        {compact ? 'Owned' : 'Already Purchased'}
      </Button>
    )
  }

  // Not connected
  if (!userAddress) {
    return (
      <Button 
        variant="outline" 
        disabled 
        size={compact ? 'sm' : 'default'}
        className={cn('w-full', className)}
      >
        <Wallet className="h-3 w-3 mr-1" />
        {compact ? 'Connect' : 'Connect Wallet'}
      </Button>
    )
  }

  // Purchase button with real V2 modal
  return (
    <>
      <Button 
        variant={variant}
        size={compact ? 'sm' : 'default'}
        onClick={paymentModal.openModal}
        className={cn('w-full', className)}
      >
        {compact ? (
          <>
            <ShoppingCart className="h-3 w-3 mr-1" />
            Buy
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            {price ? `Buy ${price}` : 'Purchase'}
          </>
        )}
      </Button>
      
      {/* Real V2 Payment Modal */}
      <V2PaymentModal {...paymentModal.modalProps} />
    </>
  )
}

export default V2MiniAppPurchaseButton
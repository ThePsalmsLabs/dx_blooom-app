/**
 * V2 Payment Modal Integration Examples
 * 
 * Practical examples showing how to integrate the V2PaymentModal
 * into your existing app components and workflows
 */

'use client'

import React from 'react'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Zap, 
  CreditCard, 
  Sparkles,
  DollarSign
} from 'lucide-react'

import { V2PaymentModal, useV2PaymentModal } from './V2PaymentModal'
import { useContentAccess } from '@/hooks/contracts/v2/managers/useAccessManager'

// ============================================================================
// 1. SIMPLE PURCHASE BUTTON - Replace existing purchase buttons
// ============================================================================

interface V2PurchaseButtonProps {
  contentId: bigint
  creator: Address
  title?: string
  price?: string
  className?: string
  variant?: 'default' | 'outline' | 'secondary'
  onSuccess?: (txHash: string) => void
}

export function V2PurchaseButton({
  contentId,
  creator,
  title = 'Premium Content',
  price = '1 USDC',
  className = '',
  variant = 'default',
  onSuccess
}: V2PurchaseButtonProps) {
  const { address: userAddress } = useAccount()
  const { hasAccess } = useContentAccess(contentId)
  
  const paymentModal = useV2PaymentModal({
    contentId,
    creator,
    title,
    onSuccess: (txHash) => {
      console.log('Payment successful:', txHash)
      onSuccess?.(txHash)
      // Handle post-purchase logic (redirect, refresh, etc.)
    },
    onError: (error) => {
      console.error('Payment failed:', error)
      // Handle error (show notification, etc.)
    }
  })

  if (hasAccess) {
    return (
      <Button variant="outline" disabled className={className}>
        <Sparkles className="h-4 w-4 mr-2" />
        Purchased
      </Button>
    )
  }

  if (!userAddress) {
    return (
      <Button variant="outline" disabled className={className}>
        Connect Wallet to Purchase
      </Button>
    )
  }

  return (
    <>
      <Button 
        variant={variant}
        onClick={paymentModal.openModal}
        className={className}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Buy {price}
      </Button>
      
      <V2PaymentModal {...paymentModal.modalProps} />
    </>
  )
}

// ============================================================================
// 2. ENHANCED CONTENT CARD - Upgrade existing content cards
// ============================================================================

interface V2ContentCardProps {
  contentId: bigint
  creator: Address
  title: string
  description: string
  price: string
  thumbnail?: string
  tags?: string[]
  className?: string
}

export function V2ContentCard({
  contentId,
  creator,
  title,
  description,
  price,
  thumbnail,
  tags = [],
  className = ''
}: V2ContentCardProps) {
  const { hasAccess } = useContentAccess(contentId)
  
  const paymentModal = useV2PaymentModal({
    contentId,
    creator,
    title,
    description,
    onSuccess: (txHash) => {
      // Redirect to content view page
      window.location.href = `/content/${contentId}/view`
    }
  })

  return (
    <div className={`border rounded-lg overflow-hidden bg-card ${className}`}>
      {/* Thumbnail */}
      {thumbnail && (
        <div className="aspect-video bg-muted relative">
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover"
          />
          {hasAccess && (
            <Badge className="absolute top-2 right-2 bg-green-500">
              <Sparkles className="h-3 w-3 mr-1" />
              Owned
            </Badge>
          )}
        </div>
      )}
      
      {/* Content Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Purchase Section */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{price}</span>
          </div>
          
          {hasAccess ? (
            <Button 
              size="sm"
              onClick={() => window.location.href = `/content/${contentId}/view`}
            >
              <Zap className="h-4 w-4 mr-2" />
              View Content
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={paymentModal.openModal}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Purchase
            </Button>
          )}
        </div>
      </div>
      
      <V2PaymentModal {...paymentModal.modalProps} />
    </div>
  )
}

// ============================================================================
// 3. MINI APP INTEGRATION - For your mini app pages
// ============================================================================

interface V2MiniAppPaymentProps {
  contentId: bigint
  creator: Address
  title: string
  compact?: boolean
}

export function V2MiniAppPayment({
  contentId,
  creator,
  title,
  compact = false
}: V2MiniAppPaymentProps) {
  const { hasAccess } = useContentAccess(contentId)
  
  const paymentModal = useV2PaymentModal({
    contentId,
    creator,
    title,
    onSuccess: () => {
      // Mini app specific success handling
      window.location.reload() // or navigate to content
    }
  })

  if (hasAccess) {
    return (
      <Badge variant="outline" className="text-green-600">
        <Sparkles className="h-3 w-3 mr-1" />
        Purchased
      </Badge>
    )
  }

  return (
    <>
      <Button 
        size={compact ? "sm" : "default"}
        variant="outline"
        onClick={paymentModal.openModal}
        className="w-full"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {compact ? 'Buy' : 'Purchase Content'}
      </Button>
      
      <V2PaymentModal {...paymentModal.modalProps} />
    </>
  )
}

// ============================================================================
// 4. SUBSCRIPTION FLOW - For creator subscriptions
// ============================================================================

interface V2SubscriptionButtonProps {
  creator: Address
  creatorName: string
  onSuccess?: () => void
}

export function V2SubscriptionButton({
  creator,
  creatorName,
  onSuccess
}: V2SubscriptionButtonProps) {
  const paymentModal = useV2PaymentModal({
    contentId: BigInt(0), // Subscriptions use contentId 0
    creator,
    title: `Subscribe to ${creatorName}`,
    description: 'Get access to all premium content from this creator',
    onSuccess: (txHash) => {
      console.log('Subscription successful:', txHash)
      onSuccess?.()
    }
  })

  return (
    <>
      <Button 
        variant="default"
        onClick={paymentModal.openModal}
        className="w-full"
      >
        <Zap className="h-4 w-4 mr-2" />
        Subscribe
      </Button>
      
      <V2PaymentModal {...paymentModal.modalProps} />
    </>
  )
}

// ============================================================================
// 5. USAGE EXAMPLES - How to integrate into existing pages
// ============================================================================

export const IntegrationExamples = {
  // Replace existing UnifiedPurchaseButton
  replacePurchaseButton: `
// OLD: 
<UnifiedPurchaseButton contentId={contentId} />

// NEW:
<V2PurchaseButton 
  contentId={contentId}
  creator={creatorAddress}
  title={contentTitle}
  onSuccess={(txHash) => router.push('/content/view')}
/>
  `,
  
  // Add to content pages
  contentPageIntegration: `
// In your content/[id]/page.tsx
import { V2ContentCard } from '@/components/v2/V2PaymentModalIntegration'

<V2ContentCard
  contentId={BigInt(params.id)}
  creator={content.creator}
  title={content.title}
  description={content.description}
  price="1 USDC"
  tags={content.tags}
/>
  `,
  
  // Mini app integration
  miniAppIntegration: `
// In your mini app pages
import { V2MiniAppPayment } from '@/components/v2/V2PaymentModalIntegration'

<V2MiniAppPayment
  contentId={contentId}
  creator={creator}
  title={title}
  compact={true}
/>
  `
}

export default {
  V2PurchaseButton,
  V2ContentCard,
  V2MiniAppPayment,
  V2SubscriptionButton,
  IntegrationExamples
}
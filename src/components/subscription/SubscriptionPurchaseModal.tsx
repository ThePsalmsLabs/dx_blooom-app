import React, { useCallback } from 'react'
import { CustomModal } from '@/components/ui/custom-modal'
import { CreatorSubscriptionPurchase } from './CreatorSubscriptionPurchase'
import { type Address } from 'viem'
import {
  Crown,
  Sparkles,
  Star,
  Zap,
  Shield,
  Heart,
  Users,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatAddress } from '@/lib/utils'
import { useCreatorProfile, useTokenBalance } from '@/hooks/contracts/core'
import { getContractAddresses } from '@/lib/contracts/config'
import { useChainId } from 'wagmi'

interface SubscriptionPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  creatorAddress: Address
  onSubscriptionSuccess?: () => void
}

export function SubscriptionPurchaseModal({
  isOpen,
  onClose,
  creatorAddress,
  onSubscriptionSuccess
}: SubscriptionPurchaseModalProps) {
  const handleSuccess = useCallback(() => {
    onSubscriptionSuccess?.()
    onClose()
  }, [onSubscriptionSuccess, onClose])

  // Get creator data for enhanced preview
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)
  const creatorProfile = useCreatorProfile(creatorAddress)

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm:max-w-lg"
      mobileBottomSheet={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      zIndex={50}
      className="subscription-modal"
    >
      {/* Enhanced Header Section */}
      <div className="text-center pb-6 border-b border-border/50">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg crown-icon">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-yellow-800" />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          Premium Creator Access
        </h2>

        <p className="text-muted-foreground mb-4">
          Unlock exclusive content and support your favorite creator
        </p>

        {/* Creator Info Preview */}
        {creatorProfile.data && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {creatorProfile.data.subscriberCount} subscribers
              </span>
            </div>
            {creatorProfile.data.isVerified && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
        )}

        {/* Key Benefits */}
        <div className="grid grid-cols-2 gap-3 mb-6 benefits-grid">
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-yellow-500" />
            <span>Exclusive Content</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-red-500" />
            <span>Direct Support</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-blue-500" />
            <span>Early Access</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Growth Rewards</span>
          </div>
        </div>

        {/* Price Highlight */}
        <div className="price-highlight rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">
              Monthly subscription to access premium content
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold text-primary">
                {creatorProfile.data ? formatCurrency(creatorProfile.data.subscriptionPrice, 6, 'USDC') : '$0.30'}
              </span>
              <span className="text-muted-foreground">per month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <CreatorSubscriptionPurchase
        creatorAddress={creatorAddress}
        onSubscriptionSuccess={handleSuccess}
        showCreatorInfo={false}
        variant="embedded"
      />

      {/* Footer Benefits */}
      <div className="mt-6 pt-4 border-t border-border/50 social-proof">
        <div className="text-center text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground mb-2">
            🎉 Join {creatorProfile.data?.subscriberCount || '0'} creators supporting this vision
          </p>
          <p>
            Your subscription directly supports content creation and helps build the creator economy.
          </p>
          <p className="text-primary font-medium">
            Cancel anytime • Secure blockchain payments • Instant access
          </p>
        </div>
      </div>
    </CustomModal>
  )
}

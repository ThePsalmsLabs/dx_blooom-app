import React, { useCallback } from 'react'
import { CustomModal } from '@/components/ui/custom-modal'
import { CreatorSubscriptionPurchase } from './CreatorSubscriptionPurchase'
import { type Address } from 'viem'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCreatorProfile } from '@/hooks/contracts/core'

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

  // Get creator data for preview
  const creatorProfile = useCreatorProfile(creatorAddress)

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Subscribe to Creator"
      description="Support this creator with a monthly subscription"
      maxWidth="sm:max-w-md"
      mobileBottomSheet={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      zIndex={50}
    >
      {/* Creator Info */}
      {creatorProfile.data && (
        <div className="bg-muted/50 rounded-lg p-4 border mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">
                Creator
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Users className="h-3 w-3" />
                <span>{creatorProfile.data.subscriberCount} subscribers</span>
              </div>
            </div>
            {creatorProfile.data.isVerified && (
              <Badge variant="secondary" className="text-xs">
                Verified
              </Badge>
            )}
          </div>

          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">
              Monthly subscription to access premium content
            </div>
            <div className="text-2xl font-bold text-primary">
              $0.30 per month
            </div>
          </div>
        </div>
      )}

      {/* Subscription Form */}
      <CreatorSubscriptionPurchase
        creatorAddress={creatorAddress}
        onSubscriptionSuccess={handleSuccess}
        showCreatorInfo={false}
        variant="embedded"
      />

      {/* Footer Note */}
      <div className="text-center text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
        Cancel anytime • Secure blockchain payments • Instant access
      </div>
    </CustomModal>
  )
}

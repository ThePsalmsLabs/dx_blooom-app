import React, { useCallback } from 'react'
import { CustomModal } from '@/components/ui/custom-modal'
import { CreatorSubscriptionPurchase } from './CreatorSubscriptionPurchase'
import { type Address } from 'viem'

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

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title="Subscribe to Creator"
      description="Support this creator with a subscription"
      maxWidth="sm:max-w-md"
      mobileBottomSheet={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
      zIndex={50}
    >
      <CreatorSubscriptionPurchase
        creatorAddress={creatorAddress}
        onSubscriptionSuccess={handleSuccess}
        showCreatorInfo={true}
        variant="embedded"
      />
    </CustomModal>
  )
}

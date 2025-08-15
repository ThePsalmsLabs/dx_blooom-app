import React, { useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subscribe to Creator</DialogTitle>
        </DialogHeader>
        <CreatorSubscriptionPurchase
          creatorAddress={creatorAddress}
          onSubscriptionSuccess={handleSuccess}
          showCreatorInfo={true}
          variant="embedded"
        />
      </DialogContent>
    </Dialog>
  )
}

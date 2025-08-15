import React, { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import { useAccount } from 'wagmi'
import { type Address } from 'viem'
import { Loader2 } from 'lucide-react'

// Import your existing hooks
import { useCreatorProfile } from '@/hooks/contracts/core'
import { useSubscriptionManagement } from '@/hooks/contracts/subscription/useSubscriptionManagement'

interface SubscribeButtonProps {
  creatorAddress: Address
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  showPrice?: boolean
  onSubscriptionSuccess?: () => void
  className?: string
}

export function SubscribeButton({
  creatorAddress,
  size = 'default',
  variant = 'default',
  showPrice = true,
  onSubscriptionSuccess,
  className
}: SubscribeButtonProps) {
  const { address: userAddress, isConnected } = useAccount()
  const creatorProfile = useCreatorProfile(creatorAddress)
  const subscriptionManagement = useSubscriptionManagement(userAddress)
  const { toast } = useToast()

  const handleSubscribe = useCallback(async () => {
    if (!userAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to subscribe.",
        variant: "destructive"
      })
      return
    }

    try {
      await subscriptionManagement.subscribe?.(creatorAddress)
      toast({
        title: "Subscribed Successfully!",
        description: "You now have access to this creator's content.",
      })
      onSubscriptionSuccess?.()
    } catch (error) {
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      })
    }
  }, [userAddress, subscriptionManagement, creatorAddress, toast, onSubscriptionSuccess])

  if (creatorProfile.isLoading) {
    return (
      <Button disabled size={size} variant={variant} className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!creatorProfile.data) {
    return null
  }

  const priceText = showPrice ? 
    ` ${formatCurrency(creatorProfile.data.subscriptionPrice, 6, 'USDC')}/mo` : 
    ''

  return (
    <Button
      onClick={handleSubscribe}
      disabled={!isConnected || subscriptionManagement.isLoading}
      size={size}
      variant={variant}
      className={className}
    >
      {subscriptionManagement.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        `Subscribe${priceText}`
      )}
    </Button>
  )
}

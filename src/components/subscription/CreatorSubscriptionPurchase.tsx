import React, { useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatAddress } from '@/lib/utils'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { type Address } from 'viem'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Star, 
  CreditCard, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

// Import your existing hooks
import { useCreatorProfile, useTokenBalance } from '@/hooks/contracts/core'
import { useSubscriptionManagement } from '@/hooks/contracts/subscription/useSubscriptionManagement'
import { getContractAddresses } from '@/lib/contracts/config'
import { useChainId } from 'wagmi'

interface CreatorSubscriptionPurchaseProps {
  creatorAddress: Address
  onSubscriptionSuccess?: () => void
  showCreatorInfo?: boolean
  variant?: 'default' | 'compact' | 'embedded'
  className?: string
}

/**
 * CreatorSubscriptionPurchase Component
 * 
 * This is the PRIMARY missing component in your codebase. It handles the complete
 * subscription purchase flow that users need to subscribe to creators.
 */
export function CreatorSubscriptionPurchase({
  creatorAddress,
  onSubscriptionSuccess,
  showCreatorInfo = true,
  variant = 'default',
  className
}: CreatorSubscriptionPurchaseProps) {
  const walletUI = useWalletConnectionUI()
  const { toast } = useToast()
  const chainId = useChainId()
  
  // Get contract addresses for token addresses
  const contractAddresses = getContractAddresses(chainId)
  
  // Fetch creator data
  const creatorProfile = useCreatorProfile(creatorAddress)
  const subscriptionManagement = useSubscriptionManagement(userAddress)
  const usdcBalance = useTokenBalance(contractAddresses?.USDC, userAddress)
  
  // Check if user is already subscribed
  const existingSubscription = useMemo(() => {
    if (!userAddress) return null
    return subscriptionManagement.getUserSubscriptionDetails?.(userAddress, creatorAddress)
  }, [userAddress, creatorAddress, subscriptionManagement])

  // Calculate subscription affordability
  const canAfford = useMemo(() => {
    if (!creatorProfile.data?.subscriptionPrice || !usdcBalance.data) return false
    return usdcBalance.data >= creatorProfile.data.subscriptionPrice
  }, [creatorProfile.data?.subscriptionPrice, usdcBalance.data])

  // Subscription purchase handler
  const handleSubscribe = useCallback(async () => {
    if (!userAddress || !creatorProfile.data) {
      toast({
        title: "Connection Required",
        description: "Please connect your wallet to subscribe.",
        variant: "destructive"
      })
      return
    }

    if (!canAfford) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${formatCurrency(creatorProfile.data.subscriptionPrice, 6, 'USDC')} USDC to subscribe.`,
        variant: "destructive"
      })
      return
    }

    try {
      // Call your subscription hook to initiate subscription
      await subscriptionManagement.subscribe?.(creatorAddress)
      
      toast({
        title: "Subscription Successful! 🎉",
        description: "You now have access to all of this creator&apos;s content for 30 days.",
      })
      
      onSubscriptionSuccess?.()
    } catch (error) {
      console.error('Subscription failed:', error)
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      })
    }
  }, [userAddress, creatorProfile.data, canAfford, subscriptionManagement, creatorAddress, toast, onSubscriptionSuccess])

  // Loading states
  if (creatorProfile.isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4 sm:p-6 text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading creator information...</p>
        </CardContent>
      </Card>
    )
  }

  // Error states
  if (creatorProfile.error || !creatorProfile.data) {
    return (
      <Card className={className}>
        <CardContent className="p-4 sm:p-6 text-center">
          <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">Failed to load creator information</p>
        </CardContent>
      </Card>
    )
  }

  const creator = creatorProfile.data
  const isSubscribed = existingSubscription?.isActive

  // Already subscribed state
  if (isSubscribed) {
    return (
      <Card className={className}>
        <CardContent className="p-4 sm:p-6 text-center">
          <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">You're Subscribed!</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
            You have access to all of this creator's content.
          </p>
          <div className="text-xs sm:text-sm text-muted-foreground">
            Expires: {existingSubscription?.expiryTime ? 
              new Date(Number(existingSubscription.expiryTime) * 1000).toLocaleDateString() : 
              'Unknown'}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact variant for integration into other components
  if (variant === 'compact') {
    return (
      <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 ${className}`}>
        <div className="flex-1 min-w-0">
          <div className="text-sm sm:text-base font-medium">
            {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}/month
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {creator.subscriberCount} subscribers
          </div>
        </div>
        <Button 
          onClick={handleSubscribe}
          disabled={!isConnected || !canAfford || subscriptionManagement.isLoading}
          size="sm"
          className="w-full sm:w-auto"
        >
          {subscriptionManagement.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Subscribe'
          )}
        </Button>
      </div>
    )
  }

  // Embedded variant for modal usage
  if (variant === 'embedded') {
    return (
      <div className={className}>
        {/* Balance Check */}
        {!canAfford && isConnected && (
          <Alert className="border-yellow-200 bg-yellow-50 mb-4">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              Insufficient USDC balance. You need {formatCurrency(creator.subscriptionPrice, 6, 'USDC')} but have {formatCurrency(usdcBalance.data || BigInt(0), 6, 'USDC')}.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscribe Button */}
        <Button
          onClick={handleSubscribe}
          disabled={!isConnected || !canAfford || subscriptionManagement.isLoading}
          className="w-full"
          size="lg"
        >
          {!isConnected ? (
            'Connect Wallet to Subscribe'
          ) : subscriptionManagement.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Subscription...
            </>
          ) : !canAfford ? (
            'Insufficient Balance'
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe for {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}/month
            </>
          )}
        </Button>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground text-center mt-4">
          By subscribing, you agree to our terms of service.
          You can cancel your subscription at any time.
        </div>
      </div>
    )
  }

  // Full subscription purchase card
  return (
    <Card className={className}>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          Subscribe to Creator
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Creator Information */}
        {showCreatorInfo && (
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm sm:text-base">
                {formatAddress(creatorAddress)}
                {creator.isVerified && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {creator.subscriberCount} subscribers
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {creator.contentCount} content pieces
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Details */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm sm:text-base">Monthly Subscription</div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Access to all creator content for 30 days
                </div>
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold">
              {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Subscription renews monthly</span>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* Balance Check */}
        {!canAfford && isConnected && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-xs sm:text-sm">
              Insufficient USDC balance. You need {formatCurrency(creator.subscriptionPrice, 6, 'USDC')} but have {formatCurrency(usdcBalance.data || BigInt(0), 6, 'USDC')}.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscribe Button */}
        <Button 
          onClick={handleSubscribe}
          disabled={!isConnected || !canAfford || subscriptionManagement.isLoading}
          className="w-full"
          size="default"
        >
          {!isConnected ? (
            'Connect Wallet to Subscribe'
          ) : subscriptionManagement.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Subscription...
            </>
          ) : !canAfford ? (
            'Insufficient Balance'
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe for {formatCurrency(creator.subscriptionPrice, 6, 'USDC')}/month
            </>
          )}
        </Button>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground text-center">
          By subscribing, you agree to our terms of service. 
          You can cancel your subscription at any time.
        </div>
      </CardContent>
    </Card>
  )
}

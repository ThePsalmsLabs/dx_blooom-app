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
import { useSubscriptionPurchaseWithApproval } from '@/hooks/contracts/subscription/useSubscriptionWithApproval'
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
  const userAddress = walletUI.address as `0x${string}` | undefined
  const { toast } = useToast()
  const chainId = useChainId()
  
  // Get contract addresses for token addresses
  const contractAddresses = getContractAddresses(chainId)
  
  // Fetch creator data
  const creatorProfile = useCreatorProfile(creatorAddress)
  const subscriptionFlow = useSubscriptionPurchaseWithApproval(creatorAddress, userAddress)
  const usdcBalance = useTokenBalance(contractAddresses?.USDC, userAddress)
  
  // Check if user is already subscribed - using new flow
  const isAlreadySubscribed = useMemo(() => {
    // For now, we'll use a simple check - can be enhanced later
    return false // TODO: Add proper subscription status check
  }, []) // No dependencies since we always return false

  // Calculate subscription affordability
  const canAfford = useMemo(() => {
    if (!creatorProfile.data?.subscriptionPrice || !usdcBalance.data) return false
    return usdcBalance.data >= creatorProfile.data.subscriptionPrice
  }, [creatorProfile.data?.subscriptionPrice, usdcBalance.data])

  // Enhanced subscription handler with approval flow
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
      // Handle approval flow if needed
      if (subscriptionFlow.requirements.needsApproval) {
        toast({
          title: "Approving USDC Spending",
          description: "Please approve USDC spending in your wallet...",
        })
        await subscriptionFlow.startApproval()
        
        // Wait for approval confirmation before proceeding
        toast({
          title: "Approval Confirmed",
          description: "USDC approval successful. Processing subscription...",
        })
      }

      // Execute subscription automatically after approval
      toast({
        title: "Processing Subscription",
        description: "Please confirm the subscription transaction in your wallet...",
      })

      await subscriptionFlow.executeSubscription()

      toast({
        title: "Subscription Successful! 🎉",
        description: "You now have access to all of this creator&apos;s content for 30 days.",
      })

      onSubscriptionSuccess?.()
    } catch (error) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Subscription failed:', error)
      }

      // Enhanced error handling for mini app context
      let errorMessage = "Please try again."
      if (error instanceof Error) {
        if (error.message.includes('ConnectorNotConnectedError') ||
            error.message.includes('Connector not connected') ||
            error.message.includes('Wallet connection lost')) {
          errorMessage = "Your wallet connection was lost. Please reconnect your wallet and try again."
        } else if (error.message.includes('Wallet not connected')) {
          errorMessage = "Please connect your wallet to continue with the subscription."
        } else if (error.message.includes('User rejected')) {
          errorMessage = "Transaction cancelled. You can try subscribing again when ready."
        } else if (error.message.includes('insufficient funds') || error.message.includes('insufficient payment')) {
          errorMessage = "Insufficient USDC balance. Please ensure you have enough USDC and try again."
        } else if (error.message.includes('allowance')) {
          errorMessage = "USDC approval failed. Please try again."
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Subscription Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [userAddress, creatorProfile.data, canAfford, subscriptionFlow, toast, onSubscriptionSuccess])

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
  const isSubscribed = isAlreadySubscribed

  // Already subscribed state
  if (isSubscribed) {
    return (
      <Card className={className}>
        <CardContent className="p-4 sm:p-6 text-center">
          <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">You&apos;re Subscribed!</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
            You have access to all of this creator&apos;s content.
          </p>

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
          disabled={!walletUI.isConnected || !subscriptionFlow.requirements.hasEnoughBalance || subscriptionFlow.isApproving || subscriptionFlow.isSubscribing}
          size="sm"
          className="w-full sm:w-auto"
        >
          {subscriptionFlow.isApproving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Approving
            </>
          ) : subscriptionFlow.isSubscribing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Subscribing
            </>
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
        {!subscriptionFlow.requirements.hasEnoughBalance && walletUI.isConnected && (
          <Alert className="border-yellow-200 bg-yellow-50 mb-4">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              Insufficient USDC balance. You need {formatCurrency(creator.subscriptionPrice, 6, 'USDC')} but have {formatCurrency(usdcBalance.data || BigInt(0), 6, 'USDC')}.
            </AlertDescription>
          </Alert>
        )}

        {/* Approval Required Alert */}
        {subscriptionFlow.requirements.needsApproval && subscriptionFlow.requirements.hasEnoughBalance && walletUI.isConnected && (
          <Alert className="border-blue-200 bg-blue-50 mb-4">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              First-time subscription requires USDC spending approval. You&apos;ll need to approve two transactions: approval + subscription.
            </AlertDescription>
          </Alert>
        )}

        {/* Subscribe Button */}
        <Button
          onClick={handleSubscribe}
          disabled={!walletUI.isConnected || !subscriptionFlow.requirements.hasEnoughBalance || subscriptionFlow.isApproving || subscriptionFlow.isSubscribing}
          className="w-full"
          size="lg"
        >
          {!walletUI.isConnected ? (
            'Connect Wallet to Subscribe'
          ) : subscriptionFlow.isApproving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Approving USDC Spending...
            </>
          ) : subscriptionFlow.isSubscribing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Subscription...
            </>
          ) : subscriptionFlow.requirements.needsApproval ? (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Approve & Subscribe
            </>
          ) : !subscriptionFlow.requirements.hasEnoughBalance ? (
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
        {!canAfford &&  walletUI.isConnected && (
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
          disabled={!walletUI.isConnected || !subscriptionFlow.requirements.hasEnoughBalance || subscriptionFlow.isApproving || subscriptionFlow.isSubscribing}
          className="w-full"
          size="default"
        >
          {!walletUI.isConnected ? (
            'Connect Wallet to Subscribe'
          ) : subscriptionFlow.isApproving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Approving USDC Spending...
            </>
          ) : subscriptionFlow.isSubscribing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Subscription...
            </>
          ) : subscriptionFlow.requirements.needsApproval ? (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Approve & Subscribe
            </>
          ) : !subscriptionFlow.requirements.hasEnoughBalance ? (
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

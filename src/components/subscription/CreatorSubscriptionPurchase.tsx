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
import { useSubscriptionStatus } from '@/hooks/contracts/subscription/useSubscriptionStatus'
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
  const subscriptionStatus = useSubscriptionStatus(creatorAddress, userAddress)
  const isAlreadySubscribed = subscriptionStatus.isSubscribed

  // Calculate subscription affordability
  const canAfford = useMemo(() => {
    if (!creatorProfile.data?.subscriptionPrice || !usdcBalance.data) return false
    return usdcBalance.data >= creatorProfile.data.subscriptionPrice
  }, [creatorProfile.data?.subscriptionPrice, usdcBalance.data])

  // Enhanced subscription handler with intelligent progress feedback
  const handleSubscribe = useCallback(async () => {
    if (!userAddress || !creatorProfile.data) {
      toast({
        title: "🔗 Connect Wallet Required",
        description: "Please connect your wallet to subscribe to this creator.",
        variant: "destructive"
      })
      return
    }

    if (!canAfford) {
      toast({
        title: "💰 Insufficient Balance",
        description: `You need ${formatCurrency(creatorProfile.data.subscriptionPrice, 6, 'USDC')} USDC to subscribe.`,
        variant: "destructive"
      })
      return
    }

    // Note: Toast system auto-manages cleanup via duration

    try {
      // Handle two-step approval + subscription flow
      if (subscriptionFlow.requirements.needsApproval) {
        // Step 1: Approval phase with progress feedback
        toast({
          title: "🔐 Step 1 of 2: Approve USDC Spending",
          description: "⏱️ Please confirm in your wallet... (usually takes 15-30 seconds)",
          duration: 5000, // Auto-dismiss after 5 seconds - user knows what to do
        })

        await subscriptionFlow.startApproval()
        
        // Show approval success (previous toast will auto-dismiss)
        
        // Brief success confirmation
        toast({
          title: "✅ Approval Confirmed!",
          description: "USDC spending approved. Ready for subscription...",
          duration: 2000, // Short confirmation
        })

        // Wait 1 second for user to see success
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Step 2: Subscription phase
      toast({
        title: subscriptionFlow.requirements.needsApproval ? "🎯 Step 2 of 2: Complete Subscription" : "🎯 Confirm Subscription",
        description: "⏱️ Please confirm in your wallet... (usually takes 10-20 seconds)",
        duration: 3000, // Auto-dismiss after 3 seconds as requested
      })

      await subscriptionFlow.executeSubscription()

      // Success toast will replace the subscription progress toast

      // Celebration toast with auto-dismiss
      toast({
        title: "🎉 Subscription Successful!",
        description: "🔓 You now have full access to this creator's content for 30 days!",
        duration: 4000, // 4 seconds to celebrate
      })

      onSubscriptionSuccess?.()
    } catch (error) {
      // Error handling - previous toasts will auto-dismiss

      // Enhanced error handling with actionable messages
      let errorMessage = "Please try again."
      let errorTitle = "❌ Subscription Failed"
      const shouldShowToast = true

      if (error instanceof Error) {
        if (error.message.includes('User rejected') || 
            error.message.includes('cancelled') || 
            error.message.includes('canceled') ||
            error.message.includes('user denied') ||
            error.message.includes('User denied') ||
            error.message.includes('Transaction was cancelled by user')) {
          errorTitle = "🚫 Transaction Cancelled"
          errorMessage = "No worries! You can try subscribing again whenever you're ready."
          
          // Prevent the mysterious "social context" toast by consuming the error properly
          console.log('✅ User cancelled transaction - handled gracefully, no platform error needed')
          
          // For user cancellations, show a gentle toast and return early to prevent error bubbling
          toast({
            title: errorTitle,
            description: errorMessage,
            duration: 3000, // Short duration for cancellations
          })
          return // Important: return early to prevent error from bubbling to platform handler
          
        } else if (error.message.includes('insufficient funds') || error.message.includes('insufficient payment')) {
          errorTitle = "💰 Insufficient Funds"
          errorMessage = "Please add more USDC to your wallet and try again."
        } else if (error.message.includes('ConnectorNotConnectedError') || 
                   error.message.includes('Connector not connected') ||
                   error.message.includes('Wallet connection lost')) {
          errorTitle = "🔗 Wallet Disconnected"
          errorMessage = "Your wallet was disconnected. Please reconnect and try again."
        } else if (error.message.includes('allowance') || error.message.includes('approval')) {
          errorTitle = "🔐 Approval Issue"
          errorMessage = "USDC approval failed. Please try the process again."
        } else if (error.message.includes('timeout')) {
          errorTitle = "⏰ Transaction Timeout"
          errorMessage = "Transaction took too long. Please check your connection and try again."
        } else {
          errorMessage = error.message.length > 100 ? "Please try again or contact support if the issue persists." : error.message
        }
      }

      // Show toast for non-cancellation errors
      if (shouldShowToast) {
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
          duration: 6000, // Longer duration for errors so users can read them
        })
      }
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
    const daysRemaining = subscriptionStatus.daysRemaining
    const expiresAt = subscriptionStatus.expiresAt
    const inGracePeriod = subscriptionStatus.inGracePeriod
    const subscriptionDetails = subscriptionStatus.subscriptionDetails
    
    return (
      <Card className={className}>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center mb-4 sm:mb-6">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              {inGracePeriod ? 'Subscription in Grace Period' : 'You\'re Subscribed!'}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              You have full access to this creator&apos;s content.
            </p>
          </div>

          {/* Subscription Details */}
          <div className="space-y-3 sm:space-y-4">
            {/* Access Information */}
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">What You Can Access:</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  All creator content (past & future)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Exclusive subscriber-only posts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Creator community features
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Priority support from creator
                </li>
              </ul>
            </div>

            {/* Subscription Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm sm:text-base">
                    {inGracePeriod ? 'Grace Period' : 'Active Subscription'}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {daysRemaining > 0 
                      ? `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining`
                      : expiresAt 
                        ? 'Expires soon'
                        : 'Unlimited access'
                    }
                  </div>
                </div>
              </div>
              {expiresAt && (
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Expires: {expiresAt.toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Subscription History */}
            {subscriptionDetails && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-sm sm:text-base">
                      Total Paid: {formatCurrency(subscriptionDetails.totalPaid, 6, 'USDC')}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {subscriptionDetails.renewalCount > 0 
                        ? `${subscriptionDetails.renewalCount} renewal${subscriptionDetails.renewalCount === 1 ? '' : 's'}`
                        : 'First subscription period'
                      }
                    </div>
                  </div>
                </div>
                {subscriptionDetails.startTime && (
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Since: {subscriptionDetails.startTime.toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Grace Period Warning */}
            {inGracePeriod && (
              <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800">
                      Payment Issue Detected
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      Your subscription is in a grace period. Please update your payment method to continue accessing content.
                    </div>
                  </div>
                </div>
              </div>
            )}
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
          disabled={!walletUI.isConnected || !subscriptionFlow.requirements.hasEnoughBalance || subscriptionFlow.isApproving || subscriptionFlow.isSubscribing}
          size="sm"
          className="w-full sm:w-auto"
        >
          {subscriptionFlow.isApproving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Step 1/2: Approving...
            </>
          ) : subscriptionFlow.isSubscribing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Step 2/2: Subscribing...
            </>
          ) : subscriptionFlow.requirements.needsApproval ? (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Approve & Subscribe
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe
            </>
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
              Step 1/2: Approving USDC... (~30s)
            </>
          ) : subscriptionFlow.isSubscribing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Step 2/2: Subscribing... (~20s)
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

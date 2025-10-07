import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Address } from 'viem'
import {
  Eye,
  CheckCircle,
  Loader2,
  Wallet,
  CreditCard,
  Zap,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Coins,
  MessageCircle
} from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

import { cn } from '@/lib/utils'

import {
  useUnifiedContentPurchase,
  PaymentMethod
} from '@/hooks/contracts/payments'
import { useContentById as useContentDetails } from '@/hooks/contracts/content'
import { useEnhancedTokenBalances, formatUSDValue } from '@/hooks/web3/useEnhancedTokenBalances'
import { SmartMessagingButton } from '@/components/messaging/SmartMessagingButton'
import { PostPurchaseMessaging, usePostPurchaseMessaging } from '@/components/messaging/PostPurchaseMessaging'

/* -------------------------------------------------------------------------- */
/*                              INTERNAL TYPES                                */
/* -------------------------------------------------------------------------- */

interface PaymentOption {
  id: PaymentMethod
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  estimatedTime: string
  gasLevel: 'Low' | 'Medium' | 'High'
  available: boolean
}

interface ContentPurchaseCardProps {
  contentId: bigint
  userAddress?: Address
  creatorAddress?: Address
  creatorName?: string
  contentTitle?: string
  onPurchaseSuccess?: (contentId: bigint) => void
  onViewContent?: (contentId: bigint) => void
  variant?: 'full' | 'compact' | 'minimal'
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function ContentPurchaseCard({
  contentId,
  userAddress,
  creatorAddress,
  creatorName,
  contentTitle,
  onPurchaseSuccess,
  onViewContent,
  variant = 'full',
  className
}: ContentPurchaseCardProps) {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.USDC)

  const unifiedPurchase = useUnifiedContentPurchase(contentId, userAddress)
  const contentDetails = useContentDetails(contentId)
  const tokenBalances = useEnhancedTokenBalances()
  const postPurchaseMessaging = usePostPurchaseMessaging()

  const priceDisplay = contentDetails.data
    ? (Number(contentDetails.data.payPerViewPrice) / 1_000_000).toFixed(2)
    : '—'

  // Get payment affordability analysis
  const paymentAnalysis = useMemo(() => {
    if (!contentDetails.data) return null
    return tokenBalances.canAffordContentPrice(contentDetails.data.payPerViewPrice)
  }, [contentDetails.data, tokenBalances])

  /* ------------------------- PAYMENT OPTIONS ARRAY ------------------------ */

  const paymentOptions: PaymentOption[] = useMemo(
    () => {
      const usdcToken = tokenBalances.getTokenBySymbol('USDC')
      const ethToken = tokenBalances.getTokenBySymbol('ETH')
      
      return [
        {
          id: PaymentMethod.USDC,
          name: 'USDC',
          icon: DollarSign,
          description: usdcToken 
            ? `Direct payment • Balance: ${parseFloat(usdcToken.balanceFormatted).toFixed(2)} USDC`
            : 'Direct payment with USDC',
          estimatedTime: '~15 sec',
          gasLevel: 'Low',
          available: unifiedPurchase.availablePaymentMethods.includes(PaymentMethod.USDC)
        },
        {
          id: PaymentMethod.ETH,
          name: 'ETH',
          icon: Zap,
          description: ethToken 
            ? `Auto-swap to USDC • Balance: ${parseFloat(ethToken.balanceFormatted).toFixed(4)} ETH (${formatUSDValue(ethToken.balanceUSD)})`
            : 'Pay with ETH via Commerce Protocol',
          estimatedTime: '~45 sec',
          gasLevel: 'Medium',
          available: unifiedPurchase.availablePaymentMethods.includes(PaymentMethod.ETH)
        },
        {
          id: PaymentMethod.OTHER_TOKEN,
          name: 'Other Token',
          icon: Coins,
          description: 'Pay with any supported ERC-20',
          estimatedTime: '~60 sec',
          gasLevel: 'High',
          available: unifiedPurchase.availablePaymentMethods.includes(PaymentMethod.OTHER_TOKEN)
        }
      ]
    },
    [unifiedPurchase.availablePaymentMethods, tokenBalances]
  )

  /* -------------- FILTER + AUTO-SELECT BEST AVAILABLE METHOD -------------- */

  const availableOptions = paymentOptions.filter((opt) => opt.available)

  React.useEffect(() => {
    if (availableOptions.length > 0 && !availableOptions.find((o) => o.id === selectedMethod)) {
      // Smart selection based on payment capabilities
      const capabilities = tokenBalances.getPaymentCapabilities()
      
      let bestOption = availableOptions[0] // Fallback
      
      if (capabilities.recommendedPaymentMethod === 'USDC' && capabilities.canPayWithUSDC) {
        bestOption = availableOptions.find((o) => o.id === PaymentMethod.USDC) || bestOption
      } else if (capabilities.recommendedPaymentMethod === 'ETH' && capabilities.canPayWithETH) {
        bestOption = availableOptions.find((o) => o.id === PaymentMethod.ETH) || bestOption
      } else {
        // Original fallback logic
        bestOption =
          availableOptions.find((o) => o.id === PaymentMethod.USDC) ||
          availableOptions.find((o) => o.id === PaymentMethod.ETH) ||
          availableOptions[0]
      }
      
      setSelectedMethod(bestOption.id)
    }
  }, [availableOptions, selectedMethod, tokenBalances])

  /* ----------------------------- HANDLERS --------------------------------- */

  const handlePurchase = useCallback(async () => {
    try {
      await unifiedPurchase.executePurchase(selectedMethod)
      // Success callback will be triggered by effect when transaction confirms
    } catch (err) {
      console.error('Purchase failed:', err)
    }
  }, [unifiedPurchase, selectedMethod])

  const handleViewContent = useCallback(() => {
    // Navigate directly to content view page when user has access
    router.push(`/content/${contentId}/view`)
  }, [router, contentId])

  // Fire success callback and show post-purchase messaging
  React.useEffect(() => {
    if (unifiedPurchase.purchaseState.step === 'completed') {
      // Show post-purchase messaging if we have creator info
      if (userAddress && creatorAddress) {
        postPurchaseMessaging.show({
          userAddress,
          creatorAddress,
          contentId: contentId.toString(),
          contentTitle,
          creatorName,
          purchaseAmount: priceDisplay
        })
      }
      
      onPurchaseSuccess?.(contentId)
    }
  }, [unifiedPurchase.purchaseState.step, onPurchaseSuccess, contentId, userAddress, creatorAddress, contentTitle, creatorName, priceDisplay, postPurchaseMessaging])

  /* ----------------------------- RENDERING -------------------------------- */

  if (unifiedPurchase.isLoading || contentDetails.isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading content details...</span>
        </CardContent>
      </Card>
    )
  }

  if (unifiedPurchase.error || contentDetails.error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load content information. Please refresh and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (unifiedPurchase.hasAccess) {
    return (
      <Card className={cn('w-full border-green-200 bg-green-50', className)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Access Granted</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Purchased
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="flex gap-2">
          <Button onClick={handleViewContent} className="flex-1">
            <Eye className="h-4 w-4 mr-2" />
            View Content
          </Button>
          
          {userAddress && creatorAddress && (
            <SmartMessagingButton
              userAddress={userAddress}
              creatorAddress={creatorAddress}
              contentId={contentId.toString()}
              context="general"
              variant="outline"
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message Creator
            </SmartMessagingButton>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <>
      <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Purchase Content</CardTitle>
          <Badge variant="outline">{priceDisplay}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payment Method Selection */}
        {availableOptions.length > 1 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Choose Payment Method</h4>
            <div className="grid gap-2">
              {availableOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedMethod === option.id
                return (
                  <div
                    key={option.id}
                    className={cn(
                      'p-3 border rounded-lg cursor-pointer transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onClick={() => setSelectedMethod(option.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{option.name}</div>
                          <div className="text-xs text-gray-600">{option.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {option.gasLevel} Gas
                        </Badge>
                        <div className="text-xs text-gray-600 mt-1">
                          {option.estimatedTime}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Payment Status */}
        <PaymentStatus unifiedPurchase={unifiedPurchase} selectedMethod={selectedMethod} />

        {availableOptions.length === 0 && (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              No supported payment methods available. Please ensure you have USDC, ETH, or other
              supported tokens in your wallet.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {unifiedPurchase.purchaseState.step === 'error' && (
          <Button variant="outline" onClick={unifiedPurchase.retry} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}

        <PurchaseButton
          unifiedPurchase={unifiedPurchase}
          selectedMethod={selectedMethod}
          availableOptions={availableOptions}
          onPurchase={handlePurchase}
          className={
            unifiedPurchase.purchaseState.step === 'error' ? 'flex-1' : 'w-full'
          }
        />
      </CardFooter>
      </Card>
      
      {/* Post-purchase messaging modal */}
      {userAddress && creatorAddress && (
        <PostPurchaseMessaging
          userAddress={userAddress}
          creatorAddress={creatorAddress}
          contentId={contentId.toString()}
          contentTitle={contentTitle}
          creatorName={creatorName}
          isVisible={postPurchaseMessaging.isVisible}
          onDismiss={postPurchaseMessaging.dismiss}
          variant="celebration"
        />
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                              STATUS SUBCOMPONENT                            */
/* -------------------------------------------------------------------------- */

function PaymentStatus({
  unifiedPurchase,
  selectedMethod
}: {
  unifiedPurchase: ReturnType<typeof useUnifiedContentPurchase>
  selectedMethod: PaymentMethod
}) {
  const { purchaseState, selectedPaymentInfo } = unifiedPurchase

  if (purchaseState.step === 'idle' && selectedPaymentInfo) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {selectedMethod === PaymentMethod.USDC ? 'USDC Balance' : 'Token Balance'}
          </span>
          <span
            className={cn(
              'text-sm font-medium',
              selectedPaymentInfo.hasEnoughBalance ? 'text-green-600' : 'text-red-600'
            )}
          >
            {selectedPaymentInfo.formattedBalance}
          </span>
        </div>

        {selectedPaymentInfo.needsApproval && (
          <div className="text-xs text-amber-600">Token approval required for first-time purchase</div>
        )}
      </div>
    )
  }

  if (purchaseState.step === 'approving' || purchaseState.step === 'purchasing') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{purchaseState.message}</span>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
        <Progress value={purchaseState.step === 'approving' ? 40 : 80} />
      </div>
    )
  }

  if (purchaseState.step === 'error') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{purchaseState.message}</AlertDescription>
      </Alert>
    )
  }

  return null
}

/* -------------------------------------------------------------------------- */
/*                             PURCHASE BUTTON SUB                            */
/* -------------------------------------------------------------------------- */

function PurchaseButton({
  unifiedPurchase,
  selectedMethod,
  availableOptions,
  onPurchase,
  className
}: {
  unifiedPurchase: ReturnType<typeof useUnifiedContentPurchase>
  selectedMethod: PaymentMethod
  availableOptions: PaymentOption[]
  onPurchase: () => void
  className?: string
}) {
  const { purchaseState, selectedPaymentInfo } = unifiedPurchase

  if (purchaseState.step === 'completed') {
    return (
      <Button className={cn('bg-green-600 hover:bg-green-700', className)} disabled>
        <CheckCircle className="h-4 w-4 mr-2" />
        Purchase Complete!
      </Button>
    )
  }

  if (purchaseState.step === 'approving' || purchaseState.step === 'purchasing') {
    return (
      <Button className={className} disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        {purchaseState.step === 'approving' ? 'Approving...' : 'Processing...'}
      </Button>
    )
  }

  if (availableOptions.length === 0) {
    return (
      <Button className={className} disabled>
        <Wallet className="h-4 w-4 mr-2" />
        No Payment Methods Available
      </Button>
    )
  }

  if (selectedPaymentInfo && !selectedPaymentInfo.hasEnoughBalance) {
    return (
      <Button className={className} disabled>
        <AlertCircle className="h-4 w-4 mr-2" />
        Insufficient {selectedMethod === PaymentMethod.USDC ? 'USDC' : 'Balance'}
      </Button>
    )
  }

  const buttonText = selectedPaymentInfo?.needsApproval
    ? `Approve & Purchase with ${availableOptions.find((opt) => opt.id === selectedMethod)?.name}`
    : `Purchase with ${availableOptions.find((opt) => opt.id === selectedMethod)?.name}`

  return (
    <Button className={className} onClick={onPurchase} disabled={!selectedPaymentInfo?.hasEnoughBalance}>
      <CreditCard className="h-4 w-4 mr-2" />
      {buttonText}
    </Button>
  )
}

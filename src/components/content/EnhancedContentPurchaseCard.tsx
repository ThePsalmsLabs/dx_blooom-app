/**
 * Enhanced Content Purchase Card Component
 * File: src/components/content/EnhancedContentPurchaseCard.tsx
 * 
 * This component serves as the main user interface for your sophisticated payment system.
 * Think of it as the "checkout counter" where users can see product details and choose
 * how they want to pay. It intelligently handles both simple USDC purchases and 
 * advanced multi-token payments.
 * 
 * Why this component exists:
 * Your existing ContentPurchaseCard was incomplete and didn't connect properly to your
 * smart contract architecture. This component bridges the gap between your advanced
 * contract capabilities and a user-friendly purchase experience.
 * 
 * How it fits into your architecture:
 * - Replaces src/components/web3/ContentPurchaseCard.tsx
 * - Uses your new payment hooks from src/hooks/contracts/payments.ts
 * - Integrates with your existing UI component library
 * - Follows your established component patterns and styling
 * 
 * Educational note:
 * This demonstrates the React pattern of "smart components" that handle complex logic
 * while delegating specific concerns to smaller, focused sub-components. Each section
 * of the purchase flow is broken into its own component for clarity and maintainability.
 */

'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RadioGroup,
  RadioGroupItem,
  Label,
  Alert,
  AlertDescription,
  Progress,
  Separator
} from '@/components/ui'
import { 
  CreditCard, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Wallet,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react'

// Import your new hook infrastructure
import { 
  useUnifiedContentPurchase, 
  PaymentTier, 
  PaymentMethod,
  type PaymentOption
} from '@/hooks/contracts/payments'
import { useContentById, useHasContentAccess } from '@/hooks/contracts/content'

// ===== MAIN PURCHASE CARD COMPONENT =====
/**
 * Enhanced Content Purchase Card
 * 
 * This is the main component that replaces your existing purchase card.
 * It automatically detects what payment options are available and guides
 * users through the appropriate flow based on their choice.
 * 
 * Key features:
 * - Automatic payment method detection and selection
 * - Real-time balance and approval checking
 * - Step-by-step guidance through complex payment flows
 * - Clear error messaging and recovery options
 * - Responsive design that works on all devices
 */
interface EnhancedContentPurchaseCardProps {
  contentId: bigint
  className?: string
  onPurchaseSuccess?: () => void
  variant?: 'full' | 'compact'
}

export function EnhancedContentPurchaseCard({ 
  contentId, 
  className = '',
  onPurchaseSuccess,
  variant = 'full'
}: EnhancedContentPurchaseCardProps) {
  const { address: userAddress } = useAccount()
  
  // Get content data and access status
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)
  const purchase = useUnifiedContentPurchase(contentId, userAddress)

  // Loading state - show skeleton while data loads
  if (contentQuery.isLoading || accessQuery.isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state - show clear error message
  if (contentQuery.isError || !contentQuery.data) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load content information. Please refresh and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const content = contentQuery.data
  const priceInUSDC = formatUnits(content.payPerViewPrice, 6)
  const hasAccess = accessQuery.data

  // Handle successful purchase
  React.useEffect(() => {
    if (purchase.simple.isSuccess || purchase.advanced.currentStep === 'completed') {
      onPurchaseSuccess?.()
    }
  }, [purchase.simple.isSuccess, purchase.advanced.currentStep, onPurchaseSuccess])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold">{content.title}</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">${priceInUSDC}</div>
            <div className="text-sm text-gray-500">USDC</div>
          </div>
        </CardTitle>
        {variant === 'full' && (
          <p className="text-sm text-gray-600 mt-2">{content.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Access Status Display */}
        <AccessStatusSection hasAccess={hasAccess} />

        {/* Only show purchase options if user doesn't have access */}
        {!hasAccess && (
          <>
            {/* Payment Method Selection */}
            <PaymentMethodSelector 
              options={purchase.paymentOptions}
              selectedTier={purchase.selectedTier}
              selectedMethod={purchase.selectedMethod}
              onTierChange={purchase.setSelectedTier}
              onMethodChange={purchase.setSelectedMethod}
            />

            <Separator />

            {/* Purchase Flow Based on Selection */}
            {purchase.selectedTier === PaymentTier.SIMPLE ? (
              <SimpleUSDCPurchaseFlow
                purchase={purchase}
                contentId={contentId}
                priceUSDC={content.payPerViewPrice}
              />
            ) : (
              <AdvancedMultiTokenFlow
                purchase={purchase}
                contentId={contentId}
                priceUSDC={content.payPerViewPrice}
              />
            )}

            {/* Global Error Display */}
            {purchase.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {purchase.error.message || 'Purchase failed. Please try again.'}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ===== ACCESS STATUS SUB-COMPONENT =====
/**
 * Access Status Section
 * 
 * This component clearly communicates whether the user already has access
 * to the content. It's important for preventing confusion and duplicate purchases.
 */
function AccessStatusSection({ hasAccess }: { hasAccess: boolean | undefined }) {
  if (hasAccess === undefined) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="text-sm">Checking access...</span>
      </div>
    )
  }

  if (hasAccess) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✨ You have access to this content! You can view it immediately.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <Shield className="h-4 w-4" />
      <AlertDescription>
        🔒 This is premium content. Purchase access to unlock and view.
      </AlertDescription>
    </Alert>
  )
}

// ===== PAYMENT METHOD SELECTOR SUB-COMPONENT =====
/**
 * Payment Method Selector
 * 
 * This component lets users choose between simple USDC payments and advanced
 * multi-token payments. It's designed to guide users toward the best option
 * for their situation while clearly explaining the differences.
 */
function PaymentMethodSelector({
  options,
  selectedTier,
  selectedMethod,
  onTierChange,
  onMethodChange
}: {
  options: PaymentOption[]
  selectedTier: PaymentTier
  selectedMethod: PaymentMethod
  onTierChange: (tier: PaymentTier) => void
  onMethodChange: (method: PaymentMethod) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Payment Method</h3>
        <span className="text-xs text-gray-500">Choose how to pay</span>
      </div>
      
      <RadioGroup
        value={`${selectedTier}-${selectedMethod}`}
        onValueChange={(value: string) => {
          const [tier, method] = value.split('-')
          onTierChange(tier as PaymentTier)
          onMethodChange(parseInt(method) as PaymentMethod)
        }}
        className="space-y-3"
      >
        {options.map((option) => (
          <div key={`${option.tier}-${option.method}`} className="flex items-start space-x-3">
            <RadioGroupItem 
              value={`${option.tier}-${option.method}`} 
              id={`payment-${option.tier}-${option.method}`}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label 
                htmlFor={`payment-${option.tier}-${option.method}`}
                className="flex items-center gap-2 cursor-pointer font-medium"
              >
                {option.method === PaymentMethod.USDC && <CreditCard className="h-4 w-4 text-blue-600" />}
                {option.method === PaymentMethod.ETH && <Zap className="h-4 w-4 text-purple-600" />}
                <span>{option.symbol}</span>
                <span className="text-sm font-normal text-gray-600">({option.name})</span>
                {option.recommended && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Recommended
                  </span>
                )}
              </Label>
              <p className="text-sm text-gray-500">{option.description}</p>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

// ===== SIMPLE USDC PURCHASE FLOW SUB-COMPONENT =====
/**
 * Simple USDC Purchase Flow
 * 
 * This component handles the straightforward USDC purchase path. It automatically
 * detects what steps the user needs to complete (check balance, approve tokens,
 * make purchase) and guides them through each one with clear actions.
 */
function SimpleUSDCPurchaseFlow({
  purchase,
  contentId,
  priceUSDC
}: {
  purchase: ReturnType<typeof useUnifiedContentPurchase>
  contentId: bigint
  priceUSDC: bigint
}) {
  const simple = purchase.simple
  const needsApproval = simple.needsApproval(priceUSDC)
  const canAfford = simple.canAfford(priceUSDC)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h4 className="font-medium">USDC Direct Payment</h4>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Fast</span>
      </div>

      {/* Balance Information */}
      <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Your USDC Balance:</span>
          <span className="font-medium">
            {simple.usdcBalance ? formatUnits(simple.usdcBalance, 6) : '0'} USDC
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Required Amount:</span>
          <span className="font-medium">{formatUnits(priceUSDC, 6)} USDC</span>
        </div>
        {simple.usdcAllowance !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current Approval:</span>
            <span className="font-medium">{formatUnits(simple.usdcAllowance, 6)} USDC</span>
          </div>
        )}
      </div>

      {/* Purchase Actions */}
      {!canAfford ? (
        <Alert variant="destructive">
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Insufficient USDC balance. You need {formatUnits(priceUSDC, 6)} USDC to purchase this content.
            <br />
            <small className="text-gray-600 mt-1 block">
              Get USDC from an exchange or bridge to continue.
            </small>
          </AlertDescription>
        </Alert>
      ) : needsApproval ? (
        <div className="space-y-3">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You need to approve USDC spending first. This is a one-time setup that allows 
              the platform to process your payment securely.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => simple.approveUSDC(priceUSDC)}
            disabled={simple.isApproving}
            className="w-full"
          >
            {simple.isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving USDC...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Approve USDC Spending
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => simple.purchaseDirect(contentId)}
          disabled={simple.isPurchasing || simple.isConfirming}
          className="w-full"
          size="lg"
        >
          {simple.isPurchasing || simple.isConfirming ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {simple.isPurchasing ? 'Processing Purchase...' : 'Confirming Transaction...'}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Purchase Content for {formatUnits(priceUSDC, 6)} USDC
            </>
          )}
        </Button>
      )}
    </div>
  )
}

// ===== ADVANCED MULTI-TOKEN FLOW SUB-COMPONENT =====
/**
 * Advanced Multi-Token Flow
 * 
 * This component handles the complex multi-step process for paying with
 * non-USDC tokens. It provides clear progress indication and explanations
 * for each step in the Commerce Protocol integration flow.
 */
function AdvancedMultiTokenFlow({
  purchase,
  contentId,
  priceUSDC
}: {
  purchase: ReturnType<typeof useUnifiedContentPurchase>
  contentId: bigint
  priceUSDC: bigint
}) {
  const advanced = purchase.advanced

  // Calculate progress percentage for the progress bar
  const progressValue = React.useMemo(() => {
    switch (advanced.currentStep) {
      case 'idle': return 0
      case 'creating_intent': return 20
      case 'awaiting_signature': return 40
      case 'executing_payment': return 70
      case 'processing': return 90
      case 'completed': return 100
      default: return 0
    }
  }, [advanced.currentStep])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-purple-600" />
        <h4 className="font-medium">Multi-Token Payment</h4>
        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Advanced</span>
      </div>

      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Payment Progress</span>
          <span className="text-xs text-gray-500">{progressValue}% complete</span>
        </div>
        <Progress value={progressValue} className="h-2" />
        <p className="text-sm text-gray-600">{advanced.stepDescription}</p>
      </div>

      {/* Step-specific Actions and Information */}
      {advanced.currentStep === 'idle' && (
        <div className="space-y-3">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Pay with ETH and we'll automatically convert it to USDC for the creator.
              This uses advanced routing to get you the best exchange rate.
            </AlertDescription>
          </Alert>
          <Button
            onClick={purchase.startPurchase}
            disabled={advanced.isCreatingIntent}
            className="w-full"
            size="lg"
          >
            {advanced.isCreatingIntent ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Payment Intent...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Start Multi-Token Purchase
              </>
            )}
          </Button>
        </div>
      )}

      {advanced.currentStep === 'awaiting_signature' && (
        <Alert>
          <Clock className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            Payment intent created successfully! Our system is preparing your transaction...
            <br />
            <small className="text-gray-600 mt-1 block">
              This usually takes 10-30 seconds. Your payment will continue automatically.
            </small>
          </AlertDescription>
        </Alert>
      )}

      {advanced.currentStep === 'executing_payment' && advanced.paymentIntent && (
        <div className="space-y-3">
          <Alert>
            <ArrowRight className="h-4 w-4" />
            <AlertDescription>
              Ready to execute your payment! Click below to complete the transaction.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => advanced.executePayment(advanced.paymentIntent!.intentId)}
            disabled={advanced.isExecutingPayment}
            className="w-full"
            size="lg"
          >
            {advanced.isExecutingPayment ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Execute Payment
              </>
            )}
          </Button>
        </div>
      )}

      {advanced.currentStep === 'processing' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment executed successfully! Finalizing your content access...
          </AlertDescription>
        </Alert>
      )}

      {/* Backend Service Notice */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 text-sm">
          <strong>Advanced Feature:</strong> Multi-token payments require backend signature services. 
          If this option doesn't work, please use the simple USDC payment method above.
        </AlertDescription>
      </Alert>
    </div>
  )
}
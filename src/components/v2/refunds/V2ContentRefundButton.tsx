/**
 * V2ContentRefundButton.tsx - Standalone refund button for content pages
 * 
 * A flexible refund button component that can be placed on any content page.
 * Features automatic eligibility checking, smooth animations, and comprehensive
 * refund request handling.
 */

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  RefreshCw,
  AlertCircle,
  Clock,
  DollarSign,
  Shield,
  Calendar,
  User
} from 'lucide-react'
import { useRefundManager } from '@/hooks/contracts/v2/managers/useRefundManager'
import { RefundRequestModal } from './RefundRequestModal'
import { RefundUtils } from './index'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { formatUnits } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { type Address } from 'viem'

interface V2ContentRefundButtonProps {
  intentId: `0x${string}`
  contentId: string | number
  contentTitle: string
  contentCreator: string
  creatorAddress?: Address
  purchaseAmount: bigint
  purchaseDate?: Date
  accessCount?: number
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'card'
  size?: 'sm' | 'default' | 'lg'
  showEligibility?: boolean
  maxRefundDays?: number
  maxAccessCount?: number
  creatorAmount?: bigint
  platformFee?: bigint
  operatorFee?: bigint
}

export function V2ContentRefundButton({
  intentId,
  contentId,
  contentTitle,
  contentCreator,
  creatorAddress,
  purchaseAmount,
  purchaseDate = new Date(),
  accessCount = 0,
  className = '',
  variant = 'outline',
  size = 'default',
  showEligibility = true,
  maxRefundDays = 30,
  maxAccessCount = 10,
  creatorAmount,
  platformFee,
  operatorFee
}: V2ContentRefundButtonProps) {
  const { address: userAddress } = useAccount()
  const { useRefundEligibility, useRefundRequest } = useRefundManager()
  
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [eligibilityChecked, setEligibilityChecked] = useState(false)

  // Check eligibility
  const eligibility = useRefundEligibility(userAddress)
  const existingRefund = useRefundRequest(intentId)

  // Calculate local eligibility based on purchase conditions
  const localEligibility = RefundUtils.isRefundEligible(
    purchaseDate,
    accessCount,
    maxRefundDays,
    maxAccessCount
  )

  // Combine eligibility checks
  const isEligible = localEligibility.eligible && !eligibility.hasPendingRefund
  const eligibilityReason = !localEligibility.eligible 
    ? localEligibility.reason 
    : eligibility.hasPendingRefund 
    ? 'You already have a pending refund request'
    : 'Eligible for refund'

  // Handle eligibility check animation
  useEffect(() => {
    const timer = setTimeout(() => setEligibilityChecked(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Format amount for display
  const formatAmount = (amount: bigint) => {
    return `$${formatUnits(amount, 6)}`
  }

  // Get button text based on state
  const getButtonText = () => {
    if (existingRefund.data && !existingRefund.data.processed) {
      return 'Refund Pending'
    }
    if (!isEligible) {
      return 'Refund Unavailable'
    }
    return 'Request Refund'
  }

  // Get button icon
  const getButtonIcon = () => {
    if (existingRefund.isLoading || !eligibilityChecked) {
      return <RefreshCw className="h-4 w-4 animate-spin" />
    }
    if (existingRefund.data && !existingRefund.data.processed) {
      return <Clock className="h-4 w-4" />
    }
    if (!isEligible) {
      return <AlertCircle className="h-4 w-4" />
    }
    return <DollarSign className="h-4 w-4" />
  }

  // Get button variant based on state
  const getButtonVariant = () => {
    if (existingRefund.data && !existingRefund.data.processed) {
      return 'secondary'
    }
    if (!isEligible) {
      return 'ghost'
    }
    return variant
  }

  // Handle click
  const handleClick = () => {
    if (isEligible && !existingRefund.data) {
      setShowRefundModal(true)
    }
  }

  if (!userAddress) {
    return null // Don't show if user not connected
  }

  // Card variant for comprehensive display
  if (variant === 'card') {
    return (
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Refund Protection</span>
                  </div>
                  <Badge 
                    variant={isEligible ? 'default' : 'secondary'}
                    className={isEligible ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}
                  >
                    {isEligible ? 'Eligible' : 'Not Eligible'}
                  </Badge>
                </div>

                {/* Purchase Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      Amount
                    </div>
                    <div className="font-semibold">{formatAmount(purchaseAmount)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Purchased
                    </div>
                    <div className="font-semibold">
                      {purchaseDate.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      Creator
                    </div>
                    <div className="font-semibold truncate">{contentCreator}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Access Count</div>
                    <div className="font-semibold">{accessCount}</div>
                  </div>
                </div>

                {/* Eligibility Info */}
                {showEligibility && (
                  <Alert className={isEligible ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
                    <AlertCircle className={`h-4 w-4 ${isEligible ? 'text-green-600' : 'text-orange-600'}`} />
                    <AlertTitle className="text-sm">
                      {isEligible ? 'Refund Available' : 'Refund Not Available'}
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {eligibilityReason}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Button */}
                <Button
                  onClick={handleClick}
                  disabled={!isEligible || !!existingRefund.data}
                  variant={getButtonVariant() as any}
                  size={size}
                  className="w-full"
                >
                  {getButtonIcon()}
                  <span className="ml-2">{getButtonText()}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Refund Modal */}
          <RefundRequestModal
            isOpen={showRefundModal}
            onClose={() => setShowRefundModal(false)}
            intentId={intentId}
            purchaseAmount={purchaseAmount}
            contentTitle={contentTitle}
            contentCreator={contentCreator}
            purchaseDate={purchaseDate}
            creatorAmount={creatorAmount}
            platformFee={platformFee}
            operatorFee={operatorFee}
          />
        </motion.div>
      </TooltipProvider>
    )
  }

  // Standard button variant
  return (
    <TooltipProvider>
      <div className={className}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              whileHover={{ scale: isEligible ? 1.05 : 1 }}
              whileTap={{ scale: isEligible ? 0.95 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={handleClick}
                disabled={!isEligible || !!existingRefund.data}
                variant={getButtonVariant() as any}
                size={size}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={existingRefund.isLoading ? 'loading' : isEligible ? 'eligible' : 'not-eligible'}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    {getButtonIcon()}
                    <span>{getButtonText()}</span>
                  </motion.div>
                </AnimatePresence>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-semibold mb-1">
                {isEligible ? 'Request Refund' : 'Refund Unavailable'}
              </p>
              <p className="text-xs">{eligibilityReason}</p>
              {isEligible && (
                <div className="mt-2 text-xs space-y-1">
                  <div>Amount: {formatAmount(purchaseAmount)}</div>
                  <div>Purchased: {purchaseDate.toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Refund Modal */}
        <RefundRequestModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          intentId={intentId}
          purchaseAmount={purchaseAmount}
          contentTitle={contentTitle}
          contentCreator={contentCreator}
          purchaseDate={purchaseDate}
          creatorAmount={creatorAmount}
          platformFee={platformFee}
          operatorFee={operatorFee}
        />
      </div>
    </TooltipProvider>
  )
}

/**
 * Simplified refund button for dense layouts
 */
export function SimpleRefundButton(props: Omit<V2ContentRefundButtonProps, 'variant' | 'showEligibility'>) {
  return (
    <V2ContentRefundButton
      {...props}
      variant="ghost"
      size="sm"
      showEligibility={false}
    />
  )
}

/**
 * Card-style refund widget for content pages
 */
export function RefundProtectionCard(props: Omit<V2ContentRefundButtonProps, 'variant'>) {
  return (
    <V2ContentRefundButton
      {...props}
      variant="card"
      showEligibility={true}
    />
  )
}
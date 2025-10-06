/**
 * V2 MiniApp Purchase Button - Mobile-First V2 Purchase Interface
 * 
 * Compact, touch-optimized purchase button that integrates V2 features
 * while maintaining miniapp design patterns. Features haptic feedback,
 * quick payment method selection, and instant purchase flows.
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, 
  Zap, 
  DollarSign,
  Shield,
  Loader2,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { type Address } from 'viem'

// V2 Hooks
import { V2PaymentModal, useV2PaymentModal } from '@/components/v2/V2PaymentModal'
import { useContentPricing } from '@/hooks/contracts/v2/managers/usePriceOracle'

// V2 Messaging Integration
import { V2MiniAppSmartMessagingButton } from './V2MiniAppSmartMessagingButton'
import { useLoyaltyManager } from '@/hooks/contracts/v2/managers/useLoyaltyManager'
import { useAccount } from 'wagmi'

interface V2MiniAppPurchaseButtonProps {
  contentId: bigint
  creator: Address
  title?: string
  price?: bigint
  className?: string
  variant?: 'primary' | 'outline' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  showPricing?: boolean
  showLoyaltyDiscount?: boolean
  enablePostPurchaseMessaging?: boolean
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

export function V2MiniAppPurchaseButton({
  contentId,
  creator,
  title = 'Premium Content',
  price,
  className,
  variant = 'primary',
  size = 'md',
  showPricing = true,
  showLoyaltyDiscount = true,
  enablePostPurchaseMessaging = true,
  onSuccess,
  onError
}: V2MiniAppPurchaseButtonProps) {
  const { address } = useAccount()
  const [showMethods, setShowMethods] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'standard' | 'gasless' | 'escrow'>('standard')

  // V2 Hooks
  const pricing = useContentPricing(price || BigInt(1000000)) // 1 USDC default
  const loyalty = useLoyaltyManager()
  const userTier = loyalty.useUserTier(address)

  // V2 Payment Modal
  const paymentModal = useV2PaymentModal({
    contentId,
    creator,
    title,
    onSuccess: (txHash) => {
      console.log('V2 MiniApp purchase successful:', txHash)
      
      // Trigger post-purchase messaging if enabled
      if (enablePostPurchaseMessaging) {
        setShowPostPurchaseMessaging(true)
      }
      
      onSuccess?.(txHash)
    },
    onError: (error) => {
      console.error('V2 MiniApp purchase failed:', error)
      onError?.(error)
    }
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [showPostPurchaseMessaging, setShowPostPurchaseMessaging] = useState(false)

  const handleQuickPurchase = () => {
    paymentModal.openModal()
  }

  const formatPrice = (amount: bigint | undefined) => {
    if (!amount) return '$1.00'
    return `$${(Number(amount) / 1e6).toFixed(2)}`
  }

  const getTierName = (tierNumber: number | bigint | undefined): 'bronze' | 'silver' | 'gold' | 'platinum' => {
    if (!tierNumber) return 'bronze'
    const tier = typeof tierNumber === 'bigint' ? Number(tierNumber) : tierNumber
    const tierNames = ['bronze', 'silver', 'gold', 'platinum', 'platinum'] as const
    return tierNames[Math.min(tier, 4)] || 'bronze'
  }

  const getLoyaltyDiscount = () => {
    const tier = userTier.data
    if (!tier || !showLoyaltyDiscount) return 0
    
    const discounts = {
      bronze: 5,
      silver: 10,
      gold: 15,
      platinum: 20
    }
    
    const tierName = getTierName(tier)
    return discounts[tierName] || 0
  }

  const getDiscountedPrice = () => {
    if (!price) return BigInt(1000000)
    const discount = getLoyaltyDiscount()
    return price - (price * BigInt(discount) / BigInt(100))
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    minimal: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }

  if (size === 'sm' || variant === 'minimal') {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={className}
      >
        <Button
          onClick={handleQuickPurchase}
          disabled={isProcessing}
          className={cn(
            "relative overflow-hidden rounded-lg font-medium transition-all",
            sizeClasses[size],
            variantClasses[variant]
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          {showPricing ? formatPrice(getDiscountedPrice()) : 'Purchase'}
          
          {/* V2 Badge */}
          <Badge 
            variant="secondary" 
            className="ml-2 bg-white/20 text-white text-xs border-0"
          >
            V2
          </Badge>
        </Button>
        
        {/* Payment Modal */}
        {paymentModal.isOpen && (
          <V2PaymentModal {...paymentModal.modalProps} />
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100 shadow-sm">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Quick Purchase</h3>
                <p className="text-xs text-gray-500">V2 Enhanced</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              V2
            </Badge>
          </div>

          {/* Pricing */}
          {showPricing && (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(getDiscountedPrice())}
                </span>
                {getLoyaltyDiscount() > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400 line-through">
                      {formatPrice(price)}
                    </span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      -{getLoyaltyDiscount()}%
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Live Pricing Info */}
              {pricing.isLoading && (
                <div className="flex items-center gap-1 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <span className="text-xs text-blue-600">Fetching live prices...</span>
                </div>
              )}
            </div>
          )}

          {/* Payment Methods Preview */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setSelectedMethod('standard')}
              className={cn(
                "p-2 rounded-lg border transition-all text-xs",
                selectedMethod === 'standard'
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600"
              )}
            >
              <DollarSign className="h-3 w-3 mx-auto mb-1" />
              Standard
            </button>
            
            <button
              onClick={() => setSelectedMethod('gasless')}
              className={cn(
                "p-2 rounded-lg border transition-all text-xs",
                selectedMethod === 'gasless'
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-600"
              )}
            >
              <Zap className="h-3 w-3 mx-auto mb-1" />
              Gasless
            </button>
            
            <button
              onClick={() => setSelectedMethod('escrow')}
              className={cn(
                "p-2 rounded-lg border transition-all text-xs",
                selectedMethod === 'escrow'
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-600"
              )}
            >
              <Shield className="h-3 w-3 mx-auto mb-1" />
              Escrow
            </button>
          </div>

          {/* Purchase Button */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleQuickPurchase}
              disabled={isProcessing}
              className={cn(
                "w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg",
                sizeClasses[size]
              )}
            >
              {isProcessing ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                </motion.div>
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Purchase Now
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </motion.div>

          {/* Method Info */}
          <div className="mt-2 text-xs text-center text-gray-500">
            {selectedMethod === 'standard' && 'Traditional blockchain payment'}
            {selectedMethod === 'gasless' && 'No gas fees with permit signatures'}
            {selectedMethod === 'escrow' && 'Secure two-phase payment flow'}
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {paymentModal.isOpen && (
        <V2PaymentModal {...paymentModal.modalProps} />
      )}

      {/* Post-Purchase Messaging */}
      <AnimatePresence>
        {showPostPurchaseMessaging && enablePostPurchaseMessaging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPostPurchaseMessaging(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-background rounded-2xl p-6 shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Success Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Sparkles className="w-8 h-8 text-green-600" />
                  </motion.div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Purchase Complete!</h2>
                <p className="text-sm text-gray-600">
                  Thank you for supporting {title}. Connect with the creator!
                </p>
              </div>

              {/* Messaging CTA */}
              <div className="space-y-3 mb-6">
                <V2MiniAppSmartMessagingButton
                  creatorAddress={creator}
                  contentId={contentId.toString()}
                  context="purchase"
                  variant="default"
                  size="lg"
                  className="w-full h-12"
                  showLabel={false}
                  showUnreadBadge={false}
                  quickMessage="Thanks for the content! 🎉"
                  autoNavigate={true}
                  onMessagingStart={() => {
                    setShowPostPurchaseMessaging(false)
                  }}
                />
                <p className="text-xs text-center text-gray-500">
                  Send a quick thank you message to the creator
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPostPurchaseMessaging(false)}
                >
                  Maybe Later
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => {
                    setShowPostPurchaseMessaging(false)
                    // Navigate to content
                    window.location.href = `/mini/content/${contentId}`
                  }}
                >
                  View Content
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
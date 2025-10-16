/**
 * V2 Payment Modal - Standalone Component
 * 
 * A flexible standalone payment modal that can be positioned anywhere
 * Features token recommendations and search functionality
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'
import {
  X,
  ArrowLeft,
  Wallet,
  Zap,
  Settings,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  DollarSign,
  Star,
  TrendingUp,
  Search,
  Flame,
  Shield
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/seperator'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// V2 Hooks - using your actual contracts
import { useV2PaymentOrchestrator } from '@/hooks/contracts/v2/unified/useV2PaymentOrchestrator'
import { useDirectPayment } from '@/hooks/contracts/v2/unified/useDirectPayment'
import { useContentPricing } from '@/hooks/contracts/v2/managers/usePriceOracle'
import { useContentAccess } from '@/hooks/contracts/v2/managers/useAccessManager'
import { useLoyaltyManager } from '@/hooks/contracts/v2/managers/useLoyaltyManager'

// Loyalty Components
import { TierBadge, type LoyaltyTier } from '@/components/v2/loyalty/TierBadge'

// Refund Components
import { RefundRequestModal } from '@/components/v2/refunds/RefundRequestModal'

// Permit Payment Components
import { PermitSignatureFlow, GasSavingsCalculator } from '@/components/v2/permits'
import { usePermitPaymentManager } from '@/hooks/contracts/v2/managers/usePermitPaymentManager'

// Escrow Payment Components
import { useBaseCommerceIntegration } from '@/hooks/contracts/v2/managers/useBaseCommerceIntegration'

// Advanced Commerce Protocol Permit Components (Week 3 - V2 Completion)
import { AdvancedPermitFlow } from '@/components/v2/permits/AdvancedPermitFlow'
import { useCommerceProtocolPermit } from '@/hooks/contracts/v2/managers/useCommerceProtocolPermit'

// Animation variants
import { stepVariants, buttonVariants } from './utils/animations'

// Token service with popular Base mainnet tokens
import { tokenService, type TokenInfo, formatPrice, formatPriceChange } from './services/tokenService'

export type PaymentStep = 
  | 'payment_method'
  | 'token_selection'
  | 'permit_signature'
  | 'review'
  | 'processing'  
  | 'success'
  | 'error'

export type PaymentMethod = 'standard' | 'gasless' | 'escrow' | 'advanced'

export interface V2PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  contentId: bigint
  creator: Address
  title?: string
  description?: string
  
  // Positioning
  className?: string
  
  // Callbacks
  onSuccess?: (txHash: string) => void
  onError?: (error: Error) => void
}

export interface PaymentModalState {
  currentStep: PaymentStep
  paymentMethod: PaymentMethod
  selectedToken: TokenInfo
  permitSignature: `0x${string}` | null
  slippageBps: number
  customSlippage: string
  showAdvancedSettings: boolean
  error: string | null
  transactionHash: string | null
  progress: number
  statusMessage: string
  tokenSearch: string
  tokenPrices: Record<string, {
    price: number
    priceChange24h: number
  }>
  showGasSavings: boolean
}

export function V2PaymentModal({
  isOpen,
  onClose,
  contentId,
  creator,
  title = 'Premium Content',
  description,
  className = '',
  onSuccess,
  onError
}: V2PaymentModalProps) {
  const { address: userAddress } = useAccount()
  
  // Pricing - using your actual PriceOracle contract
  const basePrice = BigInt(1000000) // 1 USDC (6 decimals)
  const pricing = useContentPricing(basePrice)
  
  // V2 Hooks - using your actual contract system
  const { quickPurchase, isPending } = useV2PaymentOrchestrator()
  const directPayment = useDirectPayment() // Simplified payment for standard USDC
  const { hasAccess, isLoading: accessLoading } = useContentAccess(contentId)
  
  // Gasless payment functionality  
  const permitPaymentManager = usePermitPaymentManager()
  const { data: userPermitNonce } = permitPaymentManager.usePermitNonce(userAddress)
  
  // Loyalty system integration
  const { useLoyaltyDiscount, useUserStats, useUserTier } = useLoyaltyManager()
  const userStats = useUserStats(userAddress)
  const userTier = useUserTier(userAddress)
  const loyaltyDiscount = useLoyaltyDiscount(userAddress, basePrice)
  
  // Escrow payment functionality
  const escrow = useBaseCommerceIntegration()
  
  // Advanced Commerce Protocol Permit functionality (Week 3 - V2 Completion)
  const advancedPermit = useCommerceProtocolPermit()
  
  // Get tokens from service
  const allTokens = tokenService.getAllTokens()
  const recommendedTokens = tokenService.getRecommendedTokens()
  const popularTokens = tokenService.getPopularTokens()

  // Modal state
  const [state, setState] = useState<PaymentModalState>({
    currentStep: 'payment_method',
    paymentMethod: 'standard',
    selectedToken: allTokens[0], // Default to USDC
    permitSignature: null,
    slippageBps: 100, // 1% default slippage
    customSlippage: '',
    showAdvancedSettings: false,
    error: null,
    transactionHash: null,
    progress: 0,
    statusMessage: '',
    tokenSearch: '',
    tokenPrices: {},
    showGasSavings: false
  })

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setState(prev => ({
        ...prev,
        currentStep: 'payment_method',
        paymentMethod: 'standard',
        permitSignature: null,
        error: null,
        transactionHash: null,
        progress: 0,
        statusMessage: '',
        tokenSearch: '',
        showGasSavings: false
      }))
    }
  }, [isOpen])

  // Fetch token prices when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchPrices = async () => {
        const pricePromises = allTokens
          .filter(token => token.coingeckoId)
          .map(async (token) => {
            if (token.coingeckoId) {
              const priceData = await tokenService.fetchTokenPrice(token.coingeckoId)
              return {
                address: token.address,
                data: priceData
              }
            }
            return null
          })

        const results = await Promise.all(pricePromises)
        const priceMap: Record<string, { price: number; priceChange24h: number }> = {}
        
        results.forEach(result => {
          if (result && result.data) {
            priceMap[result.address] = {
              price: result.data.price,
              priceChange24h: result.data.priceChange24h
            }
          }
        })

        setState(prev => ({
          ...prev,
          tokenPrices: priceMap
        }))
      }

      fetchPrices()
    }
  }, [isOpen, allTokens])

  // Filter tokens based on search
  const filteredTokens = tokenService.searchTokens(state.tokenSearch)

  // Modal actions
  const goToStep = useCallback((step: PaymentStep) => {
    setState(prev => ({ ...prev, currentStep: step }))
  }, [])

  const selectToken = useCallback((token: TokenInfo) => {
    setState(prev => ({ ...prev, selectedToken: token }))
  }, [])
  
  const selectPaymentMethod = useCallback((method: PaymentMethod) => {
    setState(prev => ({ 
      ...prev, 
      paymentMethod: method,
      showGasSavings: method === 'gasless'
    }))
  }, [])
  
  const handlePermitSigned = useCallback((signature: `0x${string}`) => {
    setState(prev => ({ ...prev, permitSignature: signature }))
    goToStep('review')
  }, [goToStep])

  const updateSlippage = useCallback((slippage: number) => {
    setState(prev => ({ 
      ...prev, 
      slippageBps: slippage,
      customSlippage: slippage === 100 ? '' : slippage.toString()
    }))
  }, [])

  const toggleAdvancedSettings = useCallback(() => {
    setState(prev => ({ ...prev, showAdvancedSettings: !prev.showAdvancedSettings }))
  }, [])

  // Main payment execution
  const executePayment = useCallback(async () => {
    if (!userAddress || hasAccess) return

    setState(prev => ({ 
      ...prev, 
      currentStep: 'processing',
      error: null,
      progress: 10,
      statusMessage: state.paymentMethod === 'gasless' 
        ? 'Initiating gasless payment...' 
        : state.paymentMethod === 'escrow'
        ? 'Initiating secure escrow payment...'
        : 'Initiating V2 payment...'
    }))

    try {
      // ========================================================================
      // PAYMENT METHOD ROUTING
      // ========================================================================
      // Standard:  Direct USDC purchase (1-2 signatures) - BEST UX
      // Gasless:   Permit-based payment (EIP-2612) - Zero gas for user
      // Escrow:    Secure escrow with refund protection
      // ========================================================================
      
      if (state.paymentMethod === 'gasless') {
        // GASLESS PAYMENT - Uses EIP-2612 permit signatures
        setState(prev => ({ ...prev, progress: 30, statusMessage: 'Processing permit signature...' }))
        
        if (!state.permitSignature) {
          throw new Error('Permit signature required for gasless payment')
        }
        
        // Execute actual gasless payment with permit data
        setState(prev => ({ ...prev, progress: 50, statusMessage: 'Creating permit payment intent...' }))
        
        // Prepare permit data from signature
        const permitData = {
          permit: {
            permitted: {
              token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // USDC on Base
              amount: loyaltyDiscount.finalAmount || basePrice
            },
            nonce: userPermitNonce || BigInt(Date.now()), // Use actual permit nonce
            deadline: BigInt(Math.floor((Date.now() + 60 * 60 * 1000) / 1000)) // 1 hour from now
          },
          transferDetails: {
            to: creator as `0x${string}`,
            requestedAmount: loyaltyDiscount.finalAmount || basePrice
          },
          signature: state.permitSignature
        }
        
        setState(prev => ({ ...prev, progress: 70, statusMessage: 'Executing gasless payment...' }))
        
        // Validate permit data before execution
        if (!userPermitNonce) {
          throw new Error('Unable to get permit nonce. Please try again.')
        }
        
        // Use the permit payment manager to execute the payment
        const result = await permitPaymentManager.createAndExecuteWithPermit.mutateAsync({
          user: userAddress as `0x${string}`,
          creator: creator as `0x${string}`,
          paymentType: 0, // PayPerView
          paymentToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // USDC
          expectedAmount: loyaltyDiscount.finalAmount || basePrice,
          intentId: `0x${Date.now().toString(16).padStart(64, '0')}` as `0x${string}`,
          permitData
        })
        
        const txHash = typeof result === 'string' ? result : `0x${Date.now().toString(16)}`
        
        setState(prev => ({ 
          ...prev, 
          currentStep: 'success',
          progress: 100,
          statusMessage: 'Gasless payment successful!',
          transactionHash: txHash
        }))
      } else if (state.paymentMethod === 'escrow') {
        // ESCROW PAYMENT - Secure payment with buyer protection
        setState(prev => ({ ...prev, progress: 30, statusMessage: 'Initiating escrow payment...' }))
        
        // Execute escrow payment using the BaseCommerceIntegration hook
        const escrowResult = await escrow.authorizePayment.mutateAsync({
          recipient: creator as `0x${string}`,
          amount: loyaltyDiscount.finalAmount || basePrice,
          token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // USDC on Base
          expirationTime: BigInt(Math.floor((Date.now() + 30 * 60 * 1000) / 1000)), // 30 minutes from now
          contentId: contentId.toString(),
          creatorId: creator as `0x${string}`,
          metadata: JSON.stringify({
            title,
            description: description || '',
            purchaseType: 'content'
          })
        })
        
        setState(prev => ({ ...prev, progress: 50, statusMessage: 'Securing funds in escrow...' }))
        
        // Wait for authorization confirmation
        if (escrowResult) {
          setState(prev => ({ ...prev, progress: 70, statusMessage: 'Payment authorized. Funds secured.' }))
          
          // For escrow, we show success but with escrow-specific messaging
          setState(prev => ({ 
            ...prev, 
            currentStep: 'success',
            progress: 100,
            statusMessage: 'Escrow payment authorized! Funds are secured.',
            transactionHash: typeof escrowResult === 'string' ? escrowResult : `escrow_${Date.now()}`
          }))
        } else {
          throw new Error('Failed to authorize escrow payment')
        }
      } else {
        // STANDARD USDC PAYMENT - Simplified Direct Purchase
        // This flow only requires 1-2 wallet signatures instead of 3-4
        setState(prev => ({ ...prev, progress: 30, statusMessage: 'Checking USDC balance and allowance...' }))
        
        // Use direct payment for better UX (fewer wallet popups)
        const result: { success: boolean; transactionHash: `0x${string}`; contentId: bigint } = await directPayment.directPurchase.mutateAsync({
          contentId: BigInt(contentId),
          creator: creator as `0x${string}`,
          expectedPrice: loyaltyDiscount.finalAmount || basePrice
        })

        if (!result.success || !result.transactionHash) {
          throw new Error('Direct payment failed - no transaction hash')
        }

        const txHash = result.transactionHash

        setState(prev => ({ 
          ...prev, 
          progress: 70, 
          statusMessage: 'Payment confirmed!',
          transactionHash: txHash
        }))

        // Payment complete
        setState(prev => ({ 
          ...prev, 
          currentStep: 'success',
          progress: 100,
          statusMessage: 'Purchase completed successfully!',
          transactionHash: txHash
        }))
      }

      onSuccess?.(state.transactionHash || 'completed')
      setTimeout(() => onClose(), 3000)

    } catch (error) {
      console.error('Payment failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      
      // Check if this was a user cancellation
      const isCancelled = 
        errorMessage.includes('cancelled') || 
        errorMessage.includes('CANCELLED') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('rejected')
      
      setState(prev => ({ 
        ...prev, 
        currentStep: 'error',
        error: errorMessage,
        statusMessage: isCancelled ? 'Transaction cancelled' : 'Payment failed'
      }))

      onError?.(error instanceof Error ? error : new Error('Payment failed'))
    }
  }, [userAddress, hasAccess, directPayment, creator, contentId, onSuccess, onError, onClose, state.paymentMethod, state.permitSignature, state.transactionHash, loyaltyDiscount, basePrice, permitPaymentManager, userPermitNonce, escrow.authorizePayment, title, description])

  const goBack = useCallback(() => {
    const stepOrder: PaymentStep[] = ['payment_method', 'token_selection', 'permit_signature', 'review', 'processing']
    const currentIndex = stepOrder.indexOf(state.currentStep)
    if (currentIndex > 0) {
      // Special handling for permit flow
      if (state.currentStep === 'review' && state.paymentMethod === 'gasless') {
        goToStep('permit_signature')
      } else if (state.currentStep === 'permit_signature') {
        goToStep('token_selection')
      } else {
        goToStep(stepOrder[currentIndex - 1])
      }
    }
  }, [state.currentStep, state.paymentMethod, goToStep])

  const retryPayment = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentStep: 'review', 
      error: null,
      progress: 0 
    }))
  }, [])

  const copyTxHash = useCallback(async () => {
    if (state.transactionHash) {
      await navigator.clipboard.writeText(state.transactionHash)
    }
  }, [state.transactionHash])

  // Calculate display price
  const getDisplayPrice = () => {
    if (state.selectedToken.symbol === 'USDC') {
      return `${Number(basePrice) / 1e6} USDC`
    }
    if (state.selectedToken.symbol === 'WETH' && pricing.ethPrice) {
      return `${Number(pricing.ethPrice) / 1e18} ETH`
    }
    return `${Number(basePrice) / 1e6} USDC`
  }

  const canProceed = () => {
    return !!userAddress && !hasAccess && !accessLoading && !isPending
  }

  // Enhanced token display component
  const renderTokenCard = (token: TokenInfo, isSelected: boolean) => {
    const priceData = state.tokenPrices[token.address]
    const hasPrice = priceData && priceData.price > 0

    return (
      <motion.button
        key={token.address}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={() => selectToken(token)}
        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border hover:bg-muted/50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {token.logoURI ? (
              <img
                src={token.logoURI}
                alt={token.symbol}
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  // Fallback to emoji if image fails
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.setAttribute('style', 'display: block')
                }}
              />
            ) : null}
            <span className="text-2xl" style={{ display: token.logoURI ? 'none' : 'block' }}>
              {token.logo || '🪙'}
            </span>
          </div>
          <div className="text-left flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold">{token.symbol}</span>
              {token.isRecommended && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  <Star className="h-3 w-3 mr-1" />
                  Recommended
                </Badge>
              )}
              {token.isPopular && !token.isRecommended && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                  <Flame className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
              {token.isVerified && (
                <Badge variant="outline" className="text-xs">
                  ✓
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{token.description}</div>
            {hasPrice && (
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium">
                  {formatPrice(priceData.price)}
                </span>
                <span className={`text-xs ${
                  priceData.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPriceChange(priceData.priceChange24h)}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {token.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {isSelected && (
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
        )}
      </motion.button>
    )
  }

  // Render token recommendations
  const renderTokenRecommendations = () => (
    <div className="space-y-6">
      {/* Recommended Tokens */}
      {recommendedTokens.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Star className="h-4 w-4 text-yellow-500" />
            <Label className="font-medium">Recommended for Payments</Label>
            <Badge variant="outline" className="text-xs">
              {recommendedTokens.length}
            </Badge>
          </div>
          <div className="grid gap-3">
            {recommendedTokens.map((token) => 
              renderTokenCard(token, state.selectedToken.address === token.address)
            )}
          </div>
        </div>
      )}

      {/* Popular Tokens */}
      {popularTokens.filter(token => !token.isRecommended).length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Flame className="h-4 w-4 text-orange-500" />
            <Label className="font-medium">Popular on Base</Label>
            <Badge variant="outline" className="text-xs">
              {popularTokens.filter(token => !token.isRecommended).length}
            </Badge>
          </div>
          <div className="grid gap-3">
            {popularTokens
              .filter(token => !token.isRecommended)
              .map((token) => 
                renderTokenCard(token, state.selectedToken.address === token.address)
              )}
          </div>
        </div>
      )}

      {/* All Other Tokens */}
      {allTokens.filter(token => !token.isPopular && !token.isRecommended).length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <Label className="font-medium">More Tokens</Label>
            <Badge variant="outline" className="text-xs">
              {allTokens.filter(token => !token.isPopular && !token.isRecommended).length}
            </Badge>
          </div>
          <div className="grid gap-3">
            {allTokens
              .filter(token => !token.isPopular && !token.isRecommended)
              .map((token) => 
                renderTokenCard(token, state.selectedToken.address === token.address)
              )}
          </div>
        </div>
      )}
    </div>
  )

  // Render step content
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'payment_method':
        return (
          <motion.div
            key="payment_method"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Choose Payment Method</h3>
              <p className="text-muted-foreground text-sm">
                Select how you&apos;d like to pay for {title}
              </p>
            </div>

            <div className="space-y-4">
              {/* Standard Payment */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => selectPaymentMethod('standard')}
                className={`w-full p-6 rounded-lg border transition-colors text-left ${
                  state.paymentMethod === 'standard'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Wallet className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Standard Payment</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Pay with any supported token using your wallet
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">All Tokens</Badge>
                        <Badge variant="outline" className="text-xs">Direct Control</Badge>
                      </div>
                    </div>
                  </div>
                  {state.paymentMethod === 'standard' && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </motion.button>

              {/* Gasless Payment */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => selectPaymentMethod('gasless')}
                className={`w-full p-6 rounded-lg border transition-colors text-left ${
                  state.paymentMethod === 'gasless'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold">Gasless Payment</h4>
                        <Badge className="bg-green-100 text-green-800 text-xs">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Pay without gas fees using permit signatures
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">No Gas Fees</Badge>
                        <Badge variant="outline" className="text-xs">EIP-712</Badge>
                        <Badge variant="outline" className="text-xs">USDC Only</Badge>
                      </div>
                    </div>
                  </div>
                  {state.paymentMethod === 'gasless' && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </motion.button>
              
              {/* Escrow Payment */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => selectPaymentMethod('escrow')}
                className={`w-full p-6 rounded-lg border transition-colors text-left ${
                  state.paymentMethod === 'escrow'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold">Secure Escrow</h4>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Protected</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Two-phase payment with escrow protection and refund guarantee
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">Payment Protection</Badge>
                        <Badge variant="outline" className="text-xs">Refund Guarantee</Badge>
                        <Badge variant="outline" className="text-xs">30min Window</Badge>
                      </div>
                    </div>
                  </div>
                  {state.paymentMethod === 'escrow' && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </motion.button>

              {/* Advanced Commerce Protocol Permit */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => selectPaymentMethod('advanced')}
                className={`w-full p-6 rounded-lg border transition-colors text-left ${
                  state.paymentMethod === 'advanced'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold">Advanced Permits</h4>
                        <Badge className="bg-purple-100 text-purple-800 text-xs">Enterprise</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Enhanced gasless payments with batch operations and advanced validation
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">Batch Payments</Badge>
                        <Badge variant="outline" className="text-xs">Advanced Analytics</Badge>
                        <Badge variant="outline" className="text-xs">No Gas</Badge>
                      </div>
                    </div>
                  </div>
                  {state.paymentMethod === 'advanced' && (
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </motion.button>
            </div>

            {/* Gas Savings Preview for Gasless */}
            {state.paymentMethod === 'gasless' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <GasSavingsCalculator
                  purchaseAmount={basePrice}
                  variant="compact"
                  className="mt-4"
                />
              </motion.div>
            )}

            <Button 
              onClick={() => {
                // Escrow payments skip token selection and go directly to review
                if (state.paymentMethod === 'escrow') {
                  goToStep('review')
                } else if (state.paymentMethod === 'advanced') {
                  // Advanced permits skip token selection and go to review with AdvancedPermitFlow
                  goToStep('review')
                } else {
                  goToStep('token_selection')
                }
              }}
              disabled={!canProceed()}
              className="w-full"
              size="lg"
            >
              Continue
            </Button>
          </motion.div>
        )

      case 'token_selection':
        return (
          <motion.div
            key="token_selection"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              {description && (
                <p className="text-muted-foreground text-sm">{description}</p>
              )}
            </div>

            {/* Token Search */}
            <div className="space-y-3">
              <Label>Search Tokens</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, symbol, or category..."
                  value={state.tokenSearch}
                  onChange={(e) => setState(prev => ({ ...prev, tokenSearch: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Token Selection */}
            <div className="max-h-96 overflow-y-auto">
              {state.tokenSearch ? (
                <div className="space-y-2">
                  <Label>Search Results</Label>
                  {filteredTokens.length > 0 ? (
                    <div className="grid gap-3">
                      {filteredTokens.map((token) => 
                        renderTokenCard(token, state.selectedToken.address === token.address)
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No tokens found matching &quot;{state.tokenSearch}&quot;</p>
                    </div>
                  )}
                </div>
              ) : (
                renderTokenRecommendations()
              )}
            </div>

            <Button 
              onClick={() => {
                if (state.paymentMethod === 'gasless') {
                  goToStep('permit_signature')
                } else if (state.paymentMethod === 'escrow') {
                  // Escrow payments should not reach token selection, but handle gracefully
                  goToStep('review')
                } else {
                  goToStep('review')
                }
              }}
              disabled={!canProceed()}
              className="w-full"
              size="lg"
            >
              Continue
            </Button>
          </motion.div>
        )

      case 'permit_signature':
        return (
          <motion.div
            key="permit_signature"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6"
          >
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-xl font-semibold">Sign Permit</h3>
              <Badge className="bg-green-100 text-green-800 text-xs">Gasless</Badge>
            </div>

            <PermitSignatureFlow
              intentId={`0x${contentId.toString(16).padStart(64, '0')}` as `0x${string}`}
              amount={loyaltyDiscount.finalAmount || basePrice}
              contentTitle={title}
              onSuccess={handlePermitSigned}
              onError={(error) => {
                setState(prev => ({ ...prev, error: error.message }))
              }}
              onCancel={goBack}
            />
          </motion.div>
        )

      case 'review':
        return (
          <motion.div
            key="review"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6"
          >
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-xl font-semibold">Review Payment</h3>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Content</span>
                  <span className="font-medium">{title}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Token</span>
                  <div className="flex items-center space-x-2">
                    <span>{state.selectedToken.logo}</span>
                    <span className="font-medium">{state.selectedToken.symbol}</span>
                    {state.selectedToken.isRecommended && (
                      <Badge variant="outline" className="text-xs">Recommended</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <div className="text-right">
                    <span className="font-medium text-primary">{getDisplayPrice()}</span>
                    {state.paymentMethod === 'gasless' && (
                      <div className="text-xs text-green-600">+ No gas fees</div>
                    )}
                    {state.paymentMethod === 'escrow' && (
                      <div className="text-xs text-blue-600">+ Escrow protection</div>
                    )}
                  </div>
                </div>

                {/* Loyalty Discount Section */}
                {loyaltyDiscount.discountAmount && loyaltyDiscount.discountAmount > BigInt(0) && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Original Price</span>
                      <span className="text-muted-foreground line-through">{getDisplayPrice()}</span>
                    </div>
                    <div className="flex items-center justify-between text-green-600">
                      <div className="flex items-center space-x-2">
                        <span>Loyalty Discount</span>
                        {userTier.data !== undefined && (
                          <TierBadge 
                            tier={userTier.data as LoyaltyTier} 
                            size="xs" 
                            showLabel={false}
                          />
                        )}
                      </div>
                      <span>-${Number(loyaltyDiscount.discountAmount) / 1e6}</span>
                    </div>
                  </>
                )}

                {/* Points Earning Preview */}
                {userStats.data && (
                  <div className="flex items-center justify-between text-blue-600">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3" />
                      <span className="text-sm">Points to Earn</span>
                    </div>
                    <span className="text-sm font-medium">
                      +{Math.floor(Number(loyaltyDiscount.finalAmount || basePrice) / 1e6 * 10)} pts
                    </span>
                  </div>
                )}

                <Separator />
                
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className={loyaltyDiscount.discountAmount && loyaltyDiscount.discountAmount > BigInt(0) ? 'text-green-600' : ''}>
                    ${Number(loyaltyDiscount.finalAmount || basePrice) / 1e6}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Gas Savings for Gasless Payments */}
            {state.paymentMethod === 'gasless' && (
              <GasSavingsCalculator
                purchaseAmount={loyaltyDiscount.finalAmount || basePrice}
                variant="detailed"
                showDetailed={true}
                className="mb-4"
              />
            )}

            {/* Advanced Settings */}
            <div className="space-y-3">
              <Button
                variant="ghost"
                onClick={toggleAdvancedSettings}
                className="w-full justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Advanced Settings</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${state.showAdvancedSettings ? 'rotate-180' : ''}`} />
              </Button>
              
              <AnimatePresence>
                {state.showAdvancedSettings && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 border rounded-lg p-4"
                  >
                    <div>
                      <Label className="text-sm">Slippage Tolerance</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {[50, 100, 200, 500].map((slippage) => (
                          <Button
                            key={slippage}
                            variant={state.slippageBps === slippage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateSlippage(slippage)}
                          >
                            {slippage / 100}%
                          </Button>
                        ))}
                      </div>
                      <div className="mt-2">
                        <Input
                          placeholder="Custom %"
                          value={state.customSlippage}
                          onChange={(e) => {
                            const value = e.target.value
                            setState(prev => ({ ...prev, customSlippage: value }))
                            const numValue = parseFloat(value)
                            if (!isNaN(numValue) && numValue > 0) {
                              updateSlippage(numValue * 100)
                            }
                          }}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Advanced Permit Flow Integration */}
            {state.paymentMethod === 'advanced' ? (
              <div className="space-y-4">
                <AdvancedPermitFlow
                  paymentRequest={{
                    paymentType: 0, // PayPerView
                    creator: creator,
                    contentId: contentId,
                    paymentToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // USDC on Base
                    maxSlippage: BigInt(500), // 5% slippage tolerance
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now
                  }}
                  onSuccess={(result) => {
                    setState(prev => ({ 
                      ...prev, 
                      currentStep: 'success',
                      transactionHash: result.txHash,
                      statusMessage: 'Advanced permit payment successful!'
                    }))
                    onSuccess?.(result.txHash)
                  }}
                  onError={(error) => {
                    setState(prev => ({ 
                      ...prev, 
                      currentStep: 'error',
                      error: error.message,
                      statusMessage: 'Advanced permit payment failed'
                    }))
                    onError?.(error)
                  }}
                  onCancel={goBack}
                  enableBatchMode={false}
                  showAnalytics={true}
                  allowContextValidation={true}
                  className="w-full"
                />
              </div>
            ) : (
              <Button 
                onClick={executePayment}
                disabled={!canProceed() || (state.paymentMethod === 'gasless' && !state.permitSignature)}
                className="w-full"
                size="lg"
              >
                {state.paymentMethod === 'gasless' ? (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Pay {getDisplayPrice()} (Gasless)
                  </>
                ) : state.paymentMethod === 'escrow' ? (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Secure Pay {getDisplayPrice()}
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Pay {getDisplayPrice()}
                  </>
                )}
              </Button>
            )}
          </motion.div>
        )

      case 'processing':
        return (
          <motion.div
            key="processing"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6 text-center"
          >
            <div className="space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="h-16 w-16 text-primary mx-auto" />
              </motion.div>
              
              <div>
                <h3 className="text-xl font-semibold mb-2">Processing Payment</h3>
                <p className="text-muted-foreground">{state.statusMessage}</p>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className="h-2 bg-primary rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${state.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )

      case 'success':
        return (
          <motion.div
            key="success"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
            >
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            </motion.div>
            
            <div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                {state.paymentMethod === 'gasless' 
                  ? 'Gasless Payment Successful!' 
                  : state.paymentMethod === 'escrow'
                  ? 'Escrow Payment Authorized!'
                  : state.paymentMethod === 'advanced'
                  ? 'Advanced Permit Payment Successful!'
                  : 'Payment Successful!'
                }
              </h3>
              <p className="text-muted-foreground">
                {state.paymentMethod === 'gasless' 
                  ? 'You paid without gas fees and now have access to the content'
                  : state.paymentMethod === 'escrow'
                  ? 'Your funds are secured in escrow. Complete the payment to transfer to seller.'
                  : state.paymentMethod === 'advanced'
                  ? 'Payment completed with advanced permit validation and enhanced analytics'
                  : 'You now have access to the content'
                }
              </p>
              {state.paymentMethod === 'gasless' && (
                <div className="mt-2 p-2 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      Saved on gas fees with permit signature
                    </span>
                  </div>
                </div>
              )}
              {state.paymentMethod === 'escrow' && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">
                      Payment is secured and protected by escrow
                    </span>
                  </div>
                </div>
              )}
              {state.paymentMethod === 'advanced' && (
                <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-purple-700 font-medium">
                      Advanced permit with analytics and batch capabilities
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {state.transactionHash && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Transaction Hash</Label>
                <div className="flex items-center space-x-2 text-xs font-mono bg-muted p-2 rounded">
                  <span className="truncate">{state.transactionHash}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyTxHash}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </motion.div>
        )

      case 'error':
        // Check if this is a cancellation vs actual error
        const isCancellation = 
          state.error?.includes('cancelled') || 
          state.error?.includes('CANCELLED') ||
          state.error?.includes('denied') ||
          state.error?.includes('rejected')
        
        return (
          <motion.div
            key="error"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6 text-center"
          >
            {isCancellation ? (
              <X className="h-16 w-16 text-amber-500 mx-auto" />
            ) : (
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            )}
            
            <div>
              <h3 className={`text-xl font-semibold mb-2 ${isCancellation ? 'text-amber-700' : 'text-red-700'}`}>
                {isCancellation ? 'Transaction Cancelled' : 'Payment Failed'}
              </h3>
              <p className="text-muted-foreground text-sm">{state.error}</p>
            </div>

            <div className="space-y-2">
              {!isCancellation && (
                <Button onClick={retryPayment} className="w-full">
                  Try Again
                </Button>
              )}
              <Button variant="outline" onClick={onClose} className="w-full">
                {isCancellation ? 'Got it' : 'Close'}
              </Button>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  // Handle different states without Dialog
  if (!userAddress) {
    return (
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center space-y-4">
            <Wallet className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">Wallet Required</h3>
            <p className="text-muted-foreground">Please connect your wallet to make a payment</p>
            <Button onClick={onClose} variant="outline" className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasAccess) {
    return (
      <>
        <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold">Already Purchased</h3>
              <p className="text-muted-foreground">You already have access to this content</p>
              
              {/* Refund section for purchased content */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Need a refund? You can request one within 30 days of purchase.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowRefundModal(true)} 
                    variant="outline"
                    className="flex-1"
                  >
                    Request Refund
                  </Button>
                  <Button onClick={onClose} className="flex-1">
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refund Modal */}
        <RefundRequestModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          intentId={`0x${contentId.toString(16).padStart(64, '0')}` as `0x${string}`}
          purchaseAmount={basePrice}
          contentTitle={title}
          contentCreator={creator}
          purchaseDate={new Date()} // In production, get actual purchase date
        />
      </>
    )
  }

  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg mx-4"
      >
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-semibold">V2 Payment</span>
              <Badge variant="outline" className="text-xs">Enhanced</Badge>
              {/* Loyalty Tier Badge in Header */}
              {userTier.data !== undefined && userAddress && (
                <TierBadge 
                  tier={userTier.data as LoyaltyTier} 
                  size="sm" 
                  variant="compact"
                />
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* Quick loyalty info */}
              {userStats.data && userAddress && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Available Points</div>
                  <div className="text-sm font-medium text-primary">
                    {Number(userStats.data[1]).toLocaleString()}
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={state.currentStep === 'processing'}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
              Powered by V2 Commerce Protocol • Secure payments on Base
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default V2PaymentModal
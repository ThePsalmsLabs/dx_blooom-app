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
  Flame
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
import { useContentPricing } from '@/hooks/contracts/v2/managers/usePriceOracle'
import { useContentAccess } from '@/hooks/contracts/v2/managers/useAccessManager'

// Animation variants
import { stepVariants, buttonVariants } from './utils/animations'

// Token service with popular Base mainnet tokens
import { tokenService, type TokenInfo, formatPrice, formatPriceChange } from './services/tokenService'

export type PaymentStep = 
  | 'token_selection'
  | 'review'
  | 'processing'  
  | 'success'
  | 'error'

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
  selectedToken: TokenInfo
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
  
  // V2 Hooks - using your actual contract system
  const { quickPurchase, isPending } = useV2PaymentOrchestrator()
  const { hasAccess, isLoading: accessLoading } = useContentAccess(contentId)
  
  // Pricing - using your actual PriceOracle contract
  const basePrice = BigInt(1000000) // 1 USDC (6 decimals)
  const pricing = useContentPricing(basePrice)
  
  // Get tokens from service
  const allTokens = tokenService.getAllTokens()
  const recommendedTokens = tokenService.getRecommendedTokens()
  const popularTokens = tokenService.getPopularTokens()

  // Modal state
  const [state, setState] = useState<PaymentModalState>({
    currentStep: 'token_selection',
    selectedToken: allTokens[0], // Default to USDC
    slippageBps: 100, // 1% default slippage
    customSlippage: '',
    showAdvancedSettings: false,
    error: null,
    transactionHash: null,
    progress: 0,
    statusMessage: '',
    tokenSearch: '',
    tokenPrices: {}
  })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setState(prev => ({
        ...prev,
        currentStep: 'token_selection',
        error: null,
        transactionHash: null,
        progress: 0,
        statusMessage: '',
        tokenSearch: ''
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
      statusMessage: 'Initiating V2 payment...'
    }))

    try {
      setState(prev => ({ ...prev, progress: 30, statusMessage: 'Creating payment intent...' }))
      
      const result = await quickPurchase.mutateAsync({
        creator,
        contentId
      })

      setState(prev => ({ ...prev, progress: 70, statusMessage: 'Confirming transaction...' }))
      await new Promise(resolve => setTimeout(resolve, 2000))

      const txHash = typeof result === 'string' ? result : 'completed'
      
      setState(prev => ({ 
        ...prev, 
        currentStep: 'success',
        progress: 100,
        statusMessage: 'Payment successful!',
        transactionHash: txHash
      }))

      onSuccess?.(txHash)
      setTimeout(() => onClose(), 3000)

    } catch (error) {
      console.error('V2 Payment failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      
      setState(prev => ({ 
        ...prev, 
        currentStep: 'error',
        error: errorMessage,
        statusMessage: 'Payment failed'
      }))

      onError?.(error instanceof Error ? error : new Error('Payment failed'))
    }
  }, [userAddress, hasAccess, quickPurchase, creator, contentId, onSuccess, onError, onClose])

  const goBack = useCallback(() => {
    const stepOrder: PaymentStep[] = ['token_selection', 'review', 'processing']
    const currentIndex = stepOrder.indexOf(state.currentStep)
    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1])
    }
  }, [state.currentStep, goToStep])

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
                      <p>No tokens found matching "{state.tokenSearch}"</p>
                    </div>
                  )}
                </div>
              ) : (
                renderTokenRecommendations()
              )}
            </div>

            <Button 
              onClick={() => goToStep('review')}
              disabled={!canProceed()}
              className="w-full"
              size="lg"
            >
              Continue
            </Button>
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
                  <span className="font-medium text-primary">{getDisplayPrice()}</span>
                </div>

                <Separator />
                
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{getDisplayPrice()}</span>
                </div>
              </CardContent>
            </Card>

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

            <Button 
              onClick={executePayment}
              disabled={!canProceed()}
              className="w-full"
              size="lg"
            >
              <Zap className="h-4 w-4 mr-2" />
              Pay {getDisplayPrice()}
            </Button>
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
              <h3 className="text-xl font-semibold text-green-700 mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground">You now have access to the content</p>
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
        return (
          <motion.div
            key="error"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="space-y-6 text-center"
          >
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            
            <div>
              <h3 className="text-xl font-semibold text-red-700 mb-2">Payment Failed</h3>
              <p className="text-muted-foreground text-sm">{state.error}</p>
            </div>

            <div className="space-y-2">
              <Button onClick={retryPayment} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Close
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
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold">Already Purchased</h3>
            <p className="text-muted-foreground">You already have access to this content</p>
            <Button onClick={onClose} className="w-full">
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
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
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={state.currentStep === 'processing'}
            >
              <X className="h-4 w-4" />
            </Button>
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
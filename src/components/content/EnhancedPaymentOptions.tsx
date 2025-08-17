/**
 * Enhanced Multi-Token Payment Options Display
 * 
 * Beautiful, intuitive payment method selection with real balance display,
 * smart affordability indicators, and seamless UX.
 */

import React from 'react'
import Image from 'next/image'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatTokenBalance } from '@/lib/utils'
import { UnifiedPurchaseFlowResult, PaymentMethod } from '@/hooks/business/workflows'

interface EnhancedPaymentOptionsProps {
  purchaseFlow: UnifiedPurchaseFlowResult
  onPaymentMethodSelect: (method: PaymentMethod) => void
}

export function EnhancedPaymentOptions({ 
  purchaseFlow,
  onPaymentMethodSelect
}: EnhancedPaymentOptionsProps) {
  if (purchaseFlow.availableMethods.length <= 1) {
    return null // Don't show options if only one method available
  }

  // Get enhanced token information for all methods
  const tokenOptions = purchaseFlow.availableMethods.map((methodConfig) => {
    const method = methodConfig.id
    const tokenInfo = purchaseFlow.supportedTokens.find(token => {
      if (method === PaymentMethod.ETH) return token.isNative
      if (method === PaymentMethod.USDC) return token.symbol === 'USDC'
      if (method === PaymentMethod.WETH) return token.symbol === 'WETH'
      if (method === PaymentMethod.CBETH) return token.symbol === 'cbETH'
      if (method === PaymentMethod.DAI) return token.symbol === 'DAI'
      return false
    })

    return {
      method,
      config: methodConfig,
      token: tokenInfo,
      isSelected: method === purchaseFlow.selectedMethod,
      canAfford: tokenInfo?.hasEnoughBalance || false,
      needsApproval: tokenInfo?.needsApproval || false
    }
  }).sort((a, b) => {
    // Sort by: 1. USDC first (prioritized), 2. Can afford, 3. Selected, 4. No approval needed, 5. Method order
    const aIsUSDC = a.token?.symbol === 'USDC'
    const bIsUSDC = b.token?.symbol === 'USDC'
    if (aIsUSDC !== bIsUSDC) return aIsUSDC ? -1 : 1
    
    if (a.canAfford !== b.canAfford) return b.canAfford ? 1 : -1
    if (a.isSelected !== b.isSelected) return b.isSelected ? 1 : -1
    if (a.needsApproval !== b.needsApproval) return a.needsApproval ? 1 : -1
    return a.method - b.method
  })

  const affordableCount = tokenOptions.filter(opt => opt.canAfford).length
  const hasSelectedAffordable = tokenOptions.some(opt => opt.isSelected && opt.canAfford)

  return (
    <div className="space-y-4">
      {/* Header with smart messaging */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">Choose Payment Method</span>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
            {tokenOptions.length} option{tokenOptions.length > 1 ? 's' : ''} available
          </Badge>
        </div>
        {hasSelectedAffordable && (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Ready to purchase</span>
          </div>
        )}
      </div>

      {/* Enhanced Token Options Grid - Responsive */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tokenOptions.map(({ method, config, token, isSelected, canAfford, needsApproval }) => {
          // Get token-specific styling and images
          const getTokenInfo = () => {
            switch (method) {
              case PaymentMethod.ETH:
                return { 
                  image: '/images/eth-logo.png',
                  gradient: 'from-purple-500 to-purple-600',
                  bg: 'bg-purple-50', 
                  border: 'border-purple-200',
                  text: 'text-purple-700'
                }
              case PaymentMethod.WETH:
                return { 
                  image: '/images/weth-logo.jpeg',
                  gradient: 'from-blue-500 to-blue-600',
                  bg: 'bg-blue-50', 
                  border: 'border-blue-200',
                  text: 'text-blue-700'
                }
              case PaymentMethod.CBETH:
                return { 
                  image: '/images/cb-eth-logo.png',
                  gradient: 'from-orange-500 to-orange-600',
                  bg: 'bg-orange-50', 
                  border: 'border-orange-200',
                  text: 'text-orange-700'
                }
              case PaymentMethod.DAI:
                return { 
                  image: '/images/DAI-logo.png',
                  gradient: 'from-yellow-500 to-yellow-600',
                  bg: 'bg-yellow-50', 
                  border: 'border-yellow-200',
                  text: 'text-yellow-700'
                }
              default: // USDC
                return { 
                  image: '/images/usdc-logo.webp',
                  gradient: 'from-green-500 to-green-600',
                  bg: 'bg-green-50', 
                  border: 'border-green-200',
                  text: 'text-green-700'
                }
            }
          }

          const tokenInfo = getTokenInfo()
          const balance = token?.balance || BigInt(0)
          const required = token?.requiredAmount || BigInt(0)
          const decimals = token?.decimals || 18
          const symbol = token?.symbol || 'Token'

          return (
            <button
              key={method}
              onClick={() => onPaymentMethodSelect(method)}
              className={`
                group relative w-full p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 min-h-[120px] sm:min-h-[140px]
                ${isSelected
                  ? `${tokenInfo.border} ${tokenInfo.bg} shadow-md transform scale-[1.02]` 
                  : canAfford 
                    ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:transform hover:scale-[1.01]' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm opacity-80'
                }
              `}
            >
              <div className="flex flex-col space-y-3 h-full">
                {/* Top: Token Icon and Name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {/* Token Icon */}
                    <div className={`
                      relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
                      bg-gradient-to-br ${tokenInfo.gradient} shadow-lg overflow-hidden
                    `}>
                      <Image
                        src={tokenInfo.image}
                        alt={`${symbol} logo`}
                        width={32}
                        height={32}
                        className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                      />
                      {isSelected && canAfford && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Token Name and Status */}
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{symbol}</div>
                      <div className="text-xs sm:text-sm text-gray-600 truncate">{config.name}</div>
                    </div>
                  </div>
                  
                  {/* Status Badges - Mobile Responsive */}
                  <div className="flex flex-wrap gap-1">
                    {needsApproval && canAfford && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 hidden sm:inline-flex">
                        Approval needed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bottom: Balance and Requirements */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="text-left">
                      <div className="text-xs text-gray-500">Your balance</div>
                      <div className="text-sm font-bold text-gray-900">
                        {formatTokenBalance(balance, decimals, symbol)}
                      </div>
                    </div>
                    
                    {required > BigInt(0) && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Required</div>
                        <div className="text-sm font-medium text-gray-700">
                          {formatTokenBalance(required, decimals, symbol)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{config.estimatedTime}</span>
                        <span>•</span>
                        <span className={`
                          ${config.gasEstimate === 'Low' ? 'text-green-600' : 
                            config.gasEstimate === 'Medium' ? 'text-yellow-600' : 'text-red-600'}
                        `}>
                          {config.gasEstimate} gas
                        </span>
                      </div>
                      
                      {canAfford ? (
                        <div className="text-xs text-green-600 font-medium flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">Sufficient</span>
                        </div>
                      ) : (
                        <div className="text-xs text-red-500 font-medium flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">Insufficient</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* No overlay - always show the balance information */}

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute inset-0 rounded-xl border-2 border-blue-400 pointer-events-none">
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Smart Status Messages */}
      {affordableCount === 0 ? (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <span className="font-medium">Available Payment Methods</span>
            <span className="mt-1 text-sm block">
              You can select any payment method above. Add funds to complete your purchase: {tokenOptions.map(opt => opt.token?.symbol).filter(Boolean).join(', ')}
            </span>
          </AlertDescription>
        </Alert>
      ) : !hasSelectedAffordable ? (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <span className="font-medium">Select a payment method to continue</span>
            <span className="mt-1 text-sm block">
              {affordableCount} payment option{affordableCount > 1 ? 's' : ''} available with sufficient balance, or select any method to see requirements
            </span>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <span className="font-medium">Ready to purchase with {purchaseFlow.selectedToken?.symbol}</span>
            <span className="mt-1 text-sm block">
              {tokenOptions.find(opt => opt.isSelected)?.needsApproval ? 'Token approval required before purchase' : 'Click purchase to complete transaction'}
            </span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

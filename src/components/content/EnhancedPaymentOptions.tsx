/**
 * Enhanced Multi-Token Payment Options Display
 * 
 * Beautiful, intuitive payment method selection with real balance display,
 * smart affordability indicators, and seamless UX.
 */

import React from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
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
    // Sort by: 1. Can afford, 2. Selected, 3. No approval needed, 4. Method order
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

      {/* Enhanced Token Options Grid */}
      <div className="space-y-3">
        {tokenOptions.map(({ method, config, token, isSelected, canAfford, needsApproval }) => {
          // Get token-specific styling
          const getTokenStyle = () => {
            switch (method) {
              case PaymentMethod.ETH:
                return { 
                  icon: '⟠', 
                  gradient: 'from-purple-500 to-purple-600',
                  bg: 'bg-purple-50', 
                  border: 'border-purple-200',
                  text: 'text-purple-700'
                }
              case PaymentMethod.WETH:
                return { 
                  icon: '🔗', 
                  gradient: 'from-blue-500 to-blue-600',
                  bg: 'bg-blue-50', 
                  border: 'border-blue-200',
                  text: 'text-blue-700'
                }
              case PaymentMethod.CBETH:
                return { 
                  icon: '🏛️', 
                  gradient: 'from-orange-500 to-orange-600',
                  bg: 'bg-orange-50', 
                  border: 'border-orange-200',
                  text: 'text-orange-700'
                }
              case PaymentMethod.DAI:
                return { 
                  icon: '🔶', 
                  gradient: 'from-yellow-500 to-yellow-600',
                  bg: 'bg-yellow-50', 
                  border: 'border-yellow-200',
                  text: 'text-yellow-700'
                }
              default:
                return { 
                  icon: '💵', 
                  gradient: 'from-green-500 to-green-600',
                  bg: 'bg-green-50', 
                  border: 'border-green-200',
                  text: 'text-green-700'
                }
            }
          }

          const style = getTokenStyle()
          const balance = token?.balance || BigInt(0)
          const required = token?.requiredAmount || BigInt(0)
          const decimals = token?.decimals || 18
          const symbol = token?.symbol || 'Token'

          return (
            <button
              key={method}
              onClick={() => onPaymentMethodSelect(method)}
              className={`
                group relative w-full p-4 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? `${style.border} ${style.bg} shadow-md scale-[1.02]` 
                  : canAfford 
                    ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm opacity-80'
                }
              `}
            >
              <div className="flex items-center justify-between">
                {/* Left: Token Info */}
                <div className="flex items-center space-x-3">
                  {/* Token Icon */}
                  <div className={`
                    relative w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold
                    bg-gradient-to-br ${style.gradient} text-white shadow-lg
                  `}>
                    {style.icon}
                    {isSelected && canAfford && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>

                  {/* Token Details */}
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{symbol}</span>
                      {needsApproval && canAfford && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          Approval needed
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{config.name}</div>
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
                  </div>
                </div>

                {/* Right: Balance Info */}
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(balance, decimals, symbol)}
                  </div>
                  <div className="text-xs text-gray-500">Your balance</div>
                  
                  {required > BigInt(0) && (
                    <div className="mt-1 pt-1 border-t border-gray-100">
                      <div className="text-xs text-gray-600">
                        Need: {formatCurrency(required, decimals, symbol)}
                      </div>
                      {canAfford ? (
                        <div className="text-xs text-green-600 font-medium">
                          ✓ Sufficient funds
                        </div>
                      ) : (
                        <div className="text-xs text-red-500 font-medium">
                          ⚠️ Insufficient funds
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* No overlay - always show the balance information */}

              {/* Selection Indicator */}
              {isSelected && canAfford && (
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

/**
 * Smart Payment Selector Component
 * 
 * A reusable component that analyzes user token balances and provides intelligent
 * payment method recommendations. This component can be used independently across
 * different purchase flows throughout your platform.
 * 
 * Real Implementation Features:
 * - Connects to your actual PaymentMethod enum
 * - Uses real token balance data and pricing
 * - Integrates with your existing workflow patterns
 * - Provides actionable user guidance
 * - Handles edge cases and error states
 */

import React, { useMemo, useCallback, useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Zap, DollarSign, Coins, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  useTokenBalances, 
  formatUSDValue, 
  formatTokenAmount,
  type TokenInfo 
} from '@/hooks/web3/useTokenBalances'
import { PaymentMethod } from '@/hooks/business/workflows'

// Import Phase 3 swap functionality
import { SwapModal } from '@/components/web3/portfolio/SwapModal'

/**
 * Payment Option Analysis Result
 * Provides comprehensive analysis of each payment option for the user
 */
interface PaymentOptionAnalysis {
  readonly method: PaymentMethod
  readonly token: TokenInfo | null
  readonly name: string
  readonly symbol: string
  readonly icon: React.ComponentType<{ className?: string }>
  readonly status: 'available' | 'insufficient' | 'unavailable' | 'loading'
  readonly currentBalance: number
  readonly currentBalanceFormatted: string
  readonly currentBalanceUSD: number
  readonly requiredAmount: number
  readonly requiredAmountFormatted: string
  readonly shortfall: number
  readonly shortfallFormatted: string
  readonly canAfford: boolean
  readonly efficiency: number // 0-100 score based on gas costs, speed, etc.
  readonly recommendation: 'best' | 'good' | 'acceptable' | 'avoid'
}

/**
 * Component Props Interface
 * Enhanced with Phase 3 swap integration
 */
interface SmartPaymentSelectorProps {
  readonly requiredAmountUSDC: bigint
  readonly onPaymentMethodSelect: (method: PaymentMethod, analysis: PaymentOptionAnalysis) => void
  readonly onInsufficientBalance: (analysis: PaymentOptionAnalysis) => void
  readonly selectedMethod?: PaymentMethod
  readonly showDetailedAnalysis?: boolean
  readonly allowedMethods?: PaymentMethod[]
  readonly className?: string
  readonly enableSwapIntegration?: boolean // New: Enable built-in swap modal
  readonly onSwapRequested?: (requiredToken: TokenInfo, requiredAmount: number) => void // Backward compatibility
}

/**
 * Payment Method Configurations
 * Maps to your existing PaymentMethod enum with efficiency scoring
 */
const PAYMENT_METHOD_CONFIGS = [
  {
    method: PaymentMethod.USDC,
    name: 'USDC Direct',
    symbol: 'USDC',
    icon: DollarSign,
    baseEfficiency: 95, // High efficiency - direct payment, stable value
    gasMultiplier: 1.0,
    speedScore: 90
  },
  {
    method: PaymentMethod.ETH,
    name: 'Ethereum',
    symbol: 'ETH',
    icon: Zap,
    baseEfficiency: 85, // High efficiency - native token, fast
    gasMultiplier: 1.2,
    speedScore: 95
  },
  {
    method: PaymentMethod.OTHER_TOKEN,
    name: 'Other Tokens',
    symbol: 'OTHER',
    icon: Coins,
    baseEfficiency: 60, // Lower efficiency - requires swaps
    gasMultiplier: 2.5,
    speedScore: 60
  }
] as const

/**
 * Main Smart Payment Selector Component
 */
export const SmartPaymentSelector: React.FC<SmartPaymentSelectorProps> = ({
  requiredAmountUSDC,
  onPaymentMethodSelect,
  onInsufficientBalance,
  selectedMethod,
  showDetailedAnalysis = true,
  allowedMethods,
  className,
  enableSwapIntegration = true,
  onSwapRequested
}) => {
  const { 
    tokens, 
    isLoading, 
    canAffordContentPrice,
    getPaymentCapabilities,
    refreshBalances
  } = useTokenBalances()
  
  // Phase 3: Swap integration state
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapContext, setSwapContext] = useState<{
    requiredToken: TokenInfo
    requiredAmount: number
    contextMessage: string
  } | null>(null)
  
  /**
   * Comprehensive Payment Analysis
   * Analyzes all available payment methods and provides intelligent scoring
   */
  const paymentAnalysis = useMemo((): PaymentOptionAnalysis[] => {
    if (isLoading || tokens.length === 0) {
      return PAYMENT_METHOD_CONFIGS.map(config => ({
        method: config.method,
        token: null,
        name: config.name,
        symbol: config.symbol,
        icon: config.icon,
        status: 'loading' as const,
        currentBalance: 0,
        currentBalanceFormatted: '...',
        currentBalanceUSD: 0,
        requiredAmount: 0,
        requiredAmountFormatted: '...',
        shortfall: 0,
        shortfallFormatted: '0',
        canAfford: false,
        efficiency: 0,
        recommendation: 'acceptable' as const
      }))
    }
    
    const requiredUSDC = Number(requiredAmountUSDC) / 1e6 // Convert from 6 decimals
    const capabilities = getPaymentCapabilities()
    
    return PAYMENT_METHOD_CONFIGS
      .filter(config => !allowedMethods || allowedMethods.includes(config.method))
      .map(config => {
        let token: TokenInfo | null = null
        let currentBalance = 0
        let currentBalanceUSD = 0
        let requiredAmount = 0
        
        // Handle different payment methods
        if (config.symbol === 'USDC') {
          token = tokens.find(t => t.symbol === 'USDC') || null
          currentBalance = token ? parseFloat(token.balanceFormatted) : 0
          currentBalanceUSD = token ? token.balanceUSD : 0
          requiredAmount = requiredUSDC
        } else if (config.symbol === 'ETH') {
          token = tokens.find(t => t.symbol === 'ETH') || null
          currentBalance = token ? parseFloat(token.balanceFormatted) : 0
          currentBalanceUSD = token ? token.balanceUSD : 0
          requiredAmount = token ? requiredUSDC / token.price : 0
        } else if (config.symbol === 'OTHER') {
          // For "other tokens", consider total portfolio excluding USDC and ETH
          const otherTokens = tokens.filter(t => !['USDC', 'ETH'].includes(t.symbol))
          currentBalanceUSD = otherTokens.reduce((sum, t) => sum + t.balanceUSD, 0)
          currentBalance = otherTokens.length
          requiredAmount = requiredUSDC
          token = otherTokens.length > 0 ? otherTokens[0] : null
        }
        
        const canAfford = config.symbol === 'OTHER' 
          ? currentBalanceUSD >= requiredUSDC
          : currentBalance >= requiredAmount
        
        const shortfall = canAfford ? 0 : (requiredAmount - currentBalance)
        const shortfallUSD = canAfford ? 0 : (requiredUSDC - currentBalanceUSD)
        
        // Calculate efficiency score
        let efficiency = config.baseEfficiency
        
        // Adjust for balance adequacy
        if (canAfford) {
          const bufferRatio = currentBalance / requiredAmount
          if (bufferRatio > 2) efficiency += 5 // Good buffer
          else if (bufferRatio < 1.1) efficiency -= 10 // Very tight
        } else {
          efficiency -= 30 // Insufficient balance penalty
        }
        
        // Determine recommendation
        let recommendation: PaymentOptionAnalysis['recommendation'] = 'acceptable'
        if (efficiency >= 90 && canAfford) recommendation = 'best'
        else if (efficiency >= 75 && canAfford) recommendation = 'good'
        else if (!canAfford) recommendation = 'avoid'
        
        // Check against capabilities for final recommendation
        if (config.symbol === 'USDC' && capabilities.recommendedPaymentMethod === 'USDC') {
          recommendation = canAfford ? 'best' : 'good'
        } else if (config.symbol === 'ETH' && capabilities.recommendedPaymentMethod === 'ETH') {
          recommendation = canAfford ? 'best' : 'good'
        }
        
        // Determine status with proper typing
        let status: PaymentOptionAnalysis['status']
        if (!token && config.symbol !== 'OTHER') {
          status = 'unavailable'
        } else if (canAfford) {
          status = 'available'
        } else {
          status = 'insufficient'
        }
        
        return {
          method: config.method,
          token,
          name: config.name,
          symbol: config.symbol,
          icon: config.icon,
          status,
          currentBalance,
          currentBalanceFormatted: config.symbol === 'OTHER' 
            ? `${currentBalance} tokens`
            : formatTokenAmount(currentBalance, config.symbol),
          currentBalanceUSD,
          requiredAmount,
          requiredAmountFormatted: config.symbol === 'OTHER'
            ? formatUSDValue(requiredAmount)
            : formatTokenAmount(requiredAmount, config.symbol),
          shortfall: config.symbol === 'OTHER' ? shortfallUSD : shortfall,
          shortfallFormatted: config.symbol === 'OTHER'
            ? formatUSDValue(shortfallUSD)
            : formatTokenAmount(shortfall, config.symbol),
          canAfford,
          efficiency,
          recommendation
        }
      })
      // Sort by recommendation and efficiency
      .sort((a, b) => {
        const recommendationOrder = { best: 4, good: 3, acceptable: 2, avoid: 1 }
        const aOrder = recommendationOrder[a.recommendation]
        const bOrder = recommendationOrder[b.recommendation]
        
        if (aOrder !== bOrder) return bOrder - aOrder
        return b.efficiency - a.efficiency
      })
  }, [tokens, requiredAmountUSDC, isLoading, allowedMethods, getPaymentCapabilities])
  
  /**
   * Enhanced Swap Handler for Phase 3 Integration
   */
  const handleSwapRequest = useCallback((analysis: PaymentOptionAnalysis) => {
    if (!analysis.token) return
    
    // Use built-in swap modal if enabled
    if (enableSwapIntegration) {
      setSwapContext({
        requiredToken: analysis.token,
        requiredAmount: analysis.requiredAmount,
        contextMessage: `You need ${analysis.requiredAmountFormatted} ${analysis.symbol} for this purchase`
      })
      setShowSwapModal(true)
    }
    
    // Also call external callback if provided (for backward compatibility)
    onSwapRequested?.(analysis.token, analysis.requiredAmount)
  }, [enableSwapIntegration, onSwapRequested])
  
  /**
   * Enhanced payment method selection with swap integration
   */
  const handleMethodSelect = useCallback((analysis: PaymentOptionAnalysis) => {
    if (analysis.status === 'unavailable') return
    
    if (analysis.canAfford) {
      onPaymentMethodSelect(analysis.method, analysis)
    } else {
      // If swap integration is enabled, offer swap instead of just reporting insufficient balance
      if (enableSwapIntegration || onSwapRequested) {
        handleSwapRequest(analysis)
      } else {
        onInsufficientBalance(analysis)
      }
    }
  }, [onPaymentMethodSelect, onInsufficientBalance, enableSwapIntegration, onSwapRequested, handleSwapRequest])
  
  /**
   * Get recommendation badge properties
   */
  const getRecommendationBadge = (analysis: PaymentOptionAnalysis) => {
    switch (analysis.recommendation) {
      case 'best':
        return { variant: 'default' as const, text: 'Best Choice', className: 'bg-green-500 hover:bg-green-600' }
      case 'good':
        return { variant: 'secondary' as const, text: 'Good Option', className: 'bg-blue-500 hover:bg-blue-600 text-white' }
      case 'acceptable':
        return { variant: 'outline' as const, text: 'Available', className: '' }
      case 'avoid':
        return { variant: 'destructive' as const, text: 'Insufficient', className: '' }
    }
  }
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Analyzing Payment Options...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-1">
                    <div className="w-16 h-4 bg-muted rounded animate-pulse" />
                    <div className="w-24 h-3 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="w-20 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const bestOption = paymentAnalysis.find(a => a.recommendation === 'best')
  const availableOptions = paymentAnalysis.filter(a => a.status === 'available')
  const totalShortfall = paymentAnalysis
    .filter(a => a.status === 'insufficient')
    .reduce((min, a) => Math.min(min, a.shortfall), Infinity)
  
  return (
    <>
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Payment Options</CardTitle>
          <Badge variant="outline">
            {formatUSDValue(Number(requiredAmountUSDC) / 1e6)} required
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status Alert */}
        {availableOptions.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insufficient balance across all payment methods. 
              {totalShortfall !== Infinity && (
                <span className="block mt-1">
                  You need at least {formatUSDValue(totalShortfall)} more to proceed.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Best Option Highlight */}
        {bestOption && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Recommended: {bestOption.name}
              </span>
            </div>
            <p className="text-xs text-green-700">
              Most efficient option with {bestOption.efficiency}% efficiency score
            </p>
          </div>
        )}
        
        {/* Payment Method Options */}
        <div className="space-y-2">
          {paymentAnalysis.map((analysis) => {
            const isSelected = selectedMethod === analysis.method
            const IconComponent = analysis.icon
            const recommendationBadge = getRecommendationBadge(analysis)
            
            return (
              <Button
                key={analysis.method}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "w-full justify-between h-auto p-3 text-left",
                  analysis.status === 'insufficient' && "border-red-200",
                  analysis.status === 'unavailable' && "opacity-50 cursor-not-allowed",
                  analysis.recommendation === 'best' && !isSelected && "border-green-300 bg-green-50"
                )}
                onClick={() => handleMethodSelect(analysis)}
                disabled={analysis.status === 'unavailable' || analysis.status === 'loading'}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5" />
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{analysis.name}</span>
                      <Badge 
                        variant={recommendationBadge.variant}
                        className={cn("text-xs", recommendationBadge.className)}
                      >
                        {recommendationBadge.text}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Balance: {analysis.currentBalanceFormatted}
                      {analysis.currentBalanceUSD > 0 && analysis.symbol !== 'USDC' && (
                        <span> ({formatUSDValue(analysis.currentBalanceUSD)})</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {analysis.status === 'available' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : analysis.status === 'insufficient' ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs text-red-600">
                        Need {analysis.shortfallFormatted} more
                      </div>
                      {(enableSwapIntegration || onSwapRequested) && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <ArrowUpDown className="h-3 w-3" />
                          <span>Swap</span>
                        </div>
                      )}
                    </div>
                  ) : analysis.status === 'loading' ? (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </Button>
            )
          })}
        </div>
        
        {/* Detailed Analysis */}
        {showDetailedAnalysis && selectedMethod && (
          <div className="mt-4 p-3 border rounded-lg bg-muted/50">
            {(() => {
              const selectedAnalysis = paymentAnalysis.find(a => a.method === selectedMethod)
              if (!selectedAnalysis) return null
              
              return (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Payment Analysis</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Required:</span>
                      <div className="font-medium">{selectedAnalysis.requiredAmountFormatted}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Available:</span>
                      <div className="font-medium">{selectedAnalysis.currentBalanceFormatted}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Efficiency:</span>
                      <div className="font-medium">{selectedAnalysis.efficiency}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className={cn(
                        "font-medium capitalize",
                        selectedAnalysis.canAfford ? "text-green-600" : "text-red-600"
                      )}>
                        {selectedAnalysis.status}
                      </div>
                    </div>
                  </div>
                  
                  {selectedAnalysis.efficiency < 100 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Efficiency Score</span>
                        <span>{selectedAnalysis.efficiency}%</span>
                      </div>
                      <Progress value={selectedAnalysis.efficiency} className="h-2" />
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Phase 3: Integrated Swap Modal */}
    {enableSwapIntegration && swapContext && (
      <SwapModal
        isOpen={showSwapModal}
        onClose={() => {
          setShowSwapModal(false)
          setSwapContext(null)
        }}
        initialToToken={swapContext.requiredToken}
        requiredOutputAmount={swapContext.requiredAmount}
        contextualMessage={swapContext.contextMessage}
        onSwapComplete={(fromToken, toToken, amount) => {
          // Refresh token balances after successful swap
          refreshBalances()
          setShowSwapModal(false)
          setSwapContext(null)
          
          // Show success message
          console.log(`Successfully swapped ${amount} ${fromToken.symbol} for ${toToken.symbol}`)
          
          // The payment selector will now show sufficient balance
          // for the selected token and user can proceed with payment
        }}
      />
    )}
    </>
  )
}

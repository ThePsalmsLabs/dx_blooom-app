/**
 * Smart Content Purchase Card
 * 
 * This component creates an intelligent shopping experience that guides users
 * toward successful transactions by showing their available funds and providing
 * clear payment recommendations based on their current token balances.
 * 
 * Integration Philosophy:
 * - Builds on existing ContentPurchaseCard patterns
 * - Uses real business logic from workflows.ts
 * - Integrates seamlessly with token balance system
 * - Provides intelligent payment method selection
 * - Maintains compatibility with existing purchase flows
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { 
  ShoppingCart, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  ArrowRight,
  RefreshCw,
  Info,
  Zap,
  DollarSign,
  Coins,
  ArrowUpDown
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Import real business logic and token balance system
import { useTokenBalances, formatUSDValue, type TokenInfo } from '@/hooks/web3/useTokenBalances'
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'
import { 
  useUnifiedContentPurchaseFlow, 
  PaymentMethod,
  type UnifiedPurchaseFlowConfig 
} from '@/hooks/business/workflows'

// Import Phase 3 swap functionality
import { SwapModal } from '@/components/web3/portfolio/SwapModal'

/**
 * Smart Payment Method Configuration
 * Maps to your existing PaymentMethod enum with intelligent descriptions
 */
interface SmartPaymentMethodConfig {
  readonly id: PaymentMethod
  readonly name: string
  readonly symbol: string
  readonly description: string
  readonly estimatedTime: string
  readonly gasEstimate: 'Low' | 'Medium' | 'High'
  readonly requiresApproval: boolean
  readonly icon: React.ComponentType<{ className?: string }>
  readonly isPreferred?: boolean
  readonly warningMessage?: string
}

/**
 * Payment Method Status Analysis
 * Provides clear feedback about each payment option
 */
type PaymentMethodStatus = 
  | 'available'      // User has sufficient balance
  | 'insufficient'   // User doesn't have enough of this token
  | 'unavailable'    // Token not supported or other issue
  | 'loading'        // Still checking balance

interface PaymentMethodWithStatus extends SmartPaymentMethodConfig {
  readonly status: PaymentMethodStatus
  readonly currentBalance: string
  readonly balanceUSD: number
  readonly required: number
  readonly shortfall?: number
}

/**
 * Payment Method Configurations
 * These match your existing PaymentMethod enum and provide rich user guidance
 */
const SMART_PAYMENT_METHODS: SmartPaymentMethodConfig[] = [
  {
    id: PaymentMethod.USDC,
    name: 'USDC',
    symbol: 'USDC',
    description: 'Stable and reliable - no price volatility',
    estimatedTime: '~30 seconds',
    gasEstimate: 'Low',
    requiresApproval: true,
    icon: DollarSign,
    isPreferred: true
  },
  {
    id: PaymentMethod.ETH,
    name: 'Ethereum',
    symbol: 'ETH',
    description: 'Native currency - fast transactions',
    estimatedTime: '~15 seconds',
    gasEstimate: 'Low',
    requiresApproval: false,
    icon: Zap
  },
  {
    id: PaymentMethod.OTHER_TOKEN,
    name: 'Other Token',
    symbol: 'OTHER',
    description: 'Pay with any supported ERC-20 token',
    estimatedTime: '~60 seconds',
    gasEstimate: 'High',
    requiresApproval: true,
    icon: Coins,
    warningMessage: 'May require multiple transaction steps'
  }
]

/**
 * Component Props Interface
 * Enhanced with Phase 3 swap integration
 */
interface SmartContentPurchaseCardProps {
  readonly contentId: bigint
  readonly compact?: boolean
  readonly showBalanceDetails?: boolean
  readonly onPurchaseSuccess?: () => void
  readonly onSwapRequested?: (requiredToken: TokenInfo, requiredAmount: number) => void
  readonly className?: string
  readonly purchaseConfig?: Partial<UnifiedPurchaseFlowConfig>
  readonly enableSwapIntegration?: boolean // New flag to enable built-in swap modal
}

/**
 * Main Smart Content Purchase Card Component
 */
export const SmartContentPurchaseCard: React.FC<SmartContentPurchaseCardProps> = ({
  contentId,
  compact = false,
  showBalanceDetails = true,
  onPurchaseSuccess,
  onSwapRequested,
  className,
  purchaseConfig = {},
  enableSwapIntegration = true
}) => {
  const router = useRouter()
  const { address } = useAccount()
  
  // State management
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.USDC)
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  
  // Phase 3: Swap integration state
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapContext, setSwapContext] = useState<{
    requiredToken: TokenInfo
    requiredAmount: number
    contextMessage: string
  } | null>(null)
  
  // Token balance integration
  const { 
    tokens, 
    totalPortfolioValue, 
    isLoading: balancesLoading, 
    refreshBalances,
    canAffordContentPrice,
    getPaymentCapabilities
  } = useTokenBalances()
  
  // Real business logic hooks
  const { data: content, isLoading: contentLoading } = useContentById(contentId)
  const { data: hasAccess, isLoading: accessLoading } = useHasContentAccess(address, contentId)
  const purchaseFlow = useUnifiedContentPurchaseFlow(contentId, address, purchaseConfig)
  
  /**
   * Smart Payment Method Analysis
   * Combines token balance data with content pricing to provide intelligent recommendations
   */
  const paymentMethodsWithStatus = useMemo((): PaymentMethodWithStatus[] => {
    if (!content || balancesLoading) {
      return SMART_PAYMENT_METHODS.map(method => ({
        ...method,
        status: 'loading' as const,
        currentBalance: '...',
        balanceUSD: 0,
        required: 0
      }))
    }
    
    // Content price in USDC (6 decimals)
    const contentPriceUSDC = Number(content.payPerViewPrice) / 1e6
    
    return SMART_PAYMENT_METHODS.map(method => {
      // Find corresponding token from balance data
      const token = tokens.find(t => t.symbol === method.symbol)
      
      if (!token && method.symbol !== 'OTHER') {
        return {
          ...method,
          status: 'unavailable' as const,
          currentBalance: '0',
          balanceUSD: 0,
          required: contentPriceUSDC
        }
      }
      
      if (method.symbol === 'OTHER') {
        // For "other token" option, check if user has any tokens with sufficient value
        const totalPortfolioValue = tokens.reduce((sum, t) => sum + t.balanceUSD, 0)
        return {
          ...method,
          status: totalPortfolioValue >= contentPriceUSDC ? 'available' : 'insufficient',
          currentBalance: `${tokens.length} tokens`,
          balanceUSD: totalPortfolioValue,
          required: contentPriceUSDC,
          shortfall: totalPortfolioValue >= contentPriceUSDC ? undefined : contentPriceUSDC - totalPortfolioValue
        }
      }
      
      const currentBalance = parseFloat(token!.balanceFormatted)
      const required = method.symbol === 'USDC' ? contentPriceUSDC : contentPriceUSDC / token!.price
      const hasEnough = currentBalance >= required
      
      return {
        ...method,
        status: hasEnough ? 'available' : 'insufficient',
        currentBalance: token!.balanceFormatted,
        balanceUSD: token!.balanceUSD,
        required,
        shortfall: hasEnough ? undefined : required - currentBalance
      }
    })
  }, [content, tokens, balancesLoading])
  
  /**
   * Intelligent Payment Method Suggestion
   * Uses affordability analysis and payment capabilities to recommend best option
   */
  const suggestedPaymentMethod = useMemo(() => {
    if (!content) return null
    
    // Use the real affordability analysis from token balances
    const affordabilityResult = canAffordContentPrice(content.payPerViewPrice)
    
    if (!affordabilityResult.canAfford) {
      // Suggest preferred method for swap consideration
      return paymentMethodsWithStatus.find(method => method.isPreferred) || paymentMethodsWithStatus[0]
    }
    
    // Get payment capabilities to make intelligent recommendation
    const capabilities = getPaymentCapabilities()
    
    const availableMethods = paymentMethodsWithStatus.filter(method => method.status === 'available')
    
    if (availableMethods.length === 0) {
      return paymentMethodsWithStatus.find(method => method.isPreferred) || paymentMethodsWithStatus[0]
    }
    
    // Prefer USDC if available and recommended
    if (capabilities.recommendedPaymentMethod === 'USDC') {
      const usdcMethod = availableMethods.find(method => method.symbol === 'USDC')
      if (usdcMethod) return usdcMethod
    }
    
    // Prefer ETH if recommended
    if (capabilities.recommendedPaymentMethod === 'ETH') {
      const ethMethod = availableMethods.find(method => method.symbol === 'ETH')
      if (ethMethod) return ethMethod
    }
    
    // Fall back to method with highest balance
    return availableMethods.reduce((best, current) => 
      current.balanceUSD > best.balanceUSD ? current : best
    )
  }, [content, paymentMethodsWithStatus, canAffordContentPrice, getPaymentCapabilities])
  
  /**
   * Auto-select suggested payment method
   */
  useEffect(() => {
    if (suggestedPaymentMethod && selectedPaymentMethod !== suggestedPaymentMethod.id) {
      setSelectedPaymentMethod(suggestedPaymentMethod.id)
    }
  }, [suggestedPaymentMethod, selectedPaymentMethod])
  
  /**
   * Enhanced Swap Handler for Phase 3 Integration
   * Handles both external callbacks and built-in swap modal
   */
  const handleSwapRequest = useCallback((selectedMethod: PaymentMethodWithStatus) => {
    // Find the corresponding token from our token list
    const requiredToken = tokens.find(token => token.symbol === selectedMethod.symbol)
    
    if (!requiredToken) {
      console.warn(`Token ${selectedMethod.symbol} not found in user's token list`)
      return
    }
    
    // Use built-in swap modal if enabled
    if (enableSwapIntegration) {
      setSwapContext({
        requiredToken,
        requiredAmount: selectedMethod.required,
        contextMessage: `You need ${selectedMethod.required.toFixed(4)} ${selectedMethod.symbol} to purchase "${content?.title || 'this content'}"`
      })
      setShowSwapModal(true)
    }
    
    // Also call external callback if provided (for backward compatibility)
    onSwapRequested?.(requiredToken, selectedMethod.required)
  }, [tokens, enableSwapIntegration, content?.title, onSwapRequested])
  
  /**
   * Enhanced Purchase Handler
   * Integrates with real purchase flow logic and Phase 3 swap functionality
   */
  const handlePurchase = useCallback(async () => {
    const selectedMethod = paymentMethodsWithStatus.find(method => method.id === selectedPaymentMethod)
    
    if (!selectedMethod || !content) return
    
    // If insufficient balance, handle swap flow
    if (selectedMethod.status === 'insufficient') {
      handleSwapRequest(selectedMethod)
      return
    }
    
    // Use real purchase flow
    try {
      await purchaseFlow.executePayment()
      // Success will be handled by the useEffect below
    } catch (error) {
      console.error('Purchase failed:', error)
    }
  }, [selectedPaymentMethod, paymentMethodsWithStatus, content, onSwapRequested, purchaseFlow])
  
  /**
   * Handle purchase success
   */
  useEffect(() => {
    if (purchaseFlow.executionState.phase === 'completed') {
      onPurchaseSuccess?.()
    }
  }, [purchaseFlow.executionState.phase, onPurchaseSuccess])
  
  /**
   * Loading State Rendering
   */
  if (contentLoading || accessLoading) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg animate-pulse" />
          <div className="h-6 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4 mx-auto" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-8 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Handle content not found
  if (!content) {
    return (
      <Card className={cn("w-full max-w-md", className)}>
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Content not found</p>
        </CardContent>
      </Card>
    )
  }
  
  // Handle user already has access
  if (hasAccess) {
    return (
      <Card className={cn("w-full max-w-md border-green-200 bg-green-50", className)}>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <p className="font-medium text-green-800">You have access to this content</p>
          <Button
            onClick={() => router.push(`/content/${contentId}`)}
            className="mt-3"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            View Content
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  const selectedMethodData = paymentMethodsWithStatus.find(method => method.id === selectedPaymentMethod)
  const contentPriceDisplay = (Number(content.payPerViewPrice) / 1e6).toFixed(2)
  
  return (
    <TooltipProvider>
      <Card className={cn("w-full max-w-md", className)}>
        <CardHeader className={cn("text-center", compact && "pb-4")}>
          {/* Content Preview */}
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className={cn("text-lg", compact && "text-base")}>
            {content.title}
          </CardTitle>
          <CardDescription>
            Premium content • ${contentPriceDisplay} USDC
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Portfolio Overview Section */}
          {showBalanceDetails && !compact && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Portfolio Value</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshBalances}
                  className="h-6 w-6 p-0"
                >
                  <RefreshCw className={cn("h-3 w-3", balancesLoading && "animate-spin")} />
                </Button>
              </div>
              <div className="text-lg font-bold text-green-600">
                {formatUSDValue(totalPortfolioValue)}
              </div>
            </div>
          )}
          
          {/* Smart Payment Method Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Payment Method</label>
              {suggestedPaymentMethod && suggestedPaymentMethod.id !== selectedPaymentMethod && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPaymentMethod(suggestedPaymentMethod.id)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Use Suggested
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {paymentMethodsWithStatus.map((method) => {
                const isSelected = method.id === selectedPaymentMethod
                const IconComponent = method.icon
                
                return (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50",
                      method.status === 'insufficient' && "border-red-200 bg-red-50",
                      method.status === 'unavailable' && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => method.status !== 'unavailable' && setSelectedPaymentMethod(method.id)}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{method.name}</span>
                          {method.isPreferred && suggestedPaymentMethod?.id === method.id && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                          {method.status === 'insufficient' && (
                            <Badge variant="destructive" className="text-xs">
                              Insufficient
                            </Badge>
                          )}
                          {method.status === 'unavailable' && (
                            <Badge variant="outline" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {method.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {method.status === 'loading' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          method.currentBalance
                        )}
                      </div>
                      {method.status === 'insufficient' && method.shortfall && (
                        <div className="text-xs text-red-600">
                          Need {method.shortfall.toFixed(4)} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Transaction Details */}
          {selectedMethodData && selectedMethodData.status !== 'loading' && (
            <div className="p-3 border rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Content Price:</span>
                <span>
                  {selectedMethodData.symbol === 'USDC' 
                    ? `$${contentPriceDisplay}` 
                    : `${selectedMethodData.required.toFixed(6)} ${selectedMethodData.symbol}`
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Gas Estimate:</span>
                <span className={cn(
                  selectedMethodData.gasEstimate === 'Low' && "text-green-600",
                  selectedMethodData.gasEstimate === 'Medium' && "text-yellow-600",
                  selectedMethodData.gasEstimate === 'High' && "text-red-600"
                )}>
                  {selectedMethodData.gasEstimate}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Est. Time:</span>
                <span>{selectedMethodData.estimatedTime}</span>
              </div>
              {selectedMethodData.requiresApproval && (
                <div className="text-xs text-muted-foreground">
                  * May require token approval first
                </div>
              )}
            </div>
          )}
          
          {/* Purchase State Progress */}
          {purchaseFlow.executionState.phase !== 'idle' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Purchase Status:</span>
                <span className="capitalize">{purchaseFlow.executionState.phase.replace(/_/g, ' ')}</span>
              </div>
              <Progress value={purchaseFlow.executionState.progress} />
              <p className="text-xs text-muted-foreground">
                {purchaseFlow.executionState.message}
              </p>
            </div>
          )}
          
          {/* Insufficient Balance Warning */}
          {selectedMethodData?.status === 'insufficient' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need {selectedMethodData.shortfall?.toFixed(4)} more {selectedMethodData.symbol} to complete this purchase.
                {onSwapRequested && (
                  <span className="block mt-1">
                    You can swap other tokens to get the required amount.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Warning Messages */}
          {selectedMethodData?.warningMessage && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {selectedMethodData.warningMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          {selectedMethodData?.status === 'insufficient' && (enableSwapIntegration || onSwapRequested) ? (
            <div className="flex w-full gap-2">
              <Button
                onClick={handlePurchase}
                className="flex-1"
                variant="outline"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Swap for {selectedMethodData.symbol}
              </Button>
              {!enableSwapIntegration && onSwapRequested && (
                <Button
                  onClick={handlePurchase}
                  variant="default"
                  className="flex-1"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Get Tokens
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={handlePurchase}
              disabled={
                !selectedMethodData || 
                selectedMethodData.status !== 'available' || 
                !purchaseFlow.canExecutePayment ||
                ['executing', 'confirming'].includes(purchaseFlow.executionState.phase)
              }
              className="w-full"
            >
              {['executing', 'confirming'].includes(purchaseFlow.executionState.phase) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {purchaseFlow.executionState.message}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase Content
                </>
              )}
            </Button>
          )}
        </CardFooter>
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
            
            // Show success notification with proper feedback
            toast.success("Swap Completed Successfully! 🎉", {
              description: `Swapped ${amount} ${fromToken.symbol} for ${toToken.symbol}. You can now proceed with your purchase.`,
              duration: 5000,
            })
            
            // The purchase card will now show sufficient balance
            // and user can proceed with the purchase
          }}
        />
      )}
    </TooltipProvider>
  )
}

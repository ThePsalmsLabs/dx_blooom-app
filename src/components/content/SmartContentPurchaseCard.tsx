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
import { formatUnits } from 'viem'
import Image from 'next/image'
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
import { useEnhancedTokenBalances, formatUSDValue, type TokenInfo } from '@/hooks/web3/useEnhancedTokenBalances'
import { useContentById, useHasContentAccess } from '@/hooks/contracts/core'
import { USDC_DECIMALS } from '@/lib/contracts/config'
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
 * Get token image path for a given payment method
 */
function getTokenImage(method: PaymentMethod, symbol?: string): string {
  if (symbol) {
    switch (symbol.toUpperCase()) {
      case 'USDC':
        return '/images/usdc-logo.webp'
      case 'ETH':
        return '/images/eth-logo.png'
      case 'WETH':
        return '/images/weth-logo.jpeg'
      case 'CBETH':
        return '/images/cb-eth-logo.png'
      case 'DAI':
        return '/images/DAI-logo.png'
      default:
        return '/images/usdc-logo.webp' // fallback
    }
  }
  
  switch (method) {
    case PaymentMethod.ETH:
      return '/images/eth-logo.png'
    case PaymentMethod.USDC:
      return '/images/usdc-logo.webp'
    default:
      return '/images/usdc-logo.webp'
  }
}

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
  
  // NEW: Staged purchase flow state
  const [hasInitiatedPurchase, setHasInitiatedPurchase] = useState(false)
  const [balanceCache, setBalanceCache] = useState<{
    data: any
    timestamp: number
  } | null>(null)
  
  // Phase 3: Swap integration state
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapContext, setSwapContext] = useState<{
    requiredToken: TokenInfo
    requiredAmount: number
    contextMessage: string
  } | null>(null)
  
  // Check if cache is still valid (30 seconds)
  const isCacheValid = balanceCache && (Date.now() - balanceCache.timestamp) < 30000
  
  // Token balance integration - only fetch if purchase initiated or cache invalid
  const shouldSkipBalanceFetch = !hasInitiatedPurchase && !isCacheValid
  const { 
    tokens, 
    totalPortfolioValue, 
    isLoading: balancesLoading, 
    refreshBalances,
    canAffordContentPrice,
    getPaymentCapabilities
  } = useEnhancedTokenBalances()
  
  // Override loading state when skipping fetch
  const actualBalancesLoading = shouldSkipBalanceFetch ? false : balancesLoading
  
  // Handle CTA button click to initiate purchase flow
  const handleProceedToPurchase = useCallback(() => {
    setHasInitiatedPurchase(true)
    // Cache current data for 30 seconds
    if (tokens && totalPortfolioValue) {
      setBalanceCache({
        data: { tokens, totalPortfolioValue },
        timestamp: Date.now()
      })
    }
  }, [tokens, totalPortfolioValue])
  
  // Update cache when balances are refreshed
  useEffect(() => {
    if (!actualBalancesLoading && hasInitiatedPurchase && tokens) {
      setBalanceCache({
        data: { tokens, totalPortfolioValue },
        timestamp: Date.now()
      })
    }
  }, [actualBalancesLoading, hasInitiatedPurchase, tokens, totalPortfolioValue])
  
  // Real business logic hooks
  const { data: content, isLoading: contentLoading } = useContentById(contentId)
  const { data: hasAccess, isLoading: accessLoading } = useHasContentAccess(address, contentId)
  const purchaseFlow = useUnifiedContentPurchaseFlow(contentId, address, purchaseConfig)
  
  /**
   * Smart Payment Method Analysis
   * Combines token balance data with content pricing to provide intelligent recommendations
   */
  const paymentMethodsWithStatus = useMemo((): PaymentMethodWithStatus[] => {
    if (!content) {
      return SMART_PAYMENT_METHODS.map(method => ({
        ...method,
        status: 'loading' as const,
        currentBalance: '...',
        balanceUSD: 0,
        required: 0
      }))
    }
    
    // If we haven't initiated purchase, show placeholder data
    if (shouldSkipBalanceFetch) {
      return SMART_PAYMENT_METHODS.map(method => ({
        ...method,
        status: 'unavailable' as const,
        currentBalance: '...',
        balanceUSD: 0,
        required: Number(formatUnits(content.payPerViewPrice, USDC_DECIMALS))
      }))
    }
    
    // If we're loading balances after initiation
    if (actualBalancesLoading) {
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
  }, [content, tokens, actualBalancesLoading, shouldSkipBalanceFetch])
  
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
      <Card className={cn("w-full max-w-md border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30", className)}>
        <CardContent className="text-center py-8">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
          <p className="font-medium text-green-800 dark:text-green-200">You have access to this content</p>
          <Button
            onClick={() => router.push(`/content/${contentId}`)}
            className="mt-3"
            variant="default"
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
      <Card className={cn("w-full max-w-md mx-auto shadow-sm", className)}>
        <CardHeader className="pb-6 bg-gradient-to-br from-background to-muted/30 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-foreground">Premium Content</h3>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
              <span className="text-xs font-medium">Available</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-medium text-foreground line-clamp-1">
                {content.title}
              </CardTitle>
              <CardDescription className="mt-1 text-sm line-clamp-1">
                Premium content • <span className="font-semibold text-primary">${contentPriceDisplay} USDC</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* CTA Button Section - Show when balances not yet fetched */}
          {shouldSkipBalanceFetch && (
            <div className="text-center py-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg animate-pulse" />
                <div className="relative bg-card border border-primary/20 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <Zap className="w-8 h-8 text-primary animate-bounce" />
                      <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    Ready to Purchase?
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click below to check your wallet balance and proceed with payment
                  </p>
                  <Button
                    onClick={handleProceedToPurchase}
                    className="w-full font-medium py-3 px-4 transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    size="lg"
                  >
                    <DollarSign className="h-4 w-4" />
                    Proceed to Payment
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Portfolio Overview Section */}
          {showBalanceDetails && !compact && !shouldSkipBalanceFetch && (
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
          
          {/* Enhanced Payment Method Selection with Dropdown Style - Only show after CTA initiated */}
          {!shouldSkipBalanceFetch && (
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
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
            
            {/* Selected Method Display */}
            {selectedMethodData && (
              <div className="p-4 border rounded-lg bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border border-border">
                      <Image
                        src={getTokenImage(selectedMethodData.id, selectedMethodData.symbol)}
                        alt={`${selectedMethodData.name} logo`}
                        width={24}
                        height={24}
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{selectedMethodData.name}</span>
                        {selectedMethodData.isPreferred && suggestedPaymentMethod?.id === selectedMethodData.id && (
                          <Badge variant="secondary" className="text-xs">
                            Recommended
                          </Badge>
                        )}
                        {selectedMethodData.status === 'insufficient' && (
                          <Badge variant="destructive" className="text-xs">
                            Insufficient
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{selectedMethodData.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-foreground font-mono text-sm">
                      {selectedMethodData.status === 'loading' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        selectedMethodData.currentBalance
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {selectedMethodData.status === 'insufficient' && selectedMethodData.shortfall ? 
                        `Need ${selectedMethodData.shortfall.toFixed(4)} more` :
                        'Available'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Alternative Methods (if more than one available) */}
            {paymentMethodsWithStatus.filter(m => m.status !== 'unavailable').length > 1 && !compact && (
              <details className="group">
                <summary className="cursor-pointer text-sm text-primary hover:text-primary/80 font-medium">
                  View other payment options ({paymentMethodsWithStatus.filter(m => m.status !== 'unavailable').length - 1} more)
                </summary>
                <div className="mt-2 space-y-2 border rounded-lg p-2 bg-muted/30">
                  {paymentMethodsWithStatus
                    .filter(method => method.id !== selectedPaymentMethod && method.status !== 'unavailable')
                    .map((method) => (
                      <button
                        key={method.id}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-card transition-colors text-left"
                        onClick={() => setSelectedPaymentMethod(method.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border border-border">
                            <Image
                              src={getTokenImage(method.id, method.symbol)}
                              alt={`${method.name} logo`}
                              width={16}
                              height={16}
                              className="w-4 h-4 object-contain"
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground">{method.name}</span>
                          {method.status === 'insufficient' && (
                            <Badge variant="destructive" className="text-xs">
                              Insufficient
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">{method.currentBalance}</span>
                      </button>
                    ))}
                </div>
              </details>
            )}
          </div>
          )}
          
          {/* Transaction Details */}
          {!shouldSkipBalanceFetch && selectedMethodData && selectedMethodData.status !== 'loading' && (
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
          {!shouldSkipBalanceFetch && purchaseFlow.executionState.phase !== 'idle' && (
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
          {!shouldSkipBalanceFetch && selectedMethodData?.status === 'insufficient' && (
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
          {!shouldSkipBalanceFetch && selectedMethodData?.warningMessage && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {selectedMethodData.warningMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        {!shouldSkipBalanceFetch && (
          <CardFooter className="p-6 bg-muted/30 border-t">
          <div className="w-full space-y-4">
            {selectedMethodData?.status === 'insufficient' && (enableSwapIntegration || onSwapRequested) ? (
              <Button
                onClick={handlePurchase}
                className="w-full font-medium py-3 px-4 transition-all duration-200 flex items-center justify-center gap-2"
                size="lg"
              >
                <ArrowUpDown className="h-4 w-4" />
                Swap for {selectedMethodData.symbol}
              </Button>
            ) : (
              <Button
                onClick={handlePurchase}
                disabled={
                  !selectedMethodData || 
                  selectedMethodData.status !== 'available' || 
                  !purchaseFlow.canExecutePayment ||
                  ['executing', 'confirming'].includes(purchaseFlow.executionState.phase)
                }
                className="w-full font-medium py-3 px-4 transition-all duration-200 flex items-center justify-center gap-2"
                variant={
                  selectedMethodData?.status === 'available' && !['executing', 'confirming'].includes(purchaseFlow.executionState.phase)
                    ? 'default'
                    : 'secondary'
                }
                size="lg"
              >
                {['executing', 'confirming'].includes(purchaseFlow.executionState.phase) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {purchaseFlow.executionState.message}
                  </>
                ) : selectedMethodData?.status !== 'available' ? (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Insufficient Balance
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Purchase Content
                  </>
                )}
              </Button>
            )}

            {/* Footer Note */}
            <p className="text-xs text-muted-foreground text-center">
              * May require token approval first
            </p>
          </div>
          </CardFooter>
        )}
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

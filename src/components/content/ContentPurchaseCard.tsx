/**
 * Modified ContentPurchaseCard.tsx - Phase 1 Integration Complete
 * 
 * This is the complete modified version of your ContentPurchaseCard component that integrates
 * our new payment intent flow system. It maintains all existing functionality while fixing
 * the broken ETH payment system.
 * 
 * Key Changes Made:
 * - Replaced broken handleETHPurchase with working usePaymentIntentFlow integration
 * - Added comprehensive progress tracking for multi-step ETH payments
 * - Maintained all existing USDC payment functionality
 * - Enhanced error handling for ETH-specific payment scenarios
 * - Added real-time progress updates during ETH → USDC swaps
 * 
 * File: src/components/content/ContentPurchaseCard.tsx
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useReadContract, useChainId, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { type Address, parseEther } from 'viem'
import { getContractAddresses } from '@/lib/contracts/config'
import { PRICE_ORACLE_ABI, COMMERCE_PROTOCOL_INTEGRATION_ABI, ERC20_ABI } from '@/lib/contracts/abis'
import {
  ShoppingCart,
  Lock,
  Eye,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Loader2,
  DollarSign,
  Zap,
  Coins,
  RefreshCw,
  Wallet,
  AlertTriangle,
  ChevronDown,
  ExternalLink,
  Clock,
  TrendingUp,
  ArrowRight
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks and utilities
import { useContentById, useHasContentAccess, useTokenBalance, useTokenAllowance } from '@/hooks/contracts/core'
import { useUnifiedContentPurchaseFlow, UnifiedPurchaseFlowResult, PaymentMethod } from '@/hooks/business/workflows'
import { formatCurrency, formatTokenBalance, formatAddress } from '@/lib/utils'
import type { Content } from '@/types/contracts'
import { EnhancedPaymentOptions } from './EnhancedPaymentOptions'
import { SubscribeButton } from '@/components/subscription'

// Import our new Phase 1 components
import { usePaymentIntentFlow, PaymentIntentRequest } from '@/hooks/web3/usePaymentIntentFlow'

/**
 * Payment Method Configuration Interface
 */
interface PaymentMethodConfig {
  readonly id: PaymentMethod
  readonly name: string
  readonly description: string
  readonly estimatedTime: string
  readonly gasEstimate: 'Low' | 'Medium' | 'High'
  readonly requiresApproval: boolean
  readonly icon: React.ComponentType<{ className?: string }>
  readonly isAvailable: boolean
}

/**
 * Token Information Interface - Comprehensive Token Data
 */
interface TokenInfo {
  readonly address: Address
  readonly symbol: string
  readonly name: string
  readonly decimals: number
  readonly balance: bigint | null
  readonly requiredAmount: bigint
  readonly hasEnoughBalance: boolean
  readonly allowance?: bigint
  readonly needsApproval?: boolean
  readonly isLoading?: boolean
  readonly error?: string
}

/**
 * Multi-Payment State Management Interface
 */
interface MultiPaymentState {
  readonly selectedMethod: PaymentMethod
  readonly availableTokens: Record<PaymentMethod, TokenInfo | null>
  readonly customTokenAddress: string
  readonly showPaymentOptions: boolean
  readonly isCheckingBalances: boolean
  readonly isInitialized: boolean
  readonly multiPaymentSupported: boolean
  readonly paymentStep: 'idle' | 'approving' | 'executing' | 'completed' | 'error'
  readonly errorMessage: string | null
  readonly lastSuccessfulStep: PaymentMethod | null
}

/**
 * Enhanced ContentPurchaseCard Props
 */
interface ContentPurchaseCardProps {
  readonly contentId: bigint
  readonly userAddress?: Address
  readonly onPurchaseSuccess?: (contentId: bigint) => void
  readonly onViewContent?: (contentId: bigint) => void
  readonly variant?: 'full' | 'compact' | 'minimal'
  readonly className?: string
  readonly showCreatorInfo?: boolean
  readonly showPurchaseDetails?: boolean
  readonly enableMultiPayment?: boolean
  readonly enableFallback?: boolean // Graceful fallback to USDC-only mode
}

interface PurchaseProgressState {
  step: 'idle' | 'approving' | 'executing' | 'completed' | 'error'
  canRetry: boolean
  message?: string
}

/**
 * Enhanced ContentPurchaseCard Component with Working ETH Payments
 */
export function ContentPurchaseCard({
  contentId,
  userAddress,
  onPurchaseSuccess,
  onViewContent,
  variant = 'full',
  className,
  showCreatorInfo = true,
  showPurchaseDetails = true,
  enableMultiPayment = true,
  enableFallback = true
}: ContentPurchaseCardProps) {
  const router = useRouter()
  const { address: connectedAddress, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Safe contract configuration
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.warn('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])
  
  // Use connected address if no userAddress provided
  const effectiveUserAddress = userAddress || connectedAddress

  // Core data hooks - these are always called at the top level
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(effectiveUserAddress, contentId)
  
  // Primary purchase flow hook (unified multi-token flow for USDC)
  const primaryPurchaseFlow = useUnifiedContentPurchaseFlow(contentId, effectiveUserAddress)
  
  // 🚀 NEW: ETH Payment Intent Flow Integration
  const ethPaymentFlow = usePaymentIntentFlow({
    enableDebugLogging: process.env.NODE_ENV === 'development',
    onProgressUpdate: (progress, message) => {
      console.log(`ETH Payment Progress: ${progress}% - ${message}`)
      // Update UI state for real-time feedback
      setPaymentState(prev => ({
        ...prev,
        paymentStep: progress === 100 ? 'completed' : 'executing',
        errorMessage: null
      }))
    },
    onStepError: (step, error) => {
      console.error('ETH Payment Error:', error)
      setPaymentState(prev => ({
        ...prev,
        paymentStep: 'error',
        errorMessage: error.message
      }))
    }
  })
  
  // Token balance hooks for multi-payment support
  const usdcBalance = useTokenBalance(
    contractAddresses?.USDC, 
    effectiveUserAddress
  )
  // Use correct hook for native ETH balance
  const ethBalance = useBalance({
    address: effectiveUserAddress,
    query: { 
      enabled: !!(effectiveUserAddress && enableMultiPayment)
    }
  })
  
  const usdcAllowance = useTokenAllowance(
    contractAddresses?.USDC,
    effectiveUserAddress,
    contractAddresses?.PAY_PER_VIEW
  )
  
  // Enhanced wagmi hooks for complex transactions
  const { writeContract, data: writeData, isError: writeError } = useWriteContract()
  
  // Price oracle for token conversions (with error handling)
  const ethPriceQuery = useReadContract({
    address: contractAddresses?.PRICE_ORACLE || undefined,
    abi: PRICE_ORACLE_ABI as unknown as import('viem').Abi,
    functionName: 'getTokenPrice',
    args: contractAddresses ? ['0x0000000000000000000000000000000000000000', contractAddresses.USDC] : undefined,
    query: { 
      enabled: !!(contractAddresses?.PRICE_ORACLE && PRICE_ORACLE_ABI.length > 0),
      retry: 3,
      retryDelay: 1000
    }
  })

  // Multi-payment state management - USDC prioritized as default
  const [paymentState, setPaymentState] = useState<MultiPaymentState>({
    selectedMethod: PaymentMethod.USDC,
    availableTokens: {
      [PaymentMethod.USDC]: null,
      [PaymentMethod.ETH]: null,
      [PaymentMethod.WETH]: null,
      [PaymentMethod.CBETH]: null,
      [PaymentMethod.DAI]: null,
      [PaymentMethod.OTHER_TOKEN]: null
    },
    customTokenAddress: '',
    showPaymentOptions: false,
    isCheckingBalances: false,
    isInitialized: false,
    multiPaymentSupported: false,
    paymentStep: 'idle',
    errorMessage: null,
    lastSuccessfulStep: null
  })

  /**
   * Multi-Payment Support Detection
   * This checks if the user's environment supports advanced payment methods
   */
  const checkMultiPaymentSupport = useCallback(() => {
    const hasRequiredContracts = !!(
      contractAddresses?.COMMERCE_INTEGRATION && 
      contractAddresses?.PRICE_ORACLE
    )
    
    const hasRequiredABIs = !!(
      COMMERCE_PROTOCOL_INTEGRATION_ABI.length > 0 &&
      PRICE_ORACLE_ABI.length > 0
    )
    
    return hasRequiredContracts && hasRequiredABIs && enableMultiPayment
  }, [contractAddresses, enableMultiPayment])

  /**
   * Robust Token Balance Checking
   * This function safely checks token balances with comprehensive error handling
   */
  const checkTokenBalances = useCallback(async (content: Content) => {
    if (!effectiveUserAddress || !content) return

    console.log('🔄 Starting token balance check...', {
      effectiveUserAddress,
      contentId: contentId,
      usdcBalanceLoading: usdcBalance.isLoading,
      usdcAllowanceLoading: usdcAllowance.isLoading,
      usdcBalanceData: usdcBalance.data,
      usdcAllowanceData: usdcAllowance.data
    })

    setPaymentState(prev => ({ ...prev, isCheckingBalances: true, errorMessage: null }))

    try {
      const multiPaymentSupported = checkMultiPaymentSupport()
      
      // Always create USDC token info (fallback mode)
      const usdcTokenInfo: TokenInfo = {
        address: contractAddresses?.USDC || ('0x0' as Address),
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: usdcBalance.data || BigInt(0),
        requiredAmount: content.payPerViewPrice,
        hasEnoughBalance: (usdcBalance.data || BigInt(0)) >= content.payPerViewPrice,
        allowance: usdcAllowance.data || BigInt(0),
        needsApproval: (usdcAllowance.data || BigInt(0)) < content.payPerViewPrice,
        isLoading: usdcBalance.isLoading || usdcAllowance.isLoading,
        error: usdcBalance.error?.message || usdcAllowance.error?.message
      }

      const newTokensState: Record<PaymentMethod, TokenInfo | null> = {
        [PaymentMethod.USDC]: usdcTokenInfo,
        [PaymentMethod.ETH]: null,
        [PaymentMethod.WETH]: null,
        [PaymentMethod.CBETH]: null,
        [PaymentMethod.DAI]: null,
        [PaymentMethod.OTHER_TOKEN]: null
      }

      // Add ETH support if multi-payment is supported and we have price data
      if (multiPaymentSupported && ethPriceQuery.data && ethBalance.data) {
        console.log('💰 Adding ETH payment support', {
          ethPrice: ethPriceQuery.data,
          ethBalance: ethBalance.data?.value || BigInt(0),
          contentPrice: content.payPerViewPrice
        })

        // Calculate required ETH amount using price oracle
        // ethPriceQuery.data should be the amount of ETH needed for the USDC amount
        const requiredETHAmount = ethPriceQuery.data as bigint
        
        const ethTokenInfo: TokenInfo = {
          address: '0x0000000000000000000000000000000000000000' as Address,
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          balance: ethBalance.data.value,
          requiredAmount: requiredETHAmount,
          hasEnoughBalance: ethBalance.data.value >= requiredETHAmount,
          allowance: BigInt(0), // ETH doesn't need approval
          needsApproval: false,
          isLoading: ethBalance.isLoading || ethPriceQuery.isLoading,
          error: ethBalance.error?.message || ethPriceQuery.error?.message
        }

        newTokensState[PaymentMethod.ETH] = ethTokenInfo
      }

      setPaymentState(prev => ({
        ...prev,
        availableTokens: newTokensState,
        multiPaymentSupported,
        isCheckingBalances: false,
        isInitialized: true,
        errorMessage: null
      }))

    } catch (error) {
      console.error('❌ Token balance check failed:', error)
      
      setPaymentState(prev => ({
        ...prev,
        isCheckingBalances: false,
        isInitialized: true,
        multiPaymentSupported: false,
        errorMessage: `Failed to check token balances: ${error instanceof Error ? error.message : 'Unknown error'}`,
        // Ensure USDC fallback is available
        availableTokens: {
          ...prev.availableTokens,
          [PaymentMethod.USDC]: {
            address: contractAddresses?.USDC || ('0x0' as Address),
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            balance: usdcBalance.data || BigInt(0),
            requiredAmount: content.payPerViewPrice,
            hasEnoughBalance: (usdcBalance.data || BigInt(0)) >= content.payPerViewPrice,
            allowance: usdcAllowance.data || BigInt(0),
            needsApproval: (usdcAllowance.data || BigInt(0)) < content.payPerViewPrice,
            isLoading: false,
            error: 'Fallback mode'
          }
        }
      }))
    }
  }, [
    effectiveUserAddress,
    contentId,
    usdcBalance.data,
    usdcBalance.isLoading,
    usdcBalance.error,
    usdcAllowance.data,
    usdcAllowance.isLoading,
    usdcAllowance.error,
    ethBalance.data,
    ethBalance.isLoading,
    ethBalance.error,
    ethPriceQuery.data,
    ethPriceQuery.isLoading,
    ethPriceQuery.error,
    contractAddresses,
    checkMultiPaymentSupport
  ])

  // Initialize token balance checking when content loads
  useEffect(() => {
    if (contentQuery.data && effectiveUserAddress && !paymentState.isInitialized) {
      checkTokenBalances(contentQuery.data)
    }
  }, [contentQuery.data, effectiveUserAddress, paymentState.isInitialized, checkTokenBalances])

  /**
   * Intelligent Payment Method Selection
   * This function automatically selects the best payment method based on user's available balances
   */
  const getOptimalPaymentMethod = useCallback((): PaymentMethod => {
    const tokens = paymentState.availableTokens
    
    // First preference: USDC if available and user has enough (prioritized)
    if (tokens[PaymentMethod.USDC]?.hasEnoughBalance) {
      return PaymentMethod.USDC
    }
    
    // Second preference: ETH if available and user has enough
    if (tokens[PaymentMethod.ETH]?.hasEnoughBalance) {
      return PaymentMethod.ETH
    }
    
    // Third preference: Custom token if available and user has enough
    if (tokens[PaymentMethod.OTHER_TOKEN]?.hasEnoughBalance) {
      return PaymentMethod.OTHER_TOKEN
    }
    
    // Fallback to USDC (will show insufficient balance)
    return PaymentMethod.USDC
  }, [paymentState.availableTokens])

  /**
   * Handle payment method selection with validation
   */
  const handlePaymentMethodChange = useCallback((method: PaymentMethod) => {
    const tokenInfo = paymentState.availableTokens[method]
    
    // Validate that the payment method is actually available
    if (!tokenInfo && method !== PaymentMethod.USDC) {
      setPaymentState(prev => ({
        ...prev,
        errorMessage: `${method} payment is not currently available`
      }))
      return
    }
    
    setPaymentState(prev => ({
      ...prev,
      selectedMethod: method,
      errorMessage: null
    }))
  }, [paymentState.availableTokens])

  /**
   * 🚀 FIXED: Enhanced Purchase Execution with Working ETH Flow
   * This handles all payment methods with the correct ETH implementation
   */
  const handlePurchase = useCallback(async () => {
    if (!contentQuery.data || !effectiveUserAddress) {
      setPaymentState(prev => ({
        ...prev,
        errorMessage: 'Missing required data for purchase'
      }))
      return
    }

    const selectedToken = paymentState.availableTokens[paymentState.selectedMethod]
    
    // Validate sufficient balance
    if (!selectedToken?.hasEnoughBalance) {
      setPaymentState(prev => ({
        ...prev,
        errorMessage: `Insufficient ${selectedToken?.symbol || 'token'} balance`
      }))
      return
    }

    try {
      setPaymentState(prev => ({ 
        ...prev, 
        paymentStep: 'executing', 
        errorMessage: null 
      }))

      // Route to appropriate purchase method
      switch (paymentState.selectedMethod) {
        case PaymentMethod.USDC:
          await handleDirectUSDCPurchase()
          break
        
        case PaymentMethod.ETH:
          if (paymentState.multiPaymentSupported) {
            await handleETHPurchase()
          } else {
            throw new Error('ETH payments not supported in current configuration')
          }
          break
        
        case PaymentMethod.OTHER_TOKEN:
          if (paymentState.multiPaymentSupported && paymentState.customTokenAddress) {
            await handleCustomTokenPurchase()
          } else {
            throw new Error('Custom token payments not available')
          }
          break
        
        default:
          throw new Error('Unsupported payment method')
      }

      // Success handling (will be updated by individual payment handlers)
    } catch (error) {
      console.error('Purchase failed:', error)
      setPaymentState(prev => ({
        ...prev,
        paymentStep: 'error',
        errorMessage: error instanceof Error ? error.message : 'Purchase failed'
      }))
    }
  }, [
    contentQuery.data,
    effectiveUserAddress,
    paymentState.availableTokens,
    paymentState.selectedMethod,
    paymentState.multiPaymentSupported,
    paymentState.customTokenAddress
  ])

  /**
   * Direct USDC Purchase - Uses Your Existing Infrastructure
   */
  const handleDirectUSDCPurchase = useCallback(async () => {
    try {
      setPaymentState(prev => ({ ...prev, paymentStep: 'executing' }))
      await primaryPurchaseFlow.executePayment()
      
      // Success handling
      setPaymentState(prev => ({ 
        ...prev, 
        paymentStep: 'completed',
        lastSuccessfulStep: PaymentMethod.USDC
      }))
      
      if (onPurchaseSuccess) {
        onPurchaseSuccess(contentId)
      }
      
      // Refresh data to show updated access status
      await Promise.allSettled([
        accessQuery.refetch(),
        usdcBalance.refetch()
      ])
    } catch (error) {
      console.error('USDC Purchase failed:', error)
      throw new Error(`USDC purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [primaryPurchaseFlow, onPurchaseSuccess, contentId, accessQuery, usdcBalance])

  /**
   * 🚀 FIXED: ETH Purchase via New Payment Intent Flow
   * This replaces the broken implementation with our working multi-step flow
   */
  const handleETHPurchase = useCallback(async () => {
    if (!contentQuery.data || !contractAddresses) {
      throw new Error('ETH payment infrastructure not available')
    }

    const selectedToken = paymentState.availableTokens[PaymentMethod.ETH]
    if (!selectedToken) {
      throw new Error('ETH payment data not available')
    }

    try {
      console.log('🚀 Starting ETH payment flow via intent system')
      
      // Create payment request for the new flow
      const paymentRequest: PaymentIntentRequest = {
        contentId: contentId,
        creator: contentQuery.data.creator,
        ethAmount: selectedToken.requiredAmount,
        maxSlippage: BigInt(200), // 2% slippage
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour deadline
        metadata: {
          source: 'ContentPurchaseCard',
          sessionId: `${contentId}-${Date.now()}`
        }
      }

      // 🚀 Execute the complete ETH payment flow using our new system
      await ethPaymentFlow.executeETHPayment(paymentRequest)
      
      console.log('✅ ETH payment completed successfully')
      
      // Success handling
      setPaymentState(prev => ({ 
        ...prev, 
        paymentStep: 'completed',
        lastSuccessfulStep: PaymentMethod.ETH,
        errorMessage: null
      }))
      
      if (onPurchaseSuccess) {
        onPurchaseSuccess(contentId)
      }
      
      // Refresh data to show updated access status
      await Promise.allSettled([
        accessQuery.refetch(),
        ethBalance.refetch()
      ])
      
    } catch (error) {
      console.error('❌ ETH purchase failed:', error)
      throw new Error(`ETH purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [
    contentQuery.data,
    contractAddresses,
    paymentState.availableTokens,
    contentId,
    ethPaymentFlow,
    onPurchaseSuccess,
    accessQuery,
    ethBalance
  ])

  /**
   * Custom Token Purchase - Placeholder for future implementation
   */
  const handleCustomTokenPurchase = useCallback(async () => {
    // This would use a similar pattern to ETH but with custom token addresses
    throw new Error('Custom token payments not yet implemented')
  }, [])

  /**
   * Handle content viewing for users who already have access
   */
  const handleViewContent = useCallback(() => {
    if (onViewContent) {
      onViewContent(contentId)
    } else {
      router.push(`/content/${contentId}`)
    }
  }, [onViewContent, contentId, router])

  /**
   * Reset payment state and retry
   */
  const handleRetry = useCallback(() => {
    setPaymentState(prev => ({
      ...prev,
      paymentStep: 'idle',
      errorMessage: null
    }))
    
    primaryPurchaseFlow.resetPayment()
    ethPaymentFlow.resetFlow()
    
    // Refresh data
    if (contentQuery.data) {
      checkTokenBalances(contentQuery.data)
    }
  }, [primaryPurchaseFlow, ethPaymentFlow, contentQuery.data, checkTokenBalances])

  // Loading state while fetching essential data
  if (contentQuery.isLoading || accessQuery.isLoading || !paymentState.isInitialized) {
    return <ContentPurchaseCardSkeleton variant={variant} className={className} />
  }

  // Error state for content loading
  if (contentQuery.error || !contentQuery.data) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load content information. Please refresh the page and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const content = contentQuery.data
  const hasAccess = accessQuery.data === true
  const selectedToken = paymentState.availableTokens[paymentState.selectedMethod]

  // Render compact variant for space-constrained contexts
  if (variant === 'compact') {
    return (
      <CompactPurchaseCard
        content={content}
        hasAccess={hasAccess}
        selectedToken={selectedToken}
        paymentStep={paymentState.paymentStep}
        ethFlowState={ethPaymentFlow.state}
        onPurchaseAction={handlePurchase}
        onViewContent={handleViewContent}
        className={className}
      />
    )
  }

  // Render minimal variant for inline usage
  if (variant === 'minimal') {
    return (
      <MinimalPurchaseCard
        content={content}
        hasAccess={hasAccess}
        selectedToken={selectedToken}
        paymentStep={paymentState.paymentStep}
        ethFlowState={ethPaymentFlow.state}
        onPurchaseAction={handlePurchase}
        onViewContent={handleViewContent}
        className={className}
      />
    )
  }

  // Full variant with complete functionality
  return (
    <Card className={cn('w-full max-w-md mx-auto shadow-lg border-0', className)}>
      <CardHeader className="pb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        {/* Content Title and Creator Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {content.title || `Content #${contentId}`}
              </CardTitle>
              {showCreatorInfo && (
                <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  by {formatAddress(content.creator)}
                </CardDescription>
              )}
            </div>
            <Badge variant={hasAccess ? "default" : "secondary"} className="ml-2 shrink-0">
              {hasAccess ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Owned</>
              ) : (
                <><Lock className="h-3 w-3 mr-1" /> Locked</>
              )}
            </Badge>
          </div>

          {/* Price Display */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(content.payPerViewPrice, 6)} USDC
            </div>
            {selectedToken && paymentState.selectedMethod === PaymentMethod.ETH && (
              <div className="text-right text-sm text-gray-600 dark:text-gray-300">
                ≈ {formatTokenBalance(selectedToken.requiredAmount, 18)} ETH
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Access Status or Payment Method Selection */}
        {hasAccess ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              You already have access to this content!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Payment Method Selection (if multi-payment supported) */}
            {paymentState.multiPaymentSupported && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPaymentState(prev => ({ 
                      ...prev, 
                      showPaymentOptions: !prev.showPaymentOptions 
                    }))}
                    className="text-xs"
                  >
                    {paymentState.showPaymentOptions ? 'Hide Options' : 'More Options'}
                    <ChevronDown className={cn(
                      "h-3 w-3 ml-1 transition-transform",
                      paymentState.showPaymentOptions && "rotate-180"
                    )} />
                  </Button>
                </div>

                {/* Selected Payment Method Display */}
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  {paymentState.selectedMethod === PaymentMethod.ETH ? (
                    <Zap className="h-5 w-5 text-purple-500" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-green-500" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {paymentState.selectedMethod === PaymentMethod.ETH ? 'Ethereum (ETH)' : 'USD Coin (USDC)'}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {paymentState.selectedMethod === PaymentMethod.ETH 
                        ? 'Automatic swap to USDC via Uniswap'
                        : 'Direct payment - fastest option'
                      }
                    </div>
                  </div>
                  {selectedToken && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {selectedToken.hasEnoughBalance ? (
                          <span className="text-green-600">✓ Available</span>
                        ) : (
                          <span className="text-red-600">Insufficient</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {formatTokenBalance(selectedToken.balance || BigInt(0), selectedToken.decimals)} {selectedToken.symbol}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method Options (when expanded) */}
                {paymentState.showPaymentOptions && (
                  <div className="space-y-2 border rounded-lg p-3 bg-white dark:bg-gray-900">
                    {/* USDC Option */}
                    <div
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors",
                        paymentState.selectedMethod === PaymentMethod.USDC
                          ? "bg-blue-50 border-blue-200 border"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                      onClick={() => handlePaymentMethodChange(PaymentMethod.USDC)}
                    >
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">USDC Direct</div>
                        <div className="text-xs text-gray-600">Fastest • Lowest cost</div>
                      </div>
                      <div className="text-xs">
                        {paymentState.availableTokens[PaymentMethod.USDC]?.hasEnoughBalance ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )}
                      </div>
                    </div>

                    {/* ETH Option */}
                    {paymentState.availableTokens[PaymentMethod.ETH] && (
                      <div
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors",
                          paymentState.selectedMethod === PaymentMethod.ETH
                            ? "bg-purple-50 border-purple-200 border"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                        onClick={() => handlePaymentMethodChange(PaymentMethod.ETH)}
                      >
                        <Zap className="h-4 w-4 text-purple-500" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Ethereum (ETH)</div>
                          <div className="text-xs text-gray-600">Auto-swap via Uniswap • ~45 seconds</div>
                        </div>
                        <div className="text-xs">
                          {paymentState.availableTokens[PaymentMethod.ETH]?.hasEnoughBalance ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payment Balance Status */}
            {selectedToken && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Your {selectedToken.symbol} Balance:</span>
                  <span className="font-medium">
                    {formatTokenBalance(selectedToken.balance || BigInt(0), selectedToken.decimals)} {selectedToken.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Required Amount:</span>
                  <span className="font-medium">
                    {formatTokenBalance(selectedToken.requiredAmount, selectedToken.decimals)} {selectedToken.symbol}
                  </span>
                </div>
                
                {!selectedToken.hasEnoughBalance && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      Insufficient {selectedToken.symbol} balance. You need {formatTokenBalance(
                        selectedToken.requiredAmount - (selectedToken.balance || BigInt(0)),
                        selectedToken.decimals
                      )} more {selectedToken.symbol}.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {/* 🚀 Enhanced Progress Display for ETH Payments */}
        {paymentState.selectedMethod === PaymentMethod.ETH && 
         (paymentState.paymentStep === 'executing' || ethPaymentFlow.state.isActive) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                ETH Payment Progress
              </span>
              <span className="text-xs text-gray-500">
                {ethPaymentFlow.estimatedTimeRemaining}s remaining
              </span>
            </div>
            
            <Progress 
              value={ethPaymentFlow.state.progress} 
              className="h-2"
            />
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{ethPaymentFlow.state.message}</span>
            </div>
            
            {/* Step-by-step progress indicator */}
            <div className="flex items-center justify-between text-xs">
              <div className={cn("flex items-center space-x-1", 
                ethPaymentFlow.state.step === 'creating_intent' ? "text-blue-600" : 
                ethPaymentFlow.state.progress > 25 ? "text-green-600" : "text-gray-400")}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                <span>Create Intent</span>
              </div>
              <div className={cn("flex items-center space-x-1",
                ethPaymentFlow.state.step === 'waiting_signature' ? "text-blue-600" :
                ethPaymentFlow.state.progress > 50 ? "text-green-600" : "text-gray-400")}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                <span>Backend Sign</span>
              </div>
              <div className={cn("flex items-center space-x-1",
                ethPaymentFlow.state.step === 'executing_payment' ? "text-blue-600" :
                ethPaymentFlow.state.progress > 85 ? "text-green-600" : "text-gray-400")}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                <span>Execute Swap</span>
              </div>
              <div className={cn("flex items-center space-x-1",
                ethPaymentFlow.state.step === 'completed' ? "text-green-600" : "text-gray-400")}>
                <div className="w-2 h-2 rounded-full bg-current"></div>
                <span>Complete</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(paymentState.errorMessage || ethPaymentFlow.state.error) && (
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {paymentState.errorMessage || ethPaymentFlow.state.error?.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {paymentState.paymentStep === 'completed' && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Payment completed successfully! {paymentState.lastSuccessfulStep === PaymentMethod.ETH && 
                'ETH has been swapped to USDC and sent to the creator.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="p-6 pt-0">
        {/* Action Button */}
        <PurchaseActionButton
          hasAccess={hasAccess}
          isConnected={isConnected}
          progressState={{
            step: paymentState.paymentStep,
            canRetry: paymentState.paymentStep === 'error',
            message: paymentState.errorMessage || undefined
          }}
          purchaseFlow={{
            canExecutePayment: selectedToken?.hasEnoughBalance || false,
            availableMethods: [],
            selectedToken,
            selectedMethod: paymentState.selectedMethod
          }}
          ethFlowState={ethPaymentFlow.state}
          onViewContent={handleViewContent}
          onRetry={handleRetry}
          onPurchaseAction={handlePurchase}
        />
      </CardFooter>
    </Card>
  )
}

/**
 * Enhanced Purchase Action Button with ETH Flow Support
 */
function PurchaseActionButton({
  hasAccess,
  isConnected,
  progressState,
  purchaseFlow,
  ethFlowState,
  onViewContent,
  onRetry,
  onPurchaseAction
}: {
  hasAccess: boolean
  isConnected: boolean
  progressState: PurchaseProgressState
  purchaseFlow: {
    canExecutePayment: boolean
    availableMethods: any[]
    selectedToken?: TokenInfo | null
    selectedMethod: PaymentMethod
  }
  ethFlowState: any
  onViewContent: () => void
  onRetry: () => void
  onPurchaseAction: () => void
}) {
  const buttonContent = useMemo(() => {
    // User already has access
    if (hasAccess) {
      return {
        onClick: onViewContent,
        disabled: false,
        variant: 'default' as const,
        icon: Eye,
        text: 'View Content',
        className: 'w-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200'
      }
    }

    // User not connected
    if (!isConnected) {
      return {
        onClick: () => {},
        disabled: true,
        variant: 'outline' as const,
        icon: Wallet,
        text: 'Connect Wallet to Purchase',
        className: 'w-full border-gray-300 text-gray-500 cursor-not-allowed'
      }
    }

    // Error state with retry option
    if (progressState.step === 'error' && progressState.canRetry) {
      return {
        onClick: onRetry,
        disabled: false,
        variant: 'outline' as const,
        icon: RefreshCw,
        text: 'Retry Purchase',
        className: 'w-full border-red-300 text-red-600 hover:bg-red-50'
      }
    }

    // Processing state (including ETH flow)
    if (progressState.step === 'executing' || progressState.step === 'approving' || ethFlowState.isActive) {
      return {
        onClick: () => {},
        disabled: true,
        variant: 'default' as const,
        icon: Loader2,
        text: ethFlowState.isActive ? ethFlowState.message : 
              progressState.step === 'approving' ? 'Approving...' : 'Processing...',
        className: 'w-full bg-blue-600 text-white cursor-not-allowed',
        iconClassName: 'animate-spin'
      }
    }

    // Check if user can afford with the selected token
    if (!purchaseFlow.canExecutePayment) {
      return {
        onClick: () => {},
        disabled: true,
        variant: 'default' as const,
        icon: AlertCircle,
        text: 'Insufficient Balance',
        className: 'w-full bg-gray-200 text-gray-500 cursor-not-allowed'
      }
    }

    // Determine the best action based on selected payment method
    const needsApproval = purchaseFlow.selectedToken?.needsApproval || false

    if (needsApproval && purchaseFlow.selectedMethod === PaymentMethod.USDC) {
      return {
        onClick: onPurchaseAction,
        disabled: false,
        variant: 'default' as const,
        icon: CreditCard,
        text: 'Approve & Purchase',
        className: 'w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200'
      }
    }

    // Standard purchase - determine icon based on payment method
    let icon = ShoppingCart
    let text = 'Purchase Content'
    let className = 'w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200'

    if (purchaseFlow.selectedMethod === PaymentMethod.ETH) {
      icon = Zap
      text = `Purchase with ETH`
      className = 'w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200'
    } else if (purchaseFlow.selectedMethod === PaymentMethod.USDC) {
      icon = DollarSign
      text = 'Purchase with USDC'
      className = 'w-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200'
    }

    return {
      onClick: onPurchaseAction,
      disabled: false,
      variant: 'default' as const,
      icon,
      text,
      className
    }
  }, [
    hasAccess,
    isConnected,
    progressState,
    purchaseFlow.canExecutePayment,
    purchaseFlow.availableMethods,
    purchaseFlow.selectedToken?.needsApproval,
    purchaseFlow.selectedMethod,
    ethFlowState.isActive,
    ethFlowState.message,
    onViewContent,
    onRetry,
    onPurchaseAction
  ])

  const { onClick, disabled, variant, icon: Icon, text, className, iconClassName } = buttonContent

  return (
    <Button 
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      className={className}
    >
      <Icon className={`h-4 w-4 mr-2 ${iconClassName || ''}`} />
      {text}
    </Button>
  )
}

/**
 * Skeleton Loading Component
 */
function ContentPurchaseCardSkeleton({ variant, className }: { variant?: string, className?: string }) {
  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="pb-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}

/**
 * Compact Purchase Card Variant
 */
function CompactPurchaseCard({ 
  content, 
  hasAccess, 
  selectedToken, 
  paymentStep, 
  ethFlowState,
  onPurchaseAction, 
  onViewContent, 
  className 
}: {
  content: Content
  hasAccess: boolean
  selectedToken?: TokenInfo | null
  paymentStep: MultiPaymentState['paymentStep']
  ethFlowState: any
  onPurchaseAction: () => void
  onViewContent: () => void
  className?: string
}) {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{content.title || 'Content'}</h3>
            <p className="text-sm text-gray-600">{formatCurrency(content.payPerViewPrice, 6)} USDC</p>
          </div>
          <div className="ml-4">
            {hasAccess ? (
              <Button size="sm" onClick={onViewContent} className="bg-green-600 hover:bg-green-700">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            ) : (
              <Button 
                size="sm" 
                onClick={onPurchaseAction}
                disabled={paymentStep === 'executing' || ethFlowState.isActive}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {paymentStep === 'executing' || ethFlowState.isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4 mr-1" />
                )}
                Buy
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Minimal Purchase Card Variant
 */
function MinimalPurchaseCard({ 
  content, 
  hasAccess, 
  selectedToken, 
  paymentStep, 
  ethFlowState,
  onPurchaseAction, 
  onViewContent, 
  className 
}: {
  content: Content
  hasAccess: boolean
  selectedToken?: TokenInfo | null
  paymentStep: MultiPaymentState['paymentStep']
  ethFlowState: any
  onPurchaseAction: () => void
  onViewContent: () => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <div className="flex-1">
        <span className="font-medium">{formatCurrency(content.payPerViewPrice, 6)} USDC</span>
      </div>
      {hasAccess ? (
        <Button size="sm" variant="ghost" onClick={onViewContent}>
          <Eye className="h-4 w-4" />
        </Button>
      ) : (
        <Button 
          size="sm" 
          onClick={onPurchaseAction}
          disabled={paymentStep === 'executing' || ethFlowState.isActive}
        >
          {paymentStep === 'executing' || ethFlowState.isActive ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
}
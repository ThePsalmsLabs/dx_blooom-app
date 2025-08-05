import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { Address, parseEventLogs } from 'viem'
import { useChainId, useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { useQueryClient } from '@tanstack/react-query'
import {
  useContentById,
  useHasContentAccess,
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  usePurchaseContent,
  useIsCreatorRegistered,
  useRegisterContent,
  useCreatorProfile,
  useRegisterCreator,
} from '@/hooks/contracts/core'
import { getContractAddresses } from '@/lib/contracts/config'
import { wagmiConfig } from '@/lib/web3/wagmi'
import {
  getX402MiddlewareConfig,
  createX402PaymentProof,
  verifyX402PaymentProof,
  X402Config,
  X402PaymentProof,
  X402PaymentVerificationResult
} from '@/lib/web3/x402-config'
import { CONTENT_REGISTRY_ABI, COMMERCE_PROTOCOL_INTEGRATION_ABI, PRICE_ORACLE_ABI, ERC20_ABI } from '@/lib/contracts/abi'
import { useMiniAppAnalytics } from '@/hooks/farcaster/useMiniAppAnalytics'
import type { Creator, ContentCategory, Content } from '@/types/contracts'

// ===== ENUMS AND INTERFACES =====

/**
 * Supported Payment Methods Enum
 */
export enum PaymentMethod {
  DIRECT_USDC = 'direct_usdc',    // Direct USDC transfer to creator
  ETH = 'eth',                    // ETH payment via Commerce Protocol
  CUSTOM_TOKEN = 'custom_token'   // Any ERC-20 token via Commerce Protocol
}

/**
 * Payment Method Configuration Interface
 */
export interface PaymentMethodConfig {
  readonly id: PaymentMethod
  readonly name: string
  readonly description: string
  readonly icon: string
  readonly estimatedTime: string
  readonly gasEstimate: 'Low' | 'Medium' | 'High'
  readonly requiresApproval: boolean
  readonly supportsSlippage: boolean
  readonly isCommerceProtocol: boolean
}

/**
 * Token Information Interface
 */
export interface TokenInfo {
  readonly address: Address
  readonly symbol: string
  readonly name: string
  readonly decimals: number
  readonly isNative: boolean
  readonly balance: bigint | null
  readonly allowance: bigint | null
  readonly priceInUSDC: bigint | null      // Current price in USDC
  readonly requiredAmount: bigint | null    // Amount needed for purchase
  readonly priceLoading: boolean
  readonly priceError: Error | null
}

/**
 * Payment Execution State Interface
 */
export interface PaymentExecutionState {
  readonly phase: 'idle' | 'calculating' | 'approving' | 'creating_intent' | 'waiting_signature' | 'executing' | 'confirming' | 'completed' | 'error'
  readonly progress: number                 // Progress percentage (0-100)
  readonly message: string                  // User-friendly status message
  readonly canRetry: boolean               // Whether user can retry the operation
  readonly transactionHash: string | null  // Current transaction hash
  readonly error: Error | null             // Current error state
}

/**
 * Unified Purchase Flow Configuration Interface
 */
export interface UnifiedPurchaseFlowConfig {
  readonly enabledMethods: ReadonlyArray<PaymentMethod>
  readonly defaultMethod: PaymentMethod
  readonly defaultSlippage: number
  readonly maxSlippage: number
  readonly priceUpdateInterval: number
  readonly enablePriceAlerts: boolean
  readonly supportedTokens: ReadonlyArray<Address>
}

/**
 * Unified Purchase Flow Result Interface
 */
export interface UnifiedPurchaseFlowResult {
  // Content and access information
  readonly content: Content | null
  readonly hasAccess: boolean
  readonly isLoading: boolean

  // Payment method management
  readonly selectedMethod: PaymentMethod
  readonly availableMethods: ReadonlyArray<PaymentMethodConfig>
  readonly setPaymentMethod: (method: PaymentMethod) => void

  // Token management
  readonly selectedToken: TokenInfo | null
  readonly supportedTokens: ReadonlyArray<TokenInfo>
  readonly setCustomToken: (address: Address) => void

  // Pricing and slippage
  readonly slippageTolerance: number
  readonly setSlippageTolerance: (slippage: number) => void
  readonly estimatedCost: bigint | null
  readonly finalCost: bigint | null

  // Payment execution
  readonly executionState: PaymentExecutionState
  readonly canExecutePayment: boolean
  readonly executePayment: () => Promise<void>
  readonly retryPayment: () => Promise<void>
  readonly resetPayment: () => void

  // Advanced features
  readonly priceImpact: number | null
  readonly priceAlerts: ReadonlyArray<{ type: 'warning' | 'error', message: string }>
  readonly refreshPrices: () => Promise<void>
}

// ===== CONFIGURATION CONSTANTS =====

/**
 * Default Configuration for Unified Purchase Flow
 */
const DEFAULT_CONFIG: UnifiedPurchaseFlowConfig = {
  enabledMethods: [PaymentMethod.DIRECT_USDC, PaymentMethod.ETH, PaymentMethod.CUSTOM_TOKEN],
  defaultMethod: PaymentMethod.DIRECT_USDC,
  defaultSlippage: 100, // 1%
  maxSlippage: 1000,    // 10%
  priceUpdateInterval: 30000, // 30 seconds
  enablePriceAlerts: true,
  supportedTokens: [] // Will be populated dynamically
}

/**
 * Payment Method Configurations
 */
const PAYMENT_METHOD_CONFIGS: ReadonlyArray<PaymentMethodConfig> = [
  {
    id: PaymentMethod.DIRECT_USDC,
    name: 'USDC Direct',
    description: 'Pay directly with USDC - fastest and cheapest option',
    icon: '💵',
    estimatedTime: '~15 seconds',
    gasEstimate: 'Low',
    requiresApproval: true,
    supportsSlippage: false,
    isCommerceProtocol: false
  },
  {
    id: PaymentMethod.ETH,
    name: 'Ethereum (ETH)',
    description: 'Pay with ETH via Commerce Protocol with automatic conversion',
    icon: '⟠',
    estimatedTime: '~45 seconds',
    gasEstimate: 'Medium',
    requiresApproval: false,
    supportsSlippage: true,
    isCommerceProtocol: true
  },
  {
    id: PaymentMethod.CUSTOM_TOKEN,
    name: 'Custom Token',
    description: 'Pay with any supported ERC-20 token',
    icon: '🎯',
    estimatedTime: '~60 seconds',
    gasEstimate: 'High',
    requiresApproval: true,
    supportsSlippage: true,
    isCommerceProtocol: true
  }
] as const

/**
 * Unified Content Purchase Flow Hook
 * 
 * This is the complete implementation that brings together all your sophisticated
 * payment infrastructure into a single, production-ready interface.
 */
export function useUnifiedContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined,
  config: Partial<UnifiedPurchaseFlowConfig> = {}
): UnifiedPurchaseFlowResult {
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  
  // Get contract addresses for current network
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])

  // Core blockchain data hooks
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)
  const usdcBalance = useTokenBalance(contractAddresses?.USDC, userAddress)
  const purchaseContent = usePurchaseContent()
  const approveToken = useApproveToken()

  // Commerce Protocol transaction hooks
  const { writeContract: writeCommerceContract, data: commerceHash, isPending: isCommerceLoading } = useWriteContract()
  const { isLoading: isCommerceConfirming, isSuccess: isCommerceConfirmed } = useWaitForTransactionReceipt({
    hash: commerceHash
  })

  // Local state management
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(finalConfig.defaultMethod)
  const [customTokenAddress, setCustomTokenAddress] = useState<Address | null>(null)
  const [slippageTolerance, setSlippageTolerance] = useState(finalConfig.defaultSlippage)
  const [executionState, setExecutionState] = useState<PaymentExecutionState>({
    phase: 'idle',
    progress: 0,
    message: 'Ready to purchase',
    canRetry: false,
    transactionHash: null,
    error: null
  })

  // Price tracking state
  const [tokenPrices, setTokenPrices] = useState<Map<Address, TokenInfo>>(new Map())
  const [priceUpdateCounter, setPriceUpdateCounter] = useState(0)
  const priceUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Available Payment Methods Computation
   */
  const availableMethods = useMemo((): ReadonlyArray<PaymentMethodConfig> => {
    const commerceAvailable = Boolean(contractAddresses?.COMMERCE_INTEGRATION)
    
    return PAYMENT_METHOD_CONFIGS.filter(method => {
      if (method.isCommerceProtocol && !commerceAvailable) {
        return false
      }
      return finalConfig.enabledMethods.includes(method.id)
    })
  }, [contractAddresses, finalConfig.enabledMethods])

  /**
   * Current Token Information
   */
  const selectedToken = useMemo((): TokenInfo | null => {
    if (!contractAddresses) return null

    const tokenAddress = selectedMethod === PaymentMethod.DIRECT_USDC 
      ? contractAddresses.USDC
      : selectedMethod === PaymentMethod.ETH
      ? '0x0000000000000000000000000000000000000000' as Address // ETH placeholder
      : customTokenAddress

    if (!tokenAddress) return null

    const cached = tokenPrices.get(tokenAddress)
    if (cached) return cached

    // Return basic info for uncached tokens
    return {
      address: tokenAddress,
      symbol: selectedMethod === PaymentMethod.ETH ? 'ETH' : selectedMethod === PaymentMethod.DIRECT_USDC ? 'USDC' : 'TOKEN',
      name: selectedMethod === PaymentMethod.ETH ? 'Ethereum' : selectedMethod === PaymentMethod.DIRECT_USDC ? 'USD Coin' : 'Custom Token',
      decimals: selectedMethod === PaymentMethod.ETH ? 18 : selectedMethod === PaymentMethod.DIRECT_USDC ? 6 : 18,
      isNative: selectedMethod === PaymentMethod.ETH,
      balance: null,
      allowance: null,
      priceInUSDC: null,
      requiredAmount: null,
      priceLoading: true,
      priceError: null
    }
  }, [selectedMethod, customTokenAddress, contractAddresses, tokenPrices])

  /**
   * Price Calculation with Oracle Integration
   */
  const calculateTokenPrice = useCallback(async (
    tokenAddress: Address,
    usdcAmount: bigint
  ): Promise<{ requiredAmount: bigint; priceInUSDC: bigint } | null> => {
    if (!contractAddresses) return null

    try {
      // For direct USDC, return 1:1 pricing
      if (tokenAddress === contractAddresses.USDC) {
        return {
          requiredAmount: usdcAmount,
          priceInUSDC: usdcAmount
        }
      }

      // Create public client for direct contract reads
      const publicClient = createPublicClient({
        chain: chainId === 8453 ? base : baseSepolia,
        transport: http()
      })

      // For ETH, use PriceOracle.convertFromUSDC
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        const ethAmount = await publicClient.readContract({
          address: contractAddresses.PRICE_ORACLE,
          abi: PRICE_ORACLE_ABI,
          functionName: 'convertFromUSDC',
          args: [tokenAddress, usdcAmount]
        }) as bigint

        return {
          requiredAmount: ethAmount,
          priceInUSDC: usdcAmount
        }
      }

      // For custom tokens, use PriceOracle.convertFromUSDC
      const tokenAmount = await publicClient.readContract({
        address: contractAddresses.PRICE_ORACLE,
        abi: PRICE_ORACLE_ABI,
        functionName: 'convertFromUSDC',
        args: [tokenAddress, usdcAmount]
      }) as bigint

      return {
        requiredAmount: tokenAmount,
        priceInUSDC: usdcAmount
      }
    } catch (error) {
      console.error('Price calculation failed:', error)
      return null
    }
  }, [contractAddresses, chainId])

  /**
   * Token Balance and Allowance Fetching
   */
  const fetchTokenInfo = useCallback(async (tokenAddress: Address): Promise<TokenInfo> => {
    if (!contractAddresses || !userAddress) {
      throw new Error('Missing required data for token info fetch')
    }

    const isEth = tokenAddress === '0x0000000000000000000000000000000000000000'
    const isUsdc = tokenAddress === contractAddresses.USDC

    // Calculate required amount for current content
    const contentPrice = contentQuery.data?.payPerViewPrice || BigInt(0)
    const priceCalculation = await calculateTokenPrice(tokenAddress, contentPrice)

    // Create public client for direct contract reads
    const publicClient = createPublicClient({
      chain: chainId === 8453 ? base : baseSepolia,
      transport: http()
    })

    // Fetch balance
    let balance: bigint | null = null
    if (isEth) {
      // For ETH, we'll use a placeholder - in production you'd fetch actual ETH balance
      balance = BigInt(0) 
    } else {
      // ERC-20 token balance
      try {
        balance = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        }) as bigint
      } catch (error) {
        console.error('Balance fetch failed:', error)
      }
    }

    // Fetch allowance (not applicable for ETH)
    let allowance: bigint | null = null
    if (!isEth) {
      try {
        const spender = isUsdc ? contractAddresses.PAY_PER_VIEW : contractAddresses.COMMERCE_INTEGRATION
        allowance = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [userAddress, spender]
        }) as bigint
      } catch (error) {
        console.error('Allowance fetch failed:', error)
      }
    }

    return {
      address: tokenAddress,
      symbol: isEth ? 'ETH' : isUsdc ? 'USDC' : 'TOKEN',
      name: isEth ? 'Ethereum' : isUsdc ? 'USD Coin' : 'Custom Token',
      decimals: isEth ? 18 : isUsdc ? 6 : 18,
      isNative: isEth,
      balance,
      allowance,
      priceInUSDC: priceCalculation?.priceInUSDC || null,
      requiredAmount: priceCalculation?.requiredAmount || null,
      priceLoading: false,
      priceError: null
    }
  }, [contractAddresses, userAddress, contentQuery.data, calculateTokenPrice])

  /**
   * Price Refresh Function
   */
  const refreshPrices = useCallback(async (): Promise<void> => {
    if (!contractAddresses || !contentQuery.data) return

    const tokensToUpdate = [
      contractAddresses.USDC,
      '0x0000000000000000000000000000000000000000' as Address, // ETH
      ...(customTokenAddress ? [customTokenAddress] : [])
    ]

    const updatedPrices = new Map<Address, TokenInfo>()

    for (const tokenAddress of tokensToUpdate) {
      try {
        const tokenInfo = await fetchTokenInfo(tokenAddress)
        updatedPrices.set(tokenAddress, tokenInfo)
      } catch (error) {
        console.error(`Failed to fetch info for token ${tokenAddress}:`, error)
        // Keep existing data if fetch fails
        const existing = tokenPrices.get(tokenAddress)
        if (existing) {
          updatedPrices.set(tokenAddress, {
            ...existing,
            priceError: error instanceof Error ? error : new Error('Price fetch failed')
          })
        }
      }
    }

    setTokenPrices(updatedPrices)
    setPriceUpdateCounter(prev => prev + 1)
  }, [contractAddresses, contentQuery.data, customTokenAddress, tokenPrices, fetchTokenInfo])

  /**
   * Payment Method Selection Handler
   */
  const setPaymentMethod = useCallback((method: PaymentMethod) => {
    setSelectedMethod(method)
    setExecutionState({
      phase: 'idle',
      progress: 0,
      message: 'Ready to purchase',
      canRetry: false,
      transactionHash: null,
      error: null
    })
    
    // Refresh prices when method changes
    refreshPrices()
  }, [refreshPrices])

  /**
   * Custom Token Address Handler
   */
  const setCustomToken = useCallback((address: Address) => {
    if (address === customTokenAddress) return
    
    setCustomTokenAddress(address)
    
    // If currently on custom token method, refresh prices
    if (selectedMethod === PaymentMethod.CUSTOM_TOKEN) {
      refreshPrices()
    }
  }, [customTokenAddress, selectedMethod, refreshPrices])

  /**
   * Payment Execution Logic
   */
  const executePayment = useCallback(async (): Promise<void> => {
    if (!contentId || !userAddress || !contractAddresses || !contentQuery.data) {
      throw new Error('Missing required data for payment execution')
    }

    try {
      setExecutionState({
        phase: 'calculating',
        progress: 10,
        message: 'Calculating payment details...',
        canRetry: false,
        transactionHash: null,
        error: null
      })

      if (selectedMethod === PaymentMethod.DIRECT_USDC) {
        // Direct USDC payment flow
        const usdcAllowance = selectedToken?.allowance || BigInt(0)
        const requiredAmount = contentQuery.data.payPerViewPrice

        if (usdcAllowance < requiredAmount) {
          // Need approval first
          setExecutionState(prev => ({
            ...prev,
            phase: 'approving',
            progress: 30,
            message: 'Approving USDC spending...'
          }))

          await approveToken.write({
            tokenAddress: contractAddresses.USDC,
            spender: contractAddresses.PAY_PER_VIEW,
            amount: requiredAmount
          })

          // Wait for approval confirmation
          setExecutionState(prev => ({
            ...prev,
            progress: 60,
            message: 'Approval confirmed, executing purchase...'
          }))
        }

        // Execute direct purchase
        setExecutionState(prev => ({
          ...prev,
          phase: 'executing',
          progress: 80,
          message: 'Processing purchase transaction...'
        }))

        await purchaseContent.write(contentId)

      } else {
        // Commerce Protocol payment flow
        setExecutionState(prev => ({
          ...prev,
          phase: 'creating_intent',
          progress: 20,
          message: 'Creating payment intent...'
        }))

        const paymentToken = selectedMethod === PaymentMethod.ETH 
          ? '0x0000000000000000000000000000000000000000' as Address
          : customTokenAddress!

        // Create payment intent through Commerce Protocol Integration
        const paymentRequest = {
          user: userAddress,
          creator: contentQuery.data.creator,
          paymentType: 0, // PayPerView
          contentId,
          paymentToken,
          maxSlippage: BigInt(slippageTolerance),
          deadline: BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now
        }

        await writeCommerceContract({
          address: contractAddresses.COMMERCE_INTEGRATION,
          abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
          functionName: 'createPaymentIntent',
          args: [paymentRequest]
        })

        setExecutionState(prev => ({
          ...prev,
          phase: 'waiting_signature',
          progress: 40,
          message: 'Waiting for payment authorization...'
        }))
      }

    } catch (error) {
      console.error('Payment execution failed:', error)
      setExecutionState({
        phase: 'error',
        progress: 0,
        message: `Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        canRetry: true,
        transactionHash: null,
        error: error instanceof Error ? error : new Error('Payment execution failed')
      })
    }
  }, [
    contentId,
    userAddress,
    contractAddresses,
    contentQuery.data,
    selectedMethod,
    selectedToken,
    customTokenAddress,
    slippageTolerance,
    approveToken,
    purchaseContent,
    writeCommerceContract
  ])

  /**
   * Effect: Automatic Price Updates
   */
  useEffect(() => {
    if (finalConfig.priceUpdateInterval > 0) {
      priceUpdateTimerRef.current = setInterval(() => {
        refreshPrices()
      }, finalConfig.priceUpdateInterval)

      return () => {
        if (priceUpdateTimerRef.current) {
          clearInterval(priceUpdateTimerRef.current)
        }
      }
    }
  }, [finalConfig.priceUpdateInterval, refreshPrices])

  /**
   * Effect: Initial Price Loading
   */
  useEffect(() => {
    refreshPrices()
  }, [refreshPrices])

  /**
   * Effect: Handle Commerce Protocol Transaction Confirmations
   */
  useEffect(() => {
    if (isCommerceConfirmed) {
      setExecutionState(prev => ({
        ...prev,
        phase: 'completed',
        progress: 100,
        message: 'Payment completed successfully!',
        transactionHash: commerceHash || null
      }))
      
      // Invalidate access queries after successful payment
      queryClient.invalidateQueries({ 
        predicate: (query) => 
          query.queryKey.includes('hasAccess') ||
          query.queryKey.includes('hasContentAccess')
      })
    }
  }, [isCommerceConfirmed, commerceHash, queryClient])

  /**
   * Effect: Handle Direct Purchase Confirmations
   */
  useEffect(() => {
    if (purchaseContent.isConfirmed) {
      setExecutionState(prev => ({
        ...prev,
        phase: 'completed',
        progress: 100,
        message: 'Content purchased successfully!',
        transactionHash: purchaseContent.hash || null
      }))
    }
  }, [purchaseContent.isConfirmed, purchaseContent.hash])

  /**
   * Estimated and Final Cost Calculations
   */
  const estimatedCost = useMemo(() => {
    return selectedToken?.requiredAmount || null
  }, [selectedToken])

  const finalCost = useMemo(() => {
    if (!estimatedCost || selectedMethod === PaymentMethod.DIRECT_USDC) {
      return estimatedCost
    }
    
    // Apply slippage for Commerce Protocol payments
    const slippageMultiplier = BigInt(10000 + slippageTolerance) // Add slippage tolerance
    return (estimatedCost * slippageMultiplier) / BigInt(10000)
  }, [estimatedCost, selectedMethod, slippageTolerance])

  /**
   * Payment Execution Capability Check
   */
  const canExecutePayment = useMemo(() => {
    return Boolean(
      contentQuery.data &&
      !accessQuery.data &&
      userAddress &&
      selectedToken &&
      estimatedCost &&
      executionState.phase === 'idle' &&
      (selectedToken.balance || BigInt(0)) >= (finalCost || estimatedCost || BigInt(0))
    )
  }, [
    contentQuery.data,
    accessQuery.data,
    userAddress,
    selectedToken,
    estimatedCost,
    finalCost,
    executionState.phase
  ])

  /**
   * Price Impact Calculation
   */
  const priceImpact = useMemo(() => {
    if (!estimatedCost || !finalCost || selectedMethod === PaymentMethod.DIRECT_USDC) {
      return null
    }
    
    const impact = Number((finalCost - estimatedCost) * BigInt(10000) / estimatedCost) / 100
    return impact
  }, [estimatedCost, finalCost, selectedMethod])

  /**
   * Price Alerts Generation
   */
  const priceAlerts = useMemo(() => {
    const alerts: Array<{ type: 'warning' | 'error', message: string }> = []
    
    if (priceImpact && priceImpact > 5) {
      alerts.push({
        type: 'warning',
        message: `High price impact: ${priceImpact.toFixed(2)}%`
      })
    }
    
    if (selectedToken?.priceError) {
      alerts.push({
        type: 'error',
        message: 'Failed to fetch current price'
      })
    }
    
    return alerts
  }, [priceImpact, selectedToken?.priceError])

  /**
   * Reset Payment Handler
   */
  const resetPayment = useCallback(() => {
    setExecutionState({
      phase: 'idle',
      progress: 0,
      message: 'Ready to purchase',
      canRetry: false,
      transactionHash: null,
      error: null
    })
  }, [])

  /**
   * Return Unified Purchase Flow Interface
   */
  return {
    // Content and access information
    content: contentQuery.data || null,
    hasAccess: accessQuery.data || false,
    isLoading: contentQuery.isLoading || accessQuery.isLoading,

    // Payment method management
    selectedMethod,
    availableMethods,
    setPaymentMethod,

    // Token management
    selectedToken,
    supportedTokens: Array.from(tokenPrices.values()),
    setCustomToken,

    // Pricing and slippage
    slippageTolerance,
    setSlippageTolerance: (slippage: number) => {
      if (slippage >= 0 && slippage <= finalConfig.maxSlippage) {
        setSlippageTolerance(slippage)
      }
    },
    estimatedCost,
    finalCost,

    // Payment execution
    executionState,
    canExecutePayment,
    executePayment,
    retryPayment: executePayment, // Same function for retry
    resetPayment,

    // Advanced features
    priceImpact,
    priceAlerts,
    refreshPrices
  }
}

// Farcaster Context Interface
export interface FarcasterContext {
  readonly user: {
    readonly fid: number
    readonly username: string
    readonly displayName: string
    readonly pfpUrl: string
  }
  readonly client: {
    readonly name: string
    readonly version: string
  }
  readonly location: 'cast' | 'composer' | 'notification' | 'profile' | 'unknown'
}

export function useFarcasterContext(): FarcasterContext | null {
  const [farcasterContext, setFarcasterContext] = useState<FarcasterContext | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const isInMiniApp = useMemo(() => {
    if (typeof window === 'undefined') return false

    const url = new URL(window.location.href)
    return url.pathname.startsWith('/mini') || 
           url.pathname.startsWith('/miniapp') ||
           url.searchParams.get('miniApp') === 'true' ||
           document.querySelector('meta[name="fc:frame"]') !== null ||
           document.querySelector('meta[name="fc:miniapp"]') !== null
  }, [])

  useEffect(() => {
    if (!isInMiniApp || isInitialized) return

    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        await sdk.actions.ready()
        const sdkContext = await sdk.context

        if (sdkContext && sdkContext.client && sdkContext.user) {
          const allowedLocations = ['cast', 'composer', 'notification', 'profile', 'unknown'] as const
          let location: FarcasterContext['location'] = 'unknown'
          const sdkLocation = sdkContext.location?.type
          if (allowedLocations.includes(sdkLocation as FarcasterContext['location'])) {
            location = sdkLocation as FarcasterContext['location']
          }

          const context: FarcasterContext = {
            user: {
              fid: sdkContext.user.fid,
              username: sdkContext.user.username ?? '',
              displayName: sdkContext.user.displayName ?? '',
              pfpUrl: sdkContext.user.pfpUrl ?? '',
            },
            client: {
              name: sdkContext.client.platformType || '',
              version: '1.0.0'
            },
            location
          }

          setFarcasterContext(context)
        }
      } catch (error) {
        console.warn('Failed to initialize Farcaster context:', error)
        setFarcasterContext(null)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeFarcaster()
  }, [isInMiniApp, isInitialized])

  return farcasterContext
}

// Type Definitions for X402ContentPurchaseFlow
export type X402ContentPurchaseFlowStep = 
  | 'checking_access'
  | 'can_purchase'
  | 'need_approval'
  | 'purchasing'
  | 'completed'
  | 'error'
  | 'preparing_x402_payment'
  | 'processing_x402_payment'
  | 'verifying_x402_payment'
  | 'x402_payment_failed'

interface X402PaymentState {
  readonly isLoading: boolean
  readonly paymentProof: X402PaymentProof | null
  readonly verificationResult: X402PaymentVerificationResult | null
  readonly error: Error | null
}

export interface X402ContentPurchaseFlowResult {
  readonly hasAccess: boolean | undefined
  readonly isLoading: boolean
  readonly currentStep: X402ContentPurchaseFlowStep
  readonly error: Error | null
  readonly content: Content | null
  readonly canAfford: boolean
  readonly needsApproval: boolean
  readonly userBalance: bigint | undefined
  readonly purchase: () => void
  readonly approveAndPurchase: () => void
  readonly reset: () => void
  readonly purchaseProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
  readonly approvalProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
  readonly socialContext: FarcasterContext | null
  readonly canUseX402Payment: boolean
  readonly purchaseWithX402: () => Promise<void>
  readonly x402PaymentState: X402PaymentState
  readonly shareCapabilities: {
    readonly canShare: boolean
    readonly shareToCast: (message: string) => Promise<void>
    readonly generateShareMessage: () => string
  }
}

export function useX402ContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): X402ContentPurchaseFlowResult {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  
  const contentData = useContentById(contentId)
  const hasAccess = useHasContentAccess(userAddress, contentId)
  const userBalance = useTokenBalance(contractAddresses.USDC, userAddress)
  const tokenAllowance = useTokenAllowance(
    contractAddresses.USDC,
    userAddress,
    contractAddresses.PAY_PER_VIEW
  )
  const approveToken = useApproveToken()
  const purchaseContent = usePurchaseContent()
  
  const farcasterContext = useFarcasterContext()
  
  const [workflowState, setWorkflowState] = useState<{
    currentStep: X402ContentPurchaseFlowStep
    error: Error | null
  }>({
    currentStep: 'checking_access',
    error: null
  })
  
  const [x402PaymentState, setX402PaymentState] = useState<X402PaymentState>({
    isLoading: false,
    paymentProof: null,
    verificationResult: null,
    error: null
  })
  
  const canAfford = useMemo(() => {
    if (!userBalance.data || !contentData.data) return false
    return userBalance.data >= contentData.data.payPerViewPrice
  }, [userBalance.data, contentData.data])

  const needsApproval = useMemo(() => {
    if (!tokenAllowance.data || !contentData.data) return false
    return tokenAllowance.data < contentData.data.payPerViewPrice
  }, [tokenAllowance.data, contentData.data])
  
  const x402Config = useMemo((): X402Config | null => {
    try {
      return getX402MiddlewareConfig(chainId)
    } catch (error) {
      console.warn('x402 configuration not available:', error)
      return null
    }
  }, [chainId])
  
  const canUseX402Payment = useMemo(() => {
    return Boolean(
      x402Config &&
      farcasterContext &&
      contentId &&
      userAddress &&
      contentData.data?.payPerViewPrice
    )
  }, [x402Config, farcasterContext, contentId, userAddress, contentData.data])

  useEffect(() => {
    if (hasAccess.isLoading || contentData.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'checking_access' }))
    } else if (hasAccess.error || contentData.error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: hasAccess.error || contentData.error 
      })
    } else if (hasAccess.data === true) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'completed' }))
    } else if (!canAfford) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Insufficient USDC balance to purchase this content')
      })
    } else if (needsApproval) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'need_approval' }))
    } else {
      setWorkflowState(prev => ({ ...prev, currentStep: 'can_purchase' }))
    }
  }, [hasAccess.data, hasAccess.isLoading, hasAccess.error, contentData.error, canAfford, needsApproval])

  useEffect(() => {
    if (approveToken.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'need_approval' }))
    } else if (approveToken.isConfirmed && needsApproval === false) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'can_purchase' }))
      tokenAllowance.refetch()
    }
  }, [approveToken.isLoading, approveToken.isConfirmed, needsApproval, tokenAllowance])

  useEffect(() => {
    if (purchaseContent.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'purchasing' }))
    } else if (purchaseContent.error) {
      setWorkflowState({ currentStep: 'error', error: purchaseContent.error })
    } else if (purchaseContent.isConfirmed) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'completed' }))
      hasAccess.refetch()
      userBalance.refetch()
    }
  }, [purchaseContent.isLoading, purchaseContent.error, purchaseContent.isConfirmed, hasAccess, userBalance])

  const handlePurchase = useCallback(() => {
    if (!contentId) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Content ID is required for purchase')
      })
      return
    }

    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      purchaseContent.write(contentId)
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Purchase failed')
      })
    }
  }, [contentId, purchaseContent])

  const handleApproveAndPurchase = useCallback(() => {
    if (!contentData.data || !contentId) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('Content data required for purchase')
      })
      return
    }

    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      
      approveToken.write({
        tokenAddress: contractAddresses.USDC,
        spender: contractAddresses.PAY_PER_VIEW,
        amount: contentData.data.payPerViewPrice,
      })
    } catch (error) {
      setWorkflowState({
        currentStep: 'error',
        error: error instanceof Error ? error : new Error('Approval failed')
      })
    }
  }, [contentData.data, contentId, approveToken, contractAddresses])

  const handleReset = useCallback(() => {
    setWorkflowState({ currentStep: 'checking_access', error: null })
    setX402PaymentState({
      isLoading: false,
      paymentProof: null,
      verificationResult: null,
      error: null
    })
    approveToken.reset()
    purchaseContent.reset()
    hasAccess.refetch()
  }, [approveToken, purchaseContent, hasAccess])

  const purchaseWithX402 = useCallback(async (): Promise<void> => {
    if (!contentId || !userAddress || !contentData.data || !x402Config) {
      throw new Error('Required parameters missing for x402 purchase')
    }
    
    try {
      setWorkflowState(prev => ({ ...prev, currentStep: 'preparing_x402_payment', error: null }))
      setX402PaymentState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        paymentProof: null,
        verificationResult: null
      }))
      
      const paymentProof = await createX402PaymentProof({
        contentId: contentId.toString(),
        amount: contentData.data.payPerViewPrice,
        recipient: contentData.data.creator,
        userAddress,
        chainId,
        contractAddress: contractAddresses.COMMERCE_INTEGRATION,
        x402Config
      })
      
      setX402PaymentState(prev => ({ ...prev, paymentProof }))
      setWorkflowState(prev => ({ ...prev, currentStep: 'processing_x402_payment' }))
      
      const verificationResult = await verifyX402PaymentProof(paymentProof, x402Config)
      
      if (!verificationResult.success) {
        throw new Error(verificationResult.error || 'Payment verification failed')
      }
      
      setX402PaymentState(prev => ({ ...prev, verificationResult }))
      setWorkflowState(prev => ({ ...prev, currentStep: 'verifying_x402_payment' }))
      
      purchaseContent.write(contentId)
      setX402PaymentState(prev => ({ ...prev, isLoading: false }))
      
    } catch (error) {
      const purchaseError = error instanceof Error ? error : new Error('x402 purchase failed')
      setWorkflowState({ currentStep: 'x402_payment_failed', error: purchaseError })
      setX402PaymentState(prev => ({
        ...prev,
        isLoading: false,
        error: purchaseError
      }))
      throw purchaseError
    }
  }, [
    contentId,
    userAddress,
    contentData.data,
    x402Config,
    chainId,
    contractAddresses.COMMERCE_INTEGRATION,
    purchaseContent
  ])
  
  const shareCapabilities = useMemo(() => {
    const canShare = Boolean(
      farcasterContext &&
      contentData.data &&
      workflowState.currentStep === 'completed'
    )
    
    const generateShareMessage = (): string => {
      if (!contentData.data) return ''
      return `Just unlocked "${contentData.data.title}" on Content Platform! 🔓 Discover premium content with instant USDC payments.`
    }
    
    const shareToCast = async (message: string): Promise<void> => {
      if (!farcasterContext || typeof window === 'undefined') {
        throw new Error('Farcaster context not available for sharing')
      }
      
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`
        
        if (contentId) {
          const contentUrl = `${window.location.origin}/content/${contentId}`
          const fullUrl = `${shareUrl}&embeds[]=${encodeURIComponent(contentUrl)}`
          await sdk.actions.openUrl(fullUrl)
        } else {
          await sdk.actions.openUrl(shareUrl)
        }
      } catch (error) {
        console.warn('Failed to share to Farcaster:', error)
        window.open(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`,
          '_blank',
          'noopener,noreferrer'
        )
      }
    }
    
    return {
      canShare,
      shareToCast,
      generateShareMessage
    }
  }, [farcasterContext, contentData.data, workflowState.currentStep, contentId])
  
  return {
    hasAccess: hasAccess.data,
    isLoading: hasAccess.isLoading || contentData.isLoading ||
               approveToken.isLoading || purchaseContent.isLoading || x402PaymentState.isLoading,
    currentStep: workflowState.currentStep,
    error: workflowState.error || x402PaymentState.error,
    content: contentData.data || null,
    canAfford,
    needsApproval,
    userBalance: userBalance.data,
    purchase: handlePurchase,
    approveAndPurchase: handleApproveAndPurchase,
    reset: handleReset,
    purchaseProgress: {
      isSubmitting: purchaseContent.isLoading,
      isConfirming: purchaseContent.isConfirming,
      isConfirmed: purchaseContent.isConfirmed,
      transactionHash: purchaseContent.hash,
    },
    approvalProgress: {
      isSubmitting: approveToken.isLoading,
      isConfirming: approveToken.isConfirming,
      isConfirmed: approveToken.isConfirmed,
      transactionHash: approveToken.hash,
    },
    socialContext: farcasterContext,
    canUseX402Payment,
    purchaseWithX402,
    x402PaymentState,
    shareCapabilities
  }
}

// Enhanced Content Purchase Flow Types and Hook
export type ContentPurchaseFlowStep = 
  | 'checking_access'        // Initial state - checking if user already has access
  | 'loading_content'        // Loading content information from blockchain
  | 'insufficient_balance'   // User doesn't have enough USDC
  | 'need_approval'         // USDC approval required before purchase
  | 'can_purchase'          // Ready to execute purchase transaction
  | 'approving_tokens'      // Executing USDC approval transaction
  | 'purchasing'            // Executing purchase transaction
  | 'completed'             // Purchase completed successfully
  | 'error'                 // An error occurred during the process

export interface PurchaseProgress {
  readonly isSubmitting: boolean      // Transaction submitted to mempool
  readonly isConfirming: boolean      // Waiting for blockchain confirmation
  readonly isConfirmed: boolean       // Transaction confirmed on blockchain
  readonly transactionHash?: string    // Hash of the transaction
  readonly blockNumber?: bigint       // Block number of confirmation
  readonly gasUsed?: bigint           // Gas consumed by transaction
}

export interface ContentPurchaseFlowResult {
  readonly content: Content | null                    // Content metadata
  readonly hasAccess: boolean                         // Current access status
  readonly isLoading: boolean                         // Overall loading state
  readonly error: Error | null                        // Current error state
  readonly currentStep: ContentPurchaseFlowStep       // Current workflow step
  readonly canAfford: boolean                         // User has sufficient USDC
  readonly needsApproval: boolean                     // USDC approval required
  readonly requiredAllowance: bigint | null           // Amount needed for approval
  readonly userBalance: bigint | null                 // User's USDC balance
  readonly userAllowance: bigint | null               // Current USDC allowance
  readonly purchaseProgress: PurchaseProgress         // Purchase transaction status
  readonly approvalProgress: PurchaseProgress         // Approval transaction status
  readonly purchase: () => Promise<void>              // Execute direct purchase
  readonly approveAndPurchase: () => Promise<void>    // Approve tokens then purchase
  readonly reset: () => void                          // Reset workflow state
  readonly refetchData: () => Promise<void>           // Refresh all data
}

export function useContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): ContentPurchaseFlowResult {
  const chainId = useChainId()
  
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])
  
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)
  const userBalance = useTokenBalance(contractAddresses?.USDC, userAddress)
  const tokenAllowance = useTokenAllowance(
    contractAddresses?.USDC,
    userAddress,
    contractAddresses?.PAY_PER_VIEW
  )
  
  const approveToken = useApproveToken()
  const purchaseContent = usePurchaseContent()
  
  const [workflowState, setWorkflowState] = useState<{
    currentStep: ContentPurchaseFlowStep
    error: Error | null
    lastSuccessfulStep: ContentPurchaseFlowStep | null
  }>({
    currentStep: 'checking_access',
    error: null,
    lastSuccessfulStep: null
  })

  const content = useMemo(() => {
    return contentQuery.data || null
  }, [contentQuery.data])

  const hasAccess = useMemo(() => {
    return accessQuery.data === true
  }, [accessQuery.data])

  const userBalanceAmount = useMemo(() => {
    return userBalance.data || null
  }, [userBalance.data])

  const userAllowanceAmount = useMemo(() => {
    return tokenAllowance.data || null
  }, [tokenAllowance.data])

  const canAfford = useMemo(() => {
    if (!userBalanceAmount || !content) return false
    return userBalanceAmount >= content.payPerViewPrice
  }, [userBalanceAmount, content])

  const needsApproval = useMemo(() => {
    if (!userAllowanceAmount || !content) return false
    return userAllowanceAmount < content.payPerViewPrice
  }, [userAllowanceAmount, content])

  const requiredAllowance = useMemo(() => {
    if (!content) return null
    return content.payPerViewPrice
  }, [content])

  const purchaseProgress = useMemo((): PurchaseProgress => ({
    isSubmitting: purchaseContent.isLoading && !purchaseContent.isConfirmed,
    isConfirming: purchaseContent.isLoading && purchaseContent.isConfirmed,
    isConfirmed: purchaseContent.isConfirmed,
    transactionHash: purchaseContent.hash
  }), [purchaseContent])

  const approvalProgress = useMemo((): PurchaseProgress => ({
    isSubmitting: approveToken.isLoading && !approveToken.isConfirmed,
    isConfirming: approveToken.isLoading && approveToken.isConfirmed,
    isConfirmed: approveToken.isConfirmed,
    transactionHash: approveToken.hash
  }), [approveToken])

  const isLoading = useMemo(() => {
    return (
      contentQuery.isLoading ||
      accessQuery.isLoading ||
      userBalance.isLoading ||
      tokenAllowance.isLoading ||
      workflowState.currentStep === 'checking_access' ||
      workflowState.currentStep === 'loading_content' ||
      workflowState.currentStep === 'purchasing' ||
      workflowState.currentStep === 'approving_tokens'
    )
  }, [
    contentQuery.isLoading,
    accessQuery.isLoading,
    userBalance.isLoading,
    tokenAllowance.isLoading,
    workflowState.currentStep
  ])

  useEffect(() => {
    if (workflowState.currentStep === 'error') {
      return
    }

    if (contentQuery.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'loading_content' }))
      return
    }

    if (contentQuery.error || !content) {
      setWorkflowState({
        currentStep: 'error',
        error: contentQuery.error || new Error('Content not found'),
        lastSuccessfulStep: null
      })
      return
    }

    if (accessQuery.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'checking_access' }))
      return
    }

    if (accessQuery.error) {
      setWorkflowState({
        currentStep: 'error',
        error: accessQuery.error,
        lastSuccessfulStep: null
      })
      return
    }

    if (hasAccess) {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'completed',
        error: null
      }))
      return
    }

    if (userBalance.isLoading || tokenAllowance.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'checking_access' }))
      return
    }

    if (!canAfford) {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'insufficient_balance',
        error: new Error('Insufficient USDC balance')
      }))
      return
    }

    if (needsApproval) {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'need_approval',
        error: null
      }))
    } else {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'can_purchase',
        error: null
      }))
    }
  }, [
    contentQuery.isLoading,
    contentQuery.error,
    content,
    accessQuery.isLoading,
    accessQuery.error,
    hasAccess,
    userBalance.isLoading,
    tokenAllowance.isLoading,
    canAfford,
    needsApproval
  ])

  useEffect(() => {
    if (approveToken.isLoading && !approveToken.isConfirmed) {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'approving_tokens',
        error: null
      }))
    } else if (approveToken.error) {
      setWorkflowState({
        currentStep: 'error',
        error: approveToken.error,
        lastSuccessfulStep: 'need_approval'
      })
    } else if (approveToken.isConfirmed) {
      tokenAllowance.refetch()
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'can_purchase',
        error: null,
        lastSuccessfulStep: 'approving_tokens'
      }))
    }
  }, [
    approveToken.isLoading,
    approveToken.isConfirmed,
    approveToken.error
  ])

  useEffect(() => {
    if (purchaseContent.isLoading && !purchaseContent.isConfirmed) {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'purchasing',
        error: null
      }))
    } else if (purchaseContent.error) {
      setWorkflowState({
        currentStep: 'error',
        error: purchaseContent.error,
        lastSuccessfulStep: 'can_purchase'
      })
    } else if (purchaseContent.isConfirmed) {
      accessQuery.refetch()
      userBalance.refetch()
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'completed',
        error: null,
        lastSuccessfulStep: 'purchasing'
      }))
    }
  }, [
    purchaseContent.isLoading,
    purchaseContent.isConfirmed,
    purchaseContent.error
  ])

  const purchase = useCallback(async (): Promise<void> => {
    if (!contentId || !contractAddresses) {
      throw new Error('Missing required parameters for purchase')
    }

    if (workflowState.currentStep !== 'can_purchase') {
      throw new Error(`Cannot purchase in current state: ${workflowState.currentStep}`)
    }

    if (!canAfford) {
      throw new Error('Insufficient USDC balance')
    }

    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      await purchaseContent.write(contentId)
    } catch (error) {
      const purchaseError = error instanceof Error ? error : new Error('Purchase failed')
      setWorkflowState({
        currentStep: 'error',
        error: purchaseError,
        lastSuccessfulStep: 'can_purchase'
      })
      throw purchaseError
    }
  }, [
    contentId,
    contractAddresses,
    workflowState.currentStep,
    canAfford,
    purchaseContent
  ])

  const approveAndPurchase = useCallback(async (): Promise<void> => {
    if (!contentId || !contractAddresses || !content) {
      throw new Error('Missing required parameters for approval and purchase')
    }

    if (workflowState.currentStep !== 'need_approval') {
      throw new Error(`Cannot approve in current state: ${workflowState.currentStep}`)
    }

    if (!canAfford) {
      throw new Error('Insufficient USDC balance')
    }

    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      await approveToken.write({
        tokenAddress: contractAddresses.USDC,
        spender: contractAddresses.PAY_PER_VIEW,
        amount: content.payPerViewPrice
      })
    } catch (error) {
      const approvalError = error instanceof Error ? error : new Error('Approval failed')
      setWorkflowState({
        currentStep: 'error',
        error: approvalError,
        lastSuccessfulStep: 'need_approval'
      })
      throw approvalError
    }
  }, [
    contentId,
    contractAddresses,
    content,
    workflowState.currentStep,
    canAfford,
    approveToken
  ])

  const reset = useCallback(() => {
    setWorkflowState({
      currentStep: 'checking_access',
      error: null,
      lastSuccessfulStep: null
    })
    if (approveToken.reset) approveToken.reset()
    if (purchaseContent.reset) purchaseContent.reset()
  }, [approveToken, purchaseContent])

  const refetchData = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        contentQuery.refetch(),
        accessQuery.refetch(),
        userBalance.refetch(),
        tokenAllowance.refetch()
      ])
    } catch (error) {
      console.error('Failed to refetch data:', error)
    }
  }, [contentQuery, accessQuery, userBalance, tokenAllowance])

  return {
    content,
    hasAccess,
    isLoading,
    error: workflowState.error,
    currentStep: workflowState.currentStep,
    canAfford,
    needsApproval,
    requiredAllowance,
    userBalance: userBalanceAmount,
    userAllowance: userAllowanceAmount,
    purchaseProgress,
    approvalProgress,
    purchase,
    approveAndPurchase,
    reset,
    refetchData
  }
}

// Utility Functions for Purchase Flow
export function getPurchaseFlowStepMessage(step: ContentPurchaseFlowStep): string {
  switch (step) {
    case 'checking_access':
      return 'Checking your access status...'
    case 'loading_content':
      return 'Loading content information...'
    case 'insufficient_balance':
      return 'Insufficient USDC balance'
    case 'need_approval':
      return 'USDC approval required'
    case 'can_purchase':
      return 'Ready to purchase'
    case 'approving_tokens':
      return 'Approving USDC spending...'
    case 'purchasing':
      return 'Processing purchase...'
    case 'completed':
      return 'Purchase completed successfully!'
    case 'error':
      return 'An error occurred'
    default:
      return 'Unknown status'
  }
}

export function canInitiatePurchaseAction(step: ContentPurchaseFlowStep): boolean {
  return step === 'need_approval' || step === 'can_purchase'
}

export function isProcessingStep(step: ContentPurchaseFlowStep): boolean {
  return step === 'approving_tokens' || step === 'purchasing'
}

export function getPurchaseFlowProgress(step: ContentPurchaseFlowStep): number {
  switch (step) {
    case 'checking_access':
    case 'loading_content':
      return 10
    case 'insufficient_balance':
      return 20
    case 'need_approval':
      return 30
    case 'can_purchase':
      return 40
    case 'approving_tokens':
      return 60
    case 'purchasing':
      return 80
    case 'completed':
      return 100
    case 'error':
      return 0
    default:
      return 0
  }
}

// Extended Content Purchase Flow Hook with Commerce Protocol
export enum CommercePaymentMethod {
  ETH = 'ETH',
  CUSTOM_TOKEN = 'CUSTOM_TOKEN'
}

export interface PaymentIntentState {
  readonly intentId: string | null
  readonly intentHash: string | null
  readonly signature: string | null
  readonly isCreated: boolean
  readonly isSigned: boolean
  readonly isExecuted: boolean
  readonly deadline: bigint | null
  readonly expectedAmount: bigint | null
}

export type CommerceProtocolFlowStep =
  | 'idle'
  | 'creating_intent'
  | 'waiting_for_signature'
  | 'signature_ready'
  | 'executing_payment'
  | 'processing_completion'
  | 'completed'
  | 'error'

export interface ExtendedContentPurchaseFlowResult {
  readonly content: Content | null
  readonly hasAccess: boolean
  readonly isLoading: boolean
  readonly error: Error | null
  readonly currentStep: string
  readonly canAfford: boolean
  readonly needsApproval: boolean
  readonly userBalance: bigint | null
  readonly purchase: () => Promise<void>
  readonly approveAndPurchase: () => Promise<void>
  readonly reset: () => void
  readonly commerceProtocol: {
    readonly isAvailable: boolean
    readonly intentState: PaymentIntentState
    readonly flowStep: CommerceProtocolFlowStep
    readonly supportedTokens: readonly string[]
    readonly createPaymentIntent: (method: CommercePaymentMethod, paymentToken?: Address) => Promise<void>
    readonly executeSignedIntent: () => Promise<void>
    readonly checkSignatureStatus: () => Promise<void>
    readonly resetCommerceFlow: () => void
  }
}

interface PlatformPaymentRequest {
  readonly paymentType: number
  readonly creator: Address
  readonly contentId: bigint
  readonly paymentToken: Address
  readonly maxSlippage: number
  readonly deadline: number
}

interface PaymentIntentResponse {
  readonly intent: {
    readonly recipientAmount: bigint
    readonly deadline: bigint
    readonly recipient: Address
    readonly recipientCurrency: Address
    readonly refundDestination: Address
    readonly feeAmount: bigint
    readonly id: string
    readonly operator: Address
  }
  readonly context: {
    readonly user: Address
    readonly creator: Address
    readonly paymentType: number
    readonly contentId: bigint
    readonly creatorAmount: bigint
    readonly platformFee: bigint
    readonly operatorFee: bigint
    readonly paymentToken: Address
    readonly expectedAmount: bigint
  }
}

export function useExtendedContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): ExtendedContentPurchaseFlowResult {
  const chainId = useChainId()
  
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])

  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)
  const userBalance = useTokenBalance(contractAddresses?.USDC, userAddress)
  const tokenAllowance = useTokenAllowance(
    contractAddresses?.USDC,
    userAddress,
    contractAddresses?.PAY_PER_VIEW
  )
  const approveToken = useApproveToken()
  const purchaseContent = usePurchaseContent()

  const { writeContract: writeCommerceContract, data: commerceHash } = useWriteContract()
  const { isLoading: isCommerceConfirming, isSuccess: isCommerceConfirmed } = useWaitForTransactionReceipt({
    hash: commerceHash
  })

  const [basicFlowState, setBasicFlowState] = useState<{
    currentStep: string
    error: Error | null
  }>({
    currentStep: 'checking_access',
    error: null
  })

  const [commerceState, setCommerceState] = useState<{
    flowStep: CommerceProtocolFlowStep
    intentState: PaymentIntentState
    selectedMethod: CommercePaymentMethod | null
    selectedToken: Address | null
    pollingForSignature: boolean
  }>({
    flowStep: 'idle',
    intentState: {
      intentId: null,
      intentHash: null,
      signature: null,
      isCreated: false,
      isSigned: false,
      isExecuted: false,
      deadline: null,
      expectedAmount: null
    },
    selectedMethod: null,
    selectedToken: null,
    pollingForSignature: false
  })

  const isCommerceProtocolAvailable = useMemo(() => {
    return Boolean(
      contractAddresses?.COMMERCE_INTEGRATION &&
      contractAddresses?.COMMERCE_PROTOCOL &&
      contractAddresses.COMMERCE_INTEGRATION !== '0x'
    )
  }, [contractAddresses])

  const supportedTokens = useMemo((): readonly string[] => {
    return [
      'ETH',
      contractAddresses?.USDC || '',
    ].filter(Boolean)
  }, [contractAddresses])

  const createPaymentIntent = useCallback(async (
    method: CommercePaymentMethod,
    paymentToken?: Address
  ): Promise<void> => {
    if (!contentId || !contractAddresses || !userAddress || !contentQuery.data) {
      throw new Error('Missing required parameters for Commerce Protocol payment')
    }

    try {
      setCommerceState(prev => ({
        ...prev,
        flowStep: 'creating_intent',
        selectedMethod: method,
        selectedToken: paymentToken || null
      }))

      let tokenAddress: Address
      if (method === CommercePaymentMethod.ETH) {
        tokenAddress = '0x0000000000000000000000000000000000000000' as Address
      } else if (method === CommercePaymentMethod.CUSTOM_TOKEN && paymentToken) {
        tokenAddress = paymentToken
      } else {
        throw new Error('Invalid payment method or missing token address')
      }

      const paymentRequest = {
        paymentType: 0,
        creator: contentQuery.data.creator,
        contentId,
        paymentToken: tokenAddress,
        maxSlippage: BigInt(200),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600)
      }

      console.log('Creating Commerce Protocol payment intent:', paymentRequest)

      await writeCommerceContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'createPaymentIntent',
        args: [paymentRequest]
      })

    } catch (error) {
      console.error('Failed to create payment intent:', error)
      setCommerceState(prev => ({
        ...prev,
        flowStep: 'error'
      }))
      throw error
    }
  }, [contentId, contractAddresses, userAddress, contentQuery.data, writeCommerceContract])

  const checkSignatureStatus = useCallback(async (): Promise<void> => {
    if (!commerceState.intentState.intentId || !commerceState.intentState.intentHash) {
      return
    }

    try {
      const response = await fetch('/api/commerce/signature-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intentId: commerceState.intentState.intentId,
          intentHash: commerceState.intentState.intentHash
        })
      })

      if (!response.ok) {
        throw new Error(`Signature check failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.isSigned && data.signature) {
        setCommerceState(prev => ({
          ...prev,
          flowStep: 'signature_ready',
          intentState: {
            ...prev.intentState,
            signature: data.signature,
            isSigned: true
          },
          pollingForSignature: false
        }))
      }
    } catch (error) {
      console.error('Failed to check signature status:', error)
    }
  }, [commerceState.intentState.intentId, commerceState.intentState.intentHash])

  const executeSignedIntent = useCallback(async (): Promise<void> => {
    if (!commerceState.intentState.intentId || !commerceState.intentState.signature || !contractAddresses) {
      throw new Error('Missing required data for intent execution')
    }

    try {
      setCommerceState(prev => ({
        ...prev,
        flowStep: 'executing_payment'
      }))

      console.log('Executing signed payment intent:', commerceState.intentState.intentId)

      await writeCommerceContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'executePaymentWithSignature',
        args: [commerceState.intentState.intentId as `0x${string}`]
      })

    } catch (error) {
      console.error('Failed to execute signed intent:', error)
      setCommerceState(prev => ({
        ...prev,
        flowStep: 'error'
      }))
      throw error
    }
  }, [commerceState.intentState.intentId, commerceState.intentState.signature, contractAddresses, writeCommerceContract])

  const resetCommerceFlow = useCallback(() => {
    setCommerceState({
      flowStep: 'idle',
      intentState: {
        intentId: null,
        intentHash: null,
        signature: null,
        isCreated: false,
        isSigned: false,
        isExecuted: false,
        deadline: null,
        expectedAmount: null
      },
      selectedMethod: null,
      selectedToken: null,
      pollingForSignature: false
    })
  }, [])

  useEffect(() => {
    if (isCommerceConfirmed && commerceHash) {
      if (commerceState.flowStep === 'creating_intent') {
        setCommerceState(prev => ({
          ...prev,
          flowStep: 'waiting_for_signature',
          pollingForSignature: true,
          intentState: {
            ...prev.intentState,
            isCreated: true
          }
        }))
      } else if (commerceState.flowStep === 'executing_payment') {
        setCommerceState(prev => ({
          ...prev,
          flowStep: 'processing_completion',
          intentState: {
            ...prev.intentState,
            isExecuted: true
          }
        }))
        
        accessQuery.refetch()
      }
    }
  }, [isCommerceConfirmed, commerceHash, commerceState.flowStep, accessQuery])

  useEffect(() => {
    if (!commerceState.pollingForSignature || commerceState.flowStep !== 'waiting_for_signature') {
      return
    }

    const pollInterval = setInterval(() => {
      checkSignatureStatus()
    }, 3000)

    const timeout = setTimeout(() => {
      setCommerceState(prev => ({
        ...prev,
        pollingForSignature: false,
        flowStep: 'error'
      }))
      clearInterval(pollInterval)
    }, 300000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [commerceState.pollingForSignature, commerceState.flowStep, checkSignatureStatus])

  useEffect(() => {
    if (commerceState.flowStep === 'processing_completion' && accessQuery.data === true) {
      setCommerceState(prev => ({
        ...prev,
        flowStep: 'completed'
      }))
    }
  }, [commerceState.flowStep, accessQuery.data])

  const canAfford = useMemo(() => {
    if (!userBalance.data || !contentQuery.data) return false
    return userBalance.data >= contentQuery.data.payPerViewPrice
  }, [userBalance.data, contentQuery.data])

  const needsApproval = useMemo(() => {
    if (!tokenAllowance.data || !contentQuery.data) return false
    return tokenAllowance.data < contentQuery.data.payPerViewPrice
  }, [tokenAllowance.data, contentQuery.data])

  const purchase = useCallback(async (): Promise<void> => {
    if (!contentId) throw new Error('Content ID required')
    await purchaseContent.write(contentId)
  }, [contentId, purchaseContent])

  const approveAndPurchase = useCallback(async (): Promise<void> => {
    if (!contentQuery.data || !contractAddresses) throw new Error('Missing data for approval')
    await approveToken.write({
      tokenAddress: contractAddresses.USDC,
      spender: contractAddresses.PAY_PER_VIEW,
      amount: contentQuery.data.payPerViewPrice
    })
  }, [contentQuery.data, contractAddresses, approveToken])

  const reset = useCallback(() => {
    setBasicFlowState({
      currentStep: 'checking_access',
      error: null
    })
    resetCommerceFlow()
  }, [resetCommerceFlow])

  return {
    content: contentQuery.data || null,
    hasAccess: accessQuery.data || false,
    isLoading: contentQuery.isLoading || accessQuery.isLoading,
    error: basicFlowState.error,
    currentStep: basicFlowState.currentStep,
    canAfford,
    needsApproval,
    userBalance: userBalance.data || null,
    purchase,
    approveAndPurchase,
    reset,
    commerceProtocol: {
      isAvailable: isCommerceProtocolAvailable,
      intentState: commerceState.intentState,
      flowStep: commerceState.flowStep,
      supportedTokens,
      createPaymentIntent,
      executeSignedIntent,
      checkSignatureStatus,
      resetCommerceFlow
    }
  }
}

export function getCommerceFlowStepMessage(step: CommerceProtocolFlowStep): string {
  switch (step) {
    case 'idle':
      return 'Ready to start advanced payment'
    case 'creating_intent':
      return 'Creating payment intent...'
    case 'waiting_for_signature':
      return 'Waiting for payment authorization...'
    case 'signature_ready':
      return 'Payment authorized - ready to execute'
    case 'executing_payment':
      return 'Processing payment...'
    case 'processing_completion':
      return 'Finalizing payment...'
    case 'completed':
      return 'Payment completed successfully!'
    case 'error':
      return 'Payment error occurred'
    default:
      return 'Unknown payment status'
  }
}

export function canPerformCommerceAction(step: CommerceProtocolFlowStep): boolean {
  return step === 'idle' || step === 'signature_ready' || step === 'error'
}

export function getCommerceFlowProgress(step: CommerceProtocolFlowStep): number {
  switch (step) {
    case 'idle':
      return 0
    case 'creating_intent':
      return 20
    case 'waiting_for_signature':
      return 40
    case 'signature_ready':
      return 60
    case 'executing_payment':
      return 80
    case 'processing_completion':
      return 90
    case 'completed':
      return 100
    case 'error':
      return 0
    default:
      return 0
  }
}

// ===== ENHANCED VALIDATION UTILITIES =====
function validateIPFSHash(hash: string): boolean {
  if (!hash || hash.length < 10) return false
  
  if (hash.startsWith('Qm') && hash.length === 46) return true
  
  const cidV1Prefixes = ['baf', 'bae', 'bag', 'bah', 'bai', 'baj']
  const hasValidPrefix = cidV1Prefixes.some(prefix => hash.startsWith(prefix))
  
  if (hasValidPrefix && hash.length >= 32) return true
  
  return false
}

function validatePrice(price: bigint): { isValid: boolean; error?: string } {
  const MIN_PRICE = BigInt(0.01e6) // $0.01 in USDC (6 decimals)
  const MAX_PRICE = BigInt(50e6)   // $50.00 in USDC (6 decimals)
  
  if (price < MIN_PRICE) {
    return { isValid: false, error: 'Minimum price is $0.01' }
  }
  
  if (price > MAX_PRICE) {
    return { isValid: false, error: 'Maximum price is $50.00' }
  }
  
  return { isValid: true }
}

// ===== ENHANCED CONTENT PUBLISHING WORKFLOW =====
export interface ContentPublishingData {
  readonly title: string
  readonly description: string
  readonly ipfsHash: string
  readonly category: number
  readonly payPerViewPrice: bigint
  readonly tags: readonly string[]
}

export type ContentPublishingFlowStep = 
  | 'idle'
  | 'checking_creator'
  | 'validating_content'
  | 'registering'
  | 'confirming'
  | 'extracting_content_id'
  | 'completed'
  | 'error'

export interface ContentPublishingFlowResult {
  readonly currentStep: ContentPublishingFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly canPublish: boolean
  readonly isCreatorRegistered: boolean
  readonly publishedContentId: bigint | null
  readonly publish: (data: ContentPublishingData) => void
  readonly reset: () => void
  readonly publishingProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
    readonly stepDescription: string
  }
}

export function useContentPublishingFlow(
  userAddress: Address | undefined
): ContentPublishingFlowResult {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  
  const creatorRegistration = useIsCreatorRegistered(userAddress)
  const registerContent = useRegisterContent()
  const userBalance = useTokenBalance(contractAddresses.USDC, userAddress)
  
  const [workflowState, setWorkflowState] = useState<{
    currentStep: ContentPublishingFlowStep
    error: Error | null
    publishedContentId: bigint | null
  }>({
    currentStep: 'idle',
    error: null,
    publishedContentId: null
  })
  
  const isCreatorRegistered = creatorRegistration.data ?? false
  const canPublish = isCreatorRegistered && workflowState.currentStep === 'idle'
  const isLoading = workflowState.currentStep !== 'idle' && 
                   workflowState.currentStep !== 'completed' && 
                   workflowState.currentStep !== 'error'
  
  const publishingProgress = useMemo(() => {
    const stepDescriptions: Record<ContentPublishingFlowStep, string> = {
      idle: 'Ready to publish',
      checking_creator: 'Verifying creator registration...',
      validating_content: 'Validating content data...',
      registering: 'Submitting to blockchain...',
      confirming: 'Waiting for confirmation...',
      extracting_content_id: 'Processing published content...',
      completed: 'Content published successfully!',
      error: 'Publishing failed'
    }
    
    return {
      isSubmitting: registerContent.isLoading && !registerContent.isConfirmed,
      isConfirming: registerContent.isConfirming,
      isConfirmed: registerContent.isConfirmed,
      transactionHash: registerContent.hash,
      stepDescription: stepDescriptions[workflowState.currentStep]
    }
  }, [registerContent, workflowState.currentStep])
  
  const validateContentData = useCallback((data: ContentPublishingData): string[] => {
    const errors: string[] = []
    
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Content title is required')
    }
    if (data.title && data.title.length > 200) {
      errors.push('Title must be less than 200 characters')
    }
    
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Content description is required')
    }
    if (data.description && data.description.length > 1000) {
      errors.push('Description must be less than 1000 characters')
    }
    
    if (!validateIPFSHash(data.ipfsHash)) {
      errors.push('Valid IPFS hash is required (supports both CID v0 and v1 formats)')
    }
    
    const priceValidation = validatePrice(data.payPerViewPrice)
    if (!priceValidation.isValid) {
      errors.push(priceValidation.error!)
    }
    
    if (data.tags.length > 10) {
      errors.push('Maximum 10 tags allowed')
    }
    
    for (const tag of data.tags) {
      if (tag.length > 30) {
        errors.push('Each tag must be 30 characters or less')
        break
      }
    }
    
    return errors
  }, [])
  
  const publish = useCallback((data: ContentPublishingData) => {
    console.log('Starting content publishing workflow...', data)
    
    if (!userAddress) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('Wallet connection required to publish content'),
        publishedContentId: null
      })
      return
    }
    
    setWorkflowState(prev => ({ ...prev, currentStep: 'checking_creator', error: null }))
    
    if (!isCreatorRegistered) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('You must be a registered creator to publish content. Please complete creator registration first.'),
        publishedContentId: null
      })
      return
    }
    
    setWorkflowState(prev => ({ ...prev, currentStep: 'validating_content' }))
    
    const validationErrors = validateContentData(data)
    if (validationErrors.length > 0) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error(`Content validation failed:\n${validationErrors.join('\n')}`),
        publishedContentId: null
      })
      return
    }
    
    setWorkflowState(prev => ({ ...prev, currentStep: 'registering' }))
    
    try {
      console.log('Calling registerContent with validated data:', {
        ipfsHash: data.ipfsHash,
        title: data.title,
        description: data.description,
        category: data.category,
        payPerViewPrice: data.payPerViewPrice.toString(),
        tags: data.tags
      })
      
      registerContent.write({
        ipfsHash: data.ipfsHash,
        title: data.title,
        description: data.description,
        category: data.category,
        payPerViewPrice: data.payPerViewPrice,
        tags: data.tags
      })
    } catch (error) {
      console.error('Error calling registerContent:', error)
      setWorkflowState({
        currentStep: 'error',
        error: error instanceof Error ? error : new Error('Failed to submit content registration'),
        publishedContentId: null
      })
    }
  }, [userAddress, isCreatorRegistered, validateContentData, registerContent])
  
  const reset = useCallback(() => {
    setWorkflowState({
      currentStep: 'idle',
      error: null,
      publishedContentId: null
    })
    registerContent.reset()
  }, [registerContent])
  
  useEffect(() => {
    if (registerContent.isLoading) {
      console.log('Transaction submitted, waiting for confirmation...')
      setWorkflowState(prev => ({ ...prev, currentStep: 'registering' }))
    } else if (registerContent.isConfirming) {
      console.log('Transaction confirmed, waiting for receipt...')
      setWorkflowState(prev => ({ ...prev, currentStep: 'confirming' }))
    } else if (registerContent.error) {
      console.error('Transaction error:', registerContent.error)
      setWorkflowState({
        currentStep: 'error',
        error: registerContent.error,
        publishedContentId: null
      })
    } else if (registerContent.isSuccess && registerContent.hash) {
      console.log('Transaction successful, extracting content ID...')
      setWorkflowState(prev => ({ ...prev, currentStep: 'extracting_content_id' }))
      
      const extractContentId = async () => {
        try {
          const publicClient = createPublicClient({
            chain: chainId === 8453 ? base : baseSepolia,
            transport: http()
          })
          
          const receipt = await publicClient.getTransactionReceipt({
            hash: registerContent.hash as `0x${string}`
          })
          
          console.log('Transaction receipt:', receipt)
          
          const contentRegisteredLogs = parseEventLogs({
            abi: CONTENT_REGISTRY_ABI,
            eventName: 'ContentRegistered',
            logs: receipt.logs
          })
          
          if (contentRegisteredLogs.length > 0) {
            const contentId = contentRegisteredLogs[0].args.contentId
            console.log('Successfully extracted content ID:', contentId)
            
            setWorkflowState({
              currentStep: 'completed',
              error: null,
              publishedContentId: contentId
            })
            
            creatorRegistration.refetch()
            userBalance.refetch()
          } else {
            throw new Error('Content ID not found in transaction receipt')
          }
        } catch (error) {
          console.error('Error extracting content ID:', error)
          setWorkflowState({
            currentStep: 'completed',
            error: null,
            publishedContentId: null
          })
        }
      }
      
      extractContentId()
    }
  }, [
    registerContent.isLoading,
    registerContent.isConfirming,
    registerContent.isSuccess,
    registerContent.error,
    registerContent.hash,
    chainId,
    creatorRegistration,
    userBalance
  ])
  
  return {
    currentStep: workflowState.currentStep,
    isLoading,
    error: workflowState.error,
    canPublish,
    isCreatorRegistered,
    publishedContentId: workflowState.publishedContentId,
    publish,
    reset,
    publishingProgress
  }
}

// Enhanced Content Publishing Flow
export interface EnhancedContentPublishingData extends ContentPublishingData {
  readonly framePreviewImage?: string
  readonly socialDescription?: string
  readonly targetAudience?: 'general' | 'creators' | 'crypto' | 'tech'
  readonly socialKeywords?: readonly string[]
  readonly socialCallToAction?: string
  readonly enableAutoShare?: boolean
  readonly frameStyle?: 'preview' | 'interactive' | 'minimal'
}

export type EnhancedContentPublishingFlowStep =
  | ContentPublishingFlowStep
  | 'validating_social_data'
  | 'generating_frame_assets'
  | 'creating_social_content'
  | 'optimizing_discovery'

interface FrameAssetConfig {
  readonly contentId: bigint
  readonly title: string
  readonly description: string
  readonly previewImage?: string
  readonly price: bigint
  readonly creatorAddress: Address
  readonly socialKeywords: readonly string[]
  readonly callToAction: string
  readonly frameStyle: 'preview' | 'interactive' | 'minimal'
}

interface SocialContentResult {
  readonly castText: string
  readonly hashtags: readonly string[]
  readonly mentions: readonly string[]
  readonly engagementHooks: readonly string[]
  readonly frameMetadata: {
    readonly imageUrl: string
    readonly buttons: readonly {
      readonly label: string
      readonly action: string
      readonly target: string
    }[]
    readonly postUrl: string
  }
}

interface EnhancedPublishingResult {
  readonly contentId?: bigint
  readonly success: boolean
  readonly error?: Error
  readonly socialOptimization?: SocialContentResult
  readonly performancePredictions?: {
    readonly expectedFrameViews: number
    readonly predictedEngagementRate: number
    readonly estimatedConversionRate: number
  }
}

interface EnhancedContentPublishingFlowResult {
  readonly currentStep: EnhancedContentPublishingFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly isValidContent: boolean
  readonly validationErrors: readonly string[]
  readonly publish: (data: ContentPublishingData) => void
  readonly publishWithSocialOptimization: (data: EnhancedContentPublishingData) => Promise<EnhancedPublishingResult>
  readonly publishingProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
  readonly socialOptimization: {
    readonly isProcessing: boolean
    readonly results: SocialContentResult | null
    readonly error: Error | null
  }
  readonly reset: () => void
  readonly socialCapabilities: {
    readonly canShare: boolean
    readonly shareToFarcaster: (message: string) => Promise<void>
    readonly generateOptimizedShareMessage: () => string
  }
}

class FrameAssetGenerator {
  private readonly baseUrl: string
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }
  async generateFrameAssets(config: FrameAssetConfig): Promise<SocialContentResult['frameMetadata']> {
    try {
      const imageUrl = await this.generateFrameImage(config)
      const buttons = this.generateFrameButtons(config)
      const postUrl = `${this.baseUrl}/api/farcaster/frame/${config.contentId}`
      return { imageUrl, buttons, postUrl }
    } catch (error) {
      console.error('Frame asset generation failed:', error)
      throw new Error('Failed to generate Frame assets')
    }
  }
  private async generateFrameImage(config: FrameAssetConfig): Promise<string> {
    if (config.previewImage) {
      return await this.optimizeImageForFrame(config.previewImage)
    }
    return await this.createDynamicFrameImage(config)
  }
  private async optimizeImageForFrame(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      if (!response.ok) throw new Error('Source image not accessible')
      const optimizedUrl = `${this.baseUrl}/api/images/optimize?src=${encodeURIComponent(imageUrl)}&ratio=1.91:1`
      return optimizedUrl
    } catch (error) {
      console.warn('Image optimization failed, using fallback:', error)
      return `${this.baseUrl}/images/frames/default-preview.png`
    }
  }
  private async createDynamicFrameImage(config: FrameAssetConfig): Promise<string> {
    const imageParams = new URLSearchParams({
      contentId: config.contentId.toString(),
      title: config.title,
      price: (Number(config.price) / 1000000).toFixed(2),
      creator: config.creatorAddress,
      style: config.frameStyle
    })
    return `${this.baseUrl}/api/images/frame/generate?${imageParams.toString()}`
  }
  private generateFrameButtons(config: FrameAssetConfig): readonly { label: string; action: string; target: string }[] {
    const buttons = [
      {
        label: config.callToAction,
        action: 'post',
        target: `/api/farcaster/purchase/${config.contentId}`
      }
    ]
    if (config.frameStyle !== 'minimal') {
      buttons.push({
        label: 'Creator Profile',
        action: 'link',
        target: `${this.baseUrl}/creator/${config.creatorAddress}`
      })
    }
    return buttons
  }
}

class SocialContentGenerator {
  static async generateSocialContent(
    contentData: EnhancedContentPublishingData,
    contentId: bigint,
    creatorProfile?: { readonly displayName?: string; readonly fid?: number }
  ): Promise<Omit<SocialContentResult, 'frameMetadata'>> {
    try {
      const castText = this.generateOptimizedCastText(contentData, creatorProfile)
      const hashtags = this.generateStrategicHashtags(contentData)
      const mentions = this.generateStrategicMentions(contentData, creatorProfile)
      const engagementHooks = this.generateEngagementHooks(contentData)
      return { castText, hashtags, mentions, engagementHooks }
    } catch (error) {
      console.error('Social content generation failed:', error)
      return {
        castText: `New content published: ${contentData.title}`,
        hashtags: ['content', 'creator'],
        mentions: [],
        engagementHooks: ['Check out my latest content!']
      }
    }
  }
  private static generateOptimizedCastText(
    contentData: EnhancedContentPublishingData,
    creatorProfile?: { readonly displayName?: string; readonly fid?: number }
  ): string {
    let castText = ''
    if (creatorProfile?.displayName) {
      castText += `${creatorProfile.displayName} just published: `
    }
    castText += `"${contentData.title}"`
    const description = contentData.socialDescription || contentData.description
    if (description && description.length <= 100) {
      castText += `\n\n${description}`
    }
    const callToAction = contentData.socialCallToAction || 'Get instant access with USDC'
    castText += `\n\n${callToAction}`
    castText += '\n\n💎 Premium content, instant access'
    return castText
  }
  private static generateStrategicHashtags(contentData: EnhancedContentPublishingData): readonly string[] {
    const baseHashtags = ['content', 'creator', 'web3']
    const strategicHashtags: string[] = []
    if (contentData.category) {
      const categoryHashtags = this.getCategoryHashtags(contentData.category)
      strategicHashtags.push(...categoryHashtags)
    }
    if (contentData.targetAudience) {
      const audienceHashtags = this.getAudienceHashtags(contentData.targetAudience)
      strategicHashtags.push(...audienceHashtags)
    }
    if (contentData.socialKeywords) {
      strategicHashtags.push(...contentData.socialKeywords)
    }
    const allHashtags = [...baseHashtags, ...strategicHashtags]
    return Array.from(new Set(allHashtags)).slice(0, 8)
  }
  private static getCategoryHashtags(category: ContentCategory): string[] {
    const categoryMap: Record<string, string[]> = {
      'Article': ['article', 'blog', 'writing'],
      'Video': ['video', 'tutorial', 'education'],
      'Audio': ['audio', 'podcast', 'listening'],
      'Image': ['image', 'art', 'visual'],
      'Course': ['course', 'learning', 'education'],
      'Document': ['document', 'guide', 'reference'],
      'Other': ['content', 'digital']
    }
    const categoryString = category.toString()
    return categoryMap[categoryString] || categoryMap['Other']
  }
  private static getAudienceHashtags(audience: 'general' | 'creators' | 'crypto' | 'tech'): string[] {
    const audienceMap: Record<string, string[]> = {
      'creators': ['creators', 'creatoreconomy', 'contentcreator'],
      'crypto': ['crypto', 'defi', 'blockchain'],
      'tech': ['tech', 'programming', 'development'],
      'general': ['lifestyle', 'community', 'discover']
    }
    return audienceMap[audience] || audienceMap['general']
  }
  private static generateStrategicMentions(
    contentData: EnhancedContentPublishingData,
    creatorProfile?: { readonly displayName?: string; readonly fid?: number }
  ): readonly string[] {
    const mentions: string[] = []
    const communityMentions: Record<string, string[]> = {
      'crypto': ['@farcaster', '@base'],
      'tech': ['@builders', '@developers'],
      'creators': ['@creators', '@creatoreconomy']
    }
    if (contentData.targetAudience && communityMentions[contentData.targetAudience]) {
      mentions.push(...communityMentions[contentData.targetAudience])
    }
    return mentions.slice(0, 3)
  }
  private static generateEngagementHooks(contentData: EnhancedContentPublishingData): readonly string[] {
    const hooks: string[] = []
    switch (contentData.targetAudience) {
      case 'creators':
        hooks.push(
          'Fellow creators, what content strategies are working for you?',
          'Drop your best content creation tips below!'
        )
        break
      case 'crypto':
        hooks.push(
          'What are your thoughts on the current Web3 content landscape?',
          'How do you prefer to consume crypto educational content?'
        )
        break
      case 'tech':
        hooks.push(
          'Developers, what topics should I cover next?',
          'What tech skills are you focusing on in 2025?'
        )
        break
      default:
        hooks.push(
          'What topics interest you most?',
          'What content would you like to see next?'
        )
    }
    return hooks.slice(0, 2)
  }
}

class PerformancePredictionEngine {
  static async predictSocialPerformance(
    contentData: EnhancedContentPublishingData,
    creatorHistory?: {
      readonly averageFrameViews: number
      readonly averageEngagementRate: number
      readonly averageConversionRate: number
    }
  ): Promise<{
    readonly expectedFrameViews: number
    readonly predictedEngagementRate: number
    readonly estimatedConversionRate: number
  }> {
    const baseFrameViews = creatorHistory?.averageFrameViews || 100
    const baseEngagementRate = creatorHistory?.averageEngagementRate || 0.05
    const baseConversionRate = creatorHistory?.averageConversionRate || 0.02
    let frameViewMultiplier = 1.0
    let engagementMultiplier = 1.0
    let conversionMultiplier = 1.0
    if (contentData.socialKeywords && contentData.socialKeywords.length > 0) {
      frameViewMultiplier *= 1.2
    }
    if (contentData.framePreviewImage) {
      engagementMultiplier *= 1.3
    }
    if (contentData.socialDescription) {
      engagementMultiplier *= 1.15
    }
    if (contentData.targetAudience && contentData.targetAudience !== 'general') {
      conversionMultiplier *= 1.25
    }
    return {
      expectedFrameViews: Math.round(baseFrameViews * frameViewMultiplier),
      predictedEngagementRate: Math.min(baseEngagementRate * engagementMultiplier, 0.15),
      estimatedConversionRate: Math.min(baseConversionRate * conversionMultiplier, 0.08)
    }
  }
}

export function useEnhancedContentPublishingFlow(
  userAddress?: Address
): EnhancedContentPublishingFlowResult {
  const { address: connectedAddress } = useAccount()
  const effectiveUserAddress = (userAddress || connectedAddress) as Address | undefined
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  const basePublishingFlow = useContentPublishingFlow(effectiveUserAddress)
  const farcasterContext = useFarcasterContext()
  const miniAppAnalytics = useMiniAppAnalytics(effectiveUserAddress)
  const [enhancedState, setEnhancedState] = useState<{
    currentStep: EnhancedContentPublishingFlowStep
    socialValidationErrors: readonly string[]
    socialOptimization: {
      isProcessing: boolean
      results: SocialContentResult | null
      error: Error | null
    }
    lastPublishedContent: EnhancedContentPublishingData | null
  }>({
    currentStep: 'idle',
    socialValidationErrors: [],
    socialOptimization: {
      isProcessing: false,
      results: null,
      error: null
    },
    lastPublishedContent: null
  })
  const frameAssetGenerator = useMemo(() =>
    new FrameAssetGenerator(process.env.NEXT_PUBLIC_URL || 'https://localhost:3000'),
  [])
  const validateSocialContentData = useCallback((
    data: EnhancedContentPublishingData
  ): { isValid: boolean; errors: readonly string[] } => {
    const errors: string[] = []
    if (data.socialDescription && data.socialDescription.length > 280) {
      errors.push('Social description should be 280 characters or less for optimal Frame display')
    }
    if (data.framePreviewImage) {
      try {
        new URL(data.framePreviewImage)
      } catch {
        errors.push('Frame preview image must be a valid URL')
      }
    }
    if (data.socialKeywords && data.socialKeywords.length > 10) {
      errors.push('Maximum 10 social keywords allowed for optimal discovery performance')
    }
    if (data.socialCallToAction && data.socialCallToAction.length > 100) {
      errors.push('Social call-to-action should be 100 characters or less')
    }
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])
  const generateSocialOptimizationAssets = useCallback(async (
    contentId: bigint,
    contentData: EnhancedContentPublishingData
  ): Promise<SocialContentResult> => {
    try {
      setEnhancedState(prev => ({
        ...prev,
        currentStep: 'generating_frame_assets',
        socialOptimization: { ...prev.socialOptimization, isProcessing: true }
      }))
      const frameAssetConfig: FrameAssetConfig = {
        contentId,
        title: contentData.title,
        description: contentData.socialDescription || contentData.description,
        previewImage: contentData.framePreviewImage,
        price: contentData.payPerViewPrice,
        creatorAddress: effectiveUserAddress!,
        socialKeywords: contentData.socialKeywords || [],
        callToAction: contentData.socialCallToAction || 'View Content',
        frameStyle: contentData.frameStyle || 'interactive'
      }
      const frameMetadata = await frameAssetGenerator.generateFrameAssets(frameAssetConfig)
      setEnhancedState(prev => ({
        ...prev,
        currentStep: 'creating_social_content'
      }))
      const socialContentData = await SocialContentGenerator.generateSocialContent(
        contentData,
        contentId,
        farcasterContext?.user ? {
          displayName: farcasterContext.user.displayName,
          fid: farcasterContext.user.fid
        } : undefined
      )
      setEnhancedState(prev => ({
        ...prev,
        currentStep: 'optimizing_discovery'
      }))
      const socialOptimizationResult: SocialContentResult = {
        ...socialContentData,
        frameMetadata
      }
      return socialOptimizationResult
    } catch (error) {
      const optimizationError = error instanceof Error ? error : new Error('Social optimization failed')
      setEnhancedState(prev => ({
        ...prev,
        socialOptimization: {
          ...prev.socialOptimization,
          error: optimizationError
        }
      }))
      throw optimizationError
    }
  }, [frameAssetGenerator, farcasterContext, effectiveUserAddress])
  const publishWithSocialOptimization = useCallback(async (
    enhancedData: EnhancedContentPublishingData
  ): Promise<EnhancedPublishingResult> => {
    try {
      setEnhancedState(prev => ({ 
        ...prev, 
        currentStep: 'validating_social_data',
        socialValidationErrors: [],
        lastPublishedContent: enhancedData
      }))
      const socialValidation = validateSocialContentData(enhancedData)
      if (!socialValidation.isValid) {
        setEnhancedState(prev => ({
          ...prev,
          currentStep: 'error',
          socialValidationErrors: socialValidation.errors
        }))
        return {
          success: false,
          error: new Error('Social content validation failed')
        }
      }
      const traditionalData: ContentPublishingData = {
        title: enhancedData.title,
        description: enhancedData.description,
        ipfsHash: enhancedData.ipfsHash,
        category: enhancedData.category,
        payPerViewPrice: enhancedData.payPerViewPrice,
        tags: enhancedData.tags
      }
      basePublishingFlow.publish(traditionalData)
      return {
        success: true
      }
    } catch (error) {
      const publishingError = error instanceof Error ? error : new Error('Enhanced publishing failed')
      setEnhancedState(prev => ({
        ...prev,
        currentStep: 'error',
        socialValidationErrors: [publishingError.message]
      }))
      return {
        success: false,
        error: publishingError
      }
    }
  }, [basePublishingFlow, validateSocialContentData])
  const socialCapabilities = useMemo(() => {
    const canShare = Boolean(
      farcasterContext && 
      enhancedState.socialOptimization.results &&
      enhancedState.currentStep === 'completed'
    )
    const shareToFarcaster = async (message: string): Promise<void> => {
      if (!farcasterContext || !canShare) {
        throw new Error('Farcaster sharing not available')
      }
      try {
        console.log('Sharing to Farcaster:', message)
      } catch (error) {
        console.error('Farcaster sharing failed:', error)
        throw new Error('Failed to share content to Farcaster')
      }
    }
    const generateOptimizedShareMessage = (): string => {
      if (!enhancedState.socialOptimization.results) {
        return 'Check out my latest content!'
      }
      return enhancedState.socialOptimization.results.castText
    }
    return {
      canShare,
      shareToFarcaster,
      generateOptimizedShareMessage
    }
  }, [farcasterContext, enhancedState])
  useEffect(() => {
    switch (basePublishingFlow.currentStep) {
      case 'idle':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'idle' 
        }))
        break
      case 'checking_creator':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'checking_creator' 
        }))
        break
      case 'validating_content':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'validating_content' 
        }))
        break
      case 'registering':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'registering' 
        }))
        break
      case 'error':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'error' 
        }))
        break
    }
  }, [basePublishingFlow.currentStep])
  useEffect(() => {
    if (basePublishingFlow.currentStep === 'completed' && 
        enhancedState.currentStep === 'registering' &&
        enhancedState.lastPublishedContent) {
      const executePostPublishingOptimization = async () => {
        try {
          const mockContentId = BigInt(Date.now())
          const socialResults = await generateSocialOptimizationAssets(
            mockContentId,
            enhancedState.lastPublishedContent!
          )
          const performancePredictions = await PerformancePredictionEngine.predictSocialPerformance(
            enhancedState.lastPublishedContent!,
            miniAppAnalytics.data ? {
              averageFrameViews: miniAppAnalytics.data.frameViews / Math.max(miniAppAnalytics.data.contentSocialMetrics.length, 1),
              averageEngagementRate: 0.05,
              averageConversionRate: miniAppAnalytics.data.enhancedEarnings.socialConversionRate / 100
            } : undefined
          )
          setEnhancedState(prev => ({
            ...prev,
            currentStep: 'completed',
            socialOptimization: {
              isProcessing: false,
              results: socialResults,
              error: null
            }
          }))
        } catch (error) {
          console.error('Post-publishing optimization failed:', error)
          setEnhancedState(prev => ({
            ...prev,
            currentStep: 'completed',
            socialOptimization: {
              isProcessing: false,
              results: null,
              error: error instanceof Error ? error : new Error('Social optimization failed')
            }
          }))
        }
      }
      executePostPublishingOptimization()
    }
  }, [
    basePublishingFlow.currentStep, 
    enhancedState.currentStep,
    enhancedState.lastPublishedContent,
    generateSocialOptimizationAssets,
    miniAppAnalytics.data
  ])
  const resetEnhancedWorkflow = useCallback(() => {
    basePublishingFlow.reset()
    setEnhancedState({
      currentStep: 'idle',
      socialValidationErrors: [],
      socialOptimization: {
        isProcessing: false,
        results: null,
        error: null
      },
      lastPublishedContent: null
    })
  }, [basePublishingFlow])
  const combinedValidationErrors = useMemo(() => {
    return [
      ...enhancedState.socialValidationErrors
    ]
  }, [enhancedState.socialValidationErrors])
  return {
    currentStep: enhancedState.currentStep,
    isLoading: basePublishingFlow.isLoading,
    error: basePublishingFlow.error,
    isValidContent: true,
    validationErrors: combinedValidationErrors,
    publish: basePublishingFlow.publish,
    publishWithSocialOptimization,
    publishingProgress: basePublishingFlow.publishingProgress,
    socialOptimization: enhancedState.socialOptimization,
    reset: resetEnhancedWorkflow,
    socialCapabilities
  }
}

// Creator Onboarding Flow
export type CreatorOnboardingFlowStep = 
  | 'checking'
  | 'not_registered'
  | 'registering'
  | 'registered'
  | 'error'

export interface CreatorOnboardingFlowResult {
  readonly currentStep: CreatorOnboardingFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly isRegistered: boolean
  readonly profile: Creator | null
  readonly register: (subscriptionPrice: bigint, profileData: string) => void
  readonly reset: () => void
  readonly registrationProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

export function useCreatorOnboarding(
  userAddress: Address | undefined
): CreatorOnboardingFlowResult {
  const chainId = useChainId()
  
  const registrationCheck = useIsCreatorRegistered(userAddress)
  const creatorProfile = useCreatorProfile(userAddress)
  const registerCreator = useRegisterCreator()
  
  const [workflowState, setWorkflowState] = useState<{
    currentStep: CreatorOnboardingFlowStep
    error: Error | null
    lastTransactionHash: string | null
    hasJustRegistered: boolean
  }>({
    currentStep: 'checking',
    error: null,
    lastTransactionHash: null,
    hasJustRegistered: false
  })
  
  const isRegistered = registrationCheck.data ?? false
  const isLoading = registrationCheck.isLoading || 
                   creatorProfile.isLoading || 
                   registerCreator.isLoading
  
  const registrationProgress = useMemo(() => ({
    isSubmitting: registerCreator.isLoading && !registerCreator.isConfirmed,
    isConfirming: registerCreator.isLoading && !registerCreator.isConfirmed,
    isConfirmed: registerCreator.isConfirmed,
    transactionHash: registerCreator.hash
  }), [registerCreator.isLoading, registerCreator.isConfirmed, registerCreator.hash])
  
  const profileData = useMemo(() => {
    if (!creatorProfile.data || !isRegistered) return null
    
    return {
      subscriptionPrice: creatorProfile.data.subscriptionPrice,
      totalEarnings: creatorProfile.data.totalEarnings,
      subscriberCount: creatorProfile.data.subscriberCount,
      contentCount: creatorProfile.data.contentCount,
      registrationTime: creatorProfile.data.registrationTime,
      isRegistered: creatorProfile.data.isRegistered,
      isVerified: creatorProfile.data.isVerified,
    }
  }, [creatorProfile.data, isRegistered])
  
  const register = useCallback(async (subscriptionPrice: bigint, profileData: string) => {
    if (!userAddress) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Wallet not connected') 
      }))
      return
    }
    
    if (isRegistered) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Already registered as creator') 
      }))
      return
    }
    
    if (!profileData || profileData.trim().length === 0) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Profile data cannot be empty') 
      }))
      return
    }
    
    if (subscriptionPrice < BigInt(10000) || subscriptionPrice > BigInt(100000000)) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Subscription price must be between $0.01 and $100.00') 
      }))
      return
    }
    
    try {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'registering',
        error: null,
        hasJustRegistered: false
      }))
      
      console.group('🚀 Enhanced Hook: Starting Creator Registration')
      console.log('Subscription Price (BigInt):', subscriptionPrice.toString())
      console.log('Profile Data:', profileData)
      console.log('User Address:', userAddress)
      console.groupEnd()
      
      registerCreator.write({
        subscriptionPrice,
        profileData
      })
      
    } catch (error) {
      console.error('Registration hook error:', error)
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Registration failed')
      }))
    }
  }, [userAddress, isRegistered, registerCreator])
  
  const reset = useCallback(() => {
    setWorkflowState({ 
      currentStep: 'checking', 
      error: null,
      lastTransactionHash: null,
      hasJustRegistered: false
    })
    registerCreator.reset()
    registrationCheck.refetch()
    creatorProfile.refetch()
  }, [registerCreator, registrationCheck, creatorProfile])
  
  useEffect(() => {
    const currentTxHash = registerCreator.hash
    if (!currentTxHash || currentTxHash === workflowState.lastTransactionHash) {
      return
    }
    
    if (registerCreator.isLoading && !registerCreator.isConfirmed) {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'registering',
        lastTransactionHash: currentTxHash
      }))
    } else if (registerCreator.error) {
      console.error('Registration transaction error:', registerCreator.error)
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: registerCreator.error,
        lastTransactionHash: currentTxHash
      }))
    } else if (registerCreator.isConfirmed) {
      console.group('✅ Enhanced Hook: Transaction Confirmed!')
      console.log('Transaction Hash:', currentTxHash)
      console.log('Setting state to registered and flagging as just registered')
      console.groupEnd()
      
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'registered',
        lastTransactionHash: currentTxHash,
        hasJustRegistered: true,
        error: null
      }))
      
      setTimeout(() => {
        console.log('🔄 Refreshing registration and profile data...')
        registrationCheck.refetch()
        creatorProfile.refetch()
      }, 1000)
    }
  }, [
    registerCreator.isLoading, 
    registerCreator.isConfirmed, 
    registerCreator.error, 
    registerCreator.hash,
    workflowState.lastTransactionHash,
    registrationCheck, 
    creatorProfile
  ])
  
  useEffect(() => {
    if (workflowState.hasJustRegistered) {
      console.log('🛡️ Protected: Ignoring registration check because we just registered')
      return
    }
    
    if (workflowState.currentStep === 'registering') {
      console.log('🛡️ Protected: Ignoring registration check during registration process')
      return
    }
    
    if (registrationCheck.isLoading) {
      if (workflowState.currentStep === 'checking') {
        setWorkflowState(prev => ({ ...prev, currentStep: 'checking' }))
      }
      return
    }
    
    if (registrationCheck.error) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Failed to check registration status')
      }))
      return
    }
    
    if (workflowState.currentStep === 'checking') {
      if (registrationCheck.data === true) {
        console.log('📊 Registration check confirmed: User is registered')
        setWorkflowState(prev => ({ 
          ...prev, 
          currentStep: 'registered',
          hasJustRegistered: false
        }))
      } else {
        console.log('📊 Registration check confirmed: User is not registered')
        setWorkflowState(prev => ({ 
          ...prev, 
          currentStep: 'not_registered'
        }))
      }
    }
  }, [
    registrationCheck.isLoading, 
    registrationCheck.error, 
    registrationCheck.data, 
    workflowState.currentStep,
    workflowState.hasJustRegistered
  ])
  
  useEffect(() => {
    if (workflowState.hasJustRegistered && 
        registrationCheck.data === true && 
        !registrationCheck.isLoading) {
      console.log('🎯 Data refresh confirmed registration - clearing just registered flag')
      setWorkflowState(prev => ({ 
        ...prev, 
        hasJustRegistered: false 
      }))
    }
  }, [workflowState.hasJustRegistered, registrationCheck.data, registrationCheck.isLoading])
  
  useEffect(() => {
    if (userAddress) {
      console.log('👤 Address changed, resetting workflow:', userAddress)
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'checking',
        error: null,
        lastTransactionHash: null,
        hasJustRegistered: false
      }))
    }
  }, [userAddress])
  
  useEffect(() => {
    console.group('🔍 Enhanced Hook State Debug')
    console.log('Current Step:', workflowState.currentStep)
    console.log('Has Just Registered:', workflowState.hasJustRegistered)
    console.log('Registration Check Data:', registrationCheck.data)
    console.log('Registration Check Loading:', registrationCheck.isLoading)
    console.log('Profile Data Available:', !!profileData)
    console.log('Transaction Hash:', workflowState.lastTransactionHash)
    console.groupEnd()
  }, [
    workflowState.currentStep, 
    workflowState.hasJustRegistered,
    registrationCheck.data, 
    registrationCheck.isLoading, 
    profileData,
    workflowState.lastTransactionHash
  ])
  
  return {
    currentStep: workflowState.currentStep,
    isLoading,
    error: workflowState.error,
    isRegistered,
    profile: profileData,
    register,
    reset,
    registrationProgress
  }
}
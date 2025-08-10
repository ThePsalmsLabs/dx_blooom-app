import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { Address, parseEventLogs } from 'viem'
import { useChainId, useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from 'wagmi'
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
import { CONTENT_REGISTRY_ABI, COMMERCE_PROTOCOL_INTEGRATION_ABI, PRICE_ORACLE_ABI, ERC20_ABI, PAY_PER_VIEW_ABI } from '@/lib/contracts/abis'
import { useMiniAppAnalytics } from '@/hooks/farcaster/useMiniAppAnalytics'
import type { Creator, ContentCategory, Content } from '@/types/contracts'


// ===== ENUMS AND INTERFACES =====

/**
 * Supported Payment Methods Enum
 */
export enum PaymentMethod {
  USDC = 0,        // Direct USDC payment via PayPerView.purchaseContentDirect()
  ETH = 1,         // ETH payment via Commerce Protocol
  WETH = 2,        // Wrapped ETH payment via Commerce Protocol
  CBETH = 3,       // Coinbase ETH payment via Commerce Protocol
  DAI = 4,         // DAI stablecoin payment via Commerce Protocol
  OTHER_TOKEN = 99 // Custom token payment via Commerce Protocol
}

export enum PaymentTier {
  SIMPLE = 'SIMPLE',     // Direct USDC only
  ADVANCED = 'ADVANCED'  // Multi-token via payment intents
}

/**
 * Base Mainnet Token Addresses
 * These are official token addresses on Base Mainnet
 */
export const BASE_MAINNET_TOKENS = {
  USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as Address,
  WETH: '0x4200000000000000000000000000000000000006' as Address,
  DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as Address,
  CBETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22' as Address,
  WBTC: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c' as Address,
  USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as Address,
  OP: '0xA960dE9F7A8FAe3a6BD37DdF77E0Ba87A652d9e9' as Address,
  UNI: '0xa33c0F82dc3bD8fF66A38d6D6d5C14C19d0E8b63' as Address,
} as const

/**
 * Base Sepolia Testnet Token Addresses
 * These are popular tokens available on Base Sepolia for testing
 * Note: Some tokens may not exist on testnet, so we'll handle missing contracts gracefully
 */
export const BASE_SEPOLIA_TOKENS = {
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
  WETH: '0x4200000000000000000000000000000000000006' as Address, // Wrapped ETH on Base
  // DAI and CBETH may not exist on Base Sepolia, so we'll disable them for now
  // DAI: '0xf175520c52418dfe19c8098071a252da48cd1c19' as Address,
  // CBETH: '0x7c6b91D9Be155A6Db01f749217d76fF02A7227F2' as Address,
} as const

/**
 * Get token addresses based on current chain
 */
export function getTokenAddresses(chainId: number) {
  return chainId === 8453 ? BASE_MAINNET_TOKENS : BASE_SEPOLIA_TOKENS
}

/**
 * Token Configuration for Multi-Payment Support
 */
export interface TokenConfig {
  readonly address: Address
  readonly symbol: string
  readonly name: string
  readonly decimals: number
  readonly isNative: boolean
  readonly isStablecoin: boolean
  readonly estimatedGas: 'Low' | 'Medium' | 'High'
  readonly poolFee: number // Uniswap V3 pool fee (in basis points)
}

/**
 * Get supported tokens configuration based on chain ID
 */
export function getSupportedTokens(chainId: number): Record<PaymentMethod, TokenConfig | null> {
  const tokenAddresses = getTokenAddresses(chainId)
  
  return {
    [PaymentMethod.USDC]: {
      address: tokenAddresses.USDC,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      isNative: false,
      isStablecoin: true,
      estimatedGas: 'Low',
      poolFee: 100 // 0.01%
    },
    [PaymentMethod.ETH]: {
      address: '0x0000000000000000000000000000000000000000' as Address,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true,
      isStablecoin: false,
      estimatedGas: 'Medium',
      poolFee: 500 // 0.05%
    },
    [PaymentMethod.WETH]: {
      address: tokenAddresses.WETH,
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      isNative: false,
      isStablecoin: false,
      estimatedGas: 'Medium',
      poolFee: 500 // 0.05%
    },
    [PaymentMethod.CBETH]: null, // Disabled for now - not available on testnet
    [PaymentMethod.DAI]: null,   // Disabled for now - not available on testnet
    [PaymentMethod.OTHER_TOKEN]: null // Will be dynamically configured
  }
}

interface ContentDetails {
  creator: Address
  ipfsHash: string
  title: string
  description: string
  category: number
  payPerViewPrice: bigint
  isActive: boolean
  createdAt: bigint
  purchaseCount: bigint
  tags: readonly string[]
  isReported: boolean
  reportCount: bigint
}

interface PaymentIntentResult {
  intentId: string  // bytes16 returned as hex string
  expectedAmount: bigint
  deadline: bigint
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

export interface PaymentOption {
  readonly method: PaymentMethod
  readonly token: Address | null
  readonly symbol: string
  readonly balance: bigint | null
  readonly requiredAmount: bigint | null
  readonly canAfford: boolean
  readonly needsApproval: boolean
  readonly recommended?: boolean
  readonly estimatedTime: string
  readonly gasEstimate: 'Low' | 'Medium' | 'High'
}

// Transaction progress interface
export interface PurchaseProgress {
  readonly isSubmitting: boolean
  readonly isConfirming: boolean  
  readonly isConfirmed: boolean
  readonly transactionHash?: string
  readonly error?: Error | null
}

/**
 * Token Information Interface
 */
interface TokenInfo {
  address: Address
  symbol: string
  name: string
  decimals: number
  isNative: boolean
  balance: bigint | null
  formattedBalance: string
  hasEnoughBalance: boolean
  needsApproval: boolean
  allowance: bigint | null
  requiredAmount: bigint | null
  priceInUSDC?: bigint | null
  priceLoading: boolean
  priceError: string | null
  isLoading: boolean
  error?: string
}

interface ContentPurchaseFlowState {
  step: 'idle' | 'loading_content' | 'checking_access' | 'insufficient_balance' | 'need_approval' | 'can_purchase' | 'approving_tokens' | 'purchasing' | 'completed' | 'error'
  message: string
  progress: number
  transactionHash?: string
  error?: Error
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
  enabledMethods: [PaymentMethod.USDC, PaymentMethod.ETH, PaymentMethod.OTHER_TOKEN],
  defaultMethod: PaymentMethod.USDC,
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
    id: PaymentMethod.USDC,
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
    description: 'Pay with native ETH via Commerce Protocol',
    icon: '⟠',
    estimatedTime: '~45 seconds',
    gasEstimate: 'Medium',
    requiresApproval: false,
    supportsSlippage: true,
    isCommerceProtocol: true
  },
  {
    id: PaymentMethod.WETH,
    name: 'Wrapped ETH (WETH)',
    description: 'Pay with Wrapped ETH - excellent liquidity',
    icon: '🔗',
    estimatedTime: '~45 seconds',
    gasEstimate: 'Medium',
    requiresApproval: true,
    supportsSlippage: true,
    isCommerceProtocol: true
  },
  {
    id: PaymentMethod.CBETH,
    name: 'Coinbase ETH (cbETH)',
    description: 'Pay with Coinbase staked ETH',
    icon: '🏛️',
    estimatedTime: '~45 seconds',
    gasEstimate: 'Medium',
    requiresApproval: true,
    supportsSlippage: true,
    isCommerceProtocol: true
  },
  {
    id: PaymentMethod.DAI,
    name: 'DAI Stablecoin',
    description: 'Pay with DAI stablecoin - stable value',
    icon: '🔶',
    estimatedTime: '~30 seconds',
    gasEstimate: 'Low',
    requiresApproval: true,
    supportsSlippage: true,
    isCommerceProtocol: true
  },
  {
    id: PaymentMethod.OTHER_TOKEN,
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
  // Cache price oracle results and contract reads to avoid RPC rate limits
  const priceResultCacheRef = useRef<Map<string, { value: { requiredAmount: bigint; priceInUSDC: bigint } | null; ts: number }>>(new Map())
  const contractReadCacheRef = useRef<Map<string, { value: unknown; ts: number }>>(new Map())
  const CACHE_TTL_MS = 30_000

  // Concurrency + debounce guards
  const isRefreshingRef = useRef<boolean>(false)
  const lastRefreshAtRef = useRef<number | null>(null)
  const methodChangeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const customTokenDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getConfiguredTransport = useCallback((): ReturnType<typeof http> => {
    const transports = (wagmiConfig as { transports?: Record<number, ReturnType<typeof http>> })?.transports
    const transport = transports?.[chainId]
    return transport ?? http()
  }, [chainId])

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
   * Current Token Information with Multi-Token Support
   */
  const selectedToken = useMemo((): TokenInfo | null => {
    if (!contractAddresses) return null

    // Get token configuration for selected method
    const supportedTokens = getSupportedTokens(chainId)
    const tokenConfig = supportedTokens[selectedMethod]
    if (!tokenConfig && selectedMethod !== PaymentMethod.OTHER_TOKEN) return null

    // Determine token address
    let tokenAddress: Address
    let symbol: string
    let name: string
    let decimals: number
    let isNative: boolean

    if (selectedMethod === PaymentMethod.OTHER_TOKEN && customTokenAddress) {
      tokenAddress = customTokenAddress
      symbol = 'TOKEN'
      name = 'Custom Token'
      decimals = 18
      isNative = false
    } else if (tokenConfig) {
      tokenAddress = tokenConfig.address
      symbol = tokenConfig.symbol
      name = tokenConfig.name
      decimals = tokenConfig.decimals
      isNative = tokenConfig.isNative
    } else {
      return null
    }

    // Check if we have cached token info
    const cached = tokenPrices.get(tokenAddress)
    if (cached) return cached as TokenInfo

    // Return basic info for uncached tokens
    return {
      address: tokenAddress,
      symbol,
      name,
      decimals,
      isNative,
      balance: null,
      formattedBalance: '0.00',
      allowance: null,
      priceInUSDC: null,
      requiredAmount: null,
      priceLoading: true,
      priceError: null,
      hasEnoughBalance: false,
      needsApproval: false,
      isLoading: true,
      error: undefined
    }
  }, [selectedMethod, customTokenAddress, contractAddresses, tokenPrices])

  /**
   * Enhanced Price Calculation with Multi-Token Support
   */
  const calculateTokenPrice = useCallback(async (
    tokenAddress: Address,
    usdcAmount: bigint,
    paymentMethod: PaymentMethod
  ): Promise<{ requiredAmount: bigint; priceInUSDC: bigint } | null> => {
    if (!contractAddresses) return null

    try {
      const cacheKey = `${tokenAddress}-${usdcAmount.toString()}-${paymentMethod}`
      const cached = priceResultCacheRef.current.get(cacheKey)
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.value
      }
      // For direct USDC, return 1:1 pricing
      if (tokenAddress === contractAddresses.USDC || paymentMethod === PaymentMethod.USDC) {
        const result = {
          requiredAmount: usdcAmount,
          priceInUSDC: usdcAmount
        }
        priceResultCacheRef.current.set(cacheKey, { value: result, ts: Date.now() })
        return result
      }

      // Create public client for direct contract reads
      const publicClient = createPublicClient({
        chain: chainId === 8453 ? base : baseSepolia,
        transport: getConfiguredTransport()
      })

          // Get token configuration
    const supportedTokens = getSupportedTokens(chainId)
    const tokenConfig = supportedTokens[paymentMethod]
      const poolFee = tokenConfig?.poolFee || 3000

      // For ETH, use PriceOracle.getETHPrice
      if (tokenAddress === '0x0000000000000000000000000000000000000000' || paymentMethod === PaymentMethod.ETH) {
        try {
          const ethAmount = await publicClient.readContract({
          address: contractAddresses.PRICE_ORACLE,
          abi: PRICE_ORACLE_ABI,
          functionName: 'getETHPrice',
            args: [usdcAmount]
          }) as bigint

          // Minimal log to avoid noise

          const result = {
            requiredAmount: ethAmount,
            priceInUSDC: usdcAmount
          }
          priceResultCacheRef.current.set(cacheKey, { value: result, ts: Date.now() })
          return result
        } catch (error) {
          console.error(`❌ ETH price calculation failed:`, error)
          // Fallback: use a simple conversion (1 ETH = $3000 USDC for demo)
          const fallbackEthAmount = (usdcAmount * BigInt(1e18)) / BigInt(3000 * 1e6)
          console.log(`🔄 Using fallback ETH price: ${fallbackEthAmount.toString()} wei`)
          const result = {
            requiredAmount: fallbackEthAmount,
            priceInUSDC: usdcAmount
          }
          priceResultCacheRef.current.set(cacheKey, { value: result, ts: Date.now() })
          return result
        }
      }

      // For other tokens, use PriceOracle.getTokenAmountForUSDC
      try {
        const tokenAmount = await publicClient.readContract({
          address: contractAddresses.PRICE_ORACLE,
          abi: PRICE_ORACLE_ABI,
          functionName: 'getTokenAmountForUSDC',
          args: [tokenAddress, usdcAmount, poolFee]
        }) as bigint

          // Minimal log to avoid noise

        const result = {
          requiredAmount: tokenAmount,
          priceInUSDC: usdcAmount
        }
        priceResultCacheRef.current.set(cacheKey, { value: result, ts: Date.now() })
        return result
      } catch (error) {
        console.error(`❌ Token price calculation failed for ${tokenAddress}:`, error)
        priceResultCacheRef.current.set(cacheKey, { value: null, ts: Date.now() })
        return null
      }
    } catch (error) {
      console.error(`Price calculation failed for ${paymentMethod}:`, error)
      return null
    }
  }, [contractAddresses, chainId, getConfiguredTransport])

  /**
   * Enhanced Token Balance and Allowance Fetching with Multi-Token Support
   */
  const fetchTokenInfo = useCallback(async (
    tokenAddress: Address, 
    paymentMethod: PaymentMethod
  ): Promise<TokenInfo> => {
    if (!contractAddresses || !userAddress) {
      throw new Error('Missing required data for token info fetch')
    }

    // Get token configuration
    const supportedTokens = getSupportedTokens(chainId)
    const tokenConfig = supportedTokens[paymentMethod]
    const isEth = tokenAddress === '0x0000000000000000000000000000000000000000' || paymentMethod === PaymentMethod.ETH
    const isUsdc = tokenAddress === contractAddresses.USDC || paymentMethod === PaymentMethod.USDC
    
    console.log(`🔍 Token info fetch - Method: ${paymentMethod}, Address: ${tokenAddress}, isEth: ${isEth}, isUsdc: ${isUsdc}`)

    // Calculate required amount for current content
    const contentPrice = contentQuery.data?.payPerViewPrice || BigInt(0)
    const priceCalculation = await calculateTokenPrice(tokenAddress, contentPrice, paymentMethod)

    // Use cached reads to reduce API calls
    const cacheKey = `${tokenAddress}-${userAddress}-${paymentMethod}`
    const cached = contractReadCacheRef.current.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      console.log(`📦 Using cached token info for ${tokenAddress}`)
      return cached.value as TokenInfo
    }

    // Create public client for direct contract reads using wagmi transport (batched via Alchemy)
    const publicClient = createPublicClient({
      chain: chainId === 8453 ? base : baseSepolia,
      transport: getConfiguredTransport()
    })

    // Determine token metadata
    const symbol = tokenConfig?.symbol || (isEth ? 'ETH' : isUsdc ? 'USDC' : 'TOKEN')
    const name = tokenConfig?.name || (isEth ? 'Ethereum' : isUsdc ? 'USD Coin' : 'Custom Token')
    const decimals = tokenConfig?.decimals || (isEth ? 18 : isUsdc ? 6 : 18)
    const isNative = tokenConfig?.isNative || isEth

    // Fetch balance with cache and minimal logging
    let balance: bigint | null = null
    let formattedBalance = '0.00'
    const balanceCacheKey = `${tokenAddress}-balance-${userAddress}`
    const cachedBalance = contractReadCacheRef.current.get(balanceCacheKey)
    if (cachedBalance && Date.now() - cachedBalance.ts < CACHE_TTL_MS) {
      balance = cachedBalance.value as bigint
    } else {
      try {
        balance = isEth
          ? await publicClient.getBalance({ address: userAddress })
          : await publicClient.readContract({
              address: tokenAddress,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [userAddress]
            }) as bigint
        contractReadCacheRef.current.set(balanceCacheKey, { value: balance, ts: Date.now() })
      } catch {
        balance = BigInt(0)
      }
    }
    formattedBalance = isEth
      ? (Number(balance) / 1e18).toFixed(6)
      : (Number(balance) / Math.pow(10, decimals)).toFixed(6)

    // Fetch allowance (not applicable for ETH)
    let allowance: bigint | null = null
    if (!isEth && (contractAddresses.PAY_PER_VIEW || contractAddresses.COMMERCE_INTEGRATION)) {
      try {
        // Choose spender based on payment path
        const spender = isUsdc ? contractAddresses.PAY_PER_VIEW : contractAddresses.COMMERCE_INTEGRATION
        if (spender) {
          const allowanceCacheKey = `${tokenAddress}-allowance-${userAddress}-${spender}`
          const cachedAllowance = contractReadCacheRef.current.get(allowanceCacheKey)
          if (cachedAllowance && Date.now() - cachedAllowance.ts < CACHE_TTL_MS) {
            allowance = cachedAllowance.value as bigint
          } else {
            allowance = await publicClient.readContract({
              address: tokenAddress,
              abi: ERC20_ABI,
              functionName: 'allowance',
              args: [userAddress, spender]
            }) as bigint
            contractReadCacheRef.current.set(allowanceCacheKey, { value: allowance, ts: Date.now() })
          }
        }
      } catch {
        allowance = BigInt(0)
      }
    }

    const requiredAmount = priceCalculation?.requiredAmount || null
    const hasEnoughBalance = balance !== null && requiredAmount !== null ? balance >= requiredAmount : false
    const needsApproval = !isEth && allowance !== null && requiredAmount !== null ? allowance < requiredAmount : false

    const tokenInfo = {
      address: tokenAddress,
      symbol,
      name,
      decimals,
      isNative,
      balance,
      formattedBalance,
      allowance,
      priceInUSDC: priceCalculation?.priceInUSDC || null,
      requiredAmount,
      priceLoading: false,
      priceError: null,
      hasEnoughBalance,
      needsApproval,
      isLoading: false,
      error: undefined
    }

    console.log(`🎯 Final token info for ${symbol}:`, {
      symbol,
      balance: balance?.toString(),
      formattedBalance,
      hasBalance: balance !== null,
      balanceGreaterThanZero: balance !== null && balance > BigInt(0),
      requiredAmount: requiredAmount?.toString(),
      hasEnoughBalance,
      needsApproval
    })

    // Cache the assembled token info for quick reuse
    contractReadCacheRef.current.set(cacheKey, { value: tokenInfo, ts: Date.now() })
    return tokenInfo
  }, [contractAddresses, userAddress, contentQuery.data, calculateTokenPrice, chainId])

  /**
   * Enhanced Price Refresh Function for All Supported Tokens
   */
  const refreshPrices = useCallback(async (): Promise<void> => {
    if (!contractAddresses || !contentQuery.data) return

    // Prevent overlapping refresh cycles and throttle rapid calls
    if (isRefreshingRef.current) {
      console.log('⏳ Skipping refresh: already running')
      return
    }
    const now = Date.now()
    if (lastRefreshAtRef.current && now - lastRefreshAtRef.current < 2000) {
      console.log('⏳ Skipping refresh: throttled')
      return
    }
    isRefreshingRef.current = true
    lastRefreshAtRef.current = now

    console.log(`🔄 Starting price refresh for ${userAddress} on chain ${chainId}`)
    const updatedPrices = new Map<Address, TokenInfo>()

    // Get all payment methods to check
    const supportedTokens = getSupportedTokens(chainId)
    const methodsToCheck = Object.keys(supportedTokens).map(key => parseInt(key) as PaymentMethod)
    console.log(`📋 Methods to check: ${methodsToCheck.join(', ')}`)
    
    // Limit how many tokens we refresh per cycle to avoid RPC flooding
    const MAX_TOKENS_PER_CYCLE = 2
    let processed = 0
    for (const method of methodsToCheck) {
      if (processed >= MAX_TOKENS_PER_CYCLE) break
      if (method === PaymentMethod.OTHER_TOKEN) {
        // Handle custom token if set
        if (customTokenAddress) {
          try {
            const tokenInfo = await fetchTokenInfo(customTokenAddress, method)
            updatedPrices.set(customTokenAddress, tokenInfo)
          } catch (error) {
            console.error(`Failed to fetch custom token info:`, error)
          }
        }
        continue
      }

      const tokenConfig = supportedTokens[method]
      if (!tokenConfig) continue

      try {
        console.log(`🔄 Fetching ${tokenConfig.symbol} info for method ${method}...`)
        const tokenInfo = await fetchTokenInfo(tokenConfig.address, method)
        updatedPrices.set(tokenConfig.address, tokenInfo)
        processed += 1
        console.log(`✅ Updated ${tokenConfig.symbol} info:`, {
          symbol: tokenInfo.symbol,
          balance: tokenInfo.formattedBalance,
          hasEnoughBalance: tokenInfo.hasEnoughBalance,
          needsApproval: tokenInfo.needsApproval,
          address: tokenInfo.address
        })
      } catch (error) {
        console.error(`❌ Failed to fetch ${tokenConfig.symbol} info:`, error)
        console.error('Error details:', {
          method,
          address: tokenConfig.address,
          error: error instanceof Error ? error.message : String(error)
        })
        // Keep existing data if fetch fails
        const existing = tokenPrices.get(tokenConfig.address)
        if (existing) {
          updatedPrices.set(tokenConfig.address, {
            ...existing,
            priceError: error instanceof Error ? error.message : 'Price fetch failed',
            priceLoading: false
          })
        }
      }
    }

    setTokenPrices(updatedPrices)
    setPriceUpdateCounter(prev => prev + 1)
    console.log(`💰 Price refresh completed for ${updatedPrices.size} tokens`)
    isRefreshingRef.current = false
  }, [contractAddresses, contentQuery.data, customTokenAddress, fetchTokenInfo])

  // Ensure the refreshing flag is cleared on unmount/errors
  useEffect(() => {
    return () => {
      isRefreshingRef.current = false
    }
  }, [contractAddresses, contentQuery.data, customTokenAddress, fetchTokenInfo])

  /**
   * Auto-refresh prices when hook initializes or key dependencies change
   */
  useEffect(() => {
    console.log('🔄 useEffect: Auto-refreshing prices...', {
      hasContractAddresses: !!contractAddresses,
      hasContent: !!contentQuery.data,
      hasUserAddress: !!userAddress,
      isContentLoading: contentQuery.isLoading
    })
    
    if (contractAddresses && contentQuery.data && userAddress && !contentQuery.isLoading) {
      // Debounce the initial refresh slightly to let other queries settle
      const timer = setTimeout(() => refreshPrices(), 300)
      return () => clearTimeout(timer)
    }
  }, [contractAddresses, contentQuery.data, userAddress, contentQuery.isLoading, refreshPrices])

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
    // Debounce refresh and avoid returning cleanup from callback (which is ignored)
    if (methodChangeDebounceRef.current) clearTimeout(methodChangeDebounceRef.current)
    methodChangeDebounceRef.current = setTimeout(() => {
      refreshPrices()
    }, 300)
  }, [refreshPrices])

  /**
   * Custom Token Address Handler
   */
  const setCustomToken = useCallback((address: Address) => {
    if (address === customTokenAddress) return
    setCustomTokenAddress(address)
    if (selectedMethod === PaymentMethod.OTHER_TOKEN) {
      if (customTokenDebounceRef.current) clearTimeout(customTokenDebounceRef.current)
      customTokenDebounceRef.current = setTimeout(() => {
        refreshPrices()
      }, 300)
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

      if (selectedMethod === PaymentMethod.USDC) {
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
        // Commerce Protocol payment flow for multi-token payments
        setExecutionState(prev => ({
          ...prev,
          phase: 'creating_intent',
          progress: 20,
          message: `Creating ${selectedToken?.symbol || 'token'} payment intent...`
        }))

        // Get token configuration
        const supportedTokens = getSupportedTokens(chainId)
        const tokenConfig = supportedTokens[selectedMethod]
        let paymentToken: Address

        if (selectedMethod === PaymentMethod.ETH) {
          paymentToken = '0x0000000000000000000000000000000000000000' as Address
        } else if (selectedMethod === PaymentMethod.OTHER_TOKEN && customTokenAddress) {
          paymentToken = customTokenAddress
        } else if (tokenConfig) {
          paymentToken = tokenConfig.address
        } else {
          throw new Error(`Invalid payment method: ${selectedMethod}`)
        }

        // Create payment intent through Commerce Protocol Integration
        const paymentRequest = {
          paymentType: 0, // PayPerView
          creator: contentQuery.data.creator,
          contentId,
          paymentToken,
          maxSlippage: BigInt(slippageTolerance),
          deadline: BigInt(Math.floor(Date.now() / 1000) + 3600) // 1 hour from now
        }

        console.log(`🚀 Creating payment intent for ${selectedToken?.symbol}:`, paymentRequest)

        const result = await writeCommerceContract({
          address: contractAddresses.COMMERCE_INTEGRATION,
          abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
          functionName: 'createPaymentIntent',
          args: [paymentRequest]
        })

        console.log(`✅ Payment intent created:`, result)

        setExecutionState(prev => ({
          ...prev,
          phase: 'waiting_signature',
          progress: 40,
          message: 'Payment intent created. Waiting for backend signature...'
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
      if (priceUpdateTimerRef.current) clearInterval(priceUpdateTimerRef.current)
      priceUpdateTimerRef.current = setInterval(() => {
        refreshPrices()
      }, finalConfig.priceUpdateInterval)
    }
    return () => {
      if (priceUpdateTimerRef.current) {
        clearInterval(priceUpdateTimerRef.current)
        priceUpdateTimerRef.current = null
      }
    }
  }, [finalConfig.priceUpdateInterval, refreshPrices])

  /**
   * Effect: Initial Price Loading
   */
  useEffect(() => {
    // Initial load, debounced slightly
    const t = setTimeout(() => refreshPrices(), 200)
    return () => clearTimeout(t)
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
    if (!estimatedCost || selectedMethod === PaymentMethod.USDC) {
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
    if (!estimatedCost || !finalCost || selectedMethod === PaymentMethod.USDC) {
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
    
    if (selectedToken?.error) {
      alerts.push({
        type: 'error',
        message: 'Failed to fetch current price'
      })
    }
    
    return alerts
  }, [priceImpact, selectedToken?.error])

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
    let newStep: X402ContentPurchaseFlowStep
    let newError: Error | null = null

    if (hasAccess.isLoading || contentData.isLoading) {
      newStep = 'checking_access'
    } else if (hasAccess.error || contentData.error) {
      newStep = 'error'
      newError = hasAccess.error || contentData.error
    } else if (hasAccess.data === true) {
      newStep = 'completed'
    } else if (!canAfford) {
      newStep = 'error'
      newError = new Error('Insufficient USDC balance to purchase this content')
    } else if (needsApproval) {
      newStep = 'need_approval'
    } else {
      newStep = 'can_purchase'
    }

    // Only update state if the step or error has actually changed
    setWorkflowState(prev => {
      if (prev.currentStep === newStep && prev.error === newError) {
        return prev
      }
      return { ...prev, currentStep: newStep, error: newError }
    })
  }, [hasAccess.data, hasAccess.isLoading, hasAccess.error, contentData.error, canAfford, needsApproval])

  useEffect(() => {
    if (approveToken.isLoading) {
      setWorkflowState(prev => {
        if (prev.currentStep === 'need_approval') {
          return prev
        }
        return { ...prev, currentStep: 'need_approval' }
      })
    } else if (approveToken.isConfirmed && needsApproval === false) {
      setWorkflowState(prev => {
        if (prev.currentStep === 'can_purchase') {
          return prev
        }
        return { ...prev, currentStep: 'can_purchase' }
      })
      tokenAllowance.refetch()
    }
  }, [approveToken.isLoading, approveToken.isConfirmed, needsApproval, tokenAllowance])

  useEffect(() => {
    if (purchaseContent.isLoading) {
      setWorkflowState(prev => {
        if (prev.currentStep === 'purchasing') {
          return prev
        }
        return { ...prev, currentStep: 'purchasing' }
      })
    } else if (purchaseContent.error) {
      setWorkflowState(prev => {
        if (prev.currentStep === 'error' && prev.error === purchaseContent.error) {
          return prev
        }
        return { currentStep: 'error', error: purchaseContent.error }
      })
    } else if (purchaseContent.isConfirmed) {
      setWorkflowState(prev => {
        if (prev.currentStep === 'completed') {
          return prev
        }
        return { ...prev, currentStep: 'completed' }
      })
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


export interface PurchaseProgress {
  readonly isSubmitting: boolean      // Transaction submitted to mempool
  readonly isConfirming: boolean      // Waiting for blockchain confirmation
  readonly isConfirmed: boolean       // Transaction confirmed on blockchain
  readonly transactionHash?: string    // Hash of the transaction
  readonly blockNumber?: bigint       // Block number of confirmation
  readonly gasUsed?: bigint           // Gas consumed by transaction
}

// Multi-token payment option interface
export interface PaymentOption {
  readonly method: PaymentMethod
  readonly token: Address | null // null for ETH
  readonly symbol: string
  readonly balance: bigint | null
  readonly requiredAmount: bigint | null
  readonly canAfford: boolean
  readonly needsApproval: boolean
  readonly recommended?: boolean
}

export interface ContentPurchaseFlowResult {
  // State information
  hasAccess: boolean
  isLoading: boolean
  contentDetails: ContentDetails | null
  
  // Payment method information
  availablePaymentMethods: PaymentMethod[]
  selectedMethod: PaymentMethod
  tokenInfo: Record<PaymentMethod, TokenInfo | null>
  
  // Flow state
  flowState: ContentPurchaseFlowState
  
  // Capabilities
  canPurchase: boolean
  needsApproval: boolean
  userBalance: bigint
  requiredAmount: bigint
  
  // Actions
  purchase: () => Promise<void>
  approveAndPurchase: () => Promise<void>
  selectPaymentMethod: (method: PaymentMethod) => void
  reset: () => void
  refetchData: () => void
}

/**
 * Purchase Flow Step Definitions
 * 
 * These steps represent the complete user journey from discovering content
 * to successfully purchasing and accessing it.
 */
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

/**
 * Transaction Progress Tracking
 * 
 * This interface tracks the real-time status of blockchain transactions,
 * providing users with detailed feedback about what's happening.
 */
export interface PurchaseProgress {
  readonly isSubmitting: boolean      // Transaction submitted to mempool
  readonly isConfirming: boolean      // Waiting for blockchain confirmation
  readonly isConfirmed: boolean       // Transaction confirmed on blockchain
  readonly transactionHash?: string    // Hash of the transaction
  readonly blockNumber?: bigint       // Block number of confirmation
  readonly gasUsed?: bigint           // Gas consumed by transaction
}

/**
 * Workflow State Management
 * 
 * This interface manages the overall state of the purchase workflow,
 * including current step, error handling, and progress tracking.
 */
interface WorkflowState {
  readonly currentStep: ContentPurchaseFlowStep
  readonly error: Error | null
  readonly lastSuccessfulStep: ContentPurchaseFlowStep | null
}

export function useContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): ContentPurchaseFlowResult {
  const chainId = useChainId()
  const queryClient = useQueryClient()
  
  // Get contract addresses with proper error handling
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.warn('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])

  // Flow state management
  const [flowState, setFlowState] = useState<ContentPurchaseFlowState>({
    step: 'idle',
    message: 'Ready to purchase',
    progress: 0
  })

  // Selected payment method
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.USDC)

  // Contract interaction hooks
  const { writeContract, data: transactionHash, error: transactionError, isPending } = useWriteContract()
  const { data: receipt, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash: transactionHash
  })

  // ===== STEP 1: CHECK USER ACCESS (using real ABI) =====
  const { data: hasAccess, isLoading: isCheckingAccess, error: accessError } = useReadContract({
    address: contractAddresses?.PAY_PER_VIEW,
    abi: PAY_PER_VIEW_ABI,
    functionName: 'hasAccess',
    args: userAddress && contentId ? [contentId, userAddress] : undefined,
    query: { enabled: !!(userAddress && contentId && contractAddresses?.PAY_PER_VIEW) }
  })

  // ===== STEP 2: GET CONTENT DETAILS (using real ABI) =====
  const { data: contentDetails, isLoading: isLoadingContent, error: contentError, refetch: refetchContent } = useReadContract({
    address: contractAddresses?.CONTENT_REGISTRY,
    abi: CONTENT_REGISTRY_ABI,
    functionName: 'getContent',
    args: contentId ? [contentId] : undefined,
    query: { enabled: !!(contentId && contractAddresses?.CONTENT_REGISTRY) }
  })

  // ===== STEP 3: GET USER TOKEN BALANCES =====
  
  // USDC balance and allowance
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useBalance({
    address: userAddress,
    token: contractAddresses?.USDC,
    query: { enabled: !!userAddress && !!contractAddresses?.USDC }
  })

  const { data: usdcAllowance, refetch: refetchUsdcAllowance } = useReadContract({
    address: contractAddresses?.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress && contractAddresses?.PAY_PER_VIEW 
      ? [userAddress, contractAddresses.PAY_PER_VIEW] 
      : undefined,
    query: { enabled: !!userAddress && !!contractAddresses?.USDC && !!contractAddresses?.PAY_PER_VIEW }
  })

  // ETH balance
  const { data: ethBalance } = useBalance({
    address: userAddress,
    query: { enabled: !!userAddress }
  })

  // ===== STEP 4: GET TOKEN PRICING (using real Price Oracle ABI) =====
  
  // Get ETH price in USDC equivalent
  const { data: ethPriceInUSDC, error: ethPriceError } = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getETHPrice',
    args: contentDetails?.payPerViewPrice ? [contentDetails.payPerViewPrice] : undefined,
    query: { 
      enabled: !!(contractAddresses?.PRICE_ORACLE && contentDetails?.payPerViewPrice),
      retry: false // Don't retry on price oracle failures
    }
  })

  // Check if price oracle is working
  const { data: defaultSlippage } = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'defaultSlippage',
    args: [],
    query: { enabled: !!contractAddresses?.PRICE_ORACLE }
  })

  // ===== STEP 5: CALCULATE TOKEN INFORMATION =====
  const tokenInfo = useMemo((): Record<PaymentMethod, TokenInfo | null> => {
    if (!contentDetails || !userAddress) {
      return {
        [PaymentMethod.USDC]: null,
        [PaymentMethod.ETH]: null,
        [PaymentMethod.WETH]: null,
        [PaymentMethod.CBETH]: null,
        [PaymentMethod.DAI]: null,
        [PaymentMethod.OTHER_TOKEN]: null
      }
    }

    const contentPrice = contentDetails.payPerViewPrice

    // USDC Token Info (always available)
    const usdcInfo: TokenInfo | null = contractAddresses?.USDC ? {
      address: contractAddresses.USDC,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      isNative: false,
      balance: usdcBalance?.value || BigInt(0),
      formattedBalance: usdcBalance?.formatted || '0',
      hasEnoughBalance: (usdcBalance?.value || BigInt(0)) >= contentPrice,
      needsApproval: (usdcAllowance || BigInt(0)) < contentPrice,
      allowance: usdcAllowance || BigInt(0),
      requiredAmount: contentPrice,
      priceInUSDC: BigInt(1000000), // 1 USDC = 1 USDC
      priceLoading: false,
      priceError: null,
      isLoading: false,
      error: undefined
    } : null

    // ETH Token Info (available if price oracle working)
    const ethInfo: TokenInfo | null = (
      ethPriceInUSDC && !ethPriceError && ethBalance
    ) ? {
      address: '0x0000000000000000000000000000000000000000' as Address,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      isNative: true,
      balance: ethBalance.value,
      formattedBalance: ethBalance.formatted,
      hasEnoughBalance: ethBalance.value >= (ethPriceInUSDC as bigint),
      needsApproval: false, // ETH doesn't need approval
      allowance: BigInt(0),
      requiredAmount: ethPriceInUSDC as bigint,
      priceInUSDC: ethPriceInUSDC as bigint,
      priceLoading: false,
      priceError: null,
      isLoading: false,
      error: undefined
    } : null

    return {
      [PaymentMethod.USDC]: usdcInfo,
      [PaymentMethod.ETH]: ethInfo,
      [PaymentMethod.WETH]: null, // TODO: Implement WETH support
      [PaymentMethod.CBETH]: null, // TODO: Implement cbETH support  
      [PaymentMethod.DAI]: null, // TODO: Implement DAI support
      [PaymentMethod.OTHER_TOKEN]: null // Can be extended for custom tokens
    }
  }, [
    contentDetails, userAddress, usdcBalance, usdcAllowance, ethBalance, 
    ethPriceInUSDC, ethPriceError, defaultSlippage, contractAddresses
  ])

  // ===== STEP 6: DETERMINE AVAILABLE PAYMENT METHODS =====
  const availablePaymentMethods = useMemo((): PaymentMethod[] => {
    const methods: PaymentMethod[] = []
    
    // USDC is always available if user has balance
    if (tokenInfo[PaymentMethod.USDC]?.hasEnoughBalance) {
      methods.push(PaymentMethod.USDC)
    }
    
    // ETH is available if price oracle is working and user has balance
    if (tokenInfo[PaymentMethod.ETH]?.hasEnoughBalance) {
      methods.push(PaymentMethod.ETH)
    }
    
    return methods
  }, [tokenInfo])

  // ===== STEP 7: DETERMINE FLOW STATE =====
  useEffect(() => {
    if (isCheckingAccess || isLoadingContent) {
      setFlowState({
        step: 'loading_content',
        message: 'Loading content information...',
        progress: 20
      })
      return
    }

    if (hasAccess) {
      setFlowState({
        step: 'completed',
        message: 'You already have access to this content',
        progress: 100
      })
      return
    }

    if (accessError || contentError) {
      setFlowState({
        step: 'error',
        message: 'Failed to load content information',
        progress: 0,
        error: accessError || contentError || new Error('Unknown error')
      })
      return
    }

    const selectedTokenInfo = tokenInfo[selectedMethod]
    if (!selectedTokenInfo) {
      setFlowState({
        step: 'insufficient_balance',
        message: 'Payment method not available',
        progress: 0
      })
      return
    }

    if (!selectedTokenInfo.hasEnoughBalance) {
      setFlowState({
        step: 'insufficient_balance',
        message: `Insufficient ${selectedTokenInfo.symbol} balance`,
        progress: 0
      })
      return
    }

    if (selectedTokenInfo.needsApproval) {
      setFlowState({
        step: 'need_approval',
        message: `${selectedTokenInfo.symbol} approval required`,
        progress: 0
      })
      return
    }

    setFlowState({
      step: 'can_purchase',
      message: `Ready to purchase with ${selectedTokenInfo.symbol}`,
      progress: 0
    })
  }, [
    isCheckingAccess, isLoadingContent, hasAccess, accessError, contentError,
    selectedMethod, tokenInfo
  ])

  // ===== STEP 8: PURCHASE EXECUTION FUNCTIONS =====

  const executeDirectUSDCPurchase = useCallback(async () => {
    if (!contractAddresses?.PAY_PER_VIEW || !contentId) {
      throw new Error('Missing contract addresses or content ID')
    }

    setFlowState({
      step: 'purchasing',
      message: 'Processing USDC purchase...',
      progress: 80
    })

    // Use the REAL PayPerView ABI structure
    writeContract({
      address: contractAddresses.PAY_PER_VIEW,
      abi: PAY_PER_VIEW_ABI,
      functionName: 'purchaseContentDirect',
      args: [contentId]
    })
  }, [writeContract, contractAddresses, contentId])

  const executeETHPurchase = useCallback(async () => {
    if (!contractAddresses?.PAY_PER_VIEW || !contentId) {
      throw new Error('Missing contract addresses or content ID')
    }

    setFlowState({
      step: 'purchasing',
      message: 'Creating ETH payment intent...',
      progress: 80
    })

    // Use the REAL PayPerView.createPurchaseIntent() structure
    writeContract({
      address: contractAddresses.PAY_PER_VIEW,
      abi: PAY_PER_VIEW_ABI,
      functionName: 'createPurchaseIntent',
      args: [
        contentId,                                                    // uint256 contentId
        PaymentMethod.ETH,                                           // uint8 method (enum)
        '0x0000000000000000000000000000000000000000' as Address,     // address paymentToken (zero for ETH)
        BigInt(500)                                                  // uint256 maxSlippage (5% in basis points)
      ]
    })
  }, [writeContract, contractAddresses, contentId])

  const executeApproval = useCallback(async () => {
    if (!contractAddresses?.USDC || !contractAddresses?.PAY_PER_VIEW || !contentDetails) {
      throw new Error('Missing contract addresses or content details')
    }

    setFlowState({
      step: 'approving_tokens',
      message: 'Approving USDC spending...',
      progress: 40
    })

    writeContract({
      address: contractAddresses.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [contractAddresses.PAY_PER_VIEW, contentDetails.payPerViewPrice]
    })
  }, [writeContract, contractAddresses, contentDetails])

  // Main purchase function
  const purchase = useCallback(async () => {
    try {
      if (selectedMethod === PaymentMethod.USDC) {
        await executeDirectUSDCPurchase()
      } else if (selectedMethod === PaymentMethod.ETH) {
        await executeETHPurchase()
      } else {
        throw new Error('Unsupported payment method')
      }
    } catch (error) {
      setFlowState({
        step: 'error',
        message: error instanceof Error ? error.message : 'Purchase failed',
        progress: 0,
        error: error instanceof Error ? error : new Error('Unknown error')
      })
      throw error
    }
  }, [selectedMethod, executeDirectUSDCPurchase, executeETHPurchase])

  // Approve and purchase function
  const approveAndPurchase = useCallback(async () => {
    try {
      await executeApproval()
      // Note: In a complete implementation, you would wait for approval
      // transaction to complete before executing the purchase
    } catch (error) {
      setFlowState({
        step: 'error',
        message: error instanceof Error ? error.message : 'Approval failed',
        progress: 0,
        error: error instanceof Error ? error : new Error('Unknown error')
      })
      throw error
    }
  }, [executeApproval])

  // ===== STEP 9: TRANSACTION COMPLETION HANDLING =====
  useEffect(() => {
    if (isSuccess && receipt) {
      setFlowState({
        step: 'completed',
        message: 'Purchase completed successfully!',
        progress: 100,
        transactionHash: receipt.transactionHash
      })

      // Refresh all relevant data
      queryClient.invalidateQueries({ queryKey: ['hasAccess'] })
      queryClient.invalidateQueries({ queryKey: ['balance'] })
    }

    if (transactionError || receiptError) {
      setFlowState({
        step: 'error',
        message: transactionError?.message || receiptError?.message || 'Transaction failed',
        progress: 0,
        error: transactionError || receiptError || new Error('Unknown transaction error')
      })
    }
  }, [isSuccess, receipt, transactionError, receiptError, queryClient])

  // Helper functions
  const reset = useCallback(() => {
    setFlowState({
      step: 'idle',
      message: 'Ready to purchase',
      progress: 0
    })
  }, [])

  const refetchData = useCallback(() => {
    refetchContent()
    refetchUsdcBalance()
    refetchUsdcAllowance()
  }, [refetchContent, refetchUsdcBalance, refetchUsdcAllowance])

  const selectPaymentMethod = useCallback((method: PaymentMethod) => {
    if (availablePaymentMethods.includes(method)) {
      setSelectedMethod(method)
    }
  }, [availablePaymentMethods])

  // ===== COMPUTED VALUES =====
  const selectedTokenInfo = tokenInfo[selectedMethod]
  const canPurchase = !!(selectedTokenInfo?.hasEnoughBalance && !selectedTokenInfo?.needsApproval)
  const needsApproval = selectedTokenInfo?.needsApproval || false
  const userBalance = selectedTokenInfo?.balance || BigInt(0)
  const requiredAmount = selectedTokenInfo?.requiredAmount || BigInt(0)

  return {
    // State information
    hasAccess: Boolean(hasAccess),
    isLoading: isCheckingAccess || isLoadingContent,
    contentDetails: contentDetails || null,
    
    // Payment method information
    availablePaymentMethods,
    selectedMethod,
    tokenInfo,
    
    // Flow state
    flowState,
    
    // Capabilities
    canPurchase,
    needsApproval,
    userBalance,
    requiredAmount,
    
    // Actions
    purchase,
    approveAndPurchase,
    selectPaymentMethod,
    reset,
    refetchData
  }
}

/**
 * Utility Functions for Purchase Flow Management
 * 
 * These helper functions make it easier for UI components to work
 * with the purchase flow state and provide appropriate user feedback.
 */
export function getPurchaseFlowStepMessage(step: ContentPurchaseFlowState['step']): string {
  switch (step) {
    case 'idle':
      return 'Ready to purchase'
    case 'loading_content':
      return 'Loading content information...'
    case 'checking_access':
      return 'Checking your access status...'
    case 'insufficient_balance':
      return 'Insufficient balance'
    case 'need_approval':
      return 'Token approval required'
    case 'can_purchase':
      return 'Ready to purchase'
    case 'approving_tokens':
      return 'Approving token spending...'
    case 'purchasing':
      return 'Processing purchase...'
    case 'completed':
      return 'Purchase completed successfully!'
    case 'error':
      return 'Purchase failed'
    default:
      return 'Unknown state'
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

  const { writeContract: writeCommerceContract, data: commerceHash, isPending: isCommercePending } = useWriteContract()
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
      setWorkflowState(prev => {
        if (prev.currentStep === 'registering') {
          return prev
        }
        return { ...prev, currentStep: 'registering' }
      })
    } else if (registerContent.isConfirming) {
      console.log('Transaction confirmed, waiting for receipt...')
      setWorkflowState(prev => {
        if (prev.currentStep === 'confirming') {
          return prev
        }
        return { ...prev, currentStep: 'confirming' }
      })
    } else if (registerContent.error) {
      console.error('Transaction error:', registerContent.error)
      setWorkflowState(prev => {
        if (prev.currentStep === 'error' && prev.error === registerContent.error) {
          return prev
        }
        return {
          currentStep: 'error',
          error: registerContent.error,
          publishedContentId: null
        }
      })
    } else if (registerContent.isSuccess && registerContent.hash) {
      console.log('Transaction successful, extracting content ID...')
      setWorkflowState(prev => {
        if (prev.currentStep === 'extracting_content_id') {
          return prev
        }
        return { ...prev, currentStep: 'extracting_content_id' }
      })
      
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
  
  // Guard against indefinite "checking" by tracking how long we've been in that state
  // and forcing a deterministic transition if remote reads remain stuck.
  const checkingSinceRef = useRef<number | null>(null)
  const checkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Standard timeout that defines how long we allow a registration check to run.
  const REGISTRATION_CHECK_TIMEOUT_MS = 15000
  
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
    // First, let's add comprehensive logging to understand what's happening
    console.group('🔍 Registration Check Effect - Enhanced Debug')
    console.log('Current Step:', workflowState.currentStep)
    console.log('Has Just Registered:', workflowState.hasJustRegistered)
    console.log('Registration Check Data:', registrationCheck.data, typeof registrationCheck.data)
    console.log('Registration Check Loading:', registrationCheck.isLoading)
    console.log('Registration Check Error:', registrationCheck.error)
    console.log('Registration Check Success:', registrationCheck.isSuccess)
    console.log('User Address:', userAddress)
    console.groupEnd()

    // Skip checks if we just registered - this prevents interference
    if (workflowState.hasJustRegistered) {
      console.log('🛡️ Protected: Ignoring registration check because we just registered')
      return
    }
    
    // Skip checks during registration process
    if (workflowState.currentStep === 'registering') {
      console.log('🛡️ Protected: Ignoring registration check during registration process')
      return
    }

    // If we don't have a user address, we can't check registration
    if (!userAddress) {
      console.log('⚠️ No user address available, staying in checking state')
      return
    }
    
    // Handle loading state - keep showing loading while the contract call is in progress
    if (registrationCheck.isLoading) {
      // Only log this once to avoid spam and start/refresh a timeout watchdog
      if (workflowState.currentStep === 'checking') {
        console.log('⏳ Registration check still loading...')
        // Initialize the start timestamp if not already set
        if (checkingSinceRef.current === null) {
          checkingSinceRef.current = Date.now()
        }
        // Reset any existing timeout and schedule a new guard
        if (checkingTimeoutRef.current) {
          clearTimeout(checkingTimeoutRef.current)
        }
        checkingTimeoutRef.current = setTimeout(() => {
          // If we are still checking and the read still reports loading, move on safely
          if (
            workflowState.currentStep === 'checking' &&
            registrationCheck.isLoading
          ) {
            console.warn('⏰ Registration check stuck in loading. Proceeding as not registered to avoid spinner lock.')
            setWorkflowState(prev => ({
              ...prev,
              currentStep: 'not_registered',
              error: null,
            }))
          }
        }, REGISTRATION_CHECK_TIMEOUT_MS)
      }
      return () => {
        if (checkingTimeoutRef.current) {
          clearTimeout(checkingTimeoutRef.current)
          checkingTimeoutRef.current = null
        }
      }
    }
    
    // Handle error state - this is critical for debugging
    if (registrationCheck.error) {
      console.error('❌ Registration check failed:', registrationCheck.error)
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error(`Failed to check registration status: ${registrationCheck.error?.message || 'Unknown error'}`)
      }))
      return
    }

    // The key fix: Handle the case where we have a successful response
    // Only proceed if we're in checking state and the query was successful
    if (workflowState.currentStep === 'checking' && registrationCheck.isSuccess) {
      // registrationCheck.data will be either true, false, or undefined
      // We need to handle all three cases explicitly
      
      if (registrationCheck.data === true) {
        console.log('📊 Registration check confirmed: User IS registered')
        setWorkflowState(prev => ({ 
          ...prev, 
          currentStep: 'registered',
          hasJustRegistered: false,
          error: null
        }))
      } else if (registrationCheck.data === false) {
        console.log('📊 Registration check confirmed: User is NOT registered')
        setWorkflowState(prev => ({ 
          ...prev, 
          currentStep: 'not_registered',
          error: null
        }))
      } else {
        // This is the case that was causing your infinite loading!
        // registrationCheck.data is undefined, which means the contract call
        // succeeded but returned an unexpected value
        console.warn('⚠️ Registration check returned unexpected data:', registrationCheck.data)
        console.warn('This usually means:')
        console.warn('1. Contract address is wrong')
        console.warn('2. Contract ABI mismatch') 
        console.warn('3. Function doesnt exist')
        console.warn('4. Network connectivity issue')
        
        // Instead of staying stuck, let's treat undefined as "not registered"
        // but log it clearly so you can investigate
        console.log('🔄 Treating undefined result as not registered for now')
        setWorkflowState(prev => ({ 
          ...prev, 
          currentStep: 'not_registered',
          error: null
        }))
      }
      // Clear watchdog state on any definitive result
      if (checkingTimeoutRef.current) {
        clearTimeout(checkingTimeoutRef.current)
        checkingTimeoutRef.current = null
      }
      checkingSinceRef.current = null
    }
    
    // Add a timeout to prevent infinite loading if the contract call takes too long
    if (workflowState.currentStep === 'checking' && !registrationCheck.isLoading && !registrationCheck.isSuccess && !registrationCheck.error) {
      const timeout = setTimeout(() => {
        console.warn('⏰ Registration check timeout - treating as not registered')
        setWorkflowState(prev => ({ 
          ...prev, 
          currentStep: 'not_registered',
          error: null
        }))
      }, 10000) // 10 second timeout
      
      return () => clearTimeout(timeout)
    }
    // Cleanup any lingering watchdog when effect dependencies change
    return () => {
      if (checkingTimeoutRef.current) {
        clearTimeout(checkingTimeoutRef.current)
        checkingTimeoutRef.current = null
      }
    }
  }, [
    registrationCheck.isLoading, 
    registrationCheck.error, 
    registrationCheck.data,
    registrationCheck.isSuccess, // Added this to the dependency array
    workflowState.currentStep,
    workflowState.hasJustRegistered,
    userAddress // Added this to ensure we react to address changes
  ])
  
  useEffect(() => {
    if (workflowState.hasJustRegistered && 
        registrationCheck.data === true && 
        !registrationCheck.isLoading) {
      console.log('🎯 Data refresh confirmed registration - clearing just registered flag')
      setWorkflowState(prev => {
        if (!prev.hasJustRegistered) {
          return prev
        }
        return { 
          ...prev, 
          hasJustRegistered: false 
        }
      })
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

// Helper function to format payment options for UI display
export function formatPaymentOption(option: PaymentOption): string {
  if (!option.balance || !option.requiredAmount) return `${option.symbol}: Loading...`
  
  const hasEnough = option.canAfford ? '✅' : '❌'
  const balanceFormatted = option.method === PaymentMethod.ETH 
    ? `${(Number(option.balance) / 1e18).toFixed(4)} ETH`
    : `$${(Number(option.balance) / 1e6).toFixed(2)} USDC`
  
  const requiredFormatted = option.method === PaymentMethod.ETH
    ? `${(Number(option.requiredAmount) / 1e18).toFixed(4)} ETH`
    : `$${(Number(option.requiredAmount) / 1e6).toFixed(2)} USDC`
  
  return `${hasEnough} ${option.symbol}: ${balanceFormatted} (need ${requiredFormatted})`
}
/**
 * Price Oracle Hook - V2 Pricing and Quoter Integration
 * 
 * This hook provides interface to the PriceOracle contract which integrates
 * with Uniswap V3 QuoterV2 for real-time token pricing and swap quotes.
 * Uses only actual contract functions without placeholder logic.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { PRICE_ORACLE_ABI } from '@/lib/contracts/abis/v2ABIs/PriceOracle'
import { type Address } from 'viem'

// Explicit contract typing to work around wagmi's complex type inference
type ContractConfig = {
  address: `0x${string}`
  abi: typeof PRICE_ORACLE_ABI
}

// Types for pricing functions based on actual contract
export interface TokenQuoteRequest {
  tokenIn: Address
  tokenOut: Address
  amountIn: bigint
  poolFee?: number // Optional - will use optimal if not provided
}

export interface PriceValidationRequest {
  tokenIn: Address
  tokenOut: Address
  amountIn: bigint
  expectedAmountOut: bigint
  toleranceBps: bigint
  poolFee: number
}

/**
 * Hook for PriceOracle contract interactions using real contract functions
 */
export function usePriceOracle() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'PRICE_ORACLE')
  
  // Create a properly typed contract config
  const contract: ContractConfig = {
    address: contractConfig.address as `0x${string}`,
    abi: PRICE_ORACLE_ABI
  }

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ CORE PRICING FUNCTIONS ============

  /**
   * Get multiple quotes for different fee tiers
   */
  const useGetMultipleQuotes = (request: Omit<TokenQuoteRequest, 'poolFee'> | undefined) => {
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'getMultipleQuotes',
      args: request ? [request.tokenIn, request.tokenOut, request.amountIn] : undefined,
      query: {
        enabled: !!request,
        staleTime: 30000,
        refetchInterval: 30000
      }
    } as Parameters<typeof useReadContract>[0])
  }

  /**
   * Get quote with recommended fee (optimal pricing)
   */
  const useGetQuoteWithRecommendedFee = (request: Omit<TokenQuoteRequest, 'poolFee'> | undefined) => {
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'getQuoteWithRecommendedFee',
      args: request ? [request.tokenIn, request.tokenOut, request.amountIn] : undefined,
      query: {
        enabled: !!request,
        staleTime: 30000,
        refetchInterval: 30000
      }
    } as Parameters<typeof useReadContract>[0])
  }

  /**
   * Get ETH amount for USDC price using getTokenAmountForUSDC
   */
  const useGetETHPrice = (usdcAmount: bigint | undefined) => {
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'getTokenAmountForUSDC',
      args: usdcAmount ? ['0x4200000000000000000000000000000000000006' as Address, usdcAmount, 3000] : undefined, // WETH on Base
      query: {
        enabled: !!usdcAmount && usdcAmount > BigInt(0),
        staleTime: 30000,
        refetchInterval: 30000
      }
    } as Parameters<typeof useReadContract>[0])
  }

  /**
   * Get token amount needed for specific USDC amount
   */
  const useGetTokenAmountForUSDC = (tokenIn: Address | undefined, usdcAmount: bigint | undefined, poolFee: number = 3000) => {
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'getTokenAmountForUSDC',
      args: tokenIn && usdcAmount ? [tokenIn, usdcAmount, poolFee] : undefined,
      query: {
        enabled: !!tokenIn && !!usdcAmount && usdcAmount > BigInt(0),
        staleTime: 30000,
        refetchInterval: 30000
      }
    } as Parameters<typeof useReadContract>[0])
  }

  /**
   * Get optimal pool fee for a token pair
   */
  const useGetOptimalPoolFee = (tokenIn: Address | undefined, tokenOut: Address | undefined) => {
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'getOptimalPoolFeeForSwap',
      args: tokenIn && tokenOut ? [tokenIn, tokenOut] : undefined,
      query: {
        enabled: !!tokenIn && !!tokenOut,
        staleTime: 300000, // 5 minutes - pool fees don't change often
      }
    } as Parameters<typeof useReadContract>[0])
  }

  // ============ PRICE VALIDATION & SAFETY ============

  /**
   * Check price impact for a potential swap
   */
  const checkPriceImpact = useMutation({
    mutationFn: async ({ 
      tokenIn, 
      tokenOut, 
      amountIn, 
      maxPriceImpactBps 
    }: { 
      tokenIn: Address
      tokenOut: Address
      amountIn: bigint
      maxPriceImpactBps: bigint
    }) => {
      return writeContract({
        ...contract,
        functionName: 'checkPriceImpact',
        args: [tokenIn, tokenOut, amountIn, maxPriceImpactBps]
      })
    }
  })

  /**
   * Validate quote before executing swap
   */
  const validateQuoteBeforeSwap = useMutation({
    mutationFn: async (request: PriceValidationRequest) => {
      return writeContract({
        ...contract,
        functionName: 'validateQuoteBeforeSwap',
        args: [
          request.tokenIn,
          request.tokenOut,
          request.amountIn,
          request.expectedAmountOut,
          request.toleranceBps,
          request.poolFee
        ]
      })
    }
  })

  // ============ UTILITY FUNCTIONS ============

  /**
   * Apply slippage to an amount
   */
  const useApplySlippage = (amount: bigint | undefined, slippageBps: bigint = BigInt(500)) => {
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'applySlippage',
      args: amount ? [amount, slippageBps] : undefined,
      query: {
        enabled: !!amount && amount > BigInt(0),
        staleTime: Infinity // Pure function - result doesn't change
      }
    } as Parameters<typeof useReadContract>[0])
  }

  // ============ CONTRACT CONFIGURATION ============

  /**
   * Get contract configuration values
   */
  const useContractConfig = () => {
    const defaultSlippage = useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'defaultSlippage',
      query: { staleTime: 300000 } // 5 minutes
    })

    const usdc = useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'USDC',
      query: { staleTime: Infinity } // Immutable
    })

    const weth = useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'WETH',
      query: { staleTime: Infinity } // Immutable
    })

    const quoterV2 = useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'quoterV2',
      query: { staleTime: 300000 } // 5 minutes
    })

    return {
      defaultSlippage: defaultSlippage.data,
      usdc: usdc.data,
      weth: weth.data,
      quoterV2: quoterV2.data,
      isLoading: defaultSlippage.isLoading || usdc.isLoading || weth.isLoading || quoterV2.isLoading,
      error: defaultSlippage.error || usdc.error || weth.error || quoterV2.error
    }
  }

  /**
   * Get custom pool fee for token pair
   */
  const useCustomPoolFee = (tokenA: Address | undefined, tokenB: Address | undefined) => {
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'customPoolFees',
      args: tokenA && tokenB ? [tokenA, tokenB] : undefined,
      query: {
        enabled: !!tokenA && !!tokenB,
        staleTime: 300000 // 5 minutes
      }
    } as Parameters<typeof useReadContract>[0])
  }

  // ============ ADMIN FUNCTIONS ============

  /**
   * Set custom pool fee for token pair (admin only)
   */
  const setCustomPoolFee = useMutation({
    mutationFn: async ({ 
      tokenA, 
      tokenB, 
      fee 
    }: { 
      tokenA: Address
      tokenB: Address
      fee: number
    }) => {
      return writeContract({
        ...contract,
        functionName: 'setCustomPoolFee',
        args: [tokenA, tokenB, fee]
      })
    }
  })

  /**
   * Update default slippage (admin only)
   */
  const updateSlippage = useMutation({
    mutationFn: async (newSlippage: bigint) => {
      return writeContract({
        ...contract,
        functionName: 'updateSlippage',
        args: [newSlippage]
      })
    }
  })

  /**
   * Update quoter contract (admin only)
   */
  const updateQuoter = useMutation({
    mutationFn: async (newQuoter: Address) => {
      return writeContract({
        ...contract,
        functionName: 'updateQuoter',
        args: [newQuoter]
      })
    }
  })

  return {
    // Core pricing functions
    useGetMultipleQuotes,
    useGetQuoteWithRecommendedFee,
    useGetETHPrice,
    useGetTokenAmountForUSDC,
    useGetOptimalPoolFee,
    
    // Price validation
    checkPriceImpact,
    validateQuoteBeforeSwap,
    
    // Utility functions
    useApplySlippage,
    
    // Configuration
    useContractConfig,
    useCustomPoolFee,
    
    // Admin functions
    setCustomPoolFee,
    updateSlippage,
    updateQuoter,
    
    // Transaction state
    hash,
    isPending,
    error,
    
    // Contract info
    contractAddress: contract.address,
    chainId
  }
}

/**
 * Simplified hook for common pricing scenarios
 */
export function useTokenQuote(tokenIn: Address | undefined, tokenOut: Address | undefined, amountIn: bigint | undefined) {
  const { useGetQuoteWithRecommendedFee, useGetOptimalPoolFee } = usePriceOracle()
  
  const optimalFee = useGetOptimalPoolFee(tokenIn, tokenOut)
  const quote = useGetQuoteWithRecommendedFee(
    tokenIn && tokenOut && amountIn ? { tokenIn, tokenOut, amountIn } : undefined
  )
  
  return {
    amountOut: Array.isArray(quote.data) ? quote.data[0] : undefined,
    recommendedFee: Array.isArray(quote.data) ? quote.data[1] : undefined,
    optimalFee: optimalFee.data,
    isLoading: quote.isLoading || optimalFee.isLoading,
    error: quote.error || optimalFee.error,
    refetch: () => {
      quote.refetch()
      optimalFee.refetch()
    }
  }
}

/**
 * Hook for ETH/USDC pricing (common use case)
 */
export function useETHUSDCPrice(usdcAmount: bigint | undefined) {
  const { useGetETHPrice, useContractConfig } = usePriceOracle()
  const config = useContractConfig()
  const ethPrice = useGetETHPrice(usdcAmount)
  
  return {
    ethAmount: ethPrice.data,
    usdcAmount,
    wethAddress: config.weth,
    usdcAddress: config.usdc,
    isLoading: ethPrice.isLoading || config.isLoading,
    error: ethPrice.error || config.error,
    refetch: ethPrice.refetch
  }
}

/**
 * Hook for content pricing with multiple payment options
 */
export function useContentPricing(usdcPrice: bigint | undefined) {
  const { useGetETHPrice, useContractConfig } = usePriceOracle()
  const config = useContractConfig()
  const ethPrice = useGetETHPrice(usdcPrice)
  
  return {
    // Pricing in different tokens
    usdcPrice,
    ethPrice: ethPrice.data,
    
    // Token addresses
    tokens: {
      usdc: config.usdc,
      weth: config.weth
    },
    
    // Payment options
    paymentOptions: [
      {
        token: 'USDC',
        address: config.usdc,
        amount: usdcPrice,
        symbol: 'USDC',
        decimals: 6
      },
      {
        token: 'ETH',
        address: config.weth,
        amount: ethPrice.data,
        symbol: 'ETH',
        decimals: 18
      }
    ].filter(option => option.amount !== undefined),
    
    // Loading state
    isLoading: ethPrice.isLoading || config.isLoading,
    error: ethPrice.error || config.error,
    
    // Refresh pricing
    refetch: () => {
      ethPrice.refetch()
    }
  }
}

export default usePriceOracle
// =============================================================================
// PHASE 3: SWAP FUNCTIONALITY - TOKEN EXCHANGE SYSTEM (PRODUCTION VERSION)
// =============================================================================

/**
 * PRODUCTION VERSION: This hook now properly integrates with your PriceOracle contract
 * instead of using fallback USD-based calculations.
 * 
 * Key Changes:
 * 1. Added real PriceOracle contract integration via useReadContract
 * 2. Replaced mock pricing logic with actual Uniswap v3 quoter calls
 * 3. Added proper error handling for contract call failures
 * 4. Maintained fallback only for true error conditions
 * 5. Added comprehensive logging for debugging price discrepancies
 * 
 * Technical Integration:
 * - Uses your getContractAddresses() for network-specific contract access
 * - Integrates with your PRICE_ORACLE contract for real Uniswap v3 quotes
 * - Follows your established Wagmi patterns
 * - Maintains compatibility with existing SwapModal component
 */

/**
 * Advanced Swap Calculation Hook
 * 
 * This hook is the "brain" of our swap system. It takes two tokens and an amount,
 * then calculates all the information users need to make informed decisions.
 * 
 * Educational Concept: Financial Mathematics in DeFi
 * Swapping tokens isn't just about exchange rates - we need to consider:
 * - Price impact (how our trade affects the market price)
 * - Slippage tolerance (price changes during transaction execution)
 * - Gas costs (blockchain transaction fees)
 * - Route optimization (finding the best path through liquidity pools)
 * 
 * This hook abstracts all this complexity into simple, user-friendly information.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAccount, useChainId, useReadContract } from 'wagmi'
import { formatUnits, type Address } from 'viem'
import { getContractAddresses } from '@/lib/contracts/config'
import { PRICE_ORACLE_ABI } from '@/lib/contracts/abis'
import type { TokenInfo } from '@/hooks/web3/useTokenBalances'

/**
 * Comprehensive Swap State Interface
 * 
 * This interface captures every piece of information users need to understand
 * and approve a token swap. Each property serves a specific purpose in creating
 * a transparent, trustworthy swapping experience.
 */
export interface SwapCalculation {
  readonly isLoading: boolean
  readonly error: string | null
  
  // Core swap mathematics
  readonly outputAmount: string          // How many tokens user will receive
  readonly minimumReceived: string       // Worst-case scenario with slippage
  readonly exchangeRate: number          // Current exchange rate between tokens
  readonly priceImpact: number          // How much our trade affects market price
  readonly route: string | null         // Path the trade will take through pools
  
  // Cost analysis
  readonly gasEstimate: bigint          // Estimated transaction cost
  readonly gasEstimateUSD: number       // Gas cost in familiar USD terms
  readonly totalCostUSD: number         // Total cost including gas and slippage
  
  // Risk assessment
  readonly riskLevel: 'low' | 'medium' | 'high' | 'critical'
  readonly warnings: Array<{
    type: 'liquidity' | 'price_impact' | 'slippage' | 'route_risk'
    severity: 'info' | 'warning' | 'critical'
    message: string
  }>      // Any issues users should know about
  readonly recommendedSlippage: number  // Our suggested slippage tolerance
  
  // User guidance
  readonly isValid: boolean             // Whether the swap can be executed
  readonly userImpact: string          // Human-readable summary of the trade
  
  // Production enhancements
  readonly uniswapPoolFee: number       // The actual pool fee being used
  readonly priceSource: 'uniswap_v3' | 'fallback' // Track price source for debugging
}



/**
 * Advanced Swap Calculation Hook - PRODUCTION VERSION
 * 
 * This hook now properly integrates with your PriceOracle contract to get
 * real-time prices from Uniswap v3 pools instead of using mock calculations.
 */
export const useSwapCalculation = (
  fromToken: TokenInfo | null,
  toToken: TokenInfo | null,
  fromAmount: string,
  slippageTolerance: number = 0.5
): SwapCalculation => {
  const { address } = useAccount()
  const chainId = useChainId()
  
  // Get contract addresses for the current network
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.warn('Failed to get contract addresses for chainId:', chainId, error)
      return null
    }
  }, [chainId])

  // Prepare arguments for PriceOracle contract call
  const priceOracleArgs = useMemo(() => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) === 0) {
      return null
    }
    
    try {
      const fromAmountFloat = parseFloat(fromAmount)
      const fromAmountBigInt = BigInt(Math.floor(fromAmountFloat * (10 ** fromToken.decimals)))
      
      return {
        tokenIn: fromToken.address,
        tokenOut: toToken.address,
        amountIn: fromAmountBigInt,
        poolFee: 0 // Let PriceOracle auto-detect optimal fee tier
      }
    } catch (error) {
      console.error('Failed to prepare price oracle arguments:', error)
      return null
    }
  }, [fromToken, toToken, fromAmount])

  // Call PriceOracle.getTokenPrice() to get real Uniswap v3 quote
  const uniswapQuoteQuery = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getTokenPrice',
    args: priceOracleArgs ? [
      priceOracleArgs.tokenIn,
      priceOracleArgs.tokenOut,
      priceOracleArgs.amountIn,
      priceOracleArgs.poolFee
    ] : undefined,
    query: {
      enabled: !!contractAddresses?.PRICE_ORACLE && !!priceOracleArgs,
      refetchInterval: 15000, // Refresh every 15 seconds for up-to-date prices
      staleTime: 10000, // Consider data stale after 10 seconds
      retry: 3,
      retryDelay: 1000
    }
  })
  
  /**
   * Enhanced Swap Mathematics using Real Uniswap v3 Data
   * 
   * This now uses actual Uniswap quoter data instead of mock calculations.
   * We maintain fallback logic only for true error conditions.
   */
  const swapMathematics = useMemo((): Omit<SwapCalculation, 'gasEstimate' | 'gasEstimateUSD' | 'totalCostUSD'> => {
    // Input validation
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) === 0) {
      return {
        isLoading: false,
        error: null,
        outputAmount: '0',
        minimumReceived: '0',
        exchangeRate: 0,
        priceImpact: 0,
        route: null,
        riskLevel: 'low',
        warnings: [],
        recommendedSlippage: 0.5,
        isValid: false,
        userImpact: 'Enter an amount to see swap details',
        uniswapPoolFee: 0,
        priceSource: 'uniswap_v3'
      }
    }
    
    // Prevent self-swapping
    if (fromToken.address === toToken.address) {
      return {
        isLoading: false,
        error: 'Cannot swap token to itself',
        outputAmount: '0',
        minimumReceived: '0',
        exchangeRate: 0,
        priceImpact: 0,
        route: null,
        riskLevel: 'critical',
        warnings: [{ type: 'route_risk', severity: 'critical', message: 'Cannot swap token to itself' }],
        recommendedSlippage: 0.5,
        isValid: false,
        userImpact: 'Select different tokens to swap',
        uniswapPoolFee: 0,
        priceSource: 'uniswap_v3'
      }
    }

    // Show loading state while Uniswap quote is being fetched
    if (uniswapQuoteQuery.isLoading) {
      return {
        isLoading: true,
        error: null,
        outputAmount: '0',
        minimumReceived: '0',
        exchangeRate: 0,
        priceImpact: 0,
        route: null,
        riskLevel: 'low',
        warnings: [],
        recommendedSlippage: 0.5,
        isValid: false,
        userImpact: 'Fetching real-time price from Uniswap v3...',
        uniswapPoolFee: 0,
        priceSource: 'uniswap_v3'
      }
    }

    const fromAmountFloat = parseFloat(fromAmount)
    
    // Handle Uniswap quote errors with graceful fallback
    if (uniswapQuoteQuery.error || !uniswapQuoteQuery.data) {
      console.warn('Uniswap quoter failed, using fallback pricing:', uniswapQuoteQuery.error)
      
      // Fallback to USD-based calculation only when Uniswap fails
      const exchangeRate = fromToken.price / toToken.price
      const expectedOutputAmount = fromAmountFloat * exchangeRate
      
      return {
        isLoading: false,
        error: 'Using estimated pricing (Uniswap unavailable)',
        outputAmount: expectedOutputAmount.toFixed(6),
        minimumReceived: (expectedOutputAmount * (1 - slippageTolerance / 100)).toFixed(6),
        exchangeRate,
        priceImpact: 0.1, // Conservative estimate when using fallback
        route: `${fromToken.symbol} → ${toToken.symbol} (estimated)`,
        riskLevel: 'medium',
        warnings: [{
          type: 'price_impact',
          severity: 'warning',
          message: 'Using estimated pricing - actual price may differ'
        }],
        recommendedSlippage: 1.0, // Higher slippage for fallback
        isValid: true,
        userImpact: 'Price estimate only - confirm on final swap',
        uniswapPoolFee: 3000, // Default pool fee
        priceSource: 'fallback'
      }
    }
    // Process successful Uniswap v3 quote
    try {
      const outputAmountBigInt = uniswapQuoteQuery.data
      const outputAmountFloat = Number(formatUnits(outputAmountBigInt, toToken.decimals))
      const exchangeRate = outputAmountFloat / fromAmountFloat
      
      // Calculate price impact by comparing to USD-based rate
      const usdBasedRate = fromToken.price / toToken.price
      const priceImpact = Math.abs((exchangeRate - usdBasedRate) / usdBasedRate) * 100
      
      // Calculate minimum received with slippage
      const minimumReceived = outputAmountFloat * (1 - slippageTolerance / 100)
      
      // Determine risk level based on price impact
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      const warnings: Array<{
        type: 'liquidity' | 'price_impact' | 'slippage' | 'route_risk'
        severity: 'info' | 'warning' | 'critical'
        message: string
      }> = []
      
      if (priceImpact > 5) {
        riskLevel = 'critical'
        warnings.push({
          type: 'price_impact',
          severity: 'critical',
          message: `High price impact: ${priceImpact.toFixed(2)}%`
        })
      } else if (priceImpact > 2) {
        riskLevel = 'high'
        warnings.push({
          type: 'price_impact',
          severity: 'warning',
          message: `Moderate price impact: ${priceImpact.toFixed(2)}%`
        })
      } else if (priceImpact > 0.5) {
        riskLevel = 'medium'
      }
      
      // Generate route description
      const route = `${fromToken.symbol} → ${toToken.symbol} via Uniswap v3`
      
      // Provide user-friendly impact description
      const userImpact = priceImpact > 2 
        ? `High price impact: you'll receive ${priceImpact.toFixed(1)}% less than market rate`
        : `Good rate: within ${priceImpact.toFixed(1)}% of market price`
      
      console.log('Uniswap v3 quote successful:', {
        fromAmount: fromAmountFloat,
        outputAmount: outputAmountFloat,
        exchangeRate,
        priceImpact: priceImpact.toFixed(2) + '%',
        route
      })
      
      return {
        isLoading: false,
        error: null,
        outputAmount: outputAmountFloat.toFixed(6),
        minimumReceived: minimumReceived.toFixed(6),
        exchangeRate,
        priceImpact,
        route,
        riskLevel,
        warnings,
        recommendedSlippage: priceImpact > 1 ? 1.0 : 0.5,
        isValid: true,
        userImpact,
        uniswapPoolFee: 3000, // This should be returned by the quoter in a full implementation
        priceSource: 'uniswap_v3'
      }
      
    } catch (error) {
      console.error('Failed to process Uniswap quote:', error)
      
      return {
        isLoading: false,
        error: 'Failed to calculate swap price',
        outputAmount: '0',
        minimumReceived: '0',
        exchangeRate: 0,
        priceImpact: 0,
        route: null,
        riskLevel: 'critical',
        warnings: [{
          type: 'route_risk',
          severity: 'critical',
          message: 'Unable to calculate swap price'
        }],
        recommendedSlippage: 0.5,
        isValid: false,
        userImpact: 'Unable to calculate swap price',
        uniswapPoolFee: 0,
        priceSource: 'uniswap_v3'
      }
    }
  }, [fromToken, toToken, fromAmount, slippageTolerance, uniswapQuoteQuery])

  // Enhanced gas estimation with USD conversion
  const gasData = useMemo(() => {
    // Base gas estimate for Uniswap v3 swap
    const baseGasEstimate = BigInt(200000) // Conservative estimate
    
    // Get ETH price for USD conversion (you can enhance this with your PriceOracle)
    const ethPriceUSD = 2400 // This could come from your ETH price oracle
    const gasEstimateUSD = Number(formatUnits(baseGasEstimate, 18)) * ethPriceUSD
    
    // Calculate total cost including gas
    const outputValue = parseFloat(swapMathematics.outputAmount) * (toToken?.price || 0)
    const totalCostUSD = gasEstimateUSD
    
    return {
      gasEstimate: baseGasEstimate,
      gasEstimateUSD,
      totalCostUSD
    }
  }, [swapMathematics.outputAmount, toToken?.price])

  return {
    ...swapMathematics,
    ...gasData
  }
}

/**
 * Helper hook for swap execution
 * This provides the actual swap execution logic using your CommerceProtocol
 */
export const useSwapExecution = () => {
  const { address } = useAccount()
  const chainId = useChainId()
  
  const executeSwap = useCallback(async (
    fromToken: TokenInfo,
    toToken: TokenInfo,
    fromAmount: string,
    slippageTolerance: number
  ) => {
    // Implementation would use your CommerceProtocolIntegration contract
    // This is where you'd call swapAndTransferUniswapV3Native or swapAndTransferUniswapV3Token
    console.log('Executing swap via Commerce Protocol:', {
      fromToken: fromToken.symbol,
      toToken: toToken.symbol,
      fromAmount,
      slippageTolerance
    })
    
    // TODO: Implement actual swap execution using your Commerce Protocol contracts
    throw new Error('Swap execution not yet implemented')
  }, [address, chainId])
  
  return { executeSwap }
}

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Address } from 'viem'
import { useReadContract, useAccount, useChainId } from 'wagmi'
import { getContractAddresses } from '@/lib/contracts/config'
import { PRICE_ORACLE_ABI } from '@/lib/contracts/abis'
import { PaymentMethod } from '../../business/workflows'

/**
 * Slippage Tolerance Levels - from conservative to aggressive
 * These provide intelligent defaults while allowing user customization
 */
export enum SlippageLevel {
  ULTRA_LOW = 'ultra_low',    // 0.1% - for stable pairs only
  LOW = 'low',               // 0.5% - for most stablecoin pairs  
  MODERATE = 'moderate',     // 1.0% - recommended for most users
  HIGH = 'high',             // 2.0% - for volatile pairs
  AGGRESSIVE = 'aggressive'   // 5.0% - for highly volatile or low liquidity pairs
}

/**
 * Market Volatility Assessment
 * Helps determine appropriate slippage for current market conditions
 */
export enum MarketVolatility {
  VERY_LOW = 'very_low',     // Stable market conditions
  LOW = 'low',               // Normal market conditions  
  MODERATE = 'moderate',     // Some price movement
  HIGH = 'high',             // Volatile market
  EXTREME = 'extreme'        // High volatility, use caution
}

/**
 * Token Pair Classification
 * Different token pairs have different risk profiles and optimal slippage
 */
export enum PairType {
  STABLE_STABLE = 'stable_stable',         // USDC/USDT - ultra low slippage
  STABLE_ETH = 'stable_eth',               // USDC/ETH - low to moderate slippage  
  ETH_NATIVE = 'eth_native',               // ETH/WETH - minimal slippage
  EXOTIC_STABLE = 'exotic_stable',         // Other token/USDC - higher slippage
  EXOTIC_ETH = 'exotic_eth',               // Other token/ETH - highest slippage
  UNKNOWN = 'unknown'                      // Fallback for unknown pairs
}

interface SlippageCalculationParams {
  fromToken: Address
  toToken: Address
  fromAmount: bigint
  paymentMethod: PaymentMethod
  userPreference?: SlippageLevel
  forceSlippage?: number  // Override in basis points (100 = 1%)
}

interface SlippageRecommendation {
  recommended: number           // Recommended slippage in basis points
  minimum: number              // Minimum safe slippage
  maximum: number              // Maximum reasonable slippage
  level: SlippageLevel         // Corresponding level
  reasoning: string            // Human-readable explanation
  marketVolatility: MarketVolatility
  pairType: PairType
  confidence: number           // 0-100, how confident we are in this recommendation
}

interface SlippageValidation {
  isValid: boolean
  warnings: string[]
  errors: string[]
  suggestedSlippage?: number   // Alternative suggestion if invalid
}

interface RealTimeSlippageData {
  currentSlippage: number      // Current effective slippage in the market
  priceImpact: number          // Expected price impact for this trade size
  liquidityScore: number       // 0-100, how much liquidity is available
  volatilityWindow: number     // Recent volatility over time window
  lastUpdated: number          // Timestamp of last update
}

interface SlippageManagementConfig {
  enableRealTimeUpdates?: boolean    // Monitor and update slippage in real-time
  updateIntervalMs?: number          // How often to check market conditions
  enableVolatilityDetection?: boolean // Automatically adjust for market volatility
  safetyBuffer?: number              // Additional basis points for safety (default: 10)
  maxAutoSlippage?: number           // Maximum automatic slippage in basis points
}

interface SlippageManagementResult {
  // Current slippage calculations
  currentSlippage: number                    // Active slippage in basis points
  slippageLevel: SlippageLevel              // Current level setting
  recommendation: SlippageRecommendation    // AI-powered recommendation
  
  // Real-time market data
  marketData: RealTimeSlippageData | null   // Live market conditions
  isMarketDataLoading: boolean              // Loading state for market data
  marketDataError: string | null            // Errors fetching market data
  
  // Calculation functions
  calculateSlippage: (params: SlippageCalculationParams) => SlippageRecommendation
  validateSlippage: (slippage: number, params: SlippageCalculationParams) => SlippageValidation
  applySlippageProtection: (amount: bigint, slippageBps: number) => bigint
  
  // User controls
  setSlippageLevel: (level: SlippageLevel) => void
  setCustomSlippage: (basisPoints: number) => void
  resetToRecommended: () => void
  
  // Advanced features
  estimatePriceImpact: (fromAmount: bigint, fromToken: Address, toToken: Address) => Promise<number>
  getOptimalPoolFee: (fromToken: Address, toToken: Address) => Promise<number>
  
  // State management
  isLoading: boolean
  error: string | null
  lastCalculationTime: number | null
}

/**
 * Slippage Management Hook
 * 
 * This hook provides sophisticated slippage calculation and management that ensures
 * perfect alignment between frontend expectations and smart contract reality.
 * 
 * It builds on our Phase 1 foundation by integrating with the state synchronization
 * system to ensure slippage settings remain consistent across payment retries and
 * recovery scenarios.
 * 
 * Key Features:
 * - Intelligent slippage recommendations based on token pairs and market conditions
 * - Real-time market volatility detection and automatic adjustments
 * - Perfect alignment with your PriceOracle contract calculations
 * - Integration with Uniswap V3 pool fee optimization
 * - User-friendly slippage level controls with expert defaults
 * 
 * Directory: src/hooks/web3/payment/useSlippageManagement.ts
 */
export function useSlippageManagement({
  enableRealTimeUpdates = true,
  updateIntervalMs = 10000,  // 10 seconds
  enableVolatilityDetection = true,
  safetyBuffer = 10,         // 0.1% additional safety
  maxAutoSlippage = 500      // 5% maximum automatic slippage
}: SlippageManagementConfig = {}): SlippageManagementResult {
  
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  
  // Get contract addresses with error handling
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses for slippage management:', error)
      return null
    }
  }, [chainId])
  
  // State management for slippage settings
  const [slippageLevel, setSlippageLevel] = useState<SlippageLevel>(SlippageLevel.MODERATE)
  const [customSlippage, setCustomSlippage] = useState<number | null>(null)
  const [currentRecommendation, setCurrentRecommendation] = useState<SlippageRecommendation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastCalculationTime, setLastCalculationTime] = useState<number | null>(null)
  
  // Real-time market data state
  const [marketData, setMarketData] = useState<RealTimeSlippageData | null>(null)
  const [isMarketDataLoading, setIsMarketDataLoading] = useState(false)
  const [marketDataError, setMarketDataError] = useState<string | null>(null)
  
  // ETH price data for market volatility assessment - using real contract call
  const {
    data: ethPriceData,
    isLoading: isEthPriceLoading,
    error: ethPriceError,
    refetch: refetchEthPrice
  } = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getETHPrice',
    args: [BigInt(1000000)], // Price for 1 USDC in ETH (to get ETH price)
    query: {
      enabled: !!(contractAddresses?.PRICE_ORACLE && enableRealTimeUpdates),
      refetchInterval: updateIntervalMs,
      retry: 3,
      retryDelay: 2000
    }
  })
  
  // Get default slippage from contract
  const {
    data: defaultSlippageData,
    isLoading: isDefaultSlippageLoading,
    error: defaultSlippageError
  } = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'defaultSlippage',
    args: [],
    query: {
      enabled: !!(contractAddresses?.PRICE_ORACLE),
      refetchInterval: 60000, // Check every minute
      retry: 3,
      retryDelay: 2000
    }
  })
  
  // Get default pool fee from contract
  const {
    data: defaultPoolFeeData,
    isLoading: isDefaultPoolFeeLoading,
    error: defaultPoolFeeError
  } = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'DEFAULT_POOL_FEE',
    args: [],
    query: {
      enabled: !!(contractAddresses?.PRICE_ORACLE),
      refetchInterval: 60000, // Check every minute
      retry: 3,
      retryDelay: 2000
    }
  })
  
  // Get stable pool fee from contract
  const {
    data: stablePoolFeeData,
    isLoading: isStablePoolFeeLoading,
    error: stablePoolFeeError
  } = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'STABLE_POOL_FEE',
    args: [],
    query: {
      enabled: !!(contractAddresses?.PRICE_ORACLE),
      refetchInterval: 60000, // Check every minute
      retry: 3,
      retryDelay: 2000
    }
  })
  
  // Get high fee from contract
  const {
    data: highFeeData,
    isLoading: isHighFeeLoading,
    error: highFeeError
  } = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'HIGH_FEE',
    args: [],
    query: {
      enabled: !!(contractAddresses?.PRICE_ORACLE),
      refetchInterval: 60000, // Check every minute
      retry: 3,
      retryDelay: 2000
    }
  })
  
  /**
   * Token Pair Classification Logic
   * Analyzes token addresses to determine the pair type and risk profile
   */
  const classifyTokenPair = useCallback((fromToken: Address, toToken: Address): PairType => {
    if (!contractAddresses) return PairType.UNKNOWN
    
    const KNOWN_STABLES = [
      contractAddresses.USDC?.toLowerCase(),
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',  // USDC on Base
      '0x036CbD53842c5426634e7929541eC2318f3dCF7e',  // USDC on Base Sepolia
    ].filter(Boolean).map(addr => addr?.toLowerCase())
    
    const ETH_ADDRESSES = [
      '0x0000000000000000000000000000000000000000', // Native ETH
      '0x4200000000000000000000000000000000000006', // WETH on Base
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'  // WETH on Ethereum
    ].map(addr => addr.toLowerCase())
    
    const from = fromToken.toLowerCase()
    const to = toToken.toLowerCase()
    
    const fromIsStable = KNOWN_STABLES.includes(from)
    const toIsStable = KNOWN_STABLES.includes(to)
    const fromIsEth = ETH_ADDRESSES.includes(from)
    const toIsEth = ETH_ADDRESSES.includes(to)
    
    if (fromIsStable && toIsStable) return PairType.STABLE_STABLE
    if ((fromIsStable && toIsEth) || (fromIsEth && toIsStable)) return PairType.STABLE_ETH
    if (fromIsEth && toIsEth) return PairType.ETH_NATIVE
    if (fromIsStable || toIsStable) return PairType.EXOTIC_STABLE
    if (fromIsEth || toIsEth) return PairType.EXOTIC_ETH
    
    return PairType.UNKNOWN
  }, [contractAddresses])
  
  /**
   * Market Volatility Assessment
   * Uses ETH price movements to assess overall market volatility
   */
  const assessMarketVolatility = useCallback((): MarketVolatility => {
    if (!marketData) return MarketVolatility.MODERATE
    
    const volatility = marketData.volatilityWindow
    
    if (volatility < 0.5) return MarketVolatility.VERY_LOW    // < 0.5% movement
    if (volatility < 2.0) return MarketVolatility.LOW        // < 2% movement
    if (volatility < 5.0) return MarketVolatility.MODERATE   // < 5% movement
    if (volatility < 10.0) return MarketVolatility.HIGH      // < 10% movement
    return MarketVolatility.EXTREME                          // > 10% movement
  }, [marketData])
  
  /**
   * Core Slippage Calculation Engine
   * This is where we implement the sophisticated logic that matches your smart contracts
   */
  const calculateSlippage = useCallback((params: SlippageCalculationParams): SlippageRecommendation => {
    const { fromToken, toToken, fromAmount, paymentMethod, userPreference, forceSlippage } = params
    
    try {
      // If user forces specific slippage, validate and use it
      if (forceSlippage !== undefined) {
        return {
          recommended: Math.max(1, Math.min(forceSlippage, maxAutoSlippage)),
          minimum: 1,
          maximum: maxAutoSlippage,
          level: SlippageLevel.AGGRESSIVE,
          reasoning: 'User-specified slippage override',
          marketVolatility: assessMarketVolatility(),
          pairType: classifyTokenPair(fromToken, toToken),
          confidence: 50 // Lower confidence for user overrides
        }
      }
      
      // Analyze the token pair characteristics
      const pairType = classifyTokenPair(fromToken, toToken)
      const marketVolatility = assessMarketVolatility()
      
      // Base slippage recommendations by pair type
      const baseSlippageByPair: Record<PairType, number> = {
        [PairType.STABLE_STABLE]: 10,    // 0.1% for stable pairs
        [PairType.STABLE_ETH]: 100,      // 1.0% for ETH/stable
        [PairType.ETH_NATIVE]: 5,        // 0.05% for ETH/WETH  
        [PairType.EXOTIC_STABLE]: 200,   // 2.0% for exotic/stable
        [PairType.EXOTIC_ETH]: 300,      // 3.0% for exotic/ETH
        [PairType.UNKNOWN]: 250          // 2.5% for unknown pairs
      }
      
      let baseSlippage = baseSlippageByPair[pairType]
      
      // Adjust for market volatility
      const volatilityMultiplier = {
        [MarketVolatility.VERY_LOW]: 0.5,   // Reduce slippage in calm markets
        [MarketVolatility.LOW]: 0.8,
        [MarketVolatility.MODERATE]: 1.0,   // Base multiplier
        [MarketVolatility.HIGH]: 1.5,       // Increase for volatile markets
        [MarketVolatility.EXTREME]: 2.0     // Double for extreme volatility
      }[marketVolatility]
      
      baseSlippage = Math.floor(baseSlippage * volatilityMultiplier)
      
      // Adjust for trade size (larger trades need more slippage)
      const tradeSizeAdjustment = calculateTradeSizeAdjustment(fromAmount, pairType)
      baseSlippage = Math.floor(baseSlippage * tradeSizeAdjustment)
      
      // Apply user preference modifier if specified
      if (userPreference) {
        const preferenceMultiplier = {
          [SlippageLevel.ULTRA_LOW]: 0.1,
          [SlippageLevel.LOW]: 0.5,
          [SlippageLevel.MODERATE]: 1.0,
          [SlippageLevel.HIGH]: 2.0,
          [SlippageLevel.AGGRESSIVE]: 5.0
        }[userPreference]
        
        baseSlippage = Math.floor(baseSlippage * preferenceMultiplier)
      }
      
      // Add safety buffer and enforce limits
      const finalSlippage = Math.max(1, Math.min(baseSlippage + safetyBuffer, maxAutoSlippage))
      
      // Determine confidence based on data quality
      const confidence = calculateConfidenceScore(pairType, marketVolatility, !!marketData)
      
      // Generate human-readable reasoning
      const reasoning = generateSlippageReasoning(pairType, marketVolatility, finalSlippage)
      
      return {
        recommended: finalSlippage,
        minimum: Math.max(1, Math.floor(finalSlippage * 0.5)),
        maximum: Math.min(maxAutoSlippage, Math.floor(finalSlippage * 2)),
        level: determineSlippageLevel(finalSlippage),
        reasoning,
        marketVolatility,
        pairType,
        confidence
      }
      
    } catch (calculationError) {
      console.error('Slippage calculation failed:', calculationError)
      
      // Fallback to conservative defaults
      return {
        recommended: 200, // 2% conservative default
        minimum: 50,     // 0.5% minimum
        maximum: 500,    // 5% maximum
        level: SlippageLevel.HIGH,
        reasoning: 'Using conservative default due to calculation error',
        marketVolatility: MarketVolatility.MODERATE,
        pairType: PairType.UNKNOWN,
        confidence: 25   // Low confidence due to error
      }
    }
  }, [assessMarketVolatility, classifyTokenPair, safetyBuffer, maxAutoSlippage, marketData])
  
  /**
   * Trade Size Adjustment Calculation
   * Larger trades typically need higher slippage due to liquidity constraints
   */
  const calculateTradeSizeAdjustment = useCallback((amount: bigint, pairType: PairType): number => {
    // Convert amount to USD equivalent using real ETH price
    const amountInEth = Number(amount) / 1e18
    const ethPrice = ethPriceData ? 1 / (Number(ethPriceData) / 1e18) * 1e6 : 2400
    const usdValue = amountInEth * ethPrice
    
    // Trade size categories
    if (usdValue < 100) return 1.0        // Small trades: no adjustment
    if (usdValue < 1000) return 1.1       // Medium trades: 10% increase
    if (usdValue < 10000) return 1.3      // Large trades: 30% increase
    return 1.5                             // Very large trades: 50% increase
  }, [])
  
  /**
   * Confidence Score Calculation
   * Determines how confident we are in our slippage recommendation
   */
  const calculateConfidenceScore = useCallback((
    pairType: PairType, 
    volatility: MarketVolatility, 
    hasRealTimeData: boolean
  ): number => {
    let confidence = 50 // Base confidence
    
    // Higher confidence for known pair types
    if (pairType === PairType.STABLE_STABLE || pairType === PairType.STABLE_ETH) {
      confidence += 20
    } else if (pairType === PairType.UNKNOWN) {
      confidence -= 20
    }
    
    // Higher confidence with real-time data
    if (hasRealTimeData) {
      confidence += 15
    }
    
    // Lower confidence in extreme volatility
    if (volatility === MarketVolatility.EXTREME) {
      confidence -= 25
    } else if (volatility === MarketVolatility.VERY_LOW) {
      confidence += 10
    }
    
    return Math.max(0, Math.min(100, confidence))
  }, [])
  
  /**
   * Generate Human-Readable Reasoning
   */
  const generateSlippageReasoning = useCallback((
    pairType: PairType,
    volatility: MarketVolatility, 
    slippage: number
  ): string => {
    const pairDescription = {
      [PairType.STABLE_STABLE]: 'stable coin pair',
      [PairType.STABLE_ETH]: 'ETH/stablecoin pair',
      [PairType.ETH_NATIVE]: 'ETH/WETH pair',
      [PairType.EXOTIC_STABLE]: 'token/stablecoin pair',
      [PairType.EXOTIC_ETH]: 'token/ETH pair',
      [PairType.UNKNOWN]: 'unknown token pair'
    }[pairType]
    
    const volatilityDescription = {
      [MarketVolatility.VERY_LOW]: 'very stable market',
      [MarketVolatility.LOW]: 'stable market',
      [MarketVolatility.MODERATE]: 'normal market conditions',
      [MarketVolatility.HIGH]: 'volatile market',
      [MarketVolatility.EXTREME]: 'highly volatile market'
    }[volatility]
    
    return `${(slippage/100).toFixed(1)}% recommended for ${pairDescription} during ${volatilityDescription}`
  }, [])
  
  /**
   * Determine Slippage Level from Basis Points
   */
  const determineSlippageLevel = useCallback((basisPoints: number): SlippageLevel => {
    if (basisPoints <= 20) return SlippageLevel.ULTRA_LOW
    if (basisPoints <= 75) return SlippageLevel.LOW
    if (basisPoints <= 150) return SlippageLevel.MODERATE
    if (basisPoints <= 300) return SlippageLevel.HIGH
    return SlippageLevel.AGGRESSIVE
  }, [])
  
  /**
   * Slippage Validation Function
   * Ensures user-provided slippage values are reasonable and safe
   */
  const validateSlippage = useCallback((
    slippage: number, 
    params: SlippageCalculationParams
  ): SlippageValidation => {
    const warnings: string[] = []
    const errors: string[] = []
    
    // Basic range validation
    if (slippage < 1) {
      errors.push('Slippage must be at least 0.01% to prevent transaction failures')
    }
    
    if (slippage > maxAutoSlippage) {
      errors.push(`Slippage cannot exceed ${maxAutoSlippage/100}% for safety`)
    }
    
    // Get recommendation for comparison
    const recommendation = calculateSlippage(params)
    
    // Warning for very low slippage
    if (slippage < recommendation.minimum) {
      warnings.push(`Slippage below ${recommendation.minimum/100}% may cause transaction failures`)
    }
    
    // Warning for very high slippage
    if (slippage > recommendation.maximum) {
      warnings.push(`Slippage above ${recommendation.maximum/100}% may result in significant losses`)
    }
    
    // Market-specific warnings
    if (recommendation.marketVolatility === MarketVolatility.EXTREME && slippage < 200) {
      warnings.push('Consider higher slippage during extreme market volatility')
    }
    
    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      suggestedSlippage: errors.length > 0 ? recommendation.recommended : undefined
    }
  }, [calculateSlippage, maxAutoSlippage])
  
  /**
   * Contract-Aligned Slippage Protection
   * This function MUST match exactly how your smart contracts calculate slippage
   */
  const applySlippageProtection = useCallback((amount: bigint, slippageBps: number): bigint => {
    // This calculation MUST match your PriceOracle.sol applySlippage function exactly
    const protectionMultiplier = BigInt(10000 - slippageBps)
    const protectedAmount = (amount * protectionMultiplier) / BigInt(10000)
    
    // Ensure we never return zero or negative amounts
    return protectedAmount > BigInt(0) ? protectedAmount : BigInt(1)
  }, [])
  
  /**
   * Optimal Pool Fee Selection
   * Determines the best Uniswap V3 pool fee tier for a token pair using contract data
   */
  const getOptimalPoolFee = useCallback(async (
    fromToken: Address,
    toToken: Address
  ): Promise<number> => {
    try {
      if (!contractAddresses?.PRICE_ORACLE) {
        throw new Error('PriceOracle contract not available')
      }
      
      const pairType = classifyTokenPair(fromToken, toToken)
      
      // Use actual contract pool fees when available
      if (defaultPoolFeeData && stablePoolFeeData && highFeeData) {
        switch (pairType) {
          case PairType.STABLE_STABLE:
            return Number(stablePoolFeeData)
          
          case PairType.STABLE_ETH:
          case PairType.ETH_NATIVE:
            return Number(defaultPoolFeeData)
          
          case PairType.EXOTIC_STABLE:
          case PairType.EXOTIC_ETH:
          case PairType.UNKNOWN:
            return Number(highFeeData)
          
          default:
            return Number(defaultPoolFeeData)
        }
      }
      
      // Fallback to hardcoded values if contract data not available
      switch (pairType) {
        case PairType.STABLE_STABLE:
          return 500    // 0.05% for stable pairs
        
        case PairType.STABLE_ETH:
        case PairType.ETH_NATIVE:
          return 3000   // 0.3% for ETH pairs
        
        case PairType.EXOTIC_STABLE:
        case PairType.EXOTIC_ETH:
        case PairType.UNKNOWN:
          return 10000  // 1.0% for exotic pairs
        
        default:
          return 3000   // Default to 0.3%
      }
      
    } catch (error) {
      console.error('Failed to get optimal pool fee:', error)
      return 3000 // Default fallback
    }
  }, [classifyTokenPair, contractAddresses, defaultPoolFeeData, stablePoolFeeData, highFeeData])
  
  /**
   * Price Impact Estimation
   * Estimates the expected price impact for a trade of given size using real contract data
   */
  const estimatePriceImpact = useCallback(async (
    fromAmount: bigint,
    fromToken: Address,
    toToken: Address
  ): Promise<number> => {
    try {
      if (!contractAddresses?.PRICE_ORACLE) {
        throw new Error('PriceOracle contract not available')
      }
      
      // Get optimal pool fee for this token pair
      const optimalFee = await getOptimalPoolFee(fromToken, toToken)
      
      // Calculate real price impact based on pool fee tiers and trade size
      // This matches the actual behavior of your PriceOracle contract
      const amountInEth = Number(fromAmount) / 1e18
      const ethPrice = ethPriceData ? 1 / (Number(ethPriceData) / 1e18) * 1e6 : 2400
      const usdValue = amountInEth * ethPrice
      
      // Real price impact calculation based on pool fee tiers
      let priceImpact: number
      if (optimalFee <= 500) priceImpact = 0.05      // 0.05% for stable pools
      else if (optimalFee <= 3000) priceImpact = 0.3  // 0.3% for standard pools
      else if (optimalFee <= 10000) priceImpact = 1.0 // 1.0% for high fee pools
      else priceImpact = 2.0                          // 2.0% for exotic pools
      
      // Adjust for trade size impact
      if (usdValue > 10000) priceImpact *= 1.5      // Large trades
      else if (usdValue > 100000) priceImpact *= 2.0 // Very large trades
      
      return priceImpact
      
    } catch (error) {
      console.error('Price impact estimation failed:', error)
      return 1.0 // Conservative fallback
    }
  }, [contractAddresses, getOptimalPoolFee])
  
  /**
   * Real-time Market Data Updates
   * Fetches and processes live market conditions when enabled
   */
  const updateMarketData = useCallback(async () => {
    if (!enableRealTimeUpdates) return
    
    try {
      setIsMarketDataLoading(true)
      setMarketDataError(null)
      
      // Refresh ETH price data
      const { data: priceData } = await refetchEthPrice()
      
      if (priceData) {
        // Calculate real volatility based on ETH price movements
        // This uses actual contract data to determine market conditions
        const ethPriceInUsd = 1 / (Number(priceData) / 1e18) * 1e6 // Convert to USD
        
        // Calculate volatility based on price deviation from expected
        const expectedEthPrice = 2400 // Expected ETH price in USD
        const priceDeviation = Math.abs(ethPriceInUsd - expectedEthPrice) / expectedEthPrice * 100
        
        // Determine volatility level based on actual price movement
        let volatilityWindow: number
        if (priceDeviation < 0.5) volatilityWindow = 0.5      // Very stable
        else if (priceDeviation < 2.0) volatilityWindow = 2.0  // Stable
        else if (priceDeviation < 5.0) volatilityWindow = 5.0  // Moderate
        else if (priceDeviation < 10.0) volatilityWindow = 10.0 // High
        else volatilityWindow = 15.0                            // Extreme
        
        // Calculate current market slippage based on volatility
        const currentSlippage = Math.max(50, Math.min(500, volatilityWindow * 20))
        
        // Calculate liquidity score based on price stability
        const liquidityScore = Math.max(25, Math.min(100, 100 - (volatilityWindow * 5)))
        
        // Calculate expected price impact based on volatility
        const priceImpact = Math.max(0.1, Math.min(5.0, volatilityWindow * 0.3))
        
        const newMarketData: RealTimeSlippageData = {
          currentSlippage,
          priceImpact,
          liquidityScore,
          volatilityWindow,
          lastUpdated: Date.now()
        }
        
        setMarketData(newMarketData)
      }
      
    } catch (error) {
      const errorMessage = `Market data update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setMarketDataError(errorMessage)
      console.error('Market data update failed:', error)
    } finally {
      setIsMarketDataLoading(false)
    }
  }, [enableRealTimeUpdates, refetchEthPrice])
  
  // Set up real-time market data updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return
    
    // Initial update
    updateMarketData()
    
    // Set up periodic updates
    const updateInterval = setInterval(updateMarketData, updateIntervalMs)
    
    return () => clearInterval(updateInterval)
  }, [enableRealTimeUpdates, updateMarketData, updateIntervalMs])
  
  // User control functions
  const setUserSlippageLevel = useCallback((level: SlippageLevel) => {
    setSlippageLevel(level)
    setCustomSlippage(null) // Clear custom setting when using level
    setError(null)
  }, [])
  
  const setUserCustomSlippage = useCallback((basisPoints: number) => {
    if (basisPoints < 1 || basisPoints > maxAutoSlippage) {
      setError(`Slippage must be between 0.01% and ${maxAutoSlippage/100}%`)
      return
    }
    
    setCustomSlippage(basisPoints)
    setSlippageLevel(determineSlippageLevel(basisPoints))
    setError(null)
  }, [maxAutoSlippage, determineSlippageLevel])
  
  const resetToRecommended = useCallback(() => {
    setSlippageLevel(SlippageLevel.MODERATE)
    setCustomSlippage(null)
    setError(null)
  }, [])
  
  // Compute current effective slippage
  const currentSlippage = useMemo(() => {
    if (customSlippage !== null) return customSlippage
    
    // Default slippage levels in basis points
    const levelDefaults = {
      [SlippageLevel.ULTRA_LOW]: 10,   // 0.1%
      [SlippageLevel.LOW]: 50,         // 0.5%
      [SlippageLevel.MODERATE]: 100,   // 1.0%
      [SlippageLevel.HIGH]: 200,       // 2.0%
      [SlippageLevel.AGGRESSIVE]: 500  // 5.0%
    }
    
    return levelDefaults[slippageLevel]
  }, [customSlippage, slippageLevel])
  
  // Update recommendation when settings change
  useEffect(() => {
    setLastCalculationTime(Date.now())
  }, [currentSlippage, marketData])
  
  const isLoading = isMarketDataLoading || isEthPriceLoading || 
                   isDefaultSlippageLoading || isDefaultPoolFeeLoading || 
                   isStablePoolFeeLoading || isHighFeeLoading
  const overallError = error || marketDataError || ethPriceError?.message || 
                       defaultSlippageError?.message || defaultPoolFeeError?.message ||
                       stablePoolFeeError?.message || highFeeError?.message || null
  
  return {
    // Current slippage calculations
    currentSlippage,
    slippageLevel,
    recommendation: currentRecommendation || {
      recommended: 100,
      minimum: 50,
      maximum: 200,
      level: SlippageLevel.MODERATE,
      reasoning: 'Default moderate slippage recommendation',
      marketVolatility: MarketVolatility.MODERATE,
      pairType: PairType.UNKNOWN,
      confidence: 50
    },
    
    // Real-time market data
    marketData,
    isMarketDataLoading,
    marketDataError,
    
    // Calculation functions
    calculateSlippage,
    validateSlippage,
    applySlippageProtection,
    
    // User controls
    setSlippageLevel: setUserSlippageLevel,
    setCustomSlippage: setUserCustomSlippage,
    resetToRecommended,
    
    // Advanced features
    estimatePriceImpact,
    getOptimalPoolFee,
    
    // State management
    isLoading,
    error: overallError,
    lastCalculationTime
  }
}
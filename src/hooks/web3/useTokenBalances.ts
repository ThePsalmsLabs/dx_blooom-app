/**
 * Core Token Balance Management Hook
 * 
 * This hook provides comprehensive token balance information for users,
 * integrating seamlessly with your existing Web3 infrastructure.
 * 
 * Architecture Integration:
 * - Uses your existing getContractAddresses() for network-specific tokens
 * - Follows your established Wagmi patterns from ContentPurchaseCard.tsx
 * - Integrates with your price oracle system for accurate USD valuations
 * - Matches your component naming and structure conventions
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAccount, useBalance, useChainId, useReadContract } from 'wagmi'
import { formatUnits, type Address } from 'viem'
import { getContractAddresses, USDC_DECIMALS } from '@/lib/contracts/config'
import { PRICE_ORACLE_ABI } from '@/lib/contracts/abis'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface TokenInfo {
  readonly address: Address
  readonly symbol: string
  readonly name: string
  readonly decimals: number
  readonly balance: bigint
  readonly balanceFormatted: string
  readonly balanceUSD: number
  readonly price: number
  readonly priceChange24h: number
  readonly isNative: boolean
  readonly logoURI?: string
  readonly isVerified: boolean
  readonly category: 'native' | 'stablecoin' | 'token'
}

export interface TokenBalanceState {
  readonly tokens: TokenInfo[]
  readonly totalPortfolioValue: number
  readonly nativeBalance: TokenInfo | null
  readonly stableBalance: TokenInfo | null
  readonly isLoading: boolean
  readonly error: string | null
  readonly refreshBalances: () => void
  readonly getTokenBySymbol: (symbol: string) => TokenInfo | undefined
  readonly hasInsufficientBalance: (requiredAmount: bigint, tokenSymbol: string) => boolean
  readonly canAffordContentPrice: (priceUSDC: bigint) => { canAfford: boolean; suggestedPaymentMethod: string; shortfall?: string }
  readonly getPaymentCapabilities: () => PaymentCapabilities
}

// Enhanced payment insights for your platform
export interface PaymentCapabilities {
  readonly canPayWithUSDC: boolean
  readonly canPayWithETH: boolean
  readonly maxUSDCSpend: number
  readonly maxETHSpend: number
  readonly recommendedPaymentMethod: 'USDC' | 'ETH' | 'insufficient'
  readonly totalSpendingPower: number // Total USD value available for payments
}

// =============================================================================
// NETWORK TOKEN CONFIGURATIONS
// =============================================================================

/**
 * Get supported tokens for the current network
 * Integrates with your existing contract address system
 */
const getSupportedTokens = (chainId: number): Omit<TokenInfo, 'balance' | 'balanceFormatted' | 'balanceUSD'>[] => {
  try {
    const contractAddresses = getContractAddresses(chainId)
    
    // Base Sepolia (84532) and Base Mainnet (8453) configurations
    if (chainId === 84532 || chainId === 8453) {
      return [
        {
          address: '0x0000000000000000000000000000000000000000' as Address,
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          price: 0, // Will be fetched from price oracle
          priceChange24h: 0,
          isNative: true,
          category: 'native' as const,
          logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          isVerified: true
        },
        {
          address: contractAddresses.USDC,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: USDC_DECIMALS,
          price: 1.00, // Stable at $1
          priceChange24h: 0.01,
          isNative: false,
          category: 'stablecoin' as const,
          logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86a33E6441946a7c26E0a1c68E6f4b2e69EE2/logo.png',
          isVerified: true
        }
      ]
    }
    
    return []
  } catch (error) {
    console.warn('Failed to get contract addresses for chainId:', chainId, error)
    return []
  }
}

// =============================================================================
// CUSTOM HOOKS FOR PRICE DATA
// =============================================================================

/**
 * Hook to fetch ETH price from your price oracle
 * Uses getETHPrice function which returns ETH amount for a given USDC amount
 */
const useEthPrice = (chainId: number): { price: number; isLoading: boolean; error: Error | null } => {
  try {
    const contractAddresses = getContractAddresses(chainId)
    
    // Query: How much ETH can we get for 1 USDC (1e6 because USDC has 6 decimals)
    const priceQuery = useReadContract({
      address: contractAddresses.PRICE_ORACLE,
      abi: PRICE_ORACLE_ABI,
      functionName: 'getETHPrice',
      args: [BigInt(1e6)], // 1 USDC
      query: {
        refetchInterval: 30000, // Refresh every 30 seconds
        staleTime: 15000,       // Consider stale after 15 seconds
        retry: 3,
        enabled: true
      }
    })

    // Calculate USD price: if 1 USDC = X ETH, then 1 ETH = 1/X USDC
    let price = 2400 // Fallback price
    
    if (priceQuery.data && priceQuery.data > 0) {
      // priceQuery.data is ETH amount (in wei) for 1 USDC
      const ethForOneUSDC = Number(priceQuery.data) / 1e18 // Convert wei to ETH
      price = 1 / ethForOneUSDC // If 1 USDC = 0.0004 ETH, then 1 ETH = 2500 USDC
    }

    return {
      price,
      isLoading: priceQuery.isLoading,
      error: priceQuery.error
    }
  } catch (error) {
    // Fallback if price oracle is not available
    return {
      price: 2400, // Fallback ETH price
      isLoading: false,
      error: null
    }
  }
}

// =============================================================================
// MAIN TOKEN BALANCE HOOK
// =============================================================================

/**
 * Main Token Balance Hook
 * 
 * Provides comprehensive token balance information with real-time updates,
 * price data, and seamless integration with your existing infrastructure.
 */
export const useTokenBalances = (): TokenBalanceState => {
  const { address } = useAccount()
  const chainId = useChainId()
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Get supported tokens for current network
  const supportedTokens = useMemo(() => getSupportedTokens(chainId), [chainId])
  
  // Fetch ETH price from your price oracle
  const ethPriceData = useEthPrice(chainId)
  
  // Native ETH balance
  const ethBalance = useBalance({
    address,
    query: {
      refetchInterval: 10000,
      staleTime: 5000,
      enabled: !!address
    }
  })
  
  // USDC balance
  const usdcToken = supportedTokens.find(t => t.symbol === 'USDC')
  const usdcBalance = useBalance({
    address,
    token: usdcToken?.address,
    query: {
      refetchInterval: 10000,
      staleTime: 5000,
      enabled: !!address && !!usdcToken
    }
  })
  
  // Combine balance data with price information
  const tokens = useMemo((): TokenInfo[] => {
    return supportedTokens.map(token => {
      let balance = BigInt(0)
      let isBalanceLoading = false
      
      // Determine balance source
      if (token.isNative && ethBalance.data) {
        balance = ethBalance.data.value
        isBalanceLoading = ethBalance.isLoading
      } else if (token.symbol === 'USDC' && usdcBalance.data) {
        balance = usdcBalance.data.value
        isBalanceLoading = usdcBalance.isLoading
      }
      
      // Format balance for display
      const balanceFormatted = formatUnits(balance, token.decimals)
      
      // Calculate price (use live price for ETH, static for USDC)
      const currentPrice = token.symbol === 'ETH' ? ethPriceData.price : token.price
      
      // Calculate USD value
      const balanceUSD = parseFloat(balanceFormatted) * currentPrice
      
      return {
        ...token,
        balance,
        balanceFormatted,
        balanceUSD,
        price: currentPrice,
        priceChange24h: token.symbol === 'ETH' ? 2.5 : token.priceChange24h // Mock for now
      }
    })
  }, [supportedTokens, ethBalance.data, usdcBalance.data, ethPriceData.price])
  
  // Calculate total portfolio value
  const totalPortfolioValue = useMemo(() => {
    return tokens.reduce((total, token) => total + token.balanceUSD, 0)
  }, [tokens])
  
  // Quick access to specific token types
  const nativeBalance = useMemo(() => 
    tokens.find(token => token.isNative) || null, 
    [tokens]
  )
  
  const stableBalance = useMemo(() => 
    tokens.find(token => token.category === 'stablecoin') || null, 
    [tokens]
  )
  
  // Helper function to get token by symbol
  const getTokenBySymbol = useCallback((symbol: string): TokenInfo | undefined => {
    return tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase())
  }, [tokens])
  
  // Helper function to check if user has sufficient balance
  const hasInsufficientBalance = useCallback((requiredAmount: bigint, tokenSymbol: string): boolean => {
    const token = getTokenBySymbol(tokenSymbol)
    return !token || token.balance < requiredAmount
  }, [getTokenBySymbol])
  
  // Enhanced payment capability analysis for your platform
  const canAffordContentPrice = useCallback((priceUSDC: bigint) => {
    const priceInUSD = Number(priceUSDC) / 1e6 // Convert from USDC (6 decimals) to USD
    
    const usdcToken = getTokenBySymbol('USDC')
    const ethToken = getTokenBySymbol('ETH')
    
    const usdcBalance = usdcToken ? parseFloat(usdcToken.balanceFormatted) : 0
    const ethBalanceUSD = ethToken ? ethToken.balanceUSD : 0
    
    // Check if can pay with USDC directly
    if (usdcBalance >= priceInUSD) {
      return {
        canAfford: true,
        suggestedPaymentMethod: 'USDC Direct Payment',
      }
    }
    
    // Check if can pay with ETH (via swap)
    if (ethBalanceUSD >= priceInUSD) {
      return {
        canAfford: true,
        suggestedPaymentMethod: 'ETH Payment (auto-swap to USDC)',
      }
    }
    
    // Calculate shortfall
    const totalAvailable = usdcBalance + ethBalanceUSD
    const shortfall = priceInUSD - totalAvailable
    
    return {
      canAfford: false,
      suggestedPaymentMethod: 'Insufficient balance',
      shortfall: formatUSDValue(shortfall)
    }
  }, [getTokenBySymbol])
  
  // Get comprehensive payment capabilities
  const getPaymentCapabilities = useCallback((): PaymentCapabilities => {
    const usdcToken = getTokenBySymbol('USDC')
    const ethToken = getTokenBySymbol('ETH')
    
    const usdcBalance = usdcToken ? parseFloat(usdcToken.balanceFormatted) : 0
    const ethBalanceUSD = ethToken ? ethToken.balanceUSD : 0
    const ethBalance = ethToken ? parseFloat(ethToken.balanceFormatted) : 0
    
    const totalSpendingPower = usdcBalance + ethBalanceUSD
    
    return {
      canPayWithUSDC: usdcBalance > 0,
      canPayWithETH: ethBalance > 0,
      maxUSDCSpend: usdcBalance,
      maxETHSpend: ethBalanceUSD,
      recommendedPaymentMethod: 
        usdcBalance > ethBalanceUSD ? 'USDC' : 
        ethBalanceUSD > 0 ? 'ETH' : 'insufficient',
      totalSpendingPower
    }
  }, [getTokenBySymbol])
  
  // Manual refresh function
  const refreshBalances = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    ethBalance.refetch()
    usdcBalance.refetch()
  }, [ethBalance, usdcBalance])
  
  // Loading and error states
  const isLoading = ethBalance.isLoading || usdcBalance.isLoading || ethPriceData.isLoading
  const error = ethBalance.error?.message || 
               usdcBalance.error?.message || 
               ethPriceData.error?.message || 
               null
  
  return {
    tokens,
    totalPortfolioValue,
    nativeBalance,
    stableBalance,
    isLoading,
    error,
    refreshBalances,
    getTokenBySymbol,
    hasInsufficientBalance,
    canAffordContentPrice,
    getPaymentCapabilities
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format token amount for display with appropriate precision
 */
export const formatTokenAmount = (
  amount: string | number, 
  symbol: string,
  maxDecimals: number = 4
): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (num === 0) return '0'
  
  // Use more precision for smaller amounts
  if (num < 0.001) return num.toFixed(6)
  if (num < 1) return num.toFixed(4)
  if (num < 1000) return num.toFixed(maxDecimals)
  
  // Use compact notation for large numbers
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  
  return num.toFixed(maxDecimals)
}

/**
 * Format USD value for display
 */
export const formatUSDValue = (amount: number): string => {
  if (amount === 0) return '$0.00'
  if (amount < 0.01) return '<$0.01'
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`
  
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

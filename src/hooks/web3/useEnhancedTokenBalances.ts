/**
 * Enhanced Token Balance Hook - Architectural Fix
 * 
 * This hook replaces the existing useTokenBalances with proper state management,
 * dependency handling, and loading state calculation to eliminate race conditions
 * and persistent loading states.
 * 
 * Key Architectural Improvements:
 * 1. Proper dependency chain management
 * 2. Accurate loading state calculation
 * 3. Error boundary handling
 * 4. Optimized caching strategy
 * 5. Connection state awareness
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useAccount, useBalance, useChainId, useReadContract } from 'wagmi'
import { formatUnits, type Address } from 'viem'
import { getContractAddresses, USDC_DECIMALS } from '@/lib/contracts/config'
import { PRICE_ORACLE_ABI } from '@/lib/contracts/abis'
import type { TokenInfo, TokenBalanceState, PaymentCapabilities } from './useTokenBalances'

// =============================================================================
// ENHANCED STATE MANAGEMENT
// =============================================================================

interface ConnectionState {
  readonly isConnected: boolean
  readonly hasValidChain: boolean
  readonly hasContractAddresses: boolean
  readonly isInitialized: boolean
}

interface LoadingState {
  readonly isConnecting: boolean
  readonly isLoadingBalances: boolean
  readonly isLoadingPrices: boolean
  readonly isInitializing: boolean
}

interface EnhancedTokenBalanceState extends TokenBalanceState {
  readonly connectionState: ConnectionState
  readonly loadingState: LoadingState
  readonly debug: {
    readonly queryStates: Record<string, unknown>
    readonly lastUpdate: Date
    readonly errorHistory: string[]
  }
}

// =============================================================================
// CONNECTION STATE MANAGEMENT
// =============================================================================

const useConnectionState = (address: Address | undefined, chainId: number): ConnectionState => {
  const [contractAddresses, setContractAddresses] = useState<ReturnType<typeof getContractAddresses> | null>(null)
  const [addressesError, setAddressesError] = useState<string | null>(null)

  // Load contract addresses when chain changes
  useEffect(() => {
    if (!chainId) {
      setContractAddresses(null)
      setAddressesError('No chain ID')
      return
    }

    try {
      const addresses = getContractAddresses(chainId)
      setContractAddresses(addresses)
      setAddressesError(null)
    } catch (error) {
      console.warn(`Failed to get contract addresses for chain ${chainId}:`, error)
      setContractAddresses(null)
      setAddressesError(error instanceof Error ? error.message : 'Unknown error')
    }
  }, [chainId])

  return useMemo((): ConnectionState => ({
    isConnected: !!address,
    hasValidChain: chainId === 8453 || chainId === 84532, // Base mainnet or testnet
    hasContractAddresses: !!contractAddresses && !addressesError,
    isInitialized: !!address && !!contractAddresses
  }), [address, chainId, contractAddresses, addressesError])
}

// =============================================================================
// ENHANCED PRICE ORACLE HOOK
// =============================================================================

const useEnhancedEthPrice = (
  connectionState: ConnectionState, 
  chainId: number
): { price: number; isLoading: boolean; error: Error | null } => {
  const [contractAddresses, setContractAddresses] = useState<ReturnType<typeof getContractAddresses> | null>(null)

  // Get contract addresses
  useEffect(() => {
    if (connectionState.hasContractAddresses) {
      try {
        setContractAddresses(getContractAddresses(chainId))
      } catch (error) {
        console.warn('Failed to get contract addresses:', error)
        setContractAddresses(null)
      }
    }
  }, [connectionState.hasContractAddresses, chainId])

  const priceQuery = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getETHPrice',
    args: [BigInt(1e6)], // 1 USDC
    query: {
      enabled: !!(
        connectionState.hasValidChain && 
        connectionState.hasContractAddresses && 
        contractAddresses?.PRICE_ORACLE
      ),
      refetchInterval: 30000,
      staleTime: 15000,
      retry: 3,
      retryDelay: 1000,
    }
  })

  return useMemo(() => {
    // Calculate price from oracle data
    let price = 2400 // Fallback price
    
    if (priceQuery.data && priceQuery.data > 0) {
      const ethForOneUSDC = Number(priceQuery.data) / 1e18
      price = ethForOneUSDC > 0 ? 1 / ethForOneUSDC : 2400
    }

    return {
      price,
      isLoading: priceQuery.isLoading && connectionState.hasContractAddresses,
      error: priceQuery.error
    }
  }, [priceQuery.data, priceQuery.isLoading, priceQuery.error, connectionState.hasContractAddresses])
}

// =============================================================================
// ENHANCED TOKEN BALANCE HOOK
// =============================================================================

export const useEnhancedTokenBalances = (): EnhancedTokenBalanceState => {
  const { address } = useAccount()
  const chainId = useChainId()
  const [refreshKey, setRefreshKey] = useState(0)
  const [errorHistory, setErrorHistory] = useState<string[]>([])
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Connection state management
  const connectionState = useConnectionState(address, chainId)
  
  // Contract addresses
  const contractAddresses = useMemo(() => {
    if (!connectionState.hasContractAddresses) return null
    try {
      return getContractAddresses(chainId)
    } catch {
      return null
    }
  }, [connectionState.hasContractAddresses, chainId])

  // Supported tokens configuration
  const supportedTokens = useMemo(() => {
    if (!contractAddresses) return []
    
    return [
      {
        address: '0x0000000000000000000000000000000000000000' as Address,
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        price: 0,
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
        price: 1.00,
        priceChange24h: 0.01,
        isNative: false,
        category: 'stablecoin' as const,
        logoURI: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86a33E6441946a7c26E0a1c68E6f4b2e69EE2/logo.png',
        isVerified: true
      }
    ]
  }, [contractAddresses])

  // ETH price data
  const ethPriceData = useEnhancedEthPrice(connectionState, chainId)
  
  // ETH balance query
  const ethBalance = useBalance({
    address,
    query: {
      enabled: connectionState.isInitialized,
      refetchInterval: 10000,
      staleTime: 5000,
      retry: 3,
    }
  })

  // USDC balance query
  const usdcToken = supportedTokens.find(t => t.symbol === 'USDC')
  const usdcBalance = useBalance({
    address,
    token: usdcToken?.address,
    query: {
      enabled: connectionState.isInitialized && !!usdcToken,
      refetchInterval: 10000,
      staleTime: 5000,
      retry: 3,
    }
  })

  // Enhanced loading state calculation
  const loadingState = useMemo((): LoadingState => {
    const isConnecting = !connectionState.isConnected
    const isInitializing = connectionState.isConnected && !connectionState.isInitialized
    const isLoadingBalances = (
      connectionState.isInitialized && 
      (ethBalance.isLoading || usdcBalance.isLoading)
    )
    const isLoadingPrices = (
      connectionState.isInitialized && 
      ethPriceData.isLoading
    )

    return {
      isConnecting,
      isLoadingBalances,
      isLoadingPrices,
      isInitializing
    }
  }, [
    connectionState,
    ethBalance.isLoading,
    usdcBalance.isLoading,
    ethPriceData.isLoading
  ])

  // Process tokens with balance and price data
  const tokens = useMemo((): TokenInfo[] => {
    if (!connectionState.isInitialized) return []

    return supportedTokens.map(token => {
      let balance = BigInt(0)
      
      if (token.isNative && ethBalance.data) {
        balance = ethBalance.data.value
      } else if (token.symbol === 'USDC' && usdcBalance.data) {
        balance = usdcBalance.data.value
      }
      
      const balanceFormatted = formatUnits(balance, token.decimals)
      const currentPrice = token.symbol === 'ETH' ? ethPriceData.price : token.price
      const balanceUSD = parseFloat(balanceFormatted) * currentPrice
      
      return {
        ...token,
        balance,
        balanceFormatted,
        balanceUSD,
        price: currentPrice,
        priceChange24h: token.symbol === 'ETH' ? 2.5 : token.priceChange24h
      }
    })
  }, [
    connectionState.isInitialized,
    supportedTokens,
    ethBalance.data,
    usdcBalance.data,
    ethPriceData.price
  ])

  // Calculate portfolio metrics
  const totalPortfolioValue = useMemo(() => {
    return tokens.reduce((total, token) => total + token.balanceUSD, 0)
  }, [tokens])

  const nativeBalance = useMemo(() => 
    tokens.find(token => token.isNative) || null, 
    [tokens]
  )

  const stableBalance = useMemo(() => 
    tokens.find(token => token.category === 'stablecoin') || null, 
    [tokens]
  )

  // Helper functions
  const getTokenBySymbol = useCallback((symbol: string): TokenInfo | undefined => {
    return tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase())
  }, [tokens])

  const hasInsufficientBalance = useCallback((requiredAmount: bigint, tokenSymbol: string): boolean => {
    const token = getTokenBySymbol(tokenSymbol)
    return !token || token.balance < requiredAmount
  }, [getTokenBySymbol])

  const canAffordContentPrice = useCallback((priceUSDC: bigint) => {
    const priceInUSD = Number(priceUSDC) / 1e6
    
    const usdcToken = getTokenBySymbol('USDC')
    const ethToken = getTokenBySymbol('ETH')
    
    const usdcBalance = usdcToken ? parseFloat(usdcToken.balanceFormatted) : 0
    const ethBalanceUSD = ethToken ? ethToken.balanceUSD : 0
    
    if (usdcBalance >= priceInUSD) {
      return {
        canAfford: true,
        suggestedPaymentMethod: 'USDC Direct Payment',
      }
    }
    
    if (ethBalanceUSD >= priceInUSD) {
      return {
        canAfford: true,
        suggestedPaymentMethod: 'ETH Payment (auto-swap to USDC)',
      }
    }
    
    const totalAvailable = usdcBalance + ethBalanceUSD
    const shortfall = priceInUSD - totalAvailable
    
    return {
      canAfford: false,
      suggestedPaymentMethod: 'Insufficient balance',
      shortfall: `$${shortfall.toFixed(2)}`
    }
  }, [getTokenBySymbol])

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

  const refreshBalances = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    setLastUpdate(new Date())
    ethBalance.refetch()
    usdcBalance.refetch()
  }, [ethBalance, usdcBalance])

  // Error handling and history tracking
  useEffect(() => {
    const errors = [
      ethBalance.error?.message,
      usdcBalance.error?.message,
      ethPriceData.error?.message
    ].filter((error): error is string => Boolean(error))

    if (errors.length > 0) {
      setErrorHistory(prev => [...prev.slice(-4), ...errors])
    }
  }, [ethBalance.error, usdcBalance.error, ethPriceData.error])

  // Overall loading and error state
  const isLoading = (
    loadingState.isConnecting ||
    loadingState.isInitializing ||
    loadingState.isLoadingBalances ||
    loadingState.isLoadingPrices
  )

  const error = (
    !connectionState.isConnected ? null :
    !connectionState.hasValidChain ? 'Unsupported network' :
    !connectionState.hasContractAddresses ? 'Contract addresses unavailable' :
    ethBalance.error?.message || 
    usdcBalance.error?.message || 
    ethPriceData.error?.message || 
    null
  )

  return {
    // Core token balance state
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
    getPaymentCapabilities,

    // Enhanced state
    connectionState,
    loadingState,
    debug: {
      queryStates: {
        ethBalance: {
          isLoading: ethBalance.isLoading,
          error: ethBalance.error?.message,
          data: ethBalance.data ? 'present' : 'missing'
        },
        usdcBalance: {
          isLoading: usdcBalance.isLoading,
          error: usdcBalance.error?.message,
          data: usdcBalance.data ? 'present' : 'missing'
        },
        ethPrice: {
          isLoading: ethPriceData.isLoading,
          error: ethPriceData.error?.message,
          price: ethPriceData.price
        }
      },
      lastUpdate,
      errorHistory
    }
  }
}

// Export utility functions and types
export { formatTokenAmount, formatUSDValue, type TokenInfo } from './useTokenBalances'
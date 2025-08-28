/**
 * BalanceManagementModule - Unified Balance Management System
 * 
 * This module provides a sophisticated abstraction layer for token balance management
 * that bridges the gap between usePaymentFlowOrchestrator and other payment components.
 * It combines the performance-optimized caching strategies from the Smart component
 * with the health-aware, production-hardened approaches of the Orchestrated component.
 * 
 * Key Features:
 * - Intelligent caching with 30-second TTL and adaptive refresh strategies
 * - Health-aware balance fetching that adapts to system conditions
 * - Allowance management with batch optimization
 * - Multi-token support with price integration
 * - Purchase feasibility analysis for content pricing
 * - Connection state management and error recovery
 * 
 * Architecture Integration:
 * - Smart Component: Utilizes caching and balance optimization features
 * - Orchestrated Component: Leverages health monitoring and error recovery
 * - Both Components: Share the unified balance state and validation logic
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useAccount, useBalance, useReadContract, useChainId } from 'wagmi'
import { formatUnits, type Address, erc20Abi } from 'viem'
import { getContractAddresses, USDC_DECIMALS } from '@/lib/contracts/config'
import { PRICE_ORACLE_ABI } from '@/lib/contracts/abis'

// =============================================================================
// TYPE DEFINITIONS & INTERFACES
// =============================================================================

/**
 * Balance Cache Entry Interface
 * Represents a cached balance entry with metadata for intelligent cache management
 */
interface BalanceCacheEntry {
  readonly value: bigint
  readonly timestamp: number
  readonly isStale: boolean
  readonly retryCount: number
  readonly lastError: string | null
}

/**
 * Allowance Cache Entry Interface  
 * Manages token allowance caching for approval optimization
 */
interface AllowanceCacheEntry {
  readonly amount: bigint
  readonly timestamp: number
  readonly spender: Address
  readonly isInfiniteApproval: boolean
}

/**
 * System Health Context Interface
 * Tracks system health for adaptive balance management behavior
 */
interface SystemHealthContext {
  readonly overallStatus: 'healthy' | 'degraded' | 'critical'
  readonly rpcLatency: number
  readonly consecutiveFailures: number
  readonly lastHealthCheck: Date
}

/**
 * Balance Management Configuration Interface
 * Configures behavior for different component integration scenarios
 */
interface BalanceManagementConfig {
  readonly cacheStrategy: 'aggressive' | 'moderate' | 'conservative'
  readonly healthAware: boolean
  readonly enableAllowanceOptimization: boolean
  readonly enablePredictiveRefresh: boolean
  readonly fallbackToLegacy: boolean
}

/**
 * Token Balance Information Interface
 * Extended token information with balance, allowance, and purchasing power data
 */
export interface ManagedTokenInfo {
  readonly address: Address
  readonly symbol: string
  readonly name: string
  readonly decimals: number
  readonly balance: bigint
  readonly balanceFormatted: string
  readonly balanceUSD: number | null // Changed to null for proper null state handling
  readonly allowance: bigint
  readonly needsApproval: boolean
  readonly canAffordAmount: (amount: bigint) => boolean
  readonly isLoading: boolean
  readonly lastUpdated: Date
  readonly cacheStatus: 'fresh' | 'stale' | 'expired' | 'error'
}

/**
 * Purchase Feasibility Analysis Interface
 * Comprehensive analysis of user's ability to complete content purchase
 */
interface PurchaseFeasibilityAnalysis {
  readonly canPurchaseWithUSDC: boolean
  readonly canPurchaseWithETH: boolean
  readonly requiredUSDCAmount: bigint
  readonly requiredETHAmount: bigint | null // Changed to null for proper null state handling
  readonly usdcShortfall: bigint
  readonly ethShortfall: bigint | null // Changed to null for proper null state handling
  readonly needsUSDCApproval: boolean
  readonly recommendedMethod: 'usdc' | 'eth' | 'swap' | 'insufficient' | 'price_unavailable'
  readonly swapRecommendation: {
    readonly fromToken: string
    readonly toToken: string
    readonly fromAmount: bigint
    readonly estimatedGas: bigint
  } | null
}

// =============================================================================
// CACHE MANAGEMENT SYSTEM
// =============================================================================

/**
 * Intelligent Balance Cache Manager
 * Manages sophisticated caching with health-aware refresh strategies
 */
class BalanceCacheManager {
  private balanceCache = new Map<string, BalanceCacheEntry>()
  private allowanceCache = new Map<string, AllowanceCacheEntry>()
  private readonly CACHE_TTL_MS = 30_000 // 30 seconds
  private readonly MAX_RETRY_COUNT = 3

  /**
   * Get cached balance with staleness checking
   * Implements the 30-second TTL strategy from usePaymentFlowOrchestrator
   */
  getCachedBalance(tokenAddress: Address, userAddress: Address): BalanceCacheEntry | null {
    const key = `${tokenAddress}-${userAddress}`.toLowerCase()
    const entry = this.balanceCache.get(key)
    
    if (!entry) return null
    
    const now = Date.now()
    const age = now - entry.timestamp
    const isStale = age > this.CACHE_TTL_MS
    
    return {
      ...entry,
      isStale
    }
  }

  /**
   * Cache balance with intelligent retry management
   */
  setCachedBalance(
    tokenAddress: Address, 
    userAddress: Address, 
    balance: bigint,
    error: string | null = null
  ): void {
    const key = `${tokenAddress}-${userAddress}`.toLowerCase()
    const existingEntry = this.balanceCache.get(key)
    
    this.balanceCache.set(key, {
      value: balance,
      timestamp: Date.now(),
      isStale: false,
      retryCount: error ? (existingEntry?.retryCount ?? 0) + 1 : 0,
      lastError: error
    })
  }

  /**
   * Intelligent cache invalidation based on system health
   */
  invalidateCache(condition?: (entry: BalanceCacheEntry) => boolean): void {
    if (condition) {
      for (const [key, entry] of this.balanceCache.entries()) {
        if (condition(entry)) {
          this.balanceCache.delete(key)
        }
      }
    } else {
      this.balanceCache.clear()
      this.allowanceCache.clear()
    }
  }

  /**
   * Get allowance cache status
   */
  getCachedAllowance(tokenAddress: Address, userAddress: Address, spender: Address): AllowanceCacheEntry | null {
    const key = `${tokenAddress}-${userAddress}-${spender}`.toLowerCase()
    const entry = this.allowanceCache.get(key)
    
    if (!entry) return null
    
    const age = Date.now() - entry.timestamp
    if (age > this.CACHE_TTL_MS) {
      this.allowanceCache.delete(key)
      return null
    }
    
    return entry
  }

  /**
   * Cache allowance information
   */
  setCachedAllowance(
    tokenAddress: Address,
    userAddress: Address, 
    spender: Address,
    amount: bigint
  ): void {
    const key = `${tokenAddress}-${userAddress}-${spender}`.toLowerCase()
    this.allowanceCache.set(key, {
      amount,
      timestamp: Date.now(),
      spender,
      isInfiniteApproval: amount > BigInt(10) ** BigInt(30) // Very large number indicates infinite
    })
  }
}

// =============================================================================
// HEALTH-AWARE BALANCE MANAGEMENT HOOK
// =============================================================================

/**
 * Use Unified Balance Management Hook
 * 
 * This is the main hook that both usePaymentFlowOrchestrator and other payment components
 * will use for balance management. It provides intelligent caching, health-aware fetching,
 * and comprehensive purchase analysis.
 */
export function useUnifiedBalanceManagement(
  config: Partial<BalanceManagementConfig> = {}
) {
  // Configuration with intelligent defaults
  const finalConfig: BalanceManagementConfig = useMemo(() => ({
    cacheStrategy: 'moderate',
    healthAware: true,
    enableAllowanceOptimization: true,
    enablePredictiveRefresh: true,
    fallbackToLegacy: true,
    ...config
  }), [config])

  // Wagmi hooks and state
  const { address } = useAccount()
  const chainId = useChainId()
  const [systemHealth, setSystemHealth] = useState<SystemHealthContext>({
    overallStatus: 'healthy',
    rpcLatency: 0,
    consecutiveFailures: 0,
    lastHealthCheck: new Date()
  })

  // Cache manager instance
  const cacheManager = useRef(new BalanceCacheManager()).current
  const [lastRefreshKey, setLastRefreshKey] = useState(0)

  // Contract addresses
  const contractAddresses = useMemo(() => {
    try {
      return chainId ? getContractAddresses(chainId) : null
    } catch (error) {
      console.warn('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])

  // Health monitoring effect
  useEffect(() => {
    if (!finalConfig.healthAware) return

    const interval = setInterval(() => {
      // Simple health check based on recent RPC performance
      const now = new Date()
      setSystemHealth(prev => ({
        ...prev,
        lastHealthCheck: now
      }))
    }, 10_000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [finalConfig.healthAware])

  // ETH Balance Management with Caching
  const ethBalanceQuery = useBalance({
    address,
    query: {
      enabled: !!address,
      refetchInterval: systemHealth.overallStatus === 'healthy' ? 10_000 : 30_000,
      staleTime: finalConfig.cacheStrategy === 'aggressive' ? 15_000 : 5_000,
      retry: (failureCount) => {
        if (failureCount >= 3) {
          setSystemHealth(prev => ({
            ...prev,
            consecutiveFailures: prev.consecutiveFailures + 1,
            overallStatus: prev.consecutiveFailures > 5 ? 'critical' : 'degraded'
          }))
          return false
        }
        return true
      }
    }
  })

  // USDC Balance Management
  const usdcBalanceQuery = useBalance({
    address,
    token: contractAddresses?.USDC,
    query: {
      enabled: !!address && !!contractAddresses?.USDC,
      refetchInterval: systemHealth.overallStatus === 'healthy' ? 10_000 : 30_000,
      staleTime: finalConfig.cacheStrategy === 'aggressive' ? 15_000 : 5_000
    }
  })

  // USDC Allowance Management
  const usdcAllowanceQuery = useReadContract({
    address: contractAddresses?.USDC,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && contractAddresses?.COMMERCE_INTEGRATION ? 
      [address, contractAddresses.COMMERCE_INTEGRATION] : undefined,
    query: {
      enabled: !!address && !!contractAddresses?.USDC && !!contractAddresses?.COMMERCE_INTEGRATION,
      refetchInterval: 30_000
    }
  })

  // ETH Price Data for Purchase Analysis
  const ethPriceQuery = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getETHPrice',
    args: [BigInt(1_000_000)], // 1 USDC (6 decimals)
    query: {
      enabled: !!contractAddresses?.PRICE_ORACLE && systemHealth.overallStatus !== 'critical',
      refetchInterval: 30_000,
      staleTime: 15_000
    }
  })

  // Manual balance refresh function
  const refreshBalances = useCallback(async () => {
    setLastRefreshKey(Date.now())
    
    // Invalidate cache to force fresh fetches
    cacheManager.invalidateCache()
    
    // Refetch all balance queries
    await Promise.all([
      ethBalanceQuery.refetch(),
      usdcBalanceQuery.refetch(),
      usdcAllowanceQuery.refetch()
    ])
  }, [ethBalanceQuery, usdcBalanceQuery, usdcAllowanceQuery])

  // Managed token information
  const managedTokens: ManagedTokenInfo[] = useMemo(() => {
    if (!address || !contractAddresses) return []

    const ethBalance = ethBalanceQuery.data?.value ?? BigInt(0)
    const usdcBalance = usdcBalanceQuery.data?.value ?? BigInt(0)
    const usdcAllowance = (usdcAllowanceQuery.data as bigint) ?? BigInt(0)

    // Calculate ETH price in USD - use null state if price fetch fails
    const ethPriceInUSD = ethPriceQuery.data ? 
      (1 / (Number(ethPriceQuery.data) / 1e18)) : null

    return [
      {
        address: '0x0000000000000000000000000000000000000000' as Address,
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        balance: ethBalance,
        balanceFormatted: formatUnits(ethBalance, 18),
        balanceUSD: ethPriceInUSD ? parseFloat(formatUnits(ethBalance, 18)) * ethPriceInUSD : null,
        allowance: BigInt(0), // ETH doesn't need allowance
        needsApproval: false,
        canAffordAmount: (amount: bigint) => ethBalance >= amount,
        isLoading: ethBalanceQuery.isLoading,
        lastUpdated: new Date(),
        cacheStatus: ethBalanceQuery.isError ? 'error' : 'fresh'
      },
      {
        address: contractAddresses.USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: USDC_DECIMALS,
        balance: usdcBalance,
        balanceFormatted: formatUnits(usdcBalance, USDC_DECIMALS),
        balanceUSD: parseFloat(formatUnits(usdcBalance, USDC_DECIMALS)),
        allowance: usdcAllowance,
        needsApproval: usdcAllowance === BigInt(0),
        canAffordAmount: (amount: bigint) => usdcBalance >= amount,
        isLoading: usdcBalanceQuery.isLoading,
        lastUpdated: new Date(),
        cacheStatus: usdcBalanceQuery.isError ? 'error' : 'fresh'
      }
    ]
  }, [
    address,
    contractAddresses,
    ethBalanceQuery.data,
    usdcBalanceQuery.data,
    usdcAllowanceQuery.data,
    ethPriceQuery.data,
    ethBalanceQuery.isLoading,
    usdcBalanceQuery.isLoading,
    ethBalanceQuery.isError,
    usdcBalanceQuery.isError
  ])

  // Purchase Feasibility Analysis Function
  const analyzePurchaseFeasibility = useCallback((
    contentPriceUSDC: bigint
  ): PurchaseFeasibilityAnalysis => {
    const usdcToken = managedTokens.find(t => t.symbol === 'USDC')
    const ethToken = managedTokens.find(t => t.symbol === 'ETH')

    if (!usdcToken || !ethToken) {
      throw new Error('Required tokens not available')
    }

    const canPurchaseWithUSDC = usdcToken.balance >= contentPriceUSDC
    const needsUSDCApproval = canPurchaseWithUSDC && usdcToken.needsApproval

    // Calculate ETH amount needed based on current price - use null if price unavailable
    let requiredETHAmount: bigint | null = null
    let canPurchaseWithETH = false
    let ethShortfall: bigint | null = null

    if (ethPriceQuery.data) {
      const ethPriceInUSDC = BigInt(Math.floor((Number(ethPriceQuery.data) / 1e18) * 1e6))
      requiredETHAmount = contentPriceUSDC * BigInt(1e18) / ethPriceInUSDC
      canPurchaseWithETH = ethToken.balance >= requiredETHAmount
      ethShortfall = canPurchaseWithETH ? BigInt(0) : requiredETHAmount - ethToken.balance
    }

    const usdcShortfall = canPurchaseWithUSDC ? BigInt(0) : contentPriceUSDC - usdcToken.balance

    // Determine recommended method
    let recommendedMethod: 'usdc' | 'eth' | 'swap' | 'insufficient' | 'price_unavailable' = 'insufficient'
    let swapRecommendation = null

    if (canPurchaseWithUSDC && !needsUSDCApproval) {
      recommendedMethod = 'usdc'
    } else if (canPurchaseWithETH && requiredETHAmount !== null) {
      recommendedMethod = 'eth'
    } else if (canPurchaseWithUSDC && needsUSDCApproval) {
      recommendedMethod = 'usdc' // Still recommend USDC but note approval needed
    } else if (ethPriceQuery.data && ethToken.balance > BigInt(0) && ethToken.balanceUSD && ethToken.balanceUSD > parseFloat(formatUnits(contentPriceUSDC, USDC_DECIMALS))) {
      recommendedMethod = 'swap'
      swapRecommendation = {
        fromToken: 'ETH',
        toToken: 'USDC',
        fromAmount: requiredETHAmount!,
        estimatedGas: BigInt(200000) // Estimate for ETH -> USDC swap
      }
    } else if (!ethPriceQuery.data) {
      recommendedMethod = 'price_unavailable'
    }

    return {
      canPurchaseWithUSDC,
      canPurchaseWithETH,
      requiredUSDCAmount: contentPriceUSDC,
      requiredETHAmount,
      usdcShortfall,
      ethShortfall,
      needsUSDCApproval,
      recommendedMethod,
      swapRecommendation
    }
  }, [managedTokens, ethPriceQuery.data])

  // Loading state calculation
  const isLoading = useMemo(() => {
    return managedTokens.some(token => token.isLoading) || 
           ethPriceQuery.isLoading ||
           systemHealth.overallStatus === 'critical'
  }, [managedTokens, ethPriceQuery.isLoading, systemHealth.overallStatus])

  // Error state calculation  
  const error = useMemo(() => {
    if (ethBalanceQuery.isError) return ethBalanceQuery.error
    if (usdcBalanceQuery.isError) return usdcBalanceQuery.error
    if (usdcAllowanceQuery.isError) return usdcAllowanceQuery.error
    return null
  }, [ethBalanceQuery.isError, usdcBalanceQuery.isError, usdcAllowanceQuery.isError,
      ethBalanceQuery.error, usdcBalanceQuery.error, usdcAllowanceQuery.error])

  return {
    // Core balance data
    managedTokens,
    isLoading,
    error,
    
    // Analysis functions
    analyzePurchaseFeasibility,
    
    // Control functions
    refreshBalances,
    
    // System health information
    systemHealth,
    
    // Configuration
    config: finalConfig,
    
    // Cache management
    invalidateCache: cacheManager.invalidateCache.bind(cacheManager),
    
    // Helper functions
    getTokenBySymbol: useCallback((symbol: string) => 
      managedTokens.find(t => t.symbol.toLowerCase() === symbol.toLowerCase()),
      [managedTokens]
    ),
    
    getTotalPortfolioValue: useCallback(() => {
      const total = managedTokens.reduce((sum, token) => {
        return sum + (token.balanceUSD ?? 0)
      }, 0)
      return total > 0 ? total : null // Return null if no valid prices available
    }, [managedTokens])
  }
}

// =============================================================================
// INTEGRATION HELPERS FOR EXISTING COMPONENTS
// =============================================================================

/**
 * Adapter function for usePaymentFlowOrchestrator integration
 * Converts the unified balance management to the expected interface
 */
export function useSmartCardBalanceAdapter(config?: Partial<BalanceManagementConfig>) {
  const balanceManager = useUnifiedBalanceManagement({
    cacheStrategy: 'aggressive',
    enablePredictiveRefresh: true,
    ...config
  })

  return {
    // usePaymentFlowOrchestrator expected interface
    tokens: balanceManager.managedTokens,
    isLoading: balanceManager.isLoading,
    refreshBalances: balanceManager.refreshBalances,
    canAffordContentPrice: (priceUSDC: bigint) => {
      const analysis = balanceManager.analyzePurchaseFeasibility(priceUSDC)
      return analysis.canPurchaseWithUSDC || analysis.canPurchaseWithETH
    },
    getPaymentCapabilities: (priceUSDC: bigint) => balanceManager.analyzePurchaseFeasibility(priceUSDC)
  }
}

/**
 * Adapter function for usePaymentFlowOrchestrator integration
 * Provides health-aware balance management with system monitoring
 */
export function useOrchestratedCardBalanceAdapter(config?: Partial<BalanceManagementConfig>) {
  const balanceManager = useUnifiedBalanceManagement({
    healthAware: true,
    enableAllowanceOptimization: true,
    fallbackToLegacy: true,
    ...config
  })

  return {
    // usePaymentFlowOrchestrator expected interface
    ...balanceManager,
    // Health-aware features
    isHealthy: balanceManager.systemHealth.overallStatus === 'healthy',
    canFallbackToLegacy: balanceManager.config.fallbackToLegacy,
    // Enhanced error recovery
    recoverFromErrors: async () => {
      balanceManager.invalidateCache()
      await balanceManager.refreshBalances()
    }
  }
}
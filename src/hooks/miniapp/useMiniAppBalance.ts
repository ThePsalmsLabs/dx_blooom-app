/**
 * Mini App Balance Management Hook
 * File: src/hooks/miniapp/useMiniAppBalance.ts
 * 
 * Provides comprehensive balance checking and payment capabilities specifically 
 * for the mini app context, integrating with Farcaster wallet connection.
 * 
 * Based on the web version's useTokenBalances.ts but optimized for mini app:
 * - Uses Farcaster wallet instead of Privy
 * - Simplified for USDC primary payments
 * - Optimized for mobile/mini app performance
 * - Consistent error handling across mini app
 */

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useBalance, useChainId, useReadContract } from 'wagmi'
import { formatUnits, type Address } from 'viem'
import { useFarcasterAutoWallet } from './useFarcasterAutoWallet'
import { getSafeAddress } from '@/lib/utils/wallet-utils'
import { getContractAddresses, USDC_DECIMALS } from '@/lib/contracts/config'
import { PRICE_ORACLE_ABI } from '@/lib/contracts/abis'

// =============================================================================
// TYPE DEFINITIONS - Mini App Focused
// =============================================================================

export interface MiniAppTokenInfo {
  readonly symbol: string
  readonly name: string
  readonly balance: bigint
  readonly balanceFormatted: string
  readonly balanceUSD: number
  readonly canPayWith: boolean
}

export interface MiniAppBalanceState {
  readonly usdcBalance: MiniAppTokenInfo | null
  readonly ethBalance: MiniAppTokenInfo | null
  readonly totalSpendingPower: number
  readonly isLoading: boolean
  readonly error: string | null
  readonly refreshBalances: () => void
  readonly hasInsufficientBalance: (requiredAmountUSDC: bigint) => boolean
  readonly canAffordContent: (priceUSDC: bigint) => {
    canAfford: boolean
    suggestedMethod: string
    shortfallUSD?: string
    balanceDetails: {
      usdcAvailable: string
      ethAvailableUSD: string
      totalAvailable: string
      priceRequired: string
    }
  }
  readonly getInsufficientBalanceMessage: (priceUSDC: bigint) => string
}

// =============================================================================
// MINI APP BALANCE HOOK
// =============================================================================

/**
 * Mini App Balance Hook
 * 
 * Provides balance checking optimized for mini app purchase flows.
 * Integrates with Farcaster wallet and provides clear user feedback.
 */
export function useMiniAppBalance(): MiniAppBalanceState {
  const chainId = useChainId()
  const walletUI = useFarcasterAutoWallet()
  const userAddress = getSafeAddress(walletUI.address)
  const [refreshKey, setRefreshKey] = useState(0)

  // Get contract addresses
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])

  // ETH Balance
  const ethBalanceQuery = useBalance({
    address: userAddress,
    query: {
      refetchInterval: 15000,
      staleTime: 10000,
      enabled: !!userAddress,
      retry: 2
    }
  })

  // USDC Balance
  const usdcBalanceQuery = useBalance({
    address: userAddress,
    token: contractAddresses?.USDC,
    query: {
      refetchInterval: 15000,
      staleTime: 10000,
      enabled: !!userAddress && !!contractAddresses?.USDC,
      retry: 2
    }
  })

  // Real ETH price from price oracle (same as web version)
  const ethPriceQuery = useReadContract({
    address: contractAddresses?.PRICE_ORACLE,
    abi: PRICE_ORACLE_ABI,
    functionName: 'getETHPrice',
    args: [BigInt(1e6)], // 1 USDC
    query: {
      refetchInterval: 30000,
      staleTime: 15000,
      retry: false, // Don't retry on price oracle failures to prevent spam
      enabled: !!contractAddresses?.PRICE_ORACLE,
    }
  })
  
  // Calculate ETH price with fallback
  const ethPriceUSD = useMemo(() => {
    if (!ethPriceQuery.data || ethPriceQuery.data <= 0) {
      // Fallback price if oracle fails - use a reasonable estimate
      console.warn('Price oracle unavailable, using fallback ETH price')
      return 2400
    }
    
    // Calculate USD price: if 1 USDC = X ETH, then 1 ETH = 1/X USDC
    const ethForOneUSDC = Number(ethPriceQuery.data) / 1e18
    const price = 1 / ethForOneUSDC
    
    return price > 0 ? price : 2400 // Additional safety check
  }, [ethPriceQuery.data])

  // Process token information
  const ethBalance: MiniAppTokenInfo | null = useMemo(() => {
    if (!ethBalanceQuery.data) return null

    const balance = ethBalanceQuery.data.value
    const balanceFormatted = formatUnits(balance, 18)
    const balanceUSD = parseFloat(balanceFormatted) * ethPriceUSD

    return {
      symbol: 'ETH',
      name: 'Ethereum',
      balance,
      balanceFormatted: parseFloat(balanceFormatted).toFixed(4),
      balanceUSD,
      canPayWith: balance > 0
    }
  }, [ethBalanceQuery.data, ethPriceUSD])

  const usdcBalance: MiniAppTokenInfo | null = useMemo(() => {
    if (!usdcBalanceQuery.data) return null

    const balance = usdcBalanceQuery.data.value
    const balanceFormatted = formatUnits(balance, USDC_DECIMALS)
    const balanceUSD = parseFloat(balanceFormatted) // USDC is 1:1 with USD

    return {
      symbol: 'USDC',
      name: 'USD Coin',
      balance,
      balanceFormatted: parseFloat(balanceFormatted).toFixed(2),
      balanceUSD,
      canPayWith: balance > 0
    }
  }, [usdcBalanceQuery.data])

  // Total spending power
  const totalSpendingPower = useMemo(() => {
    const usdcValue = usdcBalance?.balanceUSD || 0
    const ethValue = ethBalance?.balanceUSD || 0
    return usdcValue + ethValue
  }, [usdcBalance?.balanceUSD, ethBalance?.balanceUSD])

  // Check if user has insufficient balance for specific amount
  const hasInsufficientBalance = useCallback((requiredAmountUSDC: bigint): boolean => {
    const requiredUSD = Number(requiredAmountUSDC) / 1e6
    return totalSpendingPower < requiredUSD
  }, [totalSpendingPower])

  // Comprehensive affordability check
  const canAffordContent = useCallback((priceUSDC: bigint) => {
    const priceUSD = Number(priceUSDC) / 1e6
    const usdcAvailable = usdcBalance?.balanceUSD || 0
    const ethAvailableUSD = ethBalance?.balanceUSD || 0

    const balanceDetails = {
      usdcAvailable: usdcAvailable.toFixed(2),
      ethAvailableUSD: ethAvailableUSD.toFixed(2),
      totalAvailable: totalSpendingPower.toFixed(2),
      priceRequired: priceUSD.toFixed(2)
    }

    // Can pay with USDC directly
    if (usdcAvailable >= priceUSD) {
      return {
        canAfford: true,
        suggestedMethod: 'USDC',
        balanceDetails
      }
    }

    // Can pay with ETH (would need swap - simplified for mini app)
    if (ethAvailableUSD >= priceUSD) {
      return {
        canAfford: true,
        suggestedMethod: 'ETH (requires swap to USDC)',
        balanceDetails
      }
    }

    // Insufficient balance
    const shortfall = priceUSD - totalSpendingPower
    return {
      canAfford: false,
      suggestedMethod: 'Insufficient balance',
      shortfallUSD: shortfall.toFixed(2),
      balanceDetails
    }
  }, [usdcBalance?.balanceUSD, ethBalance?.balanceUSD, totalSpendingPower])

  // Generate user-friendly insufficient balance message
  const getInsufficientBalanceMessage = useCallback((priceUSDC: bigint): string => {
    const result = canAffordContent(priceUSDC)
    
    if (result.canAfford) return ''
    
    const { balanceDetails, shortfallUSD } = result
    
    if (totalSpendingPower === 0) {
      return `You need $${balanceDetails.priceRequired} USDC to purchase this content. Your wallet appears to be empty.`
    }
    
    return `Insufficient balance. You have $${balanceDetails.totalAvailable} (USDC: $${balanceDetails.usdcAvailable}, ETH: $${balanceDetails.ethAvailableUSD}) but need $${balanceDetails.priceRequired}. You're short $${shortfallUSD}.`
  }, [canAffordContent, totalSpendingPower])

  // Manual refresh function
  const refreshBalances = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    ethBalanceQuery.refetch()
    usdcBalanceQuery.refetch()
  }, [ethBalanceQuery, usdcBalanceQuery])

  // Loading and error states
  const isLoading = ethBalanceQuery.isLoading || usdcBalanceQuery.isLoading || ethPriceQuery.isLoading
  const error = ethBalanceQuery.error?.message || 
               usdcBalanceQuery.error?.message || 
               ethPriceQuery.error?.message ||
               null

  // Debug logging for mini app
  useEffect(() => {
    if (!isLoading && userAddress) {
      console.log('🏦 Mini app balance state:', {
        userAddress: userAddress,
        usdcBalance: usdcBalance?.balanceFormatted || '0',
        ethBalance: ethBalance?.balanceFormatted || '0',
        totalSpendingPower: totalSpendingPower.toFixed(2),
        isLoading,
        error
      })
    }
  }, [userAddress, usdcBalance?.balanceFormatted, ethBalance?.balanceFormatted, totalSpendingPower, isLoading, error])

  return {
    usdcBalance,
    ethBalance,
    totalSpendingPower,
    isLoading,
    error,
    refreshBalances,
    hasInsufficientBalance,
    canAffordContent,
    getInsufficientBalanceMessage
  }
}

/**
 * Utility function to format balance for display
 */
export function formatBalanceDisplay(balance: MiniAppTokenInfo | null): string {
  if (!balance) return '0.00'
  return `${balance.balanceFormatted} ${balance.symbol}`
}

/**
 * Utility function to check if user can make any purchases
 */
export function canMakeAnyPurchase(balanceState: MiniAppBalanceState): boolean {
  return balanceState.totalSpendingPower > 0
}
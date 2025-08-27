import { useMemo } from 'react'
import { formatEther } from 'viem'

interface NFTOptions {
  enabled: boolean
  mintPrice: bigint
  maxSupply: number
  royalty?: number
}

interface RevenueProjection {
  subscription: number
  nftMints: number
  royalties: number
  total: number
  increase: number
  breakdown: {
    subscriptionPercentage: number
    nftPercentage: number
    royaltyPercentage: number
  }
}

interface UseRevenueCalculatorProps {
  nftOptions: NFTOptions
  subscriptionRevenue: number
  ethPrice?: number
  mintRate?: number
  tradingVolume?: number
  royaltyRate?: number
}

export function useRevenueCalculator({
  nftOptions,
  subscriptionRevenue,
  ethPrice = 2000, // Default ETH price assumption
  mintRate = 0.1, // 10% of max supply gets minted
  tradingVolume = 0.2, // 20% of minted NFTs get traded
  royaltyRate = 0.05 // 5% royalty rate
}: UseRevenueCalculatorProps): RevenueProjection | null {
  
  const projection = useMemo(() => {
    if (!nftOptions.enabled) return null
    
    // Calculate NFT mint revenue
    const nftMintRevenue = Number(formatEther(nftOptions.mintPrice)) * 
      (nftOptions.maxSupply * mintRate) * ethPrice
    
    // Calculate royalty revenue
    const royaltyRevenue = nftMintRevenue * royaltyRate * tradingVolume
    
    // Calculate total revenue
    const total = subscriptionRevenue + nftMintRevenue + royaltyRevenue
    
    // Calculate percentage increase
    const increase = Math.round(((nftMintRevenue + royaltyRevenue) / subscriptionRevenue) * 100)
    
    // Calculate breakdown percentages
    const breakdown = {
      subscriptionPercentage: Math.round((subscriptionRevenue / total) * 100),
      nftPercentage: Math.round((nftMintRevenue / total) * 100),
      royaltyPercentage: Math.round((royaltyRevenue / total) * 100)
    }
    
    return {
      subscription: subscriptionRevenue,
      nftMints: nftMintRevenue,
      royalties: royaltyRevenue,
      total,
      increase,
      breakdown
    }
  }, [
    nftOptions.enabled,
    nftOptions.mintPrice,
    nftOptions.maxSupply,
    subscriptionRevenue,
    ethPrice,
    mintRate,
    tradingVolume,
    royaltyRate
  ])

  return projection
}

// Helper hook for real-time ETH price
export function useETHPrice() {
  // This would typically fetch from an API like CoinGecko
  // For now, returning a static value
  return 2000
}

// Helper hook for market assumptions
export function useMarketAssumptions() {
  return {
    mintRate: 0.1, // 10% of max supply gets minted
    tradingVolume: 0.2, // 20% of minted NFTs get traded
    royaltyRate: 0.05, // 5% royalty rate
    averageHoldTime: 30, // days
    secondaryMarketMultiplier: 1.5 // Average secondary sale price vs mint price
  }
}

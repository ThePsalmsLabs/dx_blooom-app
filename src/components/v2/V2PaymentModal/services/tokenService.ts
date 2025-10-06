/**
 * Token Service for V2 Payment Modal
 * 
 * Manages popular Base mainnet tokens and provides API integration
 * for fetching token information and metadata
 */

import { type Address } from 'viem'

export interface TokenInfo {
  address: Address
  symbol: string
  name: string
  decimals: number
  logo?: string
  logoURI?: string
  description: string
  category: 'stablecoin' | 'native' | 'defi' | 'meme' | 'gaming' | 'ai'
  isRecommended: boolean
  isPopular: boolean
  tags: string[]
  
  // Market data (can be fetched from API)
  price?: number
  marketCap?: number
  volume24h?: number
  priceChange24h?: number
  
  // Metadata
  website?: string
  twitter?: string
  coingeckoId?: string
  isVerified?: boolean
}

// Popular Base mainnet tokens with real contract addresses
export const BASE_MAINNET_POPULAR_TOKENS: TokenInfo[] = [
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: '💵',
    logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
    description: 'Most liquid stablecoin on Base',
    category: 'stablecoin',
    isRecommended: true,
    isPopular: true,
    tags: ['stable', 'popular', 'low-fee', 'payments'],
    coingeckoId: 'usd-coin',
    isVerified: true
  },
  {
    address: '0x4200000000000000000000000000000000000006' as Address,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logo: '🔷',
    logoURI: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png',
    description: 'Wrapped ETH for DeFi compatibility',
    category: 'native',
    isRecommended: true,
    isPopular: true,
    tags: ['eth', 'native', 'defi', 'wrapped'],
    coingeckoId: 'weth',
    isVerified: true
  },
  {
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as Address,
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logo: '🟡',
    logoURI: 'https://assets.coingecko.com/coins/images/9956/thumb/4943.png',
    description: 'Decentralized stablecoin from MakerDAO',
    category: 'stablecoin',
    isRecommended: false,
    isPopular: true,
    tags: ['stable', 'defi', 'decentralized', 'makerdao'],
    coingeckoId: 'dai',
    isVerified: true
  },
  {
    address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22' as Address,
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    decimals: 18,
    logo: '🟦',
    logoURI: 'https://assets.coingecko.com/coins/images/27008/thumb/cbeth.png',
    description: 'Liquid staking derivative from Coinbase',
    category: 'defi',
    isRecommended: false,
    isPopular: true,
    tags: ['staking', 'liquid', 'coinbase', 'yield'],
    coingeckoId: 'coinbase-wrapped-staked-eth',
    isVerified: true
  },
  {
    address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA' as Address,
    symbol: 'USDbC',
    name: 'USD Base Coin',
    decimals: 6,
    logo: '🅱️',
    logoURI: 'https://basescan.org/token/images/usdbasecoin_32.png',
    description: 'Base-native bridged USDC',
    category: 'stablecoin',
    isRecommended: false,
    isPopular: true,
    tags: ['stable', 'bridge', 'base', 'legacy'],
    isVerified: true
  },
  {
    address: '0x940181a94A35A4569E4529Cf3480A7E5c9e7d6A8' as Address,
    symbol: 'AERO',
    name: 'Aerodrome Finance',
    decimals: 18,
    logo: '✈️',
    logoURI: 'https://assets.coingecko.com/coins/images/31745/thumb/token.png',
    description: 'Base DEX governance token',
    category: 'defi',
    isRecommended: false,
    isPopular: true,
    tags: ['dex', 'governance', 'base', 'yield'],
    coingeckoId: 'aerodrome-finance',
    isVerified: true
  },
  {
    address: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b' as Address,
    symbol: 'WELL',
    name: 'Moonwell',
    decimals: 18,
    logo: '🌙',
    logoURI: 'https://assets.coingecko.com/coins/images/25469/thumb/moonwell.png',
    description: 'Base lending protocol token',
    category: 'defi',
    isRecommended: false,
    isPopular: true,
    tags: ['lending', 'defi', 'base', 'governance'],
    coingeckoId: 'moonwell',
    isVerified: true
  },
  {
    address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42' as Address,
    symbol: 'EULER',
    name: 'Euler',
    decimals: 18,
    logo: '🔺',
    logoURI: 'https://assets.coingecko.com/coins/images/26149/thumb/YCvKDfl8_400x400.jpeg',
    description: 'Permissionless lending protocol',
    category: 'defi',
    isRecommended: false,
    isPopular: true,
    tags: ['lending', 'defi', 'permissionless'],
    coingeckoId: 'euler',
    isVerified: true
  },
  {
    address: '0x532f27101965dd16442E59d40670FaF5eBB142E4' as Address,
    symbol: 'BRETT',
    name: 'Brett',
    decimals: 18,
    logo: '🐸',
    logoURI: 'https://assets.coingecko.com/coins/images/35138/thumb/brett.png',
    description: 'Popular Base meme token',
    category: 'meme',
    isRecommended: false,
    isPopular: true,
    tags: ['meme', 'community', 'base', 'pepe'],
    coingeckoId: 'brett',
    isVerified: true
  },
  {
    address: '0x04D5ddf5f3a8939889F11E97f8c4BB48317F1938' as Address,
    symbol: 'TOSHI',
    name: 'Toshi',
    decimals: 18,
    logo: '🐕',
    logoURI: 'https://basescan.org/token/images/toshi_32.png',
    description: 'Base ecosystem meme token',
    category: 'meme',
    isRecommended: false,
    isPopular: false,
    tags: ['meme', 'base', 'dog', 'community'],
    coingeckoId: 'toshi-base',
    isVerified: true
  }
]

// Token search and filtering utilities
export class TokenService {
  private tokens: TokenInfo[] = BASE_MAINNET_POPULAR_TOKENS
  
  /**
   * Get all supported tokens
   */
  getAllTokens(): TokenInfo[] {
    return this.tokens
  }
  
  /**
   * Get recommended tokens
   */
  getRecommendedTokens(): TokenInfo[] {
    return this.tokens.filter(token => token.isRecommended)
  }
  
  /**
   * Get popular tokens
   */
  getPopularTokens(): TokenInfo[] {
    return this.tokens.filter(token => token.isPopular)
  }
  
  /**
   * Get tokens by category
   */
  getTokensByCategory(category: TokenInfo['category']): TokenInfo[] {
    return this.tokens.filter(token => token.category === category)
  }
  
  /**
   * Search tokens by query
   */
  searchTokens(query: string): TokenInfo[] {
    const lowerQuery = query.toLowerCase()
    return this.tokens.filter(token =>
      token.symbol.toLowerCase().includes(lowerQuery) ||
      token.name.toLowerCase().includes(lowerQuery) ||
      token.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      token.description.toLowerCase().includes(lowerQuery)
    )
  }
  
  /**
   * Get token by address
   */
  getTokenByAddress(address: Address): TokenInfo | undefined {
    return this.tokens.find(token => 
      token.address.toLowerCase() === address.toLowerCase()
    )
  }
  
  /**
   * Fetch token data from CoinGecko API
   */
  async fetchTokenPrice(coingeckoId: string): Promise<{
    price: number
    marketCap: number
    volume24h: number
    priceChange24h: number
  } | null> {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const tokenData = data[coingeckoId]
      
      if (!tokenData) {
        return null
      }
      
      return {
        price: tokenData.usd || 0,
        marketCap: tokenData.usd_market_cap || 0,
        volume24h: tokenData.usd_24h_vol || 0,
        priceChange24h: tokenData.usd_24h_change || 0
      }
    } catch (error) {
      console.warn(`Failed to fetch price for ${coingeckoId}:`, error)
      return null
    }
  }
  
  /**
   * Fetch token metadata from contract address (using alternative API)
   */
  async fetchTokenByAddress(address: Address): Promise<TokenInfo | null> {
    try {
      // You could use services like:
      // - 1inch API: https://api.1inch.io/v5.0/8453/tokens
      // - DefiLlama: https://coins.llama.fi/prices/current/base:${address}
      // - Moralis: https://deep-index.moralis.io/api/v2/erc20/metadata
      
      // For now, return null to indicate external token search
      // This would be implemented based on your preferred API service
      return null
    } catch (error) {
      console.warn(`Failed to fetch token metadata for ${address}:`, error)
      return null
    }
  }
  
  /**
   * Add external token to local cache
   */
  addToken(token: TokenInfo): void {
    const existingIndex = this.tokens.findIndex(t => 
      t.address.toLowerCase() === token.address.toLowerCase()
    )
    
    if (existingIndex >= 0) {
      this.tokens[existingIndex] = token
    } else {
      this.tokens.push(token)
    }
  }
  
  /**
   * Get token categories
   */
  getCategories(): Array<{ category: TokenInfo['category'], count: number }> {
    const categories: Record<string, number> = {}
    
    this.tokens.forEach(token => {
      categories[token.category] = (categories[token.category] || 0) + 1
    })
    
    return Object.entries(categories).map(([category, count]) => ({
      category: category as TokenInfo['category'],
      count
    }))
  }
}

// Export singleton instance
export const tokenService = new TokenService()

// Export utility functions
export const formatPrice = (price: number): string => {
  if (price < 0.01) {
    return `$${price.toFixed(6)}`
  } else if (price < 1) {
    return `$${price.toFixed(4)}`
  } else {
    return `$${price.toFixed(2)}`
  }
}

export const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`
  } else if (marketCap >= 1e3) {
    return `$${(marketCap / 1e3).toFixed(2)}K`
  } else {
    return `$${marketCap.toFixed(2)}`
  }
}

export const formatPriceChange = (change: number): string => {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export default tokenService
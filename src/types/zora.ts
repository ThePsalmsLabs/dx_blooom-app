// src/types/zora.ts
/**
 * Zora Integration Types
 * 
 * This file defines all the types needed for the Zora NFT integration,
 * extending your existing content and creator types with NFT-specific fields.
 */

import { Address } from 'viem'
import type { Content, Creator } from './contracts'

// ===== ZORA NFT METADATA TYPES =====

/**
 * Zora NFT Metadata Structure
 * This extends your existing content metadata to include NFT-specific fields
 */
export interface ZoraNFTMetadata {
  // Standard NFT metadata
  name: string
  description: string
  image: string
  external_url?: string
  animation_url?: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
  
  // Platform-specific metadata
  content_id: string
  creator_address: Address
  original_publish_date: string
  subscription_tier?: string
  content_category: string
  platform: 'onchain-content-platform'
  
  // Zora-specific fields
  mint_price?: string
  max_supply?: number
  royalty_percentage?: number
}

/**
 * Zora Collection Configuration
 */
export interface ZoraCollectionConfig {
  name: string
  description: string
  contractURI: string
  creator: Address
  royaltyBPS: number // basis points (500 = 5%)
  defaultPrice: bigint // in wei
  maxSupply: number
  publicSaleStart?: Date
  publicSaleEnd?: Date
}

/**
 * NFT Minting Result
 */
export interface NFTMintResult {
  success: boolean
  transactionHash?: string
  contractAddress?: Address
  tokenId?: bigint
  mintPrice?: bigint
  error?: string
}

// ===== DATABASE INTEGRATION TYPES =====

/**
 * Content NFT Tracking Record
 * 
 * This extends your existing Content interface with NFT-specific fields
 * that need to be tracked in your database.
 */
export interface ContentNFTRecord {
  // Core content identification
  contentId: bigint
  creatorAddress: Address
  originalContent: Content
  
  // NFT-specific fields
  isMintedAsNFT: boolean
  nftContractAddress?: Address
  nftTokenId?: bigint
  nftMintPrice?: bigint
  nftMaxSupply?: number
  nftTotalMinted?: bigint
  nftMetadata?: ZoraNFTMetadata
  
  // Minting transaction details
  mintTransactionHash?: string
  mintTimestamp?: Date
  
  // Analytics and tracking
  nftViews: number
  nftMints: number
  nftRevenue: bigint
  lastMintDate?: Date
  
  // Status tracking
  nftStatus: 'not_minted' | 'minting' | 'minted' | 'mint_failed'
  nftError?: string
  
  // Timestamps
  lastUpdated: Date
}

/**
 * Creator Zora Collection Record
 * 
 * This extends your existing Creator interface with Zora collection information
 * that needs to be tracked in your database.
 */
export interface CreatorZoraCollection {
  // Core creator identification
  creatorAddress: Address
  creatorProfile: Creator
  
  // Zora collection details
  hasZoraCollection: boolean
  zoraCollectionAddress?: Address
  zoraCollectionName?: string
  zoraCollectionDescription?: string
  zoraCollectionURI?: string
  
  // Collection configuration
  royaltyBPS?: number
  defaultMintPrice?: bigint
  maxSupply?: number
  
  // Collection analytics
  totalNFTsMinted: number
  totalCollectionVolume: bigint
  totalMints: bigint
  averageMintPrice: bigint
  
  // Status tracking
  collectionStatus: 'not_created' | 'creating' | 'active' | 'paused' | 'error'
  collectionError?: string
  
  // Timestamps
  collectionCreatedAt?: Date
  lastMintDate?: Date
  lastUpdated: Date
}

/**
 * NFT Analytics and Performance Data
 */
export interface NFTAnalytics {
  // NFT metrics
  totalMints: bigint
  totalVolume: bigint
  averagePrice: bigint
  uniqueMinters: number
  
  // Subscription metrics
  totalSubscribers: bigint
  subscriptionRevenue: bigint
  averageSubscriptionPrice: bigint
  
  // Combined metrics
  totalRevenue: bigint
  totalEngagement: bigint
  revenuePerUser: bigint
  
  // Time-based analytics
  mintsLast24h: bigint
  volumeLast24h: bigint
  mintsLast7d: bigint
  volumeLast7d: bigint
  mintsLast30d: bigint
  volumeLast30d: bigint
  
  // Performance indicators
  mintTrend: 'increasing' | 'decreasing' | 'stable'
  volumeTrend: 'increasing' | 'decreasing' | 'stable'
  conversionRate: number // mints per view
  
  // Social metrics (if available)
  socialShares: number
  socialEngagement: number
  discoverySource: 'zora_feed' | 'social_share' | 'direct_link' | 'marketplace'
}

// ===== API RESPONSE TYPES =====

/**
 * API Response for NFT Status Check
 */
export interface NFTStatusResponse {
  success: boolean
  data?: {
    isMinted: boolean
    nftRecord?: ContentNFTRecord
    analytics?: NFTAnalytics
  }
  error?: string
}

/**
 * API Response for Collection Status Check
 */
export interface CollectionStatusResponse {
  success: boolean
  data?: {
    hasCollection: boolean
    collectionRecord?: CreatorZoraCollection
  }
  error?: string
}

/**
 * API Response for NFT Minting
 */
export interface NFTMintResponse {
  success: boolean
  data?: {
    transactionHash: string
    tokenId: bigint
    contractAddress: Address
    mintPrice: bigint
    nftRecord: ContentNFTRecord
  }
  error?: string
}

// ===== HOOK INTERFACE TYPES =====

/**
 * NFT Status Hook Return Type
 */
export interface NFTStatusHookResult {
  // Status data
  isMinted: boolean
  nftRecord?: ContentNFTRecord
  analytics?: NFTAnalytics
  
  // Loading and error states
  isLoading: boolean
  error: string | null
  
  // Actions
  refreshStatus: () => Promise<void>
  mintAsNFT: (options: NFTMintOptions) => Promise<NFTMintResult>
}

/**
 * Collection Management Hook Return Type
 */
export interface CollectionManagementHookResult {
  // Collection data
  hasCollection: boolean
  collectionRecord?: CreatorZoraCollection
  
  // Loading and error states
  isLoading: boolean
  error: string | null
  
  // Actions
  createCollection: (config: ZoraCollectionConfig) => Promise<Address>
  refreshCollection: () => Promise<void>
}

/**
 * NFT Minting Options
 */
export interface NFTMintOptions {
  mintPrice?: bigint
  maxSupply?: number
  royaltyPercentage?: number
  metadata?: Partial<ZoraNFTMetadata>
}

// ===== UTILITY TYPES =====

/**
 * NFT Discovery and Filtering Options
 */
export interface NFTDiscoveryOptions {
  category?: string
  creatorAddress?: Address
  priceRange?: {
    min: bigint
    max: bigint
  }
  mintStatus?: 'available' | 'sold_out' | 'all'
  sortBy?: 'price' | 'recent' | 'popular' | 'trending'
  limit?: number
  offset?: number
}

/**
 * NFT Performance Comparison
 */
export interface NFTPerformanceComparison {
  contentId: bigint
  subscriptionMetrics: {
    subscribers: bigint
    subscriptionRevenue: bigint
    averageSubscriptionPrice: bigint
  }
  nftMetrics: {
    mints: bigint
    nftRevenue: bigint
    averageMintPrice: bigint
  }
  combinedMetrics: {
    totalRevenue: bigint
    totalEngagement: bigint
    revenuePerUser: bigint
  }
}

// src/services/zora/ZoraDatabaseService.ts
/**
 * Zora Database Service
 * 
 * This service handles all database operations related to Zora NFT integration,
 * including tracking NFT mints, collection management, and analytics.
 * 
 * Since your platform doesn't have a traditional database setup, this service
 * provides an abstraction layer that can work with:
 * 1. Local storage for development
 * 2. IPFS for decentralized storage
 * 3. Future database integrations
 * 4. Subgraph queries for on-chain data
 */

import { Address } from 'viem'
import type { 
  ContentNFTRecord, 
  CreatorZoraCollection, 
  NFTAnalytics,
  ZoraNFTMetadata,
  NFTMintOptions,
  NFTDiscoveryOptions,
  NFTPerformanceComparison
} from '@/types/zora'
import type { Content, Creator } from '@/types/contracts'

/**
 * Database Storage Interface
 * 
 * This interface abstracts the storage layer so we can easily switch
 * between different storage backends (localStorage, IPFS, database, etc.)
 */
interface StorageBackend {
  get(key: string): Promise<any>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  list(prefix: string): Promise<string[]>
}

/**
 * Local Storage Backend Implementation
 * 
 * Uses browser localStorage for development and testing
 */
class LocalStorageBackend implements StorageBackend {
  private prefix = 'zora_integration_'

  async get(key: string): Promise<any> {
    try {
      const item = localStorage.getItem(this.prefix + key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value))
    } catch (error) {
      console.error('Error writing to localStorage:', error)
      throw error
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.error('Error deleting from localStorage:', error)
    }
  }

  async list(prefix: string): Promise<string[]> {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix + prefix)) {
          keys.push(key.replace(this.prefix, ''))
        }
      }
      return keys
    } catch (error) {
      console.error('Error listing localStorage keys:', error)
      return []
    }
  }
}

/**
 * Zora Database Service Class
 * 
 * Provides comprehensive database operations for Zora NFT integration
 * with fallback mechanisms and error handling.
 */
export class ZoraDatabaseService {
  private storage: StorageBackend

  constructor(storage?: StorageBackend) {
    this.storage = storage || new LocalStorageBackend()
  }

  // ===== CONTENT NFT TRACKING =====

  /**
   * Store NFT record for a piece of content
   */
  async storeContentNFTRecord(record: ContentNFTRecord): Promise<void> {
    const key = `content_nft_${record.contentId}`
    await this.storage.set(key, {
      ...record,
      lastUpdated: new Date().toISOString()
    })
  }

  /**
   * Get NFT record for a piece of content
   */
  async getContentNFTRecord(contentId: bigint): Promise<ContentNFTRecord | null> {
    const key = `content_nft_${contentId}`
    const data = await this.storage.get(key)
    return data ? {
      ...data,
      lastUpdated: new Date(data.lastUpdated)
    } : null
  }

  /**
   * Check if content has been minted as NFT
   */
  async isContentMintedAsNFT(contentId: bigint): Promise<boolean> {
    const record = await this.getContentNFTRecord(contentId)
    return record?.isMintedAsNFT || false
  }

  /**
   * Get all NFT records for a creator
   */
  async getCreatorNFTRecords(creatorAddress: Address): Promise<ContentNFTRecord[]> {
    const keys = await this.storage.list('content_nft_')
    const records: ContentNFTRecord[] = []

    for (const key of keys) {
      const record = await this.storage.get(key)
      if (record && record.creatorAddress.toLowerCase() === creatorAddress.toLowerCase()) {
        records.push(record)
      }
    }

    return records.sort((a, b) => {
      // Sort by mint timestamp if available, otherwise by content ID
      const aTime = a.mintTimestamp ? new Date(a.mintTimestamp).getTime() : Number(a.contentId)
      const bTime = b.mintTimestamp ? new Date(b.mintTimestamp).getTime() : Number(b.contentId)
      return bTime - aTime
    })
  }

  /**
   * Update NFT analytics for a piece of content
   */
  async updateNFTAnalytics(
    contentId: bigint, 
    analytics: Partial<NFTAnalytics>
  ): Promise<void> {
    const record = await this.getContentNFTRecord(contentId)
    if (record) {
      const updatedRecord: ContentNFTRecord = {
        ...record,
        nftViews: analytics.totalMints ? Number(analytics.totalMints) : record.nftViews,
        nftMints: analytics.totalMints ? Number(analytics.totalMints) : record.nftMints,
        nftRevenue: analytics.totalVolume || record.nftRevenue,
        lastMintDate: analytics.totalMints ? new Date() : record.lastMintDate
      }
      await this.storeContentNFTRecord(updatedRecord)
    }
  }

  // ===== CREATOR COLLECTION MANAGEMENT =====

  /**
   * Store creator's Zora collection information
   */
  async storeCreatorCollection(collection: CreatorZoraCollection): Promise<void> {
    const key = `creator_collection_${collection.creatorAddress.toLowerCase()}`
    await this.storage.set(key, {
      ...collection,
      lastUpdated: new Date().toISOString()
    })
  }

  /**
   * Get creator's Zora collection information
   */
  async getCreatorCollection(creatorAddress: Address): Promise<CreatorZoraCollection | null> {
    const key = `creator_collection_${creatorAddress.toLowerCase()}`
    const data = await this.storage.get(key)
    return data ? {
      ...data,
      lastUpdated: new Date(data.lastUpdated),
      collectionCreatedAt: data.collectionCreatedAt ? new Date(data.collectionCreatedAt) : undefined,
      lastMintDate: data.lastMintDate ? new Date(data.lastMintDate) : undefined
    } : null
  }

  /**
   * Check if creator has a Zora collection
   */
  async hasCreatorCollection(creatorAddress: Address): Promise<boolean> {
    const collection = await this.getCreatorCollection(creatorAddress)
    return collection?.hasZoraCollection || false
  }

  /**
   * Update creator collection analytics
   */
  async updateCollectionAnalytics(
    creatorAddress: Address,
    analytics: {
      totalNFTsMinted?: number
      totalCollectionVolume?: bigint
      totalMints?: bigint
      averageMintPrice?: bigint
      lastMintDate?: Date
    }
  ): Promise<void> {
    const collection = await this.getCreatorCollection(creatorAddress)
    if (collection) {
      const updatedCollection: CreatorZoraCollection = {
        ...collection,
        totalNFTsMinted: analytics.totalNFTsMinted ?? collection.totalNFTsMinted,
        totalCollectionVolume: analytics.totalCollectionVolume ?? collection.totalCollectionVolume,
        totalMints: analytics.totalMints ?? collection.totalMints,
        averageMintPrice: analytics.averageMintPrice ?? collection.averageMintPrice,
        lastMintDate: analytics.lastMintDate ?? collection.lastMintDate,
        lastUpdated: new Date()
      }
      await this.storeCreatorCollection(updatedCollection)
    }
  }

  // ===== NFT DISCOVERY AND SEARCH =====

  /**
   * Search for NFTs based on various criteria
   */
  async searchNFTs(options: NFTDiscoveryOptions): Promise<ContentNFTRecord[]> {
    const keys = await this.storage.list('content_nft_')
    const records: ContentNFTRecord[] = []

    for (const key of keys) {
      const record = await this.storage.get(key)
      if (record && record.isMintedAsNFT) {
        // Apply filters
        if (options.category && record.originalContent.category !== options.category) {
          continue
        }
        if (options.creatorAddress && 
            record.creatorAddress.toLowerCase() !== options.creatorAddress.toLowerCase()) {
          continue
        }
        if (options.priceRange) {
          const price = record.nftMintPrice || BigInt(0)
          if (price < options.priceRange.min || price > options.priceRange.max) {
            continue
          }
        }

        records.push(record)
      }
    }

    // Apply sorting
    records.sort((a, b) => {
      switch (options.sortBy) {
        case 'price':
          return Number((b.nftMintPrice || BigInt(0)) - (a.nftMintPrice || BigInt(0)))
        case 'recent':
          // Sort by mint timestamp if available, otherwise by content ID
          const aTime = a.mintTimestamp ? new Date(a.mintTimestamp).getTime() : Number(a.contentId)
          const bTime = b.mintTimestamp ? new Date(b.mintTimestamp).getTime() : Number(b.contentId)
          return bTime - aTime
        case 'popular':
          return (b.nftMints || 0) - (a.nftMints || 0)
        case 'trending':
          return (b.nftViews || 0) - (a.nftViews || 0)
        default:
          return 0
      }
    })

    // Apply pagination
    const offset = options.offset || 0
    const limit = options.limit || 20
    return records.slice(offset, offset + limit)
  }

  // ===== PERFORMANCE ANALYTICS =====

  /**
   * Get performance comparison between subscription and NFT revenue
   */
  async getPerformanceComparison(contentId: bigint): Promise<NFTPerformanceComparison | null> {
    const nftRecord = await this.getContentNFTRecord(contentId)
    if (!nftRecord) return null

    // This would typically fetch subscription data from your existing analytics
    // For now, we'll return a mock comparison
    return {
      contentId,
      subscriptionMetrics: {
        subscribers: BigInt(0), // Would come from your subscription analytics
        subscriptionRevenue: BigInt(0),
        averageSubscriptionPrice: BigInt(0)
      },
      nftMetrics: {
        mints: BigInt(nftRecord.nftMints || 0),
        nftRevenue: nftRecord.nftRevenue || BigInt(0),
        averageMintPrice: nftRecord.nftMintPrice || BigInt(0)
      },
      combinedMetrics: {
        totalRevenue: (nftRecord.nftRevenue || BigInt(0)),
        totalEngagement: BigInt(nftRecord.nftMints || 0),
        revenuePerUser: nftRecord.nftMints ? 
          (nftRecord.nftRevenue || BigInt(0)) / BigInt(nftRecord.nftMints) : 
          BigInt(0)
      }
    }
  }

  /**
   * Get creator's overall NFT performance
   */
  async getCreatorNFTPerformance(creatorAddress: Address): Promise<{
    totalNFTs: number
    totalMints: bigint
    totalRevenue: bigint
    averageMintPrice: bigint
    bestPerformingNFT?: ContentNFTRecord
  }> {
    const records = await this.getCreatorNFTRecords(creatorAddress)
    const mintedRecords = records.filter(r => r.isMintedAsNFT)

    if (mintedRecords.length === 0) {
      return {
        totalNFTs: 0,
        totalMints: BigInt(0),
        totalRevenue: BigInt(0),
        averageMintPrice: BigInt(0)
      }
    }

    const totalMints = mintedRecords.reduce((sum, r) => sum + BigInt(r.nftMints || 0), BigInt(0))
    const totalRevenue = mintedRecords.reduce((sum, r) => sum + (r.nftRevenue || BigInt(0)), BigInt(0))
    const averageMintPrice = totalMints > 0 ? totalRevenue / totalMints : BigInt(0)
    
    const bestPerformingNFT = mintedRecords.reduce((best, current) => 
      (current.nftMints || 0) > (best.nftMints || 0) ? current : best
    )

    return {
      totalNFTs: mintedRecords.length,
      totalMints,
      totalRevenue,
      averageMintPrice,
      bestPerformingNFT
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Clean up old or invalid records
   */
  async cleanupRecords(): Promise<void> {
    const keys = await this.storage.list('')
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

    for (const key of keys) {
      const data = await this.storage.get(key)
      if (data && data.lastUpdated) {
        const lastUpdated = new Date(data.lastUpdated)
        if (lastUpdated < cutoffDate && data.nftStatus === 'mint_failed') {
          await this.storage.delete(key)
        }
      }
    }
  }

  /**
   * Export all NFT data for backup or migration
   */
  async exportAllData(): Promise<{
    contentNFTRecords: ContentNFTRecord[]
    creatorCollections: CreatorZoraCollection[]
  }> {
    const contentKeys = await this.storage.list('content_nft_')
    const collectionKeys = await this.storage.list('creator_collection_')

    const contentNFTRecords: ContentNFTRecord[] = []
    const creatorCollections: CreatorZoraCollection[] = []

    for (const key of contentKeys) {
      const record = await this.storage.get(key)
      if (record) {
        contentNFTRecords.push({
          ...record,
          lastUpdated: new Date(record.lastUpdated)
        })
      }
    }

    for (const key of collectionKeys) {
      const collection = await this.storage.get(key)
      if (collection) {
        creatorCollections.push({
          ...collection,
          lastUpdated: new Date(collection.lastUpdated),
          collectionCreatedAt: collection.collectionCreatedAt ? new Date(collection.collectionCreatedAt) : undefined,
          lastMintDate: collection.lastMintDate ? new Date(collection.lastMintDate) : undefined
        })
      }
    }

    return { contentNFTRecords, creatorCollections }
  }

  /**
   * Import NFT data from backup or migration
   */
  async importData(data: {
    contentNFTRecords: ContentNFTRecord[]
    creatorCollections: CreatorZoraCollection[]
  }): Promise<void> {
    for (const record of data.contentNFTRecords) {
      await this.storeContentNFTRecord(record)
    }

    for (const collection of data.creatorCollections) {
      await this.storeCreatorCollection(collection)
    }
  }
}

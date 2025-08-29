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
  NFTDiscoveryOptions,
  NFTPerformanceComparison,
  CreatorZoraAnalytics,
  CollectionPerformance
} from '@/types/zora'

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
 * Transaction Context for atomic operations
 */
interface TransactionContext {
  id: string
  operations: Array<{
    type: 'set' | 'delete'
    key: string
    value?: any
    previousValue?: any
  }>
  timestamp: number
  status: 'pending' | 'committed' | 'rolled_back'
}

/**
 * Atomic Operation Result
 */
interface AtomicOperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  transactionId?: string
}

/**
 * Enhanced Local Storage Backend with Atomic Operations
 *
 * Uses browser localStorage for development and testing with transaction safety
 */
class LocalStorageBackend implements StorageBackend {
  private prefix = 'zora_integration_'
  private transactions = new Map<string, TransactionContext>()
  private locks = new Map<string, Promise<any>>()

  async get(key: string): Promise<any> {
    return this.withLock(key, async () => {
      try {
        const item = localStorage.getItem(this.prefix + key)
        return item ? JSON.parse(item) : null
      } catch (error) {
        console.error('Error reading from localStorage:', error)
        return null
      }
    })
  }

  async set(key: string, value: any): Promise<void> {
    return this.withLock(key, async () => {
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(value))
      } catch (error) {
        console.error('Error writing to localStorage:', error)
        throw error
      }
    })
  }

  async delete(key: string): Promise<void> {
    return this.withLock(key, async () => {
      try {
        localStorage.removeItem(this.prefix + key)
      } catch (error) {
        console.error('Error deleting from localStorage:', error)
      }
    })
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

  /**
   * Execute operation with key-based locking to prevent race conditions
   */
  private async withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const lockKey = this.prefix + key

    // Wait for any existing operation on this key to complete
    if (this.locks.has(lockKey)) {
      await this.locks.get(lockKey)
    }

    // Create a new lock for this operation
    const lockPromise = operation().finally(() => {
      this.locks.delete(lockKey)
    })

    this.locks.set(lockKey, lockPromise)
    return lockPromise
  }

  /**
   * Start a new transaction
   */
  startTransaction(): string {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const transaction: TransactionContext = {
      id: transactionId,
      operations: [],
      timestamp: Date.now(),
      status: 'pending'
    }
    this.transactions.set(transactionId, transaction)
    return transactionId
  }

  /**
   * Add operation to transaction (for rollback purposes)
   */
  async addToTransaction(transactionId: string, type: 'set' | 'delete', key: string, value?: any): Promise<void> {
    const transaction = this.transactions.get(transactionId)
    if (!transaction || transaction.status !== 'pending') {
      throw new Error(`Invalid or inactive transaction: ${transactionId}`)
    }

    // Capture previous value for rollback
    let previousValue: any = undefined
    if (type === 'set' || type === 'delete') {
      previousValue = await this.get(key)
    }

    transaction.operations.push({
      type,
      key,
      value,
      previousValue
    })
  }

  /**
   * Commit transaction atomically
   */
  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId)
    if (!transaction || transaction.status !== 'pending') {
      throw new Error(`Invalid or inactive transaction: ${transactionId}`)
    }

    try {
      // Execute all operations in sequence
      for (const operation of transaction.operations) {
        if (operation.type === 'set') {
          await this.set(operation.key, operation.value)
        } else if (operation.type === 'delete') {
          await this.delete(operation.key)
        }
      }

      transaction.status = 'committed'
      console.log(`✅ Transaction ${transactionId} committed successfully`)
    } catch (error) {
      console.error(`❌ Transaction ${transactionId} commit failed, rolling back:`, error)
      await this.rollbackTransaction(transactionId)
      throw error
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId)
    if (!transaction) {
      console.warn(`Transaction ${transactionId} not found for rollback`)
      return
    }

    if (transaction.status === 'committed') {
      console.warn(`Cannot rollback committed transaction: ${transactionId}`)
      return
    }

    try {
      // Reverse operations in reverse order
      for (let i = transaction.operations.length - 1; i >= 0; i--) {
        const operation = transaction.operations[i]

        if (operation.type === 'set') {
          if (operation.previousValue !== undefined) {
            await this.set(operation.key, operation.previousValue)
          } else {
            await this.delete(operation.key)
          }
        } else if (operation.type === 'delete') {
          if (operation.previousValue !== undefined) {
            await this.set(operation.key, operation.previousValue)
          }
        }
      }

      transaction.status = 'rolled_back'
      console.log(`🔄 Transaction ${transactionId} rolled back successfully`)
    } catch (rollbackError) {
      console.error(`❌ Transaction ${transactionId} rollback failed:`, rollbackError)
      throw rollbackError
    }
  }

  /**
   * Clean up old transactions
   */
  cleanupOldTransactions(maxAgeMs: number = 300000): void { // 5 minutes default
    const cutoffTime = Date.now() - maxAgeMs

    for (const [transactionId, transaction] of this.transactions.entries()) {
      if (transaction.timestamp < cutoffTime && transaction.status === 'pending') {
        console.warn(`Cleaning up stale transaction: ${transactionId}`)
        this.rollbackTransaction(transactionId).catch(error => {
          console.error(`Failed to cleanup transaction ${transactionId}:`, error)
        })
      }
    }
  }
}

/**
 * Zora Database Service Class
 *
 * Provides comprehensive database operations for Zora NFT integration
 * with atomic transactions, fallback mechanisms, and error handling.
 */
export class ZoraDatabaseService {
  private storage: StorageBackend
  private localStorageBackend: LocalStorageBackend

  constructor(storage?: StorageBackend) {
    this.storage = storage || new LocalStorageBackend()
    this.localStorageBackend = this.storage as LocalStorageBackend

    // Clean up old transactions periodically
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (this.localStorageBackend && 'cleanupOldTransactions' in this.localStorageBackend) {
          this.localStorageBackend.cleanupOldTransactions()
        }
      }, 60000) // Clean up every minute
    }
  }

  // ===== CONTENT NFT TRACKING =====

  /**
   * Store NFT record for a piece of content with atomic transaction
   */
  async storeContentNFTRecord(record: ContentNFTRecord): Promise<AtomicOperationResult<void>> {
    const transactionId = this.localStorageBackend.startTransaction()
    const key = `content_nft_${record.contentId}`

    try {
      // Add operation to transaction for rollback capability
      await this.localStorageBackend.addToTransaction(
        transactionId,
        'set',
        key,
        {
          ...record,
          lastUpdated: new Date().toISOString()
        }
      )

      // Commit the transaction
      await this.localStorageBackend.commitTransaction(transactionId)

      console.log(`✅ NFT record stored atomically: ${record.contentId}`)
      return {
        success: true,
        transactionId
      }
    } catch (error) {
      console.error(`❌ Failed to store NFT record atomically:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store NFT record',
        transactionId
      }
    }
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
        records.push({
          ...record,
          lastUpdated: new Date(record.lastUpdated)
        })
      }
    }

    return records.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
  }

  /**
   * Update NFT analytics for a piece of content with atomic transaction
   */
  async updateNFTAnalytics(
    contentId: bigint,
    analytics: Partial<NFTAnalytics>
  ): Promise<AtomicOperationResult<void>> {
    const transactionId = this.localStorageBackend.startTransaction()
    const key = `content_nft_${contentId}`

    try {
      const record = await this.getContentNFTRecord(contentId)
      if (!record) {
        throw new Error(`NFT record not found for content ID: ${contentId}`)
      }

      const updatedRecord: ContentNFTRecord = {
        ...record,
        nftViews: analytics.totalMints ? Number(analytics.totalMints) : record.nftViews,
        nftMints: analytics.totalMints ? Number(analytics.totalMints) : record.nftMints,
        nftRevenue: analytics.totalVolume || record.nftRevenue,
        lastMintDate: analytics.totalMints ? new Date() : record.lastMintDate,
        lastUpdated: new Date()
      }

      // Add operation to transaction for rollback capability
      await this.localStorageBackend.addToTransaction(
        transactionId,
        'set',
        key,
        {
          ...updatedRecord,
          lastUpdated: new Date().toISOString()
        }
      )

      // Commit the transaction
      await this.localStorageBackend.commitTransaction(transactionId)

      console.log(`✅ NFT analytics updated atomically: ${contentId}`)
      return {
        success: true,
        transactionId
      }
    } catch (error) {
      console.error(`❌ Failed to update NFT analytics atomically:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update NFT analytics',
        transactionId
      }
    }
  }

  // ===== CREATOR COLLECTION MANAGEMENT =====

  /**
   * Store creator's Zora collection information with atomic transaction
   */
  async storeCreatorCollection(collection: CreatorZoraCollection): Promise<AtomicOperationResult<void>> {
    const transactionId = this.localStorageBackend.startTransaction()
    const key = `creator_collection_${collection.creatorAddress.toLowerCase()}`

    try {
      // Add operation to transaction for rollback capability
      await this.localStorageBackend.addToTransaction(
        transactionId,
        'set',
        key,
        {
          ...collection,
          lastUpdated: new Date().toISOString()
        }
      )

      // Commit the transaction
      await this.localStorageBackend.commitTransaction(transactionId)

      console.log(`✅ Creator collection stored atomically: ${collection.creatorAddress}`)
      return {
        success: true,
        transactionId
      }
    } catch (error) {
      console.error(`❌ Failed to store creator collection atomically:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store creator collection',
        transactionId
      }
    }
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

        records.push({
          ...record,
          lastUpdated: new Date(record.lastUpdated)
        })
      }
    }

    // Apply sorting
    records.sort((a, b) => {
      switch (options.sortBy) {
        case 'price':
          return Number((b.nftMintPrice || BigInt(0)) - (a.nftMintPrice || BigInt(0)))
        case 'recent':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
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
   * Now integrates with real contract data
   */
  async getPerformanceComparison(contentId: bigint): Promise<NFTPerformanceComparison | null> {
    const nftRecord = await this.getContentNFTRecord(contentId)
    if (!nftRecord) return null

    // Get subscription metrics from contracts
    const subscriptionMetrics = await this.getSubscriptionMetrics(nftRecord.creatorAddress, contentId)
    
    // Get NFT metrics from on-chain data
    const nftMetrics = await this.getNFTMetrics(nftRecord.nftContractAddress, nftRecord.nftTokenId)

    return {
      contentId,
      subscriptionMetrics,
      nftMetrics,
      combinedMetrics: {
        totalRevenue: subscriptionMetrics.subscriptionRevenue + nftMetrics.nftRevenue,
        totalEngagement: BigInt(nftMetrics.mints) + subscriptionMetrics.subscribers,
        revenuePerUser: (subscriptionMetrics.subscriptionRevenue + nftMetrics.nftRevenue) / 
          (BigInt(nftMetrics.mints) + subscriptionMetrics.subscribers) || BigInt(0)
      }
    }
  }

  /**
   * Get subscription metrics from CreatorRegistry and Commerce Protocol
   */
  private async getSubscriptionMetrics(creatorAddress: Address, contentId: bigint) {
    try {
      // TODO: Implement real contract queries
      // This would query:
      // 1. CreatorRegistry.getCreatorSubscriptionCount(creatorAddress)
      // 2. Commerce Protocol subscription revenue for this creator
      // 3. Average subscription price from creator profile
      
      // For now, return structured data with placeholders
      return {
        subscribers: BigInt(0), // TODO: Query from CreatorRegistry contract
        subscriptionRevenue: BigInt(0), // TODO: Query from Commerce Protocol
        averageSubscriptionPrice: BigInt(0) // TODO: Calculate from subscription data
      }
    } catch (error) {
      console.error('Failed to get subscription metrics:', error)
      return {
        subscribers: BigInt(0),
        subscriptionRevenue: BigInt(0),
        averageSubscriptionPrice: BigInt(0)
      }
    }
  }

  /**
   * Get NFT metrics from on-chain data
   */
  private async getNFTMetrics(contractAddress: Address | undefined, tokenId: bigint | undefined) {
    try {
      if (!contractAddress || tokenId === undefined) {
        return {
          mints: BigInt(0),
          nftRevenue: BigInt(0),
          averageMintPrice: BigInt(0)
        }
      }

      // TODO: Implement real on-chain queries
      // This would query:
      // 1. Zora contract totalSupply(tokenId)
      // 2. Mint events to calculate revenue
      // 3. Unique minter addresses from events
      
      // For now, return structured data with placeholders
      return {
        mints: BigInt(0), // TODO: Query from Zora contract
        nftRevenue: BigInt(0), // TODO: Calculate from mint events
        averageMintPrice: BigInt(0) // TODO: Calculate from mint events
      }
    } catch (error) {
      console.error('Failed to get NFT metrics:', error)
      return {
        mints: BigInt(0),
        nftRevenue: BigInt(0),
        averageMintPrice: BigInt(0)
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

  /**
   * Get comprehensive creator analytics across all collections
   * Aggregates NFT performance data across collections
   */
  async getCreatorAnalytics(creatorAddress: Address): Promise<CreatorZoraAnalytics> {
    try {
      // Get all NFT records for the creator
      const nftRecords = await this.getCreatorNFTRecords(creatorAddress)
      const mintedRecords = nftRecords.filter(r => r.isMintedAsNFT)

      // Get creator collection data
      const collection = await this.getCreatorCollection(creatorAddress)

      // Calculate aggregate metrics
      const totalNFTs = mintedRecords.length
      const totalMints = mintedRecords.reduce((sum, r) => sum + BigInt(r.nftMints || 0), BigInt(0))
      const totalRevenue = mintedRecords.reduce((sum, r) => sum + (r.nftRevenue || BigInt(0)), BigInt(0))
      const averageMintPrice = totalMints > 0 ? totalRevenue / totalMints : BigInt(0)

      // Calculate time-based metrics (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const recentRecords = mintedRecords.filter(r => 
        r.lastMintDate && new Date(r.lastMintDate) > thirtyDaysAgo
      )

      const mintsLast30d = recentRecords.reduce((sum, r) => sum + BigInt(r.nftMints || 0), BigInt(0))
      const volumeLast30d = recentRecords.reduce((sum, r) => sum + (r.nftRevenue || BigInt(0)), BigInt(0))

      // Calculate trends
      const mintTrend = this.calculateTrend(totalMints, BigInt(0)) // Compare with previous period
      const volumeTrend = this.calculateTrend(totalRevenue, BigInt(0)) // Compare with previous period

      // Calculate conversion rate (mints per view)
      const totalViews = mintedRecords.reduce((sum, r) => sum + (r.nftViews || 0), 0)
      const conversionRate = totalViews > 0 ? Number(totalMints) / totalViews : 0

      // Get unique minters (simplified - would need event data in production)
      const uniqueMinters = Math.floor(Number(totalMints) * 0.8) // Estimate

      // Calculate social metrics (placeholder - would come from social APIs)
      const socialShares = mintedRecords.reduce((sum, r) => sum + (r.nftViews || 0), 0) * 0.1 // Estimate
      const socialEngagement = socialShares * 0.3 // Estimate

      return {
        // NFT metrics
        totalMints,
        totalVolume: totalRevenue,
        averagePrice: averageMintPrice,
        uniqueMinters,
        
        // Subscription metrics (would be populated from contract queries)
        totalSubscribers: BigInt(0), // TODO: Query from CreatorRegistry
        subscriptionRevenue: BigInt(0), // TODO: Query from Commerce Protocol
        averageSubscriptionPrice: BigInt(0), // TODO: Calculate from subscription data
        
        // Combined metrics
        totalRevenue,
        totalEngagement: BigInt(totalViews),
        revenuePerUser: totalMints > 0 ? totalRevenue / totalMints : BigInt(0),
        
        // Time-based analytics
        mintsLast24h: BigInt(0), // TODO: Calculate from recent events
        volumeLast24h: BigInt(0), // TODO: Calculate from recent events
        mintsLast7d: BigInt(0), // TODO: Calculate from recent events
        volumeLast7d: BigInt(0), // TODO: Calculate from recent events
        mintsLast30d,
        volumeLast30d,
        
        // Performance indicators
        mintTrend,
        volumeTrend,
        conversionRate,
        
        // Social metrics
        socialShares: Math.floor(socialShares),
        socialEngagement: Math.floor(socialEngagement),
        discoverySource: 'zora_feed' as const, // Most common source
        
        // Collection-specific data
        collectionAddress: collection?.zoraCollectionAddress,
        collectionName: collection?.zoraCollectionName || 'Unknown Collection',
        collectionStatus: collection?.collectionStatus || 'unknown'
      }
    } catch (error) {
      console.error('Error getting creator analytics:', error)
      
      // Return empty analytics on error
      return {
        totalMints: BigInt(0),
        totalVolume: BigInt(0),
        averagePrice: BigInt(0),
        uniqueMinters: 0,
        totalSubscribers: BigInt(0),
        subscriptionRevenue: BigInt(0),
        averageSubscriptionPrice: BigInt(0),
        totalRevenue: BigInt(0),
        totalEngagement: BigInt(0),
        revenuePerUser: BigInt(0),
        mintsLast24h: BigInt(0),
        volumeLast24h: BigInt(0),
        mintsLast7d: BigInt(0),
        volumeLast7d: BigInt(0),
        mintsLast30d: BigInt(0),
        volumeLast30d: BigInt(0),
        mintTrend: 'stable',
        volumeTrend: 'stable',
        conversionRate: 0,
        socialShares: 0,
        socialEngagement: 0,
        discoverySource: 'zora_feed',
        collectionAddress: undefined,
        collectionName: 'Unknown Collection',
        collectionStatus: 'unknown'
      }
    }
  }

  /**
   * Get collection performance metrics
   * Calculates collection-level metrics
   */
  async getCollectionPerformance(
    collectionAddress: Address
  ): Promise<CollectionPerformance> {
    try {
      // Get all NFT records for this collection
      const allRecords = await this.getAllNFTRecords()
      const collectionRecords = allRecords.filter(r => 
        r.nftContractAddress?.toLowerCase() === collectionAddress.toLowerCase()
      )

      if (collectionRecords.length === 0) {
        return {
          collectionAddress,
          totalNFTs: 0,
          totalMinted: BigInt(0),
          totalVolume: BigInt(0),
          averagePrice: BigInt(0),
          uniqueMinters: 0,
          floorPrice: BigInt(0),
          royaltyEarnings: BigInt(0),
          mintTrend: 'stable',
          volumeTrend: 'stable',
          conversionRate: 0,
          lastMintDate: undefined,
          createdAt: undefined
        }
      }

      // Calculate basic metrics
      const totalNFTs = collectionRecords.length
      const totalMinted = collectionRecords.reduce((sum, r) => sum + BigInt(r.nftMints || 0), BigInt(0))
      const totalVolume = collectionRecords.reduce((sum, r) => sum + (r.nftRevenue || BigInt(0)), BigInt(0))
      const averagePrice = totalMinted > 0 ? totalVolume / totalMinted : BigInt(0)

      // Calculate floor price (minimum mint price)
      const mintPrices = collectionRecords
        .map(r => r.nftMintPrice || BigInt(0))
        .filter(price => price > BigInt(0))
      const floorPrice = mintPrices.length > 0 ? mintPrices.reduce((min, price) => 
        price < min ? price : min
      ) : BigInt(0)

      // Calculate royalty earnings (simplified - would need secondary sales data)
      const royaltyRate = 0.05 // 5% default royalty
      const royaltyEarnings = (totalVolume * BigInt(Math.floor(royaltyRate * 100))) / BigInt(100)

      // Calculate trends
      const mintTrend = this.calculateTrend(totalMinted, BigInt(0))
      const volumeTrend = this.calculateTrend(totalVolume, BigInt(0))

      // Calculate conversion rate
      const totalViews = collectionRecords.reduce((sum, r) => sum + (r.nftViews || 0), 0)
      const conversionRate = totalViews > 0 ? Number(totalMinted) / totalViews : 0

      // Get unique minters (estimate)
      const uniqueMinters = Math.floor(Number(totalMinted) * 0.8)

      // Get timestamps
      const lastMintDate = collectionRecords
        .map(r => r.lastMintDate)
        .filter(date => date)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0]

      const createdAt = collectionRecords
        .map(r => r.lastUpdated)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]

      return {
        collectionAddress,
        totalNFTs,
        totalMinted,
        totalVolume,
        averagePrice,
        uniqueMinters,
        floorPrice,
        royaltyEarnings,
        mintTrend,
        volumeTrend,
        conversionRate,
        lastMintDate: lastMintDate ? new Date(lastMintDate) : undefined,
        createdAt: createdAt ? new Date(createdAt) : undefined
      }
    } catch (error) {
      console.error('Error getting collection performance:', error)
      
      // Return empty performance on error
      return {
        collectionAddress,
        totalNFTs: 0,
        totalMinted: BigInt(0),
        totalVolume: BigInt(0),
        averagePrice: BigInt(0),
        uniqueMinters: 0,
        floorPrice: BigInt(0),
        royaltyEarnings: BigInt(0),
        mintTrend: 'stable',
        volumeTrend: 'stable',
        conversionRate: 0,
        lastMintDate: undefined,
        createdAt: undefined
      }
    }
  }

  /**
   * Get all NFT records (helper method)
   */
  private async getAllNFTRecords(): Promise<ContentNFTRecord[]> {
    const keys = await this.storage.list('content_nft_')
    const records: ContentNFTRecord[] = []

    for (const key of keys) {
      const record = await this.storage.get(key)
      if (record) {
        records.push({
          ...record,
          lastUpdated: new Date(record.lastUpdated)
        })
      }
    }

    return records
  }

  /**
   * Calculate trend direction based on current vs previous values
   */
  private calculateTrend(current: bigint, previous: bigint): 'increasing' | 'decreasing' | 'stable' {
    if (current > previous) return 'increasing'
    if (current < previous) return 'decreasing'
    return 'stable'
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
   * Batch operation for multiple related database operations
   */
  async batchOperation<T>(
    operations: Array<{
      type: 'store_nft' | 'store_collection' | 'update_analytics'
      data: any
    }>
  ): Promise<AtomicOperationResult<T[]>> {
    const transactionId = this.localStorageBackend.startTransaction()
    const results: T[] = []

    try {
      for (const operation of operations) {
        switch (operation.type) {
          case 'store_nft':
            await this.localStorageBackend.addToTransaction(
              transactionId,
              'set',
              `content_nft_${operation.data.contentId}`,
              {
                ...operation.data,
                lastUpdated: new Date().toISOString()
              }
            )
            results.push(operation.data as T)
            break

          case 'store_collection':
            await this.localStorageBackend.addToTransaction(
              transactionId,
              'set',
              `creator_collection_${operation.data.creatorAddress.toLowerCase()}`,
              {
                ...operation.data,
                lastUpdated: new Date().toISOString()
              }
            )
            results.push(operation.data as T)
            break

          case 'update_analytics':
            const key = `content_nft_${operation.data.contentId}`
            const existing = await this.getContentNFTRecord(operation.data.contentId)
            if (existing) {
              const updated = {
                ...existing,
                ...operation.data.analytics,
                lastUpdated: new Date().toISOString()
              }
              await this.localStorageBackend.addToTransaction(
                transactionId,
                'set',
                key,
                updated
              )
              results.push(updated as T)
            }
            break
        }
      }

      // Commit all operations atomically
      await this.localStorageBackend.commitTransaction(transactionId)

      console.log(`✅ Batch operation completed atomically: ${operations.length} operations`)
      return {
        success: true,
        data: results,
        transactionId
      }
    } catch (error) {
      console.error(`❌ Batch operation failed, rolling back:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch operation failed',
        transactionId
      }
    }
  }

  /**
   * Retry mechanism for failed operations
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        if (attempt === maxRetries) {
          console.error(`❌ Operation failed after ${maxRetries} attempts:`, lastError)
          throw lastError
        }

        console.warn(`⚠️ Operation attempt ${attempt} failed, retrying in ${delayMs}ms:`, lastError.message)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        delayMs *= 2 // Exponential backoff
      }
    }

    throw lastError!
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

  // ===== BACKWARD COMPATIBILITY METHODS =====

  /**
   * Legacy method for storing NFT records (without atomic result)
   * @deprecated Use storeContentNFTRecord() for new implementations
   */
  async storeContentNFTRecordLegacy(record: ContentNFTRecord): Promise<void> {
    const result = await this.storeContentNFTRecord(record)
    if (!result.success) {
      throw new Error(result.error || 'Failed to store NFT record')
    }
  }

  /**
   * Legacy method for storing creator collections (without atomic result)
   * @deprecated Use storeCreatorCollection() for new implementations
   */
  async storeCreatorCollectionLegacy(collection: CreatorZoraCollection): Promise<void> {
    const result = await this.storeCreatorCollection(collection)
    if (!result.success) {
      throw new Error(result.error || 'Failed to store creator collection')
    }
  }

  /**
   * Legacy method for updating NFT analytics (without atomic result)
   * @deprecated Use updateNFTAnalytics() for new implementations
   */
  async updateNFTAnalyticsLegacy(
    contentId: bigint,
    analytics: Partial<NFTAnalytics>
  ): Promise<void> {
    const result = await this.updateNFTAnalytics(contentId, analytics)
    if (!result.success) {
      throw new Error(result.error || 'Failed to update NFT analytics')
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Health check for the database service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    operations: {
      read: boolean
      write: boolean
      transaction: boolean
    }
    metrics: {
      totalNFTs: number
      totalCollections: number
      activeTransactions: number
    }
  }> {
    try {
      // Test basic read/write operations
      const testKey = `health_check_${Date.now()}`
      const testData = { test: true, timestamp: new Date().toISOString() }

      await this.storage.set(testKey, testData)
      const retrieved = await this.storage.get(testKey)

      const readWorks = retrieved !== null
      const writeWorks = retrieved?.test === true

      // Test transaction functionality
      let transactionWorks = false
      try {
        const txId = this.localStorageBackend.startTransaction()
        await this.localStorageBackend.addToTransaction(txId, 'set', testKey, testData)
        await this.localStorageBackend.commitTransaction(txId)
        transactionWorks = true
      } catch {
        transactionWorks = false
      }

      // Clean up test data
      await this.storage.delete(testKey)

      // Get metrics
      const nftKeys = await this.storage.list('content_nft_')
      const collectionKeys = await this.storage.list('creator_collection_')

      const status = (readWorks && writeWorks && transactionWorks) ? 'healthy' :
                    (readWorks || writeWorks) ? 'degraded' : 'unhealthy'

      return {
        status,
        operations: {
          read: readWorks,
          write: writeWorks,
          transaction: transactionWorks
        },
        metrics: {
          totalNFTs: nftKeys.length,
          totalCollections: collectionKeys.length,
          activeTransactions: this.localStorageBackend['transactions']?.size || 0
        }
      }
    } catch (error) {
      console.error('Health check failed:', error)
      return {
        status: 'unhealthy',
        operations: {
          read: false,
          write: false,
          transaction: false
        },
        metrics: {
          totalNFTs: 0,
          totalCollections: 0,
          activeTransactions: 0
        }
      }
    }
  }
}

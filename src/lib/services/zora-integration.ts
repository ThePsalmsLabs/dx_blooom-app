// src/lib/services/zora-integration.ts
/**
 * Zora Integration Service
 * 
 * This service handles all interactions with the Zora platform, enabling creators
 * to mint their subscription content as NFTs while maintaining the subscription model.
 * 
 * Integration Strategy:
 * 1. Allow creators to "promote" their premium content by minting it as NFTs on Zora
 * 2. Create social discovery layer through Zora's feed
 * 3. Enable hybrid monetization: subscriptions + NFT sales + trading fees
 * 4. Cross-platform compatibility via Zora's marketplace integrations
 */

import { useState, useCallback } from 'react'
import { PublicClient, WalletClient, Address, parseEther } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { ZORA_CREATOR_1155_FACTORY_ABI, ZORA_CREATOR_1155_IMPL_ABI } from '@/lib/contracts/abis/zora'
import { ZORA_ADDRESSES } from '@/lib/contracts/addresses/zora'
import {
  extractContractAddressFromSetupEvent,
  extractTokenIdFromUpdatedEvent
} from '@/lib/utils/zora-events'
import { type ZoraNFTMetadata, type ZoraCollectionAnalytics } from '@/types/zora'
import { withMonitoring } from './zora-monitoring'

// Get Zora addresses from the centralized configuration
function getZoraAddresses(chainId: number) {
  const addresses = ZORA_ADDRESSES[chainId as keyof typeof ZORA_ADDRESSES]
  if (!addresses) {
    throw new Error(`Zora Protocol not supported on chain ${chainId}`)
  }
  return addresses
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

/**
 * Main Zora Integration Class
 * 
 * This class handles all Zora interactions and provides a clean interface
 * for your existing content platform to integrate with Zora's NFT minting.
 */
export class ZoraIntegrationService {
  private publicClient: PublicClient
  private walletClient?: WalletClient
  private chainId: number

  constructor(
    publicClient: PublicClient,
    walletClient?: WalletClient,
    chainId: number = base.id
  ) {
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.chainId = chainId

    // Validate chain support using the new function
    try {
      getZoraAddresses(chainId)
    } catch (error) {
      throw new Error(`Zora not supported on chain ${chainId}`)
    }
  }

  /**
   * Create a new Zora collection for a creator
   *
   * This creates a dedicated 1155 contract where the creator can mint
   * multiple pieces of content as NFTs with unified branding.
   */
  createCreatorCollection = withMonitoring(
    'create_collection',
    async (config: ZoraCollectionConfig): Promise<{ success: boolean; contractAddress?: Address; error?: string }> => {
      if (!this.walletClient) {
        return { success: false, error: 'Wallet client required for minting' }
      }

      try {
        const addresses = getZoraAddresses(this.chainId)

        // Prepare royalty configuration according to Zora V3 spec
        const defaultRoyaltyConfiguration = {
          royaltyMintSchedule: 0, // No royalty on mint
          royaltyBPS: config.royaltyBPS,
          royaltyRecipient: config.creator
        }

        // Create the collection contract using correct Zora V3 factory ABI
        const hash = await this.walletClient.writeContract({
          address: addresses.ZORA_CREATOR_1155_FACTORY_IMPL,
          abi: ZORA_CREATOR_1155_FACTORY_ABI,
          functionName: 'createContract',
          args: [
            config.contractURI,
            config.name,
            defaultRoyaltyConfiguration,
            config.creator, // defaultAdmin
            [] // setupActions - empty for basic setup
          ],
          account: config.creator,
          chain: this.chainId === base.id ? base : baseSepolia
        })

        // Wait for transaction confirmation
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash })

        if (receipt.status === 'success') {
          // Extract contract address from SetupNewContract event using proper parsing
          const addresses = getZoraAddresses(this.chainId)
          const contractAddress = extractContractAddressFromSetupEvent(receipt, addresses.ZORA_CREATOR_1155_FACTORY_IMPL)

          if (contractAddress) {
            return {
              success: true,
              contractAddress
            }
          } else {
            return {
              success: false,
              error: 'Failed to extract contract address from transaction logs'
            }
          }
        } else {
          return {
            success: false,
            error: 'Collection creation failed'
          }
        }

      } catch (error) {
        console.error('Error creating Zora collection:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      }
    }
  )

  /**
   * Mint content as NFT in existing collection
   *
   * This takes content from your platform and mints it as an NFT on Zora,
   * creating a bridge between subscription content and collectible assets.
   */
  mintContentAsNFT = withMonitoring(
    'mint_nft',
    async (
      collectionAddress: Address,
      metadata: ZoraNFTMetadata,
      mintPrice: bigint = parseEther('0.000777'), // Default Zora mint price
      maxSupply: number = 100
    ): Promise<NFTMintResult> => {
    if (!this.walletClient) {
      return { success: false, error: 'Wallet client required for minting' }
    }

    try {
      // Upload metadata to IPFS first
      const uploadResult = await this.uploadMetadataToIPFS(metadata)
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error }
      }

      // First, create the token in the collection using correct Zora V3 ABI
      const setupHash = await this.walletClient.writeContract({
        address: collectionAddress,
        abi: ZORA_CREATOR_1155_IMPL_ABI,
        functionName: 'setupNewToken',
        args: [
          uploadResult.tokenURI!, // Use the IPFS URI
          BigInt(maxSupply)
        ],
        account: metadata.creator_address,
        chain: this.chainId === base.id ? base : baseSepolia
      })

      const setupReceipt = await this.publicClient.waitForTransactionReceipt({ hash: setupHash })
      
      if (setupReceipt.status !== 'success') {
        return { success: false, error: 'Failed to setup token' }
      }

      // Extract token ID from UpdatedToken event using proper parsing
      const tokenId = extractTokenIdFromUpdatedEvent(setupReceipt, collectionAddress)
      
      if (!tokenId) {
        return { success: false, error: 'Failed to extract token ID from transaction logs' }
      }
      
      // Mint the first NFT to the creator using correct Zora V3 ABI
      const mintHash = await this.walletClient.writeContract({
        address: collectionAddress,
        abi: ZORA_CREATOR_1155_IMPL_ABI,
        functionName: 'mint',
        args: [
          metadata.creator_address, // minter (IMinter1155)
          tokenId,
          BigInt(1), // quantity
          [metadata.creator_address], // rewardsRecipients
          '0x' as const // minter arguments
        ],
        account: metadata.creator_address,
        value: mintPrice,
        chain: this.chainId === base.id ? base : baseSepolia
      })

      const mintReceipt = await this.publicClient.waitForTransactionReceipt({ hash: mintHash })

      if (mintReceipt.status === 'success') {
        return {
          success: true,
          transactionHash: mintHash,
          contractAddress: collectionAddress,
          tokenId,
          mintPrice
        }
      } else {
        return { success: false, error: 'Minting transaction failed' }
      }

    } catch (error) {
      console.error('Error minting NFT:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
    }
  )

  /**
   * Get NFT information from Zora collection
   */
  async getNFTInfo(contractAddress: Address, tokenId: bigint) {
    try {
      const tokenInfo = await this.publicClient.readContract({
        address: contractAddress,
        abi: ZORA_CREATOR_1155_IMPL_ABI,
        functionName: 'getTokenInfo',
        args: [tokenId]
      })

      // Fetch metadata from IPFS
      let metadata: ZoraNFTMetadata | null = null
      try {
        const response = await fetch(tokenInfo.uri)
        if (response.ok) {
          metadata = await response.json() as ZoraNFTMetadata
        }
      } catch (ipfsError) {
        console.error('Error fetching metadata from IPFS:', ipfsError)
      }

      return {
        uri: tokenInfo.uri,
        maxSupply: tokenInfo.maxSupply,
        totalMinted: tokenInfo.totalMinted,
        metadata
      }
    } catch (error) {
      console.error('Error fetching NFT info:', error)
      return null
    }
  }

  /**
   * Check if content has been minted as NFT
   */
  async isContentMinted(contentId: string, creatorAddress: Address): Promise<boolean> {
    try {
      // Import the database service dynamically to avoid circular dependencies
      const { ZoraDatabaseService } = await import('@/services/zora/ZoraDatabaseService')
      const dbService = new ZoraDatabaseService()
      return await dbService.isContentMintedAsNFT(BigInt(contentId))
    } catch (error) {
      console.error('Error checking if content is minted:', error)
      return false
    }
  }

  /**
   * Get creator's Zora collection address
   * 
   * This helps track which collection belongs to which creator
   */
  async getCreatorCollection(creatorAddress: Address): Promise<Address | null> {
    try {
      // Import the database service dynamically to avoid circular dependencies
      const { ZoraDatabaseService } = await import('@/services/zora/ZoraDatabaseService')
      const dbService = new ZoraDatabaseService()
      const collection = await dbService.getCreatorCollection(creatorAddress)
      return collection?.zoraCollectionAddress || null
    } catch (error) {
      console.error('Error getting creator collection:', error)
      return null
    }
  }

  /**
   * Calculate optimal mint price based on content tier and creator settings
   */
  calculateMintPrice(
    subscriptionPrice: bigint,
    contentTier: 'free' | 'premium' | 'exclusive',
    creatorMultiplier: number = 1.0
  ): bigint {
    const basePrices = {
      free: parseEther('0.000777'), // Default Zora mint fee
      premium: parseEther('0.01'), // $0.01 worth in ETH
      exclusive: parseEther('0.05') // $0.05 worth in ETH
    }

    const basePrice = basePrices[contentTier]
    const adjustedPrice = BigInt(Math.floor(Number(basePrice) * creatorMultiplier))
    
    return adjustedPrice
  }

  /**
   * Format metadata for Zora NFT from your content structure
   * 
   * This creates comprehensive NFT metadata that includes all necessary
   * information for Zora marketplace integration.
   */
  formatContentAsNFTMetadata(
    contentId: string,
    title: string,
    description: string,
    imageUrl: string,
    creatorAddress: Address,
    category: string,
    tags: string[],
    subscriptionTier?: string
  ): ZoraNFTMetadata {
    // Create comprehensive attributes for NFT marketplace discovery
    const attributes = [
      { trait_type: 'Category', value: category },
      { trait_type: 'Platform', value: 'Onchain Content Platform' },
      { trait_type: 'Creator', value: creatorAddress },
      { trait_type: 'Publish Date', value: new Date().toISOString().split('T')[0] },
      { trait_type: 'Content ID', value: contentId },
      ...(subscriptionTier ? [{ trait_type: 'Tier', value: subscriptionTier }] : []),
      ...tags.map(tag => ({ trait_type: 'Tag', value: tag }))
    ]

    // Add rarity attributes based on subscription tier
    if (subscriptionTier) {
      const rarityMap = {
        free: 'Common',
        premium: 'Rare',
        exclusive: 'Legendary'
      }
      attributes.push({ trait_type: 'Rarity', value: rarityMap[subscriptionTier as keyof typeof rarityMap] })
    }

    return {
      name: title,
      description: `${description}\n\nOriginally published on Onchain Content Platform.\nCreator: ${creatorAddress}\nContent ID: ${contentId}`,
      image: imageUrl,
      external_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourplatform.com'}/content/${contentId}`,
      attributes,
      content_id: contentId,
      creator_address: creatorAddress,
      original_publish_date: new Date().toISOString(),
      subscription_tier: subscriptionTier,
      content_category: category,
      platform: 'onchain-content-platform',
      mint_price: parseEther('0.000777').toString(), // Default Zora mint price
      max_supply: 100,
      royalty_percentage: 5 // 5% royalty
    }
  }

  /**
   * Upload metadata to IPFS and return tokenURI
   * 
   * This method handles the complete IPFS upload process for NFT metadata
   * Uses the existing IPFS upload service for production-ready integration
   */
  async uploadMetadataToIPFS(metadata: ZoraNFTMetadata): Promise<{ success: boolean; tokenURI?: string; error?: string }> {
    try {
      // Create a blob from the metadata JSON
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json'
      })

      // Create a File object from the blob
      const metadataFile = new File([metadataBlob], 'metadata.json', {
        type: 'application/json'
      })

      // Upload to IPFS using the existing API endpoint
      const formData = new FormData()
      formData.append('file', metadataFile)

      const response = await fetch('/api/ipfs/upload', { 
        method: 'POST', 
        body: formData 
      })
      
      const result = await response.json() as { success?: boolean; hash?: string; error?: string; gateway?: string }
      
      if (!response.ok || !result?.hash) {
        throw new Error(result?.error || 'IPFS upload failed')
      }

      // Validate the returned hash format
      if (!this.isValidIPFSHash(result.hash)) {
        throw new Error('Invalid IPFS hash returned from upload service')
      }

      const tokenURI = `ipfs://${result.hash}`
      
      console.log('✅ Metadata uploaded to IPFS successfully:', {
        tokenURI,
        gateway: result.gateway,
        hash: result.hash
      })

      return {
        success: true,
        tokenURI
      }
    } catch (error) {
      console.error('❌ Error uploading metadata to IPFS:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Validate IPFS hash format
   */
  private isValidIPFSHash(hash: string): boolean {
    // Basic CID validation - should be at least 10 characters and start with Qm or bafy
    return hash.length >= 10 && (hash.startsWith('Qm') || hash.startsWith('bafy'))
  }

  /**
   * Production-ready mint validation
   * 
   * Comprehensive validation before minting to prevent errors and ensure
   * all parameters are within acceptable ranges
   */
  private validateMintParameters(
    collectionAddress: Address,
    metadata: ZoraNFTMetadata,
    mintPrice?: bigint
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate collection address
    if (!collectionAddress || collectionAddress === '0x0000000000000000000000000000000000000000') {
      errors.push('Invalid collection address')
    }

    // Validate metadata structure
    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push('NFT name is required')
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      errors.push('NFT description is required')
    }

    if (!metadata.image || !this.isValidImageUrl(metadata.image)) {
      errors.push('Valid image URL is required')
    }

    if (!metadata.attributes || metadata.attributes.length === 0) {
      errors.push('At least one attribute is required')
    }

    // Validate content-specific fields
    if (!metadata.content_id) {
      errors.push('Content ID is required')
    }

    if (!metadata.creator_address || metadata.creator_address === '0x0000000000000000000000000000000000000000') {
      errors.push('Valid creator address is required')
    }

    // Validate mint price if provided
    if (mintPrice !== undefined) {
      if (mintPrice < BigInt(0)) {
        errors.push('Mint price cannot be negative')
      }
      
      // Check if price is reasonable (not too high)
      const maxReasonablePrice = parseEther('10') // 10 ETH max
      if (mintPrice > maxReasonablePrice) {
        errors.push('Mint price is unreasonably high')
      }
    }

    // Validate metadata size (should be reasonable for IPFS)
    const metadataSize = JSON.stringify(metadata).length
    if (metadataSize > 10000) { // 10KB limit
      errors.push('Metadata is too large for IPFS upload')
    }

    // Validate subscription tier if present
    if (metadata.subscription_tier && !['free', 'premium', 'exclusive'].includes(metadata.subscription_tier)) {
      errors.push('Invalid subscription tier')
    }

    // Validate royalty percentage
    if (metadata.royalty_percentage !== undefined) {
      if (metadata.royalty_percentage < 0 || metadata.royalty_percentage > 50) {
        errors.push('Royalty percentage must be between 0 and 50')
      }
    }

    // Validate max supply
    if (metadata.max_supply !== undefined) {
      if (metadata.max_supply <= 0 || metadata.max_supply > 10000) {
        errors.push('Max supply must be between 1 and 10,000')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate image URL format
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return ['http:', 'https:', 'ipfs:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  /**
   * Get collection analytics for dashboard
   * 
   * Fetches comprehensive collection performance data including
   * minting statistics, revenue, and engagement metrics
   */
  async getCollectionAnalytics(
    collectionAddress: Address
  ): Promise<ZoraCollectionAnalytics | null> {
    try {
      // Import the database service dynamically to avoid circular dependencies
      const { ZoraDatabaseService } = await import('@/services/zora/ZoraDatabaseService')
      const dbService = new ZoraDatabaseService()

      // Get collection data from database
      const collection = await dbService.getCreatorCollection(collectionAddress)
      if (!collection) {
        console.warn('Collection not found for address:', collectionAddress)
        return null
      }

      // Get NFT performance data
      const performance = await dbService.getCreatorNFTPerformance(collectionAddress)

      // Calculate additional metrics
      const totalRevenue = collection.totalCollectionVolume
      const averagePrice = collection.totalMints > BigInt(0) 
        ? totalRevenue / collection.totalMints 
        : BigInt(0)

      // Calculate trends (simplified - in production you'd compare with historical data)
      const mintTrend = this.calculateTrend(collection.totalMints, BigInt(0)) // Compare with previous period
      const volumeTrend = this.calculateTrend(totalRevenue, BigInt(0)) // Compare with previous period

      // Calculate conversion rate (mints per view - simplified)
      const totalViews = 0 // Simplified - would come from performance data
      const conversionRate = totalViews > 0 ? Number(collection.totalMints) / totalViews : 0

      // Get recent activity (simplified - would come from database)
      const recentMints: Array<{ nftTokenId?: bigint; mintTimestamp?: Date; nftMintPrice?: bigint }> = []

      const analytics: ZoraCollectionAnalytics = {
        // Basic collection info
        collectionAddress,
        collectionName: collection.zoraCollectionName || 'Unnamed Collection',
        totalSupply: collection.maxSupply || 0,
        mintedCount: Number(collection.totalMints),
        
        // Financial metrics
        totalVolume: totalRevenue,
        averagePrice,
        floorPrice: this.calculateFloorPrice(collection.totalMints, totalRevenue),
        royaltyEarnings: this.calculateRoyaltyEarnings(totalRevenue, collection.royaltyBPS || 500),
        
        // Engagement metrics
        uniqueOwners: 0, // Simplified - would come from performance data
        totalViews: totalViews,
        conversionRate,
        
        // Time-based metrics
        mintsLast24h: BigInt(0),
        volumeLast24h: BigInt(0),
        mintsLast7d: BigInt(0),
        volumeLast7d: BigInt(0),
        mintsLast30d: BigInt(0),
        volumeLast30d: BigInt(0),
        
        // Trends
        mintTrend,
        volumeTrend,
        
        // Recent activity
        recentActivity: recentMints.map(mint => ({
          type: 'mint' as const,
          timestamp: mint.mintTimestamp?.toISOString() || new Date().toISOString(),
          description: `NFT #${mint.nftTokenId} minted`,
          value: mint.nftMintPrice?.toString() || '0'
        })),
        
        // Collection status
        collectionStatus: collection.collectionStatus,
        lastMintDate: collection.lastMintDate,
        createdAt: collection.collectionCreatedAt
      }

      return analytics

    } catch (error) {
      console.error('Error fetching collection analytics:', error)
      return null
    }
  }

  /**
   * Calculate trend direction based on current vs previous values
   */
  private calculateTrend(current: bigint, previous: bigint): 'increasing' | 'decreasing' | 'stable' {
    if (current > previous) return 'increasing'
    if (current < previous) return 'decreasing'
    return 'stable'
  }

  /**
   * Calculate floor price based on total mints and volume
   */
  private calculateFloorPrice(totalMints: bigint, totalVolume: bigint): bigint {
    if (totalMints === BigInt(0)) return BigInt(0)
    return totalVolume / totalMints
  }

  /**
   * Calculate royalty earnings based on volume and royalty rate
   */
  private calculateRoyaltyEarnings(totalVolume: bigint, royaltyBPS: number): bigint {
    return (totalVolume * BigInt(royaltyBPS)) / BigInt(10000)
  }
}

/**
 * React Hook for Zora Integration
 * 
 * This provides a clean interface for your React components to interact
 * with the Zora integration service.
 */
export function useZoraIntegration(chainId?: number) {
  const [service, setService] = useState<ZoraIntegrationService | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeService = useCallback(
    (publicClient: PublicClient, walletClient?: WalletClient) => {
      try {
        const zoraService = new ZoraIntegrationService(
          publicClient,
          walletClient,
          chainId
        )
        setService(zoraService)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Zora service')
      }
    },
    [chainId]
  )

  const mintContentAsNFT = useCallback(
    async (
      collectionAddress: Address,
      metadata: ZoraNFTMetadata,
      mintPrice?: bigint,
      maxSupply?: number
    ) => {
      if (!service) {
        throw new Error('Zora service not initialized')
      }

      setIsLoading(true)
      setError(null)

      try {
        // Upload metadata to IPFS first
        const uploadResult = await service.uploadMetadataToIPFS(metadata)
        if (!uploadResult.success) {
          throw new Error(`Failed to upload metadata: ${uploadResult.error}`)
        }

        const result = await service.mintContentAsNFT(
          collectionAddress,
          metadata,
          mintPrice,
          maxSupply
        )

        if (!result.success) {
          throw new Error(result.error || 'Minting failed')
        }

        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Minting failed'
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [service]
  )

  return {
    service,
    initializeService,
    mintContentAsNFT,
    isLoading,
    error
  }
}
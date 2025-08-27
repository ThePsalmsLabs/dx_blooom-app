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
import { PublicClient, WalletClient, Address, parseEther, formatEther, parseEventLogs } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { ZORA_CREATOR_1155_FACTORY_ABI, ZORA_CREATOR_1155_IMPL_ABI } from '@/lib/contracts/abis/zora'
import { ZORA_ADDRESSES } from '@/lib/contracts/addresses'
import { 
  extractContractAddressFromSetupEvent,
  extractTokenIdFromUpdatedEvent,
  parseSetupNewContractEvent,
  parseUpdatedTokenEvent
} from '@/lib/utils/zora-events'

// Get Zora addresses from the centralized configuration
function getZoraAddresses(chainId: number) {
  const addresses = ZORA_ADDRESSES[chainId as keyof typeof ZORA_ADDRESSES]
  if (!addresses) {
    throw new Error(`Zora Protocol not supported on chain ${chainId}`)
  }
  return addresses
}

/**
 * Content NFT Metadata Structure
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
  
  // IPFS token URI (added for production)
  tokenURI?: string
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
  async createCreatorCollection(
    config: ZoraCollectionConfig
  ): Promise<{ success: boolean; contractAddress?: Address; error?: string }> {
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

  /**
   * Mint content as NFT in existing collection
   * 
   * This takes content from your platform and mints it as an NFT on Zora,
   * creating a bridge between subscription content and collectible assets.
   */
  async mintContentAsNFT(
    collectionAddress: Address,
    metadata: ZoraNFTMetadata,
    mintPrice: bigint = parseEther('0.000777'), // Default Zora mint price
    maxSupply: number = 100
  ): Promise<NFTMintResult> {
    if (!this.walletClient) {
      return { success: false, error: 'Wallet client required for minting' }
    }

    try {
      // Validate metadata has tokenURI
      if (!metadata.tokenURI) {
        return { success: false, error: 'Metadata must include tokenURI for IPFS storage' }
      }

      // First, create the token in the collection using correct Zora V3 ABI
      const setupHash = await this.walletClient.writeContract({
        address: collectionAddress,
        abi: ZORA_CREATOR_1155_IMPL_ABI,
        functionName: 'setupNewToken',
        args: [
          metadata.tokenURI, // Use the IPFS URI
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
   * Follows the same pattern as CreatorProfileEditor for consistency
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

      // Upload to IPFS using the existing API endpoint - same pattern as CreatorProfileEditor
      const formData = new FormData()
      formData.append('file', metadataFile)

      const response = await fetch('/api/ipfs/upload', { 
        method: 'POST', 
        body: formData 
      })
      
      const result = await response.json() as { success?: boolean; hash?: string; error?: string }
      
      if (!response.ok || !result?.hash) {
        throw new Error(result?.error || 'IPFS upload failed')
      }

      const tokenURI = `ipfs://${result.hash}`
      return {
        success: true,
        tokenURI
      }
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
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

        // Create metadata with tokenURI
        const metadataWithURI = {
          ...metadata,
          tokenURI: uploadResult.tokenURI
        }

        const result = await service.mintContentAsNFT(
          collectionAddress,
          metadataWithURI,
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
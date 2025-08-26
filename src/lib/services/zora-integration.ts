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
import { PublicClient, WalletClient, Address, parseEther, formatEther } from 'viem'
import { base, baseSepolia } from 'viem/chains'

// Zora Protocol Addresses on Base
const ZORA_PROTOCOL_ADDRESSES = {
  [base.id]: {
    ZORA_CREATOR_1155_IMPL: '0x777777C338d93e2C7adf08D102d45CA7CC4Ed021' as const,
    ZORA_CREATOR_1155_FACTORY: '0x777777E8850d8D6d98De2d777C5c3c7d45261788' as const,
    PROTOCOL_REWARDS: '0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B' as const,
    ZORA_MINTS_MANAGER: '0x777777722D078c97c6ad07d9f36801e653E356Ae' as const,
  },
  [baseSepolia.id]: {
    ZORA_CREATOR_1155_IMPL: '0x777777C338d93e2C7adf08D102d45CA7CC4Ed021' as const,
    ZORA_CREATOR_1155_FACTORY: '0x777777E8850d8D6d98De2d777C5c3c7d45261788' as const,
    PROTOCOL_REWARDS: '0x7777777F279eba3d3Ad8F4E708545291A6fDBA8B' as const,
    ZORA_MINTS_MANAGER: '0x777777722D078c97c6ad07d9f36801e653E356Ae' as const,
  }
} as const

// Zora 1155 Creator Contract ABI (essential functions)
const ZORA_1155_ABI = [
  {
    type: 'function',
    name: 'setupNewToken',
    inputs: [
      { name: 'tokenURI', type: 'string' },
      { name: 'maxSupply', type: 'uint256' }
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'mintWithRewards',
    inputs: [
      { name: 'minter', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'quantity', type: 'uint256' },
      { name: 'minterArguments', type: 'bytes' },
      { name: 'mintReferral', type: 'address' }
    ],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'uri',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getTokenInfo',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'uri', type: 'string' },
          { name: 'maxSupply', type: 'uint256' },
          { name: 'totalMinted', type: 'uint256' }
        ]
      }
    ],
    stateMutability: 'view'
  }
] as const

// Zora Factory ABI for creating new collections
const ZORA_FACTORY_ABI = [
  {
    type: 'function',
    name: 'createContract',
    inputs: [
      { name: 'newContractURI', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'defaultAdmin', type: 'address' },
      { name: 'editionSize', type: 'uint64' },
      { name: 'royaltyBPS', type: 'uint16' },
      { name: 'fundsRecipient', type: 'address' },
      { name: 'defaultPrice', type: 'uint96' },
      { name: 'salesConfig', type: 'tuple', components: [
        { name: 'publicSalePrice', type: 'uint104' },
        { name: 'maxSalePurchasePerAddress', type: 'uint32' },
        { name: 'publicSaleStart', type: 'uint64' },
        { name: 'publicSaleEnd', type: 'uint64' },
        { name: 'presaleStart', type: 'uint64' },
        { name: 'presaleEnd', type: 'uint64' },
        { name: 'presaleMerkleRoot', type: 'bytes32' }
      ] }
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'nonpayable'
  }
] as const

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

    if (!ZORA_PROTOCOL_ADDRESSES[chainId as keyof typeof ZORA_PROTOCOL_ADDRESSES]) {
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
      const addresses = ZORA_PROTOCOL_ADDRESSES[this.chainId as keyof typeof ZORA_PROTOCOL_ADDRESSES]
      
      // Prepare sales configuration
      const salesConfig = {
        publicSalePrice: config.defaultPrice,
        maxSalePurchasePerAddress: 10, // Allow up to 10 mints per address
        publicSaleStart: BigInt(Math.floor((config.publicSaleStart?.getTime() ?? Date.now()) / 1000)),
        publicSaleEnd: BigInt(Math.floor((config.publicSaleEnd?.getTime() ?? Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000)), // 30 days from now
        presaleStart: BigInt(0),
        presaleEnd: BigInt(0),
        presaleMerkleRoot: '0x0000000000000000000000000000000000000000000000000000000000000000' as const
      }

      // Create the collection contract
      const hash = await this.walletClient.writeContract({
        address: addresses.ZORA_CREATOR_1155_FACTORY,
        abi: ZORA_FACTORY_ABI,
        functionName: 'createContract',
        args: [
          config.contractURI,
          config.name,
          config.creator,
          BigInt(config.maxSupply),
          config.royaltyBPS,
          config.creator, // funds recipient
          config.defaultPrice,
          salesConfig
        ],
        account: config.creator,
        chain: this.chainId === base.id ? base : baseSepolia
      })

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash })
      
      if (receipt.status === 'success' && receipt.logs.length > 0) {
        // Extract contract address from logs (typically the first log for contract creation)
        const contractAddress = receipt.logs[0].address as Address
        
        return {
          success: true,
          contractAddress
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
      // First, create the token in the collection
      const setupHash = await this.walletClient.writeContract({
        address: collectionAddress,
        abi: ZORA_1155_ABI,
        functionName: 'setupNewToken',
        args: [
          JSON.stringify(metadata), // Token URI with metadata
          BigInt(maxSupply)
        ],
        account: metadata.creator_address,
        chain: this.chainId === base.id ? base : baseSepolia
      })

      const setupReceipt = await this.publicClient.waitForTransactionReceipt({ hash: setupHash })
      
      if (setupReceipt.status !== 'success') {
        return { success: false, error: 'Failed to setup token' }
      }

      // Extract token ID from logs
      const tokenId = BigInt(1) // For simplicity, assume sequential token IDs
      
      // Mint the first NFT to the creator
      const mintHash = await this.walletClient.writeContract({
        address: collectionAddress,
        abi: ZORA_1155_ABI,
        functionName: 'mintWithRewards',
        args: [
          metadata.creator_address, // recipient
          tokenId,
          BigInt(1), // quantity
          '0x' as const, // minter arguments
          metadata.creator_address // mint referral
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
        abi: ZORA_1155_ABI,
        functionName: 'getTokenInfo',
        args: [tokenId]
      })

      return {
        uri: tokenInfo.uri,
        maxSupply: tokenInfo.maxSupply,
        totalMinted: tokenInfo.totalMinted,
        metadata: JSON.parse(tokenInfo.uri) as ZoraNFTMetadata
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
    return {
      name: title,
      description: `${description}\n\nOriginally published on Onchain Content Platform.\nCreator: ${creatorAddress}`,
      image: imageUrl,
      external_url: `https://yourplatform.com/content/${contentId}`,
      attributes: [
        { trait_type: 'Category', value: category },
        { trait_type: 'Platform', value: 'Onchain Content Platform' },
        { trait_type: 'Creator', value: creatorAddress },
        { trait_type: 'Publish Date', value: new Date().toISOString().split('T')[0] },
        ...(subscriptionTier ? [{ trait_type: 'Tier', value: subscriptionTier }] : []),
        ...tags.map(tag => ({ trait_type: 'Tag', value: tag }))
      ],
      content_id: contentId,
      creator_address: creatorAddress,
      original_publish_date: new Date().toISOString(),
      subscription_tier: subscriptionTier,
      content_category: category,
      platform: 'onchain-content-platform'
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
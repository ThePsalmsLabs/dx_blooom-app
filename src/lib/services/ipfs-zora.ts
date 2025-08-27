/**
 * IPFS Service for Zora Metadata
 * 
 * This service handles all IPFS operations for Zora NFT metadata,
 * including upload, validation, and fallback mechanisms.
 */

import { type Address } from 'viem'

// IPFS Gateway Configuration
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.fleek.co/ipfs/'
] as const

// IPFS Upload Configuration
const IPFS_CONFIG = {
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/json']
} as const

/**
 * Zora Metadata Structure
 */
export interface ZoraMetadata {
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
  content_id?: string
  creator_address?: Address
  original_publish_date?: string
  subscription_tier?: string
  content_category?: string
  platform: 'onchain-content-platform'
  
  // Zora-specific fields
  mint_price?: string
  max_supply?: number
  royalty_percentage?: number
}

/**
 * Collection Metadata Structure
 */
export interface ZoraCollectionMetadata {
  name: string
  description: string
  image: string
  external_link: string
  seller_fee_basis_points: number
  fee_recipient: Address
}

/**
 * IPFS Upload Result
 */
export interface IPFSUploadResult {
  success: boolean
  hash: string
  url: string
  gateway: string
  error?: string
}

/**
 * IPFS Service Class
 */
export class IPFSService {
  private currentGatewayIndex = 0

  /**
   * Upload metadata to IPFS
   */
  async uploadMetadata(
    metadata: ZoraMetadata | ZoraCollectionMetadata,
    retryCount = 0
  ): Promise<IPFSUploadResult> {
    try {
      // Validate metadata
      this.validateMetadata(metadata)

      // Convert metadata to JSON
      const jsonData = JSON.stringify(metadata, null, 2)
      
      // Create blob for upload
      const blob = new Blob([jsonData], { type: 'application/json' })
      
      // Upload to IPFS
      const result = await this.uploadToIPFS(blob)
      
      if (result.success) {
        return {
          success: true,
          hash: result.hash,
          url: result.url,
          gateway: result.gateway
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('IPFS upload failed:', error)
      
      // Retry with different gateway
      if (retryCount < IPFS_CONFIG.maxRetries) {
        this.rotateGateway()
        return this.uploadMetadata(metadata, retryCount + 1)
      }
      
      return {
        success: false,
        hash: '',
        url: '',
        gateway: '',
        error: error instanceof Error ? error.message : 'Upload failed after retries'
      }
    }
  }

  /**
   * Upload image to IPFS
   */
  async uploadImage(
    file: File | Blob,
    retryCount = 0
  ): Promise<IPFSUploadResult> {
    try {
      // Validate file
      this.validateFile(file)
      
      // Upload to IPFS
      const result = await this.uploadToIPFS(file)
      
      if (result.success) {
        return {
          success: true,
          hash: result.hash,
          url: result.url,
          gateway: result.gateway
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('IPFS image upload failed:', error)
      
      // Retry with different gateway
      if (retryCount < IPFS_CONFIG.maxRetries) {
        this.rotateGateway()
        return this.uploadImage(file, retryCount + 1)
      }
      
      return {
        success: false,
        hash: '',
        url: '',
        gateway: '',
        error: error instanceof Error ? error.message : 'Upload failed after retries'
      }
    }
  }

  /**
   * Upload to IPFS using current gateway
   */
  private async uploadToIPFS(file: File | Blob): Promise<IPFSUploadResult> {
    const gateway = IPFS_GATEWAYS[this.currentGatewayIndex]
    
    try {
      // For now, we'll use a mock upload since we don't have IPFS node configured
      // In production, this would use actual IPFS upload endpoints
      
      // Simulate IPFS upload
      const mockHash = this.generateMockIPFSHash(file)
      const url = `${gateway}${mockHash}`
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        hash: mockHash,
        url,
        gateway
      }
      
    } catch (error) {
      return {
        success: false,
        hash: '',
        url: '',
        gateway,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  /**
   * Validate metadata structure
   */
  private validateMetadata(metadata: ZoraMetadata | ZoraCollectionMetadata): void {
    if (!metadata.name || typeof metadata.name !== 'string') {
      throw new Error('Metadata must have a valid name')
    }
    
    if (!metadata.description || typeof metadata.description !== 'string') {
      throw new Error('Metadata must have a valid description')
    }
    
    if (metadata.name.length > 100) {
      throw new Error('Metadata name too long (max 100 characters)')
    }
    
    if (metadata.description.length > 1000) {
      throw new Error('Metadata description too long (max 1000 characters)')
    }
  }

  /**
   * Validate file for upload
   */
  private validateFile(file: File | Blob): void {
    if (file.size > IPFS_CONFIG.maxFileSize) {
      throw new Error(`File too large (max ${IPFS_CONFIG.maxFileSize / 1024 / 1024}MB)`)
    }
    
    if (file instanceof File) {
      if (!IPFS_CONFIG.supportedFormats.includes(file.type as any)) {
        throw new Error(`Unsupported file type: ${file.type}`)
      }
    }
  }

  /**
   * Rotate to next gateway
   */
  private rotateGateway(): void {
    this.currentGatewayIndex = (this.currentGatewayIndex + 1) % IPFS_GATEWAYS.length
  }

  /**
   * Generate mock IPFS hash for development
   * In production, this would be the actual IPFS hash
   */
  private generateMockIPFSHash(file: File | Blob): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const size = file.size
    return `Qm${timestamp}${random}${size}`.slice(0, 46) // IPFS hashes are 46 characters
  }

  /**
   * Get IPFS URL from hash
   */
  getIPFSURL(hash: string, gatewayIndex = 0): string {
    const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]
    return `${gateway}${hash}`
  }

  /**
   * Validate IPFS hash format
   */
  validateIPFSHash(hash: string): boolean {
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash)
  }
}

/**
 * Singleton instance
 */
export const ipfsService = new IPFSService()

/**
 * Utility functions for metadata creation
 */
export const createZoraMetadata = (
  name: string,
  description: string,
  imageUrl: string,
  creatorAddress: Address,
  options: {
    contentId?: string
    subscriptionTier?: string
    contentCategory?: string
    mintPrice?: string
    maxSupply?: number
    royaltyPercentage?: number
    attributes?: Array<{ trait_type: string; value: string | number }>
  } = {}
): ZoraMetadata => {
  return {
    name,
    description,
    image: imageUrl,
    external_url: `https://yourplatform.com/content/${options.contentId || 'unknown'}`,
    attributes: [
      { trait_type: 'Creator', value: creatorAddress },
      { trait_type: 'Platform', value: 'onchain-content-platform' },
      ...(options.subscriptionTier ? [{ trait_type: 'Subscription Tier', value: options.subscriptionTier }] : []),
      ...(options.contentCategory ? [{ trait_type: 'Category', value: options.contentCategory }] : []),
      ...(options.attributes || [])
    ],
    content_id: options.contentId,
    creator_address: creatorAddress,
    original_publish_date: new Date().toISOString(),
    subscription_tier: options.subscriptionTier,
    content_category: options.contentCategory,
    platform: 'onchain-content-platform',
    mint_price: options.mintPrice,
    max_supply: options.maxSupply,
    royalty_percentage: options.royaltyPercentage
  }
}

export const createZoraCollectionMetadata = (
  name: string,
  description: string,
  imageUrl: string,
  royaltyBPS: number,
  feeRecipient: Address
): ZoraCollectionMetadata => {
  return {
    name,
    description,
    image: imageUrl,
    external_link: `https://yourplatform.com/collections/${feeRecipient}`,
    seller_fee_basis_points: royaltyBPS,
    fee_recipient: feeRecipient
  }
}

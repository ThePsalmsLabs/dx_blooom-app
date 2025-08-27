import { parseEther } from 'viem'

export interface NFTMetadata {
  name: string
  description: string
  image: string
  external_url?: string
  attributes: Array<{
    trait_type: string
    value: string | number
    display_type?: string
  }>
  properties: {
    files?: Array<{
      uri: string
      type: string
    }>
    category?: string
    creators?: Array<{
      address: string
      share: number
    }>
  }
}

export interface ContentMetadata {
  title: string
  description: string
  contentType: 'article' | 'video' | 'audio' | 'image'
  category: string
  tags: string[]
  contentUrl?: string
  thumbnailUrl?: string
  author: string
  authorAddress: string
  createdAt: string
  publishedAt?: string
}

export class ZoraMetadataService {
  private static instance: ZoraMetadataService

  static getInstance(): ZoraMetadataService {
    if (!ZoraMetadataService.instance) {
      ZoraMetadataService.instance = new ZoraMetadataService()
    }
    return ZoraMetadataService.instance
  }

  /**
   * Generate NFT metadata from content data
   */
  generateNFTMetadata(
    contentMetadata: ContentMetadata,
    nftOptions: {
      tokenId: string
      collectionName: string
      collectionAddress: string
      mintPrice: bigint
      maxSupply: number
      royalty: number
    }
  ): NFTMetadata {
    const {
      title,
      description,
      contentType,
      category,
      tags,
      contentUrl,
      thumbnailUrl,
      author,
      authorAddress,
      createdAt,
      publishedAt
    } = contentMetadata

    const {
      tokenId,
      collectionName,
      collectionAddress,
      mintPrice,
      maxSupply,
      royalty
    } = nftOptions

    // Generate NFT name
    const nftName = `${title} #${tokenId}`

    // Generate NFT description
    const nftDescription = `${description}\n\nThis is a collectible NFT from the "${collectionName}" collection on Zora.`

    // Generate attributes
    const attributes = [
      {
        trait_type: 'Content Type',
        value: contentType.charAt(0).toUpperCase() + contentType.slice(1)
      },
      {
        trait_type: 'Category',
        value: category
      },
      {
        trait_type: 'Collection',
        value: collectionName
      },
      {
        trait_type: 'Token ID',
        value: tokenId,
        display_type: 'number'
      },
      {
        trait_type: 'Max Supply',
        value: maxSupply,
        display_type: 'number'
      },
      {
        trait_type: 'Mint Price',
        value: mintPrice.toString(),
        display_type: 'number'
      },
      {
        trait_type: 'Royalty',
        value: `${royalty}%`,
        display_type: 'number'
      },
      {
        trait_type: 'Author',
        value: author
      },
      {
        trait_type: 'Created',
        value: new Date(createdAt).toISOString(),
        display_type: 'date'
      }
    ]

    // Add tags as attributes
    tags.forEach(tag => {
      attributes.push({
        trait_type: 'Tag',
        value: tag
      })
    })

    // Generate properties
    const properties: NFTMetadata['properties'] = {
      category: contentType,
      creators: [
        {
          address: authorAddress,
          share: 100
        }
      ]
    }

    // Add files if content URL is provided
    if (contentUrl) {
      properties.files = [
        {
          uri: contentUrl,
          type: this.getContentType(contentType)
        }
      ]
    }

    return {
      name: nftName,
      description: nftDescription,
      image: thumbnailUrl || this.generateDefaultImage(contentType, title),
      external_url: contentUrl,
      attributes,
      properties
    }
  }

  /**
   * Generate metadata for a collection
   */
  generateCollectionMetadata(
    collectionData: {
      name: string
      description: string
      symbol: string
      royalty: number
      creatorAddress: string
      creatorName: string
    }
  ): NFTMetadata {
    const { name, description, symbol, royalty, creatorAddress, creatorName } = collectionData

    return {
      name: `${name} Collection`,
      description: `${description}\n\nA curated collection of NFTs on Zora.`,
      image: this.generateDefaultImage('collection', name),
      attributes: [
        {
          trait_type: 'Collection Name',
          value: name
        },
        {
          trait_type: 'Symbol',
          value: symbol
        },
        {
          trait_type: 'Royalty',
          value: `${royalty}%`,
          display_type: 'number'
        },
        {
          trait_type: 'Creator',
          value: creatorName
        },
        {
          trait_type: 'Platform',
          value: 'Zora'
        }
      ],
      properties: {
        category: 'collection',
        creators: [
          {
            address: creatorAddress,
            share: 100
          }
        ]
      }
    }
  }

  /**
   * Validate metadata before uploading
   */
  validateMetadata(metadata: NFTMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push('Name is required')
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      errors.push('Description is required')
    }

    if (!metadata.image || metadata.image.trim().length === 0) {
      errors.push('Image URL is required')
    }

    if (!metadata.attributes || metadata.attributes.length === 0) {
      errors.push('At least one attribute is required')
    }

    // Validate image URL format
    if (metadata.image && !this.isValidUrl(metadata.image)) {
      errors.push('Invalid image URL format')
    }

    // Validate external URL format if provided
    if (metadata.external_url && !this.isValidUrl(metadata.external_url)) {
      errors.push('Invalid external URL format')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate default image for content type
   */
  private generateDefaultImage(contentType: string, title: string): string {
    const baseUrl = 'https://via.placeholder.com/400x400'
    const colors = {
      article: '2563eb',
      video: 'dc2626',
      audio: '7c3aed',
      image: '16a34a',
      collection: 'f59e0b'
    }
    
    const color = colors[contentType as keyof typeof colors] || '6b7280'
    const encodedTitle = encodeURIComponent(title)
    
    return `${baseUrl}/${color}/ffffff?text=${encodedTitle}`
  }

  /**
   * Get content type for file properties
   */
  private getContentType(contentType: string): string {
    const types = {
      article: 'text/html',
      video: 'video/mp4',
      audio: 'audio/mpeg',
      image: 'image/png'
    }
    
    return types[contentType as keyof typeof types] || 'text/plain'
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Generate metadata hash for verification
   */
  generateMetadataHash(metadata: NFTMetadata): string {
    const metadataString = JSON.stringify(metadata, Object.keys(metadata).sort())
    // In a real implementation, you would hash this string
    return btoa(metadataString).slice(0, 16)
  }
}

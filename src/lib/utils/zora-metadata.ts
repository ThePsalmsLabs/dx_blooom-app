export interface MetadataAttribute {
  trait_type: string
  value: string | number
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date'
}

export interface MetadataProperties {
  files?: Array<{
    uri: string
    type: string
    cdn?: boolean
  }>
  category?: string
  creators?: Array<{
    address: string
    share: number
    verified?: boolean
  }>
  collection?: {
    name: string
    family?: string
  }
}

export interface NFTMetadata {
  name: string
  symbol?: string
  description: string
  image: string
  external_url?: string
  animation_url?: string
  attributes: MetadataAttribute[]
  properties: MetadataProperties
}

export class ZoraMetadataUtils {
  /**
   * Validate metadata structure
   */
  static validateMetadata(metadata: NFTMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required fields
    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push('Name is required')
    }

    if (!metadata.description || metadata.description.trim().length === 0) {
      errors.push('Description is required')
    }

    if (!metadata.image || metadata.image.trim().length === 0) {
      errors.push('Image URL is required')
    }

    // Validate URLs
    if (metadata.image && !this.isValidUrl(metadata.image)) {
      errors.push('Invalid image URL format')
    }

    if (metadata.external_url && !this.isValidUrl(metadata.external_url)) {
      errors.push('Invalid external URL format')
    }

    if (metadata.animation_url && !this.isValidUrl(metadata.animation_url)) {
      errors.push('Invalid animation URL format')
    }

    // Validate attributes
    if (!metadata.attributes || !Array.isArray(metadata.attributes)) {
      errors.push('Attributes must be an array')
    } else {
      metadata.attributes.forEach((attr, index) => {
        if (!attr.trait_type || attr.trait_type.trim().length === 0) {
          errors.push(`Attribute ${index}: trait_type is required`)
        }
        if (attr.value === undefined || attr.value === null) {
          errors.push(`Attribute ${index}: value is required`)
        }
      })
    }

    // Validate properties
    if (metadata.properties) {
      if (metadata.properties.creators) {
        metadata.properties.creators.forEach((creator, index) => {
          if (!creator.address || !this.isValidAddress(creator.address)) {
            errors.push(`Creator ${index}: invalid address`)
          }
          if (creator.share < 0 || creator.share > 100) {
            errors.push(`Creator ${index}: share must be between 0 and 100`)
          }
        })
      }

      if (metadata.properties.files) {
        metadata.properties.files.forEach((file, index) => {
          if (!file.uri || !this.isValidUrl(file.uri)) {
            errors.push(`File ${index}: invalid URI`)
          }
          if (!file.type || file.type.trim().length === 0) {
            errors.push(`File ${index}: type is required`)
          }
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate metadata hash for verification
   */
  static generateMetadataHash(metadata: NFTMetadata): string {
    const normalizedMetadata = this.normalizeMetadata(metadata)
    const metadataString = JSON.stringify(normalizedMetadata)
    
    // Simple hash function - in production use crypto-js or similar
    let hash = 0
    for (let i = 0; i < metadataString.length; i++) {
      const char = metadataString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16)
  }

  /**
   * Normalize metadata for consistent hashing
   */
  static normalizeMetadata(metadata: NFTMetadata): NFTMetadata {
    return {
      name: metadata.name.trim(),
      symbol: metadata.symbol?.trim(),
      description: metadata.description.trim(),
      image: metadata.image.trim(),
      external_url: metadata.external_url?.trim(),
      animation_url: metadata.animation_url?.trim(),
      attributes: metadata.attributes
        .map(attr => ({
          trait_type: attr.trait_type.trim(),
          value: attr.value,
          display_type: attr.display_type
        }))
        .sort((a, b) => a.trait_type.localeCompare(b.trait_type)),
      properties: {
        files: metadata.properties.files?.map(file => ({
          uri: file.uri.trim(),
          type: file.type.trim(),
          cdn: file.cdn
        })),
        category: metadata.properties.category?.trim(),
        creators: metadata.properties.creators?.map(creator => ({
          address: creator.address.toLowerCase(),
          share: creator.share,
          verified: creator.verified
        })),
        collection: metadata.properties.collection ? {
          name: metadata.properties.collection.name.trim(),
          family: metadata.properties.collection.family?.trim()
        } : undefined
      }
    }
  }

  /**
   * Generate default metadata for content
   */
  static generateDefaultMetadata(
    title: string,
    description: string,
    contentType: 'article' | 'video' | 'audio' | 'image',
    author: string,
    authorAddress: string,
    tokenId: string
  ): NFTMetadata {
    const attributes: MetadataAttribute[] = [
      {
        trait_type: 'Content Type',
        value: contentType.charAt(0).toUpperCase() + contentType.slice(1)
      },
      {
        trait_type: 'Author',
        value: author
      },
      {
        trait_type: 'Token ID',
        value: tokenId,
        display_type: 'number'
      },
      {
        trait_type: 'Created',
        value: new Date().toISOString(),
        display_type: 'date'
      }
    ]

    return {
      name: `${title} #${tokenId}`,
      description: `${description}\n\nThis is a collectible NFT representing the content "${title}".`,
      image: this.generateDefaultImage(contentType, title),
      attributes,
      properties: {
        category: contentType,
        creators: [
          {
            address: authorAddress,
            share: 100
          }
        ]
      }
    }
  }

  /**
   * Generate default image for content type
   */
  static generateDefaultImage(contentType: string, title: string): string {
    const baseUrl = 'https://via.placeholder.com/400x400'
    const colors = {
      article: '2563eb',
      video: 'dc2626',
      audio: '7c3aed',
      image: '16a34a'
    }
    
    const color = colors[contentType as keyof typeof colors] || '6b7280'
    const encodedTitle = encodeURIComponent(title)
    
    return `${baseUrl}/${color}/ffffff?text=${encodedTitle}`
  }

  /**
   * Add attribute to metadata
   */
  static addAttribute(
    metadata: NFTMetadata,
    traitType: string,
    value: string | number,
    displayType?: string
  ): NFTMetadata {
    const newAttribute: MetadataAttribute = {
      trait_type: traitType,
      value,
      display_type: displayType as any
    }

    return {
      ...metadata,
      attributes: [...metadata.attributes, newAttribute]
    }
  }

  /**
   * Remove attribute from metadata
   */
  static removeAttribute(metadata: NFTMetadata, traitType: string): NFTMetadata {
    return {
      ...metadata,
      attributes: metadata.attributes.filter(attr => attr.trait_type !== traitType)
    }
  }

  /**
   * Update attribute value
   */
  static updateAttribute(
    metadata: NFTMetadata,
    traitType: string,
    newValue: string | number
  ): NFTMetadata {
    return {
      ...metadata,
      attributes: metadata.attributes.map(attr =>
        attr.trait_type === traitType
          ? { ...attr, value: newValue }
          : attr
      )
    }
  }

  /**
   * Add creator to metadata
   */
  static addCreator(
    metadata: NFTMetadata,
    address: string,
    share: number,
    verified: boolean = false
  ): NFTMetadata {
    const newCreator = { address, share, verified }
    const creators = metadata.properties.creators || []
    
    return {
      ...metadata,
      properties: {
        ...metadata.properties,
        creators: [...creators, newCreator]
      }
    }
  }

  /**
   * Remove creator from metadata
   */
  static removeCreator(metadata: NFTMetadata, address: string): NFTMetadata {
    const creators = metadata.properties.creators?.filter(
      creator => creator.address.toLowerCase() !== address.toLowerCase()
    ) || []

    return {
      ...metadata,
      properties: {
        ...metadata.properties,
        creators
      }
    }
  }

  /**
   * Add file to metadata
   */
  static addFile(
    metadata: NFTMetadata,
    uri: string,
    type: string,
    cdn: boolean = false
  ): NFTMetadata {
    const newFile = { uri, type, cdn }
    const files = metadata.properties.files || []
    
    return {
      ...metadata,
      properties: {
        ...metadata.properties,
        files: [...files, newFile]
      }
    }
  }

  /**
   * Remove file from metadata
   */
  static removeFile(metadata: NFTMetadata, uri: string): NFTMetadata {
    const files = metadata.properties.files?.filter(file => file.uri !== uri) || []

    return {
      ...metadata,
      properties: {
        ...metadata.properties,
        files
      }
    }
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate Ethereum address format
   */
  private static isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  /**
   * Get attribute value by trait type
   */
  static getAttributeValue(metadata: NFTMetadata, traitType: string): string | number | undefined {
    const attribute = metadata.attributes.find(attr => attr.trait_type === traitType)
    return attribute?.value
  }

  /**
   * Check if metadata has attribute
   */
  static hasAttribute(metadata: NFTMetadata, traitType: string): boolean {
    return metadata.attributes.some(attr => attr.trait_type === traitType)
  }

  /**
   * Get all trait types from metadata
   */
  static getTraitTypes(metadata: NFTMetadata): string[] {
    return metadata.attributes.map(attr => attr.trait_type)
  }

  /**
   * Get unique trait values for a specific trait type
   */
  static getUniqueTraitValues(metadataList: NFTMetadata[], traitType: string): (string | number)[] {
    const values = metadataList
      .map(metadata => this.getAttributeValue(metadata, traitType))
      .filter((value): value is string | number => value !== undefined)
    
    return [...new Set(values)]
  }
}

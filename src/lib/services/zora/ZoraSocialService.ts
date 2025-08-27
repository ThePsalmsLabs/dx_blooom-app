export interface SocialShareData {
  title: string
  description: string
  url: string
  image?: string
  tags?: string[]
  platform: 'twitter' | 'discord' | 'telegram' | 'linkedin' | 'facebook'
}

export interface NFTSocialShareData extends SocialShareData {
  tokenId: string
  collectionAddress: string
  mintPrice: string
  network: string
  collectionName: string
}

export interface SocialMetrics {
  shares: number
  likes: number
  comments: number
  views: number
  engagement: number
}

export class ZoraSocialService {
  private static instance: ZoraSocialService

  static getInstance(): ZoraSocialService {
    if (!ZoraSocialService.instance) {
      ZoraSocialService.instance = new ZoraSocialService()
    }
    return ZoraSocialService.instance
  }

  /**
   * Generate share text for different platforms
   */
  generateShareText(data: SocialShareData | NFTSocialShareData): string {
    const isNFT = 'tokenId' in data
    
    if (isNFT) {
      return this.generateNFTShareText(data as NFTSocialShareData)
    }
    
    return this.generateContentShareText(data as SocialShareData)
  }

  /**
   * Generate NFT-specific share text
   */
  private generateNFTShareText(data: NFTSocialShareData): string {
    const { title, description, tokenId, mintPrice, network, collectionName } = data
    
    const baseText = `Check out my new NFT: ${title} on Zora! 🚀\n\n`
    const details = `Mint Price: ${mintPrice} ETH\nToken ID: #${tokenId}\nNetwork: ${network}\nCollection: ${collectionName}\n\n`
    const descriptionText = `${description}\n\n`
    const hashtags = `#NFT #Zora #Web3 #${network} #${collectionName.replace(/\s+/g, '')}`
    
    return baseText + details + descriptionText + hashtags
  }

  /**
   * Generate content share text
   */
  private generateContentShareText(data: SocialShareData): string {
    const { title, description, tags } = data
    
    const baseText = `Just published: ${title} 🎉\n\n`
    const descriptionText = `${description}\n\n`
    const hashtags = tags ? tags.map(tag => `#${tag}`).join(' ') : '#Content #CreatorEconomy'
    
    return baseText + descriptionText + hashtags
  }

  /**
   * Generate share URL for different platforms
   */
  generateShareUrl(data: SocialShareData | NFTSocialShareData): string {
    const text = this.generateShareText(data)
    const encodedText = encodeURIComponent(text)
    const encodedUrl = encodeURIComponent(data.url)
    
    switch (data.platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
      
      case 'discord':
        return `https://discord.com/channels/@me`
      
      case 'telegram':
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
      
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
      
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      
      default:
        return data.url
    }
  }

  /**
   * Open share dialog for a platform
   */
  shareToPlatform(data: SocialShareData | NFTSocialShareData): void {
    const url = this.generateShareUrl(data)
    
    // Open in popup window for better UX
    const width = 600
    const height = 400
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2
    
    window.open(
      url,
      'share',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )
  }

  /**
   * Share to multiple platforms
   */
  shareToMultiplePlatforms(
    data: Omit<SocialShareData | NFTSocialShareData, 'platform'>,
    platforms: Array<'twitter' | 'discord' | 'telegram' | 'linkedin' | 'facebook'>
  ): void {
    platforms.forEach(platform => {
      const shareData = { ...data, platform }
      this.shareToPlatform(shareData)
    })
  }

  /**
   * Generate embed code for websites
   */
  generateEmbedCode(data: SocialShareData | NFTSocialShareData): string {
    const { title, description, url, image } = data
    
    return `
<div class="zora-embed">
  <div class="zora-embed-content">
    <h3>${title}</h3>
    <p>${description}</p>
    <a href="${url}" target="_blank" rel="noopener noreferrer">
      View on Zora
    </a>
  </div>
  ${image ? `<img src="${image}" alt="${title}" />` : ''}
</div>
    `.trim()
  }

  /**
   * Track social sharing metrics
   */
  async trackShare(data: SocialShareData | NFTSocialShareData): Promise<void> {
    try {
      // In a real implementation, this would send to your analytics service
      const trackingData = {
        platform: data.platform,
        contentType: 'tokenId' in data ? 'nft' : 'content',
        title: data.title,
        url: data.url,
        timestamp: new Date().toISOString()
      }
      
      console.log('Tracking share:', trackingData)
      
      // You could send this to your backend or analytics service
      // await fetch('/api/analytics/share', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(trackingData)
      // })
    } catch (error) {
      console.error('Failed to track share:', error)
    }
  }

  /**
   * Get social metrics for content/NFT
   */
  async getSocialMetrics(url: string): Promise<SocialMetrics> {
    try {
      // In a real implementation, this would fetch from your analytics service
      // For now, return mock data
      return {
        shares: Math.floor(Math.random() * 100) + 10,
        likes: Math.floor(Math.random() * 500) + 50,
        comments: Math.floor(Math.random() * 50) + 5,
        views: Math.floor(Math.random() * 1000) + 100,
        engagement: Math.floor(Math.random() * 10) + 1
      }
    } catch (error) {
      console.error('Failed to get social metrics:', error)
      return {
        shares: 0,
        likes: 0,
        comments: 0,
        views: 0,
        engagement: 0
      }
    }
  }

  /**
   * Generate social preview metadata
   */
  generateSocialPreview(data: SocialShareData | NFTSocialShareData): {
    title: string
    description: string
    image: string
    url: string
  } {
    const isNFT = 'tokenId' in data
    
    return {
      title: isNFT ? `${data.title} NFT on Zora` : data.title,
      description: data.description,
      image: data.image || this.generateDefaultSocialImage(data),
      url: data.url
    }
  }

  /**
   * Generate default social image
   */
  private generateDefaultSocialImage(data: SocialShareData | NFTSocialShareData): string {
    const isNFT = 'tokenId' in data
    const baseUrl = 'https://via.placeholder.com/1200x630'
    const color = isNFT ? '7c3aed' : '2563eb'
    const text = encodeURIComponent(data.title)
    
    return `${baseUrl}/${color}/ffffff?text=${text}`
  }

  /**
   * Validate social share data
   */
  validateShareData(data: SocialShareData | NFTSocialShareData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required')
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required')
    }

    if (!data.url || data.url.trim().length === 0) {
      errors.push('URL is required')
    }

    if (!this.isValidUrl(data.url)) {
      errors.push('Invalid URL format')
    }

    if (data.image && !this.isValidUrl(data.image)) {
      errors.push('Invalid image URL format')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
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
}

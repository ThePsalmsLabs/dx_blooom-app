export interface SocialShareConfig {
  title: string
  description: string
  url: string
  image?: string
  tags?: string[]
  via?: string
  hashtags?: string[]
}

export interface NFTSocialShareConfig extends SocialShareConfig {
  tokenId: string
  collectionAddress: string
  mintPrice: string
  network: string
  collectionName: string
}

export interface SocialPlatform {
  name: string
  url: string
  icon: string
  color: string
  maxLength?: number
}

export class ZoraSocialUtils {
  private static readonly PLATFORMS: Record<string, SocialPlatform> = {
    twitter: {
      name: 'Twitter',
      url: 'https://twitter.com/intent/tweet',
      icon: '🐦',
      color: '#1DA1F2',
      maxLength: 280
    },
    discord: {
      name: 'Discord',
      url: 'https://discord.com/channels/@me',
      icon: '🎮',
      color: '#5865F2'
    },
    telegram: {
      name: 'Telegram',
      url: 'https://t.me/share/url',
      icon: '📱',
      color: '#0088CC'
    },
    linkedin: {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/sharing/share-offsite',
      icon: '💼',
      color: '#0077B5'
    },
    facebook: {
      name: 'Facebook',
      url: 'https://www.facebook.com/sharer/sharer.php',
      icon: '📘',
      color: '#1877F2'
    },
    reddit: {
      name: 'Reddit',
      url: 'https://reddit.com/submit',
      icon: '🤖',
      color: '#FF4500'
    }
  }

  /**
   * Generate share text for different platforms
   */
  static generateShareText(
    config: SocialShareConfig | NFTSocialShareConfig,
    platform: string = 'twitter'
  ): string {
    const isNFT = 'tokenId' in config
    
    if (isNFT) {
      return this.generateNFTShareText(config as NFTSocialShareConfig, platform)
    }
    
    return this.generateContentShareText(config as SocialShareConfig, platform)
  }

  /**
   * Generate NFT-specific share text
   */
  private static generateNFTShareText(config: NFTSocialShareConfig, platform: string): string {
    const {
      title,
      description,
      tokenId,
      mintPrice,
      network,
      collectionName,
      hashtags = []
    } = config

    const baseText = `Check out my new NFT: ${title} on Zora! 🚀\n\n`
    const details = `Mint Price: ${mintPrice} ETH\nToken ID: #${tokenId}\nNetwork: ${network}\nCollection: ${collectionName}\n\n`
    const descriptionText = `${description}\n\n`
    
    // Platform-specific hashtags
    const platformHashtags = this.getPlatformHashtags(platform)
    const customHashtags = hashtags.map(tag => `#${tag}`).join(' ')
    const allHashtags = `#NFT #Zora #Web3 #${network} ${customHashtags} ${platformHashtags}`.trim()

    return baseText + details + descriptionText + allHashtags
  }

  /**
   * Generate content share text
   */
  private static generateContentShareText(config: SocialShareConfig, platform: string): string {
    const { title, description, tags = [], hashtags = [] } = config

    const baseText = `Just published: ${title} 🎉\n\n`
    const descriptionText = `${description}\n\n`
    
    // Platform-specific hashtags
    const platformHashtags = this.getPlatformHashtags(platform)
    const contentHashtags = tags.map(tag => `#${tag}`).join(' ')
    const customHashtags = hashtags.map(tag => `#${tag}`).join(' ')
    const allHashtags = `#Content #CreatorEconomy ${contentHashtags} ${customHashtags} ${platformHashtags}`.trim()

    return baseText + descriptionText + allHashtags
  }

  /**
   * Get platform-specific hashtags
   */
  private static getPlatformHashtags(platform: string): string {
    const hashtags = {
      twitter: '#Twitter',
      discord: '#Discord',
      telegram: '#Telegram',
      linkedin: '#LinkedIn #Professional',
      facebook: '#Facebook',
      reddit: '#Reddit'
    }
    
    return hashtags[platform as keyof typeof hashtags] || ''
  }

  /**
   * Generate share URL for a platform
   */
  static generateShareUrl(
    config: SocialShareConfig | NFTSocialShareConfig,
    platform: string
  ): string {
    const platformConfig = this.PLATFORMS[platform]
    if (!platformConfig) {
      throw new Error(`Unsupported platform: ${platform}`)
    }

    const text = this.generateShareText(config, platform)
    const encodedText = encodeURIComponent(text)
    const encodedUrl = encodeURIComponent(config.url)

    switch (platform) {
      case 'twitter':
        return `${platformConfig.url}?text=${encodedText}&url=${encodedUrl}`
      
      case 'discord':
        return platformConfig.url
      
      case 'telegram':
        return `${platformConfig.url}?url=${encodedUrl}&text=${encodedText}`
      
      case 'linkedin':
        return `${platformConfig.url}/?url=${encodedUrl}`
      
      case 'facebook':
        return `${platformConfig.url}?u=${encodedUrl}`
      
      case 'reddit':
        return `${platformConfig.url}?url=${encodedUrl}&title=${encodeURIComponent(config.title)}`
      
      default:
        return config.url
    }
  }

  /**
   * Open share dialog for a platform
   */
  static shareToPlatform(
    config: SocialShareConfig | NFTSocialShareConfig,
    platform: string
  ): void {
    const url = this.generateShareUrl(config, platform)
    
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
  static shareToMultiplePlatforms(
    config: Omit<SocialShareConfig | NFTSocialShareConfig, 'platform'>,
    platforms: string[]
  ): void {
    platforms.forEach(platform => {
      this.shareToPlatform(config, platform)
    })
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  /**
   * Use native sharing if available
   */
  static async shareNative(config: SocialShareConfig): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: config.title,
          text: config.description,
          url: config.url
        })
        return true
      } catch (error) {
        console.error('Native sharing failed:', error)
        return false
      }
    }
    return false
  }

  /**
   * Generate embed code for websites
   */
  static generateEmbedCode(config: SocialShareConfig | NFTSocialShareConfig): string {
    const isNFT = 'tokenId' in config
    const { title, description, url, image } = config

    const embedClass = isNFT ? 'zora-nft-embed' : 'zora-content-embed'
    const buttonText = isNFT ? 'View NFT on Zora' : 'View Content'

    return `
<div class="${embedClass}">
  <div class="embed-content">
    <h3>${title}</h3>
    <p>${description}</p>
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="embed-button">
      ${buttonText}
    </a>
  </div>
  ${image ? `<img src="${image}" alt="${title}" class="embed-image" />` : ''}
</div>
    `.trim()
  }

  /**
   * Generate social preview metadata
   */
  static generateSocialPreview(config: SocialShareConfig | NFTSocialShareConfig): {
    title: string
    description: string
    image: string
    url: string
    type: string
  } {
    const isNFT = 'tokenId' in config
    
    return {
      title: isNFT ? `${config.title} NFT on Zora` : config.title,
      description: config.description,
      image: config.image || this.generateDefaultSocialImage(config),
      url: config.url,
      type: isNFT ? 'website' : 'article'
    }
  }

  /**
   * Generate default social image
   */
  private static generateDefaultSocialImage(config: SocialShareConfig | NFTSocialShareConfig): string {
    const isNFT = 'tokenId' in config
    const baseUrl = 'https://via.placeholder.com/1200x630'
    const color = isNFT ? '7c3aed' : '2563eb'
    const text = encodeURIComponent(config.title)
    
    return `${baseUrl}/${color}/ffffff?text=${text}`
  }

  /**
   * Get available platforms
   */
  static getAvailablePlatforms(): SocialPlatform[] {
    return Object.values(this.PLATFORMS)
  }

  /**
   * Get platform configuration
   */
  static getPlatformConfig(platform: string): SocialPlatform | null {
    return this.PLATFORMS[platform] || null
  }

  /**
   * Validate share configuration
   */
  static validateShareConfig(config: SocialShareConfig | NFTSocialShareConfig): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!config.title || config.title.trim().length === 0) {
      errors.push('Title is required')
    }

    if (!config.description || config.description.trim().length === 0) {
      errors.push('Description is required')
    }

    if (!config.url || config.url.trim().length === 0) {
      errors.push('URL is required')
    }

    if (!this.isValidUrl(config.url)) {
      errors.push('Invalid URL format')
    }

    if (config.image && !this.isValidUrl(config.image)) {
      errors.push('Invalid image URL format')
    }

    // Check text length for Twitter
    const twitterText = this.generateShareText(config, 'twitter')
    if (twitterText.length > 280) {
      errors.push(`Text too long for Twitter (${twitterText.length}/280 characters)`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Truncate text for platform limits
   */
  static truncateText(text: string, platform: string): string {
    const platformConfig = this.PLATFORMS[platform]
    if (!platformConfig?.maxLength) {
      return text
    }

    if (text.length <= platformConfig.maxLength) {
      return text
    }

    // Truncate and add ellipsis
    return text.slice(0, platformConfig.maxLength - 3) + '...'
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
   * Generate QR code URL for sharing
   */
  static generateQRCodeUrl(url: string, size: number = 200): string {
    const encodedUrl = encodeURIComponent(url)
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`
  }

  /**
   * Track share analytics
   */
  static trackShare(platform: string, contentType: string, contentId: string): void {
    // This would typically send to your analytics service
    const trackingData = {
      platform,
      contentType,
      contentId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    
    console.log('Share tracked:', trackingData)
    
    // Example: Send to analytics service
    // fetch('/api/analytics/share', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(trackingData)
    // })
  }
}

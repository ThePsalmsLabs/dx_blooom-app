import { useCallback } from 'react'

interface ShareData {
  title: string
  description: string
  url: string
  image?: string
  tags?: string[]
}

interface NFTShareData extends ShareData {
  tokenId: string
  collectionAddress: string
  mintPrice: string
  network: string
}

interface UseSocialSharingReturn {
  shareToTwitter: (data: ShareData | NFTShareData) => void
  shareToDiscord: (data: ShareData | NFTShareData) => void
  shareToTelegram: (data: ShareData | NFTShareData) => void
  copyToClipboard: (text: string) => Promise<boolean>
  shareNative: (data: ShareData) => Promise<boolean>
  generateShareText: (data: ShareData | NFTShareData) => string
  generateShareUrl: (platform: 'twitter' | 'discord' | 'telegram', data: ShareData | NFTShareData) => string
}

export function useSocialSharing(): UseSocialSharingReturn {
  
  const generateShareText = useCallback((data: ShareData | NFTShareData): string => {
    const isNFT = 'tokenId' in data
    
    if (isNFT) {
      const nftData = data as NFTShareData
      return `Check out my new NFT: ${nftData.title} on Zora! 🚀\n\n` +
             `Mint Price: ${nftData.mintPrice} ETH\n` +
             `Token ID: #${nftData.tokenId}\n` +
             `Network: ${nftData.network}\n\n` +
             `${nftData.description}\n\n` +
             `#NFT #Zora #Web3`
    }
    
    return `Just published: ${data.title} 🎉\n\n` +
           `${data.description}\n\n` +
           `#Content #CreatorEconomy`
  }, [])

  const generateShareUrl = useCallback((
    platform: 'twitter' | 'discord' | 'telegram', 
    data: ShareData | NFTShareData
  ): string => {
    const text = generateShareText(data)
    const encodedText = encodeURIComponent(text)
    const encodedUrl = encodeURIComponent(data.url)
    
    switch (platform) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
      case 'discord':
        return `https://discord.com/channels/@me`
      case 'telegram':
        return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
      default:
        return data.url
    }
  }, [generateShareText])

  const shareToTwitter = useCallback((data: ShareData | NFTShareData) => {
    const url = generateShareUrl('twitter', data)
    window.open(url, '_blank', 'width=600,height=400')
  }, [generateShareUrl])

  const shareToDiscord = useCallback((data: ShareData | NFTShareData) => {
    const url = generateShareUrl('discord', data)
    window.open(url, '_blank')
  }, [generateShareUrl])

  const shareToTelegram = useCallback((data: ShareData | NFTShareData) => {
    const url = generateShareUrl('telegram', data)
    window.open(url, '_blank')
  }, [generateShareUrl])

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
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
  }, [])

  const shareNative = useCallback(async (data: ShareData): Promise<boolean> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.description,
          url: data.url
        })
        return true
      } catch (error) {
        console.error('Native sharing failed:', error)
        return false
      }
    }
    return false
  }, [])

  return {
    shareToTwitter,
    shareToDiscord,
    shareToTelegram,
    copyToClipboard,
    shareNative,
    generateShareText,
    generateShareUrl
  }
}

// Helper hook for tracking share analytics
export function useShareAnalytics() {
  const trackShare = useCallback((platform: string, contentType: string, contentId: string) => {
    // This would typically send analytics to your backend
    console.log(`Share tracked: ${platform} - ${contentType} - ${contentId}`)
  }, [])

  const trackCopy = useCallback((contentType: string, contentId: string) => {
    console.log(`Copy tracked: ${contentType} - ${contentId}`)
  }, [])

  return {
    trackShare,
    trackCopy
  }
}

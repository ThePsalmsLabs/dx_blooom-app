import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { X, MessageCircle, Globe, Share2, Copy, ExternalLink } from 'lucide-react'

interface SocialSharingProps {
  contentData: {
    title: string
    description: string
  }
  nftData?: {
    tokenId: string
    collectionAddress: string
    mintPrice: string
  }
  className?: string
}

export default function SocialSharing({ 
  contentData, 
  nftData, 
  className = '' 
}: SocialSharingProps) {
  const shareLinks = [
    {
      name: 'X',
      icon: X,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        nftData 
          ? `Check out my new NFT: ${contentData.title} on Zora! 🚀\n\nMint Price: ${nftData.mintPrice} ETH\nToken ID: #${nftData.tokenId}\n\n`
          : `Just published: ${contentData.title} 🎉\n\n`
      )}&url=${encodeURIComponent(window.location.href)}`
    },
    {
      name: 'Discord',
      icon: MessageCircle,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      href: `https://discord.com/channels/@me`
    },
    {
      name: 'Website',
      icon: Globe,
      color: 'text-green-500',
      bgColor: 'bg-green-50 hover:bg-green-100',
      href: window.location.href
    }
  ]

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: contentData.title,
          text: contentData.description,
          url: window.location.href
        })
      } catch (err) {
        console.error('Failed to share:', err)
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Share2 className="h-5 w-5 text-blue-600" />
          <span>Share Your {nftData ? 'NFT' : 'Content'}</span>
        </CardTitle>
        <CardDescription>
          Spread the word about your {nftData ? 'new NFT' : 'latest content'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Share Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {shareLinks.map((link) => {
            const Icon = link.icon
            return (
              <Button
                key={link.name}
                variant="outline"
                className={`${link.bgColor} border-0`}
                onClick={() => window.open(link.href, '_blank')}
              >
                <Icon className={`mr-2 h-4 w-4 ${link.color}`} />
                {link.name}
              </Button>
            )
          })}
        </div>

        {/* NFT Details for Sharing */}
        {nftData && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <h4 className="font-semibold text-sm mb-2">NFT Details</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Token ID:</span>
                <span className="font-mono">#{nftData.tokenId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span>{nftData.mintPrice} ETH</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={handleCopyLink}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Zora Integration */}
        {nftData && (
          <div className="text-center">
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.open(`https://zora.co/collections/${nftData.collectionAddress}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Zora
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

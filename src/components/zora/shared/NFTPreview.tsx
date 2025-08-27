import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/seperator'
import { Sparkles, Eye, Heart, Share2, ExternalLink } from 'lucide-react'
import { formatEther } from 'viem'

interface NFTPreviewProps {
  contentData: {
    title: string
    description: string
    contentType: 'article' | 'video' | 'audio' | 'image'
    tags: string[]
  }
  nftOptions: {
    mintPrice: bigint
    maxSupply: number
    revealType: 'instant' | 'delayed'
  }
  collectionData: {
    name: string
    symbol: string
  }
  className?: string
}

export default function NFTPreview({
  contentData,
  nftOptions,
  collectionData,
  className = ''
}: NFTPreviewProps) {
  const getContentIcon = () => {
    switch (contentData.contentType) {
      case 'video': return '🎥'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      default: return '📄'
    }
  }

  return (
    <Card className={`border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>NFT Preview</span>
          </CardTitle>
          <Badge variant="outline" className="border-purple-300 text-purple-700">
            {collectionData.symbol}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content Preview */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{getContentIcon()}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{contentData.title}</h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{contentData.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {contentData.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {contentData.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{contentData.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* NFT Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Mint Price:</span>
              <span className="font-semibold text-purple-600">
                {formatEther(nftOptions.mintPrice)} ETH
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Supply:</span>
              <span className="font-medium">{nftOptions.maxSupply}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Reveal:</span>
              <span className="font-medium capitalize">{nftOptions.revealType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Collection:</span>
              <span className="font-medium truncate">{collectionData.name}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="mr-1 h-3 w-3" />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Heart className="mr-1 h-3 w-3" />
            Like
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Share2 className="mr-1 h-3 w-3" />
            Share
          </Button>
        </div>

        <div className="text-center">
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="sm"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Zora
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

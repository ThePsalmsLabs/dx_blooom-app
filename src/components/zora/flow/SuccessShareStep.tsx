import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/seperator'
import { 
  CheckCircle, 
  Sparkles, 
  Copy, 
  ExternalLink, 
  Share2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Twitter,
  MessageCircle,
  Globe
} from 'lucide-react'
import { formatEther } from 'viem'

interface SuccessShareStepProps {
  collectionData: {
    name: string
    symbol: string
  }
  contentData: {
    title: string
    contentType: 'article' | 'video' | 'audio' | 'image'
  }
  nftOptions: {
    enabled: boolean
    mintPrice: bigint
    maxSupply: number
  }
  mintResult?: {
    tokenId: string
    transactionHash: string
    collectionAddress: string
  }
  onCopyLink: () => void
  onViewOnZora: () => void
  onShare: () => void
}

export default function SuccessShareStep({
  collectionData: _collectionData,
  contentData,
  nftOptions,
  mintResult,
  onCopyLink,
  onViewOnZora,
  onShare
}: SuccessShareStepProps) {
  const shareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      href: `https://twitter.com/intent/tweet?text=Check out my new NFT: ${contentData.title} on Zora!&url=${encodeURIComponent(window.location.href)}`
    },
    {
      name: 'Discord',
      icon: MessageCircle,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
      href: `https://discord.com/channels/@me`
    },
    {
      name: 'Website',
      icon: Globe,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      href: window.location.href
    }
  ]

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Success! 🎉</CardTitle>
          <CardDescription>
            Your content is now live {nftOptions.enabled && 'and available as an NFT collectible'}
          </CardDescription>
        </CardHeader>
      </Card>
      
      {/* NFT Details */}
      {nftOptions.enabled && mintResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>Your NFT is Live!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Token ID:</span>
                  <span className="font-mono">{mintResult.tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span>{formatEther(nftOptions.mintPrice)} ETH</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Supply:</span>
                  <span>1 / {nftOptions.maxSupply}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className="bg-green-100 text-green-800">Live</Badge>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1" onClick={onCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button variant="outline" className="flex-1" onClick={onViewOnZora}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Zora
              </Button>
              <Button className="flex-1" onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Social Sharing */}
      <Card>
        <CardHeader>
          <CardTitle>Share Your Success</CardTitle>
          <CardDescription>
            Spread the word about your new content and NFT
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {shareLinks.map((link) => {
              const Icon = link.icon
              return (
                <Button
                  key={link.name}
                  variant="outline"
                  className={`${link.bgColor} hover:${link.bgColor} border-0`}
                  onClick={() => window.open(link.href, '_blank')}
                >
                  <Icon className={`mr-2 h-4 w-4 ${link.color}`} />
                  {link.name}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-sm">Build Community</h4>
              <p className="text-xs text-gray-600">
                NFT holders become exclusive community members
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-sm">Dual Revenue</h4>
              <p className="text-xs text-gray-600">
                Earn from subscriptions and collectors
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-sm">Grow & Scale</h4>
              <p className="text-xs text-gray-600">
                Expand reach through Zora's social feeds
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

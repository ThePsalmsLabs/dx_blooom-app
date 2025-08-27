import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/seperator'
import { ArrowLeft, CheckCircle, Sparkles, FileText, DollarSign, Users } from 'lucide-react'
import { formatEther } from 'viem'

interface ReviewConfirmStepProps {
  collectionData: {
    name: string
    description: string
    symbol: string
    royalty: number
  }
  contentData: {
    title: string
    description: string
    category: string
    tags: string[]
    contentType: 'article' | 'video' | 'audio' | 'image'
  }
  nftOptions: {
    enabled: boolean
    mintPrice: bigint
    maxSupply: number
    revealType: 'instant' | 'delayed'
    revealDelay?: number
  }
  revenueProjection: {
    subscription: number
    nftMints: number
    royalties: number
    total: number
    increase: number
  } | null
  isPublishing: boolean
  onBack: () => void
  onConfirm: () => Promise<void>
}

export default function ReviewConfirmStep({
  collectionData,
  contentData,
  nftOptions,
  revenueProjection,
  isPublishing,
  onBack,
  onConfirm
}: ReviewConfirmStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Review & Confirm</span>
          </CardTitle>
          <CardDescription>
            Review your settings before publishing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collection Review */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>Collection Details</span>
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{collectionData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Symbol:</span>
                <span className="font-medium">{collectionData.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Royalty:</span>
                <span className="font-medium">{collectionData.royalty}%</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Content Review */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center space-x-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span>Content Details</span>
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <h5 className="font-medium">{contentData.title}</h5>
                <p className="text-sm text-gray-600 mt-1">{contentData.description}</p>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">Type: <Badge variant="outline">{contentData.contentType}</Badge></span>
                <span className="text-gray-600">Category: <Badge variant="outline">{contentData.category}</Badge></span>
              </div>
              <div className="flex flex-wrap gap-1">
                {contentData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* NFT Options Review */}
          {nftOptions.enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span>NFT Configuration</span>
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mint Price:</span>
                    <span className="font-medium">{formatEther(nftOptions.mintPrice)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Supply:</span>
                    <span className="font-medium">{nftOptions.maxSupply}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reveal Type:</span>
                    <span className="font-medium capitalize">{nftOptions.revealType}</span>
                  </div>
                  {nftOptions.revealType === 'delayed' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reveal Delay:</span>
                      <span className="font-medium">{nftOptions.revealDelay} hours</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Revenue Projection */}
          {revenueProjection && nftOptions.enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span>Revenue Projection</span>
                </h4>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-600">
                        ${revenueProjection.subscription}
                      </div>
                      <div className="text-xs text-gray-500">Subscriptions</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        ${Math.round(revenueProjection.nftMints)}
                      </div>
                      <div className="text-xs text-gray-500">NFT Sales</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        ${Math.round(revenueProjection.royalties)}
                      </div>
                      <div className="text-xs text-gray-500">Royalties</div>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      ${Math.round(revenueProjection.total)}/month total
                    </div>
                    <div className="text-sm text-green-600">
                      +{revenueProjection.increase}% revenue increase
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="flex space-x-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={isPublishing}
          className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          size="lg"
        >
          {isPublishing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Publishing...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {nftOptions.enabled ? 'Publish & Mint NFT' : 'Publish Content'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

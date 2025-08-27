import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/seperator'
import { ArrowLeft, ArrowRight, Sparkles, Zap, TrendingUp } from 'lucide-react'
import { parseEther, formatEther } from 'viem'

interface NFTConfigurationStepProps {
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
  onNFTOptionsChange: (options: Partial<NFTConfigurationStepProps['nftOptions']>) => void
  onBack: () => void
  onNext: () => void
}

export default function NFTConfigurationStep({
  nftOptions,
  revenueProjection,
  onNFTOptionsChange,
  onBack,
  onNext
}: NFTConfigurationStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span>NFT Configuration</span>
              </CardTitle>
              <CardDescription>
                Turn your content into a collectible NFT for additional revenue
              </CardDescription>
            </div>
            <Switch
              checked={nftOptions.enabled}
              onCheckedChange={(enabled) => onNFTOptionsChange({ enabled })}
            />
          </div>
        </CardHeader>
        
        {nftOptions.enabled && (
          <CardContent className="space-y-6">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Hybrid Revenue Model:</strong> Earn from subscriptions AND NFT collectors!
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mint Price (ETH)</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formatEther(nftOptions.mintPrice)}
                  onChange={(e) => onNFTOptionsChange({ 
                    mintPrice: parseEther(e.target.value || '0') 
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Max Supply</Label>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  value={nftOptions.maxSupply}
                  onChange={(e) => onNFTOptionsChange({ 
                    maxSupply: parseInt(e.target.value) || 1 
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reveal Type</Label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="revealType"
                    value="instant"
                    checked={nftOptions.revealType === 'instant'}
                    onChange={(e) => onNFTOptionsChange({ revealType: e.target.value as 'instant' | 'delayed' })}
                  />
                  <span>Instant Reveal</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="revealType"
                    value="delayed"
                    checked={nftOptions.revealType === 'delayed'}
                    onChange={(e) => onNFTOptionsChange({ revealType: e.target.value as 'instant' | 'delayed' })}
                  />
                  <span>Delayed Reveal</span>
                </label>
              </div>
            </div>

            {nftOptions.revealType === 'delayed' && (
              <div className="space-y-2">
                <Label>Reveal Delay (hours)</Label>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={nftOptions.revealDelay || 24}
                  onChange={(e) => onNFTOptionsChange({ 
                    revealDelay: parseInt(e.target.value) || 24 
                  })}
                />
              </div>
            )}
            
            {revenueProjection && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Revenue Projection</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        ${revenueProjection.subscription}
                      </div>
                      <div className="text-sm text-gray-500">Subscriptions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        ${Math.round(revenueProjection.nftMints)}
                      </div>
                      <div className="text-sm text-gray-500">NFT Sales</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        ${Math.round(revenueProjection.royalties)}
                      </div>
                      <div className="text-sm text-gray-500">Royalties</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ${Math.round(revenueProjection.total)}/month
                    </div>
                    <div className="text-lg text-green-600">
                      +{revenueProjection.increase}% revenue increase
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        )}
      </Card>
      
      <div className="flex space-x-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {nftOptions.enabled ? 'Continue to Review' : 'Skip NFT & Continue'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/seperator'
import { TrendingUp, Zap } from 'lucide-react'
import { formatEther } from 'viem'

interface RevenueCalculatorProps {
  nftOptions: {
    enabled: boolean
    mintPrice: bigint
    maxSupply: number
  }
  subscriptionRevenue: number
  className?: string
}

export default function RevenueCalculator({ 
  nftOptions, 
  subscriptionRevenue, 
  className = '' 
}: RevenueCalculatorProps) {
  const calculateProjection = () => {
    if (!nftOptions.enabled) return null
    
    // Assumptions for revenue calculation
    const mintRate = 0.1 // 10% of max supply gets minted
    const tradingVolume = 0.2 // 20% of minted NFTs get traded
    const royaltyRate = 0.05 // 5% royalty rate
    
    const nftMintRevenue = Number(formatEther(nftOptions.mintPrice)) * 
      (nftOptions.maxSupply * mintRate) * 2000 // $2000 ETH price assumption
    
    const royaltyRevenue = nftMintRevenue * royaltyRate * tradingVolume
    
    return {
      subscription: subscriptionRevenue,
      nftMints: nftMintRevenue,
      royalties: royaltyRevenue,
      total: subscriptionRevenue + nftMintRevenue + royaltyRevenue,
      increase: Math.round(((nftMintRevenue + royaltyRevenue) / subscriptionRevenue) * 100)
    }
  }

  const projection = calculateProjection()

  if (!projection) return null

  return (
    <Card className={`bg-gradient-to-r from-green-50 to-blue-50 border-green-200 ${className}`}>
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
              ${projection.subscription}
            </div>
            <div className="text-sm text-gray-500">Subscriptions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              ${Math.round(projection.nftMints)}
            </div>
            <div className="text-sm text-gray-500">NFT Sales</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              ${Math.round(projection.royalties)}
            </div>
            <div className="text-sm text-gray-500">Royalties</div>
          </div>
        </div>
        
        <Separator />
        
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            ${Math.round(projection.total)}/month
          </div>
          <div className="text-lg text-green-600">
            +{projection.increase}% revenue increase
          </div>
        </div>

        <div className="bg-white/50 rounded-lg p-3 text-xs text-gray-600">
          <div className="flex items-center space-x-1 mb-1">
            <Zap className="h-3 w-3" />
            <span className="font-medium">Revenue Assumptions:</span>
          </div>
          <ul className="space-y-1">
            <li>• 10% of max supply gets minted</li>
            <li>• 20% of minted NFTs get traded</li>
            <li>• 5% royalty on secondary sales</li>
            <li>• ETH price: $2,000</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

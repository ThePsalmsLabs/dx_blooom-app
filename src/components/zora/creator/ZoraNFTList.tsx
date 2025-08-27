import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/seperator'
import { 
  Eye, 
  Edit, 
  Trash2, 
  Sparkles, 
  ExternalLink
} from 'lucide-react'

interface NFTItem {
  id: string
  tokenId: string
  collectionName: string
  collectionAddress: string
  contentTitle: string
  contentId: string
  mintPrice: number
  currentPrice: number
  totalSupply: number
  mintedCount: number
  status: 'minted' | 'listed' | 'sold' | 'burned'
  views: number
  likes: number
  revenue: number
  mintedAt: string
  lastActivity?: string
}

interface ZoraNFTListProps {
  nftItems: NFTItem[]
  onViewNFT: (id: string) => void
  onEditNFT: (id: string) => void
  onDeleteNFT: (id: string) => void
  onViewOnZora: (collectionAddress: string, tokenId: string) => void
  className?: string
}

export default function ZoraNFTList({
  nftItems,
  onViewNFT,
  onEditNFT,
  onDeleteNFT,
  onViewOnZora,
  className = ''
}: ZoraNFTListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'minted' | 'listed' | 'sold' | 'burned'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'price' | 'views' | 'revenue'>('recent')

  const filteredAndSortedNFTs = nftItems
    .filter(nft => {
      const matchesSearch = nft.contentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           nft.collectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           nft.tokenId.includes(searchTerm)
      const matchesFilter = filterStatus === 'all' || nft.status === filterStatus
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime()
        case 'price':
          return b.currentPrice - a.currentPrice
        case 'views':
          return b.views - a.views
        case 'revenue':
          return b.revenue - a.revenue
        default:
          return 0
      }
    })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'minted':
        return <Badge className="bg-green-100 text-green-800">Minted</Badge>
      case 'listed':
        return <Badge className="bg-blue-100 text-blue-800">Listed</Badge>
      case 'sold':
        return <Badge className="bg-purple-100 text-purple-800">Sold</Badge>
      case 'burned':
        return <Badge className="bg-red-100 text-red-800">Burned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriceChange = (mintPrice: number, currentPrice: number) => {
    const change = ((currentPrice - mintPrice) / mintPrice) * 100
    return {
      value: change,
      isPositive: change >= 0,
      formatted: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>NFT Inventory</span>
            </CardTitle>
            <CardDescription>
              Track your NFT collectibles and their performance
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {nftItems.length} NFTs
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search NFTs</Label>
            <Input
              id="search"
              placeholder="Search by title, collection, or token ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="minted">Minted</option>
            <option value="listed">Listed</option>
            <option value="sold">Sold</option>
            <option value="burned">Burned</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="price">Highest Price</option>
            <option value="views">Most Views</option>
            <option value="revenue">Highest Revenue</option>
          </select>
        </div>

        <Separator />

        {/* NFT List */}
        <div className="space-y-3">
          {filteredAndSortedNFTs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No NFTs found</p>
              <p className="text-sm">Create NFTs from your content to see them here</p>
            </div>
          ) : (
            filteredAndSortedNFTs.map((nft) => {
              const priceChange = getPriceChange(nft.mintPrice, nft.currentPrice)
              
              return (
                <div
                  key={nft.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <h3 className="font-semibold text-lg truncate">
                            {nft.contentTitle}
                          </h3>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          #{nft.tokenId}
                        </Badge>
                        {getStatusBadge(nft.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        Collection: <span className="font-medium">{nft.collectionName}</span>
                      </div>
                      
                      {/* NFT Stats */}
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Mint Price</div>
                          <div className="font-medium">{nft.mintPrice} ETH</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Current Price</div>
                          <div className="font-medium flex items-center space-x-1">
                            <span>{nft.currentPrice} ETH</span>
                            <span className={`text-xs ${priceChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {priceChange.formatted}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Supply</div>
                          <div className="font-medium">
                            {nft.mintedCount} / {nft.totalSupply}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Revenue</div>
                          <div className="font-medium">${nft.revenue.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Engagement Stats */}
                      <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <div className="text-gray-500">Views</div>
                          <div className="font-medium">{nft.views.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Likes</div>
                          <div className="font-medium">{nft.likes.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Minted</div>
                          <div className="font-medium">
                            {new Date(nft.mintedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewNFT(nft.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewOnZora(nft.collectionAddress, nft.tokenId)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditNFT(nft.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteNFT(nft.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Summary Stats */}
        {nftItems.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {nftItems.length}
                </div>
                <div className="text-sm text-gray-500">Total NFTs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {nftItems.filter(n => n.status === 'minted').length}
                </div>
                <div className="text-sm text-gray-500">Minted</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {nftItems.filter(n => n.status === 'listed').length}
                </div>
                <div className="text-sm text-gray-500">Listed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  ${nftItems.reduce((sum, n) => sum + n.revenue, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Revenue</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/seperator'
import { 
  Plus, 
  FileText, 
  Video, 
  Music, 
  Image, 
  Eye, 
  Edit, 
  Trash2, 
  Sparkles
} from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  description: string
  contentType: 'article' | 'video' | 'audio' | 'image'
  status: 'draft' | 'published' | 'archived'
  hasNFT: boolean
  nftData?: {
    tokenId: string
    mintPrice: number
    mintedCount: number
    totalSupply: number
  }
  views: number
  likes: number
  revenue: number
  createdAt: string
  publishedAt?: string
}

interface ZoraContentPanelProps {
  contentItems: ContentItem[]
  onCreateContent: () => void
  onEditContent: (id: string) => void
  onViewContent: (id: string) => void
  onDeleteContent: (id: string) => void
  onMintNFT: (id: string) => void
  className?: string
}

export default function ZoraContentPanel({
  contentItems,
  onCreateContent,
  onEditContent,
  onViewContent,
  onDeleteContent,
  onMintNFT,
  className = ''
}: ZoraContentPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'article' | 'video' | 'audio' | 'image'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all')

  const filteredContent = contentItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || item.contentType === filterType
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      case 'image': return <Image className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      article: 'bg-blue-100 text-blue-800',
      video: 'bg-red-100 text-red-800',
      audio: 'bg-purple-100 text-purple-800',
      image: 'bg-green-100 text-green-800'
    }
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Content Library</span>
            </CardTitle>
            <CardDescription>
              Manage your content and create NFT collectibles
            </CardDescription>
          </div>
          <Button onClick={onCreateContent}>
            <Plus className="mr-2 h-4 w-4" />
            New Content
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search content</Label>
            <Input
              id="search"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="article">Articles</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="image">Images</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <Separator />

        {/* Content List */}
        <div className="space-y-3">
          {filteredContent.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No content found</p>
              <p className="text-sm">Create your first piece of content to get started</p>
            </div>
          ) : (
            filteredContent.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        {getContentIcon(item.contentType)}
                        <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                      </div>
                      {getTypeBadge(item.contentType)}
                      {getStatusBadge(item.status)}
                      {item.hasNFT && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Sparkles className="h-3 w-3 mr-1" />
                          NFT
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {/* Content Stats */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Views</div>
                        <div className="font-medium">{item.views.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Likes</div>
                        <div className="font-medium">{item.likes.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Revenue</div>
                        <div className="font-medium">${item.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Created</div>
                        <div className="font-medium">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* NFT Data */}
                    {item.hasNFT && item.nftData && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">NFT Details</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-gray-600">Token ID:</span>
                            <span className="font-mono ml-1">#{item.nftData.tokenId}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Price:</span>
                            <span className="ml-1">{item.nftData.mintPrice} ETH</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Minted:</span>
                            <span className="ml-1">{item.nftData.mintedCount}/{item.nftData.totalSupply}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewContent(item.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditContent(item.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!item.hasNFT && item.status === 'published' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMintNFT(item.id)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteContent(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {contentItems.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {contentItems.length}
                </div>
                <div className="text-sm text-gray-500">Total Content</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {contentItems.filter(c => c.status === 'published').length}
                </div>
                <div className="text-sm text-gray-500">Published</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {contentItems.filter(c => c.hasNFT).length}
                </div>
                <div className="text-sm text-gray-500">With NFTs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  ${contentItems.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}
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

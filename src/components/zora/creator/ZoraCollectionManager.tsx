import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/seperator'
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Sparkles
} from 'lucide-react'

interface Collection {
  id: string
  name: string
  symbol: string
  description: string
  address: string
  totalSupply: number
  mintedCount: number
  floorPrice: number
  totalVolume: number
  status: 'active' | 'paused' | 'draft'
  createdAt: string
}

interface ZoraCollectionManagerProps {
  collections: Collection[]
  onCreateCollection: () => void
  onEditCollection: (id: string) => void
  onViewCollection: (id: string) => void
  onDeleteCollection: (id: string) => void
  className?: string
}

export default function ZoraCollectionManager({
  collections,
  onCreateCollection,
  onEditCollection,
  onViewCollection,
  onDeleteCollection,
  className = ''
}: ZoraCollectionManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'draft'>('all')

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || collection.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span>Zora Collections</span>
            </CardTitle>
            <CardDescription>
              Manage your NFT collections and track their performance
            </CardDescription>
          </div>
          <Button onClick={onCreateCollection}>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Search collections</Label>
            <Input
              id="search"
              placeholder="Search collections..."
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
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <Separator />

        {/* Collections List */}
        <div className="space-y-3">
          {filteredCollections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No collections found</p>
              <p className="text-sm">Create your first collection to get started</p>
            </div>
          ) : (
            filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{collection.name}</h3>
                      <Badge variant="outline">{collection.symbol}</Badge>
                      {getStatusBadge(collection.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {collection.description}
                    </p>
                    
                    {/* Collection Stats */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Supply</div>
                        <div className="font-medium">
                          {collection.mintedCount} / {collection.totalSupply}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Floor Price</div>
                        <div className="font-medium">{collection.floorPrice} ETH</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Volume</div>
                        <div className="font-medium">{collection.totalVolume} ETH</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Created</div>
                        <div className="font-medium">
                          {new Date(collection.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCollection(collection.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditCollection(collection.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteCollection(collection.id)}
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
        {collections.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {collections.length}
                </div>
                <div className="text-sm text-gray-500">Total Collections</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {collections.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-gray-500">Active Collections</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {collections.reduce((sum, c) => sum + c.totalVolume, 0).toFixed(2)} ETH
                </div>
                <div className="text-sm text-gray-500">Total Volume</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

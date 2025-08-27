import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { Loader2, Plus, Sparkles, CheckCircle } from 'lucide-react'

interface CollectionSetupStepProps {
  isCreating: boolean
  hasCollection: boolean
  collectionData: {
    name: string
    description: string
    symbol: string
    royalty: number
  }
  onCollectionDataChange: (data: Partial<CollectionSetupStepProps['collectionData']>) => void
  onCreateCollection: () => Promise<void>
  onNext: () => void
}

export default function CollectionSetupStep({
  isCreating,
  hasCollection,
  collectionData,
  onCollectionDataChange,
  onCreateCollection,
  onNext
}: CollectionSetupStepProps) {
  const handleCreateAndContinue = async () => {
    if (!hasCollection) {
      await onCreateCollection()
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Create Your Zora Collection</CardTitle>
          <CardDescription>
            Set up your NFT collection to start minting collectible versions of your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasCollection ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collection-name">Collection Name</Label>
                <Input
                  id="collection-name"
                  value={collectionData.name}
                  onChange={(e) => onCollectionDataChange({ name: e.target.value })}
                  placeholder="My Creator Collection"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="collection-symbol">Symbol</Label>
                <Input
                  id="collection-symbol"
                  value={collectionData.symbol}
                  onChange={(e) => onCollectionDataChange({ symbol: e.target.value })}
                  placeholder="MCC"
                  maxLength={5}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="collection-description">Description</Label>
                <Textarea
                  id="collection-description"
                  value={collectionData.description}
                  onChange={(e) => onCollectionDataChange({ description: e.target.value })}
                  placeholder="A collection of exclusive content NFTs..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="royalty">Royalty Percentage</Label>
                <Input
                  id="royalty"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={collectionData.royalty}
                  onChange={(e) => onCollectionDataChange({ royalty: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-sm text-gray-500">
                  Percentage you'll earn from secondary sales (0-10%)
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">Collection Created Successfully</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span>{collectionData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Symbol:</span>
                  <span>{collectionData.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Royalty:</span>
                  <span>{collectionData.royalty}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Blockchain:</span>
                  <span>Base Network</span>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={handleCreateAndContinue} 
            disabled={isCreating || (!hasCollection && (!collectionData.name || !collectionData.symbol))} 
            className="w-full" 
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Collection...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {hasCollection ? 'Continue to Content' : 'Create Collection & Continue'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

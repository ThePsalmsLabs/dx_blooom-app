// src/components/zora/ZoraIntegrationDemo.tsx
/**
 * Zora Integration Demo Component
 * 
 * This component demonstrates the complete Zora NFT integration with your
 * existing content platform, showing how creators can mint their content
 * as NFTs while maintaining their subscription model.
 */

import React, { useState, useCallback } from 'react'
import { useChainId } from 'wagmi'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { Address, parseEther } from 'viem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/seperator'
import { 
  useZoraService, 
  useCreatorZoraCollection, 
  useContentNFTMinting,
  useIntegratedContentPublishing,
  useZoraPriceCalculator,
  useZoraCollectionAnalytics
} from '@/hooks/zora/useZoraIntegration'
import { useIsCreatorRegistered } from '@/hooks/contracts/core'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Info, Sparkles } from 'lucide-react'

interface ContentFormData {
  title: string
  description: string
  category: string
  tags: string[]
  ipfsHash: string
  payPerViewPrice: bigint
  subscriptionTier: 'free' | 'premium' | 'exclusive'
  imageUrl: string
}

interface NFTMintOptions {
  shouldMintAsNFT: boolean
  mintPrice?: bigint
  maxSupply?: number
}

export function ZoraIntegrationDemo() {
  const walletUI = useWalletConnectionUI()
  const chainId = useChainId()
  
  // Zora integration hooks
  const { service, isReady, userAddress } = useZoraService()
  const { collectionAddress, createCollection, isCreating, hasCollection } = useCreatorZoraCollection()
  const { mintContentAsNFT, isMinting } = useContentNFTMinting(collectionAddress || undefined)
  const { publishWithOptionalNFT, publishingState, canMintNFT } = useIntegratedContentPublishing()
  const { calculateRecommendedPrice, getPriceRecommendations } = useZoraPriceCalculator()
  const { totalNFTs, totalMinted, totalVolume, formattedVolume, formattedAveragePrice } = useZoraCollectionAnalytics(collectionAddress as Address)
  
  // Creator status
  const { data: isCreatorRegistered } = useIsCreatorRegistered(walletUI.address)
  
  // Form state
  const [contentData, setContentData] = useState<ContentFormData>({
    title: '',
    description: '',
    category: 'article',
    tags: [],
    ipfsHash: '',
    payPerViewPrice: parseEther('0.01'),
    subscriptionTier: 'premium',
    imageUrl: ''
  })
  
  const [nftOptions, setNftOptions] = useState<NFTMintOptions>({
    shouldMintAsNFT: false,
    mintPrice: parseEther('0.01'),
    maxSupply: 100
  })
  
  const [tagInput, setTagInput] = useState('')

  // Calculate recommended NFT prices
  const priceRecommendations = getPriceRecommendations(contentData.payPerViewPrice)

  const handleCreateCollection = useCallback(async () => {
    if (!userAddress) return

    try {
      await createCollection({
        name: 'My Content Collection',
        description: 'A collection of my premium content as NFTs',
        contractURI: 'https://yourplatform.com/collection-metadata.json',
        royaltyBPS: 500, // 5%
        defaultPrice: parseEther('0.01'),
        maxSupply: 1000
      })
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }, [createCollection, userAddress])

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !contentData.tags.includes(tag) && contentData.tags.length < 10) {
      setContentData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }, [tagInput, contentData.tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setContentData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  const handlePublishWithNFT = useCallback(async () => {
    if (!walletUI.address) return

    try {
      await publishWithOptionalNFT(contentData, nftOptions)
    } catch (error) {
      console.error('Failed to publish with NFT:', error)
    }
  }, [publishWithOptionalNFT, contentData, nftOptions, walletUI.address])

  if (!walletUI.address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zora Integration Demo</CardTitle>
          <CardDescription>
            Connect your wallet to explore the Zora NFT integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to access the Zora integration features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!isCreatorRegistered) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zora Integration Demo</CardTitle>
          <CardDescription>
            Register as a creator to access NFT minting features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need to register as a creator before you can mint content as NFTs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle>Zora NFT Integration</CardTitle>
          </div>
          <CardDescription>
            Mint your premium content as NFTs while maintaining your subscription model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalNFTs}</div>
              <div className="text-sm text-muted-foreground">Total NFTs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Number(totalMinted)}</div>
              <div className="text-sm text-muted-foreground">Total Mints</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formattedVolume} ETH</div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Setup */}
      {!hasCollection && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Zora Collection</CardTitle>
            <CardDescription>
              Create your first Zora collection to start minting NFTs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreateCollection} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Collection...
                </>
              ) : (
                'Create Zora Collection'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content Publishing Form */}
      <Card>
        <CardHeader>
          <CardTitle>Publish Content with NFT Option</CardTitle>
          <CardDescription>
            Create content and optionally mint it as an NFT on Zora
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Content Title</Label>
              <Input
                id="title"
                value={contentData.title}
                onChange={(e) => setContentData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter content title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={contentData.category} 
                onValueChange={(value) => setContentData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={contentData.description}
              onChange={(e) => setContentData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter content description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ipfsHash">IPFS Hash</Label>
            <Input
              id="ipfsHash"
              value={contentData.ipfsHash}
              onChange={(e) => setContentData(prev => ({ ...prev, ipfsHash: e.target.value }))}
              placeholder="Qm..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={contentData.imageUrl}
              onChange={(e) => setContentData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {contentData.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* NFT Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="mint-as-nft"
                checked={nftOptions.shouldMintAsNFT}
                onCheckedChange={(checked) => setNftOptions(prev => ({ ...prev, shouldMintAsNFT: checked }))}
              />
              <Label htmlFor="mint-as-nft">Mint as NFT on Zora</Label>
            </div>

            {nftOptions.shouldMintAsNFT && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mintPrice">Mint Price (ETH)</Label>
                    <Input
                      id="mintPrice"
                      type="number"
                      step="0.001"
                      value={nftOptions.mintPrice ? Number(nftOptions.mintPrice) / 1e18 : 0.01}
                      onChange={(e) => setNftOptions(prev => ({ 
                        ...prev, 
                        mintPrice: parseEther(e.target.value || '0.01')
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxSupply">Max Supply</Label>
                    <Input
                      id="maxSupply"
                      type="number"
                      value={nftOptions.maxSupply || 100}
                      onChange={(e) => setNftOptions(prev => ({ 
                        ...prev, 
                        maxSupply: parseInt(e.target.value) || 100
                      }))}
                    />
                  </div>
                </div>

                {/* Price Recommendations */}
                <div className="space-y-2">
                  <Label>Recommended Prices</Label>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 border rounded">
                      <div className="font-medium">Conservative</div>
                      <div>{Number(priceRecommendations.conservative) / 1e18} ETH</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="font-medium">Balanced</div>
                      <div>{Number(priceRecommendations.balanced) / 1e18} ETH</div>
                    </div>
                    <div className="p-2 border rounded">
                      <div className="font-medium">Aggressive</div>
                      <div>{Number(priceRecommendations.aggressive) / 1e18} ETH</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Publish Button */}
          <Button 
            onClick={handlePublishWithNFT} 
            disabled={!canMintNFT || publishingState.step !== 'idle'}
            className="w-full"
          >
            {publishingState.step === 'publishing-content' && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing Content...
              </>
            )}
            {publishingState.step === 'minting-nft' && (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting NFT...
              </>
            )}
            {publishingState.step === 'complete' && (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Published Successfully!
              </>
            )}
            {publishingState.step === 'idle' && 'Publish Content'}
          </Button>

          {/* Status Messages */}
          {publishingState.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{publishingState.error}</AlertDescription>
            </Alert>
          )}

          {publishingState.step === 'complete' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Content published successfully! 
                {publishingState.nftResult && ' NFT has been minted on Zora.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Integration Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Benefits</CardTitle>
          <CardDescription>
            How Zora NFTs enhance your content platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">For Creators</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Additional revenue stream from NFT sales</li>
                <li>• Social discovery through Zora's feed</li>
                <li>• Permanent ownership for fans</li>
                <li>• Trading fees from secondary sales</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">For Collectors</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Own pieces of favorite content</li>
                <li>• Trade and speculate on content value</li>
                <li>• Social signaling and community</li>
                <li>• Permanent access to content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

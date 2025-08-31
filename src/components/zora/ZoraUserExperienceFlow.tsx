import React, { useState, useCallback, useEffect } from 'react'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { parseEther, formatEther } from 'viem'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomModal } from '@/components/ui/custom-modal'
import { Separator } from '@/components/ui/seperator'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Plus,
  Sparkles,
  ExternalLink,
  TrendingUp,
  Users,
  DollarSign,
  Loader2,
  CheckCircle,
  Zap,
  Share2,
  Copy,
  Heart,
  FileText
} from 'lucide-react'

// ===== SIMULATED HOOKS (Replace with your actual implementations) =====
function useZoraIntegration() {
  const [_isReady, _setIsReady] = useState(true)
  const [collectionAddress, setCollectionAddress] = useState<string>()
  const [isCreating, setIsCreating] = useState(false)
  const [_isMinting, setIsMinting] = useState(false)
  
  return {
    isReady: _isReady,
    collectionAddress,
    createCollection: async () => {
      setIsCreating(true)
      await new Promise(r => setTimeout(r, 3000))
      setCollectionAddress('0x1234...5678')
      setIsCreating(false)
    },
    mintNFT: async () => {
      setIsMinting(true)
      await new Promise(r => setTimeout(r, 4000))
      setIsMinting(false)
      return { success: true, tokenId: '1', transactionHash: '0xabc...def' }
    },
    isCreating,
    isMinting: _isMinting,
    hasCollection: Boolean(collectionAddress)
  }
}

function useCreatorProfile() {
  return {
    isRegistered: true,
    profile: {
      name: 'Alex Thompson',
      handle: '@alexcreates',
      totalSubscribers: 1247,
      totalContent: 89,
      monthlyEarnings: parseEther('2.4')
    }
  }
}

// ===== MAIN COMPONENT =====

export default function ZoraUserExperienceFlow() {
  const walletUI = useWalletConnectionUI()
  const { isRegistered, profile } = useCreatorProfile()
  const {
    isReady: _isReady,
    collectionAddress,
    createCollection,
    mintNFT,
    isCreating,
    isMinting: _isMinting,
    hasCollection
  } = useZoraIntegration()

  // ===== STATE MANAGEMENT =====
  const [currentStep, setCurrentStep] = useState<'setup' | 'content' | 'nft' | 'success'>('setup')
  const [contentData, setContentData] = useState({
    title: 'The Future of Web3 Content Creation',
    description: 'An in-depth analysis of how blockchain technology is revolutionizing content monetization and creator economics.',
    category: 'article',
    tags: ['web3', 'blockchain', 'creators'],
    subscriptionTier: 'premium' as 'free' | 'premium' | 'exclusive',
    price: parseEther('0.01')
  })
  const [nftOptions, setNftOptions] = useState({
    enabled: false,
    mintPrice: parseEther('0.01'),
    maxSupply: 100,
    royaltyPercentage: 5
  })
  const [mintResult, setMintResult] = useState<{ tokenId: string; transactionHash: string } | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)

  // ===== EFFECTS =====
  useEffect(() => {
    if (hasCollection && currentStep === 'setup') {
      setCurrentStep('content')
    }
  }, [hasCollection, currentStep])

  // ===== HANDLERS =====
  const handleCreateCollection = useCallback(async () => {
    try {
      await createCollection()
      setCurrentStep('content')
    } catch (error) {
      console.error('Failed to create collection:', error)
    }
  }, [createCollection])

  const handlePublishWithNFT = useCallback(async () => {
    try {
      setCurrentStep('nft')
      const result = await mintNFT()
      setMintResult(result)
      setCurrentStep('success')
    } catch (error) {
      console.error('Failed to mint NFT:', error)
    }
  }, [mintNFT])

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(`https://zora.co/collect/${collectionAddress}/1`)
  }, [collectionAddress])

  // ===== RENDER HELPERS =====
  const renderProgress = () => {
    const steps = ['Setup Collection', 'Create Content', 'Mint NFT', 'Success']
    const stepIndex = ['setup', 'content', 'nft', 'success'].indexOf(currentStep)
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center space-x-2 ${
                index <= stepIndex ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < stepIndex
                    ? 'bg-green-100 text-green-600'
                    : index === stepIndex
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {index < stepIndex ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <span className="text-sm font-medium">{step}</span>
            </div>
          ))}
        </div>
        <Progress value={(stepIndex + 1) * 25} className="h-2" />
      </div>
    )
  }

  const renderSetupStep = () => (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Create Your Zora Collection</CardTitle>
        <CardDescription>
          Set up your NFT collection to start minting your premium content as collectible assets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold mb-2">Collection Preview</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span>{profile?.name} Collection</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Royalty:</span>
              <span>5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blockchain:</span>
              <span>Base Network</span>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleCreateCollection}
          disabled={isCreating}
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
              Create Collection
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )

  const renderContentStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Content Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={contentData.title}
              onChange={(e) => setContentData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your content title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={contentData.description}
              onChange={(e) => setContentData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your content"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={contentData.category} onValueChange={(value) => 
                setContentData(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select value={contentData.subscriptionTier} onValueChange={(value: 'free' | 'premium' | 'exclusive') => 
                setContentData(prev => ({ ...prev, subscriptionTier: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {contentData.tags.map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle>NFT Options</CardTitle>
            </div>
            <Switch
              checked={nftOptions.enabled}
              onCheckedChange={(enabled) => setNftOptions(prev => ({ ...prev, enabled }))}
            />
          </div>
          <CardDescription>
            Turn your content into a collectible NFT and unlock additional revenue streams
          </CardDescription>
        </CardHeader>
        
        {nftOptions.enabled && (
          <CardContent className="space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>Hybrid Monetization:</strong> Earn from subscriptions AND NFT sales. 
                Your content will be discoverable on Zora&apos;s social feed!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mintPrice">Mint Price (ETH)</Label>
                <Input
                  id="mintPrice"
                  type="number"
                  step="0.001"
                  value={formatEther(nftOptions.mintPrice)}
                  onChange={(e) => setNftOptions(prev => ({ 
                    ...prev, 
                    mintPrice: parseEther(e.target.value || '0') 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSupply">Max Supply</Label>
                <Input
                  id="maxSupply"
                  type="number"
                  min="1"
                  max="10000"
                  value={nftOptions.maxSupply}
                  onChange={(e) => setNftOptions(prev => ({ 
                    ...prev, 
                    maxSupply: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border space-y-3">
              <h4 className="font-semibold text-sm">Revenue Projection</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subscription Revenue:</span>
                  <span className="font-medium">~$50/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">NFT Mint Revenue:</span>
                  <span className="font-medium">
                    ~${((Number(formatEther(nftOptions.mintPrice)) * 2000) * (nftOptions.maxSupply * 0.1)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Future Royalties:</span>
                  <span className="font-medium">5% on resales</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Potential:</span>
                  <span className="text-green-600">
                    ${(50 + (Number(formatEther(nftOptions.mintPrice)) * 2000) * (nftOptions.maxSupply * 0.1)).toLocaleString()}+/month
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Button
        onClick={handlePublishWithNFT}
        size="lg"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        {nftOptions.enabled ? (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Publish Content & Mint NFT
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Publish Content
          </>
        )}
      </Button>
    </div>
  )

  const renderMintingStep = () => (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <CardTitle>Minting Your NFT</CardTitle>
        <CardDescription>
          Your content is being transformed into a collectible NFT on Zora
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Uploading to IPFS...</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Creating NFT contract...</span>
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-sm">Submitting to Zora...</span>
            <div className="h-4 w-4" />
          </div>
        </div>
        
        <Progress value={65} className="h-3" />
        
        <p className="text-sm text-gray-600">
          This usually takes 1-2 minutes. Don&apos;t close this window.
        </p>
      </CardContent>
    </Card>
  )

  const renderSuccessStep = () => (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-green-800">NFT Minted Successfully!</CardTitle>
          <CardDescription>
            Your content is now available as a collectible NFT on Zora
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Your NFT Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Token ID:</span>
                <span className="font-mono">{mintResult?.tokenId || '1'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collection:</span>
                <span className="font-mono text-xs">{collectionAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mint Price:</span>
                <span>{formatEther(nftOptions.mintPrice)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max Supply:</span>
                <span>{nftOptions.maxSupply}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Blockchain:</span>
                <span>Base Network</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Royalty:</span>
                <span>5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Live on Zora
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minted:</span>
                <span>1 / {nftOptions.maxSupply}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            
            <Button variant="outline" className="flex-1" asChild>
              <a href={`https://zora.co/collect/${collectionAddress}/1`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Zora
              </a>
            </Button>
            
            <Button className="flex-1" onClick={() => setShowShareDialog(true)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>What Happens Next?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold">Social Discovery</h4>
              <p className="text-sm text-gray-600">
                Your NFT appears in Zora&apos;s social feeds and is discoverable by collectors
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold">Dual Revenue</h4>
              <p className="text-sm text-gray-600">
                Earn from both subscription access and NFT collectors
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold">Community Building</h4>
              <p className="text-sm text-gray-600">
                NFT holders become part of your exclusive collector community
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // ===== MAIN RENDER =====
  if (!walletUI.address) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to start creating collectible NFTs from your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg">
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!isRegistered) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Creator Registration Required</CardTitle>
          <CardDescription>
            Register as a creator to access NFT minting features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg">
            Register as Creator
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            Transform Your Content Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Collectible NFTs</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Create hybrid revenue streams by offering both subscription access and collectible NFT versions of your premium content on Zora.
          </p>
        </div>

        {/* Progress Indicator */}
        {renderProgress()}

        {/* Main Content */}
        <div className="min-h-96">
          {currentStep === 'setup' && renderSetupStep()}
          {currentStep === 'content' && renderContentStep()}
          {currentStep === 'nft' && renderMintingStep()}
          {currentStep === 'success' && renderSuccessStep()}
        </div>

        {/* Share Modal */}
        <CustomModal
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          title="Share Your NFT"
          description="Let the world know about your new collectible!"
          maxWidth="sm:max-w-md"
          mobileBottomSheet={true}
          closeOnOverlayClick={true}
          closeOnEscape={true}
          zIndex={50}
          footer={
            <Button onClick={() => setShowShareDialog(false)}>
              Done
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1">
                <span className="mr-2">𝕏</span> Twitter
              </Button>
              <Button variant="outline" className="flex-1">
                <span className="mr-2">📘</span> Facebook
              </Button>
              <Button variant="outline" className="flex-1">
                <span className="mr-2">💼</span> LinkedIn
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Direct Link</Label>
              <div className="flex space-x-2">
                <Input
                  value={`https://zora.co/collect/${collectionAddress}/1`}
                  readOnly
                  className="flex-1"
                />
                <Button size="icon" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CustomModal>
      </div>
    </TooltipProvider>
  )
}
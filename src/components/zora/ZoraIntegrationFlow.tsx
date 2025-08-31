import React, { useState, useCallback, useMemo } from 'react'
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
import { Separator } from '@/components/ui/seperator'
import {
  Sparkles,
  Plus,
  DollarSign,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Zap,
  Users,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react'

// ===== OPTIMIZED HOOKS (Focused, not monolithic) =====

function useFlowState() {
  const [currentStep, setCurrentStep] = useState<'setup' | 'content' | 'nft' | 'success'>('setup')
  const [canProceed, setCanProceed] = useState(false)
  
  const stepIndex = ['setup', 'content', 'nft', 'success'].indexOf(currentStep)
  const progress = Math.round(((stepIndex + 1) / 4) * 100)
  
  return { currentStep, setCurrentStep, canProceed, setCanProceed, progress }
}

function useRevenueCalculator(contentData: any, nftOptions: any) {
  // Debounced calculation to prevent constant re-renders
  const revenueProjection = useMemo(() => {
    if (!nftOptions.enabled) return null
    
    const subscriptionRevenue = 500 // $500/month baseline
    const nftMintRevenue = Number(formatEther(nftOptions.mintPrice)) * 2000 * (nftOptions.maxSupply * 0.1) // 10% mint rate
    const royaltyRevenue = nftMintRevenue * 0.05 * 0.2 // 5% royalty on 20% trading volume
    
    return {
      subscription: subscriptionRevenue,
      nftMints: nftMintRevenue,
      royalties: royaltyRevenue,
      total: subscriptionRevenue + nftMintRevenue + royaltyRevenue,
      increase: Math.round(((nftMintRevenue + royaltyRevenue) / subscriptionRevenue) * 100)
    }
  }, [nftOptions.enabled, nftOptions.mintPrice, nftOptions.maxSupply])
  
  return { revenueProjection }
}

function useZoraDemo() {
  const [isCreating, setIsCreating] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [collectionAddress, setCollectionAddress] = useState<string>()
  const [mintResult, setMintResult] = useState<any>(null)
  
  const createCollection = async () => {
    setIsCreating(true)
    await new Promise(r => setTimeout(r, 2000))
    setCollectionAddress('0x1234...abcd')
    setIsCreating(false)
  }
  
  const mintNFT = async () => {
    setIsMinting(true)
    await new Promise(r => setTimeout(r, 3000))
    const result = { tokenId: '1', transactionHash: '0xabc...def' }
    setMintResult(result)
    setIsMinting(false)
    return result
  }
  
  return {
    createCollection,
    mintNFT,
    isCreating,
    isMinting,
    collectionAddress,
    mintResult,
    hasCollection: Boolean(collectionAddress)
  }
}

// ===== MAIN OPTIMIZED COMPONENT =====

export default function OptimizedZoraIntegrationFlow() {
  const walletUI = useWalletConnectionUI()
  const { currentStep, setCurrentStep, progress } = useFlowState()
  const { createCollection, mintNFT, isCreating, isMinting, hasCollection, mintResult } = useZoraDemo()
  
  // ===== OPTIMIZED STATE (Minimal, focused) =====
  const [contentData, setContentData] = useState({
    title: 'The Future of Creator Economy',
    description: 'A deep dive into how Web3 is transforming how creators monetize their work.',
    category: 'article',
    tags: ['web3', 'creators', 'monetization']
  })
  
  const [nftOptions, setNftOptions] = useState({
    enabled: false,
    mintPrice: parseEther('0.01'),
    maxSupply: 100
  })
  
  // ===== REVENUE CALCULATION (Debounced) =====
  const { revenueProjection } = useRevenueCalculator(contentData, nftOptions)
  
  // ===== HANDLERS =====
  const handleNext = useCallback(async () => {
    if (currentStep === 'setup' && !hasCollection) {
      await createCollection()
    }
    
    if (currentStep === 'nft') {
      await mintNFT()
      setCurrentStep('success')
    } else {
      const nextSteps: Record<string, 'setup' | 'content' | 'nft' | 'success'> = { 
        setup: 'content', 
        content: 'nft', 
        nft: 'success' 
      }
      const nextStep = nextSteps[currentStep]
      if (nextStep) {
        setCurrentStep(nextStep)
      }
    }
  }, [currentStep, hasCollection, createCollection, mintNFT, setCurrentStep])
  
  const handleBack = () => {
    const prevSteps: Record<string, 'setup' | 'content' | 'nft' | 'success'> = { 
      content: 'setup', 
      nft: 'content', 
      success: 'nft' 
    }
    const prevStep = prevSteps[currentStep]
    if (prevStep) {
      setCurrentStep(prevStep)
    }
  }
  
  // ===== RENDER HELPERS =====
  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {['Setup', 'Content', 'NFT Options', 'Success'].map((step, index) => {
          const stepKeys = ['setup', 'content', 'nft', 'success']
          const currentIndex = stepKeys.indexOf(currentStep)
          const isActive = index === currentIndex
          const isComplete = index < currentIndex
          
          return (
            <div key={step} className={`flex items-center space-x-2 ${
              isComplete ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isComplete ? 'bg-green-100 text-green-600' : 
                isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>
                {isComplete ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <span className="hidden sm:block text-sm font-medium">{step}</span>
            </div>
          )
        })}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
  
  // ===== STEP COMPONENTS =====
  const renderSetupStep = () => (
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
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-semibold mb-3">Collection Overview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span>My Creator Collection</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blockchain:</span>
                <span>Base Network</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Royalty:</span>
                <span>5%</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleNext} 
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
                Create Collection & Continue
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
  
  const renderContentStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Details</CardTitle>
          <CardDescription>Tell us about your content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={contentData.title}
              onChange={(e) => setContentData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={contentData.description}
              onChange={(e) => setContentData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={contentData.category} onValueChange={(value) => 
                setContentData(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Podcast</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {contentData.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex space-x-4">
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
  
  const renderNFTStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span>NFT Options</span>
              </CardTitle>
              <CardDescription>
                Turn your content into a collectible NFT for additional revenue
              </CardDescription>
            </div>
            <Switch
              checked={nftOptions.enabled}
              onCheckedChange={(enabled) => setNftOptions(prev => ({ ...prev, enabled }))}
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
                  value={formatEther(nftOptions.mintPrice)}
                  onChange={(e) => setNftOptions(prev => ({ 
                    ...prev, 
                    mintPrice: parseEther(e.target.value || '0') 
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Max Supply</Label>
                <Input
                  type="number"
                  value={nftOptions.maxSupply}
                  onChange={(e) => setNftOptions(prev => ({ 
                    ...prev, 
                    maxSupply: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
            </div>
            
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
        <Button variant="outline" onClick={handleBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={isMinting}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isMinting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Minting NFT...
            </>
          ) : (
            <>
              {nftOptions.enabled ? 'Publish & Mint NFT' : 'Publish Content'}
              <Sparkles className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
  
  const renderSuccessStep = () => (
    <div className="space-y-6">
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
      
      {nftOptions.enabled && (
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
                  <span className="font-mono">{mintResult?.tokenId || '1'}</span>
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
              <Button variant="outline" className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button variant="outline" className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Zora
              </Button>
              <Button className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
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
  
  // ===== MAIN RENDER =====
  if (!walletUI.address) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>Start creating collectible NFTs from your content</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg">Connect Wallet</Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">
          Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Hybrid Revenue Streams</span>
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Combine subscription stability with NFT collectible upside. Earn more, build community, reach new audiences.
        </p>
      </div>
      
      {/* Progress Bar */}
      {renderProgressBar()}
      
      {/* Step Content */}
      <div className="min-h-96">
        {currentStep === 'setup' && renderSetupStep()}
        {currentStep === 'content' && renderContentStep()}
        {currentStep === 'nft' && renderNFTStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>
    </div>
  )
}
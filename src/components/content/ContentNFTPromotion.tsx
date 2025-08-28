/**
 * Content NFT Promotion Component
 * File: src/components/content/ContentNFTPromotion.tsx
 * 
 * This component allows creators to promote their existing subscription content
 * as NFTs on Zora, creating a hybrid monetization model that combines 
 * subscriptions with collectible ownership.
 * 
 * Integration Strategy:
 * - Extends existing content cards with "Mint as NFT" functionality
 * - Uses your established transaction handling patterns
 * - Integrates with Zora service layer for seamless minting
 * - Provides comprehensive user feedback and error handling
 * 
 * Demo Features:
 * - One-click content promotion to NFT
 * - Dynamic pricing based on subscription tier
 * - Real-time minting progress with transaction tracking
 * - Success states with marketplace links
 */

'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { type Address, parseEther, formatEther } from 'viem'
import {
  Sparkles,
  Loader2,
  ExternalLink,
  DollarSign,
  Users,
  Infinity,
  AlertTriangle,
  CheckCircle,
  Copy,
  Share,
  Eye,
  TrendingUp
} from 'lucide-react'

// Import shadcn/ui components following your patterns
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/seperator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Import your established hooks and services
import { useZoraService } from '@/hooks/zora/useZoraIntegration'
import { useCreatorProfile } from '@/hooks/contracts/core'
import { cn, formatAddress } from '@/lib/utils'

// Import Zora types
import type { ZoraNFTMetadata } from '@/types/zora'
import type { Content } from '@/types/contracts'

// ===== INTERFACES =====

interface ContentNFTPromotionProps {
  readonly content: Content
  readonly creatorAddress: Address
  readonly className?: string
  readonly onMintSuccess?: (contractAddress: Address, tokenId: bigint) => void
}

interface NFTMintConfiguration {
  readonly mintPrice: string // In ETH
  readonly maxSupply: number
  readonly royaltyBPS: number
  readonly customDescription?: string
}

type MintingState = 
  | 'idle'
  | 'configuring'
  | 'uploading-metadata'
  | 'minting'
  | 'confirming'
  | 'success'
  | 'error'

// ===== HELPER FUNCTIONS =====

/**
 * Calculate suggested mint price based on content tier and subscription price
 */
function calculateSuggestedPrice(
  subscriptionPrice: bigint,
  contentTier: 'free' | 'premium' | 'exclusive'
): bigint {
  const multipliers = {
    free: 0.001, // 0.001 ETH for free content
    premium: 0.01, // 0.01 ETH for premium  
    exclusive: 0.05 // 0.05 ETH for exclusive
  }
  
  const basePrice = parseEther(multipliers[contentTier].toString())
  
  // Add 10% of monthly subscription price converted to ETH (rough estimate)
  const subscriptionBonus = subscriptionPrice / BigInt(10)
  
  return basePrice + subscriptionBonus
}

/**
 * Format content metadata for Zora NFT
 */
function formatContentMetadata(
  content: Content,
  creatorAddress: Address,
  customDescription?: string
): Omit<ZoraNFTMetadata, 'tokenURI'> {
  return {
    name: content.title,
    description: customDescription || content.description,
    image: content.imageUrl || '', // Will be uploaded to IPFS
    external_url: `https://yourplatform.com/content/${content.id}`,
    attributes: [
      { trait_type: 'Category', value: content.category },
      { trait_type: 'Creator', value: creatorAddress },
      { trait_type: 'Platform', value: 'onchain-content-platform' },
      { trait_type: 'Content Type', value: content.paymentType === 0 ? 'Pay-per-view' : 'Subscription' },
      { trait_type: 'Publish Date', value: new Date().toISOString().split('T')[0] }
    ],
    content_id: content.id.toString(),
    creator_address: creatorAddress,
    original_publish_date: new Date().toISOString(),
    content_category: content.category,
    platform: 'onchain-content-platform'
  }
}

// ===== MAIN COMPONENT =====

export function ContentNFTPromotion({ 
  content, 
  creatorAddress, 
  className,
  onMintSuccess 
}: ContentNFTPromotionProps) {
  const { address: connectedAddress } = useAccount()
  const chainId = useChainId()
  
  // Zora integration hooks
  const { service: zoraService, isReady: zoraReady } = useZoraService()
  const { data: creatorProfile } = useCreatorProfile(creatorAddress)
  
  // Component state
  const [showConfigDialog, setShowConfigDialog] = useState<boolean>(false)
  const [mintingState, setMintingState] = useState<MintingState>('idle')
  const [mintConfig, setMintConfig] = useState<NFTMintConfiguration>({
    mintPrice: '0.01',
    maxSupply: 100,
    royaltyBPS: 500,
    customDescription: ''
  })
  const [mintProgress, setMintProgress] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mintResult, setMintResult] = useState<{
    contractAddress: Address
    tokenId: bigint
    transactionHash: string
  } | null>(null)

  // Permission checks
  const canMint = useMemo(() => {
    return (
      zoraReady &&
      connectedAddress === creatorAddress &&
      creatorProfile?.isRegistered
    )
  }, [zoraReady, connectedAddress, creatorAddress, creatorProfile])

  // Check if content is already minted as NFT
  const [isAlreadyMinted, setIsAlreadyMinted] = useState<boolean>(false)
  
  useEffect(() => {
    async function checkMintStatus() {
      if (!zoraService || !content.id) return
      
      try {
        const isMinted = await zoraService.isContentMinted(
          content.id.toString(),
          creatorAddress
        )
        setIsAlreadyMinted(isMinted)
      } catch (error) {
        console.error('Error checking mint status:', error)
      }
    }
    
    checkMintStatus()
  }, [zoraService, content.id, creatorAddress])

  // Suggested pricing
  const suggestedPrice = useMemo(() => {
    const tier = content.price === BigInt(0) ? 'free' : 
                 content.price < parseEther('0.01') ? 'premium' : 'exclusive'
    
    return formatEther(calculateSuggestedPrice(content.price, tier))
  }, [content.price])

  // Handle mint configuration
  const handleMintContent = useCallback(async () => {
    if (!zoraService || !canMint) {
      setErrorMessage('Zora service not available or insufficient permissions')
      return
    }

    try {
      setMintingState('uploading-metadata')
      setMintProgress(20)
      setErrorMessage(null)

      // Get creator's collection address
      const collectionAddress = await zoraService.getCreatorCollection(creatorAddress)
      if (!collectionAddress) {
        throw new Error('Creator must create a Zora collection first')
      }

      setMintProgress(40)

      // Prepare NFT metadata
      const metadata = formatContentMetadata(
        content,
        creatorAddress,
        mintConfig.customDescription
      )

      setMintingState('minting')
      setMintProgress(60)

      // Mint the NFT
      const result = await zoraService.mintContentAsNFT(
        collectionAddress,
        metadata,
        parseEther(mintConfig.mintPrice),
        mintConfig.maxSupply
      )

      if (!result.success) {
        throw new Error(result.error || 'Minting failed')
      }

      setMintProgress(100)
      setMintingState('success')
      setMintResult({
        contractAddress: collectionAddress,
        tokenId: result.tokenId!,
        transactionHash: result.transactionHash!
      })

      // Notify parent component
      onMintSuccess?.(collectionAddress, result.tokenId!)

      // Auto-close dialog after success
      setTimeout(() => {
        setShowConfigDialog(false)
        setMintingState('idle')
        setMintProgress(0)
      }, 3000)

    } catch (error) {
      console.error('NFT minting error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Minting failed')
      setMintingState('error')
    }
  }, [zoraService, canMint, creatorAddress, content, mintConfig, onMintSuccess])

  // Reset state when dialog closes
  const handleDialogClose = useCallback((open: boolean) => {
    setShowConfigDialog(open)
    if (!open) {
      setMintingState('idle')
      setMintProgress(0)
      setErrorMessage(null)
      setMintResult(null)
    }
  }, [])

  // Don't render if already minted or can't mint
  if (isAlreadyMinted) {
    return (
      <Badge variant="secondary" className="gap-2">
        <CheckCircle className="h-3 w-3" />
        Minted as NFT
      </Badge>
    )
  }

  if (!canMint) {
    return null
  }

  return (
    <Dialog open={showConfigDialog} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
          disabled={!canMint || isAlreadyMinted}
        >
          <Sparkles className="h-4 w-4" />
          Mint as NFT
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Promote Content as NFT
          </DialogTitle>
          <DialogDescription>
            Transform your subscription content into a collectible NFT on Zora marketplace.
            This creates additional revenue streams while maintaining your subscription model.
          </DialogDescription>
        </DialogHeader>

        {mintingState === 'idle' && (
          <div className="space-y-6">
            {/* Content Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{content.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {content.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">
                    {content.category}
                  </Badge>
                  <span>
                    {content.paymentType === 0 ? 'Pay-per-view' : 'Subscription'} Content
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mint-price">Mint Price (ETH)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="mint-price"
                    type="number"
                    step="0.001"
                    min="0"
                    value={mintConfig.mintPrice}
                    onChange={(e) => setMintConfig(prev => ({ 
                      ...prev, 
                      mintPrice: e.target.value 
                    }))}
                    placeholder={suggestedPrice}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMintConfig(prev => ({ 
                            ...prev, 
                            mintPrice: suggestedPrice 
                          }))}
                        >
                          Use Suggested ({suggestedPrice} ETH)
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Based on your content tier and subscription price
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max-supply">Max Supply</Label>
                  <Select
                    value={mintConfig.maxSupply.toString()}
                    onValueChange={(value) => setMintConfig(prev => ({
                      ...prev,
                      maxSupply: parseInt(value)
                    }))}
                  >
                    <SelectTrigger id="max-supply">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (1/1)</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="0">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="royalty">Royalty %</Label>
                  <Select
                    value={(mintConfig.royaltyBPS / 100).toString()}
                    onValueChange={(value) => setMintConfig(prev => ({
                      ...prev,
                      royaltyBPS: parseInt(value) * 100
                    }))}
                  >
                    <SelectTrigger id="royalty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="2.5">2.5%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="7.5">7.5%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-description">Custom NFT Description (Optional)</Label>
                <Textarea
                  id="custom-description"
                  value={mintConfig.customDescription}
                  onChange={(e) => setMintConfig(prev => ({
                    ...prev,
                    customDescription: e.target.value
                  }))}
                  placeholder="Add special context or story for NFT collectors..."
                  rows={3}
                />
              </div>
            </div>

            {/* Revenue Projection */}
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Revenue Potential:</strong> {mintConfig.maxSupply === 0 ? 'Unlimited' : mintConfig.maxSupply} × {mintConfig.mintPrice} ETH = 
                <span className="font-mono ml-1">
                  {mintConfig.maxSupply === 0 ? '∞' : (parseFloat(mintConfig.mintPrice) * mintConfig.maxSupply).toFixed(3)} ETH
                </span>
                {mintConfig.royaltyBPS > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    + {mintConfig.royaltyBPS / 100}% royalties on resales
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {(mintingState === 'uploading-metadata' || mintingState === 'minting' || mintingState === 'confirming') && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <h3 className="font-semibold">
                {mintingState === 'uploading-metadata' && 'Uploading metadata to IPFS...'}
                {mintingState === 'minting' && 'Minting your NFT...'}
                {mintingState === 'confirming' && 'Confirming transaction...'}
              </h3>
            </div>
            
            <Progress value={mintProgress} className="w-full" />
            
            <p className="text-sm text-muted-foreground text-center">
              This may take a few moments. Please don't close this dialog.
            </p>
          </div>
        )}

        {mintingState === 'success' && mintResult && (
          <div className="space-y-4 text-center">
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <h3 className="font-semibold text-lg">NFT Minted Successfully!</h3>
              <p className="text-muted-foreground">
                Your content is now available as an NFT on Zora marketplace
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Token ID:</span>
                    <code className="text-sm">{mintResult.tokenId.toString()}</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Collection:</span>
                    <code className="text-xs">{formatAddress(mintResult.contractAddress)}</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Transaction:</span>
                    <code className="text-xs">{formatAddress(mintResult.transactionHash)}</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View on Zora
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        )}

        {mintingState === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Minting Failed:</strong> {errorMessage}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setMintingState('idle')
                  setErrorMessage(null)
                  setMintProgress(0)
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {mintingState === 'idle' && (
            <>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMintContent} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Mint NFT ({mintConfig.mintPrice} ETH)
              </Button>
            </>
          )}
          
          {mintingState === 'success' && (
            <Button onClick={() => setShowConfigDialog(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
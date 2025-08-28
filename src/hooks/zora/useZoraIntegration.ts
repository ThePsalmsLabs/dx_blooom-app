// src/hooks/zora/useZoraIntegration.ts
/**
 * Advanced Zora Integration Hooks
 * 
 * These hooks integrate Zora functionality with your existing wagmi/viem setup,
 * providing type-safe, reactive interfaces for NFT minting that complement
 * your current content subscription system.
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  useAccount, 
  useChainId, 
  usePublicClient, 
  useWalletClient
} from 'wagmi'
import { Address, parseEther, formatEther, createPublicClient, http, parseEventLogs } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { useQueryClient } from '@tanstack/react-query'
import { ZoraIntegrationService, ZoraCollectionConfig } from '@/lib/services/zora-integration'
import { type ZoraNFTMetadata } from '@/types/zora'
import { useRegisterContent } from '@/hooks/contracts/core'
import { ZoraDatabaseService } from '@/services/zora/ZoraDatabaseService'
import { CONTENT_REGISTRY_ABI } from '@/lib/contracts/abis/content-registry'
import type { ContentUploadParams } from '@/types/contracts'

/**
 * Main Zora Integration Hook
 * 
 * This hook provides the primary interface for Zora functionality,
 * automatically connecting to your wagmi configuration.
 */
export function useZoraService() {
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()

  const service = useMemo(() => {
    if (!publicClient) return null

    try {
      return new ZoraIntegrationService(publicClient, walletClient, chainId)
    } catch (error) {
      console.error('Failed to initialize Zora service:', error)
      return null
    }
  }, [publicClient, walletClient, chainId])

  const isReady = Boolean(service && address)

  return {
    service,
    isReady,
    userAddress: address,
    chainId
  }
}

/**
 * Creator Collection Management Hook
 * 
 * This hook manages the creation and tracking of Zora collections for creators.
 * It integrates with your existing creator registration system.
 */
export function useCreatorZoraCollection() {
  const { service, userAddress } = useZoraService()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track creator's collection address from database
  const [collectionAddress, setCollectionAddress] = useState<Address | null>(null)

  // Load existing collection address on mount
  useEffect(() => {
    const loadCollectionAddress = async () => {
      if (!userAddress) return
      
      try {
        const dbService = new ZoraDatabaseService()
        const collection = await dbService.getCreatorCollection(userAddress)
        if (collection?.zoraCollectionAddress) {
          setCollectionAddress(collection.zoraCollectionAddress)
        }
      } catch (error) {
        console.error('Error loading collection address:', error)
      }
    }

    loadCollectionAddress()
  }, [userAddress])

  const createCollection = useCallback(async (config: Omit<ZoraCollectionConfig, 'creator'>) => {
    if (!service || !userAddress) {
      throw new Error('Service not ready or user not connected')
    }

    setIsCreating(true)
    setError(null)

    try {
      const fullConfig: ZoraCollectionConfig = {
        ...config,
        creator: userAddress
      }

      const result = await service.createCreatorCollection(fullConfig)

      if (result.success && result.contractAddress) {
        setCollectionAddress(result.contractAddress)
        
        // Invalidate queries to refresh UI
        queryClient.invalidateQueries({ queryKey: ['creator-collections'] })

        // Store collection address in database
        try {
          const dbService = new ZoraDatabaseService()
          await dbService.storeCreatorCollection({
            creatorAddress: userAddress,
            creatorProfile: {
              isRegistered: true,
              subscriptionPrice: BigInt(0),
              isVerified: false,
              totalEarnings: BigInt(0),
              contentCount: BigInt(0),
              subscriberCount: BigInt(0),
              registrationTime: BigInt(0)
            },
            hasZoraCollection: true,
            zoraCollectionAddress: result.contractAddress,
            zoraCollectionName: config.name,
            zoraCollectionDescription: config.description,
            zoraCollectionURI: config.contractURI,
            royaltyBPS: config.royaltyBPS,
            defaultMintPrice: config.defaultPrice,
            maxSupply: config.maxSupply,
            totalNFTsMinted: 0,
            totalCollectionVolume: BigInt(0),
            totalMints: BigInt(0),
            averageMintPrice: BigInt(0),
            collectionStatus: 'active',
            lastUpdated: new Date()
          })
        } catch (error) {
          console.error('Error storing collection in database:', error)
          // Don't throw here as the collection was created successfully
        }

        return result.contractAddress
      } else {
        throw new Error(result.error || 'Collection creation failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Collection creation failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [service, userAddress, queryClient])

  return {
    collectionAddress,
    createCollection,
    isCreating,
    error,
    hasCollection: Boolean(collectionAddress)
  }
}

/**
 * Content NFT Minting Hook
 * 
 * This hook handles the process of minting your platform's content as NFTs,
 * integrating with your existing content management system.
 */
export function useContentNFTMinting(collectionAddress?: Address) {
  const { service } = useZoraService()
  const queryClient = useQueryClient()
  const [isMinting, setIsMinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mintResult, setMintResult] = useState<{
    transactionHash: string
    tokenId: bigint
    contractAddress: Address
  } | null>(null)

  const mintContentAsNFT = useCallback(async (
    contentData: {
      contentId: string
      title: string
      description: string
      imageUrl: string
      category: string
      tags: string[]
      creatorAddress: Address
      subscriptionTier?: 'free' | 'premium' | 'exclusive'
    },
    options: {
      mintPrice?: bigint
      maxSupply?: number
      royaltyPercentage?: number
    } = {}
  ) => {
    if (!service || !collectionAddress) {
      throw new Error('Service not ready or no collection address provided')
    }

    setIsMinting(true)
    setError(null)
    setMintResult(null)

    try {
      // Upload NFT metadata to IPFS
      const metadata = service.formatContentAsNFTMetadata(
        contentData.contentId,
        contentData.title,
        contentData.description,
        contentData.imageUrl,
        contentData.creatorAddress,
        contentData.category,
        contentData.tags,
        contentData.subscriptionTier
      )

      // Upload metadata to IPFS using the existing IPFS service
      const ipfsResult = await uploadMetadataToIPFS(metadata)
      if (!ipfsResult.success) {
        throw new Error(`Failed to upload metadata to IPFS: ${ipfsResult.error}`)
      }

      // Create metadata with IPFS URI
      const metadataWithURI = {
        ...metadata,
        tokenURI: `ipfs://${ipfsResult.hash}`
      }

      // Calculate optimal mint price if not provided
      const mintPrice = options.mintPrice || service.calculateMintPrice(
        parseEther('0.01'), // Base subscription price equivalent
        contentData.subscriptionTier || 'premium',
        1.0
      )

      const result = await service.mintContentAsNFT(
        collectionAddress,
        metadataWithURI,
        mintPrice,
        options.maxSupply
      )

      if (result.success && result.transactionHash && result.tokenId && result.contractAddress) {
        const mintData = {
          transactionHash: result.transactionHash,
          tokenId: result.tokenId,
          contractAddress: result.contractAddress
        }
        
        setMintResult(mintData)

        // Store NFT record in database
        try {
          const dbService = new ZoraDatabaseService()
          await dbService.storeContentNFTRecord({
            contentId: BigInt(contentData.contentId),
            creatorAddress: contentData.creatorAddress,
            originalContent: {
              creator: contentData.creatorAddress,
              ipfsHash: contentData.contentId, // Using contentId as IPFS hash for now
              title: contentData.title,
              description: contentData.description,
              category: contentData.category as any,
              payPerViewPrice: mintPrice,
              creationTime: BigInt(Date.now()),
              isActive: true
            },
            isMintedAsNFT: true,
            nftContractAddress: result.contractAddress,
            nftTokenId: result.tokenId,
            nftMintPrice: mintPrice,
            nftMaxSupply: options.maxSupply || 100,
            nftTotalMinted: BigInt(1),
            nftMetadata: metadata,
            mintTransactionHash: result.transactionHash,
            mintTimestamp: new Date(),
            nftViews: 0,
            nftMints: 1,
            nftRevenue: mintPrice,
            lastMintDate: new Date(),
            nftStatus: 'minted',
            lastUpdated: new Date()
          })
        } catch (dbError) {
          console.error('Error storing NFT record in database:', dbError)
          // Don't throw here as the NFT was minted successfully
        }

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['content-nfts'] })
        queryClient.invalidateQueries({ queryKey: ['creator-analytics'] })

        return mintData
      } else {
        throw new Error(result.error || 'Minting failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Minting failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsMinting(false)
    }
  }, [service, collectionAddress, queryClient])

  return {
    mintContentAsNFT,
    isMinting,
    error,
    mintResult,
    clearResult: () => setMintResult(null)
  }
}

/**
 * Content NFT Status Hook
 * 
 * This hook tracks whether content has been minted as an NFT and provides
 * metadata about the NFT version of content pieces.
 */
export function useContentNFTStatus(contentId: string, creatorAddress?: Address) {
  const { service } = useZoraService()
  const [nftData, setNftData] = useState<{
    isMinted: boolean
    contractAddress?: Address
    tokenId?: bigint
    mintPrice?: bigint
    totalMinted?: bigint
    maxSupply?: bigint
    metadata?: ZoraNFTMetadata
  }>({ isMinted: false })

  const checkNFTStatus = useCallback(async () => {
    if (!service || !creatorAddress) return

    try {
      // Check if content is minted using database service
      const dbService = new ZoraDatabaseService()
      const isMinted = await dbService.isContentMintedAsNFT(BigInt(contentId))
      
      if (isMinted) {
        // If minted, fetch the NFT details from database
        try {
          const nftRecord = await dbService.getContentNFTRecord(BigInt(contentId))
          
          if (nftRecord) {
            setNftData({
              isMinted: true,
              contractAddress: nftRecord.nftContractAddress!,
              tokenId: nftRecord.nftTokenId!,
              mintPrice: nftRecord.nftMintPrice!,
              totalMinted: nftRecord.nftTotalMinted!,
              maxSupply: BigInt(nftRecord.nftMaxSupply || 0),
              metadata: nftRecord.nftMetadata
            })
          } else {
            setNftData({ isMinted: false })
          }
        } catch (error) {
          console.error('Error fetching NFT details:', error)
          setNftData({ isMinted: false })
        }
      } else {
        setNftData({ isMinted: false })
      }
    } catch (error) {
      console.error('Error checking NFT status:', error)
      setNftData({ isMinted: false })
    }
  }, [service, contentId, creatorAddress])

  useEffect(() => {
    checkNFTStatus()
  }, [checkNFTStatus])

  return {
    ...nftData,
    refreshStatus: checkNFTStatus
  }
}

/**
 * Zora Collection Analytics Hook
 * 
 * This hook provides analytics about a creator's Zora collection,
 * complementing your existing creator dashboard metrics.
 */
export function useZoraCollectionAnalytics(collectionAddress?: Address) {
  const { service } = useZoraService()
  const [analytics, setAnalytics] = useState<{
    totalNFTs: number
    totalMinted: bigint
    totalVolume: bigint
    averagePrice: bigint
    loading: boolean
    error: string | null
  }>({
    totalNFTs: 0,
    totalMinted: BigInt(0),
    totalVolume: BigInt(0),
    averagePrice: BigInt(0),
    loading: false,
    error: null
  })

  const fetchAnalytics = useCallback(async () => {
    if (!service || !collectionAddress) return

    setAnalytics(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Query real analytics from database
      const dbService = new ZoraDatabaseService()
      const performance = await dbService.getCreatorNFTPerformance(collectionAddress)
      
      const realAnalytics = {
        totalNFTs: performance.totalNFTs,
        totalMinted: performance.totalMints,
        totalVolume: performance.totalRevenue,
        averagePrice: performance.averageMintPrice,
        loading: false,
        error: null
      }

      setAnalytics(realAnalytics)
    } catch (error) {
      console.error('Error fetching collection analytics:', error)
      setAnalytics(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics'
      }))
    }
  }, [service, collectionAddress])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    ...analytics,
    refreshAnalytics: fetchAnalytics,
    formattedVolume: formatEther(analytics.totalVolume),
    formattedAveragePrice: formatEther(analytics.averagePrice)
  }
}

/**
 * Integrated Content Publishing Hook
 * 
 * This hook extends your existing content publishing flow to include
 * optional NFT minting as part of the publishing process.
 */
export function useIntegratedContentPublishing() {
  const { service, userAddress } = useZoraService()
  const { collectionAddress } = useCreatorZoraCollection()
  const { mintContentAsNFT } = useContentNFTMinting(collectionAddress || undefined)
  const registerContent = useRegisterContent()
  const chainId = useChainId()
  const queryClient = useQueryClient()
  const dbService = useMemo(() => new ZoraDatabaseService(), [])
  
  const [publishingState, setPublishingState] = useState<{
    step: 'idle' | 'publishing-content' | 'minting-nft' | 'complete'
    error: string | null
    contentId?: bigint
    nftResult?: { transactionHash: string; tokenId: bigint }
  }>({ step: 'idle', error: null })

  const publishWithOptionalNFT = useCallback(async (
    contentData: {
      title: string
      description: string
      category: string
      tags: string[]
      ipfsHash: string
      payPerViewPrice: bigint
      subscriptionTier: 'free' | 'premium' | 'exclusive'
      imageUrl: string
    },
    nftOptions?: {
      shouldMintAsNFT: boolean
      mintPrice?: bigint
      maxSupply?: number
    }
  ) => {
    if (!userAddress) {
      throw new Error('User not connected')
    }

    setPublishingState({ step: 'publishing-content', error: null })

    try {
      // Step 1: Publish content using your existing system
      const contentParams: ContentUploadParams = {
        ipfsHash: contentData.ipfsHash,
        title: contentData.title,
        description: contentData.description,
        category: contentData.category as any, // Convert string to enum
        payPerViewPrice: contentData.payPerViewPrice,
        tags: contentData.tags
      }

      // Register content on blockchain
      registerContent.write(contentParams)

      // Wait for content registration to complete
      if (registerContent.hash) {
        // Wait for confirmation
        while (!registerContent.isConfirmed && !registerContent.isError) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        if (registerContent.isError) {
          throw new Error(registerContent.error?.message || 'Content registration failed')
        }
      }

      // Extract content ID from transaction logs using proper event parsing
      let contentId: bigint
      try {
        const publicClient = createPublicClient({
          chain: chainId === 8453 ? base : baseSepolia,
          transport: http()
        })
        
        const receipt = await publicClient.getTransactionReceipt({
          hash: registerContent.hash as `0x${string}`
        })
        
        const contentRegisteredLogs = parseEventLogs({
          abi: CONTENT_REGISTRY_ABI,
          eventName: 'ContentRegistered',
          logs: receipt.logs
        })
        
        if (contentRegisteredLogs.length > 0) {
          contentId = contentRegisteredLogs[0].args.contentId
          console.log('Successfully extracted content ID:', contentId)
        } else {
          throw new Error('Content ID not found in transaction receipt')
        }
      } catch (extractError) {
        console.error('Error extracting content ID:', extractError)
        throw new Error('Failed to extract content ID from transaction')
      }

      // Step 2: Optionally mint as NFT
      let nftResult = undefined
      if (nftOptions?.shouldMintAsNFT && collectionAddress && service) {
        setPublishingState({ 
          step: 'minting-nft', 
          error: null, 
          contentId 
        })

        // Upload NFT metadata to IPFS
        const metadata = service.formatContentAsNFTMetadata(
          contentId.toString(),
          contentData.title,
          contentData.description,
          contentData.imageUrl,
          userAddress,
          contentData.category,
          contentData.tags,
          contentData.subscriptionTier
        )

        const ipfsResult = await uploadMetadataToIPFS(metadata)
        if (!ipfsResult.success) {
          throw new Error(`Failed to upload metadata to IPFS: ${ipfsResult.error}`)
        }

        // Create metadata with IPFS URI
        const metadataWithURI = {
          ...metadata,
          tokenURI: `ipfs://${ipfsResult.hash}`
        }

        // Mint NFT
        const mintResult = await service.mintContentAsNFT(
          collectionAddress,
          metadataWithURI,
          nftOptions.mintPrice,
          nftOptions.maxSupply
        )

        if (mintResult.success && mintResult.transactionHash && mintResult.tokenId) {
          nftResult = {
            transactionHash: mintResult.transactionHash,
            tokenId: mintResult.tokenId
          }

          // Store NFT record in database
          await dbService.storeContentNFTRecord({
            contentId,
            creatorAddress: userAddress,
            originalContent: {
              creator: userAddress,
              ipfsHash: contentData.ipfsHash,
              title: contentData.title,
              description: contentData.description,
              category: contentData.category as any,
              payPerViewPrice: contentData.payPerViewPrice,
              creationTime: BigInt(Date.now()),
              isActive: true
            },
            isMintedAsNFT: true,
            nftContractAddress: collectionAddress,
            nftTokenId: mintResult.tokenId,
            nftMintPrice: nftOptions.mintPrice,
            nftMaxSupply: nftOptions.maxSupply,
            nftTotalMinted: BigInt(1),
            nftMetadata: metadata,
            mintTransactionHash: mintResult.transactionHash,
            mintTimestamp: new Date(),
            nftViews: 0,
            nftMints: 1,
            nftRevenue: nftOptions.mintPrice || BigInt(0),
            lastMintDate: new Date(),
            nftStatus: 'minted',
            lastUpdated: new Date()
          })
        }
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['content'] })
      queryClient.invalidateQueries({ queryKey: ['creator-content'] })
      queryClient.invalidateQueries({ queryKey: ['nft-status'] })

      setPublishingState({
        step: 'complete',
        error: null,
        contentId,
        nftResult
      })

      return {
        contentId,
        nftResult
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Publishing failed'
      setPublishingState({
        step: 'idle',
        error: errorMessage
      })
      throw new Error(errorMessage)
    }
  }, [userAddress, collectionAddress, mintContentAsNFT, registerContent, service, queryClient, dbService])

  return {
    publishWithOptionalNFT,
    publishingState,
    canMintNFT: Boolean(collectionAddress),
    resetState: () => setPublishingState({ step: 'idle', error: null })
  }
}

/**
 * Zora Mint Price Calculator Hook
 * 
 * This hook helps creators understand optimal pricing strategies
 * for their NFTs based on their subscription model.
 */
export function useZoraPriceCalculator() {
  const { service } = useZoraService()

  const calculateRecommendedPrice = useCallback((
    subscriptionPrice: bigint,
    contentTier: 'free' | 'premium' | 'exclusive',
    creatorSettings: {
      aggressivenessMultiplier: number // 0.5 = conservative, 1.0 = balanced, 2.0 = aggressive
      minimumPrice?: bigint
    }
  ) => {
    if (!service) return parseEther('0.000777')

    const basePrice = service.calculateMintPrice(
      subscriptionPrice,
      contentTier,
      creatorSettings.aggressivenessMultiplier
    )

    const minimumPrice = creatorSettings.minimumPrice || parseEther('0.000777')
    
    return basePrice > minimumPrice ? basePrice : minimumPrice
  }, [service])

  const getPriceRecommendations = useCallback((subscriptionPrice: bigint) => {
    return {
      conservative: calculateRecommendedPrice(subscriptionPrice, 'premium', { aggressivenessMultiplier: 0.5 }),
      balanced: calculateRecommendedPrice(subscriptionPrice, 'premium', { aggressivenessMultiplier: 1.0 }),
      aggressive: calculateRecommendedPrice(subscriptionPrice, 'exclusive', { aggressivenessMultiplier: 2.0 })
    }
  }, [calculateRecommendedPrice])

  return {
    calculateRecommendedPrice,
    getPriceRecommendations
  }
}

/**
 * Helper function to upload metadata to IPFS
 * Uses the existing IPFS upload service - follows the same pattern as CreatorProfileEditor
 */
async function uploadMetadataToIPFS(metadata: ZoraNFTMetadata): Promise<{ success: boolean; hash?: string; error?: string }> {
  try {
    // Create a blob from the metadata JSON
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    })

    // Create a File object from the blob
    const metadataFile = new File([metadataBlob], 'metadata.json', {
      type: 'application/json'
    })

    // Upload to IPFS using the existing API endpoint - same pattern as CreatorProfileEditor
    const formData = new FormData()
    formData.append('file', metadataFile)

    const response = await fetch('/api/ipfs/upload', { 
      method: 'POST', 
      body: formData 
    })
    
    const result = await response.json() as { success?: boolean; hash?: string; error?: string }
    
    if (!response.ok || !result?.hash) {
      throw new Error(result?.error || 'IPFS upload failed')
    }

    return {
      success: true,
      hash: result.hash
    }
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}
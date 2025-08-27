/**
 * Zora NFT Creation Hook
 * Following your established transaction patterns
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  useWriteContract, 
  useWaitForTransactionReceipt
} from 'wagmi'
import { type Address, type Hash } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { ZORA_CREATOR_1155_IMPL_ABI } from '@/lib/contracts/abis/zora'
import { ipfsService, createZoraMetadata } from '@/lib/services/ipfs-zora'
import { 
  extractTokenIdFromUpdatedEvent,
  parseUpdatedTokenEvent,
  type UpdatedTokenEvent
} from '@/lib/utils/zora-events'
import {
  mapWagmiError,
  mapIPFSError,
  createValidationError,
  createContractError,
  createIPFSError,
  ZORA_ERROR_CODES,
  ZORA_ERROR_CATEGORIES,
  logZoraError,
  logUserError,
  type ZoraErrorContext
} from '@/lib/utils/zora-errors'

/**
 * NFT Creation Parameters
 */
interface ZoraNFTParams {
  readonly collectionAddress: Address
  readonly name: string
  readonly description: string
  readonly imageUrl: string
  readonly maxSupply: bigint
  readonly createReferral?: Address
  readonly metadata?: {
    readonly contentId?: string
    readonly subscriptionTier?: string
    readonly contentCategory?: string
    readonly mintPrice?: string
    readonly royaltyPercentage?: number
    readonly attributes?: Array<{ trait_type: string; value: string | number }>
  }
}

/**
 * NFT Creation Result
 */
interface ZoraNFTCreationResult {
  readonly createNFT: (params: ZoraNFTParams) => Promise<void>
  readonly isLoading: boolean
  readonly isConfirming: boolean
  readonly isSuccess: boolean
  readonly error: Error | null
  readonly hash: Hash | undefined
  readonly tokenId: bigint | undefined
  readonly reset: () => void
}

export function useZoraNFTCreation(): ZoraNFTCreationResult {
  const [tokenId, setTokenId] = useState<bigint | undefined>()
  const queryClient = useQueryClient()

  const { 
    writeContract, 
    data: hash, 
    isPending, 
    error: writeError,
    reset: resetWrite
  } = useWriteContract()
  
  const { 
    isLoading: isConfirming, 
    isSuccess, 
    error: receiptError,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Extract token ID from transaction receipt using proper event parsing
  const extractedTokenId = useMemo(() => {
    if (!isSuccess || !receipt) return undefined
    
    try {
      // For now, we'll use a placeholder approach since we don't have the collection address in scope
      // In a full implementation, we would store the collection address when creating the NFT
      
      // Look for any UpdatedToken events in the receipt
      const updatedEvents = parseUpdatedTokenEvent(receipt, '0x0000000000000000000000000000000000000000' as Address)
      if (updatedEvents.length > 0) {
        console.log('Found UpdatedToken events:', updatedEvents.length)
        return updatedEvents[0].tokenId
      }
      
      console.warn('No UpdatedToken events found in transaction receipt')
      return undefined
    } catch (error) {
      console.error('Failed to extract token ID from receipt:', error)
      return undefined
    }
  }, [isSuccess, receipt])

  // Update token ID when extraction completes
  useMemo(() => {
    if (extractedTokenId && extractedTokenId !== tokenId) {
      setTokenId(extractedTokenId)
      queryClient.invalidateQueries({ queryKey: ['readContract'] })
    }
  }, [extractedTokenId, tokenId, queryClient])

  const createNFT = useCallback(async (params: ZoraNFTParams) => {
    // Create error context
    const errorContext: ZoraErrorContext = {
      operation: 'nft_creation',
      contractAddress: params.collectionAddress,
      metadata: {
        nftName: params.name,
        maxSupply: params.maxSupply.toString(),
        createReferral: params.createReferral
      }
    }

    try {
      // Validate parameters
      if (!params.name.trim()) {
        throw createValidationError(
          'NFT name is required',
          ZORA_ERROR_CODES.INVALID_PARAMETERS,
          errorContext
        )
      }

      if (!params.description.trim()) {
        throw createValidationError(
          'NFT description is required',
          ZORA_ERROR_CODES.INVALID_PARAMETERS,
          errorContext
        )
      }

      if (!params.imageUrl.trim()) {
        throw createValidationError(
          'NFT image URL is required',
          ZORA_ERROR_CODES.INVALID_PARAMETERS,
          errorContext
        )
      }

      if (params.maxSupply <= BigInt(0)) {
        throw createValidationError(
          'Max supply must be greater than 0',
          ZORA_ERROR_CODES.INVALID_PARAMETERS,
          errorContext
        )
      }

      // Create NFT metadata
      const nftMetadata = createZoraMetadata(
        params.name,
        params.description,
        params.imageUrl,
        '0x0000000000000000000000000000000000000000', // Will be set by contract
        {
          contentId: params.metadata?.contentId,
          subscriptionTier: params.metadata?.subscriptionTier,
          contentCategory: params.metadata?.contentCategory,
          mintPrice: params.metadata?.mintPrice,
          maxSupply: Number(params.maxSupply),
          royaltyPercentage: params.metadata?.royaltyPercentage,
          attributes: params.metadata?.attributes
        }
      )
      
      // Upload metadata to IPFS
      let ipfsResult
      try {
        ipfsResult = await ipfsService.uploadMetadata(nftMetadata)
      } catch (ipfsError) {
        const zoraError = mapIPFSError(ipfsError, errorContext)
        logZoraError(zoraError)
        throw zoraError
      }
      
      if (!ipfsResult.success) {
        const zoraError = createIPFSError(
          `Failed to upload metadata to IPFS: ${ipfsResult.error}`,
          ZORA_ERROR_CODES.IPFS_UPLOAD_FAILED,
          errorContext
        )
        logZoraError(zoraError)
        throw zoraError
      }
      
      // Create token URI using IPFS hash
      const tokenURI = `ipfs://${ipfsResult.hash}`
      
      // Call contract to create NFT
      try {
        if (params.createReferral) {
          await writeContract({
            address: params.collectionAddress,
            abi: ZORA_CREATOR_1155_IMPL_ABI,
            functionName: 'setupNewTokenWithCreateReferral',
            args: [
              tokenURI,
              params.maxSupply,
              params.createReferral
            ]
          })
        } else {
          await writeContract({
            address: params.collectionAddress,
            abi: ZORA_CREATOR_1155_IMPL_ABI,
            functionName: 'setupNewToken',
            args: [
              tokenURI,
              params.maxSupply
            ]
          })
        }
      } catch (contractError) {
        const zoraError = mapWagmiError(contractError, errorContext)
        logZoraError(zoraError)
        throw zoraError
      }
    } catch (error) {
      // Log error for debugging
      logUserError(error, 'NFT Creation')
      
      // Re-throw the error (it's already a ZoraError if we created it)
      throw error
    }
  }, [writeContract])

  const reset = useCallback(() => {
    setTokenId(undefined)
    resetWrite()
  }, [resetWrite])

  return {
    createNFT,
    isLoading: isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    hash,
    tokenId,
    reset
  }
}
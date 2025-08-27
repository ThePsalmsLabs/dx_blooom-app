/**
 * Zora Collection Creation Hook
 * Following your exact wagmi and contract interaction patterns
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useChainId
} from 'wagmi'
import { type Address, type Hash } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { getZoraFactoryContract } from '@/lib/contracts/config'
import { ZORA_CREATOR_1155_FACTORY_ABI } from '@/lib/contracts/abis/zora'
import { ipfsService, createZoraCollectionMetadata } from '@/lib/services/ipfs-zora'
import { 
  extractContractAddressFromSetupEvent,
  parseSetupNewContractEvent,
  type SetupNewContractEvent
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
 * Royalty Configuration Interface
 * Follows your readonly pattern for type safety
 */
interface ZoraRoyaltyConfig {
  readonly royaltyMintSchedule: number
  readonly royaltyBPS: number
  readonly royaltyRecipient: Address
}

/**
 * Collection Creation Parameters
 * Defines input structure following your established patterns
 */
interface ZoraCollectionParams {
  readonly name: string
  readonly description: string
  readonly royaltyConfig: ZoraRoyaltyConfig
  readonly defaultAdmin: Address
}

/**
 * Collection Creation Result Interface
 * Following your established hook return patterns
 */
interface ZoraCollectionCreationResult {
  readonly createCollection: (params: ZoraCollectionParams) => Promise<void>
  readonly isLoading: boolean
  readonly isConfirming: boolean
  readonly isSuccess: boolean
  readonly error: Error | null
  readonly hash: Hash | undefined
  readonly contractAddress: Address | undefined
  readonly reset: () => void
}

export function useZoraCollectionCreation(): ZoraCollectionCreationResult {
  const [contractAddress, setContractAddress] = useState<Address | undefined>()
  const chainId = useChainId()
  const queryClient = useQueryClient()

  // Following your exact wagmi patterns
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

  // Extract contract address from transaction receipt using proper event parsing
  const extractedAddress = useMemo(() => {
    if (!isSuccess || !receipt) return undefined
    
    try {
      const factoryContract = getZoraFactoryContract(chainId)
      const contractAddress = extractContractAddressFromSetupEvent(receipt, factoryContract.address)
      
      if (contractAddress) {
        console.log('Extracted contract address from SetupNewContract event:', contractAddress)
        return contractAddress
      }
      
      // Fallback: try to find any SetupNewContract events
      const setupEvents = parseSetupNewContractEvent(receipt, factoryContract.address)
      if (setupEvents.length > 0) {
        console.log('Found SetupNewContract events:', setupEvents.length)
        return setupEvents[0].contractAddress
      }
      
      console.warn('No SetupNewContract events found in transaction receipt')
      return undefined
    } catch (error) {
      console.error('Failed to extract contract address from receipt:', error)
      return undefined
    }
  }, [isSuccess, receipt, chainId])

  // Update contract address when extraction completes
  useMemo(() => {
    if (extractedAddress && extractedAddress !== contractAddress) {
      setContractAddress(extractedAddress)
      // Invalidate queries following your patterns
      queryClient.invalidateQueries({ queryKey: ['readContract'] })
    }
  }, [extractedAddress, contractAddress, queryClient])

  const createCollection = useCallback(async (params: ZoraCollectionParams) => {
    const factoryContract = getZoraFactoryContract(chainId)
    
    // Create error context
    const errorContext: ZoraErrorContext = {
      operation: 'collection_creation',
      contractAddress: factoryContract.address,
      chainId,
      metadata: {
        collectionName: params.name,
        royaltyBPS: params.royaltyConfig.royaltyBPS,
        defaultAdmin: params.defaultAdmin
      }
    }

    try {
      // Validate parameters
      if (!params.name.trim()) {
        throw createValidationError(
          'Collection name is required',
          ZORA_ERROR_CODES.INVALID_PARAMETERS,
          errorContext
        )
      }

      if (params.royaltyConfig.royaltyBPS > 10000) {
        throw createValidationError(
          'Royalty BPS cannot exceed 10000 (100%)',
          ZORA_ERROR_CODES.INVALID_PARAMETERS,
          errorContext
        )
      }

      // Create collection metadata
      const collectionMetadata = createZoraCollectionMetadata(
        params.name,
        params.description,
        '', // Default empty image - can be updated later
        params.royaltyConfig.royaltyBPS,
        params.royaltyConfig.royaltyRecipient
      )
      
      // Upload metadata to IPFS
      let ipfsResult
      try {
        ipfsResult = await ipfsService.uploadMetadata(collectionMetadata)
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
      
      // Create contract URI using IPFS hash
      const contractURI = `ipfs://${ipfsResult.hash}`
      
      // Execute contract call
      try {
        await writeContract({
          address: factoryContract.address,
          abi: ZORA_CREATOR_1155_FACTORY_ABI,
          functionName: 'createContract',
          args: [
            contractURI,
            params.name,
            {
              royaltyMintSchedule: params.royaltyConfig.royaltyMintSchedule,
              royaltyBPS: params.royaltyConfig.royaltyBPS,
              royaltyRecipient: params.royaltyConfig.royaltyRecipient
            },
            params.defaultAdmin,
            [] // Empty setup actions for basic collection
          ]
        })
      } catch (contractError) {
        const zoraError = mapWagmiError(contractError, errorContext)
        logZoraError(zoraError)
        throw zoraError
      }
    } catch (error) {
      // Log error for debugging
      logUserError(error, 'Collection Creation')
      
      // Re-throw the error (it's already a ZoraError if we created it)
      throw error
    }
  }, [writeContract, chainId])

  const reset = useCallback(() => {
    setContractAddress(undefined)
    resetWrite()
  }, [resetWrite])

  return {
    createCollection,
    isLoading: isPending,
    isConfirming,
    isSuccess,
    error: writeError || receiptError,
    hash,
    contractAddress,
    reset
  }
}
import { useState, useCallback, useMemo } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { type Address, parseEther, encodeAbiParameters, parseAbiParameters } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { 
  getFixedPriceSaleStrategyContract 
} from '@/lib/contracts/config'
import { 
  ZORA_CREATOR_1155_IMPL_ABI 
} from '@/lib/contracts/abis/zora'
import { 
  parsePurchasedEvent,
  parseMintedEvent,
  type PurchasedEvent,
  type MintedEvent
} from '@/lib/utils/zora-events'
import {
  mapWagmiError,
  createValidationError,
  ZORA_ERROR_CODES,
  logZoraError,
  logUserError,
  type ZoraErrorContext
} from '@/lib/utils/zora-errors'

interface ZoraMintParams {
  collectionAddress: Address
  tokenId: bigint
  quantity: bigint
  recipient: Address
  mintComment?: string
  mintReferral?: Address
}

interface ZoraMintResult {
  mint: (params: ZoraMintParams) => Promise<void>
  isLoading: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
  hash: string | undefined
  mintEvents: (PurchasedEvent | MintedEvent)[]
  reset: () => void
}

export function useZoraMinting(): ZoraMintResult {
  const [error, setError] = useState<Error | null>(null)
  const [mintEvents, setMintEvents] = useState<(PurchasedEvent | MintedEvent)[]>([])
  const chainId = useChainId()
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

  // Parse mint events from transaction receipt
  const parsedMintEvents = useMemo(() => {
    if (!isSuccess || !receipt) return []
    
    try {
      const purchasedEvents = parsePurchasedEvent(receipt, '0x0000000000000000000000000000000000000000' as Address)
      const mintedEvents = parseMintedEvent(receipt, '0x0000000000000000000000000000000000000000' as Address)
      
      return [...purchasedEvents, ...mintedEvents]
    } catch (error) {
      console.error('Failed to parse mint events:', error)
      return []
    }
  }, [isSuccess, receipt])

  // Update mint events when parsing completes
  useMemo(() => {
    if (parsedMintEvents.length > 0) {
      setMintEvents(parsedMintEvents)
    }
  }, [parsedMintEvents])

  const mint = useCallback(async (params: ZoraMintParams) => {
    // Create error context
    const errorContext: ZoraErrorContext = {
      operation: 'nft_minting',
      contractAddress: params.collectionAddress,
      tokenId: params.tokenId,
      metadata: {
        quantity: params.quantity.toString(),
        recipient: params.recipient,
        mintReferral: params.mintReferral
      }
    }

    try {
      setError(null)
      
      // Validate parameters
      if (!params.collectionAddress) {
        throw createValidationError(
          'Collection address is required',
          ZORA_ERROR_CODES.INVALID_ADDRESS,
          errorContext
        )
      }

      if (!params.tokenId) {
        throw createValidationError(
          'Token ID is required',
          ZORA_ERROR_CODES.INVALID_PARAMETERS,
          errorContext
        )
      }

      if (!params.quantity || params.quantity <= BigInt(0)) {
        throw createValidationError(
          'Quantity must be greater than 0',
          ZORA_ERROR_CODES.INVALID_PARAMETERS,
          errorContext
        )
      }

      if (!params.recipient) {
        throw createValidationError(
          'Recipient address is required',
          ZORA_ERROR_CODES.INVALID_ADDRESS,
          errorContext
        )
      }
      
      const fixedPriceSaleStrategy = getFixedPriceSaleStrategyContract(chainId)
      
      // Encode minter arguments for fixed price minting
      const minterArguments = encodeAbiParameters(
        parseAbiParameters('address recipient'),
        [params.recipient]
      )
      
      // Prepare rewards recipients array
      const rewardsRecipients: Address[] = []
      if (params.mintReferral) {
        rewardsRecipients.push(params.mintReferral)
      }

      // Execute contract call
      try {
        await writeContract({
          address: params.collectionAddress,
          abi: ZORA_CREATOR_1155_IMPL_ABI,
          functionName: 'mint',
          args: [
            fixedPriceSaleStrategy.address, // minter
            params.tokenId,
            params.quantity,
            rewardsRecipients,
            minterArguments
          ],
          value: parseEther('0.000777') // Standard Zora mint fee
        })
      } catch (contractError) {
        const zoraError = mapWagmiError(contractError, errorContext)
        logZoraError(zoraError)
        setError(zoraError)
        throw zoraError
      }
      
    } catch (error) {
      // Log error for debugging
      logUserError(error, 'NFT Minting')
      
      // Set error state if it's not already set
      if (!error) {
        setError(error instanceof Error ? error : new Error('Unknown minting error'))
      }
      
      // Re-throw the error (it's already a ZoraError if we created it)
      throw error
    }
  }, [writeContract, chainId])

  // Invalidate queries on success
  useMemo(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] })
    }
  }, [isSuccess, queryClient])

  const reset = useCallback(() => {
    setError(null)
    setMintEvents([])
    resetWrite()
  }, [resetWrite])

  return {
    mint,
    isLoading: isPending,
    isConfirming,
    isSuccess,
    error: error || writeError || receiptError,
    hash,
    mintEvents,
    reset
  }
}
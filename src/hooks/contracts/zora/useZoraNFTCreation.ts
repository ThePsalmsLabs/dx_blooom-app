
import { useState, useCallback, useMemo } from 'react'
import { useContractWrite, useWaitForTransactionReceipt } from 'wagmi'
import { type Address, parseEther, encodeAbiParameters, parseAbiParameters } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { ZORA_CREATOR_1155_IMPL_ABI } from '@/lib/contracts/abis/zora'

interface ZoraNFTCreationParams {
  collectionAddress: Address
  tokenURI: string
  maxSupply: bigint
  createReferral?: Address
}

interface ZoraNFTCreationResult {
  createNFT: (params: ZoraNFTCreationParams) => Promise<{ tokenId: bigint }>
  isLoading: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
  hash: string | undefined
  tokenId: bigint | undefined
  reset: () => void
}

export function useZoraNFTCreation(): ZoraNFTCreationResult {
  const [error, setError] = useState<Error | null>(null)
  const [tokenId, setTokenId] = useState<bigint | undefined>()
  const queryClient = useQueryClient()

  const { 
    writeContract, 
    data: hash, 
    isPending, 
    error: writeError,
    reset: resetWrite
  } = useContractWrite()
  
  const { 
    isLoading: isConfirming, 
    isSuccess, 
    error: receiptError,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Extract token ID from receipt
  useMemo(() => {
    if (isSuccess && receipt) {
      // Find UpdatedToken event to get the new token ID
      const updatedTokenEvent = receipt.logs.find(log => {
        try {
          // Look for UpdatedToken event signature
          return log.topics[0] === '0x...' // UpdatedToken event signature
        } catch {
          return false
        }
      })
      
      if (updatedTokenEvent && updatedTokenEvent.topics[2]) {
        // Extract token ID from second indexed parameter
        const extractedTokenId = BigInt(updatedTokenEvent.topics[2])
        setTokenId(extractedTokenId)
      }
      
      queryClient.invalidateQueries({ queryKey: ['readContract'] })
    }
  }, [isSuccess, receipt, queryClient])

  const createNFT = useCallback(async (params: ZoraNFTCreationParams): Promise<{ tokenId: bigint }> => {
    try {
      setError(null)
      
      if (params.createReferral) {
        // Use setupNewTokenWithCreateReferral for referral rewards
        await writeContract({
          address: params.collectionAddress,
          abi: ZORA_CREATOR_1155_IMPL_ABI,
          functionName: 'setupNewTokenWithCreateReferral',
          args: [
            params.tokenURI,
            params.maxSupply,
            params.createReferral
          ]
        })
      } else {
        // Use basic setupNewToken
        await writeContract({
          address: params.collectionAddress,
          abi: ZORA_CREATOR_1155_IMPL_ABI,
          functionName: 'setupNewToken',
          args: [
            params.tokenURI,
            params.maxSupply
          ]
        })
      }

      // Return placeholder - actual tokenId will be set by the effect above
      return { tokenId: BigInt(1) }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('NFT creation failed')
      setError(error)
      throw error
    }
  }, [writeContract])

  const reset = useCallback(() => {
    setError(null)
    setTokenId(undefined)
    resetWrite()
  }, [resetWrite])

  return {
    createNFT,
    isLoading: isPending,
    isConfirming,
    isSuccess,
    error: error || writeError || receiptError,
    hash,
    tokenId,
    reset
  }
}

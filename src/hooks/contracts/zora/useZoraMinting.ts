import { useState, useCallback, useMemo } from 'react'
import { useContractWrite, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { type Address, parseEther, encodeAbiParameters, parseAbiParameters } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { 
  getFixedPriceSaleStrategyContract,
  getZoraCreator1155Contract 
} from '@/lib/contracts/config'
import { 
  ZORA_CREATOR_1155_IMPL_ABI,
  ZORA_FIXED_PRICE_SALE_STRATEGY_ABI 
} from '@/lib/contracts/abis/zora'

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
  reset: () => void
}

export function useZoraMinting(): ZoraMintResult {
  const [error, setError] = useState<Error | null>(null)
  const chainId = useChainId()
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
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash,
  })

  const mint = useCallback(async (params: ZoraMintParams) => {
    try {
      setError(null)
      
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
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Minting failed')
      setError(error)
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
    resetWrite()
  }, [resetWrite])

  return {
    mint,
    isLoading: isPending,
    isConfirming,
    isSuccess,
    error: error || writeError || receiptError,
    hash,
    reset
  }
}
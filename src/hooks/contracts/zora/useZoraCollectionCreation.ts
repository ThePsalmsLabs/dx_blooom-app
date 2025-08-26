import { useState, useCallback, useMemo } from 'react'
import { useContractWrite, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { type Address, encodeAbiParameters, parseAbiParameters } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { 
  getZoraFactoryContract, 
  getFixedPriceSaleStrategyContract 
} from '@/lib/contracts/config'
import { ZORA_CREATOR_1155_FACTORY_ABI } from '@/lib/contracts/abis/zora'

interface ZoraRoyaltyConfig {
  royaltyMintSchedule: number
  royaltyBPS: number        // 500 = 5%
  royaltyRecipient: Address
}

interface ZoraCollectionParams {
  name: string
  description: string
  image?: string
  royaltyConfig: ZoraRoyaltyConfig
  defaultAdmin: Address
  // Optional setup actions (like creating initial tokens)
  setupActions?: string[]
}

interface ZoraCollectionResult {
  createCollection: (params: ZoraCollectionParams) => Promise<void>
  isLoading: boolean
  isConfirming: boolean
  isSuccess: boolean
  error: Error | null
  hash: string | undefined
  contractAddress: Address | undefined
  reset: () => void
}

export function useZoraCollectionCreation(): ZoraCollectionResult {
  const [error, setError] = useState<Error | null>(null)
  const [contractAddress, setContractAddress] = useState<Address | undefined>()
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
    error: receiptError,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Extract contract address from receipt
  useMemo(() => {
    if (isSuccess && receipt) {
      // Find the SetupNewContract event
      const setupEvent = receipt.logs.find(log => {
        try {
          // This is a simplified check - in production you'd decode the event properly
          return log.topics[0] === '0x...' // SetupNewContract event signature
        } catch {
          return false
        }
      })
      
      if (setupEvent && setupEvent.topics[1]) {
        // Extract contract address from event (first indexed parameter)
        const address = `0x${setupEvent.topics[1].slice(26)}` as Address
        setContractAddress(address)
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['readContract'] })
      }
    }
  }, [isSuccess, receipt, queryClient])

  const createCollection = useCallback(async (params: ZoraCollectionParams) => {
    try {
      setError(null)
      
      const factoryContract = getZoraFactoryContract(chainId)
      
      // Create contract URI metadata
      const contractMetadata = {
        name: params.name,
        description: params.description,
        image: params.image || '',
        external_link: '',
        seller_fee_basis_points: params.royaltyConfig.royaltyBPS,
        fee_recipient: params.royaltyConfig.royaltyRecipient
      }
      
      // In production, upload to IPFS
      const contractURI = `data:application/json;base64,${btoa(JSON.stringify(contractMetadata))}`
      
      // Setup actions (empty array for basic collection)
      const setupActions = params.setupActions || []
      
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
          setupActions as `0x${string}`[]
        ]
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Collection creation failed')
      setError(error)
      throw error
    }
  }, [writeContract, chainId])

  const reset = useCallback(() => {
    setError(null)
    setContractAddress(undefined)
    resetWrite()
  }, [resetWrite])

  return {
    createCollection,
    isLoading: isPending,
    isConfirming,
    isSuccess,
    error: error || writeError || receiptError,
    hash,
    contractAddress,
    reset
  }
}
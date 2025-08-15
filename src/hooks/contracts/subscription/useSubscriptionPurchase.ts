import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { useCallback, useState } from 'react'
import { type Address } from 'viem'
import { getContractAddresses } from '@/lib/contracts/config'
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'

interface SubscriptionPurchaseResult {
  subscribe: (creatorAddress: Address) => Promise<void>
  isLoading: boolean
  isConfirmed: boolean
  error: Error | null
  hash: string | undefined
  reset: () => void
}

export function useSubscriptionPurchase(): SubscriptionPurchaseResult {
  const [error, setError] = useState<Error | null>(null)
  const chainId = useChainId()
  
  const writeContract = useWriteContract()
  const waitForTransaction = useWaitForTransactionReceipt({
    hash: writeContract.data,
  })

  const subscribe = useCallback(async (creatorAddress: Address) => {
    try {
      setError(null)
      
      const contractAddresses = getContractAddresses(chainId)
      if (!contractAddresses?.SUBSCRIPTION_MANAGER) {
        throw new Error('Subscription manager contract not found for this network')
      }
      
      await writeContract.writeContractAsync({
        address: contractAddresses.SUBSCRIPTION_MANAGER,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'subscribeToCreator',
        args: [creatorAddress]
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Subscription failed')
      setError(error)
      throw error
    }
  }, [writeContract, chainId])

  const reset = useCallback(() => {
    setError(null)
    writeContract.reset()
  }, [writeContract])

  return {
    subscribe,
    isLoading: writeContract.isPending || waitForTransaction.isLoading,
    isConfirmed: waitForTransaction.isSuccess,
    error: error || writeContract.error || waitForTransaction.error,
    hash: writeContract.data,
    reset
  }
}

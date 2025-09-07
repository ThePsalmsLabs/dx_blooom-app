import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi'
import { useCallback, useState } from 'react'
import { type Address } from 'viem'
import { getContractAddresses } from '@/lib/contracts/config'
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'
import { useWalletConnectionUI } from '@/hooks/ui/integration'

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

  // Use unified wallet state from Privy exclusively
  const walletUI = useWalletConnectionUI()

  const writeContract = useWriteContract()
  const waitForTransaction = useWaitForTransactionReceipt({
    hash: writeContract.data,
  })

  const subscribe = useCallback(async (creatorAddress: Address) => {
    try {
      setError(null)

      // Simple wallet connection check using unified state
      if (!walletUI.isConnected || !walletUI.address) {
        throw new Error('Wallet not connected. Please connect your wallet and try again.')
      }

      const contractAddresses = getContractAddresses(chainId)
      if (!contractAddresses?.SUBSCRIPTION_MANAGER) {
        throw new Error('Subscription manager contract not found for this network')
      }

      console.log('📝 Executing subscription purchase:', {
        creatorAddress,
        contractAddress: contractAddresses.SUBSCRIPTION_MANAGER,
        chainId,
        userAddress: walletUI.address
      })

      await writeContract.writeContractAsync({
        address: contractAddresses.SUBSCRIPTION_MANAGER,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'subscribeToCreator',
        args: [creatorAddress]
      })

      console.log('✅ Subscription purchase completed successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Subscription failed')

      // Improved error handling
      if (error.message.includes('ConnectorNotConnectedError') ||
          error.message.includes('Connector not connected')) {
        setError(new Error('Wallet connection lost. Please reconnect your wallet and try again.'))
      } else if (error.message.includes('User rejected') ||
                 error.message.includes('user rejected')) {
        setError(new Error('Transaction was cancelled.'))
      } else {
        setError(error)
      }

      throw error
    }
  }, [writeContract, chainId, walletUI.isConnected, walletUI.address])

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

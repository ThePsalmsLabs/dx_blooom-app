import { useWriteContract, useWaitForTransactionReceipt, useChainId, useAccount, useConnect } from 'wagmi'
import { useCallback, useState, useEffect } from 'react'
import { type Address } from 'viem'
import { getContractAddresses } from '@/lib/contracts/config'
import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { isMiniAppContext } from '@/lib/utils/miniapp-communication'

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

  // Wallet connection state
  const { isConnected: wagmiConnected, connector: wagmiConnector } = useAccount()
  const { connect: wagmiConnect, connectors } = useConnect()
  const walletUI = useWalletConnectionUI()

  const writeContract = useWriteContract()
  const waitForTransaction = useWaitForTransactionReceipt({
    hash: writeContract.data,
  })

  // Check wallet connection state for mini app context
  const checkWalletConnection = useCallback(async (): Promise<boolean> => {
    // In mini app context, we need to ensure both Privy and wagmi are connected
    if (isMiniAppContext()) {
      // Check Privy connection first
      if (!walletUI.isConnected || !walletUI.address) {
        console.warn('❌ Privy wallet not connected in mini app context')
        return false
      }

      // Check wagmi connection
      if (!wagmiConnected || !wagmiConnector) {
        console.warn('❌ Wagmi connector not connected in mini app context')

        // Try to connect wagmi to match Privy state
        try {
          if (connectors.length > 0) {
            console.log('🔄 Attempting to connect wagmi connector to match Privy state')
            await wagmiConnect({ connector: connectors[0] })
            // Give it a moment to connect
            await new Promise(resolve => setTimeout(resolve, 1000))
            return true
          }
        } catch (connectError) {
          console.error('Failed to connect wagmi connector:', connectError)
          return false
        }
      }

      return true
    }

    // For regular web context, just check wagmi connection
    return wagmiConnected && !!wagmiConnector
  }, [walletUI.isConnected, walletUI.address, wagmiConnected, wagmiConnector, wagmiConnect, connectors, isMiniAppContext])

  const subscribe = useCallback(async (creatorAddress: Address) => {
    try {
      setError(null)

      // Check wallet connection before proceeding
      const isWalletConnected = await checkWalletConnection()
      if (!isWalletConnected) {
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
        connector: wagmiConnector?.name || 'unknown'
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

      // Enhanced error handling for mini app context
      if (isMiniAppContext()) {
        if (error.message.includes('ConnectorNotConnectedError') ||
            error.message.includes('Connector not connected')) {
          setError(new Error('Wallet connection lost. Please reconnect your wallet and try again.'))
        } else {
          setError(error)
        }
      } else {
        setError(error)
      }

      throw error
    }
  }, [writeContract, chainId, checkWalletConnection, wagmiConnector?.name])

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

/**
 * Direct Payment Hook - Simplified V2 Payment for Standard USDC
 * 
 * This hook provides a streamlined payment experience for standard USDC payments
 * without the multi-step intent-based flow. It's designed for better UX with fewer
 * wallet signatures.
 * 
 * Flow:
 * 1. Check/Approve USDC allowance (if needed) - 1 signature
 * 2. Execute direct purchase - 1 signature
 * 
 * Total: 1-2 signatures vs 3-4 with intent-based flow
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useAccount, useChainId, usePublicClient, useReadContract, useWriteContract } from 'wagmi'
import { type Address } from 'viem'
import { toast } from 'sonner'
import { PAY_PER_VIEW_ABI } from '@/lib/contracts/abis/pay-per-view'
import { getContractConfig } from '@/lib/contracts/config'

// USDC ERC20 ABI (minimal for approve and allowance)
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const // USDC on Base

export interface DirectPaymentParams {
  contentId: bigint
  creator: Address
  expectedPrice?: bigint
}

/**
 * Hook for direct USDC content purchases
 * Simplified flow with minimal wallet interactions
 */
export function useDirectPayment() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { writeContract, data: txHash, isPending, error } = useWriteContract()

  // Get contract addresses
  const payPerViewConfig = getContractConfig(chainId, 'PAY_PER_VIEW')
  const payPerViewAddress = payPerViewConfig.address as `0x${string}`

  /**
   * Check USDC allowance
   */
  const useAllowance = (enabled = true) => {
    return useReadContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: userAddress ? [userAddress, payPerViewAddress] : undefined,
      query: {
        enabled: enabled && !!userAddress,
        refetchInterval: 3000 // Refetch every 3 seconds during payment flow
      }
    })
  }

  /**
   * Check USDC balance
   */
  const useBalance = () => {
    return useReadContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: userAddress ? [userAddress] : undefined,
      query: {
        enabled: !!userAddress
      }
    })
  }

  /**
   * Approve USDC spending
   */
  const approve = useMutation({
    retry: false, // Never retry - user rejections should not retry
    mutationFn: async (amount: bigint): Promise<`0x${string}`> => {
      if (!userAddress) throw new Error('Wallet not connected')
      if (!publicClient) throw new Error('Public client not available')

      toast.info('Please approve USDC spending...')

      // Execute approval and wait for the promise to resolve
      return new Promise<`0x${string}`>((resolve, reject) => {
        writeContract(
          {
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [payPerViewAddress, amount]
          },
          {
            onSuccess: async (hash) => {
              try {
                // Wait for confirmation
                await publicClient.waitForTransactionReceipt({
                  hash,
                  confirmations: 1
                })
                toast.success('USDC approved successfully!')
                resolve(hash)
              } catch (error) {
                reject(error)
              }
            },
            onError: (error) => {
              reject(error)
            }
          }
        )
      })
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Approval failed'
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        toast.error('You rejected the approval request')
      } else {
        toast.error(`Approval failed: ${errorMessage}`)
      }
    }
  })

  /**
   * Execute direct purchase
   */
  const purchase = useMutation({
    retry: false, // Never retry - user rejections should not retry
    mutationFn: async (contentId: bigint): Promise<`0x${string}`> => {
      if (!userAddress) throw new Error('Wallet not connected')
      if (!publicClient) throw new Error('Public client not available')

      toast.info('Processing purchase...')

      // Execute direct purchase and wait for the promise to resolve
      return new Promise<`0x${string}`>((resolve, reject) => {
        writeContract(
          {
            address: payPerViewAddress,
            abi: PAY_PER_VIEW_ABI,
            functionName: 'purchaseContentDirect',
            args: [contentId]
          },
          {
            onSuccess: async (hash) => {
              try {
                // Wait for confirmation
                await publicClient.waitForTransactionReceipt({
                  hash,
                  confirmations: 1
                })
                toast.success('Purchase completed successfully!')
                resolve(hash)
              } catch (error) {
                reject(error)
              }
            },
            onError: (error) => {
              reject(error)
            }
          }
        )
      })
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Purchase failed'
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        toast.error('You rejected the purchase request')
      } else {
        toast.error(`Purchase failed: ${errorMessage}`)
      }
    }
  })

  /**
   * Complete direct purchase flow with automatic approval if needed
   */
  const directPurchase = useMutation({
    retry: false, // Never retry - user rejections should not retry
    mutationFn: async ({ contentId, expectedPrice }: DirectPaymentParams): Promise<{
      success: boolean
      transactionHash: `0x${string}`
      contentId: bigint
    }> => {
      if (!userAddress) throw new Error('Wallet not connected')
      if (!publicClient) throw new Error('Public client not available')

      try {
        const price = expectedPrice || BigInt(1000000) // Default 1 USDC if not provided

        // Check balance
        const balance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        })

        if (balance < price) {
          throw new Error(`Insufficient USDC balance. You need ${(Number(price) / 1e6).toFixed(2)} USDC.`)
        }

        // Check allowance
        const allowance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [userAddress, payPerViewAddress]
        })

        // Approve if needed
        if (allowance < price) {
          toast.info('Approval required for USDC spending')
          try {
            await approve.mutateAsync(price * BigInt(10)) // Approve 10x for future purchases
          } catch (approvalError) {
            // Handle user rejection specifically
            const errorMsg = approvalError instanceof Error ? approvalError.message : String(approvalError)
            if (errorMsg.includes('User rejected') || errorMsg.includes('User denied') || errorMsg.includes('denied transaction')) {
              throw new Error('APPROVAL_CANCELLED')
            }
            throw approvalError
          }
        }

        // Execute purchase
        let purchaseHash: `0x${string}`
        try {
          purchaseHash = await purchase.mutateAsync(contentId)
        } catch (purchaseError) {
          // Handle user rejection specifically
          const errorMsg = purchaseError instanceof Error ? purchaseError.message : String(purchaseError)
          if (errorMsg.includes('User rejected') || errorMsg.includes('User denied') || errorMsg.includes('denied transaction')) {
            throw new Error('PURCHASE_CANCELLED')
          }
          throw purchaseError
        }

        return {
          success: true,
          transactionHash: purchaseHash,
          contentId
        }
      } catch (error) {
        console.error('Direct purchase failed:', error)
        
        // Re-throw with clean error messages for specific cases
        const errorMsg = error instanceof Error ? error.message : String(error)
        
        if (errorMsg === 'APPROVAL_CANCELLED') {
          throw new Error('You cancelled the USDC approval. No charges were made.')
        }
        
        if (errorMsg === 'PURCHASE_CANCELLED') {
          throw new Error('You cancelled the purchase transaction. Your USDC approval is still active for future purchases.')
        }
        
        if (errorMsg.includes('User rejected') || errorMsg.includes('User denied') || errorMsg.includes('denied transaction')) {
          throw new Error('Transaction cancelled. No charges were made.')
        }
        
        if (errorMsg.includes('insufficient funds') || errorMsg.includes('Insufficient')) {
          throw new Error('Insufficient funds. Please check your balance and try again.')
        }
        
        // For other errors, throw the original
        throw error
      }
    },
    onSuccess: (result) => {
      toast.success('🎉 Content purchased successfully!')
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Purchase failed'
      
      // Only log to console, don't show technical errors in toast
      console.error('Direct purchase error:', errorMessage)
      
      // Don't show toast here - let the modal handle it
      // The modal will display the user-friendly error message
    }
  })

  return {
    // Main purchase function
    directPurchase,

    // Individual step functions
    approve,
    purchase,

    // Query hooks
    useAllowance,
    useBalance,

    // State
    isPending: approve.isPending || purchase.isPending || directPurchase.isPending,
    error: approve.error || purchase.error || directPurchase.error,
    txHash,

    // Utils
    userAddress,
    payPerViewAddress,
    usdcAddress: USDC_ADDRESS
  }
}

export default useDirectPayment


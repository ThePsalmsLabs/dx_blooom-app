/**
 * Commerce Protocol Core Hook - V2 Payment System
 * 
 * This hook provides a complete interface to the CommerceProtocolCore contract
 * which is the heart of the v2 payment system with enhanced functionality.
 */

import { useMutation } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useSimulateContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { type Address } from 'viem'
import { COMMERCE_PROTOCOL_CORE_ABI } from '@/lib/contracts/abis/v2ABIs'

// Explicit contract typing to work around wagmi's complex type inference
type ContractConfig = {
  address: `0x${string}`
  abi: typeof COMMERCE_PROTOCOL_CORE_ABI
}

// Types for v2 payment system - matching ABI exactly
export interface PlatformPaymentRequest {
  paymentType: number // enum ISharedTypes.PaymentType (uint8)
  creator: `0x${string}` // address
  contentId: bigint // uint256
  paymentToken: `0x${string}` // address
  maxSlippage: bigint // uint256
  deadline: bigint // uint256
}

export interface PaymentContext {
  paymentType: 0 | 1 | 2 | 3
  user: Address
  creator: Address
  contentId: bigint
  platformFee: bigint
  creatorAmount: bigint
  operatorFee: bigint
  timestamp: bigint
  processed: boolean
  paymentToken: Address
  expectedAmount: bigint
  intentId: `0x${string}`
}

export interface PaymentInfo {
  totalAmount: bigint
  creatorAmount: bigint
  platformFee: bigint
  operatorFee: bigint
  expectedAmount: bigint
}

/**
 * Hook for CommerceProtocolCore contract interactions
 */
export function useCommerceProtocolCore() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'COMMERCE_PROTOCOL_CORE')
  
  // Create a properly typed contract config
  const contract: ContractConfig = {
    address: contractConfig.address as `0x${string}`,
    abi: COMMERCE_PROTOCOL_CORE_ABI
  }
  
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ CORE PAYMENT FUNCTIONS ============

  /**
   * Simulate payment intent creation to get return values
   */
  const useSimulateCreatePaymentIntent = (request: PlatformPaymentRequest | undefined) => {
    return useSimulateContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'createPaymentIntent',
      args: request ? [request] : undefined,
      query: {
        enabled: !!request && !!userAddress
      }
    } as Parameters<typeof useSimulateContract>[0])
  }

  /**
   * Create a payment intent - First step in v2 payment flow
   * This only executes the transaction, use useSimulateCreatePaymentIntent to get return values
   */
  const createPaymentIntent = useMutation({
    mutationFn: async (request: PlatformPaymentRequest) => {
      if (!userAddress) throw new Error('User not connected')
      
      return writeContract({
        address: contract.address,
        abi: contract.abi,
        functionName: 'createPaymentIntent',
        args: [request]
      } as Parameters<typeof writeContract>[0])
    },
    onSuccess: (hash) => {
      console.log('Payment intent created:', hash)
    },
    onError: (error) => {
      console.error('Failed to create payment intent:', error)
    }
  })

  /**
   * Execute payment with signature - Second step after signature is provided
   */
  const executePaymentWithSignature = useMutation({
    mutationFn: async (intentId: `0x${string}`) => {
      if (!userAddress) throw new Error('User not connected')
      
      return writeContract({
        ...contract,
        functionName: 'executePaymentWithSignature',
        args: [intentId]
      })
    },
    onSuccess: (hash) => {
      console.log('Payment executed:', hash)
    },
    onError: (error) => {
      console.error('Failed to execute payment:', error)
    }
  })

  /**
   * Get payment information for a request (for UI display)
   */
  const useGetPaymentInfo = (request: PlatformPaymentRequest | undefined) => {
    return useReadContract({
      address: contract.address,
      abi: contract.abi,
      functionName: 'getPaymentInfo',
      args: request ? [request] : undefined,
      query: {
        enabled: !!request
      }
    } as Parameters<typeof useReadContract>[0])
  }

  /**
   * Provide signature for an intent
   */
  const provideIntentSignature = useMutation({
    mutationFn: async ({ intentId, signature }: { intentId: `0x${string}`, signature: `0x${string}` }) => {
      if (!userAddress) throw new Error('User not connected')
      
      return writeContract({
        ...contract,
        functionName: 'provideIntentSignature',
        args: [intentId, signature]
      })
    }
  })

  // ============ REFUND FUNCTIONS ============

  /**
   * Request a refund for a processed payment
   */
  const requestRefund = useMutation({
    mutationFn: async ({ intentId, reason }: { intentId: `0x${string}`, reason: string }) => {
      if (!userAddress) throw new Error('User not connected')
      
      return writeContract({
        ...contract,
        functionName: 'requestRefund',
        args: [intentId, reason]
      })
    }
  })

  // ============ VIEW FUNCTIONS ============

  /**
   * Check if an intent has an active signature and is ready for execution
   */
  const useIntentReadyForExecution = (intentId: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'intentReadyForExecution',
      args: intentId ? [intentId] : undefined,
      query: {
        enabled: !!intentId,
        refetchInterval: 5000 // Check every 5 seconds
      }
    })
  }

  /**
   * Check if an intent has a signature
   */
  const useHasSignature = (intentId: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'hasSignature',
      args: intentId ? [intentId] : undefined,
      query: {
        enabled: !!intentId
      }
    })
  }

  /**
   * Get signature for an intent
   */
  const useIntentSignature = (intentId: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getIntentSignature',
      args: intentId ? [intentId] : undefined,
      query: {
        enabled: !!intentId
      }
    })
  }

  /**
   * Get contract version (useful for debugging)
   */
  /**
   * Get payment context for an intent ID
   */
  const useGetPaymentContext = (intentId: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getPaymentContext',
      args: intentId ? [intentId] : undefined,
      query: {
        enabled: !!intentId,
        staleTime: 15000 // 15 seconds
      }
    })
  }

  const useContractVersion = () => {
    return useReadContract({
      ...contract,
      functionName: 'getContractVersion',
      query: {
        staleTime: Infinity // Version doesn't change
      }
    })
  }

  return {
    // Write functions
    createPaymentIntent,
    executePaymentWithSignature,
    provideIntentSignature,
    requestRefund,
    
    // Read hooks
    useGetPaymentInfo,
    useGetPaymentContext,
    useIntentReadyForExecution,
    useHasSignature,
    useIntentSignature,
    useContractVersion,
    
    // Simulation hooks
    useSimulateCreatePaymentIntent,
    
    // Transaction state
    hash,
    isPending,
    error,
    
    // Contract info
    contractAddress: contract.address,
    chainId
  }
}

/**
 * Helper hook for common payment scenarios
 */
export function useV2PaymentFlow() {
  const {
    createPaymentIntent,
    executePaymentWithSignature
  } = useCommerceProtocolCore()

  /**
   * Complete payment flow - creates intent and waits for signature
   */
  const processPayment = useMutation({
    mutationFn: async (request: PlatformPaymentRequest) => {
      // Step 1: Create payment intent
      const intentResult = await createPaymentIntent.mutateAsync(request)
      
      // In a real implementation, you'd extract the intentId from the transaction receipt
      // and then wait for signature to be provided off-chain
      
      return intentResult
    }
  })

  return {
    processPayment,
    createPaymentIntent,
    executePaymentWithSignature
  }
}
/**
 * Commerce Protocol Core Hook - V2 Payment System
 * 
 * This hook provides a complete interface to the CommerceProtocolCore contract
 * which is the heart of the v2 payment system with enhanced functionality.
 */

import { useMutation } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { type Address } from 'viem'
import { COMMERCE_PROTOCOL_CORE_ABI } from '@/lib/contracts/abis/v2ABIs'

// Types for v2 payment system
export interface PlatformPaymentRequest {
  paymentType: 0 | 1 | 2 | 3 // PayPerView | Subscription | Tip | Donation
  creator: Address
  contentId: bigint
  paymentToken: Address
  maxSlippage: bigint
  deadline: bigint
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
  const contract = {
    address: contractConfig.address,
    abi: COMMERCE_PROTOCOL_CORE_ABI
  } as const
  
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ CORE PAYMENT FUNCTIONS ============

  /**
   * Create a payment intent - First step in v2 payment flow
   */
  const createPaymentIntent = useMutation({
    mutationFn: async (request: PlatformPaymentRequest) => {
      if (!userAddress) throw new Error('User not connected')
      
      return writeContract({
        ...contract,
        functionName: 'createPaymentIntent',
        args: [request]
      })
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
      ...contract,
      functionName: 'getPaymentInfo',
      args: request ? [request] : undefined,
      query: {
        enabled: !!request
      }
    })
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
    useIntentReadyForExecution,
    useHasSignature,
    useIntentSignature,
    useContractVersion,
    
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
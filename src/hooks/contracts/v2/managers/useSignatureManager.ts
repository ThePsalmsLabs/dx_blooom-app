/**
 * Signature Manager Hook - V2 EIP-712 Signature Handling
 * 
 * Handles signature creation, verification, and management for payment intents
 * using the modular SignatureManager contract from v2 architecture.
 */

import { useMutation } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId, useSignTypedData } from 'wagmi'
import { getContractConfig } from '../../../../lib/contracts/config'
import { SIGNATURE_MANAGER_ABI } from '../../../../lib/contracts/abis/v2ABIs/SignatureManager'
import { type Address } from 'viem'

// EIP-712 types for payment intent signatures
export const PAYMENT_INTENT_TYPES = {
  PaymentIntent: [
    { name: 'intentId', type: 'bytes16' },
    { name: 'user', type: 'address' },
    { name: 'creator', type: 'address' },
    { name: 'paymentType', type: 'uint8' },
    { name: 'contentId', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
    { name: 'paymentToken', type: 'address' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' }
  ]
}

export interface PaymentIntentData {
  intentId: `0x${string}`
  user: Address
  creator: Address
  paymentType: 0 | 1 | 2 | 3
  contentId: bigint
  amount: bigint
  paymentToken: Address
  deadline: bigint
  nonce: bigint
}

/**
 * Hook for SignatureManager contract interactions
 */
export function useSignatureManager() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'SIGNATURE_MANAGER')
  const contract = {
    address: contractConfig.address,
    abi: SIGNATURE_MANAGER_ABI
  } as const
  
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { signTypedDataAsync } = useSignTypedData()

  // ============ SIGNATURE CREATION ============

  /**
   * Create EIP-712 signature for payment intent
   */
  const createPaymentIntentSignature = useMutation({
    mutationFn: async (intentData: PaymentIntentData) => {
      if (!userAddress) throw new Error('User not connected')
      
      const domain = {
        name: 'CommerceProtocolCore',
        version: '2.0.0',
        chainId: chainId,
        verifyingContract: contract.address
      }
      
      try {
        // Use the EIP-712 typed data signing
        const signature = await signTypedDataAsync({
          account: userAddress,
          domain,
          types: PAYMENT_INTENT_TYPES,
          primaryType: 'PaymentIntent',
          message: {
            intentId: intentData.intentId,
            user: intentData.user,
            creator: intentData.creator,
            paymentType: intentData.paymentType,
            contentId: intentData.contentId.toString(),
            amount: intentData.amount.toString(),
            paymentToken: intentData.paymentToken,
            deadline: intentData.deadline.toString(),
            nonce: intentData.nonce.toString()
          }
        })
        
        return signature
      } catch (error) {
        throw new Error(`Failed to create signature: ${(error as Error).message}`)
      }
    }
  })

  /**
   * Provide signature to the contract for an intent
   */
  const provideIntentSignature = useMutation({
    mutationFn: async ({ 
      intentId, 
      signature,
      signer
    }: { 
      intentId: `0x${string}`
      signature: `0x${string}`
      signer: Address
    }) => {
      return writeContract({
        ...contract,
        functionName: 'provideIntentSignature',
        args: [intentId, signature, signer]
      })
    }
  })

  /**
   * Add authorized signer (admin function)
   */
  const addAuthorizedSigner = useMutation({
    mutationFn: async (signer: Address) => {
      return writeContract({
        ...contract,
        functionName: 'addAuthorizedSigner',
        args: [signer]
      })
    }
  })

  /**
   * Remove authorized signer (admin function)
   */
  const removeAuthorizedSigner = useMutation({
    mutationFn: async (signer: Address) => {
      return writeContract({
        ...contract,
        functionName: 'removeAuthorizedSigner',
        args: [signer]
      })
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Check if an intent has a signature
   */
  const useHasSignature = (intentId: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'hasSignature',
      args: intentId ? [intentId] : undefined,
      query: {
        enabled: !!intentId,
        refetchInterval: 3000 // Check every 3 seconds for signature updates
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
   * Get intent hash (for verification)
   */
  const useIntentHash = (intentId: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'intentHashes',
      args: intentId ? [intentId] : undefined,
      query: {
        enabled: !!intentId
      }
    })
  }

  /**
   * Check if address is authorized signer
   */
  const useIsAuthorizedSigner = (signer: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'isAuthorizedSigner',
      args: signer ? [signer] : undefined,
      query: {
        enabled: !!signer,
        staleTime: 300000 // 5 minutes - signer status doesn't change often
      }
    })
  }

  /**
   * Get user's current nonce - Not available in current ABI
   * This would need to be implemented in the contract or retrieved from elsewhere
   */
  const useUserNonce = (user: Address | undefined) => {
    // Return a mock implementation for now
    return {
      data: BigInt(0),
      isLoading: false,
      error: null
    }
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Wait for signature to be provided for an intent
   */
  const waitForSignature = useMutation({
    mutationFn: async (intentId: `0x${string}`) => {
      const maxAttempts = 60 // Wait up to 3 minutes
      let attempts = 0
      
      while (attempts < maxAttempts) {
        // In practice, you'd check the contract state here
        // For now, simulate waiting
        await new Promise(resolve => setTimeout(resolve, 3000))
        attempts++
        
        // This would actually check the contract
        // return { hasSignature: true, signature: '0x...' }
      }
      
      throw new Error('Signature timeout')
    }
  })

  /**
   * Complete signature workflow for payment intent
   */
  const signAndProvideIntent = useMutation({
    mutationFn: async (intentData: PaymentIntentData) => {
      if (!userAddress) throw new Error('User not connected')
      
      // Step 1: Create signature
      const signature = await createPaymentIntentSignature.mutateAsync(intentData)
      
      // Step 2: Provide signature to contract
      const result = await provideIntentSignature.mutateAsync({
        intentId: intentData.intentId,
        signature: signature as `0x${string}`,
        signer: userAddress
      })
      
      return { signature, transactionHash: result }
    }
  })

  return {
    // Write functions
    createPaymentIntentSignature,
    provideIntentSignature,
    addAuthorizedSigner,
    removeAuthorizedSigner,
    
    // Utility functions
    waitForSignature,
    signAndProvideIntent,
    
    // Read hooks
    useHasSignature,
    useIntentSignature,
    useIntentHash,
    useIsAuthorizedSigner,
    useUserNonce,
    
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
 * Convenience hook for signature status tracking
 */
export function useSignatureStatus(intentId: `0x${string}` | undefined) {
  const { useHasSignature, useIntentSignature } = useSignatureManager()
  
  const hasSignature = useHasSignature(intentId)
  const signature = useIntentSignature(intentId)
  
  return {
    hasSignature: hasSignature.data,
    signature: signature.data,
    isLoading: hasSignature.isLoading || signature.isLoading,
    error: hasSignature.error || signature.error,
    isReady: hasSignature.data === true
  }
}
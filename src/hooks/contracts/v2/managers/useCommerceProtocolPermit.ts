/**
 * Commerce Protocol Permit Hook - Enhanced V2 Gasless Payments
 * 
 * Advanced permit-based payment system with enhanced security, batch operations,
 * and flexible payment context management. This hook provides enterprise-level
 * gasless payment capabilities with full permit validation and context tracking.
 */

import { useMutation } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '../../../../lib/contracts/config'
import { COMMERCE_PROTOCOL_PERMIT_ABI } from '../../../../lib/contracts/abis/v2ABIs/CommerceProtocolPermit'
import { type Address } from 'viem'

// Enhanced Permit Data Structure (matches ABI)
export interface EnhancedPermit2Data {
  readonly permit: {
    readonly permitted: {
      readonly token: Address
      readonly amount: bigint
    }
    readonly nonce: bigint
    readonly deadline: bigint
  }
  readonly transferDetails: {
    readonly to: Address
    readonly requestedAmount: bigint
  }
  readonly signature: `0x${string}`
}

// Platform Payment Request (matches ABI)
export interface PlatformPaymentRequest {
  paymentType: number // 0 = PayPerView, 1 = Subscription, etc.
  creator: Address
  contentId: bigint
  paymentToken: Address
  maxSlippage: bigint
  deadline: bigint
}

// Payment Context (matches ABI return type)
export interface PaymentContext {
  paymentType: number
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

// Permit Payment Status (matches ABI return type)
export interface PermitPaymentStatus {
  exists: boolean
  processed: boolean
  expired: boolean
  hasSignature: boolean
  deadline: bigint
  paymentToken: Address
  expectedAmount: bigint
}

// Operator Metrics (matches ABI return type)
export interface OperatorMetrics {
  intentsCreated: bigint
  paymentsProcessed: bigint
  operatorFees: bigint
  refunds: bigint
}

/**
 * Enhanced Commerce Protocol Permit Hook
 * 
 * Provides comprehensive permit-based payment capabilities
 */
export function useCommerceProtocolPermit() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'COMMERCE_PROTOCOL_PERMIT')
  const contract = {
    address: contractConfig.address,
    abi: COMMERCE_PROTOCOL_PERMIT_ABI
  } as const

  const { writeContract } = useWriteContract()

  /**
   * Get Payment Context
   * Retrieves full payment context for an intent
   */
  const usePaymentContext = (intentId: `0x${string}` | null) => {
    return useReadContract({
      ...contract,
      functionName: 'getPaymentContext',
      args: intentId ? [intentId] : undefined,
      query: {
        enabled: !!intentId
      }
    }) as { data: PaymentContext | undefined; isLoading: boolean; error: Error | null }
  }

  /**
   * Get Permit Payment Status
   * Comprehensive status check for permit payments
   */
  const usePermitPaymentStatus = (intentId: `0x${string}` | null) => {
    return useReadContract({
      ...contract,
      functionName: 'getPermitPaymentStatus',
      args: intentId ? [intentId] : undefined,
      query: {
        enabled: !!intentId
      }
    }) as { data: PermitPaymentStatus | undefined; isLoading: boolean; error: Error | null }
  }

  /**
   * Get User Permit Nonce
   * Required for permit signature generation
   */
  const usePermitNonce = (userAddr: Address | null = userAddress || null) => {
    return useReadContract({
      ...contract,
      functionName: 'getPermitNonce',
      args: userAddr ? [userAddr] : undefined,
      query: {
        enabled: !!userAddr
      }
    }) as { data: bigint | undefined; isLoading: boolean; error: Error | null }
  }

  /**
   * Get Permit Domain Separator
   * Required for EIP-712 signature generation
   */
  const usePermitDomainSeparator = () => {
    return useReadContract({
      ...contract,
      functionName: 'getPermitDomainSeparator',
      query: {
        staleTime: 1000 * 60 * 60 // 1 hour cache
      }
    }) as { data: `0x${string}` | undefined; isLoading: boolean; error: Error | null }
  }

  /**
   * Get Operator Metrics
   * Business intelligence for platform operators
   */
  const useOperatorMetrics = () => {
    return useReadContract({
      ...contract,
      functionName: 'getOperatorMetrics',
      query: {
        refetchInterval: 30000 // Refresh every 30 seconds
      }
    }) as { data: OperatorMetrics | undefined; isLoading: boolean; error: Error | null }
  }

  /**
   * Create Enhanced Permit Intent
   * Step 1: Create payment intent and get context
   */
  const createPermitIntent = useMutation({
    mutationFn: async (request: PlatformPaymentRequest) => {
      if (!userAddress) throw new Error('User not connected')

      const result = await writeContract({
        ...contract,
        functionName: 'createPermitIntent',
        args: [request]
      } as Parameters<typeof writeContract>[0])

      return result as unknown as {
        intentId: `0x${string}`
        context: PaymentContext
      }
    },
    onSuccess: (data) => {
      console.log('Enhanced permit intent created:', data.intentId)
    },
    onError: (error) => {
      console.error('Failed to create permit intent:', error)
    }
  })

  /**
   * Execute Enhanced Permit Payment
   * Step 2: Execute payment with permit data
   */
  const executePaymentWithPermit = useMutation({
    mutationFn: async (params: {
      intentId: `0x${string}`
      permitData: EnhancedPermit2Data
    }) => {
      if (!userAddress) throw new Error('User not connected')

      const result = await writeContract({
        ...contract,
        functionName: 'executePaymentWithPermit',
        args: [params.intentId, params.permitData]
      } as Parameters<typeof writeContract>[0])

      return result as unknown as boolean
    },
    onSuccess: (success, variables) => {
      console.log('Enhanced permit payment executed:', {
        success,
        intentId: variables.intentId
      })
    },
    onError: (error) => {
      console.error('Enhanced permit payment failed:', error)
    }
  })

  /**
   * Create and Execute in One Transaction
   * Step 1+2 Combined: Most efficient for simple flows
   */
  const createAndExecuteWithPermit = useMutation({
    mutationFn: async (params: {
      request: PlatformPaymentRequest
      permitData: EnhancedPermit2Data
    }) => {
      if (!userAddress) throw new Error('User not connected')

      const result = await writeContract({
        ...contract,
        functionName: 'createAndExecuteWithPermit',
        args: [params.request, params.permitData]
      } as Parameters<typeof writeContract>[0])

      return result as unknown as {
        intentId: `0x${string}`
        success: boolean
      }
    },
    onSuccess: (data) => {
      console.log('Enhanced permit payment completed:', data)
    },
    onError: (error) => {
      console.error('Enhanced permit payment failed:', error)
    }
  })

  /**
   * Batch Execute Multiple Permits
   * Enterprise feature for processing multiple payments
   */
  const batchExecuteWithPermit = useMutation({
    mutationFn: async (params: {
      intentIds: `0x${string}`[]
      permitDataArray: EnhancedPermit2Data[]
    }) => {
      if (!userAddress) throw new Error('User not connected')
      if (params.intentIds.length !== params.permitDataArray.length) {
        throw new Error('Intent IDs and permit data arrays must have same length')
      }

      const result = await writeContract({
        ...contract,
        functionName: 'batchExecuteWithPermit',
        args: [params.intentIds, params.permitDataArray]
      } as Parameters<typeof writeContract>[0])

      return result as unknown as boolean[]
    },
    onSuccess: (results) => {
      console.log('Batch permit payments executed:', {
        total: results.length,
        successful: results.filter(r => r).length,
        failed: results.filter(r => !r).length
      })
    },
    onError: (error) => {
      console.error('Batch permit payments failed:', error)
    }
  })

  /**
   * Validate Permit Data
   * Check if permit can be executed
   */
  const useCanExecuteWithPermit = (params: {
    intentId: `0x${string}` | null
    permitData: EnhancedPermit2Data | null
  }) => {
    return useReadContract({
      ...contract,
      functionName: 'canExecuteWithPermit',
      args: params.intentId && params.permitData ? [params.intentId, params.permitData] : undefined,
      query: {
        enabled: !!(params.intentId && params.permitData)
      }
    }) as { data: { canExecute: boolean; reason: string } | undefined; isLoading: boolean; error: Error | null }
  }

  return {
    // Core Operations
    createPermitIntent,
    executePaymentWithPermit,
    createAndExecuteWithPermit,
    batchExecuteWithPermit,
    
    // Validation
    useCanExecuteWithPermit,
    
    // State & Context Hooks
    usePaymentContext,
    usePermitPaymentStatus,
    usePermitNonce,
    usePermitDomainSeparator,
    
    // Analytics
    useOperatorMetrics,
    
    // Contract Info
    contractAddress: contract.address,
    chainId
  }
}

export default useCommerceProtocolPermit
/**
 * View Manager Hook - V2 Read-Only Operations
 *
 * Provides read-only access to contract data, metrics, operator status,
 * and validation functions using the modular ViewManager contract
 * from v2 architecture.
 */

import { useQuery } from '@tanstack/react-query'
import { useReadContract, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { VIEW_MANAGER_ABI } from '@/lib/contracts/abis/v2ABIs/ViewManager'
import { type Address } from 'viem'

export interface OperatorMetrics {
  intentsCreated: bigint
  paymentsProcessed: bigint
  operatorFees: bigint
  refunds: bigint
}

export interface OperatorStatus {
  registered: boolean
  feeDestination: Address
}

export interface PaymentValidationResult {
  isValid: boolean
}

/**
 * Hook for ViewManager contract interactions
 */
export function useViewManager() {
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'VIEW_MANAGER')
  const contract = {
    address: contractConfig.address,
    abi: VIEW_MANAGER_ABI
  } as const

  // ============ OPERATOR METRICS ============

  /**
   * Get operator metrics (intents created, payments processed, etc.)
   */
  const useOperatorMetrics = () => {
    return useReadContract({
      ...contract,
      functionName: 'getOperatorMetrics',
      query: {
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get operator registration status
   */
  const useOperatorStatus = () => {
    return useReadContract({
      ...contract,
      functionName: 'getOperatorStatus',
      query: {
        staleTime: 60000 // 1 minute
      }
    })
  }

  // ============ VALIDATION FUNCTIONS ============

  /**
   * Get payment type name from enum value
   */
  const usePaymentTypeName = (paymentType: 0 | 1 | 2 | 3 | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getPaymentTypeName',
      args: paymentType !== undefined ? [paymentType] : undefined,
      query: {
        enabled: paymentType !== undefined,
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Validate payment type
   */
  const useValidatePaymentType = (paymentType: 0 | 1 | 2 | 3 | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'validatePaymentType',
      args: paymentType !== undefined ? [paymentType] : undefined,
      query: {
        enabled: paymentType !== undefined,
        staleTime: Infinity // Never changes
      }
    })
  }

  // ============ PERMIT UTILITIES ============

  /**
   * Get permit domain separator for a permit2 contract
   */
  const usePermitDomainSeparator = (permit2: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getPermitDomainSeparator',
      args: permit2 ? [permit2] : undefined,
      query: {
        enabled: !!permit2,
        staleTime: 300000 // 5 minutes
      }
    })
  }

  /**
   * Get permit nonce for user from permit2 contract
   */
  const usePermitNonce = (permit2: Address | undefined, user: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getPermitNonce',
      args: permit2 && user ? [permit2, user] : undefined,
      query: {
        enabled: !!permit2 && !!user,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  // ============ CONTRACT REFERENCES ============

  /**
   * Get base commerce integration contract address
   */
  const useBaseCommerceIntegration = () => {
    return useReadContract({
      ...contract,
      functionName: 'baseCommerceIntegration',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Get comprehensive platform metrics
   */
  const usePlatformMetrics = () => {
    const operatorMetrics = useOperatorMetrics()

    return {
      metrics: operatorMetrics.data,
      isLoading: operatorMetrics.isLoading,
      error: operatorMetrics.error
    }
  }

  /**
   * Get operator information
   */
  const useOperatorInfo = () => {
    const operatorStatus = useOperatorStatus()
    const operatorMetrics = useOperatorMetrics()

    return {
      status: operatorStatus.data,
      metrics: operatorMetrics.data,
      isLoading: operatorStatus.isLoading || operatorMetrics.isLoading,
      error: operatorStatus.error || operatorMetrics.error
    }
  }

  /**
   * Validate multiple payment types at once
   */
  const useBatchPaymentTypeValidation = (paymentTypes: (0 | 1 | 2 | 3)[]) => {
    return useQuery({
      queryKey: ['batchPaymentTypeValidation', paymentTypes],
      queryFn: async () => {
        if (paymentTypes.length === 0) return []

        const results = await Promise.all(
          paymentTypes.map(type => {
            // This would use multicall in practice
            // For now, return mock validation
            return { paymentType: type, isValid: true }
          })
        )

        return results
      },
      enabled: paymentTypes.length > 0,
      staleTime: Infinity // Never changes
    })
  }

  /**
   * Get payment type information
   */
  const usePaymentTypeInfo = (paymentType: 0 | 1 | 2 | 3 | undefined) => {
    const name = usePaymentTypeName(paymentType)
    const validation = useValidatePaymentType(paymentType)

    return {
      name: name.data,
      isValid: validation.data,
      paymentType,
      isLoading: name.isLoading || validation.isLoading,
      error: name.error || validation.error
    }
  }

  /**
   * Get system health status
   */
  const useSystemHealth = () => {
    const operatorStatus = useOperatorStatus()
    const operatorMetrics = useOperatorMetrics()
    const baseCommerceIntegration = useBaseCommerceIntegration()

    const isHealthy = operatorStatus.data?.[0] &&
      baseCommerceIntegration.data &&
      operatorMetrics.data !== undefined

    return {
      isHealthy,
      operatorRegistered: operatorStatus.data?.[0],
      hasBaseIntegration: !!baseCommerceIntegration.data,
      hasMetrics: operatorMetrics.data !== undefined,
      isLoading: operatorStatus.isLoading || operatorMetrics.isLoading || baseCommerceIntegration.isLoading,
      error: operatorStatus.error || operatorMetrics.error || baseCommerceIntegration.error
    }
  }

  return {
    // Read hooks
    useOperatorMetrics,
    useOperatorStatus,
    usePaymentTypeName,
    useValidatePaymentType,
    usePermitDomainSeparator,
    usePermitNonce,
    useBaseCommerceIntegration,

    // Utility functions
    usePlatformMetrics,
    useOperatorInfo,
    useBatchPaymentTypeValidation,
    usePaymentTypeInfo,
    useSystemHealth,

    // Contract info
    contractAddress: contract.address,
    chainId
  }
}

/**
 * Convenience hook for dashboard metrics
 */
export function useDashboardMetrics() {
  const { usePlatformMetrics, useOperatorInfo, useSystemHealth } = useViewManager()

  const platformMetrics = usePlatformMetrics()
  const operatorInfo = useOperatorInfo()
  const systemHealth = useSystemHealth()

  return {
    platform: platformMetrics.metrics,
    operator: operatorInfo,
    health: systemHealth,
    isLoading: platformMetrics.isLoading || operatorInfo.isLoading || systemHealth.isLoading,
    error: platformMetrics.error || operatorInfo.error || systemHealth.error
  }
}

/**
 * Convenience hook for payment validation
 */
export function usePaymentValidation() {
  const { usePaymentTypeInfo, useBatchPaymentTypeValidation } = useViewManager()

  const validatePaymentType = (paymentType: 0 | 1 | 2 | 3) => {
    return usePaymentTypeInfo(paymentType)
  }

  const validatePaymentTypes = (paymentTypes: (0 | 1 | 2 | 3)[]) => {
    return useBatchPaymentTypeValidation(paymentTypes)
  }

  return {
    validatePaymentType,
    validatePaymentTypes
  }
}

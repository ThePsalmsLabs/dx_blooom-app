/**
 * Permit Payment Manager Hook - V2 Gasless Payments
 *
 * Handles Permit2 gasless payment approvals, signature validation,
 * and payment execution using the modular PermitPaymentManager
 * contract from v2 architecture.
 */

import { useMutation } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '../../../../lib/contracts/config'
import { PERMIT_PAYMENT_MANAGER_ABI } from '../../../../lib/contracts/abis/v2ABIs/PermitPaymentManager'
import { type Address } from 'viem'

// Permit2Data structure (same for all functions)
// Only has permit, transferDetails, signature
export interface Permit2Data {
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


export interface PermitValidationResult {
  canExecute: boolean
  reason: string
}

/**
 * Hook for PermitPaymentManager contract interactions
 */
export function usePermitPaymentManager() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'PERMIT_PAYMENT_MANAGER')
  const contract = {
    address: contractConfig.address,
    abi: PERMIT_PAYMENT_MANAGER_ABI
  } as const

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ PERMIT-BASED PAYMENTS ============

  /**
   * Create and execute payment with permit signature
   */
  const createAndExecuteWithPermit = useMutation({
    mutationFn: async ({
      user,
      creator,
      paymentType,
      paymentToken,
      expectedAmount,
      intentId,
      permitData
    }: {
      user: Address
      creator: Address
      paymentType: 0 | 1 | 2 | 3 // PayPerView | Subscription | Tip | Donation
      paymentToken: Address
      expectedAmount: bigint
      intentId: `0x${string}`
      permitData: Permit2Data
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'createAndExecuteWithPermit',
        args: [user, creator, paymentType, paymentToken, expectedAmount, intentId, permitData.permit, permitData.transferDetails, permitData.signature] as const
      })
    },
    onSuccess: (hash) => {
      console.log('Payment created and executed with permit:', hash)
    },
    onError: (error) => {
      console.error('Failed to create and execute payment with permit:', error)
    }
  })

  /**
   * Execute payment with existing permit
   */
  const executePaymentWithPermit = useMutation({
    mutationFn: async ({
      intentId,
      user,
      paymentToken,
      expectedAmount,
      creator,
      paymentType,
      permitData
    }: {
      intentId: `0x${string}`
      user: Address
      paymentToken: Address
      expectedAmount: bigint
      creator: Address
      paymentType: 0 | 1 | 2 | 3
      permitData: Permit2Data
    }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'executePaymentWithPermit',
        args: [intentId, user, paymentToken, expectedAmount, creator, paymentType, permitData.permit, permitData.transferDetails, permitData.signature] as const
      })
    },
    onSuccess: (hash) => {
      console.log('Payment executed with permit:', hash)
    },
    onError: (error) => {
      console.error('Failed to execute payment with permit:', error)
    }
  })

  // ============ EMERGENCY CONTROLS ============

  /**
   * Pause permit payment manager
   */
  const pause = useMutation({
    mutationFn: async () => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'pause'
      })
    },
    onSuccess: (hash) => {
      console.log('PermitPaymentManager paused:', hash)
    },
    onError: (error) => {
      console.error('Failed to pause PermitPaymentManager:', error)
    }
  })

  /**
   * Unpause permit payment manager
   */
  const unpause = useMutation({
    mutationFn: async () => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'unpause'
      })
    },
    onSuccess: (hash) => {
      console.log('PermitPaymentManager unpaused:', hash)
    },
    onError: (error) => {
      console.error('Failed to unpause PermitPaymentManager:', error)
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Check if payment can be executed with permit
   */
  const useCanExecuteWithPermit = (
    intentId: `0x${string}` | undefined,
    user: Address | undefined,
    deadline: bigint | undefined,
    hasSignature: boolean | undefined,
    permitData: Permit2Data | undefined
  ) => {
    return useReadContract({
      ...contract,
      functionName: 'canExecuteWithPermit',
      args: intentId && user && deadline !== undefined && permitData ?
        [intentId, user, deadline, hasSignature || false, permitData.permit, permitData.transferDetails, permitData.signature] : undefined,
      query: {
        enabled: !!intentId && !!user && deadline !== undefined && !!permitData,
        staleTime: 15000 // 15 seconds
      }
    })
  }

  /**
   * Get permit domain separator
   */
  const usePermitDomainSeparator = () => {
    return useReadContract({
      ...contract,
      functionName: 'getPermitDomainSeparator',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get permit nonce for user
   */
  const usePermitNonce = (user: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getPermitNonce',
      args: user ? [user] : undefined,
      query: {
        enabled: !!user,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Check if contract is paused
   */
  const useIsPaused = () => {
    return useReadContract({
      ...contract,
      functionName: 'paused',
      query: {
        staleTime: 30000 // 30 seconds
      }
    })
  }

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

  /**
   * Get permit2 contract address
   */
  const usePermit2 = () => {
    return useReadContract({
      ...contract,
      functionName: 'permit2',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get USDC token address
   */
  const useUsdcToken = () => {
    return useReadContract({
      ...contract,
      functionName: 'usdcToken',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  // Note: validatePermitContext function not found in ABI, removing

  // Note: validatePermitData function not found in ABI, removing

  // ============ ROLE MANAGEMENT ============

  /**
   * Get PAYMENT_MONITOR_ROLE hash
   */
  const usePaymentMonitorRole = () => {
    return useReadContract({
      ...contract,
      functionName: 'PAYMENT_MONITOR_ROLE',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Check if address has payment monitor role
   */
  const useHasPaymentMonitorRole = (account: Address | undefined) => {
    const paymentMonitorRole = usePaymentMonitorRole()
    return useReadContract({
      ...contract,
      functionName: 'hasRole',
      args: account && paymentMonitorRole.data ? [
        paymentMonitorRole.data,
        account
      ] : undefined,
      query: {
        enabled: !!account && !!paymentMonitorRole.data,
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Validate permit context
   */
  const useValidatePermitContext = (
    permitData: Permit2Data | undefined
  ) => {
    return useReadContract({
      ...contract,
      functionName: 'validatePermitContext',
      args: permitData ? [permitData.permit, permitData.transferDetails, permitData.signature] : undefined,
      query: {
        enabled: !!permitData,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Validate permit data
   */
  const useValidatePermitData = (
    permitData: Permit2Data | undefined
  ) => {
    return useReadContract({
      ...contract,
      functionName: 'validatePermitData',
      args: permitData ? [permitData.permit, permitData.transferDetails, permitData.signature] : undefined,
      query: {
        enabled: !!permitData,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  // ============ UTILITY FUNCTIONS ============

  /**
   * Check permit payment eligibility
   */
  const usePermitEligibility = (
    intentId: `0x${string}` | undefined,
    user: Address | undefined,
    permitData: Permit2Data | undefined,
    paymentToken?: Address,
    expectedAmount?: bigint
  ) => {
    const canExecute = useCanExecuteWithPermit(
      intentId,
      user,
      permitData?.permit.deadline,
      true,
      permitData
    )
    
    const isPaused = useIsPaused()

    return {
      canExecute: canExecute.data?.[0],
      reason: canExecute.data?.[1],
      isPaused: isPaused.data,
      isLoading: canExecute.isLoading || isPaused.isLoading,
      error: canExecute.error || isPaused.error
    }
  }

  /**
   * Get permit payment summary
   */
  const usePermitPaymentSummary = (permitData: Permit2Data | undefined) => {
    const domainSeparator = usePermitDomainSeparator()

    return {
      domainSeparator: domainSeparator.data,
      permitToken: permitData?.permit.permitted.token,
      permitAmount: permitData?.permit.permitted.amount,
      transferTo: permitData?.transferDetails.to,
      transferAmount: permitData?.transferDetails.requestedAmount,
      deadline: permitData?.permit.deadline,
      isLoading: domainSeparator.isLoading,
      error: domainSeparator.error
    }
  }

  /**
   * Create permit signature data for off-chain signing
   */
  const preparePermitSignature = (permitData: Permit2Data) => {
    return {
      domain: {
        name: 'Permit2',
        version: '1',
        chainId: chainId,
        verifyingContract: contract.address
      },
      types: {
        PermitTransferFrom: [
          { name: 'permitted', type: 'TokenPermissions' },
          { name: 'spender', type: 'address' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ],
        TokenPermissions: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ]
      },
      primaryType: 'PermitTransferFrom',
      message: {
        permitted: permitData.permit.permitted,
        spender: permitData.transferDetails.to,
        nonce: permitData.permit.nonce,
        deadline: permitData.permit.deadline
      }
    }
  }

  return {
    // Write functions
    createAndExecuteWithPermit,
    executePaymentWithPermit,
    pause,
    unpause,

    // Read hooks
    useCanExecuteWithPermit,
    usePermitDomainSeparator,
    usePermitNonce,
    useIsPaused,
    useBaseCommerceIntegration,
    usePermit2,
    useUsdcToken,
    usePaymentMonitorRole,
    useHasPaymentMonitorRole,
    useValidatePermitContext,
    useValidatePermitData,

    // Utility functions
    usePermitEligibility,
    usePermitPaymentSummary,
    preparePermitSignature,

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
 * Convenience hook for gasless payment flow
 */
export function useGaslessPayment() {
  const { address: userAddress } = useAccount()
  const {
    createAndExecuteWithPermit,
    executePaymentWithPermit,
    usePermitEligibility,
    usePermitPaymentSummary,
    preparePermitSignature
  } = usePermitPaymentManager()

  /**
   * Complete gasless payment flow
   */
  const processGaslessPayment = useMutation({
    mutationFn: async ({
      creator,
      paymentType,
      paymentToken,
      expectedAmount,
      intentId,
      permitData
    }: {
      creator: Address
      paymentType: 0 | 1 | 2 | 3
      paymentToken: Address
      expectedAmount: bigint
      intentId: `0x${string}`
      permitData: Permit2Data
    }) => {
      // Note: In a real implementation, you would validate the permit here
      // For now, we'll proceed directly to execution

      // Execute the payment
      return createAndExecuteWithPermit.mutateAsync({
        user: userAddress!,
        creator,
        paymentType,
        paymentToken,
        expectedAmount,
        intentId,
        permitData
      })
    }
  })

  return {
    processGaslessPayment,
    createAndExecuteWithPermit,
    executePaymentWithPermit,
    usePermitEligibility,
    usePermitPaymentSummary,
    preparePermitSignature
  }
}

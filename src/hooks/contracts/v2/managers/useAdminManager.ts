/**
 * Admin Manager Hook - V2 Platform Administration
 *
 * Handles platform administration functions including operator management,
 * role management, and system configuration using the modular
 * AdminManager contract from v2 architecture.
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import { useReadContract, useWriteContract, useAccount, useChainId } from 'wagmi'
import { getContractConfig } from '@/lib/contracts/config'
import { ADMIN_MANAGER_ABI } from '@/lib/contracts/abis/v2ABIs/AdminManager'
import { type Address } from 'viem'

/**
 * Hook for AdminManager contract interactions
 */
export function useAdminManager() {
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const contractConfig = getContractConfig(chainId, 'ADMIN_MANAGER')
  const contract = {
    address: contractConfig.address as `0x${string}`,
    abi: ADMIN_MANAGER_ABI
  } as const

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  // ============ OPERATOR MANAGEMENT ============

  /**
   * Register as an operator
   */
  const registerAsOperator = useMutation({
    mutationFn: async () => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'registerAsOperator'
      })
    },
    onSuccess: (hash) => {
      console.log('Registered as operator:', hash)
    },
    onError: (error) => {
      console.error('Failed to register as operator:', error)
    }
  })

  /**
   * Register as an operator (simple version)
   */
  const registerAsOperatorSimple = useMutation({
    mutationFn: async () => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'registerAsOperatorSimple'
      })
    },
    onSuccess: (hash) => {
      console.log('Registered as operator (simple):', hash)
    },
    onError: (error) => {
      console.error('Failed to register as operator (simple):', error)
    }
  })

  /**
   * Unregister as an operator
   */
  const unregisterAsOperator = useMutation({
    mutationFn: async () => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'unregisterAsOperator'
      })
    },
    onSuccess: (hash) => {
      console.log('Unregistered as operator:', hash)
    },
    onError: (error) => {
      console.error('Failed to unregister as operator:', error)
    }
  })

  // ============ AUTHORIZED SIGNER MANAGEMENT ============

  /**
   * Add an authorized signer
   */
  const addAuthorizedSigner = useMutation({
    mutationFn: async (signer: Address) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'addAuthorizedSigner',
        args: [signer]
      })
    },
    onSuccess: (hash) => {
      console.log('Authorized signer added:', hash)
    },
    onError: (error) => {
      console.error('Failed to add authorized signer:', error)
    }
  })

  /**
   * Remove an authorized signer
   */
  const removeAuthorizedSigner = useMutation({
    mutationFn: async (signer: Address) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'removeAuthorizedSigner',
        args: [signer]
      })
    },
    onSuccess: (hash) => {
      console.log('Authorized signer removed:', hash)
    },
    onError: (error) => {
      console.error('Failed to remove authorized signer:', error)
    }
  })

  // ============ ROLE MANAGEMENT ============

  /**
   * Grant a specific role to an address
   */
  const grantRole = useMutation({
    mutationFn: async ({ role, account }: { role: `0x${string}`, account: Address }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'grantRole',
        args: [role, account]
      })
    },
    onSuccess: (hash) => {
      console.log('Role granted:', hash)
    },
    onError: (error) => {
      console.error('Failed to grant role:', error)
    }
  })

  /**
   * Revoke a specific role from an address
   */
  const revokeRole = useMutation({
    mutationFn: async ({ role, account }: { role: `0x${string}`, account: Address }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'revokeRole',
        args: [role, account]
      })
    },
    onSuccess: (hash) => {
      console.log('Role revoked:', hash)
    },
    onError: (error) => {
      console.error('Failed to revoke role:', error)
    }
  })

  /**
   * Grant payment monitor role
   */
  const grantPaymentMonitorRole = useMutation({
    mutationFn: async (monitor: Address) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'grantPaymentMonitorRole',
        args: [monitor]
      })
    },
    onSuccess: (hash) => {
      console.log('Payment monitor role granted:', hash)
    },
    onError: (error) => {
      console.error('Failed to grant payment monitor role:', error)
    }
  })

  // ============ PAUSE CONTROLS ============

  /**
   * Pause contract
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
      console.log('Contract paused:', hash)
    },
    onError: (error) => {
      console.error('Failed to pause contract:', error)
    }
  })

  /**
   * Unpause contract
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
      console.log('Contract unpaused:', hash)
    },
    onError: (error) => {
      console.error('Failed to unpause contract:', error)
    }
  })

  // ============ OPERATOR FEE MANAGEMENT ============

  /**
   * Update operator fee destination
   */
  const updateOperatorFeeDestination = useMutation({
    mutationFn: async (newDestination: Address) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'updateOperatorFeeDestination',
        args: [newDestination]
      })
    },
    onSuccess: (hash) => {
      console.log('Operator fee destination updated:', hash)
    },
    onError: (error) => {
      console.error('Failed to update operator fee destination:', error)
    }
  })

  /**
   * Update operator fee rate
   */
  const updateOperatorFeeRate = useMutation({
    mutationFn: async (newRate: bigint) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'updateOperatorFeeRate',
        args: [newRate]
      })
    },
    onSuccess: (hash) => {
      console.log('Operator fee rate updated:', hash)
    },
    onError: (error) => {
      console.error('Failed to update operator fee rate:', error)
    }
  })

  /**
   * Update operator signer
   */
  const updateOperatorSigner = useMutation({
    mutationFn: async (newSigner: Address) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'updateOperatorSigner',
        args: [newSigner]
      })
    },
    onSuccess: (hash) => {
      console.log('Operator signer updated:', hash)
    },
    onError: (error) => {
      console.error('Failed to update operator signer:', error)
    }
  })

  /**
   * Withdraw operator fees
   */
  const withdrawOperatorFees = useMutation({
    mutationFn: async ({ token, amount }: { token: Address, amount: bigint }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'withdrawOperatorFees',
        args: [token, amount]
      })
    },
    onSuccess: (hash) => {
      console.log('Operator fees withdrawn:', hash)
    },
    onError: (error) => {
      console.error('Failed to withdraw operator fees:', error)
    }
  })

  /**
   * Track operator fees
   */
  const trackOperatorFees = useMutation({
    mutationFn: async ({ token, feeAmount }: { token: Address, feeAmount: bigint }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'trackOperatorFees',
        args: [token, feeAmount]
      })
    },
    onSuccess: (hash) => {
      console.log('Operator fees tracked:', hash)
    },
    onError: (error) => {
      console.error('Failed to track operator fees:', error)
    }
  })

  // ============ EMERGENCY FUNCTIONS ============

  /**
   * Emergency token recovery
   */
  const emergencyTokenRecovery = useMutation({
    mutationFn: async ({ token, amount }: { token: Address, amount: bigint }) => {
      if (!userAddress) throw new Error('User not connected')

      return writeContract({
        ...contract,
        functionName: 'emergencyTokenRecovery',
        args: [token, amount]
      })
    },
    onSuccess: (hash) => {
      console.log('Emergency token recovery executed:', hash)
    },
    onError: (error) => {
      console.error('Failed to execute emergency token recovery:', error)
    }
  })

  // ============ READ FUNCTIONS ============

  /**
   * Check if the contract is paused
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
   * Check if an address has a specific role
   */
  const useHasRole = (role: `0x${string}` | undefined, account: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'hasRole',
      args: role && account ? [role, account] : undefined,
      query: {
        enabled: !!role && !!account,
        staleTime: 60000 // 1 minute - roles don't change often
      }
    })
  }

  /**
   * Get the admin role for a specific role
   */
  const useGetRoleAdmin = (role: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'getRoleAdmin',
      args: role ? [role] : undefined,
      query: {
        enabled: !!role,
        staleTime: Infinity // Role hierarchy doesn't change
      }
    })
  }

  /**
   * Get default admin role hash
   */
  const useDefaultAdminRole = () => {
    return useReadContract({
      ...contract,
      functionName: 'DEFAULT_ADMIN_ROLE',
      query: {
        staleTime: Infinity // Never changes
      }
    })
  }

  /**
   * Get payment monitor role hash
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
   * Get contract owner
   */
  const useOwner = () => {
    return useReadContract({
      ...contract,
      functionName: 'owner',
      query: {
        staleTime: 60000 // 1 minute
      }
    })
  }

  /**
   * Check if address supports an interface
   */
  const useSupportsInterface = (interfaceId: `0x${string}` | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'supportsInterface',
      args: interfaceId ? [interfaceId] : undefined,
      query: {
        enabled: !!interfaceId,
        staleTime: Infinity // Interface support doesn't change
      }
    })
  }

  /**
   * Get operator status
   */
  const useOperatorStatus = () => {
    return useReadContract({
      ...contract,
      functionName: 'getOperatorStatus',
      query: {
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get operator configuration
   */
  const useOperatorConfig = () => {
    return useReadContract({
      ...contract,
      functionName: 'getOperatorConfig',
      query: {
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get operator fee destination
   */
  const useOperatorFeeDestination = () => {
    return useReadContract({
      ...contract,
      functionName: 'operatorFeeDestination',
      query: {
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get operator fee rate
   */
  const useOperatorFeeRate = () => {
    return useReadContract({
      ...contract,
      functionName: 'operatorFeeRate',
      query: {
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get operator signer
   */
  const useOperatorSigner = () => {
    return useReadContract({
      ...contract,
      functionName: 'operatorSigner',
      query: {
        staleTime: 30000 // 30 seconds
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
        staleTime: 30000 // 30 seconds
      }
    })
  }

  /**
   * Get base commerce integration address
   */
  const useBaseCommerceIntegration = () => {
    return useReadContract({
      ...contract,
      functionName: 'baseCommerceIntegration',
      query: {
        staleTime: 300000 // 5 minutes
      }
    })
  }

  /**
   * Get PayPerView contract address
   */
  const usePayPerView = () => {
    return useReadContract({
      ...contract,
      functionName: 'payPerView',
      query: {
        staleTime: 300000 // 5 minutes
      }
    })
  }

  /**
   * Get SubscriptionManager contract address
   */
  const useSubscriptionManager = () => {
    return useReadContract({
      ...contract,
      functionName: 'subscriptionManager',
      query: {
        staleTime: 300000 // 5 minutes
      }
    })
  }

  /**
   * Get accumulated fees for a token
   */
  const useAccumulatedFees = (token: Address | undefined) => {
    return useReadContract({
      ...contract,
      functionName: 'accumulatedFees',
      args: token ? [token] : undefined,
      query: {
        enabled: !!token,
        staleTime: 30000 // 30 seconds
      }
    })
  }

  return {
    // Write functions - Operator Management
    registerAsOperator,
    registerAsOperatorSimple,
    unregisterAsOperator,

    // Write functions - Authorized Signer Management
    addAuthorizedSigner,
    removeAuthorizedSigner,

    // Write functions - Role Management
    grantRole,
    revokeRole,
    grantPaymentMonitorRole,

    // Write functions - Pause Controls
    pause,
    unpause,

    // Write functions - Operator Fee Management
    updateOperatorFeeDestination,
    updateOperatorFeeRate,
    updateOperatorSigner,
    withdrawOperatorFees,
    trackOperatorFees,

    // Write functions - Emergency Functions
    emergencyTokenRecovery,

    // Read hooks - Basic Contract Info
    useIsPaused,
    useOwner,
    useSupportsInterface,

    // Read hooks - Role Management
    useHasRole,
    useGetRoleAdmin,
    useDefaultAdminRole,
    usePaymentMonitorRole,

    // Read hooks - Operator Management
    useOperatorStatus,
    useOperatorConfig,
    useOperatorFeeDestination,
    useOperatorFeeRate,
    useOperatorSigner,
    useIsAuthorizedSigner,
    useAccumulatedFees,

    // Read hooks - Contract Addresses
    useBaseCommerceIntegration,
    usePayPerView,
    useSubscriptionManager,

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
 * Convenience hook for operator status
 */
export function useOperatorStatus() {
  const { address: userAddress } = useAccount()
  const { useOperatorStatus, useHasRole, usePaymentMonitorRole } = useAdminManager()

  const operatorStatus = useOperatorStatus()
  const paymentMonitorRole = usePaymentMonitorRole()
  const isPaymentMonitor = useHasRole(
    paymentMonitorRole.data,
    userAddress
  )

  return {
    isOperator: operatorStatus.data?.[0] || false,
    feeDestination: operatorStatus.data?.[1],
    isPaymentMonitor: isPaymentMonitor.data,
    isLoading: operatorStatus.isLoading || isPaymentMonitor.isLoading || paymentMonitorRole.isLoading,
    error: operatorStatus.error || isPaymentMonitor.error || paymentMonitorRole.error
  }
}

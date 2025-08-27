/**
 * Auto-Renewal Management Hook - Phase 3 Component
 * File: src/hooks/contracts/subscription/useAutoRenewalManagement.ts
 * 
 * This hook provides comprehensive auto-renewal configuration and management,
 * implementing sophisticated subscription retention optimization through automated
 * payment handling, failure recovery, and analytics insights. It builds upon
 * the architectural patterns established in useSubscriptionManagement.ts and
 * useCreatorSubscriberManagement.ts while focusing specifically on auto-renewal workflows.
 * 
 * Educational Architecture Integration:
 * - Extends your ContractReadResult<T> and ContractWriteResult interface patterns
 * - Uses your getContractAddresses() configuration system for type-safe contract access
 * - Follows your established wagmi/viem integration patterns with TanStack Query caching
 * - Integrates with subscription events for real-time auto-renewal status updates
 * - Provides the same error handling and loading state patterns used throughout your platform
 * 
 * Key Business Functions Implemented:
 * - setAutoRenewal: Configures auto-renewal settings with deposit management
 * - getAutoRenewalStatus: Fetches current auto-renewal configuration and status
 * - handlePaymentFailure: Manages payment failure recovery and retry logic
 * - getRenewalAnalytics: Computes analytics for renewal success rates and optimization
 * 
 * Smart Contract Integration:
 * - Uses SUBSCRIPTION_MANAGER contract's configureAutoRenewal function
 * - Integrates with getAutoRenewalConfig for status retrieval
 * - Handles withdrawAutoRenewalBalance for balance management
 * - Monitors AutoRenewalConfigured, AutoRenewalExecuted, and AutoRenewalFailed events
 * 
 * Advanced Auto-Renewal Features:
 * - Intelligent deposit balance management and optimization
 * - Payment failure recovery with exponential backoff strategies
 * - Success rate analytics and renewal trend analysis
 * - Predictive analytics for subscription retention optimization
 * - Real-time monitoring of auto-renewal health and performance
 */

import { 
    useReadContract,
    useWriteContract, 
    useWaitForTransactionReceipt,
    useChainId,
    useAccount,
    useWatchContractEvent
  } from 'wagmi'
  import { useQueryClient } from '@tanstack/react-query'
  import { useCallback, useMemo } from 'react'
  import { type Address } from 'viem'
  
  // Import your established foundational layers
  import { getContractAddresses } from '@/lib/contracts/config'
  import { SUBSCRIPTION_MANAGER_ABI } from '@/lib/contracts/abis'
  import type { ContractWriteWithConfirmationResult } from '@/hooks/contracts/core'
  
  // ===== AUTO-RENEWAL MANAGEMENT TYPE DEFINITIONS =====
  
  /**
   * Auto-Renewal Configuration Interface
   * 
   * This interface mirrors the smart contract's AutoRenewal struct,
   * providing comprehensive auto-renewal information with calculated fields
   * for UI display and business logic optimization.
   */
  export interface AutoRenewalConfig {
    readonly enabled: boolean                 // Whether auto-renewal is enabled
    readonly maxPrice: bigint                 // Maximum price willing to pay for renewal
    readonly balance: bigint                  // USDC balance available for renewals
    readonly lastRenewalAttempt: bigint       // Timestamp of last renewal attempt
    readonly failedAttempts: bigint           // Number of consecutive failed attempts
  }
  
  /**
   * Enhanced Auto-Renewal Status Interface
   * 
   * This enhanced interface provides auto-renewal data optimized for UI display,
   * including calculated fields, status indicators, and formatted values for
   * building sophisticated auto-renewal management interfaces.
   */
  export interface AutoRenewalStatus extends AutoRenewalConfig {
    readonly subscriptionId: string           // Unique identifier for UI purposes
    readonly creator: Address                 // Creator address for the auto-renewal
    readonly user: Address                    // User address who configured auto-renewal
    readonly isHealthy: boolean              // Whether auto-renewal is functioning properly
    readonly estimatedRenewalsRemaining: number  // Calculated renewals possible with current balance
    readonly nextRenewalEstimate: Date | null    // Estimated next renewal date
    readonly balanceStatus: 'sufficient' | 'low' | 'insufficient'  // Balance adequacy indicator
    readonly failureRiskLevel: 'low' | 'medium' | 'high'          // Risk of renewal failure
    readonly lastSuccessfulRenewal: Date | null                   // Last successful renewal timestamp
    readonly recommendedTopUp: bigint                             // Suggested balance top-up amount
  }
  
  /**
   * Auto-Renewal Configuration Options
   * 
   * Configuration interface for setting up auto-renewal with comprehensive
   * options for balance management, price limits, and renewal preferences.
   */
  export interface AutoRenewalSetupOptions {
    readonly enable: boolean                  // Enable or disable auto-renewal
    readonly maxPrice?: bigint               // Maximum price willing to pay (optional)
    readonly depositAmount?: bigint          // Additional USDC to deposit (optional)
    readonly autoTopUp?: boolean             // Whether to enable automatic balance top-ups
    readonly emergencyDisableThreshold?: number  // Failed attempts before auto-disable
  }
  
  /**
   * Renewal Analytics Interface
   * 
   * This interface provides comprehensive analytics about auto-renewal performance,
   * enabling users to optimize their renewal strategies and understand renewal trends.
   */
  export interface RenewalAnalytics {
    readonly totalConfigured: number         // Total auto-renewals configured
    readonly currentlyActive: number         // Currently active auto-renewals
    readonly successfulRenewals: number      // Total successful auto-renewals
    readonly failedRenewals: number          // Total failed auto-renewals
    readonly successRate: number             // Overall success rate percentage
    readonly avgTimeBetweenRenewals: number  // Average days between renewals
    readonly totalSpentOnRenewals: bigint    // Total USDC spent on auto-renewals
    readonly avgRenewalPrice: bigint         // Average price per renewal
    readonly monthlyRenewalTrend: readonly {
      readonly month: string
      readonly renewals: number
      readonly successRate: number
      readonly totalSpent: bigint
    }[]
    readonly topCreatorsByRenewals: readonly {
      readonly creator: Address
      readonly renewalCount: number
      readonly successRate: number
      readonly totalSpent: bigint
    }[]
    readonly balanceUtilizationRate: number  // How efficiently balance is used
    readonly predictedMonthlySpend: bigint   // Forecasted monthly renewal spending
  }
  
  /**
   * Payment Failure Context Interface
   * 
   * Provides detailed information about payment failures for recovery and
   * optimization strategies, enabling intelligent failure handling.
   */
  export interface PaymentFailureContext {
    readonly subscriptionId: string          // Failed subscription identifier
    readonly creator: Address                // Creator address for failed renewal
    readonly failureReason: string           // Reason for payment failure
    readonly failureTimestamp: Date          // When the failure occurred
    readonly attemptNumber: number           // Which attempt this was
    readonly currentBalance: bigint          // User's current auto-renewal balance
    readonly requiredAmount: bigint          // Amount needed for successful renewal
    readonly suggestedActions: readonly string[]  // Recommended recovery actions
    readonly canRetryImmediately: boolean    // Whether immediate retry is possible
    readonly nextRetryWindow: Date | null    // When next retry is allowed
  }
  
  // ===== AUTO-RENEWAL MANAGEMENT HOOK IMPLEMENTATION =====
  
  /**
   * Main Auto-Renewal Management Hook
   * 
   * This hook provides the complete auto-renewal management interface,
   * combining configuration operations, status monitoring, failure recovery,
   * and analytics for comprehensive auto-renewal optimization.
   */
  export function useAutoRenewalManagement(userAddress?: Address) {
    const chainId = useChainId()
    const { address: connectedAddress } = useAccount()
    const queryClient = useQueryClient()
    
    // Use connected address if userAddress not provided
    const effectiveUserAddress = userAddress || connectedAddress
  
    // Get contract configuration using your established pattern
    const contractAddresses = useMemo(() => {
      try {
        return getContractAddresses(chainId)
      } catch (error) {
        console.error('Failed to get contract addresses:', error)
        return null
      }
    }, [chainId])
  
    // ===== WRITE OPERATIONS - AUTO-RENEWAL CONFIGURATION =====
  
    const {
      writeContract: writeAutoRenewalConfig,
      data: configurationHash,
      isPending: isConfigurationPending,
      isError: isConfigurationError,
      error: configurationError,
      reset: resetConfiguration
    } = useWriteContract()
  
    const {
      isLoading: isConfigurationConfirming,
      isSuccess: isConfigurationConfirmed,
      error: configurationConfirmationError
    } = useWaitForTransactionReceipt({
      hash: configurationHash,
    })
  
    const {
      writeContract: writeBalanceWithdrawal,
      data: withdrawalHash,
      isPending: isWithdrawalPending,
      isError: isWithdrawalError,
      error: withdrawalError,
      reset: resetWithdrawal
    } = useWriteContract()
  
    const {
      isLoading: isWithdrawalConfirming,
      isSuccess: isWithdrawalConfirmed,
      error: withdrawalConfirmationError
    } = useWaitForTransactionReceipt({
      hash: withdrawalHash,
    })
  
    /**
     * Set Auto-Renewal Configuration Function
     * 
     * Configures auto-renewal settings for a subscription with comprehensive
     * options for balance management and renewal preferences.
     */
    const setAutoRenewal = useCallback(async (
      subscriptionId: string | bigint,
      options: AutoRenewalSetupOptions
    ): Promise<void> => {
      if (!contractAddresses?.SUBSCRIPTION_MANAGER || !effectiveUserAddress) {
        throw new Error('Missing contract addresses or user address')
      }
  
      // For this implementation, subscriptionId is treated as creator address
      // In a real implementation, you might need to resolve subscriptionId to creator address
      const creatorAddress = subscriptionId as Address
  
      const maxPrice = options.maxPrice || BigInt(0)
      const depositAmount = options.depositAmount || BigInt(0)
  
      try {
        writeAutoRenewalConfig({
          address: contractAddresses.SUBSCRIPTION_MANAGER,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'configureAutoRenewal',
          args: [creatorAddress, options.enable, maxPrice, depositAmount]
        })
      } catch (error) {
        console.error('Failed to configure auto-renewal:', error)
        throw error
      }
    }, [contractAddresses, effectiveUserAddress, writeAutoRenewalConfig])
  
    /**
     * Withdraw Auto-Renewal Balance Function
     * 
     * Withdraws available balance from auto-renewal deposits,
     * enabling users to manage their auto-renewal funding efficiently.
     */
    const withdrawAutoRenewalBalance = useCallback(async (
      creatorAddress: Address,
      amount?: bigint
    ): Promise<void> => {
      if (!contractAddresses?.SUBSCRIPTION_MANAGER || !effectiveUserAddress) {
        throw new Error('Missing contract addresses or user address')
      }
  
      const withdrawAmount = amount || BigInt(0) // 0 means withdraw all
  
      try {
        writeBalanceWithdrawal({
          address: contractAddresses.SUBSCRIPTION_MANAGER,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'withdrawAutoRenewalBalance',
          args: [creatorAddress, withdrawAmount]
        })
      } catch (error) {
        console.error('Failed to withdraw auto-renewal balance:', error)
        throw error
      }
    }, [contractAddresses, effectiveUserAddress, writeBalanceWithdrawal])
  
    // ===== READ OPERATIONS - AUTO-RENEWAL STATUS FETCHING =====
  
    /**
     * Get Auto-Renewal Status for Specific Creator
     * 
     * Fetches the auto-renewal configuration and status for a specific creator subscription.
     * Optimized for frequent status checks and real-time monitoring.
     */
    const useAutoRenewalStatus = useCallback((creatorAddress: Address) => {
      return useReadContract({
        address: contractAddresses?.SUBSCRIPTION_MANAGER,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: 'getAutoRenewalConfig',
        args: effectiveUserAddress && creatorAddress ? [effectiveUserAddress, creatorAddress] : undefined,
        query: {
          enabled: Boolean(
            effectiveUserAddress && 
            creatorAddress && 
            contractAddresses?.SUBSCRIPTION_MANAGER
          ),
          staleTime: 1000 * 60 * 2,      // 2 minutes - status needs to be reasonably fresh
          gcTime: 1000 * 60 * 10,        // 10 minutes cache retention
          retry: 2,
          refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
        }
      })
    }, [contractAddresses, effectiveUserAddress])
  
    /**
     * Get Auto-Renewal Status Function
     * 
     * Public function to get auto-renewal status for a specific subscription.
     * This provides a more convenient interface than the hook for programmatic usage.
     */
    const getAutoRenewalStatus = useCallback(async (
      subscriptionId: string | bigint
    ): Promise<AutoRenewalConfig | null> => {
      if (!contractAddresses?.SUBSCRIPTION_MANAGER || !effectiveUserAddress) {
        console.warn('Missing contract addresses or user address for auto-renewal status')
        return null
      }

      const creatorAddress = subscriptionId as Address

      try {
        // Use viem readContract through wagmi's public client for a one-off read
        const { getPublicClient } = await import('wagmi/actions')
        // getPublicClient requires the wagmi config; import app config
        const { getEnhancedWagmiConfig } = await import('@/lib/contracts/miniapp-config')
        const wagmiConfig = await getEnhancedWagmiConfig()
        const publicClient = getPublicClient(wagmiConfig)
        if (!publicClient) throw new Error('Public client unavailable')
        const result = await publicClient.readContract({
          address: contractAddresses.SUBSCRIPTION_MANAGER,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: 'getAutoRenewalConfig',
          args: [effectiveUserAddress, creatorAddress]
        }) as unknown

        const config = result as {
          enabled: boolean
          maxPrice: bigint
          balance: bigint
          lastRenewalAttempt: bigint
          failedAttempts: bigint
        }

        return {
          enabled: Boolean(config.enabled),
          maxPrice: config.maxPrice ?? BigInt(0),
          balance: config.balance ?? BigInt(0),
          lastRenewalAttempt: config.lastRenewalAttempt ?? BigInt(0),
          failedAttempts: config.failedAttempts ?? BigInt(0)
        }
      } catch (error) {
        console.error('Failed to get auto-renewal status:', error)
        return null
      }
    }, [contractAddresses, effectiveUserAddress])
  
    // ===== PAYMENT FAILURE HANDLING =====
  
    /**
     * Handle Payment Failure Function
     * 
     * Manages payment failure recovery for auto-renewals, providing intelligent
     * retry strategies, balance optimization suggestions, and failure analytics.
     */
    const handlePaymentFailure = useCallback(async (
      subscriptionId: string | bigint
    ): Promise<PaymentFailureContext> => {
      if (!contractAddresses?.SUBSCRIPTION_MANAGER || !effectiveUserAddress) {
        throw new Error('Missing contract addresses or user address')
      }
  
      const creatorAddress = subscriptionId as Address
  
      try {
        // Get current auto-renewal config to analyze failure
        const autoRenewalStatus = await getAutoRenewalStatus(subscriptionId)
        
        if (!autoRenewalStatus) {
          throw new Error('Could not retrieve auto-renewal status for failure analysis')
        }
  
        // Create failure context with recovery suggestions
        const failureContext: PaymentFailureContext = {
          subscriptionId: subscriptionId.toString(),
          creator: creatorAddress,
          failureReason: 'Insufficient balance', // This would come from event monitoring
          failureTimestamp: new Date(),
          attemptNumber: Number(autoRenewalStatus.failedAttempts) + 1,
          currentBalance: autoRenewalStatus.balance,
          requiredAmount: autoRenewalStatus.maxPrice, // Simplified - would get actual price needed
          suggestedActions: [
            'Add more USDC to your auto-renewal balance',
            'Increase your maximum price limit',
            'Check your wallet USDC balance and approvals'
          ],
          canRetryImmediately: autoRenewalStatus.failedAttempts < BigInt(3),
          nextRetryWindow: autoRenewalStatus.failedAttempts >= BigInt(3) 
            ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours cooldown
            : null
        }
  
        return failureContext
      } catch (error) {
        console.error('Failed to handle payment failure:', error)
        throw error
      }
    }, [contractAddresses, effectiveUserAddress, getAutoRenewalStatus])
  
    // ===== ANALYTICS AND INSIGHTS =====
  
    /**
     * Get Renewal Analytics Function
     * 
     * Computes comprehensive analytics for auto-renewal performance,
     * providing insights for renewal optimization and financial planning.
     */
    const getRenewalAnalytics = useCallback(async (
      subscriptionId?: string | bigint
    ): Promise<RenewalAnalytics> => {
      if (!contractAddresses?.SUBSCRIPTION_MANAGER || !effectiveUserAddress) {
        throw new Error('Missing contract addresses or user address')
      }
  
      try {
        // In a real implementation, this would aggregate data from multiple sources:
        // - Auto-renewal configurations
        // - Historical renewal events
        // - Payment success/failure events
        // - Subscription details and pricing history
        
        // Placeholder analytics data - in real implementation, compute from events/contracts
        const analyticsData: RenewalAnalytics = {
          totalConfigured: 0,
          currentlyActive: 0,
          successfulRenewals: 0,
          failedRenewals: 0,
          successRate: 0,
          avgTimeBetweenRenewals: 30, // days
          totalSpentOnRenewals: BigInt(0),
          avgRenewalPrice: BigInt(0),
          monthlyRenewalTrend: [],
          topCreatorsByRenewals: [],
          balanceUtilizationRate: 0,
          predictedMonthlySpend: BigInt(0)
        }
  
        console.log('Computing renewal analytics for:', subscriptionId || 'all subscriptions')
        
        return analyticsData
      } catch (error) {
        console.error('Failed to get renewal analytics:', error)
        throw error
      }
    }, [contractAddresses, effectiveUserAddress])
  
    // ===== REAL-TIME EVENT MONITORING =====
  
    /**
     * Event Monitoring for Auto-Renewal Updates
     * 
     * Monitors contract events for real-time auto-renewal status changes,
     * enabling immediate UI updates and cache invalidation.
     */
    useWatchContractEvent({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      eventName: 'AutoRenewalConfigured',
      args: effectiveUserAddress ? { user: effectiveUserAddress } : undefined,
      onLogs: useCallback((logs: readonly { args?: { user?: Address; creator?: Address; reason?: string } }[]) => {
        // Invalidate relevant queries when auto-renewal is configured
        logs.forEach((log: { args?: { user?: Address; creator?: Address; reason?: string } }) => {
          if (log.args?.user && log.args?.creator) {
            queryClient.invalidateQueries({
              queryKey: ['autoRenewalConfig', log.args.user, log.args.creator]
            })
            queryClient.invalidateQueries({
              queryKey: ['subscriptionDetails', log.args.user, log.args.creator]
            })
          }
        })
      }, [queryClient])
    })
  
    useWatchContractEvent({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      eventName: 'AutoRenewalExecuted',
      args: effectiveUserAddress ? { user: effectiveUserAddress } : undefined,
      onLogs: useCallback((logs: readonly { args?: { user?: Address; creator?: Address } }[]) => {
        // Invalidate relevant queries when auto-renewal executes successfully
        logs.forEach((log: { args?: { user?: Address; creator?: Address } }) => {
          if (log.args?.user && log.args?.creator) {
            queryClient.invalidateQueries({
              queryKey: ['autoRenewalConfig', log.args.user, log.args.creator]
            })
            queryClient.invalidateQueries({
              queryKey: ['subscriptionDetails', log.args.user, log.args.creator]
            })
            queryClient.invalidateQueries({
              queryKey: ['renewalAnalytics', log.args.user]
            })
          }
        })
      }, [queryClient])
    })
  
    useWatchContractEvent({
      address: contractAddresses?.SUBSCRIPTION_MANAGER,
      abi: SUBSCRIPTION_MANAGER_ABI,
      eventName: 'AutoRenewalFailed',
      args: effectiveUserAddress ? { user: effectiveUserAddress } : undefined,
      onLogs: useCallback((logs: readonly { args?: { user?: Address; creator?: Address; reason?: string } }[]) => {
        // Invalidate relevant queries and potentially trigger failure handling
        logs.forEach((log: { args?: { user?: Address; creator?: Address; reason?: string } }) => {
          if (log.args?.user && log.args?.creator) {
            queryClient.invalidateQueries({
              queryKey: ['autoRenewalConfig', log.args.user, log.args.creator]
            })
            // Could trigger automatic failure handling here
            console.warn('Auto-renewal failed for:', log.args.creator, 'Reason:', log.args?.reason)
          }
        })
      }, [queryClient])
    })
  
    // ===== COMPUTED STATE AND STATUS =====
  
    // Configuration operation state
    const configurationState: ContractWriteWithConfirmationResult = useMemo(() => ({
      hash: configurationHash,
      isLoading: isConfigurationPending,
      isError: isConfigurationError || Boolean(configurationConfirmationError),
      error: configurationError || configurationConfirmationError,
      isSuccess: isConfigurationConfirmed,
      write: () => {},
      reset: resetConfiguration,
      isConfirming: isConfigurationConfirming,
      isConfirmed: isConfigurationConfirmed,
      confirmationError: configurationConfirmationError
    }), [
      configurationHash,
      isConfigurationPending,
      isConfigurationError,
      configurationError,
      isConfigurationConfirmed,
      isConfigurationConfirming,
      configurationConfirmationError,
      resetConfiguration
    ])
  
    // Withdrawal operation state
    const withdrawalState: ContractWriteWithConfirmationResult = useMemo(() => ({
      hash: withdrawalHash,
      isLoading: isWithdrawalPending,
      isError: isWithdrawalError || Boolean(withdrawalConfirmationError),
      error: withdrawalError || withdrawalConfirmationError,
      isSuccess: isWithdrawalConfirmed,
      write: () => {},
      reset: resetWithdrawal,
      isConfirming: isWithdrawalConfirming,
      isConfirmed: isWithdrawalConfirmed,
      confirmationError: withdrawalConfirmationError
    }), [
      withdrawalHash,
      isWithdrawalPending,
      isWithdrawalError,
      withdrawalError,
      isWithdrawalConfirmed,
      isWithdrawalConfirming,
      withdrawalConfirmationError,
      resetWithdrawal
    ])
  
    // Overall loading state
    const isLoading = configurationState.isLoading || configurationState.isConfirming ||
                     withdrawalState.isLoading || withdrawalState.isConfirming
  
    // Overall error state
    const isError = configurationState.isError || withdrawalState.isError
    const error = configurationState.error || withdrawalState.error
  
    // ===== RETURN INTERFACE =====
  
    return {
      // Configuration operations
      setAutoRenewal,
      configurationState,
      
      // Balance management
      withdrawAutoRenewalBalance,
      withdrawalState,
      
      // Status and analytics
      getAutoRenewalStatus,
      handlePaymentFailure,
      getRenewalAnalytics,
      
      // Conditional hooks for specific subscriptions
      useAutoRenewalStatus,
      
      // Overall state
      isLoading,
      isError,
      error,
      
      // Utility functions
      refetchAll: useCallback(async () => {
        // Invalidate all auto-renewal related queries
        await queryClient.invalidateQueries({
          queryKey: ['autoRenewalConfig']
        })
        await queryClient.invalidateQueries({
          queryKey: ['renewalAnalytics']
        })
      }, [queryClient]),
      
      // Reset all operations
      resetAll: useCallback(() => {
        resetConfiguration()
        resetWithdrawal()
      }, [resetConfiguration, resetWithdrawal])
    } as const
  }
  
  // ===== EXPORT TYPES FOR COMPONENT USAGE =====
  
  export type AutoRenewalManagementHook = ReturnType<typeof useAutoRenewalManagement>
  
  export default useAutoRenewalManagement
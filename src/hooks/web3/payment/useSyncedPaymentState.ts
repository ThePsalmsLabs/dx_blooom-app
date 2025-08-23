import { useState, useEffect, useCallback, useMemo } from 'react'
import { Address } from 'viem'
import { useReadContract, useAccount, useChainId } from 'wagmi'
import { getContractAddresses } from '@/lib/contracts/config'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'

/**
 * Payment Intent Status Enum - matches smart contract definitions
 * This ensures perfect alignment between frontend and contract state representations
 */
export enum PaymentIntentStatus {
  NOT_FOUND = 0,      // Intent doesn't exist
  CREATED = 1,        // Intent created, awaiting signature  
  SIGNED = 2,         // Intent signed, ready for execution
  EXECUTING = 3,      // Transaction submitted, awaiting confirmation
  COMPLETED = 4,      // Payment successfully completed
  FAILED = 5,         // Payment failed and needs cleanup
  CANCELLED = 6,      // Intent was manually cancelled
  EXPIRED = 7         // Intent expired past deadline
}

/**
 * Frontend State Enum - represents UI state machine
 */
export enum FrontendPaymentState {
  IDLE = 'idle',
  PRICE_CALCULATING = 'price_calculating',
  CREATING_INTENT = 'creating_intent',
  WAITING_SIGNATURE = 'waiting_signature', 
  EXECUTING_PAYMENT = 'executing_payment',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

/**
 * Sync Status - indicates alignment between frontend and contract
 */
export enum SyncStatus {
  IN_SYNC = 'in_sync',          // Frontend and contract agree
  OUT_OF_SYNC = 'out_of_sync',  // States don't match - needs attention
  UNKNOWN = 'unknown',          // Unable to determine contract state
  RECOVERING = 'recovering'     // Actively fixing sync issues
}

interface SyncedPaymentStateConfig {
  intentId?: string
  autoSync?: boolean           // Automatically fix sync issues
  syncIntervalMs?: number      // How often to check contract state
  maxSyncRetries?: number      // Max attempts to fix sync issues
}

interface SyncedPaymentStateResult {
  // State Information
  frontendState: FrontendPaymentState
  contractStatus: PaymentIntentStatus
  syncStatus: SyncStatus
  
  // Intent Details (from contract)
  intentDetails: {
    exists: boolean
    creator: Address | null
    expectedAmount: bigint | null
    deadline: number | null
    isExpired: boolean
    paymentToken: Address | null
  }
  
  // Sync Management
  isLoading: boolean
  error: string | null
  lastSyncTime: number | null
  syncRetryCount: number
  
  // Control Functions
  setFrontendState: (state: FrontendPaymentState) => void
  forceSyncCheck: () => Promise<void>
  resetSyncState: () => void
  
  // Status Helpers
  isInSync: boolean
  needsRecovery: boolean
  canProceed: boolean           // Safe to continue with payment flow
}

/**
 * Core State Synchronization Hook
 * 
 * This hook maintains perfect synchronization between frontend UI state 
 * and actual smart contract state. It prevents users from seeing 
 * misleading information during complex multi-step payment flows.
 * 
 * Key Features:
 * - Real-time contract state monitoring
 * - Automatic sync issue detection and recovery
 * - Comprehensive error handling
 * - Production-ready retry logic
 */
export function useSyncedPaymentState({
  intentId,
  autoSync = true,
  syncIntervalMs = 2000,
  maxSyncRetries = 3
}: SyncedPaymentStateConfig = {}): SyncedPaymentStateResult {
  
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  
  // Get contract addresses for current chain
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])
  
  // Frontend state management
  const [frontendState, setFrontendState] = useState<FrontendPaymentState>(
    FrontendPaymentState.IDLE
  )
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.UNKNOWN)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null)
  const [syncRetryCount, setSyncRetryCount] = useState(0)
  
  // Read contract state for the payment intent - getPaymentContext
  const {
    data: contractIntentData,
    isLoading: isContractLoading,
    error: contractError,
    refetch: refetchContractState
  } = useReadContract({
    address: contractAddresses?.COMMERCE_INTEGRATION,
    abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
    functionName: 'getPaymentContext',
    args: intentId ? [intentId as `0x${string}`] : undefined,
    query: {
      enabled: !!(contractAddresses?.COMMERCE_INTEGRATION && intentId),
      refetchInterval: syncIntervalMs,
      retry: 3,
      retryDelay: 1000
    }
  })
  
  // Read deadline separately from intentDeadlines mapping
  const {
    data: intentDeadline,
    isLoading: isDeadlineLoading,
    error: deadlineError
  } = useReadContract({
    address: contractAddresses?.COMMERCE_INTEGRATION,
    abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
    functionName: 'intentDeadlines',
    args: intentId ? [intentId as `0x${string}`] : undefined,
    query: {
      enabled: !!(contractAddresses?.COMMERCE_INTEGRATION && intentId),
      refetchInterval: syncIntervalMs,
      retry: 3,
      retryDelay: 1000
    }
  })
  
  // Check if intent has been processed
  const {
    data: isProcessed,
    isLoading: isProcessedLoading,
    error: processedError
  } = useReadContract({
    address: contractAddresses?.COMMERCE_INTEGRATION,
    abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
    functionName: 'processedIntents',
    args: intentId ? [intentId as `0x${string}`] : undefined,
    query: {
      enabled: !!(contractAddresses?.COMMERCE_INTEGRATION && intentId),
      refetchInterval: syncIntervalMs,
      retry: 3,
      retryDelay: 1000
    }
  })
  
  // Check if intent has a signature
  const {
    data: hasSignature,
    isLoading: isSignatureLoading,
    error: signatureError
  } = useReadContract({
    address: contractAddresses?.COMMERCE_INTEGRATION,
    abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
    functionName: 'hasSignature',
    args: intentId ? [intentId as `0x${string}`] : undefined,
    query: {
      enabled: !!(contractAddresses?.COMMERCE_INTEGRATION && intentId),
      refetchInterval: syncIntervalMs,
      retry: 3,
      retryDelay: 1000
    }
  })
  
  // Parse contract data into structured format
  const intentDetails = useMemo(() => {
    if (!contractIntentData) {
      return {
        exists: false,
        creator: null,
        expectedAmount: null,
        deadline: null,
        isExpired: false,
        paymentToken: null
      }
    }
    
    // getPaymentContext returns a PaymentContext struct
    const context = contractIntentData as {
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
      intentId: string
    }
    
    // Check if intent exists by looking at the creator address
    const exists = context.creator !== '0x0000000000000000000000000000000000000000'
    
    // Get deadline from intentDeadlines mapping
    const deadline = intentDeadline ? Number(intentDeadline) : null
    
    const currentTime = Math.floor(Date.now() / 1000)
    const isExpired = exists && deadline ? currentTime > deadline : false
    
    return {
      exists,
      creator: exists ? context.creator : null,
      expectedAmount: exists ? context.expectedAmount : null,
      deadline,
      isExpired,
      paymentToken: exists ? context.paymentToken : null
    }
  }, [contractIntentData, intentDeadline])
  
  // Determine contract status based on intent details and additional contract calls
  const contractStatus = useMemo((): PaymentIntentStatus => {
    if (contractError || deadlineError || processedError || signatureError) {
      return PaymentIntentStatus.NOT_FOUND
    }
    
    if (!intentDetails.exists) {
      return PaymentIntentStatus.NOT_FOUND
    }
    
    if (intentDetails.isExpired) {
      return PaymentIntentStatus.EXPIRED
    }
    
    // Check if payment has been processed
    if (isProcessed === true) {
      return PaymentIntentStatus.COMPLETED
    }
    
    // Check if intent has a signature
    if (hasSignature === true) {
      return PaymentIntentStatus.SIGNED
    }
    
    // If intent exists but no signature, it's created
    if (intentDetails.exists && intentDetails.expectedAmount && intentDetails.deadline) {
      return PaymentIntentStatus.CREATED
    }
    
    return PaymentIntentStatus.NOT_FOUND
  }, [contractError, deadlineError, processedError, signatureError, intentDetails, isProcessed, hasSignature])
  
  // Sync status determination logic
  const determineSyncStatus = useCallback((): SyncStatus => {
    const isLoading = isContractLoading || isDeadlineLoading || isProcessedLoading || isSignatureLoading
    
    if (isLoading) return SyncStatus.UNKNOWN
    if (contractError && !intentId) return SyncStatus.IN_SYNC // No intent expected
    if (contractError || deadlineError || processedError || signatureError) return SyncStatus.OUT_OF_SYNC
    
    // Define expected contract states for each frontend state
    const expectedContractStates: Record<FrontendPaymentState, PaymentIntentStatus[]> = {
      [FrontendPaymentState.IDLE]: [PaymentIntentStatus.NOT_FOUND],
      [FrontendPaymentState.PRICE_CALCULATING]: [PaymentIntentStatus.NOT_FOUND],
      [FrontendPaymentState.CREATING_INTENT]: [PaymentIntentStatus.NOT_FOUND, PaymentIntentStatus.CREATED],
      [FrontendPaymentState.WAITING_SIGNATURE]: [PaymentIntentStatus.CREATED],
      [FrontendPaymentState.EXECUTING_PAYMENT]: [PaymentIntentStatus.SIGNED, PaymentIntentStatus.EXECUTING],
      [FrontendPaymentState.COMPLETED]: [PaymentIntentStatus.COMPLETED],
      [FrontendPaymentState.ERROR]: [PaymentIntentStatus.FAILED, PaymentIntentStatus.EXPIRED],
      [FrontendPaymentState.CANCELLED]: [PaymentIntentStatus.CANCELLED]
    }
    
    const expectedStates = expectedContractStates[frontendState] || []
    const isStateValid = expectedStates.includes(contractStatus)
    
    return isStateValid ? SyncStatus.IN_SYNC : SyncStatus.OUT_OF_SYNC
  }, [isContractLoading, isDeadlineLoading, isProcessedLoading, isSignatureLoading, 
      contractError, deadlineError, processedError, signatureError, intentId, frontendState, contractStatus])
  
  // Update sync status when states change
  useEffect(() => {
    const newSyncStatus = determineSyncStatus()
    setSyncStatus(newSyncStatus)
    setLastSyncTime(Date.now())
  }, [determineSyncStatus])
  
  // Auto-recovery logic for sync issues
  useEffect(() => {
    if (!autoSync) return
    if (syncStatus !== SyncStatus.OUT_OF_SYNC) return
    if (syncRetryCount >= maxSyncRetries) return
    
    const attemptRecovery = async () => {
      try {
        setSyncStatus(SyncStatus.RECOVERING)
        setSyncRetryCount(prev => prev + 1)
        
        // Strategy 1: Refresh all contract state
        await Promise.all([
          refetchContractState(),
          // Note: wagmi doesn't have refetch for individual contract calls
          // The refetchInterval will handle this automatically
        ])
        
        // Strategy 2: Align frontend state with contract reality
        if (contractStatus === PaymentIntentStatus.EXPIRED && 
            frontendState !== FrontendPaymentState.ERROR) {
          setFrontendState(FrontendPaymentState.ERROR)
          setError('Payment intent has expired')
        }
        
        if (contractStatus === PaymentIntentStatus.COMPLETED && 
            frontendState !== FrontendPaymentState.COMPLETED) {
          setFrontendState(FrontendPaymentState.COMPLETED)
          setError(null)
        }
        
        if (contractStatus === PaymentIntentStatus.FAILED && 
            frontendState !== FrontendPaymentState.ERROR) {
          setFrontendState(FrontendPaymentState.ERROR)
          setError('Payment failed on contract level')
        }
        
      } catch (recoveryError) {
        console.error('Sync recovery failed:', recoveryError)
        setError(`Sync recovery failed: ${recoveryError instanceof Error ? recoveryError.message : 'Unknown error'}`)
      }
    }
    
    // Debounce recovery attempts
    const recoveryTimer = setTimeout(attemptRecovery, 1000)
    return () => clearTimeout(recoveryTimer)
    
  }, [syncStatus, syncRetryCount, maxSyncRetries, autoSync, refetchContractState, 
      contractStatus, frontendState])
  
  // Force sync check function
  const forceSyncCheck = useCallback(async () => {
    try {
      setSyncRetryCount(0)
      setError(null)
      await refetchContractState()
    } catch (err) {
      setError(`Force sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [refetchContractState])
  
  // Reset all sync state
  const resetSyncState = useCallback(() => {
    setFrontendState(FrontendPaymentState.IDLE)
    setSyncStatus(SyncStatus.UNKNOWN)
    setError(null)
    setLastSyncTime(null)
    setSyncRetryCount(0)
  }, [])
  
  // Computed status helpers
  const isInSync = syncStatus === SyncStatus.IN_SYNC
  const needsRecovery = syncStatus === SyncStatus.OUT_OF_SYNC
  const canProceed = isInSync && !error && !intentDetails.isExpired
  const isLoading = isContractLoading || isDeadlineLoading || isProcessedLoading || 
                   isSignatureLoading || syncStatus === SyncStatus.RECOVERING
  
  return {
    // State Information
    frontendState,
    contractStatus,
    syncStatus,
    
    // Intent Details
    intentDetails,
    
    // Sync Management
    isLoading,
    error: error || (contractError?.message || deadlineError?.message || 
                     processedError?.message || signatureError?.message || null),
    lastSyncTime,
    syncRetryCount,
    
    // Control Functions  
    setFrontendState,
    forceSyncCheck,
    resetSyncState,
    
    // Status Helpers
    isInSync,
    needsRecovery,
    canProceed
  }
}
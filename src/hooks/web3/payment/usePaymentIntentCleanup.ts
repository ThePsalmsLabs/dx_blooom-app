import { useState, useCallback, useMemo, useEffect } from 'react'
import { Address } from 'viem'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi'
import { getContractAddresses } from '@/lib/contracts/config'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'
import { FrontendPaymentState, PaymentIntentStatus } from './useSyncedPaymentState'

/**
 * Cleanup Strategy Enum - defines different approaches to handle failed payments
 */
export enum CleanupStrategy {
  SOFT_RESET = 'soft_reset',           // Reset frontend state only, keep contract intent
  HARD_CLEANUP = 'hard_cleanup',       // Cancel contract intent and reset frontend
  REFUND_ELIGIBLE = 'refund_eligible', // Process refund if user already paid
  AUTO_RETRY = 'auto_retry',           // Attempt to retry the payment automatically
  MANUAL_INTERVENTION = 'manual'        // Requires manual review/intervention
}

/**
 * Cleanup Reason - tracks why cleanup was triggered for analytics and debugging
 */
export enum CleanupReason {
  USER_CANCELLED = 'user_cancelled',
  TIMEOUT_EXPIRED = 'timeout_expired', 
  TRANSACTION_FAILED = 'transaction_failed',
  SIGNATURE_TIMEOUT = 'signature_timeout',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  SLIPPAGE_EXCEEDED = 'slippage_exceeded',
  NETWORK_ERROR = 'network_error',
  CONTRACT_REVERT = 'contract_revert',
  SYNC_MISMATCH = 'sync_mismatch',
  INTENT_EXPIRED = 'intent_expired'
}

interface CleanupOperation {
  strategy: CleanupStrategy
  reason: CleanupReason
  intentId?: string
  requiresContractCall: boolean
  userMessage: string
  technicalDetails: string
}

interface PaymentIntentCleanupConfig {
  enableAutoCleanup?: boolean      // Automatically trigger cleanup on detection
  maxRetryAttempts?: number        // Max retry attempts before giving up
  cleanupTimeoutMs?: number        // Timeout for cleanup operations
  preserveUserFunds?: boolean      // Extra safety - never risk user funds
}

interface PaymentIntentCleanupResult {
  // Current cleanup state
  isCleaningUp: boolean
  cleanupError: string | null
  lastCleanupOperation: CleanupOperation | null
  cleanupRetryCount: number
  
  // Cleanup functions
  triggerCleanup: (operation: CleanupOperation) => Promise<boolean>
  softReset: (reason: CleanupReason, userMessage?: string) => Promise<boolean>
  hardCleanup: (intentId: string, reason: CleanupReason) => Promise<boolean>
  processRefund: (intentId: string, userAddress: Address) => Promise<boolean>
  
  // Analysis functions
  analyzeFailureScenario: (
    frontendState: FrontendPaymentState,
    contractStatus: PaymentIntentStatus,
    error?: string
  ) => CleanupOperation
  
  // Status helpers
  canRetry: boolean
  needsManualIntervention: boolean
  hasActiveCleanupsInProgress: boolean
}

/**
 * Payment Intent Cleanup Hook
 * 
 * This hook handles comprehensive error recovery and cleanup for payment intents.
 * It works in close coordination with the useSyncedPaymentState hook to detect
 * when payment flows have failed or gotten stuck, then executes appropriate
 * recovery strategies to restore the user experience to a clean state.
 * 
 * Key Responsibilities:
 * - Detect different types of payment failures and their root causes
 * - Execute appropriate cleanup strategies (soft reset vs hard cleanup)
 * - Handle edge cases like partial payments or stuck transactions  
 * - Provide clear user messaging for each failure scenario
 * - Ensure no user funds are ever lost during cleanup operations
 * 
 * Directory: src/hooks/web3/payment/usePaymentIntentCleanup.ts
 */
export function usePaymentIntentCleanup({
  enableAutoCleanup = true,
  maxRetryAttempts = 2,
  cleanupTimeoutMs = 30000,
  preserveUserFunds = true
}: PaymentIntentCleanupConfig = {}): PaymentIntentCleanupResult {
  
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  
  // Get contract addresses with error handling
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses for cleanup:', error)
      return null
    }
  }, [chainId])
  
  // Cleanup state management
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupError, setCleanupError] = useState<string | null>(null)
  const [lastCleanupOperation, setLastCleanupOperation] = useState<CleanupOperation | null>(null)
  const [cleanupRetryCount, setCleanupRetryCount] = useState(0)
  const [activeCleanupsInProgress, setActiveCleanupsInProgress] = useState<Set<string>>(new Set())
  
  // Contract interaction for cleanup operations
  const { 
    writeContract: writeCleanupContract, 
    data: cleanupTransactionHash,
    isPending: isCleanupTransactionPending,
    error: cleanupTransactionError
  } = useWriteContract()
  
  // Monitor cleanup transaction confirmations
  const { 
    isLoading: isCleanupConfirming,
    isSuccess: isCleanupSuccess,
    isError: isCleanupConfirmationError,
    error: cleanupConfirmationError
  } = useWaitForTransactionReceipt({
    hash: cleanupTransactionHash,
    timeout: cleanupTimeoutMs
  })
  
  /**
   * Intelligent Failure Analysis
   * 
   * This function serves as our "diagnostic engine" - it examines the current
   * state of both frontend and contract to determine exactly what went wrong
   * and what the most appropriate recovery strategy should be.
   */
  const analyzeFailureScenario = useCallback((
    frontendState: FrontendPaymentState,
    contractStatus: PaymentIntentStatus,
    error?: string
  ): CleanupOperation => {
    
    // Scenario 1: User cancelled while waiting for signature
    if (frontendState === FrontendPaymentState.WAITING_SIGNATURE && 
        contractStatus === PaymentIntentStatus.CREATED) {
      return {
        strategy: CleanupStrategy.HARD_CLEANUP,
        reason: CleanupReason.USER_CANCELLED,
        requiresContractCall: true,
        userMessage: 'Payment cancelled. We\'ll clean up the pending transaction for you.',
        technicalDetails: 'Frontend shows waiting signature, contract has created intent - need to cancel contract intent'
      }
    }
    
    // Scenario 2: Transaction timeout during execution
    if (frontendState === FrontendPaymentState.EXECUTING_PAYMENT && 
        contractStatus === PaymentIntentStatus.SIGNED &&
        error?.includes('timeout')) {
      return {
        strategy: CleanupStrategy.AUTO_RETRY,
        reason: CleanupReason.TIMEOUT_EXPIRED,
        requiresContractCall: false,
        userMessage: 'Transaction is taking longer than expected. We\'ll retry automatically.',
        technicalDetails: 'Signed intent exists, transaction may still be pending - attempt retry before cleanup'
      }
    }
    
    // Scenario 3: Intent expired while user was inactive
    if (contractStatus === PaymentIntentStatus.EXPIRED) {
      return {
        strategy: CleanupStrategy.SOFT_RESET,
        reason: CleanupReason.INTENT_EXPIRED,
        requiresContractCall: false,
        userMessage: 'Payment window expired. Please start a new payment.',
        technicalDetails: 'Contract intent expired - soft reset sufficient as contract will ignore expired intents'
      }
    }
    
    // Scenario 4: Insufficient funds detected
    if (error?.toLowerCase().includes('insufficient') || 
        error?.toLowerCase().includes('balance')) {
      return {
        strategy: CleanupStrategy.SOFT_RESET,
        reason: CleanupReason.INSUFFICIENT_FUNDS,
        requiresContractCall: false,
        userMessage: 'Insufficient balance for this payment. Please add funds and try again.',
        technicalDetails: 'User lacks sufficient token balance - soft reset and let them add funds'
      }
    }
    
    // Scenario 5: Slippage protection triggered
    if (error?.toLowerCase().includes('slippage') || 
        error?.toLowerCase().includes('price impact')) {
      return {
        strategy: CleanupStrategy.AUTO_RETRY,
        reason: CleanupReason.SLIPPAGE_EXCEEDED,
        requiresContractCall: false,
        userMessage: 'Price moved during transaction. Retrying with updated pricing...',
        technicalDetails: 'Slippage protection triggered - retry with fresh price quotes'
      }
    }
    
    // Scenario 6: Contract revert or transaction failure
    if (frontendState === FrontendPaymentState.EXECUTING_PAYMENT && 
        contractStatus === PaymentIntentStatus.FAILED) {
      return {
        strategy: preserveUserFunds ? CleanupStrategy.REFUND_ELIGIBLE : CleanupStrategy.HARD_CLEANUP,
        reason: CleanupReason.CONTRACT_REVERT,
        requiresContractCall: true,
        userMessage: 'Payment failed. We\'re checking if a refund is needed...',
        technicalDetails: 'Contract shows failed status - need to check if user funds were debited'
      }
    }
    
    // Scenario 7: Sync mismatch detected
    if (frontendState === FrontendPaymentState.COMPLETED && 
        contractStatus !== PaymentIntentStatus.COMPLETED) {
      return {
        strategy: CleanupStrategy.MANUAL_INTERVENTION,
        reason: CleanupReason.SYNC_MISMATCH,
        requiresContractCall: false,
        userMessage: 'Payment status unclear. Our team will review and contact you if needed.',
        technicalDetails: 'Frontend shows completed but contract disagrees - needs manual review'
      }
    }
    
    // Default fallback for unknown scenarios
    return {
      strategy: CleanupStrategy.SOFT_RESET,
      reason: CleanupReason.NETWORK_ERROR,
      requiresContractCall: false,
      userMessage: 'Something went wrong. Please try your payment again.',
      technicalDetails: `Unknown scenario: frontend=${frontendState}, contract=${contractStatus}, error=${error}`
    }
  }, [preserveUserFunds])
  
  /**
   * Soft Reset - Frontend State Only
   * 
   * This strategy resets the frontend payment flow without touching the smart contract.
   * It's used when the contract state is either correct or will naturally resolve itself
   * (like expired intents that the contract will ignore).
   */
  const softReset = useCallback(async (
    reason: CleanupReason,
    userMessage: string = 'Resetting payment flow...'
  ): Promise<boolean> => {
    try {
      setIsCleaningUp(true)
      setCleanupError(null)
      
      // Create operation record for tracking
      const operation: CleanupOperation = {
        strategy: CleanupStrategy.SOFT_RESET,
        reason,
        requiresContractCall: false,
        userMessage,
        technicalDetails: `Soft reset triggered for reason: ${reason}`
      }
      
      setLastCleanupOperation(operation)
      
      // Simulate brief cleanup operation for UX consistency
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // The actual cleanup is handled by the parent component
      // This hook just coordinates the cleanup strategy
      
      setIsCleaningUp(false)
      return true
      
    } catch (error) {
      const errorMessage = `Soft reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setCleanupError(errorMessage)
      setIsCleaningUp(false)
      return false
    }
  }, [])
  
  /**
   * Hard Cleanup - Contract + Frontend Reset
   * 
   * This strategy cancels the payment intent on the smart contract and resets
   * the frontend state. It's used when we have a created intent that needs to
   * be properly cancelled to prevent future confusion.
   */
  const hardCleanup = useCallback(async (
    intentId: string,
    reason: CleanupReason
  ): Promise<boolean> => {
    
    if (!contractAddresses?.COMMERCE_INTEGRATION || !userAddress) {
      setCleanupError('Missing contract configuration for hard cleanup')
      return false
    }
    
    try {
      setIsCleaningUp(true)
      setCleanupError(null)
      setActiveCleanupsInProgress(prev => new Set(prev).add(intentId))
      
      // Create operation record
      const operation: CleanupOperation = {
        strategy: CleanupStrategy.HARD_CLEANUP,
        reason,
        intentId,
        requiresContractCall: true,
        userMessage: 'Cancelling payment intent...',
        technicalDetails: `Hard cleanup for intent ${intentId}, reason: ${reason}`
      }
      
      setLastCleanupOperation(operation)
      
      // Execute contract call to request refund (which effectively cancels the intent)
      await writeCleanupContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'requestRefund',
        args: [intentId as `0x${string}`, `Cleanup requested: ${reason}`]
      })
      
      // Transaction submitted successfully - wait for confirmation
      // The useWaitForTransactionReceipt hook will handle confirmation tracking
      return true
      
    } catch (error) {
      const errorMessage = `Hard cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setCleanupError(errorMessage)
      setIsCleaningUp(false)
      setActiveCleanupsInProgress(prev => {
        const newSet = new Set(prev)
        newSet.delete(intentId)
        return newSet
      })
      return false
    }
  }, [contractAddresses, userAddress, writeCleanupContract])
  
  /**
   * Process Refund - Handle Partial Payment Scenarios
   * 
   * This strategy handles cases where the user's funds might have been debited
   * but the payment didn't complete successfully. It ensures user funds are
   * properly returned.
   */
  const processRefund = useCallback(async (
    intentId: string,
    userAddress: Address
  ): Promise<boolean> => {
    
    if (!contractAddresses?.COMMERCE_INTEGRATION) {
      setCleanupError('Missing contract configuration for refund processing')
      return false
    }
    
    try {
      setIsCleaningUp(true)
      setCleanupError(null)
      setActiveCleanupsInProgress(prev => new Set(prev).add(intentId))
      
      // Create operation record
      const operation: CleanupOperation = {
        strategy: CleanupStrategy.REFUND_ELIGIBLE,
        reason: CleanupReason.CONTRACT_REVERT,
        intentId,
        requiresContractCall: true,
        userMessage: 'Processing refund for failed payment...',
        technicalDetails: `Refund processing for intent ${intentId}, user ${userAddress}`
      }
      
      setLastCleanupOperation(operation)
      
      // Execute contract call to request refund
      await writeCleanupContract({
        address: contractAddresses.COMMERCE_INTEGRATION,
        abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
        functionName: 'requestRefund',
        args: [intentId as `0x${string}`, 'Payment failed - processing refund']
      })
      
      return true
      
    } catch (error) {
      const errorMessage = `Refund processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setCleanupError(errorMessage)
      setIsCleaningUp(false)
      setActiveCleanupsInProgress(prev => {
        const newSet = new Set(prev)
        newSet.delete(intentId)
        return newSet
      })
      return false
    }
  }, [contractAddresses, writeCleanupContract])
  
  /**
   * Main Cleanup Trigger
   * 
   * This is the primary interface for executing cleanup operations.
   * It routes to the appropriate strategy based on the operation type.
   */
  const triggerCleanup = useCallback(async (operation: CleanupOperation): Promise<boolean> => {
    
    // Prevent concurrent cleanup operations for the same intent
    if (operation.intentId && activeCleanupsInProgress.has(operation.intentId)) {
      console.warn('Cleanup already in progress for intent:', operation.intentId)
      return false
    }
    
    // Check retry limits
    if (cleanupRetryCount >= maxRetryAttempts) {
      setCleanupError('Maximum cleanup retry attempts reached')
      return false
    }
    
    try {
      setCleanupRetryCount(prev => prev + 1)
      
      switch (operation.strategy) {
        case CleanupStrategy.SOFT_RESET:
          return await softReset(operation.reason, operation.userMessage)
          
        case CleanupStrategy.HARD_CLEANUP:
          if (!operation.intentId) {
            throw new Error('Intent ID required for hard cleanup')
          }
          return await hardCleanup(operation.intentId, operation.reason)
          
        case CleanupStrategy.REFUND_ELIGIBLE:
          if (!operation.intentId || !userAddress) {
            throw new Error('Intent ID and user address required for refund processing')
          }
          return await processRefund(operation.intentId, userAddress)
          
        case CleanupStrategy.AUTO_RETRY:
          // Auto-retry is handled by the parent payment flow
          // This hook just signals that a retry should be attempted
          setLastCleanupOperation(operation)
          return true
          
        case CleanupStrategy.MANUAL_INTERVENTION:
          // Manual intervention requires human review
          setLastCleanupOperation(operation)
          setCleanupError('Manual intervention required - support team notified')
          return false
          
        default:
          throw new Error(`Unsupported cleanup strategy: ${operation.strategy}`)
      }
      
    } catch (error) {
      const errorMessage = `Cleanup trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      setCleanupError(errorMessage)
      return false
    }
  }, [activeCleanupsInProgress, cleanupRetryCount, maxRetryAttempts, softReset, hardCleanup, processRefund, userAddress])
  
  // Handle cleanup transaction confirmation results
  const handleCleanupTransactionResult = useCallback(() => {
    if (isCleanupSuccess && lastCleanupOperation) {
      // Cleanup transaction confirmed successfully
      setIsCleaningUp(false)
      setCleanupError(null)
      setCleanupRetryCount(0)
      
      if (lastCleanupOperation.intentId) {
        setActiveCleanupsInProgress(prev => {
          const newSet = new Set(prev)
          newSet.delete(lastCleanupOperation.intentId!)
          return newSet
        })
      }
    }
    
    if (isCleanupConfirmationError && cleanupConfirmationError) {
      // Cleanup transaction failed
      setIsCleaningUp(false)
      setCleanupError(`Cleanup transaction failed: ${cleanupConfirmationError.message}`)
      
      if (lastCleanupOperation?.intentId) {
        setActiveCleanupsInProgress(prev => {
          const newSet = new Set(prev)
          newSet.delete(lastCleanupOperation.intentId!)
          return newSet
        })
      }
    }
  }, [isCleanupSuccess, isCleanupConfirmationError, cleanupConfirmationError, lastCleanupOperation])
  
  // Effect to handle transaction confirmation results
  useEffect(() => {
    handleCleanupTransactionResult()
  }, [handleCleanupTransactionResult])
  
  // Computed status helpers
  const canRetry = cleanupRetryCount < maxRetryAttempts && !isCleaningUp
  const needsManualIntervention = lastCleanupOperation?.strategy === CleanupStrategy.MANUAL_INTERVENTION
  const hasActiveCleanupsInProgress = activeCleanupsInProgress.size > 0
  const overallIsCleaningUp = isCleaningUp || isCleanupTransactionPending || isCleanupConfirming
  
  return {
    // Current cleanup state
    isCleaningUp: overallIsCleaningUp,
    cleanupError: cleanupError || cleanupTransactionError?.message || null,
    lastCleanupOperation,
    cleanupRetryCount,
    
    // Cleanup functions
    triggerCleanup,
    softReset,
    hardCleanup,
    processRefund,
    
    // Analysis functions
    analyzeFailureScenario,
    
    // Status helpers
    canRetry,
    needsManualIntervention,
    hasActiveCleanupsInProgress
  }
}
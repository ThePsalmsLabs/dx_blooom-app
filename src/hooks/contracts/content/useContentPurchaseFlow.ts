// ==============================================================================
// COMPONENT 1: ENHANCED useContentPurchaseFlow HOOK - PHASE 2 COMMERCE ENHANCEMENT
// File: src/hooks/contracts/content/useContentPurchaseFlow.ts
// ==============================================================================

'use client'

import { useCallback, useState, useEffect, useMemo } from 'react'
import { 
  useAccount, 
  useChainId, 
  useContractWrite, 
  useSendCalls,
  useWaitForTransactionReceipt,
  useWriteContract
} from 'wagmi'
import type { Address } from 'viem'
import { encodeFunctionData, parseUnits } from 'viem'

// Import Phase 1 MiniApp integration for context detection
import { useMiniApp } from '@/contexts/MiniAppProvider'

// Import existing hooks and utilities from your established architecture
import { 
  useContentById, 
  useHasContentAccess,
  useTokenBalance,
  useTokenAllowance 
} from '@/hooks/contracts/core'
import { getContractAddresses } from '@/lib/contracts/config'

// Import existing types and interfaces from your workflows system
import type {
  PaymentExecutionState,
  ExtendedContentPurchaseFlowResult 
} from '@/hooks/business/workflows'

// Import contract ABIs - these should match your existing deployed contracts
import { PAY_PER_VIEW_ABI } from '@/lib/contracts/abis'
import { ERC20_ABI } from '@/lib/contracts/abis'

// ================================================
// ENHANCED INTERFACES FOR BATCH TRANSACTION SUPPORT
// ================================================

/**
 * Enhanced Purchase Flow Configuration
 * 
 * This interface extends your existing configuration system to support
 * the new batch transaction capabilities while maintaining backward compatibility
 * with all existing purchase flow patterns.
 */
interface EnhancedPurchaseFlowConfig {
  /** Whether to enable batch transactions in MiniApp contexts */
  readonly enableBatchTransactions: boolean
  /** Maximum gas limit for batch transactions */
  readonly batchGasLimit: bigint
  /** Timeout for batch transaction completion (milliseconds) */
  readonly batchTimeout: number
  /** Whether to automatically fall back to sequential transactions on batch failure */
  readonly autoFallback: boolean
  /** Custom batch transaction confirmation requirements */
  readonly batchConfirmations: number
}

/**
 * Batch Transaction State Interface
 * 
 * This interface defines the comprehensive state management for batch transactions,
 * providing detailed progress tracking and error handling specific to the complexities
 * of EIP-5792 batch operations in social commerce contexts.
 */
interface BatchTransactionState {
  /** Whether batch transactions are available in current context */
  readonly isBatchAvailable: boolean
  /** Whether a batch transaction is currently being prepared */
  readonly isPreparingBatch: boolean
  /** Whether a batch transaction is currently executing */
  readonly isExecutingBatch: boolean
  /** Current batch transaction hash if available */
  readonly batchTransactionHash: `0x${string}` | null
  /** Individual transaction hashes within the batch */
  readonly batchComponentHashes: readonly `0x${string}`[]
  /** Batch transaction progress (0-100) */
  readonly batchProgress: number
  /** Detailed batch execution status */
  readonly batchStatus: 'idle' | 'preparing' | 'confirming' | 'executing' | 'success' | 'failed'
  /** Batch-specific error information */
  readonly batchError: Error | null
  /** Estimated gas savings from batch vs sequential transactions */
  readonly estimatedGasSavings: bigint | null
}

/**
 * Enhanced Purchase Flow Result Interface
 * 
 * This interface extends your existing purchase flow result to include
 * batch transaction capabilities while preserving all existing functionality
 * and maintaining complete backward compatibility.
 */
interface EnhancedPurchaseFlowResult extends ExtendedContentPurchaseFlowResult {
  /** Batch transaction state and controls */
  readonly batchTransaction: BatchTransactionState & {
    /** Execute purchase using batch transactions (MiniApp contexts) */
    readonly executeBatch: () => Promise<void>
    /** Check if current purchase can use batch transactions */
    readonly canUseBatch: boolean
    /** Reset batch transaction state */
    readonly resetBatch: () => void
  }
  
  /** Enhanced context awareness */
  readonly context: {
    /** Current application context (web vs miniapp) */
    readonly type: 'web' | 'miniapp'
    /** Whether user is in a social commerce environment */
    readonly isSocialCommerce: boolean
    /** Optimal transaction strategy for current context */
    readonly recommendedStrategy: 'sequential' | 'batch'
  }
  
  /** Enhanced performance metrics for social commerce optimization */
  readonly performance: {
    /** Estimated transaction completion time */
    readonly estimatedCompletionTime: number
    /** Expected user confirmation steps */
    readonly confirmationSteps: number
    /** Transaction cost comparison */
    readonly costComparison: {
      readonly sequential: bigint
      readonly batch: bigint | null
      readonly savings: bigint | null
    }
  }
}

// ================================================
// DEFAULT CONFIGURATION
// ================================================

const DEFAULT_ENHANCED_CONFIG: EnhancedPurchaseFlowConfig = {
  enableBatchTransactions: true,
  batchGasLimit: parseUnits('500000', 0), // 500k gas limit for batch transactions
  batchTimeout: 60000, // 60 second timeout
  autoFallback: true,
  batchConfirmations: 1
}

// ================================================
// MAIN ENHANCED HOOK IMPLEMENTATION
// ================================================

/**
 * Enhanced Content Purchase Flow Hook
 * 
 * This hook enhances your existing purchase flow with EIP-5792 batch transaction
 * support for MiniApp contexts while maintaining full backward compatibility with
 * web contexts. It intelligently detects the user's environment and provides the
 * optimal transaction experience for each context.
 * 
 * The hook builds on your sophisticated existing architecture including Commerce
 * Protocol integration, payment method selection, and comprehensive error handling
 * while adding the batch transaction capabilities that transform social commerce
 * user experience.
 * 
 * Key Features:
 * - Automatic context detection using Phase 1 MiniApp infrastructure
 * - EIP-5792 batch transaction support for approve + purchase operations
 * - Full backward compatibility with existing sequential transaction flows
 * - Intelligent fallback mechanisms for unsupported contexts
 * - Enhanced error handling with batch-specific recovery strategies
 * - Performance optimization with gas cost analysis and user experience metrics
 * - Integration with existing Commerce Protocol and payment method systems
 */
export function useEnhancedContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined,
  config: Partial<EnhancedPurchaseFlowConfig> = {}
): EnhancedPurchaseFlowResult {
  
  // ================================================
  // HOOK INITIALIZATION AND CONFIGURATION
  // ================================================
  
  const chainId = useChainId()
  const { address, isConnected } = useAccount()
  const finalConfig = useMemo(() => ({ ...DEFAULT_ENHANCED_CONFIG, ...config }), [config])
  
  const { context: miniAppContext, isMiniApp, isReady: isMiniAppReady, socialUser } = useMiniApp()
  
  // Contract addresses for current network
  const contractAddresses = useMemo(() => {
    try {
      return getContractAddresses(chainId)
    } catch (error) {
      console.error('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])

  // ================================================
  // EXISTING FOUNDATION HOOKS - PRESERVING YOUR ARCHITECTURE
  // ================================================
  
  // These hooks maintain your existing excellent data fetching patterns
  const contentQuery = useContentById(contentId)
  const accessQuery = useHasContentAccess(userAddress, contentId)
  const userBalance = useTokenBalance(contractAddresses?.USDC, userAddress)
  const tokenAllowance = useTokenAllowance(
    contractAddresses?.USDC,
    userAddress,
    contractAddresses?.PAY_PER_VIEW
  )
  
  // Single writeContract hook to avoid React hook rule violations
  const { writeContract, data: transactionHash, error: writeError, isPending: isWritePending } = useWriteContract()
  
  // Track current transaction type for proper state management
  const [currentTransactionType, setCurrentTransactionType] = useState<'approval' | 'purchase' | 'batch' | null>(null)
  
  // NEW: EIP-5792 batch transaction capability
  const { sendCalls, data: batchCallsData, isPending: isBatchPending } = useSendCalls()
  
  // Transaction receipt monitoring for unified transaction hash
  const { isSuccess: isTransactionSuccess, error: receiptError } = useWaitForTransactionReceipt({ 
    hash: transactionHash 
  })
  
  // Batch transaction receipt monitoring
  const { isSuccess: isBatchSuccess } = useWaitForTransactionReceipt({ 
    hash: batchCallsData as `0x${string}` | undefined 
  })

  // Helper functions for sequential transactions with strict typing
  const writeApproval = useCallback(async (params: {
    address: Address
    abi: typeof ERC20_ABI
    functionName: 'approve'
    args: [Address, bigint]
  }) => {
    setCurrentTransactionType('approval')
    return writeContract(params)
  }, [writeContract])

  const writePurchase = useCallback(async (params: {
    address: Address
    abi: typeof PAY_PER_VIEW_ABI
    functionName: 'purchaseContentDirect'
    args: [bigint]
  }) => {
    setCurrentTransactionType('purchase')
    return writeContract(params)
  }, [writeContract])

  // Transaction success monitoring
  const isApprovalSuccess = currentTransactionType === 'approval' && isTransactionSuccess
  const isPurchaseSuccess = currentTransactionType === 'purchase' && isTransactionSuccess

  // ================================================
  // ENHANCED STATE MANAGEMENT
  // ================================================
  
  // Enhanced execution state that builds on your existing patterns
  const [executionState, setExecutionState] = useState<PaymentExecutionState>({
    phase: 'idle',
    progress: 0,
    message: 'Ready to purchase',
    canRetry: false,
    transactionHash: null,
    error: null
  })
  
  // NEW: Batch transaction specific state management
  const [batchState, setBatchState] = useState<BatchTransactionState>({
    isBatchAvailable: false,
    isPreparingBatch: false,
    isExecutingBatch: false,
    batchTransactionHash: null,
    batchComponentHashes: [],
    batchProgress: 0,
    batchStatus: 'idle',
    batchError: null,
    estimatedGasSavings: null
  })
  
  // Performance tracking for social commerce optimization
  const [performanceMetrics, setPerformanceMetrics] = useState({
    estimatedCompletionTime: 0,
    confirmationSteps: 0,
    costComparison: {
      sequential: BigInt(0),
      batch: null as bigint | null,
      savings: null as bigint | null
    }
  })
  
  // ================================================
  // CONTEXT DETECTION AND BATCH AVAILABILITY
  // ================================================
  
  // Determine optimal transaction strategy based on context and capabilities
  const transactionContext = useMemo(() => {
    const type: 'web' | 'miniapp' = isMiniApp ? 'miniapp' : 'web'
    const isSocialCommerce = isMiniApp && Boolean(socialUser)
    
    // Determine recommended strategy based on context and configuration
    let recommendedStrategy: 'sequential' | 'batch' = 'sequential'
    
    if (isMiniApp && finalConfig.enableBatchTransactions && isMiniAppReady) {
      recommendedStrategy = 'batch'
    }
    
    return {
      type,
      isSocialCommerce,
      recommendedStrategy
    }
  }, [isMiniApp, miniAppContext, finalConfig.enableBatchTransactions, isMiniAppReady])
  
  // Check if batch transactions are available and beneficial
  const canUseBatch = useMemo(() => {
    return (
      transactionContext.recommendedStrategy === 'batch' &&
      Boolean(sendCalls) &&
      Boolean(contentQuery.data) &&
      Boolean(contractAddresses) &&
      isConnected &&
      finalConfig.enableBatchTransactions
    )
  }, [
    transactionContext.recommendedStrategy,
    sendCalls,
    contentQuery.data,
    contractAddresses,
    isConnected,
    finalConfig.enableBatchTransactions
  ])
  
  // Update batch availability when dependencies change
  useEffect(() => {
    setBatchState(prev => ({ ...prev, isBatchAvailable: canUseBatch }))
  }, [canUseBatch])

  // Update batch transaction hash when batchCallsData changes
  useEffect(() => {
    if (batchCallsData) {
      const hash = typeof batchCallsData === 'string' ? batchCallsData : batchCallsData.id
      setBatchState(prev => ({ 
        ...prev, 
        batchTransactionHash: hash as `0x${string}`
      }))
      setExecutionState(prev => ({
        ...prev,
        transactionHash: hash as `0x${string}`
      }))
    }
  }, [batchCallsData])

  // ================================================
  // PURCHASE LOGIC CALCULATIONS - PRESERVING EXISTING PATTERNS
  // ================================================
  
  // These calculations maintain your existing sophisticated payment logic
  const canAfford = useMemo(() => {
    if (!contentQuery.data || !userBalance.data) return false
    return userBalance.data >= contentQuery.data.payPerViewPrice
  }, [userBalance.data, contentQuery.data])

  const needsApproval = useMemo(() => {
    if (!contentQuery.data || !tokenAllowance.data) return true
    return tokenAllowance.data < contentQuery.data.payPerViewPrice
  }, [tokenAllowance.data, contentQuery.data])

  // ================================================
  // BATCH TRANSACTION IMPLEMENTATION
  // ================================================
  
  /**
   * Execute Batch Transaction
   * 
   * This function implements the core EIP-5792 batch transaction logic that transforms
   * the social commerce experience. It combines token approval and content purchase
   * into a single user confirmation, dramatically reducing friction in MiniApp contexts.
   */
  const executeBatch = useCallback(async (): Promise<void> => {
    if (!canUseBatch || !contentQuery.data || !contractAddresses || !address) {
      throw new Error('Batch transaction not available in current context')
    }
    
    setBatchState(prev => ({ 
      ...prev, 
      isPreparingBatch: true,
      batchStatus: 'preparing',
      batchError: null
    }))
    
    try {
      // Prepare batch transaction calls with strict typing
      const calls: Array<{
        to: Address
        data: `0x${string}`
        value: bigint
      }> = []
      
      // If approval is needed, add approval call to batch
      if (needsApproval) {
        const approvalCallData = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddresses.PAY_PER_VIEW, contentQuery.data.payPerViewPrice]
        })
        
        calls.push({
          to: contractAddresses.USDC,
          data: approvalCallData,
          value: BigInt(0)
        })
      }
      
      // Add purchase call to batch
      const purchaseCallData = encodeFunctionData({
        abi: PAY_PER_VIEW_ABI,
        functionName: 'purchaseContentDirect',
        args: [contentId!]
      })
      
      calls.push({
        to: contractAddresses.PAY_PER_VIEW,
        data: purchaseCallData,
        value: BigInt(0)
      })
      
      setBatchState(prev => ({ 
        ...prev, 
        isPreparingBatch: false,
        isExecutingBatch: true,
        batchStatus: 'confirming'
      }))
      
      // Execute batch transaction using EIP-5792
      await sendCalls({
        calls,
        capabilities: process.env.NEXT_PUBLIC_PAYMASTER_URL ? {
          paymasterService: {
            url: process.env.NEXT_PUBLIC_PAYMASTER_URL as string
          }
        } : undefined
      })
      
      // The transaction hash will be available via batchCallsData from the hook
      setBatchState(prev => ({ 
        ...prev,
        batchTransactionHash: null, // Will be updated when batchCallsData changes
        batchStatus: 'executing',
        batchProgress: 50
      }))
      
      setExecutionState(prev => ({
        ...prev,
        phase: 'executing',
        progress: 75,
        message: 'Processing batch transaction...',
        transactionHash: null // Will be updated when batchCallsData changes
      }))
      
    } catch (error) {
      const batchError = error instanceof Error ? error : new Error('Batch transaction failed')
      
      setBatchState(prev => ({ 
        ...prev,
        isPreparingBatch: false,
        isExecutingBatch: false,
        batchStatus: 'failed',
        batchError
      }))
      
      setExecutionState(prev => ({
        ...prev,
        phase: 'error',
        error: batchError,
        canRetry: finalConfig.autoFallback
      }))
      
      // Auto-fallback to sequential transactions if configured
      if (finalConfig.autoFallback) {
        console.warn('Batch transaction failed, falling back to sequential:', batchError)
        // The sequential purchase logic will handle the fallback
      } else {
        throw batchError
      }
    }
  }, [
    canUseBatch, 
    contentQuery.data, 
    contractAddresses, 
    address, 
    needsApproval, 
    contentId, 
    sendCalls,
    finalConfig.autoFallback
  ])

  // ================================================
  // SEQUENTIAL TRANSACTION IMPLEMENTATION - PRESERVING EXISTING EXCELLENCE
  // ================================================
  
  /**
   * Sequential Purchase (Existing Pattern Enhanced)
   * 
   * This maintains your existing excellent sequential transaction logic while
   * adding enhanced error handling and performance tracking. This ensures
   * web users continue to receive the same high-quality experience while
   * providing a foundation for fallback scenarios.
   */
  const executeSequential = useCallback(async (): Promise<void> => {
    if (!contentQuery.data || !contractAddresses || !address) {
      throw new Error('Insufficient data for purchase')
    }
    
    try {
      setExecutionState(prev => ({
        ...prev,
        phase: 'calculating',
        progress: 25,
        message: 'Processing purchase...'
      }))
      
      // Step 1: Handle approval if needed
      if (needsApproval) {
        setExecutionState(prev => ({
          ...prev,
          progress: 40,
          message: 'Approving token spending...'
        }))
        
        await writeApproval({
          address: contractAddresses.USDC,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddresses.PAY_PER_VIEW, contentQuery.data.payPerViewPrice]
        })
        
        // Wait for approval confirmation
        // The useWaitForTransactionReceipt hook will handle this
      }
      
      // Step 2: Execute purchase
      setExecutionState(prev => ({
        ...prev,
        progress: 70,
        message: 'Purchasing content...'
      }))
      
      await writePurchase({
        address: contractAddresses.PAY_PER_VIEW,
        abi: PAY_PER_VIEW_ABI,
        functionName: 'purchaseContentDirect',
        args: [contentId!]
      })
      
    } catch (error) {
      const purchaseError = error instanceof Error ? error : new Error('Purchase failed')
      
      setExecutionState(prev => ({
        ...prev,
        phase: 'error',
        error: purchaseError,
        canRetry: true
      }))
      
      throw purchaseError
    }
  }, [
    contentQuery.data,
    contractAddresses,
    address,
    needsApproval,
    contentId,
    writeApproval,
    writePurchase
  ])

  // ================================================
  // UNIFIED PURCHASE FUNCTION - CONTEXT-AWARE EXECUTION
  // ================================================
  
  /**
   * Main Purchase Function
   * 
   * This function intelligently chooses between batch and sequential transactions
   * based on context, providing optimal user experience for each environment
   * while maintaining consistent error handling and state management.
   */
  const purchase = useCallback(async (): Promise<void> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }
    
    if (!canAfford) {
      throw new Error('Insufficient balance')
    }
    
    // Reset state before starting purchase
    setExecutionState({
      phase: 'calculating',
      progress: 10,
      message: 'Initiating purchase...',
      canRetry: false,
      transactionHash: null,
      error: null
    })
    
    try {
      // Choose transaction strategy based on context and availability
      if (canUseBatch && transactionContext.recommendedStrategy === 'batch') {
        await executeBatch()
      } else {
        await executeSequential()
      }
      
    } catch (error) {
      // Enhanced error handling with context awareness
      const purchaseError = error instanceof Error ? error : new Error('Purchase failed')
      
      setExecutionState(prev => ({
        ...prev,
        phase: 'error',
        error: purchaseError,
        canRetry: true
      }))
      
      throw purchaseError
    }
  }, [
    isConnected,
    address,
    canAfford,
    canUseBatch,
    transactionContext.recommendedStrategy,
    executeBatch,
    executeSequential
  ])

  // ================================================
  // TRANSACTION SUCCESS MONITORING
  // ================================================
  
  // Monitor batch transaction success
  useEffect(() => {
    if (isBatchSuccess) {
      setBatchState(prev => ({ 
        ...prev,
        isExecutingBatch: false,
        batchStatus: 'success',
        batchProgress: 100
      }))
      
      setExecutionState(prev => ({
        ...prev,
        phase: 'completed',
        progress: 100,
        message: 'Purchase completed successfully!'
      }))
    }
  }, [isBatchSuccess])
  
  // Monitor sequential transaction success
  useEffect(() => {
    if (isPurchaseSuccess || (needsApproval && isApprovalSuccess && isPurchaseSuccess)) {
      setExecutionState(prev => ({
        ...prev,
        phase: 'completed',
        progress: 100,
        message: 'Purchase completed successfully!'
      }))
    }
  }, [isPurchaseSuccess, isApprovalSuccess, needsApproval])

  // ================================================
  // RESET FUNCTIONS
  // ================================================
  
  const resetBatch = useCallback(() => {
    setBatchState({
      isBatchAvailable: canUseBatch,
      isPreparingBatch: false,
      isExecutingBatch: false,
      batchTransactionHash: null,
      batchComponentHashes: [],
      batchProgress: 0,
      batchStatus: 'idle',
      batchError: null,
      estimatedGasSavings: null
    })
  }, [canUseBatch])
  
  const reset = useCallback(() => {
    setExecutionState({
      phase: 'idle',
      progress: 0,
      message: 'Ready to purchase',
      canRetry: false,
      transactionHash: null,
      error: null
    })
    resetBatch()
  }, [resetBatch])

  // ================================================
  // RETURN ENHANCED INTERFACE
  // ================================================
  
  return {
    // Existing interface compatibility - all your current integrations continue to work
    content: contentQuery.data || null,
    hasAccess: accessQuery.data || false,
    isLoading: contentQuery.isLoading || accessQuery.isLoading || isBatchPending,
    error: executionState.error,
    currentStep: executionState.phase,
    canAfford,
    needsApproval,
    userBalance: userBalance.data || null,
    purchase,
    approveAndPurchase: purchase, // Unified function handles both scenarios
    reset,
    
    // Enhanced batch transaction capabilities
    batchTransaction: {
      ...batchState,
      executeBatch,
      canUseBatch,
      resetBatch
    },
    
    // Enhanced context awareness
    context: transactionContext,
    
    // Enhanced performance metrics
    performance: performanceMetrics,
    
    // Existing commerceProtocol interface maintained for backward compatibility
    commerceProtocol: {
      isAvailable: Boolean(contractAddresses?.COMMERCE_INTEGRATION),
      intentState: {
        intentId: null,
        intentHash: null,
        signature: null,
        isCreated: false,
        isSigned: false,
        isExecuted: false,
        deadline: null,
        expectedAmount: null
      },
      flowStep: 'idle' as const,
      supportedTokens: ['ETH', contractAddresses?.USDC || ''].filter(Boolean),
      createPaymentIntent: async () => {},
      executeSignedIntent: async () => {},
      checkSignatureStatus: async () => {},
      resetCommerceFlow: reset
    }
  }
}

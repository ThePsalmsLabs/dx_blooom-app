/**
 * Swap Transaction Integration Hook
 * 
 * This hook bridges the gap between your Phase 1 useSwapCalculation hook
 * and the Phase 2 UI components. It provides a clean interface that connects
 * the swap execution logic with the visual progress tracking.
 * 
 * Integration Pattern:
 * - Uses your existing useSwapCalculation and useSwapExecution hooks
 * - Manages UI state through the TransactionStatusProvider
 * - Provides simplified interface for components to trigger swaps
 * - Handles automatic progress updates and error recovery
 */

import { useCallback, useEffect, useRef } from 'react'
import { useSwapExecution } from './useSwapCalculation'
import { useTransactionStatus } from '@/components/web3/SwapTransactionStatus'
import type { TokenInfo } from './useTokenBalances'

export interface SwapTransactionParams {
  fromToken: TokenInfo
  toToken: TokenInfo
  fromAmount: string
  slippageTolerance?: number
}

export interface SwapTransactionResult {
  // UI State Management
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
  
  // Swap Execution
  executeSwap: (params: SwapTransactionParams) => Promise<void>
  retrySwap: () => void
  
  // Current State
  isSwapping: boolean
  canRetry: boolean
  currentStep: string | null
  progress: number
  
  // Transaction Details
  transactionHash: string | null
  intentId: string | null
  error: string | null
}

/**
 * Main integration hook that connects Phase 1 logic with Phase 2 UI
 */
export function useSwapTransactionIntegration(): SwapTransactionResult {
  const { currentSwap, setCurrentSwap } = useTransactionStatus()
  const swapExecution = useSwapExecution()
  
  // Store the last swap parameters for retry functionality
  const lastSwapParamsRef = useRef<SwapTransactionParams | null>(null)
  const isModalOpenRef = useRef(false)
  
  /**
   * Opens the transaction status modal
   */
  const openModal = useCallback(() => {
    isModalOpenRef.current = true
  }, [])
  
  /**
   * Closes the transaction status modal and cleans up state
   */
  const closeModal = useCallback(() => {
    isModalOpenRef.current = false
    if (currentSwap?.step === 'completed' || currentSwap?.step === 'error') {
      setCurrentSwap(null)
    }
  }, [currentSwap?.step, setCurrentSwap])
  
  /**
   * Main swap execution function that integrates with your Phase 1 implementation
   */
  const executeSwap = useCallback(async (params: SwapTransactionParams) => {
    const { fromToken, toToken, fromAmount, slippageTolerance = 0.5 } = params
    
    // Store parameters for retry functionality
    lastSwapParamsRef.current = params
    
    // Open modal to show progress
    openModal()
    
    try {
      // Initialize swap state
      setCurrentSwap({
        step: 'creating_intent',
        progress: 20,
        message: `Creating swap intent: ${fromToken.symbol} → ${toToken.symbol}`,
        estimatedTimeRemaining: 180
      })
      
      console.log('🔄 Starting swap execution:', {
        from: `${fromAmount} ${fromToken.symbol}`,
        to: toToken.symbol,
        slippage: `${slippageTolerance}%`
      })
      
      // Execute the swap using your Phase 1 implementation
      const result = await swapExecution.executeSwap(
        fromToken,
        toToken,
        fromAmount,
        slippageTolerance
      )
      
      if (result.success && result.intentId) {
        // Success path - the individual steps will be updated by monitoring swapExecution.swapState
        console.log('✅ Swap execution completed successfully:', result.intentId)
      } else {
        // Handle execution failure
        throw new Error(result.error || 'Swap execution failed')
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown swap error'
      console.error('❌ Swap execution failed:', error)
      
      setCurrentSwap({
        step: 'error',
        progress: 0,
        message: 'Swap failed',
        error: errorMessage
      })
    }
  }, [swapExecution, setCurrentSwap, openModal])
  
  /**
   * Retry functionality using stored parameters
   */
  const retrySwap = useCallback(() => {
    if (lastSwapParamsRef.current) {
      executeSwap(lastSwapParamsRef.current)
    }
  }, [executeSwap])
  
  /**
   * Monitor the swapExecution state and sync with UI state
   * This keeps the UI components in sync with your Phase 1 implementation
   */
  useEffect(() => {
    const { swapState } = swapExecution
    
    if (!swapState || !isModalOpenRef.current) return
    
    // Map your Phase 1 state to Phase 2 UI state
    let uiState = currentSwap
    
    switch (swapState.step) {
      case 'creating_intent':
        uiState = {
          step: 'creating_intent',
          progress: 20,
          message: swapState.message,
          estimatedTimeRemaining: 180
        }
        break
        
      case 'extracting_intent_id':
        uiState = {
          step: 'extracting_intent_id',
          progress: 40,
          message: swapState.message,
          transactionHash: swapState.transactionHash || undefined,
          estimatedTimeRemaining: 120
        }
        break
        
      case 'waiting_signature':
        uiState = {
          step: 'waiting_signature',
          progress: 60,
          message: swapState.message,
          transactionHash: swapState.transactionHash || undefined,
          intentId: swapState.intentId || undefined,
          estimatedTimeRemaining: 60
        }
        break
        
      case 'executing_swap':
      case 'executing':
        uiState = {
          step: 'executing_swap',
          progress: 80,
          message: swapState.message,
          transactionHash: swapState.transactionHash || undefined,
          intentId: swapState.intentId || undefined,
          estimatedTimeRemaining: 30
        }
        break
        
      case 'completed':
        uiState = {
          step: 'completed',
          progress: 100,
          message: 'Swap completed successfully!',
          transactionHash: swapState.transactionHash || undefined,
          intentId: swapState.intentId || undefined
        }
        break
        
      case 'error':
        uiState = {
          step: 'error',
          progress: 0,
          message: 'Swap failed',
          error: swapState.error || 'Unknown error occurred',
          transactionHash: swapState.transactionHash || undefined,
          intentId: swapState.intentId || undefined
        }
        break
    }
    
    if (uiState && JSON.stringify(uiState) !== JSON.stringify(currentSwap)) {
      setCurrentSwap(uiState)
    }
  }, [swapExecution.swapState, currentSwap, setCurrentSwap])
  
  return {
    // UI State Management
    isModalOpen: isModalOpenRef.current,
    openModal,
    closeModal,
    
    // Swap Execution
    executeSwap,
    retrySwap,
    
    // Current State
    isSwapping: currentSwap?.step !== 'idle' && 
                currentSwap?.step !== 'completed' && 
                currentSwap?.step !== 'error',
    canRetry: currentSwap?.step === 'error' && !!lastSwapParamsRef.current,
    currentStep: currentSwap?.step || null,
    progress: currentSwap?.progress || 0,
    
    // Transaction Details
    transactionHash: currentSwap?.transactionHash || null,
    intentId: currentSwap?.intentId || null,
    error: currentSwap?.error || null
  }
}

/**
 * Simplified hook for components that just need to trigger swaps
 * without managing the full UI state
 */
export function useSimpleSwap() {
  const { executeSwap, isSwapping, error } = useSwapTransactionIntegration()
  
  return {
    swap: executeSwap,
    isSwapping,
    error
  }
}

/**
 * Hook for monitoring swap progress without triggering swaps
 * Useful for dashboard components or notifications
 */
export function useSwapProgress() {
  const { currentSwap } = useTransactionStatus()
  
  return {
    currentStep: currentSwap?.step || null,
    progress: currentSwap?.progress || 0,
    message: currentSwap?.message || null,
    isActive: currentSwap?.step !== 'idle' && 
              currentSwap?.step !== 'completed' && 
              currentSwap?.step !== 'error',
    isCompleted: currentSwap?.step === 'completed',
    hasError: currentSwap?.step === 'error',
    error: currentSwap?.error || null
  }
}

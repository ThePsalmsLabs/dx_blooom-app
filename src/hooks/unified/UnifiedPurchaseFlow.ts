/**
 * Unified Purchase Flow Hook - Aligned with Web App Patterns
 * File: src/hooks/unified/UnifiedPurchaseFlow.ts
 *
 * This hook provides a unified purchase flow that works consistently
 * across web and mini app environments, using the same patterns as
 * the web app's ContentPurchaseUI interface.
 */

'use client'

import { useCallback, useMemo, useState } from 'react'
import { type Address } from 'viem'
import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'

// Import existing business logic
import {
  useUnifiedContentPurchaseFlow,
  type PaymentMethod,
  type PaymentMethodConfig,
  type PaymentExecutionState,
  type TokenInfo
} from '@/hooks/business/workflows'
import type { Content } from '@/types/contracts'

// ================================================
// UNIFIED PURCHASE FLOW INTERFACE
// ================================================

/**
 * Unified Purchase Flow Result - Matches web app patterns
 */
export interface UnifiedPurchaseFlowResult {
  /** Purchase capabilities */
  canPurchase: boolean
  canAfford: boolean
  needsApproval: boolean

  /** Purchase actions */
  purchaseAction: () => Promise<void>
  approveAndPurchaseAction: () => Promise<void>

  /** State information */
  isProcessing: boolean
  currentStep: string

  /** Pricing and balance information */
  balanceText: string
  formattedPrice: string

  /** Success callbacks */
  onPurchaseSuccess?: (contentId: bigint) => void
  onAccessGranted?: (contentId: bigint) => void

  /** Base purchase flow properties */
  content: Content | null
  hasAccess: boolean
  isLoading: boolean
  selectedMethod: PaymentMethod
  availableMethods: readonly PaymentMethodConfig[]
  setPaymentMethod: (method: PaymentMethod) => void
  selectedToken: TokenInfo | null
  supportedTokens: readonly TokenInfo[]
  setCustomToken: (address: Address) => void
  slippageTolerance: number
  setSlippageTolerance: (slippage: number) => void
  estimatedCost: bigint | null
  finalCost: bigint | null
  executionState: PaymentExecutionState
  canExecutePayment: boolean
  executePayment: () => Promise<void>
  retryPayment: () => Promise<void>
  resetPayment: () => void
  priceImpact: number | null
  priceAlerts: readonly { type: 'warning' | 'error', message: string }[]
  refreshPrices: () => Promise<void>
}

/**
 * Unified Purchase Flow Hook
 */
export function useUnifiedPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined,
  options: {
    onPurchaseSuccess?: (contentId: bigint) => void
    onAccessGranted?: (contentId: bigint) => void
  } = {}
): UnifiedPurchaseFlowResult {
  const { state, actions, utils } = useUnifiedMiniApp()
  const { onPurchaseSuccess, onAccessGranted } = options

  // Use existing purchase flow logic
  const basePurchaseFlow = useUnifiedContentPurchaseFlow(contentId, userAddress)

  // Local state for UI feedback
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false)

  // ================================================
  // CAPABILITY CHECKS
  // ================================================

  const canPurchase = useMemo(() => {
    return Boolean(
      state.isConnected &&
      basePurchaseFlow.canExecutePayment &&
      !basePurchaseFlow.hasAccess &&
      !isProcessingPurchase
    )
  }, [
    state.isConnected,
    basePurchaseFlow.canExecutePayment,
    basePurchaseFlow.hasAccess,
    isProcessingPurchase
  ])

  const canAfford = useMemo(() => {
    if (!basePurchaseFlow.estimatedCost) return false

    // For MiniApp with batch transactions, we can be more permissive
    if (utils.isMiniApp && state.capabilities.wallet.canBatchTransactions) {
      return true // Trust the MiniApp wallet to handle balance checks
    }

    // For web, use the existing balance checking logic
    return basePurchaseFlow.canExecutePayment
  }, [
    basePurchaseFlow.estimatedCost,
    basePurchaseFlow.canExecutePayment,
    utils.isMiniApp,
    state.capabilities.wallet.canBatchTransactions
  ])

  const needsApproval = useMemo(() => {
    // In MiniApp with batch transactions, approval is handled automatically
    if (utils.isMiniApp && state.capabilities.wallet.canBatchTransactions) {
      return false
    }

    // Use existing approval logic for web
    return false // This would be determined by the orchestrator
  }, [utils.isMiniApp, state.capabilities.wallet.canBatchTransactions])

  // ================================================
  // PURCHASE ACTIONS
  // ================================================

  const purchaseAction = useCallback(async (): Promise<void> => {
    if (!canPurchase) {
      throw new Error('Purchase not available in current state')
    }

    if (!contentId) {
      throw new Error('Content ID is required for purchase')
    }

    setIsProcessingPurchase(true)

    try {
      // Execute the purchase using existing business logic
      await basePurchaseFlow.executePayment()

      // Use the unified transaction system for additional logging/tracking
      await actions.executeTransaction('purchase', {
        contentId: contentId?.toString(),
        success: true
      })

      // Trigger success callbacks
      onPurchaseSuccess?.(contentId)
      onAccessGranted?.(contentId)
    } catch (error) {
      console.error('Purchase failed:', error)
      throw error
    } finally {
      setIsProcessingPurchase(false)
    }
  }, [
    canPurchase,
    contentId,
    actions,
    basePurchaseFlow,
    onPurchaseSuccess,
    onAccessGranted
  ])

  const approveAndPurchaseAction = useCallback(async (): Promise<void> => {
    // For MiniApp with batch transactions, this is the same as purchase
    if (utils.isMiniApp && state.capabilities.wallet.canBatchTransactions) {
      return purchaseAction()
    }

    // For web, this would handle approval + purchase flow
    return purchaseAction()
  }, [purchaseAction, utils.isMiniApp, state.capabilities.wallet.canBatchTransactions])

  // ================================================
  // FORMATTED DATA
  // ================================================

  const balanceText = useMemo(() => {
    if (!state.isConnected) return 'Connect wallet to view balance'

    // This would be enhanced with actual balance data
    return 'Balance: Available'
  }, [state.isConnected])

  const formattedPrice = useMemo(() => {
    if (!basePurchaseFlow.estimatedCost) return 'Price unavailable'

    // Format using existing utility
    return `$${basePurchaseFlow.estimatedCost.toString()}`
  }, [basePurchaseFlow.estimatedCost])

  const currentStep = useMemo(() => {
    if (isProcessingPurchase) return 'Processing purchase...'
    if (basePurchaseFlow.hasAccess) return 'Content accessible'
    if (!state.isConnected) return 'Connect wallet to purchase'
    if (!canAfford) return 'Insufficient balance'
    return 'Ready to purchase'
  }, [
    isProcessingPurchase,
    basePurchaseFlow.hasAccess,
    state.isConnected,
    canAfford
  ])

  // ================================================
  // RETURN UNIFIED INTERFACE
  // ================================================

  return {
    // Base purchase flow functionality
    ...basePurchaseFlow,

    // Enhanced capabilities
    canPurchase,
    canAfford,
    needsApproval,

    // Actions
    purchaseAction,
    approveAndPurchaseAction,

    // State
    isProcessing: isProcessingPurchase || basePurchaseFlow.isLoading,
    currentStep,

    // Formatted data
    balanceText,
    formattedPrice,

    // Callbacks
    onPurchaseSuccess,
    onAccessGranted,

    // Base purchase flow properties
    content: basePurchaseFlow.content,
    hasAccess: basePurchaseFlow.hasAccess,
    isLoading: basePurchaseFlow.isLoading,
    selectedMethod: basePurchaseFlow.selectedMethod,
    availableMethods: basePurchaseFlow.availableMethods,
    setPaymentMethod: basePurchaseFlow.setPaymentMethod,
    selectedToken: basePurchaseFlow.selectedToken,
    supportedTokens: basePurchaseFlow.supportedTokens,
    setCustomToken: basePurchaseFlow.setCustomToken,
    slippageTolerance: basePurchaseFlow.slippageTolerance,
    setSlippageTolerance: basePurchaseFlow.setSlippageTolerance,
    estimatedCost: basePurchaseFlow.estimatedCost,
    finalCost: basePurchaseFlow.finalCost,
    executionState: basePurchaseFlow.executionState,
    canExecutePayment: basePurchaseFlow.canExecutePayment,
    executePayment: basePurchaseFlow.executePayment,
    retryPayment: basePurchaseFlow.retryPayment,
    resetPayment: basePurchaseFlow.resetPayment,
    priceImpact: basePurchaseFlow.priceImpact,
    priceAlerts: basePurchaseFlow.priceAlerts,
    refreshPrices: basePurchaseFlow.refreshPrices
  }
}

// ================================================
// CONVENIENCE HOOKS
// ================================================

/**
 * Hook for MiniApp-specific purchase flow with social enhancements
 */
export function useMiniAppPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined,
  options: {
    onPurchaseSuccess?: (contentId: bigint) => void
    onShareSuccess?: (contentId: bigint) => void
  } = {}
) {
  const { state, actions } = useUnifiedMiniApp()
  const baseFlow = useUnifiedPurchaseFlow(contentId, userAddress, options)

  // Enhanced with social sharing
  const enhancedPurchaseAction = useCallback(async () => {
    await baseFlow.purchaseAction()

    // Auto-share after successful purchase if social context is available
    if (state.socialContext.canShare && contentId) {
      try {
        await actions.shareContent(contentId, 'Just purchased this amazing content!')
        options.onShareSuccess?.(contentId)
      } catch (error) {
        console.warn('Auto-share failed:', error)
        // Don't fail the purchase for share errors
      }
    }
  }, [baseFlow, state.socialContext.canShare, contentId, actions, options])

  return {
    ...baseFlow,
    purchaseAction: enhancedPurchaseAction
  }
}



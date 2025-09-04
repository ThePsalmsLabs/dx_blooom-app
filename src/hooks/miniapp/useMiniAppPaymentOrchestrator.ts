/**
 * MiniApp Payment Orchestrator Integration
 * File: src/hooks/miniapp/useMiniAppPaymentOrchestrator.ts
 * 
 * This hook integrates the sophisticated usePaymentFlowOrchestrator with MiniApp contexts,
 * providing the same level of error recovery, health monitoring, and performance tracking
 * that the web app enjoys while optimizing for MiniApp-specific features.
 */

import { useCallback, useMemo } from 'react'
import { type Address } from 'viem'
import type { UnifiedUserProfile } from '@/types/unified-app'
import {
  usePaymentFlowOrchestrator,
  type OrchestratedPaymentRequest,
  type PaymentFlowOrchestratorConfig
} from '@/hooks/web3/usePaymentFlowOrchestrator'
import { useMiniAppUtils, useSocialState } from '@/contexts/UnifiedMiniAppProvider'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'

interface MiniAppPaymentConfig extends Partial<PaymentFlowOrchestratorConfig> {
  enableSocialSharing?: boolean
  enableBatchOptimization?: boolean
  trackSocialMetrics?: boolean
}

interface MiniAppPaymentResult {
  executePayment: (request: Omit<OrchestratedPaymentRequest, 'userAddress'>) => Promise<void>
  state: ReturnType<typeof usePaymentFlowOrchestrator>['state']
  canUseBatchTransactions: boolean
  socialContext: {
    canShare: boolean
    userProfile: UnifiedUserProfile | null
  }
  reset: () => void
}

export function useMiniAppPaymentOrchestrator(
  config: MiniAppPaymentConfig = {}
): MiniAppPaymentResult {
  const miniAppUtils = useMiniAppUtils()
  const socialState = useSocialState()
  const walletUI = useMiniAppWalletUI()

  // Enhanced config for MiniApp context
  const orchestratorConfig: PaymentFlowOrchestratorConfig = useMemo(() => ({
    ...config,
    callbacks: {
      ...config.callbacks,
      onPaymentCompleted: (result) => {
        config.callbacks?.onPaymentCompleted?.(result)
        
        // MiniApp-specific completion handling
        if (config.enableSocialSharing && socialState.canShare) {
          // Trigger social sharing opportunity
          console.log('Payment completed - social sharing available')
        }
        
        // Track social metrics if enabled
        if (config.trackSocialMetrics && socialState.userProfile) {
          console.log('Tracking social purchase metrics', {
            userFid: socialState.userProfile.fid,
            hasVerification: socialState.userProfile.isVerified
          })
        }
      },
      
      onUserActionRequired: async (actionType, message) => {
        // MiniApp-optimized user interaction
        if (miniAppUtils.isMiniApp) {
          // Use MiniApp-specific notification patterns
          return window.confirm(`${message}\n\nTap OK to continue.`)
        }
        return config.callbacks?.onUserActionRequired?.(actionType, message) ?? true
      }
    },
    
    debugConfig: {
      ...config.debugConfig,
      enableVerboseLogging: config.debugConfig?.enableVerboseLogging ?? true
    }
  }), [config, miniAppUtils.isMiniApp, socialState])

  // Use the sophisticated orchestrator
  const { state, executePayment: orchestratePayment, getSystemHealth: _getSystemHealth } = usePaymentFlowOrchestrator(orchestratorConfig)

  // MiniApp-aware payment execution
  const executePayment = useCallback(async (
    request: Omit<OrchestratedPaymentRequest, 'userAddress'>
  ) => {
    const userAddress = walletUI.address as Address
    if (!userAddress) {
      throw new Error('Wallet must be connected to execute payment')
    }

    const fullRequest: OrchestratedPaymentRequest = {
      ...request,
      userAddress
    }

    await orchestratePayment(fullRequest)
  }, [walletUI.address, orchestratePayment])

  // Capability detection for MiniApp
  const canUseBatchTransactions = useMemo(() => {
    return miniAppUtils.canPerformAction('batch_transaction')
  }, [miniAppUtils])

  const socialContext = useMemo(() => ({
    canShare: socialState.canShare,
    userProfile: socialState.userProfile ? {
      ...socialState.userProfile,
      connectionStatus: 'connected' as const,
      userRole: 'user' as const,
      isRegisteredCreator: false,
      capabilities: {
        canCreateContent: false,
        canPurchaseContent: true,
        canShareSocially: socialState.canShare,
        canUseBatchTransactions: false
      }
    } : null
  }), [socialState])

  const reset = useCallback(() => {
    // Reset orchestrator state
    // Note: This would need to be implemented in the orchestrator
    console.log('Reset payment state')
  }, [])

  return {
    executePayment,
    state,
    canUseBatchTransactions,
    socialContext,
    reset
  }
}

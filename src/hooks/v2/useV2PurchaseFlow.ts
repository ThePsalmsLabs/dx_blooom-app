/**
 * V2 Purchase Flow Hook - Complete Implementation with Signature Support
 * 
 * This hook implements the full V2 payment flow including EIP-712 signature signing.
 * It manages the complete workflow: intent creation → signature → execution.
 */

'use client'

import { useCallback, useMemo, useState } from 'react'
import { type Address, type Hash } from 'viem'
import { useAccount } from 'wagmi'

// V2 Hooks - using actual implementations
import { useV2PaymentOrchestrator } from '@/hooks/contracts/v2/unified/useV2PaymentOrchestrator'
import { useSignatureManager, type PaymentIntentData } from '@/hooks/contracts/v2/managers/useSignatureManager'
import { useContentPricing } from '@/hooks/contracts/v2/managers/usePriceOracle'
import { useContentAccess } from '@/hooks/contracts/v2/managers/useAccessManager'

// Types for V2 payment flow
export type V2PaymentMethod = 'quickPurchase' | 'signedIntent' | 'batchTransaction'

export interface V2PaymentMethodConfig {
  method: V2PaymentMethod
  enabled: boolean
  gasEstimate?: bigint
  requiresSignature: boolean
  description: string
}

export interface V2PaymentExecutionState {
  isExecuting: boolean
  currentStep: string
  progress: number // 0-100
  error?: string
  intentId?: `0x${string}`
  signature?: `0x${string}`
  transactionHash?: Hash
}

export interface V2PaymentFlowResult {
  // Purchase capabilities
  canPurchase: boolean
  hasAccess: boolean
  isLoading: boolean
  
  // V2 Payment methods
  paymentMethods: V2PaymentMethodConfig[]
  
  // Purchase execution
  executePurchase: (method?: V2PaymentMethod) => Promise<Hash>
  executeSignedPurchase: (intentData: PaymentIntentData) => Promise<{ signature: string; transactionHash: Hash }>
  
  // State information
  executionState: V2PaymentExecutionState
  isPending: boolean
  error: Error | null
  
  // V2 specific features
  isV2Enhanced: true
  signatureRequired: boolean
}

/**
 * Complete V2 Purchase Flow Hook with Signature Support
 */
export function useV2PurchaseFlow(contentId: bigint, creator: Address): V2PaymentFlowResult {
  const { address: userAddress } = useAccount()
  
  // State management
  const [executionState, setExecutionState] = useState<V2PaymentExecutionState>({
    isExecuting: false,
    currentStep: '',
    progress: 0
  })
  
  // V2 Hooks
  const orchestrator = useV2PaymentOrchestrator()
  const { quickPurchase, createIntentStep, executePaymentStep } = orchestrator
  const signatureManager = useSignatureManager()
  const { createPaymentIntentSignature, provideIntentSignature } = signatureManager
  const { hasAccess, isLoading: accessLoading, error: accessError } = useContentAccess(contentId)
  
  // Real-time pricing using PriceOracle
  const standardUSDCPrice = BigInt(1000000) // 1 USDC base price (6 decimals)
  const pricing = useContentPricing(standardUSDCPrice)
  
  // V2 Payment method configurations
  const paymentMethods: V2PaymentMethodConfig[] = useMemo(() => [
    {
      method: 'quickPurchase',
      enabled: true,
      gasEstimate: BigInt(150000),
      requiresSignature: false,
      description: 'Simple V2 payment without explicit signing'
    },
    {
      method: 'signedIntent',
      enabled: true,
      gasEstimate: BigInt(200000),
      requiresSignature: true,
      description: 'EIP-712 signed payment intent'
    },
    {
      method: 'batchTransaction',
      enabled: true,
      gasEstimate: BigInt(250000),
      requiresSignature: true,
      description: 'Batch transaction with signature'
    }
  ], [])

  // Check if user can purchase
  const canPurchase = useMemo(() => 
    !!userAddress && !hasAccess && !accessLoading && !!creator
  , [userAddress, hasAccess, accessLoading, creator])

  // Quick purchase method (V2 simplified)
  const executeQuickPurchase = useCallback(async (): Promise<Hash> => {
    if (!userAddress || hasAccess) {
      throw new Error('Cannot execute purchase')
    }

    setExecutionState({
      isExecuting: true,
      currentStep: 'Processing V2 quick purchase...',
      progress: 50
    })

    try {
      await quickPurchase.mutateAsync({
        creator,
        contentId
      })

      // Get transaction hash from commerce core - wait a moment for it to be available
      await new Promise(resolve => setTimeout(resolve, 100))
      const transactionHash = orchestrator.commerceCore.hash

      setExecutionState({
        isExecuting: false,
        currentStep: 'Purchase completed',
        progress: 100,
        transactionHash: transactionHash || '0x0' as Hash
      })

      return transactionHash || '0x0' as Hash
    } catch (error) {
      setExecutionState({
        isExecuting: false,
        currentStep: 'Purchase failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }, [userAddress, hasAccess, creator, contentId, quickPurchase])

  // Signed intent purchase method (Complete V2 flow)
  const executeSignedPurchase = useCallback(async (intentData: PaymentIntentData): Promise<{ signature: string; transactionHash: Hash }> => {
    if (!userAddress) {
      throw new Error('User not connected')
    }

    setExecutionState({
      isExecuting: true,
      currentStep: 'Creating payment intent...',
      progress: 20,
      intentId: intentData.intentId
    })

    try {
      // Step 1: Create payment intent
      await createIntentStep.mutateAsync({
        paymentType: intentData.paymentType,
        creator: intentData.creator,
        contentId: intentData.contentId,
        paymentToken: intentData.paymentToken
      })

      setExecutionState(prev => ({
        ...prev,
        currentStep: 'Creating EIP-712 signature...',
        progress: 40
      }))

      // Step 2: Create EIP-712 signature
      const signature = await createPaymentIntentSignature.mutateAsync(intentData)

      setExecutionState(prev => ({
        ...prev,
        currentStep: 'Submitting signature to contract...',
        progress: 60,
        signature: signature as `0x${string}`
      }))

      // Step 3: Provide signature to contract
      await provideIntentSignature.mutateAsync({
        intentId: intentData.intentId,
        signature: signature as `0x${string}`,
        signer: userAddress
      })

      setExecutionState(prev => ({
        ...prev,
        currentStep: 'Executing payment...',
        progress: 80
      }))

      // Step 4: Execute payment with signature
      await executePaymentStep.mutateAsync(intentData.intentId)
      
      // Get transaction hash from orchestrator state
      await new Promise(resolve => setTimeout(resolve, 100))
      const transactionHash = orchestrator.commerceCore.hash || signatureManager.hash || '0x0' as Hash

      setExecutionState({
        isExecuting: false,
        currentStep: 'Payment completed successfully',
        progress: 100,
        intentId: intentData.intentId,
        signature: signature as `0x${string}`,
        transactionHash
      })

      return {
        signature,
        transactionHash
      }

    } catch (error) {
      setExecutionState(prev => ({
        ...prev,
        isExecuting: false,
        currentStep: 'Payment failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      throw error
    }
  }, [userAddress, createIntentStep, createPaymentIntentSignature, provideIntentSignature, executePaymentStep])

  // Main purchase execution function
  const executePurchase = useCallback(async (method: V2PaymentMethod = 'quickPurchase'): Promise<Hash> => {
    switch (method) {
      case 'quickPurchase':
        return executeQuickPurchase()
      
      case 'signedIntent':
      case 'batchTransaction':
        // For signed methods, we need to create proper intent data
        const intentData: PaymentIntentData = {
          intentId: `0x${Date.now().toString(16).padStart(32, '0')}` as `0x${string}`, // Generate unique ID
          user: userAddress!,
          creator,
          paymentType: 0, // PayPerView
          contentId,
          amount: pricing.usdcPrice || standardUSDCPrice, // Use real pricing or fallback
          paymentToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
          nonce: BigInt(0) // Should be fetched from contract
        }
        
        const result = await executeSignedPurchase(intentData)
        return result.transactionHash
      
      default:
        throw new Error(`Unsupported payment method: ${method}`)
    }
  }, [executeQuickPurchase, executeSignedPurchase, userAddress, creator, contentId])

  // Check if signature is required
  const signatureRequired = useMemo(() => 
    paymentMethods.some(method => method.requiresSignature && method.enabled)
  , [paymentMethods])

  return {
    // Purchase capabilities
    canPurchase,
    hasAccess: hasAccess || false,
    isLoading: accessLoading,
    
    // V2 Payment methods
    paymentMethods,
    
    // Purchase execution
    executePurchase,
    executeSignedPurchase,
    
    // State information
    executionState,
    isPending: executionState.isExecuting || quickPurchase.isPending,
    error: (executionState.error ? new Error(executionState.error) : null) || accessError || null,
    
    // V2 specific features
    isV2Enhanced: true,
    signatureRequired
  }
}

/**
 * Simplified V2 purchase hook for basic use cases
 */
export function useSimpleV2Purchase(contentId: bigint, creator: Address) {
  const purchaseFlow = useV2PurchaseFlow(contentId, creator)
  
  return {
    purchase: purchaseFlow.executePurchase,
    hasAccess: purchaseFlow.hasAccess,
    isLoading: purchaseFlow.isLoading,
    isPending: purchaseFlow.isPending,
    canPurchase: purchaseFlow.canPurchase,
    error: purchaseFlow.error,
    
    // V2 specific
    isV2Enhanced: true,
    executionState: purchaseFlow.executionState
  }
}

export default useV2PurchaseFlow
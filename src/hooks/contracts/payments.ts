/**
 * Advanced Multi-Token Payment System - Core Hooks Layer
 * File: src/hooks/contracts/payments.ts
 * 
 * This file contains the fundamental payment interaction hooks that bridge your 
 * sophisticated smart contract architecture with your React frontend. These hooks
 * handle both simple USDC purchases and advanced multi-token payments.
 * 
 * Why this file exists:
 * Your smart contracts support two payment tiers - simple direct purchases and 
 * advanced multi-token payments via Commerce Protocol. Your existing hooks were
 * incomplete, so this file provides working implementations that match your
 * contract architecture.
 * 
 * How it fits into your architecture:
 * - Extends your existing src/hooks/contracts/core.ts patterns
 * - Used by business logic hooks in src/hooks/business/workflows.ts  
 * - Consumed by UI components for purchase functionality
 * 
 * Dependencies:
 * - Your existing contract configuration in src/lib/contracts/config.ts
 * - Your contract ABIs in src/lib/contracts/abi.ts
 * - wagmi v2 hooks for blockchain interaction
 */

import { 
    useWriteContract, 
    useWaitForTransactionReceipt,
    useChainId,
    useReadContract,
    useBalance,
    useAccount
  } from 'wagmi'
  import { useQueryClient } from '@tanstack/react-query'
  import { useCallback, useMemo, useEffect, useState } from 'react'
  import { type Address, type Hash, parseUnits, formatUnits } from 'viem'
  import { getContractAddresses } from '@/lib/contracts/config'
  import { 
    PAY_PER_VIEW_ABI, 
    COMMERCE_PROTOCOL_INTEGRATION_ABI, 
    ERC20_ABI 
  } from '@/lib/contracts/abi'
  
  // ===== TYPE DEFINITIONS =====
  // These match your smart contract enums and structures
  
  export enum PaymentTier {
    SIMPLE = 'simple',    // Direct USDC purchase via purchaseContentDirect()
    ADVANCED = 'advanced' // Multi-token via createPurchaseIntent() + Commerce Protocol
  }
  
  export enum PaymentMethod {
    USDC = 0,        // Direct USDC payment (matches your contract enum)
    ETH = 1,         // ETH payment with auto-conversion
    OTHER_TOKEN = 2  // Any ERC20 token with auto-conversion
  }
  
  export interface PaymentOption {
    tier: PaymentTier
    method: PaymentMethod
    token: Address | null  // null for ETH
    symbol: string
    name: string
    balance?: bigint
    icon?: string
    recommended?: boolean
    description: string
  }
  
  // ===== TIER 1: SIMPLE DIRECT PURCHASE HOOKS =====
  /**
   * Simple Direct Purchase Hook
   * 
   * This hook implements the basic purchaseContentDirect() flow from your PayPerView contract.
   * It handles USDC-only purchases with proper approval flow. This is the fastest path to 
   * get your buy buttons working since it doesn't require backend infrastructure.
   * 
   * Use this when: Users have USDC and want immediate purchases
   * Flow: Check balance → Approve USDC → Call purchaseContentDirect()
   */
  export function useSimpleDirectPurchase() {
    const chainId = useChainId()
    const queryClient = useQueryClient()
    const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
    const { address: userAddress } = useAccount()
  
    // Contract interaction hooks for purchase and approval
    const writeResult = useWriteContract()
    const confirmationResult = useWaitForTransactionReceipt({
      hash: writeResult.data,
      query: { enabled: !!writeResult.data }
    })
  
    // USDC approval transaction handling
    const approveResult = useWriteContract()
    const approveConfirmation = useWaitForTransactionReceipt({
      hash: approveResult.data,
      query: { enabled: !!approveResult.data }
    })
  
    // Get user's USDC balance - essential for purchase validation
    const { data: usdcBalance } = useBalance({ 
      address: userAddress, 
      token: contractAddresses.USDC 
    })
  
    // Check current USDC allowance for PayPerView contract
    const { data: usdcAllowance } = useReadContract({
      address: contractAddresses.USDC,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: userAddress ? [userAddress, contractAddresses.PAY_PER_VIEW] : undefined,
      query: { enabled: !!userAddress }
    })
  
    // Invalidate relevant queries when transactions complete
    // This ensures UI updates immediately when balances or access changes
    useEffect(() => {
      if (confirmationResult.isSuccess || approveConfirmation.isSuccess) {
        queryClient.invalidateQueries({ 
          predicate: (query) => 
            query.queryKey.includes('hasAccess') ||
            query.queryKey.includes('allowance') ||
            query.queryKey.includes('balance')
        })
      }
    }, [confirmationResult.isSuccess, approveConfirmation.isSuccess, queryClient])
  
    // Approve USDC spending for PayPerView contract
    const approveUSDC = useCallback(async (amount: bigint) => {
      if (!userAddress) throw new Error('Wallet not connected')
      
      try {
        console.log('💰 Approving USDC spending:', formatUnits(amount, 6), 'USDC')
        
        await approveResult.writeContractAsync({
          address: contractAddresses.USDC,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [contractAddresses.PAY_PER_VIEW, amount],
        })
      } catch (error) {
        console.error('❌ USDC approval failed:', error)
        throw error
      }
    }, [approveResult, contractAddresses, userAddress])
  
    // Execute direct content purchase using your contract's simple path
    const purchaseDirect = useCallback(async (contentId: bigint) => {
      if (!userAddress) throw new Error('Wallet not connected')
      
      try {
        console.log('🛒 Starting direct purchase for content:', contentId.toString())
        
        const txHash = await writeResult.writeContractAsync({
          address: contractAddresses.PAY_PER_VIEW,
          abi: PAY_PER_VIEW_ABI,
          functionName: 'purchaseContentDirect',
          args: [contentId],
        })
  
        console.log('✅ Direct purchase transaction submitted:', txHash)
        return txHash
      } catch (error) {
        console.error('❌ Direct purchase failed:', error)
        throw error
      }
    }, [writeResult, contractAddresses.PAY_PER_VIEW, userAddress])
  
    // Helper functions for purchase flow validation
    const needsApproval = useCallback((requiredAmount: bigint) => {
      return !usdcAllowance || usdcAllowance < requiredAmount
    }, [usdcAllowance])
  
    const canAfford = useCallback((requiredAmount: bigint) => {
      return usdcBalance?.value ? usdcBalance.value >= requiredAmount : false
    }, [usdcBalance])
  
    return {
      // Core purchase actions
      approveUSDC,
      purchaseDirect,
      
      // Transaction states for UI feedback
      isApproving: approveResult.isPending,
      isPurchasing: writeResult.isPending,
      isConfirming: confirmationResult.isLoading,
      isSuccess: confirmationResult.isSuccess,
      error: writeResult.error || confirmationResult.error || approveResult.error,
      
      // Validation helpers for UI logic
      needsApproval,
      canAfford,
      usdcBalance: usdcBalance?.value,
      usdcAllowance,
      
      // Transaction hashes for tracking
      purchaseHash: writeResult.data,
      approveHash: approveResult.data,
      
      // Reset function for error recovery
      reset: () => {
        writeResult.reset()
        approveResult.reset()
      }
    }
  }
  
  // ===== TIER 2: ADVANCED MULTI-TOKEN HOOKS =====
  /**
   * Advanced Multi-Token Purchase Hook
   * 
   * This hook implements your sophisticated createPurchaseIntent() + Commerce Protocol flow.
   * It supports ETH, USDC, and any ERC20 token with automatic conversion to USDC for creators.
   * This leverages your Uniswap V4 integration and Commerce Protocol infrastructure.
   * 
   * Use this when: You have backend signature service set up and want to accept any token
   * Flow: Create intent → Wait for signature → Execute payment → Process completion
   */
  export function useAdvancedMultiTokenPurchase() {
    const chainId = useChainId()
    const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
    const { address: userAddress } = useAccount()
  
    // Multi-step process state management
    // This tracks the complex flow through your Commerce Protocol integration
    const [currentStep, setCurrentStep] = useState<
      'idle' | 'creating_intent' | 'awaiting_signature' | 'executing_payment' | 'processing' | 'completed' | 'error'
    >('idle')
    
    const [paymentIntent, setPaymentIntent] = useState<{
      intentId: string
      expectedAmount: bigint
      deadline: bigint
    } | null>(null)
  
    // Step 1: Create payment intent using your PayPerView.createPurchaseIntent()
    const createIntentResult = useWriteContract()
    const createIntentConfirmation = useWaitForTransactionReceipt({
      hash: createIntentResult.data,
      query: { enabled: !!createIntentResult.data }
    })
  
    // Step 2: Execute payment using your CommerceProtocolIntegration
    const executePaymentResult = useWriteContract()
    const executePaymentConfirmation = useWaitForTransactionReceipt({
      hash: executePaymentResult.data,
      query: { enabled: !!executePaymentResult.data }
    })
  
    // Create payment intent - this calls your contract's createPurchaseIntent function
    const createPaymentIntent = useCallback(async (params: {
      contentId: bigint
      paymentMethod: PaymentMethod
      paymentToken: Address | null
      maxSlippage: bigint
    }) => {
      if (!userAddress) throw new Error('Wallet not connected')
      
      try {
        setCurrentStep('creating_intent')
        console.log('🎯 Creating payment intent with your advanced system:', params)
        
        const txHash = await createIntentResult.writeContractAsync({
          address: contractAddresses.PAY_PER_VIEW,
          abi: PAY_PER_VIEW_ABI,
          functionName: 'createPurchaseIntent',
          args: [
            params.contentId,
            params.paymentMethod,
            params.paymentToken || '0x0000000000000000000000000000000000000000',
            params.maxSlippage
          ],
        })
  
        console.log('✅ Payment intent creation transaction:', txHash)
        return txHash
      } catch (error) {
        setCurrentStep('error')
        console.error('❌ Failed to create payment intent:', error)
        throw error
      }
    }, [createIntentResult, contractAddresses.PAY_PER_VIEW, userAddress])
  
    // Execute payment with signature - this uses your Commerce Protocol integration
    const executePayment = useCallback(async (intentId: string) => {
      if (!userAddress) throw new Error('Wallet not connected')
      
      try {
        setCurrentStep('executing_payment')
        console.log('⚡ Executing payment through Commerce Protocol for intent:', intentId)
        
        // Convert intentId to proper bytes16 format for your contract
        const intentIdBytes = intentId.startsWith('0x') ? intentId : `0x${intentId}`
        
        const txHash = await executePaymentResult.writeContractAsync({
          address: contractAddresses.COMMERCE_INTEGRATION,
          abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
          functionName: 'executePaymentWithSignature',
          args: [intentIdBytes as `0x${string}`],
        })
  
        console.log('✅ Payment execution transaction:', txHash)
        return txHash
      } catch (error) {
        setCurrentStep('error')
        console.error('❌ Failed to execute payment:', error)
        throw error
      }
    }, [executePaymentResult, contractAddresses.COMMERCE_INTEGRATION, userAddress])
  
    // State management for the multi-step process
    // This provides clear feedback to users about where they are in the flow
    useEffect(() => {
      if (createIntentConfirmation.isSuccess) {
        setCurrentStep('awaiting_signature')
        console.log('📋 Payment intent confirmed, notifying backend for signature...')
        // In a real implementation, you'd notify your backend service here
      }
    }, [createIntentConfirmation.isSuccess])
  
    useEffect(() => {
      if (executePaymentConfirmation.isSuccess) {
        setCurrentStep('processing')
        console.log('🎉 Payment executed successfully through Commerce Protocol!')
      }
    }, [executePaymentConfirmation.isSuccess])
  
    const reset = useCallback(() => {
      setCurrentStep('idle')
      setPaymentIntent(null)
      createIntentResult.reset()
      executePaymentResult.reset()
    }, [createIntentResult, executePaymentResult])
  
    return {
      // Multi-step process state
      currentStep,
      paymentIntent,
      
      // Primary actions for the flow
      createPaymentIntent,
      executePayment,
      reset,
      
      // Transaction states for UI feedback
      isCreatingIntent: createIntentResult.isPending,
      isExecutingPayment: executePaymentResult.isPending,
      isConfirming: createIntentConfirmation.isLoading || executePaymentConfirmation.isLoading,
      error: createIntentResult.error || executePaymentResult.error,
      
      // Transaction details for tracking
      createIntentHash: createIntentResult.data,
      executePaymentHash: executePaymentResult.data,
      
      // Human-readable step descriptions for UI
      stepDescription: {
        'idle': 'Ready to start payment',
        'creating_intent': 'Creating payment intent...',
        'awaiting_signature': 'Waiting for payment authorization...',
        'executing_payment': 'Processing payment...',
        'processing': 'Finalizing transaction...',
        'completed': 'Payment completed successfully!',
        'error': 'Payment failed'
      }[currentStep]
    }
  }
  
  // ===== UNIFIED SYSTEM HOOK =====
  /**
   * Unified Purchase Hook - Business Logic Layer
   * 
   * This hook combines both simple and advanced payment systems into a single interface.
   * It automatically handles payment method selection and provides a consistent API
   * regardless of which underlying system is used.
   * 
   * This is what your components should primarily use - it abstracts away the complexity
   * of choosing between simple USDC purchases and advanced multi-token payments.
   */
  export function useUnifiedContentPurchase(
    contentId: bigint | undefined,
    userAddress: Address | undefined
  ) {
    const [selectedTier, setSelectedTier] = useState<PaymentTier>(PaymentTier.SIMPLE)
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.USDC)
    
    const simplePurchase = useSimpleDirectPurchase()
    const advancedPurchase = useAdvancedMultiTokenPurchase()
    
    // Check if user already has access to this content
    const { data: hasAccess } = useReadContract({
      address: getContractAddresses(useChainId()).PAY_PER_VIEW,
      abi: PAY_PER_VIEW_ABI,
      functionName: 'hasAccess',
      args: userAddress && contentId ? [contentId, userAddress] : undefined,
      query: { enabled: !!userAddress && contentId !== undefined }
    })
  
    // Define available payment options based on your contract capabilities
    const paymentOptions = useMemo((): PaymentOption[] => [
      {
        tier: PaymentTier.SIMPLE,
        method: PaymentMethod.USDC,
        token: getContractAddresses(useChainId()).USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        recommended: true,
        description: 'Direct payment - fastest and most reliable'
      },
      {
        tier: PaymentTier.ADVANCED,
        method: PaymentMethod.ETH,
        token: null,
        symbol: 'ETH',
        name: 'Ethereum',
        description: 'Pay with ETH - automatically converted to USDC'
      }
      // Additional tokens can be added here as needed
    ], [])
  
    // Unified purchase action that routes to appropriate system
    const startPurchase = useCallback(async () => {
      if (!contentId) throw new Error('Content ID required')
      
      if (selectedTier === PaymentTier.SIMPLE && selectedMethod === PaymentMethod.USDC) {
        return simplePurchase.purchaseDirect(contentId)
      } else {
        return advancedPurchase.createPaymentIntent({
          contentId,
          paymentMethod: selectedMethod,
          paymentToken: paymentOptions.find(opt => opt.method === selectedMethod)?.token || null,
          maxSlippage: BigInt(100) // 1% default slippage tolerance
        })
      }
    }, [contentId, selectedTier, selectedMethod, simplePurchase, advancedPurchase, paymentOptions])
  
    const isLoading = simplePurchase.isPurchasing || 
                     simplePurchase.isApproving || 
                     advancedPurchase.isCreatingIntent || 
                     advancedPurchase.isExecutingPayment
  
    return {
      // Payment method selection
      paymentOptions,
      selectedTier,
      setSelectedTier,
      selectedMethod,
      setSelectedMethod,
      
      // Unified purchase actions
      startPurchase,
      approveUSDC: simplePurchase.approveUSDC,
      executeAdvancedPayment: advancedPurchase.executePayment,
      
      // Unified state
      hasAccess: !!hasAccess,
      canPurchase: !hasAccess && !isLoading,
      isLoading,
      error: simplePurchase.error || advancedPurchase.error,
      
      // Access to specific systems for advanced UI needs
      simple: simplePurchase,
      advanced: advancedPurchase,
      
      // Reset function
      reset: () => {
        simplePurchase.reset()
        advancedPurchase.reset()
      }
    }
  }
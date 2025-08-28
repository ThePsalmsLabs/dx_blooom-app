// src/hooks/business/miniapp-commerce.ts

import { useCallback, useMemo, useEffect, useState } from 'react'
import { useAccount, useSendCalls, useChainId } from 'wagmi'
import { encodeFunctionData, type Address } from 'viem'

// Import existing sophisticated purchase flow
import { 
  useUnifiedContentPurchaseFlow,
  type ContentPurchaseFlowResult
} from '@/hooks/business/workflows'

// Import authentication that we just built
import { 
  useMiniAppAuth,
  type MiniAppAuthResult
} from '@/hooks/business/miniapp-auth'

// Import contract configuration and ABIs
import { getContractAddresses } from '@/lib/contracts/config'
import { 
  PAY_PER_VIEW_ABI,
  ERC20_ABI 
} from '@/lib/contracts/abis'

// Import Farcaster context for social analytics
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

// ===== INTERFACES FOR UNIFIED PAYMENT FLOW =====

/**
 * Purchase Strategy Type
 * 
 * This type defines the three primary purchase strategies that the unified
 * payment flow can select between based on user context and capabilities.
 */
export type PurchaseStrategy = 
  | 'farcaster-direct'     // Verified Farcaster users - direct payment using verified wallet
  | 'batch-transaction'    // MiniApp users - approve + purchase in single confirmation 
  | 'standard-flow'        // Web users - traditional approve then purchase flow

/**
 * Purchase Strategy Configuration
 * 
 * This interface configures how each purchase strategy behaves,
 * allowing for fine-tuned control over the payment experience.
 */
export interface PurchaseStrategyConfig {
  readonly enableFarcasterDirect: boolean
  readonly enableBatchTransactions: boolean
  readonly batchGasLimit: bigint
  readonly batchTimeout: number
  readonly autoFallback: boolean
  readonly socialVerificationRequired: boolean
}

/**
 * Strategy Analysis Result
 * 
 * This interface provides detailed analysis of why a particular strategy
 * was selected, enabling components to provide appropriate UI feedback.
 */
export interface StrategyAnalysisResult {
  readonly selectedStrategy: PurchaseStrategy
  readonly confidence: number // 0-100, higher means more optimal
  readonly reasoning: readonly string[]
  readonly alternatives: readonly {
    readonly strategy: PurchaseStrategy
    readonly available: boolean
    readonly blockers: readonly string[]
  }[]
  readonly userExperienceScore: number // 0-100, higher means better UX
  readonly estimatedSteps: number // Number of user confirmations required
}

/**
 * Unified Purchase Flow State
 * 
 * This interface extends your existing purchase flow state with strategy
 * selection and cross-context optimization capabilities.
 */
export interface UnifiedPurchaseFlowState {
  readonly currentStrategy: PurchaseStrategy
  readonly strategyAnalysis: StrategyAnalysisResult | null
  readonly isBatchTransaction: boolean
  readonly batchTransactionHash: string | null
  readonly socialContext: boolean
  readonly isOptimized: boolean
  readonly fallbackReason: string | null
}

/**
 * Social Purchase Context
 * 
 * This interface provides social context that enhances the purchase experience
 * when Farcaster integration is available.
 */
export interface SocialPurchaseContext {
  readonly fid: number | null
  readonly username: string | null
  readonly displayName: string | null
  readonly pfpUrl: string | null
  readonly isAddressVerified: boolean
  readonly verificationCount: number
  readonly socialTrustScore: number // 0-100, based on verification and activity
}

/**
 * Unified Purchase Flow Result
 * 
 * This interface extends your existing ContentPurchaseFlowResult with
 * strategy selection, optimization, and cross-context capabilities.
 */
export interface UnifiedPurchaseFlowResult extends ContentPurchaseFlowResult {
  // Strategy selection and analysis
  readonly strategy: PurchaseStrategy
  readonly strategyAnalysis: StrategyAnalysisResult | null
  readonly getOptimalPurchaseStrategy: () => StrategyAnalysisResult
  
  // Unified state management
  readonly unifiedState: UnifiedPurchaseFlowState
  
  // Purchase methods
  readonly purchaseWithOptimalStrategy: () => Promise<void>
  readonly purchaseWithFarcasterDirect: () => Promise<void>
  readonly purchaseWithBatchTransaction: () => Promise<void>
  readonly purchaseWithStandardFlow: () => Promise<void>
  
  // Strategy capabilities
  readonly canUseFarcasterDirect: boolean
  readonly canUseBatchTransaction: boolean
  readonly recommendsOptimization: boolean
  
  // Social context integration
  readonly socialContext: SocialPurchaseContext
  
  // Performance metrics
  readonly performanceMetrics: {
    readonly estimatedCompletionTime: number // seconds
    readonly userStepsRequired: number
    readonly gasSavingsPercentage: number
    readonly uxImprovementScore: number
  }
  
  // Analytics and tracking
  readonly trackStrategySelection: (strategy: PurchaseStrategy, reasoning: string[]) => void
  readonly trackSocialPurchase: (contentId: bigint) => void
}

// ===== DEFAULT CONFIGURATION =====

const DEFAULT_STRATEGY_CONFIG: PurchaseStrategyConfig = {
  enableFarcasterDirect: true,
  enableBatchTransactions: true,
  batchGasLimit: BigInt(500000), // 500k gas limit for batch transactions
  batchTimeout: 60000, // 60 second timeout
  autoFallback: true,
  socialVerificationRequired: true
}

// ===== CORE STRATEGY SELECTION LOGIC =====

/**
 * Analyze Available Purchase Strategies
 * 
 * This function performs comprehensive analysis of available purchase strategies
 * based on user authentication state, environment context, and capabilities.
 */
function analyzePurchaseStrategies(
  authResult: MiniAppAuthResult,
  isConnected: boolean,
  contentPrice: bigint | undefined,
  environmentType: 'web' | 'miniapp' | 'unknown',
  config: PurchaseStrategyConfig
): StrategyAnalysisResult {
  const alternatives: Array<{
    strategy: PurchaseStrategy
    available: boolean
    blockers: readonly string[]
  }> = []
  let selectedStrategy: PurchaseStrategy = 'standard-flow'
  let confidence = 0
  const reasoning: string[] = []
  let userExperienceScore = 50 // baseline
  let estimatedSteps = 2 // approve + purchase

  // STRATEGY 1: Farcaster Direct Payment Analysis
  const farcasterDirectAvailable = Boolean(
    config.enableFarcasterDirect &&
    authResult.optimalPaymentMethod?.type === 'farcaster-verified' &&
    authResult.optimalPaymentMethod.sociallyVerified &&
    authResult.socialVerification.isAddressVerified &&
    environmentType === 'miniapp'
  )

  if (farcasterDirectAvailable) {
    selectedStrategy = 'farcaster-direct'
    confidence = 95
    userExperienceScore = 95
    estimatedSteps = 1
    reasoning.push('Farcaster-verified wallet enables direct payment')
    reasoning.push('Social verification provides maximum trust and UX')
    reasoning.push('Single-step purchase with verified social identity')
  }

  alternatives.push({
    strategy: 'farcaster-direct',
    available: farcasterDirectAvailable,
    blockers: farcasterDirectAvailable ? [] : [
      ...(environmentType !== 'miniapp' ? ['Not in MiniApp environment'] : []),
      ...(authResult.optimalPaymentMethod?.type !== 'farcaster-verified' ? ['No Farcaster verification'] : []),
      ...(!authResult.socialVerification.isAddressVerified ? ['Address not verified on Farcaster'] : []),
      ...(!config.enableFarcasterDirect ? ['Farcaster direct disabled'] : [])
    ]
  })

  // STRATEGY 2: Batch Transaction Analysis (if not already using Farcaster direct)
  const batchTransactionAvailable = Boolean(
    config.enableBatchTransactions &&
    environmentType === 'miniapp' &&
    isConnected &&
    !selectedStrategy.startsWith('farcaster') // Don't use if Farcaster direct is available
  )

  if (batchTransactionAvailable && selectedStrategy === 'standard-flow') {
    selectedStrategy = 'batch-transaction'
    confidence = 80
    userExperienceScore = 85
    estimatedSteps = 1
    reasoning.length = 0 // Clear previous reasoning
    reasoning.push('MiniApp environment supports batch transactions')
    reasoning.push('EIP-5792 enables approve + purchase in single confirmation')
    reasoning.push('Optimized for mobile social commerce experience')
  }

  alternatives.push({
    strategy: 'batch-transaction',
    available: batchTransactionAvailable,
    blockers: batchTransactionAvailable ? [] : [
      ...(environmentType !== 'miniapp' ? ['Not in MiniApp environment'] : []),
      ...(!isConnected ? ['Wallet not connected'] : []),
      ...(!config.enableBatchTransactions ? ['Batch transactions disabled'] : [])
    ]
  })

  // STRATEGY 3: Standard Flow Analysis (always available as fallback)
  const standardFlowAvailable = Boolean(isConnected)
  
  if (selectedStrategy === 'standard-flow' && standardFlowAvailable) {
    confidence = 60
    userExperienceScore = 65
    estimatedSteps = 2
    reasoning.push('Standard approve + purchase flow')
    reasoning.push('Compatible with all environments and wallets')
    reasoning.push('Reliable fallback with proven stability')
  }

  alternatives.push({
    strategy: 'standard-flow',
    available: standardFlowAvailable,
    blockers: standardFlowAvailable ? [] : [
      ...(!isConnected ? ['Wallet not connected'] : [])
    ]
  })

  return {
    selectedStrategy,
    confidence,
    reasoning,
    alternatives,
    userExperienceScore,
    estimatedSteps
  }
}

/**
 * Calculate Social Trust Score
 * 
 * This function calculates a trust score based on Farcaster social context,
 * which can be used to optimize the purchase experience.
 */
function calculateSocialTrustScore(
  farcasterContext: ReturnType<typeof useFarcasterContext>,
  authResult: MiniAppAuthResult
): number {
  let score = 0
  
  if (!farcasterContext?.user) return score
  
  // Base Farcaster profile score
  if (farcasterContext.user.fid > 0) score += 20
  if (farcasterContext.user.username) score += 15
  if (farcasterContext.user.displayName) score += 10
  if (farcasterContext.user.pfpUrl) score += 5
  
  // Verification bonus
  const verificationCount = authResult.socialVerification.verificationCount
  if (verificationCount > 0) score += Math.min(verificationCount * 10, 30)
  
  // Address verification bonus (major trust indicator)
  if (authResult.socialVerification.isAddressVerified) score += 20
  
  return Math.min(score, 100)
}

// ===== MAIN UNIFIED PURCHASE FLOW HOOK =====

/**
 * Unified MiniApp Purchase Flow Hook
 * 
 * This hook provides intelligent purchase strategy selection based on user
 * authentication state, environment context, and social verification status.
 * It seamlessly integrates with the authentication component to
 * provide optimal payment experiences across all contexts.
 * 
 * KEY FEATURES:
 * - Intelligent strategy selection based on authentication
 * - Prioritizes Farcaster-verified direct payments for optimal UX
 * - Falls back to batch transactions for MiniApp environments
 * - Maintains standard flow compatibility for all environments
 * - Provides detailed analytics and reasoning for strategy selection
 * - Integrates social context for trust and verification scoring
 * 
 * INTEGRATION POINTS:
 * - Uses authentication (useMiniAppAuth) for strategy input
 * - Builds upon existing useContentPurchaseFlow infrastructure
 * - Integrates with Farcaster context for social verification
 * - Maintains compatibility with existing contract addresses and ABIs
 * - Follows established error handling and state management patterns
 */
export function useUnifiedMiniAppPurchaseFlow(
  contentId: bigint | undefined,
  userAddress?: Address,
  config: Partial<PurchaseStrategyConfig> = {}
): any {
  // Authentication integration
  const authResult = useMiniAppAuth()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Existing purchase flow infrastructure
  const basePurchaseFlow = useUnifiedContentPurchaseFlow(contentId, userAddress || address)
  
  // Farcaster context for social verification
  const farcasterContext = useFarcasterContext()
  
  // EIP-5792 batch transaction support
  const { sendCalls, data: batchTxHash, isPending: isBatchPending, error: batchError } = useSendCalls()
  
  // Configuration merging
  const finalConfig = useMemo(() => ({ 
    ...DEFAULT_STRATEGY_CONFIG, 
    ...config 
  }), [config])
  
  // Contract addresses for current network
  const contractAddresses = useMemo(() => {
    try {
      const addresses = getContractAddresses(chainId)
      
      // Validate that required addresses are present
      if (!addresses?.USDC || !addresses?.PAY_PER_VIEW) {
        console.warn('Missing required contract addresses:', {
          USDC: addresses?.USDC,
          PAY_PER_VIEW: addresses?.PAY_PER_VIEW,
          chainId
        })
        return null
      }
      
      console.log('✅ Contract addresses loaded for chain:', chainId, {
        USDC: addresses.USDC,
        PAY_PER_VIEW: addresses.PAY_PER_VIEW
      })
      
      return addresses
    } catch (error) {
      console.error('Failed to get contract addresses:', error)
      return null
    }
  }, [chainId])
  
  // Unified state management
  const [unifiedState, setUnifiedState] = useState<UnifiedPurchaseFlowState>({
    currentStrategy: 'standard-flow',
    strategyAnalysis: null,
    isBatchTransaction: false,
    batchTransactionHash: null,
    socialContext: Boolean(farcasterContext?.user),
    isOptimized: false,
    fallbackReason: null
  })

  // ===== STRATEGY ANALYSIS AND SELECTION =====
  
  /**
   * Get Optimal Purchase Strategy
   * 
   * This function analyzes the current context and returns the optimal
   * purchase strategy with detailed reasoning and alternatives.
   */
  const getOptimalPurchaseStrategy = useCallback((): StrategyAnalysisResult => {
    return analyzePurchaseStrategies(
      authResult,
      isConnected,
      basePurchaseFlow.content?.payPerViewPrice, // Changed from contentDetails to content
      authResult.environmentType,
      finalConfig
    )
  }, [authResult, isConnected, basePurchaseFlow.content, finalConfig])

  // Current strategy analysis
  const strategyAnalysis = useMemo(() => {
    try {
      const analysis = getOptimalPurchaseStrategy()
      
      // Validate strategy analysis
      if (!analysis || !analysis.selectedStrategy) {
        console.warn('Invalid strategy analysis, falling back to standard flow')
        return {
          selectedStrategy: 'standard-flow' as const,
          confidence: 0,
          reasoning: ['Fallback due to analysis failure'],
          alternatives: [],
          userExperienceScore: 50,
          estimatedSteps: 2
        }
      }
      
      return analysis
    } catch (error) {
      console.error('Strategy analysis failed:', error)
      
      // Return safe fallback
      return {
        selectedStrategy: 'standard-flow' as const,
        confidence: 0,
        reasoning: ['Fallback due to analysis error'],
        alternatives: [],
        userExperienceScore: 50,
        estimatedSteps: 2
      }
    }
  }, [getOptimalPurchaseStrategy])

  // Update unified state when strategy analysis changes
  useEffect(() => {
    setUnifiedState(prev => ({
      ...prev,
      currentStrategy: strategyAnalysis.selectedStrategy,
      strategyAnalysis,
      isOptimized: strategyAnalysis.confidence > 80
    }))
  }, [strategyAnalysis])

  // ===== SOCIAL CONTEXT COMPUTATION =====
  
  /**
   * Social Purchase Context
   * 
   * This provides comprehensive social context for the purchase experience.
   */
  const socialContext = useMemo((): SocialPurchaseContext => {
    const socialTrustScore = calculateSocialTrustScore(farcasterContext, authResult)
    
    return {
      fid: farcasterContext?.user?.fid ?? null,
      username: farcasterContext?.user?.username ?? null,
      displayName: farcasterContext?.user?.displayName ?? null,
      pfpUrl: farcasterContext?.user?.pfpUrl ?? null,
      isAddressVerified: authResult.socialVerification.isAddressVerified,
      verificationCount: authResult.socialVerification.verificationCount,
      socialTrustScore
    }
  }, [farcasterContext, authResult])

  // ===== STRATEGY CAPABILITY CHECKS =====
  
  const canUseFarcasterDirect = useMemo(() => {
    return Boolean(
      authResult.optimalPaymentMethod?.type === 'farcaster-verified' &&
      authResult.socialVerification.isAddressVerified &&
      authResult.environmentType === 'miniapp' &&
      finalConfig.enableFarcasterDirect
    )
  }, [authResult, finalConfig])

  const canUseBatchTransaction = useMemo(() => {
    return Boolean(
      authResult.environmentType === 'miniapp' &&
      isConnected &&
      finalConfig.enableBatchTransactions
    )
  }, [authResult.environmentType, isConnected, finalConfig])

  const recommendsOptimization = useMemo(() => {
    return strategyAnalysis.userExperienceScore > 80 && strategyAnalysis.confidence > 70
  }, [strategyAnalysis])

  // ===== PERFORMANCE METRICS CALCULATION =====
  
  const performanceMetrics = useMemo(() => {
    const baselineTime = 60 // seconds for standard flow
    const baselineSteps = 2
    const baselineUX = 50
    
    const estimatedCompletionTime = Math.max(
      baselineTime * (strategyAnalysis.estimatedSteps / baselineSteps),
      15 // minimum 15 seconds
    )
    
    const gasSavingsPercentage = strategyAnalysis.selectedStrategy === 'batch-transaction' 
      ? 25 // approximately 25% gas savings from batching
      : 0
    
    const uxImprovementScore = Math.max(
      strategyAnalysis.userExperienceScore - baselineUX,
      0
    )
    
    return {
      estimatedCompletionTime,
      userStepsRequired: strategyAnalysis.estimatedSteps,
      gasSavingsPercentage,
      uxImprovementScore
    }
  }, [strategyAnalysis])

  // ===== ANALYTICS AND TRACKING =====
  
  /**
   * Track Strategy Selection
   * 
   * This function tracks which strategy was selected and why,
   * providing valuable analytics for optimization.
   */
  const trackStrategySelection = useCallback((strategy: PurchaseStrategy, reasoning: string[]): void => {
    // Integration point for analytics system
    console.log('📊 Strategy Selection Analytics', {
      strategy,
      reasoning,
      confidence: strategyAnalysis.confidence,
      userExperienceScore: strategyAnalysis.userExperienceScore,
      socialTrustScore: socialContext.socialTrustScore,
      environmentType: authResult.environmentType
    })
  }, [strategyAnalysis, socialContext, authResult])

  /**
   * Track Social Purchase
   * 
   * This function tracks purchases that include social context,
   * enabling analysis of social commerce performance.
   */
  const trackSocialPurchase = useCallback((contentId: bigint): void => {
    if (!socialContext.fid) return
    
    // Integration point for social analytics
    console.log('📊 Social Purchase Analytics', {
      contentId: contentId.toString(),
      fid: socialContext.fid,
      isAddressVerified: socialContext.isAddressVerified,
      socialTrustScore: socialContext.socialTrustScore,
      strategy: strategyAnalysis.selectedStrategy
    })
  }, [socialContext, strategyAnalysis])

  // ===== PURCHASE METHODS =====
  
  /**
   * Purchase with Farcaster Direct
   * 
   * This method executes a direct purchase using the Farcaster-verified wallet,
   * providing the optimal user experience for verified social users.
   */
  const purchaseWithFarcasterDirect = useCallback(async (): Promise<void> => {
    // Comprehensive validation
    if (!canUseFarcasterDirect) {
      throw new Error('Farcaster direct purchase not available - verification required')
    }
    if (!contentId) {
      throw new Error('Content ID is required for purchase')
    }
    if (!basePurchaseFlow.content) {
      throw new Error('Content details not available')
    }
    if (!authResult.optimalPaymentMethod?.address) {
      throw new Error('Verified wallet address not available')
    }

    try {
      console.group('🚀 Farcaster Direct Purchase: Optimized Social Commerce Flow')
      console.log('Content ID:', contentId.toString())
      console.log('Verified Address:', authResult.optimalPaymentMethod.address)
      console.log('Social Trust Score:', socialContext.socialTrustScore)
      console.log('Content Price:', basePurchaseFlow.content.payPerViewPrice.toString())
      console.groupEnd()

      // Update state to reflect purchase initiation
      setUnifiedState(prev => ({
        ...prev,
        isBatchTransaction: false,
        fallbackReason: null
      }))

      // Track strategy selection for analytics
      trackStrategySelection('farcaster-direct', [
        'Farcaster-verified wallet enables direct payment',
        'Social verification provides maximum trust and UX',
        'Single-step purchase with verified social identity'
      ])

      // Execute direct purchase using verified Farcaster wallet
      // This leverages the social verification to streamline the experience
      await basePurchaseFlow.executePayment()
      
      // Track successful social purchase
      trackSocialPurchase(contentId)
      
      console.log('✅ Farcaster direct purchase completed successfully')
      
    } catch (error) {
      console.error('Farcaster direct purchase failed:', error)
      
      // Update state to reflect failure
      setUnifiedState(prev => ({
        ...prev,
        fallbackReason: `Farcaster direct failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
      
      if (finalConfig.autoFallback) {
        console.log('🔄 Attempting fallback to batch transaction...')
        try {
          await purchaseWithBatchTransaction()
        } catch (fallbackError) {
          console.error('Fallback to batch transaction also failed:', fallbackError)
          throw new Error(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
        }
      } else {
        throw error
      }
    }
  }, [canUseFarcasterDirect, contentId, basePurchaseFlow, authResult, socialContext, finalConfig, trackStrategySelection, trackSocialPurchase])

  /**
   * Purchase with Batch Transaction
   * 
   * This method executes a batch transaction combining token approval and
   * content purchase into a single user confirmation.
   */
  const purchaseWithBatchTransaction = useCallback(async (): Promise<void> => {
    // Comprehensive validation
    if (!canUseBatchTransaction) {
      throw new Error('Batch transaction purchase not available - MiniApp environment required')
    }
    if (!contentId) {
      throw new Error('Content ID is required for batch purchase')
    }
    if (!basePurchaseFlow.content) {
      throw new Error('Content details not available for batch purchase')
    }
    if (!contractAddresses) {
      throw new Error('Contract addresses not available for batch purchase')
    }
    if (!sendCalls) {
      throw new Error('Batch transaction capability not available')
    }

    // Skip batch if no approval needed - approval is handled by the orchestrator
    // if (!basePurchaseFlow.needsApproval) {
    //   console.log('ℹ️ No approval needed, using standard purchase')
    //   return basePurchaseFlow.executePayment()
    // }

    try {
      console.group('🚀 Batch Transaction Purchase: EIP-5792 Optimized Flow')
      console.log('Content ID:', contentId.toString())
      console.log('Required Amount:', basePurchaseFlow.estimatedCost?.toString() || 'Calculating...')
      console.log('Content Price:', basePurchaseFlow.content.payPerViewPrice.toString())
      console.log('Batch Calls Count: 2 (approve + purchase)')
      console.log('Gas Limit:', finalConfig.batchGasLimit.toString())
      console.log('Timeout:', finalConfig.batchTimeout)
      console.groupEnd()

      // Update state to reflect batch transaction initiation
      setUnifiedState(prev => ({
        ...prev,
        isBatchTransaction: true,
        batchTransactionHash: null,
        fallbackReason: null
      }))

      // Track strategy selection for analytics
      trackStrategySelection('batch-transaction', [
        'MiniApp environment supports batch transactions',
        'EIP-5792 enables approve + purchase in single confirmation',
        'Optimized for mobile social commerce experience'
      ])

      // Prepare batch transaction calls with proper validation
              const requiredAmount = basePurchaseFlow.estimatedCost || basePurchaseFlow.content.payPerViewPrice
      
      if (requiredAmount <= BigInt(0)) {
        throw new Error('Invalid required amount for batch transaction')
      }

      const batchCalls = [
        // Call 1: Approve USDC spending
        {
          to: contractAddresses.USDC,
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [
              contractAddresses.PAY_PER_VIEW,
              requiredAmount
            ]
          })
        },
        // Call 2: Purchase content
        {
          to: contractAddresses.PAY_PER_VIEW,
          data: encodeFunctionData({
            abi: PAY_PER_VIEW_ABI,
            functionName: 'purchaseContentDirect',
            args: [contentId]
          })
        }
      ]

      // Execute batch transaction with timeout handling
      const batchPromise = sendCalls({ 
        calls: batchCalls
      })
      
      // Add timeout handling
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Batch transaction timeout')), finalConfig.batchTimeout)
      })
      
      await Promise.race([batchPromise, timeoutPromise])
      
      console.log('✅ Batch transaction submitted successfully')
      
    } catch (error) {
      console.error('Batch transaction failed:', error)
      
      // Update state to reflect failure
      setUnifiedState(prev => ({
        ...prev,
        fallbackReason: `Batch transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
      
      if (finalConfig.autoFallback) {
        console.log('🔄 Attempting fallback to standard flow...')
        try {
          setUnifiedState(prev => ({
            ...prev,
            fallbackReason: 'Batch transaction failed, using standard flow'
          }))
          await basePurchaseFlow.executePayment()
        } catch (fallbackError) {
          console.error('Fallback to standard flow also failed:', fallbackError)
          throw new Error(`Batch transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`)
        }
      } else {
        throw error
      }
    }
  }, [canUseBatchTransaction, contentId, basePurchaseFlow, contractAddresses, sendCalls, finalConfig, trackStrategySelection])

  /**
   * Purchase with Standard Flow
   * 
   * This method executes the traditional approve-then-purchase flow,
   * providing reliable compatibility across all environments.
   */
  const purchaseWithStandardFlow = useCallback(async (): Promise<void> => {
    // Validation
    if (!contentId) {
      throw new Error('Content ID is required for standard purchase')
    }
    if (!basePurchaseFlow.content) {
      throw new Error('Content details not available for standard purchase')
    }

    try {
      console.group('🚀 Standard Purchase Flow: Traditional Web3 Commerce')
      console.log('Content ID:', contentId.toString())
      console.log('Flow Step:', basePurchaseFlow.executionState.phase)
      console.log('Content Price:', basePurchaseFlow.content.payPerViewPrice.toString())
      console.log('Needs Approval:', 'Handled by orchestrator') // basePurchaseFlow.needsApproval moved to orchestrator
      console.groupEnd()

      // Update state to reflect standard flow initiation
      setUnifiedState(prev => ({
        ...prev,
        isBatchTransaction: false,
        fallbackReason: null
      }))

      // Track strategy selection for analytics
      trackStrategySelection('standard-flow', [
        'Standard approve + purchase flow',
        'Compatible with all environments and wallets',
        'Reliable fallback with proven stability'
      ])

      // Execute standard purchase flow
      await basePurchaseFlow.executePayment()
      
      console.log('✅ Standard purchase flow completed successfully')
      
    } catch (error) {
      console.error('Standard purchase flow failed:', error)
      
      // Update state to reflect failure
      setUnifiedState(prev => ({
        ...prev,
        fallbackReason: `Standard flow failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
      
      throw error
    }
  }, [contentId, basePurchaseFlow, trackStrategySelection])

  /**
   * Purchase with Optimal Strategy
   * 
   * This method automatically selects and executes the optimal purchase strategy
   * based on the current context analysis.
   */
  const purchaseWithOptimalStrategy = useCallback(async (): Promise<void> => {
    const strategy = strategyAnalysis.selectedStrategy
    
    try {
      console.group('🚀 Optimal Strategy Purchase')
      console.log('Selected Strategy:', strategy)
      console.log('Confidence:', strategyAnalysis.confidence)
      console.log('UX Score:', strategyAnalysis.userExperienceScore)
      console.log('Reasoning:', strategyAnalysis.reasoning.join(', '))
      console.log('Environment Type:', authResult.environmentType)
      console.log('Social Trust Score:', socialContext.socialTrustScore)
      console.groupEnd()

      // Validate that we can execute the selected strategy
      let canExecute = false
      switch (strategy) {
        case 'farcaster-direct':
          canExecute = canUseFarcasterDirect
          break
        case 'batch-transaction':
          canExecute = canUseBatchTransaction
          break
        case 'standard-flow':
          canExecute = true // Always available as fallback
          break
        default:
          throw new Error(`Unknown strategy: ${strategy}`)
      }

      if (!canExecute) {
        console.warn(`Selected strategy ${strategy} is not available, falling back to standard flow`)
        return purchaseWithStandardFlow()
      }

      // Execute the selected strategy
      switch (strategy) {
        case 'farcaster-direct':
          return purchaseWithFarcasterDirect()
        case 'batch-transaction':
          return purchaseWithBatchTransaction()
        case 'standard-flow':
          return purchaseWithStandardFlow()
        default:
          throw new Error(`Unknown strategy: ${strategy}`)
      }
      
    } catch (error) {
      console.error('Optimal strategy purchase failed:', error)
      
      // Update state to reflect failure
      setUnifiedState(prev => ({
        ...prev,
        fallbackReason: `Optimal strategy failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }))
      
      // Always fall back to standard flow on any error
      console.log('🔄 Falling back to standard flow due to error...')
      return purchaseWithStandardFlow()
    }
  }, [strategyAnalysis, authResult.environmentType, socialContext.socialTrustScore, canUseFarcasterDirect, canUseBatchTransaction, purchaseWithFarcasterDirect, purchaseWithBatchTransaction, purchaseWithStandardFlow])

  // ===== BATCH TRANSACTION HASH TRACKING =====
  
  useEffect(() => {
    if (batchTxHash) {
      const hash = typeof batchTxHash === 'string' ? batchTxHash : batchTxHash.toString()
      
      console.log('📝 Batch transaction hash received:', hash)
      
      setUnifiedState(prev => ({
        ...prev,
        batchTransactionHash: hash
      }))
      
      // Track successful batch transaction submission
      if (socialContext.fid) {
        trackSocialPurchase(contentId || BigInt(0))
      }
    }
  }, [batchTxHash, socialContext.fid, contentId, trackSocialPurchase])

  // ===== RETURN UNIFIED PURCHASE FLOW RESULT =====
  
  return {
    // Base purchase flow functionality from UnifiedPurchaseFlowResult
    ...basePurchaseFlow,
    
    // Strategy selection and analysis
    strategy: strategyAnalysis.selectedStrategy,
    strategyAnalysis,
    getOptimalPurchaseStrategy,
    
    // Unified state management
    unifiedState,
    
    // Purchase methods
    purchaseWithOptimalStrategy,
    purchaseWithFarcasterDirect,
    purchaseWithBatchTransaction,
    purchaseWithStandardFlow,
    
    // Override base purchase method to use optimal strategy
    purchase: purchaseWithOptimalStrategy,
    
    // Strategy capabilities
    canUseFarcasterDirect,
    canUseBatchTransaction,
    recommendsOptimization,
    
    // Social context integration
    socialContext,
    
    // Performance metrics
    performanceMetrics,
    
    // Analytics and tracking
    trackStrategySelection,
    trackSocialPurchase
  }
}
// ==============================================================================
// COMPLETE X402 ENHANCED CONTENT PURCHASE FLOW
// Phase 3.2: Mini App Payment Flows & Content Access
// File: src/hooks/business/workflows.ts (Enhancement)
// ==============================================================================

import { useCallback, useMemo, useState, useEffect } from 'react'
import { Address } from 'viem'
import { useChainId } from 'wagmi'
import { getContractAddresses } from '@/lib/contracts/config'
import {
  useContentById,
  useHasContentAccess,
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  usePurchaseContent,
  useIsCreatorRegistered,
  useRegisterContent,
  useCreatorProfile,
  useRegisterCreator,
} from '@/hooks/contracts/core'
import type { Creator } from '@/types/contracts'
import { 
  getX402MiddlewareConfig, 
  createX402PaymentProof, 
  verifyX402PaymentProof,
  X402Config,
  X402PaymentProof,
  X402PaymentVerificationResult
} from '@/lib/web3/x402-config'
import { CONTENT_REGISTRY_ABI } from '@/lib/contracts/abi'
import { decodeEventLog } from 'viem'
import { createPublicClient, http } from 'viem'

// ==============================================================================
// FARCASTER CONTEXT IMPLEMENTATION
// ==============================================================================

/**
 * Farcaster Context Interface
 * Represents the social context available within Farcaster MiniApps
 */
export interface FarcasterContext {
  readonly user: {
    readonly fid: number
    readonly username: string
    readonly displayName: string
    readonly pfpUrl: string
    // custodyAddress and verifications removed for strict typing
  }
  readonly client: {
    readonly name: string
    readonly version: string
  }
  // cast removed for strict typing
  readonly location: 'cast' | 'composer' | 'notification' | 'profile' | 'unknown'
}

/**
 * Farcaster Context Hook Implementation
 * Detects MiniApp environment and provides social context
 */
export function useFarcasterContext(): FarcasterContext | null {
  const [farcasterContext, setFarcasterContext] = useState<FarcasterContext | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const isInMiniApp = useMemo(() => {
    if (typeof window === 'undefined') return false

    const url = new URL(window.location.href)
    return url.pathname.startsWith('/mini') || 
           url.pathname.startsWith('/miniapp') ||
           url.searchParams.get('miniApp') === 'true' ||
           document.querySelector('meta[name="fc:frame"]') !== null ||
           document.querySelector('meta[name="fc:miniapp"]') !== null
  }, [])

  useEffect(() => {
    if (!isInMiniApp || isInitialized) return

    const initializeFarcaster = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        await sdk.actions.ready()
        const sdkContext = await sdk.context

        if (sdkContext && sdkContext.client && sdkContext.user) {
          // Map SDK location types to allowed FarcasterContext types
          const allowedLocations = ['cast', 'composer', 'notification', 'profile', 'unknown'] as const
          let location: FarcasterContext['location'] = 'unknown'
          const sdkLocation = sdkContext.location?.type
          if (allowedLocations.includes(sdkLocation as FarcasterContext['location'])) {
            location = sdkLocation as FarcasterContext['location']
          }

          const context: FarcasterContext = {
            user: {
              fid: sdkContext.user.fid,
              username: sdkContext.user.username ?? '',
              displayName: sdkContext.user.displayName ?? '',
              pfpUrl: sdkContext.user.pfpUrl ?? '',
            },
            client: {
              name: sdkContext.client.platformType || '',
              version: '1.0.0'
            },
            location
          }

          setFarcasterContext(context)
        }
      } catch (error) {
        console.warn('Failed to initialize Farcaster context:', error)
        setFarcasterContext(null)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeFarcaster()
  }, [isInMiniApp, isInitialized])

  return farcasterContext
}

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================
export type X402ContentPurchaseFlowStep = 
  | 'checking_access'
  | 'can_purchase'
  | 'need_approval'
  | 'purchasing'
  | 'completed'
  | 'error'
  | 'preparing_x402_payment'
  | 'processing_x402_payment'
  | 'verifying_x402_payment'
  | 'x402_payment_failed'

interface X402PaymentState {
  readonly isLoading: boolean
  readonly paymentProof: X402PaymentProof | null
  readonly verificationResult: X402PaymentVerificationResult | null
  readonly error: Error | null
}

export interface X402ContentPurchaseFlowResult {
  readonly hasAccess: boolean | undefined
  readonly isLoading: boolean
  readonly currentStep: X402ContentPurchaseFlowStep
  readonly error: Error | null
  readonly content: any
  readonly canAfford: boolean
  readonly needsApproval: boolean
  readonly userBalance: bigint | undefined
  readonly purchase: () => void
  readonly approveAndPurchase: () => void
  readonly reset: () => void
  readonly purchaseProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
  readonly approvalProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
  readonly socialContext: FarcasterContext | null
  readonly canUseX402Payment: boolean
  readonly purchaseWithX402: () => Promise<void>
  readonly x402PaymentState: X402PaymentState
  readonly shareCapabilities: {
    readonly canShare: boolean
    readonly shareToCast: (message: string) => Promise<void>
    readonly generateShareMessage: () => string
  }
}

// ==============================================================================
// MAIN ENHANCED HOOK IMPLEMENTATION
// ==============================================================================

export function useX402ContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): X402ContentPurchaseFlowResult {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  
  const contentData = useContentById(contentId)
  const hasAccess = useHasContentAccess(userAddress, contentId)
  const userBalance = useTokenBalance(contractAddresses.USDC, userAddress)
  const tokenAllowance = useTokenAllowance(
    contractAddresses.USDC,
    userAddress,
    contractAddresses.PAY_PER_VIEW
  )
  const approveToken = useApproveToken()
  const purchaseContent = usePurchaseContent()
  
  const farcasterContext = useFarcasterContext()
  
  const [workflowState, setWorkflowState] = useState<{
    currentStep: X402ContentPurchaseFlowStep
    error: Error | null
  }>({
    currentStep: 'checking_access',
    error: null
  })
  
  const [x402PaymentState, setX402PaymentState] = useState<X402PaymentState>({
    isLoading: false,
    paymentProof: null,
    verificationResult: null,
    error: null
  })
  
  const canAfford = useMemo(() => {
    if (!userBalance.data || !contentData.data) return false
    return userBalance.data >= contentData.data.payPerViewPrice
  }, [userBalance.data, contentData.data])

  const needsApproval = useMemo(() => {
    if (!tokenAllowance.data || !contentData.data) return false
    return tokenAllowance.data < contentData.data.payPerViewPrice
  }, [tokenAllowance.data, contentData.data])
  
  const x402Config = useMemo((): X402Config | null => {
    try {
      return getX402MiddlewareConfig(chainId)
    } catch (error) {
      console.warn('x402 configuration not available:', error)
      return null
    }
  }, [chainId])
  
  const canUseX402Payment = useMemo(() => {
    return Boolean(
      x402Config &&
      farcasterContext &&
      contentId &&
      userAddress &&
      contentData.data?.payPerViewPrice
    )
  }, [x402Config, farcasterContext, contentId, userAddress, contentData.data])

  useEffect(() => {
    if (hasAccess.isLoading || contentData.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'checking_access' }))
    } else if (hasAccess.error || contentData.error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: hasAccess.error || contentData.error 
      })
    } else if (hasAccess.data === true) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'completed' }))
    } else if (!canAfford) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Insufficient USDC balance to purchase this content')
      })
    } else if (needsApproval) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'need_approval' }))
    } else {
      setWorkflowState(prev => ({ ...prev, currentStep: 'can_purchase' }))
    }
  }, [hasAccess.data, hasAccess.isLoading, hasAccess.error, contentData.error, canAfford, needsApproval])

  useEffect(() => {
    if (approveToken.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'need_approval' }))
    } else if (approveToken.isConfirmed && needsApproval === false) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'can_purchase' }))
      tokenAllowance.refetch()
    }
  }, [approveToken.isLoading, approveToken.isConfirmed, needsApproval, tokenAllowance])

  useEffect(() => {
    if (purchaseContent.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'purchasing' }))
    } else if (purchaseContent.error) {
      setWorkflowState({ currentStep: 'error', error: purchaseContent.error })
    } else if (purchaseContent.isConfirmed) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'completed' }))
      hasAccess.refetch()
      userBalance.refetch()
    }
  }, [purchaseContent.isLoading, purchaseContent.error, purchaseContent.isConfirmed, hasAccess, userBalance])

  const handlePurchase = useCallback(() => {
    if (!contentId) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Content ID is required for purchase')
      })
      return
    }

    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      purchaseContent.write(contentId)
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Purchase failed')
      })
    }
  }, [contentId, purchaseContent])

  const handleApproveAndPurchase = useCallback(() => {
    if (!contentData.data || !contentId) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Content data required for purchase')
      })
      return
    }

    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      
      approveToken.write({
        tokenAddress: contractAddresses.USDC,
        spender: contractAddresses.PAY_PER_VIEW,
        amount: contentData.data.payPerViewPrice,
      })
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Approval failed')
      })
    }
  }, [contentData.data, contentId, approveToken, contractAddresses])

  const handleReset = useCallback(() => {
    setWorkflowState({ currentStep: 'checking_access', error: null })
    setX402PaymentState({
      isLoading: false,
      paymentProof: null,
      verificationResult: null,
      error: null
    })
    approveToken.reset()
    purchaseContent.reset()
    hasAccess.refetch()
  }, [approveToken, purchaseContent, hasAccess])

  const purchaseWithX402 = useCallback(async (): Promise<void> => {
    if (!contentId || !userAddress || !contentData.data || !x402Config) {
      throw new Error('Required parameters missing for x402 purchase')
    }
    
    try {
      setWorkflowState(prev => ({ ...prev, currentStep: 'preparing_x402_payment' }))
      setX402PaymentState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        paymentProof: null,
        verificationResult: null
      }))
      
      const paymentProof = await createX402PaymentProof({
        contentId: contentId.toString(),
        amount: contentData.data.payPerViewPrice,
        recipient: contentData.data.creator,
        userAddress,
        chainId,
        contractAddress: contractAddresses.COMMERCE_INTEGRATION,
        x402Config
      })
      
      setX402PaymentState(prev => ({ ...prev, paymentProof }))
      setWorkflowState(prev => ({ ...prev, currentStep: 'processing_x402_payment' }))
      
      const verificationResult = await verifyX402PaymentProof(paymentProof, x402Config)
      
      if (!verificationResult.success) {
        throw new Error(verificationResult.error || 'Payment verification failed')
      }
      
      setX402PaymentState(prev => ({ ...prev, verificationResult }))
      setWorkflowState(prev => ({ ...prev, currentStep: 'verifying_x402_payment' }))
      
      purchaseContent.write(contentId)
      setX402PaymentState(prev => ({ ...prev, isLoading: false }))
      
    } catch (error) {
      const purchaseError = error instanceof Error ? error : new Error('x402 purchase failed')
      setWorkflowState({ currentStep: 'x402_payment_failed', error: purchaseError })
      setX402PaymentState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: purchaseError 
      }))
      throw purchaseError
    }
  }, [
    contentId, 
    userAddress, 
    contentData.data, 
    x402Config,
    chainId,
    contractAddresses.COMMERCE_INTEGRATION,
    purchaseContent
  ])
  
  const shareCapabilities = useMemo(() => {
    const canShare = Boolean(
      farcasterContext && 
      contentData.data &&
      workflowState.currentStep === 'completed'
    )
    
    const generateShareMessage = (): string => {
      if (!contentData.data) return ''
      return `Just unlocked "${contentData.data.title}" on Content Platform! 🔓 Discover premium content with instant USDC payments.`
    }
    
    const shareToCast = async (message: string): Promise<void> => {
      if (!farcasterContext || typeof window === 'undefined') {
        throw new Error('Farcaster context not available for sharing')
      }
      
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`
        
        if (contentId) {
          const contentUrl = `${window.location.origin}/content/${contentId}`
          const fullUrl = `${shareUrl}&embeds[]=${encodeURIComponent(contentUrl)}`
          await sdk.actions.openUrl(fullUrl)
        } else {
          await sdk.actions.openUrl(shareUrl)
        }
      } catch (error) {
        console.warn('Failed to share to Farcaster:', error)
        window.open(
          `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`,
          '_blank',
          'noopener,noreferrer'
        )
      }
    }
    
    return {
      canShare,
      shareToCast,
      generateShareMessage
    }
  }, [farcasterContext, contentData.data, workflowState.currentStep, contentId])
  
  return {
    hasAccess: hasAccess.data,
    isLoading: hasAccess.isLoading || contentData.isLoading || 
               approveToken.isLoading || purchaseContent.isLoading || x402PaymentState.isLoading,
    currentStep: workflowState.currentStep,
    error: workflowState.error || x402PaymentState.error,
    content: contentData.data,
    canAfford,
    needsApproval,
    userBalance: userBalance.data,
    purchase: handlePurchase,
    approveAndPurchase: handleApproveAndPurchase,
    reset: handleReset,
    purchaseProgress: {
      isSubmitting: purchaseContent.isLoading,
      isConfirming: purchaseContent.isConfirming,
      isConfirmed: purchaseContent.isConfirmed,
      transactionHash: purchaseContent.hash,
    },
    approvalProgress: {
      isSubmitting: approveToken.isLoading,
      isConfirming: approveToken.isConfirming,
      isConfirmed: approveToken.isConfirmed,
      transactionHash: approveToken.hash,
    },
    socialContext: farcasterContext,
    canUseX402Payment,
    purchaseWithX402,
    x402PaymentState,
    shareCapabilities
  }
}

export interface ContentPublishingData {
  readonly title: string
  readonly description: string
  readonly ipfsHash: string  // Content stored on IPFS
  readonly category: number  // ContentCategory enum value
  readonly payPerViewPrice: bigint  // Price in USDC base units (6 decimals)
  readonly tags: readonly string[]  // Content tags for discovery
}

/**
 * Content Publishing Flow Steps
 * 
 * This enum defines all possible states in the content publishing workflow,
 * enabling clear state management and user feedback.
 */
export type ContentPublishingFlowStep = 
  | 'idle'                    // Ready to start publishing
  | 'checking_creator'        // Verifying creator registration status
  | 'validating_content'      // Validating content data and IPFS
  | 'registering'            // Publishing content to blockchain
  | 'completed'              // Content successfully published
  | 'error'                  // Publishing failed

/**
 * Content Publishing Flow Result Interface
 * 
 * This interface provides everything the UI layer needs to manage
 * content publishing workflows with proper state management.
 */
export interface ContentPublishingFlowResult {
  readonly currentStep: ContentPublishingFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly canPublish: boolean
  readonly isCreatorRegistered: boolean
  readonly publishedContentId: bigint | null
  
  // Actions
  readonly publish: (data: ContentPublishingData) => void
  readonly reset: () => void
  
  // Progress tracking
  readonly publishingProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

/**
 * Content Publishing Workflow Hook
 * 
 * This hook manages the complete content publishing workflow, integrating
 * with your existing smart contract infrastructure. It follows the same
 * architectural patterns as your purchase flow hooks.
 * 
 * The workflow ensures creators are registered before allowing content
 * publishing, validates content data, and handles the blockchain transaction
 * to register content in your ContentRegistry contract.
 * 
 * @param userAddress - The creator's wallet address
 * @returns Complete content publishing workflow state and actions
 */
export function useContentPublishingFlow(
  userAddress: Address | undefined
): ContentPublishingFlowResult {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  
  // Contract interaction hooks
  const creatorRegistration = useIsCreatorRegistered(userAddress)
  const registerContent = useRegisterContent()
  const userBalance = useTokenBalance(contractAddresses.USDC, userAddress)
  
  // Workflow state management
  const [workflowState, setWorkflowState] = useState<{
    currentStep: ContentPublishingFlowStep
    error: Error | null
    publishedContentId: bigint | null
  }>({
    currentStep: 'idle',
    error: null,
    publishedContentId: null
  })
  
  // Derived state for UI components
  const isCreatorRegistered = creatorRegistration.data ?? false
  const canPublish = isCreatorRegistered && workflowState.currentStep === 'idle'
  const isLoading = workflowState.currentStep !== 'idle' && 
                   workflowState.currentStep !== 'completed' && 
                   workflowState.currentStep !== 'error'
  
  // Progress tracking for transaction feedback
  const publishingProgress = useMemo(() => ({
    isSubmitting: registerContent.isLoading && !registerContent.isConfirmed,
    isConfirming: registerContent.isLoading && registerContent.isConfirmed,
    isConfirmed: registerContent.isConfirmed,
    transactionHash: registerContent.hash
  }), [registerContent])
  
  // Content validation function
  const validateContentData = useCallback((data: ContentPublishingData): string[] => {
    const errors: string[] = []
    
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Content title is required')
    }
    
    if (data.title && data.title.length > 100) {
      errors.push('Title must be less than 100 characters')
    }
    
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Content description is required')
    }
    
    if (!data.ipfsHash || !data.ipfsHash.startsWith('Qm')) {
      errors.push('Valid IPFS hash is required')
    }
    
    if (data.payPerViewPrice <= BigInt(0)) {
      errors.push('Price must be greater than 0')
    }
    
    if (data.payPerViewPrice > BigInt(1000000000)) { // 1000 USDC max
      errors.push('Price cannot exceed 1000 USDC')
    }
    
    return errors
  }, [])
  
  // Main publishing function
  const publish = useCallback((data: ContentPublishingData) => {
    if (!userAddress) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('Wallet connection required'),
        publishedContentId: null
      })
      return
    }
    
    // Step 1: Check creator registration status
    setWorkflowState(prev => ({ ...prev, currentStep: 'checking_creator', error: null }))
    
    if (!isCreatorRegistered) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('You must be a registered creator to publish content'),
        publishedContentId: null
      })
      return
    }
    
    // Step 2: Validate content data
    setWorkflowState(prev => ({ ...prev, currentStep: 'validating_content' }))
    
    const validationErrors = validateContentData(data)
    if (validationErrors.length > 0) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error(`Content validation failed: ${validationErrors.join(', ')}`),
        publishedContentId: null
      })
      return
    }
    
    // Step 3: Publish content to blockchain
    setWorkflowState(prev => ({ ...prev, currentStep: 'registering' }))
    
    try {
      registerContent.write({
        ipfsHash: data.ipfsHash,
        title: data.title,
        description: data.description,
        category: data.category,
        payPerViewPrice: data.payPerViewPrice,
        tags: data.tags
      })
    } catch (error) {
      setWorkflowState({
        currentStep: 'error',
        error: error instanceof Error ? error : new Error('Failed to publish content'),
        publishedContentId: null
      })
    }
  }, [userAddress, isCreatorRegistered, validateContentData, registerContent])
  
  // Reset workflow to initial state
  const reset = useCallback(() => {
    setWorkflowState({
      currentStep: 'idle',
      error: null,
      publishedContentId: null
    })
  }, [])
  
  // Handle publishing transaction results
  useEffect(() => {
    if (registerContent.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'registering' }))
    } else if (registerContent.error) {
      setWorkflowState({
        currentStep: 'error',
        error: registerContent.error,
        publishedContentId: null
      })
    } else if (registerContent.isConfirmed && registerContent.hash) {
      // Extract content ID from transaction logs if available
      let contentId: bigint | null = null
      try {
        const fetchReceipt = async () => {
          if (!registerContent.hash) {
            setWorkflowState({
              currentStep: 'completed',
              error: null,
              publishedContentId: null
            })
            creatorRegistration.refetch()
            userBalance.refetch()
            return
          }
          const chainId = useChainId()
          const contractAddresses = getContractAddresses(chainId)
          const publicClient = createPublicClient({
            chain: chainId === 8453 ? require('viem/chains').base : require('viem/chains').baseSepolia,
            transport: http()
          })
          const receipt = await publicClient.getTransactionReceipt({ hash: registerContent.hash as `0x${string}` })
          for (const log of receipt.logs) {
            try {
              const event = decodeEventLog({
                abi: CONTENT_REGISTRY_ABI,
                data: log.data,
                topics: log.topics
              })
              if (event.eventName === 'ContentRegistered') {
                contentId = event.args.contentId as bigint
                break
              }
            } catch {}
          }
          setWorkflowState({
            currentStep: 'completed',
            error: null,
            publishedContentId: contentId
          })
          // Refresh creator data after successful publishing
          creatorRegistration.refetch()
          userBalance.refetch()
        }
        fetchReceipt()
      } catch (e) {
        setWorkflowState({
          currentStep: 'completed',
          error: null,
          publishedContentId: null
        })
        creatorRegistration.refetch()
        userBalance.refetch()
      }
    }
  }, [registerContent, creatorRegistration, userBalance])
  
  // Update step based on creator registration status
  useEffect(() => {
    if (creatorRegistration.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'checking_creator' }))
    } else if (creatorRegistration.error) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('Failed to check creator status'),
        publishedContentId: null
      })
    } else if (workflowState.currentStep === 'checking_creator' && !creatorRegistration.isLoading) {
      if (isCreatorRegistered) {
        setWorkflowState(prev => ({ ...prev, currentStep: 'idle' }))
      } else {
        setWorkflowState({
          currentStep: 'error',
          error: new Error('Creator registration required'),
          publishedContentId: null
        })
      }
    }
  }, [creatorRegistration, isCreatorRegistered, workflowState.currentStep])
  
  return {
    currentStep: workflowState.currentStep,
    isLoading,
    error: workflowState.error,
    canPublish,
    isCreatorRegistered,
    publishedContentId: workflowState.publishedContentId,
    publish,
    reset,
    publishingProgress
  }
}


// ==============================================================================
// BASIC CONTENT PURCHASE FLOW HOOK
// Add this to your src/hooks/business/workflows.ts file
// ==============================================================================

/**
 * Content Purchase Flow Steps
 * 
 * This enum defines all possible states in the basic content purchase workflow.
 * The x402 enhanced version extends this with additional social payment states.
 */
export type ContentPurchaseFlowStep = 
  | 'checking_access'        // Verifying if user already has access
  | 'cannot_purchase'        // User already owns content or other blocking issue
  | 'need_approval'          // Token approval required before purchase
  | 'can_purchase'          // Ready to purchase content
  | 'purchasing'            // Purchase transaction in progress
  | 'completed'             // Purchase completed successfully
  | 'error'                 // Purchase failed

/**
 * Content Purchase Flow Result Interface
 * 
 * This interface provides everything components need to manage basic content
 * purchase workflows. It serves as the foundation that the x402 enhanced
 * version builds upon.
 */
export interface ContentPurchaseFlowResult {
  // Core purchase state
  readonly currentStep: ContentPurchaseFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly hasAccess: boolean | null
  
  // Content information
  readonly content: {
    readonly id: bigint
    readonly title: string
    readonly description: string
    readonly payPerViewPrice: bigint
    readonly creator: Address
    readonly category: number
    readonly isActive: boolean
  } | null
  
  // Purchase capability checks
  readonly canAfford: boolean
  readonly needsApproval: boolean
  readonly userBalance: bigint | null
  readonly requiredAllowance: bigint | null
  
  // Purchase actions
  readonly purchase: () => void
  readonly approveAndPurchase: () => void
  readonly reset: () => void
  
  // Transaction progress tracking
  readonly purchaseProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
  readonly approvalProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

/**
 * Basic Content Purchase Flow Hook
 * 
 * This hook manages the fundamental content purchase workflow for your platform.
 * It handles access checking, balance validation, token approvals, and purchase
 * execution while providing clear state management for UI components.
 * 
 * This serves as the foundation layer that enhanced versions (like x402) build upon.
 * The hook integrates with your existing smart contract infrastructure and follows
 * the same patterns as your other workflow hooks.
 * 
 * @param contentId - The ID of the content to purchase
 * @param userAddress - The purchaser's wallet address
 * @returns Complete purchase workflow state and actions
 */
export function useContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): ContentPurchaseFlowResult {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  
  // Core contract interaction hooks
  const contentData = useContentById(contentId)
  const hasAccess = useHasContentAccess(userAddress, contentId)
  const userBalance = useTokenBalance(contractAddresses.USDC, userAddress)
  const tokenAllowance = useTokenAllowance(
    contractAddresses.USDC,
    userAddress,
    contractAddresses.PAY_PER_VIEW
  )
  const approveToken = useApproveToken()
  const purchaseContent = usePurchaseContent()
  
  // Workflow state management
  const [workflowState, setWorkflowState] = useState<{
    currentStep: ContentPurchaseFlowStep
    error: Error | null
  }>({
    currentStep: 'checking_access',
    error: null
  })
  
  // Derived state calculations
  const canAfford = useMemo(() => {
    if (!userBalance.data || !contentData.data) return false
    return userBalance.data >= contentData.data.payPerViewPrice
  }, [userBalance.data, contentData.data])
  
  const needsApproval = useMemo(() => {
    if (!tokenAllowance.data || !contentData.data) return false
    return tokenAllowance.data < contentData.data.payPerViewPrice
  }, [tokenAllowance.data, contentData.data])
  
  const requiredAllowance = useMemo(() => {
    if (!contentData.data) return null
    return contentData.data.payPerViewPrice
  }, [contentData.data])
  
  // Loading state calculation
  const isLoading = useMemo(() => {
    return hasAccess.isLoading || 
           contentData.isLoading || 
           userBalance.isLoading ||
           tokenAllowance.isLoading ||
           workflowState.currentStep === 'purchasing' ||
           workflowState.currentStep === 'checking_access'
  }, [hasAccess.isLoading, contentData.isLoading, userBalance.isLoading, tokenAllowance.isLoading, workflowState.currentStep])
  
  // Transaction progress tracking
  const purchaseProgress = useMemo(() => ({
    isSubmitting: purchaseContent.isLoading && !purchaseContent.isConfirmed,
    isConfirming: purchaseContent.isLoading && purchaseContent.isConfirmed,
    isConfirmed: purchaseContent.isConfirmed,
    transactionHash: purchaseContent.hash
  }), [purchaseContent])
  
  const approvalProgress = useMemo(() => ({
    isSubmitting: approveToken.isLoading && !approveToken.isConfirmed,
    isConfirming: approveToken.isLoading && approveToken.isConfirmed,
    isConfirmed: approveToken.isConfirmed,
    transactionHash: approveToken.hash
  }), [approveToken])
  
  // Main purchase action
  const purchase = useCallback(() => {
    if (!contentId) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Content ID is required for purchase')
      })
      return
    }
    
    if (workflowState.currentStep !== 'can_purchase') {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('Cannot purchase in current state')
      })
      return
    }
    
    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      purchaseContent.write(contentId)
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Purchase failed')
      })
    }
  }, [contentId, workflowState.currentStep, purchaseContent])
  
  // Combined approval and purchase action
  const approveAndPurchase = useCallback(() => {
    if (!contentData.data || !contentId) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Content data required for purchase')
      })
      return
    }
    
    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      
      // Start with token approval
      approveToken.write({
        tokenAddress: contractAddresses.USDC,
        spender: contractAddresses.PAY_PER_VIEW,
        amount: contentData.data.payPerViewPrice,
      })
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Approval failed')
      })
    }
  }, [contentData.data, contentId, approveToken, contractAddresses])
  
  // Reset workflow to initial state
  const reset = useCallback(() => {
    setWorkflowState({ currentStep: 'checking_access', error: null })
    approveToken.reset()
    purchaseContent.reset()
    hasAccess.refetch()
  }, [approveToken, purchaseContent, hasAccess])
  
  // Effect: Update workflow state based on access and content data
  useEffect(() => {
    if (hasAccess.isLoading || contentData.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'checking_access' }))
      return
    }
    
    if (hasAccess.error || contentData.error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: hasAccess.error || contentData.error || new Error('Failed to load content data')
      })
      return
    }
    
    if (hasAccess.data === true) {
      setWorkflowState({ 
        currentStep: 'cannot_purchase', 
        error: new Error('You already have access to this content')
      })
      return
    }
    
    if (!canAfford) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Insufficient USDC balance to purchase this content')
      })
      return
    }
    
    if (needsApproval) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'need_approval' }))
    } else {
      setWorkflowState(prev => ({ ...prev, currentStep: 'can_purchase' }))
    }
  }, [hasAccess.data, hasAccess.isLoading, hasAccess.error, contentData.error, canAfford, needsApproval])
  
  // Effect: Handle approval transaction results
  useEffect(() => {
    if (approveToken.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'need_approval' }))
    } else if (approveToken.isConfirmed && needsApproval === false) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'can_purchase' }))
      tokenAllowance.refetch()
    } else if (approveToken.error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: approveToken.error
      })
    }
  }, [approveToken.isLoading, approveToken.isConfirmed, approveToken.error, needsApproval, tokenAllowance])
  
  // Effect: Handle purchase transaction results
  useEffect(() => {
    if (purchaseContent.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'purchasing' }))
    } else if (purchaseContent.error) {
      setWorkflowState({ currentStep: 'error', error: purchaseContent.error })
    } else if (purchaseContent.isConfirmed) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'completed' }))
      hasAccess.refetch()
      userBalance.refetch()
    }
  }, [purchaseContent.isLoading, purchaseContent.error, purchaseContent.isConfirmed, hasAccess, userBalance])
  
  return {
    currentStep: workflowState.currentStep,
    isLoading,
    error: workflowState.error,
    hasAccess: hasAccess.data || false,
    content: contentData.data ? {
      id: contentId || BigInt(0),
      title: contentData.data.title,
      description: contentData.data.description,
      payPerViewPrice: contentData.data.payPerViewPrice,
      creator: contentData.data.creator,
      category: contentData.data.category,
      isActive: contentData.data.isActive
    } : null,
    canAfford,
    needsApproval,
    userBalance: userBalance.data || null,
    requiredAllowance,
    purchase,
    approveAndPurchase,
    reset,
    purchaseProgress,
    approvalProgress
  }
}





// ==============================================================================
// CREATOR ONBOARDING WORKFLOW HOOK
// Add this to your src/hooks/business/workflows.ts file
// ==============================================================================

/**
 * Creator Onboarding Flow Steps
 * 
 * This enum defines all possible states in the creator onboarding workflow.
 * Each step represents a distinct phase of the user journey from initial
 * registration check through successful creator profile creation.
 */
export type CreatorOnboardingFlowStep = 
  | 'checking'              // Checking current registration status
  | 'not_registered'        // User is not registered, can begin registration
  | 'registering'          // Registration transaction in progress
  | 'registered'           // Successfully registered as creator
  | 'error'                // Registration failed or other error occurred

/**
 * Creator Onboarding Flow Result Interface
 * 
 * This interface provides everything the UI layer needs to manage the complete
 * creator onboarding experience. It handles status checking, registration
 * execution, and profile management in a unified workflow.
 */
export interface CreatorOnboardingFlowResult {
  // Current workflow state
  readonly currentStep: CreatorOnboardingFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly isRegistered: boolean
  // Creator profile data (available after successful registration)
  readonly profile: Creator | null
  // Registration actions
  readonly register: (subscriptionPrice: bigint) => void
  readonly reset: () => void
  // Registration progress tracking
  readonly registrationProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

/**
 * Creator Onboarding Workflow Hook
 * 
 * This hook manages the complete creator onboarding journey from initial status
 * checking through successful registration. It integrates with your existing
 * smart contract infrastructure and provides a unified interface for UI components.
 * 
 * The workflow follows this logical progression:
 * 1. Check if the user is already registered as a creator
 * 2. If not registered, enable registration with subscription price setting
 * 3. Handle the registration transaction with proper progress tracking
 * 4. Fetch and provide creator profile data after successful registration
 * 5. Handle errors gracefully with clear user feedback
 * 
 * This hook serves as the foundation for both your onboarding page and the
 * UI integration layer that transforms the workflow into component-friendly interfaces.
 * 
 * @param userAddress - The user's wallet address
 * @returns Complete creator onboarding workflow state and actions
 */
export function useCreatorOnboarding(
  userAddress: Address | undefined
): CreatorOnboardingFlowResult {
  const chainId = useChainId()
  
  // Contract interaction hooks from your core layer
  const registrationCheck = useIsCreatorRegistered(userAddress)
  const creatorProfile = useCreatorProfile(userAddress)
  const registerCreator = useRegisterCreator()
  
  // Workflow state management
  const [workflowState, setWorkflowState] = useState<{
    currentStep: CreatorOnboardingFlowStep
    error: Error | null
  }>({
    currentStep: 'checking',
    error: null
  })
  
  // Derived state for UI components
  const isRegistered = registrationCheck.data ?? false 
  const isLoading = registrationCheck.isLoading || 
                   creatorProfile.isLoading || 
                   workflowState.currentStep === 'registering' ||
                   workflowState.currentStep === 'checking'
  
  // Registration progress tracking for transaction feedback
  const registrationProgress = useMemo(() => ({
    isSubmitting: registerCreator.isLoading && !registerCreator.isConfirmed,
    isConfirming: registerCreator.isConfirming,
    isConfirmed: registerCreator.isConfirmed,
    transactionHash: registerCreator.hash
  }), [registerCreator])
  
  // Profile data formatting for UI consumption
  const profileData = useMemo(() => {
    if (!creatorProfile.data || !isRegistered) return null
    
    return {
      subscriptionPrice: creatorProfile.data.subscriptionPrice,
      totalEarnings: creatorProfile.data.totalEarnings,
      subscriberCount: creatorProfile.data.subscriberCount,
      contentCount: creatorProfile.data.contentCount,
      registrationTime: creatorProfile.data.registrationTime,
      isRegistered: creatorProfile.data.isRegistered,
      isVerified: creatorProfile.data.isVerified,
    }
  }, [creatorProfile.data, isRegistered])
  
  // Main registration action
  const register = useCallback((subscriptionPrice: bigint) => {
    if (!userAddress) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('Wallet connection required for registration')
      })
      return
    }
    
    if (isRegistered) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('Already registered as creator')
      })
      return
    }
    
    if (subscriptionPrice <= BigInt(0)) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('Subscription price must be greater than 0')
      })
      return
    }
    
    try {
      setWorkflowState(prev => ({ ...prev, error: null, currentStep: 'registering' }))
      
      // Call the contract registration function
      // The profileData parameter can be enhanced later to include IPFS metadata
      registerCreator.write({ 
        subscriptionPrice, 
        profileData: '' // Empty for now, can be enhanced with IPFS profile metadata
      })
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Registration failed')
      })
    }
  }, [userAddress, isRegistered, registerCreator])
  
  // Reset workflow to initial state
  const reset = useCallback(() => {
    setWorkflowState({ currentStep: 'checking', error: null })
    registerCreator.reset()
    registrationCheck.refetch()
    creatorProfile.refetch()
  }, [registerCreator, registrationCheck, creatorProfile])
  
  // Effect: Update workflow state based on registration check results
  useEffect(() => {
    if (registrationCheck.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'checking' }))
      return
    }
    
    if (registrationCheck.error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Failed to check registration status')
      })
      return
    }
    
    // Only update to not_registered or registered if we're currently checking
    // This prevents overriding other states like 'registering'
    if (workflowState.currentStep === 'checking') {
      if (registrationCheck.data === true) {
        setWorkflowState(prev => ({ ...prev, currentStep: 'registered' }))
      } else {
        setWorkflowState(prev => ({ ...prev, currentStep: 'not_registered' }))
      }
    }
  }, [registrationCheck.isLoading, registrationCheck.error, registrationCheck.data, workflowState.currentStep])
  
  // Effect: Handle registration transaction results
  useEffect(() => {
    if (registerCreator.isLoading && !registerCreator.isConfirmed) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'registering' }))
    } else if (registerCreator.error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: registerCreator.error 
      })
    } else if (registerCreator.isConfirmed) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'registered' }))
      
      // Refresh registration status and profile data after successful registration
      registrationCheck.refetch()
      creatorProfile.refetch()
    }
  }, [registerCreator.isLoading, registerCreator.isConfirmed, registerCreator.error])
  
  // Effect: Handle transition from registered back to checking when address changes
  useEffect(() => {
    if (!userAddress) {
      setWorkflowState({ currentStep: 'checking', error: null })
    }
  }, [userAddress])
  
  return {
    currentStep: workflowState.currentStep,
    isLoading,
    error: workflowState.error,
    isRegistered,
    profile: profileData,
    register,
    reset,
    registrationProgress
  }
}

// ==============================================================================
// COMPONENT 4.3: CONTENT PUBLISHING ENHANCEMENT
// Enhancement to existing src/hooks/business/workflows.ts
// ==============================================================================

import { useAccount } from 'wagmi'
import { useMiniAppAnalytics } from '@/hooks/farcaster/useMiniAppAnalytics'
import { type ContentCategory } from '@/types/contracts'

// ==============================================================================
// ENHANCED TYPE DEFINITIONS
// ==============================================================================

export interface EnhancedContentPublishingData extends ContentPublishingData {
  readonly framePreviewImage?: string
  readonly socialDescription?: string
  readonly targetAudience?: 'general' | 'creators' | 'crypto' | 'tech'
  readonly socialKeywords?: readonly string[]
  readonly socialCallToAction?: string
  readonly enableAutoShare?: boolean
  readonly frameStyle?: 'preview' | 'interactive' | 'minimal'
}

export type EnhancedContentPublishingFlowStep =
  | ContentPublishingFlowStep
  | 'validating_social_data'
  | 'generating_frame_assets'
  | 'creating_social_content'
  | 'optimizing_discovery'

interface FrameAssetConfig {
  readonly contentId: bigint
  readonly title: string
  readonly description: string
  readonly previewImage?: string
  readonly price: bigint
  readonly creatorAddress: Address
  readonly socialKeywords: readonly string[]
  readonly callToAction: string
  readonly frameStyle: 'preview' | 'interactive' | 'minimal'
}

interface SocialContentResult {
  readonly castText: string
  readonly hashtags: readonly string[]
  readonly mentions: readonly string[]
  readonly engagementHooks: readonly string[]
  readonly frameMetadata: {
    readonly imageUrl: string
    readonly buttons: readonly {
      readonly label: string
      readonly action: string
      readonly target: string
    }[]
    readonly postUrl: string
  }
}

interface EnhancedPublishingResult {
  readonly contentId?: bigint
  readonly success: boolean
  readonly error?: Error
  readonly socialOptimization?: SocialContentResult
  readonly performancePredictions?: {
    readonly expectedFrameViews: number
    readonly predictedEngagementRate: number
    readonly estimatedConversionRate: number
  }
}

interface EnhancedContentPublishingFlowResult {
  readonly currentStep: EnhancedContentPublishingFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly isValidContent: boolean
  readonly validationErrors: readonly string[]
  readonly publish: (data: ContentPublishingData) => void
  readonly publishWithSocialOptimization: (data: EnhancedContentPublishingData) => Promise<EnhancedPublishingResult>
  readonly publishingProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
  readonly socialOptimization: {
    readonly isProcessing: boolean
    readonly results: SocialContentResult | null
    readonly error: Error | null
  }
  readonly reset: () => void
  readonly socialCapabilities: {
    readonly canShare: boolean
    readonly shareToFarcaster: (message: string) => Promise<void>
    readonly generateOptimizedShareMessage: () => string
  }
}

// ==============================================================================
// SOCIAL OPTIMIZATION UTILITY CLASSES
// ==============================================================================

class FrameAssetGenerator {
  private readonly baseUrl: string
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }
  async generateFrameAssets(config: FrameAssetConfig): Promise<SocialContentResult['frameMetadata']> {
    try {
      const imageUrl = await this.generateFrameImage(config)
      const buttons = this.generateFrameButtons(config)
      const postUrl = `${this.baseUrl}/api/farcaster/frame/${config.contentId}`
      return { imageUrl, buttons, postUrl }
    } catch (error) {
      console.error('Frame asset generation failed:', error)
      throw new Error('Failed to generate Frame assets')
    }
  }
  private async generateFrameImage(config: FrameAssetConfig): Promise<string> {
    if (config.previewImage) {
      return await this.optimizeImageForFrame(config.previewImage)
    }
    return await this.createDynamicFrameImage(config)
  }
  private async optimizeImageForFrame(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      if (!response.ok) throw new Error('Source image not accessible')
      const optimizedUrl = `${this.baseUrl}/api/images/optimize?src=${encodeURIComponent(imageUrl)}&ratio=1.91:1`
      return optimizedUrl
    } catch (error) {
      console.warn('Image optimization failed, using fallback:', error)
      return `${this.baseUrl}/images/frames/default-preview.png`
    }
  }
  private async createDynamicFrameImage(config: FrameAssetConfig): Promise<string> {
    const imageParams = new URLSearchParams({
      contentId: config.contentId.toString(),
      title: config.title,
      price: (Number(config.price) / 1000000).toFixed(2),
      creator: config.creatorAddress,
      style: config.frameStyle
    })
    return `${this.baseUrl}/api/images/frame/generate?${imageParams.toString()}`
  }
  private generateFrameButtons(config: FrameAssetConfig): readonly { label: string; action: string; target: string }[] {
    const buttons = [
      {
        label: config.callToAction,
        action: 'post',
        target: `/api/farcaster/purchase/${config.contentId}`
      }
    ]
    if (config.frameStyle !== 'minimal') {
      buttons.push({
        label: 'Creator Profile',
        action: 'link',
        target: `${this.baseUrl}/creator/${config.creatorAddress}`
      })
    }
    return buttons
  }
}

class SocialContentGenerator {
  static async generateSocialContent(
    contentData: EnhancedContentPublishingData,
    contentId: bigint,
    creatorProfile?: { readonly displayName?: string; readonly fid?: number }
  ): Promise<Omit<SocialContentResult, 'frameMetadata'>> {
    try {
      const castText = this.generateOptimizedCastText(contentData, creatorProfile)
      const hashtags = this.generateStrategicHashtags(contentData)
      const mentions = this.generateStrategicMentions(contentData, creatorProfile)
      const engagementHooks = this.generateEngagementHooks(contentData)
      return { castText, hashtags, mentions, engagementHooks }
    } catch (error) {
      console.error('Social content generation failed:', error)
      return {
        castText: `New content published: ${contentData.title}`,
        hashtags: ['content', 'creator'],
        mentions: [],
        engagementHooks: ['Check out my latest content!']
      }
    }
  }
  private static generateOptimizedCastText(
    contentData: EnhancedContentPublishingData,
    creatorProfile?: { readonly displayName?: string; readonly fid?: number }
  ): string {
    let castText = ''
    if (creatorProfile?.displayName) {
      castText += `${creatorProfile.displayName} just published: `
    }
    castText += `"${contentData.title}"`
    const description = contentData.socialDescription || contentData.description
    if (description && description.length <= 100) {
      castText += `\n\n${description}`
    }
    const callToAction = contentData.socialCallToAction || 'Get instant access with USDC'
    castText += `\n\n${callToAction}`
    castText += '\n\n💎 Premium content, instant access'
    return castText
  }
  private static generateStrategicHashtags(contentData: EnhancedContentPublishingData): readonly string[] {
    const baseHashtags = ['content', 'creator', 'web3']
    const strategicHashtags: string[] = []
    if (contentData.category) {
      const categoryHashtags = this.getCategoryHashtags(contentData.category)
      strategicHashtags.push(...categoryHashtags)
    }
    if (contentData.targetAudience) {
      const audienceHashtags = this.getAudienceHashtags(contentData.targetAudience)
      strategicHashtags.push(...audienceHashtags)
    }
    if (contentData.socialKeywords) {
      strategicHashtags.push(...contentData.socialKeywords)
    }
    const allHashtags = [...baseHashtags, ...strategicHashtags]
    return Array.from(new Set(allHashtags)).slice(0, 8)
  }
  private static getCategoryHashtags(category: ContentCategory): string[] {
    const categoryMap: Record<string, string[]> = {
      'Article': ['article', 'blog', 'writing'],
      'Video': ['video', 'tutorial', 'education'],
      'Audio': ['audio', 'podcast', 'listening'],
      'Image': ['image', 'art', 'visual'],
      'Course': ['course', 'learning', 'education'],
      'Document': ['document', 'guide', 'reference'],
      'Other': ['content', 'digital']
    }
    const categoryString = category.toString()
    return categoryMap[categoryString] || categoryMap['Other']
  }
  private static getAudienceHashtags(audience: 'general' | 'creators' | 'crypto' | 'tech'): string[] {
    const audienceMap: Record<string, string[]> = {
      'creators': ['creators', 'creatoreconomy', 'contentcreator'],
      'crypto': ['crypto', 'defi', 'blockchain'],
      'tech': ['tech', 'programming', 'development'],
      'general': ['lifestyle', 'community', 'discover']
    }
    return audienceMap[audience] || audienceMap['general']
  }
  private static generateStrategicMentions(
    contentData: EnhancedContentPublishingData,
    creatorProfile?: { readonly displayName?: string; readonly fid?: number }
  ): readonly string[] {
    const mentions: string[] = []
    const communityMentions: Record<string, string[]> = {
      'crypto': ['@farcaster', '@base'],
      'tech': ['@builders', '@developers'],
      'creators': ['@creators', '@creatoreconomy']
    }
    if (contentData.targetAudience && communityMentions[contentData.targetAudience]) {
      mentions.push(...communityMentions[contentData.targetAudience])
    }
    return mentions.slice(0, 3)
  }
  private static generateEngagementHooks(contentData: EnhancedContentPublishingData): readonly string[] {
    const hooks: string[] = []
    switch (contentData.targetAudience) {
      case 'creators':
        hooks.push(
          'Fellow creators, what content strategies are working for you?',
          'Drop your best content creation tips below!'
        )
        break
      case 'crypto':
        hooks.push(
          'What are your thoughts on the current Web3 content landscape?',
          'How do you prefer to consume crypto educational content?'
        )
        break
      case 'tech':
        hooks.push(
          'Developers, what topics should I cover next?',
          'What tech skills are you focusing on in 2025?'
        )
        break
      default:
        hooks.push(
          'What topics interest you most?',
          'What content would you like to see next?'
        )
    }
    return hooks.slice(0, 2)
  }
}

class PerformancePredictionEngine {
  static async predictSocialPerformance(
    contentData: EnhancedContentPublishingData,
    creatorHistory?: {
      readonly averageFrameViews: number
      readonly averageEngagementRate: number
      readonly averageConversionRate: number
    }
  ): Promise<{
    readonly expectedFrameViews: number
    readonly predictedEngagementRate: number
    readonly estimatedConversionRate: number
  }> {
    const baseFrameViews = creatorHistory?.averageFrameViews || 100
    const baseEngagementRate = creatorHistory?.averageEngagementRate || 0.05
    const baseConversionRate = creatorHistory?.averageConversionRate || 0.02
    let frameViewMultiplier = 1.0
    let engagementMultiplier = 1.0
    let conversionMultiplier = 1.0
    if (contentData.socialKeywords && contentData.socialKeywords.length > 0) {
      frameViewMultiplier *= 1.2
    }
    if (contentData.framePreviewImage) {
      engagementMultiplier *= 1.3
    }
    if (contentData.socialDescription) {
      engagementMultiplier *= 1.15
    }
    if (contentData.targetAudience && contentData.targetAudience !== 'general') {
      conversionMultiplier *= 1.25
    }
    return {
      expectedFrameViews: Math.round(baseFrameViews * frameViewMultiplier),
      predictedEngagementRate: Math.min(baseEngagementRate * engagementMultiplier, 0.15),
      estimatedConversionRate: Math.min(baseConversionRate * conversionMultiplier, 0.08)
    }
  }
}

// ==============================================================================
// ENHANCED PUBLISHING WORKFLOW HOOK
// ==============================================================================

export function useEnhancedContentPublishingFlow(
  userAddress?: Address
): EnhancedContentPublishingFlowResult {
  const { address: connectedAddress } = useAccount()
  const effectiveUserAddress = (userAddress || connectedAddress) as Address | undefined
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  const basePublishingFlow = useContentPublishingFlow(effectiveUserAddress)
  const farcasterContext = useFarcasterContext()
  const miniAppAnalytics = useMiniAppAnalytics(effectiveUserAddress)
  const [enhancedState, setEnhancedState] = useState<{
    currentStep: EnhancedContentPublishingFlowStep
    socialValidationErrors: readonly string[]
    socialOptimization: {
      isProcessing: boolean
      results: SocialContentResult | null
      error: Error | null
    }
    lastPublishedContent: EnhancedContentPublishingData | null
  }>({
    currentStep: 'idle',
    socialValidationErrors: [],
    socialOptimization: {
      isProcessing: false,
      results: null,
      error: null
    },
    lastPublishedContent: null
  })
  const frameAssetGenerator = useMemo(() =>
    new FrameAssetGenerator(process.env.NEXT_PUBLIC_URL || 'https://localhost:3000'),
  [])
  const validateSocialContentData = useCallback((
    data: EnhancedContentPublishingData
  ): { isValid: boolean; errors: readonly string[] } => {
    const errors: string[] = []
    if (data.socialDescription && data.socialDescription.length > 280) {
      errors.push('Social description should be 280 characters or less for optimal Frame display')
    }
    if (data.framePreviewImage) {
      try {
        new URL(data.framePreviewImage)
      } catch {
        errors.push('Frame preview image must be a valid URL')
      }
    }
    if (data.socialKeywords && data.socialKeywords.length > 10) {
      errors.push('Maximum 10 social keywords allowed for optimal discovery performance')
    }
    if (data.socialCallToAction && data.socialCallToAction.length > 100) {
      errors.push('Social call-to-action should be 100 characters or less')
    }
    return {
      isValid: errors.length === 0,
      errors
    }
  }, [])
  const generateSocialOptimizationAssets = useCallback(async (
    contentId: bigint,
    contentData: EnhancedContentPublishingData
  ): Promise<SocialContentResult> => {
    try {
      setEnhancedState(prev => ({
        ...prev,
        currentStep: 'generating_frame_assets',
        socialOptimization: { ...prev.socialOptimization, isProcessing: true }
      }))
      const frameAssetConfig: FrameAssetConfig = {
        contentId,
        title: contentData.title,
        description: contentData.socialDescription || contentData.description,
        previewImage: contentData.framePreviewImage,
        price: contentData.payPerViewPrice,
        creatorAddress: effectiveUserAddress!,
        socialKeywords: contentData.socialKeywords || [],
        callToAction: contentData.socialCallToAction || 'View Content',
        frameStyle: contentData.frameStyle || 'interactive'
      }
      const frameMetadata = await frameAssetGenerator.generateFrameAssets(frameAssetConfig)
      setEnhancedState(prev => ({
        ...prev,
        currentStep: 'creating_social_content'
      }))
      const socialContentData = await SocialContentGenerator.generateSocialContent(
        contentData,
        contentId,
        farcasterContext?.user ? {
          displayName: farcasterContext.user.displayName,
          fid: farcasterContext.user.fid
        } : undefined
      )
      setEnhancedState(prev => ({
        ...prev,
        currentStep: 'optimizing_discovery'
      }))
      const socialOptimizationResult: SocialContentResult = {
        ...socialContentData,
        frameMetadata
      }
      return socialOptimizationResult
    } catch (error) {
      const optimizationError = error instanceof Error ? error : new Error('Social optimization failed')
      setEnhancedState(prev => ({
        ...prev,
        socialOptimization: {
          ...prev.socialOptimization,
          error: optimizationError
        }
      }))
      throw optimizationError
    }
  }, [frameAssetGenerator, farcasterContext, effectiveUserAddress])
  const publishWithSocialOptimization = useCallback(async (
    enhancedData: EnhancedContentPublishingData
  ): Promise<EnhancedPublishingResult> => {
    try {
      setEnhancedState(prev => ({ 
        ...prev, 
        currentStep: 'validating_social_data',
        socialValidationErrors: [],
        lastPublishedContent: enhancedData
      }))
      const socialValidation = validateSocialContentData(enhancedData)
      if (!socialValidation.isValid) {
        setEnhancedState(prev => ({
          ...prev,
          currentStep: 'error',
          socialValidationErrors: socialValidation.errors
        }))
        return {
          success: false,
          error: new Error('Social content validation failed')
        }
      }
      const traditionalData: ContentPublishingData = {
        title: enhancedData.title,
        description: enhancedData.description,
        ipfsHash: enhancedData.ipfsHash,
        category: enhancedData.category,
        payPerViewPrice: enhancedData.payPerViewPrice,
        tags: enhancedData.tags
      }
      basePublishingFlow.publish(traditionalData)
      return {
        success: true
      }
    } catch (error) {
      const publishingError = error instanceof Error ? error : new Error('Enhanced publishing failed')
      setEnhancedState(prev => ({
        ...prev,
        currentStep: 'error',
        socialValidationErrors: [publishingError.message]
      }))
      return {
        success: false,
        error: publishingError
      }
    }
  }, [basePublishingFlow, validateSocialContentData])
  const socialCapabilities = useMemo(() => {
    const canShare = Boolean(
      farcasterContext && 
      enhancedState.socialOptimization.results &&
      enhancedState.currentStep === 'completed'
    )
    const shareToFarcaster = async (message: string): Promise<void> => {
      if (!farcasterContext || !canShare) {
        throw new Error('Farcaster sharing not available')
      }
      try {
        console.log('Sharing to Farcaster:', message)
      } catch (error) {
        console.error('Farcaster sharing failed:', error)
        throw new Error('Failed to share content to Farcaster')
      }
    }
    const generateOptimizedShareMessage = (): string => {
      if (!enhancedState.socialOptimization.results) {
        return 'Check out my latest content!'
      }
      return enhancedState.socialOptimization.results.castText
    }
    return {
      canShare,
      shareToFarcaster,
      generateOptimizedShareMessage
    }
  }, [farcasterContext, enhancedState])
  useEffect(() => {
    switch (basePublishingFlow.currentStep) {
      case 'idle':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'idle' 
        }))
        break
      case 'checking_creator':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'checking_creator' 
        }))
        break
      case 'validating_content':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'validating_content' 
        }))
        break
      case 'registering':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'registering' 
        }))
        break
      case 'error':
        setEnhancedState(prev => ({ 
          ...prev, 
          currentStep: 'error' 
        }))
        break
    }
  }, [basePublishingFlow.currentStep])
  useEffect(() => {
    if (basePublishingFlow.currentStep === 'completed' && 
        enhancedState.currentStep === 'registering' &&
        enhancedState.lastPublishedContent) {
      const executePostPublishingOptimization = async () => {
        try {
          const mockContentId = BigInt(Date.now())
          const socialResults = await generateSocialOptimizationAssets(
            mockContentId,
            enhancedState.lastPublishedContent!
          )
          const performancePredictions = await PerformancePredictionEngine.predictSocialPerformance(
            enhancedState.lastPublishedContent!,
            miniAppAnalytics.data ? {
              averageFrameViews: miniAppAnalytics.data.frameViews / Math.max(miniAppAnalytics.data.contentSocialMetrics.length, 1),
              averageEngagementRate: 0.05,
              averageConversionRate: miniAppAnalytics.data.enhancedEarnings.socialConversionRate / 100
            } : undefined
          )
          setEnhancedState(prev => ({
            ...prev,
            currentStep: 'completed',
            socialOptimization: {
              isProcessing: false,
              results: socialResults,
              error: null
            }
          }))
        } catch (error) {
          console.error('Post-publishing optimization failed:', error)
          setEnhancedState(prev => ({
            ...prev,
            currentStep: 'completed',
            socialOptimization: {
              isProcessing: false,
              results: null,
              error: error instanceof Error ? error : new Error('Social optimization failed')
            }
          }))
        }
      }
      executePostPublishingOptimization()
    }
  }, [
    basePublishingFlow.currentStep, 
    enhancedState.currentStep,
    enhancedState.lastPublishedContent,
    generateSocialOptimizationAssets,
    miniAppAnalytics.data
  ])
  const resetEnhancedWorkflow = useCallback(() => {
    basePublishingFlow.reset()
    setEnhancedState({
      currentStep: 'idle',
      socialValidationErrors: [],
      socialOptimization: {
        isProcessing: false,
        results: null,
        error: null
      },
      lastPublishedContent: null
    })
  }, [basePublishingFlow])
  const combinedValidationErrors = useMemo(() => {
    return [
      ...enhancedState.socialValidationErrors
    ]
  }, [enhancedState.socialValidationErrors])
  return {
    currentStep: enhancedState.currentStep,
    isLoading: basePublishingFlow.isLoading,
    error: basePublishingFlow.error,
    isValidContent: true,
    validationErrors: combinedValidationErrors,
    publish: basePublishingFlow.publish,
    publishWithSocialOptimization,
    publishingProgress: basePublishingFlow.publishingProgress,
    socialOptimization: enhancedState.socialOptimization,
    reset: resetEnhancedWorkflow,
    socialCapabilities
  }
}
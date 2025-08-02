import { useCallback, useMemo, useState, useEffect } from 'react'
import { Address } from 'viem'
import { useChainId, useAccount } from 'wagmi'
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
import { useMiniAppAnalytics } from '@/hooks/farcaster/useMiniAppAnalytics'
import { type ContentCategory } from '@/types/contracts'

// Farcaster Context Interface
export interface FarcasterContext {
  readonly user: {
    readonly fid: number
    readonly username: string
    readonly displayName: string
    readonly pfpUrl: string
  }
  readonly client: {
    readonly name: string
    readonly version: string
  }
  readonly location: 'cast' | 'composer' | 'notification' | 'profile' | 'unknown'
}

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

// Type Definitions
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

export type ContentPurchaseFlowStep = 
  | 'checking_access'
  | 'cannot_purchase'
  | 'need_approval'
  | 'can_purchase'
  | 'purchasing'
  | 'completed'
  | 'error'

export interface ContentPurchaseFlowResult {
  readonly currentStep: ContentPurchaseFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly hasAccess: boolean | null
  readonly content: {
    readonly id: bigint
    readonly title: string
    readonly description: string
    readonly payPerViewPrice: bigint
    readonly creator: Address
    readonly category: number
    readonly isActive: boolean
  } | null
  readonly canAfford: boolean
  readonly needsApproval: boolean
  readonly userBalance: bigint | null
  readonly requiredAllowance: bigint | null
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
}

export function useContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): ContentPurchaseFlowResult {
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
  
  const [workflowState, setWorkflowState] = useState<{
    currentStep: ContentPurchaseFlowStep
    error: Error | null
  }>({
    currentStep: 'checking_access',
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
  
  const requiredAllowance = useMemo(() => {
    if (!contentData.data) return null
    return contentData.data.payPerViewPrice
  }, [contentData.data])
  
  const isLoading = useMemo(() => {
    return hasAccess.isLoading || 
           contentData.isLoading || 
           userBalance.isLoading ||
           tokenAllowance.isLoading ||
           workflowState.currentStep === 'purchasing' ||
           workflowState.currentStep === 'checking_access'
  }, [hasAccess.isLoading, contentData.isLoading, userBalance.isLoading, tokenAllowance.isLoading, workflowState.currentStep])
  
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
  
  const reset = useCallback(() => {
    setWorkflowState({ currentStep: 'checking_access', error: null })
    approveToken.reset()
    purchaseContent.reset()
    hasAccess.refetch()
  }, [approveToken, purchaseContent, hasAccess])
  
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

export interface ContentPublishingData {
  readonly title: string
  readonly description: string
  readonly ipfsHash: string
  readonly category: number
  readonly payPerViewPrice: bigint
  readonly tags: readonly string[]
}

export type ContentPublishingFlowStep = 
  | 'idle'
  | 'checking_creator'
  | 'validating_content'
  | 'registering'
  | 'completed'
  | 'error'

export interface ContentPublishingFlowResult {
  readonly currentStep: ContentPublishingFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly canPublish: boolean
  readonly isCreatorRegistered: boolean
  readonly publishedContentId: bigint | null
  readonly publish: (data: ContentPublishingData) => void
  readonly reset: () => void
  readonly publishingProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

export function useContentPublishingFlow(
  userAddress: Address | undefined
): ContentPublishingFlowResult {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  
  const creatorRegistration = useIsCreatorRegistered(userAddress)
  const registerContent = useRegisterContent()
  const userBalance = useTokenBalance(contractAddresses.USDC, userAddress)
  
  const [workflowState, setWorkflowState] = useState<{
    currentStep: ContentPublishingFlowStep
    error: Error | null
    publishedContentId: bigint | null
  }>({
    currentStep: 'idle',
    error: null,
    publishedContentId: null
  })
  
  const isCreatorRegistered = creatorRegistration.data ?? false
  const canPublish = isCreatorRegistered && workflowState.currentStep === 'idle'
  const isLoading = workflowState.currentStep !== 'idle' && 
                   workflowState.currentStep !== 'completed' && 
                   workflowState.currentStep !== 'error'
  
  const publishingProgress = useMemo(() => ({
    isSubmitting: registerContent.isLoading && !registerContent.isConfirmed,
    isConfirming: registerContent.isLoading && registerContent.isConfirmed,
    isConfirmed: registerContent.isConfirmed,
    transactionHash: registerContent.hash
  }), [registerContent])
  
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
    
    if (data.payPerViewPrice > BigInt(1000000000)) {
      errors.push('Price cannot exceed 1000 USDC')
    }
    
    return errors
  }, [])
  
  const publish = useCallback((data: ContentPublishingData) => {
    if (!userAddress) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('Wallet connection required'),
        publishedContentId: null
      })
      return
    }
    
    setWorkflowState(prev => ({ ...prev, currentStep: 'checking_creator', error: null }))
    
    if (!isCreatorRegistered) {
      setWorkflowState({
        currentStep: 'error',
        error: new Error('You must be a registered creator to publish content'),
        publishedContentId: null
      })
      return
    }
    
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
  
  const reset = useCallback(() => {
    setWorkflowState({
      currentStep: 'idle',
      error: null,
      publishedContentId: null
    })
  }, [])
  
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

export type CreatorOnboardingFlowStep = 
  | 'checking'
  | 'not_registered'
  | 'registering'
  | 'registered'
  | 'error'

export interface CreatorOnboardingFlowResult {
  readonly currentStep: CreatorOnboardingFlowStep
  readonly isLoading: boolean
  readonly error: Error | null
  readonly isRegistered: boolean
  readonly profile: Creator | null
  readonly register: (subscriptionPrice: bigint, profileData: string) => void
  readonly reset: () => void
  readonly registrationProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

export function useCreatorOnboarding(
  userAddress: Address | undefined
): CreatorOnboardingFlowResult {
  const chainId = useChainId()
  
  const registrationCheck = useIsCreatorRegistered(userAddress)
  const creatorProfile = useCreatorProfile(userAddress)
  const registerCreator = useRegisterCreator()
  
  const [workflowState, setWorkflowState] = useState<{
    currentStep: CreatorOnboardingFlowStep
    error: Error | null
    lastTransactionHash: string | null
    hasJustRegistered: boolean
  }>({
    currentStep: 'checking',
    error: null,
    lastTransactionHash: null,
    hasJustRegistered: false
  })
  
  const isRegistered = registrationCheck.data ?? false
  const isLoading = registrationCheck.isLoading || 
                   creatorProfile.isLoading || 
                   registerCreator.isLoading
  
  const registrationProgress = useMemo(() => ({
    isSubmitting: registerCreator.isLoading && !registerCreator.isConfirmed,
    isConfirming: registerCreator.isLoading && !registerCreator.isConfirmed,
    isConfirmed: registerCreator.isConfirmed,
    transactionHash: registerCreator.hash
  }), [registerCreator.isLoading, registerCreator.isConfirmed, registerCreator.hash])
  
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
  
  const register = useCallback(async (subscriptionPrice: bigint, profileData: string) => {
    if (!userAddress) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Wallet not connected') 
      }))
      return
    }
    
    if (isRegistered) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Already registered as creator') 
      }))
      return
    }
    
    if (!profileData || profileData.trim().length === 0) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Profile data cannot be empty') 
      }))
      return
    }
    
    if (subscriptionPrice < BigInt(10000) || subscriptionPrice > BigInt(100000000)) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Subscription price must be between $0.01 and $100.00') 
      }))
      return
    }
    
    try {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'registering',
        error: null,
        hasJustRegistered: false
      }))
      
      console.group('🚀 Enhanced Hook: Starting Creator Registration')
      console.log('Subscription Price (BigInt):', subscriptionPrice.toString())
      console.log('Profile Data:', profileData)
      console.log('User Address:', userAddress)
      console.groupEnd()
      
      registerCreator.write({
        subscriptionPrice,
        profileData
      })
      
    } catch (error) {
      console.error('Registration hook error:', error)
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Registration failed')
      }))
    }
  }, [userAddress, isRegistered, registerCreator])
  
  const reset = useCallback(() => {
    setWorkflowState({ 
      currentStep: 'checking', 
      error: null,
      lastTransactionHash: null,
      hasJustRegistered: false
    })
    registerCreator.reset()
    registrationCheck.refetch()
    creatorProfile.refetch()
  }, [registerCreator, registrationCheck, creatorProfile])
  
  useEffect(() => {
    const currentTxHash = registerCreator.hash
    if (!currentTxHash || currentTxHash === workflowState.lastTransactionHash) {
      return
    }
    
    if (registerCreator.isLoading && !registerCreator.isConfirmed) {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'registering',
        lastTransactionHash: currentTxHash
      }))
    } else if (registerCreator.error) {
      console.error('Registration transaction error:', registerCreator.error)
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: registerCreator.error,
        lastTransactionHash: currentTxHash
      }))
    } else if (registerCreator.isConfirmed) {
      console.group('✅ Enhanced Hook: Transaction Confirmed!')
      console.log('Transaction Hash:', currentTxHash)
      console.log('Setting state to registered and flagging as just registered')
      console.groupEnd()
      
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'registered',
        lastTransactionHash: currentTxHash,
        hasJustRegistered: true,
        error: null
      }))
      
      setTimeout(() => {
        console.log('🔄 Refreshing registration and profile data...')
        registrationCheck.refetch()
        creatorProfile.refetch()
      }, 1000)
    }
  }, [
    registerCreator.isLoading, 
    registerCreator.isConfirmed, 
    registerCreator.error, 
    registerCreator.hash,
    workflowState.lastTransactionHash,
    registrationCheck, 
    creatorProfile
  ])
  
  useEffect(() => {
    if (workflowState.hasJustRegistered) {
      console.log('🛡️ Protected: Ignoring registration check because we just registered')
      return
    }
    
    if (workflowState.currentStep === 'registering') {
      console.log('🛡️ Protected: Ignoring registration check during registration process')
      return
    }
    
    if (registrationCheck.isLoading) {
      if (workflowState.currentStep === 'checking') {
        setWorkflowState(prev => ({ ...prev, currentStep: 'checking' }))
      }
      return
    }
    
    if (registrationCheck.error) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error', 
        error: new Error('Failed to check registration status')
      }))
      return
    }
    
    if (workflowState.currentStep === 'checking') {
      if (registrationCheck.data === true) {
        console.log('📊 Registration check confirmed: User is registered')
        setWorkflowState(prev => ({ 
          ...prev, 
          currentStep: 'registered',
          hasJustRegistered: false
        }))
      } else {
        console.log('📊 Registration check confirmed: User is not registered')
        setWorkflowState(prev => ({ 
          ...prev, 
          currentStep: 'not_registered'
        }))
      }
    }
  }, [
    registrationCheck.isLoading, 
    registrationCheck.error, 
    registrationCheck.data, 
    workflowState.currentStep,
    workflowState.hasJustRegistered
  ])
  
  useEffect(() => {
    if (workflowState.hasJustRegistered && 
        registrationCheck.data === true && 
        !registrationCheck.isLoading) {
      console.log('🎯 Data refresh confirmed registration - clearing just registered flag')
      setWorkflowState(prev => ({ 
        ...prev, 
        hasJustRegistered: false 
      }))
    }
  }, [workflowState.hasJustRegistered, registrationCheck.data, registrationCheck.isLoading])
  
  useEffect(() => {
    if (userAddress) {
      console.log('👤 Address changed, resetting workflow:', userAddress)
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'checking',
        error: null,
        lastTransactionHash: null,
        hasJustRegistered: false
      }))
    }
  }, [userAddress])
  
  useEffect(() => {
    console.group('🔍 Enhanced Hook State Debug')
    console.log('Current Step:', workflowState.currentStep)
    console.log('Has Just Registered:', workflowState.hasJustRegistered)
    console.log('Registration Check Data:', registrationCheck.data)
    console.log('Registration Check Loading:', registrationCheck.isLoading)
    console.log('Profile Data Available:', !!profileData)
    console.log('Transaction Hash:', workflowState.lastTransactionHash)
    console.groupEnd()
  }, [
    workflowState.currentStep, 
    workflowState.hasJustRegistered,
    registrationCheck.data, 
    registrationCheck.isLoading, 
    profileData,
    workflowState.lastTransactionHash
  ])
  
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
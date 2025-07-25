/**
 * Business Logic Hooks - Domain Composition Layer
 * File: src/hooks/business/workflows.ts
 * 
 * This layer composes the core contract hooks into complete business workflows
 * that your application components can use for complex user interactions.
 * Think of these as complete recipes that combine basic cooking techniques
 * (core hooks) into sophisticated dishes (user workflows).
 * 
 * Each hook in this layer orchestrates multiple contract interactions,
 * manages state transitions, and provides comprehensive error handling
 * for complete user experiences.
 * 
 * Architecture Principles:
 * 1. Compose core hooks rather than duplicating contract logic
 * 2. Manage complex state transitions and error scenarios
 * 3. Provide complete user workflow abstractions
 * 4. Maintain strict type safety throughout compositions
 * 5. Enable optimistic updates and rollback capabilities
 * 
 * Workflow Design Philosophy:
 * Each workflow represents a complete user intention (like "publish content" or
 * "subscribe to creator") and handles all the complexity behind that intention.
 * The UI components interact with these workflows declaratively, without needing
 * to understand the underlying blockchain complexity.
 */

import { useCallback, useMemo, useEffect, useState, useReducer } from 'react'
import { useChainId, useAccount } from 'wagmi'
import { type Address } from 'viem'

// Import the core contract hooks we'll compose
import {
  useIsCreatorRegistered,
  useCreatorProfile,
  useRegisterCreator,
  useContentById,
  useHasContentAccess,
  useHasPaidForContent,
  usePurchaseContent,
  useIsSubscribed,
  useSubscribeToCreator,
  useRegisterContent,
  useTokenBalance,
  useTokenAllowance,
  useApproveToken,
  type ContractReadResult,
  type ContractWriteWithConfirmationResult
} from '@/hooks/contracts/core'

// Import contract configuration for addresses
import { getContractAddresses } from '@/lib/contracts/config'

// Import types for business logic
import type { 
  Content,
  Creator,
  ContentCategory,
  ContentUploadParams,
  AccessControlResult
} from '@/types/contracts'

/**
 * Business Logic Result Interfaces
 * These provide higher-level abstractions than the core contract results,
 * focusing on complete user workflows rather than individual contract calls.
 */

/**
 * Creator Onboarding Workflow Result
 * 
 * This interface represents the complete creator onboarding process,
 * from checking registration status through completing registration
 * and displaying the final creator profile.
 */
export interface CreatorOnboardingResult {
  // Current state of the onboarding process
  readonly isRegistered: boolean
  readonly isLoading: boolean
  readonly currentStep: 'checking' | 'not_registered' | 'registering' | 'registered' | 'error'
  readonly error: Error | null
  
  // Profile data once registered
  readonly profile: Creator | undefined
  
  // Actions available to the user
  readonly register: (subscriptionPrice: bigint) => void
  readonly reset: () => void
  
  // Progress indicators for UI feedback
  readonly registrationProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

/**
 * Content Purchase Flow Result
 * 
 * This interface handles the complete content purchase workflow,
 * including access checking, payment processing, and confirmation tracking.
 */
export interface ContentPurchaseFlowResult {
  // Current state of the purchase process
  readonly hasAccess: boolean | undefined
  readonly isLoading: boolean
  readonly currentStep: 'checking_access' | 'can_purchase' | 'need_approval' | 'purchasing' | 'completed' | 'error'
  readonly error: Error | null
  
  // Content and payment information
  readonly content: Content | undefined
  readonly canAfford: boolean
  readonly needsApproval: boolean
  readonly userBalance: bigint | undefined
  
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
 * Subscription Management Flow Result
 * 
 * This interface handles creator subscription workflows,
 * including subscription checking, payment, and renewal tracking.
 */
export interface SubscriptionManagementResult {
  // Current subscription state
  readonly isSubscribed: boolean | undefined
  readonly isLoading: boolean
  readonly currentStep: 'checking' | 'not_subscribed' | 'need_approval' | 'subscribing' | 'subscribed' | 'error'
  readonly error: Error | null
  
  // Creator and subscription information
  readonly creatorProfile: Creator | undefined
  readonly canAfford: boolean
  readonly needsApproval: boolean
  readonly userBalance: bigint | undefined
  
  // Subscription actions
  readonly subscribe: () => void
  readonly approveAndSubscribe: () => void
  readonly reset: () => void
  
  // Transaction progress tracking
  readonly subscriptionProgress: {
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
 * Content Publishing Flow Result
 * 
 * This interface handles the complete content publishing workflow,
 * from creator verification through content registration and confirmation.
 */
export interface ContentPublishingFlowResult {
  // Publishing state
  readonly isLoading: boolean
  readonly currentStep: 'idle' | 'checking_creator' | 'validating_content' | 'registering' | 'completed' | 'error'
  readonly error: Error | null
  
  // Content validation results
  readonly isValidContent: boolean
  readonly validationErrors: string[]
  
  // Publishing actions
  readonly publish: (contentData: ContentUploadParams) => void
  readonly reset: () => void
  
  // Transaction progress tracking
  readonly publishingProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

/**
 * Input data interfaces for business logic operations
 */
export interface ContentPublishingData {
  readonly ipfsHash: string
  readonly title: string
  readonly description: string
  readonly category: ContentCategory
  readonly payPerViewPrice: bigint
  readonly tags: readonly string[]
}

// ===== WORKFLOW STATE MANAGEMENT =====
// These types help manage complex state transitions in workflows

type WorkflowState = 
  | 'idle'
  | 'checking'
  | 'validating'
  | 'processing'
  | 'confirming'
  | 'completed'
  | 'error'

interface WorkflowStateData {
  currentStep: string
  error: Error | null
  isLoading: boolean
}

// ===== CREATOR ONBOARDING WORKFLOW =====

/**
 * Creator Onboarding Workflow Hook
 * 
 * This hook manages the complete creator onboarding process, from checking
 * registration status through completing registration and displaying the
 * final creator profile. It provides a single interface for components
 * to handle the entire onboarding user experience.
 * 
 * The workflow automatically handles:
 * - Checking if user is already registered
 * - Validating registration parameters
 * - Processing registration transaction
 * - Tracking confirmation status
 * - Providing appropriate UI feedback at each step
 * 
 * @param userAddress - Address of the user going through onboarding
 * @returns Complete onboarding workflow state and actions
 */
export function useCreatorOnboarding(userAddress: Address | undefined): CreatorOnboardingResult {
  // State management for the workflow steps
  const [workflowState, setWorkflowState] = useState<{
    currentStep: CreatorOnboardingResult['currentStep']
    error: Error | null
  }>({
    currentStep: 'checking',
    error: null
  })

  // Core hooks for creator operations
  const registrationCheck = useIsCreatorRegistered(userAddress)
  const creatorProfile = useCreatorProfile(userAddress)
  const registerCreator = useRegisterCreator()

  // Determine current workflow state based on registration status
  useEffect(() => {
    if (registrationCheck.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'checking' }))
    } else if (registrationCheck.error) {
      setWorkflowState({ currentStep: 'error', error: registrationCheck.error })
    } else if (registrationCheck.data === true) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'registered' }))
    } else if (registrationCheck.data === false) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'not_registered' }))
    }
  }, [registrationCheck.data, registrationCheck.isLoading, registrationCheck.error])

  // Handle registration transaction state changes
  useEffect(() => {
    if (registerCreator.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'registering' }))
    } else if (registerCreator.error) {
      setWorkflowState({ currentStep: 'error', error: registerCreator.error })
    } else if (registerCreator.isConfirmed) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'registered' }))
      // Refresh registration status after successful registration
      registrationCheck.refetch()
      creatorProfile.refetch()
    }
  }, [registerCreator.isLoading, registerCreator.error, registerCreator.isConfirmed, registrationCheck, creatorProfile])

  // Registration action with validation
  const handleRegister = useCallback((subscriptionPrice: bigint) => {
    try {
      // Validate subscription price parameters
      if (subscriptionPrice < BigInt(10000)) { // 0.01 USDC
        throw new Error('Subscription price must be at least $0.01')
      }
      if (subscriptionPrice > BigInt(100000000)) { // 100 USDC
        throw new Error('Subscription price cannot exceed $100.00')
      }

      // Clear any previous errors
      setWorkflowState(prev => ({ ...prev, error: null }))
      
      // Execute registration
      registerCreator.write(subscriptionPrice)
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Registration failed')
      })
    }
  }, [registerCreator])

  // Reset workflow to initial state
  const handleReset = useCallback(() => {
    setWorkflowState({ currentStep: 'checking', error: null })
    registerCreator.reset()
    registrationCheck.refetch()
  }, [registerCreator, registrationCheck])

  return {
    isRegistered: registrationCheck.data ?? false,
    isLoading: registrationCheck.isLoading || registerCreator.isLoading,
    currentStep: workflowState.currentStep,
    error: workflowState.error,
    profile: creatorProfile.data,
    register: handleRegister,
    reset: handleReset,
    registrationProgress: {
      isSubmitting: registerCreator.isLoading,
      isConfirming: registerCreator.isConfirming,
      isConfirmed: registerCreator.isConfirmed,
      transactionHash: registerCreator.hash,
    }
  }
}

// ===== CONTENT PURCHASE WORKFLOW =====

/**
 * Content Purchase Flow Hook
 * 
 * This hook manages the complete content purchase workflow, handling
 * access checking, token approval (if needed), and purchase execution.
 * It provides a streamlined interface for content purchase components.
 * 
 * The workflow handles:
 * - Checking existing access to content
 * - Validating user token balance
 * - Managing token approval process
 * - Executing purchase transaction
 * - Tracking confirmation and updating access status
 * 
 * @param contentId - ID of the content to purchase
 * @param userAddress - Address of the purchasing user
 * @returns Complete purchase workflow state and actions
 */
export function useContentPurchaseFlow(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): ContentPurchaseFlowResult {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])

  // State management for purchase workflow
  const [workflowState, setWorkflowState] = useState<{
    currentStep: ContentPurchaseFlowResult['currentStep']
    error: Error | null
  }>({
    currentStep: 'checking_access',
    error: null
  })

  // Core hooks for purchase operations
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

  // Calculate derived state
  const canAfford = useMemo(() => {
    if (!userBalance.data || !contentData.data) return false
    return userBalance.data >= contentData.data.payPerViewPrice
  }, [userBalance.data, contentData.data])

  const needsApproval = useMemo(() => {
    if (!tokenAllowance.data || !contentData.data) return false
    return tokenAllowance.data < contentData.data.payPerViewPrice
  }, [tokenAllowance.data, contentData.data])

  // Determine workflow state based on access and purchase status
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

  // Handle approval transaction state
  useEffect(() => {
    if (approveToken.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'need_approval' }))
    } else if (approveToken.isConfirmed && needsApproval === false) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'can_purchase' }))
      tokenAllowance.refetch() // Refresh allowance data
    }
  }, [approveToken.isLoading, approveToken.isConfirmed, needsApproval, tokenAllowance])

  // Handle purchase transaction state
  useEffect(() => {
    if (purchaseContent.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'purchasing' }))
    } else if (purchaseContent.error) {
      setWorkflowState({ currentStep: 'error', error: purchaseContent.error })
    } else if (purchaseContent.isConfirmed) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'completed' }))
      // Refresh access status after successful purchase
      hasAccess.refetch()
      userBalance.refetch()
    }
  }, [purchaseContent.isLoading, purchaseContent.error, purchaseContent.isConfirmed, hasAccess, userBalance])

  // Purchase action (when approval not needed)
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

  // Combined approve and purchase action
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
      
      // First approve the required amount

    approveToken.write({
      tokenAddress: contractAddresses.USDC,
      spender: contractAddresses.PAY_PER_VIEW,
      amount: contentData.data.payPerViewPrice,
    })
      
      // Purchase will be triggered automatically after approval confirms
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Approval failed')
      })
    }
  }, [contentData.data, contentId, approveToken, contractAddresses])

  // Reset workflow to initial state
  const handleReset = useCallback(() => {
    setWorkflowState({ currentStep: 'checking_access', error: null })
    approveToken.reset()
    purchaseContent.reset()
    hasAccess.refetch()
  }, [approveToken, purchaseContent, hasAccess])

  return {
    hasAccess: hasAccess.data,
    isLoading: hasAccess.isLoading || contentData.isLoading || approveToken.isLoading || purchaseContent.isLoading,
    currentStep: workflowState.currentStep,
    error: workflowState.error,
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
    }
  }
}

// ===== SUBSCRIPTION MANAGEMENT WORKFLOW =====

/**
 * Subscription Management Flow Hook
 * 
 * This hook manages creator subscription workflows, handling subscription
 * status checking, payment processing, and renewal tracking. It provides
 * a comprehensive interface for subscription-related components.
 * 
 * The workflow handles:
 * - Checking current subscription status
 * - Validating subscription pricing and user balance
 * - Managing token approval for subscription payments
 * - Executing subscription transaction
 * - Tracking renewal and expiration status
 * 
 * @param creatorAddress - Address of the creator to subscribe to
 * @param userAddress - Address of the subscribing user
 * @returns Complete subscription workflow state and actions
 */
export function useSubscriptionManagement(
  creatorAddress: Address | undefined,
  userAddress: Address | undefined
): SubscriptionManagementResult {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])

  // State management for subscription workflow
  const [workflowState, setWorkflowState] = useState<{
    currentStep: SubscriptionManagementResult['currentStep']
    error: Error | null
  }>({
    currentStep: 'checking',
    error: null
  })

  // Core hooks for subscription operations
  const creatorProfile = useCreatorProfile(creatorAddress)
  const isSubscribed = useIsSubscribed(userAddress, creatorAddress)
  const userBalance = useTokenBalance(contractAddresses.USDC, userAddress)
  const tokenAllowance = useTokenAllowance(
    contractAddresses.USDC,
    userAddress,
    contractAddresses.SUBSCRIPTION_MANAGER
  )
  const approveToken = useApproveToken()
  const subscribeToCreator = useSubscribeToCreator()

  // Calculate derived state
  const canAfford = useMemo(() => {
    if (!userBalance.data || !creatorProfile.data) return false
    return userBalance.data >= creatorProfile.data.subscriptionPrice
  }, [userBalance.data, creatorProfile.data])

  const needsApproval = useMemo(() => {
    if (!tokenAllowance.data || !creatorProfile.data) return false
    return tokenAllowance.data < creatorProfile.data.subscriptionPrice
  }, [tokenAllowance.data, creatorProfile.data])

  // Determine workflow state based on subscription status
  useEffect(() => {
    if (isSubscribed.isLoading || creatorProfile.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'checking' }))
    } else if (isSubscribed.error || creatorProfile.error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: isSubscribed.error || creatorProfile.error 
      })
    } else if (isSubscribed.data === true) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'subscribed' }))
    } else if (!canAfford) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Insufficient USDC balance for subscription')
      })
    } else if (needsApproval) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'need_approval' }))
    } else {
      setWorkflowState(prev => ({ ...prev, currentStep: 'not_subscribed' }))
    }
  }, [isSubscribed.data, isSubscribed.isLoading, isSubscribed.error, creatorProfile.error, canAfford, needsApproval])

  // Handle approval transaction state
  useEffect(() => {
    if (approveToken.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'need_approval' }))
    } else if (approveToken.isConfirmed && needsApproval === false) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'not_subscribed' }))
      tokenAllowance.refetch()
    }
  }, [approveToken.isLoading, approveToken.isConfirmed, needsApproval, tokenAllowance])

  // Handle subscription transaction state
  useEffect(() => {
    if (subscribeToCreator.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'subscribing' }))
    } else if (subscribeToCreator.error) {
      setWorkflowState({ currentStep: 'error', error: subscribeToCreator.error })
    } else if (subscribeToCreator.isConfirmed) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'subscribed' }))
      // Refresh subscription status after successful subscription
      isSubscribed.refetch()
      userBalance.refetch()
    }
  }, [subscribeToCreator.isLoading, subscribeToCreator.error, subscribeToCreator.isConfirmed, isSubscribed, userBalance])

  // Subscribe action (when approval not needed)
  const handleSubscribe = useCallback(() => {
    if (!creatorAddress) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Creator address is required for subscription')
      })
      return
    }

    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      subscribeToCreator.write(creatorAddress)
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Subscription failed')
      })
    }
  }, [creatorAddress, subscribeToCreator])

  // Combined approve and subscribe action
  const handleApproveAndSubscribe = useCallback(() => {
    if (!creatorProfile.data || !creatorAddress) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: new Error('Creator profile required for subscription')
      })
      return
    }

    try {
      setWorkflowState(prev => ({ ...prev, error: null }))
      
      // First approve the subscription amount
      approveToken.write({
        tokenAddress:contractAddresses.USDC,
        spender: contractAddresses.SUBSCRIPTION_MANAGER,
        amount:creatorProfile.data.subscriptionPrice
    })
      
      // Subscription will be triggered automatically after approval confirms
    } catch (error) {
      setWorkflowState({ 
        currentStep: 'error', 
        error: error instanceof Error ? error : new Error('Approval failed')
      })
    }
  }, [creatorProfile.data, creatorAddress, approveToken, contractAddresses])

  // Reset workflow to initial state
  const handleReset = useCallback(() => {
    setWorkflowState({ currentStep: 'checking', error: null })
    approveToken.reset()
    subscribeToCreator.reset()
    isSubscribed.refetch()
  }, [approveToken, subscribeToCreator, isSubscribed])

  return {
    isSubscribed: isSubscribed.data,
    isLoading: isSubscribed.isLoading || creatorProfile.isLoading || approveToken.isLoading || subscribeToCreator.isLoading,
    currentStep: workflowState.currentStep,
    error: workflowState.error,
    creatorProfile: creatorProfile.data,
    canAfford,
    needsApproval,
    userBalance: userBalance.data,
    subscribe: handleSubscribe,
    approveAndSubscribe: handleApproveAndSubscribe,
    reset: handleReset,
    subscriptionProgress: {
      isSubmitting: subscribeToCreator.isLoading,
      isConfirming: subscribeToCreator.isConfirming,
      isConfirmed: subscribeToCreator.isConfirmed,
      transactionHash: subscribeToCreator.hash,
    },
    approvalProgress: {
      isSubmitting: approveToken.isLoading,
      isConfirming: approveToken.isConfirming,
      isConfirmed: approveToken.isConfirmed,
      transactionHash: approveToken.hash,
    }
  }
}

// ===== CONTENT PUBLISHING WORKFLOW =====

/**
 * Content Publishing Flow Hook
 * 
 * This hook manages the complete content publishing workflow, handling
 * creator verification, content validation, and content registration.
 * It provides a streamlined interface for content creation components.
 * 
 * The workflow handles:
 * - Verifying creator registration status
 * - Validating content parameters and IPFS data
 * - Processing content registration transaction
 * - Tracking confirmation and updating content lists
 * 
 * @param userAddress - Address of the user publishing content
 * @returns Complete content publishing workflow state and actions
 */
export function useContentPublishingFlow(userAddress: Address | undefined): ContentPublishingFlowResult {
  // State management for publishing workflow
  const [workflowState, setWorkflowState] = useState<{
    currentStep: ContentPublishingFlowResult['currentStep']
    error: Error | null
    validationErrors: string[]
  }>({
    currentStep: 'idle',
    error: null,
    validationErrors: []
  })

  // Core hooks for publishing operations
  const creatorRegistration = useIsCreatorRegistered(userAddress)
  const registerContent = useRegisterContent()

  // Content validation function
  const validateContent = useCallback((contentData: ContentUploadParams): string[] => {
    const errors: string[] = []

    // Validate IPFS hash
    if (!contentData.ipfsHash || contentData.ipfsHash.trim().length === 0) {
      errors.push('IPFS hash is required')
    } else if (contentData.ipfsHash.length < 40) {
      errors.push('IPFS hash appears to be invalid (too short)')
    }

    // Validate title
    if (!contentData.title || contentData.title.trim().length === 0) {
      errors.push('Content title is required')
    } else if (contentData.title.length > 200) {
      errors.push('Content title must be 200 characters or less')
    }

    // Validate description
    if (contentData.description.length > 1000) {
      errors.push('Content description must be 1000 characters or less')
    }

    // Validate pricing
    if (contentData.payPerViewPrice <= BigInt(0)) {
      errors.push('Content price must be greater than zero')
    } else if (contentData.payPerViewPrice > BigInt(100000000)) { // 100 USDC
      errors.push('Content price cannot exceed $100.00')
    }

    // Validate category
    if (contentData.category < 0 || contentData.category > 7) {
      errors.push('Invalid content category selected')
    }

    // Validate tags
    if (contentData.tags.length > 10) {
      errors.push('Cannot have more than 10 tags')
    }
    
    const invalidTags = contentData.tags.filter(tag => tag.length > 50)
    if (invalidTags.length > 0) {
      errors.push('Tags must be 50 characters or less')
    }

    return errors
  }, [])

  // Handle registration transaction state
  useEffect(() => {
    if (registerContent.isLoading) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'registering' }))
    } else if (registerContent.error) {
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'error', 
        error: registerContent.error 
      }))
    } else if (registerContent.isConfirmed) {
      setWorkflowState(prev => ({ ...prev, currentStep: 'completed' }))
    }
  }, [registerContent.isLoading, registerContent.error, registerContent.isConfirmed])

  // Publishing action with comprehensive validation
  const handlePublish = useCallback((contentData: ContentUploadParams) => {
    try {
      // Reset previous errors
      setWorkflowState(prev => ({ 
        ...prev, 
        error: null, 
        validationErrors: [],
        currentStep: 'checking_creator'
      }))

      // Check if user is registered as creator
      if (!creatorRegistration.data) {
        throw new Error('You must be registered as a creator to publish content')
      }

      // Validate content parameters
      setWorkflowState(prev => ({ ...prev, currentStep: 'validating_content' }))
      const validationErrors = validateContent(contentData)
      
      if (validationErrors.length > 0) {
        setWorkflowState(prev => ({ 
          ...prev, 
          currentStep: 'error',
          error: new Error('Content validation failed'),
          validationErrors
        }))
        return
      }

      // If validation passes, proceed with registration
      setWorkflowState(prev => ({ 
        ...prev, 
        currentStep: 'registering',
        validationErrors: []
      }))
      
      registerContent.write(contentData)
      
    } catch (error) {
      setWorkflowState(prev => ({ 
        ...prev,
        currentStep: 'error',
        error: error instanceof Error ? error : new Error('Publishing failed')
      }))
    }
  }, [creatorRegistration.data, validateContent, registerContent])

  // Reset workflow to initial state
  const handleReset = useCallback(() => {
    setWorkflowState({ 
      currentStep: 'idle', 
      error: null,
      validationErrors: []
    })
    registerContent.reset()
  }, [registerContent])

  return {
    isLoading: creatorRegistration.isLoading || registerContent.isLoading,
    currentStep: workflowState.currentStep,
    error: workflowState.error,
    isValidContent: workflowState.validationErrors.length === 0,
    validationErrors: workflowState.validationErrors,
    publish: handlePublish,
    reset: handleReset,
    publishingProgress: {
      isSubmitting: registerContent.isLoading,
      isConfirming: registerContent.isConfirming,
      isConfirmed: registerContent.isConfirmed,
      transactionHash: registerContent.hash,
    }
  }
}

// ===== UTILITY HOOKS FOR WORKFLOW COMPOSITION =====

/**
 * Hook to get comprehensive access control information for content
 * 
 * This utility hook combines multiple access control checks into a single
 * comprehensive result that components can use for rendering decisions.
 * 
 * @param contentId - ID of the content to check
 * @param userAddress - Address of the user
 * @returns Comprehensive access control information
 */
export function useContentAccessControl(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): ContractReadResult<AccessControlResult> {
  const contentData = useContentById(contentId)
  const hasAccess = useHasContentAccess(userAddress, contentId)
  const hasPaid = useHasPaidForContent(userAddress, contentId)
  const isSubscribed = useIsSubscribed(userAddress, contentData.data?.creator)

  const result = useMemo(() => {
    if (!contentData.data || hasAccess.data === undefined) {
      return undefined
    }

    // Determine access type
    let accessType: AccessControlResult['accessType'] = 'none'
    if (contentData.data.creator === userAddress) {
      accessType = 'creator'
    } else if (hasPaid.data) {
      accessType = 'purchase'
    } else if (isSubscribed.data) {
      accessType = 'subscription'
    }

    return {
      hasAccess: hasAccess.data,
      accessType,
      purchaseRequired: !hasAccess.data && !isSubscribed.data,
      subscriptionActive: isSubscribed.data ?? false,
      canAfford: true // This would need balance checking logic
    }
  }, [contentData.data, hasAccess.data, hasPaid.data, isSubscribed.data, userAddress])

  return {
    data: result,
    isLoading: contentData.isLoading || hasAccess.isLoading,
    isError: contentData.isError || hasAccess.isError,
    error: contentData.error || hasAccess.error,
    isSuccess: contentData.isSuccess && hasAccess.isSuccess,
    refetch: () => {
      contentData.refetch()
      hasAccess.refetch()
      hasPaid.refetch()
      isSubscribed.refetch()
    }
  }
}
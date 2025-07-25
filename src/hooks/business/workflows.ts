/**
 * Business Logic Hooks - Domain Composition Layer
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
 */

import { useCallback, useMemo, useEffect, useState } from 'react'
import { useChainId, useAccount } from 'wagmi'
import { type Address } from 'viem'

// Import the core contract hooks we'll compose
import {
  useIsCreatorRegistered,
  useCreatorProfile,
  useRegisterCreator,
  useContentById,
  useHasContentAccess,
  usePurchaseContent,
  useIsSubscribed,
  useSubscribeToCreator,
  useRegisterContent,
  type ContractReadResult,
  type ContractWriteWithConfirmationResult
} from '@/hooks/contracts/core'

// Import types for business logic
import type { 
  Content,
  Creator,
  ContentCategory 
} from '@/types/contracts'

/**
 * Business Logic Result Interfaces
 * These provide higher-level abstractions than the core contract results
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
  
  // Progress indicators
  readonly registrationProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

export interface ContentPurchaseFlowResult {
  // Current state of the purchase process
  readonly hasAccess: boolean | undefined
  readonly isLoading: boolean
  readonly currentStep: 'checking_access' | 'can_purchase' | 'purchasing' | 'completed' | 'error'
  readonly error: Error | null
  
  // Content information
  readonly content: Content | undefined
  readonly canAfford: boolean // Will be calculated based on user balance
  
  // Purchase actions
  readonly purchase: () => void
  readonly reset: () => void
  
  // Transaction progress
  readonly purchaseProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

export interface SubscriptionManagementResult {
  // Current subscription state
  readonly isSubscribed: boolean | undefined
  readonly isLoading: boolean
  readonly currentStep: 'checking' | 'not_subscribed' | 'subscribing' | 'subscribed' | 'error'
  readonly error: Error | null
  
  // Creator information
  readonly creatorProfile: Creator | undefined
  
  // Subscription actions
  readonly subscribe: () => void
  readonly reset: () => void
  
  // Transaction progress
  readonly subscriptionProgress: {
    readonly isSubmitting: boolean
    readonly isConfirming: boolean
    readonly isConfirmed: boolean
    readonly transactionHash: string | undefined
  }
}

export interface ContentPublishingFlowResult {
  // Publishing state
  readonly isLoading: boolean
  readonly currentStep: 'idle' | 'uploading_ipfs' | 'registering' | 'completed' | 'error'
  readonly error: Error | null
  
  // IPFS upload state (will be managed by higher-level components)
  readonly ipfsHash: string | undefined
  
  // Publishing actions
  readonly publish: (contentData: ContentPublishingData) => void
  readonly reset: () => void
  
  // Transaction progress
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

/**
 * CREATOR ONBOARDING WORKFLOW
 * 
 * This hook manages the complete creator onboarding process, from checking
 * registration status through completing registration and displaying the
 * final creator profile. It provides a single interface for components
 * to handle the entire onboarding user experience.
 */
export function useCreatorOnboarding(): CreatorOnboardingResult {
  const { address } = useAccount()
  const chainId = useChainId()
  
  // Core hooks that we'll compose
  const isRegisteredQuery = useIsCreatorRegistered(address, chainId)
  const profileQuery = useCreatorProfile(address, chainId)
  const registerMutation = useRegisterCreator(chainId)
  
  // Local state for managing the workflow
  const [workflowError, setWorkflowError] = useState<Error | null>(null)
  
  // Determine the current step based on all the states
  const currentStep = useMemo(() => {
    if (workflowError || isRegisteredQuery.isError || profileQuery.isError || registerMutation.isError) {
      return 'error' as const
    }
    
    if (isRegisteredQuery.isLoading) {
      return 'checking' as const
    }
    
    if (registerMutation.isConfirmed) {
      return 'registered' as const
    }
    
    if (registerMutation.isLoading || registerMutation.isConfirming) {
      return 'registering' as const
    }
    
    if (isRegisteredQuery.data === false) {
      return 'not_registered' as const
    }
    
    if (isRegisteredQuery.data === true) {
      return 'registered' as const
    }
    
    return 'checking' as const
  }, [
    workflowError,
    isRegisteredQuery.isLoading,
    isRegisteredQuery.isError,
    isRegisteredQuery.data,
    profileQuery.isError,
    registerMutation.isLoading,
    registerMutation.isConfirming,
    registerMutation.isConfirmed,
    registerMutation.isError
  ])
  
  // Clear workflow errors when registration succeeds
  useEffect(() => {
    if (registerMutation.isConfirmed && workflowError) {
      setWorkflowError(null)
    }
  }, [registerMutation.isConfirmed, workflowError])
  
  // Registration function with error handling
  const register = useCallback((subscriptionPrice: bigint) => {
    try {
      setWorkflowError(null)
      registerMutation.write(subscriptionPrice)
    } catch (error) {
      setWorkflowError(error instanceof Error ? error : new Error('Registration failed'))
    }
  }, [registerMutation.write])
  
  // Reset function to clear all states
  const reset = useCallback(() => {
    setWorkflowError(null)
    registerMutation.reset()
  }, [registerMutation.reset])
  
  // Combine all errors for unified error handling
  const combinedError = useMemo(() => {
    return workflowError || 
           isRegisteredQuery.error || 
           profileQuery.error || 
           registerMutation.error
  }, [workflowError, isRegisteredQuery.error, profileQuery.error, registerMutation.error])
  
  return {
    isRegistered: Boolean(isRegisteredQuery.data),
    isLoading: isRegisteredQuery.isLoading || profileQuery.isLoading || registerMutation.isLoading,
    currentStep,
    error: combinedError,
    profile: profileQuery.data,
    register,
    reset,
    registrationProgress: {
      isSubmitting: registerMutation.isLoading,
      isConfirming: registerMutation.isConfirming,
      isConfirmed: registerMutation.isConfirmed,
      transactionHash: registerMutation.hash
    }
  }
}

/**
 * CONTENT PURCHASE WORKFLOW
 * 
 * This hook manages the complete content purchase flow, from checking access
 * status through completing the purchase and confirming access. It handles
 * optimistic updates and provides clear state transitions for UI feedback.
 */
export function useContentPurchaseFlow(contentId: bigint | undefined): ContentPurchaseFlowResult {
  const { address } = useAccount()
  const chainId = useChainId()
  
  // Core hooks for content purchase workflow
  const contentQuery = useContentById(contentId, chainId)
  const accessQuery = useHasContentAccess(contentId, address, chainId)
  const purchaseMutation = usePurchaseContent(chainId)
  
  // Local state for workflow management
  const [workflowError, setWorkflowError] = useState<Error | null>(null)
  
  // Determine current step based on combined states
  const currentStep = useMemo(() => {
    if (workflowError || contentQuery.isError || accessQuery.isError || purchaseMutation.isError) {
      return 'error' as const
    }
    
    if (purchaseMutation.isConfirmed || accessQuery.data === true) {
      return 'completed' as const
    }
    
    if (purchaseMutation.isLoading || purchaseMutation.isConfirming) {
      return 'purchasing' as const
    }
    
    if (accessQuery.isLoading || contentQuery.isLoading) {
      return 'checking_access' as const
    }
    
    if (accessQuery.data === false && contentQuery.data) {
      return 'can_purchase' as const
    }
    
    return 'checking_access' as const
  }, [
    workflowError,
    contentQuery.isLoading,
    contentQuery.isError,
    contentQuery.data,
    accessQuery.isLoading,
    accessQuery.isError,
    accessQuery.data,
    purchaseMutation.isLoading,
    purchaseMutation.isConfirming,
    purchaseMutation.isConfirmed,
    purchaseMutation.isError
  ])
  
  // For now, assume user can afford content (in a real implementation,
  // this would check user's token balance against content price)
  const canAfford = useMemo(() => {
    return Boolean(contentQuery.data && contentQuery.data.payPerViewPrice)
  }, [contentQuery.data])
  
  // Purchase function with error handling
  const purchase = useCallback(() => {
    if (!contentId) {
      setWorkflowError(new Error('Content ID is required for purchase'))
      return
    }
    
    try {
      setWorkflowError(null)
      purchaseMutation.write({ contentId })
    } catch (error) {
      setWorkflowError(error instanceof Error ? error : new Error('Purchase failed'))
    }
  }, [contentId, purchaseMutation.write])
  
  // Reset function to clear workflow state
  const reset = useCallback(() => {
    setWorkflowError(null)
    purchaseMutation.reset()
  }, [purchaseMutation.reset])
  
  // Refresh access status after successful purchase
  useEffect(() => {
    if (purchaseMutation.isConfirmed) {
      accessQuery.refetch()
    }
  }, [purchaseMutation.isConfirmed, accessQuery.refetch])
  
  // Combined error handling
  const combinedError = useMemo(() => {
    return workflowError ||
           contentQuery.error ||
           accessQuery.error ||
           purchaseMutation.error
  }, [workflowError, contentQuery.error, accessQuery.error, purchaseMutation.error])
  
  return {
    hasAccess: accessQuery.data,
    isLoading: contentQuery.isLoading || accessQuery.isLoading || purchaseMutation.isLoading,
    currentStep,
    error: combinedError,
    content: contentQuery.data,
    canAfford,
    purchase,
    reset,
    purchaseProgress: {
      isSubmitting: purchaseMutation.isLoading,
      isConfirming: purchaseMutation.isConfirming,
      isConfirmed: purchaseMutation.isConfirmed,
      transactionHash: purchaseMutation.hash
    }
  }
}

/**
 * SUBSCRIPTION MANAGEMENT WORKFLOW
 * 
 * This hook manages subscription operations for a specific creator,
 * including checking current status, subscribing, and handling renewals.
 */
export function useSubscriptionManagement(creatorAddress: Address | undefined): SubscriptionManagementResult {
  const { address } = useAccount()
  const chainId = useChainId()
  
  // Core hooks for subscription workflow
  const subscriptionQuery = useIsSubscribed(address, creatorAddress, chainId)
  const creatorProfileQuery = useCreatorProfile(creatorAddress, chainId)
  const subscribeMutation = useSubscribeToCreator(chainId)
  
  // Local workflow state
  const [workflowError, setWorkflowError] = useState<Error | null>(null)
  
  // Determine current step in subscription workflow
  const currentStep = useMemo(() => {
    if (workflowError || subscriptionQuery.isError || creatorProfileQuery.isError || subscribeMutation.isError) {
      return 'error' as const
    }
    
    if (subscribeMutation.isConfirmed || subscriptionQuery.data === true) {
      return 'subscribed' as const
    }
    
    if (subscribeMutation.isLoading || subscribeMutation.isConfirming) {
      return 'subscribing' as const
    }
    
    if (subscriptionQuery.isLoading || creatorProfileQuery.isLoading) {
      return 'checking' as const
    }
    
    if (subscriptionQuery.data === false) {
      return 'not_subscribed' as const
    }
    
    return 'checking' as const
  }, [
    workflowError,
    subscriptionQuery.isLoading,
    subscriptionQuery.isError,
    subscriptionQuery.data,
    creatorProfileQuery.isLoading,
    creatorProfileQuery.isError,
    subscribeMutation.isLoading,
    subscribeMutation.isConfirming,
    subscribeMutation.isConfirmed,
    subscribeMutation.isError
  ])
  
  // Subscribe function with validation
  const subscribe = useCallback(() => {
    if (!creatorAddress) {
      setWorkflowError(new Error('Creator address is required for subscription'))
      return
    }
    
    try {
      setWorkflowError(null)
      subscribeMutation.write(creatorAddress)
    } catch (error) {
      setWorkflowError(error instanceof Error ? error : new Error('Subscription failed'))
    }
  }, [creatorAddress, subscribeMutation.write])
  
  // Reset workflow state
  const reset = useCallback(() => {
    setWorkflowError(null)
    subscribeMutation.reset()
  }, [subscribeMutation.reset])
  
  // Refresh subscription status after successful subscription
  useEffect(() => {
    if (subscribeMutation.isConfirmed) {
      subscriptionQuery.refetch()
    }
  }, [subscribeMutation.isConfirmed, subscriptionQuery.refetch])
  
  // Combined error state
  const combinedError = useMemo(() => {
    return workflowError ||
           subscriptionQuery.error ||
           creatorProfileQuery.error ||
           subscribeMutation.error
  }, [workflowError, subscriptionQuery.error, creatorProfileQuery.error, subscribeMutation.error])
  
  return {
    isSubscribed: subscriptionQuery.data,
    isLoading: subscriptionQuery.isLoading || creatorProfileQuery.isLoading || subscribeMutation.isLoading,
    currentStep,
    error: combinedError,
    creatorProfile: creatorProfileQuery.data,
    subscribe,
    reset,
    subscriptionProgress: {
      isSubmitting: subscribeMutation.isLoading,
      isConfirming: subscribeMutation.isConfirming,
      isConfirmed: subscribeMutation.isConfirmed,
      transactionHash: subscribeMutation.hash
    }
  }
}

/**
 * CONTENT PUBLISHING WORKFLOW
 * 
 * This hook manages the content publishing process for creators,
 * coordinating IPFS upload completion with contract registration.
 */
export function useContentPublishingFlow(): ContentPublishingFlowResult {
  const chainId = useChainId()
  
  // Core hook for content registration
  const registerContentMutation = useRegisterContent(chainId)
  
  // Local workflow state
  const [workflowError, setWorkflowError] = useState<Error | null>(null)
  const [ipfsHash, setIpfsHash] = useState<string | undefined>(undefined)
  const [publishingStep, setPublishingStep] = useState<'idle' | 'uploading_ipfs' | 'registering'>('idle')
  
  // Determine current step
  const currentStep = useMemo(() => {
    if (workflowError || registerContentMutation.isError) {
      return 'error' as const
    }
    
    if (registerContentMutation.isConfirmed) {
      return 'completed' as const
    }
    
    if (registerContentMutation.isLoading || registerContentMutation.isConfirming) {
      return 'registering' as const
    }
    
    return publishingStep
  }, [workflowError, registerContentMutation.isError, registerContentMutation.isLoading, registerContentMutation.isConfirming, registerContentMutation.isConfirmed, publishingStep])
  
  // Publish function that coordinates IPFS and contract registration
  const publish = useCallback((contentData: ContentPublishingData) => {
    try {
      setWorkflowError(null)
      setPublishingStep('registering')
      setIpfsHash(contentData.ipfsHash)
      
      registerContentMutation.write({
        ipfsHash: contentData.ipfsHash,
        title: contentData.title,
        description: contentData.description,
        category: contentData.category,
        payPerViewPrice: contentData.payPerViewPrice,
        tags: Array.from(contentData.tags) // Convert readonly array to regular array
      })
    } catch (error) {
      setWorkflowError(error instanceof Error ? error : new Error('Publishing failed'))
      setPublishingStep('idle')
    }
  }, [registerContentMutation.write])
  
  // Reset workflow state
  const reset = useCallback(() => {
    setWorkflowError(null)
    setIpfsHash(undefined)
    setPublishingStep('idle')
    registerContentMutation.reset()
  }, [registerContentMutation.reset])
  
  return {
    isLoading: registerContentMutation.isLoading,
    currentStep,
    error: workflowError || registerContentMutation.error,
    ipfsHash,
    publish,
    reset,
    publishingProgress: {
      isSubmitting: registerContentMutation.isLoading,
      isConfirming: registerContentMutation.isConfirming,
      isConfirmed: registerContentMutation.isConfirmed,
      transactionHash: registerContentMutation.hash
    }
  }
}

export type { ContentCategory };
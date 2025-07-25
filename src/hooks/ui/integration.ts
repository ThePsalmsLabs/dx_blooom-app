/**
 * UI Component Integration Hooks - React Interface Layer
 * 
 * This layer provides the bridge between our sophisticated business logic hooks
 * and the React components that users interact with. Think of these hooks as
 * translators that convert complex Web3 workflows into simple, declarative
 * interfaces that components can use naturally.
 * 
 * Each hook in this layer takes complex state management and business logic
 * and transforms it into exactly what UI components need: clear loading states,
 * simple action functions, and predictable data structures.
 * 
 * Architecture Principles:
 * 1. Transform business logic into UI-focused interfaces
 * 2. Provide consistent patterns for loading, error, and success states
 * 3. Abstract away complex state transitions for component simplicity
 * 4. Enable declarative component design patterns
 * 5. Maintain performance through intelligent memoization
 */

import { useMemo, useCallback } from 'react'
import { useAccount, useChainId, useDisconnect } from 'wagmi'
import { type Address } from 'viem'

// Import our business logic hooks to compose them into UI-focused interfaces
import {
  useCreatorOnboarding,
  useContentPurchaseFlow,
  useSubscriptionManagement,
  useContentPublishingFlow,
  type ContentPublishingData
} from '@/hooks/business/workflows'

// Import Web3 provider functionality
import { 
  useEnhancedWeb3,
  useSmartAccount,
  useGasSponsorship 
} from '@/components/providers/Web3Provider'

// Import core contract hooks for direct UI needs
import {
  useIsCreatorRegistered,
  useContentById,
  useHasContentAccess
} from '@/hooks/contracts/core'

/**
 * UI-Focused Interface Definitions
 * 
 * These interfaces are designed specifically for what React components need,
 * rather than reflecting the full complexity of the underlying business logic.
 */

/**
 * Interface for wallet connection UI components
 */
export interface WalletConnectionUI {
  // Connection state that components can render directly
  readonly isConnected: boolean
  readonly isConnecting: boolean
  readonly address: Address | null
  readonly chainName: string
  readonly canUpgradeToSmartAccount: boolean
  readonly isSmartAccount: boolean
  
  // Simple actions for components to trigger
  readonly connect: () => void
  readonly disconnect: () => void
  readonly upgradeToSmartAccount: () => void
  
  // Error state for UI feedback
  readonly error: string | null
  readonly clearError: () => void
}

/**
 * Interface for transaction status UI components
 */
export interface TransactionStatusUI {
  // Clear transaction state for UI rendering
  readonly status: 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'failed'
  readonly transactionHash: string | null
  readonly errorMessage: string | null
  readonly canRetry: boolean
  
  // Progress indicators for user feedback
  readonly progress: {
    readonly submitted: boolean
    readonly confirming: boolean
    readonly confirmed: boolean
  }
  
  // Actions available to users
  readonly retry: () => void
  readonly reset: () => void
}

/**
 * Interface for content access UI components
 */
export interface ContentAccessUI {
  // Access state that determines what UI to show
  readonly hasAccess: boolean
  readonly isLoading: boolean
  readonly canPurchase: boolean
  readonly isSubscribed: boolean
  
  // Content information for display
  readonly title: string
  readonly description: string
  readonly priceFormatted: string
  readonly creatorAddress: Address
  
  // User actions
  readonly purchase: () => void
  readonly subscribe: () => void
  
  // Transaction state for feedback
  readonly purchaseStatus: TransactionStatusUI
  readonly subscriptionStatus: TransactionStatusUI
}

/**
 * Interface for creator dashboard UI components
 */
export interface CreatorDashboardUI {
  // Creator state and verification
  readonly isRegistered: boolean
  readonly isLoading: boolean
  readonly canRegister: boolean
  
  // Creator profile data for display
  readonly profile: {
    readonly address: Address
    readonly totalEarnings: string // Formatted for display
    readonly contentCount: number
    readonly subscriberCount: number
    readonly subscriptionPrice: string // Formatted for display
  } | null
  
  // Registration workflow
  readonly registrationStatus: TransactionStatusUI
  readonly register: (subscriptionPrice: string) => void
  
  // Content publishing
  readonly publishingStatus: TransactionStatusUI & {
    readonly currentStep: 'idle' | 'uploading' | 'registering' | 'completed'
  }
  readonly publishContent: (contentData: ContentPublishingData) => void
}

/**
 * Interface for gas sponsorship UI indicators
 */
export interface GasSponsorshipUI {
  // Sponsorship state for user awareness
  readonly isEnabled: boolean
  readonly willSponsorTransaction: boolean
  readonly estimatedGasCost: string // Formatted for display
  readonly estimatedSavings: string // Formatted for display
  
  // Information for user education
  readonly sponsorshipReason: string
  readonly maxSponsoredAmount: string
}

/**
 * WALLET CONNECTION AND ACCOUNT MANAGEMENT
 * 
 * This hook provides everything wallet connection components need,
 * transforming complex Web3 provider state into simple UI interfaces.
 */
export function useWalletConnectionUI(): WalletConnectionUI {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const web3Context = useEnhancedWeb3()
  const smartAccount = useSmartAccount()
  
  // Format chain name for display
  const chainName = useMemo(() => {
    switch (chainId) {
      case 8453: return 'Base Mainnet'
      case 84532: return 'Base Sepolia'
      default: return 'Unknown Network'
    }
  }, [chainId])
  
  // Simple connection function that components can call
  const connect = useCallback(() => {
    // In a real implementation, this would trigger the wallet connection modal
    // For now, we'll log the intent
    console.log('Triggering wallet connection modal')
  }, [])
  
  // Smart Account upgrade function
  const upgradeToSmartAccount = useCallback(() => {
    if (smartAccount.canUpgrade) {
      smartAccount.upgradeToSmartAccount().catch(console.error)
    }
  }, [smartAccount])
  
  return {
    isConnected,
    isConnecting,
    address: address as Address,
    chainName,
    canUpgradeToSmartAccount: smartAccount.canUpgrade,
    isSmartAccount: smartAccount.isSmartAccount,
    connect,
    disconnect: () => disconnect(),
    upgradeToSmartAccount,
    error: web3Context.error,
    clearError: web3Context.clearError
  }
}

/**
 * TRANSACTION STATUS MANAGEMENT
 * 
 * This hook provides a consistent interface for displaying transaction
 * status across all components that handle blockchain transactions.
 */
export function useTransactionStatusUI(
  transactionHash: string | undefined,
  isLoading: boolean,
  isConfirming: boolean,
  isConfirmed: boolean,
  error: Error | null,
  reset: () => void,
  retry?: () => void
): TransactionStatusUI {
  // Determine overall transaction status
  const status = useMemo(() => {
    if (error) return 'failed' as const
    if (isConfirmed) return 'confirmed' as const
    if (isConfirming) return 'confirming' as const
    if (isLoading) return 'submitting' as const
    return 'idle' as const
  }, [error, isConfirmed, isConfirming, isLoading])
  
  // Format error message for user display
  const errorMessage = useMemo(() => {
    if (!error) return null
    
    // Extract user-friendly error messages from common Web3 errors
    const message = error.message.toLowerCase()
    if (message.includes('user rejected')) {
      return 'Transaction was cancelled by user'
    }
    if (message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction'
    }
    if (message.includes('gas')) {
      return 'Transaction failed due to gas estimation error'
    }
    if (message.includes('network')) {
      return 'Network error - please try again'
    }
    
    return 'Transaction failed - please try again'
  }, [error])
  
  // Progress indicators for UI components
  const progress = useMemo(() => ({
    submitted: Boolean(transactionHash),
    confirming: isConfirming,
    confirmed: isConfirmed
  }), [transactionHash, isConfirming, isConfirmed])
  
  return {
    status,
    transactionHash: transactionHash || null,
    errorMessage,
    canRetry: Boolean(retry && error),
    progress,
    retry: retry || (() => {}),
    reset
  }
}

/**
 * CONTENT ACCESS AND PURCHASE MANAGEMENT
 * 
 * This hook provides everything content display components need to handle
 * access control, purchasing, and subscription management.
 */
export function useContentAccessUI(contentId: bigint): ContentAccessUI {
  const { address } = useAccount()
  const chainId = useChainId()
  
  // Business logic hooks
  const contentQuery = useContentById(contentId, chainId)
  const accessQuery = useHasContentAccess(contentId, address, chainId)
  const purchaseFlow = useContentPurchaseFlow(contentId)
  const subscriptionFlow = useSubscriptionManagement(contentQuery.data?.creator)
  
  // Format content information for display
  const contentInfo = useMemo(() => {
    if (!contentQuery.data) {
      return {
        title: 'Loading...',
        description: 'Loading content information...',
        priceFormatted: '$0.00',
        creatorAddress: '0x0000000000000000000000000000000000000000' as Address
      }
    }
    
    const priceInUSD = Number(contentQuery.data.payPerViewPrice) / 1_000_000 // Convert from USDC (6 decimals)
    
    return {
      title: contentQuery.data.title,
      description: contentQuery.data.description,
      priceFormatted: `$${priceInUSD.toFixed(2)}`,
      creatorAddress: contentQuery.data.creator
    }
  }, [contentQuery.data])
  
  // Transaction status for purchase
  const purchaseStatus = useTransactionStatusUI(
    purchaseFlow.purchaseProgress.transactionHash,
    purchaseFlow.purchaseProgress.isSubmitting,
    purchaseFlow.purchaseProgress.isConfirming,
    purchaseFlow.purchaseProgress.isConfirmed,
    purchaseFlow.error,
    purchaseFlow.reset,
    purchaseFlow.purchase
  )
  
  // Transaction status for subscription
  const subscriptionStatus = useTransactionStatusUI(
    subscriptionFlow.subscriptionProgress.transactionHash,
    subscriptionFlow.subscriptionProgress.isSubmitting,
    subscriptionFlow.subscriptionProgress.isConfirming,
    subscriptionFlow.subscriptionProgress.isConfirmed,
    subscriptionFlow.error,
    subscriptionFlow.reset,
    subscriptionFlow.subscribe
  )
  
  return {
    hasAccess: Boolean(accessQuery.data),
    isLoading: contentQuery.isLoading || accessQuery.isLoading,
    canPurchase: purchaseFlow.currentStep === 'can_purchase',
    isSubscribed: Boolean(subscriptionFlow.isSubscribed),
    ...contentInfo,
    purchase: purchaseFlow.purchase,
    subscribe: subscriptionFlow.subscribe,
    purchaseStatus,
    subscriptionStatus
  }
}

/**
 * CREATOR DASHBOARD MANAGEMENT
 * 
 * This hook provides creator-focused components with everything they need
 * for registration, profile management, and content publishing.
 */
export function useCreatorDashboardUI(): CreatorDashboardUI {
  const { address } = useAccount()
  // const chainId = useChainId() // Remove unused variable
  
  // Business logic hooks
  const onboardingFlow = useCreatorOnboarding()
  const publishingFlow = useContentPublishingFlow()
  
  // Format creator profile for display
  const profileFormatted = useMemo(() => {
    if (!onboardingFlow.profile || !address) return null
    const earningsInUSD = Number(onboardingFlow.profile.totalEarnings) / 1_000_000
    const subscriptionPriceInUSD = Number(onboardingFlow.profile.subscriptionPrice) / 1_000_000
    // Use contentCount if available, otherwise fallback to 0
    const contentCount = (onboardingFlow.profile as { contentCount?: bigint }).contentCount ? Number((onboardingFlow.profile as { contentCount?: bigint }).contentCount) : 0
    return {
      address,
      totalEarnings: `$${earningsInUSD.toFixed(2)}`,
      contentCount,
      subscriberCount: Number(onboardingFlow.profile.totalSubscribers || 0),
      subscriptionPrice: `$${subscriptionPriceInUSD.toFixed(2)}/month`
    }
  }, [onboardingFlow.profile, address])
  
  // Registration function that handles USD to USDC conversion
  const register = useCallback((subscriptionPriceUSD: string) => {
    const priceInUSDC = BigInt(Math.floor(parseFloat(subscriptionPriceUSD) * 1_000_000))
    onboardingFlow.register(priceInUSDC)
  }, [onboardingFlow])
  
  // Registration status for UI feedback
  const registrationStatus = useTransactionStatusUI(
    onboardingFlow.registrationProgress.transactionHash,
    onboardingFlow.registrationProgress.isSubmitting,
    onboardingFlow.registrationProgress.isConfirming,
    onboardingFlow.registrationProgress.isConfirmed,
    onboardingFlow.error,
    onboardingFlow.reset,
    () => {} // Registration doesn't have a simple retry mechanism
  )
  
  // Publishing status with workflow step information
  const publishingStatusBase = useTransactionStatusUI(
    publishingFlow.publishingProgress.transactionHash,
    publishingFlow.publishingProgress.isSubmitting,
    publishingFlow.publishingProgress.isConfirming,
    publishingFlow.publishingProgress.isConfirmed,
    publishingFlow.error,
    publishingFlow.reset
  )
  // Map publishingStatus.currentStep to allowed values
  const publishingStatus = useMemo(() => {
    let mappedStep: 'idle' | 'uploading' | 'registering' | 'completed' = 'idle'
    switch (publishingFlow.currentStep) {
      case 'uploading_ipfs':
        mappedStep = 'uploading'
        break
      case 'registering':
        mappedStep = 'registering'
        break
      case 'completed':
        mappedStep = 'completed'
        break
      default:
        mappedStep = 'idle'
    }
    return {
      ...publishingStatusBase,
      currentStep: mappedStep
    }
  }, [publishingStatusBase, publishingFlow.currentStep])
  
  return {
    isRegistered: onboardingFlow.isRegistered,
    isLoading: onboardingFlow.isLoading,
    canRegister: onboardingFlow.currentStep === 'not_registered',
    profile: profileFormatted,
    registrationStatus,
    register,
    publishingStatus,
    publishContent: publishingFlow.publish
  }
}

/**
 * GAS SPONSORSHIP INFORMATION
 * 
 * This hook provides components with gas sponsorship information
 * for user education and transaction cost transparency.
 */
export function useGasSponsorshipUI(transactionValueUSD?: number): GasSponsorshipUI {
  const gasSponsorship = useGasSponsorship()
  const { accountType } = useEnhancedWeb3()
  
  // Determine if this specific transaction will be sponsored
  const willSponsorTransaction = useMemo(() => {
    if (!gasSponsorship.gasSponsorship.isEnabled) return false
    if (accountType !== 'smart_account') return false
    if (!transactionValueUSD) return true // Assume sponsorship for unknown amounts
    
    return transactionValueUSD <= gasSponsorship.gasSponsorship.maxSponsoredAmountUSD
  }, [
    gasSponsorship.gasSponsorship.isEnabled,
    gasSponsorship.gasSponsorship.maxSponsoredAmountUSD,
    accountType,
    transactionValueUSD
  ])
  
  // Format monetary amounts for display
  const formatUSD = useCallback((amount: number) => `$${amount.toFixed(2)}`, [])
  
  // Explain why sponsorship is or isn't available
  const sponsorshipReason = useMemo(() => {
    if (!gasSponsorship.gasSponsorship.isEnabled) {
      return 'Gas sponsorship not available - missing configuration'
    }
    if (accountType !== 'smart_account') {
      return 'Gas sponsorship available after upgrading to Smart Account'
    }
    if (willSponsorTransaction) {
      return 'Gas fees sponsored for transactions under $10'
    }
    return 'Transaction value exceeds gas sponsorship limit'
  }, [gasSponsorship.gasSponsorship.isEnabled, accountType, willSponsorTransaction])
  
  return {
    isEnabled: gasSponsorship.gasSponsorship.isEnabled,
    willSponsorTransaction,
    estimatedGasCost: '$0.01', // Base network typical gas cost
    estimatedSavings: willSponsorTransaction ? '$0.01' : '$0.00',
    sponsorshipReason,
    maxSponsoredAmount: formatUSD(gasSponsorship.gasSponsorship.maxSponsoredAmountUSD)
  }
}

/**
 * UTILITY: COMBINED CONTENT AND CREATOR STATUS
 * 
 * This hook provides components with comprehensive status information
 * about both content access and creator relationships.
 */
export function useUserContentStatus(contentId: bigint) {
  const { address } = useAccount()
  const chainId = useChainId()
  
  const contentQuery = useContentById(contentId, chainId)
  const accessQuery = useHasContentAccess(contentId, address, chainId)
  const creatorRegistrationQuery = useIsCreatorRegistered(address, chainId)
  const subscriptionQuery = useSubscriptionManagement(contentQuery.data?.creator)
  
  return useMemo(() => ({
    // Content status
    contentExists: Boolean(contentQuery.data),
    hasDirectAccess: Boolean(accessQuery.data),
    hasSubscriptionAccess: Boolean(subscriptionQuery.isSubscribed),
    hasAnyAccess: Boolean(accessQuery.data) || Boolean(subscriptionQuery.isSubscribed),
    
    // User status
    isConnected: Boolean(address),
    isCreator: Boolean(creatorRegistrationQuery.data),
    isContentCreator: Boolean(address && contentQuery.data?.creator === address),
    
    // Loading states
    isLoading: contentQuery.isLoading || accessQuery.isLoading || creatorRegistrationQuery.isLoading || subscriptionQuery.isLoading,
    
    // Actions available
    canPurchase: Boolean(address && contentQuery.data && !accessQuery.data && !subscriptionQuery.isSubscribed),
    canSubscribe: Boolean(address && contentQuery.data && !subscriptionQuery.isSubscribed),
    
    // Content information
    content: contentQuery.data,
    creator: contentQuery.data?.creator
  }), [
    contentQuery.data,
    contentQuery.isLoading,
    accessQuery.data,
    accessQuery.isLoading,
    creatorRegistrationQuery.data,
    creatorRegistrationQuery.isLoading,
    subscriptionQuery.isSubscribed,
    subscriptionQuery.isLoading,
    address
  ])
}
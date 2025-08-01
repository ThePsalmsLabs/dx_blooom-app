/**
 * UI Component Integration Hooks - React Interface Layer
 * File: src/hooks/ui/integration.ts
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
 * 
 * Component-Centric Design Philosophy:
 * Each hook is designed for specific component use cases rather than generic
 * abstractions. This enables us to provide exactly the right data in exactly
 * the right format for each type of UI component.
 */

import { useMemo, useCallback, useState } from 'react'
import { useAccount, useChainId, useDisconnect } from 'wagmi'
import { useEnhancedWeb3 } from '@/components/providers/Web3Provider'
import { formatAddress } from '@/lib/utils'
import { type Address } from 'viem'
// Import our business logic hooks to compose them into UI-focused interfaces
import {
  useContentPurchaseFlow,
  useContentPublishingFlow,
  useCreatorOnboarding,
  type ContentPublishingData
} from '@/hooks/business/workflows'

// Import core hooks for direct UI needs
import {
  useIsCreatorRegistered,
  useContentById,
  useCreatorProfile,
  useCreatorPendingEarnings,
  useTokenBalance
} from '@/hooks/contracts/core'

// Import contract configuration
import { getContractAddresses } from '@/lib/contracts/config'

// Import utility functions for data formatting
import {
  formatCurrency,
  formatRelativeTime,
  formatAbsoluteTime,
  formatContentCategory,
  formatWeb3Error,
  cn
} from '@/lib/utils'

// Import types
import type { 
  Content,
  Creator,
  ContentCategory 
} from '@/types/contracts'

import { AccountType } from '@/components/providers/Web3Provider'

/**
 * UI-Focused Interface Definitions
 * 
 * These interfaces are designed specifically for what React components need,
 * rather than reflecting the full complexity of the underlying business logic.
 * They focus on formatted display values and simple action functions.
 */

/**
 * Interface for wallet connection UI components
 * 
 * This interface provides everything a wallet connection component needs:
 * formatted display text, simple connection actions, and clear status indicators.
 */
export interface WalletConnectionUI {
  // Connection state that components can render directly
  readonly isConnected: boolean
  readonly isConnecting: boolean
  readonly formattedAddress: string | null  // Pre-formatted for display
  readonly chainName: string
  readonly isCorrectNetwork: boolean
  
  // Simple actions for components to trigger
  readonly connect: () => void
  readonly disconnect: () => void
  readonly switchNetwork: () => void
  
  // User feedback state
  readonly error: string | null
  readonly clearError: () => void
  readonly showNetworkWarning: boolean
}

/**
 * Interface for transaction status UI components
 * 
 * This provides comprehensive transaction feedback optimized for UI display,
 * including formatted messages and progress indicators.
 */
export interface TransactionStatusUI {
  // Clear transaction state for UI rendering
  readonly status: 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'failed'
  readonly transactionHash: string | null
  readonly formattedStatus: string  // User-friendly status message
  readonly canRetry: boolean
  
  // Progress indicators for user feedback
  readonly progress: {
    readonly submitted: boolean
    readonly confirming: boolean
    readonly confirmed: boolean
    readonly progressText: string  // Formatted progress message
  }
  
  // Actions for user interaction
  readonly retry: () => void
  readonly reset: () => void
  readonly viewTransaction: () => void  // Opens block explorer
}

/**
 * Interface for creator onboarding UI components
 * 
 * This transforms the creator onboarding workflow into a component-friendly
 * interface with formatted display text and simple action functions.
 */
export interface CreatorOnboardingUI {
  // Registration state for UI rendering
  readonly isRegistered: boolean
  readonly isLoading: boolean
  readonly canRegister: boolean
  readonly currentStepText: string  // Human-readable step description
  
  // Registration form state
  readonly registrationForm: {
    readonly isSubmitting: boolean
    readonly validationError: string | null
    readonly submitAction: (subscriptionPrice: string) => void  // Takes formatted price string
    readonly reset: () => void
  }
  
  // Success state information
  readonly profile: {
    readonly address: string  // Formatted address
    readonly subscriptionPriceText: string  // Formatted price display
    readonly registrationDate: string  // Formatted date
  } | null
  
  // Transaction feedback
  readonly transactionStatus: TransactionStatusUI
}

/**
 * Interface for content purchase UI components
 * 
 * This provides everything a content purchase component needs, including
 * formatted pricing, clear action buttons, and comprehensive status feedback.
 */
export interface ContentPurchaseUI {
  // Purchase state for UI rendering
  readonly hasAccess: boolean
  readonly canPurchase: boolean
  readonly isLoading: boolean
  readonly currentStepText: string  // Human-readable step description
  
  // Content information formatted for display
  readonly content: {
    readonly title: string
    readonly description: string
    readonly formattedPrice: string  // e.g., "$1.50 USDC"
    readonly category: string  // Human-readable category
    readonly creatorName: string  // Formatted creator address
    readonly publishDate: string  // Formatted relative time
  } | null
  
  // Purchase actions with built-in feedback
  readonly purchaseActions: {
    readonly canAfford: boolean
    readonly needsApproval: boolean
    readonly balanceText: string  // Formatted user balance
    readonly purchaseAction: () => void
    readonly approveAndPurchaseAction: () => void
    readonly isProcessing: boolean
  }
  
  // Transaction feedback
  readonly transactionStatus: TransactionStatusUI
  readonly approvalStatus: TransactionStatusUI
  
  // User feedback
  readonly errorMessage: string | null
  readonly successMessage: string | null
}

/**
 * Interface for creator subscription UI components
 * 
 * This handles subscription workflows with component-optimized interfaces
 * including subscription status, pricing, and renewal information.
 */
export interface CreatorSubscriptionUI {
  // Subscription state for UI rendering
  readonly isSubscribed: boolean
  readonly isLoading: boolean
  readonly currentStepText: string
  
  // Creator information formatted for display
  readonly creator: {
    readonly formattedAddress: string
    readonly subscriptionPrice: string  // Formatted price
    readonly contentCount: string  // Formatted count
    readonly isVerified: boolean
  } | null
  
  // Subscription status information
  readonly subscriptionStatus: {
    readonly isActive: boolean
    readonly expiryDate: string | null  // Formatted date
    readonly renewalText: string  // e.g., "Renews in 15 days"
    readonly canRenew: boolean
  }
  
  // Subscription actions
  readonly subscriptionActions: {
    readonly canAfford: boolean
    readonly needsApproval: boolean
    readonly balanceText: string
    readonly subscribeAction: () => void
    readonly approveAndSubscribeAction: () => void
    readonly isProcessing: boolean
  }
  
  // Transaction feedback
  readonly transactionStatus: TransactionStatusUI
  readonly approvalStatus: TransactionStatusUI
}

/**
 * Interface for content publishing UI components
 * 
 * This provides comprehensive content publishing workflow management
 * with validation feedback and publishing status tracking.
 */
export interface ContentPublishingUI {
  // Publishing state for UI rendering
  readonly canPublish: boolean
  readonly isLoading: boolean
  readonly currentStepText: string
  
  // Content validation state
  readonly validation: {
    readonly isValid: boolean
    readonly errors: readonly string[]
    readonly validateContent: (data: ContentPublishingData) => boolean
  }
  
  // Publishing actions
  readonly publishingActions: {
    readonly publishAction: (data: ContentPublishingData) => void
    readonly isProcessing: boolean
    readonly reset: () => void
  }
  
  // Creator requirements
  readonly creatorRequirements: {
    readonly isRegisteredCreator: boolean
    readonly needsRegistration: boolean
    readonly registrationText: string
  }
  
  // Transaction feedback
  readonly transactionStatus: TransactionStatusUI
  
  // User feedback
  readonly errorMessage: string | null
  readonly successMessage: string | null
}

/**
 * Interface for creator dashboard UI components
 * 
 * This provides comprehensive dashboard data formatted for immediate
 * display in creator analytics and management interfaces.
 */
export interface CreatorDashboardUI {
  // Creator verification status
  readonly isRegistered: boolean
  readonly isLoading: boolean
  
  // Dashboard metrics formatted for display
  readonly metrics: {
    readonly totalEarnings: string  // Formatted currency
    readonly pendingEarnings: string  // Formatted currency
    readonly contentCount: string  // Formatted count
    readonly subscriberCount: string  // Formatted count
    readonly monthlyRevenue: string  // Formatted currency
  } | null
  
  // Profile information
  readonly profile: {
    readonly formattedAddress: string
    readonly subscriptionPrice: string
    readonly verificationStatus: string
    readonly memberSince: string  // Formatted date
  } | null
  
  // Earnings management
  readonly earnings: {
    readonly canWithdraw: boolean
    readonly withdrawableAmount: string
    readonly withdrawAction: (amount: string) => void
    readonly isWithdrawing: boolean
  }
  
  // Quick actions
  readonly quickActions: {
    readonly publishContentAction: () => void
    readonly updatePricingAction: () => void
    readonly viewAnalyticsAction: () => void
  }
  
  // Transaction feedback
  readonly transactionStatus: TransactionStatusUI
}

// Enhanced Wallet Connection UI Interface
export interface EnhancedWalletConnectionUI {
  readonly isConnected: boolean
  readonly isConnecting: boolean
  readonly formattedAddress: string | null
  readonly chainName: string
  readonly isCorrectNetwork: boolean
  readonly accountType: 'disconnected' | 'eoa' | 'smart_account'
  readonly hasSmartAccount: boolean
  readonly canUseGaslessTransactions: boolean
  readonly smartAccountAddress: string | null
  readonly isSmartAccountDeployed: boolean
  readonly canUpgradeToSmartAccount: boolean
  readonly upgradeToSmartAccount: () => Promise<void>
  readonly isUpgrading: boolean
  readonly connect: () => void
  readonly disconnect: () => void
  readonly switchNetwork: () => void
  readonly error: string | null
  readonly clearError: () => void
  readonly showNetworkWarning: boolean
  readonly showSmartAccountBenefits: boolean
}

/**
 * Enhanced Wallet Connection UI Hook
 * 
 * This hook provides everything wallet connection components need,
 * transforming complex Web3 provider state into simple UI interfaces.
 * It handles network validation, connection status, and provides
 * formatted display values for immediate use in components.
 */
export function useWalletConnectionUI(): EnhancedWalletConnectionUI {
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()

  // Real Smart Account context from your provider
  const {
    accountType,
    smartAccountConfig,
    capabilities,
    upgradeToSmartAccount,
    error: contextError
  } = useEnhancedWeb3()

  const [error, setError] = useState<string | null>(null)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const combinedError = contextError || error

  const { chainName, isCorrectNetwork } = useMemo(() => {
    const supportedChains = [8453, 84532]
    const isCorrect = supportedChains.includes(chainId)
    let name: string
    switch (chainId) {
      case 8453: name = 'Base Mainnet'; break
      case 84532: name = 'Base Sepolia'; break
      default: name = 'Unsupported Network'
    }
    return { chainName: name, isCorrectNetwork: isCorrect }
  }, [chainId])

  const formattedAddress = useMemo(() => address ? formatAddress(address) : null, [address])
  const smartAccountAddress = useMemo(
    () => smartAccountConfig.smartAccountAddress ? formatAddress(smartAccountConfig.smartAccountAddress) : null,
    [smartAccountConfig.smartAccountAddress]
  )

  const canUpgradeToSmartAccount = useMemo(() =>
    isConnected &&
    accountType === AccountType.EOA &&
    isCorrectNetwork &&
    !isUpgrading,
    [isConnected, accountType, isCorrectNetwork, isUpgrading]
  )

  const showSmartAccountBenefits = useMemo(() =>
    canUpgradeToSmartAccount && !smartAccountConfig.smartAccount,
    [canUpgradeToSmartAccount, smartAccountConfig.smartAccount]
  )

  const handleConnect = useCallback(() => {
    setError(null)
    // Your wallet connection logic (e.g., open modal)
  }, [])

  const handleSwitchNetwork = useCallback(() => {
    setError(null)
    // Your network switching logic
  }, [])

  const handleDisconnect = useCallback(() => {
    setError(null)
    setIsUpgrading(false)
    disconnect()
  }, [disconnect])

  const handleUpgradeToSmartAccount = useCallback(async () => {
    if (!canUpgradeToSmartAccount) {
      setError('Cannot upgrade to Smart Account at this time')
      return
    }
    setIsUpgrading(true)
    setError(null)
    try {
      await upgradeToSmartAccount()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade to Smart Account')
    } finally {
      setIsUpgrading(false)
    }
  }, [canUpgradeToSmartAccount, upgradeToSmartAccount])

  const clearError = useCallback(() => setError(null), [])

  let accountTypeString: 'disconnected' | 'eoa' | 'smart_account'
  switch (accountType) {
    case AccountType.DISCONNECTED:
      accountTypeString = 'disconnected'
      break
    case AccountType.EOA:
      accountTypeString = 'eoa'
      break
    case AccountType.SMART_ACCOUNT:
      accountTypeString = 'smart_account'
      break
    case AccountType.UPGRADING:
    default:
      accountTypeString = 'disconnected'
  }

  return {
    isConnected,
    isConnecting,
    formattedAddress,
    chainName,
    isCorrectNetwork,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchNetwork: handleSwitchNetwork,
    error: combinedError,
    clearError,
    showNetworkWarning: isConnected && !isCorrectNetwork,
    accountType: accountTypeString,
    hasSmartAccount: accountType === AccountType.SMART_ACCOUNT,
    canUseGaslessTransactions: capabilities.canSponsorGas,
    smartAccountAddress,
    isSmartAccountDeployed: smartAccountConfig.isDeployed,
    canUpgradeToSmartAccount,
    upgradeToSmartAccount: handleUpgradeToSmartAccount,
    isUpgrading,
    showSmartAccountBenefits
  }
}

// ===== CREATOR ONBOARDING UI INTEGRATION =====

/**
 * Creator Onboarding UI Hook
 * 
 * This hook transforms the creator onboarding workflow into a component-friendly
 * interface with formatted display values and built-in form validation.
 */
export function useCreatorOnboardingUI(userAddress: Address | undefined): CreatorOnboardingUI {
  const onboardingFlow = useCreatorOnboarding(userAddress)
  
  // Form validation state
  const [validationError, setValidationError] = useState<string | null>(null)
  
  // Format current step for display
  const currentStepText = useMemo(() => {
    switch (onboardingFlow.currentStep) {
      case 'checking':
        return 'Checking registration status...'
      case 'not_registered':
        return 'Ready to register as creator'
      case 'registering':
        return 'Processing registration...'
      case 'registered':
        return 'Successfully registered as creator'
      case 'error':
        return 'Registration failed'
      default:
        return 'Unknown status'
    }
  }, [onboardingFlow.currentStep])
  
  // Enhanced registration action with validation
  const handleSubmitRegistration = useCallback((subscriptionPriceText: string) => {
    try {
      setValidationError(null)
      
      // Parse and validate price input
      const priceNumber = parseFloat(subscriptionPriceText)
      if (isNaN(priceNumber)) {
        throw new Error('Please enter a valid price')
      }
      
      if (priceNumber < 0.01) {
        throw new Error('Subscription price must be at least $0.01')
      }
      
      if (priceNumber > 100) {
        throw new Error('Subscription price cannot exceed $100.00')
      }
      
      // Convert to BigInt format (USDC has 6 decimals)
      const priceInSmallestUnit = BigInt(Math.round(priceNumber * 1000000))
      
      onboardingFlow.register(priceInSmallestUnit)
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Invalid input')
    }
  }, [onboardingFlow])
  
  // Format profile data for display
  const profileDisplay = useMemo(() => {
    if (!onboardingFlow.profile || !userAddress) return null
    
    return {
      address: formatAddress(userAddress),
      subscriptionPriceText: formatCurrency(onboardingFlow.profile.subscriptionPrice),
      registrationDate: formatAbsoluteTime(onboardingFlow.profile.registrationTime)
    }
  }, [onboardingFlow.profile, userAddress])
  
  // Create transaction status UI
  const transactionStatus: TransactionStatusUI = useMemo(() => {
    const progress = onboardingFlow.registrationProgress
    
    let status: TransactionStatusUI['status'] = 'idle'
    let formattedStatus = 'Ready to register'
    let progressText = ''
    
    if (progress.isSubmitting) {
      status = 'submitting'
      formattedStatus = 'Submitting registration...'
      progressText = 'Please confirm the transaction in your wallet'
    } else if (progress.isConfirming) {
      status = 'confirming'
      formattedStatus = 'Confirming registration...'
      progressText = 'Waiting for blockchain confirmation'
    } else if (progress.isConfirmed) {
      status = 'confirmed'
      formattedStatus = 'Registration confirmed!'
      progressText = 'You are now registered as a creator'
    } else if (onboardingFlow.error) {
      status = 'failed'
      formattedStatus = 'Registration failed'
      progressText = formatWeb3Error(onboardingFlow.error)
    }
    
    return {
      status,
      transactionHash: progress.transactionHash || null,
      formattedStatus,
      canRetry: status === 'failed',
      progress: {
        submitted: progress.isSubmitting || progress.isConfirming || progress.isConfirmed,
        confirming: progress.isConfirming,
        confirmed: progress.isConfirmed,
        progressText
      },
      retry: onboardingFlow.reset,
      reset: onboardingFlow.reset,
      viewTransaction: () => {
        if (progress.transactionHash) {
          const baseUrl = 'https://basescan.org/tx/'
          window.open(`${baseUrl}${progress.transactionHash}`, '_blank')
        }
      }
    }
  }, [onboardingFlow])
  
  return {
    isRegistered: onboardingFlow.isRegistered,
    isLoading: onboardingFlow.isLoading,
    canRegister: onboardingFlow.currentStep === 'not_registered',
    currentStepText,
    registrationForm: {
      isSubmitting: onboardingFlow.registrationProgress.isSubmitting,
      validationError,
      submitAction: handleSubmitRegistration,
      reset: () => {
        setValidationError(null)
        onboardingFlow.reset()
      }
    },
    profile: profileDisplay,
    transactionStatus
  }
}

// ===== CONTENT PURCHASE UI INTEGRATION =====

/**
 * Content Purchase UI Hook
 * 
 * This hook transforms the content purchase workflow into a component-optimized
 * interface with formatted pricing, clear status messages, and simple actions.
 */
export function useContentPurchaseUI(
  contentId: bigint | undefined,
  userAddress: Address | undefined
): ContentPurchaseUI {
  const purchaseFlow = useContentPurchaseFlow(contentId, userAddress)
  
  // Format current step for display
  const currentStepText = useMemo(() => {
    switch (purchaseFlow.currentStep) {
      case 'checking_access':
        return 'Checking access status...'
      case 'can_purchase':
        return 'Ready to purchase'
      case 'need_approval':
        return 'Token approval required'
      case 'purchasing':
        return 'Processing purchase...'
      case 'completed':
        return 'Purchase complete - access granted!'
      case 'error':
        return 'Purchase failed'
      default:
        return 'Unknown status'
    }
  }, [purchaseFlow.currentStep])
  
  // Format content data for display
  const contentDisplay = useMemo(() => {
    if (!purchaseFlow.content) return null
    
    return {
      title: purchaseFlow.content.title,
      description: purchaseFlow.content.description,
      formattedPrice: formatCurrency(purchaseFlow.content.payPerViewPrice),
      category: formatContentCategory(purchaseFlow.content.category),
      creatorName: formatAddress(purchaseFlow.content.creator),
      publishDate: '-', // Placeholder since creationTime is not available
    }
  }, [purchaseFlow.content])
  
  // Format user balance for display
  const balanceText = useMemo(() => {
    if (!purchaseFlow.userBalance) return 'Balance: Unknown'
    return `Balance: ${formatCurrency(purchaseFlow.userBalance)}`
  }, [purchaseFlow.userBalance])
  
  // Create transaction status UIs
  const transactionStatus: TransactionStatusUI = useMemo(() => {
    const progress = purchaseFlow.purchaseProgress
    
    let status: TransactionStatusUI['status'] = 'idle'
    let formattedStatus = 'Ready to purchase'
    let progressText = ''
    
    if (progress.isSubmitting) {
      status = 'submitting'
      formattedStatus = 'Processing purchase...'
      progressText = 'Please confirm the transaction'
    } else if (progress.isConfirming) {
      status = 'confirming'
      formattedStatus = 'Confirming purchase...'
      progressText = 'Waiting for blockchain confirmation'
    } else if (progress.isConfirmed) {
      status = 'confirmed'
      formattedStatus = 'Purchase confirmed!'
      progressText = 'Content access granted'
    } else if (purchaseFlow.error) {
      status = 'failed'
      formattedStatus = 'Purchase failed'
      progressText = formatWeb3Error(purchaseFlow.error)
    }
    
    return {
      status,
      transactionHash: progress.transactionHash || null,
      formattedStatus,
      canRetry: status === 'failed',
      progress: {
        submitted: progress.isSubmitting || progress.isConfirming || progress.isConfirmed,
        confirming: progress.isConfirming,
        confirmed: progress.isConfirmed,
        progressText
      },
      retry: purchaseFlow.reset,
      reset: purchaseFlow.reset,
      viewTransaction: () => {
        if (progress.transactionHash) {
          const baseUrl = 'https://basescan.org/tx/'
          window.open(`${baseUrl}${progress.transactionHash}`, '_blank')
        }
      }
    }
  }, [purchaseFlow])
  
  const approvalStatus: TransactionStatusUI = useMemo(() => {
    const progress = purchaseFlow.approvalProgress
    
    let status: TransactionStatusUI['status'] = 'idle'
    let formattedStatus = 'Approval required'
    let progressText = ''
    
    if (progress.isSubmitting) {
      status = 'submitting'
      formattedStatus = 'Processing approval...'
      progressText = 'Please confirm the approval transaction'
    } else if (progress.isConfirming) {
      status = 'confirming'
      formattedStatus = 'Confirming approval...'
      progressText = 'Waiting for approval confirmation'
    } else if (progress.isConfirmed) {
      status = 'confirmed'
      formattedStatus = 'Approval confirmed!'
      progressText = 'Ready to purchase content'
    }
    
    return {
      status,
      transactionHash: progress.transactionHash || null,
      formattedStatus,
      canRetry: false,
      progress: {
        submitted: progress.isSubmitting || progress.isConfirming || progress.isConfirmed,
        confirming: progress.isConfirming,
        confirmed: progress.isConfirmed,
        progressText
      },
      retry: () => {},
      reset: () => {},
      viewTransaction: () => {
        if (progress.transactionHash) {
          const baseUrl = 'https://basescan.org/tx/'
          window.open(`${baseUrl}${progress.transactionHash}`, '_blank')
        }
      }
    }
  }, [purchaseFlow])
  
  // Format success/error messages
  const successMessage = purchaseFlow.hasAccess ? 'You now have access to this content!' : null
  const errorMessage = purchaseFlow.error ? formatWeb3Error(purchaseFlow.error) : null
  
  return {
    hasAccess: purchaseFlow.hasAccess ?? false,
    canPurchase: purchaseFlow.currentStep === 'can_purchase',
    isLoading: purchaseFlow.isLoading,
    currentStepText,
    content: contentDisplay,
    purchaseActions: {
      canAfford: purchaseFlow.canAfford,
      needsApproval: purchaseFlow.needsApproval,
      balanceText,
      purchaseAction: purchaseFlow.purchase,
      approveAndPurchaseAction: purchaseFlow.approveAndPurchase,
      isProcessing: purchaseFlow.isLoading
    },
    transactionStatus,
    approvalStatus,
    errorMessage,
    successMessage
  }
}

// ===== CONTENT PUBLISHING UI INTEGRATION =====

/**
 * Content Publishing UI Hook
 * 
 * This hook transforms the content publishing workflow into a component-friendly
 * interface with validation feedback and publishing status tracking.
 */
export function useContentPublishingUI(userAddress: Address | undefined): ContentPublishingUI {
  const publishingFlow = useContentPublishingFlow(userAddress)
  const creatorRegistration = useIsCreatorRegistered(userAddress)
  
  // Format current step for display
  const currentStepText = useMemo(() => {
    switch (publishingFlow.currentStep) {
      case 'idle':
        return 'Ready to publish content'
      case 'checking_creator':
        return 'Verifying creator status...'
      case 'validating_content':
        return 'Validating content data...'
      case 'registering':
        return 'Publishing content...'
      case 'completed':
        return 'Content published successfully!'
      case 'error':
        return 'Publishing failed'
      default:
        return 'Unknown status'
    }
  }, [publishingFlow.currentStep])
  
  // Enhanced validation function
  const validateContent = useCallback((data: ContentPublishingData): boolean => {
    // This would use the same validation logic as the workflow
    // but provide immediate feedback for form validation
    return data.title.length > 0 && 
           data.ipfsHash.length > 0 && 
           data.payPerViewPrice > BigInt(0)
  }, [])
  
  // Creator requirements formatting
  const creatorRequirements = useMemo(() => {
    const isRegistered = creatorRegistration.data ?? false
    return {
      isRegisteredCreator: isRegistered,
      needsRegistration: !isRegistered,
      registrationText: isRegistered 
        ? 'You are registered as a creator' 
        : 'You must register as a creator first'
    }
  }, [creatorRegistration.data])
  
  // Create transaction status UI
  const transactionStatus: TransactionStatusUI = useMemo(() => {
    const progress = publishingFlow.publishingProgress
    
    let status: TransactionStatusUI['status'] = 'idle'
    let formattedStatus = 'Ready to publish'
    let progressText = ''
    
    if (progress.isSubmitting) {
      status = 'submitting'
      formattedStatus = 'Publishing content...'
      progressText = 'Please confirm the transaction'
    } else if (progress.isConfirming) {
      status = 'confirming'
      formattedStatus = 'Confirming publication...'
      progressText = 'Waiting for blockchain confirmation'
    } else if (progress.isConfirmed) {
      status = 'confirmed'
      formattedStatus = 'Content published!'
      progressText = 'Your content is now live on the platform'
    } else if (publishingFlow.error) {
      status = 'failed'
      formattedStatus = 'Publishing failed'
      progressText = formatWeb3Error(publishingFlow.error)
    }
    
    return {
      status,
      transactionHash: progress.transactionHash || null,
      formattedStatus,
      canRetry: status === 'failed',
      progress: {
        submitted: progress.isSubmitting || progress.isConfirming || progress.isConfirmed,
        confirming: progress.isConfirming,
        confirmed: progress.isConfirmed,
        progressText
      },
      retry: publishingFlow.reset,
      reset: publishingFlow.reset,
      viewTransaction: () => {
        if (progress.transactionHash) {
          const baseUrl = 'https://basescan.org/tx/'
          window.open(`${baseUrl}${progress.transactionHash}`, '_blank')
        }
      }
    }
  }, [publishingFlow])
  
  // Format success/error messages
  const successMessage = publishingFlow.currentStep === 'completed' 
    ? 'Your content has been published successfully!' 
    : null
    
  const errorMessage = publishingFlow.error ? formatWeb3Error(publishingFlow.error) : null
  
  return {
    canPublish: creatorRegistration.data ?? false,
    isLoading: publishingFlow.isLoading || creatorRegistration.isLoading,
    currentStepText,
    validation: {
      isValid: false,
      errors: [],
      validateContent
    },
    publishingActions: {
      publishAction: publishingFlow.publish,
      isProcessing: publishingFlow.isLoading,
      reset: publishingFlow.reset
    },
    creatorRequirements,
    transactionStatus,
    errorMessage,
    successMessage
  }
}

// ===== CREATOR DASHBOARD UI INTEGRATION =====

/**
 * Creator Dashboard UI Hook
 * 
 * This hook provides comprehensive dashboard data formatted for immediate
 * display in creator analytics and management interfaces.
 */
export function useCreatorDashboardUI(userAddress: Address | undefined): CreatorDashboardUI {
  const chainId = useChainId()
  const contractAddresses = useMemo(() => getContractAddresses(chainId), [chainId])
  
  // Core data hooks
  const creatorRegistration = useIsCreatorRegistered(userAddress)
  const creatorProfile = useCreatorProfile(userAddress)
  const pendingEarnings = useCreatorPendingEarnings(userAddress)
  const userBalance = useTokenBalance(contractAddresses.USDC, userAddress)
  
  // State for withdrawal action
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  
  // Format dashboard metrics
  const metrics = useMemo(() => {
    if (!creatorProfile.data) return null
    
    return {
      totalEarnings: formatCurrency(creatorProfile.data.totalEarnings),
      pendingEarnings: formatCurrency(pendingEarnings.data ?? BigInt(0)),
      contentCount: creatorProfile.data.contentCount.toString(),
      subscriberCount: creatorProfile.data.subscriberCount.toString(),
      monthlyRevenue: formatCurrency(BigInt(0)) // Would need additional data for this
    }
  }, [creatorProfile.data, pendingEarnings.data])
  
  // Format profile information
  const profile = useMemo(() => {
    if (!creatorProfile.data || !userAddress) return null
    
    return {
      formattedAddress: formatAddress(userAddress),
      subscriptionPrice: formatCurrency(creatorProfile.data.subscriptionPrice),
      verificationStatus: creatorProfile.data.isVerified ? 'Verified' : 'Unverified',
      memberSince: formatAbsoluteTime(creatorProfile.data.registrationTime)
    }
  }, [creatorProfile.data, userAddress])
  
  // Earnings management
  const earnings = useMemo(() => {
    const withdrawableAmount = pendingEarnings.data ?? BigInt(0)
    
    return {
      canWithdraw: withdrawableAmount > BigInt(0),
      withdrawableAmount: formatCurrency(withdrawableAmount),
      withdrawAction: (amount: string) => {
        setIsWithdrawing(true)
        // Withdrawal logic would go here
        console.log(`Withdrawing ${amount}`)
      },
      isWithdrawing
    }
  }, [pendingEarnings.data, isWithdrawing])
  
  // Quick actions
  const quickActions = useMemo(() => ({
    publishContentAction: () => {
      console.log('Navigate to content publishing')
    },
    updatePricingAction: () => {
      console.log('Navigate to pricing settings')
    },
    viewAnalyticsAction: () => {
      console.log('Navigate to detailed analytics')
    }
  }), [])
  
  // Transaction status (for withdrawal)
  const transactionStatus: TransactionStatusUI = useMemo(() => ({
    status: 'idle' as const,
    transactionHash: null,
    formattedStatus: 'No pending transactions',
    canRetry: false,
    progress: {
      submitted: false,
      confirming: false,
      confirmed: false,
      progressText: ''
    },
    retry: () => {},
    reset: () => {},
    viewTransaction: () => {}
  }), [])
  
  return {
    isRegistered: creatorRegistration.data ?? false,
    isLoading: creatorRegistration.isLoading || creatorProfile.isLoading,
    metrics,
    profile,
    earnings,
    quickActions,
    transactionStatus
  }
}
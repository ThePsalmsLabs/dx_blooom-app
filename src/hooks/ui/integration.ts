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

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { type Address } from 'viem'

// Import utility functions for data formatting
import { formatAddress } from '@/lib/utils'
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
  useCreatorProfile,
  useCreatorPendingEarnings,
  useWithdrawEarnings,
  useTokenBalance
} from '@/hooks/contracts/core'

// Import contract configuration
import { getContractAddresses } from '@/lib/contracts/config'

// Import utility functions for data formatting
import {
  formatCurrency,
  formatAbsoluteTime,
  formatContentCategory,
  formatWeb3Error
} from '@/lib/utils'

// Import types



import type { Connector } from 'wagmi'

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
    readonly submitAction: (subscriptionPrice: string, profileData?: string) => void  // Takes formatted price string and optional profile data
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
  
  // Published content information
  readonly publishedContentId: bigint | null
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
  readonly showWalletModal: boolean
  readonly setShowWalletModal: (show: boolean) => void
  readonly connectors: Connector[]
  readonly handleConnectorSelect: (connector: Connector) => void
}

/**
 * Wallet Connection UI Hook - The Bridge Between Web3 and Your UI
 * 
 * This hook solves the fundamental problem you were experiencing: it provides
 * the actual connection between your button clicks and the wallet modal system.
 * 
 * The previous version had placeholder logic that just logged to console.
 * This version uses RainbowKit's useConnectModal hook to actually trigger
 * the wallet selection modal when users click "Connect Wallet".
 * 
 * Think of this like the difference between a light switch that's wired to
 * nothing versus one that's properly connected to the electrical system.
 * Both switches look the same, but only one actually turns on the lights.
 */
export function useWalletConnectionUI(): EnhancedWalletConnectionUI {
  // Core Wagmi hooks for wallet state
  const { address, isConnected, isConnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  // RainbowKit modal control - THIS IS THE MISSING PIECE!
  // This hook provides the openConnectModal function that actually
  // displays the wallet selection modal to users
  const { openConnectModal } = useConnectModal()
  
  // State for user feedback and error handling
  const [error, setError] = useState<string | null>(null)
  
  /**
   * Network Detection and Validation
   * 
   * This logic determines which blockchain network the user is connected to
   * and whether it's one of our supported networks. We support both Base
   * mainnet (for production) and Base Sepolia (for testing).
   * 
   * The network check is important because your smart contracts are deployed
   * on specific networks, and users need to be on the right network to
   * interact with your platform.
   */
  const { chainName, isCorrectNetwork } = useMemo(() => {
    // Define which chain IDs we support
    const supportedChains = [8453, 84532] // Base Mainnet and Base Sepolia
    const isCorrect = supportedChains.includes(chainId)
    
    // Map chain IDs to human-readable names
    let name: string
    switch (chainId) {
      case 8453:
        name = 'Base Mainnet'
        break
      case 84532:
        name = 'Base Sepolia'
        break
      default:
        name = 'Unsupported Network'
    }
    
    return { chainName: name, isCorrectNetwork: isCorrect }
  }, [chainId])
  
  /**
   * Address Formatting for Display
   * 
   * Wallet addresses are long hex strings (like 0x742d35Cc6aF3...) that
   * don't fit well in UI components. This formats them into a shorter,
   * more user-friendly version (like 0x742d...AF3f) for display.
   */
  const formattedAddress = useMemo(() => {
    return address ? formatAddress(address) : null
  }, [address])
  
  /**
   * Connection Action - The Core Fix
   * 
   * This is where the magic happens. Previously, your hook just logged
   * to console. Now it checks if the RainbowKit modal is available and
   * actually opens it when users click "Connect Wallet".
   * 
   * The conditional check ensures we don't crash if RainbowKit isn't
   * properly configured, and provides helpful error messages for debugging.
   */
  const handleConnect = useCallback(() => {
    try {
      setError(null)
      
      // Check if RainbowKit modal is available
      if (openConnectModal) {
        // This actually opens the wallet selection modal!
        openConnectModal()
      } else {
        // If modal isn't available, it means RainbowKit isn't properly configured
        throw new Error('Wallet connection modal not available. Check RainbowKit setup.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet. Please try again.'
      setError(errorMessage)
      console.error('Wallet connection error:', err)
    }
  }, [openConnectModal])
  
  /**
   * Network Switching Action
   * 
   * This function helps users switch to a supported network if they're
   * connected to the wrong one. It uses Wagmi's switchChain function
   * to prompt their wallet to change networks.
   */
  const handleSwitchNetwork = useCallback(() => {
    try {
      setError(null)
      
      // Default to Base Sepolia (chain ID 84532) for testing
      // Change to 8453 for Base Mainnet when contracts are deployed
      switchChain({ chainId: 84532 })
    } catch (err) {
      setError('Failed to switch networks. Please try manually in your wallet.')
      console.error('Network switch error:', err)
    }
  }, [switchChain])
  
  /**
   * Error Recovery Action
   * 
   * Simple function to clear error messages and let users try again.
   * This improves user experience by not leaving error messages stuck
   * on screen after users have acknowledged them.
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  /**
   * Automatic Error Clearing
   * 
   * This effect automatically clears errors when the connection state
   * changes successfully. For example, if a user gets an error and then
   * successfully connects their wallet, we clear the error automatically.
   */
  useEffect(() => {
    if (isConnected && error) {
      setError(null)
    }
  }, [isConnected, error])
  
  /**
   * Return the Complete UI Interface
   * 
   * This return object provides everything your UI components need
   * in a clean, predictable format. Components can use this data
   * declaratively without worrying about the underlying Web3 complexity.
   */
  return {
    // Connection status
    isConnected,
    isConnecting,
    
    // Display formatting
    formattedAddress,
    chainName,
    isCorrectNetwork,
    
    // Action functions - these now actually work!
    connect: handleConnect,        // This opens the RainbowKit modal
    disconnect: () => disconnect(), // This disconnects the wallet
    switchNetwork: handleSwitchNetwork, // This prompts network switching
    
    // Error handling
    error,
    clearError,
    showNetworkWarning: isConnected && !isCorrectNetwork,
    
    // Smart Account features (simplified for now)
    accountType: 'disconnected' as const,
    hasSmartAccount: false,
    canUseGaslessTransactions: false,
    smartAccountAddress: null,
    isSmartAccountDeployed: false,
    canUpgradeToSmartAccount: false,
    upgradeToSmartAccount: async () => {},
    isUpgrading: false,
    showSmartAccountBenefits: false,
    showWalletModal: false,
    setShowWalletModal: () => {},
    connectors: [],
    handleConnectorSelect: () => {}
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
  const handleSubmitRegistration = useCallback((subscriptionPriceText: string, profileData: string = '') => {
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
      
      
      // Validate profile data
      if (!profileData || profileData.trim().length === 0) {
        throw new Error('Profile data cannot be empty')
      }
      
      // Convert to BigInt format (USDC has 6 decimals)
      const priceInSmallestUnit = BigInt(Math.round(priceNumber * 1000000))
      
      onboardingFlow.register(priceInSmallestUnit, profileData)
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

  // Map step to human-readable text
  const currentStepText = useMemo(() => {
    switch (purchaseFlow.flowState.step) {
      case 'checking_access':
        return 'Checking access status...'
      case 'loading_content':
        return 'Loading content information...'
      case 'insufficient_balance':
        return 'Insufficient balance'
      case 'need_approval':
        return 'Token approval required'
      case 'can_purchase':
        return 'Ready to purchase'
      case 'approving_tokens':
        return 'Approving token spending...'
      case 'purchasing':
        return 'Processing purchase...'
      case 'completed':
        return 'Purchase complete - access granted!'
      case 'error':
        return 'Purchase failed'
      default:
        return 'Unknown status'
    }
  }, [purchaseFlow.flowState.step])

  // Content display
  const contentDisplay = useMemo(() => {
    const c = purchaseFlow.contentDetails
    if (!c) return null
    return {
      title: c.title,
      description: c.description,
      formattedPrice: formatCurrency(c.payPerViewPrice),
      category: formatContentCategory(c.category),
      creatorName: formatAddress(c.creator),
      publishDate: '-',
    }
  }, [purchaseFlow.contentDetails])

  // Balance text
  const balanceText = useMemo(() => {
    const bal = purchaseFlow.userBalance
    if (!bal) return 'Balance: Unknown'
    return `Balance: ${formatCurrency(bal)}`
  }, [purchaseFlow.userBalance])

  // Transaction status from flow state
  const transactionStatus: TransactionStatusUI = useMemo(() => {
    const step = purchaseFlow.flowState.step
    const hash = purchaseFlow.flowState.transactionHash || null
    const status: TransactionStatusUI['status'] =
      step === 'purchasing' ? 'submitting' : step === 'completed' ? 'confirmed' : step === 'error' ? 'failed' : 'idle'
    const formattedStatus =
      status === 'submitting'
        ? 'Processing purchase...'
        : status === 'confirmed'
          ? 'Purchase confirmed!'
          : status === 'failed'
            ? 'Purchase failed'
            : 'Ready to purchase'
    const progressText =
      status === 'submitting'
        ? 'Please confirm the transaction'
        : status === 'confirmed'
          ? 'Content access granted'
          : status === 'failed'
            ? (purchaseFlow.flowState.error ? formatWeb3Error(purchaseFlow.flowState.error) : 'Transaction failed')
            : ''
    return {
      status,
      transactionHash: hash,
      formattedStatus,
      canRetry: status === 'failed',
      progress: {
        submitted: Boolean(hash) || status === 'submitting' || status === 'confirmed',
        confirming: false,
        confirmed: status === 'confirmed',
        progressText,
      },
      retry: purchaseFlow.reset,
      reset: purchaseFlow.reset,
      viewTransaction: () => {
        if (hash) {
          const baseUrl = 'https://basescan.org/tx/'
          window.open(`${baseUrl}${hash}`, '_blank')
        }
      },
    }
  }, [purchaseFlow.flowState, purchaseFlow.reset])

  // Approval status approximated from step
  const approvalStatus: TransactionStatusUI = useMemo(() => {
    const step = purchaseFlow.flowState.step
    const status: TransactionStatusUI['status'] = step === 'approving_tokens' ? 'submitting' : step === 'can_purchase' ? 'confirmed' : 'idle'
    const formattedStatus =
      status === 'submitting' ? 'Processing approval...' : status === 'confirmed' ? 'Approval confirmed!' : 'Approval required'
    const progressText = status === 'submitting' ? 'Please confirm the approval transaction' : ''
    return {
      status,
      transactionHash: null,
      formattedStatus,
      canRetry: false,
      progress: {
        submitted: status !== 'idle',
        confirming: false,
        confirmed: status === 'confirmed',
        progressText,
      },
      retry: () => {},
      reset: () => {},
      viewTransaction: () => {},
    }
  }, [purchaseFlow.flowState.step])

  const successMessage = purchaseFlow.hasAccess ? 'You now have access to this content!' : null
  const errorMessage = purchaseFlow.flowState.step === 'error' && purchaseFlow.flowState.error ? formatWeb3Error(purchaseFlow.flowState.error) : null

  const canAfford = useMemo(() => {
    const bal = purchaseFlow.userBalance || BigInt(0)
    const req = purchaseFlow.requiredAmount || BigInt(0)
    return bal >= req
  }, [purchaseFlow.userBalance, purchaseFlow.requiredAmount])

  return {
    hasAccess: purchaseFlow.hasAccess,
    canPurchase: purchaseFlow.flowState.step === 'can_purchase',
    isLoading: purchaseFlow.isLoading,
    currentStepText,
    content: contentDisplay,
    purchaseActions: {
      canAfford,
      needsApproval: purchaseFlow.needsApproval,
      balanceText,
      purchaseAction: purchaseFlow.purchase,
      approveAndPurchaseAction: purchaseFlow.approveAndPurchase,
      isProcessing: purchaseFlow.isLoading || ['approving_tokens', 'purchasing'].includes(purchaseFlow.flowState.step),
    },
    transactionStatus,
    approvalStatus,
    errorMessage,
    successMessage,
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
  const publishingFlow = useContentPublishingFlow(userAddress);
  const creatorRegistration = useIsCreatorRegistered(userAddress);

  // Format current step for display
  const currentStepText = useMemo(() => {
    switch (publishingFlow.currentStep) {
      case 'idle':
        return 'Ready to publish content';
      case 'checking_creator':
        return 'Verifying creator status...';
      case 'validating_content':
        return 'Validating content data...';
      case 'registering':
        return 'Publishing content...';
      case 'completed':
        return 'Content published successfully!';
      case 'error':
        return 'Publishing failed';
      default:
        return 'Unknown status';
    }
  }, [publishingFlow.currentStep]);

  // Enhanced validation function
  const validateContent = useCallback((data: ContentPublishingData): boolean => {
    return data.title.length > 0 && 
           data.ipfsHash.length > 0 && 
           data.payPerViewPrice > BigInt(0);
  }, []);

  // Creator requirements formatting
  const creatorRequirements = useMemo(() => {
    const isRegistered = creatorRegistration.data ?? false;
    return {
      isRegisteredCreator: isRegistered,
      needsRegistration: !isRegistered,
      registrationText: isRegistered 
        ? 'You are registered as a creator' 
        : 'You must register as a creator first',
    };
  }, [creatorRegistration.data]);

  // Create stable action references
  const publishingActions = useMemo(() => ({
    publishAction: (data: ContentPublishingData) => {
      publishingFlow.publish(data);
    },
    isProcessing: publishingFlow.isLoading,
    reset: () => {
      publishingFlow.reset();
    },
  }), [publishingFlow.publish, publishingFlow.isLoading, publishingFlow.reset]);

  // Create transaction status UI
  const transactionStatus: TransactionStatusUI = useMemo(() => {
    const progress = publishingFlow.publishingProgress;
    
    let status: TransactionStatusUI['status'] = 'idle';
    let formattedStatus = 'Ready to publish';
    let progressText = '';
    
    if (progress.isSubmitting) {
      status = 'submitting';
      formattedStatus = 'Publishing content...';
      progressText = 'Please confirm the transaction';
    } else if (progress.isConfirming) {
      status = 'confirming';
      formattedStatus = 'Confirming publication...';
      progressText = 'Waiting for blockchain confirmation';
    } else if (progress.isConfirmed) {
      status = 'confirmed';
      formattedStatus = 'Content published!';
      progressText = 'Your content is now live on the platform';
    } else if (publishingFlow.error) {
      status = 'failed';
      formattedStatus = 'Publishing failed';
      progressText = formatWeb3Error(publishingFlow.error);
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
        progressText,
      },
      retry: publishingFlow.reset,
      reset: publishingFlow.reset,
      viewTransaction: () => {
        if (progress.transactionHash) {
          const baseUrl = 'https://basescan.org/tx/';
          window.open(`${baseUrl}${progress.transactionHash}`, '_blank');
        }
      },
    };
  }, [publishingFlow.publishingProgress, publishingFlow.error, publishingFlow.reset]);

  // Format success/error messages
  const successMessage = useMemo(() => 
    publishingFlow.currentStep === 'completed' 
      ? 'Your content has been published successfully!' 
      : null,
    [publishingFlow.currentStep]
  );

  const errorMessage = useMemo(() => 
    publishingFlow.error ? formatWeb3Error(publishingFlow.error) : null,
    [publishingFlow.error]
  );

  return {
    canPublish: creatorRegistration.data ?? false,
    isLoading: publishingFlow.isLoading || creatorRegistration.isLoading,
    currentStepText,
    validation: {
      isValid: false,
      errors: [],
      validateContent,
    },
    publishingActions,
    creatorRequirements,
    transactionStatus,
    errorMessage,
    successMessage,
    publishedContentId: publishingFlow.publishedContentId,
  };
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
  const withdraw = useWithdrawEarnings()
  
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
      withdrawAction: (_amount: string) => {
        if (withdrawableAmount > BigInt(0) && !withdraw.isLoading && !withdraw.isConfirming) {
          setIsWithdrawing(true)
          withdraw.write()
        }
      },
      isWithdrawing: isWithdrawing || withdraw.isLoading || withdraw.isConfirming
    }
  }, [pendingEarnings.data, isWithdrawing, withdraw.isLoading, withdraw.isConfirming, withdraw.write])
  
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
    status: withdraw.isLoading ? 'submitting' : withdraw.isConfirming ? 'confirming' : withdraw.isConfirmed ? 'confirmed' : 'idle',
    transactionHash: withdraw.hash || null,
    formattedStatus: withdraw.isLoading
      ? 'Submitting withdrawal...'
      : withdraw.isConfirming
        ? 'Confirming withdrawal...'
        : withdraw.isConfirmed
          ? 'Withdrawal confirmed'
          : 'No pending transactions',
    canRetry: Boolean(withdraw.error),
    progress: {
      submitted: Boolean(withdraw.hash),
      confirming: withdraw.isConfirming,
      confirmed: withdraw.isConfirmed,
      progressText: withdraw.isLoading
        ? 'Please confirm in your wallet'
        : withdraw.isConfirming
          ? 'Waiting for confirmation'
          : withdraw.isConfirmed
            ? 'Funds withdrawn'
            : ''
    },
    retry: () => withdraw.reset(),
    reset: () => withdraw.reset(),
    viewTransaction: () => {
      if (withdraw.hash) {
        const baseUrl = 'https://basescan.org/tx/'
        window.open(`${baseUrl}${withdraw.hash}`, '_blank')
      }
    }
  }), [withdraw.hash, withdraw.isLoading, withdraw.isConfirming, withdraw.isConfirmed, withdraw.error, withdraw.reset])

  // Track withdraw lifecycle to clear local flag when done
  useEffect(() => {
    if (!withdraw.isLoading && !withdraw.isConfirming) {
      setIsWithdrawing(false)
    }
  }, [withdraw.isLoading, withdraw.isConfirming])
  
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
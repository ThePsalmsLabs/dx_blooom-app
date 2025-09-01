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
"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { useChainId } from 'wagmi'
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth'
import { useMiniAppWalletContext } from '@/contexts/MiniAppWalletContext'
import { type Address } from 'viem'

// Import utility functions for data formatting
import { formatAddress } from '@/lib/utils'
import {
  storeWalletState,
  sendWalletStateToParent,
  isMiniAppContext,
  listenForWalletState,
  shouldRedirectToMiniApp
} from '@/lib/utils/miniapp-communication'
// Import our business logic hooks to compose them into UI-focused interfaces
import {
  useUnifiedContentPurchaseFlow,
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
    readonly retry: () => void
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
  readonly address?: string | null // Full address for contract calls
  readonly formattedAddress: string | null // Formatted address for UI display
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
  readonly connectors: readonly Connector[]
  readonly handleConnectorSelect: (connector: Connector) => void
}

/**
 * Wallet Connection UI Hook - The Bridge Between Web3 and Your UI
 * 
 * This hook solves the fundamental problem you were experiencing: it provides
 * the actual connection between your button clicks and the wallet modal system.
 * 
 * The previous version had placeholder logic that just logged to console.
 * This version uses Privy's modal system to actually trigger
 * the wallet selection modal when users click "Connect Wallet".
 * 
 * Think of this like the difference between a light switch that's wired to
 * nothing versus one that's properly connected to the electrical system.
 * Both switches look the same, but only one actually turns on the lights.
 */
export function useWalletConnectionUI(): EnhancedWalletConnectionUI {
  // Always call ALL hooks first to avoid conditional hook calls
  const miniAppContext = useMiniAppWalletContext()

  // Use ONLY Privy hooks for wallet management
  const { user, ready, authenticated, login, logout } = usePrivy()

  // Get chainId from wagmi for network info (read-only)
  const chainId = useChainId()

    // State for user feedback and error handling (must be called before any conditional logic)
  const [error, setError] = useState<string | null>(null)

  // ALL hooks must be called before any conditional logic or early returns
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

  const formattedAddress = useMemo(() => {
    const address = user?.wallet?.address || null
    return address ? formatAddress(address as `0x${string}`) : null
  }, [user?.wallet?.address])

  const handleConnect = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Privy-only connect called', {
        ready,
        authenticated,
        hasLogin: !!login
      })
    }

    try {
      setError(null)

      // Use Privy login exclusively
      if (login) {
        console.log('✅ Opening Privy login modal')
        login()
      } else {
        console.error('❌ Privy login not available')
        setError('Wallet connection system not available')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      console.error('💥 Privy connection error:', err)
      setError(errorMessage)
    }
  }, [login, ready, authenticated])

  const handleConnectorSelect = useCallback((connector: Connector) => {
    // In pure Privy mode, we don't use wagmi connectors
    // Just trigger Privy login directly
    console.log('🔗 Connector selected, using Privy login instead')
    handleConnect()
  }, [handleConnect])

  const handleSwitchNetwork = useCallback(() => {
    try {
      setError(null)

      console.log('📡 Network switch requested - asking user to switch manually')

      // Show user-friendly message about manual network switching
      alert('Please switch to Base Sepolia (Chain ID: 84532) in your wallet')

    } catch (err) {
      setError('Failed to switch networks. Please try manually in your wallet.')
      console.error('Network switch error:', err)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Extract wallet info from Privy user object (needed for useEffect)
  const isConnected = authenticated && Boolean(user?.wallet?.address)

  useEffect(() => {
    if (isConnected && error) {
      setError(null)
    }
  }, [isConnected, error])

  // Web context communication - send wallet state when connected
  useEffect(() => {
    if (!isMiniAppContext() && isConnected && user?.wallet?.address) {
      const walletState = {
        isConnected: isConnected,
        address: user.wallet.address,
        chainId: chainId
      }

      // Store in localStorage for MiniApp communication
      storeWalletState(walletState)

      // Send to parent window (in case we're in an iframe)
      sendWalletStateToParent(walletState)

      // Only log in development and throttle to reduce console spam
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 Web wallet state updated:', {
          isConnected: walletState.isConnected,
          address: `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}`,
          chainId: walletState.chainId
        })
      }
    }
  }, [isConnected, user?.wallet?.address, chainId])

  // If we're in MiniApp context, use the MiniApp wallet UI (AFTER all hooks are called)
  if (miniAppContext?.isMiniAppContext) {
    return miniAppContext.walletUI
  }

  // Extract wallet info from Privy user object
  const isConnecting = !ready
  const address = user?.wallet?.address || null

  // Track previous values to reduce console spam
  const prevDebugState = useRef<{
    ready: boolean
    authenticated: boolean
    isConnected: boolean
    address: string | null
  } | null>(null)

  // Debug logging to help identify the issue (throttled in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const currentDebugState = {
        ready,
        authenticated,
        isConnected,
        address
      }

      // Only log if values have actually changed
      if (JSON.stringify(currentDebugState) !== JSON.stringify(prevDebugState.current)) {
        console.log('🔍 useWalletConnectionUI Debug (Privy-only):', {
          ready,
          authenticated,
          isConnected,
          isConnecting,
          userWallet: user?.wallet?.address ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}` : null,
          userEmail: user?.email?.address || null,
          hasUser: !!user,
          userLinkedAccounts: user?.linkedAccounts?.length || 0
        })
        prevDebugState.current = currentDebugState
      }
    }
  }, [ready, authenticated, isConnected, address, user])
  
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
    
    // Address information
    address, // Full address for contract calls
    formattedAddress, // Formatted address for UI display
    chainName,
    isCorrectNetwork,
    
    // Action functions - Pure Privy only!
    connect: handleConnect,        // Opens Privy login modal
    disconnect: async () => {
      console.log('🔌 Pure Privy disconnect called', {
        authenticated,
        hasUser: !!user,
        userWallet: user?.wallet?.address,
        ready
      })
      
      try {
        // Check if user is actually authenticated before trying to logout
        if (!authenticated) {
          console.log('⚠️ User already logged out, skipping logout call')
          return
        }
        
        if (!ready) {
          console.log('⚠️ Privy not ready, skipping logout call')
          return
        }
        
        // Use ONLY Privy logout - no more wagmi disconnect
        console.log('📤 Calling Privy logout...')
        await logout()
        console.log('✅ Successfully logged out from Privy')
      } catch (error) {
        console.error('❌ Error during Privy logout:', error)
        
        // Check if it's a 400 error (session already invalid)
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          console.log('ℹ️ Session was already invalid (400 error), treating as successful logout')
          return // Don't show error for invalid session
        }
        
        setError('Failed to disconnect. Please try again.')
      }
    }, // Pure Privy disconnect with enhanced debugging
    switchNetwork: handleSwitchNetwork, // This prompts network switching
    
    // Error handling
    error,
    clearError,
    showNetworkWarning: isConnected && !isCorrectNetwork,
    
    // Smart Account features (simplified for now)
    accountType: isConnected ? 'eoa' as const : 'disconnected' as const,
    hasSmartAccount: false,
    canUseGaslessTransactions: false,
    smartAccountAddress: null,
    isSmartAccountDeployed: false,
    canUpgradeToSmartAccount: isConnected,
    upgradeToSmartAccount: async () => {},
    isUpgrading: false,
    showSmartAccountBenefits: false,
    
    // Custom modal state (disabled in pure Privy mode)
    showWalletModal: false, // Always false since we only use Privy modal
    setShowWalletModal: () => {}, // No-op since we don't use custom modal
    connectors: [], // Empty array since we don't use wagmi connectors
    handleConnectorSelect
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
  const purchaseFlow = useUnifiedContentPurchaseFlow(contentId, userAddress)

  // Map step to human-readable text
  const currentStepText = useMemo(() => {
    switch (purchaseFlow.executionState.phase) {
      case 'idle':
        return 'Ready to purchase'
      case 'calculating':
        return 'Calculating costs...'
      case 'approving':
        return 'Approving tokens...'
      case 'creating_intent':
        return 'Creating payment intent...'
      case 'waiting_signature':
        return 'Waiting for authorization...'
      case 'executing':
        return 'Processing purchase...'
      case 'confirming':
        return 'Confirming transaction...'
      case 'completed':
        return 'Purchase complete - access granted!'
      case 'error':
        return 'Purchase failed'
      default:
        return 'Unknown status'
    }
  }, [purchaseFlow.executionState.phase])

  // Content display
  const contentDisplay = useMemo(() => {
    const c = purchaseFlow.content
    if (!c) return null
    return {
      title: c.title,
      description: c.description,
      formattedPrice: formatCurrency(purchaseFlow.estimatedCost || BigInt(0)),
      category: formatContentCategory(c.category),
      creatorName: formatAddress(c.creator),
      publishDate: '-',
    }
  }, [purchaseFlow.content, purchaseFlow.estimatedCost])

  // Balance text
  const balanceText = useMemo(() => {
    const selectedToken = purchaseFlow.selectedToken
    if (!selectedToken || !selectedToken.balance) return 'Balance: Unknown'
    return `Balance: ${formatCurrency(selectedToken.balance)}`
  }, [purchaseFlow.selectedToken])

  // Transaction status from execution state
  const transactionStatus: TransactionStatusUI = useMemo(() => {
    const phase = purchaseFlow.executionState.phase
    const hash = purchaseFlow.executionState.transactionHash || null
    const status: TransactionStatusUI['status'] =
      phase === 'executing' ? 'submitting' : phase === 'completed' ? 'confirmed' : phase === 'error' ? 'failed' : 'idle'
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
            ? (purchaseFlow.executionState.error ? formatWeb3Error(purchaseFlow.executionState.error) : 'Transaction failed')
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
      retry: purchaseFlow.retryPayment,
      reset: purchaseFlow.resetPayment,
      viewTransaction: () => {
        if (hash) {
          const baseUrl = 'https://basescan.org/tx/'
          window.open(`${baseUrl}${hash}`, '_blank')
        }
      },
    }
  }, [purchaseFlow.executionState, purchaseFlow.retryPayment, purchaseFlow.resetPayment])

  // Approval status approximated from execution state
  const approvalStatus: TransactionStatusUI = useMemo(() => {
    const phase = purchaseFlow.executionState.phase
    const status: TransactionStatusUI['status'] = phase === 'approving' ? 'submitting' : phase === 'completed' ? 'confirmed' : 'idle'
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
  }, [purchaseFlow.executionState.phase])

  const successMessage = purchaseFlow.hasAccess ? 'You now have access to this content!' : null
  const errorMessage = purchaseFlow.executionState.phase === 'error' && purchaseFlow.executionState.error ? formatWeb3Error(purchaseFlow.executionState.error) : null

  const canAfford = useMemo(() => {
    const selectedToken = purchaseFlow.selectedToken
    if (!selectedToken || !purchaseFlow.estimatedCost) return false
    return (selectedToken.balance || BigInt(0)) >= purchaseFlow.estimatedCost
  }, [purchaseFlow.selectedToken, purchaseFlow.estimatedCost])

  return {
    hasAccess: purchaseFlow.hasAccess,
    canPurchase: purchaseFlow.canExecutePayment,
    isLoading: purchaseFlow.isLoading,
    currentStepText,
    content: contentDisplay,
    purchaseActions: {
      canAfford,
      needsApproval: false, // This is handled by the orchestrator
      balanceText,
      purchaseAction: purchaseFlow.executePayment,
      approveAndPurchaseAction: purchaseFlow.executePayment,
      isProcessing: purchaseFlow.isLoading || ['approving', 'executing'].includes(purchaseFlow.executionState.phase),
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
  // Always call hooks in the same order to avoid React hooks violations
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
    retry: () => {
      publishingFlow.retry();
    },
  }), [publishingFlow.publish, publishingFlow.isLoading, publishingFlow.reset, publishingFlow.retry]);

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
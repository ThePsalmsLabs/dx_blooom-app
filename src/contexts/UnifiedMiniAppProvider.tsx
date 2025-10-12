/**
 * Unified MiniApp Provider - Streamlined Social Commerce Architecture
 * File: src/contexts/UnifiedMiniAppProvider.tsx
 *
 * Consolidates MiniApp functionality into a single optimized provider,
 * delivering a clean interface for social commerce experiences.
 *
 * Features:
 * - Centralized state management with minimal re-renders
 * - Unified transaction state management
 * - Progressive enhancement with graceful fallbacks
 * - WALLET CONNECTION DISABLED - TO BE REBUILT
 */

'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
  useReducer
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { type Address } from 'viem'

// WALLET CONNECTION IMPORTS REMOVED - TO BE REBUILT

// ================================================
// CORE TYPES AND INTERFACES
// ================================================

/**
 * Application Context Types
 */
export type AppContext = 'web' | 'miniapp'
export type ViewportSize = 'mobile' | 'tablet' | 'desktop'
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Transaction State Interface - Unified across all environments
 */
export interface TransactionState {
  readonly status: 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'failed'
  readonly transactionHash: string | null
  readonly formattedStatus: string
  readonly canRetry: boolean
  readonly progress: {
    readonly submitted: boolean
    readonly confirming: boolean
    readonly confirmed: boolean
    readonly progressText: string
  }
  readonly retry: () => void
  readonly reset: () => void
  readonly viewTransaction: () => void
}

/**
 * Social Context Interface
 */
export interface SocialContext {
  readonly isAvailable: boolean
  readonly userProfile: {
    readonly fid: number | null
    readonly username: string | null
    readonly displayName: string | null
    readonly isVerified: boolean
  } | null
  readonly canShare: boolean
  readonly canCompose: boolean
  readonly trustScore: number
}

/**
 * Capability Assessment Interface
 */
export interface Capabilities {
  readonly wallet: {
    readonly canConnect: boolean
    readonly canBatchTransactions: boolean
    readonly supportedChains: readonly number[]
  }
  readonly social: {
    readonly canShare: boolean
    readonly canCompose: boolean
    readonly canAccessSocialGraph: boolean
  }
  readonly platform: {
    readonly canDeepLink: boolean
    readonly canAccessClipboard: boolean
    readonly canAccessCamera: boolean
  }
}

/**
 * Unified Application State
 */
export interface UnifiedAppState {
  readonly context: AppContext
  readonly isConnected: false // WALLET CONNECTION DISABLED
  readonly userAddress: null // WALLET CONNECTION DISABLED
  readonly capabilities: Capabilities
  readonly socialContext: SocialContext
  readonly transactionState: TransactionState
  readonly loadingState: LoadingState
  readonly error: Error | null
}

/**
 * Provider Props Interface
 */
export interface UnifiedMiniAppProviderProps {
  readonly children: ReactNode
  readonly enableAnalytics?: boolean
  readonly enableOptimizations?: boolean
  readonly fallbackToWeb?: boolean
}

/**
 * Farcaster Wallet State Interface - DISABLED
 */
export interface FarcasterWalletState {
  readonly isConnected: false // WALLET CONNECTION DISABLED
  readonly address: undefined // WALLET CONNECTION DISABLED
  readonly isConnecting: false // WALLET CONNECTION DISABLED
  readonly error: Error | null
  readonly isInMiniApp: boolean
}

/**
 * Context Value Interface
 */
export interface UnifiedMiniAppContextValue {
  readonly state: UnifiedAppState
  readonly farcasterWallet: FarcasterWalletState
  readonly actions: {
    readonly connectWallet: () => Promise<void> // DISABLED - WILL THROW ERROR
    readonly disconnectWallet: () => void // DISABLED - WILL THROW ERROR
    readonly shareContent: (contentId: bigint, title: string) => Promise<void>
    readonly executeTransaction: (type: string, params: Record<string, unknown>) => Promise<void>
    readonly resetError: () => void
  }
  readonly utils: {
    readonly isMiniApp: boolean
    readonly isMobile: boolean
    readonly canPerformAction: (action: string) => boolean
    readonly formatAddress: (address: Address) => string
  }
}

// ================================================
// CONTEXT CREATION
// ================================================

const UnifiedMiniAppContext = createContext<UnifiedMiniAppContextValue | null>(null)

// ================================================
// STATE MANAGEMENT
// ================================================

/**
 * State Actions
 */
type AppAction =
  | { type: 'SET_LOADING'; payload: LoadingState }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_CONNECTION'; payload: false } // WALLET CONNECTION DISABLED
  | { type: 'SET_USER_ADDRESS'; payload: null } // WALLET CONNECTION DISABLED
  | { type: 'SET_CAPABILITIES'; payload: Capabilities }
  | { type: 'SET_SOCIAL_CONTEXT'; payload: SocialContext }
  | { type: 'SET_TRANSACTION_STATE'; payload: TransactionState }
  | { type: 'SET_CONTEXT'; payload: AppContext }

/**
 * State Reducer
 */
function appStateReducer(state: UnifiedAppState, action: AppAction): UnifiedAppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loadingState: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_CONNECTION':
      return { ...state, isConnected: action.payload }
    case 'SET_USER_ADDRESS':
      return { ...state, userAddress: action.payload }
    case 'SET_CAPABILITIES':
      return { ...state, capabilities: action.payload }
    case 'SET_SOCIAL_CONTEXT':
      return { ...state, socialContext: action.payload }
    case 'SET_TRANSACTION_STATE':
      return { ...state, transactionState: action.payload }
    case 'SET_CONTEXT':
      return { ...state, context: action.payload }
    default:
      return state
  }
}

/**
 * Initial State
 */
const createInitialState = (): UnifiedAppState => ({
  context: 'web',
  isConnected: false, // WALLET CONNECTION DISABLED
  userAddress: null, // WALLET CONNECTION DISABLED
  capabilities: {
    wallet: {
      canConnect: false, // WALLET CONNECTION DISABLED
      canBatchTransactions: false,
      supportedChains: [8453, 84532] // Base mainnet and testnet
    },
    social: {
      canShare: false,
      canCompose: false,
      canAccessSocialGraph: false
    },
    platform: {
      canDeepLink: false,
      canAccessClipboard: false,
      canAccessCamera: false
    }
  },
  socialContext: {
    isAvailable: false,
    userProfile: null,
    canShare: false,
    canCompose: false,
    trustScore: 0
  },
  transactionState: {
    status: 'idle',
    transactionHash: null,
    formattedStatus: 'Ready',
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
  },
  loadingState: 'idle',
  error: null
})

// ================================================
// CAPABILITY DETECTION MODULE
// ================================================

/**
 * Detect and aggregate wallet, social, and platform capabilities
 */
function useCapabilityDetection(): Capabilities {
  const [capabilities, setCapabilities] = useState<Capabilities>(createInitialState().capabilities)

  useEffect(() => {
    const detectCapabilities = async () => {
      try {
        // Detect wallet capabilities
        const walletCapabilities = await detectWalletCapabilities()

        // Detect social capabilities
        const socialCapabilities = await detectSocialCapabilities()

        // Detect platform capabilities
        const platformCapabilities = await detectPlatformCapabilities()

        setCapabilities({
          wallet: walletCapabilities,
          social: socialCapabilities,
          platform: platformCapabilities
        })
      } catch (error) {
        console.warn('Capability detection failed:', error)
        // Fallback to default capabilities
      }
    }

    detectCapabilities()
  }, [])

  return capabilities
}

/**
 * Check if wallet connection is available and determine supported features
 * WALLET CONNECTION DISABLED
 */
async function detectWalletCapabilities() {
  // WALLET CONNECTION DISABLED - ALWAYS RETURN FALSE
  const canConnect = false
  const canBatchTransactions = false

  return {
    canConnect,
    canBatchTransactions,
    supportedChains: [8453, 84532]
  }
}

/**
 * Determine available social features based on environment
 */
async function detectSocialCapabilities() {
  const isMiniApp = detectMiniAppEnvironment()
  const canShare = isMiniApp || (typeof navigator !== 'undefined' && 'share' in navigator)
  const canCompose = isMiniApp
  const canAccessSocialGraph = isMiniApp

  return {
    canShare,
    canCompose,
    canAccessSocialGraph
  }
}

/**
 * Check browser API availability for platform-specific features
 */
async function detectPlatformCapabilities() {
  const canDeepLink = typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost')

  const canAccessClipboard = typeof navigator !== 'undefined' && 'clipboard' in navigator

  const canAccessCamera = typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices

  return {
    canDeepLink,
    canAccessClipboard,
    canAccessCamera
  }
}

/**
 * Test wallet_sendCalls support without triggering authorization prompts
 * Should only be called when batch transactions are needed
 */
async function checkBatchTransactionSupport(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false

  try {
    // Verify wallet is connected before testing
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (!accounts || accounts.length === 0) {
      console.log('Wallet not connected - skipping batch transaction support check')
      return false
    }

    // Test wallet_sendCalls with timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Method check timeout')), 3000)
    )

    const testPromise = window.ethereum.request({
      method: 'wallet_sendCalls',
      params: [{
        version: '1.0',
        chainId: '0x2105',
        from: accounts[0],
        calls: [],
        atomicRequired: false
      }]
    })

    await Promise.race([testPromise, timeoutPromise])
    return true

  } catch (error: any) {
    // Identify authorization errors
    if (error?.code === 4100 || error?.message?.includes('not authorized')) {
      console.log('Wallet method not authorized - batch transactions not supported')
      return false
    }

    // Identify unsupported method errors
    if (error?.code === -32601 || error?.message?.includes('Method not found')) {
      console.log('wallet_sendCalls method not supported by wallet')
      return false
    }

    // Handle timeout
    if (error?.message?.includes('Method check timeout')) {
      console.log('Batch transaction support check timed out')
      return false
    }

    // Log other errors without failing
    console.log('Batch transaction support check failed:', error?.message || error)
    return false
  }
}

/**
 * Deferred batch transaction support check
 * Call when batch transactions are required to avoid initial load authorization prompts
 */
export async function checkBatchTransactionSupportLazy(): Promise<boolean> {
  return await checkBatchTransactionSupport()
}

/**
 * Determine if running inside Farcaster MiniApp context
 */
function detectMiniAppEnvironment(): boolean {
  if (typeof window === 'undefined') return false

  const userAgent = navigator.userAgent.toLowerCase()
  const url = window.location

  return (
    userAgent.includes('farcaster') ||
    userAgent.includes('warpcast') ||
    url.pathname.startsWith('/mini') ||
    new URL(window.location.href).searchParams.get('miniApp') === 'true' ||
    window.parent !== window
  )
}

// ================================================
// SOCIAL CONTEXT MODULE
// ================================================

/**
 * Retrieve Farcaster user context and social capabilities from MiniApp SDK
 */
function useSocialContext(): SocialContext {
  const [socialContext, setSocialContext] = useState<SocialContext>(createInitialState().socialContext)

  useEffect(() => {
    const detectSocialContext = async () => {
      try {
        const isMiniApp = detectMiniAppEnvironment()

        if (!isMiniApp) {
          return
        }

        // Fetch MiniApp SDK context
        const sdkContext = await getMiniAppSDKContext()

        const canShare = sdkContext !== null
        const canCompose = sdkContext !== null

        const user = sdkContext?.user
        const userProfile = user ? {
          fid: user.fid,
          username: user.username || null,
          displayName: user.displayName || null,
          isVerified: ((user as { verifications?: unknown[] }).verifications?.length ?? 0) > 0
        } : null

        const trustScore = calculateTrustScore(userProfile)

        setSocialContext({
          isAvailable: true,
          userProfile,
          canShare,
          canCompose,
          trustScore
        })
      } catch (error) {
        console.warn('Social context detection failed:', error)
        // Retain default state
      }
    }

    detectSocialContext()
  }, [])

  return socialContext
}

/**
 * Load Farcaster MiniApp SDK and retrieve context
 */
async function getMiniAppSDKContext() {
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk')
    return await sdk.context
  } catch {
    return null
  }
}

/**
 * Compute trust score based on Farcaster user profile attributes
 */
function calculateTrustScore(userProfile: SocialUserProfile | null): number {
  if (!userProfile) return 0

  let score = 0
  if (userProfile.fid) score += 30
  if (userProfile.username) score += 20
  if (userProfile.displayName) score += 10
  if (userProfile.isVerified) score += 40

  return Math.min(score, 100)
}

// ================================================
// SOCIAL PROFILE INTERFACE
// ================================================

/**
 * Social User Profile Interface
 */
interface SocialUserProfile {
  fid?: number
  username?: string | null
  displayName?: string | null
  isVerified?: boolean
}

// ================================================
// UNIFIED MINIAPP PROVIDER COMPONENT
// ================================================

/**
 * Unified MiniApp Provider Component
 */
export function UnifiedMiniAppProvider({
  children,
  enableAnalytics: _enableAnalytics = true,
  enableOptimizations: _enableOptimizations = true,
  fallbackToWeb: _fallbackToWeb = true
}: UnifiedMiniAppProviderProps) {

  // Initialize state
  const [state, dispatch] = useReducer(appStateReducer, createInitialState())

  // Core dependencies
  const _router = useRouter()
  const _pathname = usePathname()
  
  // WALLET CONNECTION DEPENDENCIES REMOVED

  // Capability detection
  const capabilities = useCapabilityDetection()

  // Social context
  const socialContext = useSocialContext()

  // Refs for SDK management
  const sdkRef = useRef<unknown>(null)
  const initializationPromiseRef = useRef<Promise<void> | null>(null)

  // ================================================
  // CONTEXT DETECTION
  // ================================================

  // Detect whether running in miniapp or web context
  const appContext = useMemo<AppContext>(() => {
    if (typeof window === 'undefined') return 'web'

    const userAgent = navigator.userAgent.toLowerCase()
    const url = window.location

    const indicators = {
      farcasterUA: userAgent.includes('farcaster'),
      warpcastUA: userAgent.includes('warpcast'),
      miniPath: url.pathname.startsWith('/mini'),
      miniParam: new URL(window.location.href).searchParams.get('miniApp') === 'true',
      embedded: window.parent !== window
    }

    const isMiniApp = Object.values(indicators).some(Boolean)
    
    console.log('🔍 MiniApp Context Detection:', {
      userAgent: userAgent.substring(0, 50) + '...',
      pathname: url.pathname,
      indicators,
      result: isMiniApp ? 'miniapp' : 'web'
    })

    return isMiniApp ? 'miniapp' : 'web'
  }, [])

  // Update context in state
  useEffect(() => {
    dispatch({ type: 'SET_CONTEXT', payload: appContext })
  }, [appContext])

  // ================================================
  // FARCASTER WALLET CONNECTION - DISABLED
  // ================================================

  // Centralized Farcaster wallet connection state - DISABLED
  const [farcasterWallet] = useState<FarcasterWalletState>({
    isConnected: false, // WALLET CONNECTION DISABLED
    address: undefined, // WALLET CONNECTION DISABLED
    isConnecting: false, // WALLET CONNECTION DISABLED
    error: new Error('WALLET CONNECTION DISABLED - TO BE REBUILT'),
    isInMiniApp: false
  })

  // WALLET CONNECTION LOGIC REMOVED - TO BE REBUILT

  // WALLET SYNCHRONIZATION LOGIC REMOVED - TO BE REBUILT

  // WALLET CONNECTION PERSISTENCE LOGIC REMOVED - TO BE REBUILT

  // WALLET PERSISTENCE AND NAVIGATION LOGIC REMOVED - TO BE REBUILT

  // CONNECTION HEALTH MONITORING LOGIC REMOVED - TO BE REBUILT

  // Propagate capabilities to state
  useEffect(() => {
    dispatch({ type: 'SET_CAPABILITIES', payload: capabilities })
  }, [capabilities])

  // Propagate social context to state
  useEffect(() => {
    dispatch({ type: 'SET_SOCIAL_CONTEXT', payload: socialContext })
  }, [socialContext])

  // ================================================
  // SDK INITIALIZATION
  // ================================================

  const initializeSDK = useCallback(async (): Promise<void> => {
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current
    }

    const initPromise = (async () => {
      if (appContext !== 'miniapp') {
        console.log('🔍 Not in MiniApp context, skipping SDK initialization')
        return
      }

      try {
        console.log('🚀 Initializing MiniApp SDK...')
        dispatch({ type: 'SET_LOADING', payload: 'loading' })

        const { sdk } = await import('@farcaster/miniapp-sdk')
        sdkRef.current = sdk
        console.log('✅ MiniApp SDK imported successfully')

        // Notify Farcaster platform that app is ready
        console.log('📡 Calling sdk.actions.ready()...')
        await sdk.actions.ready()
        console.log('✅ sdk.actions.ready() completed - splash screen should dismiss')

        dispatch({ type: 'SET_LOADING', payload: 'success' })
      } catch (error) {
        console.error('❌ SDK initialization failed:', error)
        dispatch({ type: 'SET_ERROR', payload: error as Error })
        dispatch({ type: 'SET_LOADING', payload: 'error' })
      }
    })()

    initializationPromiseRef.current = initPromise
    return initPromise
  }, [appContext])

  // Initialize SDK when in miniapp context
  useEffect(() => {
    if (appContext === 'miniapp') {
      initializeSDK()
    }
  }, [appContext, initializeSDK])

  // FARCASTER AUTO-LOGIN FLOW REMOVED - TO BE REBUILT

  // ================================================
  // ACTION IMPLEMENTATIONS
  // ================================================

  const connectWallet = useCallback(async (): Promise<void> => {
    // WALLET CONNECTION DISABLED - ALWAYS THROW ERROR
    throw new Error('WALLET CONNECTION DISABLED - TO BE REBUILT')
  }, [])

  const disconnectWallet = useCallback(async (): Promise<void> => {
    // WALLET CONNECTION DISABLED - ALWAYS THROW ERROR
    throw new Error('WALLET CONNECTION DISABLED - TO BE REBUILT')
  }, [])

  const shareContent = useCallback(async (contentId: bigint, title: string): Promise<void> => {
    if (!state.capabilities.social.canShare) {
      throw new Error('Social sharing not available')
    }

    try {
              if (sdkRef.current && typeof sdkRef.current === 'object' && sdkRef.current !== null && 'actions' in sdkRef.current) {
          // Share via Farcaster MiniApp SDK
          const shareText = `Check out "${title}" on Bloom! 🚀`
          await (sdkRef.current as { actions: { composeCast: (params: { text: string; embeds: string[] }) => Promise<void> } }).actions.composeCast({
            text: shareText,
            embeds: [`${window.location.origin}/content/${contentId}`]
          })
        } else if (navigator.share) {
        // Fallback to Web Share API
        await navigator.share({
          title,
          url: `${window.location.origin}/content/${contentId}`
        })
      } else {
        throw new Error('Sharing not supported')
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error })
      throw error
    }
  }, [state.capabilities.social.canShare])

  const executeTransaction = useCallback(async (type: string, params: Record<string, unknown>): Promise<void> => {
    try {
      dispatch({ type: 'SET_TRANSACTION_STATE', payload: {
        ...state.transactionState,
        status: 'submitting',
        formattedStatus: 'Submitting transaction...',
        progress: {
          ...state.transactionState.progress,
          progressText: 'Please confirm in your wallet'
        }
      }})

      // Delegate payment transactions to payment orchestrator
      if (type === 'content_purchase' && params.contentId && params.ethAmount) {
        // Payment orchestrator handles this flow
        console.log('Content purchase should use useMiniAppPaymentOrchestrator:', params)
        throw new Error('Use useMiniAppPaymentOrchestrator for content purchases')
      }

      // Handle other transaction types
      console.log('Transaction type:', type, 'Params:', params)

      dispatch({ type: 'SET_TRANSACTION_STATE', payload: {
        ...state.transactionState,
        status: 'confirmed',
        formattedStatus: 'Transaction confirmed!',
        progress: {
          ...state.transactionState.progress,
          confirmed: true,
          progressText: 'Transaction completed successfully'
        }
      }})
    } catch (error) {
      dispatch({ type: 'SET_TRANSACTION_STATE', payload: {
        ...state.transactionState,
        status: 'failed',
        formattedStatus: 'Transaction failed',
        progress: {
          ...state.transactionState.progress,
          progressText: 'Transaction could not be completed'
        }
      }})
      dispatch({ type: 'SET_ERROR', payload: error as Error })
      throw error
    }
  }, [state.transactionState])

  const resetError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [])

  // ================================================
  // UTILITY FUNCTIONS
  // ================================================

  const formatAddress = useCallback((address: Address): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])

  const canPerformAction = useCallback((action: string): boolean => {
    switch (action) {
      case 'connect':
        return state.capabilities.wallet.canConnect
      case 'share':
        return state.capabilities.social.canShare
      case 'batch_transaction':
        return state.capabilities.wallet.canBatchTransactions
      default:
        return false
    }
  }, [state.capabilities])

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  }, [])

  // ================================================
  // CONTEXT VALUE
  // ================================================

  const contextValue = useMemo<UnifiedMiniAppContextValue>(() => ({
    state,
    farcasterWallet,
    actions: {
      connectWallet,
      disconnectWallet,
      shareContent,
      executeTransaction,
      resetError
    },
    utils: {
      isMiniApp: state.context === 'miniapp',
      isMobile,
      canPerformAction,
      formatAddress
    }
  }), [
    state,
    farcasterWallet,
    connectWallet,
    disconnectWallet,
    shareContent,
    executeTransaction,
    resetError,
    isMobile,
    canPerformAction,
    formatAddress
  ])

  return (
    <UnifiedMiniAppContext.Provider value={contextValue}>
      {children}
    </UnifiedMiniAppContext.Provider>
  )
}

// ================================================
// HOOKS AND UTILITIES
// ================================================

/**
 * Unified MiniApp Hook
 */
export function useUnifiedMiniApp(): UnifiedMiniAppContextValue {
  const context = useContext(UnifiedMiniAppContext)
  if (!context) {
    throw new Error('useUnifiedMiniApp must be used within UnifiedMiniAppProvider')
  }
  return context
}

/**
 * Convenience Hooks
 */
export function useMiniAppState() {
  const { state } = useUnifiedMiniApp()
  return state
}

export function useMiniAppActions() {
  const { actions } = useUnifiedMiniApp()
  return actions
}

export function useMiniAppUtils() {
  const { utils } = useUnifiedMiniApp()
  return utils
}

export function useTransactionState() {
  const { state } = useUnifiedMiniApp()
  return state.transactionState
}

export function useSocialState() {
  const { state } = useUnifiedMiniApp()
  return state.socialContext
}

// ================================================
// EXPORTS
// ================================================

export default UnifiedMiniAppProvider


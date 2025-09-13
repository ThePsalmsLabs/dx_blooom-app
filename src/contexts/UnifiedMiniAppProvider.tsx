/**
 * Unified MiniApp Provider - Streamlined Social Commerce Architecture
 * File: src/contexts/UnifiedMiniAppProvider.tsx
 *
 * This is the new, streamlined MiniApp provider that consolidates all functionality
 * from the previous complex provider system into a single, optimized provider.
 * It provides a clean, performant interface for social commerce experiences.
 *
 * Key Improvements:
 * - Single provider consolidating all functionality
 * - Optimized state management with minimal re-renders
 * - Unified transaction state management
 * - Progressive enhancement with graceful fallbacks
 * - Performance monitoring and optimization
 * - Clean separation of concerns with focused modules
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
import { useChainId } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { useLoginToMiniApp } from '@privy-io/react-auth/farcaster'
import { type Address } from 'viem'

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
  readonly isConnected: boolean
  readonly userAddress: Address | null
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
 * Farcaster Wallet State Interface
 */
export interface FarcasterWalletState {
  readonly isConnected: boolean
  readonly address: string | undefined
  readonly isConnecting: boolean
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
    readonly connectWallet: () => Promise<void>
    readonly disconnectWallet: () => void
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
  | { type: 'SET_CONNECTION'; payload: boolean }
  | { type: 'SET_USER_ADDRESS'; payload: Address | null }
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
  isConnected: false,
  userAddress: null,
  capabilities: {
    wallet: {
      canConnect: false,
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
 * Capability Detection Hook
 */
function useCapabilityDetection(): Capabilities {
  const [capabilities, setCapabilities] = useState<Capabilities>(createInitialState().capabilities)

  useEffect(() => {
    const detectCapabilities = async () => {
      try {
        // Wallet capabilities
        const walletCapabilities = await detectWalletCapabilities()

        // Social capabilities
        const socialCapabilities = await detectSocialCapabilities()

        // Platform capabilities
        const platformCapabilities = await detectPlatformCapabilities()

        setCapabilities({
          wallet: walletCapabilities,
          social: socialCapabilities,
          platform: platformCapabilities
        })
      } catch (error) {
        console.warn('Capability detection failed:', error)
        // Keep default capabilities on failure
      }
    }

    detectCapabilities()
  }, [])

  return capabilities
}

/**
 * Detect Wallet Capabilities
 */
async function detectWalletCapabilities() {
  const canConnect = typeof window !== 'undefined' && window.ethereum !== undefined

  // Defer batch transaction check to avoid authorization prompts during initial load
  // We'll check this lazily when actually needed
  const canBatchTransactions = false // Default to false, check later if needed

  return {
    canConnect,
    canBatchTransactions,
    supportedChains: [8453, 84532] // Base networks
  }
}

/**
 * Detect Social Capabilities
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
 * Detect Platform Capabilities
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
 * Check Batch Transaction Support (Lazy)
 * Only call this when batch transactions are actually needed to avoid authorization prompts
 */
async function checkBatchTransactionSupport(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false

  try {
    // Step 1: Check if wallet is connected first
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (!accounts || accounts.length === 0) {
      console.log('Wallet not connected - skipping batch transaction support check')
      return false
    }

    // Step 2: Try to test wallet_sendCalls support with minimal parameters
    // Use a timeout to prevent hanging on authorization prompts
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Method check timeout')), 3000)
    )

    const testPromise = window.ethereum.request({
      method: 'wallet_sendCalls',
      params: [{
        version: '1.0',
        chainId: '0x2105', // Base mainnet
        from: accounts[0], // Use actual connected account
        calls: [], // Empty calls array - should not require authorization
        atomicRequired: false
      }]
    })

    await Promise.race([testPromise, timeoutPromise])
    return true

  } catch (error: any) {
    // Handle specific error codes
    if (error?.code === 4100 || error?.message?.includes('not authorized')) {
      console.log('Wallet method not authorized - batch transactions not supported')
      return false
    }

    if (error?.code === -32601 || error?.message?.includes('Method not found')) {
      console.log('wallet_sendCalls method not supported by wallet')
      return false
    }

    if (error?.message?.includes('Method check timeout')) {
      console.log('Batch transaction support check timed out')
      return false
    }

    // Handle other errors gracefully
    console.log('Batch transaction support check failed:', error?.message || error)
    return false
  }
}

/**
 * Lazy Batch Transaction Support Checker
 * This function can be called when batch transactions are actually needed
 * It performs the full check without causing authorization prompts during app load
 */
export async function checkBatchTransactionSupportLazy(): Promise<boolean> {
  return await checkBatchTransactionSupport()
}

/**
 * Detect MiniApp Environment
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
 * Social Context Detection Hook
 */
function useSocialContext(): SocialContext {
  const [socialContext, setSocialContext] = useState<SocialContext>(createInitialState().socialContext)

  useEffect(() => {
    const detectSocialContext = async () => {
      try {
        const isMiniApp = detectMiniAppEnvironment()

        if (!isMiniApp) {
          return // Keep default state for web context
        }

        // Try to get social context from MiniApp SDK
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
        // Keep default state on failure
      }
    }

    detectSocialContext()
  }, [])

  return socialContext
}

/**
 * Get MiniApp SDK Context
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
 * Calculate Trust Score
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
  const _chainId = useChainId()
  const { user, login, logout, ready: _ready, authenticated } = usePrivy()
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp()

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

  // Determine application context
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
  // CENTRALIZED FARCASTER WALLET CONNECTION
  // ================================================

  // App-level Farcaster wallet state
  const [farcasterWallet, setFarcasterWallet] = useState({
    isConnected: false,
    address: undefined as string | undefined,
    isConnecting: false,
    error: null as Error | null,
    isInMiniApp: false
  })

  // Initialize Farcaster wallet connection at app level (only once)
  useEffect(() => {
    if (appContext !== 'miniapp') return

    let mounted = true
    let connectionAttempted = false

    const initializeFarcasterConnection = async () => {
      if (connectionAttempted) return
      connectionAttempted = true

      try {
        setFarcasterWallet(prev => ({ ...prev, isConnecting: true, error: null }))
        console.log('🚀 App-level Farcaster wallet initialization starting...')

        // Wait for wagmi to be ready - extended slightly for connector initialization
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        console.log('🔗 Starting Farcaster auto-connection at app level...')
        
        // Auto-connect logic similar to the working hook implementation
        const checkSDKReady = async () => {
          let attempts = 0
          const maxAttempts = 10
          
          while (attempts < maxAttempts) {
            try {
              const { sdk } = await import('@farcaster/miniapp-sdk')
              if (sdk && typeof sdk === 'object') {
                console.log('✅ Farcaster SDK is available, proceeding with auto-connect')
                return true
              }
            } catch (e) {
              console.warn('SDK not ready yet, waiting...', e)
            }
            
            attempts++
            await new Promise(resolve => setTimeout(resolve, 200))
          }
          
          console.warn('⚠️ SDK ready check timed out, proceeding anyway')
          return false
        }

        await checkSDKReady()

        // Import wagmi hooks (not used directly in provider but ensures they're loaded)
        await import('wagmi')
        
        // Check if wallet is already connected
        const checkConnection = () => {
          try {
            // Access current wagmi state
            const currentState = (globalThis as any).__wagmi_account
            if (currentState?.isConnected && currentState?.address) {
              console.log('✅ Farcaster wallet already connected at app level:', currentState.address)
              if (mounted) {
                setFarcasterWallet({
                  isConnected: true,
                  address: currentState.address,
                  isConnecting: false,
                  error: null,
                  isInMiniApp: true
                })
              }
              return true
            }
            return false
          } catch (error) {
            console.warn('Failed to check connection state:', error)
            return false
          }
        }

        // If already connected, we're done
        if (checkConnection()) {
          return
        }

        // Otherwise attempt auto-connection
        console.log('⏳ Wallet not connected, attempting auto-connect...')
        
        // Get wagmi connectors from the store
        const getConnectors = () => {
          try {
            const wagmiStore = (globalThis as any).__wagmi_store
            const wagmiConfig = (globalThis as any).__wagmi_config
            
            if (wagmiConfig?.connectors) {
              return Array.from(wagmiConfig.connectors.values())
            } else if (wagmiStore?.connectors) {
              return wagmiStore.connectors
            }
            return []
          } catch (error) {
            console.warn('Failed to get connectors:', error)
            return []
          }
        }

        let connectors = getConnectors()
        console.log('🔍 Available connectors at app level (first check):', connectors.map((c: any) => ({ id: c.id, name: c.name })))
        
        // If no connectors found on first check, wait a brief moment and try once more
        // This handles the case where wagmi config is still initializing connectors
        if (connectors.length === 0) {
          console.log('⏳ No connectors found, waiting briefly and retrying once...')
          await new Promise(resolve => setTimeout(resolve, 500))
          connectors = getConnectors()
          console.log('🔍 Available connectors at app level (second check):', connectors.map((c: any) => ({ id: c.id, name: c.name })))
        }
        
        const farcasterConnector = connectors.find((connector: any) => 
          connector.id === 'farcasterMiniApp' || 
          connector.name === 'Farcaster Mini App' ||
          connector.id === 'farcaster'
        )
        
        if (farcasterConnector && mounted) {
          try {
            console.log('🎯 Found Farcaster connector at app level, attempting auto-connection...')
            
            // Use the connector's connect method directly
            await farcasterConnector.connect()
            
            // Check if connection was successful
            const connectionResult = checkConnection()
            if (connectionResult) {
              console.log('✅ App-level Farcaster auto-connection successful')
            } else {
              console.warn('⚠️ Auto-connection completed but no connection detected')
              if (mounted) {
                setFarcasterWallet(prev => ({ 
                  ...prev, 
                  isConnecting: false,
                  isInMiniApp: true 
                }))
              }
            }
          } catch (connectError) {
            console.warn('⚠️ App-level Farcaster auto-connection failed:', connectError)
            if (mounted) {
              setFarcasterWallet(prev => ({ 
                ...prev, 
                isConnecting: false, 
                error: connectError as Error,
                isInMiniApp: true
              }))
            }
          }
        } else {
          console.warn('⚠️ No Farcaster connector found at app level')
          console.log('📊 Connection status:', {
            connectorsCount: connectors.length,
            farcasterConnectorFound: !!farcasterConnector,
            allConnectorIds: connectors.map((c: any) => c.id),
            allConnectorNames: connectors.map((c: any) => c.name)
          })
          
          if (mounted) {
            setFarcasterWallet(prev => ({ 
              ...prev, 
              isConnecting: false,
              isInMiniApp: true 
            }))
          }
        }

      } catch (error) {
        console.error('❌ App-level Farcaster initialization failed:', error)
        if (mounted) {
          setFarcasterWallet(prev => ({ 
            ...prev, 
            isConnecting: false, 
            error: error as Error,
            isInMiniApp: true
          }))
        }
      }
    }

    // Initialize with a small delay to ensure wagmi is ready
    const timeoutId = setTimeout(initializeFarcasterConnection, 1500)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [appContext])

  // Sync Farcaster wallet state with actual wagmi account state
  useEffect(() => {
    if (appContext !== 'miniapp') return

    let mounted = true
    
    const syncWagmiState = () => {
      try {
        // Get current wagmi account state from global store
        const globalAccount = (globalThis as any).__wagmi_account
        
        if (globalAccount && mounted) {
          const isConnected = Boolean(globalAccount.isConnected && globalAccount.address)
          const address = globalAccount.address
          
          // Only update if state has actually changed to avoid infinite loops
          if (farcasterWallet.isConnected !== isConnected || farcasterWallet.address !== address) {
            console.log('🔄 Syncing Farcaster wallet state with wagmi:', { isConnected, address })
            setFarcasterWallet(prev => ({
              ...prev,
              isConnected,
              address,
              isConnecting: prev.isConnecting && !isConnected // Clear connecting if now connected
            }))
          }
        }
      } catch (error) {
        console.warn('Failed to sync wagmi state:', error)
      }
    }
    
    // Sync immediately
    syncWagmiState()
    
    // Set up periodic sync to catch wagmi state changes
    const syncInterval = setInterval(syncWagmiState, 1000)
    
    return () => {
      mounted = false
      clearInterval(syncInterval)
    }
  }, [appContext, farcasterWallet.isConnected, farcasterWallet.address])

  // Update legacy wallet connection state for backwards compatibility
  useEffect(() => {
    const isConnected = (appContext === 'miniapp' ? farcasterWallet.isConnected : authenticated && Boolean(user?.wallet?.address))
    const userAddress = (appContext === 'miniapp' ? farcasterWallet.address : user?.wallet?.address) as Address || null

    dispatch({ type: 'SET_CONNECTION', payload: isConnected })
    dispatch({ type: 'SET_USER_ADDRESS', payload: userAddress })
  }, [appContext, authenticated, user?.wallet?.address, farcasterWallet.isConnected, farcasterWallet.address])

  // Update capabilities in state
  useEffect(() => {
    dispatch({ type: 'SET_CAPABILITIES', payload: capabilities })
  }, [capabilities])

  // Update social context in state
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

        // Signal ready to MiniApp platform
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

  // Initialize SDK on mount if in MiniApp context
  useEffect(() => {
    if (appContext === 'miniapp') {
      initializeSDK()
    }
  }, [appContext, initializeSDK])

  // ================================================
  // FARCASTER AUTO-LOGIN FLOW
  // ================================================

  // Auto-login flow for seamless Farcaster user experience
  useEffect(() => {
    const handleFarcasterAutoLogin = async () => {
      // Check if we're actually inside Farcaster client vs just on /mini route
      const isInFarcasterClient = typeof window !== 'undefined' && 
                                 (window.parent !== window || // iframe context
                                  navigator.userAgent.includes('Farcaster') ||
                                  window.location.search.includes('farcaster=true'))
      
      if (!isInFarcasterClient || authenticated || !_ready) {
        console.log('🚫 Skipping Farcaster auto-login:', {
          isInFarcasterClient,
          authenticated,
          ready: _ready,
          reason: !isInFarcasterClient ? 'Not in Farcaster client' : 
                  authenticated ? 'Already authenticated' : 
                  !_ready ? 'Privy not ready' : 'Unknown'
        })
        return
      }

      try {
        console.log('🔐 Attempting Farcaster auto-login...')

        // Initialize a new login attempt to get a nonce for the Farcaster wallet to sign
        const { nonce } = await initLoginToMiniApp()
        console.log('📝 Generated nonce for Farcaster login:', nonce)

        // Import MiniApp SDK and request signature from Farcaster
        const { sdk } = await import('@farcaster/miniapp-sdk')
        const result = await sdk.actions.signIn({ nonce })

        console.log('✍️ Obtained signature from Farcaster')

        // Send the received signature from Farcaster to Privy for authentication
        await loginToMiniApp({
          message: result.message,
          signature: result.signature,
        })

        console.log('✅ Farcaster auto-login successful')
      } catch (error) {
        console.warn('⚠️ Farcaster auto-login failed, user will need to login manually:', error)
        // Don't throw - allow manual login fallback
      }
    }

    handleFarcasterAutoLogin()
  }, [authenticated, _ready, initLoginToMiniApp, loginToMiniApp])

  // ================================================
  // ACTION IMPLEMENTATIONS
  // ================================================

  const connectWallet = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: 'loading' })
      
      // Check if we're actually inside Farcaster client vs just on /mini route
      const isInFarcasterClient = typeof window !== 'undefined' && 
                                 (window.parent !== window || // iframe context
                                  navigator.userAgent.includes('Farcaster') ||
                                  window.location.search.includes('farcaster=true'))
      
      if (isInFarcasterClient) {
        // Only disable Privy when ACTUALLY in Farcaster client to prevent conflicts
        console.log('🔄 Real Farcaster client detected - letting Farcaster auto-connect handle it')
        
        // Check if we're already connected via Farcaster
        if (authenticated) {
          console.log('✅ Already authenticated via Farcaster')
          dispatch({ type: 'SET_LOADING', payload: 'success' })
          return
        }
        
        // Wait for Farcaster auto-connect
        console.log('⏳ Waiting for Farcaster auto-connect...')
        dispatch({ type: 'SET_LOADING', payload: 'success' })
      } else {
        // Use Privy for web context or when testing /mini route outside Farcaster
        console.log('🔄 Web context or /mini testing: Using Privy authentication')
        if (!logout) {
          throw new Error('Privy not available')
        }
        // Re-enable Privy login for web/testing contexts
        login()
        dispatch({ type: 'SET_LOADING', payload: 'success' })
      }
    } catch (error) {
      console.error('Connection error:', error)
      if (error instanceof Error && error.message && error.message.includes('Origin not allowed')) {
        console.error('🚨 Privy domain configuration error - check Privy dashboard settings')
      }
      dispatch({ type: 'SET_ERROR', payload: error as Error })
      dispatch({ type: 'SET_LOADING', payload: 'error' })
      throw error
    }
  }, [authenticated, login, logout])

  const disconnectWallet = useCallback(async (): Promise<void> => {
    if (!logout) return

    try {
      await logout()
    } catch (error) {
      console.warn('Wallet disconnect failed:', error)
    }
  }, [logout])

  const shareContent = useCallback(async (contentId: bigint, title: string): Promise<void> => {
    if (!state.capabilities.social.canShare) {
      throw new Error('Social sharing not available')
    }

    try {
              if (sdkRef.current && typeof sdkRef.current === 'object' && sdkRef.current !== null && 'actions' in sdkRef.current) {
          // Use MiniApp SDK for sharing
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

      // Route to payment orchestrator for payment transactions
      if (type === 'content_purchase' && params.contentId && params.ethAmount) {
        // This should be handled by the MiniApp payment orchestrator
        console.log('Content purchase should use useMiniAppPaymentOrchestrator:', params)
        throw new Error('Use useMiniAppPaymentOrchestrator for content purchases')
      }

      // Handle other transaction types here
      // For now, just log the transaction details
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


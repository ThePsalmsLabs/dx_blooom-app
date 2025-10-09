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
 * - Auto-reconnect on navigation and page refresh
 * - localStorage-based wallet connection persistence
 * - Connection health monitoring and automatic recovery
 * - Navigation lifecycle protection
 * - Page visibility API integration
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

// Import connection persistence utilities
import {
  saveConnectionState,
  getConnectionState,
  shouldBeConnected,
  clearConnectionState,
  recordDisconnection,
  saveNavigationSnapshot,
  getNavigationSnapshot,
  clearNavigationSnapshot,
  refreshConnectionTimestamp,
  migrateOldConnectionState,
} from '@/lib/wallet/connection-persistence'

// Import centralized wallet state manager
import { WalletStateManager } from '@/lib/wallet/WalletStateManager'

// Import type-safe wagmi global accessors
import {
  getWagmiAccount,
  getWagmiConfig,
  getWagmiConnectors,
  getWagmiConnectionStatus,
  isWagmiInitialized,
} from '@/types/wagmi-globals'

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
 */
async function detectWalletCapabilities() {
  const canConnect = typeof window !== 'undefined' && window.ethereum !== undefined

  // Batch transactions checked lazily to avoid triggering wallet authorization prompts
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
  // FARCASTER WALLET CONNECTION
  // ================================================

  // Centralized Farcaster wallet connection state
  const [farcasterWallet, setFarcasterWallet] = useState({
    isConnected: false,
    address: undefined as string | undefined,
    isConnecting: false,
    error: null as Error | null,
    isInMiniApp: false
  })

  // Initialize Farcaster wallet connection once on mount
  useEffect(() => {
    if (appContext !== 'miniapp') return

    let mounted = true
    let connectionAttempted = false

    const initializeFarcasterConnection = async () => {
      if (connectionAttempted) return
      connectionAttempted = true

      try {
        setFarcasterWallet(prev => ({ ...prev, isConnecting: true, error: null }))
        
        // Update centralized state manager
        WalletStateManager.updateConnecting(true, 'auto')
        
        console.log('🚀 Farcaster wallet initialization starting...')

        // Delay to allow wagmi connector initialization
        await new Promise(resolve => setTimeout(resolve, 300))
        
        console.log('🔗 Starting Farcaster auto-connection...')
        
        // Poll for SDK availability
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

        // Preload wagmi module
        await import('wagmi')
        
        // Verify existing wallet connection
        const checkConnection = () => {
          try {
            // Read current wagmi account state
            const currentState = getWagmiAccount()
            if (currentState?.isConnected && currentState?.address) {
              console.log('✅ Farcaster wallet already connected:', currentState.address)
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

        // Skip auto-connection if already connected
        if (checkConnection()) {
          return
        }

        // Attempt auto-connection
        console.log('⏳ Wallet not connected, attempting auto-connect...')
        
        // Retrieve wagmi connectors
        let connectors = getWagmiConnectors()
        console.log('🔍 Available connectors (first check):', connectors.map(c => ({ id: c.id, name: c.name })))
        
        // Retry connector retrieval if empty (wagmi may still be initializing)
        if (connectors.length === 0) {
          console.log('⏳ No connectors found, waiting briefly and retrying once...')
          await new Promise(resolve => setTimeout(resolve, 500))
          connectors = getWagmiConnectors()
          console.log('🔍 Available connectors (second check):', connectors.map(c => ({ id: c.id, name: c.name })))
        }
        
        const farcasterConnector = connectors.find(connector => 
          connector.id === 'farcasterMiniApp' || 
          connector.name === 'Farcaster Mini App' ||
          connector.id === 'farcaster'
        )
        
        if (farcasterConnector && mounted) {
          try {
            console.log('🎯 Found Farcaster connector, attempting auto-connection...')
            
            // Invoke connector's connect method
            await (farcasterConnector as any).connect()
            
            // Verify connection succeeded
            const connectionResult = checkConnection()
            if (connectionResult) {
              console.log('✅ Farcaster auto-connection successful')
              
              // Update centralized state manager
              const globalAccount = getWagmiAccount()
              if (globalAccount?.address && globalAccount?.chainId) {
                WalletStateManager.updateConnection(
                  globalAccount.address,
                  globalAccount.chainId,
                  'farcasterMiniApp',
                  'auto'
                )
              }
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
            console.warn('⚠️ Farcaster auto-connection failed:', connectError)
            
            // Update centralized state manager with error
            WalletStateManager.updateError(connectError as Error, 'auto')
            
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
          console.warn('⚠️ No Farcaster connector found')
          console.log('📊 Connection status:', {
            connectorsCount: connectors.length,
            farcasterConnectorFound: !!farcasterConnector,
            allConnectorIds: connectors.map(c => c.id),
            allConnectorNames: connectors.map(c => c.name)
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
        console.error('❌ Farcaster initialization failed:', error)
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

    // Delay initialization to ensure wagmi is ready
    const timeoutId = setTimeout(initializeFarcasterConnection, 300)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [appContext])

  // Synchronize local wallet state with wagmi global state AND WalletStateManager
  useEffect(() => {
    if (appContext !== 'miniapp') return

    let mounted = true
    
    const syncWagmiState = () => {
      try {
        // Read current wagmi account state
        const globalAccount = getWagmiAccount()
        
        if (globalAccount && mounted) {
          const isConnected = Boolean(globalAccount.isConnected && globalAccount.address)
          const address = globalAccount.address
          
          // Update only when state differs to prevent render loops
          if (farcasterWallet.isConnected !== isConnected || farcasterWallet.address !== address) {
            console.log('🔄 Syncing Farcaster wallet state with wagmi:', { isConnected, address })
            
            // Update local state
            setFarcasterWallet(prev => ({
              ...prev,
              isConnected,
              address,
              isConnecting: prev.isConnecting && !isConnected
            }))
            
            // CRITICAL: Update WalletStateManager with wagmi changes
            if (isConnected && address) {
              WalletStateManager.updateConnection(
                address,
                globalAccount.chainId || 8453,
                'farcasterMiniApp',
                'auto'
              )
            } else if (!isConnected && farcasterWallet.isConnected) {
              WalletStateManager.updateDisconnection('auto')
            }
          }
        }
      } catch (error) {
        console.warn('Failed to sync wagmi state:', error)
        WalletStateManager.updateError(error as Error, 'system')
      }
    }
    
    // Initial sync
    syncWagmiState()
    
    // Poll for state changes every second (will be replaced by wagmi listener in future)
    const syncInterval = setInterval(syncWagmiState, 1000)
    
    return () => {
      mounted = false
      clearInterval(syncInterval)
    }
  }, [appContext, farcasterWallet.isConnected, farcasterWallet.address])

  // ================================================
  // WALLET CONNECTION PERSISTENCE
  // ================================================

  // Migrate old connection state formats to current schema on initial mount
  useEffect(() => {
    migrateOldConnectionState()
  }, [])

  // Monitor connection state and trigger automatic reconnection when state mismatch detected
  useEffect(() => {
    if (appContext !== 'miniapp') return
    
    let mounted = true
    let reconnectAttempts = 0
    const MAX_RECONNECT_ATTEMPTS = 3
    
    const checkAndReconnect = async () => {
      if (!mounted) return
      
      // Compare expected connection state from storage with actual connection status
      const expectedToBeConnected = shouldBeConnected()
      
      // Get current connection status
      const isActuallyConnected = farcasterWallet.isConnected
      const isCurrentlyConnecting = farcasterWallet.isConnecting
      
      // Detect state mismatch requiring reconnection
      if (expectedToBeConnected && !isActuallyConnected && !isCurrentlyConnecting) {
        
        // Prevent infinite reconnection loops
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.warn('⚠️ Max reconnection attempts reached, clearing stale state')
          clearConnectionState()
          reconnectAttempts = 0
          return
        }
        
        reconnectAttempts++
        console.log(`🔄 Auto-reconnect triggered (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)
        
        try {
          if (!mounted) return
          
          setFarcasterWallet(prev => ({ ...prev, isConnecting: true, error: null }))
          
          // Update centralized state manager
          WalletStateManager.updateConnecting(true, 'auto')
          
          // Retrieve available wagmi connectors
          const connectors = getWagmiConnectors()
          console.log('🔍 Available connectors for reconnection:', connectors.map(c => ({ id: c.id, name: c.name })))
          
          // Locate Farcaster connector by ID or name
          const farcasterConnector = connectors.find(connector => 
            connector.id === 'farcasterMiniApp' || 
            connector.name === 'Farcaster Mini App' ||
            connector.id === 'farcaster'
          )
          
          if (farcasterConnector && mounted) {
            console.log('🎯 Found Farcaster connector, attempting reconnection...')
            
            // Execute connector's connect method
            await (farcasterConnector as any).connect()
            
            // Verify connection established successfully
            const globalAccount = getWagmiAccount()
            if (globalAccount?.isConnected && globalAccount?.address) {
              console.log('✅ Auto-reconnection successful!')
              
              // Update centralized state manager
              WalletStateManager.updateConnection(
                globalAccount.address,
                globalAccount.chainId || 8453,
                'farcasterMiniApp',
                'auto'
              )
              
              if (mounted) {
                setFarcasterWallet({
                  isConnected: true,
                  address: globalAccount.address,
                  isConnecting: false,
                  error: null,
                  isInMiniApp: true
                })
              }
              
              reconnectAttempts = 0
            } else {
              console.warn('⚠️ Connector.connect() completed but no connection detected')
              if (mounted) {
                setFarcasterWallet(prev => ({ 
                  ...prev, 
                  isConnecting: false 
                }))
              }
            }
          } else {
            console.warn('⚠️ No Farcaster connector found for reconnection')
            if (mounted) {
              setFarcasterWallet(prev => ({ 
                ...prev, 
                isConnecting: false,
                error: new Error('Farcaster connector not found')
              }))
            }
          }
        } catch (error) {
          console.error('❌ Auto-reconnection failed:', error)
          if (mounted) {
            setFarcasterWallet(prev => ({ 
              ...prev, 
              isConnecting: false,
              error: error as Error 
            }))
          }
        }
      } else if (isActuallyConnected && reconnectAttempts > 0) {
        // Reset counter when connection restored
        reconnectAttempts = 0
      }
    }
    
    // Perform initial check after wagmi initialization delay
    const initialCheckTimeout = setTimeout(() => {
      checkAndReconnect()
    }, 1000)
    
    // Monitor connection state at 3-second intervals
    const watchdogInterval = setInterval(() => {
      checkAndReconnect()
    }, 3000)
    
    return () => {
      mounted = false
      clearTimeout(initialCheckTimeout)
      clearInterval(watchdogInterval)
    }
  }, [appContext, farcasterWallet.isConnected, farcasterWallet.isConnecting])

  // Persist wallet connection state to localStorage when connected
  useEffect(() => {
    if (appContext !== 'miniapp') return
    
    if (farcasterWallet.isConnected && farcasterWallet.address) {
      // Store connection state for future sessions
      const wagmiAccount = getWagmiAccount()
      const chainId = wagmiAccount?.chainId || 8453
      saveConnectionState(
        farcasterWallet.address,
        'farcasterMiniApp',
        chainId
      )
      
      // Update timestamp every 5 minutes to prevent expiration
      const refreshInterval = setInterval(() => {
        if (farcasterWallet.isConnected) {
          refreshConnectionTimestamp()
        }
      }, 5 * 60 * 1000)
      
      return () => clearInterval(refreshInterval)
    } else if (!farcasterWallet.isConnected && !farcasterWallet.isConnecting) {
      // Defer clearing state to allow auto-reconnect attempts
      const storedState = getConnectionState()
      if (storedState && storedState.address !== farcasterWallet.address) {
        // Address mismatch indicates intentional disconnect, auto-reconnect will handle cleanup
      }
    }
  }, [appContext, farcasterWallet.isConnected, farcasterWallet.address, farcasterWallet.isConnecting])

  // ================================================
  // NAVIGATION LIFECYCLE PROTECTION
  // ================================================

  // Track route changes to detect navigations
  const pathname = usePathname()
  const previousPathnameRef = useRef(pathname)

  // Preserve connection state across Next.js route transitions
  useEffect(() => {
    if (appContext !== 'miniapp') return
    
    // Detect route change and protect connection
    if (pathname !== previousPathnameRef.current) {
      console.log('🧭 Navigation detected:', previousPathnameRef.current, '→', pathname)
      
      // Capture current connection state before React unmounts components
      if (farcasterWallet.isConnected && farcasterWallet.address) {
        saveNavigationSnapshot(
          farcasterWallet.address,
          previousPathnameRef.current,
          pathname
        )
        
        console.log('💾 Saved connection snapshot for navigation protection')
      }
      
      // Verify connection integrity after navigation completes
      const verificationTimeout = setTimeout(() => {
        const snapshot = getNavigationSnapshot()
        
        if (snapshot) {
          const { address: expectedAddress } = snapshot
          
          // Detect connection loss during transition
          if (expectedAddress && !farcasterWallet.isConnected && !farcasterWallet.isConnecting) {
            console.warn('⚠️ Connection lost during navigation, triggering recovery')
            
            // Reset connecting state to allow reconnection
            setFarcasterWallet(prev => ({ ...prev, isConnecting: false }))
            
            // Automatic reconnection will be triggered by watchdog
          } else if (farcasterWallet.isConnected && farcasterWallet.address === expectedAddress) {
            console.log('✅ Connection survived navigation successfully')
          }
          
          // Remove snapshot after verification
          clearNavigationSnapshot()
        }
      }, 500)
      
      previousPathnameRef.current = pathname
      
      return () => clearTimeout(verificationTimeout)
    }
  }, [pathname, appContext, farcasterWallet.isConnected, farcasterWallet.address, farcasterWallet.isConnecting])

  // Restore connection when user returns to tab using Page Visibility API
  useEffect(() => {
    if (typeof document === 'undefined' || appContext !== 'miniapp') return
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page became visible, checking connection status...')
        
        // Check if reconnection is needed
        const expectedToBeConnected = shouldBeConnected()
        const isActuallyConnected = farcasterWallet.isConnected
        
        if (expectedToBeConnected && !isActuallyConnected && !farcasterWallet.isConnecting) {
          console.log('🔄 Page visible but disconnected, triggering reconnection')
          
          // Reset connecting state to enable reconnection
          setFarcasterWallet(prev => ({ ...prev, isConnecting: false }))
          
          // Queue reconnection after tab restoration
          setTimeout(() => {
            // Watchdog will handle the actual reconnection
            console.log('🎯 Visibility-triggered reconnection queued')
          }, 500)
        } else if (isActuallyConnected) {
          console.log('✅ Connection verified after page became visible')
          
          // Update timestamp to prevent expiration
          refreshConnectionTimestamp()
        }
      } else {
        console.log('🌙 Page became hidden, connection state preserved')
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Handle window focus as additional safety measure
    const handleFocus = () => {
      console.log('🎯 Page focused, verifying connection...')
      
      if (shouldBeConnected() && !farcasterWallet.isConnected) {
        // Reset state to trigger reconnection check
        setFarcasterWallet(prev => ({ ...prev, isConnecting: false }))
      }
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [appContext, farcasterWallet.isConnected, farcasterWallet.isConnecting])

  // Synchronize connection state between miniapp and web contexts for backwards compatibility
  useEffect(() => {
    const isConnected = (appContext === 'miniapp' ? farcasterWallet.isConnected : authenticated && Boolean(user?.wallet?.address))
    const userAddress = (appContext === 'miniapp' ? farcasterWallet.address : user?.wallet?.address) as Address || null

    dispatch({ type: 'SET_CONNECTION', payload: isConnected })
    dispatch({ type: 'SET_USER_ADDRESS', payload: userAddress })
  }, [appContext, authenticated, user?.wallet?.address, farcasterWallet.isConnected, farcasterWallet.address])

  // ================================================
  // CONNECTION HEALTH MONITORING
  // ================================================

  // Validate connection integrity and detect stale or unresponsive connectors
  useEffect(() => {
    if (appContext !== 'miniapp' || !farcasterWallet.isConnected) return
    
    let mounted = true
    
    const performHealthCheck = async () => {
      if (!mounted || !farcasterWallet.isConnected) return
      
      try {
        console.log('🏥 Performing connection health check...')
        
        // Verify wagmi connectors are available
        const connectors = getWagmiConnectors()
        
        if (connectors.length === 0) {
          console.warn('⚠️ Health check: No connectors available')
          // May be temporary, avoid immediate disconnection
          return
        }
        
        // Verify Farcaster connector is present
        const farcasterConnector = connectors.find(c => 
          c.id === 'farcasterMiniApp' || 
          c.name === 'Farcaster Mini App' ||
          c.id === 'farcaster'
        )
        
        if (!farcasterConnector) {
          console.warn('⚠️ Health check: Farcaster connector missing')
          // Mark disconnected to trigger reconnection flow
          if (mounted) {
            setFarcasterWallet(prev => ({
              ...prev,
              isConnected: false,
              error: new Error('Connector became unavailable')
            }))
          }
          return
        }
        
        // Verify wagmi reports active connection
        const globalAccount = getWagmiAccount()
        const wagmiReportsConnected = Boolean(globalAccount?.isConnected && globalAccount?.address)
        
        if (!wagmiReportsConnected) {
          console.warn('⚠️ Health check: wagmi reports disconnected')
          // Synchronize local state with wagmi state
          if (mounted) {
            setFarcasterWallet(prev => ({
              ...prev,
              isConnected: false
            }))
          }
          return
        }
        
        // Verify current address matches stored state
        const storedState = getConnectionState()
        if (storedState && globalAccount?.address !== storedState.address) {
          console.warn('⚠️ Health check: Address mismatch detected', {
            current: globalAccount?.address,
            expected: storedState.address
          })
          // Update storage with current address
          if (globalAccount?.address) {
            const chainId = globalAccount?.chainId || 8453
            saveConnectionState(globalAccount.address, 'farcasterMiniApp', chainId)
          }
        }
        
        // All health checks passed
        console.log('✅ Connection health check passed')
        
        // Update timestamp to maintain fresh state
        refreshConnectionTimestamp()
        
      } catch (error) {
        console.warn('⚠️ Health check error (non-critical):', error)
        // Avoid disconnecting on transient errors
      }
    }
    
    // Delay initial check to allow connection to stabilize
    const initialCheckTimeout = setTimeout(() => {
      performHealthCheck()
    }, 10000)
    
    // Run health checks every 30 seconds
    const healthCheckInterval = setInterval(() => {
      performHealthCheck()
    }, 30000)
    
    return () => {
      mounted = false
      clearTimeout(initialCheckTimeout)
      clearInterval(healthCheckInterval)
    }
  }, [appContext, farcasterWallet.isConnected])

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

  // ================================================
  // FARCASTER AUTO-LOGIN FLOW
  // ================================================

  // Automatically authenticate Farcaster users via signature-based login
  useEffect(() => {
    const handleFarcasterAutoLogin = async () => {
      // Verify we're in an actual Farcaster client environment
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

        // Generate nonce for signature verification
        const { nonce } = await initLoginToMiniApp()
        console.log('📝 Generated nonce for Farcaster login:', nonce)

        // Request signature from Farcaster MiniApp SDK
        const { sdk } = await import('@farcaster/miniapp-sdk')
        const result = await sdk.actions.signIn({ nonce })

        console.log('✍️ Obtained signature from Farcaster')

        // Authenticate with Privy using Farcaster signature
        await loginToMiniApp({
          message: result.message,
          signature: result.signature,
        })

        console.log('✅ Farcaster auto-login successful')
      } catch (error) {
        console.warn('⚠️ Farcaster auto-login failed, user will need to login manually:', error)
        // Allow manual login fallback
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
        // Use Farcaster auto-connect in miniapp context
        console.log('🔄 Real Farcaster client detected - letting Farcaster auto-connect handle it')
        
        // Check for existing authentication
        if (authenticated) {
          console.log('✅ Already authenticated via Farcaster')
          dispatch({ type: 'SET_LOADING', payload: 'success' })
          return
        }
        
        // Defer to auto-connect flow
        console.log('⏳ Waiting for Farcaster auto-connect...')
        dispatch({ type: 'SET_LOADING', payload: 'success' })
      } else {
        // Use Privy for web context
        console.log('🔄 Web context or /mini testing: Using Privy authentication')
        if (!logout) {
          throw new Error('Privy not available')
        }
        // Trigger Privy login
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
      // Mark as explicit disconnect to prevent automatic reconnection
      recordDisconnection()
      
      await logout()
      
      console.log('✅ Wallet disconnected and state cleared')
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


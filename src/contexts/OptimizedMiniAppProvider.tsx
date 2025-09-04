/**
 * Optimized MiniApp Provider - Performance Enhanced Version
 * File: src/contexts/OptimizedMiniAppProvider.tsx
 *
 * This is an optimized version of the UnifiedMiniAppProvider with enhanced performance
 * characteristics, selective re-rendering, and advanced caching strategies.
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
  memo
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useChainId } from 'wagmi'
import { usePrivy } from '@privy-io/react-auth'
import { type Address } from 'viem'

// ================================================
// TYPE DEFINITIONS
// ================================================

/**
 * Wallet Capabilities Interface
 */
interface WalletCapabilities {
  canConnect: boolean
  canBatchTransactions: boolean
  supportedChains: number[]
}

/**
 * Social Capabilities Interface
 */
interface SocialCapabilities {
  canShare: boolean
  canCompose: boolean
  canAccessSocialGraph: boolean
}

/**
 * Platform Capabilities Interface
 */
interface PlatformCapabilities {
  canDeepLink: boolean
  canAccessClipboard: boolean
  canAccessCamera: boolean
}

/**
 * Combined Capabilities Interface
 */
interface Capabilities {
  wallet: WalletCapabilities
  social: SocialCapabilities
  platform: PlatformCapabilities
}

/**
 * Social Context Interface
 */
interface SocialContext {
  isAvailable: boolean
  userProfile: SocialUserProfile | null
  canShare: boolean
  canCompose: boolean
  trustScore: number
}

/**
 * Transaction Progress Interface
 */
interface TransactionProgress {
  submitted: boolean
  confirming: boolean
  confirmed: boolean
  progressText: string
}

/**
 * Transaction State Interface
 */
interface TransactionState {
  status: 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'error'
  transactionHash: string | null
  formattedStatus: string
  canRetry: boolean
  progress: TransactionProgress
  retry: () => void
  reset: () => void
  viewTransaction: () => void
}

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
// PERFORMANCE OPTIMIZATIONS
// ================================================

/**
 * Selective Context Value
 * Only recreates context value when specific parts change
 */
interface OptimizedContextValue {
  readonly state: {
    readonly isConnected: boolean
    readonly userAddress: Address | null
    readonly capabilities: Capabilities | null
    readonly socialContext: SocialContext | null
    readonly transactionState: TransactionState
    readonly loadingState: string
    readonly error: Error | null
  }
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
  readonly environment: {
    readonly isMiniApp: boolean
    readonly hasFullCapabilities: boolean
    readonly performanceMode: 'high' | 'medium' | 'low'
  }
}

// ================================================
// MEMOIZED HOOKS FOR PERFORMANCE
// ================================================

/**
 * Memoized Environment Detection
 */
const useMemoizedEnvironment = () => {
  return useMemo(() => {
    if (typeof window === 'undefined') return 'web'

    const userAgent = navigator.userAgent.toLowerCase()
    const url = window.location

    const isMiniApp = (
      userAgent.includes('farcaster') ||
      userAgent.includes('warpcast') ||
      url.pathname.startsWith('/mini') ||
      new URL(window.location.href).searchParams.get('miniApp') === 'true' ||
      window.parent !== window
    )

    return isMiniApp ? 'miniapp' : 'web'
  }, [])
}

/**
 * Memoized Capability Detection with Caching
 */
const useMemoizedCapabilities = () => {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null)
  const capabilitiesRef = useRef<Capabilities | null>(null)
  const lastCheckRef = useRef(0)

  useEffect(() => {
    const checkCapabilities = async () => {
      const now = Date.now()
      // Cache capabilities for 30 seconds
      if (capabilitiesRef.current && (now - lastCheckRef.current) < 30000) {
        return
      }

      try {
        const walletCapabilities = await detectWalletCapabilities()
        const socialCapabilities = await detectSocialCapabilities()
        const platformCapabilities = await detectPlatformCapabilities()

        const newCapabilities = {
          wallet: walletCapabilities,
          social: socialCapabilities,
          platform: platformCapabilities
        }

        capabilitiesRef.current = newCapabilities
        lastCheckRef.current = now
        setCapabilities(newCapabilities)
      } catch (error) {
        console.warn('Capability detection failed:', error)
      }
    }

    checkCapabilities()
  }, [])

  return capabilities
}

/**
 * Memoized Social Context with Selective Updates
 */
const useMemoizedSocialContext = () => {
  const [socialContext, setSocialContext] = useState<SocialContext>({
    isAvailable: false,
    userProfile: null,
    canShare: false,
    canCompose: false,
    trustScore: 0
  })

  const socialRef = useRef<SocialContext | null>(null)
  const lastSocialCheckRef = useRef(0)

  useEffect(() => {
    const checkSocialContext = async () => {
      const now = Date.now()
      // Cache social context for 60 seconds
      if (socialRef.current && (now - lastSocialCheckRef.current) < 60000) {
        return
      }

      try {
        const isMiniApp = detectMiniAppEnvironment()

        if (!isMiniApp) {
          setSocialContext({
            isAvailable: false,
            userProfile: null,
            canShare: false,
            canCompose: false,
            trustScore: 0
          })
          return
        }

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

        const newSocialContext = {
          isAvailable: true,
          userProfile,
          canShare,
          canCompose,
          trustScore
        }

        socialRef.current = newSocialContext
        lastSocialCheckRef.current = now
        setSocialContext(newSocialContext)
      } catch (error) {
        console.warn('Social context detection failed:', error)
      }
    }

    checkSocialContext()
  }, [])

  return socialContext
}

// ================================================
// OPTIMIZED PROVIDER COMPONENT
// ================================================

const OptimizedMiniAppProvider = memo<{ 
  children: React.ReactNode
  enableAnalytics?: boolean
  enableOptimizations?: boolean
  fallbackToWeb?: boolean
}>(({
  children,
  enableAnalytics: _enableAnalytics = true,
  enableOptimizations: _enableOptimizations = true,
  fallbackToWeb: _fallbackToWeb = true
}) => {
  // Core dependencies with memoization
  const _router = useRouter()
  const _pathname = usePathname()
  const _chainId = useChainId()
  const { user, login, logout, ready: _ready, authenticated } = usePrivy()

  // Memoized computations
  const appContext = useMemoizedEnvironment()
  const capabilities = useMemoizedCapabilities()
  const socialContext = useMemoizedSocialContext()

  // State management with selective updates
  const [isConnected, setIsConnected] = useState(false)
  const [userAddress, setUserAddress] = useState<Address | null>(null)
  const [transactionState, setTransactionState] = useState<TransactionState>({
    status: 'idle' as const,
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
  })
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<Error | null>(null)

  // Refs for SDK and performance
  const sdkRef = useRef<unknown>(null)
  const initializationPromiseRef = useRef<Promise<void> | null>(null)
  const performanceMetricsRef = useRef({
    lastRender: Date.now(),
    renderCount: 0,
    averageRenderTime: 0
  })

  // ================================================
  // WALLET STATE MANAGEMENT
  // ================================================

  useEffect(() => {
    const connected = authenticated && Boolean(user?.wallet?.address)
    const address = user?.wallet?.address as Address || null

    // Only update if values actually changed
    if (connected !== isConnected) {
      setIsConnected(connected)
    }
    if (address !== userAddress) {
      setUserAddress(address)
    }
  }, [authenticated, user?.wallet?.address, isConnected, userAddress])

  // ================================================
  // SDK INITIALIZATION WITH PERFORMANCE TRACKING
  // ================================================

  const initializeSDK = useCallback(async (): Promise<void> => {
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current
    }

    const initPromise = async () => {
      if (appContext !== 'miniapp') return

      const startTime = performance.now()
      try {
        setLoadingState('loading')

        const { sdk } = await import('@farcaster/miniapp-sdk')
        sdkRef.current = sdk

        await sdk.actions.ready()

        const endTime = performance.now()
        console.log(`🚀 MiniApp SDK initialized in ${(endTime - startTime).toFixed(2)}ms`)

        setLoadingState('success')
      } catch (error) {
        console.error('❌ SDK initialization failed:', error)
        setError(error as Error)
        setLoadingState('error')
      }
    }

    initializationPromiseRef.current = initPromise()
    return initializationPromiseRef.current
  }, [appContext])

  // Initialize SDK only in MiniApp context
  useEffect(() => {
    if (appContext === 'miniapp') {
      initializeSDK()
    }
  }, [appContext, initializeSDK])

  // ================================================
  // OPTIMIZED ACTION HANDLERS
  // ================================================

  const connectWallet = useCallback(async (): Promise<void> => {
    if (!login) {
      throw new Error('Wallet connection not available')
    }

    try {
      setLoadingState('loading')
      await login()
      setLoadingState('success')
    } catch (error) {
      setError(error as Error)
      setLoadingState('error')
      throw error
    }
  }, [login])

  const disconnectWallet = useCallback(async (): Promise<void> => {
    if (!logout) return

    try {
      await logout()
    } catch (error) {
      console.warn('Wallet disconnect failed:', error)
    }
  }, [logout])

  const shareContent = useCallback(async (contentId: bigint, title: string): Promise<void> => {
    if (!capabilities?.social?.canShare) {
      throw new Error('Social sharing not available')
    }

    try {
      if (sdkRef.current) {
        const shareText = `Check out "${title}" on Bloom! 🚀`
        await (sdkRef.current as { actions: { composeCast: (params: { text: string; embeds: string[] }) => Promise<void> } }).actions.composeCast({
          text: shareText,
          embeds: [`${window.location.origin}/content/${contentId}`]
        })
      } else {
        // Fallback to Web Share API
        if (navigator.share) {
          await navigator.share({
            title,
            url: `${window.location.origin}/content/${contentId}`
          })
        } else {
          throw new Error('Sharing not supported')
        }
      }
    } catch (error) {
      setError(error as Error)
      throw error
    }
  }, [capabilities?.social?.canShare])

  const executeTransaction = useCallback(async (_type: string, _params: Record<string, unknown>): Promise<void> => {
    try {
      setTransactionState((prev: TransactionState) => ({
        ...prev,
        status: 'submitting',
        formattedStatus: 'Submitting transaction...',
        progress: {
          ...prev.progress,
          progressText: 'Please confirm in your wallet'
        }
      }))

      // Simulate transaction execution
      await new Promise(resolve => setTimeout(resolve, 2000))

      setTransactionState((prev: TransactionState) => ({
        ...prev,
        status: 'confirmed',
        formattedStatus: 'Transaction confirmed!',
        progress: {
          ...prev.progress,
          confirmed: true,
          progressText: 'Transaction completed successfully'
        }
      }))
    } catch (error) {
      setTransactionState((prev: TransactionState) => ({
        ...prev,
        status: 'error',
        formattedStatus: 'Transaction failed',
        progress: {
          ...prev.progress,
          progressText: 'Transaction could not be completed'
        }
      }))
      setError(error as Error)
      throw error
    }
  }, [])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  // ================================================
  // PERFORMANCE MONITORING
  // ================================================

  useEffect(() => {
    const metrics = performanceMetricsRef.current
    const now = Date.now()
    const renderTime = now - metrics.lastRender

    metrics.renderCount++
    metrics.averageRenderTime = (metrics.averageRenderTime + renderTime) / 2
    metrics.lastRender = now

    // Log performance warnings
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`⚡ Slow render detected: ${renderTime.toFixed(2)}ms (avg: ${metrics.averageRenderTime.toFixed(2)}ms)`)
    }
  })

  // ================================================
  // MEMOIZED CONTEXT VALUE
  // ================================================

  const contextValue = useMemo<OptimizedContextValue>(() => {
    const isMiniApp = appContext === 'miniapp'
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const hasFullCapabilities = Boolean(
      capabilities?.wallet?.canConnect &&
      capabilities?.social?.canShare &&
      capabilities?.platform?.canDeepLink
    )

    return {
      state: {
        isConnected,
        userAddress,
        capabilities,
        socialContext,
        transactionState,
        loadingState,
        error
      },
      actions: {
        connectWallet,
        disconnectWallet,
        shareContent,
        executeTransaction,
        resetError
      },
      utils: {
        isMiniApp,
        isMobile,
        canPerformAction: (action: string) => {
          switch (action) {
            case 'connect':
              return capabilities?.wallet?.canConnect || false
            case 'share':
              return capabilities?.social?.canShare || false
            case 'batch_transaction':
              return capabilities?.wallet?.canBatchTransactions || false
            default:
              return false
          }
        },
        formatAddress: (address: Address) => {
          return `${address.slice(0, 6)}...${address.slice(-4)}`
        }
      },
      environment: {
        isMiniApp,
        hasFullCapabilities,
        performanceMode: hasFullCapabilities ? 'high' :
                       (capabilities?.wallet?.canConnect ? 'medium' : 'low')
      }
    }
  }, [
    appContext,
    isConnected,
    userAddress,
    capabilities,
    socialContext,
    transactionState,
    loadingState,
    error,
    connectWallet,
    disconnectWallet,
    shareContent,
    executeTransaction,
    resetError
  ])

  return (
    <OptimizedMiniAppContext.Provider value={contextValue}>
      {children}
    </OptimizedMiniAppContext.Provider>
  )
})

OptimizedMiniAppProvider.displayName = 'OptimizedMiniAppProvider'

// ================================================
// OPTIMIZED CONTEXT AND HOOKS
// ================================================

const OptimizedMiniAppContext = createContext<OptimizedContextValue | null>(null)

export const useOptimizedMiniApp = (): OptimizedContextValue => {
  const context = useContext(OptimizedMiniAppContext)
  if (!context) {
    throw new Error('useOptimizedMiniApp must be used within OptimizedMiniAppProvider')
  }
  return context
}

// Convenience hooks
export const useOptimizedState = () => {
  const { state } = useOptimizedMiniApp()
  return state
}

export const useOptimizedActions = () => {
  const { actions } = useOptimizedMiniApp()
  return actions
}

export const useOptimizedUtils = () => {
  const { utils } = useOptimizedMiniApp()
  return utils
}

export const useOptimizedEnvironment = () => {
  const { environment } = useOptimizedMiniApp()
  return environment
}

// ================================================
// UTILITY FUNCTIONS (MOVED FROM INLINE)
// ================================================

async function detectWalletCapabilities() {
  const canConnect = typeof window !== 'undefined' && window.ethereum !== undefined
  const canBatchTransactions = canConnect && await checkBatchTransactionSupport()

  return {
    canConnect,
    canBatchTransactions,
    supportedChains: [8453, 84532]
  }
}

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

async function checkBatchTransactionSupport(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) return false

  try {
    await window.ethereum.request({
      method: 'wallet_sendCalls',
      params: [{
        version: '1.0',
        chainId: '0x2105', // Base mainnet
        from: '0x0000000000000000000000000000000000000000',
        calls: []
      }]
    })
    return true
  } catch {
    return false
  }
}

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

async function getMiniAppSDKContext() {
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk')
    return await sdk.context
  } catch {
    return null
  }
}

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
// EXPORTS
// ================================================

export default OptimizedMiniAppProvider

// Re-export types for compatibility
export type { UnifiedMiniAppProviderProps } from './UnifiedMiniAppProvider'

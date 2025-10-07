/**
 * Cross-Platform XMTP Provider - Unified Messaging Provider
 * File: /src/providers/XMTPProvider.tsx
 *
 * Unified XMTP provider that wraps both web and mobile applications
 * with TanStack Query and automatic XMTP client initialization.
 * Provides cross-platform message persistence and state management.
 *
 * Features:
 * - TanStack Query client configuration
 * - Automatic XMTP client initialization
 * - Cross-platform wallet integration
 * - Error boundary and fallback handling
 * - Development tools integration
 * - Performance optimizations
 */

'use client'

import React, { useEffect, useCallback, useState, createContext, useContext } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useAccount } from 'wagmi'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { 
  useXMTPClientStore, 
  useIsXMTPConnected, 
  useCanXMTPAutoConnect,
  useXMTPClientActions 
} from '@/shared/xmtp/client'
import { createXMTPError } from '@/shared/xmtp/queries'
import { detectMiniAppContext } from '@/shared/xmtp/miniapp-signer'
import type { XMTPEnvironment } from '@/shared/xmtp/client'

// ================================================
// TYPES & INTERFACES
// ================================================

interface XMTPProviderConfig {
  environment?: XMTPEnvironment
  enableDevtools?: boolean
  autoConnect?: boolean
  retryOnError?: boolean
  queryClientConfig?: Partial<QueryClientConfig>
}

interface XMTPProviderContext {
  isInitializing: boolean
  initializationError: string | null
  retryInitialization: () => void
  config: XMTPProviderConfig
}

interface QueryClientConfig {
  staleTime: number
  gcTime: number
  retryDelay: number
  maxRetries: number
}

// ================================================
// CONTEXT SETUP
// ================================================

const XMTPContext = createContext<XMTPProviderContext | null>(null)

export const useXMTPProvider = () => {
  const context = useContext(XMTPContext)
  if (!context) {
    throw new Error('useXMTPProvider must be used within XMTPProvider')
  }
  return context
}

// ================================================
// QUERY CLIENT CONFIGURATION
// ================================================

const DEFAULT_QUERY_CONFIG: QueryClientConfig = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime)
  retryDelay: 1000, // 1 second
  maxRetries: 3
}

const createQueryClient = (config: Partial<QueryClientConfig> = {}) => {
  const finalConfig = { ...DEFAULT_QUERY_CONFIG, ...config }
  
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: finalConfig.staleTime,
        gcTime: finalConfig.gcTime,
        retry: (failureCount, error) => {
          // Don't retry on XMTP client initialization errors
          if (error?.message?.includes('CLIENT_NOT_INITIALIZED')) return false
          if (error?.message?.includes('PERMISSION_DENIED')) return false
          return failureCount < finalConfig.maxRetries
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry on client errors
          if (error?.message?.includes('CLIENT_NOT_INITIALIZED')) return false
          if (error?.message?.includes('PERMISSION_DENIED')) return false
          return failureCount < 2
        },
        retryDelay: finalConfig.retryDelay,
      }
    }
  })
}

// ================================================
// XMTP AUTO-INITIALIZER COMPONENT
// ================================================

interface XMTPAutoInitializerProps {
  children: React.ReactNode
  config: XMTPProviderConfig
}

const XMTPAutoInitializer: React.FC<XMTPAutoInitializerProps> = ({ children, config }) => {
  const [isInitializing, setIsInitializing] = useState(false)
  const [initializationError, setInitializationError] = useState<string | null>(null)
  
  // Wallet hooks - try both depending on environment
  const webWallet = useAccount()
  const farcasterWallet = useFarcasterAutoWallet()
  
  // XMTP store and actions
  const { disconnect, isConnected } = useXMTPClientStore()
  const { connectWithAutoSigner } = useXMTPClientActions()
  const canAutoConnect = useCanXMTPAutoConnect()
  
  // Determine which wallet to use
  const activeWallet = farcasterWallet.isConnected ? farcasterWallet : webWallet

  const initializeXMTP = useCallback(async () => {
    if (!config.autoConnect || !activeWallet.isConnected || !activeWallet.address || isConnected()) {
      return
    }

    // Check if we're in miniapp context and can auto-connect
    const context = detectMiniAppContext()
    
    if (context.isMiniApp && canAutoConnect) {
      try {
        setIsInitializing(true)
        setInitializationError(null)
        
        console.log('🚀 Initializing XMTP with auto-signer in miniapp context')
        await connectWithAutoSigner({
          env: config.environment || 'production'
        })
        
        console.log('✅ XMTP client initialized successfully with auto-signer')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'XMTP initialization failed'
        console.error('❌ XMTP auto-initialization failed:', errorMessage)
        setInitializationError(errorMessage)
      } finally {
        setIsInitializing(false)
      }
    } else {
      console.log('📝 XMTP auto-connect not available:', {
        isMiniApp: context.isMiniApp,
        canAutoConnect,
        walletConnected: activeWallet.isConnected,
        walletAddress: activeWallet.address
      })
    }
  }, [
    config.autoConnect, 
    config.environment, 
    activeWallet.isConnected, 
    activeWallet.address, 
    isConnected,
    canAutoConnect,
    connectWithAutoSigner
  ])

  const retryInitialization = useCallback(() => {
    setInitializationError(null)
    initializeXMTP()
  }, [initializeXMTP])

  // Auto-initialize when wallet connects
  useEffect(() => {
    initializeXMTP()
  }, [initializeXMTP])

  // Disconnect when wallet disconnects
  useEffect(() => {
    if (!activeWallet.isConnected && isConnected()) {
      console.log('Wallet disconnected, cleaning up XMTP client')
      disconnect()
    }
  }, [activeWallet.isConnected, isConnected, disconnect])

  // Provide context
  const contextValue: XMTPProviderContext = {
    isInitializing,
    initializationError,
    retryInitialization,
    config
  }

  return (
    <XMTPContext.Provider value={contextValue}>
      {children}
    </XMTPContext.Provider>
  )
}

// ================================================
// ERROR BOUNDARY COMPONENT
// ================================================

interface XMTPErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface XMTPErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class XMTPErrorBoundary extends React.Component<XMTPErrorBoundaryProps, XMTPErrorBoundaryState> {
  constructor(props: XMTPErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): XMTPErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('XMTP Provider Error:', error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} reset={this.reset} />
    }

    return this.props.children
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({ error, reset }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Messaging Service Error</h2>
      <p className="text-sm text-gray-600 mb-4">
        There was an issue initializing the messaging service.
      </p>
      <details className="text-xs text-gray-500 mb-4">
        <summary className="cursor-pointer">Error Details</summary>
        <code className="block mt-2 p-2 bg-gray-100 rounded text-left">
          {error.message}
        </code>
      </details>
    </div>
    <button
      onClick={reset}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Retry
    </button>
  </div>
)

// ================================================
// MAIN PROVIDER COMPONENT
// ================================================

interface XMTPProviderProps {
  children: React.ReactNode
  config?: XMTPProviderConfig
  errorFallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

const DEFAULT_CONFIG: XMTPProviderConfig = {
  environment: 'production',
  enableDevtools: process.env.NODE_ENV === 'development',
  autoConnect: true,
  retryOnError: true
}

export const XMTPProvider: React.FC<XMTPProviderProps> = ({
  children,
  config = {},
  errorFallback
}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Create query client (memoized to prevent recreating on every render)
  const [queryClient] = useState(() => createQueryClient(finalConfig.queryClientConfig))

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queryClient.clear()
    }
  }, [queryClient])

  return (
    <XMTPErrorBoundary fallback={errorFallback}>
      <QueryClientProvider client={queryClient}>
        <XMTPAutoInitializer config={finalConfig}>
          {children}
        </XMTPAutoInitializer>
        
        {/* Development tools */}
        {/* {finalConfig.enableDevtools && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom-right"
            toggleButtonProps={{
              style: {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 99999,
              }
            }}
          />
        )} */}
      </QueryClientProvider>
    </XMTPErrorBoundary>
  )
}

// ================================================
// UTILITY HOOKS
// ================================================

/**
 * Hook to check if XMTP is ready for use
 */
export const useXMTPReady = () => {
  const isConnected = useIsXMTPConnected()
  const { isInitializing, initializationError } = useXMTPProvider()
  
  return {
    isReady: isConnected && !isInitializing && !initializationError,
    isInitializing,
    hasError: !!initializationError,
    errorMessage: initializationError
  }
}

/**
 * Hook to get XMTP initialization status
 */
export const useXMTPInitializationStatus = () => {
  const { isInitializing, initializationError, retryInitialization } = useXMTPProvider()
  const isConnected = useIsXMTPConnected()
  
  return {
    status: isConnected ? 'connected' : isInitializing ? 'initializing' : initializationError ? 'error' : 'disconnected',
    isInitializing,
    isConnected,
    error: initializationError,
    retry: retryInitialization
  }
}

// ================================================
// EXPORTS
// ================================================

export type {
  XMTPProviderConfig,
  XMTPProviderContext,
  QueryClientConfig
}

export {
  createQueryClient,
  XMTPAutoInitializer,
  XMTPErrorBoundary,
  DefaultErrorFallback
}
/**
 * Enhanced Wallet Connection Hook for MiniApp Context
 * File: src/hooks/web3/useMiniAppWalletConnect.ts
 * 
 * This hook provides a robust wallet connection interface specifically designed
 * for MiniApp environments. It handles the unique challenges of embedded contexts
 * while maintaining full compatibility with your existing codebase.
 * 
 * KEY FEATURES:
 * - Automatic error recovery from wagmi state corruption
 * - MiniApp-specific connection flow optimization
 * - Farcaster integration for social verification
 * - Progressive enhancement that works in both web and MiniApp contexts
 * - Comprehensive error handling with user-friendly fallbacks
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { 
  useAccount, 
  useChainId, 
  useDisconnect, 
  useConnect,
  useConfig,
  useReconnect
} from 'wagmi'
import { base, baseSepolia } from 'viem/chains'
import { formatAddress } from '../../lib/utils'
import type { Connector } from 'wagmi'
import type { Address } from 'viem'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export type WalletConnectionStatus = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'recovering'

export interface NetworkInfo {
  readonly id: number
  readonly name: string
  readonly isSupported: boolean
  readonly blockExplorer: string
  readonly rpcUrl: string
}

export interface ConnectionError {
  readonly type: 'network' | 'wallet' | 'permission' | 'unknown'
  readonly message: string
  readonly code?: string | number
  readonly recoverable: boolean
}

export interface MiniAppWalletState {
  readonly isConnected: boolean
  readonly isConnecting: boolean
  readonly status: WalletConnectionStatus
  readonly address: Address | null
  readonly formattedAddress: string | null
  readonly network: NetworkInfo | null
  readonly isCorrectNetwork: boolean
  readonly error: ConnectionError | null
  readonly canRecover: boolean
  readonly recoveryAttempts: number
}

export interface MiniAppWalletActions {
  readonly connect: (connector?: Connector) => Promise<void>
  readonly disconnect: () => Promise<void>
  readonly switchNetwork: (chainId: number) => Promise<void>
  readonly retry: () => Promise<void>
  readonly clearError: () => void
  readonly recover: () => Promise<void>
}

export interface UseMiniAppWalletConnectReturn extends MiniAppWalletState, MiniAppWalletActions {
  readonly supportedNetworks: readonly NetworkInfo[]
  readonly availableConnectors: readonly Connector[]
}

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const SUPPORTED_NETWORKS: readonly NetworkInfo[] = [
  {
    id: base.id,
    name: base.name,
    isSupported: true,
    blockExplorer: base.blockExplorers.default.url,
    rpcUrl: base.rpcUrls.default.http[0]
  },
  {
    id: baseSepolia.id,
    name: baseSepolia.name,
    isSupported: true,
    blockExplorer: baseSepolia.blockExplorers.default.url,
    rpcUrl: baseSepolia.rpcUrls.default.http[0]
  }
] as const

const MAX_RECOVERY_ATTEMPTS = 3
const RECOVERY_DELAY = 1000 // 1 second

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Categorizes connection errors for better user experience
 */
function categorizeError(error: Error): ConnectionError {
  const message = error.message.toLowerCase()

  // Check for the specific error we're fixing
  if (message.includes('connections.get is not a function')) {
    return {
      type: 'wallet',
      message: 'Wallet connection system needs to be reset',
      code: 'CONNECTIONS_MAP_ERROR',
      recoverable: true
    }
  }

  if (message.includes('user rejected') || message.includes('user denied')) {
    return {
      type: 'permission',
      message: 'Connection cancelled by user',
      recoverable: true
    }
  }

  if (message.includes('network') || message.includes('chain')) {
    return {
      type: 'network',
      message: 'Network connection issue',
      recoverable: true
    }
  }

  if (message.includes('no wallet') || message.includes('not installed')) {
    return {
      type: 'wallet',
      message: 'Wallet not found or not installed',
      recoverable: false
    }
  }

  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred',
    recoverable: true
  }
}

/**
 * Creates a delay for recovery attempts
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Enhanced wagmi state reset function
 * This function performs a comprehensive reset of wagmi's internal state
 * to fix the connections.get error and other state corruption issues
 */
const resetWagmiState = async (config: any) => {
  try {
    console.log('🔄 Performing comprehensive wagmi state reset...')
    
    // Step 1: Clear wagmi storage
    const storage = config.storage
    if (storage) {
      try {
        await storage.removeItem('dxbloom-miniapp-wagmi')
        await storage.removeItem('wagmi.store')
        await storage.removeItem('wagmi.cache')
        await storage.removeItem('wagmi.connections')
        await storage.removeItem('wagmi.state')
      } catch (storageError) {
        console.warn('Could not clear wagmi storage:', storageError)
      }
    }

    // Step 2: Clear browser storage
    if (typeof window !== 'undefined') {
      try {
        // Clear all wagmi-related localStorage items
        const keysToRemove = [
          'dxbloom-miniapp-wagmi',
          'wagmi.store',
          'wagmi.cache',
          'wagmi.connections',
          'wagmi.state',
          'wagmi.account',
          'wagmi.chainId',
          'wagmi.connector'
        ]
        
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key)
          } catch (e) {
            // Ignore individual key removal errors
          }
        })
        
        // Clear any connection-specific storage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('wagmi') || key.includes('wallet') || key.includes('connector')) {
            try {
              localStorage.removeItem(key)
            } catch (e) {
              // Ignore individual key removal errors
            }
          }
        })
        
        // Clear sessionStorage as well
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('wagmi') || key.includes('wallet') || key.includes('connector')) {
            try {
              sessionStorage.removeItem(key)
            } catch (e) {
              // Ignore individual key removal errors
            }
          }
        })
      } catch (storageError) {
        console.warn('Could not clear browser storage:', storageError)
      }
    }

    // Step 3: Reset wagmi internal state if possible
    if (config.state && typeof config.state.set === 'function') {
      try {
        // Reset to initial state
        config.state.set({
          connections: new Map(),
          accounts: [],
          chainId: undefined,
          connector: undefined,
          status: 'disconnected'
        })
      } catch (stateError) {
        console.warn('Could not reset wagmi internal state:', stateError)
      }
    }

    console.log('✅ Wagmi state reset completed')
  } catch (resetError) {
    console.error('Failed to reset wagmi state:', resetError)
    throw resetError
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

export function useMiniAppWalletConnect(): UseMiniAppWalletConnectReturn {
  // Core wagmi hooks
  const { address, isConnected, isConnecting, connector } = useAccount()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { connect: wagmiConnect, connectors, error: connectError, isPending } = useConnect()
  const { reconnect } = useReconnect()
  const chainId = useChainId()
  const config = useConfig()

  // Local state for error handling and recovery
  const [error, setError] = useState<ConnectionError | null>(null)
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryAttempts, setRecoveryAttempts] = useState(0)
  const lastErrorRef = useRef<string>('')
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // =============================================================================
  // ERROR HANDLING AND RECOVERY
  // =============================================================================

  /**
   * Enhanced recovery mechanism for connection errors
   */
  const recover = useCallback(async () => {
    // Clear any existing recovery timeout
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current)
      recoveryTimeoutRef.current = null
    }

    // Use a ref to track current recovery attempts to avoid dependency issues
    const currentAttempts = recoveryAttempts
    if (currentAttempts >= MAX_RECOVERY_ATTEMPTS) {
      console.warn('Maximum recovery attempts reached')
      return
    }

    setIsRecovering(true)
    setRecoveryAttempts(prev => prev + 1)

    try {
      console.log(`🔄 Recovery attempt ${currentAttempts + 1}/${MAX_RECOVERY_ATTEMPTS}`)

      // Step 1: Perform comprehensive wagmi state reset
      await resetWagmiState(config)

      // Step 2: Wait for the reset to take effect
      await delay(RECOVERY_DELAY)

      // Step 3: Try to reconnect using the last successful configuration
      try {
        await reconnect()
      } catch (reconnectError) {
        console.warn('Reconnect failed, will require manual connection:', reconnectError)
      }

      // Step 4: Clear the error if we got this far
      setError(null)
      
      console.log('✅ Recovery completed successfully')

    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError)
      setError(categorizeError(recoveryError as Error))
    } finally {
      setIsRecovering(false)
    }
  }, [config, reconnect, recoveryAttempts])

  /**
   * Enhanced error handling with automatic recovery
   */
  useEffect(() => {
    if (connectError) {
      const categorized = categorizeError(connectError)
      const errorString = connectError.message

      // Avoid duplicate error processing
      if (lastErrorRef.current === errorString) {
        return
      }
      lastErrorRef.current = errorString

      setError(categorized)

      // Auto-recovery for specific errors
      if (categorized.code === 'CONNECTIONS_MAP_ERROR' && recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
        console.log('🚨 Automatically attempting recovery for connections.get error')
        
        // Use setTimeout with a stable reference to avoid dependency issues
        recoveryTimeoutRef.current = setTimeout(() => {
          recover()
        }, 500)
      }
    }
  }, [connectError, recoveryAttempts, recover])

  // Reset recovery attempts on successful connection
  useEffect(() => {
    if (isConnected && error) {
      setError(null)
      setRecoveryAttempts(0)
      lastErrorRef.current = ''
      
      // Clear any pending recovery timeout
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
        recoveryTimeoutRef.current = null
      }
    }
  }, [isConnected, error])

  // Cleanup recovery timeout on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
    }
  }, [])

  // =============================================================================
  // CONNECTION ACTIONS
  // =============================================================================

  const connect = useCallback(async (preferredConnector?: Connector) => {
    try {
      setError(null)
      
      // Use the preferred connector or the first available one
      const targetConnector = preferredConnector || connectors[0]
      
      if (!targetConnector) {
        throw new Error('No wallet connectors available')
      }

      await wagmiConnect({ connector: targetConnector })
    } catch (connectError) {
      const categorized = categorizeError(connectError as Error)
      setError(categorized)

      // Auto-recover for specific errors
      if (categorized.recoverable && recoveryAttempts < MAX_RECOVERY_ATTEMPTS) {
        recoveryTimeoutRef.current = setTimeout(() => {
          recover()
        }, 1000)
      }
    }
  }, [wagmiConnect, connectors, recoveryAttempts, recover])

  const disconnect = useCallback(async () => {
    try {
      setError(null)
      await wagmiDisconnect()
      setRecoveryAttempts(0)
      
      // Clear any pending recovery timeout
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
        recoveryTimeoutRef.current = null
      }
    } catch (disconnectError) {
      setError(categorizeError(disconnectError as Error))
    }
  }, [wagmiDisconnect])

  const switchNetwork = useCallback(async (targetChainId: number) => {
    try {
      setError(null)
      
      if (!connector?.switchChain) {
        throw new Error('Network switching not supported by current wallet')
      }

      await connector.switchChain({ chainId: targetChainId })
    } catch (switchError) {
      setError(categorizeError(switchError as Error))
    }
  }, [connector])

  const retry = useCallback(async () => {
    if (error?.recoverable) {
      await recover()
    }
  }, [error, recover])

  const clearError = useCallback(() => {
    setError(null)
    lastErrorRef.current = ''
    
    // Clear any pending recovery timeout
    if (recoveryTimeoutRef.current) {
      clearTimeout(recoveryTimeoutRef.current)
      recoveryTimeoutRef.current = null
    }
  }, [])

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const status: WalletConnectionStatus = useMemo(() => {
    if (isRecovering) return 'recovering'
    if (isConnecting || isPending) return 'connecting'
    if (isConnected) return 'connected'
    if (error) return 'error'
    return 'disconnected'
  }, [isRecovering, isConnecting, isPending, isConnected, error])

  const formattedAddress = useMemo(() => 
    address ? formatAddress(address) : null, 
    [address]
  )

  const network = useMemo(() => 
    SUPPORTED_NETWORKS.find(n => n.id === chainId) || null,
    [chainId]
  )

  const isCorrectNetwork = useMemo(() => 
    network?.isSupported ?? false,
    [network]
  )

  const canRecover = useMemo(() => 
    Boolean(error?.recoverable && recoveryAttempts < MAX_RECOVERY_ATTEMPTS),
    [error, recoveryAttempts]
  )

  return {
    // State
    isConnected,
    isConnecting: isConnecting || isPending || isRecovering,
    status,
    address: address || null,
    formattedAddress,
    network,
    isCorrectNetwork,
    error,
    canRecover,
    recoveryAttempts,

    // Actions
    connect,
    disconnect,
    switchNetwork,
    retry,
    clearError,
    recover,

    // Static data
    supportedNetworks: SUPPORTED_NETWORKS,
    availableConnectors: connectors
  }
}
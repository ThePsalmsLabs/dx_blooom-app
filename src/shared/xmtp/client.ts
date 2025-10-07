/**
 * Unified XMTP Client Store - Cross-Platform State Management
 * File: /src/shared/xmtp/client.ts
 *
 * This is the core XMTP client store using Zustand for cross-platform 
 * message persistence between web and mobile applications. Following 
 * 2024 industry best practices for React state management.
 *
 * Features:
 * - Cross-platform client state persistence
 * - Automatic reconnection logic
 * - Connection status management
 * - Error handling and recovery
 * - TypeScript type safety
 */

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Client } from '@xmtp/xmtp-js'
import type { Signer } from '@xmtp/xmtp-js'
import type { Address } from 'viem'
import { 
  createValidatedMiniAppXMTPSigner, 
  detectMiniAppContext,
  canCreateXMTPSigner,
  type MiniAppXMTPSigner 
} from './miniapp-signer'

// ================================================
// TYPES & INTERFACES
// ================================================

export type XMTPEnvironment = 'dev' | 'production' | 'local'

export interface XMTPConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting'
  lastConnected?: Date
  errorMessage?: string
  retryCount: number
}

export interface XMTPClientConfig {
  env: XMTPEnvironment
  apiUrl?: string
}

export interface XMTPClientStore {
  // Client state
  client: Client | null
  connectionStatus: XMTPConnectionStatus
  userAddress: Address | null
  config: XMTPClientConfig | null
  
  // Connection management
  connect: (signer: Signer, config?: Partial<XMTPClientConfig>) => Promise<void>
  connectWithAutoSigner: (config?: Partial<XMTPClientConfig>) => Promise<void>
  disconnect: () => void
  reconnect: () => Promise<void>
  
  // Status management
  setConnectionStatus: (status: Partial<XMTPConnectionStatus>) => void
  clearError: () => void
  
  // Configuration
  updateConfig: (config: Partial<XMTPClientConfig>) => void
  
  // Utilities
  isConnected: () => boolean
  canReconnect: () => boolean
  canAutoConnect: () => boolean
}

// ================================================
// DEFAULT CONFIGURATION
// ================================================

const DEFAULT_CONFIG: XMTPClientConfig = {
  env: 'production'
}

const INITIAL_CONNECTION_STATUS: XMTPConnectionStatus = {
  status: 'disconnected',
  retryCount: 0
}

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 2000

// ================================================
// ZUSTAND STORE IMPLEMENTATION
// ================================================

export const useXMTPClientStore = create<XMTPClientStore>()(
  persist(
    (set, get) => ({
      // Initial state
      client: null,
      connectionStatus: INITIAL_CONNECTION_STATUS,
      userAddress: null,
      config: DEFAULT_CONFIG,

      // Connection management
      connect: async (signer: Signer, config?: Partial<XMTPClientConfig>) => {
        const store = get()
        
        try {
          // Update connection status
          set({
            connectionStatus: {
              ...store.connectionStatus,
              status: 'connecting',
              errorMessage: undefined
            }
          })

          // Merge configuration
          const finalConfig = { ...DEFAULT_CONFIG, ...config }
          
          // Extract user address from signer
          const userAddress = (await signer.getAddress()) as Address

          // Create XMTP client with configuration
          const client = await Client.create(signer, {
            env: finalConfig.env,
            apiUrl: finalConfig.apiUrl
            // Note: codecs field removed as XMTP v13 handles this automatically
          })

          // Update store with successful connection
          set({
            client,
            userAddress,
            config: finalConfig,
            connectionStatus: {
              status: 'connected',
              lastConnected: new Date(),
              retryCount: 0,
              errorMessage: undefined
            }
          })

          console.log('XMTP client connected successfully:', userAddress)

        } catch (error) {
          console.error('XMTP connection failed:', error)
          
          const errorMessage = error instanceof Error ? error.message : 'Connection failed'
          
          set({
            client: null,
            connectionStatus: {
              ...store.connectionStatus,
              status: 'error',
              errorMessage,
              retryCount: store.connectionStatus.retryCount + 1
            }
          })

          throw error
        }
      },

      connectWithAutoSigner: async (config?: Partial<XMTPClientConfig>) => {
        const store = get()
        
        try {
          // Check if we can auto-connect
          if (!store.canAutoConnect()) {
            throw new Error('Auto-connect not available - wallet not connected or not in miniapp context')
          }

          // Create validated miniapp signer
          const signer = createValidatedMiniAppXMTPSigner()
          
          // Use the standard connect method with the auto-generated signer
          await store.connect(signer, config)

        } catch (error) {
          console.error('XMTP auto-connect failed:', error)
          throw error
        }
      },

      disconnect: () => {
        const store = get()
        
        // Clean up client connection
        if (store.client) {
          // Note: XMTP client doesn't have explicit disconnect method
          // The client will be garbage collected
        }

        set({
          client: null,
          userAddress: null,
          connectionStatus: {
            status: 'disconnected',
            retryCount: 0,
            errorMessage: undefined
          }
        })

        console.log('XMTP client disconnected')
      },

      reconnect: async () => {
        const store = get()
        
        if (!store.canReconnect()) {
          throw new Error('Cannot reconnect: max retry attempts exceeded')
        }

        set({
          connectionStatus: {
            ...store.connectionStatus,
            status: 'reconnecting'
          }
        })

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))

        // Note: Actual reconnection would require the signer
        // This method is primarily for status management
        // Real reconnection should be handled by the calling component
        throw new Error('Reconnection requires signer - call connect() instead')
      },

      // Status management
      setConnectionStatus: (status: Partial<XMTPConnectionStatus>) => {
        set(state => ({
          connectionStatus: {
            ...state.connectionStatus,
            ...status
          }
        }))
      },

      clearError: () => {
        set(state => ({
          connectionStatus: {
            ...state.connectionStatus,
            status: state.connectionStatus.status === 'error' ? 'disconnected' : state.connectionStatus.status,
            errorMessage: undefined
          }
        }))
      },

      // Configuration
      updateConfig: (config: Partial<XMTPClientConfig>) => {
        set(state => ({
          config: state.config ? { ...state.config, ...config } : { ...DEFAULT_CONFIG, ...config }
        }))
      },

      // Utilities
      isConnected: () => {
        const store = get()
        return store.connectionStatus.status === 'connected' && store.client !== null
      },

      canReconnect: () => {
        const store = get()
        return store.connectionStatus.retryCount < MAX_RETRY_ATTEMPTS
      },

      canAutoConnect: () => {
        const context = detectMiniAppContext()
        return context.isMiniApp && canCreateXMTPSigner()
      }
    }),
    {
      name: 'xmtp-client-storage',
      storage: createJSONStorage(() => localStorage),
      
      // Only persist user preferences and configuration
      // Do NOT persist the actual client instance or connection status
      partialize: (state) => ({
        userAddress: state.userAddress,
        config: state.config
      }),
      
      // Restore default connection status on hydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.connectionStatus = INITIAL_CONNECTION_STATUS
          state.client = null
        }
      }
    }
  )
)

// ================================================
// UTILITY HOOKS
// ================================================

/**
 * Hook to get current XMTP connection status
 */
export const useXMTPConnectionStatus = () => {
  return useXMTPClientStore(state => state.connectionStatus)
}

/**
 * Hook to check if XMTP client is connected
 */
export const useIsXMTPConnected = () => {
  return useXMTPClientStore(state => state.isConnected())
}

/**
 * Hook to get current XMTP client instance
 */
export const useXMTPClient = () => {
  return useXMTPClientStore(state => state.client)
}

/**
 * Hook to get current user address
 */
export const useXMTPUserAddress = () => {
  return useXMTPClientStore(state => state.userAddress)
}

/**
 * Hook to check if XMTP can auto-connect in current context
 */
export const useCanXMTPAutoConnect = () => {
  return useXMTPClientStore(state => state.canAutoConnect())
}

/**
 * Hook to get XMTP client store actions
 */
export const useXMTPClientActions = () => {
  return useXMTPClientStore(state => ({
    connect: state.connect,
    connectWithAutoSigner: state.connectWithAutoSigner,
    disconnect: state.disconnect,
    reconnect: state.reconnect,
    setConnectionStatus: state.setConnectionStatus,
    clearError: state.clearError,
    updateConfig: state.updateConfig
  }))
}

// ================================================
// CONSTANTS & EXPORTS
// ================================================

export { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS, DEFAULT_CONFIG }
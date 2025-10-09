/**
 * wagmi Global Type Definitions
 * File: src/types/wagmi-globals.ts
 * 
 * TypeScript type definitions and type-safe accessors for wagmi's global state.
 * Replaces unsafe `(globalThis as any).__wagmi_*` patterns with proper typing.
 * 
 * Note: wagmi stores state on globalThis for cross-component access
 */

import type { Connector } from 'wagmi'
import type { Address } from 'viem'

// ============================================================================
// WAGMI GLOBAL INTERFACES
// ============================================================================

/**
 * Current wallet connection state from wagmi
 */
export interface WagmiAccountState {
  readonly address?: Address
  readonly isConnected: boolean
  readonly isConnecting?: boolean
  readonly isDisconnected?: boolean
  readonly chainId?: number
  readonly connector?: Connector
  readonly status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
}

/**
 * wagmi configuration object structure
 */
export interface WagmiConfig {
  readonly connectors: Map<string, Connector> | Connector[]
  readonly storage?: {
    readonly getItem: (key: string) => string | null | Promise<string | null>
    readonly setItem: (key: string, value: string) => void | Promise<void>
    readonly removeItem: (key: string) => void | Promise<void>
  }
  [key: string]: any
}

/**
 * Internal wagmi state store
 */
export interface WagmiStore {
  readonly connectors?: Connector[]
  readonly state?: WagmiAccountState
}

// ============================================================================
// GLOBAL THIS EXTENSION
// ============================================================================

/**
 * Extend globalThis to include wagmi's global state properties
 */
declare global {
  interface GlobalThisExtension {
    __wagmi_account?: WagmiAccountState
    __wagmi_config?: WagmiConfig
    __wagmi_store?: WagmiStore
  }

  var __wagmi_account: WagmiAccountState | undefined
  var __wagmi_config: WagmiConfig | undefined
  var __wagmi_store: WagmiStore | undefined
}

// ============================================================================
// TYPE-SAFE ACCESSORS
// ============================================================================

/**
 * Retrieve wagmi account state from global context
 */
export function getWagmiAccount(): WagmiAccountState | null {
  try {
    return globalThis.__wagmi_account || null
  } catch {
    return null
  }
}

/**
 * Retrieve wagmi configuration from global context
 */
export function getWagmiConfig(): WagmiConfig | null {
  try {
    return globalThis.__wagmi_config || null
  } catch {
    return null
  }
}

/**
 * Retrieve wagmi store from global context
 */
export function getWagmiStore(): WagmiStore | null {
  try {
    return globalThis.__wagmi_store || null
  } catch {
    return null
  }
}

/**
 * Extract wallet connectors from wagmi config (handles Map or Array format)
 */
export function getWagmiConnectors(): Connector[] {
  try {
    const config = getWagmiConfig()
    if (!config?.connectors) return []
    
    // Convert Map to Array if needed
    if (config.connectors instanceof Map) {
      return Array.from(config.connectors.values())
    }
    
    if (Array.isArray(config.connectors)) {
      return config.connectors
    }
    
    return []
  } catch (error) {
    console.warn('Failed to get wagmi connectors:', error)
    return []
  }
}

/**
 * Verify wagmi initialization status
 */
export function isWagmiInitialized(): boolean {
  return Boolean(globalThis.__wagmi_config)
}

/**
 * Get current wallet connection status from wagmi state
 */
export function getWagmiConnectionStatus(): {
  isConnected: boolean
  address: Address | null
  chainId: number | null
  connector: Connector | null
} {
  const account = getWagmiAccount()
  
  return {
    isConnected: account?.isConnected ?? false,
    address: account?.address ?? null,
    chainId: account?.chainId ?? null,
    connector: account?.connector ?? null,
  }
}



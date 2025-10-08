/**
 * Wallet Connection Persistence Manager
 * File: src/lib/wallet/connection-persistence.ts
 * 
 * Manages wallet connection state persistence across page navigations,
 * refreshes, and browser sessions.
 * 
 * Features:
 * - localStorage-based persistence with automatic expiration
 * - Type-safe state management with versioning for migrations
 * - Comprehensive error handling and recovery
 * - Automatic cleanup of expired connections
 * - Based on patterns from Uniswap, Aave, and WalletConnect SDK
 */

// ============================================================================
// TYPES
// ============================================================================

export interface WalletConnectionState {
  readonly address: string
  readonly connectorId: string
  readonly chainId: number
  readonly timestamp: number
  readonly version: string
}

export interface ConnectionSnapshot {
  readonly address: string
  readonly timestamp: number
  readonly fromPath: string
  readonly toPath: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  CONNECTION_STATE: 'dxbloom_wallet_connection_state',
  NAVIGATION_SNAPSHOT: 'dxbloom_wallet_navigation_snapshot',
  LAST_DISCONNECT: 'dxbloom_wallet_last_disconnect',
  CONNECTION_PREFERENCES: 'dxbloom_wallet_preferences',
} as const

const STATE_VERSION = '1.0'
const CONNECTION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const SNAPSHOT_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

// ============================================================================
// CORE PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Persist wallet connection state to localStorage
 * Call immediately after successful connection to enable auto-reconnect
 */
export function saveConnectionState(
  address: string,
  connectorId: string,
  chainId: number
): void {
  try {
    const state: WalletConnectionState = {
      address,
      connectorId,
      chainId,
      timestamp: Date.now(),
      version: STATE_VERSION,
    }

    localStorage.setItem(STORAGE_KEYS.CONNECTION_STATE, JSON.stringify(state))

    console.log('💾 Saved wallet connection state:', {
      address: `${address.slice(0, 6)}...${address.slice(-4)}`,
      connectorId,
      chainId,
    })
  } catch (error) {
    console.error('❌ Failed to save connection state:', error)
  }
}

/**
 * Retrieve stored wallet connection state from localStorage
 * Returns null if state is missing, expired, or invalid
 */
export function getConnectionState(): WalletConnectionState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONNECTION_STATE)
    if (!stored) {
      return null
    }

    const state = JSON.parse(stored) as WalletConnectionState

    // Verify required fields exist
    if (!state.address || !state.connectorId || !state.timestamp) {
      console.warn('⚠️ Invalid connection state structure, clearing...')
      clearConnectionState()
      return null
    }

    // Check expiration (7 days)
    const age = Date.now() - state.timestamp
    if (age > CONNECTION_EXPIRY_MS) {
      console.log('⏰ Connection state expired, clearing...')
      clearConnectionState()
      return null
    }

    // Verify version compatibility
    if (state.version !== STATE_VERSION) {
      console.warn('⚠️ Connection state version mismatch, clearing...')
      clearConnectionState()
      return null
    }

    return state
  } catch (error) {
    console.error('❌ Failed to get connection state:', error)
    return null
  }
}

/**
 * Determine if wallet should auto-reconnect based on stored state
 * Primary check for app initialization - returns true if valid state exists
 */
export function shouldBeConnected(): boolean {
  const state = getConnectionState()
  
  if (!state) {
    return false
  }

  // Respect explicit user disconnection
  const lastDisconnect = getLastDisconnectTimestamp()
  if (lastDisconnect && lastDisconnect > state.timestamp) {
    console.log('🚫 User disconnected after last connection, should not reconnect')
    return false
  }

  return true
}

/**
 * Remove wallet connection state from localStorage
 * Called on explicit disconnection or when state becomes invalid
 */
export function clearConnectionState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONNECTION_STATE)
    console.log('🗑️ Cleared wallet connection state')
  } catch (error) {
    console.error('❌ Failed to clear connection state:', error)
  }
}

/**
 * Record explicit user-initiated disconnection to prevent auto-reconnect
 */
export function recordDisconnection(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_DISCONNECT, Date.now().toString())
    clearConnectionState()
    console.log('📝 Recorded wallet disconnection')
  } catch (error) {
    console.error('❌ Failed to record disconnection:', error)
  }
}

/**
 * Retrieve timestamp of last explicit disconnection
 */
function getLastDisconnectTimestamp(): number | null {
  try {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_DISCONNECT)
    return timestamp ? parseInt(timestamp, 10) : null
  } catch {
    return null
  }
}

// ============================================================================
// NAVIGATION SNAPSHOT FUNCTIONS
// ============================================================================

/**
 * Capture wallet state before route transition for post-navigation verification
 */
export function saveNavigationSnapshot(
  address: string,
  fromPath: string,
  toPath: string
): void {
  try {
    const snapshot: ConnectionSnapshot = {
      address,
      timestamp: Date.now(),
      fromPath,
      toPath,
    }

    sessionStorage.setItem(
      STORAGE_KEYS.NAVIGATION_SNAPSHOT,
      JSON.stringify(snapshot)
    )

    console.log('📸 Saved navigation snapshot:', {
      address: `${address.slice(0, 6)}...${address.slice(-4)}`,
      route: `${fromPath} → ${toPath}`,
    })
  } catch (error) {
    console.error('❌ Failed to save navigation snapshot:', error)
  }
}

/**
 * Retrieve navigation snapshot from sessionStorage
 * Returns null if missing or expired (5 minute timeout)
 */
export function getNavigationSnapshot(): ConnectionSnapshot | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.NAVIGATION_SNAPSHOT)
    if (!stored) {
      return null
    }

    const snapshot = JSON.parse(stored) as ConnectionSnapshot

    // Check 5-minute expiration
    const age = Date.now() - snapshot.timestamp
    if (age > SNAPSHOT_EXPIRY_MS) {
      clearNavigationSnapshot()
      return null
    }

    return snapshot
  } catch (error) {
    console.error('❌ Failed to get navigation snapshot:', error)
    return null
  }
}

/**
 * Remove navigation snapshot after verification complete
 */
export function clearNavigationSnapshot(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.NAVIGATION_SNAPSHOT)
  } catch (error) {
    console.error('❌ Failed to clear navigation snapshot:', error)
  }
}

// ============================================================================
// CONNECTION PREFERENCES
// ============================================================================

export interface ConnectionPreferences {
  readonly autoReconnect: boolean
  readonly preferredConnectorId: string | null
  readonly preferredChainId: number | null
}

/**
 * Store user connection preferences to localStorage
 */
export function saveConnectionPreferences(
  preferences: ConnectionPreferences
): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CONNECTION_PREFERENCES,
      JSON.stringify(preferences)
    )
  } catch (error) {
    console.error('❌ Failed to save connection preferences:', error)
  }
}

/**
 * Retrieve user connection preferences with fallback to defaults
 */
export function getConnectionPreferences(): ConnectionPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CONNECTION_PREFERENCES)
    if (!stored) {
      return {
        autoReconnect: true,
        preferredConnectorId: null,
        preferredChainId: null,
      }
    }

    return JSON.parse(stored) as ConnectionPreferences
  } catch (error) {
    console.error('❌ Failed to get connection preferences:', error)
    return {
      autoReconnect: true,
      preferredConnectorId: null,
      preferredChainId: null,
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Verify connection state freshness (less than 1 hour old)
 * Fresh connections have higher reconnection success rate
 */
export function isConnectionStateFresh(): boolean {
  const state = getConnectionState()
  if (!state) return false

  const age = Date.now() - state.timestamp
  const oneHour = 60 * 60 * 1000

  return age < oneHour
}

/**
 * Update connection timestamp to current time
 * Call periodically during active sessions to prevent expiration
 */
export function refreshConnectionTimestamp(): void {
  try {
    const state = getConnectionState()
    if (!state) return

    const updatedState = {
      ...state,
      timestamp: Date.now(),
    }

    localStorage.setItem(
      STORAGE_KEYS.CONNECTION_STATE,
      JSON.stringify(updatedState)
    )
  } catch (error) {
    console.error('❌ Failed to refresh connection timestamp:', error)
  }
}

/**
 * Calculate connection age in milliseconds
 */
export function getConnectionAge(): number | null {
  const state = getConnectionState()
  if (!state) return null

  return Date.now() - state.timestamp
}

/**
 * Test localStorage availability and functionality
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Clean up legacy connection state keys from previous versions
 * Call on app initialization to migrate to current storage schema
 */
export function migrateOldConnectionState(): void {
  try {
    const oldKeys = [
      'isWalletConnected',
      'walletAddress',
      'fc_wallet_connected',
      'wallet_connected',
    ]

    let foundOldState = false

    for (const key of oldKeys) {
      const value = localStorage.getItem(key)
      if (value) {
        console.log(`🔄 Found old connection state: ${key}`)
        foundOldState = true
        localStorage.removeItem(key)
      }
    }

    if (foundOldState) {
      console.log('✅ Migrated old connection state, cleaned up old keys')
    }
  } catch (error) {
    console.error('❌ Failed to migrate old connection state:', error)
  }
}

// ============================================================================
// DEBUG UTILITIES
// ============================================================================

/**
 * Retrieve all wallet storage state for debugging purposes
 */
export function getDebugStorageInfo(): Record<string, unknown> {
  try {
    return {
      connectionState: getConnectionState(),
      navigationSnapshot: getNavigationSnapshot(),
      preferences: getConnectionPreferences(),
      storageAvailable: isStorageAvailable(),
      connectionAge: getConnectionAge(),
      isFresh: isConnectionStateFresh(),
      shouldReconnect: shouldBeConnected(),
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Remove all wallet-related data from storage (debugging/testing only)
 */
export function clearAllWalletStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
    console.log('🗑️ Cleared all wallet storage')
  } catch (error) {
    console.error('❌ Failed to clear all wallet storage:', error)
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Expose debug utilities on window object in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).walletDebug = {
    getStorageInfo: getDebugStorageInfo,
    clearAllStorage: clearAllWalletStorage,
    getState: getConnectionState,
    shouldBeConnected,
  }

  console.log('🔧 Wallet debug utilities available: window.walletDebug')
}


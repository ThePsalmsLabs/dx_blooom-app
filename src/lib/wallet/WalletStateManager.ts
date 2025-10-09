/**
 * WalletStateManager - Centralized Wallet State Management
 * File: src/lib/wallet/WalletStateManager.ts
 * 
 * A singleton class that manages wallet state across the entire application.
 * Provides event-driven updates, cross-tab synchronization, and automatic recovery.
 * 
 * Features:
 * - Event-driven architecture with TypeScript-safe events
 * - Cross-tab synchronization via BroadcastChannel
 * - Connection health monitoring with automatic recovery
 * - Persistence integration with existing localStorage system
 * - Metrics tracking for analytics and debugging
 */

import { EventEmitter } from 'events'
import {
  saveConnectionState,
  getConnectionState,
  shouldBeConnected,
  clearConnectionState,
  recordDisconnection,
  refreshConnectionTimestamp,
  type WalletConnectionState
} from './connection-persistence'

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface WalletState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  connectorId: string | null
  isConnecting: boolean
  error: Error | null
  lastConnected: number | null
  connectionAttempts: number
  isHealthy: boolean
}

export interface WalletMetrics {
  totalConnections: number
  totalDisconnections: number
  autoReconnectAttempts: number
  autoReconnectSuccesses: number
  averageConnectionTime: number
  lastConnectionTime: number
  errorCount: number
  uptime: number
}

export type WalletEventType = 
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'error'
  | 'reconnecting'
  | 'health-check'
  | 'metrics-updated'

export interface WalletEvent {
  readonly type: WalletEventType
  readonly state: WalletState
  readonly timestamp: number
  readonly source: 'user' | 'auto' | 'system'
  readonly metadata?: Record<string, unknown>
}

export type WalletEventListener = (event: WalletEvent) => void

// ============================================================================
// WALLET STATE MANAGER CLASS
// ============================================================================

class WalletStateManagerClass extends EventEmitter {
  private state: WalletState
  private metrics: WalletMetrics
  private healthCheckInterval: NodeJS.Timeout | null = null
  private broadcastChannel: BroadcastChannel | null = null
  private isInitialized = false
  private readonly HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
  private readonly MAX_CONNECTION_ATTEMPTS = 5

  constructor() {
    super()
    
    // Initialize default state
    this.state = {
      isConnected: false,
      address: null,
      chainId: null,
      connectorId: null,
      isConnecting: false,
      error: null,
      lastConnected: null,
      connectionAttempts: 0,
      isHealthy: true
    }

    // Initialize metrics
    this.metrics = {
      totalConnections: 0,
      totalDisconnections: 0,
      autoReconnectAttempts: 0,
      autoReconnectSuccesses: 0,
      averageConnectionTime: 0,
      lastConnectionTime: 0,
      errorCount: 0,
      uptime: Date.now()
    }

    // Bind methods to preserve context
    this.handleStorageChange = this.handleStorageChange.bind(this)
    this.handleBroadcastMessage = this.handleBroadcastMessage.bind(this)
    this.performHealthCheck = this.performHealthCheck.bind(this)
  }

  // ========================================================================
  // INITIALIZATION AND CLEANUP
  // ========================================================================

  /**
   * Initialize the wallet state manager
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('WalletStateManager already initialized')
      return
    }

    console.log('🔧 Initializing WalletStateManager...')

    try {
      // Load initial state from persistence
      this.loadPersistedState()

      // Set up cross-tab communication
      this.setupBroadcastChannel()

      // Set up storage event listeners
      this.setupStorageListeners()

      // Start health monitoring
      this.startHealthChecking()

      this.isInitialized = true
      console.log('✅ WalletStateManager initialized successfully')

      // Emit initialization event
      this.emitEvent('health-check', 'system', { initialized: true })
      
    } catch (error) {
      console.error('❌ Failed to initialize WalletStateManager:', error)
      this.updateError(error as Error)
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    console.log('🧹 Cleaning up WalletStateManager...')

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange)
    }

    this.removeAllListeners()
    this.isInitialized = false
  }

  // ========================================================================
  // PUBLIC STATE ACCESS
  // ========================================================================

  /**
   * Get current wallet state
   */
  public getState(): WalletState {
    return { ...this.state }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): WalletMetrics {
    return { ...this.metrics }
  }

  /**
   * Check if wallet should be connected based on persistence
   */
  public shouldAutoConnect(): boolean {
    return shouldBeConnected()
  }

  // ========================================================================
  // STATE UPDATE METHODS
  // ========================================================================

  /**
   * Update connection state
   */
  public updateConnection(
    address: string,
    chainId: number,
    connectorId: string,
    source: 'user' | 'auto' = 'user'
  ): void {
    const wasConnected = this.state.isConnected
    const connectionStart = this.state.isConnecting ? Date.now() : 0

    this.state = {
      ...this.state,
      isConnected: true,
      address,
      chainId,
      connectorId,
      isConnecting: false,
      error: null,
      lastConnected: Date.now(),
      connectionAttempts: 0,
      isHealthy: true
    }

    // Update metrics
    if (!wasConnected) {
      this.metrics.totalConnections++
      if (connectionStart > 0) {
        const connectionTime = Date.now() - connectionStart
        this.metrics.lastConnectionTime = connectionTime
        this.updateAverageConnectionTime(connectionTime)
      }
    }

    if (source === 'auto') {
      this.metrics.autoReconnectSuccesses++
    }

    // Persist state
    saveConnectionState(address, connectorId, chainId)

    // Refresh timestamp for health monitoring
    refreshConnectionTimestamp()

    // Broadcast and emit events
    this.broadcastStateChange()
    this.emitEvent('connected', source, { address, chainId, connectorId })

    console.log(`✅ Wallet connected (${source}):`, { address, chainId, connectorId })
  }

  /**
   * Update connecting state
   */
  public updateConnecting(isConnecting: boolean, source: 'user' | 'auto' = 'user'): void {
    const wasConnecting = this.state.isConnecting

    this.state = {
      ...this.state,
      isConnecting,
      error: isConnecting ? null : this.state.error
    }

    if (isConnecting && !wasConnecting) {
      this.state.connectionAttempts++
      if (source === 'auto') {
        this.metrics.autoReconnectAttempts++
      }
    }

    // Broadcast and emit events
    this.broadcastStateChange()
    if (isConnecting) {
      this.emitEvent('connecting', source)
    }
  }

  /**
   * Update disconnection state
   */
  public updateDisconnection(source: 'user' | 'auto' = 'user', error?: Error): void {
    const wasConnected = this.state.isConnected

    this.state = {
      ...this.state,
      isConnected: false,
      address: null,
      chainId: null,
      connectorId: null,
      isConnecting: false,
      error: error || null,
      connectionAttempts: 0
    }

    // Update metrics
    if (wasConnected) {
      this.metrics.totalDisconnections++
    }

    if (error) {
      this.metrics.errorCount++
    }

    // Handle persistence
    if (source === 'user') {
      recordDisconnection() // Clear persistence for user-initiated disconnections
    }

    // Broadcast and emit events
    this.broadcastStateChange()
    this.emitEvent('disconnected', source, { error: error?.message })

    console.log(`🔌 Wallet disconnected (${source}):`, error?.message || 'No error')
  }

  /**
   * Update error state
   */
  public updateError(error: Error, source: 'user' | 'auto' | 'system' = 'system'): void {
    this.state = {
      ...this.state,
      error,
      isConnecting: false,
      isHealthy: false
    }

    this.metrics.errorCount++

    // Broadcast and emit events
    this.broadcastStateChange()
    this.emitEvent('error', source, { error: error.message, stack: error.stack })

    console.error('❌ Wallet error:', error)
  }

  // ========================================================================
  // EVENT MANAGEMENT
  // ========================================================================

  /**
   * Add typed event listener
   */
  public on(event: WalletEventType, listener: WalletEventListener): this {
    return super.on(event, listener)
  }

  /**
   * Remove typed event listener
   */
  public off(event: WalletEventType, listener: WalletEventListener): this {
    return super.off(event, listener)
  }

  /**
   * Emit wallet event
   */
  private emitEvent(
    type: WalletEventType,
    source: 'user' | 'auto' | 'system',
    metadata?: Record<string, unknown>
  ): void {
    const event: WalletEvent = {
      type,
      state: this.getState(),
      timestamp: Date.now(),
      source,
      metadata
    }

    this.emit(type, event)

    // Also emit a general 'wallet-event' for global listeners
    this.emit('wallet-event', event)
  }

  // ========================================================================
  // CROSS-TAB SYNCHRONIZATION
  // ========================================================================

  /**
   * Set up broadcast channel for cross-tab communication
   */
  private setupBroadcastChannel(): void {
    if (typeof window === 'undefined' || !window.BroadcastChannel) {
      console.warn('BroadcastChannel not available, cross-tab sync disabled')
      return
    }

    try {
      this.broadcastChannel = new BroadcastChannel('wallet-state-sync')
      this.broadcastChannel.addEventListener('message', this.handleBroadcastMessage)
      console.log('📡 Cross-tab synchronization enabled')
    } catch (error) {
      console.warn('Failed to setup BroadcastChannel:', error)
    }
  }

  /**
   * Handle messages from other tabs
   */
  private handleBroadcastMessage(event: MessageEvent): void {
    try {
      const { type, state, timestamp } = event.data

      if (type === 'wallet-state-update' && state && timestamp) {
        // Only update if the message is newer than our current state
        if (timestamp > (this.state.lastConnected || 0)) {
          console.log('📡 Syncing state from another tab')
          this.state = { ...this.state, ...state }
          this.emitEvent('health-check', 'system', { syncedFromTab: true })
        }
      }
    } catch (error) {
      console.warn('Failed to handle broadcast message:', error)
    }
  }

  /**
   * Broadcast state changes to other tabs
   */
  private broadcastStateChange(): void {
    if (!this.broadcastChannel) return

    try {
      this.broadcastChannel.postMessage({
        type: 'wallet-state-update',
        state: this.state,
        timestamp: Date.now()
      })
    } catch (error) {
      console.warn('Failed to broadcast state change:', error)
    }
  }

  // ========================================================================
  // PERSISTENCE AND STORAGE
  // ========================================================================

  /**
   * Load initial state from persistence
   */
  private loadPersistedState(): void {
    try {
      const persistedState = getConnectionState()
      
      if (persistedState && shouldBeConnected()) {
        this.state = {
          ...this.state,
          address: persistedState.address,
          chainId: persistedState.chainId,
          connectorId: persistedState.connectorId,
          lastConnected: persistedState.timestamp,
          // Don't set isConnected=true here, let auto-reconnect handle it
        }
        
        console.log('📦 Loaded persisted wallet state')
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error)
    }
  }

  /**
   * Set up storage event listeners for cross-tab persistence sync
   */
  private setupStorageListeners(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('storage', this.handleStorageChange)
  }

  /**
   * Handle storage changes from other tabs
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.key?.includes('dxbloom_wallet_')) {
      console.log('🔄 Storage changed in another tab, reloading state')
      this.loadPersistedState()
      this.emitEvent('health-check', 'system', { storageSync: true })
    }
  }

  // ========================================================================
  // HEALTH MONITORING
  // ========================================================================

  /**
   * Start periodic health checks
   */
  private startHealthChecking(): void {
    this.performHealthCheck() // Initial check
    
    this.healthCheckInterval = setInterval(
      this.performHealthCheck,
      this.HEALTH_CHECK_INTERVAL
    )
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    try {
      const now = Date.now()
      const timeSinceLastConnection = this.state.lastConnected ? 
        now - this.state.lastConnected : Infinity

      // Check if connection is stale (older than 1 hour)
      const isStale = timeSinceLastConnection > 60 * 60 * 1000

      // Check if we should be connected but aren't
      const shouldBeConnectedNow = shouldBeConnected()
      const connectionMismatch = shouldBeConnectedNow && !this.state.isConnected && !this.state.isConnecting

      // Update health status
      const wasHealthy = this.state.isHealthy
      this.state.isHealthy = !isStale && !connectionMismatch && !this.state.error

      // Emit health check event
      this.emitEvent('health-check', 'system', {
        isHealthy: this.state.isHealthy,
        timeSinceLastConnection,
        isStale,
        connectionMismatch,
        shouldBeConnectedNow
      })

      // Log health status changes
      if (wasHealthy !== this.state.isHealthy) {
        console.log(`🏥 Wallet health status changed: ${this.state.isHealthy ? 'healthy' : 'unhealthy'}`)
      }

      // Refresh connection timestamp if connected
      if (this.state.isConnected) {
        refreshConnectionTimestamp()
      }

    } catch (error) {
      console.error('Health check failed:', error)
      this.updateError(error as Error)
    }
  }

  // ========================================================================
  // METRICS UTILITIES
  // ========================================================================

  /**
   * Update average connection time
   */
  private updateAverageConnectionTime(newTime: number): void {
    const totalConnections = this.metrics.totalConnections
    const currentAverage = this.metrics.averageConnectionTime
    
    this.metrics.averageConnectionTime = 
      ((currentAverage * (totalConnections - 1)) + newTime) / totalConnections
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      ...this.metrics,
      totalConnections: 0,
      totalDisconnections: 0,
      autoReconnectAttempts: 0,
      autoReconnectSuccesses: 0,
      averageConnectionTime: 0,
      lastConnectionTime: 0,
      errorCount: 0,
      uptime: Date.now()
    }

    this.emitEvent('metrics-updated', 'system', { reset: true })
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Create singleton instance
const WalletStateManager = new WalletStateManagerClass()

// Auto-initialize on import in browser environment
if (typeof window !== 'undefined') {
  // Delay initialization to avoid SSR issues
  setTimeout(() => {
    WalletStateManager.initialize()
  }, 100)
}

// ============================================================================
// EXPORTS
// ============================================================================

export { WalletStateManager }

// Debug utilities for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).WalletStateManager = WalletStateManager
  console.log('🔧 WalletStateManager available as window.WalletStateManager')
}
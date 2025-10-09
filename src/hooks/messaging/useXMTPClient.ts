/**
 * XMTP Client Hook
 * 
 * Core hook for managing XMTP client connection and lifecycle.
 * Integrates with existing wallet connection infrastructure.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Client } from '@xmtp/xmtp-js'
import { useWalletClient } from 'wagmi'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { XMTP_CONFIG, MESSAGING_FEATURES } from '@/lib/messaging/xmtp-config'
import type { XMTPClientResult } from '@/types/messaging'
import { MessagingError, MessagingErrorCode } from '@/types/messaging'
import { WalletStateManager } from '@/lib/wallet/WalletStateManager'

/**
 * XMTP Client Hook
 * 
 * Manages XMTP client connection with automatic wallet integration.
 * Follows existing hook patterns from the platform.
 */
// Global client cache to prevent multiple initializations
let globalXMTPClient: Client | null = null
let globalConnectionPromise: Promise<Client> | null = null

export function useXMTPClient(): XMTPClientResult {
  // ===== STATE MANAGEMENT =====
  
  const [client, setClient] = useState<Client | null>(globalXMTPClient)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Track connection attempts to prevent multiple simultaneous connections
  const connectingRef = useRef(false)
  const hasInitialized = useRef(false)
  
  // ===== EXISTING INTEGRATIONS =====
  
  const walletUI = useWalletConnectionUI()
  const { address, isConnected: isWalletConnected } = walletUI
  const { data: walletClient } = useWalletClient()
  
  // ===== CONNECTION STATUS =====
  
  const isConnected = !!client && !isConnecting
  
  // ===== CORE XMTP CLIENT METHODS =====
  
  /**
   * Connect to XMTP Network
   * 
   * Establishes XMTP client connection using the connected wallet.
   * Integrates with existing wallet connection infrastructure.
   */
  const connect = useCallback(async (): Promise<void> => {
    // Feature flag check
    if (!MESSAGING_FEATURES.enabled) {
      throw new MessagingError(
        'Messaging features are currently disabled',
        MessagingErrorCode.CLIENT_NOT_CONNECTED
      )
    }
    
    // Return early if client already exists
    if (globalXMTPClient) {
      setClient(globalXMTPClient)
      return
    }
    
    // Return the existing promise if connection is in progress
    if (globalConnectionPromise) {
      try {
        const existingClient = await globalConnectionPromise
        setClient(existingClient)
        return
      } catch (error) {
        // If existing promise failed, we'll continue with new connection
        globalConnectionPromise = null
      }
    }
    
    // Prevent multiple connection attempts
    if (connectingRef.current || isConnecting) {
      return
    }
    
    // Validate wallet connection
    if (!isWalletConnected || !address) {
      throw new MessagingError(
        'Wallet must be connected to enable messaging',
        MessagingErrorCode.WALLET_NOT_CONNECTED
      )
    }
    
    connectingRef.current = true
    setIsConnecting(true)
    setError(null)
    
    try {
      console.log('🔗 Connecting to XMTP network...')
      
      // Get wallet client from wagmi (integrates with existing wallet infrastructure)
      if (!walletClient) {
        throw new MessagingError(
          'Wallet client not available for XMTP connection',
          MessagingErrorCode.WALLET_NOT_CONNECTED
        )
      }
      
      // Create connection promise to share across instances
      globalConnectionPromise = Client.create(walletClient as Parameters<typeof Client.create>[0], {
        env: XMTP_CONFIG.env,
        appVersion: 'onchain-content-platform/1.0.0',
      })
      
      const xmtpClient = await globalConnectionPromise
      
      // Cache globally to prevent re-initialization
      globalXMTPClient = xmtpClient
      setClient(xmtpClient)
      
      console.log('✅ XMTP client connected successfully')
      console.log(`📧 Address: ${xmtpClient.address}`)
      console.log(`🌐 Environment: ${XMTP_CONFIG.env}`)
      
    } catch (connectionError) {
      const error = connectionError instanceof Error 
        ? connectionError 
        : new Error('Unknown XMTP connection error')
      
      console.error('❌ XMTP connection failed:', error)
      
      // Clear failed connection attempt
      globalConnectionPromise = null
      
      setError(new MessagingError(
        `Failed to connect to XMTP: ${error.message}`,
        MessagingErrorCode.NETWORK_ERROR,
        { originalError: error, address, env: XMTP_CONFIG.env }
      ))
    } finally {
      setIsConnecting(false)
      connectingRef.current = false
    }
  }, [isWalletConnected, address, walletClient])
  
  /**
   * Disconnect from XMTP Network
   * 
   * Cleanly disconnects the XMTP client and resets state.
   */
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      console.log('🔌 Disconnecting from XMTP network...')
      
      // Clear global cache
      globalXMTPClient = null
      globalConnectionPromise = null
      
      setClient(null)
      setError(null)
      hasInitialized.current = false
      
      console.log('✅ XMTP client disconnected')
      
    } catch (disconnectionError) {
      const error = disconnectionError instanceof Error 
        ? disconnectionError 
        : new Error('Unknown XMTP disconnection error')
      
      console.error('❌ XMTP disconnection failed:', error)
      setError(error)
    }
  }, [])
  
  // ===== AUTOMATIC CONNECTION MANAGEMENT =====
  
  /**
   * Auto-connect when wallet becomes available (DISABLED FOR MANUAL CONTROL)
   * 
   * We disable auto-connection to prevent multiple wallet signature requests.
   * Users must explicitly trigger messaging to initialize XMTP.
   */
  useEffect(() => {
    // Check if we have a cached client for this address
    if (globalXMTPClient && address === globalXMTPClient.address && !client) {
      console.log('🔄 Restoring cached XMTP client for address:', address)
      setClient(globalXMTPClient)
    } else if (globalXMTPClient && address !== globalXMTPClient.address) {
      // Address changed, clear stale client
      console.log('🧹 Address changed, clearing stale XMTP client')
      globalXMTPClient = null
      globalConnectionPromise = null
      setClient(null)
    }
  }, [address, client])
  
  /**
   * Auto-disconnect when wallet disconnects
   * 
   * Automatically disconnects XMTP when wallet disconnects
   * to maintain consistent state.
   */
  useEffect(() => {
    if (!isWalletConnected && client) {
      console.log('👋 Wallet disconnected, disconnecting XMTP...')
      disconnect().catch(error => {
        console.warn('Auto-disconnection from XMTP failed:', error)
      })
    }
  }, [isWalletConnected, client, disconnect])
  
  /**
   * CRITICAL: Auto-reconnect XMTP when wallet reconnects after navigation
   * 
   * This fixes the issue where XMTP client becomes stale after navigation
   * when wallet disconnects and reconnects.
   */
  useEffect(() => {
    if (isWalletConnected && address && !client && !isConnecting && !connectingRef.current) {
      console.log('🔄 Wallet reconnected after navigation, auto-connecting XMTP...')
      connect().catch(error => {
        console.warn('Auto-reconnection to XMTP failed:', error)
      })
    }
  }, [isWalletConnected, address, client, isConnecting, connect])
  
  /**
   * CRITICAL: Listen to WalletStateManager events for XMTP integration
   * 
   * This ensures XMTP client stays synchronized with wallet state changes
   * managed by our centralized wallet state system.
   */
  useEffect(() => {
    const handleWalletDisconnected = () => {
      if (client) {
        console.log('🔔 WalletStateManager: Wallet disconnected, disconnecting XMTP...')
        disconnect().catch(error => {
          console.warn('WalletStateManager-triggered XMTP disconnection failed:', error)
        })
      }
    }
    
    const handleWalletConnected = (event: any) => {
      if (event.state.isConnected && event.state.address && !client && !isConnecting) {
        console.log('🔔 WalletStateManager: Wallet connected, auto-connecting XMTP...')
        connect().catch(error => {
          console.warn('WalletStateManager-triggered XMTP connection failed:', error)
        })
      }
    }
    
    // Subscribe to wallet state events
    WalletStateManager.on('disconnected', handleWalletDisconnected)
    WalletStateManager.on('connected', handleWalletConnected)
    
    return () => {
      WalletStateManager.off('disconnected', handleWalletDisconnected)
      WalletStateManager.off('connected', handleWalletConnected)
    }
  }, [client, isConnecting, connect, disconnect])
  
  // ===== CLEANUP =====
  
  /**
   * Cleanup on unmount
   * 
   * Ensures clean disconnection when component unmounts.
   */
  useEffect(() => {
    return () => {
      if (client) {
        disconnect().catch(error => {
          console.warn('Cleanup disconnection from XMTP failed:', error)
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  // ===== RETURN HOOK RESULT =====
  
  return {
    client,
    isConnected,
    isConnecting,
    isInitializing: false,
    error,
    connect,
    disconnect,
  }
}
/**
 * XMTP Client Hook
 * 
 * Core hook for managing XMTP client connection and lifecycle.
 * Integrates with existing wallet connection infrastructure.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Client, type Signer } from '@xmtp/browser-sdk'
import { useWalletClient } from 'wagmi'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { XMTP_CONFIG, MESSAGING_FEATURES } from '@/lib/messaging/xmtp-config'
import type { XMTPClientResult, XMTPContentTypes } from '@/types/messaging'
import { MessagingError, MessagingErrorCode } from '@/types/messaging'
// REMOVED: WalletStateManager import - wallet system deleted

/**
 * XMTP Client Hook
 * 
 * Manages XMTP client connection with automatic wallet integration.
 * Follows existing hook patterns from the platform.
 */
// Global client cache to prevent multiple initializations
let globalXMTPClient: Client<XMTPContentTypes> | null = null
let globalConnectionPromise: Promise<Client<XMTPContentTypes>> | null = null

export function useXMTPClient(): XMTPClientResult {
  // ===== STATE MANAGEMENT =====
  
  const [client, setClient] = useState<Client<XMTPContentTypes> | null>(globalXMTPClient)
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
      
      // Create XMTP signer from wagmi wallet client
      const signer: Signer = {
        type: 'EOA' as const,
        getIdentifier: async () => ({ 
          identifierKind: 'Ethereum' as const, 
          identifier: walletClient.account.address 
        }),
        signMessage: async (message: string) => {
          const signature = await walletClient.signMessage({ 
            message,
            account: walletClient.account 
          })
          // Convert hex signature to Uint8Array
          return new Uint8Array(
            signature.slice(2).match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
          )
        },
      }
      
      // Create connection promise to share across instances
      globalConnectionPromise = Client.create(signer, {
        env: XMTP_CONFIG.env,
        appVersion: 'onchain-content-platform/1.0.0',
      })
      
      const xmtpClient = await globalConnectionPromise
      
      // Cache globally to prevent re-initialization
      globalXMTPClient = xmtpClient
      setClient(xmtpClient)
      
      console.log('✅ XMTP client connected successfully')
      console.log(`📧 Inbox ID: ${xmtpClient.inboxId}`)
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
    // Note: inboxId is derived from the wallet address, so we check wallet address changes
    if (globalXMTPClient && !client) {
      console.log('🔄 Restoring cached XMTP client with inbox:', globalXMTPClient.inboxId)
      setClient(globalXMTPClient)
    } else if (globalXMTPClient && address && globalXMTPClient.inboxId) {
      // Address changed significantly, clear stale client
      // In practice, same address = same inboxId, but we check for wallet disconnect/reconnect
      console.log('🔄 Checking XMTP client validity for current wallet')
      // Keep the client unless explicitly disconnected
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
   * REMOVED: Auto-reconnect XMTP when wallet reconnects after navigation
   * 
   * This was causing unwanted signature prompts and conflicted with the manual-only policy.
   * Cache restoration logic above handles reconnection without requiring signatures.
   * Components should use useMiniAppXMTP for MiniApp context which handles this properly.
   */
  // Auto-reconnection disabled - cache restoration handles persistence without re-signing
  
  // REMOVED: WalletStateManager integration - wallet system deleted
  // XMTP will now rely on standard wagmi hooks for wallet state
  
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
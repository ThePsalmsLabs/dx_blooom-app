/**
 * MiniApp XMTP Integration Hook
 * File: src/hooks/miniapp/useMiniAppXMTP.ts
 * 
 * Provides seamless XMTP integration for MiniApp context by combining
 * the new wallet system with XMTP client functionality.
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { Client, type Signer } from '@xmtp/browser-sdk'
import { useMiniAppWallet } from './useMiniAppWallet'
import { createMiniAppXMTPSigner, detectMiniAppContext } from '@/shared/xmtp/miniapp-signer'
import { XMTP_CONFIG, MESSAGING_FEATURES } from '@/lib/messaging/xmtp-config'
import type { XMTPClientResult, XMTPContentTypes } from '@/types/messaging'
import { MessagingError, MessagingErrorCode } from '@/types/messaging'

// Global client cache to prevent multiple initializations
let globalXMTPClient: Client<XMTPContentTypes> | null = null
let globalConnectionPromise: Promise<Client<XMTPContentTypes>> | null = null
let globalClientAddress: string | null = null

export interface MiniAppXMTPState extends XMTPClientResult {
  readonly canConnect: boolean
  readonly isMiniAppContext: boolean
}

/**
 * MiniApp XMTP Hook - Seamless XMTP integration for MiniApp
 * 
 * Integrates with useMiniAppWallet to provide XMTP messaging capabilities
 * with proper signer management and automatic wallet integration.
 */
export function useMiniAppXMTP(): MiniAppXMTPState {
  // ===== WALLET INTEGRATION =====
  
  const wallet = useMiniAppWallet()
  const { isConnected, address, signMessage } = wallet
  
  // ===== XMTP V3 CLIENT STATE =====
  
  const [client, setClient] = useState<Client<XMTPContentTypes> | null>(null)
  const [error, setError] = useState<MessagingError | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // ===== CONTEXT DETECTION =====
  
  const context = detectMiniAppContext()
  const isMiniAppContext = context.isMiniApp
  const canConnect = isMiniAppContext && isConnected && !!address && !!signMessage
  
  // ===== CONNECTION STATUS =====
  
  const isConnectedToXMTP = !!client && !isConnecting
  
  // ===== CORE XMTP METHODS =====
  
  /**
   * Connect to XMTP Network using MiniApp wallet
   */
  const connect = useCallback(async (): Promise<void> => {
    // Feature flag check
    if (!MESSAGING_FEATURES.enabled) {
      throw new MessagingError(
        'Messaging features are currently disabled',
        MessagingErrorCode.CLIENT_NOT_CONNECTED
      )
    }
    
    // Return early if client already exists and matches current address
    if (globalXMTPClient && globalClientAddress === address) {
      setClient(globalXMTPClient)
      return
    }
    
    // Clear stale client if address changed
    if (globalXMTPClient && globalClientAddress !== address) {
      console.log('🧹 Address changed, clearing stale XMTP client')
      globalXMTPClient = null
      globalConnectionPromise = null
      globalClientAddress = null
    }
    
    // Return the existing promise if connection is in progress
    if (globalConnectionPromise) {
      try {
        const existingClient = await globalConnectionPromise
        setClient(existingClient)
        return
      } catch (error) {
        // If existing promise failed, continue with new connection
        globalConnectionPromise = null
      }
    }
    
    // Validate prerequisites
    if (!isMiniAppContext) {
      throw new MessagingError(
        'XMTP can only be used in MiniApp context',
        MessagingErrorCode.CLIENT_NOT_CONNECTED
      )
    }
    
    if (!isConnected || !address) {
      throw new MessagingError(
        'Wallet must be connected to enable messaging',
        MessagingErrorCode.WALLET_NOT_CONNECTED
      )
    }
    
    if (!signMessage) {
      throw new MessagingError(
        'Message signing not available from wallet',
        MessagingErrorCode.WALLET_NOT_CONNECTED
      )
    }
    
    setIsConnecting(true)
    setError(null)
    
    try {
      console.log('🔗 Connecting to XMTP network with MiniApp wallet...')
      console.log('📋 XMTP Config:', { env: XMTP_CONFIG.env, address })
      
      // Create XMTP signer from wallet state
      console.log('🔐 Creating XMTP signer...')
      const signer = createMiniAppXMTPSigner(address, signMessage)
      console.log('✅ Signer created successfully')
      
      // Test signer functionality
      console.log('🧪 Testing signer...')
      const signerAddress = await signer.getAddress()
      console.log('📍 Signer address:', signerAddress)
      
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`Signer address mismatch: expected ${address}, got ${signerAddress}`)
      }
      
      // Create connection promise to share across instances using V3 browser SDK
      console.log('🚀 Initializing XMTP client...')
      console.log('📋 XMTP Config details:', {
        env: XMTP_CONFIG.env,
        envType: typeof XMTP_CONFIG.env,
        envValue: JSON.stringify(XMTP_CONFIG.env)
      })
      
      // Validate client creation parameters before calling
      const clientConfig = {
        env: XMTP_CONFIG.env,
        appVersion: 'onchain-content-platform/1.0.0',
      }
      
      console.log('🔍 Client config validation:', {
        config: clientConfig,
        signerType: signer.type,
        hasGetAddress: typeof signer.getAddress === 'function',
        hasSignMessage: typeof signer.signMessage === 'function',
        hasGetIdentifier: typeof signer.getIdentifier === 'function'
      })
      
      // Cast to Signer as MiniAppXMTPSigner is compatible with XMTP's EOA Signer type
      globalConnectionPromise = Client.create(signer as Signer, clientConfig)
      
      const xmtpClient = await globalConnectionPromise
      
      // Cache globally to prevent re-initialization
      globalXMTPClient = xmtpClient
      globalClientAddress = address
      setClient(xmtpClient)
      
      console.log('✅ XMTP client connected successfully')
      console.log(`📧 Address: ${address}`)
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
    }
  }, [isMiniAppContext, isConnected, address, signMessage])
  
  /**
   * Disconnect from XMTP Network
   */
  const disconnectXMTP = useCallback(async (): Promise<void> => {
    try {
      console.log('🔌 Disconnecting from XMTP network...')
      
      // Clear global cache
      globalXMTPClient = null
      globalConnectionPromise = null
      globalClientAddress = null
      
      setClient(null)
      setError(null)
      
      console.log('✅ XMTP client disconnected')
      
    } catch (disconnectionError) {
      const error = disconnectionError instanceof Error 
        ? disconnectionError 
        : new Error('Unknown XMTP disconnection error')
      
      console.error('❌ XMTP disconnection failed:', error)
      setError(new MessagingError(
        `Failed to disconnect from XMTP: ${error.message}`,
        MessagingErrorCode.NETWORK_ERROR,
        { originalError: error }
      ))
    }
  }, [])
  
  // ===== AUTOMATIC CONNECTION MANAGEMENT =====
  
  /**
   * Auto-disconnect when wallet disconnects
   */
  useEffect(() => {
    if (!isConnected && client) {
      console.log('👋 Wallet disconnected, disconnecting XMTP...')
      disconnectXMTP().catch((error: Error) => {
        console.warn('Auto-disconnection from XMTP failed:', error)
      })
    }
  }, [isConnected, client, disconnectXMTP])
  
  /**
   * Check for cached client when address becomes available
   */
  useEffect(() => {
    if (globalXMTPClient && address === globalClientAddress && !client) {
      console.log('🔄 Restoring cached XMTP client for address:', address)
      setClient(globalXMTPClient)
    }
  }, [address, client])
  
  // ===== RETURN HOOK RESULT =====
  
  return {
    client,
    isConnected: isConnectedToXMTP,
    isConnecting,
    isInitializing: false,
    error,
    connect,
    disconnect: disconnectXMTP,
    canConnect,
    isMiniAppContext
  }
}
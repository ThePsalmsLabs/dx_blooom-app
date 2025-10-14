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
import { logger } from '@/lib/utils/logger'
import { initXMTP, isXMTPInitialized } from '@/lib/xmtp/initXMTP'

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
      logger.xmtp.info('Address changed, clearing stale XMTP client', { 
        previousAddress: globalClientAddress, 
        newAddress: address 
      })
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
      logger.xmtp.info('Connecting to XMTP network with MiniApp wallet')
      logger.xmtp.debug('XMTP Config', { env: XMTP_CONFIG.env, address })
      
      // ===== STEP 1: Initialize XMTP Browser SDK =====
      // This MUST happen before Client.create() to ensure WASM is properly loaded
      if (!isXMTPInitialized()) {
        logger.xmtp.info('Initializing XMTP Browser SDK (first time setup)')
        await initXMTP()
        logger.xmtp.debug('XMTP Browser SDK initialized successfully')
      } else {
        logger.xmtp.debug('XMTP Browser SDK already initialized')
      }
      
      // ===== STEP 2: Create XMTP signer from wallet state =====
      logger.xmtp.debug('Creating XMTP signer')
      const signer = createMiniAppXMTPSigner(address, signMessage)
      logger.xmtp.debug('Signer created successfully')
      
      // ===== STEP 3: Test signer functionality =====
      logger.xmtp.debug('Testing signer functionality')
      const signerAddress = await signer.getAddress()
      logger.xmtp.debug('Signer address verified', { signerAddress })
      
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`Signer address mismatch: expected ${address}, got ${signerAddress}`)
      }
      
      // ===== STEP 4: Create XMTP client =====
      // Per official docs: https://docs.xmtp.org/chat-apps/sdks/browser
      // Client.create() takes minimal options - no env or apiUrl needed!
      logger.xmtp.info('Creating XMTP client instance')
      
      // Cast to Signer as MiniAppXMTPSigner is compatible with XMTP's EOA Signer type
      // Note: dbEncryptionKey is not used for encryption in browser environments
      globalConnectionPromise = Client.create(signer as Signer, {
        // Empty config or minimal options as per official docs
      })
      
      const xmtpClient = await globalConnectionPromise
      logger.xmtp.info('XMTP client created successfully')
      
      // Cache globally to prevent re-initialization
      globalXMTPClient = xmtpClient
      globalClientAddress = address
      setClient(xmtpClient)
      
      logger.xmtp.info('XMTP client connected successfully', {
        address,
        environment: XMTP_CONFIG.env
      })
      
    } catch (connectionError) {
      const error = connectionError instanceof Error 
        ? connectionError 
        : new Error('Unknown XMTP connection error')
      
      logger.xmtp.error('XMTP connection failed', { address, env: XMTP_CONFIG.env }, error)
      
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
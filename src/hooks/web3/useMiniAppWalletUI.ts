/**
 * MiniApp Wallet UI Hook
 * File: src/hooks/web3/useMiniAppWalletUI.ts
 * 
 * This hook provides a unified wallet UI interface specifically for MiniApp contexts.
 * It bridges the gap between the MiniApp wallet connection system and the regular
 * AppLayout UI components, ensuring state synchronization and proper connection handling.
 * 
 * The issue was that the MiniApp layout uses a separate wagmi provider instance
 * from the regular app, causing state synchronization issues between the wallet
 * connection state and the UI display state.
 */

import { useCallback, useMemo, useState, useEffect } from 'react'
import { useChainId, useDisconnect } from 'wagmi'
import { useWalletConnectionUI } from '@/hooks/ui/integration'
import { formatAddress } from '@/lib/utils'
import { useMiniAppWalletConnect } from './useMiniAppWalletConnect'
import type { EnhancedWalletConnectionUI } from '@/hooks/ui/integration'
import type { Connector } from 'wagmi'
import {
  storeWalletState,
  sendWalletStateToParent,
  isMiniAppContext
} from '@/lib/utils/miniapp-communication'

/**
 * MiniApp Wallet UI Hook
 * 
 * This hook provides the same interface as useWalletConnectionUI but uses
 * the MiniApp-specific wallet connection logic underneath. This ensures
 * that the AppLayout components receive the correct wallet state when
 * running in MiniApp context.
 */
export function useMiniAppWalletUI(): EnhancedWalletConnectionUI {
  // Use unified wallet connection UI directly (aligned with web app)
  // This removes the mock implementation and uses the same patterns as the main web app

  // Use unified wallet connection UI directly - this aligns with web app patterns
  const walletUI = useWalletConnectionUI()
  const chainId = useChainId()
  
  // Simplified miniapp communication for wallet state
  useEffect(() => {
    if (isMiniAppContext() && walletUI.isConnected && walletUI.address) {
      const walletState = {
        isConnected: walletUI.isConnected,
        address: walletUI.address,
        chainId: chainId
      }

      try {
        // Store in localStorage for persistence (aligned with web app)
        storeWalletState(walletState)
        // Send to parent window for communication
        sendWalletStateToParent(walletState)
      } catch (error) {
        console.error('❌ Failed to communicate wallet state:', error)
      }
    }
  }, [walletUI.isConnected, walletUI.address, chainId])
  
  // Return the same interface as web app (no mock implementations)
  return walletUI
}

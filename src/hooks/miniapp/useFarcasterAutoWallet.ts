/**
 * Farcaster Auto-Wallet Hook - Compatibility Layer
 * File: src/hooks/miniapp/useFarcasterAutoWallet.ts
 *
 * This file provides backward compatibility by re-exporting the new
 * useMiniAppWallet hook with the old interface.
 * 
 * @deprecated Use useMiniAppWallet from './useMiniAppWallet' directly for new code
 */

'use client'

import { useMiniAppWallet } from './useMiniAppWallet'
import { useMiniAppUtils } from '@/contexts/UnifiedMiniAppProvider'

interface FarcasterAutoWalletResult {
  readonly isConnected: boolean
  readonly address: string | undefined
  readonly isConnecting: boolean
  readonly isInMiniApp: boolean
  readonly error: Error | null
  readonly connect: () => Promise<void>
  readonly disconnect: () => void
}

/**
 * Legacy hook - Wraps useMiniAppWallet for backward compatibility
 * @deprecated Use useMiniAppWallet directly
 */
export function useFarcasterAutoWallet(): FarcasterAutoWalletResult {
  const wallet = useMiniAppWallet()
  const miniAppUtils = useMiniAppUtils()
  
  return {
    isConnected: wallet.isConnected,
    address: wallet.address || undefined,
    isConnecting: wallet.isConnecting,
    isInMiniApp: miniAppUtils.isMiniApp,
    error: wallet.error ? new Error(wallet.error) : null,
    connect: wallet.connect,
    disconnect: wallet.disconnect
  }
}
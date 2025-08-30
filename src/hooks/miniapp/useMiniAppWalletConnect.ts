/**
 * MiniApp Wallet Connection Bridge Hook
 * File: src/hooks/miniapp/useMiniAppWalletConnect.ts
 *
 * This hook provides a bridge between MiniApp and Web wallet connection states,
 * enabling seamless communication and state synchronization.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  shouldRedirectToMiniApp,
  getWalletState,
  storeWalletState
} from '@/lib/utils/miniapp-communication'

export function useMiniAppWalletConnect() {
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  // Check if we should redirect back to MiniApp
  useEffect(() => {
    const returnUrl = shouldRedirectToMiniApp()
    if (returnUrl) {
      console.log('🔄 Web version detected MiniApp redirect request:', returnUrl)
      setRedirectUrl(returnUrl)
      setShouldRedirect(true)
    }
  }, [])

  const redirectToMiniApp = useCallback(() => {
    if (redirectUrl) {
      console.log('🚀 Redirecting back to MiniApp:', redirectUrl)

      // Store current wallet state before redirect
      const walletState = getWalletState()
      if (walletState) {
        storeWalletState(walletState)
      }

      // Redirect back to MiniApp
      window.location.href = redirectUrl
    }
  }, [redirectUrl])

  const cancelRedirect = useCallback(() => {
    setShouldRedirect(false)
    setRedirectUrl(null)

    // Update URL to remove MiniApp parameters
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('miniapp')
      url.searchParams.delete('return_url')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  return {
    shouldRedirect,
    redirectUrl,
    redirectToMiniApp,
    cancelRedirect
  }
}

/**
 * MiniApp Communication Utility
 * File: src/lib/utils/miniapp-communication.ts
 *
 * This utility handles communication between MiniApp and Web contexts
 * for wallet connection state synchronization.
 */

export interface WalletConnectionState {
  isConnected: boolean
  address: string | null
  chainId: number | null
  timestamp: number
}

/**
 * Check if we're running in a MiniApp context
 */
export const isMiniAppContext = (): boolean => {
  if (typeof window === 'undefined') return false

  // Check URL patterns
  const urlIndicators = window.location.pathname.includes('/mini') ||
                       window.location.search.includes('miniapp=true')

  // Check for Farcaster meta tags
  const metaIndicators = document.querySelector('meta[name="fc:frame"]') !== null ||
                        document.querySelector('meta[name="fc:miniapp"]') !== null

  return urlIndicators || metaIndicators
}

/**
 * Store wallet connection state for MiniApp communication
 */
export const storeWalletState = (state: Partial<WalletConnectionState>): void => {
  if (typeof window === 'undefined') return

  try {
    const currentState: WalletConnectionState = {
      isConnected: false,
      address: null,
      chainId: null,
      timestamp: Date.now(),
      ...JSON.parse(localStorage.getItem('miniapp_wallet_state') || '{}'),
      ...state
    }

    localStorage.setItem('miniapp_wallet_state', JSON.stringify(currentState))

    // Also store in sessionStorage for immediate communication
    sessionStorage.setItem('miniapp_wallet_state', JSON.stringify(currentState))
  } catch (error) {
    console.warn('Failed to store wallet state:', error)
  }
}

/**
 * Retrieve wallet connection state from storage
 */
export const getWalletState = (): WalletConnectionState | null => {
  if (typeof window === 'undefined') return null

  try {
    // First try sessionStorage for immediate communication
    const sessionState = sessionStorage.getItem('miniapp_wallet_state')
    if (sessionState) {
      return JSON.parse(sessionState)
    }

    // Then try localStorage
    const localState = localStorage.getItem('miniapp_wallet_state')
    if (localState) {
      return JSON.parse(localState)
    }
  } catch (error) {
    console.warn('Failed to retrieve wallet state:', error)
  }

  return null
}

/**
 * Send wallet state to parent window (for MiniApp communication)
 */
export const sendWalletStateToParent = (state: Partial<WalletConnectionState>): void => {
  if (typeof window === 'undefined' || !window.parent || window.parent === window) return

  try {
    const message = {
      type: 'MINIAPP_WALLET_STATE',
      state: {
        ...state,
        timestamp: Date.now()
      }
    }

    window.parent.postMessage(message, '*')
  } catch (error) {
    console.warn('Failed to send wallet state to parent:', error)
  }
}

/**
 * Listen for wallet state messages from child windows
 */
export const listenForWalletState = (callback: (state: WalletConnectionState) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}

  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'MINIAPP_WALLET_STATE' && event.data?.state) {
      callback(event.data.state)
    }
  }

  window.addEventListener('message', handleMessage)

  return () => {
    window.removeEventListener('message', handleMessage)
  }
}

/**
 * Generate a communication URL for opening web version
 */
export const generateCommunicationUrl = (baseUrl: string, returnUrl?: string): string => {
  const params = new URLSearchParams()
  params.set('miniapp', 'true')

  if (returnUrl) {
    params.set('return_url', returnUrl)
  }

  return `${baseUrl}?${params.toString()}`
}

/**
 * Check if we should redirect back to MiniApp after wallet connection
 */
export const shouldRedirectToMiniApp = (): string | null => {
  if (typeof window === 'undefined') return null

  const urlParams = new URLSearchParams(window.location.search)
  const returnUrl = urlParams.get('return_url')

  if (returnUrl && urlParams.get('miniapp') === 'true') {
    return returnUrl
  }

  return null
}

/**
 * Clear stored wallet state
 */
export const clearWalletState = (): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('miniapp_wallet_state')
    sessionStorage.removeItem('miniapp_wallet_state')
  } catch (error) {
    console.warn('Failed to clear wallet state:', error)
  }
}

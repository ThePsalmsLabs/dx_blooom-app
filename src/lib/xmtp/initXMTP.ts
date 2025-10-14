/**
 * XMTP Browser SDK v4 Initialization
 * File: src/lib/xmtp/initXMTP.ts
 * 
 * Handles WASM initialization for XMTP browser SDK v4 in Next.js 15
 * environment. Provides proper initialization before Client.create() is called.
 */

'use client'

// Global flag to track initialization state
let isInitialized = false
let initPromise: Promise<void> | null = null

/**
 * Initialize XMTP Browser SDK
 * 
 * For browser-sdk v4, WASM is bundled within the package itself.
 * This function ensures the SDK is properly initialized before use.
 * 
 * Note: The actual WASM initialization happens internally when Client.create()
 * is called. This function serves as a pre-flight check and can be extended
 * if explicit WASM initialization becomes needed.
 */
export async function initXMTP(): Promise<void> {
  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise
  }

  // Return immediately if already initialized
  if (isInitialized) {
    return Promise.resolve()
  }

  // Create initialization promise
  initPromise = (async () => {
    try {
      console.log('🔧 Initializing XMTP Browser SDK...')

      // For browser-sdk v4, we need to ensure the environment is ready
      // The SDK handles WASM loading internally, but we can verify the environment
      if (typeof window === 'undefined') {
        throw new Error('XMTP Browser SDK requires browser environment')
      }

      // Verify required browser APIs are available
      if (!window.indexedDB) {
        console.warn('⚠️ IndexedDB not available - some features may be limited')
      }

      // Check for Worker support (required for XMTP)
      if (typeof Worker === 'undefined') {
        throw new Error('Web Workers not supported - required for XMTP')
      }

      // Check for WebAssembly support
      if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly not supported - required for XMTP')
      }

      // Dynamically import the browser SDK to ensure it's loaded
      // This allows the SDK to set up its internal WASM paths correctly
      await import('@xmtp/browser-sdk')
      
      isInitialized = true
      console.log('✅ XMTP Browser SDK initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize XMTP Browser SDK:', error)
      // Reset state on failure to allow retry
      isInitialized = false
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

/**
 * Check if XMTP is initialized
 */
export function isXMTPInitialized(): boolean {
  return isInitialized
}

/**
 * Reset initialization state (useful for testing)
 */
export function resetXMTPInitialization(): void {
  isInitialized = false
  initPromise = null
  console.log('🔄 XMTP initialization state reset')
}
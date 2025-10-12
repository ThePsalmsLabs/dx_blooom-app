/**
 * XMTP V3 Browser SDK Initialization
 * File: src/lib/xmtp/initXMTP.ts
 * 
 * Handles WASM initialization for XMTP browser SDK in Next.js 15 + Turbopack
 * environment. Solves the Web Worker + WASM file path resolution issue.
 */

'use client'

// Global flag to track initialization state
let isInitialized = false
let initPromise: Promise<void> | null = null

/**
 * Initialize XMTP WASM modules with absolute URLs
 * This solves the Turbopack + Web Worker WASM loading issue
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
      console.log('🔧 Initializing XMTP WASM modules...')

      // Import the WASM initializer dynamically to avoid SSR issues
      const initWasm = await import('@xmtp/wasm-bindings')
      
      // Use absolute URL for WASM file (accessible from Web Workers)
      const wasmUrl = '/xmtp/bindings_wasm_bg.wasm'
      
      // Initialize WASM with absolute URL
      await initWasm.default(wasmUrl)
      
      isInitialized = true
      console.log('✅ XMTP WASM modules initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize XMTP WASM:', error)
      // Reset state on failure to allow retry
      isInitialized = false
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

/**
 * Check if XMTP WASM is initialized
 */
export function isXMTPInitialized(): boolean {
  return isInitialized
}

/**
 * Reset initialization state (useful for testing)
 */
export function resetXMTPInit(): void {
  isInitialized = false
  initPromise = null
}
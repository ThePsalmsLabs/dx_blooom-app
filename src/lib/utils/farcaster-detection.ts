/**
 * Farcaster MiniApp Context Detection Utility
 * File: src/lib/utils/farcaster-detection.ts
 *
 * Official detection method using Farcaster's SDK `isInMiniApp()` function.
 * This is the ONLY reliable way to detect if code is running in a Farcaster MiniApp.
 *
 * Why use the official SDK method?
 * - Verifies actual SDK communication with the Farcaster host
 * - Handles edge cases (ReactNative WebView, iframes, etc.)
 * - Caches results for performance
 * - Prevents false positives from URL-based heuristics
 *
 * Reference: https://miniapps.farcaster.xyz/docs/sdk/is-in-mini-app
 */

'use client'

// ================================================
// TYPES
// ================================================

export interface FarcasterContextDetectionResult {
  /** Official SDK detection result */
  readonly isInMiniApp: boolean

  /** Quick heuristic check (not definitive, for SSR/fallback) */
  readonly isLikelyMiniApp: boolean

  /** Detection method used */
  readonly detectionMethod: 'sdk' | 'heuristic' | 'cached'

  /** Detection timestamp */
  readonly timestamp: number

  /** Any errors during detection */
  readonly error?: string
}

// ================================================
// CACHING
// ================================================

/** Cache for SDK detection results (only cache positive results) */
let cachedSDKResult: boolean | null = null

/** Cache timestamp to allow refresh after some time */
let cacheTimestamp: number | null = null

/** Cache validity duration (5 minutes) */
const CACHE_DURATION_MS = 5 * 60 * 1000

/**
 * Clear the detection cache
 * Use this if context might have changed (rare)
 */
export function clearFarcasterDetectionCache(): void {
  cachedSDKResult = null
  cacheTimestamp = null
}

// ================================================
// OFFICIAL SDK DETECTION
// ================================================

/**
 * Official Farcaster MiniApp detection using the SDK
 *
 * This is the RECOMMENDED way to detect MiniApp context.
 * It verifies actual SDK communication rather than relying on heuristics.
 *
 * @param timeoutMs - Timeout for SDK verification (default: 1000ms)
 * @returns Promise<boolean> - true if definitely in a Farcaster MiniApp
 *
 * @example
 * ```typescript
 * const isInMiniApp = await isInFarcasterMiniApp()
 * if (isInMiniApp) {
 *   // Use MiniApp-specific features
 * }
 * ```
 */
export async function isInFarcasterMiniApp(timeoutMs = 1000): Promise<boolean> {
  // Return cached result if still valid
  if (
    cachedSDKResult !== null &&
    cacheTimestamp !== null &&
    Date.now() - cacheTimestamp < CACHE_DURATION_MS
  ) {
    return cachedSDKResult
  }

  // SSR check
  if (typeof window === 'undefined') {
    return false
  }

  try {
    // Dynamically import the SDK to avoid issues if not available
    const { sdk } = await import('@farcaster/miniapp-sdk')

    // Use official SDK detection method
    const result = await sdk.isInMiniApp()

    // Cache positive results (MiniApp context doesn't change during session)
    if (result) {
      cachedSDKResult = result
      cacheTimestamp = Date.now()
    }

    return result
  } catch (error) {
    // SDK not available or detection failed
    console.debug('Farcaster SDK detection failed (this is normal if not in MiniApp):', error)
    return false
  }
}

/**
 * Get comprehensive detection result with multiple data points
 *
 * @param timeoutMs - Timeout for SDK verification
 * @returns Promise<FarcasterContextDetectionResult>
 *
 * @example
 * ```typescript
 * const detection = await detectFarcasterContext()
 * console.log('In MiniApp:', detection.isInMiniApp)
 * console.log('Detection method:', detection.detectionMethod)
 * ```
 */
export async function detectFarcasterContext(
  timeoutMs = 1000
): Promise<FarcasterContextDetectionResult> {
  const timestamp = Date.now()
  const isLikelyMiniApp = isLikelyMiniAppContext()

  try {
    // Check if we have a valid cached result
    if (
      cachedSDKResult !== null &&
      cacheTimestamp !== null &&
      timestamp - cacheTimestamp < CACHE_DURATION_MS
    ) {
      return {
        isInMiniApp: cachedSDKResult,
        isLikelyMiniApp,
        detectionMethod: 'cached',
        timestamp,
      }
    }

    // Use official SDK detection
    const isInMiniApp = await isInFarcasterMiniApp(timeoutMs)

    return {
      isInMiniApp,
      isLikelyMiniApp,
      detectionMethod: 'sdk',
      timestamp,
    }
  } catch (error) {
    return {
      isInMiniApp: false,
      isLikelyMiniApp,
      detectionMethod: 'heuristic',
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ================================================
// HEURISTIC DETECTION (FALLBACK ONLY)
// ================================================

/**
 * Quick heuristic check for MiniApp context
 *
 * ⚠️ WARNING: This is NOT definitive! Use only for:
 * - SSR environments where SDK is unavailable
 * - Quick checks before async detection
 * - Fallback when SDK detection fails
 *
 * For reliable detection, ALWAYS use `isInFarcasterMiniApp()` instead.
 *
 * @returns boolean - Quick guess (may have false positives)
 */
export function isLikelyMiniAppContext(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const url = window.location

  // Check URL patterns (common but not definitive)
  const urlIndicators =
    url.pathname.startsWith('/mini') ||
    url.pathname.startsWith('/miniapp') ||
    url.search.includes('miniApp=true') ||
    url.search.includes('context=miniapp')

  // Check for iframe context (also not definitive - many sites use iframes)
  const isEmbedded = window.parent !== window

  // Check user agent (can be spoofed)
  const userAgent = navigator.userAgent.toLowerCase()
  const userAgentIndicator = userAgent.includes('farcaster') || userAgent.includes('warpcast')

  // Only consider it "likely" if we have URL indicators
  // Don't rely solely on iframe or user agent
  return urlIndicators && (isEmbedded || userAgentIndicator)
}

// ================================================
// REACT HOOK FOR COMPONENTS
// ================================================

/**
 * React hook for detecting Farcaster MiniApp context
 *
 * @returns boolean | null - true if in MiniApp, false if not, null while loading
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const isInMiniApp = useIsInFarcasterMiniApp()
 *
 *   if (isInMiniApp === null) {
 *     return <Loading />
 *   }
 *
 *   if (isInMiniApp) {
 *     return <MiniAppView />
 *   }
 *
 *   return <WebView />
 * }
 * ```
 */
export function useIsInFarcasterMiniApp(): boolean | null {
  // This hook is defined here but should be implemented in a separate hooks file
  // to avoid React import in this utility file
  // See: src/hooks/farcaster/useIsInFarcasterMiniApp.ts
  throw new Error(
    'useIsInFarcasterMiniApp hook should be imported from @/hooks/farcaster/useIsInFarcasterMiniApp'
  )
}

// ================================================
// SYNC DETECTION FOR CRITICAL PATHS
// ================================================

/**
 * Synchronous detection for critical code paths that can't wait for async
 *
 * ⚠️ WARNING: This uses cached results or heuristics!
 * - If SDK detection has run before, uses cached result (reliable)
 * - Otherwise falls back to heuristics (unreliable)
 *
 * For reliable detection, prefer `isInFarcasterMiniApp()` async method.
 *
 * @returns boolean - Best guess based on available information
 */
export function isInFarcasterMiniAppSync(): boolean {
  // Return cached SDK result if available (reliable)
  if (cachedSDKResult !== null) {
    return cachedSDKResult
  }

  // Fall back to heuristic (unreliable)
  return isLikelyMiniAppContext()
}

// ================================================
// CONTEXT VERIFICATION
// ================================================

/**
 * Verify SDK context is actually available
 *
 * This checks if the Farcaster SDK can communicate with the host.
 * Use this to verify capabilities before using SDK features.
 *
 * @returns Promise<boolean> - true if SDK context is available
 */
export async function verifyFarcasterSDKContext(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const { sdk } = await import('@farcaster/miniapp-sdk')

    // Try to get context with a short timeout
    const context = await Promise.race([
      sdk.context,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 500)),
    ])

    return context !== null
  } catch (error) {
    console.debug('Farcaster SDK context verification failed:', error)
    return false
  }
}

// ================================================
// EXPORTS
// ================================================

// export {
//   // Primary detection methods (use these!)
//   isInFarcasterMiniApp, // ✅ Async, reliable, recommended
//   detectFarcasterContext, // ✅ Comprehensive result

//   // Fallback methods (use with caution)
//   isLikelyMiniAppContext, // ⚠️ Heuristic only
//   isInFarcasterMiniAppSync, // ⚠️ Uses cache or heuristic

//   // Utilities
//   verifyFarcasterSDKContext,
//   clearFarcasterDetectionCache,
// }

export default isInFarcasterMiniApp

/**
 * React Hook for Farcaster MiniApp Context Detection
 * File: src/hooks/farcaster/useIsInFarcasterMiniApp.ts
 *
 * Provides React components with reliable Farcaster MiniApp context detection
 * using the official SDK method.
 */

'use client'

import { useState, useEffect } from 'react'
import { isInFarcasterMiniApp, isLikelyMiniAppContext } from '@/lib/utils/farcaster-detection'

/**
 * React hook for detecting if the app is running in a Farcaster MiniApp
 *
 * Returns:
 * - `null` - Detection in progress (initial load)
 * - `true` - Confirmed to be in a Farcaster MiniApp
 * - `false` - Not in a Farcaster MiniApp
 *
 * @param options - Configuration options
 * @param options.timeout - Timeout for SDK detection (default: 1000ms)
 * @param options.useHeuristicFallback - Use heuristic during loading (default: false)
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const isInMiniApp = useIsInFarcasterMiniApp()
 *
 *   if (isInMiniApp === null) {
 *     return <LoadingSpinner />
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
export function useIsInFarcasterMiniApp(options?: {
  timeout?: number
  useHeuristicFallback?: boolean
}): boolean | null {
  const { timeout = 1000, useHeuristicFallback = false } = options || {}

  // Initial state: null (loading) or heuristic guess
  const [isInMiniApp, setIsInMiniApp] = useState<boolean | null>(() => {
    if (useHeuristicFallback) {
      return isLikelyMiniAppContext()
    }
    return null
  })

  useEffect(() => {
    let mounted = true

    async function detectContext() {
      try {
        const result = await isInFarcasterMiniApp(timeout)

        if (mounted) {
          setIsInMiniApp(result)
        }
      } catch (error) {
        console.warn('Failed to detect Farcaster MiniApp context:', error)

        if (mounted) {
          // Fall back to false on error
          setIsInMiniApp(false)
        }
      }
    }

    detectContext()

    return () => {
      mounted = false
    }
  }, [timeout])

  return isInMiniApp
}

/**
 * Hook that returns immediately with best-guess, then updates when SDK confirms
 *
 * This is useful for components that need to render immediately without waiting
 * for async detection, but want to update when official detection completes.
 *
 * @param timeout - Timeout for SDK detection
 * @returns boolean - Best guess that updates when SDK detection completes
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const isInMiniApp = useIsInFarcasterMiniAppImmediate()
 *
 *   // Component renders immediately with heuristic guess
 *   // Updates when SDK detection completes
 *   return isInMiniApp ? <MiniAppView /> : <WebView />
 * }
 * ```
 */
export function useIsInFarcasterMiniAppImmediate(timeout = 1000): boolean {
  // Start with heuristic guess
  const [isInMiniApp, setIsInMiniApp] = useState(() => isLikelyMiniAppContext())

  useEffect(() => {
    let mounted = true

    async function detectContext() {
      try {
        const result = await isInFarcasterMiniApp(timeout)

        if (mounted && result !== isInMiniApp) {
          setIsInMiniApp(result)
        }
      } catch (error) {
        console.warn('Failed to detect Farcaster MiniApp context:', error)
      }
    }

    detectContext()

    return () => {
      mounted = false
    }
  }, [timeout, isInMiniApp])

  return isInMiniApp
}

/**
 * Hook that suspends until MiniApp context is determined
 *
 * ⚠️ This hook throws a promise and requires a Suspense boundary!
 * Use this with React Suspense for cleaner async handling.
 *
 * @param timeout - Timeout for SDK detection
 * @returns boolean - true if in MiniApp, false otherwise (never null)
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const isInMiniApp = useIsInFarcasterMiniAppSuspense()
 *   // This will suspend until detection completes
 *   return isInMiniApp ? <MiniAppView /> : <WebView />
 * }
 *
 * // In parent component:
 * <Suspense fallback={<Loading />}>
 *   <MyComponent />
 * </Suspense>
 * ```
 */
export function useIsInFarcasterMiniAppSuspense(timeout = 1000): boolean {
  const [isInMiniApp, setIsInMiniApp] = useState<boolean | null>(null)
  const [promise, setPromise] = useState<Promise<void> | null>(null)

  if (isInMiniApp !== null) {
    return isInMiniApp
  }

  if (!promise) {
    const detectionPromise = (async () => {
      const result = await isInFarcasterMiniApp(timeout)
      setIsInMiniApp(result)
    })()

    setPromise(detectionPromise)
  }

  // This throws the promise, causing Suspense to catch it
  throw promise
}

export default useIsInFarcasterMiniApp
// File: src/components/providers/MiniKitProvider.tsx
/**
 * Enhanced Provider System with Farcaster MiniKit Integration
 * 
 * This module demonstrates advanced TypeScript patterns for Web3 development,
 * including graceful handling of optional dependencies, strict type safety,
 * and progressive enhancement patterns that ensure your application works
 * reliably even when external services are unavailable.
 * 
 * Key Learning Points:
 * - Conditional module imports for optional dependencies
 * - Proper type guards and type assertions for external data
 * - Library API compatibility handling
 * - Readonly vs mutable type management
 * - Progressive enhancement in Web3 applications
 */

'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { base } from 'viem/chains'
import { Address } from 'viem'
import { getX402MiddlewareConfig } from '@/lib/web3/x402-config'

/**
 * Conditional MiniKit Import Pattern
 * 
 * This pattern demonstrates how to handle optional dependencies in TypeScript.
 * When a package might not be available (like MiniKit in non-Farcaster environments),
 * we create type-safe interfaces that allow the code to compile and run gracefully.
 */

// FIXED: Updated MiniKit interface to match current SDK v0.1.8 API
interface MiniKitAPI {
  // Core MiniKit functions from the current SDK
  Ready: (options?: { disableNativeGestures?: boolean }) => Promise<void>
  Context: {
    Get: () => Promise<{
      user?: {
        fid: number
        username: string
        verifications?: unknown[]
        followerCount?: number
        verifiedAddresses?: unknown[]
      }
      client?: {
        name: string
        version: string
        supportedFeatures?: string[]
      }
      frame?: boolean
      referrer?: string
    } | null>
  }
  SignIn?: (options?: unknown) => Promise<unknown>
  // Add other functions as needed from the SDK
}

/**
 * Safe MiniKit Import Function
 * 
 * This function demonstrates the pattern of conditional imports in JavaScript/TypeScript.
 * It attempts to import MiniKit but gracefully handles the case where it's not available.
 * This is essential for libraries that are only available in specific environments.
 */
/**
 * Safe MiniKit Import Function
 *
 * Dynamically loads MiniKit when available, otherwise falls back to `null`.
 * Avoids runtime errors in unsupported environments.
 */
// FIXED: Updated to use correct MiniKit SDK v0.1.8 API
async function getMiniKit(): Promise<MiniKitAPI | null> {
  try {
    if (typeof window === 'undefined') return null;

    // Import the MiniKit SDK with correct API structure
    const mod = await import('@farcaster/miniapp-sdk').catch(() => null);
    if (mod) {
      // Return the module directly as it contains Ready, Context, etc.
      return mod as unknown as MiniKitAPI;
    }

    // Fallback to global MiniKit if available
    const win = window as unknown as { MiniKit?: unknown; miniapp?: { sdk?: unknown } }
    if (win.MiniKit) {
      return win.MiniKit as unknown as MiniKitAPI;
    }

    if (win.miniapp?.sdk) {
      return win.miniapp.sdk as unknown as MiniKitAPI;
    }

    return null;
  } catch (error) {
    console.warn('MiniKit not available:', error);
    return null;
  }
}
  

/**
 * Hex String Type System
 * 
 * These types demonstrate how to create strict type safety for blockchain-specific
 * data formats. The HexString type ensures that only properly formatted hex strings
 * can be used where blockchain addresses or IDs are expected.
 */
type HexString = `0x${string}`

/**
 * Type Guard with Explicit Parameter Typing
 * 
 * This function demonstrates how to write type guards that satisfy TypeScript's
 * strict mode requirements. The explicit parameter typing prevents the "implicit any" 
 * errors we saw in the original code.
 */
function isHexString(value: unknown): value is HexString {
  return typeof value === 'string' && value.startsWith('0x') && value.length > 2
}

/**
 * Safe Type Conversion Utility
 * 
 * This utility shows how to safely convert potentially unsafe data (like from
 * external APIs) into our strict TypeScript types. It's a crucial pattern for
 * Web3 development where data comes from various sources with different reliability.
 */
function toHexStringOrUndefined(value: string | undefined): HexString | undefined {
  if (!value) return undefined
  if (isHexString(value)) return value
  return undefined
}

/**
 * Address Array Type Safety
 * 
 * This function demonstrates how to safely convert arrays of unknown data into
 * typed Address arrays, with proper filtering and type assertions.
 */
function safeAddressArray(addresses: unknown[]): Address[] {
  return addresses
    .filter((addr: unknown): addr is Address => isHexString(addr))
}

/**
 * Provider Props Interface
 * 
 * Notice how we've made schemaId optional and properly typed as HexString.
 * This demonstrates defensive programming - we don't assume all data will
 * be perfectly formatted.
 */
export interface MiniKitProviderProps {
  readonly children: React.ReactNode
  readonly enableDevMode?: boolean
  readonly theme?: 'light' | 'dark' | 'auto'
  readonly schemaId?: HexString
}

/**
 * Configuration Interfaces
 * 
 * These interfaces show how to structure configuration objects with proper
 * readonly modifiers and strict typing. The readonly arrays demonstrate
 * immutable data patterns that prevent accidental mutations.
 */
// FIXED: Updated MiniKit config interface for v0.1.8 API
export interface MiniKitConfig {
  readonly theme: 'light' | 'dark' | 'auto'
  readonly enablePayments: boolean
  readonly supportedChains: readonly number[]
  readonly supportedTokens: readonly Address[]
  readonly debugMode: boolean
  readonly manifestUrl: string
  // New options for Ready() API
  readonly disableNativeGestures?: boolean
}

/**
 * Simplified OnchainKit Configuration
 * 
 * Based on the error we saw, OnchainKitProvider doesn't accept a projectName prop.
 * This interface reflects the actual API of the current OnchainKit version.
 */
// Removed OnchainKit configuration to avoid bringing in deprecated frame-sdk transitively

/**
 * Farcaster Context with Proper Typing
 * 
 * This interface demonstrates how to handle data from external APIs where
 * the exact format might vary. We use optional fields and proper type guards
 * to ensure runtime safety.
 */
export interface FarcasterContext {
  readonly user: {
    readonly fid: number
    readonly username: string
    readonly verifications: readonly Address[]
    readonly followerCount: number
    readonly verifiedAddresses: readonly Address[]
  } | null
  readonly client: {
    readonly name: string
    readonly version: string
    readonly supportedFeatures: readonly string[]
  } | null
  readonly isFrameContext: boolean
  readonly referrer: string | null
}

/**
 * Context Type Definition
 * 
 * The context type includes all the functionality we want to expose,
 * with proper error handling and configuration access.
 */
interface MiniKitContextType {
  readonly isInstalled: boolean
  readonly isReady: boolean
  readonly context: FarcasterContext | null
  readonly error: Error | null
  readonly refreshContext: () => Promise<void>
  readonly config: MiniKitConfig | null
}

/**
 * React Context Creation
 * 
 * Standard React context pattern with proper TypeScript typing.
 */
const MiniKitContext = createContext<MiniKitContextType | undefined>(undefined)

/**
 * Environment Validation with Clear Error Messages
 * 
 * This function demonstrates how to validate configuration early and provide
 * clear error messages that help developers understand what's missing.
 */
function validateMiniKitEnvironment(): void {
  const requiredVars = {
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  } as const

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value || value.trim() === '')
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for MiniKit: ${missingVars.join(', ')}. ` +
      `Please check your .env.local file and ensure these variables are set.`
    )
  }
}

/**
 * Configuration Factory with Error Handling
 * 
 * This factory function shows how to create configuration objects safely,
 * with comprehensive error handling that doesn't break the application.
 */
export function createMiniKitConfig(): MiniKitConfig {
  validateMiniKitEnvironment()

  // Use base.id as the default chainId for x402 config
  const x402Config = getX402MiddlewareConfig(base.id)
  const isDevMode = process.env.NEXT_PUBLIC_FARCASTER_DEV_MODE === 'true'
  const baseUrl = process.env.NEXT_PUBLIC_URL

  const cleanBaseUrl = baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  return {
    theme: 'auto',
    enablePayments: true,
    supportedChains: [x402Config.chainId],
    // Proper filtering with explicit typing to avoid 'implicit any' errors
    supportedTokens: [x402Config.usdcTokenAddress],
    debugMode: isDevMode,
    manifestUrl: `${cleanBaseUrl}/.well-known/farcaster.json`,
  }
}

/**
 * OnchainKit Configuration Factory
 * 
 * This function creates OnchainKit configuration using only the props that
 * the actual OnchainKitProvider accepts, avoiding the 'projectName' error.
 */
// Removed OnchainKit config factory

/**
 * Safe MiniKit Initialization
 * 
 * This function demonstrates how to initialize external libraries safely,
 * with proper error handling that doesn't crash the application.
 */
// FIXED: Updated to use correct MiniKit SDK v0.1.8 API
export async function initializeMiniKit(config: MiniKitConfig): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('MiniKit can only be initialized in browser environment')
    }

    const miniKit = await getMiniKit()
    if (!miniKit) {
      throw new Error('MiniKit is not available in this environment')
    }

    // Check if Ready method exists before calling it
    if (typeof miniKit.Ready !== 'function') {
      throw new Error('MiniKit.Ready is not a function - SDK may not be properly loaded')
    }

    // Use Ready() instead of install() for the new API
    await miniKit.Ready({
      disableNativeGestures: false // You can make this configurable if needed
    })

    if (config.debugMode) {
      console.log('✅ MiniKit initialized successfully with Ready()', {
        supportedChains: config.supportedChains,
        supportedTokens: config.supportedTokens.length,
        enablePayments: config.enablePayments,
      })
    }
  } catch (error) {
    console.warn('⚠️ MiniKit initialization failed:', error)
    // Graceful degradation - don't throw, just log the warning
    // This allows the app to continue working even without MiniKit
  }
}


/**
 * Async Context Extraction
 * 
 * This function provides an async version for extracting Farcaster context
 * when we can properly await the MiniKit initialization.
 */
// FIXED: Updated to use correct MiniKit SDK v0.1.8 API
async function extractFarcasterContextAsync(): Promise<FarcasterContext | null> {
  try {
    if (typeof window === 'undefined') {
      return null
    }

    const miniKit = await getMiniKit()
    if (!miniKit) {
      return null
    }

    // Check if Context.Get method exists before calling it
    if (!miniKit.Context || typeof miniKit.Context.Get !== 'function') {
      console.warn('MiniKit.Context.Get is not available')
      return null
    }

    const context = await miniKit.Context.Get()
    if (!context) {
      return null
    }

    return {
      user: context.user ? {
        fid: context.user.fid,
        username: context.user.username,
        // Explicit typing in filter function to avoid 'implicit any' error
        verifications: safeAddressArray(context.user.verifications || []),
        followerCount: context.user.followerCount || 0,
        verifiedAddresses: safeAddressArray(context.user.verifiedAddresses || []),
      } : null,
      client: context.client ? {
        name: context.client.name,
        version: context.client.version,
        supportedFeatures: context.client.supportedFeatures || [],
      } : null,
      isFrameContext: Boolean(context.frame),
      referrer: context.referrer || null,
    }
  } catch (error) {
    console.warn('Failed to extract Farcaster context:', error)
    return null
  }
}

/**
 * Main Provider Component
 * 
 * This component demonstrates the complete pattern of progressive enhancement
 * with proper error handling and state management.
 */
export function MiniKitProvider({ 
  children, 
  enableDevMode = false, 
  theme = 'auto',
  schemaId
}: MiniKitProviderProps): React.JSX.Element {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [context, setContext] = useState<FarcasterContext | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [config, setConfig] = useState<MiniKitConfig | null>(null)

  const miniKitConfig = useMemo((): MiniKitConfig => {
    try {
      const baseConfig = createMiniKitConfig()
      return {
        ...baseConfig,
        debugMode: enableDevMode || baseConfig.debugMode,
        theme,
      }
    } catch (configError) {
      console.error('Failed to create MiniKit config:', configError)
      return {
        theme,
        enablePayments: false,
        supportedChains: [],
        supportedTokens: [],
        debugMode: enableDevMode,
        manifestUrl: '',
      }
    }
  }, [enableDevMode, theme])

  useEffect(() => {
    let mounted = true

    const initialize = async (): Promise<void> => {
      try {
        setConfig(miniKitConfig)
        await initializeMiniKit(miniKitConfig)
        
        if (!mounted) return

        setIsInstalled(true)
        setIsReady(true)
        setError(null)

        const initialContext = await extractFarcasterContextAsync()
        setContext(initialContext)

      } catch (initError) {
        if (!mounted) return

        const error = initError instanceof Error ? initError : new Error('MiniKit initialization failed')
        setError(error)
        setIsInstalled(false)
        setIsReady(false)

        if (miniKitConfig.debugMode) {
          console.error('MiniKit initialization error:', error)
        }
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [miniKitConfig])

  const refreshContext = useCallback(async (): Promise<void> => {
    try {
      const newContext = await extractFarcasterContextAsync()
      setContext(newContext)
      setError(null)
    } catch (refreshError) {
      const error = refreshError instanceof Error ? refreshError : new Error('Failed to refresh context')
      setError(error)
      console.warn('Failed to refresh Farcaster context:', error)
    }
  }, [])

  const contextValue = useMemo((): MiniKitContextType => ({
    isInstalled,
    isReady,
    context,
    error,
    refreshContext,
    config,
  }), [isInstalled, isReady, context, error, refreshContext, config])

  return (
    <MiniKitContext.Provider value={contextValue}>
      {children}
    </MiniKitContext.Provider>
  )
}

/**
 * Enhanced Providers with Corrected Props
 * 
 * This component shows the corrected OnchainKitProvider usage without
 * the unsupported projectName prop.
 */
export function AppProviders({ 
  children,
  schemaId 
}: { 
  children: React.ReactNode
  schemaId?: HexString 
}): React.JSX.Element {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 3,
        refetchOnWindowFocus: false,
      },
    },
  }), [])

  return (
    <QueryClientProvider client={queryClient}>
      <MiniKitProvider schemaId={schemaId}>
        {children}
      </MiniKitProvider>
    </QueryClientProvider>
  )
}

/**
 * Custom Hooks with Proper Error Handling
 * 
 * These hooks demonstrate how to expose functionality safely with
 * comprehensive error handling and type safety.
 */
export function useMiniKit(): MiniKitContextType {
  const context = useContext(MiniKitContext)
  
  if (context === undefined) {
    throw new Error(
      'useMiniKit must be used within a MiniKitProvider. ' +
      'Make sure your component is wrapped with <MiniKitProvider> or <AppProviders>.'
    )
  }
  
  return context
}

export function useFarcasterContext(): FarcasterContext | null {
  const { context } = useMiniKit()
  return context
}

export function useFarcasterUser(): FarcasterContext['user'] {
  const context = useFarcasterContext()
  return context?.user || null
}

export function useMiniKitAvailable(): boolean {
  const { isInstalled, isReady } = useMiniKit()
  return isInstalled && isReady
}

/**
 * Fixed Token Hook with Proper Array Type Handling
 * 
 * This hook demonstrates how to handle the readonly/mutable array type issue.
 * We return a copy of the array to ensure type safety while satisfying
 * TypeScript's mutability requirements.
 */
export function useSupportedPaymentTokens(): Address[] {
  const { config } = useMiniKit()
  // Create a mutable copy of the readonly array to satisfy return type
  return config?.supportedTokens ? [...config.supportedTokens] : []
}
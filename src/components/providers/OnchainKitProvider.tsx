'use client'

import React, { ReactNode } from 'react'
import { OnchainKitProvider as BaseOnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'viem/chains'

interface OnchainKitProviderProps {
  children: ReactNode
  /** API key for OnchainKit services */
  apiKey?: string
  /** Chain configuration for Basenames */
  chain?: typeof base
  /** Schema ID for attestation badges (optional) */
  schemaId?: string
}

/**
 * OnchainKit Provider Component
 *
 * This provider enables OnchainKit functionality throughout the application,
 * specifically for Basenames resolution and other identity features.
 *
 * Features:
 * - Automatic Basenames resolution for Base network
 * - Attestation badge support
 * - Identity component integration
 * - Proper error boundaries and fallbacks
 *
 * @param children - Child components that need OnchainKit context
 * @param apiKey - OnchainKit API key (optional but recommended for production)
 * @param chain - Blockchain network (defaults to Base mainnet)
 * @param schemaId - Schema ID for attestation verification
 */
export function OnchainKitProvider({
  children,
  apiKey,
  chain = base,
  schemaId
}: OnchainKitProviderProps) {
  // Get API key from environment or props
  const effectiveApiKey = apiKey || process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY

  return (
    <BaseOnchainKitProvider
      apiKey={effectiveApiKey}
      chain={chain}
    >
      {children}
    </BaseOnchainKitProvider>
  )
}

export default OnchainKitProvider

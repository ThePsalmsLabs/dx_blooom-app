'use client'

import React from 'react'
import { MiniKitProvider, MiniKitProviderProps } from '@/components/providers/MiniKitProvider'

/**
 * MiniAppProvider
 * Specialized provider for Mini App experiences, extending MiniKitProvider.
 * Forwards all MiniKitProviderProps and allows Mini App-specific overrides.
 */
export function MiniAppProvider(props: MiniKitProviderProps): React.ReactElement {
  return <MiniKitProvider {...props} />
}

// Re-export MiniKitProviderProps for convenience
export type { MiniKitProviderProps } from '@/components/providers/MiniKitProvider'
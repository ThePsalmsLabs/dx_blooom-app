// src/components/providers/MiniAppProvider.tsx
// Component 3.1 Supporting Provider: Mini App State Management
// Builds on existing MiniKitProvider infrastructure

'use client'

import React from 'react'
import { MiniKitProvider } from '@/components/providers/MiniKitProvider'

/**
 * Mini App Provider Props Interface
 * 
 * This interface defines the props for the MiniAppProvider component,
 * which serves as a specialized wrapper around your existing MiniKitProvider
 * for Mini App-specific functionality and state management.
 */
interface MiniAppProviderProps {
  /** Child components to render within the Mini App context */
  readonly children: React.ReactNode
  
  /** Optional theme override for Mini App experience */
  readonly theme?: 'light' | 'dark' | 'auto'
  
  /** Enable development mode features and debugging */
  readonly enableDevMode?: boolean
}

/**
 * MiniAppProvider Component
 * 
 * This component provides a specialized provider layer for Mini App experiences
 * by wrapping your existing MiniKitProvider with Mini App-specific configuration
 * and state management. It demonstrates how to create focused provider interfaces
 * that enhance existing infrastructure rather than replacing it.
 * 
 * Key Features:
 * - Wraps your existing MiniKitProvider for seamless integration
 * - Provides Mini App-specific theme and configuration options
 * - Maintains compatibility with your current provider architecture
 * - Enables development mode features for debugging and testing
 * - Preserves all existing MiniKit functionality and error handling
 * 
 * Architecture Integration:
 * - Leverages your production-ready MiniKitProvider infrastructure
 * - Maintains compatibility with OnchainKit and x402 integration
 * - Preserves existing error boundaries and state management
 * - Integrates with your current authentication and wallet systems
 * 
 * This provider establishes the foundation for Mini App-specific features
 * while ensuring complete compatibility with your existing platform architecture.
 * All the sophisticated error handling, progressive enhancement, and TypeScript
 * safety from your MiniKitProvider is automatically inherited.
 */
export function MiniAppProvider({
  children,
  theme = 'auto',
  enableDevMode = process.env.NODE_ENV === 'development'
}: MiniAppProviderProps): React.ReactElement {
  return (
    <MiniKitProvider
      theme={theme}
      enableDevMode={enableDevMode}
    >
      {children}
    </MiniKitProvider>
  )
}

/**
 * Re-export MiniKitProvider types for convenience
 * 
 * This allows Mini App components to access the same type definitions
 * without needing to import from multiple provider files.
 */
export type { MiniKitProviderProps } from '@/components/providers/MiniKitProvider'
/**
 * SOLUTION: Comprehensive Provider Setup
 * 
 * This solution fixes your "useAuth must be used within an AuthProvider" error
 * by properly implementing the React Context Provider pattern in your application.
 * 
 * The key insight here is that ALL providers must be organized in a hierarchy
 * where each provider wraps the components that need it. Think of this like
 * setting up utilities in a building - you need to connect the electrical
 * panel to every room that needs electricity.
 */

'use client'

import React from 'react'
import { Toaster } from '@/components/ui/index'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { EnhancedWeb3Provider } from '@/components/providers/Web3Provider'

/**
 * AllProviders Component
 * 
 * This component creates the proper provider hierarchy for your entire application.
 * It's like setting up the infrastructure layer that everything else depends on.
 * 
 * The order of providers matters! Each provider wraps its children, so providers
 * higher in the tree are available to providers lower in the tree.
 * 
 * Provider Hierarchy Explanation:
 * 1. Web3Provider (outermost) - Provides wallet connection and blockchain state
 * 2. AuthProvider - Provides user authentication and session management  
 * 3. ToastProvider - Provides notification system
 * 4. Your App Content (innermost) - Can access all the above providers
 */
interface AllProvidersProps {
  children: React.ReactNode
}

export function AllProviders({ children }: AllProvidersProps) {
  return (
    <EnhancedWeb3Provider>
      <AuthProvider>
        <Toaster />
        {children}
      </AuthProvider>
    </EnhancedWeb3Provider>
  )
} 
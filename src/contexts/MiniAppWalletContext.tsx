/**
 * MiniApp Wallet Context
 * File: src/contexts/MiniAppWalletContext.tsx
 * 
 * This context provides a way to override the wallet UI behavior in MiniApp contexts.
 * It allows the AppLayout components to use MiniApp-specific wallet state instead of
 * the regular wallet connection hooks, ensuring proper state synchronization.
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'
import type { EnhancedWalletConnectionUI } from '@/hooks/ui/integration'

interface MiniAppWalletContextType {
  walletUI: EnhancedWalletConnectionUI
  isMiniAppContext: boolean
}

const MiniAppWalletContext = createContext<MiniAppWalletContextType | null>(null)

interface MiniAppWalletProviderProps {
  children: ReactNode
}

/**
 * MiniApp Wallet Provider
 * 
 * This provider wraps the AppLayout when in MiniApp context to ensure
 * that wallet UI components use the correct wallet state.
 */
export function MiniAppWalletProvider({ children }: MiniAppWalletProviderProps) {
  const walletUI = useMiniAppWalletUI()
  
  const contextValue: MiniAppWalletContextType = {
    walletUI,
    isMiniAppContext: true
  }
  
  return (
    <MiniAppWalletContext.Provider value={contextValue}>
      {children}
    </MiniAppWalletContext.Provider>
  )
}

/**
 * Hook to use MiniApp wallet context
 * 
 * This hook allows components to check if they're in a MiniApp context
 * and get the appropriate wallet UI state.
 */
export function useMiniAppWalletContext(): MiniAppWalletContextType | null {
  return useContext(MiniAppWalletContext)
}

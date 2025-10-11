'use client'

import { useEffect } from 'react'
import { UnifiedAppProvider } from '@/providers/UnifiedAppProvider'
import { Toaster } from '@/components/ui/sonner'
import { useMiniAppWallet } from '@/hooks/miniapp/useMiniAppWallet'

interface MiniAppLayoutProps {
  children: React.ReactNode
}

/**
 * Auto-connect component for MiniApp
 * Handles automatic Farcaster wallet connection on mount
 */
function MiniAppAutoConnect() {
  const { isConnected, isConnecting, address, error } = useMiniAppWallet()
  
  useEffect(() => {
    console.log('🔍 MiniApp wallet state:', { 
      isConnected, 
      isConnecting, 
      address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
      error 
    })
  }, [isConnected, isConnecting, address, error])
  
  return null // Just handles auto-connection logic
}

export default function MiniAppLayout({ children }: MiniAppLayoutProps) {
  return (
    <UnifiedAppProvider 
      forceContext="miniapp"
      enableOptimizations={true}
    >
      <MiniAppAutoConnect /> {/* Auto-connects Farcaster wallet on mount */}
      {children}
      <Toaster />
    </UnifiedAppProvider>
  )
}
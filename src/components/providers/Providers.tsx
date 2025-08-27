'use client'

import React from 'react'
import { UnifiedAppProvider } from '@/providers/UnifiedAppProvider'
import { MiniKitProvider } from '@/components/providers/MiniKitProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Web3Provider } from '@/components/providers/Web3Provider'
import { EnhancedMiniAppProvider } from '@/contexts/MiniAppProvider'
import { BackendHealthProvider } from '@/contexts/BackendHealthContext'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Web3Provider>
      <ThemeProvider>
        <MiniKitProvider>
          <EnhancedMiniAppProvider>
            <BackendHealthProvider>
              <UnifiedAppProvider forceContext="web">
                {children}
              </UnifiedAppProvider>
            </BackendHealthProvider>
          </EnhancedMiniAppProvider>
        </MiniKitProvider>
      </ThemeProvider>
    </Web3Provider>
  )
}

'use client'

import React from 'react'
import { UnifiedAppProvider } from '@/providers/UnifiedAppProvider'
import { MiniKitProvider } from '@/components/providers/MiniKitProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Web3Provider } from '@/components/providers/Web3Provider'
import { EnhancedMiniAppProvider } from '@/contexts/MiniAppProvider'
import { BackendHealthProvider } from '@/contexts/BackendHealthContext'
import { OnchainKitProvider } from '@/components/providers/OnchainKitProvider'
import { Toaster } from 'sonner'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <OnchainKitProvider>
      <Web3Provider>
        <ThemeProvider>
          <MiniKitProvider>
            <EnhancedMiniAppProvider>
              <BackendHealthProvider>
                <UnifiedAppProvider forceContext="web">
                  {children}
                  {/* Enhanced Toaster with beautiful glassmorphism styling */}
                  <Toaster
                    position="top-right"
                    duration={10000}
                    expand
                    richColors
                    closeButton
                    toastOptions={{
                      style: {
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        color: 'hsl(var(--foreground))',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        borderRadius: '16px',
                        padding: '16px',
                        minWidth: '320px',
                        maxWidth: '400px',
                      },
                      className: 'glassmorphism-toast',
                    }}
                  />
                </UnifiedAppProvider>
              </BackendHealthProvider>
            </EnhancedMiniAppProvider>
          </MiniKitProvider>
        </ThemeProvider>
      </Web3Provider>
    </OnchainKitProvider>
  )
}

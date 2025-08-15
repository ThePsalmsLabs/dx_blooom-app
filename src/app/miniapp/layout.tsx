'use client'

import { UnifiedAppProvider } from '@/providers/UnifiedAppProvider'
import { Toaster } from '@/components/ui/sonner'

interface MiniAppLayoutProps {
  children: React.ReactNode
}

export default function MiniAppLayout({ children }: MiniAppLayoutProps) {
  return (
    <UnifiedAppProvider 
      forceContext="miniapp"
      enableOptimizations={true}
    >
      {children}
      <Toaster />
    </UnifiedAppProvider>
  )
}
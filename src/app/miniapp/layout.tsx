// src/app/miniapp/layout.tsx
// Component 3.1: Mini App Container Component
// Integrates with existing AppLayout and provides Mini App-specific container

import React from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { MiniAppProvider } from '@/components/providers/MiniAppProvider'

/**
 * Mini App Layout Props Interface
 * 
 * This interface defines the props for the MiniAppLayout component,
 * ensuring type safety and compatibility with Next.js layout patterns.
 * The component serves as a specialized container for Mini App experiences
 * while maintaining integration with your existing layout infrastructure.
 */
interface MiniAppLayoutProps {
  /** Child components to render within the Mini App layout */
  readonly children: React.ReactNode
}

/**
 * MiniAppLayout Component
 * 
 * This component creates a specialized layout container for Mini App experiences
 * by wrapping the existing AppLayout with Mini App-specific providers and
 * configuration. It demonstrates how to extend your current layout system
 * to support new interaction patterns without duplicating infrastructure.
 * 
 * Key Features:
 * - Integrates with your existing AppLayout component for consistency
 * - Disables navigation to create focused Mini App experience
 * - Wraps content with MiniAppProvider for state management
 * - Maintains responsive design and accessibility features
 * - Preserves existing theme and styling systems
 * 
 * Architecture Integration:
 * - Leverages your production-ready AppLayout component
 * - Maintains compatibility with existing authentication flows
 * - Preserves wallet connection and network state management
 * - Integrates with your existing error boundary and toast systems
 * 
 * This component establishes the foundation for Phase 3 Mini App features
 * while ensuring seamless integration with your existing platform architecture.
 */
export default function MiniAppLayout({ children }: MiniAppLayoutProps): React.ReactElement {
  return (
    <MiniAppProvider>
      <AppLayout 
        showNavigation={false}
        showHeader={true}
        className="miniapp-container"
      >
        <div className="miniapp-content-wrapper" data-context="miniapp">
          {/* Mini App Content Area */}
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            <div className="miniapp-content bg-background rounded-lg border shadow-sm overflow-hidden">
              {children}
            </div>
          </div>
          
          {/* Mini App Status Indicator */}
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
              🖼️ Mini App
            </div>
          </div>
        </div>
      </AppLayout>
    </MiniAppProvider>
  )
}
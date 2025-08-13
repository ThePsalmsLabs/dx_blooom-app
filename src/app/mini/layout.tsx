// src/app/mini/layout.tsx
import React from 'react'
import { EnhancedProviders } from '@/components/providers/MiniKitProvider'
import MiniAppReady from '@/components/miniapp/MiniAppReady'

export default function MiniLayout({ children }: { children: React.ReactNode }): React.ReactElement {
	return (
		<EnhancedProviders>
			{/* Ensure readiness is signaled immediately when embedded */}
			<MiniAppReady />
			{children}
		</EnhancedProviders>
	)
}



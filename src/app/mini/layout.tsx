// src/app/mini/layout.tsx
import React from 'react'
import { EnhancedProviders } from '@/components/providers/MiniKitProvider'

export default function MiniLayout({ children }: { children: React.ReactNode }): React.ReactElement {
	return (
		<EnhancedProviders>
			{children}
		</EnhancedProviders>
	)
}



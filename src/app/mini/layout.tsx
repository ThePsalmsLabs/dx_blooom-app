// src/app/mini/layout.tsx
import React from 'react'
import { AppProviders } from '@/components/providers/MiniKitProvider'
import { EnhancedMiniAppProvider } from '@/components/providers/EnhancedMiniAppProvider'

function EarlyReady(): React.ReactElement | null {
	React.useEffect(() => {
		let cancelled = false
		const tryReady = async (): Promise<void> => {
			try {
				const mod = await import('@farcaster/miniapp-sdk').catch(() => null)
				const sdk = mod?.sdk ?? (typeof window !== 'undefined' ? (window as any)?.miniapp?.sdk : undefined)
				if (sdk && !cancelled) {
					await sdk.actions.ready().catch(() => {})
				}
			} catch {}
		}
		tryReady()
		const id = setInterval(tryReady, 300)
		return () => { cancelled = true; clearInterval(id) }
	}, [])
	return null
}

export default function MiniLayout({ children }: { children: React.ReactNode }): React.ReactElement {
	return (
		<AppProviders>
			<EnhancedMiniAppProvider>
				<div data-context="miniapp">
					<EarlyReady />
					{children}
				</div>
			</EnhancedMiniAppProvider>
		</AppProviders>
	)
}



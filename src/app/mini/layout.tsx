'use client'

// src/app/mini/layout.tsx
import React from 'react'
import Link from 'next/link'
import { AppProviders } from '@/components/providers/MiniKitProvider'
import { EnhancedMiniAppProvider } from '@/contexts/MiniAppProvider'
import { 
  Home, 
  Search, 
  Users, 
  User 
} from 'lucide-react'

function EarlyReady(): React.ReactElement | null {
	React.useEffect(() => {
		let cancelled = false
		const tryReady = async (): Promise<void> => {
			try {
				const mod = await import('@farcaster/miniapp-sdk').catch(() => null)
				const sdk = mod?.sdk ?? (typeof window !== 'undefined' ? window?.miniapp?.sdk : undefined)
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
					<div className="min-h-screen bg-background">
						{/* Main Content */}
						<main className="pb-20">
							{children}
						</main>
						
						{/* Bottom Navigation for Mini App */}
						<div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t">
							<div className="flex items-center justify-around py-2">
								<Link href="/mini" className="flex flex-col items-center gap-1 p-2">
									<Home className="h-5 w-5" />
									<span className="text-xs">Home</span>
								</Link>
								<Link href="/mini/browse" className="flex flex-col items-center gap-1 p-2">
									<Search className="h-5 w-5" />
									<span className="text-xs">Browse</span>
								</Link>
								<Link href="/mini/creators" className="flex flex-col items-center gap-1 p-2">
									<Users className="h-5 w-5" />
									<span className="text-xs">Creators</span>
								</Link>
								<Link href="/mini/profile" className="flex flex-col items-center gap-1 p-2">
									<User className="h-5 w-5" />
									<span className="text-xs">Profile</span>
								</Link>
							</div>
						</div>
					</div>
				</div>
			</EnhancedMiniAppProvider>
		</AppProviders>
	)
}



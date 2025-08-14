'use client'

// Production-ready provider that integrates with existing architecture
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface MiniAppContextType {
	isMiniApp: boolean
	isReady: boolean
	farcasterUser?: {
		fid: number
		username: string
		displayName: string
		pfp?: string
		following: number
		followers: number
	}
	capabilities: {
		canShare: boolean
		canSignIn: boolean
		canSendTransactions: boolean
		hasNotifications: boolean
	}
	ready: () => Promise<void>
	share: (content: ShareContent) => Promise<void>
	track: (event: string, properties: Record<string, any>) => void
}

interface ShareContent {
	text: string
	url: string
	contentId?: bigint
	creatorAddress?: string
}

const MiniAppContext = createContext<MiniAppContextType | undefined>(undefined)

export function EnhancedMiniAppProvider({ children }: { children: ReactNode }): React.ReactElement {
	const [isMiniApp, setIsMiniApp] = useState(false)
	const [isReady, setIsReady] = useState(false)
	const [farcasterUser, setFarcasterUser] = useState<MiniAppContextType['farcasterUser']>()
	const [capabilities, setCapabilities] = useState<MiniAppContextType['capabilities']>({
		canShare: false,
		canSignIn: false,
		canSendTransactions: false,
		hasNotifications: false,
	})

	useEffect(() => {
		const initializeMiniApp = async (): Promise<void> => {
			try {
				const inMiniApp = window.parent !== window || Boolean((window as any).miniapp) || document.referrer.includes('farcaster')
				setIsMiniApp(inMiniApp)

				if (inMiniApp) {
					const sdkMod = await import('@farcaster/miniapp-sdk').catch(() => null)
					const sdk = (sdkMod as unknown as { sdk?: import('@/types/miniapp-sdk').AppMiniAppSDK })?.sdk ?? window.miniapp?.sdk

					if (sdk) {
						sdk.init && (await sdk.init({ name: 'Bloom', version: '1.0.0' }).catch(() => {}))
						const user = sdk.user && (await sdk.user.getCurrentUser?.().catch(() => null))
						if (user) setFarcasterUser({
							fid: user.fid,
							username: user.username || '',
							displayName: user.displayName || '',
							pfp: undefined,
							following: 0,
							followers: 0
						})

						const caps: string[] = sdk.capabilities ? (await sdk.capabilities.getCapabilities?.().catch(() => [])) ?? [] : []
						setCapabilities({
							canShare: caps.includes('share'),
							canSignIn: caps.includes('signIn'),
							canSendTransactions: caps.includes('sendTransaction'),
							hasNotifications: caps.includes('notifications'),
						})
						setIsReady(true)
						return
					}
				}

				setIsReady(true)
			} catch (error) {
				console.warn('MiniApp initialization failed:', error)
				setIsReady(true)
			}
		}

		void initializeMiniApp()
	}, [])

	const ready = async (): Promise<void> => {
		if (isMiniApp && window.miniapp?.sdk) {
			await window.miniapp.sdk.actions.ready()
		}
	}

	const share = async (content: ShareContent): Promise<void> => {
		if (!capabilities.canShare) throw new Error('Sharing not available in this environment')
		const sdk = window.miniapp?.sdk
		if (sdk && sdk.actions.share) {
			await sdk.actions.share({ text: content.text, url: content.url, embeds: content.url ? [{ url: content.url }] : undefined })
		}
	}

	const track = (event: string, properties: Record<string, unknown>): void => {
	if (typeof window !== 'undefined' && window.analytics) {
			window.analytics.track(event, {
				...properties,
				context: 'miniapp',
				isMiniApp,
				userFid: farcasterUser?.fid,
			})
		}
	}

	const contextValue: MiniAppContextType = { isMiniApp, isReady, farcasterUser, capabilities, ready, share, track }

	return <MiniAppContext.Provider value={contextValue}>{children}</MiniAppContext.Provider>
}

export function useMiniApp(): MiniAppContextType {
	const context = useContext(MiniAppContext)
	if (context === undefined) {
		throw new Error('useMiniApp must be used within a MiniAppProvider')
	}
	return context
}



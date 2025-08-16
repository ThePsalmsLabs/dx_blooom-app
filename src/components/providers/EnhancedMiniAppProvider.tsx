'use client'

// Production-ready provider that integrates with existing architecture
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface EnhancedMiniAppProviderProps {
  children: React.ReactNode
  config?: {
    enableOptimizations?: boolean
    enableSocialFeatures?: boolean
    enableAnalytics?: boolean
    customTheme?: Record<string, unknown>
  }
}

interface MiniAppContextValue {
  isMiniApp: boolean
  isReady: boolean
  platform: 'ios' | 'android' | 'web' | 'unknown'
  version: string
  features: {
    socialSharing: boolean
    analytics: boolean
    payments: boolean
  }
  capabilities: {
    socialSharing: boolean
    analytics: boolean
    payments: boolean
    hasNotifications?: boolean
  }
  config: Record<string, unknown>
  track: (event: string, data?: Record<string, unknown>) => void
  ready: () => Promise<void>
  share: (content: ShareContent) => Promise<void>
  farcasterUser: {
    fid: number
    username: string
    displayName: string
    pfp?: string
    following: number
    followers: number
  } | null
}

interface ShareContent {
	text: string
	url: string
	contentId?: bigint
	creatorAddress?: string
}

const MiniAppContext = createContext<MiniAppContextValue | undefined>(undefined)

export function EnhancedMiniAppProvider({ children }: EnhancedMiniAppProviderProps): React.ReactElement {
	const [isMiniApp, setIsMiniApp] = useState(false)
	const [isReady, setIsReady] = useState(false)
	const [farcasterUser, setFarcasterUser] = useState<{
		fid: number
		username: string
		displayName: string
		pfp?: string
		following: number
		followers: number
	} | null>(null)
	const [capabilities, setCapabilities] = useState<{
		socialSharing: boolean
		analytics: boolean
		payments: boolean
		hasNotifications?: boolean
	}>({
		socialSharing: false,
		analytics: false,
		payments: false,
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
							socialSharing: caps.includes('share'),
							analytics: caps.includes('signIn'),
							payments: caps.includes('sendTransaction'),
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

	const track = (event: string, data?: Record<string, unknown>): void => {
		if (capabilities.analytics) {
			console.log('MiniApp Analytics Event:', event, data)
			// Implement actual analytics tracking here
		}
		if (typeof window !== 'undefined' && (window as any).analytics) {
			(window as any).analytics.track(event, {
				...data,
				context: 'miniapp',
				isMiniApp,
				userFid: farcasterUser?.fid,
			})
		}
	}

	const share = async (content: ShareContent): Promise<void> => {
		if (!capabilities.socialSharing) throw new Error('Sharing not available in this environment')
		const sdk = (window as any).miniapp?.sdk
		if (sdk && sdk.actions.share) {
			await sdk.actions.share({ text: content.text, url: content.url, embeds: content.url ? [{ url: content.url }] : undefined })
		}
	}

	const contextValue: MiniAppContextValue = { 
		isMiniApp, 
		isReady, 
		platform: 'web',
		version: '1.0.0',
		features: capabilities,
		capabilities,
		config: {},
		track, 
		ready, 
		share,
		farcasterUser
	}

	return <MiniAppContext.Provider value={contextValue}>{children}</MiniAppContext.Provider>
}

export function useMiniApp(): MiniAppContextValue {
	const context = useContext(MiniAppContext)
	if (context === undefined) {
		throw new Error('useMiniApp must be used within a MiniAppProvider')
	}
	return context
}



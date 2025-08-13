'use client'

import React from 'react'
import { MiniAppContentBrowser } from '@/components/content/MiniAppContentBrowser'

export default function MiniAppHomeClient(): React.ReactElement {
	React.useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const { sdk } = await import('@farcaster/miniapp-sdk')
				if (!cancelled) {
					await sdk.actions.ready()
				}
			} catch (e) {
				// No-op: allow app to continue even if SDK is unavailable
			}
		})()
		return () => { cancelled = true }
	}, [])

	return (
		<div className="miniapp-container min-h-screen bg-background">
			{/* MiniApp Header - Provides context and navigation within the social environment */}
			<div className="miniapp-header bg-gradient-to-r from-blue-50 to-purple-50 border-b border-border">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
								<span className="text-white font-bold text-sm">C</span>
							</div>
							<div>
								<h1 className="text-xl font-bold text-foreground">
									Content Platform
								</h1>
								<p className="text-sm text-muted-foreground">
									Premium creator content on Base
								</p>
							</div>
						</div>

						{/* MiniApp Environment Indicator */}
						<div className="flex items-center space-x-2">
							<div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
								<span className="mr-1">🖼️</span>
								MiniApp
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Area - Houses the sophisticated content browsing experience */}
			<main className="miniapp-main-content">
				<div className="container mx-auto px-4 py-6">
					{/* Welcome Section - Contextualizes the social commerce experience */}
					<div className="mb-8 text-center">
						<h2 className="text-2xl font-bold text-foreground mb-2">
							Discover Premium Content
						</h2>
						<p className="text-muted-foreground max-w-2xl mx-auto">
							Browse and purchase high-quality content from top creators using USDC on Base network. 
							Enjoy instant transactions and support your favorite creators directly through social commerce.
						</p>
					</div>

					{/* Enhanced Content Browser - The core functionality of the MiniApp */}
					<div className="miniapp-content-wrapper">
						<MiniAppContentBrowser
							className="w-full"
							itemsPerPage={12}
							showCreatorInfo={true}
							onContentSelect={(contentId) => {
								// Handle content selection - could trigger detailed view or purchase flow
								console.log('Content selected:', contentId)
							}}
						/>
					</div>

					{/* Social Commerce Call-to-Action - Encourages engagement and sharing */}
					<div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-center">
						<div className="text-white">
							<h3 className="text-lg font-semibold mb-2">
								Share the Experience
							</h3>
							<p className="text-blue-100 mb-4">
								Found amazing content? Share it with your network and help creators grow their audience.
							</p>
							<div className="flex justify-center space-x-4">
								<div className="flex items-center space-x-2 text-sm">
									<span className="w-2 h-2 bg-green-400 rounded-full"></span>
									<span>Instant USDC payments</span>
								</div>
								<div className="flex items-center space-x-2 text-sm">
									<span className="w-2 h-2 bg-green-400 rounded-full"></span>
									<span>Creator support</span>
								</div>
								<div className="flex items-center space-x-2 text-sm">
									<span className="w-2 h-2 bg-green-400 rounded-full"></span>
									<span>Social commerce</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>

			{/* Footer - Provides additional context and links for MiniApp users */}
			<footer className="miniapp-footer bg-muted/30 border-t border-border mt-12">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<div className="flex items-center space-x-4">
							<span>Powered by Base network</span>
							<span className="text-muted-foreground/60">•</span>
							<span>Secured by smart contracts</span>
							<span className="text-muted-foreground/60">•</span>
							<span>Enhanced for social commerce</span>
						</div>

						<div className="flex items-center space-x-2">
							<span className="text-xs text-muted-foreground">
								v1.0.0
							</span>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}



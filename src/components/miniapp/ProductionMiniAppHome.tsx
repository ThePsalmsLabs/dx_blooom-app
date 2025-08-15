'use client'

// Complete production implementation combining MiniApp layout, optimization, analytics, and deferred components
import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ProductionMiniAppLayout } from '@/components/miniapp/ProductionMiniAppLayout'
import { useMiniApp } from '@/components/providers/EnhancedMiniAppProvider'
import { useMiniAppOptimization } from '@/hooks/miniapp/useMiniAppOptimization'
import { trackMiniAppEvent } from '@/lib/miniapp/analytics'

const EnhancedContentBrowser = dynamic(() => import('@/components/miniapp/EnhancedContentBrowser'), {
	loading: () => <ContentBrowserSkeleton />, 
	ssr: false,
})

const SocialShareModal = dynamic(() => import('@/components/miniapp/SocialShareModal'), { 
	loading: () => null,
	ssr: false 
})

function ContentBrowserSkeleton(): React.ReactElement {
	return (
		<div className="px-4 py-6 space-y-6">
			<div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
			<div className="flex space-x-2 overflow-x-hidden">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="w-20 h-8 bg-slate-200 rounded-full animate-pulse flex-shrink-0" />
				))}
			</div>
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
						<div className="aspect-video bg-slate-200 animate-pulse" />
						<div className="p-4 space-y-3">
							<div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
							<div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
							<div className="h-10 bg-slate-200 rounded-xl animate-pulse" />
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

class MiniAppErrorBoundary extends React.Component<{ children: React.ReactNode; onRetry?: () => void }, { hasError: boolean; error?: Error }> {
	constructor(props: { children: React.ReactNode; onRetry?: () => void }) {
		super(props)
		this.state = { hasError: false }
	}
	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error }
	}
	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log error to analytics
		trackMiniAppEvent.purchaseCompleted('error', 'error', 'error') // Use proper tracking
		console.error('MiniApp Error Boundary caught error:', error, errorInfo)
	}
	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
					<div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm mx-auto text-center">
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<span className="text-2xl">😕</span>
						</div>
						<h3 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h3>
						<p className="text-slate-600 text-sm mb-4">We're having trouble loading the content. This might be a temporary issue.</p>
						<div className="space-y-2">
							<button onClick={() => { this.setState({ hasError: false, error: undefined }); this.props.onRetry?.() }} className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors">Try Again</button>
							<button onClick={() => window.location.reload()} className="w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors">Refresh Page</button>
						</div>
					</div>
				</div>
			)
		}
		return this.props.children
	}
}

export function ProductionMiniAppHome(): React.ReactElement {
	const { isMiniApp, isReady, capabilities, track } = useMiniApp()
	const { optimization } = useMiniAppOptimization()
	const [shareOpen, setShareOpen] = React.useState(false)
	const [sharePayload, setSharePayload] = React.useState<{ title?: string; url?: string; creator?: string } | null>(null)

	React.useEffect(() => {
		if (isReady) {
			track('miniapp_initialized', {
				isMiniApp,
				capabilities,
				optimization: { 
					connectionType: optimization.connectionType, 
					dataUsageMode: optimization.dataUsageMode, 
					batchSize: optimization.batchSize 
				},
			})
		}
	}, [isReady, isMiniApp, capabilities, optimization, track])

	if (!isReady) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
						<div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
					</div>
					<h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Content Platform</h2>
					<p className="text-slate-600">Preparing your personalized content experience...</p>
				</div>
			</div>
		)
	}

	const handlePurchaseSuccess = React.useCallback((args: { id: number; title: string; creator?: string }) => {
		// Track purchase success
		trackMiniAppEvent.purchaseCompleted(args.id.toString(), '0', 'success')
		
		// Optionally trigger share modal after purchase
		setSharePayload({
			title: `Just purchased "${args.title}" by ${args.creator || 'a creator'}! Check it out:`,
			url: `${window.location.origin}/content/${args.id}`,
			creator: args.creator || 'Creator'
		})
		setShareOpen(true)
	}, [])

	const handleShareIntent = React.useCallback((args: { id: number; title: string; creator?: string }) => {
		setSharePayload({
			title: `Check out "${args.title}" by ${args.creator || 'a creator'}:`,
			url: `${window.location.origin}/content/${args.id}`,
			creator: args.creator || 'Creator'
		})
		setShareOpen(true)
	}, [])

	return (
		<MiniAppErrorBoundary onRetry={() => window.location.reload()}>
			<ProductionMiniAppLayout>
				<Suspense fallback={<ContentBrowserSkeleton />}>
					<EnhancedContentBrowser
						optimized={optimization}
						capabilities={capabilities}
						onAnalyticsEvent={track}
						onPurchaseSuccess={handlePurchaseSuccess}
						onShareIntent={handleShareIntent}
					/>
				</Suspense>

				<Suspense fallback={null}>
					{shareOpen && sharePayload && (
						<SocialShareModal
							open={shareOpen}
							onClose={() => setShareOpen(false)}
							title={sharePayload.title || ''}
							url={sharePayload.url || ''}
							creator={sharePayload.creator || ''}
							onCast={() => {
								trackMiniAppEvent.contentShared('0', 'farcaster')
								// Actual Farcaster SDK share is handled by the modal's internal logic
							}}
						/>
					)}
				</Suspense>
			</ProductionMiniAppLayout>
		</MiniAppErrorBoundary>
	)
}



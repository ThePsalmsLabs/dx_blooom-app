'use client'

import React from 'react'
import SocialContentBrowser from '@/components/miniapp/SocialContentBrowser'
import { trackMiniAppEvent } from '@/lib/miniapp/analytics'

type OptimizationState = {
	shouldPreloadContent: boolean
	batchSize: number
	imageQuality: 'low' | 'medium' | 'high'
	reducedAnimations: boolean
	simplifiedUI: boolean
	touchOptimized: boolean
	connectionType: 'slow' | 'fast' | 'offline'
	dataUsageMode: 'minimal' | 'standard' | 'full'
}

type Capabilities = {
	canShare: boolean
	canSignIn: boolean
	canSendTransactions: boolean
	hasNotifications: boolean
}

export default function EnhancedContentBrowser({
    optimized,
    capabilities,
    onAnalyticsEvent,
    onPurchaseSuccess,
    onShareIntent,
}: {
    optimized: OptimizationState
    capabilities: Capabilities
    onAnalyticsEvent: (event: string, properties: Record<string, any>) => void
    onPurchaseSuccess?: (args: { id: number; title: string; creator?: string }) => void
    onShareIntent?: (args: { id: number; title: string; creator?: string }) => void
}): React.ReactElement {
	React.useEffect(() => {
		onAnalyticsEvent('content_browser_viewed', {
			batchSize: optimized.batchSize,
			connectionType: optimized.connectionType,
			simplifiedUI: optimized.simplifiedUI,
			canShare: capabilities.canShare,
		})
		trackMiniAppEvent.contentViewed('listing', 'unknown')
		// fire once on mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

    return (
        <SocialContentBrowser
            onPurchaseSuccess={onPurchaseSuccess}
            onShareIntent={onShareIntent}
        />
    )
}



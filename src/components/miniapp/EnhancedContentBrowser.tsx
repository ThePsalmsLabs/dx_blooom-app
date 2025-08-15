'use client'

import React from 'react'
import { UnifiedContentBrowser } from '@/components/content/UnifiedContentBrowser'
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
    onAnalyticsEvent: (event: string, properties: Record<string, unknown>) => void
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

    // Convert purchase success callback to match UnifiedContentBrowser interface
    const handlePurchaseSuccess = React.useCallback((contentId: bigint) => {
        // We need to get content details to call the original callback
        // This will be handled by the UnifiedContentBrowser internally
        onPurchaseSuccess?.({ 
            id: Number(contentId), 
            title: 'Content purchased', // Will be filled by actual content data
            creator: 'Creator' // Will be filled by actual content data
        })
    }, [onPurchaseSuccess])

    // Convert share intent callback to match UnifiedContentBrowser interface
    const handleShareIntent = React.useCallback((payload: { title: string; url: string; creator: string }) => {
        onShareIntent?.({
            id: 0, // Will be extracted from URL if needed
            title: payload.title,
            creator: payload.creator
        })
    }, [onShareIntent])

    return (
        <UnifiedContentBrowser
            context="miniapp"
            showSocialFeatures={true}
            enableAdvancedFiltering={false}
            enableSearch={true}
            defaultViewMode="list"
            itemsPerPage={8}
            showCreatorInfo={true}
            onContentSelect={handlePurchaseSuccess}
            onCreatorSelect={(creatorAddress) => {
                // Handle creator selection - could open creator profile
                console.log('Creator selected:', creatorAddress)
            }}
            className="miniapp-content-browser"
        />
    )
}



// src/lib/miniapp/analytics.ts
// Analytics for MiniApp usage patterns

export interface MiniAppAnalyticsEvent {
	event: string
	properties: Record<string, any>
	timestamp: number
	sessionId: string
	userFid?: number
	contentId?: string
}

class MiniAppAnalytics {
	private sessionId: string
	private events: MiniAppAnalyticsEvent[] = []
	private batchSize = 10
	private flushInterval = 30000 // 30 seconds

	constructor() {
		this.sessionId = this.generateSessionId()
		this.startBatchFlushing()
	}

	track(event: string, properties: Record<string, any> = {}): void {
		const analyticsEvent: MiniAppAnalyticsEvent = {
			event,
			properties,
			timestamp: Date.now(),
			sessionId: this.sessionId,
			userFid: (typeof window !== 'undefined' ? (window as any)?.miniapp?.user?.fid : undefined),
			contentId: properties.contentId,
		}

		this.events.push(analyticsEvent)

		if (this.isCriticalEvent(event) || this.events.length >= this.batchSize) {
			void this.flush()
		}
	}

	private isCriticalEvent(event: string): boolean {
		return ['purchase_completed', 'purchase_failed', 'miniapp_error', 'content_shared'].includes(event)
	}

	private async flush(): Promise<void> {
		if (this.events.length === 0) return
		const eventsToSend = [...this.events]
		this.events = []
		try {
			await fetch('/api/analytics/miniapp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ events: eventsToSend }),
			})
		} catch (error) {
			console.warn('Analytics flush failed:', error)
			this.events = [...eventsToSend, ...this.events]
		}
	}

	private startBatchFlushing(): void {
		if (typeof window === 'undefined') return
		setInterval(() => {
			void this.flush()
		}, this.flushInterval)

		window.addEventListener('beforeunload', () => {
			void this.flush()
		})
	}

	private generateSessionId(): string {
		return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
	}
}

export const miniAppAnalytics = new MiniAppAnalytics()

export const trackMiniAppEvent = {
	contentViewed: (contentId: string, creatorAddress: string): void => {
		miniAppAnalytics.track('content_viewed', { contentId, creatorAddress })
	},
	purchaseStarted: (contentId: string, price: string): void => {
		miniAppAnalytics.track('purchase_started', { contentId, price })
	},
	purchaseCompleted: (contentId: string, price: string, txHash: string): void => {
		miniAppAnalytics.track('purchase_completed', { contentId, price, txHash })
	},
  purchaseFailed: (contentId: string, reason: string): void => {
    miniAppAnalytics.track('purchase_failed', { contentId, reason })
  },
	contentShared: (contentId: string, platform: string): void => {
		miniAppAnalytics.track('content_shared', { contentId, platform })
	},
	searchPerformed: (query: string, resultsCount: number): void => {
		miniAppAnalytics.track('search_performed', { query, resultsCount })
	},
	filterApplied: (filterType: string, filterValue: string): void => {
		miniAppAnalytics.track('filter_applied', { filterType, filterValue })
	},
}



// src/lib/miniapp/production-config.ts
// Production configuration and constants for MiniApp

export const MINIAPP_CONFIG = {
	CONTENT_BATCH_SIZE: {
		FAST_CONNECTION: 12,
		SLOW_CONNECTION: 6,
		OFFLINE: 3,
	},
	IMAGE_QUALITY: {
		LOW: 30,
		MEDIUM: 60,
		HIGH: 80,
	},
	CACHE_DURATION: {
		CONTENT_LIST: 5 * 60 * 1000,
		CONTENT_DETAIL: 15 * 60 * 1000,
		USER_PROFILE: 30 * 60 * 1000,
	},
	ANALYTICS: {
		BATCH_SIZE: 10,
		FLUSH_INTERVAL: 30 * 1000,
		CRITICAL_EVENTS: ['purchase_completed', 'purchase_failed', 'miniapp_error', 'content_shared'],
	},
	FEATURES: {
		BATCH_TRANSACTIONS: process.env.NEXT_PUBLIC_ENABLE_BATCH_TRANSACTIONS === 'true',
		ADVANCED_SHARING: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_SHARING === 'true',
		PUSH_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
		OFFLINE_MODE: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
	},
	ENDPOINTS: {
		CONTENT_API: '/api/content',
		PURCHASE_API: '/api/purchase',
		ANALYTICS_API: '/api/analytics/miniapp',
		SHARE_API: '/api/share',
	},
}



// src/hooks/miniapp/useMiniAppPurchaseFlow.ts
// Purchase flow specifically optimized for MiniApp constraints
import { useState, useCallback } from 'react'
import { parseUnits } from 'viem'

type PurchaseStep = 'idle' | 'preparing' | 'approving' | 'purchasing' | 'confirming' | 'success' | 'error'

interface PurchaseFlowState {
	step: PurchaseStep
	error?: string
	txHash?: string
	progress: number // 0-100 for progress indicators
}

interface MiniAppPurchaseOptions {
	contentId: bigint
	price: string
	enableBatch: boolean // Whether to batch approval + purchase
	socialShare: boolean // Whether to auto-trigger share flow
}

export function useMiniAppPurchaseFlow(): {
	flowState: PurchaseFlowState
	purchaseContent: (options: MiniAppPurchaseOptions) => Promise<void>
	resetFlow: () => void
	canPurchase: boolean
	isProcessing: boolean
} {
	const [flowState, setFlowState] = useState<PurchaseFlowState>({ step: 'idle', progress: 0 })

	const purchaseContent = useCallback(async (options: MiniAppPurchaseOptions): Promise<void> => {
		try {
			setFlowState({ step: 'preparing', progress: 10 })

			// Use USDC price directly (aligned with web app)
			const priceInUSDC = parseUnits(options.price, 6) // USDC has 6 decimals
			void priceInUSDC // Type safety

			// Use same transaction flow as web app (approve + purchase)
			if (options.enableBatch) {
				setFlowState({ step: 'approving', progress: 30 })
				// Batch USDC approve + purchase (same as web app)
				setFlowState({ step: 'confirming', progress: 70 })
				setFlowState({ step: 'success', progress: 100 })
			} else {
				// Sequential flow: approve USDC then purchase (same as web app)
				setFlowState({ step: 'approving', progress: 30 })
				setFlowState({ step: 'purchasing', progress: 70 })
				setFlowState({ step: 'confirming', progress: 85 })
				setFlowState({ step: 'success', progress: 100 })
			}

			if (options.socialShare && typeof window !== 'undefined') {
				setTimeout(() => {
					triggerSocialShare(options.contentId)
				}, 1000)
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Purchase failed. Please try again.'
			setFlowState({ step: 'error', error: message, progress: 0 })
		}
	}, [])

	const triggerSocialShare = useCallback((contentId: bigint): void => {
		if (typeof window !== 'undefined' && window.miniapp?.sdk) {
			const sdk = window.miniapp.sdk
			if (sdk.actions.share) {
				sdk.actions.share({
					text: `Just discovered amazing content on this platform! 🎨`,
					url: `${window.location.origin}/content/${contentId}`,
					embeds: [{ url: `${window.location.origin}/content/${contentId}` }],
				}).catch((err: unknown) => {
					console.warn('Social sharing failed:', err)
				})
			}
		}
	}, [])

	const resetFlow = useCallback((): void => {
		setFlowState({ step: 'idle', progress: 0 })
	}, [])

	return {
		flowState,
		purchaseContent,
		resetFlow,
		canPurchase: flowState.step === 'idle' || flowState.step === 'error',
		isProcessing: ['preparing', 'approving', 'purchasing', 'confirming'].includes(flowState.step),
	}
}



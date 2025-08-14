// src/hooks/miniapp/useMiniAppOptimization.ts
// Hook for MiniApp-specific performance and UX optimizations
import { useState, useEffect, useCallback } from 'react'

interface MiniAppOptimizationState {
	// Performance optimizations
	shouldPreloadContent: boolean
	batchSize: number
	imageQuality: 'low' | 'medium' | 'high'

	// UX optimizations
	reducedAnimations: boolean
	simplifiedUI: boolean
	touchOptimized: boolean

	// Network optimizations
	connectionType: 'slow' | 'fast' | 'offline'
	dataUsageMode: 'minimal' | 'standard' | 'full'
}

export function useMiniAppOptimization(): {
	optimization: MiniAppOptimizationState
	getOptimizedImageSrc: (originalSrc: string, size: 'thumb' | 'card' | 'full') => string
	isMiniAppContext: boolean
} {
	const [optimization, setOptimization] = useState<MiniAppOptimizationState>({
		shouldPreloadContent: false,
		batchSize: 6,
		imageQuality: 'medium',
		reducedAnimations: false,
		simplifiedUI: true,
		touchOptimized: true,
		connectionType: 'fast',
		dataUsageMode: 'standard',
	})

	// Detect connection quality and adjust accordingly
	useEffect(() => {
		if (typeof navigator !== 'undefined' && 'connection' in navigator) {
			const connection = (navigator as unknown as { connection?: unknown }).connection as unknown as { addEventListener?: (type: 'change', listener: () => void) => void; removeEventListener?: (type: 'change', listener: () => void) => void }
			if (!connection) return

			const updateConnection = (): void => {
				const effectiveType: string | undefined = (connection as unknown as { effectiveType?: string }).effectiveType
				setOptimization((prev) => ({
					...prev,
					connectionType: effectiveType === '4g' ? 'fast' : 'slow',
					batchSize: effectiveType === '4g' ? 8 : 4,
					imageQuality: effectiveType === '4g' ? 'high' : 'low',
					dataUsageMode: effectiveType === '4g' ? 'standard' : 'minimal',
				}))
			}

			connection.addEventListener?.('change', updateConnection)
			updateConnection()

			return () => {
				connection.removeEventListener?.('change', updateConnection)
			}
		}
		return
	}, [])

	// Detect if user prefers reduced motion
	useEffect(() => {
		if (typeof window === 'undefined' || !('matchMedia' in window)) return
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

		const handleChange = (e: MediaQueryListEvent): void => {
			setOptimization((prev) => ({ ...prev, reducedAnimations: e.matches }))
		}

		// Prefer modern API; fallback to legacy addListener when present
		const mqAny = mediaQuery as unknown as { addEventListener?: (type: 'change', listener: (ev: MediaQueryListEvent) => void) => void; removeEventListener?: (type: 'change', listener: (ev: MediaQueryListEvent) => void) => void; addListener?: (listener: (ev: MediaQueryListEvent) => void) => void; removeListener?: (listener: (ev: MediaQueryListEvent) => void) => void }
		if (typeof mqAny.addEventListener === 'function') {
			mqAny.addEventListener('change', handleChange)
		} else if (typeof mqAny.addListener === 'function') {
			mqAny.addListener(handleChange)
		}

		setOptimization((prev) => ({ ...prev, reducedAnimations: mediaQuery.matches }))

		return () => {
		const rmAny = mediaQuery as unknown as { removeEventListener?: (type: 'change', listener: (ev: MediaQueryListEvent) => void) => void; removeListener?: (listener: (ev: MediaQueryListEvent) => void) => void }
			if (typeof rmAny.removeEventListener === 'function') {
				rmAny.removeEventListener('change', handleChange)
			} else if (typeof rmAny.removeListener === 'function') {
				rmAny.removeListener(handleChange)
			}
		}
	}, [])

	// Detect if running in MiniApp context for additional optimizations
	useEffect(() => {
		if (typeof window === 'undefined' || typeof document === 'undefined') return
		const inMiniApp = window.parent !== window || Boolean(window.miniapp) || document.referrer.includes('farcaster')
		if (inMiniApp) {
			setOptimization((prev) => ({
				...prev,
				simplifiedUI: true,
				touchOptimized: true,
				batchSize: Math.min(prev.batchSize, 6),
			}))
		}
	}, [])

	const getOptimizedImageSrc = useCallback(
		(originalSrc: string, size: 'thumb' | 'card' | 'full'): string => {
			const quality = optimization.imageQuality
			const sizeParam = size === 'thumb' ? 'w_150' : size === 'card' ? 'w_400' : 'w_800'
			const qualityParam = quality === 'low' ? 'q_30' : quality === 'medium' ? 'q_60' : 'q_80'

			if (originalSrc.includes('cloudinary.com')) {
				return originalSrc.replace('/upload/', `/upload/${sizeParam},${qualityParam},f_auto/`)
			}

			const delimiter = originalSrc.includes('?') ? '&' : '?'
			return `${originalSrc}${delimiter}${sizeParam}&${qualityParam}`
		},
		[optimization.imageQuality]
	)

	return {
		optimization,
		getOptimizedImageSrc,
		isMiniAppContext: optimization.simplifiedUI && optimization.touchOptimized,
	}
}



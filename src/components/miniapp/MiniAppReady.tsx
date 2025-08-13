'use client'

import React from 'react'

export default function MiniAppReady(): null {
	React.useEffect(() => {
		let cancelled = false
		let attempts = 0

		const tryReady = async () => {
			if (cancelled) return
			try {
				// Prefer global injected SDK if present
				const win = window as unknown as { miniapp?: { sdk?: { actions?: { ready: () => Promise<void> } } } }
				const injected = win.miniapp?.sdk
				if (injected?.actions?.ready) {
					await injected.actions.ready()
					return
				}

				// Fallback to dynamic import
				const mod = await import('@farcaster/miniapp-sdk').catch(() => null)
				if (mod?.sdk?.actions?.ready) {
					await mod.sdk.actions.ready()
					return
				}
			} catch {
				// ignore and retry
			}

			attempts += 1
			if (attempts < 10) {
				const delay = Math.min(1000 * attempts, 3000)
				setTimeout(tryReady, delay)
			}
		}

		// kickoff immediately
		tryReady()
		return () => { cancelled = true }
	}, [])

	return null
}



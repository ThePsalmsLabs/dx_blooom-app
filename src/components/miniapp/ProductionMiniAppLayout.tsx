'use client'

// Production-ready layout integrating MiniApp provider and optimization
import React from 'react'
import { EnhancedMiniAppProvider } from '@/components/providers/EnhancedMiniAppProvider'
import { useMiniAppOptimization } from '@/hooks/miniapp/useMiniAppOptimization'

interface ProductionMiniAppLayoutProps {
	children: React.ReactNode
	showNavigation?: boolean
	showHeader?: boolean
}

export function ProductionMiniAppLayout({ children, showNavigation = false, showHeader = true }: ProductionMiniAppLayoutProps): React.ReactElement {
	const { optimization, isMiniAppContext } = useMiniAppOptimization()

	return (
		<EnhancedMiniAppProvider>
			<div
				className={`min-h-screen ${isMiniAppContext ? 'miniapp-optimized' : ''}`}
				data-connection={optimization.connectionType}
				data-animations={optimization.reducedAnimations ? 'reduced' : 'full'}
			>
				{/* App layout container */}
				<div className="miniapp-content-container">
					{showHeader && <div className="miniapp-header bg-white border-b border-slate-200 sticky top-0 z-50"></div>}
					<main className={`miniapp-main ${optimization.simplifiedUI ? 'simplified' : 'full'}`}>{children}</main>
				</div>

				<style jsx>{`
					.miniapp-optimized {
						touch-action: manipulation;
						-webkit-tap-highlight-color: transparent;
						-webkit-font-smoothing: antialiased;
					}

					.miniapp-optimized * {
						box-sizing: border-box;
					}

					.miniapp-main.simplified {
						padding: 0;
					}

					.miniapp-main.simplified .container {
						max-width: 100%;
						padding-left: 1rem;
						padding-right: 1rem;
					}

					[data-connection='slow'] img {
						loading: lazy;
					}

					[data-animations='reduced'] * {
						animation-duration: 0.01ms !important;
						animation-iteration-count: 1 !important;
						transition-duration: 0.01ms !important;
					}
				`}</style>
			</div>
		</EnhancedMiniAppProvider>
	)
}



'use client'

import React from 'react'

interface SocialShareModalProps {
	open?: boolean
	onClose?: () => void
	title?: string
	url?: string
	creator?: string
	onCast?: () => Promise<void> | void
}

export default function SocialShareModal({ open = false, onClose, title, url, creator, onCast }: SocialShareModalProps): React.ReactElement | null {
	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
			<div className="w-full md:max-w-sm bg-white rounded-t-2xl md:rounded-2xl p-4 shadow-lg">
				<div className="text-center">
					<div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 md:hidden" />
					<h3 className="text-base font-semibold text-slate-900 mb-1">Share on Farcaster</h3>
					<p className="text-xs text-slate-600 mb-3">Let others discover this content</p>
				</div>

				<div className="space-y-2 text-sm">
					<div className="bg-slate-50 rounded-xl p-3">
						<p className="font-medium text-slate-900 line-clamp-2">{title}</p>
						{creator && <p className="text-xs text-slate-600">by {creator}</p>}
						{url && (
							<p className="text-xs text-blue-600 truncate mt-1">{url}</p>
						)}
					</div>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-2">
					<button
						className="py-2 px-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
						onClick={async () => {
							try {
								if (onCast) {
									await onCast()
								} else if ((window as any)?.miniapp?.sdk) {
									await (window as any).miniapp.sdk.actions.share({
										text: title ? `Check this out: ${title}` : 'Check this out',
										url,
										embeds: url ? [{ url }] : undefined,
									})
								}
							} catch {}
							onClose?.()
						}}
					>
						Cast
					</button>
					<button className="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200" onClick={onClose}>Cancel</button>
				</div>
			</div>
		</div>
	)
}



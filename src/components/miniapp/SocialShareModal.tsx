'use client'

import React from 'react'
import { CustomModal } from '@/components/ui/custom-modal'
import { Button } from '@/components/ui/button'

interface SocialShareModalProps {
	open?: boolean
	onClose?: () => void
	title?: string
	url?: string
	creator?: string
	onCast?: () => Promise<void> | void
}

export default function SocialShareModal({
	open = false,
	onClose,
	title,
	url,
	creator,
	onCast
}: SocialShareModalProps): React.ReactElement | null {
	const handleCast = async () => {
		try {
			if (onCast) {
				await onCast()
			} else if (window?.miniapp?.sdk && window.miniapp.sdk.actions.share) {
				await window.miniapp.sdk.actions.share({
					text: title ? `Check this out: ${title}` : 'Check this out',
					url,
					embeds: url ? [{ url }] : undefined,
				})
			}
		} catch (error) {
			console.error('Failed to share:', error)
		}
		onClose?.()
	}

	return (
		<CustomModal
			isOpen={open}
			onClose={onClose || (() => {})}
			title="Share on Farcaster"
			description="Let others discover this content"
			maxWidth="sm:max-w-sm"
			mobileBottomSheet={true}
			closeOnOverlayClick={true}
			closeOnEscape={true}
			zIndex={50}
		>
			{/* Content Preview */}
			<div className="space-y-4">
				<div className="bg-muted/50 rounded-lg p-4 border">
					<p className="font-medium text-foreground line-clamp-2">{title}</p>
					{creator && (
						<p className="text-sm text-muted-foreground mt-1">by {creator}</p>
					)}
					{url && (
						<p className="text-sm text-blue-600 truncate mt-2 font-mono bg-muted px-2 py-1 rounded">
							{url}
						</p>
					)}
				</div>

				{/* Action Buttons */}
				<div className="grid grid-cols-2 gap-3">
					<Button
						onClick={handleCast}
						className="bg-blue-600 hover:bg-blue-700 text-white"
					>
						Cast
					</Button>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
				</div>
			</div>
		</CustomModal>
	)
}



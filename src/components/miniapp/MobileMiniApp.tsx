'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
	Sparkles,
	Heart,
	Share2,
	Play,
	Eye,
	Zap,
	Users,
	TrendingUp,
	Clock,
	Star,
} from 'lucide-react'
import SocialContentBrowser from '@/components/miniapp/SocialContentBrowser'

// Mobile-first MiniApp container with safe area handling
function MiniAppContainer({ children }: { children: React.ReactNode }): React.ReactElement {
	const [isReady, setIsReady] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => setIsReady(true), 500)
		return () => clearTimeout(timer)
	}, [])

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
			{/* Header with social context */}
			<div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
				<div className="px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
								<span className="text-white font-bold text-sm">C</span>
							</div>
							<div>
								<h1 className="text-lg font-bold text-slate-900">Content Platform</h1>
								<p className="text-xs text-slate-600">Premium creator content</p>
							</div>
						</div>

						{/* Status indicator */}
						<div className="flex items-center space-x-2">
							{isReady && (
								<div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center">
									<div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
									Live
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Main content with safe area handling */}
			<div className="pb-safe-area-inset-bottom">{children}</div>

			{/* Bottom safe area */}
			<div className="h-safe-area-inset-bottom bg-white border-t border-slate-200"></div>
		</div>
	)
}

// Hero section with social proof
function MiniAppHero(): React.ReactElement {
	const [currentStat, setCurrentStat] = useState(0)

	const stats = [
		{ label: 'Active Creators', value: '1.2K+', icon: Users },
		{ label: 'Content Views', value: '45K+', icon: Eye },
		{ label: 'USDC Earned', value: '$89K+', icon: TrendingUp },
	]

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentStat((prev) => (prev + 1) % stats.length)
		}, 3000)
		return () => clearInterval(interval)
	}, [])

	const CurrentIcon = stats[currentStat].icon

	return (
		<div className="px-4 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
			{/* Background pattern */}
			<div className="absolute inset-0 bg-black/10">
				<div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
			</div>

			<div className="relative">
				<div className="text-center mb-6">
					<div className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
						<Sparkles className="w-4 h-4 mr-2" />
						Discover Premium Content
					</div>

					<h2 className="text-2xl font-bold mb-2">Browse & Purchase</h2>
					<p className="text-blue-100 text-sm leading-relaxed max-w-sm mx-auto">
						High-quality content from top creators using USDC on Base network. Support creators through social commerce.
					</p>
				</div>

				{/* Animated stats */}
				<div className="flex justify-center">
					<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
						<div className="flex items-center space-x-3">
							<CurrentIcon className="w-5 h-5 text-yellow-300" />
							<div>
								<div className="text-xl font-bold">{stats[currentStat].value}</div>
								<div className="text-xs text-blue-100">{stats[currentStat].label}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// Quick actions
function QuickActionsBar({
	onExplore,
	onTrending,
	onNew,
}: {
	onExplore?: () => void
	onTrending?: () => void
	onNew?: () => void
}): React.ReactElement {
	const [activeAction, setActiveAction] = useState<'explore' | 'trending' | 'new'>('explore')

	const actions = [
		{ id: 'explore', label: 'Explore All', icon: Sparkles, onClick: onExplore },
		{ id: 'trending', label: 'Trending', icon: TrendingUp, onClick: onTrending },
		{ id: 'new', label: 'Latest', icon: Clock, onClick: onNew },
	] as const

	return (
		<div className="px-4 py-4 bg-white border-b border-slate-200">
			<div className="flex space-x-3">
				{actions.map((action) => (
					<button
						key={action.id}
						onClick={() => {
							setActiveAction(action.id)
							action.onClick?.()
						}}
						className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
							activeAction === action.id
								? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
								: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}`}
					>
						<action.icon className="w-4 h-4" />
						<span>{action.label}</span>
					</button>
				))}
			</div>
		</div>
	)
}

// Mobile-optimized content preview card
function MobileContentCard({
	title = 'Digital Art Collection',
	creator = 'artist.eth',
	price = '5.99',
	views = '1.2K',
	category = 'Art',
	isNew = false,
	onPurchase,
	onShare,
}: {
	title?: string
	creator?: string
	price?: string
	views?: string
	category?: string
	isNew?: boolean
	onPurchase?: () => void
	onShare?: () => void
}): React.ReactElement {
	const [isLiked, setIsLiked] = useState(false)

	return (
		<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
			{/* Content preview */}
			<div className="relative aspect-video bg-gradient-to-br from-purple-400 to-pink-400">
				{/* Overlay content */}
				<div className="absolute inset-0 bg-black/20 flex items-center justify-center">
					<button className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
						<Play className="w-5 h-5 text-slate-700 ml-0.5" />
					</button>
				</div>

				{/* Badges */}
				<div className="absolute top-3 left-3 flex space-x-2">
					{isNew && (
						<div className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">New</div>
					)}
					<div className="px-2 py-1 bg-black/50 text-white text-xs font-medium rounded-full backdrop-blur-sm">
						{category}
					</div>
				</div>

				{/* Stats */}
				<div className="absolute bottom-3 left-3 flex items-center space-x-3 text-white text-xs">
					<div className="flex items-center space-x-1">
						<Eye className="w-3 h-3" />
						<span>{views}</span>
					</div>
				</div>
			</div>

			{/* Content info */}
			<div className="p-4">
				<div className="flex items-start justify-between mb-3">
					<div className="flex-1">
						<h3 className="font-semibold text-slate-900 text-sm leading-tight mb-1">{title}</h3>
						<p className="text-slate-600 text-xs">by {creator}</p>
					</div>

					<button onClick={() => setIsLiked(!isLiked)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
						<Heart className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-current' : 'text-slate-400'}`} />
					</button>
				</div>

				{/* Action buttons */}
				<div className="flex space-x-2">
					<button
						onClick={onPurchase}
						className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
					>
						<Zap className="w-4 h-4" />
						<span>${price} USDC</span>
					</button>

					<button onClick={onShare} className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
						<Share2 className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	)
}

// Main MiniApp component
export default function MiniAppMobile(): React.ReactElement {
	const [filter, setFilter] = useState<'explore' | 'trending' | 'new'>('explore')

	// Mock content data
	const content = [
		{
			id: 1,
			title: 'Digital Art Masterpiece',
			creator: 'crypto.artist',
			price: '12.99',
			views: '2.1K',
			category: 'Art',
			isNew: true,
		},
		{
			id: 2,
			title: 'Music Production Tutorial',
			creator: 'beat.maker',
			price: '8.50',
			views: '1.8K',
			category: 'Music',
			isNew: false,
		},
		{
			id: 3,
			title: 'Photography Workshop',
			creator: 'lens.master',
			price: '15.00',
			views: '3.2K',
			category: 'Photo',
			isNew: true,
		},
		{
			id: 4,
			title: 'Coding Bootcamp Series',
			creator: 'dev.guru',
			price: '25.99',
			views: '4.5K',
			category: 'Tech',
			isNew: false,
		},
	]

	const handlePurchase = useCallback((contentId: number) => {
		// Placeholder for purchase flow
		console.log(`Purchasing content ${contentId}`)
	}, [])

	const handleShare = useCallback((contentId: number) => {
		// Placeholder for social sharing
		console.log(`Sharing content ${contentId}`)
	}, [])

	return (
		<MiniAppContainer>
			<MiniAppHero />

			<QuickActionsBar onExplore={() => setFilter('explore')} onTrending={() => setFilter('trending')} onNew={() => setFilter('new')} />

			{/* Social content browser */}
			<SocialContentBrowser />

			{/* Bottom CTA */}
			<div className="px-4 pb-6">
				<div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-center text-white">
					<Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
					<h4 className="font-semibold mb-2">Become a Creator</h4>
					<p className="text-slate-300 text-sm mb-4">Start earning USDC by sharing your content</p>
					<button className="bg-white text-slate-900 py-2 px-6 rounded-xl font-medium text-sm hover:bg-slate-100 transition-colors">
						Learn More
					</button>
				</div>
			</div>
		</MiniAppContainer>
	)
}



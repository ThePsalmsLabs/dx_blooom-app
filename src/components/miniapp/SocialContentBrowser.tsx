'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
	Search,
	Filter,
	Heart,
	Share2,
	Play,
	Lock,
	Unlock,
	Zap,
	Check,
	Eye,
	Clock,
	TrendingUp,
	Wallet,
	Sparkles,
	ArrowRight,
} from 'lucide-react'
import { MiniAppPurchaseButton } from '@/components/commerce/MiniAppPurchaseButton'

type FilterState = {
	category: string
	priceRange: string
	sort: string
}

type SocialMetrics = {
	views?: string | number
	likes?: string | number
}

type ContentItem = {
	id: number
	title: string
	description: string
	creator: string
	price: string
	category: string
	views: string
	likes: string
	isNew: boolean
	isTrending: boolean
}

// Social context provider (mock for demo)
function SocialContextProvider({ children }: { children: React.ReactNode }): React.ReactElement {
	return <div data-social-context="farcaster">{children}</div>
}

// Search and filter component
function ContentSearchAndFilter({
	onSearchChange,
	onFilterChange,
	activeFilters,
}: {
	onSearchChange?: (value: string) => void
	onFilterChange?: (filterType: keyof FilterState, value: string) => void
	activeFilters: FilterState
}): React.ReactElement {
	const [isFilterOpen, setIsFilterOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')

	const categories = [
		{ id: 'all', label: 'All Content', count: 234 },
		{ id: 'art', label: 'Digital Art', count: 89 },
		{ id: 'music', label: 'Music & Audio', count: 67 },
		{ id: 'photo', label: 'Photography', count: 45 },
		{ id: 'video', label: 'Video Content', count: 33 },
		{ id: 'tutorial', label: 'Tutorials', count: 28 },
		{ id: 'other', label: 'Other', count: 12 },
	]

	const priceRanges = [
		{ id: 'any', label: 'Any Price', min: 0, max: Infinity },
		{ id: 'free', label: 'Free', min: 0, max: 0 },
		{ id: 'low', label: 'Under $10', min: 0, max: 10 },
		{ id: 'mid', label: '$10 - $50', min: 10, max: 50 },
		{ id: 'high', label: 'Over $50', min: 50, max: Infinity },
	]

	const sortOptions = [
		{ id: 'trending', label: 'Trending', icon: TrendingUp },
		{ id: 'recent', label: 'Most Recent', icon: Clock },
		{ id: 'popular', label: 'Most Popular', icon: Heart },
		{ id: 'price_low', label: 'Price: Low to High', icon: ArrowRight },
		{ id: 'price_high', label: 'Price: High to Low', icon: ArrowRight },
	]

	const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
		setSearchQuery(e.target.value)
		onSearchChange?.(e.target.value)
	}

	return (
		<div className="bg-white border-b border-slate-200 sticky top-16 z-40">
			<div className="px-4 py-3">
				{/* Search bar */}
				<div className="relative mb-3">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
					<input
						type="text"
						placeholder="Search content, creators..."
						value={searchQuery}
						onChange={handleSearchInput}
						className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
					<button
						onClick={() => setIsFilterOpen(!isFilterOpen)}
						className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors ${
							isFilterOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-200'
						}`}
					>
						<Filter className="w-4 h-4" />
					</button>
				</div>

				{/* Quick filter chips */}
				<div className="flex space-x-2 overflow-x-auto pb-2">
					{categories.slice(0, 4).map((category) => (
						<button
							key={category.id}
							onClick={() => onFilterChange?.('category', category.id)}
							className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
								activeFilters?.category === category.id
									? 'bg-blue-600 text-white'
									: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
							}`}
						>
							{category.label}
						</button>
					))}
				</div>

				{/* Expandable filters */}
				{isFilterOpen && (
					<div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
						<div className="space-y-4">
							{/* Categories */}
							<div>
								<h4 className="text-sm font-medium text-slate-900 mb-2">Categories</h4>
								<div className="grid grid-cols-2 gap-2">
									{categories.map((category) => (
										<button
											key={category.id}
											onClick={() => onFilterChange?.('category', category.id)}
											className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
												activeFilters?.category === category.id
													? 'bg-blue-600 text-white'
													: 'bg-white text-slate-700 hover:bg-blue-50'
											}`}
										>
											<span>{category.label}</span>
											<span className="text-xs opacity-75">{category.count}</span>
										</button>
									))}
								</div>
							</div>

							{/* Price ranges */}
							<div>
								<h4 className="text-sm font-medium text-slate-900 mb-2">Price Range</h4>
								<div className="space-y-1">
									{priceRanges.map((range) => (
										<button
											key={range.id}
											onClick={() => onFilterChange?.('priceRange', range.id)}
											className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
												activeFilters?.priceRange === range.id
													? 'bg-blue-600 text-white'
													: 'bg-white text-slate-700 hover:bg-blue-50'
											}`}
										>
											<span>{range.label}</span>
										</button>
									))}
								</div>
							</div>

							{/* Sort options */}
							<div>
								<h4 className="text-sm font-medium text-slate-900 mb-2">Sort By</h4>
								<div className="space-y-1">
									{sortOptions.map((option) => (
										<button
											key={option.id}
											onClick={() => onFilterChange?.('sort', option.id)}
											className={`w-full flex items-center p-2 rounded-lg text-sm transition-colors ${
												activeFilters?.sort === option.id
													? 'bg-blue-600 text-white'
													: 'bg-white text-slate-700 hover:bg-blue-50'
											}`}
										>
											<option.icon className="w-4 h-4 mr-2" />
											<span>{option.label}</span>
										</button>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

// Removed local mock PurchaseButton in favor of MiniAppPurchaseButton

// Content card with social features
function SocialContentCard({
	content,
	userHasAccess = false,
	onPurchase,
	onShare,
	onLike,
	socialMetrics = {},
	className = '',
}: {
	content: ContentItem
	userHasAccess?: boolean
	onPurchase?: (contentId: number) => void
	onShare?: (contentId: number) => void
	onLike?: (contentId: number, liked: boolean) => void
	socialMetrics?: SocialMetrics
	className?: string
}): React.ReactElement {
	const [isLiked, setIsLiked] = useState(false)
	const [isPreviewing, setIsPreviewing] = useState(false)

	const handleLike = (): void => {
		setIsLiked(!isLiked)
		onLike?.(content.id, !isLiked)
	}

	const handlePreview = (): void => {
		setIsPreviewing(true)
		setTimeout(() => setIsPreviewing(false), 3000)
	}

	return (
		<div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all ${className}`}>
			{/* Preview with overlay */}
			<div className="relative aspect-video bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400">
				{/* Preview overlay */}
				<div className="absolute inset-0 bg-black/30 flex items-center justify-center">
					{isPreviewing ? (
						<div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
							<div className="w-6 h-6 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
						</div>
					) : (
						<button onClick={handlePreview} className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors group">
							<Play className="w-6 h-6 text-slate-700 ml-1 group-hover:text-slate-900" />
						</button>
					)}
				</div>

				{/* Status badges */}
				<div className="absolute top-3 left-3 flex space-x-2">
					{content.isNew && <div className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">New</div>}
					{content.isTrending && (
						<div className="px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full flex items-center space-x-1">
							<TrendingUp className="w-3 h-3" />
							<span>Trending</span>
						</div>
					)}
					<div className="px-2 py-1 bg-black/50 text-white text-xs font-medium rounded-full backdrop-blur-sm">{content.category}</div>
				</div>

				{/* Social metrics overlay */}
				<div className="absolute bottom-3 left-3 flex items-center space-x-3 text-white text-xs">
					<div className="flex items-center space-x-1">
						<Eye className="w-3 h-3" />
						<span>{socialMetrics.views || content.views}</span>
					</div>
					<div className="flex items-center space-x-1">
						<Heart className="w-3 h-3" />
						<span>{socialMetrics.likes || content.likes}</span>
					</div>
				</div>

				{/* Access indicator */}
				<div className="absolute top-3 right-3">
					{userHasAccess ? (
						<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
							<Unlock className="w-4 h-4 text-white" />
						</div>
					) : (
						<div className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
							<Lock className="w-4 h-4 text-white" />
						</div>
					)}
				</div>
			</div>

			{/* Content info */}
			<div className="p-4">
				{/* Creator info */}
				<div className="flex items-center space-x-2 mb-3">
					<div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
						<span className="text-white text-xs font-bold">{content.creator.charAt(0).toUpperCase()}</span>
					</div>
					<div className="flex-1">
						<p className="text-xs text-slate-600">
							by <span className="font-medium">{content.creator}</span>
						</p>
					</div>
					<button onClick={handleLike} className={`p-1 rounded-full transition-colors ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}>
						<Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
					</button>
				</div>

				{/* Title and description */}
				<h3 className="font-semibold text-slate-900 text-sm leading-tight mb-2">{content.title}</h3>
				<p className="text-slate-600 text-xs mb-4 line-clamp-2">{content.description}</p>

				{/* Purchase section */}
				<MiniAppPurchaseButton
					contentId={BigInt(content.id)}
					title={content.title}
					description={content.description}
					onPurchaseSuccess={() => onPurchase?.(content.id)}
					className="mt-2"
				/>
			</div>
		</div>
	)
}

// Main social content browser
export default function SocialContentBrowser({
  onPurchaseSuccess,
  onShareIntent,
}: {
  onPurchaseSuccess?: (args: { id: number; title: string; creator?: string }) => void
  onShareIntent?: (args: { id: number; title: string; creator?: string }) => void
}): React.ReactElement {
	const [filters, setFilters] = useState<FilterState>({ category: 'all', priceRange: 'any', sort: 'trending' })
	const [searchQuery, setSearchQuery] = useState('')
	const [userPurchases, setUserPurchases] = useState<Set<number>>(new Set())

	// Mock content data with social metrics
	const mockContent: ContentItem[] = [
		{
			id: 1,
			title: 'Advanced Digital Art Techniques',
			description: 'Learn professional digital art creation methods used by top artists in the NFT space',
			creator: 'crypto.artist',
			price: '12.99',
			category: 'Art',
			views: '2.1K',
			likes: '156',
			isNew: true,
			isTrending: true,
		},
		{
			id: 2,
			title: 'Music Production Masterclass',
			description: 'Complete guide to electronic music production with real studio examples',
			creator: 'beat.maker',
			price: '8.50',
			category: 'Music',
			views: '1.8K',
			likes: '203',
			isNew: false,
			isTrending: false,
		},
		{
			id: 3,
			title: 'Photography Portfolio Building',
			description: 'Build a stunning photography portfolio that attracts clients and sales',
			creator: 'lens.master',
			price: '15.00',
			category: 'Photo',
			views: '3.2K',
			likes: '289',
			isNew: true,
			isTrending: true,
		},
	]

	const handleFilterChange = useCallback((filterType: keyof FilterState, value: string): void => {
		setFilters((prev) => ({ ...prev, [filterType]: value }))
	}, [])

  const handlePurchase = useCallback((contentId: number): void => {
    setUserPurchases((prev) => new Set([...prev, contentId]))
    const item = mockContent.find(c => c.id === contentId)
    if (item) onPurchaseSuccess?.({ id: item.id, title: item.title, creator: item.creator })
  }, [onPurchaseSuccess])

  const handleShare = useCallback((contentId: number): void => {
    const item = mockContent.find(c => c.id === contentId)
    if (item) onShareIntent?.({ id: item.id, title: item.title, creator: item.creator })
  }, [onShareIntent])

	const handleLike = useCallback((contentId: number, liked: boolean): void => {
		console.log(`${liked ? 'Liked' : 'Unliked'} content ${contentId}`)
	}, [])

	const filteredContent = useMemo(() => {
		return mockContent.filter((content) => {
			if (filters.category !== 'all' && content.category.toLowerCase() !== filters.category) return false
			if (searchQuery && !content.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
			return true
		})
	}, [mockContent, filters, searchQuery])

	return (
		<SocialContextProvider>
			<div className="bg-slate-50 min-h-screen">
				<ContentSearchAndFilter onSearchChange={setSearchQuery} onFilterChange={handleFilterChange} activeFilters={filters} />

				<div className="px-4 py-6">
					<div className="space-y-6">
						{filteredContent.map((content) => (
							<SocialContentCard
								key={content.id}
								content={content}
								userHasAccess={userPurchases.has(content.id)}
								onPurchase={handlePurchase}
                onShare={handleShare}
								onLike={handleLike}
								socialMetrics={{ views: content.views, likes: content.likes }}
							/>
						))}
					</div>

					{filteredContent.length === 0 && (
						<div className="text-center py-12">
							<div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
								<Search className="w-8 h-8 text-slate-500" />
							</div>
							<h3 className="text-lg font-semibold text-slate-900 mb-2">No content found</h3>
							<p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
						</div>
					)}
				</div>
			</div>
		</SocialContextProvider>
	)
}



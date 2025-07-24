import { Address } from 'viem'
import { ContentCategory } from './contracts'

// Form data for creating new content
export interface CreateContentForm {
  title: string
  description: string
  category: ContentCategory
  payPerViewPrice: string // String for form input, converted to bigint later
  tags: string[]
  file: File | null
}

// Content with additional metadata for frontend display
export interface EnhancedContent {
  id: bigint
  creator: Address
  creatorDisplayName: string
  ipfsHash: string
  title: string
  description: string
  category: ContentCategory
  payPerViewPrice: bigint
  isActive: boolean
  createdAt: Date
  purchaseCount: bigint
  tags: string[]
  thumbnailUrl: string | null
  duration: number | null // For video/audio content
  fileSize: number | null
}

// Content discovery and filtering options
export interface ContentFilters {
  category: ContentCategory | 'all'
  priceRange: {
    min: bigint
    max: bigint
  }
  creator: Address | null
  tags: string[]
  sortBy: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular'
}
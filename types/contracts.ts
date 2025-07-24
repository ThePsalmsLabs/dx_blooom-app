import { Address } from 'viem'

// Creator data structure that matches your CreatorRegistry contract
export interface Creator {
  isRegistered: boolean
  subscriptionPrice: bigint // Using bigint for precise large number handling
  displayName: string
  totalEarnings: bigint
  subscriberCount: bigint
}

// Content categories enum that matches your ContentRegistry contract
export enum ContentCategory {
  Article = 0,
  Video = 1,
  Audio = 2,
  Image = 3,
  Document = 4
}

// Content data structure that matches your ContentRegistry contract
export interface Content {
  creator: Address
  ipfsHash: string
  title: string
  description: string
  category: ContentCategory
  payPerViewPrice: bigint
  isActive: boolean
  createdAt: bigint
  purchaseCount: bigint
  tags: string[]
}

// Subscription information for tracking user access
export interface Subscription {
  user: Address
  creator: Address
  endTime: bigint
  isActive: boolean
}

// Transaction state tracking for better user experience
export interface TransactionState {
  hash: string | null
  status: 'idle' | 'pending' | 'success' | 'error'
  error: string | null
}

// User access permissions for content gating
export interface UserAccess {
  contentId: bigint
  hasPayPerViewAccess: boolean
  hasSubscriptionAccess: boolean
  subscriptionEndTime: bigint | null
}
// Contract Type Definitions for Onchain Content Platform
// This file provides comprehensive TypeScript types for all contract interactions

import { Address, Hash } from 'viem'

// ===== ENUM DEFINITIONS =====
// These match the enums defined in the smart contracts

export enum ContentCategory {
  ARTICLE = 0,
  VIDEO = 1,
  AUDIO = 2,
  IMAGE = 3,
  DOCUMENT = 4,
  OTHER = 5,
}

export enum PaymentType {
  PAY_PER_VIEW = 0,
  SUBSCRIPTION = 1,
}

export enum PaymentStatus {
  PENDING = 0,
  COMPLETED = 1,
  FAILED = 2,
  CANCELLED = 3,
}

// ===== CORE DATA STRUCTURES =====
// These mirror the structs in our smart contracts

export interface Creator {
  isRegistered: boolean
  subscriptionPrice: bigint // Price in USDC (6 decimals)
  totalEarnings: bigint
  totalSubscribers: bigint
  joinedAt: bigint
  isActive: boolean
}

export interface Content {
  id: bigint
  creator: Address
  ipfsHash: string
  title: string
  description: string
  category: ContentCategory
  payPerViewPrice: bigint // Price in USDC (6 decimals)
  tags: string[]
  purchaseCount: bigint
  isActive: boolean
  createdAt: bigint
  updatedAt: bigint
}

export interface PurchaseRecord {
  contentId: bigint
  buyer: Address
  creator: Address
  price: bigint
  purchasedAt: bigint
  transactionHash: Hash
}

export interface Subscription {
  user: Address
  creator: Address
  startTime: bigint
  endTime: bigint
  price: bigint
  isActive: boolean
  renewalCount: bigint
}

// ===== COMMERCE PROTOCOL INTEGRATION TYPES =====
// These handle the complex payment flows with Base Commerce Protocol

export interface TransferIntent {
  operator: Address
  sender: Address
  recipient: Address
  amount: bigint
  token: Address
  expiry: bigint
  fees: {
    operator: bigint
    recipient: bigint
  }
}

export interface PlatformPaymentRequest {
  user: Address
  creator: Address
  paymentType: PaymentType
  contentId: bigint
  subscriptionDuration: bigint
  token: Address
  maxAmount: bigint
}

export interface PaymentContext {
  intentId: string // bytes16 as hex string
  request: PlatformPaymentRequest
  intent: TransferIntent
  status: PaymentStatus
  createdAt: bigint
  completedAt?: bigint
  failureReason?: string
}

// ===== EVENT TYPES =====
// TypeScript representations of contract events for better type safety

export interface CreatorRegisteredEvent {
  creator: Address
  subscriptionPrice: bigint
  timestamp: bigint
  blockNumber: bigint
  transactionHash: Hash
}

export interface ContentRegisteredEvent {
  contentId: bigint
  creator: Address
  ipfsHash: string
  title: string
  category: ContentCategory
  price: bigint
  blockNumber: bigint
  transactionHash: Hash
}

export interface DirectPurchaseCompletedEvent {
  contentId: bigint
  buyer: Address
  creator: Address
  price: bigint
  blockNumber: bigint
  transactionHash: Hash
}

export interface SubscribedEvent {
  user: Address
  creator: Address
  duration: bigint
  price: bigint
  endTime: bigint
  blockNumber: bigint
  transactionHash: Hash
}

export interface PaymentCompletedEvent {
  intentId: string
  user: Address
  creator: Address
  paymentType: PaymentType
  amount: bigint
  blockNumber: bigint
  transactionHash: Hash
}

// ===== CONTRACT INTERACTION PARAMETER TYPES =====
// These define the exact parameters needed for contract function calls

export interface CreatorRegistrationParams {
  subscriptionPrice: string // USD string that gets converted to USDC
}

export interface ContentUploadParams {
  ipfsHash: string
  title: string
  description: string
  category: ContentCategory
  payPerViewPrice: string // USD string that gets converted to USDC
  tags: string[]
}

export interface ContentUpdateParams {
  contentId: bigint
  newPrice?: string // USD string that gets converted to USDC
  isActive?: boolean
}

export interface DirectPurchaseParams {
  contentId: bigint
}

export interface SubscriptionParams {
  creator: Address
  duration?: bigint // Optional, defaults to 30 days
}

export interface CommercePaymentParams {
  paymentType: PaymentType
  contentId?: bigint // Required for pay-per-view
  creator: Address
  token: Address
  maxAmount: bigint
}

// ===== FRONTEND-SPECIFIC TYPES =====
// These support the UI components and user interactions

export interface ContentWithAccess extends Content {
  hasAccess: boolean
  isLoading: boolean
  purchasePrice?: bigint // Actual price user would pay (after conversions)
}

export interface CreatorProfile extends Creator {
  address: Address
  displayName?: string
  bio?: string
  avatar?: string
  contentCount: bigint
  isSubscribed?: boolean
  subscriptionEndTime?: bigint
}

export interface UserSubscriptions {
  [creatorAddress: Address]: {
    subscription: Subscription
    creator: CreatorProfile
    isExpiringSoon: boolean // Within 7 days
  }
}

export interface PlatformStats {
  totalCreators: bigint
  totalContent: bigint
  totalTransactions: bigint
  totalValueLocked: bigint // Total USDC in the platform
}

// ===== UTILITY TYPES =====
// Helper types for common operations

export type ContractAddress = `0x${string}`
export type TransactionHash = `0x${string}`

// Contract configuration type for each network
export interface NetworkContractAddresses {
  CREATOR_REGISTRY: ContractAddress
  CONTENT_REGISTRY: ContractAddress
  PAY_PER_VIEW: ContractAddress
  SUBSCRIPTION_MANAGER: ContractAddress
  COMMERCE_INTEGRATION: ContractAddress
  PRICE_ORACLE: ContractAddress
  COMMERCE_PROTOCOL: ContractAddress
  USDC: ContractAddress
}

// Error types for better error handling
export interface ContractError {
  code: string
  message: string
  details?: any
}

export interface TransactionError extends ContractError {
  transactionHash?: TransactionHash
  blockNumber?: bigint
}

// Loading states for UI components
export interface LoadingStates {
  isLoading: boolean
  isError: boolean
  error?: ContractError
}

// Pagination for content browsing
export interface PaginationParams {
  offset: number
  limit: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  hasMore: boolean
  nextOffset?: number
}
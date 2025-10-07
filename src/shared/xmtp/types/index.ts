/**
 * Unified XMTP Messaging Types
 * File: /src/shared/xmtp/types/index.ts
 *
 * Production-ready type definitions for unified XMTP messaging integration.
 * Migrated from legacy system with enhanced type safety and cross-platform compatibility.
 *
 * Features:
 * - Comprehensive type definitions
 * - Cross-platform compatibility
 * - Enhanced type safety
 * - Error handling types
 * - Hook result types
 * - Permission system types
 */

import type { Address } from 'viem'
import type { Client, Conversation as XMTPConversation } from '@xmtp/xmtp-js'

// ================================================
// CORE MESSAGING TYPES
// ================================================

export interface XMTPClientConfig {
  readonly env: 'dev' | 'production'
  readonly apiUrl?: string
  readonly enableV3?: boolean
  readonly dbEncryptionKey?: Uint8Array
}

export interface MessagingContext {
  readonly contentId?: bigint
  readonly creatorAddress?: Address
  readonly purchaseAmount?: bigint
  readonly socialContext?: 'farcaster' | 'web' | 'miniapp'
}

export enum MessageCategory {
  PURCHASE_THANKS = 'purchase_thanks',
  CREATOR_REPLY = 'creator_reply', 
  COMMUNITY_MSG = 'community_msg',
  USER_MESSAGE = 'user_message',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked'
}

// ================================================
// PERMISSION TYPES
// ================================================

export interface MessagingPermissions {
  readonly canMessage: boolean
  readonly canMessagePostPurchase: boolean
  readonly canMessageCreator: boolean
  readonly canMessageCommunity: boolean
  readonly isSociallyVerified: boolean
  readonly isCreatorVerified: boolean
  readonly hasPurchaseHistory: boolean
  readonly withinRateLimit: boolean
  readonly maxMessageLength: number
  readonly rateLimitPerHour: number
}

export interface PermissionContext {
  readonly userAddress?: Address
  readonly creatorAddress?: Address
  readonly context?: 'post_purchase' | 'social_share' | 'general' | 'creator_reply'
  readonly contentId?: bigint | string
  readonly socialContext?: 'farcaster' | 'web' | 'miniapp'
}

// ================================================
// MESSAGE TYPES
// ================================================

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
export type MessageType = 'text' | 'image' | 'file' | 'video' | 'reply'

// Legacy MessageContent interface (for backward compatibility)
export interface LegacyMessageContent {
  readonly text: string
  readonly category: MessageCategory
  readonly context?: MessagingContext
  readonly metadata?: Record<string, string | number | boolean | null>
}

// New structured MessageContent with discriminated unions
export type MessageContent = 
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'attachment'; readonly attachment: AttachmentMessage }
  | { readonly type: 'mixed'; readonly text: string; readonly attachments: AttachmentMessage[] }

export interface Message {
  readonly id: string
  readonly content: string
  readonly sender: Address
  readonly timestamp: Date
  readonly status: MessageStatus
  readonly type: MessageType
  readonly category: MessageCategory
  readonly isOwn?: boolean
}

export interface MessagePreview {
  readonly id: string
  readonly content: MessageContent
  readonly sender: Address
  readonly timestamp: Date
  readonly isRead: boolean
  readonly category: MessageCategory
  readonly status: MessageStatus
  readonly attachments?: MessageAttachment[]
}

// ================================================
// CONVERSATION TYPES
// ================================================

export type ConversationContext = 'post_purchase' | 'social_share' | 'general' | 'creator_reply'
export type MessagingPermissionLevel = 'none' | 'limited' | 'full'

export interface Conversation {
  readonly id: string
  readonly participantAddress: Address
  readonly participantName?: string
  readonly lastMessage?: Message
  readonly lastMessageAt: Date
  readonly unreadCount: number
  readonly isOnline?: boolean
  readonly lastSeen?: Date
  readonly status: ConversationStatus
  readonly context?: MessagingContext
}

export interface ConversationPreview {
  readonly id: string
  readonly peerAddress: Address
  readonly lastMessage?: MessagePreview
  readonly unreadCount: number
  readonly status: ConversationStatus
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly context?: MessagingContext
}

export interface ConversationState {
  readonly conversation: Conversation | null
  readonly messages: MessagePreview[]
  readonly isLoading: boolean
  readonly error: Error | null
  readonly hasMore: boolean
}

// ================================================
// HOOK RESULT TYPES
// ================================================

export interface XMTPClientResult {
  readonly client: Client | null
  readonly isConnected: boolean
  readonly isConnecting: boolean
  readonly isInitializing: boolean
  readonly error: Error | null
  readonly connect: () => Promise<void>
  readonly disconnect: () => Promise<void>
}

export interface MessagingPermissionsResult {
  readonly isLoading: boolean
  readonly error: Error | null
  readonly canMessage: boolean
  readonly permissionLevel: MessagingPermissionLevel
  readonly reason?: string
  readonly restrictions?: string[]
  readonly checkPermissions: (creatorAddress: Address, context?: PermissionContext) => Promise<boolean>
  readonly getPermissionDetails: (creatorAddress: Address, context?: PermissionContext) => Promise<MessagingPermissions>
  readonly checkSocialVerification: (address: Address) => boolean
  readonly checkPurchaseHistory: (userAddress: Address, creatorAddress: Address, contentId?: string) => Promise<boolean>
  readonly checkCreatorVerification: (creatorAddress: Address) => Promise<boolean>
  readonly checkRateLimit: (userAddress: Address, creatorAddress: Address) => Promise<boolean>
}

export interface ConversationManagerResult {
  readonly conversations: ConversationPreview[]
  readonly isLoading: boolean
  readonly error: MessagingError | null
  readonly sendMessage: (recipientAddress: Address, content: MessageContent) => Promise<void>
  readonly getOrCreateConversation: (peerAddress: Address, context?: MessagingContext) => Promise<XMTPConversation>
  readonly getXMTPConversation: (topic: string) => XMTPConversation | null
  readonly archiveConversation: (topic: string) => Promise<void>
  readonly unarchiveConversation: (topic: string) => Promise<void>
  readonly getArchivedConversations: () => ConversationPreview[]
  readonly loadConversations: () => Promise<void>
  readonly trackMessagingEvent: (eventType: string, data: Record<string, any>) => void
}

// ================================================
// ERROR TYPES
// ================================================

export interface MessagingErrorContext {
  readonly originalError?: Error | MessagingError
  readonly address?: Address | string
  readonly env?: string
  readonly peerAddress?: Address
  readonly recipientAddress?: Address
  readonly content?: MessageContent
  readonly context?: PermissionContext
  readonly permissions?: MessagingPermissions
}

export class MessagingError extends Error {
  constructor(
    message: string,
    public readonly code: MessagingErrorCode,
    public readonly context?: MessagingErrorContext
  ) {
    super(message)
    this.name = 'MessagingError'
  }
}

export enum MessagingErrorCode {
  CLIENT_NOT_CONNECTED = 'CLIENT_NOT_CONNECTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  CONVERSATION_CREATE_FAILED = 'CONVERSATION_CREATE_FAILED',
  CONVERSATION_LOAD_FAILED = 'CONVERSATION_LOAD_FAILED',
  PERMISSION_CHECK_FAILED = 'PERMISSION_CHECK_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// ================================================
// PLATFORM DETECTION TYPES
// ================================================

export interface PlatformInfo {
  readonly isMiniApp: boolean
  readonly isMobile: boolean
  readonly isDesktop: boolean
}

export interface MessagingPlatformHook {
  readonly isMiniApp: boolean
  readonly isMobile: boolean
  readonly isDesktop: boolean
  readonly shouldUseDedicatedPage: boolean
  readonly recommendedUXPattern: 'side-panel' | 'dedicated-page'
}

// ================================================
// READ STATE TYPES
// ================================================

export interface ReadStateStorage {
  readonly lastMessagePageVisit: number
  readonly lastConversationVisits: Record<string, number>
}

export interface UnreadState {
  readonly hasUnreadMessages: boolean
  readonly unreadCount: number
  readonly unreadConversations: string[]
  readonly markAsRead: (conversationId?: string) => void
  readonly markMessagesPageVisited: () => void
}

// ================================================
// COMPONENT PROP TYPES
// ================================================

export interface MessagingInterfaceProps {
  readonly userAddress: Address
  readonly creatorAddress?: Address
  readonly contentId?: string
  readonly context?: ConversationContext
  readonly className?: string
}

export interface ConversationListProps {
  readonly userAddress: Address
  readonly onConversationSelect?: (conversation: ConversationPreview) => void
  readonly className?: string
}

export interface MessageComposerProps {
  readonly onSendMessage: (content: string) => Promise<void>
  readonly isSending: boolean
  readonly disabled?: boolean
  readonly placeholder?: string
  readonly className?: string
}

export interface MessageBubbleProps {
  readonly message: MessagePreview
  readonly isOwn: boolean
  readonly showAvatar?: boolean
  readonly showTimestamp?: boolean
  readonly isFirstInGroup?: boolean
  readonly isLastInGroup?: boolean
  readonly previousMessage?: MessagePreview
  readonly nextMessage?: MessagePreview
  readonly className?: string
}

export interface SmartMessagingButtonProps {
  readonly userAddress: Address
  readonly creatorAddress?: Address
  readonly contentId?: string
  readonly context?: ConversationContext
  readonly variant?: 'default' | 'secondary' | 'outline' | 'ghost'
  readonly size?: 'default' | 'sm' | 'lg'
  readonly className?: string
  readonly children?: React.ReactNode
}

// ================================================
// EXPORTS
// ================================================

export type {
  Address,
  Client,
  XMTPConversation
}

// ================================================
// UNIFIED TYPE DEFINITIONS (No Conflicts)
// ================================================

// ================================================
// ENHANCED ATTACHMENT TYPES
// ================================================

export interface AttachmentEncryption {
  readonly algorithm: 'AES-256-GCM'
  readonly key: string // Base64 encoded encryption key
  readonly nonce: string // Base64 encoded nonce/IV
  readonly tag: string // Base64 encoded authentication tag
}

export interface AttachmentPreview {
  readonly url?: string // Thumbnail/preview URL
  readonly data?: string // Base64 encoded preview data
  readonly width?: number
  readonly height?: number
  readonly duration?: number // For videos/audio
  readonly mimeType: string
  readonly size: number
}

export interface StructuredAttachment {
  readonly url: string // Encrypted blob location
  readonly name: string
  readonly mimeType: string
  readonly size: number
  readonly digest: string // SHA-256 hash for integrity
  readonly preview?: AttachmentPreview
  readonly encryption: AttachmentEncryption
  readonly createdAt: Date
}

// Alias for compatibility
export type AttachmentMessage = StructuredAttachment

export interface AttachmentUploadProgress {
  readonly id: string
  readonly name: string
  readonly mimeType: string
  readonly size: number
  readonly status: 'uploading' | 'encrypting' | 'uploading' | 'sent' | 'failed'
  readonly progress: number // 0-100
  readonly error?: string
}

// Legacy MessageAttachment interface (for backward compatibility)
export interface MessageAttachment {
  readonly id: string
  readonly type: 'image' | 'file' | 'video'
  readonly url: string
  readonly name: string
  readonly size: number
  readonly mimeType: string
  readonly thumbnail?: string
}

export default {
  MessageCategory,
  ConversationStatus,
  MessagingErrorCode,
  MessagingError
}

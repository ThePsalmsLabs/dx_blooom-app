/**
 * XMTP Messaging Types
 * 
 * Type definitions for XMTP messaging integration with the onchain content platform.
 * These types ensure type safety across all messaging components and hooks.
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
  SYSTEM_MSG = 'system_msg'
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
  readonly canCreateGroup: boolean
  readonly canReply: boolean
  readonly reason?: string
}

export interface PermissionContext {
  readonly fromAddress: Address
  readonly toAddress: Address
  readonly context: 'post_purchase' | 'community' | 'creator_reply' | 'general'
  readonly contentId?: bigint
}

// ================================================
// MESSAGE TYPES
// ================================================

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
export type MessageType = 'text' | 'image' | 'file' | 'system'

export interface MessageContent {
  readonly text: string
  readonly category: MessageCategory
  readonly context?: MessagingContext
  readonly metadata?: Record<string, string | number | boolean | null>
}

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
  readonly content: string
  readonly sender: Address
  readonly timestamp: Date
  readonly isRead: boolean
  readonly category: MessageCategory
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
  readonly permissions: MessagingPermissions
  readonly canMessage: boolean
  readonly canReceiveMessages: boolean
  readonly permissionLevel: MessagingPermissionLevel
  readonly isLoading: boolean
  readonly error: Error | null
  readonly checkPermissions: (context: PermissionContext) => Promise<MessagingPermissions>
}

export interface ConversationManagerResult {
  readonly conversations: ConversationPreview[]
  readonly isLoading: boolean
  readonly error: Error | null
  readonly sendMessage: (recipientAddress: Address, content: MessageContent) => Promise<void>
  readonly getOrCreateConversation: (peerAddress: Address, context?: MessagingContext) => Promise<XMTPConversation>
  readonly createConversation: (peerAddress: Address, context?: MessagingContext) => Promise<ConversationPreview>
  readonly markAsRead: (conversationId: string) => Promise<void>
  readonly refreshConversations: () => Promise<void>
  readonly loadConversations: () => Promise<void>
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
    public readonly code: string,
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
  NETWORK_ERROR = 'NETWORK_ERROR'
}
/**
 * Unified XMTP Types - Cross-Platform Message Types
 * File: /src/shared/xmtp/types.ts
 *
 * Shared TypeScript interfaces and types for XMTP messaging
 * across web and mobile platforms. Ensures type safety and
 * consistency throughout the application.
 */

import type { Client, Conversation, Message } from '@xmtp/xmtp-js'
import type { Address } from 'viem'

// ================================================
// CORE XMTP TYPES
// ================================================

export type XMTPClient = Client
export type XMTPConversation = Conversation
export type XMTPMessage = Message

// ================================================
// CONVERSATION TYPES
// ================================================

export interface ConversationPreview {
  id: string
  topic: string
  peerAddress: Address
  lastMessage?: MessagePreview
  unreadCount: number
  lastMessageTime?: Date
  context?: MessagingContext
  metadata?: ConversationMetadata
}

export interface ConversationMetadata {
  title?: string
  description?: string
  imageUrl?: string
  tags?: string[]
  isGroup?: boolean
  participantCount?: number
  createdAt?: Date
  updatedAt?: Date
}

// ================================================
// MESSAGE TYPES
// ================================================

export interface MessagePreview {
  id: string
  content: string
  senderAddress: Address
  timestamp: Date
  messageType: MessageType
  status: MessageStatus
  replyTo?: string
  reactions?: MessageReaction[]
}

export interface ExtendedMessage extends MessagePreview {
  conversationTopic: string
  metadata?: MessageMetadata
  attachments?: MessageAttachment[]
}

export type MessageType = 
  | 'text' 
  | 'image' 
  | 'file' 
  | 'audio' 
  | 'video' 
  | 'system' 
  | 'reaction'
  | 'reply'

export type MessageStatus = 
  | 'sending' 
  | 'sent' 
  | 'delivered' 
  | 'read' 
  | 'failed'
  | 'deleted'

export interface MessageReaction {
  emoji: string
  senderAddress: Address
  timestamp: Date
}

export interface MessageMetadata {
  edited?: boolean
  editedAt?: Date
  forwarded?: boolean
  forwardedFrom?: Address
  priority?: 'low' | 'normal' | 'high'
  expiresAt?: Date
}

export interface MessageAttachment {
  id: string
  type: 'image' | 'file' | 'audio' | 'video'
  url: string
  name: string
  size: number
  mimeType: string
  thumbnail?: string
}

// ================================================
// MESSAGING CONTEXT TYPES
// ================================================

export interface MessagingContext {
  type: MessagingContextType
  contentId?: bigint
  creatorAddress?: Address
  socialContext?: SocialContext
  metadata?: ContextMetadata
}

export type MessagingContextType = 
  | 'general'
  | 'content' 
  | 'creator' 
  | 'purchase'
  | 'support'
  | 'group'

export type SocialContext = 
  | 'miniapp'
  | 'web'
  | 'farcaster'
  | 'lens'
  | 'direct'

export interface ContextMetadata {
  referralSource?: string
  campaignId?: string
  deepLink?: string
  customData?: Record<string, string | number | boolean>
}

// ================================================
// PERMISSION & CONSENT TYPES
// ================================================

export interface MessagingPermissions {
  canMessage: boolean
  canReceiveMessages: boolean
  requiresConsent: boolean
  isBlocked: boolean
  reason?: string
}

export interface ConsentState {
  address: Address
  state: 'allowed' | 'denied' | 'unknown'
  timestamp: Date
  context?: MessagingContext
}

// ================================================
// QUERY & MUTATION TYPES
// ================================================

export interface ConversationQuery {
  limit?: number
  offset?: number
  since?: Date
  includeMetadata?: boolean
  contextFilter?: MessagingContextType[]
}

export interface MessageQuery {
  conversationTopic: string
  limit?: number
  offset?: number
  since?: Date
  before?: Date
  includeReactions?: boolean
  includeAttachments?: boolean
}

export interface SendMessageRequest {
  conversationTopic?: string
  peerAddress?: Address
  content: string
  messageType?: MessageType
  replyTo?: string
  attachments?: MessageAttachment[]
  context?: MessagingContext
  metadata?: MessageMetadata
}

export interface CreateConversationRequest {
  peerAddress: Address
  initialMessage?: string
  context?: MessagingContext
  metadata?: ConversationMetadata
}

// ================================================
// STREAMING & REAL-TIME TYPES
// ================================================

export interface MessageStreamEvent {
  type: 'message' | 'conversation' | 'consent' | 'status'
  data: ExtendedMessage | ConversationPreview | ConsentState | MessageStatus
  timestamp: Date
}

export interface StreamingOptions {
  includeIncoming?: boolean
  includeOutgoing?: boolean
  includeReactions?: boolean
  contextFilter?: MessagingContextType[]
}

// ================================================
// ERROR & STATUS TYPES
// ================================================

export interface XMTPError {
  code: XMTPErrorCode
  message: string
  details?: Record<string, string | number | boolean>
  timestamp: Date
}

export type XMTPErrorCode = 
  | 'CLIENT_NOT_INITIALIZED'
  | 'CONNECTION_FAILED'
  | 'PERMISSION_DENIED'
  | 'MESSAGE_SEND_FAILED'
  | 'CONVERSATION_NOT_FOUND'
  | 'INVALID_ADDRESS'
  | 'NETWORK_ERROR'
  | 'ENCRYPTION_ERROR'
  | 'UNKNOWN_ERROR'
  | 'INVALID_REQUEST'

// ================================================
// HOOK RESULT TYPES
// ================================================

export interface ConversationManagerResult {
  conversations: ConversationPreview[]
  isLoading: boolean
  error: XMTPError | null
  
  // Actions
  createConversation: (request: CreateConversationRequest) => Promise<ConversationPreview>
  getConversation: (topic: string) => ConversationPreview | undefined
  markAsRead: (topic: string) => void
  deleteConversation: (topic: string) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export interface MessageManagerResult {
  messages: ExtendedMessage[]
  isLoading: boolean
  error: XMTPError | null
  hasMore: boolean
  
  // Actions
  sendMessage: (request: SendMessageRequest) => Promise<ExtendedMessage>
  editMessage: (messageId: string, content: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  addReaction: (messageId: string, emoji: string) => Promise<void>
  removeReaction: (messageId: string, emoji: string) => Promise<void>
  loadMore: () => Promise<void>
  markAsRead: () => void
}

export interface StreamingResult {
  isStreaming: boolean
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  lastUpdate?: Date
  
  // Controls
  startStreaming: (options?: StreamingOptions) => void
  stopStreaming: () => void
  reconnect: () => void
}

// ================================================
// UI COMPONENT TYPES
// ================================================

export interface MessagingUIProps {
  className?: string
  variant?: 'web' | 'mobile'
  theme?: 'light' | 'dark'
  onMessageSent?: (message: ExtendedMessage) => void
  onConversationSelected?: (conversation: ConversationPreview) => void
  onError?: (error: XMTPError) => void
}

export interface ConversationListProps extends MessagingUIProps {
  conversations: ConversationPreview[]
  selectedConversation?: string
  showUnreadBadges?: boolean
  enableSearch?: boolean
  onSelect?: (conversation: ConversationPreview) => void
}

export interface MessageListProps extends MessagingUIProps {
  messages: ExtendedMessage[]
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onMessageAction?: (action: string, message: ExtendedMessage) => void
}

export interface MessageComposerProps extends MessagingUIProps {
  onSend: (request: SendMessageRequest) => Promise<void>
  placeholder?: string
  disabled?: boolean
  enableAttachments?: boolean
  enableVoice?: boolean
  maxLength?: number
}

// ================================================
// PLATFORM-SPECIFIC TYPES
// ================================================

export interface WebMessagingConfig {
  enableDesktopNotifications: boolean
  enableKeyboardShortcuts: boolean
  showOnlineStatus: boolean
  enableMessagePreview: boolean
}

export interface MobileMessagingConfig {
  enablePushNotifications: boolean
  enableHapticFeedback: boolean
  enableVoiceMessages: boolean
  enableSwipeGestures: boolean
}


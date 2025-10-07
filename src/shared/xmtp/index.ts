/**
 * Unified XMTP Module - Cross-Platform Messaging Exports
 * File: /src/shared/xmtp/index.ts
 *
 * Main export file for the unified XMTP messaging system.
 * Provides a clean API for importing messaging functionality
 * across web and mobile platforms.
 */

import { MessagingContextType } from './types'

// ================================================
// CLIENT & STORE EXPORTS
// ================================================

export {
  useXMTPClientStore,
  useXMTPConnectionStatus,
  useIsXMTPConnected,
  useXMTPClient,
  useXMTPUserAddress,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY_MS,
  DEFAULT_CONFIG
} from './client'

export type {
  XMTPEnvironment,
  XMTPConnectionStatus,
  XMTPClientConfig,
  XMTPClientStore
} from './client'

// ================================================
// QUERY & MUTATION EXPORTS
// ================================================

export {
  xmtpQueryKeys,
  useConversationsQuery,
  useConversationQuery,
  useMessagesQuery,
  useCreateConversationMutation,
  useSendMessageMutation,
  useConversationManager,
  useMessageManager,
  conversationToPreview,
  messageToExtended,
  createXMTPError
} from './queries'

// ================================================
// UNIFIED HOOKS EXPORTS
// ================================================

export {
  useConversationManager as useUnifiedConversationManager,
  useMessageManager as useUnifiedMessageManager,
  useXMTPStatus,
  useConversations,
  useConversation,
  useConversationWithPeer,
  useCreateConversation,
  useMessages,
  useSendMessage,
  useMessageStream,
  useConversationStream,
  useUnreadCounts,
  useMarkAsRead,
  useQuickMessage
} from './hooks'

// ================================================
// TYPE EXPORTS
// ================================================

export type {
  // Core XMTP types
  XMTPClient,
  XMTPConversation,
  XMTPMessage,
  
  // Conversation types
  ConversationPreview,
  ConversationMetadata,
  
  // Message types
  MessagePreview,
  ExtendedMessage,
  MessageType,
  MessageStatus,
  MessageReaction,
  MessageMetadata,
  MessageAttachment,
  
  // Context types
  MessagingContext,
  MessagingContextType,
  SocialContext,
  ContextMetadata,
  
  // Permission types
  MessagingPermissions,
  ConsentState,
  
  // Query types
  ConversationQuery,
  MessageQuery,
  SendMessageRequest,
  CreateConversationRequest,
  
  // Streaming types
  MessageStreamEvent,
  StreamingOptions,
  
  // Error types
  XMTPError,
  XMTPErrorCode,
  
  // Hook result types
  ConversationManagerResult,
  MessageManagerResult,
  StreamingResult,
  
  // UI types
  MessagingUIProps,
  ConversationListProps,
  MessageListProps,
  MessageComposerProps,
  
  // Platform config types
  WebMessagingConfig,
  MobileMessagingConfig
} from './types'

// ================================================
// CONSTANTS
// ================================================

export const XMTP_ENVIRONMENTS = ['dev', 'production', 'local'] as const
export const MESSAGE_TYPES = ['text', 'image', 'file', 'audio', 'video', 'system', 'reaction', 'reply'] as const
export const MESSAGE_STATUSES = ['sending', 'sent', 'delivered', 'read', 'failed', 'deleted'] as const
export const MESSAGING_CONTEXTS = ['general', 'content', 'creator', 'purchase', 'support', 'group'] as const
export const SOCIAL_CONTEXTS = ['miniapp', 'web', 'farcaster', 'lens', 'direct'] as const

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Check if an address is a valid Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Format address for display
 */
export const formatAddressForDisplay = (address: string, length = 6): string => {
  if (!isValidAddress(address)) return address
  return `${address.slice(0, length)}...${address.slice(-4)}`
}

/**
 * Get messaging context from URL or route
 */
export const getMessagingContextFromRoute = (pathname: string): MessagingContextType => {
  if (pathname.includes('/content/')) return 'content'
  if (pathname.includes('/creator/')) return 'creator'
  if (pathname.includes('/purchase/')) return 'purchase'
  if (pathname.includes('/support/')) return 'support'
  return 'general'
}

/**
 * Check if message content is valid
 */
export const isValidMessageContent = (content: string, maxLength = 1000): boolean => {
  return content.trim().length > 0 && content.length <= maxLength
}

/**
 * Generate conversation ID from addresses
 */
export const generateConversationId = (address1: string, address2: string): string => {
  const sorted = [address1.toLowerCase(), address2.toLowerCase()].sort()
  return `conv_${sorted[0]}_${sorted[1]}`
}

/**
 * Parse XMTP error for user-friendly display
 */
export const parseXMTPError = (error: Error | string | { message: string; code?: string }): { message: string; code: string } => {
  if (typeof error === 'string') {
    return { message: error, code: 'UNKNOWN_ERROR' }
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'code' in error ? String(error.code) : 'UNKNOWN_ERROR'
    }
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    }
  }
  
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  }
}
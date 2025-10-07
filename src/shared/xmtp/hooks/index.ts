/**
 * Unified XMTP Hooks Index
 * File: /src/shared/xmtp/hooks/index.ts
 *
 * Centralized exports for all unified XMTP hooks.
 * Provides clean imports for components and other modules.
 */

// ================================================
// CORE HOOKS
// ================================================

export { useConversationManager } from './useConversationManager'
export { useRealtimeMessages } from './useRealtimeMessages'
export { useMessagingPermissions } from './useMessagingPermissions'
export { useMessageReadState, useConversationReadState } from './useMessageReadState'

// ================================================
// DEFAULT EXPORTS
// ================================================

export { default as useConversationManagerDefault } from './useConversationManager'
export { default as useRealtimeMessagesDefault } from './useRealtimeMessages'
export { default as useMessagingPermissionsDefault } from './useMessagingPermissions'
export { default as useMessageReadStateDefault } from './useMessageReadState'

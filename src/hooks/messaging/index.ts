/**
 * Messaging Hooks - Export Barrel
 * 
 * Centralized exports for all messaging-related hooks.
 */

export { useXMTPClient } from './useXMTPClient'
export { useMessagingPermissions } from './useMessagingPermissions'
export { useConversationManager } from './useConversationManager'
export { useMessageReadState, useConversationReadState, useClearReadState } from './useMessageReadState'

export type {
  XMTPClientResult,
  MessagingPermissionsResult,
  ConversationManagerResult,
} from '@/types/messaging'
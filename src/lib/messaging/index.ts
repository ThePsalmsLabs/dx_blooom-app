/**
 * Messaging Library - Export Barrel
 * 
 * Centralized exports for messaging configuration and utilities.
 */

export {
  XMTP_CONFIG,
  MESSAGING_FEATURES,
  PERMISSION_RULES,
  MESSAGING_ANALYTICS,
  MESSAGING_UI,
  INTEGRATION_CONFIG,
} from './xmtp-config'

export {
  validateMessageContent,
  formatMessageForDisplay,
  formatAddressForMessaging,
  isValidAddress,
  generateConversationId,
  extractParticipants,
  messagingRateLimiter,
  filterMessageContent,
} from './message-utils'
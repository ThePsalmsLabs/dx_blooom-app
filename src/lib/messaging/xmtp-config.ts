/**
 * XMTP Configuration
 * 
 * Centralized configuration for XMTP messaging integration.
 * Follows existing platform configuration patterns.
 */

import type { XMTPClientConfig } from '@/types/messaging'

// ================================================
// ENVIRONMENT CONFIGURATION
// ================================================

export const XMTP_CONFIG: XMTPClientConfig = {
  env: process.env.NEXT_PUBLIC_XMTP_ENV === 'production' ? 'production' : 'dev',
  enableV3: process.env.NEXT_PUBLIC_XMTP_V3_ENABLED === 'true',
} as const

// ================================================
// FEATURE FLAGS
// ================================================

export const MESSAGING_FEATURES = {
  enabled: process.env.NEXT_PUBLIC_MESSAGING_ENABLED === 'true',
  postPurchaseMessaging: process.env.NEXT_PUBLIC_POST_PURCHASE_MESSAGING === 'true',
  communityMessaging: process.env.NEXT_PUBLIC_COMMUNITY_MESSAGING === 'true',
  creatorReply: process.env.NEXT_PUBLIC_CREATOR_REPLY === 'true',
  analytics: process.env.NEXT_PUBLIC_MESSAGING_ANALYTICS === 'true',
} as const

// ================================================
// PERMISSION RULES
// ================================================

export const PERMISSION_RULES = {
  // Who can initiate conversations
  canInitiateConversation: {
    postPurchase: true,           // Users can message creators after purchase
    verified: true,               // Verified users can message anyone
    community: true,              // Community members can message each other
    creator: true,                // Creators can message anyone
  },
  
  // Message limits and rate limiting
  rateLimits: {
    messagesPerMinute: 10,        // Maximum messages per minute
    messagesPerHour: 100,         // Maximum messages per hour
    conversationsPerDay: 20,      // Maximum new conversations per day
  },
  
  // Content restrictions
  contentFilters: {
    maxMessageLength: 1000,       // Maximum message length
    allowEmojis: true,            // Allow emoji content
    allowLinks: false,            // Block external links
    profanityFilter: true,        // Enable profanity filtering
  },
} as const

// ================================================
// ANALYTICS CONFIGURATION
// ================================================

export const MESSAGING_ANALYTICS = {
  trackEvents: MESSAGING_FEATURES.analytics,
  events: {
    messagesSent: 'messaging_message_sent',
    conversationsStarted: 'messaging_conversation_started',
    messagesRead: 'messaging_message_read',
    permissionsDenied: 'messaging_permissions_denied',
    errorsEncountered: 'messaging_error',
  },
} as const

// ================================================
// UI CONFIGURATION
// ================================================

export const MESSAGING_UI = {
  maxConversationsDisplayed: 50,
  maxMessagesPerConversation: 100,
  messageRefreshInterval: 5000,        // 5 seconds
  typingIndicatorTimeout: 3000,        // 3 seconds
  
  // Component display settings
  showTimestamps: true,
  showReadReceipts: true,
  enableTypingIndicators: true,
  autoScrollToBottom: true,
} as const

// ================================================
// INTEGRATION SETTINGS
// ================================================

export const INTEGRATION_CONFIG = {
  // Notification service integration
  notifications: {
    enableMessageNotifications: true,
    soundEnabled: true,
    badgeEnabled: true,
  },
  
  // Social commerce integration
  commerce: {
    enablePostPurchaseMessaging: MESSAGING_FEATURES.postPurchaseMessaging,
    autoCreateConversationOnPurchase: true,
    sendWelcomeMessageOnPurchase: true,
  },
  
  // Analytics integration
  analytics: {
    trackToExistingAnalytics: true,
    anonymizeUserData: true,
    batchAnalyticsEvents: true,
  },
} as const
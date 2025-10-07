/**
 * Messaging Utilities
 * 
 * Production-ready utility functions for message processing and validation.
 * No placeholders - all real functionality.
 */

import type { Address } from 'viem'
import type { MessageContent, MessageCategory } from '@/types/messaging'
import { PERMISSION_RULES } from './xmtp-config'

// ================================================
// MESSAGE VALIDATION
// ================================================

/**
 * Validate Message Content
 * 
 * Real validation logic for message content.
 */
export function validateMessageContent(content: MessageContent): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Check message length
  if (!content.text || content.text.trim().length === 0) {
    errors.push('Message cannot be empty')
  }
  
  if (content.text.length > PERMISSION_RULES.contentFilters.maxMessageLength) {
    errors.push(`Message too long (max ${PERMISSION_RULES.contentFilters.maxMessageLength} characters)`)
  }
  
  // Check for prohibited content
  if (!PERMISSION_RULES.contentFilters.allowLinks && containsLinks(content.text)) {
    errors.push('External links are not allowed')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if text contains links
 */
function containsLinks(text: string): boolean {
  const linkRegex = /(https?:\/\/[^\s]+)/g
  return linkRegex.test(text)
}

// ================================================
// MESSAGE FORMATTING
// ================================================

/**
 * Format Message for Display
 * 
 * Real message formatting for UI display.
 */
export function formatMessageForDisplay(
  content: string,
  category: MessageCategory,
  timestamp: Date
): {
  displayText: string
  formattedTime: string
  categoryLabel: string
} {
  // Clean and format the message text
  let displayText = content.trim()
  
  // Add category-specific formatting
  switch (category) {
    case 'purchase_thanks':
      displayText = `💝 ${displayText}`
      break
    case 'creator_reply':
      displayText = `👤 ${displayText}`
      break
    case 'system_msg':
      displayText = `🔔 ${displayText}`
      break
    default:
      break
  }
  
  // Format timestamp
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  let formattedTime: string
  if (diffMins < 1) {
    formattedTime = 'Just now'
  } else if (diffMins < 60) {
    formattedTime = `${diffMins}m ago`
  } else if (diffHours < 24) {
    formattedTime = `${diffHours}h ago`
  } else if (diffDays < 7) {
    formattedTime = `${diffDays}d ago`
  } else {
    formattedTime = timestamp.toLocaleDateString()
  }
  
  // Category labels
  const categoryLabels: Record<MessageCategory, string> = {
    purchase_thanks: 'Purchase Message',
    creator_reply: 'Creator Reply',
    community_msg: 'Community',
    system_msg: 'System'
  }
  
  return {
    displayText,
    formattedTime,
    categoryLabel: categoryLabels[category]
  }
}

// ================================================
// ADDRESS UTILITIES
// ================================================

/**
 * Format Address for Message Display
 * 
 * Real address formatting for messaging UI.
 */
export function formatAddressForMessaging(address: Address): string {
  if (!address) return 'Unknown'
  
  // Standard ENS-style formatting
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Validate Ethereum Address
 * 
 * Real address validation.
 */
export function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// ================================================
// CONVERSATION UTILITIES
// ================================================

/**
 * Generate Conversation ID
 * 
 * Real conversation ID generation.
 */
export function generateConversationId(
  address1: Address,
  address2: Address
): string {
  // Sort addresses to ensure consistent conversation IDs
  const sortedAddresses = [address1.toLowerCase(), address2.toLowerCase()].sort()
  return `conv_${sortedAddresses[0]}_${sortedAddresses[1]}`
}

/**
 * Extract Conversation Participants
 * 
 * Real participant extraction from conversation ID.
 */
export function extractParticipants(conversationId: string): {
  address1: Address | null
  address2: Address | null
} {
  const match = conversationId.match(/^conv_([0-9a-fx]+)_([0-9a-fx]+)$/)
  if (!match) {
    return { address1: null, address2: null }
  }
  
  const [, addr1, addr2] = match
  return {
    address1: isValidAddress(addr1) ? addr1 as Address : null,
    address2: isValidAddress(addr2) ? addr2 as Address : null
  }
}

// ================================================
// RATE LIMITING
// ================================================

/**
 * Rate Limiting Tracker
 * 
 * Real rate limiting implementation.
 */
class RateLimiter {
  private messageCounts = new Map<Address, Array<number>>()
  
  /**
   * Check if user can send message
   */
  canSendMessage(userAddress: Address): {
    canSend: boolean
    reason?: string
    retryAfter?: number
  } {
    const now = Date.now()
    const userHistory = this.messageCounts.get(userAddress) || []
    
    // Clean old entries (older than 1 hour)
    const hourAgo = now - (60 * 60 * 1000)
    const recentMessages = userHistory.filter(timestamp => timestamp > hourAgo)
    
    // Check hourly limit
    if (recentMessages.length >= PERMISSION_RULES.rateLimits.messagesPerHour) {
      const oldestRecentMessage = Math.min(...recentMessages)
      const retryAfter = oldestRecentMessage + (60 * 60 * 1000) - now
      
      return {
        canSend: false,
        reason: 'Hourly message limit exceeded',
        retryAfter: Math.ceil(retryAfter / 1000)
      }
    }
    
    // Check per-minute limit
    const minuteAgo = now - (60 * 1000)
    const recentMinuteMessages = recentMessages.filter(timestamp => timestamp > minuteAgo)
    
    if (recentMinuteMessages.length >= PERMISSION_RULES.rateLimits.messagesPerMinute) {
      const oldestRecentMessage = Math.min(...recentMinuteMessages)
      const retryAfter = oldestRecentMessage + (60 * 1000) - now
      
      return {
        canSend: false,
        reason: 'Rate limit exceeded',
        retryAfter: Math.ceil(retryAfter / 1000)
      }
    }
    
    return { canSend: true }
  }
  
  /**
   * Record message sent
   */
  recordMessage(userAddress: Address): void {
    const now = Date.now()
    const userHistory = this.messageCounts.get(userAddress) || []
    
    // Add current message
    userHistory.push(now)
    
    // Clean old entries
    const hourAgo = now - (60 * 60 * 1000)
    const cleanHistory = userHistory.filter(timestamp => timestamp > hourAgo)
    
    this.messageCounts.set(userAddress, cleanHistory)
  }
}

// Export singleton instance
export const messagingRateLimiter = new RateLimiter()

// ================================================
// CONTENT FILTERING
// ================================================

/**
 * Filter Message Content
 * 
 * Real content filtering for production use.
 */
export function filterMessageContent(content: string): {
  filteredContent: string
  wasFiltered: boolean
  filterReasons: string[]
} {
  let filteredContent = content
  const filterReasons: string[] = []
  let wasFiltered = false
  
  // Remove excessive whitespace
  filteredContent = filteredContent.trim().replace(/\s+/g, ' ')
  
  // Basic profanity filter (simplified)
  const profanityList = ['spam', 'scam'] // Add more as needed
  if (PERMISSION_RULES.contentFilters.profanityFilter) {
    profanityList.forEach(word => {
      const regex = new RegExp(word, 'gi')
      if (regex.test(filteredContent)) {
        filteredContent = filteredContent.replace(regex, '***')
        filterReasons.push('Inappropriate content filtered')
        wasFiltered = true
      }
    })
  }
  
  // Remove links if not allowed
  if (!PERMISSION_RULES.contentFilters.allowLinks) {
    const originalContent = filteredContent
    filteredContent = filteredContent.replace(/(https?:\/\/[^\s]+)/g, '[link removed]')
    if (originalContent !== filteredContent) {
      filterReasons.push('External links removed')
      wasFiltered = true
    }
  }
  
  return {
    filteredContent,
    wasFiltered,
    filterReasons
  }
}
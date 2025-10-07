/**
 * Unified Message Read State Hook
 * File: /src/shared/xmtp/hooks/useMessageReadState.ts
 *
 * Production-ready message read state tracking with timestamp-based unread detection.
 * Migrated from legacy system with enhanced unified functionality.
 *
 * Features:
 * - Timestamp-based unread tracking
 * - Conversation-specific read states
 * - Persistent storage
 * - Unread count badges
 * - Cross-platform compatibility
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ConversationPreview } from '../types/index'

// ================================================
// TYPES & INTERFACES
// ================================================

interface ReadStateStorage {
  readonly lastMessagePageVisit: number // timestamp
  readonly lastConversationVisits: Record<string, number> // conversationId -> timestamp
}

interface UnreadState {
  readonly hasUnreadMessages: boolean
  readonly unreadCount: number
  readonly unreadConversations: string[]
  readonly markAsRead: (conversationId?: string) => void
  readonly markMessagesPageVisited: () => void
}

// ================================================
// STORAGE UTILITIES
// ================================================

const STORAGE_KEY = 'xmtp-read-state'

function getStoredReadState(): ReadStateStorage {
  if (typeof window === 'undefined') {
    return { lastMessagePageVisit: 0, lastConversationVisits: {} }
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to parse stored read state:', error)
  }
  
  return { lastMessagePageVisit: 0, lastConversationVisits: {} }
}

function setStoredReadState(state: ReadStateStorage): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to store read state:', error)
  }
}

// ================================================
// MAIN MESSAGE READ STATE HOOK
// ================================================

/**
 * Message Read State Hook - Timestamp-Based Unread Tracking
 * 
 * Implements timestamp-based unread tracking.
 * Tracks when user last visited messages and shows badges for newer conversations.
 */
export function useMessageReadState(
  conversations: ConversationPreview[] = []
): UnreadState {
  // ===== STATE MANAGEMENT =====
  
  const [readState, setReadState] = useState<ReadStateStorage>(() => getStoredReadState())
  
  // ===== UNREAD CALCULATION =====
  
  const unreadState = useMemo(() => {
    const now = Date.now()
    const unreadConversations: string[] = []
    let unreadCount = 0
    
    conversations.forEach(conversation => {
      const lastVisit = readState.lastConversationVisits[conversation.id] || readState.lastMessagePageVisit
      const lastMessageTime = conversation.updatedAt.getTime()
      
      // Consider conversation unread if it has messages newer than last visit
      if (lastMessageTime > lastVisit) {
        unreadConversations.push(conversation.id)
        
        // Add unread count from conversation
        if (conversation.unreadCount > 0) {
          unreadCount += conversation.unreadCount
        } else {
          // If no specific unread count, assume 1 for unread conversations
          unreadCount += 1
        }
      }
    })
    
    return {
      hasUnreadMessages: unreadCount > 0,
      unreadCount,
      unreadConversations
    }
  }, [conversations, readState])
  
  // ===== ACTIONS =====
  
  /**
   * Mark conversation as read
   */
  const markAsRead = useCallback((conversationId?: string) => {
    const now = Date.now()
    
    setReadState(prevState => {
      const newState = { ...prevState }
      
      if (conversationId) {
        // Mark specific conversation as read
        newState.lastConversationVisits = {
          ...prevState.lastConversationVisits,
          [conversationId]: now
        }
      } else {
        // Mark all conversations as read
        newState.lastMessagePageVisit = now
        newState.lastConversationVisits = {}
      }
      
      setStoredReadState(newState)
      return newState
    })
  }, [])
  
  /**
   * Mark messages page as visited
   */
  const markMessagesPageVisited = useCallback(() => {
    const now = Date.now()
    
    setReadState(prevState => {
      const newState = {
        ...prevState,
        lastMessagePageVisit: now
      }
      
      setStoredReadState(newState)
      return newState
    })
  }, [])
  
  // ===== EFFECTS =====
  
  // Load read state from storage on mount
  useEffect(() => {
    const storedState = getStoredReadState()
    setReadState(storedState)
  }, [])
  
  // ===== RETURN INTERFACE =====
  
  return {
    ...unreadState,
    markAsRead,
    markMessagesPageVisited
  }
}

// ================================================
// CONVERSATION-SPECIFIC READ STATE HOOK
// ================================================

/**
 * Hook for tracking read state of a specific conversation
 */
export function useConversationReadState(conversationId: string) {
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null)
  
  const markMessageAsRead = useCallback((messageId: string) => {
    setLastReadMessageId(messageId)
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      try {
        const key = `xmtp-conversation-read-${conversationId}`
        localStorage.setItem(key, messageId)
      } catch (error) {
        console.warn('Failed to store conversation read state:', error)
      }
    }
  }, [conversationId])
  
  const isMessageRead = useCallback((messageId: string): boolean => {
    if (!lastReadMessageId) return false
    
    // Simple comparison - in a real implementation, you might want to
    // compare timestamps or use a more sophisticated system
    return messageId === lastReadMessageId
  }, [lastReadMessageId])
  
  // Load read state from storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = `xmtp-conversation-read-${conversationId}`
        const stored = localStorage.getItem(key)
        if (stored) {
          setLastReadMessageId(stored)
        }
      } catch (error) {
        console.warn('Failed to load conversation read state:', error)
      }
    }
  }, [conversationId])
  
  return {
    lastReadMessageId,
    markMessageAsRead,
    isMessageRead
  }
}

// ================================================
// EXPORTS
// ================================================

export default useMessageReadState

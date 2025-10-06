/**
 * Message Read State Hook - Timestamp-Based Unread Tracking
 * File: src/hooks/messaging/useMessageReadState.ts
 *
 * Implements Option 2: Timestamp-based unread tracking.
 * Tracks when user last visited messages and shows badges for newer conversations.
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { ConversationPreview } from '@/types/messaging'

// ================================================
// TYPES
// ================================================

interface ReadStateStorage {
  lastMessagePageVisit: number // timestamp
  lastConversationVisits: Record<string, number> // conversationId -> timestamp
}

interface UnreadState {
  hasUnreadMessages: boolean
  unreadCount: number
  unreadConversations: string[]
  markAsRead: (conversationId?: string) => void
  markMessagesPageVisited: () => void
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
// MAIN HOOK
// ================================================

/**
 * Hook for tracking message read state using timestamp-based approach
 * 
 * Logic:
 * 1. Track when user last visited messages page
 * 2. Track when user last visited specific conversations  
 * 3. Show unread badge for conversations with activity after last visit
 */
export function useMessageReadState(conversations: ConversationPreview[]): UnreadState {
  const [readState, setReadState] = useState<ReadStateStorage>(() => getStoredReadState())

  // Update localStorage when state changes
  useEffect(() => {
    setStoredReadState(readState)
  }, [readState])

  // Calculate unread conversations based on timestamps
  const unreadData = useMemo(() => {
    if (!conversations.length) {
      return {
        hasUnreadMessages: false,
        unreadCount: 0,
        unreadConversations: []
      }
    }

    const unreadConversations: string[] = []
    const { lastMessagePageVisit, lastConversationVisits } = readState
    
    conversations.forEach(conversation => {
      // Check if conversation has activity after last visit
      const lastConversationVisit = lastConversationVisits[conversation.id] || 0
      const checkTimestamp = Math.max(lastMessagePageVisit, lastConversationVisit)
      
      // Get the most recent message timestamp from the conversation
      const lastMessageTimestamp = conversation.lastMessage?.timestamp 
        ? new Date(conversation.lastMessage.timestamp).getTime()
        : new Date(conversation.createdAt).getTime()
      
      // If there's activity after last visit, mark as unread
      if (lastMessageTimestamp > checkTimestamp) {
        unreadConversations.push(conversation.id)
      }
    })

    return {
      hasUnreadMessages: unreadConversations.length > 0,
      unreadCount: unreadConversations.length,
      unreadConversations
    }
  }, [conversations, readState])

  // Mark messages page as visited (clears all unread badges)
  const markMessagesPageVisited = useCallback(() => {
    const now = Date.now()
    setReadState(prev => ({
      ...prev,
      lastMessagePageVisit: now
    }))
  }, [])

  // Mark specific conversation as read
  const markAsRead = useCallback((conversationId?: string) => {
    const now = Date.now()
    
    if (conversationId) {
      // Mark specific conversation as read
      setReadState(prev => ({
        ...prev,
        lastConversationVisits: {
          ...prev.lastConversationVisits,
          [conversationId]: now
        }
      }))
    } else {
      // Mark all conversations as read (messages page visited)
      markMessagesPageVisited()
    }
  }, [markMessagesPageVisited])

  return {
    ...unreadData,
    markAsRead,
    markMessagesPageVisited
  }
}

// ================================================
// UTILITY HOOKS
// ================================================

/**
 * Hook for individual conversation read state
 */
export function useConversationReadState(conversationId: string) {
  const [readState, setReadState] = useState(() => getStoredReadState())
  
  const markConversationAsRead = useCallback(() => {
    const now = Date.now()
    const newState = {
      ...readState,
      lastConversationVisits: {
        ...readState.lastConversationVisits,
        [conversationId]: now
      }
    }
    setReadState(newState)
    setStoredReadState(newState)
  }, [conversationId, readState])

  return { markConversationAsRead }
}

/**
 * Hook to clear all read state (for debugging/reset)
 */
export function useClearReadState() {
  const clearReadState = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  return { clearReadState }
}
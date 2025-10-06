/**
 * Real-time Message Streaming Hook
 * 
 * Provides live message updates using XMTP's streaming capabilities.
 * Handles message streams, typing indicators, and real-time conversation updates.
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Conversation as XMTPConversation, DecodedMessage } from '@xmtp/xmtp-js'
import type { Address } from 'viem'
import { useXMTPClient } from './useXMTPClient'
import { MESSAGING_UI } from '@/lib/messaging/xmtp-config'
import type { Message, MessageStatus } from '@/types/messaging'
import { MessageCategory } from '@/types/messaging'

interface RealtimeMessagesOptions {
  /** The conversation to stream messages for */
  conversation: XMTPConversation | null
  /** Whether to auto-scroll to new messages */
  autoScroll?: boolean
  /** Whether to play sound for new messages */
  enableSound?: boolean
  /** Custom message limit for initial load */
  messageLimit?: number
}

interface RealtimeMessagesResult {
  /** Array of messages in chronological order */
  messages: Message[]
  /** Whether messages are currently loading */
  isLoading: boolean
  /** Any error that occurred */
  error: Error | null
  /** Whether someone is typing */
  isTyping: boolean
  /** Send a typing indicator */
  sendTypingIndicator: () => void
  /** Mark messages as read */
  markAsRead: () => void
  /** Refresh messages manually */
  refreshMessages: () => Promise<void>
  /** Send a new message */
  sendMessage: (content: string) => Promise<void>
}

export function useRealtimeMessages({
  conversation,
  autoScroll = true,
  enableSound = false,
  messageLimit = MESSAGING_UI.maxMessagesPerConversation
}: RealtimeMessagesOptions): RealtimeMessagesResult {
  
  // ===== STATE MANAGEMENT =====
  
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  
  // ===== REFS FOR CLEANUP =====
  
  const streamRef = useRef<AsyncIterable<DecodedMessage> | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingClearTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageRef = useRef<string | null>(null)
  const typingUsersRef = useRef<Set<Address>>(new Set())
  
  // ===== XMTP CLIENT =====
  
  const { client } = useXMTPClient()
  
  // ===== MESSAGE CONVERSION UTILITIES =====
  
  /**
   * Check if message is a typing indicator
   */
  const isTypingIndicator = useCallback((xmtpMessage: DecodedMessage): boolean => {
    return xmtpMessage.content.startsWith('__TYPING_INDICATOR__:')
  }, [])
  
  /**
   * Handle typing indicator message
   */
  const handleTypingIndicator = useCallback((xmtpMessage: DecodedMessage) => {
    const senderAddress = xmtpMessage.senderAddress as Address
    
    // Don't show typing for our own messages
    if (client && senderAddress === client.address) return
    
    // Add user to typing set
    typingUsersRef.current.add(senderAddress)
    setIsTyping(typingUsersRef.current.size > 0)
    
    console.log(`✍️ ${senderAddress} is typing...`)
    
    // Clear typing indicator after timeout
    if (typingClearTimeoutRef.current) {
      clearTimeout(typingClearTimeoutRef.current)
    }
    
    typingClearTimeoutRef.current = setTimeout(() => {
      typingUsersRef.current.delete(senderAddress)
      setIsTyping(typingUsersRef.current.size > 0)
      console.log(`⏰ ${senderAddress} stopped typing`)
    }, MESSAGING_UI.typingIndicatorTimeout)
  }, [client])
  
  /**
   * Convert XMTP message to platform Message format
   */
  const convertXMTPMessage = useCallback((xmtpMessage: DecodedMessage): Message => {
    return {
      id: xmtpMessage.id,
      content: xmtpMessage.content,
      sender: xmtpMessage.senderAddress as Address,
      timestamp: xmtpMessage.sent,
      status: 'sent' as MessageStatus,
      type: 'text',
      category: MessageCategory.COMMUNITY_MSG,
      isOwn: client ? xmtpMessage.senderAddress === client.address : false
    }
  }, [client])
  
  // ===== MESSAGE LOADING =====
  
  /**
   * Load initial messages for the conversation
   */
  const loadMessages = useCallback(async () => {
    if (!conversation || !client) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('📥 Loading messages for conversation:', conversation.topic)
      
      // Get messages with limit
      const xmtpMessages = await conversation.messages({ limit: messageLimit })
      
      // Convert to platform format
      const convertedMessages = xmtpMessages.map(convertXMTPMessage)
      
      // Sort by timestamp (chronological order)
      convertedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      
      setMessages(convertedMessages)
      
      // Track last message for deduplication
      if (convertedMessages.length > 0) {
        lastMessageRef.current = convertedMessages[convertedMessages.length - 1].id
      }
      
      console.log(`✅ Loaded ${convertedMessages.length} messages`)
      
    } catch (loadError) {
      console.error('❌ Failed to load messages:', loadError)
      setError(loadError instanceof Error ? loadError : new Error('Failed to load messages'))
    } finally {
      setIsLoading(false)
    }
  }, [conversation, client, messageLimit, convertXMTPMessage])
  
  /**
   * Refresh messages manually
   */
  const refreshMessages = useCallback(async () => {
    await loadMessages()
  }, [loadMessages])
  
  // ===== REAL-TIME STREAMING =====
  
  /**
   * Set up real-time message streaming
   */
  useEffect(() => {
    if (!conversation || !client) return
    
    let isActive = true
    
    const setupStream = async () => {
      try {
        console.log('🔄 Setting up message stream for:', conversation.topic)
        
        // Create message stream
        const messageStream = await conversation.streamMessages()
        streamRef.current = messageStream
        
        // Listen for new messages
        for await (const message of messageStream) {
          if (!isActive) break
          
          // Skip if this is a duplicate message
          if (message.id === lastMessageRef.current) continue
          
          // Check if this is a typing indicator
          if (isTypingIndicator(message)) {
            handleTypingIndicator(message)
            continue // Don't add typing indicators to message list
          }
          
          console.log('📨 New message received:', message.id)
          
          // Convert and add to messages
          const convertedMessage = convertXMTPMessage(message)
          
          setMessages(prev => {
            // Check for duplicates
            const exists = prev.some(msg => msg.id === convertedMessage.id)
            if (exists) return prev
            
            // Add new message
            const updated = [...prev, convertedMessage]
            
            // Keep only the latest messages (prevent memory bloat)
            if (updated.length > messageLimit) {
              return updated.slice(-messageLimit)
            }
            
            return updated
          })
          
          // Update last message reference
          lastMessageRef.current = message.id
          
          // Clear typing indicators when real message arrives
          const senderAddress = message.senderAddress as Address
          if (typingUsersRef.current.has(senderAddress)) {
            typingUsersRef.current.delete(senderAddress)
            setIsTyping(typingUsersRef.current.size > 0)
          }
          
          // Play sound if enabled and message is from others
          if (enableSound && !convertedMessage.isOwn) {
            playMessageSound()
          }
          
          // Auto-scroll if enabled
          if (autoScroll) {
            setTimeout(() => scrollToBottom(), 100)
          }
        }
        
      } catch (streamError) {
        if (isActive) {
          console.error('❌ Message stream error:', streamError)
          setError(streamError instanceof Error ? streamError : new Error('Stream error'))
        }
      }
    }
    
    setupStream()
    
    return () => {
      isActive = false
      streamRef.current = null
    }
  }, [conversation, client, convertXMTPMessage, messageLimit, enableSound, autoScroll])
  
  // ===== SENDING MESSAGES =====
  
  /**
   * Send a new message
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!conversation || !client || !content.trim()) return
    
    try {
      console.log('📤 Sending message:', content.substring(0, 50) + '...')
      
      // Send message via XMTP
      await conversation.send(content.trim())
      
      console.log('✅ Message sent successfully')
      
    } catch (sendError) {
      console.error('❌ Failed to send message:', sendError)
      setError(sendError instanceof Error ? sendError : new Error('Failed to send message'))
      throw sendError
    }
  }, [conversation, client])
  
  // ===== TYPING INDICATORS =====
  
  /**
   * Send typing indicator
   */
  const sendTypingIndicator = useCallback(async () => {
    if (!conversation || !client) return
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    try {
      // Send a special typing indicator message that won't be displayed
      // Use a special prefix to identify typing indicators
      const typingIndicatorContent = `__TYPING_INDICATOR__:${Date.now()}:${client.address}`
      
      // Send as regular message but with special format for identification
      await conversation.send(typingIndicatorContent)
      
      console.log('✍️ Typing indicator sent')
      
    } catch (error) {
      // Typing indicators are non-critical, so we just log errors
      console.warn('⚠️ Failed to send typing indicator:', error)
    }
    
    // Auto-clear typing after timeout
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Typing indicator cleared')
    }, MESSAGING_UI.typingIndicatorTimeout)
    
  }, [conversation, client])
  
  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(() => {
    if (!conversation) return
    
    // Update message read status
    setMessages(prev => 
      prev.map(msg => 
        msg.isOwn ? msg : { ...msg, status: 'read' as MessageStatus }
      )
    )
    
    console.log('👁️ Messages marked as read')
  }, [conversation])
  
  // ===== UTILITY FUNCTIONS =====
  
  /**
   * Play message notification sound
   */
  const playMessageSound = useCallback(() => {
    try {
      // Simple notification sound (you can replace with custom audio)
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeCSuX2/HDdCQELYPP8diJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeCSuX2/HDdCQELYPP8diJNwgZaLvt555NEAxRqOPwtmIdBjiSQ+PwtmIdBjiS')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Ignore audio play errors (autoplay policies)
      })
    } catch (error) {
      // Ignore audio errors
    }
  }, [])
  
  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = useCallback(() => {
    const messageContainer = document.querySelector('[data-messages-container]')
    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight
    }
  }, [])
  
  // ===== INITIAL LOAD =====
  
  useEffect(() => {
    if (conversation) {
      loadMessages()
    } else {
      setMessages([])
      setError(null)
      lastMessageRef.current = null
    }
  }, [conversation, loadMessages])
  
  // ===== CLEANUP =====
  
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])
  
  // ===== RETURN HOOK RESULT =====
  
  return {
    messages,
    isLoading,
    error,
    isTyping,
    sendTypingIndicator,
    markAsRead,
    refreshMessages,
    sendMessage
  }
}
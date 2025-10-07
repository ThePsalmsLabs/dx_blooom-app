/**
 * Unified XMTP Hooks - Cross-Platform Messaging Hooks
 * File: /src/shared/xmtp/hooks.ts
 *
 * Unified messaging hooks that work across web and mobile platforms.
 * Built on top of the Zustand client store and TanStack Query for
 * consistent messaging experience with optimal performance.
 *
 * Features:
 * - Cross-platform conversation management
 * - Real-time message streaming
 * - Optimistic updates
 * - Error handling and recovery
 * - Performance optimizations
 * - TypeScript type safety
 */

'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useConversationsQuery,
  useConversationQuery,
  useMessagesQuery,
  useCreateConversationMutation,
  useSendMessageMutation,
  useConversationManager as useConversationManagerImpl,
  useMessageManager as useMessageManagerImpl,
  xmtpQueryKeys
} from './queries'
import { useXMTPClient, useIsXMTPConnected, useXMTPConnectionStatus } from './client'
import type {
  ConversationPreview,
  ExtendedMessage,
  SendMessageRequest,
  CreateConversationRequest,
  MessagingContext,
  XMTPError,
  ConversationManagerResult,
  MessageManagerResult
} from './types'
import type { Address } from 'viem'

// ================================================
// CORE MESSAGING HOOKS
// ================================================

/**
 * Main hook for conversation management
 * Provides complete conversation functionality
 */
export const useConversationManager = (): ConversationManagerResult => {
  return useConversationManagerImpl()
}

/**
 * Main hook for message management in a specific conversation
 */
export const useMessageManager = (conversationTopic: string): MessageManagerResult => {
  return useMessageManagerImpl(conversationTopic)
}

/**
 * Hook for XMTP client status and connection management
 */
export const useXMTPStatus = () => {
  const client = useXMTPClient()
  const isConnected = useIsXMTPConnected()
  const connectionStatus = useXMTPConnectionStatus()

  return {
    client,
    isConnected,
    connectionStatus,
    isReady: isConnected && !!client,
    canSendMessages: isConnected && !!client
  }
}

// ================================================
// CONVERSATION HOOKS
// ================================================

/**
 * Hook to get all conversations with optional filtering
 */
export const useConversations = (options?: { 
  includeEmpty?: boolean
  sortBy?: 'recent' | 'alphabetical' | 'unread'
}) => {
  const conversationsQuery = useConversationsQuery()
  
  const sortedConversations = useMemo(() => {
    if (!conversationsQuery.data) return []
    
    let filtered = conversationsQuery.data
    
    // Filter empty conversations if requested
    if (!options?.includeEmpty) {
      filtered = filtered.filter(conv => conv.lastMessage)
    }
    
    // Sort conversations
    switch (options?.sortBy) {
      case 'alphabetical':
        return filtered.sort((a, b) => a.peerAddress.localeCompare(b.peerAddress))
      case 'unread':
        return filtered.sort((a, b) => b.unreadCount - a.unreadCount)
      case 'recent':
      default:
        return filtered.sort((a, b) => {
          const timeA = a.lastMessageTime?.getTime() || 0
          const timeB = b.lastMessageTime?.getTime() || 0
          return timeB - timeA
        })
    }
  }, [conversationsQuery.data, options])

  return {
    conversations: sortedConversations,
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error as XMTPError | null,
    refetch: conversationsQuery.refetch
  }
}

/**
 * Hook to get a specific conversation by topic
 */
export const useConversation = (topic: string) => {
  const conversationQuery = useConversationQuery(topic)
  
  return {
    conversation: conversationQuery.data || null,
    isLoading: conversationQuery.isLoading,
    error: conversationQuery.error as XMTPError | null,
    refetch: conversationQuery.refetch
  }
}

/**
 * Hook to find conversation with a specific peer
 */
export const useConversationWithPeer = (peerAddress: Address) => {
  const { conversations } = useConversations()
  
  const conversation = useMemo(() => {
    return conversations.find(conv => 
      conv.peerAddress.toLowerCase() === peerAddress.toLowerCase()
    ) || null
  }, [conversations, peerAddress])

  return {
    conversation,
    exists: !!conversation,
    topic: conversation?.topic
  }
}

/**
 * Hook to create a new conversation
 */
export const useCreateConversation = () => {
  const createMutation = useCreateConversationMutation()
  
  const createConversation = useCallback(
    async (peerAddress: Address, options?: {
      initialMessage?: string
      context?: MessagingContext
    }) => {
      const request: CreateConversationRequest = {
        peerAddress,
        initialMessage: options?.initialMessage,
        context: options?.context
      }
      
      return await createMutation.mutateAsync(request)
    },
    [createMutation]
  )

  return {
    createConversation,
    isCreating: createMutation.isPending,
    error: createMutation.error as XMTPError | null
  }
}

// ================================================
// MESSAGE HOOKS
// ================================================

/**
 * Hook to get messages for a conversation
 */
export const useMessages = (conversationTopic: string, options?: {
  limit?: number
  autoRefresh?: boolean
}) => {
  const messagesQuery = useMessagesQuery(conversationTopic)

  // Auto-refresh messages if enabled
  useEffect(() => {
    if (!options?.autoRefresh) return

    const interval = setInterval(() => {
      messagesQuery.refetch()
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(interval)
  }, [options?.autoRefresh, messagesQuery])

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error as XMTPError | null,
    refetch: messagesQuery.refetch
  }
}

/**
 * Hook to send messages
 */
export const useSendMessage = (conversationTopic?: string) => {
  const sendMutation = useSendMessageMutation()
  
  const sendMessage = useCallback(
    async (content: string, options?: {
      peerAddress?: Address
      messageType?: 'text' | 'image' | 'file'
      context?: MessagingContext
    }) => {
      const request: SendMessageRequest = {
        content,
        conversationTopic,
        peerAddress: options?.peerAddress,
        messageType: options?.messageType || 'text',
        context: options?.context
      }
      
      return await sendMutation.mutateAsync(request)
    },
    [sendMutation, conversationTopic]
  )

  return {
    sendMessage,
    isSending: sendMutation.isPending,
    error: sendMutation.error as XMTPError | null
  }
}

// ================================================
// REAL-TIME STREAMING HOOKS
// ================================================

/**
 * Hook for real-time message streaming
 */
export const useMessageStream = (conversationTopic: string, enabled: boolean = true) => {
  const client = useXMTPClient()
  const queryClient = useQueryClient()
  const isConnected = useIsXMTPConnected()

  useEffect(() => {
    if (!enabled || !isConnected || !client || !conversationTopic) return

    let cancelled = false

    const setupStream = async () => {
      try {
        const conversations = await client.conversations.list()
        const conversation = conversations.find(c => c.topic === conversationTopic)
        if (!conversation) return

        // Stream new messages
        const stream = await conversation.streamMessages()
        
        for await (const message of stream) {
          if (cancelled) break
          
          // Update messages cache
          queryClient.setQueryData(
            xmtpQueryKeys.messages(conversationTopic),
            (old: ExtendedMessage[] = []) => {
              // Check if message already exists
              const exists = old.find(msg => msg.id === message.id)
              if (exists) return old
              
              // Add new message
              const newMessage: ExtendedMessage = {
                id: message.id,
                content: message.content,
                senderAddress: message.senderAddress as Address,
                timestamp: message.sent,
                messageType: 'text',
                status: 'sent',
                conversationTopic
              }
              
              return [...old, newMessage]
            }
          )

          // Update conversation's last message
          queryClient.setQueryData(
            xmtpQueryKeys.conversations(),
            (old: ConversationPreview[] = []) =>
              old.map(conv =>
                conv.topic === conversationTopic
                  ? {
                      ...conv,
                      lastMessage: {
                        id: message.id,
                        content: message.content,
                        senderAddress: message.senderAddress as Address,
                        timestamp: message.sent,
                        messageType: 'text',
                        status: 'sent'
                      },
                      lastMessageTime: message.sent
                    }
                  : conv
              )
          )
        }
      } catch (error) {
        console.error('Message streaming error:', error)
      }
    }

    setupStream()

    return () => {
      cancelled = true
    }
  }, [enabled, isConnected, client, conversationTopic, queryClient])
}

/**
 * Hook for streaming all conversations
 */
export const useConversationStream = (enabled: boolean = true) => {
  const client = useXMTPClient()
  const queryClient = useQueryClient()
  const isConnected = useIsXMTPConnected()

  useEffect(() => {
    if (!enabled || !isConnected || !client) return

    let cancelled = false

    const setupStream = async () => {
      try {
        // Stream new conversations  
        const stream = await client.conversations.stream()
        
        for await (const conversation of stream) {
          if (cancelled) break
          
          // Add new conversation to cache
          queryClient.setQueryData(
            xmtpQueryKeys.conversations(),
            (old: ConversationPreview[] = []) => {
              // Check if conversation already exists
              const exists = old.find(conv => conv.topic === conversation.topic)
              if (exists) return old
              
              // Create new conversation preview
              const newConversation: ConversationPreview = {
                id: conversation.topic,
                topic: conversation.topic,
                peerAddress: conversation.peerAddress as Address,
                unreadCount: 0,
                lastMessageTime: new Date()
              }
              
              return [newConversation, ...old]
            }
          )
        }
      } catch (error) {
        console.error('Conversation streaming error:', error)
      }
    }

    setupStream()

    return () => {
      cancelled = true
    }
  }, [enabled, isConnected, client, queryClient])
}

// ================================================
// UTILITY HOOKS
// ================================================

/**
 * Hook to get unread message counts
 */
export const useUnreadCounts = () => {
  const { conversations } = useConversations()

  const counts = useMemo(() => {
    const total = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
    const byConversation = conversations.reduce(
      (acc, conv) => ({ ...acc, [conv.topic]: conv.unreadCount }),
      {} as Record<string, number>
    )

    return {
      total,
      byConversation,
      hasUnread: total > 0
    }
  }, [conversations])

  return counts
}

/**
 * Hook to mark conversations as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  const markConversationAsRead = useCallback(
    (conversationTopic: string) => {
      queryClient.setQueryData(
        xmtpQueryKeys.conversations(),
        (old: ConversationPreview[] = []) =>
          old.map(conv =>
            conv.topic === conversationTopic ? { ...conv, unreadCount: 0 } : conv
          )
      )
    },
    [queryClient]
  )

  const markAllAsRead = useCallback(() => {
    queryClient.setQueryData(
      xmtpQueryKeys.conversations(),
      (old: ConversationPreview[] = []) =>
        old.map(conv => ({ ...conv, unreadCount: 0 }))
    )
  }, [queryClient])

  return {
    markConversationAsRead,
    markAllAsRead
  }
}

/**
 * Hook for quick messaging actions
 */
export const useQuickMessage = () => {
  const { createConversation } = useCreateConversation()
  const { sendMessage } = useSendMessage()
  const { conversations } = useConversations()
  
  const sendQuickMessage = useCallback(
    async (peerAddress: Address, content: string, context?: MessagingContext) => {
      try {
        // Try to send to existing conversation first
        const existingConversation = conversations.find(
          conv => conv.peerAddress.toLowerCase() === peerAddress.toLowerCase()
        )

        if (existingConversation) {
          return await sendMessage(content, { context })
        } else {
          // Create new conversation with initial message
          return await createConversation(peerAddress, {
            initialMessage: content,
            context
          })
        }
      } catch (error) {
        console.error('Quick message failed:', error)
        throw error
      }
    },
    [createConversation, sendMessage, conversations]
  )

  return {
    sendQuickMessage
  }
}

// ================================================
// EXPORTS
// ================================================

export {
  // Re-export query hooks for direct use
  useConversationsQuery,
  useConversationQuery,
  useMessagesQuery,
  useCreateConversationMutation,
  useSendMessageMutation
}
/**
 * Unified XMTP Queries - TanStack Query Integration
 * File: /src/shared/xmtp/queries.ts
 *
 * TanStack Query hooks for XMTP message state management.
 * Uses XMTP v13 API for cross-platform messaging.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { Conversation, DecodedMessage } from '@xmtp/xmtp-js'
import { useXMTPClient, useIsXMTPConnected } from './client'
import type { 
  ConversationPreview, 
  ExtendedMessage, 
  MessagingContext,
  SendMessageRequest,
  CreateConversationRequest,
  XMTPError
} from './types'
import type { Address } from 'viem'

// ================================================
// QUERY KEYS
// ================================================

export const xmtpQueryKeys = {
  all: ['xmtp'] as const,
  conversations: () => [...xmtpQueryKeys.all, 'conversations'] as const,
  messages: (topic: string) => [...xmtpQueryKeys.all, 'messages', topic] as const,
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

const conversationToPreview = async (
  conversation: Conversation,
  context?: MessagingContext
): Promise<ConversationPreview> => {
  const messages = await conversation.messages({ limit: 1 })
  const lastMessage = messages[0]
  
  return {
    id: conversation.topic,
    topic: conversation.topic,
    peerAddress: conversation.peerAddress as Address,
    lastMessage: lastMessage ? {
      id: lastMessage.id,
      content: lastMessage.content,
      senderAddress: lastMessage.senderAddress as Address,
      timestamp: lastMessage.sent,
      messageType: 'text',
      status: 'sent'
    } : undefined,
    unreadCount: 0,
    lastMessageTime: lastMessage?.sent,
    context
  }
}

const messageToExtended = (
  message: DecodedMessage,
  conversationTopic: string
): ExtendedMessage => {
  return {
    id: message.id,
    content: message.content,
    senderAddress: message.senderAddress as Address,
    timestamp: message.sent,
    messageType: 'text',
    status: 'sent',
    conversationTopic
  }
}

const createXMTPError = (message: string, code: XMTPError['code'] = 'UNKNOWN_ERROR'): XMTPError => ({
  code,
  message,
  timestamp: new Date()
})

// ================================================
// CONVERSATION QUERIES
// ================================================

export const useConversationsQuery = () => {
  const client = useXMTPClient()
  const isConnected = useIsXMTPConnected()

  return useQuery({
    queryKey: xmtpQueryKeys.conversations(),
    queryFn: async (): Promise<ConversationPreview[]> => {
      if (!client) {
        throw createXMTPError('XMTP client not initialized', 'CLIENT_NOT_INITIALIZED')
      }

      try {
        const conversations = await client.conversations.list()
        const previews = await Promise.all(
          conversations.map(conv => conversationToPreview(conv))
        )

        return previews.sort((a, b) => {
          const timeA = a.lastMessageTime?.getTime() || 0
          const timeB = b.lastMessageTime?.getTime() || 0
          return timeB - timeA
        })
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
        throw createXMTPError(
          error instanceof Error ? error.message : 'Failed to fetch conversations',
          'NETWORK_ERROR'
        )
      }
    },
    enabled: isConnected && !!client,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  })
}

export const useConversationQuery = (topic: string) => {
  const client = useXMTPClient()
  const isConnected = useIsXMTPConnected()

  return useQuery({
    queryKey: [...xmtpQueryKeys.conversations(), topic],
    queryFn: async (): Promise<ConversationPreview | null> => {
      if (!client) {
        throw createXMTPError('XMTP client not initialized', 'CLIENT_NOT_INITIALIZED')
      }

      try {
        const conversations = await client.conversations.list()
        const conversation = conversations.find(c => c.topic === topic)
        if (!conversation) return null

        return await conversationToPreview(conversation)
      } catch (error) {
        console.error('Failed to fetch conversation:', error)
        throw createXMTPError(
          error instanceof Error ? error.message : 'Failed to fetch conversation',
          'CONVERSATION_NOT_FOUND'
        )
      }
    },
    enabled: isConnected && !!client && !!topic,
    staleTime: 1000 * 60 * 5,
  })
}

// ================================================
// MESSAGE QUERIES
// ================================================

export const useMessagesQuery = (conversationTopic: string) => {
  const client = useXMTPClient()
  const isConnected = useIsXMTPConnected()

  return useQuery({
    queryKey: xmtpQueryKeys.messages(conversationTopic),
    queryFn: async (): Promise<ExtendedMessage[]> => {
      if (!client) {
        throw createXMTPError('XMTP client not initialized', 'CLIENT_NOT_INITIALIZED')
      }

      try {
        const conversations = await client.conversations.list()
        const conversation = conversations.find(c => c.topic === conversationTopic)
        if (!conversation) {
          throw createXMTPError('Conversation not found', 'CONVERSATION_NOT_FOUND')
        }

        const messages = await conversation.messages({ limit: 50 })
        return messages.map(msg => messageToExtended(msg, conversationTopic))
      } catch (error) {
        console.error('Failed to fetch messages:', error)
        throw createXMTPError(
          error instanceof Error ? error.message : 'Failed to fetch messages',
          'NETWORK_ERROR'
        )
      }
    },
    enabled: isConnected && !!client && !!conversationTopic,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  })
}

// ================================================
// MUTATIONS
// ================================================

export const useCreateConversationMutation = () => {
  const client = useXMTPClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: CreateConversationRequest): Promise<ConversationPreview> => {
      if (!client) {
        throw createXMTPError('XMTP client not initialized', 'CLIENT_NOT_INITIALIZED')
      }

      try {
        const conversation = await client.conversations.newConversation(request.peerAddress)
        const preview = await conversationToPreview(conversation, request.context)

        if (request.initialMessage) {
          await conversation.send(request.initialMessage)
        }

        return preview
      } catch (error) {
        console.error('Failed to create conversation:', error)
        throw createXMTPError(
          error instanceof Error ? error.message : 'Failed to create conversation',
          'NETWORK_ERROR'
        )
      }
    },
    onSuccess: (newConversation) => {
      queryClient.setQueryData(xmtpQueryKeys.conversations(), (old: ConversationPreview[] = []) => {
        const exists = old.find(conv => conv.topic === newConversation.topic)
        if (exists) return old
        return [newConversation, ...old]
      })
      queryClient.invalidateQueries({ queryKey: xmtpQueryKeys.conversations() })
    }
  })
}

export const useSendMessageMutation = () => {
  const client = useXMTPClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: SendMessageRequest): Promise<ExtendedMessage> => {
      if (!client) {
        throw createXMTPError('XMTP client not initialized', 'CLIENT_NOT_INITIALIZED')
      }

      try {
        let conversation: Conversation

        if (request.conversationTopic) {
          const conversations = await client.conversations.list()
          const existingConv = conversations.find(c => c.topic === request.conversationTopic)
          if (!existingConv) {
            throw createXMTPError('Conversation not found', 'CONVERSATION_NOT_FOUND')
          }
          conversation = existingConv
        } else if (request.peerAddress) {
          conversation = await client.conversations.newConversation(request.peerAddress)
        } else {
          throw createXMTPError('Either conversationTopic or peerAddress is required', 'INVALID_REQUEST')
        }

        const sentMessage = await conversation.send(request.content)
        return messageToExtended(sentMessage, conversation.topic)
      } catch (error) {
        console.error('Failed to send message:', error)
        throw createXMTPError(
          error instanceof Error ? error.message : 'Failed to send message',
          'MESSAGE_SEND_FAILED'
        )
      }
    },
    onSuccess: (sentMessage, request) => {
      if (request.conversationTopic) {
        const queryKey = xmtpQueryKeys.messages(request.conversationTopic)
        queryClient.setQueryData(queryKey, (old: ExtendedMessage[] = []) => [...old, sentMessage])

        queryClient.setQueryData(xmtpQueryKeys.conversations(), (old: ConversationPreview[] = []) => 
          old.map(conv => 
            conv.topic === request.conversationTopic 
              ? { 
                  ...conv, 
                  lastMessage: {
                    id: sentMessage.id,
                    content: sentMessage.content,
                    senderAddress: sentMessage.senderAddress,
                    timestamp: sentMessage.timestamp,
                    messageType: sentMessage.messageType,
                    status: sentMessage.status
                  },
                  lastMessageTime: sentMessage.timestamp 
                }
              : conv
          )
        )
      }
    }
  })
}

// ================================================
// HIGH-LEVEL HOOKS
// ================================================

export const useConversationManager = () => {
  const conversationsQuery = useConversationsQuery()
  const createMutation = useCreateConversationMutation()
  const queryClient = useQueryClient()

  const createConversation = useCallback(
    async (request: CreateConversationRequest) => {
      return await createMutation.mutateAsync(request)
    },
    [createMutation]
  )

  const getConversation = useCallback(
    (topic: string) => {
      return conversationsQuery.data?.find(conv => conv.topic === topic)
    },
    [conversationsQuery.data]
  )

  const markAsRead = useCallback(
    (topic: string) => {
      queryClient.setQueryData(xmtpQueryKeys.conversations(), (old: ConversationPreview[] = []) =>
        old.map(conv => conv.topic === topic ? { ...conv, unreadCount: 0 } : conv)
      )
    },
    [queryClient]
  )

  return {
    conversations: conversationsQuery.data || [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error as XMTPError | null,
    createConversation,
    getConversation,
    markAsRead,
    loadMore: async () => {},
    refresh: async () => {
      await conversationsQuery.refetch()
    }
  }
}

export const useMessageManager = (conversationTopic: string) => {
  const messagesQuery = useMessagesQuery(conversationTopic)
  const sendMutation = useSendMessageMutation()
  const queryClient = useQueryClient()

  const sendMessage = useCallback(
    async (request: SendMessageRequest) => {
      return await sendMutation.mutateAsync({
        ...request,
        conversationTopic
      })
    },
    [sendMutation, conversationTopic]
  )

  const markAsRead = useCallback(() => {
    queryClient.setQueryData(xmtpQueryKeys.conversations(), (old: ConversationPreview[] = []) =>
      old.map(conv => conv.topic === conversationTopic ? { ...conv, unreadCount: 0 } : conv)
    )
  }, [queryClient, conversationTopic])

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error as XMTPError | null,
    hasMore: false,
    sendMessage,
    loadMore: async () => {},
    markAsRead
  }
}

export { conversationToPreview, messageToExtended, createXMTPError }
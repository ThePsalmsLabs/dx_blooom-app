'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConversationList } from './ConversationList'
import { ConversationPanel } from './ConversationPanel'
import { useConversationManager } from '@/hooks/messaging/useConversationManager'
import { useXMTPClient } from '@/hooks/messaging/useXMTPClient'
import { useMessagingPermissions } from '@/hooks/messaging/useMessagingPermissions'
import { cn } from '@/lib/utils'
import type { Conversation, Message } from '@/types/messaging'
import { MessageCategory } from '@/types/messaging'
import type { Address } from 'viem'

interface MessagingInterfaceProps {
  userAddress: Address
  contentId?: string
  creatorAddress?: Address
  context?: 'post_purchase' | 'social_share' | 'general'
  className?: string
  onClose?: () => void
}

export function MessagingInterface({
  userAddress,
  contentId,
  creatorAddress,
  context = 'general',
  className,
  onClose
}: MessagingInterfaceProps) {
  // Use platform prop for accessibility
  const platform = typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop'
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showConversationPanel, setShowConversationPanel] = useState(false)

  // Initialize XMTP client
  const { 
    client, 
    isInitializing, 
    error: clientError 
  } = useXMTPClient()

  // Check messaging permissions
  const {
    canMessage,
    permissionLevel,
    isLoading: permissionsLoading
  } = useMessagingPermissions()

  // Manage conversations
  const {
    conversations,
    isLoading: conversationsLoading,
    sendMessage: sendMessageToConversation,
    getOrCreateConversation
  } = useConversationManager()

  // Handle responsive layout
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    checkMobileView()
    window.addEventListener('resize', checkMobileView)
    
    return () => window.removeEventListener('resize', checkMobileView)
  }, [])

  // Auto-create conversation for specific contexts
  useEffect(() => {
    if (
      client && 
      creatorAddress && 
      context === 'post_purchase' && 
      canMessage &&
      conversations.length === 0
    ) {
      const autoCreateConversation = async () => {
        try {
          await getOrCreateConversation(creatorAddress, {
            contentId: contentId ? BigInt(contentId) : undefined,
            creatorAddress,
            socialContext: 'web'
          })
          
          // Auto-select first conversation if available
          if (conversations.length > 0) {
            setSelectedConversation({
              id: conversations[0].id,
              participantAddress: conversations[0].peerAddress,
              lastMessageAt: new Date(),
              unreadCount: conversations[0].unreadCount,
              status: conversations[0].status
            })
            setShowConversationPanel(true)
          }
        } catch (error) {
          console.error('Failed to auto-create conversation:', error)
        }
      }
      
      autoCreateConversation()
    }
  }, [client, creatorAddress, context, canMessage, conversations.length, getOrCreateConversation, contentId])

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    if (isMobileView) {
      setShowConversationPanel(true)
    }
  }

  const handleBackToList = () => {
    setShowConversationPanel(false)
    setSelectedConversation(null)
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return
    
    try {
      await sendMessageToConversation(selectedConversation.participantAddress, {
        text: content,
        category: context === 'post_purchase' ? MessageCategory.PURCHASE_THANKS : MessageCategory.COMMUNITY_MSG,
        context: {
          contentId: contentId ? BigInt(contentId) : undefined,
          creatorAddress,
          socialContext: 'web'
        }
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }

  const handleNewConversation = async () => {
    if (!creatorAddress || !canMessage) return
    
    try {
      await getOrCreateConversation(creatorAddress, {
        contentId: contentId ? BigInt(contentId) : undefined,
        creatorAddress,
        socialContext: 'web'
      })
      
      // Auto-select first conversation if available
      if (conversations.length > 0) {
        setSelectedConversation({
          id: conversations[0].id,
          participantAddress: conversations[0].peerAddress,
          lastMessageAt: new Date(),
          unreadCount: conversations[0].unreadCount,
          status: conversations[0].status
        })
        if (isMobileView) {
          setShowConversationPanel(true)
        }
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  // Get messages for selected conversation (placeholder - will be implemented with message management)
  const selectedConversationMessages = useMemo(() => {
    if (!selectedConversation) return []
    return [] // TODO: Implement message retrieval from conversation
  }, [selectedConversation])

  // Loading states
  const isLoading = isInitializing || permissionsLoading || conversationsLoading

  // Error states
  if (clientError) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full p-8",
        className
      )}>
        <div className="text-center max-w-sm">
          <div 
            className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center"
            role="img"
            aria-label="Connection error icon"
          >
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" id="error-title">Connection Error</h3>
          <p 
            className="text-muted-foreground text-sm mb-4"
            aria-describedby="error-title"
          >
            Failed to connect to messaging service. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Retry connection to messaging service"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Permission denied
  if (!isLoading && !canMessage) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full p-8",
        className
      )}>
        <div className="text-center max-w-sm">
          <div 
            className="w-16 h-16 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center"
            role="img"
            aria-label="Messaging restricted icon"
          >
            <svg
              className="w-8 h-8 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" id="permission-title">Messaging Restricted</h3>
          <p 
            className="text-muted-foreground text-sm"
            aria-describedby="permission-title"
            role="status"
          >
            {permissionLevel === 'none' 
              ? "You don't have permission to send messages in this context."
              : "Complete the required actions to unlock messaging."
            }
          </p>
        </div>
      </div>
    )
  }

  const layoutVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { 
      opacity: 1, 
      scale: 1
    },
    exit: { 
      opacity: 0, 
      scale: 0.95
    }
  }

  // Mobile layout
  if (isMobileView) {
    return (
      <motion.div
        variants={layoutVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn("h-full bg-background", className)}
        role="main"
        aria-label={`Messaging interface for ${platform === 'mobile' ? 'mobile' : 'desktop'}`}
      >
        <AnimatePresence mode="wait">
          {showConversationPanel && selectedConversation ? (
            <motion.div
              key="conversation-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full"
            >
              <ConversationPanel
                conversation={selectedConversation}
                messages={selectedConversationMessages}
                currentUserAddress={userAddress}
                onSendMessage={handleSendMessage}
                onBack={handleBackToList}
                isLoading={isLoading}
                isTyping={false}
                aria-label={`Conversation with ${selectedConversation.participantAddress}`}
              />
            </motion.div>
          ) : (
            <motion.div
              key="conversation-list"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full"
            >
              <ConversationList
                conversations={conversations.map(conv => ({
                  id: conv.id,
                  participantAddress: conv.peerAddress,
                  lastMessageAt: conv.lastMessage?.timestamp || conv.createdAt,
                  unreadCount: conv.unreadCount,
                  status: conv.status,
                  lastMessage: conv.lastMessage ? {
                    id: conv.lastMessage.id,
                    content: conv.lastMessage.content,
                    sender: conv.lastMessage.sender,
                    timestamp: conv.lastMessage.timestamp,
                    status: 'sent' as const,
                    type: 'text' as const,
                    category: conv.lastMessage.category
                  } : undefined
                }))}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                onNewConversation={canMessage ? handleNewConversation : undefined}
                isLoading={isLoading}
                aria-label="List of conversations"
                role="navigation"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // Desktop layout
  return (
    <motion.div
      variants={layoutVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "flex h-full bg-background rounded-lg overflow-hidden shadow-lg",
        "border border-border/50 dark:border-border/30",
        className
      )}
      role="main"
      aria-label="Desktop messaging interface with conversation sidebar and message panel"
    >
      {/* Conversations sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-80 flex-shrink-0"
      >
        <ConversationList
          conversations={conversations.map(conv => ({
            id: conv.id,
            participantAddress: conv.peerAddress,
            lastMessageAt: conv.lastMessage?.timestamp || conv.createdAt,
            unreadCount: conv.unreadCount,
            status: conv.status,
            lastMessage: conv.lastMessage ? {
              id: conv.lastMessage.id,
              content: conv.lastMessage.content,
              sender: conv.lastMessage.sender,
              timestamp: conv.lastMessage.timestamp,
              status: 'sent' as const,
              type: 'text' as const,
              category: conv.lastMessage.category
            } : undefined
          }))}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          onNewConversation={canMessage ? handleNewConversation : undefined}
          isLoading={isLoading}
          aria-label="Conversation sidebar"
          role="navigation"
        />
      </motion.div>

      {/* Conversation panel */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 min-w-0"
      >
        <ConversationPanel
          conversation={selectedConversation}
          messages={selectedConversationMessages}
          currentUserAddress={userAddress}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isTyping={false}
          aria-label={selectedConversation ? `Conversation with ${selectedConversation.participantAddress}` : "Select a conversation to start messaging"}
        />
      </motion.div>
    </motion.div>
  )
}
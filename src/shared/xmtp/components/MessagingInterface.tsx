/**
 * Unified MessagingInterface Component
 * File: /src/shared/xmtp/components/MessagingInterface.tsx
 *
 * Production-ready messaging interface that works across web and miniapp contexts.
 * Migrated from legacy system with enhanced unified XMTP integration.
 *
 * Features:
 * - Cross-platform responsive design (web + miniapp)
 * - Framer Motion animations and transitions
 * - Unified XMTP client integration
 * - Real-time conversation management
 * - Accessibility compliance
 * - Error handling and loading states
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConversationList } from './ConversationList'
import { ConversationPanel } from './ConversationPanel'
import { useXMTPClient, useXMTPClientActions, useIsXMTPConnected, useXMTPConnectionStatus } from '../client'
import { useConversationManager, useMessagingPermissions, useRealtimeMessages } from '../hooks/index'
import { cn } from '@/lib/utils'
import { MessageCategory } from '../types/index'
import type { ConversationPreview, MessagePreview, MessageContent } from '../types/index'
import type { Address } from 'viem'

// ================================================
// TYPES & INTERFACES
// ================================================

interface MessagingInterfaceProps {
  readonly userAddress: Address
  readonly contentId?: string
  readonly creatorAddress?: Address
  readonly context?: 'post_purchase' | 'social_share' | 'general' | 'creator_reply'
  readonly className?: string
  readonly onClose?: () => void
}

interface LayoutVariants {
  readonly initial: { opacity: number; scale: number }
  readonly animate: { opacity: number; scale: number }
  readonly exit: { opacity: number; scale: number }
  readonly [key: string]: { [key: string]: number }
}

// ================================================
// COMPONENT IMPLEMENTATION
// ================================================

export function MessagingInterface({
  userAddress,
  contentId,
  creatorAddress,
  context = 'general',
  className,
  onClose
}: MessagingInterfaceProps) {
  // ===== STATE MANAGEMENT =====
  
  const [selectedConversation, setSelectedConversation] = useState<ConversationPreview | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showConversationPanel, setShowConversationPanel] = useState(false)

  // ===== UNIFIED XMTP INTEGRATION =====
  
  const client = useXMTPClient()
  const isConnected = useIsXMTPConnected()
  const connectionStatus = useXMTPConnectionStatus()
  const { connectWithAutoSigner } = useXMTPClientActions()

  // ===== MESSAGING HOOKS =====
  
  const {
    canMessage,
    permissionLevel,
    isLoading: permissionsLoading
  } = useMessagingPermissions()

  const {
    conversations,
    isLoading: conversationsLoading,
    getOrCreateConversation,
    getXMTPConversation,
    archiveConversation
  } = useConversationManager()

  // ===== RESPONSIVE LAYOUT =====
  
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    checkMobileView()
    window.addEventListener('resize', checkMobileView)
    
    return () => window.removeEventListener('resize', checkMobileView)
  }, [])

  // ===== AUTO-CONNECTION LOGIC =====
  
  useEffect(() => {
    const initializeXMTP = async () => {
      if (!isConnected && connectionStatus.status === 'disconnected') {
        try {
          await connectWithAutoSigner({
            env: 'production'
          })
        } catch (error) {
          console.error('Failed to auto-connect XMTP:', error)
        }
      }
    }

    initializeXMTP()
  }, [isConnected, connectionStatus.status, connectWithAutoSigner])

  // ===== AUTO-CONVERSATION CREATION =====
  
  useEffect(() => {
    if (
      isConnected && 
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
        setSelectedConversation(conversations[0])
            setShowConversationPanel(true)
          }
        } catch (error) {
          console.error('Failed to auto-create conversation:', error)
        }
      }
      
      autoCreateConversation()
    }
  }, [isConnected, creatorAddress, context, canMessage, conversations.length, getOrCreateConversation, contentId])

  // ===== EVENT HANDLERS =====
  
  const handleSelectConversation = (conversation: ConversationPreview) => {
    setSelectedConversation(conversation)
    if (isMobileView) {
      setShowConversationPanel(true)
    }
  }

  const handleBackToList = () => {
    setShowConversationPanel(false)
    setSelectedConversation(null)
  }

  const handleSendMessage = async (content: MessageContent) => {
    if (!selectedConversation) return
    
    try {
      await sendMessageToConversation(content)
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
        setSelectedConversation(conversations[0])
        if (isMobileView) {
          setShowConversationPanel(true)
        }
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await archiveConversation(conversationId)
    } catch (error) {
      console.error('Failed to archive conversation:', error)
    }
  }

  // ===== COMPUTED VALUES =====
  
  // Get messages for the selected conversation using real-time hook
  const { 
    messages: selectedConversationMessages, 
    isLoading: messagesLoading,
    error: messagesError,
    sendMessage: sendMessageToConversation,
    markAsRead
  } = useRealtimeMessages({
    conversation: selectedConversation ? getXMTPConversation(selectedConversation.id) : null,
    autoScroll: true,
    enableSound: false
  })

  const isLoading = !isConnected || permissionsLoading || conversationsLoading || messagesLoading
  const hasError = connectionStatus.status === 'error' || !!messagesError

  // ===== ANIMATION VARIANTS =====
  
  const layoutVariants: LayoutVariants = {
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

  // ===== ERROR STATES =====
  
  if (hasError) {
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

  // ===== PERMISSION DENIED STATE =====
  
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

  // ===== MOBILE LAYOUT =====
  
  if (isMobileView) {
    return (
      <motion.div
        variants={layoutVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn("h-full bg-background", className)}
        role="main"
        aria-label="Mobile messaging interface"
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
                aria-label={`Conversation with ${selectedConversation.peerAddress}`}
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
                conversations={conversations}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                onNewConversation={canMessage ? handleNewConversation : undefined}
                onArchiveConversation={handleArchiveConversation}
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

  // ===== DESKTOP LAYOUT =====
  
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
          conversations={conversations}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          onNewConversation={canMessage ? handleNewConversation : undefined}
          onArchiveConversation={handleArchiveConversation}
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
          aria-label={selectedConversation ? `Conversation with ${selectedConversation.peerAddress}` : "Select a conversation to start messaging"}
        />
      </motion.div>
    </motion.div>
  )
}

// ================================================
// EXPORTS
// ================================================

export default MessagingInterface


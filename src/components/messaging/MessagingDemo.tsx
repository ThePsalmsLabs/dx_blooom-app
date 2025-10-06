'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MessageButton } from './MessageButton'
import { ConversationList } from './ConversationList'
import { ConversationPanel } from './ConversationPanel'
import { MessageBubble, groupMessages } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { cn } from '@/lib/utils'
import type { Conversation, Message } from '@/types/messaging'
import { MessageCategory, ConversationStatus } from '@/types/messaging'

// Demo data for showcasing the UI
const demoConversations: Conversation[] = [
  {
    id: 'conv-1',
    participantAddress: '0x742d35Cc6634C0532925a3b8D847B2f' as const,
    participantName: 'Alice Chen',
    lastMessage: {
      id: 'msg-3',
      content: 'Thanks for the amazing content! 🚀',
      sender: '0x742d35Cc6634C0532925a3b8D847B2f' as const,
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'read',
      type: 'text',
      category: MessageCategory.CREATOR_REPLY
    },
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    status: ConversationStatus.ACTIVE,
  },
  {
    id: 'conv-2',
    participantAddress: '0x8ba1f109551bD432803012645Hac136c' as const,
    participantName: 'Bob Wilson',
    lastMessage: {
      id: 'msg-6',
      content: 'When will the next drop be available?',
      sender: '0x8ba1f109551bD432803012645Hac136c' as const,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'delivered',
      type: 'text',
      category: MessageCategory.COMMUNITY_MSG
    },
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    unreadCount: 2,
    isOnline: false,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000),
    status: ConversationStatus.ACTIVE
  },
  {
    id: 'conv-3',
    participantAddress: '0x9f34567890123456789012345678901234567890' as const,
    participantName: 'Charlie Davis',
    lastMessage: {
      id: 'msg-9',
      content: 'Love the new features in the platform!',
      sender: '0x9f34567890123456789012345678901234567890' as const,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'read',
      type: 'text',
      category: MessageCategory.PURCHASE_THANKS
    },
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    unreadCount: 0,
    isOnline: true,
    status: ConversationStatus.ACTIVE
  }
]

const demoMessages: Message[] = [
  {
    id: 'msg-1',
    content: 'Hey! I just purchased your latest content piece.',
    sender: '0x742d35Cc6634C0532925a3b8D847B2f' as const,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'read',
    type: 'text',
    category: MessageCategory.PURCHASE_THANKS
  },
  {
    id: 'msg-2',
    content: 'Thank you so much for the support! 🙏 Hope you enjoy it.',
    sender: '0x1234567890123456789012345678901234567890' as const,
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    status: 'read',
    type: 'text',
    category: MessageCategory.CREATOR_REPLY
  },
  {
    id: 'msg-3',
    content: 'Thanks for the amazing content! 🚀',
    sender: '0x742d35Cc6634C0532925a3b8D847B2f' as const,
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'read',
    type: 'text',
    category: MessageCategory.CREATOR_REPLY
  }
]

interface MessagingDemoProps {
  className?: string
  variant?: 'full' | 'conversation-list' | 'conversation-panel' | 'message-bubbles' | 'button-only'
  showTyping?: boolean
}

export function MessagingDemo({ 
  className,
  variant = 'full',
  showTyping = false
}: MessagingDemoProps) {
  const currentUserAddress = '0x1234567890123456789012345678901234567890' as const
  const selectedConversation = demoConversations[0]

  const handleSendMessage = async (content: string) => {
    console.log('Demo: Sending message:', content)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const handleSelectConversation = (conversation: Conversation) => {
    console.log('Demo: Selected conversation:', conversation.id)
  }

  const handleNewConversation = () => {
    console.log('Demo: Creating new conversation')
  }

  if (variant === 'button-only') {
    return (
      <div className={cn("p-8 flex items-center justify-center", className)}>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Message Button Component</h3>
          <div className="flex gap-4">
            <MessageButton
              userAddress={currentUserAddress}
              creatorAddress={selectedConversation.participantAddress}
              variant="default"
            />
            <MessageButton
              userAddress={currentUserAddress}
              creatorAddress={selectedConversation.participantAddress}
              variant="outline"
            >
              Start Chat
            </MessageButton>
            <MessageButton
              userAddress={currentUserAddress}
              creatorAddress={selectedConversation.participantAddress}
              variant="secondary"
              size="sm"
            >
              💬
            </MessageButton>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'message-bubbles') {
    const messageGroups = groupMessages(demoMessages)
    
    return (
      <div className={cn("p-8 bg-background min-h-[400px]", className)}>
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-lg font-semibold text-center mb-6">Message Bubbles</h3>
          <div className="space-y-1">
            {messageGroups.map((group, groupIndex) => (
              <div key={`group-${groupIndex}`} className="space-y-1">
                {group.map((message, messageIndex) => {
                  const isOwn = message.sender === currentUserAddress
                  const isFirstInGroup = messageIndex === 0
                  const isLastInGroup = messageIndex === group.length - 1
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      showAvatar={!isOwn}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                    />
                  )
                })}
              </div>
            ))}
            
            {/* Show typing indicator */}
            {showTyping && (
              <TypingIndicator senderName="Alice Chen" />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'conversation-list') {
    return (
      <div className={cn("h-[600px] max-w-sm mx-auto border rounded-lg overflow-hidden", className)}>
        <ConversationList
          conversations={demoConversations}
          selectedConversationId={selectedConversation.id}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
      </div>
    )
  }

  if (variant === 'conversation-panel') {
    return (
      <div className={cn("h-[600px] max-w-2xl mx-auto border rounded-lg overflow-hidden", className)}>
        <ConversationPanel
          conversation={selectedConversation}
          messages={demoMessages}
          currentUserAddress={currentUserAddress}
          onSendMessage={handleSendMessage}
          isTyping={showTyping}
        />
      </div>
    )
  }

  // Full interface
  return (
    <div className={cn("h-[600px] max-w-6xl mx-auto", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full bg-background rounded-lg overflow-hidden shadow-lg border border-border/50"
      >
        <div className="flex h-full">
          {/* Conversations sidebar */}
          <div className="w-80 flex-shrink-0">
            <ConversationList
              conversations={demoConversations}
              selectedConversationId={selectedConversation.id}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          {/* Conversation panel */}
          <div className="flex-1 min-w-0">
            <ConversationPanel
              conversation={selectedConversation}
              messages={demoMessages}
              currentUserAddress={currentUserAddress}
              onSendMessage={handleSendMessage}
              isTyping={showTyping}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Showcase component with all variants
export function MessagingShowcase({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-12 p-8", className)}>
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">iMessage-Inspired Messaging UI</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Beautiful, production-ready messaging components with rich animations, 
          dark/light mode support, and iOS-style interactions.
        </p>
      </div>

      {/* Message Button Options */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Multiple UX Patterns</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {/* Slide Panel */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-medium text-center">Slide Panel</h3>
            <p className="text-sm text-muted-foreground text-center">Discord/Slack style</p>
            <MessageButton 
              userAddress="0x1234567890123456789012345678901234567890"
              creatorAddress="0x742d35Cc6634C0532925a3b8D847B2f"
              uiType="slide-panel"
              className="w-full"
            >
              Open Panel
            </MessageButton>
          </div>

          {/* Floating Widget */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-medium text-center">Floating Widget</h3>
            <p className="text-sm text-muted-foreground text-center">Facebook Messenger style</p>
            <MessageButton 
              userAddress="0x1234567890123456789012345678901234567890"
              creatorAddress="0x742d35Cc6634C0532925a3b8D847B2f"
              uiType="floating-widget"
              className="w-full"
            >
              Float Widget
            </MessageButton>
          </div>

          {/* Inline Expander */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-medium text-center">Inline Expander</h3>
            <p className="text-sm text-muted-foreground text-center">Contextual expansion</p>
            <MessageButton 
              userAddress="0x1234567890123456789012345678901234567890"
              creatorAddress="0x742d35Cc6634C0532925a3b8D847B2f"
              uiType="inline-expander"
              className="w-full"
            >
              Expand Here
            </MessageButton>
          </div>

          {/* Page Route */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-medium text-center">Dedicated Page</h3>
            <p className="text-sm text-muted-foreground text-center">Full-page experience</p>
            <MessageButton 
              userAddress="0x1234567890123456789012345678901234567890"
              creatorAddress="0x742d35Cc6634C0532925a3b8D847B2f"
              uiType="page-route"
              className="w-full"
            >
              Open Page
            </MessageButton>
          </div>
        </div>
      </section>

      {/* Message Bubbles */}
      <section>
        <MessagingDemo variant="message-bubbles" showTyping />
      </section>

      {/* Conversation List */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Conversation List</h2>
        <MessagingDemo variant="conversation-list" />
      </section>

      {/* Conversation Panel */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Conversation Panel</h2>
        <MessagingDemo variant="conversation-panel" showTyping />
      </section>

      {/* Full Interface */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-center">Complete Messaging Interface</h2>
        <MessagingDemo variant="full" showTyping />
      </section>
    </div>
  )
}
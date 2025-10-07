/**
 * Unified ConversationPanel Component
 * File: /src/shared/xmtp/components/ConversationPanel.tsx
 *
 * Production-ready conversation panel with message display and composition.
 * Migrated from legacy system with enhanced unified XMTP integration.
 *
 * Features:
 * - Message display with grouping and timestamps
 * - Message composition with auto-resize
 * - Typing indicators
 * - Read receipts and status indicators
 * - Accessibility compliance
 * - Framer Motion animations
 * - Cross-platform compatibility
 */

'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MoreHorizontal, Phone, Video, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { MessageBubble, groupMessages } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import type { ConversationPreview, MessagePreview, MessageContent } from '../types/index'
import type { Address } from 'viem'

// ================================================
// TYPES & INTERFACES
// ================================================

interface ConversationPanelProps {
  readonly conversation: ConversationPreview | null
  readonly messages: MessagePreview[]
  readonly currentUserAddress: Address
  readonly onSendMessage: (content: MessageContent) => Promise<void>
  readonly onBack?: () => void
  readonly isLoading?: boolean
  readonly isTyping?: boolean
  readonly className?: string
  readonly 'aria-label'?: string
}

interface HeaderVariants {
  readonly initial: { opacity: number; y: number }
  readonly animate: { opacity: number; y: number }
  readonly [key: string]: { [key: string]: number }
}

interface EmptyStateVariants {
  readonly initial: { opacity: number; scale: number }
  readonly animate: { opacity: number; scale: number }
  readonly [key: string]: { [key: string]: number }
}

// ================================================
// MAIN CONVERSATION PANEL COMPONENT
// ================================================

export function ConversationPanel({
  conversation,
  messages,
  currentUserAddress,
  onSendMessage,
  onBack,
  isLoading = false,
  isTyping = false,
  className,
  'aria-label': ariaLabel
}: ConversationPanelProps) {
  // ===== STATE MANAGEMENT =====
  
  const [showActions, setShowActions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // ===== AUTO-SCROLL =====
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // ===== MESSAGE GROUPING =====
  
  const groupedMessages = useMemo(() => {
    return groupMessages(messages)
  }, [messages])
  
  // ===== COMPUTED VALUES =====
  
  const peerName = useMemo(() => {
    if (!conversation) return 'Unknown'
    return `${conversation.peerAddress.slice(0, 6)}...${conversation.peerAddress.slice(-4)}`
  }, [conversation])
  
  const hasMessages = messages.length > 0
  
  // ===== ANIMATION VARIANTS =====
  
  const headerVariants: HeaderVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 }
  }
  
  const emptyStateVariants: EmptyStateVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 }
  }
  
  // ===== RENDER =====
  
  return (
    <div 
      className={cn(
        "flex flex-col h-full bg-background",
        "dark:bg-background/95",
        className
      )}
      role="main"
      aria-label={ariaLabel || "Conversation panel"}
    >
      {/* Header */}
      <motion.div
        variants={headerVariants}
        initial="initial"
        animate="animate"
        className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0 flex-shrink-0"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Avatar className="h-8 w-8 flex-shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {conversation ? conversation.peerAddress.slice(2, 4).toUpperCase() : '??'}
              </span>
            </div>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{peerName}</h2>
            {isTyping && (
              <p className="text-xs text-muted-foreground">typing...</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Badge variant="secondary" className="text-xs">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1" />
            XMTP
          </Badge>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setShowActions(!showActions)}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-1" data-messages-container>
            {isLoading && messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 animate-spin mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full" />
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              </div>
            ) : !hasMessages ? (
              <motion.div
                variants={emptyStateVariants}
                initial="initial"
                animate="animate"
                className="flex flex-col items-center justify-center h-full py-8 text-center"
                role="status"
                aria-live="polite"
              >
                <div 
                  className="w-16 h-16 mb-4 bg-muted rounded-full flex items-center justify-center"
                  role="img"
                  aria-label="No messages icon"
                >
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Start the conversation</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Send your first message to {peerName}
                </p>
              </motion.div>
            ) : (
              groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-1">
                  {group.map((message, messageIndex) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.sender === currentUserAddress}
                      showAvatar={messageIndex === 0}
                      isFirstInGroup={messageIndex === 0}
                      isLastInGroup={messageIndex === group.length - 1}
                      previousMessage={messageIndex > 0 ? group[messageIndex - 1] : undefined}
                    />
                  ))}
                </div>
              ))
            )}
            
            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex gap-2 mb-4"
                >
                  <Avatar className="h-6 w-6">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs">
                        {conversation ? conversation.peerAddress.slice(2, 4).toUpperCase() : '??'}
                      </span>
                    </div>
                  </Avatar>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Composer */}
      {conversation && (
        <MessageComposer
          onSendMessage={onSendMessage}
          userAddress={currentUserAddress}
          placeholder={`Message ${peerName}...`}
          disabled={isLoading}
          showAttachments={false}
          aria-label="Compose message"
        />
      )}
    </div>
  )
}

// ================================================
// EXPORTS
// ================================================

export default ConversationPanel

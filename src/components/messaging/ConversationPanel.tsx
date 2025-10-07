'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Phone, Video, Info, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { MessageBubble, groupMessages } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { TypingIndicator } from './TypingIndicator'
import type { Message, Conversation } from '@/types/messaging'

interface ConversationPanelProps {
  conversation: Conversation | null
  messages: Message[]
  currentUserAddress: string
  onSendMessage: (content: string) => Promise<void>
  onBack?: () => void
  isLoading?: boolean
  isTyping?: boolean
  className?: string
  // Accessibility props
  'aria-label'?: string
}

interface ConversationHeaderProps {
  conversation: Conversation
  onBack?: () => void
  className?: string
}

function ConversationHeader({ conversation, onBack, className }: ConversationHeaderProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm",
        "dark:bg-background/90 dark:border-border/50",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Back button */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full md:hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={onBack}
            aria-label="Go back to conversations list"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}

        {/* Avatar and info */}
        <div className="flex items-center gap-3">
          <Avatar 
            className="w-10 h-10 ring-2 ring-background"
            role="img"
            aria-label={`Avatar for ${conversation.participantName || 'Unknown user'}`}
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-medium text-sm" aria-hidden="true">
                {conversation.participantName?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          </Avatar>

          <div className="flex flex-col">
            <h3 className="font-semibold text-sm">
              {conversation.participantName || `${conversation.participantAddress.slice(0, 6)}...${conversation.participantAddress.slice(-4)}`}
            </h3>
            <p className="text-xs text-muted-foreground" role="status">
              {conversation.isOnline ? (
                <span className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 bg-green-500 rounded-full" 
                    role="img"
                    aria-label="Online indicator"
                  />
                  Online
                </span>
              ) : (
                `Last seen ${conversation.lastSeen ? new Date(conversation.lastSeen).toLocaleDateString() : 'recently'}`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={() => {
            // Handle video call
          }}
          aria-label="Start video call"
        >
          <Video className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={() => {
            // Handle voice call
          }}
          aria-label="Start voice call"
        >
          <Phone className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={() => {
            // Handle info panel
          }}
          aria-label="Show conversation info"
        >
          <Info className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={() => {
            // Handle more options
          }}
          aria-label="More options"
        >
          <MoreVertical className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </motion.div>
  )
}

function EmptyConversationState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex items-center justify-center p-8"
      role="status"
      aria-live="polite"
    >
      <div className="text-center max-w-sm">
        <div 
          className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center"
          role="img"
          aria-label="No conversation selected icon"
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
        <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
        <p className="text-muted-foreground text-sm">
          Choose from your existing conversations or start a new one
        </p>
      </div>
    </motion.div>
  )
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    })
  }, [])

  // Handle scroll position to determine auto-scroll behavior
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    const { scrollTop, scrollHeight, clientHeight } = target
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setAutoScroll(isNearBottom)
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, autoScroll, scrollToBottom])

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (conversation) {
      setTimeout(() => scrollToBottom(false), 100)
    }
  }, [conversation, scrollToBottom])

  if (!conversation) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <EmptyConversationState />
      </div>
    )
  }

  const messageGroups = groupMessages(messages)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn("flex flex-col h-full", className)}
      role="main"
      aria-label={ariaLabel || `Conversation with ${conversation.participantName || 'Unknown user'}`}
    >
      {/* Header */}
      <ConversationHeader
        conversation={conversation}
        onBack={onBack}
      />

      {/* Messages area */}
      <div className="flex-1 relative min-h-0">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-full px-4"
          onScrollCapture={handleScroll}
          role="log"
          aria-label="Messages"
          data-messages-container
        >
          <div className="py-4 space-y-1">
            {/* Loading state */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-4"
                role="status"
                aria-label="Loading messages"
                aria-live="polite"
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-muted-foreground rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Message groups */}
            <AnimatePresence initial={false}>
              {messageGroups.map((group, groupIndex) => (
                <div key={`group-${groupIndex}`} className="space-y-1">
                  {group.map((message, messageIndex) => {
                    const isOwn = message.sender === currentUserAddress
                    const isFirstInGroup = messageIndex === 0
                    const isLastInGroup = messageIndex === group.length - 1
                    const previousMessage = messageIndex > 0 ? group[messageIndex - 1] : undefined
                    const nextMessage = messageIndex < group.length - 1 ? group[messageIndex + 1] : undefined

                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={!isOwn}
                        isFirstInGroup={isFirstInGroup}
                        isLastInGroup={isLastInGroup}
                        previousMessage={previousMessage}
                        nextMessage={nextMessage}
                      />
                    )
                  })}
                </div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <TypingIndicator
                  senderName={conversation.participantName}
                />
              )}
            </AnimatePresence>

            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </ScrollArea>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {!autoScroll && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bottom-4 right-4"
            >
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 rounded-full shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => {
                  setAutoScroll(true)
                  scrollToBottom()
                }}
                aria-label="Scroll to bottom of messages"
              >
                <ChevronLeft className="w-4 h-4 rotate-[270deg]" aria-hidden="true" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message composer */}
      <MessageComposer
        onSendMessage={onSendMessage}
        userAddress={currentUserAddress as `0x${string}`}
        placeholder="Message..."
        showAttachments
        onTyping={(typing) => {
          // Handle typing state for current user
          console.log('User typing:', typing)
        }}
        aria-label="Compose message"
      />
    </motion.div>
  )
}
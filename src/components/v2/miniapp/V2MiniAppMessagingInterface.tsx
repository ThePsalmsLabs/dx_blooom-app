/**
 * V2 MiniApp Messaging Interface - Mobile-First Chat UI
 * File: src/components/v2/miniapp/V2MiniAppMessagingInterface.tsx
 *
 * Ultra-modern, touch-optimized messaging interface designed specifically for miniapp environment.
 * Features mobile-native gestures, keyboard handling, and responsive design patterns.
 */

'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  Send,
  Paperclip,
  Smile,
  ArrowLeft,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Loader2,
  AlertCircle,
  WifiOff,
  CheckCircle2,
  Check,
  Clock
} from 'lucide-react'

// UI Components
import {
  Button,
  Card,
  CardContent,
  Avatar,
  AvatarFallback,
  Badge,
  Alert,
  AlertDescription,
  ScrollArea
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// XMTP Integration
import { useXMTPClient } from '@/hooks/messaging/useXMTPClient'
import { useConversationManager } from '@/hooks/messaging/useConversationManager'
import { useRealtimeMessages } from '@/hooks/messaging/useRealtimeMessages'
import { useMessageReadState } from '@/hooks/messaging/useMessageReadState'
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'

// Types
import type { Address } from 'viem'
import type { MessagePreview, MessageContent } from '@/types/messaging'
import { MessageCategory } from '@/types/messaging'

// ================================================
// INTERFACE TYPES
// ================================================

interface V2MiniAppMessagingInterfaceProps {
  /** User's wallet address */
  userAddress: Address
  /** Creator/peer address to chat with */
  creatorAddress: Address
  /** Optional content ID for context */
  contentId?: string
  /** Messaging context */
  context?: 'post_purchase' | 'social_share' | 'general' | 'creator_reply'
  /** Callback when back button is pressed */
  onBack?: () => void
  /** Custom className */
  className?: string
}

interface MessageState {
  isTyping: boolean
  typingIndicatorTimeout: NodeJS.Timeout | null
  showEmojiPicker: boolean
  showAttachments: boolean
}

interface TouchGesture {
  startY: number
  startTime: number
  velocity: number
}

// ================================================
// MOBILE-OPTIMIZED MESSAGE BUBBLE
// ================================================

interface MessageBubbleProps {
  message: MessagePreview
  isOwn: boolean
  showAvatar: boolean
  isLastInGroup: boolean
  onLongPress?: () => void
}

function V2MessageBubble({ 
  message, 
  isOwn, 
  showAvatar, 
  isLastInGroup,
  onLongPress 
}: MessageBubbleProps) {
  const [isPressed, setIsPressed] = useState(false)
  const pressTimer = useRef<NodeJS.Timeout | undefined>(undefined)

  const handlePressStart = useCallback(() => {
    setIsPressed(true)
    pressTimer.current = setTimeout(() => {
      onLongPress?.()
      // Haptic feedback for mobile
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
  }, [onLongPress])

  const handlePressEnd = useCallback(() => {
    setIsPressed(false)
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
    }
  }, [])

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  return (
    <motion.div
      className={cn(
        "flex gap-2 mb-1",
        isOwn ? "justify-end" : "justify-start",
        isLastInGroup && "mb-4"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar for received messages */}
      {!isOwn && (
        <div className="flex-shrink-0">
          {showAvatar ? (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-primary/10">
                {message.sender.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-6 w-6" />
          )}
        </div>
      )}

      {/* Message Bubble */}
      <motion.div
        className={cn(
          "max-w-[280px] sm:max-w-[320px] relative group",
          isOwn ? "ml-12" : "mr-12"
        )}
        animate={{ scale: isPressed ? 0.98 : 1 }}
        transition={{ duration: 0.1 }}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
      >
        <div
          className={cn(
            "px-3 py-2 rounded-2xl shadow-sm",
            "break-words whitespace-pre-wrap",
            isOwn
              ? "bg-primary text-primary-foreground ml-auto rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
            // Enhanced contrast for mobile readability
            "text-sm leading-relaxed"
          )}
        >
          {message.content}
        </div>

        {/* Message metadata */}
        <div className={cn(
          "flex items-center gap-1 mt-1 text-xs text-muted-foreground",
          isOwn ? "justify-end" : "justify-start"
        )}>
          <span>{formatTime(message.timestamp)}</span>
          
          {/* Read status for own messages */}
          {isOwn && (
            <div className="flex items-center">
              {message.isRead ? (
                <CheckCircle2 className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ================================================
// MOBILE MESSAGE COMPOSER
// ================================================

interface V2MessageComposerProps {
  onSendMessage: (content: string) => Promise<void>
  isSending: boolean
  disabled?: boolean
}

function V2MessageComposer({ onSendMessage, isSending, disabled }: V2MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = textarea.scrollHeight
      const maxHeight = 120 // Max 6 lines approximately
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
      setIsExpanded(scrollHeight > 40) // More than 2 lines
    }
  }, [message])

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending || disabled) return
    
    const messageToSend = message.trim()
    setMessage('')
    
    try {
      await onSendMessage(messageToSend)
    } catch (error) {
      // Restore message on error
      setMessage(messageToSend)
      console.error('Failed to send message:', error)
    }
  }, [message, onSendMessage, isSending, disabled])

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <motion.div
      className="border-t bg-background/95 backdrop-blur-sm p-4"
      animate={{ height: isExpanded ? 'auto' : 'auto' }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 flex-shrink-0"
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || isSending}
            className={cn(
              "w-full resize-none rounded-2xl border border-input",
              "bg-background px-4 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              // Mobile-optimized
              "min-h-[40px] max-h-[120px]",
              "touch-manipulation"
            )}
            rows={1}
          />
        </div>

        {/* Emoji button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 flex-shrink-0"
          disabled={disabled}
        >
          <Smile className="h-4 w-4" />
        </Button>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending || disabled}
          size="sm"
          className="h-9 w-9 p-0 rounded-full flex-shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </motion.div>
  )
}

// ================================================
// MAIN MESSAGING INTERFACE
// ================================================

export function V2MiniAppMessagingInterface({
  userAddress,
  creatorAddress,
  contentId,
  context = 'general',
  onBack,
  className
}: V2MiniAppMessagingInterfaceProps) {
  // XMTP Integration - following web patterns
  const { isConnected: xmtpConnected, isConnecting, error: xmtpError } = useXMTPClient()
  
  // Conversation management
  const {
    sendMessage: sendMessageToConversation,
    getOrCreateConversation,
    isLoading: conversationsLoading
  } = useConversationManager()
  
  // Get or create conversation with creator
  const [currentConversation, setCurrentConversation] = useState<any>(null)
  
  useEffect(() => {
    if (xmtpConnected && creatorAddress) {
      getOrCreateConversation(creatorAddress, {
        contentId: contentId ? BigInt(contentId) : undefined,
        creatorAddress,
        socialContext: 'miniapp'
      }).then(setCurrentConversation).catch(console.error)
    }
  }, [xmtpConnected, creatorAddress, contentId, getOrCreateConversation])
  
  // Real-time messages for current conversation
  const { 
    messages, 
    isLoading: messagesLoading,
    isTyping,
    sendTypingIndicator,
    markAsRead,
    error: messagesError
  } = useRealtimeMessages({
    conversation: currentConversation,
    autoScroll: true,
    enableSound: false
  })

  // Track typing users
  const typingUsers = useMemo(() => {
    return isTyping ? [creatorAddress] : []
  }, [isTyping, creatorAddress])

  // Track sending state
  const [isSending, setIsSending] = useState(false)

  // State management
  const [messageState, setMessageState] = useState<MessageState>({
    isTyping: false,
    typingIndicatorTimeout: null,
    showEmojiPicker: false,
    showAttachments: false
  })

  // Touch gesture handling for mobile
  const [touchGesture, setTouchGesture] = useState<TouchGesture | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Format creator name
  const creatorName = useMemo(() => {
    return `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`
  }, [creatorAddress])

  // Handle message sending
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !creatorAddress) return
    
    setIsSending(true)
    try {
      await sendMessageToConversation(creatorAddress, {
        text: content,
        category: context === 'post_purchase' ? MessageCategory.PURCHASE_THANKS : MessageCategory.COMMUNITY_MSG,
        context: {
          contentId: contentId ? BigInt(contentId) : undefined,
          creatorAddress,
          socialContext: 'miniapp'
        }
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    } finally {
      setIsSending(false)
    }
  }, [sendMessageToConversation, creatorAddress, context, contentId])

  // Group consecutive messages from same sender
  const groupedMessages = useMemo(() => {
    const groups: Array<{
      sender: Address
      messages: MessagePreview[]
      isOwn: boolean
    }> = []

    messages.forEach((message, index) => {
      const isOwn = message.sender === userAddress
      const prevMessage = messages[index - 1]
      const isSameSender = prevMessage?.sender === message.sender
      const isWithinTimeframe = prevMessage && 
        (message.timestamp.getTime() - prevMessage.timestamp.getTime()) < 300000 // 5 minutes

      // Create message with isRead property
      const messageWithReadState = {
        ...message,
        isRead: message.status === 'read'
      }

      if (isSameSender && isWithinTimeframe && groups.length > 0) {
        groups[groups.length - 1].messages.push(messageWithReadState)
      } else {
        groups.push({
          sender: message.sender,
          messages: [messageWithReadState],
          isOwn
        })
      }
    })

    return groups
  }, [messages, userAddress])

  // Handle connection errors
  if (!xmtpConnected && !isConnecting) {
    return (
      <div className={cn("h-full flex items-center justify-center p-4", className)}>
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-destructive/10">
              <WifiOff className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">Connection Required</h3>
              <p className="text-sm text-muted-foreground mt-1">
                XMTP messaging connection is required to chat
              </p>
            </div>
            {xmtpError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {xmtpError.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Connecting state
  if (isConnecting) {
    return (
      <div className={cn("h-full flex items-center justify-center p-4", className)}>
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Connecting...</h3>
            <p className="text-sm text-muted-foreground">
              Setting up secure messaging
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10">
              {creatorAddress.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{creatorName}</h2>
            {typingUsers.length > 0 && (
              <p className="text-xs text-muted-foreground">typing...</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1" />
            XMTP
          </Badge>
          
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {messagesLoading && messages.length === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          ) : groupedMessages.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-muted">
                <Send className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">Start the conversation</h3>
                <p className="text-sm text-muted-foreground">
                  Send your first message to {creatorName}
                </p>
              </div>
            </div>
          ) : (
            groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-1">
                {group.messages.map((message, messageIndex) => (
                  <V2MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={group.isOwn}
                    showAvatar={messageIndex === 0}
                    isLastInGroup={messageIndex === group.messages.length - 1}
                  />
                ))}
              </div>
            ))
          )}
          
          {/* Typing indicator */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-2 mb-4"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary/10">
                    {creatorAddress.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
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
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Composer */}
      <V2MessageComposer
        onSendMessage={handleSendMessage}
        isSending={isSending}
        disabled={!xmtpConnected}
      />
    </div>
  )
}
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Check, CheckCheck, User } from 'lucide-react'
import type { Message, MessageStatus } from '@/types/messaging'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  showTimestamp?: boolean
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
  previousMessage?: Message
  nextMessage?: Message
  className?: string
}

interface MessageStatusIndicatorProps {
  status: MessageStatus
  className?: string
}

function MessageStatusIndicator({ status, className }: MessageStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
        )
      case 'sent':
        return <Check className="w-3 h-3" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'failed':
        return (
          <div className="w-3 h-3 border border-red-500 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="w-1 h-1 bg-red-500 rounded-full" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'flex items-center text-xs opacity-70',
        status === 'failed' && 'text-red-500',
        className
      )}
      role="status"
    >
      {getStatusIcon()}
    </motion.div>
  )
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = false,
  isFirstInGroup = false,
  isLastInGroup = false,
  previousMessage,
  className
}: MessageBubbleProps) {
  // Add keyboard interaction support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Handle message selection (XMTP only supports basic messaging)
      console.log('Message selected:', message.id)
    }
  }
  const shouldShowTimestamp = showTimestamp || 
    (previousMessage && new Date(message.timestamp).getTime() - new Date(previousMessage.timestamp).getTime() > 5 * 60 * 1000)

  const messageBubbleVariants = {
    initial: { scale: 0.8, opacity: 0, y: 20 },
    animate: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 30
      }
    },
    exit: { scale: 0.8, opacity: 0, y: -10 }
  }

  const getBubbleClasses = () => {
    const baseClasses = "max-w-[280px] md:max-w-[320px] px-4 py-2.5 text-sm leading-relaxed"
    
    if (isOwn) {
      return cn(
        baseClasses,
        "bg-blue-500 text-white shadow-sm",
        isFirstInGroup && "rounded-t-[18px]",
        isLastInGroup && "rounded-b-[18px]",
        !isFirstInGroup && !isLastInGroup && "rounded-none",
        "rounded-l-[18px]",
        // Add subtle iOS-style gradient
        "bg-gradient-to-br from-blue-500 to-blue-600",
        "shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]"
      )
    } else {
      return cn(
        baseClasses,
        "bg-muted text-foreground shadow-sm",
        "dark:bg-muted/80 dark:text-muted-foreground",
        isFirstInGroup && "rounded-t-[18px]",
        isLastInGroup && "rounded-b-[18px]",
        !isFirstInGroup && !isLastInGroup && "rounded-none",
        "rounded-r-[18px]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]",
        "dark:shadow-[0_1px_3px_rgba(255,255,255,0.05),0_1px_2px_rgba(255,255,255,0.03)]"
      )
    }
  }

  return (
    <motion.div
      variants={messageBubbleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "flex items-end gap-2 mb-1",
        isOwn ? "flex-row-reverse ml-12" : "mr-12",
        className
      )}
    >
      {/* Avatar */}
      {showAvatar && isLastInGroup && !isOwn && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-shrink-0"
        >
          <Avatar 
            className="w-7 h-7 ring-2 ring-background"
            role="img"
            aria-label="Sender avatar"
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
          </Avatar>
        </motion.div>
      )}

      {/* Spacer when no avatar */}
      {!showAvatar || !isLastInGroup || isOwn ? (
        <div className="w-7 h-7 flex-shrink-0" />
      ) : null}

      <div className="flex flex-col gap-1 min-w-0">
        {/* Timestamp */}
        {shouldShowTimestamp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-xs text-muted-foreground text-center py-2",
              "font-medium tracking-wide"
            )}
            role="separator"
            aria-label={`Message sent ${formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}`}
          >
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </motion.div>
        )}

        {/* Message bubble */}
        <div className={cn(
          "relative",
          isOwn ? "flex justify-end" : "flex justify-start"
        )}>
          <div 
            className={cn(
              getBubbleClasses(),
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            )}
            tabIndex={0}
            role="article"
            aria-label={`Message from ${isOwn ? 'you' : 'sender'}: ${message.content}`}
            onKeyDown={handleKeyDown}
          >
            {message.content}
          </div>
        </div>

        {/* Message status (for own messages) */}
        {isOwn && isLastInGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end pr-1"
          >
            <MessageStatusIndicator status={message.status} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// Group consecutive messages by sender
export function groupMessages(messages: Message[]): Message[][] {
  const groups: Message[][] = []
  let currentGroup: Message[] = []
  let lastSender: string | null = null

  for (const message of messages) {
    const timeDiff = currentGroup.length > 0 
      ? new Date(message.timestamp).getTime() - new Date(currentGroup[currentGroup.length - 1].timestamp).getTime()
      : 0

    // Start new group if sender changes or time gap > 5 minutes
    if (message.sender !== lastSender || timeDiff > 5 * 60 * 1000) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }
      currentGroup = [message]
      lastSender = message.sender
    } else {
      currentGroup.push(message)
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}
'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Plus, Smile, Mic, Image, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { validateMessageContent, messagingRateLimiter } from '@/lib/messaging/message-utils'
import { MessageCategory } from '@/types/messaging'
import type { Address } from 'viem'

interface MessageComposerProps {
  onSendMessage: (content: string) => Promise<void>
  userAddress: Address
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  className?: string
  showAttachments?: boolean
  onTyping?: (isTyping: boolean) => void
  // Accessibility props
  'aria-label'?: string
}

export function MessageComposer({
  onSendMessage,
  userAddress,
  placeholder = "Message...",
  disabled = false,
  maxLength = 1000,
  className,
  showAttachments = false,
  onTyping,
  'aria-label': ariaLabel
}: MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const isValid = message.trim().length > 0 && message.length <= maxLength
  const canSend = isValid && !isSending && !disabled

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 120) // Max 5 lines
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      onTyping?.(true)
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onTyping?.(false)
    }, 1000)
  }, [isTyping, onTyping])

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setIsTyping(false)
    onTyping?.(false)
  }, [onTyping])

  // Handle message input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setMessage(value)
      adjustTextareaHeight()
      
      if (value.trim()) {
        handleTypingStart()
      } else {
        handleTypingStop()
      }
    }
  }

  // Handle send message
  const handleSend = async () => {
    if (!canSend) return

    const content = message.trim()
    
    // Validate message content
    const validation = validateMessageContent({
      text: content,
      category: MessageCategory.CREATOR_REPLY
    })
    
    if (!validation.isValid) {
      console.error('Message validation failed:', validation.errors)
      return
    }

    // Check rate limiting
    const rateLimitCheck = messagingRateLimiter.canSendMessage(userAddress)
    if (!rateLimitCheck.canSend) {
      console.error('Rate limit exceeded:', rateLimitCheck.reason)
      return
    }

    setIsSending(true)
    handleTypingStop()

    try {
      await onSendMessage(content)
      setMessage('')
      adjustTextareaHeight()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    
    // Escape to clear message
    if (e.key === 'Escape' && message.trim()) {
      setMessage('')
      adjustTextareaHeight()
      handleTypingStop()
    }
    
    // Ctrl/Cmd + Enter to send (alternative)
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  // Focus management
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && !disabled) {
      textarea.focus()
    }
  }, [disabled])

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const sendButtonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    sending: { 
      scale: 1,
      rotate: 360
    }
  }

  const attachmentMenuVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 10
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0
    }
  }

  return (
    <div 
      ref={composerRef}
      className={cn(
        "relative flex flex-col gap-2 p-3 border-t bg-background/95 backdrop-blur-sm",
        "dark:bg-background/90 dark:border-border/50",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      role="region"
      aria-label={ariaLabel || "Message composer"}
    >
      {/* Attachment menu */}
      <AnimatePresence>
        {showAttachmentMenu && (
          <motion.div
            variants={attachmentMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute bottom-full left-3 mb-2 p-2 bg-popover border rounded-lg shadow-lg"
          >
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => {
                  // Handle image upload
                  setShowAttachmentMenu(false)
                }}
                aria-label="Upload image"
              >
                <Image className="w-5 h-5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={() => {
                  // Handle voice message
                  setShowAttachmentMenu(false)
                }}
                aria-label="Record voice message"
              >
                <Mic className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main composer */}
      <div className="flex items-end gap-3">
        {/* Attachment button */}
        {showAttachments && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full flex-shrink-0 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              aria-label={showAttachmentMenu ? "Close attachment menu" : "Open attachment menu"}
              aria-expanded={showAttachmentMenu}
            >
              <motion.div
                animate={{ rotate: showAttachmentMenu ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {showAttachmentMenu ? <X className="w-4 h-4" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
              </motion.div>
            </Button>
          </motion.div>
        )}

        {/* Text input area */}
        <div className="flex-1 relative">
          <div className={cn(
            "relative flex items-end min-h-[40px] max-h-[120px]",
            "bg-muted/50 dark:bg-muted/30 rounded-[20px] border",
            "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
            "transition-all duration-200"
          )}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSending}
              rows={1}
              className={cn(
                "flex-1 bg-transparent px-4 py-2.5 text-sm resize-none",
                "placeholder:text-muted-foreground focus:outline-none",
                "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
              )}
              style={{ 
                height: '40px',
                lineHeight: '1.5'
              }}
              aria-label="Type your message"
              aria-describedby={message.length > maxLength * 0.8 ? "char-count" : undefined}
              maxLength={maxLength}
            />

            {/* Emoji button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full mr-2 flex-shrink-0 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => {
                // Handle emoji picker
              }}
              aria-label="Add emoji"
            >
              <Smile className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Character count */}
          {message.length > maxLength * 0.8 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "absolute -bottom-6 right-2 text-xs",
                message.length > maxLength * 0.9 ? "text-destructive" : "text-muted-foreground"
              )}
              id="char-count"
              role="status"
              aria-live="polite"
            >
              {message.length}/{maxLength}
            </motion.div>
          )}
        </div>

        {/* Send button */}
        <motion.div
          variants={sendButtonVariants}
          animate={isSending ? "sending" : "idle"}
          whileHover={canSend ? "hover" : undefined}
          whileTap={canSend ? "tap" : undefined}
        >
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-full flex-shrink-0",
              "bg-blue-500 hover:bg-blue-600 text-white",
              "disabled:bg-muted disabled:text-muted-foreground",
              "transition-all duration-200 shadow-sm",
              "focus:ring-2 focus:ring-blue-300 focus:ring-offset-2",
              canSend && "shadow-blue-500/20 hover:shadow-blue-500/30"
            )}
            aria-label={isSending ? "Sending message..." : "Send message"}
            aria-disabled={!canSend}
          >
            <motion.div
              animate={isSending ? { rotate: 360 } : { rotate: 0 }}
              transition={isSending ? { 
                duration: 1, 
                repeat: Infinity, 
                ease: "linear" 
              } : { duration: 0.2 }}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Rate limit warning */}
      {!messagingRateLimiter.canSendMessage(userAddress).canSend && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="text-xs text-amber-600 dark:text-amber-400 px-2"
          role="status"
          aria-live="polite"
        >
          Rate limit reached. Please wait before sending another message.
        </motion.div>
      )}
    </div>
  )
}
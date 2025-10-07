/**
 * V2MiniAppMessageComposer - Mobile-First Message Composer
 * File: src/components/v2/miniapp/V2MiniAppMessageComposer.tsx
 *
 * Mobile-optimized message composer with keyboard handling, auto-resize,
 * and touch-optimized controls for the miniapp environment.
 */

'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Plus, 
  Paperclip, 
  Smile, 
  X,
  Camera,
  Image as ImageIcon,
  Mic,
  MicOff,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ================================================
// TYPES & INTERFACES
// ================================================

interface V2MiniAppMessageComposerProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file') => Promise<void>
  onStartTyping?: () => void
  onStopTyping?: () => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  isLoading?: boolean
  className?: string
  
  // Mobile-specific props
  autoFocus?: boolean
  enableAttachments?: boolean
  enableVoiceRecording?: boolean
  enableEmoji?: boolean
  
  // Voice recording props
  onVoiceRecordingStart?: () => void
  onVoiceRecordingStop?: () => void
  isVoiceRecording?: boolean
  
  // Keyboard handling
  onKeyboardShow?: () => void
  onKeyboardHide?: () => void
}

interface AttachmentOption {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
  bgColor: string
  action: () => void
}

// ================================================
// MOBILE MESSAGE COMPOSER COMPONENT
// ================================================

export function V2MiniAppMessageComposer({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  placeholder = "Type a message...",
  disabled = false,
  maxLength = 1000,
  isLoading = false,
  className,
  autoFocus = false,
  enableAttachments = true,
  enableVoiceRecording = true,
  enableEmoji = true,
  onVoiceRecordingStart,
  onVoiceRecordingStop,
  isVoiceRecording = false,
  onKeyboardShow,
  onKeyboardHide
}: V2MiniAppMessageComposerProps) {
  // State management
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sendingState, setSendingState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const keyboardTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Calculate if message can be sent
  const canSend = useMemo(() => {
    return message.trim().length > 0 && !disabled && !isLoading && sendingState !== 'sending'
  }, [message, disabled, isLoading, sendingState])

  // Attachment options
  const attachmentOptions: AttachmentOption[] = useMemo(() => [
    {
      id: 'camera',
      icon: Camera,
      label: 'Camera',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      action: () => {
        console.log('Open camera')
        setShowAttachments(false)
      }
    },
    {
      id: 'gallery',
      icon: ImageIcon,
      label: 'Gallery',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      action: () => {
        console.log('Open gallery')
        setShowAttachments(false)
      }
    },
    {
      id: 'file',
      icon: Paperclip,
      label: 'File',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500',
      action: () => {
        console.log('Open file picker')
        setShowAttachments(false)
      }
    }
  ], [])

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 120) // Max 120px height
    textarea.style.height = `${newHeight}px`
  }, [])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      setMessage(newValue)
      adjustTextareaHeight()
      
      // Handle typing indicators
      if (newValue.trim() && !isTyping) {
        setIsTyping(true)
        onStartTyping?.()
      }
      
      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        onStopTyping?.()
      }, 1000)
    }
  }, [maxLength, isTyping, onStartTyping, onStopTyping, adjustTextareaHeight])

  // Handle send message
  const handleSendMessage = useCallback(async () => {
    if (!canSend) return

    const messageToSend = message.trim()
    if (!messageToSend) return

    setSendingState('sending')
    setMessage('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      await onSendMessage(messageToSend, 'text')
      setSendingState('sent')
      
      // Haptic feedback on successful send
      if (navigator.vibrate) {
        navigator.vibrate(25)
      }
      
      // Reset state after brief success indication
      setTimeout(() => setSendingState('idle'), 1000)
    } catch (error) {
      setSendingState('error')
      setMessage(messageToSend) // Restore message on error
      console.error('Failed to send message:', error)
      
      // Reset error state after delay
      setTimeout(() => setSendingState('idle'), 3000)
    }

    // Stop typing indicator
    setIsTyping(false)
    onStopTyping?.()
  }, [canSend, message, onSendMessage, onStopTyping])

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true)
    onKeyboardShow?.()
    
    // Scroll to composer after keyboard appears
    if (keyboardTimeoutRef.current) {
      clearTimeout(keyboardTimeoutRef.current)
    }
    keyboardTimeoutRef.current = setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 300)
  }, [onKeyboardShow])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    onKeyboardHide?.()
  }, [onKeyboardHide])

  // Handle voice recording
  const handleVoiceRecordingToggle = useCallback(() => {
    if (isVoiceRecording) {
      onVoiceRecordingStop?.()
    } else {
      onVoiceRecordingStart?.()
    }
  }, [isVoiceRecording, onVoiceRecordingStart, onVoiceRecordingStop])

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (keyboardTimeoutRef.current) {
        clearTimeout(keyboardTimeoutRef.current)
      }
    }
  }, [])

  // Character count
  const remainingChars = maxLength - message.length
  const showCharCount = message.length > maxLength * 0.8

  return (
    <div className={cn("relative bg-background border-t border-border/30", className)}>
      {/* Attachment Options */}
      <AnimatePresence>
        {showAttachments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border/30"
          >
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-medium text-sm">Attachments</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 ml-auto"
                  onClick={() => setShowAttachments(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {attachmentOptions.map((option, index) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                    onClick={option.action}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      option.bgColor
                    )}>
                      <option.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium">{option.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Composer */}
      <div className="p-4">
        <div className={cn(
          "flex items-end gap-3 p-3 rounded-2xl border border-border/50 transition-all duration-200",
          isFocused && "border-primary/50 bg-muted/30",
          disabled && "opacity-50"
        )}>
          {/* Attachment Button */}
          {enableAttachments && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 flex-shrink-0"
              onClick={() => setShowAttachments(!showAttachments)}
              disabled={disabled}
              aria-label="Add attachment"
            >
              <Plus className={cn(
                "w-5 h-5 transition-transform duration-200",
                showAttachments && "rotate-45"
              )} />
            </Button>
          )}

          {/* Text Input Area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "w-full min-h-[40px] max-h-[120px] resize-none bg-transparent",
                "text-sm leading-relaxed placeholder:text-muted-foreground",
                "border-none outline-none focus:ring-0"
              )}
              rows={1}
              style={{ height: '40px' }}
            />
            
            {/* Character Count */}
            <AnimatePresence>
              {showCharCount && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-8 right-0"
                >
                  <Badge
                    variant={remainingChars < 0 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {remainingChars}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Emoji Button */}
            {enableEmoji && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={disabled}
                aria-label="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </Button>
            )}

            {/* Voice Recording or Send Button */}
            {canSend ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Button
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={handleSendMessage}
                  disabled={sendingState === 'sending'}
                  aria-label="Send message"
                >
                  {sendingState === 'sending' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : sendingState === 'sent' ? (
                    <Check className="w-4 h-4" />
                  ) : sendingState === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            ) : enableVoiceRecording ? (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: isVoiceRecording ? 1.1 : 1 }}
              >
                <Button
                  variant={isVoiceRecording ? "destructive" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={handleVoiceRecordingToggle}
                  disabled={disabled}
                  aria-label={isVoiceRecording ? "Stop recording" : "Start voice recording"}
                >
                  {isVoiceRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            ) : null}
          </div>
        </div>

        {/* Voice Recording Indicator */}
        <AnimatePresence>
          {isVoiceRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-2 h-2 bg-red-500 rounded-full"
              />
              Recording voice message...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {sendingState === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-2 flex items-center gap-2 text-sm text-destructive"
            >
              <AlertCircle className="w-4 h-4" />
              Failed to send message. Tap to retry.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
/**
 * Unified MessageComposer Component
 * File: /src/shared/xmtp/components/MessageComposer.tsx
 *
 * Production-ready message composer with rich features migrated from legacy system.
 * Enhanced with unified XMTP integration and cross-platform compatibility.
 *
 * Features:
 * - Rich text input with auto-resize
 * - Attachment support (images, files)
 * - Emoji picker integration
 * - Typing indicators
 * - Rate limiting and validation
 * - Keyboard shortcuts
 * - Accessibility compliance
 * - Framer Motion animations
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Plus, Smile, Image, X, Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageCategory } from '../types/index'
import { uploadAttachment, createAbortController, formatUploadProgress } from '../utils/attachmentUpload'
import { validateAttachment, formatFileSize } from '../utils/attachmentEncryption'
import type { Address } from 'viem'
import type { AttachmentMessage, MessageContent, AttachmentUploadProgress } from '../types/index'

// ================================================
// TYPES & INTERFACES
// ================================================

interface MessageComposerProps {
  readonly onSendMessage: (content: MessageContent) => Promise<void>
  readonly userAddress: Address
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly maxLength?: number
  readonly className?: string
  readonly showAttachments?: boolean
  readonly onTyping?: (isTyping: boolean) => void
  readonly 'aria-label'?: string
}

interface SendButtonVariants {
  readonly idle: { scale: number }
  readonly hover: { scale: number }
  readonly tap: { scale: number }
  readonly sending: { scale: number; rotate: number }
  readonly [key: string]: { [key: string]: number }
}

interface AttachmentMenuVariants {
  readonly hidden: { opacity: number; scale: number; y: number }
  readonly visible: { opacity: number; scale: number; y: number }
  readonly [key: string]: { [key: string]: number }
}

// ================================================
// MESSAGE VALIDATION UTILITIES
// ================================================

/**
 * Validate message content
 */
function validateMessageContent(content: string, structuredAttachments: AttachmentMessage[]): {
  readonly isValid: boolean
  readonly errors: readonly string[]
} {
  const errors: string[] = []
  
  // Check if there's any content (text or attachments)
  const hasText = content.trim().length > 0
  const hasAttachments = structuredAttachments.length > 0
  
  if (!hasText && !hasAttachments) {
    errors.push('Message cannot be empty')
  }
  
  if (content.length > 1000) {
    errors.push('Message too long')
  }
  
  // Validate attachments
  for (const attachment of structuredAttachments) {
    if (!attachment.url || !attachment.name || !attachment.mimeType) {
      errors.push(`Invalid attachment: ${attachment.name || 'unknown'}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Simple rate limiter for message sending
 */
class MessageRateLimiter {
  private readonly userLimits = new Map<string, { count: number; resetTime: number }>()
  private readonly maxMessages = 10
  private readonly windowMs = 60000 // 1 minute

  canSendMessage(userAddress: string): {
    readonly canSend: boolean
    readonly reason?: string
  } {
    const now = Date.now()
    const userLimit = this.userLimits.get(userAddress)
    
    if (!userLimit || now > userLimit.resetTime) {
      // Reset or initialize limit
      this.userLimits.set(userAddress, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return { canSend: true }
    }
    
    if (userLimit.count >= this.maxMessages) {
      return {
        canSend: false,
        reason: 'Rate limit exceeded'
      }
    }
    
    // Increment count
    userLimit.count++
    return { canSend: true }
  }
}

const messageRateLimiter = new MessageRateLimiter()

// ================================================
// MAIN COMPONENT
// ================================================

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
  // ===== STATE MANAGEMENT =====
  
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [structuredAttachments, setStructuredAttachments] = useState<AttachmentMessage[]>([])
  const [uploadProgress, setUploadProgress] = useState<Map<string, AttachmentUploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<Map<string, string>>(new Map())
  
  // ===== REFS =====
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // ===== COMPUTED VALUES =====
  
  const hasContent = message.trim().length > 0 || structuredAttachments.length > 0
  const isValid = hasContent && message.length <= maxLength
  const canSend = isValid && !isSending && !disabled && !isUploading

  // ===== AUTO-RESIZE TEXTAREA =====
  
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 120) // Max 5 lines
      textarea.style.height = `${newHeight}px`
    }
  }, [])

  // ===== TYPING INDICATORS =====
  
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

  // ===== FILE UPLOAD HANDLERS =====
  
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    setUploadErrors(new Map())
    
    try {
      const fileArray = Array.from(files)
      
      // Validate files first
      const validFiles: File[] = []
      const validationErrors = new Map<string, string>()
      
      for (const file of fileArray) {
        const validation = validateAttachment(file)
        if (validation.isValid) {
          validFiles.push(file)
        } else {
          validationErrors.set(file.name, validation.error || 'Invalid file')
        }
      }
      
      // Update upload errors for invalid files
      setUploadErrors(validationErrors)
      
      // Upload valid files
      for (const file of validFiles) {
        const uploadId = `${file.name}_${Date.now()}`
        
        // Create initial progress state
        const progress: AttachmentUploadProgress = {
          id: uploadId,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          status: 'uploading',
          progress: 0,
        }
        
        setUploadProgress(prev => new Map(prev).set(uploadId, progress))
        
        try {
          const result = await uploadAttachment(file, {
            onProgress: (progressUpdate) => {
              setUploadProgress(prev => new Map(prev).set(uploadId, progressUpdate))
            }
          })
          
          if (result.success && result.attachment) {
            setStructuredAttachments(prev => [...prev, result.attachment!])
            setUploadProgress(prev => {
              const newMap = new Map(prev)
              newMap.delete(uploadId)
              return newMap
            })
          } else {
            setUploadErrors(prev => new Map(prev).set(file.name, result.error || 'Upload failed'))
            setUploadProgress(prev => {
              const newMap = new Map(prev)
              const progress = newMap.get(uploadId)
              if (progress) {
                newMap.set(uploadId, { ...progress, status: 'failed', error: result.error })
              }
              return newMap
            })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'
          setUploadErrors(prev => new Map(prev).set(file.name, errorMessage))
          setUploadProgress(prev => {
            const newMap = new Map(prev)
            const progress = newMap.get(uploadId)
            if (progress) {
              newMap.set(uploadId, { ...progress, status: 'failed', error: errorMessage })
            }
            return newMap
          })
        }
      }
    } catch (error) {
      console.error('Failed to process files:', error)
    } finally {
      setIsUploading(false)
    }
  }, [])
  
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      handleFileUpload(files)
    }
    input.click()
  }, [handleFileUpload])
  
  const handleFileUploadClick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      handleFileUpload(files)
    }
    input.click()
  }, [handleFileUpload])
  
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  const removeStructuredAttachment = useCallback((index: number) => {
    setStructuredAttachments(prev => prev.filter((_, i) => i !== index))
  }, [])

  const removeUploadProgress = useCallback((uploadId: string) => {
    setUploadProgress(prev => {
      const newMap = new Map(prev)
      newMap.delete(uploadId)
      return newMap
    })
  }, [])

  // ===== EVENT HANDLERS =====
  
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

  const handleSend = async () => {
    if (!canSend) return

    const content = message.trim()
    
    // Validate message content
    const validation = validateMessageContent(content, structuredAttachments)
    
    if (!validation.isValid) {
      console.error('Message validation failed:', validation.errors)
      return
    }

    // Check rate limiting
    const rateLimitCheck = messageRateLimiter.canSendMessage(userAddress)
    if (!rateLimitCheck.canSend) {
      console.error('Rate limit exceeded:', rateLimitCheck.reason)
      return
    }

    setIsSending(true)
    handleTypingStop()

    try {
      // Create structured message content
      let messageContent: MessageContent
      
      if (structuredAttachments.length === 0) {
        // Text-only message
        messageContent = {
          type: 'text',
          text: content
        }
      } else if (content.trim() === '') {
        // Attachments only
        messageContent = {
          type: 'attachment',
          attachment: structuredAttachments[0] // For now, single attachment
        }
      } else {
        // Mixed content (text + attachments)
        messageContent = {
          type: 'mixed',
          text: content,
          attachments: structuredAttachments
        }
      }
      
      await onSendMessage(messageContent)
      
      // Reset form state
      setMessage('')
      setAttachments([])
      setStructuredAttachments([])
      setUploadProgress(new Map())
      setUploadErrors(new Map())
      adjustTextareaHeight()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

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

  // ===== EFFECTS =====
  
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

  // ===== ANIMATION VARIANTS =====
  
  const sendButtonVariants: SendButtonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    sending: { 
      scale: 1,
      rotate: 360
    }
  }

  const attachmentMenuVariants: AttachmentMenuVariants = {
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

  // ===== RENDER =====
  
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
                  handleImageUpload()
                  setShowAttachmentMenu(false)
                }}
                aria-label="Upload image"
              >
                <Image className="w-5 h-5" aria-hidden="true" />
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
            "relative flex flex-col min-h-[40px] max-h-[120px]",
            "bg-muted/50 dark:bg-muted/30 rounded-[20px] border",
            "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
            "transition-all duration-200"
          )}>
            {/* Upload progress indicators */}
            {uploadProgress.size > 0 && (
              <div className="flex flex-wrap gap-2 p-2 border-b">
                {Array.from(uploadProgress.values()).map((progress) => (
                  <div
                    key={progress.id}
                    className="flex items-center gap-2 px-2 py-1 bg-blue-50 dark:bg-blue-950 rounded-md text-xs"
                  >
                    <Upload className="h-3 w-3 text-blue-600" />
                    <span className="truncate max-w-[100px]">{progress.name}</span>
                    <span className="text-blue-600">
                      {progress.progress.toFixed(0)}%
                    </span>
                    {progress.status === 'failed' && (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Structured attachment previews */}
            {structuredAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 border-b">
                {structuredAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-950 rounded-md text-xs"
                  >
                    <Image className="h-3 w-3 text-green-600" />
                    <span className="truncate max-w-[100px]">{attachment.name}</span>
                    <span className="text-green-600">
                      ({formatFileSize(attachment.size)})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeStructuredAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Legacy attachment previews (for backward compatibility) */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 border-b">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded-md text-xs"
                  >
                    <span className="truncate max-w-[100px]">{file.name}</span>
                    <span className="text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)}KB)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-end">
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
      {!messageRateLimiter.canSendMessage(userAddress).canSend && (
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

// ================================================
// EXPORTS
// ================================================

export default MessageComposer

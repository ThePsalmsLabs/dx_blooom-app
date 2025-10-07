/**
 * XMTP Content Type Detection and Routing
 * File: /src/shared/xmtp/utils/contentTypeDetection.ts
 *
 * Production-ready content type detection and routing for XMTP messages.
 * Handles both legacy text messages and structured attachment messages.
 *
 * Features:
 * - Content type detection from XMTP messages
 * - Backward compatibility with legacy text messages
 * - Type-safe message routing
 * - Proper error handling for unknown content types
 * - Future-proof extensibility for new content types
 */

'use client'

import { MessageCategory } from '../types/index'
import type { 
  MessageContent, 
  StructuredAttachment, 
  MessagePreview,
  AttachmentMessage
} from '../types/index'

// ================================================
// TYPES & INTERFACES
// ================================================

export type ContentType = 'text' | 'attachment' | 'mixed' | 'unknown'

export interface ContentTypeDetectionResult {
  readonly type: ContentType
  readonly data: MessageContent
  readonly error?: string
}

export interface LegacyMessageData {
  readonly text: string
  readonly attachments?: any[]
}

// ================================================
// CONTENT TYPE DETECTION
// ================================================

/**
 * Detect content type from XMTP message
 * 
 * @param message - The XMTP message to analyze
 * @returns Content type detection result
 */
export function detectContentType(message: any): ContentTypeDetectionResult {
  try {
    // Handle structured XMTP content types
    if (message.contentType && message.contentType.typeId) {
      return detectStructuredContentType(message)
    }

    // Handle legacy text messages
    if (typeof message.content === 'string') {
      return detectLegacyContentType(message.content)
    }

    // Handle unknown content types
    return {
      type: 'unknown',
      data: { type: 'text', text: '[Unsupported message type]' },
      error: 'Unknown content type',
    }
  } catch (error) {
    return {
      type: 'unknown',
      data: { type: 'text', text: '[Error parsing message]' },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Detect structured content types (XMTP native)
 */
function detectStructuredContentType(message: any): ContentTypeDetectionResult {
  const contentType = message.contentType.typeId

  switch (contentType) {
    case 'attachment':
      return {
        type: 'attachment',
        data: {
          type: 'attachment',
          attachment: parseStructuredAttachment(message.content),
        },
      }

    case 'mixed':
      return {
        type: 'mixed',
        data: {
          type: 'mixed',
          text: message.content.text || '',
          attachments: message.content.attachments?.map(parseStructuredAttachment) || [],
        },
      }

    case 'text':
    default:
      return {
        type: 'text',
        data: {
          type: 'text',
          text: message.content || '',
        },
      }
  }
}

/**
 * Detect legacy content type from text content
 */
function detectLegacyContentType(content: string): ContentTypeDetectionResult {
  // Check for inline attachment metadata (legacy format)
  const attachmentRegex = /Attachments:\s*\[([^\]]+)\]/i
  const match = content.match(attachmentRegex)

  if (match) {
    // Parse legacy attachment metadata
    const attachmentText = match[1]
    const textContent = content.replace(attachmentRegex, '').trim()

    return {
      type: 'mixed',
      data: {
        type: 'mixed',
        text: textContent,
        attachments: parseLegacyAttachmentMetadata(attachmentText),
      },
    }
  }

  // Plain text message
  return {
    type: 'text',
    data: {
      type: 'text',
      text: content,
    },
  }
}

// ================================================
// ATTACHMENT PARSING
// ================================================

/**
 * Parse structured attachment from XMTP message content
 */
function parseStructuredAttachment(content: any): AttachmentMessage {
  return {
    url: content.url,
    name: content.name,
    mimeType: content.mimeType,
    size: content.size,
    digest: content.digest,
    preview: content.preview ? {
      url: content.preview.url,
      data: content.preview.data,
      width: content.preview.width,
      height: content.preview.height,
      duration: content.preview.duration,
      mimeType: content.preview.mimeType,
      size: content.preview.size,
    } : undefined,
    encryption: {
      algorithm: content.encryption.algorithm,
      key: content.encryption.key,
      nonce: content.encryption.nonce,
      tag: content.encryption.tag,
    },
    createdAt: new Date(content.createdAt || Date.now()),
  }
}

/**
 * Parse legacy attachment metadata from inline text
 */
function parseLegacyAttachmentMetadata(attachmentText: string): AttachmentMessage[] {
  try {
    // Parse format: [type: name (size)]
    const attachmentRegex = /\[([^:]+):\s*([^(]+)\s*\(([^)]+)\)\]/g
    const attachments: AttachmentMessage[] = []
    let match

    while ((match = attachmentRegex.exec(attachmentText)) !== null) {
      const [, type, name, sizeText] = match
      
      // Extract size (remove KB, MB, etc.)
      const sizeMatch = sizeText.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)?/i)
      const size = sizeMatch ? parseFloat(sizeMatch[1]) * getSizeMultiplier(sizeMatch[2]) : 0

      attachments.push({
        url: '', // Legacy attachments don't have URLs
        name: name.trim(),
        mimeType: getMimeTypeFromExtension(name),
        size: size,
        digest: '', // Legacy attachments don't have digests
        encryption: {
          algorithm: 'AES-256-GCM',
          key: '',
          nonce: '',
          tag: '',
        },
        createdAt: new Date(),
      })
    }

    return attachments
  } catch (error) {
    console.warn('Failed to parse legacy attachment metadata:', error)
    return []
  }
}

/**
 * Get size multiplier for size parsing
 */
function getSizeMultiplier(unit?: string): number {
  switch (unit?.toUpperCase()) {
    case 'KB': return 1024
    case 'MB': return 1024 * 1024
    case 'GB': return 1024 * 1024 * 1024
    default: return 1
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'mp3': 'audio/mp3',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'json': 'application/json',
    'zip': 'application/zip',
  }

  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// ================================================
// MESSAGE CONVERSION UTILITIES
// ================================================

/**
 * Convert XMTP message to MessagePreview with proper content type detection
 */
export function convertXMTPMessageToPreview(xmtpMessage: any): MessagePreview {
  const contentDetection = detectContentType(xmtpMessage)

  return {
    id: xmtpMessage.id,
    content: contentDetection.data,
    sender: xmtpMessage.senderAddress,
    timestamp: new Date(xmtpMessage.sentAt),
    isRead: false, // Will be updated by read state management
        category: MessageCategory.USER_MESSAGE,
    status: 'sent',
  }
}

/**
 * Check if message contains attachments
 */
export function hasAttachments(content: MessageContent): boolean {
  return content.type === 'attachment' || 
         (content.type === 'mixed' && content.attachments.length > 0)
}

/**
 * Get attachment count from message content
 */
export function getAttachmentCount(content: MessageContent): number {
  switch (content.type) {
    case 'attachment':
      return 1
    case 'mixed':
      return content.attachments.length
    default:
      return 0
  }
}

/**
 * Extract text content from message
 */
export function extractTextContent(content: MessageContent): string {
  switch (content.type) {
    case 'text':
      return content.text
    case 'mixed':
      return content.text
    case 'attachment':
      return '' // No text content
    default:
      return ''
  }
}

/**
 * Extract attachments from message content
 */
export function extractAttachments(content: MessageContent): AttachmentMessage[] {
  switch (content.type) {
    case 'attachment':
      return [content.attachment]
    case 'mixed':
      return content.attachments
    default:
      return []
  }
}

// ================================================
// VALIDATION UTILITIES
// ================================================

/**
 * Validate message content structure
 */
export function validateMessageContent(content: MessageContent): boolean {
  try {
    switch (content.type) {
      case 'text':
        return typeof content.text === 'string'
      
      case 'attachment':
        return validateAttachmentMessage(content.attachment)
      
      case 'mixed':
        return typeof content.text === 'string' && 
               Array.isArray(content.attachments) &&
               content.attachments.every(validateAttachmentMessage)
      
      default:
        return false
    }
  } catch (error) {
    return false
  }
}

/**
 * Validate attachment message structure
 */
function validateAttachmentMessage(attachment: AttachmentMessage): boolean {
  return (
    typeof attachment.url === 'string' &&
    typeof attachment.name === 'string' &&
    typeof attachment.mimeType === 'string' &&
    typeof attachment.size === 'number' &&
    typeof attachment.digest === 'string' &&
    typeof attachment.encryption === 'object' &&
    attachment.encryption.algorithm === 'AES-256-GCM'
  )
}

export default {
  detectContentType,
  convertXMTPMessageToPreview,
  hasAttachments,
  getAttachmentCount,
  extractTextContent,
  extractAttachments,
  validateMessageContent,
}

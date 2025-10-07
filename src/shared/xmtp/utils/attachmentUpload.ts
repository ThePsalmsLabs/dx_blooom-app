/**
 * XMTP Attachment Upload Pipeline
 * File: /src/shared/xmtp/utils/attachmentUpload.ts
 *
 * Production-ready attachment upload pipeline for XMTP messages.
 * Handles encryption, upload, and structured payload creation.
 *
 * Features:
 * - Client-side encryption before upload
 * - Progress tracking and error handling
 * - Retry logic with exponential backoff
 * - Structured payload creation for XMTP
 * - Integration with existing upload API
 * - Type-safe upload state management
 */

'use client'

import { encryptAttachment, validateAttachment } from './attachmentEncryption'
import type { AttachmentUploadProgress } from '../types/index'
import { attachmentStorageService, type UploadProgress } from '../services/attachmentStorageService'
import type { StructuredAttachment, AttachmentMessage } from '../types/index'

// ================================================
// TYPES & INTERFACES
// ================================================

export interface UploadConfig {
  readonly maxRetries: number
  readonly retryDelay: number
  readonly timeout: number
  readonly chunkSize: number
}

export interface UploadResult {
  readonly success: boolean
  readonly attachment?: AttachmentMessage
  readonly error?: string
  readonly progress: number
}

export interface UploadProgressCallback {
  (progress: AttachmentUploadProgress): void
}

export interface UploadOptions {
  readonly config?: Partial<UploadConfig>
  readonly onProgress?: UploadProgressCallback
  readonly abortSignal?: AbortSignal
}

// ================================================
// UPLOAD CONFIGURATION
// ================================================

const DEFAULT_CONFIG: UploadConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  chunkSize: 1024 * 1024, // 1MB chunks
}

// ================================================
// MAIN UPLOAD FUNCTIONS
// ================================================

/**
 * Upload attachment with encryption and progress tracking
 * 
 * @param file - The file to upload
 * @param options - Upload options and callbacks
 * @returns Upload result with structured attachment data
 */
export async function uploadAttachment(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Use the storage service for upload
    const result = await attachmentStorageService.uploadFile(
      file,
      (progress) => {
        // Convert storage service progress to utility progress format
        const utilityProgress: AttachmentUploadProgress = {
          id: progress.uploadId,
          name: progress.filename,
          mimeType: file.type,
          size: file.size,
          status: progress.status as any,
          progress: progress.progress,
          error: progress.error
        }
        
        options.onProgress?.(utilityProgress)
      }
    )

    // Convert storage service result to utility result format
    return {
      success: result.success,
      attachment: result.attachment,
      error: result.error,
      progress: result.success ? 100 : 0,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    
    return {
      success: false,
      error: errorMessage,
      progress: 0,
    }
  }
}

/**
 * Upload multiple attachments in parallel
 */
export async function uploadMultipleAttachments(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadAttachment(file, options))
  return Promise.all(uploadPromises)
}

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Generate unique upload ID
 */
function generateUploadId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Read file as ArrayBuffer
 */
async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('File reading failed'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Upload encrypted data to storage
 */
async function uploadEncryptedData(
  encryptedData: ArrayBuffer,
  filename: string,
  config: UploadConfig,
  abortSignal?: AbortSignal,
  onProgress?: (progress: number) => void
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const uploadUrl = await performUpload(
        encryptedData,
        filename,
        config,
        abortSignal,
        onProgress
      )
      
      return uploadUrl
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed')
      
      if (attempt < config.maxRetries) {
        const delay = config.retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Upload failed after all retries')
}

/**
 * Perform the actual upload to storage
 */
async function performUpload(
  encryptedData: ArrayBuffer,
  filename: string,
  config: UploadConfig,
  abortSignal?: AbortSignal,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Create form data for upload
  const formData = new FormData()
  const blob = new Blob([encryptedData], { type: 'application/octet-stream' })
  formData.append('file', blob, `encrypted_${filename}`)
  formData.append('metadata', JSON.stringify({
    originalName: filename,
    encrypted: true,
    algorithm: 'AES-256-GCM',
    uploadedAt: new Date().toISOString(),
  }))

  // Create upload request with timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)

  // Combine abort signals
  if (abortSignal) {
    abortSignal.addEventListener('abort', () => controller.abort())
  }

  try {
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.url) {
      throw new Error('Upload response missing URL')
    }

    return result.url
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Upload cancelled')
    }
    
    throw error
  }
}

/**
 * Generate preview for attachment
 */
async function generatePreview(file: File, fileData: ArrayBuffer): Promise<StructuredAttachment['preview']> {
  const mimeType = file.type

  // Generate preview for images
  if (mimeType.startsWith('image/')) {
    try {
      const preview = await generateImagePreview(fileData, mimeType)
      return preview
    } catch (error) {
      console.warn('Failed to generate image preview:', error)
    }
  }

  // Generate preview for videos
  if (mimeType.startsWith('video/')) {
    try {
      const preview = await generateVideoPreview(file)
      return preview
    } catch (error) {
      console.warn('Failed to generate video preview:', error)
    }
  }

  return undefined
}

/**
 * Generate image preview
 */
async function generateImagePreview(fileData: ArrayBuffer, mimeType: string): Promise<StructuredAttachment['preview']> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([fileData], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const img = new Image()
    
    img.onload = () => {
      try {
        // Create thumbnail canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Calculate thumbnail dimensions (max 200px)
        const maxSize = 200
        let { width, height } = img
        
        if (width > height) {
          height = (height * maxSize) / width
          width = maxSize
        } else {
          width = (width * maxSize) / height
          height = maxSize
        }

        canvas.width = width
        canvas.height = height

        // Draw thumbnail
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to base64
        const thumbnailData = canvas.toDataURL('image/jpeg', 0.8)
        
        resolve({
          data: thumbnailData,
          width: img.naturalWidth,
          height: img.naturalHeight,
          mimeType: 'image/jpeg',
          size: thumbnailData.length,
        })
      } catch (error) {
        reject(error)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Generate video preview
 */
async function generateVideoPreview(file: File): Promise<StructuredAttachment['preview']> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    
    video.onloadedmetadata = () => {
      try {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          mimeType: file.type,
          size: file.size,
        })
      } catch (error) {
        reject(error)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video'))
    }
    
    video.src = url
    video.load()
  })
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Cancel upload by abort signal
 */
export function createAbortController(): AbortController {
  return new AbortController()
}

/**
 * Check if upload is cancelled
 */
export function isUploadCancelled(error: Error): boolean {
  return error.name === 'AbortError' || error.message.includes('cancelled')
}

/**
 * Format upload progress for display
 */
export function formatUploadProgress(progress: AttachmentUploadProgress): string {
  const { name, status, progress: percent } = progress
  
  switch (status) {
    case 'uploading':
      return `Uploading ${name}... ${percent.toFixed(0)}%`
    case 'encrypting':
      return `Encrypting ${name}...`
    case 'sent':
      return `${name} uploaded successfully`
    case 'failed':
      return `Failed to upload ${name}`
    default:
      return `Processing ${name}...`
  }
}

export default {
  uploadAttachment,
  uploadMultipleAttachments,
  createAbortController,
  isUploadCancelled,
  formatUploadProgress,
}

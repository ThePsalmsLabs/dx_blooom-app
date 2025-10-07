/**
 * XMTP Attachment Storage Service
 * File: /src/shared/xmtp/services/attachmentStorageService.ts
 *
 * Production-ready attachment storage service integrating with existing IPFS infrastructure.
 * Provides secure, encrypted file storage with comprehensive error handling and retry logic.
 *
 * Features:
 * - Integration with existing IPFS/Pinata infrastructure
 * - Client-side encryption before upload
 * - Progress tracking and cancellation
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - File validation and size limits
 * - Metadata preservation
 * - Cleanup and resource management
 */

'use client'

import { encryptAttachment, validateAttachment, type EncryptionResult } from '../utils/attachmentEncryption'
import type { AttachmentMessage, AttachmentUploadProgress } from '../types/index'

// ================================================
// TYPES & INTERFACES
// ================================================

export interface StorageConfig {
  readonly maxFileSize: number
  readonly allowedMimeTypes: readonly string[]
  readonly maxRetries: number
  readonly retryDelay: number
  readonly timeout: number
  readonly chunkSize: number
}

export interface UploadResult {
  readonly success: boolean
  readonly attachment?: AttachmentMessage
  readonly error?: string
  readonly uploadId?: string
}

export interface UploadProgress {
  readonly uploadId: string
  readonly filename: string
  readonly status: 'validating' | 'encrypting' | 'uploading' | 'completed' | 'failed'
  readonly progress: number // 0-100
  readonly error?: string
}

export interface StorageMetadata {
  readonly originalName: string
  readonly mimeType: string
  readonly size: number
  readonly encrypted: boolean
  readonly algorithm: string
  readonly uploadedAt: string
  readonly contentType: 'xmtp-attachment'
}

// ================================================
// CONFIGURATION
// ================================================

const DEFAULT_CONFIG: StorageConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'text/plain',
    'application/json',
    'application/zip',
    'text/markdown'
  ],
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 300000, // 5 minutes
  chunkSize: 1024 * 1024, // 1MB
}

// ================================================
// MAIN STORAGE SERVICE
// ================================================

export class AttachmentStorageService {
  private readonly config: StorageConfig
  private activeUploads: Map<string, AbortController> = new Map()
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map()

  constructor(config?: Partial<StorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Upload file with encryption and progress tracking
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const uploadId = this.generateUploadId()
    const abortController = new AbortController()
    
    this.activeUploads.set(uploadId, abortController)
    if (onProgress) {
      this.progressCallbacks.set(uploadId, onProgress)
    }

    try {
      return await this.performUpload(file, uploadId, abortController.signal)
    } finally {
      this.cleanup(uploadId)
    }
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(uploadId: string): boolean {
    const controller = this.activeUploads.get(uploadId)
    if (controller) {
      controller.abort()
      this.cleanup(uploadId)
      return true
    }
    return false
  }

  /**
   * Get list of active uploads
   */
  getActiveUploads(): string[] {
    return Array.from(this.activeUploads.keys())
  }

  /**
   * Validate file against configuration
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size ${this.formatFileSize(file.size)} exceeds limit of ${this.formatFileSize(this.config.maxFileSize)}`
      }
    }

    // Check MIME type
    if (!this.config.allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not supported`
      }
    }

    // Use existing validation
    const validation = validateAttachment(file)
    if (!validation.isValid) {
      return {
        valid: false,
        error: validation.error
      }
    }

    return { valid: true }
  }

  // ================================================
  // PRIVATE METHODS
  // ================================================

  private async performUpload(
    file: File,
    uploadId: string,
    abortSignal: AbortSignal
  ): Promise<UploadResult> {
    try {
      // Step 1: Validate file
      this.updateProgress(uploadId, {
        uploadId,
        filename: file.name,
        status: 'validating',
        progress: 5
      })

      const validation = this.validateFile(file)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          uploadId
        }
      }

      // Step 2: Read file data
      this.updateProgress(uploadId, {
        uploadId,
        filename: file.name,
        status: 'encrypting',
        progress: 10
      })

      const fileData = await this.readFileAsArrayBuffer(file, abortSignal)

      // Step 3: Encrypt data
      this.updateProgress(uploadId, {
        uploadId,
        filename: file.name,
        status: 'encrypting',
        progress: 20
      })

      const encryptionResult = await encryptAttachment(fileData)
      
      this.updateProgress(uploadId, {
        uploadId,
        filename: file.name,
        status: 'uploading',
        progress: 30
      })

      // Step 4: Upload encrypted data
      const uploadUrl = await this.uploadToIPFS(
        encryptionResult.encryptedData,
        file,
        encryptionResult,
        uploadId,
        abortSignal
      )

      // Step 5: Create attachment message
      const attachment: AttachmentMessage = {
        url: uploadUrl,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        digest: encryptionResult.digest,
        preview: await this.generatePreview(file, fileData),
        encryption: encryptionResult.encryption,
        createdAt: new Date()
      }

      this.updateProgress(uploadId, {
        uploadId,
        filename: file.name,
        status: 'completed',
        progress: 100
      })

      return {
        success: true,
        attachment,
        uploadId
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      this.updateProgress(uploadId, {
        uploadId,
        filename: file.name,
        status: 'failed',
        progress: 0,
        error: errorMessage
      })

      return {
        success: false,
        error: errorMessage,
        uploadId
      }
    }
  }

  private async uploadToIPFS(
    encryptedData: ArrayBuffer,
    originalFile: File,
    encryptionResult: EncryptionResult,
    uploadId: string,
    abortSignal: AbortSignal
  ): Promise<string> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.performIPFSUpload(
          encryptedData,
          originalFile,
          encryptionResult,
          uploadId,
          attempt,
          abortSignal
        )
        
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Upload failed')
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1)
          await this.delay(delay)
        }
      }
    }

    throw lastError || new Error('Upload failed after all retries')
  }

  private async performIPFSUpload(
    encryptedData: ArrayBuffer,
    originalFile: File,
    encryptionResult: EncryptionResult,
    uploadId: string,
    attempt: number,
    abortSignal: AbortSignal
  ): Promise<string> {
    // Create form data for upload
    const formData = new FormData()
    
    // Create encrypted blob
    const encryptedBlob = new Blob([encryptedData], { 
      type: 'application/octet-stream' 
    })
    
    // Create metadata
    const metadata: StorageMetadata = {
      originalName: originalFile.name,
      mimeType: originalFile.type,
      size: originalFile.size,
      encrypted: true,
      algorithm: encryptionResult.encryption.algorithm,
      uploadedAt: new Date().toISOString(),
      contentType: 'xmtp-attachment'
    }

    // Add encrypted file
    formData.append('file', encryptedBlob, `encrypted_${originalFile.name}`)
    formData.append('metadata', JSON.stringify(metadata))

    // Calculate progress range for this attempt
    const progressStart = 30 + (attempt - 1) * 20
    const progressEnd = Math.min(90, progressStart + 20)

    // Upload with progress tracking
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
      signal: abortSignal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || 
        errorData.details || 
        `Upload failed: ${response.status} ${response.statusText}`
      )
    }

    const result = await response.json()
    
    if (!result.hash && !result.url) {
      throw new Error('Upload response missing hash/url')
    }

    // Use hash if available (IPFS), otherwise use URL
    const uploadUrl = result.hash ? `ipfs://${result.hash}` : result.url

    // Update progress
    this.updateProgress(uploadId, {
      uploadId,
      filename: originalFile.name,
      status: 'uploading',
      progress: progressEnd
    })

    return uploadUrl
  }

  private async readFileAsArrayBuffer(file: File, abortSignal: AbortSignal): Promise<ArrayBuffer> {
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

      // Check if upload was cancelled
      abortSignal.addEventListener('abort', () => {
        reader.abort()
        reject(new Error('Upload cancelled'))
      })
      
      reader.readAsArrayBuffer(file)
    })
  }

  private async generatePreview(file: File, fileData: ArrayBuffer): Promise<AttachmentMessage['preview']> {
    const mimeType = file.type

    // Generate preview for images
    if (mimeType.startsWith('image/')) {
      try {
        return await this.generateImagePreview(fileData, mimeType)
      } catch (error) {
        console.warn('Failed to generate image preview:', error)
      }
    }

    // Generate preview for videos
    if (mimeType.startsWith('video/')) {
      try {
        return await this.generateVideoPreview(file)
      } catch (error) {
        console.warn('Failed to generate video preview:', error)
      }
    }

    return undefined
  }

  private async generateImagePreview(fileData: ArrayBuffer, mimeType: string): Promise<AttachmentMessage['preview']> {
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

  private async generateVideoPreview(file: File): Promise<AttachmentMessage['preview']> {
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

  private updateProgress(uploadId: string, progress: UploadProgress): void {
    const callback = this.progressCallbacks.get(uploadId)
    if (callback) {
      callback(progress)
    }
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private cleanup(uploadId: string): void {
    this.activeUploads.delete(uploadId)
    this.progressCallbacks.delete(uploadId)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
}

// ================================================
// SINGLETON INSTANCE
// ================================================

export const attachmentStorageService = new AttachmentStorageService()

export default attachmentStorageService

/**
 * XMTP Attachment Encryption Utilities
 * File: /src/shared/xmtp/utils/attachmentEncryption.ts
 *
 * Production-ready encryption utilities for XMTP attachments.
 * Implements AES-256-GCM encryption with proper key management.
 *
 * Features:
 * - Client-side encryption with per-attachment keys
 * - SHA-256 digest for integrity verification
 * - Base64 encoding for XMTP transport
 * - Proper error handling and validation
 * - Type-safe encryption parameters
 */

'use client'

import type { AttachmentEncryption } from '../types/index'

// ================================================
// TYPES & INTERFACES
// ================================================

export interface EncryptionResult {
  readonly encryptedData: ArrayBuffer
  readonly encryption: AttachmentEncryption
  readonly digest: string
}

export interface DecryptionResult {
  readonly decryptedData: ArrayBuffer
  readonly isValid: boolean
}

export interface DecryptionParams {
  readonly encryptedData: ArrayBuffer
  readonly encryption: AttachmentEncryption
  readonly expectedDigest: string
}

// ================================================
// ENCRYPTION CONSTANTS
// ================================================

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits for GCM
const TAG_LENGTH = 128 // 128 bits for GCM

// ================================================
// CRYPTO UTILITIES
// ================================================

/**
 * Generate a cryptographically secure random key
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  try {
    return await crypto.subtle.generateKey(
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    )
  } catch (error) {
    throw new Error(`Failed to generate encryption key: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate a cryptographically secure random IV/nonce
 */
export function generateIV(): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(IV_LENGTH)
  const iv = new Uint8Array(buffer)
  crypto.getRandomValues(iv)
  return iv
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Convert CryptoKey to base64 string
 */
async function cryptoKeyToBase64(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToBase64(exported)
}

/**
 * Convert base64 string to CryptoKey
 */
async function base64ToCryptoKey(base64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64)
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  )
}

// ================================================
// MAIN ENCRYPTION FUNCTIONS
// ================================================

/**
 * Encrypt attachment data
 * 
 * @param data - The raw attachment data to encrypt
 * @returns Encryption result with encrypted data, encryption params, and digest
 */
export async function encryptAttachment(data: ArrayBuffer): Promise<EncryptionResult> {
  try {
    // Generate encryption key and IV
    const key = await generateEncryptionKey()
    const iv = generateIV()

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      data
    )

    // Extract the authentication tag (last 16 bytes)
    const tagStart = encryptedData.byteLength - 16
    const tag = encryptedData.slice(tagStart)
    const ciphertext = encryptedData.slice(0, tagStart)

    // Generate digest for integrity verification
    const digestBuffer = await crypto.subtle.digest('SHA-256', data)
    const digest = arrayBufferToBase64(digestBuffer)

    // Convert key to base64 for storage
    const keyBase64 = await cryptoKeyToBase64(key)

    return {
      encryptedData: ciphertext,
      encryption: {
        algorithm: 'AES-256-GCM',
        key: keyBase64,
        nonce: arrayBufferToBase64(iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer),
        tag: arrayBufferToBase64(tag),
      },
      digest,
    }
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypt attachment data
 * 
 * @param encryptedData - The encrypted data to decrypt
 * @param encryption - The encryption parameters
 * @param expectedDigest - The expected SHA-256 digest for integrity verification
 * @returns Decryption result with decrypted data and validity check
 */
export async function decryptAttachment(
  encryptedData: ArrayBuffer,
  encryption: AttachmentEncryption,
  expectedDigest: string
): Promise<DecryptionResult> {
  try {
    // Reconstruct the CryptoKey
    const key = await base64ToCryptoKey(encryption.key)
    
    // Convert nonce and tag from base64
    const iv = base64ToArrayBuffer(encryption.nonce)
    const tag = base64ToArrayBuffer(encryption.tag)

    // Reconstruct the full encrypted data (ciphertext + tag)
    const fullEncryptedData = new Uint8Array(encryptedData.byteLength + tag.byteLength)
    fullEncryptedData.set(new Uint8Array(encryptedData), 0)
    fullEncryptedData.set(new Uint8Array(tag), encryptedData.byteLength)

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH,
      },
      key,
      fullEncryptedData
    )

    // Verify integrity by checking digest
    const digestBuffer = await crypto.subtle.digest('SHA-256', decryptedData)
    const computedDigest = arrayBufferToBase64(digestBuffer)

    return {
      decryptedData,
      isValid: computedDigest === expectedDigest,
    }
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate SHA-256 digest for data integrity
 * 
 * @param data - The data to hash
 * @returns Base64 encoded SHA-256 digest
 */
export async function generateDigest(data: ArrayBuffer): Promise<string> {
  try {
    const digestBuffer = await crypto.subtle.digest('SHA-256', data)
    return arrayBufferToBase64(digestBuffer)
  } catch (error) {
    throw new Error(`Digest generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate attachment encryption parameters
 * 
 * @param encryption - The encryption parameters to validate
 * @returns True if valid, throws error if invalid
 */
export function validateEncryption(encryption: AttachmentEncryption): boolean {
  if (encryption.algorithm !== 'AES-256-GCM') {
    throw new Error('Unsupported encryption algorithm')
  }

  if (!encryption.key || !encryption.nonce || !encryption.tag) {
    throw new Error('Missing encryption parameters')
  }

  try {
    // Validate base64 encoding
    base64ToArrayBuffer(encryption.key)
    base64ToArrayBuffer(encryption.nonce)
    base64ToArrayBuffer(encryption.tag)
  } catch (error) {
    throw new Error('Invalid base64 encoding in encryption parameters')
  }

  return true
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Validate file type and size
 */
export interface ValidationResult {
  readonly isValid: boolean
  readonly error?: string
}

export function validateAttachment(file: File): ValidationResult {
  // Size limits (10MB for images, 50MB for videos, 100MB for documents)
  const sizeLimits = {
    'image/': 10 * 1024 * 1024, // 10MB
    'video/': 50 * 1024 * 1024, // 50MB
    'audio/': 25 * 1024 * 1024, // 25MB
    'default': 100 * 1024 * 1024, // 100MB
  }

  const mimeType = file.type
  const sizeLimit = Object.entries(sizeLimits).find(([prefix]) => 
    mimeType.startsWith(prefix)
  )?.[1] || sizeLimits.default

  if (file.size > sizeLimit) {
    return {
      isValid: false,
      error: `File size exceeds limit of ${formatFileSize(sizeLimit)}`,
    }
  }

  // MIME type allowlist
  const allowedTypes = [
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
  ]

  if (!allowedTypes.includes(mimeType)) {
    return {
      isValid: false,
      error: `File type ${mimeType} is not supported`,
    }
  }

  return { isValid: true }
}

export default {
  encryptAttachment,
  decryptAttachment,
  generateDigest,
  validateEncryption,
  formatFileSize,
  validateAttachment,
}

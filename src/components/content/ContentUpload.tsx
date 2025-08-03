/**
 * Content Upload Form Component
 * File: src/components/content/ContentUploadForm.tsx
 * 
 * This component represents the foundation of your content economy ecosystem.
 * It handles the complete content creation workflow from file upload through
 * real IPFS integration to blockchain registration, demonstrating how our 
 * sophisticated architectural layers enable complex real-world functionality.
 * 
 * Key Features:
 * - Real IPFS upload with progress tracking using XMLHttpRequest
 * - Multi-step workflow with clear progress indication
 * - File validation and IPFS upload management
 * - Rich metadata input with real-time validation
 * - Pricing configuration with creator guidance
 * - Seamless integration with smart contract registration
 * - Comprehensive error handling and recovery options
 * - Responsive design optimized for creator workflows
 * - Optimized to prevent infinite re-render loops
 * 
 * This component showcases how complex Web3 operations can be transformed
 * into intuitive form-based experiences that feel familiar to creators from
 * traditional content platforms while providing blockchain-specific benefits.
 */

'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Tag,
  Lock,
  Globe,
  X,
  Plus,
  Info,
  Wifi,
  WifiOff
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Import our UI integration hooks and utilities
import { useContentPublishingUI } from '@/hooks/ui/integration'
import { TransactionStatusModal } from '@/components/web3/TransactionStatus'
import { ContentCategory, categoryToString } from '@/types/contracts'

// ===== REAL IPFS INTEGRATION WITH PROGRESS TRACKING =====

/**
 * Uploads a file to IPFS using the Pinata service with real progress tracking.
 * @param file The file to upload
 * @param onProgress Callback to report upload progress
 * @returns Promise resolving to the IPFS hash and gateway URL or an error
 */
async function uploadToIPFS(file: File, onProgress?: (progress: number) => void): Promise<{ hash: string; error?: string; gateway?: string }> {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting real IPFS upload via Pinata for file:', file.name, 'Size:', file.size)
    
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/ipfs/upload', true)
    
    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100
        console.log(`📈 Upload progress: ${percentComplete.toFixed(2)}%`)
        onProgress?.(percentComplete)
      }
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          console.log('✅ IPFS upload successful:', result)
          
          if (result.success && result.hash) {
            if (!validateIPFSHashFormat(result.hash)) {
              reject(new Error('IPFS service returned invalid hash format'))
            } else {
              resolve({ hash: result.hash, gateway: result.gateway })
            }
          } else {
            reject(new Error('Invalid response from IPFS service'))
          }
        } catch (parseError) {
          console.error('❌ Failed to parse IPFS response:', parseError)
          reject(new Error('Failed to parse response from IPFS service'))
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText)
          console.error('❌ IPFS API error response:', errorData)
          reject(new Error(errorData.details || errorData.error || `Upload failed: ${xhr.status}`))
        } catch {
          console.error('❌ IPFS upload failed:', xhr.statusText)
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
        }
      }
    }
    
    xhr.onerror = () => {
      console.error('💥 Network error during upload')
      reject(new Error('Network error during upload'))
    }
    
    const formData = new FormData()
    formData.append('file', file)
    xhr.send(formData)
  })
}

/**
 * Validates the IPFS hash format to ensure it's either CID v0 or v1.
 * @param hash The IPFS hash to validate
 * @returns True if the hash is valid, false otherwise
 */
function validateIPFSHashFormat(hash: string): boolean {
  if (!hash || hash.length < 10) return false
  
  // CID v0 (Qm... format, 46 characters)
  if (hash.startsWith('Qm') && hash.length === 46) {
    const base58Pattern = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/
    return base58Pattern.test(hash)
  }
  
  // CID v1 (baf..., bae..., etc., 32+ characters)
  const cidV1Prefixes = ['baf', 'bae', 'bag', 'bah', 'bai', 'baj']
  const hasValidPrefix = cidV1Prefixes.some(prefix => hash.startsWith(prefix))
  if (hasValidPrefix && hash.length >= 32) {
    return /^[a-z2-7]+$/.test(hash) // Base32 encoding validation
  }
  
  return false
}

// ===== ENHANCED FORM VALIDATION =====

interface ContentFormData {
  title: string
  description: string
  category: ContentCategory | null
  price: string
  tags: string[]
  accessType: 'free' | 'premium'
  file: File | null
  ipfsHash: string
  ipfsGateway: string
}

interface ValidationErrors {
  title?: string
  description?: string
  category?: string
  price?: string
  tags?: string
  file?: string
  ipfsHash?: string
}

/**
 * Validates the form data against smart contract constraints and requirements.
 * @param formData The content form data to validate
 * @returns An object containing validation errors, if any
 */
function validateFormData(formData: ContentFormData): ValidationErrors {
  const errors: ValidationErrors = {}
  
  // Title validation
  if (!formData.title.trim()) {
    errors.title = 'Title is required'
  } else if (formData.title.length > 200) {
    errors.title = 'Title must be less than 200 characters (smart contract limit)'
  }
  
  // Description validation
  if (!formData.description.trim()) {
    errors.description = 'Description is required'
  } else if (formData.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters (smart contract limit)'
  }
  
  // Category validation
  if (!formData.category) {
    errors.category = 'Category is required'
  }
  
  // Price validation for premium content
  if (formData.accessType === 'premium') {
    const priceNum = parseFloat(formData.price)
    if (!formData.price || isNaN(priceNum)) {
      errors.price = 'Valid price is required'
    } else if (priceNum < 0.01) {
      errors.price = 'Minimum price is $0.01 (smart contract requirement)'
    } else if (priceNum > 50) {
      errors.price = 'Maximum price is $50.00 (smart contract limit)'
    }
  }
  
  // Tags validation
  if (formData.tags.length > 10) {
    errors.tags = 'Maximum 10 tags allowed (smart contract limit)'
  } else {
    for (const tag of formData.tags) {
      if (tag.length > 30) {
        errors.tags = 'Each tag must be 30 characters or less (smart contract limit)'
        break
      }
    }
  }
  
  // File and IPFS validation
  if (!formData.file && !formData.ipfsHash) {
    errors.file = 'Please select a file to upload'
  } else if (formData.ipfsHash && !validateIPFSHashFormat(formData.ipfsHash)) {
    errors.ipfsHash = 'Invalid IPFS hash format'
  }
  
  return errors
}

// ===== MAIN COMPONENT =====

interface ContentUploadFormProps {
  userAddress?: string
  onSuccess?: (contentId: bigint) => void
  onCancel?: () => void
  variant?: 'modal' | 'page'
  className?: string
}

export function ContentUploadForm({
  userAddress,
  onSuccess,
  onCancel,
  variant = 'page',
  className
}: ContentUploadFormProps) {
  const publishingUI = useContentPublishingUI(userAddress as `0x${string}` | undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Form state management
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    category: null,
    price: '1.00',
    tags: [],
    accessType: 'premium',
    file: null,
    ipfsHash: '',
    ipfsGateway: ''
  })
  
  // UI state management
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')
  
  // Memoized values to prevent unnecessary re-renders
  const publishedContentId = useMemo(() => publishingUI.publishedContentId, [publishingUI.publishedContentId])
  const isProcessing = useMemo(() => publishingUI.publishingActions.isProcessing, [publishingUI.publishingActions.isProcessing])
  
  // Stable callback for onSuccess
  const stableOnSuccess = useCallback((contentId: bigint) => {
    onSuccess?.(contentId)
  }, [onSuccess])
  
  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online')
    const handleOffline = () => setNetworkStatus('offline')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Handle successful content publication
  useEffect(() => {
    if (publishedContentId) {
      console.log('🎉 Content published successfully:', publishedContentId)
      stableOnSuccess(publishedContentId)
      // Reset form on successful publication
      setFormData({
        title: '',
        description: '',
        category: null,
        price: '1.00',
        tags: [],
        accessType: 'premium',
        file: null,
        ipfsHash: '',
        ipfsGateway: ''
      })
      setUploadStatus('idle')
      setShowTransactionModal(false)
    }
  }, [publishedContentId, stableOnSuccess])
  
  // Show transaction modal during registration
  useEffect(() => {
    if (isProcessing && !showTransactionModal) {
      setShowTransactionModal(true)
    }
  }, [isProcessing, showTransactionModal])
  
  // ===== EVENT HANDLERS =====
  
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    console.log('📁 File selected:', file.name, 'Type:', file.type, 'Size:', file.size)
    
    // Reset previous state
    setValidationErrors(prev => ({ ...prev, file: undefined, ipfsHash: undefined }))
    setUploadStatus('idle')
    setUploadProgress(0)
    
    // File size validation (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setValidationErrors(prev => ({
        ...prev,
        file: 'File size must be less than 50MB'
      }))
      return
    }
    
    // File type validation
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav',
      'application/pdf', 'text/plain', 'text/markdown'
    ]
    if (!allowedTypes.includes(file.type)) {
      setValidationErrors(prev => ({
        ...prev,
        file: `File type "${file.type}" not supported. Please use images, videos, audio, or documents.`
      }))
      return
    }
    
    // Check network status
    if (networkStatus === 'offline') {
      setValidationErrors(prev => ({
        ...prev,
        file: 'No internet connection. Please check your network and try again.'
      }))
      return
    }
    
    // Start upload
    setFormData(prev => ({ ...prev, file, ipfsHash: '', ipfsGateway: '' }))
    setIsUploading(true)
    setUploadStatus('uploading')
    
    try {
      const uploadResult = await uploadToIPFS(file, (progress) => {
        setUploadProgress(progress)
      })
      
      if (uploadResult.error) {
        console.error('❌ Upload failed:', uploadResult.error)
        setValidationErrors(prev => ({
          ...prev,
          file: uploadResult.error
        }))
        setFormData(prev => ({ ...prev, file: null }))
        setUploadStatus('error')
      } else {
        console.log('✅ Upload successful, hash:', uploadResult.hash)
        setFormData(prev => ({ 
          ...prev, 
          ipfsHash: uploadResult.hash,
          ipfsGateway: uploadResult.gateway || ''
        }))
        setUploadStatus('success')
      }
    } catch (error) {
      console.error('💥 Upload error:', error)
      setValidationErrors(prev => ({
        ...prev,
        file: error instanceof Error ? error.message : 'Upload failed. Please try again.'
      }))
      setFormData(prev => ({ ...prev, file: null }))
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }, [networkStatus])
  
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput('')
    }
  }, [tagInput, formData.tags])
  
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])
  
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    
    console.log('📝 Form submission started with data:', formData)
    
    const errors = validateFormData(formData)
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      console.log('❌ Form validation failed:', errors)
      return
    }
    
    if (!publishingUI.canPublish) {
      console.log('❌ Cannot publish - creator requirements not met')
      return
    }
    
    try {
      const priceInWei = formData.accessType === 'premium' 
        ? BigInt(Math.round(parseFloat(formData.price) * 1e6)) // USDC has 6 decimals
        : BigInt(0)
      
      const publishData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        ipfsHash: formData.ipfsHash,
        category: formData.category!,
        payPerViewPrice: priceInWei,
        tags: formData.tags
      }
      
      console.log('🚀 Publishing content with data:', publishData)
      
      publishingUI.publishingActions.publishAction(publishData)
      setShowTransactionModal(true)
    } catch (error) {
      console.error('💥 Error preparing publish data:', error)
      setValidationErrors(prev => ({
        ...prev,
        price: 'Invalid price format'
      }))
    }
  }, [formData, publishingUI.canPublish, publishingUI.publishingActions])
  
  // Get file type icon
  const getFileIcon = useCallback((file: File | null) => {
    if (!file) return <File className="h-8 w-8" />
    
    if (file.type.startsWith('image/')) return <ImageIcon className="h-8 w-8" />
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8" />
    if (file.type.startsWith('audio/')) return <Music className="h-8 w-8" />
    if (file.type === 'application/pdf' || file.type.startsWith('text/')) return <FileText className="h-8 w-8" />
    
    return <File className="h-8 w-8" />
  }, [])
  
  // Handle drag and drop
  const [isDragging, setIsDragging] = useState(false)
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0 && fileInputRef.current) {
      fileInputRef.current.files = files
      handleFileSelect({ target: { files } } as React.ChangeEvent<HTMLInputElement>)
    }
  }, [handleFileSelect])
  
  // ===== RENDER =====
  
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Creator Requirements Check */}
      {!publishingUI.canPublish && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {publishingUI.creatorRequirements.registrationText}
          </AlertDescription>
        </Alert>
      )}
      
      {/* File Upload Section */}
      <div className="space-y-4">
        <Label htmlFor="file-upload">Content File</Label>
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            isDragging && 'border-primary bg-primary/5',
            uploadStatus === 'error' && 'border-red-500',
            uploadStatus === 'success' && 'border-green-500',
            'hover:border-primary hover:bg-primary/5'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            accept=".txt,.md,.pdf,.jpg,.jpeg,.png,.gif,.mp4,.webm,.mp3,.wav"
            className="hidden"
            disabled={isUploading}
          />
          
          {uploadStatus === 'idle' && (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">Drop your file here or click to browse</p>
                <p className="text-sm text-muted-foreground">
                  Supports documents, images, videos, and audio files up to 50MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || networkStatus === 'offline'}
              >
                {networkStatus === 'offline' ? (
                  <>
                    <WifiOff className="h-4 w-4 mr-2" />
                    Offline
                  </>
                ) : (
                  'Choose File'
                )}
              </Button>
            </div>
          )}
          
          {uploadStatus === 'uploading' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <div>
                <p className="text-lg font-medium">Uploading to IPFS...</p>
                <Progress value={uploadProgress} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.round(uploadProgress)}% complete
                </p>
              </div>
            </div>
          )}
          
          {uploadStatus === 'success' && formData.file && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                {getFileIcon(formData.file)}
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-medium text-green-700">{formData.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  Successfully uploaded to IPFS
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Hash: {formData.ipfsHash.slice(0, 20)}...
                </p>
                {formData.ipfsGateway && (
                  <a
                    href={formData.ipfsGateway}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View on IPFS Gateway
                  </a>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(prev => ({ ...prev, file: null, ipfsHash: '', ipfsGateway: '' }))
                  setUploadStatus('idle')
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Remove File
              </Button>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <div>
                <p className="text-lg font-medium text-red-700">Upload Failed</p>
                <p className="text-sm text-muted-foreground">
                  {validationErrors.file || 'Please try again'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUploadStatus('idle')
                  setValidationErrors(prev => ({ ...prev, file: undefined }))
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
        {validationErrors.file && (
          <p className="text-sm text-red-500">{validationErrors.file}</p>
        )}
      </div>
      
      {/* Content Metadata Section */}
      {uploadStatus === 'success' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-medium">Content Details</h3>
          </div>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="tags">Tags & Category</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter content title"
                  className={cn(validationErrors.title && 'border-red-500')}
                  maxLength={200}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{validationErrors.title && (
                    <span className="text-red-500">{validationErrors.title}</span>
                  )}</span>
                  <span>{formData.title.length}/200</span>
                </div>
              </div>
              
              {/* Description Input */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your content..."
                  rows={4}
                  className={cn(validationErrors.description && 'border-red-500')}
                  maxLength={1000}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{validationErrors.description && (
                    <span className="text-red-500">{validationErrors.description}</span>
                  )}</span>
                  <span>{formData.description.length}/1000</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="pricing" className="space-y-4">
              {/* Access Type Selection */}
              <div className="space-y-3">
                <Label>Access Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={formData.accessType === 'free' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, accessType: 'free' }))}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="text-sm">Free</span>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.accessType === 'premium' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, accessType: 'premium' }))}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="text-sm">Pay-per-view</span>
                  </Button>
                </div>
              </div>
              
              {/* Price Input for Premium Content */}
              {formData.accessType === 'premium' && (
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USDC)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="50"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="1.00"
                      className={cn('pl-9', validationErrors.price && 'border-red-500')}
                    />
                  </div>
                  {validationErrors.price && (
                    <p className="text-sm text-red-500">{validationErrors.price}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Price range: $0.01 - $50.00
                  </p>
                </div>
              )}
              
              {/* Access Type Information */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {formData.accessType === 'free' && 'Free content is accessible to all users without payment.'}
                  {formData.accessType === 'premium' && 'Pay-per-view content requires a one-time purchase for permanent access.'}
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="tags" className="space-y-4">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category?.toString() || ''}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    category: parseInt(value) as ContentCategory 
                  }))}
                >
                  <SelectTrigger className={cn(validationErrors.category && 'border-red-500')}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ContentCategory)
                      .filter(value => typeof value === 'number')
                      .map((category) => (
                        <SelectItem key={category} value={category.toString()}>
                          {categoryToString(category as ContentCategory)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {validationErrors.category && (
                  <p className="text-sm text-red-500">{validationErrors.category}</p>
                )}
              </div>
              
              {/* Tags Input */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tags to help users discover your content"
                    disabled={formData.tags.length >= 10}
                    maxLength={30}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || formData.tags.length >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.tags.length}/10 tags
                </p>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTag(tag)}
                          className="h-4 w-4 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                {validationErrors.tags && (
                  <p className="text-sm text-red-500">{validationErrors.tags}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isUploading || isProcessing}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={
            uploadStatus !== 'success' || 
            isUploading || 
            isProcessing ||
            networkStatus === 'offline'
          }
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Content'
          )}
        </Button>
      </div>
    </form>
  )
  
  // Render based on variant
  return (
    <>
      {variant === 'modal' ? (
        <Card className={cn('max-w-4xl mx-auto', className)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Content
              {networkStatus === 'offline' && (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              {networkStatus === 'online' && isUploading && (
                <Wifi className="h-4 w-4 text-blue-500 animate-pulse" />
              )}
            </CardTitle>
            <CardDescription>
              Share your content with the world and start earning
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formContent}
          </CardContent>
        </Card>
      ) : (
        <div className={cn('max-w-4xl mx-auto p-6', className)}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Content
              {networkStatus === 'offline' && (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              {networkStatus === 'online' && isUploading && (
                <Wifi className="h-4 w-4 text-blue-500 animate-pulse" />
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              Share your content with the world and start earning
            </p>
          </div>
          {formContent}
        </div>
      )}
      
      <TransactionStatusModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transactionStatus={publishingUI.transactionStatus}
      />
    </>
  )
}

/**
 * Usage Examples and Integration Patterns
 * 
 * // Basic usage for content creation page
 * <ContentUploadForm
 *   userAddress={userAddress}
 *   onSuccess={(contentId) => {
 *     router.push(`/content/${contentId}`)
 *     toast.success('Content published successfully!')
 *   }}
 * />
 * 
 * // Modal variant for quick upload
 * <ContentUploadForm
 *   userAddress={userAddress}
 *   variant="modal"
 *   onSuccess={(contentId) => {
 *     setShowUploadModal(false)
 *     refreshContentList()
 *   }}
 *   onCancel={() => setShowUploadModal(false)}
 * />
 * 
 * // Integration with creator dashboard
 * <ContentUploadForm
 *   userAddress={userAddress}
 *   onSuccess={(contentId) => {
 *     analytics.track('Content Published', { contentId })
 *     updateCreatorStats()
 *   }}
 * />
 */
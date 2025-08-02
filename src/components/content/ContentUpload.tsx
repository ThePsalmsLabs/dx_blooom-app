/**
 * Content Upload Form Component
 * File: src/components/content/ContentUploadForm.tsx
 * 
 * This component represents the foundation of your content economy ecosystem.
 * It handles the complete content creation workflow from file upload through
 * IPFS integration to blockchain registration, demonstrating how our sophisticated
 * architectural layers enable complex real-world functionality.
 * 
 * Key Features:
 * - Multi-step workflow with clear progress indication
 * - File validation and IPFS upload management
 * - Rich metadata input with real-time validation
 * - Pricing configuration with creator guidance
 * - Seamless integration with smart contract registration
 * - Comprehensive error handling and recovery options
 * - Responsive design optimized for creator workflows
 * 
 * This component showcases how complex Web3 operations can be transformed
 * into intuitive form-based experiences that feel familiar to creators from
 * traditional content platforms while providing blockchain-specific benefits.
 */

'use client'

import React, { useState, useCallback, useRef } from 'react'
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
  Eye,
  Lock,
  Globe,
  ArrowRight,
  X,
  Plus,
  Info
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { validatePrice, formatCurrency, parseDecimalToBigInt } from '@/lib/utils'
import { ContentCategory, categoryToString } from '@/types/contracts'

// ===== ENHANCED IPFS INTEGRATION =====

/**
 * Enhanced IPFS upload with proper error handling and validation
 * This function now supports both CID v0 and v1 formats
 */
async function uploadToIPFS(file: File): Promise<{ hash: string; error?: string }> {
  try {
    console.log('Starting IPFS upload for file:', file.name, 'Size:', file.size)
    
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', file)
    
    // Upload to your IPFS endpoint (adjust URL as needed)
    const response = await fetch('/api/ipfs/upload', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('IPFS API error response:', errorText)
      throw new Error(`IPFS upload failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('IPFS upload successful:', result)
    
    // Validate the returned hash
    if (!result.hash || result.hash.length < 10) {
      throw new Error('Invalid IPFS hash returned from server')
    }
    
    return { hash: result.hash }
  } catch (error) {
    console.error('IPFS upload error:', error)
    
    // If the API endpoint doesn't exist, provide a helpful error message
    if (error instanceof Error && error.message.includes('404')) {
      return { 
        hash: '', 
        error: 'IPFS upload service not configured. Please contact support.' 
      }
    }
    
    return { 
      hash: '', 
      error: error instanceof Error ? error.message : 'Unknown upload error' 
    }
  }
}

/**
 * File Upload Progress Interface
 * 
 * This interface tracks the multi-step upload process from file selection
 * through IPFS upload to blockchain registration, providing clear feedback
 * to creators about the status of their content submission.
 */
interface UploadProgress {
  readonly step: 'selecting' | 'validating' | 'uploading' | 'processing' | 'registering' | 'completed' | 'error'
  readonly percentage: number
  readonly message: string
  readonly canRetry: boolean
}

/**
 * Content Form Data Interface
 * 
 * This interface defines the complete set of metadata that creators provide
 * when uploading content, ensuring consistent data structure throughout
 * the upload process.
 */
interface ContentFormData {
  title: string
  description: string
  category: ContentCategory | null
  price: string
  tags: string[]
  accessType: 'public' | 'premium' | 'subscription'
  file: File | null
  ipfsHash: string
}

// ===== ENHANCED FORM VALIDATION =====

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
 * Comprehensive form validation with detailed error messages
 */
function validateFormData(formData: ContentFormData): ValidationErrors {
  const errors: ValidationErrors = {}
  
  // Title validation
  if (!formData.title.trim()) {
    errors.title = 'Title is required'
  } else if (formData.title.length > 200) {
    errors.title = 'Title must be less than 200 characters'
  }
  
  // Description validation
  if (!formData.description.trim()) {
    errors.description = 'Description is required'
  } else if (formData.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters'
  }
  
  // Category validation
  if (formData.category === null) {
    errors.category = 'Please select a content category'
  }
  
  // Price validation with proper parsing (only for premium content)
  if (formData.accessType === 'premium') {
    const priceNum = parseFloat(formData.price)
    if (!formData.price || isNaN(priceNum)) {
      errors.price = 'Valid price is required'
    } else if (priceNum < 0.01) {
      errors.price = 'Minimum price is $0.01'
    } else if (priceNum > 50) {
      errors.price = 'Maximum price is $50.00 (smart contract limit)'
    }
  }
  
  // Tags validation
  if (formData.tags.length > 10) {
    errors.tags = 'Maximum 10 tags allowed'
  }
  
  // File and IPFS validation
  if (!formData.file && !formData.ipfsHash) {
    errors.file = 'Please select a file to upload'
  }
  
  return errors
}

/**
 * Props interface for the ContentUploadForm component
 */
interface ContentUploadFormProps {
  /** Address of the creator uploading content */
  userAddress?: string
  /** Optional callback when content is successfully uploaded */
  onSuccess?: (contentId: bigint) => void
  /** Optional callback when user cancels the upload */
  onCancel?: () => void
  /** Whether to show in modal or inline layout */
  variant?: 'modal' | 'page'
  /** Optional custom styling */
  className?: string
}

/**
 * ContentUploadForm Component
 * 
 * This component demonstrates how our architectural layers enable sophisticated
 * file upload workflows that feel native to creators while handling complex
 * blockchain operations behind the scenes. The form guides creators through
 * content upload with clear validation, progress feedback, and error recovery.
 */
export function ContentUploadForm({
  userAddress,
  onSuccess,
  onCancel,
  variant = 'page',
  className
}: ContentUploadFormProps) {
  // Form state management
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    category: null,
    price: '1.00',
    tags: [],
    accessType: 'premium',
    file: null,
    ipfsHash: ''
  })

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    step: 'selecting',
    percentage: 0,
    message: 'Select a file to get started',
    canRetry: false
  })

  // UI state management
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isUploading, setIsUploading] = useState(false)

  // File input reference for programmatic access
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get publishing workflow from our UI integration hook
  const publishingUI = useContentPublishingUI(userAddress as `0x${string}` | undefined)

  // Handle successful content publication
  React.useEffect(() => {
    if (publishingUI.currentStepText === 'completed' && onSuccess) {
      // In a real implementation, you would get the content ID from the transaction
      onSuccess(BigInt(1)) // Placeholder content ID
    }
  }, [publishingUI.currentStepText, onSuccess])

  // Show transaction modal when registration is in progress
  React.useEffect(() => {
    const isProcessing = publishingUI.publishingActions.isProcessing
    if (isProcessing && !showTransactionModal) {
      setShowTransactionModal(true)
    }
  }, [publishingUI.publishingActions.isProcessing, showTransactionModal])

  // Handle file selection and validation with enhanced IPFS integration
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('File selected:', file.name, 'Type:', file.type, 'Size:', file.size)

    // Reset previous upload state
    setUploadProgress({
      step: 'validating',
      percentage: 0,
      message: 'Validating file...',
      canRetry: false
    })

    // File validation
    const maxSize = 50 * 1024 * 1024 // 50MB limit
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav'
    ]

    if (file.size > maxSize) {
      setUploadProgress({
        step: 'error',
        percentage: 0,
        message: 'File size must be less than 50MB',
        canRetry: true
      })
      setValidationErrors(prev => ({
        ...prev,
        file: 'File size must be less than 50MB'
      }))
      return
    }

    if (!allowedTypes.includes(file.type)) {
      setUploadProgress({
        step: 'error',
        percentage: 0,
        message: 'File type not supported',
        canRetry: true
      })
      setValidationErrors(prev => ({
        ...prev,
        file: 'File type not supported'
      }))
      return
    }

    setFormData(prev => ({ ...prev, file, ipfsHash: '' }))
    setValidationErrors(prev => ({ ...prev, file: undefined, ipfsHash: undefined }))

    // Start IPFS upload
    setIsUploading(true)
    setUploadProgress({
      step: 'uploading',
      percentage: 0,
      message: 'Uploading to IPFS...',
      canRetry: false
    })

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => ({
        ...prev,
        percentage: Math.min(prev.percentage + 10, 90)
      }))
    }, 200)

    try {
      const uploadResult = await uploadToIPFS(file)
      clearInterval(progressInterval)
      
      if (uploadResult.error) {
        console.error('IPFS upload failed:', uploadResult.error)
        setUploadProgress({
          step: 'error',
          percentage: 0,
          message: uploadResult.error,
          canRetry: true
        })
        setValidationErrors(prev => ({
          ...prev,
          file: uploadResult.error
        }))
        setFormData(prev => ({ ...prev, file: null }))
      } else {
        console.log('IPFS upload successful, hash:', uploadResult.hash)
        setFormData(prev => ({ ...prev, ipfsHash: uploadResult.hash }))
        setUploadProgress({
          step: 'completed',
          percentage: 100,
          message: 'Upload complete! Processing metadata...',
          canRetry: false
        })
      }
    } catch (error) {
      clearInterval(progressInterval)
      console.error('Upload error:', error)
      
      let errorMessage = 'Upload failed. Please try again.'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setUploadProgress({
        step: 'error',
        percentage: 0,
        message: errorMessage,
        canRetry: true
      })
      setValidationErrors(prev => ({
        ...prev,
        file: errorMessage
      }))
      setFormData(prev => ({ ...prev, file: null }))
    } finally {
      setIsUploading(false)
    }
  }, [])

  // Handle form submission with enhanced validation
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    
    console.log('Form submission started with data:', formData)
    
    // Validate form data using enhanced validation
    const errors = validateFormData(formData)
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      console.log('Form validation failed:', errors)
      return
    }

    if (!publishingUI.canPublish) {
      console.log('Cannot publish - creator requirements not met')
      return
    }

    try {
      setUploadProgress({
        step: 'registering',
        percentage: 0,
        message: 'Registering content on blockchain...',
        canRetry: false
      })

      // Convert price to BigInt format (only for premium content)
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

      console.log('Publishing content with data:', publishData)

      // Submit through our UI integration hook
      publishingUI.publishingActions.publishAction(publishData)

      setShowTransactionModal(true)

    } catch (error) {
      console.error('Error preparing publish data:', error)
      setUploadProgress({
        step: 'error',
        percentage: 0,
        message: 'Failed to register content. Please try again.',
        canRetry: true
      })
      setValidationErrors(prev => ({
        ...prev,
        price: 'Invalid price format'
      }))
    }
  }, [formData, publishingUI])

  // Handle adding tags
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setTagInput('')
    }
  }, [tagInput, formData.tags])

  // Handle removing tags
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // Handle retry file upload
  const handleRetryUpload = useCallback(() => {
    setUploadProgress({
      step: 'selecting',
      percentage: 0,
      message: 'Select a file to get started',
      canRetry: false
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setFormData(prev => ({ ...prev, file: null, ipfsHash: '' }))
    setValidationErrors(prev => ({ ...prev, file: undefined, ipfsHash: undefined }))
  }, [])

  // Get file type icon
  const getFileIcon = useCallback((file: File | null) => {
    if (!file) return <File className="h-8 w-8" />
    
    if (file.type.startsWith('image/')) return <ImageIcon className="h-8 w-8" />
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8" />
    if (file.type.startsWith('audio/')) return <Music className="h-8 w-8" />
    if (file.type === 'application/pdf' || file.type.startsWith('text/')) return <FileText className="h-8 w-8" />
    
    return <File className="h-8 w-8" />
  }, [])

  // Render the main form content
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
      <FileUploadSection
        uploadProgress={uploadProgress}
        formData={formData}
        fileInputRef={fileInputRef}
        onFileSelect={handleFileSelect}
        onRetryUpload={handleRetryUpload}
        getFileIcon={getFileIcon}
        validationErrors={validationErrors}
        isUploading={isUploading}
      />

      {/* Content Metadata Section */}
      {(uploadProgress.step === 'completed' || uploadProgress.step === 'registering') && (
        <ContentMetadataSection
          formData={formData}
          setFormData={setFormData}
          validationErrors={validationErrors}
          tagInput={tagInput}
          setTagInput={setTagInput}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />
      )}

      {/* Publishing Status */}
      {publishingUI.publishingActions.isProcessing && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Publishing content to blockchain...
          </AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <FormActionsSection
        canSubmit={uploadProgress.step === 'completed' && formData.ipfsHash !== '' && publishingUI.canPublish}
        isSubmitting={publishingUI.publishingActions.isProcessing}
        onCancel={onCancel}
      />
    </form>
  )

  // Render based on variant
  if (variant === 'modal') {
    return (
      <>
        <div className={cn('w-full max-w-2xl mx-auto', className)}>
          {formContent}
        </div>
        
        <TransactionStatusModal
          transactionStatus={publishingUI.transactionStatus}
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          transactionTitle="Content Registration"
          onSuccess={() => {
            setShowTransactionModal(false)
            if (onSuccess) onSuccess(BigInt(1))
          }}
        />
      </>
    )
  }

  return (
    <>
      <Card className={cn('w-full max-w-4xl mx-auto', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Content
          </CardTitle>
          <CardDescription>
            Share your content with the community and start earning from your work
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
      
      <TransactionStatusModal
        transactionStatus={publishingUI.transactionStatus}
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transactionTitle="Content Registration"
        onSuccess={() => {
          setShowTransactionModal(false)
          if (onSuccess) onSuccess(BigInt(1))
        }}
      />
    </>
  )
}

/**
 * File Upload Section Component
 * 
 * This section handles the file selection and upload process with visual
 * feedback and progress indication. It provides a drag-and-drop interface
 * that feels familiar to creators from other platforms.
 */
function FileUploadSection({
  uploadProgress,
  formData,
  fileInputRef,
  onFileSelect,
  onRetryUpload,
  getFileIcon,
  validationErrors,
  isUploading
}: {
  uploadProgress: UploadProgress
  formData: ContentFormData
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRetryUpload: () => void
  getFileIcon: (file: File | null) => React.ReactNode
  validationErrors: ValidationErrors
  isUploading: boolean
}) {
  const [isDragging, setIsDragging] = useState(false)

  // Handle drag and drop
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
      onFileSelect({ target: { files } } as any)
    }
  }, [fileInputRef, onFileSelect])

  return (
    <div className="space-y-4">
      <Label htmlFor="file-upload">Content File</Label>
      
      {/* File Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
          uploadProgress.step === 'error' && 'border-red-500',
          uploadProgress.step === 'completed' && 'border-green-500',
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
          onChange={onFileSelect}
          accept=".txt,.md,.pdf,.jpg,.jpeg,.png,.gif,.mp4,.webm,.mp3,.wav"
          className="hidden"
        />

        {uploadProgress.step === 'selecting' && (
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
            >
              Select File
            </Button>
          </div>
        )}

        {(uploadProgress.step === 'validating' || uploadProgress.step === 'uploading' || uploadProgress.step === 'processing') && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin" />
            <div>
              <p className="text-lg font-medium">{uploadProgress.message}</p>
              <Progress value={uploadProgress.percentage} className="mt-2" />
            </div>
          </div>
        )}

        {uploadProgress.step === 'completed' && formData.file && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              {getFileIcon(formData.file)}
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-green-700">Upload Complete!</p>
              <p className="text-sm text-muted-foreground">
                {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                IPFS Hash: {formData.ipfsHash.slice(0, 20)}...
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Different File
            </Button>
          </div>
        )}

        {uploadProgress.step === 'error' && (
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <p className="text-lg font-medium text-red-700">Upload Failed</p>
              <p className="text-sm text-muted-foreground">{uploadProgress.message}</p>
            </div>
            {uploadProgress.canRetry && (
              <Button
                type="button"
                variant="outline"
                onClick={onRetryUpload}
              >
                Try Again
              </Button>
            )}
          </div>
        )}
      </div>

      {validationErrors.file && (
        <p className="text-sm text-red-600">{validationErrors.file}</p>
      )}
    </div>
  )
}

/**
 * Content Metadata Section Component
 * 
 * This section handles all the content metadata input including title,
 * description, category, pricing, and tags. It provides real-time validation
 * and guidance to help creators optimize their content listings.
 */
function ContentMetadataSection({
  formData,
  setFormData,
  validationErrors,
  tagInput,
  setTagInput,
  onAddTag,
  onRemoveTag
}: {
  formData: ContentFormData
  setFormData: React.Dispatch<React.SetStateAction<ContentFormData>>
  validationErrors: ValidationErrors
  tagInput: string
  setTagInput: React.Dispatch<React.SetStateAction<string>>
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
}) {
  return (
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a compelling title for your content"
              className={cn(validationErrors.title && 'border-red-500')}
              maxLength={200}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{validationErrors.title && (
                <span className="text-red-600">{validationErrors.title}</span>
              )}</span>
              <span>{formData.title.length}/200</span>
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your content and what makes it valuable"
              rows={4}
              className={cn(validationErrors.description && 'border-red-500')}
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{validationErrors.description && (
                <span className="text-red-600">{validationErrors.description}</span>
              )}</span>
              <span>{formData.description.length}/1000</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          {/* Access Type Selection */}
          <div className="space-y-3">
            <Label>Access Type</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant={formData.accessType === 'public' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, accessType: 'public' }))}
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
              <Button
                type="button"
                variant={formData.accessType === 'subscription' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, accessType: 'subscription' }))}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <Lock className="h-5 w-5" />
                <span className="text-sm">Subscription</span>
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
                <p className="text-sm text-red-600">{validationErrors.price}</p>
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
              {formData.accessType === 'public' && 'Free content is accessible to all users without payment.'}
              {formData.accessType === 'premium' && 'Pay-per-view content requires a one-time purchase for permanent access.'}
              {formData.accessType === 'subscription' && 'Subscription content is available to your subscribers only.'}
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category?.toString() || ''}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                category: parseInt(value) as ContentCategory 
              }))}
            >
              <SelectTrigger className={cn(validationErrors.category && 'border-red-500')}>
                <SelectValue placeholder="Select a category" />
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
              <p className="text-sm text-red-600">{validationErrors.category}</p>
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
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
                placeholder="Add tags to help users discover your content"
                disabled={formData.tags.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                onClick={onAddTag}
                disabled={!tagInput.trim() || formData.tags.length >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.tags.length}/10 tags
            </p>
            
            {/* Tag Display */}
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
                      onClick={() => onRemoveTag(tag)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Form Actions Section Component
 * 
 * This section provides the submission and cancel actions with appropriate
 * state management and user feedback.
 */
function FormActionsSection({
  canSubmit,
  isSubmitting,
  onCancel
}: {
  canSubmit: boolean
  isSubmitting: boolean
  onCancel?: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Publishing Content...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Publish Content
          </>
        )}
      </Button>

      {onCancel && (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full"
        >
          Cancel
        </Button>
      )}
    </div>
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
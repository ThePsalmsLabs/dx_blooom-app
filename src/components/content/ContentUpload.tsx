/**
 * Content Upload Component - Streamlined Creator Experience
 *
 * A clean, intuitive upload interface inspired by modern social platforms.
 * Focuses on content creation simplicity while maintaining powerful backend functionality.
 * 
 * Key Features:
 * - Drag & drop upload with instant preview
 * - Progressive disclosure for metadata
 * - Smart categorization based on content type
 * - Mobile-first responsive design
 * - Seamless publishing workflow
 */

'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// Import our UI integration hooks and utilities
import { useContentPublishingUI } from '@/hooks/ui/integration'
import { TransactionStatusModal } from '@/components/web3/TransactionStatus'
import { ContentCategory } from '@/types/contracts'

// ===== STREAMLINED UPLOAD FUNCTION =====

async function uploadFile(file: File, onProgress?: (progress: number) => void): Promise<{ hash: string; error?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/ipfs/upload', true)
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100
        onProgress?.(percentComplete)
      }
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          if (result.success && result.hash) {
            resolve({ hash: result.hash })
          } else {
            reject(new Error('Upload failed'))
          }
        } catch {
          reject(new Error('Upload failed'))
        }
      } else {
        reject(new Error('Upload failed'))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    
    const formData = new FormData()
    formData.append('file', file)
    xhr.send(formData)
  })
}

// ===== CLEAN FORM INTERFACE =====

interface UploadData {
  title: string
  description: string
  price: string
  accessType: 'free' | 'premium'
  file: File | null
  hash: string
}

type UploadStep = 'upload' | 'details' | 'publish'

// ===== MAIN COMPONENT =====

interface ContentUploadProps {
  userAddress?: string
  onSuccess?: (contentId: bigint) => void
  onCancel?: () => void
  variant?: 'modal' | 'page'
  className?: string
}

export function ContentUpload({
  userAddress,
  onSuccess,
  onCancel,
  variant = 'page',
  className
}: ContentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const publishingUI = useContentPublishingUI(userAddress as `0x${string}` | undefined)
  
  // State management
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload')
  const [uploadData, setUploadData] = useState<UploadData>({
    title: '',
    description: '',
    price: '1.00',
    accessType: 'premium',
    file: null,
    hash: ''
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishStatus, setPublishStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [publishError, setPublishError] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    
    // Basic file validation
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB')
      return
    }
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const result = await uploadFile(file, (progress) => {
        setUploadProgress(progress)
      })
      
      setUploadData(prev => ({
        ...prev,
        file,
        hash: result.hash
      }))

      setCurrentStep('details')
    } catch (error) {
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [])
  
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
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  // Handle publishing
  const handlePublish = useCallback(() => {
    if (!uploadData.file || !uploadData.hash) {
      console.error('❌ Cannot publish: missing file or hash')
      setPublishStatus('error')
      setPublishError('File upload incomplete. Please try again.')
      return
    }

    if (!uploadData.title.trim()) {
      console.error('❌ Cannot publish: missing title')
      setPublishStatus('error')
      setPublishError('Title is required')
      return
    }

    // Reset previous states
    setPublishStatus('processing')
    setPublishError('')
    setIsPublishing(true)
    setShowTransactionModal(true)

    try {
      const priceInWei = uploadData.accessType === 'premium'
        ? BigInt(Math.round(parseFloat(uploadData.price) * 1e6))
        : BigInt(0)

      const publishData = {
        title: uploadData.title.trim(),
        description: uploadData.description.trim(),
        ipfsHash: uploadData.hash,
        category: 1 as ContentCategory, // Default category
        payPerViewPrice: priceInWei,
        tags: []
      }

      console.log('🚀 Publishing content:', {
        ...publishData,
        userAddress: userAddress,
        canPublish: publishingUI.canPublish,
        currentStep: publishingUI.currentStepText,
        transactionStatus: publishingUI.transactionStatus.status,
        isWalletConnected: !!userAddress
      })

      // Check if user can publish
      if (!publishingUI.canPublish) {
        console.error('❌ Cannot publish: user not eligible')
        setPublishStatus('error')
        setPublishError(publishingUI.creatorRequirements.registrationText)
        setIsPublishing(false)
        return
      }

      publishingUI.publishingActions.publishAction(publishData)
    } catch (error) {
      console.error('❌ Publish error:', error)
      setPublishStatus('error')
      setPublishError(error instanceof Error ? error.message : 'Failed to publish')
      setIsPublishing(false)
    }
  }, [uploadData, publishingUI, userAddress])

  // Monitor publishing workflow state changes
  useEffect(() => {
    // Access the transaction status and error message from the publishing UI
    const transactionStatus = publishingUI.transactionStatus.status
    const hasError = publishingUI.errorMessage !== null
    const isProcessing = publishingUI.publishingActions.isProcessing

    console.log('📊 Publishing status changed:', {
      transactionStatus,
      hasError,
      isProcessing,
      publishedId: publishingUI.publishedContentId,
      errorMessage: publishingUI.errorMessage
    })

    if (isProcessing || transactionStatus === 'submitting' || transactionStatus === 'confirming') {
      setPublishStatus('processing')
      setIsPublishing(true)
      setPublishError('')
    } else if (transactionStatus === 'confirmed' && publishingUI.publishedContentId) {
      setPublishStatus('success')
      setIsPublishing(false)
      setPublishError('')
      console.log('✅ Content published successfully:', publishingUI.publishedContentId)
      onSuccess?.(publishingUI.publishedContentId)
      // Auto-close modal after 3 seconds on success
      setTimeout(() => {
        setShowTransactionModal(false)
      }, 3000)
    } else if (transactionStatus === 'failed' || hasError) {
      setPublishStatus('error')
      setPublishError(publishingUI.errorMessage || publishingUI.transactionStatus.formattedStatus || 'Publishing failed')
      setIsPublishing(false)
    } else if (transactionStatus === 'idle') {
      setPublishStatus('idle')
      setPublishError('')
      setIsPublishing(false)
      setShowTransactionModal(false)
    }
  }, [
    publishingUI.transactionStatus.status,
    publishingUI.errorMessage,
    publishingUI.publishedContentId,
    publishingUI.publishingActions.isProcessing,
    publishingUI.transactionStatus.formattedStatus,
    onSuccess
  ])

  // Handle successful content publication
  useEffect(() => {
    if (publishingUI.publishedContentId) {
      console.log('🎉 Content published successfully:', publishingUI.publishedContentId)
      onSuccess?.(publishingUI.publishedContentId)
    }
  }, [publishingUI.publishedContentId, onSuccess])

  // Get file preview icon
  const getFileIcon = useCallback((file: File | null) => {
    if (!file) return <Upload className="h-8 w-8" />

    if (file.type.startsWith('image/')) return <ImageIcon className="h-8 w-8" />
    if (file.type.startsWith('video/')) return <Video className="h-8 w-8" />
    return <FileText className="h-8 w-8" />
  }, [])
  
  // ===== RENDER =====
  
  const renderUploadStep = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Create new post</h2>
        <p className="text-muted-foreground">Share your content with the world</p>
      </div>

        <div
          className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer",
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50",
          "min-h-[300px] flex flex-col items-center justify-center"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
          accept="image/*,video/*,.pdf,.txt,.md"
          onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
          
        {isUploading ? (
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div className="space-y-2">
              <p className="font-medium">Uploading...</p>
              <Progress value={uploadProgress} className="w-48 mx-auto" />
              <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
            </div>
              </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Drag photos or videos here</p>
              <p className="text-sm text-muted-foreground">Or click to select files</p>
            </div>
            <Button variant="outline" className="rounded-full px-6">
              Select from computer
              </Button>
            </div>
          )}
        </div>
    </div>
  )

  const renderDetailsStep = () => (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep('upload')}
          className="p-2"
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">Details</span>
        <Button
          onClick={() => setCurrentStep('publish')}
          disabled={!uploadData.title.trim()}
          className="rounded-full px-4"
        >
          Next
        </Button>
      </div>
      
      {/* File Preview */}
      <div className="mb-6 p-4 bg-muted/50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center">
            {getFileIcon(uploadData.file)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{uploadData.file?.name}</p>
            <p className="text-sm text-muted-foreground">
              {(uploadData.file?.size || 0) < 1024 * 1024
                ? `${((uploadData.file?.size || 0) / 1024).toFixed(1)} KB`
                : `${((uploadData.file?.size || 0) / (1024 * 1024)).toFixed(1)} MB`
              }
            </p>
          </div>
        </div>
          </div>
          
      {/* Form Fields */}
      <div className="space-y-4">
        <div>
                <Input
            placeholder="Write a caption..."
            value={uploadData.title}
            onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
            className="border-0 px-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0 resize-none"
                  maxLength={200}
                />
          <div className="text-xs text-muted-foreground text-right mt-1">
            {uploadData.title.length}/200
                </div>
              </div>
              
                <Textarea
          placeholder="Add a description..."
          value={uploadData.description}
          onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
          className="border-0 px-0 placeholder:text-muted-foreground focus-visible:ring-0 resize-none"
                  rows={3}
          maxLength={500}
        />

        {/* Access Type Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
          <div>
            <p className="font-medium">Premium content</p>
            <p className="text-sm text-muted-foreground">Charge for access</p>
              </div>
                  <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadData(prev => ({
              ...prev,
              accessType: prev.accessType === 'free' ? 'premium' : 'free'
            }))}
            className="w-12 h-6 rounded-full bg-background border"
          >
            <div className={cn(
              "w-4 h-4 rounded-full transition-transform",
              uploadData.accessType === 'premium' ? "translate-x-6 bg-primary" : "translate-x-0 bg-muted-foreground"
            )} />
                  </Button>
              </div>
              
        {/* Price Input */}
        {uploadData.accessType === 'premium' && (
          <div className="flex items-center gap-2">
            <span className="text-lg">$</span>
                    <Input
                      type="number"
              placeholder="1.00"
              value={uploadData.price}
              onChange={(e) => setUploadData(prev => ({ ...prev, price: e.target.value }))}
              className="text-lg border-0 px-0 focus-visible:ring-0"
                      min="0.01"
                      max="50"
              step="0.01"
            />
            <span className="text-sm text-muted-foreground">USDC</span>
                </div>
                        )}
                      </div>
                    </div>
  )

    const renderPublishStep = () => (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep('details')}
          className="p-2"
          disabled={isPublishing}
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Button>
        <span className="text-sm font-medium">
          {publishStatus === 'processing' ? 'Publishing...' :
           publishStatus === 'success' ? 'Published!' :
           'Ready to publish'}
        </span>
        <div className="w-8" />
      </div>

      {/* Publishing Progress Indicator */}
      {publishStatus === 'processing' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Publishing your content...</span>
          </div>
          <div className="text-xs text-blue-600">
            {publishingUI.transactionStatus.progress.progressText || publishingUI.currentStepText || 'Processing...'}
          </div>
        </div>
      )}

      {/* Final Preview */}
      <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center">
              {getFileIcon(uploadData.file)}
                  </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{uploadData.file?.name}</p>
              </div>
        </div>

          {uploadData.title && (
            <p className="font-medium mb-2">{uploadData.title}</p>
          )}

          {uploadData.description && (
            <p className="text-sm text-muted-foreground mb-3">{uploadData.description}</p>
          )}

          {uploadData.accessType === 'premium' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              <Sparkles className="h-3 w-3" />
              ${uploadData.price} USDC
            </div>
          )}
        </div>

        {publishStatus === 'error' && publishError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium">❌ Publishing failed</p>
            <p className="text-sm text-red-500 mt-1">{publishError}</p>
          </div>
        )}

        {/* Creator Registration Warning */}
        {!publishingUI.canPublish && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800 font-medium">⚠️ Creator registration required</p>
            <p className="text-sm text-orange-700 mt-1">
              {publishingUI.creatorRequirements.registrationText}
            </p>
          </div>
        )}

        <Button
          onClick={handlePublish}
          disabled={isPublishing || publishStatus === 'success' || !publishingUI.canPublish}
          className="w-full rounded-full h-12 text-base font-medium"
        >
          {publishStatus === 'processing' && (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Publishing...
            </>
          )}
          {publishStatus === 'success' && (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Content Published!
            </>
          )}
          {publishStatus === 'error' && (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Try Again
            </>
          )}
          {publishStatus === 'idle' && (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Share content
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'upload':
        return renderUploadStep()
      case 'details':
        return renderDetailsStep()
      case 'publish':
        return renderPublishStep()
      default:
        return renderUploadStep()
    }
  }
  
  // Render based on variant
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {variant === 'modal' ? (
        <div className="p-6">
          {renderCurrentStep()}
        </div>
      ) : (
        <div className="container max-w-md mx-auto py-8 px-4">
          {renderCurrentStep()}
        </div>
      )}
      
      <TransactionStatusModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transactionStatus={publishingUI.transactionStatus}
        transactionTitle="Content Publishing"
        onSuccess={() => {
          console.log('Transaction completed successfully')
          setShowTransactionModal(false)
        }}
      />
    </div>
  )
}

// Export alias for backward compatibility
const ContentUploadForm = ContentUpload
export { ContentUploadForm }

/**
 * Usage Examples:
 * 
 * // Basic page usage
 * <ContentUpload
 *   userAddress={userAddress}
 *   onSuccess={(contentId) => router.push(`/content/${contentId}`)}
 * />
 * 
 * // Modal variant
 * <ContentUpload
 *   userAddress={userAddress}
 *   variant="modal"
 *   onSuccess={(contentId) => setShowModal(false)}
 * />
 */
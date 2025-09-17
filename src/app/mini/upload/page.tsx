/**
 * MiniApp Content Upload Page - Mobile Content Creation Hub
 * File: src/app/mini/upload/page.tsx
 *
 * This page provides creators with a mobile-optimized interface for uploading
 * and publishing content to the platform. Designed specifically for touch-first
 * content creation with streamlined workflows and instant publishing capabilities.
 *
 * Mini App Design Philosophy:
 * - Mobile-first content creation with touch-optimized inputs
 * - Streamlined upload process with progress tracking
 * - Instant publishing with smart monetization defaults
 * - Creator-focused design with clear monetization paths
 * - Efficient file handling optimized for mobile networks
 *
 * Key Features:
 * - Mobile-optimized file upload with drag & drop
 * - Content metadata editing with smart suggestions
 * - Pricing and monetization settings
 * - Category selection and tagging
 * - Real-time preview and validation
 * - Instant publishing with blockchain integration
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import {
  ArrowLeft,
  Upload as UploadIcon,
  FileText,
  Image,
  Video,
  Music,
  DollarSign,
  Tag,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Camera,
  File,
  Zap,
  Crown,
  Users,
  Target,
  Lightbulb,
  RefreshCw
} from 'lucide-react'

// Import your existing UI components
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  Separator,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import your existing business logic hooks
import { useFarcasterAutoWallet } from '@/hooks/miniapp/useFarcasterAutoWallet'
import { formatWalletAddress, isWalletFullyConnected, getSafeAddress } from '@/lib/utils/wallet-utils'
import { useMiniAppUtils } from '@/contexts/UnifiedMiniAppProvider'
import { useCreatorProfile } from '@/hooks/contracts/core'
import { useContentPublishingUI } from '@/hooks/ui/integration'

// Import your existing sophisticated components
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout'
import { ContentUploadForm } from '@/components/content/ContentUpload'

// Import utilities
import { formatCurrency } from '@/lib/utils'
import type { ContentCategory } from '@/types/contracts'
import { categoryToString } from '@/types/contracts'

/**
 * Upload Step Types
 */
type UploadStep = 'select' | 'details' | 'pricing' | 'publish'

/**
 * Upload State Interface
 */
interface UploadState {
  readonly currentStep: UploadStep
  readonly selectedFiles: File[]
  readonly title: string
  readonly description: string
  readonly category: ContentCategory | ''
  readonly price: string
  readonly tags: string[]
  readonly isUploading: boolean
  readonly uploadProgress: number
  readonly hash: string
}

/**
 * MiniApp Content Upload Core Component
 *
 * This component orchestrates the complete content upload experience
 * with mobile-first design and streamlined creator workflows.
 */
function MiniAppContentUploadCore() {
  const router = useRouter()

  // Core state management
  const [uploadState, setUploadState] = useState<UploadState>({
    currentStep: 'select',
    selectedFiles: [],
    title: '',
    description: '',
    category: '',
    price: '5.00',
    tags: [],
    isUploading: false,
    uploadProgress: 0,
    hash: ''
  })

  // Mini app context and hooks
  const miniAppUtils = useMiniAppUtils()
  const walletUI = useFarcasterAutoWallet()

  const userAddress = getSafeAddress(walletUI.address)
  const isConnected = isWalletFullyConnected(walletUI.isConnected, walletUI.address)

  // Creator verification
  const creatorProfile = useCreatorProfile(userAddress)

  /**
   * Step Navigation Handlers
   */
  const handleNextStep = useCallback(() => {
    setUploadState(prev => {
      const steps: UploadStep[] = ['select', 'details', 'pricing', 'publish']
      const currentIndex = steps.indexOf(prev.currentStep)
      const nextStep = steps[currentIndex + 1] || prev.currentStep
      return { ...prev, currentStep: nextStep }
    })
  }, [])

  const handlePrevStep = useCallback(() => {
    setUploadState(prev => {
      const steps: UploadStep[] = ['select', 'details', 'pricing', 'publish']
      const currentIndex = steps.indexOf(prev.currentStep)
      const prevStep = steps[currentIndex - 1] || prev.currentStep
      return { ...prev, currentStep: prevStep }
    })
  }, [])

  const handleGoToStep = useCallback((step: UploadStep) => {
    setUploadState(prev => ({ ...prev, currentStep: step }))
  }, [])

  /**
   * File Selection Handlers
   */
  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0] // For now, only handle single file upload
    
    // Basic file validation
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large! Please choose a file smaller than 50MB.')
      return
    }

    setUploadState(prev => ({
      ...prev,
      selectedFiles: [file],
      isUploading: true,
      uploadProgress: 0
    }))

    try {
      // Upload to IPFS
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      if (!result.success || !result.hash) {
        throw new Error('Invalid upload response')
      }

      setUploadState(prev => ({
        ...prev,
        hash: result.hash,
        isUploading: false,
        uploadProgress: 100
      }))

      // Auto-advance to next step after successful upload
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, currentStep: 'details' }))
      }, 500)

    } catch (error) {
      console.error('Upload failed:', error)
      alert('Oops! Something went wrong while preparing your content. Please try again.')
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        selectedFiles: []
      }))
    }
  }, [])

  const handleFileRemove = useCallback((index: number) => {
    setUploadState(prev => ({
      ...prev,
      selectedFiles: prev.selectedFiles.filter((_, i) => i !== index)
    }))
  }, [])

  /**
   * Form Input Handlers
   */
  const handleTitleChange = useCallback((title: string) => {
    setUploadState(prev => ({ ...prev, title }))
  }, [])

  const handleDescriptionChange = useCallback((description: string) => {
    setUploadState(prev => ({ ...prev, description }))
  }, [])

  const handleCategoryChange = useCallback((category: ContentCategory | '') => {
    setUploadState(prev => ({ ...prev, category }))
  }, [])

  const handlePriceChange = useCallback((price: string) => {
    setUploadState(prev => ({ ...prev, price }))
  }, [])

  const handleTagsChange = useCallback((tags: string[]) => {
    setUploadState(prev => ({ ...prev, tags }))
  }, [])

  /**
   * Upload Success Handler
   */
  const handleUploadSuccess = useCallback((contentId: bigint) => {
    // Mobile-optimized success feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]) // Success haptic pattern
    }

    // Show success message
    alert('🎉 Content published successfully! You\'ll be redirected to view your content.')

    // Redirect to content view
    setTimeout(() => {
      router.push(`/mini/content/${contentId}/view`)
    }, 1500)
  }, [router])

  /**
   * Navigation Handler
   */
  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  // Handle wallet connection requirement
  if (!isConnected || !userAddress) {
    return (
      <MiniAppLayout>
        <div className="text-center space-y-6 py-8">
          <div className="space-y-4">
            <UploadIcon className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground">
              Connect your wallet to upload content
            </p>
          </div>
          <Button onClick={() => router.push('/mini')}>
            Return to Home
          </Button>
        </div>
      </MiniAppLayout>
    )
  }

  // Handle creator verification
  if (creatorProfile.data && !creatorProfile.data.isRegistered && !creatorProfile.isLoading) {
    return (
      <MiniAppLayout>
        <div className="text-center space-y-6 py-8">
          <Crown className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Become a Creator</h1>
            <p className="text-muted-foreground">
              Register as a creator to upload content
            </p>
          </div>
          <Button onClick={() => router.push('/mini/onboard')}>
            Get Started
          </Button>
        </div>
      </MiniAppLayout>
    )
  }

  return (
    <MiniAppLayout>
      <div className="space-y-6">
        {/* Upload Header */}
        <UploadHeader
          onGoBack={handleGoBack}
          currentStep={uploadState.currentStep}
        />

        {/* Progress Indicator */}
        <UploadProgressIndicator
          currentStep={uploadState.currentStep}
          onStepClick={handleGoToStep}
        />

        {/* Upload Form Steps */}
        <UploadSteps
          uploadState={uploadState}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          onTitleChange={handleTitleChange}
          onDescriptionChange={handleDescriptionChange}
          onCategoryChange={handleCategoryChange}
          onPriceChange={handlePriceChange}
          onTagsChange={handleTagsChange}
          onNextStep={handleNextStep}
          onPrevStep={handlePrevStep}
          onUploadSuccess={handleUploadSuccess}
          userAddress={userAddress}
        />

        {/* Upload Tips */}
        <UploadTips />
      </div>
    </MiniAppLayout>
  )
}

/**
 * Upload Header Component
 *
 * Mobile-optimized header with navigation and step context
 */
function UploadHeader({
  onGoBack,
  currentStep
}: {
  onGoBack: () => void
  currentStep: UploadStep
}) {
  const getStepTitle = () => {
    switch (currentStep) {
      case 'select':
        return 'Select Content'
      case 'details':
        return 'Add Details'
      case 'pricing':
        return 'Set Pricing'
      case 'publish':
        return 'Publish Content'
      default:
        return 'Upload Content'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGoBack}
          className="flex items-center gap-2 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Button>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <UploadIcon className="h-6 w-6" />
          {getStepTitle()}
        </h1>
        <p className="text-muted-foreground text-sm">
          Share your content with the world and start earning
        </p>
      </div>
    </div>
  )
}

/**
 * Upload Progress Indicator
 *
 * Visual progress indicator for the upload steps
 */
function UploadProgressIndicator({
  currentStep,
  onStepClick
}: {
  currentStep: UploadStep
  onStepClick: (step: UploadStep) => void
}) {
  const steps: { id: UploadStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'select', label: 'Select', icon: UploadIcon },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'publish', label: 'Publish', icon: Zap }
  ]

  const currentIndex = steps.findIndex(step => step.id === currentStep)

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStepClick(step.id)}
                className={cn(
                  "h-10 w-10 rounded-full p-0",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/20 border-2 border-primary"
                )}
              >
                <step.icon className="h-4 w-4" />
              </Button>
              <span className={cn(
                "text-xs mt-1",
                isCurrent && "font-medium text-primary"
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 mt-[-20px]",
                isCompleted ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Upload Steps Component
 *
 * Multi-step upload form with mobile optimization
 */
function UploadSteps({
  uploadState,
  onFileSelect,
  onFileRemove,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onPriceChange,
  onTagsChange,
  onNextStep,
  onPrevStep,
  onUploadSuccess,
  userAddress
}: {
  uploadState: UploadState
  onFileSelect: (files: File[]) => void
  onFileRemove: (index: number) => void
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onCategoryChange: (category: ContentCategory | '') => void
  onPriceChange: (price: string) => void
  onTagsChange: (tags: string[]) => void
  onNextStep: () => void
  onPrevStep: () => void
  onUploadSuccess: (contentId: bigint) => void
  userAddress?: `0x${string}`
}) {
  switch (uploadState.currentStep) {
    case 'select':
      return (
        <FileSelectionStep
          selectedFiles={uploadState.selectedFiles}
          isUploading={uploadState.isUploading}
          uploadProgress={uploadState.uploadProgress}
          onFileSelect={onFileSelect}
          onFileRemove={onFileRemove}
          onNextStep={onNextStep}
        />
      )
    case 'details':
      return (
        <ContentDetailsStep
          title={uploadState.title}
          description={uploadState.description}
          category={uploadState.category}
          tags={uploadState.tags}
          onTitleChange={onTitleChange}
          onDescriptionChange={onDescriptionChange}
          onCategoryChange={onCategoryChange}
          onTagsChange={onTagsChange}
          onNextStep={onNextStep}
          onPrevStep={onPrevStep}
        />
      )
    case 'pricing':
      return (
        <PricingStep
          price={uploadState.price}
          onPriceChange={onPriceChange}
          onNextStep={onNextStep}
          onPrevStep={onPrevStep}
        />
      )
    case 'publish':
      return (
        <PublishStep
          uploadState={uploadState}
          onPrevStep={onPrevStep}
          onUploadSuccess={onUploadSuccess}
          userAddress={userAddress}
        />
      )
    default:
      return null
  }
}

/**
 * File Selection Step
 *
 * Mobile-optimized file selection with drag & drop
 */
function FileSelectionStep({
  selectedFiles,
  isUploading,
  uploadProgress,
  onFileSelect,
  onFileRemove,
  onNextStep
}: {
  selectedFiles: File[]
  isUploading: boolean
  uploadProgress: number
  onFileSelect: (files: File[]) => void
  onFileRemove: (index: number) => void
  onNextStep: () => void
}) {
  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    onFileSelect(files)
  }, [onFileSelect])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    onFileSelect(files)
  }, [onFileSelect])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Your Content</h3>
            <p className="text-muted-foreground mb-4">
              Drag & drop files here or click to browse
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <Camera className="h-4 w-4 mr-2" />
                  Photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </Button>

              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <Video className="h-4 w-4 mr-2" />
                  Videos
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </Button>

              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <File className="h-4 w-4 mr-2" />
                  Documents
                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                <span className="text-sm font-medium">Processing your content...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Almost ready! We're preparing your content for publishing.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Step Button */}
      <div className="flex justify-end">
        <Button
          onClick={onNextStep}
          disabled={selectedFiles.length === 0}
          className="w-full sm:w-auto"
        >
          Next: Add Details
        </Button>
      </div>
    </div>
  )
}

/**
 * Content Details Step
 *
 * Form for content metadata and categorization
 */
function ContentDetailsStep({
  title,
  description,
  category,
  tags,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onTagsChange,
  onNextStep,
  onPrevStep
}: {
  title: string
  description: string
  category: ContentCategory | ''
  tags: string[]
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onCategoryChange: (category: ContentCategory | '') => void
  onTagsChange: (tags: string[]) => void
  onNextStep: () => void
  onPrevStep: () => void
}) {
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onTagsChange([...tags, tagInput.trim()])
      setTagInput('')
    }
  }, [tagInput, tags, onTagsChange])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove))
  }, [tags, onTagsChange])

  const categories = [
    { value: '0', label: 'Article' },      // ContentCategory.ARTICLE = 0
    { value: '1', label: 'Video' },        // ContentCategory.VIDEO = 1
    { value: '2', label: 'Course' },       // ContentCategory.COURSE = 2
    { value: '3', label: 'Music' },        // ContentCategory.MUSIC = 3
    { value: '4', label: 'Podcast' }       // ContentCategory.PODCAST = 4
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter your content title..."
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your content..."
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category !== '' ? category.toString() : ''}
              onValueChange={(value) => onCategoryChange(value ? parseInt(value) as ContentCategory : '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrevStep} className="flex-1">
          Back
        </Button>
        <Button
          onClick={onNextStep}
          disabled={!title.trim() || !description.trim() || category === ''}
          className="flex-1"
        >
          Next: Set Pricing
        </Button>
      </div>
    </div>
  )
}

/**
 * Pricing Step
 *
 * Monetization settings with smart defaults
 */
function PricingStep({
  price,
  onPriceChange,
  onNextStep,
  onPrevStep
}: {
  price: string
  onPriceChange: (price: string) => void
  onNextStep: () => void
  onPrevStep: () => void
}) {
  const quickPrices = ['1.00', '5.00', '10.00', '25.00']

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Set Your Price
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a price that reflects the value of your content
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Price Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {quickPrices.map((quickPrice) => (
              <Button
                key={quickPrice}
                variant={price === quickPrice ? "default" : "outline"}
                onClick={() => onPriceChange(quickPrice)}
                className="h-12"
              >
                {formatCurrency(BigInt(Math.floor(parseFloat(quickPrice) * 1e6)), 6, 'USDC')}
              </Button>
            ))}
          </div>

          {/* Custom Price Input */}
          <div className="space-y-2">
            <Label htmlFor="custom-price">Custom Price (USDC)</Label>
            <Input
              id="custom-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
            />
          </div>

          {/* Price Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span>Your content price:</span>
              <span className="font-medium">
                {formatCurrency(BigInt(Math.floor(parseFloat(price || '0') * 1e6)), 6, 'USDC')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrevStep} className="flex-1">
          Back
        </Button>
        <Button onClick={onNextStep} className="flex-1">
          Next: Publish
        </Button>
      </div>
    </div>
  )
}

/**
 * Publish Step
 *
 * Final review and publishing interface
 */
function PublishStep({
  uploadState,
  onPrevStep,
  onUploadSuccess,
  userAddress
}: {
  uploadState: UploadState
  onPrevStep: () => void
  onUploadSuccess: (contentId: bigint) => void
  userAddress?: `0x${string}`
}) {
  return (
    <div className="space-y-4">
      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Review Your Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Title</Label>
              <p className="text-sm text-muted-foreground">{uploadState.title}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">{uploadState.description}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Category</Label>
              <Badge variant="secondary">
                {uploadState.category ? categoryToString(uploadState.category) : 'Not selected'}
              </Badge>
            </div>

            <div>
              <Label className="text-sm font-medium">Price</Label>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(BigInt(Math.floor(parseFloat(uploadState.price) * 1e6)), 6, 'USDC')}
              </p>
            </div>

            {uploadState.tags.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {uploadState.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Publishing Options */}
      <Card>
        <CardContent className="p-4">
          <PublishingInterface
            uploadState={uploadState}
            userAddress={userAddress}
            onSuccess={onUploadSuccess}
            onError={(error) => console.error('Publishing failed:', error)}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <Button variant="outline" onClick={onPrevStep} className="w-full">
        Back to Edit
      </Button>
    </div>
  )
}

/**
 * Publishing Interface Component
 *
 * Handles the final publishing step using collected upload data
 */
function PublishingInterface({
  uploadState,
  userAddress,
  onSuccess,
  onError
}: {
  uploadState: UploadState
  userAddress?: `0x${string}`
  onSuccess: (contentId: bigint) => void
  onError: (error: Error) => void
}) {
  const publishingUI = useContentPublishingUI(userAddress)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string>('')

  const handlePublish = useCallback(() => {
    // Validate required data
    if (!uploadState.selectedFiles.length || !uploadState.hash) {
      const error = new Error('Please select a file first before publishing.')
      onError(error)
      setPublishError(error.message)
      return
    }

    if (!uploadState.title.trim()) {
      const error = new Error('Title is required')
      onError(error)
      setPublishError(error.message)
      return
    }

    if (uploadState.category === '') {
      const error = new Error('Category selection is required')
      onError(error)
      setPublishError(error.message)
      return
    }

    // Reset previous states
    setPublishError('')
    setIsPublishing(true)

    try {
      const priceInWei = BigInt(Math.round(parseFloat(uploadState.price) * 1e6))

      const publishData = {
        title: uploadState.title.trim(),
        description: uploadState.description.trim(),
        ipfsHash: uploadState.hash,
        category: uploadState.category as ContentCategory,
        payPerViewPrice: priceInWei,
        tags: uploadState.tags
      }

      console.log('🚀 Publishing content with miniapp data:', {
        ...publishData,
        userAddress: userAddress,
        canPublish: publishingUI.canPublish,
        fileCount: uploadState.selectedFiles.length
      })

      // Check if user can publish
      if (!publishingUI.canPublish) {
        const error = new Error(publishingUI.creatorRequirements.registrationText)
        onError(error)
        setPublishError(error.message)
        setIsPublishing(false)
        return
      }

      publishingUI.publishingActions.publishAction(publishData)
    } catch (error) {
      console.error('❌ Publish error:', error)
      const publishError = error instanceof Error ? error : new Error('Failed to publish')
      onError(publishError)
      setPublishError(publishError.message)
      setIsPublishing(false)
    }
  }, [uploadState, publishingUI, userAddress, onError])

  // Monitor publishing progress
  useEffect(() => {
    const transactionStatus = publishingUI.transactionStatus.status
    const hasError = publishingUI.errorMessage !== null
    const isProcessing = publishingUI.publishingActions.isProcessing

    if (transactionStatus === 'confirmed' && publishingUI.publishedContentId) {
      setIsPublishing(false)
      setPublishError('')
      console.log('✅ Content published successfully:', publishingUI.publishedContentId)
      onSuccess(publishingUI.publishedContentId)
    } else if (transactionStatus === 'failed' || hasError) {
      const errorMsg = publishingUI.errorMessage || 'Publishing failed'
      setPublishError(errorMsg)
      setIsPublishing(false)
      onError(new Error(errorMsg))
    } else if (isProcessing || transactionStatus === 'submitting' || transactionStatus === 'confirming') {
      setIsPublishing(true)
      setPublishError('')
    }
  }, [
    publishingUI.transactionStatus.status,
    publishingUI.errorMessage,
    publishingUI.publishedContentId,
    publishingUI.publishingActions.isProcessing,
    onSuccess,
    onError
  ])

  return (
    <div className="space-y-4">
      {/* Publishing Status */}
      {isPublishing && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-green-600" />
            <span className="text-sm font-medium text-green-800">Publishing your content...</span>
          </div>
          <div className="text-xs text-green-600">
            Your content is being made available to your audience. This usually takes a few seconds.
          </div>
        </div>
      )}

      {/* Error Display */}
      {publishError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Unable to publish</p>
          <p className="text-sm text-red-500 mt-1">{publishError}</p>
        </div>
      )}

      {/* Creator Registration Warning */}
      {!publishingUI.canPublish && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800 font-medium">Almost there!</p>
          <p className="text-sm text-orange-700 mt-1">
            Please complete your creator profile to start publishing content.
          </p>
        </div>
      )}

      {/* Publish Button */}
      <Button
        onClick={handlePublish}
        disabled={isPublishing || !publishingUI.canPublish}
        className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700"
      >
        {isPublishing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isPublishing ? 'Publishing...' : 'Publish My Content'}
      </Button>
    </div>
  )
}

/**
 * Upload Tips Component
 *
 * Helpful tips for successful content creation
 */
function UploadTips() {
  const tips = [
    {
      icon: Target,
      title: "Quality Content",
      description: "High-quality, original content performs better and builds loyal audiences."
    },
    {
      icon: Users,
      title: "Know Your Audience",
      description: "Use relevant tags and descriptions to help the right people discover your content."
    },
    {
      icon: Lightbulb,
      title: "Smart Pricing",
      description: "Research similar content to find the sweet spot between accessibility and value."
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Upload Tips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {tips.map((tip, index) => (
            <div key={index} className="flex gap-3">
              <tip.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-sm">{tip.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error Fallback Component
 */
function ContentUploadErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Upload Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error with your upload. Please try again.
            </p>
            <div className="flex gap-2">
              <Button onClick={resetErrorBoundary} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/mini'}
                className="flex-1"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Loading Skeleton Component
 */
function ContentUploadLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-3">
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-3 w-12 mt-1" />
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

/**
 * MiniApp Content Upload Page - Production Ready
 *
 * Wrapped with error boundary and suspense for production reliability
 */
export default function MiniAppContentUploadPage() {
  return (
    <ErrorBoundary
      FallbackComponent={ContentUploadErrorFallback}
      onError={(error, errorInfo) => {
        console.error('MiniApp Content Upload error:', error, errorInfo)
        // In production, send to your error reporting service
      }}
    >
      <Suspense fallback={<ContentUploadLoadingSkeleton />}>
        <MiniAppContentUploadCore />
      </Suspense>
    </ErrorBoundary>
  )
}

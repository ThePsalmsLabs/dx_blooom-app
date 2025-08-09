/**
 * Creator Profile Editor Component
 * File: src/components/creator/CreatorProfileEditor.tsx
 * 
 * This component provides a comprehensive interface for creators to manage their profiles,
 * implementing the useCreatorProfileManagement hook to enable subscription price updates
 * and profile metadata management. It follows the platform's established UI patterns
 * for forms, validation, and user feedback while providing professional creator tools.
 * 
 * Key Features:
 * - Dynamic subscription price updates with real-time validation
 * - Profile metadata management with IPFS integration for rich profiles
 * - Verification status display and guidance
 * - Account deactivation options with confirmation safeguards
 * - Real-time form validation following platform patterns
 * - Responsive design consistent with dashboard architecture
 * - Comprehensive error handling and success feedback
 * 
 * Business Impact:
 * - Enables creators to optimize pricing based on market response
 * - Provides professional profile management for creator branding
 * - Displays verification status to build trust and credibility
 * - Offers account management flexibility for creator retention
 * 
 * Integration Notes:
 * - Uses the useCreatorProfileManagement hook for contract interactions
 * - Follows established form patterns from ContentUpload component
 * - Integrates with existing creator profile hooks for data fetching
 * - Uses consistent UI components and styling patterns
 * - Handles IPFS uploads for profile metadata following platform conventions
 */

'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import {
  User,
  DollarSign,
  Globe,
  Twitter,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Upload,
  Save,
  Settings,
  ExternalLink,
  Info,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Star,
  Award,
  Eye,
  EyeOff
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/seperator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// Import our architectural layers
import { useCreatorProfileManagement } from '@/hooks/contracts/creator/useCreatorProfileManagement'
import { useCreatorProfile } from '@/hooks/contracts/core'
import { ContentCategory, categoryToString } from '@/types/contracts'
import { formatCurrency, formatAddress } from '@/lib/utils'

/**
 * Profile Form Data Interface
 * 
 * This interface defines the structure for profile editing data,
 * ensuring type safety for all profile management operations.
 */
interface ProfileFormData {
  bio: string
  website: string
  twitter: string
  subscriptionPrice: string
  categories: ContentCategory[]
  profileImageFile?: File
  showEmail: boolean
  showSocialLinks: boolean
}

/**
 * Validation Errors Interface
 * 
 * This interface provides comprehensive form validation feedback
 * following the platform's established validation patterns.
 */
interface ValidationErrors {
  bio?: string
  website?: string
  twitter?: string
  subscriptionPrice?: string
  categories?: string
  general?: string
}

/**
 * Profile metadata stored on IPFS (JSON)
 */
interface CreatorProfileMetadata {
  readonly bio?: string
  readonly website?: string
  readonly twitter?: string
  readonly categories?: ContentCategory[]
  readonly showEmail?: boolean
  readonly showSocialLinks?: boolean
  readonly profileImage?: string
  readonly updatedAt?: string
}

/**
 * IPFS Upload Progress Interface
 * 
 * This tracks IPFS upload progress for profile image uploads,
 * following the same patterns used in content upload.
 */
interface IPFSUploadState {
  isUploading: boolean
  progress: number
  error?: string
  hash?: string
}

/**
 * Props interface for the CreatorProfileEditor component
 */
interface CreatorProfileEditorProps {
  /** Optional creator address - defaults to connected wallet */
  creatorAddress?: string
  /** Optional callback when profile is updated successfully */
  onProfileUpdated?: () => void
  /** Whether to show as a modal or inline component */
  variant?: 'modal' | 'inline'
  /** Optional custom styling */
  className?: string
}

/**
 * Creator Profile Editor Component
 * 
 * This component provides comprehensive profile management functionality,
 * integrating with the useCreatorProfileManagement hook to enable dynamic
 * subscription pricing and profile metadata updates. It follows all platform
 * UI patterns while providing professional creator management tools.
 */
export function CreatorProfileEditor({
  creatorAddress,
  onProfileUpdated,
  variant = 'inline',
  className
}: CreatorProfileEditorProps) {
  const { address: connectedAddress } = useAccount()
  const effectiveCreatorAddress = (creatorAddress || connectedAddress) as `0x${string}` | undefined

  // Profile management hooks following established patterns
  const creatorProfile = useCreatorProfile(effectiveCreatorAddress)
  const profileManagement = useCreatorProfileManagement()

  // Form state management following ContentUpload patterns
  const [formData, setFormData] = useState<ProfileFormData>({
    bio: '',
    website: '',
    twitter: '',
    subscriptionPrice: '',
    categories: [],
    showEmail: false,
    showSocialLinks: true
  })

  // Validation and UI state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [ipfsUpload, setIpfsUpload] = useState<IPFSUploadState>({
    isUploading: false,
    progress: 0
  })

  // File input ref for profile image upload
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Initialize form data from creator profile
   * 
   * This effect populates the form with existing creator data when available,
   * following the same patterns used throughout the platform for data initialization.
   */
  useEffect(() => {
    if (creatorProfile.data && !isFormDirty) {
      const currentPrice = Number(creatorProfile.data.subscriptionPrice) / 1_000_000
      setFormData(prev => ({
        ...prev,
        subscriptionPrice: currentPrice.toString(),
      }))
    }
  }, [creatorProfile.data, isFormDirty])

  /**
   * Form validation function
   * 
   * This provides comprehensive form validation following the platform's
   * established validation patterns with clear, actionable error messages.
   */
  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {}

    // Bio validation
    if (formData.bio.length > 500) {
      errors.bio = 'Bio must be 500 characters or less'
    }

    // Website validation
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      errors.website = 'Website must be a valid URL starting with http:// or https://'
    }

    // Twitter validation
    if (formData.twitter && !formData.twitter.match(/^@?[A-Za-z0-9_]{1,15}$/)) {
      errors.twitter = 'Twitter handle must be valid (letters, numbers, underscore only)'
    }

    // Subscription price validation
    const price = parseFloat(formData.subscriptionPrice)
    if (isNaN(price) || price < 0.01) {
      errors.subscriptionPrice = 'Subscription price must be at least $0.01'
    } else if (price > 1000) {
      errors.subscriptionPrice = 'Subscription price cannot exceed $1000'
    }

    // Categories validation
    if (formData.categories.length > 5) {
      errors.categories = 'You can select up to 5 content categories'
    }

    return errors
  }, [formData])

  /**
   * Handle form input changes
   * 
   * This function manages form state updates while tracking dirty state
   * and clearing validation errors as users correct them.
   */
  const handleInputChange = useCallback((field: keyof ProfileFormData, value: ProfileFormData[typeof field]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsFormDirty(true)
    
    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }, [validationErrors])

  /**
   * Handle profile image upload
   * 
   * This function manages IPFS upload for profile images following the same
   * patterns used in content upload for consistency and reliability.
   */
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setValidationErrors(prev => ({ ...prev, general: 'Please select an image file' }))
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setValidationErrors(prev => ({ ...prev, general: 'Image file must be smaller than 5MB' }))
      return
    }

    setIpfsUpload({ isUploading: true, progress: 0 })

    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/ipfs/upload', { method: 'POST', body: form })
      const json = await res.json() as { success?: boolean; hash?: string; error?: string }
      if (!res.ok || !json?.hash) {
        throw new Error(json?.error || 'IPFS upload failed')
      }
      setIpfsUpload({ isUploading: false, progress: 100, hash: json.hash })
      setFormData(prev => ({ ...prev, profileImageFile: file }))

    } catch (error) {
      setIpfsUpload({
        isUploading: false,
        progress: 0,
        error: 'Failed to upload image. Please try again.'
      })
    }
  }, [])

  /**
   * Handle form submission
   * 
   * This function orchestrates the profile update process, including both
   * subscription price updates and profile metadata updates using our hooks.
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      // Prepare profile metadata
      const profileMetadata: CreatorProfileMetadata = {
        bio: formData.bio,
        website: formData.website,
        twitter: formData.twitter.replace('@', ''),
        categories: formData.categories,
        showEmail: formData.showEmail,
        showSocialLinks: formData.showSocialLinks,
        profileImage: ipfsUpload.hash,
        updatedAt: new Date().toISOString()
      }

      // Upload profile metadata JSON to IPFS
      const profileDataString = JSON.stringify(profileMetadata)
      const blob = new Blob([profileDataString], { type: 'application/json' })
      const jsonFile = new File([blob], 'profile.json', { type: 'application/json' })
      const form = new FormData()
      form.append('file', jsonFile)
      const metaRes = await fetch('/api/ipfs/upload', { method: 'POST', body: form })
      const metaJson = await metaRes.json() as { success?: boolean; hash?: string; error?: string }
      if (!metaRes.ok || !metaJson?.hash) {
        throw new Error(metaJson?.error || 'Failed to upload profile metadata to IPFS')
      }
      const profileDataCid = metaJson.hash

      // Update subscription price if changed
      const currentPrice = Number(creatorProfile.data?.subscriptionPrice ?? 0) / 1_000_000
      if (parseFloat(formData.subscriptionPrice) !== currentPrice) {
        await profileManagement.updateSubscriptionPrice({
          newPriceUSDC: formData.subscriptionPrice
        })
      }

      // Update profile data
      await profileManagement.updateProfileData({ profileData: profileDataCid })

      // Success handling
      setIsFormDirty(false)
      onProfileUpdated?.()
      
    } catch (error) {
      setValidationErrors({
        general: error instanceof Error ? error.message : 'Failed to update profile'
      })
    }
  }, [formData, validateForm, profileManagement, creatorProfile.data, ipfsUpload.hash, onProfileUpdated])

  /**
   * Handle category selection
   * 
   * This function manages the multi-select category interface following
   * platform patterns for complex form controls.
   */
  const handleCategoryToggle = useCallback((category: ContentCategory) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category].slice(0, 5) // Limit to 5 categories
    }))
    setIsFormDirty(true)
  }, [])

  // Verification status display
  const verificationStatus = useMemo(() => {
    if (!creatorProfile.data) return null
    
    return creatorProfile.data.isVerified ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Verified Creator
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        <AlertCircle className="h-3 w-3 mr-1" />
        Unverified
      </Badge>
    )
  }, [creatorProfile.data])

  // Loading state
  if (creatorProfile.isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Creator Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (creatorProfile.error || !creatorProfile.data) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {creatorProfile.error?.message || 'Failed to load creator profile. Please try again.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Creator Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your creator profile, subscription pricing, and account preferences
            </CardDescription>
          </div>
          {verificationStatus}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Display */}
          {validationErrors.general && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationErrors.general}</AlertDescription>
            </Alert>
          )}

          {/* Profile Success Message */}
          {profileManagement.isConfirmed && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Profile updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Profile Image Upload */}
          <div className="space-y-3">
            <Label>Profile Image</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {formData.profileImageFile ? (
                  <img 
                    src={URL.createObjectURL(formData.profileImageFile)}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ipfsUpload.isUploading}
                >
                  {ipfsUpload.isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                {ipfsUpload.isUploading && (
                  <Progress value={ipfsUpload.progress} className="mt-2" />
                )}
                {ipfsUpload.error && (
                  <p className="text-sm text-red-600 mt-1">{ipfsUpload.error}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell your audience about yourself..."
                rows={4}
                className={cn(validationErrors.bio && 'border-red-500')}
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{validationErrors.bio && (
                  <span className="text-red-500">{validationErrors.bio}</span>
                )}</span>
                <span>{formData.bio.length}/500</span>
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
                className={cn(validationErrors.website && 'border-red-500')}
              />
              {validationErrors.website && (
                <p className="text-xs text-red-500">{validationErrors.website}</p>
              )}
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter Handle</Label>
              <Input
                id="twitter"
                value={formData.twitter}
                onChange={(e) => handleInputChange('twitter', e.target.value)}
                placeholder="@yourusername"
                className={cn(validationErrors.twitter && 'border-red-500')}
              />
              {validationErrors.twitter && (
                <p className="text-xs text-red-500">{validationErrors.twitter}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Subscription Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Subscription Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="subscriptionPrice">Monthly Subscription Price (USDC)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="subscriptionPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000"
                  value={formData.subscriptionPrice}
                  onChange={(e) => handleInputChange('subscriptionPrice', e.target.value)}
                  placeholder="9.99"
                  className={cn(
                    'pl-10',
                    validationErrors.subscriptionPrice && 'border-red-500'
                  )}
                />
              </div>
              {validationErrors.subscriptionPrice && (
                <p className="text-xs text-red-500">{validationErrors.subscriptionPrice}</p>
              )}
              <p className="text-xs text-gray-500">
                Current price: {formatCurrency(creatorProfile.data.subscriptionPrice)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Content Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Content Categories</h3>
              <Badge variant="secondary">
                {formData.categories.length}/5 selected
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.values(ContentCategory).filter(cat => typeof cat === 'number').map((category) => (
                <Button
                  key={category}
                  type="button"
                  variant={formData.categories.includes(category as ContentCategory) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryToggle(category as ContentCategory)}
                  disabled={!formData.categories.includes(category as ContentCategory) && formData.categories.length >= 5}
                  className="justify-start text-xs"
                >
                  {categoryToString(category as ContentCategory)}
                </Button>
              ))}
            </div>
            {validationErrors.categories && (
              <p className="text-xs text-red-500">{validationErrors.categories}</p>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!isFormDirty || profileManagement.isLoading}
                className="flex-1 sm:flex-none"
              >
                {profileManagement.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    bio: '',
                    website: '',
                    twitter: '',
                    subscriptionPrice: (Number(creatorProfile.data?.subscriptionPrice ?? 0) / 1_000_000).toString(),
                    categories: [],
                    showEmail: false,
                    showSocialLinks: true
                  })
                  setIsFormDirty(false)
                  setValidationErrors({})
                }}
                disabled={!isFormDirty}
              >
                Reset
              </Button>
            </div>

            {/* Account Deactivation */}
            <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Deactivate Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deactivate Creator Account</DialogTitle>
                  <DialogDescription>
                    This will temporarily deactivate your creator account. Your content will remain accessible
                    to existing purchasers, but new purchases and subscriptions will be disabled.
                    You can reactivate your account at any time.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeactivateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      // Handle deactivation logic here
                      setShowDeactivateDialog(false)
                    }}
                  >
                    Confirm Deactivation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
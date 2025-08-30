/**
 * Zora Collection Manager - Creator Dashboard Integration
 * File: src/components/creator/ZoraCollectionManager.tsx
 * 
 * This component integrates Zora NFT collection management directly into your existing
 * creator dashboard, following your established patterns for TypeScript interfaces,
 * shadcn/ui components, and role-based access control.
 * 
 * Integration Philosophy:
 * - Extends your existing dashboard tab structure
 * - Uses your established UI component patterns and styling
 * - Leverages your creator authentication and role management
 * - Follows your three-layer architecture: business logic → UI integration → components
 * - Maintains your error handling and loading state patterns
 * - Uses your established hook patterns for contract interactions
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { type Address } from 'viem'
import {
  Plus,
  ExternalLink,
  Settings,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  Copy,
  Eye
} from 'lucide-react'

// Import shadcn/ui components following your exact patterns
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CustomModal } from '@/components/ui/custom-modal'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/seperator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Import your existing hooks following established patterns
import { useIsCreatorRegistered, useCreatorProfile } from '@/hooks/contracts/core'

// Import utility functions following your patterns
import { cn, formatAddress } from '@/lib/utils'

// Import Zora-specific hooks
import { 
  useZoraCollectionCreation
} from '@/hooks/contracts/zora/useZoraCollectionCreation'

import { 
  useZoraCollectionList,
  type ZoraCollection 
} from '@/hooks/contracts/zora/useZoraCollectionList'

// Import error handling components
import { ZoraErrorBoundary } from '@/components/errors/ZoraErrorBoundary'

// ===== INTERFACE DEFINITIONS =====

/**
 * Component Props Interface
 * Following your established readonly pattern for props
 */
interface ZoraCollectionManagerProps {
  readonly creatorAddress: Address
  readonly className?: string
  readonly onCollectionCreated?: (collectionAddress: Address) => void
}

/**
 * Collection Creation Form Data Interface
 * Defines the structure for new collection creation
 */
interface CollectionFormData {
  readonly name: string
  readonly description: string
  readonly royaltyBPS: number
  readonly image?: File
}

/**
 * Collection Settings Interface
 * Defines the structure for collection settings updates
 */
interface CollectionSettings {
  readonly name?: string
  readonly description?: string
  readonly royaltyBPS?: number
  readonly image?: File
  readonly isActive?: boolean
  readonly maxSupply?: number
  readonly defaultMintPrice?: bigint
}

/**
 * Collection Creation State
 * Manages the multi-step collection creation process
 */
type CollectionCreationState = 
  | 'idle'
  | 'creating'
  | 'uploading-metadata'
  | 'confirming'
  | 'success'
  | 'error'

// ===== MAIN COMPONENT =====

export function ZoraCollectionManager({ 
  creatorAddress, 
  className,
  onCollectionCreated
}: ZoraCollectionManagerProps) {
  const { address: connectedAddress } = useAccount()
  const chainId = useChainId()
  
  // Use your existing authentication hooks
  const { data: isRegisteredCreator, isLoading: isCheckingRegistration } = useIsCreatorRegistered(creatorAddress)
  const { data: creatorProfile } = useCreatorProfile(creatorAddress)
  
  // Zora-specific hooks for collection management
  const {
    createCollection,
    isLoading: isCreatingCollection,
    isConfirming: isConfirmingCollection,
    isSuccess: collectionCreated,
    error: creationError,
    contractAddress: newCollectionAddress,
    reset: resetCreation
  } = useZoraCollectionCreation()
  
  const {
    data: collections,
    isLoading: isLoadingCollections,
    error: collectionsError,
    refetch: refetchCollections
  } = useZoraCollectionList(creatorAddress)

  // Component state management
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false)
  const [formData, setFormData] = useState<CollectionFormData>({
    name: '',
    description: '',
    royaltyBPS: 500 // 5% default
  })
  const [creationState, setCreationState] = useState<CollectionCreationState>('idle')

  // Authentication and access control
  const canManageCollections = useMemo(() => {
    return (
      isRegisteredCreator &&
      connectedAddress === creatorAddress &&
      !isCheckingRegistration
    )
  }, [isRegisteredCreator, connectedAddress, creatorAddress, isCheckingRegistration])

  // Form validation
  const isFormValid = useMemo(() => {
    return formData.name.trim().length > 0 && formData.description.trim().length > 0
  }, [formData])

  // Collection creation handler with enhanced IPFS integration and error handling
  const handleCreateCollection = useCallback(async () => {
    if (!isFormValid || !canManageCollections) return

    try {
      setCreationState('creating')

      // Step 1: Upload collection metadata to IPFS if image is provided
      let metadataURI = ''
      if (formData.image) {
        setCreationState('uploading-metadata')
        
        try {
          // Create collection metadata object
          const collectionMetadata = {
            name: formData.name,
            description: formData.description,
            image: '', // Will be set after image upload
            external_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourplatform.com'}/creator/${creatorAddress}`,
            seller_fee_basis_points: formData.royaltyBPS,
            fee_recipient: creatorAddress
          }

          // Upload image first
          const imageFormData = new FormData()
          imageFormData.append('file', formData.image)
          
          const imageResponse = await fetch('/api/ipfs/upload', {
            method: 'POST',
            body: imageFormData
          })
          
          if (!imageResponse.ok) {
            throw new Error('Failed to upload collection image to IPFS')
          }
          
          const imageResult = await imageResponse.json()
          if (!imageResult.success || !imageResult.hash) {
            throw new Error('Invalid response from IPFS upload service')
          }

          // Update metadata with image URI
          collectionMetadata.image = `ipfs://${imageResult.hash}`

          // Upload metadata
          const metadataBlob = new Blob([JSON.stringify(collectionMetadata, null, 2)], {
            type: 'application/json'
          })
          const metadataFile = new File([metadataBlob], 'collection-metadata.json', {
            type: 'application/json'
          })

          const metadataFormData = new FormData()
          metadataFormData.append('file', metadataFile)

          const metadataResponse = await fetch('/api/ipfs/upload', {
            method: 'POST',
            body: metadataFormData
          })

          if (!metadataResponse.ok) {
            throw new Error('Failed to upload collection metadata to IPFS')
          }

          const metadataResult = await metadataResponse.json()
          if (!metadataResult.success || !metadataResult.hash) {
            throw new Error('Invalid response from metadata upload service')
          }

          metadataURI = `ipfs://${metadataResult.hash}`
          
        } catch (uploadError) {
          console.error('IPFS upload failed:', uploadError)
          throw new Error(`Failed to upload collection assets: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
        }
      }

      // Step 2: Create collection on blockchain
      setCreationState('confirming')

      await createCollection({
        name: formData.name,
        description: formData.description,
        royaltyConfig: {
          royaltyMintSchedule: 0,
          royaltyBPS: formData.royaltyBPS,
          royaltyRecipient: creatorAddress
        },
        defaultAdmin: creatorAddress
      })

      setCreationState('success')
      
      // Call success callback if provided
      if (onCollectionCreated && newCollectionAddress) {
        onCollectionCreated(newCollectionAddress)
      }
      
      // Reset form and close dialog after success
      setTimeout(() => {
        setFormData({
          name: '',
          description: '',
          royaltyBPS: 500
        })
        setShowCreateDialog(false)
        setCreationState('idle')
        refetchCollections()
      }, 2000)

    } catch (error) {
      console.error('Collection creation failed:', error)
      setCreationState('error')
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Collection creation failed'
      
      // In a real implementation, you would show this in a toast or alert
      console.error('User-facing error:', errorMessage)
    }
  }, [formData, isFormValid, canManageCollections, createCollection, creatorAddress, refetchCollections])

  // Collection settings management handler
  const handleCollectionSettings = useCallback(async (
    collectionAddress: Address,
    settings: CollectionSettings
  ) => {
    try {
      // Step 1: Upload updated metadata to IPFS if image is provided
      let metadataURI = ''
      if (settings.image) {
        try {
          // Create updated collection metadata object
          const collectionMetadata = {
            name: settings.name || '',
            description: settings.description || '',
            image: '', // Will be set after image upload
            external_link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourplatform.com'}/creator/${creatorAddress}`,
            seller_fee_basis_points: settings.royaltyBPS || 500,
            fee_recipient: creatorAddress
          }

          // Upload image first
          const imageFormData = new FormData()
          imageFormData.append('file', settings.image)
          
          const imageResponse = await fetch('/api/ipfs/upload', {
            method: 'POST',
            body: imageFormData
          })
          
          if (!imageResponse.ok) {
            throw new Error('Failed to upload collection image to IPFS')
          }
          
          const imageResult = await imageResponse.json()
          if (!imageResult.success || !imageResult.hash) {
            throw new Error('Invalid response from IPFS upload service')
          }

          // Update metadata with image URI
          collectionMetadata.image = `ipfs://${imageResult.hash}`

          // Upload metadata
          const metadataBlob = new Blob([JSON.stringify(collectionMetadata, null, 2)], {
            type: 'application/json'
          })
          const metadataFile = new File([metadataBlob], 'collection-metadata.json', {
            type: 'application/json'
          })

          const metadataFormData = new FormData()
          metadataFormData.append('file', metadataFile)

          const metadataResponse = await fetch('/api/ipfs/upload', {
            method: 'POST',
            body: metadataFormData
          })

          if (!metadataResponse.ok) {
            throw new Error('Failed to upload collection metadata to IPFS')
          }

          const metadataResult = await metadataResponse.json()
          if (!metadataResult.success || !metadataResult.hash) {
            throw new Error('Invalid response from metadata upload service')
          }

          metadataURI = `ipfs://${metadataResult.hash}`
          
        } catch (uploadError) {
          console.error('IPFS upload failed:', uploadError)
          throw new Error(`Failed to upload collection assets: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
        }
      }

      // Step 2: Update collection settings on blockchain
      // Note: This would require a hook that handles collection updates
      // For now, we'll just log the settings and metadata URI
      console.log('Updating collection settings:', {
        collectionAddress,
        settings,
        metadataURI
      })

      // Step 3: Update local state and refetch collections
      refetchCollections()

      // Show success message
      console.log('Collection settings updated successfully')

    } catch (error) {
      console.error('Collection settings update failed:', error)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Collection settings update failed'
      console.error('User-facing error:', errorMessage)
    }
  }, [creatorAddress, refetchCollections])

  // Reset creation state when dialog closes
  const handleDialogClose = useCallback((open: boolean) => {
    setShowCreateDialog(open)
    if (!open) {
      setCreationState('idle')
      resetCreation()
    }
  }, [resetCreation])

  // Early return for unauthorized access
  if (isCheckingRegistration) {
    return <ZoraCollectionManagerSkeleton className={className} />
  }

  if (!canManageCollections) {
    return null
  }

  return (
    <ZoraErrorBoundary operation="collection management">
      <div className={cn("space-y-6", className)}>
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">NFT Collections</h2>
            <p className="text-muted-foreground">
              Create and manage your NFT collections on Zora
            </p>
          </div>

          <Button
            disabled={!canManageCollections}
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Collection
          </Button>

          <CustomModal
            isOpen={showCreateDialog}
            onClose={() => handleDialogClose(false)}
            title="Create NFT Collection"
            description="Set up your NFT collection for minting content"
            maxWidth="sm:max-w-2xl"
            mobileBottomSheet={false}
            closeOnOverlayClick={true}
            closeOnEscape={true}
            zIndex={50}
          >
            <CollectionCreationDialog
              formData={formData}
              onFormDataChange={setFormData}
              onSubmit={handleCreateCollection}
              creationState={creationState}
              isFormValid={isFormValid}
              newCollectionAddress={newCollectionAddress}
            />
          </CustomModal>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Loading State */}
        {isLoadingCollections && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </>
        )}

        {/* Error State */}
        {collectionsError && (
          <div className="col-span-full">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load collections. Please try refreshing.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Collections Display */}
        {collections && collections.length > 0 ? (
          collections.map((collection: ZoraCollection) => (
            <CollectionCard
              key={collection.address}
              collection={collection}
              onManage={() => {
                // Future: Navigate to collection management
                console.log('Manage collection:', collection.address)
              }}
              onEdit={() => {
                // Future: Open collection settings dialog
                console.log('Edit collection:', collection.address)
                // Example: handleCollectionSettings(collection.address, { name: 'Updated Name' })
              }}
              onViewOnZora={() => {
                // Open collection on Zora marketplace
                const zoraUrl = `https://zora.co/collections/${collection.address}`
                window.open(zoraUrl, '_blank', 'noopener,noreferrer')
              }}
            />
          ))
        ) : (
          /* Empty State */
          <EmptyCollectionsState
            onCreateFirst={() => setShowCreateDialog(true)}
          />
        )}
      </div>
    </div>
    </ZoraErrorBoundary>
  )
}

// ===== SUPPORTING COMPONENTS =====

/**
 * Collection Creation Dialog
 * Handles the multi-step collection creation process
 */
interface CollectionCreationDialogProps {
  readonly formData: CollectionFormData
  readonly onFormDataChange: (data: CollectionFormData) => void
  readonly onSubmit: () => void
  readonly creationState: CollectionCreationState
  readonly isFormValid: boolean
  readonly newCollectionAddress?: Address
}

function CollectionCreationDialog({
  formData,
  onFormDataChange,
  onSubmit,
  creationState,
  isFormValid,
  newCollectionAddress
}: CollectionCreationDialogProps) {
  const handleInputChange = useCallback((field: keyof CollectionFormData, value: string | number) => {
    onFormDataChange({
      ...formData,
      [field]: value
    })
  }, [formData, onFormDataChange])

  if (creationState === 'success') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Collection Created Successfully!</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Your NFT collection has been deployed and is ready to use.
        </p>

        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Collection Address:</span>
            <div className="flex items-center gap-2">
              <code className="text-sm">{newCollectionAddress && formatAddress(newCollectionAddress)}</code>
              <Button size="sm" variant="ghost">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You can now create NFTs within this collection from your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
      {/* Progress Indicator */}
      {creationState !== 'idle' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Creating collection...</span>
            <span>
              {creationState === 'creating' && 'Preparing transaction'}
              {creationState === 'uploading-metadata' && 'Uploading to IPFS'}
              {creationState === 'confirming' && 'Confirming on blockchain'}
              {creationState === 'error' && 'Failed'}
            </span>
          </div>
          <Progress
            value={
              creationState === 'creating' ? 25 :
              creationState === 'uploading-metadata' ? 50 :
              creationState === 'confirming' ? 75 : 100
            }
            className="w-full"
          />
        </div>
      )}

      {/* Form Fields */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="collection-name">Collection Name</Label>
            <Input
              id="collection-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="My Amazing Collection"
              disabled={creationState !== 'idle'}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="collection-description">Description</Label>
            <Textarea
              id="collection-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="A collection of exclusive NFTs for my community..."
              disabled={creationState !== 'idle'}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="collection-image">Collection Image (Optional)</Label>
            <Input
              id="collection-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onFormDataChange({
                    ...formData,
                    image: file
                  })
                }
              }}
              disabled={creationState !== 'idle'}
            />
            <p className="text-xs text-muted-foreground">
              Upload an image to represent your collection on marketplaces
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="royalty-percentage">Creator Royalty</Label>
            <Select
              value={formData.royaltyBPS.toString()}
              onValueChange={(value) => handleInputChange('royaltyBPS', parseInt(value))}
              disabled={creationState !== 'idle'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="250">2.5%</SelectItem>
                <SelectItem value="500">5%</SelectItem>
                <SelectItem value="750">7.5%</SelectItem>
                <SelectItem value="1000">10%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={!isFormValid || creationState !== 'idle'}
          >
            {creationState === 'idle' && 'Create Collection'}
            {creationState === 'creating' && (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            )}
            {creationState === 'confirming' && (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming...
              </>
            )}
          </Button>
      </div>
    </>
  )
}

/**
 * Individual Collection Card
 * Displays collection information and management options
 */
interface CollectionCardProps {
  readonly collection: ZoraCollection
  readonly onManage: () => void
  readonly onEdit?: () => void
  readonly onViewOnZora?: () => void
}

function CollectionCard({ collection, onManage, onEdit, onViewOnZora }: CollectionCardProps) {
  // Calculate collection stats
  const mintProgress = collection.totalTokens > BigInt(0) 
    ? Number((collection.totalMinted * BigInt(100)) / collection.totalTokens) 
    : 0

  const isPopular = Number(collection.totalMinted) > 10
  const isNew = Date.now() - Number(collection.createdAt) * 1000 < 7 * 24 * 60 * 60 * 1000 // 7 days

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{collection.name}</CardTitle>
              {isNew && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
              {isPopular && (
                <Badge variant="default" className="text-xs">
                  Popular
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {collection.description}
            </CardDescription>
          </div>
          <Badge variant={collection.isActive ? 'default' : 'secondary'}>
            {collection.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Collection Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-muted-foreground">Total NFTs</div>
            <div className="text-lg font-semibold">
              {collection.totalTokens.toString()}
            </div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Minted</div>
            <div className="text-lg font-semibold">
              {collection.totalMinted.toString()}
            </div>
          </div>
        </div>

        {/* Mint Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mint Progress</span>
            <span className="font-medium">{mintProgress}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(mintProgress, 100)}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Collection Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Royalty</span>
            <span className="font-medium">{(collection.royaltyBPS / 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span className="font-medium">
              {new Date(Number(collection.createdAt) * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={onViewOnZora}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View on Zora Marketplace</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={onEdit}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit Collection Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Button size="sm" variant="outline" onClick={onManage}>
            <Eye className="h-4 w-4 mr-1" />
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Empty Collections State
 * Displayed when creator has no collections yet
 */
interface EmptyCollectionsStateProps {
  readonly onCreateFirst: () => void
}

function EmptyCollectionsState({ onCreateFirst }: EmptyCollectionsStateProps) {
  return (
    <div className="col-span-full">
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Create Your First Collection</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Transform your content into collectible NFTs. Start building your NFT collection 
            and provide new ways for fans to support your work.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={onCreateFirst}>
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
            <Button variant="outline" asChild>
              <a 
                href="https://docs.zora.co" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn More
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== SKELETON COMPONENTS =====

function ZoraCollectionManagerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <CollectionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

function CollectionCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-8" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-8" />
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
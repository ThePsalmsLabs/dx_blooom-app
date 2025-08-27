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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  className 
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

  // Collection creation handler
  const handleCreateCollection = useCallback(async () => {
    if (!isFormValid || !canManageCollections) return

    try {
      setCreationState('creating')

      // Metadata upload is now handled automatically by the hook
      // The hook will create and upload metadata to IPFS

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
    }
  }, [formData, isFormValid, canManageCollections, createCollection, creatorAddress, refetchCollections])

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

          <Dialog open={showCreateDialog} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button disabled={!canManageCollections}>
                <Plus className="h-4 w-4 mr-2" />
                Create Collection
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <CollectionCreationDialog
              formData={formData}
              onFormDataChange={setFormData}
              onSubmit={handleCreateCollection}
              creationState={creationState}
              isFormValid={isFormValid}
              newCollectionAddress={newCollectionAddress}
            />
          </DialogContent>
        </Dialog>
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
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Collection Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Your NFT collection has been deployed and is ready to use.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
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
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create NFT Collection</DialogTitle>
        <DialogDescription>
          Deploy a new Zora ERC-1155 collection for your NFTs
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Progress Indicator */}
        {creationState !== 'idle' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Creating collection...</span>
              <span>
                {creationState === 'creating' && 'Preparing transaction'}
                {creationState === 'confirming' && 'Confirming on blockchain'}
                {creationState === 'error' && 'Failed'}
              </span>
            </div>
            <Progress 
              value={
                creationState === 'creating' ? 33 : 
                creationState === 'confirming' ? 66 : 100
              } 
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

      <DialogFooter>
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
      </DialogFooter>
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
}

function CollectionCard({ collection, onManage }: CollectionCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{collection.name}</CardTitle>
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

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {(collection.royaltyBPS / 100).toFixed(1)}% royalty
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View on Zora</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button size="sm" variant="outline" onClick={onManage}>
              <Settings className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </div>
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
/**
 * Content Viewer Component - Component 7.3
 * File: src/components/content/ContentViewer.tsx
 * 
 * This component completes the content consumption workflow by providing secure,
 * access-controlled rendering of content that users have permission to view.
 * It demonstrates how our architectural layers enable sophisticated content
 * protection while maintaining excellent user experience.
 * 
 * Key Features:
 * - Access verification before content display
 * - IPFS content retrieval with retry logic
 * - Multi-format content support (text, video, PDF, images)
 * - Graceful fallbacks for restricted or unavailable content
 * - Progressive loading with skeleton states
 * - Error recovery and retry mechanisms
 * - Creator attribution and content metadata display
 * - Responsive design for all device sizes
 * 
 * This component showcases how blockchain-based access control can be
 * seamlessly integrated into familiar content viewing experiences while
 * providing creators with strong content protection guarantees.
 */

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Shield,
  Lock,
  Unlock,
  Calendar,
  Tag,
  Download,
  Share2,
  AlertCircle,
  RefreshCw,
  Eye,
  Clock,
  FileText,
  File,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/seperator'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn, formatCurrency, formatRelativeTime, formatAddress } from '@/lib/utils'

// Import our architectural layers
import {
  useContentById,
  useHasContentAccess,
  useCreatorProfile
} from '@/hooks/contracts/core'

import { useAccount } from 'wagmi'
import { OrchestratedContentPurchaseCard } from '@/components/content/OrchestratedContentPurchaseCard'
import { ContentNFTPromotionAdapter } from '@/components/content/ContentNFTPromotionAdapter'
import { categoryToString } from '@/types/contracts'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

/**
 * Content Access Status Types
 * 
 * These types help us provide clear feedback about why content
 * might not be accessible to the current user.
 */
type AccessStatus = 
  | 'loading'
  | 'granted' 
  | 'denied'
  | 'not_connected'
  | 'content_not_found'
  | 'content_inactive'
  | 'error'

/**
 * Content Loading States
 * 
 * These states track the IPFS content retrieval process separately
 * from the access verification process.
 */
type ContentLoadingState = 
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'failed'
  | 'retrying'

/**
 * Supported Content Types
 * 
 * The viewer can handle different content formats with appropriate
 * rendering components for each type.
 */
type ContentType = 'text' | 'video' | 'pdf' | 'image' | 'audio' | 'unknown'

/**
 * Props interface for the ContentViewer component
 */
interface ContentViewerProps {
  /** ID of the content to display */
  contentId: bigint
  /** Optional callback when content is successfully loaded */
  onContentLoaded?: (contentId: bigint) => void
  /** Whether to show creator information prominently */
  showCreatorInfo?: boolean
  /** Whether to show sharing and interaction options */
  showInteractions?: boolean
  /** Optional custom styling */
  className?: string
}

/**
 * ContentViewer Component
 * 
 * This component orchestrates the complete content viewing experience,
 * from access verification through content rendering. It demonstrates
 * how our layered architecture enables complex access control while
 * maintaining a smooth user experience.
 */
export function ContentViewer({
  contentId,
  onContentLoaded,
  showCreatorInfo = true,
  showInteractions = true,
  className
}: ContentViewerProps) {
  // Wallet connection for access control
  const { address: userAddress } = useAccount()
  const router = useRouter()

  // Content data and access control using our architectural layers
  const contentQuery = useContentById(contentId)
  const accessControl = useHasContentAccess(userAddress, contentId)
  const creatorProfile = useCreatorProfile(contentQuery.data?.creator)

  // IPFS content loading state
  const [contentLoadingState, setContentLoadingState] = useState<ContentLoadingState>('idle')
  const [ipfsContent, setIpfsContent] = useState<string | null>(null)
  const [contentType, setContentType] = useState<ContentType>('unknown')
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Determine overall access status
  const accessStatus: AccessStatus = useMemo(() => {
    if (!userAddress) return 'not_connected'
    if (contentQuery.isLoading || accessControl.isLoading) return 'loading'
    if (contentQuery.error || !contentQuery.data) return 'content_not_found'
    if (!contentQuery.data.isActive) return 'content_inactive'
    if (accessControl.isError) return 'error'
    if (accessControl.data === true) return 'granted'
    return 'denied'
  }, [userAddress, contentQuery, accessControl])

  // Determine content type from IPFS hash or metadata
  const determineContentType = useCallback((ipfsHash: string, title: string): ContentType => {
    const extension = title.split('.').pop()?.toLowerCase() || ''
    
    if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) return 'video'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image'
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) return 'audio'
    if (['pdf'].includes(extension)) return 'pdf'
    if (['txt', 'md'].includes(extension)) return 'text'
    
    return 'text' // Default to text for unknown types
  }, [])

  // Load content from IPFS when access is granted
  const loadContentFromIPFS = useCallback(async (ipfsHash: string, title: string) => {
    try {
      setContentLoadingState('loading')
      setLoadingProgress(0)

      // Determine content type before loading
      const detectedType = determineContentType(ipfsHash, title)
      setContentType(detectedType)

      // Progressive loading simulation (in real implementation, you'd use actual IPFS)
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      // Simulate IPFS retrieval (replace with actual IPFS client)
      const ipfsUrl = `https://ipfs.io/ipfs/${ipfsHash}`
      const response = await fetch(ipfsUrl)
      
      clearInterval(progressInterval)
      setLoadingProgress(100)

      if (!response.ok) {
        throw new Error(`Failed to load content: ${response.statusText}`)
      }

      let content: string
      if (detectedType === 'text') {
        content = await response.text()
      } else {
        // For non-text content, we store the URL for rendering
        content = ipfsUrl
      }

      setIpfsContent(content)
      setContentLoadingState('loaded')
      
      // Notify parent component
      onContentLoaded?.(contentId)

    } catch (error) {
      console.error('Failed to load content from IPFS:', error)
      setContentLoadingState('failed')
      setLoadingProgress(0)
    }
  }, [determineContentType, onContentLoaded, contentId])

  // Retry content loading
  const retryContentLoading = useCallback(() => {
    const data = contentQuery.data
    if (data && data.ipfsHash && data.title) {
      setContentLoadingState('retrying')
      setTimeout(() => {
        loadContentFromIPFS(data.ipfsHash, data.title)
      }, 1000)
    }
    
  }, [contentQuery.data, loadContentFromIPFS])

  // Handle view content navigation
  const handleViewContent = useCallback((contentId: bigint) => {
    // Navigate to content view page
    router.push(`/content/${contentId}/view`)
  }, [router])

  // Load content when access is granted
  useEffect(() => {
    if (accessStatus === 'granted' && contentQuery.data && contentLoadingState === 'idle') {

      loadContentFromIPFS(contentQuery.data.ipfsHash, contentQuery.data.title)
    }
  }, [accessStatus, contentQuery.data, contentLoadingState, loadContentFromIPFS])

  // Render different states based on access status
  if (accessStatus === 'loading') {
    return <ContentViewerSkeleton />
  }

  if (accessStatus === 'not_connected') {
    return <NotConnectedState />
  }

  if (accessStatus === 'content_not_found') {
    return <ContentNotFoundState />
  }

  if (accessStatus === 'content_inactive') {
    return <ContentInactiveState />
  }

  if (accessStatus === 'error') {
    return <AccessErrorState error={accessControl.error || new Error('Access verification failed')} />
  }

  if (accessStatus === 'denied') {
    return (
      <AccessDeniedState 
        contentId={contentId}
        content={contentQuery.data!}
        userAddress={userAddress}
      />
    )
  }

  // Access granted - render the content viewer
  return (
    <div className={cn("space-y-6", className)}>
      {/* Content Header */}
      <ContentHeader 
        content={contentQuery.data!}
        creator={creatorProfile.data}
        showCreatorInfo={showCreatorInfo}
        showInteractions={showInteractions}
      />

      {/* Content Display Area */}
      <Card>
        <CardContent className="p-6">
          {contentLoadingState === 'loading' || contentLoadingState === 'retrying' ? (
            <ContentLoadingState 
              progress={loadingProgress}
              isRetrying={contentLoadingState === 'retrying'}
            />
          ) : contentLoadingState === 'failed' ? (
            <ContentLoadFailedState onRetry={retryContentLoading} />
          ) : contentLoadingState === 'loaded' && ipfsContent ? (
            <ContentDisplay 
              content={ipfsContent}
              contentType={contentType}
              title={contentQuery.data!.title}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No content available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Footer with Actions */}
      {showInteractions && contentLoadingState === 'loaded' && (
        <ContentFooter 
          contentId={contentId}
          content={contentQuery.data!}
        />
      )}
    </div>
  )
}

/**
 * Content Header Component
 * 
 * Displays content metadata, creator information, and access status.
 */
function ContentHeader({
  content,
  creator,
  showCreatorInfo,
  showInteractions
}: {
  content: NonNullable<ReturnType<typeof useContentById>['data']>
  creator: ReturnType<typeof useCreatorProfile>['data']
  showCreatorInfo: boolean
  showInteractions: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{content.title}</h1>
              <Badge variant="secondary">
                <Unlock className="h-3 w-3 mr-1" />
                Access Granted
              </Badge>
            </div>
            
            <p className="text-muted-foreground">{content.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {categoryToString(content.category)}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatRelativeTime(content.creationTime)}
              </div>
              {content.payPerViewPrice > BigInt(0) && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatCurrency(content.payPerViewPrice)} per view
                </div>
              )}
            </div>
          </div>

          {showInteractions && (
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild> 
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share content</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {showCreatorInfo && creator && (
          <>
            <Separator />
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {formatAddress(content.creator).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">Creator</p>
                  {creator.isVerified && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatAddress(content.creator)}
                </p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{Number(creator.contentCount)} content pieces</span>
                  <span>{Number(creator.subscriberCount)} subscribers</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardHeader>
    </Card>
  )
}

/**
 * Content Display Component
 * 
 * Renders the actual content based on its type with appropriate viewers.
 */
function ContentDisplay({
  content,
  contentType,
  title
}: {
  content: string
  contentType: ContentType
  title: string
}) {
  switch (contentType) {
    case 'text':
      return (
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-foreground">
            {content}
          </pre>
        </div>
      )

    case 'video':
      return (
        <div className="aspect-video">
          <video 
            controls 
            className="w-full h-full rounded-lg"
            src={content}
            title={title}
          >
            Your browser does not support video playback.
          </video>
        </div>
      )

    case 'image':
      return (
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={content} 
            alt={title}
            className="max-w-full h-auto rounded-lg mx-auto"
          />
        </div>
      )

    case 'audio':
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <File className="h-5 w-5" />
            <span>{title}</span>
          </div>
          <audio controls className="w-full">
            <source src={content} />
            Your browser does not support audio playback.
          </audio>
        </div>
      )

    case 'pdf':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-medium">{title}</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={content} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open PDF
              </a>
            </Button>
          </div>
          <iframe 
            src={content}
            className="w-full h-96 border rounded-lg"
            title={title}
          />
        </div>
      )

    default:
      return (
        <div className="text-center py-8 space-y-4">
          <File className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">
              Content type not supported for preview
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href={content} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download File
            </a>
          </Button>
        </div>
      )
  }
}

/**
 * Content Footer Component
 * 
 * Provides additional actions and information about the content.
 */
function ContentFooter({
  contentId,
  content
}: {
  contentId: bigint
  content: NonNullable<ReturnType<typeof useContentById>['data']>
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Content protected by blockchain
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Accessed {new Date().toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Save for Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =====  STATE COMPONENTS =====

function ContentViewerSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
          <div className="flex gap-4">
            <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            <div className="h-4 bg-muted rounded w-16 animate-pulse" />
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="h-64 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
}

function NotConnectedState() {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-semibold">Connect Wallet to View Content</h3>
          <p className="text-sm text-muted-foreground">
            You need to connect your wallet to access this content.
          </p>
        </div>
        <Button>Connect Wallet</Button>
      </CardContent>
    </Card>
  )
}

function ContentNotFoundState() {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-semibold">Content Not Found</h3>
          <p className="text-sm text-muted-foreground">
            The requested content could not be found or has been removed.
          </p>
        </div>
        <Button variant="outline">Browse Other Content</Button>
      </CardContent>
    </Card>
  )
}

function ContentInactiveState() {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <XCircle className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-semibold">Content Unavailable</h3>
          <p className="text-sm text-muted-foreground">
            This content has been temporarily disabled by the creator.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function AccessErrorState({ error }: { error: Error | null }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Failed to verify content access: {error?.message || 'Unknown error'}
      </AlertDescription>
    </Alert>
  )
}

function AccessDeniedState({ 
  contentId, 
  content, 
  userAddress 
}: { 
  contentId: bigint
  content: NonNullable<ReturnType<typeof useContentById>['data']>
  userAddress: string | undefined
}) {
  const router = useRouter()

  // Handle view content navigation
  const handleViewContent = useCallback((contentId: bigint) => {
    // Navigate to content view page
    router.push(`/content/${contentId}/view`)
  }, [router])
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-6">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-semibold">Purchase Required</h3>
          <p className="text-sm text-muted-foreground">
            You need to purchase access to view this content.
          </p>
        </div>
        
        <div className="max-w-md mx-auto space-y-4">
          <OrchestratedContentPurchaseCard
            contentId={contentId}
            userAddress={userAddress as `0x${string}` | undefined}
            onPurchaseSuccess={() => {
              toast.success('Content purchased successfully!')
            }}
            onViewContent={handleViewContent}
            variant="full"
            showCreatorInfo={true}
            showPurchaseDetails={true}
            enableMultiPayment={true}
            showSystemHealth={true}
            enablePerformanceMetrics={false}
          />
          
          {/* NFT Promotion for Content Creators */}
          {userAddress && content.creator.toLowerCase() === userAddress.toLowerCase() && (
            <ContentNFTPromotionAdapter
              content={content}
              creatorAddress={content.creator}
              contentId={contentId}
              onMintSuccess={(contractAddress, tokenId) => {
                toast.success('Content minted as NFT successfully!')
                console.log('Content minted as NFT:', { contractAddress, tokenId })
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ContentLoadingState({ 
  progress, 
  isRetrying 
}: { 
  progress: number
  isRetrying: boolean
}) {
  return (
    <div className="py-12 text-center space-y-4">
      <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
      <div className="space-y-2">
        <p className="font-medium">
          {isRetrying ? 'Retrying content load...' : 'Loading content...'}
        </p>
        <Progress value={progress} className="w-64 mx-auto" />
        <p className="text-xs text-muted-foreground">
          Retrieving from IPFS network
        </p>
      </div>
    </div>
  )
}

function ContentLoadFailedState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-12 text-center space-y-4">
      <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
      <div>
        <p className="font-medium">Failed to Load Content</p>
        <p className="text-sm text-muted-foreground">
          Unable to retrieve content from IPFS network.
        </p>
      </div>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry Loading
      </Button>
    </div>
  )
}
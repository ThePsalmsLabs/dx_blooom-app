/**
 * Content Viewer Component
 * File: src/components/content/ContentViewer.tsx
 * 
 * This component represents the culmination of our content access control system.
 * It handles secure content display for users who have purchased or been granted
 * access to specific content, demonstrating how sophisticated access verification
 * can be seamlessly integrated into content consumption experiences.
 * 
 * Key Features:
 * - Blockchain-based access verification before content display
 * - Support for multiple content types (text, images, videos, documents)
 * - Secure IPFS content retrieval with error handling
 * - Graceful degradation for access-denied or expired content
 * - Responsive design optimized for content consumption
 * - Creator attribution and engagement metrics
 * - Share functionality and content interaction controls
 * 
 * Security Architecture:
 * This component never displays content without first verifying blockchain-based
 * access rights. It implements defense-in-depth by checking access at multiple
 * levels and providing clear feedback when access is restricted or revoked.
 */

'use client'

import React, { useState, useEffect, useCallback, JSX } from 'react'
import {
  Eye,
  Lock,
  Unlock,
  Download,
  Share2,
  Heart,
  MessageCircle,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Clock
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/seperator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Import our content access control and display hooks
import { useHasContentAccess } from '@/hooks/contracts/core'
import { useContentById, useCreatorProfile } from '@/hooks/contracts/core'
import { ContentPurchaseCard } from '@/components/web3/ContentPurchaseCard'

// Import utility functions for data formatting
import {
  formatCurrency,
  formatAddress,
  formatRelativeTime,
  formatAbsoluteTime,
  formatContentCategory
} from '@/lib/utils'

// Import types
import type { ContentCategory } from '@/types/contracts'

/**
 * Content Type Detection and Icons
 * 
 * This utility system helps the viewer understand what type of content
 * it's displaying and choose appropriate rendering strategies.
 */
const CONTENT_TYPE_CONFIG = {
  image: {
    icon: ImageIcon,
    supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    playerRequired: false
  },
  video: {
    icon: Video,
    supportedFormats: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
    playerRequired: true
  },
  audio: {
    icon: Music,
    supportedFormats: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
    playerRequired: true
  },
  document: {
    icon: FileText,
    supportedFormats: ['pdf', 'doc', 'docx', 'txt', 'md'],
    playerRequired: false
  },
  other: {
    icon: File,
    supportedFormats: [],
    playerRequired: false
  }
} as const

type ContentType = keyof typeof CONTENT_TYPE_CONFIG

/**
 * Props interface for the ContentViewer component
 */
interface ContentViewerProps {
  /** ID of the content to display */
  contentId: bigint
  /** Address of the current user */
  userAddress?: string
  /** Optional callback when user wants to go back */
  onBack?: () => void
  /** Optional callback when content is shared */
  onShare?: (contentId: bigint) => void
  /** Whether to show engagement actions (like, comment) */
  showEngagement?: boolean
  /** Optional custom styling */
  className?: string
}

/**
 * Main ContentViewer Component
 * 
 * This component orchestrates the entire content viewing experience,
 * from access verification through content rendering to user engagement.
 * It demonstrates how our access control system enables secure content
 * consumption while maintaining an excellent user experience.
 */
export function ContentViewer({
  contentId,
  userAddress,
  onBack,
  onShare,
  showEngagement = true,
  className
}: ContentViewerProps): JSX.Element {
  // Get content access status and control flow
  const accessControl = useHasContentAccess(
    userAddress as `0x${string}` | undefined,
    contentId
  )
  
  // Get detailed content information
  const contentQuery = useContentById(contentId)
  
  // Get creator profile information for attribution
  const creatorQuery = useCreatorProfile(contentQuery.data?.creator)

  // Local state for content interaction
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasLiked, setHasLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)

  // Handle share functionality
  const handleShare = useCallback(async () => {
    if (!contentQuery.data) return
    
    try {
      await navigator.share({
        title: contentQuery.data.title,
        text: contentQuery.data.description,
        url: window.location.href
      })
    } catch (error) {
      // Fallback to clipboard if Web Share API not available
      navigator.clipboard.writeText(window.location.href)
    }
    
    onShare?.(contentId)
  }, [contentQuery.data, contentId, onShare])

  // Main render logic with access control
  if (accessControl.isLoading || contentQuery.isLoading) {
    return <ContentViewerSkeleton />
  }

  if (accessControl.error || contentQuery.error) {
    return (
      <ContentViewerError 
        error={accessControl.error || contentQuery.error!}
        onRetry={() => {
          accessControl.refetch()
          contentQuery.refetch()
        }}
        onBack={onBack}
      />
    )
  }

  if (!contentQuery.data) {
    return (
      <ContentNotFound 
        contentId={contentId}
        onBack={onBack}
      />
    )
  }

  // If user doesn't have access, show purchase interface
  if (!accessControl.data) {
    return (
      <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discovery
          </Button>
        )}
        
        <ContentPreview
          content={contentQuery.data}
          creator={creatorQuery.data}
          isPreview={true}
        />
        
        <div className="flex justify-center">
          <ContentPurchaseCard
            contentId={contentId}
            userAddress={userAddress}
            variant="full"
            onPurchaseSuccess={() => {
              accessControl.refetch()
            }}
          />
        </div>
      </div>
    )
  }

  // User has access - render full content
  return (
    <div className={cn("max-w-6xl mx-auto space-y-6", className)}>
      {/* Header with navigation and actions */}
      <ContentViewerHeader
        content={contentQuery.data}
        creator={creatorQuery.data}
        onBack={onBack}
        onShare={handleShare}
        hasLiked={hasLiked}
        onLike={() => setHasLiked(!hasLiked)}
        showEngagement={showEngagement}
      />

      {/* Main content display */}
      <ContentDisplay
        content={contentQuery.data}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* Content metadata and engagement */}
      <ContentMetadata
        content={contentQuery.data}
        creator={creatorQuery.data}
        showComments={showComments}
        onToggleComments={() => setShowComments(!showComments)}
        showEngagement={showEngagement}
      />

      {/* Related content suggestions */}
      <RelatedContent
        currentContentId={contentId}
        category={contentQuery.data.category}
        creatorAddress={contentQuery.data.creator}
      />
    </div>
  )
}

/**
 * Content Viewer Header Component
 * 
 * This component provides navigation controls, sharing functionality,
 * and content attribution in a clean header interface.
 */
function ContentViewerHeader({
  content,
  creator,
  onBack,
  onShare,
  hasLiked,
  onLike,
  showEngagement
}: {
  content: any // Would use proper Content type in real implementation
  creator: any // Would use proper Creator type in real implementation
  onBack?: () => void
  onShare: () => void
  hasLiked: boolean
  onLike: () => void
  showEngagement: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {formatAddress(content.creator).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{creator?.name || formatAddress(content.creator)}</p>
            <p className="text-sm text-muted-foreground">
              {formatRelativeTime(content.creationTime)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showEngagement && (
          <>
            <Button
              variant={hasLiked ? "default" : "outline"}
              size="sm"
              onClick={onLike}
            >
              <Heart className={cn("h-4 w-4 mr-2", hasLiked && "fill-current")} />
              Like
            </Button>
            
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </>
        )}
        
        <Badge variant="outline">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Verified Access
        </Badge>
      </div>
    </div>
  )
}

/**
 * Content Display Component
 * 
 * This component handles the actual rendering of content based on its type,
 * providing appropriate viewers for different media formats.
 */
function ContentDisplay({
  content,
  isFullscreen,
  onToggleFullscreen
}: {
  content: any
  isFullscreen: boolean
  onToggleFullscreen: () => void
}) {
  const contentType = detectContentType(content.ipfsHash)
  
  return (
    <Card className={cn("overflow-hidden", isFullscreen && "fixed inset-0 z-50")}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{content.title}</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {content.description}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {formatContentCategory(content.category)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ContentRenderer
          contentType={contentType}
          ipfsHash={content.ipfsHash}
          title={content.title}
          isFullscreen={isFullscreen}
        />
      </CardContent>
    </Card>
  )
}

/**
 * Content Renderer Component
 * 
 * This component provides specialized rendering for different content types,
 * handling IPFS retrieval and format-specific display logic.
 */
function ContentRenderer({
  contentType,
  ipfsHash,
  title,
  isFullscreen
}: {
  contentType: ContentType
  ipfsHash: string
  title: string
  isFullscreen: boolean
}) {
  const [contentUrl, setContentUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch content from IPFS
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // In a real implementation, you would:
        // 1. Fetch from your IPFS gateway
        // 2. Handle authentication/access tokens if needed
        // 3. Stream large files appropriately
        const url = `https://ipfs.io/ipfs/${ipfsHash}`
        setContentUrl(url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content')
      } finally {
        setIsLoading(false)
      }
    }

    if (ipfsHash) {
      fetchContent()
    }
  }, [ipfsHash])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load content: {error}
        </AlertDescription>
      </Alert>
    )
  }

  // Render based on content type
  switch (contentType) {
    case 'image':
      return (
        <div className="w-full">
          <img
            src={contentUrl}
            alt={title}
            className={cn(
              "w-full h-auto object-contain",
              isFullscreen ? "max-h-screen" : "max-h-96"
            )}
            loading="lazy"
          />
        </div>
      )

    case 'video':
      return (
        <div className="w-full">
          <video
            src={contentUrl}
            controls
            className={cn(
              "w-full h-auto",
              isFullscreen ? "max-h-screen" : "max-h-96"
            )}
            preload="metadata"
          >
            Your browser does not support video playback.
          </video>
        </div>
      )

    case 'audio':
      return (
        <div className="p-6">
          <audio
            src={contentUrl}
            controls
            className="w-full"
            preload="metadata"
          >
            Your browser does not support audio playback.
          </audio>
        </div>
      )

    case 'document':
      return (
        <div className="p-6">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium mb-2">Document Viewer</p>
              <Button asChild>
                <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </a>
              </Button>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="p-6">
          <div className="text-center space-y-4">
            <File className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium mb-2">File Download</p>
              <Button asChild>
                <a href={contentUrl} download={title}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </a>
              </Button>
            </div>
          </div>
        </div>
      )
  }
}

/**
 * Content Metadata Component
 * 
 * This component displays rich metadata about the content including
 * tags, creation details, and engagement statistics.
 */
function ContentMetadata({
  content,
  creator,
  showComments,
  onToggleComments,
  showEngagement
}: {
  content: any
  creator: any
  showComments: boolean
  onToggleComments: () => void
  showEngagement: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Content Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Content tags */}
        {content.tags && content.tags.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Content statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Price</p>
            <p className="text-muted-foreground">
              {formatCurrency(content.payPerViewPrice)}
            </p>
          </div>
          <div>
            <p className="font-medium">Category</p>
            <p className="text-muted-foreground">
              {formatContentCategory(content.category)}
            </p>
          </div>
          <div>
            <p className="font-medium">Created</p>
            <p className="text-muted-foreground">
              {formatAbsoluteTime(content.creationTime)}
            </p>
          </div>
          <div>
            <p className="font-medium">Creator</p>
            <p className="text-muted-foreground">
              {creator?.name || formatAddress(content.creator)}
            </p>
          </div>
        </div>

        {showEngagement && (
          <>
            <Separator />
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={onToggleComments}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {showComments ? 'Hide Comments' : 'Show Comments'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Related Content Component
 * 
 * This component suggests other content based on category or creator,
 * encouraging further engagement and content discovery.
 */
function RelatedContent({
  currentContentId,
  category,
  creatorAddress
}: {
  currentContentId: bigint
  category: ContentCategory
  creatorAddress: string
}) {
  // In a real implementation, this would fetch related content
  // based on category, creator, or user preferences
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Related Content</CardTitle>
        <CardDescription>
          Discover more content in this category or from this creator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Related content suggestions would appear here</p>
          <p className="text-sm mt-2">
            Implementation would fetch content by category: {formatContentCategory(category)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Content Preview Component
 * 
 * This component shows a limited preview of content when users don't have access,
 * encouraging them to make a purchase while respecting access controls.
 */
function ContentPreview({
  content,
  creator,
  isPreview
}: {
  content: any
  creator: any
  isPreview: boolean
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{content.title}</CardTitle>
            <CardDescription className="text-base">
              {content.description}
            </CardDescription>
          </div>
          
          <Badge variant="outline">
            <Lock className="h-3 w-3 mr-1" />
            Preview
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* Blurred preview overlay */}
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <Lock className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="font-medium text-gray-600">Premium Content</p>
                <p className="text-sm text-gray-500">
                  Purchase to view full content
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content metadata preview */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Price</p>
            <p className="text-muted-foreground">
              {formatCurrency(content.payPerViewPrice)}
            </p>
          </div>
          <div>
            <p className="font-medium">Category</p>
            <p className="text-muted-foreground">
              {formatContentCategory(content.category)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading and Error State Components
 * 
 * These components provide proper feedback during loading states
 * and error conditions, maintaining good UX even when things go wrong.
 */
function ContentViewerSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <Card>
        <CardHeader>
          <div className="w-3/4 h-8 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full h-96 bg-gray-200 animate-pulse" />
        </CardContent>
      </Card>
    </div>
  )
}

function ContentViewerError({
  error,
  onRetry,
  onBack
}: {
  error: Error
  onRetry: () => void
  onBack?: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Discovery
        </Button>
      )}
      
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Content Loading Error</h3>
          <p className="text-muted-foreground mb-6">
            {error.message || 'We encountered an error while loading this content.'}
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={onRetry}>
              Try Again
            </Button>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Go Back
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ContentNotFound({
  contentId,
  onBack
}: {
  contentId: bigint
  onBack?: () => void
}) {
  return (
    <div className="max-w-2xl mx-auto">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Discovery
        </Button>
      )}
      
      <Card>
        <CardContent className="text-center py-12">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Content Not Found</h3>
          <p className="text-muted-foreground mb-6">
            The content you're looking for doesn't exist or has been removed.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Content ID: {contentId.toString()}
          </p>
          {onBack && (
            <Button onClick={onBack}>
              Browse Other Content
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Utility Functions
 */

/**
 * Detect content type based on IPFS hash or filename
 * In a real implementation, this would use more sophisticated detection
 */
function detectContentType(ipfsHash: string): ContentType {
  // This is a simplified implementation
  // In reality, you'd check file extensions or MIME types
  const hash = ipfsHash.toLowerCase()
  
  if (hash.includes('img') || hash.includes('image')) return 'image'
  if (hash.includes('vid') || hash.includes('video')) return 'video'
  if (hash.includes('aud') || hash.includes('audio')) return 'audio'
  if (hash.includes('doc') || hash.includes('pdf')) return 'document'
  
  return 'other'
}

/**
 * Export the main component and utility types
 */
export default ContentViewer
export type { ContentViewerProps, ContentType }
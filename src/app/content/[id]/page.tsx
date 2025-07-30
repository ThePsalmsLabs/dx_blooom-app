// src/app/content/[id]/page.tsx
// Component 2.4: Cast to Frame Flow - Content Page Enhancement
// Implements Mini App metadata with Frame v1 backward compatibility

import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getContractAddresses } from '@/lib/contracts/config'
import type { Content } from '@/types/contracts'

/**
 * Content Page Props Interface
 * 
 * This interface defines the parameters that the content page receives
 * from Next.js dynamic routing, ensuring type safety for content ID handling.
 */
interface ContentPageProps {
  readonly params: {
    readonly id: string
  }
  readonly searchParams: {
    readonly [key: string]: string | string[] | undefined
  }
}

/**
 * Frame State Interface
 * 
 * This interface defines the structure of Frame interaction state
 * that gets encoded in Frame metadata for maintaining workflow context.
 */
interface FrameState {
  readonly contentId: string
  readonly step: 'preview' | 'purchase' | 'confirmation' | 'access'
  readonly userContext?: {
    readonly address?: string
    readonly hasAccess?: boolean
  }
}

/**
 * Mini App Embed Metadata Interface
 * 
 * This interface defines the structure for Mini App metadata
 * according to the current Farcaster Mini Apps specification.
 */
interface MiniAppEmbed {
  readonly version: '1'
  readonly url: string
  readonly metadata: {
    readonly title: string
    readonly description: string
    readonly image: string
    readonly action: {
      readonly type: 'post'
      readonly url: string
    }
    readonly button?: {
      readonly title: string
    }
  }
}

/**
 * Content Fetching Function
 * 
 * This function fetches content data using your existing API infrastructure.
 * It demonstrates how Component 2.4 leverages your Phase 1 content API
 * without duplicating business logic or data access patterns.
 */
async function fetchContentById(contentId: string): Promise<Content | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    
    // Use your existing content API endpoint
    const response = await fetch(`${baseUrl}/api/content/${contentId}`, {
      // Enable caching for better performance
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch content: ${response.status}`)
    }

    const content = await response.json()
    return content as Content
  } catch (error) {
    console.error('Error fetching content:', error)
    return null
  }
}

/**
 * Generate Frame Metadata for Mini Apps and Frame v1 Compatibility
 * 
 * This function creates comprehensive metadata that supports both the new
 * Mini Apps standard and provides backward compatibility with Frame v1.
 * The metadata enables content to be shared as interactive experiences
 * within Farcaster feeds.
 */
function generateFrameMetadata(content: Content, contentId: string): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_URL is required for Frame functionality')
  }

  // Create frame state for interaction context
  const initialFrameState: FrameState = {
    contentId,
    step: 'preview'
  }
  
  const encodedState = Buffer.from(JSON.stringify(initialFrameState)).toString('base64')
  
  // Generate dynamic image URL for content preview
  const imageUrl = `${baseUrl}/api/og/content/${contentId}`
  
  // Format price for display
  const priceDisplay = content.payPerViewPrice > BigInt(0) 
    ? `$${(Number(content.payPerViewPrice) / 1e6).toFixed(2)} USDC`
    : 'Free'

  // Create Mini App embed metadata (primary standard)
  const miniAppEmbed: MiniAppEmbed = {
    version: '1',
    url: `${baseUrl}/content/${contentId}`,
    metadata: {
      title: content.title,
      description: `${content.description.slice(0, 100)}... | ${priceDisplay}`,
      image: imageUrl,
      action: {
        type: 'post',
        url: `${baseUrl}/api/farcaster/frame/${contentId}`
      },
      button: {
        title: content.payPerViewPrice > BigInt(0) ? `Read Full - ${priceDisplay}` : 'Read Content'
      }
    }
  }

  return {
    title: content.title,
    description: content.description,
    
    // Open Graph metadata for general social sharing
    openGraph: {
      title: content.title,
      description: content.description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: content.title,
        }
      ],
      type: 'article',
      siteName: 'Content Platform',
    },
    
    // Twitter metadata
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: [imageUrl],
    },

    // Farcaster-specific metadata
    other: {
      // Primary: Mini App metadata (new standard)
      'fc:miniapp': JSON.stringify(miniAppEmbed),
      
      // Backward compatibility: Frame v1 metadata (deprecated but supported until March 2025)
      'fc:frame': 'vNext',
      'fc:frame:image': imageUrl,
      'fc:frame:image:aspect_ratio': '1.91:1',
      'fc:frame:post_url': `${baseUrl}/api/farcaster/frame/${contentId}`,
      'fc:frame:state': encodedState,
      
      // Frame buttons based on content pricing
      ...(content.payPerViewPrice > BigInt(0) ? {
        'fc:frame:button:1': `Purchase - ${priceDisplay}`,
        'fc:frame:button:1:action': 'post',
        'fc:frame:button:2': 'View Details',
        'fc:frame:button:2:action': 'post',
      } : {
        'fc:frame:button:1': 'Read Content',
        'fc:frame:button:1:action': 'post',
        'fc:frame:button:2': 'Share',
        'fc:frame:button:2:action': 'link',
        'fc:frame:button:2:target': `${baseUrl}/content/${contentId}`,
      }),
    }
  }
}

/**
 * Metadata Generation Function for Next.js
 * 
 * This function is called by Next.js during the build process and at runtime
 * to generate appropriate metadata for each content page. It ensures that
 * content shared on Farcaster becomes interactive Mini Apps and Frames.
 */
export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const contentId = params.id
  
  // Validate content ID format
  if (!contentId || isNaN(Number(contentId))) {
    return {
      title: 'Content Not Found',
      description: 'The requested content could not be found.',
    }
  }

  // Fetch content data
  const content = await fetchContentById(contentId)
  
  if (!content) {
    return {
      title: 'Content Not Found',
      description: 'The requested content could not be found.',
    }
  }

  // Generate comprehensive metadata for social sharing and Farcaster integration
  return generateFrameMetadata(content, contentId)
}

/**
 * Content Access Verification
 * 
 * This function checks if the user has access to the content based on
 * their wallet address and purchase history. It leverages your existing
 * access control infrastructure from Phase 1.
 */
async function verifyContentAccess(
  contentId: string, 
  userAddress?: string
): Promise<{ hasAccess: boolean; requiresPurchase: boolean }> {
  if (!userAddress) {
    return { hasAccess: false, requiresPurchase: true }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    
    // Use your existing access verification API
    const response = await fetch(
      `${baseUrl}/api/content/${contentId}/access?address=${userAddress}`,
      { next: { revalidate: 60 } } // Cache for 1 minute
    )

    if (!response.ok) {
      return { hasAccess: false, requiresPurchase: true }
    }

    const accessData = await response.json()
    return {
      hasAccess: accessData.hasAccess || false,
      requiresPurchase: !accessData.hasAccess
    }
  } catch (error) {
    console.error('Error verifying content access:', error)
    return { hasAccess: false, requiresPurchase: true }
  }
}

/**
 * Content Page Component
 * 
 * This component renders the complete content viewing experience,
 * handling both regular web visitors and Frame/Mini App contexts.
 * It demonstrates how the same component can serve multiple interaction
 * patterns while maintaining consistent functionality.
 */
export default async function ContentPage({ params, searchParams }: ContentPageProps) {
  const contentId = params.id
  
  // Validate content ID
  if (!contentId || isNaN(Number(contentId))) {
    notFound()
  }

  // Fetch content data
  const content = await fetchContentById(contentId)
  
  if (!content) {
    notFound()
  }

  // Detect Frame/Mini App context from headers
  const headersList = headers()
  const userAgent = (await headersList).get('user-agent') || ''
  const isFrameContext = userAgent.includes('farcasterxyz') || searchParams.frame === 'true'
  
  // Get user address from search params (passed by Frame interactions)
  const userAddress = searchParams.address as string | undefined
  
  // Verify content access
  const accessInfo = await verifyContentAccess(contentId, userAddress)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        {/* Content Header */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Content ID: {contentId}</span>
              {isFrameContext && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Farcaster Frame
                </span>
              )}
            </div>
            
            <h1 className="text-4xl font-bold leading-tight">{content.title}</h1>
            
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>By: {content.creator}</span>
              <span>•</span>
              <span>Category: {content.category}</span>
              {content.payPerViewPrice > BigInt(0) && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-green-600">
                    ${(Number(content.payPerViewPrice) / 1e6).toFixed(2)} USDC
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Content Preview/Access */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">{content.description}</p>
              
              {/* Access Control Logic */}
              {accessInfo.hasAccess ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <span>✅</span>
                      <span className="font-medium">Access Granted</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                      You have full access to this content.
                    </p>
                  </div>
                  
                  {/* Full content would be displayed here */}
                  <div className="prose max-w-none">
                    <p className="text-muted-foreground">
                      [Full content would be displayed here based on IPFS hash: {content.ipfsHash}]
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <span>🔒</span>
                      <span className="font-medium">Premium Content</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      Purchase access to read the full content.
                    </p>
                  </div>
                  
                  {/* Purchase Call-to-Action */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      onClick={() => {
                        // This would trigger your existing purchase flow
                        window.location.href = `/purchase/${contentId}`
                      }}
                    >
                      Purchase Access - ${(Number(content.payPerViewPrice) / 1e6).toFixed(2)} USDC
                    </button>
                    
                    <button 
                      className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        window.location.href = `/creator/${content.creator}`
                      }}
                    >
                      View Creator Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Frame Context Information */}
          {isFrameContext && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-800">
                <span>🖼️</span>
                <span className="font-medium">Farcaster Frame Context</span>
              </div>
              <p className="text-purple-700 text-sm mt-1">
                This content is being viewed within a Farcaster Frame. 
                Interactions are optimized for the social feed experience.
              </p>
            </div>
          )}

          {/* Debug Information (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-50 border rounded-lg p-4">
              <summary className="font-medium cursor-pointer">Debug Information</summary>
              <div className="mt-4 space-y-2 text-sm font-mono">
                <div>Content ID: {contentId}</div>
                <div>User Address: {userAddress || 'Not provided'}</div>
                <div>Has Access: {accessInfo.hasAccess.toString()}</div>
                <div>Frame Context: {isFrameContext.toString()}</div>
                <div>Content Price: {content.payPerViewPrice.toString()} wei</div>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
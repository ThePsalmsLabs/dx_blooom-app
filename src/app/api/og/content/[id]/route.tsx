// src/app/api/og/content/[id]/route.ts
// Dynamic Open Graph Image Generation for Frame Metadata
// Leverages Vercel's @vercel/og for high-performance image generation

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

/**
 * Content Data Interface for Image Generation
 * 
 * This interface defines the structure of content data needed
 * for generating compelling Open Graph images that represent
 * your content within Farcaster Frames and social shares.
 */
interface ContentForImage {
  readonly title: string
  readonly description: string
  readonly category: number
  readonly payPerViewPrice: bigint
  readonly creator: string
  readonly isActive: boolean
}

/**
 * Category Display Names
 * 
 * This mapping converts category numbers to human-readable names
 * for display in the generated images, making the content more
 * accessible and visually appealing to users browsing social feeds.
 */
const CATEGORY_NAMES: Record<number, string> = {
  0: 'Article',
  1: 'Video',
  2: 'Audio',
  3: 'Image',
  4: 'Document',
  5: 'Course',
  6: 'Newsletter',
  7: 'Research'
} as const

/**
 * Content Fetching Function
 * 
 * This function retrieves content data for image generation,
 * demonstrating how image generation can leverage your existing
 * content API infrastructure without duplicating data access logic.
 */
async function fetchContentForImage(contentId: string): Promise<ContentForImage | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    
    // Use your existing content API endpoint
    const response = await fetch(`${baseUrl}/api/content/${contentId}`)

    if (!response.ok) {
      return null
    }

    const content = await response.json()
    return content as ContentForImage
  } catch (error) {
    console.error('Error fetching content for image generation:', error)
    return null
  }
}

/**
 * Price Formatting Utility
 * 
 * This function formats content prices for display in generated images,
 * converting from wei units to human-readable USDC amounts.
 */
function formatPriceForImage(priceWei: bigint): string {
  if (priceWei === BigInt(0)) {
    return 'Free'
  }
  
  const priceUSDC = Number(priceWei) / 1e6
  return `$${priceUSDC.toFixed(2)} USDC`
}

/**
 * GET Handler for Dynamic Open Graph Image Generation
 * 
 * This handler generates custom Open Graph images for each piece of content,
 * ensuring that when content is shared on Farcaster or other social platforms,
 * it displays with compelling, branded visuals that encourage engagement.
 * 
 * The implementation uses Vercel's @vercel/og library for performant image
 * generation that can handle high traffic while maintaining fast response times.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unwrappedParams = await params
    const contentId = unwrappedParams.id
    
    // Validate content ID
    if (!contentId || isNaN(Number(contentId))) {
      return new ImageResponse(
        generateErrorImage('Invalid Content ID'), // Argument of type '{}' is not assignable to parameter of type 'ReactElement<unknown, string | JSXElementConstructor<any>>'. Type '{}' is missing the following properties from type 'ReactElement<unknown, string | JSXElementConstructor<any>>': type, props, keyts(2345)
        {
          width: 1200,
          height: 630,
          headers: {
            'Cache-Control': 'public, immutable, no-transform, max-age=300'
          }
        }
      )
    }

    // Fetch content data
    const content = await fetchContentForImage(contentId)
    
    if (!content) {
      return new ImageResponse(
        generateErrorImage('Content Not Found'),
        {
          width: 1200,
          height: 630,
          headers: {
            'Cache-Control': 'public, immutable, no-transform, max-age=300'
          }
        }
      )
    }

    // Generate the main content image
    return new ImageResponse(
      generateContentImage(content),
      {
        width: 1200,
        height: 630,
        headers: {
          // Cache for 5 minutes to balance freshness with performance
          'Cache-Control': 'public, immutable, no-transform, max-age=300'
        }
      }
    )

  } catch (error) {
    console.error('Error generating Open Graph image:', error)
    
    return new ImageResponse(
      generateErrorImage('Image Generation Error'),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, immutable, no-transform, max-age=60'
        }
      }
    )
  }
}

/**
 * Content Image Generation
 * 
 * This function creates the JSX structure for the main content image,
 * designing a visually appealing layout that represents your content
 * effectively within social feeds and Frame previews.
 * 
 * Note: The style objects use React.CSSProperties compatible syntax
 * but are optimized for Satori's SVG rendering requirements.
 */
function generateContentImage(content: ContentForImage) {
  const categoryName = CATEGORY_NAMES[content.category] || 'Content'
  const priceDisplay = formatPriceForImage(content.payPerViewPrice)
  const isPaid = content.payPerViewPrice > BigInt(0)

  return (
    <div // Cannot find name 'div'.ts(2304)
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontSize: 32,
        fontWeight: 600,
        color: 'white',
        padding: '40px',
        position: 'relative'
      }}
    >
      {/* Background Pattern - Using CSS-in-JS for Satori compatibility */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 2px, transparent 2px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Content Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '90%',
          zIndex: 1
        }}
      >
        {/* Category Badge */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            padding: '8px 20px',
            fontSize: '18px',
            fontWeight: 500,
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          {categoryName}
        </div>

        {/* Title - Truncated with proper overflow handling */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: '20px',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            maxWidth: '100%',
            textAlign: 'center',
            wordBreak: 'break-word',
            hyphens: 'auto'
          }}
        >
          {content.title.length > 80 ? `${content.title.slice(0, 77)}...` : content.title}
        </div>

        {/* Description - Properly truncated */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: 400,
            lineHeight: 1.4,
            marginBottom: '30px',
            opacity: 0.9,
            maxWidth: '100%',
            textAlign: 'center'
          }}
        >
          {content.description.length > 120 ? `${content.description.slice(0, 117)}...` : content.description}
        </div>

        {/* Price and Action Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}
        >
          {/* Price Badge */}
          <div
            style={{
              backgroundColor: isPaid ? '#10B981' : '#6366F1',
              borderRadius: '25px',
              padding: '12px 24px',
              fontSize: '20px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            {priceDisplay}
          </div>
          
          {/* Content Type Indicator */}
          <div
            style={{
              fontSize: '18px',
              opacity: 0.8
            }}
          >
            {isPaid ? 'Premium Content' : 'Free Access'}
          </div>
        </div>

        {/* Creator Info - Properly formatted address */}
        <div
          style={{
            fontSize: '16px',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>
            By {content.creator.slice(0, 6)}...{content.creator.slice(-4)}
          </span>
        </div>
      </div>

      {/* Platform Branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          fontSize: '14px',
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: 'white',
            borderRadius: '4px'
          }}
        />
        <span>Content Platform</span>
      </div>
    </div>
  )
}

/**
 * Error Image Generation
 * 
 * This function creates a fallback image for error scenarios,
 * ensuring that even when content cannot be loaded, users still
 * see a professional, branded image that maintains your platform's
 * visual identity.
 */
function generateErrorImage(errorMessage: string) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        fontSize: 32,
        fontWeight: 600,
        color: 'white',
        textAlign: 'center',
        padding: '40px'
      }}
    >
      {/* Error Icon */}
      <div
        style={{
          fontSize: '64px',
          marginBottom: '20px'
        }}
      >
        ⚠️
      </div>
      
      {/* Error Title */}
      <div
        style={{
          fontSize: '36px',
          fontWeight: 700,
          marginBottom: '10px'
        }}
      >
        {errorMessage}
      </div>
      
      {/* Error Subtitle */}
      <div
        style={{
          fontSize: '20px',
          opacity: 0.9
        }}
      >
        Please try again or contact support
      </div>
    </div>
  )
}
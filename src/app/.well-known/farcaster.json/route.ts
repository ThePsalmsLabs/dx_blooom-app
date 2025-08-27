// src/app/.well-known/farcaster.json/route.ts
import { NextResponse } from 'next/server'
import { getContractAddresses } from '../../../lib/contracts/config'

/**
 * Farcaster Manifest Interface
 * 
 * This interface defines the complete structure of a Farcaster manifest according
 * to the official Farcaster protocol specifications. Each field serves a specific
 * purpose in enabling Frame functionality and Mini App integration within the
 * Farcaster ecosystem. Think of this as the contract between your platform and
 * Farcaster clients about how they should interact with your content.
 */
interface FarcasterManifest {
  /** Account association verification for domain ownership */
  readonly accountAssociation: {
    readonly header: string
    readonly payload: string
    readonly signature: string
  }
  
  /** Frame configuration for content preview and interaction */
  readonly frame: {
    readonly version: string
    readonly name: string
    readonly iconUrl: string
    readonly homeUrl: string
    readonly webhookUrl: string
    readonly splashImageUrl?: string
    readonly splashBackgroundColor?: string
  }
  
  /** Mini App configuration for embedded application functionality */
  readonly miniApp: {
    readonly url: string
    readonly name: string
    readonly description: string
    readonly iconUrl: string
    readonly categories: readonly string[]
    readonly socialLinks?: {
      readonly twitter?: string
      readonly github?: string
      readonly website?: string
    }
  }
  
  /** Platform-specific configuration and capabilities */
  readonly platform: {
    readonly contentDiscoveryEndpoint: string
    readonly paymentProcessingEndpoint: string
    readonly subscriptionEndpoint: string
    readonly supportedPaymentMethods: readonly string[]
    readonly supportedNetworks: readonly string[]
  }
}

/**
 * Manifest Configuration Builder
 * 
 * This function constructs the Farcaster manifest by combining your platform's
 * capabilities with Farcaster protocol requirements. It demonstrates how to
 * transform your existing infrastructure into social commerce capabilities
 * without duplicating functionality or creating parallel systems.
 * 
 * The builder pattern here ensures that all required fields are populated
 * correctly and that the manifest accurately represents your platform's
 * capabilities to Farcaster clients.
 */
function buildFarcasterManifest(): FarcasterManifest {
  // Get the base URL for your platform from environment configuration
  // This is the same URL configuration pattern used throughout your application
  const baseUrl = process.env.NEXT_PUBLIC_URL
  
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_URL environment variable is required for Farcaster integration')
  }

  // Ensure the URL doesn't have a trailing slash for consistent endpoint construction
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  // Get contract addresses to include in platform capabilities
  // This leverages your existing contract configuration system
  const network = process.env.NETWORK as 'base' | 'base-sepolia'
  const chainId = network === 'base' ? 8453 : 84532
  const _contractAddresses = getContractAddresses(chainId)

  // Determine the appropriate network identifiers for Farcaster
  const supportedNetworks = network === 'base' ? ['base', 'base-mainnet'] : ['base-sepolia', 'base-testnet']

  // Build the comprehensive manifest that describes your platform's capabilities
  const manifest: FarcasterManifest = {
    // Account association proves you own the domain serving this manifest
    // This prevents impersonation and ensures that Farcaster clients can trust
    // that frames and mini apps are actually served by your legitimate platform
    accountAssociation: {
      header: "eyJmaWQiOjg3Mjg2MiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEFDNzNkZTEzN0NiZjQ4MTgxMzY2RWI4MjVjNGYzNTNiMzFkODI5NzYifQ",
      payload: "eyJkb21haW4iOiJkeGJsb29tLmNvbSJ9",
      signature: "MHhlNGI5NmQ2ZTBjZDM0OGE0NjdhZDYxYTAxOGIxY2UwZmRmOTdkZjhkYjYwNzI0YTgxYThiNmMyMTI2NjU4ZGRmM2ZmYmI1ZTJmNzQ5NTMwMzllOWEzZDlkZTVkNzI3ZTU2ZWU1OTlmZTNmMWZlNmFmMWY2YjcyNmQxMDY0NmUxMTFj"
    },

    // Frame configuration enables your content to be previewed and interacted with
    // directly within Farcaster feeds. This is where the magic of social commerce
    // happens - users can discover, preview, and purchase content without leaving
    // their social experience
    frame: {
      version: "1.0.0",
      name: "Premium Content Platform",
      iconUrl: `${normalizedBaseUrl}/icons/farcaster-frame-icon.png`,
      homeUrl: normalizedBaseUrl,
      
      // This webhook URL is where Farcaster will send frame interaction events
      // When users click buttons in your frames, Farcaster sends the interaction
      // details to this endpoint so your platform can respond appropriately
      webhookUrl: `${normalizedBaseUrl}/api/farcaster/webhook`,
      
      // Optional splash screen configuration for enhanced frame presentation
      splashImageUrl: `${normalizedBaseUrl}/images/platform-splash.png`,
      splashBackgroundColor: "#1a1a1a"
    },

    // Mini App configuration enables your platform to run as an embedded application
    // within Farcaster clients. This provides a more comprehensive experience than
    // frames alone, allowing for complex interactions and full application functionality
    // within the social environment
    miniApp: {
      url: `${normalizedBaseUrl}/mini`,
      name: "Bloom",
      description: "Discover and purchase premium content with instant USDC payments. Support creators through direct purchases and subscriptions.",
      iconUrl: `${normalizedBaseUrl}/icons/miniapp-icon.png`,
      
      // Categories help Farcaster clients organize and discover your mini app
      // These categories should accurately reflect your platform's primary functions
      categories: ["social", "payments", "content", "creator-tools"] as const,
      
      // Social links provide additional context and credibility for your platform
      // These links appear in mini app discovery interfaces within Farcaster clients
      socialLinks: {
        website: normalizedBaseUrl,
        // Add your actual social links when available
        // twitter: "https://twitter.com/yourplatform",
        // github: "https://github.com/yourorg/platform"
      }
    },

    // Platform-specific configuration describes your unique capabilities and
    // integration points. This section enables Farcaster clients to understand
    // exactly how to interact with your platform's API endpoints and what
    // functionality is available through social commerce interfaces
    platform: {
      // These endpoints leverage the Phase 1 infrastructure we built
      // Notice how they map directly to the API routes we implemented
      contentDiscoveryEndpoint: `${normalizedBaseUrl}/api/content`,
      paymentProcessingEndpoint: `${normalizedBaseUrl}/api/protected/content`,
      subscriptionEndpoint: `${normalizedBaseUrl}/api/subscription`,
      
      // Supported payment methods reflect your platform's USDC-based architecture
      // This tells Farcaster clients what payment options users have when
      // purchasing content through social interfaces
      supportedPaymentMethods: [
        "usdc", 
        "base-usdc", 
        "x402-payment-proof",
        "commerce-protocol"
      ] as const,
      
      // Supported networks align with your contract deployment strategy
      // This ensures that social commerce transactions use the same networks
      // and contracts as your main platform
      supportedNetworks
    }
  }

  return manifest
}

/**
 * GET Handler for Farcaster Manifest
 * 
 * This handler serves the Farcaster manifest at the well-known location that
 * Farcaster clients expect. The /.well-known/farcaster.json endpoint is a
 * standardized location that follows web conventions for service discovery,
 * similar to how /.well-known/robots.txt works for web crawlers.
 * 
 * The handler demonstrates several important patterns for social protocol
 * integration: proper HTTP headers, caching considerations, error handling,
 * and response formatting that ensures compatibility with various Farcaster
 * clients and infrastructure.
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Build the manifest using your platform's current configuration
    // This ensures that the manifest always reflects your actual capabilities
    // and endpoint availability rather than serving static, potentially outdated information
    const manifest = buildFarcasterManifest()

    // Validate that all required fields are present before serving the manifest
    // This validation prevents partial or corrupted manifests from being served
    // to Farcaster clients, which could result in broken social commerce experiences
    const requiredFields = [
      manifest.accountAssociation?.header,
      manifest.accountAssociation?.payload,
      manifest.frame?.version,
      manifest.frame?.name,
      manifest.frame?.webhookUrl,
      manifest.miniApp?.url,
      manifest.miniApp?.name,
      manifest.platform?.contentDiscoveryEndpoint
    ]

    const missingFields = requiredFields.filter(field => !field)
    if (missingFields.length > 0) {
      console.error('Manifest validation failed: missing required fields')
      return NextResponse.json(
        { 
          error: 'Manifest configuration incomplete',
          details: 'Required fields are missing from manifest configuration'
        },
        { status: 500 }
      )
    }

    // Return the manifest with appropriate HTTP headers for optimal caching and compatibility
    // The Content-Type header ensures that Farcaster clients parse the response correctly
    // The Cache-Control header balances performance with the need for manifest updates
    // to be reflected in a reasonable timeframe
    return NextResponse.json(manifest, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 hour to improve performance while allowing reasonable update frequency
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        // CORS headers enable cross-origin requests from Farcaster clients
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })

  } catch (error) {
    // Log detailed error information for debugging while providing clean responses to clients
    console.error('Error serving Farcaster manifest:', error)

    // Handle specific configuration errors with appropriate guidance
    if (error instanceof Error) {
      if (error.message.includes('NEXT_PUBLIC_URL')) {
        return NextResponse.json(
          { 
            error: 'Platform configuration error',
            details: 'Base URL configuration is required for Farcaster integration'
          },
          { status: 500 }
        )
      }

      if (error.message.includes('contract')) {
        return NextResponse.json(
          { 
            error: 'Contract configuration error',
            details: 'Smart contract addresses are required for platform capabilities'
          },
          { status: 500 }
        )
      }
    }

    // Generic error response for unexpected issues
    return NextResponse.json(
      { 
        error: 'Manifest generation failed',
        details: 'An unexpected error occurred while generating the Farcaster manifest'
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS Handler for CORS Support
 * 
 * This handler enables proper cross-origin resource sharing (CORS) for the manifest
 * endpoint. Farcaster clients may make preflight requests to check CORS policies
 * before fetching the manifest, and this handler ensures those requests are
 * handled correctly.
 * 
 * Proper CORS support is essential for social protocol integration because
 * Farcaster clients operate from different origins than your platform and need
 * permission to access your manifest and API endpoints.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400' // Cache preflight response for 24 hours
    }
  })
}

/**
 * Disable other HTTP methods for security and clarity
 * 
 * The manifest endpoint should only respond to GET requests (for serving the manifest)
 * and OPTIONS requests (for CORS preflight). Explicitly handling other methods
 * prevents confusion and potential security issues from unexpected request types.
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', details: 'Manifest endpoint only supports GET requests' },
    { status: 405, headers: { 'Allow': 'GET, OPTIONS' } }
  )
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', details: 'Manifest endpoint only supports GET requests' },
    { status: 405, headers: { 'Allow': 'GET, OPTIONS' } }
  )
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed', details: 'Manifest endpoint only supports GET requests' },
    { status: 405, headers: { 'Allow': 'GET, OPTIONS' } }
  )
}
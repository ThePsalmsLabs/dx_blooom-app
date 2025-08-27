// src/app/.well-known/farcaster.json/route.ts
import { NextResponse } from 'next/server'
import { getContractAddresses } from '../../../lib/contracts/config'

/**
 * Farcaster Manifest Interface
 * 
 * This interface defines the complete structure of a Farcaster manifest according
 * to the official Farcaster protocol specifications. Each field serves a specific
 * purpose in enabling Mini App functionality within the Farcaster ecosystem.
 */
interface FarcasterManifest {
  /** Account association verification for domain ownership */
  readonly accountAssociation: {
    readonly header: string
    readonly payload: string
    readonly signature: string
  }
  
  /** Mini App configuration for embedded application functionality */
  readonly miniapp: {
    readonly version: string
    readonly name: string
    readonly homeUrl: string
    readonly iconUrl: string
    readonly splashImageUrl?: string
    readonly splashBackgroundColor?: string
    readonly webhookUrl?: string
    readonly subtitle?: string
    readonly description?: string
    readonly screenshotUrls?: readonly string[]
    readonly primaryCategory?: string
    readonly tags?: readonly string[]
    readonly heroImageUrl?: string
    readonly tagline?: string
    readonly ogTitle?: string
    readonly ogDescription?: string
    readonly ogImageUrl?: string
    readonly castShareUrl?: string
    readonly noindex?: boolean
    readonly requiredChains?: readonly string[]
    readonly requiredCapabilities?: readonly string[]
    readonly canonicalDomain?: string
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
    // that mini apps are actually served by your legitimate platform
    accountAssociation: {
      header: "eyJmaWQiOjg3Mjg2MiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEFDNzNkZTEzN0NiZjQ4MTgxMzY2RWI4MjVjNGYzNTNiMzFkODI5NzYifQ",
      payload: "eyJkb21haW4iOiJkeGJsb29tLmNvbSJ9",
      signature: "MHhlNGI5NmQ2ZTBjZDM0OGE0NjdhZDYxYTAxOGIxY2UwZmRmOTdkZjhkYjYwNzI0YTgxYThiNmMyMTI2NjU4ZGRmM2ZmYmI1ZTJmNzQ5NTMwMzllOWEzZDlkZTVkNzI3ZTU2ZWU1OTlmZTNmMWZlNmFmMWY2YjcyNmQxMDY0NmUxMTFj"
    },

    // Mini App configuration enables your platform to run as an embedded application
    // within Farcaster clients. This provides a comprehensive experience for
    // social commerce, allowing users to discover, preview, and purchase content
    // directly within the Farcaster ecosystem
    miniapp: {
      version: "1",
      name: "Bloom",
      homeUrl: `${normalizedBaseUrl}/mini`,
      iconUrl: `${normalizedBaseUrl}/images/miniapp-icon-192.png`,
      splashImageUrl: `${normalizedBaseUrl}/images/miniapp-splash.png`,
      splashBackgroundColor: "#FF6B35",
      webhookUrl: `${normalizedBaseUrl}/api/farcaster/webhook`,
      subtitle: "Premium content, pay with USDC",
      description: "Discover premium content from top creators. Purchase with instant USDC payments on Base. Support creators directly through subscriptions and one-time purchases.",
      primaryCategory: "social",
      tags: ["content", "social", "subscription", "onchain", "premium"],
      heroImageUrl: `${normalizedBaseUrl}/images/miniapp-og-image.png`,
      tagline: "Premium Content, pay with USDC",
      ogTitle: "Bloom - Create, Share and Earn",
      ogDescription: "Discover premium content from top creators. Purchase with instant USDC payments on Base.",
      ogImageUrl: `${normalizedBaseUrl}/images/miniapp-og-image.png`,
      castShareUrl: `${normalizedBaseUrl}/mini/share`,
      requiredChains: ["eip155:8453"], // Base mainnet
      requiredCapabilities: [
        "actions.signIn",
        "wallet.getEthereumProvider",
        "actions.swapToken"
      ],
      canonicalDomain: "dxbloom.com"
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
      manifest.accountAssociation?.signature,
      manifest.miniapp?.version,
      manifest.miniapp?.name,
      manifest.miniapp?.homeUrl,
      manifest.miniapp?.iconUrl
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
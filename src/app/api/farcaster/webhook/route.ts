// src/app/api/farcaster/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateFramesMessage } from '@airstack/frames'
import type { FrameActionMessage } from '@farcaster/core'

/**
 * Farcaster Frame Message Interface
 * 
 * This interface defines the structure of messages that Farcaster sends to your
 * webhook when users interact with your Frames. Understanding this structure is
 * essential for processing Frame interactions correctly and securely.
 */
interface FrameMessage {
  /** The message content and verification data */
  readonly message: {
    readonly data: {
      readonly fid: number // Farcaster user ID
      readonly timestamp: number // Unix timestamp of interaction
      readonly network: 'FARCASTER_NETWORK_MAINNET' | 'FARCASTER_NETWORK_TESTNET'
      readonly frameActionBody: {
        readonly url: string // URL of the Frame that was interacted with
        readonly buttonIndex: number // Which button was clicked (1-4)
        readonly castId: {
          readonly fid: number // FID of the user who created the cast
          readonly hash: string // Hash of the cast containing the Frame
        }
        readonly inputText?: string // Text input if Frame has input field
        readonly state?: string // Serialized state data from Frame
        readonly transactionId?: string // Transaction ID if action involved payment
        readonly address?: string // User's connected wallet address
      }
    }
    readonly hash: string // Message hash for verification
    readonly hashScheme: string // Hashing scheme used
    readonly signature: string // Cryptographic signature
    readonly signatureScheme: string // Signature scheme used
    readonly signer: string // Public key of the signer
  }
  /** Whether the message signature is valid */
  readonly isValid: boolean
  /** Any verification errors */
  readonly error?: string
}

/**
 * Frame Response Interface
 * 
 * This interface defines the structure of responses that your webhook sends back
 * to Farcaster clients. These responses determine what users see after they
 * interact with Frame buttons, creating the dynamic and responsive experience
 * that makes Frames powerful for social commerce.
 */
interface FrameResponse {
  /** The image to display in the updated Frame */
  readonly image: string
  
  /** Optional image aspect ratio */
  readonly imageAspectRatio?: '1.91:1' | '1:1'
  
  /** Buttons to display in the updated Frame */
  readonly buttons?: readonly FrameButton[]
  
  /** Optional input field for user text entry */
  readonly input?: {
    readonly text: string
    readonly placeholder?: string
  }
  
  /** Optional post URL for the next interaction */
  readonly postUrl?: string
  
  /** Optional state data to maintain across interactions */
  readonly state?: string
}

/**
 * Frame Button Configuration
 * 
 * This interface defines how buttons appear and behave in Frame responses.
 * Each button can trigger different types of actions, from simple navigation
 * to complex payment processing flows.
 */
interface FrameButton {
  /** Text displayed on the button */
  readonly label: string
  
  /** Action type determines button behavior */
  readonly action?: 'post' | 'post_redirect' | 'link' | 'mint' | 'tx'
  
  /** Target URL for link actions */
  readonly target?: string
  
  /** Post URL for post actions */
  readonly postUrl?: string
}

/**
 * Main Webhook Handler
 * 
 * This function processes all incoming Frame interactions from Farcaster clients.
 * It serves as the central nervous system of your Frame functionality, receiving
 * user interactions and coordinating appropriate responses based on the type
 * of interaction and the current state of the user's journey.
 * 
 * The webhook demonstrates how to build secure, responsive server-side logic
 * that powers interactive social commerce experiences while maintaining the
 * security and business logic standards established in Phase 1.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the incoming Frame message from Farcaster
    const body = await request.json()
    
    // Verify the message signature to ensure it's actually from Farcaster
    // This verification step is crucial for security - it prevents malicious
    // actors from sending fake interactions to your webhook endpoint
    const verificationResult = await validateFramesMessage(body)
    if (!verificationResult.isValid || !verificationResult.message) {
      console.error('Invalid Frame message signature or missing message')
      return NextResponse.json(
        { error: 'Invalid message signature' },
        { status: 400 }
      )
    }
    const frameMessage = verificationResult.message // This is a FrameActionMessage

    
    // Extract interaction details from the verified message
    const { frameActionBody } = frameMessage.data
    const url = decodeIfUint8Array(frameActionBody.url)
    const buttonIndex = frameActionBody.buttonIndex
    const castId = frameActionBody.castId
    const castIdHash = decodeIfUint8Array(castId?.hash)
    const inputText = frameActionBody.inputText
    const state = frameActionBody.state
    const address = decodeIfUint8Array(frameActionBody.address)

    // Parse the Frame URL to determine what content and action are involved
    if (!url) {
      return NextResponse.json({ error: 'Invalid or missing URL in frame message' }, { status: 400 })
    }
    const urlParts = new URL(url)
    const pathParts = urlParts.pathname.split('/')
    
    // Route the interaction to the appropriate handler based on URL structure
    if (pathParts.includes('content') && pathParts.includes('purchase')) {
      return await handlePurchaseInteraction({
        contentId: extractContentId(pathParts),
        buttonIndex,
        userAddress: address,
        frameMessage
      })
    }
    
    if (pathParts.includes('content') && pathParts.includes('details')) {
      return await handleDetailsInteraction({
        contentId: extractContentId(pathParts),
        buttonIndex,
        frameMessage
      })
    }
    
    if (pathParts.includes('content') && pathParts.includes('access')) {
      return await handleAccessInteraction({
        contentId: extractContentId(pathParts),
        userAddress: address,
        frameMessage
      })
    }
    
    // Default handler for unrecognized interaction patterns
    return await handleDefaultInteraction({ frameMessage })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // Return an error Frame that provides helpful feedback to users
    // Even when things go wrong, we want to maintain a good user experience
    // by providing clear information about what happened and what to do next
    return NextResponse.json({
      image: generateErrorFrame(),
      buttons: [
        {
          label: 'Try Again',
          action: 'post'
        }
      ]
    } as FrameResponse)
  }
}

/**
 * Purchase Interaction Handler
 * 
 * This function handles interactions related to content purchasing, including
 * payment initiation, wallet connection, and purchase confirmation. It demonstrates
 * how complex e-commerce flows can be managed within the Frame interaction model
 * while leveraging your existing payment verification infrastructure.
 */
async function handlePurchaseInteraction({
  contentId,
  buttonIndex,
  userAddress,
  frameMessage
}: {
  readonly contentId: bigint
  readonly buttonIndex: number
  readonly userAddress?: string
  readonly frameMessage: FrameActionMessage
}): Promise<NextResponse> {
  try {
    // Fetch content information using the same API we built in Component 1.1
    // This demonstrates how Frame interactions leverage your existing backend
    // infrastructure rather than implementing parallel content management logic
    const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/content/${contentId}`)
    
    if (!contentResponse.ok) {
      return NextResponse.json({
        image: generateContentNotFoundFrame(),
        buttons: [
          { label: 'Back to Feed', action: 'link', target: '/' }
        ]
      } as FrameResponse)
    }

    const content = await contentResponse.json()

    // Handle different button interactions within the purchase flow
    switch (buttonIndex) {
      case 1: // Initiate purchase
        if (!userAddress) {
          // User needs to connect wallet first
          return NextResponse.json({
            image: generateConnectWalletFrame(content),
            buttons: [
              { label: 'Connect Wallet', action: 'link', target: '/wallet/connect' },
              { label: 'Back', action: 'post' }
            ]
          } as FrameResponse)
        }
        
        // Show payment confirmation
        return NextResponse.json({
          image: generatePaymentConfirmationFrame(content),
          buttons: [
            { 
              label: `Pay $${formatCurrency(content.payPerViewPrice)} USDC`, 
              action: 'tx',
              target: `/api/farcaster/transaction/${contentId}`
            },
            { label: 'Cancel', action: 'post' }
          ],
          postUrl: `/api/farcaster/frame/${contentId}/purchase`
        } as FrameResponse)

      case 2: // Cancel or back
        return NextResponse.json({
          image: generateContentPreviewFrame(content),
          buttons: [
            { label: 'Purchase', action: 'post' },
            { label: 'View Details', action: 'post' }
          ]
        } as FrameResponse)

      default:
        return NextResponse.json({
          image: generateContentPreviewFrame(content),
          buttons: [
            { label: 'Purchase', action: 'post' },
            { label: 'View Details', action: 'post' }
          ]
        } as FrameResponse)
    }

  } catch (error) {
    console.error('Purchase interaction error:', error)
    return NextResponse.json({
      image: generateErrorFrame(),
      buttons: [{ label: 'Try Again', action: 'post' }]
    } as FrameResponse)
  }
}

/**
 * Details Interaction Handler
 * 
 * This function handles requests for detailed content information, providing
 * users with comprehensive information about content before they decide to purchase.
 * It demonstrates how informational interactions can be handled within the Frame
 * model while maintaining engaging user experiences.
 */
async function handleDetailsInteraction({
  contentId,
  buttonIndex,
  frameMessage
}: {
  readonly contentId: bigint
  readonly buttonIndex: number
  readonly frameMessage: FrameActionMessage
}): Promise<NextResponse> {
  try {
    // Fetch content details using your existing content API
    const contentResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/content/${contentId}`)
    
    if (!contentResponse.ok) {
      return NextResponse.json({
        image: generateContentNotFoundFrame(),
        buttons: [{ label: 'Back to Feed', action: 'link', target: '/' }]
      } as FrameResponse)
    }

    const content = await contentResponse.json()

    // Generate detailed information Frame
    return NextResponse.json({
      image: generateContentDetailsFrame(content),
      buttons: [
        { 
          label: 'Purchase', 
          action: 'post',
          postUrl: `/api/farcaster/frame/${contentId}/purchase`
        },
        { 
          label: 'Share', 
          action: 'link', 
          target: `/content/${contentId}`
        }
      ]
    } as FrameResponse)

  } catch (error) {
    console.error('Details interaction error:', error)
    return NextResponse.json({
      image: generateErrorFrame(),
      buttons: [{ label: 'Try Again', action: 'post' }]
    } as FrameResponse)
  }
}

/**
 * Access Interaction Handler
 * 
 * This function handles content access requests, verifying that users have
 * appropriate permissions and providing access to purchased content. It demonstrates
 * how access control decisions made by your Phase 1 infrastructure can be
 * seamlessly integrated into social Frame experiences.
 */
async function handleAccessInteraction({
  contentId,
  userAddress,
  frameMessage
}: {
  readonly contentId: bigint
  readonly userAddress?: string
  readonly frameMessage: FrameActionMessage
}): Promise<NextResponse> {
  try {
    if (!userAddress) {
      return NextResponse.json({
        image: generateAccessDeniedFrame(),
        buttons: [
          { label: 'Connect Wallet', action: 'link', target: '/wallet/connect' },
          { label: 'Back', action: 'post' }
        ]
      } as FrameResponse)
    }

    // Verify access using your existing protected content API from Component 1.2
    // This demonstrates how Frame access control leverages the same security
    // infrastructure that protects your main platform
    const accessResponse = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/protected/content/${contentId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress })
      }
    )

    if (accessResponse.ok) {
      const accessData = await accessResponse.json()
      return NextResponse.json({
        image: generateContentAccessGrantedFrame(accessData),
        buttons: [
          { 
            label: 'Read Full Content', 
            action: 'link', 
            target: `/content/${contentId}?access=granted`
          },
          { label: 'Share', action: 'link', target: `/content/${contentId}` }
        ]
      } as FrameResponse)
    }

    // Access denied - show purchase option
    return NextResponse.json({
      image: generateAccessDeniedFrame(),
      buttons: [
        { 
          label: 'Purchase Access', 
          action: 'post',
          postUrl: `/api/farcaster/frame/${contentId}/purchase`
        },
        { label: 'Back to Feed', action: 'link', target: '/' }
      ]
    } as FrameResponse)

  } catch (error) {
    console.error('Access interaction error:', error)
    return NextResponse.json({
      image: generateErrorFrame(),
      buttons: [{ label: 'Try Again', action: 'post' }]
    } as FrameResponse)
  }
}

/**
 * Default Interaction Handler
 * 
 * This function handles any Frame interactions that don't match specific patterns,
 * providing a fallback that ensures users always receive appropriate responses
 * even when unexpected interaction patterns occur.
 */
async function handleDefaultInteraction({
  frameMessage
}: {
  readonly frameMessage: FrameActionMessage
}): Promise<NextResponse> {
  return NextResponse.json({
    image: generateWelcomeFrame(),
    buttons: [
      { label: 'Explore Content', action: 'link', target: '/content' },
      { label: 'Learn More', action: 'link', target: '/about' }
    ]
  } as FrameResponse)
}

/**
 * Utility Functions for Frame Generation
 * 
 * These functions generate the image URLs that represent different Frame states
 * and interactions. In a production implementation, these would connect to
 * an image generation service that creates appropriate visual representations
 * for each Frame type and state.
 */

function extractContentId(pathParts: readonly string[]): bigint {
  const contentIndex = pathParts.indexOf('content')
  if (contentIndex !== -1 && contentIndex + 1 < pathParts.length) {
    return BigInt(pathParts[contentIndex + 1])
  }
  throw new Error('Content ID not found in path')
}

function generateContentPreviewFrame(content: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  return `${baseUrl}/api/frames/images/preview?title=${encodeURIComponent(content.title)}&price=${formatCurrency(content.payPerViewPrice)}`
}

function generateContentDetailsFrame(content: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  return `${baseUrl}/api/frames/images/details?title=${encodeURIComponent(content.title)}&description=${encodeURIComponent(content.description)}`
}

function generatePaymentConfirmationFrame(content: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  return `${baseUrl}/api/frames/images/payment-confirm?title=${encodeURIComponent(content.title)}&price=${formatCurrency(content.payPerViewPrice)}`
}

function generateConnectWalletFrame(content: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  return `${baseUrl}/api/frames/images/connect-wallet?title=${encodeURIComponent(content.title)}`
}

function generateContentAccessGrantedFrame(content: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  return `${baseUrl}/api/frames/images/access-granted?title=${encodeURIComponent(content.title)}`
}

function generateAccessDeniedFrame(): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  return `${baseUrl}/api/frames/images/access-denied`
}

function generateContentNotFoundFrame(): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  return `${baseUrl}/api/frames/images/not-found`
}

function generateErrorFrame(): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  return `${baseUrl}/api/frames/images/error`
}

function generateWelcomeFrame(): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  return `${baseUrl}/api/frames/images/welcome`
}

function formatCurrency(amountInUsdcWei: bigint): string {
  const dollars = Number(amountInUsdcWei) / 1_000_000
  return dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Utility to decode Uint8Array to string if needed
function decodeIfUint8Array(val: unknown): string | undefined {
  if (val instanceof Uint8Array) {
    return new TextDecoder().decode(val)
  }
  if (typeof val === 'string') {
    return val
  }
  return undefined
}
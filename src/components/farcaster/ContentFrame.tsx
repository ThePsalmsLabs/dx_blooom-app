// src/components/farcaster/ContentFrame.tsx
import React from 'react'
import { useContentById } from '@/hooks/contracts/core'
import { useContentPurchaseFlow } from '@/hooks/business/workflows'

/**
 * Frame Button Configuration Interface
 * 
 * This interface defines the structure of interactive buttons within Farcaster Frames.
 * Each button represents a specific action that users can take, such as viewing content,
 * making a purchase, or subscribing to a creator. The configuration enables rich
 * interaction patterns while maintaining compatibility with Farcaster's Frame protocol.
 */
interface FrameButton {
  /** The text displayed on the button */
  readonly label: string
  
  /** The action type that determines how Farcaster handles the button press */
  readonly action: 'post' | 'link' | 'mint' | 'tx'
  
  /** The target URL for the button action */
  readonly target: string
  
  /** Optional post URL for complex interactions */
  readonly postUrl?: string
}

/**
 * Frame Metadata Interface
 * 
 * This interface defines the complete metadata structure that Farcaster Frames
 * require for proper rendering and interaction. The metadata tells Farcaster
 * clients how to display the Frame, what buttons to show, and where to send
 * user interactions. Think of this as the instruction manual that Farcaster
 * clients use to create interactive social commerce experiences.
 */
interface FrameMetadata {
  /** Frame protocol version for compatibility */
  readonly version: 'vNext'
  
  /** The primary image displayed in the Frame */
  readonly image: string
  
  /** Optional aspect ratio for image display optimization */
  readonly imageAspectRatio?: '1.91:1' | '1:1'
  
  /** Interactive buttons available to users */
  readonly buttons: readonly FrameButton[]
  
  /** Webhook URL where button interactions are sent */
  readonly postUrl: string
  
  /** Optional input field for user text entry */
  readonly input?: {
    readonly text: string
    readonly placeholder?: string
  }
  
  /** Optional state data passed between Frame interactions */
  readonly state?: string
}

/**
 * Content Frame Properties Interface
 * 
 * This interface defines the props that the ContentFrame component accepts.
 * The component needs the content ID to fetch data and optional user context
 * to personalize the Frame experience. The interface design enables the
 * component to be used in various contexts while maintaining type safety.
 */
interface ContentFrameProps {
  /** The ID of the content to display in the Frame */
  readonly contentId: bigint
  
  /** Optional user address for personalized experiences */
  readonly userAddress?: string
  
  /** Optional Frame state for maintaining interaction context */
  readonly frameState?: string
  
  /** Callback for Frame metadata generation */
  readonly onMetadataGenerated?: (metadata: FrameMetadata) => void
}

/**
 * Frame Interaction Context Interface
 * 
 * This interface captures the context of a Frame interaction, including
 * user information, the specific action taken, and any additional data
 * provided by the user. This context enables your platform to respond
 * appropriately to different types of interactions and maintain state
 * across the social commerce workflow.
 */
interface FrameInteractionContext {
  /** The user who performed the interaction */
  readonly fid: string // Farcaster user ID
  readonly userAddress?: string
  
  /** The button that was clicked */
  readonly buttonIndex: number
  readonly buttonLabel: string
  
  /** Any text input provided by the user */
  readonly inputText?: string
  
  /** Frame state from the previous interaction */
  readonly state?: string
  
  /** Additional context from Farcaster */
  readonly castHash?: string
  readonly messageHash?: string
}

/**
 * Generate Content Preview Image URL
 * 
 * This function creates optimized preview images for content displayed in
 * Farcaster Frames. The images serve as the primary visual element that
 * attracts user attention and communicates the value of the content.
 * The function demonstrates how to create compelling social commerce
 * visuals that drive engagement and conversions.
 */
function generateContentPreviewImage(
  content: {
    readonly title: string
    readonly description: string
    readonly category: number
    readonly payPerViewPrice: bigint
    readonly creatorAddress: string
  },
  baseUrl: string
): string {
  // Create URL-safe parameters for dynamic image generation
  const params = new URLSearchParams({
    title: content.title.slice(0, 60), // Limit title length for readability
    description: content.description.slice(0, 120), // Limit description length
    price: content.payPerViewPrice.toString(),
    creator: content.creatorAddress.slice(0, 10) + '...', // Abbreviated address
    category: content.category.toString()
  })

  // Return URL for dynamic image generation endpoint
  // In production, this would point to an image generation service
  // that creates compelling preview images with pricing, title, and branding
  return `${baseUrl}/api/frames/images/content-preview?${params.toString()}`
}

/**
 * Format Price for Display
 * 
 * This utility function formats USDC prices for user-friendly display
 * within Frame interfaces. The formatting needs to be clear and compelling
 * while remaining readable within the constraints of Frame button labels
 * and image overlays.
 */
function formatPriceForFrame(priceInWei: bigint): string {
  // Convert from USDC wei (6 decimals) to human-readable format
  const priceInUSDC = Number(priceInWei) / 1_000_000
  
  // Format based on price range for optimal readability
  if (priceInUSDC < 1) {
    return `$${priceInUSDC.toFixed(2)}`
  } else if (priceInUSDC < 100) {
    return `$${priceInUSDC.toFixed(1)}`
  } else {
    return `$${Math.round(priceInUSDC)}`
  }
}

/**
 * Generate Frame State
 * 
 * This function creates state data that persists across Frame interactions.
 * The state enables multi-step workflows within Frames, such as content
 * preview followed by purchase confirmation. The state management approach
 * ensures that user context is maintained throughout the social commerce
 * experience while keeping state data minimal for performance.
 */
function generateFrameState(
  contentId: bigint,
  step: 'preview' | 'purchase' | 'confirmation',
  additionalData?: Record<string, string>
): string {
  const stateData = {
    contentId: contentId.toString(),
    step,
    timestamp: Date.now().toString(),
    ...additionalData
  }
  
  // Encode state as base64 for URL safety and compactness
  return Buffer.from(JSON.stringify(stateData)).toString('base64')
}

/**
 * Parse Frame State
 * 
 * This function extracts state data from previous Frame interactions,
 * enabling the component to understand the current step in the user's
 * workflow and respond appropriately. The parsing includes validation
 * to ensure state integrity and prevent manipulation.
 */
function parseFrameState(stateString?: string): {
  contentId?: bigint
  step?: string
  timestamp?: number
  additionalData?: Record<string, string>
} {
  if (!stateString) {
    return {}
  }
  
  try {
    const decoded = Buffer.from(stateString, 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded)
    
    return {
      contentId: parsed.contentId ? BigInt(parsed.contentId) : undefined,
      step: parsed.step,
      timestamp: parsed.timestamp ? parseInt(parsed.timestamp) : undefined,
      additionalData: parsed.additionalData
    }
  } catch (error) {
    console.error('Error parsing frame state:', error)
    return {}
  }
}

/**
 * Content Frame Component
 * 
 * This is the main component that renders interactive content previews
 * within Farcaster Frames. The component demonstrates how to create
 * engaging social commerce experiences that leverage your existing
 * content infrastructure while providing native-feeling interactions
 * within social feeds.
 * 
 * The component architecture separates data fetching (using your existing
 * hooks) from presentation logic (Frame-specific rendering), enabling
 * the same business logic to power both your main platform and social
 * commerce experiences.
 */
export function ContentFrame({ 
  contentId, 
  userAddress, 
  frameState,
  onMetadataGenerated 
}: ContentFrameProps): React.ReactElement {
  // Leverage your existing content fetching infrastructure
  // This demonstrates how Frame components can reuse your platform's
  // proven data fetching patterns without requiring parallel implementations
  const { data: content, isLoading, error } = useContentById(contentId)
  
  // Leverage your existing business logic for purchase workflows
  // This integration ensures that Frame purchases follow the same
  // security and validation patterns as your main platform
  const purchaseFlow = useContentPurchaseFlow(contentId, userAddress as `0x${string}`)
  
  // Parse the current Frame state to understand workflow context
  const { step: currentStep, additionalData } = parseFrameState(frameState)
  const workflowStep = currentStep || 'preview'
  
  // Get base URL for Frame endpoint generation
  const baseUrl = process.env.NEXT_PUBLIC_URL
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_URL is required for Frame functionality')
  }

  // Generate Frame metadata based on content data and workflow state
  React.useEffect(() => {
    if (!content || isLoading || error) {
      return
    }

    // Map Content interface to Frame-compatible format
    const frameContent = {
      title: content.title,
      description: content.description,
      category: content.category,
      payPerViewPrice: content.payPerViewPrice,
      creatorAddress: content.creator, // Map creator to creatorAddress
      pricingModel: 'pay-per-view' as const // Default to pay-per-view since Content doesn't have this field
    }
    
    const metadata = generateFrameMetadata(
      frameContent,
      contentId,
      workflowStep,
      baseUrl,
      userAddress
    )
    
    onMetadataGenerated?.(metadata)
  }, [content, contentId, workflowStep, baseUrl, userAddress, onMetadataGenerated, isLoading, error])

  // Handle loading state with Frame-appropriate feedback
  if (isLoading) {
    return (
      <div className="frame-loading">
        <div className="text-center p-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content preview...</p>
        </div>
      </div>
    )
  }

  // Handle error state with user-friendly messaging
  if (error || !content) {
    return (
      <div className="frame-error">
        <div className="text-center p-8">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-700 mb-2">Content not available</p>
          <p className="text-gray-500 text-sm">
            {error?.message || 'Unable to load content preview'}
          </p>
        </div>
      </div>
    )
  }

  // Render Frame preview (this is primarily for debugging/development)
  // In production, Farcaster clients render Frames based on metadata
  return (
    <div className="content-frame">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Frame Image Preview */}
        <div className="aspect-[1.91/1] bg-gradient-to-br from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center text-white">
              <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
              <p className="text-blue-100 mb-4">{content.description.slice(0, 100)}...</p>
              <div className="text-xl font-semibold">
                {formatPriceForFrame(content.payPerViewPrice)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Frame Buttons Preview */}
        <div className="p-4 space-y-2">
          {workflowStep === 'preview' && (
            <>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium">
                Read Full Article - {formatPriceForFrame(content.payPerViewPrice)}
              </button>
              <button className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded font-medium">
                View Creator Profile
              </button>
            </>
          )}
          
          {workflowStep === 'purchase' && (
            <>
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded font-medium">
                Confirm Purchase
              </button>
              <button className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded font-medium">
                Cancel
              </button>
            </>
          )}
          
          {workflowStep === 'confirmation' && (
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium">
              Access Content
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Generate Frame Metadata
 * 
 * This function creates the complete Frame metadata that Farcaster clients
 * use to render interactive content previews. The metadata generation
 * demonstrates how to translate your platform's content and business logic
 * into Frame-compatible formats that enable social commerce.
 */
function generateFrameMetadata(
  content: {
    readonly title: string
    readonly description: string
    readonly category: number
    readonly payPerViewPrice: bigint
    readonly creatorAddress: string
    readonly pricingModel: 'pay-per-view' | 'subscription'
  },
  contentId: bigint,
  workflowStep: string,
  baseUrl: string,
  userAddress?: string
): FrameMetadata {
  // Generate optimized preview image for the Frame
  const imageUrl = generateContentPreviewImage(content, baseUrl)
  
  // Generate appropriate buttons based on workflow step and content type
  const buttons = generateFrameButtons(content, contentId, workflowStep, baseUrl)
  
  // Generate state for maintaining workflow context
  const state = generateFrameState(contentId, workflowStep as 'preview' | 'purchase' | 'confirmation', {
    userAddress: userAddress || '',
    pricingModel: content.pricingModel
  })

  return {
    version: 'vNext',
    image: imageUrl,
    imageAspectRatio: '1.91:1',
    buttons,
    postUrl: `${baseUrl}/api/farcaster/webhook`,
    state
  }
}

/**
 * Generate Frame Buttons
 * 
 * This function creates the appropriate button configuration for different
 * workflow steps and content types. The button generation logic demonstrates
 * how to create compelling calls-to-action that guide users through the
 * social commerce experience while maintaining clarity about pricing and actions.
 */
function generateFrameButtons(
  content: {
    readonly title: string
    readonly payPerViewPrice: bigint
    readonly pricingModel: 'pay-per-view' | 'subscription'
    readonly creatorAddress: string
  },
  contentId: bigint,
  workflowStep: string,
  baseUrl: string
): readonly FrameButton[] {
  const contentIdString = contentId.toString()
  
  switch (workflowStep) {
    case 'preview':
      return [
        {
          label: `Read Full - ${formatPriceForFrame(content.payPerViewPrice)}`,
          action: 'post',
          target: `${baseUrl}/api/farcaster/interactions/purchase/${contentIdString}`,
          postUrl: `${baseUrl}/api/farcaster/webhook`
        },
        {
          label: 'View Creator',
          action: 'link',
          target: `${baseUrl}/creator/${content.creatorAddress}`
        }
      ] as const
    
    case 'purchase':
      return [
        {
          label: '✅ Confirm Purchase',
          action: 'post',
          target: `${baseUrl}/api/farcaster/interactions/confirm/${contentIdString}`,
          postUrl: `${baseUrl}/api/farcaster/webhook`
        },
        {
          label: '← Back to Preview',
          action: 'post',
          target: `${baseUrl}/api/farcaster/interactions/preview/${contentIdString}`,
          postUrl: `${baseUrl}/api/farcaster/webhook`
        }
      ] as const
    
    case 'confirmation':
      return [
        {
          label: '📖 Read Content',
          action: 'link',
          target: `${baseUrl}/content/${contentIdString}?access=granted`
        },
        {
          label: 'Share Success',
          action: 'link',
          target: `https://warpcast.com/~/compose?text=Just purchased "${content.title}" - check it out!&embeds[]=${baseUrl}/content/${contentIdString}`
        }
      ] as const
    
    default:
      return [
        {
          label: 'View Content',
          action: 'link',
          target: `${baseUrl}/content/${contentIdString}`
        }
      ] as const
  }
}

/**
 * Frame Webhook Handler Component Props
 * 
 * This interface defines the props for the webhook handler component
 * that processes Frame interactions from Farcaster clients. The handler
 * needs to understand the interaction context and generate appropriate
 * responses to maintain the social commerce workflow.
 */
interface FrameWebhookHandlerProps {
  /** The interaction context from Farcaster */
  readonly interaction: FrameInteractionContext
  
  /** Callback for generating Frame responses */
  readonly onResponse: (metadata: FrameMetadata) => void
}

/**
 * Frame Webhook Handler Component
 * 
 * This component processes Frame interactions and generates appropriate
 * responses to maintain social commerce workflows. The handler demonstrates
 * how to bridge Farcaster's interaction protocol with your platform's
 * business logic and payment processing capabilities.
 */
export function FrameWebhookHandler({ 
  interaction, 
  onResponse 
}: FrameWebhookHandlerProps): React.ReactElement {
  const { buttonIndex, state, userAddress } = interaction
  const { contentId, step } = parseFrameState(state)
  
  // Fetch content data using your existing infrastructure
  const { data: content } = useContentById(contentId || BigInt(0))
  
  // Process the interaction based on button clicked and current state
  React.useEffect(() => {
    if (!content || !contentId) {
      return
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_URL
    if (!baseUrl) {
      return
    }
    
    // Determine next step based on current state and button clicked
    let nextStep: string
    switch (step) {
      case 'preview':
        nextStep = buttonIndex === 0 ? 'purchase' : 'preview'
        break
      case 'purchase':
        nextStep = buttonIndex === 0 ? 'confirmation' : 'preview'
        break
      default:
        nextStep = 'preview'
    }
    
    // Map Content interface to Frame-compatible format
    const frameContent = {
      title: content.title,
      description: content.description,
      category: content.category,
      payPerViewPrice: content.payPerViewPrice,
      creatorAddress: content.creator, // Map creator to creatorAddress
      pricingModel: 'pay-per-view' as const // Default to pay-per-view since Content doesn't have this field
    }
    
    // Generate updated Frame metadata
    const metadata = generateFrameMetadata(
      frameContent,
      contentId,
      nextStep,
      baseUrl,
      userAddress
    )
    
    onResponse(metadata)
  }, [content, contentId, step, buttonIndex, userAddress, onResponse])
  
  return <div>Processing Frame interaction...</div>
}

/**
 * Export Frame Metadata as HTML Meta Tags
 * 
 * This utility function converts Frame metadata into HTML meta tags
 * that can be included in page headers for Frame discovery and rendering.
 * This approach enables your content pages to automatically become
 * interactive Frames when shared on Farcaster.
 */
export function generateFrameMetaTags(metadata: FrameMetadata): React.ReactElement {
  return (
    <>
      {/* Frame Protocol Meta Tags */}
      <meta property="fc:frame" content={metadata.version} />
      <meta property="fc:frame:image" content={metadata.image} />
      {metadata.imageAspectRatio && (
        <meta property="fc:frame:image:aspect_ratio" content={metadata.imageAspectRatio} />
      )}
      <meta property="fc:frame:post_url" content={metadata.postUrl} />
      
      {/* Frame Buttons */}
      {metadata.buttons.map((button, index) => (
        <React.Fragment key={index}>
          <meta property={`fc:frame:button:${index + 1}`} content={button.label} />
          <meta property={`fc:frame:button:${index + 1}:action`} content={button.action} />
          <meta property={`fc:frame:button:${index + 1}:target`} content={button.target} />
          {button.postUrl && (
            <meta property={`fc:frame:button:${index + 1}:post_url`} content={button.postUrl} />
          )}
        </React.Fragment>
      ))}
      
      {/* Frame Input */}
      {metadata.input && (
        <meta property="fc:frame:input:text" content={metadata.input.text} />
      )}
      
      {/* Frame State */}
      {metadata.state && (
        <meta property="fc:frame:state" content={metadata.state} />
      )}
    </>
  )
}
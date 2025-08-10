// src/lib/farcaster/frameState.ts
// Frame State Management Utilities for Component 2.4
// Handles Frame interaction state and workflow management

/**
 * Frame State Interface
 * 
 * This interface defines the complete structure of Frame interaction state
 * that gets passed between Frame interactions. Think of this as the "memory"
 * that allows Frames to maintain context as users interact with buttons
 * and navigate through purchase workflows.
 */
export interface FrameState {
    readonly contentId: string
    readonly step: FrameWorkflowStep
    readonly userContext?: {
      readonly address?: string
      readonly hasAccess?: boolean
      readonly lastInteraction?: string
    }
    readonly metadata?: {
      readonly priceUSDC?: string
      readonly categoryName?: string
      readonly creatorAddress?: string
    }
  }
  
  /**
   * Frame Workflow Steps
   * 
   * This type defines the possible steps in a Frame interaction workflow,
   * enabling structured navigation through different stages of content
   * discovery, purchase, and access. Each step represents a different
   * Frame view with appropriate buttons and actions.
   */
  export type FrameWorkflowStep = 
    | 'preview'      // Initial content preview with purchase option
    | 'purchase'     // Purchase confirmation and payment flow
    | 'confirmation' // Post-purchase confirmation with access
    | 'access'       // Content access granted view
    | 'error'        // Error state with recovery options
  
  /**
   * Frame Interaction Context
   * 
   * This interface represents the data that comes from Farcaster when
   * a user interacts with a Frame button. It provides the context needed
   * to determine what action was taken and how to respond appropriately.
   */
  export interface FrameInteractionContext {
    readonly buttonIndex: number
    readonly state?: string
    readonly userAddress?: string
    readonly timestamp: number
    readonly castHash?: string
  }
  
  /**
   * Encode Frame State
   * 
   * This function converts Frame state into a base64-encoded string that
   * can be included in Frame metadata. The encoding ensures that state
   * data is safely transmitted through Farcaster's interaction protocol
   * while maintaining all necessary context for workflow continuity.
   * 
   * The function handles the complexity of serialization and encoding
   * so that your Frame interactions can maintain sophisticated state
   * without worrying about the underlying transport mechanisms.
   */
  export function encodeFrameState(state: FrameState): string {
    try {
      // Serialize the state object to JSON
      const jsonString = JSON.stringify(state)
      
      // Encode to base64 for safe transmission
      const encoded = Buffer.from(jsonString, 'utf-8').toString('base64')
      
      // Add a version prefix for future compatibility
      return `v1:${encoded}`
    } catch (error) {
      console.error('Error encoding frame state:', error)
      
      // Return a minimal fallback state
      return encodeFrameState({
        contentId: state.contentId,
        step: 'preview'
      })
    }
  }
  
  /**
   * Decode Frame State
   * 
   * This function converts base64-encoded Frame state back into a usable
   * state object. It handles error cases gracefully and provides fallback
   * behavior to ensure that Frame interactions continue to function even
   * when state data becomes corrupted or incompatible.
   * 
   * The decoding process validates the state structure and provides
   * sensible defaults for missing or invalid data, ensuring robust
   * Frame functionality under all conditions.
   */
  export function decodeFrameState(encodedState?: string): FrameState {
    if (!encodedState) {
      return createDefaultFrameState()
    }
  
    try {
      // Check for version prefix and extract the actual encoded data
      let actualEncoded = encodedState
      if (encodedState.startsWith('v1:')) {
        actualEncoded = encodedState.slice(3)
      }
  
      // Decode from base64
      const jsonString = Buffer.from(actualEncoded, 'base64').toString('utf-8')
      
      // Parse JSON and validate structure
      const parsed = JSON.parse(jsonString)
      
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid state structure')
      }
  
      // Validate required fields and provide defaults
      const state: FrameState = {
        contentId: String(parsed.contentId || ''),
        step: isValidWorkflowStep(parsed.step) ? parsed.step : 'preview',
        userContext: parsed.userContext && typeof parsed.userContext === 'object' 
          ? {
              address: parsed.userContext.address,
              hasAccess: Boolean(parsed.userContext.hasAccess),
              lastInteraction: parsed.userContext.lastInteraction
            }
          : undefined,
        metadata: parsed.metadata && typeof parsed.metadata === 'object'
          ? {
              priceUSDC: parsed.metadata.priceUSDC,
              categoryName: parsed.metadata.categoryName,
              creatorAddress: parsed.metadata.creatorAddress
            }
          : undefined
      }
  
      // Validate that we have a content ID
      if (!state.contentId) {
        throw new Error('Missing content ID in state')
      }
  
      return state
    } catch (error) {
      console.error('Error decoding frame state:', error)
      return createDefaultFrameState()
    }
  }
  
  /**
   * Create Default Frame State
   * 
   * This function creates a safe default Frame state for use when
   * state cannot be decoded or when initializing new Frame interactions.
   * It ensures that Frames always have valid state to work with,
   * preventing errors that could break the user experience.
   */
  function createDefaultFrameState(): FrameState {
    return {
      contentId: '',
      step: 'preview'
    }
  }
  
  /**
   * Workflow Step Validation
   * 
   * This function validates that a step value represents a valid
   * workflow step, providing type safety and preventing invalid
   * state transitions that could break Frame functionality.
   */
  function isValidWorkflowStep(step: unknown): step is FrameWorkflowStep {
    return typeof step === 'string' && 
           ['preview', 'purchase', 'confirmation', 'access', 'error'].includes(step)
  }
  
  /**
   * Create Next Frame State
   * 
   * This function handles Frame state transitions based on user interactions,
   * implementing the business logic that determines how Frame workflows
   * progress through different steps. It encapsulates the decision-making
   * process that drives Frame user experiences.
   * 
   * The function considers the current state, user interaction, and content
   * context to determine the appropriate next state, ensuring that Frame
   * workflows feel natural and intuitive to users.
   */
  export function createNextFrameState(
    currentState: FrameState,
    interaction: FrameInteractionContext,
    contentContext?: {
      readonly hasAccess?: boolean
      readonly requiresPurchase?: boolean
      readonly priceUSDC?: string
    }
  ): FrameState {
    const { buttonIndex, userAddress } = interaction
    const { step, contentId } = currentState
  
    // Update user context with latest interaction
    const updatedUserContext = {
      ...currentState.userContext,
      address: userAddress || currentState.userContext?.address,
      lastInteraction: new Date().toISOString(),
      hasAccess: contentContext?.hasAccess ?? currentState.userContext?.hasAccess
    }
  
    // Determine next step based on current step and button interaction
    let nextStep: FrameWorkflowStep = step
  
    switch (step) {
      case 'preview':
        if (buttonIndex === 1) {
          // First button typically initiates purchase or access
          nextStep = contentContext?.hasAccess ? 'access' : 'purchase'
        } else if (buttonIndex === 2) {
          // Second button might show details or creator info
          nextStep = 'preview' // Stay on preview but could show more details
        }
        break
  
      case 'purchase':
        if (buttonIndex === 1) {
          // Confirm purchase
          nextStep = 'confirmation'
        } else if (buttonIndex === 2) {
          // Cancel or go back
          nextStep = 'preview'
        }
        break
  
      case 'confirmation':
        if (buttonIndex === 1) {
          // Access granted content
          nextStep = 'access'
        } else if (buttonIndex === 2) {
          // Share or other action
          nextStep = 'confirmation' // Stay on confirmation
        }
        break
  
      case 'access':
        // From access, typically return to preview or share
        nextStep = buttonIndex === 1 ? 'access' : 'preview'
        break
  
      case 'error':
        // From error, typically retry or go back to preview
        nextStep = buttonIndex === 1 ? 'preview' : 'error'
        break
    }
  
    return {
      contentId,
      step: nextStep,
      userContext: updatedUserContext,
      metadata: {
        ...currentState.metadata,
        priceUSDC: contentContext?.priceUSDC || currentState.metadata?.priceUSDC
      }
    }
  }
  
  /**
   * Generate Frame Metadata for State
   * 
   * This function creates Farcaster Frame metadata based on the current
   * Frame state, ensuring that each step in the workflow displays
   * appropriate content, buttons, and interaction options to users.
   * 
   * The function demonstrates how Frame metadata generation can be
   * dynamic and context-aware, providing personalized experiences
   * based on user progress through the workflow.
   */
  export function generateFrameMetadataForState(
    state: FrameState,
    baseUrl: string,
    contentTitle?: string
  ): Record<string, string> {
    const { contentId, step, userContext, metadata } = state
    const encodedState = encodeFrameState(state)
  
    // Base metadata common to all steps
    const baseMetadata = {
      'fc:frame': 'vNext',
      'fc:frame:image': `${baseUrl}/api/og/content/${contentId}?step=${step}`,
      'fc:frame:post_url': `${baseUrl}/api/farcaster/frame/${contentId}`,
      'fc:frame:state': encodedState
    }
  
    // Generate step-specific metadata
    switch (step) {
      case 'preview':
        return {
          ...baseMetadata,
          'fc:frame:button:1': metadata?.priceUSDC 
            ? `Purchase - $${metadata.priceUSDC}` 
            : 'View Content',
          'fc:frame:button:1:action': 'post',
          'fc:frame:button:2': 'View Creator',
          'fc:frame:button:2:action': 'link',
          'fc:frame:button:2:target': `${baseUrl}/creator/${metadata?.creatorAddress || ''}`
        }
  
      case 'purchase':
        return {
          ...baseMetadata,
          'fc:frame:button:1': '✅ Confirm Purchase',
          'fc:frame:button:1:action': 'post',
          'fc:frame:button:2': '← Back',
          'fc:frame:button:2:action': 'post'
        }
  
      case 'confirmation':
        return {
          ...baseMetadata,
          'fc:frame:button:1': '📖 Read Content',
          'fc:frame:button:1:action': 'link',
          'fc:frame:button:1:target': `${baseUrl}/content/${contentId}?access=granted`,
          'fc:frame:button:2': 'Share Success',
          'fc:frame:button:2:action': 'link',
          'fc:frame:button:2:target': `https://warpcast.com/~/compose?text=Just purchased "${contentTitle}" - check it out!&embeds[]=${baseUrl}/content/${contentId}`
        }
  
      case 'access':
        return {
          ...baseMetadata,
          'fc:frame:button:1': 'Continue Reading',
          'fc:frame:button:1:action': 'link',
          'fc:frame:button:1:target': `${baseUrl}/content/${contentId}`,
          'fc:frame:button:2': 'Discover More',
          'fc:frame:button:2:action': 'link',
          'fc:frame:button:2:target': `${baseUrl}/browse`
        }
  
      case 'error':
        return {
          ...baseMetadata,
          'fc:frame:image': `${baseUrl}/api/og/error`,
          'fc:frame:button:1': 'Try Again',
          'fc:frame:button:1:action': 'post',
          'fc:frame:button:2': 'Get Help',
          'fc:frame:button:2:action': 'link',
          'fc:frame:button:2:target': `${baseUrl}/support`
        }
  
      default:
        return baseMetadata
    }
  }
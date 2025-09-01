import React, { useCallback, ReactElement } from 'react'
import { type Address } from 'viem'
import { useRouter } from 'next/navigation'
import { useWalletConnectionUI } from '@/hooks/ui/integration'

// Import your new approval flow component
import SubscriptionApprovalFlow from '@/components/subscription/SubscriptionApprovalFlow'

// ===== TYPE DEFINITIONS =====

/**
 * Subscribe Button Props Interface
 * 
 * This interface maintains compatibility with your existing usage patterns
 * while adding new capabilities for the enhanced approval flow.
 */
interface SubscribeButtonProps {
  readonly creatorAddress: Address
  readonly disabled?: boolean
  readonly variant?: 'default' | 'outline' | 'ghost'
  readonly size?: 'sm' | 'md' | 'lg'
  readonly className?: string
  readonly onSubscriptionSuccess?: (transactionHash: string) => void
  readonly onError?: (error: Error) => void

  // Enhanced functionality props
  readonly showDetailedFlow?: boolean
}

/**
 * Button Variant Styles
 * 
 * This type defines the visual styling options for the subscribe button,
 * ensuring consistency with your existing design system.
 */
type ButtonVariantStyles = {
  readonly [K in NonNullable<SubscribeButtonProps['variant']>]: string
}

/**
 * Button Size Styles
 * 
 * This type defines the size variations for the subscribe button,
 * providing flexibility for different UI contexts.
 */
type ButtonSizeStyles = {
  readonly [K in NonNullable<SubscribeButtonProps['size']>]: string
}

// ===== STYLING CONFIGURATIONS =====

/**
 * Button Styling System
 * 
 * These style configurations provide a consistent visual language across
 * your platform while allowing for contextual variations.
 */
const BUTTON_VARIANTS: ButtonVariantStyles = {
  default: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
  outline: 'border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent',
  ghost: 'text-blue-600 hover:bg-blue-50 bg-transparent border-transparent'
}

const BUTTON_SIZES: ButtonSizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base', 
  lg: 'px-6 py-3 text-lg'
}

// ===== UTILITY FUNCTIONS =====

/**
 * Build Button Classes
 * 
 * This function constructs the complete CSS class string for the button
 * based on the provided props and current state.
 */
function buildButtonClasses(
  variant: SubscribeButtonProps['variant'] = 'default',
  size: SubscribeButtonProps['size'] = 'md',
  disabled: boolean = false,
  className: string = ''
): string {
  const baseClasses = 'font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
  const variantClasses = BUTTON_VARIANTS[variant]
  const sizeClasses = BUTTON_SIZES[size]
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  
  return [baseClasses, variantClasses, sizeClasses, disabledClasses, className]
    .filter(Boolean)
    .join(' ')
}



// ===== MAIN COMPONENT =====

/**
 * Enhanced Subscribe Button Component
 *
 * This component provides a consistent subscription flow by navigating users
 * to the creator's page where they can subscribe through the dedicated
 * subscription section. This provides better context and user experience
 * compared to modal-based flows.
 *
 * The component maintains backward compatibility while providing enhanced
 * navigation-based subscription flows.
 */
export function SubscribeButton({
  creatorAddress,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
  onSubscriptionSuccess,
  onError,
  showDetailedFlow = false
}: SubscribeButtonProps): ReactElement {

  // ===== WALLET CONNECTION =====

  const walletUI = useWalletConnectionUI()
  const router = useRouter()

    // ===== EVENT HANDLERS =====

  /**
   * Handle Button Click
   *
   * This function navigates to the creator's page with the subscription section
   * instead of opening a modal, providing a better user experience with more context.
   */
  const handleButtonClick = useCallback(() => {
    if (disabled) return

    // Navigate to creator page with subscription section
    router.push(`/creator/${creatorAddress}#subscribe`)
  }, [disabled, router, creatorAddress])

  /**
   * Handle Subscription Success
   * 
   * This function processes successful subscriptions, providing user feedback
   * and updating the application state as needed.
   */
  const handleSubscriptionSuccess = useCallback((transactionHash: string) => {
    // Provide success feedback to users
    console.log('Subscription successful:', transactionHash)
    
    // Call the parent's success handler if provided
    onSubscriptionSuccess?.(transactionHash)
    
    // You could add toast notifications here:
    // toast({ title: "Subscription Successful!", description: "You now have access to premium content." })
  }, [onSubscriptionSuccess])

  /**
   * Handle Subscription Error
   * 
   * This function manages error scenarios, providing appropriate user feedback
   * and logging for debugging purposes.
   */
  const handleSubscriptionError = useCallback((error: Error) => {
    console.error('Subscription error:', error)
    
    // Call the parent's error handler if provided
    onError?.(error)
    
    // You could add error toast notifications here:
    // toast({ title: "Subscription Failed", description: error.message, variant: "destructive" })
  }, [onError])

  // ===== RENDER LOGIC =====

  // If showing detailed flow inline, render the full approval flow
  if (showDetailedFlow) {
    return (
      <div className={className}>
        <SubscriptionApprovalFlow
          creatorAddress={creatorAddress}
          userAddress={walletUI.address as `0x${string}` | undefined}
          onSubscriptionSuccess={handleSubscriptionSuccess}
          onError={handleSubscriptionError}
          disabled={disabled}
        />
      </div>
    )
  }

  // ===== BUTTON RENDERING =====

  const buttonClasses = buildButtonClasses(variant, size, disabled, className)

  return (
    <button
      onClick={handleButtonClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {disabled ? (
        'Subscribe Unavailable'
      ) : (
        'Subscribe'
      )}
    </button>
  )
}

// ===== EXPORT FOR EASY IMPORT =====

export default SubscribeButton

// ===== USAGE EXAMPLES FOR DOCUMENTATION =====

/**
 * Usage Examples
 *
 * Here are several ways to use the enhanced SubscribeButton component
 * in different contexts throughout your application:
 *
 * // Basic usage (navigates to creator page)
 * <SubscribeButton
 *   creatorAddress="0x..."
 *   onSubscriptionSuccess={(hash) => console.log('Success!', hash)}
 * />
 *
 * // Inline detailed flow (shows full approval flow)
 * <SubscribeButton
 *   creatorAddress="0x..."
 *   showDetailedFlow={true}
 *   onSubscriptionSuccess={handleSuccess}
 * />
 *
 * // Custom styling
 * <SubscribeButton
 *   creatorAddress="0x..."
 *   variant="outline"
 *   size="lg"
 *   className="my-custom-class"
 * />
 *
 * // With comprehensive error handling
 * <SubscribeButton
 *   creatorAddress="0x..."
 *   onSubscriptionSuccess={(hash) => {
 *     toast({ title: "Subscribed!", description: "Access granted to premium content" })
 *     router.push('/dashboard/subscriptions')
 *   }}
 *   onError={(error) => {
 *     console.error(error)
 *     toast({ title: "Subscription Failed", description: error.message, variant: "destructive" })
 *   }}
 * />
 */
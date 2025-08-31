import React, { useState, useCallback, ReactElement } from 'react'
import { type Address } from 'viem'
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
  
  // New props for enhanced functionality
  readonly showDetailedFlow?: boolean
  readonly modalTrigger?: boolean
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

// ===== MODAL COMPONENT =====

/**
 * Subscription Flow Modal
 * 
 * This modal component provides a focused environment for users to complete
 * their subscription process without navigation distractions.
 */
interface SubscriptionFlowModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly creatorAddress: Address
  readonly userAddress: Address | undefined
  readonly onSubscriptionSuccess?: (transactionHash: string) => void
  readonly onError?: (error: Error) => void
}

function SubscriptionFlowModal({
  isOpen,
  onClose,
  creatorAddress,
  userAddress,
  onSubscriptionSuccess,
  onError
}: SubscriptionFlowModalProps): ReactElement | null {
  
  // Handle successful subscription by closing modal and calling callback
  const handleSubscriptionSuccess = useCallback((transactionHash: string) => {
    onClose()
    onSubscriptionSuccess?.(transactionHash)
  }, [onClose, onSubscriptionSuccess])

  // Handle errors by calling callback but keeping modal open for retry
  const handleError = useCallback((error: Error) => {
    onError?.(error)
  }, [onError])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Subscribe to Creator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Subscription Flow */}
        <SubscriptionApprovalFlow
          creatorAddress={creatorAddress}
          userAddress={userAddress}
          onSubscriptionSuccess={handleSubscriptionSuccess}
          onError={handleError}
        />
      </div>
    </div>
  )
}

// ===== MAIN COMPONENT =====

/**
 * Enhanced Subscribe Button Component
 * 
 * This component serves as the primary entry point for subscription flows.
 * It intelligently presents either a simple button for quick actions or
 * a detailed approval flow for complex scenarios.
 * 
 * The component maintains backward compatibility with your existing usage
 * while providing enhanced functionality through the new approval system.
 */
export function SubscribeButton({
  creatorAddress,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
  onSubscriptionSuccess,
  onError,
  showDetailedFlow = false,
  modalTrigger = true
}: SubscribeButtonProps): ReactElement {
  
  // ===== WALLET CONNECTION =====

  const walletUI = useWalletConnectionUI()
  
  // ===== MODAL STATE MANAGEMENT =====
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // ===== EVENT HANDLERS =====
  
  /**
   * Handle Button Click
   * 
   * This function determines how to respond to button clicks based on
   * the component configuration and user state.
   */
  const handleButtonClick = useCallback(() => {
    if (disabled || !walletUI.isConnected) return
    
    if (modalTrigger) {
      setIsModalOpen(true)
    }
    // If not using modal trigger, the parent component should handle the detailed flow
  }, [disabled, walletUI.isConnected, modalTrigger])

  /**
   * Handle Modal Close
   * 
   * This function manages the modal state when users close the subscription flow.
   */
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
  }, [])

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
  
  // If showing detailed flow inline (not in modal), render the full approval flow
  if (showDetailedFlow && !modalTrigger) {
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
  
  const buttonClasses = buildButtonClasses(variant, size, disabled || !walletUI.isConnected, className)
  
  return (
    <>
      {/* Subscribe Button */}
      <button
        onClick={handleButtonClick}
        disabled={disabled || !walletUI.isConnected}
        className={buttonClasses}
      >
        {!walletUI.isConnected ? (
          'Connect Wallet to Subscribe'
        ) : disabled ? (
          'Subscribe Unavailable'
        ) : (
          'Subscribe'
        )}
      </button>

      {/* Subscription Flow Modal */}
      {modalTrigger && (
        <SubscriptionFlowModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          creatorAddress={creatorAddress}
          userAddress={walletUI.address as `0x${string}` | undefined}
          onSubscriptionSuccess={handleSubscriptionSuccess}
          onError={handleSubscriptionError}
        />
      )}
    </>
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
 * // Basic usage (opens modal with approval flow)
 * <SubscribeButton 
 *   creatorAddress="0x..." 
 *   onSubscriptionSuccess={(hash) => console.log('Success!', hash)}
 * />
 * 
 * // Inline detailed flow (no modal)
 * <SubscribeButton 
 *   creatorAddress="0x..." 
 *   showDetailedFlow={true}
 *   modalTrigger={false}
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
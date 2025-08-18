import React, { useMemo, ReactElement } from 'react'
import { type Address } from 'viem'
import { formatUnits } from 'viem'

// Import your established UI patterns and the new hook
import { 
  useSubscriptionPurchaseWithApproval, 
  SubscriptionPurchaseStep,
  type SubscriptionPurchaseWithApprovalResult 
} from '@/hooks/contracts/subscription/useSubscriptionWithApproval'

// ===== TYPE DEFINITIONS =====

/**
 * Component Props Interface
 * 
 * This interface defines the external API of the SubscriptionApprovalFlow component,
 * keeping it focused and reusable across different parts of your platform.
 */
interface SubscriptionApprovalFlowProps {
  readonly creatorAddress: Address
  readonly userAddress: Address | undefined
  readonly onSubscriptionSuccess?: (transactionHash: string) => void
  readonly onError?: (error: Error) => void
  readonly disabled?: boolean
  readonly className?: string
}

/**
 * Step UI Configuration Interface
 * 
 * This interface defines how each step in the subscription flow should be
 * presented to users, including visual styling and interactive elements.
 */
interface StepUIConfig {
  readonly title: string
  readonly description: string
  readonly buttonText: string
  readonly buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  readonly showProgress: boolean
  readonly canInteract: boolean
  readonly isLoading: boolean
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format USDC Amount for Display
 * 
 * This function formats USDC amounts (which use 6 decimals) into human-readable
 * strings with appropriate precision and currency formatting.
 */
function formatUSDCAmount(amount: bigint): string {
  const formatted = formatUnits(amount, 6) // USDC has 6 decimals
  const number = parseFloat(formatted)
  
  // Use currency formatting for amounts
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(number)
}

/**
 * Get Step UI Configuration
 * 
 * This function maps each step in the purchase flow to its corresponding
 * UI presentation, making the component's rendering logic clean and maintainable.
 */
function getStepUIConfig(
  step: SubscriptionPurchaseStep,
  requirements: SubscriptionPurchaseWithApprovalResult['requirements'],
  purchaseState: SubscriptionPurchaseWithApprovalResult['purchaseState']
): StepUIConfig {
  switch (step) {
    case SubscriptionPurchaseStep.IDLE:
      return {
        title: 'Ready to Subscribe',
        description: 'Click below to start your subscription process.',
        buttonText: 'Start Subscription',
        buttonVariant: 'default',
        showProgress: false,
        canInteract: true,
        isLoading: false
      }

    case SubscriptionPurchaseStep.CHECKING_REQUIREMENTS:
      return {
        title: 'Checking Requirements',
        description: 'Verifying your balance and subscription details...',
        buttonText: 'Checking...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true
      }

    case SubscriptionPurchaseStep.INSUFFICIENT_BALANCE:
      return {
        title: 'Insufficient Balance',
        description: `You need ${formatUSDCAmount(requirements.subscriptionPrice)} USDC to subscribe. Your current balance is ${formatUSDCAmount(requirements.userBalance)}.`,
        buttonText: 'Add USDC to Continue',
        buttonVariant: 'destructive',
        showProgress: false,
        canInteract: false,
        isLoading: false
      }

    case SubscriptionPurchaseStep.NEEDS_APPROVAL:
      return {
        title: 'Approve USDC Spending',
        description: `To subscribe, you need to approve spending ${formatUSDCAmount(requirements.subscriptionPrice)} USDC. This is a one-time approval for this subscription amount.`,
        buttonText: 'Approve USDC',
        buttonVariant: 'default',
        showProgress: false,
        canInteract: true,
        isLoading: false
      }

    case SubscriptionPurchaseStep.APPROVING:
      return {
        title: 'Approving USDC...',
        description: 'Please confirm the approval transaction in your wallet. This allows the subscription contract to spend your USDC.',
        buttonText: 'Approving...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true
      }

    case SubscriptionPurchaseStep.READY_TO_SUBSCRIBE:
      return {
        title: 'Ready to Subscribe!',
        description: `All requirements met. You can now subscribe for ${formatUSDCAmount(requirements.subscriptionPrice)} USDC per month.`,
        buttonText: 'Subscribe Now',
        buttonVariant: 'default',
        showProgress: false,
        canInteract: true,
        isLoading: false
      }

    case SubscriptionPurchaseStep.SUBSCRIBING:
      return {
        title: 'Processing Subscription...',
        description: 'Please confirm the subscription transaction in your wallet.',
        buttonText: 'Subscribing...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true
      }

    case SubscriptionPurchaseStep.CONFIRMING:
      return {
        title: 'Confirming Transaction...',
        description: 'Your subscription transaction is being confirmed on the blockchain.',
        buttonText: 'Confirming...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true
      }

    case SubscriptionPurchaseStep.SUCCESS:
      return {
        title: 'Subscription Successful! 🎉',
        description: 'You are now subscribed! You can access all premium content from this creator.',
        buttonText: 'View Subscription',
        buttonVariant: 'default',
        showProgress: false,
        canInteract: true,
        isLoading: false
      }

    case SubscriptionPurchaseStep.ERROR:
      return {
        title: 'Subscription Failed',
        description: `Something went wrong: ${purchaseState.error?.message || 'Unknown error'}`,
        buttonText: 'Try Again',
        buttonVariant: 'destructive',
        showProgress: false,
        canInteract: true,
        isLoading: false
      }

    default:
      return {
        title: 'Unknown State',
        description: 'An unexpected state occurred.',
        buttonText: 'Reset',
        buttonVariant: 'outline',
        showProgress: false,
        canInteract: true,
        isLoading: false
      }
  }
}

// ===== MAIN COMPONENT =====

/**
 * Subscription Approval Flow Component
 * 
 * This component provides a complete, guided experience for users to subscribe
 * to creators, handling all the complex approval and payment logic behind a
 * clean, intuitive interface.
 * 
 * The component follows the same UX patterns as your content purchase system,
 * ensuring consistency across your platform while providing specialized
 * functionality for subscriptions.
 */
export function SubscriptionApprovalFlow({
  creatorAddress,
  userAddress,
  onSubscriptionSuccess,
  onError,
  disabled = false,
  className = ''
}: SubscriptionApprovalFlowProps): ReactElement {
  
  // ===== HOOK INTEGRATION =====
  
  const subscriptionFlow = useSubscriptionPurchaseWithApproval(creatorAddress, userAddress)
  
  // ===== UI CONFIGURATION =====
  
  const stepConfig = useMemo(() => 
    getStepUIConfig(
      subscriptionFlow.currentStep,
      subscriptionFlow.requirements,
      subscriptionFlow.purchaseState
    ),
    [subscriptionFlow.currentStep, subscriptionFlow.requirements, subscriptionFlow.purchaseState]
  )

  // ===== EVENT HANDLERS =====
  
  /**
   * Handle Primary Button Click
   * 
   * This function determines what action to take based on the current step
   * in the subscription flow, providing a single interaction point for users.
   */
  const handlePrimaryAction = async (): Promise<void> => {
    if (disabled || !stepConfig.canInteract) return

    try {
      switch (subscriptionFlow.currentStep) {
        case SubscriptionPurchaseStep.IDLE:
        case SubscriptionPurchaseStep.CHECKING_REQUIREMENTS:
          // These states are handled automatically by the hook
          break

        case SubscriptionPurchaseStep.NEEDS_APPROVAL:
          await subscriptionFlow.startApproval()
          break

        case SubscriptionPurchaseStep.READY_TO_SUBSCRIBE:
          await subscriptionFlow.executeSubscription()
          break

        case SubscriptionPurchaseStep.SUCCESS:
          // Handle success action (could navigate to subscription dashboard)
          if (onSubscriptionSuccess && subscriptionFlow.purchaseState.subscriptionHash) {
            onSubscriptionSuccess(subscriptionFlow.purchaseState.subscriptionHash)
          }
          break

        case SubscriptionPurchaseStep.ERROR:
          // Reset the flow to try again
          subscriptionFlow.reset()
          break

        case SubscriptionPurchaseStep.INSUFFICIENT_BALANCE:
          // This could trigger a modal to add funds or redirect to an exchange
          console.log('User needs to add USDC to their wallet')
          break

        default:
          console.warn('Unhandled step action:', subscriptionFlow.currentStep)
      }
    } catch (error) {
      console.error('Subscription flow action failed:', error)
      if (onError && error instanceof Error) {
        onError(error)
      }
    }
  }

  // ===== ERROR HANDLING EFFECTS =====
  
  React.useEffect(() => {
    if (subscriptionFlow.hasError && subscriptionFlow.purchaseState.error && onError) {
      onError(subscriptionFlow.purchaseState.error)
    }
  }, [subscriptionFlow.hasError, subscriptionFlow.purchaseState.error, onError])

  // ===== RENDER LOGIC =====
  
  return (
    <div className={`subscription-approval-flow ${className}`}>
      {/* Progress Indicator */}
      {stepConfig.showProgress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{subscriptionFlow.purchaseState.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${subscriptionFlow.purchaseState.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Creator Information Display */}
      {subscriptionFlow.creatorProfile.isRegistered && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Creator Subscription</h3>
              <p className="text-gray-600">Monthly subscription to access premium content</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatUSDCAmount(subscriptionFlow.creatorProfile.subscriptionPrice)}
              </div>
              <div className="text-sm text-gray-500">per month</div>
            </div>
          </div>
          
          {subscriptionFlow.creatorProfile.isVerified && (
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <span className="mr-1">✓</span>
              Verified Creator
            </div>
          )}
        </div>
      )}

      {/* Main Flow Content */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-3">{stepConfig.title}</h2>
        <p className="text-gray-600 mb-6">{stepConfig.description}</p>

        {/* Primary Action Button */}
        <button
          onClick={handlePrimaryAction}
          disabled={disabled || !stepConfig.canInteract || stepConfig.isLoading}
          className={`
            px-6 py-3 rounded-lg font-medium transition-all duration-200
            ${stepConfig.buttonVariant === 'default' 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : stepConfig.buttonVariant === 'destructive'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : stepConfig.buttonVariant === 'outline'
              ? 'border border-gray-300 hover:bg-gray-50 text-gray-700'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
            }
            ${(disabled || !stepConfig.canInteract || stepConfig.isLoading) 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer'
            }
          `}
        >
          {stepConfig.isLoading && (
            <span className="inline-block mr-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {stepConfig.buttonText}
        </button>

        {/* Secondary Actions */}
        {subscriptionFlow.hasError && (
          <button
            onClick={subscriptionFlow.reset}
            className="ml-3 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Reset Flow
          </button>
        )}
      </div>

      {/* Technical Details (for debugging in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Debug Information</summary>
            <div className="mt-2 space-y-1">
              <div>Current Step: {subscriptionFlow.currentStep}</div>
              <div>Can Approve: {subscriptionFlow.canApprove ? 'Yes' : 'No'}</div>
              <div>Can Subscribe: {subscriptionFlow.canSubscribe ? 'Yes' : 'No'}</div>
              <div>Needs Approval: {subscriptionFlow.requirements.needsApproval ? 'Yes' : 'No'}</div>
              <div>Has Enough Balance: {subscriptionFlow.requirements.hasEnoughBalance ? 'Yes' : 'No'}</div>
              <div>Progress: {subscriptionFlow.purchaseState.progress}%</div>
              {subscriptionFlow.purchaseState.approvalHash && (
                <div>Approval Hash: {subscriptionFlow.purchaseState.approvalHash}</div>
              )}
              {subscriptionFlow.purchaseState.subscriptionHash && (
                <div>Subscription Hash: {subscriptionFlow.purchaseState.subscriptionHash}</div>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

// ===== EXPORT FOR EASY IMPORT =====

export default SubscriptionApprovalFlow
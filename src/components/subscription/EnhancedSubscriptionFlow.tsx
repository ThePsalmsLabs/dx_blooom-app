/**
 * Enhanced Subscription Flow Component
 * 
 * This component provides a unified subscription experience that automatically
 * detects and offers the best available subscription method:
 * 
 * 1. Commerce Protocol subscription - Multi-token support with permit (recommended)
 * 2. Direct USDC subscription with permit - Single transaction for USDC only
 * 3. Traditional approval + subscription - Two transactions, maximum compatibility
 * 
 * The component intelligently chooses the best strategy while allowing users
 * to override if they prefer a specific method.
 * 
 * File: src/components/subscription/EnhancedSubscriptionFlow.tsx
 */

import React, { useMemo, ReactElement } from 'react'
import { type Address } from 'viem'
import { formatUnits } from 'viem'

// Import the unified subscription hook
import { 
  useUnifiedSubscriptionFlow, 
  UnifiedSubscriptionStep,
  type SubscriptionStrategy 
} from '@/hooks/contracts/subscription/useUnifiedSubscriptionFlow'

// ===== TYPE DEFINITIONS =====

/**
 * Component Props Interface
 */
interface EnhancedSubscriptionFlowProps {
  readonly creatorAddress: Address
  readonly userAddress: Address | undefined
  readonly onSubscriptionSuccess?: (transactionHash: string) => void
  readonly onError?: (error: Error) => void
  readonly disabled?: boolean
  readonly className?: string
  readonly preferredStrategy?: SubscriptionStrategy
  readonly showStrategySelector?: boolean
}

/**
 * Step UI Configuration Interface
 */
interface StepUIConfig {
  readonly title: string
  readonly description: string
  readonly buttonText: string
  readonly buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  readonly showProgress: boolean
  readonly canInteract: boolean
  readonly isLoading: boolean
  readonly showStrategyInfo: boolean
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format USDC Amount for Display
 */
function formatUSDCAmount(amount: bigint): string {
  const formatted = formatUnits(amount, 6) // USDC has 6 decimals
  const number = parseFloat(formatted)
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(number)
}

/**
 * Get Step UI Configuration
 */
function getStepUIConfig(
  step: UnifiedSubscriptionStep,
  requirements: any,
  subscriptionState: any,
  selectedStrategy: SubscriptionStrategy,
  canUsePermit: boolean,
  canUseCommerceProtocol: boolean
): StepUIConfig {
  switch (step) {
    case UnifiedSubscriptionStep.IDLE:
      return {
        title: 'Ready to Subscribe',
        description: (canUsePermit || canUseCommerceProtocol)
          ? 'Choose your subscription method below. Commerce Protocol offers multi-token support with permit, while direct USDC permit provides single-transaction convenience.'
          : 'Click below to start your subscription process.',
        buttonText: 'Start Subscription',
        buttonVariant: 'default',
        showProgress: false,
        canInteract: true,
        isLoading: false,
        showStrategyInfo: canUsePermit || canUseCommerceProtocol
      }

    case UnifiedSubscriptionStep.CHECKING_REQUIREMENTS:
      return {
        title: 'Checking Requirements',
        description: 'Verifying your balance and subscription details...',
        buttonText: 'Checking...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.INSUFFICIENT_BALANCE:
      return {
        title: 'Insufficient Balance',
        description: `You need ${formatUSDCAmount(requirements.subscriptionPrice)} USDC to subscribe. Your current balance is ${formatUSDCAmount(requirements.userBalance)}.`,
        buttonText: 'Add USDC to Continue',
        buttonVariant: 'destructive',
        showProgress: false,
        canInteract: false,
        isLoading: false,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.SELECTING_STRATEGY:
      return {
        title: 'Choose Subscription Method',
        description: 'Select how you would like to subscribe:',
        buttonText: 'Continue',
        buttonVariant: 'default',
        showProgress: false,
        canInteract: true,
        isLoading: false,
        showStrategyInfo: true
      }

    case UnifiedSubscriptionStep.CREATING_INTENT:
      return {
        title: 'Creating Payment Intent',
        description: 'Setting up your subscription payment through the Commerce Protocol...',
        buttonText: 'Creating...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.GENERATING_PERMIT:
      return {
        title: 'Preparing Permit',
        description: 'Generating permit data for single-transaction subscription...',
        buttonText: 'Preparing...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.SIGNING_PERMIT:
      return {
        title: 'Sign Permit',
        description: 'Please sign the permit in your wallet. This allows the subscription to proceed in a single transaction.',
        buttonText: 'Signing...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.NEEDS_APPROVAL:
      return {
        title: 'Approve USDC Spending',
        description: `To subscribe, you need to approve spending ${formatUSDCAmount(requirements.subscriptionPrice)} USDC. This is a one-time approval for this subscription amount.`,
        buttonText: 'Approve USDC',
        buttonVariant: 'default',
        showProgress: false,
        canInteract: true,
        isLoading: false,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.APPROVING:
      return {
        title: 'Approving USDC...',
        description: 'Please confirm the approval transaction in your wallet. This allows the subscription contract to spend your USDC.',
        buttonText: 'Approving...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.EXECUTING_SUBSCRIPTION:
      return {
        title: selectedStrategy === 'permit' ? 'Processing Subscription...' : 'Processing Subscription...',
        description: selectedStrategy === 'permit' 
          ? 'Please confirm the subscription transaction in your wallet.'
          : 'Please confirm the subscription transaction in your wallet.',
        buttonText: 'Subscribing...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.CONFIRMING:
      return {
        title: 'Confirming Transaction...',
        description: 'Your subscription transaction is being confirmed on the blockchain.',
        buttonText: 'Confirming...',
        buttonVariant: 'outline',
        showProgress: true,
        canInteract: false,
        isLoading: true,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.SUCCESS:
      return {
        title: 'Subscription Successful! 🎉',
        description: 'You are now subscribed! You can access all premium content from this creator.',
        buttonText: 'View Subscription',
        buttonVariant: 'default',
        showProgress: false,
        canInteract: true,
        isLoading: false,
        showStrategyInfo: false
      }

    case UnifiedSubscriptionStep.ERROR:
      return {
        title: 'Subscription Failed',
        description: `Something went wrong: ${subscriptionState.error?.message || 'Unknown error'}`,
        buttonText: 'Try Again',
        buttonVariant: 'destructive',
        showProgress: false,
        canInteract: true,
        isLoading: false,
        showStrategyInfo: false
      }

    default:
      return {
        title: 'Unknown State',
        description: 'An unexpected state occurred.',
        buttonText: 'Reset',
        buttonVariant: 'outline',
        showProgress: false,
        canInteract: true,
        isLoading: false,
        showStrategyInfo: false
      }
  }
}

// ===== STRATEGY SELECTOR COMPONENT =====

/**
 * Strategy Selector Component
 */
interface StrategySelectorProps {
  readonly selectedStrategy: SubscriptionStrategy
  readonly availableStrategies: SubscriptionStrategy[]
  readonly onStrategyChange: (strategy: SubscriptionStrategy) => void
  readonly subscriptionPrice: bigint
}

function StrategySelector({
  selectedStrategy,
  availableStrategies,
  onStrategyChange,
  subscriptionPrice
}: StrategySelectorProps): ReactElement {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold text-lg mb-3">Choose Subscription Method</h3>
      
      <div className="space-y-3">
        {availableStrategies.includes('commerce_protocol') && (
          <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="radio"
              id="commerce-protocol-strategy"
              name="strategy"
              value="commerce_protocol"
              checked={selectedStrategy === 'commerce_protocol'}
              onChange={() => onStrategyChange('commerce_protocol')}
              className="mr-3"
            />
            <div className="flex-1">
              <label htmlFor="commerce-protocol-strategy" className="cursor-pointer">
                <div className="font-medium text-purple-700">Commerce Protocol (Recommended)</div>
                <div className="text-sm text-gray-600">
                  Multi-token support • {formatUSDCAmount(subscriptionPrice)} • Permit-enabled • Best flexibility
                </div>
              </label>
            </div>
            <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Advanced
            </div>
          </div>
        )}
        
        {availableStrategies.includes('permit') && (
          <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="radio"
              id="permit-strategy"
              name="strategy"
              value="permit"
              checked={selectedStrategy === 'permit'}
              onChange={() => onStrategyChange('permit')}
              className="mr-3"
            />
            <div className="flex-1">
              <label htmlFor="permit-strategy" className="cursor-pointer">
                <div className="font-medium text-green-700">Direct USDC Permit</div>
                <div className="text-sm text-gray-600">
                  Single transaction • {formatUSDCAmount(subscriptionPrice)} USDC • USDC only
                </div>
              </label>
            </div>
            <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              EIP-2612
            </div>
          </div>
        )}
        
        <div className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <input
            type="radio"
            id="approval-strategy"
            name="strategy"
            value="approval"
            checked={selectedStrategy === 'approval'}
            onChange={() => onStrategyChange('approval')}
            className="mr-3"
          />
          <div className="flex-1">
            <label htmlFor="approval-strategy" className="cursor-pointer">
              <div className="font-medium text-blue-700">Traditional Approval</div>
              <div className="text-sm text-gray-600">
                Two transactions • {formatUSDCAmount(subscriptionPrice)} USDC • Maximum compatibility
              </div>
            </label>
          </div>
          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Standard
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        {selectedStrategy === 'commerce_protocol' 
          ? 'Commerce Protocol supports multiple tokens with permit-based payments for the best user experience.'
          : selectedStrategy === 'permit'
          ? 'Direct USDC permit combines approval and subscription into a single transaction for USDC only.'
          : 'Traditional approval requires two separate transactions but works with all wallets.'
        }
      </div>
    </div>
  )
}

// ===== MAIN COMPONENT =====

/**
 * Enhanced Subscription Flow Component
 * 
 * Provides a unified subscription experience with automatic strategy selection
 * and user override capabilities.
 */
export function EnhancedSubscriptionFlow({
  creatorAddress,
  userAddress,
  onSubscriptionSuccess,
  onError,
  disabled = false,
  className = '',
  preferredStrategy = 'auto',
  showStrategySelector = true
}: EnhancedSubscriptionFlowProps): ReactElement {
  
  // ===== HOOK INTEGRATION =====
  
  const subscriptionFlow = useUnifiedSubscriptionFlow(creatorAddress, userAddress, preferredStrategy)
  
  // ===== UI CONFIGURATION =====
  
  const stepConfig = useMemo(() => 
    getStepUIConfig(
      subscriptionFlow.subscriptionState.currentStep,
      subscriptionFlow.requirements,
      subscriptionFlow.subscriptionState,
      subscriptionFlow.selectedStrategy,
      subscriptionFlow.canUsePermit,
      subscriptionFlow.canUseCommerceProtocol
    ),
    [
      subscriptionFlow.subscriptionState.currentStep,
      subscriptionFlow.requirements,
      subscriptionFlow.subscriptionState,
      subscriptionFlow.selectedStrategy,
      subscriptionFlow.canUsePermit,
      subscriptionFlow.canUseCommerceProtocol
    ]
  )

  // ===== EVENT HANDLERS =====
  
  const handlePrimaryAction = async (): Promise<void> => {
    if (disabled || !stepConfig.canInteract) return

    try {
      switch (subscriptionFlow.subscriptionState.currentStep) {
        case UnifiedSubscriptionStep.IDLE:
          if (subscriptionFlow.canUsePermit && showStrategySelector) {
            // Show strategy selector
            break
          } else {
            await subscriptionFlow.executeSubscription()
          }
          break

        case UnifiedSubscriptionStep.SELECTING_STRATEGY:
          await subscriptionFlow.executeSubscription()
          break

        case UnifiedSubscriptionStep.SUCCESS:
          if (onSubscriptionSuccess && subscriptionFlow.subscriptionState.transactionHash) {
            onSubscriptionSuccess(subscriptionFlow.subscriptionState.transactionHash)
          }
          break

        case UnifiedSubscriptionStep.ERROR:
          subscriptionFlow.reset()
          break

        default:
          // Other states are handled automatically by the hook
          break
      }
    } catch (error) {
      console.error('Enhanced subscription flow action failed:', error)
      if (onError && error instanceof Error) {
        onError(error)
      }
    }
  }

  // ===== ERROR HANDLING EFFECTS =====
  
  React.useEffect(() => {
    if (subscriptionFlow.hasError && subscriptionFlow.subscriptionState.error && onError) {
      onError(subscriptionFlow.subscriptionState.error)
    }
  }, [subscriptionFlow.hasError, subscriptionFlow.subscriptionState.error, onError])

  // ===== RENDER LOGIC =====
  
  return (
    <div className={`enhanced-subscription-flow ${className}`}>
      {/* Progress Indicator */}
      {stepConfig.showProgress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{subscriptionFlow.subscriptionState.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${subscriptionFlow.subscriptionState.progress}%` }}
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

      {/* Strategy Selector */}
      {stepConfig.showStrategyInfo && (subscriptionFlow.canUsePermit || subscriptionFlow.canUseCommerceProtocol) && showStrategySelector && (
        <StrategySelector
          selectedStrategy={subscriptionFlow.selectedStrategy}
          availableStrategies={subscriptionFlow.availableStrategies}
          onStrategyChange={subscriptionFlow.setStrategy}
          subscriptionPrice={subscriptionFlow.requirements.subscriptionPrice}
        />
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
              <div>Current Step: {subscriptionFlow.subscriptionState.currentStep}</div>
              <div>Selected Strategy: {subscriptionFlow.selectedStrategy}</div>
              <div>Available Strategies: {subscriptionFlow.availableStrategies.join(', ')}</div>
              <div>Can Use Permit: {subscriptionFlow.canUsePermit ? 'Yes' : 'No'}</div>
              <div>Has Enough Balance: {subscriptionFlow.requirements.hasEnoughBalance ? 'Yes' : 'No'}</div>
              <div>Progress: {subscriptionFlow.subscriptionState.progress}%</div>
              {subscriptionFlow.subscriptionState.transactionHash && (
                <div>Transaction Hash: {subscriptionFlow.subscriptionState.transactionHash}</div>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

// ===== EXPORT FOR EASY IMPORT =====

export default EnhancedSubscriptionFlow

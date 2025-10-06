/**
 * Escrow Action Button - Context-Aware CTA Component
 * 
 * Smart button that shows the right action at the right time.
 * Focus: Clear next action with visual feedback and loading states.
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { 
  Lock, 
  Zap, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EscrowPaymentStatus } from '@/hooks/contracts/v2/managers/useBaseCommerceIntegration'

interface EscrowActionButtonProps {
  status: EscrowPaymentStatus
  onAuthorize?: () => void
  onCapture?: () => void
  onVoid?: () => void
  onRefund?: () => void
  onRetry?: () => void
  isLoading?: boolean
  disabled?: boolean
  timeRemaining?: number
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

interface ActionConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'outline' | 'destructive' | 'secondary'
  onClick?: () => void
  disabled: boolean
  loading: boolean
  className: string
}

export function EscrowActionButton({
  status,
  onAuthorize,
  onCapture,
  onVoid,
  onRefund,
  onRetry,
  isLoading = false,
  disabled = false,
  timeRemaining,
  className = '',
  size = 'default',
  variant = 'default'
}: EscrowActionButtonProps) {

  const getActionConfig = (): ActionConfig => {
    switch (status) {
      case EscrowPaymentStatus.IDLE:
        return {
          label: 'Secure Payment',
          icon: Lock,
          variant: 'default',
          onClick: onAuthorize,
          disabled: disabled || !onAuthorize,
          loading: false,
          className: 'bg-blue-500 hover:bg-blue-600 text-white'
        }

      case EscrowPaymentStatus.AUTHORIZING:
        return {
          label: 'Securing...',
          icon: RefreshCw,
          variant: 'secondary',
          onClick: undefined,
          disabled: true,
          loading: true,
          className: 'bg-blue-100 text-blue-600'
        }

      case EscrowPaymentStatus.AUTHORIZED:
        return {
          label: 'Complete Payment',
          icon: Zap,
          variant: 'default',
          onClick: onCapture,
          disabled: disabled || !onCapture,
          loading: false,
          className: 'bg-green-500 hover:bg-green-600 text-white'
        }

      case EscrowPaymentStatus.CAPTURING:
        return {
          label: 'Processing...',
          icon: RefreshCw,
          variant: 'secondary',
          onClick: undefined,
          disabled: true,
          loading: true,
          className: 'bg-amber-100 text-amber-600'
        }

      case EscrowPaymentStatus.COMPLETED:
        return {
          label: 'Payment Complete',
          icon: CheckCircle,
          variant: 'secondary',
          onClick: undefined,
          disabled: true,
          loading: false,
          className: 'bg-green-100 text-green-600'
        }

      case EscrowPaymentStatus.EXPIRED:
        return {
          label: 'Claim Refund',
          icon: RefreshCw,
          variant: 'outline',
          onClick: onRefund,
          disabled: disabled || !onRefund,
          loading: false,
          className: 'border-red-300 text-red-600 hover:bg-red-50'
        }

      case EscrowPaymentStatus.FAILED:
        return {
          label: 'Retry Payment',
          icon: RefreshCw,
          variant: 'outline',
          onClick: onRetry,
          disabled: disabled || !onRetry,
          loading: false,
          className: 'border-blue-300 text-blue-600 hover:bg-blue-50'
        }

      case EscrowPaymentStatus.VOIDED:
        return {
          label: 'Payment Cancelled',
          icon: XCircle,
          variant: 'secondary',
          onClick: undefined,
          disabled: true,
          loading: false,
          className: 'bg-gray-100 text-gray-600'
        }

      default:
        return {
          label: 'Start Payment',
          icon: Lock,
          variant: 'default',
          onClick: onAuthorize,
          disabled: disabled || !onAuthorize,
          loading: false,
          className: 'bg-blue-500 hover:bg-blue-600 text-white'
        }
    }
  }

  const config = getActionConfig()
  const IconComponent = config.icon
  const isLoadingState = config.loading || isLoading

  // Show urgency for time-sensitive actions
  const isUrgent = timeRemaining && timeRemaining <= 300 && status === EscrowPaymentStatus.AUTHORIZED
  const isNearExpiry = timeRemaining && timeRemaining <= 60

  return (
    <div className="space-y-2">
      {/* Main Action Button */}
      <motion.div
        whileHover={{ scale: config.disabled ? 1 : 1.02 }}
        whileTap={{ scale: config.disabled ? 1 : 0.98 }}
        animate={isUrgent ? {
          scale: [1, 1.02, 1],
          transition: { duration: 1.5, repeat: Infinity }
        } : {}}
      >
        <Button
          onClick={config.onClick}
          disabled={config.disabled}
          size={size}
          variant={variant}
          className={cn(
            'w-full font-semibold transition-all duration-300',
            config.className,
            isUrgent && 'ring-2 ring-amber-400 ring-offset-2',
            className
          )}
        >
          {/* Icon with animation */}
          <motion.div
            animate={isLoadingState ? {
              rotate: [0, 360],
              transition: { duration: 1, repeat: Infinity, ease: "linear" }
            } : {}}
            className="mr-2"
          >
            <IconComponent className="h-4 w-4" />
          </motion.div>

          {/* Button Label */}
          <span>{config.label}</span>

          {/* Security Indicator */}
          {[EscrowPaymentStatus.IDLE, EscrowPaymentStatus.AUTHORIZED].includes(status) && (
            <Shield className="h-4 w-4 ml-2 opacity-70" />
          )}
        </Button>
      </motion.div>

      {/* Secondary Actions */}
      {status === EscrowPaymentStatus.AUTHORIZED && onVoid && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={onVoid}
            variant="ghost"
            size="sm"
            className="w-full text-gray-500 hover:text-gray-700"
          >
            <XCircle className="h-3 w-3 mr-2" />
            Cancel Payment
          </Button>
        </motion.div>
      )}

      {/* Urgency Warning */}
      {isNearExpiry && status === EscrowPaymentStatus.AUTHORIZED && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200"
        >
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700 font-medium">
            Payment expires in {Math.floor(timeRemaining! / 60)}m {timeRemaining! % 60}s
          </span>
        </motion.div>
      )}

      {/* Helper Text */}
      {status === EscrowPaymentStatus.AUTHORIZED && !isUrgent && (
        <p className="text-xs text-center text-muted-foreground">
          Funds are secured. Complete payment to transfer to seller.
        </p>
      )}

      {status === EscrowPaymentStatus.EXPIRED && (
        <p className="text-xs text-center text-red-600">
          Payment expired. You can claim a full refund.
        </p>
      )}

      {status === EscrowPaymentStatus.COMPLETED && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-xs text-green-600 font-medium">
            🎉 Payment successful! Access granted.
          </p>
        </motion.div>
      )}
    </div>
  )
}

/**
 * Compact Action Button - For tight spaces
 */
export function EscrowActionButtonCompact({
  status,
  onAuthorize,
  onCapture,
  isLoading = false,
  className = ''
}: Pick<EscrowActionButtonProps, 'status' | 'onAuthorize' | 'onCapture' | 'isLoading' | 'className'>) {
  const getCompactConfig = () => {
    switch (status) {
      case EscrowPaymentStatus.IDLE:
        return { icon: Lock, onClick: onAuthorize, variant: 'default' as const }
      case EscrowPaymentStatus.AUTHORIZED:
        return { icon: Zap, onClick: onCapture, variant: 'default' as const }
      case EscrowPaymentStatus.COMPLETED:
        return { icon: CheckCircle, onClick: undefined, variant: 'secondary' as const }
      default:
        return { icon: RefreshCw, onClick: undefined, variant: 'secondary' as const }
    }
  }

  const config = getCompactConfig()
  const IconComponent = config.icon

  return (
    <Button
      onClick={config.onClick}
      disabled={!config.onClick || isLoading}
      size="sm"
      variant={config.variant}
      className={cn(
        'h-8 w-8 p-0',
        className
      )}
    >
      <motion.div
        animate={isLoading ? {
          rotate: [0, 360],
          transition: { duration: 1, repeat: Infinity, ease: "linear" }
        } : {}}
      >
        <IconComponent className="h-4 w-4" />
      </motion.div>
    </Button>
  )
}

export default EscrowActionButton
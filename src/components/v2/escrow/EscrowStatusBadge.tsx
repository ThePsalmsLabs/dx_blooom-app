/**
 * Escrow Status Badge - Visual Payment Status Indicator
 * 
 * Color-coded status display with minimal text and clear icons.
 * Focus: Instant status recognition through color and animation.
 */

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Lock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Shield,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EscrowPaymentStatus } from '@/hooks/contracts/v2/managers/useBaseCommerceIntegration'

interface EscrowStatusBadgeProps {
  status: EscrowPaymentStatus
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig = {
  [EscrowPaymentStatus.IDLE]: {
    icon: Clock,
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    text: 'Ready',
    pulse: false
  },
  [EscrowPaymentStatus.AUTHORIZING]: {
    icon: Loader2,
    color: 'bg-blue-100 text-blue-600 border-blue-200',
    text: 'Securing...',
    pulse: true
  },
  [EscrowPaymentStatus.AUTHORIZED]: {
    icon: Lock,
    color: 'bg-blue-100 text-blue-600 border-blue-200',
    text: 'Secured',
    pulse: false
  },
  [EscrowPaymentStatus.CAPTURING]: {
    icon: Zap,
    color: 'bg-amber-100 text-amber-600 border-amber-200',
    text: 'Processing...',
    pulse: true
  },
  [EscrowPaymentStatus.COMPLETED]: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-600 border-green-200',
    text: 'Complete',
    pulse: false
  },
  [EscrowPaymentStatus.VOIDED]: {
    icon: XCircle,
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    text: 'Cancelled',
    pulse: false
  },
  [EscrowPaymentStatus.EXPIRED]: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-600 border-red-200',
    text: 'Expired',
    pulse: false
  },
  [EscrowPaymentStatus.FAILED]: {
    icon: XCircle,
    color: 'bg-red-100 text-red-600 border-red-200',
    text: 'Failed',
    pulse: false
  }
}

const sizeConfig = {
  sm: {
    badge: 'px-2 py-1 text-xs',
    icon: 'h-3 w-3'
  },
  md: {
    badge: 'px-3 py-1.5 text-sm',
    icon: 'h-4 w-4'
  },
  lg: {
    badge: 'px-4 py-2 text-base',
    icon: 'h-5 w-5'
  }
}

export function EscrowStatusBadge({ 
  status, 
  className = '',
  showText = true,
  size = 'md'
}: EscrowStatusBadgeProps) {
  const config = statusConfig[status]
  const sizes = sizeConfig[size]
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge
        variant="outline"
        className={cn(
          'flex items-center gap-1.5 font-medium border-2 transition-all duration-300',
          config.color,
          sizes.badge,
          className
        )}
      >
        {/* Status Icon */}
        <motion.div
          animate={config.pulse ? { 
            rotate: [0, 360],
            transition: { duration: 1, repeat: Infinity, ease: "linear" }
          } : {}}
        >
          <IconComponent className={sizes.icon} />
        </motion.div>

        {/* Status Text */}
        {showText && (
          <span className="font-semibold">
            {config.text}
          </span>
        )}

        {/* Security Indicator for Protected States */}
        {[EscrowPaymentStatus.AUTHORIZED, EscrowPaymentStatus.CAPTURING].includes(status) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Shield className="h-3 w-3 text-blue-500" />
          </motion.div>
        )}
      </Badge>
    </motion.div>
  )
}

/**
 * Minimal status indicator - Icon only
 */
export function EscrowStatusIcon({ 
  status, 
  className = '',
  size = 'md'
}: Omit<EscrowStatusBadgeProps, 'showText'>) {
  const config = statusConfig[status]
  const sizes = sizeConfig[size]
  const IconComponent = config.icon

  return (
    <motion.div
      className={cn(
        'rounded-full p-1.5 border-2 transition-all duration-300',
        config.color,
        className
      )}
      animate={config.pulse ? { 
        scale: [1, 1.1, 1],
        transition: { duration: 1.5, repeat: Infinity }
      } : {}}
    >
      <motion.div
        animate={config.pulse && status === EscrowPaymentStatus.AUTHORIZING ? { 
          rotate: [0, 360],
          transition: { duration: 1, repeat: Infinity, ease: "linear" }
        } : {}}
      >
        <IconComponent className={sizes.icon} />
      </motion.div>
    </motion.div>
  )
}

export default EscrowStatusBadge
/**
 * RefundStatusBadge.tsx - Visual status indicator for refunds
 * 
 * Provides color-coded badges with animations and tooltips to clearly
 * communicate refund request status to users and admins.
 */

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed'

interface RefundStatusBadgeProps {
  status: RefundStatus
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'default' | 'lg'
  animated?: boolean
}

const statusConfig = {
  pending: {
    label: 'Pending Review',
    description: 'Your refund request is being reviewed by our team',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    pulseClass: 'animate-pulse'
  },
  approved: {
    label: 'Approved',
    description: 'Your refund has been approved and will be processed shortly',
    icon: CheckCircle2,
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    pulseClass: ''
  },
  rejected: {
    label: 'Rejected',
    description: 'Your refund request has been rejected. Check admin notes for details.',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    pulseClass: ''
  },
  processed: {
    label: 'Processed',
    description: 'Your refund has been processed and funds have been returned',
    icon: CheckCircle2,
    variant: 'secondary' as const,
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    pulseClass: ''
  }
}

export function RefundStatusBadge({ 
  status, 
  className, 
  showIcon = true,
  size = 'default',
  animated = true
}: RefundStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={config.variant}
            className={cn(
              config.className,
              sizeClasses[size],
              animated && config.pulseClass,
              'inline-flex items-center gap-1.5 font-medium transition-all',
              className
            )}
          >
            {showIcon && (
              <Icon 
                className={cn(
                  iconSizes[size],
                  status === 'pending' && animated && 'animate-pulse'
                )} 
              />
            )}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Simplified version without tooltip for use in dense layouts
 */
export function SimpleRefundStatusBadge({ 
  status, 
  className,
  size = 'sm'
}: Omit<RefundStatusBadgeProps, 'showIcon' | 'animated'>) {
  const config = statusConfig[status]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  return (
    <Badge
      variant={config.variant}
      className={cn(
        config.className,
        sizeClasses[size],
        'font-medium',
        className
      )}
    >
      {config.label}
    </Badge>
  )
}

/**
 * Status indicator with progress for admin interfaces
 */
export function RefundStatusProgress({ 
  status, 
  className,
  showSteps = true 
}: {
  status: RefundStatus
  className?: string
  showSteps?: boolean
}) {
  const steps = [
    { key: 'pending', label: 'Submitted', completed: true },
    { key: 'approved', label: 'Approved', completed: status === 'approved' || status === 'processed' },
    { key: 'processed', label: 'Processed', completed: status === 'processed' }
  ]

  // Handle rejected status separately
  if (status === 'rejected') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <RefundStatusBadge status="rejected" size="sm" />
        {showSteps && (
          <span className="text-sm text-muted-foreground">Request rejected</span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <RefundStatusBadge status={status} size="sm" />
      
      {showSteps && (
        <div className="flex items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={cn(
                'w-2 h-2 rounded-full',
                step.completed ? 'bg-green-500' : 'bg-gray-300',
                step.key === status && !step.completed && 'bg-orange-500 animate-pulse'
              )} />
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-1',
                  steps[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'
                )} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Interactive status badge with loading state for status changes
 */
export function InteractiveRefundStatusBadge({
  status,
  isLoading = false,
  onClick,
  className
}: RefundStatusBadgeProps & {
  isLoading?: boolean
  onClick?: () => void
}) {
  const config = statusConfig[status]

  if (isLoading) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          'inline-flex items-center gap-1.5 font-medium transition-all',
          'bg-gray-100 text-gray-600 border-gray-200',
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Updating...
      </Badge>
    )
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium transition-all',
          'hover:scale-105 active:scale-95 cursor-pointer',
          className
        )}
      >
        <RefundStatusBadge 
          status={status} 
          className="transition-transform" 
        />
      </button>
    )
  }

  return <RefundStatusBadge status={status} className={className} />
}
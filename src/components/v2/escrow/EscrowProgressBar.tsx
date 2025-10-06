/**
 * Escrow Progress Bar - Timeline Visualization Component
 * 
 * Visual timeline showing payment flow progress with minimal text.
 * Focus: Clear visual progression through payment states.
 */

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { 
  Lock, 
  Zap, 
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EscrowPaymentStatus } from '@/hooks/contracts/v2/managers/useBaseCommerceIntegration'

interface EscrowProgressBarProps {
  status: EscrowPaymentStatus
  timeRemaining?: number
  className?: string
  variant?: 'horizontal' | 'vertical'
  showLabels?: boolean
  compact?: boolean
}

type ProgressStepStatus = 'pending' | 'active' | 'completed' | 'failed'

interface ProgressStep {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  status: ProgressStepStatus
  color: string
}

export function EscrowProgressBar({
  status,
  timeRemaining,
  className = '',
  variant = 'horizontal',
  showLabels = true,
  compact = false
}: EscrowProgressBarProps) {
  
  // Define the progress steps
  const getSteps = (): ProgressStep[] => {
    const baseSteps: ProgressStep[] = [
      {
        id: 'authorize',
        icon: Lock,
        label: 'Secure',
        status: 'pending' as const,
        color: 'text-blue-500'
      },
      {
        id: 'capture',
        icon: Zap,
        label: 'Process',
        status: 'pending' as const,
        color: 'text-amber-500'
      },
      {
        id: 'complete',
        icon: CheckCircle,
        label: 'Complete',
        status: 'pending' as const,
        color: 'text-green-500'
      }
    ]

    // Update step statuses based on current payment status (immutable way)
    switch (status) {
      case EscrowPaymentStatus.AUTHORIZING:
        return baseSteps.map((step, idx) => 
          idx === 0 ? { ...step, status: 'active' as const } : step
        )
      case EscrowPaymentStatus.AUTHORIZED:
        return baseSteps.map((step, idx) => {
          if (idx === 0) return { ...step, status: 'completed' as const }
          if (idx === 1) return { ...step, status: 'active' as const }
          return step
        })
      case EscrowPaymentStatus.CAPTURING:
        return baseSteps.map((step, idx) => {
          if (idx === 0) return { ...step, status: 'completed' as const }
          if (idx === 1) return { ...step, status: 'active' as const }
          return step
        })
      case EscrowPaymentStatus.COMPLETED:
        return baseSteps.map(step => ({ ...step, status: 'completed' as const }))
      case EscrowPaymentStatus.FAILED:
      case EscrowPaymentStatus.EXPIRED:
      case EscrowPaymentStatus.VOIDED:
        // Mark current step as failed
        if (status === EscrowPaymentStatus.FAILED) {
          const activeIndex = baseSteps.findIndex(s => s.status === 'active')
          const failedIndex = activeIndex >= 0 ? activeIndex : 0
          return baseSteps.map((step, idx) => 
            idx === failedIndex 
              ? { ...step, status: 'failed' as const, icon: XCircle }
              : step
          )
        }
        return baseSteps
      default:
        return baseSteps
    }
  }

  const steps = getSteps()
  const currentStepIndex = steps.findIndex(s => s.status === 'active')
  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progressPercentage = (completedSteps / steps.length) * 100

  if (variant === 'vertical') {
    return (
      <div className={cn("space-y-4", className)}>
        {steps.map((step, index) => (
          <VerticalStep
            key={step.id}
            step={step}
            isLast={index === steps.length - 1}
            showLabels={showLabels}
            compact={compact}
          />
        ))}
        
        {/* Timer Display */}
        {timeRemaining && timeRemaining > 0 && (
          <TimeDisplay timeRemaining={timeRemaining} compact={compact} />
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress Bar */}
      <div className="relative">
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-gray-100"
        />
        
        {/* Step Indicators */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center -mt-1">
          {steps.map((step, index) => (
            <StepIndicator
              key={step.id}
              step={step}
              index={index}
              compact={compact}
            />
          ))}
        </div>
      </div>

      {/* Step Labels */}
      {showLabels && !compact && (
        <div className="flex justify-between">
          {steps.map((step) => (
            <div key={step.id} className="text-center">
              <p className={cn(
                "text-sm font-medium transition-colors",
                step.status === 'completed' ? 'text-green-600' :
                step.status === 'active' ? 'text-blue-600' :
                step.status === 'failed' ? 'text-red-600' :
                'text-gray-400'
              )}>
                {step.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Current Status & Timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentStepIndex >= 0 && (
            <>
              {React.createElement(steps[currentStepIndex].icon, { className: "h-4 w-4 text-blue-500" })}
              <span className="text-sm text-muted-foreground">
                {steps[currentStepIndex].label}ing...
              </span>
            </>
          )}
        </div>
        
        {timeRemaining && timeRemaining > 0 && (
          <TimeDisplay timeRemaining={timeRemaining} compact />
        )}
      </div>
    </div>
  )
}

/**
 * Individual Step Indicator
 */
function StepIndicator({ 
  step, 
  index, 
  compact 
}: { 
  step: ProgressStep
  index: number
  compact: boolean
}) {
  const IconComponent = step.icon
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative z-10 rounded-full border-2 transition-all duration-300",
        compact ? "p-1" : "p-2",
        step.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
        step.status === 'active' ? 'bg-blue-500 border-blue-500 text-white' :
        step.status === 'failed' ? 'bg-red-500 border-red-500 text-white' :
        'bg-white border-gray-300 text-gray-400'
      )}
    >
      <motion.div
        animate={step.status === 'active' ? {
          scale: [1, 1.1, 1],
          transition: { duration: 1.5, repeat: Infinity }
        } : {}}
      >
        <IconComponent className={compact ? "h-3 w-3" : "h-4 w-4"} />
      </motion.div>
    </motion.div>
  )
}

/**
 * Vertical Step Component
 */
function VerticalStep({ 
  step, 
  isLast, 
  showLabels, 
  compact 
}: { 
  step: ProgressStep
  isLast: boolean
  showLabels: boolean
  compact: boolean
}) {
  const IconComponent = step.icon
  
  return (
    <div className="flex items-center gap-3">
      {/* Step Icon */}
      <div className={cn(
        "rounded-full border-2 transition-all duration-300 flex-shrink-0",
        compact ? "p-1" : "p-2",
        step.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
        step.status === 'active' ? 'bg-blue-500 border-blue-500 text-white' :
        step.status === 'failed' ? 'bg-red-500 border-red-500 text-white' :
        'bg-white border-gray-300 text-gray-400'
      )}>
        <motion.div
          animate={step.status === 'active' ? {
            scale: [1, 1.1, 1],
            transition: { duration: 1.5, repeat: Infinity }
          } : {}}
        >
          <IconComponent className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </motion.div>
      </div>

      {/* Step Label */}
      {showLabels && (
        <div className="flex-1">
          <p className={cn(
            "font-medium transition-colors",
            compact ? "text-sm" : "text-base",
            step.status === 'completed' ? 'text-green-600' :
            step.status === 'active' ? 'text-blue-600' :
            step.status === 'failed' ? 'text-red-600' :
            'text-gray-400'
          )}>
            {step.label}
          </p>
        </div>
      )}

      {/* Connecting Line */}
      {!isLast && (
        <div className={cn(
          "absolute left-4 w-0.5 bg-gray-200 transition-colors",
          compact ? "h-6 mt-6" : "h-8 mt-8",
          step.status === 'completed' ? 'bg-green-300' : ''
        )} />
      )}
    </div>
  )
}

/**
 * Time Display Component
 */
function TimeDisplay({ 
  timeRemaining, 
  compact 
}: { 
  timeRemaining: number
  compact: boolean
}) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const isUrgent = timeRemaining <= 300 // 5 minutes

  return (
    <motion.div
      animate={isUrgent ? {
        scale: [1, 1.05, 1],
        transition: { duration: 1, repeat: Infinity }
      } : {}}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md",
        compact ? "text-xs" : "text-sm",
        isUrgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
      )}
    >
      <Clock className={compact ? "h-3 w-3" : "h-4 w-4"} />
      <span className="font-mono font-semibold">
        {formatTime(timeRemaining)}
      </span>
    </motion.div>
  )
}

export default EscrowProgressBar
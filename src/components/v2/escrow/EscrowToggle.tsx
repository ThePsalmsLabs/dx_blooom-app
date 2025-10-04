/**
 * Escrow Toggle Component - Minimal UI for Payment Method Selection
 * 
 * Simple toggle between standard and escrow payments with visual indicators.
 * Focus: Icons and colors over text, instant feedback.
 */

import React from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Lock, Clock, CheckCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EscrowToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  disabled?: boolean
  className?: string
  showBenefits?: boolean
}

const benefits = [
  { icon: Shield, text: 'Payment Protection', color: 'text-blue-500' },
  { icon: Clock, text: 'Refund Guarantee', color: 'text-green-500' },
  { icon: CheckCircle, text: 'Verified Security', color: 'text-purple-500' }
]

export function EscrowToggle({ 
  enabled, 
  onToggle, 
  disabled = false,
  className = '',
  showBenefits = true
}: EscrowToggleProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Toggle Control */}
      <div className="flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md bg-gradient-to-r from-white to-gray-50/50">
        <div className="flex items-center gap-3">
          {/* Payment Method Icon */}
          <motion.div
            animate={{ 
              backgroundColor: enabled ? '#3b82f6' : '#6b7280',
              scale: enabled ? 1.05 : 1
            }}
            className="rounded-full p-2 text-white transition-colors duration-300"
          >
            {enabled ? <Lock className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
          </motion.div>

          {/* Payment Method Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {enabled ? 'Secure Escrow' : 'Standard Payment'}
              </span>
              {enabled && (
                <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700">
                  <Shield className="h-3 w-3" />
                  Protected
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {enabled 
                ? 'Funds secured until confirmed' 
                : 'Direct payment processing'
              }
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={enabled}
                  onCheckedChange={onToggle}
                  disabled={disabled}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{enabled ? 'Switch to standard payment' : 'Enable escrow protection'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Benefits Display */}
      <AnimatePresence>
        {enabled && showBenefits && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/50"
                >
                  <benefit.icon className={cn("h-4 w-4", benefit.color)} />
                  <span className="text-xs font-medium text-center">
                    {benefit.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Info */}
      {enabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-muted-foreground bg-amber-50 p-2 rounded-lg border border-amber-200"
        >
          <Clock className="h-4 w-4 text-amber-500" />
          <span>Payment secured for 30 minutes</span>
        </motion.div>
      )}
    </div>
  )
}

export default EscrowToggle
/**
 * Escrow Details Component - Expandable Information Panel
 * 
 * Collapsible panel showing detailed escrow information.
 * Focus: Advanced users can access detailed info without cluttering main UI.
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/seperator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  DollarSign,
  FileText,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatUnits } from 'viem'
import { toast } from 'sonner'
import { EscrowPaymentData, EscrowPaymentStatus } from '@/hooks/contracts/v2/managers/useBaseCommerceIntegration'

interface EscrowDetailsProps {
  paymentData: EscrowPaymentData | null
  timeRemaining?: number
  className?: string
  defaultOpen?: boolean
}

export function EscrowDetails({
  paymentData,
  timeRemaining,
  className = '',
  defaultOpen = false
}: EscrowDetailsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Expired'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    return `${minutes}m ${secs}s`
  }

  const getStatusColor = (status: EscrowPaymentStatus): string => {
    switch (status) {
      case EscrowPaymentStatus.COMPLETED:
        return 'text-green-600 bg-green-100'
      case EscrowPaymentStatus.AUTHORIZED:
        return 'text-blue-600 bg-blue-100'
      case EscrowPaymentStatus.CAPTURING:
        return 'text-amber-600 bg-amber-100'
      case EscrowPaymentStatus.FAILED:
      case EscrowPaymentStatus.EXPIRED:
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (!paymentData) {
    return (
      <Card className={cn("border-dashed border-2", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Shield className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No active escrow payment
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("transition-all duration-300", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="hover:bg-muted/30 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Payment Details
                <Badge className={getStatusColor(paymentData.status)}>
                  {paymentData.status}
                </Badge>
              </CardTitle>
              
              <Button variant="ghost" size="sm" className="p-1">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <AnimatePresence>
          {isOpen && (
            <CollapsibleContent forceMount>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="space-y-6">
                  {/* Payment Summary */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Payment Summary
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-semibold">
                          ${formatUnits(paymentData.amount, 6)}
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Recipient</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {paymentData.recipient.slice(0, 6)}...{paymentData.recipient.slice(-4)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(paymentData.recipient, 'recipient')}
                          >
                            {copiedField === 'recipient' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Transaction Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Transaction Details
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Payment Hash */}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Payment Hash</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1">
                            {paymentData.paymentHash}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(paymentData.paymentHash, 'hash')}
                          >
                            {copiedField === 'hash' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Timestamps */}
                      {paymentData.authorizedAt && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Authorized At</p>
                          <p className="text-sm font-mono">
                            {new Date(paymentData.authorizedAt).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {paymentData.capturedAt && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Captured At</p>
                          <p className="text-sm font-mono">
                            {new Date(paymentData.capturedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timing Information */}
                  {timeRemaining !== undefined && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Timing
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Time Remaining</p>
                            <p className={cn(
                              "font-semibold font-mono",
                              timeRemaining <= 300 ? 'text-red-600' : 'text-blue-600'
                            )}>
                              {formatTimeRemaining(timeRemaining)}
                            </p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Expires At</p>
                            <p className="text-sm font-mono">
                              {new Date(Number(paymentData.expirationTime) * 1000).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Security Information */}
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Security
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Escrow Protection</p>
                          <p className="text-xs text-blue-700">
                            Funds are secured in smart contract escrow
                          </p>
                        </div>
                        <Shield className="h-5 w-5 text-blue-500" />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Refund Guarantee</p>
                          <p className="text-xs text-green-700">
                            Automatic refund if payment expires
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </div>

                  {/* Action Links */}
                  <Separator />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => window.open(`https://basescan.org/tx/${paymentData.paymentHash}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View on Explorer
                    </Button>
                  </div>
                </CardContent>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
    </Card>
  )
}

export default EscrowDetails
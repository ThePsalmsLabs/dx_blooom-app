/**
 * RefundRequestModal.tsx - User refund request interface
 * 
 * Provides a comprehensive modal for users to request refunds for their purchases.
 * Integrates with useRefundManager hook for contract interactions.
 */

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useRefundManager } from '@/hooks/contracts/v2/managers/useRefundManager'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/seperator'
import { Card, CardContent } from '@/components/ui/card'
import { formatUnits } from 'viem'

interface RefundRequestModalProps {
  isOpen: boolean
  onClose: () => void
  intentId: `0x${string}`
  purchaseAmount: bigint
  contentTitle?: string
  contentCreator?: string
  purchaseDate?: Date
  creatorAmount?: bigint
  platformFee?: bigint
  operatorFee?: bigint
}

const REFUND_REASONS = [
  { value: 'content_not_available', label: 'Content Not Available' },
  { value: 'technical_issues', label: 'Technical Issues' },
  { value: 'payment_error', label: 'Payment Error' },
  { value: 'content_mismatch', label: 'Content Not as Described' },
  { value: 'accidental_purchase', label: 'Accidental Purchase' },
  { value: 'quality_issues', label: 'Quality Issues' },
  { value: 'other', label: 'Other (Please specify)' }
] as const

export function RefundRequestModal({
  isOpen,
  onClose,
  intentId,
  purchaseAmount,
  contentTitle = 'Content',
  contentCreator = 'Creator',
  purchaseDate,
  creatorAmount,
  platformFee,
  operatorFee
}: RefundRequestModalProps) {
  const { address: userAddress } = useAccount()
  const { requestRefund } = useRefundManager()

  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate fee breakdown if not provided 
  const calculatedPlatformFee = platformFee || (purchaseAmount * BigInt(250)) / BigInt(10000)  // 2.5%
  const calculatedOperatorFee = operatorFee || (purchaseAmount * BigInt(50)) / BigInt(10000)   // 0.5%  
  const calculatedCreatorAmount = creatorAmount || (purchaseAmount - calculatedPlatformFee - calculatedOperatorFee) // Remaining ~97%

  const handleSubmit = async () => {
    if (!userAddress) {
      toast.error('Please connect your wallet to request a refund.')
      return
    }

    if (!selectedReason) {
      toast.error('Please select a reason for the refund.')
      return
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      toast.error('Please provide details for your refund request.')
      return
    }

    if (!agreeToTerms) {
      toast.error('Please agree to the refund terms and conditions.')
      return
    }

    setIsSubmitting(true)

    try {
      const reason = selectedReason === 'other' 
        ? customReason 
        : REFUND_REASONS.find(r => r.value === selectedReason)?.label || selectedReason

      await requestRefund.mutateAsync({
        intentId,
        user: userAddress,
        creatorAmount: calculatedCreatorAmount,
        platformFee: calculatedPlatformFee,
        operatorFee: calculatedOperatorFee,
        reason
      })

      toast.success('Your refund request has been submitted and will be reviewed by our team.')

      onClose()
      
      // Reset form
      setSelectedReason('')
      setCustomReason('')
      setAgreeToTerms(false)
    } catch (error) {
      console.error('Failed to submit refund request:', error)
      toast.error('Failed to submit refund request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatAmount = (amount: bigint) => {
    return `$${formatUnits(amount, 6)}` // Assuming USDC with 6 decimals
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Request Refund
          </DialogTitle>
          <DialogDescription>
            Submit a refund request for your purchase. Our team will review your request within 1-2 business days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Purchase Details */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Content</span>
                  <span className="font-medium">{contentTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Creator</span>
                  <span className="font-medium">{contentCreator}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold">{formatAmount(purchaseAmount)}</span>
                </div>
                {purchaseDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm">{purchaseDate.toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Intent ID</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {intentId.slice(0, 8)}...{intentId.slice(-6)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refund Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Refund *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason */}
          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Please provide details *</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please explain your reason for requesting a refund..."
                rows={3}
              />
            </div>
          )}

          {/* Refund Amount Breakdown */}
          <div className="space-y-2">
            <Label>Refund Amount Breakdown</Label>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Creator Amount</span>
                    <span>{formatAmount(calculatedCreatorAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span>{formatAmount(calculatedPlatformFee)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Operator Fee</span>
                    <span>{formatAmount(calculatedOperatorFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total Refund</span>
                    <span>{formatAmount(purchaseAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={setAgreeToTerms}
            />
            <Label htmlFor="terms" className="text-sm">
              I agree to the refund terms and understand that this request will be reviewed. 
              Processing may take 1-2 business days and refunds are subject to our refund policy.
            </Label>
          </div>

          {/* Refund Process Info */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Refund Process</p>
                <ul className="space-y-1 text-xs">
                  <li>• Your request will be reviewed within 1-2 business days</li>
                  <li>• You'll receive an email notification with the decision</li>
                  <li>• Approved refunds are processed immediately on-chain</li>
                  <li>• Funds will return to your original payment method</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || !agreeToTerms || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
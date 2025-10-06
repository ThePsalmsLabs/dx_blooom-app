/**
 * Refund Management Components - Export Index
 * 
 * Comprehensive refund management system with user-facing and admin interfaces.
 * Features sophisticated UI/UX, real-time updates, and advanced interactions.
 */

export { RefundRequestModal } from './RefundRequestModal'
export { RefundHistoryTable } from './RefundHistoryTable'
export { 
  RefundStatusBadge, 
  SimpleRefundStatusBadge, 
  RefundStatusProgress, 
  InteractiveRefundStatusBadge,
  type RefundStatus 
} from './RefundStatusBadge'
export { AdminRefundPanel } from './AdminRefundPanel'
export { 
  V2ContentRefundButton, 
  SimpleRefundButton, 
  RefundProtectionCard 
} from './V2ContentRefundButton'
export { RefundSystemDemo } from './RefundSystemDemo'

// Re-export types for external use
export type {
  RefundRequestModalProps,
  RefundHistoryTableProps,
  RefundStatusBadgeProps
} from './types'

// Utility functions for refund components
export const RefundUtils = {
  /**
   * Format refund amount with currency symbol
   */
  formatRefundAmount: (amount: bigint, decimals: number = 6): string => {
    return `$${(Number(amount) / Math.pow(10, decimals)).toFixed(2)}`
  },

  /**
   * Get refund status display color
   */
  getStatusColor: (status: string): string => {
    switch (status) {
      case 'pending': return 'orange'
      case 'approved': return 'blue'
      case 'rejected': return 'red'
      case 'processed': return 'green'
      default: return 'gray'
    }
  },

  /**
   * Calculate refund eligibility based on time and conditions
   */
  isRefundEligible: (
    purchaseDate: Date, 
    accessCount: number = 0, 
    maxDays: number = 30,
    maxAccess: number = 10
  ): { eligible: boolean; reason?: string } => {
    const daysSincePurchase = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSincePurchase > maxDays) {
      return { eligible: false, reason: `Refund period expired (${maxDays} days)` }
    }
    
    if (accessCount > maxAccess) {
      return { eligible: false, reason: `Excessive usage (${accessCount} accesses)` }
    }
    
    return { eligible: true }
  },

  /**
   * Get priority level based on request characteristics
   */
  calculatePriority: (
    amount: bigint,
    userReputation: number,
    contentAccessCount: number
  ): 'low' | 'medium' | 'high' | 'urgent' => {
    const amountUSD = Number(amount) / 1e6 // Assuming USDC
    
    // Urgent: High amount + technical issues
    if (amountUSD > 100 && contentAccessCount === 0) return 'urgent'
    
    // High: High amount or low access with good reputation
    if (amountUSD > 50 || (contentAccessCount < 3 && userReputation > 8)) return 'high'
    
    // Medium: Moderate conditions
    if (amountUSD > 20 || userReputation > 6) return 'medium'
    
    // Low: Small amounts or extensive usage
    return 'low'
  }
}
/**
 * Types for Refund Management Components
 */


export interface RefundRequestModalProps {
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

export interface RefundHistoryTableProps {
  className?: string
}

export interface RefundStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'default' | 'lg'
  animated?: boolean
}
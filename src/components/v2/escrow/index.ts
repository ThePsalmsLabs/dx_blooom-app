/**
 * Escrow Components - V2 Escrow Payment System UI
 * 
 * Export all escrow-related components for V2 implementation
 */

export { EscrowToggle, default as EscrowToggleDefault } from './EscrowToggle'
export { EscrowStatusBadge, EscrowStatusIcon, default as EscrowStatusBadgeDefault } from './EscrowStatusBadge'
export { EscrowProgressBar, default as EscrowProgressBarDefault } from './EscrowProgressBar'
export { EscrowActionButton, EscrowActionButtonCompact, default as EscrowActionButtonDefault } from './EscrowActionButton'
export { EscrowDetails, default as EscrowDetailsDefault } from './EscrowDetails'

// Re-export types and enums from the hook
export type { 
  EscrowPaymentParams, 
  EscrowPaymentData, 
  EscrowTimer 
} from '@/hooks/contracts/v2/managers/useBaseCommerceIntegration'

export { EscrowPaymentStatus } from '@/hooks/contracts/v2/managers/useBaseCommerceIntegration'
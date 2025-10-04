/**
 * V2 Manager Hooks - Centralized Export
 * 
 * This file exports all V2 contract manager hooks for easy importing
 * throughout the application.
 */

// Core Manager Hooks
export { useAccessManager } from './useAccessManager'
export { useAdminManager } from './useAdminManager'
export { useCommerceProtocolCore } from './useCommerceProtocolCore'
export { useLoyaltyManager } from './useLoyaltyManager'
export { usePermitPaymentManager } from './usePermitPaymentManager'
export { usePriceOracle } from './usePriceOracle'
export { useRefundManager } from './useRefundManager'
export { useRewardsIntegration } from './useRewardsIntegration'
export { useSignatureManager } from './useSignatureManager'
export { useViewManager } from './useViewManager'

// Treasury Management Hook (Week 1 - V2 Completion)
export { useRewardsTreasury, useTreasuryOperations } from './useRewardsTreasury'

// Escrow Payment Hook (Week 2 - V2 Completion)  
export { useBaseCommerceIntegration, useEscrowPaymentFlow } from './useBaseCommerceIntegration'

// Advanced Commerce Protocol Permit Hook (Week 3 - V2 Completion)
export { useCommerceProtocolPermit } from './useCommerceProtocolPermit'

// Type exports for TypeScript support
export type {
  TreasuryStats,
  PoolBalance,
  PendingRewards
} from './useRewardsTreasury'

export type {
  EscrowPaymentParams,
  EscrowPaymentData,
  EscrowTimer
} from './useBaseCommerceIntegration'

export { EscrowPaymentStatus } from './useBaseCommerceIntegration'

export type {
  PlatformPaymentRequest,
  EnhancedPermit2Data,
  PaymentContext,
  PermitPaymentStatus,
  OperatorMetrics
} from './useCommerceProtocolPermit'
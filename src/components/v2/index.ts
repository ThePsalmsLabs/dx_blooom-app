/**
 * V2 Components and Hooks Export Index
 * 
 * Central export for all V2 components and hooks for easy importing
 */

// V2 Component exports
export { V2ContentPurchaseCard } from './V2ContentPurchaseCard'
export { V2MiniAppPurchaseButton } from './V2MiniAppPurchaseButton'
export { V2PaymentModal, useV2PaymentModal } from './V2PaymentModal'

// V2 MiniApp-specific components
export * from './miniapp'

// V2 Loyalty Components
export * from './loyalty'

// V2 Refund Management Components
export * from './refunds'

// V2 Treasury Management Components (Week 1 - V2 Completion)
export * from './treasury'

// V2 Escrow Payment Components (Week 2 - V2 Completion)
export * from './escrow'

// V2 Advanced Permit Components (Week 3 - V2 Completion)
export * from './permits'

// V2 Hook exports
export { useV2PurchaseFlow, useSimpleV2Purchase } from '../../hooks/v2/useV2PurchaseFlow'

// Re-export V2 manager hooks for convenience
export { useCommerceProtocolCore } from '../../hooks/contracts/v2/managers/useCommerceProtocolCore'
export { usePriceOracle, useTokenQuote, useETHUSDCPrice, useContentPricing } from '../../hooks/contracts/v2/managers/usePriceOracle'
export { useSignatureManager, useSignatureStatus } from '../../hooks/contracts/v2/managers/useSignatureManager'
export { useAccessManager, useContentAccess, useCreatorSubscription } from '../../hooks/contracts/v2/managers/useAccessManager'
export { useV2PaymentOrchestrator, useContentPurchase } from '../../hooks/contracts/v2/unified/useV2PaymentOrchestrator'

// V2 Treasury Management Hooks (Week 1 - V2 Completion)
export { useRewardsTreasury, useTreasuryOperations } from '../../hooks/contracts/v2/managers/useRewardsTreasury'

// V2 Escrow Payment Hooks (Week 2 - V2 Completion)
export { useBaseCommerceIntegration, useEscrowPaymentFlow } from '../../hooks/contracts/v2/managers/useBaseCommerceIntegration'

// V2 Commerce Protocol Permit Hooks (Week 3 - V2 Completion)
export { useCommerceProtocolPermit } from '../../hooks/contracts/v2/managers/useCommerceProtocolPermit'

// Export types for external use
export type { 
  PlatformPaymentRequest, 
  PaymentContext,
  PaymentInfo 
} from '../../hooks/contracts/v2/managers/useCommerceProtocolCore'

export type { 
  TokenQuoteRequest, 
  PriceValidationRequest 
} from '../../hooks/contracts/v2/managers/usePriceOracle'

export type { 
  PaymentIntentData,
  PAYMENT_INTENT_TYPES 
} from '../../hooks/contracts/v2/managers/useSignatureManager'

export type { 
  AccessManagerPaymentContext 
} from '../../hooks/contracts/v2/managers/useAccessManager'

export type { 
  PaymentFlowStatus,
  PaymentFlowState,
  V2PaymentParams 
} from '../../hooks/contracts/v2/unified/useV2PaymentOrchestrator'

export type { 
  V2PaymentMethod,
  V2PaymentMethodConfig,
  V2PaymentExecutionState,
  V2PaymentFlowResult 
} from '../../hooks/v2/useV2PurchaseFlow'

// V2 Payment Modal types
export type { 
  V2PaymentModalProps,
  PaymentModalState,
  PaymentStep,
  PaymentModalConfig 
} from './V2PaymentModal'
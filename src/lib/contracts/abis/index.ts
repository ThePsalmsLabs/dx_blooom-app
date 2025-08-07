// Individual ABI exports
export { PRICE_ORACLE_ABI } from './price-oracle'
export { CREATOR_REGISTRY_ABI } from './creator-registry'
export { CONTENT_REGISTRY_ABI } from './content-registry'
export { PAY_PER_VIEW_ABI } from './pay-per-view'
export { SUBSCRIPTION_MANAGER_ABI } from './subscription-manager'
export { COMMERCE_PROTOCOL_INTEGRATION_ABI } from './commerce-protocol-integration'
export { ERC20_ABI } from './erc20'

// Import ABIs for grouped exports
import { PRICE_ORACLE_ABI } from './price-oracle'
import { CREATOR_REGISTRY_ABI } from './creator-registry'
import { CONTENT_REGISTRY_ABI } from './content-registry'
import { PAY_PER_VIEW_ABI } from './pay-per-view'
import { SUBSCRIPTION_MANAGER_ABI } from './subscription-manager'
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from './commerce-protocol-integration'

// Grouped exports for convenience
export const CORE_ABIS = {
  CREATOR_REGISTRY: CREATOR_REGISTRY_ABI,
  CONTENT_REGISTRY: CONTENT_REGISTRY_ABI,
} as const

export const PAYMENT_ABIS = {
  PAY_PER_VIEW: PAY_PER_VIEW_ABI,
  SUBSCRIPTION_MANAGER: SUBSCRIPTION_MANAGER_ABI,
} as const

export const INTEGRATION_ABIS = {
  COMMERCE_PROTOCOL: COMMERCE_PROTOCOL_INTEGRATION_ABI,
  PRICE_ORACLE: PRICE_ORACLE_ABI,
} as const

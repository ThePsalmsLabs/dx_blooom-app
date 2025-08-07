/**
 * Contract ABI Definitions - Smart Contract Interface Layer
 * 
 * @deprecated This file has been refactored into separate files in the ./abis/ directory.
 * Please import from '@/lib/contracts/abis' instead for better organization and performance.
 * 
 * This file now re-exports all ABIs from the new structure for backward compatibility.
 * The new structure allows for better tree-shaking and more maintainable code.
 */

// Re-export all ABIs from the new modular structure
export {
  CREATOR_REGISTRY_ABI,
  CONTENT_REGISTRY_ABI,
  PAY_PER_VIEW_ABI,
  SUBSCRIPTION_MANAGER_ABI,
  COMMERCE_PROTOCOL_INTEGRATION_ABI,
  PRICE_ORACLE_ABI,
  ERC20_ABI,
  CORE_ABIS,
  PAYMENT_ABIS,
  INTEGRATION_ABIS
} from './abis/index'
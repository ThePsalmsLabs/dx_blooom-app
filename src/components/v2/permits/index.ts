/**
 * Permit Payment Components - V2 Gasless Payment System
 * 
 * Components for EIP-712 permit-based gasless payments and signatures
 */

// Core permit components
export { PermitSignatureFlow } from './PermitSignatureFlow'
export { GasSavingsCalculator } from './GasSavingsCalculator'

// Advanced Commerce Protocol permit components (Week 3 - V2 Completion)
export { AdvancedPermitFlow } from './AdvancedPermitFlow'

// Export types for external use
export type { 
  AdvancedPermitStep,
  AdvancedPermitFlowProps,
  AdvancedPermitState
} from './AdvancedPermitFlow'
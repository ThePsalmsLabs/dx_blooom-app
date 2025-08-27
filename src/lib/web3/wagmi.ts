// src/lib/web3/wagmi.ts - Updated to use enhanced configuration
import { enhancedWagmiConfig } from './enhanced-wagmi-config'

// Re-export the enhanced configuration as the main wagmi config
export const wagmiConfig = enhancedWagmiConfig

// Export individual components for flexibility
export { 
  validateRPCConfiguration,
  getCurrentChain,
  isSupportedChain,
  getBlockExplorerUrl
} from './enhanced-wagmi-config'

// Rate limiting is now handled in the enhanced wagmi configuration
// and in the optimized useAllCreators hook
/**
 * Complete Portfolio System Export
 * 
 * This final index file exports all components and hooks from our complete
 * four-phase portfolio management system, creating a comprehensive toolkit
 * for token balance management and trading.
 */

// Phase 1: Foundation Components
export { useEnhancedTokenBalances } from '@/hooks/web3/useEnhancedTokenBalances'
export type { TokenInfo, TokenBalanceState } from '@/hooks/web3/useTokenBalances'
export { TokenBalanceCard } from './TokenBalanceCard'
export { TokenBalanceList } from './TokenBalanceList'

// Utility Functions
export { 
  formatTokenAmount, 
  formatUSDValue 
} from '@/hooks/web3/useTokenBalances'

// Phase 2: Enhanced Purchase Integration
export { SmartContentPurchaseCard } from '@/components/content/SmartContentPurchaseCard'
export { SmartPaymentSelector } from '@/components/purchase/SmartPaymentSelector'

// Phase 3: Swap Functionality
export { useSwapCalculation, useSwapExecution } from '@/hooks/web3/useSwapCalculation'
export type { SwapCalculation } from '@/hooks/web3/useSwapCalculation'
export { SwapModal } from './SwapModal'

// Phase 4: Portfolio Dashboard
export { usePortfolioAnalytics } from '@/hooks/web3/usePortfolioAnalytics'
export type { 
  PortfolioMetrics, 
  TokenAllocation, 
  PortfolioInsight, 
  PortfolioAnalytics 
} from '@/hooks/web3/usePortfolioAnalytics'
export { PortfolioDashboard } from './PortfolioDashboard'

// Re-export common types for convenience
export type { 
  TokenInfo as Token,
  TokenBalanceState as PortfolioState
} from '@/hooks/web3/useTokenBalances'

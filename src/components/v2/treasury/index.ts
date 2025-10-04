/**
 * Treasury Components - V2 Treasury Management UI
 * 
 * Export all treasury-related components for V2 implementation
 */

export { TreasuryDashboard, default as TreasuryDashboardDefault } from './TreasuryDashboard'

// Re-export types if needed
export type { TreasuryStats, PoolBalance, PendingRewards } from '@/hooks/contracts/v2/managers/useRewardsTreasury'
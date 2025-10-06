/**
 * V2 Loyalty System Components - Export Index
 * 
 * Export all loyalty-related components for easy imports
 */

export { LoyaltyDashboard } from './LoyaltyDashboard'
export { TierBadge, TIER_CONFIG } from './TierBadge'
export { TierProgressBar } from './TierProgressBar'
export { PointsHistory } from './PointsHistory'
export { BenefitsDisplay } from './BenefitsDisplay'

// Re-export types
export type { LoyaltyTier } from './TierBadge'
export type { LoyaltyDashboardProps } from './LoyaltyDashboard'
export type { TierBadgeProps } from './TierBadge'
export type { TierProgressBarProps } from './TierProgressBar'
export type { PointsTransaction } from './PointsHistory'
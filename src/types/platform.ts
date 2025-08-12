/**
 * Platform Type Definitions - Shared Interface Layer
 * File: src/types/platform.ts
 * 
 * This file defines TypeScript interfaces shared across the entire platform,
 * focusing on business logic types, subscription management, and user-facing
 * data structures. These types represent the core platform concepts and workflows
 * that span multiple components and features.
 * 
 * These types serve critical architectural purposes:
 * 1. Business Logic Consistency: Ensures consistent data structures across all platform features
 * 2. Component Integration: Enables seamless data flow between different platform areas
 * 3. Feature Scalability: Provides extensible interfaces for new platform capabilities
 * 4. Type Safety: Maintains compile-time safety for complex business workflows
 * 
 * Unlike contracts.ts which mirrors smart contract structures, this file defines
 * the enhanced, UI-friendly interfaces that components actually work with in practice.
 */

import { type Address, type Hash } from 'viem'

// ===== CORE PLATFORM ENUMS =====

/**
 * Subscription Status Types
 * 
 * These represent the various states a subscription can be in from a user perspective,
 * providing more nuanced status information than simple active/inactive flags.
 */
export type SubscriptionStatus = 
  | 'active'        // Subscription is currently active and valid
  | 'expired'       // Subscription has expired naturally
  | 'cancelled'     // Subscription was manually cancelled
  | 'grace_period'  // Subscription is in grace period after expiration
  | 'pending'       // Subscription payment is being processed

/**
 * Auto-Renewal Health Status
 * 
 * These indicate the health and reliability of auto-renewal configurations,
 * helping users understand and optimize their renewal settings.
 */
export type AutoRenewalHealthStatus = 
  | 'healthy'       // Auto-renewal is working perfectly
  | 'warning'       // Some issues but still functional (low balance, etc.)
  | 'critical'      // Critical issues that need immediate attention
  | 'disabled'      // Auto-renewal is disabled or not configured

/**
 * Payment Failure Reasons
 * 
 * These provide specific context about why auto-renewal payments failed,
 * enabling targeted recovery strategies and user guidance.
 */
export type PaymentFailureReason = 
  | 'insufficient_balance'     // Not enough USDC in auto-renewal balance
  | 'price_exceeded'          // Creator's price exceeds max price setting
  | 'network_error'           // Blockchain network issues
  | 'contract_error'          // Smart contract execution failure
  | 'approval_expired'        // Token approval expired or insufficient
  | 'creator_unavailable'     // Creator account issues

// ===== SUBSCRIPTION MANAGEMENT INTERFACES =====

/**
 * Enhanced Subscription Record Interface
 * 
 * This extends the basic contract data with calculated fields and UI-friendly
 * information, providing everything components need for subscription display.
 */
export interface SubscriptionRecord {
  readonly isActive: boolean
  readonly startTime: bigint
  readonly endTime: bigint
  readonly renewalCount: bigint
  readonly totalPaid: bigint
  readonly lastPayment: bigint
  readonly lastRenewalTime: bigint
  readonly autoRenewalEnabled: boolean
  // Enhanced fields for UI display
  readonly creator: Address
  readonly user: Address
  readonly subscriptionId: string
  readonly status: SubscriptionStatus
  readonly daysRemaining: number
  readonly monthlyPrice: bigint
  readonly nextRenewalDate: Date | null
  readonly canCancel: boolean
  readonly inGracePeriod: boolean
  readonly gracePeriodEnd: bigint
}

/**
 * Subscription Summary Interface
 * 
 * Aggregated view of user's subscription portfolio for dashboard displays,
 * providing high-level insights and key metrics at a glance.
 */
export interface UserSubscriptionSummary {
  readonly totalSubscriptions: number
  readonly activeSubscriptions: number
  readonly expiredSubscriptions: number
  readonly totalMonthlySpend: bigint
  readonly subscriptions: readonly SubscriptionRecord[]
  readonly nextRenewalDate: Date | null
  readonly hasActiveSubscriptions: boolean
  readonly averageSubscriptionPrice: bigint
  readonly mostExpensiveSubscription: bigint
  readonly longestSubscriptionDays: number
  readonly totalLifetimeSpend: bigint
}

// ===== AUTO-RENEWAL CONFIGURATION INTERFACES =====

/**
 * Auto-Renewal Configuration Interface
 * 
 * This mirrors the smart contract's AutoRenewal struct while adding
 * computed fields for enhanced user experience and decision making.
 */
export interface AutoRenewalConfig {
  readonly enabled: boolean
  readonly maxPrice: bigint
  readonly balance: bigint
  readonly lastRenewalAttempt: bigint
  readonly failedAttempts: bigint
  // Enhanced fields for UI optimization
  readonly subscriptionId: string
  readonly creator: Address
  readonly user: Address
  readonly healthStatus: AutoRenewalHealthStatus
  readonly estimatedRenewalsRemaining: number
  readonly nextRenewalEstimate: Date | null
  readonly balanceStatus: 'sufficient' | 'low' | 'insufficient'
  readonly failureRiskLevel: 'low' | 'medium' | 'high'
  readonly lastSuccessfulRenewal: Date | null
  readonly recommendedTopUp: bigint
  readonly monthlyBurnRate: bigint
}

/**
 * Auto-Renewal Setup Options Interface
 * 
 * Configuration parameters for setting up new auto-renewal configurations,
 * providing flexibility while maintaining sensible defaults.
 */
export interface AutoRenewalSetupOptions {
  readonly enable: boolean
  readonly maxPrice?: bigint
  readonly depositAmount?: bigint
  readonly autoTopUp?: boolean
  readonly emergencyDisableThreshold?: number
  readonly priceChangeNotifications?: boolean
  readonly lowBalanceThreshold?: bigint
  readonly retryAttempts?: number
}

/**
 * Payment Failure Context Interface
 * 
 * Comprehensive information about auto-renewal payment failures,
 * enabling intelligent recovery strategies and user guidance.
 */
export interface PaymentFailureContext {
  readonly subscriptionId: string
  readonly creator: Address
  readonly failureReason: PaymentFailureReason
  readonly failureTimestamp: Date
  readonly attemptNumber: number
  readonly currentBalance: bigint
  readonly requiredAmount: bigint
  readonly suggestedActions: readonly string[]
  readonly canRetryImmediately: boolean
  readonly nextRetryWindow: Date | null
  readonly errorDetails?: string
  readonly recoveryDifficulty: 'easy' | 'moderate' | 'difficult'
  readonly estimatedResolutionTime: number // minutes
}

// ===== ANALYTICS AND INSIGHTS INTERFACES =====

/**
 * Renewal Analytics Interface
 * 
 * Comprehensive analytics about auto-renewal performance and trends,
 * providing insights for optimization and financial planning.
 */
export interface RenewalAnalytics {
  readonly totalConfigured: number
  readonly currentlyActive: number
  readonly successfulRenewals: number
  readonly failedRenewals: number
  readonly successRate: number
  readonly avgTimeBetweenRenewals: number
  readonly totalSpentOnRenewals: bigint
  readonly avgRenewalPrice: bigint
  readonly balanceUtilizationRate: number
  readonly predictedMonthlySpend: bigint
  readonly monthlyRenewalTrend: readonly MonthlyRenewalData[]
  readonly topCreatorsByRenewals: readonly CreatorRenewalData[]
  readonly failureAnalysis: FailureAnalysisData
  readonly savingsFromAutoRenewal: bigint
  readonly timeSeriesData: readonly RenewalTimeSeriesPoint[]
}

/**
 * Monthly Renewal Data Interface
 * 
 * Time-series data for monthly renewal trends and performance analysis.
 */
export interface MonthlyRenewalData {
  readonly month: string
  readonly renewals: number
  readonly successRate: number
  readonly totalSpent: bigint
  readonly averagePrice: bigint
  readonly failureCount: number
  readonly newSubscriptions: number
  readonly cancelledSubscriptions: number
}

/**
 * Creator Renewal Data Interface
 * 
 * Per-creator analytics for understanding subscription relationships
 * and identifying top-performing creator subscriptions.
 */
export interface CreatorRenewalData {
  readonly creator: Address
  readonly creatorName?: string
  readonly renewalCount: number
  readonly successRate: number
  readonly totalSpent: bigint
  readonly averagePrice: bigint
  readonly subscriptionDuration: number // days
  readonly lastRenewalDate: Date
  readonly healthScore: number // 0-100
}

/**
 * Failure Analysis Data Interface
 * 
 * Detailed breakdown of renewal failures by type and frequency,
 * enabling targeted improvements and user education.
 */
export interface FailureAnalysisData {
  readonly totalFailures: number
  readonly failuresByReason: Record<PaymentFailureReason, number>
  readonly avgFailuresPerSubscription: number
  readonly mostCommonFailureReason: PaymentFailureReason
  readonly failureResolutionRate: number
  readonly avgResolutionTime: number // hours
  readonly recurringFailurePatterns: readonly FailurePattern[]
}

/**
 * Failure Pattern Interface
 * 
 * Identifies recurring patterns in renewal failures to help users
 * understand and prevent systematic issues.
 */
export interface FailurePattern {
  readonly pattern: string
  readonly frequency: number
  readonly impact: 'low' | 'medium' | 'high'
  readonly suggestion: string
  readonly affectedSubscriptions: number
}

/**
 * Renewal Time Series Point Interface
 * 
 * Individual data points for time-series analysis of renewal performance,
 * enabling trend analysis and forecasting.
 */
export interface RenewalTimeSeriesPoint {
  readonly timestamp: Date
  readonly renewalCount: number
  readonly successCount: number
  readonly failureCount: number
  readonly totalAmount: bigint
  readonly uniqueCreators: number
  readonly avgProcessingTime: number // seconds
}

// ===== CREATOR ANALYTICS INTERFACES =====

/**
 * Subscriber Information Interface
 * 
 * Enhanced subscriber data combining basic subscription information
 * with calculated analytics for creator insights and relationship management.
 */
export interface SubscriberInfo {
  readonly userAddress: Address
  readonly subscriptionDetails: SubscriptionRecord
  readonly totalPaid: bigint
  readonly subscriptionStart: Date
  readonly lastPayment: Date
  readonly renewalCount: number
  readonly isAutoRenewalEnabled: boolean
  readonly autoRenewalBalance: bigint
  readonly loyaltyScore: number // 0-100
  readonly churnRisk: 'low' | 'medium' | 'high'
  readonly estimatedLifetimeValue: bigint
  readonly engagementLevel: 'low' | 'medium' | 'high'
  readonly preferredRenewalDay: number // day of month
  readonly subscriptionTier: 'basic' | 'premium' | 'vip'
}

/**
 * Creator Subscription Earnings Interface
 * 
 * Detailed earnings breakdown specifically from subscriptions,
 * providing financial insights and performance tracking for creators.
 */
export interface CreatorSubscriptionEarnings {
  readonly totalEarnings: bigint
  readonly withdrawableEarnings: bigint
  readonly pendingEarnings: bigint
  readonly thisMonthEarnings: bigint
  readonly lastMonthEarnings: bigint
  readonly averageMonthlyEarnings: bigint
  readonly earningsGrowthRate: number
  readonly projectedNextMonth: bigint
  readonly earningsFromAutoRenewals: bigint
  readonly averageRevenuePerSubscriber: bigint
  readonly subscriptionRetentionRate: number
  readonly monthlyRecurringRevenue: bigint
}

// ===== NOTIFICATION AND EVENT INTERFACES =====

/**
 * Platform Notification Interface
 * 
 * User notifications for subscription events, auto-renewal status changes,
 * and other important platform activities requiring user attention.
 */
export interface PlatformNotification {
  readonly id: string
  readonly type: 'success' | 'warning' | 'error' | 'info'
  readonly category: 'subscription' | 'auto_renewal' | 'payment' | 'system'
  readonly title: string
  readonly message: string
  readonly timestamp: Date
  readonly isRead: boolean
  readonly priority: 'low' | 'medium' | 'high' | 'urgent'
  readonly actionUrl?: string
  readonly actionText?: string
  readonly relatedTransaction?: Hash
  readonly relatedSubscription?: string
  readonly expiresAt?: Date
  readonly metadata?: Record<string, unknown>
}

/**
 * Subscription Event Interface
 * 
 * Platform events related to subscription lifecycle for analytics,
 * notifications, and integration with external systems.
 */
export interface SubscriptionEvent {
  readonly eventId: string
  readonly type: 'created' | 'renewed' | 'cancelled' | 'expired' | 'auto_renewal_configured' | 'auto_renewal_executed' | 'auto_renewal_failed'
  readonly subscriptionId: string
  readonly creator: Address
  readonly user: Address
  readonly timestamp: Date
  readonly blockNumber: bigint
  readonly transactionHash: Hash
  readonly eventData: Record<string, unknown>
  readonly processedAt?: Date
  readonly notificationSent?: boolean
}

// ===== UTILITY AND CONFIGURATION INTERFACES =====

/**
 * Subscription Configuration Interface
 * 
 * Platform-wide configuration for subscription behavior, limits,
 * and default settings that affect user experience.
 */
export interface SubscriptionConfig {
  readonly maxAutoRenewalBalance: bigint
  readonly minSubscriptionPrice: bigint
  readonly maxSubscriptionPrice: bigint
  readonly defaultGracePeriod: number // days
  readonly maxFailedAttempts: number
  readonly retryDelayMinutes: number
  readonly balanceWarningThreshold: bigint
  readonly priceChangeNotificationAdvance: number // days
  readonly supportedTokens: readonly Address[]
  readonly platformFeeRate: number // basis points
}

/**
 * User Preferences Interface
 * 
 * User-specific settings and preferences for subscription management,
 * auto-renewal behavior, and notification preferences.
 */
export interface UserSubscriptionPreferences {
  readonly autoRenewalEnabled: boolean
  readonly defaultMaxPrice: bigint
  readonly defaultDepositAmount: bigint
  readonly notificationPreferences: {
    readonly renewalReminders: boolean
    readonly failureAlerts: boolean
    readonly priceChangeNotifications: boolean
    readonly balanceWarnings: boolean
    readonly successConfirmations: boolean
  }
  readonly preferredRenewalDay: number // day of month
  readonly riskTolerance: 'conservative' | 'balanced' | 'aggressive'
  readonly autoTopUpEnabled: boolean
  readonly autoTopUpThreshold: bigint
  readonly autoTopUpAmount: bigint
}

// ===== TYPE GUARDS AND VALIDATION UTILITIES =====

/**
 * Type guard to validate SubscriptionRecord objects
 */
export function isSubscriptionRecord(obj: unknown): obj is SubscriptionRecord {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'isActive' in obj &&
    'startTime' in obj &&
    'endTime' in obj &&
    'subscriptionId' in obj
  )
}

/**
 * Type guard to validate AutoRenewalConfig objects
 */
export function isAutoRenewalConfig(obj: unknown): obj is AutoRenewalConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'enabled' in obj &&
    'maxPrice' in obj &&
    'balance' in obj &&
    'healthStatus' in obj
  )
}

/**
 * Type guard to validate PaymentFailureContext objects
 */
export function isPaymentFailureContext(obj: unknown): obj is PaymentFailureContext {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'failureReason' in obj &&
    'attemptNumber' in obj &&
    'canRetryImmediately' in obj
  )
}

/**
 * Helper function to determine auto-renewal health status
 */
export function calculateAutoRenewalHealth(config: AutoRenewalConfig): AutoRenewalHealthStatus {
  if (!config.enabled) return 'disabled'
  
  if (config.failedAttempts >= BigInt(3)) return 'critical'
  if (config.balance === BigInt(0) || config.estimatedRenewalsRemaining < 1) return 'critical'
  if (config.estimatedRenewalsRemaining < 2) return 'warning'
  
  return 'healthy'
}

/**
 * Helper function to calculate subscription status
 */
export function calculateSubscriptionStatus(record: SubscriptionRecord): SubscriptionStatus {
  const now = BigInt(Math.floor(Date.now() / 1000))
  
  if (!record.isActive) return 'cancelled'
  if (record.endTime <= now) {
    if (record.inGracePeriod && record.gracePeriodEnd > now) {
      return 'grace_period'
    }
    return 'expired'
  }
  return 'active'
}

// Re-export of types is removed to avoid duplicate export conflicts.
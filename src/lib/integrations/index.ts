// Central exports for analytics, discovery, context and utils

// Analytics hooks
export { usePlatformAnalytics } from '@/hooks/contracts/analytics/usePlatformAnalytics'
export { useCreatorAnalytics } from '@/hooks/contracts/analytics/useCreatorAnalytics'

// Discovery
export { useContentDiscovery } from '@/hooks/contracts/content/useContentDiscovery'
export { ContentDiscoveryInterface } from '@/components/content/ContentDiscoveryInterface'

// Context
export { AnalyticsProvider, useAnalyticsContext } from '@/contexts/AnalyticsContext'

// Routing middleware factory
export { createFeatureRoutingMiddleware } from './routing'

// Types
export type {
  ContentDiscoveryFilters,
  ContentDiscoveryResult,
  AnalyticsContextData,
  TimePeriod,
  TimePeriodConfig
} from '@/types/integration'



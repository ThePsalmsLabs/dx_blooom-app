import type { TimePeriod, TimePeriodConfig } from '@/types/integration'

export const TIME_PERIOD_CONFIG: Record<TimePeriod, TimePeriodConfig> = {
  '7d': { label: 'Last 7 days', days: 7, shortLabel: '7D' },
  '30d': { label: 'Last 30 days', days: 30, shortLabel: '30D' },
  '90d': { label: 'Last 90 days', days: 90, shortLabel: '90D' },
  '1y': { label: 'Last year', days: 365, shortLabel: '1Y' },
  'all': { label: 'All time', days: null, shortLabel: 'All' }
}

export function isFeatureEnabled(featureName: string, userRole: string): boolean {
  const enabledFeatures = {
    'advanced-discovery': ['consumer', 'creator', 'admin'],
    'creator-analytics': ['creator', 'admin'],
    'platform-insights': ['admin']
  }
  return enabledFeatures[featureName as keyof typeof enabledFeatures]?.includes(userRole) ?? false
}

export function validatePlatformStats(data: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!data) {
    errors.push('Analytics data is undefined')
    return { isValid: false, errors }
  }
  const statsData = data as Record<string, unknown>
  if (typeof statsData.totalContent !== 'bigint') {
    errors.push('Invalid totalContent value')
  }
  if (typeof statsData.activeContent !== 'bigint') {
    errors.push('Invalid activeContent value')
  }
  return { isValid: errors.length === 0, errors }
}

const analyticsUtils = {
  TIME_PERIOD_CONFIG,
  isFeatureEnabled,
  validatePlatformStats
}

export default analyticsUtils



'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { Address } from 'viem'
import { usePlatformAnalytics } from '@/hooks/contracts/analytics/usePlatformAnalytics'
import { useCreatorAnalytics } from '@/hooks/contracts/analytics/useCreatorAnalytics'
import type { AnalyticsContextData, TimePeriod } from '@/types/integration'

const AnalyticsContext = createContext<AnalyticsContextData | null>(null)

interface AnalyticsProviderProps {
  children: React.ReactNode
  creatorAddress?: Address
}

export function AnalyticsProvider({ children, creatorAddress }: AnalyticsProviderProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d')
  const [lastRefresh, setLastRefresh] = useState<Date | undefined>()

  const platformAnalytics = usePlatformAnalytics()
  const creatorAnalytics = useCreatorAnalytics(creatorAddress)

  const refreshData = useCallback(async () => {
    try {
      await Promise.all([
        platformAnalytics.refetch(),
        ...(creatorAddress ? [creatorAnalytics.refetch()] as const : [])
      ])
      setLastRefresh(new Date())
    } catch (error) {
      // Individual hooks manage their own error states
      console.error('Error refreshing analytics data:', error)
    }
  }, [platformAnalytics.refetch, creatorAnalytics.refetch, creatorAddress])

  const value = useMemo<AnalyticsContextData>(() => ({
    platformStats: platformAnalytics.platformStats,
    creatorStats: creatorAnalytics.analytics,
    timePeriod,
    isLoading: platformAnalytics.isLoading || creatorAnalytics.isLoading,
    error: platformAnalytics.error || creatorAnalytics.error,
    lastRefresh,
    refreshData,
    setTimePeriod
  }), [
    platformAnalytics.platformStats,
    platformAnalytics.isLoading,
    platformAnalytics.error,
    creatorAnalytics.analytics,
    creatorAnalytics.isLoading,
    creatorAnalytics.error,
    timePeriod,
    lastRefresh,
    refreshData
  ])

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalyticsContext(): AnalyticsContextData {
  const ctx = useContext(AnalyticsContext)
  if (!ctx) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider')
  }
  return ctx
}



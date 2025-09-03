/**
 * Progressive Enhancement - Graceful Feature Degradation
 * File: src/components/enhancement/ProgressiveEnhancement.tsx
 *
 * Implements progressive enhancement patterns for MiniApp environments,
 * ensuring users get the best possible experience regardless of their
 * device capabilities or network conditions.
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Wifi, Battery, Smartphone, AlertTriangle, CheckCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

import { useUnifiedMiniApp } from '@/contexts/UnifiedMiniAppProvider'

// ================================================
// CAPABILITY LEVELS
// ================================================

type CapabilityLevel = 'full' | 'enhanced' | 'basic' | 'minimal'

interface DeviceCapabilities {
  readonly networkQuality: 'fast' | 'slow' | 'offline'
  readonly batteryLevel: number | null
  readonly isLowPowerMode: boolean | null
  readonly memoryAvailable: number | null
  readonly supportsModernFeatures: boolean
}

interface FeatureFlags {
  readonly batchTransactions: boolean
  readonly socialSharing: boolean
  readonly advancedUI: boolean
  readonly analytics: boolean
  readonly offlineMode: boolean
  readonly hapticFeedback: boolean
}

// ================================================
// CAPABILITY DETECTION
// ================================================

function useDeviceCapabilities(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    networkQuality: 'fast',
    batteryLevel: null,
    isLowPowerMode: null,
    memoryAvailable: null,
    supportsModernFeatures: true
  })

  useEffect(() => {
    // Network quality detection
    const updateNetworkQuality = () => {
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as any).connection
        if (connection) {
          const { effectiveType, downlink } = connection

          let quality: 'fast' | 'slow' | 'offline' = 'fast'
          if (!navigator.onLine) {
            quality = 'offline'
          } else if (effectiveType === 'slow-2g' || effectiveType === '2g' || downlink < 1) {
            quality = 'slow'
          }

          setCapabilities(prev => ({ ...prev, networkQuality: quality }))
        }
      }
    }

    // Battery detection
    const updateBatteryStatus = async () => {
      if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery()
          setCapabilities(prev => ({
            ...prev,
            batteryLevel: battery.level * 100,
            isLowPowerMode: battery.level < 0.2 && !battery.charging
          }))
        } catch (_error) {
          // Battery API not available
        }
      }
    }

    // Memory detection
    const updateMemoryInfo = () => {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory
        const availableMemory = memory.jsHeapSizeLimit - memory.usedJSHeapSize
        setCapabilities(prev => ({
          ...prev,
          memoryAvailable: availableMemory / 1024 / 1024 // MB
        }))
      }
    }

    // Modern features support
    const supportsModernFeatures =
      typeof window !== 'undefined' &&
      'IntersectionObserver' in window &&
      'requestAnimationFrame' in window &&
      CSS.supports('display', 'grid')

    setCapabilities(prev => ({ ...prev, supportsModernFeatures }))

    // Initial updates
    updateNetworkQuality()
    updateBatteryStatus()
    updateMemoryInfo()

    // Event listeners
    window.addEventListener('online', updateNetworkQuality)
    window.addEventListener('offline', updateNetworkQuality)

    if ('connection' in navigator) {
      ;(navigator as any).connection.addEventListener('change', updateNetworkQuality)
    }

    return () => {
      window.removeEventListener('online', updateNetworkQuality)
      window.removeEventListener('offline', updateNetworkQuality)
      if ('connection' in navigator) {
        ;(navigator as any).connection.removeEventListener('change', updateNetworkQuality)
      }
    }
  }, [])

  return capabilities
}

// ================================================
// CAPABILITY LEVEL DETERMINATION
// ================================================

function determineCapabilityLevel(
  deviceCapabilities: DeviceCapabilities,
  miniAppCapabilities: {
    wallet?: { canConnect?: boolean; canBatchTransactions?: boolean }
    social?: { canShare?: boolean }
  }
): CapabilityLevel {
  // Full capabilities - everything available
  if (
    deviceCapabilities.networkQuality === 'fast' &&
    deviceCapabilities.batteryLevel !== null && deviceCapabilities.batteryLevel > 20 &&
    deviceCapabilities.supportsModernFeatures &&
    miniAppCapabilities?.wallet?.canBatchTransactions &&
    miniAppCapabilities?.social?.canShare
  ) {
    return 'full'
  }

  // Enhanced capabilities - most features available
  if (
    deviceCapabilities.networkQuality !== 'offline' &&
    deviceCapabilities.supportsModernFeatures &&
    (miniAppCapabilities?.wallet?.canConnect || miniAppCapabilities?.social?.canShare)
  ) {
    return 'enhanced'
  }

  // Basic capabilities - core functionality
  if (
    deviceCapabilities.networkQuality !== 'offline' &&
    miniAppCapabilities?.wallet?.canConnect
  ) {
    return 'basic'
  }

  // Minimal capabilities - essential functionality only
  return 'minimal'
}

// ================================================
// FEATURE FLAGS BASED ON CAPABILITY LEVEL
// ================================================

function getFeatureFlags(
  capabilityLevel: CapabilityLevel,
  deviceCapabilities: DeviceCapabilities
): FeatureFlags {
  switch (capabilityLevel) {
    case 'full':
      return {
        batchTransactions: true,
        socialSharing: true,
        advancedUI: true,
        analytics: true,
        offlineMode: true,
        hapticFeedback: deviceCapabilities.batteryLevel !== null && deviceCapabilities.batteryLevel > 30
      }

    case 'enhanced':
      return {
        batchTransactions: false,
        socialSharing: true,
        advancedUI: true,
        analytics: deviceCapabilities.networkQuality === 'fast',
        offlineMode: false,
        hapticFeedback: false
      }

    case 'basic':
      return {
        batchTransactions: false,
        socialSharing: false,
        advancedUI: false,
        analytics: false,
        offlineMode: false,
        hapticFeedback: false
      }

    case 'minimal':
    default:
      return {
        batchTransactions: false,
        socialSharing: false,
        advancedUI: false,
        analytics: false,
        offlineMode: false,
        hapticFeedback: false
      }
  }
}

// ================================================
// PROGRESSIVE ENHANCEMENT PROVIDER
// ================================================

interface ProgressiveEnhancementProviderProps {
  children: (features: FeatureFlags & { capabilityLevel: CapabilityLevel }) => React.ReactNode
  fallback?: React.ReactNode
}

export function ProgressiveEnhancementProvider({
  children,
  fallback
}: ProgressiveEnhancementProviderProps) {
  const { state } = useUnifiedMiniApp()
  const deviceCapabilities = useDeviceCapabilities()

  const capabilityLevel = useMemo(() =>
    determineCapabilityLevel(deviceCapabilities, state.capabilities),
    [deviceCapabilities, state.capabilities]
  )

  const featureFlags = useMemo(() =>
    getFeatureFlags(capabilityLevel, deviceCapabilities),
    [capabilityLevel, deviceCapabilities]
  )

  // Show loading while determining capabilities
  if (!state.capabilities) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Optimizing experience...</p>
        </div>
      </div>
    )
  }

  return <>{children({ ...featureFlags, capabilityLevel })}</>
}

// ================================================
// CAPABILITY STATUS DISPLAY
// ================================================

interface CapabilityStatusProps {
  className?: string
}

export function CapabilityStatus({ className }: CapabilityStatusProps) {
  const { state, utils } = useUnifiedMiniApp()
  const deviceCapabilities = useDeviceCapabilities()

  const capabilityLevel = determineCapabilityLevel(deviceCapabilities, state.capabilities)

  const getLevelColor = (level: CapabilityLevel) => {
    switch (level) {
      case 'full': return 'text-green-600 bg-green-50 border-green-200'
      case 'enhanced': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'basic': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'minimal': return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const getLevelIcon = (level: CapabilityLevel) => {
    switch (level) {
      case 'full': return <CheckCircle className="h-4 w-4" />
      case 'enhanced': return <Smartphone className="h-4 w-4" />
      case 'basic': return <Wifi className="h-4 w-4" />
      case 'minimal': return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getLevelIcon(capabilityLevel)}
          Device Capabilities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Capability Level</span>
          <Badge className={getLevelColor(capabilityLevel)}>
            {capabilityLevel.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Network</span>
            <Badge variant={
              deviceCapabilities.networkQuality === 'fast' ? 'default' :
              deviceCapabilities.networkQuality === 'slow' ? 'secondary' : 'destructive'
            }>
              {deviceCapabilities.networkQuality}
            </Badge>
          </div>

          {deviceCapabilities.batteryLevel !== null && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Battery</span>
                <span>{deviceCapabilities.batteryLevel.toFixed(0)}%</span>
              </div>
              <Progress value={deviceCapabilities.batteryLevel} className="h-1" />
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span>MiniApp Environment</span>
            <Badge variant={utils.isMiniApp ? 'default' : 'secondary'}>
              {utils.isMiniApp ? 'Yes' : 'No'}
            </Badge>
          </div>

          <div className="flex justify-between text-sm">
            <span>Modern Features</span>
            <Badge variant={deviceCapabilities.supportsModernFeatures ? 'default' : 'secondary'}>
              {deviceCapabilities.supportsModernFeatures ? 'Supported' : 'Limited'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ================================================
// ENHANCED COMPONENT WITH FALLBACKS
// ================================================

interface EnhancedComponentProps<_T = any> {
  children: React.ReactNode
  fallback?: React.ReactNode
  requires?: keyof FeatureFlags
  capabilityLevel?: CapabilityLevel
}

export function EnhancedComponent<T>({
  children,
  fallback,
  requires,
  capabilityLevel
}: EnhancedComponentProps<T>) {
  const { state } = useUnifiedMiniApp()
  const deviceCapabilities = useDeviceCapabilities()

  const currentCapabilityLevel = determineCapabilityLevel(deviceCapabilities, state.capabilities)
  const featureFlags = getFeatureFlags(currentCapabilityLevel, deviceCapabilities)

  // Check if requirements are met
  const meetsRequirements = useMemo(() => {
    if (!requires) return true
    if (capabilityLevel && currentCapabilityLevel !== capabilityLevel) return false
    return featureFlags[requires]
  }, [requires, capabilityLevel, currentCapabilityLevel, featureFlags])

  if (!meetsRequirements) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// ================================================
// NETWORK-AWARE COMPONENT
// ================================================

interface NetworkAwareProps {
  children: React.ReactNode
  offlineFallback?: React.ReactNode
  slowNetworkFallback?: React.ReactNode
}

export function NetworkAware({
  children,
  offlineFallback,
  slowNetworkFallback
}: NetworkAwareProps) {
  const deviceCapabilities = useDeviceCapabilities()

  if (deviceCapabilities.networkQuality === 'offline') {
    return offlineFallback || (
      <Alert>
        <Wifi className="h-4 w-4" />
        <AlertDescription>
          You&apos;re currently offline. Some features may not be available.
        </AlertDescription>
      </Alert>
    )
  }

  if (deviceCapabilities.networkQuality === 'slow' && slowNetworkFallback) {
    return <>{slowNetworkFallback}</>
  }

  return <>{children}</>
}

// ================================================
// BATTERY-AWARE COMPONENT
// ================================================

interface BatteryAwareProps {
  children: React.ReactNode
  lowBatteryFallback?: React.ReactNode
  batteryThreshold?: number
}

export function BatteryAware({
  children,
  lowBatteryFallback,
  batteryThreshold = 20
}: BatteryAwareProps) {
  const deviceCapabilities = useDeviceCapabilities()

  if (
    deviceCapabilities.batteryLevel !== null &&
    deviceCapabilities.batteryLevel < batteryThreshold &&
    !deviceCapabilities.isLowPowerMode
  ) {
    return lowBatteryFallback || (
      <Alert>
        <Battery className="h-4 w-4" />
        <AlertDescription>
          Battery level is low ({deviceCapabilities.batteryLevel.toFixed(0)}%).
          Some features may be limited to conserve power.
        </AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}

// ================================================
// FEATURE FLAG HOOK
// ================================================

export function useFeatureFlags(): FeatureFlags & { capabilityLevel: CapabilityLevel } {
  const { state } = useUnifiedMiniApp()
  const deviceCapabilities = useDeviceCapabilities()

  const capabilityLevel = determineCapabilityLevel(deviceCapabilities, state.capabilities)
  const featureFlags = getFeatureFlags(capabilityLevel, deviceCapabilities)

  return { ...featureFlags, capabilityLevel }
}

// ================================================
// EXPORTS
// ================================================

export default ProgressiveEnhancementProvider
export type { CapabilityLevel, DeviceCapabilities, FeatureFlags }

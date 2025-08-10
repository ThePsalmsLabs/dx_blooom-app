// ==============================================================================
// COMPONENT 5.2: PROGRESSIVE ENHANCEMENT STRATEGY
// File: src/components/miniapp/ProgressiveEnhancement.tsx
// ==============================================================================

'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, useChainId } from 'wagmi'
import {
  Globe,
  Smartphone,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
  CreditCard,
  MessageSquare
} from 'lucide-react'

// Import existing UI components following your design system patterns
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  Progress
} from '@/components/ui/index'
import { cn } from '@/lib/utils'

// Import Component 5.1's error handling integration
import { useMiniAppErrorHandling, type MiniAppError } from '@/utils/error-handling'

// Import existing configuration and capability detection
import { getX402MiddlewareConfig, isX402Supported } from '@/lib/web3/x402-config'
import { useFarcasterContext } from '@/hooks/farcaster/useFarcasterContext'

/**
 * Mini App Capabilities Interface
 * 
 * This interface defines the comprehensive capability detection structure for
 * Mini App features. Each capability represents a specific technology or service
 * that affects the user experience and determines which features are available.
 */
export interface MiniAppCapabilities {
  /** Whether the user is accessing from a Farcaster client */
  readonly isFarcasterClient: boolean
  
  /** Whether the client supports Farcaster Frame rendering */
  readonly supportsFrames: boolean
  
  /** Whether wallet access is available and functional */
  readonly hasWalletAccess: boolean
  
  /** Whether x402 payment processing is supported */
  readonly supportsX402: boolean
  
  /** Additional capability details for enhanced decision making */
  readonly details: {
    /** Detected client information */
    readonly clientInfo: {
      readonly name: string
      readonly version: string
      readonly userAgent: string
    }
    
    /** Network connectivity and performance indicators */
    readonly networkInfo: {
      readonly isOnline: boolean
      readonly connectionType: 'fast' | 'slow' | 'offline'
      readonly estimatedBandwidth?: number
    }
    
    /** Device and platform capabilities */
    readonly deviceInfo: {
      readonly isMobile: boolean
      readonly isTablet: boolean
      readonly screenSize: 'small' | 'medium' | 'large'
      readonly touchSupport: boolean
    }
    
    /** Web3 and blockchain capabilities */
    readonly web3Info: {
      readonly walletProviders: ReadonlyArray<string>
      readonly supportedChains: ReadonlyArray<number>
      readonly hasMetaMask: boolean
      readonly hasCoinbaseWallet: boolean
    }
  }
}

/**
 * Capability Detection Result Interface
 * 
 * This interface defines the result structure from capability detection,
 * including both successful detection and error handling scenarios.
 */
interface CapabilityDetectionResult {
  readonly success: boolean
  readonly capabilities?: MiniAppCapabilities
  readonly errors: ReadonlyArray<string>
  readonly warnings: ReadonlyArray<string>
  readonly detectionTime: number
}

/**
 * Progressive Enhancement Props Interface
 * 
 * This interface defines the props for the ProgressiveEnhancement component,
 * providing configuration options for different enhancement strategies.
 */
interface ProgressiveEnhancementProps {
  /** Child components to render with progressive enhancement */
  children: React.ReactNode
  
  /** Optional className for styling customization */
  className?: string
  
  /** Whether to show capability detection progress to users */
  showLoadingState?: boolean
  
  /** Whether to show detailed capability information in development */
  showCapabilityDetails?: boolean
  
  /** Custom fallback components for different scenarios */
  fallbackComponents?: {
    readonly webInterface?: React.ComponentType<{ children: React.ReactNode }>
    readonly traditionalPayment?: React.ComponentType<{ children: React.ReactNode }>
    readonly networkError?: React.ComponentType<{ onRetry: () => void }>
  }
  
  /** Callback when capability detection completes */
  onCapabilitiesDetected?: (capabilities: MiniAppCapabilities) => void
  
  /** Callback when enhancement level changes */
  onEnhancementLevelChange?: (level: 'full' | 'partial' | 'fallback') => void
}

/**
 * Client Detection Utility Class
 * 
 * This class provides comprehensive client capability detection using various
 * browser APIs and heuristics to determine the optimal user experience level.
 */
class ClientCapabilityDetector {
  /**
   * Detect Farcaster Client Environment
   * 
   * This method checks multiple indicators to determine if the user is accessing
   * the application from within a Farcaster client environment.
   */
  static detectFarcasterClient(): { isFarcaster: boolean; details: { name: string; version: string } } {
    if (typeof window === 'undefined') {
      return { isFarcaster: false, details: { name: 'unknown', version: '0.0.0' } }
    }

    // Check for Farcaster-specific user agent strings
    const userAgent = navigator.userAgent.toLowerCase()
    const farcasterIndicators = [
      'warpcast',
      'farcaster',
      'fc-mobile',
      'fc-web'
    ]

    const matchedIndicator = farcasterIndicators.find(indicator => 
      userAgent.includes(indicator)
    )

    if (matchedIndicator) {
      // Extract version if available
      const versionMatch = userAgent.match(new RegExp(`${matchedIndicator}[/\\s]([\\d.]+)`))
      const version = versionMatch ? versionMatch[1] : '1.0.0'
      
      return {
        isFarcaster: true,
        details: { name: matchedIndicator, version }
      }
    }

    // Check for Farcaster context in the URL or referrer
    const url = new URL(window.location.href)
    const isFrameContext = url.searchParams.has('fc_frame') || 
                          url.pathname.startsWith('/frame/') ||
                          document.referrer.includes('warpcast.com')

    if (isFrameContext) {
      return {
        isFarcaster: true,
        details: { name: 'frame-context', version: '1.0.0' }
      }
    }

    // Check for MiniKit global object
    const hasMiniKit = typeof (window as unknown as { MiniKit?: unknown }).MiniKit !== 'undefined'
    if (hasMiniKit) {
      return {
        isFarcaster: true,
        details: { name: 'minikit', version: '1.0.0' }
      }
    }

    return { isFarcaster: false, details: { name: 'web-browser', version: '1.0.0' } }
  }

  /**
   * Detect Frame Support Capabilities
   * 
   * This method determines whether the client can properly render and interact
   * with Farcaster Frames, including image loading and button interactions.
   */
  static async detectFrameSupport(): Promise<boolean> {
    if (typeof window === 'undefined') return false

    try {
      // Check for Frame-specific meta tags
      const frameMetaTags = document.querySelectorAll('meta[property^="fc:frame"]')
      const hasFrameMeta = frameMetaTags.length > 0

      // Check for Frame interaction capabilities
      const canPostMessages = typeof window.postMessage === 'function'
      
      // Check image loading capabilities (important for Frame previews)
      const canLoadImages = await new Promise<boolean>((resolve) => {
        const testImage = new Image()
        testImage.onload = () => resolve(true)
        testImage.onerror = () => resolve(false)
        testImage.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'
      })

      return hasFrameMeta && canPostMessages && canLoadImages
    } catch (error) {
      console.warn('Frame support detection failed:', error)
      return false
    }
  }

  /**
   * Detect Wallet Access Capabilities
   * 
   * This method checks for available wallet providers and their functionality,
   * ensuring that users can connect and interact with Web3 services.
   */
  static async detectWalletAccess(): Promise<{
    hasAccess: boolean
    providers: ReadonlyArray<string>
    details: {
      hasMetaMask: boolean
      hasCoinbaseWallet: boolean
      hasWalletConnect: boolean
    }
  }> {
    if (typeof window === 'undefined') {
      return {
        hasAccess: false,
        providers: [],
        details: { hasMetaMask: false, hasCoinbaseWallet: false, hasWalletConnect: false }
      }
    }

    try {
      const providers: string[] = []
      const ethereum = (window as unknown as { ethereum?: { isMetaMask?: boolean; isCoinbaseWallet?: boolean } }).ethereum

      // Check for MetaMask
      const hasMetaMask = Boolean(ethereum?.isMetaMask)
      if (hasMetaMask) providers.push('MetaMask')

      // Check for Coinbase Wallet
      const hasCoinbaseWallet = Boolean(ethereum?.isCoinbaseWallet)
      if (hasCoinbaseWallet) providers.push('Coinbase Wallet')

      // Check for WalletConnect support
      const hasWalletConnect = typeof window !== 'undefined' && 
                              Boolean(localStorage.getItem('walletconnect'))
      if (hasWalletConnect) providers.push('WalletConnect')

      // Check for general Web3 provider availability
      const hasWeb3Provider = Boolean(ethereum)

      return {
        hasAccess: hasWeb3Provider || providers.length > 0,
        providers,
        details: {
          hasMetaMask,
          hasCoinbaseWallet,
          hasWalletConnect
        }
      }
    } catch (error) {
      console.warn('Wallet access detection failed:', error)
      return {
        hasAccess: false,
        providers: [],
        details: { hasMetaMask: false, hasCoinbaseWallet: false, hasWalletConnect: false }
      }
    }
  }

  /**
   * Detect x402 Payment Support
   * 
   * This method checks whether x402 payment processing is available and properly
   * configured for the current network and environment.
   */
  static detectX402Support(chainId: number): {
    isSupported: boolean
    details: {
      networkSupported: boolean
      configurationValid: boolean
      facilitatorAccessible: boolean
    }
  } {
    try {
      // Check if the current chain supports x402
      const networkSupported = isX402Supported(chainId)
      
      if (!networkSupported) {
        return {
          isSupported: false,
          details: {
            networkSupported: false,
            configurationValid: false,
            facilitatorAccessible: false
          }
        }
      }

      // Check if configuration is valid
      let configurationValid = false
      try {
        const config = getX402MiddlewareConfig(chainId)
        configurationValid = Boolean(
          config.resourceWalletAddress && 
          config.resourceWalletAddress !== '0x' &&
          config.facilitatorUrl &&
          config.usdcTokenAddress
        )
      } catch (configError) {
        console.warn('x402 configuration validation failed:', configError)
        configurationValid = false
      }

      // Note: Facilitator accessibility would require an actual network request
      // For capability detection, we assume it's accessible if configuration is valid
      const facilitatorAccessible = configurationValid

      return {
        isSupported: networkSupported && configurationValid,
        details: {
          networkSupported,
          configurationValid,
          facilitatorAccessible
        }
      }
    } catch (error) {
      console.warn('x402 support detection failed:', error)
      return {
        isSupported: false,
        details: {
          networkSupported: false,
          configurationValid: false,
          facilitatorAccessible: false
        }
      }
    }
  }

  /**
   * Detect Device and Network Capabilities
   * 
   * This method gathers information about the user's device and network
   * conditions to optimize the experience for their specific context.
   */
  static detectDeviceAndNetwork(): MiniAppCapabilities['details']['deviceInfo'] & 
                                    MiniAppCapabilities['details']['networkInfo'] {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        screenSize: 'large',
        touchSupport: false,
        isOnline: true,
        connectionType: 'fast'
      }
    }

    // Device detection
    const screenWidth = window.innerWidth
    const isMobile = screenWidth < 768
    const isTablet = screenWidth >= 768 && screenWidth < 1024
    const screenSize = isMobile ? 'small' : isTablet ? 'medium' : 'large'
    const touchSupport = 'ontouchstart' in window

    // Network detection
    const isOnline = navigator.onLine
    const connection = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number } }).connection
    const connectionType = connection 
      ? (connection.effectiveType === '4g' || connection.effectiveType === 'wifi' ? 'fast' : 'slow')
      : 'fast'

    return {
      isMobile,
      isTablet,
      screenSize,
      touchSupport,
      isOnline,
      connectionType,
      estimatedBandwidth: connection?.downlink
    }
  }
}

/**
 * Capability Detection Hook
 * 
 * This hook manages the complete capability detection process, providing
 * real-time updates on Mini App capabilities and integration with error handling.
 */
function useCapabilityDetection(): {
  capabilities: MiniAppCapabilities | null
  isLoading: boolean
  error: MiniAppError | null
  detectionTime: number
  refetch: () => Promise<void>
} {
  const { address } = useAccount()
  const chainId = useChainId()
  const errorHandling = useMiniAppErrorHandling()
  const farcasterContext = useFarcasterContext()

  const [capabilities, setCapabilities] = useState<MiniAppCapabilities | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<MiniAppError | null>(null)
  const [detectionTime, setDetectionTime] = useState(0)

  const detectCapabilities = useCallback(async (): Promise<void> => {
    const startTime = Date.now()
    setIsLoading(true)
    setError(null)

    try {
      // Run all capability detections concurrently for better performance
      const [
        farcasterDetection,
        frameSupport,
        walletAccess,
        deviceAndNetwork
      ] = await Promise.all([
        Promise.resolve(ClientCapabilityDetector.detectFarcasterClient()),
        ClientCapabilityDetector.detectFrameSupport(),
        ClientCapabilityDetector.detectWalletAccess(),
        Promise.resolve(ClientCapabilityDetector.detectDeviceAndNetwork())
      ])

      const x402Support = ClientCapabilityDetector.detectX402Support(chainId)

      // Construct comprehensive capabilities object
      const detectedCapabilities: MiniAppCapabilities = {
        isFarcasterClient: farcasterDetection.isFarcaster,
        supportsFrames: frameSupport,
        hasWalletAccess: walletAccess.hasAccess,
        supportsX402: x402Support.isSupported,
        details: {
          clientInfo: {
            name: farcasterDetection.details.name,
            version: farcasterDetection.details.version,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
          },
          networkInfo: {
            isOnline: deviceAndNetwork.isOnline,
            connectionType: deviceAndNetwork.connectionType,
            estimatedBandwidth: deviceAndNetwork.estimatedBandwidth
          },
          deviceInfo: {
            isMobile: deviceAndNetwork.isMobile,
            isTablet: deviceAndNetwork.isTablet,
            screenSize: deviceAndNetwork.screenSize,
            touchSupport: deviceAndNetwork.touchSupport
          },
          web3Info: {
            walletProviders: walletAccess.providers,
            supportedChains: [chainId],
            hasMetaMask: walletAccess.details.hasMetaMask,
            hasCoinbaseWallet: walletAccess.details.hasCoinbaseWallet
          }
        }
      }

      setCapabilities(detectedCapabilities)
      setDetectionTime(Date.now() - startTime)

    } catch (detectionError) {
      const error: MiniAppError = {
        type: 'INVALID_MINI_APP_CONFIG',
        message: 'Failed to detect Mini App capabilities. Using fallback interface.',
        details: {
          originalError: detectionError instanceof Error ? detectionError : new Error('Unknown detection error'),
          timestamp: Date.now()
        }
      }

      setError(error)
      errorHandling.handleMiniAppError(error)
    } finally {
      setIsLoading(false)
    }
  }, [chainId, errorHandling])

  // Initial capability detection
  useEffect(() => {
    detectCapabilities()
  }, [detectCapabilities])

  // Re-detect capabilities when wallet connection changes
  useEffect(() => {
    if (capabilities && address) {
      detectCapabilities()
    }
  }, [address, detectCapabilities, capabilities])

  return {
    capabilities,
    isLoading,
    error,
    detectionTime,
    refetch: detectCapabilities
  }
}

/**
 * Web Interface Fallback Component
 * 
 * This component provides a fallback experience when Farcaster client features
 * are not available, maintaining visual consistency with your design system.
 */
function WebInterfaceFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="web-interface-fallback">
      <Alert className="mb-6">
        <Globe className="h-4 w-4" />
        <AlertDescription>
          You&apos;re using the web interface. For the full experience with social features, 
          try accessing this content through a Farcaster client.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        {/* Enhanced web interface with clear navigation to full features */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">Enhanced Experience Available</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Access additional social features and streamlined payments through Farcaster apps.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {children}
      </div>
    </div>
  )
}

/**
 * Traditional Payment Fallback Component
 * 
 * This component provides fallback payment options when x402 payment processing
 * is not available, ensuring users can still complete transactions.
 */
function TraditionalPaymentFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="traditional-payment-fallback">
      <Alert className="mb-6">
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          Advanced payment features are not available. Using traditional wallet transactions.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        {/* Traditional payment interface with clear expectations */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="font-medium text-amber-900">Secure Traditional Payments</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Payments will be processed through your connected wallet with standard gas fees.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {children}
      </div>
    </div>
  )
}

/**
 * Network Error Fallback Component
 * 
 * This component handles network connectivity issues with retry capabilities
 * and clear user guidance for recovery.
 */
function NetworkErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="network-error-fallback flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Connection Error</CardTitle>
          <CardDescription>
            Unable to detect Mini App capabilities. Please check your connection and try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button onClick={onRetry} className="w-full">
            <ArrowRight className="h-4 w-4 mr-2" />
            Retry Detection
          </Button>
          <p className="text-sm text-muted-foreground">
            You can continue with limited functionality if the problem persists.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Capability Loading Component
 * 
 * This component shows capability detection progress with detailed status
 * indicators for different detection phases.
 */
function CapabilityLoadingComponent({ 
  detectionTime, 
  showDetails 
}: { 
  detectionTime: number
  showDetails: boolean 
}) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="capability-loading flex items-center justify-center min-h-[300px]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <CardTitle>Detecting Capabilities</CardTitle>
          <CardDescription>
            Checking for Mini App features and optimizing your experience...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="w-full" />
          
          {showDetails && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Farcaster Context</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <span>Wallet Access</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Support</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          
          <p className="text-xs text-center text-muted-foreground">
            Detection time: {detectionTime}ms
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main Progressive Enhancement Component
 * 
 * This component implements the complete progressive enhancement strategy,
 * detecting capabilities and providing appropriate fallbacks while maintaining
 * integration with your existing error handling and design systems.
 */
export function ProgressiveEnhancement({
  children,
  className,
  showLoadingState = true,
  showCapabilityDetails = process.env.NODE_ENV === 'development',
  fallbackComponents,
  onCapabilitiesDetected,
  onEnhancementLevelChange
}: ProgressiveEnhancementProps) {
  const { 
    capabilities, 
    isLoading, 
    error, 
    detectionTime, 
    refetch 
  } = useCapabilityDetection()

  // Notify parent component when capabilities are detected
  useEffect(() => {
    if (capabilities && onCapabilitiesDetected) {
      onCapabilitiesDetected(capabilities)
    }
  }, [capabilities, onCapabilitiesDetected])

  // Determine enhancement level and notify parent
  const enhancementLevel = useMemo(() => {
    if (!capabilities) return 'fallback'
    
    if (capabilities.isFarcasterClient && capabilities.supportsX402) {
      return 'full'
    } else if (capabilities.hasWalletAccess) {
      return 'partial'
    } else {
      return 'fallback'
    }
  }, [capabilities])

  useEffect(() => {
    if (onEnhancementLevelChange) {
      onEnhancementLevelChange(enhancementLevel)
    }
  }, [enhancementLevel, onEnhancementLevelChange])

  // Handle loading state
  if (isLoading && showLoadingState) {
    return (
      <div className={cn("progressive-enhancement-loading", className)}>
        <CapabilityLoadingComponent 
          detectionTime={detectionTime}
          showDetails={showCapabilityDetails}
        />
      </div>
    )
  }

  // Handle error state
  if (error && !capabilities) {
    const NetworkErrorComponent = fallbackComponents?.networkError || NetworkErrorFallback
    return (
      <div className={cn("progressive-enhancement-error", className)}>
        <NetworkErrorComponent onRetry={refetch} />
      </div>
    )
  }

  // Handle capability-based rendering with fallbacks
  if (!capabilities?.isFarcasterClient) {
    const WebInterfaceComponent = fallbackComponents?.webInterface || WebInterfaceFallback
    return (
      <div className={cn("progressive-enhancement-web", className)}>
        <WebInterfaceComponent>
          {children}
        </WebInterfaceComponent>
      </div>
    )
  }

  if (!capabilities.supportsX402) {
    const TraditionalPaymentComponent = fallbackComponents?.traditionalPayment || TraditionalPaymentFallback
    return (
      <div className={cn("progressive-enhancement-traditional", className)}>
        <TraditionalPaymentComponent>
          {children}
        </TraditionalPaymentComponent>
      </div>
    )
  }

  // Full Mini App experience
  return (
    <div className={cn("progressive-enhancement-full", className)}>
      {showCapabilityDetails && (
        <Card className="mb-4 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Full Mini App Experience
                </Badge>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <span>Social Features</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span>Enhanced Payments</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {children}
    </div>
  )
}

/**
 * Utility Hook for Components
 * 
 * This hook provides a convenient way for other components to check
 * Mini App capabilities without implementing their own detection logic.
 */
export function useMiniAppCapabilities(): {
  capabilities: MiniAppCapabilities | null
  isLoading: boolean
  enhancementLevel: 'full' | 'partial' | 'fallback'
  isFarcasterClient: boolean
  supportsX402: boolean
} {
  const { capabilities, isLoading } = useCapabilityDetection()
  
  const enhancementLevel = useMemo(() => {
    if (!capabilities) return 'fallback'
    
    if (capabilities.isFarcasterClient && capabilities.supportsX402) {
      return 'full'
    } else if (capabilities.hasWalletAccess) {
      return 'partial'
    } else {
      return 'fallback'
    }
  }, [capabilities])

  return {
    capabilities,
    isLoading,
    enhancementLevel,
    isFarcasterClient: capabilities?.isFarcasterClient ?? false,
    supportsX402: capabilities?.supportsX402 ?? false
  }
}

/**
 * Export all interfaces and components for external use
 */
export type {
  ProgressiveEnhancementProps,
  CapabilityDetectionResult,
}

export {
  ClientCapabilityDetector,
  WebInterfaceFallback,
  TraditionalPaymentFallback,
  NetworkErrorFallback
}
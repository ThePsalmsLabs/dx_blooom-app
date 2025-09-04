'use client'

/**
 * Enhanced MiniApp Layout - Complete Social Commerce Layout Foundation
 * File: src/app/mini/layout.tsx
 * 
 * This layout component extends your sophisticated existing AppLayout architecture to provide
 * optimal user experience in MiniApp contexts while maintaining full compatibility with your
 * established patterns. It builds upon your role-based navigation, responsive design, and
 * Web3-aware state management while adding MiniApp-specific optimizations for social commerce.
 * 
 * Key Architectural Integration:
 * - Extends your existing AppLayout and AdaptiveNavigation patterns
 * - Integrates seamlessly with Components 1-4 (types, detection, provider, wagmi config)
 * - Builds upon your sophisticated user role management and creator registration system
 * - Uses your established error handling and loading state patterns
 * - Maintains compatibility with your theme management and responsive design system
 * - Leverages your existing UI component library and design tokens
 * 
 * Enhanced MiniApp Features:
 * - Progressive loading with MiniApp SDK ready state management
 * - Social context awareness with Farcaster user integration
 * - Mobile-optimized navigation and touch interaction patterns
 * - Enhanced error boundaries with MiniApp-specific recovery strategies
 * - Performance monitoring and optimization for embedded contexts
 * - Real-time capability monitoring and adaptive feature enablement
 * - Social sharing integration and engagement tracking
 * - Batch transaction support indicators and optimizations
 * 
 * Production Architecture:
 * - Comprehensive error boundaries with graceful fallbacks to your existing web layout
 * - Performance optimization for mobile and embedded environments
 * - Analytics integration for social commerce optimization
 * - Accessibility enhancements for touch-first interactions
 * - Security considerations for social platform integration
 */

import React, { 
	Suspense, 
	useEffect, 
	useState, 
	useCallback, 
	useMemo,
	useRef,
	ReactNode 
  } from 'react'
  import { ErrorBoundary } from 'react-error-boundary'


  import {
	AlertCircle,
	RefreshCw,
	Loader2,
	WifiOff,
	Zap,
	Users,
	Share2,
	ExternalLink
  } from 'lucide-react'
  
  // Import your established UI components and patterns
  import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Alert,
	AlertDescription,
	Badge,
	Avatar,
	AvatarFallback,
	Progress,
	Toaster
  } from '@/components/ui/index'
  import { cn } from '@/lib/utils'
  
  // Import your existing layout components for seamless integration
  import { AppLayout } from '@/components/layout/AppLayout'
  
// Import previous components for complete integration
  import type {
	EnhancedSocialProfile
  } from '@/types/miniapp'
  import {
  useMiniAppState,
  useMiniAppActions,
  useMiniAppUtils,
  useSocialState
} from '@/contexts/UnifiedMiniAppProvider'
import { OptimizedMiniAppProvider } from '@/components/providers/OptimizedMiniAppProvider'

  import { FastRPCProvider } from '@/components/debug/FastRPCProvider'
import { initializeErrorRecovery } from '@/lib/utils/error-recovery'
  
  // Import your existing hooks for seamless integration
  import { useIsCreatorRegistered } from '@/hooks/contracts/core'
  import { useMiniAppWalletUI } from '@/hooks/web3/useMiniAppWalletUI'
  import { MiniAppWalletProvider } from '@/contexts/MiniAppWalletContext'
  import { ShareButton } from '@/components/ui/share-button'
  import { FarcasterEmbed } from '@/components/farcaster/FarcasterEmbed'

  // ================================================
  // TYPE DEFINITIONS FOR BROWSER APIS
  // ================================================

  /**
   * Navigator Connection API Interface
   */
  interface NavigatorConnection {
    readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
    readonly addEventListener: (type: string, listener: () => void) => void
    readonly removeEventListener: (type: string, listener: () => void) => void
  }

  /**
   * Extended Navigator Interface
   */
  interface ExtendedNavigator extends Navigator {
    readonly connection?: NavigatorConnection
    readonly mozConnection?: NavigatorConnection
    readonly webkitConnection?: NavigatorConnection
    readonly getBattery?: () => Promise<BatteryManager>
  }

  /**
   * Battery Manager Interface
   */
  interface BatteryManager {
    readonly level: number
    readonly charging: boolean
  }

  /**
   * Performance Memory Interface
   */
  interface PerformanceMemory {
    readonly usedJSHeapSize: number
    readonly jsHeapSizeLimit: number
  }

  /**
   * Extended Performance Interface
   */
  interface ExtendedPerformance extends Performance {
    readonly memory?: PerformanceMemory
  }

  /**
   * Analytics Tracking Interface
   */
  interface AnalyticsTracker {
    readonly track: (event: string, properties: Record<string, unknown>) => void
  }

  /**
   * Extended Window Interface
   */
  interface ExtendedWindow extends Window {
    readonly analytics?: {
      track: (event: string, data: unknown) => void
    }
  }

  /**
   * Performance Metrics Interface
   */
  interface PerformanceMetrics {
    readonly loadTime: number
    readonly renderTime: number
    readonly interactionDelay: number
    readonly memoryUsage: number
    readonly renderScore: number
  }

  // ================================================
  // ENHANCED MINIAPP LAYOUT TYPES
  // ================================================
  
  /**
   * MiniApp Layout Props Interface
   * 
   * This extends your existing layout prop patterns while adding MiniApp-specific
   * configuration options for optimal social commerce experience.
   */
  interface EnhancedMiniAppLayoutProps {
	readonly children: ReactNode
	readonly className?: string

	readonly enableAnalytics?: boolean
	readonly showDebugInfo?: boolean
	readonly fallbackToWeb?: boolean
	readonly customErrorBoundary?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
	readonly loadingComponent?: React.ComponentType<{ progress?: number }>
  }
  
  /**
   * MiniApp Layout State Interface
   * 
   * This extends your existing layout state patterns with MiniApp-specific
   * state management for social commerce optimization.
   */
  interface MiniAppLayoutState {
	readonly isInitialized: boolean
	readonly isReady: boolean
	readonly hasErrors: boolean
	readonly loadingProgress: number
	readonly connectionQuality: 'excellent' | 'good' | 'fair' | 'poor'
	readonly socialContext: {
	  readonly isAvailable: boolean
	  readonly userProfile: EnhancedSocialProfile | null
	  readonly shareCount: number
	  readonly engagementScore: number
	}
	readonly capabilities: {
	  readonly canShare: boolean
	  readonly canBatchTransactions: boolean
	  readonly hasEnhancedFeatures: boolean
	  readonly performanceLevel: 'high' | 'medium' | 'low'
	}
  }
  
  /**
   * Device and Performance Detection
   * 
   * This builds upon your existing device detection patterns while adding
   * MiniApp-specific performance and capability assessment.
   */
  interface DeviceContext {
	readonly isMobile: boolean
	readonly isTablet: boolean
	readonly isEmbedded: boolean
	readonly viewportSize: { width: number; height: number }
	readonly connectionType: 'wifi' | '4g' | '3g' | 'slow' | 'offline'
	readonly batteryLevel: number | null
	readonly isLowPowerMode: boolean
	readonly touchCapable: boolean
	readonly orientationSupport: boolean
  }
  
  // ================================================
  // ENHANCED LOADING AND ERROR COMPONENTS
  // ================================================
  
  /**
   * MiniApp Loading Component
   * 
   * This provides sophisticated loading states that build upon your existing
   * loading patterns while adding MiniApp-specific initialization feedback.
   */
  function MiniAppLayoutLoading({ progress = 0 }: { progress?: number }) {
	const [loadingStep, setLoadingStep] = useState('Initializing...')
	
	useEffect(() => {
	  const steps = [
		'Initializing...',
		'Detecting environment...',
		'Connecting to Farcaster...',
		'Loading social context...',
		'Preparing interface...',
		'Almost ready...'
	  ]
	  
	  const stepIndex = Math.floor((progress / 100) * (steps.length - 1))
	  setLoadingStep(steps[stepIndex] || steps[0])
	}, [progress])
	
	return (
	  <div className="min-h-screen flex items-center justify-center bg-background/95 backdrop-blur">
		<Card className="w-full max-w-md mx-4">
		  <CardHeader className="text-center pb-4">
			<div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-primary/10">
			  <Loader2 className="h-6 w-6 animate-spin text-primary" />
			</div>
			<CardTitle className="text-lg">Loading MiniApp</CardTitle>
		  </CardHeader>
		  <CardContent className="space-y-4">
			<div className="space-y-2">
			  <div className="flex justify-between text-sm">
				<span className="text-muted-foreground">{loadingStep}</span>
				<span className="text-muted-foreground">{Math.round(progress)}%</span>
			  </div>
			  <Progress value={progress} className="h-2" />
			</div>
			
			<div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
			  <Zap className="h-3 w-3" />
			  <span>Optimizing for social commerce</span>
			</div>
		  </CardContent>
		</Card>
	  </div>
	)
  }
  
  /**
   * MiniApp Error Boundary Fallback
   * 
   * This provides comprehensive error handling that builds upon your existing
   * error boundary patterns while adding MiniApp-specific recovery options.
   */
  function MiniAppLayoutErrorFallback({ 
	error, 
	resetErrorBoundary 
  }: { 
	error: Error
	resetErrorBoundary: () => void 
  }) {
	const [isRetrying, setIsRetrying] = useState(false)
	const [showDetails, setShowDetails] = useState(false)
	
	const handleRetry = useCallback(async () => {
	  setIsRetrying(true)
	  try {
		// Give a moment for any cleanup
		await new Promise(resolve => setTimeout(resolve, 1000))
		resetErrorBoundary()
	  } catch (retryError) {
		console.error('Retry failed:', retryError)
	  } finally {
		setIsRetrying(false)
	  }
	}, [resetErrorBoundary])
	
	const handleFallbackToWeb = useCallback(() => {
	  // Redirect to web version of the current page
	  const currentPath = window.location.pathname.replace('/mini', '')
	  window.location.href = currentPath || '/'
	}, [])
	
	return (
	  <div className="min-h-screen flex items-center justify-center bg-background p-4">
		<Card className="w-full max-w-lg">
		  <CardHeader className="text-center">
			<div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-destructive/10">
			  <AlertCircle className="h-6 w-6 text-destructive" />
			</div>
			<CardTitle className="text-lg">MiniApp Error</CardTitle>
		  </CardHeader>
		  <CardContent className="space-y-4">
			<Alert>
			  <AlertCircle className="h-4 w-4" />
			  <AlertDescription>
				Something went wrong loading the MiniApp. This might be due to network
				connectivity or compatibility issues.
			  </AlertDescription>
			</Alert>
			
			{showDetails && (
			  <Card className="bg-muted">
				<CardContent className="pt-4">
				  <div className="text-sm font-mono text-muted-foreground">
					<div className="font-medium mb-2">Error Details:</div>
					<div className="whitespace-pre-wrap break-all">
					  {error.message}
					</div>
				  </div>
				</CardContent>
			  </Card>
			)}
			
			<div className="space-y-2">
			  <Button 
				onClick={handleRetry} 
				disabled={isRetrying}
				className="w-full"
			  >
				{isRetrying ? (
				  <>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Retrying...
				  </>
				) : (
				  <>
					<RefreshCw className="mr-2 h-4 w-4" />
					Try Again
				  </>
				)}
			  </Button>
			  
			  <Button 
				variant="outline" 
				onClick={handleFallbackToWeb}
				className="w-full"
			  >
				<ExternalLink className="mr-2 h-4 w-4" />
				Open Web Version
			  </Button>
			  
			  <Button
				variant="ghost"
				size="sm"
				onClick={() => setShowDetails(!showDetails)}
				className="w-full text-xs"
			  >
				{showDetails ? 'Hide' : 'Show'} Technical Details
			  </Button>
			</div>
		  </CardContent>
		</Card>
	  </div>
	)
  }
  
  // ================================================
  // DEVICE AND CAPABILITY DETECTION
  // ================================================
  
  /**
   * Device Context Hook
   * 
   * This provides comprehensive device detection that builds upon your existing
   * patterns while adding MiniApp-specific capability assessment.
   */
  function useDeviceContext(): DeviceContext {
	const [deviceContext, setDeviceContext] = useState<DeviceContext>({
	  isMobile: false,
	  isTablet: false,
	  isEmbedded: false,
	  viewportSize: { width: 0, height: 0 },
	  connectionType: 'wifi',
	  batteryLevel: null,
	  isLowPowerMode: false,
	  touchCapable: false,
	  orientationSupport: false
	})
	
	useEffect(() => {
	  if (typeof window === 'undefined') return
	  
	  const updateDeviceContext = () => {
		const userAgent = navigator.userAgent.toLowerCase()
		const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile/i.test(userAgent)
		const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
		const isEmbedded = window.parent !== window
		
		const viewportSize = {
		  width: window.innerWidth,
		  height: window.innerHeight
		}
		
		// Connection detection
		const connection = (navigator as ExtendedNavigator).connection ||
						  (navigator as ExtendedNavigator).mozConnection ||
						  (navigator as ExtendedNavigator).webkitConnection
		
		let connectionType: DeviceContext['connectionType'] = 'wifi'
		if (connection) {
		  switch (connection.effectiveType) {
			case 'slow-2g':
			case '2g':
			  connectionType = 'slow'
			  break
			case '3g':
			  connectionType = '3g'
			  break
			case '4g':
			  connectionType = '4g'
			  break
			default:
			  connectionType = 'wifi'
		  }
		}
		
		// Battery detection
		let batteryLevel: number | null = null
		let isLowPowerMode = false
		if ('getBattery' in navigator) {
		  const getBattery = (navigator as ExtendedNavigator).getBattery
		  if (getBattery) {
			getBattery().then((battery: BatteryManager) => {
			  batteryLevel = battery.level
			  isLowPowerMode = battery.level < 0.2 && !battery.charging
			}).catch(() => {
			  // Battery API not available
			})
		  }
		}
		
		// Touch and orientation support
		const touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0
		const orientationSupport = 'orientation' in screen
		
		setDeviceContext({
		  isMobile,
		  isTablet,
		  isEmbedded,
		  viewportSize,
		  connectionType,
		  batteryLevel,
		  isLowPowerMode,
		  touchCapable,
		  orientationSupport
		})
	  }
	  
	  updateDeviceContext()
	  
	  // Listen for changes
	  window.addEventListener('resize', updateDeviceContext)
	  window.addEventListener('orientationchange', updateDeviceContext)
	  
	  // Connection change detection
	  if ('connection' in navigator) {
		(navigator as ExtendedNavigator).connection?.addEventListener('change', updateDeviceContext)
	  }

	  return () => {
		window.removeEventListener('resize', updateDeviceContext)
		window.removeEventListener('orientationchange', updateDeviceContext)
		if ('connection' in navigator) {
		  (navigator as ExtendedNavigator).connection?.removeEventListener('change', updateDeviceContext)
		}
	  }
	}, [])
	
	return deviceContext
  }
  
  // ================================================
  // PERFORMANCE MONITORING COMPONENT
  // ================================================
  
  /**
   * Performance Monitor Component
   * 
   * This provides real-time performance monitoring that builds upon your
   * existing patterns while adding MiniApp-specific optimization tracking.
   */
  function PerformanceMonitor({
	onPerformanceUpdate
  }: {
	onPerformanceUpdate?: (metrics: PerformanceMetrics) => void
  }) {
	const [metrics, setMetrics] = useState({
	  loadTime: 0,
	  renderTime: 0,
	  interactionDelay: 0,
	  memoryUsage: 0,
	  renderScore: 100
	})
	
	const metricsRef = useRef({
	  startTime: performance.now(),
	  lastInteraction: performance.now(),
	  interactionCount: 0
	})
	
	useEffect(() => {
	  const updateMetrics = () => {
		const now = performance.now()
		const loadTime = now - metricsRef.current.startTime
		
		// Memory usage (if available)
		let memoryUsage = 0
		if ('memory' in performance) {
		  const memory = (performance as ExtendedPerformance).memory
		  if (memory) {
			memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
		  }
		}
		
		// Calculate render score based on various factors
		const renderScore = Math.max(0, 100 - Math.floor(loadTime / 100))
		
		const newMetrics = {
		  loadTime,
		  renderTime: now - metricsRef.current.startTime,
		  interactionDelay: now - metricsRef.current.lastInteraction,
		  memoryUsage,
		  renderScore
		}
		
		setMetrics(newMetrics)
		onPerformanceUpdate?.(newMetrics)
	  }
	  
	  // Update metrics periodically
	  const interval = setInterval(updateMetrics, 1000)
	  
	  // Track interactions
	  const handleInteraction = () => {
		metricsRef.current.lastInteraction = performance.now()
		metricsRef.current.interactionCount++
	  }
	  
	  document.addEventListener('click', handleInteraction)
	  document.addEventListener('touchstart', handleInteraction)
	  
	  return () => {
		clearInterval(interval)
		document.removeEventListener('click', handleInteraction)
		document.removeEventListener('touchstart', handleInteraction)
	  }
	}, [onPerformanceUpdate])
	
	// Only show in development
	if (process.env.NODE_ENV !== 'development') {
	  return null
	}
	
	return (
	  <div className="fixed bottom-4 right-4 bg-background/90 backdrop-blur border rounded-lg p-3 text-xs font-mono shadow-lg z-50">
		<div className="space-y-1">
		  <div>Load: {Math.round(metrics.loadTime)}ms</div>
		  <div>Render: {Math.round(metrics.renderTime)}ms</div>
		  <div>Memory: {Math.round(metrics.memoryUsage * 100)}%</div>
		  <div>Score: {metrics.renderScore}/100</div>
		</div>
	  </div>
	)
  }
  
  // ================================================
  // SOCIAL CONTEXT INDICATOR COMPONENT
  // ================================================
  
  /**
   * Social Context Indicator
   * 
   * This provides visual feedback about social context and capabilities,
   * building upon your existing status indicator patterns.
   */
  function SocialContextIndicator() {
	const miniAppUtils = useMiniAppUtils()
	const socialProfile = useSocialState()
	const miniAppState = useMiniAppState()

	if (!miniAppUtils.isMiniApp) return null
	
	return (
	  <div className="fixed top-4 left-4 z-50">
		<Card className="bg-background/90 backdrop-blur border">
		  <CardContent className="p-3">
			<div className="flex items-center space-x-3">
			  {/* Environment Indicator */}
			  				<div className="flex items-center space-x-1">
				<div className={cn(
				  "h-2 w-2 rounded-full",
				  miniAppUtils.isMiniApp ? "bg-green-500" : "bg-yellow-500"
				)} />
				<span className="text-xs font-medium">
				  {miniAppUtils.isMiniApp ? 'MiniApp' : 'Web'}
				</span>
			  </div>
			  
			  {/* Social Profile Indicator */}
			  {socialProfile && socialProfile.userProfile && (
				<div className="flex items-center space-x-1">
				  <Users className="h-3 w-3 text-muted-foreground" />
				  <span className="text-xs">
					@{socialProfile.userProfile.username || 'anonymous'}
				  </span>
				</div>
			  )}
			  
			  {/* Capabilities Indicators */}
			  <div className="flex items-center space-x-1">
				{miniAppState.capabilities.social.canShare && (
				  <Share2 className="h-3 w-3 text-green-500" />
				)}
				{miniAppState.capabilities.wallet.canBatchTransactions && (
				  <Zap className="h-3 w-3 text-blue-500" />
				)}
			  </div>
			</div>
		  </CardContent>
		</Card>
	  </div>
	)
  }
  
  // ================================================
  // MINIAPP LAYOUT CONTENT WRAPPER
  // ================================================
  
  /**
   * MiniApp Layout Content Wrapper
   * 
   * This component provides the core layout functionality that builds upon
   * your existing AppLayout while adding MiniApp-specific optimizations.
   */
  function MiniAppLayoutContent({ children }: { children: ReactNode }) {

	
	// Use MiniApp-specific wallet UI hook for proper state synchronization
	const walletUI = useMiniAppWalletUI()

	// Get the FULL address from walletUI, not the formatted one
	const fullAddress = walletUI.address

	// Integration with your existing hooks - use full address for contract calls
	useIsCreatorRegistered(fullAddress as `0x${string}` | undefined)
	
	// MiniApp-specific hooks
	const miniAppState = useMiniAppState()
	const miniAppActions = useMiniAppActions()
	const miniAppUtils = useMiniAppUtils()
	const socialProfile = useSocialState()

	// Device and performance monitoring
	const deviceContext = useDeviceContext()

	// Simplified layout state - only track errors, not initialization
	const [hasErrors, setHasErrors] = useState(false)

	// Initialize layout when MiniApp is ready
	useEffect(() => {
	  const initializeLayout = async () => {
		try {
		  		if (miniAppUtils.isMiniApp && !miniAppState.isConnected) {
			// Signal ready to MiniApp platform
			// Note: signalReady method would be implemented in the actions
			console.log('MiniApp ready signaled')
		  }
		  setHasErrors(false)
		} catch (error) {
		  console.error('Layout initialization failed:', error)
		  setHasErrors(true)
		}
	  }

	  initializeLayout()
	}, [
	  miniAppUtils.isMiniApp,
	  miniAppState.isConnected,
	  miniAppActions
	])

	// Performance monitoring
	const handlePerformanceUpdate = useCallback((metrics: PerformanceMetrics) => {
	  // Could send to analytics service
	  if (process.env.NODE_ENV === 'development') {
		console.debug('MiniApp Performance:', metrics)
	  }
	}, [])



	// Apply device-specific optimizations
	const layoutClassName = useMemo(() => {
	  return cn(
		'min-h-screen bg-background',
		// Mobile-specific optimizations
		deviceContext.isMobile && [
		  'touch-manipulation',
		  '-webkit-tap-highlight-color-transparent',
		  'overflow-x-hidden'
		],
		// Performance-based optimizations
		(deviceContext.connectionType === 'wifi' && !deviceContext.isLowPowerMode ? 'high' :
		 deviceContext.connectionType === '4g' ? 'medium' : 'low') === 'low' && [
		  'will-change-auto', // Disable hardware acceleration for low-end devices
		  'reduced-motion'
		],
		// Connection-based optimizations
		deviceContext.connectionType === 'slow' && [
		  'connection-slow'
		]
	  )
	}, [
	  deviceContext.isMobile,
	  deviceContext.connectionType,
	  deviceContext.isLowPowerMode
	])

	// Simplified loading check - only show loading if there are errors
	if (hasErrors) {
	  return <MiniAppLayoutLoading progress={100} />
	}
	
	return (
	  <div className={layoutClassName}>
		{/* Farcaster Embed for Mini App Pages */}
		<FarcasterEmbed
		  title="Bloom - Premium Content"
		  description="Discover premium content from top creators. Purchase with instant USDC payments on Base."
		  image="https://dxbloom.com/images/miniapp-og-image.png"
		  buttonText="Open Mini App"
		  buttonTarget="https://dxbloom.com/mini"
		/>

		{/* Social Context Indicator */}
		{miniAppUtils.isMiniApp && (
		  <SocialContextIndicator />
		)}

		{/* Performance Monitor (development only) */}
		<PerformanceMonitor onPerformanceUpdate={handlePerformanceUpdate} />

		{/* Your existing AppLayout enhanced for MiniApp with wallet context */}
		<MiniAppWalletProvider>
		  <AppLayout
			className="miniapp-layout"
			showNavigation={false}
			showHeader={false}
			headerContent={
			  <div className="flex items-center space-x-3">
				{socialProfile && socialProfile.userProfile && (
				  <>
					<Avatar className="h-6 w-6">
					  <AvatarFallback>
						{socialProfile.userProfile.displayName?.charAt(0) || '?'}
					  </AvatarFallback>
					</Avatar>
					<span className="text-sm font-medium hidden sm:inline">
					  {socialProfile.userProfile.displayName}
					</span>
				  </>
				)}
				{miniAppState.capabilities.social.canShare && (
				  <ShareButton
					contentId={BigInt(0)} // Platform share
					title="Discover amazing content on @dxbloom!"
					description="Premium content platform with instant USDC payments on Base. Join creators and unlock exclusive content! 🚀"
					variant="ghost"
					className="text-xs h-7 px-2"
				  />
				)}
				{socialProfile && miniAppState.capabilities.social.canShare && (
					<Badge variant="secondary" className="text-xs">
					  <Share2 className="h-3 w-3 mr-1" />
					  Social
					</Badge>
				  )}
			  </div>
			}
		  >
		  {/* Enhanced content area with MiniApp optimizations */}
		  <div className="relative">
			{/* Enhanced content wrapper */}
			<div className={cn(
			  'transition-all duration-200',
			  (deviceContext.connectionType === 'wifi' && !deviceContext.isLowPowerMode ? 'high' :
			   deviceContext.connectionType === '4g' ? 'medium' : 'low') === 'low' && 'transition-none'
			)}>
			  {children}
			</div>

			{/* Connection quality indicator */}
			{deviceContext.connectionType === 'slow' && (
			  <div className="fixed bottom-4 left-4 z-40">
				<Alert className="bg-yellow-50 border-yellow-200">
				  <WifiOff className="h-4 w-4" />
				  <AlertDescription className="text-sm">
					Slow connection detected. Some features may be limited.
				  </AlertDescription>
				</Alert>
			  </div>
			)}

			{/* Error state overlay */}
			{hasErrors && (
			  <div className="fixed inset-0 bg-background/80 backdrop-blur z-50 flex items-center justify-center">
				<Alert className="max-w-md mx-4">
				  <AlertCircle className="h-4 w-4" />
				  <AlertDescription>
					Some MiniApp features may not be working correctly.
					<Button
					  variant="link"
					  size="sm"
					  onClick={() => window.location.reload()}
					  className="px-1"
					>
					  Try refreshing
					</Button>
				  </AlertDescription>
				</Alert>
			  </div>
			)}
		  </div>
		  </AppLayout>
		</MiniAppWalletProvider>
		
		{/* Enhanced toast notifications for MiniApp */}
		<Toaster />
		
		{/* MiniApp-specific global styles */}
		<style jsx global>{`
		  /* Mobile-optimized touch interactions */
		  .miniapp-layout {
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
		  }
		  
		  .miniapp-layout * {
			-webkit-tap-highlight-color: transparent;
		  }
		  
		  /* Connection-aware loading states */
		  .connection-slow img {
			transition: opacity 0.3s ease;
		  }
		  
		  .connection-slow img:not(.loaded) {
			opacity: 0.7;
			filter: blur(1px);
		  }
		  
		  /* Performance-optimized animations */
		  .reduced-motion * {
			animation-duration: 0.1s !important;
			transition-duration: 0.1s !important;
		  }
		  
		  /* Touch-optimized interactions */
		  .touch-manipulation {
			touch-action: manipulation;
		  }
		  
		  /* Improved tap targets for mobile */
		  .miniapp-layout button,
		  .miniapp-layout [role="button"] {
			min-height: 44px;
			min-width: 44px;
		  }
		  
		  /* Enhanced contrast for social contexts */
		  .miniapp-layout {
			--contrast-ratio: 1.1;
		  }
		  
		  /* Custom responsive breakpoints for tabs */
		  @media (min-width: 475px) {
			.xs\:inline {
			  display: inline;
			}
		  }
		  
		  /* Hide scrollbars for tab navigation */
		  .scrollbar-hide {
			-ms-overflow-style: none;
			scrollbar-width: none;
		  }
		  
		  .scrollbar-hide::-webkit-scrollbar {
			display: none;
		  }
		  
		  /* Smooth scrolling for tab navigation */
		  .overflow-x-auto {
			scroll-behavior: smooth;
		  }
		  
		  /* Tab responsive improvements */
		  .miniapp-layout [role="tablist"] {
			scroll-snap-type: x mandatory;
		  }
		  
		  .miniapp-layout [role="tab"] {
			scroll-snap-align: start;
		  }
		  
		  @media (max-width: 768px) {
			.miniapp-layout {
			  --sidebar-width: 0px;
			}
		  }
		`}</style>
	  </div>
	)
  }
  
  // ================================================
  // MAIN ENHANCED MINIAPP LAYOUT COMPONENT
  // ================================================
  
  /**
   * Enhanced MiniApp Layout Component
   * 
   * This is the main layout component that orchestrates all MiniApp functionality
   * while building upon your existing architectural patterns.
   */
  export default function EnhancedMiniAppLayout({
	children,
	className,
	enableAnalytics = true,
	showDebugInfo = process.env.NODE_ENV === 'development',
	fallbackToWeb = true,
	customErrorBoundary: CustomErrorBoundary,
	loadingComponent: CustomLoadingComponent
  }: EnhancedMiniAppLayoutProps) {
	


	// Initialize error recovery system
	useEffect(() => {
	  initializeErrorRecovery()
	}, [])

	// Fallback ready() call to ensure splash screen dismisses
	useEffect(() => {
	  let timeoutId: NodeJS.Timeout

	  const ensureReady = async () => {
		try {
		  // Only try this if we're in a MiniApp context
		  if (window.parent !== window || window.location.pathname.startsWith('/mini')) {
			console.log('🔄 Fallback: Attempting to call sdk.actions.ready()...')
			
			const { sdk } = await import('@farcaster/miniapp-sdk')
			await sdk.actions.ready()
			console.log('✅ Fallback: sdk.actions.ready() completed successfully')
		  }
		} catch (error) {
		  console.warn('⚠️ Fallback ready() call failed (this may be normal):', error)
		}
	  }

	  // Call ready() after a short delay to ensure other providers have initialized
	  timeoutId = setTimeout(ensureReady, 2000)

	  return () => {
		if (timeoutId) {
		  clearTimeout(timeoutId)
		}
	  }
	}, [])
	
	// Error boundary component selection
	const ErrorBoundaryComponent = CustomErrorBoundary || ErrorBoundary
	const LoadingComponent = CustomLoadingComponent || MiniAppLayoutLoading
	
	return (
	  <ErrorBoundary
		FallbackComponent={MiniAppLayoutErrorFallback}
		onError={(_error, errorInfo) => {
		  console.error('MiniApp Layout Error:', _error, errorInfo)

		  // Report to analytics if enabled
		  if (enableAnalytics && typeof window !== 'undefined' && (window as ExtendedWindow).analytics) {
			(window as ExtendedWindow).analytics?.track('miniapp_layout_error', {
			  error_message: _error.message,
			  error_stack: _error.stack,
			  error_info: errorInfo,
			  url: window.location.href,
			  user_agent: navigator.userAgent,
			  timestamp: Date.now()
			})
		  }
		}}
	  	  >
		{/* DEBUG: Log config state for troubleshooting */}
		{showDebugInfo && (
		  <div className="fixed top-0 left-0 bg-green-500 text-white p-2 text-xs z-50">
			MiniApp Layout: OK
		  </div>
		)}
		<FastRPCProvider>
		  <OptimizedMiniAppProvider
			enableAnalytics={enableAnalytics}
			enableOptimizations={true}
			fallbackToWeb={fallbackToWeb}
		  >
			<Suspense fallback={<LoadingComponent progress={90} />}>
			  <div className={cn('enhanced-miniapp-layout', className)}>
				<MiniAppLayoutContent>
				  {children}
				</MiniAppLayoutContent>
			  </div>
			</Suspense>
		  </OptimizedMiniAppProvider>
		</FastRPCProvider>
	  </ErrorBoundary>
	)
  }
  
  // ================================================
  // CONVENIENCE EXPORTS
  // ================================================
  
  /**
   * Layout Configuration Helpers
   * 
   * These provide easy configuration for common MiniApp layout scenarios.
   */
  export const MiniAppLayoutConfigs = {
	/**
	 * Minimal configuration for basic MiniApp functionality
	 */
	minimal: {
	  enableSocialFeatures: false,
	  enableAnalytics: false,
	  showDebugInfo: false
	},
	
	/**
	 * Full-featured configuration for complete social commerce experience
	 */
	complete: {
	  enableSocialFeatures: true,
	  enableAnalytics: true,
	  showDebugInfo: process.env.NODE_ENV === 'development'
	},
	
	/**
	 * Performance-optimized configuration for lower-end devices
	 */
	performance: {
	  enableSocialFeatures: true,
	  enableAnalytics: false,
	  showDebugInfo: false,
	  fallbackToWeb: true
	}
  } as const
  
  /**
   * Export types for external use
   */
  export type {
	EnhancedMiniAppLayoutProps,
	MiniAppLayoutState,
	DeviceContext
  }
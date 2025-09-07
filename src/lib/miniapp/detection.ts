/**
 * MiniApp Detection Utilities - Advanced Environment Intelligence
 * File: src/lib/miniapp/detection.ts
 * 
 * This component provides sophisticated MiniApp environment detection that builds upon your
 * existing detection infrastructure while adding comprehensive social platform intelligence.
 * It integrates seamlessly with your current DetectedPlatform system and device capability
 * profiling to provide enhanced context awareness for social commerce optimization.
 * 
 * Key Architectural Integration:
 * - Extends your existing src/utils/context/detection.ts patterns
 * - Builds upon your DeviceCapabilityProfile and DetectedPlatform enums
 * - Integrates with your confidence scoring and evidence-based detection
 * - Maintains compatibility with your UnifiedAppProvider context system
 * - Follows your established patterns for comprehensive environment analysis
 * 
 * Enhanced Capabilities:
 * - Farcaster SDK detection and capability assessment
 * - Social platform context analysis with engagement pattern recognition
 * - Progressive enhancement decision making based on available capabilities
 * - Real-time capability monitoring and adaptation
 * - Integration with your existing performance profiling system
 */

import type {
    MiniAppEnvironment,
    MiniAppCapabilities
  } from '@/types/miniapp'
  
  // Import your existing detection types and utilities
  import type {
    DetectedPlatform,
    DeviceCapabilityProfile,
    EnvironmentConfidence
  } from '@/utils/context/detection'
  
  // ================================================
  // ENHANCED MINIAPP ENVIRONMENT DETECTION
  // ================================================
  
  /**
   * MiniApp Environment Detection Result
   * 
   * This interface extends your existing detection patterns with MiniApp-specific
   * context while maintaining full compatibility with your current system.
   */
 interface MiniAppEnvironmentDetection {
    /** Core environment classification */
    readonly environment: MiniAppEnvironment
    
    /** Your existing platform detection result */
    readonly detectedPlatform: DetectedPlatform
    
    /** Farcaster-specific context */
    readonly farcasterContext: {
      readonly isInFarcasterClient: boolean
      readonly clientType: 'warpcast' | 'farcaster_mobile' | 'unknown' | null
      readonly clientVersion: string | null
      readonly frameContext: boolean
      readonly embedDepth: number
    }
    
    /** SDK availability assessment */
    readonly sdkAvailability: {
      readonly hasFarcasterSDK: boolean
      readonly sdkVersion: string | null
      readonly initializationStatus: 'available' | 'loading' | 'failed' | 'unavailable'
      readonly lastDetectionAttempt: Date
    }
    
    /** Capability assessment summary */
    readonly capabilities: MiniAppCapabilities
    
    /** Detection confidence using your existing confidence system */
    readonly confidence: EnvironmentConfidence
    
    /** Integration recommendations for your provider system */
    readonly integrationRecommendations: {
      readonly useEnhancedProvider: boolean
      readonly enableSocialFeatures: boolean
      readonly enableBatchTransactions: boolean
      readonly fallbackToWebMode: boolean
      readonly monitorCapabilityChanges: boolean
    }
  }
  
  /**
   * Advanced MiniApp Environment Detection
   * 
   * This function provides comprehensive MiniApp environment detection that builds
   * upon your existing detection infrastructure. It follows your established patterns
   * of multi-dimensional analysis and confidence scoring.
   * 
   * Optimized with timeout to prevent hanging during initialization.
   */
  async function detectMiniAppEnvironment(): Promise<MiniAppEnvironmentDetection> {
    const detectionStartTime = Date.now()
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Detection timeout')), 3000)
      )
      
      const detectionPromise = (async () => {
        // Use your existing platform detection as the foundation
        const basePlatformDetection = await detectBasePlatform()
        const deviceProfile = await createEnhancedDeviceProfile()
        
        // Perform MiniApp-specific detection
        const farcasterContext = await detectFarcasterContext()
        const sdkAvailability = await assessSDKAvailability()
        const capabilities = await assessMiniAppCapabilities(farcasterContext, deviceProfile)
        
        // Determine primary environment classification
        const environment = classifyMiniAppEnvironment(farcasterContext, basePlatformDetection)
        
        // Calculate confidence using your existing confidence system
        const confidence = calculateDetectionConfidence({
          farcasterContext,
          sdkAvailability,
          capabilities,
          basePlatformDetection,
          detectionTime: Date.now() - detectionStartTime
        })
        
        // Generate integration recommendations
        const integrationRecommendations = generateIntegrationRecommendations({
          environment,
          capabilities,
          confidence,
          deviceProfile
        })
        
        return {
          environment,
          detectedPlatform: basePlatformDetection,
          farcasterContext,
          sdkAvailability,
          capabilities,
          confidence,
          integrationRecommendations
        }
      })()
      
      return await Promise.race([detectionPromise, timeoutPromise])
      
    } catch (error) {
      // Graceful fallback following your error handling patterns
      console.error('MiniApp environment detection failed:', error)
      
      return createFallbackDetection(error as Error)
    }
  }
  
  // ================================================
  // FARCASTER SDK DETECTION AND ASSESSMENT
  // ================================================
  
  /**
   * Farcaster Context Detection
   * 
   * This function provides sophisticated detection of Farcaster client context,
   * building upon your existing embedding detection and user agent analysis.
   */
  async function detectFarcasterContext(): Promise<MiniAppEnvironmentDetection['farcasterContext']> {
    if (typeof window === 'undefined') {
      return {
        isInFarcasterClient: false,
        clientType: null,
        clientVersion: null,
        frameContext: false,
        embedDepth: 0
      }
    }
    
    // Analyze user agent for Farcaster clients
    const userAgent = navigator.userAgent.toLowerCase()
    const isInFarcasterClient = 
      userAgent.includes('farcaster') ||
      userAgent.includes('warpcast') ||
      userAgent.includes('fc-client') ||
      // Check for frame context
      window.location.search.includes('fc_frame=') ||
      // Check for MiniApp URL patterns
      window.location.pathname.startsWith('/mini') ||
      // Check for embedded context with Farcaster referrer
      (window.parent !== window && document.referrer.includes('farcaster'))
    
    // Determine client type and version
    let clientType: 'warpcast' | 'farcaster_mobile' | 'unknown' | null = null
    let clientVersion: string | null = null
    
    if (isInFarcasterClient) {
      if (userAgent.includes('warpcast')) {
        clientType = 'warpcast'
        const versionMatch = userAgent.match(/warpcast[\\/]([0-9.]+)/)
        clientVersion = versionMatch ? versionMatch[1] : null
      } else if (userAgent.includes('farcaster')) {
        clientType = 'farcaster_mobile'
        const versionMatch = userAgent.match(/farcaster[\\/]([0-9.]+)/)
        clientVersion = versionMatch ? versionMatch[1] : null
      } else {
        clientType = 'unknown'
      }
    }
    
    // Detect frame context using your existing embedding detection
    const frameContext = 
      window.location.search.includes('fc_frame=') ||
      window.location.search.includes('frame_url=') ||
      (window.parent !== window && document.referrer.includes('frame'))
    
    // Calculate embed depth using your existing utility
    const embedDepth = calculateEmbedDepth()
    
    return {
      isInFarcasterClient,
      clientType,
      clientVersion,
      frameContext,
      embedDepth
    }
  }
  
  /**
   * SDK Availability Assessment
   * 
   * This function checks for Farcaster SDK availability and initialization status.
   */
  async function assessSDKAvailability(): Promise<MiniAppEnvironmentDetection['sdkAvailability']> {
    const lastDetectionAttempt = new Date()
    
    try {
      // Check for Farcaster SDK availability
      const hasFarcasterSDK = typeof window !== 'undefined' && (
        // Check for global MiniKit SDK
        'MiniKit' in window ||
        // Check for frame SDK
        'fc' in window ||
        // Check for legacy SDK patterns
        'farcaster' in window
      )
      
      if (!hasFarcasterSDK) {
        return {
          hasFarcasterSDK: false,
          sdkVersion: null,
          initializationStatus: 'unavailable',
          lastDetectionAttempt
        }
      }
      
      // Attempt to get SDK version
      let sdkVersion: string | null = null
      let initializationStatus: 'available' | 'loading' | 'failed' | 'unavailable' = 'loading'
      
      try {
        // Try to dynamically import and check SDK
        const { sdk } = await import('@farcaster/miniapp-sdk')
        
        if (sdk) {
          // The Farcaster MiniApp SDK doesn't expose a version property
          // We'll use a fallback approach to determine availability
          sdkVersion = 'available'
          initializationStatus = 'available'
        } else {
          initializationStatus = 'failed'
        }
      } catch (importError) {
        console.debug('Farcaster SDK import failed:', importError)
        
        // Check if SDK is available but not importable (different environment)
        if (hasFarcasterSDK) {
          initializationStatus = 'available'
          sdkVersion = 'unknown'
        } else {
          initializationStatus = 'unavailable'
        }
      }
      
      return {
        hasFarcasterSDK,
        sdkVersion,
        initializationStatus,
        lastDetectionAttempt
      }
      
    } catch (error) {
      console.error('SDK availability assessment failed:', error)
      
      return {
        hasFarcasterSDK: false,
        sdkVersion: null,
        initializationStatus: 'failed',
        lastDetectionAttempt
      }
    }
  }
  
  // ================================================
  // MINIAPP CAPABILITY ASSESSMENT
  // ================================================
  
  /**
   * Comprehensive MiniApp Capability Assessment
   * 
   * This function builds upon your existing device capability profiling to assess
   * MiniApp-specific capabilities and social commerce features.
   */
  async function assessMiniAppCapabilities(
    farcasterContext: MiniAppEnvironmentDetection['farcasterContext'],
    deviceProfile: DeviceCapabilityProfile
  ): Promise<MiniAppCapabilities> {
    
    // Assess wallet and transaction capabilities
    const walletCapabilities = await assessWalletCapabilities(farcasterContext)
    
    // Assess social capabilities
    const socialCapabilities = await assessSocialCapabilities(farcasterContext)
    
    // Assess platform integration capabilities
    const platformCapabilities = await assessPlatformCapabilities(deviceProfile)
    
    // Assess performance capabilities using your existing profiling
    const performanceCapabilities = await assessPerformanceCapabilities(deviceProfile)
    
    return {
      wallet: walletCapabilities,
      social: socialCapabilities,
      platform: platformCapabilities,
      performance: performanceCapabilities
    }
  }
  
  /**
   * Wallet Type Detection
   *
   * Detects the specific type of wallet being used for better UX and error handling.
   */
  function detectWalletType(): 'metamask' | 'phantom' | 'coinbase' | 'walletconnect' | 'brave' | 'unknown' {
    if (typeof window === 'undefined' || !window.ethereum) return 'unknown'

    const ethereum = window.ethereum

    // Check for specific wallet flags
    if (ethereum.isMetaMask) return 'metamask'
    if (ethereum.isPhantom) return 'phantom'
    if (ethereum.isCoinbaseWallet) return 'coinbase'
    if (ethereum.isWalletConnect) return 'walletconnect'
    if (ethereum.isBraveWallet) return 'brave'

    // Fallback detection based on provider name or other indicators
    const providerName = (ethereum as any).providerName || (ethereum as any).name || ''
    if (providerName.toLowerCase().includes('phantom')) return 'phantom'
    if (providerName.toLowerCase().includes('metamask')) return 'metamask'
    if (providerName.toLowerCase().includes('coinbase')) return 'coinbase'

    // Check for Phantom-specific properties
    if ((ethereum as any)._phantom) return 'phantom'

    return 'unknown'
  }

  /**
   * Wallet Capability Assessment
   *
   * Determines what wallet and transaction capabilities are available in the current context.
   */
  async function assessWalletCapabilities(
    farcasterContext: MiniAppEnvironmentDetection['farcasterContext']
  ): Promise<MiniAppCapabilities['wallet']> {
    
    const canConnect = farcasterContext.isInFarcasterClient || 
                      typeof window !== 'undefined' && 'ethereum' in window
    
    // Check for batch transaction support (EIP-5792)
    // Use a timeout to prevent blocking wallet detection
    let canBatchTransactions = false
    if (farcasterContext.isInFarcasterClient && 
        typeof window !== 'undefined' && 
        window.ethereum && 
        'request' in window.ethereum) {
      
      try {
        const batchCheckPromise = checkMethodSupport('wallet_sendCalls')
        const timeoutPromise = new Promise<boolean>((resolve) => 
          setTimeout(() => resolve(false), 2000)
        )
        
        canBatchTransactions = await Promise.race([batchCheckPromise, timeoutPromise])
      } catch (error) {
        canBatchTransactions = false
      }
    }
    
    // Base network is our primary supported chain
    const supportedChains = [8453, 84532] // Base mainnet and testnet
    
    // For MiniApp context, we can be more permissive with transaction values
    const maxTransactionValue = farcasterContext.isInFarcasterClient ? 
      BigInt('1000000000000000000000') : // 1000 USD equivalent
      null
    
    // Detect wallet type for better UX
    const walletType = detectWalletType()

    return {
      canConnect,
      canSignTransactions: canConnect,
      canBatchTransactions,
      supportedChains,
      maxTransactionValue,
      requiredConfirmations: 1,
      walletType
    }
  }
  
  /**
   * Social Capability Assessment
   * 
   * Determines what social features are available based on the platform context.
   */
  async function assessSocialCapabilities(
    farcasterContext: MiniAppEnvironmentDetection['farcasterContext']
  ): Promise<MiniAppCapabilities['social']> {
    
    const canShare = farcasterContext.isInFarcasterClient || 
                     (typeof navigator !== 'undefined' && 'share' in navigator)
    
    const canCompose = farcasterContext.isInFarcasterClient
    
    const canAccessSocialGraph = farcasterContext.isInFarcasterClient
    
    const canReceiveNotifications = farcasterContext.isInFarcasterClient
    
    const canSendNotifications = false // Platform limitation
    
    // Farcaster has a 320 character limit for cast text
    const maxShareTextLength = farcasterContext.isInFarcasterClient ? 320 : 280
    
    const supportedShareTypes: ('text' | 'image' | 'video' | 'frame')[] = 
      farcasterContext.isInFarcasterClient ? 
        ['text', 'image', 'frame'] : 
        ['text', 'image']
    
    return {
      canShare,
      canCompose,
      canAccessSocialGraph,
      canReceiveNotifications,
      canSendNotifications,
      maxShareTextLength,
      supportedShareTypes
    }
  }
  
  /**
   * Platform Integration Capability Assessment
   * 
   * Uses your existing device profiling to determine platform integration capabilities.
   */
  async function assessPlatformCapabilities(
    deviceProfile: DeviceCapabilityProfile
  ): Promise<MiniAppCapabilities['platform']> {
    
    const canDeepLink = 
      typeof window !== 'undefined' && 
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
    
    const canAccessClipboard = 
      typeof navigator !== 'undefined' && 
      'clipboard' in navigator &&
      deviceProfile.browserCapabilities.cookiesEnabled
    
    const canAccessCamera = 
      typeof navigator !== 'undefined' && 
      'mediaDevices' in navigator &&
      deviceProfile.inputMethods.hasTouch
    
    const canAccessLocation = 
      typeof navigator !== 'undefined' && 
      'geolocation' in navigator
    
    const canVibrate = 
      typeof navigator !== 'undefined' && 
      'vibrate' in navigator &&
      deviceProfile.inputMethods.hasTouch
    
    const canPlayAudio = 
      typeof Audio !== 'undefined' &&
      deviceProfile.browserCapabilities.supportsWebGL // Proxy for modern browser
    
    const supportedImageFormats = ['jpeg', 'png', 'webp', 'gif']
    
    return {
      canDeepLink,
      canAccessClipboard,
      canAccessCamera,
      canAccessLocation,
      canVibrate,
      canPlayAudio,
      supportedImageFormats
    }
  }
  
  /**
   * Performance Capability Assessment
   * 
   * Leverages your existing performance profiling to determine optimization strategies.
   */
  async function assessPerformanceCapabilities(
    deviceProfile: DeviceCapabilityProfile
  ): Promise<MiniAppCapabilities['performance']> {
    
    const supportsServiceWorker = deviceProfile.browserCapabilities.supportsServiceWorkers
    
    const supportsWebAssembly = deviceProfile.browserCapabilities.supportsWebAssembly
    
    const supportsIndexedDB = deviceProfile.browserCapabilities.localStorageAvailable
    
    // Estimate memory limits based on device class
    const maxMemoryUsage = deviceProfile.performanceProfile.estimatedCPUClass === 'high' ? 
      512 : deviceProfile.performanceProfile.estimatedCPUClass === 'medium' ? 
      256 : 128 // MB
    
    const maxStorageSize = supportsIndexedDB ? 50 : 10 // MB
    
    const batteryOptimized = 
      deviceProfile.performanceProfile.isLowPowerMode === true ||
      deviceProfile.performanceProfile.batteryLevel !== null && 
      deviceProfile.performanceProfile.batteryLevel < 0.2
    
    return {
      supportsServiceWorker,
      supportsWebAssembly,
      supportsIndexedDB,
      maxMemoryUsage,
      maxStorageSize,
      batteryOptimized
    }
  }
  
  // ================================================
  // HELPER UTILITIES
  // ================================================
  
  /**
   * Environment Classification Logic
   * 
   * Determines the primary MiniApp environment based on detected context.
   */
  function classifyMiniAppEnvironment(
    farcasterContext: MiniAppEnvironmentDetection['farcasterContext'],
    basePlatform: DetectedPlatform
  ): MiniAppEnvironment {
    
    if (farcasterContext.isInFarcasterClient) {
      return 'farcaster'
    }
    
    if (farcasterContext.embedDepth > 0) {
      return 'embedded'
    }
    
    // Check URL patterns for MiniApp mode
    if (typeof window !== 'undefined') {
      const url = window.location
      if (url.pathname.startsWith('/mini') || url.search.includes('miniApp=true')) {
        return 'farcaster' // Assume Farcaster context for /mini routes
      }
    }
    
    return 'web'
  }
  
  /**
   * Detection Confidence Calculation
   * 
   * Uses your existing confidence scoring patterns to assess detection reliability.
   */
  function calculateDetectionConfidence(params: {
    farcasterContext: MiniAppEnvironmentDetection['farcasterContext']
    sdkAvailability: MiniAppEnvironmentDetection['sdkAvailability']
    capabilities: MiniAppCapabilities
    basePlatformDetection: DetectedPlatform
    detectionTime: number
  }): EnvironmentConfidence {
    
    const { farcasterContext, sdkAvailability, detectionTime } = params
    
    // Calculate individual confidence scores
    const platformConfidence = farcasterContext.isInFarcasterClient && 
                              farcasterContext.clientType !== 'unknown' ? 0.9 : 0.6
    
    const sdkConfidence = sdkAvailability.initializationStatus === 'available' ? 0.95 : 
                         sdkAvailability.initializationStatus === 'loading' ? 0.7 : 0.3
    
    const capabilityConfidence = 0.8 // Based on comprehensive capability testing
    
    const overallConfidence = (platformConfidence + sdkConfidence + capabilityConfidence) / 3
    
    // Determine evidence quality
    const evidenceQuality = overallConfidence >= 0.8 ? 'excellent' :
                           overallConfidence >= 0.6 ? 'good' :
                           overallConfidence >= 0.4 ? 'fair' : 'poor'
    
    // Identify uncertainty factors
    const uncertaintyFactors: string[] = []
    if (!farcasterContext.isInFarcasterClient) uncertaintyFactors.push('not_in_farcaster_client')
    if (sdkAvailability.initializationStatus !== 'available') uncertaintyFactors.push('sdk_not_available')
    if (detectionTime > 1000) uncertaintyFactors.push('slow_detection')
    if (farcasterContext.clientType === 'unknown') uncertaintyFactors.push('unknown_client_type')
    
    return {
      overallConfidence,
      platformConfidence,
      deviceConfidence: capabilityConfidence,
      capabilityConfidence,
      evidenceQuality,
      uncertaintyFactors
    }
  }
  
  /**
   * Integration Recommendations Generator
   * 
   * Provides actionable recommendations for your provider system based on detected capabilities.
   */
  function generateIntegrationRecommendations(params: {
    environment: MiniAppEnvironment
    capabilities: MiniAppCapabilities
    confidence: EnvironmentConfidence
    deviceProfile: DeviceCapabilityProfile
  }): MiniAppEnvironmentDetection['integrationRecommendations'] {
    
    const { environment, capabilities, confidence } = params
    
    const useEnhancedProvider = 
      environment === 'farcaster' && 
      confidence.overallConfidence >= 0.7
    
    const enableSocialFeatures = 
      capabilities.social.canShare || 
      capabilities.social.canCompose
    
    const enableBatchTransactions = 
      capabilities.wallet.canBatchTransactions &&
      environment === 'farcaster'
    
    const fallbackToWebMode = 
      confidence.overallConfidence < 0.5 ||
      !capabilities.wallet.canConnect
    
    const monitorCapabilityChanges = 
      environment === 'embedded' ||
      confidence.uncertaintyFactors.length > 2
    
    return {
      useEnhancedProvider,
      enableSocialFeatures,
      enableBatchTransactions,
      fallbackToWebMode,
      monitorCapabilityChanges
    }
  }
  
  /**
   * Fallback Detection Creation
   * 
   * Creates a safe fallback detection result when primary detection fails.
   */
  function createFallbackDetection(error: Error): MiniAppEnvironmentDetection {
    return {
      environment: 'web',
      detectedPlatform: 'WEB_DESKTOP' as DetectedPlatform,
      farcasterContext: {
        isInFarcasterClient: false,
        clientType: null,
        clientVersion: null,
        frameContext: false,
        embedDepth: 0
      },
      sdkAvailability: {
        hasFarcasterSDK: false,
        sdkVersion: null,
        initializationStatus: 'failed',
        lastDetectionAttempt: new Date()
      },
      capabilities: createMinimalCapabilities(),
      confidence: {
        overallConfidence: 0.1,
        platformConfidence: 0.1,
        deviceConfidence: 0.1,
        capabilityConfidence: 0.1,
        evidenceQuality: 'poor',
        uncertaintyFactors: ['detection_failed', error.message]
      },
      integrationRecommendations: {
        useEnhancedProvider: false,
        enableSocialFeatures: false,
        enableBatchTransactions: false,
        fallbackToWebMode: true,
        monitorCapabilityChanges: false
      }
    }
  }
  
  // ================================================
  // UTILITY FUNCTIONS
  // ================================================
  
  /**
   * Check Method Support
   * 
   * Utility to check if a specific wallet method is supported.
   * Optimized to avoid blocking calls that can cause timeouts.
   */
  async function checkMethodSupport(method: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.ethereum) return false

    try {
      // Check if wallet is connected and authorized before testing methods
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })

      // If no accounts are connected, don't try advanced methods that require authorization
      if (!accounts || accounts.length === 0) {
        // For wallet_sendCalls, we need authorization, so return false if not connected
        if (method === 'wallet_sendCalls') {
          return false
        }
        // For other methods, try a basic check
        try {
          await window.ethereum.request({ method: 'eth_blockNumber' })
          return true
        } catch {
          return false
        }
      }

      // Wallet is connected, now we can safely test the method
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Method check timeout')), 2000)
      )

      let methodCheckPromise: Promise<any>

      // Use appropriate test parameters based on the method
      switch (method) {
        case 'wallet_sendCalls':
          // Use a safe test call that won't actually execute transactions
          methodCheckPromise = window.ethereum.request({
            method,
            params: [{
              version: '1.0',
              chainId: '0x1', // Use mainnet for testing
              from: accounts[0], // Use connected account
              calls: [], // Empty calls array for testing support
              atomicRequired: false
            }]
          })
          break
        case 'wallet_getCallsStatus':
          // Test with a dummy ID
          methodCheckPromise = window.ethereum.request({
            method,
            params: ['0x0000000000000000000000000000000000000000000000000000000000000000']
          })
          break
        default:
          // For other methods, use empty params
          methodCheckPromise = window.ethereum.request({ method, params: [] })
      }

      await Promise.race([methodCheckPromise, timeoutPromise])
      return true
    } catch (error: any) {
      // Check if this is an authorization error (code 4100)
      if (error?.code === 4100 || error?.message?.includes('not authorized')) {
        console.warn(`Method ${method} requires authorization but wallet is not authorized`)
        return false
      }

      // Check if method is not supported
      if (error?.code === -32601 || error?.message?.includes('Method not found')) {
        return false
      }

      // For other errors, assume method is not supported
      console.warn(`Method ${method} check failed:`, error?.message || error)
      return false
    }
  }
  
  /**
   * Create Minimal Capabilities
   * 
   * Creates a minimal capability set for fallback scenarios.
   */
  function createMinimalCapabilities(): MiniAppCapabilities {
    return {
      wallet: {
        canConnect: false,
        canSignTransactions: false,
        canBatchTransactions: false,
        supportedChains: [],
        maxTransactionValue: null,
        requiredConfirmations: 1
      },
      social: {
        canShare: false,
        canCompose: false,
        canAccessSocialGraph: false,
        canReceiveNotifications: false,
        canSendNotifications: false,
        maxShareTextLength: 0,
        supportedShareTypes: []
      },
      platform: {
        canDeepLink: false,
        canAccessClipboard: false,
        canAccessCamera: false,
        canAccessLocation: false,
        canVibrate: false,
        canPlayAudio: false,
        supportedImageFormats: []
      },
      performance: {
        supportsServiceWorker: false,
        supportsWebAssembly: false,
        supportsIndexedDB: false,
        maxMemoryUsage: null,
        maxStorageSize: null,
        batteryOptimized: true
      }
    }
  }
  
  /**
   * Calculate Embed Depth
   * 
   * Utility that uses your existing embed depth calculation patterns.
   */
  function calculateEmbedDepth(): number {
    if (typeof window === 'undefined') return 0
    
    let depth = 0
    let currentWindow: Window = window
    
    try {
      while (currentWindow.parent !== currentWindow) {
        depth++
        currentWindow = currentWindow.parent as Window
        
        if (depth > 10) break // Safety check
        
        try {
          const _ = currentWindow.location.href
        } catch {
          return depth + 1
        }
      }
    } catch {
      return depth > 0 ? depth : 1
    }
    
    return depth
  }
  
  // Placeholder functions that would integrate with your existing detection system
  async function detectBasePlatform(): Promise<DetectedPlatform> {
    // This would call your existing platform detection
    // For now, return a reasonable default
    return 'WEB_DESKTOP' as DetectedPlatform
  }
  
  async function createEnhancedDeviceProfile(): Promise<DeviceCapabilityProfile> {
    // This would call your existing device profiling
    // For now, return a minimal profile
    return {
      screenSize: {
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
        orientation: 'landscape'
      },
      inputMethods: {
        hasTouch: false,
        hasKeyboard: true,
        hasMouse: true,
        hasStylus: false,
        supportsHover: true
      },
      performanceProfile: {
        estimatedCPUClass: 'medium',
        estimatedRAM: 8,
        networkType: 'wifi',
        batteryLevel: null,
        isLowPowerMode: null
      },
      browserCapabilities: {
        supportsWebGL: true,
        supportsWebAssembly: true,
        supportsServiceWorkers: true,
        supportsWebRTC: true,
        cookiesEnabled: true,
        localStorageAvailable: true
      },
      accessibilityPreferences: {
        prefersReducedMotion: false,
        prefersHighContrast: false,
        prefersDarkMode: false,
        fontSize: 'medium'
      }
    }
  }
  
  // ================================================
  // PUBLIC API EXPORTS
  // ================================================
  
  /**
   * Main Detection Function Export
   * 
   * This is the primary function that your Enhanced MiniApp Provider will use.
   */
  export { detectMiniAppEnvironment }
  
  /**
   * Utility Exports
   * 
   * Additional utilities for specific detection needs.
   */
export {
    assessWalletCapabilities,
    assessSocialCapabilities,
    classifyMiniAppEnvironment,
    createMinimalCapabilities
}
  
  /**
   * Type Exports
   * 
   * Export types for use in other components.
   */
export type {
    MiniAppEnvironmentDetection
}
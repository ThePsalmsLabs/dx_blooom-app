/**
 * Context Detection Utilities - Component 4: Phase 1 Foundation
 * File: src/utils/context/detection.ts
 * 
 * This component provides sophisticated, multi-dimensional context detection that goes
 * far beyond simple web vs miniapp detection. It analyzes platform, device, capability,
 * and user intent dimensions to provide comprehensive environmental understanding that
 * enables optimal user experience adaptation.
 * 
 * Educational Architecture Overview:
 * Think of this system like a sophisticated environmental sensor array that doesn't just
 * detect "hot" or "cold," but understands the complete environmental context - humidity,
 * air pressure, wind patterns, seasonal factors - to enable intelligent adaptation.
 * 
 * Integration Foundation:
 * - Builds on Enhanced MiniAppProvider (Component 1) context awareness
 * - Leverages Compatibility Testing (Component 2) capability assessment  
 * - Uses Error Boundary System (Component 3) classification patterns
 * - Provides enhanced detection for Component 5 integration hooks
 * - Maintains compatibility with existing detection patterns
 * - Supports progressive enhancement across all contexts
 */

'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'

// Type definitions for strict TypeScript
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string
    type?: string
    downlink?: number
  }
  mozConnection?: {
    effectiveType?: string
    type?: string
    downlink?: number
  }
  webkitConnection?: {
    effectiveType?: string
    type?: string
    downlink?: number
  }
}

interface NavigatorWithBattery extends Navigator {
  battery?: {
    level?: number
    charging?: boolean
    chargingTime?: number
  }
}

interface WindowWithRTC extends Window {
  RTCPeerConnection?: new () => RTCPeerConnection
  mozRTCPeerConnection?: new () => RTCPeerConnection  
  webkitRTCPeerConnection?: new () => RTCPeerConnection
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

// ================================================
// COMPREHENSIVE TYPE DEFINITIONS FOR CONTEXT DETECTION
// ================================================

/**
 * Platform Types - Specific Social and Web Platforms
 * 
 * This enum helps us understand not just that we're in a social context,
 * but exactly which platform we're dealing with. Each platform has unique
 * characteristics that affect how we should optimize the user experience.
 * 
 * Think of this like knowing not just that you're in a "vehicle," but whether
 * you're in a car, truck, motorcycle, or boat - each requires different handling.
 */
export enum DetectedPlatform {
  // Web platforms - traditional browser environments
  WEB_DESKTOP = 'web_desktop',           // Full desktop browser experience
  WEB_MOBILE = 'web_mobile',             // Mobile browser with full capabilities
  WEB_TABLET = 'web_tablet',             // Tablet browser with hybrid characteristics
  
  // Social platforms - embedded social contexts
  FARCASTER = 'farcaster',               // Farcaster native app or Warpcast
  FARCASTER_WEB = 'farcaster_web',       // Farcaster through web interface
  TWITTER = 'twitter',                   // Twitter/X embedded context
  DISCORD = 'discord',                   // Discord bot or embedded app
  TELEGRAM = 'telegram',                 // Telegram mini app context
  
  // Hybrid platforms - platforms that blur traditional boundaries
  PWA = 'pwa',                          // Progressive Web App context
  WEBVIEW = 'webview',                  // Native app webview
  IFRAME = 'iframe',                    // Generic iframe embedding
  
  // Unknown or mixed contexts
  UNKNOWN = 'unknown'                   // Unable to determine specific platform
}

/**
 * Device Capability Profile
 * 
 * Rather than just knowing "mobile" or "desktop," we build a comprehensive
 * profile of what the device can actually do. This is like a doctor taking
 * vital signs - we want multiple indicators of the device's capabilities.
 */
export interface DeviceCapabilityProfile {
  // Screen and display characteristics
  readonly screenSize: {
    readonly width: number
    readonly height: number
    readonly devicePixelRatio: number
    readonly orientation: 'portrait' | 'landscape' | 'unknown'
  }
  
  // Interaction capabilities
  readonly inputMethods: {
    readonly hasTouch: boolean
    readonly hasKeyboard: boolean
    readonly hasMouse: boolean
    readonly hasStylus: boolean
    readonly supportsHover: boolean
  }
  
  // Performance and resource indicators
  readonly performanceProfile: {
    readonly estimatedCPUClass: 'low' | 'medium' | 'high' | 'unknown'
    readonly estimatedRAM: number | null              // In GB, null if unknown
    readonly networkType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown'
    readonly batteryLevel: number | null             // 0-1, null if unknown
    readonly isLowPowerMode: boolean | null          // null if unknown
  }
  
  // Browser and platform capabilities
  readonly browserCapabilities: {
    readonly supportsWebGL: boolean
    readonly supportsWebAssembly: boolean
    readonly supportsServiceWorkers: boolean
    readonly supportsWebRTC: boolean
    readonly cookiesEnabled: boolean
    readonly localStorageAvailable: boolean
  }
  
  // Accessibility and user preferences
  readonly accessibilityPreferences: {
    readonly prefersReducedMotion: boolean
    readonly prefersHighContrast: boolean
    readonly prefersDarkMode: boolean
    readonly fontSize: 'small' | 'medium' | 'large' | 'unknown'
  }
}

/**
 * Social Context Information
 * 
 * When we're in a social platform, we want to understand not just which platform,
 * but how the user is engaging with it. This helps us optimize for their current
 * mindset and usage pattern.
 */
export interface SocialContextInfo {
  readonly platform: DetectedPlatform
  readonly embedDepth: number                        // How many levels deep in embedding
  readonly referrerChain: readonly string[]         // Chain of referrers that led here
  readonly socialFeatures: {
    readonly canShare: boolean
    readonly canNotify: boolean
    readonly hasUserProfile: boolean
    readonly supportsInlinePayments: boolean
    readonly allowsExternalLinks: boolean
  }
  readonly userEngagementPattern: {
    readonly sessionType: 'casual_browse' | 'focused_task' | 'social_discovery' | 'unknown'
    readonly estimatedAttentionSpan: 'short' | 'medium' | 'long' | 'unknown'
    readonly interactionHistory: readonly string[]  // Recent interaction patterns
  }
}

/**
 * Environment Confidence Score
 * 
 * Rather than just guessing about the environment, we calculate confidence scores
 * for our detection. This is like a meteorologist giving probability percentages
 * for weather predictions - it helps us make better decisions.
 */
export interface EnvironmentConfidence {
  readonly overallConfidence: number                 // 0-1, how sure we are of our detection
  readonly platformConfidence: number               // 0-1, confidence in platform detection
  readonly deviceConfidence: number                 // 0-1, confidence in device profiling
  readonly capabilityConfidence: number             // 0-1, confidence in capability assessment
  readonly evidenceQuality: 'poor' | 'fair' | 'good' | 'excellent'
  readonly uncertaintyFactors: readonly string[]    // What factors are creating uncertainty
}

/**
 * Complete Context Detection Result
 * 
 * This is the comprehensive result that brings together all dimensions of
 * context detection. Think of this as a complete environmental report that
 * tells your application everything it needs to know to provide optimal UX.
 */
export interface CompleteContextDetection {
  readonly detectedAt: number                        // Timestamp of detection
  readonly platform: DetectedPlatform
  readonly deviceProfile: DeviceCapabilityProfile
  readonly socialContext: SocialContextInfo | null
  readonly confidence: EnvironmentConfidence
  readonly optimizationRecommendations: {
    readonly uiDensity: 'compact' | 'comfortable' | 'spacious'
    readonly animationLevel: 'minimal' | 'reduced' | 'normal' | 'enhanced'
    readonly contentStrategy: 'quick_scan' | 'detailed_read' | 'interactive_explore'
    readonly paymentOptimization: 'speed' | 'security' | 'simplicity'
    readonly socialFeatures: readonly string[]       // Which social features to enable
  }
  readonly fallbackStrategies: readonly string[]    // What to do if primary approach fails
  readonly monitoringRecommendations: readonly string[] // What to watch for changes
}

// ================================================
// PLATFORM DETECTION LOGIC
// ================================================

/**
 * Advanced Platform Detection
 * 
 * This function is like a detective examining multiple clues to determine
 * not just that a crime occurred, but exactly what type of crime and who
 * might have committed it. We examine user agents, referrers, window properties,
 * and behavioral patterns to build a comprehensive picture.
 */
function detectPlatformAdvanced(): DetectedPlatform {
  // Safety check for server-side rendering
  if (typeof window === 'undefined') {
    return DetectedPlatform.UNKNOWN
  }
  
  // Gather evidence from multiple sources
  const userAgent = navigator.userAgent.toLowerCase()
  const referrer = document.referrer.toLowerCase()
  const hostname = window.location.hostname.toLowerCase()
  const search = window.location.search.toLowerCase()
  
  // Check if we're embedded in an iframe (first clue)
  const isEmbedded = window.parent !== window
  const embedDepth = calculateEmbedDepth()
  
  // Platform-specific detection using multiple evidence sources
  
  // Farcaster Detection - Look for multiple Farcaster indicators
  const farcasterIndicators = [
    userAgent.includes('farcaster'),
    userAgent.includes('warpcast'),
    referrer.includes('farcaster'),
    referrer.includes('warpcast'),
    hostname.includes('farcaster'),
    search.includes('farcaster'),
    // Check for Farcaster-specific URL patterns
    window.location.href.includes('frame'),
    window.location.href.includes('cast'),
  ]
  const farcasterScore = farcasterIndicators.filter(Boolean).length
  
  if (farcasterScore >= 2) {
    // Distinguish between native Farcaster and web-based Farcaster
    if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
      return DetectedPlatform.FARCASTER
    } else {
      return DetectedPlatform.FARCASTER_WEB
    }
  }
  
  // Twitter/X Detection
  const twitterIndicators = [
    userAgent.includes('twitter'),
    userAgent.includes('twitterbot'),
    referrer.includes('twitter.com'),
    referrer.includes('x.com'),
    hostname.includes('twitter'),
    hostname.includes('x.com'),
  ]
  if (twitterIndicators.filter(Boolean).length >= 2) {
    return DetectedPlatform.TWITTER
  }
  
  // Discord Detection
  const discordIndicators = [
    userAgent.includes('discord'),
    referrer.includes('discord'),
    hostname.includes('discord'),
    // Discord often uses specific user agent patterns
    userAgent.includes('discordbot'),
  ]
  if (discordIndicators.filter(Boolean).length >= 2) {
    return DetectedPlatform.DISCORD
  }
  
  // Telegram Detection
  const telegramIndicators = [
    userAgent.includes('telegram'),
    referrer.includes('telegram'),
    hostname.includes('telegram'),
    // Telegram mini apps have specific patterns
    search.includes('tgWebAppPlatform'),
    window.location.href.includes('tg://'),
  ]
  if (telegramIndicators.filter(Boolean).length >= 2) {
    return DetectedPlatform.TELEGRAM
  }
  
  // PWA Detection - Progressive Web Apps have specific characteristics
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.matchMedia('(display-mode: fullscreen)').matches ||
                (window.navigator as NavigatorWithStandalone).standalone === true
  if (isPWA) {
    return DetectedPlatform.PWA
  }
  
  // WebView Detection - Native app embedded browsers
  const webViewIndicators = [
    userAgent.includes('webview'),
    userAgent.includes('version/') && userAgent.includes('mobile'),
    // iOS WebView indicators
    userAgent.includes('mobile/') && !userAgent.includes('safari/'),
    // Android WebView indicators
    userAgent.includes('android') && userAgent.includes('version/') && !userAgent.includes('chrome/'),
  ]
  if (webViewIndicators.filter(Boolean).length >= 1 && isEmbedded) {
    return DetectedPlatform.WEBVIEW
  }
  
  // Generic iframe detection
  if (isEmbedded && embedDepth >= 1) {
    return DetectedPlatform.IFRAME
  }
  
  // Traditional web platform detection
  const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
  
  if (isTablet) {
    return DetectedPlatform.WEB_TABLET
  } else if (isMobile) {
    return DetectedPlatform.WEB_MOBILE
  } else {
    return DetectedPlatform.WEB_DESKTOP
  }
}

/**
 * Calculate Embedding Depth
 * 
 * This function determines how many levels deep we are in iframe embedding.
 * This is like counting how many boxes a gift is wrapped in - each level
 * of embedding adds constraints and affects what we can do.
 */
function calculateEmbedDepth(): number {
  if (typeof window === 'undefined') return 0
  
  let depth = 0
  let currentWindow: Window = window
  
  try {
    while (currentWindow.parent !== currentWindow) {
      depth++
      currentWindow = currentWindow.parent as Window
      
      // Safety check to prevent infinite loops
      if (depth > 10) break
      
      // If we can't access the parent due to cross-origin restrictions,
      // we know we're embedded but can't determine exact depth
      try {
        // This will throw if cross-origin
        const _ = currentWindow.location.href
      } catch {
        // We're embedded but can't go deeper due to security restrictions
        return depth + 1 // Estimate one more level
      }
    }
  } catch {
    // If any error occurs, we're likely in a restricted environment
    return depth > 0 ? depth : 1
  }
  
  return depth
}

// ================================================
// DEVICE CAPABILITY PROFILING
// ================================================

/**
 * Create Device Capability Profile
 * 
 * This function is like a comprehensive medical examination that checks
 * all the vital signs and capabilities of the device. We want to understand
 * not just what type of device it is, but what it's actually capable of doing.
 */
function createDeviceCapabilityProfile(): DeviceCapabilityProfile {
  // Screen and display analysis
  const screenSize = {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' as const : 'portrait' as const
  }
  
  // Input method detection - What can the user actually do?
  const inputMethods = {
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hasKeyboard: !/android|iphone|ipad|ipod|blackberry|iemobile/i.test(navigator.userAgent),
    hasMouse: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    hasStylus: navigator.maxTouchPoints > 1, // Rough approximation
    supportsHover: window.matchMedia('(hover: hover)').matches
  }
  
  // Performance estimation - How powerful is this device?
  const performanceProfile = {
    estimatedCPUClass: estimateCPUClass(),
    estimatedRAM: estimateRAM(),
    networkType: getNetworkType(),
    batteryLevel: getBatteryLevel(),
    isLowPowerMode: isLowPowerMode()
  }
  
  // Browser capability testing - What APIs are available?
  const browserCapabilities = {
    supportsWebGL: testWebGLSupport(),
    supportsWebAssembly: testWebAssemblySupport(),
    supportsServiceWorkers: 'serviceWorker' in navigator,
    supportsWebRTC: testWebRTCSupport(),
    cookiesEnabled: navigator.cookieEnabled,
    localStorageAvailable: testLocalStorageSupport()
  }
  
  // User accessibility preferences - How does the user prefer to interact?
  const accessibilityPreferences = {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
    prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    fontSize: estimateFontSizePreference()
  }
  
  return {
    screenSize,
    inputMethods,
    performanceProfile,
    browserCapabilities,
    accessibilityPreferences
  }
}

/**
 * Estimate CPU Performance Class
 * 
 * This function is like a performance benchmark that gives us a rough idea
 * of how powerful the device is. We use multiple indicators to make an educated guess.
 */
function estimateCPUClass(): 'low' | 'medium' | 'high' | 'unknown' {
  try {
    // Use multiple indicators to estimate performance
    const indicators = []
    
    // Hardware concurrency (number of CPU cores)
    const cores = navigator.hardwareConcurrency || 1
    if (cores >= 8) indicators.push('high')
    else if (cores >= 4) indicators.push('medium')
    else indicators.push('low')
    
    // Device pixel ratio can indicate high-end devices
    const dpr = window.devicePixelRatio || 1
    if (dpr >= 3) indicators.push('high')
    else if (dpr >= 2) indicators.push('medium')
    else indicators.push('low')
    
    // Screen resolution can indicate device class
    const screenArea = window.screen.width * window.screen.height
    if (screenArea >= 2000000) indicators.push('high')      // 4K and above
    else if (screenArea >= 1000000) indicators.push('medium') // 1080p range
    else indicators.push('low')
    
    // Simple performance test - measure how fast we can do basic operations
    const startTime = performance.now()
    let iterations = 0
    const endTime = startTime + 10 // Test for 10ms
    
    while (performance.now() < endTime) {
      Math.random() * Math.random() // Simple operation
      iterations++
    }
    
    if (iterations >= 100000) indicators.push('high')
    else if (iterations >= 50000) indicators.push('medium')
    else indicators.push('low')
    
    // Count the indicators to make a decision
    const highCount = indicators.filter(i => i === 'high').length
    const mediumCount = indicators.filter(i => i === 'medium').length
    const lowCount = indicators.filter(i => i === 'low').length
    
    if (highCount >= 2) return 'high'
    if (mediumCount >= 2) return 'medium'
    if (lowCount >= 2) return 'low'
    
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Estimate Device RAM
 * 
 * This function tries to estimate how much memory the device has.
 * This is like checking how much workspace is available - it affects
 * how complex operations we can perform.
 */
function estimateRAM(): number | null {
  try {
    // Some browsers expose memory information
    const deviceMemory = (navigator as NavigatorWithMemory).deviceMemory
    if (typeof deviceMemory === 'number' && deviceMemory > 0) {
      return deviceMemory
    }
    
    // Fallback estimation based on other indicators
    const hardwareConcurrency = navigator.hardwareConcurrency || 1
    const userAgent = navigator.userAgent.toLowerCase()
    
    // High-end device indicators
    if (hardwareConcurrency >= 8 || userAgent.includes('iphone 1') || userAgent.includes('ipad')) {
      return 8 // Estimate 8GB for high-end devices
    }
    
    // Medium device indicators
    if (hardwareConcurrency >= 4) {
      return 4 // Estimate 4GB for medium devices
    }
    
    // Low-end device assumption
    return 2 // Estimate 2GB for basic devices
  } catch {
    return null
  }
}

/**
 * Get Network Connection Type
 * 
 * Understanding the network connection helps us optimize for speed vs quality.
 * This is like knowing whether you're on a highway or a country road.
 */
function getNetworkType(): 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown' {
  try {
    const navWithConnection = navigator as NavigatorWithConnection
    const connection = navWithConnection.connection || 
                      navWithConnection.mozConnection || 
                      navWithConnection.webkitConnection
    
    if (connection) {
      // Use the effective type if available
      if (connection.effectiveType) {
        const effectiveType = connection.effectiveType
        if (['slow-2g', '2g', '3g', '4g', '5g', 'wifi'].includes(effectiveType)) {
          return effectiveType as 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi'
        }
      }
      
      // Fallback to connection type
      if (connection.type === 'wifi') return 'wifi'
      if (connection.type === 'cellular') {
        // Try to determine cellular speed
        const downlink = connection.downlink || 0
        if (downlink >= 10) return '4g'
        if (downlink >= 1.5) return '3g'
        if (downlink >= 0.15) return '2g'
        return 'slow-2g'
      }
    }
    
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Get Battery Level
 * 
 * Knowing the battery level helps us decide whether to use power-intensive
 * features. This is like checking your phone battery before starting a long trip.
 */
function getBatteryLevel(): number | null {
  try {
    // Battery API is deprecated but still useful where available
    const battery = (navigator as NavigatorWithBattery).battery
    if (battery && typeof battery.level === 'number') {
      return battery.level
    }
    return null
  } catch {
    return null
  }
}

/**
 * Detect Low Power Mode
 * 
 * Low power mode affects how we should behave - we want to be more conservative
 * with animations, background processes, and resource usage.
 */
function isLowPowerMode(): boolean | null {
  try {
    // Some browsers/devices provide power mode information
    const battery = (navigator as NavigatorWithBattery).battery
    if (battery && typeof battery.chargingTime !== 'undefined') {
      // Heuristic: if battery is low and not charging, assume low power mode might be on
      return (battery.level ?? 1) < 0.2 && !battery.charging
    }
    
    // Check for reduced motion preference as a proxy for power saving
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return null
  }
}

/**
 * Test WebGL Support
 * 
 * WebGL support indicates whether we can use hardware-accelerated graphics.
 * This affects what kind of visual enhancements we can provide.
 */
function testWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!context
  } catch {
    return false
  }
}

/**
 * Test WebAssembly Support
 * 
 * WebAssembly support indicates whether we can use high-performance compiled code.
 * This affects what advanced features we can offer.
 */
function testWebAssemblySupport(): boolean {
  try {
    return typeof WebAssembly === 'object' && 
           typeof WebAssembly.instantiate === 'function'
  } catch {
    return false
  }
}

/**
 * Test WebRTC Support
 * 
 * WebRTC support affects whether we can offer real-time communication features.
 */
function testWebRTCSupport(): boolean {
  try {
    const windowWithRTC = window as WindowWithRTC
    return !!(windowWithRTC.RTCPeerConnection) || 
           !!(windowWithRTC.mozRTCPeerConnection) || 
           !!(windowWithRTC.webkitRTCPeerConnection)
  } catch {
    return false
  }
}

/**
 * Test Local Storage Support
 * 
 * Local storage support affects how we can cache data and maintain state.
 */
function testLocalStorageSupport(): boolean {
  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Estimate Font Size Preference
 * 
 * Understanding font size preferences helps us provide better readability.
 */
function estimateFontSizePreference(): 'small' | 'medium' | 'large' | 'unknown' {
  try {
    // Create a test element to measure default font size
    const testElement = document.createElement('div')
    testElement.style.fontSize = '1rem'
    testElement.style.position = 'absolute'
    testElement.style.visibility = 'hidden'
    testElement.innerHTML = 'M'
    
    document.body.appendChild(testElement)
    const computedStyle = window.getComputedStyle(testElement)
    const fontSize = parseFloat(computedStyle.fontSize)
    document.body.removeChild(testElement)
    
    if (fontSize >= 20) return 'large'
    if (fontSize >= 16) return 'medium'
    if (fontSize >= 12) return 'small'
    
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

// ================================================
// SOCIAL CONTEXT ANALYSIS
// ================================================

/**
 * Analyze Social Context
 * 
 * This function builds a comprehensive understanding of the social environment
 * and how the user is engaging with it. This is like understanding not just
 * that you're at a party, but what kind of party it is and how people are behaving.
 */
function analyzeSocialContext(platform: DetectedPlatform): SocialContextInfo | null {
  // Only analyze social context for social platforms
  const socialPlatforms = [
    DetectedPlatform.FARCASTER,
    DetectedPlatform.FARCASTER_WEB,
    DetectedPlatform.TWITTER,
    DetectedPlatform.DISCORD,
    DetectedPlatform.TELEGRAM,
    DetectedPlatform.IFRAME,
    DetectedPlatform.WEBVIEW
  ]
  
  if (!socialPlatforms.includes(platform)) {
    return null
  }
  
  const embedDepth = calculateEmbedDepth()
  const referrerChain = buildReferrerChain()
  
  // Analyze what social features are available
  const socialFeatures = {
    canShare: testSharingCapability(platform),
    canNotify: testNotificationCapability(platform),
    hasUserProfile: testUserProfileAccess(platform),
    supportsInlinePayments: testInlinePaymentSupport(platform),
    allowsExternalLinks: testExternalLinkSupport(platform)
  }
  
  // Analyze user engagement patterns
  const userEngagementPattern = {
    sessionType: analyzeSessionType(platform, embedDepth),
    estimatedAttentionSpan: estimateAttentionSpan(platform),
    interactionHistory: gatherInteractionHistory()
  }
  
  return {
    platform,
    embedDepth,
    referrerChain,
    socialFeatures,
    userEngagementPattern
  }
}

/**
 * Build Referrer Chain
 * 
 * This function traces how the user got to our application. This is like
 * following a trail of breadcrumbs to understand the user's journey.
 */
function buildReferrerChain(): readonly string[] {
  const chain: string[] = []
  
  try {
    // Add the immediate referrer
    if (document.referrer) {
      chain.push(new URL(document.referrer).hostname)
    }
    
    // Check for additional referrer information in URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    const ref = urlParams.get('ref')
    const from = urlParams.get('from')
    
    if (utmSource) chain.push(`utm:${utmSource}`)
    if (ref) chain.push(`ref:${ref}`)
    if (from) chain.push(`from:${from}`)
    
    // Check for social platform specific parameters
    if (urlParams.has('farcaster_frame')) chain.push('farcaster_frame')
    if (urlParams.has('twitter_card')) chain.push('twitter_card')
    
  } catch (error) {
    // Silently handle errors in referrer analysis
    console.debug('Error building referrer chain:', error)
  }
  
  return chain
}

/**
 * Test Sharing Capability
 * 
 * This function determines whether we can trigger sharing actions in the current platform.
 */
function testSharingCapability(platform: DetectedPlatform): boolean {
  // Different platforms have different sharing capabilities
  switch (platform) {
    case DetectedPlatform.FARCASTER:
    case DetectedPlatform.FARCASTER_WEB:
      // Farcaster has native sharing through SDK
      return typeof window !== 'undefined' && 'sdk' in window
      
    case DetectedPlatform.TWITTER:
      // Twitter allows sharing through web intents
      return true
      
    case DetectedPlatform.TELEGRAM:
      // Telegram has sharing APIs for mini apps
      return typeof window !== 'undefined' && 'Telegram' in window
      
    case DetectedPlatform.PWA:
    case DetectedPlatform.WEB_MOBILE:
      // Web Share API available on some mobile browsers
      return 'share' in navigator
      
    default:
      // Default to clipboard sharing
      return 'clipboard' in navigator
  }
}

/**
 * Test Notification Capability
 * 
 * This function determines whether we can send notifications in the current environment.
 */
function testNotificationCapability(platform: DetectedPlatform): boolean {
  try {
    // Check for basic notification support
    if (!('Notification' in window)) return false
    
    // Platform-specific notification capabilities
    switch (platform) {
      case DetectedPlatform.FARCASTER:
      case DetectedPlatform.FARCASTER_WEB:
        // Farcaster may have in-app notification systems
        return true
        
      case DetectedPlatform.PWA:
        // PWAs can use push notifications
        return 'serviceWorker' in navigator
        
      case DetectedPlatform.WEB_DESKTOP:
      case DetectedPlatform.WEB_MOBILE:
        // Web notifications require permission
        return Notification.permission !== 'denied'
        
      default:
        return false
    }
  } catch {
    return false
  }
}

/**
 * Test User Profile Access
 * 
 * This function determines whether we can access social user profile information.
 */
function testUserProfileAccess(platform: DetectedPlatform): boolean {
  switch (platform) {
    case DetectedPlatform.FARCASTER:
    case DetectedPlatform.FARCASTER_WEB:
      // Farcaster SDK provides user context
      return typeof window !== 'undefined' && 'sdk' in window
      
    case DetectedPlatform.TELEGRAM:
      // Telegram mini apps provide user data
      return typeof window !== 'undefined' && 'Telegram' in window
      
    default:
      return false
  }
}

/**
 * Test Inline Payment Support
 * 
 * This function determines whether the platform supports inline payment processing.
 */
function testInlinePaymentSupport(platform: DetectedPlatform): boolean {
  switch (platform) {
    case DetectedPlatform.FARCASTER:
    case DetectedPlatform.FARCASTER_WEB:
      // Farcaster supports Web3 payments
      return true
      
    case DetectedPlatform.TELEGRAM:
      // Telegram has payment APIs for mini apps
      return typeof window !== 'undefined' && 'Telegram' in window
      
    case DetectedPlatform.WEB_DESKTOP:
    case DetectedPlatform.WEB_MOBILE:
      // Web supports payment request API and Web3 wallets
      return true
      
    default:
      return false
  }
}

/**
 * Test External Link Support
 * 
 * This function determines whether the platform allows opening external links.
 */
function testExternalLinkSupport(platform: DetectedPlatform): boolean {
  switch (platform) {
    case DetectedPlatform.IFRAME:
    case DetectedPlatform.WEBVIEW:
      // Embedded contexts may restrict external links
      return false
      
    case DetectedPlatform.TELEGRAM:
      // Telegram mini apps have restrictions on external links
      return false
      
    default:
      return true
  }
}

/**
 * Analyze Session Type
 * 
 * This function tries to understand what type of session the user is having.
 * This helps us optimize the interface for their current mindset.
 */
function analyzeSessionType(
  platform: DetectedPlatform, 
  embedDepth: number
): 'casual_browse' | 'focused_task' | 'social_discovery' | 'unknown' {
  
  // Deep embedding often indicates casual browsing
  if (embedDepth >= 2) return 'casual_browse'
  
  // Social platforms often indicate social discovery
  const socialPlatforms = [
    DetectedPlatform.FARCASTER,
    DetectedPlatform.FARCASTER_WEB,
    DetectedPlatform.TWITTER
  ]
  if (socialPlatforms.includes(platform)) return 'social_discovery'
  
  // Direct web access might indicate focused task
  if (platform === DetectedPlatform.WEB_DESKTOP) return 'focused_task'
  
  // Mobile web often indicates casual browsing
  if (platform === DetectedPlatform.WEB_MOBILE) return 'casual_browse'
  
  return 'unknown'
}

/**
 * Estimate Attention Span
 * 
 * This function estimates how long the user is likely to focus on tasks.
 * This affects how we structure interactions and information presentation.
 */
function estimateAttentionSpan(platform: DetectedPlatform): 'short' | 'medium' | 'long' | 'unknown' {
  switch (platform) {
    case DetectedPlatform.FARCASTER:
    case DetectedPlatform.TWITTER:
      // Social media contexts typically have shorter attention spans
      return 'short'
      
    case DetectedPlatform.WEB_DESKTOP:
      // Desktop web often allows for longer focus
      return 'long'
      
    case DetectedPlatform.WEB_MOBILE:
    case DetectedPlatform.WEB_TABLET:
      // Mobile contexts typically have medium attention spans
      return 'medium'
      
    case DetectedPlatform.IFRAME:
    case DetectedPlatform.WEBVIEW:
      // Embedded contexts often indicate brief interactions
      return 'short'
      
    default:
      return 'unknown'
  }
}

/**
 * Gather Interaction History
 * 
 * This function looks at recent user interactions to understand patterns.
 */
function gatherInteractionHistory(): readonly string[] {
  const history: string[] = []
  
  try {
    // Check for recent navigation
    if (document.referrer) {
      history.push('external_navigation')
    }
    
    // Check for URL parameters that indicate interaction type
    const params = new URLSearchParams(window.location.search)
    if (params.has('share')) history.push('shared_content')
    if (params.has('purchase')) history.push('purchase_intent')
    if (params.has('browse')) history.push('browsing_intent')
    
    // Check for recent page visibility changes (indicating multitasking)
    if (document.visibilityState === 'visible') {
      history.push('focused_attention')
    }
    
  } catch (error) {
    console.debug('Error gathering interaction history:', error)
  }
  
  return history
}

// ================================================
// CONFIDENCE CALCULATION AND OPTIMIZATION
// ================================================

/**
 * Calculate Detection Confidence
 * 
 * This function evaluates how confident we are in our detection results.
 * This is like a scientist evaluating the quality of their experimental data.
 */
function calculateDetectionConfidence(
  platform: DetectedPlatform,
  deviceProfile: DeviceCapabilityProfile,
  socialContext: SocialContextInfo | null
): EnvironmentConfidence {
  
  let overallConfidence = 1.0
  let platformConfidence = 1.0
  let deviceConfidence = 1.0
  let capabilityConfidence = 1.0
  const uncertaintyFactors: string[] = []
  
  // Evaluate platform detection confidence
  if (platform === DetectedPlatform.UNKNOWN) {
    platformConfidence = 0.0
    uncertaintyFactors.push('Unable to identify platform')
  } else if (platform === DetectedPlatform.IFRAME) {
    platformConfidence = 0.6
    uncertaintyFactors.push('Generic iframe context detected')
  }
  
  // Evaluate device profile confidence
  if (deviceProfile.performanceProfile.estimatedCPUClass === 'unknown') {
    deviceConfidence -= 0.2
    uncertaintyFactors.push('CPU performance unclear')
  }
  
  if (deviceProfile.performanceProfile.networkType === 'unknown') {
    deviceConfidence -= 0.1
    uncertaintyFactors.push('Network conditions unclear')
  }
  
  // Evaluate capability confidence
  if (!deviceProfile.browserCapabilities.supportsWebGL && 
      !deviceProfile.browserCapabilities.supportsWebAssembly) {
    capabilityConfidence -= 0.2
    uncertaintyFactors.push('Limited advanced web capabilities')
  }
  
  // Social context affects confidence
  if (socialContext && socialContext.embedDepth > 3) {
    capabilityConfidence -= 0.1
    uncertaintyFactors.push('Deep embedding may limit capabilities')
  }
  
  // Calculate overall confidence
  overallConfidence = (platformConfidence + deviceConfidence + capabilityConfidence) / 3
  
  // Determine evidence quality
  let evidenceQuality: 'poor' | 'fair' | 'good' | 'excellent'
  if (overallConfidence >= 0.9) evidenceQuality = 'excellent'
  else if (overallConfidence >= 0.7) evidenceQuality = 'good'
  else if (overallConfidence >= 0.5) evidenceQuality = 'fair'
  else evidenceQuality = 'poor'
  
  return {
    overallConfidence,
    platformConfidence,
    deviceConfidence,
    capabilityConfidence,
    evidenceQuality,
    uncertaintyFactors
  }
}

/**
 * Generate Optimization Recommendations
 * 
 * This function uses all the context information to recommend how the
 * application should optimize its behavior for the current environment.
 */
function generateOptimizationRecommendations(
  platform: DetectedPlatform,
  deviceProfile: DeviceCapabilityProfile,
  socialContext: SocialContextInfo | null,
  confidence: EnvironmentConfidence
): CompleteContextDetection['optimizationRecommendations'] {
  
  // UI Density Recommendation
  let uiDensity: 'compact' | 'comfortable' | 'spacious'
  if (deviceProfile.screenSize.width < 480 || platform === DetectedPlatform.FARCASTER) {
    uiDensity = 'compact'
  } else if (deviceProfile.screenSize.width > 1200) {
    uiDensity = 'spacious'
  } else {
    uiDensity = 'comfortable'
  }
  
  // Animation Level Recommendation
  let animationLevel: 'minimal' | 'reduced' | 'normal' | 'enhanced'
  if (deviceProfile.accessibilityPreferences.prefersReducedMotion ||
      deviceProfile.performanceProfile.estimatedCPUClass === 'low') {
    animationLevel = 'minimal'
  } else if (deviceProfile.performanceProfile.isLowPowerMode) {
    animationLevel = 'reduced'
  } else if (deviceProfile.performanceProfile.estimatedCPUClass === 'high' &&
             deviceProfile.browserCapabilities.supportsWebGL) {
    animationLevel = 'enhanced'
  } else {
    animationLevel = 'normal'
  }
  
  // Content Strategy Recommendation
  let contentStrategy: 'quick_scan' | 'detailed_read' | 'interactive_explore'
  if (socialContext?.userEngagementPattern.estimatedAttentionSpan === 'short') {
    contentStrategy = 'quick_scan'
  } else if (platform === DetectedPlatform.WEB_DESKTOP) {
    contentStrategy = 'interactive_explore'
  } else {
    contentStrategy = 'detailed_read'
  }
  
  // Payment Optimization Recommendation
  let paymentOptimization: 'speed' | 'security' | 'simplicity'
  if (socialContext?.userEngagementPattern.sessionType === 'casual_browse') {
    paymentOptimization = 'speed'
  } else if (platform === DetectedPlatform.WEB_DESKTOP) {
    paymentOptimization = 'security'
  } else {
    paymentOptimization = 'simplicity'
  }
  
  // Social Features Recommendation
  const socialFeatures: string[] = []
  if (socialContext?.socialFeatures.canShare) socialFeatures.push('sharing')
  if (socialContext?.socialFeatures.hasUserProfile) socialFeatures.push('profile_integration')
  if (socialContext?.socialFeatures.canNotify) socialFeatures.push('notifications')
  if (platform === DetectedPlatform.FARCASTER) socialFeatures.push('farcaster_native')
  
  return {
    uiDensity,
    animationLevel,
    contentStrategy,
    paymentOptimization,
    socialFeatures
  }
}

// ================================================
// MAIN CONTEXT DETECTION FUNCTION
// ================================================

/**
 * Perform Complete Context Detection
 * 
 * This is the main function that brings together all the detection logic
 * to provide a comprehensive understanding of the current environment.
 * Think of this as a master diagnostician who coordinates all the specialists
 * to provide a complete health assessment.
 */
export function performCompleteContextDetection(): CompleteContextDetection {
  const detectedAt = Date.now()
  
  // Step 1: Detect the platform
  const platform = detectPlatformAdvanced()
  
  // Step 2: Profile the device capabilities
  const deviceProfile = createDeviceCapabilityProfile()
  
  // Step 3: Analyze social context if applicable
  const socialContext = analyzeSocialContext(platform)
  
  // Step 4: Calculate our confidence in the detection
  const confidence = calculateDetectionConfidence(platform, deviceProfile, socialContext)
  
  // Step 5: Generate optimization recommendations
  const optimizationRecommendations = generateOptimizationRecommendations(
    platform, deviceProfile, socialContext, confidence
  )
  
  // Step 6: Generate fallback strategies based on uncertainty
  const fallbackStrategies: string[] = []
  if (confidence.overallConfidence < 0.7) {
    fallbackStrategies.push('Use conservative feature detection')
    fallbackStrategies.push('Provide manual override options')
  }
  if (platform === DetectedPlatform.UNKNOWN) {
    fallbackStrategies.push('Default to web interface with progressive enhancement')
  }
  if (deviceProfile.performanceProfile.estimatedCPUClass === 'unknown') {
    fallbackStrategies.push('Start with lightweight UI and upgrade based on performance')
  }
  
  // Step 7: Generate monitoring recommendations
  const monitoringRecommendations: string[] = []
  if (socialContext?.embedDepth && socialContext.embedDepth > 1) {
    monitoringRecommendations.push('Monitor for iframe resize events')
  }
  if (deviceProfile.performanceProfile.networkType !== 'wifi') {
    monitoringRecommendations.push('Monitor network performance and adapt')
  }
  if (confidence.evidenceQuality === 'poor') {
    monitoringRecommendations.push('Continuously validate environment assumptions')
  }
  
  return {
    detectedAt,
    platform,
    deviceProfile,
    socialContext,
    confidence,
    optimizationRecommendations,
    fallbackStrategies,
    monitoringRecommendations
  }
}

// ================================================
// REACT HOOKS FOR CONTEXT DETECTION
// ================================================

/**
 * React Hook: useContextDetection
 * 
 * This hook provides real-time context detection that updates when the
 * environment changes. It's like having a continuous monitoring system
 * that alerts you when conditions change.
 */
export function useContextDetection() {
  const [contextData, setContextData] = useState<CompleteContextDetection | null>(null)
  const [isDetecting, setIsDetecting] = useState(true)
  const detectionRef = useRef<CompleteContextDetection | null>(null)
  
  // Perform initial detection
  useEffect(() => {
    const runDetection = () => {
      setIsDetecting(true)
      try {
        const detection = performCompleteContextDetection()
        detectionRef.current = detection
        setContextData(detection)
      } catch (error) {
        console.error('Context detection failed:', error)
        // Provide minimal fallback context
        const fallbackContext: CompleteContextDetection = {
          detectedAt: Date.now(),
          platform: DetectedPlatform.UNKNOWN,
          deviceProfile: createDeviceCapabilityProfile(),
          socialContext: null,
          confidence: {
            overallConfidence: 0.1,
            platformConfidence: 0.0,
            deviceConfidence: 0.5,
            capabilityConfidence: 0.5,
            evidenceQuality: 'poor',
            uncertaintyFactors: ['Detection system error']
          },
          optimizationRecommendations: {
            uiDensity: 'comfortable',
            animationLevel: 'normal',
            contentStrategy: 'detailed_read',
            paymentOptimization: 'simplicity',
            socialFeatures: []
          },
          fallbackStrategies: ['Use default web interface'],
          monitoringRecommendations: ['Re-run detection when possible']
        }
        setContextData(fallbackContext)
      } finally {
        setIsDetecting(false)
      }
    }
    
    runDetection()
  }, [])
  
  // Monitor for environment changes
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout
    let lastDetectionTime = 0
    const MIN_DETECTION_INTERVAL = 1000 // Minimum 1 second between detections
    
    const handleResize = () => {
      // Debounce resize events and prevent rapid re-detections
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        const now = Date.now()
        if (now - lastDetectionTime < MIN_DETECTION_INTERVAL) {
          return // Skip if too soon since last detection
        }
        
        // Re-detect when window size changes significantly
        if (detectionRef.current) {
          const oldWidth = detectionRef.current.deviceProfile.screenSize.width
          const newWidth = window.innerWidth
          const changePercentage = Math.abs(newWidth - oldWidth) / oldWidth
          
          if (changePercentage > 0.2) {
            // Significant size change, re-detect
            const newDetection = performCompleteContextDetection()
            detectionRef.current = newDetection
            setContextData(newDetection)
            lastDetectionTime = now
          }
        }
      }, 250) // 250ms debounce
    }
    
    const handleVisibilityChange = () => {
      // Re-detect when page becomes visible (user might have switched contexts)
      if (document.visibilityState === 'visible' && detectionRef.current) {
        const timeSinceLastDetection = Date.now() - detectionRef.current.detectedAt
        if (timeSinceLastDetection > 300000) { // 5 minutes
          const newDetection = performCompleteContextDetection()
          detectionRef.current = newDetection
          setContextData(newDetection)
        }
      }
    }
    
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  // Re-detection function for manual triggering
  const redetect = useCallback(() => {
    const newDetection = performCompleteContextDetection()
    detectionRef.current = newDetection
    setContextData(newDetection)
  }, [])
  
  return {
    contextData,
    isDetecting,
    redetect,
    isReady: contextData !== null
  }
}

/**
 * React Hook: useOptimizationRecommendations
 * 
 * This hook provides easy access to optimization recommendations
 * without needing to use the full context detection.
 */
export function useOptimizationRecommendations() {
  const { contextData } = useContextDetection()
  
  return useMemo(() => {
    if (!contextData) {
      // Default recommendations while detection is running
      return {
        uiDensity: 'comfortable' as const,
        animationLevel: 'normal' as const,
        contentStrategy: 'detailed_read' as const,
        paymentOptimization: 'simplicity' as const,
        socialFeatures: [] as readonly string[]
      }
    }
    
    return contextData.optimizationRecommendations
  }, [contextData])
}

/**
 * React Hook: usePlatformAdaptation
 * 
 * This hook provides platform-specific adaptation utilities.
 */
export function usePlatformAdaptation() {
  const { contextData } = useContextDetection()
  
  return useMemo(() => {
    if (!contextData) {
      return {
        isSocialPlatform: false,
        isMobileContext: false,
        supportsAdvancedFeatures: false,
        recommendedUIStyle: 'web' as const
      }
    }
    
    const isSocialPlatform = [
      DetectedPlatform.FARCASTER,
      DetectedPlatform.FARCASTER_WEB,
      DetectedPlatform.TWITTER,
      DetectedPlatform.DISCORD,
      DetectedPlatform.TELEGRAM
    ].includes(contextData.platform)
    
    const isMobileContext = [
      DetectedPlatform.WEB_MOBILE,
      DetectedPlatform.FARCASTER,
      DetectedPlatform.WEBVIEW
    ].includes(contextData.platform)
    
    const supportsAdvancedFeatures = contextData.confidence.overallConfidence > 0.7 &&
      contextData.deviceProfile.performanceProfile.estimatedCPUClass !== 'low'
    
    const recommendedUIStyle = isSocialPlatform ? 'social' : 
                              isMobileContext ? 'mobile' : 'web'
    
    return {
      isSocialPlatform,
      isMobileContext,
      supportsAdvancedFeatures,
      recommendedUIStyle
    }
  }, [contextData])
}

export default performCompleteContextDetection
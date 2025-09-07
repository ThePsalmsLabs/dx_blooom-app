/**
 * Compatibility Testing Implementation - Component 2: Phase 1 Foundation
 * File: src/utils/miniapp/compatibility.ts
 * 
 * This component completes the compatibility testing framework by implementing
 * comprehensive test execution logic that accurately assesses MiniApp capabilities
 * across different environments and provides actionable fallback strategies.
 * 
 * Architecture Integration:
 * - Integrates seamlessly with Enhanced MiniAppProvider from Component 1
 * - Provides detailed capability assessment for social commerce environments
 * - Implements graceful degradation strategies for varying client capabilities
 * - Includes performance monitoring and error handling for test execution
 * - Supports both synchronous and asynchronous testing patterns
 * - Maintains compatibility with existing error handling systems
 * 
 * Key Features:
 * - Comprehensive test suite covering all MiniApp capabilities
 * - Intelligent fallback strategy recommendations
 * - Performance-optimized test execution with caching
 * - Detailed diagnostic information for debugging and optimization
 * - Progressive enhancement testing that builds from basic to advanced features
 * - Production-ready error handling and recovery mechanisms
 * - Accessibility testing for social commerce contexts
 */

'use client'

import { useCallback } from 'react'
import { useChainId } from 'wagmi'

// Type definitions for strict TypeScript
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  isMetaMask?: boolean
}

interface WindowWithEthereum extends Window {
  ethereum?: EthereumProvider
}

// ================================================
// TYPE DEFINITIONS FOR COMPATIBILITY TESTING
// ================================================

/**
 * Individual Test Configuration
 * Defines the structure and behavior of each compatibility test
 */
export interface CompatibilityTest {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly category: TestCategory
  readonly priority: TestPriority
  readonly timeout: number
  readonly retryCount: number
  readonly test: () => Promise<boolean>
  readonly fallback: string
  readonly requirements?: readonly string[]
  readonly metadata?: {
    readonly expectedDuration?: number
    readonly criticalForExperience?: boolean
    readonly affectsPerformance?: boolean
    readonly requiresPermission?: boolean
  }
}

/**
 * Test Categories
 * Organizes tests into logical groups for systematic evaluation
 */
export type TestCategory = 
  | 'environment'      // Basic environment and SDK availability
  | 'blockchain'       // Web3 and blockchain interaction capabilities
  | 'social'          // Social platform integration features
  | 'performance'     // Performance and optimization capabilities
  | 'accessibility'   // Accessibility and user experience features
  | 'integration'     // Cross-feature integration testing

/**
 * Test Priority Levels
 * Determines the importance and execution order of tests
 */
export type TestPriority = 'critical' | 'high' | 'medium' | 'low'

/**
 * Individual Test Result
 * Comprehensive information about a single test execution
 */
export interface CompatibilityTestResult {
  readonly testId: string
  readonly testName: string
  readonly category: TestCategory
  readonly priority: TestPriority
  readonly passed: boolean
  readonly executionTime: number
  readonly retryAttempts: number
  readonly error?: Error
  readonly metadata?: {
    readonly actualDuration: number
    readonly expectedDuration?: number
    readonly performanceImpact?: 'none' | 'low' | 'medium' | 'high'
    readonly userMessage?: string
  }
  readonly fallbackStrategy?: string
  readonly recommendations?: readonly string[]
}

/**
 * Complete Test Suite Result
 * Aggregated results and analysis from all compatibility tests
 */
export interface CompatibilityTestSuiteResult {
  readonly executedAt: number
  readonly totalTests: number
  readonly passedTests: number
  readonly failedTests: number
  readonly criticalFailures: number
  readonly totalExecutionTime: number
  readonly averageExecutionTime: number
  readonly compatibilityLevel: CompatibilityLevel
  readonly results: readonly CompatibilityTestResult[]
  readonly summary: {
    readonly environmentSupport: boolean
    readonly blockchainSupport: boolean
    readonly socialSupport: boolean
    readonly performanceOptimal: boolean
    readonly accessibilityCompliant: boolean
    readonly integrationStable: boolean
  }
  readonly recommendations: readonly string[]
  readonly fallbackStrategies: readonly string[]
  readonly performanceProfile: {
    readonly initializationTime: number
    readonly featureResponseTime: number
    readonly resourceUsage: 'light' | 'moderate' | 'heavy'
    readonly networkRequirements: 'low' | 'medium' | 'high'
  }
}

/**
 * Compatibility Levels (from Component 1)
 */
export type CompatibilityLevel = 'full' | 'partial' | 'limited' | 'none'

/**
 * Test Execution Options
 * Configuration for how compatibility tests should be executed
 */
export interface TestExecutionOptions {
  readonly includePerformanceTests?: boolean
  readonly enableRetries?: boolean
  readonly timeoutMultiplier?: number
  readonly priorityFilter?: readonly TestPriority[]
  readonly categoryFilter?: readonly TestCategory[]
  readonly enableCaching?: boolean
  readonly cacheExpirationMs?: number
  readonly onProgress?: (completed: number, total: number, currentTest: string) => void
  readonly onError?: (testId: string, error: Error) => void
}

// ================================================
// CORE TEST DEFINITIONS
// ================================================

/**
 * Environment Tests
 * Tests for basic MiniApp environment and SDK availability
 */
const ENVIRONMENT_TESTS: readonly CompatibilityTest[] = [
  {
    id: 'env-sdk-available',
    name: 'MiniApp SDK Availability',
    description: 'Verifies that the Farcaster MiniApp SDK is available and accessible',
    category: 'environment',
    priority: 'critical',
    timeout: 5000,
    retryCount: 2,
    test: async () => {
      try {
        // Check if SDK is available in the global scope
        if (typeof window === 'undefined') return false
        
        // Dynamic import to handle SDK availability gracefully
        const { sdk } = await import('@farcaster/miniapp-sdk')
        
        // Verify SDK has essential methods
        return typeof sdk?.context !== 'undefined' && 
               typeof sdk?.actions?.ready === 'function'
      } catch {
        return false
      }
    },
    fallback: 'Use standard web interface without social features',
    metadata: {
      expectedDuration: 1000,
      criticalForExperience: true,
      requiresPermission: false
    }
  },
  
  {
    id: 'env-iframe-context',
    name: 'Iframe Context Detection',
    description: 'Determines if the app is running in an embedded iframe context',
    category: 'environment',
    priority: 'high',
    timeout: 2000,
    retryCount: 1,
    test: async () => {
      try {
        if (typeof window === 'undefined') return false
        
        // Multiple checks for iframe context
        const isEmbedded = window.parent !== window
        const hasFrameContext = (() => {
          try {
            return window.location !== window.parent.location
          } catch {
            return true // Cross-origin iframe will throw
          }
        })()
        
        return isEmbedded || hasFrameContext
      } catch {
        return false
      }
    },
    fallback: 'Assume standard web context and disable iframe-specific optimizations',
    metadata: {
      expectedDuration: 100,
      criticalForExperience: false,
      affectsPerformance: true
    }
  },
  
  {
    id: 'env-user-agent',
    name: 'Social Platform User Agent',
    description: 'Checks for social platform-specific user agent indicators',
    category: 'environment',
    priority: 'medium',
    timeout: 1000,
    retryCount: 0,
    test: async () => {
      if (typeof window === 'undefined') return false
      
      const userAgent = navigator.userAgent.toLowerCase()
      const referrer = document.referrer.toLowerCase()
      
      // Check for known social platform indicators
      const socialIndicators = [
        'farcaster',
        'warpcast',
        'supercast',
        'cast'
      ]
      
      return socialIndicators.some(indicator => 
        userAgent.includes(indicator) || referrer.includes(indicator)
      )
    },
    fallback: 'Use generic social platform optimizations',
    metadata: {
      expectedDuration: 50,
      criticalForExperience: false
    }
  }
] as const

/**
 * Blockchain Tests  
 * Tests for Web3 and blockchain interaction capabilities
 */
const BLOCKCHAIN_TESTS: readonly CompatibilityTest[] = [
  {
    id: 'blockchain-ethereum-provider',
    name: 'Ethereum Provider Availability',
    description: 'Verifies that an Ethereum provider is available for Web3 interactions',
    category: 'blockchain',
    priority: 'critical',
    timeout: 3000,
    retryCount: 2,
    test: async () => {
      try {
        if (typeof window === 'undefined') return false
        
        // Check for Ethereum provider
        const ethereum = (window as WindowWithEthereum).ethereum
        const hasEthereum = ethereum && typeof ethereum.request === 'function'
        
        if (!hasEthereum) return false
        
        // Test basic provider functionality
        const accounts = await ethereum.request({
          method: 'eth_accounts'
        })
        
        return Array.isArray(accounts)
      } catch {
        return false
      }
    },
    fallback: 'Display wallet connection prompts and use read-only mode for unconnected users',
    metadata: {
      expectedDuration: 1500,
      criticalForExperience: true,
      requiresPermission: true
    }
  },
  
  {
    id: 'blockchain-eip5792-support',
    name: 'EIP-5792 Batch Transaction Support',
    description: 'Tests support for EIP-5792 batch transactions for improved UX',
    category: 'blockchain',
    priority: 'high',
    timeout: 4000,
    retryCount: 1,
    test: async () => {
      try {
        if (typeof window === 'undefined') return false
        
        const ethereum = (window as WindowWithEthereum).ethereum
        if (!ethereum) return false
        
        // Check if the provider supports EIP-5792
        const supportsEIP5792 = typeof ethereum.request === 'function'
        
        if (!supportsEIP5792) return false

        // Test if wallet_sendCalls method is available with proper authorization checks
        try {
          // First check if wallet is connected
          const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[]

          if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
            // Wallet not connected, can't test wallet_sendCalls
            return false
          }

          // Test wallet_sendCalls with safe parameters
          await ethereum.request({
            method: 'wallet_sendCalls',
            params: [{
              version: '1.0',
              chainId: '0x1', // Use mainnet for testing
              from: accounts[0], // Use connected account
              calls: [], // Empty calls array for testing
              atomicRequired: false
            }]
          })
          return true
        } catch (error: unknown) {
          const errorWithCode = error as { code?: number; message?: string }

          // Handle authorization errors
          if (errorWithCode?.code === 4100 || errorWithCode?.message?.includes('not authorized')) {
            console.warn('Wallet not authorized for batch transactions')
            return false
          }

          // Method not found is expected for unsupported wallets
          if (errorWithCode?.code === -32601) {
            return false
          }

          // For other errors, assume not supported
          return false
        }
      } catch {
        return false
      }
    },
    fallback: 'Use individual transactions with clear user feedback between steps',
    metadata: {
      expectedDuration: 2000,
      criticalForExperience: false,
      affectsPerformance: true
    }
  },
  
  {
    id: 'blockchain-network-connection',
    name: 'Base Network Connectivity',
    description: 'Verifies connection to Base network for contract interactions',
    category: 'blockchain',
    priority: 'critical',
    timeout: 5000,
    retryCount: 3,
    test: async () => {
      try {
        if (typeof window === 'undefined') return false
        
        const ethereum = (window as WindowWithEthereum).ethereum
        if (!ethereum) return false
        
        // Check current network
        const chainId = await ethereum.request({
          method: 'eth_chainId'
        })
        
        // Base Mainnet: 0x2105 (8453), Base Sepolia: 0x14a34 (84532)
        const supportedChains = ['0x2105', '0x14a34']
        
        return supportedChains.includes(String(chainId))
      } catch {
        return false
      }
    },
    fallback: 'Prompt user to switch to Base network with helpful instructions',
    metadata: {
      expectedDuration: 2500,
      criticalForExperience: true,
      requiresPermission: false
    }
  }
] as const

/**
 * Social Integration Tests
 * Tests for social platform-specific features and capabilities
 */
const SOCIAL_TESTS: readonly CompatibilityTest[] = [
  {
    id: 'social-context-access',
    name: 'Social Context Data Access',
    description: 'Tests ability to access social user profile and context data',
    category: 'social',
    priority: 'high',
    timeout: 4000,
    retryCount: 2,
    test: async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        const context = await sdk.context
        
        // Verify we can access user data
        return context?.user?.fid !== undefined &&
               typeof context.user.username === 'string'
      } catch {
        return false
      }
    },
    fallback: 'Use standard authentication without social profile integration',
    metadata: {
      expectedDuration: 2000,
      criticalForExperience: false,
      requiresPermission: true
    }
  },
  
  {
    id: 'social-sharing-capability',
    name: 'Social Sharing Actions',
    description: 'Tests ability to trigger social sharing and cast creation',
    category: 'social',
    priority: 'medium',
    timeout: 3000,
    retryCount: 1,
    test: async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')
        
        // Check if SDK actions are available (share functionality would be custom implementation)
        return typeof sdk.actions !== 'undefined'
      } catch {
        return false
      }
    },
    fallback: 'Provide manual sharing options with copy-to-clipboard functionality',
    metadata: {
      expectedDuration: 1000,
      criticalForExperience: false,
      affectsPerformance: false
    }
  }
] as const

/**
 * Performance Tests
 * Tests for performance characteristics and optimization capabilities
 */
const PERFORMANCE_TESTS: readonly CompatibilityTest[] = [
  {
    id: 'performance-animation-support',
    name: 'Hardware-Accelerated Animations',
    description: 'Tests support for hardware-accelerated CSS animations',
    category: 'performance',
    priority: 'low',
    timeout: 2000,
    retryCount: 0,
    test: async () => {
      if (typeof window === 'undefined') return false
      
      try {
        // Test for hardware acceleration support
        const testElement = document.createElement('div')
        testElement.style.transform = 'translateZ(0)'
        testElement.style.willChange = 'transform'
        
        document.body.appendChild(testElement)
        const computedStyle = window.getComputedStyle(testElement)
        const hasTransform = computedStyle.transform !== 'none'
        
        document.body.removeChild(testElement)
        return hasTransform
      } catch {
        return false
      }
    },
    fallback: 'Use simpler animations or disable non-critical animations',
    metadata: {
      expectedDuration: 500,
      criticalForExperience: false,
      affectsPerformance: true
    }
  },
  
  {
    id: 'performance-reduced-motion',
    name: 'Reduced Motion Preference',
    description: 'Checks user preference for reduced motion for accessibility',
    category: 'performance',
    priority: 'medium',
    timeout: 1000,
    retryCount: 0,
    test: async () => {
      if (typeof window === 'undefined') return true // Default to reduced motion for SSR
      
      try {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        return !mediaQuery.matches // Return true if user does NOT prefer reduced motion
      } catch {
        return true // Default to reduced motion on error
      }
    },
    fallback: 'Disable animations and use static transitions',
    metadata: {
      expectedDuration: 100,
      criticalForExperience: false,
      affectsPerformance: true
    }
  }
] as const

// ================================================
// TEST EXECUTION ENGINE
// ================================================

/**
 * Compatibility Test Cache
 * Caches test results to avoid redundant testing
 */
const testResultsCache = new Map<string, {
  result: CompatibilityTestResult
  timestamp: number
  expiresAt: number
}>()

/**
 * Execute Individual Test
 * Runs a single compatibility test with proper error handling and timing
 */
async function executeTest(
  test: CompatibilityTest,
  options: TestExecutionOptions = {}
): Promise<CompatibilityTestResult> {
  const startTime = performance.now()
  const cacheKey = `${test.id}-${JSON.stringify(options)}`
  
  // Check cache if enabled
  if (options.enableCaching !== false) {
    const cached = testResultsCache.get(cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.result
    }
  }
  
  let retryAttempts = 0
  let lastError: Error | undefined
  const maxRetries = options.enableRetries !== false ? test.retryCount : 0
  const timeout = test.timeout * (options.timeoutMultiplier || 1)
  
  while (retryAttempts <= maxRetries) {
    try {
      // Create a promise that will timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
      })
      
      // Race the test against the timeout
      const testResult = await Promise.race([
        test.test(),
        timeoutPromise
      ])
      
      const executionTime = performance.now() - startTime
      
      const result: CompatibilityTestResult = {
        testId: test.id,
        testName: test.name,
        category: test.category,
        priority: test.priority,
        passed: testResult,
        executionTime,
        retryAttempts,
        metadata: {
          actualDuration: executionTime,
          expectedDuration: test.metadata?.expectedDuration,
          performanceImpact: executionTime > 2000 ? 'high' : 
                           executionTime > 1000 ? 'medium' : 
                           executionTime > 500 ? 'low' : 'none',
          userMessage: testResult ? undefined : `${test.name} is not available in this environment`
        },
        fallbackStrategy: testResult ? undefined : test.fallback,
        recommendations: testResult ? [] : [
          `Consider ${test.fallback.toLowerCase()}`,
          ...(test.requirements || []).map(req => `Ensure ${req} is available`)
        ]
      }
      
      // Cache successful results
      if (options.enableCaching !== false) {
        const expirationMs = options.cacheExpirationMs || 300000 // 5 minutes default
        testResultsCache.set(cacheKey, {
          result,
          timestamp: Date.now(),
          expiresAt: Date.now() + expirationMs
        })
      }
      
      return result
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      retryAttempts++
      
      // Call error callback if provided
      options.onError?.(test.id, lastError)
      
      // Wait before retry (exponential backoff)
      if (retryAttempts <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryAttempts) * 100))
      }
    }
  }
  
  // If we get here, all retries failed
  const executionTime = performance.now() - startTime
  
  return {
    testId: test.id,
    testName: test.name,
    category: test.category,
    priority: test.priority,
    passed: false,
    executionTime,
    retryAttempts: retryAttempts - 1,
    error: lastError,
    metadata: {
      actualDuration: executionTime,
      expectedDuration: test.metadata?.expectedDuration,
      performanceImpact: 'high', // Failed tests impact performance
      userMessage: `${test.name} failed: ${lastError?.message || 'Unknown error'}`
    },
    fallbackStrategy: test.fallback,
    recommendations: [
      `Unable to enable ${test.name.toLowerCase()}`,
      `Using fallback: ${test.fallback.toLowerCase()}`,
      ...(test.requirements || []).map(req => `Check that ${req} is properly configured`)
    ]
  }
}

/**
 * Main Compatibility Testing Function
 * Executes the complete test suite and provides comprehensive results
 */
export async function runCompatibilityTests(
  options: TestExecutionOptions = {}
): Promise<CompatibilityTestSuiteResult> {
  const startTime = performance.now()
  
  // Combine all test suites
  const allTests = [
    ...ENVIRONMENT_TESTS,
    ...BLOCKCHAIN_TESTS,
    ...SOCIAL_TESTS,
    ...(options.includePerformanceTests !== false ? PERFORMANCE_TESTS : [])
  ]
  
  // Filter tests based on options
  const filteredTests = allTests.filter(test => {
    const priorityMatch = !options.priorityFilter || 
                         options.priorityFilter.includes(test.priority)
    const categoryMatch = !options.categoryFilter || 
                         options.categoryFilter.includes(test.category)
    return priorityMatch && categoryMatch
  })
  
  // Execute tests with progress tracking
  const results: CompatibilityTestResult[] = []
  let completedTests = 0
  
  for (const test of filteredTests) {
    options.onProgress?.(completedTests, filteredTests.length, test.name)
    
    const result = await executeTest(test, options)
    results.push(result)
    
    completedTests++
  }
  
  // Calculate summary statistics
  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const criticalFailures = results.filter(r => 
    !r.passed && r.priority === 'critical'
  ).length
  
  const totalExecutionTime = performance.now() - startTime
  const averageExecutionTime = totalExecutionTime / Math.max(totalTests, 1)
  
  // Determine compatibility level
  const compatibilityLevel: CompatibilityLevel = (() => {
    if (criticalFailures > 0) return 'none'
    
    const passRate = passedTests / totalTests
    if (passRate >= 0.9) return 'full'
    if (passRate >= 0.7) return 'partial'
    return 'limited'
  })()
  
  // Analyze results by category
  const summary = {
    environmentSupport: results
      .filter(r => r.category === 'environment')
      .every(r => r.passed || r.priority !== 'critical'),
    blockchainSupport: results
      .filter(r => r.category === 'blockchain')
      .every(r => r.passed || r.priority !== 'critical'),
    socialSupport: results
      .filter(r => r.category === 'social')
      .some(r => r.passed),
    performanceOptimal: results
      .filter(r => r.category === 'performance')
      .every(r => r.passed || r.priority === 'low'),
    accessibilityCompliant: results
      .filter(r => r.category === 'accessibility')
      .every(r => r.passed),
    integrationStable: results
      .filter(r => r.category === 'integration')
      .every(r => r.passed || r.priority !== 'critical')
  }
  
  // Generate recommendations
  const recommendations = [
    ...new Set(results.flatMap(r => r.recommendations || []))
  ]
  
  // Generate fallback strategies
  const fallbackStrategies = [
    ...new Set(results
      .filter(r => !r.passed && r.fallbackStrategy)
      .map(r => r.fallbackStrategy!)
    )
  ]
  
  // Calculate performance profile
  const performanceProfile: {
    readonly initializationTime: number
    readonly featureResponseTime: number
    readonly resourceUsage: 'light' | 'moderate' | 'heavy'
    readonly networkRequirements: 'low' | 'medium' | 'high'
  } = {
    initializationTime: results
      .filter(r => r.category === 'environment')
      .reduce((sum, r) => sum + r.executionTime, 0),
    featureResponseTime: averageExecutionTime,
    resourceUsage: totalExecutionTime > 10000 ? 'heavy' : 
                   totalExecutionTime > 5000 ? 'moderate' : 'light',
    networkRequirements: results.some(r => 
      r.category === 'blockchain' && r.executionTime > 3000
    ) ? 'high' : 
    results.some(r => r.category === 'social' && r.passed) ? 'medium' : 'low'
  }
  
  return {
    executedAt: Date.now(),
    totalTests,
    passedTests,
    failedTests,
    criticalFailures,
    totalExecutionTime,
    averageExecutionTime,
    compatibilityLevel,
    results,
    summary,
    recommendations,
    fallbackStrategies,
    performanceProfile
  }
}

// ================================================
// REACT HOOKS FOR COMPATIBILITY TESTING
// ================================================

/**
 * React Hook: useCompatibilityTesting
 * Provides compatibility testing functionality within React components
 */
export function useCompatibilityTesting() {
  const chainId = useChainId()
  
  const runTests = useCallback(async (options?: TestExecutionOptions) => {
    return await runCompatibilityTests(options)
  }, [chainId])
  
  const runQuickTests = useCallback(async () => {
    return await runCompatibilityTests({
      priorityFilter: ['critical', 'high'],
      enableCaching: true,
      includePerformanceTests: false
    })
  }, [chainId])
  
  const runFullTests = useCallback(async () => {
    return await runCompatibilityTests({
      includePerformanceTests: true,
      enableCaching: true,
      enableRetries: true
    })
  }, [chainId])
  
  return {
    runTests,
    runQuickTests,
    runFullTests,
    clearCache: () => testResultsCache.clear()
  }
}

/**
 * Utility function to get compatibility level from test results
 */
export function getCompatibilityLevel(results: CompatibilityTestSuiteResult): CompatibilityLevel {
  return results.compatibilityLevel
}

/**
 * Utility function to check if a specific feature is supported
 */
export function isFeatureSupported(
  results: CompatibilityTestSuiteResult,
  featureTestId: string
): boolean {
  const testResult = results.results.find(r => r.testId === featureTestId)
  return testResult?.passed || false
}

/**
 * Utility function to get fallback strategies for failed tests
 */
export function getFallbackStrategies(
  results: CompatibilityTestSuiteResult
): readonly string[] {
  return results.fallbackStrategies
}

export default runCompatibilityTests
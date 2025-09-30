/**
 * RPC Test Suite - Validate Fixed Configuration
 * 
 * This test suite validates that our RPC fixes are working correctly
 * and provides diagnostics for any remaining issues.
 */

import { createPublicClient, http, type PublicClient } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { 
  getCurrentChainConfig, 
  createFixedRpcTransports,
  getSupportedChains,
  rpcCacheUtils 
} from './fixed-rpc-config'

// ============================================================================
// TYPES
// ============================================================================

interface EndpointTestResult {
  endpoint: string
  success: boolean
  responseTime: number
  error?: string
  blockNumber?: bigint
}

interface RpcTestResults {
  timestamp: number
  currentChain: { id: number; name: string }
  endpointTests: EndpointTestResult[]
  cacheStats: { cacheSize: number; pendingRequests: number }
  summary: {
    totalEndpoints: number
    workingEndpoints: number
    averageResponseTime: number
    fastestEndpoint: string | null
    slowestEndpoint: string | null
  }
}

interface HealthCheckResult {
  isHealthy: boolean
  issues: string[]
  warnings: string[]
  recommendations: string[]
}

// ============================================================================
// ENDPOINT TESTING
// ============================================================================

/**
 * Test a single RPC endpoint for connectivity and performance
 */
async function testRpcEndpoint(endpoint: string, chainId: number): Promise<EndpointTestResult> {
  const startTime = Date.now()
  
  try {
    const client = createPublicClient({
      chain: chainId === base.id ? base : baseSepolia,
      transport: http(endpoint, {
        timeout: 10000, // 10 second timeout
      })
    })
    
    // Test with a simple eth_blockNumber call
    const blockNumber = await client.getBlockNumber()
    const responseTime = Date.now() - startTime
    
    return {
      endpoint,
      success: true,
      responseTime,
      blockNumber
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      endpoint,
      success: false,
      responseTime,
      error: (error as Error).message
    }
  }
}

/**
 * Get verified endpoints for testing
 */
function getEndpointsForChain(chainId: number): string[] {
  const endpoints: string[] = []
  
  if (chainId === base.id) {
    // Base mainnet endpoints
    if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
      endpoints.push(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
    }
    if (process.env.NEXT_PUBLIC_INFURA_API_KEY) {
      endpoints.push(`https://base-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`)
    }
    endpoints.push(
      'https://base.llamarpc.com',
      'https://base.drpc.org',
      'https://base.publicnode.com',
      'https://mainnet.base.org'
    )
  } else {
    // Base sepolia endpoints
    if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
      endpoints.push(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
    }
    if (process.env.NEXT_PUBLIC_INFURA_API_KEY) {
      endpoints.push(`https://base-sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`)
    }
    endpoints.push(
      'https://base-sepolia.drpc.org',
      'https://base-sepolia.publicnode.com',
      'https://sepolia.base.org'
    )
  }
  
  return endpoints
}

// ============================================================================
// COMPREHENSIVE TESTING
// ============================================================================

/**
 * Run comprehensive RPC tests on all endpoints
 */
export async function runRpcTests(): Promise<RpcTestResults> {
  const { chain } = getCurrentChainConfig()
  const endpoints = getEndpointsForChain(chain.id)
  
  console.log(`🧪 Testing ${endpoints.length} RPC endpoints for ${chain.name}...`)
  
  // Test all endpoints in parallel
  const endpointTests = await Promise.all(
    endpoints.map(endpoint => testRpcEndpoint(endpoint, chain.id))
  )
  
  // Calculate summary statistics
  const workingEndpoints = endpointTests.filter(test => test.success)
  const responseTimes = workingEndpoints.map(test => test.responseTime)
  
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0
  
  const fastestTest = workingEndpoints.reduce((fastest, current) => 
    current.responseTime < fastest.responseTime ? current : fastest, 
    workingEndpoints[0]
  )
  
  const slowestTest = workingEndpoints.reduce((slowest, current) => 
    current.responseTime > slowest.responseTime ? current : slowest,
    workingEndpoints[0]
  )
  
  return {
    timestamp: Date.now(),
    currentChain: { id: chain.id, name: chain.name },
    endpointTests,
    cacheStats: rpcCacheUtils.stats(),
    summary: {
      totalEndpoints: endpoints.length,
      workingEndpoints: workingEndpoints.length,
      averageResponseTime,
      fastestEndpoint: fastestTest?.endpoint || null,
      slowestEndpoint: slowestTest?.endpoint || null
    }
  }
}

/**
 * Perform health check on the current RPC configuration
 */
export function performHealthCheck(): HealthCheckResult {
  const result: HealthCheckResult = {
    isHealthy: true,
    issues: [],
    warnings: [],
    recommendations: []
  }
  
  try {
    const { chain } = getCurrentChainConfig()
    const supportedChains = getSupportedChains()
    const endpoints = getEndpointsForChain(chain.id)
    
    // Check basic configuration
    if (supportedChains.length === 0) {
      result.issues.push('No supported chains configured')
      result.isHealthy = false
    }
    
    if (endpoints.length < 2) {
      result.warnings.push('Less than 2 RPC endpoints configured')
      result.recommendations.push('Add more RPC endpoints for better reliability')
    }
    
    // Check for premium providers
    const hasAlchemy = Boolean(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY)
    const hasInfura = Boolean(process.env.NEXT_PUBLIC_INFURA_API_KEY)
    
    if (!hasAlchemy && !hasInfura) {
      result.warnings.push('No premium RPC providers configured')
      result.recommendations.push('Add Alchemy or Infura API keys for better performance')
    }
    
    // Check environment configuration
    const network = process.env.NETWORK
    if (!network) {
      result.warnings.push('NETWORK environment variable not set')
      result.recommendations.push('Set NETWORK=base or NETWORK=base-sepolia')
    }
    
    // Check for known problematic endpoints
    const problematicEndpoints = endpoints.filter(endpoint => 
      endpoint.includes('base-sepolia.llamarpc.com')
    )
    
    if (problematicEndpoints.length > 0) {
      result.issues.push(`Problematic endpoints detected: ${problematicEndpoints.join(', ')}`)
      result.isHealthy = false
    }
    
  } catch (error) {
    result.issues.push(`Health check failed: ${(error as Error).message}`)
    result.isHealthy = false
  }
  
  return result
}

// ============================================================================
// DIAGNOSTIC UTILITIES
// ============================================================================

/**
 * Print detailed diagnostic information
 */
export async function printDiagnostics(): Promise<void> {
  console.log('🔍 RPC Configuration Diagnostics')
  console.log('================================')
  
  // Current configuration
  try {
    const { chain } = getCurrentChainConfig()
    const supportedChains = getSupportedChains()
    const endpoints = getEndpointsForChain(chain.id)
    
    console.log(`Current Chain: ${chain.name} (${chain.id})`)
    console.log(`Supported Chains: ${supportedChains.map(c => c.name).join(', ')}`)
    console.log(`Available Endpoints: ${endpoints.length}`)
    console.log()
    
    // Endpoint list
    console.log('Configured Endpoints:')
    endpoints.forEach((endpoint, index) => {
      const tier = endpoint.includes('alchemy.com') || endpoint.includes('infura.io') 
        ? '(Premium)' 
        : endpoint.includes('mainnet.base.org') || endpoint.includes('sepolia.base.org')
        ? '(Official)'
        : '(Public)'
      console.log(`  ${index + 1}. ${endpoint} ${tier}`)
    })
    console.log()
    
  } catch (error) {
    console.error('❌ Configuration error:', (error as Error).message)
  }
  
  // Health check
  const healthCheck = performHealthCheck()
  console.log(`Health Status: ${healthCheck.isHealthy ? '✅ Healthy' : '❌ Issues Found'}`)
  
  if (healthCheck.issues.length > 0) {
    console.log('Issues:')
    healthCheck.issues.forEach(issue => console.log(`  ❌ ${issue}`))
  }
  
  if (healthCheck.warnings.length > 0) {
    console.log('Warnings:')
    healthCheck.warnings.forEach(warning => console.log(`  ⚠️ ${warning}`))
  }
  
  if (healthCheck.recommendations.length > 0) {
    console.log('Recommendations:')
    healthCheck.recommendations.forEach(rec => console.log(`  💡 ${rec}`))
  }
  
  console.log()
  
  // Cache stats
  const cacheStats = rpcCacheUtils.stats()
  console.log(`Cache Status: ${cacheStats.cacheSize} cached entries, ${cacheStats.pendingRequests} pending requests`)
}

/**
 * Clear all caches and reset state
 */
export function resetRpcState(): void {
  rpcCacheUtils.clear()
  console.log('✅ RPC cache cleared')
}

// ============================================================================
// AUTOMATED TESTING
// ============================================================================

/**
 * Run automated tests and report results
 */
export async function runAutomatedTests(): Promise<boolean> {
  console.log('🤖 Running automated RPC tests...')
  
  try {
    const results = await runRpcTests()
    
    console.log(`📊 Test Results for ${results.currentChain.name}:`)
    console.log(`   Total endpoints: ${results.summary.totalEndpoints}`)
    console.log(`   Working endpoints: ${results.summary.workingEndpoints}`)
    console.log(`   Success rate: ${((results.summary.workingEndpoints / results.summary.totalEndpoints) * 100).toFixed(1)}%`)
    
    if (results.summary.workingEndpoints > 0) {
      console.log(`   Average response time: ${results.summary.averageResponseTime.toFixed(0)}ms`)
      console.log(`   Fastest endpoint: ${results.summary.fastestEndpoint}`)
    }
    
    // Show failed endpoints
    const failedTests = results.endpointTests.filter(test => !test.success)
    if (failedTests.length > 0) {
      console.log('❌ Failed endpoints:')
      failedTests.forEach(test => {
        console.log(`   ${test.endpoint}: ${test.error}`)
      })
    }
    
    // Return true if at least one endpoint is working
    return results.summary.workingEndpoints > 0
    
  } catch (error) {
    console.error('❌ Automated tests failed:', (error as Error).message)
    return false
  }
}
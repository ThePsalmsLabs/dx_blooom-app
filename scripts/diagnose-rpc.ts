// scripts/diagnose-rpc.ts
// Run with: npx ts-node scripts/diagnose-rpc.ts

import { createPublicClient, http, fallback } from 'viem'
import { base } from 'viem/chains'
import chalk from 'chalk'

/**
 * RPC Diagnostic Script
 * Tests various RPC endpoints and their rate limits
 */

const RPC_ENDPOINTS = [
  { name: 'Base Public', url: 'https://mainnet.base.org' },
  { name: 'BlockPI', url: 'https://base.blockpi.network/v1/rpc/public' },
  { name: 'MeowRPC', url: 'https://base.meowrpc.com' },
  { name: 'PublicNode', url: 'https://base-rpc.publicnode.com' },
  { name: 'Ankr Free', url: 'https://rpc.ankr.com/base' },
]

// Add your premium endpoints if available
if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
  RPC_ENDPOINTS.unshift({
    name: 'Alchemy',
    url: `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  })
}

async function testEndpoint(endpoint: { name: string; url: string }) {
  console.log(chalk.blue(`\n📡 Testing ${endpoint.name}...`))
  
  const client = createPublicClient({
    chain: base,
    transport: http(endpoint.url, {
      timeout: 10000,
      retryCount: 0, // No retries for testing
    }),
  })

  const results = {
    endpoint: endpoint.name,
    url: endpoint.url,
    latency: 0,
    maxBatchSize: 0,
    rateLimit: false,
    error: null as string | null,
  }

  try {
    // Test 1: Single request latency
    const start = Date.now()
    await client.getBlockNumber()
    results.latency = Date.now() - start
    console.log(chalk.green(`  ✓ Latency: ${results.latency}ms`))

    // Test 2: Find maximum batch size
    let batchSize = 10
    let maxWorking = 0
    
    while (batchSize <= 100) {
      try {
        const contracts = Array(batchSize).fill(null).map((_, i) => ({
          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const, // USDC on Base
          abi: [{
            name: 'decimals',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ type: 'uint8' }],
          }] as const,
          functionName: 'decimals' as const,
        }))

        await client.multicall({ contracts })
        maxWorking = batchSize
        batchSize += 10
      } catch (error: any) {
        if (error.message?.includes('429') || error.message?.includes('rate')) {
          results.rateLimit = true
          console.log(chalk.yellow(`  ⚠ Rate limit hit at batch size: ${batchSize}`))
          break
        }
        break
      }
    }
    
    results.maxBatchSize = maxWorking
    console.log(chalk.green(`  ✓ Max batch size: ${maxWorking}`))

    // Test 3: Rapid requests to test rate limiting
    console.log(chalk.cyan('  Testing rate limits...'))
    let requestCount = 0
    const rapidTestStart = Date.now()
    
    while (Date.now() - rapidTestStart < 5000) { // Test for 5 seconds
      try {
        await client.getBlockNumber()
        requestCount++
        
        if (requestCount % 10 === 0) {
          process.stdout.write('.')
        }
      } catch (error: any) {
        if (error.message?.includes('429')) {
          results.rateLimit = true
          console.log(chalk.yellow(`\n  ⚠ Rate limited after ${requestCount} requests`))
          break
        }
        throw error
      }
    }
    
    if (!results.rateLimit) {
      console.log(chalk.green(`\n  ✓ No rate limit detected (${requestCount} requests in 5s)`))
    }

  } catch (error: any) {
    results.error = error.message
    console.log(chalk.red(`  ✗ Error: ${error.message}`))
  }

  return results
}

async function runDiagnostics() {
  console.log(chalk.bold.cyan('\n🔍 RPC Endpoint Diagnostics for Base Mainnet\n'))
  console.log(chalk.gray('=' .repeat(50)))
  
  const results = []
  
  for (const endpoint of RPC_ENDPOINTS) {
    const result = await testEndpoint(endpoint)
    results.push(result)
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Summary
  console.log(chalk.bold.cyan('\n📊 Summary Report\n'))
  console.log(chalk.gray('=' .repeat(50)))
  
  // Sort by performance
  const sorted = results
    .filter(r => !r.error)
    .sort((a, b) => {
      // Prioritize by: no rate limit > max batch size > latency
      if (a.rateLimit !== b.rateLimit) return a.rateLimit ? 1 : -1
      if (a.maxBatchSize !== b.maxBatchSize) return b.maxBatchSize - a.maxBatchSize
      return a.latency - b.latency
    })
  
  console.log(chalk.bold('\nBest Performing Endpoints:'))
  sorted.slice(0, 3).forEach((r, i) => {
    console.log(chalk.green(`  ${i + 1}. ${r.endpoint}`))
    console.log(chalk.gray(`     Latency: ${r.latency}ms | Batch: ${r.maxBatchSize} | Rate Limited: ${r.rateLimit ? 'Yes' : 'No'}`))
  })
  
  // Recommendations
  console.log(chalk.bold.yellow('\n💡 Recommendations:'))
  
  if (sorted[0].rateLimit) {
    console.log(chalk.yellow('  ⚠ All endpoints have rate limits. Consider getting API keys for:'))
    console.log('    - Alchemy: https://www.alchemy.com/')
    console.log('    - QuickNode: https://www.quicknode.com/')
    console.log('    - Infura: https://www.infura.io/')
  } else {
    console.log(chalk.green(`  ✓ Use ${sorted[0].endpoint} as your primary RPC`))
    if (sorted[1]) {
      console.log(chalk.green(`  ✓ Use ${sorted[1].endpoint} as your fallback RPC`))
    }
  }
  
  const avgBatchSize = sorted.reduce((acc, r) => acc + r.maxBatchSize, 0) / sorted.length
  console.log(chalk.cyan(`  ℹ Set multicall batch size to: ${Math.floor(avgBatchSize * 0.7)} (70% of average)`))
  
  // Environment variables template
  console.log(chalk.bold.cyan('\n📝 Suggested .env.local Configuration:\n'))
  console.log(chalk.gray('```'))
  console.log('# Add these to your .env.local file')
  console.log('NEXT_PUBLIC_PRIMARY_RPC=' + sorted[0].url)
  if (sorted[1]) {
    console.log('NEXT_PUBLIC_FALLBACK_RPC=' + sorted[1].url)
  }
  console.log('NEXT_PUBLIC_MULTICALL_BATCH_SIZE=' + Math.floor(avgBatchSize * 0.7))
  console.log(chalk.gray('```'))
}

// Run diagnostics
runDiagnostics().catch(console.error)
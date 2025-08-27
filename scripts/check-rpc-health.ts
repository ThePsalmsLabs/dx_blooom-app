#!/usr/bin/env tsx

/**
 * RPC Health Check Script
 * 
 * This script tests all configured RPC providers to identify which ones
 * are working best and have the lowest latency.
 */

import { http, createPublicClient } from 'viem'
import { base } from 'wagmi/chains'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const providers = [
  {
    name: 'Alchemy',
    url: `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
    enabled: !!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  },
  {
    name: 'Infura',
    url: `https://base-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`,
    enabled: !!process.env.NEXT_PUBLIC_INFURA_API_KEY
  },
  {
    name: 'QuickNode',
    url: process.env.NEXT_PUBLIC_QUICKNODE_URL,
    enabled: !!process.env.NEXT_PUBLIC_QUICKNODE_URL
  },
  {
    name: 'Ankr',
    url: `https://rpc.ankr.com/base/${process.env.NEXT_PUBLIC_ANKR_API_KEY}`,
    enabled: !!process.env.NEXT_PUBLIC_ANKR_API_KEY
  },
  {
    name: 'Base Official',
    url: 'https://mainnet.base.org',
    enabled: true
  },
  {
    name: 'BlockPI',
    url: 'https://base.blockpi.network/v1/rpc/public',
    enabled: true
  }
]

async function testProvider(name: string, url: string): Promise<{ latency: number; success: boolean; error?: string }> {
  const client = createPublicClient({
    chain: base,
    transport: http(url, { timeout: 5000 })
  })

  const startTime = Date.now()
  
  try {
    await client.getBlockNumber()
    const latency = Date.now() - startTime
    
    return {
      latency,
      success: true
    }
  } catch (error) {
    return {
      latency: -1,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function main() {
  console.log('🔍 Testing RPC Provider Health...\n')
  
  const results = []
  
  for (const provider of providers) {
    if (!provider.enabled) {
      console.log(`⏭️  ${provider.name}: Not configured`)
      continue
    }
    
    console.log(`🔄 Testing ${provider.name}...`)
    const result = await testProvider(provider.name, provider.url!)
    
    if (result.success) {
      console.log(`✅ ${provider.name}: ${result.latency}ms`)
      results.push({ ...result, name: provider.name })
    } else {
      console.log(`❌ ${provider.name}: Failed - ${result.error}`)
    }
  }
  
  console.log('\n📊 Results Summary:')
  console.log('==================')
  
  if (results.length === 0) {
    console.log('❌ No providers are working!')
    return
  }
  
  // Sort by latency
  results.sort((a, b) => a.latency - b.latency)
  
  results.forEach((result, index) => {
    const status = result.latency < 500 ? '🟢' : result.latency < 1000 ? '🟡' : '🔴'
    console.log(`${status} ${index + 1}. ${result.name}: ${result.latency}ms`)
  })
  
  const bestProvider = results[0]
  console.log(`\n🏆 Best Provider: ${bestProvider.name} (${bestProvider.latency}ms)`)
  
  if (bestProvider.latency > 1000) {
    console.log('\n⚠️  Warning: All providers have high latency (>1000ms)')
    console.log('   Consider checking your network connection or RPC provider status')
  }
}

main().catch(console.error)

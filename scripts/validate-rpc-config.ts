#!/usr/bin/env tsx

/**
 * RPC Configuration Validation Script
 * 
 * This script helps you validate your RPC configuration and provides
 * guidance on setting up the enhanced wagmi configuration.
 * 
 * Usage:
 * npm run validate-rpc
 * or
 * npx tsx scripts/validate-rpc-config.ts
 */

import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('🔧 Validating RPC Configuration...\n')
  
  try {
    // Simple validation - check if environment variables are set
    const infuraKey = process.env.NEXT_PUBLIC_INFURA_API_KEY
    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    const baseRPC = process.env.NEXT_PUBLIC_BASE_MAINNET_RPC
    const sepoliaRPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC
    
    let premiumProviders = 0
    const recommendations: string[] = []
    
    if (infuraKey) {
      premiumProviders++
      console.log('✅ Infura API key configured')
    } else {
      recommendations.push('Add NEXT_PUBLIC_INFURA_API_KEY to .env.local')
    }
    
    if (alchemyKey) {
      premiumProviders++
      console.log('✅ Alchemy API key configured')
    } else {
      recommendations.push('Add NEXT_PUBLIC_ALCHEMY_API_KEY to .env.local for redundancy')
    }
    
    if (baseRPC) {
      console.log('✅ Base mainnet RPC configured')
    } else {
      console.log('ℹ️  Using default Base mainnet RPC')
    }
    
    if (sepoliaRPC) {
      console.log('✅ Base Sepolia RPC configured')
    } else {
      console.log('ℹ️  Using default Base Sepolia RPC')
    }
    
    console.log(`\n📊 Configuration Status:`)
    console.log(`   Premium Providers: ${premiumProviders}/2`)
    console.log(`   Public Providers: Available`)
    
    if (recommendations.length > 0) {
      console.log('\n🚨 Recommendations:')
      recommendations.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action}`)
      })
    } else {
      console.log('\n✅ Configuration looks good!')
    }
    
    console.log('\n📝 Next Steps:')
    console.log('   1. Add your Infura API key to .env.local:')
    console.log('      NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key_here')
    console.log('   2. Optionally add Alchemy API key for redundancy:')
    console.log('      NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key_here')
    console.log('   3. Get a free WalletConnect project ID from:')
    console.log('      https://cloud.walletconnect.com/')
    console.log('   4. Restart your development server')
    
  } catch (error) {
    console.error('❌ Error validating configuration:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

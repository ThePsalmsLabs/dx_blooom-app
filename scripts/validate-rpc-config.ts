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
import { validateRPCConfiguration } from '../src/lib/web3/enhanced-wagmi-config'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('🔧 Validating RPC Configuration...\n')
  
  try {
    const results = await validateRPCConfiguration()
    
    console.log('📊 Configuration Status:')
    console.log(`   Premium Providers: ${results.premiumProvidersConfigured}/4`)
    console.log(`   Public Providers: ${results.publicProvidersAvailable}`)
    
    if (results.recommendedActions.length > 0) {
      console.log('\n🚨 Recommendations:')
      results.recommendedActions.forEach((action, index) => {
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

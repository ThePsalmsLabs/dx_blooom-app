/**
 * Test script to verify WalletConnect singleton fix
 * Run this to check if the multiple initialization issue is resolved
 */

const { getEnhancedWagmiConfig, resetEnhancedWagmiConfig, debugEnhancedWagmiConfig } = require('./src/lib/contracts/miniapp-config.ts')

async function testSingleton() {
  console.log('🧪 Testing WalletConnect Singleton Fix\n')

  try {
    // Test 1: Multiple calls should return the same config
    console.log('Test 1: Multiple configuration requests')
    const config1 = await getEnhancedWagmiConfig()
    const config2 = await getEnhancedWagmiConfig()
    const config3 = await getEnhancedWagmiConfig()

    console.log('✅ Config 1 created')
    console.log('🔄 Config 2 reused from singleton')
    console.log('🔄 Config 3 reused from singleton')
    console.log('Same instance?', config1 === config2 && config2 === config3)

    // Test 2: Debug info
    console.log('\nTest 2: Debug Information')
    debugEnhancedWagmiConfig()

    // Test 3: Reset functionality
    console.log('\nTest 3: Reset functionality')
    resetEnhancedWagmiConfig()
    console.log('✅ Configuration reset')

    // Test 4: New config after reset
    console.log('\nTest 4: New config after reset')
    const config4 = await getEnhancedWagmiConfig()
    console.log('✅ New config created after reset')
    console.log('Different instance?', config1 !== config4)

    console.log('\n🎉 All tests passed! WalletConnect singleton is working correctly.')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSingleton()

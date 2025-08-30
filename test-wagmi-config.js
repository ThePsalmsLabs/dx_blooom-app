// Test script to verify wagmi configuration
// Run with: node test-wagmi-config.js

const { createConfig, http } = require('wagmi')
const { base, baseSepolia } = require('wagmi/chains')
const { metaMask, walletConnect } = require('wagmi/connectors')

console.log('🧪 Testing Wagmi Configuration...')

try {
  // Test basic configuration
  const testConfig = createConfig({
    chains: [base],
    connectors: [
      metaMask(),
      walletConnect({
        projectId: 'test-project-id',
        metadata: {
          name: 'Test App',
          description: 'Testing wagmi config',
          url: 'https://test.com',
          icons: []
        }
      })
    ],
    transports: {
      [base.id]: http('https://mainnet.base.org')
    },
    ssr: true
  })

  console.log('✅ Basic wagmi config created successfully')
  console.log('Config properties:', Object.keys(testConfig))
  console.log('Config state:', testConfig._internal ? 'Has internal state' : 'No internal state')

  // Test if config has the expected structure
  if (testConfig.chains && testConfig.connectors && testConfig._internal) {
    console.log('✅ Config structure is valid')
  } else {
    console.log('❌ Config structure is invalid')
  }

} catch (error) {
  console.error('❌ Failed to create wagmi config:', error)
  process.exit(1)
}

console.log('🎉 Wagmi configuration test completed successfully!')

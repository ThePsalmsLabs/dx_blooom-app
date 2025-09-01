/**
 * Creator Registration Debug Script for MiniApp
 * This script helps identify why creator registration transactions aren't working
 */

console.log('🔍 CREATOR REGISTRATION DEBUG STARTED')
console.log('=====================================')

// Test 1: Environment Variables
console.log('\n📋 TEST 1: Environment Variables')
console.log('==================================')

const requiredEnvVars = [
  'NETWORK',
  'NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS',
  'NEXT_PUBLIC_MINIAPP_ENABLED',
  'NEXT_PUBLIC_FARCASTER_DEV_MODE'
]

requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value}`)
  } else {
    console.log(`❌ ${varName}: NOT SET`)
  }
})

// Test 2: Network Detection
console.log('\n📋 TEST 2: Network Detection')
console.log('=============================')

if (typeof window !== 'undefined') {
  // Check current network
  console.log('🌐 Browser Environment Detected')

  // Check if we're in a MiniApp context
  const isMiniApp = window.location.pathname.startsWith('/mini') ||
                   window.parent !== window ||
                   document.referrer.includes('farcaster') ||
                   document.referrer.includes('warpcast')

  console.log(`📱 Is MiniApp Context: ${isMiniApp}`)
  console.log(`🔗 Current URL: ${window.location.href}`)
  console.log(`👨 Parent Window: ${window.parent === window ? 'Same' : 'Different'}`)

  // Check for Farcaster meta tags
  const fcFrame = document.querySelector('meta[name="fc:frame"]')
  const fcMiniApp = document.querySelector('meta[name="fc:miniapp"]')
  console.log(`🎯 FC Frame Meta: ${fcFrame ? 'Found' : 'Not Found'}`)
  console.log(`🎯 FC MiniApp Meta: ${fcMiniApp ? 'Found' : 'Not Found'}`)

  // Check wallet connection
  console.log('\n📋 TEST 3: Wallet Connection Status')
  console.log('===================================')

  // This will be populated by React hooks, but we can check for global wallet objects
  const hasMetaMask = typeof window.ethereum !== 'undefined'
  const hasCoinbaseWallet = window.ethereum?.isCoinbaseWallet === true
  const hasWalletConnect = window.ethereum?.isWalletConnect === true

  console.log(`🦊 MetaMask Available: ${hasMetaMask}`)
  console.log(`🪙 Coinbase Wallet: ${hasCoinbaseWallet}`)
  console.log(`🔗 WalletConnect: ${hasWalletConnect}`)

} else {
  console.log('🖥️  Server-side rendering detected')
}

// Test 3: Contract Configuration
console.log('\n📋 TEST 4: Contract Configuration')
console.log('==================================')

const network = process.env.NETWORK || 'base'
const expectedChainId = network === 'base' ? 8453 : 84532

console.log(`🎯 Expected Network: ${network} (Chain ID: ${expectedChainId})`)

// Contract addresses based on network
const contractAddresses = {
  base: {
    creatorRegistry: '0x6b88ae6538FB8bf8cbA1ad64fABb458aa0CE4263',
    contentRegistry: '0xB4cbF1923be6FF1bc4D45471246D753d34aB41d7',
    payPerView: '0x8A89fcAe4E674d6528A5a743E468eBE9BDCf3101'
  },
  'base-sepolia': {
    creatorRegistry: '0xe94dbb72bdd8604e25a2c7d2cf9bad71f2870d5b',
    contentRegistry: '0x981f162aa0d25c660c2658f50904cb3b33afa406',
    payPerView: '0x559B0FaF011e95D3B634a88390cD320f186141D0'
  }
}

const currentAddresses = contractAddresses[network]
console.log(`📄 Creator Registry: ${currentAddresses.creatorRegistry}`)
console.log(`📄 Content Registry: ${currentAddresses.contentRegistry}`)
console.log(`📄 Pay Per View: ${currentAddresses.payPerView}`)

// Test 4: MiniApp Detection
console.log('\n📋 TEST 5: MiniApp Detection')
console.log('===========================')

if (typeof window !== 'undefined') {
  const miniAppIndicators = {
    urlPath: window.location.pathname.startsWith('/mini'),
    iframe: window.parent !== window,
    farcasterReferrer: document.referrer.includes('farcaster') || document.referrer.includes('warpcast'),
    farcasterUA: navigator.userAgent.includes('farcaster') || navigator.userAgent.includes('warpcast'),
    metaTag: !!document.querySelector('meta[name="fc:frame"]') || !!document.querySelector('meta[name="fc:miniapp"]')
  }

  console.log('MiniApp Detection Results:')
  Object.entries(miniAppIndicators).forEach(([key, value]) => {
    console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`)
  })

  const isMiniApp = Object.values(miniAppIndicators).some(Boolean)
  console.log(`\n🎯 Overall MiniApp Detection: ${isMiniApp ? 'TRUE' : 'FALSE'}`)
}

// Test 5: Debug Instructions
console.log('\n📋 TEST 6: Debug Instructions')
console.log('============================')

console.log('🔍 To debug the creator registration issue:')
console.log('1. Check browser console for any error messages')
console.log('2. Verify you are connected to the correct network (Base or Base Sepolia)')
console.log('3. Check if your wallet is properly connected')
console.log('4. Ensure you have enough ETH for gas fees')
console.log('5. Try refreshing the page and reconnecting your wallet')
console.log('6. Check if the MiniApp is properly detected')
console.log('7. Verify contract addresses match your network')

console.log('\n🔧 Common Issues:')
console.log('- Network mismatch: Connected to wrong network')
console.log('- Wallet not connected: No wallet connection detected')
console.log('- MiniApp context: App not recognizing MiniApp environment')
console.log('- Contract addresses: Wrong addresses for current network')
console.log('- Gas fees: Insufficient funds for transaction')

console.log('\n✨ Debug script completed successfully!')
console.log('=====================================')

export default {} // Make this a valid module

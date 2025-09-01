/**
 * Debug Script for Content Publishing Flow
 * This script systematically tests each step of the content publishing process
 * to identify where transaction failures might be occurring.
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 DEBUGGING CONTENT PUBLISHING FLOW\n')

// Test 1: Check Environment Configuration
console.log('📋 TEST 1: Environment Configuration')
console.log('====================================')

// Check for .env.local file
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists')

  const envContent = fs.readFileSync(envPath, 'utf8')
  const requiredVars = [
    'NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS',
    'NEXT_PUBLIC_CONTENT_REGISTRY_ADDRESS',
    'NEXT_PUBLIC_PAY_PER_VIEW_ADDRESS',
    'NEXT_PUBLIC_COMMERCE_INTEGRATION_ADDRESS',
    'NEXT_PUBLIC_PRICE_ORACLE_ADDRESS',
    'NEXT_PUBLIC_COMMERCE_PROTOCOL_ADDRESS',
    'NEXT_PUBLIC_USDC_ADDRESS',
    'PINATA_JWT',
    'PINATA_API_KEY',
    'PINATA_SECRET_API_KEY'
  ]

  console.log('\n🔧 Checking required environment variables:')
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(varName + '=')
    const value = envContent.match(new RegExp(`${varName}=(.*)`))?.[1]
    const maskedValue = value ? (value.length > 10 ? value.substring(0, 10) + '...' : value) : 'NOT SET'

    if (hasVar && value) {
      console.log(`  ✅ ${varName}: ${maskedValue}`)
    } else {
      console.log(`  ❌ ${varName}: NOT SET`)
    }
  })
} else {
  console.log('❌ .env.local file not found')
}

// Test 2: Check Contract Configuration
console.log('\n📋 TEST 2: Contract Configuration')
console.log('==================================')

try {
  const configPath = path.join(process.cwd(), 'src/lib/contracts/config.ts')
  if (fs.existsSync(configPath)) {
    console.log('✅ Contract config file exists')

    const configContent = fs.readFileSync(configPath, 'utf8')

    // Check for Base Mainnet addresses (primary network)
    const baseMainnetAddresses = [
      '0xB4cbF1923be6FF1bc4D45471246D753d34aB41d7', // CONTENT_REGISTRY
      '0x8A89fcAe4E674d6528A5a743E468eBE9BDCf3101', // PAY_PER_VIEW
      '0x06D92f5A03f177c50A6e14Ac6a231cb371e67Da4', // SUBSCRIPTION_MANAGER
      '0x931601610C9491948e7cEeA2e9Df480162e45409', // COMMERCE_INTEGRATION
      '0x13056B1dFE38dA0c058e6b2B2e3DaecCEdCEFFfF', // PRICE_ORACLE
      '0xeADE6bE02d043b3550bE19E960504dbA14A14971', // COMMERCE_PROTOCOL
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'  // USDC
    ]

    console.log('\n🔧 Checking Base Mainnet contract addresses:')
    baseMainnetAddresses.forEach(address => {
      const hasAddress = configContent.includes(address)
      console.log(`  ${hasAddress ? '✅' : '❌'} ${address}`)
    })

    // Check for network support
    const hasBase = configContent.includes('base')
    const hasBaseMainnet = configContent.includes('base.id')
    console.log(`\n📡 Network Support:`)
    console.log(`  ${hasBase ? '✅' : '❌'} Base network support`)
    console.log(`  ${hasBaseMainnet ? '✅' : '❌'} Base mainnet configured`)

  } else {
    console.log('❌ Contract config file not found')
  }
} catch (error) {
  console.log('❌ Error checking contract configuration:', error.message)
}

// Test 3: Check IPFS Configuration
console.log('\n📋 TEST 3: IPFS Configuration')
console.log('==============================')

try {
  const ipfsRoutePath = path.join(process.cwd(), 'src/app/api/ipfs/upload/route.ts')
  if (fs.existsSync(ipfsRoutePath)) {
    console.log('✅ IPFS upload route exists')

    const ipfsContent = fs.readFileSync(ipfsRoutePath, 'utf8')

    // Check for Pinata integration
    const hasPinata = ipfsContent.includes('pinata.cloud')
    const hasJWTCheck = ipfsContent.includes('PINATA_JWT')

    console.log('\n🔧 IPFS Configuration:')
    console.log(`  ${hasPinata ? '✅' : '❌'} Pinata integration configured`)
    console.log(`  ${hasJWTCheck ? '✅' : '❌'} PINATA_JWT environment variable check`)

    // Check for error handling
    const hasErrorHandling = ipfsContent.includes('try') && ipfsContent.includes('catch')
    console.log(`  ${hasErrorHandling ? '✅' : '❌'} Error handling implemented`)

  } else {
    console.log('❌ IPFS upload route not found')
  }
} catch (error) {
  console.log('❌ Error checking IPFS configuration:', error.message)
}

// Test 4: Check Publishing Flow Implementation
console.log('\n📋 TEST 4: Publishing Flow Implementation')
console.log('==========================================')

try {
  const publishingPath = path.join(process.cwd(), 'src/hooks/business/workflows.ts')
  if (fs.existsSync(publishingPath)) {
    console.log('✅ Publishing workflow hook exists')

    const publishingContent = fs.readFileSync(publishingPath, 'utf8')

    // Check for key components
    const checks = [
      { name: 'Content validation', pattern: 'validateContentData' },
      { name: 'Wallet connection check', pattern: 'isWalletReady' },
      { name: 'Creator registration check', pattern: 'isCreatorRegistered' },
      { name: 'IPFS hash validation', pattern: 'validateIPFSHash' },
      { name: 'Contract interaction', pattern: 'registerContent.write' },
      { name: 'Transaction monitoring', pattern: 'transactionDetails|Base Mainnet' },
      { name: 'Error handling', pattern: 'insufficient funds|gas.*estimation|userFriendlyError' },
      { name: 'Retry mechanism', pattern: 'const retry|retry.*callback|publishingActions.retry' },
      { name: 'Network validation', pattern: 'chainId.*base\\.id|Base Mainnet' }
    ]

    console.log('\n🔧 Publishing Flow Components:')
    checks.forEach(check => {
      const hasComponent = new RegExp(check.pattern, 'i').test(publishingContent)
      console.log(`  ${hasComponent ? '✅' : '❌'} ${check.name}`)
    })

  } else {
    console.log('❌ Publishing workflow hook not found')
  }
} catch (error) {
  console.log('❌ Error checking publishing flow:', error.message)
}

// Test 5: Check Content Upload Form
console.log('\n📋 TEST 5: Content Upload Form')
console.log('==============================')

try {
  const uploadFormPath = path.join(process.cwd(), 'src/components/content/ContentUpload.tsx')
  if (fs.existsSync(uploadFormPath)) {
    console.log('✅ Content upload form exists')

    const uploadContent = fs.readFileSync(uploadFormPath, 'utf8')

    // Check for key components
    const checks = [
      { name: 'IPFS upload function', pattern: 'uploadToIPFS' },
      { name: 'File validation', pattern: 'validateFileTypeSupport' },
      { name: 'Form validation', pattern: 'validateFormData' },
      { name: 'Transaction submission', pattern: 'handleSubmit' },
      { name: 'Progress tracking', pattern: 'uploadProgress' },
      { name: 'Error display', pattern: 'validationErrors' }
    ]

    console.log('\n🔧 Upload Form Components:')
    checks.forEach(check => {
      const hasComponent = uploadContent.includes(check.pattern)
      console.log(`  ${hasComponent ? '✅' : '❌'} ${check.name}`)
    })

  } else {
    console.log('❌ Content upload form not found')
  }
} catch (error) {
  console.log('❌ Error checking upload form:', error.message)
}

// Test 6: Check Contract ABIs
console.log('\n📋 TEST 6: Contract ABIs')
console.log('========================')

try {
  const abiPath = path.join(process.cwd(), 'src/lib/contracts/abis')
  if (fs.existsSync(abiPath)) {
    console.log('✅ ABI directory exists')

    const abiFiles = fs.readdirSync(abiPath)
    const expectedAbis = [
      'content-registry.ts',
      'creator-registry.ts',
      'pay-per-view.ts',
      'subscription-manager.ts'
    ]

    console.log('\n🔧 Contract ABIs:')
    expectedAbis.forEach(abiFile => {
      const exists = abiFiles.includes(abiFile)
      console.log(`  ${exists ? '✅' : '❌'} ${abiFile}`)
    })

  } else {
    console.log('❌ ABI directory not found')
  }
} catch (error) {
  console.log('❌ Error checking contract ABIs:', error.message)
}

// Recommendations
console.log('\n📋 RECOMMENDATIONS FOR DEBUGGING')
console.log('==================================')

console.log('\n🔍 Potential Transaction Failure Points:')
console.log('1. Wallet Connection Issues:')
console.log('   - Check if wallet is properly connected to Base Mainnet')
console.log('   - Verify wallet has sufficient ETH for gas fees')
console.log('   - Check if wallet supports the Base network')

console.log('\n2. Contract Configuration Issues:')
console.log('   - Verify contract addresses are correct for Base Mainnet')
console.log('   - Check if contracts are actually deployed on mainnet')
console.log('   - Verify ABI matches deployed contract')

console.log('\n3. Network Configuration Issues:')
console.log('   - Check Base mainnet RPC endpoint connectivity')
console.log('   - Verify network gas prices and limits')
console.log('   - Check for network congestion on mainnet')

console.log('\n4. Content Validation Issues:')
console.log('   - Verify IPFS hash format is correct')
console.log('   - Check content parameters meet contract requirements')
console.log('   - Validate price and tag constraints')

console.log('\n🔧 Next Steps:')
console.log('1. Test with a simple transaction (like creator registration first)')
console.log('2. Use browser developer tools to inspect transaction requests')
console.log('3. Check wallet transaction history for failed transactions')
console.log('4. Verify contract deployment on Base mainnet explorer (basescan.org)')
console.log('5. Test RPC connectivity with the RPC health check page')
console.log('6. Use the retry mechanism if transactions fail')

console.log('\n✨ This debug script provides a comprehensive overview of your publishing setup.')
console.log('   Use the findings above to systematically identify and fix transaction issues.')

#!/usr/bin/env node

/**
 * Wallet Synchronization Fix Script
 *
 * This script helps identify and fix components that are not properly
 * synchronized with the unified Privy wallet connection state.
 */

const fs = require('fs');
const path = require('path');

// Files to prioritize fixing (most critical user-facing components)
const PRIORITY_FILES = [
  'src/app/upload/page.tsx',
  'src/app/browse/page.tsx',
  'src/app/creator/[address]/page.tsx',
  'src/app/content/[id]/page.tsx',
  'src/components/layout/AppLayout.tsx',
  'src/components/web3/WalletConnect.tsx',
  'src/components/content/ContentPurchase.tsx',
  'src/components/purchase/UnifiedPurchaseFlow.tsx',
  'src/components/content/ContentDiscoveryInterface.tsx'
];

console.log('🔍 Wallet Synchronization Audit');
console.log('================================\n');

// Check each priority file
PRIORITY_FILES.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');

    const issues = [];

    // Check for problematic patterns
    if (content.includes('useAccount') && !content.includes('useWalletConnectionUI')) {
      issues.push('❌ Uses useAccount directly (should use useWalletConnectionUI)');
    }

    if (content.includes('isConnected') && !content.includes('walletUI.isConnected')) {
      issues.push('❌ Uses isConnected from useAccount (should use walletUI.isConnected)');
    }

    if (content.includes('useWalletConnect') && !content.includes('useWalletConnectionUI')) {
      issues.push('❌ Uses old useWalletConnect hook (should use useWalletConnectionUI)');
    }

    if (content.includes('login()') && !content.includes('walletUI.connect()')) {
      issues.push('❌ Uses login() from old hook (should use walletUI.connect())');
    }

    if (issues.length > 0) {
      console.log(`📁 ${filePath}`);
      issues.forEach(issue => console.log(`   ${issue}`));
      console.log('');
    } else {
      console.log(`✅ ${filePath} - OK`);
    }
  } else {
    console.log(`⚠️  ${filePath} - File not found`);
  }
});

console.log('\n🎯 Next Steps:');
console.log('1. Fix the priority files listed above');
console.log('2. Test wallet connect/disconnect flow');
console.log('3. Verify all components respond to state changes');
console.log('4. Run integration tests');

console.log('\n🔧 Common Fixes:');
console.log('- Replace: useAccount() → useWalletConnectionUI()');
console.log('- Replace: isConnected → walletUI.isConnected');
console.log('- Replace: address → walletUI.address');
console.log('- Replace: login() → walletUI.connect()');
console.log('- Replace: useWalletConnect → useWalletConnectionUI');

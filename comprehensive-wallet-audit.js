#!/usr/bin/env node

/**
 * Comprehensive Wallet Synchronization Audit
 *
 * This script provides a detailed analysis of all files that need wallet synchronization fixes.
 */

const fs = require('fs');
const path = require('path');

// Categories of files to prioritize
const CRITICAL_PAGES = [
  'src/app/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/upload/page.tsx',
  'src/app/browse/page.tsx',
  'src/app/creator/[address]/page.tsx',
  'src/app/content/[id]/page.tsx',
  'src/app/purchase/confirm/[contentId]/page.tsx'
];

const CORE_COMPONENTS = [
  'src/components/layout/AppLayout.tsx',
  'src/components/web3/WalletConnect.tsx',
  'src/components/purchase/UnifiedPurchaseFlow.tsx',
  'src/components/content/ContentDiscoveryInterface.tsx',
  'src/components/content/ContentPurchase.tsx'
];

const HOOKS_NEEDING_FIXES = [
  'src/hooks/business/miniapp-auth.ts',
  'src/hooks/web3/usePaymentFlowOrchestrator.ts',
  'src/hooks/web3/useMiniAppWalletUI.ts',
  'src/hooks/web3/useWalletConnect.ts'
];

function analyzeFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    return { status: 'missing', issues: [] };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const issues = [];

  // Check for problematic patterns
  if (content.includes('useAccount') && !content.includes('useWalletConnectionUI')) {
    issues.push('❌ Uses useAccount directly (should use useWalletConnectionUI)');
  }

  if (content.includes('isConnected') && !content.includes('walletUI.isConnected') && !content.includes('wallet.isConnected')) {
    issues.push('❌ Uses isConnected from useAccount (should use walletUI.isConnected)');
  }

  if (content.includes('useWalletConnect') && !content.includes('useWalletConnectionUI')) {
    issues.push('❌ Uses old useWalletConnect hook (should use useWalletConnectionUI)');
  }

  if (content.includes('login()') && !content.includes('walletUI.connect()') && !content.includes('wallet.connect()')) {
    issues.push('❌ Uses login() from old hook (should use walletUI.connect())');
  }

  if (content.includes('logout()') && !content.includes('walletUI.disconnect()') && !content.includes('wallet.disconnect()')) {
    issues.push('❌ Uses logout() from old hook (should use walletUI.disconnect())');
  }

  if (issues.length === 0) {
    return { status: 'fixed', issues: [] };
  }

  return { status: 'needs_fix', issues };
}

console.log('🔍 Comprehensive Wallet Synchronization Audit');
console.log('==============================================\n');

// Analyze critical pages
console.log('📄 CRITICAL PAGES:');
CRITICAL_PAGES.forEach(filePath => {
  const result = analyzeFile(filePath);
  if (result.status === 'missing') {
    console.log(`⚠️  ${filePath} - File not found`);
  } else if (result.status === 'fixed') {
    console.log(`✅ ${filePath} - OK`);
  } else {
    console.log(`❌ ${filePath}`);
    result.issues.forEach(issue => console.log(`   ${issue}`));
  }
});

console.log('\n🏗️  CORE COMPONENTS:');
CORE_COMPONENTS.forEach(filePath => {
  const result = analyzeFile(filePath);
  if (result.status === 'missing') {
    console.log(`⚠️  ${filePath} - File not found`);
  } else if (result.status === 'fixed') {
    console.log(`✅ ${filePath} - OK`);
  } else {
    console.log(`❌ ${filePath}`);
    result.issues.forEach(issue => console.log(`   ${issue}`));
  }
});

console.log('\n🔧 HOOKS NEEDING FIXES:');
HOOKS_NEEDING_FIXES.forEach(filePath => {
  const result = analyzeFile(filePath);
  if (result.status === 'missing') {
    console.log(`⚠️  ${filePath} - File not found`);
  } else if (result.status === 'fixed') {
    console.log(`✅ ${filePath} - OK`);
  } else {
    console.log(`❌ ${filePath}`);
    result.issues.forEach(issue => console.log(`   ${issue}`));
  }
});

// Count total issues across all files
let totalFilesNeedingFix = 0;
let totalIssues = 0;

function countIssuesInDirectory(dirPath) {
  const items = fs.readdirSync(path.join(process.cwd(), dirPath));

  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const fullPath = path.join(process.cwd(), itemPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      countIssuesInDirectory(itemPath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      const result = analyzeFile(itemPath);
      if (result.status === 'needs_fix') {
        totalFilesNeedingFix++;
        totalIssues += result.issues.length;
      }
    }
  });
}

console.log('\n🔍 SCANNING ALL FILES...');
countIssuesInDirectory('src');

console.log('\n📊 SUMMARY:');
console.log(`   Total files needing fixes: ${totalFilesNeedingFix}`);
console.log(`   Total issues found: ${totalIssues}`);

console.log('\n🎯 NEXT STEPS:');
console.log('1. Fix critical pages first (marked with ❌)');
console.log('2. Fix core components');
console.log('3. Fix remaining hooks and utilities');
console.log('4. Test wallet connect/disconnect flow');
console.log('5. Run integration tests');

console.log('\n🔧 COMMON FIX PATTERNS:');
console.log('- Replace: useAccount() → useWalletConnectionUI()');
console.log('- Replace: isConnected → walletUI.isConnected');
console.log('- Replace: address → walletUI.address');
console.log('- Replace: login() → walletUI.connect()');
console.log('- Replace: logout() → walletUI.disconnect()');
console.log('- Replace: useWalletConnect → useWalletConnectionUI');

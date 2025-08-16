#!/usr/bin/env tsx

/**
 * Script to update all useTokenBalances imports to useEnhancedTokenBalances
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'

const filesToUpdate = [
  'src/components/examples/SmartPurchaseIntegrationExamples.tsx',
  'src/components/purchase/SmartPaymentSelector.tsx', 
  'src/components/web3/portfolio/TokenBalanceList.tsx',
  'src/components/web3/portfolio/SwapModal.tsx',
  'src/components/content/SmartContentPurchaseCard.tsx',
  'src/components/web3/ContentPurchaseCard.tsx',
  'src/hooks/web3/usePortfolioAnalytics.ts',
  'src/app/portfolio/page.tsx'
]

const replacements = [
  // Import statements
  { from: /useTokenBalances/g, to: 'useEnhancedTokenBalances' },
  { from: /@\/hooks\/web3\/useTokenBalances/g, to: '@/hooks/web3/useEnhancedTokenBalances' },
  
  // Usage statements  
  { from: /const { ([^}]*) } = useTokenBalances\(\)/g, to: 'const { $1 } = useEnhancedTokenBalances()' },
  { from: /= useTokenBalances\(\)/g, to: '= useEnhancedTokenBalances()' }
]

filesToUpdate.forEach(filePath => {
  try {
    console.log(`Updating ${filePath}...`)
    
    let content = readFileSync(filePath, 'utf8')
    
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to)
    })
    
    writeFileSync(filePath, content, 'utf8')
    console.log(`✅ Updated ${filePath}`)
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log(`⚠️  Skipping ${filePath}: ${errorMessage}`)
  }
})

console.log('🎉 Import updates complete!')
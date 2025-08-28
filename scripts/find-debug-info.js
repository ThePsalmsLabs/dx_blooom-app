#!/usr/bin/env node

/**
 * Debug Information Finder Script
 * 
 * This script helps identify all remaining debug information in the codebase
 * that needs to be isolated to development-only states.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findDebugInfo() {
  log('🔍 Scanning codebase for debug information...', 'cyan');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const results = {
    consoleLog: [],
    consoleWarn: [],
    consoleError: [],
    debugComponents: [],
    environmentChecks: [],
    debugConfigs: []
  };

  // Find all TypeScript and JavaScript files
  function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const files = [];
    
    function scan(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    scan(dir);
    return files;
  }

  const files = findFiles(srcDir);
  log(`Found ${files.length} files to scan`, 'blue');

  // Scan each file
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);
    
    // Find console.log statements
    const consoleLogMatches = content.match(/console\.log\([^)]*\)/g);
    if (consoleLogMatches) {
      results.consoleLog.push({
        file: relativePath,
        matches: consoleLogMatches.length,
        lines: consoleLogMatches.map(match => match.substring(0, 50) + '...')
      });
    }

    // Find console.warn statements
    const consoleWarnMatches = content.match(/console\.warn\([^)]*\)/g);
    if (consoleWarnMatches) {
      results.consoleWarn.push({
        file: relativePath,
        matches: consoleWarnMatches.length,
        lines: consoleWarnMatches.map(match => match.substring(0, 50) + '...')
      });
    }

    // Find console.error statements
    const consoleErrorMatches = content.match(/console\.error\([^)]*\)/g);
    if (consoleErrorMatches) {
      results.consoleError.push({
        file: relativePath,
        matches: consoleErrorMatches.length,
        lines: consoleErrorMatches.map(match => match.substring(0, 50) + '...')
      });
    }

    // Find debug components
    if (content.includes('Debug') || content.includes('debug')) {
      const debugMatches = content.match(/Debug[A-Z][a-zA-Z]*/g);
      if (debugMatches) {
        results.debugComponents.push({
          file: relativePath,
          components: [...new Set(debugMatches)]
        });
      }
    }

    // Find environment checks
    const envChecks = content.match(/process\.env\.NODE_ENV[^)]*development[^)]*/g);
    if (envChecks) {
      results.environmentChecks.push({
        file: relativePath,
        checks: envChecks.length
      });
    }

    // Find debug configurations
    if (content.includes('debugConfig') || content.includes('enableLogging')) {
      results.debugConfigs.push({
        file: relativePath,
        hasDebugConfig: true
      });
    }
  }

  return results;
}

function displayResults(results) {
  log('\n📊 Debug Information Scan Results', 'bold');
  log('=' .repeat(50), 'cyan');

  // Console.log statements
  if (results.consoleLog.length > 0) {
    log('\n🔴 Console.log statements found:', 'red');
    results.consoleLog.forEach(item => {
      log(`  ${item.file} (${item.matches} statements)`, 'yellow');
      item.lines.slice(0, 3).forEach(line => {
        log(`    ${line}`, 'reset');
      });
      if (item.lines.length > 3) {
        log(`    ... and ${item.lines.length - 3} more`, 'reset');
      }
    });
  } else {
    log('\n✅ No console.log statements found!', 'green');
  }

  // Console.warn statements
  if (results.consoleWarn.length > 0) {
    log('\n🟡 Console.warn statements found:', 'yellow');
    results.consoleWarn.forEach(item => {
      log(`  ${item.file} (${item.matches} statements)`, 'yellow');
    });
  } else {
    log('\n✅ No console.warn statements found!', 'green');
  }

  // Console.error statements
  if (results.consoleError.length > 0) {
    log('\n🔴 Console.error statements found:', 'red');
    results.consoleError.forEach(item => {
      log(`  ${item.file} (${item.matches} statements)`, 'yellow');
    });
  } else {
    log('\n✅ No console.error statements found!', 'green');
  }

  // Debug components
  if (results.debugComponents.length > 0) {
    log('\n🔵 Debug components found:', 'blue');
    results.debugComponents.forEach(item => {
      log(`  ${item.file}: ${item.components.join(', ')}`, 'blue');
    });
  } else {
    log('\n✅ No debug components found!', 'green');
  }

  // Environment checks
  if (results.environmentChecks.length > 0) {
    log('\n🟢 Environment checks found:', 'green');
    results.environmentChecks.forEach(item => {
      log(`  ${item.file} (${item.checks} checks)`, 'green');
    });
  } else {
    log('\n⚠️  No environment checks found!', 'yellow');
  }

  // Debug configurations
  if (results.debugConfigs.length > 0) {
    log('\n🟣 Debug configurations found:', 'magenta');
    results.debugConfigs.forEach(item => {
      log(`  ${item.file}`, 'magenta');
    });
  } else {
    log('\n✅ No debug configurations found!', 'green');
  }

  // Summary
  const totalConsoleStatements = 
    results.consoleLog.reduce((sum, item) => sum + item.matches, 0) +
    results.consoleWarn.reduce((sum, item) => sum + item.matches, 0) +
    results.consoleError.reduce((sum, item) => sum + item.matches, 0);

  log('\n📈 Summary:', 'bold');
  log(`  Total console statements: ${totalConsoleStatements}`, 'cyan');
  log(`  Files with debug components: ${results.debugComponents.length}`, 'cyan');
  log(`  Files with environment checks: ${results.environmentChecks.length}`, 'cyan');
  log(`  Files with debug configs: ${results.debugConfigs.length}`, 'cyan');

  if (totalConsoleStatements > 0) {
    log('\n⚠️  Action Required:', 'red');
    log('  Some files still contain console statements that should be replaced with the debug utility.', 'red');
    log('  See DEBUG_ISOLATION_GUIDE.md for implementation steps.', 'yellow');
  } else {
    log('\n🎉 All debug information has been properly isolated!', 'green');
  }
}

function generateReport(results) {
  const reportPath = path.join(__dirname, '..', 'debug-scan-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'cyan');
}

// Main execution
try {
  const results = findDebugInfo();
  displayResults(results);
  generateReport(results);
} catch (error) {
  log(`❌ Error scanning codebase: ${error.message}`, 'red');
  process.exit(1);
}

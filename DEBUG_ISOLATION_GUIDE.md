# 🔍 Debug Information Isolation Guide

## **Overview**
This guide provides a systematic approach to isolate all debug information in your codebase to development-only states. The goal is to ensure that no debug information leaks into production builds.

## **✅ Completed Updates**

### **1. Centralized Debug Utility Created**
- **File**: `src/lib/utils/debug.ts`
- **Purpose**: Provides consistent debug logging with environment-based controls
- **Features**:
  - Environment-based logging controls
  - Different log levels (log, warn, error, performance, wallet)
  - Timestamped logging
  - Conditional rendering utilities

### **2. Environment Configuration Updated**
- **File**: `env.template`
- **Added Variables**:
  - `NEXT_PUBLIC_DEBUG=false` - General debug logging
  - `NEXT_PUBLIC_DEBUG_WALLET=false` - Wallet-specific debugging
  - `NEXT_PUBLIC_DEBUG_PERFORMANCE=false` - Performance debugging

### **3. Payment Orchestrator Updated**
- **File**: `src/hooks/web3/usePaymentFlowOrchestrator.ts`
- **Changes**:
  - Replaced all `console.log` with `debug.log`
  - Replaced all `console.warn` with `debug.warn`
  - Replaced all `console.error` with `debug.error`
  - Updated debug configuration to use environment variables

### **4. Purchase Card Updated**
- **File**: `src/components/content/OrchestratedContentPurchaseCard.tsx`
- **Changes**:
  - Replaced all console logging with debug utility
  - Updated debug configuration
  - Added debug condition hook for UI elements

## **🔄 Remaining Files to Update**

### **High Priority Files (Most Debug Information)**

#### **1. Web3Provider.tsx**
```typescript
// Current: Direct console.log usage
console.log('🔍 Privy State Debug:', { ... })

// Should be:
debug.wallet('Privy State Debug:', { ... })
```

#### **2. MiniAppProvider.tsx**
```typescript
// Current: Direct console.log usage
console.log('🚀 Initializing MiniApp SDK...')

// Should be:
debug.log('Initializing MiniApp SDK...')
```

#### **3. App Layout Files**
- `src/app/layout.tsx`
- `src/app/mini/layout.tsx`
- `src/app/miniapp/MiniAppLayout.tsx`

#### **4. API Routes**
- `src/app/api/health/route.ts`
- `src/app/api/ipfs/upload/route.ts`
- `src/app/api/protected/content/[id]/route.ts`

### **Medium Priority Files**

#### **5. Hook Files**
- `src/hooks/miniapp/useAppNavigation.ts`
- `src/hooks/miniapp/integration.ts`
- `src/hooks/useSocialCommerceAnalytics.ts`

#### **6. Component Files**
- `src/components/providers/MiniKitProvider.tsx`
- `src/components/errors/MiniAppErrorBoundary.tsx`
- `src/components/debug/PerformanceMonitor.tsx`

### **Low Priority Files**

#### **7. Utility Files**
- `src/lib/utils/zora-social.ts`
- `src/lib/utils/bigint-serializer.ts`
- `src/lib/services/zora-integration.ts`

#### **8. Script Files (Development Only)**
- `scripts/diagnose-rpc.ts`
- `scripts/check-rpc-health.ts`
- `scripts/validate-rpc-config.ts`

## **🛠️ Implementation Steps**

### **Step 1: Import Debug Utility**
Add to each file that needs debug isolation:
```typescript
import { debug, createDebugLogger, useDebugCondition } from '@/lib/utils/debug'
```

### **Step 2: Replace Console Statements**
Replace console statements with appropriate debug methods:

```typescript
// Before
console.log('Debug message:', data)
console.warn('Warning message:', data)
console.error('Error message:', error)

// After
debug.log('Debug message:', data)
debug.warn('Warning message:', data)
debug.error('Error message:', error)
```

### **Step 3: Update Debug Configurations**
Replace hardcoded debug configurations:
```typescript
// Before
debugConfig: {
  enableLogging: process.env.NODE_ENV === 'development'
}

// After
debugConfig: {
  enableLogging: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEBUG === 'true'
}
```

### **Step 4: Update UI Debug Elements**
Replace environment checks in JSX:
```typescript
// Before
{process.env.NODE_ENV === 'development' && (
  <DebugPanel />
)}

// After
{useDebugCondition() && (
  <DebugPanel />
)}
```

## **🎯 Debug Categories**

### **1. General Debug Logging**
- **Environment Variable**: `NEXT_PUBLIC_DEBUG`
- **Use Case**: General application debugging
- **Method**: `debug.log()`

### **2. Wallet Debug Logging**
- **Environment Variable**: `NEXT_PUBLIC_DEBUG_WALLET`
- **Use Case**: Wallet connection and transaction debugging
- **Method**: `debug.wallet()`

### **3. Performance Debug Logging**
- **Environment Variable**: `NEXT_PUBLIC_DEBUG_PERFORMANCE`
- **Use Case**: Performance metrics and timing
- **Method**: `debug.performance()`

### **4. Error Logging**
- **Always Active**: Yes (with different detail levels)
- **Use Case**: Critical errors that need attention
- **Method**: `debug.error()`

## **🔧 Environment Setup**

### **Development Environment**
```bash
# .env.local
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_DEBUG_WALLET=true
NEXT_PUBLIC_DEBUG_PERFORMANCE=true
```

### **Production Environment**
```bash
# .env.production
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_DEBUG_WALLET=false
NEXT_PUBLIC_DEBUG_PERFORMANCE=false
```

## **📋 Checklist for Each File**

- [ ] Import debug utility
- [ ] Replace console.log with debug.log
- [ ] Replace console.warn with debug.warn
- [ ] Replace console.error with debug.error
- [ ] Update debug configurations
- [ ] Update UI debug conditions
- [ ] Test in development mode
- [ ] Verify no debug output in production

## **🚀 Benefits**

1. **Production Clean**: No debug information in production builds
2. **Configurable**: Different debug levels for different needs
3. **Consistent**: Standardized logging format across the application
4. **Performance**: Debug code is eliminated in production builds
5. **Maintainable**: Centralized debug configuration

## **⚠️ Important Notes**

1. **Error Logging**: Critical errors should still be logged in production, but with reduced detail
2. **Scripts**: Development scripts can keep their console.log statements as they're not part of the production build
3. **Testing**: Always test both development and production builds to ensure debug isolation works correctly
4. **Environment Variables**: Make sure to set up environment variables in your deployment platform

## **🔍 Verification Commands**

```bash
# Test development build with debug enabled
NEXT_PUBLIC_DEBUG=true npm run dev

# Test production build (should have no debug output)
npm run build
npm start

# Check for any remaining console.log statements
grep -r "console\.log" src/ --exclude-dir=node_modules
```

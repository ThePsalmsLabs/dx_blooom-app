# Enhanced Signature Polling Hook Alignment

## Overview

This document explains how the enhanced `useIntelligentSignaturePolling` hook builds upon the basic `useSignaturePolling` hook and the alignment fixes implemented in the `usePaymentIntentFlow` hook.

## Enhanced Features Built Upon Basic Version

### **Contract Investigation & Real Function Usage**
The enhanced hook is built based on actual contract analysis of `CommerceProtocolIntegration.sol`, not assumptions:

**Key Contract Functions Identified:**
- `intentHashes(bytes16)` - Returns the hash that needs to be signed for the intent
- `intentReadyForExecution(bytes16)` - Returns whether the intent is ready for execution  
- `hasSignature(bytes16)` - Returns whether a signature has been provided for the intent
- `hasActiveIntent(bytes16)` - Returns whether the intent is still active (not processed)
- `getPaymentContext(bytes16)` - Returns complete payment context including user, creator, amounts, etc.

**Why This Matters:**
- **No Assumptions**: All function calls are based on actual contract code analysis
- **Real Integration**: Uses the exact functions that exist in the deployed contract
- **Proper Error Handling**: Understands the actual contract state and error conditions
- **Production Ready**: Built for the real contract, not a theoretical interface

### 1. **Backend Health Monitoring Integration**
- **Basic**: Simple retry logic with fixed intervals
- **Enhanced**: Integrates with `useBackendHealthMonitor` for intelligent retry patterns
- **Benefits**: Health-aware polling that adapts to backend conditions

### 2. **Advanced State Management**
- **Basic**: `SignaturePollingState` with basic fields
- **Enhanced**: `IntelligentSignaturePollingState` with:
  - Backend health context (`backendHealth`)
  - Adaptive retry delays (`nextRetryDelay`)
  - Recovery mechanisms (`status: 'recovering'`)
  - Comprehensive error classification

### 3. **Intelligent Retry Logic**
- **Basic**: Fixed or exponential backoff intervals
- **Enhanced**: Adaptive intervals based on real-time backend health metrics
- **Formula**: `getNextPollingInterval()` considers backend status (healthy/degraded/recovering)

### 4. **Fallback Strategies**
- **Basic**: Single endpoint with basic error handling
- **Enhanced**: Multiple fallback strategies:
  - Extended timeouts for unhealthy backends
  - Alternative endpoint support
  - Automatic recovery mechanisms

### 5. **On-Chain Verification**
- **Basic**: No blockchain verification
- **Enhanced**: 
  - `checkIntentOnChain()` function for direct blockchain state verification
  - `enhancedContractVerification()` for comprehensive contract status checking
  - **Properly leverages imported COMMERCE_PROTOCOL_INTEGRATION_ABI and contract addresses**
  - Direct contract interaction bypassing backend dependencies when needed

## Alignment Fixes Implemented

### **Contract Import Alignment**
The enhanced hook now properly leverages the imported contract artifacts based on actual contract investigation:

```typescript
// BEFORE: Unused imports that weren't utilized
import { COMMERCE_PROTOCOL_INTEGRATION_ABI } from '@/lib/contracts/abis'
import { getContractAddresses } from '@/lib/contracts/config'

// AFTER: Properly utilized imports for direct contract interaction
const contractAddresses = getContractAddresses(chainId)

// Direct contract calls using imported ABI and addresses
// Based on actual contract analysis, not assumptions:
const intentHash = await publicClient.readContract({
  address: contractAddresses.COMMERCE_INTEGRATION,
  abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
  functionName: 'intentHashes',           // Returns hash to be signed
  args: [intentId]
})

const isReady = await publicClient.readContract({
  address: contractAddresses.COMMERCE_INTEGRATION,
  abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
  functionName: 'intentReadyForExecution', // Returns execution readiness
  args: [intentId]
})

const hasSignature = await publicClient.readContract({
  address: contractAddresses.COMMERCE_INTEGRATION,
  abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
  functionName: 'hasSignature',           // Returns signature status
  args: [intentId]
})

const isActive = await publicClient.readContract({
  address: contractAddresses.COMMERCE_INTEGRATION,
  abi: COMMERCE_PROTOCOL_INTEGRATION_ABI,
  functionName: 'hasActiveIntent',        // Returns active status
  args: [intentId]
})
```

**Benefits of Proper Import Usage:**
- **Direct Contract Verification**: Bypasses backend dependencies when needed
- **Health Monitoring**: Provides fallback verification during backend issues
- **Recovery Mechanisms**: Enables on-chain status checking for failed operations
- **Performance**: Reduces dependency on potentially slow backend services
- **Contract Accuracy**: Based on actual contract analysis, not assumptions

### 1. **Import Updates**
```typescript
// BEFORE (Basic):
import { 
  useSignaturePolling, 
  SignatureResponse, 
  SignaturePollingError 
} from '@/hooks/web3/useSignaturePolling'

// AFTER (Enhanced):
import { 
  useIntelligentSignaturePolling, 
  IntelligentSignatureResponse, 
  IntelligentSignaturePollingError 
} from '@/hooks/web3/useIntelligentSignaturePolling'
```

### 2. **Type Interface Updates**
```typescript
// Enhanced signature data interface
readonly signatureData: {
  readonly signature: `0x${string}` | null
  readonly isReady: boolean
  readonly receivedAt: number | null
  readonly intentId: `0x${string}` | null  // Added field
}
```

### 3. **Configuration Alignment**
```typescript
// Enhanced configuration with health monitoring
readonly signaturePollingConfig?: {
  readonly maxAttempts?: number
  readonly baseInterval?: number
  readonly useAdaptiveIntervals?: boolean      // New
  readonly enableLogging?: boolean             // Renamed
  readonly fallbackStrategies?: {             // New
    readonly enableExtendedTimeout?: boolean
    readonly enableAlternativeEndpoint?: boolean
    readonly alternativeEndpoint?: string
  }
}
```

### 4. **Enhanced Error Handling**
```typescript
// Intelligent error mapping
if (error instanceof IntelligentSignaturePollingError) {
  let flowErrorCode: PaymentIntentFlowError['code'] = 'SIGNATURE_POLLING_FAILED'
  
  switch (error.code) {
    case 'BACKEND_UNAVAILABLE':
      flowErrorCode = 'SIGNATURE_POLLING_FAILED'
      break
    case 'TIMEOUT':
      flowErrorCode = 'SIGNATURE_POLLING_FAILED'
      break
    case 'INVALID_INTENT':
      flowErrorCode = 'INTENT_EXTRACTION_FAILED'
      break
    default:
      flowErrorCode = 'SIGNATURE_POLLING_FAILED'
  }
  
  handleFlowError(error, 'waiting_signature', flowErrorCode)
}
```

### 5. **Health Monitoring Integration**
```typescript
// Enhanced: Check backend health before polling
if (!signaturePolling.state.backendHealth.isHealthy) {
  if (finalConfig.enableDebugLogging) {
    console.log('⚠️ Backend health check failed, attempting recovery...')
  }
  
  // Try to recover backend health
  const isHealthy = await signaturePolling.checkBackendHealth()
  if (!isHealthy) {
    throw new IntelligentSignaturePollingError(
      'Backend is unavailable and recovery failed',
      'BACKEND_UNAVAILABLE',
      intentId
    )
  }
}
```

### 6. **Enhanced Retry Logic**
```typescript
// Enhanced retry with health check and on-chain verification
const retryCurrentStep = useCallback(async () => {
  // Check if we can verify the intent on-chain first
  if (state.intentData.intentId) {
    const onChainStatus = await signaturePolling.checkIntentOnChain(state.intentData.intentId)
    
    // If intent is already ready on-chain, skip to execution
    if (onChainStatus.isReady) {
      // Continue with execution
    }
  }
  
  // Standard retry from the failed step
  await executeETHPayment(currentRequestRef.current)
}, [/* dependencies */])
```

### 7. **Advanced Progress Tracking**
```typescript
// Enhanced time estimation with health metrics
case 'waiting_signature':
  const baseTime = Math.max(5, 30 - signaturePolling.state.attempt)
  const healthMultiplier = signaturePolling.state.backendHealth.isHealthy ? 1 : 1.5
  const adaptiveInterval = signaturePolling.getNextPollingInterval() / 1000
  return Math.round(baseTime * healthMultiplier + adaptiveInterval)
```

### 8. **Exposed Enhanced Capabilities**
```typescript
// Enhanced signature polling capabilities exposed to consumers
readonly signaturePolling: {
  readonly checkBackendHealth: () => Promise<boolean>
  readonly getNextPollingInterval: () => number
  readonly checkIntentOnChain: (intentId: `0x${string}`) => Promise<{
    readonly isCreated: boolean
    readonly isSigned: boolean
    readonly isReady: boolean
    readonly intentHash: `0x${string}` | null
  }>
  readonly enhancedContractVerification: (intentId: `0x${string}`) => Promise<{
    readonly intentHash: `0x${string}` | null
    readonly isReady: boolean
    readonly paymentDetails: any
    readonly verificationTimestamp: number
  } | null>
}
```

## Benefits of Enhanced Integration

### 1. **Production Readiness**
- Intelligent backend communication
- Automatic recovery mechanisms
- Comprehensive error handling

### 2. **Better User Experience**
- Real-time health status updates
- Adaptive polling intervals
- Clear error messages with recovery options

### 3. **Operational Excellence**
- Backend health monitoring
- Performance metrics tracking
- Fallback strategy support

### 4. **Developer Experience**
- Enhanced debugging capabilities
- On-chain verification tools
- Comprehensive state management

## Usage Examples

### Basic Usage (Enhanced Hook)
```typescript
const { state, pollForSignature } = useIntelligentSignaturePolling({
  maxAttempts: 60,
  useAdaptiveIntervals: true,
  enableLogging: true,
  fallbackStrategies: {
    enableExtendedTimeout: true,
    enableAlternativeEndpoint: true
  }
})
```

### Enhanced Payment Flow
```typescript
const { state, executeETHPayment, signaturePolling } = usePaymentIntentFlow({
  enableDebugLogging: true,
  signaturePollingConfig: {
    useAdaptiveIntervals: true,
    enableLogging: true,
    fallbackStrategies: {
      enableExtendedTimeout: true
    }
  }
})

// Check backend health
const isHealthy = await signaturePolling.checkBackendHealth()

// Verify intent on-chain
const onChainStatus = await signaturePolling.checkIntentOnChain(intentId)

// Get next polling interval
const nextInterval = signaturePolling.getNextPollingInterval()

// Enhanced contract verification using imported ABI and addresses
const contractStatus = await signaturePolling.enhancedContractVerification(intentId)
if (contractStatus?.isReady) {
  console.log('Intent ready on-chain, bypassing backend polling')
}
```

## Migration Guide

### From Basic to Enhanced Hook

1. **Update imports** to use `useIntelligentSignaturePolling`
2. **Update type references** from `SignatureResponse` to `IntelligentSignatureResponse`
3. **Update error handling** to use `IntelligentSignaturePollingError`
4. **Leverage new capabilities** like `checkBackendHealth()` and `checkIntentOnChain()`
5. **Configure fallback strategies** for production resilience

### Configuration Mapping

| Basic Config | Enhanced Config | Notes |
|--------------|-----------------|-------|
| `enableDebugLogging` | `enableLogging` | Renamed for consistency |
| `maxAttempts` | `maxAttempts` | Same functionality |
| `baseInterval` | `baseInterval` | Same functionality |
| N/A | `useAdaptiveIntervals` | New: enables health-based intervals |
| N/A | `fallbackStrategies` | New: enables fallback mechanisms |

## Conclusion

The enhanced signature polling hook provides a production-ready upgrade path from the basic version, offering:

- **Intelligent backend communication** with health monitoring
- **Adaptive retry logic** based on real-time metrics
- **Comprehensive error handling** with recovery mechanisms
- **On-chain verification** capabilities
- **Fallback strategies** for production resilience

The alignment fixes ensure seamless integration between the enhanced hook and the payment flow system, providing a robust foundation for production deployments.

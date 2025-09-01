# Farcaster MiniApp Implementation Guide

## Overview

This guide explains how to properly implement Farcaster MiniApp features in your application, ensuring they work correctly in MiniApp environments while gracefully handling web contexts.

## Problem Analysis

The error you're seeing occurs because:

1. **MiniKit Context Unavailable**: The Farcaster MiniApp SDK (`@farcaster/miniapp-sdk`) only provides context when running inside a Farcaster MiniApp
2. **Improper Detection**: Your code was trying to access `sdk.context` without first confirming you're in a MiniApp environment
3. **Missing Environment Checks**: Farcaster features were being initialized in web contexts where they're not available

## Solution Architecture

### 1. Proper MiniApp Detection

Use the official MiniKit SDK detection method:

```typescript
import { sdk } from '@farcaster/miniapp-sdk'

// First check if you're in MiniApp
const isInMiniApp = await sdk.isInMiniApp()

// Only then access context
if (isInMiniApp) {
  const context = await sdk.context
}
```

### 2. Conditional Rendering Components

Use the provided conditional rendering components to hide Farcaster features in non-MiniApp contexts:

```tsx
import { MiniAppConditional, MiniAppOnly, WebOnly } from '@/components/farcaster/MiniAppConditional'

// Only render in MiniApp
<MiniAppOnly>
  <FarcasterButton />
</MiniAppOnly>

// Render different content based on context
<MiniAppConditional fallback={<WebButton />}>
  <FarcasterButton />
</MiniAppConditional>

// Only render on web
<WebOnly>
  <TwitterButton />
</WebOnly>
```

### 3. Hook Usage with Error Handling

```tsx
import { useFarcasterContext, useIsInMiniApp } from '@/hooks/farcaster/useFarcasterContext'

function MyComponent() {
  const isInMiniApp = useIsInMiniApp()
  const farcasterContext = useFarcasterContext()

  // Handle loading state
  if (isInMiniApp && !farcasterContext) {
    return <div>Loading Farcaster context...</div>
  }

  // Handle non-MiniApp context
  if (!isInMiniApp) {
    return <div>Farcaster features not available</div>
  }

  // Safe to use farcasterContext here
  return <div>Welcome, @{farcasterContext.user.username}!</div>
}
```

## Implementation Steps

### Step 1: Update Environment Detection

The `useIsInMiniApp` hook now properly detects MiniApp environments using multiple methods:

1. **URL Patterns**: `/mini`, `/miniapp`, `?miniApp=true`
2. **Meta Tags**: `fc:frame`, `fc:miniapp`
3. **Iframe Context**: `window.parent !== window`
4. **Referrer Check**: `farcaster` or `warpcast` in referrer
5. **User Agent**: `farcaster` or `warpcast` in user agent
6. **SDK Verification**: Official `sdk.isInMiniApp()` method

### Step 2: Fix Context Extraction

The `useFarcasterContext` hook now:

1. **Checks MiniApp Environment First**: Only attempts SDK initialization in MiniApp contexts
2. **Uses Official Detection**: Calls `sdk.isInMiniApp()` before accessing context
3. **Provides Graceful Fallbacks**: Returns `undefined` when not in MiniApp environment
4. **Handles Timeouts**: Prevents hanging on failed detections

### Step 3: Implement Conditional Rendering

Wrap all Farcaster-specific UI components with conditional rendering:

```tsx
// Bad - causes errors in web context
<FarcasterShareButton />

// Good - only renders in MiniApp
<MiniAppOnly>
  <FarcasterShareButton />
</MiniAppOnly>

// Better - provides fallback for web
<MiniAppConditional fallback={<TwitterShareButton />}>
  <FarcasterShareButton />
</MiniAppConditional>
```

## Available Components

### Conditional Rendering Components

- **`MiniAppConditional`**: Renders children in MiniApp, fallback otherwise
- **`MiniAppOnly`**: Only renders children in MiniApp context
- **`WebOnly`**: Only renders children in web context
- **`FarcasterFeature`**: Semantic wrapper for Farcaster-specific features

### Hooks

- **`useIsInMiniApp()`**: Returns boolean indicating MiniApp context
- **`useFarcasterContext()`**: Returns Farcaster context or undefined

## Error Prevention

### Common Mistakes to Avoid

1. **Don't access MiniKit context without detection**:
   ```typescript
   // ❌ Bad
   const context = await sdk.context // Error in web context

   // ✅ Good
   const isInMiniApp = await sdk.isInMiniApp()
   if (isInMiniApp) {
     const context = await sdk.context
   }
   ```

2. **Don't render Farcaster UI without conditional checks**:
   ```tsx
   // ❌ Bad
   return <FarcasterButton />

   // ✅ Good
   return (
     <MiniAppConditional fallback={<WebButton />}>
       <FarcasterButton />
     </MiniAppConditional>
   )
   ```

3. **Don't assume MiniKit availability**:
   ```typescript
   // ❌ Bad
   const { sdk } = await import('@farcaster/miniapp-sdk')
   const context = await sdk.context // May not exist

   // ✅ Good
   const { sdk } = await import('@farcaster/miniapp-sdk')
   if (sdk?.isInMiniApp) {
     const isInMiniApp = await sdk.isInMiniApp()
     if (isInMiniApp) {
       const context = await sdk.context
     }
   }
   ```

## Testing

### Testing in Different Environments

1. **Web Context**: Features should be hidden or show fallbacks
2. **MiniApp Context**: Features should work normally
3. **Loading States**: Handle detection delays gracefully
4. **Error States**: Provide meaningful fallbacks

### Debug Information

The updated hooks provide detailed logging:

```typescript
// Check MiniApp detection
const isInMiniApp = useIsInMiniApp()
console.log('MiniApp detected:', isInMiniApp)

// Check Farcaster context
const farcasterContext = useFarcasterContext()
console.log('Farcaster context:', farcasterContext)
```

## Migration Guide

### For Existing Components

1. **Wrap Farcaster UI components** with `MiniAppConditional`
2. **Update hooks usage** to handle `undefined` context
3. **Add fallbacks** for web contexts
4. **Test in both environments**

### Example Migration

```tsx
// Before
function SocialShare() {
  const farcaster = useFarcasterContext()
  return <FarcasterShareButton user={farcaster.user} />
}

// After
function SocialShare() {
  const farcaster = useFarcasterContext()

  return (
    <MiniAppConditional
      fallback={<TwitterShareButton />}
      showLoading={true}
    >
      {farcaster?.user && <FarcasterShareButton user={farcaster.user} />}
    </MiniAppConditional>
  )
}
```

## Conclusion

By implementing proper MiniApp detection and conditional rendering, you can:

1. **Eliminate console errors** in web contexts
2. **Provide better user experience** with appropriate fallbacks
3. **Maintain clean code** with reusable conditional components
4. **Ensure compatibility** across all deployment contexts

The solution provides a robust foundation for building Farcaster MiniApps that work seamlessly in both MiniApp and web environments.
